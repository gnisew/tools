(function ( w, d, PKAE ) {
	'use strict';

	var db;
	var db_name    = 'soundit';
	var db_version = 1;

	var compressors = {
		'l4z' : {
			ready: false,
			loading: false,
			compress: null,
			decompress: null,
			init : function ( callback ) {

				var q = this;
				q.loading = true;

				var lz4BlockWASM;

				lz4BlockCodec.createInstance('wasm').then(instance => {
				    lz4BlockWASM = instance;

				    q.ready = true;
				    q.loading = false;
				    q.compress = function( input, offset ) {
				    	if (!lz4BlockWASM) {
				    		if (input instanceof ArrayBuffer)
				    			return new Uint8Array(input);
				    		else
				    			return input;
				    	}

			    		return lz4BlockWASM.encodeBlock(input, 0);
					};
				    q.decompress = function( input, offset, size ) {
				    	if (!lz4BlockWASM) {
				    		if (input instanceof ArrayBuffer)
				    			return new Uint8Array(input);
				    		else
				    			return input;
				    	}

			    		return lz4BlockWASM.decodeBlock(input, 0, size);
					};

					callback && callback ();
				});

			}
		}
	};

	var compression = 'l4z';

	function SaveLocal ( app ) {
		var q = this;
		q.on = false;

		this.Init = function ( callback ) {
			if (q.on) {
				callback && callback ();
				return ;
			}

			if (!window.indexedDB) {
				callback && callback ('err');
				return ;
			}

			var request = indexedDB.open (db_name, db_version);

			request.onerror = function(e) {
				callback && callback ('err');

			};

			request.onupgradeneeded = function(e) {
				var db = e.target.result;
				db.createObjectStore('sessions', {keyPath:'id'});
			};

			request.onsuccess = function(e) {
				db = e.target.result;

				db.onerror = function( e ) {
					console.error ( 'IndexedDB error:', e );
				};

				setTimeout(function() {
					q.on = true;

					callback && callback ();
					app.fireEvent ('DidOpenDB', q);
				},120);
			};
		};

		this.SaveSession = function ( buffer, id, name, callback, quiet ) {
			var q = this;

			var comp = compressors[ compression ];
			if (!comp.loading && !comp.ready) {
				comp.init (function() {
					q.SaveSession (buffer, id, name, callback, quiet);
				});

				return ;
			}

			var chans = buffer.numberOfChannels;
			var arr_buffs = [];
			var arr_buffs2 = [];
			var arr;
			var tmp;

			var sample_rate = buffer.sampleRate;

			for (var i = 0; i < chans; ++i) {
				arr = buffer.getChannelData ( i );

				arr_buffs2.push (arr.buffer.byteLength);
				tmp = comp.compress ( arr.buffer, 0);
				arr_buffs.push ( tmp.buffer.slice (tmp.byteOffset, tmp.byteLength + tmp.byteOffset));
			}

			tmp = null;

			var ob = {
				id : id,
				name: name,
				created: new Date().getTime(),
				data: arr_buffs,
				data2: arr_buffs2,
				durr: buffer.duration.toFixed(3)/1,
				chans: chans,
				comp: compression,
				thumb: PKAudioEditor.engine.GetWave (buffer),
				samplerate: sample_rate,
				markers: app.mrk ? app.mrk.serEd () : []
			};

			var trans = db.transaction(['sessions'], 'readwrite');
			var addReq = trans.objectStore('sessions').add(ob);

			addReq.onerror = function(e) {
				app.fireEvent ('ErrorDB', e);

				console.error('error storing data');
				console.error(e);
			};

			trans.oncomplete = function ( e ) {
				if (!quiet) app.fireEvent ('DidStoreDB', ob, e );
				callback && callback (ob, e);

			};
		};

		this.GetSession = function ( id, callback ) {
			var trans = db.transaction(['sessions'], 'readonly');

			var req = trans.objectStore('sessions').get(id);

			req.onsuccess = function(e) {

				var record = e.target.result;

				if (record && record.comp)
				{
					var comp = compressors[ compression ];
					if (!comp.loading && !comp.ready) {
						comp.init (function() {

							var data_arr = [];
							var tmp = null;

							for (var i = 0; i < record.data.length; ++i) {
								tmp = comp.decompress (record.data[i], 0, record.data2[i]);
								data_arr.push (
									tmp.buffer.slice (tmp.byteOffset, tmp.byteLength + tmp.byteOffset)
								);
							}

							tmp = null;
							record.data = data_arr;

							callback && callback ( record );
						});

						return ;
					}

					var data_arr = [];
					var tmp = null;

					for (var i = 0; i < record.data.length; ++i) {
						tmp = comp.decompress (record.data[i], 0, record.data2[i]);
						data_arr.push (
							tmp.buffer.slice (tmp.byteOffset, tmp.byteLength + tmp.byteOffset)
						);
					}

					tmp = null;
					record.data = data_arr;
				}

				callback && callback ( record );
			};
		};

		this.DelSession = function ( id, callback ) {
			var trans = db.transaction(['sessions'], 'readwrite');

			var req = trans.objectStore('sessions').delete (id);
			req.onsuccess = function (e) {
				callback && callback ( id );
			};
		};

		this.ListSessions = function ( callback ) {
			var trans = db.transaction(['sessions'], 'readonly');
			var object_store = trans.objectStore('sessions');
			var req = object_store.openCursor();
			var ret = [];

			req.onerror = function(event) {
			   console.error("error fetching data");
			};
			req.onsuccess = function(event) {
			   var cursor = event.target.result;
			   if (cursor) {

			       var value = cursor.value;

			       if (value.id !== '__auto__') ret.push (value);
			       cursor.continue();
			   }
			   else {
					var rr = ret.sort(function compare( a, b ) {
						  if ( a.created > b.created ){
						    return -1;
						  }
						  if ( a.created < b.created ){
						    return 1;
						  }
						  return 0;
					});

					callback && callback (rr);

			   }
			};
		};


		/* ===== 自動保存／自動還原（單軌）=====
		 * 以固定 id '__auto__' 存進 IndexedDB；不會出現在「本機草稿」清單。 */
		var AUTO_ID = '__auto__';

		this.AutoSave = function ( buffer, markers, callback ) {
			var q = this;
			if (!q.on || !db) { callback && callback (false); return ; }

			var comp = compressors[ compression ];
			if (!comp.ready) {
				if (!comp.loading) comp.init (function () { q.AutoSave (buffer, markers, callback); });
				else callback && callback (false);
				return ;
			}

			try {
				var arr_buffs = [], arr_buffs2 = [], tmp;
				for (var i = 0; i < buffer.numberOfChannels; ++i) {
					var arr = buffer.getChannelData ( i );
					arr_buffs2.push (arr.buffer.byteLength);
					tmp = comp.compress ( arr.buffer, 0 );
					arr_buffs.push ( tmp.buffer.slice (tmp.byteOffset, tmp.byteLength + tmp.byteOffset));
				}

				var ob = {
					id : AUTO_ID,
					name: 'autosave',
					created: new Date().getTime(),
					data: arr_buffs,
					data2: arr_buffs2,
					durr: buffer.duration.toFixed(3)/1,
					chans: buffer.numberOfChannels,
					comp: compression,
					thumb: '',
					samplerate: buffer.sampleRate,
					markers: markers || []
				};

				var trans = db.transaction(['sessions'], 'readwrite');
				trans.objectStore('sessions').put (ob);
				trans.oncomplete = function () { callback && callback (true); };
				trans.onerror = trans.onabort = function () { callback && callback (false); };
			}
			catch (err) {
				callback && callback (false);
			}
		};

		this.ClearAuto = function ( callback ) {
			try {
				var trans = db.transaction(['sessions'], 'readwrite');
				trans.objectStore('sessions').delete (AUTO_ID);
				trans.oncomplete = function () { callback && callback (); };
			} catch (err) { callback && callback (); }
		};

		(function autoInit ( q ) {
			var last_buf = null, last_mk = '', busy = false, restored = false;

			function mtOn () {
				return !!(app.multitrack && app.multitrack.IsOn && app.multitrack.IsOn ());
			}
			function mkJSON () {
				try { return JSON.stringify (app.mrk ? app.mrk.serEd () : []); } catch (e) { return ''; }
			}
			function msg ( key, fb ) {
				try {
					var s = PKLocale.t ( key );
					return s && s !== key ? s : fb;
				} catch (e) { return fb; }
			}

			function tick () {
				if (busy || !restored) return ;
				var e = app.engine;
				if (!e || !e.is_ready || !e.wavesurfer) return ;
				var ws = e.wavesurfer;
				var buf = ws.backend && ws.backend.buffer;
				if (!buf || mtOn () || e.in_fx) return ;
				if (ws.isPlaying && ws.isPlaying ()) return ;
				if (app.rec && app.rec.isActive && app.rec.isActive ()) return ;
				if (e.FXPreviewHost && e.FXPreviewHost.previewing) return ;

				var mk = mkJSON ();
				if (buf === last_buf && mk === last_mk) return ;

				busy = true;
				q.Init (function ( err ) {
					if (err) { busy = false; return ; }
					q.AutoSave (buf, app.mrk ? app.mrk.serEd () : [], function ( ok ) {
						busy = false;
						if (ok) { last_buf = buf; last_mk = mk; }
					});
				});
			}

			function restore () {
				if (w.location.href.indexOf ('local=') !== -1) { restored = true; return ; }

				q.Init (function ( err ) {
					if (err) { restored = true; return ; }
					q.GetSession (AUTO_ID, function ( rec ) {
						try {
							if (rec && rec.id === AUTO_ID && rec.data && rec.data.length &&
								app.engine && !app.engine.is_ready && !mtOn ())
							{
								app.engine.LoadDB ( rec );
								if (typeof OneUp === 'function')
									OneUp (msg ('autosave.restored', 'Restored previous session'), 1600);
							}
						} catch (e) { console.error (e); }
						restored = true;
					});
				});
			}

			setTimeout ( restore, 500 );
			setInterval ( tick, 3000 );
			w.addEventListener ('visibilitychange', function () {
				if (d.visibilityState === 'hidden') tick ();
			});
		})( this );
	};

	PKAudioEditor._deps.fls = SaveLocal;

})( window, document, PKAudioEditor );
