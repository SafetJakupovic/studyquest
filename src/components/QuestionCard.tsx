import { useState } from 'react';
import { View, Text, Image, Pressable, Modal, ScrollView, StyleSheet } from 'react-native';
import { styles } from '../styles/styles';
import { colors } from '../styles/theme';

type Props = {
    question: string;
    answer?: string;
    questionImages?: string[];
    answerImages?: string[];
};

export function QuestionCard({ question, answer, questionImages = [], answerImages = [] }: Props) {
    const [zoomUri, setZoomUri] = useState<string | null>(null);

    return (
        <View style={styles.card}>
            <Text style={styles.question}>{question}</Text>
            {questionImages.length > 0 && (
                <ScrollView horizontal showsHorizontalScrollIndicator={false} style={localStyles.row}>
                    {questionImages.map((uri, i) => (
                        <Pressable key={uri + i} onPress={() => setZoomUri(uri)}>
                            <Image source={{ uri }} style={localStyles.thumb} resizeMode="cover" />
                        </Pressable>
                    ))}
                </ScrollView>
            )}

            {answer !== undefined && (
                <>
                    <View style={localStyles.divider} />
                    <Text style={styles.answer}>{answer}</Text>
                    {answerImages.length > 0 && (
                        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={localStyles.row}>
                            {answerImages.map((uri, i) => (
                                <Pressable key={uri + i} onPress={() => setZoomUri(uri)}>
                                    <Image source={{ uri }} style={localStyles.thumb} resizeMode="cover" />
                                </Pressable>
                            ))}
                        </ScrollView>
                    )}
                </>
            )}

            <Modal visible={zoomUri !== null} transparent onRequestClose={() => setZoomUri(null)}>
                <Pressable style={localStyles.backdrop} onPress={() => setZoomUri(null)}>
                    {zoomUri && <Image source={{ uri: zoomUri }} style={localStyles.fullImage} resizeMode="contain" />}
                </Pressable>
            </Modal>
        </View>
    );
}

const localStyles = StyleSheet.create({
    row: { marginTop: 8 },
    thumb: { width: 100, height: 100, borderRadius: 6, marginRight: 8, borderWidth: 1, borderColor: colors.border },
    backdrop: { flex: 1, backgroundColor: 'rgba(0,0,0,0.9)', justifyContent: 'center', alignItems: 'center' },
    fullImage: { width: '100%', height: '100%' },
    divider: { width: '100%', height: 1, backgroundColor: colors.border, marginVertical: 10 },
});