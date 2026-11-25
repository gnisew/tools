/* [修改 9-1] v43 → v44：聲調轉換階段 4（tone-change.js：音高改幅過大警告）。
 * [修改 8-1] v42 → v43：聲調轉換階段 3（tone-change.js：逐字試聽只合成該字、改動範圍局部合成＋Worker、點圖試聽、各聲調音節數）。
 * [修改 7-1] v41 → v42：聲調轉換階段 2（tone-change.js：偵測信心值、音域基準）。
 * [修改 6-1] v40 → v41：新增 tone-systems.js、tone-change.js（聲調轉換：華語／客語／閩南語），效果選單「聲調轉換…」。
 * [修改 5-3] v39 → v40：快捷鍵（shortcuts.js）、效果選單、練習速度提示、語言檔。
 * [修改 5-2] v38 → v39：新增 practice-live.js、timepitch-live-worklet.js（播放時即時變速）。
 * [修改 5-1] v37 → v38：batch.js 加入「時間與音高」步驟。
 * [修改 4-6] v36 → v37：ui-fx-timepitch.js 加入語音／聲調（PSOLA 聲調、語速、停頓），Worker 版本 tp3 → tp9。
 * [修改 4-5] v35 → v36：新增 timepitch-f0-edit.js、timepitch-psola.js、timepitch-speech.js、ui-pitch-contour-edit.js。
 * [修改] v26 → v27：新增 batch.js（批次處理）。
 * 前一次 v25 → v26：快取優先策略下，不改版本號的話，使用者會一直拿到舊的 JS（含這次的錄音與效果修改） */
/* [修改] v44 → v45：ui-toolbar-layout.js 預設隱藏選取工具列與電平表，電平表預設放工具列（窄版）。 */
const CACHE_NAME = 'soundit-v46';

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
	'./repeat-last.js',
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
	'./timepitch-engine.js',
	'./timepitch-worker.js',
	'./timepitch-analyze.js',
	'./timepitch-f0.js',
	'./timepitch-f0-edit.js',
	'./timepitch-psola.js',
	'./timepitch-speech.js',
	'./tone-systems.js',
	'./tone-change.js',
	'./ui-pitch-contour.js',
	'./ui-pitch-contour-edit.js',
	'./ui-fx-timepitch.js',
	'./timepitch-live-worklet.js',
	'./practice-live.js',
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
