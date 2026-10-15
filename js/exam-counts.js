// Verified library totals when adding the complete catalog counter (2026-10-16).
// Used only until settings/examCounts is first saved by an exam mutation.
export const INITIAL_EXAM_COUNTS = { periodic: 74, central: 8, total: 217 };

export function resolveExamCounts(saved = {}) {
    return Object.fromEntries(Object.entries(INITIAL_EXAM_COUNTS).map(([key, initial]) => [
        key, Number.isInteger(saved[key]) && saved[key] >= 0 ? saved[key] : initial
    ]));
}

export function changeExamCounts(saved, before, after) {
    const counts = resolveExamCounts(saved);
    if (!before && after) counts.total++;
    if (before && !after) counts.total = Math.max(0, counts.total - 1);
    const keyFor = exam => exam?.examType === 'اختبار فتري' ? 'periodic' : exam?.examType === 'اختبار فتري مركزي' ? 'central' : null;
    const previousKey = keyFor(before);
    const nextKey = keyFor(after);
    if (previousKey !== nextKey) {
        if (previousKey) counts[previousKey] = Math.max(0, counts[previousKey] - 1);
        if (nextKey) counts[nextKey]++;
    }
    return counts;
}
