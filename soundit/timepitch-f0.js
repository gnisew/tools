/* Soundit 時間與音高：F0（基頻）追蹤（階段 4-1）
 *
 * 純 JS，無相依。同一份檔案可在主執行緒或 Worker（importScripts）載入。
 *
 *   PKF0.track ( channels, sampleRate, opts ) → Track          （同步）
 *   PKF0.trackBuffer ( audioBuffer, opts )    → Promise<Track>  （分段執行，不卡畫面；opts.onprogress ( 0~1 )）
 *
 *   opts.fmin       最低頻率（Hz），預設 60
 *   opts.fmax       最高頻率（Hz），預設 800（歌聲、童聲可調高到 1000+）
 *   opts.hop        跳距（秒），預設 0.010
 *   opts.voicing    有聲判斷門檻（0~1，越大越容易判成有聲），預設 0.30
 *   opts.minVoiced  有聲段最少幀數，短於此的孤立有聲幀改判無聲，預設 3
 *   opts.gateDb     相對全曲峰值的靜音門檻（dB），低於此一律無聲，預設 -55
 *
 *   Track = {
 *     hop   : 跳距（取樣數，以原取樣率計）
 *     rate  : 每秒幀數
 *     sr    : 原取樣率
 *     n     : 幀數
 *     f0    : Float32Array(n)  Hz；0 = 無聲（無明確音高）
 *     conf  : Float32Array(n)  0~1，越高越像週期訊號
 *     fmin, fmax
 *   }
 *   第 i 幀的時間 = i / rate（幀中心）。
 *
 *   PKF0.hzAt ( track, sec )          某時間的 F0（線性內插，相鄰有聲幀才內插；無聲回傳 0）
 *   PKF0.toMidi ( hz ) / PKF0.toHz ( midi )
 *   PKF0.stats ( track, from, to )    → { voicedRatio, median, p10, p90, count }（Hz，秒範圍可省略）
 *
 * 做法（YIN + 動態規劃，類似 pYIN 的精簡版）：
 *   1. 單聲道混音後降取樣到約 16 kHz 以上（箱型平均），降低運算量。
 *   2. 每幀以 FFT 算自相關，得到差分函數 d(τ)，再做累積平均正規化（CMNDF）。
 *   3. 每幀保留最多 5 個局部最小值當候選，拋物線內插得到小數週期。
 *   4. Viterbi：觀測成本 = CMNDF 值；轉移成本 = 音高跳動（以八度計）；有聲↔無聲有切換成本。
 *      因此能壓掉「跳八度」的誤判，並自動連成平滑軌跡。
 */
