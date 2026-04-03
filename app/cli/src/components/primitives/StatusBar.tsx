import React from 'react';
import { Box, Text, Spacer } from 'ink';
import { symbols, colors } from '../../theme.js';

export type StatusBarItem = { key: string; action: string };

export function StatusBar({ items, left }: { items: StatusBarItem[]; left?: string }) {
    const shortcuts = items.map(i => `${i.key} ${i.action}`).join(`  ${symbols.dot}  `);
    return (
        <Box
            borderStyle="single"
            borderTop
            borderBottom={false}
            borderLeft={false}
            borderRight={false}
            borderColor={colors.muted}
            paddingX={1}
        >
            {left && <Text dimColor>{left}</Text>}
            <Spacer />
            <Text dimColor>{shortcuts}</Text>
        </Box>
    );
}
