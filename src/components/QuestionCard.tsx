import { useState } from 'react';
import { View, Text, Image, Pressable, Modal, ScrollView, StyleSheet } from 'react-native';
import { styles } from '../styles/styles';
import { colors, fonts } from '../styles/theme';
import { parseInlineText } from '../utils/inlineText';
import { setQuestionImages } from '../db/database';

type Props = {
    question: string;
    answer?: string;
    questionImages?: string[];
    answerImages?: string[];
    cardType?: string | null;
    isLeech?: boolean;
};

export function QuestionCard({ question, answer, questionImages = [], answerImages = [], cardType, isLeech }: Props) {
    const [zoomUri, setZoomUri] = useState<string | null>(null);

    const questionParts = parseInlineText(question, questionImages);
    const answerParts = answer !== undefined ? parseInlineText(answer, answerImages) : [];

    // react native dozvoljava Image unutar Text kao inline element, ali se onda ne moze otvoriti slika da se zumira
    return (
        <View style={styles.card}>
            {cardType && (
                <Text style={localStyles.badge}>
                    {cardType === 'skeleton' ? '📋 PREGLED' : '🔎 DETALJ'}
                </Text>
            )}

            {isLeech && <Text style={localStyles.badge}>⚠️ TEŠKA KARTICA</Text>}

            <Text style={styles.question}>
                {questionParts.map((part, i) =>
                    part.type === 'text' ? (
                        <Text key={i}>{part.value}</Text>
                    ) : (
                        <Image key={i} source={{ uri: part.uri }} style={localStyles.inlineImage} resizeMode="contain" />
                    )
                )}
            </Text>
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
                    <Text style={styles.question}>
                        {answerParts.map((part, i) =>
                            part.type === 'text' ? (
                                <Text key={i}>{part.value}</Text>
                            ) : (
                                <Image key={i} source={{ uri: part.uri }} style={localStyles.inlineImage} resizeMode="contain" />
                            )
                        )}
                    </Text>
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
    inlineImage: { width: 120, height: 80, marginHorizontal: 4 },
    badge: { fontSize: 11, color: colors.gold, letterSpacing: 1, marginBottom: 6, fontFamily: fonts.bodySemiBold },
});