import { Provider, ProviderConfig, ToolCallRequest, ProviderToolCallResponse } from './provider';

/**
 * Provider implementation for Google's Generative Language API (Gemini models).
 * Maintains conversation history for multi-turn tool calling.
 * Uses fetch directly (works in both Node.js 18+ and browser).
 */
export class GoogleProvider implements Provider {
    private conversationHistory: Array<{ role: string; parts: unknown[] }> = [];

    constructor(private config: ProviderConfig) {}

    async inferenceWithTools(req: ToolCallRequest): Promise<ProviderToolCallResponse> {
        const model = this.config.model;
        const apiKey = this.config.apiKey;
        const baseUrl = this.config.baseUrl || 'https://generativelanguage.googleapis.com';

        const tools = [{
            function_declarations: req.tools.map(t => ({
                name: t.name,
                description: t.description,
                parameters: t.parameters,
            })),
        }];

        if (!req.toolCallOutputs?.length) {
            this.conversationHistory = [];
        }

        const systemInstruction = { parts: [{ text: req.systemPrompt }] };

        if (!req.toolCallOutputs?.length) {
            this.conversationHistory.push({ role: 'user', parts: [{ text: req.userMessage }] });
        } else {
            // Append tool results
            const functionResponses = req.toolCallOutputs.map(o => ({
                functionResponse: {
                    name: o.callId, // use callId as name (Gemini uses name for lookup)
                    response: { output: o.output },
                },
            }));
            this.conversationHistory.push({ role: 'user', parts: functionResponses });
        }

        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 30_000);
        let res: Response;
        try {
            res = await fetch(
                `${baseUrl}/v1beta/models/${model}:generateContent`,
                {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json', 'x-goog-api-key': apiKey },
                    signal: controller.signal,
                    body: JSON.stringify({
                        system_instruction: systemInstruction,
                        contents: this.conversationHistory,
                        tools,
                    }),
                }
            );
        } finally {
            clearTimeout(timeoutId);
        }

        if (!res.ok) {
            const err = await res.text();
            throw new Error(`Google API error ${res.status}: ${err}`);
        }

        const data = await res.json() as {
            candidates?: Array<{
                content?: {
                    role: string;
                    parts: Array<{
                        text?: string;
                        functionCall?: { name: string; args: Record<string, unknown> };
                    }>;
                };
                finishReason?: string;
            }>;
            usageMetadata?: { promptTokenCount: number; candidatesTokenCount: number };
        };

        const candidate = data.candidates?.[0];
        const parts = candidate?.content?.parts ?? [];

        if (candidate?.content) {
            this.conversationHistory.push({
                role: 'model',
                parts: candidate.content.parts,
            });
        }

        const functionCalls = parts
            .filter(p => p.functionCall)
            .map((p, i) => ({
                callId: `call_${i}_${p.functionCall!.name}`,
                name: p.functionCall!.name,
                arguments: p.functionCall!.args,
            }));

        const done = functionCalls.length === 0 || candidate?.finishReason === 'STOP';

        return {
            responseId: `gemini-${Date.now()}`,
            functionCalls,
            usage: {
                inputTokens: data.usageMetadata?.promptTokenCount ?? 0,
                outputTokens: data.usageMetadata?.candidatesTokenCount ?? 0,
            },
            done,
        };
    }

    getConfig(): ProviderConfig {
        return this.config;
    }
}
