// ================= 9_batch_converter.js: 萬能批次轉檔引擎 =================
const sidebarBatchConvertBtn = document.getElementById('sidebarBatchConvertBtn');
const homeBatchConvertBtn = document.getElementById('homeBatchConvertBtn'); // ★ 新增：首頁轉檔按鈕
const batchConvertModalOverlay = document.getElementById('batchConvertModalOverlay');
const closeBatchConvertBtn = document.getElementById('closeBatchConvertBtn');
const startBatchConvertBtn = document.getElementById('startBatchConvertBtn');
const batchConvertInput = document.getElementById('batchConvertInput');
const batchConvertTargetFormat = document.getElementById('batchConvertTargetFormat');

// ================= ★ 新增：「移除標點(無法復原)」選項 ★ =================
// 預設不勾選。只有輸出格式為 TSV / SRT / Audacity 時可用；
// 純文字段落 (txt) 與專案檔 (json) 不可移除標點（切換到這兩種格式時會自動取消勾選並停用）。
const batchRemovePunctuationCheck = document.getElementById('batchRemovePunctuationCheck');
const batchRemovePunctuationLabel = document.getElementById('batchRemovePunctuationLabel');
const batchRemovePunctuationHint = document.getElementById('batchRemovePunctuationHint');
const PUNCT_REMOVABLE_FORMATS = ['tsv', 'srt', 'audacity'];

// ★ 新增：「多個獨立音檔」格式的提示文字區塊（僅支援含線上音檔網址的 JSON 專案檔）
const batchAudioFormatHint = document.getElementById('batchAudioFormatHint');
const AUDIO_OUTPUT_FORMAT = 'audio';

function updateRemovePunctuationAvailability() {
    if (!batchRemovePunctuationCheck || !batchConvertTargetFormat) return;
    const supported = PUNCT_REMOVABLE_FORMATS.includes(batchConvertTargetFormat.value);
    batchRemovePunctuationCheck.disabled = !supported;
    if (!supported) batchRemovePunctuationCheck.checked = false; // 不支援的格式：取消勾選，避免看起來「勾了卻沒作用」
    if (batchRemovePunctuationLabel) {
        batchRemovePunctuationLabel.style.opacity = supported ? '1' : '0.45';
        batchRemovePunctuationLabel.style.cursor = supported ? 'pointer' : 'not-allowed';
    }
    if (batchRemovePunctuationHint) {
        batchRemovePunctuationHint.style.color = supported ? '#888' : '#C62828';
        batchRemovePunctuationHint.textContent = supported
            ? '僅適用於輸出 TSV、字幕檔 (SRT)、Audacity 標籤；純文字段落、專案檔 (JSON) 與多個獨立音檔不可移除標點。'
            : '目前選擇的輸出格式不可移除標點。';
    }
}
// ★ 新增：切換到「多個獨立音檔」格式時，顯示專屬的使用限制提示
function updateAudioFormatHintVisibility() {
    if (!batchAudioFormatHint || !batchConvertTargetFormat) return;
    batchAudioFormatHint.style.display = batchConvertTargetFormat.value === AUDIO_OUTPUT_FORMAT ? 'block' : 'none';
}
batchConvertTargetFormat?.addEventListener('change', updateRemovePunctuationAvailability);
batchConvertTargetFormat?.addEventListener('change', updateAudioFormatHintVisibility); // ★ 新增
updateRemovePunctuationAvailability();
updateAudioFormatHintVisibility(); // ★ 新增

// 每次開啟視窗都恢復成預設（不勾選），避免上次的破壞性選項被不小心帶入
function resetRemovePunctuationOption() {
    if (batchRemovePunctuationCheck) batchRemovePunctuationCheck.checked = false;
    updateRemovePunctuationAvailability();
    updateAudioFormatHintVisibility(); // ★ 新增
}

