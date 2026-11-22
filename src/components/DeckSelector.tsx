// src/components/DeckSelector.tsx
import { useState } from 'react';
import { View, Text, Pressable, Modal, ScrollView, StyleSheet } from 'react-native';
import { styles } from '../styles/styles';
import { colors, fonts, spacing } from '../styles/theme';
import type { DeckStats } from '../db/database';

type Props = {
    decks: DeckStats[];
    selectedDeckId: number | null;
    onSelect: (id: number) => void;
};

function Badge({ label, value, color }: { label: string; value: number; color: string }) {
    return (
        <View style={[local.badge, { backgroundColor: color + '26', borderColor: color + '88' }]}>
            <Text style={[local.badgeValue, value === 0 && { color: colors.inkMuted }]}>{value}</Text>
            <Text style={local.badgeLabel}>{label}</Text>
        </View>
    );
}

function BadgeRow({ deck }: { deck: DeckStats }) {
    return (
        <View style={local.badgeRow}>
            <Badge label="danas" value={deck.due} color={colors.sage} />
            <Badge label="novo" value={deck.newCards} color={colors.rust} />
            <Badge label="ukupno" value={deck.total} color={colors.slate} />
        </View>
    );
}

export function DeckSelector({ decks, selectedDeckId, onSelect }: Props) {
    const [open, setOpen] = useState(false);
    const selected = decks.find(d => d.id === selectedDeckId);

    return (
        <View style={{ width: '100%' }}>
            <Text style={styles.label}>Špil:</Text>

            <Pressable onPress={() => setOpen(true)} style={local.current}>
                <View style={{ flex: 1 }}>
                    <Text style={local.currentName}>{selected?.name ?? 'Izaberi špil'}</Text>
                    {selected && <BadgeRow deck={selected} />}
                </View>
                <Text style={local.chevron}>▾</Text>
            </Pressable>

            <Modal visible={open} transparent animationType="fade" onRequestClose={() => setOpen(false)}>
                <Pressable style={local.backdrop} onPress={() => setOpen(false)}>
                    <Pressable style={local.sheet} onPress={() => { }}>
                        <Text style={local.sheetTitle}>Izaberi špil</Text>
                        <ScrollView>
                            {decks.map(d => {
                                const isSelected = d.id === selectedDeckId;
                                return (
                                    <Pressable
                                        key={d.id}
                                        onPress={() => { onSelect(d.id); setOpen(false); }}
                                        style={[local.row, isSelected && local.rowSelected]}
                                    >
                                        <Text style={local.rowName} numberOfLines={1}>
                                            {isSelected ? '✓ ' : ''}{d.name}
                                        </Text>
                                        <BadgeRow deck={d} />
                                    </Pressable>
                                );
                            })}
                        </ScrollView>
                    </Pressable>
                </Pressable>
            </Modal>
        </View>
    );
}

const local = StyleSheet.create({
    current: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: colors.surface,
        borderWidth: 1,
        borderColor: colors.gold,
        borderRadius: 6,
        padding: spacing.sm,
        marginBottom: spacing.sm,
    },
    currentName: {
        fontFamily: fonts.display,
        fontSize: 18,
        color: colors.ink,
        marginBottom: 6
    },
    chevron: {
        color: colors.gold,
        fontSize: 18,
        marginLeft: spacing.sm
    },
    badgeRow: {
        flexDirection: 'row',
        gap: 6,
        flexWrap: 'wrap'
    },
    badge: {
        flexDirection: 'row',
        alignItems: 'baseline',
        paddingHorizontal: 7,
        paddingVertical: 3,
        gap: 4,
    },
    badgeValue: {
        fontFamily: fonts.bodySemiBold,
        fontSize: 13,
        color: colors.ink
    },
    badgeLabel: {
        fontFamily: fonts.body,
        fontSize: 11,
        color: colors.inkMuted
    },
    backdrop: {
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.75)',
        justifyContent: 'center',
        padding: spacing.lg
    },
    sheet: {
        backgroundColor: colors.surface,
        borderWidth: 1,
        borderColor: colors.gold,
        borderRadius: 6,
        maxHeight: '75%',
        padding: spacing.md,
    },
    sheetTitle: {
        fontFamily: fonts.display,
        fontSize: 19,
        color: colors.gold,
        textAlign: 'center',
        marginBottom: spacing.sm
    },
    row: {
        paddingVertical: 12,
        paddingHorizontal: spacing.sm,
        borderBottomWidth: 1,
        borderBottomColor: colors.border,
    },
    rowSelected: {
        backgroundColor: colors.surfaceAlt
    },
    rowName: {
        fontFamily: fonts.body,
        fontSize: 15,
        color: colors.ink,
        marginBottom: 5
    },
});