// 符號集合
const PUNCTS = new Set([
    '，', '。', '、', '；', '：', '！', '？', '（', '）', '「', '」', '『', '』', '《', '》', '〈', '〉', '—', '…', '－', '‧', '·', '﹑',
    ',', '.', ';', ':', '!', '?', '(', ')', '[', ']', '{', '}', '"', "'", '-', '…'
]);
const ENDERS = new Set(['。', '！', '？', '?', '!', '．', '.', '，', ',']);
const WHITESPACES = new Set([' ', '\t', '\u3000']);

// DOM 快捷
const $ = (sel) => document.querySelector(sel);
const hanziInput = $('#hanziInput');
const pinyinInput = $('#pinyinInput');
const btnProcess = $('#btnProcess');
const btnClear = $('#btnClear');
const btnSample = $('#btnSample');
const resultArea = $('#resultArea');

const btnToneHelp = $('#btnToneHelp');
const toneHelpModal = $('#toneHelpModal');
const btnCloseToneHelp = $('#btnCloseToneHelp');
const btnToggleToneConverter = $('#btnToggleToneConverter');
const toneConverterMenu = $('#toneConverterMenu');
const btnConvertLetterTone = $('#btnConvertLetterTone');
const btnConvertNumberTone = $('#btnConvertNumberTone');

// 模式切換
const btnModeView = document.getElementById('btnModeView');
const btnModeEdit = document.getElementById('btnModeEdit');

// 問題導覽
const issueBar = document.getElementById('issueBar');
const btnPrev = document.getElementById('btnPrev');
const btnNext = document.getElementById('btnNext');
const issueIndexText = document.getElementById('issueIndex');

// 複製/下載主按鈕
const btnPrimary = document.getElementById('btnPrimary');
const menuMore = document.getElementById('menuMore');
const actCopy = document.getElementById('actCopy');
const actDownload = document.getElementById('actDownload');

// 字級
const btnTypography = document.getElementById('btnTypography');
const typoPopover = document.getElementById('typoPopover');
const btnResetFont = document.getElementById('btnResetFont');
const fontVal = document.getElementById('fontVal');
const fontShow = document.getElementById('fontShow');
const rtShow = document.getElementById('rtShow');

// 狀態
let CC_SEG = {
    hSegs: [],
    pSegRaws: [],
    map: []
};
let PROBLEMS = [];
let problemIdx = -1;
let mode = 'view'; // 'view' | 'edit'
const DEFAULT_FONT = 18;
const DEFAULT_RT = 0.68;
let fontSize = DEFAULT_FONT;
let rtScale = DEFAULT_RT;

// 工具
const toCharArray = (str) => Array.from(str || '');
const isPunct = (ch) => PUNCTS.has(ch);
const isWhitespace = (ch) => WHITESPACES.has(ch);
const isLineBreak = (ch) => ch === '\r' || ch === '\n';

// 切分：漢字（依句末/逗號/換行）
function segmentHanziByClauses(str) {
    const segs = [];
    let buf = '';
    for (const ch of toCharArray(str || '')) {
        if (isLineBreak(ch)) {
            if (buf) {
                segs.push({
                    type: 'seg',
                    text: buf
                });
                buf = '';
            }
            segs.push({
                type: 'br'
            });
            continue;
        }
        buf += ch;
        if (isPunct(ch) && ENDERS.has(ch)) {
            segs.push({
                type: 'seg',
                text: buf
            });
            buf = '';
        }
    }
    if (buf) segs.push({
        type: 'seg',
        text: buf
    });
    return segs;
}

// 切分：拼音 RAW（依句末/逗號/換行，保留原標點與空白）
function segmentPinyinRawByClauses(str) {
    const segs = [];
    let buf = '';
    for (const ch of toCharArray(str || '')) {
        if (isLineBreak(ch)) {
            if (buf.length) {
                segs.push({
                    type: 'seg',
                    text: buf.trim()
                });
                buf = '';
            }
            segs.push({
                type: 'br'
            });
            continue;
        }
        buf += ch;
        if (isPunct(ch) && ENDERS.has(ch)) {
            segs.push({
                type: 'seg',
                text: buf.trim()
            });
            buf = '';
        }
    }
    if (buf.length) segs.push({
        type: 'seg',
        text: buf.trim()
    });
    return segs;
}

// 斷詞：拼音音節（不含標點/換行）
function tokenizeSyls(raw) {
    const syls = [];
    let token = '';
    for (const ch of toCharArray(raw || '')) {
        if (isLineBreak(ch) || isWhitespace(ch) || isPunct(ch)) {
            if (token.trim()) {
                syls.push(token.trim());
                token = '';
            }
            continue;
        }
        token += ch;
    }
    if (token.trim()) syls.push(token.trim());
    return syls;
}

/**
 * 切分漢字字串，將連續的英數字元視為一個詞
 * e.g., "臺灣123客語AI" -> ["臺", "灣", "123", "客", "語", "AI"]
 * @param {string} text - 原始漢字字串
 * @returns {string[]} 包含漢字、英數字詞、標點的陣列
 */
function tokenizeHanziWithAlphanum(text) {
    if (!text) return [];
    // 分割規則：匹配連續的英數字元，或任何單一字元
    const regex = /([a-zA-Z0-9]+|.)/g;
    return text.match(regex) || [];
}

/**
 * 帶分隔符號的拼音斷詞：將字串切分為音節和分隔符號的陣列
 * e.g., "kon giˇ, maˇ voi." -> ["kon", " ", "giˇ", ", ", "maˇ", " ", "voi", "."]
 * @param {string} raw - 原始拼音字串
 * @returns {string[]} 包含音節和分隔符號的陣列
 */
function tokenizePinyinWithDelimiters(raw) {
    if (!raw) return [];
    // 分割規則：在 (音節字元) 和 (非音節字元) 的邊界切開
    const tokens = raw.match(/([a-zA-Z0-9\u0300-\u036f]+|[^a-zA-Z0-9\u0300-\u036f]+)/g);
    return tokens || [];
}

/**
 * 判斷一個 token 是否為音節 (而不是純粹的空格或標點)
 * @param {string} token
 * @returns {boolean}
 */
function isSyllableToken(token) {
    // 規則：只要包含任何一個字母或數字，就視為音節
    return /[a-zA-Z0-9]/.test(token);
}


