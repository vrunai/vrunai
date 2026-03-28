import fs from 'fs';
import path from 'path';
import os from 'os';
import { ScenarioMetrics, ComparisonResult } from '@vrunai/types';

const HISTORY_DIR = path.join(os.homedir(), '.config', 'vrunai', 'history');

export function saveResults(
    results: ComparisonResult[] | ScenarioMetrics[],
    outputDir = './results',
    baseName?: string
): string {
    fs.mkdirSync(outputDir, { recursive: true });
    const timestamp = new Date().toISOString().slice(0, 16).replace(/:/g, '-');
    const fileName = baseName ? `${baseName}_-_${timestamp}` : timestamp;
    const filePath = path.join(outputDir, `${fileName}.json`);
    fs.writeFileSync(filePath, JSON.stringify(results, null, 2));
    return filePath;
}

export function autoSaveToHistory(
    results: ComparisonResult[] | ScenarioMetrics[],
    baseName: string
): void {
    try {
        saveResults(results, HISTORY_DIR, baseName);
    } catch { /* never block the UI */ }
}
