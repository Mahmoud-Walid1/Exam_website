// Records created before academic years were introduced belong to 1447.
export const LEGACY_YEAR = '1447';
export const CURRENT_EXAM_TYPES = ['اختبار فتري', 'اختبار فتري مركزي'];
export const DEFAULT_ACADEMIC_SETTINGS = {
    currentYear: '1448', activeTerm: 'الفصل الأول', showSecondTerm: false
};

export function normalizeYear(value) {
    const year = String(value ?? '').trim().replace(/[٠-٩]/g, digit => '٠١٢٣٤٥٦٧٨٩'.indexOf(digit));
    return /^1[4-5]\d{2}$/.test(year) ? year : '';
}

export function getExamYear(exam) {
    return normalizeYear(exam.academicYear) || LEGACY_YEAR;
}

export function resolveAcademicSettings(settings = {}) {
    return {
        ...DEFAULT_ACADEMIC_SETTINGS,
        currentYear: normalizeYear(settings.currentYear) || DEFAULT_ACADEMIC_SETTINGS.currentYear,
        activeTerm: settings.showSecondTerm === true && settings.activeTerm === 'الفصل الثاني' ? 'الفصل الثاني' : 'الفصل الأول',
        showSecondTerm: settings.showSecondTerm === true
    };
}

export function getArchiveYears(exams, currentYear) {
    return [...new Set(exams.map(getExamYear))].filter(year => Number(year) < Number(currentYear)).sort((a, b) => Number(b) - Number(a));
}

export function isInAcademicScope(exam, year, term) {
    return getExamYear(exam) === year && (exam.term || 'الفصل الأول') === term;
}
