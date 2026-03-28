import { Tool } from '@vrunai/types';
import { FunctionToolDefinition } from '../provider/provider';

const ADL_TYPE_TO_JSON_SCHEMA: Record<string, string> = {
    string: 'string',
    number: 'number',
    boolean: 'boolean',
};

export function formatTools(tools: Tool[]): FunctionToolDefinition[] {
    return tools.map(tool => {
        const properties: Record<string, { type: string }> = {};
        for (const [field, adlType] of Object.entries(tool.input)) {
            const jsonType = ADL_TYPE_TO_JSON_SCHEMA[String(adlType)] ?? 'string';
            properties[field] = { type: jsonType };
        }

        return {
            name: tool.name,
            description: tool.description,
            parameters: {
                type: 'object',
                properties,
                required: Object.keys(tool.input),
            },
        };
    });
}
