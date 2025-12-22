// ========================================
// Firebase Data Management - Icons Version
// ========================================

import {
    collection,
    addDoc,
    getDocs,
    doc,
    updateDoc,
    deleteDoc,
    onSnapshot,
    setDoc,
    getDoc
} from 'https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js';

// Default subjects for each grade
const DEFAULT_SUBJECTS = {
    'ابتدائي': ['لغتي', 'رياضيات', 'علوم', 'دراسات اجتماعية', 'دراسات إسلامية'],
    'متوسط': ['لغة عربية', 'رياضيات', 'علوم', 'دراسات اجتماعية', 'لغة إنجليزية'],
    'ثانوي': ['لغة عربية', 'رياضيات', 'فيزياء', 'كيمياء', 'أحياء', 'لغة إنجليزية']
};

// Initialize default subjects if not exists
export async function initializeSubjects() {
    try {
        const subjectsRef = doc(window.db, 'settings', 'subjects');
        const subjectsDoc = await getDoc(subjectsRef);

        if (!subjectsDoc.exists()) {
            await setDoc(subjectsRef, DEFAULT_SUBJECTS);
            console.log('Default subjects initialized');
        }
    } catch (error) {
        console.error('Error initializing subjects:', error);
    }
}

// Get all subjects for a specific grade
export async function getSubjects(grade = null) {
    try {
        const subjectsRef = doc(window.db, 'settings', 'subjects');
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
        const subjectsRef = doc(window.db, 'settings', 'subjects');
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
        const subjectsRef = doc(window.db, 'settings', 'subjects');
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

// Add a new exam
export async function addExam(examData) {
    try {
        const examsRef = collection(window.db, 'exams');
        const docRef = await addDoc(examsRef, {
            ...examData,
            createdAt: new Date().toISOString()
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
        const examsRef = collection(window.db, 'exams');
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

// Listen to real-time exam updates
export function onExamsChange(callback) {
    const examsRef = collection(window.db, 'exams');
    return onSnapshot(examsRef, (snapshot) => {
        const exams = [];
        snapshot.forEach((doc) => {
            exams.push({
                id: doc.id,
                ...doc.data()
            });
        });
        callback(exams);
    });
}

// Update an exam
export async function updateExam(examId, examData) {
    try {
        const examRef = doc(window.db, 'exams', examId);
        await updateDoc(examRef, {
            ...examData,
            updatedAt: new Date().toISOString()
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
        const examRef = doc(window.db, 'exams', examId);
        await deleteDoc(examRef);
        return true;
    } catch (error) {
        console.error('Error deleting exam:', error);
        throw error;
    }
}

// Get ticker items
export async function getTickerItems() {
    try {
        const tickerRef = doc(window.db, 'settings', 'ticker');
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
        const tickerRef = doc(window.db, 'settings', 'ticker');
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
        const tickerRef = doc(window.db, 'settings', 'ticker');
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

// Export for global access
window.firebaseData = {
    initializeSubjects,
    getSubjects,
    addSubject,
    deleteSubject,
    addExam,
    getExams,
    onExamsChange,
    updateExam,
    deleteExam,
    getTickerItems,
    addTickerItem,
    deleteTickerItem
};
