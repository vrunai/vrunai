import { createServer } from 'node:http';
import { readFile, stat } from 'node:fs/promises';
import { join, extname } from 'node:path';
import { fileURLToPath } from 'node:url';

const MIME: Record<string, string> = {
    '.html': 'text/html; charset=utf-8',
    '.js':   'application/javascript',
    '.css':  'text/css',
    '.json': 'application/json',
    '.svg':  'image/svg+xml',
    '.png':  'image/png',
    '.ico':  'image/x-icon',
    '.woff': 'font/woff',
    '.woff2': 'font/woff2',
};

import { existsSync } from 'node:fs';

function resolveWebDist(): string {
    const thisDir = fileURLToPath(new URL('.', import.meta.url));
    // Production: cli/dist/index.js → cli/dist/web/
    const prodPath = join(thisDir, 'web');
    if (existsSync(join(prodPath, 'index.html'))) return prodPath;
    // Dev: cli/src/commands/web.ts → ../../web/dist/
    const devPath = join(thisDir, '..', '..', '..', 'web', 'dist');
    if (existsSync(join(devPath, 'index.html'))) return devPath;
    return prodPath; // fall through to error handling
}

export async function handleWebCommand(args: string[]): Promise<void> {
    const port = parseInt(args.find(a => /^\d+$/.test(a)) ?? '3120', 10);
    const distDir = resolveWebDist();

    try {
        await stat(join(distDir, 'index.html'));
    } catch {
        console.error('Web UI assets not found.');
        console.error('If developing locally, build the web app first:\n');
        console.error('  cd app/web && pnpm build && cd ../cli && pnpm build\n');
        process.exit(1);
    }

    const server = createServer(async (req, res) => {
        const url = new URL(req.url ?? '/', `http://localhost:${port}`);
        let filePath = join(distDir, url.pathname === '/' ? 'index.html' : url.pathname);

        try {
            const fileStat = await stat(filePath);
            if (fileStat.isDirectory()) filePath = join(filePath, 'index.html');
        } catch {
            // SPA fallback
            filePath = join(distDir, 'index.html');
        }

        try {
            const data = await readFile(filePath);
            const ext = extname(filePath);
            res.writeHead(200, { 'Content-Type': MIME[ext] ?? 'application/octet-stream' });
            res.end(data);
        } catch {
            res.writeHead(404, { 'Content-Type': 'text/plain' });
            res.end('Not found');
        }
    });

    server.listen(port, () => {
        console.log(`\n  vrunai web → http://localhost:${port}\n`);
        console.log('  Press Ctrl+C to stop\n');
    });

    await new Promise<void>((resolve) => {
        process.on('SIGINT', () => { server.close(); resolve(); });
        process.on('SIGTERM', () => { server.close(); resolve(); });
    });
}
