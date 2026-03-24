// ========================================
// Admin Panel JavaScript - Firebase with Icons
// ========================================

import { login, logout, checkAuth, registerAdmin } from './firebase-auth.js';
import { initializeSubjects, getSubjects, addSubject, deleteSubject, addExam, getExams, deleteExam, updateExam, getAdminEmails, addAdminEmail, deleteAdminEmail, GRADE_LEVELS } from './firebase-data.js';

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
    { name: 'Physics.png', label: 'فيزياء' },
    { name: 'chemistry.png', label: 'كيمياء' },
    { name: 'احياء.png', label: 'أحياء' },
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
    setupAdminManager();
    setupTabSwitching();
    setupMobileSidebar();
    await updateQuickStats();
}

// Setup Mobile Sidebar Toggle
function setupMobileSidebar() {
    const sidebar = document.querySelector('.sidebar');
    const toggle = document.getElementById('sidebarToggle');
    
    if (toggle) {
        toggle.addEventListener('click', (e) => {
            e.stopPropagation();
            sidebar.classList.toggle('open');
        });

        // Close when clicking outside
        document.addEventListener('click', (e) => {
            if (sidebar.classList.contains('open') && !sidebar.contains(e.target)) {
                sidebar.classList.remove('open');
            }
        });
    }
}

// Setup Tab Switching
function setupTabSwitching() {
    const navItems = document.querySelectorAll('.nav-item[data-tab]');
    const tabContents = document.querySelectorAll('.tab-content');
    const currentTabTitle = document.getElementById('currentTabTitle');
    const sidebar = document.querySelector('.sidebar');

    navItems.forEach(item => {
        item.addEventListener('click', () => {
            const tabId = item.dataset.tab;

            // Update Sidebar Active state
            navItems.forEach(i => i.classList.remove('active'));
            item.classList.add('active');

            // Update Content Active state
            tabContents.forEach(content => content.classList.remove('active'));
            const targetTab = document.getElementById(`${tabId}-tab`);
            if (targetTab) targetTab.classList.add('active');

            // Update Header Title
            currentTabTitle.textContent = item.querySelector('span').textContent;

            // Close sidebar on mobile after selection
            sidebar.classList.remove('open');

            // Trigger specific tab logic
            if (tabId === 'dashboard') updateQuickStats();
            if (tabId === 'reports') displayFullReport();
        });
    });

    // Check for Deep Link on Load
    const urlParams = new URLSearchParams(window.location.search);
    const initialTab = urlParams.get('tab');
    if (initialTab) {
        const targetNav = document.querySelector(`.nav-item[data-tab="${initialTab}"]`);
        if (targetNav) targetNav.click();
    }
}

// ========================================
// Reporting Logic (Integrated)
// ========================================

function calculateCoverage() {
    const coverage = {};
    for (const [grade, levels] of Object.entries(GRADE_LEVELS)) {
        coverage[grade] = {};
        const gradeSubjects = allSubjects[grade] || [];
        for (const subject of gradeSubjects) {
            const subjectCoverage = { total: levels.length, covered: 0, missing: [], exams: [] };
            for (const level of levels) {
                const exam = allExams.find(e => e.grade === grade && e.gradeLevel === level && e.subject === subject);
                if (exam) { subjectCoverage.covered++; subjectCoverage.exams.push({ level, exam }); }
                else { subjectCoverage.missing.push(level); }
            }
            subjectCoverage.percentage = (subjectCoverage.covered / subjectCoverage.total) * 100;
            coverage[grade][subject] = subjectCoverage;
        }
    }
    return coverage;
}

function generateWarnings(coverage) {
    const warnings = [];
    for (const [grade, subjects] of Object.entries(coverage)) {
        for (const [subject, data] of Object.entries(subjects)) {
            if (data.covered === 0) {
                warnings.push({ type: 'critical', grade, subject, message: `نقص كامل: لا يوجد اختبار ${subject} - ${grade}`, icon: '🔴' });
            } else if (data.missing.length > 0) {
                const missingLevels = data.missing.map(l => `ص ${l}`).join('، ');
                warnings.push({ type: 'moderate', grade, subject, message: `نقص جزئي: ${subject} (${missingLevels}) - ${grade}`, details: `متوفر لـ ${data.covered} من ${data.total} صفوف`, icon: '⚠️' });
            }
        }
    }
    return warnings;
}

