// ========================================
// Reports Page JavaScript
// ========================================

import { getExams, getSubjects } from './firebase-data.js';

let allExams = [];
let allSubjects = {};

// Grade levels for each stage
const GRADE_LEVELS = {
    'ابتدائي': ['الأول', 'الثاني', 'الثالث', 'الرابع', 'الخامس', 'السادس'],
    'متوسط': ['الأول', 'الثاني', 'الثالث'],
    'ثانوي': ['الأول', 'الثاني', 'الثالث']
};

// Initialize page
document.addEventListener('DOMContentLoaded', async () => {
    await loadData();
    generateReport();

    // Refresh button
    document.getElementById('refreshBtn').addEventListener('click', async () => {
        await loadData();
        generateReport();
    });
});

// Load data from Firebase
async function loadData() {
    showLoading();
    try {
        allExams = await getExams();
        allSubjects = await getSubjects();
        console.log('Loaded exams:', allExams.length);
        console.log('Loaded subjects:', allSubjects);
    } catch (error) {
        console.error('Error loading data:', error);
    }
}

// Show loading state
function showLoading() {
    document.getElementById('coverageContainer').innerHTML = `
        <div class="loading-container">
            <div class="loading-spinner"></div>
            <div class="loading-text">جاري تحميل البيانات...</div>
        </div>
    `;
}

// Show error state
function showError() {
    document.getElementById('coverageContainer').innerHTML = `
        <div class="empty-state" style="background: #fff5f5; border: 2px solid #f56565;">
            <p style="color: #c53030;">❌ خطأ في تحميل البيانات</p>
            <p style="font-size: 0.9rem; color: #718096; margin-top: 10px;">
                تأكد من تسجيل الدخول أو حاول تحديث الصفحة
            </p>
        </div>
    `;
    document.getElementById('totalExams').textContent = '0';
    document.getElementById('coveredGrades').textContent = '0/3';
    document.getElementById('totalSubjects').textContent = '0';
    document.getElementById('totalWarnings').textContent = '0';
}

// Generate full report
function generateReport() {
    const stats = calculateStatistics();
    const coverage = calculateCoverage();
    const warnings = generateWarnings(coverage);

    displayStats(stats);
    displayCoverage(coverage);
    displayWarnings(warnings);
}

// Calculate statistics
function calculateStatistics() {
    const grades = Object.keys(GRADE_LEVELS);
    const coveredGrades = grades.filter(grade => {
        return allExams.some(exam => exam.grade === grade);
    });

    const uniqueSubjects = [...new Set(allExams.map(exam => exam.subject))];

    return {
        totalExams: allExams.length,
        coveredGrades: coveredGrades.length,
        totalGrades: grades.length,
        totalSubjects: uniqueSubjects.length
    };
}

// Calculate coverage for all grades/subjects
function calculateCoverage() {
    const coverage = {};

    for (const [grade, levels] of Object.entries(GRADE_LEVELS)) {
        coverage[grade] = {};
        const gradeSubjects = allSubjects[grade] || [];

        for (const subject of gradeSubjects) {
            const subjectCoverage = {
                total: levels.length,
                covered: 0,
                missing: [],
                exams: []
            };

            for (const level of levels) {
                const exam = allExams.find(e =>
                    e.grade === grade &&
                    e.gradeLevel === level &&
                    e.subject === subject
                );

                if (exam) {
                    subjectCoverage.covered++;
                    subjectCoverage.exams.push({ level, exam });
                } else {
                    subjectCoverage.missing.push(level);
                }
            }

            subjectCoverage.percentage = (subjectCoverage.covered / subjectCoverage.total) * 100;
            coverage[grade][subject] = subjectCoverage;
        }
    }

    return coverage;
}

