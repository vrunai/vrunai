import { z } from 'zod'

const OutputTextContentSchema = z.object({
    type: z.literal('output_text'),
    text: z.string(),
    annotations: z.array(z.unknown()),
});

const OutputMessageSchema = z.object({
    type: z.literal('message'),
    id: z.string(),
    status: z.string(),
    role: z.string(),
    content: z.array(OutputTextContentSchema),
});

const ReasoningSchema = z.object({
    effort: z.string().nullable(),
    summary: z.string().nullable(),
});

const TextFormatSchema = z.object({
    type: z.string(),
});

const TextSchema = z.object({
    format: TextFormatSchema,
});

const InputTokensDetailsSchema = z.object({
    cached_tokens: z.number(),
});

const OutputTokensDetailsSchema = z.object({
    reasoning_tokens: z.number(),
});

const UsageSchema = z.object({
    input_tokens: z.number(),
    input_tokens_details: InputTokensDetailsSchema,
    output_tokens: z.number(),
    output_tokens_details: OutputTokensDetailsSchema,
    total_tokens: z.number(),
});

export const OpenAiResponseSchema = z.object({
    id: z.string(),
    object: z.literal('response'),
    created_at: z.number(),
    status: z.string(),
    completed_at: z.number().nullable(),
    error: z.unknown().nullable(),
    incomplete_details: z.unknown().nullable(),
    instructions: z.string().nullable(),
    max_output_tokens: z.number().nullable(),
    model: z.string(),
    output: z.array(OutputMessageSchema),
    parallel_tool_calls: z.boolean(),
    previous_response_id: z.string().nullable(),
    reasoning: ReasoningSchema.nullable().optional(),
    store: z.boolean(),
    temperature: z.number(),
    text: TextSchema,
    tool_choice: z.string(),
    tools: z.array(z.unknown()),
    top_p: z.number(),
    truncation: z.string(),
    usage: UsageSchema,
    user: z.string().nullable().optional(),
    metadata: z.record(z.string(), z.unknown()),
    output_text: z.string()
});

export type OutputTextContent = z.infer<typeof OutputTextContentSchema>;
export type OutputMessage = z.infer<typeof OutputMessageSchema>;
export type Reasoning = z.infer<typeof ReasoningSchema>;
export type Usage = z.infer<typeof UsageSchema>;
export type OpenAIResponse = z.infer<typeof OpenAiResponseSchema>;
