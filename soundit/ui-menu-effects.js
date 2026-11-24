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
		/* [新增 5-3] 選單項目後面顯示快捷鍵（改按鍵後即時更新） */
		function K ( id ) { var s = PKAudioEditor._deps.shortcuts; return s ? ' ' + s.hint ( id ) : ''; }
		/* [新增 5-3] 練習速度子選單：慢速切換項目在「速度不是 100%」時後面加 ✔ */
		function slowLabel ( on ) {
			return tf ('fx.practice_slow', '慢速切換', 'Toggle slow speed') + (on ? ' &#10004;' : '') + K ('practice_slow');
		}
		var PRACTICE_MENU = {
			name: tf ('fx.practice', '練習速度（即時變速）', 'Practice speed (live)'),
			children: [
				{ name: tf ('fx.practice_panel', '練習面板…', 'Practice panel…') + K ('practice_panel'), action: function () { app.fireEvent ('RequestPracticeUI'); } },
				{
					name: slowLabel ( false ),
					action: function () { app.fireEvent ('RequestPracticeSlowToggle'); },
					setup: function ( obj ) {
						app.listenFor ('DidPracticeChange', function ( st ) { obj.innerHTML = slowLabel ( !!st && Math.abs ( st.tempo - 1 ) > 1e-6 ); });
					}
				},
				{ name: '---' },
				{ name: tf ('fx.practice_tempo_dn', '速度 −5%', 'Speed −5%') + K ('practice_tempo_down'), action: function () { app.fireEvent ('RequestPracticeNudge', { tempo: -5 }); } },
				{ name: tf ('fx.practice_tempo_up', '速度 +5%', 'Speed +5%') + K ('practice_tempo_up'), action: function () { app.fireEvent ('RequestPracticeNudge', { tempo: 5 }); } },
				{ name: tf ('fx.practice_pitch_dn', '移調 −1 半音', 'Transpose −1 semitone') + K ('practice_pitch_down'), action: function () { app.fireEvent ('RequestPracticeNudge', { semis: -1 }); } },
				{ name: tf ('fx.practice_pitch_up', '移調 +1 半音', 'Transpose +1 semitone') + K ('practice_pitch_up'), action: function () { app.fireEvent ('RequestPracticeNudge', { semis: 1 }); } },
				{ name: '---' },
				{ name: tf ('fx.practice_reset', '還原 100%／原調', 'Reset to 100% / original key') + K ('practice_reset'), action: function () { app.fireEvent ('RequestPracticeReset'); } }
			]
		};
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
				{ name: t('fx.speed_rate') + K ('timepitch_dialog'), action: function () { app.fireEvent ('RequestActionFXUI_TimePitch'); } },
				PRACTICE_MENU,
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


