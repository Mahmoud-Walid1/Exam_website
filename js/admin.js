// ========================================
// Admin Panel JavaScript - Firebase with Icons
// ========================================

import { login, logout, checkAuth } from './firebase-auth.js';
import { initializeSubjects, getSubjects, addSubject, deleteSubject, addExam, getExams, deleteExam } from './firebase-data.js';

let allSubjects = {};
let allExams = [];
let selectedIcon = null;

// Available icons
const AVAILABLE_ICONS = [
    { name: 'math.png', label: 'رياضيات' },
    { name: 'arabic.png', label: 'لغة عربية' },
    { name: 'science.png', label: 'علوم' },
    { name: 'english.png', label: 'لغة إنجليزية' },
    { name: 'social_studies.png', label: 'دراسات اجتماعية' },
    { name: 'islamic_studies.png', label: 'دراسات إسلامية' },
    { name: 'default.png', label: 'افتراضي' }
];

// Initialize
document.addEventListener('DOMContentLoaded', () => {
    console.log('Admin panel loaded');
    setupAuthListener();
    setupLoginForm();
});

// Setup authentication state listener
function setupAuthListener() {
    console.log('Setting up auth listener...');
    checkAuth(async (user) => {
        console.log('Auth state changed:', user ? 'Logged in' : 'Not logged in');
        const loginSection = document.getElementById('loginSection');
        const adminDashboard = document.getElementById('adminDashboard');

        if (user) {
            // User is logged in
            console.log('User logged in:', user.email);
            loginSection.style.display = 'none';
            adminDashboard.style.display = 'block';
            await initializeDashboard();
        } else {
            // User is not logged in
            console.log('User not logged in');
            loginSection.style.display = 'flex';
            adminDashboard.style.display = 'none';
        }
    });
}

// Setup login form
function setupLoginForm() {
    const loginForm = document.getElementById('loginForm');
    const loginError = document.getElementById('loginError');
    const loginButton = document.getElementById('loginButton');

    console.log('Login form setup');

    loginForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        e.stopPropagation();

        console.log('Login form submitted');

        const email = document.getElementById('email').value.trim();
        const password = document.getElementById('password').value;

        console.log('Attempting login with email:', email);

        loginError.style.display = 'none';
        loginButton.disabled = true;
        loginButton.textContent = 'جاري تسجيل الدخول...';

        try {
            const result = await login(email, password);

            console.log('Login result:', result);

            if (!result.success) {
                loginError.textContent = result.error;
                loginError.style.display = 'block';
                loginButton.disabled = false;
                loginButton.textContent = 'تسجيل الدخول';
                console.error('Login failed:', result.error);
            } else {
                console.log('Login successful!');
            }
        } catch (error) {
            console.error('Login error:', error);
            loginError.textContent = 'حدث خطأ في تسجيل الدخول. تحقق من اتصال الإنترنت.';
            loginError.style.display = 'block';
            loginButton.disabled = false;
            loginButton.textContent = 'تسجيل الدخول';
        }

        return false;
    });
}

// Initialize dashboard
async function initializeDashboard() {
    console.log('Initializing dashboard...');
    await initializeSubjects();
    await loadSubjects();
    await loadExams();
    setupLogout();
    setupAddExamForm();
    setupSubjectsManager();
    setupIconSelector();
    setupTickerManager();
}

