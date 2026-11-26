/* Soundit 匯入佇列（第二、三階段）
 *
 * 統一入口：選檔（可多選）、拖放、PWA 從作業系統開啟，都進同一個流程。
 *   - 只有一個檔案：維持原本的 engine.LoadFile（含第一階段的取代／附加詢問），行為不變。
 *   - 兩個以上：跳出匯入清單 → 可拖曳／▲▼／Alt+↑↓ 排序、刪除、依檔名自然排序、再加入檔案
 *     → 選取代或附加、是否在接點加標記、檔間靜音 → 依序解碼、串接成一個 AudioBuffer
 *     → engine.LoadBuffer 一次載入（可 Ctrl+Z 還原）。
 *   - 進度（2/3）、可取消；失敗的檔案略過，最後彙整回報。
 *   - [第四階段] 已有音訊時可選「開新瀏覽器分頁」：新分頁載入後，由原分頁用 postMessage 把清單（File 物件或網址）交給它，
 *     在新分頁依序解碼、串接。兩個分頁完全隔離（各自的記憶體、復原堆疊），不動到核心。
 *   - [第三階段] 網址也能進清單：檔案選單「從網址開啟」可貼多行（每行一個）、?url=a&url=b 可帶多個；
 *     清單中的網址項目可以直接改文字（修正貼錯的字元）。網址下載失敗（404、CORS、網路錯誤）同樣略過並彙整回報。
 *
 * 對外：
 *   app.importq.Open ( files )        files＝File 陣列／FileList（也可混入網址字串）
 *   app.importq.OpenInNewTab ( items, opt )  [新增] 開新分頁並交付項目；被瀏覽器擋下彈出視窗時回傳 false
 *   app.importq.RunItems ( list, opt ) [新增] 新分頁收到項目後直接匯入（不再顯示清單）
 *   app.importq.OpenURLs ( urls )     [新增] urls＝網址字串或陣列（字串內可含多行）；自動去掉空行、重複行；多軌模式則每個網址各加一條軌道
 *   app.importq.HandleDrop ( files )  drag.js 呼叫；已處理回傳 true
 *   app.importq.HandleLaunch ( p )    PWA launchQueue 的 launchParams
 *   PKAudioEditor._deps.importq.util  純函式（排序、串接版面、聲道混合、parseURLs、webURL、pastedURLs、isLaunchURL、fmtSize、sniffRate、chooseRate），方便測試
 *
 * 需要：engine.js 的 IsLoadableAudioFile／EstimateDecodedBytes／LoadBuffer 等（第二階段新增）。 */
