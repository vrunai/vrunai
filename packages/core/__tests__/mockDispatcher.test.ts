import { describe, it, expect } from 'vitest';
import { MockDispatcher } from '../runner/mockDispatcher';
import type { Tool } from '@vrunai/types';

const tools: Tool[] = [
    {
        name: 'classify',
        description: 'Classify inquiry',
        input: { message: 'string' },
        output: { type: 'string', urgency: 'string' },
        mock: [
            {
                input: { message: 'order late' },
                output: { type: 'late_delivery', urgency: 'high' },
            },
            {
                input: { message: 'billing question' },
                output: { type: 'billing', urgency: 'low' },
            },
        ],
    },
    {
        name: 'lookup',
        description: 'Lookup order',
        input: { order_id: 'string' },
        output: { found: 'boolean', status: 'string' },
        mock: [
            {
                input: { order_id: 'ORD-1' },
                output: { found: true, status: 'shipped' },
            },
        ],
    },
];

describe('MockDispatcher', () => {
    it('returns exact match output', () => {
        const d = new MockDispatcher(tools);
        const result = d.dispatch('classify', { message: 'order late' });
        expect(result).toEqual({ type: 'late_delivery', urgency: 'high' });
    });

    it('falls back to best partial match', () => {
        const d = new MockDispatcher(tools);
        const result = d.dispatch('classify', { message: 'order late', extra: 'field' });
        expect(result).toEqual({ type: 'late_delivery', urgency: 'high' });
    });

    it('throws for unknown tool', () => {
        const d = new MockDispatcher(tools);
        expect(() => d.dispatch('nonexistent', {})).toThrow('unknown tool "nonexistent"');
    });

    it('throws for tool with no mocks', () => {
        const noMockTools: Tool[] = [
            { name: 'empty', description: 'No mocks', input: {}, output: {} },
        ];
        const d = new MockDispatcher(noMockTools);
        expect(() => d.dispatch('empty', {})).toThrow('no mocks defined');
    });

    it('mock_override takes priority over tool mocks', () => {
        const override = {
            classify: { output: { type: 'overridden', urgency: 'none' } },
        };
        const d = new MockDispatcher(tools, override);
        const result = d.dispatch('classify', { message: 'order late' });
        expect(result).toEqual({ type: 'overridden', urgency: 'none' });
    });
});
