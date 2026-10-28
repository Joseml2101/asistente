// --- CONFIGURACIÓN Y ESTADO DE LA APLICACIÓN ---
const state = {
    tasks: [
        { id: 1, title: 'Ensayo sobre Revolución Industrial', subject: 'Historia', difficulty: 2, dueDate: '2026-11-05', completed: false },
        { id: 2, title: 'Guía de Algoritmos Complejos', subject: 'Programación', difficulty: 5, dueDate: '2026-11-01', completed: false },
        { id: 3, title: 'Lectura de Cien Años de Soledad', subject: 'Literatura', difficulty: 1, dueDate: '2026-11-08', completed: true },
        { id: 4, title: 'Ejercicios de Cálculo Multivariable', subject: 'Matemáticas', difficulty: 4, dueDate: '2026-11-03', completed: false }
    ],
    studyTime: {
        'Matemáticas': 120, // en minutos
        'Historia': 45,
        'Programación': 180,
        'Literatura': 60,
        'Ciencias': 90,
        'Idiomas': 30
    },
    subjectMetrics: [
        { subject: 'Programación', comprehension: 92, focusScore: 'Excelente', sessionsCompleted: 14 },
        { subject: 'Matemáticas', comprehension: 85, focusScore: 'Muy Alto', sessionsCompleted: 9 },
        { subject: 'Ciencias', comprehension: 88, focusScore: 'Alto', sessionsCompleted: 7 },
        { subject: 'Historia', comprehension: 95, focusScore: 'Excelente', sessionsCompleted: 5 },
        { subject: 'Literatura', comprehension: 90, focusScore: 'Alto', sessionsCompleted: 4 },
        { subject: 'Idiomas', comprehension: 82, focusScore: 'Medio-Alto', sessionsCompleted: 3 }
    ],
    currentTextToRead: ''
};

// --- BÚSQUEDA EN TIEMPO REAL ---
const globalSearchInput = document.getElementById('globalSearchInput');
const clearSearchBtn = document.getElementById('clearSearchBtn');

if (globalSearchInput) {
    globalSearchInput.addEventListener('input', (e) => {
        const query = e.target.value.trim().toLowerCase();
        if (query.length > 0) {
            clearSearchBtn.classList.remove('hidden');
        } else {
            clearSearchBtn.classList.add('hidden');
        }
        renderTasks(query);
    });
}

if (clearSearchBtn) {
    clearSearchBtn.addEventListener('click', () => {
        globalSearchInput.value = '';
        clearSearchBtn.classList.add('hidden');
        renderTasks();
    });
}

// --- MENÚ MÓVIL ---
const mobileMenuBtn = document.getElementById('mobileMenuBtn');
const mobileMenu = document.getElementById('mobileMenu');

if (mobileMenuBtn) {
    mobileMenuBtn.addEventListener('click', () => {
        mobileMenu.classList.toggle('hidden');
    });
}

// --- REPRODUCTOR DE SONIDOS DE ENFOQUE (SINTETIZADOR Y RUIDO AMBIENTAL) ---
let audioCtx = null;
let isAudioPlaying = false;
let currentSourceNode = null;
let gainNode = null;

const playPauseAudioBtn = document.getElementById('playPauseAudioBtn');
const playIcon = document.getElementById('playIcon');
const audioBadge = document.getElementById('audioBadge');
const audioSelect = document.getElementById('audioSelect');
const volumeSlider = document.getElementById('volumeSlider');
const audioTrackTitle = document.getElementById('audioTrackTitle');

function initAudioContext() {
    if (!audioCtx) {
        audioCtx = new (window.AudioContext || window.webkitAudioContext)();
        gainNode = audioCtx.createGain();
        gainNode.gain.value = parseFloat(volumeSlider.value);
        gainNode.connect(audioCtx.destination);
    }
}

function createNoiseBuffer(type) {
    const bufferSize = audioCtx.sampleRate * 2;
    const buffer = audioCtx.createBuffer(1, bufferSize, audioCtx.sampleRate);
    const output = buffer.getChannelData(0);
    let lastOut = 0.0;

    for (let i = 0; i < bufferSize; i++) {
        const white = Math.random() * 2 - 1;
        if (type === 'rain') {
            output[i] = (lastOut + (0.02 * white)) / 1.02;
            lastOut = output[i];
            output[i] *= 3.5;
        } else {
            output[i] = white * 0.15;
        }
    }
    return buffer;
}

