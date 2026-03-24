// ========================================
// LocalStorage Data Management
// ========================================

const STORAGE_KEYS = {
    EXAMS: 'exams_data',
    SUBJECTS: 'subjects_data'
};

// Default subjects for each grade
const DEFAULT_SUBJECTS = {
    'ابتدائي': ['لغتي', 'رياضيات', 'علوم', 'دراسات اجتماعية', 'دراسات إسلامية'],
    'إعدادي': ['لغة عربية', 'رياضيات', 'علوم', 'دراسات اجتماعية', 'لغة إنجليزية'],
    'ثانوي': ['لغة عربية', 'رياضيات', 'فيزياء', 'كيمياء', 'أحياء', 'لغة إنجليزية']
};

// Initialize subjects if not exists
export function initializeSubjects() {
    const stored = localStorage.getItem(STORAGE_KEYS.SUBJECTS);
    if (!stored) {
        localStorage.setItem(STORAGE_KEYS.SUBJECTS, JSON.stringify(DEFAULT_SUBJECTS));
    }
}

// Get all subjects or subjects for specific grade
export function getSubjects(grade = null) {
    const stored = localStorage.getItem(STORAGE_KEYS.SUBJECTS);
    const allSubjects = stored ? JSON.parse(stored) : DEFAULT_SUBJECTS;
    return grade ? (allSubjects[grade] || []) : allSubjects;
}

// Add a subject to a grade
export function addSubject(grade, subject) {
    const allSubjects = getSubjects();
    if (!allSubjects[grade]) {
        allSubjects[grade] = [];
    }
    if (!allSubjects[grade].includes(subject)) {
        allSubjects[grade].push(subject);
        localStorage.setItem(STORAGE_KEYS.SUBJECTS, JSON.stringify(allSubjects));
        return true;
    }
    return false;
}

// Delete a subject from a grade
export function deleteSubject(grade, subject) {
    const allSubjects = getSubjects();
    if (allSubjects[grade]) {
        allSubjects[grade] = allSubjects[grade].filter(s => s !== subject);
        localStorage.setItem(STORAGE_KEYS.SUBJECTS, JSON.stringify(allSubjects));
        return true;
    }
    return false;
}

// Get all exams
export function getExams() {
    const stored = localStorage.getItem(STORAGE_KEYS.EXAMS);
    return stored ? JSON.parse(stored) : [];
}

// Add a new exam
export function addExam(examData) {
    const exams = getExams();
    const newExam = {
        id: Date.now().toString(),
        ...examData,
        createdAt: new Date().toISOString()
    };
    exams.push(newExam);
    localStorage.setItem(STORAGE_KEYS.EXAMS, JSON.stringify(exams));
    return newExam.id;
}

// Update an exam
export function updateExam(examId, examData) {
    const exams = getExams();
    const index = exams.findIndex(e => e.id === examId);
    if (index !== -1) {
        exams[index] = {
            ...exams[index],
            ...examData,
            updatedAt: new Date().toISOString()
        };
        localStorage.setItem(STORAGE_KEYS.EXAMS, JSON.stringify(exams));
        return true;
    }
    return false;
}

// Delete an exam
export function deleteExam(examId) {
    const exams = getExams();
    const filtered = exams.filter(e => e.id !== examId);
    localStorage.setItem(STORAGE_KEYS.EXAMS, JSON.stringify(filtered));
    return true;
}

// Listen to storage changes (for real-time updates across tabs)
export function onExamsChange(callback) {
    // Initial call
    callback(getExams());

    // Listen for storage events
    window.addEventListener('storage', (e) => {
        if (e.key === STORAGE_KEYS.EXAMS) {
            callback(getExams());
        }
    });

    // Also trigger on custom event for same-tab updates
    window.addEventListener('examsUpdated', () => {
        callback(getExams());
    });
}

// Trigger update event
export function triggerExamsUpdate() {
    window.dispatchEvent(new Event('examsUpdated'));
    // Also manually trigger storage event for same tab
    window.dispatchEvent(new StorageEvent('storage', {
        key: STORAGE_KEYS.EXAMS
    }));
}

// Export data for backup
export function exportData() {
    return {
        exams: getExams(),
        subjects: getSubjects(),
        exportDate: new Date().toISOString()
    };
}

// Import data from backup
export function importData(data) {
    if (data.exams) {
        localStorage.setItem(STORAGE_KEYS.EXAMS, JSON.stringify(data.exams));
    }
    if (data.subjects) {
        localStorage.setItem(STORAGE_KEYS.SUBJECTS, JSON.stringify(data.subjects));
    }
    triggerExamsUpdate();
    return true;
}
