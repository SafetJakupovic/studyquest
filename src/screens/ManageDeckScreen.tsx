import { useEffect, useState } from "react";
import { getLeechQuestions, getQuestionsByDeck, QuestionWithImages, Stats, StoredQuestion } from "../db/database";
import { EditQuestionScreen } from "./EditQuestionScreen";
import { BackHandler, Button, Image, Pressable, ScrollView, Text, View } from "react-native";
import { styles } from "../styles/styles";
import { ScreenBackground } from "../components/ScreenBackground";
import { AppButton } from "../components/AppButton";

type Props = {
    deckId: number;
    deckName: string;
    stats: Stats;
    onExit: () => void;
}

export function ManageDeckScreen({ deckId, deckName, stats, onExit }: Props) {
    const [questions, setQuestions] = useState<QuestionWithImages[]>([]);
    const [editing, setEditing] = useState<StoredQuestion | null>(null);
    const [showLeechOnly, setShowLeechOnly] = useState(false);

    function refresh() {
        setQuestions(showLeechOnly ? getLeechQuestions(deckId) : getQuestionsByDeck(deckId));
    }

    useEffect(() => {
        refresh();
    }, [deckId, showLeechOnly]);
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
                stats={stats}
            />
        );
    }

    return (
        <ScreenBackground>
            <ScrollView contentContainerStyle={styles.container}>
                <Text style={styles.sectionTitle}>{deckName}</Text>

                <View style={styles.buttonRow}>
                    <AppButton
                        title="Sve kartice"
                        variant={!showLeechOnly ? 'primary' : 'secondary'}
                        onPress={() => setShowLeechOnly(false)}
                    />
                    <AppButton
                        title="⚠️ Samo izbačene"
                        variant={showLeechOnly ? 'primary' : 'secondary'}
                        onPress={() => setShowLeechOnly(true)}
                    />
                </View>

                <Text style={styles.counter}>{questions.length} pitanja</Text>

                {questions.map(q => (
                    <Pressable key={q.id} onPress={() => setEditing(q)} style={[styles.card, { flexDirection: 'row', alignItems: 'center' }]}>
                        {q.questionImages[0] && (
                            <Image
                                source={{ uri: q.questionImages[0] }}
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