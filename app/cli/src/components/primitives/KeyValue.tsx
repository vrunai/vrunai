import React from 'react';
import { Box, Text } from 'ink';

export function KeyValue({
    label,
    children,
    labelWidth = 16,
}: {
    label: string;
    children: React.ReactNode;
    labelWidth?: number;
}) {
    return (
        <Box gap={1}>
            <Text dimColor>{label.padEnd(labelWidth)}</Text>
            <Text>{children}</Text>
        </Box>
    );
}
