// ========================================
// Main Page JavaScript - Firebase Version
// ========================================

import { initializeSubjects, getSubjects, onExamsChange, getTickerItems, GRADE_LEVELS, getExamTypes, getGeneralSettings } from './firebase-data.js';

let allExams = [];
let currentTerm = 'الفصل الأول';
let currentGrade = 'all';
let currentGradeLevel = 'all';
let currentSubject = 'all';
let currentExamType = 'all';
let currentSearchQuery = '';

// Smart Arabic Normalization for Search
function normalizeText(text) {
    if (!text) return '';
    return text.toString()
        .replace(/[أإآ]/g, 'ا')
        .replace(/ة/g, 'ه')
        .replace(/ى/g, 'ي')
        .replace(/[\u064B-\u065F]/g, '') // remove tashkeel
        .toLowerCase();
}
let allSubjects = {};
let allExamTypes = [];

// Advanced Arabic NLP Fuzzy Match for Typos
function levenshteinDistance(a, b) {
    if (a.length === 0) return b.length;
    if (b.length === 0) return a.length;
    const matrix = [];
    for (let i = 0; i <= b.length; i++) matrix[i] = [i];
    for (let j = 0; j <= a.length; j++) matrix[0][j] = j;
    for (let i = 1; i <= b.length; i++) {
        for (let j = 1; j <= a.length; j++) {
            if (b.charAt(i - 1) === a.charAt(j - 1)) {
                matrix[i][j] = matrix[i - 1][j - 1];
            } else {
                matrix[i][j] = Math.min(
                    matrix[i - 1][j - 1] + 1,
                    Math.min(matrix[i][j - 1] + 1, matrix[i - 1][j] + 1)
                );
            }
        }
    }
    return matrix[b.length][a.length];
}

function fuzzyMatchWord(word, text) {
    // 1. Direct match
    if (text.includes(word)) return true;
    
    if (word.length <= 2) return false;

    // 2. Common Arabic typo regex mapping
    let regexPattern = word.split('').map(char => {
        if (char === 'ت' || char === 'ث') return '[تث]';
        if (char === 'ز' || char === 'ذ' || char === 'ظ' || char === 'ض') return '[ذزظض]';
        if (char === 'س' || char === 'ص') return '[سص]';
        if (char === 'ق' || char === 'ك') return '[قك]';
        if (char === 'ط' || char === 'ت') return '[طت]';
        return char;
    }).join('');
    
    try {
        if (new RegExp(regexPattern).test(text)) return true;
    } catch(e) {}

    // 3. Fallback to Levenshtein distance matching per word
    const maxTypos = word.length <= 4 ? 1 : 2;
    const wordsInText = text.split(/\s+/);
    
    for (let tWord of wordsInText) {
        // Strip "ال" for fair distance comparison
        let strippedTWord = tWord.startsWith('ال') ? tWord.slice(2) : tWord;
        let strippedWord = word.startsWith('ال') ? word.slice(2) : word;
        
        if (strippedWord === strippedTWord && strippedWord.length > 0) return true;
        
        if (Math.abs(strippedTWord.length - strippedWord.length) <= 1) {
            if (levenshteinDistance(strippedWord, strippedTWord) <= maxTypos) return true;
        }
        
        if (Math.abs(tWord.length - word.length) <= 1) {
            if (levenshteinDistance(word, tWord) <= maxTypos) return true;
        }
    }
    return false;
}


