// Records created before academic years were introduced belong to 1447.
export const LEGACY_YEAR = '1447';
export const CENTRAL_EXAM_TYPE = 'الاختبار المركزي النهائي';
export const CENTRAL_EXAM_ALIASES = [CENTRAL_EXAM_TYPE, 'اختبار مركزي', 'اختبار فتري مركزي', 'اختبار مركزي نهائي'];
export const CURRENT_EXAM_TYPES = ['اختبار فتري', CENTRAL_EXAM_TYPE, 'اختبار قصير'];
export function normalizeExamType(type) {
    const value = String(type || '').trim();
    return CENTRAL_EXAM_ALIASES.includes(value) ? CENTRAL_EXAM_TYPE : value;
}
export function normalizeExam(exam) { return { ...exam, examType: normalizeExamType(exam.examType) }; }
export const DEFAULT_EXAM_PERIODS = ['فترة أولى', 'فترة ثانية'];
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

export function getExamPeriod(exam) {
    const saved = String(exam.examPeriod || '').trim();
    const text = (saved || exam.name || '').replace(/[أإآ]/g, 'ا').replace(/ى/g, 'ي').replace(/ة/g, 'ه').replace(/[\u064B-\u065F]/g, '');
    const match = text.match(/(?:ال)?فتره[\s:()\-–]*(?:ال)?(اولي|ثانيه?)/) || (saved ? text.match(/^(?:ال)?(اولي|ثانيه?)$/) : null);
    if (match) {
        if (match[1] === 'اولي') return 'فترة أولى';
        return 'فترة ثانية';
    }
    return saved;
}

export function matchesExamFilters(exam, filters = {}) {
    if (filters.term && filters.term !== 'all' && (exam.term || 'الفصل الأول') !== filters.term) return false;
    for (const field of ['grade', 'gradeLevel', 'subject', 'examType']) {
        if (filters[field] && filters[field] !== 'all' && (field === 'examType' ? normalizeExamType(exam[field]) !== normalizeExamType(filters[field]) : exam[field] !== filters[field])) return false;
    }
    return !filters.examPeriod || filters.examPeriod === 'all' || getExamPeriod(exam) === filters.examPeriod;
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
