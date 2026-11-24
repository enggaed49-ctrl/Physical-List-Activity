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

  // If Vercel's runtime already consumed the request stream and populated req.body,
  // mark req._body so express.json() does not attempt to re-read an ended stream.
  if (req.readableEnded && req.body !== undefined) {
    if (typeof req.body === 'string' && req.body.trim().startsWith('{')) {
      try {
        req.body = JSON.parse(req.body);
      } catch {
        // Let route validation handle malformed body
      }
    }
    req._body = true;
  }

  return app(req, res);
}
