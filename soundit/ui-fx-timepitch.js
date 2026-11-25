/* Soundit「時間與音高」對話框（階段 1）
 *
 *  - 速度：倍率／目標長度／目標 BPM 三種輸入方式互相連動
 *  - 音高：半音＋音分，可單獨改音高而不變速度
 *  - 模式：獨立（變速不變調、變調不變速）／連動（磁帶式，與舊的「變速（連同音高）」相同）
 *  - 品質：人聲／打擊（WSOLA，快、瞬態清晰）；音樂／通用（相位聲碼器，和聲與持續音較自然）
 *  - 共振峰：改音高時可保留共振峰（人聲不變花栗鼠），並可另外移動共振峰改變音色
 *  - 預覽：處理選取範圍開頭最多 12 秒並循環播放，可切換「處理後／原音」比對
 *  - 運算在 Worker 進行；Worker 無法使用時（例如 file://）退回主執行緒
 *  - [新增 4-6] 語音／聲調：聲調增強／壓平（以音節為單位）、改用主畫面已編輯的音高輪廓（PSOLA 重合成）、
 *    縮短／拉長停頓、調整語速。處理順序：PSOLA（音高輪廓）→ 重排（語速／停頓）→ 一般伸縮（速度／音高／共振峰）
 *    語速／停頓重排啟用時，速度與音高曲線不作用（曲線的時間軸以原始選取範圍為準，重排後會對不上）
 *
 * 載入方式：index.html 在 PKAudioEditor.init 之後呼叫 PKTimePitchUI.attach ( editor )
 * 對外事件：RequestActionFXUI_TimePitch  可帶 { preset: 'tempo' | 'pitch' | 'tape' }
 */
