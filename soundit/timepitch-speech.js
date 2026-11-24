/* Soundit 時間與音高：語音工具（階段 4-5）
 *
 * 純 JS。同一份檔案可在 Worker（importScripts）、主執行緒或 Node 載入。
 * 重排（retime）會呼叫 PKTimePitch（timepitch-engine.js）做時間伸縮，所以引擎要先載入。
 *
 *   ── 聲調（音節為單位）──
 *   PKSpeech.syllables ( track, { channels, sr, dipDb, minSyl, minRun, jumpSemi } ) → [ { i0, i1, a, b } ]
 *       把軌跡的連續有聲段，再依「能量低谷」與「F0 跳動」切成音節（i0~i1 是幀範圍 [i0,i1)，a、b 是秒）。
 *       channels 是和軌跡同一起點的音訊（Float32Array[]），sr 是它的取樣率；沒給就退而用軌跡的 conf（較不準）。
 *   PKSpeech.toneEdit ( ed, { mode, amount, scope, from, to, channels, sr, syllables, maxDevCents } ) → 被改動的幀數
 *       mode   'enhance'（增強，amount 0~2）｜'flatten'（壓平，amount 0~1）
 *       scope  'syllable'（預設，每個音節各自相對自己的平均）｜'phrase'（整個連續有聲段，等於 ed.enhance / ed.flatten）
 *       from / to  作用範圍（秒，相對軌跡起點）；音節只要有 50% 以上落在範圍內就整個音節處理
 *       整個動作只留一筆復原紀錄；增強時每個音節的起伏上限 maxDevCents（預設 ±700 音分），避免放大成怪聲
 *
 *   ── 停頓與語速 ──
 *   PKSpeech.findPauses ( channels, sr, { relDb, minPause, pad, floorDb } ) → [ { a, b, head, tail } ]（秒）
 *       relDb 相對「有聲音量（第 90 百分位）」的靜音門檻，預設 −35 dB；minPause 最短停頓，預設 0.15 秒；
 *       pad 停頓兩端各留給語音的緩衝，預設 0.03 秒（回傳的 a、b 已扣掉緩衝）；head / tail = 檔頭、檔尾的靜音
 *   PKSpeech.pausesFromMarkers ( markers, durSec, autoPauses, { minPause, pad } ) → 停頓陣列
 *       依編輯器標記決定哪些是停頓：區間標記之間的空隙，以及落在 autoPauses 裡的點標記（自動分割「依靜音」的結果）
 *   PKSpeech.speechRate ( syllables, durSec, pauses ) → { syllables, speechSec, perSec }   每秒音節數（不含停頓）
 *   PKSpeech.makePlan ( n, sr, opts ) → plan    只算「怎麼重排」，不處理音訊；plan.map ( 秒 ) 把輸入時間換成輸出時間
 *   PKSpeech.process ( channels, sr, opts ) → Float32Array[]
 *       opts.speechTempo  語音段速度倍率，預設 1（0.25~4）
 *       opts.pauses       停頓清單（秒，相對輸入起點）；沒給就只調語速
 *       opts.pauseScale   停頓長度倍率，預設 1（0~4）
 *       opts.pauseMax     停頓最長秒數（超過的截短），預設不限
 *       opts.pauseMin     停頓縮短後至少保留的秒數，預設 0.05（短於這個長度的停頓不會再被縮短）
 *       opts.keepEdges    檔頭、檔尾的靜音不動，預設 true
 *       opts.speechMode   語音段用的伸縮模式（'speech'｜'music'｜'perc'…），預設 'speech'
 *       opts.onprogress ( 0~1 )
 *     引擎的 process() 在 opts.mode === 'retime' 時會分派到這裡（'speech' 已經是 WSOLA 的模式名，所以不能重用）。
 *
 * 做法：
 *   1. 停頓偵測：10 ms 跳距的 RMS（dB）；低於「有聲音量 + relDb」且連續超過 minPause 的區段就是停頓。
 *   2. 重排：整段切成「語音」「停頓」「檔頭尾」三種；語音段各自用 WSOLA 變速，停頓段縮短或拉長，其餘原樣複製。
 *      縮短 = 從停頓中間切掉一段並以 10 ms 等功率交叉淡化接起來（切點在靜音裡，聽不到）；
 *      拉長 = 該段停頓以引擎伸縮（底噪、嗡聲維持質感）。語音與停頓的交界不做任何處理，所以字頭字尾不會被吃掉。
 *   3. 音節切分：連續有聲段內，找能量低谷（深度 ≥ dipDb、兩側各 ≥ minSyl 幀）以及相鄰幀 F0 跳動過大的位置切開。
 */
