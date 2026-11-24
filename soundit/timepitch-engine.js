/* Soundit 時間／音高引擎（階段 0＋1）
 *
 * 純 JS，無相依。階段 3-3：加入速度／音高曲線（opts.tempoCurve / opts.pitchCurve，見「曲線模式」一節）。
 * 階段 2：加入相位聲碼器（相位鎖定＋瞬態重置＋聲道相位一致）與共振峰保留。
 * 同一份檔案可在 Worker（importScripts）或主執行緒載入。
 *
 *   PKTimePitch.process ( channels, sampleRate, opts ) → Float32Array[]
 *     channels : Float32Array[]（每聲道一個，等長）
 *     opts.tempo   速度倍率，1 = 不變，2 = 快一倍（長度減半）。範圍 0.25 ~ 4
 *     opts.pitch   音高（半音，可小數），0 = 不變。範圍 -24 ~ +24
 *     opts.mode    'speech' | 'perc'（WSOLA，時域）／'music' | 'mixed'（相位聲碼器，頻域）
 *                  [新增 4-4] 'psola'（音高同步重疊相加，依 opts.f0 / opts.f0Target 輪廓改音高，見 timepitch-psola.js）
 *                  [新增 4-5] 'retime'（語速／停頓重排：語音段變速、停頓縮短或拉長，見 timepitch-speech.js；
 *                  注意 'speech' 已經是 WSOLA 的模式名，所以重排用 'retime'，內部伸縮模式改由 opts.speechMode 指定）
 *     opts.formant 改音高時保留共振峰（人聲不會變花栗鼠／巨人）
 *     opts.formantShift 額外移動共振峰（半音，±12）；可做「聲音變年輕／變成熟」
 *     opts.link    true = 磁帶式：音高與速度連動（單純重新取樣，不做伸縮）
 *                  此時 tempo 即播放速率，pitch 被忽略
 *     opts.onprogress ( 0~1 )
 *
 * 做法：
 *   1. WSOLA 時間伸縮：以波形相似度挑選每個視窗的接合位置（比原本無對齊的 OLA 乾淨），
 *      週期 Hann 窗 + 50% 重疊，窗函數加總恆為 1，因此音量不會隨速度改變。
 *   2. 改音高 = 先伸縮 s = pitchRatio / tempo，再用加窗 sinc 重新取樣 pitchRatio 倍，
 *      最後長度 = 原長 / tempo。
 *   3. 所有聲道共用同一組接合位置（以單聲道混音計算），因此立體聲相位不會漂移。
 */