(function ( w, d ) {
	'use strict';

	var t = function ( k ) { return w.PKLocale ? w.PKLocale.t ( k ) : k; };
	function tf ( key, zh, en ) {
		var s = t ( key );
		if (s && s !== key) return s;
		var lang = '';
		try { lang = w.PKLocale.getLang (); } catch (e) {}
		return lang === 'en' ? en : zh;
	}
	function esc ( s ) { return String ( s ).replace ( /[&<>"]/g, function ( c ) {
		return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[ c ]; } ); }

	var PRESETS = [
		/* 名稱（中, 英）、速度倍率、半音、連動 */
		[ '— 預設 —', '— Presets —', 1, 0, false ],
		[ '慢速練習 75%（不變調）', 'Practice 75% (same pitch)', 0.75, 0, false ],
		[ '慢速練習 50%（不變調）', 'Practice 50% (same pitch)', 0.5, 0, false ],
		[ '加速 125%（不變調）', 'Faster 125% (same pitch)', 1.25, 0, false ],
		[ '加速 150%（不變調）', 'Faster 150% (same pitch)', 1.5, 0, false ],
		[ '升 1 個半音（不變速）', 'Up 1 semitone (same speed)', 1, 1, false ],
		[ '降 1 個半音（不變速）', 'Down 1 semitone (same speed)', 1, -1, false ],
		[ '升高 4 個半音（不變速）', 'Up 4 semitones (same speed)', 1, 4, false ],
		[ '降低 4 個半音（不變速）', 'Down 4 semitones (same speed)', 1, -4, false ],
		[ '升八度', 'Up one octave', 1, 12, false ],
		[ '降八度', 'Down one octave', 1, -12, false ],
		[ 'Nightcore（磁帶 125%）', 'Nightcore (tape 125%)', 1.25, 0, true ],
		[ 'Slowed（磁帶 80%）', 'Slowed (tape 80%)', 0.8, 0, true ],
		/* 人聲：保留共振峰（[5]）並可另外移動共振峰（[6]，半音） */
		[ '人聲升 4 半音（保留音色）', 'Voice up 4 st (keep timbre)', 1, 4, false, true, 0 ],
		[ '人聲降 4 半音（保留音色）', 'Voice down 4 st (keep timbre)', 1, -4, false, true, 0 ],
		[ '聲音變年輕（音高 +3、共振峰 +3）', 'Younger voice (pitch +3, formant +3)', 1, 3, false, true, 3 ],
		[ '聲音變成熟（音高 −3、共振峰 −3）', 'Deeper voice (pitch −3, formant −3)', 1, -3, false, true, -3 ],
		[ '只改音色（共振峰 +4，音高不變）', 'Timbre only (formant +4, same pitch)', 1, 0, false, true, 4 ],
		[ '只改音色（共振峰 −4，音高不變）', 'Timbre only (formant −4, same pitch)', 1, 0, false, true, -4 ],
		/* [新增 4-6] 語音：[7] 聲調 'enhance'|'flatten'|'none'、[8] 強度、[9] 語速倍率、[10] 停頓倍率、[11] 停頓上限（秒） */
		[ '聲調增強（音節，+50%）', 'Tone enhance (syllable, +50%)', 1, 0, false, false, 0, 'enhance', 0.5, 1, 1, 0 ],
		[ '聲調壓平（音節，70%）', 'Tone flatten (syllable, 70%)', 1, 0, false, false, 0, 'flatten', 0.7, 1, 1, 0 ],
		[ '縮短停頓（上限 0.3 秒）', 'Shorten pauses (max 0.3 s)', 1, 0, false, false, 0, 'none', 0, 1, 1, 0.3 ],
		[ '語速加快 20%（停頓不變）', 'Speak 20% faster (pauses kept)', 1, 0, false, false, 0, 'none', 0, 1.2, 1, 0 ],
		[ '語速加快 20%、停頓減半', 'Speak 20% faster, pauses halved', 1, 0, false, false, 0, 'none', 0, 1.2, 0.5, 0 ]
	];

	/* [新增 4-6] 語音／聲調的預設值與判斷（純函式，可在 Node 測試） */
	function spDefaults () { return { tone: 'none', toneAmt: 1, toneScope: 'syllable', useView: false, sTempo: 1, pScale: 1, pMax: 0, pSrc: 'auto' }; }
	function retimeOn ( S ) { return Math.abs ( S.sTempo - 1 ) > 1e-3 || Math.abs ( S.pScale - 1 ) > 1e-3 || S.pMax > 0; }
	function toneReq ( S ) { return !S.link && ( S.useView || ( S.tone !== 'none' && S.toneAmt > 0 ) ); }

	/* 把目前狀態排成「要依序執行的引擎階段」。
	 *   P.S      狀態；P.co 曲線選項（curveOpts 的結果）；P.sp 語音資料 { f0, f0Target, base, pauses }；P.shift 片段起點相對選取起點的秒數
	 *   P.dur    這段音訊的長度（秒），用來裁切停頓清單
	 * 回傳 opts 陣列（可能為空 = 不需處理） */
	function planStages ( P ) {
		var S = P.S, co = P.co || {}, sp = P.sp || {}, shift = P.shift || 0, st = [];
		var ret = retimeOn ( S );
		if (ret) co = {};
		var tone = toneReq ( S ) && !!sp.f0Target;
		var semis = S.link || co.pitchCurve ? 0 : S.semis;

		if (tone) st.push ({ mode: 'psola', pitch: semis, tempo: 1, f0: sp.f0, f0Target: sp.f0Target, trackOffset: ( sp.base || 0 ) + shift });
		if (ret) {
			var ps = [], list = sp.pauses || [], dur = P.dur || 0;
			for (var i = 0; i < list.length; ++i) {
				var a = list[i].a - shift, b = list[i].b - shift;
				if (b <= 0 || ( dur && a >= dur )) continue;
				a = Math.max ( 0, a ); if (dur) b = Math.min ( dur, b );
				if (b - a >= 0.03) ps.push ({ a: a, b: b, head: !!list[i].head, tail: !!list[i].tail });
			}
			st.push ({ mode: 'retime', speechTempo: S.sTempo, pauseScale: S.pScale, pauseMax: S.pMax > 0 ? S.pMax : 0, pauses: ps, speechMode: S.mode });
		}
		var o = { tempo: co.tempoCurve ? 1 : S.tempo, pitch: tone ? 0 : semis, link: S.link, mode: S.mode,
			formant: !S.link && S.formant, formantShift: S.fshift };
		if (co.tempoCurve) o.tempoCurve = co.tempoCurve;
		if (co.pitchCurve) o.pitchCurve = co.pitchCurve;
		var need = !!( co.tempoCurve || co.pitchCurve ) || Math.abs ( S.tempo - 1 ) > 1e-4 ||
			( !S.link && ( ( !tone && Math.abs ( semis ) >= 1e-4 ) || ( S.formant && Math.abs ( S.fshift ) > 1e-3 ) ) );
		if (need) st.push ( o );
		return st;
	}

	/* 曲線預設（3-4）：[ 中文, 英文, 速度曲線點, 音高曲線點, 連動 ]
	 * 點 = [ x（0~1，佔選取範圍的比例）, 值 ]；速度值為倍率，音高值為半音。
	 * 'tail' / 'head' 表示「最後／最前 2 秒（最多佔 40%）」，由程式換算成比例。 */
	var CURVE_PRESETS = [
		[ '— 曲線預設 —', '— Curve presets —', null, null, false ],
		[ '漸快（80% → 125%）', 'Accelerando (80% → 125%)', [[0, 0.8], [1, 1.25]], null, false ],
		[ '漸慢（100% → 60%）', 'Ritardando (100% → 60%)', [[0, 1], [1, 0.6]], null, false ],
		[ '搖擺速度（±10%）', 'Wavering tempo (±10%)', [[0, 1], [0.25, 1.1], [0.5, 0.9], [0.75, 1.1], [1, 1]], null, false ],
		[ '磁帶停止（結尾減速）', 'Tape stop (slow down at end)', [[0, 1], ['tail', 1], [1, 0.25]], null, true ],
		[ '磁帶啟動（開頭加速）', 'Tape start (speed up at start)', [[0, 0.25], ['head', 1], [1, 1]], null, true ],
		[ '音高滑升（+12 半音）', 'Pitch glide up (+12 st)', null, [[0, 0], [1, 12]], false ],
		[ '音高滑降（−12 半音）', 'Pitch glide down (−12 st)', null, [[0, 0], [1, -12]], false ],
		[ '音高拱形（中間 +5 半音）', 'Pitch arch (+5 st in the middle)', null, [[0, 0], [0.5, 5], [1, 0]], false ],
		[ '後半轉調（+2 半音）', 'Key change at halfway (+2 st)', null, [[0, 0], ['mid-', 0], ['mid+', 2], [1, 2]], false ],
		[ '清除所有曲線', 'Clear all curves', 'clear', 'clear', false ]
	];

	/* ---------- 運算執行器：Worker 優先，失敗退回主執行緒 ---------- */
	var jobSeq = 0;
	function runJob ( chans, sr, opts, onprog ) {
		var id = ++jobSeq, worker = null, dead = false, timer = 0;
		var job = { id: id };

		job.promise = new Promise ( function ( resolve, reject ) {
			var bufs = chans.map ( function ( c ) { return c.slice ().buffer; } );

			function fallback () {
				if (dead) return ;
				if (!w.PKTimePitch) return reject ( new Error ('engine missing') );
				timer = setTimeout ( function () {
					try {
						var o = opts, copy = {};
						for (var k in o) copy[k] = o[k];
						resolve ( w.PKTimePitch.process ( bufs.map ( function ( b ) { return new Float32Array ( b ); } ), sr, copy ) );
					} catch ( e ) { reject ( e ); }
				}, 20 );
			}

			try {
				worker = new Worker ('timepitch-worker.js?v=tp9');
			} catch ( e ) { return fallback (); }

			worker.onmessage = function ( e ) {
				var m = e.data || {};
				if (m.id !== id || dead) return ;
				if (m.progress !== undefined) return onprog && onprog ( m.progress );
				if (m.error) { worker.terminate (); worker = null; return reject ( new Error ( m.error ) ); }
				if (m.done) {
					worker.terminate (); worker = null;
					resolve ( m.buffers.map ( function ( b ) { return new Float32Array ( b ); } ) );
				}
			};
			worker.onerror = function () {
				if (worker) { worker.terminate (); worker = null; }
				fallback ();
			};
			var o2 = {};
			for (var k in opts) if (typeof opts[k] !== 'function') o2[k] = opts[k];
			worker.postMessage ({ id: id, sr: sr, opts: o2, buffers: bufs }, bufs );
		});

		job.cancel = function () {
			dead = true;
			clearTimeout ( timer );
			if (worker) { worker.terminate (); worker = null; }
		};
		return job;
	}

	/* [新增 4-6] 依序執行多個階段（每階段各用一個 Worker）；介面和 runJob 相同（promise / cancel） */
	function runChain ( chans, sr, stages, onprog ) {
		var cancelled = false, cur = null, ch = {};
		ch.promise = new Promise ( function ( resolve, reject ) {
			var i = 0, data = chans;
			( function next () {
				if (cancelled) return ;
				if (i >= stages.length) return resolve ( data );
				cur = runJob ( data, sr, stages[i], function ( p ) { onprog && onprog ( ( i + p ) / stages.length ); } );
				cur.promise.then ( function ( out ) { data = out; ++i; next (); }, reject );
			})();
		});
		ch.cancel = function () { cancelled = true; cur && cur.cancel (); };
		return ch;
	}

	function attach ( app ) {
		if (!app || app._tpAttached) return ;
		app._tpAttached = true;

		var modal_name = 'modalfx';
		var modal_esc_key = modal_name + 'tpesc';

		function util () { return app.engine && app.engine.FXPreviewHost; }
		function wv () { return app.engine && app.engine.wavesurfer; }

		app.listenFor ('RequestActionFXUI_TimePitch', function ( arg ) {
			var wavesurfer = wv (), AU = util ();
			var mt = app.multitrack;
			if (mt && mt.IsOn && mt.IsOn ()) return OneUp ( tf ('tp.single_only', '「時間與音高」目前僅支援單軌編輯', 'Time & Pitch currently supports single-track editing only'), 1800 );
			if (!wavesurfer || !wavesurfer.backend || !wavesurfer.backend.buffer || !AU) return OneUp ( tf ('uifx.load_first', '請先載入音訊', 'Load audio first'), 1200 );

			app.fireEvent ('RequestPause');

			var buf0 = wavesurfer.backend.buffer;
			var sr = buf0.sampleRate;
			var region = wavesurfer.regions.list[0];
			var selStart = region ? region.start : 0;
			var selDur = region ? region.end - region.start : buf0.duration;
			if (!(selDur > 0.01)) return OneUp ( tf ('tp.too_short', '選取範圍太短', 'Selection too short'), 1200 );

			/* ---------- 狀態 ---------- */
			var S = { tempo: 1, semis: 0, link: false, mode: 'speech', formant: false, fshift: 0 };
			var SD = spDefaults (); for (var sk in SD) S[sk] = SD[sk];      /* [新增 4-6] */
			var SP = { track: null, syl: null, pauses: null, pSrc: null, seg: null, busy: false };
			var busy = null, pv = null, pvTimer = 0, pvToken = 0, ab = 'fx', ctx = null, src = null;
			var el = {};

			if (arg && arg.preset === 'tape') S.link = true;

			function effSemis () { return S.link ? 12 * Math.log ( S.tempo ) / Math.LN2 : S.semis; }
			function fmtT ( s ) {
				var m = (s / 60) >> 0, x = s - m * 60;
				return (m ? m + ':' : '') + (m && x < 10 ? '0' : '') + x.toFixed ( 2 );
			}

			/* ---------- 介面 ---------- */
			var presetOpts = PRESETS.map ( function ( p, i ) {
				return '<option value="' + i + '">' + esc ( tf ('tp.pre' + i, p[0], p[1]) ) + '</option>';
			}).join ('');

			var curvePresetOpts = CURVE_PRESETS.map ( function ( p, i ) {
				return '<option value="' + i + '">' + esc ( tf ('tp.cpre' + i, p[0], p[1]) ) + '</option>';
			}).join ('');

			var row = 'class="pk_row" style="border:none;display:flex;align-items:center;gap:8px;flex-wrap:wrap"';
			var lab = 'style="min-width:92px"';
			var num = 'style="width:74px"';
			var body =
				'<div ' + row + '><label ' + lab + '>' + tf ('tp.mode', '模式', 'Mode') + '</label>' +
					'<select data-k="link"><option value="0">' + tf ('tp.m_indep', '獨立：變速不變調／變調不變速', 'Independent: speed and pitch separate') + '</option>' +
					'<option value="1">' + tf ('tp.m_tape', '連動：磁帶式（速度與音高同時變）', 'Linked: tape style (speed and pitch together)') + '</option></select></div>' +

				'<div ' + row + '><label ' + lab + '>' + tf ('tp.quality', '音質', 'Quality') + '</label>' +
					'<select data-k="mode"><option value="speech">' + tf ('tp.q_speech', '人聲／說話', 'Speech / vocals') + '</option>' +
					'<option value="mixed">' + tf ('tp.q_mixed', '通用（相位聲碼器）', 'General (phase vocoder)') + '</option>' +
					'<option value="music">' + tf ('tp.q_music', '音樂／和聲（相位聲碼器，長窗）', 'Music / harmony (phase vocoder, long)') + '</option>' +
					'<option value="perc">' + tf ('tp.q_perc', '打擊樂／節奏', 'Percussive / rhythmic') + '</option></select>' +
					'<select data-k="preset" style="margin-left:auto">' + presetOpts + '</select></div>' +

				'<div ' + row + '><label ' + lab + '>' + tf ('tp.speed', '速度', 'Speed') + '</label>' +
					'<input type="range" class="pk_horiz" data-k="tempo_r" id="pk_tp_tempo" min="-1.386" max="1.386" step="0.001" value="0" style="flex:1;min-width:120px">' +
					'<input type="number" data-k="tempo_n" min="25" max="400" step="0.1" value="100" ' + num + '>%</div>' +

				'<div ' + row + '><label ' + lab + '>' + tf ('tp.length', '目標長度', 'Target length') + '</label>' +
					'<input type="number" data-k="len_n" min="0.05" step="0.01" ' + num + '>' + tf ('tp.sec', '秒', 'sec') +
					'<span class="pk_val" data-k="len_info" style="margin-left:6px"></span></div>' +

				'<div ' + row + '><label ' + lab + '>BPM</label>' +
					'<input type="number" data-k="bpm_from" min="20" max="400" step="0.1" placeholder="' + tf ('tp.bpm_now', '目前', 'now') + '" ' + num + '> →' +
					'<input type="number" data-k="bpm_to" min="20" max="400" step="0.1" placeholder="' + tf ('tp.bpm_target', '目標', 'target') + '" ' + num + '>' +
					'<a class="pk_modal_a_bottom" data-k="bpm_detect" style="float:none;display:inline-block">' + tf ('tp.detect', '偵測', 'Detect') + '</a>' +
					'<span class="pk_val" data-k="bpm_info"></span></div>' +

				'<div ' + row + '><label ' + lab + '>' + tf ('tp.key', '調性', 'Key') + '</label>' +
					'<select data-k="key_from" style="width:84px"></select> →' +
					'<select data-k="key_to" style="width:84px"></select>' +
					'<a class="pk_modal_a_bottom" data-k="key_detect" style="float:none;display:inline-block">' + tf ('tp.detect', '偵測', 'Detect') + '</a>' +
					'<span class="pk_val" data-k="key_info"></span></div>' +

				'<div ' + row + '><label ' + lab + '>' + tf ('tp.pitch', '音高（半音）', 'Pitch (semitones)') + '</label>' +
					'<input type="range" class="pk_horiz" data-k="semi_r" id="pk_tp_semi" min="-12" max="12" step="1" value="0" style="flex:1;min-width:120px">' +
					'<input type="number" data-k="semi_n" min="-24" max="24" step="1" value="0" ' + num + '></div>' +

				'<div ' + row + '><label ' + lab + '>' + tf ('tp.cents', '微調（音分）', 'Fine (cents)') + '</label>' +
					'<input type="range" class="pk_horiz" data-k="cent_r" min="-100" max="100" step="1" value="0" style="flex:1;min-width:120px">' +
					'<input type="number" data-k="cent_n" min="-100" max="100" step="1" value="0" ' + num + '></div>' +

				'<div ' + row + '><label ' + lab + '>' + tf ('tp.formant', '共振峰', 'Formant') + '</label>' +
					'<label style="min-width:0"><input type="checkbox" data-k="fm_on"> ' + tf ('tp.fm_keep', '保留／調整音色', 'Preserve / adjust timbre') + '</label></div>' +

				'<div ' + row + '><label ' + lab + '>' + tf ('tp.fm_shift', '共振峰位移', 'Formant shift') + '</label>' +
					'<input type="range" class="pk_horiz" data-k="fm_r" min="-12" max="12" step="0.5" value="0" style="flex:1;min-width:120px">' +
					'<input type="number" data-k="fm_n" min="-12" max="12" step="0.5" value="0" ' + num + '></div>' +

				/* [新增 4-6] 語音／聲調 */
				'<div ' + row + '><label ' + lab + '><b>' + tf ('tp.sp_title', '語音／聲調', 'Speech / tone') + '</b></label>' +
					'<a class="pk_modal_a_bottom" data-k="sp_analyze" style="float:none;display:inline-block">' + tf ('tp.sp_analyze', '分析語速', 'Analyze') + '</a>' +
					'<span class="pk_val" data-k="sp_info"></span></div>' +

				'<div ' + row + '><label ' + lab + '>' + tf ('tp.tone', '聲調', 'Tone') + '</label>' +
					'<select data-k="tone"><option value="none">' + tf ('tp.tone_none', '不變', 'Unchanged') + '</option>' +
					'<option value="enhance">' + tf ('tp.tone_enh', '增強（起伏放大）', 'Enhance (exaggerate)') + '</option>' +
					'<option value="flatten">' + tf ('tp.tone_flat', '壓平（起伏縮小）', 'Flatten (reduce)') + '</option></select>' +
					'<select data-k="tone_scope"><option value="syllable">' + tf ('tp.sc_syl', '依音節', 'Per syllable') + '</option>' +
					'<option value="phrase">' + tf ('tp.sc_phrase', '依整句', 'Per phrase') + '</option></select></div>' +

				'<div ' + row + '><label ' + lab + '>' + tf ('tp.tone_amt', '強度', 'Amount') + '</label>' +
					'<input type="range" class="pk_horiz" data-k="tone_r" min="0" max="200" step="1" value="100" style="flex:1;min-width:120px">' +
					'<input type="number" data-k="tone_n" min="0" max="200" step="1" value="100" ' + num + '>%</div>' +

				'<div ' + row + '><label ' + lab + '>' + tf ('tp.view', '音高輪廓', 'Pitch contour') + '</label>' +
					'<label style="min-width:0"><input type="checkbox" data-k="use_view"> ' + tf ('tp.use_view', '改用主畫面已編輯的輪廓', 'Use the contour edited in the main view') + '</label>' +
					'<span class="pk_val" data-k="view_info"></span></div>' +

				'<div ' + row + '><label ' + lab + '>' + tf ('tp.sp_rate', '語速', 'Speech rate') + '</label>' +
					'<input type="number" data-k="sp_tempo" min="25" max="400" step="1" value="100" ' + num + '>%' +
					'<input type="number" data-k="sp_rate_to" min="0.5" max="20" step="0.1" placeholder="' + tf ('tp.sp_rate_target', '目標', 'target') + '" ' + num + '>' + tf ('tp.sp_unit', '音節/秒', 'syl/s') + '</div>' +

				'<div ' + row + '><label ' + lab + '>' + tf ('tp.sp_pause', '停頓', 'Pauses') + '</label>' +
					'<input type="number" data-k="sp_pscale" min="0" max="400" step="5" value="100" ' + num + '>%' +
					'<span>' + tf ('tp.sp_pmax', '上限', 'max') + '</span>' +
					'<input type="number" data-k="sp_pmax" min="0" max="10" step="0.05" value="0" ' + num + '>' + tf ('tp.sec', '秒', 'sec') +
					'<select data-k="sp_psrc" style="margin-left:auto"><option value="auto">' + tf ('tp.src_auto', '自動偵測', 'Auto-detect') + '</option>' +
					'<option value="marker">' + tf ('tp.src_marker', '依標記', 'From markers') + '</option></select></div>' +

				'<div data-k="cur_row" ' + row + '><label ' + lab + '>' + tf ('tp.curve', '曲線', 'Curves') + '</label>' +
					'<a class="pk_modal_a_bottom" data-k="cur_tempo" style="float:none;display:inline-block">' + tf ('tp.cur_tempo', '速度曲線', 'Speed curve') + '</a>' +
					'<a class="pk_modal_a_bottom" data-k="cur_pitch" style="float:none;display:inline-block">' + tf ('tp.cur_pitch', '音高曲線', 'Pitch curve') + '</a>' +
					'<a class="pk_modal_a_bottom" data-k="cur_clear" style="float:none;display:inline-block">' + tf ('tp.cur_clear', '清除此曲線', 'Clear this curve') + '</a>' +
					'<select data-k="cur_preset" style="margin-left:auto">' + curvePresetOpts + '</select></div>' +
				'<div class="pk_row" style="border:none;position:relative" data-k="cur_box"><span class="pk_val" data-k="cur_hint"></span><br></div>' +

				'<div class="pk_row" style="border:none;display:flex;align-items:center;gap:8px;flex-wrap:wrap">' +
					'<label>' + tf ('tp.pv_from', '試聽起點', 'Preview from') + '</label>' +
					'<input type="number" data-k="pv_from" min="0" step="0.5" value="0" ' + num + '>' + tf ('tp.sec', '秒', 'sec') +
					'<a class="pk_modal_a_bottom" data-k="pv_play" style="float:none;display:inline-block">▶ ' + tf ('tp.preview', '試聽', 'Preview') + '</a>' +
					'<a class="pk_modal_a_bottom" data-k="pv_ab" style="float:none;display:inline-block">' + tf ('tp.ab_fx', '處理後', 'Processed') + '</a>' +
					'<span class="pk_val" data-k="status" style="opacity:.8"></span></div>' +

				'<div class="pk_row" style="border:none"><span class="pk_val" data-k="info"></span></div>';

			var x = new w.PKAudioFXModal ({
				id: 'timepitch',
				title: tf ('tp.title', '時間與音高', 'Time & Pitch'),
				ondestroy: function () {
					stopPreview (); clearTimeout ( pvTimer );
					if (busy) busy.cancel ();
					if (ctx) { try { ctx.close (); } catch ( e ) {} ctx = null; }
					app.ui.InteractionHandler.on = false;
					app.ui.KeyHandler.removeCallback ( modal_esc_key );
				},
				buttons: [{
					title: tf ('tp.apply', '套用', 'Apply'),
					clss: 'pk_modal_a_accpt',
					callback: function ( q ) { apply ( q ); }
				}],
				body: body,
				setup: function ( q ) {
					app.ui.InteractionHandler.checkAndSet ( modal_name );
					app.ui.KeyHandler.addCallback ( modal_esc_key, function () {
						if (!app.ui.InteractionHandler.check ( modal_name )) return ;
						q.Destroy ();
					}, [27] );
				}
			}, app );
			x.Show ();

			var all = x.el_body.querySelectorAll ('[data-k]');
			for (var i = 0; i < all.length; ++i) el[ all[i].getAttribute ('data-k') ] = all[i];

			/* ---------- 同步顯示 ---------- */
			function sync ( skip ) {
				var tempo = S.tempo, semis = S.link ? 0 : S.semis;
				var set = function ( k, v ) { if (k !== skip && el[k]) el[k].value = v; };
				set ('tempo_r', Math.log ( tempo ).toFixed ( 4 ));
				set ('tempo_n', (tempo * 100).toFixed ( 1 ).replace ( /\.0$/, '' ));
				set ('len_n', lenNow ( tempo ).toFixed ( 3 ));
				var whole = Math.round ( semis ), cents = Math.round ( ( semis - whole ) * 100 );
				set ('semi_r', clampN ( whole, -12, 12 ));
				set ('semi_n', whole);
				set ('cent_r', cents);
				set ('cent_n', cents);
				if (el.bpm_from.value && skip !== 'bpm_to') {
					el.bpm_to.value = ( parseFloat ( el.bpm_from.value ) * tempo ).toFixed ( 1 ).replace ( /\.0$/, '' );
				}
				el.link.value = S.link ? '1' : '0';
				el.mode.value = S.mode;
				spSync ( skip );      /* [新增 4-6] */

				el.fm_on.checked = S.formant;
				set ('fm_r', S.fshift);
				set ('fm_n', S.fshift);
				var dis = S.link;
				el.semi_r.disabled = el.semi_n.disabled = el.cent_r.disabled = el.cent_n.disabled = dis;
				el.mode.disabled = dis;
				el.fm_on.disabled = dis;
				el.fm_r.disabled = el.fm_n.disabled = dis || !S.formant;
				el.len_info.textContent = fmtT ( selDur ) + ' → ' + fmtT ( lenNow ( tempo ) );
				var es = effSemis ();
				el.info.textContent = tf ('tp.info', '音高變化', 'Pitch change') + ': ' + (es >= 0 ? '+' : '') + es.toFixed ( 2 ) +
					' ' + tf ('tp.semi', '半音', 'semitones') + '  (×' + Math.pow ( 2, es / 12 ).toFixed ( 4 ) + ')';
				curveSync ();
			}
			function clampN ( v, a, b ) { return v < a ? a : v > b ? b : v; }
			function setTempo ( v, skip ) {
				if (!(v > 0)) return ;
				S.tempo = clampN ( v, 0.25, 4 );
				sync ( skip );
				changed ();
			}
			function setSemis ( v, skip ) {
				if (skip) el.key_info.textContent = '';
				S.semis = clampN ( v, -24, 24 );
				sync ( skip );
				changed ();
			}

			/* ---------- 事件 ---------- */
			el.link.onchange = function () { S.link = this.value === '1'; sync (); changed (); };
			el.mode.onchange = function () { S.mode = this.value; changed (); };
			el.preset.onchange = function () {
				var p = PRESETS[ this.value / 1 ];
				this.value = '0';
				if (!p || p[2] === 1 && p[3] === 0 && !p[4] && !p[5] && p[7] === undefined) return ;
				S.link = !!p[4]; S.tempo = p[2]; S.semis = p[3];
				S.formant = !!p[5]; S.fshift = p[6] || 0;
				/* [新增 4-6] 語音欄位：沒指定的一律回到預設，和共振峰的做法一致 */
				S.tone = p[7] || 'none'; S.toneAmt = p[8] !== undefined ? p[8] : 1; S.useView = false;
				S.sTempo = p[9] || 1; S.pScale = p[10] !== undefined ? p[10] : 1; S.pMax = p[11] || 0;
				sync (); changed ();
			};
			el.tempo_r.oninput = function () { setTempo ( Math.exp ( this.value / 1 ), 'tempo_r' ); };
			el.tempo_n.onchange = el.tempo_n.oninput = function () { setTempo ( this.value / 100, 'tempo_n' ); };
			el.len_n.onchange = function () { var v = this.value / 1; if (v > 0) setTempo ( selDur / v ); };
			el.bpm_from.oninput = function () { sync (); };
			el.bpm_from.onchange = function () { if (el.bpm_to.value) el.bpm_to.onchange (); };
			el.bpm_to.onchange = function () {
				var f = el.bpm_from.value / 1, to = this.value / 1;
				if (!(f > 0 && to > 0)) return ;
				var a = w.PKTPAnalyze ? w.PKTPAnalyze.alignTempo ( f, to ) : { tempo: to / f, note: '' };
				el.bpm_info.textContent = a.folded === 2 ? tf ('tp.bpm_fold2', '偵測值可能只有實際的一半，已以 2 倍對齊', 'Detected BPM may be half the real one; aligned at 2×') :
					a.folded === 0.5 ? tf ('tp.bpm_fold05', '偵測值可能是實際的兩倍，已以 1/2 對齊', 'Detected BPM may be double the real one; aligned at 1/2×') : '';
				setTempo ( a.tempo, 'bpm_to' );
			};
			el.semi_r.oninput = el.semi_n.onchange = function () {
				var cents = el.cent_n.value / 1 || 0;
				setSemis ( (this.value / 1 || 0) + cents / 100, this.getAttribute ('data-k') );
			};
			el.cent_r.oninput = el.cent_n.onchange = function () {
				var whole = el.semi_n.value / 1 || 0;
				setSemis ( whole + (this.value / 1 || 0) / 100, this.getAttribute ('data-k') );
			};
			el.fm_on.onchange = function () { S.formant = this.checked; sync (); changed (); };
			el.fm_r.oninput = el.fm_n.onchange = function () {
				S.fshift = clampN ( this.value / 1 || 0, -12, 12 );
				sync ( this.getAttribute ('data-k') ); changed ();
			};
			el.bpm_detect.onclick = function () { detectBpm (); };

			/* ---------- 調性（3-2） ---------- */
			var KN = w.PKTPAnalyze ? w.PKTPAnalyze.noteNames : [ 'C', 'C♯', 'D', 'E♭', 'E', 'F', 'F♯', 'G', 'A♭', 'A', 'B♭', 'B' ];
			(function fillKeys () {
				var h = '<option value="">—</option>', i;
				for (i = 0; i < 12; ++i) h += '<option value="' + i + '">' + KN[i] + '</option>';
				for (i = 0; i < 12; ++i) h += '<option value="' + ( i + 12 ) + '">' + KN[i] + 'm</option>';
				el.key_from.innerHTML = h;
				fillTo ( false );
			})();
			function fillTo ( minor ) {
				var keep = el.key_to.value, h = '<option value="">—</option>';
				for (var i = 0; i < 12; ++i) h += '<option value="' + i + '">' + KN[i] + ( minor ? 'm' : '' ) + '</option>';
				el.key_to.innerHTML = h;
				el.key_to.value = keep;
			}
			function applyKey () {
				var f = el.key_from.value, t2 = el.key_to.value;
				if (f === '' || t2 === '' || !w.PKTPAnalyze) return ;
				var shift = w.PKTPAnalyze.keyShift ( ( f / 1 ) % 12, t2 / 1 );
				S.link = false;
				setSemis ( shift );
				el.key_info.textContent = tf ('tp.key_shift', '移調', 'Transpose') + ' ' + ( shift > 0 ? '+' : '' ) + shift + ' ' + tf ('tp.semi', '半音', 'semitones');
			}
			el.key_from.onchange = function () { fillTo ( this.value / 1 >= 12 ); applyKey (); };
			el.key_to.onchange = applyKey;
			el.key_detect.onclick = function () {
				if (!w.PKTPAnalyze || !w.PKTPAnalyze.detectKey) { el.key_info.textContent = tf ('tp.key_failed', '無法偵測調性', 'Could not detect key'); return ; }
				el.key_info.textContent = tf ('tp.detecting', '分析中…', 'Analyzing…');
				w.PKTPAnalyze.detectKey ( AU.Copy ( selStart, Math.min ( selDur, 90 ) ) ).then ( function ( r ) {
					el.key_from.value = String ( r.pc + ( r.minor ? 12 : 0 ) );
					fillTo ( r.minor );
					el.key_info.textContent = tf ('tp.key_found', '偵測到', 'Detected') + ' ' + r.name + '（' + tf ('tp.key_conf', '信心', 'confidence') + ' ' + Math.round ( r.confidence * 100 ) + '%' +
						( Math.abs ( r.tuning ) >= 10 ? '，' + tf ('tp.key_tune', '調音', 'tuning') + ' ' + ( r.tuning > 0 ? '+' : '' ) + r.tuning + ' ct' : '' ) + '）';
					applyKey ();
				}).catch ( function () {
					el.key_info.textContent = tf ('tp.key_failed', '無法偵測調性', 'Could not detect key');
				});
			};

			function detectBpm () {
				el.bpm_info.textContent = tf ('tp.detecting', '分析中…', 'Analyzing…');
				function go () {
					var seg = AU.Copy ( selStart, Math.min ( selDur, 90 ) );
					w.PKTempoEstimator.estimate ( seg ).then ( function ( r ) {
						/* 3-1：以細搜尋把誤差收斂到 0.1 BPM 內；失敗就用粗估值 */
						if (!w.PKTPAnalyze) return r.tempo;
						return w.PKTPAnalyze.refineBpm ( seg, r.tempo ).then ( function ( f ) { return f.bpm; }, function () { return r.tempo; });
					}).then ( function ( bpm ) {
						el.bpm_from.value = bpm.toFixed ( 1 );
						el.bpm_info.textContent = '';
						sync ();
					}).catch ( function () {
						el.bpm_info.textContent = tf ('ui.tempo_failed', '無法估算節奏', 'Could not estimate tempo');
					});
				}
				if (w.PKTempoEstimator) return go ();
				var s = d.createElement ('script');
				s.src = 'tempo-estimator.js?v=mt2';
				s.onload = go;
				s.onerror = function () { el.bpm_info.textContent = tf ('ui.tempo_failed', '無法估算節奏', 'Could not estimate tempo'); };
				d.head.appendChild ( s );
			}


			/* ---------- 曲線（3-4）：重用 fx-auto 的編輯畫布 ---------- */
			var ID_T = 'pk_tp_tempo', ID_P = 'pk_tp_semi';
			var auto = null, ptSeq = 0, rmBtn = null;

			(function initCurves () {
				var FX = w.PKAudioEditor && w.PKAudioEditor._deps && w.PKAudioEditor._deps.FxAUT;
				if (!FX) { el.cur_row.style.display = 'none'; el.cur_box.style.display = 'none'; return ; }
				x.waveDarken = 0.45;
				auto = new FX ( app, x, null, null );
				auto.btn_auto.style.display = 'none';
				auto.canvas.style.display = 'none';
				el.cur_box.appendChild ( auto.canvas );

				rmBtn = d.createElement ('a');
				rmBtn.className = 'pk_modal_a_bottom';
				rmBtn.textContent = tf ('ui.delete', '刪除', 'Delete');
				rmBtn.style.cssText = 'display:none;position:absolute;z-index:4;margin:0';
				el.cur_box.appendChild ( rmBtn );
				rmBtn.onclick = function ( e ) { e.preventDefault (); auto.DelAct ( 2 ); };

				var baseRender = auto.Render;
				auto.Render = function () {
					baseRender.call ( auto );
					drawAxis ();
					placeRm ();
					curvesChanged ();
				};
			})();

			function actOf ( which ) {
				var inp = which === 'p' ? el.semi_r : el.tempo_r;
				return { id: which === 'p' ? ID_P : ID_T, el: inp, min: inp.min / 1, max: inp.max / 1, step: inp.step / 1 };
			}
			function ptsOf ( which ) { return auto && auto.points[ which === 'p' ? ID_P : ID_T ] || []; }
			function hasT () { return !retimeOn ( S ) && ptsOf ('t').length > 0; }          /* [修改 4-6] 重排啟用時曲線不作用 */
			function hasP () { return !retimeOn ( S ) && !S.link && ptsOf ('p').length > 0; }

			/* 以「值」建立曲線點；xs 為 0~1 的比例 */
			function setCurve ( which, pts, activate ) {
				if (!auto) return ;
				var a = actOf ( which ), arr = [];
				for (var i = 0; i < pts.length; ++i) {
					var xv = clampN ( pts[i][0], 0, 1 );
					var v = which === 'p' ? pts[i][1] : Math.log ( clampN ( pts[i][1], 0.25, 4 ) );
					v = clampN ( v, a.min, a.max );
					var yv = 1 - ( v - a.min ) / ( a.max - a.min );
					arr.push ({ id: ++ptSeq, x: xv, y: yv, ax: xv * auto.cw, ay: yv * auto.ch, time: selDur * xv, val: v, _on: true, _hov: false });
				}
				arr.sort ( function ( p, q ) { return p.x - q.x; } );
				auto.points[ a.id ] = arr;
				if (activate) { auto.act = a; auto.act_point = null; }
				auto.Render ();
			}
			function clearCurve ( which ) {
				if (!auto) return ;
				auto.points[ which === 'p' ? ID_P : ID_T ] = [];
				if (auto.act && auto.act.id === ( which === 'p' ? ID_P : ID_T )) {
					var other = which === 'p' ? 't' : 'p';
					if (ptsOf ( other ).length) { auto.act = actOf ( other ); }
					else { auto.act = null; auto.canvas.style.display = 'none'; }
					auto.act_point = null;
				}
				auto.Render ();
			}
			function openCurve ( which ) {
				if (!auto || ( which === 'p' && S.link )) return ;
				if (!ptsOf ( which ).length) {
					setCurve ( which, which === 'p' ? [ [0, S.semis], [1, S.semis] ] : [ [0, S.tempo], [1, S.tempo] ], true );
				}
				auto.act = actOf ( which ); auto.act_point = null;
				auto.canvas.style.display = 'block';
				auto.Render ();
			}

			function dbLabel ( id, v ) {
				return id === ID_T ? Math.round ( Math.exp ( v ) * 100 ) + '%' : ( v > 0.05 ? '+' : '' ) + v.toFixed ( 1 ) + ' st';
			}
			function drawAxis () {
				if (!auto || !auto.act) return ;
				var c = auto.ctx, a = auto.act, pts = auto.points[ a.id ] || [];
				var marks = a.id === ID_T ? [ a.max, 0, a.min ] : [ a.max, 0, a.min ];
				c.save ();
				c.font = '10px Arial';
				c.textBaseline = 'middle';
				for (var i = 0; i < marks.length; ++i) {
					var y = ( 1 - ( marks[i] - a.min ) / ( a.max - a.min ) ) * auto.ch;
					if (marks[i] === 0) {
						c.strokeStyle = 'rgba(217,217,85,0.35)';
						c.beginPath (); c.moveTo ( 0, y ); c.lineTo ( auto.cw, y ); c.stroke ();
					}
					var txt = dbLabel ( a.id, marks[i] ), tw = c.measureText ( txt ).width + 8;
					y = y < 8 ? 8 : y > auto.ch - 8 ? auto.ch - 8 : y;
					c.fillStyle = 'rgba(0,0,0,0.65)'; c.fillRect ( 3, y - 7, tw, 14 );
					c.fillStyle = '#d9d955'; c.fillText ( txt, 7, y );
				}
				c.fillStyle = '#fff';
				for (var j = 0; j < pts.length; ++j) {
					var lb = dbLabel ( a.id, pts[j].val ), lw = c.measureText ( lb ).width;
					var px = pts[j].ax + 9, py = pts[j].ay - 10;
					if (px + lw > auto.cw - 3) px = pts[j].ax - lw - 9;
					if (py < 8) py = pts[j].ay + 12;
					c.fillText ( lb, px, py );
				}
				/* 時間刻度：左下 0、右下為選取長度；標題在右上 */
				c.fillStyle = 'rgba(255,255,255,.55)'; c.textBaseline = 'bottom';
				c.fillText ( '0', 4, auto.ch - 2 );
				var te = fmtT ( selDur ); c.fillText ( te, auto.cw - c.measureText ( te ).width - 4, auto.ch - 2 );
				c.textBaseline = 'top';
				var ti = a.id === ID_T ? tf ('tp.cur_tempo', '速度曲線', 'Speed curve') : tf ('tp.cur_pitch', '音高曲線', 'Pitch curve');
				c.fillText ( ti, auto.cw - c.measureText ( ti ).width - 6, 4 );
				c.restore ();
			}
			function placeRm () {
				if (!rmBtn) return ;
				var p = auto.act_point, a = auto.act && auto.points[ auto.act.id ];
				if (!p || !a || a.length < 3) { rmBtn.style.display = 'none'; return ; }
				rmBtn.style.display = 'block';
				rmBtn.style.left = auto.canvas.offsetLeft + auto.canvas.offsetWidth - rmBtn.offsetWidth - 6 + 'px';
				rmBtn.style.top = auto.canvas.offsetTop + auto.canvas.offsetHeight - rmBtn.offsetHeight - 6 + 'px';
			}

			/* 曲線 → 引擎格式。shift：試聽時片段起點相對於選取起點的秒數 */
			function curveOpts ( shift ) {
				var o = {}, i, p;
				if (hasT ()) {
					p = ptsOf ('t'); o.tempoCurve = [];
					for (i = 0; i < p.length; ++i) o.tempoCurve.push ({ t: p[i].time - shift, v: Math.exp ( p[i].val ) });
				}
				if (hasP ()) {
					p = ptsOf ('p'); o.pitchCurve = [];
					for (i = 0; i < p.length; ++i) o.pitchCurve.push ({ t: p[i].time - shift, v: p[i].val });
				}
				return o;
			}
			function curveLen () {
				if (!hasT () || !w.PKTimePitch || !w.PKTimePitch.curveLength) return null;
				try {
					var o = curveOpts ( 0 ); o.tempo = 1; o.pitch = 0;
					return w.PKTimePitch.curveLength ( Math.round ( selDur * sr ), sr, o ) / sr;
				} catch ( e ) { return null; }
			}
			/* 曲線啟用時，對應的固定值控制項停用，並顯示說明 */
			function curveSync () {
				if (!auto) return ;
				var tOn = hasT (), pOn = hasP ();
				el.tempo_r.disabled = el.tempo_n.disabled = el.bpm_to.disabled = tOn;
				el.len_n.disabled = tOn || retimeOn ( S );      /* [修改 4-6] */
				el.semi_r.disabled = el.semi_n.disabled = el.cent_r.disabled = el.cent_n.disabled = S.link || pOn;
				el.cur_pitch.style.opacity = S.link ? '.4' : '';
				el.cur_tempo.classList.toggle ('pk_act', !!( auto.act && auto.act.id === ID_T ));
				el.cur_pitch.classList.toggle ('pk_act', !!( auto.act && auto.act.id === ID_P ));
				var L = curveLen ();
				if (L !== null) {
					el.len_n.value = L.toFixed ( 3 );
					el.len_info.textContent = fmtT ( selDur ) + ' → ' + fmtT ( L );
				}
				if (retimeOn ( S ) && ( ptsOf ('t').length || ptsOf ('p').length )) {
					el.cur_hint.textContent = tf ('tp.sp_curve_off', '語速／停頓重排啟用時，速度與音高曲線不作用', 'Speed and pitch curves are ignored while speech rate / pauses are changed');
					return ;
				}
				if (pOn) el.info.textContent = tf ('tp.info', '音高變化', 'Pitch change') + ': ' + tf ('tp.cur_by', '由曲線控制', 'controlled by curve');
				var msg = [];
				if (tOn) msg.push ( tf ('tp.cur_t_on', '速度由曲線控制', 'Speed follows the curve') );
				if (pOn) msg.push ( tf ('tp.cur_p_on', '音高由曲線控制', 'Pitch follows the curve') );
				if (S.link && ptsOf ('p').length) msg.push ( tf ('tp.cur_p_link', '連動模式下音高曲線不作用', 'Pitch curve is ignored in linked mode') );
				el.cur_hint.textContent = msg.length ? msg.join ('；') :
					tf ('tp.cur_hint', '按「速度曲線」或「音高曲線」開始；在圖上快速點兩下新增控制點，拖曳移動', 'Pick a curve, double-click the graph to add points, drag to move');
			}
			function curvesChanged () { curveSync (); changed (); }

			if (auto) {
				el.cur_tempo.onclick = function () { openCurve ('t'); };
				el.cur_pitch.onclick = function () { openCurve ('p'); };
				el.cur_clear.onclick = function () { if (auto.act) clearCurve ( auto.act.id === ID_P ? 'p' : 't' ); };
				el.cur_preset.onchange = function () {
					var pr = CURVE_PRESETS[ this.value / 1 ]; this.value = '0';
					if (!pr || !pr[2] && !pr[3]) return ;
					if (pr[2] === 'clear') { clearCurve ('t'); clearCurve ('p'); return ; }
					var edge = Math.min ( 2, selDur * 0.4 ) / selDur, e2 = Math.min ( 0.025 / selDur, 0.02 );
					function conv ( list ) {
						return list.map ( function ( q ) {
							var xv = q[0];
							if (xv === 'tail') xv = 1 - edge; else if (xv === 'head') xv = edge;
							else if (xv === 'mid-') xv = 0.5 - e2; else if (xv === 'mid+') xv = 0.5 + e2;
							return [ xv, q[1] ];
						});
					}
					S.link = !!pr[4];
					if (pr[2]) { setCurve ( 't', conv ( pr[2] ), true ); }
					if (pr[3]) { S.link = false; setCurve ( 'p', conv ( pr[3] ), !pr[2] ); }
					if (pr[4]) clearCurve ('p');
					auto.canvas.style.display = 'block';
					sync ();
					auto.Render ();
				};
			}


			/* ---------- 語音／聲調（4-6） ---------- */
			var SP_MAX = 600;      /* 聲調分析與停頓偵測最長處理的選取長度（秒），避免記憶體吃太多 */
			function noSpeechEngine () { return !( w.PKF0 && w.PKF0Edit && w.PKSpeech ); }
			function lenNow ( tempo ) {
				if (retimeOn ( S ) && SP.pauses && w.PKSpeech) {
					try {
						var pl = w.PKSpeech.makePlan ( Math.round ( selDur * sr ), sr, { speechTempo: S.sTempo, pauseScale: S.pScale, pauseMax: S.pMax, pauses: SP.pauses } );
						return pl.outSec / tempo;
					} catch ( e ) {}
				}
				return selDur / tempo;
			}
			function selSeg () { if (!SP.seg) SP.seg = AU.Copy ( selStart, selDur ); return SP.seg; }
			function selChans () { return segChans ( selSeg () ); }
			function tooLong () { return new Error ( tf ('tp.sp_too_long', '選取範圍超過 10 分鐘，請縮小範圍再使用語音功能', 'Selection is over 10 min; select a shorter range for speech tools') ); }

			function ensureTrack () {
				if (SP.track) return Promise.resolve ( SP.track );
				if (noSpeechEngine ()) return Promise.reject ( new Error ( 'PKF0 / PKSpeech not loaded' ) );
				if (selDur > SP_MAX) return Promise.reject ( tooLong () );
				return w.PKF0.trackBuffer ( selSeg (), { onprogress: function ( p ) {
					el.status.textContent = tf ('tp.sp_busy', '分析語音中…', 'Analyzing speech…') + ' ' + Math.round ( p * 100 ) + '%';
				} }).then ( function ( tr ) { SP.track = tr; el.status.textContent = ''; return tr; } );
			}
			function spSyl () {
				if (!SP.syl) SP.syl = w.PKSpeech.syllables ( SP.track, { channels: selChans (), sr: sr } );
				return SP.syl;
			}
			/* 編輯器標記 → 相對選取起點的秒數（只留選取範圍內、起點不早於選取起點的） */
			function markersRel () {
				var m = app.mrk && app.mrk.list ? app.mrk.list () : [], o = [];
				for (var i = 0; i < m.length; ++i) {
					var t = m[i].time - selStart;
					if (!( t >= 0 && t <= selDur )) continue;
					o.push ({ time: t, end: m[i].end > m[i].time ? m[i].end - selStart : 0 });
				}
				return o;
			}
			function spPauses () {
				if (SP.pauses && SP.pSrc === S.pSrc) return SP.pauses;
				if (noSpeechEngine ()) throw new Error ( 'PKSpeech not loaded' );
				if (selDur > SP_MAX) throw tooLong ();
				var auto = SP.auto || ( SP.auto = w.PKSpeech.findPauses ( selChans (), sr, {} ) );
				SP.pauses = S.pSrc === 'marker' ? w.PKSpeech.pausesFromMarkers ( markersRel (), selDur, auto, {} ) : auto;
				SP.pSrc = S.pSrc;
				return SP.pauses;
			}
			/* 主畫面「音高輪廓 → ✎ 編輯輪廓」改過的輪廓：回傳 { f0, f0Target, base } 或 { err } 或 null（沒有可用的） */
			function viewSource () {
				var PC = w.PKPitchContourUI;
				if (!PC || !PC.track) return null;
				var L = PC.track ();
				if (!L || !L.track || !L.ed || !L.ed.dirty ()) return null;
				var tr = L.track, end = L.offset + tr.n / tr.rate;
				if (selStart < L.offset - 0.02 || selStart + selDur > end + 0.02) return { err: 'range' };
				return { f0: L.ed.orig, f0Target: L.ed.edited, base: selStart - L.offset };
			}
			/* 準備好 planStages 需要的語音資料（可能要先分析音高，所以是 Promise） */
			function buildSP () {
				var sp = { pauses: null };
				try { if (retimeOn ( S )) sp.pauses = spPauses (); } catch ( e ) { return Promise.reject ( e ); }
				if (S.link) return Promise.resolve ( sp );
				if (S.useView) {
					var v = viewSource ();
					if (v && !v.err) { sp.f0 = v.f0; sp.f0Target = v.f0Target; sp.base = v.base; }
					return Promise.resolve ( sp );
				}
				if (S.tone !== 'none' && S.toneAmt > 0) {
					return ensureTrack ().then ( function ( tr ) {
						var ed = w.PKF0Edit.create ( tr );
						w.PKSpeech.toneEdit ( ed, { mode: S.tone, amount: S.toneAmt, scope: S.toneScope, channels: selChans (), sr: sr,
							syllables: S.toneScope === 'syllable' ? spSyl () : null } );
						sp.f0 = tr; sp.f0Target = ed.edited; sp.base = 0;
						return sp;
					});
				}
				return Promise.resolve ( sp );
			}

			function spSync ( skip ) {
				var set = function ( k, v ) { if (k !== skip && el[k]) el[k].value = v; };
				var noEng = noSpeechEngine ();
				el.tone.value = S.tone; el.tone_scope.value = S.toneScope;
				el.tone_r.max = el.tone_n.max = S.tone === 'flatten' ? 100 : 200;
				set ('tone_r', Math.round ( S.toneAmt * 100 )); set ('tone_n', Math.round ( S.toneAmt * 100 ));
				el.use_view.checked = S.useView;
				set ('sp_tempo', ( S.sTempo * 100 ).toFixed ( 1 ).replace ( /\.0$/, '' ));
				set ('sp_pscale', Math.round ( S.pScale * 100 ));
				set ('sp_pmax', S.pMax);
				el.sp_psrc.value = S.pSrc;
				if (SP.rate > 0) set ('sp_rate_to', ( SP.rate * S.sTempo ).toFixed ( 1 ));

				var vs = viewSource ();
				var offTone = noEng || S.link || S.useView;
				el.tone.disabled = offTone;
				el.tone_scope.disabled = offTone || S.tone === 'none';
				el.tone_r.disabled = el.tone_n.disabled = offTone || S.tone === 'none';
				el.use_view.disabled = noEng || S.link || ( !S.useView && !( vs && !vs.err ) );
				el.sp_analyze.style.opacity = noEng ? '.4' : '';
				el.sp_tempo.disabled = el.sp_pscale.disabled = el.sp_pmax.disabled = el.sp_psrc.disabled = noEng;
				el.sp_rate_to.disabled = noEng || !( SP.rate > 0 );

				el.view_info.textContent = S.link ? '' :
					vs && vs.err ? tf ('tp.view_range', '編輯過的輪廓沒有涵蓋選取範圍', 'The edited contour does not cover the selection') :
					vs ? tf ('tp.view_ok', '可用', 'available') :
					tf ('tp.view_none', '尚未編輯輪廓（檢視 → 音高輪廓 → ✎ 編輯輪廓）', 'No edited contour (View → Pitch contour → ✎ Edit)');

				if (SP.infoText) el.sp_info.textContent = SP.infoText;
				if (retimeOn ( S ) && !noEng) { try { spPauses (); } catch ( e ) { el.sp_info.textContent = e.message; } }
				if (retimeOn ( S ) && SP.pauses && SP.pSrc === 'marker' && !SP.pauses.length) {
					el.sp_info.textContent = tf ('tp.sp_no_marker', '沒有可用的標記（需要區間標記之間的空隙，或落在靜音裡的點標記）', 'No usable markers (need gaps between range markers, or point markers inside silence)');
				}
			}
			function spChanged ( skip ) { sync ( skip ); changed (); }

			el.tone.onchange = function () { S.tone = this.value; if (S.tone === 'flatten') S.toneAmt = Math.min ( 1, S.toneAmt ); spChanged (); };
			el.tone_scope.onchange = function () { S.toneScope = this.value; spChanged (); };
			el.tone_r.oninput = el.tone_n.onchange = function () {
				S.toneAmt = clampN ( ( this.value / 1 || 0 ) / 100, 0, S.tone === 'flatten' ? 1 : 2 );
				spChanged ( this.getAttribute ('data-k') );
			};
			el.use_view.onchange = function () { S.useView = this.checked; spChanged (); };
			el.sp_tempo.onchange = el.sp_tempo.oninput = function () { S.sTempo = clampN ( ( this.value / 100 ) || 1, 0.25, 4 ); spChanged ('sp_tempo'); };
			el.sp_rate_to.onchange = function () {
				var v = this.value / 1;
				if (SP.rate > 0 && v > 0) { S.sTempo = clampN ( v / SP.rate, 0.25, 4 ); spChanged (); }
			};
			el.sp_pscale.onchange = function () { S.pScale = clampN ( ( this.value / 100 ) || 0, 0, 4 ); spChanged ('sp_pscale'); };
			el.sp_pmax.onchange = function () { S.pMax = Math.max ( 0, this.value / 1 || 0 ); spChanged ('sp_pmax'); };
			el.sp_psrc.onchange = function () { S.pSrc = this.value; SP.pauses = null; SP.infoText = ''; spChanged (); };

			/* 「分析語速」：偵測音節與停頓，顯示目前語速 */
			el.sp_analyze.onclick = function () {
				if (SP.busy || noSpeechEngine ()) return ;
				SP.busy = true;
				el.sp_info.textContent = tf ('tp.sp_busy', '分析語音中…', 'Analyzing speech…');
				ensureTrack ().then ( function () {
					var syl = spSyl (), ps = spPauses (), r = w.PKSpeech.speechRate ( syl, selDur, ps );
					var pt = 0; for (var i = 0; i < ps.length; ++i) pt += ps[i].b - ps[i].a;
					SP.rate = r.perSec;
					SP.infoText = r.syllables ? tf ('tp.sp_info', '音節 {n} 個，語速約 {r} 音節/秒；停頓 {p} 段，共 {t} 秒', '{n} syllables, about {r} syl/s; {p} pauses, {t} s in total')
						.replace ( '{n}', r.syllables ).replace ( '{r}', r.perSec.toFixed ( 1 ) ).replace ( '{p}', ps.length ).replace ( '{t}', pt.toFixed ( 1 ) )
						: tf ('tp.sp_no_voice', '找不到明確的語音', 'No clear speech found');
					SP.busy = false; spChanged ();
				}).catch ( function ( err ) {
					SP.busy = false;
					el.sp_info.textContent = tf ('tp.sp_fail', '分析失敗', 'Analysis failed') + ': ' + err.message;
				});
			};

			/* ---------- 試聽 ---------- */
			/* [刪除 4-6] optsNow ()：改由 planStages () 規劃多階段 */
			function isIdentity () {
				if (toneReq ( S ) || retimeOn ( S )) return false;      /* [新增 4-6] */
				if (hasT () || hasP ()) return false;
				if (Math.abs ( S.tempo - 1 ) >= 1e-4) return false;
				if (S.link) return true;
				return Math.abs ( S.semis ) < 1e-4 && !(S.formant && Math.abs ( S.fshift ) > 1e-3);
			}

			function segChans ( seg ) {
				var a = [];
				for (var i = 0; i < seg.numberOfChannels; ++i) a.push ( seg.getChannelData ( i ) );
				return a;
			}

			function stopPreview () {
				pvToken++;
				if (src) { try { src.stop (); } catch ( e ) {} try { src.disconnect (); } catch ( e2 ) {} src = null; }
				if (el.pv_play) el.pv_play.firstChild && (el.pv_play.textContent = '▶ ' + tf ('tp.preview', '試聽', 'Preview'));
				pv && pv.job && pv.job.cancel ();
				if (pv && !pv.fx) pv = null;      /* [修改 4-6] 還在算就被停止：清掉，否則下一次按「試聽」會被當成「還在算」而無法重新開始 */
			}

			function playBuf ( b ) {
				if (!ctx) ctx = new ( w.AudioContext || w.webkitAudioContext )();
				if (ctx.state === 'suspended') ctx.resume ();
				if (src) { try { src.stop (); } catch ( e ) {} try { src.disconnect (); } catch ( e2 ) {} }
				src = ctx.createBufferSource ();
				src.buffer = b;
				src.loop = true;
				src.connect ( ctx.destination );
				src.start ();
				el.pv_play.textContent = '■ ' + tf ('tp.stop', '停止', 'Stop');
			}

			function startPreview () {
				var token = ++pvToken;
				var pvFrom = clampN ( el.pv_from.value / 1 || 0, 0, Math.max ( 0, selDur - 0.2 ) );
				var segDur = Math.min ( selDur - pvFrom, 12 );
				var seg = AU.Copy ( selStart + pvFrom, segDur );
				if (!ctx) ctx = new ( w.AudioContext || w.webkitAudioContext )();
				if (ctx.state === 'suspended') ctx.resume ();

				var orig = ctx.createBuffer ( seg.numberOfChannels, seg.length, seg.sampleRate );
				for (var c = 0; c < seg.numberOfChannels; ++c) orig.getChannelData ( c ).set ( seg.getChannelData ( c ) );

				if (isIdentity ()) { pv = { orig: orig, fx: orig }; return playBuf ( orig ); }

				el.status.textContent = tf ('tp.rendering', '處理中…', 'Rendering…');
				pv = { orig: orig, fx: null, job: null };
				/* [修改 4-6] 先備好語音資料（可能要分析音高），再依 planStages 依序處理 */
				buildSP ().then ( function ( sp ) {
					if (token !== pvToken) return ;
					var stages = planStages ({ S: S, co: curveOpts ( pvFrom ), sp: sp, shift: pvFrom, dur: segDur });
					if (!stages.length) { pv.fx = orig; el.status.textContent = ''; return playBuf ( orig ); }
					var job = runChain ( segChans ( seg ), seg.sampleRate, stages );
					pv.job = job;
					return job.promise.then ( function ( out ) {
						if (token !== pvToken) return ;
						var fb = ctx.createBuffer ( out.length, out[0].length, seg.sampleRate );
						for (var c = 0; c < out.length; ++c) fb.getChannelData ( c ).set ( out[c] );
						pv.fx = fb;
						el.status.textContent = '';
						playBuf ( ab === 'fx' ? fb : orig );
					});
				}).catch ( function ( err ) {
					if (token !== pvToken) return ;
					el.status.textContent = tf ('tp.failed', '處理失敗', 'Failed') + ': ' + err.message;
				});
			}

			el.pv_from.onchange = function () { changed (); };
			el.pv_play.onclick = function () {
				if (src || (pv && !pv.fx)) { stopPreview (); el.status.textContent = ''; return ; }
				startPreview ();
			};
			el.pv_ab.onclick = function () {
				ab = ab === 'fx' ? 'orig' : 'fx';
				el.pv_ab.textContent = ab === 'fx' ? tf ('tp.ab_fx', '處理後', 'Processed') : tf ('tp.ab_orig', '原音', 'Original');
				if (src && pv) playBuf ( ab === 'fx' ? (pv.fx || pv.orig) : pv.orig );
			};
			/* 播放中調整參數：稍等一下再重新渲染 */
			function changed () {
				if (!src) return ;
				clearTimeout ( pvTimer );
				pvTimer = setTimeout ( function () { stopPreview (); startPreview (); }, 350 );
			}

			sync ();

			/* ---------- 套用 ---------- */
			function apply ( q ) {
				if (busy) return ;
				if (isIdentity ()) return q.Destroy ();
				stopPreview ();

				var start = app.engine.TrimTo ( selStart, 3 );
				var dur = app.engine.TrimTo ( selDur, 3 );
				var seg = AU.Copy ( start, dur );
				var apBtn = q.els && q.els.bottom[0];
				if (apBtn) apBtn.style.opacity = '.4';
				el.status.textContent = '0%';

				/* [修改 4-6] busy 改成可取消的包裝（分析階段和多階段處理都要能取消） */
				var dead = false, chain = null;
				busy = { cancel: function () { dead = true; chain && chain.cancel (); } };
				buildSP ().then ( function ( sp ) {
					if (dead) return null;
					var stages = planStages ({ S: S, co: curveOpts ( start - selStart ), sp: sp, shift: start - selStart, dur: dur });
					if (!stages.length) { busy = null; q.Destroy (); return null; }
					chain = runChain ( segChans ( seg ), seg.sampleRate, stages, function ( p ) {
						el.status.textContent = Math.round ( p * 100 ) + '%';
					});
					return chain.promise;
				}).then ( function ( out ) {
					if (!out || dead) return ;
					busy = null;
					var nb = wavesurfer.backend.ac.createBuffer ( out.length, out[0].length, seg.sampleRate );
					for (var c = 0; c < out.length; ++c) nb.getChannelData ( c ).set ( out[c] );

					app.fireEvent ('StateRequestPush', {
						desc: tf ('tp.desc', '時間與音高', 'Time & Pitch'),
						meta: [ start, dur ],
						data: wavesurfer.backend.buffer
					});
					AU.Replace ( start, dur, nb );

					var newDur = nb.length / seg.sampleRate;
					wavesurfer.regions.clear ();
					wavesurfer.regions.add ({ start: start, end: start + newDur, id: 't' });
					app.fireEvent ('RequestSeekTo', start / wavesurfer.getDuration ());
					OneUp ( tf ('tp.applied', '已套用時間與音高', 'Applied Time & Pitch') );
					q.Destroy ();
				}).catch ( function ( err ) {
					busy = null;
					if (apBtn) apBtn.style.opacity = '';
					el.status.textContent = tf ('tp.failed', '處理失敗', 'Failed') + ': ' + err.message;
				});
			}
		});
	}

	w.PKTimePitchUI = { attach: attach, plan: planStages, retimeOn: retimeOn, defaults: spDefaults };      /* [修改 4-6] 多匯出三個純函式供測試 */
})( window, document );


