/* Soundit 聲調轉換（把選取範圍內的字，改成另一個聲調）
 *
 * 例：華語「媽 mā（一聲 55）」→「罵 mà（四聲 51）」。
 *
 * 做法：
 *   1. PKF0.trackBuffer 追蹤選取範圍的音高；PKSpeech.syllables 切成音節。
 *   2. 每個音節判斷原聲調，使用者可改；再選目標聲調（五度標記法，也可自填如 "214"）。
 *   3. 以該音節自己的平均音高當基準，把目標五度曲線換算成 Hz，得到「目標 F0 軌跡」，只改原本有聲的幀。
 *   4. PKTimePitch.process ( mode: 'psola' ) 依目標軌跡重合成：音色（共振峰）與子音不變，只有音高輪廓改變。
 *
 * [v2 擴充]
 *   - 語言／腔調：華語、客語（四縣、海陸、大埔、饒平、詔安、南四縣）、閩南語（臺灣通行腔）。調值資料在 tone-systems.js。
 *     目標聲調除了該腔調自己的聲調，還有「通用調值」（高平 55、全降 51、中升 34…任何語言都能選），也可自訂五度標記。
 *   - 「依原聲調對應」：一次指定「原本是 X 聲的字，全部改成 Y 聲」（例如一聲→四聲），
 *     另有「循環」快速設定（1→2→3→4→1）。逐字仍可個別修改。
 *   - 逐字試聽：每一列都有「原音」「轉換後」兩個播放鈕（前後各留 30 ms）。
 *   - 基準點：「依原聲調平均」（預設，字的起點／高低由原聲調決定）或「保持字的平均音高」。
 *   - 記住上次使用的語言、腔調與設定。目標含入聲（短調）時顯示警告。
 *
 * [v3 擴充：階段 3 批次對應與逐字試聽]
 *   - 「依原聲調對應」每個聲調旁顯示目前有幾個音節（0 個的變淡），並顯示「共 N 個字會被改」。
 *   - 逐字試聽只處理「該音節 ＋ 前後 30 ms」（再加 60 ms 的處理緩衝），不再重跑整段；每次耗時顯示在狀態列。
 *   - 點音高圖上的音節也能試聽：有設「改成」就播轉換後，沒有就播原音；按住 Shift 點 = 播原音。
 *   - 「試聽轉換後」「套用」只重新合成「有被改動的那一段」（第一個到最後一個被改的字，前後加緩衝），其餘取樣原封不動；
 *     運算在 timepitch-worker.js 進行（畫面不卡），Worker 不能用（如 file://）才退回主執行緒。
 *
 * [v4 擴充：頁籤＋可停靠側邊欄]
 *   - 版面改單欄：語言／腔調／音域基準、音高圖、音高幅度／基準共用；下方兩個頁籤：
 *       「偵測到的」＝逐字表格（含「全部改成」）；「依原聲調對應」＝各聲調的對應規則、循環、全部不變。
 *   - 兩層疊加：對應規則是底，逐字指定優先。逐字表格「改成」多一個預設選項「依對應」（旁邊淡色顯示套用後結果「自動：→ 去聲」）；
 *     選了別的＝只改這一列（該列標色，按 ↺ 還原）。頁籤標籤顯示規則數，「共 N / M 個字會被改」常駐。
 *   - 停靠（沿用標記清單做法）：浮動（原本的置中對話框）／左／右。標題列有三個停靠鈕，也可把標題列拖到畫面左右邊緣；
 *     側邊有分隔條可拖（雙擊還原）；停靠時主畫面讓出同樣寬度並送出 RequestResize。記住模式與寬度：pk_tc_dock、pk_tc_dw。
 *     停靠時沒有遮罩、點外面不關閉，並放掉 InteractionHandler 鎖，主畫面波形、快捷鍵與播放照常。
 *   - 與標記清單同側時，後到的自動靠另一側；兩側都被佔用就維持浮動。
 *   - 快照過期防護：視窗用的是開啟當下選取範圍的快照。偵測到整份音訊被換掉（剪輯、復原、重做、換檔）就停用「套用」並提示；
 *     「重新讀取選取範圍」鈕（停靠時再按一次選單也行）會用目前的選取範圍重新分析。停靠時「套用」後不關閉，改用新範圍重新分析。
 *   - [新增 v9] 停靠時自動重新讀取：① 重新選取 20 秒內的範圍（穩定約 0.5～1 秒）→ 自動讀取；
 *     ② 新載入音檔「覆蓋」原檔，且選取範圍（沒選就整份）在 20 秒內 → 自動讀取；
 *     ③ 新載入音檔「附加在後」→ 不自動讀取，維持「請重新讀取」提示，按「重新讀取」才讀。
 *   - 依面板自己的寬度排版（ResizeObserver，不看視窗寬度）；表格隨高度伸縮；配色全部沿用 main.css 的主題變數（含音高圖），換主題會重畫。
 *   - 保留 data-k 名稱（mapbar、rows、lang、acc、reg、all、range、anchor、cv、orig、prev、apply、status、info、close…）。
 *
 * [v5 版面精簡]
 *   - 沒選取範圍（或超過 20 秒、多軌、尚未載入音訊）也能開啟：圖上顯示提示；停靠時在主畫面選好範圍（穩定 0.5 秒）會自動讀取，也可按 ↻。
 *   - 「重新讀取」移到標題旁（需要重讀時變主色）；「全部改成」移進表格「改成」欄標題；
 *     移除底部「這個字改成是不變…」訊息；耗時改成頁尾一小行（不佔列）。
 *   - 「音域基準」→「基準」（選項縮短、選單變窄）；原本的「基準」→「字高」。
 *   - 逐字「依對應」把結果直接寫在選項文字（依對應 → 去聲），不再多佔一欄；各處文字精簡。
 *
 * [v6 自然範本]
 *   - 學習（★）記住字的時候，多存一條 48 點的「細緻曲線」（含該字真實的起伏，單位＝度，與音域無關）。
 *   - 「⚙ 音高」→「目標曲線」選「自然範本」（預設）：目標聲調有記住的字時，改用那個字的真實曲線當目標，
 *     沒有就退回標準調值。每個字自動挑音長最接近的範本（前 3 名輪流用，避免每個字一模一樣）；
 *     「改成」旁的 ◈ 鈕可手動換範本（點一下換下一個，最後回到自動），換了會自動試聽。
 *   - 舊版記住的字只有 5 點，沒有細緻曲線：在原聲調選對、再按 ✓ 或「記住目前全部」重記一次即可升級。
 *   - 「自然度」在範本模式下：不再疊加原音的慢變化（範本已有真實的字形起伏），但原音逐幀的抖動照樣全部疊加（範本只存 48 點，存不住細微抖動）。
 *
 * [v7 補抓低音高的字]
 *   - 音高追蹤對低沉、嘎裂、氣聲的字（常見於入聲如 jip3）只能零星抓到幾幀，音節切分又要求連續有聲 ≥ 50 ms，
 *     結果整個字被丟掉。現在分析時：
 *       ① 「有能量、但有聲比例很低」的區段（≥ 120 ms）→ 用較寬鬆的有聲門檻（voicing 0.65）再追蹤一次，
 *          只在這些區段、原本無聲的幀補上音高（補出來少於 4 幀的孤島不要）。沒有這種區段就不多跑第二次。
 *       ② 切分音節時，把「能量沒有掉下去的短空隙（≤ 80 ms）」視為同一個字的一部分（只影響切分；
 *          空隙內的幀仍是無聲，轉換時不會被改）。
 *          補抓區段內，切分用的暫時軌跡把音高壓成中位數（嘎裂段常跳八度，會被「F0 跳動」規則切成碎片），改由能量低谷決定分字。
 *
 * [v8 聲調設定改版]
 *   - 「聲調設定」顯示該語言／腔調「預設的聲調」，每個聲調旁標出調值（如「陰平 24」），括號仍是目前偵測到的字數。
 *   - [刪除]「依序輪替」鈕與 rotateMap：它只適用「全部都是本調」的自動變調，自動變調留待之後另外設計。
 *   - [新增]「＋ 增加聲調」：基本聲調以外，使用者可加入該語言還可能用到的聲調（如詔安客語的變調中平 33），
 *     可從該腔調常見的、通用調值挑，或自訂五度調值（如 35、214）。加入後會出現在聲調設定、逐字表格的「原聲調」與「改成」，
 *     也會成為偵測候選；每個語言＋腔調各自記住（localStorage：pk_tc_prefs.extra），已加入的聲調可按 ✕ 移除。
 *     詔安的 33 原本直接放在基本聲調裡，現改為「可加入」的額外聲調（資料在 tone-systems.js 的 accent.extras）。
 *
 * [v9 觀念調整：聲調設定／音檔類型]
 *   - 「聲調」設定鈕一律顯示（原本 AUTO_MAP 關閉時連它一起藏起來，導致看不到額外聲調）。面板分三塊：
 *       ① 基本聲調（該腔調的本調與調值，附偵測字數）；
 *       ② 變調時多出來的調型（如詔安客語的中平 33；詔安預設已列入，可 ✕ 移除、可「＋增加調型」）；
 *       ③ 變調規則：預留區塊，尚未提供（規則不是單純一對一，之後另外處理）。
 *   - 新增「音檔」類型：自然語流（預設，音檔已是自然變調後的表面調值）／單字本調。
 *       自然語流：偵測候選＝基本＋額外聲調；「原聲調」＝實際聽到的調值；不套用任何變調規則，「改成」直接指定表面調值。
 *       單字本調：只比對基本聲調；選單也只列基本聲調（變調規則日後只會用在這類音檔）。
 *     記住：pk_tc_prefs.kind。
 *
 * 載入：index.html 在 PKAudioEditor.init 之後呼叫 PKToneChange.attach ( editor )
 * 事件：RequestActionToneChange
 * 需要：tone-systems.js、timepitch-f0.js、timepitch-speech.js、timepitch-psola.js、timepitch-engine.js
 *
 * 限制：PSOLA 只處理有聲音高；平均音高一次改變接近一個八度（約 ≥ 10 半音）時，輸出可能被聽成原本高度（八度混淆），對話框會提醒；
 *       無聲段（子音）以 8 ms 為單位重新排列，爆發音（如 p t k）的位置最多會移動約 4 ms；氣聲、耳語、嗓音嘎裂（如三聲的低點）追蹤不到時該段維持原樣。
 *       每次一個範圍上限 20 秒。聲調改變不會順便改音長（四聲通常較短、三聲較長，要的話再用「時間與音高」調速度）。
 *       入聲（短調）的音長與塞音韻尾不會改，入聲↔舒聲互轉聽起來會不自然（目標是短調時會警告）。
 *       連讀變調的規則沒有建模；偵測到的原聲調只是依輪廓形狀的估計，不準時請手動改。
 */
