/* ==========================================================================
 * timepitch-live-worklet.js  —  播放時即時變速／變調（抄譜練習用）
 *
 * 做法：WSOLA（波形對齊的重疊相加），在 AudioWorklet 裡一邊播放一邊伸縮，
 *       用「先伸縮、再重新取樣」同時支援速度（不變調）與移調（不變速）。
 *   內容速度 T、音高比 P：WSOLA 以 T/P 的速度伸縮，輸出端再以 P 倍步幅重新取樣。
 *   來源取樣率和輸出取樣率不同時，重新取樣的步幅一併換算，不用另外處理。
 *
 * 資料由主執行緒分段餵入（push），最後送 eof；worklet 定期回報目前讀到哪裡，
 * 主執行緒據此補料（見 practice-live.js）。循環播放由主執行緒在餵料時接回區間開頭，
 * 這裡看到的是一條連續的串流，接縫由 WSOLA 自己的對齊處理。
 *
 * 檔案分成兩層：
 *   create(srcRate, nch, opts)   純函式核心，Node／Worker／Worklet 都能用（測試用）
 *   PKLiveProc                   只有在 AudioWorkletGlobalScope 才註冊
 * 載入方式：audioContext.audioWorklet.addModule ('timepitch-live-worklet.js')
 * ========================================================================== */