// 主渲染：依模式決定是否顯示警示與編輯
function alignByClauses({
    hanzi,
    pinyin,
    showWarnings = false,
    allowEdit = false,
    mode = 'view'
}) {
    const container = document.createElement('div');
    container.className = 'line-wrap';

    // 【核心修改】智能判斷機制
    // 1. 先對兩邊的輸入進行分段
    const hSegs = segmentHanziByClauses(hanzi || '');
    const pSegRaws = segmentPinyinRawByClauses(pinyin || '');

    // 2. 計算實際的文字段落數量 (不含純換行)
    const hanziClauseCount = hSegs.filter(s => s.type === 'seg').length;
    const pinyinClauseCount = pSegRaws.filter(s => s.type === 'seg').length;

    // 3. 根據段落數是否相等，選擇不同的處理模式
    if (hanziClauseCount > 0 && hanziClauseCount === pinyinClauseCount) {
        // --- 模式一：段落數相等，採用精確的「逐段比對」 ---
        CC_SEG = { hSegs, pSegRaws, map: [] };
        let pj = 0;
        let prj = 0;
        let hIndex = 0;

        for (const hSeg of hSegs) {
            if (hSeg.type === 'br') {
                container.appendChild(document.createElement('br'));
                while (pj < pSegRaws.length && pSegRaws[pj].type === 'br') pj++;
                while (prj < pSegRaws.length && pSegRaws[prj].type === 'br') prj++;
                continue;
            }

            while (pj < pSegRaws.length && pSegRaws[pj].type === 'br') pj++;
            while (prj < pSegRaws.length && pSegRaws[prj].type === 'br') prj++;

            const pRawSeg = (prj < pSegRaws.length && pSegRaws[prj].type === 'seg') ? pSegRaws[prj] : { type: 'seg', text: '' };
            const pSegSyls = tokenizeSyls(pRawSeg.text);

            if (pj < pSegRaws.length && pSegRaws[pj].type === 'seg') pj++;
            if (prj < pSegRaws.length && pSegRaws[prj].type === 'seg') {
                CC_SEG.map.push({ hIndex, pIndex: prj });
                prj++;
            }

            const clause = document.createElement('span');
            clause.className = 'clause';
            clause.dataset.index = String(hIndex);

            if (allowEdit) {
                const editBtn = document.createElement('button');
                editBtn.type = 'button';
                editBtn.className = 'edit-btn';
                editBtn.innerHTML = '<span class="material-symbols-outlined" style="font-size:18px;color:#334155">edit</span>';
                clause.appendChild(editBtn);
            }

            const hTokens = tokenizeHanziWithAlphanum(hSeg.text);
            let si = 0, clauseHanCount = 0, clausePyCount = 0;

            for (const token of hTokens) {
                if (token.length === 1 && (isWhitespace(token) || isPunct(token))) {
                    const span = document.createElement('span');
                    span.className = 'glyph punct';
                    span.textContent = token;
                    clause.appendChild(span);
                    continue;
                }
                
                clauseHanCount++;
                const py = si < pSegSyls.length ? pSegSyls[si] : null;

                if (py && token === py && /[a-zA-Z0-9]/.test(token)) {
                    const span = document.createElement('span');
                    span.className = 'glyph';
                    span.textContent = token;
                    clause.appendChild(span);
                    si++;
                    clausePyCount++;
                } else {
                    const ruby = document.createElement('ruby');
                    ruby.className = 'glyph';
                    const rt = document.createElement('rt');
                    const rb = document.createElement('rb');
                    rb.textContent = token;
                    if (py) {
                        si++;
                        clausePyCount++;
                        rt.textContent = py;
                    } else {
                        if (showWarnings) { ruby.classList.add('missing'); rt.textContent = ''; if (mode === 'edit') ruby.title = '缺少對應的拼音'; }
                        else { rt.textContent = ''; }
                    }
                    ruby.appendChild(rt);
                    ruby.appendChild(rb);
                    clause.appendChild(ruby);
                }
            }

            if (showWarnings && si < pSegSyls.length) {
                clausePyCount += (pSegSyls.length - si);
                const extraRuby = document.createElement('ruby');
                extraRuby.className = 'glyph extra';
                if (mode === 'edit') extraRuby.title = '多餘的拼音';
                const rt = document.createElement('rt');
                rt.textContent = pSegSyls.slice(si).join(' ');
                const rb = document.createElement('rb');
                rb.innerHTML = '&nbsp;';
                extraRuby.appendChild(rt);
                extraRuby.appendChild(rb);
                const punctsInClause = Array.from(clause.querySelectorAll('.punct'));
                const lastPunct = punctsInClause.length > 0 ? punctsInClause[punctsInClause.length - 1] : null;
                if (lastPunct) { clause.insertBefore(extraRuby, lastPunct); }
                else { clause.appendChild(extraRuby); }
            }

            if (showWarnings && clauseHanCount !== clausePyCount) {
                clause.classList.add('clause-warn');
                if (mode === 'edit') clause.title = `片段配對異常：字數 ${clauseHanCount} ≠ 拼音 ${clausePyCount}`;
            }

            container.appendChild(clause);
            hIndex++;
        }
    } else {
        // --- 模式二：段落數不相等，啟用「連續標註」 ---
        CC_SEG = {
            hSegs: [{ type: 'seg', text: hanzi }],
            pSegRaws: [{ type: 'seg', text: pinyin }],
            map: [{ hIndex: 0, pIndex: 0 }]
        };

        const hTokens = tokenizeHanziWithAlphanum(hanzi || '');
        const pSegSyls = tokenizeSyls(pinyin || '');
        const clause = document.createElement('span');
        clause.className = 'clause';
        clause.dataset.index = '0';

        if (allowEdit) {
            const editBtn = document.createElement('button');
            editBtn.type = 'button';
            editBtn.className = 'edit-btn';
            editBtn.innerHTML = '<span class="material-symbols-outlined" style="font-size:18px;color:#334155">edit</span>';
            clause.appendChild(editBtn);
        }

        let si = 0;
        let clauseHanCount = 0;
        const clausePyCountTarget = pSegSyls.length;

        for (const token of hTokens) {
            if (token === '\n' || token === '\r') {
                clause.appendChild(document.createElement('br'));
                continue;
            }
            if (token.length === 1 && (isWhitespace(token) || isPunct(token))) {
                const span = document.createElement('span');
                span.className = 'glyph punct';
                span.textContent = token;
                clause.appendChild(span);
                continue;
            }
            
            clauseHanCount++;
            const py = si < pSegSyls.length ? pSegSyls[si] : null;

            if (py && token === py && /[a-zA-Z0-9]/.test(token)) {
                const span = document.createElement('span');
                span.className = 'glyph';
                span.textContent = token;
                clause.appendChild(span);
                si++;
            } else {
                const ruby = document.createElement('ruby');
                ruby.className = 'glyph';
                const rt = document.createElement('rt');
                const rb = document.createElement('rb');
                rb.textContent = token;
                if (py) {
                    si++;
                    rt.textContent = py;
                } else {
                    if (showWarnings) { ruby.classList.add('missing'); rt.textContent = ''; if (mode === 'edit') ruby.title = '缺少對應的拼音'; }
                    else { rt.textContent = ''; }
                }
                ruby.appendChild(rt);
                ruby.appendChild(rb);
                clause.appendChild(ruby);
            }
        }

        if (showWarnings && si < pSegSyls.length) {
            const extraRuby = document.createElement('ruby');
            extraRuby.className = 'glyph extra';
            if (mode === 'edit') extraRuby.title = '多餘的拼音';
            const rt = document.createElement('rt');
            rt.textContent = pSegSyls.slice(si).join(' ');
            const rb = document.createElement('rb');
            rb.innerHTML = '&nbsp;';
            extraRuby.appendChild(rt);
            extraRuby.appendChild(rb);
            clause.appendChild(extraRuby);
        }
        
        if (showWarnings && clauseHanCount !== clausePyCountTarget) {
            clause.classList.add('clause-warn');
            if (mode === 'edit') clause.title = `整體配對異常：字數 ${clauseHanCount} ≠ 拼音 ${clausePyCountTarget}`;
        }
        container.appendChild(clause);
    }
    
    return { node: container };
}

