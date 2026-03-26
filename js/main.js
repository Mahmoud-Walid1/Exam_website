// ========================================
// Main Page JavaScript - Firebase Version
// ========================================

import { initializeSubjects, getSubjects, onExamsChange, getTickerItems, GRADE_LEVELS, getExamTypes } from './firebase-data.js';

let allExams = [];
let currentTerm = 'all';
let currentGrade = 'all';
let currentGradeLevel = 'all';
let currentSubject = 'all';
let currentExamType = 'all';
let allSubjects = {};
let allExamTypes = [];


// Initialize the page
document.addEventListener('DOMContentLoaded', async () => {
    await initializeSubjects();
    await loadSubjects();
    await loadExamTypes();
    setupFilters();
    setupExamsListener();
    await updateTicker(); // Load ticker items
    initTypingAnimation(); // Start typing animation
});

// Load subjects from Firebase
async function loadSubjects() {
    allSubjects = await getSubjects();
}

async function loadExamTypes() {
    allExamTypes = await getExamTypes();
    updateExamTypeFilter();
}

// Setup filter inputs
function setupFilters() {
    // Term Tabs
    const termTabs = document.querySelectorAll('.term-tab');
    termTabs.forEach(tab => {
        tab.addEventListener('click', () => {
            termTabs.forEach(t => t.classList.remove('active'));
            tab.classList.add('active');
            currentTerm = tab.dataset.term;
            filterExams();
        });
    });

    // Grade Select
    const gradeSelect = document.getElementById('gradeFilter');
    gradeSelect.addEventListener('change', (e) => {
        currentGrade = e.target.value;
        currentGradeLevel = 'all';
        currentSubject = 'all';
        updateGradeLevelFilter();
        updateSubjectFilter();
        filterExams();
    });

    // Grade Level Select
    const gradeLevelSelect = document.getElementById('gradeLevelFilter');
    gradeLevelSelect.addEventListener('change', (e) => {
        currentGradeLevel = e.target.value;
        filterExams();
    });

    // Subject Select
    const subjectSelect = document.getElementById('subjectFilter');
    subjectSelect.addEventListener('change', (e) => {
        currentSubject = e.target.value;
        filterExams();
    });

    // Exam Type Select
    const typeSelect = document.getElementById('examTypeFilter');
    typeSelect.addEventListener('change', (e) => {
        currentExamType = e.target.value;
        filterExams();
    });

    updateGradeLevelFilter();
    updateSubjectFilter();
}

// Update grade level filter based on selected stage
function updateGradeLevelFilter() {
    const gradeLevelGroup = document.getElementById('gradeLevelFilterGroup');
    const gradeLevelSelect = document.getElementById('gradeLevelFilter');

    if (currentGrade === 'all') {
        gradeLevelGroup.style.display = 'none';
        return;
    }

    gradeLevelGroup.style.display = 'flex';
    gradeLevelSelect.innerHTML = '<option value="all">الكل</option>';

    const levels = GRADE_LEVELS[currentGrade] || [];
    levels.forEach(level => {
        const opt = document.createElement('option');
        opt.value = level;
        opt.textContent = `الصف ${level}`;
        gradeLevelSelect.appendChild(opt);
    });
    
    gradeLevelSelect.value = currentGradeLevel;
}

// Update subject filter based on selected grade
function updateSubjectFilter() {
    const subjectSelect = document.getElementById('subjectFilter');
    subjectSelect.innerHTML = '<option value="all">الكل</option>';

    let subjects = [];
    if (currentGrade === 'all') {
        subjects = [...new Set(Object.values(allSubjects).flat())];
    } else {
        subjects = allSubjects[currentGrade] || [];
    }

    subjects.forEach(subject => {
        const opt = document.createElement('option');
        opt.value = subject;
        opt.textContent = subject;
        subjectSelect.appendChild(opt);
    });

    if (subjects.includes(currentSubject)) {
        subjectSelect.value = currentSubject;
    } else {
        currentSubject = 'all';
        subjectSelect.value = 'all';
    }
}

