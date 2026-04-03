#!/usr/bin/env node
import { build } from 'esbuild';
import { chmodSync, readFileSync, cpSync, existsSync, mkdirSync } from 'fs';
import { join } from 'path';

const pkg = JSON.parse(readFileSync('package.json', 'utf8'));

const banner = [
    '#!/usr/bin/env node',
    "import { createRequire } from 'module';",
    'const require = createRequire(import.meta.url);',
].join('\n');

await build({
    entryPoints: ['src/index.tsx'],
    bundle: true,
    platform: 'node',
    format: 'esm',
    outfile: 'dist/index.js',
    banner: { js: banner },
    alias: { 'react-devtools-core': './src/devtools-stub.js' },
    define: { 'process.env.NODE_ENV': '"production"', 'PKG_VERSION': JSON.stringify(pkg.version) },
});

chmodSync('dist/index.js', 0o755);
console.log('Build complete → dist/index.js');

// Copy web UI dist into cli/dist/web/ so `vrunai web` can serve it
const webDist = join('..', 'web', 'dist');
const target = join('dist', 'web');
if (existsSync(join(webDist, 'index.html'))) {
    mkdirSync(target, { recursive: true });
    cpSync(webDist, target, { recursive: true });
    console.log('Copied web UI  → dist/web/');
} else {
    console.log('Skipped web UI — app/web/dist not found (run web build first)');
}