function playSynthAudio() {
    initAudioContext();
    if (audioCtx.state === 'suspended') {
        audioCtx.resume();
    }

    if (currentSourceNode) {
        try { currentSourceNode.stop(); } catch(e){}
    }

    const selected = audioSelect.value;
    if (selected === 'rain' || selected === 'white') {
        const buffer = createNoiseBuffer(selected);
        currentSourceNode = audioCtx.createBufferSource();
        currentSourceNode.buffer = buffer;
        currentSourceNode.loop = true;
        currentSourceNode.connect(gainNode);
        currentSourceNode.start();
    } else if (selected === 'lofi') {
        const osc = audioCtx.createOscillator();
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(220, audioCtx.currentTime);
        currentSourceNode = osc;
        currentSourceNode.connect(gainNode);
        currentSourceNode.start();
    }

    isAudioPlaying = true;
    updateAudioUI();
}

function stopSynthAudio() {
    if (currentSourceNode) {
        try { currentSourceNode.stop(); } catch(e){}
    }
    isAudioPlaying = false;
    updateAudioUI();
}

function updateAudioUI() {
    if (isAudioPlaying) {
        playIcon.className = 'ph ph-pause text-xl';
        audioBadge.textContent = 'Reproduciendo';
        audioBadge.className = 'text-[10px] px-2 py-0.5 rounded-md bg-emerald-100 text-emerald-800 font-medium border border-emerald-200';
    } else {
        playIcon.className = 'ph ph-play text-xl';
        audioBadge.textContent = 'Pausado';
        audioBadge.className = 'text-[10px] px-2 py-0.5 rounded-md bg-neutral-100 text-neutral-600 font-medium border border-neutral-200';
    }
}

if (playPauseAudioBtn) {
    playPauseAudioBtn.addEventListener('click', () => {
        if (isAudioPlaying) {
            stopSynthAudio();
        } else {
            playSynthAudio();
        }
    });
}

if (audioSelect) {
    audioSelect.addEventListener('change', () => {
        const trackNames = {
            'rain': '🌧️ Lluvia Suave & Café (Ruido Marrón)',
            'white': '📻 Ruido Blanco Constante',
            'lofi': '🎧 Generador Synth Ambient Chords'
        };
        audioTrackTitle.textContent = trackNames[audioSelect.value];
        if (isAudioPlaying) playSynthAudio();
    });
}

if (volumeSlider) {
    volumeSlider.addEventListener('input', (e) => {
        if (gainNode) gainNode.gain.value = parseFloat(e.target.value);
    });
}

// --- MÓDULO DE PROCESAMIENTO Y CARGA DE DOCUMENTOS ---
const dropZone = document.getElementById('dropZone');
const fileInput = document.getElementById('fileInput');
const textInput = document.getElementById('textInput');
const processBtn = document.getElementById('processBtn');
const clearBtn = document.getElementById('clearBtn');
const fileInfo = document.getElementById('fileInfo');
const fileName = document.getElementById('fileName');
const analysisOutput = document.getElementById('analysisOutput');
const detectedLangBadge = document.getElementById('detectedLangBadge');
const translationNotice = document.getElementById('translationNotice');

if (dropZone) {
    dropZone.addEventListener('click', () => fileInput.click());
    dropZone.addEventListener('dragover', (e) => {
        e.preventDefault();
        dropZone.classList.add('border-neutral-500', 'bg-neutral-100');
    });
    dropZone.addEventListener('dragleave', () => {
        dropZone.classList.remove('border-neutral-500', 'bg-neutral-100');
    });
    dropZone.addEventListener('drop', (e) => {
        e.preventDefault();
        dropZone.classList.remove('border-neutral-500', 'bg-neutral-100');
        if (e.dataTransfer.files.length > 0) {
            handleFileSelect(e.dataTransfer.files[0]);
        }
    });
}