(function ( root ) {
	'use strict';

	var D = 4;	/* 粗搜尋的抽取倍率 */

	function clamp ( v, lo, hi ) { return v < lo ? lo : v > hi ? hi : v; }

	function create ( srcRate, nch, opts ) {
		opts = opts || {};
		var outRate = opts.outRate || srcRate;
		var Hs = D * 2 * Math.max (16, Math.round (srcRate * (opts.win || 0.040) / 2 / (D * 2)));	/* 半個視窗，必為 8 的倍數 */
		var N = Hs * 2;
		var tol = Math.round (srcRate * (opts.tol || 0.012));
		var L = Hs / D;

		var win = new Float32Array (N);
		for (var i = 0; i < N; ++i) win[ i ] = 0.5 - 0.5 * Math.cos (2 * Math.PI * i / N);

		/* ---- 輸入串流（絕對索引從 0 起算；base 是陣列第 0 格對應的絕對索引，恆為 D 的倍數） ---- */
		var cap = srcRate * 6 | 0;
		var buf = [], mono = new Float32Array (cap), dec = new Float32Array (cap / D | 0);
		for (var c = 0; c < nch; ++c) buf.push (new Float32Array (cap));
		var base = 0, bufEnd = 0, decN = 0;
		var eofFlag = false, eofLen = 0;

		/* ---- WSOLA 狀態 ---- */
		var a = 0;			/* 理想的分析位置（絕對索引，浮點） */
		var prevP = 0, havePrev = false;
		var acc = [];
		for (c = 0; c < nch; ++c) acc.push (new Float32Array (N));
		var tmplD = new Float32Array (L);

		/* ---- 輸出 FIFO（來源取樣率） ---- */
		var FMASK = 32767;
		var fifo = [];
		for (c = 0; c < nch; ++c) fifo.push (new Float32Array (FMASK + 1));
		var wp = 0, rp = 0;

		var tempo = 1, semis = 0, tempoPrime = 1, step = srcRate / outRate;
		var done = false, ended = false, underruns = 0, frames = 0;

		function setParams ( t, s ) {
			tempo = clamp (+t || 1, 0.1, 4);
			semis = clamp (+s || 0, -24, 24);
			var P = Math.pow (2, semis / 12);
			tempoPrime = clamp (tempo / P, 0.1, 6);
			step = P * srcRate / outRate;
		}
		setParams (opts.tempo || 1, opts.semis || 0);

		function trim () {
			var need = Math.min (havePrev ? prevP + Hs : Infinity, Math.round (a) - tol) - 2 * D;
			var from = Math.floor (need / D) * D;
			if (from - base < srcRate) return ;			/* 超過 1 秒才整理，攤平成本 */
			var cut = from - base, left = bufEnd - from;
			for (var ch = 0; ch < nch; ++ch) buf[ ch ].copyWithin (0, cut, cut + left);
			mono.copyWithin (0, cut, cut + left);
			var dcut = cut / D, dleft = decN - dcut;
			dec.copyWithin (0, dcut, dcut + dleft);
			base = from; decN = dleft;
		}

		function grow ( need ) {
			if (need <= mono.length) return ;
			var nc = Math.max (need, mono.length * 2);
			nc = Math.ceil (nc / D) * D;
			for (var ch = 0; ch < nch; ++ch) { var nb = new Float32Array (nc); nb.set (buf[ ch ].subarray (0, bufEnd - base)); buf[ ch ] = nb; }
			var nm = new Float32Array (nc); nm.set (mono.subarray (0, bufEnd - base)); mono = nm;
			var nd = new Float32Array (nc / D); nd.set (dec.subarray (0, decN)); dec = nd;
		}

		function push ( chs ) {
			if (!chs || !chs[0] || !chs[0].length || eofFlag) return ;
			trim ();
			var n = chs[0].length, o = bufEnd - base;
			grow (o + n);
			var inv = 1 / nch;
			for (var ch = 0; ch < nch; ++ch) buf[ ch ].set (chs[ ch < chs.length ? ch : 0 ], o);
			for (var i = 0; i < n; ++i) {
				var s = 0;
				for (var k = 0; k < nch; ++k) s += buf[ k ][ o + i ];
				mono[ o + i ] = s * inv;
			}
			bufEnd += n;
			var ndec = Math.floor ((bufEnd - base) / D);
			for (var j = decN; j < ndec; ++j) {
				var q = j * D;
				dec[ j ] = (mono[ q ] + mono[ q + 1 ] + mono[ q + 2 ] + mono[ q + 3 ]) * 0.25;
			}
			decN = ndec;
		}

		function eof () {
			if (eofFlag) return ;
			eofLen = bufEnd;
			var pad = new Float32Array (N + tol + Hs + 8 * D);
			var z = [];
			for (var ch = 0; ch < nch; ++ch) z.push (pad);
			push (z);
			eofFlag = true;
		}

		/* 找最合適的接合位置：粗搜尋（抽取後）＋細搜尋（原解析度） */
		function search ( ca ) {
			var tStart = prevP + Hs - base;
			var j, k;
			for (j = 0; j < L; ++j) {
				var q = tStart + j * D;
				tmplD[ j ] = (mono[ q ] + mono[ q + 1 ] + mono[ q + 2 ] + mono[ q + 3 ]) * 0.25;
			}
			var lo = Math.max (base, ca - tol), hi = ca + tol;
			var j0 = Math.ceil ((lo - base) / D), j1 = Math.floor ((hi - base) / D);
			j1 = Math.min (j1, decN - L);
			if (j1 < j0) return clamp (ca, base, bufEnd - N);
			var e = 0;
			for (k = 0; k < L; ++k) e += dec[ j0 + k ] * dec[ j0 + k ];
			var best = -Infinity, bj = j0;
			for (j = j0; j <= j1; ++j) {
				var dot = 0;
				for (k = 0; k < L; ++k) dot += dec[ j + k ] * tmplD[ k ];
				var sc = dot / Math.sqrt (e + 1e-9);
				/* 同分時偏向離理想位置近的（避免在靜音段亂飄） */
				if (sc > best + 1e-12) { best = sc; bj = j; }
				if (j < j1) {
					var o1 = dec[ j ], n1 = dec[ j + L ];
					e += n1 * n1 - o1 * o1;
					if (e < 0) e = 0;
				}
			}
			var c0 = base + bj * D;
			var rlo = Math.max (lo, c0 - D + 1), rhi = Math.min (hi, c0 + D - 1);
			rhi = Math.min (rhi, bufEnd - N);
			if (rhi < rlo) return clamp (c0, base, bufEnd - N);
			var bestC = c0, bestS = -Infinity;
			for (var c = rlo; c <= rhi; ++c) {
				var dt = 0, en = 0, off = c - base;
				for (k = 0; k < Hs; k += 2) {
					var x = mono[ off + k ];
					dt += x * mono[ tStart + k ];
					en += x * x;
				}
				var s2 = dt / Math.sqrt (en + 1e-9);
				if (s2 > bestS) { bestS = s2; bestC = c; }
			}
			return bestC;
		}

		function emit ( n ) {
			for (var ch = 0; ch < nch; ++ch) {
				var f = fifo[ ch ], ac = acc[ ch ];
				for (var i = 0; i < n; ++i) f[ (wp + i) & FMASK ] = ac[ i ];
				ac.copyWithin (0, n);
				ac.fill (0, N - n);
			}
			wp += n;
		}

		function tryFrame () {
			var ca = Math.round (a);
			if (eofFlag && ca >= eofLen) {
				if (!done) { emit (Hs); done = true; }	/* 把最後一個視窗的下降半段送出去 */
				return false;
			}
			if (!eofFlag && ca + tol + N + 2 * D > bufEnd) return false;
			if (ca < base) ca = base;
			var c = havePrev ? search (ca) : ca;
			var off = c - base;
			for (var ch = 0; ch < nch; ++ch) {
				var b = buf[ ch ], ac = acc[ ch];
				if (!havePrev) {
					/* 第一個視窗前半不加窗：開頭不要淡入 */
					for (var i = 0; i < Hs; ++i) ac[ i ] = b[ off + i ];
					for (i = Hs; i < N; ++i) ac[ i ] += win[ i ] * b[ off + i ];
				} else {
					for (var i2 = 0; i2 < N; ++i2) ac[ i2 ] += win[ i2 ] * b[ off + i2 ];
				}
			}
			emit (Hs);
			prevP = c; havePrev = true; ++frames;
			a += Hs * tempoPrime;
			trim ();
			return true;
		}

		/* 輸出 n 個取樣到 outs（陣列，每個聲道一個 Float32Array）；回傳實際有聲音的取樣數 */
		function render ( outs, n ) {
			var need = Math.ceil (n * step) + 3;
			while (wp - rp < need && !done) { if (!tryFrame ()) break; }
			var avail = wp - rp;
			var ch, i, i0, fr, f, o;
			if (avail >= need) {
				for (ch = 0; ch < outs.length; ++ch) {
					f = fifo[ ch < nch ? ch : 0 ]; o = outs[ ch ];
					var r = rp;
					for (i = 0; i < n; ++i) {
						i0 = Math.floor (r); fr = r - i0;
						o[ i ] = f[ i0 & FMASK ] * (1 - fr) + f[ (i0 + 1) & FMASK ] * fr;
						r += step;
					}
				}
				rp += n * step;
				return n;
			}
			if (done) {
				/* 串流結束：把剩下的送完，其餘補零 */
				var got = 0;
				for (ch = 0; ch < outs.length; ++ch) {
					f = fifo[ ch < nch ? ch : 0 ]; o = outs[ ch ];
					var r2 = rp; got = 0;
					for (i = 0; i < n; ++i) {
						i0 = Math.floor (r2);
						if (i0 + 1 < wp) {
							fr = r2 - i0;
							o[ i ] = f[ i0 & FMASK ] * (1 - fr) + f[ (i0 + 1) & FMASK ] * fr;
							++got;
						} else o[ i ] = 0;
						r2 += step;
					}
				}
				rp += got * step;
				if (got < n) ended = true;
				return got;
			}
			for (ch = 0; ch < outs.length; ++ch) outs[ ch ].fill (0);	/* 資料還沒到：靜音，位置不動 */
			++underruns;
			return 0;
		}

		return {
			push: push, eof: eof, render: render, setParams: setParams,
			info: function () { return { a: a, end: bufEnd, eofLen: eofFlag ? eofLen : -1, ended: ended, done: done, underruns: underruns, frames: frames, Hs: Hs, N: N, tol: tol, tempo: tempo, semis: semis }; }
		};
	}

	var api = { create: create };
	if (typeof module !== 'undefined' && module.exports) module.exports = api;
	root.PKLiveCore = api;

	/* ---------- AudioWorklet 外殼（只有在 AudioWorkletGlobalScope 才有） ---------- */
	if (typeof AudioWorkletProcessor !== 'undefined' && typeof registerProcessor === 'function') {
		class PKLiveProc extends AudioWorkletProcessor {
			constructor ( options ) {
				super ();
				var po = (options && options.processorOptions) || {};
				this.nch = po.nch || 1;
				this.eng = create (po.srcRate || sampleRate, this.nch, { outRate: sampleRate, tempo: po.tempo, semis: po.semis });
				if (po.chs) this.eng.push (po.chs);
				if (po.eof) this.eng.eof ();
				this.dead = false; this.tick = 0; this.fin = false;
				var self = this;
				this.port.onmessage = function ( e ) {
					var m = e.data || {};
					if (m.t === 'c') self.eng.push (m.ch);
					else if (m.t === 'e') self.eng.eof ();
					else if (m.t === 'p') self.eng.setParams (m.tempo, m.semis);
					else if (m.t === 'x') self.dead = true;
				};
			}
			process ( inputs, outputs ) {
				if (this.dead) return false;
				var out = outputs[0];
				if (!out || !out.length) return true;
				this.eng.render (out, out[0].length);
				var inf = this.eng.info ();
				if ((++this.tick & 15) === 0 && !inf.done)
					this.port.postMessage ({ t: 's', a: inf.a, end: inf.end, u: inf.underruns });
				if (inf.ended && !this.fin) { this.fin = true; this.port.postMessage ({ t: 'f' }); return false; }
				return true;
			}
		}
		registerProcessor ('pk-live', PKLiveProc);
	}
})( typeof self !== 'undefined' ? self : this );


