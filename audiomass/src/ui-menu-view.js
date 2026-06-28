(function ( w, d, PKAE ) {
	'use strict';

	function _menuView ( app ) {
		var t = PKLocale.t;
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
				{ name: t('view.tempo_tools'), action: function () { app.fireEvent ('RequestActionTempo'); } },
				{ name: t('view.id3_tags'), action: function () { app.fireEvent ('RequestActionID3'); } },
				{ name:'---' },
				{ name: t('view.center_cursor') + ' <span class="pk_shrtct">[Tab]</span>', action: function () { app.fireEvent ('RequestViewCenterToCursor'); } },
				{ name: t('view.reset_zoom') + ' <span class="pk_shrtct">[0]</span>', action: function () { app.fireEvent ('RequestZoomUI', 0); } }
			]
		};
	}

	PKAE._deps._menuView = _menuView;

})( window, document, PKAudioEditor );
