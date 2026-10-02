import { View, Text, Button } from 'react-native';
import { styles } from '../styles/styles';
import { DeckSelector } from '../components/DeckSelector';
import { QuestionCard } from '../components/QuestionCard';
import type { DeckStats, StoredQuestion } from '../db/database';
import type { Grade } from 'ts-fsrs';
import { Rating } from 'ts-fsrs';

type Props = {
    decks: DeckStats[];
    selectedDeckId: number | null;
    onSelectDeck: (id: number) => void;
    dueQueue: StoredQuestion[];
    showAnswer: boolean;
    onStartSession: () => void;
    onShowAnswer: () => void;
    onRate: (grade: Grade) => void;
    info: string;
    navigation: any;
};

export function StudyScreen({
    decks, selectedDeckId, onSelectDeck, dueQueue, showAnswer, onStartSession, onShowAnswer, onRate, info, navigation }: Props) {
    return (
        <View style={styles.container}>
            <DeckSelector
                decks={decks}
                selectedDeckId={selectedDeckId}
                onSelect={onSelectDeck}
            />

            <Button
                title="Boss Fight"
                color="#8e44ad"
                onPress={() => navigation.navigate('BossFight')}
            />

            {dueQueue.length === 0 && (
                <Button title="Pokreni dnevnu sesiju" onPress={onStartSession} />
            )}
            {info !== '' && <Text style={styles.counter}>{info}</Text>}

            {/* sesija ponavljanja */}
            {dueQueue.length > 0 && (
                <View style={styles.reviewArea}>
                    <Text style={styles.counter}>Preostalo u sesiji: {dueQueue.length}</Text>
                    <QuestionCard
                        question={dueQueue[0].question}
                        answer={showAnswer ? dueQueue[0].answer : undefined}
                    />

                    {!showAnswer ? (
                        <Button title="Prikazi odgovor" onPress={onShowAnswer} />
                    ) : (
                        <View style={styles.buttonRow}>
                            <Button title="Opet" color="#c0392b" onPress={() => onRate(Rating.Again)} />
                            <Button title="Teško" color="#e67e22" onPress={() => onRate(Rating.Hard)} />
                            <Button title="Dobro" color="#27ae60" onPress={() => onRate(Rating.Good)} />
                            <Button title="Lako" color="#2980b9" onPress={() => onRate(Rating.Easy)} />
                        </View>
                    )}
                </View>
            )}
        </View>
    );
}