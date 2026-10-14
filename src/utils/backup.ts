import { BackupPayload, exportRawData, importRawData } from "../db/database";
import * as FileSystem from 'expo-file-system/legacy';
import * as Sharing from 'expo-sharing';
import * as DocumentPicker from 'expo-document-picker';

type ImportedImage = BackupPayload['images'][number] & { base64: string | null };
type ImportPayload = Omit<BackupPayload, 'images'> & { images: ImportedImage[] };

export async function exportBackup(): Promise<void> {
    const data = exportRawData();

    const imagesWithData = await Promise.all(
        data.images.map(async (img) => {
            try {
                const base64 = await FileSystem.readAsStringAsync(img.uri, { encoding: FileSystem.EncodingType.Base64 });
                return { ...img, base64 };
            } catch {
                return { ...img, base64: null };
            }
        })
    );

    const payload = { ...data, images: imagesWithData };
    const json = JSON.stringify(payload);

    const fileUri = FileSystem.documentDirectory + `studyquest-backup-${Date.now()}.json`;
    await FileSystem.writeAsStringAsync(fileUri, json, { encoding: FileSystem.EncodingType.UTF8 });

    const canShare = await Sharing.isAvailableAsync();
    if (canShare) {
        await Sharing.shareAsync(fileUri, { mimeType: 'application/json' });
    }
}

export async function pickAndImportBackup(): Promise<boolean> {
    const result = await DocumentPicker.getDocumentAsync({ type: 'application/json', copyToCacheDirectory: true });
    if (result.canceled)
        return false;

    const fileUri = result.assets[0].uri;
    const response = await fetch(fileUri);
    const json = await response.text();
    const data = JSON.parse(json) as ImportPayload;

    const imagesDir = FileSystem.documentDirectory + 'imported_images/';
    await FileSystem.makeDirectoryAsync(imagesDir, { intermediates: true }).catch(() => { });

    const resolvedImages = await Promise.all(
        data.images.map(async (img, index) => {
            if (!img.base64)
                return { ...img, uri: '' };
            const newUri = imagesDir + `img_${Date.now()}_${index}.jpg$`;
            await FileSystem.writeAsStringAsync(newUri, img.base64, { encoding: FileSystem.EncodingType.Base64 });
            return { ...img, uri: newUri };
        })
    );

    const finalImages = resolvedImages.filter(img => img.uri !== '');

    importRawData({ ...data, images: finalImages });
    return true;
}