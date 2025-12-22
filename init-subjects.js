// ========================================
// Script to Initialize Missing Subjects in Firebase
// Run this ONCE in browser console on admin page
// ========================================

// Import required functions
import { initializeSubjects } from './js/firebase-data.js';

// This will automatically add default subjects to Firebase
console.log('🔄 Initializing subjects in Firebase...');

initializeSubjects()
    .then(() => {
        console.log('✅ Subjects initialized successfully!');
        console.log('📝 Default subjects added:');
        console.log('  ابتدائي: لغتي، رياضيات، علوم، دراسات اجتماعية، دراسات إسلامية');
        console.log('  متوسط: لغة عربية، رياضيات، علوم، دراسات اجتماعية، لغة إنجليزية');
        console.log('  ثانوي: لغة عربية، رياضيات، فيزياء، كيمياء، أحياء، لغة إنجليزية');
        console.log('');
        console.log('⚠️ Now refresh the page (Ctrl + Shift + R) to see the changes!');
    })
    .catch(error => {
        console.error('❌ Error initializing subjects:', error);
    });
