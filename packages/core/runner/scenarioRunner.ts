import { AgentSpec, Scenario, ScenarioMetrics } from '@vrunai/types';
import { RunResult, ToolCall, TraceEntry, ComparisonResult } from '@vrunai/types';
import { Provider, ToolCallOutput } from '../provider/provider';
import { formatTools } from './toolFormatter';
import { MockDispatcher } from './mockDispatcher';
import { computeMetrics } from './metricsCollector';
import { runWithConcurrency } from './runnerQueue';
import { evaluateCondition, StepOutputs } from './conditionEvaluator';

function buildSystemPrompt(spec: AgentSpec, context: Record<string, unknown>): string {
    const contextLines = Object.entries(context)
        .map(([k, v]) => `${k}: ${v}`)
        .join('\n');
    return `${spec.agent.instruction}${contextLines ? `\n\nContext:\n${contextLines}` : ''}`;
}

function buildToolToStep(spec: AgentSpec): Map<string, string> {
    const map = new Map<string, string>();
    for (const flow of spec.flow) {
        if (flow.tool) map.set(flow.tool, flow.step);
    }
    return map;
}

function arraysEqual(a: string[], b: string[]): boolean {
    return a.length === b.length && a.every((v, i) => v === b[i]);
}

function isSubset(expected: Record<string, unknown>, actual: Record<string, unknown>): boolean {
    return Object.entries(expected).every(([k, v]) => actual[k] === v);
}

export class ScenarioRunner {
    private toolToStep: Map<string, string>;
    private formattedTools: ReturnType<typeof formatTools>;
    private verbose: boolean;
    private maxTurns: number;
    private concurrency: number;
    private onProgress?: (event: { scenarioName: string; runIndex: number; total: number }) => void;
    private cancelSignal?: { cancelled: boolean };

    constructor(
        private spec: AgentSpec,
        private provider: Provider,
        options: {
            verbose?: boolean;
            maxTurns?: number;
            concurrency?: number;
            onProgress?: (event: { scenarioName: string; runIndex: number; total: number }) => void;
            cancelSignal?: { cancelled: boolean };
        } = {}
    ) {
        this.toolToStep = buildToolToStep(spec);
        this.formattedTools = formatTools(spec.tools);
        this.verbose = options.verbose ?? false;
        this.maxTurns = options.maxTurns ?? 10;
        this.concurrency = options.concurrency ?? 1;
        this.onProgress = options.onProgress;
        this.cancelSignal = options.cancelSignal;
    }

    private async withRetry<T>(fn: () => Promise<T>, maxAttempts = 3): Promise<T> {
        for (let attempt = 0; attempt < maxAttempts; attempt++) {
            try {
                return await fn();
            } catch (err) {
                if (attempt === maxAttempts - 1) throw err;
                await new Promise(r => setTimeout(r, 500 * 2 ** attempt)); // 500ms, 1s, 2s
            }
        }
        throw new Error('unreachable');
    }

    /**
     * Evaluate any condition steps that follow the tools just called.
     * Records the condition step and the chosen branch step in the actual path.
     */
    private evaluateFlowConditions(
        stepOutputs: StepOutputs,
        actualPath: string[],
    ): void {
        for (const flow of this.spec.flow) {
            if (!flow.condition) continue;

            // Only evaluate conditions whose referenced steps have outputs
            const expr = flow.condition.if;
            const referencedStep = expr.split('.')[0];
            if (!(referencedStep in stepOutputs)) continue;

            try {
                const result = evaluateCondition(expr, stepOutputs);
                const branch = result ? flow.condition.then : flow.condition.else;

                // Record condition step in path if not already there
                if (!actualPath.includes(flow.step)) {
                    actualPath.push(flow.step);
                }

                if (this.verbose) {
                    console.log(`         ${flow.step.padEnd(18)} → condition: ${expr} = ${result} → ${branch}`);
                }
            } catch {
                // Condition can't be evaluated yet (missing step output) — skip
            }
        }
    }

