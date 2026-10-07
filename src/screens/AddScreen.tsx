import { View, Text, Button, TextInput, ActivityIndicator, ScrollView } from 'react-native';
import { styles } from '../styles/styles';
import { QuestionCard } from '../components/QuestionCard';
import type { Question } from '../api/gemini';
import { ManualEntryForm } from '../components/ManualEntryForm';
import { DeckCreateForm } from '../components/DeckCreateForm';

type Props = {
    text: string;
    onChangeText: (t: string) => void;
    onSubmit: () => void;
    loading: boolean;
    error: string;
    saved: number;
    deckName: string | undefined;
    pendingQueue: Question[];
    onAccept: () => void;
    onReject: () => void;
    onManualAdd: (question: string, answer: string, questionImageUri: string | null, answerImageUri: string | null) => void;
    onCreateDeck: (name: string) => void;
};

export function AddScreen({
    text, onChangeText, onSubmit, loading, error, saved, deckName, pendingQueue, onAccept, onReject, onManualAdd, onCreateDeck }: Props) {
    const currentQuestion = pendingQueue[0];
    return (
        <ScrollView contentContainerStyle={styles.container}>
            {
                pendingQueue.length === 0 && (
                    <>
                        <Text style={styles.label}>Unesi gradivo:</Text>
                        <TextInput
                            style={styles.input}
                            multiline
                            placeholder="Zalijepi tekst ovdje..."
                            value={text}
                            onChangeText={onChangeText}
                        />
                        {/* disabled loading da se ne moze kliknuti dva puta dok se generise*/}

                        <Text style={styles.counter}>Pitanja idu u špil: {deckName}</Text>

                        <Button title="Generisi pitanja" onPress={onSubmit} disabled={loading} />
                        <Text>Ukupno sacuvano: {saved}</Text>
                        {loading && <ActivityIndicator style={{ marginTop: 20 }} />}
                        {error !== '' && <Text style={styles.error}>Greska: {error}</Text>}
                        <ManualEntryForm onAdd={onManualAdd} />

                    </>
                )
            }

            {/* ako ima pending pitanja, prikazi prvo pitanje i dugmice za prihvati/odbaci */}
            {
                currentQuestion && (
                    <View style={styles.reviewArea}>
                        <Text style={styles.counter}>Preostalo za pregled: {pendingQueue.length}</Text>
                        <QuestionCard
                            question={currentQuestion.question}
                            answer={currentQuestion.answer}
                        />
                        <View style={styles.buttonRow}>
                            <Button title="Odbaci" color="#c0392b" onPress={onReject} />
                            <Button title="Prihvati" color="#27ae60" onPress={onAccept} />
                        </View>
                    </View>
                )
            }
            <DeckCreateForm onCreate={onCreateDeck} />
        </ScrollView>
    );
}