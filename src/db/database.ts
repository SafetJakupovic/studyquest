import * as SQLite from 'expo-sqlite';
import { createEmptyCard, type Card } from 'ts-fsrs';

export const COINS_PER_MINUTE = 1;
export const COINS_PER_KM = 100;
export const PAGES_PER_REWARD_UNIT = 1; // 1 coin za jednu stranicu

export type DeckStats = {
    id: number;
    name: string;
    total: number;
    due: number;
}

export type StoredQuestion = {
    id: number;
    question: string;
    answer: string;
    sourceText: string;
    createdAt: string;
    // fsrs polja
    due: string;
    stability: number;
    difficulty: number;
    elapsed_days: number;
    scheduled_days: number;
    learning_steps: number;
    reps: number;
    lapses: number;
    state: number;
    last_review: string | null;
    deck_id: number | null;
    questionImageUri: string | null;
    answerImageUri: string | null;
};

export type Activity = {
    id: number;
    name: string;
    xpReward: number;
    coinsReward: number;
}

export type ActivityWithStatus = Activity & { doneToday: boolean };

export type QuestionImage = {
    id: number;
    questionId: number;
    side: 'question' | 'answer';
    uri: string;
    position: number
};

export type QuestionWithImages = StoredQuestion & { questionImages: string[]; answerImages: string[] };

export type BackupPayload = {
    exportedAt: string;
    version: number;
    decks: { id: number; name: string; createdAt: string }[];
    questions: any[];
    images: { id: number; questionId: number; side: string; uri: string; position: number }[];
    stats: Stats;
    activities: Activity[];
    activityLog: { id: number; activityId: number; date: string }[];
    readingLog: { date: string; pages: number }[];
}

const db = SQLite.openDatabaseSync('studyquest.db');

