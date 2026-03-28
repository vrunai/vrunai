export interface ProviderConfig {
    model: string;
    apiKey: string;
    baseUrl: string;
}

export interface FunctionToolDefinition {
    name: string;
    description: string;
    parameters: Record<string, unknown>;
}

export interface ToolCallOutput {
    callId: string;
    output: string; // JSON-serialised mock output
}

export interface ToolCallRequest {
    systemPrompt: string;
    userMessage: string;
    tools: FunctionToolDefinition[];
    previousResponseId?: string;
    toolCallOutputs?: ToolCallOutput[];
}

export interface ProviderToolCallResponse {
    responseId: string;
    functionCalls: Array<{ callId: string; name: string; arguments: Record<string, unknown> }>;
    usage: { inputTokens: number; outputTokens: number };
    done: boolean;
}

/**
 * Interface for abstraction for the implementation of specific LLM provider adapters
 * @interface
 */
export interface Provider {
    /**
     * Create an inference request with tool calling support (multi-turn)
     * @param req {ToolCallRequest} request parameters including tool definitions and optional prior outputs
     * @returns {ProviderToolCallResponse} response with function calls and usage
     */
    inferenceWithTools(req: ToolCallRequest): Promise<ProviderToolCallResponse>;

    /**
     * Get the config of the provider adapter
     * @returns {ProviderConfig} config of the adapter
     */
    getConfig(): ProviderConfig;
}

/**
 * Test whether a provider can connect to its API.
 * Sends a minimal inference request and returns ok/error.
 */
export async function testConnection(provider: Provider): Promise<{ ok: boolean; error?: string }> {
    try {
        await provider.inferenceWithTools({
            systemPrompt: 'Respond with the single word OK.',
            userMessage: 'ping',
            tools: [],
        });
        return { ok: true };
    } catch (err) {
        return { ok: false, error: err instanceof Error ? err.message : String(err) };
    }
}
