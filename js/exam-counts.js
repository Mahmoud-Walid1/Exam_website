import { CENTRAL_EXAM_TYPE, normalizeExamType } from './academic.js?v=20261016-types';
// Verified library totals when adding the complete catalog counter (2026-10-16).
// Used only until settings/examCounts is first saved by an exam mutation.
export const INITIAL_EXAM_COUNTS = { periodic: 74, central: 8, centralFinal: 18, total: 217 };

export function resolveExamCounts(saved = {}) {
    const counts = Object.fromEntries(Object.entries(INITIAL_EXAM_COUNTS).map(([key, initial]) => [
        key, Number.isInteger(saved[key]) && saved[key] >= 0 ? saved[key] : initial
    ]));
    // Restore separate counters if the briefly merged schema was saved.
    if (Number.isInteger(saved.central) && saved.centralCategoryVersion === 2) counts.central = Math.max(0, saved.central - counts.centralFinal);
    return counts;
}

export function changeExamCounts(saved, before, after) {
    const counts = resolveExamCounts(saved);
    if (!before && after) counts.total++;
    if (before && !after) counts.total = Math.max(0, counts.total - 1);
    const keyFor = exam => {
        const type = normalizeExamType(exam?.examType);
        return type === 'اختبار فتري' ? 'periodic' : type === 'اختبار فتري مركزي' ? 'central' : type === CENTRAL_EXAM_TYPE ? 'centralFinal' : null;
    };
    const previousKey = keyFor(before);
    const nextKey = keyFor(after);
    if (previousKey !== nextKey) {
        if (previousKey) counts[previousKey] = Math.max(0, counts[previousKey] - 1);
        if (nextKey) counts[nextKey]++;
    }
    return counts;
}
