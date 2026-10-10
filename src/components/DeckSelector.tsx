import { View, Text, Pressable } from 'react-native';
import { styles } from '../styles/styles';
import type { DeckStats } from '../db/database';

type Props = {
    decks: DeckStats[];
    selectedDeckId: number | null;
    onSelect: (id: number) => void;
};

export function DeckSelector({ decks, selectedDeckId, onSelect }: Props) {
    return (
        <View style={{ width: '100%' }}>
            <Text style={styles.label}>Špil (učeći/ukupno):</Text>
            <View style={styles.chipRow}>
                {decks.map(d => (
                    <Pressable
                        key={d.id}
                        onPress={() => onSelect(d.id)}
                        style={[styles.chip, d.id === selectedDeckId && styles.chipSelected]}
                    >
                        <Text style={styles.chipText}>{d.name} ({d.due}/{d.total})</Text>
                    </Pressable>
                ))}
            </View>
        </View>
    );
}