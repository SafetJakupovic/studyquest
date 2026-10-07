import * as ImagePicker from 'expo-image-picker';
import { Button, Image, StyleSheet, View } from 'react-native';

type Props = {
    label: string;
    uri: string | null;
    onChange: (uri: string | null) => void;
};

export function ImagePickerField({ label, uri, onChange }: Props) {
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
                    <Image source={{ uri }} style={localStyles.preview} />
                    <Button title={`Ukloni sliku (${label})`} color="#c0392b" onPress={() => onChange(null)} />
                </>
            ) : (
                <Button title={`Dodaj sliku (${label})`} onPress={pickImage} />
            )}
        </View>
    );
}

const localStyles = StyleSheet.create({
    container: { marginVertical: 8, alignItems: 'center' },
    preview: { width: 150, height: 150, borderRadius: 8, marginBottom: 6 },
});