// Update Quick Stats & Home Summary
async function updateQuickStats() {
    const statExams = document.getElementById('statTotalExams');
    const statSubjects = document.getElementById('statTotalSubjects');
    const statCovered = document.getElementById('statCoveredGrades');
    const statWarningsCount = document.getElementById('statTotalWarnings');
    const homeWarnings = document.getElementById('homeWarningsContainer');

    const coverage = calculateCoverage();
    const warnings = generateWarnings(coverage);
    const criticalWarnings = warnings.filter(w => w.type !== 'info');

    // Stats Grid
    if (statExams) statExams.textContent = allExams.length;
    if (statSubjects) {
        let total = 0;
        Object.values(allSubjects).forEach(list => total += list.length);
        statSubjects.textContent = total;
    }
    if (statCovered) {
        const grades = Object.keys(GRADE_LEVELS);
        const coveredCount = grades.filter(grade => allExams.some(e => e.grade === grade)).length;
        statCovered.textContent = `${coveredCount}/${grades.length}`;
    }
    if (statWarningsCount) statWarningsCount.textContent = criticalWarnings.length;

    // Home Summary
    if (homeWarnings) {
        if (criticalWarnings.length === 0) {
            homeWarnings.innerHTML = '<p style="color: #48bb78; text-align: center;">كل شيء مغطى بشكل ممتاز! ✨</p>';
        } else {
            homeWarnings.innerHTML = `
                <div class="warnings-container">
                    ${criticalWarnings.slice(0, 5).map(w => `
                        <div class="warning-item ${w.type}">
                            <span class="warning-icon">${w.icon}</span>
                            <span class="warning-message">${w.message}</span>
                        </div>
                    `).join('')}
                    ${criticalWarnings.length > 5 ? `<p class="warnings-more">+ ${criticalWarnings.length - 5} تنبيهات أخرى</p>` : ''}
                </div>
            `;
        }
    }
}

