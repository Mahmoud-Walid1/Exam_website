// ========================================
// Main Page JavaScript - Firebase Version
// ========================================

import { initializeSubjects, getSubjects, onExamsChange, getTickerItems, GRADE_LEVELS, getExamTypes, getGeneralSettings, incrementVisits } from './firebase-data.js';

let allExams = [];
let currentTerm = 'الفصل الأول';
let currentGrade = 'all';
let currentGradeLevel = 'all';
let currentSubject = 'all';
let currentExamType = 'all';
let currentSearchQuery = '';

// ========================================
// English → Arabic Keyboard Layout Mapping
// ========================================
const EN_TO_AR_MAP = {
    'q': 'ض', 'w': 'ص', 'e': 'ث', 'r': 'ق', 't': 'ف', 'y': 'غ',
    'u': 'ع', 'i': 'ه', 'o': 'خ', 'p': 'ح', '[': 'ج', ']': 'د',
    'a': 'ش', 's': 'س', 'd': 'ي', 'f': 'ب', 'g': 'ل', 'h': 'ا',
    'j': 'ت', 'k': 'ن', 'l': 'م', ';': 'ك', "'": 'ط',
    'z': 'ئ', 'x': 'ء', 'c': 'ؤ', 'v': 'ر', 'b': 'لا', 'n': 'ى',
    'm': 'ة', ',': 'و', '.': 'ز', '/': 'ظ', '`': 'ذ',
    '~': 'ّ', '1': '١', '2': '٢', '3': '٣', '4': '٤', '5': '٥',
    '6': '٦', '7': '٧', '8': '٨', '9': '٩', '0': '٠'
};

function convertEnglishToArabic(text) {
    if (!text) return '';
    return text.split('').map(ch => EN_TO_AR_MAP[ch.toLowerCase()] || ch).join('');
}

function isEnglishText(text) {
    const englishCount = (text.match(/[a-zA-Z]/g) || []).length;
    return englishCount > text.length * 0.5;
}

// ========================================
// Arabic Synonyms & Abbreviations Dictionary
// ========================================
const ARABIC_SYNONYMS = {
    // Subject abbreviations & variations
    'رياضه': ['رياضيات'],
    'رياضة': ['رياضيات'],
    'رياضي': ['رياضيات'],
    'حساب': ['رياضيات'],
    'عربي': ['لغة عربية', 'عربية'],
    'انجليزي': ['لغة إنجليزية', 'إنجليزية', 'انجليزية'],
    'انقليزي': ['لغة إنجليزية', 'إنجليزية', 'انجليزية'],
    'انكليزي': ['لغة إنجليزية', 'إنجليزية', 'انجليزية'],
    'لغه': ['لغة'],
    'علم': ['علوم'],
    'فيزيا': ['فيزياء'],
    'فيزيه': ['فيزياء'],
    'كيميا': ['كيمياء'],
    'كيميه': ['كيمياء'],
    'احياء': ['أحياء'],
    'احيا': ['أحياء'],
    'دراسات': ['دراسات اجتماعية', 'دراسات إسلامية'],
    'اجتماعي': ['دراسات اجتماعية', 'اجتماعية'],
    'اجتماعيه': ['دراسات اجتماعية', 'اجتماعية'],
    'اسلامي': ['دراسات إسلامية', 'إسلامية'],
    'اسلاميه': ['دراسات إسلامية', 'إسلامية'],
    'تربيه': ['تربية'],
    // Grade abbreviations
    'ابتدائي': ['ابتدائي'],
    'ابتدائيه': ['ابتدائي'],
    'متوسط': ['متوسط'],
    'متوسطه': ['متوسط'],
    'ثانوي': ['ثانوي'],
    'ثانويه': ['ثانوي'],
    // Exam type abbreviations
    'نهائي': ['اختبار نهائي', 'نهائي'],
    'فتري': ['اختبار فتري', 'فتري'],
    'فترى': ['اختبار فتري', 'فتري'],
    'شهري': ['اختبار شهري', 'شهري'],
    'تجريبي': ['اختبار تجريبي', 'تجريبي'],
    'محاكي': ['محاكي'],
    'مراجعه': ['مراجعة'],
    'مراجعة': ['مراجعة'],
    'نموذج': ['نموذج'],
    'اجابه': ['إجابة', 'اجابة'],
    'اجابة': ['إجابة', 'اجابة'],
    // Numbers
    'اول': ['الأول'],
    'تاني': ['الثاني'],
    'ثاني': ['الثاني'],
    'ثالث': ['الثالث'],
    'رابع': ['الرابع'],
    'خامس': ['الخامس'],
    'سادس': ['السادس'],
};

