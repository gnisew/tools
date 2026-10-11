// 1d_speakers.js: 說話者標記（資料層 + 設定區塊 + 列表指派選單）
// 做法：說話者綁在「文字列」上，跟著 sentenceTextMap 一起搬運（reassignLabels、全文模式、音訊剪貼簿都已同步）。
//   speakers   = [{ id:'s1', name:'說話者1', color:'#1E88E5' }, ...]
//   speakerMap = { 'A01':'s1' }        沒有該 label = 未指定（不區別說話者）
// 預設關閉，舊專案不受影響。開關與說話者清單屬於專案資料：存在 localStorage、JSON 專案檔（version 1.2）。
// 全域變數 speakerEnabled / speakers / speakerMap 宣告於 1_globals.js；Undo/Redo 快照也在 1_globals.js。
// 匯入偵測：貼上文字、匯入試算表／字幕時，句首「名稱：」（半形或全形冒號）自動轉成說話者並移除名稱（見「匯入時偵測」區塊）。
// 列表篩選：「檢視 > 只看說話者」只顯示某位說話者的句子（只影響列表畫面，不改資料，不寫進專案檔）。
// 相依：1_globals.js（showCustomDialog、saveState、selectedLabels、isEditMode）、1b_toast.js、
//       index.html 的 #speakerEnableCheck / #speakerDetectCheck / #speakerSettingsBody / #speakerList / #speakerAddBtn / #speakerFilterMenuBtn
// 載入順序：1c_languages.js 之後。

const SPEAKER_COLORS = ['#1E88E5', '#E53935', '#43A047', '#FB8C00', '#8E24AA', '#00ACC1', '#6D4C41', '#D81B60'];
const SPEAKER_MAX = 8;
const SPEAKER_COLOR_RE = /^#[0-9a-fA-F]{6}$/;

// ================= 資料層 =================

function getSpeakerById(id) {
    return speakers.find(s => s.id === id) || null;
}

// 只在啟用時回傳；未指派或說話者已被刪除回傳 null
function getSpeakerOfLabel(label) {
    if (!speakerEnabled) return null;
    return getSpeakerById(speakerMap[label]);
}

// 清理外部資料（JSON、localStorage）：只留格式正確的項目，顏色不合法就換預設色
function normalizeSpeakerList(arr) {
    if (!Array.isArray(arr)) return [];
    const seen = new Set();
    const out = [];
    arr.forEach(s => {
        if (!s || typeof s.id !== 'string' || !s.id || seen.has(s.id)) return;
        seen.add(s.id);
        out.push({
            id: s.id,
            name: String(s.name == null ? '' : s.name).slice(0, 30) || ('說話者' + (out.length + 1)),
            color: SPEAKER_COLOR_RE.test(s.color) ? s.color : SPEAKER_COLORS[out.length % SPEAKER_COLORS.length]
        });
    });
    return out.slice(0, SPEAKER_MAX);
}

// 移除指向不存在列、或不存在說話者的對應（存檔前呼叫）
function pruneSpeakerMap() {
    const valid = new Set(allLabelsOrdered);
    Object.keys(speakerMap).forEach(k => {
        if (!valid.has(k) || !getSpeakerById(speakerMap[k])) delete speakerMap[k];
    });
}

function nextSpeakerId() {
    let n = 1;
    while (speakers.some(s => s.id === 's' + n)) n++;
    return 's' + n;
}

function nextSpeakerColor() {
    const used = new Set(speakers.map(s => s.color));
    return SPEAKER_COLORS.find(c => !used.has(c)) || SPEAKER_COLORS[speakers.length % SPEAKER_COLORS.length];
}

function countSpeakerSentences(id) {
    let n = 0;
    allLabelsOrdered.forEach(l => { if (speakerMap[l] === id) n++; });
    return n;
}

