import type { ScenarioMetrics } from '@vrunai/types';
import type { Scenario } from '@vrunai/types';

// ── ANSI helpers ──────────────────────────────────────────────────────────────

const c = {
    green:   (s: string) => `\x1b[32m${s}\x1b[0m`,
    yellow:  (s: string) => `\x1b[33m${s}\x1b[0m`,
    red:     (s: string) => `\x1b[31m${s}\x1b[0m`,
    dim:     (s: string) => `\x1b[2m${s}\x1b[0m`,
    bold:    (s: string) => `\x1b[1m${s}\x1b[0m`,
    cyan:    (s: string) => `\x1b[36m${s}\x1b[0m`,
    magenta: (s: string) => `\x1b[35m${s}\x1b[0m`,
};

// ── Formatting primitives ─────────────────────────────────────────────────────

function pad(s: string, n: number)  { return s.slice(0, n).padEnd(n); }
function rpad(s: string, n: number) { return s.padStart(n); }

function metricBar(v: number, width = 16): string {
    const filled  = Math.round(v * width);
    const barStr  = '█'.repeat(filled) + c.dim('░'.repeat(width - filled));
    const pctStr  = `${(v * 100).toFixed(0)}%`.padStart(4);
    const color   = v === 1 ? c.green : v >= 0.8 ? c.yellow : c.red;
    return color(barStr) + '  ' + color(c.bold(pctStr));
}

function latencyStr(ms: number): string {
    return ms >= 1000 ? `${(ms / 1000).toFixed(1)}s` : `${ms.toFixed(0)}ms`;
}

// ── Scenario block ────────────────────────────────────────────────────────────

function printScenarioBlock(m: ScenarioMetrics, scenario: Scenario): void {
    const n   = m.runs.length;
    const run = m.runs[0];
    const allRunsPassed = m.runs.every(r => r.pathMatch && r.toolMatch && r.outcomeMatch);

    // Header
    console.log(`\n  ${c.bold(m.scenarioName)}  ${c.dim(`(${n} run${n !== 1 ? 's' : ''})`)}`);
    console.log();

    // Metric bars
    const labelW = 18;
    console.log(`    ${pad('path_accuracy', labelW)} ${metricBar(m.path_accuracy)}`);
    console.log(`    ${pad('tool_accuracy', labelW)} ${metricBar(m.tool_accuracy)}`);
    console.log(`    ${pad('outcome_accuracy', labelW)} ${metricBar(m.outcome_accuracy)}`);
    console.log(`    ${pad('consistency', labelW)} ${metricBar(m.consistency)}`);
    console.log();

    // Latency + tokens
    const totalTokens = m.runs.reduce((s, r) => s + r.inputTokens + r.outputTokens, 0);
    console.log(
        `    ${c.dim('latency')}   ${c.cyan(latencyStr(m.avg_latency_ms))} avg` +
        `    ${c.dim('tokens')}  ${Math.round(totalTokens / n)} / run` +
        `    ${c.dim('cost')}  $${m.total_cost_usd.toFixed(4)}`
    );

    // Compact if all runs passed — no trace noise
    if (allRunsPassed) {
        console.log(`\n    ${c.green('✓')}  ${c.dim(`all ${n} run${n !== 1 ? 's' : ''} passed`)}`);
        return;
    }

    // Trace (run 0) — only shown for failing scenarios
    const failedRuns = m.runs.filter(r => !r.pathMatch || !r.toolMatch || !r.outcomeMatch);
    console.log(`\n    ${c.dim('Trace')} ${c.dim(`(run 0 — ${failedRuns.length}/${n} run${n !== 1 ? 's' : ''} failed):`)}`);
    if (run.trace.length === 0) {
        console.log(`      ${c.dim('(no tools called)')}`);
    } else {
        for (const entry of run.trace) {
            const inExpected = scenario.expectedPath?.includes(entry.step) ?? false;
            const icon       = inExpected ? c.green('✓') : c.red('✗');

            const outPairs = Object.entries(entry.output)
                .map(([k, v]) => `${c.dim(k + ':')}${c.cyan(JSON.stringify(v))}`)
                .join('  ');

            console.log(
                `      ${icon}  ${pad(entry.step, 18)}` +
                `${c.dim('→')} ${c.magenta(pad(entry.toolName, 26))}` +
                `${c.dim(latencyStr(entry.durationMs).padStart(6))}  ${c.dim('t' + entry.turn)}`
            );
            console.log(
                `           ${c.dim('in:')}  ${c.dim(Object.keys(entry.input).join(', '))}` +
                `\n           ${c.dim('out:')} ${outPairs}`
            );
        }
    }

    // Path diff (only if mismatch)
    if (!run.pathMatch) {
        console.log(`\n    ${c.dim('Path diff:')}`);
        printPathDiff(scenario.expectedPath ?? [], run.actualPath);
    }

    // Outcome diff (only if mismatch)
    if (!run.outcomeMatch) {
        console.log();
        console.log(`    ${c.red('✗')} ${c.dim('expected:')}  ${c.dim(JSON.stringify(scenario.expectedOutcome))}`);
        console.log(`      ${c.dim('actual:')}    ${JSON.stringify(run.finalOutput)}`);
    }
}

