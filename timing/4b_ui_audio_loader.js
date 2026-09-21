// ================= 4b_ui_audio_loader.js: 萬能音檔載入控制中心、巢狀下拉選單與工具列狀態引擎 =================
// 本檔案由 4_ui_events.js 拆分而來（原始第 401-941 行），內容未經改寫，僅搬移。
// 依賴：1_globals.js 中定義的 DOM 參照與全域狀態變數，需在此檔之前載入。

// ================= ★ 萬能音檔載入控制中心 ★ =================

// ================= ★ 萬能音檔載入控制中心 ★ =================

// ================= ★ 新增：量測原始上傳檔案的位元率，供匯出 MP3 時自動比照 ★ =================
// 目的：2_audio_engine.js 的 audioBufferToMp3() 原本永遠寫死輸出 320kbps，不管原始檔
//       是 128kbps 還是 320kbps，剪裁/下載時都會重壓成 320kbps —— 音質不會變好（上限
//       早被原始壓縮鎖死），檔案卻白白比原本更大。
// 做法：只要偵測到原始檔是「有損壓縮格式」，就在中繼資料 (loadedmetadata) 讀到音檔
//       時長後，用「檔案位元組數 ÷ 時長」反推平均位元率（CBR、VBR 皆適用），存進
//       localStorage 給 2_audio_engine.js 的 getTargetMp3Kbps() 讀取。
//       若原始檔本身就是 WAV/FLAC 等無損格式（檔案體積除以時長會算出遠超過 MP3
//       上限的數字，沒有參考價值），或改用線上網址載入（無法量測），則清掉這個值，
//       讓匯出時自動退回原本的 320kbps 保底。
const LOSSY_AUDIO_EXT_REGEX = /\.(mp3|m4a|aac|ogg|oga|opus|wma)$/i;

function recordOriginalBitrate(originalFile) {
    if (!originalFile || typeof originalFile.size !== 'number') return;
    if (!LOSSY_AUDIO_EXT_REGEX.test(originalFile.name || '')) {
        localStorage.removeItem('tagger_originalBitrateKbps');
        return;
    }
    const onMeta = () => {
        audioPlayer.removeEventListener('loadedmetadata', onMeta);
        const duration = audioPlayer.duration;
        if (!duration || !isFinite(duration) || duration <= 0) return;
        // 平均位元率 = 檔案總位元數 ÷ 秒數。VBR 檔案量到的會是整檔平均值，
        // 跟該格式官方標示的「平均位元率」意義相同，足以當作匯出時的參考目標。
        let kbps = Math.round((originalFile.size * 8) / duration / 1000);
        kbps = Math.max(32, Math.min(320, kbps)); // 夾在 lamejs 支援的合理範圍內
        localStorage.setItem('tagger_originalBitrateKbps', String(kbps));
    };
    audioPlayer.addEventListener('loadedmetadata', onMeta);
}
// =========================================================================

