// ========================================
// Firebase Authentication
// ========================================

import {
    signInWithEmailAndPassword,
    signOut,
    onAuthStateChanged
} from 'https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js';

// Login with email and password
export async function login(email, password) {
    try {
        const userCredential = await signInWithEmailAndPassword(window.auth, email, password);
        return {
            success: true,
            user: userCredential.user
        };
    } catch (error) {
        console.error('Login error:', error);
        let message = 'حدث خطأ في تسجيل الدخول';

        switch (error.code) {
            case 'auth/invalid-email':
                message = 'البريد الإلكتروني غير صحيح';
                break;
            case 'auth/user-disabled':
                message = 'هذا الحساب معطل';
                break;
            case 'auth/user-not-found':
                message = 'البريد الإلكتروني أو كلمة المرور غير صحيحة';
                break;
            case 'auth/wrong-password':
                message = 'البريد الإلكتروني أو كلمة المرور غير صحيحة';
                break;
            case 'auth/invalid-credential':
                message = 'البريد الإلكتروني أو كلمة المرور غير صحيحة';
                break;
        }

        return {
            success: false,
            error: message
        };
    }
}

// Logout
export async function logout() {
    try {
        await signOut(window.auth);
        return { success: true };
    } catch (error) {
        console.error('Logout error:', error);
        return {
            success: false,
            error: 'حدث خطأ في تسجيل الخروج'
        };
    }
}

// Check auth state
export function checkAuth(callback) {
    return onAuthStateChanged(window.auth, (user) => {
        callback(user);
    });
}

// Get current user
export function getCurrentUser() {
    return window.auth.currentUser;
}

// Export for global access
window.firebaseAuth = {
    login,
    logout,
    checkAuth,
    getCurrentUser
};
