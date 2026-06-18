import express from 'express';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';

dotenv.config();

const __filename = typeof import.meta?.url === 'string' ? fileURLToPath(import.meta.url) : path.join(process.cwd(), 'server/src/index.ts');
const __dirname = path.dirname(__filename);

import productsRouter from './routes/products.js';
import ordersRouter from './routes/orders.js';
import authRouter from './routes/auth.js';
import usersRouter from './routes/users.js';
import reviewsRouter from './routes/reviews.js';
import settingsRouter from './routes/settings.js';
import storageRouter from './routes/storage.js';
import facebookRouter from './routes/facebook.js';
import { supabaseAdmin } from './supabase.js';
import { runAllSeeds } from './services/seed.js';

function getStaticDir(): string {
  if (process.env.STATIC_DIR) return process.env.STATIC_DIR;

  const candidates = [
    path.join(process.cwd(), 'dist'),
    path.join(process.cwd(), 'server', 'dist'),
    path.join(process.cwd(), 'client', 'dist'),
    path.join(process.cwd(), 'server', 'public'),
    path.join(__dirname, '..', 'dist'),
    path.join(__dirname, '..', '..', 'dist'),
    path.join(__dirname, '..', '..', 'client', 'dist'),
    path.join(__dirname, '..', 'public'),
    path.join(__dirname, '..', '..', 'public'),
  ];

  for (const dir of candidates) {
    if (fs.existsSync(path.join(dir, 'index.html'))) return dir;
  }

  return path.join(process.cwd(), 'dist');
}

export const app = express();
app.use(express.json({ limit: '50mb' }));

app.use((_req, res, next) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization, x-user-email');
  if (_req.method === 'OPTIONS') return res.sendStatus(200);
  next();
});

app.use('/api/products', productsRouter);
app.use('/api/orders', ordersRouter);
app.use('/api/auth', authRouter);
app.use('/api/users', usersRouter);
app.use('/api/reviews', reviewsRouter);
app.use('/api/settings', settingsRouter);
app.use('/api/storage', storageRouter);
app.use('/api/facebook', facebookRouter);

const staticDir = getStaticDir();

app.get(['/product/:id', '/producto/:id'], async (req, res, next) => {
  try {
    const { id } = req.params;
    const { data: product } = await supabaseAdmin.from('products').select('*').eq('id', id).single();

    if (product) {
      const title = `${product.name} - Treck Motors Cuba`;
      const description = `${product.description} | Precio: $${product.price.toLocaleString()} MLC / USD. ¡Garantía de rendimiento original!`;
      const image = product.image;
      const appUrl = process.env.APP_URL || '';

      const meta = `
    <meta name="description" content="${description}" />
    <meta property="og:title" content="${title}" />
    <meta property="og:description" content="${description}" />
    <meta property="og:image" content="${image}" />
    <meta property="og:url" content="${appUrl}/producto/${id}" />
    <meta property="og:type" content="website" />
    <meta property="og:site_name" content="Treck Motors Cuba" />
    <meta name="twitter:card" content="summary_large_image" />
    <meta name="twitter:title" content="${title}" />
    <meta name="twitter:description" content="${description}" />
    <meta name="twitter:image" content="${image}" />
      `;

      const indexPath = path.join(staticDir, 'index.html');
      if (fs.existsSync(indexPath)) {
        let html = fs.readFileSync(indexPath, 'utf-8');
        html = html.replace(/<title>.*?<\/title>/, `<title>${title}</title>`);
        html = html.replace('</head>', `${meta}\n</head>`);
        return res.send(html);
      }

      return res.send(`<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>${title}</title>
  ${meta}
  <script>location.href="/"</script>
</head>
<body>
  <p>Redirigiendo a Treck Motors Cuba...</p>
</body>
</html>`);
    }
  } catch (err) {
    console.error('[SEO Service Failure]:', err);
  }
  next();
});

if (!process.env.VERCEL && fs.existsSync(staticDir)) {
  app.use(express.static(staticDir));
  app.get('*', (_req, res) => {
    res.sendFile(path.join(staticDir, 'index.html'));
  });
}

export async function startServer() {
  const PORT = parseInt(process.env.PORT || '3000', 10);

  await runAllSeeds();

  if (process.env.NODE_ENV !== 'production') {
    try {
      // @ts-expect-error - vite no está en server deps, solo se usa en dev
      const { createServer: createViteServer } = await import('vite');
      const vite = await createViteServer({
        server: { middlewareMode: true },
        appType: 'spa',
      });
      app.use(vite.middlewares);

      app.get('*', async (_req, res) => {
        const template = fs.readFileSync(path.join(process.cwd(), 'index.html'), 'utf-8');
        res.status(200).set({ 'Content-Type': 'text/html' }).end(template);
      });
    } catch {
      // Vite no disponible en producción
    }
  }

  app.listen(PORT, '0.0.0.0', () => {
    const appUrl = process.env.APP_URL || `http://127.0.0.1:${PORT}`;
    console.log(`[Treck Motors Server] Running at ${appUrl}`);
  });
}

if (!process.env.VERCEL) {
  startServer();
}
