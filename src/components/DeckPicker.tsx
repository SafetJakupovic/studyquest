import { useState } from 'react';
import { View, Text, Pressable, TextInput, Button } from 'react-native';
import { styles } from '../styles/styles';
import type { DeckStats } from '../db/database';

type Props = {
    decks: DeckStats[];
    selectedDeckId: number | null;
    onSelect: (id: number) => void;
    onCreate: (name: string) => void;
};

export function DeckPicker({ decks, selectedDeckId, onSelect, onCreate }: Props) {
    const [newDeckName, setNewDeckName] = useState('');

    function handleCreate() {
        const name = newDeckName.trim();
        if (name === '')
            return;
        onCreate(name);
        setNewDeckName('');
    }

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
                        <Text>{d.name} ({d.due}/{d.total})</Text>
                    </Pressable>
                ))}
            </View>
            <TextInput
                style={styles.input}
                placeholder="Naziv novog špila..."
                value={newDeckName}
                onChangeText={setNewDeckName} />
            <Button title="Dodaj špil" onPress={handleCreate} />
        </View>
    )
}