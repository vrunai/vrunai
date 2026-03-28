import { Provider, ProviderConfig, ToolCallRequest, ProviderToolCallResponse } from './provider';

/**
 * Provider implementation for OpenAI's Responses API.
 * Uses fetch directly (works in both Node.js 18+ and browser).
 * Also used for OpenAI-compatible custom endpoints.
 */
export class OpenAIProvider implements Provider {
    constructor(private config: ProviderConfig) {}

    async inferenceWithTools(req: ToolCallRequest): Promise<ProviderToolCallResponse> {
        const tools = req.tools.map(t => ({
            type: 'function' as const,
            name: t.name,
            description: t.description,
            parameters: t.parameters,
            strict: false,
        }));

        const input: unknown = req.toolCallOutputs?.length
            ? req.toolCallOutputs.map(o => ({
                  type: 'function_call_output' as const,
                  call_id: o.callId,
                  output: o.output,
              }))
            : req.userMessage;

        const body: Record<string, unknown> = {
            model: this.config.model,
            instructions: req.systemPrompt,
            input,
            tools,
            tool_choice: 'auto',
        };
        if (req.previousResponseId) {
            body.previous_response_id = req.previousResponseId;
        }

        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 30_000);
        let res: Response;
        try {
            res = await fetch(`${this.config.baseUrl}/responses`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${this.config.apiKey}`,
                },
                signal: controller.signal,
                body: JSON.stringify(body),
            });
        } finally {
            clearTimeout(timeoutId);
        }

        if (!res.ok) {
            const err = await res.text();
            throw new Error(`OpenAI API error ${res.status}: ${err}`);
        }

        const data = await res.json() as {
            id: string;
            output: Array<{ type: string; call_id?: string; name?: string; arguments?: string }>;
            usage?: { input_tokens: number; output_tokens: number };
        };

        const functionCalls = (data.output ?? [])
            .filter(item => item.type === 'function_call')
            .map(item => ({
                callId: item.call_id ?? '',
                name: item.name ?? '',
                arguments: (() => {
                    try { return JSON.parse(item.arguments ?? '{}') as Record<string, unknown>; }
                    catch { return {}; }
                })(),
            }));

        return {
            responseId: data.id,
            functionCalls,
            usage: {
                inputTokens: data.usage?.input_tokens ?? 0,
                outputTokens: data.usage?.output_tokens ?? 0,
            },
            done: functionCalls.length === 0,
        };
    }

    getConfig(): ProviderConfig {
        return this.config;
    }
}
