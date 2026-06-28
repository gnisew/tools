(function ( w, d, PKAE ) {
	'use strict';

	function _menuEdit ( app ) {
		var t = PKLocale.t;
		return {
			name: t('menu.edit'),
			children:[
				{
					name: t('edit.undo') + ' <span class="pk_shrtct">Shft+Z</span>',
					clss: 'pk_inact',
					action: function () { app.fireEvent ('StateRequestUndo'); },
					setup: function ( obj ) {
						app.listenFor ('DidStateChange', function ( undo_states ) {
							if (undo_states.length === 0) { obj.innerHTML = t('edit.undo') + ' <span class="pk_shrtct">Shft+Z</span>'; obj.classList.add ('pk_inact'); }
							else { obj.innerHTML = t('edit.undo') + '&nbsp;<i style="pointer-events:none">' + undo_states[undo_states.length - 1].desc + '</i><span class="pk_shrtct">Shft+Z</span>'; obj.classList.remove ('pk_inact'); }
						});
					}
				},
				{
					name: t('edit.redo') + ' <span class="pk_shrtct">Shft+Y</span>',
					clss: 'pk_inact',
					action: function () { app.fireEvent ('StateRequestRedo'); },
					setup: function ( obj ) {
						app.listenFor('DidStateChange', function ( undo_states, redo_states ) {
							if (redo_states.length === 0) { obj.innerHTML = t('edit.redo') + ' <span class="pk_shrtct">Shft+Y</span>'; obj.classList.add ('pk_inact'); }
							else { obj.innerHTML = t('edit.redo') + '&nbsp;<i style="pointer-events:none">' + redo_states[0].desc + '</i><span class="pk_shrtct">Shft+Y</span>'; obj.classList.remove ('pk_inact'); }
						});
					}
				},
				{ name: t('edit.play') + ' <span class="pk_shrtct">Space</span>', action: function () { app.fireEvent ('RequestPlay'); } },
				{ name: t('edit.stop'), action: function () { app.fireEvent ('RequestStop'); } },
				{ name: t('edit.select_all') + ' <span class="pk_shrtct">Shft+A</span>', action: function () { app.fireEvent ('RequestSelect'); } },
				{ name: t('edit.deselect_all') + ' <span class="pk_shrtct">~</span>', action: function () { app.fireEvent ('RequestDeselect'); } },
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
	}

	PKAE._deps._menuEdit = _menuEdit;

})( window, document, PKAudioEditor );
