(function ( w, d, PKAE ) {
	'use strict';

	function _menuEffects ( app ) {
		var t = PKLocale.t;
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
				{ name: t('fx.remove_silence'), action: function () { app.fireEvent ('RequestActionFX_RemSil'); } }
			]
		};
	}

	PKAE._deps._menuEffects = _menuEffects;

})( window, document, PKAudioEditor );
