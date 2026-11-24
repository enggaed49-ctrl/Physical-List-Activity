import express from 'express';
import path from 'path';
import { app } from './serverApp.ts';
import { verifySupabaseConnection } from './db.ts';

const PORT = Number(process.env.PORT) || 3000;

async function startServer() {
  if (process.env.NODE_ENV !== 'production') {
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (_req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  try {
    await verifySupabaseConnection({ log: true });
  } catch (err) {
    console.error('[Supabase Diagnostic] Startup verification failed:', err);
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Physical List Activity server running on http://localhost:${PORT}`);
  });
}

startServer();
