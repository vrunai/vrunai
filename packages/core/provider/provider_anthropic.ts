import { Provider, ProviderConfig, ToolCallRequest, ProviderToolCallResponse } from './provider';

type AnthropicMessage = { role: 'user' | 'assistant'; content: unknown };

/**
 * Provider implementation for Anthropic's Messages API (Claude models).
 * Maintains conversation history internally since Anthropic's API is stateless
 * (no equivalent to OpenAI's previous_response_id).
 * Uses fetch directly (works in both Node.js 18+ and browser).
 */
export class AnthropicProvider implements Provider {
    private messages: AnthropicMessage[] = [];
    private lastAssistantContent: unknown[] = [];

    constructor(private config: ProviderConfig) {}

    async inferenceWithTools(req: ToolCallRequest): Promise<ProviderToolCallResponse> {
        if (!req.toolCallOutputs?.length) {
            // First turn — reset conversation
            this.messages = [{ role: 'user', content: req.userMessage }];
        } else {
            // Continuation — append assistant + tool results
            this.messages.push({ role: 'assistant', content: this.lastAssistantContent });
            this.messages.push({
                role: 'user',
                content: req.toolCallOutputs.map(o => ({
                    type: 'tool_result',
                    tool_use_id: o.callId,
                    content: o.output,
                })),
            });
        }

        const tools = req.tools.map(t => ({
            name: t.name,
            description: t.description,
            input_schema: t.parameters,
        }));

        const baseUrl = this.config.baseUrl || 'https://api.anthropic.com';

        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 30_000);
        let res: Response;
        try {
            res = await fetch(`${baseUrl}/v1/messages`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'x-api-key': this.config.apiKey,
                    'anthropic-version': '2023-06-01',
                    'anthropic-dangerous-direct-browser-access': 'true',
                },
                signal: controller.signal,
                body: JSON.stringify({
                    model: this.config.model,
                    system: req.systemPrompt,
                    messages: this.messages,
                    tools,
                    max_tokens: 4096,
                }),
            });
        } finally {
            clearTimeout(timeoutId);
        }

        if (!res.ok) {
            const err = await res.text();
            throw new Error(`Anthropic API error ${res.status}: ${err}`);
        }

        const data = await res.json() as {
            id: string;
            content: Array<{ type: string; id?: string; name?: string; input?: Record<string, unknown> }>;
            stop_reason: string;
            usage: { input_tokens: number; output_tokens: number };
        };

        this.lastAssistantContent = data.content;

        const functionCalls = data.content
            .filter(b => b.type === 'tool_use')
            .map(b => ({
                callId: b.id ?? '',
                name: b.name ?? '',
                arguments: (b.input ?? {}) as Record<string, unknown>,
            }));

        return {
            responseId: data.id,
            functionCalls,
            usage: {
                inputTokens: data.usage.input_tokens,
                outputTokens: data.usage.output_tokens,
            },
            done: data.stop_reason === 'end_turn',
        };
    }

    getConfig(): ProviderConfig {
        return this.config;
    }
}
