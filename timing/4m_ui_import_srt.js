// ================= 4m_ui_import_srt.js: 匯入 SRT 字幕檔（另含 Audacity .txt / .tsv） =================
// 問題原因：4f 的「確定載入」會把 .srt 檔轉交給隱藏的 #importSrtInput 並觸發 change，
//           但整個專案裡沒有任何檔案替 #importSrtInput（以及 #importAudacityInput）綁定 change 監聽器，
//           所以選了檔案、視窗也關了，卻什麼事都沒發生。本檔補上這兩個缺的監聽器。
//
// 行為（與匯入 JSON 一致）：
//   - 目前已有資料時，先跳出「覆蓋警告」，確認後才匯入
//   - 匯入前呼叫 saveState()，可用 Undo 還原
//   - 音檔、專案標題、跨句群組(mediaGroups)維持不動，只取代句子與時間標記
//
// 載入位置：index.html 中放在 4f 之後即可（建議放在 4l 後面）：
//   <script src="4m_ui_import_srt.js"></script>

// ---------- SRT 解析（容錯：BOM、CRLF、缺序號、毫秒位數不足、. 取代 ,、<i> 標籤） ----------
function parseSrtTimestamp(str) {
    const m = String(str).trim().match(/^(\d+):(\d{1,2}):(\d{1,2})(?:[,.](\d{1,3}))?$/);
    if (!m) return null;
    const ms = m[4] ? parseFloat('0.' + m[4]) : 0;
    return parseInt(m[1], 10) * 3600 + parseInt(m[2], 10) * 60 + parseInt(m[3], 10) + ms;
}

function makeSequentialLabel(index) {
    const group = Math.floor(index / 99);
    const num = (index % 99) + 1;
    return String.fromCharCode(65 + group) + String(num).padStart(2, '0');
}

function parseSrtText(raw) {
    const text = String(raw || '').replace(/^\uFEFF/, '').replace(/\r\n?/g, '\n');
    const blocks = text.split(/\n{2,}/);
    const items = [];
    blocks.forEach(block => {
        const lines = block.split('\n').map(l => l.trim());
        const timeIdx = lines.findIndex(l => l.includes('-->'));
        if (timeIdx === -1) return;
        const parts = lines[timeIdx].split('-->');
        if (parts.length < 2) return;
        // 結束時間後面有時會接座標（如 X1:0 X2:100），只取第一段
        const start = parseSrtTimestamp(parts[0]);
        const end = parseSrtTimestamp(parts[1].trim().split(/\s+/)[0]);
        if (start === null || end === null) return;
        const body = lines.slice(timeIdx + 1)
            .join(' ')
            .replace(/<[^>]+>/g, '')      // <i> <b> <font ...>
            .replace(/\{\\[^}]*\}/g, '')  // {\an8} 等 ASS 樣式
            .replace(/\s+/g, ' ')
            .trim();
        items.push({ start, end, text: body });
    });
    items.sort((a, b) => a.start - b.start);
    return items.map((it, i) => ({ label: makeSequentialLabel(i), start: it.start, end: it.end, text: it.text }));
}

// ---------- 套用到專案 ----------
function applyImportedItems(items, sourceName) {
    if (typeof saveState === 'function') saveState();

    const labels = [];
    const textMap = {};
    const timeMap = {};
    items.forEach(it => {
        labels.push(it.label);
        textMap[it.label] = it.text;
        timeMap[it.label] = {
            start: parseFloat(it.start.toFixed(3)),
            end: (it.end === null || it.end === undefined) ? null : parseFloat(it.end.toFixed(3))
        };
    });

    allLabelsOrdered = labels;
    sentenceTextMap = textMap;
    timeDataMap = timeMap;
    saveToStorage();

    if (typeof renderSentenceList === 'function') renderSentenceList();
    if (typeof renderAllRegions === 'function') renderAllRegions();
    if (typeof isScriptMode !== 'undefined' && isScriptMode && typeof populateScriptEditor === 'function') {
        populateScriptEditor();
    }
    showToast(`已匯入「${sourceName}」，共 ${items.length} 句`, 'success');
}

function importSubtitleFile(file, kind) {
    const reader = new FileReader();
    reader.onload = (ev) => {
        let items = [];
        try {
            const text = String(ev.target.result || '');
            if (kind === 'srt') {
                items = parseSrtText(text);
            } else if (kind === 'txt') {
                items = parseAudacityText(text);
            } else if (typeof parseAnyToStandard === 'function') {
                // 9_batch_converter.js 的萬能解析器：tsv = 本系統匯出的 TSV
                items = parseAnyToStandard(text, kind, file.name);
            }
        } catch (err) {
            console.error(err);
        }
        if (!items.length) {
            return showToast('匯入失敗：找不到可用的時間標記，請確認檔案格式', 'error');
        }
        applyImportedItems(items, file.name);
    };
    reader.readAsText(file, 'UTF-8');
}

