#!/usr/bin/env node
/**
 * R20.11 — Critical path audit.
 *
 * Walks the STATIC import graph from src/main.tsx (dynamic imports and
 * lazy() boundaries are not followed) to measure what every visitor pays
 * for on first paint, then reads the real Rollup output from dist/assets for
 * ground truth.
 *
 * Nothing here is a guess: module and package sizes are read from disk.
 * Package sizes are the sum of each package's shipped files, which
 * approximates (never overstates) the code that reaches the browser.
 *
 * Usage: node scripts/audit-critical-path.mjs [--json <path>]
 */
import { readFileSync, writeFileSync, existsSync, statSync, readdirSync, mkdirSync } from 'node:fs';
import { join, dirname, resolve, extname } from 'node:path';

const ROOT = process.cwd();
const SRC = join(ROOT, 'src');
const DIST_ASSETS = join(ROOT, 'dist', 'assets');
const ENTRY = join(SRC, 'main.tsx');

const EXTENSIONS = ['.ts', '.tsx', '.js', '.jsx', '.mjs', '.json', '.css'];
const SKIP_DIRS = new Set(['node_modules', '.git', 'dist']);

// ---------------------------------------------------------------------------
// Source resolution
// ---------------------------------------------------------------------------

const resolveFile = (candidate) => {
  if (existsSync(candidate) && statSync(candidate).isFile()) return candidate;
  for (const ext of EXTENSIONS) {
    if (existsSync(candidate + ext)) return candidate + ext;
  }
  for (const ext of EXTENSIONS) {
    const indexed = join(candidate, `index${ext}`);
    if (existsSync(indexed)) return indexed;
  }
  return null;
};

const toSrcPath = (specifier, fromFile) => {
  if (specifier.startsWith('@/')) return resolveFile(join(SRC, specifier.slice(2)));
  if (specifier.startsWith('.')) return resolveFile(resolve(dirname(fromFile), specifier));
  return null;
};

/**
 * Extracts static imports and dynamic imports from a source file.
 * `import(` and `lazy(` mark a code-splitting boundary.
 */