// 1. 單一檔案處理引擎 (加入 MP3 防雷機制與記憶體回收)
function handleSingleLocalFile(file) {
    // ★ 修改：優先用「原始檔名」比對，避免剪裁後 tagger_localFileName 變成
    // 「剪裁後音檔.wav」，導致使用者重新選取原本的檔案時，誤跳出「檔名不符」警告
    const expectedFileName = localStorage.getItem('tagger_originalFileName') || localStorage.getItem('tagger_localFileName');
    const actualFileName = file.name;
    const isVideo = file.type.startsWith('video/') || actualFileName.toLowerCase().match(/\.(mp4|m4v|mov|webm)$/);
    
    // ★ 核心修復 2：偵測 MP3，準備進行無損轉換
    const isMp3 = actualFileName.toLowerCase().match(/\.(mp3)$/); 

    const processAudioFile = (updateProjectName = true, fileToLoad = file) => {
        // =========================================================
        // ★ 記憶體優化 1：在指派新音檔前，先釋放舊的 Blob 網址
        // =========================================================
        const oldSrc = audioPlayer.src;
        if (oldSrc && oldSrc.startsWith('blob:')) {
            URL.revokeObjectURL(oldSrc);
        }

        audioPlayer.src = URL.createObjectURL(fileToLoad); 
        audioPlayer.load();
        // ★ 新增：量測「使用者原本選取的檔案」(file，而非可能已轉成 WAV 的
        // fileToLoad) 之位元率，供之後匯出 MP3 時自動比照原始畫質。
        recordOriginalBitrate(file);
        // ★ 新增：把實際載入的音檔本體（可能是原始檔，也可能是 MP3/影片轉出來的
        // 無損 WAV）背景備份進 IndexedDB，重新整理網頁後才能自動讀回，不用重新選檔。
        // 不 await：存檔是背景動作，失敗也不該擋住畫面播放（AudioStore.save 內部
        // 已自行處理失敗提示）。
        if (typeof AudioStore !== 'undefined' && AudioStore.isSupported()) {
            AudioStore.save(fileToLoad, { name: actualFileName });
        }
        if (updateProjectName) {
            localStorage.setItem('tagger_localFileName', actualFileName); 
            // ★ 新增：另外記錄一份「原始檔名」，之後剪裁時只會更新 tagger_localFileName，
            // 不會動到這個欄位，讓「全選下載」永遠找得到真正的原始檔名
            localStorage.setItem('tagger_originalFileName', actualFileName);
            // ★ 新增：載入全新檔案，清除舊專案可能留下的「已修剪」標記
            localStorage.removeItem('tagger_isTrimmed');
        }
        localStorage.setItem('tagger_audioType', 'local'); 
        if (typeof localFileHint !== 'undefined' && localFileHint) localFileHint.style.display = 'none'; 
        saveToStorage(); 
        if(typeof updateMainTitleDisplay === 'function') updateMainTitleDisplay(); 
        if(typeof initWaveSurfer === 'function') initWaveSurfer(); 
        
        if(typeof renderSentenceList === 'function') renderSentenceList(); 
        
        showToast(`正在載入音檔：「${actualFileName}」...`, 'normal'); 
        if(typeof checkButtonVisibility === 'function') checkButtonVisibility(); 
    };

    const checkNameAndLoad = (updateProj, fileData) => {
        if (expectedFileName && expectedFileName !== actualFileName && allLabelsOrdered.length > 0) {
            showCustomDialog({
                title: '音檔檔名不同',
                message: `您選擇的檔案，跟專案原本記錄的檔名不一樣：<br><br>原本：<b>${expectedFileName}</b><br>這次選擇：<b style="color:#C62828;">${actualFileName}</b><br><br>是否要繼續載入？<br><span style="color:#00897B;">（繼續載入後，專案會改用這個新檔名，文字與時間標記則維持不變）</span>`,
                confirmText: '繼續載入', cancelText: '取消',
                onConfirm: () => processAudioFile(updateProj, fileData) 
            });
        } else { processAudioFile(updateProj, fileData); }
    };

    if (isVideo || isMp3) {
        let typeName = isVideo ? '影片檔' : 'MP3 壓縮檔';
        let warnMsg = isVideo 
            ? `建議將影片轉為純音訊檔以確保效能。<br>若原專案使用影片檔，請選「直接載入」。`
            : `MP3 格式 (特別是 VBR 變動位元率) 會導致瀏覽器計算時間偏移，造成<strong style="color:#C62828;">游標與聲波不同步</strong>！<br><br><span style="color:#00897B;">強烈建議讓系統在記憶體中將其無損解碼為 WAV 格式，以確保標記完美對齊。</span>`;
            
        showCustomDialog({
            title: `偵測到 ${typeName}`,
            message: warnMsg,
            confirmText: '轉存無損 WAV (建議)', altText: `直接載入`, cancelText: '取消',
            onConfirm: async () => {
                showToast('高音質解碼...', 'normal');
                try {
                    const audioContext = new (window.AudioContext || window.webkitAudioContext)();
                    const arrayBuffer = await file.arrayBuffer();
                    const audioBuffer = await audioContext.decodeAudioData(arrayBuffer);
                    
                    // 使用我們升級過的無損轉換引擎
                    const wavBlob = typeof audioBufferToWav === 'function' ? audioBufferToWav(audioBuffer) : file;
                    
                    // 若是影片，維持下載音軌的設計；若是 MP3，就在記憶體默默替換，確保同步
                    if (isVideo) {
                        const url = URL.createObjectURL(wavBlob);
                        const a = document.createElement('a'); a.style.display = 'none'; a.href = url;
                        a.download = actualFileName.replace(/\.[^/.]+$/, "") + "_音軌.wav";
                        document.body.appendChild(a); a.click(); 
                        
                        // =========================================================
                        // ★ 記憶體優化 2：影片音軌下載觸發後，釋放暫存網址
                        // =========================================================
                        setTimeout(() => {
                            document.body.removeChild(a);
                            URL.revokeObjectURL(url);
                        }, 100);
                    }
                    
                    checkNameAndLoad(true, wavBlob);
                } catch (err) { 
                    showToast('解碼失敗，改載入原檔', 'error'); 
                    checkNameAndLoad(true, file); 
                }
            },
            onAlt: () => checkNameAndLoad(true, file)
        });
    } else { checkNameAndLoad(true, file); }
}