// Generate warnings
function generateWarnings(coverage) {
    const warnings = [];

    for (const [grade, subjects] of Object.entries(coverage)) {
        for (const [subject, data] of Object.entries(subjects)) {
            if (data.covered === 0) {
                // Critical: No exams for this subject
                warnings.push({
                    type: 'critical',
                    grade,
                    subject,
                    message: `لا يوجد أي اختبار ${subject} لمرحلة ${grade}`,
                    icon: '🔴'
                });
            } else if (data.missing.length > 0) {
                // Moderate: Partial coverage
                const missingLevels = data.missing.map(l => `الصف ${l}`).join('، ');
                warnings.push({
                    type: 'moderate',
                    grade,
                    subject,
                    message: `اختبار ${subject} غير متوفر لـ ${missingLevels} - ${grade}`,
                    details: `متوفر لـ ${data.covered} من ${data.total} صفوف`,
                    icon: '⚠️'
                });
            }
        }
    }

    // Info: Subjects with complete coverage
    let completeCount = 0;
    for (const subjects of Object.values(coverage)) {
        for (const data of Object.values(subjects)) {
            if (data.covered === data.total) {
                completeCount++;
            }
        }
    }

    if (completeCount > 0) {
        warnings.push({
            type: 'info',
            message: `رائع! ${completeCount} مادة بتغطية كاملة لجميع الصفوف`,
            icon: '✨'
        });
    }

    return warnings;
}

// Display statistics
function displayStats(stats) {
    document.getElementById('totalExams').textContent = stats.totalExams;
    document.getElementById('coveredGrades').textContent = `${stats.coveredGrades}/${stats.totalGrades}`;
    document.getElementById('totalSubjects').textContent = stats.totalSubjects;

    // Calculate warnings count
    const coverage = calculateCoverage();
    const warnings = generateWarnings(coverage);
    const criticalWarnings = warnings.filter(w => w.type !== 'info').length;
    document.getElementById('totalWarnings').textContent = criticalWarnings;
}

// Display coverage matrix
function displayCoverage(coverage) {
    const container = document.getElementById('coverageContainer');
    let html = '';

    for (const [grade, subjects] of Object.entries(coverage)) {
        const totalSubjects = Object.keys(subjects).length;
        const completeSubjects = Object.values(subjects).filter(s => s.covered === s.total).length;

        html += `
            <div class="coverage-grade">
                <div class="coverage-grade-header">
                    <div class="coverage-grade-title">
                        🎓 ${grade}
                    </div>
                    <div class="coverage-grade-stats">
                        ${completeSubjects}/${totalSubjects} مواد مكتملة
                    </div>
                </div>
                <div class="coverage-subjects">
        `;

        for (const [subject, data] of Object.entries(subjects)) {
            let status = 'missing';
            let icon = '🔴';

            if (data.percentage === 100) {
                status = 'complete';
                icon = '✅';
            } else if (data.percentage > 0) {
                status = 'partial';
                icon = '⚠️';
            }

            html += `
                <div class="coverage-subject status-${status}">
                    <div class="coverage-icon">${icon}</div>
                    <div class="coverage-subject-name">${subject}</div>
                    <div class="coverage-progress">
                        <div class="coverage-bar">
                            <div class="coverage-bar-fill" style="width: ${data.percentage}%"></div>
                        </div>
                        <div class="coverage-percentage">${Math.round(data.percentage)}%</div>
                    </div>
                    <div class="coverage-details">${data.covered}/${data.total} صفوف</div>
                </div>
            `;
        }

        html += `
                </div>
            </div>
        `;
    }

    container.innerHTML = html || '<div class="empty-state"><p>لا توجد بيانات</p></div>';
}

// Display warnings
function displayWarnings(warnings) {
    const container = document.getElementById('warningsContainer');

    if (warnings.length === 0) {
        container.innerHTML = `
            <div class="empty-state">
                <p>لا توجد تحذيرات - كل شيء على ما يرام! ✨</p>
            </div>
        `;
        return;
    }

    let html = '<div class="warnings-list">';

    // Sort warnings: critical first, then moderate, then info
    const sortedWarnings = warnings.sort((a, b) => {
        const order = { critical: 1, moderate: 2, info: 3 };
        return order[a.type] - order[b.type];
    });

    for (const warning of sortedWarnings) {
        html += `
            <div class="warning-item warning-${warning.type}">
                <div class="warning-icon">${warning.icon}</div>
                <div class="warning-content">
                    <div class="warning-title">${warning.message}</div>
                    ${warning.details ? `<div class="warning-description">${warning.details}</div>` : ''}
                </div>
            </div>
        `;
    }

    html += '</div>';
    container.innerHTML = html;
}
