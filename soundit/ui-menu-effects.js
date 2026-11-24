(function ( w, d, PKAE ) {
	'use strict';

	function _menuEffects ( app ) {
		var t = PKLocale.t;
		/* 新增：語言檔沒有該 key 時用內建中／英文 */
		function tf ( key, zh, en ) {
			var s = t ( key );
			if (s && s !== key) return s;
			var lang = '';
			try { lang = PKLocale.getLang (); } catch (e) {}
			return lang === 'en' ? en : zh;
		}
		return {
			name: t('menu.effects'),
			children:[
				{ name: t('fx.gain'), action: function () { app.fireEvent ('RequestFXUI_Gain'); } },
				{ name: t('fx.fade_in'), action: function () { app.fireEvent ('RequestActionFX_FadeIn'); } },
				{ name: t('fx.fade_out'), action: function () { app.fireEvent ('RequestActionFX_FadeOut'); } },
				{ name: t('fx.noise_reduction'), action: function () { app.fireEvent('RequestActionFX_NoiseRNN'); } },
				{ name: t('fx.para_eq'), action: function () { app.fireEvent ('RequestActionFXUI_ParaGraphicEQ'); } },
				{ name: t('fx.compressor'), action: function () { app.fireEvent ('RequestActionFXUI_Compressor'); } },
				{ name: t('fx.normalize'), action: function () { app.fireEvent ('RequestActionFXUI_Normalize'); } },
				{ name: t('fx.graph_eq'), action: function () { app.fireEvent ('RequestActionFXUI_GraphicEQ', 10); } },
				{ name: t('fx.graph_eq_20'), action: function () { app.fireEvent ('RequestActionFXUI_GraphicEQ', 20); } },
				{ name: t('fx.hard_limiter'), action: function () { app.fireEvent ('RequestActionFXUI_HardLimiter'); } },
				{ name: t('fx.delay'), action: function () { app.fireEvent ('RequestActionFXUI_Delay'); } },
				{ name: t('fx.distortion'), action: function () { app.fireEvent ('RequestActionFXUI_Distortion'); } },
				{ name: t('fx.reverb'), action: function () { app.fireEvent ('RequestActionFXUI_Reverb'); } },
				{ name: t('fx.repair'), action: function () { app.fireEvent ('RequestActionFXUI_Repair'); } },
				{ name: t('fx.speed_pitch'), action: function () { app.fireEvent ('RequestActionFXUI_Speed'); } },
				{ name: t('fx.speed_rate'), action: function () { app.fireEvent ('RequestActionFXUI_Rate'); } },
				{ name: t('fx.reverse'), action: function () { app.fireEvent ('RequestActionFX_Reverse'); } },
				{ name: t('fx.invert'), action: function () { app.fireEvent ('RequestActionFX_Invert'); } },
				{ name: t('fx.remove_silence'), action: function () { app.fireEvent ('RequestActionFX_RemSil'); } },
				{ name: t('fx.high_pass'), action: function () { app.fireEvent ('RequestActionFX_HighPass'); } },
				{ name: t('fx.dc_offset'), action: function () { app.fireEvent ('RequestActionFX_DCOffset'); } },
				{ name: '---' },
				{ name: tf ('fx.presets_export', '匯出預設集', 'Export presets'), action: function () { app.fireEvent ('RequestFXPresetsExport'); } },
				{ name: tf ('fx.presets_import', '匯入預設集', 'Import presets'), action: function () { app.fireEvent ('RequestFXPresetsImport'); } }
			]
		};
	}

	PKAE._deps._menuEffects = _menuEffects;

})( window, document, PKAudioEditor );
