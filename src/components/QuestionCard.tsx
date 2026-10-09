import { View, Text, Image, Pressable, Modal, StyleSheet } from 'react-native';
import { styles } from '../styles/styles';
import { useState } from 'react';

type Props = {
    question: string,
    answer?: string,
    questionImageUri?: string | null,
    answerImageUri?: string | null
};

export function QuestionCard({ question, answer, questionImageUri, answerImageUri }: Props) {
    const [zoomedUri, setZoomedUri] = useState<string | null>(null);

    return (
        <View style={styles.card}>
            <Text style={styles.question}>{question}</Text>
            {/* iz nekog razloga je undefined !== null */}
            {questionImageUri && (
                <Pressable onPress={() => setZoomedUri(questionImageUri)}>
                    <Image source={{ uri: questionImageUri }} style={{ width: '100%', height: 180, borderRadius: 8, marginTop: 8 }} resizeMode='contain' />
                </Pressable>
            )}

            {answer !== undefined && (
                <>
                    <Text style={styles.answer}>{answer}</Text>
                    {answerImageUri && (
                        <Pressable onPress={() => setZoomedUri(answerImageUri)}>
                            <Image source={{ uri: answerImageUri }} style={{ width: '100%', height: 180, borderRadius: 8, marginTop: 8 }} resizeMode='contain' />
                        </Pressable>
                    )}
                </>
            )}

            <Modal visible={zoomedUri !== null} transparent onRequestClose={() => setZoomedUri(null)}>
                <Pressable style={localStyles.backdrop} onPress={() => setZoomedUri(null)}>
                    {zoomedUri && <Image source={{ uri: zoomedUri }} style={localStyles.fullImage} resizeMode='contain' />}
                </Pressable>
            </Modal>
        </View>
    );
}

const localStyles = StyleSheet.create({
    cardImage: {
        width: '100%',
        height: 260,
        borderRadius: 8,
        marginTop: 8
    },
    backdrop: {
        flex: 1,
        backgroundColor: 'rgba(0, 0, 0, 0.9)',
        justifyContent: 'center',
        alignItems: 'center'
    },
    fullImage: {
        width: '100%',
        height: '100%'
    }
});