(function ( w, d, PKAE ) {
	'use strict';

	var PREF_KEY = 'pk_iq_prefs';
	var DEFAULT_RATE = 44100;	/* 與原本單檔載入一致（backend.decodeArrayBuffer 用 44100 的離線 context） */
	/* [新增] 取代模式下，第一個檔案的原始取樣率若在這張表裡，就用它解碼（免重取樣）；不在表裡（22050、96000、認不出來…）維持 DEFAULT_RATE，行為和以前一樣。
	 * 想放寬就在這裡加（例如 96000），不需要動其他地方。 */
	var NATIVE_RATES = [ 44100, 48000 ];

	/* ------------------------------------------------------------------ 純函式 */

	var collator = null;
	function natCompare ( a, b ) {
		if (!collator) {
			try { collator = new Intl.Collator ([ 'zh-TW', 'en' ], { numeric: true, sensitivity: 'base' }); }
			catch (e) { collator = { compare: function ( x, y ) { return x < y ? -1 : (x > y ? 1 : 0); } }; }
		}
		return collator.compare ( String ( a ), String ( b ) );
	}

	/* 依檔名自然排序（file2 < file10）；回傳新陣列，不改原陣列。同名時維持原本順序 */
	function naturalSort ( items ) {
		return items.map ( function ( it, i ) { return { it: it, i: i }; })
			.sort ( function ( x, y ) { return natCompare ( x.it.name, y.it.name ) || x.i - y.i; })
			.map ( function ( o ) { return o.it; });
	}

	function fmtSize ( n ) {
		if (!(n > 0)) return '';
		if (n >= 1048576) return (n / 1048576).toFixed (n >= 10485760 ? 0 : 1) + ' MB';
		return Math.max (1, Math.round (n / 1024)) + ' KB';
	}

	/* 串接版面：lens＝每段長度（取樣數），base＝前面已有的取樣數（附加時是現有音訊），gap＝檔間靜音（取樣數）。
	 * 第一個新片段前面是否要空：有 base（附加）就空，沒有就不空。 */
	function planLayout ( lens, base, gap ) {
		var starts = [], total = base || 0;
		for (var i = 0; i < lens.length; ++i) {
			if (i > 0 || base) total += gap;
			starts.push ( total );
			total += lens[ i ];
		}
		return { starts: starts, total: total };
	}

	/* 取出要寫進 out 個聲道的資料。單聲道→複製到雙聲道；多聲道→只取前兩個；
	 * 要單聲道但來源是立體聲→左右平均。回傳 Float32Array 陣列（能直接用就不複製） */
	function mixChannels ( src, out ) {
		var n = src.numberOfChannels, res = [], i;
		if (n === out) {
			for (i = 0; i < out; ++i) res.push ( src.getChannelData ( i ) );
		}
		else if (out === 1) {
			var l = src.getChannelData ( 0 ), r = src.getChannelData ( 1 ), m = new Float32Array ( l.length );
			for (i = 0; i < m.length; ++i) m[ i ] = (l[ i ] + r[ i ]) * 0.5;
			res.push ( m );
		}
		else {
			res.push ( src.getChannelData ( 0 ) );
			res.push ( src.getChannelData ( n > 1 ? 1 : 0 ) );
		}
		return res;
	}

	/* [新增] 把貼上的文字整理成網址陣列：一行一個、去頭尾空白與包住網址的 < > " '、略過空行與重複行。
	 * input 可以是字串或字串陣列（每個字串內也可以含多行）。
	 * valid（可省略）：驗證函式；沒通過的行不收，並用 bad 回報「第一個不合格的行號」（從 1 算起，0＝都合格）。 */
	function parseURLs ( input, valid ) {
		var urls = [], seen = {}, bad = 0, n = 0;
		var chunks = typeof input === 'string' ? [ input ] : toArray ( input );
		chunks.forEach ( function ( chunk ) {
			String ( chunk == null ? '' : chunk ).split ( /\r\n|\r|\n/ ).forEach ( function ( line ) {
				++n;
				var u = line.trim ().replace ( /^[<"']+|[>"',]+$/g, '' ).trim ();
				if (!u) return ;
				if (valid && !valid ( u )) { if (!bad) bad = n; return ; }
				if (seen[ u ]) return ;
				seen[ u ] = 1;
				urls.push ( u );
			});
		});
		return { urls: urls, bad: bad };
	}

	/* [新增] 檢查並整理「從網址開啟」貼上的網址（改用瀏覽器內建的 URL 解析，取代原本的正規式）。
	 * 接受：http(s)://…、//…、沒寫協定的 example.com/a.mp3（補上 https://）。中文檔名、括號、逗號等都可以。
	 * 回傳整理後的完整網址；不是網頁網址（協定不是 http/https、主機名稱不合理、含空白）回傳空字串。 */
	function webURL ( s ) {
		s = String ( s || '' ).trim ();
		if (!s || /\s/.test ( s )) return '';
		var full = /^[a-z][a-z0-9+.-]*:/i.test ( s ) ? s : (s.indexOf ('//') === 0 ? 'https:' + s : 'https://' + s);
		var x;
		try { x = new URL ( full ); } catch (e) { return ''; }
		if (x.protocol !== 'http:' && x.protocol !== 'https:') return '';
		var h = x.hostname;
		if (!(h === 'localhost' || h.charAt (0) === '[' || h.indexOf ('.') > 0)) return '';
		return full;
	}

	/* [新增] 貼上／拖入的文字：只有「每個非空行都是 http(s):// 開頭的有效網址」才算網址清單，回傳網址陣列；
	 * 其他情況（夾雜一般文字、沒寫協定、什麼都沒有）回傳空陣列。比選單裡的輸入框嚴格，避免誤攔一般文字。
	 * 也會略過 text/uri-list 的 # 註解行 */
	function pastedURLs ( text ) {
		var r = parseURLs ( String ( text || '' ).replace ( /^#.*$/gm, '' ), function ( u ) {
			return /^https?:\/\//i.test ( u ) && !!webURL ( u );
		});
		return r.bad ? [] : r.urls;
	}

	/* [新增] 網址能不能當作載入來源：http(s)、// 開頭，或沒有協定的相對路徑；不可含空白。
	 * 擋掉 javascript:、data: 等其他協定（與 index.html 的 ?url= 檢查同一套規則） */
	function isLaunchURL ( u ) {
		u = String ( u || '' );
		if (!u || /\s/.test ( u )) return false;
		return /^(https?:)?\/\//i.test ( u ) || !/^[a-z][a-z0-9+.-]*:/i.test ( u );
	}

	/* [新增] 解碼前先從檔頭讀出原始取樣率（decodeAudioData 會直接重取樣，解碼完就看不出原檔的取樣率了）。
	 * 支援：WAV、FLAC、MP3（MPEG-1／2／2.5 Layer I／II／III，會跳過 ID3v2）、Ogg Vorbis、Ogg Opus（Opus 解碼一律 48000）。
	 * 認不出來（M4A／AAC／WebM、檔案太短、檔頭損毀…）回傳 0。ab：ArrayBuffer 或 Uint8Array（不複製資料）。 */
	var MP3_RATES = { 3: [ 44100, 48000, 32000 ], 2: [ 22050, 24000, 16000 ], 0: [ 11025, 12000, 8000 ] };	/* 索引＝MPEG 版本位元：3＝1、2＝2、0＝2.5 */
	var MP3_KBPS = {	/* 位元率表（kbps），索引＝標頭的 bitrate index */
		v1l1 : [ 0, 32, 64, 96, 128, 160, 192, 224, 256, 288, 320, 352, 384, 416, 448 ],
		v1l2 : [ 0, 32, 48, 56, 64, 80, 96, 112, 128, 160, 192, 224, 256, 320, 384 ],
		v1l3 : [ 0, 32, 40, 48, 56, 64, 80, 96, 112, 128, 160, 192, 224, 256, 320 ],
		v2l1 : [ 0, 32, 48, 56, 64, 80, 96, 112, 128, 144, 160, 176, 192, 224, 256 ],
		v2l23: [ 0, 8, 16, 24, 32, 40, 48, 56, 64, 80, 96, 112, 128, 144, 160 ]
	};

	/* 讀 b[i] 開始的 MP3 影格標頭；不合法回傳 null，合法回傳 { ver, layer, rate, len }（len＝整個影格的位元組數） */
	function mp3Header ( b, i ) {
		if (b[ i ] !== 0xFF || (b[ i + 1 ] & 0xE0) !== 0xE0) return null;
		var v = (b[ i + 1 ] >> 3) & 3, l = (b[ i + 1 ] >> 1) & 3;	/* l：3＝Layer I、2＝II、1＝III、0＝保留（ADTS/AAC 的這兩位元是 0，順便被擋掉） */
		var br = b[ i + 2 ] >> 4, sr = (b[ i + 2 ] >> 2) & 3, pad = (b[ i + 2 ] >> 1) & 1;
		if (v === 1 || l === 0 || br === 0 || br === 15 || sr === 3) return null;	/* br 0＝free format，算不出長度，當作不合法 */
		var t = v === 3 ? (l === 3 ? MP3_KBPS.v1l1 : (l === 2 ? MP3_KBPS.v1l2 : MP3_KBPS.v1l3)) : (l === 3 ? MP3_KBPS.v2l1 : MP3_KBPS.v2l23);
		var rate = MP3_RATES[ v ][ sr ], bps = t[ br ] * 1000;
		var len = l === 3 ? (Math.floor ( 12 * bps / rate ) + pad) * 4 : Math.floor ( (l === 1 && v !== 3 ? 72 : 144) * bps / rate ) + pad;
		return { ver: v, layer: l, rate: rate, len: len };
	}

	function sniffRate ( ab ) {
		if (!ab || !(ab.byteLength > 12)) return 0;
		var b = ab.buffer ? new Uint8Array ( ab.buffer, ab.byteOffset, ab.byteLength ) : new Uint8Array ( ab );
		var n = b.length, off = 0, i;
		function is ( at, str ) { for (var k = 0; k < str.length; ++k) if (b[ at + k ] !== str.charCodeAt ( k )) return false; return true; }
		function u32 ( at ) { return (b[ at ] | b[ at + 1 ] << 8 | b[ at + 2 ] << 16 | b[ at + 3 ] << 24) >>> 0; }
		function sane ( r ) { return r >= 8000 && r <= 192000 ? r : 0; }

		/* ID3v2 標籤（MP3 一定有可能有，FLAC 前面偶爾也有；內嵌封面圖時可能好幾百 KB）：整段跳過 */
		while (off + 10 <= n && is ( off, 'ID3' ))
			off += 10 + (((b[ off + 6 ] & 0x7F) << 21) | ((b[ off + 7 ] & 0x7F) << 14) | ((b[ off + 8 ] & 0x7F) << 7) | (b[ off + 9 ] & 0x7F)) + ((b[ off + 5 ] & 0x10) ? 10 : 0);
		if (off + 8 > n) return 0;

		/* WAV：找 'fmt ' 區塊（不一定緊接在檔頭後面），取樣率在區塊資料第 4 個位元組起的 32 位元 */
		if (off === 0 && is ( 0, 'RIFF' ) && is ( 8, 'WAVE' )) {
			for (var p = 12; p + 8 <= n; ) {
				var sz = u32 ( p + 4 );
				if (is ( p, 'fmt ' )) return sz >= 16 && p + 16 <= n ? sane ( u32 ( p + 12 ) ) : 0;
				p += 8 + sz + (sz & 1);
			}
			return 0;
		}

		/* FLAC：'fLaC' 後第一個區塊必須是 STREAMINFO（類型 0）；取樣率是其中第 10 個位元組起的 20 位元 */
		if (is ( off, 'fLaC' )) {
			if ((b[ off + 4 ] & 0x7F) !== 0 || off + 22 > n) return 0;
			var s = off + 18;
			return sane ( (b[ s ] << 12) | (b[ s + 1 ] << 4) | (b[ s + 2 ] >> 4) );
		}

		/* Ogg：第一個封包是 Vorbis 識別標頭（取樣率在 +12）或 OpusHead（解碼固定 48000）；其他（Speex、Ogg FLAC…）不處理 */
		if (off === 0 && is ( 0, 'OggS' )) {
			var d = 27 + b[ 26 ];
			if (d + 16 > n) return 0;
			if (b[ d ] === 1 && is ( d + 1, 'vorbis' )) return sane ( u32 ( d + 12 ) );
			return is ( d, 'OpusHead' ) ? 48000 : 0;
		}

		/* MP4／M4A（'ftyp'）、WebM／Matroska（EBML）：結構複雜，不處理，免得把裡面的資料誤當成 MP3 影格 */
		if (is ( off + 4, 'ftyp' ) || (b[ off ] === 0x1A && b[ off + 1 ] === 0x45 && b[ off + 2 ] === 0xDF && b[ off + 3 ] === 0xA3)) return 0;

		/* MP3：從 ID3 之後往下找第一個合法影格，並確認「下一個影格」的位置也對得上（影格太靠檔尾時放行），避免誤判 */
		var end = Math.min ( n - 4, off + 16384 );
		for (i = off; i <= end; ++i) {
			var h = mp3Header ( b, i );
			if (!h) continue;
			var nx = i + h.len;
			if (nx + 4 <= n) {
				var h2 = mp3Header ( b, nx );
				if (!h2 || h2.rate !== h.rate || h2.ver !== h.ver || h2.layer !== h.layer) continue;
			}
			return h.rate;
		}
		return 0;
	}

	/* [新增] 取樣率的取捨：原檔取樣率在 NATIVE_RATES 裡就用它，否則（0＝認不出來、22050、96000…）用 DEFAULT_RATE */
	function chooseRate ( sniffed ) {
		return NATIVE_RATES.indexOf ( sniffed ) >= 0 ? sniffed : DEFAULT_RATE;
	}

	function stripExt ( name ) { return String ( name || '' ).replace ( /\.[^.\/\\]+$/, '' ); }

	function toArray ( list ) {
		var a = [];
		if (!list) return a;
		for (var i = 0; i < list.length; ++i) a.push ( list[ i ] );
		return a;
	}

	/* ------------------------------------------------------------------ 樣式（只注入一次） */

	function injectCSS () {
		if (d.getElementById ('pk_iq_css')) return ;
		var st = d.createElement ('style');
		st.id = 'pk_iq_css';
		st.textContent =
			'.pk_iq{min-width:380px;width:min(92vw,560px)}' +
			'.pk_iq_hint{margin:0 0 8px;font-size:12px;color:var(--fg-1,#9aa3ad)}' +
			'.pk_iq_tools{display:flex;flex-wrap:wrap;gap:6px;margin:0 0 8px}' +
			'.pk_iq_tb{padding:3px 11px;font:12px/18px inherit;color:var(--fg-0,#e8edf0);background:transparent;' +
				'border:1px solid var(--bd,rgba(255,255,255,.07));border-radius:14px;cursor:pointer}' +
			'.pk_iq_tb:hover{border-color:var(--ac,#5af2ff);color:var(--ac,#5af2ff)}' +
			'.pk_iq_list{list-style:none;margin:0;padding:0;max-height:min(38vh,300px);overflow:auto;' +
				'background:var(--bg-1,#0e1013);border:1px solid var(--bd,rgba(255,255,255,.07));border-radius:4px}' +
			'.pk_iq_row{position:relative;display:flex;align-items:center;gap:6px;padding:5px 8px;font-size:13px;' +
				'border-bottom:1px solid var(--bd-s,rgba(255,255,255,.04));cursor:grab}' +
			'.pk_iq_row:last-child{border-bottom:0}' +
			'.pk_iq_row:focus{background:var(--ac-soft,rgba(90,242,255,.12))}' +
			'.pk_iq_row:focus-visible{outline:2px solid var(--ac,#5af2ff);outline-offset:-2px}' +
			'.pk_iq_row.pk_iq_drag{opacity:.4}' +
			'.pk_iq_row.pk_iq_top:before,.pk_iq_row.pk_iq_bot:after{content:"";position:absolute;left:0;right:0;height:2px;background:var(--ac,#5af2ff)}' +
			'.pk_iq_row.pk_iq_top:before{top:-1px}.pk_iq_row.pk_iq_bot:after{bottom:-1px}' +
			'.pk_iq_grip{color:var(--fg-2,#6a7380);cursor:grab;user-select:none}' +
			'.pk_iq_no{min-width:1.6em;text-align:right;color:var(--fg-2,#6a7380);font-variant-numeric:tabular-nums}' +
			'.pk_iq_nm{flex:1 1 auto;min-width:0;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}' +
			'.pk_iq_sz{color:var(--fg-2,#6a7380);font-size:11px;white-space:nowrap}' +
			'.pk_iq_url{flex:1 1 auto;min-width:0;padding:2px 6px;font-size:12px;line-height:18px;font-family:inherit;color:var(--fg-0,#e8edf0);background:var(--bg-0,#0a0a0a);' +
				'border:1px solid var(--bd,rgba(255,255,255,.07));border-radius:4px;outline:0;cursor:text;text-overflow:ellipsis}' +
			'.pk_iq_url:focus{border-color:var(--ac,#5af2ff)}' +
			'.pk_iq_url.pk_iq_bad{border-color:var(--warn,#f5c542)}' +
			'.pk_iq_rb{flex:0 0 auto;width:24px;height:24px;padding:0;line-height:22px;text-align:center;font-size:12px;' +
				'color:var(--fg-1,#9aa3ad);background:transparent;border:1px solid transparent;border-radius:4px;cursor:pointer}' +
			'.pk_iq_rb:hover{color:var(--ac,#5af2ff);border-color:var(--bd,rgba(255,255,255,.07))}' +
			'.pk_iq_rb[disabled]{opacity:.25;pointer-events:none}' +
			'.pk_iq_empty{padding:14px;text-align:center;font-size:12px;color:var(--fg-2,#6a7380)}' +
			'.pk_iq_opts{margin:10px 0 0;font-size:13px}' +
			'.pk_iq_opts label{display:block;margin:5px 0}' +
			'.pk_iq_opts input[type=radio],.pk_iq_opts input[type=checkbox]{accent-color:var(--ac,#5af2ff);margin-right:6px}' +
			'.pk_iq_opts .pk_iq_gap{display:inline-block;width:64px;margin:0 6px}' +
			'.pk_iq_est{margin-top:8px;font-size:12px;color:var(--fg-1,#9aa3ad)}' +
			'.pk_iq_est.pk_iq_warn{color:var(--warn,#f5c542)}' +
			'.pk_iq_rep{margin:0;padding:0 0 0 18px;font-size:12px;max-height:40vh;overflow:auto}' +
			'.pk_iq_rep li{margin:3px 0;word-break:break-all}' +
			'.pk_iq_rep span{color:var(--fg-2,#6a7380)}' +
			'.pk_iq_report .pk_modal_cancel{display:none}';
		d.head.appendChild ( st );
	}

	/* ------------------------------------------------------------------ 本體 */

	function PKImportQ ( app ) {
		var q = this;
		var t = function ( k, v ) { return PKLocale.t ( k, v ); };

		var busy = false;
		var dlg = null;	/* 目前開著的匯入清單：{ add ( files ), modal } */
		var uid = 0;

		function eng () { return app.engine; }

		/* ---- 偏好（記在 localStorage，失敗就用預設） ---- */
		function readPrefs () {
			var p = { markers: true, gap: 0 };
			try {
				var s = JSON.parse ( w.localStorage.getItem ( PREF_KEY ) || '{}' );
				if (typeof s.markers === 'boolean') p.markers = s.markers;
				if (isFinite ( s.gap ) && s.gap >= 0 && s.gap <= 60) p.gap = +s.gap;
			} catch (e) {}
			return p;
		}
		function savePrefs ( p ) {
			try { w.localStorage.setItem ( PREF_KEY, JSON.stringify ( p ) ); } catch (e) {}
		}

		/* ---- 項目 ---- */
		function makeItem ( x ) {
			if (typeof x === 'string') {
				var u = x.trim ();
				if (!u) return null;
				return { id: ++uid, kind: 'url', url: u, name: eng ().NameFromURL ( u ) || u, size: 0 };
			}
			if (x && typeof x.name === 'string' && typeof x.size === 'number')
				return { id: ++uid, kind: 'file', file: x, name: stripExt ( x.name ), size: x.size };
			return null;
		}

		/* 把輸入整理成可匯入的項目；不支援的檔案計入 skipped */
		function normalize ( list ) {
			var items = [], skipped = 0;
			toArray ( list ).forEach ( function ( x ) {
				var it = makeItem ( x );
				if (!it) { ++skipped; return ; }
				if (it.kind === 'file' && !eng ().IsLoadableAudioFile ( it.file )) { ++skipped; return ; }
				items.push ( it );
			});
			return { items: items, skipped: skipped };
		}

		function estimateBytes ( items ) {
			var sum = 0;
			items.forEach ( function ( it ) { if (it.kind === 'file') sum += eng ().EstimateDecodedBytes ( it.file ); });
			return sum;
		}

		/* ---- 入口 ---- */
		q.Open = function ( list ) {
			if (!eng ()) return ;
			if (busy) { OneUp ( t('iq.busy'), 1200 ); return ; }

			var r = normalize ( list );
			if (!r.items.length) {
				if (toArray ( list ).length) app.fireEvent ('ShowError', t('engine.unsupported_type'));
				return ;
			}
			if (r.skipped) OneUp ( t('iq.skipped', { n: r.skipped }), 1600 );

			if (dlg) { dlg.add ( list ); return ; }

			if (r.items.length === 1) {	/* 單檔：走原本流程（含取代／附加詢問、記憶體警告） */
				var it = r.items[0];
				if (it.kind === 'url') eng ().LoadURL ( it.url );
				else eng ().LoadFile ({ files: [ it.file ] });
				return ;
			}
			showDialog ( r.items );
		};

		q.HandleDrop = function ( files ) {
			files = toArray ( files );
			if (!files.length || !eng ()) return false;
			/* 多軌模式有自己的拖放處理（依軌道位置），不在這裡搶 */
			if (app.multitrack && app.multitrack.IsOn && app.multitrack.IsOn ()) return false;
			if (/\.amss$/i.test ( files[0].name || '' ) && app.multitrack && app.multitrack.LoadSessionFiles &&
				app.multitrack.LoadSessionFiles ( files )) return true;
			/* 一個音訊檔都沒有（圖片、json…）就不接手，交還給原本的拖放處理 */
			if (!files.some ( function ( f ) { return eng ().IsLoadableAudioFile ( f ); })) return false;
			q.Open ( files );
			return true;
		};

		/* [新增] 拖入網址文字（從瀏覽器網址列、其他網頁的連結拖進來）：是網址清單就交給 OpenURLs，回傳 true；否則回傳 false */
		q.HandleDropText = function ( text ) {
			var urls = pastedURLs ( text );
			if (!urls.length || !eng ()) return false;
			q.OpenURLs ( urls );
			return true;
		};

		/* [新增] 直接按 Ctrl+V：
		 *   - 剪貼簿是網址（每行一個）→ 開啟（一個＝單檔流程，多個＝匯入清單）
		 *   - 剪貼簿是從檔案總管複製的音訊檔 → 同拖放
		 * 不攔的情況：正在輸入文字、有視窗開著、或編輯器自己的剪貼簿有內容（那是編輯器的「貼上」，Ctrl+V 本來就屬於它） */
		var has_clip = false;
		app.listenFor ('DidSetClipboard', function ( v ) { has_clip = !!v; });
		d.addEventListener ('paste', function ( e ) {
			var tg = e.target, cd = e.clipboardData;
			if (!cd || has_clip || !eng ()) return ;
			if (tg && (/INPUT|TEXTAREA|SELECT/.test ( tg.tagName ) || tg.isContentEditable)) return ;
			if (d.querySelector ('.pk_modal')) return ;
			var files = toArray ( cd.files || [] );
			if (files.length) {
				if (q.HandleDrop ( files )) e.preventDefault ();
				return ;
			}
			var urls = pastedURLs ( cd.getData ('text/plain') );
			if (!urls.length) return ;
			e.preventDefault ();
			q.OpenURLs ( urls );
		});

		q.HandleLaunch = function ( params ) {
			var handles = (params && params.files) || [];
			if (!handles.length) return Promise.resolve ();
			return Promise.all ( toArray ( handles ).map ( function ( h ) {
				return h.getFile ().catch ( function () { return null; });
			})).then ( function ( files ) {
				files = files.filter ( Boolean );
				if (files.length) q.Open ( files );
			});
		};

		/* [新增] 網址入口（檔案選單的多行貼上、index.html 的 ?url=a&url=b 都走這裡）。
		 * 只有一個網址＝原本單檔流程（含取代／附加詢問）；兩個以上＝匯入清單。
		 * 多軌模式：每個網址各加一條軌道（沿用多軌自己的 RequestLoadURL，與單一網址時相同）。 */
		q.OpenURLs = function ( urls ) {
			if (!eng ()) return ;
			var list = parseURLs ( urls ).urls;
			if (!list.length) return ;
			if (app.multitrack && app.multitrack.IsOn && app.multitrack.IsOn ()) {
				list.forEach ( function ( u ) { app.fireEvent ('RequestLoadURL', u); });
				return ;
			}
			q.Open ( list );
		};

		/* [新增] ---- 開新分頁（第四階段） ----
		 * 流程：原分頁 window.open ( 本頁?iq_tab=ID ) → 新分頁初始化完成後 postMessage 'pk_iq_ready' 給 opener
		 * → 原分頁收到後把項目 postMessage 過去（同源視窗之間 File 可以直接結構化複製）→ 新分頁 RunItems。
		 * ID 是亂數，且只接受來自該視窗（e.source）的訊息。 */
		var pending = {}, handoff_on = false;

		function targetOrigin () { return w.location.origin && w.location.origin !== 'null' ? w.location.origin : '*'; }

		function onHandoffMsg ( e ) {
			var m = e.data, p = m && m.type === 'pk_iq_ready' && pending[ m.id ];
			if (!p || e.source !== p.win) return ;
			clearTimeout ( p.timer );
			delete pending[ m.id ];
			try { p.win.postMessage ( p.payload, targetOrigin () ); }
			catch (x) { console.error ( x ); app.fireEvent ('ShowError', t('iq.newtab_fail')); }
		}

		q.OpenInNewTab = function ( items, opt ) {
			var id = Date.now ().toString (36) + Math.random ().toString (36).slice (2, 8);
			var win = null;
			try { win = w.open ( w.location.href.split (/[?#]/)[0] + '?iq_tab=' + id, '_blank' ); } catch (e) {}
			if (!win) return false;
			pending[ id ] = {
				win: win,
				payload: {
					type: 'pk_iq_items', id: id,
					items: items.map ( function ( it ) { return it.kind === 'url' ? { url: it.url } : { file: it.file }; }),
					opt: { markers: !!opt.markers, gap: opt.gap || 0 }
				},
				timer: setTimeout ( function () {
					delete pending[ id ];
					OneUp ( t('iq.newtab_fail'), 2400 );
				}, 60000 )
			};
			if (!handoff_on) { w.addEventListener ('message', onHandoffMsg); handoff_on = true; }
			return true;
		};

		/* 新分頁收到項目：整理後直接匯入（取代，新分頁本來就是空的） */
		q.RunItems = function ( list, opt ) {
			if (!eng () || busy) return ;
			var r = normalize ( list );
			if (!r.items.length) return ;
			opt = opt || {};
			run ( r.items, { mode: 'replace', markers: opt.markers !== false, gap: isFinite ( opt.gap ) && opt.gap >= 0 ? Math.min ( 60, +opt.gap ) : 0 });
		};

		/* ---- 匯入清單 ---- */
		/* init.mode：指定預設的匯入方式（失敗重試時要預設「附加」，免得蓋掉剛匯入成功的內容） */
		function showDialog ( items0, init ) {
			injectCSS ();
			app.fireEvent ('RequestPause');

			var list = items0.slice ();
			var prefs = readPrefs ();
			var had_audio = !!(eng ().is_ready && eng ().wavesurfer.backend.buffer);
			var memo = eng ().GetOpenModeMemo ();
			var mode = init && init.mode ? init.mode : (had_audio && memo === 'append' ? 'append' : 'replace');
			var drag_from = -1;
			var el = {};

			function el_ ( tag, cls, text ) {
				var e = d.createElement ( tag );
				if (cls) e.className = cls;
				if (text !== undefined) e.textContent = text;
				return e;
			}

			function setList ( next, focus_idx ) {
				list = next;
				render ();
				if (focus_idx !== undefined && el.rows[ focus_idx ]) el.rows[ focus_idx ].focus ();
			}
			function move ( from, to ) {
				if (from < 0 || from >= list.length) return ;
				to = Math.max (0, Math.min (list.length, to));
				var next = list.slice (), item = next.splice ( from, 1 )[0];
				if (to > from) --to;
				next.splice ( to, 0, item );
				setList ( next, to );
			}
			function remove ( i ) {
				var next = list.slice ();
				next.splice ( i, 1 );
				setList ( next, Math.min ( i, next.length - 1 ) );
			}

			function updateEst () {
				var bytes = estimateBytes ( list );
				var mb = Math.round ( bytes / 1048576 );
				var warn = bytes > eng ().LargeFileWarnBytes;
				/* [修改] 網址的大小要下載後才知道，沒有算進估計值：有網址時註明 */
				var urls = list.filter ( function ( it ) { return it.kind === 'url'; }).length;
				el.est.textContent = t('iq.est', { size: mb }) + (urls ? t('iq.est_url', { n: urls }) : '') + (warn ? t('iq.est_warn') : '');
				el.est.className = 'pk_iq_est' + (warn ? ' pk_iq_warn' : '');
				el.hint.textContent = t('iq.count', { n: list.length });
				var inact = !list.length;
				if (el.go) el.go.classList.toggle ('pk_inact', inact);
			}

			function mark ( row, pos ) {
				for (var i = 0; i < el.rows.length; ++i) el.rows[ i ].classList.remove ('pk_iq_top', 'pk_iq_bot');
				if (row) row.classList.add ( pos === 'bot' ? 'pk_iq_bot' : 'pk_iq_top' );
			}

			function render () {
				el.ul.textContent = '';
				el.rows = [];
				if (!list.length) {
					el.ul.appendChild ( el_ ('li', 'pk_iq_empty', t('iq.empty')) );
				}
				list.forEach ( function ( it, i ) {
					var li = el_ ('li', 'pk_iq_row');
					li.tabIndex = 0;
					li.draggable = true;
					li.appendChild ( el_ ('span', 'pk_iq_grip', '☰') );
					li.appendChild ( el_ ('span', 'pk_iq_no', String ( i + 1 )) );
					var nm;
					if (it.kind === 'url') {
						/* [修改] 網址項目：直接顯示成輸入框，可修改文字。標記名稱（檔名）跟著網址重新計算 */
						nm = d.createElement ('input');
						nm.type = 'text';
						nm.className = 'pk_iq_url' + (isLaunchURL ( it.url ) ? '' : ' pk_iq_bad');
						nm.value = it.url;
						nm.title = nm.placeholder = t('iq.url_edit');
						nm.setAttribute ('aria-label', t('iq.url_edit'));
						nm.setAttribute ('autocomplete', 'off');
						nm.setAttribute ('autocapitalize', 'off');
						nm.spellcheck = false;
						/* 整列是 draggable，Firefox 在可拖曳的列裡面無法用滑鼠選取輸入框文字：編輯期間先關掉 */
						nm.addEventListener ('mousedown', function () { li.draggable = false; });
						nm.addEventListener ('focus', function () { li.draggable = false; });
						nm.addEventListener ('blur', function () { li.draggable = true; });
						nm.addEventListener ('input', function () {
							it.url = nm.value.trim ();
							it.name = eng ().NameFromURL ( it.url ) || it.url;
							nm.classList.toggle ('pk_iq_bad', !isLaunchURL ( it.url ));
						});
					}
					else {
						nm = el_ ('span', 'pk_iq_nm', it.name );
						nm.title = it.file.name || '';
					}
					li.appendChild ( nm );
					if (it.size) li.appendChild ( el_ ('span', 'pk_iq_sz', fmtSize ( it.size )) );

					function btn ( txt, title, fn, off ) {
						var b = el_ ('button', 'pk_iq_rb', txt);
						b.type = 'button';
						b.tabIndex = -1;
						b.title = title;
						if (off) b.disabled = true;
						b.addEventListener ('click', function ( e ) { e.stopPropagation (); fn (); });
						li.appendChild ( b );
					}
					btn ('▲', t('iq.up'), function () { move ( i, i - 1 ); }, i === 0);
					btn ('▼', t('iq.down'), function () { move ( i, i + 2 ); }, i === list.length - 1);
					btn ('✕', t('iq.remove'), function () { remove ( i ); });

					li.addEventListener ('keydown', function ( e ) {
						var k = e.key, handled = true;
						/* [新增] 在網址輸入框裡打字：Delete／Backspace／方向鍵都是在編輯文字，不能當成清單操作。
						 * 只保留 Alt+↑↓ 換位置、Enter 回到這一列 */
						if (e.target && e.target.tagName === 'INPUT') {
							if (e.altKey && k === 'ArrowUp') move ( i, i - 1 );
							else if (e.altKey && k === 'ArrowDown') move ( i, i + 2 );
							else if ((k === 'Enter' || k === 'Escape') && !e.isComposing) li.focus ();	/* Esc：先離開輸入框，再按一次 Esc 才關掉整個視窗 */
							else return ;
							e.preventDefault (); e.stopPropagation ();
							return ;
						}
						if (k === 'ArrowUp' && (e.altKey || e.ctrlKey)) move ( i, i - 1 );
						else if (k === 'ArrowDown' && (e.altKey || e.ctrlKey)) move ( i, i + 2 );
						else if (k === 'ArrowUp') { if (el.rows[ i - 1 ]) el.rows[ i - 1 ].focus (); }
						else if (k === 'ArrowDown') { if (el.rows[ i + 1 ]) el.rows[ i + 1 ].focus (); }
						else if (k === 'Delete' || k === 'Backspace') remove ( i );
						else handled = false;
						if (handled) { e.preventDefault (); e.stopPropagation (); }
					});

					li.addEventListener ('dragstart', function ( e ) {
						drag_from = i;
						li.classList.add ('pk_iq_drag');
						if (e.dataTransfer) {
							e.dataTransfer.effectAllowed = 'move';
							try { e.dataTransfer.setData ('text/plain', 'pk_iq'); } catch (x) {}
						}
					});
					li.addEventListener ('dragend', function () {
						drag_from = -1;
						li.classList.remove ('pk_iq_drag');
						mark ( null );
					});
					li.addEventListener ('dragover', function ( e ) {
						if (drag_from < 0) return ;	/* 從外面拖進來的檔案交給 drag.js → HandleDrop */
						e.preventDefault ();
						e.stopPropagation ();
						var r = li.getBoundingClientRect ();
						mark ( li, e.clientY > r.top + r.height / 2 ? 'bot' : 'top' );
					});
					li.addEventListener ('drop', function ( e ) {
						if (drag_from < 0) return ;
						e.preventDefault ();
						e.stopPropagation ();
						var r = li.getBoundingClientRect ();
						var to = i + (e.clientY > r.top + r.height / 2 ? 1 : 0);
						var from = drag_from;
						drag_from = -1;
						mark ( null );
						move ( from, to );
					});

					el.ul.appendChild ( li );
					el.rows.push ( li );
				});
				updateEst ();
			}

			function addFiles ( more ) {
				var r = normalize ( more );
				if (r.skipped) OneUp ( t('iq.skipped', { n: r.skipped }), 1600 );
				if (r.items.length) setList ( list.concat ( r.items ) );
			}

			function go ( m ) {
				/* [新增] 網址被清成空白的項目不匯入 */
				var kept = list.filter ( function ( it ) { return it.kind !== 'url' || it.url; });
				if (kept.length !== list.length) setList ( kept );
				if (!list.length) return ;
				var gap = parseFloat ( el.gap.value );
				if (!isFinite ( gap ) || gap < 0) gap = 0;
				gap = Math.min ( 60, gap );
				prefs.markers = !!el.mk.checked;
				prefs.gap = gap;
				savePrefs ( prefs );

				var bytes = estimateBytes ( list );
				if (bytes > eng ().LargeFileWarnBytes &&
					!w.confirm ( t('iq.large_confirm', { n: list.length, size: Math.round ( bytes / 1048576 ) }) )) return ;

				var items = list.slice ();
				var opt = { mode: !had_audio ? 'replace' : (el.mode_tab && el.mode_tab.checked ? 'tab' : (el.mode_append && el.mode_append.checked ? 'append' : 'replace')),
					markers: prefs.markers, gap: gap };
				if (opt.mode === 'tab') {	/* [新增] 開新分頁：要在這個點擊動作裡同步呼叫 window.open，否則會被當成彈出視窗擋掉 */
					if (!q.OpenInNewTab ( items, opt )) { OneUp ( t('iq.newtab_blocked'), 2400 ); return ; }
					m.Destroy ();
					return ;
				}
				m.Destroy ();
				run ( items, opt );
			}

			new PKSimpleModal ({
				title : t('iq.title'),
				clss  : 'pk_modal_anim pk_fnt10 pk_iq',
				ondestroy : function () {
					dlg = null;
					app.ui.InteractionHandler.on = false;
					app.ui.KeyHandler.removeCallback ('modalIQ');
				},
				buttons : [
					{ title: t('iq.go'), clss: 'pk_modal_a_accpt', callback: function ( m ) { go ( m ); } }
				],
				setup : function ( m ) {
					app.ui.InteractionHandler.checkAndSet ('modal');
					app.ui.KeyHandler.addCallback ('modalIQ', function () { m.Destroy (); }, [27]);

					var body = m.el_body;
					el.hint = el_ ('p', 'pk_iq_hint');
					body.appendChild ( el.hint );

					var tools = el_ ('div', 'pk_iq_tools');
					function tool ( txt, fn ) {
						var b = el_ ('button', 'pk_iq_tb', txt);
						b.type = 'button';
						b.addEventListener ('click', fn);
						tools.appendChild ( b );
						return b;
					}
					tool ( t('iq.sort_name'), function () { setList ( naturalSort ( list ) ); });
					tool ( t('iq.reverse'), function () { setList ( list.slice ().reverse () ); });
					var pick = d.createElement ('input');
					pick.type = 'file';
					pick.multiple = true;
					pick.accept = 'audio/*,.mp3,.wav,.flac,.ogg,.oga,.opus,.m4a,.aac,.weba,.webm,.aif,.aiff';
					pick.style.display = 'none';
					pick.addEventListener ('change', function () { addFiles ( toArray ( pick.files ) ); pick.value = ''; });
					tools.appendChild ( pick );
					tool ( t('iq.add_files'), function () { pick.click (); });
					body.appendChild ( tools );

					el.ul = el_ ('ul', 'pk_iq_list');
					/* 清單內部的拖曳不要冒泡到 body（drag.js 會誤以為是在拖檔案進來） */
					[ 'dragenter', 'dragleave' ].forEach ( function ( n ) {
						el.ul.addEventListener ( n, function ( e ) { if (drag_from >= 0) e.stopPropagation (); });
					});
					body.appendChild ( el.ul );

					var opts = el_ ('div', 'pk_iq_opts');
					if (had_audio) {
						var l1 = el_ ('label'), l2 = el_ ('label'), l2b = el_ ('label');
						var r1 = d.createElement ('input'), r2 = d.createElement ('input'), r2b = d.createElement ('input');
						r1.type = r2.type = r2b.type = 'radio';
						r1.name = r2.name = r2b.name = 'pk_iq_mode';
						r1.checked = mode === 'replace';
						r2.checked = mode === 'append';
						l1.appendChild ( r1 ); l1.appendChild ( d.createTextNode ( t('iq.mode_replace') ) );
						l2.appendChild ( r2 ); l2.appendChild ( d.createTextNode ( t('iq.mode_append') ) );
						l2b.appendChild ( r2b ); l2b.appendChild ( d.createTextNode ( t('iq.mode_tab') ) );
						opts.appendChild ( l1 ); opts.appendChild ( l2 ); opts.appendChild ( l2b );
						el.mode_append = r2;
						el.mode_tab = r2b;
					}
					var l3 = el_ ('label');
					el.mk = d.createElement ('input');
					el.mk.type = 'checkbox';
					el.mk.checked = prefs.markers;
					l3.appendChild ( el.mk ); l3.appendChild ( d.createTextNode ( t('iq.markers') ) );
					opts.appendChild ( l3 );

					var l4 = el_ ('label');
					l4.appendChild ( d.createTextNode ( t('iq.gap') ) );
					el.gap = d.createElement ('input');
					el.gap.type = 'number';
					el.gap.className = 'pk_txt pk_iq_gap';
					el.gap.min = '0'; el.gap.max = '60'; el.gap.step = '0.1';
					el.gap.value = String ( prefs.gap );
					l4.appendChild ( el.gap );
					l4.appendChild ( d.createTextNode ( t('iq.sec') ) );
					opts.appendChild ( l4 );
					body.appendChild ( opts );

					el.est = el_ ('div', 'pk_iq_est');
					body.appendChild ( el.est );

					dlg = { add: addFiles, modal: m };
					render ();
					setTimeout ( function () { if (el.rows[0]) el.rows[0].focus (); }, 30 );
				}
			}).Show ();

			/* 「匯入」按鈕：setup 時 modal 還沒把按鈕建好，這裡補上參照（供清單為空時停用） */
			var m2 = dlg && dlg.modal;
			if (m2 && m2.els && m2.els.bottom) { el.go = m2.els.bottom[0]; updateEst (); }
		}

		/* ---- 解碼、串接、載入 ---- */
		var ctx_cache = {};
		function decodeCtx ( rate ) {
			if (!ctx_cache[ rate ]) {
				var C = w.OfflineAudioContext || w.webkitOfflineAudioContext;
				ctx_cache[ rate ] = new C ( 2, 2, rate );	/* decodeAudioData 會重取樣到這個 context 的取樣率 */
			}
			return ctx_cache[ rate ];
		}

		/* [新增] 依檔頭決定解碼取樣率：原檔取樣率不在 NATIVE_RATES、或這個瀏覽器建不出該取樣率的離線 context，都退回 DEFAULT_RATE */
		function pickRate ( ab ) {
			var r = chooseRate ( sniffRate ( ab ) );
			if (r === DEFAULT_RATE) return r;
			try { decodeCtx ( r ); return r; }
			catch (e) { return DEFAULT_RATE; }
		}

		function fail ( kind, extra ) {
			var e = new Error ( kind );
			e.kind = kind;
			if (extra) e.code = extra;
			return e;
		}

		/* [修改] 網址改成串流讀取，可回報已下載的位元組（onProgress ( got, total )；total 沒有就是 0）。
		 * 每個網址各用自己的 AbortController，存在 ctl.aborts，取消時一起中止（預抓下一個時會同時有兩個在下載） */
		function readItem ( it, ctl, onProgress ) {
			if (it.kind === 'url') {
				var ac = typeof w.AbortController === 'function' ? new w.AbortController () : null;
				if (ac) ctl.aborts.push ( ac );
				return w.fetch ( it.url, ac ? { signal: ac.signal } : {} ).then ( function ( res ) {
					if (!res.ok) throw fail ('http', res.status);
					if (!res.body || !res.body.getReader)	/* 舊瀏覽器：沒有串流就一次讀完，沒有位元組進度 */
						return res.arrayBuffer ().catch ( function () { throw fail ('net'); });
					var total = +res.headers.get ('content-length') || 0;
					var rd = res.body.getReader (), chunks = [], got = 0;
					return (function pump () {
						return rd.read ().then ( function ( r ) {
							if (r.done) {
								var out = new Uint8Array ( got ), pos = 0;
								chunks.forEach ( function ( c ) { out.set ( c, pos ); pos += c.length; });
								return out.buffer;
							}
							chunks.push ( r.value );
							got += r.value.length;
							onProgress && onProgress ( got, total );
							return pump ();
						});
					})().catch ( function ( e ) { throw e && e.kind ? e : fail ('net'); });
				}, function () { throw fail ('net'); });
			}
			var f = it.file;
			if (f.arrayBuffer) return f.arrayBuffer ().catch ( function () { throw fail ('read'); });
			return new Promise ( function ( ok, bad ) {
				var r = new FileReader ();
				r.onload = function () { ok ( r.result ); };
				r.onerror = function () { bad ( fail ('read') ); };
				r.readAsArrayBuffer ( f );
			});
		}

		function decode ( ab, rate ) {
			return new Promise ( function ( ok, bad ) {
				var done = false;
				function fin ( fn, v ) { if (!done) { done = true; fn ( v ); } }
				try {
					var p = decodeCtx ( rate ).decodeAudioData ( ab,
						function ( b ) { fin ( ok, b ); },
						function () { fin ( bad, fail ('decode') ); });
					if (p && p.then) p.then ( function ( b ) { fin ( ok, b ); }, function () { fin ( bad, fail ('decode') ); });
				}
				catch (e) { fin ( bad, fail ('decode') ); }
			});
		}

		function pause () { return new Promise ( function ( r ) { setTimeout ( r, 0 ); }); }

		function reason ( e ) {
			if (!e) return '';
			if (e.kind === 'http') return t('iq.err_http', { code: e.code });
			if (e.kind === 'net') return t('iq.err_net');
			if (e.kind === 'read') return t('iq.err_read');
			return t('iq.err_decode');
		}

		function run ( items, opt ) {
			var E = eng (), ws = E.wavesurfer;
			var base = opt.mode === 'append' && E.is_ready && ws.backend.buffer ? ws.backend.buffer : null;
			/* [修改] 附加：沿用現有音訊的取樣率。取代：先設 0，等第一個讀到的檔案依檔頭決定（pickRate）；之後每個檔都用同一個 */
			var rate = base ? base.sampleRate : 0;
			var ctl = { canceled: false, aborts: [] };
			var label = app.ui && app.ui.loaderEl ? app.ui.loaderEl.getElementsByTagName ('span')[0] : null;
			var label_old = label ? label.textContent : '';
			var loaded = false;
			var parts = [], failed = [];

			busy = true;
			app.fireEvent ('RequestPause');
			app.fireEvent ('WillDownloadFile');

			function onCancel () {
				ctl.canceled = true;
				ctl.aborts.forEach ( function ( ac ) { try { ac.abort (); } catch (e) {} });
			}
			app.listenFor ('RequestCancelModal', onCancel);

			function finish () {
				busy = false;
				if (label) label.textContent = label_old;
				app.stopListeningFor ('RequestCancelModal', onCancel);
				if (!loaded) {
					app.fireEvent ('RequestResize');
					setTimeout ( function () { app.fireEvent ('DidDownloadFile'); }, 12 );
				}
			}

			function step ( i ) {
				if (label) label.textContent = t('iq.progress', { i: i + 1, n: items.length, name: items[ i ].name });
				app.fireEvent ('DidProgressModal', Math.floor ( i / items.length * 100 ) );
			}

			function join () {
				if (label) label.textContent = t('iq.joining');
				app.fireEvent ('DidProgressModal', 100);
				var ac = ws.backend.ac;
				var chOut = base ? base.numberOfChannels : Math.min ( 2, Math.max.apply ( null, parts.map ( function ( p ) { return p.buf.numberOfChannels; }) ) );
				var gap = Math.round ( opt.gap * rate );
				var lay = planLayout ( parts.map ( function ( p ) { return p.buf.length; }), base ? base.length : 0, gap );
				var out = ac.createBuffer ( chOut, lay.total, rate );
				var c;

				if (base)
					for (c = 0; c < chOut; ++c) out.getChannelData ( c ).set ( base.getChannelData ( c ) );

				var marks = [];
				parts.forEach ( function ( p, k ) {
					var chans = mixChannels ( p.buf, chOut );
					for (c = 0; c < chOut; ++c) out.getChannelData ( c ).set ( chans[ c ], lay.starts[ k ] );
					marks.push ({ time: lay.starts[ k ] / rate, end: (lay.starts[ k ] + p.buf.length) / rate, name: p.item.name });
					p.buf = null;	/* 複製完就釋放，降低尖峰記憶體 */
				});

				var n = parts.length, first = parts[0].item;
				var o = {
					mode    : base ? 'append' : 'replace',
					old_dur : base ? base.duration : 0,
					markers : opt.markers && (n > 1 || base) ? marks : null,
					desc    : t( base ? 'iq.undo_append' : 'iq.undo_replace', { n: n })
				};
				if (!base) {
					o.name = n > 1 ? first.name + ' +' + (n - 1) : first.name;
					o.key  = n === 1 && first.kind === 'file' ?
						[ first.file.name, first.file.size, first.file.lastModified ].join ('|') :
						('multi|' + parts.map ( function ( p ) {
							return p.item.kind === 'file' ? p.item.file.name + ':' + p.item.file.size + ':' + p.item.file.lastModified : p.item.url;
						}).join ('|')).substr ( 0, 400 );
				}
				return { buffer: out, opts: o };
			}

			/* [新增] 讀取（下載）與解碼重疊：處理第 i 個時，下一個（i+1）已經開始讀。
			 * 解碼仍是一次一個；最多多留一個尚未解碼的原始資料在記憶體裡。
			 * reads[k] 永遠不會 reject（錯誤包成 { err }），輪到它時才丟出，避免「預抓的失敗在輪到之前變成未處理的 rejection」 */
			var reads = [], cur = 0, last_paint = 0;
			function onDl ( k, got, total ) {
				if (k !== cur || ctl.canceled) return ;
				var now = Date.now ();
				if (now - last_paint < 120) return ;
				last_paint = now;
				if (label) label.textContent = t('iq.progress_dl', { i: k + 1, n: items.length, name: items[ k ].name,
					size: fmtSize ( got ) + (total ? ' / ' + fmtSize ( total ) : '') });
				app.fireEvent ('DidProgressModal', Math.floor ( (k + (total ? Math.min ( 1, got / total ) : 0)) / items.length * 100 ) );
			}
			function startRead ( k ) {
				if (k >= items.length || reads[ k ]) return ;
				reads[ k ] = readItem ( items[ k ], ctl, function ( got, total ) { onDl ( k, got, total ); })
					.then ( function ( ab ) { return { ab: ab }; }, function ( e ) { return { err: e }; });
			}

			var chain = Promise.resolve ();
			items.forEach ( function ( it, i ) {
				chain = chain.then ( function () {
					if (ctl.canceled) return ;
					cur = i;
					step ( i );
					startRead ( i );
					startRead ( i + 1 );
					return pause ().then ( function () { return reads[ i ]; }).then ( function ( r ) {
						reads[ i ] = null;
						if (ctl.canceled) return ;
						if (r.err) throw r.err;
						step ( i );	/* 讀完了：標籤從「下載中」改回「解碼中」 */
						if (parts.length === 0 && !base && it.kind === 'file') { try { E.ID3 ( r.ab ); } catch (e) {} }	/* 第一個檔的標籤（附加時不動） */
						if (!rate) rate = pickRate ( r.ab );	/* [新增] 還沒決定取樣率：這是第一個讀到的檔案 */
						return decode ( r.ab, rate );
					}).then ( function ( buf ) {
						if (ctl.canceled || !buf) return ;
						if (!buf.length) throw fail ('decode');
						parts.push ({ item: it, buf: buf });
					}).catch ( function ( e ) {
						if (ctl.canceled) return ;
						it.err = e;
						failed.push ( it );
						if (!base && !parts.length) rate = 0;	/* [新增] 第一個檔案失敗：取樣率改由下一個檔案決定 */
					});
				});
			});

			return chain.then ( pause ).then ( function () {
				if (ctl.canceled) {
					OneUp ( t('mt.msg.canceled'), 1350 );
					return ;
				}
				var ok_count = parts.length;
				if (!ok_count) {
					app.fireEvent ('ShowError', t('iq.all_failed'));
					showReport ( 0, failed, false );
					return ;
				}
				var res;
				try { res = join (); }
				catch (e) {
					console.error ( e );
					app.fireEvent ('ShowError', t('iq.err_memory'));
					return ;
				}
				/* 在這個時間點再確認一次：附加的基準必須還是同一份音訊（解碼期間若被改掉就當作取代） */
				if (base && ws.backend.buffer !== base) res.opts.mode = 'replace';
				loaded = !!E.LoadBuffer ( res.buffer, res.opts );
				if (failed.length) showReport ( ok_count, failed, loaded );
			}).catch ( function ( e ) {
				console.error ( e );
				app.fireEvent ('ShowError', String ( e && e.message || e ) );
			}).then ( finish );
		}

		/* loaded：這一批有沒有成功載入東西。有的話，重試要「附加」在它後面 */
		function showReport ( ok_count, failed, loaded ) {
			injectCSS ();
			var body = '<p style="margin:0 0 8px;font-size:13px">' +
				esc2 ( t('iq.report_head', { ok: ok_count, fail: failed.length }) ) + '</p><ul class="pk_iq_rep">';
			failed.forEach ( function ( it ) {
				/* [修改] 網址項目顯示完整網址（只有檔名容易分不出是哪一個） */
				body += '<li>' + esc2 ( it.kind === 'url' ? it.url : it.name ) + ' <span>— ' + esc2 ( reason ( it.err ) ) + '</span></li>';
			});
			body += '</ul>';
			new PKSimpleModal ({
				title : t('iq.report_title'),
				clss  : 'pk_modal_anim pk_fnt10 pk_iq_report',
				ondestroy : function () {
					app.ui.InteractionHandler.on = false;
					app.ui.KeyHandler.removeCallback ('modalIQRep');
				},
				/* [新增] 「編輯並重試」：把失敗的項目放回匯入清單（網址可以直接修正），再按匯入即可 */
				buttons : [
					{ title: t('iq.retry'), clss: 'pk_modal_a_accpt', callback: function ( m ) {
						m.Destroy ();
						failed.forEach ( function ( it ) { delete it.err; });
						showDialog ( failed.slice (), loaded ? { mode: 'append' } : null );
					} },
					{ title: t('iq.ok'), clss: 'pk_modal_a_accpt', callback: function ( m ) { m.Destroy (); } }
				],
				body : body,
				setup : function ( m ) {
					app.ui.InteractionHandler.checkAndSet ('modal');
					app.ui.KeyHandler.addCallback ('modalIQRep', function () { m.Destroy (); }, [27, 13]);
				}
			}).Show ();
		}
		function esc2 ( s ) { return app.escapeHtml ( s ); }
	}

	PKImportQ.util = {
		naturalSort : naturalSort,
		planLayout  : planLayout,
		mixChannels : mixChannels,
		parseURLs   : parseURLs,
		webURL      : webURL,
		pastedURLs  : pastedURLs,
		isLaunchURL : isLaunchURL,
		fmtSize     : fmtSize,
		sniffRate   : sniffRate,	/* [新增] */
		chooseRate  : chooseRate	/* [新增] */
	};

	PKAE._deps.importq = PKImportQ;

	/* ------------------------------------------------------------------ PWA 從作業系統開啟（可一次多個檔案）
	 * launchQueue 只允許一個 consumer。這裡先註冊，並接管之後 index.html 才呼叫的 setConsumer
	 * （原本的 consumer 只取 files[0]）。index.html 裡舊的 launchQueue 區塊之後可以刪除。 */
	(function hookLaunchQueue () {
		var lq = w.launchQueue;
		if (!lq || typeof lq.setConsumer !== 'function' || lq.__pk_iq) return ;
		lq.__pk_iq = true;

		var real = lq.setConsumer.bind ( lq );
		lq.setConsumer = function () { /* 舊的 consumer 不再使用 */ };

		real ( function ( params ) {
			if (!params || !params.files || !params.files.length) return ;
			var tries = 0;
			(function wait () {	/* 程式還在初始化時，等引擎與匯入佇列就緒 */
				var app = w.PKAudioEditor;
				if (app && app.importq && app.engine && app.ui) { app.importq.HandleLaunch ( params ); return ; }
				if (++tries < 100) setTimeout ( wait, 200 );
			})();
		});
	})();

	/* [新增] 新分頁端（第四階段）：網址帶 ?iq_tab=ID 且有 opener 時，初始化完成後通知原分頁，等它把項目送過來 */
	(function acceptHandoff () {
		var m = /[?&]iq_tab=([\w-]+)/.exec ( w.location.search );
		if (!m || !w.opener) return ;
		var id = m[1];
		/* 把參數從網址列拿掉，重新整理時就不會再等一次 */
		try { w.history.replaceState ( null, '', w.location.href.replace ( /([?&])iq_tab=[\w-]+&?/, '$1' ).replace ( /[?&]$/, '' ) ); } catch (e) {}
		var tries = 0;
		(function wait () {
			var app = w.PKAudioEditor;
			if (app && app.importq && app.engine && app.ui) {
				w.addEventListener ('message', function onItems ( e ) {
					var msg = e.data;
					if (e.source !== w.opener || !msg || msg.type !== 'pk_iq_items' || msg.id !== id || !msg.items) return ;
					w.removeEventListener ('message', onItems);
					app.importq.RunItems ( msg.items.map ( function ( x ) { return x.url || x.file; }), msg.opt );
				});
				try { w.opener.postMessage ({ type: 'pk_iq_ready', id: id }, '*'); } catch (e) {}
				return ;
			}
			if (++tries < 150) setTimeout ( wait, 200 );
		})();
	})();

})( window, document, window.PKAudioEditor );
