import React from 'react';
import { Box, Text } from 'ink';
import { symbols, spacing } from '../../theme.js';
import { StatusBar } from '../primitives/StatusBar.js';
import type { StatusBarItem } from '../primitives/StatusBar.js';

export function ScreenLayout({
    title,
    helpItems,
    statusLeft,
    children,
}: {
    title: string;
    helpItems: StatusBarItem[];
    statusLeft?: string;
    children: React.ReactNode;
}) {
    return (
        <Box flexDirection="column" paddingX={1}>
            {/* Breadcrumb header */}
            <Box paddingTop={1} paddingLeft={1} gap={1}>
                <Text dimColor>VRUNAI</Text>
                <Text dimColor>{symbols.arrow}</Text>
                <Text bold>{title}</Text>
            </Box>

            {/* Content area */}
            <Box flexDirection="column" paddingTop={1}>
                {children}
            </Box>

            {/* Persistent status bar */}
            <StatusBar items={helpItems} left={statusLeft} />
        </Box>
    );
}