// Setup ticker manager
async function setupTickerManager() {
    const { getTickerItems, addTickerItem, deleteTickerItem } = await import('./firebase-data.js');

    // Load and display ticker items
    async function loadTickerItems() {
        const items = await getTickerItems();
        const tickerItemsList = document.getElementById('tickerItemsList');

        if (items.length === 0) {
            tickerItemsList.innerHTML = '<p style="color: var(--text-muted); text-align: center;">لا توجد عناصر في الشريط</p>';
            return;
        }

        tickerItemsList.innerHTML = items.map(item => `
            <div class="ticker-item-card">
                <img src="${item.icon}" alt="${item.text}" style="width: 40px; height: 40px; object-fit: contain;">
                <span>${item.text}</span>
                <button class="btn-danger btn-small" onclick="handleDeleteTickerItem('${item.id}')">×</button>
            </div>
        `).join('');
    }

    // Add ticker item
    document.getElementById('addTickerBtn').addEventListener('click', async () => {
        const text = document.getElementById('tickerText').value.trim();
        const icon = document.getElementById('tickerIcon').value;

        if (!text) {
            alert('من فضلك أدخل نص الملزمة');
            return;
        }

        if (!icon) {
            alert('من فضلك اختر أيقونة');
            return;
        }

        const success = await addTickerItem({ text, icon });

        if (success) {
            document.getElementById('tickerText').value = '';
            document.getElementById('tickerIcon').value = '';
            await loadTickerItems();
            alert('تم إضافة العنصر للشريط! ✅');
        } else {
            alert('حدث خطأ');
        }
    });

    // Delete ticker item handler
    window.handleDeleteTickerItem = async (itemId) => {
        if (confirm('هل تريد حذف هذا العنصر من الشريط؟')) {
            const success = await deleteTickerItem(itemId);
            if (success) {
                await loadTickerItems();
                alert('تم الحذف! ✅');
            }
        }
    };

    // Initial load
    await loadTickerItems();
}

// Setup logout button
function setupLogout() {
    const logoutBtn = document.getElementById('logoutBtn');
    logoutBtn.addEventListener('click', async () => {
        await logout();
    });
}

// Setup icon selector
function setupIconSelector() {
    const iconSelector = document.getElementById('iconSelector');
    const selectedIconInput = document.getElementById('selectedIcon');

    iconSelector.innerHTML = AVAILABLE_ICONS.map(icon => `
        <div class="icon-option" data-icon="icons/${icon.name}">
            <img src="icons/${icon.name}" alt="${icon.label}">
            <span>${icon.label}</span>
        </div>
    `).join('');

    // Add click handlers
    document.querySelectorAll('.icon-option').forEach(option => {
        option.addEventListener('click', () => {
            // Remove active from all
            document.querySelectorAll('.icon-option').forEach(opt => opt.classList.remove('active'));
            // Add active to clicked
            option.classList.add('active');
            // Set selected icon
            selectedIcon = option.dataset.icon;
            selectedIconInput.value = selectedIcon;
        });
    });
}

// Load subjects
async function loadSubjects() {
    allSubjects = await getSubjects();
    updateSubjectsDisplay();
    updateExamSubjectDropdown();
}

// Load exams
async function loadExams() {
    allExams = await getExams();
    displayExamsTable();
}

// Setup add exam form
function setupAddExamForm() {
    const form = document.getElementById('addExamForm');
    const gradeSelect = document.getElementById('examGrade');
    const message = document.getElementById('addExamMessage');

    // Update subject dropdown when grade changes
    gradeSelect.addEventListener('change', updateExamSubjectDropdown);

    form.addEventListener('submit', async (e) => {
        e.preventDefault();
        message.style.display = 'none';

        const name = document.getElementById('examName').value;
        const url = document.getElementById('examUrl').value;
        const grade = document.getElementById('examGrade').value;
        const subject = document.getElementById('examSubject').value;
        const icon = selectedIcon;

        if (!icon) {
            alert('من فضلك اختر أيقونة للاختبار');
            return;
        }

        try {
            // Show loading
            const submitBtn = form.querySelector('button[type="submit"]');
            const originalText = submitBtn.textContent;
            submitBtn.textContent = 'جاري الإضافة...';
            submitBtn.disabled = true;

            // Add exam to Firestore
            await addExam({
                name,
                url,
                grade,
                subject,
                icon
            });

            // Success message
            message.textContent = 'تم إضافة الاختبار بنجاح! ✅';
            message.style.display = 'block';

            // Reset form
            form.reset();
            selectedIcon = null;
            document.querySelectorAll('.icon-option').forEach(opt => opt.classList.remove('active'));
            document.getElementById('selectedIcon').value = '';

            // Reload exams
            await loadExams();

            // Reset button
            submitBtn.textContent = originalText;
            submitBtn.disabled = false;

            // Hide message after 3 seconds
            setTimeout(() => {
                message.style.display = 'none';
            }, 3000);

        } catch (error) {
            alert('حدث خطأ: ' + error.message);
            const submitBtn = form.querySelector('button[type="submit"]');
            submitBtn.textContent = 'إضافة الاختبار';
            submitBtn.disabled = false;
        }
    });
}

