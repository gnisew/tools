/* Soundit 時間／音高：PSOLA 重合成（階段 4-4）
 *
 * 純 JS。同一份檔案可在 Worker（importScripts）、主執行緒或 Node 載入。
 * 由 timepitch-engine.js 的 process() 在 opts.mode === 'psola' 時分派進來，也可直接呼叫：
 *
 *   PKPsola.process ( channels, sampleRate, opts ) → Float32Array[]
 *
 *   opts.f0           原始音高軌跡（PKF0.track 的結果，Track）。省略時：若 self.PKF0 存在就自行分析
 *   opts.f0Target     目標音高軌跡（編輯後的 ed.edited）。省略時 = 原始軌跡 × opts.pitch
 *   opts.trackOffset  輸入第 0 個取樣對應的「軌跡時間」（秒），預設 0。
 *                     處理的是整份檔案的一段（從檔案時間 s0 開始）、軌跡從 L.offset 開始時，傳 s0 - L.offset
 *   opts.pitch        再額外整體移調（半音），預設 0（與 f0Target 疊加）
 *   opts.tempo        速度倍率，預設 1（0.25~4）；輸出長度 = 輸入 / tempo
 *   opts.onprogress ( 0~1 )
 *   opts.keepLevel    合成後把音量補回原本的大小（預設 true；false ＝ 不補償）
 *
 * 此模式忽略 opts.tempoCurve / pitchCurve / formant / formantShift / link：
 *   PSOLA 是時域的音高同步重疊相加，聲道（共振峰）形狀本來就不動，改音高天然保留音色。
 *
 * 做法（TD-PSOLA）：
 *   1. 音高標記：只在有聲段（軌跡 f0 > 0）內。取該段波形最高峰當種子，依局部週期向前後逐週期推進，
 *      每次在預期位置 ±30% 週期內找最大峰（偏好靠近預期位置的峰），讓標記貼著聲門脈衝。
 *      無聲段與標記之間的空隙以固定 8 ms 間隔補標記（不改音高）。
 *   2. 合成：輸出標記間隔 = 目標週期（有聲）或 8 ms（無聲）；輸出時間 × tempo = 輸入時間，
 *      取最接近的分析標記，截出 Hann 窗（半寬 ≥ 一個分析週期）重疊相加到輸出標記上。
 *      時間變慢＝重複標記，變快＝略過標記；音高變高＝輸出標記較密，反之較疏。
 *   3. 以窗重疊總和正規化。
 *      [v2 補充] 光是正規化，音量其實會隨音高改變：音高升高時每顆脈衝被除以較大的重疊總和，
 *      實測升高 6 個半音約小 2.5 dB、升高 8 個半音約小 4.4 dB，降低也會小一些。
 *      所以合成後再做「音量補償」：每 10 ms 比較輸出與對應輸入位置的 RMS，把輸出乘上平滑的增益，
 *      使響度與原音一致；增益上限會顧及峰值（不超過輸入峰值的 1.25 倍、也不超過滿格），
 *      輸入近乎無聲處（RMS < 1e-4）不放大，避免把底噪拉起來。
 *   4. 所有聲道共用同一組標記（以單聲道混音偵測），立體聲相位不漂移。
 */
