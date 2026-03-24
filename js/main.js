// ========================================
// Main Page JavaScript - Firebase Version
// ========================================

import { initializeSubjects, getSubjects, onExamsChange, getTickerItems } from './firebase-data.js';

let allExams = [];
let currentGrade = 'all';
let currentGradeLevel = 'all';
let currentSubject = 'all';
let allSubjects = {};

// Grade levels for each stage
const GRADE_LEVELS = {
    'ابتدائي': ['الأول', 'الثاني', 'الثالث', 'الرابع', 'الخامس', 'السادس'],
    'متوسط': ['الأول', 'الثاني', 'الثالث'],
    'ثانوي': ['الأول', 'الثاني', 'الثالث']
};

// Initialize the page
document.addEventListener('DOMContentLoaded', async () => {
    await initializeSubjects();
    await loadSubjects();
    setupFilters();
    setupExamsListener();
    await updateTicker(); // Load ticker items
    initTypingAnimation(); // Start typing animation
});

// Load subjects from Firebase
async function loadSubjects() {
    allSubjects = await getSubjects();
}

// Setup filter buttons
function setupFilters() {
    // Grade filter buttons
    const gradeButtons = document.querySelectorAll('.grade-filters .filter-btn');
    gradeButtons.forEach(btn => {
        btn.addEventListener('click', () => {
            gradeButtons.forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            currentGrade = btn.dataset.grade;
            currentGradeLevel = 'all'; // Reset grade level
            currentSubject = 'all'; // Reset subject too
            updateGradeLevelFilter();
            updateSubjectFilter();
            filterExams();
        });
    });

    // Subject filter buttons will be added dynamically
    updateGradeLevelFilter();
    updateSubjectFilter();
}

// Update grade level filter based on selected stage
function updateGradeLevelFilter() {
    const gradeLevelGroup = document.getElementById('gradeLevelFilterGroup');
    const gradeLevelContainer = document.getElementById('gradeLevelFilters');

    if (currentGrade === 'all') {
        gradeLevelGroup.style.display = 'none';
        return;
    }

    gradeLevelGroup.style.display = 'block';
    gradeLevelContainer.innerHTML = '<button class="filter-btn active" data-level="all">الكل</button>';

    const levels = GRADE_LEVELS[currentGrade] || [];
    levels.forEach(level => {
        const btn = document.createElement('button');
        btn.className = 'filter-btn';
        btn.dataset.level = level;
        btn.textContent = `الصف ${level}`;
        gradeLevelContainer.appendChild(btn);
    });

    // Add event listeners to new buttons
    const levelButtons = gradeLevelContainer.querySelectorAll('.filter-btn');
    levelButtons.forEach(btn => {
        btn.addEventListener('click', () => {
            levelButtons.forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            currentGradeLevel = btn.dataset.level;
            filterExams();
        });
    });
}

// Update subject filter based on selected grade
function updateSubjectFilter() {
    const subjectFiltersContainer = document.querySelector('.subject-filters');

    // Clear existing buttons
    subjectFiltersContainer.innerHTML = '';

    // Re-add "الكل" button
    const allButton = document.createElement('button');
    allButton.className = 'filter-btn';
    if (currentSubject === 'all') {
        allButton.classList.add('active');
    }
    allButton.dataset.subject = 'all';
    allButton.textContent = 'الكل';
    allButton.addEventListener('click', () => {
        document.querySelectorAll('.subject-filters .filter-btn').forEach(b => b.classList.remove('active'));
        allButton.classList.add('active');
        currentSubject = 'all';
        filterExams();
    });
    subjectFiltersContainer.appendChild(allButton);

    // Add subject buttons based on grade
    let subjects = [];
    if (currentGrade === 'all') {
        // Show all subjects from all grades
        subjects = [...new Set(Object.values(allSubjects).flat())];
    } else {
        subjects = allSubjects[currentGrade] || [];
    }

    subjects.forEach(subject => {
        const btn = document.createElement('button');
        btn.className = 'filter-btn';
        // Check if this subject is currently selected
        if (currentSubject === subject) {
            btn.classList.add('active');
        }
        btn.dataset.subject = subject;
        btn.textContent = subject;
        btn.addEventListener('click', () => {
            document.querySelectorAll('.subject-filters .filter-btn').forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            currentSubject = subject;
            filterExams();
        });
        subjectFiltersContainer.appendChild(btn);
    });

    // If current subject is not in the new list, reset to 'all'
    if (currentSubject !== 'all' && !subjects.includes(currentSubject)) {
        currentSubject = 'all';
        allButton.classList.add('active');
        filterExams();
    }
}

// Setup real-time exams listener
function setupExamsListener() {
    onExamsChange((exams) => {
        allExams = exams;
        filterExams();
    });
}

