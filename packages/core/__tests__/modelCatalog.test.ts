import { describe, it, expect } from 'vitest';
import { getAllModels, calculateCost, formatContextWindow, findModel } from '../modelCatalog';

describe('getAllModels', () => {
    it('returns a non-empty array', () => {
        const models = getAllModels();
        expect(models.length).toBeGreaterThan(0);
    });

    it('each model has required fields', () => {
        for (const m of getAllModels()) {
            expect(m.id).toBeTruthy();
            expect(m.provider).toBeTruthy();
            expect(m.name).toBeTruthy();
            expect(m.pricing.input_per_1m_tokens).toBeGreaterThanOrEqual(0);
            expect(m.pricing.output_per_1m_tokens).toBeGreaterThanOrEqual(0);
        }
    });
});

describe('findModel', () => {
    it('matches by exact ID', () => {
        expect(findModel('openai/gpt-4o')?.name).toBe('GPT-4o');
    });

    it('matches by short name (without provider prefix)', () => {
        expect(findModel('gpt-4o')?.id).toBe('openai/gpt-4o');
    });

    it('matches with date suffix stripped', () => {
        // User passes versioned name, catalog has unversioned
        expect(findModel('gpt-4.1-mini-2025-04-14')?.id).toBe('openai/gpt-4.1-mini');
    });

    it('matches with dots normalized to dashes', () => {
        // Google API uses dots, catalog uses dashes
        expect(findModel('gemini-2.0-flash')?.id).toBe('google/gemini-2-0-flash');
    });

    it('matches deepseek-chat API name', () => {
        expect(findModel('deepseek-chat')?.provider).toBe('deepseek');
    });

    it('matches mistral-small-latest API name', () => {
        expect(findModel('mistral-small-latest')?.provider).toBe('mistral');
    });

    it('returns undefined for unknown model', () => {
        expect(findModel('nonexistent/model')).toBeUndefined();
    });
});

describe('calculateCost', () => {
    it('returns 0 for unknown model', () => {
        expect(calculateCost('nonexistent/model', 1000, 1000)).toBe(0);
    });

    it('returns 0 for zero tokens', () => {
        const models = getAllModels();
        expect(calculateCost(models[0].id, 0, 0)).toBe(0);
    });

    it('calculates cost based on pricing', () => {
        const models = getAllModels();
        const model = models[0];
        const cost = calculateCost(model.id, 1_000_000, 1_000_000);
        const expected = model.pricing.input_per_1m_tokens + model.pricing.output_per_1m_tokens;
        expect(cost).toBeCloseTo(expected, 4);
    });

    it('matches model by short name', () => {
        const models = getAllModels();
        const model = models[0];
        const shortName = model.id.split('/').pop()!;
        const cost = calculateCost(shortName, 1_000_000, 0);
        expect(cost).toBeGreaterThan(0);
    });

    it('calculates cost for all default preset models', () => {
        // These are the actual model IDs used by provider presets
        const presetModels = [
            'gpt-4.1-mini',
            'claude-sonnet-4-6',
            'gemini-2.0-flash',
            'grok-3-mini',
            'deepseek-chat',
            'mistral-small-latest',
        ];
        for (const modelId of presetModels) {
            const cost = calculateCost(modelId, 1_000_000, 1_000_000);
            expect(cost, `${modelId} should have non-zero cost`).toBeGreaterThan(0);
        }
    });
});

describe('formatContextWindow', () => {
    it('formats millions', () => {
        expect(formatContextWindow(1_000_000)).toBe('1M');
        expect(formatContextWindow(2_000_000)).toBe('2M');
    });

    it('formats thousands', () => {
        expect(formatContextWindow(128_000)).toBe('128K');
        expect(formatContextWindow(8_000)).toBe('8K');
    });

    it('formats small numbers as-is', () => {
        expect(formatContextWindow(500)).toBe('500');
    });
});
