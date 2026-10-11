// 下拉選單與工具列狀態
// 依賴：1_globals.js 中定義的 DOM 參照與全域狀態變數，需在此檔之前載入。

// 萬能音檔載入控制中心

// 【新增】換上新音檔後，等瀏覽器真的切到新音檔（loadedmetadata）才重建聲波圖。
// 原因：audioPlayer.src 改了、load() 呼叫後，currentSrc 要稍後才更新；
// 若立刻 initWaveSurfer()，WaveSurfer 會讀到舊的 currentSrc，解碼出舊音檔的聲波與資料
// （檔名相同時看起來就像「沒有更新」）。2_audio_engine.js 的剪裁流程早已用同樣方式處理。
let audioReinitToken = 0;
function initWaveSurferAfterAudioLoad() {
    const myToken = ++audioReinitToken; // 連續載入時，只讓最後一次生效
    let done = false;
    const run = () => {
        if (done) return;
        done = true;
        audioPlayer.removeEventListener('loadedmetadata', run);
        audioPlayer.removeEventListener('error', run);
        if (myToken !== audioReinitToken) return;
        if (typeof initWaveSurfer === 'function') initWaveSurfer();
    };
    audioPlayer.addEventListener('loadedmetadata', run, { once: true });
    audioPlayer.addEventListener('error', run, { once: true }); // 載入失敗也要交給 WaveSurfer 顯示錯誤提示
    setTimeout(run, 3000); // 保險：事件因故沒觸發時仍會執行
}

// 量測原始檔的平均位元率（檔案位元數 ÷ 時長），存入 localStorage 供匯出 MP3 比照，避免一律以 320kbps 重壓。
// 無損格式或線上網址無法量測，會清除該值，匯出時退回 320kbps。
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
        // 平均位元率 = 檔案總位元數 ÷ 秒數（VBR 取整檔平均）
        let kbps = Math.round((originalFile.size * 8) / duration / 1000);
        kbps = Math.max(32, Math.min(320, kbps)); // 夾在 lamejs 支援的合理範圍內
        localStorage.setItem('tagger_originalBitrateKbps', String(kbps));
    };
    audioPlayer.addEventListener('loadedmetadata', onMeta);
}