// ★ 移除標點的實作 removePunctuationFromText() 已移至 1_globals.js，
// 與「設定 → 匯出音檔的檔名規則 → 移除標點」共用同一份，這裡不再重複定義。

// 開關視窗邏輯：側邊欄的按鈕 (需要先關閉側邊欄再開視窗)
sidebarBatchConvertBtn?.addEventListener('click', () => {
    document.getElementById('closeSidebarBtn')?.click(); 
    setTimeout(() => {
        resetRemovePunctuationOption(); // ★ 新增：開啟時恢復預設（不勾選）
        batchConvertModalOverlay.classList.add('show');
        document.body.style.overflow = 'hidden';
    }, 300);
});

homeBatchConvertBtn?.addEventListener('click', () => {
    resetRemovePunctuationOption(); // ★ 新增：開啟時恢復預設（不勾選）
    batchConvertModalOverlay.classList.add('show');
    document.body.style.overflow = 'hidden';
});

closeBatchConvertBtn?.addEventListener('click', () => {
    batchConvertModalOverlay.classList.remove('show');
    document.body.style.overflow = '';
});

// ================= 核心：萬能解析器 (Parser) =================
// 負責將各種格式轉換為統一的 Array: [{ label, start, end, text }]
function parseAnyToStandard(text, ext, filename) {
    let items = [];
    
    try {
        if (ext === 'json') {
            const data = JSON.parse(text);
            if (data.allLabelsOrdered && data.timeDataMap) {
                data.allLabelsOrdered.forEach(label => {
                    const timeData = data.timeDataMap[label];
                    if (timeData) {
                        items.push({
                            label: label,
                            start: typeof timeData === 'object' ? timeData.start : timeData,
                            end: typeof timeData === 'object' ? timeData.end : null,
                            text: data.sentenceTextMap ? (data.sentenceTextMap[label] || '') : ''
                        });
                    }
                });
            }
        } 
        else if (ext === 'srt') {
            const blocks = text.split(/\r?\n\r?\n/).filter(b => b.trim());
            blocks.forEach((block, index) => {
                const lines = block.split(/\r?\n/);
                if (lines.length >= 3) {
                    const timeLine = lines[1];
                    const textLines = lines.slice(2).join('\n');
                    const timeParts = timeLine.split(' --> ');
                    if (timeParts.length === 2) {
                        // 利用 1_globals.js 中的 parseSrtTime
                        const start = typeof parseSrtTime === 'function' ? parseSrtTime(timeParts[0]) : 0;
                        const end = typeof parseSrtTime === 'function' ? parseSrtTime(timeParts[1]) : 0;
                        
                        // 自動產生 A01 格式的標籤
                        const group = Math.floor(index / 99);
                        const num = (index % 99) + 1;
                        const label = `${String.fromCharCode(65 + group)}${String(num).padStart(2, '0')}`;
                        
                        items.push({ label, start, end, text: textLines });
                    }
                }
            });
        }
        else if (ext === 'tsv') {
            const lines = text.split(/\r?\n/).filter(line => line.trim());
            lines.forEach((line, index) => {
                // 略過標題列
                if (index === 0 && line.includes('開始時間')) return;
                const parts = line.split('\t');
                if (parts.length >= 4) {
                    items.push({
                        label: parts[0].trim(),
                        start: parseFloat(parts[1]) || 0,
                        end: parts[2].trim() ? parseFloat(parts[2]) : null,
                        text: parts.slice(3).join('\t').trim()
                    });
                }
            });
        }
        else if (ext === 'txt') { // Audacity 格式
            const lines = text.split(/\r?\n/).filter(line => line.trim());
            lines.forEach((line, index) => {
                const parts = line.split('\t');
                if (parts.length >= 3) { // Audacity 至少有 Start, End, Label
                    const group = Math.floor(index / 99);
                    const num = (index % 99) + 1;
                    const label = `${String.fromCharCode(65 + group)}${String(num).padStart(2, '0')}`;
                    
                    items.push({
                        label: label,
                        start: parseFloat(parts[0]) || 0,
                        end: parseFloat(parts[1]) || 0,
                        text: parts[2].trim()
                    });
                }
            });
        }
    } catch (e) {
        console.error(`解析檔案 ${filename} 失敗:`, e);
    }
    
    return items;
}

