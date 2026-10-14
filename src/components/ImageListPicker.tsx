import { useState } from 'react';
import { View, Image, Pressable, Modal, Text, StyleSheet } from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { AppButton } from './AppButton';
import { colors, spacing } from '../styles/theme';

type Props = {
    label: string;
    uris: string[];
    onChange: (uris: string[]) => void;
};

export function ImageListPicker({ label, uris, onChange }: Props) {
    const [zoomIndex, setZoomIndex] = useState<number | null>(null);

    async function pickImages() {
        const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
        if (!permission.granted) return;

        const result = await ImagePicker.launchImageLibraryAsync({
            mediaTypes: ImagePicker.MediaTypeOptions.Images,
            quality: 0.6,
            allowsMultipleSelection: true,
        });

        if (!result.canceled && result.assets.length > 0) {
            onChange([...uris, ...result.assets.map(a => a.uri)]);
        }
    }

    function removeAt(index: number) {
        onChange(uris.filter((_, i) => i !== index));
    }

    return (
        <View style={{ width: '100%', marginVertical: spacing.sm }}>
            <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: spacing.xs }}>
                {uris.map((uri, index) => (
                    <View key={uri + index} style={styles.thumbWrap}>
                        <Pressable onPress={() => setZoomIndex(index)}>
                            <Image source={{ uri }} style={styles.thumb} resizeMode="cover" />
                        </Pressable>
                        <Pressable onPress={() => removeAt(index)} style={styles.removeBadge}>
                            <Text style={styles.removeText}>✕</Text>
                        </Pressable>
                    </View>
                ))}
            </View>

            <AppButton title={`+ Dodaj sliku (${label})`} variant="secondary" onPress={pickImages} />

            <Modal visible={zoomIndex !== null} transparent onRequestClose={() => setZoomIndex(null)}>
                <Pressable style={styles.backdrop} onPress={() => setZoomIndex(null)}>
                    {zoomIndex !== null && (
                        <>
                            <Image source={{ uri: uris[zoomIndex] }} style={styles.fullImage} resizeMode="contain" />
                            <View style={styles.navRow}>
                                {zoomIndex > 0 && (
                                    <Pressable onPress={(e) => { e.stopPropagation(); setZoomIndex(zoomIndex - 1); }} style={styles.navBtn}>
                                        <Text style={styles.navText}>‹</Text>
                                    </Pressable>
                                )}
                                {zoomIndex < uris.length - 1 && (
                                    <Pressable onPress={(e) => { e.stopPropagation(); setZoomIndex(zoomIndex + 1); }} style={styles.navBtn}>
                                        <Text style={styles.navText}>›</Text>
                                    </Pressable>
                                )}
                            </View>
                        </>
                    )}
                </Pressable>
            </Modal>
        </View>
    );
}

const styles = StyleSheet.create({
    thumbWrap: { width: 70, height: 70 },
    thumb: { width: 70, height: 70, borderRadius: 4, borderWidth: 1, borderColor: colors.border },
    removeBadge: {
        position: 'absolute', top: -6, right: -6,
        backgroundColor: colors.wine, borderRadius: 10, width: 20, height: 20,
        alignItems: 'center', justifyContent: 'center',
    },
    removeText: { color: colors.ink, fontSize: 12 },
    backdrop: { flex: 1, backgroundColor: 'rgba(0,0,0,0.92)', justifyContent: 'center', alignItems: 'center' },
    fullImage: { width: '100%', height: '80%' },
    navRow: { flexDirection: 'row', position: 'absolute', bottom: 40, gap: 40 },
    navBtn: { padding: 12 },
    navText: { color: colors.gold, fontSize: 36 },
});