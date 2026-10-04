// ================= 4n_ui_list_stats.js: 列表底部統計資訊（句數／字數，多語字幕時分語言統計） =================
// 顯示位置：單句「列表」模式的最底部（#listStatsBar，緊接在 #sentenceList 之後）。
// 顯示規則：
//   單一語言：      共 17 句 · 428 字
//   多語字幕啟用：  共 17 句 · 856 字   [語言1 17 句 · 428 字]  [語言2 16 句 · 428 字]   （全部同一行，太窄才換行）
//   句數＝該語言「真的有文字」的句子數（只有標點／空白不算）；多語時總句數以語言1為準。
//   字數＝不含空白、底線 _、標點符號、符號後的字元數；擴充漢字（𫣆）與組字式（⿰亻戈）都只算 1 個字（多語時總字數為各語言加總）。
//   有空白列（沒有任何文字的句子）時，在後面以淡色小字補充「另有 N 句空白」。
// 更新時機：不修改其他檔案，改用「包裝既有函式」的方式（與 4k / 4l 相同手法）：
//   saveToStorage（任何資料變動）、renderSentenceList（整份重繪）、syncListModeMenuUI（模式切換）
//   執行完後，延遲 120ms 重算一次（合併連續觸發，大量句子也不會卡）。
// 需求：必須在 4l_ui_list_mode_menu.js 之後載入（需要 getCurrentListMode / syncListModeMenuUI）。
// 樣式在 style.css 檔尾（.list-stats-*）。

const LIST_STATS_ID = 'listStatsBar';

// 字數：以「一個漢字＝一個字」計算。
//   · 不計：空白、底線 _、標點(P)、符號(S)、組合附加符號(M，含異體字選擇符)、格式控制字元(Cf)
//   · 以 code point 計算，擴充漢字（如 𫣆、𠊎，佔兩個 UTF-16 單位）只算 1 個字
//   · 組字式（IDS，如 ⿰亻戈、⿱艹⿰亻戈）整串視為 1 個字
//   · 部首／筆畫字元（如 ⼈、㇀，雖屬「符號」類別，但是被當成字在使用）照常計為 1 個字
function idsArity(cp) {
    if (cp === 0x2FF2 || cp === 0x2FF3) return 3;                 // ⿲ ⿳：三個運算元
    if (cp === 0x2FFE || cp === 0x2FFF) return 1;                 // ⿾ ⿿：一個運算元
    if ((cp >= 0x2FF0 && cp <= 0x2FFD) || cp === 0x31EF) return 2; // 其餘結構符：兩個運算元
    return 0;
}

const TEXT_IGNORABLE_RE = /[\s_\p{P}\p{S}\p{M}\p{Cf}]/u;
function isCountableChar(ch) {
    const cp = ch.codePointAt(0);
    if ((cp >= 0x2E80 && cp <= 0x2FDF) || (cp >= 0x31C0 && cp <= 0x31E3)) return true; // 部首補充、康熙部首、筆畫
    return !TEXT_IGNORABLE_RE.test(ch);
}

function countTextChars(text) {
    let count = 0;
    const pending = []; // 組字式裡「還缺幾個運算元」的堆疊
    for (const ch of String(text || '')) {
        const arity = idsArity(ch.codePointAt(0));
        if (arity) { pending.push(arity); continue; }
        if (!isCountableChar(ch)) continue;
        if (pending.length === 0) { count++; continue; }
        // 在組字式之中：這個字元是一個運算元；子結構完成後，整個子結構又算上一層的一個運算元
        pending[pending.length - 1]--;
        while (pending.length && pending[pending.length - 1] === 0) {
            pending.pop();
            if (pending.length) pending[pending.length - 1]--;
            else count++; // 最外層組字式完成 = 1 個字
        }
    }
    if (pending.length) count++; // 殘缺的組字式（運算元不足）也只算 1 個字
    return count;
}

