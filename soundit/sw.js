/* [修改] v26 → v27：新增 batch.js（批次處理）。
 * 前一次 v25 → v26：快取優先策略下，不改版本號的話，使用者會一直拿到舊的 JS（含這次的錄音與效果修改） */
const CACHE_NAME = 'soundit-v28';

const REQUIRED_ASSETS = [
	'./',
	'./index.html',
	'./theme.js',
	'./main.css',
	'./locale.js',
	'./lang-en.js',
	'./lang-zh-TW.js',
	'./lang-kasu.js',
	'./app.js',
	'./keys.js',
	'./shortcuts.js',
	'./markers.js',
	'./autosplit.js',
	'./marker-panel.js',
	'./contextmenu.js',
	'./lufs.js',
	'./ui-fx.js',
	'./ui-helpers.js',
	'./ui-menu-file.js',
	'./ui-menu-edit.js',
	'./ui-menu-effects.js',
	'./ui-menu-view.js',
	'./ui-menu-help.js',
	'./ui-menu.js',
	'./ui-menu-header.js',
	'./ui-toolbar-transport.js',
	'./ui-toolbar-actions.js',
	'./ui-toolbar-selection.js',
	'./ui-toolbar.js',
	'./ui-toolbar-layout.js',
	'./ui-mainview.js',
	'./ui.js',
	'./modal.js',
	'./state.js',
	'./engine.js',
	'./actions.js',
	'./drag.js',
	'./recorder.js',
	'./webcodecs-encoder.js',
	'./zip-store.js',
	'./batch.js',
	'./fx-pg-eq.js',
	'./fx-auto.js',
	'./local.js',
	'./id3.js',
	'./lz4-loader.js',
	'./amss-format.js',
	'./ab.js',
	'./multitrack.js',
	'./spectrogram.js',
	'./oneup.js',
	'./recorder-worklet.js',
	'./tempo-estimator.js',
	'./tempo-worker.js',
	'./wav.js',
	'./lame.js',
	'./flac.js',
	'./libflac.js',
	'./libflac.wasm',
	'./lz4-block-codec-wasm.js',
	'./lz4-block-codec.wasm',
	'./rnn_denoise.js',
	'./rnn_denoise.wasm',
	'./wavesurfer.js',
	'./wavesurfer.regions.js'
];

const OPTIONAL_ASSETS = [
	'./manifest.json',
	'./icon.png',
	'./icon-192.png',
	'./icon-512.png',
	'./LICENSE',
	'./THIRD_PARTY_NOTICES.md',
	'./eq.html',
	'./sp.html',
	'./mix.html'
];

self.addEventListener( 'install', function ( event ) {
	event.waitUntil(( async function () {
		const cache = await caches.open( CACHE_NAME );
		const failed = [];

		await Promise.all( REQUIRED_ASSETS.map( async function ( asset ) {
			try {
				await cache.add( new Request ( asset, { cache: 'reload' } ) );
			} catch ( err ) {
				failed.push( asset );
			}
		}));

		await Promise.all( OPTIONAL_ASSETS.map( function ( asset ) {
			return cache.add( new Request ( asset, { cache: 'reload' } ) ).catch( function () {
				console.warn( '[SW] Could not cache optional asset:', asset );
			});
		}));

		if ( failed.length ) {
			console.error( '[SW] Install aborted, required assets failed:', failed );
			await caches.delete( CACHE_NAME );
			throw new Error ( 'SW install failed: ' + failed.join ( ', ' ) );
		}
	})());
});

self.addEventListener( 'activate', function ( event ) {
	event.waitUntil(( async function () {
		const keys = await caches.keys();
		await Promise.all( keys.map( function ( key ) {
			if ( key !== CACHE_NAME ) return caches.delete( key );
		}));
		await self.clients.claim();
	})());
});

self.addEventListener( 'fetch', function ( event ) {
	event.respondWith( cacheFirst( event.request ) );
});

self.addEventListener( 'message', function ( event ) {
	if ( event.data === 'SKIP_WAITING' ) self.skipWaiting();
});

async function cacheFirst( request ) {
	if ( request.method !== 'GET' ) return fetch( request );

	const cachedResponse = await caches.match( request, { ignoreSearch: true } );
	if ( cachedResponse !== undefined ) return cachedResponse;

	try {
		return await fetch( request );
	} catch ( err ) {

		if ( request.mode === 'navigate' ) {
			const fallback = await caches.match( './index.html' );
			if ( fallback ) return fallback;
		}
		throw err;
	}
}


