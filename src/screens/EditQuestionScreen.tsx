import { useState, useEffect } from 'react';
import { View, Text, TextInput, ScrollView, Alert } from 'react-native';
import { styles } from '../styles/styles';
import { ScreenBackground } from '../components/ScreenBackground';
import { AppButton } from '../components/AppButton';
import { ImageListPicker } from '../components/ImageListPicker';
import { updateQuestionContent, setQuestionImages, deleteQuestion, getImagesForQuestion, StoredQuestion } from '../db/database';

type Props = {
    question: StoredQuestion;
    onSaved: () => void;
    onDeleted: () => void;
    onCancel: () => void;
};

export function EditQuestionScreen({ question, onSaved, onDeleted, onCancel }: Props) {
    const [text, setTextQ] = useState(question.question);
    const [answer, setAnswer] = useState(question.answer);
    const [questionImages, setQuestionImagesState] = useState<string[]>([]);
    const [answerImages, setAnswerImagesState] = useState<string[]>([]);

    useEffect(() => {
        const imgs = getImagesForQuestion(question.id);
        setQuestionImagesState(imgs.question);
        setAnswerImagesState(imgs.answer);
    }, [question.id]);

    function handleSave() {
        if (text.trim() === '' || answer.trim() === '') return;
        updateQuestionContent(question.id, text.trim(), answer.trim());
        setQuestionImages(question.id, 'question', questionImages);
        setQuestionImages(question.id, 'answer', answerImages);
        onSaved();
    }

    function handleDelete() {
        Alert.alert('Obriši pitanje?', 'Ovo se ne može poništiti.', [
            { text: 'Otkaži', style: 'cancel' },
            { text: 'Obriši', style: 'destructive', onPress: () => { deleteQuestion(question.id); onDeleted(); } },
        ]);
    }

    return (
        <ScreenBackground>
            <ScrollView contentContainerStyle={styles.container}>
                <Text style={styles.label}>Pitanje:</Text>
                <TextInput style={styles.input} multiline value={text} onChangeText={setTextQ} />
                <ImageListPicker label="pitanje" uris={questionImages} onChange={setQuestionImagesState} />

                <Text style={styles.label}>Odgovor:</Text>
                <TextInput style={styles.input} multiline value={answer} onChangeText={setAnswer} />
                <ImageListPicker label="odgovor" uris={answerImages} onChange={setAnswerImagesState} />

                <View style={styles.buttonRow}>
                    <AppButton title="Otkaži" variant="secondary" onPress={onCancel} />
                    <AppButton title="Sačuvaj" onPress={handleSave} />
                </View>
                <AppButton title="🗑 Obriši pitanje" variant="danger" onPress={handleDelete} />
            </ScrollView>
        </ScreenBackground>
    );
}