// 主渲染：依模式決定是否顯示警示與編輯
function render() {
    // 在函式開頭加入此行，即可在標註前自動解析與拆分
    preprocessAndSplitInput();

    const hanzi = hanziInput.value;
    const pinyin = pinyinInput.value;
    const isEdit = mode === 'edit';

    const {
        node
    } = alignByClauses({
        hanzi,
        pinyin,
        showWarnings: true,
        allowEdit: isEdit,
        mode: mode
    });

    resultArea.innerHTML = '';
    resultArea.appendChild(node);

    // 模式樣式
    resultArea.classList.toggle('mode-view', !isEdit);
    resultArea.classList.toggle('mode-edit', isEdit);

    if (isEdit) attachEditHandlers();

    // 問題導覽 / 提示
    PROBLEMS = Array.from(resultArea.querySelectorAll('.clause.clause-warn'));
    problemIdx = PROBLEMS.length ? 0 : -1;

    // 先移除所有 dimmed，稍後再標記
    PROBLEMS.forEach(el => el.classList.remove('dimmed'));

    // --- START: 為錯誤的框加上點擊凸顯功能 ---
    if (isEdit) {
        PROBLEMS.forEach((problemClause, index) => {
            problemClause.style.cursor = 'pointer'; // 改變滑鼠游標，提示可點擊
            problemClause.addEventListener('click', (e) => {
                // 避免點擊到編輯按鈕時觸發
                if (e.target.closest('.edit-btn') || e.target.closest('.inline-editor')) {
                    return;
                }
                
                // 更新當前問題的索引
                problemIdx = index;
                // 更新導覽列狀態 (例如 "2/5")
                updateIssueBar();
                // 更新所有錯誤框的凸顯/淡化狀態
                PROBLEMS.forEach((el, i) => {
                    el.classList.toggle('dimmed', i !== problemIdx);
                });
            });
        });
    }
    // --- END: 為錯誤的框加上點擊凸顯功能 ---

    const hasProblems = PROBLEMS.length > 0;
    const hint = document.getElementById('issueHint');

    // 根據模式和錯誤狀態，更新問題導覽列和提示圖示的顯示狀態
    if (isEdit) {
        issueBar.classList.toggle('hidden', !hasProblems);
        hint?.classList.add('hidden');
    } else {
        issueBar.classList.add('hidden');
        hint?.classList.toggle('hidden', !hasProblems);
    }

    updateIssueBar();

    if (problemIdx >= 0) {
        if (isEdit) {
            focusProblem(problemIdx);
            // 高亮目前選取，其他淡化
            PROBLEMS.forEach((el, i) => el.classList.toggle('dimmed', i !== problemIdx));
        } else {
            PROBLEMS.forEach((el) => el.classList.add('dimmed'));
        }
    }

    applyTypography();
}

/**
 * 將組合用聲調符號 (Combining Marks) 正規化為獨立的聲調符號，
 * 並移除其前面的空格。
 * 例如：將 "gi \u030C" 轉換為 "giˇ"。
 * @param {string} text - 原始輸入字串
 * @returns {string} - 經過正規化處理後的字串
 */
function normalizeToneMarks(text) {
    if (!text) return '';
    return text
        // 處理 acute accent (ˊ), e.g., á
        .replace(/\s*\u0301/g, 'ˊ')
        // 處理 caron (ˇ), e.g., ǎ
        .replace(/\s*\u030C/g, 'ˇ')
        // 處理 grave accent (ˋ), e.g., à
        .replace(/\s*\u0300/g, 'ˋ');
}

/**
 * 預處理輸入框內容。如果拼音區為空，且漢字區包含 "字(pinyin)" 格式，
 * 或為「拼音\n漢字」的交錯格式，則自動解析並將內容拆分到兩個輸入框中。
 */
function preprocessAndSplitInput() {
    // 1. 先對漢字區的內容進行聲調正規化 (e.g., "gi \u030C" -> "giˇ")
    const normalizedHanzi = normalizeToneMarks(hanziInput.value);
    const pinyinText = pinyinInput.value;

    // 如果拼音區已經有內容，則不進行任何自動解析
    if (pinyinText.trim() !== '') {
        // 僅更新漢字區為正規化後的版本，以防使用者輸入了組合聲調符號
        hanziInput.value = normalizedHanzi;
        return;
    }

    // --- 解析模式一：處理 "漢字(pinyin)" 格式 ---
    if (normalizedHanzi.includes('(') && normalizedHanzi.includes(')')) {
        const hanziParts = [];
        const pinyinParts = [];
        const regex = /(.)\s*\(([^)]+)\)|([^()\s])/g;
        
        let match;
        while ((match = regex.exec(normalizedHanzi)) !== null) {
            if (match[1] && match[2]) { // 匹配 "字(音)"
                hanziParts.push(match[1]);
                pinyinParts.push(match[2].trim());
            } else if (match[3]) { // 匹配獨立字元 (如標點)
                const char = match[3];
                hanziParts.push(char);
                if (PUNCTS.has(char)) {
                    pinyinParts.push(char);
                }
            }
        }

        // 如果成功解析，則更新輸入框
        if (hanziParts.length > 0) {
            hanziInput.value = hanziParts.join('');
            let formattedPinyin = pinyinParts.join(' ');
            formattedPinyin = formattedPinyin.replace(/\s+([，。、；：！？.,;:!?])/g, '$1');
            pinyinInput.value = formattedPinyin;
        } else {
            hanziInput.value = normalizedHanzi; // 解析失敗，還原為正規化內容
        }
        return; // 完成模式一，退出
    }

    // --- 解析模式二：處理「拼音\n漢字」交錯格式 (您要求的新功能) ---
    if (normalizedHanzi.includes('\n')) {
        const lines = normalizedHanzi.split('\n')
                                    .map(line => line.trim())
                                    .filter(line => line.length > 0);

        const hanziParts = [];
        const pinyinParts = [];
        let i = 0;

        while (i < lines.length) {
            const currentLine = lines[i];

            // 如果是獨立標點，則同時加入兩邊
            if (currentLine.length === 1 && PUNCTS.has(currentLine)) {
                hanziParts.push(currentLine);
                pinyinParts.push(currentLine);
                i++;
                continue;
            }
            
            // 否則，視為「拼音」與「漢字」的配對
            const pinyin = currentLine;
            const hanzi = (i + 1 < lines.length) ? lines[i + 1] : null;

            if (hanzi !== null) {
                pinyinParts.push(pinyin);
                hanziParts.push(hanzi);
                i += 2; // 處理完一對，前進兩行
            } else {
                i++; // 處理結尾落單的情況，避免無限迴圈
            }
        }

        // 如果成功解析，則更新輸入框
        if (hanziParts.length > 0) {
            hanziInput.value = hanziParts.join('');
            
            let formattedPinyin = pinyinParts.join(' ');
            // 清理標點前的多餘空格
            formattedPinyin = formattedPinyin.replace(/\s+([，。、；：！？.,;:!?])/g, '$1');
            // 將常見的全形標點轉為半形，以符合期望的輸出格式
            formattedPinyin = formattedPinyin.replace(/，/g, ',').replace(/？/g, '?').replace(/。/g, '.').replace(/！/g, '!').replace(/；/g, ';').replace(/：/g, ':').replace(/、/g, ',');

            pinyinInput.value = formattedPinyin;
        } else {
            hanziInput.value = normalizedHanzi; // 解析失敗，還原
        }
        return; // 完成模式二，退出
    }

    // 如果所有解析模式都不匹配，僅更新漢字區為正規化後的版本
    hanziInput.value = normalizedHanzi;
}


