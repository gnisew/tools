/* Soundit 音高輪廓編輯工具列（階段 4-3）
 *
 * 需要：timepitch-f0.js（PKF0）、timepitch-f0-edit.js（PKF0Edit）、ui-pitch-contour.js（PKPitchContourUI）
 * 載入方式：index.html 在 PKPitchContourUI.attach ( editor ) 之後呼叫 PKPitchContourEditUI.attach ( editor )
 *
 * 用法：
 *   1. 檢視 → 音高輪廓 開啟後，波形右上角會出現「✎ 編輯輪廓」。
 *   2. 展開後有兩種滑鼠工具：
 *        手繪：在輪廓上拖曳，重畫音高（只改原本有聲的部分；一筆拖曳 = 一次復原）。
 *        範圍：拖曳選出要處理的時間範圍，點一下取消。
 *      平滑／壓平／增強／移調 的作用範圍：「範圍」工具選的 → 波形上的選取區 → 整段。
 *   3. 編輯過的輪廓顯示為黃線，原始輪廓留一條灰線當對照。
 *   4. 「驗證」：依編輯後的輪廓合成一條測試音，再用 PKF0 重新偵測，回報偵測結果和編輯目標差幾音分。
 *      這一步只檢查「輪廓本身能不能被穩定追蹤」；真正改變聲音要等 4-4 的 PSOLA 重合成。
 *   編輯只存在於目前的分析結果：音訊內容變動（套用效果、剪下…）後輪廓會重新分析，編輯隨之清除。
 *
 *   5. [新增 4-5] 聲調：「音節增強／音節壓平」以音節為單位處理（每個音節各自相對自己的平均，音節之間的高低差保留）；
 *      「顯示音節」在輪廓下方畫出切出的音節範圍。需要 timepitch-speech.js（PKSpeech）。
 *      上面的「壓平／增強」仍是以「連續有聲段」為單位（連續語句可能一段橫跨好幾個音節）。
 * 對外：PKPitchContourEditUI.get () → { ed, scope }（4-4 的 PSOLA 讀 ed.orig / ed.edited）
 */
