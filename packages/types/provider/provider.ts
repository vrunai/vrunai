import { z } from 'zod'

export const PredefinedProviderConfigSchema = z.object({
    baseUrl: z.string(), 
    apiKey: z.string(),
});

export const ProviderConfigSchema = z.object({
    baseUrl: z.string(), 
    apiKey: z.string(),
    model: z.string()
});

export const InferenceRequestSchema = z.object({
    input: z.string()
});

export type PredefinedProviderConfig = z.infer<typeof PredefinedProviderConfigSchema>
export type ProviderConfig = z.infer<typeof ProviderConfigSchema>;
export type InferenceRequest = z.infer<typeof InferenceRequestSchema>;