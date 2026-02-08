document.addEventListener('DOMContentLoaded', () => {
    // ==========================================
    // 1. 全域變數
    // ==========================================
    const STORAGE_KEY = 'wesing_music_data_v25';
    let appData = { currentId: null, songs: [] };
    let currentInstrument = 'sine';
    let currentTempo = 100;
    let currentBaseKey = 0; 
    let currentTranspose = 0;

    // DOM Elements
    const codeInput = document.getElementById('code-input');
    const fontOutput = document.getElementById('font-output');
    const titleInput = document.getElementById('doc-title');
    const songListEl = document.getElementById('song-list');
    const playToggleBtn = document.getElementById('play-toggle-btn');
    const toggleToolbarBtn = document.getElementById('toggle-toolbar-btn');
    const quickToolbar = document.getElementById('quick-toolbar');
    
    // Setting Inputs
    const tempoInput = document.getElementById('tempo-input');
    const baseKeySelect = document.getElementById('base-key-select');
    const transposeValueEl = document.getElementById('transpose-value');
    const keyNameEl = document.getElementById('key-name-display');

    // Modal Control
    const modalOverlay = document.getElementById('confirm-modal');
    const modalTitle = document.getElementById('modal-title');
    const modalMessage = document.getElementById('modal-message');
    const modalConfirmBtn = document.getElementById('modal-confirm-btn');
    const modalCancelBtn = document.getElementById('modal-cancel-btn');
    let currentConfirmCallback = null;

    function showConfirm(title, message, onConfirm) {
        if(!modalOverlay) return;
        modalTitle.textContent = title;
        modalMessage.textContent = message;
        currentConfirmCallback = onConfirm;
        modalOverlay.classList.add('show');
    }

    function closeConfirm() {
        if(!modalOverlay) return;
        modalOverlay.classList.remove('show');
        currentConfirmCallback = null;
    }

    if(modalCancelBtn) modalCancelBtn.addEventListener('click', closeConfirm);
    if(modalConfirmBtn) modalConfirmBtn.addEventListener('click', () => {
        if (currentConfirmCallback) currentConfirmCallback();
        closeConfirm();
    });
    if(modalOverlay) modalOverlay.addEventListener('click', (e) => {
        if (e.target === modalOverlay) closeConfirm();
    });

    // ==========================================
    // 2. 資料管理
    // ==========================================
    function loadData() {
        const stored = localStorage.getItem(STORAGE_KEY);
        if (stored) {
            try { appData = JSON.parse(stored); } 
            catch (e) { console.error("Data Reset", e); }
        }
        if (appData.songs.length === 0) {
            createNewSong("未命名樂譜", "");
        } else {
            const emptySong = appData.songs.find(s => s.title === "未命名樂譜" && s.content === "");
            if(!appData.currentId) {
                appData.currentId = emptySong ? emptySong.id : appData.songs[0].id;
            }
        }
    }

    function saveData() {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(appData));
    }

    function generateId() {
        return Date.now().toString(36) + Math.random().toString(36).substr(2);
    }

    function getCurrentSong() {
        return appData.songs.find(s => s.id === appData.currentId);
    }

    function createNewSong(title = "未命名樂譜", content = "") {
        const existingEmpty = appData.songs.find(s => s.title === title && s.content === "");
        if (existingEmpty) {
            switchSong(existingEmpty.id);
            return existingEmpty;
        }

        const newSong = { 
            id: generateId(), 
            title: title, 
            content: content, 
            lastModified: Date.now(),
            tempo: 100,
            instrument: 'sine',
            baseKey: 0,
            transpose: 0
        };
        appData.songs.unshift(newSong);
        appData.currentId = newSong.id;
        saveData();
        renderAll();
        return newSong;
    }

    function updateCurrentSongSettings() {
        const song = getCurrentSong();
        if (song) {
            song.tempo = currentTempo;
            song.instrument = currentInstrument;
            song.baseKey = currentBaseKey;
            song.transpose = currentTranspose;
            saveData();
        }
    }

    function deleteSong(id, event) {
        event.stopPropagation();
        showConfirm("刪除樂譜", "確定要刪除這首樂譜嗎？刪除後無法復原。", () => {
            appData.songs = appData.songs.filter(s => s.id !== id);
            if (appData.songs.length === 0) createNewSong();
            else if (id === appData.currentId) appData.currentId = appData.songs[0].id;
            saveData();
            renderAll();
        });
    }

    // ==========================================
    // 3. 音訊引擎
    // ==========================================
    let audioCtx;
    let isPlaying = false;
    let activeOscillators = []; 
    let activeTimers = []; 
    
    const keyNames = ['C', 'C#', 'D', 'Eb', 'E', 'F', 'F#', 'G', 'G#', 'A', 'Bb', 'B'];

    const relFreqs = {
        '1': 261.63, '2': 293.66, '3': 329.63, '4': 349.23, 
        '5': 392.00, '6': 440.00, '7': 493.88
    };

    async function initAudio() {
        if (!audioCtx) {
            audioCtx = new (window.AudioContext || window.webkitAudioContext)();
        }
        if (audioCtx.state === 'suspended') {
            await audioCtx.resume();
        }
    }

    function playTone(freq, startTime, duration, type) {
        if (!audioCtx) return;
        const osc = audioCtx.createOscillator();
        const gain = audioCtx.createGain();
        osc.type = type;
        osc.frequency.value = freq;
        
        const now = startTime;
        gain.gain.setValueAtTime(0, now);
        
        if (type === 'sawtooth') { 
            gain.gain.linearRampToValueAtTime(0.3, now + 0.1); 
            gain.gain.linearRampToValueAtTime(0, now + duration);
        } else if (type === 'square') { 
            gain.gain.setValueAtTime(0.1, now);
            gain.gain.setValueAtTime(0.1, now + duration - 0.01);
            gain.gain.linearRampToValueAtTime(0, now + duration);
        } else if (type === 'triangle') { 
            gain.gain.linearRampToValueAtTime(0.4, now + 0.05); 
            gain.gain.setValueAtTime(0.4, now + duration - 0.05);
            gain.gain.linearRampToValueAtTime(0, now + duration);
        } else { 
            gain.gain.linearRampToValueAtTime(0.5, now + 0.02); 
            gain.gain.exponentialRampToValueAtTime(0.01, now + duration);
        }
        
        osc.connect(gain);
        gain.connect(audioCtx.destination);
        
        osc.start(startTime);
        osc.stop(startTime + duration);
        activeOscillators.push(osc);
    }

    // ==========================================
    // 4. 解析與播放邏輯
    // ==========================================
    function parseScore(text) {
        const parts = text.split(/(\s+)/);
        let notes = [];
        let inputIdx = 0;
        let pendingAccidental = 0; 

        parts.forEach(part => {
            const token = part;
            const inputLen = token.length;
            const cleanStr = token.trim();
            
            if (!cleanStr) {
                inputIdx += inputLen;
                return;
            }

            // 修正：檢查是否為和弦（字母開頭，且不是單獨的 b/z）
            // 如果是和弦 (如 G7, Dm)，則視為不播放的符號
            if ((token.match(/^[a-zA-Z]/) && cleanStr !== 'b' && cleanStr !== 'z') || token.includes('|') || token.includes(')')) {
                inputIdx += inputLen;
                return;
            }

            if (cleanStr === 'b') {
                pendingAccidental = -1;
                inputIdx += inputLen;
                return;
            }
            if (cleanStr === '#') {
                pendingAccidental = 1;
                inputIdx += inputLen;
                return;
            }
            if (cleanStr === 'z') {
                pendingAccidental = 0;
                inputIdx += inputLen;
                return;
            }

            let note = {
                token: token,
                freq: 0,
                duration: 1, 
                inputStart: inputIdx,
                inputEnd: inputIdx + inputLen,
                isRest: false,
                isExtension: cleanStr === '-',
                isTieStart: token.includes('('), 
                play: true,
                visualDuration: 1,
                type: 'note'
            };

            if (note.isExtension || note.isTieStart) {
                note.play = false; 
                note.duration = (note.isExtension) ? 1 : 0;
                note.visualDuration = note.duration;
            } else {
                const cleanToken = token.replace(/[\(\/]/g, '').trim(); 
                const numMatch = cleanToken.match(/[0-7]/);

                if (numMatch) {
                    const num = numMatch[0];
                    if (num === '0') {
                        note.isRest = true;
                        pendingAccidental = 0;
                    } else {
                        let freq = relFreqs[num];
                        const prefix = cleanToken.substring(0, numMatch.index);
                        const suffix = cleanToken.substring(numMatch.index + 1);

                        if (pendingAccidental === -1) freq *= Math.pow(2, -1/12);
                        if (pendingAccidental === 1) freq *= Math.pow(2, 1/12);
                        pendingAccidental = 0;

                        if (prefix.includes('b')) freq *= Math.pow(2, -1/12);
                        if (prefix.includes('#')) freq *= Math.pow(2, 1/12);
                        
                        if (prefix.includes(':')) freq *= 4;
                        else if (prefix.includes('.')) freq *= 2;
                        if (suffix.includes(':')) freq /= 4;
                        else if (suffix.includes('.')) freq /= 2;

                        note.freq = freq;
                    }
                } else {
                    inputIdx += inputLen;
                    return;
                }

                const slashCount = (token.match(/\//g) || []).length;
                if (slashCount > 0) note.duration = 1 / Math.pow(2, slashCount);
            }
            
            note.visualDuration = note.duration; 
            notes.push(note);
            inputIdx += inputLen;
        });

        // Tie Logic
        let processedNotes = [];
        for (let i = 0; i < notes.length; i++) {
            let curr = notes[i];
            if (curr.isExtension) {
                let prevPlayable = null;
                for (let k = processedNotes.length - 1; k >= 0; k--) {
                    let p = processedNotes[k];
                    if (p.play && !p.isRest && p.type === 'note') {
                        prevPlayable = p;
                        break;
                    }
                }
                if (prevPlayable) {
                    prevPlayable.duration += 1; 
                }
                curr.play = false;
                processedNotes.push(curr);
                continue;
            }

            if (curr.isTieStart) {
                let prevNote = null;
                for (let k = processedNotes.length - 1; k >= 0; k--) {
                    let p = processedNotes[k];
                    if (p.play && !p.isRest && p.type === 'note') {
                        prevNote = p;
                        break;
                    }
                }
                let nextNoteIndex = -1;
                for (let k = i + 1; k < notes.length; k++) {
                    let n = notes[k];
                    if (n.type === 'note' && !n.isExtension && !n.isTieStart && !n.isRest) {
                        nextNoteIndex = k;
                        break;
                    }
                }
                if (prevNote && nextNoteIndex !== -1) {
                    let nextNote = notes[nextNoteIndex];
                    if (Math.abs(prevNote.freq - nextNote.freq) < 0.1) {
                        prevNote.duration += nextNote.duration; 
                        nextNote.play = false; 
                    }
                }
                curr.play = false; 
                processedNotes.push(curr);
                continue;
            }
            processedNotes.push(curr);
        }
        return processedNotes;
    }

    async function playMusic() {
        stopMusic();
        await initAudio();
        
        isPlaying = true;
        updatePlayButtonUI('play');

        const tempo = parseInt(tempoInput.value) || 100;
        const beatTime = 60 / tempo;
        const notes = parseScore(codeInput.value);
        
        if (notes.length === 0) {
            isPlaying = false;
            updatePlayButtonUI('stop');
            return;
        }

        let startIndex = 0;
        let cursorTarget = codeInput.selectionStart;
        let found = false;
        for (let i = 0; i < notes.length; i++) {
            if (cursorTarget <= notes[i].inputEnd) {
                startIndex = i;
                found = true;
                break;
            }
        }
        if (!found && cursorTarget >= codeInput.value.length) {
             startIndex = 0; 
        }

        let currentTime = audioCtx.currentTime + 0.1;
        let visualTimeCursor = currentTime; 
        let endTime = 0;
        let lastNote = null;

        const totalShift = currentBaseKey + currentTranspose;
        const pitchFactor = Math.pow(2, totalShift / 12);

        notes.slice(startIndex).forEach((note) => {
            const visualDurSec = note.visualDuration * beatTime;
            const audioDurSec = note.duration * beatTime;

            if (note.play && !note.isRest && note.freq > 0) {
                const finalFreq = note.freq * pitchFactor;
                playTone(finalFreq, visualTimeCursor, audioDurSec, currentInstrument);
            }

            const timer = setTimeout(() => {
                if (!isPlaying) return;
                highlightInput(note.inputStart, note.inputEnd);
            }, (visualTimeCursor - audioCtx.currentTime) * 1000);
            
            activeTimers.push(timer);
            visualTimeCursor += visualDurSec;
            endTime = visualTimeCursor;
            lastNote = note;
        });

        const endTimer = setTimeout(() => {
            stopMusic();
            if (lastNote && codeInput) {
                const rawVal = codeInput.value;
                let targetPos = lastNote.inputEnd;
                while (targetPos < rawVal.length && /\s/.test(rawVal[targetPos])) {
                    targetPos++;
                }
                codeInput.setSelectionRange(targetPos, targetPos);
                codeInput.focus();
            }
        }, (endTime - audioCtx.currentTime) * 1000 + 200);
        activeTimers.push(endTimer);
    }

    function highlightInput(start, end) {
        codeInput.focus();
        codeInput.setSelectionRange(start, end, 'forward');
        const fullText = codeInput.value;
        const subText = fullText.substring(0, start);
        const lines = subText.split('\n').length;
        const lineHeight = 30; 
        codeInput.scrollTop = (lines - 2) * lineHeight;
    }

    function stopMusic() {
        isPlaying = false;
        updatePlayButtonUI('stop');
        if (audioCtx) {
            audioCtx.close().then(() => {
                audioCtx = new (window.AudioContext || window.webkitAudioContext)();
            });
        }
        activeTimers.forEach(t => clearTimeout(t));
        activeTimers = [];
        activeOscillators = [];
        if(codeInput) {
            codeInput.setSelectionRange(codeInput.selectionStart, codeInput.selectionStart);
        }
    }

    function updatePlayButtonUI(state) {
        if (!playToggleBtn) return;
        const iconPlay = playToggleBtn.querySelector('.icon-play');
        const iconStop = playToggleBtn.querySelector('.icon-stop');
        if (state === 'play') {
            playToggleBtn.classList.add('playing');
            iconPlay.style.display = 'none';
            iconStop.style.display = 'block';
        } else {
            playToggleBtn.classList.remove('playing');
            iconPlay.style.display = 'block';
            iconStop.style.display = 'none';
        }
    }

    function updateTransposeUI() {
        if(transposeValueEl) transposeValueEl.textContent = (currentTranspose > 0 ? '+' : '') + currentTranspose;
        if(keyNameEl) {
            let idx = (currentBaseKey + currentTranspose) % 12;
            if(idx < 0) idx += 12;
            keyNameEl.textContent = keyNames[idx];
        }
    }

    // ==========================================
    // 5. Score Transposition
    // ==========================================
    function transposeText(direction) {
        const raw = codeInput.value;
        const parts = raw.split(/(\s+)/);
        let newParts = [];
        let pendingAcc = 0; 

        for(let i=0; i<parts.length; i++) {
            let token = parts[i];
            let clean = token.trim();
            
            // 跳過非音符或和弦
            if(!clean || (token.match(/^[a-zA-Z]/) && clean !== 'b' && clean !== 'z') || token.includes('|') || token.includes(')') || token.includes('(') || token.includes('-')) {
                newParts.push(token);
                continue;
            }

            if (clean === 'b') { 
                pendingAcc = -1; 
                if (i + 1 < parts.length && /^\s+$/.test(parts[i+1])) {
                    i++; // Skip space after accidental
                }
                continue; 
            }
            if (clean === '#') { 
                pendingAcc = 1; 
                if (i + 1 < parts.length && /^\s+$/.test(parts[i+1])) {
                    i++; 
                }
                continue; 
            }
            if (clean === 'z') { 
                pendingAcc = 0; 
                if (i + 1 < parts.length && /^\s+$/.test(parts[i+1])) {
                    i++; 
                }
                continue; 
            }

            const numMatch = clean.match(/[0-7]/);
            if(numMatch) {
                const digit = parseInt(numMatch[0]);
                if(digit === 0) { 
                    newParts.push(token); 
                    pendingAcc = 0;
                    continue;
                }

                let prefix = clean.substring(0, numMatch.index);
                let suffix = clean.substring(numMatch.index + 1);
                
                let octave = 0;
                const count = (str, char) => str.split(char).length - 1;
                octave += count(prefix, '.') * 1;
                octave += count(prefix, ':') * 2;
                octave -= count(suffix, '.') * 1;
                octave -= count(suffix, ':') * 2;

                let acc = pendingAcc;
                if(prefix.includes('b')) acc = -1;
                if(prefix.includes('#')) acc = 1;
                
                const noteToSemi = [null, 0, 2, 4, 5, 7, 9, 11];
                let semi = noteToSemi[digit];
                
                semi += acc;
                semi += direction; 
                
                let newOctave = octave + Math.floor(semi / 12);
                let newSemi = (semi % 12 + 12) % 12;
                
                const semiToNote = [
                    {n:1, a:0}, {n:1, a:1}, {n:2, a:0}, {n:3, a:-1}, {n:3, a:0},
                    {n:4, a:0}, {n:4, a:1}, {n:5, a:0}, {n:6, a:-1}, {n:6, a:0},
                    {n:7, a:-1}, {n:7, a:0}
                ];
                
                let mapped = semiToNote[newSemi];
                let newDigit = mapped.n;
                let newAcc = mapped.a; 

                // 組合升降記號 (含空格)
                if(newAcc === 1) newParts.push("# ");
                if(newAcc === -1) newParts.push("b ");
                
                let newPrefix = "";
                if(newOctave > 0) {
                    let d2 = Math.floor(newOctave / 2);
                    let d1 = newOctave % 2;
                    newPrefix += ":".repeat(d2) + ".".repeat(d1);
                }
                
                let newSuffix = "";
                let durationChars = token.match(/[\/]+/); 
                let durationStr = durationChars ? durationChars[0] : "";
                
                if(newOctave < 0) {
                    let abs = Math.abs(newOctave);
                    let d2 = Math.floor(abs / 2);
                    let d1 = abs % 2;
                    newSuffix += ":".repeat(d2) + ".".repeat(d1);
                }
                newSuffix += durationStr;

                newParts.push(newPrefix + newDigit + newSuffix);
                pendingAcc = 0;
            } else {
                newParts.push(token);
            }
        }
        
        codeInput.value = newParts.join("");
        
        currentBaseKey = (currentBaseKey + direction + 12) % 12;
        baseKeySelect.value = currentBaseKey;
        
        codeInput.dispatchEvent(new Event('input'));
        updateCurrentSongSettings();
        updateTransposeUI();
    }

    // ==========================================
    // UI Events
    // ==========================================
    if (playToggleBtn) {
        playToggleBtn.addEventListener('click', () => {
            if (isPlaying) stopMusic();
            else playMusic();
        });
    }

    const settingsBtn = document.getElementById('settings-trigger-btn');
    const settingsPopover = document.getElementById('settings-popover');
    
    if (settingsBtn && settingsPopover) {
        settingsBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            settingsPopover.classList.toggle('show');
            if (window.innerWidth <= 768) {
                const actionPanel = settingsBtn.closest('.panel-actions');
                if(actionPanel) {
                    if (settingsPopover.classList.contains('show')) {
                        actionPanel.style.overflowX = 'visible';
                    } else {
                        actionPanel.style.overflowX = 'auto';
                    }
                }
            }
            renderInstrumentList();
            updateTransposeUI();
        });

        document.addEventListener('click', (e) => {
            if (!settingsPopover.contains(e.target) && !settingsBtn.contains(e.target)) {
                settingsPopover.classList.remove('show');
                if (window.innerWidth <= 768) {
                    const actionPanel = settingsBtn.closest('.panel-actions');
                    if(actionPanel) actionPanel.style.overflowX = 'auto';
                }
            }
        });
    }

    const instruments = [
        { id: 'sine', name: '🎹 鋼琴', val: 'sine', icon: '🎹' },
        { id: 'triangle', name: '🎵 長笛', val: 'triangle', icon: '🎵' },
        { id: 'square', name: '🕹️ 8-Bit', val: 'square', icon: '🕹️' },
        { id: 'sawtooth', name: '🌊 合成器', val: 'sawtooth', icon: '🌊' }
    ];
    
    function renderInstrumentList() {
        const list = document.getElementById('instrument-list');
        if(!list) return;
        list.innerHTML = '';
        instruments.forEach(inst => {
            const div = document.createElement('div');
            const isSelected = currentInstrument === inst.val && 
                               document.getElementById('current-inst-icon').textContent === inst.icon;
            div.className = `inst-option ${isSelected ? 'selected' : ''}`;
            div.innerHTML = `${inst.name} <span class="inst-check">✓</span>`;
            div.onclick = () => {
                currentInstrument = inst.val;
                document.getElementById('current-inst-icon').textContent = inst.icon;
                updateCurrentSongSettings();
                renderInstrumentList();
            };
            list.appendChild(div);
        });
    }

    document.getElementById('tempo-minus').addEventListener('click', () => {
        tempoInput.value = Math.max(40, parseInt(tempoInput.value) - 1);
        currentTempo = parseInt(tempoInput.value);
        updateCurrentSongSettings();
    });
    document.getElementById('tempo-plus').addEventListener('click', () => {
        tempoInput.value = Math.min(240, parseInt(tempoInput.value) + 1);
        currentTempo = parseInt(tempoInput.value);
        updateCurrentSongSettings();
    });
    tempoInput.addEventListener('change', () => {
        currentTempo = parseInt(tempoInput.value);
        updateCurrentSongSettings();
    });

    baseKeySelect.addEventListener('change', () => {
        currentBaseKey = parseInt(baseKeySelect.value);
        updateTransposeUI();
        updateCurrentSongSettings();
    });

    document.getElementById('transpose-minus').addEventListener('click', () => {
        currentTranspose = Math.max(-12, currentTranspose - 1);
        updateTransposeUI();
        updateCurrentSongSettings();
    });
    document.getElementById('transpose-plus').addEventListener('click', () => {
        currentTranspose = Math.min(12, currentTranspose + 1);
        updateTransposeUI();
        updateCurrentSongSettings();
    });

    document.getElementById('score-transpose-down').addEventListener('click', () => transposeText(-1));
    document.getElementById('score-transpose-up').addEventListener('click', () => transposeText(1));

    function renderAll() {
        renderSidebar();
        renderEditor();
    }

    function renderEditor() {
        const song = getCurrentSong();
        if (!song) return;
        
        titleInput.value = song.title;
        codeInput.value = song.content;
        
        currentTempo = song.tempo || 100;
        currentInstrument = song.instrument || 'sine';
        currentBaseKey = song.baseKey || 0;
        currentTranspose = song.transpose || 0;
        
        tempoInput.value = currentTempo;
        baseKeySelect.value = currentBaseKey;
        updateTransposeUI();
        
        const instObj = instruments.find(i => i.val === currentInstrument) || instruments[0];
        document.getElementById('current-inst-icon').textContent = instObj.icon;

        fontOutput.value = convertCodeToFont(song.content);
    }

    function renderSidebar() {
        songListEl.innerHTML = '';
        appData.songs.forEach(song => {
            const div = document.createElement('div');
            div.className = `song-item ${song.id === appData.currentId ? 'active' : ''}`;
            div.innerHTML = `
                <span style="overflow:hidden; text-overflow:ellipsis; white-space:nowrap; flex:1;">${song.title.trim() || "未命名樂譜"}</span>
                <button class="delete-song-btn" title="刪除">
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="3 6 5 6 21 6"></polyline><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path></svg>
                </button>
            `;
            div.onclick = () => switchSong(song.id);
            div.querySelector('.delete-song-btn').onclick = (e) => deleteSong(song.id, e);
            songListEl.appendChild(div);
        });
    }

    function switchSong(id) {
        appData.currentId = id;
        saveData();
        renderAll();
        if (window.innerWidth <= 768) toggleSidebar(false);
    }

    codeInput.addEventListener('input', (e) => {
        const song = getCurrentSong();
        if (song) {
            song.content = e.target.value;
            saveData();
            fontOutput.value = convertCodeToFont(song.content);
        }
    });

    fontOutput.addEventListener('input', (e) => {
        const song = getCurrentSong();
        if (song) {
            const convertedCode = convertFontToCode(e.target.value);
            song.content = convertedCode;
            saveData();
            codeInput.value = convertedCode;
        }
    });

    titleInput.addEventListener('input', (e) => {
        const song = getCurrentSong();
        if (song) {
            song.title = e.target.value;
            saveData();
            renderSidebar();
        }
    });

    document.getElementById('new-song-btn').addEventListener('click', () => {
        createNewSong();
        if (window.innerWidth <= 768) toggleSidebar(false);
        setTimeout(() => titleInput.focus(), 100);
    });

    const setupClearBtn = (id, type) => {
        const btn = document.getElementById(id);
        if(!btn) return;
        btn.addEventListener('click', () => {
            const val = type === 'input' ? codeInput.value : fontOutput.value;
            if (!val) return;
            showConfirm("清除內容", "確定清空？", () => {
                const song = getCurrentSong();
                song.content = ''; codeInput.value = ''; fontOutput.value = ''; saveData();
            });
        });
    };
    setupClearBtn('clear-input-btn', 'input');
    setupClearBtn('clear-output-btn', 'output');

    const setupCopyBtn = (id, targetId) => {
        const btn = document.getElementById(id);
        if(!btn) return;
        btn.addEventListener('click', () => {
            const el = document.getElementById(targetId);
            el.select(); navigator.clipboard.writeText(el.value);
        });
    };
    setupCopyBtn('copy-input-btn', 'code-input');
    setupCopyBtn('copy-output-btn', 'font-output');

    const togglePanelBtns = document.querySelectorAll('.toggle-panel-btn');
    togglePanelBtns.forEach(btn => {
        btn.addEventListener('click', () => togglePanel(btn.dataset.target));
    });

    function togglePanel(panelId) {
        const panel = document.getElementById(panelId);
        const otherPanelId = panelId === 'panel-input' ? 'panel-output' : 'panel-input';
        const otherPanel = document.getElementById(otherPanelId);
        if (otherPanel.classList.contains('collapsed')) {
            otherPanel.classList.remove('collapsed');
            panel.classList.add('collapsed');
        } else {
            panel.classList.toggle('collapsed');
        }
    }

    const sidebar = document.getElementById('sidebar');
    const overlay = document.getElementById('overlay');
    const menuBtn = document.getElementById('menu-btn');
    const layoutBtn = document.getElementById('layout-btn');
    const workspace = document.getElementById('workspace');

    function toggleSidebar(forceState) {
        const isMobile = window.innerWidth <= 768;
        if (isMobile) {
            const isOpen = typeof forceState === 'boolean' ? forceState : !sidebar.classList.contains('open');
            sidebar.classList.toggle('open', isOpen);
            overlay.classList.toggle('show', isOpen);
        } else {
            const isCollapsed = typeof forceState === 'boolean' ? !forceState : !sidebar.classList.contains('collapsed');
            sidebar.classList.toggle('collapsed', isCollapsed);
        }
    }

    if(menuBtn) menuBtn.addEventListener('click', () => toggleSidebar());
    if(overlay) overlay.addEventListener('click', () => toggleSidebar(false));
    if(layoutBtn) layoutBtn.addEventListener('click', () => {
        workspace.classList.toggle('layout-horizontal');
        workspace.classList.toggle('layout-vertical');
    });

    if(toggleToolbarBtn) {
        toggleToolbarBtn.addEventListener('click', () => {
            quickToolbar.classList.toggle('hidden');
            if (quickToolbar.classList.contains('hidden')) {
                toggleToolbarBtn.classList.remove('active');
            } else {
                toggleToolbarBtn.classList.add('active');
            }
        });
    }

    // Mapping Data
    const mappingData = [
        { font: "", code: ". " }, { font: "", code: "0 " }, { font: "", code: "1 " }, { font: "", code: "2 " },
        { font: "", code: "3 " }, { font: "", code: "4 " }, { font: "", code: "5 " }, { font: "", code: "6 " },
        { font: "", code: "7 " }, { font: "", code: "0/ " }, { font: "", code: "1/ " }, { font: "", code: "2/ " },
        { font: "", code: "3/ " }, { font: "", code: "4/ " }, { font: "", code: "5/ " }, { font: "", code: "6/ " },
        { font: "", code: "7/ " }, { font: "", code: "./ " }, { font: "", code: "0// " }, { font: "", code: "1// " },
        { font: "", code: "2// " }, { font: "", code: "3// " }, { font: "", code: "4// " }, { font: "", code: "5// " },
        { font: "", code: "6// " }, { font: "", code: "7// " }, { font: "", code: ".// " }, { font: "", code: "0/// " },
        { font: "", code: "1/// " }, { font: "", code: "2/// " }, { font: "", code: "3/// " }, { font: "", code: "4/// " },
        { font: "", code: "5/// " }, { font: "", code: "6/// " }, { font: "", code: "7/// " }, { font: "", code: "./// " },
        { font: "", code: "1. " }, { font: "", code: "2. " }, { font: "", code: "3. " }, { font: "", code: "4. " },
        { font: "", code: "5. " }, { font: "", code: "6. " }, { font: "", code: "7. " }, { font: "", code: ".1 " },
        { font: "", code: ".2 " }, { font: "", code: ".3 " }, { font: "", code: ".4 " }, { font: "", code: ".5 " },
        { font: "", code: ".6 " }, { font: "", code: ".7 " }, 
        { font: "", codes: ["1./ ", "1/. "] }, 
        { font: "", codes: ["2./ ", "2/. "] },
        { font: "", codes: ["3./ ", "3/. "] },
        { font: "", codes: ["4./ ", "4/. "] },
        { font: "", codes: ["5./ ", "5/. "] },
        { font: "", codes: ["6./ ", "6/. "] },
        { font: "", codes: ["7./ ", "7/. "] },
        { font: "", code: ".1/ " }, { font: "", code: ".2/ " }, { font: "", code: ".3/ " }, { font: "", code: ".4/ " },
        { font: "", code: ".5/ " }, { font: "", code: ".6/ " }, { font: "", code: ".7/ " },
        { font: "", codes: ["1.// ", "1//. "] },
        { font: "", codes: ["2.// ", "2//. "] },
        { font: "", codes: ["3.// ", "3//. "] },
        { font: "", codes: ["4.// ", "4//. "] },
        { font: "", codes: ["5.// ", "5//. "] },
        { font: "", codes: ["6.// ", "6//. "] },
        { font: "", codes: ["7.// ", "7//. "] },
        { font: "", code: ".1// " }, { font: "", code: ".2// " }, { font: "", code: ".3// " }, { font: "", code: ".4// " },
        { font: "", code: ".5// " }, { font: "", code: ".6// " }, { font: "", code: ".7// " },
        { font: "", codes: ["1./// ", "1///. "] },
        { font: "", codes: ["2./// ", "2///. "] },
        { font: "", codes: ["3./// ", "3///. "] },
        { font: "", codes: ["4./// ", "4///. "] },
        { font: "", codes: ["5./// ", "5///. "] },
        { font: "", codes: ["6./// ", "6///. "] },
        { font: "", codes: ["7./// ", "7///. "] },
        { font: "", code: ".1/// " }, { font: "", code: ".2/// " }, { font: "", code: ".3/// " }, { font: "", code: ".4/// " },
        { font: "", code: ".5/// " }, { font: "", code: ".6/// " }, { font: "", code: ".7/// " },
        { font: "", code: "1: " }, { font: "", code: "2: " }, { font: "", code: "3: " }, { font: "", code: "4: " },
        { font: "", code: "5: " }, { font: "", code: "6: " }, { font: "", code: "7: " },
        { font: "", code: ":1 " }, { font: "", code: ":2 " }, { font: "", code: ":3 " }, { font: "", code: ":4 " },
        { font: "", code: ":5 " }, { font: "", code: ":6 " }, { font: "", code: ":7 " },
        { font: "", codes: ["1/: ", "1:/ "] },
        { font: "", codes: ["2/: ", "2:/ "] },
        { font: "", codes: ["3/: ", "3:/ "] },
        { font: "", codes: ["4/: ", "4:/ "] },
        { font: "", codes: ["5/: ", "5:/ "] },
        { font: "", codes: ["6/: ", "6:/ "] },
        { font: "", codes: ["7/: ", "7:/ "] },
        { font: "", code: ":1/ " }, { font: "", code: ":2/ " }, { font: "", code: ":3/ " }, { font: "", code: ":4/ " },
        { font: "", code: ":5/ " }, { font: "", code: ":6/ " }, { font: "", code: ":7/ " },
        { font: "", codes: ["1//: ", "1:// "] },
        { font: "", codes: ["2//: ", "2:// "] },
        { font: "", codes: ["3//: ", "3:// "] },
        { font: "", codes: ["4//: ", "4:// "] },
        { font: "", codes: ["5//: ", "5:// "] },
        { font: "", codes: ["6//: ", "6:// "] },
        { font: "", codes: ["7//: ", "7:// "] },
        { font: "", code: ":1// " }, { font: "", code: ":2// " }, { font: "", code: ":3// " }, { font: "", code: ":4// " },
        { font: "", code: ":5// " }, { font: "", code: ":6// " }, { font: "", code: ":7// " },
        { font: "", code: ":1/// " }, { font: "", code: ":2/// " }, { font: "", code: ":4/// " }, { font: "", code: ":5/// " },
        { font: "", code: ":6/// " }, { font: "", code: ":7/// " },
        { font: "", code: "- " }, { font: "", code: "b " }, { font: "", code: "z " }, { font: "", code: "# " },
        { font: "", code: "( " }, { font: "", code: "(. " }, { font: "", code: "2/2) " }, { font: "", code: "3/4) " },
        { font: "", code: "4/4) " }, { font: "", code: "| " }, { font: "", code: "|| " }, { font: "", code: "||| " },
        { font: "", code: "||: " }, { font: "", code: ":|| " }
    ];

    function escapeRegExp(string) {
        return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    }

    const codeToFontRules = [];
    const fontToCodeRules = [];

    let allPairs = [];
    mappingData.forEach(item => {
        if (item.codes) {
            item.codes.forEach(c => allPairs.push({ code: c, font: item.font }));
            fontToCodeRules.push({ regex: new RegExp(escapeRegExp(item.font), 'g'), replacement: item.codes[0] });
        } else {
            allPairs.push({ code: item.code, font: item.font });
            fontToCodeRules.push({ regex: new RegExp(escapeRegExp(item.font), 'g'), replacement: item.code });
        }
    });

    allPairs.sort((a, b) => b.code.length - a.code.length);

    allPairs.forEach(pair => {
        codeToFontRules.push({
            regex: new RegExp("(?<![a-zA-Z])" + escapeRegExp(pair.code), 'g'),
            replacement: pair.font
        });
    });

    function convertCodeToFont(input) {
        if (!input) return "";
        let result = input;
        for (const rule of codeToFontRules) {
            result = result.replace(rule.regex, rule.replacement);
        }
        return result;
    }

    function convertFontToCode(input) {
        if (!input) return "";
        let result = input;
        for (const rule of fontToCodeRules) {
            result = result.replace(rule.regex, rule.replacement);
        }
        return result;
    }

    const keys = [
        { char: '1', display: '1', type: 'num' }, { char: '2', display: '2', type: 'num' }, { char: '3', display: '3', type: 'num' },
        { char: '4', display: '4', type: 'num' }, { char: '5', display: '5', type: 'num' }, { char: '6', display: '6', type: 'num' },
        { char: '7', display: '7', type: 'num' }, { char: '0', display: '0', type: 'num' }, { char: ' ', display: '空', type: 'space' },
        { char: '-', display: '-', type: 'normal' }, { char: '/', display: '/', type: 'normal' }, { char: '.', display: '.', type: 'normal' },
        { char: ':', display: ':', type: 'normal' }, { char: '|', display: '|', type: 'normal' }, { char: '(', display: '(', type: 'normal' },
        { char: '#', display: '#', type: 'normal' }, { char: 'b', display: 'b', type: 'normal' }, { char: 'z', display: 'z', type: 'normal' },
        { char: 'backspace', display: '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 4H8l-7 8 7 8h13a2 2 0 0 0 2-2V6a2 2 0 0 0-2-2z"></path><line x1="18" y1="9" x2="12" y2="15"></line><line x1="12" y1="9" x2="18" y2="15"></line></svg>', type: 'func' },
        { char: 'delete', display: '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="3 6 5 6 21 6"></polyline><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path><line x1="10" y1="11" x2="10" y2="17"></line><line x1="14" y1="11" x2="14" y2="17"></line></svg>', type: 'func' }
    ];

    function createKeys() {
        if(!quickToolbar) return;
        quickToolbar.innerHTML = '';
        keys.forEach(item => {
            const btn = document.createElement('button');
            btn.className = 'key-btn';
            btn.innerHTML = item.display;
            if (item.type === 'num') btn.classList.add('num-key');
            if (item.type === 'func') btn.classList.add('func-key');
            btn.addEventListener('click', (e) => {
                e.preventDefault();
                handleKeyInput(codeInput, item.char);
            });
            quickToolbar.appendChild(btn);
        });
    }

    function handleKeyInput(inputElement, char) {
        inputElement.focus();
        const start = inputElement.selectionStart;
        const end = inputElement.selectionEnd;
        const val = inputElement.value;
        let newVal = val;
        let newCursorPos = start;

        if (char === 'backspace') {
            if (start !== end) {
                newVal = val.slice(0, start) + val.slice(end);
                newCursorPos = start;
            } else if (start > 0) {
                newVal = val.slice(0, start - 1) + val.slice(end);
                newCursorPos = start - 1;
            }
        } else if (char === 'delete') {
            if (start !== end) {
                newVal = val.slice(0, start) + val.slice(end);
                newCursorPos = start;
            } else if (start < val.length) {
                newVal = val.slice(0, start) + val.slice(end + 1);
                newCursorPos = start;
            }
        } else {
            newVal = val.slice(0, start) + char + val.slice(end);
            newCursorPos = start + char.length;
        }

        inputElement.value = newVal;
        inputElement.dispatchEvent(new Event('input'));
        inputElement.setSelectionRange(newCursorPos, newCursorPos);
    }

    createKeys();
    loadData();
    renderAll();
});