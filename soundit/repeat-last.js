/* --------------------------------------------------------------------------
 * repeat-last.js  —  重複上一次的動作（類似 Audacity 的 Ctrl+R「Repeat Last Effect」）
 *
 * 做法：
 *   - 包住 PKAudioEditor.fireEvent，記下每一次「套用效果」的事件名稱與參數
 *     （RequestActionFX_*，排除預聽 PREVIEW／UPDATE_PREVIEW／TOGGLE 與響度分析等非套用事件）。
 *   - 事件 'RequestRepeatLastAction' 會用同樣的參數，再對「目前選取範圍」套用一次
 *     （沒有選取範圍時，效果本身的處理方式不變：整段套用）。
 *   - 重複執行本身不會覆蓋「上一次動作」，所以連按 Ctrl+R 會一直套用同一個效果。
 *   - 只有真的套用成功（有寫入復原紀錄，或多軌接手處理）才會記下來；
 *     例如增益 100%（沒有變化）被略過時，不會變成「上一次動作」。
 *
 * 對外：
 *   事件  RequestRepeatLastAction          重複上一次
 *   事件  DidSetRepeatLast ( desc | null ) 上一次動作改變時通知（選單用來更新文字、啟用／停用）
 *   PKAudioEditor._deps.repeatLast = { has (), desc (), run (), clear () }
 *
 * 載入位置：app.js 之後、shortcuts.js 之前（index.html 與 sw.js 都要加）。
 * 不含時間與音高、聲調轉換：這兩個對話框是直接改緩衝區，沒有可重播的事件。
 * -------------------------------------------------------------------------- */
(function ( w, d, PKAE ) {
	'use strict';

	if (!PKAE || !PKAE.fireEvent || PKAE._deps.repeatLast) return ;

	var orig = PKAE.fireEvent;

	var last = null;          /* { name, a, b, desc } */
	var cur = null;           /* 正在處理中的套用事件（用來接住它推進復原堆疊時的說明文字） */
	var replaying = false;

	/* 不是「套用」的 RequestActionFX_ 事件：預聽、即時更新、開關、開啟對話框、響度分析 */
	var NOT_APPLY = /^RequestActionFX_(PREVIEW|UPDATE_PREVIEW|TOGGLE|OpenSeamlessLoop|Loudness)/;

	function isApply ( name ) {
		return typeof name === 'string' && name.indexOf ('RequestActionFX_') === 0 && !NOT_APPLY.test ( name );
	}

	/* 參數複製一份：效果處理函式若改動陣列／物件，不會影響下次重播 */
	function clone ( v ) {
		if (v === undefined || v === null || typeof v !== 'object') return v;
		try { return JSON.parse ( JSON.stringify ( v ) ); } catch (e) { return v; }
	}

	function tf ( zh, en ) {
		var lang = '';
		try { lang = PKLocale.getLang (); } catch (e) {}
		return lang === 'en' ? en : zh;
	}

	function notify () {
		try { orig.call ( PKAE, 'DidSetRepeatLast', last ? last.desc : null ); } catch (e) {}
	}

	/* 沒有復原說明文字時（多軌等）的備用名稱：RequestActionFX_FadeIn → FadeIn */
	function fallbackDesc ( name ) {
		return name.replace (/^RequestActionFX_/, '');
	}

	PKAE.fireEvent = function ( eventName, value, value2 ) {
		/* 套用事件處理期間，接住它推進復原堆疊的說明文字（例如「增益」） */
		if (cur && eventName === 'StateRequestPush' && !cur.pushed) {
			cur.pushed = true;
			cur.desc = value && value.desc ? String ( value.desc ).replace (/\s+/g, ' ').trim () : '';
		}

		if (replaying || cur || !isApply ( eventName ) ||
			typeof value === 'function' || typeof value2 === 'function')
			return orig.apply ( PKAE, arguments );

		var rec = { name: eventName, a: clone ( value ), b: clone ( value2 ), desc: '', pushed: false };
		var ret;

		cur = rec;
		try {
			ret = orig.apply ( PKAE, arguments );
		} finally {
			cur = null;
		}

		/* 有寫入復原紀錄，或多軌接手處理（回傳 true）才算套用成功 */
		if (rec.pushed || ret === true) {
			last = { name: rec.name, a: rec.a, b: rec.b, desc: rec.desc || fallbackDesc ( rec.name ) };
			notify ();
		}
		return ret;
	};

	function run () {
		if (!last) {
			w.OneUp && w.OneUp ( tf ('還沒有可以重複的動作', 'Nothing to repeat yet'), 1400 );
			return false;
		}

		replaying = true;
		try {
			orig.call ( PKAE, last.name, clone ( last.a ), clone ( last.b ) );
		} finally {
			replaying = false;
		}
		return true;
	}

	/* 載入新檔案後，上一次的參數（例如針對舊檔的設定）仍可沿用；只在使用者自行關閉檔案時不清除，
	 * 與 Audacity 行為一致。需要清除時可呼叫 _deps.repeatLast.clear ()。 */
	PKAE.listenFor ('RequestRepeatLastAction', function () { run (); });

	PKAE._deps.repeatLast = {
		has:   function () { return !!last; },
		desc:  function () { return last ? last.desc : ''; },
		run:   run,
		clear: function () { last = null; notify (); }
	};

})( window, document, PKAudioEditor );
