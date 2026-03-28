#!/usr/bin/env node
import { build } from 'esbuild';
import { chmodSync } from 'fs';

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
    define: { 'process.env.NODE_ENV': '"production"' },
});

chmodSync('dist/index.js', 0o755);
console.log('Build complete → dist/index.js');
