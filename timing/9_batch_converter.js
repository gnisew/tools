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
            ? '僅適用於輸出 TSV、字幕檔 (SRT)、Audacity 標籤；純文字段落與專案檔 (JSON) 不可移除標點。'
            : '目前選擇的輸出格式（純文字段落／專案檔 JSON）不可移除標點。';
    }
}
batchConvertTargetFormat?.addEventListener('change', updateRemovePunctuationAvailability);
updateRemovePunctuationAvailability();

// 每次開啟視窗都恢復成預設（不勾選），避免上次的破壞性選項被不小心帶入
function resetRemovePunctuationOption() {
    if (batchRemovePunctuationCheck) batchRemovePunctuationCheck.checked = false;
    updateRemovePunctuationAvailability();
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

// ================= 執行批次處理與打包 =================
startBatchConvertBtn?.addEventListener('click', async () => {
    const files = Array.from(batchConvertInput.files);
    if (files.length === 0) return showToast('請先選擇檔案', 'error');
    if (typeof JSZip === 'undefined') return showToast('缺少 JSZip 套件，無法處理壓縮檔', 'error');

    const targetFormat = batchConvertTargetFormat.value;
    // ★ 新增：是否移除標點——必須「有勾選」且輸出格式為 TSV / SRT / Audacity 才會執行（JSON、純文字段落一律不移除）
    const removePunctuation = !!batchRemovePunctuationCheck?.checked && PUNCT_REMOVABLE_FORMATS.includes(targetFormat);
    // 決定輸出的副檔名
    let outExt = targetFormat;
    if (targetFormat === 'audacity') outExt = 'txt';

    const outputZip = new JSZip();
    let processedCount = 0;

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
        // 幫助函式：處理單一文字內容
        const processFileContent = (contentStr, filename, originalExt) => {
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
                        processFileContent(contentStr, filename.split('/').pop(), entryExt);
                    }
                }
            } else if (['json', 'srt', 'tsv', 'txt'].includes(ext)) {
                // 如果是獨立的支援檔案
                const contentStr = await file.text();
                processFileContent(contentStr, file.name, ext);
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

        if (skippedFiles.length > 0) {
            showToast(`成功轉換 ${processedCount} 個檔案${removePunctuation ? '（已移除標點）' : ''}，但有 ${skippedFiles.length} 個檔案無法解析已略過`, 'normal');
        } else {
            showToast(`成功轉換 ${processedCount} 個檔案${removePunctuation ? '（已移除標點）' : ''}並打包下載！`, 'success');
        }

    } catch (err) {
        console.error(err);
        showToast('批次轉換過程中發生錯誤', 'error');
    }
});