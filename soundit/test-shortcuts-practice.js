/* 5-3 驗收：快捷鍵 → 練習速度事件、選單項目、多軌防呆、提示文字（純 Node，用假的 DOM／事件匯流排） */
const fs = require('fs');
let fail = 0; const ok = (n, c, i) => { console.log((c ? 'PASS ' : 'FAIL ') + n + (i ? '  ' + i : '')); if (!c) { fail++; process.exitCode = 1; } };

/* ---------- 假環境 ---------- */
const listeners = {}, fired = [], toasts = [];
const PKAE = { _deps: {}, ui: { InteractionHandler: { on: false }, TopHeader: { getOpenElement: () => null } },
	listenFor (n, f) { (listeners[n] = listeners[n] || []).push(f); },
	fireEvent (n, a, b) { fired.push([n, a, b]); if (n === 'RequestPracticeUI') return ; /* 面板需要真的 DOM，5-2 已測；這裡只記錄事件 */ (listeners[n] || []).forEach(f => f(a, b)); } };
const docHandlers = {};
const d = { addEventListener (t, f) { (docHandlers[t] = docHandlers[t] || []).push(f); }, querySelectorAll: () => [], querySelector: () => null,
	createElement: () => ({ style: {}, classList: { toggle () {} }, setAttribute () {} }), body: { appendChild () {} }, head: { appendChild () {} } };
const store = {};
const w = { localStorage: { getItem: k => store[k] ?? null, setItem (k, v) { store[k] = v; }, removeItem (k) { delete store[k]; } },
	addEventListener () {}, OneUp: (s) => toasts.push(s), innerWidth: 1200, innerHeight: 800 };
global.navigator = { platform: 'Win32' };
global.PKLocale = { t: k => k, getLang: () => 'zh-TW' };       /* 沒有語言檔 → 走內建中文備援 */
global.OneUp = s => toasts.push(s);
PKAE._deps.uiHelpers = { activeReadyFor: () => true };
let ready = true; PKAE._deps.uiHelpers.activeReadyFor = () => ready;

const run = (f, ...extra) => new Function('window', 'document', 'PKAudioEditor', ...extra.map(e => e[0]), fs.readFileSync(f, 'utf8'))(w, d, PKAE, ...extra.map(e => e[1]));
run('shortcuts.js');
run('practice-live.js');

/* 後端：只記錄 setLive 收到的參數 */
const live = [];
let mt = false;
const app = Object.assign(PKAE, { multitrack: { IsOn: () => mt },
	engine: { wavesurfer: { backend: { setLive: o => { live.push(o); return true; } }, regions: { list: [] }, on () {} } } });
w.PKPracticeLive.attach(app);
const P = () => w.PKPracticeLive.state();

/* 假按鍵事件 */
function key (code, o = {}) {
	const e = Object.assign({ code, key: o.key || code, keyCode: 0, ctrlKey: false, metaKey: false, altKey: false, shiftKey: false, repeat: false, isComposing: false,
		target: { tagName: 'DIV' }, defaultPrevented: false, stopped: false,
		preventDefault () { this.defaultPrevented = true; }, stopImmediatePropagation () { this.stopped = true; } }, o);
	docHandlers.keydown.forEach(f => f(e));
	return e;
}

/* 1. 預設按鍵都登錄、沒有和其他動作撞鍵 */
const names = ['practice_slow', 'practice_panel', 'practice_tempo_down', 'practice_tempo_up', 'practice_pitch_down', 'practice_pitch_up', 'practice_reset', 'timepitch_dialog'];
const sc = PKAE._deps.shortcuts;
ok('8 個新動作都有預設按鍵', names.every(n => sc.getBindings(n).length === 1), names.map(n => n + '=' + sc.label(n)).join(' '));
const all = {}; let dup = 0;
['play_stop','play_pause','record','loop','undo','redo','cut','copy','paste','delete','crossfade','select_all','deselect','silence','ab_toggle','marker_add','sel_start','sel_end','center','mt_switch','zoom_in','zoom_out','zoom_reset','open','save','help','marker_list','range_add','range_select','split_marker','merge_marker_next','merge_marker_prev']
	.concat(names).forEach(n => { try { sc.getBindings(n).forEach(k => { if (all[k]) { dup++; console.log('  重複', k, all[k], n); } all[k] = n; }); } catch (e) {} });
ok('新按鍵與既有按鍵沒有重複', dup === 0);

