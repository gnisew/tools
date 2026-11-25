/* Soundit 時間與音高：分析模組（階段 3-1：BPM 對齊；階段 3-2：調性偵測）
 *
 *   PKTPAnalyze.detectKey ( buffer ) → Promise<{ pc, minor, name, confidence, tuning, runnerUp }>
 *     以 FFT 峰值累積 12 音級（先估調音偏差並校正），再與 Krumhansl-Kessler 大小調模板比對。
 *     pc：0 = C … 11 = B；tuning：與 A=440 的偏差（音分）。
 *   PKTPAnalyze.keyShift ( fromPc, toPc ) → 半音數（-6 ~ +5，取最短方向）
 *
 *   PKTPAnalyze.refineBpm ( buffer, estimate ) → Promise<{ bpm, raw, folded, confidence }>
 *     以 tempo-estimator 的結果為起點，在 ±3% 內用節拍包絡的自相關做細搜尋，
 *     把整數級的估計（誤差可達 1 BPM 以上）收斂到 0.1 BPM 以內。
 *   PKTPAnalyze.alignTempo ( fromBpm, toBpm ) → { tempo, folded, note }
 *     算出變速倍率；若偵測值可能差一倍（半速／倍速），自動挑最接近 1 的倍率。
 */
(function ( root ) {
	'use strict';

	/* 節拍包絡：回傳 { env, rate }，env 為正向差分（onset strength） */
	function onsetEnv ( chans, sr ) {
		var hop = Math.max (64, Math.round ( sr / 200 ));      /* 約 200 Hz，解析度 5 ms */
		var n = chans[0].length, frames = Math.floor ( n / hop );
		var e = new Float32Array ( frames );
		for (var i = 0; i < frames; ++i) {
			var a = i * hop, b = a + hop, s = 0;
			for (var c = 0; c < chans.length; ++c) {
				var x = chans[c];
				for (var j = a; j < b; ++j) s += x[j] * x[j];
			}
			e[i] = Math.sqrt ( s / ( hop * chans.length ) );
		}
		var o = new Float32Array ( frames ), mean = 0;
		for (var k = 1; k < frames; ++k) {
			var v = Math.log ( 1e-4 + e[k] ) - Math.log ( 1e-4 + e[k - 1] );
			o[k] = v > 0 ? v : 0;
			mean += o[k];
		}
		mean /= Math.max (1, frames);
		for (var m = 0; m < frames; ++m) o[m] = Math.max (0, o[m] - mean);
		return { env: o, rate: sr / hop };
	}

	/* 自相關在分數延遲 lag（單位：框）的分數；線性內插 */
	function acAt ( env, lag ) {
		var l0 = Math.floor ( lag ), f = lag - l0, s = 0, n = env.length - l0 - 2;
		if (n < 8) return 0;
		for (var i = 0; i < n; ++i) s += env[i] * ( env[i + l0] * ( 1 - f ) + env[i + l0 + 1] * f );
		return s / n;
	}

	function refineBpm ( chans, sr, startBpm ) {
		var o = onsetEnv ( chans, sr ), env = o.env, rate = o.rate;
		var lag0 = 60 * rate / startBpm;
		var best = lag0, bs = -1, span = 0.03;
		/* 先粗（±3%，每 0.1%），再細（±0.2%，每 0.01%）；同時累加 2 倍、3 倍延遲，穩定度較好 */
		function score ( lag ) {
			return acAt ( env, lag ) + 0.5 * acAt ( env, lag * 2 ) + 0.25 * acAt ( env, lag * 3 );
		}
		for (var p = -span; p <= span + 1e-9; p += 0.001) {
			var l = lag0 * ( 1 + p ), sc = score ( l );
			if (sc > bs) { bs = sc; best = l; }
		}
		var c = best;
		for (var q = -0.002; q <= 0.002 + 1e-9; q += 0.0001) {
			var l2 = c * ( 1 + q ), sc2 = score ( l2 );
			if (sc2 > bs) { bs = sc2; best = l2; }
		}
		var base = acAt ( env, 0.0001 + 1 ) || 1e-9;
		return { bpm: 60 * rate / best, strength: Math.min (1, bs / ( base * 1.75 )) };
	}

	/* 目標 BPM 與偵測值差一倍時（例如偵測 70 其實是 140），回傳最接近 1× 的倍率 */
	function alignTempo ( fromBpm, toBpm ) {
		var cands = [ [ 1, '' ], [ 2, 'x2' ], [ 0.5, 'x0.5' ] ], best = null;
		for (var i = 0; i < cands.length; ++i) {
			var t = toBpm / ( fromBpm * cands[i][0] );
			if (!best || Math.abs ( Math.log ( t ) ) < Math.abs ( Math.log ( best.tempo ) )) {
				best = { tempo: t, folded: cands[i][0], note: cands[i][1] };
			}
		}
		return best;
	}

	function toChans ( buffer ) {
		var a = [];
		for (var i = 0; i < buffer.numberOfChannels; ++i) a.push ( buffer.getChannelData ( i ) );
		return a;
	}

	root.PKTPAnalyze = root.PKTPAnalyze || {};
	root.PKTPAnalyze._onsetEnv = onsetEnv;
	root.PKTPAnalyze.refineChans = refineBpm;
	root.PKTPAnalyze.alignTempo = alignTempo;
	root.PKTPAnalyze.refineBpm = function ( buffer, estimate ) {
		return new Promise ( function ( resolve ) {
			setTimeout ( function () {
				var r = refineBpm ( toChans ( buffer ), buffer.sampleRate, estimate );
				resolve ({ bpm: Math.round ( r.bpm * 10 ) / 10, raw: estimate, confidence: r.strength });
			}, 10 );
		});
	};
	/* ---------- 3-2：調性偵測 ---------- */
	var NOTE = [ 'C', 'C♯', 'D', 'E♭', 'E', 'F', 'F♯', 'G', 'A♭', 'A', 'B♭', 'B' ];
	var KK_MAJ = [ 6.35, 2.23, 3.48, 2.33, 4.38, 4.09, 2.52, 5.19, 2.39, 3.66, 2.29, 2.88 ];
	var KK_MIN = [ 6.33, 2.68, 3.52, 5.38, 2.60, 3.53, 2.54, 4.75, 3.98, 2.69, 3.34, 3.17 ];

	function fft ( re, im ) {                     /* 原地 radix-2 */
		var n = re.length, i, j = 0, k, len;
		for (i = 1; i < n; ++i) {
			var bit = n >> 1;
			for (; j & bit; bit >>= 1) j ^= bit;
			j ^= bit;
			if (i < j) { var tr = re[i]; re[i] = re[j]; re[j] = tr; var ti = im[i]; im[i] = im[j]; im[j] = ti; }
		}
		for (len = 2; len <= n; len <<= 1) {
			var ang = -2 * Math.PI / len, wr = Math.cos ( ang ), wi = Math.sin ( ang ), h = len >> 1;
			for (i = 0; i < n; i += len) {
				var cr = 1, ci = 0;
				for (k = 0; k < h; ++k) {
					var a = i + k, b = a + h;
					var xr = re[b] * cr - im[b] * ci, xi = re[b] * ci + im[b] * cr;
					re[b] = re[a] - xr; im[b] = im[a] - xi; re[a] += xr; im[a] += xi;
					var nr = cr * wr - ci * wi; ci = cr * wi + ci * wr; cr = nr;
				}
			}
		}
	}

	function corr ( a, b ) {
		var n = a.length, ma = 0, mb = 0, i;
		for (i = 0; i < n; ++i) { ma += a[i]; mb += b[i]; }
		ma /= n; mb /= n;
		var sab = 0, saa = 0, sbb = 0;
		for (i = 0; i < n; ++i) { var x = a[i] - ma, y = b[i] - mb; sab += x * y; saa += x * x; sbb += y * y; }
		return sab / Math.sqrt ( saa * sbb + 1e-12 );
	}

	function detectKeyChans ( chans, sr, maxSec ) {
		var N = 8192, hop = 4096, n = chans[0].length;
		var total = Math.min ( n, Math.round ( ( maxSec || 90 ) * sr ) );
		var from = Math.max ( 0, ( n - total ) >> 1 );          /* 取中段，避開前奏與尾奏 */
		var win = new Float32Array ( N ), re = new Float32Array ( N ), im = new Float32Array ( N ), mag = new Float32Array ( N / 2 );
		for (var i = 0; i < N; ++i) win[i] = 0.5 - 0.5 * Math.cos ( 2 * Math.PI * i / N );
		var binHz = sr / N, lo = Math.max ( 2, Math.ceil ( 65 / binHz ) ), hi = Math.min ( N / 2 - 2, Math.floor ( 2100 / binHz ) );
		var peaks = [];                                         /* [midi 小數, 權重] */
		var frames = 0, c, j;

		for (var pos = from; pos + N <= from + total; pos += hop) {
			for (j = 0; j < N; ++j) {
				var s = 0;
				for (c = 0; c < chans.length; ++c) s += chans[c][pos + j];
				re[j] = s / chans.length * win[j]; im[j] = 0;
			}
			fft ( re, im );
			var mx = 0;
			for (j = lo - 1; j <= hi + 1; ++j) { mag[j] = Math.sqrt ( re[j] * re[j] + im[j] * im[j] ); if (mag[j] > mx) mx = mag[j]; }
			if (mx < 1e-4) continue;
			++frames;
			for (j = lo; j <= hi; ++j) {
				var m = mag[j];
				if (m < mx * 0.05 || m <= mag[j - 1] || m < mag[j + 1]) continue;
				var a = Math.log ( mag[j - 1] + 1e-12 ), b = Math.log ( m + 1e-12 ), cc = Math.log ( mag[j + 1] + 1e-12 );
				var d = 0.5 * ( a - cc ) / ( a - 2 * b + cc );  /* 拋物線內插 */
				if (!isFinite ( d ) || d > 1 || d < -1) d = 0;
				var f = ( j + d ) * binHz;
				peaks.push ([ 69 + 12 * Math.log ( f / 440 ) / Math.LN2, Math.sqrt ( m / mx ) ]);
			}
		}
		if (!frames || !peaks.length) throw new Error ('Not enough tonal content to detect key.');

		/* 調音偏差：各峰離最近半音的偏差，以圓形平均（週期 1 半音）估計 */
		var sx = 0, sy = 0, k;
		for (k = 0; k < peaks.length; ++k) {
			var dv = ( peaks[k][0] - Math.round ( peaks[k][0] ) ) * 2 * Math.PI;
			sx += peaks[k][1] * Math.cos ( dv ); sy += peaks[k][1] * Math.sin ( dv );
		}
		var tune = Math.atan2 ( sy, sx ) / ( 2 * Math.PI );      /* 半音，±0.5 */
		var chroma = new Float64Array ( 12 );
		for (k = 0; k < peaks.length; ++k) {
			var pc = ( ( Math.round ( peaks[k][0] - tune ) % 12 ) + 12 ) % 12;
			chroma[pc] += peaks[k][1];
		}

		var best = -2, bestK = 0, second = -2, rot = new Float64Array ( 12 ), r;
		for (var minor = 0; minor < 2; ++minor) {
			var prof = minor ? KK_MIN : KK_MAJ;
			for (var tonic = 0; tonic < 12; ++tonic) {
				for (r = 0; r < 12; ++r) rot[r] = prof[( r - tonic + 12 ) % 12];
				var sc = corr ( chroma, rot ), id = tonic + 12 * minor;
				if (sc > best) { second = best; best = sc; bestK = id; }
				else if (sc > second) second = sc;
			}
		}
		var tonicPc = bestK % 12, isMin = bestK >= 12;
		return {
			pc: tonicPc, minor: isMin, name: NOTE[tonicPc] + ( isMin ? 'm' : '' ),
			confidence: Math.max ( 0, Math.min ( 1, ( best - second ) * 8 ) ),
			tuning: Math.round ( tune * 100 ), score: best
		};
	}

	function keyShift ( fromPc, toPc ) {
		var d = ( ( toPc - fromPc ) % 12 + 12 ) % 12;
		return d > 5 ? d - 12 : d;
	}

	root.PKTPAnalyze.noteNames = NOTE;
	root.PKTPAnalyze.keyShift = keyShift;
	root.PKTPAnalyze.detectKeyChans = detectKeyChans;
	root.PKTPAnalyze.detectKey = function ( buffer, maxSec ) {
		return new Promise ( function ( resolve, reject ) {
			setTimeout ( function () {
				try { resolve ( detectKeyChans ( toChans ( buffer ), buffer.sampleRate, maxSec ) ); }
				catch ( e ) { reject ( e ); }
			}, 10 );
		});
	};

})( typeof self !== 'undefined' ? self : this );