// ================= 核心：萬能產生器 (Generator) =================
// 負責將統一 Array 轉換為目標格式字串
// ★ 已移至 1_globals.js 的 buildStandardToAny()，跟 4g_ui_export.js 共用同一份，
//   這裡不再重複定義（1_globals.js 會比這個檔案更早載入）。

// ================= ★ 新增：輸出格式「多個獨立音檔」的核心處理 ★ =================
// 僅支援專案檔 (.json) 且 audioUrl 是「線上網址」(http/https) 的情況：
// 本機上傳的音檔本身沒有存進 JSON（只記錄檔名），重新整理網頁後就會消失，
// 批次轉檔這一步完全拿不到音訊本體；只有使用者自己貼上的線上音檔網址，
// 才能在這裡重新下載、解碼、依每一句的時間標記切成一個個獨立音檔。
// 依賴：sliceAudioBuffer() / audioBufferToWav()（定義於 2_audio_engine.js，
//       在 index.html 裡必須比本檔案更早載入）。
// 檔名規則固定為：標題_編號_句子內容.wav（每段都先用 sanitizeFilename 清過，
// 避免路徑分隔符號等非法字元弄壞 ZIP 內的檔案結構）。
async function exportJsonToIndividualAudioFiles(data, filename, zip, usedNames) {
    const audioUrl = String(data.audioUrl || '').trim();
    if (!/^https?:\/\//i.test(audioUrl)) {
        return { count: 0, reason: '此專案檔沒有「線上音檔網址」，本機音檔無法在批次轉檔中還原' };
    }
    if (!Array.isArray(data.allLabelsOrdered) || data.allLabelsOrdered.length === 0 || !data.timeDataMap) {
        return { count: 0, reason: '找不到時間標記資料' };
    }
    if (typeof sliceAudioBuffer !== 'function' || typeof audioBufferToWav !== 'function') {
        return { count: 0, reason: '缺少音訊切割引擎，請重新整理網頁再試一次' };
    }

    // 1. 下載線上音檔本體
    let arrayBuffer;
    try {
        const res = await fetch(audioUrl);
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        arrayBuffer = await res.arrayBuffer();
    } catch (err) {
        return { count: 0, reason: `無法下載線上音檔（${err.message || err}），可能是網址失效或跨網域限制` };
    }

    // 2. 解碼成可供切割的音訊資料
    let audioBuffer;
    let tempAudioCtx;
    try {
        tempAudioCtx = new (window.AudioContext || window.webkitAudioContext)();
        audioBuffer = await tempAudioCtx.decodeAudioData(arrayBuffer);
    } catch (err) {
        return { count: 0, reason: `音檔解碼失敗（${err.message || err}），可能是不支援的音訊格式` };
    } finally {
        if (tempAudioCtx && typeof tempAudioCtx.close === 'function') tempAudioCtx.close();
    }

    // 3. 依每一句的時間標記切割，並用「標題_編號_句子內容」命名
    const title = (data.title || filename.replace(/\.[^/.]+$/, '')).trim();
    const folder = zip.folder(sanitizeFilename(title) || filename.replace(/\.[^/.]+$/, ''));
    let count = 0;

    data.allLabelsOrdered.forEach(label => {
        const raw = data.timeDataMap[label];
        if (raw === undefined || raw === null) return;
        const start = typeof raw === 'object' ? raw.start : raw;
        const end = typeof raw === 'object' ? raw.end : null;
        if (typeof start !== 'number' || typeof end !== 'number' || isNaN(start) || isNaN(end) || end <= start) return;

        const text = data.sentenceTextMap ? (data.sentenceTextMap[label] || '') : '';
        const sliced = sliceAudioBuffer(audioBuffer, start, end);
        const blob = audioBufferToWav(sliced);

        // 檔名規則：標題_編號_句子內容.wav（任何一段清完是空字串就自動略過該段）
        const parts = [title, label, text]
            .map(s => sanitizeFilename(String(s || '')).trim())
            .filter(Boolean);
        let base = (parts.join('_') || label).substring(0, 150);
        let finalName = `${base}.wav`;
        let n = 2;
        while (usedNames.has(finalName.toLowerCase())) { // 避免同名覆蓋
            finalName = `${base.substring(0, 140)}(${n}).wav`;
            n++;
        }
        usedNames.add(finalName.toLowerCase());

        folder.file(finalName, blob);
        count++;
    });

    return { count, reason: count === 0 ? '沒有可用的完整時間標記（需同時有開始與結束時間）' : null };
}

