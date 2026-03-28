import { Tool, Scenario } from '@vrunai/types';

type MockOverride = NonNullable<Scenario['mockOverride']>;

export class MockDispatcher {
    private toolMap: Map<string, Tool>;
    private override: MockOverride;

    constructor(tools: Tool[], mockOverride?: MockOverride) {
        this.toolMap = new Map(tools.map(t => [t.name, t]));
        this.override = mockOverride ?? {};
    }

    dispatch(toolName: string, args: Record<string, unknown>): Record<string, unknown> {
        // mock_override takes priority — returns output regardless of input
        if (this.override[toolName]) {
            return this.override[toolName].output as Record<string, unknown>;
        }

        const tool = this.toolMap.get(toolName);
        if (!tool) {
            throw new Error(`MockDispatcher: unknown tool "${toolName}"`);
        }

        if (!tool.mock?.length) {
            throw new Error(`MockDispatcher: no mocks defined for tool "${toolName}"`);
        }

        // Exact match: all mock.input fields equal args values (deep equality for objects/arrays)
        for (const mock of tool.mock) {
            const matches = Object.entries(mock.input).every(([key, val]) =>
                JSON.stringify(args[key]) === JSON.stringify(val)
            );
            if (matches) return mock.output as Record<string, unknown>;
        }

        // Best-partial match: LLM may generate slightly different free-text fields (e.g. context).
        // Pick the mock with the highest number of matching fields.
        let best = tool.mock![0];
        let bestScore = -1;
        for (const mock of tool.mock) {
            const score = Object.entries(mock.input).filter(([key, val]) =>
                JSON.stringify(args[key]) === JSON.stringify(val)
            ).length;
            if (score > bestScore) {
                bestScore = score;
                best = mock;
            }
        }

        if (best) return best.output as Record<string, unknown>;

        throw new Error(
            `MockDispatcher: no matching mock for tool "${toolName}" with args ${JSON.stringify(args)}`
        );
    }
}
