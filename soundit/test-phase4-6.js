/* 階段 4-6 驗收：對話框的階段規劃（planStages）＋ 聲調／輪廓／停頓／語速的完整處理鏈
 * 執行：node test-phase4-6.js（需要同資料夾的 timepitch-*.js 與 ui-fx-timepitch.js；不需要瀏覽器或 jsdom） */
const fs = require('fs');
const self = {};
for (const f of ['timepitch-engine.js','timepitch-f0.js','timepitch-f0-edit.js','timepitch-psola.js','timepitch-speech.js'])
	new Function('self', fs.readFileSync(f,'utf8').replace("typeof self !== 'undefined' ? self : this",'self'))(self);
const TP = self.PKTimePitch, F0 = self.PKF0, Ed = self.PKF0Edit, SPc = self.PKSpeech;

/* 取出對話框裡的純函式（不會執行 attach，所以不需要 DOM） */
const win = { PKLocale: null }, doc = {};
new Function('window','document', fs.readFileSync('ui-fx-timepitch.js','utf8'))(win, doc);
const UI = win.PKTimePitchUI;

let fail = 0;
const ok = (name, c, info) => { console.log((c ? 'PASS ' : 'FAIL ') + name + (info ? '  ' + info : '')); if (!c) { fail++; process.exitCode = 1; } };

/* ---------- 合成「語音」：每個音節 0.26 秒的諧波音，F0 沿聲調滑動；三句，句間停頓 0.6 秒 ---------- */
const sr = 22050;
const TONES = [[180, 240], [240, 160], [200, 200], [170, 230], [250, 170], [190, 215]];   /* 起、終 F0 (Hz) */
function makeSpeech () {
	const parts = []; let len = 0, ti = 0;
	const add = (n, p) => { parts.push([len, n, p]); len += n; };
	for (let ph = 0; ph < 3; ++ph) {
		for (let s = 0; s < 3; ++s) {
			const t = TONES[ti++ % TONES.length];
			add(Math.round(0.26 * sr), { f0a: t[0], f0b: t[1] });
			add(Math.round(0.05 * sr), null);
		}
		if (ph < 2) add(Math.round(0.6 * sr), null);
	}
	const x = new Float32Array(len);
	for (const [st, n, p] of parts) {
		if (!p) continue;
		let phase = 0;
		for (let i = 0; i < n; ++i) {
			phase += 2 * Math.PI * (p.f0a + (p.f0b - p.f0a) * i / n) / sr;
			let v = 0; for (let k = 1; k <= 8; ++k) v += Math.sin(k * phase) / k;
			x[st + i] = 0.25 * v * Math.pow(Math.sin(Math.PI * (i + 0.5) / n), 0.5);
		}
	}
	return x;
}
const x = makeSpeech(), N = x.length;
const stereo = [x, x.map(v => v * 0.5)];
console.log('合成語音：' + (N / sr).toFixed(2) + ' 秒，三句、九個音節');

function runStages (chs, stages) { let d = chs; for (const o of stages) d = TP.process(d, sr, Object.assign({}, o)); return d; }
function runs (tr) {                       /* 連續有聲段的 F0 範圍（音分，P10~P90）與中位數 */
	const out = []; let cur = [];
	for (let i = 0; i <= tr.n; ++i) {
		if (i < tr.n && tr.f0[i] > 0) cur.push(1200 * Math.log2(tr.f0[i]));
		else { if (cur.length >= 12) { const s = cur.slice().sort((a, b) => a - b); out.push({ range: s[Math.floor(s.length*.9)] - s[Math.floor(s.length*.1)], med: s[s.length >> 1] }); } cur = []; }
	}
	return out;
}
const meanOf = a => a.reduce((s, v) => s + v, 0) / (a.length || 1);
const base = F0.track([x], sr, {});
const baseRuns = runs(base);
const before = meanOf(baseRuns.map(a => a.range));
console.log('原始偵測：' + baseRuns.length + ' 段有聲，平均起伏 ' + before.toFixed(0) + ' 音分');
ok('原始音訊偵測出 9 個音節段', baseRuns.length >= 8 && baseRuns.length <= 10, '得 ' + baseRuns.length);