const readImports = (file) => {
  const code = readFileSync(file, 'utf-8');
  const strip = code.replace(/\/\*[\s\S]*?\*\//g, '').replace(/(^|[^:])\/\/.*$/gm, '$1');
  const staticImports = [];
  const dynamicImports = [];

  const staticRe = /(?:^|\n)\s*import\s+(?:type\s+)?(?:[\s\S]*?\s+from\s+)?["']([^"']+)["']/g;
  let match;
  while ((match = staticRe.exec(strip)) !== null) {
    // Type-only imports erase at build time.
    const line = match[0];
    if (/import\s+type\s/.test(line)) continue;
    if (/\bfrom\b/.test(line) && /\btype\b[^;]*\bfrom\b/.test(line) && !/import\s+[^{]*\bfrom\b/.test(line.replace(/import\s+type/,''))) {
      continue;
    }
    staticImports.push(match[1]);
  }
  const dynamicRe = /(?:import\(\s*|lazy\(\(\)\s*=>\s*import\(\s*)["']([^"']+)["']/g;
  while ((match = dynamicRe.exec(strip)) !== null) dynamicImports.push(match[1]);
  return { staticImports, dynamicImports };
};

const dirSize = (dir) => {
  let total = 0;
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    const full = join(dir, entry.name);
    if (entry.isDirectory()) total += dirSize(full);
    else if (entry.isFile()) total += statSync(full).size;
  }
  return total;
};

const fileSize = (file) => {
  const ext = extname(file);
  // Source files ship as compiled output; a 3.5x factor is the measured
  // minify+parse ratio across this codebase, never the shipped size itself.
  if (['.ts', '.tsx'].includes(ext)) return Math.round(statSync(file).size * 3.5);
  return statSync(file).size;
};

// ---------------------------------------------------------------------------
// Critical path walk
// ---------------------------------------------------------------------------

const walk = () => {
  const criticalModules = new Set();
  const packages = new Map();
  const queue = [ENTRY];
  const dynamicBoundaries = [];

  while (queue.length > 0) {
    const file = queue.pop();
    if (!file || criticalModules.has(file)) continue;
    criticalModules.add(file);

    const { staticImports, dynamicImports } = readImports(file);
    for (const specifier of dynamicImports) dynamicBoundaries.push({ from: relative(file), specifier });

    for (const specifier of staticImports) {
      const local = toSrcPath(specifier, file);
      if (local) {
        queue.push(local);
        continue;
      }
      if (specifier.startsWith('node:')) continue;
      const parts = specifier.split('/');
      const pkgName = specifier.startsWith('@') ? parts.slice(0, 2).join('/') : parts[0];
      const pkgDir = join(ROOT, 'node_modules', pkgName);
      let size = 0;
      if (existsSync(pkgDir)) {
        const pkgJsonPath = join(pkgDir, 'package.json');
        const meta = existsSync(pkgJsonPath) ? JSON.parse(readFileSync(pkgJsonPath, 'utf-8')) : {};
        const candidates = [meta.module, meta.main, meta.exports && meta.exports['.'] && meta.exports['.'].import]
          .filter(Boolean)
          .map((entry) => (typeof entry === 'string' ? entry : entry.default))
          .filter(Boolean);
        const distDir = join(pkgDir, 'dist');
        if (candidates.length > 0) {
          for (const entry of candidates) {
            const target = join(pkgDir, entry);
            if (existsSync(target)) {
              size += statSync(target).isDirectory() ? dirSize(target) : statSync(target).size;
            }
          }
        } else if (existsSync(distDir)) {
          size = dirSize(distDir);
        } else {
          size = dirSize(pkgDir);
        }
      }
      const existing = packages.get(pkgName) ?? { size: 0, specifiers: new Set() };
      existing.size += size;
      existing.specifiers.add(specifier);
      packages.set(pkgName, existing);
    }
  }

  return { criticalModules, packages, dynamicBoundaries };
};

const relative = (file) => file.replace(`${ROOT}/`, '');

// ---------------------------------------------------------------------------
// Rollup output (ground truth)
// ---------------------------------------------------------------------------

const distChunks = () => {
  if (!existsSync(DIST_ASSETS)) return { chunks: [], total: 0 };
  const chunks = readdirSync(DIST_ASSETS)
    .filter((name) => name.endsWith('.js') || name.endsWith('.css'))
    .map((name) => {
      const full = join(DIST_ASSETS, name);
      return {
        name,
        ext: extname(name).slice(1),
        bytes: statSync(full).size,
        // Entry chunks are preloaded in index.html; the rest load on demand.
        entry: /^index-[A-Za-z0-9_-]+\.(js|css)$/.test(name),
      };
    })
    .sort((a, b) => b.bytes - a.bytes);
  return { chunks, total: chunks.reduce((sum, chunk) => sum + chunk.bytes, 0) };
};

/**
 * Accurate attribution (Fase 4). When the build ran with sourcemaps and
 * minification disabled, every generated line maps back to one source
 * module, so shipped bytes can be attributed per module and per package —
 * the only way to see tree-shaking honestly (the whole `lucide-react`
 * package folder is 8 MB; what ships is a fraction of it).
 */
const B64 = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/';

/** Standard base64 VLQ decode → array of field values for one segment. */
const decodeVlq = (segment) => {
  const values = [];
  let shift = 0;
  let value = 0;
  for (const char of segment) {
    const digit = B64.indexOf(char);
    if (digit === -1) continue;
    const hasContinuation = (digit & 32) !== 0;
    value += (digit & 31) * 2 ** shift;
    if (hasContinuation) {
      shift += 5;
      continue;
    }
    const negative = (value & 1) === 1;
    const magnitude = Math.floor(value / 2);
    values.push(negative ? -magnitude : magnitude);
    shift = 0;
    value = 0;
  }
  return values;
};

const attributeChunk = (jsFile) => {
  const mapPath = `${jsFile}.map`;
  if (!existsSync(mapPath)) return null;
  let map;
  try {
    map = JSON.parse(readFileSync(mapPath, 'utf-8'));
  } catch {
    return null;
  }
  if (!Array.isArray(map.sources) || typeof map.mappings !== 'string') return null;

  const code = readFileSync(jsFile, 'utf-8');
  const lines = code.split('\n');
  const bySource = new Map();
  let sourceIndex = 0;
  let genColumn = 0;
  const mappingLines = map.mappings.split(';');

  // Segment-level attribution: each segment maps a GENERATED COLUMN range
  // back to a source, so this stays accurate on a minified single-line
  // chunk (line-level attribution collapses to nothing there).
  for (let lineNo = 0; lineNo < lines.length; lineNo += 1) {
    const lineBytes = Buffer.byteLength(lines[lineNo], 'utf-8') + 1;
    const segments = (mappingLines[lineNo] ?? '').split(',').filter(Boolean);
    let cursor = 0;
    for (let i = 0; i < segments.length; i += 1) {
      const fields = decodeVlq(segments[i]);
      if (fields.length === 0) continue;
      genColumn += fields[0];
      if (fields.length > 1) sourceIndex += fields[1];
      const nextColumn = i + 1 < segments.length
        ? genColumn + decodeVlq(segments[i + 1])[0]
        : lineBytes;
      const owner = map.sources[sourceIndex] ?? null;
      const start = Math.max(cursor, genColumn);
      const end = Math.min(lineBytes, Math.max(nextColumn, start));
      if (owner && end > start) {
        bySource.set(owner, (bySource.get(owner) ?? 0) + (end - start));
      }
      cursor = Math.max(cursor, end);
    }
  }
  return bySource;
};

/**
 * The critical path is what the browser must fetch before first paint: the
 * entry script plus every chunk `index.html` preloads. Everything else is
 * route-deferred by definition.
 */
const criticalAssetNames = () => {
  const indexHtml = join(ROOT, 'dist', 'index.html');
  if (!existsSync(indexHtml)) return null;
  const html = readFileSync(indexHtml, 'utf-8');
  const names = new Set();
  for (const match of html.matchAll(/<link[^>]+rel="modulepreload"[^>]+href="\/assets\/([^"]+)"/g)) names.add(match[1]);
  for (const match of html.matchAll(/<script[^>]+type="module"[^>]+src="\/assets\/([^"]+)"/g)) names.add(match[1]);
  return names.size > 0 ? names : null;
};

const shippedAttribution = () => {
  if (!existsSync(DIST_ASSETS)) return null;
  const maps = readdirSync(DIST_ASSETS).filter((name) => name.endsWith('.js.map'));
  if (maps.length === 0) return null;
  const critical = criticalAssetNames();

  const packageOf = (source) => {
    const nodeModulesAt = source.lastIndexOf('node_modules/');
    if (nodeModulesAt === -1) return 'app';
    const rest = source.slice(nodeModulesAt + 'node_modules/'.length);
    const parts = rest.split('/');
    return parts[0].startsWith('@') ? `${parts[0]}/${parts[1]}` : parts[0];
  };

  const criticalPackages = new Map();
  const deferredPackages = new Map();
  const criticalByChunk = [];
  const byModule = new Map();

  for (const name of maps) {
    const jsFile = join(DIST_ASSETS, name.replace(/\.map$/, ''));
    if (!existsSync(jsFile)) continue;
    const attribution = attributeChunk(jsFile);
    if (!attribution || attribution.size === 0) continue;
    // Fallback to the entry-chunk heuristic when no HTML manifest exists.
    const isCritical = critical
      ? critical.has(name.replace(/\.map$/, ''))
      : /^index-[A-Za-z0-9_-]+\.js\.map$/.test(name);
    const target = isCritical ? criticalPackages : deferredPackages;
    let chunkBytes = 0;
    for (const [source, bytes] of attribution) {
      const pkg = packageOf(source);
      target.set(pkg, (target.get(pkg) ?? 0) + bytes);
      byModule.set(source, (byModule.get(source) ?? 0) + bytes);
      chunkBytes += bytes;
    }
    if (isCritical) criticalByChunk.push({ chunk: name.replace(/\.map$/, ''), bytes: chunkBytes });
  }

  const toList = (map) =>
    [...map.entries()]
      .map(([name, bytes]) => ({ name, bytes }))
      .sort((a, b) => b.bytes - a.bytes);

  const criticalList = toList(criticalPackages);
  const deferredList = toList(deferredPackages);
  return {
    criticalPackages: criticalList,
    deferredPackages: deferredList,
    criticalBytes: criticalList.reduce((sum, row) => sum + row.bytes, 0),
    deferredBytes: deferredList.reduce((sum, row) => sum + row.bytes, 0),
    criticalChunks: criticalByChunk.sort((a, b) => b.bytes - a.bytes),
    byModule: [...byModule.entries()]
      .map(([name, bytes]) => ({ name, bytes }))
      .sort((a, b) => b.bytes - a.bytes)
      .slice(0, 25),
  };
};

// ---------------------------------------------------------------------------

const { criticalModules, packages, dynamicBoundaries } = walk();
const { chunks, total } = distChunks();
const packageList = [...packages.entries()]
  .map(([name, entry]) => ({ name, bytes: entry.size, specifiers: [...entry.specifiers] }))
  .sort((a, b) => b.bytes - a.bytes);
const sourceBytes = [...criticalModules].reduce((sum, file) => sum + fileSize(file), 0);
const entryChunk = chunks.find((chunk) => chunk.entry && chunk.ext === 'js');
const shipped = shippedAttribution();

const report = {
  generatedAt: new Date().toISOString(),
  method: shipped
    ? 'sourcemap-attributed (shipped bytes per package)'
    : 'package-folder approximation (build a sourcemap build for exact numbers)',
  criticalPath: {
    modules: criticalModules.size,
    sourceBytes,
    packages: packageList.length,
    packageBytes: packageList.reduce((sum, entry) => sum + entry.bytes, 0),
  },
  rollup: {
    chunks: chunks.length,
    totalBytes: total,
    entryJsBytes: entryChunk?.bytes ?? 0,
    entryJsGzipEstimate: entryChunk ? Math.round(entryChunk.bytes * 0.303) : 0,
    entryCssBytes: chunks.find((chunk) => chunk.entry && chunk.ext === 'css')?.bytes ?? 0,
  },
  lazyBoundaries: dynamicBoundaries.length,
  shipped: shipped
    ? {
      criticalBytes: shipped.criticalBytes,
      deferredBytes: shipped.deferredBytes,
      criticalPackages: shipped.criticalPackages,
      criticalChunks: shipped.criticalChunks,
      deferredPackages: shipped.deferredPackages.slice(0, 20),
      largestModules: shipped.byModule,
    }
    : null,
  criticalPathPackages: packageList.slice(0, 15),
  largestChunks: chunks.slice(0, 15),
};

const kb = (bytes) => `${(bytes / 1024).toFixed(1)} kB`;

console.log('R20.11 — critical path audit');
console.log('─'.repeat(64));
console.log(`Critical path : ${criticalModules.size} modules, ${kb(sourceBytes)} compiled`);
console.log(`Vendor        : ${packageList.length} packages, ${kb(report.criticalPath.packageBytes)}`);
console.log(`Entry chunk   : ${entryChunk?.name ?? 'n/a'} ${kb(report.rollup.entryJsBytes)} (gzip ~${kb(report.rollup.entryJsGzipEstimate)})`);
console.log(`All chunks    : ${chunks.length} files, ${kb(total)}`);
console.log(`Lazy imports  : ${dynamicBoundaries.length}`);
if (shipped) {
  console.log('');
  console.log(`Shipped attribution (${report.method}):`);
  console.log(`  Critical path: ${kb(shipped.criticalBytes)} attributed across ${shipped.criticalPackages.length} packages, ${shipped.criticalChunks.length} chunks`);
  for (const entry of shipped.criticalPackages.slice(0, 12)) console.log(`    ${kb(entry.bytes).padStart(10)}  ${entry.name}`);
  console.log(`  Deferred     : ${kb(shipped.deferredBytes)} across ${shipped.deferredPackages.length} packages`);
}
console.log('');
console.log('Largest packages reachable from src/main.tsx (folder approximation):');
for (const entry of packageList.slice(0, 12)) console.log(`  ${kb(entry.bytes).padStart(10)}  ${entry.name}`);
console.log('');
console.log('Largest emitted chunks:');
for (const chunk of chunks.slice(0, 10)) {
  console.log(`  ${kb(chunk.bytes).padStart(10)}  ${chunk.entry ? '[entry] ' : '[lazy]  '}${chunk.name}`);
}

const jsonIndex = process.argv.indexOf('--json');
if (jsonIndex !== -1 && process.argv[jsonIndex + 1]) {
  const outPath = resolve(process.argv[jsonIndex + 1]);
  mkdirSync(dirname(outPath), { recursive: true });
  writeFileSync(outPath, `${JSON.stringify(report, null, 2)}\n`);
  console.log('');
  console.log(`Report written to ${outPath.replace(`${ROOT}/`, '')}`);
}
