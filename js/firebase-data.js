import { CURRENT_EXAM_TYPES } from './academic.js';
import { resolveExamCounts, changeExamCounts } from './exam-counts.js?v=20261016-more';
import { db, auth } from './firebase-config.js';
import {
    collection,
    getDocs,
    runTransaction,
    query,
    where,
    orderBy,
    documentId,
    limit,
    startAfter,
    doc,
    updateDoc,
    onSnapshot,
    setDoc,
    getDoc,
    increment
} from 'https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js';

// Default subjects for each grade
const DEFAULT_SUBJECTS = {
    'ابتدائي': ['لغتي', 'رياضيات', 'علوم', 'دراسات اجتماعية', 'دراسات إسلامية'],
    'متوسط': ['لغة عربية', 'رياضيات', 'علوم', 'دراسات اجتماعية', 'لغة إنجليزية'],
    'ثانوي': ['لغة عربية', 'رياضيات', 'فيزياء', 'كيمياء', 'أحياء', 'لغة إنجليزية']
};

// Default exam types
const DEFAULT_EXAM_TYPES = CURRENT_EXAM_TYPES;

// Standard grade levels for each stage
export const GRADE_LEVELS = {
    'ابتدائي': ['الأول', 'الثاني', 'الثالث', 'الرابع', 'الخامس', 'السادس'],
    'متوسط': ['الأول', 'الثاني', 'الثالث'],
    'ثانوي': ['الأول', 'الثاني', 'الثالث']
};

// Initialize default subjects if not exists
export async function initializeSubjects() {
    try {
        const subjectsRef = doc(db, 'settings', 'subjects');
        const subjectsDoc = await getDoc(subjectsRef);

        if (!subjectsDoc.exists()) {
            await setDoc(subjectsRef, DEFAULT_SUBJECTS);
            console.log('Default subjects initialized');
        }

        // Also initialize exam types
        const typesRef = doc(db, 'settings', 'examTypes');
        const typesDoc = await getDoc(typesRef);
        
        if (!typesDoc.exists()) {
            await setDoc(typesRef, { types: DEFAULT_EXAM_TYPES });
            console.log('Default exam types initialized');
        }
    } catch (error) {
        console.error('Error initializing settings:', error);
    }
}

// Get all subjects for a specific grade
export async function getSubjects(grade = null) {
    try {
        const subjectsRef = doc(db, 'settings', 'subjects');
        const subjectsDoc = await getDoc(subjectsRef);

        if (subjectsDoc.exists()) {
            const allSubjects = subjectsDoc.data();
            return grade ? (allSubjects[grade] || []) : allSubjects;
        }

        return grade ? [] : {};
    } catch (error) {
        console.error('Error getting subjects:', error);
        return grade ? [] : {};
    }
}

// Add a subject to a grade
export async function addSubject(grade, subject) {
    try {
        const subjectsRef = doc(db, 'settings', 'subjects');
        const subjectsDoc = await getDoc(subjectsRef);

        if (subjectsDoc.exists()) {
            const allSubjects = subjectsDoc.data();
            if (!allSubjects[grade]) {
                allSubjects[grade] = [];
            }
            if (!allSubjects[grade].includes(subject)) {
                allSubjects[grade].push(subject);
                await setDoc(subjectsRef, allSubjects);
                return true;
            }
        }
        return false;
    } catch (error) {
        console.error('Error adding subject:', error);
        return false;
    }
}

// Delete a subject from a grade
export async function deleteSubject(grade, subject) {
    try {
        const subjectsRef = doc(db, 'settings', 'subjects');
        const subjectsDoc = await getDoc(subjectsRef);

        if (subjectsDoc.exists()) {
            const allSubjects = subjectsDoc.data();
            if (allSubjects[grade]) {
                allSubjects[grade] = allSubjects[grade].filter(s => s !== subject);
                await setDoc(subjectsRef, allSubjects);
                return true;
            }
        }
        return false;
    } catch (error) {
        console.error('Error deleting subject:', error);
        return false;
    }
}

// Get all exam types
export async function getExamTypes() {
    try {
        const typesRef = doc(db, 'settings', 'examTypes');
        const typesDoc = await getDoc(typesRef);

        if (typesDoc.exists()) {
            return [...new Set([...CURRENT_EXAM_TYPES, ...(typesDoc.data().types || [])])];
        }

        return [...CURRENT_EXAM_TYPES];
    } catch (error) {
        console.error('Error getting exam types:', error);
        return [...CURRENT_EXAM_TYPES];
    }
}

// Add an exam type
export async function addExamType(type) {
    try {
        const typesRef = doc(db, 'settings', 'examTypes');
        const typesDoc = await getDoc(typesRef);

        let types = [];
        if (typesDoc.exists()) {
            types = typesDoc.data().types || [];
        }

        if (!types.includes(type)) {
            types.push(type);
            await setDoc(typesRef, { types });
            return true;
        }
        return false;
    } catch (error) {
        console.error('Error adding exam type:', error);
        return false;
    }
}

