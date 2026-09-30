import { useState } from 'react';
import { View, Text, TextInput, Button } from 'react-native';
import { styles } from '../styles/styles';

type Props = {
    onAdd: (question: string, answer: string) => void;
};

export function ManualEntryForm({ onAdd }: Props) {
    const [question, setQuestion] = useState('');
    const [answer, setAnswer] = useState('');

    function handleAdd() {
        if (question.trim() === '' || answer.trim() === '')
            return;
        onAdd(question.trim(), answer.trim());
        setQuestion('');
        setAnswer('');
    }

    return (
        <View style={{ width: '100%', marginTop: 15 }}>
            <Text style={styles.label}>Ručno dodaj pitanje:</Text>
            <TextInput
                style={styles.input}
                placeholder="Pitanje..."
                value={question}
                onChangeText={setQuestion}
            />
            <TextInput
                style={styles.input}
                placeholder="Odgovor..."
                value={answer}
                onChangeText={setAnswer}
            />
            <Button title="Dodaj pitanje" onPress={handleAdd} />
        </View>
    );
}