// Initialize the page
document.addEventListener('DOMContentLoaded', async () => {
    try {
        const settings = await getGeneralSettings();
        currentTerm = settings.defaultTerm || 'الفصل الأول';
        
        // Update the visual tabs based on default term
        const termTabs = document.querySelectorAll('.term-tab');
        termTabs.forEach(tab => {
            if (tab.dataset.term === currentTerm) tab.classList.add('active');
            else tab.classList.remove('active');
        });
    } catch(e) { console.error('Error loading default setting', e); }

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
    // Smart Search Input
    const searchInput = document.getElementById('smartSearchInput');
    if (searchInput) {
        searchInput.addEventListener('input', (e) => {
            currentSearchQuery = normalizeText(e.target.value.trim());
            filterExams();
        });
    }

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
    
    // Initial custom select for Grade
    updateCustomSelect(document.getElementById('gradeFilter'));
}

// Custom Select Implementation
function updateCustomSelect(selectElement) {
    if (!selectElement) return;
    
    let wrapper = selectElement.nextElementSibling;
    if (!wrapper || !wrapper.classList.contains('custom-select-wrapper')) {
        wrapper = document.createElement('div');
        wrapper.className = 'custom-select-wrapper';
        selectElement.parentNode.insertBefore(wrapper, selectElement.nextSibling);
        selectElement.style.display = 'none';
        
        document.addEventListener('click', (e) => {
            if (!wrapper.contains(e.target)) {
                wrapper.classList.remove('open');
            }
        });
    }

    const selectedOption = selectElement.options[selectElement.selectedIndex] || selectElement.options[0];
    
    let html = `
        <div class="custom-select-trigger">${selectedOption ? selectedOption.textContent : 'اختر...'}</div>
        <div class="custom-options">
    `;
    
    for (let opt of selectElement.options) {
        const isSelected = opt.value === selectElement.value ? 'selected' : '';
        html += `<div class="custom-option ${isSelected}" data-value="${opt.value}">${opt.textContent}</div>`;
    }
    html += `</div>`;
    
    wrapper.innerHTML = html;
    
    const trigger = wrapper.querySelector('.custom-select-trigger');
    const optionsGroup = wrapper.querySelector('.custom-options');
    
    trigger.addEventListener('click', () => {
        document.querySelectorAll('.custom-select-wrapper').forEach(w => {
            if (w !== wrapper) w.classList.remove('open');
        });
        wrapper.classList.toggle('open');
    });
    
    const options = wrapper.querySelectorAll('.custom-option');
    options.forEach(optDiv => {
        optDiv.addEventListener('click', () => {
            selectElement.value = optDiv.dataset.value;
            
            trigger.textContent = optDiv.textContent;
            options.forEach(o => o.classList.remove('selected'));
            optDiv.classList.add('selected');
            
            wrapper.classList.remove('open');
            selectElement.dispatchEvent(new Event('change'));
        });
    });
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
    updateCustomSelect(gradeLevelSelect);
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
    updateCustomSelect(subjectSelect);
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
    updateCustomSelect(typeSelect);
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
        filteredExams = filteredExams.filter(exam => (exam.term || 'الفصل الأول') === currentTerm);
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

    // Apply Smart Search (OmniSearch with Typo Tolerance)
    if (currentSearchQuery) {
        const queryWords = currentSearchQuery.split(/\s+/).filter(w => w);
        filteredExams = filteredExams.filter(exam => {
            const searchableText = normalizeText(
                `${exam.name} ${exam.subject} ${exam.grade} ${exam.gradeLevel} ${exam.examType || ''} ${exam.term || 'الفصل الأول'}`
            );
            return queryWords.every(word => fuzzyMatchWord(word, searchableText));
        });
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
        
        // Define media content: Fallback icon is always ready
        const iconSrc = exam.icon || 'https://cdn.lordicon.com/dxjqoygy.json';
        const iconHtml = `
            <div class="exam-icon-wrapper">
                <lord-icon src="${iconSrc}" trigger="loop" delay="2000" colors="primary:#ffffff,secondary:#ffffff" style="width:80px;height:80px;"></lord-icon>
            </div>
        `;

        let mediaContent = '';
        if (hasImage) {
            mediaContent = `
                ${iconHtml}
                <div class="exam-cover-image" style="background-image: url('${exam.imageUrl}')"></div>
                <img src="${exam.imageUrl}" alt="${exam.name}" class="exam-image-contain" 
                     onload="this.parentElement.querySelector('.exam-icon-wrapper').style.display='none';" 
                     onerror="this.style.display='none'; this.previousElementSibling.style.display='none'; this.parentElement.querySelector('.exam-icon-wrapper').style.display='flex';">
            `;
        } else {
            mediaContent = iconHtml;
        }

        return `
            <div class="exam-card" onclick="window.open('${exam.url}', '_blank')">
                <div class="exam-header">
                    <div class="stage-chip stage-${exam.grade}">
                        ${exam.grade}
                    </div>
                    ${mediaContent}
                </div>
                <div class="exam-body">
                    <h3 class="exam-title">${exam.name}</h3>
                    <div class="exam-tags">
                        <span class="exam-tag term-tag">
                            <lord-icon src="https://cdn.lordicon.com/qzwudxuv.json" trigger="hover" colors="primary:#4338ca" style="width:16px;height:16px;"></lord-icon>
                            ${exam.term || 'الفصل الأول'}
                        </span>
                        <span class="exam-tag type-tag">
                            <lord-icon src="https://cdn.lordicon.com/gqzfzudq.json" trigger="hover" colors="primary:#be185d" style="width:16px;height:16px;"></lord-icon>
                            ${exam.examType || 'اختبار نهائي'}
                        </span>
                        <span class="exam-tag subject-tag">
                            <lord-icon src="https://cdn.lordicon.com/abfverha.json" trigger="hover" colors="primary:#15803d" style="width:16px;height:16px;"></lord-icon>
                            ${exam.subject}
                        </span>
                        <span class="exam-tag level-tag">
                            <lord-icon src="https://cdn.lordicon.com/kipaqhoz.json" trigger="hover" colors="primary:#4b5563" style="width:16px;height:16px;"></lord-icon>
                            الصف ${exam.gradeLevel}
                        </span>
                    </div>
                </div>
                <div class="exam-footer">
                    <div class="exam-action-btn">
                        <lord-icon src="https://cdn.lordicon.com/cllunfud.json" trigger="hover" colors="primary:#ffffff" style="width:20px;height:20px;"></lord-icon>
                        عرض في المتجر
                    </div>
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