/* 2. 慢速切換 S：100% → 70%（預設）→ 回 100%；再切回上一次的速度 */
let e = key('KeyS');
ok('S → 70%', Math.abs(P().tempo - 0.7) < 1e-9 && e.defaultPrevented && e.stopped, 'tempo=' + P().tempo);
ok('提示文字含 70%', /70%/.test(toasts[toasts.length - 1] || ''), toasts[toasts.length - 1]);
key('KeyS'); ok('再按 S → 100%', P().tempo === 1);
app.fireEvent('RequestPracticeNudge', { tempo: -25 }); key('KeyS'); key('KeyS');
ok('慢速切換記得上次的速度（75%）', Math.abs(P().tempo - 0.75) < 1e-9, 'tempo=' + P().tempo);
key('KeyS'); app.fireEvent('RequestPracticeReset');

/* 3. 速度 ,／. ：±5%，並夾在 25%～200% */
key('Period'); key('Period'); ok('. 兩次 → 110%', Math.abs(P().tempo - 1.10) < 1e-9, 'tempo=' + P().tempo);
key('Comma'); ok(', 一次 → 105%', Math.abs(P().tempo - 1.05) < 1e-9);
for (let i = 0; i < 40; ++i) key('Comma'); ok('連按 , 不會低於 25%', Math.abs(P().tempo - 0.25) < 1e-9, 'tempo=' + P().tempo);
for (let i = 0; i < 60; ++i) key('Period'); ok('連按 . 不會高於 200%', Math.abs(P().tempo - 2) < 1e-9, 'tempo=' + P().tempo);

/* 4. 移調 Shift+, ／ Shift+. ：±1 半音，夾在 ±12 */
app.fireEvent('RequestPracticeReset');
key('Period', { shiftKey: true }); key('Period', { shiftKey: true }); key('Comma', { shiftKey: true });
ok('Shift+. ×2、Shift+, ×1 → +1 半音', P().semis === 1, 'semis=' + P().semis);
ok('提示文字含 +1', /\+1/.test(toasts[toasts.length - 1]), toasts[toasts.length - 1]);
for (let i = 0; i < 30; ++i) key('Period', { shiftKey: true }); ok('移調上限 +12', P().semis === 12);
const lv = live[live.length - 1]; ok('後端收到 tempo／semis／keep', lv && lv.semis === 12 && lv.keep === true, JSON.stringify(lv));

/* 5. 磁帶式：移調不動，並提示；速度照常 */
app.fireEvent('RequestPracticeSet', { keep: false });
let n0 = toasts.length; key('Period', { shiftKey: true });
ok('磁帶式下 Shift+. 不改音高並提示', P().semis === 0 && toasts.length === n0 + 1 && /磁帶式/.test(toasts[n0]), toasts[n0]);
key('Period'); ok('磁帶式下速度仍可調', Math.abs(P().tempo - 1.05) < 1e-9 || P().tempo > 1, 'tempo=' + P().tempo);
app.fireEvent('RequestPracticeSet', { keep: true, tempo: 1 }); app.fireEvent('RequestPracticeReset');

/* 6. 還原 Shift+P */
app.fireEvent('RequestPracticeSet', { tempo: 0.6, semis: 3 }); key('KeyP', { shiftKey: true });
ok('Shift+P 還原 100% 與原調', P().tempo === 1 && P().semis === 0);

/* 7. 多軌：全部提示、不改狀態 */
mt = true; const before = JSON.stringify(P()); n0 = toasts.length;
key('KeyS'); key('Period'); key('Period', { shiftKey: true }); key('KeyP', { shiftKey: true });
ok('多軌下 4 個操作都不改狀態', JSON.stringify(P()) === before);
ok('多軌下每次都有提示', toasts.length === n0 + 4 && toasts.slice(n0).every(s => /多軌/.test(s)), toasts.slice(n0).join(' | '));
mt = false;

/* 8. P 開關面板、T 開對話框（只確認有送出對應事件） */
fired.length = 0; key('KeyP'); key('KeyT');
ok('P → RequestPracticeUI', fired.some(f => f[0] === 'RequestPracticeUI'));
ok('T → RequestActionFXUI_TimePitch', fired.some(f => f[0] === 'RequestActionFXUI_TimePitch'));

/* 9. 沒載入音訊（ready 為假）時不動作；輸入框、視窗開啟、修飾鍵、輸入法組字時不攔截 */
ready = false; fired.length = 0; e = key('KeyS');
ok('尚未載入音訊：不觸發、不攔截', P().tempo === 1 && !e.defaultPrevented && !fired.length);
ready = true;
e = key('KeyS', { target: { tagName: 'INPUT' } }); ok('在輸入框打字不觸發', !e.defaultPrevented && P().tempo === 1);
PKAE.ui.InteractionHandler.on = true; e = key('KeyS'); ok('對話框開啟時不觸發', !e.defaultPrevented && P().tempo === 1); PKAE.ui.InteractionHandler.on = false;
e = key('KeyS', { ctrlKey: true }); ok('Ctrl+S 仍是存檔，不會變速', P().tempo === 1 && fired.every(f => f[0] !== 'RequestPracticeSlowToggle'));
e = key('KeyS', { isComposing: true }); ok('輸入法組字中不觸發', !e.defaultPrevented && P().tempo === 1);
e = key('KeyS', { repeat: true }); ok('按住不放不會連續切換', P().tempo === 1);

