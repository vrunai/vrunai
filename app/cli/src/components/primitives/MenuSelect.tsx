import React, { useState } from 'react';
import { Box, Text, useInput } from 'ink';
import { colors, symbols } from '../../theme.js';

export type MenuItem = {
    label: string;
    description: string;
    value: string;
};

export function MenuSelect({
    items,
    onSelect,
}: {
    items: MenuItem[];
    onSelect: (value: string) => void;
}) {
    const [focusIdx, setFocusIdx] = useState(0);

    useInput((_, key) => {
        if (key.upArrow)   setFocusIdx(i => Math.max(0, i - 1));
        if (key.downArrow) setFocusIdx(i => Math.min(items.length - 1, i + 1));
        if (key.return)    onSelect(items[focusIdx].value);
    });

    return (
        <Box flexDirection="column">
            {items.map((item, i) => {
                const focused = i === focusIdx;
                return (
                    <Box key={item.value} gap={1}>
                        <Text color={focused ? colors.focus : undefined}>
                            {focused ? symbols.cursor : ' '}
                        </Text>
                        <Box width={18}>
                            <Text bold={focused} color={focused ? colors.focus : undefined}>
                                {item.label}
                            </Text>
                        </Box>
                        <Text dimColor>{item.description}</Text>
                    </Box>
                );
            })}
        </Box>
    );
}