(function ( root ) {
	'use strict';

	var MAXK = 5;                                  /* 每幀候選數 */
	var SUBBIAS = 0.04;                            /* 偏好較短週期的偏壓（每高一個八度週期加此成本） */

	/* ---------- 小型 FFT（基 2，複數，原地） ---------- */
	var FFTS = {};
	function fftFor ( n ) {
		if (FFTS[n]) return FFTS[n];
		var bits = Math.round ( Math.log ( n ) / Math.LN2 ), rev = new Uint32Array ( n ), i, b;
		for (i = 0; i < n; ++i) {
			var r = 0, x = i;
			for (b = 0; b < bits; ++b) { r = ( r << 1 ) | ( x & 1 ); x >>= 1; }
			rev[i] = r;
		}
		var cs = new Float64Array ( n >> 1 ), sn = new Float64Array ( n >> 1 );
		for (i = 0; i < ( n >> 1 ); ++i) { cs[i] = Math.cos ( 2 * Math.PI * i / n ); sn[i] = Math.sin ( 2 * Math.PI * i / n ); }
		function run ( re, im, sign ) {
			var i2, j, t;
			for (i2 = 0; i2 < n; ++i2) {
				j = rev[i2];
				if (j > i2) { t = re[i2]; re[i2] = re[j]; re[j] = t; t = im[i2]; im[i2] = im[j]; im[j] = t; }
			}
			for (var size = 2; size <= n; size <<= 1) {
				var half = size >> 1, step = n / size;
				for (var st = 0; st < n; st += size) {
					for (var m = 0, tw = 0; m < half; ++m, tw += step) {
						var wr = cs[tw], wi = sign * sn[tw];
						var a = st + m, c = a + half;
						var xr = re[c] * wr - im[c] * wi, xi = re[c] * wi + im[c] * wr;
						re[c] = re[a] - xr; im[c] = im[a] - xi;
						re[a] += xr; im[a] += xi;
					}
				}
			}
		}
		return ( FFTS[n] = {
			fwd: function ( re, im ) { run ( re, im, -1 ); },
			inv: function ( re, im ) { run ( re, im, 1 ); var g = 1 / n; for (var k = 0; k < n; ++k) { re[k] *= g; im[k] *= g; } }
		});
	}

	/* ---------- 前處理：單聲道＋降取樣 ---------- */
	function prepare ( chans, sr ) {
		var nch = chans.length, n = chans[0].length, D = Math.max ( 1, Math.floor ( sr / 16000 ) );
		var m = Math.floor ( n / D ), x = new Float32Array ( m ), i, j, c, inv = 1 / ( D * nch );
		for (i = 0; i < m; ++i) {
			var s = 0, b = i * D;
			for (c = 0; c < nch; ++c) { var ch = chans[c]; for (j = 0; j < D; ++j) s += ch[b + j]; }
			x[i] = s * inv;
		}
		/* 去直流（以整段平均，足以應付錄音偏置） */
		var mean = 0; for (i = 0; i < m; ++i) mean += x[i]; mean /= Math.max ( 1, m );
		for (i = 0; i < m; ++i) x[i] -= mean;
		return { x: x, rate: sr / D, D: D };
	}

	/* ---------- 逐步執行器 ---------- */
	function begin ( chans, sr, opts ) {
		opts = opts || {};
		var fmin = Math.max ( 20, +opts.fmin || 60 ), fmax = Math.max ( fmin * 1.5, +opts.fmax || 800 );
		var hopSec = Math.max ( 0.002, +opts.hop || 0.010 );
		var voicing = opts.voicing !== undefined ? +opts.voicing : 0.30;
		var minVoiced = opts.minVoiced !== undefined ? opts.minVoiced | 0 : 3;
		var gateDb = opts.gateDb !== undefined ? +opts.gateDb : -55;

		var P = prepare ( chans, sr ), x = P.x, rate = P.rate, m = x.length;
		var tauMin = Math.max ( 2, Math.floor ( rate / fmax ) ), tauMax = Math.ceil ( rate / fmin );
		var W = tauMax, L = W + tauMax;                         /* 積分長度、取樣段長度 */
		var M = 64; while (M < L + 1) M <<= 1;
		var fft = fftFor ( M );
		var hopD = hopSec * rate, frames = Math.max ( 1, Math.floor ( m / hopD ) );

		/* 前綴和：x² */
		var pre = new Float64Array ( m + 1 ), i;
		for (i = 0; i < m; ++i) pre[i + 1] = pre[i] + x[i] * x[i];

		var ar = new Float64Array ( M ), ai = new Float64Array ( M ), br = new Float64Array ( M ), bi = new Float64Array ( M );
		var dp = new Float64Array ( tauMax + 2 ), seg2 = new Float64Array ( L + 1 );

		/* 每幀候選：週期（取樣，小數）、成本；以及整體響度 */
		var candT = new Float32Array ( frames * MAXK ), candC = new Float32Array ( frames * MAXK ), candK = new Float32Array ( frames * MAXK ), candN = new Uint8Array ( frames );
		var rmsF = new Float32Array ( frames ), best = new Float32Array ( frames );
		var peak = 1e-9;
		var cur = 0;

		function oneFrame ( f ) {
			/* 成對比較的中心 = s0 + ( W + τ ) / 2。以上一幀的週期當 τ 的估計，讓分析時間點貼近幀中心（對滑音、顫音有差） */
			var c = Math.round ( f * hopD ), j, k;
			var tauRef = f > 0 && candN[f - 1] > 0 ? candT[( f - 1 ) * MAXK] : rate / 150;
			var s0 = c - Math.round ( ( W + tauRef ) / 2 );
			/* 取樣段 */
			for (j = 0; j < M; ++j) { br[j] = 0; bi[j] = 0; ar[j] = 0; ai[j] = 0; }
			for (j = 0; j < L; ++j) { var p = s0 + j; br[j] = ( p >= 0 && p < m ) ? x[p] : 0; }
			for (j = 0; j < W; ++j) ar[j] = br[j];
			var e0 = 0, eAll;
			for (j = 0; j < W; ++j) e0 += ar[j] * ar[j];
			/* r(τ) = Σ a[j]·b[j+τ]  →  IFFT( conj(A)·B ) */
			fft.fwd ( ar, ai ); fft.fwd ( br, bi );
			for (k = 0; k < M; ++k) {
				var xr = ar[k] * br[k] + ai[k] * bi[k], xi = ar[k] * bi[k] - ai[k] * br[k];
				ar[k] = xr; ai[k] = xi;
			}
			fft.inv ( ar, ai );

			/* d(τ) = e0 + Σ_{j<W} x[j+τ]² − 2 r(τ)；後者用前綴和（段內索引）。這裡直接在段上累積 */
			/* br 已被覆蓋，改從原訊號算段能量前綴（seg2 在外層配置一次） */
			var acc = 0;
			seg2[0] = 0;
			for (j = 0; j < L; ++j) { var pp = s0 + j, v = ( pp >= 0 && pp < m ) ? x[pp] : 0; acc += v * v; seg2[j + 1] = acc; }
			eAll = seg2[W];
			var rms = Math.sqrt ( e0 / W );
			rmsF[f] = rms; if (rms > peak) peak = rms;

			var run = 0;
			dp[0] = 1;
			for (var tau = 1; tau <= tauMax; ++tau) {
				var et = seg2[tau + W] - seg2[tau];
				var d = e0 + et - 2 * ar[tau];
				if (d < 0) d = 0;
				run += d;
				dp[tau] = run > 1e-12 ? d * tau / run : 1;
			}
			dp[tauMax + 1] = 1;

			/* 候選：局部最小、成本小於 0.6，取成本最低的 MAXK 個 */
			var n = 0, base = f * MAXK, bmin = 1e9;
			for (var t2 = tauMin; t2 <= tauMax; ++t2) {
				var v2 = dp[t2];
				if (v2 < bmin) bmin = v2;
				if (v2 >= 0.6 || v2 > dp[t2 - 1] || v2 >= dp[t2 + 1]) continue;
				/* 拋物線內插 */
				var a = dp[t2 - 1], b = v2, cc = dp[t2 + 1], den = a - 2 * b + cc, off = den > 1e-12 ? 0.5 * ( a - cc ) / den : 0;
				if (off > 1) off = 1; else if (off < -1) off = -1;
				var tf = t2 + off, cv = b - 0.25 * ( a - cc ) * off;
				if (cv < 0) cv = 0;
				/* 插入排序。排序鍵 = 成本 + 0.04·log2(τ/τmin)：純音、諧波音的 2T、3T… 成本也趨近 0，
				 * 沒有這個偏壓會被「剛好略低」的倍週期擠掉真正的 T（變成低 1～2 個八度） */
				var key = cv + SUBBIAS * Math.log ( tf / tauMin ) / Math.LN2;
				var pos = n;
				while (pos > 0 && candK[base + pos - 1] > key) {
					if (pos < MAXK) { candC[base + pos] = candC[base + pos - 1]; candT[base + pos] = candT[base + pos - 1]; candK[base + pos] = candK[base + pos - 1]; }
					--pos;
				}
				if (pos < MAXK) { candC[base + pos] = cv; candT[base + pos] = tf; candK[base + pos] = key; if (n < MAXK) ++n; }
			}
			candN[f] = n;
			best[f] = bmin;
		}

		return {
			total: frames,
			step: function ( maxMs ) {
				var t0 = Date.now ();
				while (cur < frames) {
					oneFrame ( cur++ );
					if (maxMs && ( cur & 15 ) === 0 && Date.now () - t0 > maxMs) break;
				}
				return cur >= frames;
			},
			progress: function () { return cur / frames * 0.95; },
			finish: function () {
				/* ---------- Viterbi ---------- */
				var K = MAXK + 1, UV = MAXK;                       /* 狀態 0..MAXK-1 = 候選，MAXK = 無聲 */
				var INF = 1e30, gate = peak * Math.pow ( 10, gateDb / 20 );
				var cost = new Float64Array ( K ), nxt = new Float64Array ( K );
				var bp = new Int8Array ( frames * K ), f, a2, b2;
				var LAMBDA = 2.0, FREE = 0.03, SWITCH = 0.15, UVC = voicing;

				function obs ( fr, s ) {
					if (s === UV) {
						if (rmsF[fr] < gate) return 0;
						return UVC;
					}
					if (s >= candN[fr] || rmsF[fr] < gate) return INF;
					var base = fr * MAXK, bias = SUBBIAS * Math.log ( candT[base + s] / candT[base] ) / Math.LN2;
					return candC[base + s] + bias;
				}

				for (a2 = 0; a2 < K; ++a2) cost[a2] = obs ( 0, a2 );
				for (f = 1; f < frames; ++f) {
					for (b2 = 0; b2 < K; ++b2) {
						var o = obs ( f, b2 ), bestC = INF, bestA = 0;
						if (o < INF) {
							for (a2 = 0; a2 < K; ++a2) {
								if (cost[a2] >= INF) continue;
								var tr;
								if (a2 === UV && b2 === UV) tr = 0;
								else if (a2 === UV || b2 === UV) tr = SWITCH;
								else {
									var d = Math.abs ( Math.log ( candT[( f - 1 ) * MAXK + a2] / candT[f * MAXK + b2] ) / Math.LN2 ) - FREE;
									tr = d > 0 ? LAMBDA * Math.min ( d, 1 ) : 0;
								}
								var cc = cost[a2] + tr;
								if (cc < bestC) { bestC = cc; bestA = a2; }
							}
						}
						nxt[b2] = bestC < INF ? bestC + o : INF;
						bp[f * K + b2] = bestA;
					}
					for (b2 = 0; b2 < K; ++b2) cost[b2] = nxt[b2];
				}
				var s = UV, bc = INF;
				for (a2 = 0; a2 < K; ++a2) if (cost[a2] < bc) { bc = cost[a2]; s = a2; }

				var f0 = new Float32Array ( frames ), conf = new Float32Array ( frames );
				for (f = frames - 1; f >= 0; --f) {
					if (s !== UV && s < candN[f]) {
						var bs = f * MAXK + s;
						f0[f] = P.rate / candT[bs];
						conf[f] = Math.max ( 0, Math.min ( 1, 1 - candC[bs] ) );
					}
					s = bp[f * K + s];
				}

				/* 去掉太短的有聲島 */
				if (minVoiced > 1) {
					var st = -1;
					for (f = 0; f <= frames; ++f) {
						var on = f < frames && f0[f] > 0;
						if (on && st < 0) st = f;
						else if (!on && st >= 0) {
							if (f - st < minVoiced) for (var z = st; z < f; ++z) { f0[z] = 0; conf[z] = 0; }
							st = -1;
						}
					}
				}
				return { hop: hopD * P.D, rate: rate / hopD, sr: sr, n: frames, f0: f0, conf: conf, fmin: fmin, fmax: fmax };
			}
		};
	}

	function track ( chans, sr, opts ) {
		var job = begin ( chans, sr, opts ), cb = opts && opts.onprogress;
		while (!job.step ( 50 )) cb && cb ( job.progress () );
		cb && cb ( 1 );
		return job.finish ();
	}

	function trackBuffer ( buffer, opts ) {
		return new Promise ( function ( resolve, reject ) {
			try {
				var chans = [];
				for (var i = 0; i < buffer.numberOfChannels; ++i) chans.push ( buffer.getChannelData ( i ) );
				var job = begin ( chans, buffer.sampleRate, opts ), cb = opts && opts.onprogress;
				( function pump () {
					try {
						if (job.step ( 12 )) { cb && cb ( 1 ); return resolve ( job.finish () ); }
						cb && cb ( job.progress () );
						setTimeout ( pump, 0 );
					} catch ( e ) { reject ( e ); }
				})();
			} catch ( e2 ) { reject ( e2 ); }
		});
	}

	function toMidi ( hz ) { return 69 + 12 * Math.log ( hz / 440 ) / Math.LN2; }
	function toHz ( midi ) { return 440 * Math.pow ( 2, ( midi - 69 ) / 12 ); }

	function hzAt ( tr, sec ) {
		var x = sec * tr.rate, i = Math.floor ( x ), fr = x - i;
		if (i < 0 || i >= tr.n) return 0;
		var a = tr.f0[i], b = i + 1 < tr.n ? tr.f0[i + 1] : 0;
		if (!( a > 0 )) return 0;
		if (!( b > 0 ) || fr === 0) return a;
		return Math.exp ( Math.log ( a ) + ( Math.log ( b ) - Math.log ( a ) ) * fr );    /* 對數域內插 */
	}

	function pct ( arr, p ) { return arr[ Math.min ( arr.length - 1, Math.floor ( p * arr.length ) ) ]; }
	function stats ( tr, from, to ) {
		var i0 = Math.max ( 0, Math.floor ( ( from || 0 ) * tr.rate ) );
		var i1 = Math.min ( tr.n, to !== undefined ? Math.ceil ( to * tr.rate ) : tr.n );
		var v = [], i;
		for (i = i0; i < i1; ++i) if (tr.f0[i] > 0) v.push ( tr.f0[i] );
		v.sort ( function ( a, b ) { return a - b; } );
		var tot = Math.max ( 1, i1 - i0 );
		return { voicedRatio: v.length / tot, count: v.length,
			median: v.length ? pct ( v, 0.5 ) : 0, p10: v.length ? pct ( v, 0.1 ) : 0, p90: v.length ? pct ( v, 0.9 ) : 0 };
	}

	root.PKF0 = { track: track, trackBuffer: trackBuffer, hzAt: hzAt, toMidi: toMidi, toHz: toHz, stats: stats, version: 1 };
})( typeof self !== 'undefined' ? self : this );