function updateIssueBar() {
    const total = PROBLEMS.length;
    const current = problemIdx >= 0 ? problemIdx + 1 : 0;
    issueIndexText.textContent = `${current}/${total}`;
    const disabled = total === 0 || mode === 'view';
    [btnPrev, btnNext].forEach(b => {
        b.disabled = disabled;
        b.classList.toggle('opacity-40', disabled);
        b.classList.toggle('cursor-not-allowed', disabled);
    });
}

function focusProblem(idx) {
    if (idx < 0 || idx >= PROBLEMS.length) return;
    PROBLEMS.forEach(n => n.classList.remove('focus-ring'));
    const el = PROBLEMS[idx];
    el.classList.add('focus-ring');
    el.scrollIntoView({
        behavior: 'smooth',
        block: 'center'
    });
    setTimeout(() => el.classList.remove('focus-ring'), 700);
}

btnPrev?.addEventListener('click', () => {
    if (!PROBLEMS.length || mode === 'view') return;
    problemIdx = (problemIdx - 1 + PROBLEMS.length) % PROBLEMS.length;
    updateIssueBar();
    focusProblem(problemIdx);
    PROBLEMS.forEach((el, i) => el.classList.toggle('dimmed', i !== problemIdx));
});
btnNext?.addEventListener('click', () => {
    if (!PROBLEMS.length || mode === 'view') return;
    problemIdx = (problemIdx + 1) % PROBLEMS.length;
    updateIssueBar();
    focusProblem(problemIdx);
    PROBLEMS.forEach((el, i) => el.classList.toggle('dimmed', i !== problemIdx));
});

// （移除重複宣告：已集中於 bindModeControls()）
btnModeView.addEventListener('click', () => {
    mode = 'view';
    btnModeView.classList.add('active');
    btnModeEdit.classList.remove('active');
    render();
});
btnModeEdit.addEventListener('click', () => {
    mode = 'edit';
    btnModeEdit.classList.add('active');
    btnModeView.classList.remove('active');
    render();
});

// 片段內嵌編輯器（僅編輯模式）
function attachEditHandlers() {
    // --- 功能1：編輯整個子句 ---
    resultArea.querySelectorAll('.clause .edit-btn').forEach(btn => {
        btn.addEventListener('click', (e) => {
            if (mode !== 'edit') return;
            e.stopPropagation();
            closeWordEditor();
            const clause = btn.closest('.clause');
            if (!clause) return;

            const existing = clause.querySelector('.inline-editor');
            if (existing) {
                existing.remove();
                return;
            }

            const hIndex = Number(clause.dataset.index || 0);
            const mapItem = CC_SEG.map.find(m => m.hIndex === hIndex);
            const pIndex = mapItem ? mapItem.pIndex : hIndex;

            const curH = CC_SEG.hSegs.filter(s => s.type === 'seg')[hIndex]?.text || '';
            const curP = CC_SEG.pSegRaws.filter(s => s.type === 'seg')[pIndex]?.text || '';

            const editor = document.createElement('div');
            editor.className = 'inline-editor';
            editor.innerHTML = `
            <input type="text" class="ed-h" placeholder="漢字" value="${escapeAttr(curH)}">
            <input type="text" class="ed-p" placeholder="拼音（空白分隔）" value="${escapeAttr(curP)}">
            <div class="actions">
              <div class="relative mr-auto">
                <button type="button" class="btn btn-tone-toggle-editor">轉調號</button>
                <div class="tone-converter-menu-editor popover hidden drop-up">
                  <button type="button" class="btn-convert-letter">字母 > 調號</button>
                  <button type="button" class="btn-convert-number">數字 > 調號</button>
                </div>
              </div>
              <button type="button" class="btn cancel">取消</button>
              <button type="button" class="btn save">儲存</button>
            </div>
          `;
            clause.appendChild(editor);

            // 編輯器內的轉調號功能
            const pinyinField = editor.querySelector('.ed-p');
            const toggleBtn = editor.querySelector('.btn-tone-toggle-editor');
            const menu = editor.querySelector('.tone-converter-menu-editor');

            toggleBtn.addEventListener('click', (e) => {
                e.stopPropagation();
                menu.classList.toggle('hidden');
            });
            editor.querySelector('.btn-convert-letter').addEventListener('click', () => {
                pinyinField.value = convertPinyinTones(pinyinField.value, 'letter');
                menu.classList.add('hidden');
                pinyinField.focus();
            });
            editor.querySelector('.btn-convert-number').addEventListener('click', () => {
                pinyinField.value = convertPinyinTones(pinyinField.value, 'number');
                menu.classList.add('hidden');
                pinyinField.focus();
            });

            // 原有的取消功能
            editor.querySelector('.cancel').addEventListener('click', () => editor.remove());

// 儲存按鈕：採用「從資料回寫」的正確邏輯
            editor.querySelector('.save').addEventListener('click', () => {
                // 1. 獲取編輯器中的新漢字與新拼音
                const newH = editor.querySelector('.ed-h').value || '';
                const newP = pinyinField.value || '';

                // 2. 獲取當前正在編輯的句子索引 (hIndex 和 pIndex)
                // 這是關鍵一步，確保我們知道要替換哪一句
                const hIndex = Number(clause.dataset.index || 0);
                const mapItem = CC_SEG.map.find(m => m.hIndex === hIndex);
                const pIndex = mapItem ? mapItem.pIndex : hIndex;

                // 3. 使用輔助函數，以新句子替換掉舊的完整文本
                const finalHanziText = rebuildHanziWithReplace(hIndex, newH);
                const finalPinyinText = rebuildPinyinWithReplace(pIndex, newP);

                // 4. 將更新後的完整文本，直接回填到主輸入框
                hanziInput.value = finalHanziText;
                pinyinInput.value = finalPinyinText;
                
                // 5. 最後，呼叫 render() 進行統一的檢查與重新渲染
                // 這樣就能保證所有錯誤標記、狀態都是最新的
                render(); 
                toast('已更新本段，並同步輸入區');
            });
        });
    });

    // --- 功能2：點擊單一漢字/拼音進行編輯 ---
    resultArea.querySelectorAll('.clause').forEach(clause => {
        const hIndex = Number(clause.dataset.index || 0);
        clause.querySelectorAll('ruby.glyph').forEach((rubyEl, wordIndex) => {
            rubyEl.style.cursor = 'pointer';
            rubyEl.addEventListener('click', (e) => {
                if (mode !== 'edit' || e.target.closest('.word-editor')) return;
                showWordEditor(rubyEl, hIndex, wordIndex);
            });
        });
    });
}

