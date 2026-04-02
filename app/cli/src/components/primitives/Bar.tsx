import React from 'react';
import { Text } from 'ink';
import { colors, symbols } from '../../theme.js';

export function Bar({ done, total, width = 20 }: { done: number; total: number; width?: number }) {
    const filled = total > 0 ? Math.round((done / total) * width) : 0;
    return (
        <Text>
            <Text color={colors.success}>{symbols.filled.repeat(filled)}</Text>
            <Text dimColor>{symbols.empty.repeat(width - filled)}</Text>
        </Text>
    );
}
