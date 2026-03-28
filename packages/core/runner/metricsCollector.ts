import { RunResult, ScenarioMetrics } from '@vrunai/types';
import { calculateCost } from '../modelCatalog';

export function computeMetrics(
    scenarioName: string,
    provider: string,
    model: string,
    runs: RunResult[]
): ScenarioMetrics {
    const n = runs.length;
    if (n === 0) {
        throw new Error('computeMetrics: runs array is empty');
    }

    const tool_accuracy = runs.filter(r => r.toolMatch).length / n;
    const path_accuracy = runs.filter(r => r.pathMatch).length / n;
    const outcome_accuracy = runs.filter(r => r.outcomeMatch).length / n;

    // Consistency: fraction of runs that agree with the most common finalOutput
    const freq = new Map<string, number>();
    for (const run of runs) {
        const key = JSON.stringify(run.finalOutput);
        freq.set(key, (freq.get(key) ?? 0) + 1);
    }
    const maxFreq = Math.max(...freq.values());
    const consistency = maxFreq / n;

    const avg_latency_ms = runs.reduce((sum, r) => sum + r.latencyMs, 0) / n;

    const totalInputTokens = runs.reduce((sum, r) => sum + r.inputTokens, 0);
    const totalOutputTokens = runs.reduce((sum, r) => sum + r.outputTokens, 0);
    const total_cost_usd = calculateCost(model, totalInputTokens, totalOutputTokens);

    return {
        scenarioName,
        provider,
        model,
        runs,
        tool_accuracy,
        path_accuracy,
        outcome_accuracy,
        consistency,
        avg_latency_ms,
        total_cost_usd,
    };
}
