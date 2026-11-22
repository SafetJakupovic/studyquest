import { fsrs, generatorParameters, type Card, type Grade } from 'ts-fsrs';
import type { StoredQuestion } from '../db/database';

const previewScheduler = fsrs(generatorParameters());

export function previewNextDue(q: StoredQuestion, grade: Grade): Date {
    const cardBefore: Card = {
        due: new Date(q.due),
        stability: q.stability,
        difficulty: q.difficulty,
        elapsed_days: q.elapsed_days,
        scheduled_days: q.scheduled_days,
        learning_steps: q.learning_steps,
        reps: q.reps,
        lapses: q.lapses,
        state: q.state,
        last_review: q.last_review ? new Date(q.last_review) : undefined,
    };
    return previewScheduler.next(cardBefore, new Date(), grade).card.due;
}

export function formatRelativeDue(due: Date): string {
    const diffMin = Math.round((due.getTime() - Date.now()) / 60000);
    if (diffMin <= 1) return 'odmah';
    if (diffMin < 60) return `za ${diffMin} min`;
    const diffHours = Math.round(diffMin / 60);
    if (diffHours < 24) return `za ${diffHours} h`;
    const diffDays = Math.round(diffHours / 24);
    if (diffDays === 1) return 'sutra';
    if (diffDays < 30) return `za ${diffDays} dana`;
    const diffMonths = Math.round(diffDays / 30);
    if (diffMonths < 12) return `za ${diffMonths} ${diffMonths === 1 ? 'mjesec' : 'mjeseci'}`;
    const diffYears = Math.round(diffMonths / 12);
    return `za ${diffYears} ${diffYears === 1 ? 'godinu' : 'godina'}`;
}