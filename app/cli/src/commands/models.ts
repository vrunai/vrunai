import { loadModelConfig, validateUserModelConfig } from '@vrunai/core/node';

export function handleModelsCommand(args: string[]): void {
    const sub = args[0];

    if (sub === 'list') {
        const models = loadModelConfig();
        const header = `${'ID'.padEnd(35)} ${'Name'.padEnd(22)} ${'Input/1M'.padStart(10)} ${'Output/1M'.padStart(10)} ${'Context'.padStart(10)}`;
        console.log(header);
        console.log('─'.repeat(header.length));
        for (const m of models) {
            const dep = m.deprecated ? ' [deprecated]' : '';
            console.log(
                `${(m.id + dep).padEnd(35)} ${m.name.padEnd(22)}` +
                ` ${'$' + m.pricing.input_per_1m_tokens.toFixed(3)}`.padStart(10) +
                ` ${'$' + m.pricing.output_per_1m_tokens.toFixed(3)}`.padStart(10) +
                ` ${(m.context_window / 1000).toFixed(0) + 'k'}`.padStart(10)
            );
        }
        return;
    }

    if (sub === 'show') {
        const id = args[1];
        if (!id) { console.error('Usage: vrunai models show <id>'); process.exit(1); }
        const m = loadModelConfig().find(m => m.id === id);
        if (!m) { console.error(`Model not found: ${id}`); process.exit(1); }
        console.log(JSON.stringify(m, null, 2));
        return;
    }

    if (sub === 'validate') {
        const result = validateUserModelConfig();
        if (result.valid === false && result.missing) {
            console.log('No user config found at ~/.config/vrunai/models.json');
        } else if (!result.valid) {
            console.error('✗ Invalid:');
            for (const err of result.errors) console.error(`  ${err}`);
            process.exit(1);
        } else {
            console.log(`✓ Valid — ${result.count} model(s)`);
        }
        return;
    }

    console.log('Usage: vrunai models <list|show <id>|validate>');
}