// 2. 單一網址處理引擎 (移植自舊版)
function handleSingleOnlineUrl(url) {
    url = url.trim();
    if (!url) return showToast('請先輸入音檔網址', 'error');
    if (!url.toLowerCase().startsWith('http')) return showToast('請輸入有效網址', 'error');

    const executeLoad = () => {
        audioPlayer.src = url; audioPlayer.load(); 
        localStorage.setItem('tagger_audioType', 'online'); 
        localStorage.setItem('tagger_audioUrl', url);
        // ★ 新增：線上網址無法量測原始位元率，清掉可能殘留自上一個本機檔案的數值，
        // 避免這次匯出 MP3 時誤用不相干的舊數字，改退回 320kbps 保底。
        localStorage.removeItem('tagger_originalBitrateKbps');
        if (localFileHint) localFileHint.style.display = 'none'; 
        // ★ 新增：切換為線上網址模式，清掉 IndexedDB 裡可能殘留的舊本地音檔備份，
        // 避免白白佔用空間，也避免之後不小心讀到不相干的舊資料。
        if (typeof AudioStore !== 'undefined' && AudioStore.isSupported()) {
            AudioStore.clear();
        }
        saveToStorage(); 
        if (typeof updateMainTitleDisplay === 'function') updateMainTitleDisplay(); 
        if (typeof initWaveSurfer === 'function') initWaveSurfer(); 
        
        if(typeof renderSentenceList === 'function') renderSentenceList(); 
        
        showToast('正在載入線上音檔...', 'normal'); 
        if (typeof checkButtonVisibility === 'function') checkButtonVisibility();
    };

    if (allLabelsOrdered.length > 0) {
        showCustomDialog({
            title: '更換音檔警告', message: '目前已有進度，確定要載入新網址嗎？', onConfirm: executeLoad
        });
    } else { executeLoad(); }
}


// 3. 視窗 UI 互動綁定
const openAudioModalBtn = document.getElementById('openAudioModalBtn');
const audioLoadModal = document.getElementById('audioLoadModalOverlay');
const tabLocalLoad = document.getElementById('tabLocalLoad');
const tabOnlineLoad = document.getElementById('tabOnlineLoad');
const sectionLocalLoad = document.getElementById('sectionLocalLoad');
const sectionOnlineLoad = document.getElementById('sectionOnlineLoad');
const onlineSingleBlock = document.getElementById('onlineSingleBlock');
const onlineBatchBlock = document.getElementById('onlineBatchBlock');
const mergeSettingsBlock = document.getElementById('mergeSettingsBlock');

// ★ 智慧防呆引擎：自動判斷是否要隱藏底部的橘色設定區塊
function updateMergeSettingsVisibility() {
    if (!mergeSettingsBlock) return;

    const isLocalMode = sectionLocalLoad && sectionLocalLoad.style.display !== 'none';
    const onlineModeNode = document.querySelector('input[name="onlineMode"]:checked');
    const onlineMode = onlineModeNode ? onlineModeNode.value : 'single';
    
    if (isLocalMode) {
        // 在本機模式下，必須判斷「是否選擇了多個檔案或 ZIP」才顯示
        const fileInput = document.getElementById('modalLocalFilesInput');
        const files = fileInput ? fileInput.files : null;
        let showBatchSettings = false;

        if (files && files.length > 0) {
            if (files.length > 1 || (files.length === 1 && files[0].name.toLowerCase().endsWith('.zip'))) {
                showBatchSettings = true;
            }
        }
        mergeSettingsBlock.style.display = showBatchSettings ? 'block' : 'none';
    } else {
        // 在線上模式下，只要選了「批次串接」就顯示
        mergeSettingsBlock.style.display = (onlineMode === 'batch') ? 'block' : 'none';
    }
}

// 關閉視窗
function closeAudioModal() {
    audioLoadModal.classList.remove('show');
    document.body.style.overflow = ''; // 恢復網頁背景滾動
}

openAudioModalBtn?.addEventListener('click', () => {
    audioLoadModal.classList.add('show');
    document.body.style.overflow = 'hidden'; // 鎖定網頁背景滾動
    updateMergeSettingsVisibility(); // 開啟時檢查一次狀態
});

document.getElementById('audioLoadCancelBtn')?.addEventListener('click', closeAudioModal);

