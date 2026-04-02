import React from 'react';
import { Box, Text } from 'ink';
import { symbols } from '../../theme.js';
import { StatusBar } from '../primitives/StatusBar.js';
import { useTerminalSize } from '../../hooks/useTerminalSize.js';
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
    const { rows } = useTerminalSize();

    return (
        <Box flexDirection="column" height={rows} paddingX={1}>
            {/* Breadcrumb header */}
            <Box paddingTop={1} paddingLeft={1} gap={1}>
                <Text dimColor>VRUNAI</Text>
                <Text dimColor>{symbols.arrow}</Text>
                <Text bold>{title}</Text>
            </Box>

            {/* Content area — fills available space, clips overflow */}
            <Box flexDirection="column" flexGrow={1} paddingTop={1} overflowY="hidden">
                {children}
            </Box>

            {/* Persistent status bar — pinned to bottom */}
            <StatusBar items={helpItems} left={statusLeft} />
        </Box>
    );
}
