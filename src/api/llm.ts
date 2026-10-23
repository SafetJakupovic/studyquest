import { getLLMConfig } from '../utils/llmConfig';

export type Question = {
    question: string;
    answer: string;
    type?: 'skeleton' | 'detail';
    questionImages?: string[];
    answerImages?: string[];
};

export const DEFAULT_INSTRUCTION =
    'Na osnovu sljedećeg teksta, napravi 5 pitanja za aktivno prisjećanje (recall) prikladnih za učenje. Svako pitanje treba imati kratak, jasan odgovor.';

export async function generateQuestions(sourceText: string, customInstruction?: string): Promise<Question[]> {
    const config = await getLLMConfig();
    if (!config.apiKey) {
        throw new Error('Nema API ključa. Dodaj ga u Podešavanjima.');
    }

    const instruction = customInstruction?.trim() || DEFAULT_INSTRUCTION;
    const prompt = `
${instruction}
Vrati ISKLJUČIVO validan JSON niz objekata, bez markdown formatiranja, bez uvoda, u ovom obliku:
[{"question": "...", "answer": "..."}]

Tekst:
"""
${sourceText}
"""
`.trim();

    const response = await fetch(`${config.baseUrl}/chat/completions`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${config.apiKey}`,
        },
        body: JSON.stringify({
            model: config.model,
            messages: [{ role: 'user', content: prompt }],
        }),
    });

    if (!response.ok) {
        const errorBody = await response.text();
        throw new Error(`API greška (${response.status}): ${errorBody}`);
    }

    const data = await response.json();
    const rawText = data.choices?.[0]?.message?.content;
    if (!rawText) throw new Error('Nema teksta u odgovoru.');

    const cleaned = rawText.replace(/```json|```/g, '').trim();
    try {
        return JSON.parse(cleaned);
    } catch {
        throw new Error(`Nije moguće parsirati JSON: ${cleaned}`);
    }
}