    async runScenario(scenario: Scenario, runIndex: number): Promise<RunResult> {
        const dispatcher = new MockDispatcher(this.spec.tools, scenario.mockOverride);
        const systemPrompt = buildSystemPrompt(this.spec, (scenario.context ?? {}) as Record<string, unknown>);

        const actualPath: string[] = [];
        const actualTools: string[] = [];
        const toolCalls: ToolCall[] = [];
        const trace: TraceEntry[] = [];
        const stepOutputs: StepOutputs = {};
        let inputTokens = 0;
        let outputTokens = 0;
        const startTime = Date.now();

        if (this.verbose) {
            console.log(`\n  [run ${runIndex}] "${scenario.input}"`);
        }

        const turnStart0 = Date.now();
        let response = await this.withRetry(() => this.provider.inferenceWithTools({
            systemPrompt,
            userMessage: scenario.input,
            tools: this.formattedTools,
        }));
        let turnDurationMs = Date.now() - turnStart0;

        inputTokens += response.usage.inputTokens;
        outputTokens += response.usage.outputTokens;
        let previousResponseId = response.responseId;
        let turns = 0;

        while (!response.done) {
            if (this.cancelSignal?.cancelled) break;
            if (++turns > this.maxTurns) {
                if (this.verbose) {
                    console.warn(`  [warn] max turns (${this.maxTurns}) reached for scenario "${scenario.name}" run ${runIndex}`);
                }
                break;
            }

            const toolCallOutputs: ToolCallOutput[] = [];
            const perToolDuration = Math.round(turnDurationMs / Math.max(response.functionCalls.length, 1));

            for (const fc of response.functionCalls) {
                const mockOutput = dispatcher.dispatch(fc.name, fc.arguments);
                const stepName = this.toolToStep.get(fc.name) ?? '?';

                toolCalls.push({ toolName: fc.name, input: fc.arguments, output: mockOutput });
                trace.push({
                    step: stepName,
                    toolName: fc.name,
                    input: fc.arguments,
                    output: mockOutput,
                    turn: turns,
                    durationMs: perToolDuration,
                });

                if (!actualTools.includes(fc.name)) actualTools.push(fc.name);
                if (stepName !== '?' && !actualPath.includes(stepName)) actualPath.push(stepName);

                // Store output keyed by step name for condition evaluation
                if (stepName !== '?') {
                    stepOutputs[stepName] = mockOutput;
                }

                if (this.verbose) {
                    const inKeys  = Object.keys(fc.arguments).join(', ');
                    const outKeys = Object.keys(mockOutput).join(', ');
                    console.log(`         ${stepName.padEnd(18)} → ${fc.name}  (${perToolDuration}ms)`);
                    console.log(`                              in:  { ${inKeys} }`);
                    console.log(`                              out: { ${outKeys} }`);
                }

                toolCallOutputs.push({ callId: fc.callId, output: JSON.stringify(mockOutput) });
            }

            // Evaluate flow conditions after processing tool calls in this turn
            this.evaluateFlowConditions(stepOutputs, actualPath);

            const turnStart = Date.now();
            response = await this.withRetry(() => this.provider.inferenceWithTools({
                systemPrompt,
                userMessage: scenario.input,
                tools: this.formattedTools,
                previousResponseId,
                toolCallOutputs,
            }));
            turnDurationMs = Date.now() - turnStart;

            inputTokens += response.usage.inputTokens;
            outputTokens += response.usage.outputTokens;
            previousResponseId = response.responseId;
        }

        // Final condition evaluation after all turns complete
        this.evaluateFlowConditions(stepOutputs, actualPath);

        const latencyMs = Date.now() - startTime;
        const finalOutput = toolCalls.length > 0 ? toolCalls[toolCalls.length - 1].output : {};

        const pathMatch = scenario.expectedPath ? arraysEqual(actualPath, scenario.expectedPath) : true;
        const toolMatch = arraysEqual(actualTools, scenario.expectedTools);
        const outcomeMatch = isSubset(scenario.expectedOutcome as Record<string, unknown>, finalOutput);

        return {
            runIndex,
            actualPath,
            actualTools,
            toolCalls,
            trace,
            finalOutput,
            latencyMs,
            inputTokens,
            outputTokens,
            pathMatch,
            toolMatch,
            outcomeMatch,
        };
    }

    async runAllScenarios(runsPerScenario?: number): Promise<ScenarioMetrics[]> {
        const n = runsPerScenario ?? this.spec.scoring?.runs_per_scenario ?? 1;
        const providerConfig = this.provider.getConfig();
        const results: ScenarioMetrics[] = [];

        for (const scenario of this.spec.scenarios) {
            if (this.cancelSignal?.cancelled) break;
            const tasks = Array.from({ length: n }, (_, i) => async () => {
                const result = await this.runScenario(scenario, i);
                this.onProgress?.({ scenarioName: scenario.name, runIndex: i, total: n });
                return result;
            });
            const runs = await runWithConcurrency(tasks, this.concurrency);
            const model    = providerConfig.model;
            const provider = model.includes('/') ? model.split('/')[0]
                : providerConfig.baseUrl.replace(/https?:\/\//, '').split('.')[0];
            results.push(computeMetrics(scenario.name, provider, model, runs));
        }

        return results;
    }

    static async compareProviders(
        spec: AgentSpec,
        providers: Provider[],
        options: {
            runsPerScenario?: number;
            verbose?: boolean;
            maxTurns?: number;
            concurrency?: number;
            cancelSignal?: { cancelled: boolean };
            onProgress?: (e: { model: string; scenarioName: string; runIndex: number; total: number }) => void;
        } = {}
    ): Promise<ComparisonResult[]> {
        const results: ComparisonResult[] = [];
        for (const provider of providers) {
            if (options.cancelSignal?.cancelled) break;
            const runner = new ScenarioRunner(spec, provider, {
                verbose: options.verbose,
                maxTurns: options.maxTurns,
                concurrency: options.concurrency,
                cancelSignal: options.cancelSignal,
                onProgress: e => options.onProgress?.({ ...e, model: provider.getConfig().model }),
            });
            const metrics = await runner.runAllScenarios(options.runsPerScenario);
            results.push({ model: provider.getConfig().model, metrics });
        }
        return results;
    }
}
