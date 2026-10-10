import { useEffect, useState } from "react";
import { getQuestionsByDeck, StoredQuestion } from "../db/database";
import { EditQuestionScreen } from "./EditQuestionScreen";
import { BackHandler, Button, Image, Pressable, ScrollView, Text } from "react-native";
import { styles } from "../styles/styles";
import { ScreenBackground } from "../components/ScreenBackground";
import { AppButton } from "../components/AppButton";

type Props = {
    deckId: number;
    deckName: string;
    onExit: () => void;
}

export function ManageDeckScreen({ deckId, deckName, onExit }: Props) {
    const [questions, setQuestions] = useState<StoredQuestion[]>([]);
    const [editing, setEditing] = useState<StoredQuestion | null>(null);

    function refresh() {
        setQuestions(getQuestionsByDeck(deckId));
    }

    useEffect(() => {
        refresh();
    }, [deckId]);
    // pokrenuti ponovo kad se deckId promijeni

    useEffect(() => {
        const subscription = BackHandler.addEventListener('hardwareBackPress', () => {
            if (editing) {
                setEditing(null);
                return true; // mi smo obradili back pritisak, ne propuštaj dalje navigaciji
            }
            return false; // nema šta da zatvorimo ovdje, neka navigacija uradi svoje (izlazak na "Dodaj")
        });

        return () => subscription.remove();
    }, [editing]);

    if (editing) {
        return (
            <EditQuestionScreen
                question={editing}
                onSaved={() => { setEditing(null); refresh(); }}
                onDeleted={() => { setEditing(null); refresh(); }}
                onCancel={() => setEditing(null)}
            />
        );
    }

    return (
        <ScreenBackground>
            <ScrollView contentContainerStyle={styles.container}>
                <Text style={styles.sectionTitle}>{deckName}</Text>
                <Text style={styles.counter}>{questions.length} pitanja</Text>

                {questions.map(q => (
                    <Pressable key={q.id} onPress={() => setEditing(q)} style={[styles.card, { flexDirection: 'row', alignItems: 'center' }]}>
                        {q.questionImageUri && (
                            <Image
                                source={{ uri: q.questionImageUri }}
                                style={{ width: 48, height: 48, borderRadius: 4, marginRight: 12 }}
                                resizeMode="cover" />
                        )}
                        <Text style={[styles.question, { flex: 1 }]}>
                            {q.question.trim() !== '' ? q.question : '(bez teksta - pogledaj sliku)'}
                        </Text>
                    </Pressable>
                ))}

                <AppButton title="Nazad" onPress={onExit} />
            </ScrollView>
        </ScreenBackground>
    );
}