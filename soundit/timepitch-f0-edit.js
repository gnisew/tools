/* Soundit 時間與音高：F0 輪廓編輯模型（階段 4-3）
 *
 * 純邏輯、無 DOM、無相依；可在主執行緒、Worker 或 Node 載入。
 *
 *   var ed = PKF0Edit.create ( track )          track 來自 PKF0.track / trackBuffer
 *   ed.orig        原始軌跡（不會被改）
 *   ed.edited      目前編輯後的軌跡（與 orig 同結構，f0 是會被就地修改的陣列；畫面和 PSOLA 讀這個）
 *   ed.dirty ()    是否和原始不同
 *
 * 所有範圍參數都是「秒」（相對於軌跡起點）；省略 = 整段。
 *   ed.smooth  ( strength, from, to )   平滑：strength 0~1，只在連續有聲段內，對數（音分）域做高斯加權
 *   ed.flatten ( amount,   from, to )   壓平：amount 0~1，每個有聲段往自己的平均音高靠（1 = 完全平）
 *   ed.enhance ( amount,   from, to )   增強：amount 0~2，把偏離段平均的起伏放大 (1 + amount) 倍
 *   ed.shift   ( cents,    from, to )   移調：整段加減音分
 *   ed.draw    ( t0, hz0, t1, hz1 )     手繪：t0→t1 之間以直線（對數域）覆寫；只改原本有聲的幀
 *   ed.undo () / ed.redo () / ed.reset ()    復原／重做／還原成原始
 *
 *   每個會改動的方法回傳「實際被改動的幀數」；沒改動就不進復原記錄。
 *   ed.beginStroke () / ed.endStroke ()  手繪連續筆畫合併成一次復原記錄
 *
 *   PKF0Edit.compare ( a, b, from, to )  → { n, medianCents, p90Cents, maxCents }
 *      兩條軌跡逐幀比較（兩邊都有聲的幀），單位音分
 *   PKF0Edit.synth ( track, sr )          → Float32Array   依軌跡合成一條帶諧波的測試音（無聲處靜音）
 *      用來「寫回再偵測」驗證：輪廓編輯後，用 PKF0.track 重新偵測，與 edited 比對
 *
 * 內部以 log2(Hz) 運算，所以所有加減都是音程（音分）而不是 Hz。
 */
