/* Soundit 聲調資料層（純資料與純函式，無 DOM 相依；可在瀏覽器或 Node 載入）
 *
 * 載入：瀏覽器 <script src="tone-systems.js">（要在 tone-change.js 之前）→ window.PKToneSystems；Node：require 取得同一物件。
 *
 * 結構：語言 → 腔調 → 聲調。聲調以五度標記法（Chao）記調值，例如 "55"、"214"。
 *   tone = { id, chao, zh, en, short?, src?, variant?, alt? }
 *     short    入聲／短調。音高目標與同調值的舒聲相同；音長與塞音韻尾不會被改（見限制）。
 *     src:false  只能當目標，不會被偵測成「原聲調」（如華語輕聲）。
 *     variant  連讀變調等「表面調值」，不是本調（如詔安客語變調出現的中平 33）。
 *     alt      同一個聲調的其他常見調值（例如 24 或 33），偵測時一併比對。
 *
 * [v8] 額外聲調：每個腔調的 tones 只放「預設（基本）聲調」。該語言還可能用到、但不是本調的調值（例如詔安客語連讀時的中平 33）
 *   放在 accent.extras（預設可加入的清單），由使用者決定要不要加入；也可加入通用調值或自訂五度調值（id＝'x' + 調值，如 'x35'）。
 *   加入後 tones ( lang, acc ) 會把它們接在基本聲調後面（物件帶 extra: true、variant: true），
 *   所以選單、偵測候選都會自動包含。加入哪些由呼叫端決定並自行保存（見 setAdded / added）。
 *
 * 另有「通用調值」GENERIC：與語言無關的常用調值（高平 55、全降 51、中升 34…），任何語言都能當目標。
 *
 * [v9] 音檔類型：呼叫端分「自然語流（已是變調後的表面調值，預設）」與「單字本調」。
 *   前者候選＝基本＋額外聲調；後者 candidates ( lang, acc, { baseOnly: true } ) 只比對基本聲調。
 *   變調規則（本調 → 環境下的表面調值）仍未建模，之後另做；它只會用在「單字本調」的音檔上。
 *
 * 限制：連讀變調的規則本身沒有建模（哪個本調在什麼環境變成哪個調值）。有連讀變調的腔調（如和樂、詔安）
 * 請依「實際聽到的調值」選原聲調；accent.note 會在對話框提醒。
 */
