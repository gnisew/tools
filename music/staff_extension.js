document.addEventListener('DOMContentLoaded', () => {
    const abcScript = document.createElement('script');
    abcScript.src = "https://cdn.jsdelivr.net/npm/abcjs@6.2.2/dist/abcjs-basic-min.js";
    document.head.appendChild(abcScript);

    const pdfScript = document.createElement('script');
    pdfScript.src = "https://cdnjs.cloudflare.com/ajax/libs/html2pdf.js/0.10.1/html2pdf.bundle.min.js";
    document.head.appendChild(pdfScript);

    const h2cScript = document.createElement('script');
    h2cScript.src = "https://cdnjs.cloudflare.com/ajax/libs/html2canvas/1.4.1/html2canvas.min.js";
    document.head.appendChild(h2cScript);

    const zipScript = document.createElement('script');
    zipScript.src = "https://cdnjs.cloudflare.com/ajax/libs/jszip/3.10.1/jszip.min.js";
    document.head.appendChild(zipScript);

    if (!document.getElementById('staff-modal')) {
        const modalHTML = `
            <div id="staff-modal" class="modal-overlay">
                <div class="staff-modal-box">
                    <div class="staff-header">
                        <h3>🎼 五線譜預覽</h3>
                        <div class="staff-header-actions">
                            <button id="staff-play-toggle-btn" class="pdf-btn play-toggle-btn" title="播放 / 停止" aria-label="播放或停止五線譜播放">▶️</button>

                            <select id="staff-wrap-mode" class="staff-select" aria-label="選擇分行方式">
                                <option value="default" selected>預設分行</option>
                                <option value="custom">自訂(依輸入)</option>
                                <option value="1">每 1 小節</option>
                                <option value="2">每 2 小節</option>
                                <option value="4">每 4 小節</option>
                            </select>
                            <select id="staff-spacing-mode" class="staff-select" aria-label="選擇行距">
                                <option value="1" selected>行距 1.0 (預設)</option>
                                <option value="1.5">行距 1.5</option>
                                <option value="2">行距 2.0</option>
                                <option value="2.5">行距 2.5</option>
                            </select>
                            
                            <div class="export-group">
                                <button id="export-pdf-btn" class="export-btn-main" title="匯出 PDF 檔案">📄 匯出 PDF</button>
                                <button id="export-dropdown-toggle" class="export-btn-toggle" title="其他格式" aria-label="展開更多匯出格式選項">▼</button>
                                <div id="export-dropdown-menu" class="export-dropdown-menu">
                                    <button id="export-png-white-btn" class="dropdown-item">🖼️ 長圖 PNG (白背景)</button>
                                    <button id="export-png-trans-btn" class="dropdown-item">🖼️ 長圖 PNG (透明背景)</button>
                                    <button id="export-zip-white-btn" class="dropdown-item">🗂️ A4 圖包 Zip (白背景)</button>
                                    <button id="export-zip-trans-btn" class="dropdown-item">🗂️ A4 圖包 Zip (透明背景)</button>
                                </div>
                            </div>

                            <button id="close-staff-modal" class="icon-btn-medium" title="關閉" aria-label="關閉五線譜預覽視窗">
                                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
                            </button>
                        </div>
                    </div>
                    
                    <div id="hidden-audio-container" style="display: none;"></div>
                    <div class="staff-content"><div id="abc-paper"></div></div>
                </div>
            </div>
        `;
        document.body.insertAdjacentHTML('beforeend', modalHTML);
    }

    const headerRight = document.querySelector('.header-right');
    if (headerRight && !document.getElementById('open-staff-btn')) {
        const staffBtn = document.createElement('button');
        staffBtn.id = "open-staff-btn";
        staffBtn.className = "icon-btn";
        staffBtn.title = "轉換為五線譜";
        staffBtn.setAttribute('aria-label', '開啟五線譜預覽');
        staffBtn.style.fontSize = "1.2rem";
        staffBtn.innerHTML = "🎼";
        headerRight.insertBefore(staffBtn, headerRight.firstChild);

        staffBtn.addEventListener('click', () => {
            if (typeof ABCJS === 'undefined') return window.showToast("五線譜引擎載入中，請稍後再試！", 'warning');
            document.getElementById('staff-modal').classList.add('show');
            generateStaff();
        });
    }

    // ==========================================
    // 播放狀態與精準游標追蹤引擎
    // ==========================================
    let isPlaying = false;
    let startPositionPercent = 0; 
    let selectedNoteElement = null; 
    window.staffPreviewData = { timings: [], totalTime: 0 };

    const cursorControl = {
        onStart: function() { },
        onEvent: function(ev) {
            if (!isPlaying) return;
            document.querySelectorAll('.abcjs-note.playing').forEach(n => n.classList.remove('playing'));
            if (ev && ev.elements) {
                ev.elements.forEach(group => group.forEach(el => el.classList.add('playing')));
            }
        },
        onFinished: function() {
            if (!isPlaying) return; 
            isPlaying = false;
            document.getElementById('staff-play-toggle-btn').innerHTML = '▶️'; 
            document.querySelectorAll('.abcjs-note.playing').forEach(n => n.classList.remove('playing'));
            
            if (window.staffSynthControl) window.staffSynthControl.seek(startPositionPercent);
            if (selectedNoteElement) selectedNoteElement.classList.add('user-selected');
        }
    };

    document.getElementById('staff-play-toggle-btn').addEventListener('click', async () => {
        if (!window.staffSynthControl) return;
        if (window.staffAudioContext && window.staffAudioContext.state === 'suspended') await window.staffAudioContext.resume();
        
        if (isPlaying) {
            isPlaying = false;
            document.getElementById('staff-play-toggle-btn').innerHTML = '▶️';
            window.staffSynthControl.pause(); 
            setTimeout(() => {
                if (window.staffSynthControl) window.staffSynthControl.seek(startPositionPercent);
                document.querySelectorAll('.abcjs-note.playing').forEach(n => n.classList.remove('playing'));
                if (selectedNoteElement) selectedNoteElement.classList.add('user-selected');
            }, 20);
        } else {
            isPlaying = true;
            document.getElementById('staff-play-toggle-btn').innerHTML = '⏹️';
            if (selectedNoteElement) selectedNoteElement.classList.remove('user-selected');
            window.staffSynthControl.seek(startPositionPercent);
            setTimeout(() => { window.staffSynthControl.play(); }, 20);
        }
    });

    document.querySelector('.staff-content').addEventListener('click', function(e) {
        const note = e.target.closest('.abcjs-note');
        const allNotes = Array.from(document.querySelectorAll('.abcjs-note'));
        if (note) {
            allNotes.forEach(n => n.classList.remove('user-selected'));
            selectedNoteElement = note;
            if (!isPlaying) note.classList.add('user-selected');
            const idx = allNotes.indexOf(note);
            if (idx !== -1 && window.staffPreviewData.totalTime > 0) {
                startPositionPercent = window.staffPreviewData.timings[idx] / window.staffPreviewData.totalTime;
                if (window.staffSynthControl) window.staffSynthControl.seek(startPositionPercent);
            }
        } else {
            allNotes.forEach(n => n.classList.remove('user-selected', 'playing'));
            selectedNoteElement = null;
            startPositionPercent = 0;
            if (!isPlaying && window.staffSynthControl) window.staffSynthControl.seek(0);
        }
    });

    function closeStaffModal() {
        document.getElementById('staff-modal').classList.remove('show');
        if (window.staffSynthControl) { window.staffSynthControl.pause(); window.staffSynthControl.seek(0); }
        startPositionPercent = 0; selectedNoteElement = null; isPlaying = false;
        const toggleBtn = document.getElementById('staff-play-toggle-btn');
        if (toggleBtn) toggleBtn.innerHTML = '▶️';
        document.querySelectorAll('.abcjs-note').forEach(n => n.classList.remove('user-selected', 'playing'));
    }

    document.getElementById('close-staff-modal').addEventListener('click', closeStaffModal);
    document.getElementById('staff-modal').addEventListener('click', (e) => { if (e.target.id === 'staff-modal') closeStaffModal(); });

    document.getElementById('staff-wrap-mode').addEventListener('change', generateStaff);
    document.getElementById('staff-spacing-mode').addEventListener('change', generateStaff);

    const dropdownToggle = document.getElementById('export-dropdown-toggle');
    const dropdownMenu = document.getElementById('export-dropdown-menu');
    dropdownToggle.addEventListener('click', (e) => { e.stopPropagation(); dropdownMenu.classList.toggle('show'); });
    document.addEventListener('click', (e) => { if (!dropdownMenu.contains(e.target) && e.target !== dropdownToggle) dropdownMenu.classList.remove('show'); });

    // ==========================================
    // BPM 擷取與匯出快照 (支援透明背景設定)
    // ==========================================
    const getFileName = () => document.getElementById('doc-title').value.trim() || "五線譜";
    function getCurrentBPM() {
        const tempoInput = document.getElementById('tempo-input') || document.getElementById('bpm-input');
        if (tempoInput && tempoInput.value) return parseInt(tempoInput.value, 10);
        if (typeof currentTempo !== 'undefined') return currentTempo;
        return 100; 
    }

    function createOfflineClone(isTransparent = false) {
        const sourceElement = document.getElementById('abc-paper');
        const cloneWrapper = document.createElement('div');
        cloneWrapper.style.position = 'absolute'; cloneWrapper.style.top = '0px'; cloneWrapper.style.left = '0px'; cloneWrapper.style.zIndex = '-9999';
        const contentWidth = Math.max(sourceElement.scrollWidth, sourceElement.clientWidth);
        cloneWrapper.style.width = (contentWidth + 100) + 'px'; 
        
        // 依照透明設定給予底色
        cloneWrapper.style.backgroundColor = isTransparent ? 'transparent' : '#ffffff';
        
        cloneWrapper.style.padding = '50px'; cloneWrapper.style.boxSizing = 'border-box';
        cloneWrapper.innerHTML = sourceElement.innerHTML;
        const svgs = cloneWrapper.querySelectorAll('svg');
        svgs.forEach(svg => { svg.style.display = 'block'; svg.style.margin = '0'; svg.style.overflow = 'visible'; svg.style.maxWidth = 'none'; });
        document.body.appendChild(cloneWrapper);
        return cloneWrapper;
    }

    // 1. 匯出 PDF (永遠維持白底)
    document.getElementById('export-pdf-btn').addEventListener('click', () => {
        if (typeof html2pdf === 'undefined' || typeof html2canvas === 'undefined') return;
        const cloneWrapper = createOfflineClone(false); 
        const btn = document.getElementById('export-pdf-btn');
        const oldText = btn.innerHTML; btn.innerHTML = "處理中..."; btn.disabled = true;
        // [優化] scale 從 2 提升到 3，與 PNG/ZIP 匯出一致，畫質更清晰
        html2canvas(cloneWrapper, { scale: 3, useCORS: true, backgroundColor: '#ffffff', x: 0, y: 0, scrollX: 0, scrollY: 0, windowWidth: cloneWrapper.offsetWidth, width: cloneWrapper.offsetWidth}).then(canvas => {
            // [優化] 原本會先轉成 JPEG 圖片、包進 <div>，再讓 html2pdf() 對這個 <div> 重新截圖一次，
            // 等於截圖兩次 + 一次 JPEG 破壞性壓縮，畫質因此打折。
            // 現在改成直接把高解析度的 canvas 交給 html2pdf() (使用 'canvas' 來源型別)，
            // 跳過中間的 JPEG 轉換與內部重複截圖，維持最高畫質。
            html2pdf().set({ margin: [10, 10], filename: `${getFileName()}.pdf`, image: { type: 'jpeg', quality: 1.0 }, html2canvas: { scale: 3 }, jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait' }}).from(canvas, 'canvas').save().then(() => {
                document.body.removeChild(cloneWrapper);
                btn.innerHTML = oldText;
                btn.disabled = false;
            });
        });
    });

    // 2. 匯出長圖 PNG (分流白底/透明)
    function exportLongPng(isTransparent) {
        dropdownMenu.classList.remove('show');
        if (typeof html2canvas === 'undefined') return;
        const cloneWrapper = createOfflineClone(isTransparent); 
        const btn = document.getElementById('export-pdf-btn'); 
        const oldText = btn.innerHTML; btn.innerHTML = "截圖中..."; btn.disabled = true;
        
        const bgColor = isTransparent ? null : '#ffffff';
        
        html2canvas(cloneWrapper, { scale: 3, useCORS: true, backgroundColor: bgColor, x: 0, y: 0, scrollX: 0, scrollY: 0, windowWidth: cloneWrapper.offsetWidth, width: cloneWrapper.offsetWidth}).then(canvas => {
            const link = document.createElement('a'); 
            link.download = `${getFileName()}_長圖_${isTransparent ? '透明' : '白底'}.png`; 
            link.href = canvas.toDataURL('image/png'); link.click();
            document.body.removeChild(cloneWrapper); btn.innerHTML = oldText; btn.disabled = false;
        });
    }
    document.getElementById('export-png-white-btn').addEventListener('click', () => exportLongPng(false));
    document.getElementById('export-png-trans-btn').addEventListener('click', () => exportLongPng(true));

    // 3. 匯出 A4 圖包 ZIP (分流白底/透明)
    function exportA4Zip(isTransparent) {
        dropdownMenu.classList.remove('show');
        if (typeof html2canvas === 'undefined' || typeof JSZip === 'undefined') return;
        const cloneWrapper = createOfflineClone(isTransparent); 
        const btn = document.getElementById('export-pdf-btn');
        const oldText = btn.innerHTML; btn.innerHTML = "打包中..."; btn.disabled = true;
        
        const bgColor = isTransparent ? null : '#ffffff';

        html2canvas(cloneWrapper, { scale: 3, useCORS: true, backgroundColor: bgColor, x: 0, y: 0, scrollX: 0, scrollY: 0, windowWidth: cloneWrapper.offsetWidth, width: cloneWrapper.offsetWidth}).then(canvas => {
            const zip = new JSZip(); const chunkHeight = Math.floor(canvas.width * (297 / 210)); let currentY = 0; let pageNum = 1;
            while (currentY < canvas.height) {
                const chunkCanvas = document.createElement('canvas'); chunkCanvas.width = canvas.width; chunkCanvas.height = chunkHeight; const ctx = chunkCanvas.getContext('2d');
                
                // 如果是白底，就先填滿白底；如果是透明，就清空 (保留原本的 transparent)
                if (!isTransparent) {
                    ctx.fillStyle = "#ffffff"; 
                    ctx.fillRect(0, 0, chunkCanvas.width, chunkCanvas.height);
                } else {
                    ctx.clearRect(0, 0, chunkCanvas.width, chunkCanvas.height);
                }
                
                const sourceH = Math.min(chunkHeight, canvas.height - currentY); 
                ctx.drawImage(canvas, 0, currentY, canvas.width, sourceH, 0, 0, canvas.width, sourceH);
                
                zip.file(`${getFileName()}_第${pageNum}頁.png`, chunkCanvas.toDataURL('image/png').split(',')[1], {base64: true}); 
                currentY += chunkHeight; pageNum++;
            }
            zip.generateAsync({type:"blob"}).then(function(content) {
                const link = document.createElement('a'); 
                link.download = `${getFileName()}_A4圖包_${isTransparent ? '透明' : '白底'}.zip`; 
                link.href = URL.createObjectURL(content); link.click();
                document.body.removeChild(cloneWrapper); btn.innerHTML = oldText; btn.disabled = false;
            });
        });
    }
    document.getElementById('export-zip-white-btn').addEventListener('click', () => exportA4Zip(false));
    document.getElementById('export-zip-trans-btn').addEventListener('click', () => exportA4Zip(true));

    // ==========================================
    // 轉換引擎 (完美同步音符與休止符的時間軸)
    // ==========================================
    function convertJianpuToABC(text, wrapMode) {
        const title = document.getElementById('doc-title').value || "未命名樂譜";
        const bpm = getCurrentBPM();
        let abcString = `X: 1\nT: ${title}\nM: 4/4\nL: 1/4\nQ: 1/4=${bpm}\nK: C\n`;

        const spacingMode = document.getElementById('staff-spacing-mode').value;
        if (spacingMode === '1.5') abcString += "%%sysstaffsep 60\n%%staffsep 60\n";
        else if (spacingMode === '2') abcString += "%%sysstaffsep 80\n%%staffsep 80\n";
        else if (spacingMode === '2.5') abcString += "%%sysstaffsep 100\n%%staffsep 100\n";

        text = text.replace(/\[.*?\]\{?/g, '').replace(/\}/g, '');
        text = text.replace(/\n/g, ' _NL_ ');
        text = text.replace(/\(\(/g, ' (( '); 

        const tokens = text.trim().split(/\s+/);
        let noteList = [];
        let tieNext = false;

        for (let token of tokens) {
            if (!token) continue;
            if (token === '_NL_') { noteList.push({ type: 'nl' }); continue; }

            if (['|', '||', '||:', ':||'].includes(token)) {
                let val = (token === ':||') ? ':|' : token;
                let prev = [...noteList].reverse().find(n => n.type !== 'nl');
                if (prev && prev.type === 'bar' && val === '|') continue;
                noteList.push({ type: 'bar', val: val });
                continue;
            }

            if (token === '<') { noteList.push({ type: 'tupletStart' }); continue; }
            if (token === '>') { noteList.push({ type: 'tupletEnd' }); continue; }
            if (token === '-') { let lastNote = [...noteList].reverse().find(n => n.type === 'note'); if (lastNote) lastNote.dur += 1; continue; }
            if (token === '*') { let lastNote = [...noteList].reverse().find(n => n.type === 'note'); if (lastNote) lastNote.dur *= 1.5; continue; }
            if (token === '((') { tieNext = true; continue; }

            const match = token.match(/^([#b]*)([.:]*)([0-7])([.:]*)(.*)$/);
            if (match) {
                let acc = match[1], pre = match[2], noteStr = match[3], post = match[4], durStr = match[5];
                let dur = 1;
                if (durStr) {
                    if (durStr.includes('///') || durStr.includes('\\\\\\')) dur = 0.125;
                    else if (durStr.includes('//') || durStr.includes('\\\\')) dur = 0.25;
                    else if (durStr.includes('/') || durStr.includes('\\')) dur = 0.5;

                    if (durStr.includes('---')) dur += 3;
                    else if (durStr.includes('--')) dur += 2;
                    else if (durStr.includes('-')) dur += 1;
                    if (durStr.includes('*')) dur *= 1.5;
                }

                let isRest = (noteStr === '0');
                let noteObj = { type: 'note', isRest: isRest, pitch: noteStr, acc: acc, pre: pre, post: post, dur: dur, slurStart: false, slurEnd: false };

                if (tieNext) {
                    let lastNote = [...noteList].reverse().find(n => n.type === 'note');
                    if (lastNote && !lastNote.isRest && !isRest && lastNote.pitch === noteStr && lastNote.acc === acc && lastNote.pre === pre && lastNote.post === post) {
                        lastNote.dur += noteObj.dur; tieNext = false; continue; 
                    } else if (lastNote) {
                        lastNote.slurStart = true; noteObj.slurEnd = true; tieNext = false;
                    }
                }
                noteList.push(noteObj);
            }
        }

        window.staffPreviewData.timings = [];
        window.staffPreviewData.totalTime = 0;
        
        let currentLine = ""; let measureCount = 0; let measureTime = 0; let prevNoteBeat = -1; let prevNoteWasRest = false; let notesInCurrentMeasure = 0; 
        let globalTime = 0; 
        let inTuplet = false;

        function getAbcDurStr(d) {
            if (d === 1) return ""; if (Number.isInteger(d)) return d.toString();
            if (d === 0.5) return "/2"; if (d === 0.25) return "/4"; if (d === 0.125) return "/8";
            if (d === 1.5) return "3/2"; if (d === 0.75) return "3/4"; if (d === 2.5) return "5/2"; if (d === 3.5) return "7/2";
            let num = d * 16, den = 16; while(num % 2 === 0 && den % 2 === 0) { num /= 2; den /= 2; }
            return den === 1 ? num.toString() : `${num}/${den}`;
        }

        for (let item of noteList) {
            if (item.type === 'nl') { if (wrapMode === 'custom') { abcString += currentLine.trim() + "\n"; currentLine = ""; } continue; }
            if (item.type === 'tupletStart') { inTuplet = true; if (!currentLine.endsWith(" ") && currentLine.length > 0) currentLine += " "; currentLine += "(3 "; continue; }
            if (item.type === 'tupletEnd') { inTuplet = false; continue; }
            
            if (item.type === 'bar') {
                if (!currentLine.endsWith(" ") && currentLine.length > 0) currentLine += " ";
                currentLine += item.val + " ";
                measureTime = 0; prevNoteBeat = -1; prevNoteWasRest = false;

                if (notesInCurrentMeasure > 0) {
                    measureCount++; notesInCurrentMeasure = 0;
                    if (['1', '2', '4'].includes(wrapMode)) {
                        if (measureCount % parseInt(wrapMode) === 0) { abcString += currentLine.trim() + "\n"; currentLine = ""; }
                    }
                }
                continue;
            }

            if (item.type === 'note') {
                notesInCurrentMeasure++;
                
                window.staffPreviewData.timings.push(globalTime);

                let effectiveDur = item.dur;
                if (inTuplet) effectiveDur = effectiveDur * 2 / 3; 
                globalTime += effectiveDur;

                let abcNote = "";
                if (item.isRest) abcNote = "z";
                else {
                    const pitches = ['C', 'D', 'E', 'F', 'G', 'A', 'B']; abcNote = pitches[parseInt(item.pitch) - 1];
                    if (item.pre.includes(':')) abcNote = abcNote.toLowerCase() + "'"; else if (item.pre.includes('.')) abcNote = abcNote.toLowerCase();
                    else if (item.post.includes(':')) abcNote = abcNote + ",,"; else if (item.post.includes('.')) abcNote = abcNote + ",";
                    if (item.acc.includes('#')) abcNote = '^' + abcNote; if (item.acc.includes('b')) abcNote = '_' + abcNote;
                }

                abcNote += getAbcDurStr(item.dur);
                if (item.slurStart) abcNote = "(" + abcNote; if (item.slurEnd) abcNote = abcNote + ")";

                let currentBeat = Math.floor(measureTime + 0.001); let spaceBefore = false;
                if (prevNoteBeat !== -1) {
                    if (currentBeat !== prevNoteBeat || item.isRest || prevNoteWasRest || item.dur >= 1) spaceBefore = true;
                }
                if (spaceBefore && !currentLine.endsWith(" ") && !currentLine.endsWith("(3 ")) currentLine += " ";
                currentLine += abcNote;
                measureTime += item.dur; prevNoteBeat = currentBeat; prevNoteWasRest = item.isRest;
            }
        }
        window.staffPreviewData.totalTime = globalTime;
        if (currentLine.trim()) abcString += currentLine.trim() + "\n";
        return abcString;
    }

    function generateStaff() {
        const codeInput = document.getElementById('code-input');
        const baseKeySelect = document.getElementById('base-key-select');
        const wrapMode = document.getElementById('staff-wrap-mode').value;
        const paperContainer = document.querySelector('.staff-content');
        
        if (!codeInput || !paperContainer) return;

        startPositionPercent = 0;
        selectedNoteElement = null;
        isPlaying = false;
        const toggleBtn = document.getElementById('staff-play-toggle-btn');
        if (toggleBtn) toggleBtn.innerHTML = '▶️';

        const rawText = codeInput.value;
        const abcCode = convertJianpuToABC(rawText, wrapMode);
        const keyOffset = parseInt(baseKeySelect.value) || 0;
        
        const containerWidth = paperContainer.clientWidth - 40; 
        let renderWidth;

        let maxItems = 0; let maxMeasures = 0;
        const lines = abcCode.split('\n');
        for (let l of lines) {
            if (l.match(/^[A-Z]:/)) continue; 
            let tokens = l.trim().split(/\s+/);
            if (tokens.length > maxItems) maxItems = tokens.length;
            let barCount = (l.match(/\|/g) || []).length;
            if (barCount > maxMeasures) maxMeasures = barCount;
        }

        if (wrapMode === '1') renderWidth = Math.max(300, maxItems * 40 + 100);  
        else if (wrapMode === '2') renderWidth = Math.max(500, maxItems * 35 + 100);  
        else if (wrapMode === '4') renderWidth = Math.max(containerWidth, Math.max(850, maxItems * 30 + 100)); 
        else if (wrapMode === 'custom') renderWidth = Math.max(containerWidth, maxMeasures * 220); 
        else renderWidth = Math.max(containerWidth, 800);

        let renderConfig = {
            add_classes: true, visualTranspose: keyOffset, staffwidth: renderWidth,
            paddingtop: 40, paddingbottom: 80, paddingright: 25, paddingleft: 15
        };
        if (wrapMode === 'default') {
            renderConfig.wrap = { minSpacing: 1.5, maxSpacing: 2.5, preferredMeasuresPerLine: 4 };
        }

        let visualObj = ABCJS.renderAbc("abc-paper", abcCode, renderConfig)[0];

        const hiddenContainer = document.getElementById('hidden-audio-container');
        hiddenContainer.innerHTML = '';
        window.staffSynthControl = new ABCJS.synth.SynthController();
        window.staffSynthControl.load("#hidden-audio-container", cursorControl, {
            displayLoop: false, displayRestart: true, displayPlay: true, displayProgress: false, displayWarp: false
        });

        if (!window.staffAudioContext) {
            window.staffAudioContext = new (window.AudioContext || window.webkitAudioContext)();
        }

        window.staffSynthControl.setTune(visualObj, false, {
            audioContext: window.staffAudioContext,
            millisecondsPerMeasure: visualObj.millisecondsPerMeasure(),
            midiTranspose: keyOffset // [新增] 讓播放音高與畫面調性一致
        }).catch(err => console.log("Audio Init Wait:", err));
    }
});