/* ==========================================================================
 * practice-live.js  —  播放時即時變速／變調，可循環（抄譜練習）
 *
 * 分工
 *   timepitch-live-worklet.js   AudioWorklet 內的 WSOLA 引擎（真正算聲音的地方）
 *   本檔                        ① LiveSource：假裝成 AudioBufferSourceNode，把音訊分段餵給 worklet
 *                               ② 「練習速度」面板（速度、移調、模式、漸進加速）
 *                               ③ 對外事件，之後快捷鍵與選單（5-3）直接接這些事件
 *
 * 後端接法（wavesurfer.js 的 WebAudio）
 *   backend.setLive ({ tempo, semis, keep })   設定即時速度／移調，播放中也能改
 *   backend.createSource ()                    live 開啟時改回傳 LiveSource（其餘播放流程一概不動）
 *   backend.playbackRate                       即時變速時等於 tempo，游標位置與循環計時沿用原本公式
 *   keep = true   保持音高（worklet，WSOLA）；keep = false  磁帶式（原生 playbackRate，音高跟著變）
 *
 * 事件（app.fireEvent）
 *   RequestPracticeUI                          開／關面板
 *   RequestPracticeSet  { tempo?, semis?, keep? }
 *   RequestPracticeNudge { tempo?: ±%, semis?: ±半音 }    例如 { tempo: -5 }
 *   RequestPracticeSlowToggle  { tempo? }      在「目前速度」與 100% 間切換（預設慢到 70%）
 *   RequestPracticeReset
 *   DidPracticeChange  { tempo, semis, keep }  狀態改變後送出
 *
 * 載入位置：timepitch-engine 之後、ui-fx-timepitch 之前；index.html 在 init 後呼叫
 *           PKPracticeLive.attach ( editor )
 * ========================================================================== */