// Full Report Tab Logic
function displayFullReport() {
    const container = document.getElementById('fullCoverageContainer');
    const coverage = calculateCoverage();
    let html = '';

    for (const [grade, subjects] of Object.entries(coverage)) {
        const totalSubs = Object.keys(subjects).length;
        const completeSubs = Object.values(subjects).filter(s => s.covered === s.total).length;

        html += `
            <div class="coverage-grade-card">
                <div class="coverage-grade-header">
                    <h3 class="coverage-grade-title">🎓 ${grade}</h3>
                    <span class="coverage-grade-badge">${completeSubs}/${totalSubs} مكتملة</span>
                </div>
                <div class="coverage-subjects-grid">
                    ${Object.entries(subjects).map(([subject, data]) => {
                        let statusColor = data.percentage === 100 ? '#48bb78' : (data.percentage > 0 ? '#ed8936' : '#ef4444');
                        return `
                        <div class="coverage-subject-card">
                            <div class="coverage-subject-info">
                                <span class="coverage-subject-name">${subject}</span>
                                <span class="coverage-subject-percent" style="color: ${statusColor};">${Math.round(data.percentage)}%</span>
                            </div>
                            <div class="coverage-progress-bg">
                                <div class="coverage-progress-fill" style="width: ${data.percentage}%; background: ${statusColor};"></div>
                            </div>
                            <div class="coverage-subject-meta">${data.covered}/${data.total} صفوف تمت تغطيتها</div>
                        </div>
                        `;
                    }).join('')}
                </div>
            </div>
        `;
    }

    container.innerHTML = html || '<p style="text-align: center; color: #94a3b8;">لا توجد بيانات متاحة حالياً</p>';
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
                <div style="flex: 1;">
                    <div style="font-weight: 600;">${item.text}</div>
                    <a href="${item.url || '#'}" target="_blank" style="font-size: 0.8rem; color: var(--secondary-color);">عرض المنتج</a>
                </div>
                <button class="btn-danger btn-small" onclick="handleDeleteTickerItem('${item.id}')">×</button>
            </div>
        `).join('');
    }

    // Add ticker item
    document.getElementById('addTickerBtn').addEventListener('click', async () => {
        const text = document.getElementById('tickerText').value.trim();
        const url = document.getElementById('tickerUrl').value.trim();
        const icon = document.getElementById('tickerIcon').value;

        if (!text) { alert('من فضلك أدخل نص الملزمة'); return; }
        if (!url) { alert('من فضلك أدخل رابط المنتج'); return; }
        if (!icon) { alert('من فضلك اختر أيقونة'); return; }

        const success = await addTickerItem({ text, url, icon });

        if (success) {
            document.getElementById('tickerText').value = '';
            document.getElementById('tickerUrl').value = '';
            document.getElementById('tickerIcon').value = '';
            await loadTickerItems();
            updateQuickStats();
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
                updateQuickStats();
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
    updateQuickStats();
}

// Setup add exam form
function setupAddExamForm() {
    const form = document.getElementById('addExamForm');
    const gradeSelect = document.getElementById('examGrade');
    const message = document.getElementById('addExamMessage');
    const cancelBtn = document.getElementById('cancelEditBtn');

    // Update dropdowns when grade changes
    gradeSelect.addEventListener('change', () => {
        updateExamGradeLevelDropdown();
        updateExamSubjectDropdown();
    });

    // Cancel edit button
    cancelBtn.addEventListener('click', cancelEdit);

    form.addEventListener('submit', async (e) => {
        e.preventDefault();
        message.style.display = 'none';

        const name = document.getElementById('examName').value;
        const url = document.getElementById('examUrl').value;
        const grade = document.getElementById('examGrade').value;
        const gradeLevel = document.getElementById('examGradeLevel').value;
        const subject = document.getElementById('examSubject').value;
        const icon = selectedIcon;
        const imageUrl = document.getElementById('examImageUrl').value.trim();
        const editingId = document.getElementById('editingExamId').value;

        if (!icon) { alert('من فضلك اختر أيقونة للاختبار'); return; }

        try {
            // Show loading
            const submitBtn = document.getElementById('submitExamBtn');
            const originalText = submitBtn.textContent;
            submitBtn.textContent = editingId ? 'جاري التحديث...' : 'جاري الإضافة...';
            submitBtn.disabled = true;

            const examData = { name, url, grade, gradeLevel, subject, icon, imageUrl };

            if (editingId) {
                await updateExam(editingId, examData);
                message.textContent = 'تم تحديث الاختبار بنجاح! ✅';
            } else {
                await addExam(examData);
                message.textContent = 'تم إضافة الاختبار بنجاح! ✅';
            }
            message.style.display = 'block';

            // Reset form
            cancelEdit();
            await loadExams();

            // Reset button
            submitBtn.textContent = 'إضافة الاختبار';
            submitBtn.disabled = false;

            // Hide message after 3 seconds
            setTimeout(() => { message.style.display = 'none'; }, 3000);

        } catch (error) {
            alert('حدث خطأ: ' + error.message);
            const submitBtn = form.querySelector('button[type="submit"]');
            submitBtn.textContent = 'إضافة الاختبار';
            submitBtn.disabled = false;
        }
    });
}

// Edit existing exam
window.editExam = function (examId) {
    const exam = allExams.find(e => e.id === examId);
    if (!exam) return;

    document.getElementById('examName').value = exam.name;
    document.getElementById('examUrl').value = exam.url;
    document.getElementById('examGrade').value = exam.grade;

    // Trigger grade change
    document.getElementById('examGrade').dispatchEvent(new Event('change'));

    setTimeout(() => {
        document.getElementById('examGradeLevel').value = exam.gradeLevel;
        document.getElementById('examSubject').value = exam.subject;
    }, 100);

    document.getElementById('examImageUrl').value = exam.imageUrl || '';
    selectedIcon = exam.icon;
    document.getElementById('selectedIcon').value = exam.icon;
    document.querySelectorAll('.icon-option').forEach(opt => {
        if (opt.querySelector('img').src.includes(exam.icon)) opt.classList.add('active');
        else opt.classList.remove('active');
    });

    document.getElementById('submitExamBtn').textContent = 'حفظ التعديلات ✅';
    document.getElementById('cancelEditBtn').style.display = 'inline-block';
    document.getElementById('editingExamId').value = examId;
    document.getElementById('addExamForm').scrollIntoView({ behavior: 'smooth', block: 'start' });
};

// Cancel edit
function cancelEdit() {
    const form = document.getElementById('addExamForm');
    form.reset();
    selectedIcon = null;
    document.querySelectorAll('.icon-option').forEach(opt => opt.classList.remove('active'));
    document.getElementById('selectedIcon').value = '';
    document.getElementById('editingExamId').value = '';
    document.getElementById('examImageUrl').value = '';
    document.getElementById('submitExamBtn').textContent = 'إضافة الاختبار';
    document.getElementById('cancelEditBtn').style.display = 'none';
}

// Update exam grade level dropdown
function updateExamGradeLevelDropdown() {
    const gradeSelect = document.getElementById('examGrade');
    const gradeLevelSelect = document.getElementById('examGradeLevel');
    const selectedGrade = gradeSelect.value;
    gradeLevelSelect.innerHTML = '<option value="">اختر الصف</option>';
    if (selectedGrade && GRADE_LEVELS[selectedGrade]) {
        gradeLevelSelect.disabled = false;
        GRADE_LEVELS[selectedGrade].forEach(level => {
            const option = document.createElement('option');
            option.value = level; option.textContent = `الصف ${level}`;
            gradeLevelSelect.appendChild(option);
        });
    } else {
        gradeLevelSelect.disabled = true;
        gradeLevelSelect.innerHTML = '<option value="">اختر المرحلة أولاً</option>';
    }
}

// Update exam subject dropdown
function updateExamSubjectDropdown() {
    const gradeSelect = document.getElementById('examGrade');
    const subjectSelect = document.getElementById('examSubject');
    const selectedGrade = gradeSelect.value;
    subjectSelect.innerHTML = '<option value="">اختر المادة</option>';
    if (selectedGrade && allSubjects[selectedGrade]) {
        allSubjects[selectedGrade].forEach(subject => {
            const option = document.createElement('option');
            option.value = subject; option.textContent = subject;
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
        if (!subject) { alert('من فضلك أدخل اسم المادة'); return; }
        const success = await addSubject(grade, subject);
        if (success) {
            document.getElementById('newSubject').value = '';
            await loadSubjects();
            updateQuickStats();
            alert('تم إضافة المادة بنجاح! ✅');
        } else { alert('المادة موجودة بالفعل'); }
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
        updateQuickStats();
    }
};

// Display exams table
function displayExamsTable() {
    const tableBody = document.getElementById('examsTableBody');
    if (allExams.length === 0) {
        tableBody.innerHTML = '<tr><td colspan="8" style="text-align: center;">لا توجد اختبارات</td></tr>';
        return;
    }

    tableBody.innerHTML = allExams.map(exam => `
        <tr>
            <td><img src="${exam.icon}" alt="${exam.name}" class="table-image" onerror="this.src='icons/default.png'"></td>
            <td style="font-weight: 700;">${exam.name}</td>
            <td><span class="exam-badge" style="background:#f1f5f9;">${exam.grade}</span></td>
            <td>الصف ${exam.gradeLevel}</td>
            <td>${exam.subject}</td>
            <td><img src="${exam.imageUrl || 'icons/default.png'}" class="table-image" onerror="this.src='icons/default.png'"></td>
            <td><a href="${exam.url}" target="_blank" class="table-link">رابط المنتج</a></td>
            <td class="table-actions">
                <button class="btn-edit" onclick="editExam('${exam.id}')">
                    <lord-icon src="https://cdn.lordicon.com/pnavxiaz.json" trigger="hover" colors="primary:#ffffff" style="width:18px;height:18px;"></lord-icon>
                    تعديل
                </button>
                <button class="btn-delete" onclick="handleDeleteExam('${exam.id}')">
                    <lord-icon src="https://cdn.lordicon.com/kfzoxerb.json" trigger="hover" colors="primary:#ffffff" style="width:18px;height:18px;"></lord-icon>
                    حذف
                </button>
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
        } catch (error) { alert('حدث خطأ في الحذف'); }
    }
};

