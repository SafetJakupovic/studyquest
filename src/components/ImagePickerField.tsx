import * as ImagePicker from 'expo-image-picker';
import { Button, Image, Modal, Pressable, StyleSheet, View } from 'react-native';
import { AppButton } from './AppButton';
import { colors } from '../styles/theme';
import { useState } from 'react';

type Props = {
    label: string;
    uri: string | null;
    onChange: (uri: string | null) => void;
};

export function ImagePickerField({ label, uri, onChange }: Props) {
    const [zoomed, setZoomed] = useState(false);

    async function pickImage() {
        const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
        if (!permission.granted)
            return;

        const result = await ImagePicker.launchImageLibraryAsync({
            mediaTypes: ImagePicker.MediaTypeOptions.Images,
            quality: 0.6, // trebalo bi biti dovoljno
        });

        if (!result.canceled && result.assets.length > 0) {
            onChange(result.assets[0].uri);
        }
    }
    return (
        <View style={localStyles.container}>
            {uri ? (
                <>
                    <Pressable onPress={() => setZoomed(true)} style={{ width: '100%' }}>
                        <Image source={{ uri }} style={localStyles.preview} resizeMode="contain" />
                    </Pressable>
                    <AppButton title={`Ukloni sliku (${label})`} variant="danger" onPress={() => onChange(null)} />

                    <Modal visible={zoomed} transparent onRequestClose={() => setZoomed(false)}>
                        <Pressable style={localStyles.backdrop} onPress={() => setZoomed(false)}>
                            <Image source={{ uri }} style={localStyles.fullImage} resizeMode="contain" />
                        </Pressable>
                    </Modal>
                </>
            ) : (
                <AppButton title={`Dodaj sliku (${label})`} variant="secondary" onPress={pickImage} />
            )}
        </View>
    );
}

const localStyles = StyleSheet.create({
    container: { marginVertical: 8, alignItems: 'center', width: '100%' },
    preview: {
        width: '100%',
        height: 220,
        borderRadius: 6,
        marginBottom: 8,
        backgroundColor: colors.surface,
        borderWidth: 1,
        borderColor: colors.border,
    },
    backdrop: { flex: 1, backgroundColor: 'rgba(0,0,0,0.9)', justifyContent: 'center', alignItems: 'center' },
    fullImage: { width: '100%', height: '100%' },
});