import { View, Text, Button, KeyboardAvoidingView, Platform, ScrollView } from 'react-native';
import { styles } from '../styles/styles';
import { DeckSelector } from '../components/DeckSelector';
import { QuestionCard } from '../components/QuestionCard';
import type { DeckStats, QuestionWithImages, StoredQuestion } from '../db/database';
import type { Grade } from 'ts-fsrs';
import { Rating } from 'ts-fsrs';
import { useFocusEffect } from '@react-navigation/native';
import { useCallback } from 'react';
import { ScreenBackground } from '../components/ScreenBackground';
import { AppButton } from '../components/AppButton';

type Props = {
    decks: DeckStats[];
    selectedDeckId: number | null;
    onSelectDeck: (id: number) => void;
    dueQueue: QuestionWithImages[];
    showAnswer: boolean;
    onStartSession: () => void;
    onShowAnswer: () => void;
    onRate: (grade: Grade) => void;
    info: string;
    navigation: any;
    onFocus: () => void;
};

export function StudyScreen({
    decks, selectedDeckId, onSelectDeck, dueQueue, showAnswer, onStartSession, onShowAnswer, onRate, info, navigation, onFocus }: Props) {
    useFocusEffect(
        useCallback(() => {
            onFocus();
        }, [onFocus])
    );
    return (
        <ScreenBackground>
            <ScrollView>
                <View style={styles.container}>
                    <DeckSelector
                        decks={decks}
                        selectedDeckId={selectedDeckId}
                        onSelect={onSelectDeck}
                    />

                    <View style={styles.divider} />

                    <AppButton
                        title="Boss Fight"
                        variant="secondary"
                        onPress={() => navigation.navigate('BossFight')}
                    />

                    {dueQueue.length === 0 && (
                        <AppButton title="Pokreni dnevnu sesiju" onPress={onStartSession} />
                    )}
                    {info !== '' && <Text style={styles.counter}>{info}</Text>}

                    {/* sesija ponavljanja */}
                    {dueQueue.length > 0 && (
                        <View style={styles.reviewArea}>
                            <Text style={styles.counter}>Preostalo u sesiji: {dueQueue.length}</Text>
                            <QuestionCard
                                question={dueQueue[0].question}
                                answer={showAnswer ? dueQueue[0].answer : undefined}
                                questionImages={dueQueue[0].questionImages}
                                answerImages={showAnswer ? dueQueue[0].answerImages : undefined}
                            />

                            {!showAnswer ? (
                                <AppButton title="Prikazi odgovor" onPress={onShowAnswer} />
                            ) : (
                                <View style={styles.buttonRow}>
                                    <AppButton title="Opet" variant="wine" onPress={() => onRate(Rating.Again)} />
                                    <AppButton title="Teško" variant="rust" onPress={() => onRate(Rating.Hard)} />
                                    <AppButton title="Dobro" variant="slate" onPress={() => onRate(Rating.Good)} />
                                    <AppButton title="Lako" variant="sage" onPress={() => onRate(Rating.Easy)} />
                                </View>
                            )}
                        </View>
                    )}
                </View>
            </ScrollView>
        </ScreenBackground>
    );
}