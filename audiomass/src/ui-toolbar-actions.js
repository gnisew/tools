(function ( w, d, PKAE ) {
	'use strict';

	function _toolbarActions ( UI, app ) {
		var t = PKLocale.t;
		var actions = d.createElement( 'div' );
		actions.className = 'pk_ctns';

		var copy_btn = d.createElement ('button');
		copy_btn.setAttribute('tabIndex', -1);
		copy_btn.className = 'pk_btn icon-files-empty pk_inact';
		copy_btn.innerHTML = '<span>' + t('toolbar.copy') + '</span>';
		actions.appendChild ( copy_btn );
		copy_btn.onclick = function() { UI.fireEvent( 'RequestActionCopy'); this.blur(); };

		UI.listenFor ('DidSetClipboard', function ( val ) {
			if (val) paste_btn.classList.remove ('pk_inact');
			else paste_btn.classList.add ('pk_inact');
		});

		var paste_btn = d.createElement ('button');
		paste_btn.setAttribute('tabIndex', -1);
		paste_btn.className = 'pk_btn icon-file-text2 pk_inact';
		paste_btn.innerHTML = '<span>' + t('toolbar.paste') + '</span>';
		actions.appendChild ( paste_btn );
		paste_btn.onclick = function() { UI.fireEvent( 'RequestActionPaste'); this.blur(); };

		var cut_btn = d.createElement ('button');
		cut_btn.setAttribute('tabIndex', -1);
		cut_btn.className = 'pk_btn icon-scissors pk_inact';
		cut_btn.innerHTML = '<span>' + t('toolbar.cut') + '</span>';
		actions.appendChild ( cut_btn );
		cut_btn.onclick = function() { UI.fireEvent( 'RequestActionCut', 1); this.blur(); };

		UI.listenFor ('DidSelectClip', function () {
			copy_btn.classList.remove ('pk_inact');
			cut_btn.classList.remove ('pk_inact');
			btn_clear_selection.classList.remove ('pk_inact');
		});
		UI.listenFor ('DidDeselectClip', function () {
			copy_btn.classList.add ('pk_inact');
			cut_btn.classList.add ('pk_inact');
		});

		var silence_btn = d.createElement ('button');
		silence_btn.setAttribute('tabIndex', -1);
		silence_btn.className = 'pk_btn icon-silence';
		silence_btn.innerHTML = '<span>' + t('toolbar.insert_silence') + '</span>';
		actions.appendChild ( silence_btn );
		UI.KeyHandler.addCallback ('KeyShiftN', function( k, m, e ) {
			if (UI.InteractionHandler.on || (e && (e.ctrlKey || e.metaKey))) return ;
			silence_btn.click ();
		},[16, 78]);
		silence_btn.onclick = function() { UI.fireEvent( 'RequestFXUI_Silence'); this.blur(); };

		var btn_clear_selection = d.createElement ('button');
		btn_clear_selection.setAttribute('tabIndex', -1);
		btn_clear_selection.className = 'pk_btn icon-clearsel pk_inact';
		btn_clear_selection.innerHTML = '<span>' + t('toolbar.clear_sel') + '</span>';
		btn_clear_selection.onclick = function () { UI.fireEvent( 'RequestRegionClear'); this.blur (); };
		return { 
			actions: actions, 
			btn_clear_selection: btn_clear_selection,
			copy_btn: copy_btn,
			cut_btn: cut_btn
		};
	}

	PKAE._deps._toolbarActions = _toolbarActions;

})( window, document, PKAudioEditor );