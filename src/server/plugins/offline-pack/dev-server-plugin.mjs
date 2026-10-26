import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const ROOT = path.resolve(__dirname, '../../../../');
const OFFLINE_PACKS_DIR = path.join(ROOT, 'dist', 'offline-packs');

export function offlinePackDevServerPlugin() {
  return {
    name: 'astrolib-offline-pack-dev-server',
    configureServer(server) {
      server.middlewares.use((req, res, next) => {
        const url = req.url || '';
        if (!url.startsWith('/offline-packs/')) {
          return next();
        }

        const cleanPath = url.split('?')[0].replace('/offline-packs/', '');
        const decodedPath = decodeURIComponent(cleanPath);
        const safeFile = path.basename(decodedPath);
        const filePath = path.join(OFFLINE_PACKS_DIR, safeFile);

        if (!fs.existsSync(filePath)) {
          res.statusCode = 404;
          res.setHeader('Content-Type', 'application/json; charset=utf-8');
          res.setHeader('Access-Control-Allow-Origin', '*');
          return res.end(JSON.stringify({
            error: 'Offline pack not found on dev server. Run "npm run build:offline" first.',
            path: safeFile
          }));
        }

        const stat = fs.statSync(filePath);
        res.statusCode = 200;
        res.setHeader('Content-Length', stat.size);
        res.setHeader('Access-Control-Allow-Origin', '*');

        if (safeFile.endsWith('.gz')) {
          res.setHeader('Content-Type', 'application/gzip');
        } else if (safeFile.endsWith('.json')) {
          res.setHeader('Content-Type', 'application/json; charset=utf-8');
        } else {
          res.setHeader('Content-Type', 'application/octet-stream');
        }

        const readStream = fs.createReadStream(filePath);
        readStream.pipe(res);
      });
    }
  };
}

export default offlinePackDevServerPlugin;
