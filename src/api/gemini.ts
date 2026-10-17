import { getApiKey } from "../utils/apiKey";

//const API_KEY = process.env.EXPO_PUBLIC_GEMINI_API_KEY;
const MODEL = 'gemini-3.8-flash'
//const URL = `https://generativelanguage.googleapis.com/v1beta/models/${MODEL}:generateContent?key=${API_KEY}`;
export const DEFAULT_INSTRUCTION = 'Na osnovu sljedećeg teksta, napravi 5 pitanja za aktivno prisjećanje (recall) prikladnih za učenje. Svako pitanje treba imati kratak, jasan odgovor.';
export const SKELETON_DETAIL_INSTRUCTION = `Tekst sadrži jedno ili više numerisanih pitanja, od kojih svako ima više podtačaka (nabrojane stavke, karakteristike, koraci). Za svako numerisano pitanje iz teksta uradi sljedeće:
    1. Napravi JEDNU "skeleton" karticu čije pitanje traži nabrajanje glavnih podtačaka tog numerisanog pitanja, a odgovor je KRATKA lista samih naziva podtačaka, bez objašnjenja.
    2. Napravi po JEDNU "detail" karticu za svaku podtačku, gdje pitanje traži objašnjenje te konkretne podtačke, a odgovor sadrži puno objašnjenje iz teksta.
    Svakoj kartici dodaj polje "type" sa vrijednošću "skeleton" ili "detail".`;

export type Question = {
    question: string;
    answer: string;
    type?: 'skeleton' | 'detail';
};

// async funkcije vracaju promise, a ne stvarnu vrijednost
export async function generateQuestions(sourceText: string, customInstruction?: string, withCardType: boolean = false): Promise<Question[]> {
    const apiKey = await getApiKey();
    if (!apiKey)
        throw new Error('Nema API ključa. Dodaj ga u Podešavanjima ili provjeri .env fajl.');

    const url = `https://generativelanguage.googleapis.com/v1beta/models/${MODEL}:generateContent?key=${apiKey}`;

    const instruction = customInstruction && customInstruction.trim() !== '' ? customInstruction.trim() : DEFAULT_INSTRUCTION;

    const formatBlock = withCardType
        ? `Vrati ISKLJUČIVO validan JSON niz objekata, bez markdown formatiranja, bez uvoda, u ovom obliku:\n[{"question": "...", "answer": "...", "type": "skeleton"}]`
        : `Vrati ISKLJUČIVO validan JSON niz objekata, bez markdown formatiranja, bez uvoda, u ovom obliku:\n[{"question": "...", "answer": "..."}]`;

    const prompt = `
    ${instruction} 
    ${formatBlock}
    
    Tekst: 
    """
    ${sourceText}
    """
    `.trim();

    const response = await fetch(url, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({
            contents: [{ parts: [{ text: prompt }] }],
        }),
    });

    if (!response.ok) {
        const errorBody = await response.text();
        console.log('GEMINI ERROR STATUS:', response.status);
        console.log('GEMINI ERROR BODY:', errorBody);
        console.log('GEMINI URL USED:', URL);
        throw new Error(`Gemini API greška: (${response.status}): ${errorBody}`);
    }

    const data = await response.json();
    const rawText = data.candidates?.[0]?.content?.parts?.[0]?.text;

    if (!rawText) {
        throw new Error('Gemini nije vratio tekst u odgovoru.');
    }

    // gemini nekad doda ```json ...``` ogradu
    const cleaned = rawText.replace(/```json|```/g, '').trim();

    let parsed: Question[];
    // ako bi tipa dodao objasnjenje oko JSONa, ako nije u onome formatu koji hocemo
    try {
        parsed = JSON.parse(cleaned);
    } catch (e) {
        throw new Error(`Nije moguce parsirati JSON: ${cleaned}`);
    }

    return parsed;
}