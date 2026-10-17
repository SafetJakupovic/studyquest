import * as SecureStore from 'expo-secure-store';

const KEY_NAME = 'gemini_api_key';

export async function getApiKey(): Promise<string | null> {
    const stored = await SecureStore.getItemAsync(KEY_NAME);
    if (stored && stored.trim() !== '') return stored;
    return process.env.EXPO_PUBLIC_GEMINI_API_KEY ?? null;
}

export async function setApiKey(key: string): Promise<void> {
    await SecureStore.setItemAsync(KEY_NAME, key.trim());
}

export async function clearApiKey(): Promise<void> {
    await SecureStore.deleteItemAsync(KEY_NAME);
}

export async function hasCustomApiKey(): Promise<boolean> {
    const stored = await SecureStore.getItemAsync(KEY_NAME);
    return !!(stored && stored.trim() !== '');
}