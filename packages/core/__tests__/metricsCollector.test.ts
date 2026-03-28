import { describe, it, expect } from 'vitest';
import { computeMetrics } from '../runner/metricsCollector';
import type { RunResult } from '@vrunai/types';

function makeRun(overrides: Partial<RunResult> = {}): RunResult {
    return {
        runIndex: 0,
        actualPath: [],
        actualTools: [],
        toolCalls: [],
        trace: [],
        finalOutput: { success: true },
        latencyMs: 100,
        inputTokens: 500,
        outputTokens: 200,
        pathMatch: true,
        toolMatch: true,
        outcomeMatch: true,
        ...overrides,
    };
}

describe('computeMetrics', () => {
    it('throws on empty runs', () => {
        expect(() => computeMetrics('test', 'openai', 'gpt-4o', [])).toThrow('runs array is empty');
    });

    it('computes 100% accuracy when all match', () => {
        const runs = [makeRun(), makeRun(), makeRun()];
        const m = computeMetrics('test', 'openai', 'gpt-4o', runs);
        expect(m.tool_accuracy).toBe(1);
        expect(m.path_accuracy).toBe(1);
        expect(m.outcome_accuracy).toBe(1);
        expect(m.consistency).toBe(1);
    });

    it('computes partial accuracy', () => {
        const runs = [
            makeRun({ toolMatch: true, pathMatch: false, outcomeMatch: true }),
            makeRun({ toolMatch: false, pathMatch: false, outcomeMatch: false }),
        ];
        const m = computeMetrics('test', 'openai', 'gpt-4o', runs);
        expect(m.tool_accuracy).toBe(0.5);
        expect(m.path_accuracy).toBe(0);
        expect(m.outcome_accuracy).toBe(0.5);
    });

    it('computes consistency based on most common output', () => {
        const runs = [
            makeRun({ finalOutput: { a: 1 } }),
            makeRun({ finalOutput: { a: 1 } }),
            makeRun({ finalOutput: { a: 2 } }),
        ];
        const m = computeMetrics('test', 'openai', 'gpt-4o', runs);
        expect(m.consistency).toBeCloseTo(2 / 3);
    });

    it('computes average latency', () => {
        const runs = [
            makeRun({ latencyMs: 100 }),
            makeRun({ latencyMs: 200 }),
            makeRun({ latencyMs: 300 }),
        ];
        const m = computeMetrics('test', 'openai', 'gpt-4o', runs);
        expect(m.avg_latency_ms).toBe(200);
    });

    it('passes through scenario metadata', () => {
        const m = computeMetrics('my-scenario', 'anthropic', 'claude-3', [makeRun()]);
        expect(m.scenarioName).toBe('my-scenario');
        expect(m.provider).toBe('anthropic');
        expect(m.model).toBe('claude-3');
    });
});
