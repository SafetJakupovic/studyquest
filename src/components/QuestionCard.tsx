import { View, Text, Image } from 'react-native';
import { styles } from '../styles/styles';

type Props = {
    question: string,
    answer?: string,
    questionImageUri?: string | null,
    answerImageUri?: string | null
};

export function QuestionCard({ question, answer, questionImageUri, answerImageUri }: Props) {
    return (
        <View style={styles.card}>
            <Text style={styles.question}>{question}</Text>
            {/* iz nekog razloga je undefined !== null */}
            {questionImageUri && (
                <Image source={{ uri: questionImageUri }} style={{ width: '100%', height: 180, borderRadius: 8, marginTop: 8 }} resizeMode='contain' />
            )}

            {answer !== undefined && (
                <>
                    <Text style={styles.answer}>{answer}</Text>
                    {answerImageUri && (
                        <Image source={{ uri: answerImageUri }} style={{ width: '100%', height: 180, borderRadius: 8, marginTop: 8 }} resizeMode='contain' />
                    )}
                </>
            )
            }
        </View>
    );
}