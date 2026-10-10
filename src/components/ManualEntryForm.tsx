import { useState } from 'react';
import { View, Text, TextInput, Button } from 'react-native';
import { styles } from '../styles/styles';
import { ImagePickerField } from './ImagePickerField';
import { AppButton } from './AppButton';

type Props = {
    onAdd: (question: string, answer: string, questionImageUri: string | null, answerImageUri: string | null) => void;
};

export function ManualEntryForm({ onAdd }: Props) {
    const [question, setQuestion] = useState('');
    const [answer, setAnswer] = useState('');
    const [questionImageUri, setQuestionImageUri] = useState<string | null>(null);
    const [answerImageUri, setAnswerImageUri] = useState<string | null>(null);

    function handleAdd() {
        if (question.trim() === '' || answer.trim() === '')
            return;
        onAdd(question.trim(), answer.trim(), questionImageUri, answerImageUri);
        setQuestion('');
        setAnswer('');
        setQuestionImageUri(null);
        setAnswerImageUri(null);
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
            <ImagePickerField
                label="pitanje"
                uri={questionImageUri}
                onChange={setQuestionImageUri}
            />
            <TextInput
                style={styles.input}
                placeholder="Odgovor..."
                value={answer}
                onChangeText={setAnswer}
            />
            <ImagePickerField
                label="odgovor"
                uri={answerImageUri}
                onChange={setAnswerImageUri}
            />
            <AppButton title="Dodaj pitanje" onPress={handleAdd} />
        </View>
    );
}