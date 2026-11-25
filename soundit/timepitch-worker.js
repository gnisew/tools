/* Soundit 時間／音高 Worker：把運算移出主執行緒，畫面不再卡住 */
/* [修改 4-4] v=tp3 → tp4；[新增] 載入 timepitch-f0.js（PSOLA 沒給 f0 時自行分析用）與 timepitch-psola.js */
/* [修改 4-5] engine tp4 → tp5；[新增] 載入 timepitch-speech.js（mode: 'retime' 語速／停頓重排） */
importScripts ('timepitch-engine.js?v=tp5', 'timepitch-f0.js?v=tp5', 'timepitch-psola.js?v=tp7', 'timepitch-speech.js?v=tp8');

self.onmessage = function ( e ) {
	var m = e.data || {};
	try {
		var chs = m.buffers.map ( function ( b ) { return new Float32Array ( b ); } );
		var opts = m.opts || {};
		opts.onprogress = function ( p ) { self.postMessage ({ id: m.id, progress: p }); };
		var out = self.PKTimePitch.process ( chs, m.sr, opts );
		self.postMessage ({ id: m.id, done: true, buffers: out.map ( function ( a ) { return a.buffer; } ) },
			out.map ( function ( a ) { return a.buffer; } ));
	} catch ( err ) {
		self.postMessage ({ id: m.id, error: String ( err && err.message || err ) });
	}
};