(function ( root ) {
	'use strict';

	function clamp ( v, a, b ) { return v < a ? a : v > b ? b : v; }

	function mono ( chs ) {
		var n = chs[0].length, nch = chs.length;
		if (nch === 1) return chs[0];
		var m = new Float32Array ( n ), c, i, inv = 1 / nch;
		for (c = 0; c < nch; ++c) { var ch = chs[c]; for (i = 0; i < n; ++i) m[i] += ch[i] * inv; }
		return m;
	}

	/* ---------- 能量包絡（dB，第 i 幀以 i/rate 秒為中心） ---------- */
	function envelope ( x, sr, rate, n, winSec ) {
		var len = x.length, pre = new Float64Array ( len + 1 ), i;
		for (i = 0; i < len; ++i) pre[i + 1] = pre[i] + x[i] * x[i];
		var half = Math.max ( 1, Math.round ( ( winSec || 0.025 ) * sr / 2 ) ), db = new Float32Array ( n );
		for (i = 0; i < n; ++i) {
			var c = Math.round ( i / rate * sr ), a = Math.max ( 0, c - half ), b = Math.min ( len, c + half );
			var ms = b > a ? ( pre[b] - pre[a] ) / ( b - a ) : 0;
			db[i] = 10 * Math.log10 ( ms + 1e-12 );
		}
		return db;
	}

	/* ====================================================================
	 * 音節
	 * ==================================================================== */
	function syllables ( track, opts ) {
		opts = opts || {};
		var rate = track.rate, n = track.n, f0 = track.f0, conf = track.conf, i, j;
		var dipDb = opts.dipDb === undefined ? 6 : +opts.dipDb;
		var minSyl = opts.minSyl || Math.max ( 2, Math.round ( 0.06 * rate ) );
		var minRun = opts.minRun || Math.max ( 2, Math.round ( 0.05 * rate ) );
		var jumpSemi = opts.jumpSemi === undefined ? 4 : +opts.jumpSemi;
		var W = Math.round ( 0.4 * rate );

		var e;
		var sr2 = opts.smooth === undefined ? 1 : Math.max ( 0, Math.round ( +opts.smooth ) );   /* 平滑半徑（幀）：1 = 3 幀 */
		if (opts.channels && opts.sr) e = envelope ( mono ( opts.channels ), opts.sr, rate, n, opts.envWin || 0.015 );
		else { e = new Float32Array ( n ); for (i = 0; i < n; ++i) e[i] = 20 * Math.log10 ( 0.05 + ( conf ? conf[i] : 1 ) ); }

		var out = [], s = -1;
		for (i = 0; i <= n; ++i) {
			var on = i < n && f0[i] > 0;
			if (on && s < 0) { s = i; continue; }
			if (on || s < 0) continue;
			var rs = s, re = i; s = -1;
			if (re - rs < minRun) continue;

			/* 段內平滑（預設 3 幀；太強會把 40～60 ms 的淺低谷抹掉） */
			var sm = new Float32Array ( re - rs ), k;
			for (j = rs; j < re; ++j) {
				var acc = 0, cnt = 0;
				for (k = -sr2; k <= sr2; ++k) { var p = j + k; if (p >= rs && p < re) { acc += e[p]; ++cnt; } }
				sm[j - rs] = acc / cnt;
			}

			/* 強制切點：相鄰幀 F0 跳太大 */
			var cuts = [];
			for (j = rs + 1; j < re; ++j) {
				if (Math.abs ( 12 * Math.log ( f0[j] / f0[j - 1] ) / Math.LN2 ) > jumpSemi) cuts.push ( j );
			}

			/* 能量低谷候選，依深度由大到小接受 */
			var cand = [];
			for (j = rs + 2; j < re - 2; ++j) {
				var v = sm[j - rs];
				if (!( v <= sm[j - rs - 1] && v < sm[j - rs + 1] )) continue;
				var L = -1e9, R = -1e9;
				for (k = Math.max ( rs, j - W ); k <= j; ++k) if (sm[k - rs] > L) L = sm[k - rs];
				for (k = j; k <= Math.min ( re - 1, j + W ); ++k) if (sm[k - rs] > R) R = sm[k - rs];
				var prom = Math.min ( L, R ) - v;
				if (prom >= dipDb) cand.push ({ i: j, prom: prom });
			}
			cand.sort ( function ( x, y ) { return y.prom - x.prom; } );

			function okCut ( c, gap ) {
				if (c - rs < gap || re - c < gap) return false;
				for (var q = 0; q < cuts.length; ++q) if (Math.abs ( cuts[q] - c ) < gap) return false;
				return true;
			}
			for (j = 0; j < cand.length; ++j) if (okCut ( cand[j].i, minSyl )) cuts.push ( cand[j].i );
			cuts.sort ( function ( x, y ) { return x - y; } );

			var bounds = [ rs ].concat ( cuts, [ re ] );
			for (j = 0; j + 1 < bounds.length; ++j) {
				var a0 = bounds[j], b0 = bounds[j + 1];
				if (b0 - a0 >= minRun) out.push ({ i0: a0, i1: b0, a: ( a0 - 0.5 ) / rate, b: ( b0 - 0.5 ) / rate });
			}
		}
		return out;
	}

	function speechRate ( sylls, durSec, pauses ) {
		var ps = 0, i;
		for (i = 0; pauses && i < pauses.length; ++i) ps += Math.max ( 0, pauses[i].b - pauses[i].a );
		var sp = Math.max ( 1e-6, durSec - ps );
		return { syllables: sylls.length, speechSec: sp, perSec: sylls.length / sp };
	}

	/* ====================================================================
	 * 聲調編輯（透過 PKF0Edit 的公開方法，所以復原／重做、手繪限制都沿用）
	 * ==================================================================== */
	function maxDevCents ( f, i0, i1 ) {
		var m = 0, c = 0, i;
		for (i = i0; i < i1; ++i) if (f[i] > 0) { m += Math.log ( f[i] ) / Math.LN2; ++c; }
		if (!c) return 0;
		m /= c;
		var d = 0;
		for (i = i0; i < i1; ++i) if (f[i] > 0) d = Math.max ( d, Math.abs ( Math.log ( f[i] ) / Math.LN2 - m ) );
		return d * 1200;
	}

	function toneEdit ( ed, opts ) {
		opts = opts || {};
		var mode = opts.mode === 'flatten' ? 'flatten' : 'enhance';
		var amount = +opts.amount || 0;
		amount = mode === 'flatten' ? clamp ( amount, 0, 1 ) : clamp ( amount, 0, 2 );
		if (amount <= 0) return 0;
		var hasR = opts.from !== undefined && opts.from !== null;

		if (opts.scope === 'phrase') return hasR ? ed[mode] ( amount, opts.from, opts.to ) : ed[mode] ( amount );

		var tr = ed.orig, rate = tr.rate;
		var segs = opts.syllables || syllables ( tr, opts );
		var lo = hasR ? opts.from * rate : 0, hi = opts.to !== undefined && opts.to !== null ? opts.to * rate : tr.n;
		var chosen = [], q;
		for (q = 0; q < segs.length; ++q) {
			var s = segs[q], ov = Math.min ( s.i1, hi ) - Math.max ( s.i0, lo );
			if (ov >= 0.5 * ( s.i1 - s.i0 )) chosen.push ( s );
		}
		if (!chosen.length) return 0;

		var cap = +opts.maxDevCents || 700, changed = 0;
		ed.beginStroke ();
		try {
			for (q = 0; q < chosen.length; ++q) {
				var c = chosen[q], am = amount;
				if (mode === 'enhance') {
					var dev = maxDevCents ( ed.edited.f0, c.i0, c.i1 );
					if (dev > 0) am = Math.min ( am, Math.max ( 0, cap / dev - 1 ) );
				}
				if (am <= 0) continue;
				/* 用「幀中心」當範圍邊界：ed 內部是 floor / ceil，避免浮點誤差多算或少算一幀 */
				changed += ed[mode] ( am, ( c.i0 + 0.5 ) / rate, ( c.i1 - 0.5 ) / rate );
			}
		}
		finally { ed.endStroke (); }
		return changed;
	}

	/* ====================================================================
	 * 停頓偵測
	 * ==================================================================== */
	function findPauses ( channels, sr, opts ) {
		opts = opts || {};
		var relDb = opts.relDb === undefined ? -35 : +opts.relDb;
		var minPause = opts.minPause === undefined ? 0.15 : +opts.minPause;
		var pad = opts.pad === undefined ? 0.03 : +opts.pad;
		var floorDb = opts.floorDb === undefined ? -75 : +opts.floorDb;

		var x = mono ( channels ), dur = x.length / sr, rate = 100, n = Math.floor ( dur * rate ) + 1, i;
		var db = envelope ( x, sr, rate, n, 0.025 );

		var sorted = Float32Array.from ( db ).sort ();
		var p90 = sorted[Math.min ( n - 1, Math.floor ( n * 0.9 ) )];
		var thr = Math.max ( p90 + relDb, floorDb );

		var out = [], s = -1, need = Math.max ( 1, Math.round ( minPause * rate ) );
		for (i = 0; i <= n; ++i) {
			var quiet = i < n && db[i] < thr;
			if (quiet && s < 0) { s = i; continue; }
			if (quiet || s < 0) continue;
			var e = i, st = s; s = -1;
			if (e - st < need) continue;
			var head = st === 0, tail = e === n;
			var a = Math.max ( 0, ( st - 0.5 ) / rate ), b = Math.min ( dur, ( e - 0.5 ) / rate );
			var a2 = a + ( head ? 0 : pad ), b2 = b - ( tail ? 0 : pad );
			if (b2 - a2 >= 0.03) out.push ({ a: a2, b: b2, head: head, tail: tail });
		}
		return out;
	}

	function mergePauses ( list ) {
		list.sort ( function ( x, y ) { return x.a - y.a; } );
		var out = [];
		for (var i = 0; i < list.length; ++i) {
			var p = list[i], last = out[out.length - 1];
			if (last && p.a <= last.b + 0.001) {
				last.b = Math.max ( last.b, p.b );
				last.head = last.head || p.head; last.tail = last.tail || p.tail;
			}
			else out.push ({ a: p.a, b: p.b, head: !!p.head, tail: !!p.tail });
		}
		return out;
	}

	function pausesFromMarkers ( markers, durSec, autoPauses, opts ) {
		opts = opts || {};
		var minPause = opts.minPause === undefined ? 0.15 : +opts.minPause;
		var pad = opts.pad === undefined ? 0.03 : +opts.pad;
		var m = [], i, j;
		for (i = 0; markers && i < markers.length; ++i) {
			var k = markers[i];
			if (!k || !isFinite ( k.time ) || k.time < 0) continue;
			m.push ({ t: +k.time, e: k.end > k.time ? +k.end : 0 });
		}
		m.sort ( function ( x, y ) { return x.t - y.t; } );

		var out = [];
		for (i = 0; i < m.length; ++i) {
			if (m[i].e && m[i + 1]) {                           /* 區間標記到下一個標記之間的空隙 */
				var a = m[i].e, b = Math.min ( durSec, m[i + 1].t );
				if (b - a >= minPause && b - a - 2 * pad >= 0.03) out.push ({ a: a + pad, b: b - pad, head: false, tail: false });
			}
			else if (!m[i].e && autoPauses) {                   /* 點標記落在自動偵測的停頓裡 */
				for (j = 0; j < autoPauses.length; ++j) {
					var p = autoPauses[j];
					if (m[i].t >= p.a && m[i].t <= p.b) out.push ({ a: p.a, b: p.b, head: !!p.head, tail: !!p.tail });
				}
			}
		}
		return mergePauses ( out );
	}

	/* ====================================================================
	 * 重排計畫
	 * ==================================================================== */
	function makePlan ( n, sr, opts ) {
		opts = opts || {};
		var dur = n / sr;
		var tempo = clamp ( +opts.speechTempo || 1, 0.25, 4 );
		var scale = opts.pauseScale === undefined || opts.pauseScale === null ? 1 : clamp ( +opts.pauseScale, 0, 4 );
		var pmax = opts.pauseMax > 0 ? +opts.pauseMax * sr : null;
		var pmin = opts.pauseMin === undefined ? 0.05 : Math.max ( 0, +opts.pauseMin );
		var keepEdges = opts.keepEdges !== false;

		/* 停頓清單 → 排序、截在範圍內、去重疊（取樣） */
		var ps = [], i, src = mergePauses ( ( opts.pauses || [] ).map ( function ( p ) { return { a: +p.a, b: +p.b, head: p.head, tail: p.tail }; } ) );
		for (i = 0; i < src.length; ++i) {
			var a = clamp ( Math.round ( src[i].a * sr ), 0, n ), b = clamp ( Math.round ( src[i].b * sr ), 0, n );
			if (b > a) ps.push ({ a: a, b: b, edge: keepEdges && ( a <= 0 || b >= n || src[i].head || src[i].tail ) });
		}

		var segs = [], cur = 0, o = 0;
		function push ( kind, a, b ) {
			var L = b - a, len;
			if (kind === 'speech') len = tempo === 1 ? L : Math.max ( 1, Math.round ( L / tempo ) );
			else if (kind === 'pause') {
				var t = L * scale;
				if (pmax !== null) t = Math.min ( t, pmax );
				t = clamp ( t, Math.min ( L, Math.round ( pmin * sr ) ), 4 * L );
				len = Math.max ( 1, Math.round ( t ) );
			}
			else len = L;
			segs.push ({ kind: kind, a: a, b: b, o: o, len: len });
			o += len;
		}
		for (i = 0; i < ps.length; ++i) {
			if (ps[i].a > cur) push ( 'speech', cur, ps[i].a );
			push ( ps[i].edge ? 'edge' : 'pause', ps[i].a, ps[i].b );
			cur = ps[i].b;
		}
		if (cur < n) push ( 'speech', cur, n );

		var outLen = Math.max ( 1, o );
		function map ( t ) {
			var s = t * sr;
			if (!( s > 0 )) return 0;
			if (s >= n) return outLen / sr;
			var lo = 0, hi = segs.length - 1;
			while (lo < hi) { var mid = ( lo + hi + 1 ) >> 1; if (segs[mid].a <= s) lo = mid; else hi = mid - 1; }
			var g = segs[lo], f = ( s - g.a ) / Math.max ( 1, g.b - g.a );
			return ( g.o + f * g.len ) / sr;
		}
		return { n: n, sr: sr, segs: segs, outLen: outLen, outSec: outLen / sr, map: map, tempo: tempo, pauseScale: scale };
	}

	/* ====================================================================
	 * 重排處理
	 * ==================================================================== */
	function fit ( arr, len ) {                       /* 長度對齊：多的截掉，少的用最後一個值補 */
		if (arr.length === len) return arr;
		var o = new Float32Array ( len ), m = Math.min ( len, arr.length );
		o.set ( arr.subarray ( 0, m ) );
		if (arr.length && len > m) { var v = arr[m - 1]; for (var i = m; i < len; ++i) o[i] = v; }
		return o;
	}

	function viaEngine ( slices, sr, tempo, mode ) {
		var TP = root.PKTimePitch;
		if (!TP) throw new Error ( 'PKTimePitch not loaded (timepitch-engine.js)' );
		return TP.process ( slices, sr, { tempo: tempo, mode: mode || 'speech' } );
	}

	function renderSeg ( channels, g, sr, opts ) {
		var nch = channels.length, L = g.b - g.a, c, slices = [], out = [];
		for (c = 0; c < nch; ++c) slices.push ( channels[c].subarray ( g.a, g.b ) );

		if (g.len === L || g.kind === 'edge') {
			for (c = 0; c < nch; ++c) out.push ( Float32Array.from ( slices[c] ) );
			return out;
		}

		if (g.kind === 'speech') {
			var tempo = clamp ( L / g.len, 0.25, 4 ), res;
			if (L < Math.round ( 0.02 * sr )) res = root.PKTimePitch.process ( slices, sr, { tempo: tempo, link: true } );   /* 太短：直接重新取樣 */
			else res = viaEngine ( slices, sr, tempo, opts.speechMode );
			for (c = 0; c < nch; ++c) out.push ( fit ( res[c], g.len ) );
			return out;
		}

		/* 停頓 */
		if (g.len > L) {                                   /* 拉長：引擎伸縮（≤ 4 倍） */
			var res2 = viaEngine ( slices, sr, clamp ( L / g.len, 0.25, 1 ), 'speech' );
			for (c = 0; c < nch; ++c) out.push ( fit ( res2[c], g.len ) );
			return out;
		}
		/* 縮短：中間切掉一段，10 ms 等功率交叉淡化 */
		var xf = Math.min ( Math.round ( 0.010 * sr ), g.len >> 2 );
		var h = ( g.len - xf ) >> 1, t = g.len - xf - h;
		for (c = 0; c < nch; ++c) {
			var s = slices[c], o = new Float32Array ( g.len ), k;
			for (k = 0; k < h; ++k) o[k] = s[k];
			for (k = 0; k < xf; ++k) {
				var ph = ( k + 0.5 ) / xf * Math.PI / 2;
				o[h + k] = s[h + k] * Math.cos ( ph ) + s[L - t - xf + k] * Math.sin ( ph );
			}
			for (k = 0; k < t; ++k) o[h + xf + k] = s[L - t + k];
			out.push ( o );
		}
		return out;
	}

	function process ( channels, sr, opts ) {
		opts = opts || {};
		var n = channels[0].length, nch = channels.length, report = opts.onprogress || null, c, q;
		var plan = makePlan ( n, sr, opts );
		var outs = [];
		for (c = 0; c < nch; ++c) outs.push ( new Float32Array ( plan.outLen ) );
		var total = 0, done = 0;
		for (q = 0; q < plan.segs.length; ++q) total += plan.segs[q].b - plan.segs[q].a;
		for (q = 0; q < plan.segs.length; ++q) {
			var g = plan.segs[q], piece = renderSeg ( channels, g, sr, opts );
			for (c = 0; c < nch; ++c) outs[c].set ( piece[c], g.o );
			done += g.b - g.a;
			report && report ( total ? done / total : 1 );
		}
		report && report ( 1 );
		return outs;
	}

	root.PKSpeech = {
		syllables: syllables, toneEdit: toneEdit, speechRate: speechRate,
		findPauses: findPauses, pausesFromMarkers: pausesFromMarkers,
		makePlan: makePlan, process: process, envelope: envelope, version: 1
	};
	if (typeof module !== 'undefined' && module.exports) module.exports = root.PKSpeech;
})( typeof self !== 'undefined' ? self : this );
