import { Router } from 'express';
import { openApiSpec } from '../lib/openapi';

const router = Router();

router.get('/openapi.json', (_req, res) => {
  res.json(openApiSpec);
});

// Lightweight docs page (no extra deps). For full Swagger UI, add
// swagger-ui-express and mount it here behind the same path.
router.get('/docs', (_req, res) => {
  res.type('html').send(`<!doctype html><html><head><meta charset="utf-8"/>
<title>PL Analytics API docs</title>
<style>body{font-family:system-ui,sans-serif;max-width:820px;margin:40px auto;padding:0 16px}code{background:#f3f4f6;padding:2px 6px;border-radius:6px}</style>
</head><body>
<h1>PL Analytics API</h1>
<p>Versioned base: <code>/api/v1</code> (legacy <code>/api</code> still works, deprecated).</p>
<ul>
<li><a href="/api/openapi.json">OpenAPI JSON</a></li>
<li>Health: <code>GET /health</code> and <code>GET /api/v1/teams?limit=5</code></li>
</ul>
<p>Auth: <code>Authorization: Bearer &lt;api-key&gt;</code>. PRO routes: shots, heatmap, radar.</p>
</body></html>`);
});

export default router;
