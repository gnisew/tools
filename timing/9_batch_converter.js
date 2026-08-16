// ================= 9_batch_converter.js: 萬能批次轉檔引擎 =================

const sidebarBatchConvertBtn = document.getElementById('sidebarBatchConvertBtn');
const batchConvertModalOverlay = document.getElementById('batchConvertModalOverlay');
const closeBatchConvertBtn = document.getElementById('closeBatchConvertBtn');
const startBatchConvertBtn = document.getElementById('startBatchConvertBtn');
const batchConvertInput = document.getElementById('batchConvertInput');
const batchConvertTargetFormat = document.getElementById('batchConvertTargetFormat');

// 開關視窗邏輯
sidebarBatchConvertBtn?.addEventListener('click', () => {
    document.getElementById('closeSidebarBtn')?.click(); // 關閉側邊欄
    setTimeout(() => {
        batchConvertModalOverlay.classList.add('show');
        document.body.style.overflow = 'hidden';
    }, 300);
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
function buildStandardToAny(items, targetExt, originalFilename) {
    let content = "";
    
    if (items.length === 0) return null;

    if (targetExt === 'tsv') {
        content = "標籤\t開始時間\t結束時間\t文字內容\n";
        items.forEach(item => {
            content += `${item.label}\t${item.start}\t${item.end !== null ? item.end : ''}\t${item.text}\n`;
        });
    } 
    else if (targetExt === 'srt') {
        items.forEach((item, index) => {
            if (item.end !== null) {
                // 利用 1_globals.js 中的 formatSrtTime
                const sStart = typeof formatSrtTime === 'function' ? formatSrtTime(item.start) : "00:00:00,000";
                const sEnd = typeof formatSrtTime === 'function' ? formatSrtTime(item.end) : "00:00:00,000";
                content += `${index + 1}\n${sStart} --> ${sEnd}\n${item.text}\n\n`;
            }
        });
    } 
    else if (targetExt === 'audacity') {
        items.forEach(item => {
            content += `${item.start}\t${item.end !== null ? item.end : item.start}\t${item.text || item.label}\n`;
        });
    } 
    else if (targetExt === 'txt') {
        // 純文字段落 (每句一行)
        items.forEach(item => {
            if (item.text) content += `${item.text}\n`;
        });
    }
    else if (targetExt === 'json') {
        const outData = {
            version: "1.0",
            title: originalFilename.replace(/\.[^/.]+$/, ""),
            allLabelsOrdered: [],
            sentenceTextMap: {},
            timeDataMap: {}
        };
        items.forEach(item => {
            outData.allLabelsOrdered.push(item.label);
            outData.sentenceTextMap[item.label] = item.text;
            outData.timeDataMap[item.label] = { start: item.start, end: item.end };
        });
        content = JSON.stringify(outData, null, 2);
    }
    
    return content;
}

// ================= 執行批次處理與打包 =================
startBatchConvertBtn?.addEventListener('click', async () => {
    const files = Array.from(batchConvertInput.files);
    if (files.length === 0) return showToast('請先選擇檔案', 'error');
    if (typeof JSZip === 'undefined') return showToast('缺少 JSZip 套件，無法處理壓縮檔', 'error');

    const targetFormat = batchConvertTargetFormat.value;
    // 決定輸出的副檔名
    let outExt = targetFormat;
    if (targetFormat === 'audacity') outExt = 'txt';

    const outputZip = new JSZip();
    let processedCount = 0;

    batchConvertModalOverlay.classList.remove('show');
    document.body.style.overflow = '';
    showToast('開始批次轉換，請稍候...', 'normal');

    try {
        // 幫助函式：處理單一文字內容
        const processFileContent = (contentStr, filename, originalExt) => {
            const items = parseAnyToStandard(contentStr, originalExt, filename);
            if (items.length > 0) {
                const outputStr = buildStandardToAny(items, targetFormat, filename);
                if (outputStr) {
                    const baseName = filename.replace(/\.[^/.]+$/, ""); // 去除舊副檔名
                    outputZip.file(`${baseName}.${outExt}`, outputStr);
                    processedCount++;
                }
            }
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

        showToast(`成功轉換 ${processedCount} 個檔案並打包下載！`, 'success');

    } catch (err) {
        console.error(err);
        showToast('批次轉換過程中發生錯誤', 'error');
    }
});