// Setup Admin Manager
async function setupAdminManager() {
    const addAdminBtn = document.getElementById('addAdminBtn');
    if (!addAdminBtn) return;

    async function loadAdminEmails() {
        const emails = await getAdminEmails();
        const list = document.getElementById('adminEmailsList');
        if (emails.length === 0) { list.innerHTML = '<p style="text-align: center; color: #94a3b8;">لا توجد حسابات مسؤولين</p>'; return; }
        list.innerHTML = emails.map(email => `
            <div class="admin-email-card">
                <span class="admin-email-icon">👤</span>
                <span class="admin-email-text">${email}</span>
                <button class="btn-danger btn-small" onclick="handleDeleteAdmin('${email}')">×</button>
            </div>
        `).join('');
    }

    addAdminBtn.addEventListener('click', async () => {
        const email = document.getElementById('newAdminEmail').value.trim();
        const pass = document.getElementById('newAdminPassword').value;
        if (!email || !pass || pass.length < 6) { alert('بيانات غير صحيحة'); return; }
        addAdminBtn.disabled = true;
        try {
            const res = await registerAdmin(email, pass);
            if (res.success) {
                await addAdminEmail(email);
                document.getElementById('newAdminEmail').value = '';
                document.getElementById('newAdminPassword').value = '';
                await loadAdminEmails();
                alert('تم الإضافة بنجاح! ✅');
            } else { alert(res.error); }
        } catch (e) { alert('خطأ'); }
        addAdminBtn.disabled = false;
    });

    window.handleDeleteAdmin = async (email) => {
        if (confirm(`حذف المسئول ${email}؟`)) {
            if (await deleteAdminEmail(email)) await loadAdminEmails();
        }
    };

    await loadAdminEmails();
}