/* ===================== 一、planStages（對話框的階段規劃） ===================== */
const S0 = () => Object.assign({ tempo: 1, semis: 0, link: false, mode: 'speech', formant: false, fshift: 0 }, UI.defaults());
const spd = { f0: base, f0Target: base, base: 0 };
{
	ok('預設狀態 → 不需處理', UI.plan({ S: S0() }).length === 0);
	let S = S0(); S.tempo = 1.25;
	let p = UI.plan({ S }); ok('只改速度 → 1 階段（一般伸縮）', p.length === 1 && p[0].tempo === 1.25 && p[0].mode === 'speech');
	S = S0(); S.tone = 'flatten'; S.toneAmt = 1; S.semis = 3;
	p = UI.plan({ S, sp: spd });
	ok('聲調＋移調 → 只有 PSOLA 一階段，音高由 PSOLA 處理', p.length === 1 && p[0].mode === 'psola' && p[0].pitch === 3);
	S.formant = true; S.fshift = 2; p = UI.plan({ S, sp: spd });
	ok('聲調＋共振峰位移 → PSOLA 之後再接一般階段（音高 0、只做共振峰）', p.length === 2 && p[1].pitch === 0 && p[1].formantShift === 2 && p[1].formant === true);
	S = S0(); S.link = true; S.tone = 'enhance'; S.toneAmt = 1; S.tempo = 1.25;
	p = UI.plan({ S, sp: spd }); ok('連動（磁帶）模式 → 聲調不作用', p.length === 1 && p[0].link === true);
	S = S0(); S.sTempo = 1.2; S.pScale = 0.5; S.pMax = 0.3;
	const pauses = [{ a: 1, b: 1.5 }, { a: 3, b: 3.2, tail: true }];
	p = UI.plan({ S, sp: { pauses }, co: { tempoCurve: [{ t: 0, v: 1 }, { t: 1, v: 2 }], pitchCurve: [{ t: 0, v: 0 }, { t: 1, v: 3 }] } });
	ok('重排啟用 → 曲線被忽略，只有 retime 階段', p.length === 1 && p[0].mode === 'retime' && p[0].speechTempo === 1.2 && p[0].pauseScale === 0.5 && p[0].pauseMax === 0.3);
	const q = UI.plan({ S, sp: { pauses }, shift: 1.2, dur: 1.5 })[0].pauses;
	ok('預覽片段（起點 1.2 秒、長 1.5 秒）：停頓平移並裁切，片段外的去掉', q.length === 1 && Math.abs(q[0].a - 0) < 1e-9 && Math.abs(q[0].b - 0.3) < 1e-9, JSON.stringify(q));
	S = S0(); S.tone = 'enhance'; S.toneAmt = 0; ok('強度 0 → 不需處理', UI.plan({ S, sp: spd }).length === 0);
	S = S0(); S.useView = true; S.semis = 2; p = UI.plan({ S, sp: { f0: base, f0Target: base, base: 1.5 }, shift: 0.5 });
	ok('改用主畫面輪廓：trackOffset = base + shift', p.length === 1 && p[0].mode === 'psola' && Math.abs(p[0].trackOffset - 2.0) < 1e-9);
	S = S0(); S.useView = true; ok('主畫面輪廓不可用（沒有 f0Target）→ 不產生 PSOLA 階段', UI.plan({ S, sp: {} }).length === 0);
	S = S0(); S.sTempo = 1.0001; ok('語速差 < 0.1% 視為沒變', !UI.retimeOn(S));
}

/* ===================== 二、聲調：壓平／增強（音節為單位）→ PSOLA → 再偵測 ===================== */
function toneRun (mode, amount, extra) {
	const ed = Ed.create(base);
	const origCopy = Float32Array.from(base.f0);
	SPc.toneEdit(ed, { mode, amount, scope: 'syllable', channels: [x], sr });
	const same = origCopy.every((v, i) => v === base.f0[i]);
	const S = Object.assign(S0(), { tone: mode, toneAmt: amount }, extra || {});
	const st = UI.plan({ S, sp: { f0: base, f0Target: ed.edited, base: 0 } });
	const out = runStages([x], st);
	return { out, same, tr: F0.track(out, sr, {}), ed };
}
{
	const r = toneRun('flatten', 1);
	const after = meanOf(runs(r.tr).map(a => a.range));
	ok('壓平不會改到原始軌跡', r.same);
	ok('壓平 100%：長度不變', r.out[0].length === N, r.out[0].length + ' vs ' + N);
	ok('壓平 100%：音節內起伏縮小到 30% 以下', after < before * 0.3, before.toFixed(0) + ' → ' + after.toFixed(0) + ' 音分');
	const pk = Math.max(...r.out[0].map(Math.abs)), pk0 = Math.max(...x.map(Math.abs));
	ok('壓平：無 NaN、峰值不超過原來的 1.3 倍', r.out[0].every(Number.isFinite) && pk < pk0 * 1.3, '峰值 ' + pk.toFixed(3) + ' / ' + pk0.toFixed(3));
	const e = toneRun('enhance', 0.5), after2 = meanOf(runs(e.tr).map(a => a.range));
	ok('增強 50%：音節內起伏變大（≥1.3 倍）', after2 > before * 1.3, before.toFixed(0) + ' → ' + after2.toFixed(0) + ' 音分');
	const cmp = Ed.compare(e.ed.edited, e.tr);
	ok('增強後再偵測：與編輯目標的中位差 < 30 音分', cmp.medianCents < 30, '中位 ' + cmp.medianCents.toFixed(1) + '，P90 ' + cmp.p90Cents.toFixed(1));
	const sh = toneRun('flatten', 0.7, { semis: 4 });
	const dMed = meanOf(runs(sh.tr).map(a => a.med)) - meanOf(baseRuns.map(a => a.med));
	ok('壓平＋同時升 4 個半音：音高 +400 音分（±25）', Math.abs(dMed - 400) < 25, '+' + dMed.toFixed(0) + ' 音分');
}