// 單一檔案載入（MP3／影片會詢問是否轉為 WAV）
function handleSingleLocalFile(file) {
    // 優先用原始檔名比對（剪裁後 tagger_localFileName 會變成「剪裁後音檔.wav」）
    const expectedFileName = localStorage.getItem('tagger_originalFileName') || localStorage.getItem('tagger_localFileName');
    const actualFileName = file.name;
    // 【新增】檔案指紋（大小-修改時間），用來分辨「檔名相同但其實是不同檔案」
    const fileSig = `${file.size}-${file.lastModified}`;
    const expectedSig = localStorage.getItem('tagger_originalFileSig');
    const sizeOfSig = (sig) => { const n = parseInt(String(sig).split('-')[0], 10); return isNaN(n) ? '未知' : (n / 1024 / 1024).toFixed(2) + ' MB'; };
    const isVideo = file.type.startsWith('video/') || actualFileName.toLowerCase().match(/\.(mp4|m4v|mov|webm)$/);

    // 偵測 MP3，供無損轉換
    const isMp3 = actualFileName.toLowerCase().match(/\.(mp3)$/);

    const processAudioFile = (updateProjectName = true, fileToLoad = file) => {
        // 先記住舊的 Blob 網址，待新音檔載入後才釋放；
        // 提前註銷會讓仍在讀取的 WaveSurfer 出現 blob fetch 失敗
        const oldSrc = audioPlayer.src;

        audioPlayer.src = URL.createObjectURL(fileToLoad);
        audioPlayer.load();

        // 延後註銷舊的 Blob 網址（新音檔 loadeddata 後釋放，另有 5 秒保險）
        if (oldSrc && oldSrc.startsWith('blob:') && oldSrc !== audioPlayer.src) {
            let revoked = false;
            const revokeOldBlob = () => {
                if (revoked) return;
                revoked = true;
                URL.revokeObjectURL(oldSrc);
                audioPlayer.removeEventListener('loadeddata', revokeOldBlob);
            };
            audioPlayer.addEventListener('loadeddata', revokeOldBlob, { once: true });
            setTimeout(revokeOldBlob, 5000);
        }
        // 量測使用者原選檔案（非轉出的 WAV）的位元率，供匯出 MP3 比照
        recordOriginalBitrate(file);
        // 背景備份實際載入的音檔到 IndexedDB，重新整理後可自動讀回（不 await，失敗不影響播放）
        if (typeof AudioStore !== 'undefined' && AudioStore.isSupported()) {
            AudioStore.save(fileToLoad, { name: actualFileName });
        }
        if (updateProjectName) {
            localStorage.setItem('tagger_localFileName', actualFileName);
            // 原始檔名：剪裁只會更新 tagger_localFileName，不動此欄位
            // 不會動到這個欄位，讓「全選下載」永遠找得到真正的原始檔名
            localStorage.setItem('tagger_originalFileName', actualFileName);
            localStorage.setItem('tagger_originalFileSig', fileSig); // 【新增】記錄原始檔指紋（轉成 WAV 時仍以使用者選的原檔為準）
            // 載入全新檔案，清除舊專案可能留下的「已修剪」標記
            localStorage.removeItem('tagger_isTrimmed');
        }
        localStorage.setItem('tagger_audioType', 'local');
        if (typeof localFileHint !== 'undefined' && localFileHint) localFileHint.style.display = 'none';
        saveToStorage();
        if(typeof updateMainTitleDisplay === 'function') updateMainTitleDisplay();
        initWaveSurferAfterAudioLoad(); // 修改：等新音檔 loadedmetadata 後才重建聲波圖

        if(typeof renderSentenceList === 'function') renderSentenceList();

        showToast(`正在載入音檔：「${actualFileName}」...`, 'normal');
        if(typeof checkButtonVisibility === 'function') checkButtonVisibility();
    };

    const checkNameAndLoad = (updateProj, fileData) => {
        // 【新增】檔名相同，但大小或修改時間與上次載入的不同 → 提醒是不同的檔案（沒有舊指紋的舊專案不提醒，避免誤報）
        if (expectedFileName && expectedFileName === actualFileName && expectedSig && expectedSig !== fileSig && allLabelsOrdered.length > 0) {
            showCustomDialog({
                title: '檔名相同，但是不同的檔案',
                message: `您選擇的檔案，檔名跟目前專案相同，但<b style="color:#C62828;">檔案內容不同</b>（大小或修改日期不一樣）：<br><br>檔名：<b>${actualFileName}</b><br>原本檔案大小：<b>${sizeOfSig(expectedSig)}</b><br>這次檔案大小：<b style="color:#C62828;">${sizeOfSig(fileSig)}</b><br><br>是否要用這個檔案取代目前的音檔？<br><span style="color:#00897B;">（文字與時間標記維持不變，若是不同版本的錄音，標記位置可能對不上）</span>`,
                confirmText: '取代音檔', cancelText: '取消',
                onConfirm: () => processAudioFile(updateProj, fileData)
            });
        } else if (expectedFileName && expectedFileName !== actualFileName && allLabelsOrdered.length > 0) {
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

                    const wavBlob = typeof audioBufferToWav === 'function' ? audioBufferToWav(audioBuffer) : file;

                    // 若是影片，維持下載音軌的設計；若是 MP3，就在記憶體默默替換，確保同步
                    if (isVideo) {
                        const url = URL.createObjectURL(wavBlob);
                        const a = document.createElement('a'); a.style.display = 'none'; a.href = url;
                        a.download = actualFileName.replace(/\.[^/.]+$/, "") + "_音軌.wav";
                        document.body.appendChild(a); a.click();

                        // 下載觸發後釋放暫存網址
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

// 單一網址載入
function handleSingleOnlineUrl(url) {
    url = url.trim();
    if (!url) return showToast('請先輸入音檔網址', 'error');
    if (!url.toLowerCase().startsWith('http')) return showToast('請輸入有效網址', 'error');

    const executeLoad = () => {
        audioPlayer.src = url; audioPlayer.load();
        localStorage.setItem('tagger_audioType', 'online');
        localStorage.setItem('tagger_audioUrl', url);
        // 線上網址無法量測位元率，清除舊值以退回 320kbps
        localStorage.removeItem('tagger_originalBitrateKbps');
        if (localFileHint) localFileHint.style.display = 'none';
        // 改用線上網址，清除 IndexedDB 殘留的本地音檔備份
        if (typeof AudioStore !== 'undefined' && AudioStore.isSupported()) {
            AudioStore.clear();
        }
        saveToStorage();
        if (typeof updateMainTitleDisplay === 'function') updateMainTitleDisplay();
        initWaveSurferAfterAudioLoad(); // 修改：同上

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

// 載入視窗 UI
const openAudioModalBtn = document.getElementById('openAudioModalBtn');
const audioLoadModal = document.getElementById('audioLoadModalOverlay');
const tabLocalLoad = document.getElementById('tabLocalLoad');
const tabOnlineLoad = document.getElementById('tabOnlineLoad');
const sectionLocalLoad = document.getElementById('sectionLocalLoad');
const sectionOnlineLoad = document.getElementById('sectionOnlineLoad');
const onlineSingleBlock = document.getElementById('onlineSingleBlock');
const onlineBatchBlock = document.getElementById('onlineBatchBlock');
const mergeSettingsBlock = document.getElementById('mergeSettingsBlock');

// 依載入模式決定是否顯示底部的批次合併設定
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

// 空白時長開關
const batchEnablePaddingCheck = document.getElementById('batchEnablePaddingCheck');
const batchSilencePadding = document.getElementById('batchSilencePadding');

batchEnablePaddingCheck?.addEventListener('change', (e) => {
    batchSilencePadding.disabled = !e.target.checked;
    batchSilencePadding.style.background = e.target.checked ? 'white' : '#f0f0f0';
});

// 確認載入
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
                initWaveSurferAfterAudioLoad(); // 修改：同上
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
                initWaveSurferAfterAudioLoad(); // 修改：同上
                showToast(`成功下載並合併 ${validFiles.length} 個音檔！`, 'success');
            } catch (err) { showToast('線上批次失敗：' + err.message, 'error'); }
        }
    }
});

// 巢狀下拉選單與工具列狀態引擎

// 選單開關邏輯
const headerMenus = ['editMenu', 'viewMenu', 'langViewMenu', 'listModeMenu'];

document.getElementById('editMenuBtn')?.addEventListener('click', (e) => { e.stopPropagation(); toggleHeaderMenu('editMenu'); });
document.getElementById('viewMenuBtn')?.addEventListener('click', (e) => { e.stopPropagation(); toggleHeaderMenu('viewMenu'); });
// 「語言」獨立頂層選單（只在啟用多語字幕時才會顯示，見 4a_ui_title_misc.js）
document.getElementById('langMenuBtn')?.addEventListener('click', (e) => { e.stopPropagation(); toggleHeaderMenu('langViewMenu'); });

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

// 排序選單開啟 (相對於檢視選單)
document.getElementById('sortMenuToggleBtn')?.addEventListener('click', (e) => {
    e.stopPropagation();
    document.getElementById('sortMenu')?.classList.toggle('show');
});

// 編輯區寬度：循環按鈕，每點一次切到下一個值且不關閉選單
// 與設定面板的 #listWidthSelect（4d）透過 setListWidth() 同步；只控制 .list-panel，與聲波圖寬度（--wave-width）無關
const LIST_WIDTH_OPTIONS = [
    { value: '100%',   label: '預設' },
    { value: '1000px', label: '1000px' },
    { value: '100vw',  label: '滿版' }
];

function applyListWidth(width) {
    document.documentElement.style.setProperty('--list-width', width);
    // 延遲等 CSS 過渡動畫跑完再觸發重繪，跟 applyAppWidth() 的做法一致
    setTimeout(() => {
        window.dispatchEvent(new Event('resize'));
        if (typeof updateStickyOffsets === 'function') updateStickyOffsets();
    }, 350);
}

// 更新「檢視」選單的循環按鈕標籤，以及設定面板的下拉選單
function refreshListWidthUI() {
    const opt = LIST_WIDTH_OPTIONS.find(o => o.value === currentListWidth) || LIST_WIDTH_OPTIONS[0];
    const btn = document.getElementById('widthMenuToggleBtn');
    if (btn) btn.innerHTML = `<span class="material-icons">aspect_ratio</span> 編輯區寬度 (${opt.label})`;
    const sel = document.getElementById('listWidthSelect');
    if (sel && sel.value !== opt.value) sel.value = opt.value;
}

// 統一入口：選單循環按鈕與設定下拉都呼叫這個
function setListWidth(width) {
    currentListWidth = width;
    localStorage.setItem('tagger_listWidth', currentListWidth);
    applyListWidth(currentListWidth);
    refreshListWidthUI();
}

applyListWidth(currentListWidth); // 頁面載入時先套用上次記憶的寬度
refreshListWidthUI();

document.getElementById('widthMenuToggleBtn')?.addEventListener('click', (e) => {
    e.stopPropagation(); // 不關閉選單，讓使用者可以連續點擊
    const idx = LIST_WIDTH_OPTIONS.findIndex(o => o.value === currentListWidth);
    setListWidth(LIST_WIDTH_OPTIONS[(idx + 1) % LIST_WIDTH_OPTIONS.length].value);
});

// 字體大小與時間格式切換 (在選單內切換)
document.getElementById('fontToggleBtn')?.addEventListener('click', (e) => {
    e.stopPropagation(); // 阻止關閉選單，讓使用者可以連續點擊
    currentFontIndex = (currentFontIndex + 1) % fontSizes.length;
    document.documentElement.style.setProperty('--sentence-font-size', fontSizes[currentFontIndex] + 'px');
    document.getElementById('fontToggleBtn').innerHTML = `<span class="material-icons">format_size</span> 字體大小 (${fontSizes[currentFontIndex]})`;
});

// 隱藏／恢復聲波區塊與編輯區（兩者不可同時隱藏），僅收起面板，資料與播放狀態不受影響
//   聲波區塊：#toggleWavePanelBtn 收起 #stickyPanel，以 #showWavePanelBtn 恢復
//   編輯區：#toggleListPanelBtn 收起 #listPanel，以 #showListPanelBtn 恢復
// 兩顆恢復圖示共用左下角位置，同一時間最多出現一顆
let isWavePanelUserHidden = false;
let isListPanelUserHidden = false;

// 另一個面板已隱藏時，把對應的「隱藏」選項變灰，提示目前不可用
function refreshPanelHideButtons() {
    document.getElementById('toggleWavePanelBtn')?.classList.toggle('is-disabled', isListPanelUserHidden);
    document.getElementById('toggleListPanelBtn')?.classList.toggle('is-disabled', isWavePanelUserHidden);
}

function closePanelHideMenus() {
    document.getElementById('viewMenu')?.classList.remove('show');
    document.getElementById('waveMoreMenu')?.classList.remove('show');
}

function setWavePanelHidden(hidden) {
    if (!stickyPanel) return;
    if (hidden && isListPanelUserHidden) {
        closePanelHideMenus();
        if (typeof showToast === 'function') showToast('編輯區已隱藏，聲波區塊與編輯區不能同時隱藏', 'error');
        return;
    }
    isWavePanelUserHidden = hidden;
    stickyPanel.style.display = hidden ? 'none' : 'block';
    const showBtn = document.getElementById('showWavePanelBtn');
    if (showBtn) showBtn.style.display = hidden ? 'flex' : 'none';
    refreshPanelHideButtons();
    if (typeof updateStickyOffsets === 'function') updateStickyOffsets(); // 列表標題吸頂位置要跟著補
    closePanelHideMenus();
    if (typeof showToast === 'function') {
        showToast(hidden ? '已隱藏聲波區塊，點擊左下角圖示可恢復' : '已恢復聲波區塊', hidden ? 'success' : 'normal');
    }
}

function setListPanelHidden(hidden) {
    if (!listPanel) return;
    if (hidden && isWavePanelUserHidden) {
        closePanelHideMenus();
        if (typeof showToast === 'function') showToast('聲波區塊已隱藏，聲波區塊與編輯區不能同時隱藏', 'error');
        return;
    }
    isListPanelUserHidden = hidden;
    listPanel.classList.toggle('list-panel-user-hidden', hidden); // 用 class，不會被列表重繪蓋回
    const showBtn = document.getElementById('showListPanelBtn');
    if (showBtn) showBtn.style.display = hidden ? 'flex' : 'none';
    refreshPanelHideButtons();
    closePanelHideMenus();
    if (typeof showToast === 'function') {
        showToast(hidden ? '已隱藏編輯區，點擊左下角圖示可恢復' : '已恢復編輯區', hidden ? 'success' : 'normal');
    }
}

document.getElementById('toggleWavePanelBtn')?.addEventListener('click', (e) => {
    e.stopPropagation();
    setWavePanelHidden(true);
});
document.getElementById('showWavePanelBtn')?.addEventListener('click', (e) => {
    e.stopPropagation();
    setWavePanelHidden(false);
});
document.getElementById('toggleListPanelBtn')?.addEventListener('click', (e) => {
    e.stopPropagation();
    setListPanelHidden(true);
});
document.getElementById('showListPanelBtn')?.addEventListener('click', (e) => {
    e.stopPropagation();
    setListPanelHidden(false);
});

// 其他流程會直接顯示 #stickyPanel，此處同步校正旗標，避免恢復圖示殘留、編輯區無法隱藏
if (stickyPanel) {
    new MutationObserver(() => {
        if (isWavePanelUserHidden && stickyPanel.style.display !== 'none') {
            isWavePanelUserHidden = false;
            const showBtn = document.getElementById('showWavePanelBtn');
            if (showBtn) showBtn.style.display = 'none';
            refreshPanelHideButtons();
            if (typeof updateStickyOffsets === 'function') updateStickyOffsets();
        }
    }).observe(stickyPanel, { attributes: true, attributeFilter: ['style'] });
}

// 列表按鈕顯示設定（設定側邊欄的核取方塊）
document.getElementById('toggleTagBtnsCheck')?.addEventListener('change', (e) => {
    showTagBtns = e.target.checked;
    sentenceList.classList.toggle('show-tag-btns', showTagBtns);
});
document.getElementById('toggleShiftBtnsCheck')?.addEventListener('change', (e) => {
    showShiftBtns = e.target.checked;
    sentenceList.classList.toggle('show-shift-btns', showShiftBtns);
});
document.getElementById('toggleClearBtnsCheck')?.addEventListener('change', (e) => {
    showClearBtns = e.target.checked;
    sentenceList.classList.toggle('show-clear-btns', showClearBtns);
});
document.getElementById('toggleMoreBtnsCheck')?.addEventListener('change', (e) => {
    showMoreBtns = e.target.checked;
    sentenceList.classList.toggle('show-more-btns', showMoreBtns);
});

// 鎖定／解鎖
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

        // 鎖定時自動關閉這些按鈕
        if (showClearBtns) { showClearBtns = false; sentenceList.classList.remove('show-clear-btns'); const cb = document.getElementById('toggleClearBtnsCheck'); if (cb) cb.checked = false; }
        if (showShiftBtns) { showShiftBtns = false; sentenceList.classList.remove('show-shift-btns'); const cb = document.getElementById('toggleShiftBtnsCheck'); if (cb) cb.checked = false; }
        if (showMoreBtns) { showMoreBtns = false; sentenceList.classList.remove('show-more-btns'); const cb = document.getElementById('toggleMoreBtnsCheck'); if (cb) cb.checked = false; }

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

// 全文模式切換按鈕統一在 4g_ui_export.js 綁定，此處不重複綁定

function updateStickyOffsets() {
    if (stickyPanel && listHeaderContainer) {
        listHeaderContainer.style.top = stickyPanel.offsetHeight + 'px';
    }
    // 並排表格表頭的吸頂位置一併重算
    if (typeof alignLangTableHeader === 'function') alignLangTableHeader();
}

let resizeTimeout = null;
window.addEventListener('resize', () => {
    clearTimeout(resizeTimeout);
    resizeTimeout = setTimeout(updateStickyOffsets, 150);
});

// 聲波面板本身高度改變（換聲波高度、工具列換行、顯示／隱藏、縮放等）時自動重算吸頂位置，
// 不必每個改高度的地方各自呼叫 updateStickyOffsets()
if (stickyPanel && typeof ResizeObserver !== 'undefined') {
    let lastStickyH = -1;
    new ResizeObserver(() => {
        const h = stickyPanel.offsetHeight;
        if (h === lastStickyH) return; // 只在高度真的變動時處理，避免無謂重算
        lastStickyH = h;
        updateStickyOffsets();
    }).observe(stickyPanel);
}

function toggleWaveHeight() { if (typeof wavesurfer === 'undefined' || !wavesurfer) return; currentWaveHeightIndex = (currentWaveHeightIndex + 1) % waveHeights.length; wavesurfer.setOptions({ height: waveHeights[currentWaveHeightIndex] }); showToast(`聲波高度切換為 ${waveHeights[currentWaveHeightIndex]}px`, 'success'); setTimeout(updateStickyOffsets, 50); }

const modalAltBtn = document.getElementById('customModalAltBtn');

modalCancelBtn?.addEventListener('click', () => {
    // 先關閉目前對話框並清空回呼，再執行動作，避免動作內開啟的新對話框被誤關
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

// 拖放上傳：選檔框反白提示，並擋掉瀏覽器「把檔案拖進頁面就開新分頁」的預設行為
// 拖曳音檔到頁面任意處時，自動開啟上傳視窗、切到本機檔案頁籤並代入檔案
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

    // 選檔框：拖曳經過時邊框反白，放開即選檔
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

    // 整個網頁：防止瀏覽器直接開啟拖入的檔案
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
        e.preventDefault(); // 擋掉瀏覽器預設的開新分頁行為
        dragCounter = 0;
        if (globalOverlay) globalOverlay.classList.remove('show');

        // 已落在選檔框上則交給其 drop 監聽處理，避免重複指派
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
