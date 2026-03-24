import { initializeApp } from 'https://www.gstatic.com/firebasejs/10.7.1/firebase-app.js';
import { getFirestore } from 'https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js';
import { getAuth } from 'https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js';

// Firebase configuration
const firebaseConfig = {
    apiKey: "AIzaSyC0sXsVOAjsaGreuIZPAcjdFNpiTxX0xog",
    authDomain: "adv-mr-saber.firebaseapp.com",
    projectId: "adv-mr-saber",
    storageBucket: "adv-mr-saber.firebasestorage.app",
    messagingSenderId: "75884123360",
    appId: "1:75884123360:web:5f703338e29db60040ec85",
    measurementId: "G-6M2M4T77D8"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);
const auth = getAuth(app);

// Export for module use
export { db, auth };

// Set global window for non-module compatibility where needed (fallback)
window.db = db;
window.auth = auth;