if (fileInput) {
    fileInput.addEventListener('change', (e) => {
        if (e.target.files.length > 0) {
            handleFileSelect(e.target.files[0]);
        }
    });
}

function handleFileSelect(file) {
    fileName.textContent = `${file.name} (${(file.size / 1024).toFixed(1)} KB)`;
    fileInfo.classList.remove('hidden');

    const extension = file.name.split('.').pop().toLowerCase();
    
    if (extension === 'txt') {
        const reader = new FileReader();
        reader.onload = (evt) => { textInput.value = evt.target.result; };
        reader.readAsText(file);
    } else if (extension === 'pdf') {
        const reader = new FileReader();
        reader.onload = function() {
            const typedarray = new Uint8Array(this.result);
            pdfjsLib.getDocument(typedarray).promise.then(pdf => {
                let textPromise = [];
                for (let i = 1; i <= Math.min(pdf.numPages, 5); i++) {
                    textPromise.push(pdf.getPage(i).then(page => page.getTextContent().then(content => {
                        return content.items.map(s => s.str).join(' ');
                    })));
                }
                Promise.all(textPromise).then(pagesText => {
                    textInput.value = pagesText.join('\n\n');
                });
            });
        };
        reader.readAsArrayBuffer(file);
    } else if (extension === 'docx') {
        const reader = new FileReader();
        reader.onload = function(evt) {
            mammoth.extractRawText({ arrayBuffer: evt.target.result })
                .then(result => { textInput.value = result.value; });
        };
        reader.readAsArrayBuffer(file);
    }
}

if (clearBtn) {
    clearBtn.addEventListener('click', () => {
        textInput.value = '';
        fileInput.value = '';
        fileInfo.classList.add('hidden');
        translationNotice.classList.add('hidden');
        detectedLangBadge.textContent = 'Idioma: Esperando entrada...';
        analysisOutput.innerHTML = `
            <div class="h-full flex flex-col items-center justify-center text-center py-12 text-neutral-400 space-y-2">
                <i class="ph ph-article text-4xl"></i>
                <p>Carga o pega un texto para visualizar la detección de idioma, ideas clave y resumen estructurado.</p>
            </div>
        `;
        disableTTSButtons();
    });
}

if (processBtn) {
    processBtn.addEventListener('click', () => {
        const rawText = textInput.value.trim();
        if (!rawText) {
            alert('Por favor, ingresa o carga un texto para procesar.');
            return;
        }

        analysisOutput.innerHTML = `
            <div class="flex items-center justify-center py-12 text-neutral-600 gap-3">
                <i class="ph ph-spinner animate-spin text-2xl"></i>
                <span>Analizando documento y extrayendo ideas...</span>
            </div>
        `;

        setTimeout(() => {
            analyzeText(rawText);
        }, 800);
    });
}

function analyzeText(text) {
    const isEnglish = /\b(the|is|and|of|to|in|for|with|that|this)\b/i.test(text);
    const detectedLang = isEnglish ? 'Inglés (Traducido)' : 'Español';
    
    detectedLangBadge.textContent = `Idioma Detectado: ${detectedLang}`;
    
    if (isEnglish) {
        translationNotice.classList.remove('hidden');
    } else {
        translationNotice.classList.add('hidden');
    }

    const cleanText = text.replace(/\s+/g, ' ');
    const sentences = cleanText.split(/(?<=[.?!])\s+/).filter(s => s.trim().length > 15);
    
    const mainIdeas = sentences.slice(0, 2);
    const secondaryIdeas = sentences.slice(2, 5);

    const summaryText = sentences.length > 0 
        ? sentences.slice(0, Math.min(sentences.length, 6)).join(' ')
        : text;

    state.currentTextToRead = summaryText;

    analysisOutput.innerHTML = `
        <div class="space-y-4">
            <div class="bg-neutral-50 p-3.5 rounded-xl border border-neutral-200">
                <h4 class="font-bold text-neutral-800 text-xs uppercase tracking-wider mb-2 flex items-center gap-1.5">
                    <i class="ph ph-lightbulb text-amber-500 text-base"></i> Ideas Principales
                </h4>
                <ul class="list-disc list-inside space-y-1 text-xs text-neutral-700">
                    ${mainIdeas.map(idea => `<li>${idea}</li>`).join('') || '<li>Contenido analizado sintetizado.</li>'}
                </ul>
            </div>

            <div class="bg-neutral-50 p-3.5 rounded-xl border border-neutral-200">
                <h4 class="font-bold text-neutral-800 text-xs uppercase tracking-wider mb-2 flex items-center gap-1.5">
                    <i class="ph ph-list-plus text-blue-500 text-base"></i> Ideas Secundarias
                </h4>
                <ul class="list-disc list-inside space-y-1 text-xs text-neutral-700">
                    ${secondaryIdeas.length > 0 ? secondaryIdeas.map(idea => `<li>${idea}</li>`).join('') : '<li>Puntos de apoyo identificados en el texto.</li>'}
                </ul>
            </div>

            <div class="bg-neutral-50 p-3.5 rounded-xl border border-neutral-200">
                <h4 class="font-bold text-neutral-800 text-xs uppercase tracking-wider mb-2 flex items-center gap-1.5">
                    <i class="ph ph-file-text text-neutral-600 text-base"></i> Resumen Estructurado
                </h4>
                <p class="text-xs text-neutral-700 leading-relaxed">${summaryText}</p>
            </div>
        </div>
    `;

    enableTTSButtons();
}

