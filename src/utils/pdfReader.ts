import { Buffer } from 'buffer';
import * as DocumentPicker from 'expo-document-picker';
import * as FileSystem from 'expo-file-system';

export async function pickAndReadPdf(): Promise<string | null> {
    const result = await DocumentPicker.getDocumentAsync({
        type: 'application/pdf',
        copyToCacheDirectory: true,
    });

    if (result.canceled)
        return null;

    const fileUri = result.assets[0].uri;
    const base64 = await FileSystem.readAsStringAsync(fileUri, {
        encoding: FileSystem.EncodingType.Base64,
    });

    const buffer = Buffer.from(base64, 'base64');
    const pdfParse = require('pdf-parse');
    const data = await pdfParse(buffer);

    return data.text;
}