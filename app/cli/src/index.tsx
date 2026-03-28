import React from 'react';
import { render } from 'ink';
import { App } from './App.js';

// ── Arg parsing ───────────────────────────────────────────────────────────────

(async () => {
    const args = process.argv.slice(2);

    if (args[0] === 'models') {
        const { handleModelsCommand } = await import('./commands/models.js');
        handleModelsCommand(args.slice(1));
        process.exit(0);
    }

    // Enter alternate screen buffer so each process start gets a clean canvas.
    // This prevents stale output from previous runs (e.g. tsx hot-reload restarts)
    // from remaining visible behind the new render.
    if (process.stdout.isTTY) {
        process.stdout.write('\x1b[?1049h\x1b[H');
        process.on('exit', () => process.stdout.write('\x1b[?1049l'));
    }

    const { waitUntilExit } = render(<App />);
    await waitUntilExit();
})();