// 頁籤切換邏輯
tabLocalLoad?.addEventListener('click', () => {
    tabLocalLoad.style.background = 'white'; tabLocalLoad.style.color = '#00897B'; tabLocalLoad.style.borderBottom = '3px solid #00897B';
    tabOnlineLoad.style.background = 'transparent'; tabOnlineLoad.style.color = '#666'; tabOnlineLoad.style.borderBottom = '3px solid transparent';
    tabLocalLoad.setAttribute('aria-selected', 'true'); tabOnlineLoad.setAttribute('aria-selected', 'false');
    sectionLocalLoad.style.display = 'block'; sectionOnlineLoad.style.display = 'none';
    updateMergeSettingsVisibility();
});

tabOnlineLoad?.addEventListener('click', () => {
    tabOnlineLoad.style.background = 'white'; tabOnlineLoad.style.color = '#00897B'; tabOnlineLoad.style.borderBottom = '3px solid #00897B';
    tabLocalLoad.style.background = 'transparent'; tabLocalLoad.style.color = '#666'; tabLocalLoad.style.borderBottom = '3px solid transparent';
    tabOnlineLoad.setAttribute('aria-selected', 'true'); tabLocalLoad.setAttribute('aria-selected', 'false');
    sectionOnlineLoad.style.display = 'block'; sectionLocalLoad.style.display = 'none';
    updateMergeSettingsVisibility();
});

// 單一/批次網址切換邏輯
document.getElementsByName('onlineMode').forEach(radio => {
    radio.addEventListener('change', (e) => {
        onlineSingleBlock.style.display = e.target.value === 'single' ? 'block' : 'none';
        onlineBatchBlock.style.display = e.target.value === 'batch' ? 'block' : 'none';
        updateMergeSettingsVisibility();
    });
});

// ★ 核取方塊連動邏輯：空白時長開關
const batchEnablePaddingCheck = document.getElementById('batchEnablePaddingCheck');
const batchSilencePadding = document.getElementById('batchSilencePadding');

batchEnablePaddingCheck?.addEventListener('change', (e) => {
    batchSilencePadding.disabled = !e.target.checked;
    batchSilencePadding.style.background = e.target.checked ? 'white' : '#f0f0f0';
});

