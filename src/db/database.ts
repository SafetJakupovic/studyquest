import * as SQLite from 'expo-sqlite';

export type StoredQuestion = {
    id: number;
    question: string;
    answer: string;
    sourceText: string;
    createdAt: string;
};

const db = SQLite.openDatabaseSync('studyquest.db');

export function initDatabase() {
    db.execSync(`
        CREATE TABLE IF NOT EXISTS questions (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            question TEXT NOT NULL,
            answer TEXT NOT NULL,
            sourceText TEXT,
            createdAt TEXT NOT NULL
        );
    `);
}

export function insertQuestions(
    items: { question: string; answer: string; sourceText: string }[]
) {
    const now = new Date().toISOString();
    for (const item of items) {
        db.runSync(
            /* ide ? da ne ubacujemo tekst direktno u SQL string (tipa "...VALUES ('" + text + "')") jer to otvara SQL injection napade i puca na specijalnim znakovima */
            'INSERT INTO questions (question, answer, sourceText, createdAt) VALUES (?, ?, ?, ?)',
            [item.question, item.answer, item.sourceText, now]
        );
    }
}

export function getAllQuestions(): StoredQuestion[] {
    return db.getAllSync<StoredQuestion>('SELECT * FROM questions ORDER BY createdAt DESC');
}