(function ( root ) {
	'use strict';

	/* ---------- 調值字串 ---------- */
	function parseChao ( s ) {
		var a = [], i;
		s = String ( s == null ? '' : s ).replace ( /[^1-5]/g, '' );
		for (i = 0; i < s.length; ++i) a.push ( +s[ i ] );
		return a.length >= 1 ? ( a.length === 1 ? [ a[ 0 ], a[ 0 ] ] : a ) : null;
	}

	/* ---------- 資料 ---------- */
	/* rows: [ 後綴, 中文名, 英文名, 調值, 旗標（'s' 短調、'n' 不偵測、'v' 變調表面調值）, 其他調值陣列 ] */
	function mk ( prefix, rows ) {
		return rows.map ( function ( r ) {
			var f = r[ 4 ] || '', t = { id: prefix + r[ 0 ], chao: r[ 3 ], zh: r[ 1 ], en: r[ 2 ] };
			if (f.indexOf ( 's' ) >= 0) t.short = true;
			if (f.indexOf ( 'n' ) >= 0) t.src = false;
			if (f.indexOf ( 'v' ) >= 0) t.variant = true;
			if (f.indexOf ( 'd' ) >= 0) t.dflt = true;          /* [v9] 額外聲調裡「預設就列入」的（如詔安的變調中平 33） */
			if (r[ 5 ]) t.alt = r[ 5 ];
			return t;
		});
	}

	var GENERIC = mk ( 'g', [
		[ '55',  '高平', 'High level', '55' ],
		[ '33',  '中平', 'Mid level', '33' ],
		[ '11',  '低平', 'Low level', '11' ],
		[ '53',  '高降', 'High falling', '53' ],
		[ '51',  '全降', 'Full falling', '51' ],
		[ '31',  '中降', 'Mid falling', '31' ],
		[ '34',  '中升', 'Mid rising', '34' ],
		[ '24',  '升調', 'Rising', '24' ],
		[ '13',  '低升', 'Low rising', '13' ],
		[ '214', '降升', 'Dipping', '214' ],
		[ '131', '升降', 'Rise-fall', '131' ],
		[ '5',   '高短', 'High short', '5', 's' ],
		[ '3',   '中短', 'Mid short', '3', 's' ],
		[ '1',   '低短', 'Low short', '1', 's' ]
	]);

	var NOTE_SANDHI = {
		zh: '有連讀變調：請依實際聽到的調值選「原聲調」。',
		en: 'Tone sandhi: pick the tone you actually hear.'
	};

	var LANGS = {
		mandarin: { zh: '華語', en: 'Mandarin', accents: {
			std: { zh: '標準華語', en: 'Standard Mandarin', tones: mk ( 't', [
				[ '1', '一聲', 'Tone 1', '55' ],
				[ '2', '二聲', 'Tone 2', '35' ],
				[ '3', '三聲', 'Tone 3', '214' ],
				[ '4', '四聲', 'Tone 4', '51' ],
				[ '0', '輕聲', 'Neutral', '33', 'n' ]
			]) }
		}, order: [ 'std' ] },

		hakka: { zh: '客語', en: 'Hakka', accents: {
			sixian: { zh: '四縣', en: 'Sixian', tones: mk ( 'sx', [
				[ 'yp', '陰平', 'Yin level', '24' ], [ 'yg', '陽平', 'Yang level', '11' ],
				[ 'sh', '上聲', 'Rising', '31' ], [ 'qu', '去聲', 'Departing', '55' ],
				[ 'yr', '陰入', 'Yin entering', '2', 's' ], [ 'gr', '陽入', 'Yang entering', '5', 's' ]
			]) },
			hailu: { zh: '海陸', en: 'Hailu', tones: mk ( 'hl', [
				[ 'yp', '陰平', 'Yin level', '53' ], [ 'yg', '陽平', 'Yang level', '55' ],
				[ 'sh', '上聲', 'Rising', '24' ], [ 'yq', '陰去', 'Yin departing', '11' ],
				[ 'gq', '陽去', 'Yang departing', '33' ],
				[ 'yr', '陰入', 'Yin entering', '5', 's' ], [ 'gr', '陽入', 'Yang entering', '2', 's' ]
			]) },
			dapu: { zh: '大埔', en: 'Dapu', tones: mk ( 'dp', [
				[ 'yp', '陰平', 'Yin level', '33', '', [ '35' ] ], [ 'yg', '陽平', 'Yang level', '113' ],
				[ 'sh', '上聲', 'Rising', '31' ], [ 'qu', '去聲', 'Departing', '53' ],
				[ 'yr', '陰入', 'Yin entering', '21', 's' ], [ 'gr', '陽入', 'Yang entering', '54', 's' ]
			]) },
			raoping: { zh: '饒平', en: 'Raoping', tones: mk ( 'rp', [
				[ 'yp', '陰平', 'Yin level', '11' ], [ 'yg', '陽平', 'Yang level', '55' ],
				[ 'sh', '上聲', 'Rising', '53' ], [ 'qu', '去聲', 'Departing', '24' ],
				[ 'yr', '陰入', 'Yin entering', '2', 's' ], [ 'gr', '陽入', 'Yang entering', '5', 's' ]
			]) },
			zhaoan: { zh: '詔安', en: 'Zhaoan', note: NOTE_SANDHI, tones: mk ( 'za', [
				[ 'yp', '陰平', 'Yin level', '11' ], [ 'yg', '陽平', 'Yang level', '53' ],
				[ 'sh', '上聲', 'Rising', '31' ], [ 'qu', '去聲', 'Departing', '55' ],
				[ 'yr', '陰入', 'Yin entering', '24' ], [ 'gr', '陽入', 'Yang entering', '53' ]
			]),
				/* [v8] 基本聲調以外、可由使用者加入的調值（id 沿用 zas33，舊的學習資料仍對得上） */
				extras: mk ( 'za', [
					[ 's33', '變調（中平）', 'Sandhi (mid level)', '33', 'vd' ],
					[ 's5', '變調（高短）', 'Sandhi (high short)', '5', 'vsd' ],
					[ 's3', '變調（中短）', 'Sandhi (mid short)', '3', 'vsd' ],
					[ 's1', '變調（低短）', 'Sandhi (low short)', '1', 'vsd' ]
				]) },
			nansixian: { zh: '南四縣', en: 'South Sixian', tones: mk ( 'nx', [
				[ 'yp', '陰平', 'Yin level', '24', '', [ '33' ] ], [ 'yg', '陽平', 'Yang level', '11' ],
				[ 'sh', '上聲', 'Rising', '31' ], [ 'qu', '去聲', 'Departing', '55' ],
				[ 'yr', '陰入', 'Yin entering', '2', 's' ], [ 'gr', '陽入', 'Yang entering', '5', 's' ]
			]) }
		}, order: [ 'sixian', 'hailu', 'dapu', 'raoping', 'zhaoan', 'nansixian' ] },

		hokkien: { zh: '和樂', en: 'Hokkien', accents: {
			taiwan: { zh: '臺灣通行腔', en: 'Taiwan common', note: NOTE_SANDHI, tones: mk ( 'tw', [
				[ '1', '第1聲 陰平', 'Tone 1 (yin level)', '55' ],
				[ '2', '第2聲 陰上', 'Tone 2 (yin rising)', '51' ],
				[ '3', '第3聲 陰去', 'Tone 3 (yin departing)', '21', '', [ '11' ] ],
				[ '4', '第4聲 陰入', 'Tone 4 (yin entering)', '3', 's', [ '32' ] ],
				[ '5', '第5聲 陽平', 'Tone 5 (yang level)', '24', '', [ '13' ] ],
				[ '7', '第7聲 陽去', 'Tone 7 (yang departing)', '33' ],
				[ '8', '第8聲 陽入', 'Tone 8 (yang entering)', '5', 's', [ '4' ] ]
			]) }
		}, order: [ 'taiwan' ] }
	};
	var LANG_ORDER = [ 'mandarin', 'hakka', 'hokkien' ];

	/* ---------- 查表 ---------- */
	var INDEX = null;
	function index () {
		if (INDEX) return INDEX;
		INDEX = {};
		GENERIC.forEach ( function ( t ) { INDEX[ t.id ] = t; } );
		LANG_ORDER.forEach ( function ( l ) {
			var A = LANGS[ l ].accents;
			LANGS[ l ].order.forEach ( function ( a ) {
				A[ a ].id = a;
				A[ a ].tones.forEach ( function ( t ) { t.lang = l; t.accent = a; INDEX[ t.id ] = t; } );
				( A[ a ].extras || [] ).forEach ( function ( t ) { t.lang = l; t.accent = a; t.extra = true; INDEX[ t.id ] = t; } );
			});
			LANGS[ l ].id = l;
		});
		return INDEX;
	}

	function find ( id ) { return index ()[ id ] || null; }
	function accents ( lang ) {
		index ();
		var L = LANGS[ lang ];
		return L ? L.order.map ( function ( a ) { return L.accents[ a ]; } ) : [];
	}
	function accent ( lang, acc ) { index (); return LANGS[ lang ] && LANGS[ lang ].accents[ acc ] || null; }
	/* [修改] 基本聲調 ＋ 使用者加入的額外聲調（每次回傳新陣列，呼叫端可放心 filter） */
	function tones ( lang, acc ) { var a = accent ( lang, acc ); return a ? a.tones.concat ( ADDED[ lang + '|' + acc ] || [] ) : []; }
	/* [新增] 只有該腔調預設的基本聲調（不含額外） */
	function baseTones ( lang, acc ) { var a = accent ( lang, acc ); return a ? a.tones.slice () : []; }

	/* ---------- [新增] 額外聲調 ---------- */
	var ADDED = {};        /* 'lang|acc' → [ 聲調物件 ]，依加入順序 */

	/* 該腔調預設可加入的額外聲調（如詔安的變調中平 33）；沒有就回空陣列 */
	function extras ( lang, acc ) { var a = accent ( lang, acc ); return a && a.extras ? a.extras.slice () : []; }

	/* 自訂五度調值 → 聲調物件（id＝'x' + 調值，同一調值共用同一個物件）；去掉 1~5 以外的字元，最多 4 碼，不合法回 null */
	function customTone ( chao ) {
		var c = String ( chao == null ? '' : chao ).replace ( /[^1-5]/g, '' );
		if (!c || c.length > 4) return null;
		index ();
		var id = 'x' + c, t = INDEX[ id ];
		if (!t) {
			t = { id: id, chao: c, zh: '自訂 ' + c, en: 'Custom ' + c, variant: true, extra: true };
			if (c.length === 1) t.short = true;
			INDEX[ id ] = t;
		}
		return t;
	}
	/* 加入用的字串 → 聲調物件：該腔調的預設額外聲調 id、通用調值 id（'g55'…）、自訂（'x35'）。認不得回 null */
	function resolveExtra ( lang, acc, spec ) {
		index ();
		spec = String ( spec == null ? '' : spec );
		var t = INDEX[ spec ] || null, k, c;
		if (t && t.extra && t.lang === lang && t.accent === acc) return t;
		if (/^x[1-5]{1,4}$/.test ( spec )) return customTone ( spec.slice ( 1 ) );
		for (k = 0; k < GENERIC.length; ++k) if (GENERIC[ k ].id === spec) {
			c = {};                                                /* 複製：不動到共用的 GENERIC 物件 */
			for (var key in GENERIC[ k ]) c[ key ] = GENERIC[ k ][ key ];
			c.extra = true; c.variant = true;
			return c;
		}
		return null;
	}
	/* 設定某腔調「已加入的額外聲調」（整份取代）。與基本聲調調值完全相同、或重複的會略過。回傳實際生效的清單 */
	function setAdded ( lang, acc, specs ) {
		var a = accent ( lang, acc ), out = [], seen = {};
		if (!a) return out;
		( specs || [] ).forEach ( function ( sp ) {
			var t = resolveExtra ( lang, acc, sp );
			if (!t || seen[ t.id ]) return ;
			if (a.tones.some ( function ( b ) { return b.chao === t.chao && !!b.short === !!t.short; } )) return ;
			seen[ t.id ] = 1; out.push ( t );
		});
		ADDED[ lang + '|' + acc ] = out;
		return out.slice ();
	}
	/* 已加入的額外聲調 */
	function added ( lang, acc ) { return ( ADDED[ lang + '|' + acc ] || [] ).slice (); }

	/* 預設語言／腔調：跟著介面語言（kasu → 客語詔安；其他 → 華語；客語預設四縣） */
	function defaultLang ( uiLang ) { return uiLang === 'kasu' ? 'hakka' : 'mandarin'; }
	function defaultAccent ( lang, uiLang ) {
		if (lang === 'hakka') return uiLang === 'kasu' ? 'zhaoan' : 'sixian';
		return LANGS[ lang ] ? LANGS[ lang ].order[ 0 ] : null;
	}

	/* 聲調 id 或五度字串（"51"）→ 五度陣列；認不得回 null */
	function chaoOf ( x ) {
		if (x == null || x === '') return null;
		if (/^[1-5]+$/.test ( x )) return parseChao ( x );
		var t = find ( x );
		return t ? parseChao ( t.chao ) : null;
	}
	function isShort ( x ) { var t = typeof x === 'string' ? find ( x ) : null; return !!( t && t.short ); }
	/* 兩個聲調（id 或五度字串）是不是同一條音高曲線（短調與同調值的舒聲視為同曲線） */
	function sameTone ( a, b ) {
		var x = chaoOf ( a ), y = chaoOf ( b );
		if (!x || !y) return a === b;
		if (x.length !== y.length) return false;
		for (var i = 0; i < x.length; ++i) if (x[ i ] !== y[ i ]) return false;
		return true;
	}
	/* 顯示名稱：「陰平（24）」「陰入（2 短）」 */
	function label ( t, en ) {
		return ( en ? t.en : t.zh ) + ' (' + t.chao + ( t.short ? ( en ? ', short' : ' 短' ) : '' ) + ')';
	}
	function note ( lang, acc, en ) { var a = accent ( lang, acc ); return a && a.note ? ( en ? a.note.en : a.note.zh ) : ''; }

	/* [v9] 預設列入的額外聲調（使用者從未調整過時使用；詔安 → 33） */
	function defaultExtras ( lang, acc ) { return extras ( lang, acc ).filter ( function ( t ) { return t.dflt; } ); }

	/* 偵測用候選：accent 內可偵測的聲調，alt 調值展開成額外候選（仍指回同一個聲調 id）。
	 * [v9] opts.baseOnly＝true（音檔是「單字本調」）：只比對基本聲調，不含變調等額外聲調 */
	function candidates ( lang, acc, opts ) {
		var out = [];
		( opts && opts.baseOnly ? baseTones ( lang, acc ) : tones ( lang, acc ) ).forEach ( function ( t ) {
			if (t.src === false) return ;
			out.push ({ id: t.id, chao: t.chao, short: !!t.short });
			( t.alt || [] ).forEach ( function ( c ) { out.push ({ id: t.id, chao: c, short: !!t.short }); });
		});
		return out;
	}

	var api = {
		parseChao: parseChao, GENERIC: GENERIC, LANGS: LANGS, LANG_ORDER: LANG_ORDER,
		find: find, accents: accents, accent: accent, tones: tones, baseTones: baseTones, candidates: candidates,
		extras: extras, defaultExtras: defaultExtras, added: added, setAdded: setAdded, customTone: customTone,
		defaultLang: defaultLang, defaultAccent: defaultAccent,
		chaoOf: chaoOf, isShort: isShort, sameTone: sameTone, label: label, note: note
	};
	index ();
	root.PKToneSystems = api;
	if (typeof module !== 'undefined' && module.exports) module.exports = api;
})( typeof window !== 'undefined' ? window : this );
