(function( parent ) {
	'use strict';

	var parent = parent || window,

		reader,
		readFile,

		removeClass	= function( el, value ) {
			if ( !el.className ) return false;
			var classes = el.className.split(' '),
				ret = [];
			for( var i = 0, l = classes.length; i < l; ++i )
				if( classes[i] != value )
					ret.push( classes[ i ] );
			el.className = ret.join(' ');
		};

	if( !window.FileReader || !document.addEventListener ) {
		readFile = function(){ throw( "File API not supported" ); };
	}
	else {
		reader = new FileReader();
		readFile = function ( file, callback, method ) {

			reader.onerror = function( e ) {
				var lut = [ "File not found.", "File could not be opened",
						"File could not be uploaded", "Could not read file", "File too large" ];

				throw( lut[ ( e.target.error.code - 1 ) ] );
			},

			reader.onloadend = function( e ) {
				callback && callback( e.target.result, file.name );
				reader.onloadend = null;
			};

			reader[ method ]( file );
			return false;
		};
	}

	parent.dragNDrop = function( body, overlay_id, callback, method, _clss ) {

		if( ( 'ontouchstart' in window ) )
			return "mobile";

		var method_lut = {
				'text'		 :	'readAsText',
				'binary'	 :	'readAsBinaryText',
				'arrayBuffer':	'readAsArrayBuffer'
			},

			clss = _clss ? _clss : "__fadingIn",
			method = method ? method_lut[ method ] : 'readAsText',

			entered = 0,

			overlay = !!overlay_id ? overlay_id : body,

			_overlayBuilder = function() {
				if( typeof overlay_id === "string" )
				{
					var tmp = document.createElement( 'div' );
					overlay = document.createElement( 'div' );
					overlay.id = overlay_id;

					tmp.innerHTML = PKLocale.t('ui.drop_files');
					overlay.appendChild( tmp );

					body.appendChild( overlay );
					tmp = null;
				}
			},

			events = {

				silencer	:	function( e ) {
					e.preventDefault();
					e.stopPropagation()
				},

				onDragEnter	:	function( e ) {

					++entered;

					setTimeout(function() {
						if( entered > 1 )
							entered = 1;
					}, 10 )
				},

				onDragLeave	:	function( e ) {
					--entered;

					if( entered <= 0 )
					{
						removeClass( overlay, clss );
						entered = 0;
					}
				},

				onDrop	:	function( e ) {

					events.silencer( e );

					removeClass( overlay, clss );
					entered = 0;

					var files = e.dataTransfer.files,
						len;

					if(	!files || !files.length )
						return false;

					len = files.length;
					while( len-- )

						readFile( files[ len ], callback, method );
				}
			};

		(function init() {

			body.parentNode.addEventListener( "dragenter", events.onDragEnter, false );
			body.addEventListener( "dragleave", events.onDragLeave, false );
			body.addEventListener( "dragover", events.silencer, false);
			body.addEventListener( "drop", events.onDrop, false);
			return false;
		})( body );
	};
})( window );