(function ( root ) {
	'use strict';

	var MODES = {
		/* 'music'、'mixed' 走相位聲碼器（pvStretch），不使用此表 */
		/* 視窗長度（秒）、搜尋範圍（秒） */
		speech : { win: 0.030, tol: 0.015 },
		music  : { win: 0.060, tol: 0.020 },
		perc   : { win: 0.016, tol: 0.006 }
	};

	function clamp ( v, a, b ) { return v < a ? a : v > b ? b : v; }

	/* ---------- 逐幀計畫（曲線用） ----------
	 * 固定跳距時，第 f 幀的輸入位置 = f * Ha。速度隨時間變化時，改成逐幀累加：
	 *   P[f+1] = P[f] + Hs / s(輸入位置)      s = 輸出長 / 輸入長（局部）
	 * 合成端（中間時間軸）第 f 幀固定在 f * Hs，所以 (P[f], f*Hs) 就是「輸入時間 → 中間時間」的對照表。 */
	function buildPlan ( Hs, sAt, n, fmin ) {
		var P = [], s0 = sAt ( 0 ), f, p = 0, cross = -1, guard = 0;
		for (f = fmin; f < 0; ++f) P.push ( f * Hs / s0 );
		P.push ( 0 );
		for (f = 0; guard++ < 20000000; ) {
			var p2 = p + Hs / sAt ( p );
			p2 = p + Hs / sAt ( ( p + p2 ) / 2 );
			++f; P.push ( p2 );
			if (cross < 0 && p2 >= n) cross = f - 1 + ( n - p ) / ( p2 - p );
			if (cross >= 0 && f >= Math.ceil ( cross ) + 2) break;
			p = p2;
		}
		return { P: P, fmin: fmin, frames: fmin + P.length, Hs: Hs, outLen: Math.max (1, Math.round ( cross * Hs )) };
	}

	/* ---------- 重新取樣（加窗 sinc） ---------- */

	var KT_RES = 512, KT_HALF = 10, KT = null;
	function kernel () {
		if (KT) return KT;
		KT = new Float32Array ( KT_HALF * KT_RES + 2 );
		for (var i = 0; i < KT.length; ++i) {
			var x = i / KT_RES;
			if (x >= KT_HALF) { KT[i] = 0; continue; }
			var s = x < 1e-9 ? 1 : Math.sin ( Math.PI * x ) / ( Math.PI * x );
			var wnd = 0.5 + 0.5 * Math.cos ( Math.PI * x / KT_HALF );       /* Hann */
			KT[i] = s * wnd;
		}
		return KT;
	}

	/* 讀取位置每次前進 ratio（>1 變高變短）；降頻時自動低通避免混疊 */
	function resample ( x, ratio, outLen ) {
		var n = x.length, out = new Float32Array ( outLen );
		if (ratio === 1) { out.set ( x.subarray ( 0, outLen ) ); return out; }

		var kt = kernel ();
		var cut = ratio > 1 ? 1 / ratio : 1;
		var hw = Math.ceil ( KT_HALF / cut );

		for (var i = 0; i < outLen; ++i) {
			var t = i * ratio, c = Math.floor ( t ), acc = 0;
			var lo = c - hw + 1, hi = c + hw;
			if (lo < 0) lo = 0;
			if (hi > n - 1) hi = n - 1;
			for (var j = lo; j <= hi; ++j) {
				var u = Math.abs ( t - j ) * cut * KT_RES;
				var k = u >> 0;
				if (k >= KT_HALF * KT_RES) continue;
				var f = u - k;
				acc += x[j] * ( kt[k] + ( kt[k + 1] - kt[k] ) * f );
			}
			out[i] = acc * cut;
		}
		return out;
	}

	/* ---------- WSOLA ---------- */

	function stretch ( chs, sr, s, mode, progress, sAt, planOut ) {
		var nch = chs.length, n = chs[0].length;
		var outLen = Math.max (1, Math.round ( n * s ));       /* 曲線模式下，s 傳入最小的局部 s，outLen 於下方由計畫改寫 */
		var m = MODES[ mode ] || MODES.speech;

		/* 速度很快時視窗要縮短，否則視窗比跳距還長會漏掉內容 */
		var N = Math.max (64, Math.round ( sr * m.win ));
		if (s < 0.5) N = Math.max (64, Math.round ( N * Math.max (0.5, s * 2) ));
		N += N & 1;
		var Hs = N >> 1;                    /* 合成跳距：50% 重疊 */
		var Ha = Hs / s;                    /* 理想分析跳距（可為小數） */
		var plan = null;
		if (sAt) { plan = buildPlan ( Hs, sAt, n, -1 ); outLen = plan.outLen; if (planOut) for (var pk in plan) planOut[pk] = plan[pk]; }
		var tol = Math.max (8, Math.round ( sr * m.tol ));
		var D = 8;                          /* 粗搜尋降取樣倍率 */

		var win = new Float32Array ( N );   /* 週期 Hann：50% 重疊時加總恆為 1 */
		for (var i = 0; i < N; ++i) win[i] = 0.5 - 0.5 * Math.cos ( 2 * Math.PI * i / N );

		/* 單聲道混音（前後各補 P 個零，之後搜尋免做邊界檢查） */
		var P = N + tol + 2 * D + 16;
		var mono = new Float32Array ( n + 2 * P );
		for (var c = 0; c < nch; ++c) {
			var ch = chs[c];
			for (var k = 0; k < n; ++k) mono[P + k] += ch[k];
		}
		if (nch > 1) { var inv = 1 / nch; for (var k2 = 0; k2 < n; ++k2) mono[P + k2] *= inv; }

		/* 降取樣版本與其平方前綴和（用於正規化相關） */
		var ML = mono.length, dl = Math.floor ( ML / D );
		var md = new Float32Array ( dl );
		for (var j = 0; j < dl; ++j) {
			var a = 0, b = j * D;
			for (var q = 0; q < D; ++q) a += mono[b + q];
			md[j] = a / D;
		}
		var pre = new Float64Array ( dl + 1 );
		for (var j2 = 0; j2 < dl; ++j2) pre[j2 + 1] = pre[j2] + md[j2] * md[j2];

		var Nd = Math.max (4, Math.floor ( N / D ));
		var out = [];
		for (var c2 = 0; c2 < nch; ++c2) out.push ( new Float32Array ( outLen ) );

		function place ( pos, outPos ) {          /* pos：輸入起點（可為負） */
			for (var c = 0; c < nch; ++c) {
				var src = chs[c], dst = out[c];
				for (var i = 0; i < N; ++i) {
					var o = outPos + i, p = pos + i;
					if (o < 0) continue;
					if (o >= outLen) break;
					if (p < 0 || p >= n) continue;
					dst[o] += src[p] * win[i];
				}
			}
		}

		var prev = 0, frames = plan ? plan.frames : Math.ceil ( outLen / Hs ) + 2;
		for (var f = -1; f < frames; ++f) {
			var target = plan ? Math.round ( plan.P[ f - plan.fmin ] ) : Math.round ( f * Ha );
			var pos = target;

			if (f >= 1) {
				var nat = prev + Hs;                          /* 上一個視窗的「自然接續」 */
				var lo = target - tol, hi = target + tol;

				/* 粗搜尋（降取樣）：模板 = 輸入中 nat 起的一段 */
				var tc = Math.round ( ( nat + P ) / D );
				if (tc < 0) tc = 0;
				if (tc + Nd > dl) tc = dl - Nd;
				var cl = Math.max (0, Math.floor ( ( lo + P ) / D ));
				var ch2 = Math.min (dl - Nd, Math.ceil ( ( hi + P ) / D ));
				var best = -1e30, bc = Math.round ( ( target + P ) / D );
				for (var cc = cl; cc <= ch2; ++cc) {
					var dot = 0;
					for (var u = 0; u < Nd; ++u) dot += md[tc + u] * md[cc + u];
					var e = pre[cc + Nd] - pre[cc];
					var sc = dot / Math.sqrt ( e + 1e-9 );
					if (sc > best) { best = sc; bc = cc; }
				}

				/* 精搜尋（原取樣率，隔點取樣加速） */
				var p0 = bc * D - P, tb = nat + P;
				var bestF = -1e30, bp = clamp ( p0, lo, hi );
				var fl = Math.max (lo, p0 - D), fh = Math.min (hi, p0 + D);
				for (var pp = fl; pp <= fh; ++pp) {
					var base = pp + P, dot2 = 0, en = 0;
					for (var v = 0; v < N; v += 2) {
						var cv = mono[base + v];
						dot2 += mono[tb + v] * cv;
						en += cv * cv;
					}
					var sf = dot2 / Math.sqrt ( en + 1e-9 );
					if (sf > bestF) { bestF = sf; bp = pp; }
				}
				pos = bp;
			}

			place ( pos, f * Hs );
			prev = pos;
			if (progress && (f & 63) === 0) progress ( 0.9 * ( f + 1 ) / frames );
		}
		return out;
	}


	/* ---------- FFT（基 2，原地） ---------- */

	var FFT_CACHE = {};
	function fftFor ( n ) {
		if (FFT_CACHE[n]) return FFT_CACHE[n];
		var rev = new Uint32Array ( n ), bits = Math.round ( Math.log ( n ) / Math.LN2 );
		for (var i = 0; i < n; ++i) {
			var r = 0, x = i;
			for (var b = 0; b < bits; ++b) { r = ( r << 1 ) | ( x & 1 ); x >>= 1; }
			rev[i] = r;
		}
		var cs = new Float64Array ( n >> 1 ), sn = new Float64Array ( n >> 1 );
		for (var k = 0; k < ( n >> 1 ); ++k) { cs[k] = Math.cos ( 2 * Math.PI * k / n ); sn[k] = Math.sin ( 2 * Math.PI * k / n ); }

		function run ( re, im, sign ) {
			var i, j, t;
			for (i = 0; i < n; ++i) {
				j = rev[i];
				if (j > i) { t = re[i]; re[i] = re[j]; re[j] = t; t = im[i]; im[i] = im[j]; im[j] = t; }
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
		var o = {
			n: n,
			fwd: function ( re, im ) { run ( re, im, -1 ); },
			inv: function ( re, im ) {                    /* 含 1/n 縮放 */
				run ( re, im, 1 );
				var g = 1 / n;
				for (var i = 0; i < n; ++i) { re[i] *= g; im[i] *= g; }
			}
		};
		FFT_CACHE[n] = o;
		return o;
	}

	function pow2AtLeast ( v ) { var n = 64; while (n < v) n <<= 1; return n; }

	/* ---------- 相位聲碼器時間伸縮 ----------
	 * 每個頻譜峰值照瞬時頻率推進相位，峰值周圍的頻帶跟著峰值走（identity phase locking），
	 * 避免「水中」般的相位散開；偵測到瞬態（頻譜通量暴增）時把相位重置成原始相位，保住打擊的衝擊感。
	 * 聲道：相位推進只用單聲道混音算一次，各聲道保留與混音的相位差 → 立體聲像不會飄。 */
	function pvStretch ( chs, sr, s, mode, progress, sAt, planOut ) {
		var nch = chs.length, n = chs[0].length;
		var outLen = Math.max (1, Math.round ( n * s ));
		var N = pow2AtLeast ( sr * ( mode === 'mixed' ? 0.040 : 0.085 ) );
		var Hs = N >> 2, Ha = Hs / s, H2 = N >> 1;
		var plan = null;
		if (sAt) { plan = buildPlan ( Hs, sAt, n, -3 ); outLen = plan.outLen; if (planOut) for (var pk in plan) planOut[pk] = plan[pk]; }
		var fft = fftFor ( N );

		var win = new Float64Array ( N );
		for (var i = 0; i < N; ++i) win[i] = 0.5 - 0.5 * Math.cos ( 2 * Math.PI * i / N );

		var out = [], norm = new Float32Array ( outLen ), c;
		for (c = 0; c < nch; ++c) out.push ( new Float32Array ( outLen ) );

		var re = [], im = [];
		for (c = 0; c <= nch; ++c) { re.push ( new Float64Array ( N ) ); im.push ( new Float64Array ( N ) ); }   /* 最後一組 = 單聲道混音 */
		var mono = nch, mag = new Float64Array ( H2 + 1 ), phi = new Float64Array ( H2 + 1 );
		var prevPhi = new Float64Array ( H2 + 1 ), prevMag = new Float64Array ( H2 + 1 );
		var synth = new Float64Array ( H2 + 1 ), thS = new Float64Array ( H2 + 1 );
		var peaks = new Int32Array ( H2 + 1 );
		var TWO_PI = 2 * Math.PI, omega = new Float64Array ( H2 + 1 );
		for (var k0 = 0; k0 <= H2; ++k0) omega[k0] = TWO_PI * k0 / N;

		var frames = plan ? plan.frames : Math.ceil ( outLen / Hs ) + 4, prevPos = 0, first = true, cool = 0;

		for (var f = -3; f < frames; ++f) {
			var pos = plan ? Math.round ( plan.P[ f - plan.fmin ] ) : Math.round ( f * Ha ), outPos = f * Hs;

			/* 取框 + 加窗，各聲道 FFT，並做單聲道混音 */
			var mr = re[mono], mi = im[mono];
			mr.fill ( 0 ); mi.fill ( 0 );
			for (c = 0; c < nch; ++c) {
				var rr = re[c], ii = im[c], src = chs[c];
				ii.fill ( 0 );
				for (var j = 0; j < N; ++j) {
					var p = pos + j, v = ( p >= 0 && p < n ) ? src[p] : 0;
					rr[j] = v * win[j];
					mr[j] += rr[j];
				}
				fft.fwd ( rr, ii );
			}
			if (nch > 1) { var inv = 1 / nch; for (var j2 = 0; j2 < N; ++j2) mr[j2] *= inv; }
			else mr = re[0];
			if (nch === 1) { mi = im[0]; }
			else fft.fwd ( mr, mi );          /* 單聲道混音 FFT */

			/* 單聲道的幅度／相位 */
			var flux = 0, sumPrev = 0, maxMag = 0;
			for (var k = 0; k <= H2; ++k) {
				var a = mr[k], b = mi[k], m = Math.sqrt ( a * a + b * b );
				mag[k] = m; phi[k] = Math.atan2 ( b, a );
				if (m > maxMag) maxMag = m;
				if (m > prevMag[k]) flux += m - prevMag[k];
				sumPrev += prevMag[k];
			}

			var transient = !first && cool <= 0 && sumPrev > 1e-6 && ( flux / sumPrev ) > 1.4 && maxMag > 1e-4;
			if (cool > 0) --cool;

			if (first || transient) {
				for (var k1 = 0; k1 <= H2; ++k1) thS[k1] = phi[k1];
				if (transient) cool = 3;
				first = false;
			}
			else {
				var ha = Math.max (1, pos - prevPos);
				/* 找峰值 */
				var np = 0, floor = maxMag * 1e-3;
				for (var k2 = 2; k2 < H2 - 1; ++k2) {
					var mk = mag[k2];
					if (mk > floor && mk > mag[k2 - 1] && mk >= mag[k2 + 1] && mk > mag[k2 - 2] && mk >= mag[k2 + 2]) peaks[np++] = k2;
				}
				if (np === 0) {
					for (var k3 = 0; k3 <= H2; ++k3) thS[k3] = synth[k3] + Hs * omega[k3];
				}
				else {
					/* 各峰值：瞬時頻率 → 合成相位 */
					var pj = 0;
					for (var q = 0; q < np; ++q) {
						var pk = peaks[q];
						var dphi = phi[pk] - prevPhi[pk] - omega[pk] * ha;
						dphi -= TWO_PI * Math.round ( dphi / TWO_PI );
						var instF = omega[pk] + dphi / ha;
						var tp = synth[pk] + instF * Hs;
						/* 影響範圍：到相鄰峰值的中點 */
						var lo = q === 0 ? 0 : ( peaks[q - 1] + pk ) >> 1;
						var hi = q === np - 1 ? H2 : ( pk + peaks[q + 1] ) >> 1;
						if (q > 0) lo += 1;
						for (var kk = lo; kk <= hi; ++kk) thS[kk] = tp + ( phi[kk] - phi[pk] );
					}
				}
			}

			/* 重建每個聲道：合成相位 + （聲道相位 − 混音相位） */
			for (c = 0; c < nch; ++c) {
				var cr = re[c], ci = im[c];
				if (nch === 1) {
					for (var u = 0; u <= H2; ++u) {
						var th = thS[u];
						cr[u] = mag[u] * Math.cos ( th ); ci[u] = mag[u] * Math.sin ( th );
					}
				}
				else {
					for (var u2 = 0; u2 <= H2; ++u2) {
						var x0 = cr[u2], y0 = ci[u2];
						var mc = Math.sqrt ( x0 * x0 + y0 * y0 );
						var th2 = thS[u2] + ( Math.atan2 ( y0, x0 ) - phi[u2] );
						cr[u2] = mc * Math.cos ( th2 ); ci[u2] = mc * Math.sin ( th2 );
					}
				}
				ci[0] = 0; ci[H2] = 0;
				for (var u3 = 1; u3 < H2; ++u3) { cr[N - u3] = cr[u3]; ci[N - u3] = -ci[u3]; }
				fft.inv ( cr, ci );
				var dst = out[c];
				for (var j3 = 0; j3 < N; ++j3) {
					var o = outPos + j3;
					if (o < 0) continue;
					if (o >= outLen) break;
					dst[o] += cr[j3] * win[j3];
				}
			}
			for (var j4 = 0; j4 < N; ++j4) {
				var o2 = outPos + j4;
				if (o2 < 0) continue;
				if (o2 >= outLen) break;
				norm[o2] += win[j4] * win[j4];
			}

			for (var k4 = 0; k4 <= H2; ++k4) { prevPhi[k4] = phi[k4]; prevMag[k4] = mag[k4]; synth[k4] = thS[k4]; }
			prevPos = pos;
			if (progress && (f & 31) === 0) progress ( 0.8 * ( f + 4 ) / ( frames + 3 ) );
		}

		for (c = 0; c < nch; ++c) {
			var d2 = out[c];
			for (var z = 0; z < outLen; ++z) if (norm[z] > 1e-3) d2[z] /= norm[z];
		}
		return out;
	}

	/* ---------- 共振峰校正 ----------
	 * 重新取樣後，頻譜包絡（共振峰）跟著搬動了 pr 倍。這裡估計每個短時框的包絡
	 * （倒頻譜平滑＋「真包絡」迭代，會貼著諧波峰頂），再把包絡搬回
	 *   E_target(f) = E_orig(f / fs)，fs = 2^(formantShift/12)
	 * 以增益 G(f) = E_z(f·r) / E_z(f)（r = pr / fs）作用在頻譜上。
	 * 增益以所有聲道的平均幅度計算並共用，立體聲像不變。 */
	function formantFix ( chs, sr, r, progress ) {
		var nch = chs.length, n = chs[0].length;
		var N = pow2AtLeast ( sr * 0.046 ), H = N >> 2, H2 = N >> 1;
		var fft = fftFor ( N );
		var win = new Float64Array ( N );
		for (var i = 0; i < N; ++i) win[i] = 0.5 - 0.5 * Math.cos ( 2 * Math.PI * i / N );

		var lift = Math.max (16, Math.round ( sr * 0.003 ));
		var GMAX = Math.pow ( 10, 18 / 20 ), GMIN = Math.pow ( 10, -30 / 20 );
		var out = [], norm = new Float32Array ( n ), c;
		for (c = 0; c < nch; ++c) out.push ( new Float32Array ( n ) );
		var re = [], im = [];
		for (c = 0; c < nch; ++c) { re.push ( new Float64Array ( N ) ); im.push ( new Float64Array ( N ) ); }
		var er = new Float64Array ( N ), ei = new Float64Array ( N );
		var logm = new Float64Array ( H2 + 1 ), cur = new Float64Array ( H2 + 1 ), env = new Float64Array ( H2 + 1 );
		var gain = new Float64Array ( H2 + 1 );

		var frames = Math.ceil ( ( n + N ) / H ) + 1;
		var rIsFn = typeof r === 'function';
		for (var f = -3; f < frames; ++f) {
			var pos = f * H, k;
			var rf = rIsFn ? r ( pos + H2 ) : r;
			for (k = 0; k <= H2; ++k) logm[k] = 0;
			for (c = 0; c < nch; ++c) {
				var rr = re[c], ii = im[c], src = chs[c];
				ii.fill ( 0 );
				for (var j = 0; j < N; ++j) {
					var p = pos + j;
					rr[j] = ( p >= 0 && p < n ) ? src[p] * win[j] : 0;
				}
				fft.fwd ( rr, ii );
				for (k = 0; k <= H2; ++k) logm[k] += Math.sqrt ( rr[k] * rr[k] + ii[k] * ii[k] ) / nch;
			}
			var loud = 0;
			for (k = 0; k <= H2; ++k) { if (logm[k] > loud) loud = logm[k]; logm[k] = Math.log ( Math.max ( logm[k], 1e-9 ) ); }

			if (loud < 1e-5) { for (k = 0; k <= H2; ++k) gain[k] = 1; }
			else {
				/* 真包絡：反覆「取包絡、與原譜取大」 */
				for (k = 0; k <= H2; ++k) cur[k] = logm[k];
				for (var it = 0; it < 3; ++it) {
					for (k = 0; k <= H2; ++k) { er[k] = cur[k]; ei[k] = 0; }
					for (k = 1; k < H2; ++k) { er[N - k] = cur[k]; ei[N - k] = 0; }
					fft.inv ( er, ei );
					for (k = lift + 1; k < N - lift; ++k) { er[k] = 0; ei[k] = 0; }
					er[lift] *= 0.5; er[N - lift] *= 0.5;
					fft.fwd ( er, ei );
					for (k = 0; k <= H2; ++k) { env[k] = er[k]; cur[k] = Math.max ( logm[k], env[k] ); }
				}
				for (k = 0; k <= H2; ++k) {
					var t = k * rf, i0 = t >> 0;
					var eT = i0 >= H2 ? env[H2] : env[i0] + ( env[i0 + 1] - env[i0] ) * ( t - i0 );
					var g = Math.exp ( eT - env[k] );
					gain[k] = g < GMIN ? GMIN : g > GMAX ? GMAX : g;
				}
			}

			for (c = 0; c < nch; ++c) {
				var cr = re[c], ci = im[c];
				for (k = 0; k <= H2; ++k) { cr[k] *= gain[k]; ci[k] *= gain[k]; }
				ci[0] = 0; ci[H2] = 0;
				for (k = 1; k < H2; ++k) { cr[N - k] = cr[k]; ci[N - k] = -ci[k]; }
				fft.inv ( cr, ci );
				var dst = out[c];
				for (var j2 = 0; j2 < N; ++j2) {
					var o = pos + j2;
					if (o < 0) continue;
					if (o >= n) break;
					dst[o] += cr[j2] * win[j2];
				}
			}
			for (var j3 = 0; j3 < N; ++j3) {
				var o2 = pos + j3;
				if (o2 < 0) continue;
				if (o2 >= n) break;
				norm[o2] += win[j3] * win[j3];
			}
			if (progress && (f & 31) === 0) progress ( ( f + 4 ) / ( frames + 3 ) );
		}
		for (c = 0; c < nch; ++c) {
			var d2 = out[c];
			for (var z = 0; z < n; ++z) if (norm[z] > 1e-3) d2[z] /= norm[z];
		}
		return out;
	}


	/* ---------- 曲線模式（階段 3-3） ----------
	 * opts.tempoCurve : [{ t: 秒, v: 倍率 }]   速度曲線，t 為「輸入」時間（相對於處理片段起點）
	 * opts.pitchCurve : [{ t: 秒, v: 半音 }]   音高曲線，同上
	 *   速度在 log 域線性內插（0.5→2 的中點是 1），音高線性內插；曲線外側維持端點值。
	 *   與常數參數相乘／相加：實際速度 = opts.tempo × 曲線，實際音高 = opts.pitch + 曲線。
	 * 做法：令 u = 輸入時間，T(u) = 速度，pr(u) = 音高倍率
	 *   最終時間 τ(u)：dτ/du = 1 / T       中間時間 σ(u)：dσ/du = pr / T（先伸縮到 σ，再以 pr 重新取樣）
	 *   最終每個取樣 i 讀取中間訊號的 σ(u(τ=i))，讀取速度 dσ/dτ = pr，所以局部音高正確。 */

	var GRID = 128;                                   /* 曲線取樣網格（取樣點） */

	function normCurve ( pts ) {
		var a = [];
		if (pts && pts.length) for (var i = 0; i < pts.length; ++i) {
			var q = pts[i];
			if (q && isFinite ( q.t ) && isFinite ( q.v )) a.push ({ t: +q.t, v: +q.v });
		}
		a.sort ( function ( x, y ) { return x.t - y.t; } );
		return a.length ? a : null;
	}

	function evalCurve ( c, t, isLog ) {
		var n = c.length;
		if (t <= c[0].t) return c[0].v;
		if (t >= c[n - 1].t) return c[n - 1].v;
		var lo = 0, hi = n - 1;
		while (hi - lo > 1) { var m = ( lo + hi ) >> 1; if (c[m].t <= t) lo = m; else hi = m; }
		var a = c[lo], b = c[hi], f = b.t > a.t ? ( t - a.t ) / ( b.t - a.t ) : 0;
		if (isLog) return Math.exp ( Math.log ( a.v ) + ( Math.log ( b.v ) - Math.log ( a.v ) ) * f );
		return a.v + ( b.v - a.v ) * f;
	}

	function buildMaps ( n, sr, opts ) {
		var ct = normCurve ( opts.tempoCurve ), cp = normCurve ( opts.pitchCurve );
		if (ct) for (var z = 0; z < ct.length; ++z) ct[z].v = clamp ( ct[z].v, 0.05, 20 );
		var T0 = clamp ( +opts.tempo || 1, 0.25, 4 ), P0 = +opts.pitch || 0;
		var K = Math.ceil ( n / GRID ) + 2, Tg = new Float64Array ( K ), Pg = new Float64Array ( K );
		var tau = new Float64Array ( K ), k, sMin = 1e9, sMax = 0, pMin = 1e9, pMax = -1e9;
		for (k = 0; k < K; ++k) {
			var sec = k * GRID / sr;
			Tg[k] = clamp ( T0 * ( ct ? evalCurve ( ct, sec, true ) : 1 ), 0.25, 4 );
			var st = clamp ( P0 + ( cp ? evalCurve ( cp, sec, false ) : 0 ), -24, 24 );
			Pg[k] = Math.pow ( 2, st / 12 );
			if (st < pMin) pMin = st; if (st > pMax) pMax = st;
			var s = Pg[k] / Tg[k]; if (s < sMin) sMin = s; if (s > sMax) sMax = s;
		}
		for (k = 0; k + 1 < K; ++k) tau[k + 1] = tau[k] + GRID * 0.5 * ( 1 / Tg[k] + 1 / Tg[k + 1] );

		function grid ( arr, u ) {                      /* u：輸入取樣位置 */
			var x = u / GRID; if (x < 0) x = 0;
			var i = x >> 0; if (i >= K - 1) return arr[K - 1];
			return arr[i] + ( arr[i + 1] - arr[i] ) * ( x - i );
		}
		var tauEnd = grid ( tau, n );
		return {
			K: K, Tg: Tg, Pg: Pg, tau: tau, tauEnd: tauEnd, sMin: sMin, sMax: sMax, pMin: pMin, pMax: pMax,
			finalLen: Math.max (1, Math.round ( tauEnd )),
			sAt: function ( u ) { return grid ( Pg, u ) / grid ( Tg, u ); },
			/* 掃描用游標：i 必須由小到大。回傳輸入位置 u，並在 cur.T / cur.pr 放局部速度與音高倍率 */
			cursor: function () {
				var j = 0, cur = { T: 1, pr: 1 };
				cur.u = function ( i ) {
					while (j < K - 2 && tau[j + 1] <= i) ++j;
					var d = tau[j + 1] - tau[j], f = d > 0 ? ( i - tau[j] ) / d : 0;
					if (f > 1) f = 1;
					cur.T = Tg[j] + ( Tg[j + 1] - Tg[j] ) * f;
					cur.pr = Pg[j] + ( Pg[j + 1] - Pg[j] ) * f;
					return ( j + f ) * GRID;
				};
				return cur;
			}
		};
	}

	/* 變倍率重新取樣：posOf(i) 給輸入讀取位置，cur.rate 給局部倍率（>1 降頻時自動低通） */
	function resampleVar ( x, outLen, posOf, rateOf ) {
		var n = x.length, out = new Float32Array ( outLen ), kt = kernel ();
		for (var i = 0; i < outLen; ++i) {
			var t = posOf ( i ), ratio = rateOf ();
			var cut = ratio > 1 ? 1 / ratio : 1, hw = Math.ceil ( KT_HALF / cut );
			var c = Math.floor ( t ), acc = 0, lo = c - hw + 1, hi = c + hw;
			if (lo < 0) lo = 0;
			if (hi > n - 1) hi = n - 1;
			for (var j = lo; j <= hi; ++j) {
				var u = Math.abs ( t - j ) * cut * KT_RES, k = u >> 0;
				if (k >= KT_HALF * KT_RES) continue;
				var f = u - k;
				acc += x[j] * ( kt[k] + ( kt[k + 1] - kt[k] ) * f );
			}
			out[i] = acc * cut;
		}
		return out;
	}

	function processCurve ( channels, sr, opts ) {
		var n = channels[0].length, nch = channels.length, report = opts.onprogress || null, c;
		var M = buildMaps ( n, sr, opts ), finalLen = M.finalLen;

		if (opts.link) {                               /* 磁帶式：只重新取樣，音高跟著速度走 */
			var res = [];
			for (c = 0; c < nch; ++c) {
				var cur = M.cursor ();
				res.push ( resampleVar ( channels[c], finalLen, function ( i ) { return cur.u ( i ); }, function () { return cur.T; } ) );
				report && report ( ( c + 1 ) / nch );
			}
			return res;
		}

		var fshift = clamp ( +opts.formantShift || 0, -12, 12 );
		var pitched = M.pMax - M.pMin > 1e-4 || Math.abs ( M.pMax ) > 1e-4;
		var needFormant = !!opts.formant && ( pitched || Math.abs ( fshift ) > 1e-3 );
		var needStretch = M.sMax - 1 > 1e-4 || 1 - M.sMin > 1e-4;
		var freq = opts.mode === 'music' || opts.mode === 'mixed';
		var w1 = needFormant ? 0.8 : 1, stretched = channels, plan = {};

		if (needStretch) {
			var rep1 = report ? function ( p ) { report ( p * w1 * 0.9 ); } : null;
			stretched = freq ? pvStretch ( channels, sr, M.sMin, opts.mode, rep1, M.sAt, plan )
			                 : stretch ( channels, sr, M.sMin, opts.mode, rep1, M.sAt, plan );
		}

		var shifted = [];
		if (!pitched) {
			for (c = 0; c < nch; ++c) {
				var o = new Float32Array ( finalLen );
				o.set ( stretched[c].subarray ( 0, finalLen ) );
				shifted.push ( o );
			}
		}
		else {
			/* σ(u)：由計畫表 (P[f], f*Hs) 內插；沒有計畫（s≈1，不需伸縮）時 σ = u */
			var P = plan.P, f0 = plan.fmin, Hs = plan.Hs, sig = function ( u ) { return u; };
			if (P) {
				var idx = -f0 >= 0 ? -f0 : 0;
				sig = function ( u ) {
					while (idx < P.length - 2 && P[idx + 1] <= u) ++idx;
					var a = P[idx], b = P[idx + 1], f = b > a ? ( u - a ) / ( b - a ) : 0;
					return ( idx + f0 + f ) * Hs;
				};
			}
			for (c = 0; c < nch; ++c) {
				var cu = M.cursor (); if (P) idx = -f0;
				shifted.push ( resampleVar ( stretched[c], finalLen,
					function ( i ) { return sig ( cu.u ( i ) ); }, function () { return cu.pr; } ) );
				report && report ( w1 * ( 0.9 + 0.1 * ( c + 1 ) / nch ) );
			}
		}

		if (needFormant) {
			/* 每個最終時間位置的音高倍率 → 共振峰增益比 r = pr / fs（函式形式，逐幀取值） */
			var fs = Math.pow ( 2, fshift / 12 ), cr = M.cursor (), prAt = [], q;
			for (q = 0; q * GRID < finalLen + GRID; ++q) { cr.u ( q * GRID ); prAt.push ( cr.pr ); }
			shifted = formantFix ( shifted, sr, function ( pos ) {
				var x = pos / GRID, i = Math.max (0, Math.min ( prAt.length - 2, x >> 0 ));
				var v = prAt[i] + ( prAt[i + 1] - prAt[i] ) * Math.max (0, Math.min (1, x - i));
				return v / fs;
			}, report ? function ( p ) { report ( 0.8 + 0.2 * p ); } : null );
		}
		return shifted;
	}

	/* 曲線處理後的長度（取樣數），給介面即時顯示用；不做任何音訊運算 */
	function curveLength ( n, sr, opts ) { return buildMaps ( n, sr, opts || {} ).finalLen; }

	/* ---------- 主流程 ---------- */

	function process ( channels, sr, opts ) {
		opts = opts || {};
		/* [新增 4-5] 語速／停頓重排：由 timepitch-speech.js 處理 */
		if (opts.mode === 'retime') {
			if (!root.PKSpeech) throw new Error ( 'PKSpeech not loaded (timepitch-speech.js)' );
			return root.PKSpeech.process ( channels, sr, opts );
		}
		/* [新增 4-4] PSOLA 模式：由 timepitch-psola.js 處理（依 F0 輪廓改音高，可同時變速） */
		if (opts.mode === 'psola') {
			if (!root.PKPsola) throw new Error ( 'PKPsola not loaded (timepitch-psola.js)' );
			return root.PKPsola.process ( channels, sr, opts );
		}
		if (opts.tempoCurve || opts.pitchCurve) return processCurve ( channels, sr, opts );
		var n = channels[0].length;
		var tempo = clamp ( +opts.tempo || 1, 0.25, 4 );
		var semis = clamp ( +opts.pitch || 0, -24, 24 );
		var report = opts.onprogress || null;
		var res = [], c;

		if (opts.link) {                           /* 磁帶式：只重新取樣 */
			var outLenL = Math.max (1, Math.round ( n / tempo ));
			for (c = 0; c < channels.length; ++c) {
				res.push ( resample ( channels[c], tempo, outLenL ) );
				report && report ( ( c + 1 ) / channels.length );
			}
			return res;
		}

		var pr = Math.pow ( 2, semis / 12 );
		var s = pr / tempo;                          /* 伸縮倍率（輸出長 / 輸入長） */
		var finalLen = Math.max (1, Math.round ( n / tempo ));
		var needStretch = Math.abs ( s - 1 ) > 1e-4;
		var needResample = Math.abs ( pr - 1 ) > 1e-6;
		var fshift = clamp ( +opts.formantShift || 0, -12, 12 );
		var needFormant = !!opts.formant && ( needResample || Math.abs ( fshift ) > 1e-3 );
		var freq = opts.mode === 'music' || opts.mode === 'mixed';
		var w1 = needFormant ? 0.8 : 1;              /* 進度分配 */

		var stretched = channels;
		if (needStretch) {
			var rep1 = report ? function ( p ) { report ( p * w1 * 0.9 ); } : null;
			stretched = freq ? pvStretch ( channels, sr, s, opts.mode, rep1 )
			                 : stretch ( channels, sr, s, opts.mode, rep1 );
		}

		var shifted = [];
		if (!needResample) {
			for (c = 0; c < stretched.length; ++c) {
				var o = new Float32Array ( finalLen );
				o.set ( stretched[c].subarray ( 0, finalLen ) );
				shifted.push ( o );
			}
		}
		else {
			for (c = 0; c < stretched.length; ++c) {
				shifted.push ( resample ( stretched[c], pr, finalLen ) );
				report && report ( w1 * ( 0.9 + 0.1 * ( c + 1 ) / stretched.length ) );
			}
		}

		if (needFormant) {
			/* 搬回共振峰：目標 fs = 2^(formantShift/12)，增益比例 r = pr / fs */
			var r = pr / Math.pow ( 2, fshift / 12 );
			shifted = formantFix ( shifted, sr, r, report ? function ( p ) { report ( 0.8 + 0.2 * p ); } : null );
		}
		return shifted;
	}

	/* 預估處理後長度（秒），供對話框顯示 */
	function outLength ( seconds, tempo ) { return seconds / clamp ( +tempo || 1, 0.25, 4 ); }

	root.PKTimePitch = { process: process, outLength: outLength, curveLength: curveLength, version: 5 };
})( typeof self !== 'undefined' ? self : this );