// 4. 終極確認按鈕邏輯分流
document.getElementById('audioLoadConfirmBtn')?.addEventListener('click', async () => {
    const isLocalMode = sectionLocalLoad.style.display !== 'none';
    
    // 讀取新的 checkbox 狀態來決定是否要有留白秒數
    const enablePadding = document.getElementById('batchEnablePaddingCheck').checked;
    const paddingSec = enablePadding ? (parseFloat(document.getElementById('batchSilencePadding').value) || 1.0) : 0;
    const autoPara = document.getElementById('batchAutoParaCheck').checked;

    closeAudioModal();

    audioLoadModal.classList.remove('show'); // 先隱藏視窗

    if (isLocalMode) {
        const fileInput = document.getElementById('modalLocalFilesInput');
        const files = Array.from(fileInput.files);
        if (files.length === 0) return showToast('請先選擇檔案', 'error');

        // 單一檔案
        if (files.length === 1 && !files[0].name.toLowerCase().endsWith('.zip')) {
            handleSingleLocalFile(files[0]);
        } 
        // 批次或 ZIP 檔案
        else {
            try {
                let validFiles = [];
                if (files.length === 1 && files[0].name.toLowerCase().endsWith('.zip')) {
                    if (typeof JSZip === 'undefined') throw new Error("找不到 JSZip 套件");
                    showToast('正在解壓縮 ZIP 檔...', 'normal');
                    const zip = new JSZip(); const zipContent = await zip.loadAsync(files[0]);
                    for (const [filename, entry] of Object.entries(zipContent.files)) {
                        if (!entry.dir && filename.match(/\.(mp3|wav|m4a|ogg|aac)$/i) && !filename.includes('__MACOSX')) {
                            const blob = await entry.async('blob');
                            validFiles.push(new File([blob], filename.split('/').pop(), { type: blob.type }));
                        }
                    }
                } else { validFiles = files.filter(f => f.name.match(/\.(mp3|wav|m4a|ogg|aac)$/i)); }

                if (validFiles.length === 0) return showToast('無支援的音檔', 'error');
                
                if (typeof saveState === 'function') saveState();
                const result = await processBatchLocalFiles(validFiles, paddingSec, autoPara);
                
                allLabelsOrdered = result.labels; sentenceTextMap = result.texts; timeDataMap = result.times;
                const mergedFileName = "批次合併_" + Date.now() + ".wav";
                const mergedFile = new File([result.blob], mergedFileName, { type: 'audio/wav' });

                audioPlayer.src = URL.createObjectURL(mergedFile); audioPlayer.load();
                localStorage.setItem('tagger_localFileName', mergedFileName); localStorage.setItem('tagger_audioType', 'local'); 
                saveToStorage(); 
                if(typeof updateMainTitleDisplay === 'function') updateMainTitleDisplay(); 
                if(typeof renderSentenceList === 'function') renderSentenceList(); 
                if(typeof initWaveSurfer === 'function') initWaveSurfer(); 
                showToast(`成功合併 ${validFiles.length} 個音檔！`, 'success'); 
            } catch (err) { showToast('批次失敗：' + err.message, 'error'); }
        }
    } else {
        const onlineMode = document.querySelector('input[name="onlineMode"]:checked').value;
        if (onlineMode === 'single') {
            handleSingleOnlineUrl(document.getElementById('modalSingleUrlInput').value);
        } else {
            // 線上批次抓取邏輯
            const baseUrl = document.getElementById('batchBaseUrl').value.trim();
            const ext = document.getElementById('batchExtension').value.trim();
            let sep = document.getElementById('batchSeparator').value;
            if (sep === '\\n') sep = '\n';
            const listText = document.getElementById('batchFilenameList').value.trim();

            if (!baseUrl || !listText) return showToast('請填寫上層網址與清單', 'error');
            const filenames = listText.split(sep).map(s => s.trim()).filter(s => s !== '');
            if (filenames.length === 0) return showToast('清單為空', 'error');

            showToast(`開始抓取 ${filenames.length} 個線上檔案...`, 'normal');
            try {
                if (typeof saveState === 'function') saveState();
                const validFiles = [];
                for (let i = 0; i < filenames.length; i++) {
                    const name = filenames[i]; const fullUrl = baseUrl + name + ext;
                    showToast(`下載中: ${name}${ext} (${i+1}/${filenames.length})`, 'normal');
                    try {
                        const response = await fetch(fullUrl);
                        if (!response.ok) throw new Error(response.status);
                        const blob = await response.blob();
                        validFiles.push(new File([blob], name + ext, { type: blob.type }));
                    } catch (e) { console.error(e); showToast(`略過 ${name}${ext} (下載失敗)`, 'error'); }
                }
                if (validFiles.length === 0) throw new Error('全部下載失敗，請檢查網址或 CORS 權限');

                const result = await processBatchLocalFiles(validFiles, paddingSec, autoPara);
                allLabelsOrdered = result.labels; sentenceTextMap = result.texts; timeDataMap = result.times;
                const mergedFileName = "線上批次_" + Date.now() + ".wav";
                const mergedFile = new File([result.blob], mergedFileName, { type: 'audio/wav' });

                audioPlayer.src = URL.createObjectURL(mergedFile); audioPlayer.load();
                localStorage.setItem('tagger_localFileName', mergedFileName); localStorage.setItem('tagger_audioType', 'local'); 
                saveToStorage(); 
                if(typeof updateMainTitleDisplay === 'function') updateMainTitleDisplay(); 
                if(typeof renderSentenceList === 'function') renderSentenceList(); 
                if(typeof initWaveSurfer === 'function') initWaveSurfer(); 
                showToast(`成功下載並合併 ${validFiles.length} 個音檔！`, 'success'); 
            } catch (err) { showToast('線上批次失敗：' + err.message, 'error'); }
        }
    }
});
// =========================================================================

// ================= ★ 全新：巢狀下拉選單與工具列狀態引擎 ★ =================

// 1. 選單開關邏輯
const headerMenus = ['editMenu', 'viewMenu', 'btnMenu'];

document.getElementById('editMenuBtn')?.addEventListener('click', (e) => { e.stopPropagation(); toggleHeaderMenu('editMenu'); });
document.getElementById('viewMenuBtn')?.addEventListener('click', (e) => { e.stopPropagation(); toggleHeaderMenu('viewMenu'); });
document.getElementById('btnMenuBtn')?.addEventListener('click', (e) => { e.stopPropagation(); toggleHeaderMenu('btnMenu'); });

function toggleHeaderMenu(menuId) {
    headerMenus.forEach(id => {
        if (id !== menuId) document.getElementById(id)?.classList.remove('show');
    });
    document.getElementById(menuId)?.classList.toggle('show');
    document.getElementById('sortMenu')?.classList.remove('show'); // 確保排序選單關閉
}

// 點擊空白處關閉所有選單
document.addEventListener('click', () => {
    headerMenus.forEach(id => document.getElementById(id)?.classList.remove('show'));
    document.getElementById('sortMenu')?.classList.remove('show');
});

