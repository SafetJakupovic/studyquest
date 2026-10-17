// najlaksi nacin da pisem na desktopu pa se ovdje parsira 
export type BulkQuestion = {
    question: string;
    answer: string;
    type?: 'skeleton' | 'detail';
    questionImages: string[];
    answerImages: string[];
};

export function parseBulkText(text: string): BulkQuestion[] {
    const blocks = text.split(/\n\s*\n/);
    const result: BulkQuestion[] = [];

    for (const block of blocks) {
        const lines = block.split('\n').map(l => l.trim()).filter(l => l !== '');
        let question = '';
        let answer = '';
        let type: 'skeleton' | 'detail' | undefined;
        let current: 'P' | 'O' | null = null;
        const questionImages: string[] = [];
        const answerImages: string[] = [];

        for (const line of lines) {
            if (line.startsWith('P:')) {
                question = line.slice(2).trim();
                current = 'P';
            } else if (line.startsWith('O:')) {
                answer = line.slice(2).trim();
                current = 'O';
            } else if (line.startsWith('T:')) {
                const t = line.slice(2).trim().toLowerCase();
                if (t === 'skeleton' || t === 'detail') type = t;
            } else if (line.startsWith('IMG_Q:')) {
                questionImages.push(line.slice(6).trim());
            } else if (line.startsWith('IMG_A:')) {
                answerImages.push(line.slice(6).trim());
            } else if (current === 'O') {
                answer += '\n' + line;
            } else if (current === 'P') {
                question += '\n' + line;
            }
        }

        if (question !== '' && answer !== '') {
            result.push({ question, answer, type, questionImages, answerImages });
        }
    }

    return result;
}