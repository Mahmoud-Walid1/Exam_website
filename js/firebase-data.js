import { db, auth } from './firebase-config.js';
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
    } catch (error) {
        console.error('Error initializing subjects:', error);
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

// Add a new exam
export async function addExam(examData) {
    try {
        const examsRef = collection(db, 'exams');
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

// Listen to real-time exam updates
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
    });
}

// Update an exam
export async function updateExam(examId, examData) {
    try {
        const examRef = doc(db, 'exams', examId);
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
        const examRef = doc(db, 'exams', examId);
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
    deleteTickerItem,
    getAdminEmails,
    addAdminEmail,
    deleteAdminEmail
};
