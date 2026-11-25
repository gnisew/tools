/* Soundit 語言核心
 * 語言內容放在 lang-*.js，各檔以 PKLocale.register (代碼, 字串表, 選項) 登錄。
 * 選項：
 *   name     選單顯示的語言名稱（建議用該語言自稱）
 *   fallback 缺少字串時優先使用的語言（最後一律回到 en）
 *   match    瀏覽器語言的前綴，用於自動偵測（例如 ['zh']）
 */
(function ( w ) {
	'use strict';

	var DEFAULT_LANG = 'en';
	var STORAGE_KEY = 'pk_lang';

	var langs = {};
	var order = [];
	var _lang = null;

	function register ( id, strings, opts ) {
		opts = opts || {};
		if (!langs[id]) order.push (id);
		langs[id] = {
			strings: strings || {},
			name: opts.name || id,
			fallback: opts.fallback || null,
			match: opts.match || []
		};
	}

	function detect () {
		var navs = w.navigator.languages && w.navigator.languages.length ?
			w.navigator.languages : [w.navigator.language || ''];
		var i, j, k, nav, id;

		for (i = 0; i < navs.length; ++i) {
			nav = String (navs[i]).toLowerCase ();
			if (!nav) continue;

			for (j = 0; j < order.length; ++j) {
				id = order[j];
				if (id.toLowerCase () === nav) return id;
			}
			for (j = 0; j < order.length; ++j) {
				id = order[j];
				for (k = 0; k < langs[id].match.length; ++k) {
					if (nav.indexOf (langs[id].match[k]) === 0) return id;
				}
			}
		}
		return DEFAULT_LANG;
	}

	function getLang () {
		if (_lang && langs[_lang]) return _lang;

		var saved = null;
		try {
			saved = w.localStorage && w.localStorage.getItem (STORAGE_KEY);
		} catch (e) {}

		_lang = (saved && langs[saved]) ? saved : detect ();
		return _lang;
	}

	function setLang ( lang ) {
		if (!langs[lang]) return;
		_lang = lang;
		try {
			w.localStorage && w.localStorage.setItem (STORAGE_KEY, lang);
		} catch (e) {}
	}

	function fill ( str, vars ) {
		if (!vars) return str;
		return str.replace (/\{(\w+)\}/g, function ( m, name ) {
			return vars[name] === undefined ? m : vars[name];
		});
	}

	/* t (key) 取得字串；t (key, {name: 值}) 會把字串中的 {name} 換成對應的值 */
	function t ( key, vars ) {
		var id = getLang ();
		var seen = {};

		while (id && langs[id] && !seen[id]) {
			seen[id] = 1;
			if (langs[id].strings[key]) return fill (langs[id].strings[key], vars);
			id = langs[id].fallback || (id !== DEFAULT_LANG ? DEFAULT_LANG : null);
		}
		return key;
	}

	function getAvailableLangs () {
		return order.map (function ( id ) {
			return { id: id, name: langs[id].name };
		});
	}

	w.PKLocale = {
		t: t,
		register: register,
		getLang: getLang,
		setLang: setLang,
		getAvailableLangs: getAvailableLangs
	};

})( window );


