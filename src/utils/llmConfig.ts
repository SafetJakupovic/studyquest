import * as SecureStore from 'expo-secure-store';

export type LLMConfig = { baseUrl: string; apiKey: string; model: string };

const STORAGE_KEY = 'llm_provider_config';

const DEFAULT_CONFIG: LLMConfig = {
    baseUrl: 'https://generativelanguage.googleapis.com/v1beta/openai',
    apiKey: process.env.EXPO_PUBLIC_GEMINI_API_KEY ?? '',
    model: 'gemini-3.8-flash',
};

export async function getLLMConfig(): Promise<LLMConfig> {
    const stored = await SecureStore.getItemAsync(STORAGE_KEY);
    if (stored) {
        try { return JSON.parse(stored); } catch { /* padni na default ispod */ }
    }
    return DEFAULT_CONFIG;
}

export async function setLLMConfig(config: LLMConfig): Promise<void> {
    await SecureStore.setItemAsync(STORAGE_KEY, JSON.stringify(config));
}

export const PROVIDER_PRESETS: { label: string; baseUrl: string; model: string }[] = [
    { label: 'Gemini', baseUrl: 'https://generativelanguage.googleapis.com/v1beta/openai', model: 'gemini-3.8-flash' },
    { label: 'Gemini Flash-Lite', baseUrl: 'https://generativelanguage.googleapis.com/v1beta/openai', model: 'gemini-3.5-flash-lite' },
    { label: 'OpenRouter', baseUrl: 'https://openrouter.ai/api/v1', model: 'meta-llama/llama-3.3-70b-instruct:free' },
];