// Delete an exam type
export async function deleteExamType(type) {
    try {
        const typesRef = doc(db, 'settings', 'examTypes');
        const typesDoc = await getDoc(typesRef);

        if (typesDoc.exists()) {
            let types = typesDoc.data().types || [];
            types = types.filter(t => t !== type);
            await setDoc(typesRef, { types });
            return true;
        }
        return false;
    } catch (error) {
        console.error('Error deleting exam type:', error);
        return false;
    }
}

// Add a new exam
export async function addExam(examData) {
    try {
        const examsRef = collection(db, 'exams');
        const docRef = doc(examsRef);
        const countsRef = doc(db, 'settings', 'examCounts');
        await runTransaction(db, async transaction => {
            const countsSnapshot = await transaction.get(countsRef);
            const counts = changeExamCounts(countsSnapshot.exists() ? countsSnapshot.data() : {}, null, examData);
            transaction.set(docRef, { ...examData, createdAt: new Date().toISOString() });
            transaction.set(countsRef, { ...counts, updatedAt: new Date().toISOString() }, { merge: true });
        });
        return docRef.id;
    } catch (error) {
        console.error('Error adding exam:', error);
        throw error;
    }
}

// Get all exams
export async function getExams() {
    try {
        const examsRef = collection(db, 'exams');
        const snapshot = await getDocs(examsRef);
        const exams = [];

        snapshot.forEach((doc) => {
            exams.push({
                id: doc.id,
                ...doc.data()
            });
        });

        return exams;
    } catch (error) {
        console.error('Error getting exams:', error);
        return [];
    }
}

// Read a single saved summary; never count or download the exam collection.
export async function getExamCounts() {
    const snapshot = await getDoc(doc(db, 'settings', 'examCounts'));
    return resolveExamCounts(snapshot.exists() ? snapshot.data() : {});
}

// Listen to real-time exam updates
// Public catalog reads bounded pages; admin/report callers can still use getExams.
export async function getExamsPage({ filters = {}, cursor = null, pageSize = 12, simpleQuery = false } = {}) {
    const size = Math.max(1, Math.min(24, pageSize));
    const conditions = [];
    // Legacy records can lack academicYear/term, so keep those checks in the client.
    if (filters.academicYear && filters.academicYear !== '1447') {
        conditions.push(where('academicYear', 'in', [filters.academicYear, Number(filters.academicYear)]));
        if (filters.term) conditions.push(where('term', '==', filters.term));
    }
    for (const field of ['subject', 'grade', 'gradeLevel', 'examType']) {
        if (filters[field] && filters[field] !== 'all') conditions.push(where(field, '==', filters[field]));
    }
    // Older exams encode the period in their title, so resolve it after each bounded read.
    async function read(simple) {
        const constraints = simple ? conditions.slice(0, 1) : conditions;
        const pageQuery = query(collection(db, 'exams'), ...constraints, orderBy(documentId()), ...(cursor ? [startAfter(cursor)] : []), limit(size));
        const snapshot = await getDocs(pageQuery);
        return {
            exams: snapshot.docs.map(record => ({ ...record.data(), id: record.id })),
            cursor: snapshot.docs.at(-1) || cursor,
            hasMore: snapshot.size === size,
            simpleQuery: simple
        };
    }
    try { return await read(simpleQuery); }
    catch (error) {
        // A missing compound index must not trigger an unbounded collection read.
        if (!simpleQuery && error.code === 'failed-precondition' && conditions.length > 1) return read(true);
        throw error;
    }
}

export function onExamsChange(callback) {
    const examsRef = collection(db, 'exams');
    return onSnapshot(examsRef, (snapshot) => {
        const exams = [];
        snapshot.forEach((doc) => {
            exams.push({
                id: doc.id,
                ...doc.data()
            });
        });
        callback(exams);
    }, (error) => {
        console.error('Error in onExamsChange snapshot:', error);
    });
}

// Update an exam
export async function updateExam(examId, examData) {
    try {
        const examRef = doc(db, 'exams', examId);
        const countsRef = doc(db, 'settings', 'examCounts');
        await runTransaction(db, async transaction => {
            const [examSnapshot, countsSnapshot] = await Promise.all([transaction.get(examRef), transaction.get(countsRef)]);
            if (!examSnapshot.exists()) throw new Error('الاختبار غير موجود');
            const previous = examSnapshot.data();
            const counts = changeExamCounts(countsSnapshot.exists() ? countsSnapshot.data() : {}, previous, { ...previous, ...examData });
            transaction.update(examRef, { ...examData, updatedAt: new Date().toISOString() });
            transaction.set(countsRef, { ...counts, updatedAt: new Date().toISOString() }, { merge: true });
        });
        return true;
    } catch (error) {
        console.error('Error updating exam:', error);
        throw error;
    }
}

