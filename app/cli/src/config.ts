import fs from 'fs';
import path from 'path';
import os from 'os';
import { parse as parseYaml, stringify as stringifyYaml } from 'yaml';
import type { PredefinedProviderConfig, ProviderConfig } from '@vrunai/types';

// ── Types ─────────────────────────────────────────────────────────────────────

export type SavedProvider =
    | ({ kind: 'predefined'; name: string; preset: 'openai' | 'anthropic' | 'google' | 'xai' | 'deepseek' | 'mistral' } & PredefinedProviderConfig)
    | ({ kind: 'custom';     name: string } & ProviderConfig);

export type VrunaiConfig = { providers: SavedProvider[]; recentPaths?: { cwd: string; path: string }[] };

// ── Paths ─────────────────────────────────────────────────────────────────────

const CONFIG_DIR  = path.join(os.homedir(), '.config', 'vrunai');
const CONFIG_PATH = path.join(CONFIG_DIR, 'config.yaml');

// ── IO ────────────────────────────────────────────────────────────────────────

export function loadConfig(): VrunaiConfig {
    try {
        const raw = fs.readFileSync(CONFIG_PATH, 'utf8');
        const parsed = parseYaml(raw) as VrunaiConfig;
        return { providers: parsed?.providers ?? [], recentPaths: parsed?.recentPaths ?? [] };
    } catch {
        return { providers: [] };
    }
}

export function saveConfig(config: VrunaiConfig): void {
    fs.mkdirSync(CONFIG_DIR, { recursive: true });
    fs.writeFileSync(CONFIG_PATH, stringifyYaml(config), 'utf8');
}

export function addProvider(p: SavedProvider): void {
    const config = loadConfig();
    config.providers.push(p);
    saveConfig(config);
}

export function deleteProvider(index: number): void {
    const config = loadConfig();
    config.providers.splice(index, 1);
    saveConfig(config);
}

export function addRecentPath(path: string): void {
    const config = loadConfig();
    const cwd    = process.cwd();
    const all    = config.recentPaths ?? [];
    const deduped = all.filter(r => !(r.cwd === cwd && r.path === path));
    const current = [{ cwd, path }, ...deduped.filter(r => r.cwd === cwd)].slice(0, 7);
    config.recentPaths = [...current, ...deduped.filter(r => r.cwd !== cwd)];
    saveConfig(config);
}

/** Returns recent spec file paths for the current working directory. */
export function getRecentPaths(): string[] {
    const config = loadConfig();
    const cwd = process.cwd();
    return (config.recentPaths ?? []).filter(r => r.cwd === cwd).map(r => r.path);
}