// ================= 匯入時偵測「名稱：」開頭 =================
// 判斷規則（避免把一般句子誤當說話者）：
//   · 名稱 1～12 字，不含括號、標點；冒號可為半形 : 或全形 ：；冒號後不能是 //（網址）；純數字不算（時間 10:30）
//   · 同一個名稱要出現在 2 句以上（或與現有說話者同名）才算說話者，只出現一次的「注意：」之類不會被轉換
//   · 符合的新名稱超過 8 位（說話者上限）→ 不像對話，整份略過偵測
// JSON 專案檔直接還原 speakers / speakerMap，不會經過這裡，所以句子本來就以「注意：」開頭也不會被改掉。
const SPEAKER_DETECT_KEY = 'tagger_speakerDetect'; // 'false' = 關閉；沒存過 = 開啟
const SPEAKER_MARK_OPEN = '\uE000';  // 純文字解析用的暫時標記（私用區字元）：OPEN + 名稱序號 + CLOSE
const SPEAKER_MARK_CLOSE = '\uE001';
const SPEAKER_MARK_RE = /^\s*\uE000(\d+)\uE001\s*/;
const SPEAKER_PREFIX_RE = /^\s*([^\s:：[\]【】()（）「」『』《》〈〉<>|｜,，。.．!！?？;；、"'“”‘’\\\/／][^:：[\]【】()（）「」『』《》〈〉<>|｜,，。.．!！?？;；、"'“”‘’\\\/／\t\r\n]{0,11})\s*[:：]\s*(?![\/／])/;
const SPEAKER_DEFAULT_NAME_RE = /^說話者\d+$/;

function isSpeakerDetectOn() {
    return localStorage.getItem(SPEAKER_DETECT_KEY) !== 'false';
}

// 取出句首的「名稱：」。沒有、或名稱是純數字／符號 → null
function parseSpeakerPrefix(text) {
    const s = String(text == null ? '' : text);
    const m = SPEAKER_PREFIX_RE.exec(s);
    if (!m) return null;
    const name = m[1].trim();
    if (!name || /^[\d\s.\-]+$/.test(name)) return null;
    return { name, rest: s.slice(m[0].length) };
}

// 從多段文字挑出算說話者的名稱（依第一次出現的順序）。回傳 { names, tooMany }；tooMany 為符合的名稱數（超過名額時才有值）
function pickSpeakerNames(texts) {
    const counts = new Map(); // 小寫名稱 → { name, n }
    texts.forEach(t => {
        const p = parseSpeakerPrefix(t);
        if (!p) return;
        const key = p.name.toLowerCase();
        const c = counts.get(key);
        if (c) c.n++; else counts.set(key, { name: p.name, n: 1 });
    });
    const existing = new Set(speakers.map(s => s.name.trim().toLowerCase()));
    const names = [];
    counts.forEach((c, key) => { if (c.n >= 2 || existing.has(key)) names.push(c.name); });
    // 名額 = 上限 − 現有說話者 + 可被改名接手的預設名稱（說話者1、說話者2…）；與現有說話者同名的不佔名額
    const fresh = names.filter(n => !existing.has(n.toLowerCase())).length;
    const reusable = speakers.filter(s => SPEAKER_DEFAULT_NAME_RE.test(s.name) && !names.some(n => n.toLowerCase() === s.name.toLowerCase())).length;
    if (fresh > SPEAKER_MAX - speakers.length + reusable) return { names: [], tooMany: names.length };
    return { names, tooMany: 0 };
}

// 純文字：把符合的行首「名稱：」換成暫時標記（解析斷句時才不會把名稱當成句子的一部分）。
// 回傳 { text, names, tooMany }；沒有偵測到就原樣回傳。
// mode = 'punct'（依標點斷句）時，名稱獨佔一行（後面沒有文字）的行保留原文不轉換，避免名稱消失卻沒有指派。
function markSpeakerPrefixes(rawText, mode) {
    if (!isSpeakerDetectOn()) return { text: rawText, names: [], tooMany: 0 };
    const lines = String(rawText).split(/\r?\n/);
    const pick = pickSpeakerNames(lines);
    if (!pick.names.length) return { text: rawText, names: [], tooMany: pick.tooMany };
    const idxOf = new Map(pick.names.map((n, i) => [n.toLowerCase(), i]));
    const out = lines.map(line => {
        const p = parseSpeakerPrefix(line);
        const i = p ? idxOf.get(p.name.toLowerCase()) : undefined;
        if (i === undefined) return line;
        if (mode === 'punct' && p.rest.trim() === '') return line;
        return SPEAKER_MARK_OPEN + i + SPEAKER_MARK_CLOSE + p.rest;
    });
    return { text: out.join('\n'), names: pick.names, tooMany: 0 };
}

// 純文字解析完後呼叫：把暫時標記從句子文字拿掉，回傳 { 句號: 說話者名稱 }。
// inherit = true（依標點斷句）：一行就是一段，同一段內沒標記的後續句子沿用同一位說話者。
// 名稱獨佔一行（「甲：」後面沒有文字）時，該列之後沒標記的句子沿用這位說話者，直到下一個名稱（或換段）；名稱那一列沒有文字，之後會被移除。
function extractSpeakerMarks(labels, textMap, names, inherit) {
    const byLabel = {};
    let cur = null, curGroup = null, hold = false;
    labels.forEach(label => {
        const t = textMap[label] || '';
        const group = label.replace(/\d+$/, '');
        const m = SPEAKER_MARK_RE.exec(t);
        if (m) {
            cur = names[parseInt(m[1], 10)] || null;
            curGroup = group;
            textMap[label] = t.slice(m[0].length);
            hold = textMap[label].trim() === '';
        } else if (!(inherit || hold) || group !== curGroup) {
            cur = null;
            hold = false;
        } else if (hold) { // 沿用中遇到另一個獨佔一行的「名稱：」（只出現一次、沒被轉換）→ 結束沿用，避免誤歸給前一位
            const p = parseSpeakerPrefix(t);
            if (p && p.rest.trim() === '') { cur = null; hold = false; }
        }
        if (cur) byLabel[label] = cur;
    });
    return byLabel;
}

// 試算表／字幕（TSV）：逐句偵測並直接把名稱從句子拿掉。回傳 { byLabel, names, tooMany }
function detectSpeakersInTextMap(labels, textMap) {
    if (!isSpeakerDetectOn()) return { byLabel: {}, names: [], tooMany: 0 };
    const pick = pickSpeakerNames(labels.map(l => textMap[l] || ''));
    if (!pick.names.length) return { byLabel: {}, names: [], tooMany: pick.tooMany };
    const picked = new Set(pick.names.map(n => n.toLowerCase()));
    const byLabel = {};
    labels.forEach(l => {
        const p = parseSpeakerPrefix(textMap[l] || '');
        if (!p || !picked.has(p.name.toLowerCase())) return;
        textMap[l] = p.rest;
        byLabel[l] = p.name;
    });
    return { byLabel, names: pick.names, tooMany: 0 };
}

// 把偵測結果寫進 speakers / speakerMap（呼叫端已清空 speakerMap）。
// 名稱先比對現有說話者（不分大小寫）；其餘的新名稱優先接手「說話者1、說話者2…」這類沒改過名的預設項目，再新增。回傳指派句數。
function applyDetectedSpeakers(byLabel, names) {
    const used = new Set(Object.values(byLabel).map(n => n.toLowerCase()));
    const todo = names.filter(n => used.has(n.toLowerCase()));
    if (!todo.length) return 0;
    const idByKey = {};
    const unmatched = [];
    todo.forEach(name => {
        const sp = speakers.find(s => s.name.trim().toLowerCase() === name.toLowerCase());
        if (sp) idByKey[name.toLowerCase()] = sp.id; else unmatched.push(name);
    });
    unmatched.forEach(name => {
        const taken = new Set(Object.values(idByKey));
        let sp = speakers.find(s => SPEAKER_DEFAULT_NAME_RE.test(s.name) && !taken.has(s.id));
        if (sp) sp.name = name.slice(0, 30);
        else if (speakers.length < SPEAKER_MAX) {
            sp = { id: nextSpeakerId(), name: name.slice(0, 30), color: nextSpeakerColor() };
            speakers.push(sp);
        }
        if (sp) idByKey[name.toLowerCase()] = sp.id;
    });
    let n = 0;
    Object.keys(byLabel).forEach(label => {
        const id = idByKey[byLabel[label].toLowerCase()];
        if (id) { speakerMap[label] = id; n++; }
    });
    if (n > 0) speakerEnabled = true;
    return n;
}

// 匯入流程的收尾：套用結果、刷新設定頁，並提示。提示延後顯示，避免被匯入完成的訊息蓋掉
function finishSpeakerDetect(byLabel, names, tooMany) {
    const toast = (m, t, d) => setTimeout(() => { if (typeof showToast === 'function') showToast(m, t, d); }, 1600);
    if (tooMany) return toast(`偵測到 ${tooMany} 種「名稱：」開頭，超過說話者上限 ${SPEAKER_MAX} 位，不像對話，已略過說話者偵測`, 'normal', 6000);
    if (!names || !names.length) return;
    const wasOn = speakerEnabled;
    const count = applyDetectedSpeakers(byLabel || {}, names);
    if (!count) return;
    syncSpeakerUI(false); // 列表與聲波由匯入流程統一重繪
    const list = names.slice(0, 4).join('、') + (names.length > 4 ? '…' : '');
    toast(`偵測到說話者：${list}，已指派 ${count} 句並移除句首名稱` + (wasOn ? '' : '，已自動啟用說話者標記'), 'success', 6000);
}

// 載入 JSON 專案檔時呼叫（4c_ui_scroll.js）：沒有記錄就是未啟用、無說話者
function applySpeakersFromProject(data) {
    speakers = normalizeSpeakerList(data && data.speakers);
    const m = data && data.speakerMap;
    speakerMap = (m && typeof m === 'object' && !Array.isArray(m)) ? Object.assign({}, m) : {};
    speakerEnabled = !!(data && data.settings && data.settings.speakerEnabled) && speakers.length > 0;
    pruneSpeakerMap();
    syncSpeakerUI(false); // 列表與聲波稍後由匯入流程統一重繪
}

// ================= 聲波標記 =================

// 標記左側加一條說話者色條、文字改用說話者色（用 border 與文字色，不動標記底色，避免和「選取／目前句」的顏色打架；
// 即時更新文字時 content.textContent 會被重寫，但外框樣式不受影響）
function applySpeakerRegionStyle(el, label) {
    if (!el) return;
    const sp = getSpeakerOfLabel(label);
    if (sp) {
        el.style.borderLeft = '4px solid ' + sp.color;
        el.style.paddingLeft = '4px';
        el.style.color = sp.color;
    } else {
        el.style.borderLeft = '';
        el.style.paddingLeft = '';
        el.style.color = '#00695C';
    }
}

// 聲波標記文字前加「名稱：」（只在標記顯示文字、且該句有指派時），色盲也能分辨
function getSpeakerRegionPrefix(label) {
    const sp = getSpeakerOfLabel(label);
    return sp ? sp.name + '：' : '';
}

// 不重繪整個聲波，只更新現有標記的樣式
function refreshSpeakerRegions() {
    if (typeof wsRegions === 'undefined' || !wsRegions) return;
    wsRegions.getRegions().forEach(r => { if (r.content && r.id) applySpeakerRegionStyle(r.content, r.id); });
}

// ================= 指派 =================

function setSpeakerEnabled(on) {
    on = !!on;
    if (on && speakers.length === 0) {
        speakers = [
            { id: 's1', name: '說話者1', color: SPEAKER_COLORS[0] },
            { id: 's2', name: '說話者2', color: SPEAKER_COLORS[1] }
        ];
    }
    speakerEnabled = on;
    saveToStorage();
    syncSpeakerUI(true);
}

// 指派（id 為 null = 未指定）。沒有任何變動時不拍 Undo 快照
function assignSpeaker(labels, id) {
    const changed = labels.filter(l => (speakerMap[l] || null) !== (id || null));
    if (changed.length === 0) return 0;
    if (typeof saveState === 'function') saveState();
    changed.forEach(l => { if (id) speakerMap[l] = id; else delete speakerMap[l]; });
    saveToStorage();
    refreshSpeakerChips();
    renderSpeakerSettings();
    return changed.length;
}

// 交替指派：依列表順序，依序輪流給所有說話者（A、B、A、B…）
function assignSpeakersAlternating(labels) {
    if (speakers.length < 2) return 0;
    const ordered = allLabelsOrdered.filter(l => labels.includes(l));
    const target = {};
    ordered.forEach((l, i) => { target[l] = speakers[i % speakers.length].id; });
    const changed = ordered.filter(l => speakerMap[l] !== target[l]);
    if (changed.length === 0) return 0;
    if (typeof saveState === 'function') saveState();
    changed.forEach(l => { speakerMap[l] = target[l]; });
    saveToStorage();
    refreshSpeakerChips();
    renderSpeakerSettings();
    return changed.length;
}

// ================= 列表上的說話者標籤 =================

function speakerEsc(s) {
    return (typeof escapeHtml === 'function') ? escapeHtml(s) : String(s).replace(/[&<>"']/g, c => '&#' + c.charCodeAt(0) + ';');
}

// 5_list_renderer.js 的每一列會呼叫；未啟用時回傳空字串（不影響原本版面）
function buildSpeakerChipHtml(label) {
    if (!speakerEnabled) return '';
    const sp = getSpeakerById(speakerMap[label]);
    const name = sp ? sp.name : '未指定';
    const style = sp ? ` style="--spk-color:${sp.color}"` : '';
    return `<button type="button" class="speaker-chip${sp ? '' : ' is-unset'}" data-label="${label}"${style} title="設定說話者" aria-label="說話者：${speakerEsc(name)}，點擊變更"><span class="speaker-dot"></span><span class="speaker-name">${speakerEsc(name)}</span></button>`;
}

// 不重繪整個列表，只換掉每列的標籤（顏色、名稱、指派變動時使用）
function refreshSpeakerChips() {
    const list = document.getElementById('sentenceList');
    if (!list) return;
    list.querySelectorAll('.sentence-item').forEach(item => {
        const label = item.id.replace(/^item-/, '');
        const old = item.querySelector('.speaker-chip');
        const html = buildSpeakerChipHtml(label);
        if (!html) { if (old) old.remove(); return; }
        const tmp = document.createElement('div');
        tmp.innerHTML = html;
        const fresh = tmp.firstElementChild;
        if (old) old.replaceWith(fresh);
        else item.querySelector('.sentence-label')?.insertAdjacentElement('afterend', fresh);
    });
    refreshSpeakerRegions();
    applySpeakerFilter(); // 指派變動後，列重新比對篩選
}

// ================= 指派選單（浮動，同一時間只有一個） =================

let speakerPopupEl = null;
let speakerPopupLabel = null;

function closeSpeakerPopup() {
    if (speakerPopupEl) speakerPopupEl.classList.remove('show');
    speakerPopupLabel = null;
}

function getSpeakerTargets(label) {
    const sel = (typeof selectedLabels !== 'undefined') ? selectedLabels : [];
    if (sel.length > 1 && sel.includes(label)) return allLabelsOrdered.filter(l => sel.includes(l));
    return [label];
}

function buildPopupItem(text, color, checked, onClick, extraClass) {
    const b = document.createElement('button');
    b.type = 'button';
    b.className = 'speaker-popup-item' + (extraClass ? ' ' + extraClass : '');
    b.setAttribute('role', 'menuitem');
    const dot = document.createElement('span');
    dot.className = 'speaker-dot';
    if (color) dot.style.setProperty('--spk-color', color); else dot.classList.add('is-unset');
    const name = document.createElement('span');
    name.className = 'speaker-popup-name';
    name.textContent = text;
    b.append(dot, name);
    if (checked) {
        const ck = document.createElement('span');
        ck.className = 'material-icons speaker-popup-check';
        ck.textContent = 'check';
        b.appendChild(ck);
    }
    b.addEventListener('click', (e) => { e.stopPropagation(); onClick(); });
    return b;
}

function openSpeakerPopup(chip) {
    const label = chip.dataset.label;
    if (typeof isEditMode !== 'undefined' && !isEditMode) {
        if (typeof showToast === 'function') showToast('目前是編輯鎖定狀態，解除鎖定後才能指派說話者', 'error');
        return;
    }
    // 同一個標籤再點一次 = 關閉
    if (speakerPopupEl && speakerPopupEl.classList.contains('show') && speakerPopupLabel === label) return closeSpeakerPopup();

    document.querySelectorAll('.custom-dropdown-menu.show').forEach(m => m.classList.remove('show'));

    if (!speakerPopupEl) {
        speakerPopupEl = document.createElement('div');
        speakerPopupEl.id = 'speakerPopup';
        speakerPopupEl.setAttribute('role', 'menu');
        document.body.appendChild(speakerPopupEl);
    }
    const pop = speakerPopupEl;
    pop.textContent = '';
    speakerPopupLabel = label;

    const targets = getSpeakerTargets(label);
    const multi = targets.length > 1;
    const apply = (id) => {
        const n = assignSpeaker(targets, id);
        closeSpeakerPopup();
        if (typeof showToast !== 'function') return;
        const sp = getSpeakerById(id);
        if (n === 0) showToast('說話者沒有變動', 'normal');
        else showToast(sp ? `已將 ${n} 句設為「${sp.name}」` : `已將 ${n} 句改為未指定`, 'success');
    };

    if (multi) {
        const head = document.createElement('div');
        head.className = 'speaker-popup-head';
        head.textContent = `套用到選取的 ${targets.length} 句`;
        pop.appendChild(head);
    }

    const cur = speakerMap[label] || null;
    speakers.forEach(sp => {
        pop.appendChild(buildPopupItem(sp.name, sp.color, !multi && cur === sp.id, () => apply(sp.id)));
    });
    pop.appendChild(buildPopupItem('未指定', null, !multi && !cur, () => apply(null)));

    if (multi) {
        pop.appendChild(document.createElement('hr'));
        const alt = buildPopupItem(
            speakers.length >= 2 ? `交替指派（${speakers.map(s => s.name).slice(0, 3).join('、')}${speakers.length > 3 ? '…' : ''} 輪流）` : '交替指派（需要至少 2 位說話者）',
            null, false,
            () => {
                const n = assignSpeakersAlternating(targets);
                closeSpeakerPopup();
                if (typeof showToast === 'function') showToast(n ? `已交替指派 ${n} 句` : '說話者沒有變動', n ? 'success' : 'normal');
            }, 'is-action');
        if (speakers.length < 2) alt.disabled = true;
        pop.appendChild(alt);
    }

    pop.appendChild(document.createElement('hr'));
    pop.appendChild(buildPopupItem('管理說話者…', null, false, () => {
        closeSpeakerPopup();
        document.getElementById('openSidebarBtn')?.click();
        setTimeout(() => document.getElementById('speakerSettingsGroup')?.scrollIntoView({ block: 'start', behavior: 'smooth' }), 320);
    }, 'is-action'));

    // 定位：預設在標籤下方；放不下就改往上；水平方向夾在視窗內
    pop.classList.add('show');
    const r = chip.getBoundingClientRect();
    const pw = pop.offsetWidth, ph = pop.offsetHeight;
    const vw = window.innerWidth, vh = window.innerHeight;
    let top = r.bottom + 4;
    if (top + ph > vh - 8 && r.top - ph - 4 >= 8) top = r.top - ph - 4;
    top = Math.max(8, Math.min(top, vh - ph - 8));
    const left = Math.max(8, Math.min(r.left, vw - pw - 8));
    pop.style.top = top + 'px';
    pop.style.left = left + 'px';
}

// 點標籤：在捕獲階段處理並攔截，不讓列的點擊（會清除多選、跳到該句）收到事件，才能保留多選狀態
(function bindSpeakerChipEvents() {
    const list = document.getElementById('sentenceList');
    if (!list) return;
    ['mousedown', 'click'].forEach(type => {
        list.addEventListener(type, (e) => {
            const chip = e.target.closest && e.target.closest('.speaker-chip');
            if (!chip) return;
            e.stopPropagation();
            if (type === 'click') { e.preventDefault(); openSpeakerPopup(chip); }
        }, true);
    });
    document.addEventListener('click', (e) => {
        if (speakerPopupEl && speakerPopupEl.classList.contains('show') && !speakerPopupEl.contains(e.target)) closeSpeakerPopup();
    });
    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape' && speakerPopupEl && speakerPopupEl.classList.contains('show')) {
            e.stopPropagation();
            closeSpeakerPopup();
        }
    }, true);
    window.addEventListener('scroll', (e) => {
        if (speakerPopupEl && !speakerPopupEl.contains(e.target)) closeSpeakerPopup();
    }, true);
    window.addEventListener('resize', closeSpeakerPopup);
})();

// ================= 列表篩選：只看某位說話者 =================
// 只隱藏列表上的列（加上 .speaker-filter-hidden），不改資料、不影響聲波與匯出；也不寫進專案檔。
// 列表每次重繪（renderSentenceList）後由 MutationObserver 重新套用。
let speakerFilter = null; // null = 全部；'none' = 未指定；其餘 = 說話者 id

function speakerFilterMatches(label) {
    if (!speakerEnabled || !speakerFilter) return true;
    const sp = getSpeakerById(speakerMap[label]);
    return speakerFilter === 'none' ? !sp : (!!sp && sp.id === speakerFilter);
}

function speakerFilterName() {
    if (speakerFilter === 'none') return '未指定';
    const sp = getSpeakerById(speakerFilter);
    return sp ? sp.name : '';
}

function syncSpeakerFilterMenu() {
    const btn = document.getElementById('speakerFilterMenuBtn');
    if (!btn) return;
    btn.style.display = speakerEnabled ? '' : 'none';
    const txt = document.getElementById('speakerFilterMenuText');
    if (txt) txt.textContent = speakerFilter ? '只看說話者：' + speakerFilterName() : '只看說話者';
}

function renderSpeakerFilterBar() {
    let bar = document.getElementById('speakerFilterBar');
    if (!speakerFilter) { if (bar) bar.style.display = 'none'; return; }
    const list = document.getElementById('sentenceList');
    if (!bar) {
        if (!list || !list.parentElement) return;
        bar = document.createElement('div');
        bar.id = 'speakerFilterBar';
        list.parentElement.insertBefore(bar, list);
        bar.addEventListener('click', (e) => { if (e.target.closest('#speakerFilterClearBtn')) setSpeakerFilter(null); });
    }
    const sp = getSpeakerById(speakerFilter);
    const shown = allLabelsOrdered.filter(speakerFilterMatches).length;
    bar.innerHTML = `<span class="speaker-dot${sp ? '' : ' is-unset'}"${sp ? ` style="--spk-color:${sp.color}"` : ''}></span>`
        + `<span>只看「${speakerEsc(speakerFilterName())}」：${shown} ／ ${allLabelsOrdered.length} 句</span>`
        + `<button type="button" id="speakerFilterClearBtn">顯示全部</button>`;
    bar.style.display = 'flex';
}

function applySpeakerFilter() {
    // 說話者關閉或被刪除 → 自動解除篩選
    if (speakerFilter && (!speakerEnabled || (speakerFilter !== 'none' && !getSpeakerById(speakerFilter)))) speakerFilter = null;
    const list = document.getElementById('sentenceList');
    if (list) {
        if (!speakerFilter) {
            list.querySelectorAll('.speaker-filter-hidden').forEach(el => el.classList.remove('speaker-filter-hidden'));
        } else {
            list.querySelectorAll('.sentence-item').forEach(item => {
                item.classList.toggle('speaker-filter-hidden', !speakerFilterMatches(item.id.replace(/^item-/, '')));
            });
        }
    }
    renderSpeakerFilterBar();
    syncSpeakerFilterMenu();
}

function setSpeakerFilter(v) {
    speakerFilter = v || null;
    applySpeakerFilter();
    closeSpeakerPopup();
}

// 篩選選單（沿用指派選單的浮動視窗），在「檢視」按鈕下方展開
function openSpeakerFilterPopup(anchor) {
    document.querySelectorAll('.custom-dropdown-menu.show').forEach(m => m.classList.remove('show'));
    if (!speakerPopupEl) {
        speakerPopupEl = document.createElement('div');
        speakerPopupEl.id = 'speakerPopup';
        speakerPopupEl.setAttribute('role', 'menu');
        document.body.appendChild(speakerPopupEl);
    }
    const pop = speakerPopupEl;
    pop.textContent = '';
    speakerPopupLabel = '\u0000filter';

    const head = document.createElement('div');
    head.className = 'speaker-popup-head';
    head.textContent = '只看某位說話者';
    pop.appendChild(head);

    pop.appendChild(buildPopupItem('顯示全部', null, !speakerFilter, () => setSpeakerFilter(null)));
    pop.appendChild(document.createElement('hr'));
    speakers.forEach(sp => {
        pop.appendChild(buildPopupItem(`${sp.name}（${countSpeakerSentences(sp.id)} 句）`, sp.color, speakerFilter === sp.id, () => setSpeakerFilter(sp.id)));
    });
    const noneCount = allLabelsOrdered.filter(l => !getSpeakerById(speakerMap[l])).length;
    pop.appendChild(buildPopupItem(`未指定（${noneCount} 句）`, null, speakerFilter === 'none', () => setSpeakerFilter('none')));

    pop.classList.add('show');
    const r = anchor.getBoundingClientRect();
    const pw = pop.offsetWidth, ph = pop.offsetHeight;
    const vw = window.innerWidth, vh = window.innerHeight;
    let top = r.bottom + 4;
    if (top + ph > vh - 8 && r.top - ph - 4 >= 8) top = r.top - ph - 4;
    top = Math.max(8, Math.min(top, vh - ph - 8));
    pop.style.top = top + 'px';
    pop.style.left = Math.max(8, Math.min(r.left, vw - pw - 8)) + 'px';
}

(function bindSpeakerFilter() {
    document.getElementById('speakerFilterMenuBtn')?.addEventListener('click', (e) => {
        e.stopPropagation(); // 不讓 document 的「點外面關閉」立刻把剛開的選單關掉
        openSpeakerFilterPopup(document.getElementById('viewMenuBtn') || e.currentTarget);
    });
    // 列表重繪（整份重建、新增、刪除列）後，重新套用篩選
    const list = document.getElementById('sentenceList');
    if (!list) return;
    let raf = 0;
    new MutationObserver(() => {
        if (!speakerFilter && !list.querySelector('.speaker-filter-hidden')) return;
        if (raf) return;
        raf = requestAnimationFrame(() => { raf = 0; applySpeakerFilter(); });
    }).observe(list, { childList: true });
})();

// ================= 設定側邊欄 =================

function renderSpeakerSettings() {
    const body = document.getElementById('speakerSettingsBody');
    const box = document.getElementById('speakerList');
    const addBtn = document.getElementById('speakerAddBtn');
    if (body) body.style.display = speakerEnabled ? '' : 'none';
    if (!box) return;
    if (addBtn) addBtn.disabled = speakers.length >= SPEAKER_MAX;
    if (!speakerEnabled) { box.textContent = ''; return; }

    // 正在輸入名稱時不重建，避免游標跑掉
    if (box.contains(document.activeElement) && document.activeElement.tagName === 'INPUT' && document.activeElement.type === 'text') {
        box.querySelectorAll('.speaker-row').forEach(row => {
            const cnt = row.querySelector('.speaker-count');
            if (cnt) cnt.textContent = countSpeakerSentences(row.dataset.id) + ' 句';
        });
        return;
    }

    box.textContent = '';
    speakers.forEach((sp, idx) => {
        const row = document.createElement('div');
        row.className = 'speaker-row';
        row.dataset.id = sp.id;

        const color = document.createElement('input');
        color.type = 'color';
        color.className = 'speaker-color-input';
        color.value = sp.color;
        color.title = '更改顏色';
        color.addEventListener('input', () => { sp.color = color.value; refreshSpeakerChips(); });
        color.addEventListener('change', () => { saveToStorage(); });

        const name = document.createElement('input');
        name.type = 'text';
        name.className = 'speaker-name-input';
        name.value = sp.name;
        name.maxLength = 30;
        name.setAttribute('aria-label', '說話者名稱');
        name.addEventListener('change', () => {
            const v = name.value.trim() || ('說話者' + (idx + 1));
            if (v === sp.name) { name.value = v; return; }
            if (typeof saveState === 'function') saveState();
            sp.name = v;
            name.value = v;
            saveToStorage();
            refreshSpeakerChips();
        });
        name.addEventListener('keydown', (e) => { if (e.key === 'Enter') name.blur(); });

        const count = document.createElement('span');
        count.className = 'speaker-count';
        count.textContent = countSpeakerSentences(sp.id) + ' 句';

        const del = document.createElement('button');
        del.type = 'button';
        del.className = 'speaker-del-btn';
        del.title = '刪除此說話者';
        del.setAttribute('aria-label', '刪除此說話者');
        del.innerHTML = '<span class="material-icons">close</span>';
        del.addEventListener('click', () => removeSpeaker(sp.id));

        row.append(color, name, count, del);
        box.appendChild(row);
    });
}

function addSpeaker() {
    if (speakers.length >= SPEAKER_MAX) {
        if (typeof showToast === 'function') showToast(`說話者最多 ${SPEAKER_MAX} 位`, 'error');
        return;
    }
    if (typeof saveState === 'function') saveState();
    speakers.push({ id: nextSpeakerId(), name: '說話者' + (speakers.length + 1), color: nextSpeakerColor() });
    saveToStorage();
    renderSpeakerSettings();
}

function removeSpeaker(id) {
    const sp = getSpeakerById(id);
    if (!sp) return;
    const used = countSpeakerSentences(id);
    const doRemove = () => {
        if (typeof saveState === 'function') saveState();
        speakers = speakers.filter(s => s.id !== id);
        Object.keys(speakerMap).forEach(k => { if (speakerMap[k] === id) delete speakerMap[k]; });
        saveToStorage();
        renderSpeakerSettings();
        refreshSpeakerChips();
        if (typeof showToast === 'function') showToast(`已刪除「${sp.name}」` + (used ? `，${used} 句改為未指定` : ''), 'success');
    };
    if (used > 0 && typeof showCustomDialog === 'function') {
        showCustomDialog({
            title: '刪除說話者',
            message: `「${speakerEsc(sp.name)}」目前指派了 <b>${used}</b> 句，刪除後這些句子會變成<span style="color:#C62828; font-weight:bold;">未指定</span>，確定要刪除嗎？`,
            onConfirm: doRemove
        });
    } else {
        doRemove();
    }
}

// 讓設定頁、列表、浮動選單與目前狀態一致
function syncSpeakerUI(render = true) {
    const chk = document.getElementById('speakerEnableCheck');
    if (chk) chk.checked = !!speakerEnabled;
    renderSpeakerSettings();
    closeSpeakerPopup();
    if (render && typeof renderSentenceList === 'function') renderSentenceList();
    if (render) refreshSpeakerRegions();
    applySpeakerFilter(); // 同步篩選（關閉說話者、說話者被刪除時自動解除）與「檢視」選單項目
}

(function bindSpeakerSettingsUI() {
    const chk = document.getElementById('speakerEnableCheck');
    if (chk) {
        chk.checked = !!speakerEnabled;
        chk.addEventListener('change', () => setSpeakerEnabled(chk.checked));
    }
    document.getElementById('speakerAddBtn')?.addEventListener('click', addSpeaker);
    const det = document.getElementById('speakerDetectCheck'); // 匯入時偵測「名稱：」開頭（偏好設定，不屬於專案資料）
    if (det) {
        det.checked = isSpeakerDetectOn();
        det.addEventListener('change', () => localStorage.setItem(SPEAKER_DETECT_KEY, det.checked ? 'true' : 'false'));
    }
    renderSpeakerSettings();
    syncSpeakerFilterMenu();
})();