function printPathDiff(expected: string[], actual: string[]): void {
    const ordered = [...expected, ...actual.filter(s => !expected.includes(s))];
    for (const step of ordered) {
        const inE = expected.includes(step);
        const inA = actual.includes(step);
        if (inE && inA)       console.log(`      ${c.green('✓')}  ${step}`);
        else if (inE && !inA) console.log(`      ${c.red('-')}  ${step}  ${c.dim('(expected, not called)')}`);
        else                  console.log(`      ${c.yellow('+')}  ${step}  ${c.dim('(called, not expected)')}`);
    }
}

// ── Summary table ─────────────────────────────────────────────────────────────

function printSummaryTable(metrics: ScenarioMetrics[]): void {
    const W = { name: 32, col: 8 };
    const fmt = (v: number) => `${(v * 100).toFixed(0)}%`;
    const colorMetric = (v: number, s: string) => v === 1 ? c.green(s) : v >= 0.8 ? c.yellow(s) : c.red(s);

    const sep = '─'.repeat(W.name + W.col * 5 + 4);

    console.log('\n' + sep);
    console.log(
        c.bold(
            '  ' + pad('Scenario', W.name) +
            rpad('path',    W.col) +
            rpad('tool',    W.col) +
            rpad('outcome', W.col) +
            rpad('consist', W.col) +
            rpad('latency', W.col)
        )
    );
    console.log(sep);

    for (const m of metrics) {
        const allPass = m.path_accuracy === 1 && m.tool_accuracy === 1 && m.outcome_accuracy === 1;

        const row =
            '  ' + pad(m.scenarioName, W.name) +
            rpad(colorMetric(m.path_accuracy,    fmt(m.path_accuracy)),    W.col + 9) +
            rpad(colorMetric(m.tool_accuracy,    fmt(m.tool_accuracy)),    W.col + 9) +
            rpad(colorMetric(m.outcome_accuracy, fmt(m.outcome_accuracy)), W.col + 9) +
            rpad(colorMetric(m.consistency,      fmt(m.consistency)),      W.col + 9) +
            rpad(c.dim(latencyStr(m.avg_latency_ms)),                      W.col + 9);

        console.log(allPass ? c.green(row) : row);
    }

    console.log(sep);

    // Aggregate averages
    const avg = (key: keyof Pick<ScenarioMetrics, 'path_accuracy' | 'tool_accuracy' | 'outcome_accuracy' | 'consistency'>) =>
        metrics.reduce((s, m) => s + m[key], 0) / metrics.length;

    const avgLatency = metrics.reduce((s, m) => s + m.avg_latency_ms, 0) / metrics.length;
    const totalCost  = metrics.reduce((s, m) => s + m.total_cost_usd, 0);

    console.log(
        c.bold('  ' + pad('Average', W.name)) +
        rpad(colorMetric(avg('path_accuracy'),    fmt(avg('path_accuracy'))),    W.col + 9) +
        rpad(colorMetric(avg('tool_accuracy'),    fmt(avg('tool_accuracy'))),    W.col + 9) +
        rpad(colorMetric(avg('outcome_accuracy'), fmt(avg('outcome_accuracy'))), W.col + 9) +
        rpad(colorMetric(avg('consistency'),      fmt(avg('consistency'))),      W.col + 9) +
        rpad(c.dim(latencyStr(avgLatency)),                                      W.col + 9)
    );
    console.log(sep);
    console.log(c.dim(`  Total cost: $${totalCost.toFixed(4)}`));
}