/* ===================== 三、改用主畫面編輯過的輪廓（整份檔案的一段） ===================== */
{
	const ed = Ed.create(base); ed.shift(200);                        /* 整體升 200 音分 */
	const s0 = Math.round(1.0 * sr), s1 = Math.round(3.0 * sr);       /* 處理第 1~3 秒 */
	const seg = x.subarray(s0, s1);
	const S = Object.assign(S0(), { useView: true });
	/* 軌跡從檔案 0 秒開始（offset = 0），所以 base = selStart - offset = 1.0 */
	const st = UI.plan({ S, sp: { f0: ed.orig, f0Target: ed.edited, base: 1.0 }, shift: 0 });
	const out = runStages([seg], st);
	const a = runs(F0.track([seg], sr, {})), b = runs(F0.track(out, sr, {}));
	const d = meanOf(b.map(r => r.med)) - meanOf(a.map(r => r.med));
	ok('輪廓整體 +200 音分 → 選取範圍重新偵測 +200 音分（±20）', Math.abs(d - 200) < 20, '+' + d.toFixed(0));
	ok('選取範圍長度不變', out[0].length === seg.length);
}

/* ===================== 四、停頓與語速（retime） ===================== */
const auto = SPc.findPauses([x], sr, {});
console.log('自動偵測停頓：' + auto.length + ' 段');
ok('偵測到兩個約 0.6 秒的句間停頓', auto.filter(p => p.b - p.a > 0.45 && p.b - p.a < 0.7).length === 2, auto.map(p => (p.b - p.a).toFixed(2)).join(' '));
const md = a => { let m = 0; for (let i = 1; i < a.length; ++i) m = Math.max(m, Math.abs(a[i] - a[i-1])); return m; };
{
	const S = Object.assign(S0(), { pScale: 0.5, pMax: 0.25 });
	const plan = SPc.makePlan(N, sr, { pauses: auto, pauseScale: S.pScale, pauseMax: S.pMax });
	const out = runStages([x], UI.plan({ S, sp: { pauses: auto }, dur: N / sr }));
	ok('縮短停頓：實際長度 = makePlan 預測（±1 取樣）', Math.abs(out[0].length - plan.outLen) <= 1, out[0].length + ' vs ' + plan.outLen);
	ok('縮短停頓：總長度確實變短', out[0].length < N * 0.95, ((N - out[0].length) / sr).toFixed(2) + ' 秒');
	ok('縮短停頓：沒有接合爆音', md(out[0]) <= md(x) * 1.05, md(out[0]).toFixed(3) + ' vs ' + md(x).toFixed(3));
	const dm = meanOf(runs(F0.track(out, sr, {})).map(r => r.med)) - meanOf(baseRuns.map(r => r.med));
	ok('縮短停頓：語音音高不變（±10 音分）', Math.abs(dm) < 10, dm.toFixed(1));
}
{
	const S = Object.assign(S0(), { sTempo: 1.25 });
	const plan = SPc.makePlan(N, sr, { pauses: auto, speechTempo: 1.25 });
	const out = runStages([x], UI.plan({ S, sp: { pauses: auto }, dur: N / sr }));
	ok('語速 125%：長度 = makePlan 預測（±1）', Math.abs(out[0].length - plan.outLen) <= 1, out[0].length + ' vs ' + plan.outLen);
	const sylIn = SPc.speechRate(SPc.syllables(base, { channels: [x], sr }), N / sr, auto);
	const tr2 = F0.track(out, sr, {});
	const sylOut = SPc.speechRate(SPc.syllables(tr2, { channels: out, sr }), out[0].length / sr, SPc.findPauses(out, sr, {}));
	ok('語速 125%：每秒音節數提高約 25%（±12%）', Math.abs(sylOut.perSec / sylIn.perSec - 1.25) < 0.12,
		sylIn.perSec.toFixed(2) + ' → ' + sylOut.perSec.toFixed(2) + ' 音節/秒（音節 ' + sylIn.syllables + ' → ' + sylOut.syllables + '）');
	const dm = meanOf(runs(tr2).map(r => r.med)) - meanOf(baseRuns.map(r => r.med));
	ok('語速 125%：音高不變（±15 音分）', Math.abs(dm) < 15, dm.toFixed(1));
}
{
	const gap = auto.find(p => p.b - p.a > 0.45 && !p.head && !p.tail);
	const mk = [{ time: 0.1, end: gap.a - 0.03 }, { time: gap.b + 0.03, end: gap.b + 0.8 }];
	const mp = SPc.pausesFromMarkers(mk, N / sr, auto, {});
	ok('依標記：區間標記之間的空隙成為停頓', mp.length === 1 && mp[0].b - mp[0].a > 0.4, JSON.stringify(mp.map(p => [+p.a.toFixed(2), +p.b.toFixed(2)])));
	const mp2 = SPc.pausesFromMarkers([{ time: (gap.a + gap.b) / 2 }, { time: 0.4 }], N / sr, auto, {});
	ok('依標記：落在靜音裡的點標記取自動停頓、落在語音裡的忽略', mp2.length === 1 && Math.abs(mp2[0].a - gap.a) < 1e-9);
}