// 2. 排序選單開啟 (相對於檢視選單)
document.getElementById('sortMenuToggleBtn')?.addEventListener('click', (e) => {
    e.stopPropagation();
    document.getElementById('sortMenu')?.classList.toggle('show');
});

// 3. 字體大小與時間格式切換 (在選單內切換)
document.getElementById('fontToggleBtn')?.addEventListener('click', (e) => { 
    e.stopPropagation(); // 阻止關閉選單，讓使用者可以連續點擊
    currentFontIndex = (currentFontIndex + 1) % fontSizes.length; 
    document.documentElement.style.setProperty('--sentence-font-size', fontSizes[currentFontIndex] + 'px'); 
    document.getElementById('fontToggleBtn').innerHTML = `<span class="material-icons">format_size</span> 字體大小 (${fontSizes[currentFontIndex]})`; 
});

document.getElementById('timeDisplayToggleBtn')?.addEventListener('click', (e) => { 
    e.stopPropagation();
    currentTimeModeIndex = (currentTimeModeIndex + 1) % timeModes.length; 
    document.getElementById('timeDisplayToggleBtn').innerHTML = `<span class="material-icons">schedule</span> 時間標記 (${timeModes[currentTimeModeIndex].label})`; 
    if(typeof updateAllTimeDisplays === 'function') updateAllTimeDisplays(); 
});

// 4. 動態更新按鈕選單裡的打勾狀態
function updateBtnMenuItem(id, isActive, iconName, labelText) {
    const el = document.getElementById(id);
    if(el) {
        el.innerHTML = `<span class="material-icons" style="color: ${isActive ? '#00897B' : '#555'}">${iconName}</span> ${labelText} ${isActive ? '<span class="material-icons" style="margin-left:auto; color:#00897B; font-size:1.1rem;">check</span>' : ''}`;
        el.style.backgroundColor = isActive ? '#E0F2F1' : '';
        el.style.color = isActive ? '#00897B' : '#333';
    }
}

document.getElementById('toggleClearBtnsBtn')?.addEventListener('click', (e) => { 
    e.stopPropagation(); showClearBtns = !showClearBtns; 
    sentenceList.classList.toggle('show-clear-btns', showClearBtns); 
    updateBtnMenuItem('toggleClearBtnsBtn', showClearBtns, 'backspace', '清除按鈕');
});
document.getElementById('toggleTagBtnsBtn')?.addEventListener('click', (e) => { 
    e.stopPropagation(); 
    showTagBtns = !showTagBtns; 
    sentenceList.classList.toggle('show-tag-btns', showTagBtns); 
    updateBtnMenuItem('toggleTagBtnsBtn', showTagBtns, 'add_alarm', '標記按鈕');
});
document.getElementById('toggleAiBtnsBtn')?.addEventListener('click', (e) => { 
    e.stopPropagation(); showAiBtns = !showAiBtns; 
    sentenceList.classList.toggle('show-ai-btns', showAiBtns); 
    updateBtnMenuItem('toggleAiBtnsBtn', showAiBtns, 'auto_fix_high', 'AI 填詞按鈕');
});
document.getElementById('toggleShiftBtnsBtn')?.addEventListener('click', (e) => { 
    e.stopPropagation(); showShiftBtns = !showShiftBtns; 
    sentenceList.classList.toggle('show-shift-btns', showShiftBtns); 
    updateBtnMenuItem('toggleShiftBtnsBtn', showShiftBtns, 'update', '平移按鈕');
});
document.getElementById('toggleMoreBtnsBtn')?.addEventListener('click', (e) => { 
    e.stopPropagation(); showMoreBtns = !showMoreBtns; 
    sentenceList.classList.toggle('show-more-btns', showMoreBtns); 
    updateBtnMenuItem('toggleMoreBtnsBtn', showMoreBtns, 'more_vert', '其他按鈕');
});