// --- TEXT TO SPEECH (LECTOR DE VOZ ALTA) ---
const ttsPlayBtn = document.getElementById('ttsPlayBtn');
const ttsStopBtn = document.getElementById('ttsStopBtn');

function enableTTSButtons() {
    if (ttsPlayBtn && ttsStopBtn) {
        ttsPlayBtn.disabled = false;
        ttsStopBtn.disabled = false;
        ttsPlayBtn.classList.remove('text-neutral-400');
        ttsPlayBtn.classList.add('text-neutral-800', 'hover:bg-neutral-200');
    }
}

function disableTTSButtons() {
    if (ttsPlayBtn && ttsStopBtn) {
        ttsPlayBtn.disabled = true;
        ttsStopBtn.disabled = true;
        ttsPlayBtn.classList.add('text-neutral-400');
    }
}

if (ttsPlayBtn) {
    ttsPlayBtn.addEventListener('click', () => {
        if ('speechSynthesis' in window && state.currentTextToRead) {
            window.speechSynthesis.cancel();
            const utterance = new SpeechSynthesisUtterance(state.currentTextToRead);
            utterance.lang = 'es-ES';
            utterance.rate = 1;
            window.speechSynthesis.speak(utterance);
        }
    });
}

if (ttsStopBtn) {
    ttsStopBtn.addEventListener('click', () => {
        if ('speechSynthesis' in window) {
            window.speechSynthesis.cancel();
        }
    });
}

// --- TEMPORIZADOR Y BLOQUES POMODORO ---
let timerInterval = null;
let timerSeconds = 25 * 60;
let isTimerRunning = false;

const timerDisplay = document.getElementById('timerDisplay');
const startTimerBtn = document.getElementById('startTimerBtn');
const resetTimerBtn = document.getElementById('resetTimerBtn');
const timerPlayIcon = document.getElementById('timerPlayIcon');
const timerSubject = document.getElementById('timerSubject');
const timerModeBadge = document.getElementById('timerModeBadge');

const modeFocus = document.getElementById('modeFocus');
const modeShort = document.getElementById('modeShort');
const modeLong = document.getElementById('modeLong');

