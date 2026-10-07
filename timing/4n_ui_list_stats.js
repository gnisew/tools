// 4n_ui_list_stats.js: 列表底部統計（句數／字數，多語字幕時分語言統計）
// 顯示於單句「列表」模式最底部（#listStatsBar，緊接 #sentenceList 之後），樣式在 style.css 的 .list-stats-*。
// 規則：
//   · 句數 = 該語言「真的有文字」的句子（只有標點／空白不算）；多語時總句數以語言1為準，總字數為各語言加總
//   · 字數 = 不含空白、底線、標點、符號後的字元數；擴充漢字與組字式（⿰亻戈）各算 1 個字
//   · 有空白列時，補充「另有 N 句空白」
// 更新時機：包裝 saveToStorage / renderSentenceList / syncListModeMenuUI，執行後延遲 120ms 重算（合併連續觸發）。
// 載入順序：4l 之後（需要 getCurrentListMode / syncListModeMenuUI）。

const LIST_STATS_ID = 'listStatsBar';

// 以 code point 計算，一個漢字 = 一個字。
// 不計：空白、底線、標點(P)、符號(S)、組合附加符號(M，含異體字選擇符)、格式控制字元(Cf)。
// 部首／筆畫字元（如 ⼈、㇀）雖屬「符號」類別，但照常計為 1 個字。
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
    const pending = []; // 組字式「還缺幾個運算元」的堆疊
    for (const ch of String(text || '')) {
        const arity = idsArity(ch.codePointAt(0));
        if (arity) { pending.push(arity); continue; }
        if (!isCountableChar(ch)) continue;
        if (pending.length === 0) { count++; continue; }
        // 組字式中的運算元；子結構完成後，整個子結構算上一層的一個運算元
        pending[pending.length - 1]--;
        while (pending.length && pending[pending.length - 1] === 0) {
            pending.pop();
            if (pending.length) pending[pending.length - 1]--;
            else count++; // 最外層組字式完成 = 1 個字
        }
    }
    if (pending.length) count++; // 殘缺的組字式也只算 1 個字
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
        totalSentences: per[0].sentences,
        totalChars: per.reduce((sum, p) => sum + p.chars, 0),
        blankRows: allLabelsOrdered.length - rowsWithText
    };
}

function ensureListStatsBar() {
    let bar = document.getElementById(LIST_STATS_ID);
    if (!bar && typeof sentenceList !== 'undefined' && sentenceList && sentenceList.parentNode) {
        bar = document.createElement('div'); // index.html 沒放元素時自動補上
        bar.id = LIST_STATS_ID;
        bar.className = 'list-stats-bar';
        sentenceList.insertAdjacentElement('afterend', bar);
    }
    return bar;
}

function updateListStats() {
    // 順便同步編輯區面板顯示（規則在 5_list_renderer.js）；此函式正好會在存檔／重繪／切換模式後被排程執行
    if (typeof updateListPanelVisibility === 'function') updateListPanelVisibility();
    const bar = ensureListStatsBar();
    if (!bar) return;
    const inListMode = typeof getCurrentListMode !== 'function' || getCurrentListMode() === 'list';
    if (!inListMode || allLabelsOrdered.length === 0) { bar.style.display = 'none'; return; }

    const st = computeListStats();
    const n = v => v.toLocaleString('en-US');
    const sep = '<span class="list-stats-sep">·</span>';

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

let listStatsTimer = null;
function scheduleListStats() {
    clearTimeout(listStatsTimer);
    listStatsTimer = setTimeout(updateListStats, 120);
}

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

// 4l 使用包裝前的函式參照，不會觸發上面的包裝，所以另外監聽全文按鈕（網址 ?mode=full 還原時會用到）
document.getElementById('toggleScriptModeBtn')?.addEventListener('click', scheduleListStats);