// Filter and display exams
function filterExams() {
    console.log('Filtering exams...', {
        total: allExams.length,
        currentGrade,
        currentGradeLevel,
        currentSubject
    });

    let filteredExams = allExams;

    // Filter by grade
    if (currentGrade !== 'all') {
        filteredExams = filteredExams.filter(exam => exam.grade === currentGrade);
    }

    // Filter by grade level
    if (currentGradeLevel !== 'all') {
        filteredExams = filteredExams.filter(exam => exam.gradeLevel === currentGradeLevel);
    }

    // Filter by subject
    if (currentSubject !== 'all') {
        filteredExams = filteredExams.filter(exam => exam.subject === currentSubject);
    }

    console.log('Filtered exams:', filteredExams.length);
    displayExams(filteredExams);
}

// Display exams grid
function displayExams(exams) {
    const examsGrid = document.getElementById('examsGrid');
    const noExamsMsg = document.getElementById('noExams');

    console.log('Displaying exams:', exams.length);

    if (exams.length === 0) {
        examsGrid.innerHTML = '';
        examsGrid.style.display = 'none';
        noExamsMsg.style.display = 'block';
        return;
    }

    noExamsMsg.style.display = 'none';
    examsGrid.style.display = 'grid';
    examsGrid.innerHTML = exams.map(exam => {
        const hasImage = exam.imageUrl && exam.imageUrl.trim() !== '';
        const imgSrc = hasImage ? exam.imageUrl : exam.icon;
        const imgClass = hasImage ? 'exam-image exam-image-url' : 'exam-image';
        return `
        <div class="exam-card" onclick="window.open('${exam.url}', '_blank')">
            <img src="${imgSrc}" alt="${exam.name}" class="${imgClass}" onerror="this.src='icons/default.png'">
            <div class="exam-content">
                <h3 class="exam-title">${exam.name}</h3>
                <div class="exam-meta">
                    <span class="exam-badge badge-subject">📚 ${exam.subject}</span>
                    ${exam.gradeLevel ? `<span class="exam-badge badge-level">🎯 الصف ${exam.gradeLevel}</span>` : ''}
                    <span class="exam-badge badge-grade">🏫 ${exam.grade}</span>
                </div>
                <a href="${exam.url}" target="_blank" class="exam-btn" onclick="event.stopPropagation()">
                    عرض في المتجر 🛒
                </a>
            </div>
        </div>
    `;
    }).join('');
}

// Update announcement ticker from Firebase ticker items
async function updateTicker() {
    const tickerTrack = document.getElementById('tickerTrack');

    if (!tickerTrack) return;

    try {
        const tickerItems = await getTickerItems();

        let itemsToUse = tickerItems;

        // If no Firebase items, use defaults
        if (itemsToUse.length === 0) {
            itemsToUse = [
                { text: 'اختبارات محاكية نهائية شاملة', icon: 'icons/default.png', url: '' },
                { text: 'جميع المراحل الدراسية', icon: 'icons/default.png', url: '' },
                { text: 'محدثة باستمرار', icon: 'icons/default.png', url: '' }
            ];
        }

        // Create a single set of ticker cards
        const singleSetHTML = itemsToUse.map((item, index) => `
            <div class="ticker-card" data-url="${item.url || ''}" data-index="${index}" style="cursor: pointer;">
                <img src="${item.icon}" alt="${item.text}" class="ticker-card-image" onerror="this.src='icons/default.png'">
                <div class="ticker-card-content">
                    <p class="ticker-text">${item.text}</p>
                </div>
            </div>
        `).join('');

        // Calculate how many copies we need to fill the viewport seamlessly
        // Each card is ~200px + 20px gap = 220px, viewport width / 220 gives rough count
        const viewportWidth = window.innerWidth;
        const cardWidth = 220; // width + gap
        const singleSetWidth = itemsToUse.length * cardWidth;
        // We need at least 2 copies, but more if the content is shorter than the viewport
        const copies = Math.max(2, Math.ceil((viewportWidth * 3) / singleSetWidth));

        // Repeat content enough times for seamless infinite scroll
        tickerTrack.innerHTML = singleSetHTML.repeat(copies);

        // Set animation duration based on content width for consistent speed
        const totalWidth = singleSetWidth * copies;
        const pxPerSecond = 50; // pixels per second
        const duration = totalWidth / pxPerSecond / copies; // duration for one set
        tickerTrack.style.animationDuration = (duration * copies / 2) + 's';

        // Add click event listeners to all ticker cards
        const tickerCards = tickerTrack.querySelectorAll('.ticker-card');
        tickerCards.forEach(card => {
            const url = card.dataset.url;
            if (url && url !== '') {
                card.addEventListener('click', (e) => {
                    e.preventDefault();
                    window.open(url, '_blank');
                });
            }
        });
    } catch (error) {
        console.error('Error updating ticker:', error);
    }
}

// Typing animation with IntersectionObserver
function initTypingAnimation() {
    const heroTitle = document.getElementById('heroTitle');
    if (!heroTitle) return;

    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                // Reset animation
                heroTitle.classList.remove('typing-active');
                void heroTitle.offsetWidth; // Force reflow
                heroTitle.classList.add('typing-active');
            }
        });
    }, { threshold: 0.5 });

    observer.observe(heroTitle);
}