function updateTimerDisplay() {
    const mins = Math.floor(timerSeconds / 60);
    const secs = timerSeconds % 60;
    if (timerDisplay) {
        timerDisplay.textContent = `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
    }
}

function setTimerMode(seconds, badgeText) {
    clearInterval(timerInterval);
    isTimerRunning = false;
    timerSeconds = seconds;
    if (timerPlayIcon) timerPlayIcon.className = 'ph ph-play text-lg';
    if (timerModeBadge) timerModeBadge.textContent = badgeText;
    updateTimerDisplay();
}

if (modeFocus) modeFocus.addEventListener('click', () => setTimerMode(25 * 60, 'Bloque de Enfoque (25 min)'));
if (modeShort) modeShort.addEventListener('click', () => setTimerMode(5 * 60, 'Descanso Corto (5 min)'));
if (modeLong) modeLong.addEventListener('click', () => setTimerMode(15 * 60, 'Descanso Largo (15 min)'));

if (startTimerBtn) {
    startTimerBtn.addEventListener('click', () => {
        if (isTimerRunning) {
            clearInterval(timerInterval);
            isTimerRunning = false;
            timerPlayIcon.className = 'ph ph-play text-lg';
        } else {
            isTimerRunning = true;
            timerPlayIcon.className = 'ph ph-pause text-lg';
            timerInterval = setInterval(() => {
                if (timerSeconds > 0) {
                    timerSeconds--;
                    updateTimerDisplay();
                } else {
                    clearInterval(timerInterval);
                    isTimerRunning = false;
                    timerPlayIcon.className = 'ph ph-play text-lg';
                    
                    const subj = timerSubject.value;
                    state.studyTime[subj] = (state.studyTime[subj] || 0) + 25;
                    renderStudyStats();
                    alert(`¡Sesión completada! Se añadieron 25 min al área de ${subj}.`);
                }
            }, 1000);
        }
    });
}

if (resetTimerBtn) {
    resetTimerBtn.addEventListener('click', () => {
        setTimerMode(25 * 60, 'Bloque de Enfoque (25 min)');
    });
}

function renderStudyStats() {
    const container = document.getElementById('timeBySubjectList');
    if (!container) return;
    container.innerHTML = Object.entries(state.studyTime).map(([subj, mins]) => {
        const hours = (mins / 60).toFixed(1);
        return `
            <div class="flex items-center justify-between pt-2">
                <span class="font-medium text-neutral-700">${subj}</span>
                <span class="font-mono bg-neutral-100 border border-neutral-200 px-2 py-0.5 rounded text-neutral-800">${hours} hrs (${mins} min)</span>
            </div>
        `;
    }).join('');
}

// --- GESTIÓN DE TAREAS Y DIFICULTAD ---
const taskForm = document.getElementById('taskForm');
const tasksContainer = document.getElementById('tasksContainer');
const sortSelect = document.getElementById('sortSelect');

if (taskForm) {
    taskForm.addEventListener('submit', (e) => {
        e.preventDefault();
        const newTask = {
            id: Date.now(),
            title: document.getElementById('taskTitle').value,
            subject: document.getElementById('taskSubject').value,
            difficulty: parseInt(document.getElementById('taskDifficulty').value),
            dueDate: document.getElementById('taskDueDate').value,
            completed: false
        };
        state.tasks.push(newTask);
        taskForm.reset();
        renderTasks();
    });
}

if (sortSelect) {
    sortSelect.addEventListener('change', () => {
        renderTasks();
    });
}

function getDifficultyBadge(diff) {
    const badges = {
        1: { text: 'Nivel 1 - Muy Fácil', class: 'bg-emerald-50 text-emerald-700 border-emerald-200' },
        2: { text: 'Nivel 2 - Fácil', class: 'bg-green-50 text-green-700 border-green-200' },
        3: { text: 'Nivel 3 - Intermedio', class: 'bg-amber-50 text-amber-700 border-amber-200' },
        4: { text: 'Nivel 4 - Difícil', class: 'bg-orange-50 text-orange-700 border-orange-200' },
        5: { text: 'Nivel 5 - Muy Difícil', class: 'bg-rose-50 text-rose-700 border-rose-200' }
    };
    return badges[diff] || badges[3];
}

function renderTasks(searchQuery = '') {
    if (!tasksContainer) return;
    let filteredTasks = [...state.tasks];

    if (searchQuery) {
        filteredTasks = filteredTasks.filter(task => 
            task.title.toLowerCase().includes(searchQuery) || 
            task.subject.toLowerCase().includes(searchQuery)
        );
    }

    const sortOrder = sortSelect ? sortSelect.value : 'none';
    if (sortOrder === 'asc') {
        filteredTasks.sort((a, b) => a.difficulty - b.difficulty);
    } else if (sortOrder === 'desc') {
        filteredTasks.sort((a, b) => b.difficulty - a.difficulty);
    }

    if (filteredTasks.length === 0) {
        tasksContainer.innerHTML = `
            <div class="bg-white rounded-2xl border border-neutral-200 p-8 text-center text-neutral-400 space-y-2">
                <i class="ph ph-check-circle text-4xl"></i>
                <p class="text-sm">No se encontraron tareas coincidentes.</p>
            </div>
        `;
        return;
    }

    tasksContainer.innerHTML = filteredTasks.map(task => {
        const diffBadge = getDifficultyBadge(task.difficulty);
        return `
            <div class="bg-white border border-neutral-200 rounded-2xl p-4 shadow-sm flex items-center justify-between gap-4 transition-all hover:border-neutral-300">
                <div class="flex items-center gap-3">
                    <button onclick="toggleTask(${task.id})" class="w-5 h-5 rounded-md border border-neutral-300 flex items-center justify-center ${task.completed ? 'bg-neutral-900 border-neutral-900 text-white' : 'hover:border-neutral-500'}">
                        ${task.completed ? '<i class="ph ph-check text-xs"></i>' : ''}
                    </button>
                    <div>
                        <h4 class="text-xs sm:text-sm font-semibold ${task.completed ? 'line-through text-neutral-400' : 'text-neutral-900'}">${task.title}</h4>
                        <div class="flex items-center gap-2 mt-1">
                            <span class="text-[10px] font-medium px-2 py-0.5 bg-neutral-100 text-neutral-600 rounded-md border border-neutral-200">${task.subject}</span>
                            <span class="text-[10px] font-medium px-2 py-0.5 rounded-md border ${diffBadge.class}">${diffBadge.text}</span>
                            <span class="text-[10px] text-neutral-400 flex items-center gap-1"><i class="ph ph-calendar-blank"></i> ${task.dueDate}</span>
                        </div>
                    </div>
                </div>
                <button onclick="deleteTask(${task.id})" class="text-neutral-400 hover:text-rose-600 p-1 transition-colors">
                    <i class="ph ph-trash text-base"></i>
                </button>
            </div>
        `;
    }).join('');
}

window.toggleTask = function(id) {
    const task = state.tasks.find(t => t.id === id);
    if (task) {
        task.completed = !task.completed;
        renderTasks(globalSearchInput ? globalSearchInput.value.trim().toLowerCase() : '');
    }
};

window.deleteTask = function(id) {
    state.tasks = state.tasks.filter(t => t.id !== id);
    renderTasks(globalSearchInput ? globalSearchInput.value.trim().toLowerCase() : '');
};

// --- MÉTRICAS Y RESULTADOS DEL FOOTER ---
function renderFooterMetrics() {
    const container = document.getElementById('footerMetricsGrid');
    if (!container) return;
    container.innerHTML = state.subjectMetrics.map(item => `
        <div class="bg-neutral-800/80 border border-neutral-700/60 rounded-2xl p-5 space-y-3">
            <div class="flex items-center justify-between">
                <span class="text-sm font-bold text-white">${item.subject}</span>
                <span class="text-[11px] font-medium px-2 py-0.5 rounded bg-neutral-700 text-neutral-300">Retención: ${item.comprehension}%</span>
            </div>
            
            <div class="space-y-1">
                <div class="flex justify-between text-xs text-neutral-400">
                    <span>Comprensión percibida</span>
                    <span>${item.comprehension}%</span>
                </div>
                <div class="w-full bg-neutral-700 rounded-full h-2 overflow-hidden">
                    <div class="bg-blue-500 h-2 rounded-full" style="width: ${item.comprehension}%"></div>
                </div>
            </div>

            <div class="flex items-center justify-between text-xs text-neutral-400 pt-1">
                <span>Sesiones de Enfoque: <strong class="text-neutral-200">${item.sessionsCompleted}</strong></span>
                <span>Grado: <strong class="text-emerald-400">${item.focusScore}</strong></span>
            </div>
        </div>
    `).join('');
}

// --- INICIALIZACIÓN GENERAL ---
window.addEventListener('DOMContentLoaded', () => {
    renderStudyStats();
    renderTasks();
    renderFooterMetrics();
});