import React from 'react';
import { Box, Text } from 'ink';
import { borders, colors } from '../../theme.js';

export function Panel({
    title,
    titleColor,
    borderColor,
    borderStyle,
    children,
}: {
    title?: string;
    titleColor?: string;
    borderColor?: string;
    borderStyle?: string;
    children: React.ReactNode;
}) {
    return (
        <Box
            flexDirection="column"
            borderStyle={(borderStyle ?? borders.panel) as any}
            borderColor={borderColor ?? colors.muted}
            paddingX={1}
        >
            {title && <Text bold color={titleColor}>{title}</Text>}
            {children}
        </Box>
    );
}