// Update exam subject dropdown based on selected grade
function updateExamSubjectDropdown() {
    const gradeSelect = document.getElementById('examGrade');
    const subjectSelect = document.getElementById('examSubject');
    const selectedGrade = gradeSelect.value;

    subjectSelect.innerHTML = '<option value="">اختر المادة</option>';

    if (selectedGrade && allSubjects[selectedGrade]) {
        allSubjects[selectedGrade].forEach(subject => {
            const option = document.createElement('option');
            option.value = subject;
            option.textContent = subject;
            subjectSelect.appendChild(option);
        });
    }
}

// Setup subjects manager
function setupSubjectsManager() {
    const addSubjectBtn = document.getElementById('addSubjectBtn');

    addSubjectBtn.addEventListener('click', async () => {
        const grade = document.getElementById('subjectGrade').value;
        const subject = document.getElementById('newSubject').value.trim();

        if (!subject) {
            alert('من فضلك أدخل اسم المادة');
            return;
        }

        const success = await addSubject(grade, subject);

        if (success) {
            document.getElementById('newSubject').value = '';
            await loadSubjects();
            alert('تم إضافة المادة بنجاح! ✅');
        } else {
            alert('المادة موجودة بالفعل');
        }
    });
}

// Update subjects display
function updateSubjectsDisplay() {
    const subjectsList = document.getElementById('subjectsList');

    subjectsList.innerHTML = Object.entries(allSubjects).map(([grade, subjects]) => `
        <div class="subject-group">
            <h4>${grade}</h4>
            <div class="subject-tags">
                ${subjects.map(subject => `
                    <div class="subject-tag">
                        <span>${subject}</span>
                        <button onclick="handleDeleteSubject('${grade}', '${subject}')">×</button>
                    </div>
                `).join('')}
            </div>
        </div>
    `).join('');
}

// Handle delete subject
window.handleDeleteSubject = async (grade, subject) => {
    if (confirm(`هل تريد حذف المادة "${subject}" من ${grade}؟`)) {
        await deleteSubject(grade, subject);
        await loadSubjects();
    }
};

// Display exams table
function displayExamsTable() {
    const tableBody = document.getElementById('examsTableBody');

    if (allExams.length === 0) {
        tableBody.innerHTML = '<tr><td colspan="6" style="text-align: center;">لا توجد اختبارات</td></tr>';
        return;
    }

    tableBody.innerHTML = allExams.map(exam => `
        <tr>
            <td><img src="${exam.icon}" alt="${exam.name}" class="table-image" onerror="this.src='icons/default.png'"></td>
            <td>${exam.name}</td>
            <td>${exam.grade}</td>
            <td>${exam.subject}</td>
            <td><a href="${exam.url}" target="_blank" class="table-link">رابط المنتج</a></td>
            <td class="table-actions">
                <button class="btn-danger btn-small" onclick="handleDeleteExam('${exam.id}')">حذف</button>
            </td>
        </tr>
    `).join('');
}

// Handle delete exam
window.handleDeleteExam = async (examId) => {
    if (confirm('هل تريد حذف هذا الاختبار؟')) {
        try {
            await deleteExam(examId);
            await loadExams();
            alert('تم حذف الاختبار بنجاح! ✅');
        } catch (error) {
            alert('حدث خطأ في الحذف');
        }
    }
};
