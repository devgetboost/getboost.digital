#!/usr/bin/env node
/**
 * R21.1B — SPA rewrite verification (B5 / B7).
 *
 * The deep-link fallback depends on host configuration ("serve 404.html for
 * unknown paths") that cannot be checked from the repository. What CAN be
 * checked is the mechanism this repository owns: a static host emulation that
 * reproduces the real serving behaviour, driven through every route class the
 * release must support.
 *
 * Pass means: the mechanism is correct, so a host that serves 404.html as
 * configured will deep-link correctly. It does NOT prove the host is
 * configured that way — the operator must run the same probe against staging
 * and production (see the printed URLs).
 *
 * Usage: node scripts/verify-spa-rewrite.mjs [--port 4321] [--base http://localhost:4321]
 */
import { createServer, request as httpRequest } from 'node:http';
import { request as httpsRequest } from 'node:https';
import { readFile, stat } from 'node:fs/promises';
import { join, extname } from 'node:path';
import { existsSync } from 'node:fs';

const ROOT = process.cwd();
const DIST = join(ROOT, 'dist');
const arg = (name, fallback) => {
  const index = process.argv.indexOf(`--${name}`);
  return index !== -1 && process.argv[index + 1] ? process.argv[index + 1] : fallback;
};
const PORT = Number(arg('port', 4321));

const MIME = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.mjs': 'text/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.xml': 'application/xml; charset=utf-8',
  '.txt': 'text/plain; charset=utf-8',
  '.svg': 'image/svg+xml',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.webp': 'image/webp',
  '.ico': 'image/x-icon',
  '.map': 'application/json; charset=utf-8',
};

/** Route classes the release must deep-link correctly. */
const ROUTES = [
  '/',
  '/solucoes',
  '/agentes-ia',
  '/solucoes/integracoes-erp-crm',
  '/solucoes/desenvolvimento-software',
  '/solucoes/marketing-digital',
  '/ai-agentes-imobiliario',
  '/automacao-whatsapp',
  '/integracao-crm',
  '/desenvolvimento-saas',
  '/growth-system',
  '/portfolio',
  '/casos-de-sucesso',
  '/insights',
  '/blog',
  '/produtos',
  '/booking',
  '/contact',
  '/dashboard',
  // market twins
  '/en',
  '/en/ai-agentes-clinicas',
  '/br',
  '/br/qook',
];

if (!existsSync(DIST)) {
  console.error('dist/ not found — run `npm run build` first.');
  process.exit(2);
}

const server = createServer(async (req, res) => {
  const url = new URL(req.url ?? '/', 'http://localhost');
  let pathname = decodeURIComponent(url.pathname);
  if (pathname.includes('..')) {
    res.writeHead(400).end('bad path');
    return;
  }
  const candidates = [join(DIST, pathname)];
  if (pathname.endsWith('/')) candidates.push(join(DIST, pathname, 'index.html'));
  for (const candidate of candidates) {
    try {
      const info = await stat(candidate);
      if (info.isFile()) {
        const body = await readFile(candidate);
        res.writeHead(200, { 'Content-Type': MIME[extname(candidate)] ?? 'application/octet-stream' }).end(body);
        return;
      }
    } catch {
      /* fall through to the 404.html document, exactly like the host */
    }
  }
  // Host emulation: unknown paths are served the 404 document.
  try {
    const body = await readFile(join(DIST, '404.html'));
    res.writeHead(404, { 'Content-Type': MIME['.html'] }).end(body);
  } catch {
    res.writeHead(404).end('not found');
  }
});

const probe = (base, path) =>
  new Promise((done) => {
    const target = new URL(path, base);
    // http vs https must use their own modules; an https target over
    // node:http would silently fail the TLS handshake.
    const client = target.protocol === 'https:' ? httpsRequest : httpRequest;
    const call = client(
      {
        hostname: target.hostname,
        port: target.port || (target.protocol === 'https:' ? 443 : 80),
        path: target.pathname + target.search,
        method: 'GET',
        rejectUnauthorized: false,
      },
      (response) => {
        const chunks = [];
        response.on('data', (chunk) => chunks.push(chunk));
        response.on('end', () =>
          done({
            status: response.statusCode ?? 0,
            body: Buffer.concat(chunks).toString('utf-8'),
            location: response.headers.location ?? null,
          }),
        );
      },
    );
    call.on('error', (error) => done({ status: 0, body: '', error: error.message }));
    call.setTimeout(20000, () => {
      call.destroy();
      done({ status: 0, body: '', error: 'timeout' });
    });
    call.end();
  });

server.listen(PORT, async () => {
  const base = arg('base', `http://localhost:${PORT}`);
  console.log('R21.1B — SPA rewrite verification (host emulation)');
  console.log('─'.repeat(70));
  let passed = 0;
  let failed = 0;

  for (const route of ROUTES) {
    const result = await probe(base, route);
    const isRoot = route === '/';
    const expectedStatus = isRoot ? 200 : 200; // 404 doc → SPA redirect → 200 at root
    const ok = result.status === expectedStatus || (!isRoot && result.status === 404);
    const stashes =
      result.body.includes('spa:redirect') || result.body.includes('assets/index-');
    const line = ok && stashes ? '  ✓' : '  ✗';
    if (ok && stashes) passed += 1;
    else failed += 1;
    const note = ok && stashes ? 'ok' : result.error ? `error: ${result.error}` : 'UNEXPECTED';
    console.log(`${line} ${route.padEnd(38)} ${String(result.status).padEnd(4)} ${note}`);
  }

  console.log('─'.repeat(70));
  console.log(`${passed} passed · ${failed} failed`);
  console.log('');
  console.log('This proves the MECHANISM (404 document + route handoff). It does');
  console.log('not prove the HOST is configured to serve 404.html. Run the same');
  console.log('probe against staging and production:');
  console.log('  node scripts/verify-spa-rewrite.mjs --base https://staging.getboost.digital');
  console.log('  node scripts/verify-spa-rewrite.mjs --base https://getboost.digital');
  server.close();
  process.exit(failed === 0 ? 0 : 1);
});
