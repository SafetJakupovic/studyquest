import * as FileSystem from 'expo-file-system/legacy';

const IMAGES_DIR = FileSystem.documentDirectory + 'downloaded_images/';

export async function downloadImageIfRemote(uri: string): Promise<string> {
    if (!uri.startsWith('http://') && !uri.startsWith('https://')) {
        return uri; // već je lokalna putanja
    }

    await FileSystem.makeDirectoryAsync(IMAGES_DIR, { intermediates: true }).catch(() => { });

    const extension = uri.split('.').pop()?.split('?')[0]?.slice(0, 4) || 'jpg';
    const localUri = IMAGES_DIR + `img_${Date.now()}_${Math.round(Math.random() * 10000)}.${extension}`;

    const result = await FileSystem.downloadAsync(uri, localUri);
    return result.uri;
}

export async function downloadAllIfRemote(uris: string[]): Promise<string[]> {
    const resolved: string[] = [];
    for (const uri of uris) {
        try {
            resolved.push(await downloadImageIfRemote(uri));
        } catch {
            // ako preuzimanje ne uspije (los link, nema interneta trenutno), preskoci 
        }
    }
    return resolved;
}