(function ( w, d, PKAE ) {
	'use strict';

	var WORKLET = 'timepitch-live-worklet.js?v=tp10';
	var CHUNK_S = 1, AHEAD_S = 4, FIRST_S = 1.5;
	var T_MIN = 0.25, T_MAX = 2, S_MIN = -12, S_MAX = 12;

	function clamp ( v, lo, hi ) { return v < lo ? lo : v > hi ? hi : v; }
	function tf ( key, zh, en ) {
		try {
			var s = PKLocale.t ( key );
			if (s && s !== key) return s;
			return PKLocale.getLang () === 'en' ? en : zh;
		} catch (e) { return zh; }
	}
	function lsGet ( k, def ) { try { var v = w.localStorage.getItem ( k ); return v === null ? def : v; } catch (e) { return def; } }
	function lsSet ( k, v ) { try { w.localStorage.setItem ( k, v ); } catch (e) {} }

	/* ---------- worklet 載入（每個 AudioContext 只載一次） ---------- */
	function ensure ( ac ) {
		if (!ac || !ac.audioWorklet || !w.AudioWorkletNode) return Promise.reject ( new Error ('no audioworklet') );
		if (!ac._pk_live) {
			ac._pk_live = ac.audioWorklet.addModule ( WORKLET );
			ac._pk_live.catch ( function () { ac._pk_live = null; } );	/* 失敗可以重試 */
		}
		return ac._pk_live;
	}

	/* ---------- LiveSource：長得像 AudioBufferSourceNode，後端不用知道差別 ---------- */
	function LiveSource ( ac, buffer, live ) {
		this.ac = ac; this.buffer = buffer; this.live = live;
		this.loop = false; this.loopStart = 0; this.loopEnd = 0;
		this.node = null; this.dest = null; this.dead = false;
		this.playbackRate = { value: 1, setValueAtTime: function () {} };
		this.pos = 0; this.ls = 0; this.le = 0; this.re = 0;
		this.fed = 0; this.eofSent = false; this.chs = null;
	}
	LiveSource.prototype = {
		constructor: LiveSource,
		connect: function ( n ) { this.dest = n; if (this.node) this.node.connect ( n ); },
		disconnect: function () { this._kill (); },
		stop: function () { this._kill (); },
		_kill: function () {
			this.dead = true;
			var n = this.node;
			if (!n) return ;
			this.node = null;
			try { n.port.postMessage ({ t: 'x' }); } catch (e) {}
			try { n.port.onmessage = null; } catch (e) {}
			try { n.disconnect (); } catch (e) {}
		},
		setParams: function ( tempo, semis ) {
			if (this.node) this.node.port.postMessage ({ t: 'p', tempo: tempo, semis: semis });
		},
		/* 從來源取 n 個取樣；循環時在區間尾接回區間頭，所以 worklet 看到的是一條連續串流 */
		_gather: function ( n ) {
			var nch = this.chs.length, out = [], c;
			for (c = 0; c < nch; ++c) out.push ( new Float32Array ( n ) );
			var filled = 0;
			while (filled < n) {
				if (this.pos >= this.re) {
					if (this.loop && this.le > this.ls) this.pos = this.ls; else break;
				}
				var take = Math.min ( n - filled, this.re - this.pos );
				for (c = 0; c < nch; ++c) out[ c ].set ( this.chs[ c ].subarray ( this.pos, this.pos + take ), filled );
				filled += take; this.pos += take;
			}
			if (filled < n) for (c = 0; c < nch; ++c) out[ c ] = out[ c ].slice ( 0, filled );
			return { ch: out, n: filled, last: !this.loop && this.pos >= this.re };
		},
		_topUp: function ( consumed ) {
			var sr = this.buffer.sampleRate, node = this.node;
			var guard = 0;
			while (node && !this.eofSent && (this.fed - consumed) / sr < AHEAD_S && guard++ < 8) {
				var g = this._gather ( Math.round ( CHUNK_S * sr ) );
				if (g.n) {
					node.port.postMessage ({ t: 'c', ch: g.ch }, g.ch.map ( function ( a ) { return a.buffer; } ));
					this.fed += g.n;
				}
				if (g.last || !g.n) { node.port.postMessage ({ t: 'e' }); this.eofSent = true; }
			}
		},
		start: function ( when, offset, duration ) {
			if (this.dead || this.node || duration === 0) return ;		/* start(0,0,0) 是後端預熱用的，不必真的播 */
			var buf = this.buffer, sr = buf.sampleRate, len = buf.length;
			var nch = Math.min ( 2, buf.numberOfChannels );
			this.chs = [];
			for (var c = 0; c < nch; ++c) this.chs.push ( buf.getChannelData ( c ) );

			var rs = clamp ( Math.round ( (offset || 0) * sr ), 0, len );
			if (this.loop && this.loopEnd > this.loopStart) {
				this.ls = clamp ( Math.round ( this.loopStart * sr ), 0, len - 1 );
				this.le = clamp ( Math.round ( this.loopEnd * sr ), this.ls + 1, len );
				this.re = this.le;
				this.pos = clamp ( rs, this.ls, this.le - 1 );
			} else {
				this.loop = false;
				this.re = duration > 0 ? Math.min ( len, rs + Math.round ( duration * sr ) ) : len;
				this.pos = rs;
			}
			if (this.pos >= this.re) return ;

			var first = this._gather ( Math.round ( FIRST_S * sr ) );
			this.fed = first.n;
			this.eofSent = !!first.last;
			var self = this;
			var node = new AudioWorkletNode ( this.ac, 'pk-live', {
				numberOfInputs: 0, numberOfOutputs: 1, outputChannelCount: [ nch ],
				processorOptions: { nch: nch, srcRate: sr, tempo: this.live.tempo, semis: this.live.semis, chs: first.ch, eof: this.eofSent }
			});
			node.port.onmessage = function ( e ) {
				var m = e.data || {};
				if (m.t === 's' && !self.dead) self._topUp ( m.a );
				else if (m.t === 'f') self._kill ();
			};
			this.node = node;
			if (this.dest) node.connect ( this.dest );
		}
	};

	function makeSource ( ac, buffer, live ) { return new LiveSource ( ac, buffer, live ); }

	/* ==========================================================================
	 * 控制器與面板
	 * ========================================================================== */
	var CSS =
		'.pk_practice.pk_act{background:linear-gradient(180deg,var(--ac) 0%,#2a8f99 100%)!important;color:var(--ac-ink,#041014)!important}' +
		'.pk_prac{position:fixed;z-index:30;width:296px;box-sizing:border-box;padding:12px 14px 12px;color:var(--fg-0,#e8edf0);' +
			'background:var(--bg-1,#0e1013);border:1px solid var(--bd-h,rgba(90,242,255,.4));border-radius:var(--r-lg,8px);' +
			'box-shadow:0 12px 32px rgba(0,0,0,.6);font:13px/1.4 var(--ff,system-ui,sans-serif);user-select:none}' +
		'.pk_prac *{box-sizing:border-box}' +
		'.pk_prac_h{display:flex;align-items:center;justify-content:space-between;margin-bottom:6px}' +
		'.pk_prac_h b{font-weight:600;letter-spacing:.02em}' +
		'.pk_prac_x{cursor:pointer;color:var(--fg-1,#9aa3ad);padding:0 6px;font-size:16px;line-height:20px;border-radius:4px}' +
		'.pk_prac_x:hover{color:var(--fg-0,#e8edf0);background:var(--bg-3,#1c2026)}' +
		'.pk_prac_big{display:flex;align-items:baseline;gap:8px;margin:2px 0 4px}' +
		'.pk_prac_big span:first-child{font:600 34px/1 var(--ff-mono,monospace);color:var(--ac,#5af2ff)}' +
		'.pk_prac_big span:last-child{color:var(--fg-1,#9aa3ad);font-size:12px}' +
		'.pk_prac input[type=range]{width:100%;margin:6px 0 8px}' +
		'.pk_prac_row{display:flex;align-items:center;gap:6px;margin:6px 0;flex-wrap:wrap}' +
		'.pk_prac_row>label{min-width:52px;color:var(--fg-1,#9aa3ad);font-size:12px}' +
		'.pk_prac_b{cursor:pointer;min-width:40px;text-align:center;padding:3px 8px;border:1px solid var(--bd,rgba(255,255,255,.07));' +
			'border-radius:var(--r-md,4px);background:var(--bg-2,#14171c);color:var(--fg-0,#e8edf0);font-size:12px}' +
		'.pk_prac_b:hover{border-color:var(--bd-h,rgba(90,242,255,.4))}' +
		'.pk_prac_b.pk_on{background:var(--ac-soft,rgba(90,242,255,.12));border-color:var(--ac,#5af2ff);color:var(--ac,#5af2ff)}' +
		'.pk_prac_b.pk_off{opacity:.35;pointer-events:none}' +
		'.pk_prac select,.pk_prac input[type=number]{height:24px;background:var(--bg-0,#07080a);color:var(--fg-0,#e8edf0);' +
			'border:1px solid var(--bd,rgba(255,255,255,.07));border-radius:var(--r-md,4px);font-size:12px;padding:0 4px}' +
		'.pk_prac input[type=number]{width:50px}' +
		'.pk_prac_semi{min-width:42px;text-align:center;font:600 13px var(--ff-mono,monospace)}' +
		'.pk_prac_st{min-height:18px;margin-top:6px;font-size:11px;color:var(--fg-2,#6a7380)}' +
		'.pk_prac_st.pk_warn{color:var(--warn,#f5c542)}' +
		'.pk_prac hr{border:0;border-top:1px solid var(--bd,rgba(255,255,255,.07));margin:8px 0}';

	function attach ( app ) {
		if (!app || app._prAttached) return ;
		app._prAttached = true;

		var st = d.createElement ('style');
		st.textContent = CSS;
		d.head.appendChild ( st );

		var S = { tempo: 1, semis: 0, keep: true };
		var TR = { on: false, every: 3, add: 5, to: 100, n: 0, prev: -1 };
		try {
			var sv = JSON.parse ( lsGet ('pk_prac', '{}') ) || {};
			if (sv.keep === false) S.keep = false;
			if (sv.tr) { TR.every = clamp ( sv.tr.every | 0 || 3, 1, 99 ); TR.add = clamp ( +sv.tr.add || 5, 1, 50 ); TR.to = clamp ( +sv.tr.to || 100, 30, 200 ); }
		} catch (e) {}
		function save () { lsSet ('pk_prac', JSON.stringify ({ keep: S.keep, tr: { every: TR.every, add: TR.add, to: TR.to } })); }

		var slow_prev = 0.7, notice = '', busy = 0;
		var pop = null, el = {};

		function ws () { return app.engine && app.engine.wavesurfer; }
		function be () { var x = ws (); return x && x.backend; }
		function mtOn () { var m = app.multitrack; return !!(m && m.IsOn && m.IsOn ()); }
		function pct ( t ) { return Math.round ( t * 100 ); }

		/* ---------- 把狀態交給後端 ---------- */
		function push () {
			var b = be ();
			if (!b || !b.setLive) return ;
			var token = ++busy;
			var want = { tempo: S.tempo, semis: S.keep ? S.semis : 0, keep: S.keep };
			var p = b.setLive ( want );
			(p && p.then ? p : Promise.resolve ( true )).then ( function ( okk ) {
				if (token !== busy) return ;
				if (okk === false) {
					/* 沒有 AudioWorklet（例如用 file:// 開、或瀏覽器太舊）：退回磁帶式，仍能練習 */
					notice = tf ('pr.no_worklet', '此瀏覽器或開啟方式不支援「保持音高」的即時變速（需要 https 或 localhost），已改用磁帶式', 'Live pitch-preserving speed is not available here (needs https or localhost). Using tape style.');
					S.keep = false; S.semis = 0;
					b.setLive ({ tempo: S.tempo, semis: 0, keep: false });
				} else notice = '';
				refresh ();
			});
		}

		function changed () {
			TR.n = 0; TR.prev = -1;
			push ();
			refresh ();
			app.fireEvent ('DidPracticeChange', { tempo: S.tempo, semis: S.semis, keep: S.keep });
		}

		function setState ( o, quiet ) {
			if (!o) return ;
			if (o.tempo !== undefined && isFinite ( o.tempo )) S.tempo = Math.round ( clamp ( +o.tempo, T_MIN, T_MAX ) * 1000 ) / 1000;
			if (o.semis !== undefined && isFinite ( o.semis )) S.semis = clamp ( Math.round ( +o.semis ), S_MIN, S_MAX );
			if (o.keep !== undefined) { S.keep = !!o.keep; if (!S.keep) S.semis = 0; save (); }
			if (quiet) { push (); refresh (); return ; }
			changed ();
		}

		/* ---------- 面板 ---------- */
		function esc ( s ) { return String ( s ).replace ( /[&<>"]/g, function ( c ) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[ c ]; }); }

		function buildPanel () {
			pop = d.createElement ('div');
			pop.className = 'pk_prac';
			pop.setAttribute ('role', 'dialog');
			pop.setAttribute ('aria-label', tf ('pr.title', '練習速度', 'Practice speed'));
			var presets = [50, 60, 70, 80, 90, 100].map ( function ( p ) {
				return '<a class="pk_prac_b" data-p="' + p + '">' + p + '%</a>';
			}).join ('');
			pop.innerHTML =
				'<div class="pk_prac_h"><b>' + esc ( tf ('pr.title', '練習速度', 'Practice speed') ) + '</b><span class="pk_prac_x" data-k="x" title="' + esc ( tf ('pr.close', '關閉', 'Close') ) + '">×</span></div>' +
				'<div class="pk_prac_big"><span data-k="big">100%</span><span data-k="sub"></span></div>' +
				'<input type="range" class="pk_horiz" data-k="sl" min="25" max="200" step="1" value="100">' +
				'<div class="pk_prac_row">' +
					'<a class="pk_prac_b" data-n="-5">−5</a><a class="pk_prac_b" data-n="-1">−1</a>' +
					'<a class="pk_prac_b" data-n="1">+1</a><a class="pk_prac_b" data-n="5">+5</a>' +
					'<a class="pk_prac_b" data-k="reset" style="margin-left:auto">' + esc ( tf ('pr.reset', '100%', '100%') ) + '</a></div>' +
				'<div class="pk_prac_row">' + presets + '</div>' +
				'<hr>' +
				'<div class="pk_prac_row"><label>' + esc ( tf ('pr.mode', '模式', 'Mode') ) + '</label>' +
					'<select data-k="mode" style="flex:1"><option value="1">' + esc ( tf ('pr.m_keep', '保持音高（獨立）', 'Keep pitch') ) + '</option>' +
					'<option value="0">' + esc ( tf ('pr.m_tape', '磁帶式（音高跟著變）', 'Tape (pitch follows)') ) + '</option></select></div>' +
				'<div class="pk_prac_row"><label>' + esc ( tf ('pr.semis', '移調', 'Pitch') ) + '</label>' +
					'<a class="pk_prac_b" data-s="-1">−</a><span class="pk_prac_semi" data-k="semi">0</span><a class="pk_prac_b" data-s="1">+</a>' +
					'<span style="color:var(--fg-2,#6a7380);font-size:12px">' + esc ( tf ('pr.semi_unit', '半音', 'semitones') ) + '</span>' +
					'<a class="pk_prac_b" data-s="0" style="margin-left:auto">0</a></div>' +
				'<hr>' +
				'<div class="pk_prac_row"><label style="min-width:auto"><input type="checkbox" data-k="tr_on"> ' + esc ( tf ('pr.trainer', '漸進加速', 'Speed trainer') ) + '</label></div>' +
				'<div class="pk_prac_row" data-k="tr_row" style="color:var(--fg-1,#9aa3ad);font-size:12px">' +
					esc ( tf ('pr.tr_every', '每循環', 'every') ) + ' <input type="number" data-k="tr_every" min="1" max="99" step="1"> ' + esc ( tf ('pr.tr_times', '次，加', 'loops, +') ) +
					' <input type="number" data-k="tr_add" min="1" max="50" step="1">% ' + esc ( tf ('pr.tr_to', '到', 'to') ) +
					' <input type="number" data-k="tr_to" min="30" max="200" step="5">%</div>' +
				'<div class="pk_prac_st" data-k="msg"></div>';
			d.body.appendChild ( pop );
			var q = pop.querySelectorAll ('[data-k]');
			for (var i = 0; i < q.length; ++i) el[ q[ i ].getAttribute ('data-k') ] = q[ i ];

			pop.addEventListener ('click', function ( e ) {
				var t = e.target.closest ? e.target.closest ('a,.pk_prac_x') : null;
				if (!t) return ;
				var k = t.getAttribute ('data-k');
				if (k === 'x') return close ();
				if (k === 'reset') return setState ({ tempo: 1 });
				if (t.hasAttribute ('data-p')) return setState ({ tempo: +t.getAttribute ('data-p') / 100 });
				if (t.hasAttribute ('data-n')) return nudge ({ tempo: +t.getAttribute ('data-n') });
				if (t.hasAttribute ('data-s')) {
					var s = +t.getAttribute ('data-s');
					return s === 0 ? setState ({ semis: 0 }) : nudge ({ semis: s });
				}
			});
			el.sl.addEventListener ('input', function () { setState ({ tempo: +this.value / 100 }); });
			el.mode.addEventListener ('change', function () { setState ({ keep: this.value === '1' }); });
			el.tr_on.addEventListener ('change', function () { TR.on = this.checked; TR.n = 0; TR.prev = -1; refresh (); });
			[['tr_every', 'every', 1, 99], ['tr_add', 'add', 1, 50], ['tr_to', 'to', 30, 200]].forEach ( function ( r ) {
				el[ r[0] ].addEventListener ('change', function () {
					var v = clamp ( Math.round ( +this.value || TR[ r[1] ] ), r[2], r[3] );
					TR[ r[1] ] = v; this.value = v; TR.n = 0; save ();
				});
			});
			/* 輸入欄位裡打字不要觸發編輯器的快捷鍵 */
			pop.addEventListener ('keydown', function ( e ) {
				var tg = e.target && e.target.tagName;
				if (e.key === 'Escape') { e.stopPropagation (); close (); return ; }
				if (tg === 'INPUT' && e.target.type === 'number' || tg === 'SELECT') e.stopPropagation ();
			});
		}

		function place () {
			if (!pop) return ;
			var btn = null, all = d.querySelectorAll ('.pk_practice');
			for (var i = 0; i < all.length; ++i) { if (all[ i ].offsetParent !== null) { btn = all[ i ]; break; } }
			var r = btn ? btn.getBoundingClientRect () : { left: w.innerWidth / 2 - 148, bottom: 60, width: 0 };
			var wd = 296, x = clamp ( r.left + r.width / 2 - wd / 2, 8, Math.max ( 8, w.innerWidth - wd - 8 ) );
			pop.style.left = x + 'px';
			pop.style.top = Math.min ( r.bottom + 8, Math.max ( 8, w.innerHeight - pop.offsetHeight - 8 ) ) + 'px';
		}

		function onDocDown ( e ) {
			if (!pop) return ;
			if (pop.contains ( e.target ) || (e.target.closest && e.target.closest ('.pk_practice'))) return ;
			close ();
		}
		function open () {
			if (!pop) buildPanel ();
			pop.style.display = 'block';
			refresh ();
			place ();
			d.addEventListener ('mousedown', onDocDown, true);
			w.addEventListener ('resize', place);
		}
		function close () {
			if (!pop) return ;
			pop.style.display = 'none';
			d.removeEventListener ('mousedown', onDocDown, true);
			w.removeEventListener ('resize', place);
		}
		function isOpen () { return !!pop && pop.style.display !== 'none'; }

		function refresh () {
			var active = Math.abs ( S.tempo - 1 ) > 1e-6 || (S.keep && S.semis !== 0);
			var label = tf ('pr.title', '練習速度', 'Practice speed') + (active ? '：' + pct ( S.tempo ) + '%' + (S.keep && S.semis ? ' ' + (S.semis > 0 ? '+' : '') + S.semis : '') : '');
			var bs = d.querySelectorAll ('.pk_practice');
			for (var i = 0; i < bs.length; ++i) {
				bs[ i ].classList.toggle ('pk_act', active);
				bs[ i ].setAttribute ('aria-pressed', active ? 'true' : 'false');
				bs[ i ].setAttribute ('title', label);
			}
			var dis = mtOn ();
			if (!pop || !isOpen ()) return ;
			el.big.textContent = pct ( S.tempo ) + '%';
			el.sub.textContent = '(' + S.tempo.toFixed ( 2 ) + '×)';
			el.sl.value = pct ( S.tempo );
			el.mode.value = S.keep ? '1' : '0';
			el.semi.textContent = (S.semis > 0 ? '+' : '') + S.semis;
			var tape = !S.keep;
			Array.prototype.forEach.call ( pop.querySelectorAll ('[data-s]'), function ( a ) { a.classList.toggle ('pk_off', tape); });
			Array.prototype.forEach.call ( pop.querySelectorAll ('[data-p]'), function ( a ) { a.classList.toggle ('pk_on', +a.getAttribute ('data-p') === pct ( S.tempo )); });
			el.tr_on.checked = TR.on;
			el.tr_every.value = TR.every; el.tr_add.value = TR.add; el.tr_to.value = TR.to;
			el.tr_row.style.opacity = TR.on ? '1' : '.45';
			var msg = notice;
			if (dis) msg = tf ('pr.mt_single', '多軌模式尚不支援即時變速，請先回到單軌', 'Live speed is not available in multitrack mode yet');
			else if (TR.on && !msg) {
				var reg = ws () && ws ().regions && ws ().regions.list[0];
				msg = reg && reg.loop ? tf ('pr.tr_wait', '循環第 {n} 次', 'Loop {n}').replace ('{n}', TR.n + 1) : tf ('pr.tr_need_loop', '漸進加速需要開啟「循環播放」', 'Speed trainer needs loop playback');
			}
			el.msg.textContent = msg;
			el.msg.classList.toggle ('pk_warn', !!(notice || dis));
		}

		/* ---------- 外部操作 ---------- */
		function nudge ( o ) {
			var n = {};
			if (o && o.tempo) n.tempo = Math.round ( (S.tempo * 100 + o.tempo) ) / 100;
			if (o && o.semis && S.keep) n.semis = S.semis + o.semis;
			setState ( n );
		}
		function toast ( s ) { try { OneUp ( s, 900 ); } catch (e) {} }

		/* [新增 5-3] 快捷鍵操作後的提示文字：「練習速度 75%  +2」 */
		function statusText () {
			return tf ('pr.title', '練習速度', 'Practice speed') + ' ' + pct ( S.tempo ) + '%' +
				(S.keep && S.semis ? '  ' + (S.semis > 0 ? '+' : '') + S.semis : '');
		}
		/* [新增 5-3] 多軌模式不支援即時變速：快捷鍵、選單一律提示，不改狀態 */
		function mtBlocked () {
			if (!mtOn ()) return false;
			toast ( tf ('pr.mt_single', '多軌模式尚不支援即時變速，請先回到單軌', 'Live speed is not available in multitrack mode yet') );
			return true;
		}

		app.listenFor ('RequestPracticeUI', function () { isOpen () ? close () : open (); });
		app.listenFor ('RequestPracticeSet', function ( o ) { setState ( o ); });
		/* [修改 5-3] 加上多軌防呆與提示；磁帶式下移調無作用，明講而不是靜靜忽略 */
		app.listenFor ('RequestPracticeNudge', function ( o ) {
			if (mtBlocked ()) return ;
			o = o || {};
			if (o.semis && !S.keep) {
				toast ( tf ('pr.semis_tape', '磁帶式下音高跟著速度變，不能單獨移調（請在面板切到「保持音高」）', 'In tape mode pitch follows speed; switch to Keep pitch to transpose') );
				if (!o.tempo) return ;
				o = { tempo: o.tempo };
			}
			nudge ( o );
			toast ( statusText () );
		});
		app.listenFor ('RequestPracticeReset', function () {
			if (mtBlocked ()) return ;
			setState ({ tempo: 1, semis: 0 });
			toast ( tf ('pr.title', '練習速度', 'Practice speed') + ' 100%' );
		});
		app.listenFor ('RequestPracticeSlowToggle', function ( o ) {
			if (mtBlocked ()) return ;
			if (o && o.tempo) slow_prev = clamp ( +o.tempo, T_MIN, T_MAX );
			if (Math.abs ( S.tempo - 1 ) > 1e-6) { slow_prev = S.tempo; setState ({ tempo: 1 }); }
			else setState ({ tempo: slow_prev });
			toast ( statusText () );
		});

		/* ---------- 漸進加速：數「從區間尾跳回區間頭」的次數（做法同 markers.js 的循環次數） ---------- */
		app.listenFor ('DidAudioProcess', function ( ev ) {
			if (!TR.on) return ;
			var x = ws (), reg = x && x.regions && x.regions.list ? x.regions.list[0] : null;
			if (!reg || !reg.loop || !x.isPlaying || !x.isPlaying () || mtOn ()) { TR.prev = -1; return ; }
			var t = ev && ev[0] >= 0 ? ev[0] : x.getCurrentTime (), len = reg.end - reg.start;
			if (TR.prev >= 0 && len > 0.2 && TR.prev - t > len * 0.6) {
				if (++TR.n >= TR.every) {
					TR.n = 0;
					var target = TR.to / 100;
					if (S.tempo < target - 1e-6) {
						var nt = Math.min ( target, Math.round ( (S.tempo * 100 + TR.add) ) / 100 );
						S.tempo = nt; push ();
						toast ( tf ('pr.title', '練習速度', 'Practice speed') + ' ' + pct ( nt ) + '%' + (nt >= target - 1e-6 ? ' ✓' : '') );
						app.fireEvent ('DidPracticeChange', { tempo: S.tempo, semis: S.semis, keep: S.keep });
					}
				}
				refresh ();
			}
			TR.prev = t;
		});
		app.listenFor ('DidStopPlay', function () { TR.prev = -1; });
		app.listenFor ('DidPlay', function () { TR.prev = -1; });

		/* 後端若被重建（載入新檔），把目前狀態再套回去 */
		var b0 = be ();
		if (ws () && ws ().on) ws ().on ('backend-created', function () { setTimeout ( push, 0 ); });
		if (b0) push ();
		refresh ();

		w.PKPracticeLive.state = function () { return { tempo: S.tempo, semis: S.semis, keep: S.keep, trainer: TR.on }; };
	}

	w.PKPracticeLive = { attach: attach, ensure: ensure, makeSource: makeSource, _LiveSource: LiveSource, WORKLET: WORKLET };

})( window, document, window.PKAudioEditor );


