/* 5-1 驗收：批次處理的「時間與音高」步驟（純 Node，沒有 Worker → 走主執行緒退回路徑） */
const fs = require('fs');
const w = { localStorage: { getItem: () => null, setItem () {} } };      /* 沒有 w.Worker */
const g = w;
for (const f of ['timepitch-engine.js','timepitch-f0.js','timepitch-f0-edit.js','timepitch-psola.js','timepitch-speech.js'])
	new Function('self', fs.readFileSync(f,'utf8').replace("typeof self !== 'undefined' ? self : this",'self'))(g);
const PKAE = { _deps: {} };
new Function('window','document','PKAudioEditor', 'return (' + 'function(){}' + ')') ;
const src = fs.readFileSync('batch.js','utf8');
new Function('window','document','PKAudioEditor','OneUp', src.replace(/\}\)\( window, document, PKAudioEditor \);\s*$/, '})( window, document, PKAudioEditor );'))(w, {}, PKAE, () => {});
const T = PKAE._deps.batch._tp;
const F0 = w.PKF0;
let fail = 0; const ok = (n, c, i) => { console.log((c ? 'PASS ' : 'FAIL ') + n + (i ? '  ' + i : '')); if (!c) { fail++; process.exitCode = 1; } };

const sr = 22050;
function voice (secs, f0) { const n = Math.round(secs * sr), x = new Float32Array(n); let ph = 0;
	for (let i = 0; i < n; ++i) { ph += 2 * Math.PI * f0 / sr; let v = 0; for (let k = 1; k <= 8; ++k) v += Math.sin(k * ph) / k; x[i] = 0.2 * v; } return x; }
function speechWithPause () { const a = voice(0.8, 200), b = new Float32Array(Math.round(1.2 * sr)), c = voice(0.8, 200), x = new Float32Array(a.length + b.length + c.length); x.set(a); x.set(c, a.length + b.length); return x; }
const med = x => { const t = F0.track([x], sr, {}), v = []; for (let i = 0; i < t.n; ++i) if (t.f0[i] > 0) v.push(1200 * Math.log2(t.f0[i])); v.sort((a, b) => a - b); return v[v.length >> 1]; };
const D = { tpt: 100, tps: 0, tpq: 'speech', tpf: true, tpp: 0 };
const cfg = o => Object.assign({}, D, o);

ok('預設值 → 不處理', !T.on(cfg({})));
ok('速度 125 → 處理', T.on(cfg({ tpt: 125 })) && T.on(cfg({ tps: -2 })) && T.on(cfg({ tpp: 0.3 })));
ok('速度 100.04% 視為沒變', !T.on(cfg({ tpt: 100.04 })));

(async () => {
	const x = voice(3, 200), N = x.length;
	let pl = T.stages(cfg({ tpt: 125 }), [x], sr);
	ok('只改速度 → 1 個階段、不保留共振峰', pl.st.length === 1 && pl.st[0].tempo === 1.25 && pl.st[0].pitch === 0 && pl.st[0].formant === false);
	let out = await T.run([x, x.map(v => v * 0.5)], sr, pl.st);
	ok('速度 125%：長度 = 原長 ÷ 1.25（±1）', Math.abs(out[0].length - Math.round(N / 1.25)) <= 1 && out[0].length === out[1].length, out[0].length + ' vs ' + Math.round(N / 1.25));
	ok('速度 125%：音高不變（±10 音分）', Math.abs(med(out[0]) - med(x)) < 10, (med(out[0]) - med(x)).toFixed(1));

	pl = T.stages(cfg({ tps: 3 }), [x], sr);
	ok('只改音高 → 保留共振峰', pl.st.length === 1 && pl.st[0].formant === true && pl.st[0].tempo === 1);
	out = await T.run([x], sr, pl.st);
	ok('音高 +3 半音：+300 音分（±15）、長度不變', Math.abs(med(out[0]) - med(x) - 300) < 15 && out[0].length === N, '+' + (med(out[0]) - med(x)).toFixed(0));

	pl = T.stages(cfg({ tpt: 80, tps: -5, tpq: 'music', tpf: false }), [x], sr);
	out = await T.run([x], sr, pl.st);
	ok('速度 80% + 音高 −5（音樂模式）：長度與音高都對', Math.abs(out[0].length - Math.round(N / 0.8)) <= 2 && Math.abs(med(out[0]) - med(x) + 500) < 20, (med(out[0]) - med(x)).toFixed(0) + ' 音分');

	const sp = speechWithPause();
	pl = T.stages(cfg({ tpp: 0.3 }), [sp], sr);
	ok('停頓上限 0.3 秒 → 一個 retime 階段', pl.st.length === 1 && pl.st[0].mode === 'retime' && pl.st[0].pauses.length >= 1);
	out = await T.run([sp], sr, pl.st);
	const cut = (sp.length - out[0].length) / sr;
	ok('停頓縮短：1.2 秒的停頓縮到約 0.3 秒（少約 0.9 秒）', cut > 0.8 && cut < 1.0, '少 ' + cut.toFixed(2) + ' 秒');

	pl = T.stages(cfg({ tpp: 0.5, tpt: 150, tps: 2 }), [sp], sr);
	out = await T.run([sp], sr, pl.st);
	ok('三者並用：2 個階段、輸出有限值', pl.st.length === 2 && out[0].every(Number.isFinite), pl.st.map(s => s.mode || 'base').join(' → '));

	const long = { length: sr * 700 }; const pl2 = T.stages(cfg({ tpp: 0.3 }), [long], sr);
	ok('超過 10 分鐘 → 略過停頓縮短並留下備註', pl2.st.length === 0 && pl2.notes.length === 1, pl2.notes[0]);
	ok('報告文字', T.label(cfg({ tpt: 125, tps: 2, tpp: 0.3 })).indexOf('125') > -1 && T.label(cfg({ tpt: 125, tps: 2, tpp: 0.3 })).indexOf('0.3') > -1, T.label(cfg({ tpt: 125, tps: 2, tpp: 0.3 })));
	console.log(fail ? '\n有 ' + fail + ' 項失敗' : '\n全部通過');
})();