(function ( root ) {
	'use strict';

	var UV_HOP = 0.008;                 /* 無聲段標記間隔（秒） */

	function clamp ( v, a, b ) { return v < a ? a : v > b ? b : v; }

	/* ---------- 軌跡取值：某「軌跡時間」的 F0（對數域內插；相鄰任一幀無聲就取有聲那幀，兩邊都無聲 = 0） ---------- */
	function hzAt ( tr, sec ) {
		var x = sec * tr.rate, i = Math.floor ( x ), fr = x - i;
		if (i < 0 || i >= tr.n) return 0;
		var a = tr.f0[i], b = i + 1 < tr.n ? tr.f0[i + 1] : 0;
		if (!( a > 0 )) return fr > 0.5 && b > 0 ? b : 0;
		if (!( b > 0 ) || fr === 0) return a;
		return Math.exp ( Math.log ( a ) + ( Math.log ( b ) - Math.log ( a ) ) * fr );
	}

	function mono ( chs ) {
		var n = chs[0].length, nch = chs.length;
		if (nch === 1) return chs[0];
		var m = new Float32Array ( n ), c, i, inv = 1 / nch;
		for (c = 0; c < nch; ++c) { var ch = chs[c]; for (i = 0; i < n; ++i) m[i] += ch[i] * inv; }
		return m;
	}

	/* ---------- 音高標記 ---------- */
	function findMarks ( x, sr, tr, off ) {
		var n = x.length, pos = [], per = [], voiced = [];
		var uv = Math.max ( 8, Math.round ( UV_HOP * sr ) );
		var rate = tr.rate, f0 = tr.f0, N = tr.n, i, j;

		function period ( p ) {                               /* 取樣位置 p 的分析週期（取樣數）；無聲回傳 0 */
			var f = hzAt ( tr, p / sr + off );
			return f > 0 ? sr / f : 0;
		}

		/* 軌跡裡連續有聲的段 → 輸入取樣範圍 [a, b) */
		var runs = [], s = -1;
		for (i = 0; i <= N; ++i) {
			var on = i < N && f0[i] > 0;
			if (on && s < 0) s = i;
			else if (!on && s >= 0) {
				var a = Math.round ( ( ( s - 0.5 ) / rate - off ) * sr ), b = Math.round ( ( ( i - 0.5 ) / rate - off ) * sr );
				a = Math.max ( 0, a ); b = Math.min ( n, b );
				if (b - a > 0) runs.push ( [ a, b ] );
				s = -1;
			}
		}

		var cursor = 0;                                       /* 目前已涵蓋到的取樣位置 */
		function fillUnvoiced ( upto ) {
			for (var p = cursor + ( pos.length ? uv : 0 ); p < upto; p += uv) { pos.push ( p ); per.push ( uv ); voiced.push ( 0 ); }
		}

		for (var q = 0; q < runs.length; ++q) {
			var ra = runs[q][0], rb = runs[q][1], T0 = period ( ( ra + rb ) >> 1 );
			if (!( T0 > 0 ) || rb - ra < 2.5 * T0) continue;  /* 太短當無聲 */

			/* 極性：取絕對值最大的峰所在的符號 */
			var best = 0, bi = ra;
			for (i = ra; i < rb; ++i) { var av = Math.abs ( x[i] ); if (av > best) { best = av; bi = i; } }
			var pol = x[bi] >= 0 ? 1 : -1;

			/* 種子：該段內最高峰（限制在中央，避免段邊緣的暫態） */
			var lo = ra + Math.floor ( ( rb - ra ) * 0.15 ), hi = rb - Math.floor ( ( rb - ra ) * 0.15 );
			if (hi <= lo) { lo = ra; hi = rb; }
			var seed = lo, sv = -1e30;
			for (i = lo; i < hi; ++i) { var yv = pol * x[i]; if (yv > sv) { sv = yv; seed = i; } }

			var walk = function ( dir ) {
				var out = [], m = seed, guard = 0;
				while (guard++ < 5000000) {
					var T = period ( m ) || T0;
					var c = m + dir * T, rad = Math.max ( 1, Math.round ( 0.3 * T ) );
					if (c - rad < ra || c + rad >= rb) break;
					var bp = -1, bs = -1e30;
					for (j = -rad; j <= rad; ++j) {
						var idx = Math.round ( c ) + j;
						if (idx < ra || idx >= rb) continue;
						var sc = pol * x[idx] * ( 1 - 0.5 * Math.abs ( j ) / rad );    /* 偏好靠近預期位置，避免跳到同週期內的第二個峰 */
						if (sc > bs) { bs = sc; bp = idx; }
					}
					if (bp < 0 || bp === m) break;
					out.push ( bp ); m = bp;
				}
				return out;
			};

			var fw = walk ( 1 ), bw = walk ( -1 ), marks = [];
			for (i = bw.length - 1; i >= 0; --i) marks.push ( bw[i] );
			marks.push ( seed );
			for (i = 0; i < fw.length; ++i) marks.push ( fw[i] );

			/* 段前的空隙補無聲標記，再放這一段的標記 */
			fillUnvoiced ( marks[0] - uv / 2 );
			for (i = 0; i < marks.length; ++i) {
				var Ti = period ( marks[i] ) || T0;
				pos.push ( marks[i] ); per.push ( Ti ); voiced.push ( 1 );
			}
			cursor = marks[marks.length - 1];
		}
		fillUnvoiced ( n + uv );

		return { pos: Int32Array.from ( pos ), per: Float32Array.from ( per ), voiced: Uint8Array.from ( voiced ), n: pos.length };
	}

	function nearest ( M, p ) {                            /* 最接近 p 的標記索引（二分） */
		var lo = 0, hi = M.n - 1;
		while (lo < hi) {
			var mid = ( lo + hi ) >> 1;
			if (M.pos[mid] < p) lo = mid + 1; else hi = mid;
		}
		if (lo > 0 && p - M.pos[lo - 1] <= M.pos[lo] - p) --lo;
		return lo;
	}

	var HANN = {};
	function hann ( hl ) {
		if (HANN[hl]) return HANN[hl];
		var w = new Float32Array ( 2 * hl + 1 );
		for (var j = -hl; j <= hl; ++j) w[j + hl] = 0.5 + 0.5 * Math.cos ( Math.PI * j / hl );
		return ( HANN[hl] = w );
	}

	/* ---------- [新增] 音量補償：讓輸出每一小段的響度與對應的輸入一致 ---------- */
	function levelMatch ( x, ys, sr, tempo ) {
		var n = x.length, m = ys[0].length, y = mono ( ys );
		var hop = Math.max ( 1, Math.round ( 0.010 * sr ) ), hw = Math.max ( 2, Math.round ( 0.015 * sr ) );
		var nb = Math.ceil ( m / hop ) + 1, g = new Float32Array ( nb ), i, j, c, t;
		for (i = 0; i < nb; ++i) {
			c = i * hop;
			var a0 = Math.max ( 0, c - hw ), a1 = Math.min ( m - 1, c + hw ), oe = 0, op = 0, oc = 0, v, av;
			for (j = a0; j <= a1; ++j) { v = y[j]; oe += v * v; av = v < 0 ? -v : v; if (av > op) op = av; ++oc; }
			var ci = Math.round ( c * tempo ), hi = Math.max ( 2, Math.round ( hw * tempo ) );
			var b0 = Math.max ( 0, ci - hi ), b1 = Math.min ( n - 1, ci + hi ), ie = 0, ip = 0, ic = 0;
			for (j = b0; j <= b1; ++j) { v = x[j]; ie += v * v; av = v < 0 ? -v : v; if (av > ip) ip = av; ++ic; }
			g[i] = 1;
			if (!oc || !ic) continue;
			var oR = Math.sqrt ( oe / oc ), iR = Math.sqrt ( ie / ic );
			if (iR < 1e-4 || oR < 1e-6) continue;
			var gmax = op > 0 ? Math.max ( 1, Math.min ( 1 / op, 1.25 * ip / op ) ) : 1;
			g[i] = Math.max ( 0.5, Math.min ( iR / oR, gmax, 3 ) );
		}
		for (t = 0; t < 2; ++t) {                              /* 增益曲線平滑 2 次，避免音量忽大忽小 */
			var h = Float32Array.from ( g );
			for (i = 0; i < nb; ++i) g[i] = ( h[Math.max ( 0, i - 1 )] + h[i] * 2 + h[Math.min ( nb - 1, i + 1 )] ) / 4;
		}
		for (var ch = 0; ch < ys.length; ++ch) {
			var o = ys[ch];
			for (i = 0; i < m; ++i) {
				var p = i / hop, k = Math.floor ( p ), f = p - k;
				o[i] *= g[k] + ( g[Math.min ( nb - 1, k + 1 )] - g[k] ) * f;
			}
		}
	}

	/* ---------- 主函式 ---------- */
	function process ( channels, sr, opts ) {
		opts = opts || {};
		var n = channels[0].length, nch = channels.length, report = opts.onprogress || null, c, i, j;
		var tempo = clamp ( +opts.tempo || 1, 0.25, 4 );
		var gp = Math.pow ( 2, clamp ( +opts.pitch || 0, -24, 24 ) / 12 );
		var off = +opts.trackOffset || 0;
		var outLen = Math.max ( 1, Math.round ( n / tempo ) );

		var x = mono ( channels );
		var tr = opts.f0;
		if (!tr || !tr.f0) {
			var F = root.PKF0;
			if (!F) throw new Error ( 'PSOLA needs opts.f0 (or PKF0 loaded to analyze)' );
			tr = F.track ( [ x ], sr, { onprogress: report ? function ( p ) { report ( p * 0.3 ); } : null } );
			off = 0;
		}
		var tg = opts.f0Target && opts.f0Target.f0 ? opts.f0Target : null;

		var M = findMarks ( x, sr, tr, off );
		report && report ( 0.35 );

		var outs = [], wsum = new Float32Array ( outLen );
		for (c = 0; c < nch; ++c) outs.push ( new Float32Array ( outLen ) );

		var uv = Math.max ( 8, Math.round ( UV_HOP * sr ) );
		var ts = 0, grains = 0, lastRep = 0;
		while (ts < outLen) {
			var tin = ts * tempo, k = nearest ( M, tin );
			var Ta = M.per[k], pk = M.pos[k], Ts;
			if (M.voiced[k]) {
				var tt = tin / sr + off, fo = hzAt ( tr, tt ), ft = tg ? hzAt ( tg, tt ) : fo;
				Ts = ft > 0 ? sr / ( ft * gp ) : Ta / gp;
			}
			else Ts = uv;
			Ts = clamp ( Ts, 2, sr / 20 );

			var hl = Math.round ( Math.min ( 2.5 * Ta, Math.max ( Ta, 0.75 * Ts ) ) );
			if (hl < 4) hl = 4;
			var win = hann ( hl ), dst = Math.round ( ts );
			var j0 = Math.max ( -hl, -pk, -dst ), j1 = Math.min ( hl, n - 1 - pk, outLen - 1 - dst );
			for (j = j0; j <= j1; ++j) {
				var wv = win[j + hl];
				wsum[dst + j] += wv;
				for (c = 0; c < nch; ++c) outs[c][dst + j] += wv * channels[c][pk + j];
			}
			ts += Ts; ++grains;
			if (report && ( grains & 255 ) === 0) { var pr = 0.35 + 0.65 * ts / outLen; if (pr - lastRep > 0.02) { lastRep = pr; report ( pr ); } }
		}

		/* 正規化 */
		for (i = 0; i < outLen; ++i) {
			var g = 1 / Math.max ( wsum[i], 0.02 );
			for (c = 0; c < nch; ++c) outs[c][i] *= g;
		}
		if (opts.keepLevel !== false) levelMatch ( x, outs, sr, tempo );        /* [新增] 音量補償 */
		report && report ( 1 );
		return outs;
	}

	root.PKPsola = { process: process, findMarks: findMarks, version: 2 };
	if (typeof module !== 'undefined' && module.exports) module.exports = root.PKPsola;
})( typeof self !== 'undefined' ? self : this );
