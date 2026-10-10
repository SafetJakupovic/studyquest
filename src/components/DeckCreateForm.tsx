import { View, Text, Button, TextInput } from 'react-native';
import { styles } from '../styles/styles';
import { useState } from 'react';
import { AppButton } from './AppButton';

type Props = {
    onCreate: (name: string) => void;
};

export function DeckCreateForm({ onCreate }: Props) {
    const [newDeckName, setNewDeckName] = useState('');

    function handleCreate() {
        const name = newDeckName.trim();
        if (name == '')
            return;
        onCreate(name);
        setNewDeckName('');
    }

    return (
        <View style={{ width: '100%', marginBottom: 15 }}>
            <Text style={styles.label}>Novi špil:</Text>
            <TextInput
                style={styles.input}
                placeholder="Naziv novog špila..."
                value={newDeckName}
                onChangeText={setNewDeckName}
            />
            <AppButton title="Dodaj špil" onPress={handleCreate} />
        </View>
    )
}