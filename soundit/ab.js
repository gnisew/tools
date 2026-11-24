/* Soundit A/B 對照：套用效果（或任何編輯）前後，一鍵切換比較
 *
 * 原理：直接利用既有的復原／重做堆疊。
 *   A = 最近一次編輯「之前」的音訊（復原一步）
 *   B = 最近一次編輯「之後」的音訊（重做一步）
 * 所以不用另外複製緩衝區、不增加記憶體，也不用重新運算效果；切換是瞬間的。
 *
 * 體驗細節：
 *   - 正在播放時切換，會停在同一個時間點繼續播（方便盲聽比較）。
 *   - 處於 A（套用前）時，右上角常駐「A 套用前」標籤，避免忘了自己聽的是原音就直接匯出。
 *   - 按 B 鍵（可在快捷鍵視窗改）、編輯選單、或工具列的 A/B 按鈕切換。
 *   - 效果視窗開啟中、多軌模式、最近一步是標記／多軌操作時不動作（這些不是單純的音訊緩衝區）。
 *
 * 事件：RequestABToggle（切換）、RequestABGoto（參數 'a' 或 'b'）
 */
(function ( w, d, PKAE ) {
	'use strict';

	function tf ( key, zh, en ) {
		try {
			var s = PKLocale.t ( key );
			if (s && s !== key) return s;
			return PKLocale.getLang () === 'en' ? en : zh;
		} catch (e) { return zh; }
	}

	function PKAB ( app ) {
		var q = this;
		var undo = [], redo = [];
		var in_a = false;          /* 目前是否停在「套用前」（由本模組切過去的） */
		var last_toggle = 0;
		var badge = null;

		function eng () { return app.engine; }
		function ws () { return app.engine && app.engine.wavesurfer; }

		function blocked () {
			var e = eng ();
			if (!e || !e.is_ready || !ws () || !ws ().backend || !ws ().backend.buffer) return true;
			if (e.in_fx) return true;
			var mt = app.multitrack;
			if (mt && mt.IsOn && mt.IsOn ()) return true;
			return false;
		}

		/* 只比較「純音訊緩衝區」的編輯；標記／多軌的狀態不算 */
		function plain ( s ) { return s && !s.type; }
		function canA () { return undo.length > 0 && plain ( undo[ undo.length - 1 ] ); }
		function canB () { return redo.length > 0 && plain ( redo[ 0 ] ); }

		q.available = function () { return canA () || canB (); };
		q.isA = function () { return in_a && canB (); };

		function descOf ( s ) { return s && s.desc ? s.desc : ''; }

		function go ( target ) {
			if (blocked ()) return false;
			if (target === 'a' && !canA ()) return false;
			if (target === 'b' && !canB ()) return false;

			var wsurf = ws ();
			var playing = wsurf.isPlaying ();
			var at = wsurf.getCurrentTime ();
			var desc = target === 'a' ? descOf ( undo[ undo.length - 1 ] ) : descOf ( redo[ 0 ] );

			in_a = target === 'a';
			app.fireEvent ( target === 'a' ? 'StateRequestUndo' : 'StateRequestRedo' );

			/* 復原／重做的處理會暫停並重設游標；這裡接回原本的播放位置 */
			if (playing) {
				setTimeout ( function () {
					var nd = wsurf.getDuration ();
					if (nd > 0) app.fireEvent ( 'RequestSeekTo', Math.min ( 1, at / nd ) );
					app.fireEvent ( 'RequestPlay' );
				}, 30 );
			}

			if (w.OneUp) {
				var head = target === 'a'
					? tf ( 'ab.now_a', 'A　套用前', 'A  Before' )
					: tf ( 'ab.now_b', 'B　套用後', 'B  After' );
				w.OneUp ( head + (desc ? '　·　' + desc : ''), 1100 );
			}
			return true;
		}

		q.toggle = function () {
			var now = Date.now ();
			if (now - last_toggle < 150) return false;   /* 擋掉按住不放的連發 */
			last_toggle = now;

			if (blocked ()) {
				w.OneUp && w.OneUp ( tf ( 'ab.unavailable', 'A/B 對照目前無法使用（請先關閉效果視窗／離開多軌）', 'A/B compare is unavailable right now (close the effect window / leave multitrack)' ), 1600 );
				return false;
			}
			if (!q.available ()) {
				w.OneUp && w.OneUp ( tf ( 'ab.nothing', '還沒有可比較的編輯：先套用一次效果再按', 'Nothing to compare yet: apply an effect first' ), 1600 );
				return false;
			}
			/* 有可重做的 → 去 B；否則 → 去 A */
			return go ( canB () ? 'b' : 'a' );
		};
		q.goto = function ( which ) { return go ( which ); };

		/* ---------- 畫面：右上角標籤 + 工具列按鈕外觀 ---------- */
		function ensureBadge () {
			if (badge) return badge;
			badge = d.createElement ( 'button' );
			badge.type = 'button';
			badge.id = 'pk_ab_badge';
			badge.className = 'pk_ab_badge';
			badge.setAttribute ( 'aria-live', 'polite' );
			badge.onclick = function () { q.goto ( 'b' ); this.blur (); };
			d.body.appendChild ( badge );
			return badge;
		}

		function refresh () {
			var a = q.isA ();

			var b = ensureBadge ();
			if (a) {
				b.innerHTML = '<b>A</b> ' + tf ( 'ab.badge_a', '套用前', 'Before' ) + ' <i>' + tf ( 'ab.badge_hint', '點此回到 B', 'click for B' ) + '</i>';
				b.title = tf ( 'ab.badge_title', '你現在聽到的是套用前的版本；匯出也會是這個版本。點一下回到套用後。', 'You are hearing the version before the edit; export will use it too. Click to return to the edited version.' );
				b.style.display = 'block';
			} else {
				b.style.display = 'none';
			}

			var btns = d.querySelectorAll ( '.pk_btn[data-cb="ab"]' );
			for (var i = 0; i < btns.length; ++i) {
				btns[i].setAttribute ( 'data-face', a ? 'A' : 'A/B' );
				btns[i].classList.toggle ( 'pk_act', a );
				btns[i].classList.toggle ( 'pk_inact', !q.available () );
			}
		}
		q.refresh = refresh;

		app.listenFor ( 'DidStateChange', function ( u, r ) {
			undo = u || [];
			redo = r || [];
			if (!redo.length) in_a = false;      /* 重做用完（不論誰按的）就回到 B */
			refresh ();
		});
		/* 新的編輯一定會清掉重做，所以也回到非 A 狀態 */
		app.listenFor ( 'StatePush', function () { in_a = false; refresh (); } );
		app.listenFor ( 'StateClearAll', function () { in_a = false; refresh (); } );

		app.listenFor ( 'RequestABToggle', function () { q.toggle (); } );
		app.listenFor ( 'RequestABGoto', function ( which ) { q.goto ( which === 'a' ? 'a' : 'b' ); } );

		/* 工具列按鈕可能晚於本模組建立：載入完成後再同步一次外觀 */
		setTimeout ( refresh, 600 );
		app.listenFor ( 'DidDownloadFile', function () { setTimeout ( refresh, 50 ); } );
	}

	PKAE._deps.ab = PKAB;
})( window, document, window.PKAudioEditor );
