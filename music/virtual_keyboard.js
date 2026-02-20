// ==========================================
// 虛擬鍵盤模組
// ==========================================
(function() {
    let isRecording = false;
    let audioCtx = null;
    let nextNotetime = 0;
    let beatCount = 0;
    let timerID = null;
    let lookahead = 25.0; 
    let scheduleAheadTime = 0.1; 

    let bpm = 80;
    let beatsPerMeasure = 4;
    let optPlayKeys = true;
    let optOutputCode = true;
    let optPlayMetronome = true;
    
    let optEnablePhysKb = false;
    let optPhysKbMode = '1'; 
    let isUpPressed = false;
    let isDownPressed = false;

    let lastNoteObj = null; 
    let lastInjectedLength = 0; 
    let accumulatedBeats = 0; 

    const ALL_NOTES = [
        { c: '1.', t: 'white' }, { c: '#1.', t: 'black' }, { c: '2.', t: 'white' }, { c: '#2.', t: 'black' }, { c: '3.', t: 'white' }, { c: '4.', t: 'white' }, { c: '#4.', t: 'black' }, { c: '5.', t: 'white' }, { c: '#5.', t: 'black' }, { c: '6.', t: 'white' }, { c: '#6.', t: 'black' }, { c: '7.', t: 'white' },
        { c: '1', t: 'white' }, { c: '#1', t: 'black' }, { c: '2', t: 'white' }, { c: '#2', t: 'black' }, { c: '3', t: 'white' }, { c: '4', t: 'white' }, { c: '#4', t: 'black' }, { c: '5', t: 'white' }, { c: '#5', t: 'black' }, { c: '6', t: 'white' }, { c: '#6', t: 'black' }, { c: '7', t: 'white' },
        { c: '.1', t: 'white' }, { c: '#.1', t: 'black' }, { c: '.2', t: 'white' }, { c: '#.2', t: 'black' }, { c: '.3', t: 'white' }, { c: '.4', t: 'white' }, { c: '#.4', t: 'black' }, { c: '.5', t: 'white' }, { c: '#.5', t: 'black' }, { c: '.6', t: 'white' }, { c: '#.6', t: 'black' }, { c: '.7', t: 'white' }
    ];

    const mappingMode2Map = {
        'z':'1.', 'x':'2.', 'c':'3.', 'a':'4.', 's':'5.', 'd':'6.', 'q':'7.',
        'v':'1', 'b':'2', 'n':'3', 'f':'4', 'g':'5', 'h':'6', 'r':'7',
        'm':'.1', ',':'.2', '.':'.3', 'j':'.4', 'k':'.5', 'l':'.6', 'u':'.7'
    };

    const reverseMode2Map = {};
    for (let key in mappingMode2Map) {
        reverseMode2Map[mappingMode2Map[key]] = key.toUpperCase();
    }

    function initUI() {
        const container = document.createElement('div');
        container.id = 'vk-container';
        container.innerHTML = `
            <div id="vk-controls">
                <div class="vk-row vk-main-row">
                    <div style="display:flex; align-items:center; gap:10px;">
                        <button id="vk-btn-rec" class="vk-btn">⏺ 錄製節拍</button>
                        <div id="vk-beat-display" class="vk-beat-container"></div>
                    </div>
                    <div style="display:flex; gap:12px; align-items:center;">
                        <label style="font-weight:bold; color:#0b57d0;"><input type="checkbox" id="vk-output-code" checked> 輸出</label>
                        <button id="vk-btn-settings" class="vk-btn">展開</button>
                        <button id="vk-btn-close" class="vk-btn">關閉</button>
                    </div>
                </div>
                <div id="vk-settings-panel" class="vk-collapsed">
                    <div class="vk-settings-wrap">
                        <div class="vk-control-group">
                            <label>速度:</label>
                            <input type="number" id="vk-bpm-input" class="vk-input" style="width:50px;" value="80" min="30" max="240">
                        </div>
                        <div class="vk-control-group">
                            <select id="vk-time-sig" class="vk-input">
                                <option value="4">4 拍子</option>
                                <option value="3">3 拍子</option>
                            </select>
                        </div>
                        <label><input type="checkbox" id="vk-play-metronome" checked> 拍音</label>
                        <label><input type="checkbox" id="vk-play-keys" checked> 琴音</label>
                        <label><input type="checkbox" id="vk-show-black" checked> 黑鍵</label>
                        <label><input type="checkbox" id="vk-show-label" checked> 代號</label>
                        <div class="vk-control-group" style="margin-left: 5px;">
                            <label>音域:</label>
                            <select id="vk-range-start" class="vk-input" style="width:50px;"></select> ~ 
                            <select id="vk-range-end" class="vk-input" style="width:50px;"></select>
                        </div>
                        <div class="vk-control-group" style="margin-left: 5px;">
                            <label style="color:#0b57d0; font-weight:bold;">
                                <input type="checkbox" id="vk-enable-phys-kb"> 實體鍵盤
                            </label>
                            <select id="vk-phys-kb-mode" class="vk-input">
                                <option value="1">模式一: 上下鍵+數字</option>
                                <option value="2">模式二: 字母對應區塊</option>
                            </select>
                        </div>
                    </div>
                </div>
            </div>
            <div id="vk-keys-area"></div>
        `;
        document.body.appendChild(container);

        setupEvents();
        populateRangeSelects();
        buildBeatIndicator();
        renderKeys('1.', '.7'); 
    }

    function populateRangeSelects() {
        const startSel = document.getElementById('vk-range-start');
        const endSel = document.getElementById('vk-range-end');
        ALL_NOTES.forEach(n => {
            if (n.t === 'white') {
                startSel.add(new Option(n.c, n.c));
                endSel.add(new Option(n.c, n.c));
            }
        });
        startSel.value = '1.';
        endSel.value = '.7';
    }

    function buildBeatIndicator() {
        const container = document.getElementById('vk-beat-display');
        container.innerHTML = '';
        for(let i = 0; i < beatsPerMeasure; i++) {
            let dot = document.createElement('div');
            dot.className = 'vk-beat-dot';
            if (i === beatsPerMeasure - 1) dot.classList.add('vk-last');
            dot.innerText = i + 1;
            container.appendChild(dot);
        }
    }

    function updateVisualBeat(beatIndex) {
        if (!isRecording) return;
        const dots = document.querySelectorAll('.vk-beat-dot');
        dots.forEach((d, i) => {
            if (i === beatIndex) d.classList.add('vk-active');
            else d.classList.remove('vk-active');
        });
    }

    function clearVisualBeats() {
        document.querySelectorAll('.vk-beat-dot').forEach(d => d.classList.remove('vk-active'));
    }

    // [核心修正] 改變 DOM 插入順序為 Low -> Mid -> High，配合 CSS 達成響應式排列
    function renderKeys(startCode, endCode) {
        const area = document.getElementById('vk-keys-area');
        area.innerHTML = '';
        
        let startIndex = ALL_NOTES.findIndex(n => n.c === startCode);
        let endIndex = ALL_NOTES.findIndex(n => n.c === endCode);
        if (startIndex === -1) startIndex = 0;
        if (endIndex === -1 || endIndex < startIndex) endIndex = ALL_NOTES.length - 1;

        const showHint = optEnablePhysKb && optPhysKbMode === '2';

        const highNotes = [];
        const midNotes = [];
        const lowNotes = [];

        for (let i = startIndex; i <= endIndex; i++) {
            const noteDef = ALL_NOTES[i];
            const btn = document.createElement('div');
            btn.className = `vk-key vk-${noteDef.t}`;
            
            let hintHtml = '';
            if (showHint && reverseMode2Map[noteDef.c]) {
                hintHtml = `<span class="vk-hint">${reverseMode2Map[noteDef.c]}</span>`;
            }

            btn.innerHTML = `${hintHtml}<span class="vk-label">${noteDef.c}</span>`;
            
            btn.addEventListener('mousedown', (e) => { e.preventDefault(); handleKeyPress(e, noteDef.c, btn); });
            btn.addEventListener('touchstart', (e) => { e.preventDefault(); handleKeyPress(e, noteDef.c, btn); });
            
            if (noteDef.c.startsWith('.') || noteDef.c.startsWith('#.')) {
                highNotes.push(btn);
            } else if (noteDef.c.endsWith('.')) {
                lowNotes.push(btn);
            } else {
                midNotes.push(btn);
            }
        }

        const appendTier = (notesArray) => {
            if (notesArray.length === 0) return;
            const tier = document.createElement('div');
            tier.className = 'vk-tier';
            notesArray.forEach(b => tier.appendChild(b));
            area.appendChild(tier);
        };

        // DOM 順序：低音 -> 中音 -> 高音
        // 電腦版(row): 左至右。 手機版(column-reverse): 顛倒變成 高音在上、低音在下
        appendTier(lowNotes);
        appendTier(midNotes);
        appendTier(highNotes);
    }

    function getFreqFromCode(code) {
        const baseFreqs = { '1': 261.63, '2': 293.66, '3': 329.63, '4': 349.23, '5': 392.00, '6': 440.00, '7': 493.88 };
        let pitch = code.replace(/[\.#b]/g, ''); 
        let f = baseFreqs[pitch] || 261.63;
        if (code.includes('#')) f *= Math.pow(2, 1/12);
        if (code.includes('b')) f *= Math.pow(2, -1/12);
        let dotIndex = code.indexOf('.');
        if (dotIndex !== -1) {
            let numIndex = code.search(/[1-7]/);
            if (dotIndex < numIndex) f *= 2; 
            else f *= 0.5; 
        }
        return f;
    }

    function getDurationData(deltaSec) {
        const beatSec = 60.0 / bpm;
        const ratio = deltaSec / beatSec;
        let suffix = ''; let beatValue = 1;
        if (ratio < 0.35) { suffix = '//'; beatValue = 0.25; }
        else if (ratio < 0.75) { suffix = '/'; beatValue = 0.5; }
        else if (ratio < 1.25) { suffix = ''; beatValue = 1.0; }
        else if (ratio < 1.75) { suffix = ' *'; beatValue = 1.5; } 
        else if (ratio < 2.5)  { suffix = ' -'; beatValue = 2.0; }
        else if (ratio < 3.5)  { suffix = ' - -'; beatValue = 3.0; }
        else { suffix = ' - - -'; beatValue = 4.0; }
        return { suffix, beatValue };
    }

    function insertToEditor(text, replaceLength = 0) {
        const codeInput = document.getElementById('code-input');
        if (!codeInput) return;

        let start = codeInput.selectionStart;
        let end = codeInput.selectionEnd;
        let val = codeInput.value;

        if (replaceLength > 0) start = start - replaceLength;

        codeInput.value = val.substring(0, start) + text + val.substring(end);
        let newCursor = start + text.length;
        codeInput.setSelectionRange(newCursor, newCursor);
        
        codeInput.dispatchEvent(new Event('input'));
        
        if(!optEnablePhysKb) codeInput.focus();
    }

    function handleKeyPress(e, code, btn) {
        if (btn) {
            btn.classList.add('vk-pressed');
            setTimeout(() => btn.classList.remove('vk-pressed'), 150);
        }
        if (!audioCtx) audioCtx = new (window.AudioContext || window.webkitAudioContext)();
        if (optPlayKeys) playToneCustom(getFreqFromCode(code), 0.6);
        if (!optOutputCode) return;
        if (!isRecording) {
            insertToEditor(code + ' ');
            return;
        }

        const now = audioCtx.currentTime;
        if (lastNoteObj === null) {
            let insertStr = code + ' ';
            insertToEditor(insertStr);
            lastInjectedLength = insertStr.length;
            lastNoteObj = { code: code, time: now };
        } else {
            const delta = now - lastNoteObj.time;
            const durData = getDurationData(delta);
            let barLine = '';
            accumulatedBeats += durData.beatValue;
            if (accumulatedBeats >= beatsPerMeasure - 0.05) {
                barLine = '| ';
                accumulatedBeats -= beatsPerMeasure;
                if (accumulatedBeats < 0) accumulatedBeats = 0;
            }
            let finishedPrevNote = lastNoteObj.code + durData.suffix + ' ' + barLine;
            let newCurrentNote = code + ' ';
            let totalInsertStr = finishedPrevNote + newCurrentNote;

            insertToEditor(totalInsertStr, lastInjectedLength);
            lastInjectedLength = newCurrentNote.length;
            lastNoteObj = { code: code, time: now };
        }
    }

    function nextNote() {
        const secondsPerBeat = 60.0 / bpm;
        nextNotetime += secondsPerBeat;
        beatCount++;
    }

    function scheduleNote(beatNumber, time) {
        const currentBeatInMeasure = beatNumber % beatsPerMeasure;
        const isLastBeat = (currentBeatInMeasure === beatsPerMeasure - 1);
        if (optPlayMetronome) {
            const freq = isLastBeat ? 1200 : 800; 
            playSimpleBeep(freq, 0.05, time);
        }
        const delay = (time - audioCtx.currentTime) * 1000;
        setTimeout(() => updateVisualBeat(currentBeatInMeasure), Math.max(0, delay));
    }

    function scheduler() {
        if (!isRecording) return;
        while (nextNotetime < audioCtx.currentTime + scheduleAheadTime) {
            scheduleNote(beatCount, nextNotetime);
            nextNote();
        }
        timerID = setTimeout(scheduler, lookahead);
    }

    function playSimpleBeep(freq, duration, time = null) {
        if (!audioCtx) return;
        const osc = audioCtx.createOscillator();
        const gain = audioCtx.createGain();
        osc.connect(gain); gain.connect(audioCtx.destination);
        osc.type = 'sine'; osc.frequency.value = freq;
        let t = time !== null ? time : audioCtx.currentTime;
        osc.start(t);
        gain.gain.setValueAtTime(0.5, t);
        gain.gain.exponentialRampToValueAtTime(0.01, t + duration);
        osc.stop(t + duration);
    }

    function playToneCustom(freq, duration) {
        if (!audioCtx) return;
        const osc = audioCtx.createOscillator();
        const gain = audioCtx.createGain();
        osc.connect(gain); gain.connect(audioCtx.destination);
        osc.type = 'triangle'; osc.frequency.value = freq;
        let t = audioCtx.currentTime;
        osc.start(t);
        gain.gain.setValueAtTime(0.6, t);
        gain.gain.exponentialRampToValueAtTime(0.001, t + duration);
        osc.stop(t + duration);
    }

    function handlePhysKeyDown(e) {
        if (!document.getElementById('vk-container').classList.contains('vk-show')) return;
        if (!optEnablePhysKb) return;
        let code = null;
        if (optPhysKbMode === '1') {
            if (e.key === 'ArrowUp') { isUpPressed = true; return; }
            if (e.key === 'ArrowDown') { isDownPressed = true; return; }
            if (e.key >= '1' && e.key <= '7') {
                if (isUpPressed) code = '.' + e.key; 
                else if (isDownPressed) code = e.key + '.'; 
                else code = e.key;
            }
        } else if (optPhysKbMode === '2') {
            code = mappingMode2Map[e.key.toLowerCase()];
        }
        if (code) {
            e.preventDefault(); 
            if (e.repeat) return; 
            let targetBtn = null;
            document.querySelectorAll('.vk-key').forEach(b => {
                if(b.querySelector('.vk-label').innerText === code) targetBtn = b;
            });
            handleKeyPress(e, code, targetBtn);
        }
    }

    function handlePhysKeyUp(e) {
        if (e.key === 'ArrowUp') isUpPressed = false;
        if (e.key === 'ArrowDown') isDownPressed = false;
    }

    function setupEvents() {
        const container = document.getElementById('vk-container');
        
        const floatToggleBtn = document.getElementById('vk-toggle-float-btn');
        if (floatToggleBtn) {
            floatToggleBtn.addEventListener('click', () => container.classList.toggle('vk-show'));
        }
        
        document.getElementById('vk-btn-close').addEventListener('click', () => {
            container.classList.remove('vk-show');
            if (isRecording) document.getElementById('vk-btn-rec').click();
        });

        const btnSettings = document.getElementById('vk-btn-settings');
        const panelSettings = document.getElementById('vk-settings-panel');
        btnSettings.addEventListener('click', () => {
            panelSettings.classList.toggle('vk-collapsed');
            if (panelSettings.classList.contains('vk-collapsed')) {
                btnSettings.innerText = '展開';
                btnSettings.classList.remove('vk-toggle-active');
            } else {
                btnSettings.innerText = '收合';
                btnSettings.classList.add('vk-toggle-active');
            }
        });

        const btnRec = document.getElementById('vk-btn-rec');
        btnRec.addEventListener('click', () => {
            if (!audioCtx) audioCtx = new (window.AudioContext || window.webkitAudioContext)();
            isRecording = !isRecording;
            if (isRecording) {
                btnRec.innerHTML = '⏹ 停止錄製';
                btnRec.classList.add('vk-active');
                bpm = parseInt(document.getElementById('vk-bpm-input').value) || 80;
                lastNoteObj = null; lastInjectedLength = 0; beatCount = 0; accumulatedBeats = 0; 
                nextNotetime = audioCtx.currentTime + 0.3; 
                scheduler();
            } else {
                btnRec.innerHTML = '⏺ 錄製節拍';
                btnRec.classList.remove('vk-active');
                clearTimeout(timerID); clearVisualBeats();
                if (lastNoteObj !== null && optOutputCode) {
                    insertToEditor(lastNoteObj.code + ' ', lastInjectedLength);
                    lastNoteObj = null; lastInjectedLength = 0;
                }
            }
        });

        document.getElementById('vk-bpm-input').addEventListener('change', (e) => bpm = parseInt(e.target.value) || 80);
        document.getElementById('vk-time-sig').addEventListener('change', (e) => {
            beatsPerMeasure = parseInt(e.target.value);
            buildBeatIndicator();
        });
        
        document.getElementById('vk-play-keys').addEventListener('change', e => optPlayKeys = e.target.checked);
        document.getElementById('vk-output-code').addEventListener('change', e => optOutputCode = e.target.checked);
        document.getElementById('vk-play-metronome').addEventListener('change', e => optPlayMetronome = e.target.checked);

        document.getElementById('vk-enable-phys-kb').addEventListener('change', e => {
            optEnablePhysKb = e.target.checked;
            if (optEnablePhysKb) document.activeElement.blur();
            const startStr = document.getElementById('vk-range-start').value;
            const endStr = document.getElementById('vk-range-end').value;
            renderKeys(startStr, endStr);
        });
        document.getElementById('vk-phys-kb-mode').addEventListener('change', e => {
            optPhysKbMode = e.target.value;
            const startStr = document.getElementById('vk-range-start').value;
            const endStr = document.getElementById('vk-range-end').value;
            renderKeys(startStr, endStr);
        });
        
        document.addEventListener('keydown', handlePhysKeyDown);
        document.addEventListener('keyup', handlePhysKeyUp);

        document.getElementById('vk-show-black').addEventListener('change', e => document.getElementById('vk-keys-area').classList.toggle('vk-no-black', !e.target.checked));
        document.getElementById('vk-show-label').addEventListener('change', e => document.getElementById('vk-keys-area').classList.toggle('vk-hide-labels', !e.target.checked));
        
        const reRender = () => renderKeys(document.getElementById('vk-range-start').value, document.getElementById('vk-range-end').value);
        document.getElementById('vk-range-start').addEventListener('change', reRender);
        document.getElementById('vk-range-end').addEventListener('change', reRender);
    }

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', initUI);
    } else {
        initUI();
    }
})();