import { useState, useEffect } from 'react';
import { View, Text, ScrollView } from 'react-native';
import { styles } from '../styles/styles';
import { colors, fonts } from '../styles/theme';
import { ScreenBackground } from '../components/ScreenBackground';
import { AppButton } from '../components/AppButton';
import { QuestionCard } from '../components/QuestionCard';
import { getSkeletonQuestions, QuestionWithImages } from '../db/database';

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
        setQuestions(getSkeletonQuestions(deckId));
    }, [deckId]);

    function handleNext() {
        if (index + 1 >= questions.length) {
            setIndex(questions.length);
        } else {
            setIndex(index + 1);
            setShowAnswer(false);
        }
    }

    if (questions.length === 0) {
        return (
            <ScreenBackground>
                <View style={[styles.container, { flex: 1, justifyContent: 'center' }]}>
                    <Text style={{ fontFamily: fonts.body, color: colors.inkMuted, textAlign: 'center' }}>
                        Nema "skelet" kartica u ovom špilu.
                    </Text>
                    <AppButton title="Nazad" variant="secondary" onPress={onExit} />
                </View>
            </ScreenBackground>
        );
    }

    if (index >= questions.length) {
        return (
            <ScreenBackground>
                <View style={[styles.container, { flex: 1, justifyContent: 'center' }]}>
                    <Text style={{ fontFamily: fonts.display, fontSize: 24, color: colors.gold, textAlign: 'center' }}>
                        Pregled gotov
                    </Text>
                    <Text style={styles.counter}>Prošao si {questions.length} tema iz "{deckName}".</Text>
                    <AppButton title="Nazad" onPress={onExit} />
                </View>
            </ScreenBackground>
        );
    }

    const current = questions[index];

    return (
        <ScreenBackground>
            <ScrollView contentContainerStyle={styles.container}>
                <Text style={{ fontFamily: fonts.display, fontSize: 18, color: colors.gold }}>
                    Pregled gradiva — {deckName}
                </Text>
                <Text style={styles.counter}>{index + 1} / {questions.length}</Text>

                <QuestionCard
                    question={current.question}
                    answer={showAnswer ? current.answer : undefined}
                    questionImages={current.questionImages}
                    answerImages={showAnswer ? current.answerImages : undefined}
                    cardType={current.cardType}
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