(function ( w, d, PKAE ) {
	'use strict';

	/* 錄音偏好：回音消除／降噪／自動增益／輸入裝置。
	 * 「新錄音」視窗與一般錄音、多軌錄音共用；存在 localStorage。
	 * 三項瀏覽器處理預設關閉（會壓縮動態、影響音質）。 */
	var REC_PREF_KEY = 'pk_rec_prefs';
	/* [修改] 新增 gain（輸入增益，dB，-12 ~ +24） */
	var rec_prefs = { echo: false, noise: false, agc: false, deviceId: '', countdown: 0, gain: 0, channels: 1 };
	function clampGain ( v ) { v = Math.round ( +v ); return isNaN ( v ) ? 0 : Math.max (-12, Math.min (24, v)); }
	function dbToLin ( db ) { return Math.pow (10, (db || 0) / 20); }
	try {
		var saved_prefs = JSON.parse ( w.localStorage.getItem ( REC_PREF_KEY ) || '{}' );
		if (saved_prefs.echo !== undefined) rec_prefs.echo = !!saved_prefs.echo;
		if (saved_prefs.noise !== undefined) rec_prefs.noise = !!saved_prefs.noise;
		if (saved_prefs.agc !== undefined) rec_prefs.agc = !!saved_prefs.agc;
		if (typeof saved_prefs.deviceId === 'string') rec_prefs.deviceId = saved_prefs.deviceId;
		if ([0, 3, 5].indexOf ( saved_prefs.countdown ) >= 0) rec_prefs.countdown = saved_prefs.countdown;
		if (saved_prefs.gain !== undefined) rec_prefs.gain = clampGain ( saved_prefs.gain ); /* [新增] */
		if (saved_prefs.channels === 2) rec_prefs.channels = 2; /* [新增] 錄音聲道：1 = 單聲道（預設），2 = 立體聲 */
	} catch (e) {}

	PKAE._deps.recPrefs = {
		get: function () { return rec_prefs; },
		set: function ( key, val ) {
			if (!(key in rec_prefs)) return ;
			rec_prefs[ key ] = key === 'deviceId' ? String ( val || '' ) :
				key === 'gain' ? clampGain ( val ) : /* [新增] */
				key === 'channels' ? (+val === 2 ? 2 : 1) : /* [新增] */
				key === 'countdown' ? ([0, 3, 5].indexOf ( +val ) >= 0 ? +val : 0) : !!val;
			try { w.localStorage.setItem ( REC_PREF_KEY, JSON.stringify ( rec_prefs ) ); } catch (e) {}
		},
		/* [修改] 可傳入聲道數；要求 2 聲道時向瀏覽器表明想要立體聲（ideal，裝置不支援就維持單聲道） */
		audioConstraints: function ( channels ) {
			var c = {
				echoCancellation: !!rec_prefs.echo,
				noiseSuppression: !!rec_prefs.noise,
				autoGainControl: !!rec_prefs.agc
			};
			if (rec_prefs.deviceId) c.deviceId = rec_prefs.deviceId;
			if (channels === 2) c.channelCount = { ideal: 2 };
			return c;
		}
	};


	/* [新增] 錄音倒數：按下錄音後先倒數 3 或 5 秒再開始，讓使用者有時間戴上耳機、就定位。
	 * 單軌（engine.js）與多軌（multitrack.js）的錄音鈕都會先問這裡；秒數為 0 就直接開始。
	 * 倒數期間再按一次錄音鍵、點一下數字或按 Esc 都會取消。 */
	var countdown_run = null;
	function cdText ( key, fb ) {
		var s = '';
		try { s = w.PKLocale.t ( key ); } catch (e) {}
		return s && s !== key ? s : fb;
	}
	PKAE._deps.recCountdown = {
		seconds: function () { return rec_prefs.countdown || 0; },
		active: function () { return !!countdown_run; },
		cancel: function () { countdown_run && countdown_run.finish ( false ); },
		run: function ( done ) {
			if (countdown_run || !d.body) return false;

			var left = rec_prefs.countdown || 0;
			if (left <= 0) { done && done ( true ); return true; }

			var box = d.createElement ('div');
			box.setAttribute ('role', 'status');
			box.setAttribute ('aria-live', 'polite');
			box.style.cssText = 'position:fixed;left:50%;top:50%;transform:translate(-50%,-50%);z-index:99999;' +
				'min-width:150px;padding:18px 30px;text-align:center;cursor:pointer;user-select:none;' +
				'background:rgba(10,10,10,.9);border:1px solid #d45b57;border-radius:12px;color:#fff;' +
				'font:bold 72px/80px Arial,sans-serif';
			var num = d.createElement ('div');
			var hint = d.createElement ('div');
			hint.style.cssText = 'margin-top:6px;font:12px/16px Arial,sans-serif;color:#b3b6b1';
			hint.textContent = cdText ('rec.countdown_cancel', 'Click or press Esc to cancel');
			box.appendChild ( num );
			box.appendChild ( hint );
			d.body.appendChild ( box );

			var timer = 0;
			var run = countdown_run = {
				finish: function ( ok ) {
					if (countdown_run !== run) return ;
					countdown_run = null;
					w.clearInterval ( timer );
					d.removeEventListener ('keydown', onkey, true);
					box.parentNode && box.parentNode.removeChild ( box );
					done && done ( ok );
				}
			};
			function onkey ( e ) {
				if (e.key !== 'Escape') return ;
				e.preventDefault ();
				e.stopPropagation ();
				run.finish ( false );
			}
			d.addEventListener ('keydown', onkey, true);
			box.onclick = function () { run.finish ( false ); };

			function show () { num.textContent = String ( left ); }
			show ();
			timer = w.setInterval (function () {
				if (--left <= 0) run.finish ( true );
				else show ();
			}, 1000);
			return true;
		}
	};

	/* [修改] 錄音輸入電平表（單軌與多軌共用，因為都走 startCapture）。
	 * 單聲道：一條峰值條；立體聲：L / R 兩條（各自有峰值、RMS、峰值保持）。
	 * 時間、削波次數、輸入增益、MON 監聽、輸入太小提示都是整體共用一份。
	 * 0 dBFS = 右端、-60 dBFS = 左端；峰值保持約 1 秒；點 CLIP 清除。 */
	var rec_meter = null;
	var METER_TICKS = [-48, -36, -24, -12, -6];
	function meterLabel () { return cdText ('rec.input_level', 'Input level'); }
	function meterPos ( v ) { return v <= 0.001 ? 0 : Math.max (0, Math.min (1, (20 * Math.log (v) / Math.LN10 + 60) / 60)); }
	function fmtTime ( sec ) {
		sec = sec | 0;
		var h = (sec / 3600) | 0, m = ((sec % 3600) / 60) | 0, s2 = sec % 60;
		return (h ? h + ':' + (m < 10 ? '0' : '') : '') + m + ':' + (s2 < 10 ? '0' : '') + s2;
	}
	function fmtGain ( db ) { return 'IN ' + (db > 0 ? '+' : '') + db + ' dB'; }

	/* [新增] 一條電平條（峰值填色 + RMS 細條 + 刻度 + 峰值保持）；回傳這一聲道的狀態 */
	function makeBar ( mono ) {
		var track = d.createElement ('div');
		track.style.cssText = 'position:relative;width:200px;max-width:34vw;height:' + (mono ? 10 : 7) + 'px;background:#050708;' +
			'border:1px solid #222c30;overflow:hidden';
		var fill = d.createElement ('i');
		fill.style.cssText = 'display:block;height:100%;transform:scaleX(0);transform-origin:0 0;' +
			'background:linear-gradient(90deg,#56dbe3,#77d26d 62%,#d4bd54 84%,#d45b57)';
		track.appendChild (fill);

		var rms_el = d.createElement ('i');
		rms_el.style.cssText = 'position:absolute;left:0;bottom:0;width:100%;height:' + (mono ? 3 : 2) + 'px;transform:scaleX(0);' +
			'transform-origin:0 0;background:rgba(255,255,255,.75)';
		track.appendChild (rms_el);

		for (var ti = 0; ti < METER_TICKS.length; ++ti) {
			var tk = d.createElement ('i');
			tk.style.cssText = 'position:absolute;top:0;bottom:0;width:1px;background:rgba(0,0,0,.6);left:' +
				(((METER_TICKS[ti] + 60) / 60) * 100).toFixed (2) + '%';
			track.appendChild (tk);
		}

		var hold = d.createElement ('b');
		hold.style.cssText = 'position:absolute;top:0;bottom:0;left:0;width:2px;background:#e8edf0;opacity:.85';
		track.appendChild (hold);

		return { el: track, fill: fill, rms_el: rms_el, hold: hold,
			peak: 0, sq: 0, n: 0, shown: 0, rms_shown: 0, hold_v: 0, hold_t: 0 };
	}

	/* nch：1 = 單聲道、2 = 立體聲（[修改] 新增參數） */
	function meterOpen ( hooks, nch ) {
		if (rec_meter || !d.body) return ;
		hooks = hooks || {};
		nch = nch === 2 ? 2 : 1;

		var el = d.createElement ('div');
		el.setAttribute ('role', 'group');
		el.setAttribute ('aria-label', meterLabel () + (nch === 2 ? ' (L/R)' : ''));
		el.style.cssText = 'position:fixed;left:50%;bottom:calc(14px + env(safe-area-inset-bottom,0px));' +
			'transform:translateX(-50%);z-index:99998;display:flex;align-items:center;justify-content:center;' +
			'flex-wrap:wrap;gap:6px 8px;max-width:calc(100vw - 16px);box-sizing:border-box;' +
			'padding:6px 10px;background:rgba(10,10,10,.88);border:1px solid #263338;border-radius:6px;' +
			'font:10px/12px monospace;color:#b3b6b1;user-select:none';

		var time = d.createElement ('span');
		time.style.cssText = 'min-width:52px;color:#e8edf0;white-space:nowrap';
		var dot = d.createElement ('i');
		dot.style.cssText = 'display:inline-block;width:7px;height:7px;margin-right:5px;border-radius:50%;background:#d45b57;vertical-align:0';
		var time_txt = d.createTextNode ('0:00');
		time.appendChild (dot);
		time.appendChild (time_txt);

		/* [新增] 電平條區：立體聲時左邊多一欄 L / R 標示 */
		var bars_wrap = d.createElement ('div');
		bars_wrap.style.cssText = 'display:flex;align-items:center;gap:4px';
		var chs = [];
		var bars_col = d.createElement ('div');
		bars_col.style.cssText = 'display:flex;flex-direction:column;gap:2px';
		for (var ci = 0; ci < nch; ++ci) {
			var c = makeBar ( nch === 1 );
			chs.push ( c );
			bars_col.appendChild ( c.el );
		}
		if (nch === 2) {
			var lbls = d.createElement ('div');
			lbls.style.cssText = 'display:flex;flex-direction:column;gap:2px;font:8px/9px monospace;color:#6a7380';
			['L', 'R'].forEach(function ( t ) {
				var b2 = d.createElement ('b');
				b2.textContent = t;
				b2.style.cssText = 'display:block;height:9px;font-weight:normal';
				lbls.appendChild ( b2 );
			});
			bars_wrap.appendChild ( lbls );
		}
		bars_wrap.appendChild ( bars_col );

		var clip = d.createElement ('span');
		clip.textContent = 'CLIP';
		clip.style.cssText = 'padding:0 4px;border:1px solid #263338;border-radius:3px;color:#4d5250;cursor:pointer;white-space:nowrap';
		clip.title = cdText ('meter.clip_reset', 'Click to clear the clip light');

		var db = d.createElement ('span');
		db.style.cssText = 'min-width:44px;text-align:right';
		db.textContent = '-∞ dB';

		var mon = d.createElement ('span');
		mon.textContent = 'MON';
		mon.setAttribute ('role', 'button');
		mon.setAttribute ('aria-pressed', 'false');
		mon.title = cdText ('rec.monitor_tip', 'Monitor input (use headphones to avoid feedback)');
		mon.style.cssText = 'padding:0 5px;border:1px solid #263338;border-radius:3px;color:#8d9693;cursor:pointer';

		var gain_wrap = d.createElement ('span');
		gain_wrap.style.cssText = 'display:inline-flex;align-items:center;gap:5px;white-space:nowrap';
		var gain_txt = d.createElement ('span');
		gain_txt.style.cssText = 'min-width:50px;text-align:right';
		var gain = d.createElement ('input');
		gain.type = 'range';
		gain.min = '-12';
		gain.max = '24';
		gain.step = '1';
		gain.style.cssText = 'width:84px;margin:0;accent-color:#56dbe3;cursor:pointer';
		gain.title = cdText ('rec.gain_tip', 'Input gain (double-click to reset)');
		gain.setAttribute ('aria-label', gain.title);
		var gain_now = 0;
		try { gain_now = PKAE._deps.recPrefs.get ().gain || 0; } catch (e0) {}
		gain.value = String ( gain_now );
		gain_txt.textContent = fmtGain ( gain_now );
		gain_wrap.appendChild (gain_txt);
		gain_wrap.appendChild (gain);

		var hint = d.createElement ('div');
		hint.style.cssText = 'display:none;flex:0 0 100%;text-align:center;color:#d4bd54';
		hint.textContent = cdText ('rec.low_level', 'Input level is very low - check the microphone or raise the input gain');

		el.appendChild (time);
		el.appendChild (bars_wrap);
		el.appendChild (clip);
		el.appendChild (db);
		el.appendChild (mon);
		el.appendChild (gain_wrap);
		el.appendChild (hint);
		d.body.appendChild (el);

		var m = rec_meter = {
			el: el, ch: chs, clip: clip, db: db, hint: hint,
			time_txt: time_txt, sec: -1, hint_on: false, mon_on: false,
			max: 0, clips: 0, clips_shown: 0, clipped: false,
			t0: w.performance.now (), raf: 0
		};

		function clipOff () {
			m.clipped = false;
			m.clips = 0;
			m.clips_shown = 0;
			clip.textContent = 'CLIP';
			clip.style.color = '#4d5250';
			clip.style.borderColor = '#263338';
			clip.style.background = '';
		}
		clip.onclick = clipOff;

		mon.onclick = function () {
			m.mon_on = !m.mon_on;
			mon.setAttribute ('aria-pressed', m.mon_on ? 'true' : 'false');
			mon.style.background = m.mon_on ? '#56dbe3' : '';
			mon.style.color = m.mon_on ? '#0a0a0a' : '#8d9693';
			mon.style.borderColor = m.mon_on ? '#56dbe3' : '#263338';
			hooks.monitor && hooks.monitor ( m.mon_on );
		};

		function setGain ( v ) {
			v = Math.max (-12, Math.min (24, Math.round ( +v ) || 0));
			gain.value = String ( v );
			gain_txt.textContent = fmtGain ( v );
			hooks.gain && hooks.gain ( v );
		}
		gain.oninput = function () { setGain ( gain.value ); };
		gain.onchange = function () { gain.blur (); };
		gain.ondblclick = function () { setGain ( 0 ); };

		(function frame ( now ) {
			if (rec_meter !== m) return ;

			var hv = 0;
			for (var k = 0; k < m.ch.length; ++k) {
				var c = m.ch[k];
				var p = c.peak;
				c.peak = 0;
				var rms = c.n ? Math.sqrt (c.sq / c.n) : 0;
				c.sq = 0;
				c.n = 0;

				c.shown = p > c.shown ? p : c.shown * 0.85;
				c.rms_shown = rms > c.rms_shown ? rms : c.rms_shown * 0.92;
				if (p >= c.hold_v || now - c.hold_t > 1000) { c.hold_v = p; c.hold_t = now; }
				if (c.hold_v > hv) hv = c.hold_v;

				c.fill.style.transform = 'scaleX(' + meterPos ( c.shown ).toFixed (3) + ')';
				c.rms_el.style.transform = 'scaleX(' + meterPos ( c.rms_shown ).toFixed (3) + ')';
				c.hold.style.left = (meterPos ( c.hold_v ) * 100).toFixed (1) + '%';
			}
			m.db.textContent = hv > 0.0001 ? (20 * Math.log (hv) / Math.LN10).toFixed (1) + ' dB' : '-∞ dB';

			if (m.clips > 0 && m.clips !== m.clips_shown) {
				m.clips_shown = m.clips;
				m.clip.textContent = 'CLIP ×' + (m.clips > 9999 ? '9999+' : m.clips);
				if (!m.clipped) {
					m.clipped = true;
					m.clip.style.color = '#fff';
					m.clip.style.background = '#d45b57';
					m.clip.style.borderColor = '#d45b57';
				}
			}

			var elapsed = (w.performance.now () - m.t0) / 1000;
			if ((elapsed | 0) !== m.sec) {
				m.sec = elapsed | 0;
				m.time_txt.nodeValue = fmtTime ( elapsed );
			}

			var low = elapsed >= 4 && m.max < 0.0056;
			if (low !== m.hint_on) {
				m.hint_on = low;
				m.hint.style.display = low ? 'block' : 'none';
			}

			m.raf = w.requestAnimationFrame ( frame );
		})( 0 );
	}
	function meterClose () {
		if (!rec_meter) return ;
		var m = rec_meter;
		rec_meter = null;
		m.raf && w.cancelAnimationFrame ( m.raf );
		m.el.parentNode && m.el.parentNode.removeChild ( m.el );
	}
	function feedChannel ( m, c, input ) {
		var p = 0, sq = 0, cl = 0;
		for (var i = 0; i < input.length; ++i) {
			var x = input[i];
			var a = x < 0 ? -x : x;
			if (a > p) p = a;
			sq += x * x;
			if (a >= 0.999) ++cl;
		}
		if (p > c.peak) c.peak = p;
		if (p > m.max) m.max = p;
		c.sq += sq;
		c.n += input.length;
		m.clips += cl;
	}
	/* [修改] 立體聲時多收一個 input2（右聲道）；單聲道呼叫方式不變 */
	function meterFeed ( input, input2 ) {
		var m = rec_meter;
		if (!m) return ;
		feedChannel ( m, m.ch[0], input );
		if (input2 && m.ch[1]) feedChannel ( m, m.ch[1], input2 );
	}

	var PKREC = function ( app ) {
		var q = this;

		var media_stream_source = null;
		var audio_stream = null;
		var audio_context = null;
		var script_processor = null;
		var recorder_node = null;
		var monitor_node = null;
		var input_node = null;   /* [新增] 輸入增益 */
		var live_node = null;    /* [新增] 即時監聽（預設增益 0） */
		var wake_lock = null;    /* [新增] 錄音中保持螢幕不休眠 */
		var capture_opts = null;
		var capture_id = 0;

		var buffer_size = 2048 * 2;
		var channel_num = 1;
		var channel_num_out = 1;

		var is_active = false;
		var is_starting = false;
		var is_stopping = false;

		var starting_offset = 0;
		var ending_offset = 0;

		var sample_rate = 0;
		var source_sample_rate = 0;

		var temp_buffers = [];
		var temp_buffer_index = -1;
		var draw_samples = 0;
		var skip_samples = 0;
		var aggr = null;
		var aggr2 = null;        /* [新增] 右聲道的累積緩衝 */
		var aggr_i = 0;
		var rec_channels = 1;    /* [新增] 這次擷取實際的聲道數（1 或 2） */
		var temp_buffers_r = []; /* [新增] 單軌錄音的右聲道片段 */

		var end_record_func = null;
		var start_record_func = null;

		var curr_offset = 0;
		var first_skip = 1;

		function reportError ( error, cb ) {
			is_starting = false;
			meterClose ();
			stopCapture ();
			if (cb) {
				cb ( error );
				return ;
			}
			app.fireEvent ('ErrorRec');
			app.fireEvent ('ShowError', error && error.message ? error.message : 'No recording device found');
		}

		function flushAgg () {
			if (!aggr || !aggr_i || !capture_opts || !capture_opts.ondata) return ;
			capture_opts.ondata ( aggr.subarray (0, aggr_i).slice (0), aggr2 ? aggr2.subarray (0, aggr_i).slice (0) : undefined );
			aggr_i = 0;
		}

		/* [修改] 新增 input2：立體聲時的右聲道。ondata 的第二個參數就是右聲道（單聲道時為 undefined，舊的呼叫端忽略它即可） */
		function pushInput ( input, owned, input2 ) {
			if (!capture_opts || !capture_opts.ondata || !input) return ;
			if (rec_channels < 2) input2 = null;
			else if (!input2 || input2.length !== input.length) input2 = input;   /* 保險：右聲道缺資料就複製左聲道 */

			meterFeed ( input, input2 );

			var size = capture_opts.chunkSize || buffer_size;
			if (input.length === size && !aggr_i) {
				capture_opts.ondata (
					owned ? input : input.slice (0),
					input2 ? (owned && input2 !== input ? input2 : input2.slice (0)) : undefined
				);
				return ;
			}
			if (!aggr || aggr.length !== size) {
				aggr = new Float32Array ( size );
				aggr2 = input2 ? new Float32Array ( size ) : null;
			}

			for (var off = 0; off < input.length;) {
				var n = Math.min (size - aggr_i, input.length - off);
				aggr.set (input.subarray (off, off + n), aggr_i);
				if (aggr2) aggr2.set (input2.subarray (off, off + n), aggr_i);
				aggr_i += n;
				off += n;
				if (aggr_i === size) {
					capture_opts.ondata ( aggr, aggr2 || undefined );
					aggr = new Float32Array ( size );
					aggr2 = input2 ? new Float32Array ( size ) : null;
					aggr_i = 0;
				}
			}
		}

		/* [新增] AudioWorklet 傳回來的資料：單聲道是 Float32Array，立體聲是 [左, 右] */
		function onWorkletData ( data ) {
			if (data === 0) return ;
			if (Array.isArray ( data )) pushInput ( data[0], true, data[1] );
			else pushInput ( data, true );
		}

		/* [修改] 訊號路徑：來源 → 輸入增益 → 錄音節點（→ 靜音節點，維持處理）
		 *                         └→ 監聽節點（預設 0）→ 喇叭 */
		function connectNode () {
			input_node = audio_context.createGain ();
			input_node.gain.value = dbToLin ( PKAE._deps.recPrefs.get ().gain );
			live_node = audio_context.createGain ();
			live_node.gain.value = 0;
			monitor_node = audio_context.createGain ();
			monitor_node.gain.value = 0;
			media_stream_source.connect ( input_node );
			input_node.connect ( recorder_node );
			recorder_node.connect ( monitor_node );
			monitor_node.connect ( audio_context.destination );
			input_node.connect ( live_node );
			live_node.connect ( audio_context.destination );
		}

		/* [新增] 電平表上的增益滑桿／MON 鈕會呼叫這兩個 */
		function hookGain ( db ) {
			PKAE._deps.recPrefs.set ('gain', db);
			if (input_node && audio_context)
				input_node.gain.setTargetAtTime ( dbToLin ( PKAE._deps.recPrefs.get ().gain ), audio_context.currentTime, 0.01 );
		}
		function hookMonitor ( on ) {
			if (live_node) live_node.gain.value = on ? 1 : 0;
		}

		/* [新增] 螢幕喚醒鎖：手機錄音時螢幕休眠會讓錄音被系統中斷 */
		function onVisible () {
			if (d.visibilityState === 'visible' && is_active && !wake_lock) lockScreen ();
		}
		function lockScreen () {
			try {
				if (!navigator.wakeLock || !navigator.wakeLock.request) return ;
				d.addEventListener ('visibilitychange', onVisible);
				navigator.wakeLock.request ('screen').then(function ( l ) {
					if (!is_active) { l.release (); return ; }
					wake_lock = l;
					l.addEventListener && l.addEventListener ('release', function () { if (wake_lock === l) wake_lock = null; });
				}).catch(function () {});
			} catch (e) {}
		}
		function unlockScreen () {
			d.removeEventListener ('visibilitychange', onVisible);
			if (wake_lock) { try { wake_lock.release (); } catch (e) {} wake_lock = null; }
		}

		/* [新增] 錄音中麥克風被拔除／被系統收回：自動停止並「保留已錄到的內容」 */
		function onDeviceLost ( id ) {
			if (id !== capture_id || !is_active) return ;
			var cb = capture_opts && capture_opts.onended;
			if (cb) cb ();
			else app.fireEvent ('RequestActionRecordStop');
			if (w.OneUp) w.OneUp ( cdText ('rec.device_lost', 'Recording device disconnected - the audio recorded so far was kept'), 3200 );
		}

		function startScriptNode () {
			/* [修改] 輸入聲道數跟著這次擷取的聲道數（原本固定 channel_num = 1） */
			script_processor = audio_context.createScriptProcessor (
				buffer_size, rec_channels, channel_num_out
			);
			recorder_node = script_processor;
			/* [修改] ScriptProcessor 開頭幾個緩衝區可能帶有雜訊，改由這裡丟棄（原本由呼叫端丟 8 個）；
			 * AudioWorklet 沒有這個問題，所以呼叫端只需丟 1 個。 */
			var warm = 6;
			script_processor.onaudioprocess = function ( ev ) {
				if (warm > 0) { --warm; return ; }
				pushInput ( ev.inputBuffer.getChannelData (0), false,
					rec_channels > 1 ? ev.inputBuffer.getChannelData (1) : undefined );
			};
			connectNode ();
		}

		function startWorkletNode () {
			recorder_node = new w.AudioWorkletNode (audio_context, 'pk-recorder', {
				numberOfInputs: 1,
				numberOfOutputs: 1,
				outputChannelCount: [1],
				/* [修改] 單聲道：輸入強制混成單聲道；立體聲：保留 2 聲道 */
				channelCount: rec_channels,
				channelCountMode: 'explicit',
				processorOptions: {size: capture_opts.chunkSize || buffer_size, channels: rec_channels}
			});
			recorder_node._pk_wk = true;
			recorder_node.port.onmessage = function ( ev ) { onWorkletData ( ev.data ); };
			connectNode ();
		}

		function loadWorklet () {
			if (!audio_context.audioWorklet || !w.AudioWorkletNode)
				return Promise.reject ();
			if (!audio_context._pk_rec_wk)
				audio_context._pk_rec_wk = audio_context.audioWorklet.addModule ('recorder-worklet.js');
			return audio_context._pk_rec_wk;
		}

		this.startCapture = function ( opts ) {
			if (is_active || is_starting || is_stopping) return false;
			opts = opts || {};
			if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia || !opts.ctx) {
				reportError ( null, opts.onerror );
				return false;
			}

			audio_context = opts.ctx;
			audio_context.resume && audio_context.resume ();
			capture_opts = opts;
			source_sample_rate = audio_context.sampleRate;
			is_starting = true;
			aggr = null;
			aggr2 = null;
			aggr_i = 0;
			rec_channels = 1;
			var want_channels = opts.channels === 2 ? 2 : 1;   /* [新增] 呼叫端想要的聲道數 */

			var id = ++capture_id;
			var audio_constraints = PKAE._deps.recPrefs.audioConstraints ( want_channels );
			navigator.mediaDevices.getUserMedia ({
				audio: audio_constraints,
				video: false
			}).then(function ( stream ) {
				if (id !== capture_id) {
					stream.getTracks ().forEach (function ( t ) { t.stop (); });
					return ;
				}
				audio_stream = stream;
				/* [新增] 實際聲道數：想要立體聲、且裝置沒有明確回報「只有 1 聲道」才用 2 聲道 */
				var got = 0;
				try { got = stream.getAudioTracks ()[0].getSettings ().channelCount || 0; } catch (e0) {}
				rec_channels = (want_channels === 2 && got !== 1) ? 2 : 1;
				/* [新增] 裝置中斷偵測 */
				stream.getAudioTracks ().forEach(function ( tr ) {
					tr.onended = function () { onDeviceLost ( id ); };
				});
				media_stream_source = audio_context.createMediaStreamSource ( stream );
				return loadWorklet ().then ( startWorkletNode, startScriptNode );
			}).then(function () {
				if (id !== capture_id || !recorder_node) return ;
				is_starting = false;
				is_active = true;
				meterOpen ({ gain: hookGain, monitor: hookMonitor }, rec_channels);  /* [修改] 多傳聲道數 */
				lockScreen ();                                          /* [新增] */
				capture_opts.onstart && capture_opts.onstart ();
			}).catch(function ( error ) {
				if (id === capture_id) reportError ( error, opts.onerror );
			});

			return true;
		};

		function finishCapture ( done ) {
			flushAgg ();
			meterClose ();
			unlockScreen ();   /* [新增] */

			if (script_processor) script_processor.onaudioprocess = null;
			if (recorder_node && recorder_node.port) recorder_node.port.onmessage = null;
			if (recorder_node) { try { recorder_node.disconnect (); } catch (e) {} }
			if (monitor_node) { try { monitor_node.disconnect (); } catch (e2) {} }
			if (input_node) { try { input_node.disconnect (); } catch (e4) {} }   /* [新增] */
			if (live_node) { try { live_node.disconnect (); } catch (e5) {} }     /* [新增] */
			if (media_stream_source) { try { media_stream_source.disconnect (); } catch (e3) {} }
			if (audio_stream) {
				audio_stream.getTracks ().forEach(function ( stream ) {
					stream.onended = null;   /* [新增] */
					stream.stop ();
				});
			}

			media_stream_source = null;
			audio_stream = null;
			script_processor = null;
			recorder_node = null;
			monitor_node = null;
			input_node = null;   /* [新增] */
			live_node = null;    /* [新增] */
			capture_opts = null;
			aggr = null;
			aggr2 = null;
			aggr_i = 0;
			is_stopping = false;
			done && done ();
		}

		function stopCapture ( done ) {
			if (is_stopping) return ;
			++capture_id;
			is_starting = false;
			is_active = false;
			is_stopping = true;

			if (recorder_node && recorder_node._pk_wk && recorder_node.port) {
				var did = false;
				recorder_node.port.onmessage = function ( ev ) {
					if (ev.data === 0) {
						if (did) return ;
						did = true;
						finishCapture ( done );
					}
					else onWorkletData ( ev.data );   /* [修改] 支援立體聲資料 */
				};
				recorder_node.port.postMessage (0);
				w.setTimeout(function () {
					if (did) return ;
					did = true;
					finishCapture ( done );
				}, 60);
				return ;
			}

			finishCapture ( done );
		}

		this.stopCapture = stopCapture;
		this.channels = function () { return rec_channels; };   /* [新增] 目前（或最近一次）擷取的實際聲道數 */

		/* [修改] 多收 float_array_r（右聲道，立體聲才有） */
		function fetchBufferFunction ( float_array, float_array_r ) {
			if (skip_samples > 0) {
				skip_samples -= float_array.length;
				return ;
			}

			curr_offset += float_array.length / source_sample_rate * sample_rate;
			if (ending_offset <= curr_offset) {
				ending_offset > 0 && q.stop ();
				return ;
			}

			temp_buffers[ ++temp_buffer_index ] = float_array;
			if (float_array_r) temp_buffers_r[ temp_buffer_index ] = float_array_r;   /* [新增] */
			draw_samples += float_array.length;

			if (temp_buffer_index === 0 || draw_samples >= buffer_size * 4) {
				requestAnimationFrame(function () {
					draw_samples = 0;
					app.engine.wavesurfer.DrawTemp ( starting_offset, temp_buffers );
				});
			}
		}

		this.isActive = function () {
			return (is_active || is_starting);
		};

		this.setEndingOffset = function ( ending_offset_seconds ) {
			ending_offset = ending_offset_seconds;
		};

		this.start = function ( _at_offset, _end_callback, _start_callback, _sample_rate ) {
			if (is_active || is_starting) return (false);

			starting_offset = _at_offset / 1;
			if (isNaN (starting_offset) || !starting_offset) starting_offset = 0;
			curr_offset = starting_offset;

			audio_context = app.engine.wavesurfer.backend.getAudioContext ();
			if (!audio_context) {
				app.fireEvent ('ErrorRec');
				app.fireEvent ('ShowError', 'No recording device found');
				return (false);
			}

			if (audio_context.currentTime === 0) {
				app.engine.wavesurfer.backend.source.start (0);
				app.engine.wavesurfer.backend.source.stop (0);
				app.engine.wavesurfer.backend.createSource ();
			}

			sample_rate = _sample_rate || (
				app.engine.wavesurfer.backend.buffer ?
					app.engine.wavesurfer.backend.buffer.sampleRate :
					audio_context.sampleRate
			);
			source_sample_rate = audio_context.sampleRate;
			skip_samples = first_skip * buffer_size;
			draw_samples = 0;

			end_record_func = function (offset, buffers, _callback) {
				async function downsampleAudioBuffer ( buffers, sourceSampleRate, targetSampleRate ) {
					var totalLength = buffers.reduce(function (sum, buf) {
						return sum + buf.length;
					}, 0);
					var concatenated = new Float32Array ( totalLength );
					var off = 0;
					for (var i = 0; i < buffers.length; ++i) {
						concatenated.set (buffers[i], off);
						off += buffers[i].length;
					}

					var OfflineCtx = w.OfflineAudioContext || w.webkitOfflineAudioContext;
					var audioBuffer = new OfflineCtx (1, totalLength, sourceSampleRate)
						.createBuffer (1, totalLength, sourceSampleRate);
					audioBuffer.copyToChannel (concatenated, 0, 0);

					var duration = audioBuffer.duration;
					var newLength = Math.ceil (duration * targetSampleRate);
					var offlineCtx = new OfflineCtx (1, newLength, targetSampleRate);
					var source = offlineCtx.createBufferSource ();
					source.buffer = audioBuffer;
					source.connect (offlineCtx.destination);
					source.start (0);

					var renderedBuffer = await offlineCtx.startRendering ();
					return renderedBuffer.getChannelData (0);
				}

				/* [修改] 沒有資料（取消或一按就停）時不必重取樣；原本取樣率不同時會誤報「無法重取樣」且流程沒走完 */
				if (source_sample_rate === sample_rate || !buffers) {
					_callback ();
					_end_callback (offset, buffers);
					return ;
				}

				/* [修改] 立體聲：左右聲道各自重取樣，結果一樣用 .right 帶回去 */
				var jobs = [ downsampleAudioBuffer (buffers, source_sample_rate, sample_rate) ];
				if (buffers.right) jobs.push ( downsampleAudioBuffer (buffers.right, source_sample_rate, sample_rate) );

				Promise.all ( jobs ).then(function ( res ) {
					var out = [ res[0] ];
					if (res[1]) out.right = [ res[1] ];
					_callback ();
					_end_callback (offset, out);
				}).catch(function () {
					_callback ();
					app.fireEvent ('ShowError', 'Could not resample recording');
				});
			};
			start_record_func = _start_callback;

			/* [新增] 只有「偏好設為立體聲」且「目前文件是立體聲」才錄立體聲，其餘維持原本的單聲道 */
			var doc_buf = app.engine.wavesurfer.backend.buffer;
			var want_stereo = PKAE._deps.recPrefs.get ().channels === 2 && !!doc_buf && doc_buf.numberOfChannels >= 2;
			temp_buffers_r = [];

			return q.startCapture ({
				ctx: audio_context,
				channels: want_stereo ? 2 : 1,
				chunkSize: buffer_size,
				ondata: fetchBufferFunction,
				onstart: function () {
					start_record_func && start_record_func ();
				},
				onerror: function ( error ) {
					app.fireEvent ('ErrorRec');
					if (error && error.message) app.fireEvent ('ShowError', error.message);
					else app.fireEvent ('ShowError', 'No recording device found');
				}
			});
		};

		this.stop = function ( cancel_recording ) {
			if (!is_active && !is_starting) return ;

			stopCapture (function () {
				app.engine.wavesurfer.DrawTemp ( null );

				/* [新增] 立體聲：右聲道片段掛在 .right 上，ReplaceFloatArrays（actions.js）會認得 */
				if (temp_buffers_r.length === temp_buffers.length && temp_buffers_r.length > 0)
					temp_buffers.right = temp_buffers_r;

				if (temp_buffers.length > 0 && !cancel_recording)
					end_record_func && end_record_func ( starting_offset / sample_rate, temp_buffers, function () {});
				else
					end_record_func && end_record_func ( null, null, function () {});

				sample_rate = 0;
				source_sample_rate = 0;
				first_skip = 1;
				draw_samples = 0;
				skip_samples = 0;
				temp_buffer_index = -1;
				starting_offset = ending_offset = 0;
				temp_buffers = [];
				temp_buffers_r = [];   /* [新增] */
				audio_context = null;
				end_record_func = start_record_func = null;
			});
		};
	};

	PKAE._deps.rec = PKREC;

})( window, document, PKAudioEditor );