function computeListStats() {
    const multi = typeof getLangMultiEnabled === 'function' && getLangMultiEnabled()
        && typeof getLangCount === 'function' && getLangCount() > 1;
    const langN = multi ? getLangCount() : 1;
    const per = Array.from({ length: langN }, () => ({ sentences: 0, chars: 0 }));
    let rowsWithText = 0;

    allLabelsOrdered.forEach(label => {
        const segs = (typeof splitLangs === 'function') ? splitLangs(sentenceTextMap[label]) : [String(sentenceTextMap[label] || '')];
        let any = false;
        for (let i = 0; i < langN; i++) {
            const c = countTextChars(segs[i]);
            if (c > 0) { per[i].sentences++; any = true; }
            per[i].chars += c;
        }
        if (any) rowsWithText++;
    });

    return {
        multi,
        per,
        totalSentences: per[0].sentences,                          // 多語時以語言1為主
        totalChars: per.reduce((sum, p) => sum + p.chars, 0),
        blankRows: allLabelsOrdered.length - rowsWithText
    };
}

function ensureListStatsBar() {
    let bar = document.getElementById(LIST_STATS_ID);
    if (!bar && typeof sentenceList !== 'undefined' && sentenceList && sentenceList.parentNode) {
        bar = document.createElement('div'); // 備援：index.html 沒放元素時自動補上
        bar.id = LIST_STATS_ID;
        bar.className = 'list-stats-bar';
        sentenceList.insertAdjacentElement('afterend', bar);
    }
    return bar;
}

function updateListStats() {
    // 順便同步編輯區面板的顯示（沒有標記時隱藏、新增後再顯示，規則在 5_list_renderer.js）。
    // 放在這裡是因為這個函式正好會在「存檔／重繪／切換模式」之後被排程執行。
    if (typeof updateListPanelVisibility === 'function') updateListPanelVisibility();
    const bar = ensureListStatsBar();
    if (!bar) return;
    const inListMode = typeof getCurrentListMode !== 'function' || getCurrentListMode() === 'list';
    if (!inListMode || allLabelsOrdered.length === 0) { bar.style.display = 'none'; return; }

    const st = computeListStats();
    const n = v => v.toLocaleString('en-US');
    const sep = '<span class="list-stats-sep">·</span>';

    // 單行排列：[共 N 句 · M 字] [語言1 …] [語言2 …]；寬度不夠時才自動換行。
    // 「總句數以語言1計」改放在滑鼠提示（title），畫面更簡潔。
    const tip = st.multi ? ' title="總句數以語言1計；總字數為各語言加總"' : '';
    let html = `<span class="list-stats-total"${tip}>共 <b>${n(st.totalSentences)}</b> 句${sep}<b>${n(st.totalChars)}</b> 字`
        + (st.blankRows > 0 ? `<span class="list-stats-note">另有 ${n(st.blankRows)} 句空白</span>` : '')
        + '</span>';

    if (st.multi) {
        html += st.per.map((p, i) => {
            const name = typeof getLangName === 'function' ? getLangName(i) : `語言${i + 1}`;
            return `<span class="list-stats-chip"><em>${name}</em><b>${n(p.sentences)}</b> 句${sep}<b>${n(p.chars)}</b> 字</span>`;
        }).join('');
    }

    bar.innerHTML = html;
    bar.style.display = '';
}

// 合併連續觸發（打字存檔、整份重繪、模式切換常常連續發生）
let listStatsTimer = null;
function scheduleListStats() {
    clearTimeout(listStatsTimer);
    listStatsTimer = setTimeout(updateListStats, 120);
}

// 包裝既有函式：原函式跑完後，排程更新統計（不需改動原始碼）
['saveToStorage', 'renderSentenceList', 'syncListModeMenuUI'].forEach(name => {
    const orig = window[name];
    if (typeof orig !== 'function') return;
    window[name] = function (...args) {
        const result = orig.apply(this, args);
        scheduleListStats();
        return result;
    };
});

scheduleListStats();

// 全文模式是按鈕切換（4g 綁定），本檔晚於 4g 載入，所以觸發時 isScriptMode 已更新。
// 4l 用的是包裝前的函式參照，不會觸發上面的包裝，所以這裡另外監聽（網址 ?mode=full 還原時會用到）。
document.getElementById('toggleScriptModeBtn')?.addEventListener('click', scheduleListStats);
