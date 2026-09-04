import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';

// Vite 로컬 개발 서버용 Serverless API 미들웨어 플러그인
function vercelApiPlugin() {
  return {
    name: 'vercel-api-plugin',
    configureServer(server) {
      server.middlewares.use(async (req, res, next) => {
        const parsedUrl = new URL(req.url || '', 'http://localhost:3000');
        if (parsedUrl.pathname === '/api/settings') {
          try {
            // body 파싱 (POST/PUT/DELETE)
            let body = '';
            req.on('data', chunk => {
              body += chunk;
            });
            req.on('end', async () => {
              if (body) {
                try {
                  (req as any).body = JSON.parse(body);
                } catch {
                  (req as any).body = body;
                }
              }
              (req as any).query = Object.fromEntries(parsedUrl.searchParams);

              // res.status, res.json 헬퍼 추가
              (res as any).status = (statusCode: number) => {
                res.statusCode = statusCode;
                return res;
              };
              (res as any).json = (data: any) => {
                res.setHeader('Content-Type', 'application/json');
                res.end(JSON.stringify(data));
                return res;
              };

              const handlerModule = await server.ssrLoadModule('/api/settings.js');
              await handlerModule.default(req, res);
            });
          } catch (err: any) {
            console.error('Local API middleware error:', err);
            res.statusCode = 500;
            res.end(JSON.stringify({ error: err.message }));
          }
        } else {
          next();
        }
      });
    }
  };
}

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '');
  // process.env에도 주입하여 api/settings.js에서 사용 가능하게 함
  process.env.DATABASE_URL = env.DATABASE_URL;

  return {
    plugins: [react(), vercelApiPlugin()],
    server: {
      port: 3000,
      host: true
    }
  };
});
