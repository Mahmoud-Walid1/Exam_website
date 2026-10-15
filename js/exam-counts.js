// Verified library totals before enabling transactional counters (2026-10-15).
// Used only until settings/examCounts is first saved by an exam mutation.
export const INITIAL_EXAM_COUNTS = { periodic: 52, central: 8 };

export function resolveExamCounts(saved = {}) {
    return Object.fromEntries(Object.entries(INITIAL_EXAM_COUNTS).map(([key, initial]) => [
        key, Number.isInteger(saved[key]) && saved[key] >= 0 ? saved[key] : initial
    ]));
}

export function changeExamCounts(saved, before, after) {
    const counts = resolveExamCounts(saved);
    const keyFor = exam => exam?.examType === 'اختبار فتري' ? 'periodic' : exam?.examType === 'اختبار فتري مركزي' ? 'central' : null;
    const previousKey = keyFor(before);
    const nextKey = keyFor(after);
    if (previousKey !== nextKey) {
        if (previousKey) counts[previousKey] = Math.max(0, counts[previousKey] - 1);
        if (nextKey) counts[nextKey]++;
    }
    return counts;
}
