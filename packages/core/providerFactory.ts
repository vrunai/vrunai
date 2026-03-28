import type { Provider, ProviderConfig } from './provider/provider';
import { OpenAIProvider } from './provider/provider_openai';
import { AnthropicProvider } from './provider/provider_anthropic';
import { GoogleProvider } from './provider/provider_google';

export type ProviderKind = 'openai' | 'anthropic' | 'google' | 'xai' | 'deepseek' | 'mistral' | 'custom';

export const PRESETS: Record<ProviderKind, { baseUrl: string; defaultModel: string }> = {
    openai:    { baseUrl: 'https://api.openai.com/v1',                 defaultModel: 'gpt-4.1-mini' },
    anthropic: { baseUrl: 'https://api.anthropic.com',                 defaultModel: 'claude-sonnet-4-6' },
    google:    { baseUrl: 'https://generativelanguage.googleapis.com', defaultModel: 'gemini-2.0-flash' },
    xai:       { baseUrl: 'https://api.x.ai/v1',                      defaultModel: 'grok-3-mini' },
    deepseek:  { baseUrl: 'https://api.deepseek.com/v1',              defaultModel: 'deepseek-chat' },
    mistral:   { baseUrl: 'https://api.mistral.ai/v1',                defaultModel: 'mistral-small-latest' },
    custom:    { baseUrl: '',                                          defaultModel: '' },
} as const;

export function makeProvider(kind: ProviderKind, config: ProviderConfig): Provider {
    switch (kind) {
        case 'openai':    return new OpenAIProvider(config);
        case 'anthropic': return new AnthropicProvider(config);
        case 'google':    return new GoogleProvider(config);
        case 'xai':       return new OpenAIProvider(config);
        case 'deepseek':  return new OpenAIProvider(config);
        case 'mistral':   return new OpenAIProvider(config);
        case 'custom':    return new OpenAIProvider(config);
    }
}
