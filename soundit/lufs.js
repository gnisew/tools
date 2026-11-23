(function (PKAE) {
	'use strict';

	var C = {
		block: 0.400,
		hop: 0.100,
		absGate: -70,
		relGate: -10,
		offset: -0.691,
		truePeakSteps: 4
	};

	function db (v) {
		return v > 0 ? 20 * Math.log (v) / Math.LN10 : -120;
	}

	function loud (v) {
		return v > 0 ? C.offset + 10 * Math.log (v) / Math.LN10 : -Infinity;
	}

	function norm (b0, b1, b2, a0, a1, a2) {
		return {
			b0: b0 / a0,
			b1: b1 / a0,
			b2: b2 / a0,
			a1: a1 / a0,
			a2: a2 / a0
		};
	}

	function highShelf (rate) {
		var f0 = Math.min (1681.974450955533, rate * 0.45);
		var q = 0.7071752369554196;
		var gain = 3.999843853973347;
		var a = Math.pow (10, gain / 40);
		var w0 = 2 * Math.PI * f0 / rate;
		var sn = Math.sin (w0);
		var cs = Math.cos (w0);
		var alpha = sn / (2 * q);
		var sa = Math.sqrt (a);

		return norm (
			a * ((a + 1) + (a - 1) * cs + 2 * sa * alpha),
			-2 * a * ((a - 1) + (a + 1) * cs),
			a * ((a + 1) + (a - 1) * cs - 2 * sa * alpha),
			(a + 1) - (a - 1) * cs + 2 * sa * alpha,
			2 * ((a - 1) - (a + 1) * cs),
			(a + 1) - (a - 1) * cs - 2 * sa * alpha
		);
	}

	function highPass (rate) {
		var f0 = Math.min (38.13547087602444, rate * 0.45);
		var q = 0.5003270373238773;
		var w0 = 2 * Math.PI * f0 / rate;
		var sn = Math.sin (w0);
		var cs = Math.cos (w0);
		var alpha = sn / (2 * q);

		return norm (
			(1 + cs) / 2,
			-(1 + cs),
			(1 + cs) / 2,
			1 + alpha,
			-2 * cs,
			1 - alpha
		);
	}

	function kWeightCoeffs (rate) {
		return [highShelf (rate), highPass (rate)];
	}

	function biquad (x, c, s) {
		var y = c.b0 * x + c.b1 * s.x1 + c.b2 * s.x2 - c.a1 * s.y1 - c.a2 * s.y2;
		s.x2 = s.x1; s.x1 = x;
		s.y2 = s.y1; s.y1 = y;
		return (y);
	}

	function interp (a, b, c, d, t) {
		var t2 = t * t;
		return 0.5 * ((2 * b) + (-a + c) * t +
			(2 * a - 5 * b + 4 * c - d) * t2 +
			(-a + 3 * b - 3 * c + d) * t2 * t);
	}

	function analyze (buffer) {
		var rate = buffer.sampleRate;
		var len = buffer.length;
		var channels = buffer.numberOfChannels;
		var hop = Math.max (1, (rate * C.hop) >> 0);
		var block = Math.max (1, hop * 4);
		if (len < block) {
			block = len;
			hop = len || 1;
		}
		var blocks = len <= block ? 1 : (((len - block) / hop) >> 0) + 1;
		var sums = new Float64Array (blocks);
		var coeffs = kWeightCoeffs (rate);
		var slots = Math.max (1, (block / hop) >> 0);
		var total = 0;
		var peak = 0;
		var tpeak = 0;

		for (var ch = 0; ch < channels; ++ch) {
			var data = buffer.getChannelData (ch);
			var weight = ch > 2 ? 1.41 : 1.0;
			var idx = [];
			var acc = [];
			var s1 = {x1:0, x2:0, y1:0, y2:0};
			var s2 = {x1:0, x2:0, y1:0, y2:0};
			var next = 0;
			var bi = 0;

			for (var z = 0; z < slots; ++z) {
				idx[z] = -1;
				acc[z] = 0;
			}

			function flush (slot) {
				if (idx[slot] >= 0) {
					sums[idx[slot]] += acc[slot] * weight;
					idx[slot] = -1;
					acc[slot] = 0;
				}
			}

			for (var i = 0; i < len; ++i) {
				if (i === next) {
					var slot = bi % slots;
					flush (slot);
					if (bi < blocks) {
						idx[slot] = bi;
						acc[slot] = 0;
					}
					++bi;
					next += hop;
				}

				var x = data[i];
				var ax = Math.abs (x);
				var y = biquad (biquad (x, coeffs[0], s1), coeffs[1], s2);
				var yy = y * y;

				total += x * x;
				if (ax > peak) peak = ax;
				if (ax > tpeak) tpeak = ax;

				if (i < len - 1) {
					var x0 = i ? data[i - 1] : x;
					var x2 = data[i + 1];
					var x3 = i < len - 2 ? data[i + 2] : x2;
					for (var tp = 1; tp < C.truePeakSteps; ++tp) {
						ax = Math.abs (interp (x0, x, x2, x3, tp / C.truePeakSteps));
						if (ax > tpeak) tpeak = ax;
					}
				}

				for (var j = 0; j < slots; ++j) {
					if (idx[j] >= 0) acc[j] += yy;
				}
			}

			for (var k = 0; k < slots; ++k) flush (k);
		}

		var energies = [];
		var sum = 0;
		for (var n = 0; n < blocks; ++n) {
			var e = sums[n] / block;
			if (loud (e) >= C.absGate) {
				energies.push (e);
				sum += e;
			}
		}

		var lufs = -Infinity;
		if (energies.length) {
			var gate = loud (sum / energies.length) + C.relGate;
			sum = 0;
			var count = 0;
			for (var m = 0; m < energies.length; ++m) {
				if (loud (energies[m]) >= gate) {
					sum += energies[m];
					++count;
				}
			}
			if (count) lufs = loud (sum / count);
		}

		var rms = Math.sqrt (total / Math.max (1, len * channels));
		return {
			lufs: lufs,
			rms: rms,
			rmsDb: db (rms),
			peak: peak,
			peakDb: db (peak),
			truePeak: tpeak,
			truePeakDb: db (tpeak),
			blocks: blocks
		};
	}

	function integratedLUFS (buffer) {
		return analyze (buffer).lufs;
	}

	function gainForTarget (report, target, ceiling) {
		target = target / 1;
		ceiling = ceiling / 1;
		if (!isFinite (ceiling)) ceiling = -1;

		var gainDb = isFinite (report.lufs) ? target - report.lufs : 0;
		var maxGain = ceiling - report.truePeakDb;
		var limited = false;

		if (gainDb > maxGain) {
			gainDb = maxGain;
			limited = true;
		}

		return {
			gain: Math.pow (10, gainDb / 20),
			gainDb: gainDb,
			limited: limited,
			expectedLUFS: isFinite (report.lufs) ? report.lufs + gainDb : report.lufs,
			expectedTruePeakDb: report.truePeakDb + gainDb
		};
	}

	/* ------------------------------------------------------------------
	 * 即時響度表（EBU R128 / ITU-R BS.1770）
	 *   createLive (取樣率) → { push, snapshot, reset }
	 *   push (L, R, from, to)  餵入一段新樣本（R 可為 null = 單聲道）
	 *   snapshot () → {
	 *     m 瞬間響度（400 ms）、s 短時響度（3 s）、i 積分響度（閘控）  單位 LUFS
	 *     tp 真峰值 dBTP、peak 取樣峰值 dBFS、corr 立體聲相位相關 -1 ~ +1、secs 已量測秒數
	 *   }
	 * 數值未滿視窗長度時為 -Infinity。
	 * ------------------------------------------------------------------ */
	function createLive (rate) {
		var co = kWeightCoeffs (rate);
		var SUB = Math.max (1, Math.round (rate * C.hop));   /* 100 ms 一小段 */
		var MAX_BLOCKS = 200000;                             /* 約 5.5 小時 */
		var st, ring, ring_pos, ring_n, blocks, sub_acc, sub_n, total;
		var tp, pk, c_lr, c_ll, c_rr;
		var cache_n, cache_i;
		var K = 1 / (rate * 0.3);                            /* 相位相關的平滑時間 0.3 s */

		function reset () {
			st = [[{x1:0,x2:0,y1:0,y2:0},{x1:0,x2:0,y1:0,y2:0}],
				[{x1:0,x2:0,y1:0,y2:0},{x1:0,x2:0,y1:0,y2:0}]];
			ring = new Float64Array (30);
			ring_pos = 0; ring_n = 0;
			blocks = [];
			sub_acc = 0; sub_n = 0; total = 0;
			tp = 0; pk = 0;
			c_lr = 0; c_ll = 0; c_rr = 0;
			cache_n = -1; cache_i = -Infinity;
		}
		reset ();

		/* 真峰值：只在「同一次讀到的連續樣本」內做 4 倍過取樣內插，
		 * 不跨越兩次讀取的接縫（接縫處樣本可能有重疊或缺漏，硬接會產生假峰值）。
		 * 段落 (i-2, i-1) 需要 i-3 與 i，所以會往前多看 3 個樣本。 */
		function truePeak ( X, from, to, from_min ) {
			var m = 0, v;
			for (var i = Math.max ( from, from_min === undefined ? 3 : from_min ); i < to; ++i) {
				for (var k = 1; k < C.truePeakSteps; ++k) {
					v = interp ( X[i - 3], X[i - 2], X[i - 1], X[i], k / C.truePeakSteps );
					if (v < 0) v = -v;
					if (v > m) m = v;
				}
			}
			return m;
		}

		function ringMean ( count ) {
			var sum = 0;
			for (var k = 1; k <= count; ++k) sum += ring[ (ring_pos - k + 60) % 30 ];
			return sum / count;
		}

		function endSub () {
			ring[ ring_pos ] = sub_acc / SUB;
			ring_pos = (ring_pos + 1) % 30;
			if (ring_n < 30) ++ring_n;
			sub_acc = 0; sub_n = 0;
			total += SUB;

			if (ring_n >= 4 && blocks.length < MAX_BLOCKS) blocks.push ( ringMean ( 4 ) );
		}

		/* contiguous = true：與上一次餵入的樣本首尾相連（ScriptProcessor），
		 * 會把上次最後 3 個樣本接在前面一起做真峰值內插，連接縫也量得到。 */
		function push ( L, R, from, to, contiguous ) {
			var two = !!R;
			for (var i = from; i < to; ++i) {
				var l = L[ i ];
				var r = two ? R[ i ] : l;

				var al = l < 0 ? -l : l, ar = r < 0 ? -r : r;
				if (al > pk) pk = al;
				if (ar > pk) pk = ar;
				if (al > tp) tp = al;
				if (ar > tp) tp = ar;

				var yl = biquad ( biquad ( l, co[0], st[0][0] ), co[1], st[0][1] );
				var e = yl * yl;
				if (two) {
					var yr = biquad ( biquad ( r, co[0], st[1][0] ), co[1], st[1][1] );
					e += yr * yr;
				}
				sub_acc += e;

				c_lr += (l * r - c_lr) * K;
				c_ll += (l * l - c_ll) * K;
				c_rr += (r * r - c_rr) * K;

				if (++sub_n >= SUB) endSub ();
			}

			var t = 0, t2;
			if (contiguous && to - from >= 3) {
				t = seamPeak ( 0, L, from, to );
				if (two) { t2 = seamPeak ( 1, R, from, to ); if (t2 > t) t = t2; }
			}
			else {
				t = truePeak ( L, from, to );
				if (two) { t2 = truePeak ( R, from, to ); if (t2 > t) t = t2; }
				tail[0] = null; tail[1] = null;
			}
			if (t > tp) tp = t;
		}

		var tail = [null, null];
		function seamPeak ( ch, X, from, to ) {
			var m = truePeak ( X, from, to, from + 3 );
			if (tail[ch]) {
				var j = [tail[ch][0], tail[ch][1], tail[ch][2], X[from], X[from + 1], X[from + 2]];
				var s = truePeak ( j, 3, 6, 3 );
				if (s > m) m = s;
			}
			tail[ch] = [X[to - 3], X[to - 2], X[to - 1]];
			return m;
		}

		function integrated () {
			if (cache_n === blocks.length) return cache_i;
			cache_n = blocks.length;

			var sum = 0, cnt = 0, k;
			for (k = 0; k < blocks.length; ++k) {
				if (loud ( blocks[k] ) >= C.absGate) { sum += blocks[k]; ++cnt; }
			}
			if (!cnt) return (cache_i = -Infinity);

			var gate = loud ( sum / cnt ) + C.relGate;
			sum = 0; cnt = 0;
			for (k = 0; k < blocks.length; ++k) {
				if (loud ( blocks[k] ) >= gate) { sum += blocks[k]; ++cnt; }
			}
			return (cache_i = cnt ? loud ( sum / cnt ) : -Infinity);
		}

		function snapshot () {
			var den = Math.sqrt ( c_ll * c_rr );
			return {
				m: ring_n >= 4 ? loud ( ringMean ( 4 ) ) : -Infinity,
				s: ring_n >= 30 ? loud ( ringMean ( 30 ) ) : -Infinity,
				i: integrated (),
				tp: db ( tp ),
				peak: db ( pk ),
				corr: den > 1e-9 ? Math.max ( -1, Math.min ( 1, c_lr / den ) ) : 0,
				secs: total * 1 / SUB * C.hop
			};
		}

		return { push: push, snapshot: snapshot, reset: reset };
	}

	PKAE._deps.lufs = {
		BS1770Block: C,
		kWeightCoeffs: kWeightCoeffs,
		integratedLUFS: integratedLUFS,
		analyze: analyze,
		createLive: createLive,
		gainForTarget: gainForTarget,
		db: db
	};
})(PKAudioEditor);


