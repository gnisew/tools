/* Soundit 外觀：深色 / 淺色 / 跟隨系統，與色盲友善配色
 *
 * 運作方式：在 <html> 上設定屬性，由 main.css 末端的「外觀」區塊依屬性換色。
 *   data-theme="dark" | "light"   （自動模式會依系統偏好解析成其中之一）
 *   data-cb="1"                    色盲友善配色（Okabe-Ito 色盤，避開紅綠對比）
 * 儲存：localStorage 'pk_theme'（auto / dark / light）、'pk_cb'（0 / 1）。
 * 必須在 main.css 之前載入，避免開啟時閃一下錯誤的顏色。
 */
(function ( w, d ) {
	'use strict';

	var KEY_THEME = 'pk_theme', KEY_CB = 'pk_cb';
	var mql = w.matchMedia ? w.matchMedia ('(prefers-color-scheme: light)') : null;
	var mode = 'auto', cb = false, listeners = [];

	function read ( k ) { try { return w.localStorage.getItem ( k ); } catch (e) { return null; } }
	function write ( k, v ) { try { w.localStorage.setItem ( k, v ); } catch (e) {} }

	var saved = read ( KEY_THEME );
	if (saved === 'dark' || saved === 'light') mode = saved;
	cb = read ( KEY_CB ) === '1';

	function resolved () {
		return mode === 'auto' ? (mql && mql.matches ? 'light' : 'dark') : mode;
	}

	function state () { return { mode: mode, cb: cb, resolved: resolved () }; }

	/* 畫布（波形、刻度尺、多軌片段、錄音電平…）不能用 CSS 變數，所以在這裡集中管理畫布色票。
	 * 取用方式：window.PKPal () 回傳目前主題的色票；主題切換時由各模組透過 PKTheme.onChange 重畫。
	 * 深色＝原本的顏色（一個值都沒動）；淺色＝淺底深線，和 main.css 的淺色變數同一組色系。 */
	var PAL = {
		dark: {
			bg:'#000', wave:'#99c2c6', off:'#505253', limit:'#fff',
			timeBg:'#000', timeFg:'#fff',
			rulerBg:'#111', rulerFg:'#aaa',
			meterBg:'#000', meterTick:'#ffffff', meterGrid:'rgba(255,255,255,0.28)', meterText:'#cfd8dc',
			clip:[
				['#071010', '#88c7c1', '#2f7b75'],
				['#0b1013', '#7fb5b6', '#336e70'],
				['#0d100d', '#83b0a4', '#3d6c62'],
				['#100f0b', '#9aa47e', '#5d6543'],
				['#100d10', '#a48aa0', '#665164'],
				['#0d0f13', '#879db1', '#4d6277']
			],
			recBg:'#101008', recWave:'#e13030',
			fade:'rgba(240,216,120,.75)', fadeFill:'rgba(240,216,120,.08)',
			beatMinor:'rgba(90,242,255,.09)', beatMajor:'rgba(240,216,120,.22)'
		},
		light: {
			bg:'#f7fafb', wave:'#2f8f99', off:'#c3ccd3', limit:'rgba(20,24,28,.38)',
			timeBg:'#ffffff', timeFg:'#14181c',
			rulerBg:'#e3e8ed', rulerFg:'#444e59',
			meterBg:'#e3e8ed', meterTick:'#14181c', meterGrid:'rgba(0,0,0,0.22)', meterText:'#444e59',
			clip:[
				['#e2f2f0', '#2a7a74', '#79b9b3'],
				['#e3eef2', '#2a6c71', '#7ab0b6'],
				['#e5f0e9', '#33695b', '#86b3a4'],
				['#f0efdf', '#596330', '#b3ba85'],
				['#f1e8f0', '#6a4a67', '#b99cb6'],
				['#e5eaf2', '#3f5a78', '#92a8c2']
			],
			recBg:'#fdecea', recWave:'#d6203f',
			fade:'rgba(176,112,0,.9)', fadeFill:'rgba(176,112,0,.12)',
			beatMinor:'rgba(0,127,140,.13)', beatMajor:'rgba(176,112,0,.32)'
		}
	};

	/* 標記顏色（霓虹色是為黑底設計的）：淺色主題下壓低亮度，白底上才看得清楚。
	 * 只影響顯示，不改存檔裡的顏色。 */
	var mk_cache = {};
	function markerColor ( c ) {
		if (resolved () !== 'light' || typeof c !== 'string') return c;
		if (mk_cache[c]) return mk_cache[c];
		var m = /^#([0-9a-f]{3}|[0-9a-f]{6})$/i.exec ( c );
		if (!m) return c;
		var h = m[1];
		if (h.length === 3) h = h.charAt (0) + h.charAt (0) + h.charAt (1) + h.charAt (1) + h.charAt (2) + h.charAt (2);
		var r = parseInt (h.substr (0, 2), 16) / 255, g = parseInt (h.substr (2, 2), 16) / 255, b = parseInt (h.substr (4, 2), 16) / 255;
		var mx = Math.max (r, g, b), mn = Math.min (r, g, b), l = (mx + mn) / 2, s = 0, hh = 0, dl = mx - mn;
		if (dl) {
			s = l > 0.5 ? dl / (2 - mx - mn) : dl / (mx + mn);
			hh = mx === r ? (g - b) / dl + (g < b ? 6 : 0) : mx === g ? (b - r) / dl + 2 : (r - g) / dl + 4;
			hh /= 6;
		}
		if (l <= 0.42) return (mk_cache[c] = c);
		l = 0.4;
		if (s > 0) s = Math.max (s, 0.65);
		function f ( p, q, t ) {
			if (t < 0) t += 1; if (t > 1) t -= 1;
			return t < 1 / 6 ? p + (q - p) * 6 * t : t < 1 / 2 ? q : t < 2 / 3 ? p + (q - p) * (2 / 3 - t) * 6 : p;
		}
		var q2 = l < 0.5 ? l * (1 + s) : l + s - l * s, p2 = 2 * l - q2;
		function x ( v ) { v = Math.round (v * 255).toString (16); return v.length < 2 ? '0' + v : v; }
		return (mk_cache[c] = '#' + x (f (p2, q2, hh + 1 / 3)) + x (f (p2, q2, hh)) + x (f (p2, q2, hh - 1 / 3)));
	}

	w.PKPal = function () { return PAL[resolved ()]; };
	w.PKMarkerColor = markerColor;

	function apply () {
		var r = resolved (), el = d.documentElement;
		el.setAttribute ('data-theme', r);
		if (cb) el.setAttribute ('data-cb', '1'); else el.removeAttribute ('data-cb');

		var meta = d.querySelector ('meta[name="theme-color"]');
		if (meta) meta.setAttribute ('content', r === 'light' ? '#eef1f4' : '#0a0a0a');

		for (var i = 0; i < listeners.length; ++i) {
			try { listeners[i] ( state () ); } catch (e) {}
		}
	}

	if (mql) {
		var onsys = function () { if (mode === 'auto') apply (); };
		if (mql.addEventListener) mql.addEventListener ('change', onsys);
		else if (mql.addListener) mql.addListener ( onsys );
	}

	w.PKTheme = {
		get: state,
		pal: function () { return PAL[resolved ()]; },
		setMode: function ( m ) {
			if (m !== 'auto' && m !== 'dark' && m !== 'light') return ;
			mode = m;
			write ( KEY_THEME, m );
			apply ();
		},
		setColorblind: function ( on ) {
			cb = !!on;
			write ( KEY_CB, cb ? '1' : '0' );
			apply ();
		},
		onChange: function ( fn ) { listeners.push ( fn ); }
	};

	apply ();
	/* <meta name="theme-color"> 在 theme.js 之後才出現，等文件解析完再補一次 */
	d.addEventListener ('DOMContentLoaded', apply);

})( window, document );


