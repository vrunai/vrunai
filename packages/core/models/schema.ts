import { z } from 'zod';

export const PricingSchema = z.object({
    input_per_1m_tokens:  z.number().nonnegative(),
    output_per_1m_tokens: z.number().nonnegative(),
    currency:             z.string(),
});

export const ModelConfigSchema = z.object({
    id:              z.string(),
    provider:        z.string(),
    name:            z.string(),
    pricing:         PricingSchema,
    context_window:  z.number(),
    supports_tools:  z.boolean(),
    supports_vision: z.boolean(),
    deprecated:      z.boolean(),
});

export type ModelConfig = z.infer<typeof ModelConfigSchema>;

export const DefaultsFileSchema = z.object({
    version: z.string(),
    models:  z.array(ModelConfigSchema),
});
