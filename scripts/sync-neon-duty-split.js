import { neon } from '@neondatabase/serverless';
import dotenv from 'dotenv';
import fs from 'fs';

dotenv.config();

// src/data/initialData.ts의 initialDutyRoles 및 initialSchedules를 정규식/텍스트로 읽어오거나 정의
const initialDutyRoles = [
  '내과 1 (주간)',
  '내과 2 (주간)',
  '심장내과',
  '호흡기내과',
  '내과당직 1',
  '내과당직 2',
  '비내과 1',
  '비내과 2',
  '비내과 3',
  '연차'
];

import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// src/data/initialData.ts 에서 initialSchedules 객체 추출
const initialDataPath = path.resolve(__dirname, '../src/data/initialData.ts');
const fileContent = fs.readFileSync(initialDataPath, 'utf-8');

const match = fileContent.match(/export const initialSchedules:\s*DateScheduleMap\s*=\s*(\{[\s\S]*?\n\};)/);
if (!match) {
  console.error('Failed to find initialSchedules in initialData.ts');
  process.exit(1);
}

// ROLES 상수 대체
let objStr = match[1]
  .replace(/\[ROLES\.IM_1\]/g, '"내과 1"')
  .replace(/\[ROLES\.IM_2\]/g, '"내과 2"')
  .replace(/\[ROLES\.IM_DUTY_1\]/g, '"내과당직 1"')
  .replace(/\[ROLES\.IM_DUTY_2\]/g, '"내과당직 2"')
  .replace(/\[ROLES\.NON_IM_1\]/g, '"비내과 1"')
  .replace(/\[ROLES\.NON_IM_2\]/g, '"비내과 2"')
  .replace(/\[ROLES\.NON_IM_3\]/g, '"비내과 3"');

// 함수를 통해 안전하게 객체 생성
const getSchedules = new Function(`return (${objStr.replace(/;\s*$/, '')})`);
const initialSchedules = getSchedules();

const databaseUrl = process.env.DATABASE_URL;
if (!databaseUrl) {
  console.error('DATABASE_URL is missing in .env');
  process.exit(1);
}

const sql = neon(databaseUrl.trim().split(/[\r\n]+/)[0].trim().replace(/^['"]|['"]$/g, ''));

async function run() {
  console.log('Connecting to Neon DB...');

  // 1. Check current duty_roles and schedules
  const rolesRow = await sql`SELECT value FROM admin_settings WHERE key = 'duty_roles'`;
  console.log('Current DB duty_roles:', rolesRow[0]?.value);

  const schedRow = await sql`SELECT value FROM admin_settings WHERE key = 'schedules'`;
  const dbSchedules = schedRow[0]?.value || {};
  console.log('DB schedules count:', Object.keys(dbSchedules).length);

  // 2. Update duty_roles with initialDutyRoles
  console.log('Updating duty_roles to:', initialDutyRoles);
  await sql`
    INSERT INTO admin_settings (key, value, updated_at)
    VALUES ('duty_roles', ${JSON.stringify(initialDutyRoles)}::jsonb, NOW())
    ON CONFLICT (key) DO UPDATE
    SET value = EXCLUDED.value, updated_at = NOW()
  `;

  // 3. Merge initialSchedules with existing schedules in DB
  // For each date in initialSchedules, merge with any custom dates in DB
  const mergedSchedules = { ...dbSchedules };
  for (const [dateKey, dayObj] of Object.entries(initialSchedules)) {
    mergedSchedules[dateKey] = {
      ...(mergedSchedules[dateKey] || {}),
      ...dayObj
    };
  }

  console.log('Updating schedules with day/duty split data...');
  await sql`
    INSERT INTO admin_settings (key, value, updated_at)
    VALUES ('schedules', ${JSON.stringify(mergedSchedules)}::jsonb, NOW())
    ON CONFLICT (key) DO UPDATE
    SET value = EXCLUDED.value, updated_at = NOW()
  `;

  console.log('Successfully synced Neon DB with separated day/duty schedule roles!');
}

run().catch(err => {
  console.error('Migration failed:', err);
  process.exit(1);
});
