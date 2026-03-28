import { describe, it, expect } from 'vitest';
import { formatTools } from '../runner/toolFormatter';
import type { Tool } from '@vrunai/types';

describe('formatTools', () => {
    it('converts ADL tools to JSON Schema format', () => {
        const tools: Tool[] = [
            {
                name: 'classify',
                description: 'Classify inquiry',
                input: { message: 'string', priority: 'number' },
                output: { type: 'string' },
            },
        ];

        const result = formatTools(tools);
        expect(result).toHaveLength(1);
        expect(result[0]).toEqual({
            name: 'classify',
            description: 'Classify inquiry',
            parameters: {
                type: 'object',
                properties: {
                    message: { type: 'string' },
                    priority: { type: 'number' },
                },
                required: ['message', 'priority'],
            },
        });
    });

    it('handles boolean type', () => {
        const tools: Tool[] = [
            {
                name: 'check',
                description: 'Check status',
                input: { active: 'boolean' },
                output: { result: 'boolean' },
            },
        ];

        const result = formatTools(tools);
        const props = result[0].parameters.properties as Record<string, { type: string }>;
        expect(props.active).toEqual({ type: 'boolean' });
    });

    it('handles empty input', () => {
        const tools: Tool[] = [
            {
                name: 'noop',
                description: 'No-op',
                input: {},
                output: {},
            },
        ];

        const result = formatTools(tools);
        expect(result[0].parameters.properties).toEqual({});
        expect(result[0].parameters.required).toEqual([]);
    });
});