/* ===================== 五、完整處理鏈：PSOLA → 重排 → 一般伸縮（立體聲） ===================== */
{
	const ed = Ed.create(base); SPc.toneEdit(ed, { mode: 'flatten', amount: 0.6, scope: 'syllable', channels: [x], sr });
	const S = Object.assign(S0(), { tone: 'flatten', toneAmt: 0.6, semis: 2, pScale: 0.5, sTempo: 1.1, tempo: 1.2, mode: 'speech' });
	const st = UI.plan({ S, sp: { f0: base, f0Target: ed.edited, base: 0, pauses: auto }, dur: N / sr });
	ok('完整鏈：三個階段，順序為 psola → retime → 一般', st.length === 3 && st[0].mode === 'psola' && st[1].mode === 'retime' && st[2].mode === 'speech' && st[2].pitch === 0 && st[2].tempo === 1.2);
	const t0 = Date.now(), out = runStages(stereo, st), ms = Date.now() - t0;
	const expect = SPc.makePlan(N, sr, { pauses: auto, speechTempo: 1.1, pauseScale: 0.5 }).outLen / 1.2;
	ok('完整鏈：長度 = 重排長度 ÷ 1.2（誤差 < 0.2%）', Math.abs(out[0].length / expect - 1) < 0.002, out[0].length + ' vs ' + Math.round(expect));
	ok('完整鏈：兩聲道等長、無 NaN', out.length === 2 && out[0].length === out[1].length && out.every(c => c.every(Number.isFinite)));
	let worst = 0; for (let i = 0; i < out[0].length; ++i) worst = Math.max(worst, Math.abs(out[1][i] - 0.5 * out[0][i]));
	ok('完整鏈：立體聲左右比例維持 0.5（最大差 < 0.02）', worst < 0.02, worst.toExponential(1));
	const dm = meanOf(runs(F0.track([out[0]], sr, {})).map(r => r.med)) - meanOf(baseRuns.map(r => r.med));
	ok('完整鏈：音高 +200 音分（±25）', Math.abs(dm - 200) < 25, '+' + dm.toFixed(0));
	console.log('  完整鏈耗時 ' + ms + ' ms（' + (N / sr).toFixed(1) + ' 秒立體聲）');
}

/* ===================== 六、邊界 ===================== */
{
	const short = x.subarray(0, Math.round(0.05 * sr));
	let thrown = null, o;
	try { o = TP.process([short], sr, { mode: 'retime', speechTempo: 1.5, pauseScale: 0.5, pauses: [] }); } catch (e) { thrown = e; }
	ok('極短音訊（50 ms）重排不拋錯', !thrown && o[0].length > 0, thrown && thrown.message);
	const sil = new Float32Array(sr * 2);
	let t2 = null, o2; try { o2 = TP.process([sil], sr, { mode: 'psola', pitch: 3 }); } catch (e) { t2 = e; }
	ok('全靜音 PSOLA 不拋錯、輸出仍為靜音', !t2 && o2[0].length === sil.length && o2[0].every(v => v === 0), t2 && t2.message);
	let t3 = null; try { SPc.findPauses([sil], sr, {}); } catch (e) { t3 = e; }
	ok('全靜音偵測停頓不拋錯', !t3, t3 && t3.message);
}

console.log(fail ? '\n有 ' + fail + ' 項失敗' : '\n全部通過');
