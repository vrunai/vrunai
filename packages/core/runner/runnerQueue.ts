import type { AgentSpec, ComparisonResult } from '@vrunai/types';
import type { Provider } from '../provider/provider';
import { ScenarioRunner } from './scenarioRunner';

type QueueEntry = {
    spec: AgentSpec;
    provider: Provider;
    options?: {
        verbose?: boolean;
        maxTurns?: number;
        concurrency?: number;
        runsPerScenario?: number;
    };
};

export async function runWithConcurrency<T>(tasks: (() => Promise<T>)[], limit: number): Promise<T[]> {
    const results: T[] = new Array(tasks.length);
    let next = 0;

    async function worker() {
        while (next < tasks.length) {
            const i = next++;
            results[i] = await tasks[i]();
        }
    }

    const workers = Array.from({ length: Math.min(limit, tasks.length) }, worker);
    await Promise.all(workers);
    return results;
}

export class RunnerQueue {
    private entries: QueueEntry[] = [];

    add(spec: AgentSpec, provider: Provider, options?: QueueEntry['options']): this {
        this.entries.push({ spec, provider, options });
        return this;
    }

    async run(concurrency = 1): Promise<ComparisonResult[]> {
        const tasks = this.entries.map(entry => async () => {
            const runner = new ScenarioRunner(entry.spec, entry.provider, entry.options);
            const metrics = await runner.runAllScenarios(entry.options?.runsPerScenario);
            return { model: entry.provider.getConfig().model, metrics };
        });
        return runWithConcurrency(tasks, concurrency);
    }
}