// Update exam type filter
function updateExamTypeFilter() {
    const typeSelect = document.getElementById('examTypeFilter');
    typeSelect.innerHTML = '<option value="all">الكل</option>';
    
    allExamTypes.forEach(type => {
        const opt = document.createElement('option');
        opt.value = type;
        opt.textContent = type;
        typeSelect.appendChild(opt);
    });
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
    let filteredExams = allExams;
    
    if (currentTerm !== 'all') {
        filteredExams = filteredExams.filter(exam => exam.term === currentTerm);
    }

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
    
    // Filter by exam type
    if (currentExamType !== 'all') {
        filteredExams = filteredExams.filter(exam => exam.examType === currentExamType);
    }

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
        
        return `
            <div class="exam-card" 
                 onclick="window.open('${exam.url}', '_blank')">
                <div class="exam-image-container">
                    <div class="stage-badge stage-${exam.grade}">
                        <lord-icon src="https://cdn.lordicon.com/dxjqoygy.json" trigger="hover" colors="primary:#ffffff" style="width:16px;height:16px;"></lord-icon>
                        ${exam.grade}
                    </div>
                    <img src="${hasImage ? exam.imageUrl : 'icons/default.png'}" 
                         alt="${exam.name}" 
                         class="exam-image ${hasImage ? 'exam-image-url' : ''}" 
                         onerror="this.src='icons/default.png'">
                </div>
                <div class="exam-content">
                    <h3 class="exam-title">${exam.name}</h3>
                    <div class="exam-meta">
                        <div class="exam-badge" title="الفصل الدراسي">
                            <lord-icon src="https://cdn.lordicon.com/qzwudxuv.json" trigger="hover" colors="primary:#475569" style="width:16px;height:16px;"></lord-icon>
                            ${exam.term || 'الفصل الأول'}
                        </div>
                        <div class="exam-badge" title="نوع الاختبار">
                            <lord-icon src="https://cdn.lordicon.com/gqzfzudq.json" trigger="hover" colors="primary:#475569" style="width:16px;height:16px;"></lord-icon>
                            ${exam.examType || 'اختبار نهائي'}
                        </div>
                        <div class="exam-badge" title="المادة">
                            <lord-icon src="https://cdn.lordicon.com/abfverha.json" trigger="hover" colors="primary:#475569" style="width:16px;height:16px;"></lord-icon>
                            ${exam.subject}
                        </div>
                        <div class="exam-badge" title="الصف">
                            <lord-icon src="https://cdn.lordicon.com/kipaqhoz.json" trigger="hover" colors="primary:#475569" style="width:16px;height:16px;"></lord-icon>
                            الصف ${exam.gradeLevel}
                        </div>
                    </div>
                    <a href="${exam.url}" target="_blank" class="exam-btn" onclick="event.stopPropagation()">
                        <lord-icon src="https://cdn.lordicon.com/cllunfud.json" trigger="hover" colors="primary:#ffffff" style="width:20px;height:20px;"></lord-icon>
                        <span>عرض في المتجر</span>
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

        // Lord Icon URLs for different categories
        const lordIconUrls = [
            'https://cdn.lordicon.com/kipaqhoz.json', // book
            'https://cdn.lordicon.com/dxjqoygy.json', // graduation cap
            'https://cdn.lordicon.com/gqzfzudq.json', // refresh/update
            'https://cdn.lordicon.com/abfverha.json', // notebook
            'https://cdn.lordicon.com/lsrcesku.json', // pencil
            'https://cdn.lordicon.com/vdjwmfqs.json', // document
        ];

        // If no Firebase items, use default features/benefits
        if (itemsToUse.length === 0) {
            itemsToUse = [
                { text: 'اختبارات محاكية نهائية شاملة', icon: '', url: '' },
                { text: 'جميع المراحل الدراسية', icon: '', url: '' },
                { text: 'محدثة باستمرار', icon: '', url: '' },
                { text: 'تغطية كاملة للمنهج', icon: '', url: '' },
                { text: 'تقييم احترافي للطلاب', icon: '', url: '' },
                { text: 'ابتدائي - متوسط - ثانوي', icon: '', url: '' },
                { text: 'أسئلة متنوعة ومحدثة', icon: '', url: '' },
                { text: 'سهولة الاستخدام', icon: '', url: '' },
            ];
        }

        // Build a single card HTML with Lord Icon
        function buildCard(item, index) {
            const lordIcon = lordIconUrls[index % lordIconUrls.length];
            return `
            <div class="ticker-card" data-url="${item.url || ''}" style="cursor: pointer;">
                <div class="ticker-placeholder">
                    <lord-icon
                        src="${lordIcon}"
                        trigger="loop"
                        delay="${1500 + (index % 3) * 500}"
                        colors="primary:#1e3a5f,secondary:#0d9488"
                        style="width:70px;height:70px;">
                    </lord-icon>
                </div>
                <div class="ticker-card-content">
                    <p class="ticker-text">${item.text}</p>
                </div>
            </div>`;
        }

        // Fill one half
        const viewportWidth = window.innerWidth;
        const isMobile = viewportWidth <= 768;
        const cardWidth = isMobile ? 160 : 200;
        const gap = 20;
        const cardStepWidth = cardWidth + gap;
        
        // Ensure we have a massive buffer to cover any screen size (3x viewport)
        const minCardsPerHalf = Math.max(12, Math.ceil((viewportWidth * 3) / cardStepWidth));

        let halfCards = [];
        for (let i = 0; i < Math.max(minCardsPerHalf, itemsToUse.length); i++) {
            halfCards.push(buildCard(itemsToUse[i % itemsToUse.length], i));
        }

        const halfHTML = halfCards.join('');
        tickerTrack.innerHTML = halfHTML + halfHTML;

        // Calculate exact pixel width of one half for the animation
        // With gap, the distance to the next identical set is exactly cards * (width + gap)
        const halfWidthValue = halfCards.length * cardStepWidth;
        
        // Use a negative value to scroll from right to left (standard marquee)
        tickerTrack.style.setProperty('--scroll-width', `-${halfWidthValue}px`);
        
        // Speed: ~40px/s for smoother reading
        const duration = halfWidthValue / 40;
        tickerTrack.style.animationDuration = duration + 's';

        // Add event listeners...
        tickerTrack.querySelectorAll('.ticker-card').forEach(card => {
            const url = card.dataset.url;
            if (url && url !== '') {
                card.addEventListener('click', () => window.open(url, '_blank'));
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
