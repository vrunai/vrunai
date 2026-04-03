#!/usr/bin/env node
import { build } from 'esbuild';
import { chmodSync, readFileSync } from 'fs';

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