function handleSubtitleInput(e, kind) {
    const file = e.target.files && e.target.files[0];
    e.target.value = '';
    if (!file) return;

    const run = () => importSubtitleFile(file, kind);
    if (allLabelsOrdered.length > 0 && typeof showCustomDialog === 'function') {
        showCustomDialog({
            title: '覆蓋警告',
            message: '匯入字幕檔將會<span style="color:#C62828; font-weight:bold;">覆蓋目前的句子與時間標記</span>（音檔不受影響），確定要繼續嗎？',
            onConfirm: run
        });
    } else {
        run();
    }
}

document.getElementById('importSrtInput')?.addEventListener('change', (e) => handleSubtitleInput(e, 'srt'));

// Audacity 輸入框：依實際副檔名決定用 Audacity(txt) 或 TSV 解析
document.getElementById('importAudacityInput')?.addEventListener('change', (e) => {
    const file = e.target.files && e.target.files[0];
    const ext = file ? file.name.split('.').pop().toLowerCase() : 'txt';
    handleSubtitleInput(e, ext === 'tsv' ? 'tsv' : 'txt');
});

// ================= ★ 貼上文字解析：支援直接貼上 SRT 文字 ★ =================
// 做法：把 SRT 文字轉成系統既有的 TSV 格式（標籤<Tab>開始<Tab>結束<Tab>文字），
//       之後完全沿用 executeParsing() 內「帶時間的 TSV → 整份覆寫」的既有流程。
function looksLikeSrt(text) {
    return /\d+:\d{1,2}:\d{1,2}[,.]\d{1,3}\s*-->\s*\d+:\d{1,2}:\d{1,2}/.test(String(text || ''));
}

function srtToTsv(text) {
    return parseSrtText(text)
        .map(it => `${it.label}\t${it.start.toFixed(3)}\t${it.end.toFixed(3)}\t${it.text.replace(/\t/g, ' ')}`)
        .join('\n');
}

// ================= ★ Audacity 標籤文字（.txt）：開始<Tab>結束<Tab>標籤文字 ★ =================
// Audacity 匯出的標籤檔每行 = 開始秒數 \t 結束秒數 \t 文字；
// 若有頻率範圍行（以反斜線 \ 開頭）一律略過。開始＝結束的「點標籤」，結束時間留空，
// 之後由系統用下一個標記的開始時間自動推算。
const AUDACITY_LINE_RE = /^-?\d+(?:\.\d+)?\t-?\d+(?:\.\d+)?(?:\t|$)/;

function looksLikeAudacity(text) {
    const lines = String(text || '').replace(/^\uFEFF/, '').split(/\r?\n/)
        .filter(l => l.trim() !== '' && !l.startsWith('\\'));
    return lines.length > 0 && lines.every(l => AUDACITY_LINE_RE.test(l));
}

function parseAudacityText(raw) {
    const items = [];
    String(raw || '').replace(/^\uFEFF/, '').split(/\r?\n/).forEach(line => {
        if (line.trim() === '' || line.startsWith('\\') || !AUDACITY_LINE_RE.test(line)) return;
        const parts = line.split('\t');
        const start = parseFloat(parts[0]);
        const end = parseFloat(parts[1]);
        items.push({
            start,
            end: end > start ? end : null,
            text: parts.slice(2).join(' ').replace(/\s+/g, ' ').trim()
        });
    });
    items.sort((a, b) => a.start - b.start);
    return items.map((it, i) => ({ label: makeSequentialLabel(i), start: it.start, end: it.end, text: it.text }));
}

function itemsToTsv(items) {
    return items
        .map(it => `${it.label}\t${it.start.toFixed(3)}\t${it.end === null ? '' : it.end.toFixed(3)}\t${it.text.replace(/\t/g, ' ')}`)
        .join('\n');
}

// ---------- 給貼上文字解析使用的統一入口（SRT 或 Audacity 都能辨識） ----------
function looksLikeTimedText(text) {
    return looksLikeSrt(text) || looksLikeAudacity(text);
}
function timedTextToTsv(text) {
    return looksLikeSrt(text) ? srtToTsv(text) : itemsToTsv(parseAudacityText(text));
}
