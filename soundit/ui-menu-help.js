(function ( w, d, PKAE ) {
	'use strict';

	function _menuHelp ( app ) {
		var t = PKLocale.t;

		function showModal ( title, body ) {
			new PKSimpleModal ({
				title: title,
				ondestroy: function( q ) { app.ui.InteractionHandler.on = false; app.ui.KeyHandler.removeCallback ('modalTempErr'); },
				buttons:[{ title:'OK', callback: function( q ) { q.Destroy (); } }],
				body: body,
				setup:function( q ) {
					app.fireEvent ('RequestPause');
					app.fireEvent( 'RequestRegionClear');
					app.ui.InteractionHandler.checkAndSet ('modal');
					app.ui.KeyHandler.addCallback ('modalTempErr', function ( e ) { q.Destroy (); }, [27]);
				}
			}).Show ();
		}

		return {
			name: t('menu.help'),
			children:[
				{
					name: t('sc.menu') + (PKAE._deps.shortcuts ? ' ' + PKAE._deps.shortcuts.hint ('help') : ''),
					action: function () { PKAE._deps.shortcuts && PKAE._deps.shortcuts.open (); }
				},
				{ name:'---' },
				{
					name: t('help.store_offline'),
					action: function () {
						var ip = window.__pkInstallPrompt;
						if (ip) {
							window.__pkInstallPrompt = null;
							ip.prompt ();
							return ;
						}
						showModal ( t('help.offline_title'), '<p>' + t('help.offline_msg') + '</p>' );
					}
				},
				{ name:'---' },
				{
					name: t('help.license'),
					action: function () {
						showModal ( t('help.license'),
							'<p>' + t('license.msg') + '</p>' +
							'<p><a href="LICENSE" target="_blank">LICENSE</a> &nbsp;|&nbsp; ' +
							'<a href="THIRD_PARTY_NOTICES.md" target="_blank">THIRD_PARTY_NOTICES</a></p>' );
					}
				},
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
				}
			]
		};
	}

	PKAE._deps._menuHelp = _menuHelp;

})( window, document, PKAudioEditor );


