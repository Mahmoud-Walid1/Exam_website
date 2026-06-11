// ========================================
// Admin Panel JavaScript - Firebase with Icons
// ========================================

import { login, logout, checkAuth, registerAdmin } from './firebase-auth.js';
import { initializeSubjects, getSubjects, addSubject, deleteSubject, getExamTypes, addExamType, deleteExamType, addExam, getExams, deleteExam, updateExam, getAdminEmails, addAdminEmail, deleteAdminEmail, GRADE_LEVELS, getGeneralSettings, updateGeneralSettings } from './firebase-data.js';

let allSubjects = {};
let allExams = [];
let allExamTypes = [];
let selectedIcon = null;

// Filtering and view state
let activeViewMode = 'grid'; // 'grid' or 'table'
let currentFilters = {
    search: '',
    grade: '',
    gradeLevel: '',
    subject: '',
    term: '',
    examType: '',
    isStandard: ''
};

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
    await loadExamTypes();
    setupExamsControlPanel();
    await loadExams();
    setupLogout();
    setupAddExamForm();
    setupSubjectsManager();
    setupExamTypesManager();
    setupIconSelector();
    setupTickerManager();
    setupAdminManager();
    setupSallaImporter();
    setupTabSwitching();
    setupMobileSidebar();
    await setupGeneralSettings();
    await updateQuickStats();
}

// Setup General Settings
async function setupGeneralSettings() {
    const settings = await getGeneralSettings();
    const termSelect = document.getElementById('adminDefaultTerm');
    if (termSelect) termSelect.value = settings.defaultTerm || 'الفصل الأول';
    
    document.getElementById('saveGeneralSettingsBtn').addEventListener('click', async () => {
        const btn = document.getElementById('saveGeneralSettingsBtn');
        const msg = document.getElementById('generalSettingsMsg');
        btn.disabled = true;
        btn.textContent = 'جاري الحفظ...';
        
        await updateGeneralSettings({ defaultTerm: termSelect.value });
        
        msg.style.display = 'inline-block';
        setTimeout(() => msg.style.display = 'none', 3000);
        btn.disabled = false;
        btn.textContent = 'حفظ الإعدادات';
    });
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
    updateFilterSubjectDropdown();
}

// Load exams
async function loadExams() {
    allExams = await getExams();
    applyExamsFiltering();
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
        const term = document.getElementById('examTerm').value;
        const grade = document.getElementById('examGrade').value;
        const gradeLevel = document.getElementById('examGradeLevel').value;
        const subject = document.getElementById('examSubject').value;
        const examType = document.getElementById('examType').value;
        const examModel = document.getElementById('examModel').value.trim();
        const examIsStandard = document.getElementById('examIsStandard').checked;
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

            const examData = { name, url, term, grade, gradeLevel, subject, examType, examModel, examIsStandard, icon, imageUrl };

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
    document.getElementById('examTerm').value = exam.term || '';
    document.getElementById('examGrade').value = exam.grade;
    document.getElementById('examType').value = exam.examType || '';
    document.getElementById('examModel').value = exam.examModel || '';
    document.getElementById('examIsStandard').checked = exam.examIsStandard || false;

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
    openModal(true, exam.name);
};