function expandSynonyms(word) {
    const normalized = normalizeText(word);
    const expansions = [normalized];
    
    // Check direct synonym match
    for (const [key, values] of Object.entries(ARABIC_SYNONYMS)) {
        const normalizedKey = normalizeText(key);
        if (normalizedKey === normalized) {
            values.forEach(v => expansions.push(normalizeText(v)));
        }
    }
    
    return [...new Set(expansions)];
}

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

// Smart query preprocessor: handles English keyboard + synonyms
function preprocessQuery(rawQuery) {
    if (!rawQuery) return '';
    
    // If user typed English letters, convert to Arabic keyboard layout
    if (isEnglishText(rawQuery)) {
        const converted = convertEnglishToArabic(rawQuery);
        return normalizeText(converted);
    }
    
    return normalizeText(rawQuery);
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
    
    // 2. Prefix match (e.g. "رياض" matches "رياضيات")
    const wordsInText = text.split(/\s+/);
    for (let tWord of wordsInText) {
        if (tWord.startsWith(word) && word.length >= 2) return true;
        let stripped = tWord.startsWith('ال') ? tWord.slice(2) : tWord;
        if (stripped.startsWith(word) && word.length >= 2) return true;
    }

    // 3. Synonym expansion
    const synonyms = expandSynonyms(word);
    for (const syn of synonyms) {
        if (syn !== word && text.includes(syn)) return true;
        // Also check prefix of synonyms
        for (let tWord of wordsInText) {
            let stripped = tWord.startsWith('ال') ? tWord.slice(2) : tWord;
            if (stripped.startsWith(syn) && syn.length >= 2) return true;
            if (tWord.startsWith(syn) && syn.length >= 2) return true;
        }
    }

    if (word.length <= 2) return false;

    // 4. Common Arabic typo regex mapping
    let regexPattern = word.split('').map(char => {
        if (char === 'ت' || char === 'ث') return '[تث]';
        if (char === 'ز' || char === 'ذ' || char === 'ظ' || char === 'ض') return '[ذزظض]';
        if (char === 'س' || char === 'ص') return '[سص]';
        if (char === 'ق' || char === 'ك') return '[قك]';
        if (char === 'ط' || char === 'ت') return '[طت]';
        if (char === 'د' || char === 'ذ') return '[دذ]';
        if (char === 'ه' || char === 'ح') return '[هح]';
        return char;
    }).join('');
    
    try {
        if (new RegExp(regexPattern).test(text)) return true;
    } catch(e) {}

    // 5. Fallback to Levenshtein distance matching per word
    const maxTypos = word.length <= 4 ? 1 : 2;
    
    for (let tWord of wordsInText) {
        // Strip "ال" for fair distance comparison
        let strippedTWord = tWord.startsWith('ال') ? tWord.slice(2) : tWord;
        let strippedWord = word.startsWith('ال') ? word.slice(2) : word;
        
        if (strippedWord === strippedTWord && strippedWord.length > 0) return true;
        
        if (Math.abs(strippedTWord.length - strippedWord.length) <= 2) {
            if (levenshteinDistance(strippedWord, strippedTWord) <= maxTypos) return true;
        }
        
        if (Math.abs(tWord.length - word.length) <= 2) {
            if (levenshteinDistance(word, tWord) <= maxTypos) return true;
        }
    }
}

// Map subject name to matching local icon path
function getSubjectIcon(subjectName) {
    if (!subjectName) return 'icons/default.png';
    const name = subjectName.trim().toLowerCase();
    if (name.includes('رياض') || name.includes('حساب')) return 'icons/math.png';
    if (name.includes('عرب') || name.includes('لغتي')) return 'icons/arabic.png';
    if (name.includes('علم') || name.includes('سائنس')) return 'icons/science.png';
    if (name.includes('إنجليز') || name.includes('انجليز')) return 'icons/english.png';
    if (name.includes('اجتماع') || name.includes('جغراف') || name.includes('تاريخ')) return 'icons/social_studies.png';
    if (name.includes('إسلام') || name.includes('اسلام') || name.includes('قرآن') || name.includes('توحيد') || name.includes('فقه') || name.includes('حديث') || name.includes('تفسير') || name.includes('سيرة') || name.includes('تجويد')) return 'icons/islamic_studies.png';
    if (name.includes('فيزيا')) return 'icons/Physics.png';
    if (name.includes('كيميا')) return 'icons/chemistry.png';
    if (name.includes('أحياء') || name.includes('احياء')) return 'icons/احياء.png';
    return 'icons/default.png';
}

