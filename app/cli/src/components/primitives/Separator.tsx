import React from 'react';
import { Box, Text } from 'ink';
import { symbols } from '../../theme.js';

/** Responsive horizontal separator that adapts to terminal width. */
export function Separator({ width, paddingLeft = 0 }: { width?: number; paddingLeft?: number }) {
    const w = width ?? Math.max(20, (process.stdout.columns ?? 80) - paddingLeft - 4);
    return (
        <Box paddingLeft={paddingLeft}>
            <Text dimColor>{symbols.separator.repeat(w)}</Text>
        </Box>
    );
}