export function initDatabase() {
    db.execSync(`
        CREATE TABLE IF NOT EXISTS questions (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            question TEXT NOT NULL,
            answer TEXT NOT NULL,
            sourceText TEXT,
            createdAt TEXT NOT NULL,
            due TEXT NOT NULL,
            stability REAL NOT NULL,
            difficulty REAL NOT NULL,
            elapsed_days INTEGER NOT NULL,
            scheduled_days INTEGER NOT NULL,
            learning_steps INTEGER NOT NULL,
            reps INTEGER NOT NULL,
            lapses INTEGER NOT NULL,
            state INTEGER NOT NULL,
            last_review TEXT
        );
    `);

    const row = db.getFirstSync<{ user_version: number }>('PRAGMA user_version');
    const version = row?.user_version ?? 0;

    if (version < 1) {
        // ili sve ili nista, pitanja do sad ide u opste
        // migracija posto sam zaboravio odmah definisati spilove
        db.withTransactionSync(() => {
            db.execSync(`
                CREATE TABLE IF NOT EXISTS decks (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                name TEXT NOT NULL UNIQUE,
                createdAt TEXT NOT NULL
                );
                ALTER TABLE questions ADD COLUMN deck_id INTEGER REFERENCES decks(id);
                `);
            db.runSync('INSERT INTO decks (name, createdAt) VALUES (?, ?)', ['Opšte', new Date().toISOString()]);
            db.execSync(`UPDATE questions SET deck_id = (SELECT id FROM decks WHERE name = 'Opšte')`);
            db.execSync('PRAGMA user_version = 1');
        });
    }

    if (version < 2) {
        db.withTransactionSync(() => {
            db.execSync(`
                CREATE TABLE IF NOT EXISTS stats (
                    id INTEGER PRIMARY KEY CHECK (id = 1),
                    xp INTEGER NOT NULL DEFAULT 0,
                    coins INTEGER NOT NULL DEFAULT 0,
                    gameBudget REAL NOT NULL DEFAULT 0,
                    streak INTEGER NOT NULL DEFAULT 0,
                    lastStudyDate TEXT
                );
            `);
            db.runSync('INSERT OR IGNORE INTO stats (id, xp, coins, gameBudget, streak, lastStudyDate) VALUES (1, 0, 0, 0, 0, NULL)');
            db.execSync('PRAGMA user_version = 2');
        })
    }

    if (version < 3) {
        db.withTransactionSync(() => {
            db.execSync(`
                ALTER TABLE questions ADD COLUMN questionImageUri TEXT;
                ALTER TABLE questions ADD COLUMN answerImageUri TEXT;
                `);
            db.execSync('PRAGMA user_version = 3');
        });
    }

    if (version < 4) {
        db.withTransactionSync(() => {
            db.execSync(`
                CREATE TABLE IF NOT EXISTS activities (
                    id INTEGER PRIMARY KEY AUTOINCREMENT,
                    name TEXT NOT NULL,
                    xpReward INTEGER NOT NULL,
                    coinsReward INTEGER NOT NULL
                );
                CREATE TABLE IF NOT EXISTS activity_log (
                    id INTEGER PRIMARY KEY AUTOINCREMENT,
                    activityId INTEGER NOT NULL REFERENCES activities(id),
                    date TEXT NOT NULL,
                    UNIQUE(activityId, date)
                );
                `);
            const defaults = [
                ['Trening', 10, 10],
                ['10.000 koraka', 7, 7],
                ['Rastezanje', 5, 5],
            ];
            for (const [name, xp, coins] of defaults) {
                db.runSync('INSERT INTO activities (name, xpReward, coinsReward) VALUES (?, ?, ?)', [name, xp, coins]);
            }
            db.execSync('PRAGMA user_version = 4');
        });
    }

    if (version < 5) {
        db.withTransactionSync(() => {
            db.execSync(`
                CREATE TABLE IF NOT EXISTS reading_log (
                date TEXT PRIMARY KEY,
                pages INTEGER NOT NULL DEFAULT 0
                );
                `);
            db.execSync('PRAGMA user_version = 5');
        });
    }

    if (version < 6) {
        db.withTransactionSync(() => {
            db.execSync(`
                CREATE TABLE IF NOT EXISTS question_images (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                questionId INTEGER NOT NULL REFERENCES question(id),
                side TEXT NOT NULL CHECK(side IN ('question', 'answer')),
                uri TEXT NOT NULL,
                position INTEGER NOT NULL DEFAULT 0);`);

            // prebacivanje postojecih pojedinacnih slika u novu tabelu
            // sqlite ne podrzava valjda pouzdano DROP COLUMN u svim verzijama
            // pa stare kolone ne prave problem
            db.execSync(`
                INSERT INTO question_images (questionId, side, uri, position)
                SELECT id, 'question', questionImageUri, 0 FROM questions WHERE questionImageUri IS NOT NULL;`);
            db.execSync(`
                INSERT INTO question_images (questionId, side, uri, position)
                SELECT id, 'answer', answerImageUri, 0 FROM questions WHERE answerImageUri IS NOT NULL;`);

            db.execSync('PRAGMA user_version = 6');
        });
    }

    // ocistio bazu s ovim kad sam pogresan format stavio
    // moze se obrisati, ali neka
    db.runSync(
        "UPDATE questions SET last_review = NULL WHERE last_review IS NOT NULL AND last_review NOT LIKE '____-__-__T%'"
    );
}

export function exchangeCoinsForMinutes(minutes: number): Stats {
    const cost = minutes * COINS_PER_MINUTE;
    const current = getStats();
    if (current.coins < cost) {
        throw new Error("Nemaš dovoljno coins.");
    }
    db.runSync("UPDATE stats SET coins = coins - ? WHERE id = 1", [cost]);
    return getStats();
}

export function exchangeCoinsForBudget(km: number): Stats {
    const cost = km * COINS_PER_KM;
    const current = getStats();
    if (current.coins < cost) {
        throw new Error("Nemaš dovoljno coins.");
    }
    db.runSync("UPDATE stats SET coins = coins - ?, gameBudget = gameBudget + ? WHERE id = 1", [cost, km]);
    return getStats();
}

export function getDeckStats(): DeckStats[] {
    const now = new Date().toISOString();
    return db.getAllSync<DeckStats>(
        `SELECT d.id, d.name,
        COUNT(q.id) AS total,
        COALESCE(SUM(CASE WHEN date(q.due) <= date(?) THEN 1 ELSE 0 END), 0) AS due
        FROM decks d
        LEFT JOIN questions q ON q.deck_id = d.id 
        GROUP BY d.id
        ORDER BY d.name`,
        [now]
    );
    // count(*) bi vratilo 1 umjesto 0 ako nema nista
    // coalesce vraca 0 umjesto null, a suma prakticno broji jedan po jedan da sabere koliko ih je na redu za ponavljanje 
}

export function createDeck(name: string): number {
    const r = db.runSync('INSERT INTO decks (name, createdAt) VALUES (?, ?)', [name, new Date().toISOString()]);
    return r.lastInsertRowId;
}