(function ( w, d ) {
	'use strict';

	/* [新增] 自動變調（依「聲調」設定的對應規則改調）開關：false＝暫不提供，每列「改成」只有「不變」與手動指定 */
	var AUTO_MAP = false;
	var MAX_SEC = 20, MIN_VOICED = 5, NAME = 'tonechange', LS_KEY = 'pk_tc_prefs';

	function tf ( key, zh, en ) {
		var s = w.PKLocale ? w.PKLocale.t ( key ) : key;
		if (s && s !== key) return s;
		var lang = '';
		try { lang = w.PKLocale.getLang (); } catch (e) {}
		return lang === 'en' ? en : zh;
	}
	function esc ( s ) { return String ( s ).replace ( /[&<>"]/g, function ( c ) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[ c ]; } ); }

	var TS = w.PKToneSystems;
	var TONES = TS ? TS.tones ( 'mandarin', 'std' ) : [];        /* 舊版相容 */

	/* ------------------------------------------------------------------
	 * 核心（純函式）
	 * ------------------------------------------------------------------ */
	var parseChao = function ( x ) { return TS.parseChao ( x ); };
	function chaoMean ( p ) {
		/* 五度曲線沿時間的平均（折線積分） */
		var s = 0, n = p.length;
		for (var i = 0; i < n - 1; ++i) s += ( p[ i ] + p[ i + 1 ] ) / 2;
		return s / ( n - 1 );
	}
	function chaoAt ( p, u ) {
		var x = Math.max ( 0, Math.min ( 1, u ) ) * ( p.length - 1 ), i = Math.min ( p.length - 2, Math.floor ( x ) ), f = x - i;
		return p[ i ] + ( p[ i + 1 ] - p[ i ] ) * f;
	}
	var chaoOf = function ( x ) { return TS.chaoOf ( x ); };
	/* ------------------------------------------------------------------
	 * [v7] 補抓低音高的字（純函式）
	 * ------------------------------------------------------------------ */
	/* 每幀能量（dB，25 ms 視窗，第 i 幀以 i / rate 秒為中心） */
	function frameDb ( x, sr, n, rate ) {
		var len = x.length, pre = new Float64Array ( len + 1 ), i, db = new Float32Array ( n );
		for (i = 0; i < len; ++i) pre[ i + 1 ] = pre[ i ] + x[ i ] * x[ i ];
		var half = Math.max ( 1, Math.round ( 0.0125 * sr ) );
		for (i = 0; i < n; ++i) {
			var c = Math.round ( i / rate * sr ), a = Math.max ( 0, c - half ), b = Math.min ( len, c + half );
			db[ i ] = 10 * Math.log10 ( ( b > a ? ( pre[ b ] - pre[ a ] ) / ( b - a ) : 0 ) + 1e-12 );
		}
		return db;
	}
	/* 有能量、卻幾乎沒抓到音高的區段 → [ [i0, i1) ]。門檻：能量 > 最大值 − 30 dB（容許 2 幀小洞）、連續 ≥ 12 幀、有聲比例 < 0.4 */
	function rescueRegions ( tr, e ) {
		var n = tr.n, mx = -1e9, i, out = [];
		for (i = 0; i < n; ++i) if (e[ i ] > mx) mx = e[ i ];
		var thr = mx - 30, s = -1, hole = 0;
		for (i = 0; i <= n; ++i) {
			var on = i < n && e[ i ] > thr;
			if (on) { if (s < 0) s = i; hole = 0; continue; }
			if (s < 0) continue;
			if (i < n && ++hole <= 2) continue;
			var re = i - hole, v = 0, k;
			if (re - s >= 12) { for (k = s; k < re; ++k) if (tr.f0[ k ] > 0) ++v; if (v / ( re - s ) < 0.4) out.push ([ s, re ]); }
			s = -1; hole = 0;
		}
		return out;
	}
	/* 把寬鬆追蹤 tr2 的結果，只在 regions 內、tr 原本無聲的幀補進去；補出來少於 4 幀的孤島拿掉。回傳新軌跡（不改動 tr） */
	function mergeRescue ( tr, tr2, regions ) {
		var f0 = Float32Array.from ( tr.f0 ), conf = Float32Array.from ( tr.conf || new Float32Array ( tr.n ) ), added = 0, r, k;
		var from2 = new Uint8Array ( tr.n );
		for (r = 0; r < regions.length; ++r) {
			for (k = regions[ r ][ 0 ]; k < regions[ r ][ 1 ] && k < tr2.n; ++k) {
				if (!( f0[ k ] > 0 ) && tr2.f0[ k ] > 0) { f0[ k ] = tr2.f0[ k ]; conf[ k ] = tr2.conf ? tr2.conf[ k ] : 0.5; from2[ k ] = 1; ++added; }
			}
		}
		var s = -1, i, all2;
		for (i = 0; i <= tr.n; ++i) {
			var on = i < tr.n && f0[ i ] > 0;
			if (on && s < 0) { s = i; continue; }
			if (on || s < 0) continue;
			all2 = true; for (k = s; k < i; ++k) if (!from2[ k ]) { all2 = false; break; }
			if (all2 && i - s < 4) for (k = s; k < i; ++k) { f0[ k ] = 0; conf[ k ] = 0; --added; }
			s = -1;
		}
		return { hop: tr.hop, rate: tr.rate, sr: tr.sr, n: tr.n, f0: f0, conf: conf, fmin: tr.fmin, fmax: tr.fmax, rescued: added };
	}
	/* 切分用的軌跡：兩段有聲之間 ≤ 8 幀（80 ms）的空隙，若空隙的平均能量不低於兩側（各取 5 幀）較低者 − 8 dB，就用對數內插補起來。
	 * 只拿來切分音節；轉換時仍用原軌跡（空隙幀維持無聲）。 */
	function bridgeGaps ( tr, e, regs ) {
		var f0 = Float32Array.from ( tr.f0 ), n = tr.n, i = 0, k;
		function mean ( a, b ) { var s = 0, c = 0; for (var q = Math.max ( 0, a ); q < Math.min ( n, b ); ++q) { s += e[ q ]; ++c; } return c ? s / c : -1e9; }
		while (i < n) {
			if (tr.f0[ i ] > 0) { ++i; continue; }
			var g0 = i; while (i < n && !( tr.f0[ i ] > 0 )) ++i;
			var g1 = i;
			if (g0 === 0 || g1 >= n || g1 - g0 > 8) continue;
			var side = Math.min ( mean ( g0 - 5, g0 ), mean ( g1, g1 + 5 ) );
			if (mean ( g0, g1 ) < side - 8) continue;
			var a = Math.log ( tr.f0[ g0 - 1 ] ), b = Math.log ( tr.f0[ g1 ] );
			for (k = g0; k < g1; ++k) f0[ k ] = Math.exp ( a + ( b - a ) * ( k - g0 + 1 ) / ( g1 - g0 + 1 ) );
		}
		/* 補抓區段內的音高（嘎裂段常有跳八度）只拿來判斷「有沒有聲」：切分用的軌跡把它壓成該區段的中位數，
		 * 讓 PKSpeech.syllables 的「相鄰幀 F0 跳動 > 4 半音就強制切開」不要把一個字切成碎片；是否分字改由能量低谷決定 */
		(regs || []).forEach ( function ( r ) {
			var a = [], q;
			for (q = r[ 0 ]; q < r[ 1 ] && q < n; ++q) if (f0[ q ] > 0) a.push ( f0[ q ] );
			if (!a.length) return ;
			a.sort ( function ( x, y ) { return x - y; } );
			var med = a[ a.length >> 1 ];
			for (q = r[ 0 ]; q < r[ 1 ] && q < n; ++q) if (f0[ q ] > 0) f0[ q ] = med;
		});
		return { hop: tr.hop, rate: tr.rate, sr: tr.sr, n: tr.n, f0: f0, conf: tr.conf, fmin: tr.fmin, fmax: tr.fmax };
	}

	/* [新增] 範本曲線 c（等距取樣）在 u（0~1）的值 */
	function tplAt ( c, u ) {
		var x = Math.max ( 0, Math.min ( 1, u ) ) * ( c.length - 1 ), i = Math.min ( c.length - 2, Math.floor ( x ) ), f = x - i;
		return c[ i ] + ( c[ i + 1 ] - c[ i ] ) * f;
	}
	var sameTone = function ( a, b ) { return TS.sameTone ( a, b ); };

	/* 華語四聲：看形狀判斷（與音域無關）。hz = 該音節有聲幀的 Hz 陣列（依時間排序）。回傳 't1'..'t4' */
	function detectTone ( hz ) {
		var n = hz.length;
		if (n < 3) return 't1';
		var st = hz.map ( function ( h ) { return 12 * Math.log ( h ) / Math.LN2; } );
		var k = Math.max ( 1, Math.round ( n * 0.2 ) ), i, s = 0, e = 0, mn = 1e9, mx = -1e9, mi = 0;
		for (i = 0; i < k; ++i) { s += st[ i ]; e += st[ n - 1 - i ]; }
		s /= k; e /= k;
		for (i = 0; i < n; ++i) { if (st[ i ] < mn) { mn = st[ i ]; mi = i; } if (st[ i ] > mx) mx = st[ i ]; }
		var u = mi / ( n - 1 );
		if (mx - mn < 2.5) return 't1';
		if (u > 0.2 && u < 0.8 && s - mn > 1.8 && e - mn > 1.8) return 't3';
		if (e - s > 2) return 't2';
		if (e - s < -2) return 't4';
		return mx - mn > 5 && u > 0.25 && u < 0.75 ? 't3' : 't1';
	}

	/* 說話者的五度尺度：用所有有聲幀的第 10／90 百分位當 1／5 度附近。回傳 { center, step }（半音） */
	function pitchScale ( allHz ) {
		var st = allHz.map ( function ( h ) { return 12 * Math.log ( h ) / Math.LN2; } ).sort ( function ( a, b ) { return a - b; } );
		if (!st.length) return { center: 0, step: 3 };
		var p10 = st[ Math.floor ( ( st.length - 1 ) * 0.1 ) ], p90 = st[ Math.floor ( ( st.length - 1 ) * 0.9 ) ];
		return { center: ( p10 + p90 ) / 2, step: Math.max ( 2, Math.min ( 4, ( p90 - p10 ) / 4 ) ) };
	}

	/* ------------------------------------------------------------------
	 * [階段 2] 偵測加信心值、音域基準
	 *
	 * 1. 音節輪廓 → 5 個點（每段取中位數，半音）。
	 * 2. 音域基準 scale = { center, step, reliable, source }：center = 五度的第 3 度（半音），step = 每一度幾個半音。
	 *    reliable = 這個基準是不是可信。只選一個字時，音高的高低無從判斷（55／33／11 的曲線形狀一樣），
	 *    此時 reliable = false，比對時「不看高低、只看形狀」，平調之間會得到相同分數 → 信心低 → 在列表標示。
	 * 3. 比對 scoreTones：每個候選調值算距離 d（單位：度，1 度 ≈ 3 半音）
	 *       d² = 形狀差² + λ × 高低差² + 音長懲罰；λ = reliable ? 1 : 0
	 *    形狀差 = 去掉平均後兩條曲線的均方根。
	 * 4. 信心 conf = exp(-(d1)²) × (1 − exp(−(d2 − d1) / 0.3))：
	 *       d1 = 最像的聲調的距離（越小越吻合），d2 = 第二像的「不同聲調」的距離。
	 *    兩個聲調很像（如 11／21）→ d2 − d1 小 → 信心低。level：high ≥ 0.55、mid ≥ 0.25、其餘 low。
	 * ------------------------------------------------------------------ */
	var CONF_HIGH = 0.55, CONF_MID = 0.25, MIN_SYL_AUTO = 3, MIN_SPREAD_AUTO = 6;
	var PRESETS = { male: 130, female: 220, child: 300 };     /* 第 3 度的大約 Hz（粗略）；使用者可改用「以某字校準」或手動 */
	function semi ( h ) { return 12 * Math.log ( h ) / Math.LN2; }
	function median ( a ) {
		var b = a.slice ().sort ( function ( x, y ) { return x - y; } ), m = b.length >> 1;
		return b.length % 2 ? b[ m ] : ( b[ m - 1 ] + b[ m ] ) / 2;
	}
	/* hz（有聲幀，依時間）→ 5 個半音點；少於 3 幀回 null */
	function contourPts ( hz ) {
		var n = hz.length, k, p = [];
		if (n < 3) return null;
		var st = hz.map ( semi );
		for (k = 0; k < 5; ++k) {
			var a = Math.floor ( k * n / 5 ), b = Math.max ( a + 1, Math.floor ( ( k + 1 ) * n / 5 ) );
			p.push ( median ( st.slice ( a, Math.min ( b, n ) ) ) );
		}
		return p;
	}

	/* 說話者的五度尺度：用所有有聲幀的第 10／90 百分位當 1／5 度附近。
	 * opts.nSyl = 音節數（可省略）。回傳 { center, step（半音）, spread, reliable, source:'auto' } */
	function pitchScale ( allHz, opts ) {
		opts = opts || {};
		var st = allHz.map ( semi ).sort ( function ( a, b ) { return a - b; } );
		if (!st.length) return { center: 0, step: 3, spread: 0, reliable: false, source: 'auto' };
		var p10 = st[ Math.floor ( ( st.length - 1 ) * 0.1 ) ], p90 = st[ Math.floor ( ( st.length - 1 ) * 0.9 ) ], spread = p90 - p10;
		var enough = opts.nSyl == null || opts.nSyl >= MIN_SYL_AUTO;
		return { center: ( p10 + p90 ) / 2, step: Math.max ( 2, Math.min ( 4, spread / 4 ) ), spread: spread, reliable: enough && spread >= MIN_SPREAD_AUTO, source: 'auto' };
	}
	/* 手動／預設／校準得到的基準：一律視為可信 */
	function fixedScale ( center3Hz, step, source ) {
		return { center: semi ( center3Hz ), step: Math.max ( 1.5, Math.min ( 4.5, step > 0 ? step : 3 ) ), spread: null, reliable: true, source: source || 'manual' };
	}
	function presetScale ( name ) { return PRESETS[ name ] ? fixedScale ( PRESETS[ name ], 3, 'preset' ) : null; }
	/* 以某個字校準：已知這個字（hz）的聲調是 toneChao，則它的平均五度值 = 該調值的平均 */
	function calibrate ( hz, toneChao, step ) {
		var ch = chaoOf ( toneChao ), pts = contourPts ( hz );
		if (!ch || !pts) return null;
		var m = 0, q; for (q = 0; q < 5; ++q) m += pts[ q ] / 5;
		step = step > 0 ? step : 3;
		return { center: m - ( chaoMean ( ch ) - 3 ) * step, step: Math.max ( 1.5, Math.min ( 4.5, step ) ), spread: null, reliable: true, source: 'ref' };
	}
	function degPts ( pts, scale ) { return pts.map ( function ( v ) { return 3 + ( v - scale.center ) / scale.step; } ); }

	function durPen ( short, dur ) {
		if (!( dur > 0 )) return 0;
		var x = short ? ( dur - 0.15 ) / 0.1 : ( 0.25 - dur ) / 0.1;
		return 0.5 * Math.max ( 0, Math.min ( 1, x ) );
	}
	/* cands = TS.candidates ()；回傳每個「聲調 id」最像的一筆，依距離由小到大：[{ id, chao, d }] */
	function scoreTones ( pts, scale, cands, dur, learn ) {
		var p = degPts ( pts, scale ), mp = 0, q, lam = scale.reliable ? 1 : 0, best = {};
		for (q = 0; q < 5; ++q) mp += p[ q ] / 5;
		cands.forEach ( function ( t ) {
			var ch = parseChao ( t.chao ), mt = 0, tv = [], sh = 0, e;
			for (q = 0; q < 5; ++q) { tv.push ( chaoAt ( ch, q / 4 ) ); mt += tv[ q ] / 5; }
			for (q = 0; q < 5; ++q) { e = ( p[ q ] - mp ) - ( tv[ q ] - mt ); sh += e * e / 5; }
			var d2 = sh + lam * ( mp - mt ) * ( mp - mt ) + durPen ( t.short, dur ), d = Math.sqrt ( d2 );
			if (!best[ t.id ] || d < best[ t.id ].d) best[ t.id ] = { id: t.id, chao: t.chao, d: d, n: 0 };
		});
		/* [學習] 使用者標過的字（輪廓樣本）：與樣本最近的幾筆距離，依樣本數與規則距離混合 */
		if (learn) Object.keys ( best ).forEach ( function ( id ) {
			var arr = learn[ id ];
			if (!arr || !arr.length) return ;
			var ds = arr.map ( function ( it ) {
				var sh2 = 0, e2, lv = 0, dd = 0;
				for (var j = 0; j < 5; ++j) { e2 = ( p[ j ] - mp ) - it.s[ j ]; sh2 += e2 * e2 / 5; }
				if (lam && it.m != null) lv = ( mp - 3 - it.m ) * ( mp - 3 - it.m );
				if (dur > 0 && it.d > 0) dd = 0.3 * Math.min ( 1, Math.abs ( dur - it.d ) / 0.2 );
				return Math.sqrt ( sh2 + lv + dd * dd );
			}).sort ( function ( a, b ) { return a - b; } );
			var kk = Math.min ( 3, ds.length ), dl = 0, w2;
			for (var j2 = 0; j2 < kk; ++j2) dl += ds[ j2 ] / kk;
			w2 = ds.length / ( ds.length + 1.5 );
			best[ id ].d = ( 1 - w2 ) * best[ id ].d + w2 * dl;
			best[ id ].n = ds.length;
		});
		return Object.keys ( best ).map ( function ( k ) { return best[ k ]; } ).sort ( function ( a, b ) { return a.d - b.d; } );
	}
	/* 單一音節：回 { id, conf, level, margin, rms, alts }；alts = 距離與最佳差 < 0.3 度的其他聲調 id（最多 3 個） */
	function detectScored ( hz, scale, cands, dur, learn ) {
		var pts = contourPts ( hz );
		if (!pts || !cands.length) return { id: cands.length ? cands[ 0 ].id : 't1', conf: 0, level: 'low', margin: 0, rms: 9, alts: [] };
		var sc = scoreTones ( pts, scale, cands, dur, learn ), d1 = sc[ 0 ].d, margin = sc.length > 1 ? sc[ 1 ].d - d1 : 1;
		var conf = Math.exp ( -d1 * d1 ) * ( 1 - Math.exp ( -margin / 0.3 ) );
		return {
			id: sc[ 0 ].id, learned: sc[ 0 ].n > 0, conf: conf, level: conf >= CONF_HIGH ? 'high' : conf >= CONF_MID ? 'mid' : 'low', margin: margin, rms: d1,
			alts: sc.slice ( 1, 4 ).filter ( function ( t ) { return t.d - d1 < 0.3; } ).map ( function ( t ) { return t.id; } )
		};
	}
	/* 舊介面：只回聲調 id */
	function detectByShape ( hz, scale, cands, dur ) { return detectScored ( hz, scale, cands, dur ).id; }

	/* 用「已指派的聲調」回頭修正音域（最小平方：半音 ≈ center + step × (調值度數 − 3)），重複幾次。
	 * 只在基準可信、音節 ≥ 3 個時做；步長限制在 2~4 半音。 */
	function refineScale ( items, cands, scale ) {
		if (!scale.reliable || items.length < MIN_SYL_AUTO) return scale;
		var cur = scale, it, k, q;
		for (it = 0; it < 3; ++it) {
			var sx = 0, sy = 0, sxx = 0, sxy = 0, N = 0;
			for (k = 0; k < items.length; ++k) {
				var sc = scoreTones ( items[ k ].pts, cur, cands, items[ k ].dur )[ 0 ], t = chaoOf ( sc.chao );
				for (q = 0; q < 5; ++q) {
					var x = chaoAt ( t, q / 4 ) - 3, y = items[ k ].pts[ q ];
					sx += x; sy += y; sxx += x * x; sxy += x * y; ++N;
				}
			}
			var vx = sxx / N - ( sx / N ) * ( sx / N );
			if (!( vx > 0.5 )) break;
			var slope = Math.max ( 2, Math.min ( 4, ( sxy / N - ( sx / N ) * ( sy / N ) ) / vx ) );
			cur = { center: sy / N - slope * sx / N, step: slope, spread: scale.spread, reliable: true, source: scale.source === 'auto' ? 'auto+' : scale.source };
		}
		return cur;
	}

	/* 一整段：sylHz = 每個音節的有聲幀 Hz 陣列；durs = 各音節秒數。
	 * o.scale 有給就用它（手動／預設／校準／沿用上次），沒給就由這段音高估計。
	 * 回傳 { scale, items: [ detectScored 的結果 ] } */
	function detectTones ( sylHz, durs, cands, o ) {
		o = o || {};
		var all = [], items = [], k;
		sylHz.forEach ( function ( hz ) { for (var q = 0; q < hz.length; ++q) all.push ( hz[ q ] ); } );
		var scale = o.scale || pitchScale ( all, { nSyl: sylHz.length } );
		for (k = 0; k < sylHz.length; ++k) items.push ({ pts: contourPts ( sylHz[ k ] ), dur: durs[ k ] });
		var good = items.filter ( function ( x ) { return x.pts; } );
		if (o.refine !== false && !o.scale) scale = refineScale ( good, cands, scale );
		else if (o.refine === true && o.scale) scale = refineScale ( good, cands, scale );
		return { scale: scale, items: sylHz.map ( function ( hz, i ) { return detectScored ( hz, scale, cands, durs[ i ], o.learn ); } ) };
	}


	/* ------------------------------------------------------------------
	 * [學習] 人工標註記憶
	 * 使用者改了（或確認了）某個字的原聲調 → 記下「輪廓形狀（五度、去掉平均）＋高低（音域可信時）＋音長＋聲調」。
	 * 之後偵測時，與這些樣本最近的幾筆會和標準調值一起評分（樣本越多、越相近，影響越大）。
	 * 依「語言＋腔調」分開存；同一個字（輪廓相同）重標會取代舊的。存在 localStorage（pk_tc_learn），可匯出／匯入 JSON。
	 * ------------------------------------------------------------------ */
	var LEARN_KEY = 'pk_tc_learn', LEARN_MAX = 1200, FINE_N = 48;
	/* [新增] 細緻曲線：有聲幀的半音（先做 3 點中位數去掉追蹤的尖刺）→ 去平均 → 除以每度的半音數 → 重新取樣成 FINE_N 點 */
	function fineContour ( hz, step ) {
		if (!hz || hz.length < 3 || !( step > 0 )) return null;
		var st = hz.map ( semi ), n = st.length, i, md = [], m = 0, out = [];
		for (i = 0; i < n; ++i) { var t3 = [ st[ Math.max ( 0, i - 1 ) ], st[ i ], st[ Math.min ( n - 1, i + 1 ) ] ].sort ( function ( a, b ) { return a - b; } ); md.push ( t3[ 1 ] ); m += t3[ 1 ] / n; }
		for (i = 0; i < FINE_N; ++i) {
			var x = i / ( FINE_N - 1 ) * ( n - 1 ), j = Math.min ( n - 2, Math.floor ( x ) ), f = x - j, v = md[ j ] + ( md[ j + 1 ] - md[ j ] ) * f;
			out.push ( Math.round ( ( v - m ) / step * 1000 ) / 1000 );
		}
		return out;
	}
	var Learn = (function () {
		var db = null;
		function r2 ( v ) { return Math.round ( v * 100 ) / 100; }
		function load () {
			if (db) return db;
			try { db = JSON.parse ( w.localStorage.getItem ( LEARN_KEY ) || 'null' ); } catch (e) { db = null; }
			if (!db || !( db.items instanceof Array )) db = { v: 1, on: true, items: [] };
			if (db.on === undefined) db.on = true;
			return db;
		}
		function save () { try { w.localStorage.setItem ( LEARN_KEY, JSON.stringify ( db ) ); } catch (e) {} }
		function valid ( it ) {
			return it && typeof it.l === 'string' && typeof it.a === 'string' && typeof it.t === 'string' && it.s instanceof Array && it.s.length === 5 &&
				it.s.every ( function ( v ) { return isFinite ( v ); } ) && ( it.m == null || isFinite ( it.m ) );
		}
		function keyOf ( l, a, pts ) { return l + '|' + a + '|' + pts.map ( function ( v ) { return Math.round ( v * 10 ); } ).join ( ',' ); }
		function put ( it ) {
			var d = load (), i;
			for (i = 0; i < d.items.length; ++i) if (d.items[ i ].k === it.k) { d.items.splice ( i, 1 ); break; }
			d.items.push ( it );
			if (d.items.length > LEARN_MAX) d.items.splice ( 0, d.items.length - LEARN_MAX );
		}
		return {
			enabled: function () { return load ().on !== false; },
			setEnabled: function ( on ) { load ().on = !!on; save (); },
			/* 記下一個字。回傳 true＝有存 */
			add: function ( lang, acc, tone, pts, scale, dur, hz ) {
				if (!pts || !scale || !tone || tone === 'custom') return false;
				var p = degPts ( pts, scale ), mp = 0, q;
				for (q = 0; q < 5; ++q) mp += p[ q ] / 5;
				put ({ l: lang, a: acc, t: tone, s: p.map ( function ( v ) { return r2 ( v - mp ); } ), m: scale.reliable ? r2 ( mp - 3 ) : null, d: r2 ( dur || 0 ), c: fineContour ( hz, scale.step ), k: keyOf ( lang, acc, pts ), ts: Date.now () });
				save ();
				return true;
			},
			/* { 聲調id: [樣本] }（只取這個語言＋腔調） */
			templates: function ( lang, acc ) {
				var out = {}, items = load ().items;
				for (var i = 0; i < items.length; ++i) {
					var it = items[ i ];
					if (it.l !== lang || it.a !== acc) continue;
					( out[ it.t ] = out[ it.t ] || [] ).push ( it );
				}
				return out;
			},
			/* [新增] 可當範本的樣本（有細緻曲線的），依記錄順序 */
			tplOf: function ( lang, acc, tone ) {
				return load ().items.filter ( function ( it ) { return it.l === lang && it.a === acc && it.t === tone && it.c instanceof Array && it.c.length === FINE_N; } );
			},
			tplCount: function ( lang, acc ) {
				return load ().items.filter ( function ( it ) { return it.l === lang && it.a === acc && it.c instanceof Array && it.c.length === FINE_N; } ).length;
			},
			count: function ( lang, acc ) { return load ().items.filter ( function ( it ) { return it.l === lang && it.a === acc; } ).length; },
			total: function () { return load ().items.length; },
			byTone: function ( lang, acc ) {
				var o = {}; load ().items.forEach ( function ( it ) { if (it.l === lang && it.a === acc) o[ it.t ] = ( o[ it.t ] || 0 ) + 1; } );
				return o;
			},
			removeTone: function ( lang, acc, tone ) {
				var d = load (); d.items = d.items.filter ( function ( it ) { return !( it.l === lang && it.a === acc && it.t === tone ); } ); save ();
			},
			undoLast: function ( lang, acc ) {
				var d = load (), i;
				for (i = d.items.length - 1; i >= 0; --i) if (d.items[ i ].l === lang && d.items[ i ].a === acc) { d.items.splice ( i, 1 ); save (); return true; }
				return false;
			},
			clear: function ( lang, acc ) {
				var d = load ();
				d.items = lang ? d.items.filter ( function ( it ) { return !( it.l === lang && it.a === acc ); } ) : [];
				save ();
			},
			exportJSON: function () { var d = load (); return JSON.stringify ({ app: 'soundit-tone-learning', v: 1, items: d.items }, null, 1 ); },
			/* 匯入（合併；相同的字以匯入的為準）。回傳匯入筆數，格式不對回 -1 */
			importJSON: function ( text ) {
				var o; try { o = JSON.parse ( text ); } catch (e) { return -1; }
				var arr = o && ( o.items || ( o instanceof Array ? o : null ) );
				if (!( arr instanceof Array )) return -1;
				var n = 0; load ();
				arr.forEach ( function ( it ) { if (valid ( it ) && typeof it.k === 'string') { put ({ l: it.l, a: it.a, t: it.t, s: it.s.map ( r2 ), m: it.m == null ? null : r2 ( it.m ), d: r2 ( it.d || 0 ), c: it.c instanceof Array && it.c.length === FINE_N && it.c.every ( isFinite ) ? it.c.map ( function ( v ) { return Math.round ( v * 1000 ) / 1000; } ) : null, k: it.k, ts: it.ts || Date.now () }); ++n; } } );
				save ();
				return n;
			}
		};
	})();

	/* 依指派建立目標軌跡
	 *   track  PKF0 軌跡；syls  [{ i0, i1 }]（幀範圍 [i0,i1)）
	 *   plan   [{ from: 聲調 id 或五度字串, to: 聲調 id 或五度字串（null = 不變）}]，與 syls 同長
	 *   opts.range   五度（1→5）涵蓋的八度數，預設 1.0（每一度約 3 個半音）
	 *   opts.anchor  'src'（預設）原聲調的平均五度值對應到音節的平均音高；
	 *                'center' 目標聲調自己的平均對應到音節平均音高（整體音高不因換聲調而上下漂移）
	 * 回傳 { f0: Float32Array（目標）, changed: 動到的幀數 } */
	function buildTarget ( track, syls, plan, opts ) {
		opts = opts || {};
		var oct = opts.range > 0 ? opts.range : 1.0, step = oct / 4;
		var nat = opts.natural == null ? 0.7 : Math.max ( 0, Math.min ( 1, +opts.natural ) );   /* [新增] 自然度 0~1；0 ＝ 舊行為（純數學曲線） */
		var out = new Float32Array ( track.f0 ), changed = 0;
		var lo = Math.max ( 40, track.fmin || 60 ), hi = track.fmax || 800;

		/* [新增] 3 點平滑 n 次（兩端取鄰點，不縮邊） */
		function smooth3 ( a, n ) {
			var L = a.length, b = new Float32Array ( L ), t, j;
			for (t = 0; t < n; ++t) {
				for (j = 0; j < L; ++j) b[ j ] = ( a[ Math.max ( 0, j - 1 ) ] + a[ j ] * 2 + a[ Math.min ( L - 1, j + 1 ) ] ) / 4;
				a = Float32Array.from ( b );
			}
			return a;
		}
		/* [新增] 滑動平均（半寬 h 幀），用來把「慢變化」和「微小抖動」分開 */
		function boxAvg ( a, h ) {
			var L = a.length, b = new Float32Array ( L ), j, k, s, c;
			for (j = 0; j < L; ++j) {
				s = 0; c = 0;
				for (k = Math.max ( 0, j - h ); k <= Math.min ( L - 1, j + h ); ++k) { s += a[ k ]; ++c; }
				b[ j ] = s / c;
			}
			return b;
		}
		function cap ( v, c ) { return v > c ? c : v < -c ? -c : v; }

		for (var s = 0; s < syls.length; ++s) {
			var pl = plan[ s ];
			if (!pl || !pl.to) continue;
			var tgt = chaoOf ( pl.to );
			if (!tgt) continue;
			var src = chaoOf ( pl.from ) || chaoOf ( 't1' );
			var tc = pl.tpl && pl.tpl.c instanceof Array && pl.tpl.c.length > 1 ? pl.tpl.c : null;   /* [新增] 範本曲線 */

			var idx = [], i, m = 0;
			for (i = syls[ s ].i0; i < syls[ s ].i1 && i < track.n; ++i) if (track.f0[ i ] > 0) { idx.push ( i ); m += Math.log ( track.f0[ i ] ) / Math.LN2; }
			if (idx.length < 3) continue;
			m /= idx.length;

			var base = opts.anchor === 'center' ? chaoMean ( tgt ) : chaoMean ( src );
			var a = syls[ s ].i0, b = syls[ s ].i1 - 1, span = Math.max ( 1, b - a );
			var vals = new Float32Array ( idx.length ), sl = new Float32Array ( idx.length ), si = new Float32Array ( idx.length );
			for (var j = 0; j < idx.length; ++j) {
				var u = ( idx[ j ] - a ) / span;                           /* 以音節（含無聲）時間正規化 */
				vals[ j ] = m + ( chaoAt ( tgt, u ) - base ) * step;      /* log2(Hz)：理想目標曲線 */
				/* [新增] 有範本：整體高度仍由調值決定（字高設定照常有效），形狀與起伏改用範本的真實曲線（以有聲幀正規化） */
				if (tc) vals[ j ] = m + ( chaoMean ( tgt ) - base ) * step + tplAt ( tc, j / ( idx.length - 1 ) ) * step;
				sl[ j ] = Math.log ( track.f0[ idx[ j ] ] ) / Math.LN2;   /* [新增] 原音實際曲線 */
				si[ j ] = m + ( chaoAt ( src, u ) - chaoMean ( src ) ) * step;   /* [新增] 原聲調的理想曲線 */
			}

			/* [修改] 平滑：舊版只平滑 1 次（轉折很尖、像機器）；自然度越高，轉折越圓（約 20~30 ms 的反應時間） */
			vals = smooth3 ( vals, tc ? 1 : 1 + Math.round ( nat * 5 ) );   /* [修改] 範本已有真實起伏，只輕輕平滑一次 */

			if (nat > 0) {
				/* [新增] 把原音的「自然成分」帶回來：
				 *  micro ＝ 原音減去它自己的慢變化 ＝ 逐週期抖動、嗓音嘎裂、子音造成的微擾（真人聲音的質感）
				 *  dev   ＝ 原音的慢變化減去原聲調的理想曲線 ＝ 這位說話者／這個字自己的小起伏、字尾下沉
				 *  這兩項與原聲調的形狀無關，所以搬到新聲調上不會把舊聲調帶過來。 */
				var slow = boxAvg ( sl, 3 );
				for (j = 0; j < idx.length; ++j) {
					var micro = cap ( sl[ j ] - slow[ j ], 0.035 ) * nat;                 /* 上限約 0.4 半音，防止八度誤判的尖峰 */
					var dev = cap ( slow[ j ] - si[ j ], 0.06 ) * ( tc ? 0 : 0.5 ) * nat;              /* 上限約 0.7 半音 */
					vals[ j ] += micro + dev;
				}
			}

			for (j = 0; j < idx.length; ++j) {
				var h = Math.pow ( 2, vals[ j ] );
				out[ idx[ j ] ] = Math.max ( lo, Math.min ( hi, h ) );
				++changed;
			}
		}
		return { f0: out, changed: changed };
	}

	/* ------------------------------------------------------------------
	 * [階段 3] 逐字／局部運算（純函式，Node 也能跑）
	 *
	 * 只重新合成「要改的那一段」：取樣範圍 [a, b)（含試聽用的前後 pad），再往兩側各多給 CTX_SEC 當緩衝
	 * （PSOLA 的音高標記與窗在邊緣不完整，緩衝只是用來讓 [a, b) 內部和整段處理時一樣；輸出時丟掉）。
	 * 用 opts.trackOffset 告訴引擎「這一小段從軌跡的哪個時間開始」，所以不必重新分析音高。
	 * ------------------------------------------------------------------ */
	var CTX_SEC = 0.06, FADE_SEC = 0.01, SYL_PAD = 0.03, SMALL_SEC = 0.6;

	/* 目標 F0 與原軌跡不同的音節範圍 [k0, k1]（索引）；沒有任何改動回 null */
	function changedRange ( track, syls, tgF0 ) {
		var k0 = -1, k1 = -1, k, i;
		for (k = 0; k < syls.length; ++k) {
			var hit = false;
			for (i = syls[ k ].i0; i < syls[ k ].i1 && i < track.n; ++i) if (tgF0[ i ] !== track.f0[ i ]) { hit = true; break; }
			if (hit) { if (k0 < 0) k0 = k; k1 = k; }
		}
		return k0 < 0 ? null : [ k0, k1 ];
	}
	/* 目標軌跡某幀範圍的雜湊（試聽快取用） */
	function hashF0 ( f0, i0, i1 ) {
		var h = 7, i;
		for (i = i0; i < i1 && i < f0.length; ++i) h = ( h * 31 + ( f0[ i ] * 7 | 0 ) ) | 0;
		return h;
	}
	/* 音節 k0..k1 的取樣範圍 [a, b)，前後各加 pad 秒 */
	function spanOf ( syls, k0, k1, sr, n, pad ) {
		pad = pad == null ? SYL_PAD : pad;
		return [ Math.max ( 0, Math.round ( ( syls[ k0 ].a - pad ) * sr ) ), Math.min ( n, Math.round ( ( syls[ k1 ].b + pad ) * sr ) ) ];
	}

	/* 主執行緒執行（回 { promise, cancel }，與 workerRun 介面相同） */
	function directRun ( chans, sr, opts, onprog ) {
		var dead = false, timer = 0, job = {};
		job.promise = new Promise ( function ( resolve, reject ) {
			timer = setTimeout ( function () {
				if (dead) return ;
				try {
					var o = {}, k; for (k in opts) o[ k ] = opts[ k ];
					o.onprogress = onprog || null;
					resolve ( w.PKTimePitch.process ( chans, sr, o ) );
				} catch (e) { reject ( e ); }
			}, 0 );
		});
		job.cancel = function () { dead = true; clearTimeout ( timer ); };
		return job;
	}
	/* Worker 優先（timepitch-worker.js 與「時間與音高」共用同一個檔案與版本號）；建不起來或出錯就退回主執行緒 */
	function workerRun ( chans, sr, opts, onprog ) {
		var worker = null, dead = false, fb = null, job = {};
		job.promise = new Promise ( function ( resolve, reject ) {
			function fallback () {
				if (dead || fb) return ;
				fb = directRun ( chans.map ( function ( c ) { return new Float32Array ( c ); } ), sr, opts, onprog );
				fb.promise.then ( resolve, reject );
			}
			if (typeof w.Worker !== 'function') return fallback ();
			var bufs = chans.map ( function ( c ) { return c.slice ().buffer; } ), o2 = {}, k;
			for (k in opts) if (typeof opts[ k ] !== 'function') o2[ k ] = opts[ k ];
			try { worker = new w.Worker ( 'timepitch-worker.js?v=tp9' ); } catch (e) { return fallback (); }
			worker.onmessage = function ( e ) {
				var m = e.data || {};
				if (dead) return ;
				if (m.progress !== undefined) return onprog && onprog ( m.progress );
				if (m.error) { worker.terminate (); worker = null; return reject ( new Error ( m.error ) ); }
				if (m.done) { worker.terminate (); worker = null; resolve ( m.buffers.map ( function ( b ) { return new Float32Array ( b ); } ) ); }
			};
			worker.onerror = function () { if (worker) { try { worker.terminate (); } catch (e) {} worker = null; } fallback (); };
			worker.postMessage ({ id: 1, sr: sr, opts: o2, buffers: bufs }, bufs );
		});
		job.cancel = function () { dead = true; if (worker) { try { worker.terminate (); } catch (e) {} worker = null; } fb && fb.cancel (); };
		return job;
	}
	/* 短的（< SMALL_SEC 秒，大約一個字）直接在主執行緒算：開 Worker 要重新載入 4 個腳本，比算還久 */
	function smartRun ( chans, sr, opts, onprog ) {
		return chans[ 0 ].length / sr < SMALL_SEC ? directRun ( chans, sr, opts, onprog ) : workerRun ( chans, sr, opts, onprog );
	}

	/* 合成 [a, b)：回 { job, promise → { outs（每聲道 b−a 個取樣，音長不變）, s0, s1, a, b } }
	 *   chans 全段各聲道；track 原軌跡；tgF0 目標 F0（與 track.f0 同長）；run = smartRun 之類 */
	function renderSpan ( chans, sr, track, tgF0, a, b, run, onprog ) {
		var n = chans[ 0 ].length, c = Math.round ( CTX_SEC * sr ), s0 = Math.max ( 0, a - c ), s1 = Math.min ( n, b + c ), k;
		var t2 = {}; for (k in track) if (Object.prototype.hasOwnProperty.call ( track, k )) t2[ k ] = track[ k ];
		t2.f0 = tgF0;
		var segs = chans.map ( function ( ch ) { return ch.slice ( s0, s1 ); } );
		var job = run ( segs, sr, { mode: 'psola', pitch: 0, tempo: 1, f0: track, f0Target: t2, trackOffset: s0 / sr }, onprog );
		return { job: job, promise: job.promise.then ( function ( outs ) {
			return { outs: outs.map ( function ( o ) { return o.subarray ( a - s0, b - s0 ); } ), s0: s0, s1: s1, a: a, b: b };
		}) };
	}
	/* 把合成好的 [a, b) 放回整段：[a, b) 以外原封不動；[a, b) 兩端各 FADE_SEC 與原音交叉淡化（碰到整段的頭尾就不淡化） */
	function spliceSpan ( chans, r, sr ) {
		var n = chans[ 0 ].length, fn = Math.max ( 1, Math.round ( FADE_SEC * sr ) ), c, i;
		return chans.map ( function ( ch, q ) {
			var out = new Float32Array ( ch ), pr = r.outs[ q ];
			for (i = r.a; i < r.b; ++i) {
				var wt = 1;
				if (r.a > 0) wt = Math.min ( wt, ( i - r.a + 1 ) / ( fn + 1 ) );
				if (r.b < n) wt = Math.min ( wt, ( r.b - i ) / ( fn + 1 ) );
				out[ i ] = ch[ i ] * ( 1 - wt ) + pr[ i - r.a ] * wt;
			}
			return out;
		});
	}
	/* 各聲調 id 的音節數：ids = 每個字的原聲調（自訂五度標記的字不計）；回 { id: 數量 } */
	function countByTone ( ids ) {
		var m = {};
		ids.forEach ( function ( id ) { if (id && !/^[1-5]+$/.test ( id )) m[ id ] = ( m[ id ] || 0 ) + 1; } );
		return m;
	}

	/* ------------------------------------------------------------------
	 * 視窗（v4：頁籤＋可停靠側邊欄）
	 * ------------------------------------------------------------------ */
	var DK_KEY = 'pk_tc_dock', DW_KEY = 'pk_tc_dw', DW_DEF = 480, DW_MIN = 300, EDGE = 72;
	var dMode = (function () { try { var v = w.localStorage.getItem ( DK_KEY ); return v === 'l' || v === 'r' ? v : 'f'; } catch (e) { return 'f'; } })();
	var dW = (function () { try { var v = parseInt ( w.localStorage.getItem ( DW_KEY ), 10 ); return v > 0 ? v : DW_DEF; } catch (e) { return DW_DEF; } })();
	var cur = null;          /* 目前開著的視窗（事件轉送用） */

	var CSS =
		/* 主題：全部沿用 main.css 的變數（標記清單同一組），取不到時才用淺色備援 */
		'.pk_tc_back{--tc-bg:var(--bg-2,#fff);--tc-bg1:var(--bg-1,#f6f8fa);--tc-bg3:var(--bg-3,#e8ebef);--tc-fg:var(--fg-0,#222);--tc-fg1:var(--fg-1,#555);--tc-fg2:var(--fg-2,#888);--tc-bd:var(--bd,#d8d8d8);--tc-bdh:var(--bd-h,#aaa);--tc-ac:var(--ac,#1a73e8);--tc-acs:var(--ac-soft,rgba(26,115,232,.12));--tc-ok:var(--ok,#1e7e34);--tc-warn:var(--warn,#b3590a);--tc-rec:var(--rec,#d93025);--tc-fgb:var(--bg-0,#fff);' +
			'--tc-lo:color-mix(in srgb,var(--tc-rec) 15%,transparent);--tc-md:color-mix(in srgb,var(--tc-warn) 14%,transparent)}' +
		/* 浮動＝原本的置中對話框（有遮罩）；停靠＝貼在工具列下方的側邊欄（沒有遮罩，主畫面照常操作） */
		'.pk_tc_back{position:fixed;inset:0;z-index:100000;background:rgba(0,0,0,.5);display:flex;align-items:center;justify-content:center}' +
		'.pk_tc_back.pk_tc_docked{inset:auto;bottom:0;background:none;display:block;z-index:12}' +
		'.pk_tc_back.pk_tc_dkl{left:0;right:auto}.pk_tc_back.pk_tc_dkr{right:0;left:auto}' +
		'.pk_tc{position:relative;background:var(--tc-bg);color:var(--tc-fg);border:1px solid var(--tc-bd);border-radius:12px;width:min(760px,96vw);max-height:94vh;overflow:hidden;display:flex;flex-direction:column;padding:10px 14px;box-sizing:border-box;font:13px/1.4 var(--ff,system-ui,"Noto Sans TC",sans-serif);box-shadow:0 10px 40px rgba(0,0,0,.45)}' +
		'.pk_tc_docked .pk_tc{width:100%;height:100%;max-height:none;border-radius:0;box-shadow:none;border-width:0 0 0 1px}.pk_tc_dkl .pk_tc{border-width:0 1px 0 0}' +
		/* 標題列（可拖：拖到畫面左右邊緣＝停靠；停靠後拖離＝浮動） */
		'.pk_tc_hd{display:flex;align-items:center;justify-content:space-between;gap:4px 10px;flex-wrap:wrap;margin-bottom:6px;cursor:move;user-select:none;-webkit-user-select:none;touch-action:none}' +
		'.pk_tc_ttl{font-size:16px;font-weight:600}.pk_tc_hr{display:flex;align-items:center;gap:8px}' +
		'.pk_tc_x{width:26px;height:26px;padding:0;border-radius:50%;border:1px solid var(--tc-bd);background:var(--tc-bg);color:var(--tc-fg1);font-size:13px;line-height:1;cursor:pointer}.pk_tc_x:hover{color:var(--tc-fg);border-color:var(--tc-bdh)}' +
		'.pk_tc_dks{display:flex;gap:2px}.pk_tc button.pk_tc_dkb{width:auto;height:auto;padding:3px 4px;line-height:0;border:0;border-radius:3px;background:none;color:var(--tc-fg2);cursor:pointer}.pk_tc button.pk_tc_dkb:hover{color:var(--tc-fg);background:var(--tc-bg3)}.pk_tc button.pk_tc_dkb.on{color:var(--tc-ac)}' +
		'@media (max-width:760px){.pk_tc_dks{display:none}}' +
		'.pk_tc_bd{flex:1 1 auto;min-height:0;overflow:auto;display:flex;flex-direction:column}.pk_tc_bd>*{flex:none}' +
				'.pk_tc_bar{display:flex;flex-wrap:wrap;align-items:center;gap:4px 8px;margin:0 0 8px}.pk_tc_bar>span{white-space:nowrap}' +
		/* 按鈕 */
		'.pk_tc button.pk_tc_b{height:28px;padding:0 12px;border:1px solid var(--tc-bd);border-radius:14px;background:var(--tc-bg);color:var(--tc-fg);font:inherit;cursor:pointer;white-space:nowrap}' +
		'.pk_tc button.pk_tc_b:hover{border-color:var(--tc-bdh);background:var(--tc-bg3)}.pk_tc button.pk_tc_b.pri{background:var(--tc-ac);border-color:var(--tc-ac);color:var(--tc-fgb);min-width:64px}.pk_tc button.pk_tc_b[disabled]{opacity:.45;cursor:default}' +
		'.pk_tc button.pk_tc_i{width:26px;height:26px;padding:0;border-radius:50%;font-size:14px;line-height:1}.pk_tc button.pk_tc_i.w{background:var(--tc-md);border-color:var(--tc-warn);color:var(--tc-warn)}' +
		'.pk_tc button.pk_tc_p{height:24px;min-width:30px;padding:0 8px;margin-right:3px;border:1px solid var(--tc-bd);border-radius:12px;background:var(--tc-bg);color:var(--tc-fg);font-size:12px;cursor:pointer}.pk_tc button.pk_tc_p:hover{background:var(--tc-acs);border-color:var(--tc-bdh)}' +
		/* 下拉選單 */
		'.pk_tc select,.pk_tc input[type=text]{font:inherit;height:28px;padding:0 4px;border:1px solid var(--tc-bd);border-radius:6px;background:var(--tc-bg1);color:var(--tc-fg);max-width:100%;box-sizing:border-box}.pk_tc input[type=text]{width:60px;padding:0 6px}' +
		'.pk_tc select:focus-visible,.pk_tc input:focus-visible,.pk_tc button:focus-visible{outline:2px solid var(--tc-ac);outline-offset:1px}' +
		'.pk_tc input[type=range]{accent-color:var(--tc-ac)}' +
		'.pk_tc select[data-k=lang],.pk_tc select[data-k=reg]{width:auto;min-width:0}.pk_tc_nw .pk_tc_fl{display:none}.pk_tc select[data-k=all]{width:auto;max-width:78px}.pk_tc select[data-k=refn]{width:56px}.pk_tc select[data-k=reft]{width:68px}.pk_tc select[data-k=anchor]{width:104px}' +
		'.pk_tc_bar>span[data-k]{display:inline-flex;align-items:center;gap:4px;flex-wrap:nowrap}.pk_tc_bar>span[data-k] select,.pk_tc_bar>span[data-k] input{flex:none}' +
		/* 音高圖（顏色在 JS 內從同一組變數讀） */
		'.pk_tc_cv{width:100%;height:128px;display:block;background:var(--tc-bg1);border:1px solid var(--tc-bd);border-radius:6px;box-sizing:border-box}.pk_tc_cv.clk{cursor:pointer}' +
		'.pk_tc_docked .pk_tc_cv{height:clamp(96px,20vh,170px)}' +
		'.pk_tc_bd>.pk_tc_bar{margin:6px 0 0}' +
		'.pk_tc_pn{display:none}.pk_tc_pn.on{display:block}' +
		'.pk_tc_docked .pk_tc_pn.on{display:flex;flex-direction:column;flex:1 1 auto;min-height:100px}' +
		/* 依原聲調對應（頁籤二） */
		'.pk_tc_map{display:block;margin:0}' +
		'.pk_tc_mpop{display:none;position:absolute;left:10px;right:10px;z-index:8;max-height:70%;overflow:auto;padding:8px 10px;background:var(--tc-bg);border:1px solid var(--tc-bd);border-radius:10px;box-shadow:0 8px 24px rgba(0,0,0,.28)}' +
		'.pk_tc_bdg{display:inline-block;min-width:16px;margin-left:5px;padding:0 5px;border-radius:8px;background:var(--tc-acs);color:var(--tc-ac);font-size:11px;line-height:16px;text-align:center}' +
		'.pk_tc_mh{display:flex;flex-wrap:wrap;align-items:center;gap:4px 6px;margin-bottom:4px}.pk_tc_mt{font-weight:600;white-space:nowrap}.pk_tc_mi{flex:1 1 160px;color:var(--tc-fg2);font-size:12px}' +
		'.pk_tc_map button.pk_tc_b{height:24px;padding:0 9px;font-size:12px;border-radius:12px}' +
		'.pk_tc_mg{display:grid;grid-template-columns:repeat(auto-fill,minmax(190px,1fr));gap:4px 10px}.pk_tc_mg label{display:flex;align-items:center;gap:3px;white-space:nowrap;min-width:0}' +
		'.pk_tc_mg select{flex:1 1 0;min-width:0;width:auto;height:26px}' +
		'.pk_tc_sh{display:flex;align-items:center;gap:8px;margin:10px 0 4px;font-size:12px;font-weight:600;color:var(--tc-fg2)}.pk_tc_hint{font-size:12px;color:var(--tc-fg2);line-height:1.5;margin:2px 0 4px}' +
		'.pk_tc_n{margin-left:2px;font-size:12px;color:var(--tc-ac);font-weight:600}.pk_tc_n.z{color:var(--tc-fg2);font-weight:400}.pk_tc_map label.z{color:var(--tc-fg2)}' +
		/* 逐字表格（頁籤一）：浮動時最高約 3 列；停靠時填滿剩餘高度 */
		'.pk_tc_tb{max-height:132px;overflow:auto;border:1px solid var(--tc-bd);border-radius:6px}.pk_tc_docked .pk_tc_tb{flex:1 1 auto;min-height:60px;max-height:none}' +
		'.pk_tc table{border-collapse:collapse;width:100%}.pk_tc th,.pk_tc td{padding:2px 6px;text-align:left;border-bottom:1px solid var(--tc-bd);font-size:13px;white-space:nowrap}' +
		'.pk_tc th{position:sticky;top:0;background:var(--tc-bg1);color:var(--tc-fg1);font-weight:500;z-index:1}' +
		'.pk_tc td select{width:98px}.pk_tc td select[data-r=to]{width:132px}' +
		'.pk_tc_cell{display:flex;align-items:center;gap:4px;flex-wrap:nowrap}.pk_tc_cell select{flex:none}.pk_tc td input[type=text]{width:52px;max-width:none;flex:none;height:26px}' +
		'' +
		'.pk_tc button.pk_tc_rst{height:22px;min-width:22px;margin:0;padding:0 6px;border-color:var(--tc-ac);color:var(--tc-ac)}' +
		'.pk_tc button.pk_tc_tp{height:22px;margin:0 0 0 4px;padding:0 6px;border:0;color:var(--tc-ac);white-space:nowrap}.pk_tc_nw button.pk_tc_tp{padding:0 3px}' +
		'.pk_tc tr.pk_tc_lo select[data-r=from]{border-bottom:2px solid var(--tc-ac)}.pk_tc tr.pk_tc_md select[data-r=from]{border-bottom:2px solid color-mix(in srgb,var(--tc-ac) 38%,transparent)}.pk_tc_c_high{color:var(--tc-ok)}.pk_tc_c_mid{color:var(--tc-warn);font-weight:600;cursor:help}.pk_tc_c_low{color:var(--tc-rec);font-weight:700;cursor:help}.pk_tc_c0{color:var(--tc-fg2)}' +
		'.pk_tc tr.pk_tc_ov td.pk_tc_tc{background:var(--tc-acs)}.pk_tc tr.pk_tc_ov select[data-r=to]{border-color:var(--tc-ac)}' +
		'.pk_tc tr.pk_tc_sel td{box-shadow:inset 0 -2px 0 var(--tc-ac)}' +
		'.pk_tc tr.pk_tc_ch td:first-child{box-shadow:inset 3px 0 0 var(--tc-rec)}.pk_tc tr.pk_tc_ch.pk_tc_sel td:first-child{box-shadow:inset 3px 0 0 var(--tc-rec),inset 0 -2px 0 var(--tc-ac)}' +
		/* 依面板自己的寬度排版（ResizeObserver 加 class，不看視窗寬度） */
		'.pk_tc_nw .pk_tc_tm,.pk_tc_nw .pk_tc_cf{display:none}.pk_tc_nw .pk_tc_ttl{font-size:15px}' +
		/* [修改] 窄版：不顯示「信心」欄（低信心仍由整列底色標示）；原聲調只顯示調值數字，選單縮窄、欄距與按鈕縮小 */
		'.pk_tc_nw th,.pk_tc_nw td{padding:2px 4px}' +
		'.pk_tc_nw td select{padding:0 2px}.pk_tc_nw td select[data-r=from]{width:54px}.pk_tc_nw td select[data-r=to]{width:88px}' +
		'.pk_tc_nw td input[type=text]{width:40px}.pk_tc_nw .pk_tc_cell{gap:2px}' +
		'.pk_tc_nw button.pk_tc_p{min-width:0;padding:0 5px;margin-right:2px}.pk_tc_nw button.pk_tc_rst{padding:0 4px;min-width:20px}' +
		'.pk_tc_nw th select.pk_tc_hs{width:52px;margin-left:2px}' +
		'.pk_tc_xs .pk_tc_mg{grid-template-columns:1fr 1fr;gap:4px 6px}.pk_tc_xs .pk_tc_mg label{font-size:12px}.pk_tc_xs .pk_tc_rl span{display:none}' +
		/* 過期／選取範圍提示 */
		'.pk_tc_nt2{display:none;margin:0 0 6px;padding:3px 8px;border-radius:6px;font-size:12px}.pk_tc_nt2.on{display:block}.pk_tc_nt2.st{background:var(--tc-lo);color:var(--tc-rec)}.pk_tc_nt2.sl{background:var(--tc-acs);color:var(--tc-fg1)}' +
		/* 底部固定 */
		'.pk_tc_ft{flex:none;border-top:1px solid var(--tc-bd);margin-top:8px;padding-top:8px}.pk_tc_ft .pk_tc_bar{margin:0;gap:6px}.pk_tc_st{flex:1 1 40px;min-width:0;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;text-align:right;color:var(--tc-fg2);font-size:12px}' +
		/* 側邊分隔條、拖曳預覽、停靠時讓出版面（與標記清單相同做法，用自己的 class 與變數） */
		'.pk_tc_sp{display:none;position:absolute;top:0;bottom:0;width:6px;z-index:6;cursor:ew-resize;touch-action:none}.pk_tc_sp:hover,.pk_tc_sp.on{background:var(--tc-ac);opacity:.55}' +
		'.pk_tc_dkr .pk_tc_sp{display:block;left:0}.pk_tc_dkl .pk_tc_sp{display:block;right:0}' +
		'.pk_tc_drop{position:fixed;z-index:100001;display:none;pointer-events:none;box-sizing:border-box;background:var(--ac-soft,rgba(26,115,232,.15));border:2px dashed var(--ac,#1a73e8)}' +
		'body.pk_tcd_l #app>:not(.pk_hdr):not(.pk_tbc):not(.pk_ttip){margin-left:var(--pk_tcw)}' +
		'body.pk_tcd_r #app>:not(.pk_hdr):not(.pk_tbc):not(.pk_ttip){margin-right:var(--pk_tcw)}' +
		'body.pk_tcd_l #app>.pk_dck,body.pk_tcd_r #app>.pk_dck{width:auto}' +
		/* 說明視窗（蓋在面板內） */
		'.pk_tc_pop{display:none;position:absolute;inset:0;z-index:5;background:rgba(0,0,0,.35);border-radius:inherit;align-items:center;justify-content:center}' +
		'.pk_tc_pi{background:var(--tc-bg);color:var(--tc-fg);border:1px solid var(--tc-bd);border-radius:10px;width:min(560px,92%);max-height:82%;display:flex;flex-direction:column;box-shadow:0 6px 24px rgba(0,0,0,.35)}' +
		'.pk_tc_ph{display:flex;align-items:center;justify-content:space-between;padding:10px 14px;border-bottom:1px solid var(--tc-bd);font-size:15px;font-weight:600}' +
		'.pk_tc_pb{padding:10px 14px 4px;overflow:auto}.pk_tc_pb>div{margin:0 0 10px;font-size:13px;line-height:1.55}.pk_tc_pb>div:empty{display:none}' +
		'.pk_tc_regw,.pk_tc_warn{color:var(--tc-warn)}.pk_tc_nfo{color:var(--tc-fg1)}.pk_tc_note{color:var(--tc-fg2)}' +
		/* v5：標題旁的重讀鈕、成對的「標籤＋控制項」（換行時不拆開）、表頭小選單 */
		'.pk_tc_hl{display:flex;align-items:center;gap:6px 10px;min-width:0;flex-wrap:wrap}' +
		'.pk_tc_f{display:inline-flex;align-items:center;gap:4px;white-space:nowrap;color:var(--tc-fg1)}' +
		'.pk_tc_fr{flex:1 1 210px;min-width:0}.pk_tc_fr input[type=range]{flex:1 1 60px;min-width:60px;max-width:220px}.pk_tc_fr [data-k=rangev]{color:var(--tc-fg)}' +
		/* [新增] 圖上的浮動切分工具、頁尾「音高設定」彈出面板 */
		'.pk_tc_cw{position:relative;margin:8px 0 10px}.pk_tc_chip{position:absolute;z-index:5;display:none;gap:2px;padding:3px;background:var(--tc-bg);border:1px solid var(--tc-bdh);border-radius:15px;box-shadow:0 4px 14px rgba(0,0,0,.25)}' +
		'.pk_tc button.pk_tc_cb{height:24px;padding:0 10px;border:0;border-radius:12px;background:transparent;color:var(--tc-fg);font:inherit;font-size:12px;cursor:pointer;white-space:nowrap}.pk_tc button.pk_tc_cb:hover,.pk_tc button.pk_tc_cb:focus-visible{background:var(--tc-acs)}' +
		'.pk_tc_ft{position:relative}.pk_tc_advp{position:absolute;z-index:6;left:0;right:0;bottom:calc(100% + 4px);display:none;padding:10px 12px;background:var(--tc-bg);border:1px solid var(--tc-bdh);border-radius:10px;box-shadow:0 6px 18px rgba(0,0,0,.25)}' +
		'.pk_tc_ft .pk_tc_advp .pk_tc_bar{margin:0 0 8px}.pk_tc_ft .pk_tc_advp .pk_tc_bar:last-child{margin:0}' +
		'.pk_tc button.pk_tc_b.on{background:var(--tc-acs);border-color:var(--tc-ac);color:var(--tc-ac)}' +
		'.pk_tc button.pk_tc_rl{height:26px;padding:0 10px;font-size:12px}.pk_tc button.pk_tc_rl.hot{background:var(--tc-ac);border-color:var(--tc-ac);color:var(--tc-fgb)}' +
		'.pk_tc th select.pk_tc_hs{display:inline-block;vertical-align:middle;height:20px;margin-left:6px;padding:0 2px;font-size:12px;border-color:transparent;background:transparent;color:var(--tc-fg2);cursor:pointer}' +
		'.pk_tc th select.pk_tc_hs:hover,.pk_tc th select.pk_tc_hs:focus-visible{border-color:var(--tc-bd);color:var(--tc-fg)}' +
		/* 樣式分層（一眼分得出能不能點、重不重要）：
		 * ① 主要＝實心強調色（套用）　② 次要＝灰底膠囊（原音、轉換後、重新讀取、本調設定）
		 * ③ 輔助＝無底無框（★、音高設定、列上的 ▶ 原／後、ⓘ、✕）　④ 欄位＝方角、淺底、細框（語言、基準）
		 * 表格裡的選單＝平常無框，滑過才有底；「改成」依狀態分三級：不變（淡）→ 依對應會改（正常）→ 逐字指定（強調色） */
		'.pk_tc button.pk_tc_b{height:24px;padding:0 11px;font-size:12px;border:0;border-radius:12px;background:var(--tc-bg3);color:var(--tc-fg)}' +
		'.pk_tc button.pk_tc_b[data-k=lrn],.pk_tc button.pk_tc_b[data-k=adv]{padding:0 8px;background:transparent;color:var(--tc-fg1)}' +
		'.pk_tc button.pk_tc_b[data-k=lrn]:hover,.pk_tc button.pk_tc_b[data-k=adv]:hover{background:var(--tc-bg3);color:var(--tc-fg)}' +
		'.pk_tc button.pk_tc_i,.pk_tc button.pk_tc_x{width:26px;height:26px;padding:0;border:0;border-radius:50%;background:transparent;color:var(--tc-fg1);font-size:14px}' +
		'.pk_tc button.pk_tc_i:hover,.pk_tc button.pk_tc_x:hover{background:var(--tc-bg3);color:var(--tc-fg)}' +
		'.pk_tc button.pk_tc_i.w{color:var(--tc-warn)}' +
		'.pk_tc select,.pk_tc input[type=text]{height:24px;font-size:12px;border:1px solid var(--tc-bd);border-radius:6px;background:var(--tc-bg1)}' +
		'.pk_tc td select,.pk_tc td input[type=text]{height:22px;padding:0 2px;border-color:transparent;background:transparent}' +
		'.pk_tc td select:hover,.pk_tc td input[type=text]:hover{background:var(--tc-bg3);border-color:transparent}' +
		'.pk_tc td select[data-r=from]{width:auto;min-width:48px}.pk_tc td select[data-r=to]{width:116px;color:var(--tc-fg2)}' +
		'.pk_tc tr.pk_tc_ch select[data-r=to]{color:var(--tc-fg);font-weight:500}' +
		'.pk_tc tr.pk_tc_ov td.pk_tc_tc{background:transparent}.pk_tc tr.pk_tc_ov select[data-r=to]{background:var(--tc-acs);color:var(--tc-ac);border-color:transparent;font-weight:500}' +
		'.pk_tc_cv{border:0}.pk_tc_tb{border:0}' +
		'.pk_tc th,.pk_tc td{padding:1px 6px;font-size:12px;vertical-align:middle;border-bottom:1px solid color-mix(in srgb,var(--tc-bd) 40%,transparent)}' +
		'.pk_tc th{height:24px;color:var(--tc-fg2);font-weight:400}' +
		'.pk_tc tr.pk_tc_sel td{background:var(--tc-acs);box-shadow:none}.pk_tc tr.pk_tc_ch td:first-child,.pk_tc tr.pk_tc_ch.pk_tc_sel td:first-child{box-shadow:inset 3px 0 0 var(--tc-rec)}' +
		'.pk_tc button.pk_tc_p{height:20px;min-width:0;margin:0 2px 0 0;padding:0 6px;border:0;border-radius:10px;background:transparent;color:var(--tc-ac);font-size:11px}.pk_tc button.pk_tc_p:hover{background:var(--tc-acs)}' +
		'.pk_tc button.pk_tc_rst{height:20px;min-width:20px;padding:0 4px;border:0;color:var(--tc-ac)}' +
		'.pk_tc tr.pk_tc_sel td.pk_tc_tc,.pk_tc tr.pk_tc_ov.pk_tc_sel td.pk_tc_tc{background:var(--tc-acs)}' +
		'.pk_tc_ft{border-top:0;margin-top:6px;padding-top:2px}.pk_tc_ft .pk_tc_bar{gap:4px}' +
		'.pk_tc_chip{top:auto;bottom:calc(100% + 4px);right:0;left:auto;z-index:7;padding:3px 4px;gap:4px;align-items:center;background:var(--tc-bg);border:1px solid var(--tc-bd);border-radius:15px;box-shadow:0 4px 14px rgba(0,0,0,.22)}' +
		'.pk_tc_chl{color:var(--tc-fg2);font-size:11px;margin-right:2px}' +
		'.pk_tc button.pk_tc_cb{height:22px;padding:0 9px;border-radius:11px;font-size:12px;background:var(--tc-bg3)}.pk_tc button.pk_tc_cb:hover,.pk_tc button.pk_tc_cb:focus-visible{background:var(--tc-acs);color:var(--tc-ac)}' +
		/* 播放中：實心強調色（按鈕本身也會從 ▶ 變 ■） */
		'.pk_tc_ic{display:inline-block;width:1em;text-align:center}' +
		'.pk_tc button.pk_tc_b.pk_tc_pl,.pk_tc button.pk_tc_b.pk_tc_pl:hover{background:var(--tc-ac);color:var(--tc-fgb)}' +
		'.pk_tc button.pk_tc_p.pk_tc_pl,.pk_tc button.pk_tc_p.pk_tc_pl:hover{background:var(--tc-ac);color:var(--tc-fgb)}' +
		'.pk_tc_map select{height:24px}' +
		/* [新增 v8] 聲調設定：調值、增加聲調面板、額外聲調的移除鈕 */
		'.pk_tc_mg{grid-template-columns:repeat(auto-fill,minmax(270px,1fr));gap:6px 14px}' +
		'.pk_tc_mg label{display:flex;align-items:center;gap:6px}' +
		'.pk_tc_lh{flex:none;display:flex;align-items:baseline;width:11.5em;white-space:nowrap}.pk_tc_lh.z{color:var(--tc-fg2)}' +
		'.pk_tc_ln{flex:1 1 auto;min-width:0;overflow:hidden;text-overflow:ellipsis}' +
		'.pk_tc_ch{flex:none;min-width:3.2em;text-align:right;font-size:12px;color:var(--tc-fg2);font-variant-numeric:tabular-nums}' +
		'.pk_tc_lh .pk_tc_n{flex:none;min-width:2.2em;margin:0;text-align:right}.pk_tc_ar{flex:none;margin-left:6px}' +
		'.pk_tc_xs .pk_tc_mg{grid-template-columns:1fr}' +
		'.pk_tc_addp{display:flex;flex-wrap:wrap;align-items:center;gap:4px 6px;margin:0 0 8px;padding:6px 8px;border:1px dashed var(--tc-bd);border-radius:8px}' +
		'.pk_tc_addp select{min-width:0;max-width:100%;height:26px}.pk_tc_addp input[type=text]{width:64px;height:26px}' +
		'.pk_tc button.pk_tc_xr{flex:none;width:18px;height:18px;margin:0;padding:0;border:0;border-radius:9px;background:transparent;color:var(--tc-fg2);font-size:10px;line-height:18px;cursor:pointer}' +
		'.pk_tc button.pk_tc_xr:hover,.pk_tc button.pk_tc_xr:focus-visible{background:var(--tc-bg3);color:var(--tc-fg)}';

	var DK_SVG = {
		l: '<rect x="1" y="1" width="5" height="10" fill="currentColor"/>',
		r: '<rect x="10" y="1" width="5" height="10" fill="currentColor"/>',
		f: '<rect x="4.5" y="3.5" width="7" height="5" fill="none" stroke="currentColor"/>'
	};
	function dkBtn ( k ) {
		var tip = { l: tf ( 'tc.dk_l', '停靠到左側（也可把標題列拖到畫面左邊緣）', 'Dock to the left (or drag the title bar to the left edge)' ),
			f: tf ( 'tc.dk_f', '浮動視窗（拖離側邊即可取消停靠）', 'Floating window (drag it away from the side to undock)' ),
			r: tf ( 'tc.dk_r', '停靠到右側（也可把標題列拖到畫面右邊緣）', 'Dock to the right (or drag the title bar to the right edge)' ) }[ k ];
		return '<button type="button" class="pk_tc_dkb" data-d="' + k + '" title="' + esc ( tip ) + '" aria-label="' + esc ( tip ) + '"><svg width="16" height="12" viewBox="0 0 16 12" aria-hidden="true"><rect x=".5" y=".5" width="15" height="11" rx="1.5" fill="none" stroke="currentColor"/>' + DK_SVG[ k ] + '</svg></button>';
	}

	function loadPrefs () {
		try { return JSON.parse ( w.localStorage.getItem ( LS_KEY ) || '{}' ) || {}; } catch (e) { return {}; }
	}
	function savePrefs ( p ) {
		try { w.localStorage.setItem ( LS_KEY, JSON.stringify ( p ) ); } catch (e) {}
	}

	/* 讀選取範圍（只檢查、不動任何東西）。回 { err } 或 { ws, AU, selStart, selDur, buf0 } */
	function readSelection ( app ) {
		var ws = app.engine && app.engine.wavesurfer, AU = app.engine && app.engine.FXPreviewHost, mt = app.multitrack;
		/* fatal＝連視窗都開不了（缺模組）；其他錯誤＝視窗照開，圖上顯示提示，選好範圍再讀取 */
		function bad ( m, fatal ) { return { err: m, fatal: !!fatal, ws: ws, AU: AU }; }
		if (!w.PKF0 || !w.PKSpeech || !w.PKTimePitch || !w.PKToneSystems) return bad ( tf ( 'tc.no_mod', '找不到音高／語音模組', 'Pitch / speech modules not loaded' ), true );
		if (mt && mt.IsOn && mt.IsOn ()) return bad ( tf ( 'tc.single_only', '聲調轉換目前僅支援單軌編輯', 'Tone change supports single-track editing only' ) );
		if (!ws || !ws.backend || !ws.backend.buffer || !AU) return bad ( tf ( 'uifx.load_first', '請先載入音訊', 'Load audio first' ) );
		var buf0 = ws.backend.buffer, region = ws.regions && ws.regions.list && ws.regions.list[ 0 ];
		var selStart = region ? region.start : 0, selDur = region ? region.end - region.start : buf0.duration;
		if (!( selDur > 0.05 )) return bad ( tf ( 'tp.too_short', '選取範圍太短', 'Selection too short' ) );
		if (selDur > MAX_SEC) return bad ( tf ( 'tc.too_long', '請選取 20 秒以內的範圍（一個字或一句話）', 'Select 20 seconds or less (a syllable or a phrase)' ) );
		return { ws: ws, AU: AU, selStart: selStart, selDur: selDur, buf0: buf0 };
	}
	/* 把選取範圍拷成快照；buf = 當時整份音訊的緩衝物件（之後用它判斷快照是否過期） */
	function snapshot ( app, rd ) {
		var start = app.engine.TrimTo ( rd.selStart, 3 ), dur = app.engine.TrimTo ( rd.selDur, 3 );
		var seg = rd.AU.Copy ( start, dur ), sr = seg.sampleRate, chans = [], c;
		for (c = 0; c < seg.numberOfChannels; ++c) chans.push ( seg.getChannelData ( c ) );
		return { start: start, dur: dur, seg: seg, chans: chans, sr: sr, buf: rd.buf0 };
	}

	function attach ( app ) {
		if (!app || app._tcAttached) return ;
		app._tcAttached = true;
		var style = d.createElement ( 'style' );
		style.textContent = CSS;
		d.head.appendChild ( style );

		var open = false;
		function say ( m ) { w.OneUp && w.OneUp ( m, 2000 ); }

		app.listenFor ( 'RequestActionToneChange', function () {
			if (open) { cur && cur.reselect (); return ; }        /* 已開著（停靠中）：再按一次選單＝重新讀取選取範圍 */
			var rd = readSelection ( app );
			if (rd.fatal) return say ( rd.err );        /* 缺模組才真的開不了；沒選取範圍等情況照樣開 */
			if (app.ui && app.ui.InteractionHandler && !app.ui.InteractionHandler.checkAndSet ( NAME )) return ;
			try { app.fireEvent ( 'RequestPause' ); } catch (e) {}
			var src = rd.err ? null : snapshot ( app, rd );
			cur = open = makeDialog ( app, rd.ws, rd.AU, src, function () { open = false; cur = null; }, rd.err );
		});

		/* 停靠後使用者可能同時剪輯、復原、換檔：音訊一變，快照就過期（只停用「套用」） */
		[ 'DidUpdateLen', 'StatePush', 'StateDidPop', 'StateClearAll', 'DidUnloadFile' ].forEach ( function ( ev ) {
			app.listenFor ( ev, function () { cur && cur.checkStale (); } );
		});
		/* [新增] 分辨「覆蓋載入」與「附加在後」：載入一開始 WillDownloadFile 時，引擎的 backend._add 才有值（1＝附加），
		 * 到 DidLoadFile 時已被歸零，所以要在這裡先記下來 */
		var loadAppend = false;
		app.listenFor ( 'WillDownloadFile', function () {
			var b = app.engine && app.engine.wavesurfer && app.engine.wavesurfer.backend;
			loadAppend = !!( b && b._add );
		});
		app.listenFor ( 'DidLoadFile', function () {
			var ap = loadAppend;
			loadAppend = false;
			if (!cur) return ;
			cur.checkStale ();
			cur.onLoaded ( ap );
		});
		[ 'DidCreateRegion', 'DidDestroyRegion' ].forEach ( function ( ev ) {
			app.listenFor ( ev, function () { cur && cur.checkSel (); } );
		});
		/* 標記清單停靠／關閉、視窗變動 → 重新檢查要停哪一側 */
		app.listenFor ( 'RequestResize', function () { cur && cur.relayout (); } );
		app.listenFor ( 'DidToggleMarkerPanel', function () { cur && cur.relayout (); } );
		app.listenFor ( 'DidPlay', function () { cur && cur.stopPlay (); } );
		w.addEventListener ( 'resize', function () { cur && cur.relayout (); } );
	}

	function makeDialog ( app, ws, AU, src0, onclose, emptyMsg0 ) {
		var src, sr, chans, n, mono, closed = false, i, c, emptyMsg = emptyMsg0 || '', pendSel = '';
		function setSrc ( s ) {
			src = s;
			if (!s) { sr = 44100; chans = []; n = 0; mono = null; return ; }        /* 空狀態：還沒讀取任何範圍 */
			sr = s.sr; chans = s.chans; n = chans[ 0 ].length;
			mono = new Float32Array ( n );
			for (c = 0; c < chans.length; ++c) for (i = 0; i < n; ++i) mono[ i ] += chans[ c ][ i ] / chans.length;
		}
		setSrc ( src0 );

		var prefs = loadPrefs ();
		/* [新增 v8] 還原使用者之前加入的額外聲調（每個「語言|腔調」各自記） */
		var extraPrefs = prefs.extra && typeof prefs.extra === 'object' ? prefs.extra : {};
		Object.keys ( extraPrefs ).forEach ( function ( k ) {
			var q = k.split ( '|' );
			if (q.length === 2 && TS.accent ( q[ 0 ], q[ 1 ] ) && extraPrefs[ k ] instanceof Array) TS.setAdded ( q[ 0 ], q[ 1 ], extraPrefs[ k ] );
		});
		/* [v9] 從未調整過額外聲調的腔調：套用預設列入的（詔安 → 變調中平 33）；使用者移除後存成空陣列，不再自動補回 */
		TS.LANG_ORDER.forEach ( function ( l ) {
			TS.accents ( l ).forEach ( function ( a ) {
				var k = l + '|' + a.id, df = TS.defaultExtras ( l, a.id );
				if (df.length && !Object.prototype.hasOwnProperty.call ( extraPrefs, k )) TS.setAdded ( l, a.id, df.map ( function ( x ) { return x.id; } ) );
			});
		});
		var uiLang = ''; try { uiLang = w.PKLocale.getLang (); } catch (e) {}
		var srcKind = prefs.kind === 'citation' ? 'citation' : 'natural';      /* [v9] 音檔類型：natural 自然語流（已變調）／citation 單字本調 */
		var langId = TS.LANGS[ prefs.lang ] ? prefs.lang : TS.defaultLang ( uiLang );
		var accId = TS.accent ( langId, prefs.acc ) ? prefs.acc : TS.defaultAccent ( langId, uiLang );
		var range = prefs.range >= 0.5 && prefs.range <= 1.6 ? +prefs.range : 1.0;
		var anchor = prefs.anchor === 'center' ? 'center' : 'src';
		var natural = prefs.natural >= 0 && prefs.natural <= 1 ? +prefs.natural : 0.7;   /* [新增] 自然度 */
		var tsrc = prefs.tsrc === 'std' ? 'std' : 'tpl';         /* [新增] 目標曲線來源：tpl 自然範本／std 標準調值 */
		var tplPick = {};                                        /* [新增] 手動挑的範本：'i0:i1' → 第幾個 */
		/* [階段 2] 音域基準：auto＝依選取範圍估計；saved＝沿用上次（一整句得到的音域）；male／female／child＝預設（粗略）；
		 * ref＝以某個已知聲調的字校準；manual＝手動輸入第 3 度的 Hz */
		var REG_MODES = [ 'auto', 'saved', 'male', 'female', 'child', 'ref', 'manual' ];
		var regMode = REG_MODES.indexOf ( prefs.reg ) >= 0 && prefs.reg !== 'ref' ? prefs.reg : 'auto';
		var savedReg = prefs.saved && isFinite ( prefs.saved.c ) && prefs.saved.s > 0 ? { c: +prefs.saved.c, s: +prefs.saved.s } : null;
		if (regMode === 'saved' && !savedReg) regMode = 'auto';
		var manHz = prefs.manhz >= 60 && prefs.manhz <= 600 ? +prefs.manhz : 150, refN = 0, refTone = '', scaleNow = null;
		var track = null, syls = [], sylHz = [], scale = null, plan = [], cache = null, cacheKey = '', busy = null, playSrc = null, playBtn = null;
		var selK = -1, autoSyls = null, chipT = -1, chipK = -1, chipTmr = 0, geo = null, sylJob = null, bigJob = null, sylCache = {}, sylCacheN = 0, sylTok = 0, anaTok = 0;
		var stale = false, selfEdit = false, held = true, autoLoad = false;       /* held：目前是否握有 InteractionHandler 鎖（attach 已先取得） */
		var applied = 'f', lastTop = -1, lastW = -1, dropEl = null, off = { x: 0, y: 0 }, tmr = 0, ro = null, mo = null, drawRaf = 0;

		var back = d.createElement ( 'div' );
		back.className = 'pk_tc_back';
		back.innerHTML =
			'<div class="pk_tc" role="dialog" aria-modal="true">' +
				'<div class="pk_tc_hd" data-k="hd"><div class="pk_tc_hl"><div class="pk_tc_ttl">' + esc ( tf ( 'tc.title', '聲調轉換', 'Tone change' ) ) + ' <span data-k="dur" style="font-weight:400;color:var(--tc-fg2);font-size:13px"></span></div>' +
				'<button type="button" class="pk_tc_b pk_tc_rl" data-k="reload"></button></div>' +
				'<div class="pk_tc_hr"><button class="pk_tc_b pk_tc_i" data-k="info"></button><span class="pk_tc_dks">' + dkBtn ( 'l' ) + dkBtn ( 'f' ) + dkBtn ( 'r' ) + '</span><button class="pk_tc_x" data-k="close" aria-label="Close">&#10005;</button></div></div>' +
				'<div class="pk_tc_bd">' +
				/* 整份共用：語言、腔調、基準（同一列）；音高圖；音高幅度＋字高 */
				'<div class="pk_tc_nt2" data-k="note" role="status"></div>' +
				'<div class="pk_tc_bar">' +
					'<span class="pk_tc_f"><span class="pk_tc_fl">' + esc ( tf ( 'tc.lang', '語言', 'Language' ) ) + '</span><select data-k="lang" title="' + esc ( tf ( 'tc.lang', '語言', 'Language' ) ) + '" aria-label="' + esc ( tf ( 'tc.lang', '語言', 'Language' ) ) + '"></select></span>' +
					'<span class="pk_tc_f" title="' + esc ( tf ( 'tc.kind_tip', '音檔類型。語流變調：音檔本來就是自然變調後的說話，「原聲調」填實際聽到的調值，不套用變調規則。單音本調：音檔是一個字一個字唸的本調。', 'Type of recording. Natural speech: already contains sandhi, so pick the tone you actually hear; no sandhi rules are applied. Citation: isolated words in their base tones.' ) ) + '"><span class="pk_tc_fl">' + esc ( tf ( 'tc.kind', '音檔', 'Audio' ) ) + '</span><select data-k="kind" aria-label="' + esc ( tf ( 'tc.kind', '音檔', 'Audio' ) ) + '"></select></span>' +
					'<span class="pk_tc_f" title="' + esc ( tf ( 'tc.reg_tip', '換算五度時的高低標準。只選一個字時，請改選「上次音域」或「某字校準」。', 'The pitch register used to convert Hz to Chao degrees. With a single syllable, use Last register or Calibrate.' ) ) + '"><span class="pk_tc_fl">' + esc ( tf ( 'tc.reg', '基準', 'Register' ) ) + '</span><select data-k="reg" aria-label="' + esc ( tf ( 'tc.reg', '基準', 'Register' ) ) + '"></select></span>' +
					'<span class="pk_tc_f" data-k="refwrap" style="display:none">' + esc ( tf ( 'tc.ref_pre', '第', 'Syllable' ) ) + '<select data-k="refn"></select>' + esc ( tf ( 'tc.ref_mid', '字是', 'is' ) ) + '<select data-k="reft"></select></span>' +
					'<span class="pk_tc_f" data-k="manwrap" style="display:none">' + esc ( tf ( 'tc.man_pre', '第 3 度 ≈', 'Degree 3 ≈' ) ) + '<input type="text" data-k="manhz" value="150">Hz</span>' +
					'<button type="button" class="pk_tc_b" data-k="mapbtn" aria-expanded="false" aria-haspopup="true" title="' + esc ( tf ( 'tc.map_tip', '聲調設定：這個腔調的基本聲調、變調時多出來的調型', 'Tone settings: base tones and extra contours of this variety' ) ) + '"></button>' +
				'</div>' +
				'<div class="pk_tc_cw"><canvas class="pk_tc_cv" data-k="cv"></canvas>' +
					/* [新增] 點圖上的字就出現的浮動切分工具（只顯示當下可用的項目） */
					'<div class="pk_tc_chip" data-k="chip" role="toolbar" aria-label="' + esc ( tf ( 'tc.seg', '切分', 'Segments' ) ) + '">' +
						'<button type="button" class="pk_tc_cb" data-c="split">&#9986; ' + esc ( tf ( 'tc.seg_split', '切開', 'Split' ) ) + '</button>' +
						'<button type="button" class="pk_tc_cb" data-c="mprev">&#8853; ' + esc ( tf ( 'tc.seg_mprev', '併前', 'Join prev' ) ) + '</button>' +
						'<button type="button" class="pk_tc_cb" data-c="mnext">' + esc ( tf ( 'tc.seg_mnext', '併後', 'Join next' ) ) + ' &#8853;</button>' +
						'<button type="button" class="pk_tc_cb" data-c="reset">&#8634; ' + esc ( tf ( 'tc.seg_reset', '重設', 'Reset' ) ) + '</button></div></div>' +
				'<div class="pk_tc_pn on" data-p="rows">' +
					/* 「全部改成」收進「改成」欄的表頭（不常用，不佔版面） */
					'<div class="pk_tc_tb"><table><thead><tr><th>#</th><th class="pk_tc_tm">' + esc ( tf ( 'tc.time', '時間（秒）', 'Time (s)' ) ) + '</th><th>' + esc ( tf ( 'tc.from', '原聲調', 'Detected' ) ) + '</th><th class="pk_tc_cf">' + esc ( tf ( 'tc.conf', '信心', 'Confidence' ) ) + '</th><th>' + esc ( tf ( 'tc.to', '改成', 'Change to' ) ) + '<select class="pk_tc_hs" data-k="all" title="' + esc ( tf ( 'tc.all_tip', '全部改成同一個（逐字指定，優先於對應規則）', 'Set every row to the same tone (overrides the mapping)' ) ) + '"></select></th><th>' + esc ( tf ( 'tc.listen', '試聽', 'Listen' ) ) + '</th></tr></thead><tbody data-k="rows"></tbody></table></div>' +
				'</div>' +
				'</div><div class="pk_tc_ft">' +
				'<div class="pk_tc_bar"><button class="pk_tc_b" data-k="orig"><span class="pk_tc_ic">&#9654;</span> ' + esc ( tf ( 'tc.orig', '原音', 'Original' ) ) + '</button>' +
					'<button class="pk_tc_b" data-k="prev"><span class="pk_tc_ic">&#9654;</span> ' + esc ( tf ( 'tc.preview_s', '轉換後', 'Result' ) ) + '</button>' +
					'<button type="button" class="pk_tc_b" data-k="lrn"></button>' +
					'<button type="button" class="pk_tc_b" data-k="adv" aria-expanded="false" title="' + esc ( tf ( 'tc.adv_tip', '音高幅度、字高（多數情況維持預設即可）', 'Pitch range and height (the defaults are fine for most cases)' ) ) + '"></button>' +
					'<span class="pk_tc_st" data-k="status"></span>' +
					'<button class="pk_tc_b pri" data-k="apply">' + esc ( tf ( 'tc.apply', '套用', 'Apply' ) ) + '</button></div>' +
					'<div class="pk_tc_advp" data-k="advp">' +
						'<div class="pk_tc_bar"><span class="pk_tc_f pk_tc_fr"><span>' + esc ( tf ( 'tc.range', '音高幅度', 'Pitch range' ) ) + '</span><input type="range" data-k="range" min="0.5" max="1.6" step="0.05" value="1"><span data-k="rangev">1.00</span><span>' + esc ( tf ( 'tc.oct', '八度', 'oct' ) ) + '</span></span></div>' +
						'<div class="pk_tc_bar"><span class="pk_tc_f pk_tc_fr" title="' + esc ( tf ( 'tc.nat_tip', '0＝純數學曲線（平、像機器）；越高越保留原音的自然抖動與起伏，聽起來越像真人。', '0 = pure mathematical contour (flat, robotic); higher keeps more of the natural micro-variation of the original voice.' ) ) + '"><span>' + esc ( tf ( 'tc.nat', '自然度', 'Naturalness' ) ) + '</span><input type="range" data-k="natural" min="0" max="1" step="0.05" value="0.7"><span data-k="naturalv">0.70</span></span></div>' +
						'<div class="pk_tc_bar"><span class="pk_tc_f" title="' + esc ( tf ( 'tc.tsrc_tip', '自然範本：目標聲調有「記住」的字時，用那個字的真實曲線當目標（最像真人）；沒有就用標準調值。', 'Natural template: when the target tone has remembered syllables, use a real recorded contour as the target; otherwise use the standard contour.' ) ) + '"><span>' + esc ( tf ( 'tc.tsrc', '目標曲線', 'Target contour' ) ) + '</span><select data-k="tsrc"><option value="tpl">' + esc ( tf ( 'tc.tsrc_tpl', '自然範本（用記住的字）', 'Natural template' ) ) + '</option><option value="std">' + esc ( tf ( 'tc.tsrc_std', '標準調值', 'Standard' ) ) + '</option></select></span></div>' +
						'<div class="pk_tc_bar"><span class="pk_tc_f" title="' + esc ( tf ( 'tc.anchor_tip', '依原聲調：字的高低跟著原聲調走。保持原高：只改曲線形狀，字的整體高度不變。', 'By original tone: the syllable height follows the source tone. Keep height: only the contour shape changes.' ) ) + '"><span>' + esc ( tf ( 'tc.anchor', '字高', 'Height' ) ) + '</span><select data-k="anchor">' +
							'<option value="src">' + esc ( tf ( 'tc.anchor_src', '依原聲調', 'By original tone' ) ) + '</option>' +
							'<option value="center">' + esc ( tf ( 'tc.anchor_center', '保持原高', 'Keep height' ) ) + '</option></select></span>' +
							'<button type="button" class="pk_tc_b" data-k="advrst">' + esc ( tf ( 'tc.adv_reset', '還原預設', 'Reset' ) ) + '</button></div></div>' +
				'</div>' +
				'<div class="pk_tc_mpop" data-k="mappop"><div class="pk_tc_map" data-k="mapbar"></div></div>' +
				'<div class="pk_tc_pop" data-k="pop"><div class="pk_tc_pi"><div class="pk_tc_ph"><span>' + esc ( tf ( 'tc.help', '說明', 'Help' ) ) + '</span><button class="pk_tc_x" data-k="popx" aria-label="Close">&#10005;</button></div>' +
					'<div class="pk_tc_pb"><div class="pk_tc_nfo" data-k="lrnbox"></div><div class="pk_tc_regw" data-k="regw"></div><div class="pk_tc_warn" data-k="warn"></div><div class="pk_tc_nfo" data-k="reginfo"></div><div class="pk_tc_note" data-k="sandhi"></div>' +
					'<div class="pk_tc_note">' + esc ( tf ( 'tc.keys', '空白鍵＝試聽　Ctrl/⌘＋Enter＝套用　Esc＝關閉', 'Space = preview · Ctrl/⌘+Enter = apply · Esc = close' ) ) + '</div></div></div></div>' +
				'<div class="pk_tc_sp" data-k="sp" title="' + esc ( tf ( 'tc.dk_sp', '拖曳調整寬度，雙擊還原', 'Drag to resize, double-click to reset' ) ) + '"></div>' +
			'</div>';
		d.body.appendChild ( back );
		var el = {};
		[].forEach.call ( back.querySelectorAll ( '[data-k]' ), function ( nd ) { el[ nd.getAttribute ( 'data-k' ) ] = nd; } );
		var pk = back.firstChild;
		var cv = el.cv, ctx = cv.getContext ( '2d' );
		showDur ();

		/* 語言／基準選單寬度＝目前選中文字的寬度（不留多餘空白） */
		var mctx = d.createElement ( 'canvas' ).getContext ( '2d' );
		function fitSel ( s ) {
			if (!s || !s.options || !s.options.length || !mctx) return ;
			var o = s.options[ s.selectedIndex >= 0 ? s.selectedIndex : 0 ], cs = w.getComputedStyle ( s );
			mctx.font = cs.fontStyle + ' ' + cs.fontWeight + ' ' + cs.fontSize + ' ' + cs.fontFamily;
			s.style.width = ( Math.ceil ( mctx.measureText ( o.textContent ).width ) + 28 ) + 'px';
		}

		/* ---------- 選項 ---------- */
		/* [v9] 目前音檔類型下可用的聲調：自然語流＝基本＋額外；單字本調＝只有基本 */
		function curTones () { return srcKind === 'citation' ? TS.baseTones ( langId, accId ) : TS.tones ( langId, accId ); }
		function toneLabel ( t ) { return tf ( 'tc.' + t.id, t.zh, t.en ); }
		function langName ( id ) { return tf ( 'tc.lang_' + id, TS.LANGS[ id ].zh, TS.LANGS[ id ].en ); }
		function accName ( a ) { return tf ( 'tc.acc_' + a.id, a.zh, a.en ); }
		/* [修改] chaoOnly：只顯示調值（例「21」「3 短」），不顯示聲調名稱；供「原聲調」欄使用（那裡多半是變調，名稱會混淆） */
		function optList ( tones, chaoOnly ) { return tones.map ( function ( t ) {
			if (chaoOnly) {
				var cv = t.chao + ( t.short && String ( t.chao ).length > 1 ? ' ' + tf ( 'tc.short', '短', 'short' ) : '' );
				return '<option value="' + t.id + '" data-f="' + esc ( cv ) + '" data-s="' + esc ( cv ) + '">' + esc ( cv ) + '</option>';
			}
			var full = toneLabel ( t ) + ( t.chao && t.zh.indexOf ( t.chao ) < 0 ? ' (' + t.chao + ( t.short && String ( t.chao ).length > 1 ? ' ' + tf ( 'tc.short', '短', 'short' ) : '' ) + ')' : '' );
			/* [修改] data-f＝完整文字、data-s＝只有調值數字（窄版用，見 applyNar） */
			return '<option value="' + t.id + '" data-f="' + esc ( full ) + '" data-s="' + esc ( t.chao || full ) + '">' + esc ( full ) + '</option>';
		} ).join ( '' ); }
		/* withKeep：加「不變」；withGeneric：附上「通用調值」；withCustom：加「自訂」 */
		function toneOpts ( withKeep, withGeneric, withCustom, chaoOnly ) {
			var h = withKeep ? '<option value="">' + esc ( tf ( 'tc.keep', '不變', 'Keep' ) ) + '</option>' : '';
			h += optList ( curTones (), chaoOnly );
			if (withGeneric) h += '<optgroup label="' + esc ( tf ( 'tc.generic', '通用調值', 'Generic contours' ) ) + '">' + optList ( TS.GENERIC.filter ( function ( g ) { return !addedHas ( g.id ); } ) ) + '</optgroup>';
			if (withCustom) h += '<option value="custom">' + esc ( tf ( 'tc.custom', '自訂…', 'Custom…' ) ) + '</option>';
			return h;
		}
		/* 語言＋腔調合成一個平面選單（客語・四縣、客語・海陸…）；只有一個腔調的語言（華語）只顯示語言名 */
		el.lang.innerHTML = TS.LANG_ORDER.map ( function ( id ) {
			var list = TS.accents ( id );
			return list.map ( function ( a ) {
				return '<option value="' + id + '|' + a.id + '">' + esc ( list.length > 1 ? accName ( a ) : langName ( id ) ) + '</option>';
			} ).join ( '' );
		} ).join ( '' );
		function fillAccents () {
			el.lang.value = langId + '|' + accId;
			fitSel ( el.lang );
			fillKind ();
		}
		/* [v9] 音檔類型選單與說明文字（說明視窗裡那行） */
		function fillKind () {
			el.kind.innerHTML = '<option value="natural" data-f="' + esc ( tf ( 'tc.kind_nat', '語流變調', 'Natural speech (with sandhi)' ) ) + '" data-s="' + esc ( tf ( 'tc.kind_nat_s', '變調', 'Sandhi' ) ) + '">' + esc ( tf ( 'tc.kind_nat', '語流變調', 'Natural speech (with sandhi)' ) ) + '</option>' +
				'<option value="citation" data-f="' + esc ( tf ( 'tc.kind_cit', '單音本調', 'Citation tones' ) ) + '" data-s="' + esc ( tf ( 'tc.kind_cit_s', '本調', 'Citation' ) ) + '">' + esc ( tf ( 'tc.kind_cit', '單音本調', 'Citation tones' ) ) + '</option>';
			if (nar) [].forEach.call ( el.kind.options, function ( o ) { o.textContent = o.getAttribute ( 'data-s' ); } );
			el.kind.value = srcKind;
			fitSel ( el.kind );
			el.sandhi.textContent = srcKind === 'citation'
				? tf ( 'tc.kind_cit_note', '單音本調：只比對基本聲調。變調規則之後才提供，目前不會自動變調。', 'Citation tones: only base tones are matched. Sandhi rules are not available yet, so nothing is changed automatically.' )
				: tf ( 'tc.kind_nat_note', '語流變調：音檔已是自然變調後的說話，請依實際聽到的調值選「原聲調」，不套用變調規則。', 'Natural speech: the recording already contains sandhi. Pick the tone you actually hear; no sandhi rules are applied.' );
		}
		fillAccents ();
		el.range.value = range; el.rangev.textContent = range.toFixed ( 2 );
		el.natural.value = natural; el.naturalv.textContent = natural.toFixed ( 2 ); el.tsrc.value = tsrc;
		el.anchor.value = anchor;
		syncAdv ();

		function buildAll () {
			/* 「全部改成」：— ＝不動作；「全部依對應」＝清掉所有逐字指定；其餘＝每一列都指定成該聲調 */
			el.all.innerHTML = '<option value="-" hidden>' + esc ( tf ( 'tc.all', '全部', 'All' ) ) + '</option><option disabled>' + esc ( tf ( 'tc.all_hd', '— 全部改成 —', '— Set all to —' ) ) + '</option><option value="@">' + esc ( AUTO_MAP ? tf ( 'tc.all_map', '依對應（清除逐字指定）', 'By mapping (clear row choices)' ) : tf ( 'tc.keep', '不變', 'Keep' ) ) + '</option>' + toneOpts ( AUTO_MAP, true, true );
			applyNar ();
			/* [修改 v8] 聲調設定：該語言預設（基本）聲調＋使用者加入的額外聲調；每個都標出調值與目前偵測到的字數 */
			var srcTones = TS.tones ( langId, accId ).filter ( function ( t ) { return t.src !== false; } );
			var baseT = srcTones.filter ( function ( t ) { return !t.extra; } ), extraT = srcTones.filter ( function ( t ) { return t.extra; } );
			function chip ( t ) {
				return '<label data-ml="' + t.id + '">' +
					'<span class="pk_tc_lh"><span class="pk_tc_ln">' + esc ( toneName0 ( t ) ) + '</span><span class="pk_tc_ch">' + esc ( chaoTxt ( t ) ) + '</span>' +
					( AUTO_MAP ? '<span class="pk_tc_ar" aria-hidden="true">→</span>' : '' ) + '</span>' +
					( AUTO_MAP ? '<select data-m="' + t.id + '">' + toneOpts ( true, true, false ) + '</select>' : '' ) +
					( t.extra ? '<button type="button" class="pk_tc_xr" data-xr="' + t.id + '" title="' + esc ( tf ( 'tc.rm_tone', '移除這個聲調', 'Remove this tone' ) ) + '" aria-label="' + esc ( tf ( 'tc.rm_tone', '移除這個聲調', 'Remove this tone' ) ) + '">&#10005;</button>' : '' ) + '</label>';
			}
			var h = '<div class="pk_tc_mh"><span class="pk_tc_mt">' + esc ( tf ( 'tc.map_title', '聲調設定', 'Tone settings' ) ) + '</span>' +
				( AUTO_MAP ? '<button type="button" class="pk_tc_b" data-k="clr" title="' + esc ( tf ( 'tc.clear_tip', '清除對應規則（表格裡逐字指定的不受影響）', 'Clear the mapping (per-row choices are kept)' ) ) + '">' + esc ( tf ( 'tc.clear', '清除對應', 'Clear mapping' ) ) + '</button>' : '' ) + '</div>';
			/* ① 基本聲調：該腔調的本調與調值 */
			h += '<div class="pk_tc_sh">' + esc ( tf ( 'tc.sec_base', '基本聲調（本調）', 'Base tones' ) ) + '</div><div class="pk_tc_mg">' + baseT.map ( chip ).join ( '' ) + '</div>';
			/* ② 變調時多出來的調型（如詔安的中平 33）：呈現出來，可增減 */
			h += '<div class="pk_tc_sh"><span>' + esc ( tf ( 'tc.sec_extra', '變調時多出來的調型', 'Extra contours from sandhi' ) ) + '</span>' +
				'<button type="button" class="pk_tc_b' + ( addOpen ? ' on' : '' ) + '" data-k="addb" aria-expanded="' + ( addOpen ? 'true' : 'false' ) + '" title="' + esc ( tf ( 'tc.add_tip', '加入這個語言還可能用到的調型（例如詔安客語的中平 33），或自訂調值', 'Add other contours this language may use (e.g. mid level 33 in Zhaoan), or a custom contour' ) ) + '">+ ' + esc ( tf ( 'tc.add_tone', '增加調型', 'Add contour' ) ) + '</button></div>';
			if (addOpen) h += addPanelHtml ();
			h += extraT.length ? '<div class="pk_tc_mg">' + extraT.map ( chip ).join ( '' ) + '</div>'
				: '<div class="pk_tc_hint">' + esc ( tf ( 'tc.extra_none', '（這個腔調目前沒有加入任何變調調型）', '(No extra contours added for this variety)' ) ) + '</div>';
			/* ③ 變調規則：預留（規則不是單純一對一，之後另外處理） */
			h += '<div class="pk_tc_sh">' + esc ( tf ( 'tc.sec_rule', '變調規則', 'Sandhi rules' ) ) + '</div>' +
				'<div class="pk_tc_hint">' + esc ( tf ( 'tc.rule_soon', '尚未提供。規則會依前後字與語境決定，不是單純一對一，之後另外設計；只會用在「單音本調」的音檔上，語流變調的音檔不會套用。', 'Not available yet. Rules depend on neighbouring syllables and context, so they are not simple one-to-one maps; they will only apply to citation-tone recordings, never to natural speech.' ) ) + '</div>';
			el.mapbar.innerHTML = h;
			el.clr = el.mapbar.querySelector ( '[data-k=clr]' );
			el.addb = el.mapbar.querySelector ( '[data-k=addb]' );
			if (el.clr) el.clr.onclick = function () {
				[].forEach.call ( el.mapbar.querySelectorAll ( 'select[data-m]' ), function ( s ) { s.value = ''; } );
				updateCounts (); draw ();
			};
			el.addb.onclick = function () { var mp = snapMap (); addOpen = !addOpen; buildAll (); restoreMap ( mp ); updateCounts (); };
			if (addOpen) {
				var ds = el.mapbar.querySelector ( '[data-k=addsel]' ), dc = el.mapbar.querySelector ( '[data-k=addc]' ), dg = el.mapbar.querySelector ( '[data-k=addgo]' );
				ds.onchange = function () { dc.style.display = ds.value === 'custom' ? '' : 'none'; if (ds.value === 'custom') dc.focus (); };
				dc.onkeydown = function ( e ) { if (e.key === 'Enter') { e.preventDefault (); dg.click (); } };
				dg.onclick = function () {
					var v = ds.value, c;
					if (v === 'custom') {
						c = String ( dc.value ).replace ( /[^1-5]/g, '' );
						if (!c || c.length > 4) return status ( tf ( 'tc.add_bad', '請輸入 1~5 的五度標記，例如 35、214', 'Enter Chao digits 1–5, e.g. 35 or 214' ) );
						v = 'x' + c;
					}
					var t = TS.setAdded ( langId, accId, TS.added ( langId, accId ).map ( function ( x ) { return x.id; } ).concat ( [ v ] ) );
					if (!t.some ( function ( x ) { return x.id === v; } )) return status ( tf ( 'tc.add_dup', '這個調值已經在清單裡了', 'This contour is already in the list' ) );
					addOpen = false; status ( '' );
					extrasChanged ();
				};
			}
		}

		/* [新增 v8] 額外聲調 ---------------------------------------------------- */
		var addOpen = false;
		function addedHas ( id ) { return TS.added ( langId, accId ).some ( function ( t ) { return t.id === id; } ); }
		/* 目前這個腔調有沒有這個聲調（或是自訂五度字串） */
		function toneKnown ( id ) { return /^[1-5]+$/.test ( id ) || curTones ().some ( function ( t ) { return t.id === id; } ); }
		/* 聲調設定裡的名稱：拿掉括號裡的調值（調值另外顯示）；自訂調值只叫「自訂」 */
		function toneName0 ( t ) {
			if (/^x[1-5]+$/.test ( t.id )) return tf ( 'tc.custom_s', '自訂', 'Custom' );
			return toneLabel ( t ).replace ( /\s*[（(]\s*[1-5]+[^）)]*[）)]\s*$/, '' );
		}
		function chaoTxt ( t ) { return t.chao + ( t.short && String ( t.chao ).length > 1 ? ' ' + tf ( 'tc.short', '短', 'short' ) : '' ); }
		/* 「＋ 增加聲調」面板：該腔調常見的額外聲調、通用調值、自訂；已經有的調值不再列出 */
		function addPanelHtml () {
			var have = {};
			TS.tones ( langId, accId ).forEach ( function ( t ) { have[ t.chao + ( t.short ? 's' : '' ) ] = 1; } );
			function ok ( t ) { return !have[ t.chao + ( t.short ? 's' : '' ) ]; }
			var spec = TS.extras ( langId, accId ).filter ( ok ), gen = TS.GENERIC.filter ( ok ), o = '';
			if (spec.length) o += '<optgroup label="' + esc ( tf ( 'tc.add_grp_lang', '這個腔調常見的', 'Common in this variety' ) ) + '">' + optList ( spec ) + '</optgroup>';
			if (gen.length) o += '<optgroup label="' + esc ( tf ( 'tc.generic', '通用調值', 'Generic contours' ) ) + '">' + optList ( gen ) + '</optgroup>';
			o += '<option value="custom">' + esc ( tf ( 'tc.add_custom', '自訂調值…', 'Custom contour…' ) ) + '</option>';
			return '<div class="pk_tc_addp"><select data-k="addsel" aria-label="' + esc ( tf ( 'tc.add_tone', '增加聲調', 'Add tone' ) ) + '">' + o + '</select>' +
				'<input type="text" data-k="addc" placeholder="35" maxlength="4" inputmode="numeric" style="display:none" aria-label="' + esc ( tf ( 'tc.add_custom', '自訂調值…', 'Custom contour…' ) ) + '">' +
				'<button type="button" class="pk_tc_b pri" data-k="addgo">' + esc ( tf ( 'tc.add_go', '加入', 'Add' ) ) + '</button></div>';
		}
		/* 重建選單前先記下使用者已設的對應規則與逐字選擇，重建後還原（選項已不存在的就退回預設） */
		function snapMap () {
			var m = {};
			[].forEach.call ( el.mapbar.querySelectorAll ( 'select[data-m]' ), function ( x ) { m[ x.getAttribute ( 'data-m' ) ] = x.value; } );
			return m;
		}
		function restoreMap ( m ) {
			[].forEach.call ( el.mapbar.querySelectorAll ( 'select[data-m]' ), function ( x ) {
				var v = m[ x.getAttribute ( 'data-m' ) ];
				x.value = v == null ? '' : v;
				if (x.selectedIndex < 0) x.value = '';
			});
		}
		function snapRows () {
			return plan.map ( function ( p, k ) {
				var fs = rowSel ( 'from', k ), fc = rowSel ( 'fromc', k ), ts = rowSel ( 'to', k ), tc = rowSel ( 'toc', k );
				return fs && ts ? { f: fs.value, fc: fc ? fc.value : '', t: ts.value, tc: tc ? tc.value : '' } : null;
			});
		}
		function restoreRows ( rows ) {
			if (!rows || rows.length !== plan.length) return ;
			plan.forEach ( function ( p, k ) {
				var r = rows[ k ]; if (!r) return ;
				var fs = rowSel ( 'from', k ), fc = rowSel ( 'fromc', k ), ts = rowSel ( 'to', k ), tc = rowSel ( 'toc', k );
				if (p.manual) { fs.value = r.f; if (fs.selectedIndex < 0) { fs.value = p.from; p.manual = false; } }
				if (fc) fc.value = r.fc;
				ts.value = r.t; if (ts.selectedIndex < 0) ts.value = '@';
				if (tc) tc.value = r.tc;
			});
		}
		/* 加入／移除額外聲調之後：記住、清快取，重新偵測（候選多了或少了一個調值；手動改過的原聲調保留），
		 * 重建各處選單，並還原使用者之前設好的對應與逐字選擇 */
		function extrasChanged () {
			extraPrefs[ langId + '|' + accId ] = TS.added ( langId, accId ).map ( function ( t ) { return t.id; } );
			remember ();
			var mp = snapMap (), rows = snapRows ();
			plan.forEach ( function ( p, k ) { var fs = rowSel ( 'from', k ); if (p.manual && fs && fs.value !== 'custom') p.from = fs.value; } );   /* 手動列的原聲調以畫面上的為準 */
			cache = null; cacheKey = ''; sylCache = {}; sylCacheN = 0;
			if (track) detectAll ();
			buildAll (); fillReg (); buildRows ();
			restoreMap ( mp ); restoreRows ( rows );
			if (track) syncRows (); else updateCounts ();
			draw ();
		}
		function removeExtra ( id ) {
			TS.setAdded ( langId, accId, TS.added ( langId, accId ).map ( function ( t ) { return t.id; } ).filter ( function ( x ) { return x !== id; } ) );
			extrasChanged ();
		}

		/* 「原聲調 → 改成」：收成一個按鈕，點開才顯示設定（有設規則時按鈕變色並顯示數量） */
		function syncMapBtn ( n ) {
			el.mapbtn.innerHTML = esc ( tf ( 'tc.map_btn', '聲調', 'Tones' ) ) + ( n ? '<span class="pk_tc_bdg">' + n + '</span>' : '' ) + ' <span aria-hidden="true">&#9662;</span>';
			el.mapbtn.className = 'pk_tc_b' + ( n || el.mappop.style.display === 'block' ? ' on' : '' );
		}
		function mapShow ( on ) {
			if (on) {
				advShow ( false );
				var pr = pk.getBoundingClientRect (), br = el.mapbtn.getBoundingClientRect ();
				el.mappop.style.top = Math.round ( br.bottom - pr.top + 4 ) + 'px';
			}
			el.mappop.style.display = on ? 'block' : 'none';
			el.mapbtn.setAttribute ( 'aria-expanded', on ? 'true' : 'false' );
			var n = 0; [].forEach.call ( el.mapbar.querySelectorAll ( 'select[data-m]' ), function ( s ) { if (s.value) ++n; } );
			syncMapBtn ( n );
		}
		el.mapbtn.onclick = function () { mapShow ( el.mappop.style.display !== 'block' ); };

		/* 說明鈕：有警告時變橘色並加 ⚠；點擊開啟說明視窗 */
		function refreshInfo () {
			var has = !!( el.regw.textContent || el.warn.textContent );
			el.info.className = 'pk_tc_b pk_tc_i' + ( has ? ' w' : '' );
			el.info.textContent = has ? '⚠' : 'ⓘ';
			el.info.setAttribute ( 'aria-label', tf ( 'tc.help', '說明', 'Help' ) );
			el.info.title = tf ( 'tc.help', '說明', 'Help' );
		}
		function popShow ( on ) { el.pop.style.display = on ? 'flex' : 'none'; }
		el.info.onclick = function () { popShow ( el.pop.style.display !== 'flex' ); };
		el.popx.onclick = function () { popShow ( false ); };
		el.pop.addEventListener ( 'mousedown', function ( e ) { if (e.target === el.pop) popShow ( false ); } );
		refreshInfo ();
		function status ( s ) { el.status.textContent = s || ''; }
		/* 播放中的按鈕：反白（強調色底）＋ ▶ 變 ■，再按一次＝停止；放完自動還原 */
		function markBtn ( b, on ) {
			if (!b) return ;
			b.classList.toggle ( 'pk_tc_pl', !!on );
			var ic = b.querySelector ( '.pk_tc_ic' );
			if (ic) ic.textContent = on ? '\u25A0' : '\u25B6';
		}
		function pend ( b ) { stopPlay (); playBtn = b || null; markBtn ( playBtn, true ); }
		function stopSrc () { if (playSrc) { playSrc.onended = null; try { playSrc.stop (); } catch (e) {} try { playSrc.disconnect (); } catch (e2) {} playSrc = null; } }
		function stopPlay () { stopSrc (); if (playBtn) { markBtn ( playBtn, false ); playBtn = null; } }

		function regOpt ( v, label, off ) { return '<option value="' + v + '"' + ( off ? ' disabled' : '' ) + '>' + esc ( label ) + '</option>'; }
		function fillReg () {
			el.reg.innerHTML =
				regOpt ( 'auto', tf ( 'tc.reg_auto', '自動', 'Auto' ) ) +
				regOpt ( 'saved', savedReg ? tf ( 'tc.reg_saved', '上次音域', 'Last register (saved from a phrase)' ) : tf ( 'tc.reg_saved_none', '上次音域（無）', 'Last register (none yet: analyse a phrase first)' ), !savedReg ) +
				regOpt ( 'ref', tf ( 'tc.reg_ref', '某字校準', 'Calibrate from one syllable' ), !syls.length ) +
				regOpt ( 'manual', tf ( 'tc.reg_manual', '手動', 'Manual' ) ) +
				regOpt ( 'male', tf ( 'tc.reg_male', '男聲', 'Male (rough)' ) ) +
				regOpt ( 'female', tf ( 'tc.reg_female', '女聲', 'Female (rough)' ) ) +
				regOpt ( 'child', tf ( 'tc.reg_child', '兒童', 'Child (rough)' ) );
			el.reg.value = regMode;
			fitSel ( el.reg );
			showRegWraps ();
		}
		function showRegWraps () { el.refwrap.style.display = regMode === 'ref' ? '' : 'none'; el.manwrap.style.display = regMode === 'manual' ? '' : 'none'; }
		function fillRef () {
			var h = '', k;
			for (k = 0; k < syls.length; ++k) h += '<option value="' + k + '">' + ( k + 1 ) + '</option>';
			el.refn.innerHTML = h; if (refN >= syls.length) refN = 0; el.refn.value = refN;
			var tl = TS.tones ( langId, accId ).filter ( function ( t ) { return t.src !== false; } );
			el.reft.innerHTML = optList ( tl, true );
			if (!tl.some ( function ( t ) { return t.id === refTone; } )) refTone = tl.length ? tl[ 0 ].id : '';
			el.reft.value = refTone;
		}

		/* 依音域基準模式偵測全部音節（保留使用者手動改過的列） */
		function detectAll () {
			var cands = TS.candidates ( langId, accId, { baseOnly: srcKind === 'citation' } ), o = {}, durs = syls.map ( function ( s ) { return s.b - s.a; } ), old = plan;
			if (regMode === 'saved' && savedReg) o.scale = { center: savedReg.c, step: savedReg.s, spread: null, reliable: true, source: 'saved' };
			else if (regMode === 'male' || regMode === 'female' || regMode === 'child') o.scale = presetScale ( regMode );
			else if (regMode === 'manual') o.scale = fixedScale ( manHz, 3, 'manual' );
			else if (regMode === 'ref' && sylHz[ refN ]) { var cal = calibrate ( sylHz[ refN ], refTone, 3 ); if (cal) o.scale = cal; }
			if (Learn.enabled ()) o.learn = Learn.templates ( langId, accId );
			var det = detectTones ( sylHz, durs, cands, o );
			scaleNow = det.scale; scale = det.scale;
			plan = det.items.map ( function ( r, k ) {
				var p = { from: r.id, to: null, conf: r.conf, level: r.level, alts: r.alts, margin: r.margin, learned: !!r.learned };
				if (old[ k ] && old[ k ].manual && old.length === det.items.length && toneKnown ( old[ k ].from )) { p.from = old[ k ].from; p.manual = true; }
				return p;
			});
			/* 一整句（可信的自動音域）→ 記下，之後只選一個字時可以「沿用上次音域」 */
			if (regMode === 'auto' && scaleNow.reliable && syls.length >= 3) { savedReg = { c: scaleNow.center, s: scaleNow.step }; remember (); }
		}

		/* ---------- 分析（開啟時、重新讀取選取範圍時各跑一次） ---------- */
		function analyse () {
			var tok = ++anaTok;
			status ( tf ( 'ph.analysing', '分析中', 'Analysing' ) + ' …' );
			var ab = null;
			try { ab = new w.AudioBuffer ({ numberOfChannels: 1, length: n, sampleRate: sr }); } catch (e) {}
			if (!ab) { try { ab = ws.backend.ac.createBuffer ( 1, n, sr ); } catch (e2) {} }
			ab.copyToChannel ( mono, 0 );
			var eDb = null, regsAll = [];
			w.PKF0.trackBuffer ( ab ).then ( function ( tr ) {
				if (closed || tok !== anaTok) return tr;
				/* [新增] 有能量卻沒抓到音高的區段 → 用較寬鬆的有聲門檻補抓（沒有這種區段就不多跑一次） */
				eDb = frameDb ( mono, sr, tr.n, tr.rate );
				var regs = regsAll = rescueRegions ( tr, eDb );
				if (!regs.length) return tr;
				return w.PKF0.trackBuffer ( ab, { voicing: 0.65 } ).then ( function ( tr2 ) {
					return closed || tok !== anaTok ? tr : mergeRescue ( tr, tr2, regs );
				}, function () { return tr; } );
			} ).then ( function ( tr ) {
				if (closed || tok !== anaTok) return ;
				track = tr;
				var raw = w.PKSpeech.syllables ( eDb ? bridgeGaps ( tr, eDb, regsAll ) : tr, { channels: [ mono ], sr: sr } ) || [];
				syls = raw.filter ( function ( s ) {
					var v = 0; for (var k = s.i0; k < s.i1 && k < tr.n; ++k) if (tr.f0[ k ] > 0) ++v;
					return v >= MIN_VOICED;        /* 太短的有聲段（共鳴尾音、雜訊）不當成一個字 */
				});
				autoSyls = syls.map ( function ( s ) { return { i0: s.i0, i1: s.i1, a: s.a, b: s.b }; });        /* [新增] 記下自動切分，給「自動切分」還原用 */
				hideChip ();
				sylHz = syls.map ( function ( s ) {
					var hz = []; for (var k = s.i0; k < s.i1 && k < tr.n; ++k) if (tr.f0[ k ] > 0) hz.push ( tr.f0[ k ] );
					return hz;
				});
				detectAll ();
				buildAll ();
				fillReg ();
				buildRows ();
				status ( syls.length ? '' : tf ( 'tc.none', '找不到有聲音節', 'No voiced syllables found' ) );
				draw ();
			}, function ( err ) { if (!closed && tok === anaTok) status ( String ( err && err.message || err ) ); } );
		}

		function buildRows () {
			var h = '';
			syls.forEach ( function ( s, k ) {
				h += '<tr><td>' + ( k + 1 ) + '</td><td class="pk_tc_tm">' + s.a.toFixed ( 2 ) + ' – ' + s.b.toFixed ( 2 ) + '</td>' +
					'<td><div class="pk_tc_cell"><select data-r="from" data-i="' + k + '">' + toneOpts ( false, false, true, true ) + '</select><input type="text" data-r="fromc" data-i="' + k + '" placeholder="51" style="display:none"></div></td>' +
					'<td class="pk_tc_cf" data-r="conf" data-i="' + k + '"></td>' +
					/* 「改成」：第一個選項「依對應」＝照頁籤二的規則（預設）；選別的＝只改這一列，優先於規則 */
					'<td class="pk_tc_tc"><div class="pk_tc_cell"><select data-r="to" data-i="' + k + '"><option value="@">' + esc ( AUTO_MAP ? tf ( 'tc.by_map', '依對應', 'By mapping' ) : tf ( 'tc.keep', '不變', 'Keep' ) ) + '</option>' + toneOpts ( AUTO_MAP, true, true ) + '</select><input type="text" data-r="toc" data-i="' + k + '" placeholder="51" style="display:none">' +
						'' +
						'<button type="button" class="pk_tc_p pk_tc_rst" data-r="rst" data-i="' + k + '" style="display:none" title="' + esc ( tf ( 'tc.restore', '還原為依對應', 'Restore: follow the mapping' ) ) + '">&#8634;</button><button type=\"button\" class=\"pk_tc_p pk_tc_tp\" data-r=\"tpl\" data-i=\"' + k + '\" style=\"display:none\"></button></div></td>' +
					'<td><button class="pk_tc_p" data-r="po" data-i="' + k + '" title="' + esc ( tf ( 'tc.orig', '原音', 'Original' ) ) + '"><span class="pk_tc_ic">&#9654;</span> ' + esc ( tf ( 'tc.orig_s', '原', 'O' ) ) + '</button>' +
					'<button class="pk_tc_p" data-r="pc" data-i="' + k + '" title="' + esc ( tf ( 'tc.preview', '試聽轉換後', 'Preview result' ) ) + '"><span class="pk_tc_ic">&#9654;</span> ' + esc ( tf ( 'tc.conv_s', '後', 'R' ) ) + '</button></td></tr>';
			});
			el.rows.innerHTML = h;
			[].forEach.call ( el.rows.querySelectorAll ( 'select[data-r=from]' ), function ( sel ) { sel.value = plan[ +sel.getAttribute ( 'data-i' ) ].from; } );
			fillRef (); syncRows ();
			applyNar ();
		}
		function rowSel ( kind, k ) { return el.rows.querySelector ( '[data-r=' + kind + '][data-i="' + k + '"]' ); }
		/* 頁籤二對某個原聲調設的目標（沒設回 null） */
		function mapTo ( fromId ) {
			var m = el.mapbar && el.mapbar.querySelector ( 'select[data-m="' + fromId + '"]' );
			return m && m.value ? m.value : null;
		}
		/* 疊加：逐字指定（「改成」不是「依對應」）優先；「依對應」才查頁籤二。原聲調是自訂五度的列，對應規則不適用 */
		function readPlan () {
			var out = [];
			plan.forEach ( function ( p, k ) {
				var fs = rowSel ( 'from', k ), fc = rowSel ( 'fromc', k ), ts = rowSel ( 'to', k ), tc = rowSel ( 'toc', k );
				fc.style.display = fs.value === 'custom' ? '' : 'none'; tc.style.display = ts.value === 'custom' ? '' : 'none';
				var from = fs.value === 'custom' ? ( parseChao ( fc.value ) ? fc.value.replace ( /[^1-5]/g, '' ) : 't1' ) : fs.value, to;
				if (ts.value === '@') to = fs.value === 'custom' || !AUTO_MAP ? null : mapTo ( fs.value );
				else if (ts.value === 'custom') to = parseChao ( tc.value ) ? tc.value.replace ( /[^1-5]/g, '' ) : null;
				else to = ts.value || null;
				if (to && sameTone ( to, from )) to = null;
				out.push ({ from: from, to: to });
			});
			return out;
		}
		/* [階段 3] 各聲調的音節數、要改幾個字；列的底色（信心）與選取框 */
		function fromIds () { return plan.map ( function ( p, k ) { var fs = rowSel ( 'from', k ); return fs && fs.value !== 'custom' ? fs.value : null; } ); }
		var chgFlags = [], nChg = 0;
		/* 沒有任何字要改、或正在轉換時，「試聽轉換後」「套用」不可按；快照過期時只停用「套用」 */
		function syncBtns () {
			el.orig.disabled = !src;
			el.prev.disabled = !!busy || !( nChg > 0 );
			el.apply.disabled = !!busy || !( nChg > 0 ) || stale;
			el.prev.title = nChg > 0 ? '' : tf ( 'tc.nochange_tip', '請先在「改成」選要改的聲調', 'Choose a target tone under "Change to" first' );
			el.apply.title = stale ? tf ( 'tc.stale', '音訊已被編輯，請重新讀取', 'Audio was edited. Reload.' ) : el.prev.title;
		}
		function toneShort ( id ) { var t = TS.find ( id ); return t ? toneLabel ( t ) : id; }
		/* [新增] 窄版（面板寬 < 580）：表格內的選單選項只顯示調值數字；變寬再還原完整文字 */
		var nar = false;
		function applyNar () {
			if (el.kind && el.kind.options.length) {
				[].forEach.call ( el.kind.options, function ( o ) { var t = o.getAttribute ( nar ? 'data-s' : 'data-f' ); if (t !== null && o.textContent !== t) o.textContent = t; } );
				fitSel ( el.kind );
			}
			[].forEach.call ( pk.querySelectorAll ( 'td option[data-s], th option[data-s]' ), function ( o ) {
				var t = o.getAttribute ( nar ? 'data-s' : 'data-f' );
				if (t !== null && o.textContent !== t) o.textContent = t;
			});
			/* 底部按鈕：窄版用字精簡（▶ 原／▶ 後、⚙），完整名稱放 aria-label */
			var fo = tf ( 'tc.orig', '原音', 'Original' ), fp = tf ( 'tc.preview_s', '轉換後', 'Result' );
			el.orig.innerHTML = '<span class="pk_tc_ic">&#9654;</span> ' + esc ( nar ? tf ( 'tc.orig_s', '原', 'O' ) : fo );
			el.prev.innerHTML = '<span class="pk_tc_ic">&#9654;</span> ' + esc ( nar ? tf ( 'tc.after_s', '後', 'R' ) : fp );
			if (playBtn === el.orig || playBtn === el.prev) markBtn ( playBtn, true );        /* 重畫文字時保留播放中的樣式 */
			el.orig.setAttribute ( 'aria-label', fo ); el.prev.setAttribute ( 'aria-label', fp );
			syncAdv ();
			updateAuto ();
		}
		/* 每列「依對應」：結果直接寫在第一個選項上（依對應 → 去聲／依對應：不變）；逐字指定的列顯示 ↺ */
		function updateAuto () {
			var pls = el.rows.children.length ? readPlan () : null;
			plan.forEach ( function ( p, k ) {
				var ts = rowSel ( 'to', k ), fs = rowSel ( 'from', k ), rs = rowSel ( 'rst', k );
				if (!ts || !fs || !rs) return ;
				rs.style.display = ts.value !== '@' ? '' : 'none';
				var mt = fs.value !== 'custom' ? mapTo ( fs.value ) : null;
				if (mt && sameTone ( mt, fs.value )) mt = null;
				var tt = mt && TS.find ( mt );
				if (AUTO_MAP) ts.options[ 0 ].textContent = nar
					? tf ( 'tc.by_map_s', '對應', 'Map' ) + ( mt ? '→' + ( tt ? tt.chao : mt ) : '：' + tf ( 'tc.keep', '不變', 'Keep' ) )
					: tf ( 'tc.by_map', '依對應', 'By mapping' ) + ( mt ? ' → ' + toneShort ( mt ) : '：' + tf ( 'tc.keep', '不變', 'Keep' ) );
				/* [新增] ◈ 範本鈕：有目標、模式是自然範本、而且這個聲調有記住的字才顯示 */
				var tb = rowSel ( 'tpl', k ), tp = pls && pls[ k ], lst = tb && tsrc === 'tpl' && tp && tp.to ? Learn.tplOf ( langId, accId, tp.to ) : [], sy = syls[ k ];
				if (tb) {
					tb.style.display = lst.length ? '' : 'none';
					if (lst.length && sy) {
						var pk2 = tplPick[ sy.i0 + ':' + sy.i1 ];
						tb.textContent = '\u25C8 ' + ( pk2 != null ? ( pk2 % lst.length + 1 ) + '/' + lst.length : tf ( 'tc.tpl_auto', '範本', 'Tpl' ) );
						tb.title = tf ( 'tc.tpl_tip', '用你記住的字當範本（共 ' + lst.length + ' 個）。點一下換下一個並試聽，最後回到自動。', 'Using a remembered syllable as the template (' + lst.length + '). Click for the next one; the last click returns to auto.' );
					}
				}
			});
		}
		function updateCounts () {
			if (!el.mapbar) return ;
			var cn = countByTone ( fromIds () ), mr = 0;
			[].forEach.call ( el.mapbar.querySelectorAll ( 'label[data-ml]' ), function ( lb ) {
				var c = cn[ lb.getAttribute ( 'data-ml' ) ] || 0, lh = lb.querySelector ( '.pk_tc_lh' );
				lb.classList.toggle ( 'z', !c ); lh && lh.classList.toggle ( 'z', !c );
			});
			[].forEach.call ( el.mapbar.querySelectorAll ( 'select[data-m]' ), function ( s ) { if (s.value) ++mr; } );
			syncMapBtn ( mr );
			if (track && plan.length) {
				var pl = readPlan (), m = 0; pl.forEach ( function ( x ) { if (x.to) ++m; } );
				nChg = m; chgFlags = pl.map ( function ( x ) { return !!x.to; } );
				updateAuto ();
				[].forEach.call ( el.rows.children, function ( tr, k ) { tr.className = rowCls ( k ); } );
			}
			else { nChg = 0; chgFlags = []; }
			syncBtns ();
		}
		function rowCls ( k ) {
			var p = plan[ k ], c = [], ts = rowSel ( 'to', k );
			if (p && !p.manual) { if (p.level === 'low') c.push ( 'pk_tc_lo' ); else if (p.level === 'mid') c.push ( 'pk_tc_md' ); }
			if (chgFlags[ k ]) c.push ( 'pk_tc_ch' );
			if (ts && ts.value !== '@') c.push ( 'pk_tc_ov' );          /* 逐字指定（蓋過對應規則） */
			if (k === selK) c.push ( 'pk_tc_sel' );
			return c.join ( ' ' );
		}
		function selectRow ( k ) {
			var old = selK; selK = k;
			[ old, k ].forEach ( function ( q ) { var c = q >= 0 && rowSel ( 'conf', q ); if (c) c.parentNode.className = rowCls ( q ); } );
			var cur2 = k >= 0 && rowSel ( 'conf', k ); if (cur2 && cur2.parentNode.scrollIntoView) { try { cur2.parentNode.scrollIntoView ({ block: 'nearest' }); } catch (e) {} }
			draw ();
		}
		/* ---------- 信心欄與音域說明 ---------- */
		var SRC_NAMES = { auto: [ '自動（依選取範圍）', 'auto, from selection' ], 'auto+': [ '自動，依聲調回頭修正', 'auto, refined by assigned tones' ], saved: [ '沿用上次', 'last register' ], preset: [ '預設（粗略）', 'preset (rough)' ], manual: [ '手動', 'manual' ], ref: [ '以某字校準', 'calibrated' ] };
		function toneName ( id ) { var t = TS.find ( id ); return t ? toneLabel ( t ) + ' ' + t.chao : id; }
		function confHtml ( p ) {
			var kk = plan.indexOf ( p );
			if (p.manual) return '<span class="pk_tc_c0"' + ( p.remembered ? ' title="' + esc ( tf ( 'tc.lrn_saved', '已記住這個字的聲調', 'Remembered' ) ) + '"' : '' ) + '>' + esc ( tf ( 'tc.manual', '手動', 'Manual' ) ) + ( p.remembered ? ' ★' : '' ) + '</span>';
			var tip = '', pc = Math.round ( p.conf * 100 ), mark = p.level === 'high' ? '✓' : p.level === 'mid' ? '?' : '??';
			if (p.level !== 'high') {
				if (p.alts && p.alts.length) tip = tf ( 'tc.alts', '也可能是：', 'Could also be: ' ) + p.alts.map ( function ( id ) { var t = TS.find ( id ); return t ? t.chao + ( t.short && String ( t.chao ).length > 1 ? ' ' + tf ( 'tc.short', '短', 'short' ) : '' ) : id; } ).join ( '、' );
				if (scaleNow && !scaleNow.reliable) tip += ( tip ? '\n' : '' ) + tf ( 'tc.tip_noreg', '音域資料不足，高低相近的聲調（如 55／33／11）無法分辨', 'Not enough pitch-range information: level tones (55/33/11) cannot be told apart' );
				if (!tip) tip = tf ( 'tc.tip_poor', '曲線與任何聲調都不太像', 'The contour does not match any tone well' );
			}
			if (p.learned) tip += ( tip ? '\n' : '' ) + tf ( 'tc.lrn_used', '★ 參考了你標過的字', '★ Uses syllables you labelled' );
			return '<span class="pk_tc_c_' + p.level + '"' + ( tip ? ' title="' + esc ( tip ) + '"' : '' ) + '>' + mark + ' ' + pc + '%' + ( p.learned ? ' ★' : '' ) + '</span>' +
				( kk >= 0 ? ' <button type="button" class="pk_tc_p" data-r="ok" data-i="' + kk + '" title="' + esc ( tf ( 'tc.lrn_ok', '確認正確，並記住這個字', 'Confirm as correct and remember' ) ) + '" aria-label="' + esc ( tf ( 'tc.lrn_ok', '確認正確，並記住這個字', 'Confirm as correct and remember' ) ) + '">&#10003;</button>' : '' );
		}
		function hzOfDeg ( deg ) { return Math.pow ( 2, ( scaleNow.center + ( deg - 3 ) * scaleNow.step ) / 12 ); }
		function updateReg () {
			if (!scaleNow) return ;
			var nm = SRC_NAMES[ scaleNow.source ] || [ scaleNow.source, scaleNow.source ], en = uiLang === 'en';
			el.reginfo.textContent = tf ( 'tc.reg', '基準', 'Register' ) + '：1 ≈ ' + Math.round ( hzOfDeg ( 1 ) ) + ' ・ 3 ≈ ' + Math.round ( hzOfDeg ( 3 ) ) + ' ・ 5 ≈ ' + Math.round ( hzOfDeg ( 5 ) ) + ' Hz';
			el.reginfo.title = tf ( 'tc.deg', '度', 'deg' ) + '：' + ( en ? nm[ 1 ] : nm[ 0 ] );
			var low = plan.filter ( function ( p ) { return !p.manual && p.level !== 'high'; } ).length, msg = [];
			if (!scaleNow.reliable) msg.push ( tf ( 'tc.w_noreg', '⚠ 音域資料不足：請在「基準」改選「上次音域」、「某字校準」或「手動」。', '⚠ Not enough pitch range: set Register to Last register, Calibrate or Manual.' ) );
			if (low) msg.push ( low + ' ' + tf ( 'tc.w_low', '個字信心偏低，請確認「原聲調」。', 'low-confidence syllable(s): check the original tone.' ) );
			el.regw.textContent = msg.join ( ' ' );
			refreshInfo ();
		}
		/* 偵測結果更新到列表（手動改過的列不動）。「改成」是「依對應」的列會自動跟著新的原聲調走；逐字指定的列保持不變 */
		function syncRows () {
			plan.forEach ( function ( p, k ) {
				var fs = rowSel ( 'from', k ), cell = rowSel ( 'conf', k );
				if (!fs || !cell) return ;
				if (!p.manual && fs.value !== p.from) fs.value = p.from;
				cell.innerHTML = confHtml ( p );
				cell.parentNode.className = rowCls ( k );
			});
			updateCounts ();
			updateReg ();
		}
		function redetect () { if (!track) return ; detectAll (); syncRows (); draw (); }

		/* ---------- [新增] 手動切分（浮動工具）與音高設定面板 ---------- */
		var MIN_HALF = 3;        /* 切開後每一半至少要有幾個有聲幀 */
		function voicedIn ( a, b ) { var q, c = 0; for (q = a; q < b && q < track.n; ++q) if (track.f0[ q ] > 0) ++c; return c; }
		function frameEnergy ( i ) {
			var c = Math.round ( i / track.rate * sr ), h = Math.max ( 8, Math.round ( sr / track.rate ) ), a = Math.max ( 0, c - h ), b = Math.min ( n, c + h ), e = 0, j;
			for (j = a; j < b; ++j) e += mono[ j ] * mono[ j ];
			return e / Math.max ( 1, b - a );
		}
		function mkSyl ( a, b ) { return { i0: a, i1: b, a: ( a - 0.5 ) / track.rate, b: ( b - 0.5 ) / track.rate }; }
		/* 時間 t → 離最近的字（距離在 maxd 秒內），沒有回 -1 */
		function nearSyl ( t, maxd ) {
			var best = -1, bd = maxd, k, dd;
			for (k = 0; k < syls.length; ++k) {
				dd = t < syls[ k ].a ? syls[ k ].a - t : t > syls[ k ].b ? t - syls[ k ].b : 0;
				if (dd < bd || dd === 0) { bd = dd; best = k; if (dd === 0) break; }
			}
			return best;
		}
		/* 時間 t → 切點的幀號（落在某個字裡面，貼齊 ±30 ms 內能量最低的幀；兩邊都要有足夠有聲幀）。不能切回 -1 */
		function splitPoint ( t ) {
			if (!track) return -1;
			var i = Math.round ( t * track.rate ), k = -1, q;
			for (q = 0; q < syls.length; ++q) if (i > syls[ q ].i0 && i < syls[ q ].i1) { k = q; break; }
			if (k < 0) return -1;
			var s = syls[ k ], rad = Math.max ( 1, Math.round ( 0.03 * track.rate ) ), best = -1, be = 1e30, j, en;
			for (j = Math.max ( s.i0 + 1, i - rad ); j <= Math.min ( s.i1 - 1, i + rad ); ++j) {
				if (voicedIn ( s.i0, j ) < MIN_HALF || voicedIn ( j, s.i1 ) < MIN_HALF) continue;
				en = frameEnergy ( j );
				if (en < be) { be = en; best = j; }
			}
			return best;
		}
		function segDirty () {
			if (!autoSyls || autoSyls.length !== syls.length) return !!autoSyls;
			for (var k = 0; k < syls.length; ++k) if (autoSyls[ k ].i0 !== syls[ k ].i0 || autoSyls[ k ].i1 !== syls[ k ].i1) return true;
			return false;
		}
		/* 換成新的切分：沒動到的字（i0、i1 都相同）保留原聲調手動修改與「改成」；動到的字重新偵測 */
		function applySeg ( out, msg ) {
			var keep = {};
			hideChip ();
			plan.forEach ( function ( p, q ) {
				var s = syls[ q ], fs = rowSel ( 'from', q ), fc = rowSel ( 'fromc', q ), ts = rowSel ( 'to', q ), tc = rowSel ( 'toc', q );
				if (s && fs && ts) keep[ s.i0 + ':' + s.i1 ] = { manual: !!p.manual, from: fs.value, fromc: fc ? fc.value : '', to: ts.value, toc: tc ? tc.value : '' };
			});
			stopPlay ();
			syls = out;
			sylHz = syls.map ( function ( s ) {
				var hz = [], q; for (q = s.i0; q < s.i1 && q < track.n; ++q) if (track.f0[ q ] > 0) hz.push ( track.f0[ q ] );
				return hz;
			});
			cache = null; cacheKey = ''; sylCache = {}; sylCacheN = 0; selK = -1;
			plan = [];
			detectAll ();
			plan.forEach ( function ( p, q ) {
				var kp = keep[ syls[ q ].i0 + ':' + syls[ q ].i1 ];
				if (kp && kp.manual) { p.from = kp.from; p.manual = true; }
			});
			buildRows ();
			plan.forEach ( function ( p, q ) {
				var kp = keep[ syls[ q ].i0 + ':' + syls[ q ].i1 ], ts = rowSel ( 'to', q ), tc = rowSel ( 'toc', q ), fc = rowSel ( 'fromc', q );
				if (!kp) return ;
				if (kp.from === 'custom' && fc) fc.value = kp.fromc;
				if (kp.to !== '@' && ts) { ts.value = kp.to; if (tc) tc.value = kp.toc; }
			});
			updateCounts (); draw ();
			status ( msg ? msg + '（' + tf ( 'tc.seg_now', '現在共', 'now' ) + ' ' + syls.length + ' ' + tf ( 'tc.chars', '字', 'syllables' ) + '）' : '' );
		}
		function splitAt ( t ) {
			var i = splitPoint ( t ), out = [], k;
			if (i < 0) return status ( tf ( 'tc.seg_bad', '這裡切不開：請點在某個字的範圍內，且兩邊都要有足夠的有聲段', 'Cannot split here: click inside a syllable, with enough voiced sound on both sides' ) );
			for (k = 0; k < syls.length; ++k) {
				if (i > syls[ k ].i0 && i < syls[ k ].i1) out.push ( mkSyl ( syls[ k ].i0, i ), mkSyl ( i, syls[ k ].i1 ) );
				else out.push ( syls[ k ] );
			}
			applySeg ( out, tf ( 'tc.seg_done_split', '已切開', 'Split' ) );
		}
		/* 把第 g 與第 g+1 個字併成一個 */
		function mergePair ( g ) {
			var out = [], k;
			if (g < 0 || g + 1 >= syls.length) return ;
			for (k = 0; k < syls.length; ++k) {
				if (k === g) { out.push ( mkSyl ( syls[ k ].i0, syls[ k + 1 ].i1 ) ); ++k; }
				else out.push ( syls[ k ] );
			}
			applySeg ( out, tf ( 'tc.seg_done_merge', '已合併', 'Merged' ) );
		}
		function resetSeg () {
			if (!track || !autoSyls) return ;
			applySeg ( autoSyls.map ( function ( s ) { return { i0: s.i0, i1: s.i1, a: s.a, b: s.b }; }), tf ( 'tc.seg_done_reset', '已重設', 'Reset to automatic' ) );
		}

		/* 浮動工具：點圖上的字（或右鍵）出現在點擊位置附近，做完一次就收起，圖的點擊仍是試聽 */
		function hideChip () {
			if (chipTmr) { w.clearTimeout ( chipTmr ); chipTmr = 0; }
			if (chipT >= 0) { chipT = -1; chipK = -1; el.chip.style.display = 'none'; soonDraw (); }
		}
		function showChip ( t, k, x, y ) {
			if (!track) return ;
			var b = {}, any = false;
			[].forEach.call ( el.chip.querySelectorAll ( '[data-c]' ), function ( bt ) { b[ bt.getAttribute ( 'data-c' ) ] = bt; } );
			var show = { split: splitPoint ( t ) >= 0, mprev: k > 0, mnext: k >= 0 && k < syls.length - 1, reset: segDirty () };
			Object.keys ( b ).forEach ( function ( c ) { b[ c ].style.display = show[ c ] ? '' : 'none'; if (show[ c ]) any = true; });
			if (!any) return hideChip ();
			chipT = t; chipK = k;
			el.chip.style.display = 'flex';
			
			if (chipTmr) w.clearTimeout ( chipTmr );
			chipTmr = w.setTimeout ( hideChip, 7000 );
			soonDraw ();
		}
		el.chip.addEventListener ( 'mouseenter', function () { if (chipTmr) { w.clearTimeout ( chipTmr ); chipTmr = 0; } });
		el.chip.addEventListener ( 'mouseleave', function () { if (chipT >= 0 && !chipTmr) chipTmr = w.setTimeout ( hideChip, 2500 ); });
		el.chip.addEventListener ( 'click', function ( e ) {
			var bt = e.target && e.target.closest && e.target.closest ( '[data-c]' );
			if (!bt) return ;
			var c = bt.getAttribute ( 'data-c' ), t = chipT, k = chipK;
			hideChip ();
			if (c === 'split') splitAt ( t );
			else if (c === 'mprev') mergePair ( k - 1 );
			else if (c === 'mnext') mergePair ( k );
			else if (c === 'reset') resetSeg ();
		});

		/* 頁尾「音高設定」：音高幅度、字高放進彈出面板；不是預設值時按鈕反白並顯示目前設定 */
		function advShow ( on ) {
			if (on && el.mappop.style.display === 'block') mapShow ( false );
			el.advp.style.display = on ? 'block' : 'none';
			el.adv.setAttribute ( 'aria-expanded', on ? 'true' : 'false' );
			syncAdv ();
		}
		function syncAdv () {
			var chg = Math.abs ( range - 1 ) > 1e-6 || anchor !== 'src' || Math.abs ( natural - 0.7 ) > 1e-6 || tsrc !== 'tpl', open = el.advp.style.display === 'block';
			var advTxt = tf ( 'tc.adv', '音高', 'Pitch' );
			el.adv.textContent = '⚙' + ( chg ? ' ' + range.toFixed ( 2 ) + ( anchor === 'center' && !nar ? ' ' + tf ( 'tc.anchor_center', '保持原高', 'Keep height' ) : '' ) : ( nar ? '' : ' ' + advTxt ) );
			el.adv.setAttribute ( 'aria-label', advTxt );
			el.adv.className = 'pk_tc_b' + ( chg || open ? ' on' : '' );
		}
		el.adv.onclick = function () { advShow ( el.advp.style.display !== 'block' ); };
		el.advrst.onclick = function () { el.range.value = 1; el.anchor.value = 'src'; el.natural.value = 0.7; el.tsrc.value = 'tpl'; el.range.oninput (); el.natural.oninput (); el.tsrc.onchange (); el.anchor.onchange (); };
		back.addEventListener ( 'mousedown', function ( e ) {
			if (chipT >= 0 && !el.chip.contains ( e.target ) && e.target !== cv) hideChip ();
			if (el.advp.style.display === 'block' && !el.advp.contains ( e.target ) && !el.adv.contains ( e.target )) advShow ( false );
			if (el.mappop.style.display === 'block' && !el.mappop.contains ( e.target ) && !el.mapbtn.contains ( e.target )) mapShow ( false );
		});

		/* only = 音節索引：只改那一個字（逐字試聽用）；省略 = 全部 */
		/* [新增] 第 k 個字、目標聲調 toId 的範本：手動挑的優先；否則取音長最接近的前 3 名，依字序輪流 */
		function pickTpl ( k, toId ) {
			var s = syls[ k ], lst = s ? Learn.tplOf ( langId, accId, toId ) : [];
			if (!lst.length) return null;
			var pk = tplPick[ s.i0 + ':' + s.i1 ];
			if (pk != null) return lst[ pk % lst.length ];
			var dur = s.b - s.a, sorted = lst.slice ().sort ( function ( a, b ) { return Math.abs ( ( a.d || dur ) - dur ) - Math.abs ( ( b.d || dur ) - dur ); } );
			return sorted[ k % Math.min ( 3, sorted.length ) ];
		}
		function cycleTpl ( k ) {
			var p = readPlan ()[ k ], s = syls[ k ];
			if (!p || !p.to || !s || tsrc !== 'tpl') return ;
			var lst = Learn.tplOf ( langId, accId, p.to ), key = s.i0 + ':' + s.i1, cur = tplPick[ key ];
			if (!lst.length) return ;
			if (cur == null) cur = 0; else if (cur + 1 >= lst.length) cur = null; else ++cur;
			if (cur == null) delete tplPick[ key ]; else tplPick[ key ] = cur;
			updateAuto (); draw (); playSyl ( k, false );
		}
		function target ( only ) {
			var pl = readPlan ();
			if (only != null) pl = pl.map ( function ( x, i ) { return i === only ? x : { from: x.from, to: null }; } );
			if (tsrc === 'tpl') pl = pl.map ( function ( x, i ) { var t = x.to ? pickTpl ( i, x.to ) : null; return t ? { from: x.from, to: x.to, tpl: t } : x; } );
			return buildTarget ( track, syls, pl, { range: range, anchor: anchor, natural: natural } );
		}

		/* ---------- 繪製（顏色從主題變數讀，換主題會重畫） ---------- */
		function pal () {
			var cs = null; try { cs = w.getComputedStyle ( back ); } catch (e) {}
			function g ( nm, fb ) { var v = cs && cs.getPropertyValue ( nm ); v = v && v.trim (); return v || fb; }
			return { bg: g ( '--tc-bg1', '#fff' ), line: g ( '--tc-fg2', '#999' ), txt: g ( '--tc-fg1', '#555' ), tgt: g ( '--tc-rec', '#d93025' ), ac: g ( '--tc-ac', '#1a73e8' ) };
		}
		function draw () {
			if (closed) return ;
			updateWarn ();
			var P = pal (), r = Math.min ( w.devicePixelRatio || 1, 2 ), W = cv.clientWidth, H = cv.clientHeight;
			if (cv.width !== Math.round ( W * r ) || cv.height !== Math.round ( H * r )) { cv.width = Math.round ( W * r ); cv.height = Math.round ( H * r ); }
			ctx.setTransform ( r, 0, 0, r, 0, 0 );
			ctx.globalAlpha = 1; ctx.fillStyle = P.bg; ctx.fillRect ( 0, 0, W, H );
			if (!track) { if (!src) drawHint ( P, W, H ); return ; }
			var L = 32, R = W - 10, T = 10, B = H - 20, tg = el.rows.children.length ? target () : null, lo = 1e9, hi = 0, k;
			for (k = 0; k < track.n; ++k) {
				var a = track.f0[ k ], b = tg ? tg.f0[ k ] : 0;
				if (a > 0) { lo = Math.min ( lo, a ); hi = Math.max ( hi, a ); }
				if (b > 0) { lo = Math.min ( lo, b ); hi = Math.max ( hi, b ); }
			}
			if (!( hi > lo )) return ;
			lo /= 1.1; hi *= 1.1;
			geo = { L: L, R: R };
			var yOf = function ( hz ) { return B - Math.log ( hz / lo ) / Math.log ( hi / lo ) * ( B - T ); };
			var xOf = function ( i ) { return L + ( i / track.rate ) / src.dur * ( R - L ); };
						ctx.font = '10px system-ui,sans-serif'; ctx.fillStyle = P.txt; ctx.textAlign = 'center'; ctx.textBaseline = 'top'; ctx.globalAlpha = 0.75;
			var ts = src.dur > 5 ? 1 : src.dur > 2 ? 0.5 : 0.2;
			for (var t = 0; t <= src.dur + 1e-9; t += ts) { var x = L + t / src.dur * ( R - L ); ctx.fillText ( t.toFixed ( ts < 1 ? 1 : 0 ), x, B + 4 ); }
			ctx.textAlign = 'right'; ctx.textBaseline = 'middle';
			var lastY = -99;
			[ 500, 400, 300, 250, 200, 150, 120, 100, 80 ].forEach ( function ( h ) {
				var yy = yOf ( h );
				if (h > lo * 1.05 && h < hi / 1.05 && yy > T + 12 && Math.abs ( yy - lastY ) >= 12) { ctx.fillText ( h, L - 4, yy ); lastY = yy; }
			});
			ctx.globalAlpha = 1;
			syls.forEach ( function ( s, j ) {
				ctx.globalAlpha = chgFlags[ j ] ? 0.16 : j % 2 ? 0.07 : 0.14;
				ctx.fillStyle = chgFlags[ j ] ? P.tgt : P.ac;
				ctx.fillRect ( xOf ( s.i0 ), T, xOf ( s.i1 ) - xOf ( s.i0 ), B - T );
				ctx.globalAlpha = 1;
				ctx.fillStyle = chgFlags[ j ] ? P.tgt : P.ac; ctx.font = '10px system-ui,sans-serif'; ctx.textAlign = 'center'; ctx.textBaseline = 'top';
				ctx.fillText ( String ( j + 1 ), ( xOf ( s.i0 ) + xOf ( s.i1 ) ) / 2, T + 2 );
			});
			ctx.font = '12px system-ui,sans-serif';
			if (selK >= 0 && syls[ selK ]) {
				ctx.strokeStyle = P.ac; ctx.lineWidth = 2; ctx.strokeRect ( xOf ( syls[ selK ].i0 ) + 0.5, T + 1, xOf ( syls[ selK ].i1 ) - xOf ( syls[ selK ].i0 ), B - T - 2 );
			}
			function line ( arr, col, lw ) {
				ctx.strokeStyle = col; ctx.lineWidth = lw; ctx.lineJoin = 'round'; ctx.beginPath ();
				var pen = false;
				for (var q = 0; q < track.n; ++q) {
					if (!( arr[ q ] > 0 )) { pen = false; continue; }
					if (pen) ctx.lineTo ( xOf ( q ), yOf ( arr[ q ] ) ); else { ctx.moveTo ( xOf ( q ), yOf ( arr[ q ] ) ); pen = true; }
				}
				ctx.stroke ();
			}
			line ( track.f0, P.line, 2.5 );
			if (tg && tg.changed) line ( tg.f0, P.tgt, 3 );
			/* [新增] 浮動工具開著時，畫出「切開」實際會切的位置 */
			if (chipT >= 0) {
				var gi = splitPoint ( chipT );
				if (gi >= 0) {
					var gx = xOf ( gi );
					ctx.save (); ctx.strokeStyle = P.tgt; ctx.lineWidth = 1.5; ctx.setLineDash ([ 4, 3 ]);
					ctx.beginPath (); ctx.moveTo ( gx, T ); ctx.lineTo ( gx, B ); ctx.stroke (); ctx.restore ();
				}
			}
			ctx.font = '9px system-ui,sans-serif'; ctx.globalAlpha = 0.7; ctx.fillStyle = P.txt; ctx.textAlign = 'left'; ctx.textBaseline = 'top'; ctx.fillText ( 'Hz', 4, T ); ctx.globalAlpha = 1;
		}
		/* 空狀態：圖上用文字說明下一步（過長的字串逐字折行） */
		function wrapLines ( txt, maxW ) {
			var out = [], line = '', k, t;
			for (k = 0; k < txt.length; ++k) {
				t = line + txt.charAt ( k );
				if (line && ctx.measureText ( t ).width > maxW) { out.push ( line ); line = txt.charAt ( k ); } else line = t;
			}
			if (line) out.push ( line );
			return out;
		}
		function drawHint ( P, W, H ) {
			var l1 = emptyMsg || tf ( 'tc.empty', '請在主畫面選取一個字或一句話', 'Select a syllable or phrase in the main view' );
			var l2 = applied === 'f' ? tf ( 'tc.empty_f', '點右上角的停靠鈕，就能邊選取邊使用', 'Dock this panel (top right) to select while it stays open' ) : tf ( 'tc.empty_d', '選好後會自動讀取，也可按 ↻', 'It loads automatically, or press ↻' );
			ctx.font = '13px system-ui,sans-serif'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
			var lines = wrapLines ( l1, W - 24 ).map ( function ( s ) { return [ s, P.txt ]; } ).concat ( wrapLines ( l2, W - 24 ).map ( function ( s ) { return [ s, P.line ]; } ) );
			var lh = 20, y = H / 2 - ( lines.length - 1 ) * lh / 2;
			lines.forEach ( function ( l, k ) { ctx.fillStyle = l[ 1 ]; ctx.fillText ( l[ 0 ], W / 2, y + k * lh ); });
		}
		function soonDraw () { if (drawRaf || closed) return ; drawRaf = w.requestAnimationFrame ( function () { drawRaf = 0; draw (); } ); }
		/* 目標含入聲（短調）：音長不會跟著改 */
		function updateWarn () {
			var short = false;
			[].forEach.call ( el.rows.querySelectorAll ( 'select[data-r=to]' ), function ( s ) { if (TS.isShort ( s.value )) short = true; } );
			/* 「依對應」的列，目標來自頁籤二 */
			[].forEach.call ( el.mapbar.querySelectorAll ( 'select[data-m]' ), function ( s ) { if (s.value && TS.isShort ( s.value )) short = true; } );
			var msg = short ? tf ( 'tc.warn_short', '⚠ 目標含入聲：音長不變，可能不自然。', '⚠ Short-tone target: duration is unchanged.' ) : '';
			/* [階段 4] 一個字平均降（或升）接近一個八度時，重合成後的音高可能被聽成原來的高度（八度混淆）：提醒並建議縮小「音高幅度」 */
			var big = 0;
			try { readPlan ().forEach ( function ( p ) { if (p.to) { var a = chaoOf ( p.from ), b = chaoOf ( p.to ); if (a && b) big = Math.max ( big, Math.abs ( chaoMean ( b ) - chaoMean ( a ) ) * range * 3 ); } } ); } catch (e) {}
			if (big >= 10) msg += ( msg ? ' ' : '' ) + tf ( 'tc.warn_big', '⚠ 有字音高改變約 ' + Math.round ( big ) + ' 半音，可能聽成原高度：請試聽，或調小「音高幅度」。', '⚠ A syllable shifts ~' + Math.round ( big ) + ' semitones; it may sound at the original height. Listen, or reduce Pitch range.' );
			el.warn.textContent = msg;
			refreshInfo ();
		}

		/* ---------- 合成／試聽／套用 ---------- */
		var fmtMs = function ( ms ) { return ms < 1000 ? Math.round ( ms ) + ' ms' : ( ms / 1000 ).toFixed ( 1 ) + ' s'; };
		/* 整段：只重新合成「有被改動」的那一段（第一個到最後一個被改的字，前後加緩衝），其餘取樣原封不動 */
		function compute () {
			return new Promise ( function ( resolve, reject ) {
				var tg = target ();
				if (!tg.changed) return reject ( new Error ( tf ( 'tc.nochange', '沒有要改的音節', 'Nothing to change' ) ) );
				var key = tg.f0.length + ':' + hashF0 ( tg.f0, 0, tg.f0.length );
				if (cache && cacheKey === key) return resolve ( cache );
				var cr = changedRange ( track, syls, tg.f0 );
				if (!cr) return reject ( new Error ( tf ( 'tc.nochange', '沒有要改的音節', 'Nothing to change' ) ) );
				var sp = spanOf ( syls, cr[ 0 ], cr[ 1 ], sr, n ), t0 = Date.now ();
				status ( tf ( 'tc.working', '轉換中', 'Converting' ) + ' 0%' );
				var r = renderSpan ( chans, sr, track, tg.f0, sp[ 0 ], sp[ 1 ], smartRun, function ( p ) { status ( tf ( 'tc.working', '轉換中', 'Converting' ) + ' ' + Math.round ( p * 100 ) + '%' ); } );
				bigJob = r.job;
				r.promise.then ( function ( seg ) {
					bigJob = null;
					if (closed) return reject ( new Error ( 'closed' ) );
					var out = spliceSpan ( chans, seg, sr );
					cache = out; cacheKey = key; status ( tf ( 'tc.took', '耗時', 'Took' ) + ' ' + fmtMs ( Date.now () - t0 ) );
					resolve ( out );
				}, function ( e ) { bigJob = null; reject ( e ); } );
			});
		}
		/* 逐字：只合成第 k 個字（含前後 30 ms）。回 Promise<Float32Array[] | null>（null = 這個字沒設要改）；同一個字、同樣設定有快取 */
		function sylConverted ( k ) {
			var tg = target ( k );
			if (!tg.changed) return Promise.resolve ( null );
			var rg = sylRange ( k ), key = k + ':' + rg[ 0 ] + ':' + hashF0 ( tg.f0, syls[ k ].i0, syls[ k ].i1 );
			if (sylCache[ key ]) return Promise.resolve ( sylCache[ key ] );
			sylJob && sylJob.cancel ();
			var r = renderSpan ( chans, sr, track, tg.f0, rg[ 0 ], rg[ 1 ], smartRun );
			sylJob = r.job;
			return r.promise.then ( function ( seg ) {
				sylJob = null;
				if (sylCacheN >= 24) { sylCache = {}; sylCacheN = 0; }
				sylCache[ key ] = seg.outs; ++sylCacheN;
				return seg.outs;
			});
		}
		/* 播放第 k 個字：orig = true 播原音；否則有設「改成」播轉換後，沒設就播原音 */
		function playSyl ( k, orig ) {
			if (!track || !syls[ k ]) return ;
			selectRow ( k );
			var rg = sylRange ( k ), tok = ++sylTok;
			var pb = el.rows.querySelector ( 'button[data-r="' + ( orig ? 'po' : 'pc' ) + '"][data-i="' + k + '"]' );
			if (orig) { pend ( pb ); return playBuf ( toBuffer ( chans, rg[ 0 ], rg[ 1 ] ) ); }
			if (busy) return status ( tf ( 'tc.busy', '處理中，請稍候', 'Busy, please wait' ) );
			pend ( pb );
			var t0 = Date.now ();
			sylConverted ( k ).then ( function ( outs ) {
				if (closed || tok !== sylTok) return ;
				if (!outs) { status ( '' ); return playBuf ( toBuffer ( chans, rg[ 0 ], rg[ 1 ] ) ); }
				status ( tf ( 'tc.took', '耗時', 'Took' ) + ' ' + fmtMs ( Date.now () - t0 ) );
				playBuf ( toBuffer ( outs, 0, outs[ 0 ].length ) );
			}, function ( e ) { if (!closed && tok === sylTok) { stopPlay (); status ( String ( e && e.message || e ) ); } } );
		}
		function toBuffer ( arrs, a, b ) {
			a = a || 0; b = b == null ? arrs[ 0 ].length : b;
			var nb = ws.backend.ac.createBuffer ( arrs.length, Math.max ( 1, b - a ), sr );
			for (var q = 0; q < arrs.length; ++q) nb.getChannelData ( q ).set ( arrs[ q ].subarray ( a, b ) );
			return nb;
		}
		function playBuf ( b ) {
			stopSrc ();
			var ac = ws.backend.ac;
			try { ac.state === 'suspended' && ac.resume (); } catch (e) {}
			var ps = playSrc = ac.createBufferSource (); ps.buffer = b; ps.connect ( ac.destination ); ps.start ();
			ps.onended = function () { if (playSrc === ps) stopPlay (); };
		}
		function sylRange ( k ) {
			var pad = 0.03, a = Math.max ( 0, Math.round ( ( syls[ k ].a - pad ) * sr ) ), b = Math.min ( n, Math.round ( ( syls[ k ].b + pad ) * sr ) );
			return [ a, b ];
		}
		function guard ( fn ) {
			if (busy || !track) return ;
			busy = true; syncBtns ();
			fn ().then ( function () {}, function ( e ) { status ( String ( e && e.message || e ) ); } ).then ( function () { busy = null; syncBtns (); } );
		}

		/* ---------- [階段 3] 快照是否過期、選取範圍是否改了 ---------- */
		function isStale () { var b = ws && ws.backend && ws.backend.buffer; return !!src && ( !b || b !== src.buf ); }
		function hasRegion ( w2 ) { w2 = w2 || ws; return !!( w2 && w2.regions && w2.regions.list && w2.regions.list[ 0 ] ); }
		function selDiffers () {
			if (!src || !ws) return false;
			var rg = ws.regions && ws.regions.list && ws.regions.list[ 0 ], b = ws.backend && ws.backend.buffer;
			var s = rg ? rg.start : 0, du = rg ? rg.end - rg.start : ( b ? b.duration : 0 );
			return Math.abs ( s - src.start ) > 0.002 || Math.abs ( du - src.dur ) > 0.002;
		}
		function showDur () { el.dur.textContent = ''; }        /* 標題後不顯示秒數 */
		/* 標題旁的重讀鈕：還沒讀過、音訊過期、選取範圍改了 → 變主色提醒 */
		function syncReload () {
			var hot = !src || stale || selDiffers ();
			el.reload.className = 'pk_tc_b pk_tc_rl' + ( hot ? ' hot' : '' );
			el.reload.innerHTML = '&#8635;<span> ' + esc ( src ? tf ( 'tc.reload', '重新讀取', 'Reload' ) : tf ( 'tc.read', '讀取選取範圍', 'Read selection' ) ) + '</span>';
			el.reload.title = tf ( 'tc.reload_tip', '用主畫面目前的選取範圍重新分析', 'Re-analyse the current selection of the main view' );
		}
		function updateNote () {
			if (closed) return ;
			var msg = '', cls = '';
			if (!src) {}                                                /* 空狀態：提示畫在圖上 */
			else if (stale) { msg = tf ( 'tc.stale', '音訊已被編輯，請重新讀取', 'Audio was edited. Reload.' ); cls = ' st'; }
			else if (selDiffers ()) { msg = tf ( 'tc.sel_changed', '選取範圍已改變，請重新讀取', 'Selection changed. Reload.' ); cls = ' sl'; }
			el.note.className = 'pk_tc_nt2' + ( msg ? ' on' + cls : '' );
			el.note.textContent = msg;
			syncReload ();
		}
		function checkStale () {
			if (closed || selfEdit) return ;
			var s = isStale ();
			if (s !== stale) { stale = s; syncBtns (); }
			updateNote ();
		}
		function checkSel () { if (!closed && !selfEdit) updateNote (); }
		/* 載入新的快照並重新分析（語言／腔調／音高幅度／音域基準維持；對應規則與逐字指定會清掉，因為音節已經不同了） */
		function loadSrc ( s ) {
			stopPlay (); sylJob && sylJob.cancel (); bigJob && bigJob.cancel (); sylJob = bigJob = null; ++sylTok;
			setSrc ( s );
			track = null; syls = []; sylHz = []; plan = []; scale = scaleNow = null; cache = null; cacheKey = ''; autoSyls = null; hideChip ();
			sylCache = {}; sylCacheN = 0; selK = -1; geo = null; chgFlags = []; nChg = 0; stale = false;
			showDur ();
			el.rows.innerHTML = '';
			el.mapbar.innerHTML = '';
			updateCounts (); updateNote (); draw ();
			analyse ();
		}
		/* [修改] 停靠中自動讀取：
		 *   ① 空狀態，或使用者重新選了一個和快照不同的範圍（要有選取區；穩定一個計時週期後才讀，避免拖曳途中亂讀）；
		 *   ② 新載入「覆蓋」音檔後（autoLoad）：立即讀取，範圍超過 20 秒就維持手動。
		 *   「附加在後」不會設 autoLoad，所以仍需手動按「重新讀取」。
		 *   音訊過期（stale）時，只要使用者有重新拉出選取區也會讀（整份沒選取區的情況不自動讀，附加後就是這種）。 */
		function tryAutoLoad () {
			if (!autoLoad || closed) return ;
			if (applied === 'f') { autoLoad = false; return ; }
			if (busy) return ;                       /* 正在運算／試聽：等下一次輪詢再試 */
			autoLoad = false;
			if (!readSelection ( app ).err) reload ();
		}
		function pollSel () {
			if (closed || selfEdit || applied === 'f') return ;
			if (autoLoad) { tryAutoLoad (); return ; }
			if (busy) return ;
			var rd = readSelection ( app ), key = '';
			if (!rd.err && hasRegion ( rd.ws ) && ( !src || selDiffers () )) key = rd.selStart.toFixed ( 3 ) + ':' + rd.selDur.toFixed ( 3 );
			if (key && key === pendSel) { pendSel = ''; reload (); }
			else pendSel = key;
		}
		/* [新增] 新音檔載入完成（DidLoadFile）：覆蓋載入 → 自動讀取；附加在後 → 不動 */
		function onLoaded ( isAppend ) {
			if (closed || isAppend) return ;
			autoLoad = true;
			w.setTimeout ( tryAutoLoad, 150 );      /* 等引擎把聲道、區間設定完再讀 */
		}
		function reload () {
			if (closed || busy) return ;
			var rd = readSelection ( app );
			if (rd.err) { status ( rd.err ); if (!src) { emptyMsg = rd.err; draw (); } return ; }
			ws = rd.ws; AU = rd.AU; autoLoad = false; pendSel = '';
			try { app.fireEvent ( 'RequestPause' ); } catch (e) {}
			loadSrc ( snapshot ( app, rd ) );
		}

		/* ---------- 停靠（dock）：'f' 浮動、'l' 左側、'r' 右側 ----------
		 *   停靠時面板貼在工具列下方的畫面邊緣；波形、頁尾等區塊用 margin 讓出同樣寬度（body.pk_tcd_*），
		 *   再送 RequestResize 讓波形重新計算寬度。停靠時放掉 InteractionHandler 鎖，主畫面快捷鍵與播放照常。
		 *   與標記清單同側時，後到的自動靠另一側（只有兩個面板，另一側一定是空的）。 */
		function canDock () { return w.innerWidth > 760; }
		function dockW () { return Math.max ( DW_MIN, Math.min ( dW, w.innerWidth - 480, 760 ) ); }
		function topPx () {
			var t = d.querySelector ( '#app .pk_tbc' ), r = t && t.getBoundingClientRect ();
			return r ? Math.max ( 0, Math.round ( r.bottom ) ) : 0;
		}
		function fireResize () { try { app.fireEvent ( 'RequestResize' ); } catch (e) {} }
		function mrkSide () {
			try {
				var P = w.PKAudioEditor, m = ( P && P._deps && P._deps.mrkpanel ) || ( app._deps && app._deps.mrkpanel );
				return m && m.isOpen && m.isOpen () ? m.side () : 'f';
			} catch (e) { return 'f'; }
		}
		function resolveSide () {
			if (dMode === 'f' || !canDock ()) return 'f';
			var ms = mrkSide ();
			if (ms !== dMode) return dMode;
			var other = dMode === 'l' ? 'r' : 'l';
			return ms !== other ? other : 'f';
		}
		function lock ( on ) {
			var ih = app.ui && app.ui.InteractionHandler;
			if (!ih) return ;
			if (on) { if (!held && ih.checkAndSet ( NAME )) held = true; }
			else if (held) { held = false; if (ih.on && ih.by === NAME) { ih.on = false; ih.by = null; } }
		}
		function layoutDock ( force ) {
			if (closed || applied === 'f') return ;
			var t = topPx (), wd = dockW ();
			if (!force && t === lastTop && wd === lastW) return ;
			lastTop = t; lastW = wd;
			back.style.top = t + 'px'; back.style.width = wd + 'px';
			d.documentElement.style.setProperty ( '--pk_tcw', wd + 'px' );
		}
		function applyMode () {
			if (closed) return ;
			var m = resolveSide (), prev = applied, b = d.body;
			b.classList.toggle ( 'pk_tcd_l', m === 'l' );
			b.classList.toggle ( 'pk_tcd_r', m === 'r' );
			back.classList.toggle ( 'pk_tc_docked', m !== 'f' );
			back.classList.toggle ( 'pk_tc_dkl', m === 'l' );
			back.classList.toggle ( 'pk_tc_dkr', m === 'r' );
			applied = m; lastTop = lastW = -1;
			if (m === 'f') {
				back.style.top = back.style.width = '';
				if (prev !== 'f') { off.x = off.y = 0; pk.style.left = pk.style.top = ''; }
				d.documentElement.style.removeProperty ( '--pk_tcw' );
				lock ( true );
			}
			else { pk.style.left = pk.style.top = ''; layoutDock ( true ); lock ( false ); }
			[].forEach.call ( back.querySelectorAll ( '.pk_tc_dkb' ), function ( bt ) { bt.classList.toggle ( 'on', bt.getAttribute ( 'data-d' ) === m ); } );
			if (prev !== m) { fireResize (); soonDraw (); }
		}
		function setMode ( m ) {
			if (m !== 'f' && m !== 'l' && m !== 'r') return ;
			dMode = m;
			try { w.localStorage.setItem ( DK_KEY, m ); } catch (e) {}
			applyMode ();
		}
		function relayout () {
			if (closed) return ;
			if (resolveSide () !== applied) applyMode (); else layoutDock ();
		}
		function showDrop ( z ) {
			if (!dropEl) { dropEl = d.createElement ( 'div' ); dropEl.className = 'pk_tc_drop'; d.body.appendChild ( dropEl ); }
			if (!z) { dropEl.style.display = 'none'; return ; }
			dropEl.style.cssText = 'display:block;top:' + topPx () + 'px;bottom:0;width:' + dockW () + 'px;' + ( z === 'l' ? 'left:0' : 'right:0' );
		}
		/* 標題列：浮動時可移動（拖到左右邊緣放開＝停靠）；停靠時拖離邊緣＝變回浮動 */
		el.hd.addEventListener ( 'pointerdown', function ( e ) {
			if (( e.button !== undefined && e.button !== 0 ) || ( e.target.closest && e.target.closest ( 'button,select,input,a' ) )) return ;
			e.preventDefault ();
			var sx = e.clientX, sy = e.clientY, started = applied === 'f', ox0 = off.x, oy0 = off.y, zone = null;
			try { el.hd.setPointerCapture ( e.pointerId ); } catch (er) {}
			function place () {
				pk.style.left = off.x + 'px'; pk.style.top = off.y + 'px';
				var r = pk.getBoundingClientRect ();          /* 標題列不可拖出畫面 */
				if (r.top < 0) off.y -= r.top;
				if (r.top > w.innerHeight - 40) off.y -= r.top - ( w.innerHeight - 40 );
				if (r.left > w.innerWidth - 80) off.x -= r.left - ( w.innerWidth - 80 );
				if (r.right < 80) off.x += 80 - r.right;
				pk.style.left = off.x + 'px'; pk.style.top = off.y + 'px';
			}
			function begin () {
				setMode ( 'f' );                                /* 同步套用：面板回到置中，off 歸零 */
				var r = pk.getBoundingClientRect ();
				off.x = ( sx - 80 ) - r.left; off.y = ( sy - 14 ) - r.top;
				ox0 = off.x; oy0 = off.y; started = true;
			}
			function move ( ev ) {
				if (!started) {
					if (Math.abs ( ev.clientX - sx ) + Math.abs ( ev.clientY - sy ) < 6) return ;
					begin ();
				}
				off.x = ox0 + ( ev.clientX - sx ); off.y = oy0 + ( ev.clientY - sy );
				place ();
				zone = canDock () ? ( ev.clientX < EDGE ? 'l' : ev.clientX > w.innerWidth - EDGE ? 'r' : null ) : null;
				showDrop ( zone );
			}
			function up () {
				el.hd.removeEventListener ( 'pointermove', move );
				el.hd.removeEventListener ( 'pointerup', up );
				el.hd.removeEventListener ( 'pointercancel', up );
				try { el.hd.releasePointerCapture ( e.pointerId ); } catch (er) {}
				showDrop ( null );
				if (started && zone) setMode ( zone );
			}
			el.hd.addEventListener ( 'pointermove', move );
			el.hd.addEventListener ( 'pointerup', up );
			el.hd.addEventListener ( 'pointercancel', up );
		});
		back.querySelector ( '.pk_tc_dks' ).addEventListener ( 'click', function ( e ) {
			var bt = e.target.closest && e.target.closest ( '.pk_tc_dkb' );
			if (bt) setMode ( bt.getAttribute ( 'data-d' ) );
		});
		/* 側邊分隔條：拖曳調整寬度，雙擊還原 */
		el.sp.addEventListener ( 'pointerdown', function ( e ) {
			if (e.button !== undefined && e.button !== 0) return ;
			e.preventDefault (); e.stopPropagation ();
			el.sp.classList.add ( 'on' );
			try { el.sp.setPointerCapture ( e.pointerId ); } catch (er) {}
			var raf = 0;
			function move ( ev ) {
				dW = Math.round ( applied === 'r' ? w.innerWidth - ev.clientX : ev.clientX );
				dW = Math.max ( DW_MIN, Math.min ( dW, w.innerWidth - 480, 760 ) );
				layoutDock ();
				if (!raf) raf = w.requestAnimationFrame ( function () { raf = 0; fireResize (); } );
			}
			function up () {
				el.sp.removeEventListener ( 'pointermove', move );
				el.sp.removeEventListener ( 'pointerup', up );
				el.sp.removeEventListener ( 'pointercancel', up );
				el.sp.classList.remove ( 'on' );
				try { el.sp.releasePointerCapture ( e.pointerId ); } catch (er) {}
				try { w.localStorage.setItem ( DW_KEY, String ( dW ) ); } catch (er) {}
				fireResize ();
			}
			el.sp.addEventListener ( 'pointermove', move );
			el.sp.addEventListener ( 'pointerup', up );
			el.sp.addEventListener ( 'pointercancel', up );
		});
		el.sp.addEventListener ( 'dblclick', function () {
			dW = DW_DEF;
			try { w.localStorage.removeItem ( DW_KEY ); } catch (er) {}
			layoutDock (); fireResize ();
		});

		/* ---------- 依面板自己的寬度排版（不看視窗寬度） ---------- */
		function sized () {
			var wd = pk.clientWidth;
			pk.classList.toggle ( 'pk_tc_nw', wd < 580 );
			if (( wd < 580 ) !== nar) { nar = wd < 580; applyNar (); }        /* [新增] 窄／寬切換時改選項文字 */
			pk.classList.toggle ( 'pk_tc_xs', wd < 420 );
			fitSel ( el.lang ); fitSel ( el.reg );
			soonDraw ();
		}
		if (w.ResizeObserver) { ro = new w.ResizeObserver ( sized ); ro.observe ( pk ); }
		else w.addEventListener ( 'resize', sized );
		/* 換主題（data-theme）時圖要重畫 */
		if (w.MutationObserver) { mo = new w.MutationObserver ( soonDraw ); mo.observe ( d.documentElement, { attributes: true, attributeFilter: [ 'data-theme', 'class' ] } ); }

		function close () {
			if (closed) return ;
			closed = true; stopPlay (); sylJob && sylJob.cancel (); bigJob && bigJob.cancel ();
			var wasDocked = applied !== 'f';
			w.clearInterval ( tmr ); ro && ro.disconnect (); mo && mo.disconnect ();
			w.removeEventListener ( 'keydown', onKey, true ); w.removeEventListener ( 'resize', sized );
			back.parentNode && back.parentNode.removeChild ( back );
			dropEl && dropEl.parentNode && dropEl.parentNode.removeChild ( dropEl );
			d.body.classList.remove ( 'pk_tcd_l' ); d.body.classList.remove ( 'pk_tcd_r' );
			d.documentElement.style.removeProperty ( '--pk_tcw' );
			/* 只有還握著鎖時才放（停靠中已經放掉，不能再 forceUnset，否則會誤彈別人的鎖） */
			if (held) { held = false; try { app.ui.InteractionHandler.forceUnset ( NAME ); } catch (e) {} }
			onclose && onclose ();
			if (wasDocked) fireResize ();            /* 主畫面把讓出的寬度拿回來 */
		}
		function inside ( e ) { return !!( e.target && back.contains ( e.target ) ); }
		function onKey ( e ) {
			/* 停靠時，焦點不在面板內的按鍵一律交給主畫面（空白鍵＝播放、方向鍵…） */
			if (applied !== 'f' && !inside ( e )) return ;
			if (e.key === 'Escape' && el.pop.style.display === 'flex') { e.preventDefault (); e.stopPropagation (); popShow ( false ); return ; }
			if (e.key === 'Escape' && el.mappop.style.display === 'block') { e.preventDefault (); e.stopPropagation (); mapShow ( false ); return ; }
			if (e.key === 'Escape' && ( chipT >= 0 || el.advp.style.display === 'block' )) { e.preventDefault (); e.stopPropagation (); hideChip (); advShow ( false ); return ; }        /* [新增] Esc 先收起浮動工具／音高設定 */
			if (e.target && /^(INPUT|SELECT)$/.test ( e.target.tagName ) && e.key !== 'Escape' && !( e.key === 'Enter' && ( e.ctrlKey || e.metaKey ) )) { e.stopPropagation (); return ; }
			if (e.key === 'Escape') { e.preventDefault (); close (); }
			else if (e.key === ' ' && !( e.target && e.target.tagName === 'BUTTON' ) && el.pop.style.display !== 'flex') { e.preventDefault (); el.prev.click (); }
			else if (e.key === 'Enter' && ( e.ctrlKey || e.metaKey ) && el.pop.style.display !== 'flex') { e.preventDefault (); el.apply.click (); }
			e.stopPropagation ();
		}
		w.addEventListener ( 'keydown', onKey, true );
		el.close.onclick = close;
		/* 浮動時點遮罩外面＝關閉；停靠時沒有遮罩，點外面不會關 */
		back.addEventListener ( 'mousedown', function ( e ) { if (e.target === back && applied === 'f') close (); } );


		/* ---------- [學習] 記住人工標註 ---------- */
		function learnRow ( k ) {
			var fs = rowSel ( 'from', k ), s = syls[ k ];
			if (!fs || !s || !scaleNow || fs.value === 'custom') return false;
			var ok = Learn.add ( langId, accId, fs.value, contourPts ( sylHz[ k ] ), scaleNow, s.b - s.a, sylHz[ k ] );
			if (ok && plan[ k ]) plan[ k ].remembered = true;
			return ok;
		}
		function lrnToneName ( id ) { var t = TS.find ( id ); return t ? toneLabel ( t ) : id; }
		function syncLearn () {
			var n = Learn.count ( langId, accId );
			el.lrn.textContent = '★ ' + n;
			el.lrn.title = tf ( 'tc.lrn_tip', '已記住的人工標註（這個腔調）：', 'Remembered labels (this accent): ' ) + n;
			el.lrn.className = 'pk_tc_b' + ( n ? ' on' : '' );
			renderLearn ();
		}
		function renderLearn () {
			var by = Learn.byTone ( langId, accId ), n = Learn.count ( langId, accId ), h = '';
			h += '<div><b>' + esc ( tf ( 'tc.lrn_title', '學習（記住你標過的聲調）', 'Learning (remember your labels)' ) ) + '</b></div>';
			h += '<div>' + esc ( tf ( 'tc.lrn_info', '這個腔調已記住', 'Remembered for this accent:' ) ) + ' ' + n + ' ' + esc ( tf ( 'tc.chars', '字', 'syllables' ) ) +
				'（' + esc ( tf ( 'tc.lrn_all', '全部', 'all' ) ) + ' ' + Learn.total () + '）</div>';
			h += '<div>' + esc ( tf ( 'tc.lrn_tpl', '可當範本（有細緻曲線）', 'Usable as templates' ) ) + ' ' + Learn.tplCount ( langId, accId ) + ' / ' + n + '</div>';
			var tl = Object.keys ( by );
			if (tl.length) h += '<div>' + tl.map ( function ( id ) {
				return esc ( lrnToneName ( id ) ) + ' ' + by[ id ] + ' <button type="button" class="pk_tc_p" data-l="rmt" data-t="' + esc ( id ) + '" title="' + esc ( tf ( 'tc.lrn_rmt', '刪除這個聲調的全部樣本', 'Delete all samples of this tone' ) ) + '">&#10005;</button>';
			}).join ( ' ・ ' ) + '</div>';
			h += '<div><label><input type="checkbox" data-l="on"' + ( Learn.enabled () ? ' checked' : '' ) + '> ' + esc ( tf ( 'tc.lrn_on', '辨識時參考已記住的字', 'Use remembered labels when detecting' ) ) + '</label></div>';
			h += '<div class="pk_tc_bar">' +
				'<button type="button" class="pk_tc_b" data-l="all">' + esc ( tf ( 'tc.lrn_saveall', '記住目前全部（確認都正確）', 'Remember all current rows' ) ) + '</button>' +
				'<button type="button" class="pk_tc_b" data-l="undo">' + esc ( tf ( 'tc.lrn_undo', '刪除最近一筆', 'Delete last' ) ) + '</button>' +
				'<button type="button" class="pk_tc_b" data-l="exp">' + esc ( tf ( 'tc.lrn_exp', '匯出', 'Export' ) ) + '</button>' +
				'<button type="button" class="pk_tc_b" data-l="imp">' + esc ( tf ( 'tc.lrn_imp', '匯入', 'Import' ) ) + '</button>' +
				'<button type="button" class="pk_tc_b" data-l="clr">' + esc ( tf ( 'tc.lrn_clr', '清除此腔調', 'Clear this accent' ) ) + '</button>' +
				'<button type="button" class="pk_tc_b" data-l="clrall">' + esc ( tf ( 'tc.lrn_clrall', '清除全部', 'Clear all' ) ) + '</button></div>';
			el.lrnbox.innerHTML = h;
		}
		function afterLearn ( msg ) { syncLearn (); redetect (); if (msg) status ( msg ); }
		function confirmRow ( k ) {
			if (!plan[ k ]) return ;
			plan[ k ].manual = true;
			var ok = learnRow ( k ), cell = rowSel ( 'conf', k );
			if (cell) { cell.innerHTML = confHtml ( plan[ k ] ); cell.parentNode.className = rowCls ( k ); }
			updateCounts (); updateReg ();
			afterLearn ( ok ? tf ( 'tc.lrn_done', '已記住', 'Remembered' ) : '' );
		}
		el.lrn.onclick = function () { renderLearn (); popShow ( true ); };
		el.lrnbox.addEventListener ( 'click', function ( e ) {
			var b = e.target && e.target.closest && e.target.closest ( '[data-l]' );
			if (!b) return ;
			var a = b.getAttribute ( 'data-l' );
			if (a === 'on') { Learn.setEnabled ( b.checked ); afterLearn (); }
			else if (a === 'all') {
				var c = 0; plan.forEach ( function ( p, k ) { if (learnRow ( k )) ++c; } );
				afterLearn ( tf ( 'tc.lrn_done', '已記住', 'Remembered' ) + ' ' + c );
			}
			else if (a === 'undo') { Learn.undoLast ( langId, accId ); afterLearn (); }
			else if (a === 'rmt') { Learn.removeTone ( langId, accId, b.getAttribute ( 'data-t' ) ); afterLearn (); }
			else if (a === 'clr') { if (w.confirm ( tf ( 'tc.lrn_cfm', '確定清除這個腔調已記住的字？', 'Clear remembered labels of this accent?' ) )) { Learn.clear ( langId, accId ); afterLearn (); } }
			else if (a === 'clrall') { if (w.confirm ( tf ( 'tc.lrn_cfm2', '確定清除所有語言、腔調已記住的字？', 'Clear ALL remembered labels?' ) )) { Learn.clear (); afterLearn (); } }
			else if (a === 'exp') {
				try {
					var blob = new w.Blob ([ Learn.exportJSON () ], { type: 'application/json' }), u = w.URL.createObjectURL ( blob ), an = d.createElement ( 'a' );
					an.href = u; an.download = 'soundit-tone-learning.json'; d.body.appendChild ( an ); an.click ();
					setTimeout ( function () { d.body.removeChild ( an ); w.URL.revokeObjectURL ( u ); }, 500 );
				} catch (e2) {}
			}
			else if (a === 'imp') {
				var inp = d.createElement ( 'input' );
				inp.type = 'file'; inp.accept = '.json,application/json';
				inp.onchange = function () {
					var f = inp.files && inp.files[ 0 ]; if (!f) return ;
					var rd = new w.FileReader ();
					rd.onload = function () {
						var n2 = Learn.importJSON ( String ( rd.result ) );
						afterLearn ( n2 < 0 ? tf ( 'tc.lrn_bad', '檔案格式不對', 'Invalid file' ) : tf ( 'tc.lrn_imped', '已匯入', 'Imported' ) + ' ' + n2 );
					};
					rd.readAsText ( f );
				};
				inp.click ();
			}
		});
		el.lrnbox.addEventListener ( 'change', function ( e ) {
			var b = e.target; if (b && b.getAttribute && b.getAttribute ( 'data-l' ) === 'on') { Learn.setEnabled ( b.checked ); afterLearn (); }
		});

		function remember () { savePrefs ({ lang: langId, acc: accId, range: range, anchor: anchor, natural: natural, tsrc: tsrc, reg: regMode, manhz: manHz, saved: savedReg, extra: extraPrefs, kind: srcKind }); }

		/* 使用者手動改了「原聲調」→ 該列標為手動（之後重新偵測不會蓋掉） */
		function markManual ( e ) {
			var t = e.target, kind = t && t.getAttribute && t.getAttribute ( 'data-r' );
			if (kind !== 'from' && kind !== 'fromc') return ;
			var k = +t.getAttribute ( 'data-i' );
			if (plan[ k ]) { plan[ k ].manual = true; var cell = rowSel ( 'conf', k ); if (cell) { cell.innerHTML = confHtml ( plan[ k ] ); cell.parentNode.className = rowCls ( k ); } updateCounts (); updateReg (); }
		}
		el.rows.addEventListener ( 'change', function ( e ) {
			markManual ( e ); updateCounts (); draw ();
			var t = e.target;
			if (t && t.getAttribute && t.getAttribute ( 'data-r' ) === 'from' && t.value !== 'custom') {
				var kk = +t.getAttribute ( 'data-i' );
				if (learnRow ( kk )) { var cell = rowSel ( 'conf', kk ); if (cell) cell.innerHTML = confHtml ( plan[ kk ] ); afterLearn (); }
			}
		} );
		el.rows.addEventListener ( 'input', function ( e ) { markManual ( e ); updateCounts (); draw (); } );
		el.reg.onchange = function () {
			regMode = el.reg.value; fitSel ( el.reg ); showRegWraps ();
			if (regMode === 'manual' && scaleNow && !( prefs.manhz > 0 )) { manHz = Math.round ( hzOfDeg ( 3 ) ); el.manhz.value = manHz; }
			remember (); redetect ();
		};
		el.refn.onchange = function () { refN = +el.refn.value; redetect (); };
		el.reft.onchange = function () { refTone = el.reft.value; redetect (); };
		el.manhz.value = manHz;
		el.manhz.oninput = function () { var v = parseFloat ( el.manhz.value ); if (v >= 60 && v <= 600) { manHz = v; remember (); redetect (); } };
		el.rows.addEventListener ( 'click', function ( e ) {
			var b = e.target && e.target.closest && e.target.closest ( 'button[data-r]' );
			if (!b || !track) return ;
			var kind = b.getAttribute ( 'data-r' ), k = +b.getAttribute ( 'data-i' );
			if (kind === 'ok') { confirmRow ( k ); return ; }
			if (kind === 'tpl') { cycleTpl ( k ); return ; }
			if (kind === 'rst') {                                        /* ↺ 還原：這一列改回「依對應」 */
				var ts = rowSel ( 'to', k ); if (ts) ts.value = '@';
				updateCounts (); draw (); return ;
			}
			if (( kind === 'po' || kind === 'pc' ) && playBtn === b) return stopPlay ();        /* 播放中再按＝停止 */
			playSyl ( k, kind === 'po' );
		});
		/* 點列也標示選取；點音高圖上的音節 = 試聽（Shift = 原音） */
		el.rows.addEventListener ( 'mousedown', function ( e ) {
			var tr = e.target && e.target.closest && e.target.closest ( 'tr' );
			if (!tr || e.target.closest ( 'button' ) || e.target.closest ( 'select' ) || e.target.closest ( 'input' )) return ;
			var c = tr.querySelector ( '[data-i]' ); if (c) selectRow ( +c.getAttribute ( 'data-i' ) );
		});
		cv.classList.add ( 'clk' );
		cv.title = tf ( 'tc.cv_tip2', '點一個字試聽（有設「改成」就播轉換後；按住 Shift = 原音），旁邊會浮出切開／合併工具；右鍵只顯示工具', 'Click a syllable to listen (converted if set; Shift = original); a split / join toolbar pops up. Right-click shows only the toolbar.' );
		cv.addEventListener ( 'click', function ( e ) {
			if (!track || !geo || !syls.length) return ;
			var rc = cv.getBoundingClientRect (), t = ( e.clientX - rc.left - geo.L ) / ( geo.R - geo.L ) * src.dur, best = nearSyl ( t, 0.08 );
			if (best >= 0) playSyl ( best, !!e.shiftKey );
			showChip ( t, nearSyl ( t, 0.25 ), e.clientX - rc.left, e.clientY - rc.top );        /* [新增] 旁邊浮出切分工具 */
		});
		/* [新增] 右鍵：只顯示切分工具，不試聽 */
		cv.addEventListener ( 'contextmenu', function ( e ) {
			if (!track || !geo || !syls.length) return ;
			e.preventDefault ();
			var rc = cv.getBoundingClientRect (), t = ( e.clientX - rc.left - geo.L ) / ( geo.R - geo.L ) * src.dur;
			showChip ( t, nearSyl ( t, 0.25 ), e.clientX - rc.left, e.clientY - rc.top );
		});
		/* 頁籤二的規則一改，圖上紅線、列的「自動：→」、頁籤標籤上的數字都即時更新 */
		el.mapbar.addEventListener ( 'change', function ( e ) {
			if (e.target && e.target.getAttribute ( 'data-m' ) != null) { updateCounts (); draw (); }
		});
		/* [新增 v8] 額外聲調的 ✕ */
		el.mapbar.addEventListener ( 'click', function ( e ) {
			var b = e.target && e.target.closest ? e.target.closest ( '[data-xr]' ) : null;
			if (b) { e.preventDefault (); removeExtra ( b.getAttribute ( 'data-xr' ) ); }
		});
		function retone () {
			remember (); cache = null; cacheKey = ''; sylCache = {}; sylCacheN = 0; selK = -1;
			fillAccents (); syncLearn ();
			if (!track) { if (!src) { buildAll (); fillReg (); buildRows (); } draw (); return ; }
			plan = []; detectAll (); buildAll (); fillReg (); buildRows (); draw ();
		}
		el.kind.onchange = function () { srcKind = el.kind.value === 'citation' ? 'citation' : 'natural'; retone (); };
		el.lang.onchange = function () { var v = el.lang.value.split ( '|' ); langId = v[ 0 ]; accId = v[ 1 ]; retone (); };
		/* 「全部改成」：每一列都逐字指定成同一個（優先於對應規則；對應規則本身不動）。「全部依對應」＝清掉所有逐字指定 */
		el.all.onchange = function () {
			var v = el.all.value;
			if (v === '-') return ;
			[].forEach.call ( el.rows.querySelectorAll ( 'select[data-r=to]' ), function ( s ) { s.value = v; } );
			el.all.value = '-';
			updateCounts (); draw ();
		};
		el.range.title = tf ( 'tc.range_tip', '連按兩下回到 1.00', 'Double-click to reset to 1.00' );
		el.range.ondblclick = function () { el.range.value = 1; el.range.oninput (); };
		el.natural.ondblclick = function () { el.natural.value = 0.7; el.natural.oninput (); };
		el.natural.oninput = function () { natural = +el.natural.value; el.naturalv.textContent = natural.toFixed ( 2 ); syncAdv (); remember (); draw (); };
		el.range.oninput = function () { range = +el.range.value; el.rangev.textContent = range.toFixed ( 2 ); syncAdv (); remember (); draw (); };
		el.anchor.onchange = function () { anchor = el.anchor.value; syncAdv (); remember (); draw (); };
		el.tsrc.onchange = function () { tsrc = el.tsrc.value; syncAdv (); remember (); updateAuto (); draw (); };
		el.orig.onclick = function () { if (!src) return ; if (playBtn === el.orig) return stopPlay (); pend ( el.orig ); playBuf ( src.seg ); };
		el.prev.onclick = function () {
			if (playBtn === el.prev) return stopPlay ();
			if (busy || !track) return ;
			pend ( el.prev );
			guard ( function () { return compute ().then ( function ( out ) { playBuf ( toBuffer ( out ) ); }, function ( e ) { stopPlay (); throw e; } ); } );
		};
		el.reload.onclick = reload;
		el.apply.onclick = function () {
			if (isStale ()) { stale = true; syncBtns (); updateNote (); return ; }
			guard ( function () {
				return compute ().then ( function ( out ) {
					if (closed) throw new Error ( 'closed' );
					/* 運算期間音訊又被改過（停靠時可能同時剪輯）：不能寫回，位置已經不對 */
					if (isStale ()) { stale = true; syncBtns (); updateNote (); throw new Error ( tf ( 'tc.stale', '音訊已被編輯，請重新讀取', 'Audio was edited. Reload.' ) ); }
					var nb = toBuffer ( out ), nd;
					selfEdit = true;                         /* 自己的編輯不算「過期」 */
					try {
						app.fireEvent ( 'StateRequestPush', { desc: tf ( 'tc.title', '聲調轉換', 'Tone change' ), meta: [ src.start, src.dur ], data: ws.backend.buffer } );
						/* 引擎的 Replace 是「先移除再插入」，整份檔案都在範圍內時移除後長度為 0 會出錯：改走整份取代；
						 * 聲道數不同（只選了部分聲道）時，留 1 個取樣在尾端避開這個情況 */
						var ob = ws.backend.buffer, rm = ( src.dur * ob.sampleRate ) >> 0;
						if (rm >= ob.length && nb.numberOfChannels === ob.numberOfChannels) AU.FullReplace ( nb );
						else if (rm >= ob.length) { nb = toBuffer ( out, 0, out[ 0 ].length - 1 ); AU.Replace ( src.start, ( rm - 1 ) / ob.sampleRate, nb ); }
						else AU.Replace ( src.start, src.dur, nb );
						nd = nb.length / sr;
						ws.regions.clear (); ws.regions.add ({ start: src.start, end: src.start + nd, id: 't' });
						app.fireEvent ( 'RequestSeekTo', src.start / ws.getDuration () );
					} finally { selfEdit = false; }
					w.OneUp && w.OneUp ( tf ( 'tc.applied', '已套用聲調轉換', 'Tone change applied' ) );
					if (applied === 'f') return close ();
					/* 停靠：不關閉，改用套用後的新選取範圍重新分析（對應規則清掉，免得在已轉換的音上又套一次） */
					var rd = readSelection ( app );
					if (rd.err) { stale = true; syncBtns (); updateNote (); status ( rd.err ); return ; }
					loadSrc ( snapshot ( app, rd ) );
				});
			});
		};

		/* 啟動 */
		applyMode ();
		sized ();
		syncLearn ();
		syncMapBtn ( 0 );
		tmr = w.setInterval ( function () { relayout (); pollSel (); }, 500 );      /* 工具列高度、標記清單狀態變動時跟著調整（與標記清單相同做法） */
		updateNote ();
		if (src) analyse ();
		else { buildAll (); fillReg (); buildRows (); status ( '' ); }
		w.requestAnimationFrame ( draw );
		return {
			close: close, reload: reload, setMode: setMode, side: function () { return applied; },
			relayout: relayout, checkStale: checkStale, checkSel: checkSel, stopPlay: stopPlay,
			reselect: function () { if (applied !== 'f') reload (); },
			onLoaded: onLoaded
		};
	}

	w.PKToneChange = {
		attach: attach, TONES: TONES,
		/* 停靠：dock('l'|'r'|'f')；side() 回傳目前實際所在的位置 */
		dock: function ( m ) { if (cur) cur.setMode ( m ); else if (m === 'l' || m === 'r' || m === 'f') { dMode = m; try { w.localStorage.setItem ( DK_KEY, m ); } catch (e) {} } },
		side: function () { return cur ? cur.side () : dMode; },
		_core: { learn: Learn, detectTone: detectTone, detectByShape: detectByShape, detectScored: detectScored, detectTones: detectTones, scoreTones: scoreTones, contourPts: contourPts, refineScale: refineScale, fixedScale: fixedScale, presetScale: presetScale, calibrate: calibrate, PRESETS: PRESETS, pitchScale: pitchScale, buildTarget: buildTarget, frameDb: frameDb, rescueRegions: rescueRegions, mergeRescue: mergeRescue, bridgeGaps: bridgeGaps, parseChao: parseChao, chaoOf: chaoOf, sameTone: sameTone,
			changedRange: changedRange, hashF0: hashF0, spanOf: spanOf, directRun: directRun, workerRun: workerRun, smartRun: smartRun, renderSpan: renderSpan, spliceSpan: spliceSpan, countByTone: countByTone, CTX_SEC: CTX_SEC, SYL_PAD: SYL_PAD }
	};
})( window, document );