(function ( w, d ) {
	'use strict';

	function tf ( key, zh, en ) {
		var s = w.PKLocale ? w.PKLocale.t ( key ) : key;
		if (s && s !== key) return s;
		var lang = '';
		try { lang = w.PKLocale.getLang (); } catch (e) {}
		return lang === 'en' ? en : zh;
	}
	function fmt ( s, o ) { return s.replace ( /\{(\w+)\}/g, function ( m, k ) { return o[k] !== undefined ? o[k] : m; } ); }

	var CSS =
		'.pk_pce{position:absolute;right:8px;top:6px;z-index:5;display:none;max-width:calc(100% - 16px);box-sizing:border-box;' +
		'font:11px/1.4 sans-serif;color:var(--fg-0,#e8edf0);text-align:left;user-select:none;-webkit-user-select:none}' +
		'.pk_pce.pk_pce_show{display:block}' +
		'.pk_pce_panel{margin-top:4px;padding:6px 8px;border:1px solid var(--fg-3,#3a414a);border-radius:4px;background:rgba(14,16,19,.92);display:none}' +
		'.pk_pce.pk_pce_open .pk_pce_panel{display:block}' +
		'.pk_pce_row{display:flex;flex-wrap:wrap;gap:4px;align-items:center;margin:3px 0}' +
		'.pk_pce_b{padding:2px 8px;border:1px solid var(--fg-3,#3a414a);border-radius:3px;background:var(--bg-3,#1c2026);color:var(--fg-0,#e8edf0);font:inherit;cursor:pointer}' +
		'.pk_pce_b:hover{border-color:var(--ac,#5af2ff);color:var(--ac,#5af2ff)}' +
		'.pk_pce_b.pk_act{background:var(--ac,#5af2ff);color:var(--ac-ink,#041014);border-color:var(--ac,#5af2ff)}' +
		'.pk_pce_b[disabled]{opacity:.4;cursor:default;pointer-events:none}' +
		'.pk_pce_toggle{float:right}' +
		'.pk_pce_st{min-height:15px;color:var(--ac,#5af2ff);word-break:break-all}' +
		'.pk_pce_sc{color:var(--fg-1,#9aa3ad)}' +
		'.pk_pce input[type=range]{width:110px;vertical-align:middle;margin:0 2px}';

	function attach ( app ) {
		var PC = w.PKPitchContourUI;
		if (!app || !PC || app._pceAttached) return ;
		app._pceAttached = true;

		var style = d.createElement ('style');
		style.textContent = CSS;
		d.head.appendChild ( style );

		var open = false, tool = 'draw', amount = 50;
		var rangeSel = null;                               /* 絕對時間（秒）{ a, b } */
		var drag = null, busy = 0;
		var showSyl = false, sylCache = null;                /* [新增 4-5] 音節切分快取：{ track, list } */

		/* ---------- DOM ---------- */
		var bar = d.createElement ('div');
		bar.className = 'pk_pce';
		var toggle = btn ( '', function () { setOpen ( !open ); } );
		toggle.classList.add ('pk_pce_toggle');
		var panel = d.createElement ('div');
		panel.className = 'pk_pce_panel';
		bar.appendChild ( toggle );
		bar.appendChild ( d.createElement ('div') ).style.clear = 'both';
		bar.appendChild ( panel );

		function btn ( label, fn ) {
			var b = d.createElement ('button');
			b.type = 'button';
			b.className = 'pk_pce_b';
			b.tabIndex = -1;
			b.textContent = label;
			b.onclick = function () { fn && fn (); this.blur (); };
			return b;
		}
		function row () { var r = d.createElement ('div'); r.className = 'pk_pce_row'; panel.appendChild ( r ); return r; }

		var r1 = row ();
		var bDraw = btn ( '', function () { setTool ( 'draw' ); } );
		var bRange = btn ( '', function () { setTool ( 'range' ); } );
		r1.appendChild ( bDraw ); r1.appendChild ( bRange );
		var scopeEl = d.createElement ('span'); scopeEl.className = 'pk_pce_sc'; r1.appendChild ( scopeEl );

		var r2 = row ();
		var amtLabel = d.createElement ('span');
		var amtVal = d.createElement ('span');
		var slider = d.createElement ('input');
		slider.type = 'range'; slider.min = 0; slider.max = 100; slider.value = amount; slider.tabIndex = -1;
		slider.oninput = function () { amount = +slider.value; amtVal.textContent = amount + '%'; };
		r2.appendChild ( amtLabel ); r2.appendChild ( slider ); r2.appendChild ( amtVal );

		var r3 = row ();
		var bSmooth = btn ( '', function () { apply ( 'smooth', amount / 100 ); } );
		var bFlat = btn ( '', function () { apply ( 'flatten', amount / 100 ); } );
		var bEnh = btn ( '', function () { apply ( 'enhance', amount / 50 ); } );     /* 0~100% → 0~2（偏離放大 1~3 倍） */
		r3.appendChild ( bSmooth ); r3.appendChild ( bFlat ); r3.appendChild ( bEnh );

		/* [新增 4-5] 音節為單位的聲調處理 */
		var r3b = row ();
		var bSylEnh = btn ( '', function () { applySyl ( 'enhance', amount / 50 ); } );
		var bSylFlat = btn ( '', function () { applySyl ( 'flatten', amount / 100 ); } );
		var bSylShow = btn ( '', function () { showSyl = !showSyl; refresh (); PC.redraw (); } );
		r3b.appendChild ( bSylEnh ); r3b.appendChild ( bSylFlat ); r3b.appendChild ( bSylShow );

		var r4 = row ();
		[ [ '−100ct', -100 ], [ '−10ct', -10 ], [ '+10ct', 10 ], [ '+100ct', 100 ] ].forEach ( function ( p ) {
			r4.appendChild ( btn ( p[0], function () { apply ( 'shift', p[1] ); } ) );
		});

		var r5 = row ();
		var bUndo = btn ( '', function () { undo (); } );
		var bRedo = btn ( '', function () { redo (); } );
		var bReset = btn ( '', function () { var ed = cur (); if (ed && ed.reset ()) { say ( '' ); refresh (); } } );
		var bVerify = btn ( '', function () { verify (); } );
		var bDone = btn ( '', function () { setOpen ( false ); } );
		[ bUndo, bRedo, bReset, bVerify, bDone ].forEach ( function ( b ) { r5.appendChild ( b ); } );

		var st = d.createElement ('div');
		st.className = 'pk_pce_st';
		panel.appendChild ( st );

		/* 工具列上的滑鼠／觸控不要被波形當成拖選或跳播 */
		[ 'mousedown', 'mouseup', 'click', 'dblclick', 'touchstart', 'pointerdown', 'contextmenu', 'wheel' ].forEach ( function ( n ) {
			bar.addEventListener ( n, function ( e ) { e.stopPropagation (); } );
		});

		function labels () {
			toggle.textContent = open ? '✕ ' + tf ('pce.done', '完成', 'Done') : '✎ ' + tf ('pce.edit', '編輯輪廓', 'Edit contour');
			bDraw.textContent = tf ('pce.tool_draw', '手繪', 'Draw');
			bRange.textContent = tf ('pce.tool_range', '範圍', 'Range');
			amtLabel.textContent = tf ('pce.amount', '強度', 'Amount');
			amtVal.textContent = amount + '%';
			bSmooth.textContent = tf ('pce.smooth', '平滑', 'Smooth');
			bFlat.textContent = tf ('pce.flatten', '壓平', 'Flatten');
			bEnh.textContent = tf ('pce.enhance', '增強', 'Enhance');
			bSylEnh.textContent = tf ('pce.syl_enh', '音節增強', 'Syllable enhance');
			bSylFlat.textContent = tf ('pce.syl_flat', '音節壓平', 'Syllable flatten');
			bSylShow.textContent = tf ('pce.syl_show', '顯示音節', 'Show syllables');
			bUndo.textContent = tf ('pce.undo', '復原', 'Undo');
			bRedo.textContent = tf ('pce.redo', '重做', 'Redo');
			bReset.textContent = tf ('pce.reset', '還原原始', 'Reset');
			bVerify.textContent = tf ('pce.verify', '驗證', 'Verify');
			bDone.textContent = tf ('pce.done', '完成', 'Done');
		}
		labels ();

		function say ( t ) { st.textContent = t || ''; }

		/* ---------- 狀態 ---------- */
		function ws () { return app.engine && app.engine.wavesurfer; }

		/* 目前軌跡的編輯模型（沒有就建立）；沒有軌跡回傳 null */
		function cur () {
			var L = PC.track ();
			if (!L || !L.track || !w.PKF0Edit) return null;
			if (!L.ed) PC.setEditor ( w.PKF0Edit.create ( L.track ) );
			return L.ed;
		}

		/* 作用範圍（相對於軌跡起點的秒）；null = 整段 */
		function scope () {
			var L = PC.track (), off = L ? L.offset : 0;
			if (rangeSel) return { a: rangeSel.a - off, b: rangeSel.b - off, kind: 'rng' };
			var W = ws (), rg = W && W.regions && W.regions.list && W.regions.list[0];
			if (rg && rg.end > rg.start) return { a: rg.start - off, b: rg.end - off, kind: 'sel' };
			return null;
		}

		function scopeText () {
			var s = scope (), L = PC.track (), off = L ? L.offset : 0;
			if (!s) return tf ('pce.scope_all', '範圍：整段', 'Scope: all');
			if (s.kind === 'sel') return tf ('pce.scope_sel', '範圍：選取區', 'Scope: selection');
			return fmt ( tf ('pce.scope_rng', '範圍：{a}–{b} 秒', 'Scope: {a}–{b} s'), { a: ( s.a + off ).toFixed (2), b: ( s.b + off ).toFixed (2) } );
		}

		function refresh () {
			var ed = PC.track ().ed;
			bUndo.disabled = !( ed && ed.canUndo () );
			bRedo.disabled = !( ed && ed.canRedo () );
			bReset.disabled = !( ed && ed.dirty () );
			bDraw.classList.toggle ( 'pk_act', tool === 'draw' );
			bRange.classList.toggle ( 'pk_act', tool === 'range' );
			bSylShow.classList.toggle ( 'pk_act', showSyl );
			bSylEnh.disabled = bSylFlat.disabled = bSylShow.disabled = !w.PKSpeech;
			scopeEl.textContent = scopeText ();
			bar.classList.toggle ( 'pk_pce_show', !!( PC.get ().on && PC.track ().track ) );
			bar.classList.toggle ( 'pk_pce_open', open );
			labels ();
		}

		function setTool ( t ) {
			tool = t;
			say ( t === 'draw' ? tf ('pce.hint_draw', '在輪廓上拖曳來重畫音高（只會改有聲的部分）', 'Drag over the contour to redraw pitch (voiced parts only)')
				: tf ('pce.hint_range', '拖曳選出要處理的範圍，點一下取消', 'Drag to choose a range; click to clear') );
			refresh ();
		}

		function setOpen ( v ) {
			open = !!v && !!PC.track ().track;
			if (open) { cur (); setTool ( tool ); }
			PC.setInteractive ( open );
			var o = PC.overlay ();
			if (o) o.style.touchAction = open ? 'none' : '';
			refresh ();
			PC.redraw ();
		}

		/* ---------- 編輯動作 ---------- */
		function apply ( name, arg ) {
			var ed = cur ();
			if (!ed || busy) return ;
			var s = scope ();
			var n = s ? ed[name] ( arg, s.a, s.b ) : ed[name] ( arg );
			say ( n ? fmt ( tf ('pce.changed', '已改動 {n} 幀', '{n} frames changed'), { n: n } )
				: tf ('pce.nochange', '範圍內沒有可改動的有聲幀', 'No voiced frames to change here') );
			refresh ();
			PC.redraw ();
		}
		/* ---------- [新增 4-5] 音節 ---------- */
		/* 目前軌跡的音節切分（能量取自同一段音訊；快取到軌跡改變為止） */
		function sylls () {
			var L = PC.track ();
			if (!L || !L.track || !w.PKSpeech) return null;
			if (sylCache && sylCache.track === L.track) return sylCache.list;
			var W = ws (), buf = W && W.backend && W.backend.buffer, opt = {};
			if (buf) {
				var sr = buf.sampleRate, a = Math.max ( 0, Math.floor ( L.offset * sr ) );
				var b = Math.min ( buf.length, Math.ceil ( ( L.offset + L.track.n / L.track.rate ) * sr ) ), chs = [];
				for (var c = 0; c < buf.numberOfChannels; ++c) chs.push ( buf.getChannelData ( c ).subarray ( a, b ) );
				opt = { channels: chs, sr: sr };
			}
			var list = w.PKSpeech.syllables ( L.track, opt );
			sylCache = { track: L.track, list: list };
			return list;
		}

		function applySyl ( mode, amt ) {
			var ed = cur ();
			if (!ed || busy || !w.PKSpeech) return ;
			var s = scope (), list = sylls (), n = 0;
			if (list && list.length) {
				var o = { mode: mode, amount: amt, syllables: list };
				if (s) { o.from = s.a; o.to = s.b; }
				n = w.PKSpeech.toneEdit ( ed, o );
			}
			say ( n ? fmt ( tf ('pce.syl_changed', '已調整音節（{n} 幀，共 {s} 個音節可處理）', 'Syllables adjusted ({n} frames, {s} syllables found)'), { n: n, s: list.length } )
				: tf ('pce.syl_none', '範圍內找不到可處理的音節', 'No syllables to change here') );
			refresh ();
			PC.redraw ();
		}

		function undo () { var ed = cur (); if (ed && ed.undo ()) { say ( '' ); refresh (); PC.redraw (); } }
		function redo () { var ed = cur (); if (ed && ed.redo ()) { say ( '' ); refresh (); PC.redraw (); } }

		/* ---------- 滑鼠／觸控（疊圖在編輯模式下才收事件） ---------- */
		function pos ( e ) {
			var v = PC.view (), o = PC.overlay ();
			if (!v || !o) return null;
			var r = o.getBoundingClientRect ();
			if (!r.width || !r.height) return null;
			var px = ( e.clientX - r.left ) * v.W / r.width, py = ( e.clientY - r.top ) * v.H / r.height;
			return { t: v.left + px / v.pxs, hz: v.axis.hz ? v.axis.hz ( py ) : 0 };
		}

		function bindOverlay () {
			var o = PC.overlay ();
			if (!o || o._pceBound) return ;
			o._pceBound = true;

			o.addEventListener ( 'pointerdown', function ( e ) {
				if (!open || e.button > 0) return ;
				var p = pos ( e ), ed = cur ();
				if (!p || !ed) return ;
				e.preventDefault (); e.stopPropagation ();
				try { o.setPointerCapture ( e.pointerId ); } catch (x) {}
				var off = PC.track ().offset;
				if (tool === 'draw') {
					ed.beginStroke ();
					drag = { kind: 'draw', t: p.t - off, hz: p.hz };
					ed.draw ( drag.t, drag.hz, drag.t, drag.hz );
				}
				else drag = { kind: 'range', a: p.t, b: p.t, moved: false };
				PC.redraw ();
			});

			o.addEventListener ( 'pointermove', function ( e ) {
				if (!drag) return ;
				var p = pos ( e );
				if (!p) return ;
				e.preventDefault (); e.stopPropagation ();
				if (drag.kind === 'draw') {
					var t = p.t - PC.track ().offset, ed = cur ();
					ed && ed.draw ( drag.t, drag.hz, t, p.hz );
					drag.t = t; drag.hz = p.hz;
				}
				else {
					drag.b = p.t;
					if (Math.abs ( drag.b - drag.a ) * PC.view ().pxs > 3) drag.moved = true;
					rangeSel = drag.moved ? { a: Math.min ( drag.a, drag.b ), b: Math.max ( drag.a, drag.b ) } : rangeSel;
				}
				PC.redraw ();
			});

			function end ( e ) {
				if (!drag) return ;
				e.stopPropagation ();
				if (drag.kind === 'draw') { var ed = cur (); ed && ed.endStroke (); }
				else if (!drag.moved) rangeSel = null;             /* 點一下 = 取消範圍 */
				drag = null;
				try { o.releasePointerCapture ( e.pointerId ); } catch (x) {}
				refresh ();
				PC.redraw ();
			}
			o.addEventListener ( 'pointerup', end );
			o.addEventListener ( 'pointercancel', end );
		}

		/* 每次重畫：確保工具列掛在正確的父層、疊圖有綁事件、畫出範圍帶 */
		PC.addHook ( function ( ctx, v ) {
			var o = PC.overlay ();
			if (o && o.parentNode && bar.parentNode !== o.parentNode) o.parentNode.appendChild ( bar );
			bindOverlay ();
			if (!bar.classList.contains ('pk_pce_show')) refresh ();
			if (open && showSyl) {                                  /* [新增 4-5] 音節範圍：底部的短橫線＋交界刻度 */
				var sl = sylls (), off = PC.track ().offset, lw = Math.max ( 1, v.pr );
				if (sl) {
					ctx.fillStyle = 'rgba(255,210,74,0.8)';
					for (var si = 0; si < sl.length; ++si) {
						var sx0 = ( sl[si].a + off - v.left ) * v.pxs, sx1 = ( sl[si].b + off - v.left ) * v.pxs;
						if (sx1 < 0 || sx0 > v.W) continue;
						ctx.fillRect ( sx0 + lw, v.H - 6 * v.pr, Math.max ( 1, sx1 - sx0 - 2 * lw ), 2 * v.pr );
						ctx.fillRect ( sx0, v.H - 10 * v.pr, lw, 10 * v.pr );
						ctx.fillRect ( sx1 - lw, v.H - 10 * v.pr, lw, 10 * v.pr );
					}
				}
			}
			if (open && rangeSel) {
				var x0 = ( rangeSel.a - v.left ) * v.pxs, x1 = ( rangeSel.b - v.left ) * v.pxs;
				ctx.fillStyle = 'rgba(90,242,255,0.14)';
				ctx.fillRect ( x0, 0, x1 - x0, v.H );
				ctx.fillStyle = 'rgba(90,242,255,0.75)';
				ctx.fillRect ( x0, 0, Math.max ( 1, v.pr ), v.H );
				ctx.fillRect ( x1 - Math.max ( 1, v.pr ), 0, Math.max ( 1, v.pr ), v.H );
			}
		});

		/* ---------- 驗證：編輯後輪廓 → 合成 → 重新偵測 → 比對 ---------- */
		function verify () {
			var ed = cur (), F = w.PKF0, E = w.PKF0Edit;
			if (!ed || !F || !E || busy) return ;
			var tr = ed.edited, s = scope ();
			var i0 = 0, i1 = tr.n;
			if (s) { i0 = Math.max ( 0, Math.floor ( s.a * tr.rate ) ); i1 = Math.min ( tr.n, Math.ceil ( s.b * tr.rate ) ); }
			if (i1 - i0 < 20) { say ( tf ('pce.nochange', '範圍內沒有可改動的有聲幀', 'No voiced frames to change here') ); return ; }
			if (( i1 - i0 ) / tr.rate > 120) { say ( tf ('pce.verify_long', '驗證範圍超過 120 秒，請先用「範圍」選一小段', 'Range over 120 s — pick a shorter range first') ); return ; }

			var sub = {}, k;
			for (k in tr) if (Object.prototype.hasOwnProperty.call ( tr, k )) sub[k] = tr[k];
			sub.f0 = tr.f0.subarray ( i0, i1 ); sub.conf = tr.conf.subarray ( i0, i1 ); sub.n = i1 - i0;

			var SR = 16000, wav = E.synth ( sub, SR ), my = ++busy;
			var pseudo = { numberOfChannels: 1, sampleRate: SR, getChannelData: function () { return wav; } };
			bVerify.disabled = true;
			say ( tf ('pce.verify_busy', '驗證中…', 'Verifying…') );
			F.trackBuffer ( pseudo, { fmin: tr.fmin, fmax: tr.fmax, onprogress: function ( p ) {
				if (my === busy) say ( tf ('pce.verify_busy', '驗證中…', 'Verifying…') + ' ' + Math.round ( p * 100 ) + '%' );
			}}).then ( function ( re ) {
				busy = 0; bVerify.disabled = false;
				var c = E.compare ( sub, re );
				if (!c.n) { say ( tf ('pce.verify_none', '輪廓裡沒有可驗證的有聲幀', 'No voiced frames to verify') ); return ; }
				var good = c.medianCents < 10 && c.p90Cents < 50;
				say ( fmt ( good
					? tf ('pce.verify_ok', '輪廓可被穩定追蹤：中位差 {m} 音分，P90 {p} 音分（{n} 幀）', 'Contour tracks cleanly: median {m} ct, P90 {p} ct ({n} frames)')
					: tf ('pce.verify_warn', '部分輪廓不易追蹤（過陡或跳動）：中位差 {m} 音分，P90 {p} 音分（{n} 幀）。可再平滑', 'Parts are hard to track (too steep/jumpy): median {m} ct, P90 {p} ct ({n} frames). Try smoothing'),
					{ m: c.medianCents.toFixed (1), p: c.p90Cents.toFixed (1), n: c.n } ) );
			}).catch ( function () { busy = 0; bVerify.disabled = false; say ( '' ); } );
		}

		/* ---------- 事件 ---------- */
		app.listenFor ( 'DidPitchContourTrack', function () { sylCache = null; rangeSel = null; drag = null; busy = 0; bVerify.disabled = false; setOpen ( open ); } );
		app.listenFor ( 'DidPitchContourState', function ( v ) {
			if (!v || !v.on) { open = false; drag = null; PC.setInteractive ( false ); }
			refresh ();
		});
		/* 區域選取改變時更新範圍文字 */
		[ 'DidCreateRegion', 'DidDestroyRegion' ].forEach ( function ( n ) { app.listenFor ( n, refresh ); } );

		/* 編輯模式下 Ctrl/Cmd+Z、Shift+Z、Y 優先復原輪廓（沒有輪廓可復原才交給主程式復原音訊） */
		w.addEventListener ( 'keydown', function ( e ) {
			if (!open || !( e.ctrlKey || e.metaKey )) return ;
			var key = ( e.key || '' ).toLowerCase (), ed = PC.track ().ed;
			if (key !== 'z' && key !== 'y') return ;
			var redoing = key === 'y' || e.shiftKey;
			if (!ed || !( redoing ? ed.canRedo () : ed.canUndo () )) return ;
			e.preventDefault (); e.stopImmediatePropagation ();
			redoing ? redo () : undo ();
		}, true );

		refresh ();
	}

	w.PKPitchContourEditUI = {
		attach: attach,
		get: function () {
			var L = w.PKPitchContourUI && w.PKPitchContourUI.track ();
			return { ed: L ? L.ed : null, offset: L ? L.offset : 0 };
		}
	};
})( window, document );


