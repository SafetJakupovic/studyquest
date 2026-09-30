import { View, Text } from 'react-native';
import { styles } from '../styles/styles';

type Props = { question: string, answer?: string };

export function QuestionCard({ question, answer }: Props) {
    return (
        <View style={styles.card}>
            <Text style={styles.question}>{question}</Text>
            {answer !== undefined && <Text style={styles.answer}>{answer}</Text>}
        </View>
    );
}