// Map subject name to modern background gradients
function getSubjectGradient(subjectName) {
    if (!subjectName) return 'linear-gradient(135deg, #1e3a5f 0%, #0f172a 100%)';
    const name = subjectName.trim().toLowerCase();
    if (name.includes('رياض') || name.includes('حساب')) return 'linear-gradient(135deg, #4f46e5 0%, #2563eb 100%)'; // Indigo-blue
    if (name.includes('عرب') || name.includes('لغتي')) return 'linear-gradient(135deg, #0d9488 0%, #115e59 100%)'; // Teal
    if (name.includes('علم') || name.includes('سائنس')) return 'linear-gradient(135deg, #059669 0%, #047857 100%)'; // Emerald
    if (name.includes('إنجليز') || name.includes('انجليز')) return 'linear-gradient(135deg, #7c3aed 0%, #4f46e5 100%)'; // Violet-indigo
    if (name.includes('اجتماع') || name.includes('جغراف') || name.includes('تاريخ')) return 'linear-gradient(135deg, #ea580c 0%, #ca8a04 100%)'; // Orange-yellow
    if (name.includes('إسلام') || name.includes('اسلام') || name.includes('قرآن') || name.includes('توحيد') || name.includes('فقه') || name.includes('حديث') || name.includes('تفسير') || name.includes('سيرة') || name.includes('تجويد')) return 'linear-gradient(135deg, #16a34a 0%, #15803d 100%)'; // Green
    if (name.includes('فيزيا')) return 'linear-gradient(135deg, #2563eb 0%, #06b6d4 100%)'; // Blue-cyan
    if (name.includes('كيميا')) return 'linear-gradient(135deg, #db2777 0%, #7c3aed 100%)'; // Pink-purple
    if (name.includes('أحياء') || name.includes('احياء')) return 'linear-gradient(135deg, #84cc16 0%, #22c55e 100%)'; // Lime-green
    return 'linear-gradient(135deg, #475569 0%, #1e293b 100%)'; // Slate
}


// Helper to animate visitor count and stats numbers
function animateNumber(element, targetValue) {
    if (!element) return;
    let start = 0;
    const duration = 1500; // 1.5 seconds for a smooth count-up
    const startTime = performance.now();
    
    function update(currentTime) {
        const elapsed = currentTime - startTime;
        const progress = Math.min(elapsed / duration, 1);
        
        // Ease out quad
        const easeProgress = progress * (2 - progress);
        const currentValue = Math.floor(easeProgress * targetValue);
        
        element.textContent = currentValue.toLocaleString();
        
        if (progress < 1) {
            requestAnimationFrame(update);
        } else {
            element.textContent = targetValue.toLocaleString();
        }
    }
    
    requestAnimationFrame(update);
}

