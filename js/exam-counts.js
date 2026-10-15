import { CENTRAL_EXAM_TYPE, normalizeExamType } from './academic.js?v=20261016-central';
// Verified library totals when adding the complete catalog counter (2026-10-16).
// Used only until settings/examCounts is first saved by an exam mutation.
export const INITIAL_EXAM_COUNTS = { periodic: 74, central: 26, total: 217 };

export function resolveExamCounts(saved = {}) {
    const counts = Object.fromEntries(Object.entries(INITIAL_EXAM_COUNTS).map(([key, initial]) => [
        key, Number.isInteger(saved[key]) && saved[key] >= 0 ? saved[key] : initial
    ]));
    // The old central counter excluded 18 legacy "اختبار مركزي" records.
    if (Number.isInteger(saved.central) && saved.centralCategoryVersion !== 2) counts.central += 18;
    return counts;
}

export function changeExamCounts(saved, before, after) {
    const counts = resolveExamCounts(saved);
    if (!before && after) counts.total++;
    if (before && !after) counts.total = Math.max(0, counts.total - 1);
    const keyFor = exam => normalizeExamType(exam?.examType) === 'اختبار فتري' ? 'periodic' : normalizeExamType(exam?.examType) === CENTRAL_EXAM_TYPE ? 'central' : null;
    const previousKey = keyFor(before);
    const nextKey = keyFor(after);
    if (previousKey !== nextKey) {
        if (previousKey) counts[previousKey] = Math.max(0, counts[previousKey] - 1);
        if (nextKey) counts[nextKey]++;
    }
    return counts;
}
