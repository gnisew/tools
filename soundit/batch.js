/* Soundit：批次處理（Batch Process）
 *
 * 一次把多個音訊檔套用同一套處理流程，再用同一種格式匯出，打包成 zip。
 * 概念類似 Adobe Audition 的「批次處理」、Audacity 的「巨集套用到檔案」。
 *
 * 流程（固定順序）：
 *   解碼 → 移除直流偏移 → 高通濾波 → 降噪（RNNoise）→ 參數 EQ 預設 → [新增 5-1] 時間與音高 → 裁切頭尾靜音 → 淡入／淡出 → 峰值正規化
 *        → 轉單聲道／立體聲 → 重新取樣 → 響度正規化（LUFS）→ 編碼 → zip
 *
 * 不動到目前開啟的文件：全程只處理獨立的緩衝區。
 * 編碼直接重用 AudioUtils.DownloadFile（mp3 / wav / flac / opus / aac，含取樣率與 LUFS），
 * 打包重用 zip-store.js，響度分析重用 lufs.js。
 *
 * 入口：PKAudioEditor._deps.batch.open ( app )
 */
(function ( w, d, PKAE ) {
	'use strict';

	var CFG_KEY = 'pk_batch_cfg';

	var DEF = {
		dc: true,		/* 移除直流偏移 */
		hpf: 0,			/* 高通濾波 Hz（0 = 關） */
		dn: 0,			/* [新增] 降噪濕度 %（0 = 關；40 輕度／70 中度／100 完整） */
		eq: '',			/* [新增] EQ 預設：'' = 關；'b:名稱' = 內建；'c:id' = 我的預設 */
		tpt: 100,		/* [新增 5-1] 速度 %（100 = 不變），不改音高 */
		tps: 0,			/* [新增 5-1] 音高（半音，可小數），不改速度 */
		tpq: 'speech',	/* [新增 5-1] 音質：speech 人聲 / mixed 通用 / music 音樂 / perc 打擊 */
		tpf: true,		/* [新增 5-1] 改音高時保留共振峰 */
		tpp: 0,			/* [新增 5-1] 停頓上限（秒，0 = 關）：超過的停頓縮短到這個長度 */
		trim: 0,		/* 裁切靜音門檻 dB（0 = 關），例如 -50 */
		fin: 0,			/* 淡入 毫秒 */
		fout: 0,		/* 淡出 毫秒 */
		ch: 'keep',		/* keep / mono / stereo */
		norm: '',		/* '' | 'peak|-1' | 'lufs|-14|-1' ... */
		fmt: 'mp3',
		q: 192,			/* mp3 / opus / aac 位元率；flac 壓縮等級；wav 位元深度 */
		rate: 0,		/* 0 = 維持（解碼後的取樣率） */
		tpl: '{name}',
		report: true
	};

	var EXT_OK = /\.(mp3|wav|wave|flac|ogg|oga|opus|m4a|aac|weba|webm|aif|aiff|mp4)$/i;

	function lang () {
		var l = '';
		try { l = PKLocale.getLang () || ''; } catch (e) {}
		return /^(zh|kasu|hak)/i.test (l) ? 'zh' : 'en';
	}
	function LT ( zh, en ) { return lang () === 'zh' ? zh : en; }
	function esc ( s ) {
		return String (s).replace (/&/g, '&amp;').replace (/</g, '&lt;').replace (/>/g, '&gt;').replace (/"/g, '&quot;');
	}
	function db ( v ) { return v > 1e-9 ? 20 * Math.log (v) / Math.LN10 : -Infinity; }
	function fmtDb ( v ) { return isFinite (v) ? (Math.round (v * 10) / 10) : '-inf'; }
	function fmtSize ( n ) { return n >= 1048576 ? (n / 1048576).toFixed (1) + ' MB' : Math.max (1, Math.round (n / 1024)) + ' KB'; }
	function pad2 ( n ) { return (n < 10 ? '0' : '') + n; }

	function loadCfg () {
		var o = {}, c = {}, k;
		try { o = JSON.parse (w.localStorage.getItem (CFG_KEY) || '{}') || {}; } catch (e) {}
		for (k in DEF) c[ k ] = o[ k ] !== undefined ? o[ k ] : DEF[ k ];
		return c;
	}
	function saveCfg ( c ) {
		try { w.localStorage.setItem (CFG_KEY, JSON.stringify (c)); } catch (e) {}
	}

	/* ------------------------------------------------------------------ *
	 * 音訊處理（都是對 Float32Array[] 做，不碰目前開啟的文件）
	 * ------------------------------------------------------------------ */

	function peakOf ( ch ) {
		var p = 0, c, i, n, a, v;
		for (c = 0; c < ch.length; ++c) {
			a = ch[ c ]; n = a.length;
			for (i = 0; i < n; ++i) { v = a[ i ]; if (v < 0) v = -v; if (v > p) p = v; }
		}
		return p;
	}

	function removeDC ( ch ) {
		var c, i, n, a, sum, mean;
		for (c = 0; c < ch.length; ++c) {
			a = ch[ c ]; n = a.length; sum = 0;
			for (i = 0; i < n; ++i) sum += a[ i ];
			mean = n ? sum / n : 0;
			if (Math.abs (mean) < 1e-7) continue;
			for (i = 0; i < n; ++i) a[ i ] -= mean;
		}
	}

	/* [修改] 通用濾波器串接：specs = [{type, freq, q, gain}]，用 OfflineAudioContext 渲染。
	 * 原本只有高通濾波；現在高通（兩級 24 dB/oct）與 EQ 預設共用這個函式 */
	function renderFilters ( ch, sr, specs ) {
		var Ctx = w.OfflineAudioContext || w.webkitOfflineAudioContext;
		var len = ch[ 0 ].length, c;
		if (!Ctx || !len || !specs.length) return Promise.resolve ( ch );
		var ctx = new Ctx ( ch.length, len, sr );
		var buf = ctx.createBuffer ( ch.length, len, sr );
		for (c = 0; c < ch.length; ++c) buf.copyToChannel ( ch[ c ], c, 0 );
		var src = ctx.createBufferSource ();
		src.buffer = buf;
		var node = src, f, i, nyq = sr / 2 * 0.99;
		for (i = 0; i < specs.length; ++i) {
			f = ctx.createBiquadFilter ();
			f.type = specs[ i ].type;
			f.frequency.value = Math.min ( specs[ i ].freq, nyq );
			f.Q.value = specs[ i ].q || 1.0;
			f.gain.value = specs[ i ].gain || 0;
			node.connect ( f );
			node = f;
		}
		node.connect ( ctx.destination );
		src.start (0);
		return ctx.startRendering ().then (function ( r ) {
			var out = [];
			for (var k = 0; k < ch.length; ++k) out.push ( new Float32Array ( r.getChannelData ( k ) ) );
			return out;
		});
	}

	function highpass ( ch, sr, hz ) {
		var one = { type: 'highpass', freq: hz, q: 0.7071, gain: 0 };
		return renderFilters ( ch, sr, [ one, one ] );
	}

	/* [新增] 重新取樣（降噪模組固定吃 44.1 kHz） */
	function resample ( ch, from, to ) {
		var Ctx = w.OfflineAudioContext || w.webkitOfflineAudioContext;
		if (from === to || !Ctx) return Promise.resolve ( ch );
		var len = ch[ 0 ].length, c;
		var ctx = new Ctx ( ch.length, Math.max (1, Math.round ( len * to / from )), to );
		var buf = ctx.createBuffer ( ch.length, len, from );
		for (c = 0; c < ch.length; ++c) buf.copyToChannel ( ch[ c ], c, 0 );
		var src = ctx.createBufferSource ();
		src.buffer = buf;
		src.connect ( ctx.destination );
		src.start (0);
		return ctx.startRendering ().then (function ( r ) {
			var out = [];
			for (var k = 0; k < ch.length; ++k) out.push ( new Float32Array ( r.getChannelData ( k ) ) );
			return out;
		});
	}

	/* [新增] 降噪（RNNoise，rnn_denoise.js / .wasm）。
	 * 與「效果 → 降噪」用同一個模組：沒載入就自己載入。 */
	function rnnReady () {
		return !!(w.Module && w.Module.asm && w.Module.asm.malloc && typeof w.wasm_denoise_stream_perf === 'function');
	}
	function loadRnn () {
		return new Promise (function ( ok, fail ) {
			var tries = 0;
			function poll () {
				if (rnnReady ()) { ok (); return ; }
				if (++tries > 80) { fail ( new Error (LT ('降噪模組載入逾時', 'Denoise module timed out')) ); return ; }
				setTimeout ( poll, 250 );
			}
			if (rnnReady ()) { ok (); return ; }
			if (!d.querySelector ('script[src="rnn_denoise.js"]')) {
				var s = d.createElement ('script');
				s.src = 'rnn_denoise.js';
				s.onerror = function () { fail ( new Error (LT ('無法載入降噪模組', 'Cannot load denoise module')) ); };
				d.head.appendChild ( s );
			}
			setTimeout ( poll, 100 );
		});
	}

	/* 單一聲道降噪。輸入先複製進 wasm 記憶體，處理完立刻複製結果並釋放輸入
	 * （內建的 wasm_denoise_stream_perf 不會釋放輸入，批次處理大量檔案時會越吃越多記憶體） */
	function denoiseChannel ( arr ) {
		var M = w.Module, n = arr.length, raw = typeof wasm_rnnDenoise_rawmem === 'function' ? wasm_rnnDenoise_rawmem : null;
		if (!raw || !M._free) return new Float32Array ( w.wasm_denoise_stream_perf ( arr ) );
		var ptr = M._malloc ( n * 4 );
		new Float32Array ( w.wasmMemory.buffer, ptr, n ).set ( arr );
		var outp = raw ( ptr, 44100, 1, n );
		var res = new Float32Array ( w.wasmMemory.buffer, outp, n ).slice ();	/* 先取結果；記憶體可能在呼叫中成長，所以呼叫後才取 buffer */
		M._free ( ptr );
		return res;
	}

	/* mix = 0~1：乾濕比例，讓「輕度／中度」不會把人聲削得太乾 */
	function denoise ( ch, sr, mix ) {
		return loadRnn ().then (function () {
			return resample ( ch, sr, 44100 );
		}).then (function ( x ) {
			var out = [], k = 0;
			function one () {
				if (k >= x.length) return Promise.resolve ( out );
				var dry = x[ k ], wet = denoiseChannel ( dry ), i, n = dry.length;
				if (mix < 1) for (i = 0; i < n; ++i) wet[ i ] = dry[ i ] * (1 - mix) + wet[ i ] * mix;
				out.push ( wet ); ++k;
				return new Promise (function ( r ) { setTimeout ( r, 0 ); }).then ( one );
			}
			return one ();
		}).then (function ( y ) {
			return resample ( y, 44100, sr );
		}).then (function ( z ) {
			var n = ch[ 0 ].length, out = [], c;	/* 來回取樣後長度可能差幾個樣本，統一補齊／截斷 */
			for (c = 0; c < z.length; ++c) {
				if (z[ c ].length === n) out.push ( z[ c ] );
				else { var a = new Float32Array ( n ); a.set ( z[ c ].subarray (0, n) ); out.push ( a ); }
			}
			return out;
		});
	}

	/* [新增] EQ 預設 ------------------------------------------------------
	 * 預設字串格式（與「參數 EQ」相同）：每 5 個一組 → 啟用,類型,增益,頻率,Q
	 * 內建預設是 fx-pg-eq.js 那份的拷貝；我的預設讀 localStorage 'pk_presetfx' 的 paragraphic_eq。 */
	var EQ_BUILTIN = [
		[ 'Old Telephone', '1,highpass,0,5800,5.8,1,lowpass,0,7060,5' ],
		[ 'AM Radio', '1,highpass,0,400,0.8,1,lowpass,0,3500,0.8,1,peaking,4,1500,1' ],
		[ 'Megaphone', '1,highpass,0,700,0.7,1,lowpass,0,4000,0.7,1,peaking,6,2000,2' ],
		[ 'Underwater', '1,lowpass,0,1200,1,1,peaking,3,300,1' ],
		[ 'Lo-Fi / Vintage', '1,highpass,0,80,0.7,1,lowpass,0,7000,0.7,1,peaking,3,200,1,1,peaking,-3,4000,1' ],
		[ 'Bass Boost', '1,peaking,6,60,0.7,1,peaking,3,120,1' ],
		[ 'Vocal Presence', '1,highpass,0,80,0.7,1,peaking,-3,250,1,1,peaking,3,3000,1.2,1,peaking,2,8000,1' ],
		[ 'Loudness (Smile)', '1,peaking,5,80,0.7,1,peaking,-3,1000,1,1,peaking,5,10000,0.7' ],
		[ 'Air / Brilliance', '1,peaking,4,10000,0.7,1,peaking,3,13000,1' ],
		[ 'De-Rumble', '1,highpass,0,80,0.7,1,peaking,-6,50,1' ],
		[ 'Podcast Voice', '1,highpass,0,100,0.7,1,peaking,-2,300,1,1,peaking,2,2500,1.2,1,peaking,2,9000,0.7' ],
		[ 'De-Esser', '1,peaking,-5,6500,3' ],
		[ 'Drum Punch', '1,peaking,4,80,1.2,1,peaking,-3,250,1,1,peaking,3,4000,1.5' ],
		[ 'Acoustic Sparkle', '1,highpass,0,80,0.7,1,peaking,-2,200,1,1,peaking,3,5000,1' ]
	];

	function customEq () {
		var out = [];
		try {
			var o = JSON.parse ( w.localStorage.getItem ('pk_presetfx') || '{}' ) || {};
			(o.paragraphic_eq || []).forEach (function ( p ) {
				if (p && typeof p.val === 'string' && p.val && p.id) out.push ([ p.id, String ( p.name || p.id ), p.val ]);
			});
		} catch (e) {}
		return out;
	}

	function parseEq ( str ) {
		var l = String ( str ).split (','), out = [], j, o;
		for (j = 0; j + 4 < l.length; j += 5) {
			if (!(l[ j ] / 1)) continue;	/* 該頻帶被關閉 */
			o = { type: l[ j + 1 ], gain: l[ j + 2 ] / 1, freq: l[ j + 3 ] / 1, q: l[ j + 4 ] / 1 };
			if (!isFinite ( o.freq ) || o.freq <= 0) continue;
			out.push ( o );
		}
		return out;
	}

	/* 回傳頻帶陣列；找不到預設回傳 null */
	function eqBands ( key ) {
		var m = /^([bc]):(.*)$/.exec ( key || '' ), i, list;
		if (!m) return null;
		if (m[ 1 ] === 'b') {
			for (i = 0; i < EQ_BUILTIN.length; ++i) if (EQ_BUILTIN[ i ][ 0 ] === m[ 2 ]) return parseEq ( EQ_BUILTIN[ i ][ 1 ] );
			return null;
		}
		list = customEq ();
		for (i = 0; i < list.length; ++i) if (list[ i ][ 0 ] === m[ 2 ]) return parseEq ( list[ i ][ 2 ] );
		return null;
	}

	function eqName ( key ) {
		var m = /^([bc]):(.*)$/.exec ( key || '' ), i, list;
		if (!m) return '';
		if (m[ 1 ] === 'b') return presetLabel ( m[ 2 ] );
		list = customEq ();
		for (i = 0; i < list.length; ++i) if (list[ i ][ 0 ] === m[ 2 ]) return list[ i ][ 1 ];
		return m[ 2 ];
	}

	function presetLabel ( name ) {
		try { var s = PKLocale.t ('preset.' + name); if (s && s !== 'preset.' + name) return s; } catch (e) {}
		return name;
	}

	function eqOptions ( cur ) {
		var h = '<option value="">' + LT ('不套用', 'None') + '</option>', cust = customEq ();
		h += '<optgroup label="' + LT ('內建預設', 'Built-in') + '">' + EQ_BUILTIN.map (function ( e ) {
			var v = 'b:' + e[ 0 ];
			return '<option value="' + esc ( v ) + '"' + (v === cur ? ' selected' : '') + '>' + esc ( presetLabel ( e[ 0 ] ) ) + '</option>';
		}).join ('') + '</optgroup>';
		if (cust.length) h += '<optgroup label="' + LT ('我的預設', 'My presets') + '">' + cust.map (function ( e ) {
			var v = 'c:' + e[ 0 ];
			return '<option value="' + esc ( v ) + '"' + (v === cur ? ' selected' : '') + '>' + esc ( e[ 1 ] ) + '</option>';
		}).join ('') + '</optgroup>';
		return h;
	}

	/* 裁切頭尾靜音：兩端各保留 pad 秒。全部低於門檻（整段靜音）就原樣保留並回報 */
	function trimSilence ( ch, sr, thDb, pad ) {
		var thr = Math.pow ( 10, thDb / 20 ), len = ch[ 0 ].length, c, i, first = -1, last = -1, v;
		for (i = 0; i < len && first < 0; ++i)
			for (c = 0; c < ch.length; ++c) { v = ch[ c ][ i ]; if (v > thr || v < -thr) { first = i; break; } }
		if (first < 0) return { ch: ch, note: LT ('整段都是靜音，未裁切', 'All silent, not trimmed') };
		for (i = len - 1; i > first && last < 0; --i)
			for (c = 0; c < ch.length; ++c) { v = ch[ c ][ i ]; if (v > thr || v < -thr) { last = i; break; } }
		if (last < 0) last = first;
		var p = Math.round ( pad * sr );
		var s = Math.max (0, first - p), e = Math.min (len, last + p + 1);
		if (s === 0 && e === len) return { ch: ch, note: '' };
		var out = [];
		for (c = 0; c < ch.length; ++c) out.push ( ch[ c ].slice ( s, e ) );
		return { ch: out, note: LT ('裁掉 ', 'Trimmed ') + ((s + (len - e)) / sr).toFixed (2) + 's' };
	}

	function fades ( ch, sr, inMs, outMs ) {
		var len = ch[ 0 ].length, half = len >> 1, c, i, a;
		var nin = Math.min (half, Math.round (inMs * sr / 1000));
		var nout = Math.min (half, Math.round (outMs * sr / 1000));
		for (c = 0; c < ch.length; ++c) {
			a = ch[ c ];
			for (i = 0; i < nin; ++i) a[ i ] *= i / nin;
			for (i = 0; i < nout; ++i) a[ len - 1 - i ] *= i / nout;
		}
	}

	function peakNormalize ( ch, targetDb ) {
		var p = peakOf ( ch );
		if (p < 1e-9) return false;
		var g = Math.pow ( 10, targetDb / 20 ) / p, c, i, a;
		for (c = 0; c < ch.length; ++c) { a = ch[ c ]; for (i = 0; i < a.length; ++i) a[ i ] *= g; }
		return true;
	}

	function asBuffer ( ch ) {
		return {
			numberOfChannels: ch.length,
			length: ch[ 0 ].length,
			getChannelData: function ( c ) { return ch[ c ]; }
		};
	}

	/* ------------------------------------------------------------------ *
	 * 解碼／編碼
	 * ------------------------------------------------------------------ */

	/* ------------------------------------------------------------------ *
	 * [新增 5-1] 時間與音高：引擎在 timepitch-engine.js（Worker 優先，沒有 Worker 就退回主執行緒）
	 * ------------------------------------------------------------------ */
	function tpOn ( c ) { return Math.abs ( c.tpt - 100 ) > 0.05 || Math.abs ( c.tps ) > 0.001 || c.tpp > 0; }

	/* 設定 → 要依序執行的引擎階段；回傳 { st: [opts…], notes: […] }。
	 * 停頓偵測在主執行緒做（很快），超過 10 分鐘的檔案略過這一步並記在備註 */
	function tpStages ( c, ch, sr ) {
		var st = [], notes = [], PS = w.PKSpeech;
		if (c.tpp > 0) {
			if (!PS) notes.push ( LT ('缺少 timepitch-speech.js，略過停頓縮短', 'timepitch-speech.js missing; pause shortening skipped') );
			else if (ch[ 0 ].length / sr > 600) notes.push ( LT ('超過 10 分鐘，略過停頓縮短', 'Over 10 min; pause shortening skipped') );
			else st.push ({ mode: 'retime', speechTempo: 1, pauseScale: 1, pauseMax: c.tpp, pauses: PS.findPauses ( ch, sr, {} ), speechMode: c.tpq });
		}
		var tempo = Math.max (0.25, Math.min (4, c.tpt / 100)), semis = Math.max (-24, Math.min (24, c.tps));
		if (Math.abs ( tempo - 1 ) > 1e-4 || Math.abs ( semis ) > 1e-4) {
			st.push ({ tempo: tempo, pitch: semis, mode: c.tpq, formant: !!c.tpf && Math.abs ( semis ) > 1e-4, formantShift: 0 });
		}
		return { st: st, notes: notes };
	}

	function tpOne ( ch, sr, opts, onprog ) {
		return new Promise (function ( resolve, reject ) {
			var bufs = ch.map (function ( c ) { return c.slice ().buffer; }), worker = null, fell = false;
			function fallback () {
				if (fell) return ; fell = true;
				setTimeout (function () {
					try {
						if (!w.PKTimePitch) throw new Error ('timepitch-engine.js missing');
						var o = {}, k; for (k in opts) o[ k ] = opts[ k ];
						resolve ( w.PKTimePitch.process ( bufs.map (function ( b ) { return new Float32Array ( b ); }), sr, o ) );
					} catch ( e ) { reject ( e ); }
				}, 10);
			}
			try { worker = new w.Worker ('timepitch-worker.js?v=tp9'); } catch ( e ) { return fallback (); }
			worker.onmessage = function ( e ) {
				var m = e.data || {};
				if (m.progress !== undefined) return onprog && onprog ( m.progress );
				if (m.error) { worker.terminate (); reject ( new Error ( m.error ) ); return ; }
				if (m.done) { worker.terminate (); resolve ( m.buffers.map (function ( b ) { return new Float32Array ( b ); }) ); }
			};
			worker.onerror = function () { try { worker.terminate (); } catch ( e ) {} fallback (); };
			worker.postMessage ({ id: 1, sr: sr, opts: opts, buffers: bufs }, bufs );
		});
	}
	function tpRun ( ch, sr, stages, onprog ) {
		var p = Promise.resolve ( ch );
		stages.forEach (function ( o, i ) {
			p = p.then (function ( x ) {
				return tpOne ( x, sr, o, function ( v ) { onprog && onprog ( ( i + v ) / stages.length ); } );
			});
		});
		return p;
	}
	function tpLabel ( c ) {
		var a = [];
		if (Math.abs ( c.tpt - 100 ) > 0.05) a.push ( LT ('速度 ', 'Speed ') + c.tpt + '%' );
		if (Math.abs ( c.tps ) > 0.001) a.push ( LT ('音高 ', 'Pitch ') + ( c.tps > 0 ? '+' : '' ) + c.tps + LT (' 半音', ' st') + ( c.tpf ? LT ('（保留共振峰）', ' (formant kept)') : '' ) );
		if (c.tpp > 0) a.push ( LT ('停頓上限 ', 'Pause max ') + c.tpp + LT (' 秒', ' s') );
		return a.join ('、');
	}

	function decode ( ctx, file ) {
		return file.arrayBuffer ().then (function ( ab ) {
			return new Promise (function ( ok, fail ) {
				var r = ctx.decodeAudioData ( ab, ok, fail );	/* 舊 Safari 只支援 callback 版 */
				if (r && r.then) r.then ( ok, fail );
			});
		});
	}

	/* 把 Float32Array[] 做成 AudioBuffer，交給 AudioUtils.DownloadFile 編碼 */
	function encode ( app, ctx, ch, sr, name, cfg, onProg ) {
		return new Promise (function ( ok, fail ) {
			var AU = app.engine && app.engine.FXPreviewHost;
			if (!AU || !AU.DownloadFile) { fail ( new Error ('DownloadFile') ); return ; }

			var buf = ctx.createBuffer ( ch.length, Math.max (1, ch[ 0 ].length), sr ), c;
			for (c = 0; c < ch.length; ++c) buf.copyToChannel ( ch[ c ], c, 0 );

			var stereo = cfg.ch === 'stereo' || (cfg.ch === 'keep' && ch.length === 2);
			var kbps = cfg.q, bits = 16;
			if (cfg.fmt === 'wav') { bits = cfg.q; kbps = 0; }
			else if (cfg.fmt === 'flac') kbps = cfg.q;

			var loud = null, np = cfg.norm ? cfg.norm.split ('|') : [];
			if (np[ 0 ] === 'lufs') loud = { target: np[ 1 ] / 1, ceiling: np[ 2 ] / 1 };

			var blob = null, settled = false;
			var ret = AU.DownloadFile ( name, cfg.fmt, kbps, null, stereo, bits, cfg.fmt === 'wav' && bits === 16, function ( val ) {
				if (val !== 'done') { onProg && onProg ( val ); return ; }
				if (settled) return ;
				settled = true;
				blob ? ok ( blob ) : fail ( new Error (LT ('編碼失敗', 'Encode failed')) );
			}, buf, cfg.rate, function ( b ) { blob = b; }, null, loud);

			if (ret === false && !settled) { settled = true; fail ( new Error (LT ('無法編碼這個格式', 'Cannot encode this format')) ); }
		});
	}

	/* ------------------------------------------------------------------ *
	 * 檔名
	 * ------------------------------------------------------------------ */

	function makeName ( tpl, base, n, total, ext, used ) {
		var digits = Math.max (2, String ( total ).length), num = String ( n );
		while (num.length < digits) num = '0' + num;
		tpl = (tpl || '').trim () || '{name}';
		var s = tpl.replace (/\{(name|檔名)\}/g, function () { return base; })
			.replace (/\{(n|序號)\}/g, function () { return num; })
			.replace (/[\\\/:*?"<>|]/g, '_').replace (/^[\s.]+|[\s.]+$/g, '') || base;
		var k = s, i = 1;
		while (used[ (k + ext).toLowerCase () ]) k = s + '_' + (++i);
		used[ (k + ext).toLowerCase () ] = 1;
		return k + ext;
	}

	/* ------------------------------------------------------------------ *
	 * 介面
	 * ------------------------------------------------------------------ */

	var CSS =
		'.pk_bt{min-width:min(460px,80vw);max-width:640px;font-size:12px}' +
		/* 視窗高度：標題與按鈕列固定，中間內容超出畫面時自己捲動（細、淡的捲軸） */
		'.pk_modal.pk_bt_modal{display:flex;flex-direction:column;max-height:calc(100vh - 40px);max-height:calc(100dvh - 40px)}' +
		'.pk_bt_modal .pk_modal_title,.pk_bt_modal .pk_modal_bottom{flex:0 0 auto}' +
		'.pk_bt_modal .pk_modal_main{flex:1 1 auto;min-height:0;overflow-x:hidden;overflow-y:auto;overscroll-behavior:contain;-webkit-overflow-scrolling:touch;scrollbar-width:thin;scrollbar-color:rgba(128,140,150,.35) transparent}' +
		'.pk_bt_modal .pk_modal_main::-webkit-scrollbar{width:6px;height:6px}' +
		'.pk_bt_modal .pk_modal_main::-webkit-scrollbar-track{background:transparent}' +
		'.pk_bt_modal .pk_modal_main::-webkit-scrollbar-thumb{background:rgba(128,140,150,.28);border:0;border-radius:3px}' +
		'.pk_bt_modal .pk_modal_main::-webkit-scrollbar-thumb:hover{background:rgba(128,140,150,.55)}' +
		'@media (max-height:700px){.pk_modal.pk_bt_modal{max-height:calc(100vh - 20px);max-height:calc(100dvh - 20px)}}' +
		'.pk_bt_drop{border:1px dashed var(--bd-h);border-radius:6px;padding:12px;text-align:center;color:var(--fg-1);margin:4px 0 8px;transition:background .15s,border-color .15s}' +
		'.pk_bt_drop.pk_bt_over{background:var(--ac-soft);border-color:var(--ac);color:var(--fg-0)}' +
		'.pk_bt_drop a{color:var(--ac);cursor:pointer;text-decoration:underline}' +
		'.pk_bt_list{max-height:150px;overflow:auto;border:1px solid var(--bd);border-radius:6px;background:var(--bg-1);margin-bottom:4px}' +
		'.pk_bt_list:empty{display:none}' +
		'.pk_bt_it{display:flex;align-items:center;gap:8px;padding:4px 8px;border-bottom:1px solid var(--bd-s)}' +
		'.pk_bt_it:last-child{border:none}' +
		'.pk_bt_it .pk_bt_nm{flex:1;min-width:0;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}' +
		'.pk_bt_it .pk_bt_sz{color:var(--fg-2);font-size:11px;white-space:nowrap}' +
		'.pk_bt_it .pk_bt_st{width:16px;text-align:center;color:var(--fg-2)}' +
		'.pk_bt_it .pk_bt_x{cursor:pointer;color:var(--fg-2)}.pk_bt_it .pk_bt_x:hover{color:var(--rec)}' +
		'.pk_bt_it.pk_bt_run .pk_bt_st{color:var(--ac)}.pk_bt_it.pk_bt_ok .pk_bt_st{color:var(--ok)}' +
		'.pk_bt_it.pk_bt_err .pk_bt_st,.pk_bt_it.pk_bt_err .pk_bt_msg{color:var(--rec)}' +
		'.pk_bt_msg{font-size:10px;color:var(--fg-2);max-width:170px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}' +
		'.pk_bt_sum{color:var(--fg-2);font-size:11px;margin:2px 0 6px}' +
		'.pk_bt_sum:empty{display:none}' +
		'.pk_bt_sec{margin:14px 0 6px;padding-bottom:3px;border-bottom:1px solid var(--bd-s);color:var(--ac-2);font-size:11px;letter-spacing:.06em;text-transform:uppercase}' +
		'.pk_bt_grid{display:grid;grid-template-columns:1fr 1fr;gap:8px 22px;align-items:center}' +
		'.pk_bt_grid>label{display:grid;grid-template-columns:minmax(0,1fr) 150px;align-items:center;gap:8px;margin:0}' +
		'.pk_bt_grid .pk_bt_wide{grid-column:1 / -1}' +
		'.pk_bt_grid select,.pk_bt_grid input[type=number],.pk_bt_grid .pk_txt{width:100%;min-width:0;float:none;margin:0;box-sizing:border-box}' +
		'.pk_bt_chk{display:flex;align-items:center;gap:8px;margin:0;user-select:none;-webkit-user-select:none}' +
		'.pk_bt_chk input[type=checkbox]{accent-color:var(--ac);float:none;margin:0;width:16px;height:16px;flex:none;cursor:pointer}' +
		'@media (max-width:520px){.pk_bt_grid{grid-template-columns:1fr}.pk_bt_grid>label{grid-template-columns:minmax(0,1fr) 140px}}' +
		'.pk_bt_bar{height:6px;border-radius:3px;background:var(--bg-4);overflow:hidden;margin:8px 0 2px;display:none}' +
		'.pk_bt_bar i{display:block;height:100%;width:0;background:var(--ac);transition:width .15s}' +
		'.pk_bt.pk_bt_busy .pk_bt_bar{display:block}' +
		'.pk_bt.pk_bt_busy .pk_bt_cfg,.pk_bt.pk_bt_busy .pk_bt_drop{opacity:.45;pointer-events:none}';

	function injectCss () {
		if (d.getElementById ('pk_bt_css')) return ;
		var s = d.createElement ('style');
		s.id = 'pk_bt_css';
		s.textContent = CSS;
		d.head.appendChild ( s );
	}

	function opts ( list, cur ) {
		return list.map (function ( o ) {
			return '<option value="' + esc ( o[ 0 ] ) + '"' + (String ( o[ 0 ] ) === String ( cur ) ? ' selected' : '') + '>' + esc ( o[ 1 ] ) + '</option>';
		}).join ('');
	}

	function clampNum ( v, a, b, def ) { v = parseFloat ( v ); return isFinite ( v ) ? Math.max ( a, Math.min ( b, v ) ) : def; }

	function body ( c ) {
		var off = LT ('關', 'Off');
		var ms = function ( v ) { return [ v, v ? v + ' ms' : off ]; };
		return '<div class="pk_bt">' +
			'<div class="pk_bt_drop" id="pkbt-drop">' + LT ('把音訊檔拖放到這裡，或', 'Drop audio files here, or ') +
			' <a id="pkbt-pick">' + LT ('選擇檔案…', 'choose files…') + '</a>' +
			'<input type="file" id="pkbt-file" multiple accept="audio/*,.mp3,.wav,.flac,.ogg,.oga,.opus,.m4a,.aac,.weba,.webm,.aif,.aiff" style="display:none"></div>' +
			'<div class="pk_bt_list" id="pkbt-list"></div>' +
			'<div class="pk_bt_sum" id="pkbt-sum"></div>' +
			'<div class="pk_bt_cfg">' +
			'<div class="pk_bt_sec">' + LT ('處理流程（依序套用）', 'Processing chain (in order)') + '</div>' +
			'<div class="pk_bt_grid">' +
			'<div class="pk_bt_wide pk_bt_chk"><input type="checkbox" id="pkbt-dc"' + (c.dc ? ' checked' : '') + '><span>' + LT ('移除直流偏移', 'Remove DC offset') + '</span></div>' +
			'<label>' + LT ('高通濾波', 'High-pass') + '<select id="pkbt-hpf">' + opts ([ [ 0, off ], [ 60, '60 Hz' ], [ 80, '80 Hz' ], [ 100, '100 Hz' ], [ 120, '120 Hz' ] ], c.hpf) + '</select></label>' +
			'<label>' + LT ('降噪', 'Denoise') + '<select id="pkbt-dn" title="' + LT ('RNNoise；比例越低越保留原聲，處理較慢', 'RNNoise; lower mix keeps more of the original. Slower.') + '">' + opts ([ [ 0, off ], [ 40, LT ('輕度（40%）', 'Light (40%)') ], [ 70, LT ('中度（70%）', 'Medium (70%)') ], [ 100, LT ('完整（100%）', 'Full (100%)') ] ], c.dn) + '</select></label>' +
			'<label>' + LT ('EQ 預設', 'EQ preset') + '<select id="pkbt-eq">' + eqOptions ( c.eq ) + '</select></label>' +
			'<label>' + LT ('裁切頭尾靜音', 'Trim silence') + '<select id="pkbt-trim">' + opts ([ [ 0, off ], [ -60, '-60 dB' ], [ -50, '-50 dB' ], [ -40, '-40 dB' ], [ -30, '-30 dB' ] ], c.trim) + '</select></label>' +
			'<label>' + LT ('淡入', 'Fade in') + '<select id="pkbt-fin">' + opts ([ ms (0), ms (10), ms (50), ms (200), ms (500), ms (1000) ], c.fin) + '</select></label>' +
			'<label>' + LT ('淡出', 'Fade out') + '<select id="pkbt-fout">' + opts ([ ms (0), ms (10), ms (50), ms (200), ms (500), ms (1000), ms (3000) ], c.fout) + '</select></label>' +
			'<label>' + LT ('聲道', 'Channels') + '<select id="pkbt-ch">' + opts ([ [ 'keep', LT ('維持原樣', 'Keep') ], [ 'mono', LT ('單聲道', 'Mono') ], [ 'stereo', LT ('立體聲', 'Stereo') ] ], c.ch) + '</select></label>' +
			'<label>' + LT ('音量', 'Level') + '<select id="pkbt-norm">' + opts ([
				[ '', LT ('不調整', 'None') ],
				[ 'peak|-1', LT ('峰值 -1 dBFS', 'Peak -1 dBFS') ],
				[ 'peak|-3', LT ('峰值 -3 dBFS', 'Peak -3 dBFS') ],
				[ 'lufs|-14|-1', 'LUFS -14 (Spotify / YouTube)' ],
				[ 'lufs|-16|-1', 'LUFS -16 (Podcast)' ],
				[ 'lufs|-23|-1', 'LUFS -23 (EBU R128)' ] ], c.norm) + '</select></label>' +
			'</div>' +
			'<div class="pk_bt_sec">' + LT ('時間與音高（接在 EQ 之後）', 'Time & pitch (after EQ)') + '</div>' +
			'<div class="pk_bt_grid">' +
			'<label>' + LT ('速度 %（不變調）', 'Speed % (same pitch)') + '<input class="pk_txt" type="number" id="pkbt-tpt" min="25" max="400" step="0.1" value="' + c.tpt + '"></label>' +
			'<label>' + LT ('音高（半音，不變速）', 'Pitch (semitones, same speed)') + '<input class="pk_txt" type="number" id="pkbt-tps" min="-24" max="24" step="0.1" value="' + c.tps + '"></label>' +
			'<label>' + LT ('音質', 'Quality') + '<select id="pkbt-tpq">' + opts ([ [ 'speech', LT ('人聲／說話', 'Speech') ], [ 'mixed', LT ('通用', 'General') ], [ 'music', LT ('音樂／和聲', 'Music') ], [ 'perc', LT ('打擊樂', 'Percussive') ] ], c.tpq) + '</select></label>' +
			'<label>' + LT ('停頓上限', 'Pause max') + '<select id="pkbt-tpp" title="' + LT ('超過這個長度的停頓縮短到這個長度；只處理能偵測到的靜音', 'Pauses longer than this are shortened to it') + '">' + opts ([ [ 0, off ], [ 0.2, LT ('0.2 秒', '0.2 s') ], [ 0.3, LT ('0.3 秒', '0.3 s') ], [ 0.5, LT ('0.5 秒', '0.5 s') ], [ 1, LT ('1 秒', '1 s') ] ], c.tpp) + '</select></label>' +
			'<div class="pk_bt_wide pk_bt_chk"><input type="checkbox" id="pkbt-tpf"' + (c.tpf ? ' checked' : '') + '><span>' + LT ('改音高時保留共振峰（人聲不變花栗鼠）', 'Keep formants when pitch changes') + '</span></div>' +
			'</div>' +
			'<div class="pk_bt_sec">' + LT ('輸出', 'Output') + '</div>' +
			'<div class="pk_bt_grid">' +
			'<label>' + LT ('格式', 'Format') + '<select id="pkbt-fmt">' + opts ([ [ 'mp3', 'mp3' ], [ 'wav', 'wav' ], [ 'flac', 'flac' ], [ 'opus', 'opus' ], [ 'aac', 'aac' ] ], c.fmt) + '</select></label>' +
			'<label><span id="pkbt-qlbl">' + LT ('品質', 'Quality') + '</span><select id="pkbt-q"></select></label>' +
			'<label>' + LT ('取樣率', 'Sample rate') + '<select id="pkbt-rate">' + opts ([ [ 0, LT ('維持原樣', 'Keep') ], [ 44100, '44.1 kHz' ], [ 48000, '48 kHz' ], [ 96000, '96 kHz' ] ], c.rate) + '</select></label>' +
			'<label title="{name} {n}">' + LT ('檔名範本', 'File name') + '<input class="pk_txt" type="text" id="pkbt-tpl" maxlength="80" value="' + esc ( c.tpl ) + '"></label>' +
			'<div class="pk_bt_wide pk_bt_chk"><input type="checkbox" id="pkbt-rep"' + (c.report ? ' checked' : '') + '><span>' + LT ('一併輸出處理報告（CSV：處理前峰值／響度、長度、狀態）', 'Include a CSV report (original peak / loudness, length, status)') + '</span></div>' +
			'</div></div>' +
			'<div class="pk_bt_bar"><i id="pkbt-bar"></i></div></div>';
	}

	/* 依格式換「品質」選單 */
	function QUAL () { return {
		mp3: [ [ 64, '64 kbps' ], [ 96, '96 kbps' ], [ 128, '128 kbps' ], [ 192, '192 kbps' ], [ 256, '256 kbps' ], [ 320, '320 kbps' ] ],
		opus: [ [ 64, '64 kbps' ], [ 96, '96 kbps' ], [ 128, '128 kbps' ], [ 160, '160 kbps' ], [ 192, '192 kbps' ] ],
		aac: [ [ 96, '96 kbps' ], [ 128, '128 kbps' ], [ 160, '160 kbps' ], [ 192, '192 kbps' ], [ 256, '256 kbps' ] ],
		wav: [ [ 16, '16-bit' ], [ 24, '24-bit' ], [ 32, '32-bit float' ] ],
		flac: [ [ 0, LT ('0（最快）', '0 (fastest)') ], [ 5, LT ('5（預設）', '5 (default)') ], [ 8, LT ('8（最小檔）', '8 (smallest)') ] ]
	}; }
	var QDEF = { mp3: 192, opus: 128, aac: 160, wav: 16, flac: 5 };

	function open ( app ) {
		injectCss ();

		var files = [];			/* { file, state: '' | 'run' | 'ok' | 'err', msg } */
		var busy = false, canceled = false, modal = null;
		var cfg = loadCfg ();
		function $ ( id ) { return d.getElementById ( 'pkbt-' + id ); }

		function listHtml () {
			return files.map (function ( f, i ) {
				var st = f.state === 'run' ? '⚙' : f.state === 'ok' ? '✓' : f.state === 'err' ? '✗' : '·';
				return '<div class="pk_bt_it' + (f.state ? ' pk_bt_' + f.state : '') + '" data-i="' + i + '">' +
					'<span class="pk_bt_st">' + st + '</span>' +
					'<span class="pk_bt_nm" title="' + esc ( f.file.name ) + '">' + esc ( f.file.name ) + '</span>' +
					(f.msg ? '<span class="pk_bt_msg" title="' + esc ( f.msg ) + '">' + esc ( f.msg ) + '</span>' : '') +
					'<span class="pk_bt_sz">' + fmtSize ( f.file.size ) + '</span>' +
					(busy ? '' : '<span class="pk_bt_x" title="' + LT ('移除', 'Remove') + '">✕</span>') + '</div>';
			}).join ('');
		}

		function refresh () {
			if (!modal || !modal.el) return ;
			var list = $('list');
			var keep = list.scrollTop;
			list.innerHTML = listHtml ();
			list.scrollTop = keep;
			var total = 0;
			files.forEach (function ( f ) { total += f.file.size; });
			if (!busy) $('sum').textContent = files.length ? LT (files.length + ' 個檔案，共 ' + fmtSize ( total ), files.length + ' file(s), ' + fmtSize ( total )) : '';
			var go = modal.els.bottom[ 0 ];
			if (go) go.classList.toggle ('pk_inact', busy || !files.length);
		}

		function addFiles ( list ) {
			var skipped = 0, i, f, dup;
			for (i = 0; i < list.length; ++i) {
				f = list[ i ];
				if (!(f.type && /^(audio|video)\//.test ( f.type )) && !EXT_OK.test ( f.name || '' )) { ++skipped; continue; }
				dup = files.some (function ( x ) { return x.file.name === f.name && x.file.size === f.size && x.file.lastModified === f.lastModified; });
				if (!dup) files.push ({ file: f, state: '', msg: '' });
			}
			refresh ();
			if (skipped) OneUp (LT ('已略過 ' + skipped + ' 個不是音訊的檔案', skipped + ' non-audio file(s) skipped'), 1600);
		}

		function syncQuality ( keepVal ) {
			var fmt = $('fmt').value, sel = $('q');
			var cur = keepVal !== undefined ? keepVal : QDEF[ fmt ];
			var list = QUAL ()[ fmt ];
			if (!list.some (function ( o ) { return String ( o[ 0 ] ) === String ( cur ); })) cur = QDEF[ fmt ];
			sel.innerHTML = opts ( list, cur );
			$('qlbl').textContent = fmt === 'wav' ? LT ('位元深度', 'Bit depth') : fmt === 'flac' ? LT ('壓縮等級', 'Compression') : LT ('位元率', 'Bitrate');
			var rate = $('rate');
			rate.options[ 3 ].disabled = fmt === 'mp3' || fmt === 'aac' || fmt === 'opus';
			if (fmt === 'opus') { rate.value = '48000'; rate.disabled = true; }
			else { rate.disabled = false; if (rate.options[ 3 ].disabled && rate.value === '96000') rate.value = '0'; }
		}

		function readCfg () {
			var c = {
				dc: $('dc').checked,
				hpf: $('hpf').value / 1,
				dn: $('dn').value / 1,
				eq: $('eq').value,
				tpt: clampNum ( $('tpt').value, 25, 400, 100 ),
				tps: clampNum ( $('tps').value, -24, 24, 0 ),
				tpq: $('tpq').value,
				tpf: $('tpf').checked,
				tpp: $('tpp').value / 1,
				trim: $('trim').value / 1,
				fin: $('fin').value / 1,
				fout: $('fout').value / 1,
				ch: $('ch').value,
				norm: $('norm').value,
				fmt: $('fmt').value,
				q: $('q').value / 1,
				rate: $('rate').value / 1,
				tpl: $('tpl').value.trim () || '{name}',
				report: $('rep').checked
			};
			return c;
		}

		function setBar ( p ) { var b = $('bar'); if (b) b.style.width = Math.max (0, Math.min (100, p)) + '%'; }

		/* ---- 實際處理 ---- */
		function start () {
			if (busy || !files.length) return ;
			if (!app._deps.zip) { OneUp (LT ('缺少 zip-store.js', 'zip-store.js is missing'), 1800); return ; }
			var c = readCfg ();
			var bands = null;
			if (c.eq) {
				bands = eqBands ( c.eq );
				if (!bands) { OneUp (LT ('找不到這個 EQ 預設，請重新選擇', 'EQ preset not found'), 1800); return ; }
				if (!bands.length) bands = null;	/* 預設裡的頻帶全部關閉 */
			}
			saveCfg ( c );
			var AC = w.AudioContext || w.webkitAudioContext;
			if (!AC) { OneUp (LT ('此瀏覽器不支援 Web Audio', 'Web Audio not supported'), 1800); return ; }

			busy = true; canceled = false;
			modal.el.getElementsByClassName ('pk_bt')[ 0 ].classList.add ('pk_bt_busy');
			files.forEach (function ( f ) { f.state = ''; f.msg = ''; });
			app.fireEvent ('RequestPause');

			var ctx = new AC ();
			var ext = '.' + c.fmt, used = {}, out = [], rows = [], idx = 0, ok_n = 0, t0 = Date.now ();
			var total = files.length;

			function finish ( err ) {
				try { ctx.close && ctx.close (); } catch (e) {}
				busy = false;
				if (!modal || !modal.el) return ;
				modal.el.getElementsByClassName ('pk_bt')[ 0 ].classList.remove ('pk_bt_busy');
				setBar ( 0 );
				refresh ();
				if (err) $('sum').textContent = err;
			}

			function done () {
				if (canceled) { finish (); return ; }
				if (!ok_n) { finish (LT ('沒有成功處理任何檔案', 'No file was processed successfully')); OneUp (LT ('沒有成功處理任何檔案', 'No file was processed successfully'), 1800); return ; }

				if (c.report) {
					var head = [ LT ('原檔名', 'Source'), LT ('輸出檔名', 'Output'), LT ('狀態', 'Status'), LT ('處理前長度(秒)', 'Source length (s)'),
						LT ('取樣率', 'Sample rate'), LT ('聲道', 'Channels'), LT ('處理前峰值(dBFS)', 'Source peak (dBFS)'), LT ('處理前響度(LUFS)', 'Source loudness (LUFS)'), LT ('備註', 'Notes') ];
					var csv = '\ufeff' + [ head ].concat ( rows ).map (function ( r ) {
						return r.map (function ( v ) { v = String ( v === undefined || v === null ? '' : v ); return /[",\r\n]/.test ( v ) ? '"' + v.replace (/"/g, '""') + '"' : v; }).join (',');
					}).join ('\r\n');
					var rn = new Date ();
					out.push ({ name: 'batch-report_' + rn.getFullYear () + pad2 ( rn.getMonth () + 1 ) + pad2 ( rn.getDate () ) + '.csv', blob: new Blob ([ csv ], { type: 'text/csv;charset=utf-8' }) });
				}

				$('sum').textContent = LT ('打包中…', 'Packing…');
				var single = out.length === 1 ? out[ 0 ] : null;
				var pack = single ? Promise.resolve ( single.blob ) : app._deps.zip.build ( out );
				pack.then (function ( blob ) {
					if (canceled) { finish (); return ; }
					var url = (w.URL || w.webkitURL).createObjectURL ( blob );
					var a = d.createElement ('a');
					var st = new Date ();
					a.href = url;
					a.download = single ? single.name : 'soundit-batch_' + st.getFullYear () + pad2 ( st.getMonth () + 1 ) + pad2 ( st.getDate () ) + '-' + pad2 ( st.getHours () ) + pad2 ( st.getMinutes () ) + '.zip';
					a.style.display = 'none';
					d.body.appendChild ( a );
					a.click ();
					setTimeout (function () { (w.URL || w.webkitURL).revokeObjectURL ( url ); a.parentNode && a.parentNode.removeChild ( a ); }, 200);
					var sec = Math.max (1, Math.round ((Date.now () - t0) / 1000));
					finish ();
					var msg = LT ('完成：成功 ' + ok_n + ' / ' + total + ' 個，耗時 ' + sec + ' 秒', 'Done: ' + ok_n + ' / ' + total + ' succeeded in ' + sec + 's');
					if ($('sum')) $('sum').textContent = msg;
					OneUp (msg, 2600);
				}).catch (function ( err ) {
					finish (LT ('打包失敗：', 'Packing failed: ') + (err && err.message ? err.message : ''));
				});
			}

			function next () {
				if (canceled) { finish (); return ; }
				if (idx >= total) { done (); return ; }
				var i = idx++, f = files[ i ], src = f.file;
				var base = (src.name || 'audio').replace (/\.[^.\/\\]+$/, '') || 'audio';
				var row = [ src.name, '', '', '', '', '', '', '', '' ];
				var notes = [];
				f.state = 'run'; f.msg = ''; refresh ();
				$('sum').textContent = LT ('處理中 ', 'Processing ') + (i + 1) + ' / ' + total + '：' + src.name;
				setBar ( i / total * 100 );

				var sr = 0, ch = null;
				decode ( ctx, src ).then (function ( buf ) {
					sr = buf.sampleRate;
					ch = [];
					for (var k = 0; k < Math.min (2, buf.numberOfChannels); ++k) ch.push ( new Float32Array ( buf.getChannelData ( k ) ) );
					row[ 3 ] = buf.duration.toFixed (3); row[ 4 ] = sr; row[ 5 ] = buf.numberOfChannels;
					if (!ch[ 0 ].length) throw new Error (LT ('檔案沒有內容', 'Empty file'));

					if (c.report) {
						row[ 6 ] = fmtDb ( db ( peakOf ( ch ) ) );
						var LU = PKAE._deps.lufs;
						if (LU && LU.analyze) { try { row[ 7 ] = fmtDb ( LU.analyze ( { sampleRate: sr, length: ch[ 0 ].length, numberOfChannels: ch.length, getChannelData: function ( n ) { return ch[ n ]; } } ).lufs ); } catch (e) {} }
					}
					if (c.dc) removeDC ( ch );
					/* [修改] 原本只有高通濾波；現在依序：高通 → 降噪 → EQ */
					var p = Promise.resolve ( ch );
					if (c.hpf) p = p.then (function ( x ) { return highpass ( x, sr, c.hpf ); });
					if (c.dn) p = p.then (function ( x ) { $('sum') && ($('sum').textContent = LT ('降噪中 ', 'Denoising ') + (i + 1) + ' / ' + total + '：' + src.name); return denoise ( x, sr, c.dn / 100 ); });
					if (bands) p = p.then (function ( x ) { return renderFilters ( x, sr, bands ); });
					/* [新增 5-1] 時間與音高 */
					if (tpOn ( c )) p = p.then (function ( x ) {
						var pl = tpStages ( c, x, sr );
						pl.notes.forEach (function ( n ) { notes.push ( n ); });
						if (!pl.st.length) return x;
						$('sum') && ($('sum').textContent = LT ('時間與音高 ', 'Time & pitch ') + (i + 1) + ' / ' + total + '：' + src.name);
						return tpRun ( x, sr, pl.st, function ( v ) { setBar ( (i + v * 0.6) / total * 100 ); } );
					});
					return p;
				}).then (function ( chn ) {
					ch = chn;
					if (bands && !c.norm && peakOf ( ch ) > 1) notes.push ( LT ('EQ 後峰值超過 0 dBFS，可能削波，建議開啟音量調整', 'Peak above 0 dBFS after EQ; consider enabling level') );
					if (c.trim) {
						var r = trimSilence ( ch, sr, c.trim, 0.05 );
						ch = r.ch;
						if (r.note) notes.push ( r.note );
					}
					if (c.fin || c.fout) fades ( ch, sr, c.fin, c.fout );
					var np = c.norm ? c.norm.split ('|') : [];
					if (np[ 0 ] === 'peak' && !peakNormalize ( ch, np[ 1 ] / 1 )) notes.push ( LT ('靜音檔，未調整音量', 'Silent, level unchanged') );
					var name = makeName ( c.tpl, base, i + 1, total, ext, used );
					row[ 1 ] = name;
					return encode ( app, ctx, ch, sr, name, c, function ( v ) { setBar ( (i + v / 100) / total * 100 ); } ).then (function ( blob ) {
						out.push ({ name: name, blob: blob });
					});
				}).then (function () {
					ch = null;
					f.state = 'ok'; f.msg = notes.join ('；'); row[ 2 ] = LT ('成功', 'OK');
					var chain = [];
					if (c.dn) chain.push ( LT ('降噪 ', 'Denoise ') + c.dn + '%' );
					if (bands) chain.push ( 'EQ: ' + eqName ( c.eq ) );
					if (tpOn ( c )) chain.push ( tpLabel ( c ) );
					row[ 8 ] = chain.concat ( notes ).join ('; ');
					++ok_n; rows.push ( row );
					setTimeout ( next, 0 );
				}).catch (function ( err ) {
					ch = null;
					var m = err && err.message ? err.message : LT ('無法解碼', 'Cannot decode');
					f.state = 'err'; f.msg = m; row[ 2 ] = LT ('失敗', 'Failed'); row[ 8 ] = m;
					rows.push ( row );
					setTimeout ( next, 0 );
				});
			}

			refresh ();
			setTimeout ( next, 30 );
		}

		modal = new PKSimpleModal ({
			title: LT ('批次處理', 'Batch Process'),
			clss: 'pk_bigger pk_bt_modal',
			ondestroy: function () {
				canceled = true;
				try { app.engine.FXPreviewHost.DownloadFileCancel (); } catch (e) {}
				app.ui.InteractionHandler.on = false;
				app.ui.KeyHandler.removeCallback ('modalBatch');
				modal = null;
			},
			buttons: [{
				title: LT ('開始處理', 'Start'), clss: 'pk_modal_a_accpt pk_inact',
				callback: function () { start (); }
			}],
			body: body ( cfg ),
			setup: function ( q ) {
				app.fireEvent ('RequestPause');
				app.ui.InteractionHandler.checkAndSet ('modal');
				app.ui.KeyHandler.addCallback ('modalBatch', function () { q.Destroy (); }, [ 27 ]);
				/* Show() 之後才有 DOM，延後綁定事件 */
				setTimeout (function () {
					if (!q.el) return ;
					var drop = $('drop'), input = $('file');
					$('pick').onclick = function () { input.click (); };
					input.onchange = function () { addFiles ( input.files ); input.value = ''; };
					/* 在彈窗內攔下拖放事件，避免被主視窗的「拖放載入」接走 */
					[ 'dragenter', 'dragover', 'dragleave', 'drop' ].forEach (function ( ev ) {
						q.el.addEventListener ( ev, function ( e ) {
							e.preventDefault (); e.stopPropagation ();
							if (busy) return ;
							if (ev === 'dragenter' || ev === 'dragover') drop.classList.add ('pk_bt_over');
							else drop.classList.remove ('pk_bt_over');
							if (ev === 'drop' && e.dataTransfer && e.dataTransfer.files) addFiles ( e.dataTransfer.files );
						}, false);
					});
					$('list').onclick = function ( e ) {
						if (busy || !e.target.classList.contains ('pk_bt_x')) return ;
						var row = e.target.parentNode;
						files.splice ( row.getAttribute ('data-i') / 1, 1 );
						refresh ();
					};
					$('fmt').onchange = function () { syncQuality (); };
					syncQuality ( cfg.q );
					refresh ();
				}, 0);
			}
		});
		modal.Show ();
		return modal;
	}

	PKAE._deps.batch = { open: open, _tp: { on: tpOn, stages: tpStages, run: tpRun, label: tpLabel } };      /* [修改 5-1] 多匯出 _tp 供測試 */

})( window, document, PKAudioEditor );
