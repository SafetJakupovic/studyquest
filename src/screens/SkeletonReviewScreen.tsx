// da ne brisem pa ponovo pisem nov fajl, samo sam iskoristio ovo za drugacini nacin ponavljanja gradiva, a ostavio ime
import { useState, useEffect } from 'react';
import { View, Text, ScrollView } from 'react-native';
import { styles } from '../styles/styles';
import { colors, fonts, spacing } from '../styles/theme';
import { ScreenBackground } from '../components/ScreenBackground';
import { AppButton } from '../components/AppButton';
import { QuestionCard } from '../components/QuestionCard';
import { getQuestionsByDeck, QuestionWithImages } from '../db/database';

type Props = {
    deckId: number;
    deckName: string;
    onExit: () => void;
};

export function SkeletonReviewScreen({ deckId, deckName, onExit }: Props) {
    const [questions, setQuestions] = useState<QuestionWithImages[]>([]);
    const [index, setIndex] = useState(0);
    const [showAnswer, setShowAnswer] = useState(false);

    useEffect(() => {
        setQuestions(getQuestionsByDeck(deckId)); // cijeli špil, bez obzira na FSRS raspored
    }, [deckId]);

    function handleNext() {
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
                <ScrollView contentContainerStyle={[styles.container, { flex: 1, justifyContent: 'center' }]}>
                    <Text style={{ fontFamily: fonts.display, fontSize: 24, color: colors.gold, textAlign: 'center' }}>
                        Pregled gotov
                    </Text>
                    <Text style={styles.counter}>Prošao si {questions.length} kartica iz "{deckName}".</Text>

                    {hardest.length > 0 && (
                        <>
                            <View style={styles.divider} />
                            <Text style={[styles.sectionTitle, { alignSelf: 'center' }]}>⚠️ Najteža pitanja</Text>
                            {hardest.map(q => (
                                <View key={q.id} style={{ width: '100%', paddingVertical: spacing.xs }}>
                                    <Text style={{ fontFamily: fonts.body, color: colors.ink }}>{q.question}</Text>
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
                    <AppButton title="Sljedeće" onPress={handleNext} />
                )}
                <AppButton title="Prekini pregled" variant="secondary" onPress={onExit} />
            </ScrollView>
        </ScreenBackground>
    );
}