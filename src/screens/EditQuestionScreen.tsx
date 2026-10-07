import { useState } from "react";
import { deleteQuestion, StoredQuestion, updateQuestionContent } from "../db/database"
import { Alert, Button, ScrollView, Text, TextInput, View } from "react-native";
import { styles } from "../styles/styles";

type Props = {
    question: StoredQuestion;
    onSaved: () => void;
    onDeleted: () => void;
    onCancel: () => void;
};

export function EditQuestionScreen({ question, onSaved, onDeleted, onCancel }: Props) {
    const [text, setText] = useState(question.question);
    const [answer, setAnswer] = useState(question.answer);

    function handleSave() {
        if (text.trim() == '' || answer.trim() === '')
            return;
        updateQuestionContent(question.id, text.trim(), answer.trim());
        onSaved();
    }

    function handleDelete() {
        Alert.alert('Obriši pitanje?', 'Ovo se ne može poništiti.', [
            { text: 'Otkaži', style: 'cancel' },
            {
                text: 'Obriši', style: 'destructive', onPress: () => {
                    deleteQuestion(question.id);
                    onDeleted();
                }
            },
        ]);
    }

    return (
        <ScrollView contentContainerStyle={styles.container}>
            <Text style={styles.label}>Pitanje:</Text>
            <TextInput style={styles.input} multiline value={text} onChangeText={setText} />

            <Text style={styles.label}>Odgovor:</Text>
            <TextInput style={styles.input} multiline value={answer} onChangeText={setAnswer} />

            <View style={styles.buttonRow}>
                <Button title="Otkaži" color="#888" onPress={onCancel} />
                <Button title="Sačuvaj" onPress={handleSave} />
            </View>

            <Button title="Obriši pitanje" color="#c0392b" onPress={handleDelete} />
        </ScrollView>
    );
}