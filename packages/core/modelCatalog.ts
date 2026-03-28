import defaultJson from './models/default.json' with { type: 'json' };
import { ModelConfigSchema } from './models/schema';
import type { ModelConfig } from './models/schema';

const MODELS: ModelConfig[] = (() => {
    const parsed = (defaultJson as { models: unknown[] }).models;
    return parsed.map(m => ModelConfigSchema.parse(m));
})();

export function getAllModels(): ModelConfig[] {
    return MODELS;
}

/**
 * Normalize a model ID for fuzzy matching:
 * - Strip date suffixes like "-2025-04-14"
 * - Normalize dots to dashes in version numbers ("2.0" → "2-0")
 * - Lowercase
 */
function normalizeModelId(id: string): string {
    return id
        .toLowerCase()
        .replace(/-\d{4}-\d{2}-\d{2}$/, '')  // strip date suffix
        .replace(/\./g, '-');                   // dots → dashes
}

export function findModel(modelId: string): ModelConfig | undefined {
    // 1. Exact match
    const exact = MODELS.find(m => m.id === modelId);
    if (exact) return exact;

    // 2. Match by short name (without provider prefix)
    const byShortName = MODELS.find(m => m.id.endsWith('/' + modelId));
    if (byShortName) return byShortName;

    // 3. Fuzzy match: normalize both sides and compare
    const normalized = normalizeModelId(modelId);
    return MODELS.find(m => normalizeModelId(m.id) === normalized)
        ?? MODELS.find(m => normalizeModelId(m.id).endsWith('/' + normalized))
        ?? MODELS.find(m => normalizeModelId(m.id.split('/').pop()!) === normalized);
}

export function calculateCost(modelId: string, inputTokens: number, outputTokens: number): number {
    const model = findModel(modelId);
    if (!model) return 0;
    return (
        (inputTokens  / 1_000_000) * model.pricing.input_per_1m_tokens +
        (outputTokens / 1_000_000) * model.pricing.output_per_1m_tokens
    );
}

export function formatContextWindow(n: number): string {
    if (n >= 1_000_000) return `${n / 1_000_000}M`;
    if (n >= 1_000) return `${Math.round(n / 1000)}K`;
    return String(n);
}
