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

			/* [修改] 先清掉 onloadend 再呼叫 callback：callback 裡若接著讀下一個檔案（見 onDrop 的依序讀取），
			 * 新設定的 onloadend 才不會被事後的 = null 蓋掉 */
			reader.onloadend = function( e ) {
				reader.onloadend = null;
				callback && callback( e.target.result, file.name );
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
					{
						/* [新增] 拖進來的不是檔案而是網址文字（網址列、網頁上的連結）：交給匯入佇列。不是網址清單就維持原本的「什麼都不做」 */
						var iqt = window.PKAudioEditor && window.PKAudioEditor.importq;
						if( iqt && iqt.HandleDropText )
						{
							var txt = '';
							try { txt = e.dataTransfer.getData( 'text/uri-list' ) || e.dataTransfer.getData( 'text/plain' ) || ''; } catch( x ) {}
							iqt.HandleDropText( txt );
						}
						return false;
					}

					/* [新增] 有匯入佇列就整批交給它（排序清單、取代／附加、標記都在那邊處理）。
					 * 它回傳 false（多軌模式、或沒有任何音訊檔）時才走下面原本的流程 */
					var iq = window.PKAudioEditor && window.PKAudioEditor.importq;
					if( iq && iq.HandleDrop && iq.HandleDrop( files ) )
						return false;

					/* [修改] 原本 while( len-- ) 由最後一個往前讀，順序顛倒；而且共用同一個 FileReader，
					 * 同時讀多個檔案會互相打架。改成依原順序、一個讀完才讀下一個 */
					var queue = Array.prototype.slice.call( files ),
						next = function() {
							var file = queue.shift();
							if( !file ) return;
							readFile( file, function( result, name ) {
								callback && callback( result, name );
								next();
							}, method );
						};
					next();
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
