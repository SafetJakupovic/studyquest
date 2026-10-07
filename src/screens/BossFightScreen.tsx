import { useState, useEffect, useRef } from 'react';
import { applyBossFightReward, getRandomQuestions, Stats, StoredQuestion } from '../db/database';
import { styles } from '../styles/styles';
import { Button, ScrollView, Text, View } from 'react-native';
import { QuestionCard } from '../components/QuestionCard';

const QUESTION_COUNT = 10;
const TIME_LIMIT_SEC = 120;

type Props = {
    deckId: number | null;
    onFinish: (newStats: Stats) => void;
    onExit: () => void;
}

export function BossFightScreen({ deckId, onFinish, onExit }: Props) {
    const [questions, setQuestions] = useState<StoredQuestion[]>([]);
    const [index, setIndex] = useState(0);
    const [showAnswer, setShowAnswer] = useState(false);
    const [correctCount, setCorrectCount] = useState(0);
    const [timeLeft, setTimeLeft] = useState(TIME_LIMIT_SEC);
    const [finished, setFinished] = useState(false);
    const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null); // promjena .current ne pokrece rerender

    useEffect(() => {
        setQuestions(getRandomQuestions(QUESTION_COUNT, deckId));
        // svake sekunde
        intervalRef.current = setInterval(() => {
            setTimeLeft(prev => {
                if (prev <= 1) {
                    clearInterval(intervalRef.current!);
                    setFinished(true);
                    return 0;
                }
                return prev - 1;
            });
        }, 1000);

        // cleanup, kad se komponenta ukloni s ekrana
        return () => {
            if (intervalRef.current)
                clearInterval(intervalRef.current);
        };
    }, []);

    function handleAnswer(wasCorrect: boolean) {
        if (wasCorrect)
            setCorrectCount(prev => prev + 1);
        const nextIndex = index + 1;
        if (nextIndex >= questions.length) {
            if (intervalRef.current)
                clearInterval(intervalRef.current);
            setFinished(true);
        } else {
            setIndex(nextIndex);
            setShowAnswer(false);
        }
    }

    function handleClaimReward() {
        const newStats = applyBossFightReward(correctCount, questions.length);
        onFinish(newStats);
    }

    if (questions.length === 0) {
        return (
            <View style={styles.container}>
                <Text>Učitavanje...</Text>
            </View>
        )
    }

    if (finished) {
        return (
            <View style={styles.container}>
                <Text style={{ fontSize: 24, fontWeight: 'bold' }}>Boss fight gotov!</Text>
                <Text style={{ fontSize: 24, marginTop: 10 }}>Tačno: {correctCount}/{questions.length}</Text>
                <Button title="Pokupi nagradu" onPress={handleClaimReward} />
            </View>
        );
    }

    const current = questions[index];

    return (
        <ScrollView contentContainerStyle={styles.container}>
            <Text style={{ fontSize: 18, fontWeight: 'bold', color: timeLeft <= 10 ? 'red' : '#333' }}>{timeLeft}s</Text>
            <Text style={styles.counter}>Pitanje {index + 1} / {questions.length}</Text>

            <QuestionCard question={current.question} answer={showAnswer ? current.answer : undefined} />

            {!showAnswer ? (
                <Button title="Prikaži odgovor" onPress={() => setShowAnswer(true)} />
            ) : (
                <View style={styles.buttonRow}>
                    <Button title="Nisam znao" color="#c0392b" onPress={() => handleAnswer(false)} />
                    <Button title="Znao sam" color="#27ae60" onPress={() => handleAnswer(true)} />
                </View>
            )}

            <Button title="Odustani" color="#888" onPress={onExit} />
        </ScrollView>
    );
}