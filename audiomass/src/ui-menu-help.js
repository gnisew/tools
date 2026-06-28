(function ( w, d, PKAE ) {
	'use strict';

	function _menuHelp ( app ) {
		var t = PKLocale.t;
		return {
			name: t('menu.help'),
			children:[
				{
					name: t('help.store_offline'),
					action: function () {
						if (window.location.href.indexOf('-cache') > 0) {
							function onUpdateReady () { if (confirm (t('confirm.refresh'))) window.location.reload(); }
							function downLoading () { OneUp (t('downloading'), 1500); }
							window.applicationCache.onupdateready = onUpdateReady;
							window.applicationCache.ondownloading = downLoading;
							if(window.applicationCache.status === window.applicationCache.UPDATEREADY) onUpdateReady ();
							window.applicationCache.update ();
							return ;
						}
						new PKSimpleModal ({
							title: t('help.offline_title'),
							ondestroy: function( q ) { app.ui.InteractionHandler.on = false; app.ui.KeyHandler.removeCallback ('modalTempErr'); },
							buttons:[{ title:'OPEN', callback: function( q ) { window.open ('/index-cache.html'); q.Destroy (); } }],
							body:'<p>' + t('help.offline_msg') + '</p>',
							setup:function( q ) {
								app.fireEvent ('RequestPause');
								app.fireEvent( 'RequestRegionClear');
								app.ui.InteractionHandler.checkAndSet ('modal');
								app.ui.KeyHandler.addCallback ('modalTempErr', function ( e ) { q.Destroy (); }, [27]);
							}
						}).Show ();
					},
					setup: function ( obj ) {
						if (window.location.href.indexOf('-cache') > 0) obj.innerHTML = t('help.update_offline');
					}
				},
				{ name:'---' },
				{ name: t('help.about'), action: function () { window.open ('/about.html'); } },
				{ name: t('help.welcome'), action: function () { PKAudioEditor._deps.Wlc (); } },
				{ name: '---' },
				{
					name: t('lang.switch'),
					children: (function () {
						var langs = PKLocale.getAvailableLangs ();
						var items = [];
						for (var i = 0; i < langs.length; ++i) {
							(function (lang) {
								items.push ({
									name: lang.name + (lang.id === PKLocale.getLang () ? ' &#10004;' : ''),
									action: function () { PKLocale.setLang (lang.id); window.location.reload (); }
								});
							})(langs[i]);
						}
						return items;
					}) ()
				},
				{ name: '---' },
				{ name: t('help.sourcecode'), action: function () { window.open ('https://github.com/pkalogiros/audiomass'); } }
			]
		};
	}

	PKAE._deps._menuHelp = _menuHelp;

})( window, document, PKAudioEditor );
