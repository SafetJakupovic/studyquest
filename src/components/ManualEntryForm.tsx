import { useState } from 'react';
import { View, Text, TextInput } from 'react-native';
import { styles } from '../styles/styles';
import { ImageListPicker } from './ImageListPicker';
import { AppButton } from './AppButton';

type Props = {
    onAdd: (question: string, answer: string, questionImages: string[], answerImages: string[]) => void;
};

export function ManualEntryForm({ onAdd }: Props) {
    const [question, setQuestion] = useState('');
    const [answer, setAnswer] = useState('');
    const [questionImages, setQuestionImages] = useState<string[]>([]);
    const [answerImages, setAnswerImages] = useState<string[]>([]);

    function handleAdd() {
        if (question.trim() === '' || answer.trim() === '') return;
        onAdd(question.trim(), answer.trim(), questionImages, answerImages);
        setQuestion(''); setAnswer(''); setQuestionImages([]); setAnswerImages([]);
    }

    return (
        <View style={{ width: '100%', marginTop: 15 }}>
            <Text style={styles.label}>Ručno dodaj pitanje:</Text>
            <TextInput style={styles.input} placeholder="Pitanje..." value={question} onChangeText={setQuestion} />
            <ImageListPicker label="pitanje" uris={questionImages} onChange={setQuestionImages} />

            <TextInput style={styles.input} placeholder="Odgovor..." value={answer} onChangeText={setAnswer} />
            <ImageListPicker label="odgovor" uris={answerImages} onChange={setAnswerImages} />

            <AppButton title="Dodaj pitanje" onPress={handleAdd} />
        </View>
    );
}