// Calculate and animate exam counters
function updateExamStats(exams) {
    const finalExamsCount = exams.filter(exam => {
        const type = exam.examType || '';
        const name = exam.name || '';
        return type === 'اختبار نهائي' || (type === '' && name.includes('نهائي'));
    }).length;

    const centralExamsCount = exams.filter(exam => {
        const type = exam.examType || '';
        const name = exam.name || '';
        return type === 'اختبار مركزي' || 
               type === 'اختبار منتصف الفصل' || 
               type === 'اختبار دوري' || 
               type === 'اختبار فتري' || 
               name.includes('مركزي') || 
               name.includes('منتصف');
    }).length;
    
    const finalEl = document.getElementById('statFinalExamsCount');
    const centralEl = document.getElementById('statCentralExamsCount');
    
    if (finalEl) animateNumber(finalEl, finalExamsCount);
    if (centralEl) animateNumber(centralEl, centralExamsCount);
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

    // Increment and fetch visits count
    try {
        const hasVisited = sessionStorage.getItem('site_visited');
        let visits = 0;
        if (!hasVisited) {
            sessionStorage.setItem('site_visited', 'true');
            visits = await incrementVisits(true);
        } else {
            visits = await incrementVisits(false);
        }
        const visitsEl = document.getElementById('statVisitsCount');
        if (visitsEl) {
            animateNumber(visitsEl, visits);
        }
    } catch (e) {
        console.error('Error handling visitor counter:', e);
    }

    await initializeSubjects();
    await loadSubjects();
    await loadExamTypes();
    setupFilters();
    setupExamsListener();
    await updateTicker(); // Load ticker items
    initTypingAnimation(); // Start typing animation
    initWhatsAppWidget(); // Start WhatsApp widget logic
    initScrollToTop(); // Start Scroll-to-top logic
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
    // Smart Search Input with Suggestions
    const searchInput = document.getElementById('smartSearchInput');
    const suggestionsBox = document.getElementById('searchSuggestions');
    let activeSuggestionIndex = -1;
    let debounceTimer = null;

    if (searchInput) {
        searchInput.addEventListener('input', (e) => {
            currentSearchQuery = preprocessQuery(e.target.value.trim());
            
            // Debounce suggestions for performance
            clearTimeout(debounceTimer);
            debounceTimer = setTimeout(() => {
                showSuggestions(e.target.value.trim());
            }, 150);
            
            filterExams();
        });

        // Keyboard navigation for suggestions
        searchInput.addEventListener('keydown', (e) => {
            const items = suggestionsBox.querySelectorAll('.suggestion-item');
            if (!items.length) return;

            if (e.key === 'ArrowDown') {
                e.preventDefault();
                activeSuggestionIndex = Math.min(activeSuggestionIndex + 1, items.length - 1);
                updateActiveSuggestion(items);
            } else if (e.key === 'ArrowUp') {
                e.preventDefault();
                activeSuggestionIndex = Math.max(activeSuggestionIndex - 1, 0);
                updateActiveSuggestion(items);
            } else if (e.key === 'Enter' && activeSuggestionIndex >= 0) {
                e.preventDefault();
                items[activeSuggestionIndex].click();
            } else if (e.key === 'Escape') {
                hideSuggestions();
            }
        });

        // Hide suggestions when clicking outside
        document.addEventListener('click', (e) => {
            if (!e.target.closest('.smart-search-container')) {
                hideSuggestions();
            }
        });

        // Show suggestions on focus if there's text
        searchInput.addEventListener('focus', () => {
            if (searchInput.value.trim().length > 0) {
                showSuggestions(searchInput.value.trim());
            }
        });
    }

    function updateActiveSuggestion(items) {
        items.forEach((item, i) => {
            item.classList.toggle('active', i === activeSuggestionIndex);
        });
        if (items[activeSuggestionIndex]) {
            items[activeSuggestionIndex].scrollIntoView({ block: 'nearest' });
        }
    }

    function hideSuggestions() {
        suggestionsBox.classList.remove('active');
        activeSuggestionIndex = -1;
    }

    function scoreExam(exam, query) {
        const normalizedQuery = preprocessQuery(query);
        const queryWords = normalizedQuery.split(/\s+/).filter(w => w);
        if (!queryWords.length) return 0;

        const fields = {
            name: { text: normalizeText(exam.name), weight: 5 },
            subject: { text: normalizeText(exam.subject), weight: 4 },
            grade: { text: normalizeText(exam.grade), weight: 3 },
            gradeLevel: { text: normalizeText(exam.gradeLevel), weight: 3 },
            examType: { text: normalizeText(exam.examType || ''), weight: 2 },
            term: { text: normalizeText(exam.term || ''), weight: 1 }
        };

        let totalScore = 0;
        let matchedWords = 0;

        for (const word of queryWords) {
            let bestWordScore = 0;
            for (const field of Object.values(fields)) {
                if (!field.text) continue;
                // Exact contains
                if (field.text.includes(word)) {
                    let score = field.weight * 10;
                    // Bonus: starts with
                    if (field.text.startsWith(word)) score += field.weight * 5;
                    // Bonus: exact match
                    if (field.text === word) score += field.weight * 8;
                    bestWordScore = Math.max(bestWordScore, score);
                }
                // Fuzzy match
                else if (fuzzyMatchWord(word, field.text)) {
                    bestWordScore = Math.max(bestWordScore, field.weight * 4);
                }
            }
            if (bestWordScore > 0) matchedWords++;
            totalScore += bestWordScore;
        }

        // Bonus for matching ALL query words
        if (matchedWords === queryWords.length) {
            totalScore *= 1.5;
        }
        // Penalize if not all words match
        else if (matchedWords === 0) {
            return 0;
        }

        return totalScore;
    }

    function showSuggestions(query) {
        if (!query || query.length < 1) {
            hideSuggestions();
            return;
        }

        // Detect if user typed with wrong keyboard
        const wasEnglishKeyboard = isEnglishText(query);
        const processedQuery = wasEnglishKeyboard ? convertEnglishToArabic(query) : query;

        // Score all exams
        const scored = allExams
            .map(exam => ({ exam, score: scoreExam(exam, query) }))
            .filter(item => item.score > 0)
            .sort((a, b) => b.score - a.score)
            .slice(0, 7);

        if (scored.length === 0) {
            suggestionsBox.innerHTML = `
                <div class="suggestions-header">😕 لا توجد نتائج مطابقة لـ "${query}"</div>
            `;
            suggestionsBox.classList.add('active');
            return;
        }

        let html = '';
        
        // Show keyboard conversion notice
        if (wasEnglishKeyboard) {
            html += `<div class="suggestions-header" style="background: #eff6ff; color: #2563eb; border-color: #bfdbfe;">
                ⌨️ تم تحويل الكيبورد تلقائياً: <strong>"${processedQuery}"</strong>
            </div>`;
        }
        
        html += `<div class="suggestions-header">🔍 نتائج البحث (${scored.length})</div>`;
        
        scored.forEach((item, index) => {
            const exam = item.exam;
            const gradeLevelText = exam.gradeLevel ? `الصف ${exam.gradeLevel}` : '';
            html += `
                <div class="suggestion-item" data-index="${index}" data-exam-url="${exam.url}" data-exam-name="${exam.name}">
                    <img class="suggestion-icon" src="${exam.icon || getSubjectIcon(exam.subject)}" alt="${exam.subject}" onerror="this.src='icons/default.png'">
                    <div class="suggestion-info">
                        <div class="suggestion-name">${highlightMatch(exam.name, query)}</div>
                        <div class="suggestion-meta">${exam.subject} • ${gradeLevelText} • ${exam.term || ''}</div>
                    </div>
                    <span class="suggestion-badge ${exam.grade}">${exam.grade}</span>
                </div>
            `;
        });

        suggestionsBox.innerHTML = html;
        suggestionsBox.classList.add('active');
        activeSuggestionIndex = -1;

        // Click handlers for suggestions
        suggestionsBox.querySelectorAll('.suggestion-item').forEach(item => {
            item.addEventListener('click', () => {
                const examName = item.dataset.examName;
                searchInput.value = examName;
                currentSearchQuery = normalizeText(examName);
                filterExams();
                hideSuggestions();
            });
        });
    }

    function highlightMatch(text, query) {
        if (!query) return text;
        const words = query.split(/\s+/).filter(w => w);
        let result = text;
        words.forEach(word => {
            const regex = new RegExp(`(${word.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')})`, 'gi');
            result = result.replace(regex, '<span class="suggestion-highlight">$1</span>');
        });
        return result;
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
        updateExamStats(exams);
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
        const iconSrc = exam.icon && exam.icon !== 'icons/default.png' ? exam.icon : getSubjectIcon(exam.subject);
        const iconHtml = `
            <div class="exam-icon-wrapper" style="background: ${getSubjectGradient(exam.subject)};">
                <img src="${iconSrc}" alt="${exam.subject}" class="exam-fallback-icon">
            </div>
        `;

        let mediaContent = '';
        if (hasImage) {
            mediaContent = `
                ${iconHtml}
                <div class="exam-cover-image lazy-bg" data-bg="${exam.imageUrl}"></div>
                <img data-src="${exam.imageUrl}" alt="${exam.name}" class="exam-image-contain lazy-image" 
                     onload="this.classList.add('loaded'); const cov = this.parentElement.querySelector('.exam-cover-image'); if(cov) cov.classList.add('loaded'); const wrp = this.parentElement.querySelector('.exam-icon-wrapper'); if(wrp) { wrp.style.opacity='0'; wrp.style.visibility='hidden'; }" 
                     onerror="this.style.display='none'; const cov = this.parentElement.querySelector('.exam-cover-image'); if(cov) cov.style.display='none'; const wrp = this.parentElement.querySelector('.exam-icon-wrapper'); if(wrp) { wrp.style.opacity='1'; wrp.style.visibility='visible'; wrp.style.display='flex'; }">
            `;
        } else {
            mediaContent = iconHtml;
        }

        let formattedGrade = exam.gradeLevel ? `الصف ${exam.gradeLevel}` : '';
        if (exam.gradeLevel && exam.grade) {
            let gradeDefinite = exam.grade.startsWith('ال') ? exam.grade : 'ال' + exam.grade;
            formattedGrade = `الصف ${exam.gradeLevel} ${gradeDefinite}`;
        } else if (!exam.gradeLevel && exam.grade) {
            formattedGrade = exam.grade;
        }

        return `
            <div class="exam-card" onclick="window.open('${exam.url}', '_blank')">
                <div class="exam-header">
                    ${exam.examModel ? `
                    <div class="stage-chip stage-${exam.grade}">
                        ${exam.examModel}
                    </div>
                    ` : ''}
                    ${exam.examIsStandard ? `
                    <div class="standard-badge">
                        وفق جدول المواصفات
                    </div>
                    ` : ''}
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
                            ${formattedGrade}
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

    // Initialize lazy loading for the newly rendered cards
    initLazyLoading();
}

// Lazy loading for images and backgrounds based on IntersectionObserver
function initLazyLoading() {
    const lazyImages = document.querySelectorAll('.lazy-image');
    const lazyBackgrounds = document.querySelectorAll('.lazy-bg');

    if ('IntersectionObserver' in window) {
        const imageObserver = new IntersectionObserver((entries, observer) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    const img = entry.target;
                    if (img.dataset.src) {
                        img.src = img.dataset.src;
                        img.removeAttribute('data-src');
                    }
                    img.classList.remove('lazy-image');
                    observer.unobserve(img);
                }
            });
        }, {
            rootMargin: '250px 0px', // Load images 250px before they enter the screen
            threshold: 0.01
        });

        const bgObserver = new IntersectionObserver((entries, observer) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    const div = entry.target;
                    if (div.dataset.bg) {
                        div.style.backgroundImage = `url('${div.dataset.bg}')`;
                        div.removeAttribute('data-bg');
                    }
                    div.classList.remove('lazy-bg');
                    observer.unobserve(div);
                }
            });
        }, {
            rootMargin: '250px 0px',
            threshold: 0.01
        });

        lazyImages.forEach(img => imageObserver.observe(img));
        lazyBackgrounds.forEach(bg => bgObserver.observe(bg));
    } else {
        // Fallback for older browsers
        lazyImages.forEach(img => {
            if (img.dataset.src) {
                img.src = img.dataset.src;
                img.removeAttribute('data-src');
            }
        });
        lazyBackgrounds.forEach(div => {
            if (div.dataset.bg) {
                div.style.backgroundImage = `url('${div.dataset.bg}')`;
                div.removeAttribute('data-bg');
            }
        });
    }
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

// ========================================
// WhatsApp Popup Logic
// ========================================
function initWhatsAppWidget() {
    const waPopup = document.getElementById('waPopup');
    const waPopupClose = document.getElementById('waPopupClose');
    
    if (!waPopup || !waPopupClose) return;

    const showPopup = () => {
        waPopup.classList.add('show');
        // Hide after 6 seconds
        setTimeout(() => {
            waPopup.classList.remove('show');
        }, 6000);
    };

    // Initial show after 5 seconds
    setTimeout(() => {
        showPopup();
        // Repeat every 25 seconds
        setInterval(showPopup, 25000);
    }, 5000);

    waPopupClose.addEventListener('click', () => {
        waPopup.classList.remove('show');
    });
}

// Scroll to Top Logic
function initScrollToTop() {
    const scrollBtn = document.getElementById('scrollToTopBtn');
    if (!scrollBtn) return;

    window.addEventListener('scroll', () => {
        if (window.scrollY > 300) {
            scrollBtn.classList.add('show');
        } else {
            scrollBtn.classList.remove('show');
        }
    });

    scrollBtn.addEventListener('click', () => {
        window.scrollTo({
            top: 0,
            behavior: 'smooth'
        });
    });
}
