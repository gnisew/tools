(function ( w, d, PKAE ) {
	'use strict';

	function _menuEdit ( app ) {
				var t = PKLocale.t;
		function K ( id ) { var s = PKAE._deps.shortcuts; return s ? ' ' + s.hint ( id ) : ''; }
		var AS = PKAE._deps.autosplit;
		var menu = {
			name: t('menu.edit'),
			children:[
				{
					name: t('edit.undo') + K ('undo'),
					clss: 'pk_inact',
					action: function () { app.fireEvent ('StateRequestUndo'); },
					setup: function ( obj ) {
						app.listenFor ('DidStateChange', function ( undo_states ) {
							if (undo_states.length === 0) { obj.innerHTML = t('edit.undo') + K ('undo'); obj.classList.add ('pk_inact'); }
							else { obj.innerHTML = t('edit.undo') + '&nbsp;<i style="pointer-events:none">' + undo_states[undo_states.length - 1].desc + '</i>' + K ('undo'); obj.classList.remove ('pk_inact'); }
						});
					}
				},
				{
					name: t('edit.redo') + K ('redo'),
					clss: 'pk_inact',
					action: function () { app.fireEvent ('StateRequestRedo'); },
					setup: function ( obj ) {
						app.listenFor('DidStateChange', function ( undo_states, redo_states ) {
							if (redo_states.length === 0) { obj.innerHTML = t('edit.redo') + K ('redo'); obj.classList.add ('pk_inact'); }
							else { obj.innerHTML = t('edit.redo') + '&nbsp;<i style="pointer-events:none">' + redo_states[0].desc + '</i>' + K ('redo'); obj.classList.remove ('pk_inact'); }
						});
					}
				},
				{ name: t('edit.play') + K ('play_stop'), action: function () { app.fireEvent ('RequestPlay'); } },
				{ name: t('edit.stop'), action: function () { app.fireEvent ('RequestStop'); } },
				{ name: t('edit.select_all') + K ('select_all'), action: function () { app.fireEvent ('RequestSelect'); } },
				{ name: t('edit.deselect_all') + K ('deselect'), action: function () { app.fireEvent ('RequestDeselect'); } },
				{
					name: t('edit.channel_info'), action: function () { app.fireEvent ('RequestActionFXUI_Flip'); }, clss: 'pk_inact',
					setup: function ( obj ) {
						app.listenFor ('DidUnloadFile', function () { obj.classList.add ('pk_inact'); });
						app.listenFor ('DidLoadFile', function () { obj.classList.remove ('pk_inact'); });
					}
				},
				{ name: t('edit.seamless_loop'), action: function () { app.fireEvent ('RequestActionFXUI_SeamlessLoop'); } },
				{
					name: t('edit.zero_cross'), action: function () { app.fireEvent ('RequestSnapSelDrag'); },
					setup: function ( obj ) {
						var txt = t('edit.zero_cross');
						function set ( val ) { obj.innerHTML = txt + (val ? ' &#10004;' : ''); }
						set (!w.localStorage || w.localStorage.pk_snapzc !== '0');
						app.listenFor ('DidSnapSelDrag', set);
					}
				}
			]
		};

		/* [新增] 自動分割標記：依靜音／聲音特性變化在波形上加標記（需載入 autosplit.js） */
		if (AS) {
			menu.children.push ({
				name: AS.T ('menu'),
				clss: 'pk_inact',
				action: function () { AS.open ( app ); },
				setup: function ( obj ) {
					function sync () {
						var h = PKAE._deps.uiHelpers;
						if (h && h.activeReadyFor ( app )) obj.classList.remove ('pk_inact'); else obj.classList.add ('pk_inact');
					}
					app.listenFor ('DidUnloadFile', sync);
					app.listenFor ('DidLoadFile', sync);
					app.listenFor ('DidUpdateMultitrack', sync);
					sync ();
				}
			});
		}

		return menu;
	}

	PKAE._deps._menuEdit = _menuEdit;

})( window, document, PKAudioEditor );


