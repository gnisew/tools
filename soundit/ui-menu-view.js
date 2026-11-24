(function ( w, d, PKAE ) {
	'use strict';

	function _menuView ( app ) {
				var t = PKLocale.t;
		function K ( id ) { var s = PKAE._deps.shortcuts; return s ? ' ' + s.hint ( id ) : ''; }

		/* 頻譜圖子選單項目：目前選中的項目後面加 ✔，狀態改變時即時更新 */
		var SP = PKAE._deps.spectroPrefs;
		function spItem ( label, key, val, ev ) {
			return {
				name: label + ((SP && SP.get ()[ key ] === val) ? ' &#10004;' : ''),
				action: function () { app.fireEvent ( ev, val ); },
				setup: function ( obj ) {
					app.listenFor ('DidSpectrogramState', function ( st ) {
						obj.innerHTML = label + (st[ key ] === val ? ' &#10004;' : '');
					});
				}
			};
		}

		/* 新增：語言檔沒有該 key 時用內建中／英文 */
		function tf ( key, zh, en ) {
			var s = t ( key );
			if (s && s !== key) return s;
			var lang = '';
			try { lang = PKLocale.getLang (); } catch (e) {}
			return lang === 'en' ? en : zh;
		}

		/* 新增：外觀（深色 / 淺色 / 色盲友善）子選單，目前選項後面加 ✔ */
		var TH = w.PKTheme;
		function thItem ( label, test, act ) {
			function txt () { return label + (TH && test ( TH.get () ) ? ' &#10004;' : ''); }
			return {
				name: txt (),
				action: act,
				setup: function ( obj ) { TH && TH.onChange ( function () { obj.innerHTML = txt (); }); }
			};
		}

		/* 新增：工具列（顯示／時間精簡／調整排列），設定與狀態在 ui-toolbar-layout.js */
		var TL = PKAE._deps.tbl;
		function tlItem ( label, test, act ) {
			function txt () { return label + (TL && test ( TL ) ? ' &#10004;' : ''); }
			return {
				name: txt (),
				action: function () { TL && act ( TL ); },
				setup: function ( obj ) { TL && TL.onChange ( function () { obj.innerHTML = txt (); } ); }
			};
		}
		function tlPanel ( id ) {
			return tlItem ( t ('view.tb_' + id), function ( T ) { return T.isVis ( id ); }, function ( T ) { T.toggle ( id ); } );
		}

		return {
			name: t('menu.view'),
			children:[
				{
					name: t('view.follow_cursor') + '  &#10004;',
					action: function () { app.fireEvent ('RequestViewFollowCursorToggle'); },
					setup: function ( obj ) {
						app.listenFor ('DidViewFollowCursorToggle', function ( val ) {
							var txt = t('view.follow_cursor');
							obj.innerHTML = val ? txt + ' &#10004;' : txt;
							if (!val) obj.textContent = txt;
						});
					}
				},
				{
					name: t('view.peak_sep') + ' &#10004;',
					action: function () { app.fireEvent ('RequestViewPeakSeparatorToggle'); },
					setup: function ( obj ) {
						app.listenFor ('DidViewPeakSeparatorToggle', function ( val ) {
							var txt = t('view.peak_sep');
							obj.innerHTML = val ? txt + ' &#10004;' : txt;
							if (!val) obj.textContent = txt;
						});
					}
				},
				{
					name: t('view.timeline') + ' &#10004;',
					action: function () { app.fireEvent ('RequestViewTimelineToggle'); },
					setup: function ( obj ) {
						app.listenFor ('DidViewTimelineToggle', function ( val ) {
							var txt = t('view.timeline');
							obj.innerHTML = val ? txt + ' &#10004;' : txt;
							if (!val) obj.textContent = txt;
						});
					}
				},
				{ name:'---' },
				{
					name: t('view.spectrogram'),
					children: [
						spItem ( t('spec.off'), 'mode', 'off', 'RequestSpectrogramMode' ),
						spItem ( t('spec.solo'), 'mode', 'solo', 'RequestSpectrogramMode' ),
						spItem ( t('spec.blend'), 'mode', 'blend', 'RequestSpectrogramMode' ),
						{ name:'---' },
						spItem ( t('spec.scale_log'), 'scale', 'log', 'RequestSpectrogramScale' ),
						spItem ( t('spec.scale_lin'), 'scale', 'linear', 'RequestSpectrogramScale' ),
						{ name:'---' },
						spItem ( t('spec.fft_fast'), 'fft', 1024, 'RequestSpectrogramFFT' ),
						spItem ( t('spec.fft_std'), 'fft', 2048, 'RequestSpectrogramFFT' ),
						spItem ( t('spec.fft_fine'), 'fft', 4096, 'RequestSpectrogramFFT' )
					]
				},
				{
					name: t('view.freq_analyser'),
					action: function () { app.fireEvent ('RequestShowFreqAn', 'eq', [1]); },
					setup: function ( obj ) {
						app.listenFor ('DidToggleFreqAn', function ( url, val ) {
							if (url !== 'eq') return ;
							var txt = t('view.freq_analyser');
							obj.innerHTML = val ? txt + ' &#10004;' : txt;
							if (!val) obj.textContent = txt;
						});
					}
				},
				{
					name: t('view.spectrum_analyser'),
					action: function () { app.fireEvent ('RequestShowFreqAn', 'sp', [1]); },
					setup: function ( obj ) {
						app.listenFor ('DidToggleFreqAn', function ( url, val ) {
							if (url !== 'sp') return ;
							var txt = t('view.spectrum_analyser');
							obj.innerHTML = val ? txt + ' &#10004;' : txt;
							if (!val) obj.textContent = txt;
						});
					}
				},
				{
					name: t('view.multitrack_mixer'),
					action: function () {
						var mt = app.multitrack;
						if (mt && mt.IsOn && !mt.IsOn ()) mt.Toggle ( true );
						app.fireEvent ('RequestMixerToggle');
					},
					setup: function ( obj ) {
						app.listenFor ('DidToggleFreqAn', function ( url, val ) {
							if (url !== 'mix') return ;
							var txt = t('view.multitrack_mixer');
							obj.innerHTML = val ? txt + ' &#10004;' : txt;
							if (!val) obj.textContent = txt;
						});
					}
				},
				{
					/* [新增] 標記清單（浮動視窗），開啟時後面加 ✔ */
					name: tf ('view.marker_list', '標記清單', 'Marker List') + K ('marker_list'),
					action: function () { var P = PKAE._deps.mrkpanel; P && P.toggle (); },
					setup: function ( obj ) {
						var txt = tf ('view.marker_list', '標記清單', 'Marker List');
						app.listenFor ('DidToggleMarkerPanel', function ( val ) {
							obj.innerHTML = txt + (val ? ' &#10004;' : '') + K ('marker_list');
						});
					}
				},
				{ name: t('view.tempo_tools'), action: function () { app.fireEvent ('RequestActionTempo'); } },
				{ name: t('view.id3_tags'), action: function () { app.fireEvent ('RequestActionID3'); } },
				{
					name: tf ('view.appearance', '外觀', 'Appearance'),
					children: [
						thItem ( tf ('view.theme_auto', '跟隨系統', 'Follow system'), function ( s ) { return s.mode === 'auto'; }, function () { TH && TH.setMode ('auto'); } ),
						thItem ( tf ('view.theme_dark', '深色', 'Dark'), function ( s ) { return s.mode === 'dark'; }, function () { TH && TH.setMode ('dark'); } ),
						thItem ( tf ('view.theme_light', '淺色', 'Light'), function ( s ) { return s.mode === 'light'; }, function () { TH && TH.setMode ('light'); } ),
						{ name:'---' },
						thItem ( tf ('view.colorblind', '色盲友善配色', 'Colorblind-friendly colors'), function ( s ) { return s.cb; }, function () { TH && TH.setColorblind ( !TH.get ().cb ); } )
					]
				},
				{
					name: t ('view.toolbars'),
					children: [
						tlPanel ( 'time' ),
						tlPanel ( 'transport' ),
						tlPanel ( 'actions' ),
						tlPanel ( 'selection' ),
						tlPanel ( 'meter' ),	/* [新增] 電平表：顯示／隱藏 */
						{ name:'---' },
						/* [修改] 桌面版固定精簡：不再有「排列」選項。時間／選取預設最精簡，要看更多就往右加寬／加橫向文字 */
						tlItem ( tf ('view.tb_tm_hx', '時間：往右加顯示滑鼠位置時間', 'Time: add hover time (right)'), function ( T ) { return T.tmShow ('h'); }, function ( T ) { T.tmToggle ('h'); } ),
						tlItem ( tf ('view.tb_sel_x', '選取區塊：顯示橫向文字（起點／終點／長度）', 'Selection: show text labels'), function ( T ) { return T.selCompact (); }, function ( T ) { T.selToggle (); } ),
						/* [新增] 電平表放在工具列（窄版）／放回底部（全寬）；也可以在「調整排列」直接拖曳 */
						tlItem ( tf ('view.tb_meter_bar', '電平表：放在工具列（窄版）', 'Level meter: place in toolbar (narrow)'), function ( T ) { return T.meterDock () === 'bar'; }, function ( T ) { T.setMeterDock ( T.meterDock () === 'bar' ? 'foot' : 'bar' ); } ),
						{ name:'---' },
						{ name: t ('view.tb_custom'), action: function () { TL && TL.openDialog (); } },
						tlItem ( t ('view.tb_edit'), function ( T ) { return T.isEditing (); }, function ( T ) { T.edit ( !T.isEditing () ); } ),
						{ name: t ('view.tb_dock'), action: function () { TL && TL.dockAll (); } },
						{ name: t ('view.tb_export'), action: function () { TL && TL.exportFile (); } },
						{ name: t ('view.tb_import'), action: function () { TL && TL.importFile (); } },
						{ name: t ('view.tb_reset'), action: function () { TL && TL.reset (); } }
					]
				},
				{ name:'---' },
				{ name: t('view.center_cursor') + K ('center'), action: function () { app.fireEvent ('RequestViewCenterToCursor'); } },
				{ name: t('view.reset_zoom') + K ('zoom_reset'), action: function () { app.fireEvent ('RequestZoomUI', 0); } }
			]
		};
	}

	PKAE._deps._menuView = _menuView;

})( window, document, PKAudioEditor );
