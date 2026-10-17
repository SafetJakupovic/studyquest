import { useState, useEffect } from 'react';
import { View, Text, TextInput, ScrollView, Alert } from 'react-native';
import { styles } from '../styles/styles';
import { ScreenBackground } from '../components/ScreenBackground';
import { AppButton } from '../components/AppButton';
import { ImageListPicker } from '../components/ImageListPicker';
import { updateQuestionContent, setQuestionImages, deleteQuestion, getImagesForQuestion, StoredQuestion, LEECH_THRESHOLD, resetLeech, Stats } from '../db/database';
import { colors, fonts, spacing } from '../styles/theme';

type Props = {
    question: StoredQuestion;
    onSaved: () => void;
    onDeleted: () => void;
    onCancel: () => void;
    stats: Stats;
};

export function EditQuestionScreen({ question, onSaved, onDeleted, onCancel, stats }: Props) {
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
                <Text style={styles.counter}>Ubaci "{'{{slika}}'}" gdje želiš sliku (redom kako dodaješ slike ispod)</Text>
                <Text style={styles.label}>Pitanje:</Text>
                {question.consecutiveFails >= stats.leechThreshold && (
                    <View style={{ backgroundColor: colors.wine, borderRadius: 4, padding: spacing.sm, marginBottom: spacing.md, width: '100%' }}>
                        <Text style={{ fontFamily: fonts.bodySemiBold, color: colors.ink }}>
                            ⚠️ Teška kartica — {question.consecutiveFails} promašaja zaredom
                        </Text>
                        <AppButton
                            title="Vrati u rotaciju"
                            variant="secondary"
                            onPress={() => { resetLeech(question.id); onSaved(); }}
                        />
                    </View>
                )}
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