// ================= 執行批次處理與打包 =================
startBatchConvertBtn?.addEventListener('click', async () => {
    const files = Array.from(batchConvertInput.files);
    if (files.length === 0) return showToast('請先選擇檔案', 'error');
    if (typeof JSZip === 'undefined') return showToast('缺少 JSZip 套件，無法處理壓縮檔', 'error');

    const targetFormat = batchConvertTargetFormat.value;
    // ★ 新增：是否移除標點——必須「有勾選」且輸出格式為 TSV / SRT / Audacity 才會執行（JSON、純文字段落、獨立音檔一律不移除）
    const removePunctuation = !!batchRemovePunctuationCheck?.checked && PUNCT_REMOVABLE_FORMATS.includes(targetFormat);
    // 決定輸出的副檔名（「多個獨立音檔」格式不會用到這個，每一句各自輸出一個 .wav）
    let outExt = targetFormat;
    if (targetFormat === 'audacity') outExt = 'txt';

    const outputZip = new JSZip();
    let processedCount = 0;
    let audioFileTotalCount = 0; // ★ 新增：「多個獨立音檔」模式下，實際切出的音檔總數
    const audioUsedNames = new Set(); // ★ 新增：跨多個來源檔案，統一記錄已用過的音檔檔名避免覆蓋

    batchConvertModalOverlay.classList.remove('show');
    document.body.style.overflow = '';
    showToast('開始批次轉換，請稍候...', 'normal');

    // ★ 新增：記錄「解析不到資料」的檔案，結束後明確告知使用者是哪些檔案、為什麼，
    // 而不是只給一個總數或完全靜默跳過。
    // 常見情境：匯出功能的「純文字段落」跟「Audacity 標籤檔」都用 .txt 副檔名，
    // 但這裡的 .txt 解析邏輯固定當作 Audacity 格式（要求 tab 分欄），如果拿純文字
    // 的 .txt 回來匯入，會直接解析成 0 筆、卻看不出原因——這裡把原因講清楚。
    const skippedFiles = [];

    try {
        // 幫助函式：處理單一文字內容（★ 改為 async：「多個獨立音檔」格式需要 fetch + 解碼音訊）
        const processFileContent = async (contentStr, filename, originalExt) => {
            // ★ 新增：「多個獨立音檔」格式獨立分支——只認 JSON 專案檔，其餘格式直接視為不支援
            if (targetFormat === AUDIO_OUTPUT_FORMAT) {
                if (originalExt !== 'json') {
                    skippedFiles.push(`${filename}（多個獨立音檔僅支援專案檔 .json）`);
                    return;
                }
                let data;
                try {
                    data = JSON.parse(contentStr);
                } catch (e) {
                    skippedFiles.push(`${filename}（JSON 格式錯誤，無法解析）`);
                    return;
                }
                const { count, reason } = await exportJsonToIndividualAudioFiles(data, filename, outputZip, audioUsedNames);
                if (count > 0) {
                    processedCount++;
                    audioFileTotalCount += count;
                } else {
                    skippedFiles.push(`${filename}（${reason || '找不到可用資料'}）`);
                }
                return;
            }

            let items = parseAnyToStandard(contentStr, originalExt, filename);
            // ★ 新增：移除標點（只處理文字內容，時間與標籤不動）
            if (removePunctuation) {
                items = items.map(item => ({ ...item, text: removePunctuationFromText(item.text) }));
            }
            if (items.length > 0) {
                const outputStr = buildStandardToAny(items, targetFormat, filename);
                if (outputStr) {
                    const baseName = filename.replace(/\.[^/.]+$/, ""); // 去除舊副檔名
                    outputZip.file(`${baseName}.${outExt}`, outputStr);
                    processedCount++;
                    return;
                }
            }

            let reason = '找不到可辨識的資料';
            if (originalExt === 'txt' && !contentStr.includes('\t')) {
                reason = '看起來是純文字（無時間標記），不是 Audacity 標籤格式的 .txt';
            }
            skippedFiles.push(`${filename}（${reason}）`);
        };

        // 逐一讀取檔案
        for (let i = 0; i < files.length; i++) {
            const file = files[i];
            const ext = file.name.split('.').pop().toLowerCase();

            if (ext === 'zip') {
                // 如果來源是 ZIP，解開它並逐一轉換
                const zipReader = new JSZip();
                const zipContent = await zipReader.loadAsync(file);
                
                for (const [filename, zipEntry] of Object.entries(zipContent.files)) {
                    const entryExt = filename.split('.').pop().toLowerCase();
                    if (!zipEntry.dir && ['json', 'srt', 'tsv', 'txt'].includes(entryExt) && !filename.includes('__MACOSX')) {
                        const contentStr = await zipEntry.async('string');
                        await processFileContent(contentStr, filename.split('/').pop(), entryExt); // ★ 修改：加上 await
                    }
                }
            } else if (['json', 'srt', 'tsv', 'txt'].includes(ext)) {
                // 如果是獨立的支援檔案
                const contentStr = await file.text();
                await processFileContent(contentStr, file.name, ext); // ★ 修改：加上 await
            }
        }

        if (processedCount === 0) {
            if (skippedFiles.length > 0 && typeof showCustomDialog === 'function') {
                const list = skippedFiles.slice(0, 10).map(s => escapeHtml(s)).join('<br>');
                const more = skippedFiles.length > 10 ? `<br>...等共 ${skippedFiles.length} 個檔案` : '';
                showCustomDialog({
                    title: '轉換失敗',
                    message: `找不到可支援轉換的有效資料：<br><br>${list}${more}`
                });
            }
            return showToast('轉換失敗：找不到可支援轉換的有效資料', 'error');
        }

        // 產生並下載輸出的 ZIP
        const content = await outputZip.generateAsync({ type: "blob" });
        const url = URL.createObjectURL(content);
        const a = document.createElement('a');
        a.style.display = 'none';
        a.href = url;
        a.download = `批次轉檔結果_${Date.now()}.zip`;
        document.body.appendChild(a);
        a.click();
        setTimeout(() => { document.body.removeChild(a); window.URL.revokeObjectURL(url); }, 100);

        // ★ 新增：「多個獨立音檔」格式改用「切出 N 個音檔」的訊息，比「N 個檔案」更準確
        const successMsg = targetFormat === AUDIO_OUTPUT_FORMAT
            ? `成功從 ${processedCount} 個專案切出共 ${audioFileTotalCount} 個獨立音檔`
            : `成功轉換 ${processedCount} 個檔案${removePunctuation ? '（已移除標點）' : ''}`;

        if (skippedFiles.length > 0) {
            showToast(`${successMsg}，但有 ${skippedFiles.length} 個檔案無法處理已略過`, 'normal');
        } else {
            showToast(`${successMsg}並打包下載！`, 'success');
        }

    } catch (err) {
        console.error(err);
        showToast('批次轉換過程中發生錯誤', 'error');
    }
});