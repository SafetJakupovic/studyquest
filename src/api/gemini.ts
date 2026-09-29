const API_KEY = process.env.EXPO_PUBLIC_GEMINI_API_KEY;
const MODEL = 'gemini-3.8-flash'
console.log('MODEL VALUE:', MODEL);
console.log('KEY EXISTS:', !!API_KEY);
const URL = `https://generativelanguage.googleapis.com/v1beta/models/${MODEL}:generateContent?key=${API_KEY}`;

export type Question = {
    question: string;
    answer: string;
};

// async funkcije vracaju promise, a ne stvarnu vrijednost
export async function generateQuestions(sourceText: string): Promise<Question[]> {
    const prompt = `Na osnovu sljedećeg teksta, napravi 5 pitanja za aktivno prisjećanje (recall) prikladnih za učenje. Svako pitanje treba imati kratak, jasan odgovor. Vrati ISKLJUČIVO validan JSON niz objekata, bez markdown formatiranja, bez uvoda, u ovom obliku: [{"question": "...", "answer": "..."}]
    
    Tekst: 
    """
    ${sourceText}
    """
    `.trim();

    const response = await fetch(URL, {
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