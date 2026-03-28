/**
 * Node.js-only exports from @vrunai/core.
 * These use fs/path/os and must NOT be imported in browser builds.
 *
 * Usage:
 *   import { parse, saveResults } from '@vrunai/core/node'
 */

import fs from 'fs';
import { parseYamlText } from './adlParser';
import type { AgentSpec } from '@vrunai/types';

// Node.js-only runner utilities
export { saveResults, autoSaveToHistory } from './runner/reporter';
export { printReport, printComparison } from './runner/printer';

// Node.js-only model config (reads ~/.config/vrunai/models.json)
export { loadModelConfig, validateUserModelConfig } from './models/config.js';
export type { ValidateResult } from './models/config.js';

/**
 * Parses a *.yml file (ADL) from disk.
 * @param path - The path to the *.yml file to parse
 */
export function parse(path: string): AgentSpec {
    const file = fs.readFileSync(path, 'utf8');
    return parseYamlText(file);
}