// 關閉單詞編輯器
function closeWordEditor() {
    const existingEditor = document.querySelector('.word-editor');
    if (existingEditor) {
        existingEditor.remove();
    }
}

// 顯示單詞編輯器
function showWordEditor(rubyEl, hIndex, wordIndex) {
    closeWordEditor(); // 先關閉其他已開啟的編輯器

    const originalHanzi = rubyEl.querySelector('rb')?.textContent || '';
    const originalPinyin = rubyEl.querySelector('rt')?.textContent || '';

    const editor = document.createElement('div');
    editor.className = 'word-editor';
    editor.style.position = 'absolute';
    editor.style.zIndex = '10';

    editor.innerHTML = `
        <div class="space-y-2">
            <input type="text" class="ed-h-word" value="${escapeAttr(originalHanzi)}" placeholder="字">
            <input type="text" class="ed-p-word" value="${escapeAttr(originalPinyin)}" placeholder="音">
        </div>
        <div class="actions">
            <div class="relative mr-auto">
                <button type="button" class="btn btn-tone-toggle-editor">轉調號</button>
                <div class="tone-converter-menu-editor popover hidden drop-up" style="width:120px;">
                    <button type="button" class="btn-convert-letter">字母 > 調號</button>
                    <button type="button" class="btn-convert-number">數字 > 調號</button>
                </div>
            </div>
            <button type="button" class="btn cancel">取消</button>
            <button type="button" class="btn save">儲存</button>
        </div>
    `;

    document.body.appendChild(editor);

    const rect = rubyEl.getBoundingClientRect();
    editor.style.left = `${window.scrollX + rect.left}px`;
    editor.style.top = `${window.scrollY + rect.bottom + 8}px`;

    const pinyinField = editor.querySelector('.ed-p-word');
    pinyinField.focus();

    // 編輯器內的轉調號功能 (此部分邏輯不變)
    const toggleBtn = editor.querySelector('.btn-tone-toggle-editor');
    const menu = editor.querySelector('.tone-converter-menu-editor');
    toggleBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      menu.classList.toggle('hidden');
    });
    editor.querySelector('.btn-convert-letter').addEventListener('click', () => {
        pinyinField.value = convertPinyinTones(pinyinField.value, 'letter');
        menu.classList.add('hidden');
        pinyinField.focus();
    });
    editor.querySelector('.btn-convert-number').addEventListener('click', () => {
        pinyinField.value = convertPinyinTones(pinyinField.value, 'number');
        menu.classList.add('hidden');
        pinyinField.focus();
    });
    editor.querySelector('.cancel').addEventListener('click', (e) => {
      e.stopPropagation();
      closeWordEditor();
    });

// --- START: 採用使用者建議的「從結果回寫」新邏輯 ---
    editor.querySelector('.save').addEventListener('click', (e) => {
        e.stopPropagation();
        const newHanzi = editor.querySelector('.ed-h-word').value;
        const newPinyin = pinyinField.value.trim();

        // 1. 直接在畫面上更新被編輯的單字
        const targetRb = rubyEl.querySelector('rb');
        const targetRt = rubyEl.querySelector('rt');
        if (targetRb) targetRb.textContent = newHanzi;
        if (targetRt) targetRt.textContent = newPinyin;

        // 2. 準備從畫面結果區讀取完整的正確內容
        const hanziParts = [];
        const pinyinParts = [];
        const lineWrap = resultArea.querySelector('.line-wrap');
        
        if (lineWrap) {
            // 遍歷所有子元素 (包括 <br> 換行符)
            lineWrap.childNodes.forEach(node => {
                if (node.nodeName === 'BR') {
                    hanziParts.push('\n');
                    pinyinParts.push('\n');
                } else if (node.classList && node.classList.contains('clause')) {
                    // 遍歷一個句子 (clause) 裡的所有元素
                    node.childNodes.forEach(glyph => {
                        if (glyph.nodeName === 'RUBY') {
                            const hanzi = glyph.querySelector('rb')?.textContent || '';
                            const pinyin = glyph.querySelector('rt')?.textContent || '';
                            if (hanzi) hanziParts.push(hanzi);
                            // 即使漢字為空，也要保留拼音(處理多餘拼音的情況)
                            if (pinyin) pinyinParts.push(pinyin);

                        } else if (glyph.classList && glyph.classList.contains('punct')) {
                            const punct = glyph.textContent || '';
                            hanziParts.push(punct);
                            pinyinParts.push(punct);
                        
                        // 【核心修改】增加對純文字 span (如 'AI', '123') 的處理
                        } else if (glyph.nodeName === 'SPAN' && glyph.classList.contains('glyph') && !glyph.classList.contains('punct')) {
                            const token = glyph.textContent || '';
                            if (token) {
                                hanziParts.push(token);
                                pinyinParts.push(token); // 相同內容同時放入漢字和拼音陣列
                            }
                        }
                    });
                }
            });
        }

        // 3. 組合漢字區的最終文字
        const finalHanziText = hanziParts.join('').replace(/\n /g, '\n').trim();

        // 4. 處理拼音區的最終文字 (標點轉半形、加空格)
        const puncMap = { '，':' ,', '。':' .', '、':' ,', '；':' ;', '：':' :', '！':' !', '？':' ?' };
        let finalPinyinText = '';
        for (let i = 0; i < pinyinParts.length; i++) {
            let part = pinyinParts[i];
            
            if (part === '\n') {
                finalPinyinText += '\n';
                continue;
            }

            // 轉換標點為半形，並在前後加上空格以便後續處理
            if (puncMap[part]) {
                part = puncMap[part];
            }
            
            finalPinyinText += part;

            // 在音節後面加上空格，但如果下一個是標點或換行，則不加
            const nextPart = pinyinParts[i + 1];
            if (nextPart && nextPart !== '\n' && !puncMap[nextPart]) {
                 finalPinyinText += ' ';
            }
        }
        // 清理多餘的空格
        finalPinyinText = finalPinyinText.replace(/\s+/g, ' ').replace(/\s+([,.;:!?])/g, '$1').trim();
        
        // 5. 將整理好的文字回填到輸入框
        hanziInput.value = finalHanziText;
        pinyinInput.value = finalPinyinText;

        closeWordEditor();
        render(); // 根據新的輸入框內容，重新渲染一次結果，確保同步
        toast('內容已更新');
    });
    // --- END: 全新儲存邏輯 ---
}