// 5. 鎖定 / 解鎖引擎 (Lock Mode)
document.getElementById('toggleModeBtn')?.addEventListener('click', () => {
    isEditMode = !isEditMode;
    const toggleModeBtn = document.getElementById('toggleModeBtn');
    const modeText = document.getElementById('modeText');

    if (isEditMode) { 
        document.body.classList.remove('is-view-mode'); 
        modeText.textContent = '解鎖'; 
        toggleModeBtn.querySelector('.material-icons').textContent = 'lock_open'; 
        sentenceList.className = 'is-edit-mode'; 
        showToast('已解鎖'); 
        document.querySelectorAll('.sentence-text-display').forEach(el => { el.contentEditable = true; el.classList.add('is-editable'); });
        
        // ★ 加入防呆檢查：確認 setupPanel 存在才去更改樣式
        if (setupPanel) {
            setupPanel.style.display = 'block';
        }
    } else { 
        document.body.classList.add('is-view-mode'); 
        modeText.textContent = '鎖定'; 
        toggleModeBtn.querySelector('.material-icons').textContent = 'lock'; 
        sentenceList.className = 'is-view-mode'; 
        showToast('已鎖定'); 
        document.querySelectorAll('.sentence-text-display').forEach(el => { el.contentEditable = false; el.classList.remove('is-editable'); }); 
        
        // 鎖定時自動關閉這些按鈕狀態
        if (showClearBtns) document.getElementById('toggleClearBtnsBtn')?.click(); 
        if (showShiftBtns) document.getElementById('toggleShiftBtnsBtn')?.click(); 
        if (showMoreBtns) document.getElementById('toggleMoreBtnsBtn')?.click(); 
		if (showAiBtns) document.getElementById('toggleAiBtnsBtn')?.click();
        
        // ★ 加入防呆檢查：確認 setupPanel 存在才去更改樣式
        if (setupPanel) {
            setupPanel.style.display = 'none';
        }
    }
    
    if (typeof updateToolbarButtons === 'function') updateToolbarButtons();
    if (typeof renderAllRegions === 'function') renderAllRegions();

    // 處理全文模式的編輯框
    const scriptTextarea = document.getElementById('scriptTextarea');
    const editorContainer = document.getElementById('scriptEditorContainer');
    if (typeof isScriptMode !== 'undefined' && isScriptMode) {
        if (scriptTextarea) scriptTextarea.readOnly = !isEditMode;
        if (editorContainer) editorContainer.style.background = isEditMode ? '#ffffff' : '#f8f9fa';
    }
});

// 6. 全文模式切換按鈕：實際綁定邏輯已統一移至 4g_ui_export.js，此處不再重複綁定。
// （原本這裡、4e_ui_script_mode.js、4g_ui_export.js 各綁了一份幾乎相同、但細節互相
//   打架的 click 監聽器 —— 這裡這份的按鈕文字邏輯其實是反的（進入全文模式卻顯示
//   「單句模式」字樣）。過去全靠 4g 用 cloneNode 洗掉前面兩份監聽器才勉強正常運作，
//   一旦 script 載入順序調整、或有人拿掉 4g 的 cloneNode 技巧，這份反邏輯就會重新生效。
//   現在整併為單一事實來源，統一寫在 4g_ui_export.js。）
// =========================================================================


function updateStickyOffsets() { 
    if (stickyPanel && listHeaderContainer) { 
        listHeaderContainer.style.top = stickyPanel.offsetHeight + 'px'; 
    } 
}

let resizeTimeout = null;
window.addEventListener('resize', () => {
    clearTimeout(resizeTimeout);
    resizeTimeout = setTimeout(updateStickyOffsets, 150);
});

function toggleWaveHeight() { if (typeof wavesurfer === 'undefined' || !wavesurfer) return; currentWaveHeightIndex = (currentWaveHeightIndex + 1) % waveHeights.length; wavesurfer.setOptions({ height: waveHeights[currentWaveHeightIndex] }); showToast(`聲波高度切換為 ${waveHeights[currentWaveHeightIndex]}px`, 'success'); setTimeout(updateStickyOffsets, 50); }

const modalAltBtn = document.getElementById('customModalAltBtn');

modalCancelBtn?.addEventListener('click', () => {
    // ★ 核心修正：先關閉「目前」這個對話框、清空回呼，再執行動作。
    // 如果動作內部又同步開了「新的」對話框，才不會被這裡緊接著的關閉動作誤殺。
    const cb = modalCancelCallback;
    closeCustomDialog();
    if (cb) cb();
});

modalAltBtn?.addEventListener('click', () => {
    const cb = modalAltCallback;
    closeCustomDialog();
    if (cb) cb();
});

modalConfirmBtn?.addEventListener('click', () => { 
    const cb = modalConfirmCallback;
    const inputValue = modalInput.style.display === 'block' ? modalInput.value : true;
    closeCustomDialog(); 
    if (cb) cb(inputValue); 
});

modalInput?.addEventListener('keydown', (e) => { 
    if (e.key === 'Enter') modalConfirmBtn.click(); 
});
// =========================================================================

