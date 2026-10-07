import { useEffect, useState } from "react";
import { getQuestionsByDeck, StoredQuestion } from "../db/database";
import { EditQuestionScreen } from "./EditQuestionScreen";
import { Button, Pressable, ScrollView, Text } from "react-native";
import { styles } from "../styles/styles";

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
        <ScrollView contentContainerStyle={styles.container}>
            <Text style={{ fontSize: 20, fontWeight: 'bold', marginBottom: 10 }}>{deckName}</Text>
            <Text style={styles.counter}>{questions.length} pitanja</Text>

            {questions.map(q => (
                <Pressable key={q.id} onPress={() => setEditing(q)} style={styles.card}>
                    <Text style={styles.question}>{q.question}</Text>
                </Pressable>
            ))}

            <Button title="Nazad" onPress={onExit} />
        </ScrollView>
    );
}