// Delete an exam
export async function deleteExam(examId) {
    try {
        const examRef = doc(db, 'exams', examId);
        const countsRef = doc(db, 'settings', 'examCounts');
        await runTransaction(db, async transaction => {
            const [examSnapshot, countsSnapshot] = await Promise.all([transaction.get(examRef), transaction.get(countsRef)]);
            if (!examSnapshot.exists()) return;
            const counts = changeExamCounts(countsSnapshot.exists() ? countsSnapshot.data() : {}, examSnapshot.data(), null);
            transaction.delete(examRef);
            transaction.set(countsRef, { ...counts, updatedAt: new Date().toISOString() }, { merge: true });
        });
        return true;
    } catch (error) {
        console.error('Error deleting exam:', error);
        throw error;
    }
}

// Get ticker items
export async function getTickerItems() {
    try {
        const tickerRef = doc(db, 'settings', 'ticker');
        const tickerDoc = await getDoc(tickerRef);

        if (tickerDoc.exists()) {
            return tickerDoc.data().items || [];
        }

        return [];
    } catch (error) {
        console.error('Error getting ticker items:', error);
        return [];
    }
}

// Add ticker item
export async function addTickerItem(item) {
    try {
        const tickerRef = doc(db, 'settings', 'ticker');
        const tickerDoc = await getDoc(tickerRef);

        let items = [];
        if (tickerDoc.exists()) {
            items = tickerDoc.data().items || [];
        }

        items.push({
            id: Date.now().toString(),
            ...item
        });

        await setDoc(tickerRef, { items });
        return true;
    } catch (error) {
        console.error('Error adding ticker item:', error);
        return false;
    }
}

// Delete ticker item
export async function deleteTickerItem(itemId) {
    try {
        const tickerRef = doc(db, 'settings', 'ticker');
        const tickerDoc = await getDoc(tickerRef);

        if (tickerDoc.exists()) {
            let items = tickerDoc.data().items || [];
            items = items.filter(item => item.id !== itemId);
            await setDoc(tickerRef, { items });
            return true;
        }

        return false;
    } catch (error) {
        console.error('Error deleting ticker item:', error);
        return false;
    }
}

// Get admin emails
export async function getAdminEmails() {
    try {
        const adminsRef = doc(db, 'settings', 'admins');
        const adminsDoc = await getDoc(adminsRef);

        if (adminsDoc.exists()) {
            return adminsDoc.data().emails || [];
        }

        return [];
    } catch (error) {
        console.error('Error getting admin emails:', error);
        return [];
    }
}

// Add admin email
export async function addAdminEmail(email) {
    try {
        const adminsRef = doc(db, 'settings', 'admins');
        const adminsDoc = await getDoc(adminsRef);

        let emails = [];
        if (adminsDoc.exists()) {
            emails = adminsDoc.data().emails || [];
        }

        if (emails.includes(email)) {
            return false; // Already exists
        }

        emails.push(email);
        await setDoc(adminsRef, { emails });
        return true;
    } catch (error) {
        console.error('Error adding admin email:', error);
        return false;
    }
}

// Delete admin email
export async function deleteAdminEmail(email) {
    try {
        const adminsRef = doc(db, 'settings', 'admins');
        const adminsDoc = await getDoc(adminsRef);

        if (adminsDoc.exists()) {
            let emails = adminsDoc.data().emails || [];
            emails = emails.filter(e => e !== email);
            await setDoc(adminsRef, { emails });
            return true;
        }

        return false;
    } catch (error) {
        console.error('Error deleting admin email:', error);
        return false;
    }
}

// Get general settings
export async function getGeneralSettings() {
    try {
        const settingsRef = doc(db, 'settings', 'general');
        const settingsDoc = await getDoc(settingsRef);
        if (settingsDoc.exists()) return settingsDoc.data();
        return { defaultTerm: 'الفصل الأول' };
    } catch (error) {
        console.error('Error getting general settings:', error);
        return { defaultTerm: 'الفصل الأول' };
    }
}

// Update general settings
export async function updateGeneralSettings(settings) {
    try {
        const settingsRef = doc(db, 'settings', 'general');
        await setDoc(settingsRef, settings, { merge: true });
        return true;
    } catch (error) {
        console.error('Error updating general settings:', error);
        return false;
    }
}

// Increment site visits counter
export async function incrementVisits(shouldIncrement = true) {
    try {
        const counterRef = doc(db, 'settings', 'counters');
        const counterDoc = await getDoc(counterRef);
        
        if (!counterDoc.exists()) {
            await setDoc(counterRef, { visits: 1 });
            return 1;
        }
        
        if (shouldIncrement) {
            await updateDoc(counterRef, {
                visits: increment(1)
            });
            const updatedDoc = await getDoc(counterRef);
            return updatedDoc.data().visits || 0;
        } else {
            return counterDoc.data().visits || 0;
        }
    } catch (error) {
        console.error('Error in incrementVisits:', error);
        return 0;
    }
}

// Export for global access
window.firebaseData = {
    initializeSubjects,
    getSubjects,
    addSubject,
    deleteSubject,
    getExamTypes,
    addExamType,
    deleteExamType,
    addExam,
    getExams,
    onExamsChange,
    updateExam,
    deleteExam,
    getTickerItems,
    addTickerItem,
    deleteTickerItem,
    getAdminEmails,
    addAdminEmail,
    deleteAdminEmail,
    getGeneralSettings,
    updateGeneralSettings,
    incrementVisits
};