(function ( root ) {
	'use strict';

	var MAX_HISTORY = 40;

	function clamp ( v, a, b ) { return v < a ? a : v > b ? b : v; }
	function lg ( hz ) { return Math.log ( hz ) / Math.LN2; }

	function create ( track ) {
		if (!track || !track.f0) throw new Error ( 'PKF0Edit.create: need a track' );

		var n = track.n, rate = track.rate;
		var edited = {};
		for (var k in track) if (Object.prototype.hasOwnProperty.call ( track, k )) edited[k] = track[k];
		edited.f0 = new Float32Array ( track.f0 );        /* 複本；orig.f0 永遠保持原樣 */

		var cur = edited.f0, orig = track.f0;
		var undoStack = [], redoStack = [], stroke = null;

		function range ( from, to ) {
			var i0 = from === undefined || from === null ? 0 : Math.floor ( from * rate );
			var i1 = to === undefined || to === null ? n : Math.ceil ( to * rate );
			i0 = clamp ( i0, 0, n ); i1 = clamp ( i1, 0, n );
			return i1 > i0 ? [ i0, i1 ] : null;
		}

		/* 把 [i0,i1) 內連續有聲的段切出來：回傳 [[s,e), …] */
		function runs ( i0, i1 ) {
			var out = [], s = -1, i;
			for (i = i0; i <= i1; ++i) {
				var on = i < i1 && cur[i] > 0;
				if (on && s < 0) s = i;
				else if (!on && s >= 0) { out.push ( [ s, i ] ); s = -1; }
			}
			return out;
		}

		function snapshot () { return new Float32Array ( cur ); }

		/* 以「改動前快照」包住一個會改動的操作；沒有幀被改就丟棄快照 */
		function mutate ( fn ) {
			var before = snapshot ();
			var changed = fn ();
			if (!changed) return 0;
			if (stroke) { if (!stroke.before) stroke.before = before; }
			else pushUndo ( before );
			return changed;
		}

		function pushUndo ( before ) {
			undoStack.push ( before );
			if (undoStack.length > MAX_HISTORY) undoStack.shift ();
			redoStack.length = 0;
		}

		function countDiff ( a, b ) {
			var c = 0;
			for (var i = 0; i < n; ++i) if (a[i] !== b[i]) ++c;
			return c;
		}

		/* ---------- 平滑 ---------- */
		function smooth ( strength, from, to ) {
			var r = range ( from, to );
			if (!r) return 0;
			strength = clamp ( +strength || 0, 0, 1 );
			if (strength <= 0) return 0;
			/* 高斯 σ：0.5 幀（幾乎不動）～ 12 幀（10 ms 跳距 → 120 ms） */
			var sigma = 0.5 + strength * 11.5, rad = Math.ceil ( sigma * 3 ), kern = new Float64Array ( rad + 1 ), j;
			for (j = 0; j <= rad; ++j) kern[j] = Math.exp ( -0.5 * j * j / ( sigma * sigma ) );

			return mutate ( function () {
				var src = new Float32Array ( cur ), rs = runs ( r[0], r[1] ), q, i;
				for (q = 0; q < rs.length; ++q) {
					var s = rs[q][0], e = rs[q][1];
					/* 先做三點中值，去掉單幀尖刺（偵測的小跳動），再做高斯 */
					var med = new Float64Array ( e - s );
					for (i = s; i < e; ++i) {
						var a = lg ( src[Math.max ( s, i - 1 )] ), b = lg ( src[i] ), c = lg ( src[Math.min ( e - 1, i + 1 )] );
						med[i - s] = Math.max ( Math.min ( a, b ), Math.min ( Math.max ( a, b ), c ) );
					}
					for (i = s; i < e; ++i) {
						var sum = 0, wsum = 0;
						for (j = -rad; j <= rad; ++j) {
							var p = i + j;
							if (p < s || p >= e) continue;            /* 邊界：只用段內的，不外推 */
							var wgt = kern[Math.abs ( j )];
							sum += med[p - s] * wgt; wsum += wgt;
						}
						/* 強度低時，與原值混合，避免 0.1 就大幅變形 */
						var sm = sum / wsum, orgv = lg ( src[i] );
						cur[i] = Math.pow ( 2, orgv + ( sm - orgv ) * Math.min ( 1, strength * 1.5 ) );
					}
				}
				return countDiff ( src, cur );
			});
		}

		/* ---------- 壓平 / 增強（都是相對各有聲段的平均） ---------- */
		function pull ( factor, from, to ) {
			var r = range ( from, to );
			if (!r) return 0;
			return mutate ( function () {
				var src = new Float32Array ( cur ), rs = runs ( r[0], r[1] ), q, i;
				for (q = 0; q < rs.length; ++q) {
					var s = rs[q][0], e = rs[q][1], m = 0;
					for (i = s; i < e; ++i) m += lg ( src[i] );
					m /= ( e - s );
					for (i = s; i < e; ++i) cur[i] = Math.pow ( 2, m + ( lg ( src[i] ) - m ) * factor );
				}
				return countDiff ( src, cur );
			});
		}
		function flatten ( amount, from, to ) { return pull ( 1 - clamp ( +amount || 0, 0, 1 ), from, to ); }
		function enhance ( amount, from, to ) { return pull ( 1 + clamp ( +amount || 0, 0, 2 ), from, to ); }

		/* ---------- 移調 ---------- */
		function shift ( cents, from, to ) {
			var r = range ( from, to );
			cents = +cents || 0;
			if (!r || cents === 0) return 0;
			var mul = Math.pow ( 2, cents / 1200 );
			return mutate ( function () {
				var c = 0;
				for (var i = r[0]; i < r[1]; ++i) {
					if (!( cur[i] > 0 )) continue;
					var v = clamp ( cur[i] * mul, 20, 4000 );        /* 保守上下限，避免亂拖出不合理值 */
					if (v !== cur[i]) { cur[i] = v; ++c; }
				}
				return c;
			});
		}

		/* ---------- 手繪 ---------- */
		function draw ( t0, hz0, t1, hz1 ) {
			if (!( hz0 > 0 ) || !( hz1 > 0 )) return 0;
			if (t1 < t0) { var tt = t0; t0 = t1; t1 = tt; var hh = hz0; hz0 = hz1; hz1 = hh; }
			var i0 = clamp ( Math.round ( t0 * rate ), 0, n - 1 ), i1 = clamp ( Math.round ( t1 * rate ), 0, n - 1 );
			var l0 = lg ( hz0 ), l1 = lg ( hz1 );
			return mutate ( function () {
				var c = 0;
				for (var i = i0; i <= i1; ++i) {
					if (!( orig[i] > 0 )) continue;                   /* 只改原本有聲的幀，PSOLA 才有週期可用 */
					var f = i1 === i0 ? 1 : ( i - i0 ) / ( i1 - i0 );
					var v = clamp ( Math.pow ( 2, l0 + ( l1 - l0 ) * f ), 20, 4000 );
					if (v !== cur[i]) { cur[i] = v; ++c; }
				}
				return c;
			});
		}

		/* 連續筆畫：beginStroke 到 endStroke 之間的 draw 合併成一次復原 */
		function beginStroke () { stroke = { before: null }; }
		function endStroke () {
			var s = stroke; stroke = null;
			if (s && s.before) pushUndo ( s.before );
		}

		/* ---------- 復原／重做 ---------- */
		function undo () {
			if (stroke) endStroke ();
			if (!undoStack.length) return false;
			redoStack.push ( snapshot () );
			cur.set ( undoStack.pop () );
			return true;
		}
		function redo () {
			if (!redoStack.length) return false;
			undoStack.push ( snapshot () );
			cur.set ( redoStack.pop () );
			return true;
		}
		function reset () {
			if (stroke) endStroke ();
			if (!dirty ()) return false;
			pushUndo ( snapshot () );                                /* 「還原原始」本身也可復原 */
			cur.set ( orig );
			return true;
		}
		function dirty () {
			for (var i = 0; i < n; ++i) if (cur[i] !== orig[i]) return true;
			return false;
		}

		return {
			orig: track, edited: edited,
			smooth: smooth, flatten: flatten, enhance: enhance, shift: shift, draw: draw,
			beginStroke: beginStroke, endStroke: endStroke,
			undo: undo, redo: redo, reset: reset, dirty: dirty,
			canUndo: function () { return undoStack.length > 0 || !!( stroke && stroke.before ); },
			canRedo: function () { return redoStack.length > 0; }
		};
	}

	/* ---------- 比較兩條軌跡（音分） ---------- */
	function compare ( a, b, from, to ) {
		var rate = Math.min ( a.rate, b.rate ), n = Math.min ( a.n, b.n );
		var i0 = Math.max ( 0, Math.floor ( ( from || 0 ) * rate ) ), i1 = Math.min ( n, to !== undefined && to !== null ? Math.ceil ( to * rate ) : n );
		var d = [], i;
		for (i = i0; i < i1; ++i) {
			if (a.f0[i] > 0 && b.f0[i] > 0) d.push ( Math.abs ( 1200 * Math.log ( a.f0[i] / b.f0[i] ) / Math.LN2 ) );
		}
		d.sort ( function ( x, y ) { return x - y; } );
		var m = d.length;
		return { n: m, medianCents: m ? d[Math.floor ( m * 0.5 )] : 0, p90Cents: m ? d[Math.min ( m - 1, Math.floor ( m * 0.9 ) )] : 0, maxCents: m ? d[m - 1] : 0 };
	}

	/* ---------- 由軌跡合成測試音（相位累加，前 6 個諧波，無聲處靜音） ---------- */
	function synth ( track, sr ) {
		var secs = track.n / track.rate, len = Math.round ( secs * sr ), out = new Float32Array ( len );
		var phase = 0, amp = 0, W = 2 * Math.PI / sr, H = [ 1, 0.6, 0.4, 0.25, 0.15, 0.1 ], norm = 0, h, i;
		for (h = 0; h < H.length; ++h) norm += H[h];
		for (i = 0; i < len; ++i) {
			var x = i / sr * track.rate, k = Math.floor ( x ), fr = x - k;
			var a = track.f0[Math.min ( track.n - 1, k )], b = track.f0[Math.min ( track.n - 1, k + 1 )], f;
			if (a > 0 && b > 0) f = Math.exp ( Math.log ( a ) + ( Math.log ( b ) - Math.log ( a ) ) * fr );
			else f = a > 0 ? a : 0;
			amp += ( ( f > 0 ? 1 : 0 ) - amp ) * 0.002;           /* 淡入淡出，避免爆音 */
			if (f > 0) {
				phase += f * W;
				if (phase > 2 * Math.PI) phase -= 2 * Math.PI;
				var s = 0;
				for (h = 0; h < H.length; ++h) if (f * ( h + 1 ) < sr * 0.45) s += H[h] * Math.sin ( phase * ( h + 1 ) );
				out[i] = 0.5 * amp * s / norm * 2;
			}
		}
		return out;
	}

	root.PKF0Edit = { create: create, compare: compare, synth: synth, version: 1 };
	if (typeof module !== 'undefined' && module.exports) module.exports = root.PKF0Edit;
})( typeof self !== 'undefined' ? self : this );