// 監聽全局點擊，若點擊編輯器以外區域則關閉
document.addEventListener('click', (e) => {
    const editor = document.querySelector('.word-editor');
    if (editor && !editor.contains(e.target) && !e.target.closest('ruby.glyph')) {
        closeWordEditor();
    }
}, true);

// 重新組裝：用新的片段替換（保留原本換行）
function rebuildHanziWithReplace(hIndex, newText) {
    const parts = [];
    let idx = 0;
    for (const seg of CC_SEG.hSegs) {
        if (seg.type === 'br') {
            parts.push('\n');
            continue;
        }
        if (seg.type === 'seg') {
            parts.push(idx === hIndex ? newText : seg.text);
            idx++;
        }
    }
    return parts.join('');
}

function rebuildPinyinWithReplace(pIndex, newRaw) {
    const parts = [];
    let idx = 0;
    for (const seg of CC_SEG.pSegRaws) {
        if (seg.type === 'br') {
            parts.push('\n');
            continue;
        }
        if (seg.type === 'seg') {
            parts.push(idx === pIndex ? newRaw : seg.text);
            idx++;
        }
    }
    return parts.join('').replace(/\s+\n/g, '\n');
}

// 安全注入 input 值
function escapeAttr(str) {
    return String(str || '').replace(/&/g, '&amp;').replace(/"/g, '&quot;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}

// 調號轉寫（結果區）
function convertTonesInResult() {
    const rts = resultArea.querySelectorAll('rt');
    if (!rts.length) render();
    resultArea.querySelectorAll('rt').forEach(rt => {
        rt.textContent = convertToneMarks(rt.textContent);
    });
}

function convertToneMarks(str) {
    return (str || '')
        .replace(/([aeioumngbd])(ˊ)/g, '$1 \u0301')
        .replace(/([aeioumngbd])(ˇ)/g, '$1 \u030C')
        .replace(/([aeioumngbd])(ˋ)/g, '$1 \u0300')
        .replace(/([aeioumngbd])\^/g, '$1ˆ')
        .replace(/([aeioumngbd])\+/g, '$1⁺');
}

// 僅轉寫指定節點內的 rt，不影響畫面上的結果區
function convertTonesInNode(root) {
    if (!root) return;
    root.querySelectorAll('rt').forEach(rt => {
        rt.textContent = convertToneMarks(rt.textContent);
    });
}

// 字級調整
function applyTypography() {
    resultArea.style.fontSize = fontSize + 'px';
    resultArea.style.setProperty('--rt-scale', String(rtScale));
    if (fontVal) fontVal.textContent = String(fontSize);
    if (fontShow) fontShow.textContent = String(fontSize);
    if (rtShow) rtShow.textContent = String(rtScale.toFixed(2)).replace(/\.?0+$/, '');
}

function clamp(v, min, max, step = 1) {
    const n = Math.round(v / step) * step;
    return Math.min(max, Math.max(min, n));
}

// 字級彈窗
btnTypography.addEventListener('click', (e) => {
    e.stopPropagation();
    typoPopover.classList.remove('drop-up');
    typoPopover.classList.toggle('hidden');
    if (!typoPopover.classList.contains('hidden')) {
        const rect = typoPopover.getBoundingClientRect();
        if (rect.bottom > window.innerHeight) {
            typoPopover.classList.add('drop-up');
        }
    }
});
document.addEventListener('click', (e) => {
    if (!typoPopover.classList.contains('hidden')) {
        const inside = typoPopover.contains(e.target) || btnTypography.contains(e.target);
        if (!inside) typoPopover.classList.add('hidden');
    }
});
typoPopover.addEventListener('click', (e) => {
    const t = e.target;
    if (!(t instanceof HTMLElement)) return;
    if (t.hasAttribute('data-inc')) {
        const type = t.getAttribute('data-inc');
        if (type === 'font') {
            fontSize = clamp(fontSize + 1, 12, 32);
            applyTypography();
        }
        if (type === 'rt') {
            rtScale = clamp(rtScale + 0.02, 0.50, 1.00, 0.01);
            applyTypography();
        }
    }
    if (t.hasAttribute('data-dec')) {
        const type = t.getAttribute('data-dec');
        if (type === 'font') {
            fontSize = clamp(fontSize - 1, 12, 32);
            applyTypography();
        }
        if (type === 'rt') {
            rtScale = clamp(rtScale - 0.02, 0.50, 1.00, 0.01);
            applyTypography();
        }
    }
});
btnResetFont.addEventListener('click', () => {
    fontSize = DEFAULT_FONT;
    rtScale = DEFAULT_RT;
    applyTypography();
});

// 綁定模式切換與提示（集中一次綁定，避免重複宣告）
(function bindModeControls() {
    const btnModeView = document.getElementById('btnModeView');
    const btnModeEdit = document.getElementById('btnModeEdit');
    const issueHint = document.getElementById('issueHint');
    btnModeView?.addEventListener('click', () => {
        mode = 'view';
        btnModeView.classList.add('active');
        btnModeEdit?.classList.remove('active');
        render();
    });
    btnModeEdit?.addEventListener('click', () => {
        mode = 'edit';
        btnModeEdit.classList.add('active');
        btnModeView?.classList.remove('active');
        render();
    });
    // 檢視模式提示：有錯誤 → 切到編輯並定位第一個
    issueHint?.addEventListener('click', () => {
        mode = 'edit';
        btnModeEdit?.classList.add('active');
        btnModeView?.classList.remove('active');
        render();
        if (PROBLEMS.length) {
            problemIdx = 0;
            updateIssueBar();
            focusProblem(problemIdx);
            PROBLEMS.forEach((el, i) => el.classList.toggle('dimmed', i !== problemIdx));
        }
    });
})();

// 事件
btnProcess.addEventListener('click', render);
document.getElementById('btnToneConvert')?.addEventListener('click', () => {
    convertTonesInResult();
    toast('已轉寫結果區的調號');
});

btnClear.addEventListener('click', () => {
    hanziInput.value = '';
    pinyinInput.value = '';
    resultArea.innerHTML = '<div class="text-slate-400 text-sm">標註結果會出現在這裡…</div>';
    PROBLEMS = [];
    problemIdx = -1;
    issueBar.classList.add('hidden');
    updateIssueBar();
});

// 主按鈕：預設「複製標註」；點小三角展開選單（自動往上展開避免超出）
btnPrimary.addEventListener('click', async (e) => {
    const iconArrow = e.target.closest('.material-symbols-outlined');
    if (iconArrow && iconArrow.textContent.trim() === 'arrow_drop_down') {
        e.preventDefault();
        toggleMenuMore();
        return;
    }
    await copyAnnotated();
});

function toggleMenuMore() {
    // 重置方向
    menuMore.style.bottom = 'auto';
    menuMore.style.top = '100%';
    menuMore.style.marginTop = '8px';
    menuMore.style.marginBottom = '0';
    menuMore.classList.toggle('hidden');
    if (!menuMore.classList.contains('hidden')) {
        const rect = menuMore.getBoundingClientRect();
        if (rect.bottom > window.innerHeight) {
            // 往上展開
            menuMore.style.top = 'auto';
            menuMore.style.bottom = '100%';
            menuMore.style.marginTop = '0';
            menuMore.style.marginBottom = '8px';
        }
    }
}

document.addEventListener('click', (e) => {
    const within = e.target.closest('#menuMore') || e.target.closest('#btnPrimary');
    if (!within) menuMore.classList.add('hidden');
});

// 新選單：複製標註（預設）
const actCopyAnnotated = document.getElementById('actCopyAnnotated');
actCopyAnnotated.addEventListener('click', async () => {
    await copyAnnotated();
    menuMore.classList.add('hidden');
});

// 複製HTML（永遠以檢視模式渲染出的內容）
actCopy.addEventListener('click', async () => {
    const {
        node
    } = alignByClauses({
        hanzi: hanziInput.value,
        pinyin: pinyinInput.value,
        showWarnings: false,
        allowEdit: false
    });
    const wrap = document.createElement('div');
    wrap.appendChild(node);
    const html = wrap.innerHTML;
    try {
        await navigator.clipboard.writeText(html);
        toast('已複製檢視模式的 HTML！');
    } catch {
        fallbackDownload('result.html', html);
    }
    menuMore.classList.add('hidden');
});

// 下載HTML（永遠以檢視模式渲染出的內容）
actDownload.addEventListener('click', () => {
    const {
        node
    } = alignByClauses({
        hanzi: hanziInput.value,
        pinyin: pinyinInput.value,
        showWarnings: false,
        allowEdit: false
    });
    const wrap = document.createElement('div');
    wrap.appendChild(node);
    const exportHtml = buildExportHtml({
        body: wrap.innerHTML,
        fontSize: '14pt',
        rtScale: getComputedStyle(resultArea).getPropertyValue('--rt-scale') || '0.68'
    });
    fallbackDownload('hakka-annotated.html', exportHtml);
    menuMore.classList.add('hidden');
});

// 功能：複製標註（永遠以檢視模式的內容為基準）
async function copyAnnotated() {
    // 以重新渲染的檢視模式內容為輸出來源
    const hanzi = hanziInput.value;
    const pinyin = pinyinInput.value;
    const {
        node
    } = alignByClauses({
        hanzi,
        pinyin,
        showWarnings: false,
        allowEdit: false
    });
    const tempWrap = document.createElement('div');
    tempWrap.appendChild(node);

    // 轉寫調號（僅輸出）
    convertTonesInNode(tempWrap);

    // 相鄰 ruby 插入不換行空白
    const rubies = tempWrap.querySelectorAll('ruby');
    rubies.forEach((ruby, i) => {
        const next = ruby.nextSibling;
        if (next && next.nodeType === Node.ELEMENT_NODE && next.tagName === 'RUBY') {
            ruby.parentNode.insertBefore(document.createTextNode('\u00A0'), next); // \u00A0
        }
    });

    const body = tempWrap.innerHTML.trim();

    const html = `<!DOCTYPE html>
<html><head><meta charset="UTF-8"><style>
*{font-family:"台灣楷體", twkai;box-shadow:none!important;outline:none!important;border:none!important;background:transparent!important}
ruby{ruby-position:over;ruby-align:center;font-family:"台灣楷體", twkai;}
rb{display:inline;font-family:"台灣楷體", twkai;}
rt{font-size:0.68em;color:#334155;letter-spacing:.02em;display:block;margin-bottom:.06em;text-align:center;font-family:"台灣楷體", twkai;}
body{font-size:14pt;line-height:1.95;font-family:"台灣楷體", twkai;}
</style></head><body>${body}</body></html>`;

    try {
        const blob = new Blob([html], {
            type: 'text/html'
        });
        const data = [new ClipboardItem({
            'text/html': blob
        })];
        await navigator.clipboard.write(data);
        toast('已複製標註（富文本）');
    } catch (err) {
        await navigator.clipboard.writeText(html);
        toast('已複製標註（HTML文字）');
    }
}

function buildExportHtml({
    body,
    fontSize,
    rtScale
}) {
    return `<!DOCTYPE html>
<html lang="zh-Hant"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1">
<title>烏衣行 漢字 × 拼音 標註</title>
<link href="https://oikasu1.github.io/kasuexam/kasu/fonts/twhei.css" rel="stylesheet">
<style>
*{font-family: twhei-s, TWHEI, "台灣黑體", system-ui, -apple-system, Segoe UI, Roboto, Noto Sans, "PingFang TC", "Microsoft JhengHei", sans-serif;}
:root{--rt-scale:${String(rtScale).trim() || 0.68}}
body{margin:24px;line-height:1.95;font-size:${fontSize || '14pt'}}
ruby{ruby-position:over;text-align: center}
rb{display:inline}
rt{font-size:calc(var(--rt-scale) * 1em);color:#334155;letter-spacing:.02em;text-align:center;display:block;margin-bottom:.1em}
.glyph{display:inline-block;padding:.18rem .16rem;margin:.06rem .03rem;border-radius:.5rem}
.glyph.punct{padding:.18rem .08rem;color:#334155}
.glyph.missing{background:#fff2f2;outline:1px dashed #fecaca}
.glyph.extra{background:#fff7ed;outline:1px dashed #fed7aa}
.clause{display:inline-block;padding:.06rem .12rem;border-radius:.45rem;margin-right:.08rem;position:relative}
.clause-warn{background:#fff7ed;outline:2px solid #f59e0b;box-shadow:0 0 0 2px #fde68a inset}
.line-wrap{display:block;margin:.35rem 0;line-height:1.1;word-break:keep-all;white-space:normal}
</style></head><body>${body}</body></html>`;
}

function fallbackDownload(filename, content) {
    const blob = new Blob([content], {
        type: 'text/html;charset=utf-8'
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);
}

function toast(msg) {
    const t = document.createElement('div');
    t.textContent = msg;
    t.className = 'fixed bottom-5 left-1/2 -translate-x-1/2 bg-slate-900 text-white text-sm rounded-full px-4 py-2 shadow z-50';
    document.body.appendChild(t);
    setTimeout(() => {
        t.style.opacity = '0';
        t.style.transition = 'opacity .3s';
    }, 1400);
    setTimeout(() => {
        t.remove();
    }, 1800);
}

// 範例
btnSample?.addEventListener('click', () => {
    const sampleH = `看佢包包㘝㘝，毋知偷拿麼个？狗子一養啊出，狗嫲會煞煞摎厥胞衣舐淨來。`;
    const sampleP = `kon giˇ bauˊ bauˊ ngiabˋ ngiabˋ, mˇ diˊ teuˊ naˊ maˋ ge? ziiˋ idˋ iongˊ a cudˋ, gieuˋ maˇ voi sadˋ sadˋ lauˊ giaˊ bauˊ iˊ seˊ qiang loiˇ.`;
    hanziInput.value = sampleH;
    pinyinInput.value = sampleP;
    render();
});

// 顯示/隱藏說明視窗
btnToneHelp?.addEventListener('click', () => toneHelpModal?.classList.remove('hidden'));
btnCloseToneHelp?.addEventListener('click', () => toneHelpModal?.classList.add('hidden'));
toneHelpModal?.addEventListener('click', (e) => {
    if (e.target === toneHelpModal) { // 點擊背景關閉
        toneHelpModal.classList.add('hidden');
    }
});

// 顯示/隱藏主輸入區的轉調號選單
btnToggleToneConverter?.addEventListener('click', (e) => {
    e.stopPropagation();
    toneConverterMenu?.classList.toggle('hidden');
});

// 點擊主輸入區的「字母 > 調號」
btnConvertLetterTone?.addEventListener('click', () => {
    pinyinInput.value = convertPinyinTones(pinyinInput.value, 'letter');
    toneConverterMenu?.classList.add('hidden');
});

// 點擊主輸入區的「數字 > 調號」
btnConvertNumberTone?.addEventListener('click', () => {
    pinyinInput.value = convertPinyinTones(pinyinInput.value, 'number');
    toneConverterMenu?.classList.add('hidden');
});

// 點擊頁面其他地方，關閉可能已開啟的選單
document.addEventListener('click', (e) => {
    // 主輸入區選單
    if (toneConverterMenu && !toneConverterMenu.classList.contains('hidden')) {
        const within = e.target.closest('#toneConverterMenu') || e.target.closest('#btnToggleToneConverter');
        if (!within) toneConverterMenu.classList.add('hidden');
    }
    // 編輯器內選單
    document.querySelectorAll('.tone-converter-menu-editor').forEach(menu => {
         if (!menu.classList.contains('hidden')) {
            const within = e.target.closest('.relative'); // 假設選單和按鈕都在一個 relative 容器裡
            if (within !== menu.parentElement) menu.classList.add('hidden');
         }
    });
});

/**
 * 轉換拼音中的聲調字母/數字為調號
 * @param {string} text - 輸入的拼音字串
 * @param {'letter'|'number'} type - 轉換類型
 * @returns {string} 轉換後的字串
 */
function convertPinyinTones(text, type) {
    const letterMap = { 'z': 'ˊ', 'v': 'ˇ', 's': 'ˋ', 'x': 'ˆ', 'f': '⁺' };
    const numberMap = { '2': 'ˊ', '3': 'ˇ', '4': 'ˋ', '5': 'ˆ', '6': '⁺', '7': '⁺' };
    const baseChars = '[aeioumngbdr]';
    let regex;
    let currentMap;

    // 使用 'u' 旗標來支援 Unicode 屬性 \p{P} (標點)
    // 新規則：(母音/鼻音) + (聲調字/數) + (斷點：空白、標點或結尾)
    const lookahead = '(?=\\s|\\p{P}|$)';

    if (type === 'letter') {
        regex = new RegExp(`(${baseChars})([zvsxf])${lookahead}`, 'giu');
        currentMap = letterMap;
    } else { // number
        regex = new RegExp(`(${baseChars})([234567])${lookahead}`, 'giu');
        currentMap = numberMap;
    }

    return text.replace(regex, (match, p1, p2) => {
        const tone = currentMap[p2.toLowerCase()];
        return tone ? p1 + tone : match;
    });
}


// 替換原本的 init 函式
(function init() {
    mode = 'view';
    fontSize = DEFAULT_FONT;
    applyTypography();

    // --- START: 可收合面板功能 (新增) ---
    const mainGrid = document.getElementById('mainGrid');
    const inputSection = document.getElementById('inputSection');
    const resultSection = document.getElementById('resultSection');
    const inputHeader = document.getElementById('inputHeader');
    const resultHeader = document.getElementById('resultHeader');

    // 預設狀態：兩者皆展開
    const resetToDefault = () => {
        inputSection.classList.remove('is-collapsed');
        resultSection.classList.remove('is-collapsed');
        mainGrid.classList.remove('lg:grid-cols-[68px,1fr]', 'lg:grid-cols-[1fr,68px]');
        mainGrid.classList.add('lg:grid-cols-2');
    };

    // 收合輸入區
    const collapseInput = () => {
        inputSection.classList.add('is-collapsed');
        resultSection.classList.remove('is-collapsed');
        mainGrid.classList.remove('lg:grid-cols-2', 'lg:grid-cols-[1fr,68px]');
        mainGrid.classList.add('lg:grid-cols-[68px,1fr]'); // 左側縮小，右側填滿
    };

    // 收合結果區
    const collapseResult = () => {
        resultSection.classList.add('is-collapsed');
        inputSection.classList.remove('is-collapsed');
        mainGrid.classList.remove('lg:grid-cols-2', 'lg:grid-cols-[68px,1fr]');
        mainGrid.classList.add('lg:grid-cols-[1fr,68px]'); // 右側縮小，左側填滿
    };

    // 點擊輸入區標題的邏輯
    inputHeader.addEventListener('click', () => {
        const isInputCollapsed = inputSection.classList.contains('is-collapsed');
        // 如果輸入區已收合，或結果區已收合，則點擊一律恢復預設
        if (isInputCollapsed || resultSection.classList.contains('is-collapsed')) {
            resetToDefault();
        } else {
            // 否則，收合輸入區
            collapseInput();
        }
    });
    
    // 點擊結果區標題的邏輯
    resultHeader.addEventListener('click', () => {
        const isResultCollapsed = resultSection.classList.contains('is-collapsed');
        // 如果結果區已收合，或輸入區已收合，則點擊一律恢復預設
        if (isResultCollapsed || inputSection.classList.contains('is-collapsed')) {
            resetToDefault();
        } else {
            // 否則，收合結果區
            collapseResult();
        }
    });
    // --- END: 可收合面板功能 ---

})();