/* 10. 使用者改鍵後：舊預設鍵被攔下，新鍵生效 */
sc.getBindings; /* 透過公開 API 無法直接改，改用匯入格式 */
(function () {
	/* shortcuts.js 沒有公開 assign；這裡用 localStorage 預先寫入再重載，模擬使用者改鍵 */
	for (const k in listeners) delete listeners[k]; docHandlers.keydown.length = 0; fired.length = 0;
	store.pk_keys = JSON.stringify({ practice_slow: ['Shift+S'] });
	run('shortcuts.js'); /* 注意：Shift+S 原本是存檔，匯入時會搶走（衝突處理由原程式負責） */
	ok('改鍵後 Shift+S 變成慢速切換', PKAE._deps.shortcuts.getBindings('practice_slow')[0] === 'Shift+S');
	let ee = key('KeyS'); ok('原預設 S 被攔下且不動作', ee.defaultPrevented && !fired.length);
})();

/* 11. 選單：效果選單含「時間與音高…」與練習速度子選單，動作送出正確事件 */
(function () {
	for (const k in listeners) delete listeners[k]; fired.length = 0;
	PKAE._deps.shortcuts = null;
	run('ui-menu-effects.js');
	const M = PKAE._deps._menuEffects(PKAE);
	const find = (arr, re) => arr.find(x => re.test(x.name));
	const tp = find(M.children, /fx\.speed_rate/);
	ok('效果選單有「時間與音高」', !!tp);
	const pm = M.children.find(x => x.children && /練習速度/.test(x.name));
	ok('效果選單有「練習速度（即時變速）」子選單', !!pm);
	const items = pm.children.filter(x => x.name !== '---');
	ok('子選單 7 個項目', items.length === 7, items.map(x => x.name).join(' / '));
	items.forEach(i => i.action());
	const seq = fired.map(f => f[0] + (f[1] ? JSON.stringify(f[1]) : ''));
	ok('動作依序送出對應事件', seq.join(',') === 'RequestPracticeUI,RequestPracticeSlowToggle,RequestPracticeNudge{"tempo":-5},RequestPracticeNudge{"tempo":5},RequestPracticeNudge{"semis":-1},RequestPracticeNudge{"semis":1},RequestPracticeReset', seq.join(','));
	/* ✔ 狀態 */
	const slow = items[1], obj = { innerHTML: slow.name };
	slow.setup(obj);
	(listeners.DidPracticeChange || []).forEach(f => f({ tempo: 0.7, semis: 0, keep: true }));
	ok('速度不是 100% 時慢速項目顯示 ✔', /&#10004;/.test(obj.innerHTML));
	(listeners.DidPracticeChange || []).forEach(f => f({ tempo: 1, semis: 0, keep: true }));
	ok('回到 100% 時 ✔ 消失', !/&#10004;/.test(obj.innerHTML));
	/* 有快捷鍵模組時，名稱後面帶快捷鍵提示 */
	PKAE._deps.shortcuts = { hint: id => '<span class="pk_shrtct" data-sc="' + id + '">' + id + '</span>' };
	const M2 = PKAE._deps._menuEffects(PKAE);
	const pm2 = M2.children.find(x => x.children && /練習速度/.test(x.name));
	ok('選單項目帶快捷鍵提示', pm2.children.filter(x => x.name !== '---').every(x => /pk_shrtct/.test(x.name)) && /pk_shrtct/.test(M2.children.find(x => /fx\.speed_rate/.test(x.name)).name));
})();

/* 12. 語言檔：三份都有新鍵，且沒有缺漏 */
const need = ['pr.semis_tape', 'fx.practice', 'fx.practice_panel', 'fx.practice_slow', 'fx.practice_tempo_dn', 'fx.practice_tempo_up', 'fx.practice_pitch_dn', 'fx.practice_pitch_up', 'fx.practice_reset'].concat(names.map(n => 'sc.act.' + n));
for (const f of ['lang-en.js', 'lang-zh-TW.js', 'lang-kasu.js']) {
	const s = fs.readFileSync(f, 'utf8'); const miss = need.filter(k => !s.includes("'" + k + "':"));
	ok(f + ' 新鍵齊全', !miss.length, miss.join(','));
}
console.log(fail ? '\n有 ' + fail + ' 項失敗' : '\n全部通過');
