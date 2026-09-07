// api/settings.js — Vercel Serverless Function for Neon PostgreSQL
import { neon } from '@neondatabase/serverless';

export default async function handler(req, res) {
  // CORS 설정
  res.setHeader('Access-Control-Allow-Credentials', 'true');
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,PATCH,DELETE,POST,PUT');
  res.setHeader(
    'Access-Control-Allow-Headers',
    'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version'
  );

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  let databaseUrl = process.env.DATABASE_URL;
  if (!databaseUrl) {
    return res.status(500).json({ error: 'DATABASE_URL is not configured in environment variables' });
  }

  // 줄바꿈, 다중 행, 공백, 따옴표 등 실수로 중복 붙여넣기된 경우 방어
  databaseUrl = databaseUrl.trim().split(/[\r\n]+/)[0].trim().replace(/^['"]|['"]$/g, '');

  const sql = neon(databaseUrl);

  try {
    // ─── 테이블 존재 보장 (최초 1회 캐싱) ───
    if (!globalThis.__admin_settings_table_ready) {
      await sql`
        CREATE TABLE IF NOT EXISTS admin_settings (
          key TEXT PRIMARY KEY,
          value JSONB NOT NULL DEFAULT '[]'::jsonb,
          updated_at TIMESTAMPTZ DEFAULT NOW()
        )
      `;
      globalThis.__admin_settings_table_ready = true;
    }

    // ─── GET: 모든 설정 또는 특정 키 조회 ───
    if (req.method === 'GET') {
      // Vercel Edge CDN 캐싱: 60초 동안 CDN 캐시 사용 (수백 명 동시 접속 시에도 Neon DB 쿼리 99% 차단)
      // fresh=true 요청 시에만 캐시를 우회하여 Neon DB에서 직접 조회
      const isFresh = req.query?.fresh === 'true';
      if (!isFresh) {
        res.setHeader('Cache-Control', 's-maxage=60, stale-while-revalidate=300');
      } else {
        res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
      }

      const { key } = req.query || {};
      if (key) {
        const rows = await sql`SELECT value, updated_at FROM admin_settings WHERE key = ${key}`;
        if (rows.length === 0) {
          return res.status(200).json({ value: null });
        }
        return res.status(200).json({ value: rows[0].value, updated_at: rows[0].updated_at });
      }

      const rows = await sql`SELECT key, value, updated_at FROM admin_settings`;
      const result = {};
      let latestUpdated = null;
      for (const row of rows) {
        result[row.key] = row.value;
        if (!latestUpdated || new Date(row.updated_at) > new Date(latestUpdated)) {
          latestUpdated = row.updated_at;
        }
      }
      return res.status(200).json({
        settings: result,
        updated_at: latestUpdated,
      });
    }

    // ─── PUT / POST: 설정값 저장 (Upsert) ───
    if (req.method === 'PUT' || req.method === 'POST') {
      // Vercel / Express body 호환
      let body = req.body;
      if (typeof body === 'string') {
        try {
          body = JSON.parse(body);
        } catch (e) {
          // ignore
        }
      }

      const key = req.query?.key || body?.key;
      const value = body?.value;

      if (!key) {
        return res.status(400).json({ error: 'Missing key parameter' });
      }

      await sql`
        INSERT INTO admin_settings (key, value, updated_at)
        VALUES (${key}, ${JSON.stringify(value)}::jsonb, NOW())
        ON CONFLICT (key) DO UPDATE SET
          value = ${JSON.stringify(value)}::jsonb,
          updated_at = NOW()
      `;

      return res.status(200).json({ success: true, key });
    }

    // ─── DELETE: 특정 키 삭제 ───
    if (req.method === 'DELETE') {
      const key = req.query?.key || req.body?.key;
      if (!key) {
        return res.status(400).json({ error: 'Missing key parameter' });
      }

      await sql`DELETE FROM admin_settings WHERE key = ${key}`;
      return res.status(200).json({ success: true, key });
    }

    return res.status(405).json({ error: 'Method Not Allowed' });
  } catch (error) {
    console.error('API Error:', error);
    return res.status(500).json({ error: error.message || 'Internal Server Error' });
  }
}