// ── Public API ────────────────────────────────────────────────────────────────

export function printReport(metrics: ScenarioMetrics[], scenarios: Scenario[], model: string): void {
    const divider = '═'.repeat(72);
    console.log('\n' + divider);
    console.log(c.bold(`  ${model}`));
    console.log(divider);

    for (let i = 0; i < metrics.length; i++) {
        printScenarioBlock(metrics[i], scenarios[i]);
        console.log('\n' + divider);
    }

    printSummaryTable(metrics);
}

export function printComparison(results: { model: string; metrics: ScenarioMetrics[] }[]): void {
    if (results.length < 2) return;

    const COL  = 14;  // width per model column (path + outcome)
    const NAME = 34;  // scenario name width
    const fmt  = (v: number) => `${(v * 100).toFixed(0)}%`.padStart(4);
    const color = (v: number, s: string) => v === 1 ? c.green(s) : v >= 0.8 ? c.yellow(s) : c.red(s);

    const scenarioNames = results[0].metrics.map(m => m.scenarioName);
    const sepW = NAME + results.length * (COL + 2) + 2;
    const sep  = '─'.repeat(sepW);

    console.log('\n' + '═'.repeat(sepW));
    console.log(c.bold('  Model Comparison'));
    console.log('═'.repeat(sepW));

    // Header row: model names
    const header = '  ' + ' '.repeat(NAME) +
        results.map(r => c.bold(pad(r.model, COL + 2))).join('');
    console.log(header);

    // Sub-header: path / outcome per model
    const subHeader = '  ' + ' '.repeat(NAME) +
        results.map(() => c.dim('path out').padEnd(COL + 2)).join('');
    console.log(subHeader);
    console.log(sep);

    // Scenario rows
    for (const name of scenarioNames) {
        const row = '  ' + pad(name, NAME) +
            results.map(r => {
                const m = r.metrics.find(x => x.scenarioName === name);
                if (!m) return ' '.repeat(COL + 2);
                return color(m.path_accuracy, fmt(m.path_accuracy)) + '  ' +
                    color(m.outcome_accuracy, fmt(m.outcome_accuracy)) + '  ';
            }).join('');
        console.log(row);
    }

    console.log(sep);

    // Average row
    const avgRow = '  ' + c.bold(pad('Average', NAME)) +
        results.map(r => {
            const avgPath    = r.metrics.reduce((s, m) => s + m.path_accuracy, 0)    / r.metrics.length;
            const avgOutcome = r.metrics.reduce((s, m) => s + m.outcome_accuracy, 0) / r.metrics.length;
            return color(avgPath, fmt(avgPath)) + '  ' + color(avgOutcome, fmt(avgOutcome)) + '  ';
        }).join('');
    console.log(avgRow);

    // Cost row
    const costRow = '  ' + c.dim(pad('Cost', NAME)) +
        results.map(r => {
            const total = r.metrics.reduce((s, m) => s + m.total_cost_usd, 0);
            return c.dim(`$${total.toFixed(4)}`.padEnd(COL + 2));
        }).join('');
    console.log(costRow);
    console.log(sep);
}