// Cancel edit
function cancelEdit() {
    const form = document.getElementById('addExamForm');
    if (form) form.reset();
    selectedIcon = null;
    document.querySelectorAll('.icon-option').forEach(opt => opt.classList.remove('active'));
    const selectedIconInput = document.getElementById('selectedIcon');
    if (selectedIconInput) selectedIconInput.value = '';
    const editingExamIdInput = document.getElementById('editingExamId');
    if (editingExamIdInput) editingExamIdInput.value = '';
    const examImageUrlInput = document.getElementById('examImageUrl');
    if (examImageUrlInput) examImageUrlInput.value = '';

    // Clear dropdowns dynamically
    const examGradeLevel = document.getElementById('examGradeLevel');
    if (examGradeLevel) {
        examGradeLevel.disabled = true;
        examGradeLevel.innerHTML = '<option value="">اختر المرحلة أولاً</option>';
    }
    const examSubject = document.getElementById('examSubject');
    if (examSubject) {
        examSubject.innerHTML = '<option value="">اختر المادة</option>';
    }

    // Also reset checkboxes and buttons
    const submitBtn = document.getElementById('submitExamBtn');
    if (submitBtn) submitBtn.textContent = 'إضافة الاختبار';
    const cancelBtn = document.getElementById('cancelEditBtn');
    if (cancelBtn) cancelBtn.style.display = 'none';

    // Close modal
    const modalOverlay = document.getElementById('examModalOverlay');
    if (modalOverlay) modalOverlay.classList.remove('active');
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

// Load Exam Types
async function loadExamTypes() {
    allExamTypes = await getExamTypes();
    updateExamTypesDisplay();
    updateExamTypeDropdown();
    updateFilterExamTypeDropdown();
}

// Setup Exam Types Manager
function setupExamTypesManager() {
    const addExamTypeBtn = document.getElementById('addExamTypeBtn');
    addExamTypeBtn.addEventListener('click', async () => {
        const typeStr = document.getElementById('newExamType').value.trim();
        if (!typeStr) { alert('من فضلك أدخل اسم النوع'); return; }
        const success = await addExamType(typeStr);
        if (success) {
            document.getElementById('newExamType').value = '';
            await loadExamTypes();
            alert('تم إضافة النوع بنجاح! ✅');
        } else { alert('النوع موجود بالفعل'); }
    });
}

// Update Exam Types Display
function updateExamTypesDisplay() {
    const examTypesList = document.getElementById('examTypesList');
    examTypesList.innerHTML = `
        <div class="subject-tags">
            ${allExamTypes.map(type => `
                <div class="subject-tag" style="background-color: #fce7f3; color: #be185d; border-color: #fbcfe8;">
                    <span>${type}</span>
                    <button style="color: #be185d;" onclick="handleDeleteExamType('${type}')">×</button>
                </div>
            `).join('')}
        </div>
    `;
}

// Update Exam Type Dropdown
function updateExamTypeDropdown() {
    const typeSelect = document.getElementById('examType');
    typeSelect.innerHTML = '<option value="">اختر النوع</option>';
    allExamTypes.forEach(type => {
        const option = document.createElement('option');
        option.value = type; option.textContent = type;
        typeSelect.appendChild(option);
    });
}

// Handle delete exam type
window.handleDeleteExamType = async (type) => {
    if (confirm(`هل تريد حذف نوع الاختبار "${type}"؟`)) {
        await deleteExamType(type);
        await loadExamTypes();
    }
};

// Display exams table
function displayExamsTable() {
    applyExamsFiltering();
}

function renderExamsTable(exams) {
    const tableBody = document.getElementById('examsTableBody');
    if (!tableBody) return;
    
    tableBody.innerHTML = exams.map(exam => `
        <tr>
            <td><img src="${exam.icon}" alt="${exam.name}" class="table-image" onerror="this.src='icons/default.png'"></td>
            <td style="font-weight: 700;">${exam.name}</td>
            <td><span class="exam-badge" style="background:#f1f5f9;">${exam.grade}</span></td>
            <td>الصف ${exam.gradeLevel}</td>
            <td>${exam.subject}</td>
            <td><span class="exam-badge" style="background:#e2e8f0; color:#475569;">${exam.examModel || '-'}</span></td>
            <td>${exam.examIsStandard ? '✅' : '❌'}</td>
            <td><span class="exam-badge" style="background:#e0e7ff; color:#4338ca;">${exam.term || 'غير محدد'}</span></td>
            <td><span class="exam-badge" style="background:#fce7f3; color:#be185d;">${exam.examType || 'غير محدد'}</span></td>
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

function renderExamsGrid(exams) {
    const gridContainer = document.getElementById('gridContainer');
    if (!gridContainer) return;
    
    gridContainer.innerHTML = exams.map(exam => {
        const fallbackIcon = exam.icon || 'icons/default.png';
        const imageHtml = exam.imageUrl 
            ? `<img src="${exam.imageUrl}" alt="${exam.name}" class="admin-card-image" onerror="this.style.display='none'">`
            : '';
            
        return `
            <div class="admin-exam-card" data-id="${exam.id}">
                <div class="admin-card-header">
                    <img src="${fallbackIcon}" alt="${exam.subject}" class="admin-card-icon" onerror="this.src='icons/default.png'">
                    <div class="admin-card-title-block">
                        <h4 class="admin-card-title" title="${exam.name}">${exam.name}</h4>
                        <div class="admin-card-subtitle">${exam.subject} - الصف ${exam.gradeLevel}</div>
                    </div>
                </div>
                <div class="admin-card-body">
                    <div class="admin-card-badges">
                        <span class="admin-card-badge grade">${exam.grade}</span>
                        <span class="admin-card-badge level">الصف ${exam.gradeLevel}</span>
                        <span class="admin-card-badge term">${exam.term || 'غير محدد'}</span>
                        <span class="admin-card-badge type">${exam.examType || 'غير محدد'}</span>
                        ${exam.examIsStandard ? `<span class="admin-card-badge standard">وفق المواصفات ✨</span>` : ''}
                        ${exam.examModel ? `<span class="admin-card-badge level" style="background:#f1f5f9; color:#475569;">نموذج: ${exam.examModel}</span>` : ''}
                    </div>
                    ${imageHtml}
                    <div class="admin-card-meta">
                        <span>الرابط:</span>
                        <a href="${exam.url}" target="_blank">رابط المنتج على سلة</a>
                    </div>
                </div>
                <div class="admin-card-footer">
                    <button class="btn-edit" onclick="editExam('${exam.id}')">
                        <lord-icon src="https://cdn.lordicon.com/pnavxiaz.json" trigger="hover" colors="primary:#ffffff" style="width:16px;height:16px;vertical-align:middle;"></lord-icon>
                        تعديل
                    </button>
                    <button class="btn-delete" onclick="handleDeleteExam('${exam.id}')">
                        <lord-icon src="https://cdn.lordicon.com/kfzoxerb.json" trigger="hover" colors="primary:#ffffff" style="width:16px;height:16px;vertical-align:middle;"></lord-icon>
                        حذف
                    </button>
                </div>
            </div>
        `;
    }).join('');
}

function applyExamsFiltering() {
    const filteredExams = allExams.filter(exam => {
        if (currentFilters.search) {
            const term = currentFilters.search.toLowerCase().trim();
            const nameMatch = exam.name && exam.name.toLowerCase().includes(term);
            const subjectMatch = exam.subject && exam.subject.toLowerCase().includes(term);
            if (!nameMatch && !subjectMatch) return false;
        }
        
        if (currentFilters.grade && exam.grade !== currentFilters.grade) {
            return false;
        }
        
        if (currentFilters.gradeLevel && exam.gradeLevel !== currentFilters.gradeLevel) {
            return false;
        }
        
        if (currentFilters.subject && exam.subject !== currentFilters.subject) {
            return false;
        }
        
        if (currentFilters.term && exam.term !== currentFilters.term) {
            return false;
        }
        
        if (currentFilters.examType && exam.examType !== currentFilters.examType) {
            return false;
        }
        
        if (currentFilters.isStandard) {
            const needsStandard = currentFilters.isStandard === 'yes';
            const isStandard = !!exam.examIsStandard;
            if (needsStandard !== isStandard) return false;
        }
        
        return true;
    });
    
    updateFilteredStats(filteredExams);
    updateActiveFiltersBadge();
    
    const gridContainer = document.getElementById('gridContainer');
    const tableContainer = document.getElementById('tableContainer');
    const noExamsEl = document.getElementById('adminNoExams');
    
    if (filteredExams.length === 0) {
        if (gridContainer) gridContainer.style.display = 'none';
        if (tableContainer) tableContainer.style.display = 'none';
        if (noExamsEl) noExamsEl.style.display = 'block';
    } else {
        if (noExamsEl) noExamsEl.style.display = 'none';
        
        if (activeViewMode === 'grid') {
            if (tableContainer) tableContainer.style.display = 'none';
            if (gridContainer) {
                gridContainer.style.display = 'grid';
                renderExamsGrid(filteredExams);
            }
        } else {
            if (gridContainer) gridContainer.style.display = 'none';
            if (tableContainer) {
                tableContainer.style.display = 'block';
                renderExamsTable(filteredExams);
            }
        }
    }
}

function updateFilteredStats(exams) {
    const totalCountEl = document.getElementById('filteredTotalCount');
    const primaryCountEl = document.getElementById('filteredPrimaryCount');
    const middleCountEl = document.getElementById('filteredMiddleCount');
    const secondaryCountEl = document.getElementById('filteredSecondaryCount');
    
    if (totalCountEl) totalCountEl.textContent = exams.length;
    
    let primaryCount = 0;
    let middleCount = 0;
    let secondaryCount = 0;
    
    exams.forEach(exam => {
        if (exam.grade === 'ابتدائي') primaryCount++;
        else if (exam.grade === 'متوسط') middleCount++;
        else if (exam.grade === 'ثانوي') secondaryCount++;
    });
    
    if (primaryCountEl) primaryCountEl.textContent = primaryCount;
    if (middleCountEl) middleCountEl.textContent = middleCount;
    if (secondaryCountEl) secondaryCountEl.textContent = secondaryCount;
}

function updateActiveFiltersBadge() {
    const badgeContainer = document.getElementById('activeFiltersInfo');
    const badgeCount = document.getElementById('activeFiltersCount');
    const spacerFilters = document.getElementById('spacerFilters');
    
    if (!badgeContainer || !badgeCount) return;
    
    let count = 0;
    if (currentFilters.search) count++;
    if (currentFilters.grade) count++;
    if (currentFilters.gradeLevel) count++;
    if (currentFilters.subject) count++;
    if (currentFilters.term) count++;
    if (currentFilters.examType) count++;
    if (currentFilters.isStandard) count++;
    
    if (count > 0) {
        badgeCount.textContent = count;
        badgeContainer.style.display = 'flex';
        if (spacerFilters) spacerFilters.style.display = 'none';
    } else {
        badgeContainer.style.display = 'none';
        if (spacerFilters) spacerFilters.style.display = 'block';
    }
}

function setupExamsControlPanel() {
    const searchInput = document.getElementById('adminSearchInput');
    const filterGrade = document.getElementById('filterGrade');
    const filterGradeLevel = document.getElementById('filterGradeLevel');
    const filterSubject = document.getElementById('filterSubject');
    const filterTerm = document.getElementById('filterTerm');
    const filterExamType = document.getElementById('filterExamType');
    const filterIsStandard = document.getElementById('filterIsStandard');
    
    const openAddBtn = document.getElementById('openAddExamModalBtn');
    const closeModalBtn = document.getElementById('closeModalBtn');
    const modalOverlay = document.getElementById('examModalOverlay');
    
    const viewGridBtn = document.getElementById('viewGridBtn');
    const viewTableBtn = document.getElementById('viewTableBtn');
    const btnResetFilters = document.getElementById('btnResetFilters');
    
    if (openAddBtn) {
        openAddBtn.addEventListener('click', () => {
            openModal(false);
        });
    }
    
    if (closeModalBtn) {
        closeModalBtn.addEventListener('click', () => {
            closeModal();
        });
    }
    
    if (modalOverlay) {
        modalOverlay.addEventListener('click', (e) => {
            if (e.target === modalOverlay) {
                closeModal();
            }
        });
    }
    
    if (viewGridBtn) {
        viewGridBtn.addEventListener('click', () => {
            activeViewMode = 'grid';
            viewGridBtn.classList.add('active');
            if (viewTableBtn) viewTableBtn.classList.remove('active');
            applyExamsFiltering();
        });
    }
    
    if (viewTableBtn) {
        viewTableBtn.addEventListener('click', () => {
            activeViewMode = 'table';
            viewTableBtn.classList.add('active');
            if (viewGridBtn) viewGridBtn.classList.remove('active');
            applyExamsFiltering();
        });
    }
    
    if (btnResetFilters) {
        btnResetFilters.addEventListener('click', () => {
            currentFilters = {
                search: '',
                grade: '',
                gradeLevel: '',
                subject: '',
                term: '',
                examType: '',
                isStandard: ''
            };
            
            if (searchInput) searchInput.value = '';
            if (filterGrade) filterGrade.value = '';
            if (filterGradeLevel) {
                filterGradeLevel.value = '';
                filterGradeLevel.disabled = true;
                filterGradeLevel.innerHTML = '<option value="">اختر المرحلة أولاً</option>';
            }
            if (filterSubject) filterSubject.value = '';
            if (filterTerm) filterTerm.value = '';
            if (filterExamType) filterExamType.value = '';
            if (filterIsStandard) filterIsStandard.value = '';
            
            updateFilterSubjectDropdown();
            applyExamsFiltering();
        });
    }
    
    if (searchInput) {
        searchInput.addEventListener('input', () => {
            currentFilters.search = searchInput.value;
            applyExamsFiltering();
        });
    }
    
    if (filterGrade) {
        filterGrade.addEventListener('change', () => {
            currentFilters.grade = filterGrade.value;
            currentFilters.gradeLevel = '';
            
            updateFilterGradeLevelDropdown();
            updateFilterSubjectDropdown();
            applyExamsFiltering();
        });
    }
    
    if (filterGradeLevel) {
        filterGradeLevel.addEventListener('change', () => {
            currentFilters.gradeLevel = filterGradeLevel.value;
            applyExamsFiltering();
        });
    }
    
    if (filterSubject) {
        filterSubject.addEventListener('change', () => {
            currentFilters.subject = filterSubject.value;
            applyExamsFiltering();
        });
    }
    
    if (filterTerm) {
        filterTerm.addEventListener('change', () => {
            currentFilters.term = filterTerm.value;
            applyExamsFiltering();
        });
    }
    
    if (filterExamType) {
        filterExamType.addEventListener('change', () => {
            currentFilters.examType = filterExamType.value;
            applyExamsFiltering();
        });
    }
    
    if (filterIsStandard) {
        filterIsStandard.addEventListener('change', () => {
            currentFilters.isStandard = filterIsStandard.value;
            applyExamsFiltering();
        });
    }
}

function updateFilterSubjectDropdown() {
    const filterSubjectSelect = document.getElementById('filterSubject');
    if (!filterSubjectSelect) return;
    
    filterSubjectSelect.innerHTML = '<option value="">الكل</option>';
    
    let subjectsList = [];
    const selectedGrade = currentFilters.grade;
    
    if (selectedGrade && allSubjects[selectedGrade]) {
        subjectsList = allSubjects[selectedGrade];
    } else {
        const allSet = new Set();
        Object.values(allSubjects).forEach(subs => {
            subs.forEach(s => allSet.add(s));
        });
        subjectsList = Array.from(allSet);
    }
    
    subjectsList.forEach(subject => {
        const option = document.createElement('option');
        option.value = subject;
        option.textContent = subject;
        if (currentFilters.subject === subject) {
            option.selected = true;
        }
        filterSubjectSelect.appendChild(option);
    });
}

function updateFilterExamTypeDropdown() {
    const filterTypeSelect = document.getElementById('filterExamType');
    if (!filterTypeSelect) return;
    
    filterTypeSelect.innerHTML = '<option value="">الكل</option>';
    allExamTypes.forEach(type => {
        const option = document.createElement('option');
        option.value = type;
        option.textContent = type;
        if (currentFilters.examType === type) {
            option.selected = true;
        }
        filterTypeSelect.appendChild(option);
    });
}

function updateFilterGradeLevelDropdown() {
    const filterGradeLevelSelect = document.getElementById('filterGradeLevel');
    if (!filterGradeLevelSelect) return;
    
    const selectedGrade = currentFilters.grade;
    filterGradeLevelSelect.innerHTML = '<option value="">الكل</option>';
    
    if (selectedGrade && GRADE_LEVELS[selectedGrade]) {
        filterGradeLevelSelect.disabled = false;
        GRADE_LEVELS[selectedGrade].forEach(level => {
            const option = document.createElement('option');
            option.value = level;
            option.textContent = `الصف ${level}`;
            if (currentFilters.gradeLevel === level) {
                option.selected = true;
            }
            filterGradeLevelSelect.appendChild(option);
        });
    } else {
        filterGradeLevelSelect.disabled = true;
        filterGradeLevelSelect.innerHTML = '<option value="">اختر المرحلة أولاً</option>';
    }
}

function openModal(isEdit = false, examName = '') {
    const modalOverlay = document.getElementById('examModalOverlay');
    const modalTitle = document.getElementById('modalTitle');
    const cancelEditBtn = document.getElementById('cancelEditBtn');
    
    if (!modalOverlay) return;
    
    if (isEdit) {
        if (modalTitle) modalTitle.textContent = `تعديل الاختبار: ${examName}`;
        if (cancelEditBtn) cancelEditBtn.style.display = 'inline-block';
    } else {
        if (modalTitle) modalTitle.textContent = 'إضافة اختبار جديد';
        if (cancelEditBtn) cancelEditBtn.style.display = 'none';
        
        // Reset form for fresh addition
        const form = document.getElementById('addExamForm');
        if (form) form.reset();
        selectedIcon = null;
        document.querySelectorAll('.icon-option').forEach(opt => opt.classList.remove('active'));
        const selectedIconInput = document.getElementById('selectedIcon');
        if (selectedIconInput) selectedIconInput.value = '';
        const editingExamIdInput = document.getElementById('editingExamId');
        if (editingExamIdInput) editingExamIdInput.value = '';
        const examImageUrlInput = document.getElementById('examImageUrl');
        if (examImageUrlInput) examImageUrlInput.value = '';
    }
    
    modalOverlay.classList.add('active');
}

function closeModal() {
    cancelEdit();
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

// ========================================
// Salla Import Logic
// ========================================
let scannedProductsList = [];

async function fetchCategoryPage(url) {
    // Attempt 1: AllOrigins proxy (returns JSON)
    try {
        const response = await fetch(`https://api.allorigins.win/get?url=${encodeURIComponent(url)}`);
        if (response.ok) {
            const data = await response.json();
            if (data.contents) {
                return { html: data.contents, success: true };
            }
        }
    } catch (e) {
        console.error("AllOrigins failed, trying fallback...", e);
    }

    // Attempt 2: CorsProxy.io (returns raw text directly)
    try {
        const response = await fetch(`https://corsproxy.io/?url=${encodeURIComponent(url)}`);
        if (response.ok) {
            const text = await response.text();
            return { html: text, success: true };
        }
    } catch (e) {
        console.error("CorsProxy.io failed...", e);
    }

    // Attempt 3: Codetabs (returns raw text)
    try {
        const response = await fetch(`https://api.codetabs.com/v1/proxy?quest=${encodeURIComponent(url)}`);
        if (response.ok) {
            const text = await response.text();
            return { html: text, success: true };
        }
    } catch (e) {
        console.error("Codetabs proxy failed...", e);
    }

    return { html: '', success: false };
}

function cleanProductName(name) {
    if (!name) return '';
    return name
        .replace(/[\r\n]+/g, ' ')
        .replace(/\s+/g, ' ')
        .trim();
}

function extractProductsFromHtml(html, baseUrl) {
    const parser = new DOMParser();
    const doc = parser.parseFromString(html, 'text/html');
    const products = [];
    const seenUrls = new Set();

    // 1. Try to find custom tags like <salla-product-card> or elements with class .s-product-card
    const cards = doc.querySelectorAll('salla-product-card, .s-product-card, .product-card, .product-entry, .product-item');
    if (cards.length > 0) {
        cards.forEach(card => {
            const a = card.querySelector('a[href*="/p"]');
            if (!a) return;
            let url = a.getAttribute('href');
            if (url.startsWith('/')) {
                url = new URL(url, baseUrl).toString();
            }
            if (seenUrls.has(url)) return;

            // Get image
            const img = card.querySelector('img');
            let imageUrl = img ? (img.getAttribute('src') || img.getAttribute('data-src') || img.getAttribute('data-lazy-src') || '') : '';
            if (imageUrl && imageUrl.startsWith('/')) {
                imageUrl = new URL(imageUrl, baseUrl).toString();
            }

            // Get name
            const titleEl = card.querySelector('.product-title, .title, h3, h4, .s-product-card-title');
            let name = titleEl ? titleEl.textContent.trim() : '';
            if (!name) {
                name = img ? (img.getAttribute('alt') || '').trim() : '';
                if (!name) name = a.textContent.trim();
            }
            name = cleanProductName(name);

            if (name && url) {
                products.push({ name, imageUrl, url });
                seenUrls.add(url);
            }
        });
    }

    // 2. If no products were found, find all a tags that look like product links
    if (products.length === 0) {
        const productLinks = doc.querySelectorAll('a[href*="/p"]');
        productLinks.forEach(a => {
            let url = a.getAttribute('href');
            if (!url) return;
            if (url.startsWith('/')) {
                url = new URL(url, baseUrl).toString();
            }
            const sallaProductRegex = /\/p[-_\d]*\d+$/i;
            if (!sallaProductRegex.test(url) && !url.includes('/p/')) return;
            if (seenUrls.has(url)) return;

            let container = a.closest('div, li, article');
            if (!container) container = a;

            const img = container.querySelector('img');
            let imageUrl = img ? (img.getAttribute('src') || img.getAttribute('data-src') || img.getAttribute('data-lazy-src') || '') : '';
            if (imageUrl && imageUrl.startsWith('/')) {
                imageUrl = new URL(imageUrl, baseUrl).toString();
            }

            let name = a.textContent.trim();
            if (!name && img) {
                name = (img.getAttribute('alt') || '').trim();
            }
            if (!name) {
                const titleEl = container.querySelector('h3, h4, p, span');
                name = titleEl ? titleEl.textContent.trim() : '';
            }
            name = cleanProductName(name);

            if (name && url) {
                products.push({ name, imageUrl, url });
                seenUrls.add(url);
            }
        });
    }

    // 3. Fallback: JSON-LD schemas
    if (products.length === 0) {
        const jsonLdScripts = doc.querySelectorAll('script[type="application/ld+json"]');
        jsonLdScripts.forEach(script => {
            try {
                const data = JSON.parse(script.textContent);
                if (data['@type'] === 'ItemList' && Array.isArray(data.itemListElement)) {
                    data.itemListElement.forEach(item => {
                        let url = item.url || (item.item && item.item.url);
                        if (url && url.startsWith('/')) {
                            url = new URL(url, baseUrl).toString();
                        }
                        if (url && !seenUrls.has(url)) {
                            let name = item.name || (item.item && item.item.name) || '';
                            let imageUrl = item.image || (item.item && item.item.image) || '';
                            if (imageUrl && imageUrl.startsWith('/')) {
                                imageUrl = new URL(imageUrl, baseUrl).toString();
                            }
                            name = cleanProductName(name);
                            if (name) {
                                products.push({ name, imageUrl, url });
                                seenUrls.add(url);
                            }
                        }
                    });
                } else if (data['@type'] === 'Product') {
                    let url = data.url;
                    if (url && url.startsWith('/')) {
                        url = new URL(url, baseUrl).toString();
                    }
                    if (url && !seenUrls.has(url)) {
                        let name = data.name || '';
                        let imageUrl = data.image || '';
                        if (Array.isArray(imageUrl)) imageUrl = imageUrl[0] || '';
                        if (imageUrl && imageUrl.startsWith('/')) {
                            imageUrl = new URL(imageUrl, baseUrl).toString();
                        }
                        name = cleanProductName(name);
                        if (name) {
                            products.push({ name, imageUrl, url });
                            seenUrls.add(url);
                        }
                    }
                }
            } catch (e) {
                console.error('Error parsing JSON-LD:', e);
            }
        });
    }

    return products;
}

function guessExamDetails(name) {
    const details = {
        grade: '',
        gradeLevel: '',
        subject: '',
        term: '',
        examType: '',
        icon: 'icons/default.png',
        isStandard: false
    };

    const lowercaseName = name.toLowerCase();

    // 1. Guess Stage
    if (lowercaseName.includes('ابتدائي') || lowercaseName.includes('الابتدائي')) {
        details.grade = 'ابتدائي';
    } else if (lowercaseName.includes('متوسط') || lowercaseName.includes('المتوسط')) {
        details.grade = 'متوسط';
    } else if (lowercaseName.includes('ثانوي') || lowercaseName.includes('الثانوي') || lowercaseName.includes('مسارات')) {
        details.grade = 'ثانوي';
    }

    // 2. Guess Grade Level
    if (lowercaseName.includes('أول') || lowercaseName.includes('الاول') || lowercaseName.includes('صف أول') || lowercaseName.includes('الصف الأول') || lowercaseName.includes(' 1 ') || lowercaseName.includes('1-') || lowercaseName.includes(' 1-') || lowercaseName.includes('-1')) {
        details.gradeLevel = 'الأول';
    } else if (lowercaseName.includes('ثاني') || lowercaseName.includes('الثاني') || lowercaseName.includes('صف ثاني') || lowercaseName.includes('الصف الثاني') || lowercaseName.includes(' 2 ') || lowercaseName.includes('2-') || lowercaseName.includes(' 2-') || lowercaseName.includes('-2')) {
        details.gradeLevel = 'الثاني';
    } else if (lowercaseName.includes('ثالث') || lowercaseName.includes('الثالث') || lowercaseName.includes('صف ثالث') || lowercaseName.includes('الصف الثالث') || lowercaseName.includes(' 3 ') || lowercaseName.includes('3-') || lowercaseName.includes(' 3-') || lowercaseName.includes('-3')) {
        details.gradeLevel = 'الثالث';
    } else if (lowercaseName.includes('رابع') || lowercaseName.includes('الرابع') || lowercaseName.includes('صف رابع') || lowercaseName.includes('الصف الرابع') || lowercaseName.includes(' 4 ') || lowercaseName.includes('4-') || lowercaseName.includes(' 4-') || lowercaseName.includes('-4')) {
        details.gradeLevel = 'الرابع';
    } else if (lowercaseName.includes('خامس') || lowercaseName.includes('الخامس') || lowercaseName.includes('صف خامس') || lowercaseName.includes('الصف الخامس') || lowercaseName.includes(' 5 ') || lowercaseName.includes('5-') || lowercaseName.includes(' 5-') || lowercaseName.includes('-5')) {
        details.gradeLevel = 'الخامس';
    } else if (lowercaseName.includes('سادس') || lowercaseName.includes('السادس') || lowercaseName.includes('صف سادس') || lowercaseName.includes('الصف السادس') || lowercaseName.includes(' 6 ') || lowercaseName.includes('6-') || lowercaseName.includes(' 6-') || lowercaseName.includes('-6')) {
        details.gradeLevel = 'السادس';
    }

    // 3. Guess Subject
    let foundSubject = '';
    const allKnownSubjects = new Set();
    Object.values(allSubjects).forEach(list => list.forEach(s => allKnownSubjects.add(s)));

    for (const sub of allKnownSubjects) {
        if (lowercaseName.includes(sub.toLowerCase())) {
            foundSubject = sub;
            break;
        }
    }
    
    if (!foundSubject) {
        if (lowercaseName.includes('رياضيات') || lowercaseName.includes('رياضه')) {
            foundSubject = 'رياضيات';
        } else if (lowercaseName.includes('علوم') || lowercaseName.includes('علم')) {
            foundSubject = 'علوم';
        } else if (lowercaseName.includes('لغتي') || lowercaseName.includes('اللغة العربية') || lowercaseName.includes('العربية') || lowercaseName.includes('عربي')) {
            foundSubject = 'لغتي';
        } else if (lowercaseName.includes('انجليزي') || lowercaseName.includes('إنجليزي') || lowercaseName.includes('اللغة الإنجليزية') || lowercaseName.includes('english')) {
            foundSubject = 'لغة إنجليزية';
        } else if (lowercaseName.includes('اجتماعيات') || lowercaseName.includes('الدراسات الاجتماعية') || lowercaseName.includes('تاريخ') || lowercaseName.includes('جغرافيا')) {
            foundSubject = 'دراسات اجتماعية';
        } else if (lowercaseName.includes('اسلامية') || lowercaseName.includes('إسلامية') || lowercaseName.includes('توحيد') || lowercaseName.includes('فقه') || lowercaseName.includes('حديث') || lowercaseName.includes('تفسير') || lowercaseName.includes('سيرة') || lowercaseName.includes('الدراسات الإسلامية')) {
            foundSubject = 'دراسات إسلامية';
        } else if (lowercaseName.includes('فيزياء') || lowercaseName.includes('فيزيا')) {
            foundSubject = 'فيزياء';
        } else if (lowercaseName.includes('كيمياء') || lowercaseName.includes('كيميا')) {
            foundSubject = 'كيمياء';
        } else if (lowercaseName.includes('أحياء') || lowercaseName.includes('احياء')) {
            foundSubject = 'أحياء';
        }
    }

    if (foundSubject) {
        if (details.grade) {
            const gradeSubs = allSubjects[details.grade] || [];
            const exactMatch = gradeSubs.find(s => s.toLowerCase() === foundSubject.toLowerCase());
            if (exactMatch) {
                details.subject = exactMatch;
            } else {
                const fuzzyMatch = gradeSubs.find(s => lowercaseName.includes(s.toLowerCase()));
                if (fuzzyMatch) {
                    details.subject = fuzzyMatch;
                } else {
                    details.subject = foundSubject;
                }
            }
        } else {
            details.subject = foundSubject;
        }
    }

    // 4. Guess Term
    if (lowercaseName.includes('ف1') || lowercaseName.includes('فصل أول') || lowercaseName.includes('الفصل الأول') || lowercaseName.includes('الفصل الدراسي الأول') || lowercaseName.includes('الترم الأول')) {
        details.term = 'الفصل الأول';
    } else if (lowercaseName.includes('ف2') || lowercaseName.includes('فصل ثاني') || lowercaseName.includes('الفصل الثاني') || lowercaseName.includes('الفصل الدراسي الثاني') || lowercaseName.includes('الترم الثاني')) {
        details.term = 'الفصل الثاني';
    }

    // 5. Guess Exam Type
    if (lowercaseName.includes('نهائي') || lowercaseName.includes('النهائي')) {
        details.examType = 'اختبار نهائي';
    } else if (lowercaseName.includes('منتصف') || lowercaseName.includes('فترة') || lowercaseName.includes('الفترة') || lowercaseName.includes('شهري')) {
        details.examType = 'اختبار منتصف الفصل';
    } else if (lowercaseName.includes('دوري') || lowercaseName.includes('فتري')) {
        details.examType = 'اختبار دوري';
    } else if (lowercaseName.includes('ورقة عمل') || lowercaseName.includes('اوراق عمل') || lowercaseName.includes('أوراق عمل') || lowercaseName.includes('نشاط')) {
        details.examType = 'ورقة عمل';
    }

    // 6. Guess if Standard
    if (lowercaseName.includes('مواصفات') || lowercaseName.includes('جدول مواصفات') || lowercaseName.includes('جدول المواصفات')) {
        details.isStandard = true;
    }

    // 7. Choose Icon
    if (details.subject) {
        const subLower = details.subject.toLowerCase();
        if (subLower.includes('رياضيات')) details.icon = 'icons/math.png';
        else if (subLower.includes('عرب') || subLower.includes('لغتي')) details.icon = 'icons/arabic.png';
        else if (subLower.includes('علوم')) details.icon = 'icons/science.png';
        else if (subLower.includes('انجليزي') || subLower.includes('english')) details.icon = 'icons/english.png';
        else if (subLower.includes('اجتماع') || subLower.includes('تاريخ') || subLower.includes('جغراف')) details.icon = 'icons/social_studies.png';
        else if (subLower.includes('إسلام') || subLower.includes('اسلام') || subLower.includes('توحيد') || subLower.includes('فقه') || subLower.includes('حديث') || subLower.includes('تفسير')) details.icon = 'icons/islamic_studies.png';
        else if (subLower.includes('فيزيا')) details.icon = 'icons/Physics.png';
        else if (subLower.includes('كيميا')) details.icon = 'icons/chemistry.png';
        else if (subLower.includes('أحياء') || subLower.includes('احياء')) details.icon = 'icons/احياء.png';
    }

    return details;
}

function normalizeUrl(url) {
    if (!url) return '';
    try {
        let clean = url.trim().toLowerCase();
        clean = clean.replace(/^(https?:\/\/)?(www\.)?/, '');
        if (clean.endsWith('/')) {
            clean = clean.substring(0, clean.length - 1);
        }
        const qIdx = clean.indexOf('?');
        if (qIdx !== -1) {
            clean = clean.substring(0, qIdx);
        }
        return clean;
    } catch(e) {
        return url;
    }
}

function updateRowGradeDropdowns(row, grade, activeLevel = '', activeSubject = '') {
    const levelSelect = row.querySelector('.row-grade-level-select');
    const subjectSelect = row.querySelector('.row-subject-select');

    if (grade && GRADE_LEVELS[grade]) {
        levelSelect.disabled = false;
        levelSelect.innerHTML = '<option value="">الصف</option>' + GRADE_LEVELS[grade].map(level => 
            `<option value="${level}" ${activeLevel === level ? 'selected' : ''}>الصف ${level}</option>`
        ).join('');

        subjectSelect.innerHTML = '<option value="">المادة</option>' + (allSubjects[grade] || []).map(sub => 
            `<option value="${sub}" ${activeSubject === sub ? 'selected' : ''}>${sub}</option>`
        ).join('');
    } else {
        levelSelect.disabled = true;
        levelSelect.innerHTML = '<option value="">الصف</option>';
        subjectSelect.innerHTML = '<option value="">المادة</option>';
    }
}

function renderScannedProductsTable(products) {
    const tableBody = document.getElementById('scannedProductsTableBody');
    if (!tableBody) return;

    tableBody.innerHTML = products.map((prod, index) => {
        const guessed = guessExamDetails(prod.name);

        const isDuplicate = allExams.some(exam => {
            if (!exam.url || !prod.url) return false;
            return normalizeUrl(exam.url) === normalizeUrl(prod.url);
        });

        const isChecked = isDuplicate ? '' : 'checked';
        const duplicateBadge = isDuplicate 
            ? `<div class="import-row-badge duplicate">⚠️ مضاف مسبقاً</div>` 
            : `<div class="import-row-badge new-item">✨ منتج جديد</div>`;

        return `
            <tr class="import-product-row" data-index="${index}">
                <td style="text-align: center; vertical-align: middle;">
                    <input type="checkbox" class="import-row-checkbox" data-index="${index}" ${isChecked} style="width:18px; height:18px; cursor:pointer;">
                </td>
                <td style="text-align: center; vertical-align: middle;">
                    <img src="${prod.imageUrl || 'icons/default.png'}" alt="Preview" class="table-image" onerror="this.src='icons/default.png'">
                    <input type="hidden" class="import-row-image-url" value="${prod.imageUrl || ''}">
                </td>
                <td>
                    <input type="text" class="import-name-input" value="${prod.name}" style="font-weight: 700;">
                    ${duplicateBadge}
                </td>
                <td>
                    <div class="row-metadata-container">
                        <div class="row-selectors-grid">
                            <select class="row-grade-select" data-index="${index}">
                                <option value="">المرحلة</option>
                                <option value="ابتدائي" ${guessed.grade === 'ابتدائي' ? 'selected' : ''}>ابتدائي</option>
                                <option value="متوسط" ${guessed.grade === 'متوسط' ? 'selected' : ''}>متوسط</option>
                                <option value="ثانوي" ${guessed.grade === 'ثانوي' ? 'selected' : ''}>ثانوي</option>
                            </select>
                            <select class="row-grade-level-select" data-index="${index}" disabled>
                                <option value="">الصف</option>
                            </select>
                            <select class="row-subject-select" data-index="${index}">
                                <option value="">المادة</option>
                            </select>
                        </div>
                        <div class="row-selectors-extra">
                            <select class="row-term-select" style="flex: 1;">
                                <option value="">الفصل</option>
                                <option value="الفصل الأول" ${guessed.term === 'الفصل الأول' ? 'selected' : ''}>الفصل الأول</option>
                                <option value="الفصل الثاني" ${guessed.term === 'الفصل الثاني' ? 'selected' : ''}>الفصل الثاني</option>
                            </select>
                            <select class="row-type-select" style="flex: 1.2;">
                                <option value="">النوع</option>
                                ${allExamTypes.map(type => 
                                    `<option value="${type}" ${guessed.examType === type ? 'selected' : ''}>${type}</option>`
                                ).join('')}
                            </select>
                            <input type="text" class="row-model-input" placeholder="النموذج" style="flex: 0.8; width: 60px;" value="">
                            <label class="row-checkbox-label">
                                <input type="checkbox" class="row-standard-chk" ${guessed.isStandard ? 'checked' : ''} style="width: 14px; height: 14px; margin: 0;">
                                مواصفات
                            </label>
                        </div>
                    </div>
                </td>
                <td style="vertical-align: middle;">
                    <select class="import-row-icon-select row-icon-select-el">
                        <option value="">اختر أيقونة</option>
                        ${AVAILABLE_ICONS.map(icon => 
                            `<option value="icons/${icon.name}" ${guessed.icon === 'icons/' + icon.name ? 'selected' : ''}>${icon.label}</option>`
                        ).join('')}
                    </select>
                </td>
                <td style="text-align: center; vertical-align: middle;">
                    <a href="${prod.url}" target="_blank" class="import-row-link">
                        معاينة
                    </a>
                </td>
            </tr>
        `;
    }).join('');

    const rows = tableBody.querySelectorAll('.import-product-row');
    rows.forEach((row, idx) => {
        const gradeSelect = row.querySelector('.row-grade-select');
        const guessed = guessExamDetails(products[idx].name);

        gradeSelect.addEventListener('change', () => {
            const selectedGrade = gradeSelect.value;
            updateRowGradeDropdowns(row, selectedGrade);
        });

        if (guessed.grade) {
            updateRowGradeDropdowns(row, guessed.grade, guessed.gradeLevel, guessed.subject);
        }
    });
}

function setupSallaImporter() {
    console.log('Setting up Salla Importer...');

    const startScanBtn = document.getElementById('startImportScanBtn');
    const sallaUrlInput = document.getElementById('sallaCategoryUrl');
    const importLoader = document.getElementById('importLoader');
    const bulkSettingsSection = document.getElementById('bulkSettingsSection');
    const scannedResultsWrapper = document.getElementById('scannedResultsWrapper');
    const emptyState = document.getElementById('importEmptyState');
    
    const bulkGrade = document.getElementById('bulkGrade');
    const bulkGradeLevel = document.getElementById('bulkGradeLevel');
    const bulkSubject = document.getElementById('bulkSubject');
    const bulkTerm = document.getElementById('bulkTerm');
    const bulkType = document.getElementById('bulkType');
    const bulkIcon = document.getElementById('bulkIcon');
    const bulkIsStandard = document.getElementById('bulkIsStandard');
    const applyBulkBtn = document.getElementById('applyBulkSettingsBtn');
    
    const selectAllBtn = document.getElementById('selectAllImportBtn');
    const deselectAllBtn = document.getElementById('deselectAllImportBtn');
    const masterCheckbox = document.getElementById('masterImportCheckbox');
    
    const confirmSaveBtn = document.getElementById('confirmImportSaveBtn');
    const saveLoader = document.getElementById('importSaveLoader');
    const statusMessage = document.getElementById('importStatusMessage');

    if (bulkIcon) {
        bulkIcon.innerHTML = '<option value="">اختر أيقونة</option>' + AVAILABLE_ICONS.map(icon => 
            `<option value="icons/${icon.name}">${icon.label}</option>`
        ).join('');
    }

    if (bulkType) {
        bulkType.innerHTML = '<option value="">اختر النوع</option>' + allExamTypes.map(type => 
            `<option value="${type}">${type}</option>`
        ).join('');
    }

    if (bulkGrade) {
        bulkGrade.addEventListener('change', () => {
            const selectedGrade = bulkGrade.value;
            if (selectedGrade && GRADE_LEVELS[selectedGrade]) {
                bulkGradeLevel.disabled = false;
                bulkGradeLevel.innerHTML = '<option value="">الكل</option>' + GRADE_LEVELS[selectedGrade].map(level => 
                    `<option value="${level}">الصف ${level}</option>`
                ).join('');

                bulkSubject.innerHTML = '<option value="">اختر المادة</option>' + (allSubjects[selectedGrade] || []).map(sub => 
                    `<option value="${sub}">${sub}</option>`
                ).join('');
            } else {
                bulkGradeLevel.disabled = true;
                bulkGradeLevel.innerHTML = '<option value="">اختر المرحلة أولاً</option>';
                bulkSubject.innerHTML = '<option value="">اختر المادة</option>';
            }
        });
    }

    if (startScanBtn) {
        startScanBtn.addEventListener('click', async () => {
            const url = sallaUrlInput.value.trim();
            if (!url) {
                alert('يرجى إدخال رابط تصنيف سلة أولاً');
                return;
            }

            bulkSettingsSection.style.display = 'none';
            scannedResultsWrapper.style.display = 'none';
            emptyState.style.display = 'none';
            statusMessage.style.display = 'none';
            
            startScanBtn.disabled = true;
            importLoader.style.display = 'block';

            try {
                let baseUrl = '';
                try {
                    const urlObj = new URL(url);
                    baseUrl = urlObj.origin;
                } catch(e) {
                    baseUrl = '';
                }

                const fetchResult = await fetchCategoryPage(url);
                if (!fetchResult.success || !fetchResult.html) {
                    throw new Error('فشل جلب محتوى الرابط عبر البروكسي');
                }

                const products = extractProductsFromHtml(fetchResult.html, baseUrl);
                scannedProductsList = products;

                importLoader.style.display = 'none';
                startScanBtn.disabled = false;

                if (products.length === 0) {
                    emptyState.style.display = 'block';
                    return;
                }

                document.getElementById('scannedCountLabel').textContent = `المنتجات المستخرجة (${products.length})`;
                renderScannedProductsTable(products);
                
                bulkSettingsSection.style.display = 'block';
                scannedResultsWrapper.style.display = 'block';

            } catch (error) {
                console.error(error);
                importLoader.style.display = 'none';
                startScanBtn.disabled = false;
                alert('حدث خطأ أثناء فحص الرابط. يرجى التأكد من صحة الرابط أو المحاولة لاحقاً.');
            }
        });
    }

    if (applyBulkBtn) {
        applyBulkBtn.addEventListener('click', () => {
            const selectedGrade = bulkGrade.value;
            const selectedGradeLevel = bulkGradeLevel.value;
            const selectedSubject = bulkSubject.value;
            const selectedTerm = bulkTerm.value;
            const selectedType = bulkType.value;
            const selectedIconVal = bulkIcon.value;
            const selectedIsStandard = bulkIsStandard.checked;

            const checkboxes = document.querySelectorAll('.import-row-checkbox:checked');
            if (checkboxes.length === 0) {
                alert('يرجى تحديد صف واحد على الأقل في الجدول لتطبيق التعديل الجماعي.');
                return;
            }

            checkboxes.forEach(chk => {
                const index = chk.dataset.index;
                const row = document.querySelector(`.import-product-row[data-index="${index}"]`);
                if (!row) return;

                if (selectedGrade) {
                    const gradeSelect = row.querySelector('.row-grade-select');
                    gradeSelect.value = selectedGrade;
                    updateRowGradeDropdowns(row, selectedGrade, selectedGradeLevel, selectedSubject);
                }
                if (selectedTerm) {
                    row.querySelector('.row-term-select').value = selectedTerm;
                }
                if (selectedType) {
                    row.querySelector('.row-type-select').value = selectedType;
                }
                if (selectedIconVal) {
                    row.querySelector('.row-icon-select-el').value = selectedIconVal;
                }
                row.querySelector('.row-standard-chk').checked = selectedIsStandard;
            });
            
            alert('تم تطبيق التصنيف الجماعي على المنتجات المحددة بنجاح! ✅');
        });
    }

    if (masterCheckbox) {
        masterCheckbox.addEventListener('change', () => {
            const checked = masterCheckbox.checked;
            document.querySelectorAll('.import-row-checkbox').forEach(chk => {
                chk.checked = checked;
            });
        });
    }

    if (selectAllBtn) {
        selectAllBtn.addEventListener('click', () => {
            document.querySelectorAll('.import-row-checkbox').forEach(chk => chk.checked = true);
            if (masterCheckbox) masterCheckbox.checked = true;
        });
    }

    if (deselectAllBtn) {
        deselectAllBtn.addEventListener('click', () => {
            document.querySelectorAll('.import-row-checkbox').forEach(chk => chk.checked = false);
            if (masterCheckbox) masterCheckbox.checked = false;
        });
    }

    if (confirmSaveBtn) {
        confirmSaveBtn.addEventListener('click', async () => {
            const checkedBoxes = document.querySelectorAll('.import-row-checkbox:checked');
            if (checkedBoxes.length === 0) {
                alert('يرجى تحديد منتج واحد على الأقل لحفظه');
                return;
            }

            let validated = true;
            const examsToSave = [];

            checkedBoxes.forEach(chk => {
                const index = chk.dataset.index;
                const row = document.querySelector(`.import-product-row[data-index="${index}"]`);
                if (!row) return;

                const name = row.querySelector('.import-name-input').value.trim();
                const url = row.querySelector('.import-row-link').href;
                const imageUrl = row.querySelector('.import-row-image-url').value;
                const grade = row.querySelector('.row-grade-select').value;
                const gradeLevel = row.querySelector('.row-grade-level-select').value;
                const subject = row.querySelector('.row-subject-select').value;
                const term = row.querySelector('.row-term-select').value;
                const examType = row.querySelector('.row-type-select').value;
                const icon = row.querySelector('.row-icon-select-el').value;
                const examModel = row.querySelector('.row-model-input').value.trim();
                const examIsStandard = row.querySelector('.row-standard-chk').checked;

                if (!name) {
                    alert(`يرجى كتابة الاسم للمنتج في السطر رقم ${parseInt(index)+1}`);
                    validated = false;
                    return;
                }
                if (!grade || !gradeLevel || !subject || !term || !examType || !icon) {
                    alert(`يرجى إكمال البيانات الأساسية للمنتج: "${name}" (المرحلة، الصف، المادة، الفصل، النوع، الأيقونة)`);
                    validated = false;
                    return;
                }

                examsToSave.push({
                    name,
                    url,
                    imageUrl,
                    grade,
                    gradeLevel,
                    subject,
                    term,
                    examType,
                    icon,
                    examModel,
                    examIsStandard
                });
            });

            if (!validated) return;

            confirmSaveBtn.disabled = true;
            if (saveLoader) saveLoader.style.display = 'inline-flex';
            statusMessage.style.display = 'none';

            let savedCount = 0;
            try {
                for (const examData of examsToSave) {
                    await addExam(examData);
                    savedCount++;
                }

                statusMessage.textContent = `تم حفظ عدد (${savedCount}) اختبارات بنجاح في قاعدة البيانات! ✅`;
                statusMessage.style.display = 'block';
                
                setTimeout(async () => {
                    bulkSettingsSection.style.display = 'none';
                    scannedResultsWrapper.style.display = 'none';
                    sallaUrlInput.value = '';
                    statusMessage.style.display = 'none';
                    
                    await loadExams();
                }, 3000);

            } catch (err) {
                console.error(err);
                alert('حدث خطأ أثناء حفظ الاختبارات في قاعدة البيانات: ' + err.message);
            } finally {
                confirmSaveBtn.disabled = false;
                if (saveLoader) saveLoader.style.display = 'none';
            }
        });
    }
}

