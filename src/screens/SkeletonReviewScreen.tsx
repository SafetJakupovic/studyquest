// src/screens/SkeletonReviewScreen.tsx
import { useState, useEffect } from 'react';
import { View, Text, ScrollView } from 'react-native';
import { styles } from '../styles/styles';
import { colors, fonts, spacing } from '../styles/theme';
import { ScreenBackground } from '../components/ScreenBackground';
import { AppButton } from '../components/AppButton';
import { QuestionCard } from '../components/QuestionCard';
import { getQuestionsByDeck, applyReviewModeReward, QuestionWithImages, Stats } from '../db/database';

type Props = {
    deckId: number;
    deckName: string;
    onStatsChange: (s: Stats) => void;
    onExit: () => void;
};

function previewText(text: string): string {
    const cleaned = text.replace(/\{\{slika\}\}/g, '').trim();
    return cleaned !== '' ? cleaned : '(samo slika, bez teksta)';
}

export function SkeletonReviewScreen({ deckId, deckName, onStatsChange, onExit }: Props) {
    const [questions, setQuestions] = useState<QuestionWithImages[]>([]);
    const [index, setIndex] = useState(0);
    const [showAnswer, setShowAnswer] = useState(false);
    const [missed, setMissed] = useState<QuestionWithImages[]>([]);
    const [knownCount, setKnownCount] = useState(0);
    const [earned, setEarned] = useState(0);

    useEffect(() => {
        setQuestions(getQuestionsByDeck(deckId)); // cijeli špil, bez obzira na FSRS raspored
    }, [deckId]);

    function handleAnswer(wasKnown: boolean) {
        const current = questions[index];
        if (wasKnown) {
            const { stats, rewarded } = applyReviewModeReward([current.id]);
            onStatsChange(stats);
            setKnownCount(prev => prev + 1);
            setEarned(prev => prev + rewarded);
        } else {
            setMissed(prev => [...prev, current]);
        }
        setIndex(prev => prev + 1);
        setShowAnswer(false);
    }

    if (questions.length === 0) {
        return (
            <ScreenBackground>
                <View style={[styles.container, { flex: 1, justifyContent: 'center' }]}>
                    <Text style={{ fontFamily: fonts.body, color: colors.inkMuted, textAlign: 'center' }}>
                        Ovaj špil je prazan.
                    </Text>
                    <AppButton title="Nazad" variant="secondary" onPress={onExit} />
                </View>
            </ScreenBackground>
        );
    }

    if (index >= questions.length) {
        const hardest = [...questions].filter(q => q.lapses > 0).sort((a, b) => b.lapses - a.lapses).slice(0, 5);

        return (
            <ScreenBackground>
                <ScrollView contentContainerStyle={[styles.container, { justifyContent: 'center' }]}>
                    <Text style={{ fontFamily: fonts.display, fontSize: 24, color: colors.gold, textAlign: 'center' }}>
                        Pregled gotov
                    </Text>
                    <Text style={styles.counter}>Znao si {knownCount} od {questions.length} kartica iz "{deckName}".</Text>
                    <Text style={[styles.counter, { color: colors.gold }]}>
                        Zarađeno: +{earned} coins (kartica nosi coin samo jednom dnevno)
                    </Text>

                    {missed.length > 0 && (
                        <>
                            <View style={styles.divider} />
                            <Text style={[styles.sectionTitle, { alignSelf: 'center' }]}>Nisi znao</Text>
                            {missed.map(q => (
                                <Text key={q.id} style={{ fontFamily: fonts.card, fontSize: 15, color: colors.ink, width: '100%', paddingVertical: spacing.xs }}>
                                    • {previewText(q.question)}
                                </Text>
                            ))}
                        </>
                    )}

                    {hardest.length > 0 && (
                        <>
                            <View style={styles.divider} />
                            <Text style={[styles.sectionTitle, { alignSelf: 'center' }]}>⚠️ Najteža pitanja (cijela istorija)</Text>
                            {hardest.map(q => (
                                <View key={q.id} style={{ width: '100%', paddingVertical: spacing.xs }}>
                                    <Text style={{ fontFamily: fonts.card, fontSize: 15, color: colors.ink }}>{previewText(q.question)}</Text>
                                    <Text style={{ fontFamily: fonts.body, fontSize: 12, color: colors.wine }}>
                                        Zaboravljeno {q.lapses} {q.lapses === 1 ? 'put' : 'puta'}
                                    </Text>
                                </View>
                            ))}
                        </>
                    )}

                    <AppButton title="Nazad" onPress={onExit} />
                </ScrollView>
            </ScreenBackground>
        );
    }

    const current = questions[index];

    return (
        <ScreenBackground>
            <ScrollView contentContainerStyle={styles.container}>
                <Text style={{ fontFamily: fonts.display, fontSize: 18, color: colors.gold }}>
                    📖 Pregled gradiva — {deckName}
                </Text>
                <Text style={styles.counter}>{index + 1} / {questions.length}</Text>

                <QuestionCard
                    question={current.question}
                    answer={showAnswer ? current.answer : undefined}
                    questionImages={current.questionImages}
                    answerImages={showAnswer ? current.answerImages : undefined}
                />

                {!showAnswer ? (
                    <AppButton title="Prikaži odgovor" onPress={() => setShowAnswer(true)} />
                ) : (
                    <View style={styles.buttonRow}>
                        <AppButton title="✕ Nisam znao" variant="wine" onPress={() => handleAnswer(false)} />
                        <AppButton title="✓ Znao sam" variant="sage" onPress={() => handleAnswer(true)} />
                    </View>
                )}
                <AppButton title="Prekini pregled" variant="secondary" onPress={onExit} />
            </ScrollView>
        </ScreenBackground>
    );
}