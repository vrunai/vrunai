import { AgentSpec, AgentSpecSchema } from '@vrunai/types';
import YAML from 'yaml';

/**
 * Parses a YAML string into a validated AgentSpec.
 * Browser-safe — no file system access.
 */
export function parseYamlText(text: string): AgentSpec {
    const rawADL = YAML.parse(text);
    const result = AgentSpecSchema.safeParse(rawADL);
    if (!result.success) {
        throw new Error(result.error.message);
    }
    return result.data;
}
