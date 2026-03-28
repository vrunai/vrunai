import fs from 'fs';
import path from 'path';
import os from 'os';
import { z } from 'zod';
import { ModelConfigSchema, DefaultsFileSchema } from './schema';
import type { ModelConfig } from './schema';
import defaultJson from './default.json' with { type: 'json' };

export { ModelConfigSchema } from './schema';
export type { ModelConfig } from './schema';

const USER_MODELS_PATH = path.join(os.homedir(), '.config', 'vrunai', 'models.json');

function loadDefaults(): ModelConfig[] {
    const result = DefaultsFileSchema.safeParse(defaultJson);
    if (!result.success) {
        throw new Error(`vrunai: default.json is invalid — ${result.error.issues.map(e => `${e.path.map(String).join('.')}: ${e.message}`).join(', ')}`);
    }
    return result.data.models;
}

function loadUserOverrides(): ModelConfig[] {
    try {
        const raw = fs.readFileSync(USER_MODELS_PATH, 'utf8');
        const result = z.array(ModelConfigSchema).safeParse(JSON.parse(raw));
        if (!result.success) {
            console.warn(`Warning: ~/.config/vrunai/models.json is invalid — using defaults.\n${result.error.message}`);
            return [];
        }
        return result.data;
    } catch {
        return [];
    }
}

export function loadModelConfig(): ModelConfig[] {
    const defaults = loadDefaults();
    const overrides = loadUserOverrides();
    const map = new Map(defaults.map(m => [m.id, m]));
    for (const o of overrides) map.set(o.id, o);
    return [...map.values()];
}

export type ValidateResult =
    | { valid: true;  count: number }
    | { valid: false; missing: boolean; errors: string[] };

export function validateUserModelConfig(): ValidateResult {
    if (!fs.existsSync(USER_MODELS_PATH)) {
        return { valid: false, missing: true, errors: [] };
    }
    try {
        const raw = fs.readFileSync(USER_MODELS_PATH, 'utf8');
        const result = z.array(ModelConfigSchema).safeParse(JSON.parse(raw));
        if (result.success) return { valid: true, count: result.data.length };
        return {
            valid: false,
            missing: false,
            errors: result.error.issues.map(e => `${e.path.map(String).join('.')}: ${e.message}`),
        };
    } catch (e) {
        return { valid: false, missing: false, errors: [String(e)] };
    }
}
