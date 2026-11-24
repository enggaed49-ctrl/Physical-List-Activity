import { app } from './_app.mjs';

export default function handler(req, res) {
  const parsed = new URL(req.url || '/', 'http://localhost');
  const rewrittenPath = parsed.searchParams.get('__path');
  if (rewrittenPath !== null) {
    parsed.searchParams.delete('__path');
    const qs = parsed.searchParams.toString();
    const normalized = rewrittenPath.replace(/^\/+/, '');
    req.url = `/api/${normalized}${qs ? `?${qs}` : ''}`;
  } else if (req.url && !req.url.startsWith('/api')) {
    req.url = `/api${req.url.startsWith('/') ? req.url : `/${req.url}`}`;
  }
  return app(req, res);
}