// ================= ★ 拖放上傳：本機選檔框 + 全域防呆遮罩 ★ =================
// 目的：
//   1. 上傳視窗裡的選檔框原本只是看起來像拖放區（虛線框），實際拖檔案進去
//      沒有任何反應／回饋，容易誤導使用者。
//   2. 瀏覽器對「把檔案拖進網頁空白處」的預設行為是直接開新分頁顯示檔案，
//      等於使用者會被導離這個網頁、原本的標記進度也可能因此遺失，必須先擋掉。
//   3. 如果使用者根本還沒開啟「上傳音檔」視窗，就直接把音檔拖進網頁，
//      直接幫他開視窗、切到本機檔案頁籤、代入檔案，減少一次多餘的點擊。
(function setupDragAndDropUpload() {
    const dropInput = document.getElementById('modalLocalFilesInput');
    const globalOverlay = document.getElementById('globalDropOverlay');
    let dragCounter = 0; // 用計數器處理拖過子元素時 dragenter/dragleave 互相干擾的問題

    // 把拖進來的 FileList 塞進 input，並沿用現有的「選檔後刷新批次設定區塊」邏輯
    function assignFilesToInput(files) {
        if (!dropInput || !files || files.length === 0) return;
        try {
            const dt = new DataTransfer();
            Array.from(files).forEach(f => dt.items.add(f));
            dropInput.files = dt.files;
        } catch (err) {
            // 極少數不支援 DataTransfer 寫入 input.files 的瀏覽器，保底提示改用原生選檔
            console.warn('[拖放上傳] 瀏覽器不支援拖放寫入選檔框，請改用點擊選檔：', err);
            if (typeof showToast === 'function') showToast('此瀏覽器不支援拖放選檔，請改用點擊選擇檔案', 'error');
            return;
        }
        if (typeof updateMergeSettingsVisibility === 'function') updateMergeSettingsVisibility();
        if (typeof showToast === 'function') showToast(`已選取 ${files.length} 個檔案，請確認下方設定後按「開始載入」`, 'success');
    }

    // ---------- ① 選檔框本身：拖曳經過時邊框反白，放開即選檔 ----------
    if (dropInput) {
        ['dragenter', 'dragover'].forEach(evt => {
            dropInput.addEventListener(evt, (e) => {
                e.preventDefault();
                e.stopPropagation();
                dropInput.classList.add('drag-over');
            });
        });
        ['dragleave', 'dragend'].forEach(evt => {
            dropInput.addEventListener(evt, (e) => {
                e.preventDefault();
                dropInput.classList.remove('drag-over');
            });
        });
        dropInput.addEventListener('drop', (e) => {
            e.preventDefault();
            e.stopPropagation();
            dropInput.classList.remove('drag-over');
            assignFilesToInput(e.dataTransfer?.files);
        });
    }

    // ---------- ② 整個網頁：防止瀏覽器把拖進來的檔案直接開新分頁 ----------
    window.addEventListener('dragenter', (e) => {
        if (!e.dataTransfer || !e.dataTransfer.types.includes('Files')) return;
        e.preventDefault();
        dragCounter++;
        if (globalOverlay) globalOverlay.classList.add('show');
    });

    window.addEventListener('dragover', (e) => {
        // 必須擋掉預設行為，瀏覽器才會允許稍後的 drop 事件正常觸發
        if (e.dataTransfer && e.dataTransfer.types.includes('Files')) e.preventDefault();
    });

    window.addEventListener('dragleave', () => {
        dragCounter = Math.max(0, dragCounter - 1);
        if (dragCounter === 0 && globalOverlay) globalOverlay.classList.remove('show');
    });

    window.addEventListener('drop', (e) => {
        if (!e.dataTransfer || !e.dataTransfer.types.includes('Files')) return;
        e.preventDefault(); // 核心防呆：擋掉瀏覽器預設「開新分頁顯示檔案」的地雷行為
        dragCounter = 0;
        if (globalOverlay) globalOverlay.classList.remove('show');

        // 如果本來就是丟在選檔框上，交給上面①的 drop 監聽處理即可，
        // 這裡不重複指派，避免同一批檔案被塞兩次。
        if (e.target === dropInput) return;

        const files = e.dataTransfer.files;
        if (!files || files.length === 0) return;

        // 自動開啟上傳視窗並切到「本機檔案」頁籤（視窗若已開著則不影響）
        const audioLoadModal = document.getElementById('audioLoadModalOverlay');
        const tabLocal = document.getElementById('tabLocalLoad');
        if (audioLoadModal && !audioLoadModal.classList.contains('show')) {
            audioLoadModal.classList.add('show');
            document.body.style.overflow = 'hidden';
        }
        if (tabLocal) tabLocal.click();

        assignFilesToInput(files);
    });
})();
// =========================================================================