export function getQuestionById(id: number): QuestionWithImages | null {
    const row = db.getFirstSync<StoredQuestion>('SELECT * FROM questions WHERE id = ?', [id]);
    if (!row) return null;
    return attachImages([row])[0];
}

export function insertQuestions(
    items: {
        question: string;
        answer: string;
        sourceText: string;
        questionImages?: string[];
        answerImages?: string[];
    }[],
    deckId: number
) {
    const now = new Date().toISOString();
    for (const item of items) {
        const card: Card = createEmptyCard(new Date());
        const result = db.runSync(
            `INSERT INTO questions
        (question, answer, sourceText, createdAt, due, stability, difficulty, elapsed_days, scheduled_days, learning_steps, reps, lapses, state, last_review, deck_id)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
            [
                item.question,
                item.answer,
                item.sourceText,
                now,
                card.due.toISOString(),
                card.stability,
                card.difficulty,
                card.elapsed_days,
                card.scheduled_days,
                card.learning_steps,
                card.reps,
                card.lapses,
                card.state,
                card.last_review ? card.last_review.toISOString() : null,
                deckId,
            ]
        );
        const questionId = result.lastInsertRowId;
        if (item.questionImages && item.questionImages.length > 0) {
            setQuestionImages(questionId, 'question', item.questionImages);
        }
        if (item.answerImages && item.answerImages.length > 0) {
            setQuestionImages(questionId, 'answer', item.answerImages);
        }
    }
}


export function getAllQuestions(): StoredQuestion[] {
    return db.getAllSync<StoredQuestion>('SELECT * FROM questions ORDER BY createdAt DESC');
}

export function getDueQuestions(deckId: number): QuestionWithImages[] {
    const now = new Date().toISOString();
    const rows = db.getAllSync<StoredQuestion>(
        'SELECT * FROM questions WHERE due <= ? AND deck_id = ? ORDER BY due ASC',
        [now, deckId]
    );
    return attachImages(rows);
}

// azuriranje kartice nakon odgovora
export function updateCardAfterReview(id: number, card: Card) {
    db.runSync(
        `UPDATE questions SET
        due = ?, stability = ?, difficulty = ?, elapsed_days = ?, scheduled_days = ?, learning_steps = ?, reps = ?, lapses = ?, state = ?, last_review = ?
        WHERE id = ?`,
        [
            card.due.toISOString(),
            card.stability,
            card.difficulty,
            card.elapsed_days,
            card.scheduled_days,
            card.learning_steps,
            card.reps,
            card.lapses,
            card.state,
            card.last_review ? card.last_review.toISOString() : null,
            id,
        ]
    );
}

export type Stats = {
    id: number;
    xp: number;
    coins: number;
    gameBudget: number;
    streak: number;
    lastStudyDate: string | null;
};

export function getStats(): Stats {
    return db.getFirstSync<Stats>('SELECT * FROM stats WHERE id = 1')!; // ! NIJE null
}

const GRADE_REWARDS: Record<number, number> = {
    1: 0,   //opet
    2: 1,   //tesko
    3: 2,  //dobro
    4: 3,  //lako
};

export function applyReviewReward(grade: number): Stats {
    const amount = GRADE_REWARDS[grade];
    const current = getStats();
    const { newStreak, today } = updateStreak(current);

    db.runSync(
        `UPDATE stats SET xp = xp + ?, coins = coins + ?, streak = ?, lastStudyDate = ? WHERE id = 1`,
        [amount, amount, newStreak, today]
    );

    return getStats();
}

export function getRandomQuestions(count: number, deckId: number | null): QuestionWithImages[] {
    const rows = deckId === null
        ? db.getAllSync<StoredQuestion>('SELECT * FROM questions ORDER BY RANDOM() LIMIT ?', [count])
        : db.getAllSync<StoredQuestion>('SELECT * FROM questions WHERE deck_id = ? ORDER BY RANDOM() LIMIT ?', [deckId, count]);
    return attachImages(rows);
}

export function applyBossFightReward(correctCount: number, totalCount: number): Stats {
    const bonusXp = correctCount * 5;
    const bonusCoins = correctCount * 5;
    const current = getStats();
    const { newStreak, today } = updateStreak(current);

    db.runSync(
        'UPDATE stats SET xp = xp + ?, coins = coins + ?, streak = ?, lastStudyDate = ? WHERE id = 1',
        [bonusXp, bonusCoins, newStreak, today]
    );

    return getStats();
}

function updateStreak(current: Stats): { newStreak: number; today: string } {
    const today = new Date().toISOString().slice(0, 10);
    let newStreak = current.streak;

    if (current.lastStudyDate !== today) {
        const yesterday = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString().slice(0, 10);
        newStreak = current.lastStudyDate === yesterday ? current.streak + 1 : 1;
    }

    return { newStreak, today };
}

export function updateQuestionContent(id: number, question: string, answer: string) {
    db.runSync(
        'UPDATE questions SET question = ?, answer = ? WHERE id = ?',
        [question, answer, id]
    );
}

export function deleteQuestion(id: number) {
    db.runSync('DELETE FROM question_images WHERE questionId = ?', [id]);
    db.runSync('DELETE FROM questions WHERE id = ?', [id]);
}

export function getQuestionsByDeck(deckId: number): QuestionWithImages[] {
    const rows = db.getAllSync<StoredQuestion>('SELECT * FROM questions WHERE deck_id = ? ORDER BY createdAt DESC', [deckId]);
    return attachImages(rows);
}

export function updateQuestionImages(id: number, questionImageUri: string | null, answerImageUri: string | null) {
    db.runSync(
        'UPDATE questions SET questionImageUri = ?, answerImageUri = ? WHERE id = ?',
        [questionImageUri, answerImageUri, id]
    );
}

export function getActivitiesWithStatus(): ActivityWithStatus[] {
    const today = new Date().toISOString().slice(0, 10);
    // case when vraca null za l.id ako danas nema zapisa
    return db.getAllSync<ActivityWithStatus>(
        `SELECT a.*,
            CASE WHEN l.id IS NULL THEN 0 ELSE 1 END AS doneToday
        FROM activities a
        LEFT JOIN activity_log l ON l.activityId = a.id AND l.date = ?
        ORDER BY a.id`,
        [today]
    );
}

export function toggleActivity(activityId: number, xpReward: number, coinsReward: number): Stats {
    const today = new Date().toISOString().slice(0, 10);
    const existing = db.getFirstSync<{ id: number }>(
        'SELECT id FROM activity_log WHERE activityId = ? AND date = ?',
        [activityId, today]
    );

    if (existing) {
        // vec odradjeno danas, ponisti
        db.runSync('DELETE FROM activity_log WHERE id = ?', [existing.id]);
        db.runSync(
            'UPDATE stats SET xp = xp - ?, coins = coins - ? WHERE id = 1',
            [xpReward, coinsReward]
        );
    } else {
        // nije odradjeno, oznaci i nagradi
        db.runSync(
            'INSERT INTO activity_log (activityId, date) VALUES (?, ?)',
            [activityId, today]
        );
        db.runSync(
            'UPDATE stats SET xp = xp + ?, coins = coins + ? WHERE id = 1',
            [xpReward, coinsReward]
        );
    }

    return getStats();
}

export function getTodayPages(): number {
    const today = new Date().toISOString().slice(0, 10);
    const row = db.getFirstSync<{ pages: number }>('SELECT pages FROM reading_log WHERE date = ?', [today]);
    return row?.pages ?? 0;
}

export function setTodayPages(newPages: number): Stats {
    const today = new Date().toISOString().slice(0, 10);
    const oldPages = getTodayPages();

    if (newPages < 0)
        newPages = 0;

    const oldUnits = Math.floor(oldPages / PAGES_PER_REWARD_UNIT);
    const newUnits = Math.floor(newPages / PAGES_PER_REWARD_UNIT);
    const deltaUnits = newUnits - oldUnits;

    // ako moze update, ako ne onda insert, zavisi od datuma
    db.runSync('INSERT INTO reading_log (date, pages) VALUES (?, ?) ON CONFLICT(date) DO UPDATE SET pages = excluded.pages', [today, newPages]);

    if (deltaUnits !== 0)
        db.runSync('UPDATE stats SET xp = xp + ?, coins = coins + ? WHERE id = 1', [deltaUnits, deltaUnits]);

    return getStats();
}

function attachImages(rows: StoredQuestion[]): QuestionWithImages[] {
    if (rows.length === 0)
        return [];
    const ids = rows.map(r => r.id);
    const placeholders = ids.map(() => '?').join(',');
    const imgRows = db.getAllSync<QuestionImage>(
        `SELECT * FROM question_images WHERE questionId IN (${placeholders}) ORDER BY side, position`,
        ids
    );
    return rows.map(r => ({
        ...r,
        questionImages: imgRows.filter(i => i.questionId === r.id && i.side === 'question').map(i => i.uri),
        answerImages: imgRows.filter(i => i.questionId === r.id && i.side === 'answer').map(i => i.uri),
    }));
}

export function getImagesForQuestion(questionId: number): { question: string[], answer: string[] } {
    const rows = db.getAllSync<QuestionImage>(
        'SELECT * FROM question_images WHERE questionId = ? ORDER BY side, position',
        [questionId]
    );
    return {
        question: rows.filter(r => r.side === 'question').map(r => r.uri),
        answer: rows.filter(r => r.side === 'answer').map(r => r.uri)
    };
}

export function setQuestionImages(questionId: number, side: 'question' | 'answer', uris: string[]) {
    db.runSync('DELETE FROM question_images WHERE questionId = ? AND side = ?', [questionId, side]);
    uris.forEach((uri, index) => {
        db.runSync('INSERT INTO question_images (questionId, side, uri, position) VALUES (?, ?, ?, ?)', [questionId, side, uri, index]);
    });
}

export function exportRawData(): BackupPayload {
    return {
        exportedAt: new Date().toISOString(),
        version: 1,
        decks: db.getAllSync('SELECT * FROM decks'),
        questions: db.getAllSync('SELECT * FROM questions'),
        images: db.getAllSync('SELECT * FROM question_images'),
        stats: getStats(),
        activities: db.getAllSync('SELECT * FROM activities'),
        activityLog: db.getAllSync('SELECT * FROM activity_log'),
        readingLog: db.getAllSync('SELECT * FROM reading_log'),
    };
}

export function importRawData(data: BackupPayload) {
    db.withTransactionSync(() => {
        db.execSync('DELETE FROM question_images');
        db.execSync('DELETE FROM questions');
        db.execSync('DELETE FROM decks');
        db.execSync('DELETE FROM activity_log');
        db.execSync('DELETE FROM activities');
        db.execSync('DELETE FROM reading_log');

        const deckIdMap = new Map<number, number>();
        for (const d of data.decks) {
            const r = db.runSync('INSERT INTO decks (name, createdAt) VALUES (?, ?)', [d.name, d.createdAt]);
            deckIdMap.set(d.id, r.lastInsertRowId);
        }

        const activityIdMap = new Map<number, number>();
        for (const a of data.activities) {
            const r = db.runSync('INSERT INTO activities (name, xpReward, coinsReward) VALUES (?, ?, ?)', [a.name, a.xpReward, a.coinsReward]);
            activityIdMap.set(a.id, r.lastInsertRowId);
        }

        const questionIdMap = new Map<number, number>();
        for (const q of data.questions) {
            const newDeckId = q.deck_id !== null && q.deck_id !== undefined ? deckIdMap.get(q.deck_id) ?? null : null;
            const r = db.runSync(
                `INSERT INTO questions
          (question, answer, sourceText, createdAt, due, stability, difficulty, elapsed_days, scheduled_days, learning_steps, reps, lapses, state, last_review, deck_id)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
                [q.question, q.answer, q.sourceText, q.createdAt, q.due, q.stability, q.difficulty, q.elapsed_days, q.scheduled_days, q.learning_steps, q.reps, q.lapses, q.state, q.last_review, newDeckId]
            );
            questionIdMap.set(q.id, r.lastInsertRowId);
        }

        for (const img of data.images) {
            const newQuestionId = questionIdMap.get(img.questionId);
            if (newQuestionId === undefined) continue;
            db.runSync('INSERT INTO question_images (questionId, side, uri, position) VALUES (?, ?, ?, ?)', [newQuestionId, img.side, img.uri, img.position ?? 0]);
        }

        for (const log of data.activityLog) {
            const newActivityId = activityIdMap.get(log.activityId);
            if (newActivityId === undefined) continue;
            db.runSync('INSERT INTO activity_log (activityId, date) VALUES (?, ?)', [newActivityId, log.date]);
        }

        for (const r of data.readingLog) {
            db.runSync('INSERT INTO reading_log (date, pages) VALUES (?, ?)', [r.date, r.pages]);
        }

        db.runSync(
            'UPDATE stats SET xp = ?, coins = ?, gameBudget = ?, streak = ?, lastStudyDate = ? WHERE id = 1',
            [data.stats.xp, data.stats.coins, data.stats.gameBudget, data.stats.streak, data.stats.lastStudyDate]
        );
    });
}