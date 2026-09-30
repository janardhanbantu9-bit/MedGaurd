import { defineConfig, loadEnv, type Plugin } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const rootDir = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');

/**
 * Serves the serverless handlers in /api during `npm run dev`, so the frontend
 * and backend run together with one command (on Vercel they run as functions).
 */
function devApi(): Plugin {
  return {
    name: 'mediguard-dev-api',
    apply: 'serve',
    configureServer(server) {
      // Server-side secrets (GROQ_API_KEY, ...) come from the root .env file.
      const env = loadEnv('development', rootDir, '');
      for (const [key, value] of Object.entries(env)) {
        if (process.env[key] === undefined) process.env[key] = value;
      }

      server.middlewares.use(async (req: any, res: any, next: () => void) => {
        const match = /^\/api\/([a-z0-9-]+)(?:\?.*)?$/i.exec(req.url ?? '');
        if (!match) return next();

        res.status = (code: number) => {
          res.statusCode = code;
          return res;
        };
        res.json = (body: unknown) => {
          res.setHeader('Content-Type', 'application/json');
          res.end(JSON.stringify(body));
        };

        try {
          const chunks: Buffer[] = [];
          for await (const chunk of req) chunks.push(chunk as Buffer);
          const raw = Buffer.concat(chunks).toString('utf8');
          try {
            req.body = raw ? JSON.parse(raw) : {};
          } catch {
            return res.status(400).json({ error: 'Invalid JSON body' });
          }

          const file = path.join(rootDir, 'api', `${match[1]}.js`);
          const mod = await server.ssrLoadModule(file);
          await mod.default(req, res);
        } catch (error) {
          console.error(error);
          if (!res.headersSent) {
            res.status(500).json({ error: error instanceof Error ? error.message : 'API error' });
          }
        }
      });
    },
  };
}

export default defineConfig({
  plugins: [react(), devApi()],
});
