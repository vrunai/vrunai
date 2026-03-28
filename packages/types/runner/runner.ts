export type ToolCall = {
    toolName: string;
    input: Record<string, unknown>;
    output: Record<string, unknown>;
};

export type TraceEntry = {
    step: string;
    toolName: string;
    input: Record<string, unknown>;
    output: Record<string, unknown>;
    turn: number;
    durationMs: number;
};

export type RunResult = {
    runIndex: number;
    actualPath: string[];
    actualTools: string[];
    toolCalls: ToolCall[];
    trace: TraceEntry[];
    finalOutput: Record<string, unknown>;
    latencyMs: number;
    inputTokens: number;
    outputTokens: number;
    pathMatch: boolean;
    toolMatch: boolean;
    outcomeMatch: boolean;
};

export type ScenarioMetrics = {
    scenarioName: string;
    provider: string;
    model: string;
    runs: RunResult[];
    tool_accuracy: number;
    path_accuracy: number;
    outcome_accuracy: number;
    consistency: number;
    avg_latency_ms: number;
    total_cost_usd: number;
};

export type ComparisonResult = {
    model: string;
    metrics: ScenarioMetrics[];
};
