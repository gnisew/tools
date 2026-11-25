/* ==========================================================================
 * autosplit.js  —  依靜音 / 聲音特性變化，自動在波形上加入分割標記
 *
 * 對外介面：PKAudioEditor._deps.autosplit
 *   .open ( app )                           開啟「自動分割標記」對話框
 *   .analyze ( buf, opts, job, prog, done ) 分析 AudioBuffer，done ( 分割點秒數陣列 )
 *   .detectSegments ( app, mode, range, prog, done )
 *                                           給匯出對話框用：直接回傳 [[起, 迄, ''], ...]
 *   .loadOpts () / .saveOpts ( o )          最近一次使用的參數（localStorage: pk_autosplit）
 *   .T ( key, vars )                        本檔內建的中／英文字串
 *   .segmentsFromDb ( db, f0, hs, opts, lo, hi, dropped )  純函式；dropped 傳入陣列時，被「最短有效句段」濾掉的片段會放進去（[預覽]）
 *   .nameSegs ( segs, opts, existing )      依名稱範本替每一段取名，回傳名稱陣列（[命名範本]）
 *
 * 不需要改動 lang-*.js：字串都放在本檔，繁體中文系（zh / kasu）顯示中文，其餘顯示英文。
 * ========================================================================== */
(function ( w, d, PKAE ) {
	'use strict';

	/* ------------------------------------------------------------------
	 * 字串
	 * ------------------------------------------------------------------ */
	/* 字串已搬到 lang-*.js（鍵名前綴 asp.） */

	function lang () {
		var l = '';
		try { l = PKLocale.getLang () || ''; } catch (e) {}
		return /^(zh|kasu|hak)/i.test (l) ? 'zh' : 'en';
	}

	/* [有聲句段] 新增字串放在這裡（不必改 lang-*.js）；語言檔若有同名 asp.* 鍵，以語言檔為準 */
	var EXTRA = {
		zh: { mode_sp: '有聲句段', endoff: '結束門檻（比開始低）', minspeech: '最短有效句段',
			pad: '前後留白', maxseg: '最長句段', mergeshort: '合併過短碎片',
			detect: '偵測模式', det_peak: '峰值（靈敏，預設）', det_rms: 'RMS（平滑，減少爆音誤切）', sp_speech: '依有聲句段自動分割（每句一檔）',
			same: '與開始相同', unlimited: '不限制', off: '不合併', reset: '恢復預設',
			est: '預估 <b>{n}</b> 句　共 {s} 秒・占範圍 {p}%', est_none: '找不到句段，請調低音量門檻或縮短最短有效句段', est_na: '（預估僅適用於「有聲句段」）', sec: ' 秒',
				nm_tpl: '名稱範本', nm_start: '起始編號', nm_cont: '接續現有編號（避免重複）', nm_gap: '長停頓換組',
				nm_gap_off: '不分組', nm_ex: '範例：', pv: '在聲波上預覽（對話框靠底部停靠）', pvdrop: '顯示被丟掉的片段（灰色）',
				nm_hint: '可用：{n} {nn} 序號｜{g} 組別字母｜{gn} {gnn} 組內序號｜{start} 起點｜{dur} 長度',
			/* [介面簡化] 對話框改版用的字串 */
			mode_sil_s: '依靜音', mode_chg_s: '聲音變化', mode_lbl: '分割方式', adv: '進階設定', pv_s: '在聲波上預覽', range_s: '建立為區間標記（聲波顯示整段）',
			col: '收合／展開', col_tip: '收合成一列，露出聲波（再按一次展開）', drag_tip: '拖曳標題列可移動視窗（連點兩下回到原位）',
			d_sp: '找出每一句有聲音的區段，逐句建立標記。適合朗讀、對話、語言教材，可在聲波上即時預覽。',
			d_sil: '在每一段夠長的靜音中間放一個切點。適合停頓明顯的錄音，可在聲波上即時預覽。第一個標記會放在第一次停頓處（開頭不加）。',
			est_sil: '預估新增 <b>{n}</b> 個標記（切成 {m} 段）', est_sil_none: '找不到切點，請調高音量門檻或縮短最短靜音',
			d_chg: '偵測講者、音色或樂段改變的位置。適合多人對話或混合內容。此方式沒有預覽。',
			thr_sp: '音量門檻（高於才算有聲）',
			h_thr_sp: '音量高於此值才算「有聲」。往右＝只抓較大聲的；往左＝連小聲也抓。切出太多雜音時，往右調。',
			h_thr_sil: '音量低於此值視為「靜音」。往右＝更容易判成靜音，切點變多。',
			h_minsil: '停頓要持續多久才算「一句結束」。調大＝換氣等短暫停頓不會被切開。',
			h_place: '切點放在靜音正中間，或放在下一段聲音開始之前。',
			h_minspeech: '比這個短的聲音（咳嗽、點擊聲）會被丟掉。',
			h_pad: '每句前後多留一點空白，避免字頭、字尾被切掉。',
			h_endoff: '句子結束時改用較低的門檻，避免尾音被截斷。「與開始相同」＝不額外降低。',
			h_maxseg: '超過這個長度的句子，會在最安靜的地方自動切開。「不限制」＝不切。',
			h_merge: '把短於此長度的碎片併入相鄰的句子。「不合併」＝不處理。',
			h_detect: '峰值較靈敏；RMS 較平滑，不容易被爆音誤切。',
			h_sens: '越高，分得越細。',
			h_win: '比較切點前後各幾秒的聲音差異。',
			h_minseg: '兩個切點之間至少要隔多久。',
			h_gap: '兩句之間停頓超過此值，編號會換成下一組（A、B、C…）。' },
		en: { mode_sp: 'Speech segments', endoff: 'End threshold (below start)', minspeech: 'Minimum segment',
			pad: 'Padding before/after', maxseg: 'Maximum segment', mergeshort: 'Merge short fragments',
			detect: 'Detection', det_peak: 'Peak (sensitive, default)', det_rms: 'RMS (smooth, fewer false cuts on clicks)', sp_speech: 'Auto split by speech segments (one file each)',
			same: 'Same as start', unlimited: 'Unlimited', off: 'Off', reset: 'Reset to defaults',
			est: 'About <b>{n}</b> segments　{s} s total・{p}% of range', est_none: 'No segments found. Lower the threshold or shorten the minimum segment.', est_na: '(Estimate is for Speech segments only)', sec: ' s',
				nm_tpl: 'Name template', nm_start: 'Start number', nm_cont: 'Continue existing numbering (avoid duplicates)', nm_gap: 'New group after long pause',
				nm_gap_off: 'No grouping', nm_ex: 'Example: ', pv: 'Preview on waveform (dialog docks at the bottom)', pvdrop: 'Show discarded fragments (gray)',
				nm_hint: 'Fields: {n} {nn} number | {g} group letter | {gn} {gnn} number in group | {start} start time | {dur} length',
			mode_sil_s: 'By silence', mode_chg_s: 'Sound change', mode_lbl: 'Split method', adv: 'Advanced', pv_s: 'Preview on waveform', range_s: 'Create range markers (show whole segment)',
			col: 'Collapse / expand', col_tip: 'Collapse to one row to see the waveform (click again to expand)', drag_tip: 'Drag the title bar to move (double-click to reset)',
			d_sp: 'Finds each stretch of sound and makes one marker per sentence. Good for reading, dialogue and language material. Live preview on the waveform.',
			d_sil: 'Puts a cut in the middle of every long-enough silence. Good for recordings with clear pauses. Live preview on the waveform. The first marker goes at the first pause (none at the start).',
			est_sil: 'About <b>{n}</b> markers will be added ({m} segments)', est_sil_none: 'No cuts found. Raise the threshold or shorten the minimum silence.',
			d_chg: 'Finds where the speaker, timbre or musical section changes. Good for multi-speaker or mixed content. No preview in this method.',
			thr_sp: 'Volume threshold (above = sound)',
			h_thr_sp: 'Anything louder than this counts as sound. Right = only louder parts; left = quiet parts too. Move right if you get too many noise segments.',
			h_thr_sil: 'Anything quieter than this counts as silence. Right = silence is detected more easily, more cuts.',
			h_minsil: 'How long a pause must last to end a sentence. Larger = short breaths do not split.',
			h_place: 'Put the cut in the middle of the silence, or just before the next sound.',
			h_minspeech: 'Sounds shorter than this (coughs, clicks) are discarded.',
			h_pad: 'Extra room before and after each sentence so word starts and ends are not clipped.',
			h_endoff: 'Use a lower threshold at the end of a sentence so tails are not cut. "Same as start" = no extra drop.',
			h_maxseg: 'Sentences longer than this are split at the quietest point. "Unlimited" = never split.',
			h_merge: 'Fragments shorter than this are merged into a neighbor. "Off" = leave them.',
			h_detect: 'Peak is more sensitive; RMS is smoother and less fooled by clicks.',
			h_sens: 'Higher = finer splitting.',
			h_win: 'Compare the sound this many seconds before and after each cut.',
			h_minseg: 'Minimum distance between two cuts.',
			h_gap: 'When the pause between two sentences exceeds this, numbering moves to the next group (A, B, C…).' }
	};

	function T ( key, vars ) {
		var k = 'asp.' + key, s = PKLocale.t (k, vars);
		if (s === k && EXTRA[lang ()][key]) {
			s = EXTRA[lang ()][key];
			if (vars) s = s.replace (/\{(\w+)\}/g, function ( m, n ) { return vars[n] === undefined ? m : vars[n]; });
		}
		return s;
	}

	/* ------------------------------------------------------------------
	 * 參數（記住上次的設定）
	 * ------------------------------------------------------------------ */
	var KEY = 'pk_autosplit';
	var DEF = { mode: 'speech', thr: -45, minSil: 0.5, place: 'mid', sens: 1.8, win: 2, minSeg: 1, selOnly: false, replace: false, range: true, endOff: 0, minSpeech: 0.5, pad: 0.2, maxSeg: 0, mergeShort: 0, detect: 'peak', nameTpl: '', startNum: 1, contNum: false, groupGap: 0, pv: true, pvDrop: true };

	function num ( v, lo, hi, def ) {
		v = parseFloat (v);
		return isNaN (v) ? def : Math.max (lo, Math.min (hi, v));
	}

	function clean ( o ) {
		o = o || {};
		return {
			mode: o.mode === 'change' ? 'change' : o.mode === 'silence' ? 'silence' : 'speech',
			thr: num (o.thr, -90, -10, DEF.thr),
			minSil: num (o.minSil, 0.05, 60, DEF.minSil),
			place: o.place === 'sound' ? 'sound' : 'mid',
			sens: num (o.sens, 0.5, 4, DEF.sens),
			win: num (o.win, 0.5, 15, DEF.win),
			minSeg: num (o.minSeg, 0.1, 600, DEF.minSeg),
			selOnly: !!o.selOnly,
			replace: !!o.replace,
			endOff: num (o.endOff, 0, 30, DEF.endOff),
			minSpeech: num (o.minSpeech, 0, 10, DEF.minSpeech),
			pad: num (o.pad, 0, 2, DEF.pad),
			maxSeg: num (o.maxSeg, 0, 3600, DEF.maxSeg),
			mergeShort: num (o.mergeShort, 0, 10, DEF.mergeShort),
			detect: o.detect === 'rms' ? 'rms' : 'peak',
			nameTpl: typeof o.nameTpl === 'string' ? o.nameTpl.replace (/[\r\n\t]/g, ' ').substr (0, 40) : '',	/* [命名範本] 空字串＝預設（段{nn}） */
			startNum: Math.round (num (o.startNum, 0, 9999, DEF.startNum)),
			contNum: !!o.contNum,
			groupGap: num (o.groupGap, 0, 60, DEF.groupGap),
			pv: o.pv === undefined ? DEF.pv : !!o.pv,	/* [預覽] 在聲波上預覽（只有單軌的「有聲句段」） */
			pvDrop: o.pvDrop === undefined ? DEF.pvDrop : !!o.pvDrop,
			range: o.range === undefined ? DEF.range : !!o.range	/* [標籤列 階段 1] 預設建立「區間標記」，聲波上會顯示整段的色帶與名稱 */
		};
	}

	function loadOpts () {
		try { return clean (JSON.parse (w.localStorage.getItem (KEY) || '{}')); } catch (e) { return clean (); }
	}

	function saveOpts ( o ) {
		try { w.localStorage.setItem (KEY, JSON.stringify (clean (o))); } catch (e) {}
	}


	/* ------------------------------------------------------------------
	 * [命名範本] 欄位：{n} {nn} {nnn} 序號（不補零／補 2／補 3 位）、{g} 組別字母、{gn} {gnn} 組內序號、
	 *            {start} 起點時間（m:ss.s）、{dur} 長度。預設範本「段{nn}」＝舊版的「段01」。
	 * 分組：相鄰兩句的間隔超過 groupGap 秒就換下一組（A、B、C…），組內序號重新從 1 算；0＝不分組。
	 * ------------------------------------------------------------------ */
	var FIELD = /\{(nnn|nn|n|gnn|gn|g|start|dur)\}/g;

	function tplOf ( o ) { return o && o.nameTpl && o.nameTpl.trim () ? o.nameTpl : T ('seg') + '{nn}'; }
	function padN ( n, w ) { var s = String (n); while (s.length < w) s = '0' + s; return s; }
	function one ( v ) { return String (+(+v).toFixed (1)); }

	function letters ( i ) {	/* 0→A … 25→Z、26→AA */
		var s = '';
		i = Math.max (0, i | 0);
		do { s = String.fromCharCode (65 + i % 26) + s; i = Math.floor (i / 26) - 1; } while (i >= 0);
		return s;
	}

	function fstart ( t ) {	/* 0:09.2；先換成「十分之一秒」的整數再拆，避免 59.96 變成 0:60.0 */
		var tt = Math.max (0, Math.round (t * 10)), m = Math.floor (tt / 600), s10 = tt - m * 600;
		return m + ':' + (s10 < 100 ? '0' : '') + (s10 / 10).toFixed (1);
	}

	function renderName ( tpl, f ) {
		return tpl.replace (FIELD, function ( m, k ) {
			switch (k) {
				case 'n': return String (f.n);
				case 'nn': return padN (f.n, 2);
				case 'nnn': return padN (f.n, 3);
				case 'g': return letters (f.g);
				case 'gn': return String (f.gn);
				case 'gnn': return padN (f.gn, 2);
				case 'start': return fstart (f.s[0]);
				case 'dur': return one (f.s[1] - f.s[0]) + T ('sec');
			}
			return m;
		});
	}

	function hasNum ( tpl ) { return /\{(n|nn|nnn)\}/.test (tpl); }

	/* 現有名稱中，符合範本的最大序號 + 1；沒有任何符合的就回傳 null */
	function nextNum ( tpl, existing ) {
		var parts = tpl.split (/(\{\w+\})/), src = '', got = false, i, p, max = -1, m, v;
		for (i = 0; i < parts.length; ++i) {
			p = parts[i];
			if (/^\{(n|nn|nnn)\}$/.test (p)) { src += got ? '\\d+' : '(\\d+)'; got = true; }
			else if (/^\{(g|gn|gnn)\}$/.test (p)) src += '[A-Z]*\\d*';
			else if (/^\{(start|dur)\}$/.test (p)) src += '.*?';
			else src += p.replace (/[.*+?^${}()|[\]\\]/g, '\\$&');
		}
		if (!got) return null;
		var re = new RegExp ('^' + src + '$');
		for (i = 0; i < existing.length; ++i) {
			m = re.exec (existing[i] || '');
			if (m) { v = parseInt (m[1], 10); if (v > max) max = v; }
		}
		return max < 0 ? null : max + 1;
	}

	/* segs：[[起, 迄], ...]（依時間排序）。existing：現有標記名稱（只有勾選「接續現有編號」才會用到）。回傳名稱陣列 */
	function nameSegs ( segs, o, existing ) {
		var tpl = tplOf ( o ), start = o && o.startNum !== undefined ? o.startNum : 1, gap = o ? o.groupGap : 0;
		var out = [], g = 0, gn = 0, i, nx, nm;
		if (o && o.contNum && existing && hasNum ( tpl )) {
			nx = nextNum ( tpl, existing );
			if (nx !== null) start = Math.max (start, nx);
		}
		for (i = 0; i < segs.length; ++i) {
			if (i > 0 && gap > 0 && segs[i][0] - segs[i - 1][1] > gap) { ++g; gn = 0; }
			++gn;
			nm = renderName ( tpl, { n: start + i, g: g, gn: gn, s: segs[i] }).trim ();
			out.push ( nm || T ('seg') + padN (start + i, 2) );
		}
		return out;
	}

	function namesOf ( list ) { for (var i = 0, a = []; i < list.length; ++i) a.push ( list[i].name ); return a; }

	/* ------------------------------------------------------------------
	 * 分析：分段執行，避免卡住畫面
	 * ------------------------------------------------------------------ */
	function loopChunks ( n, perTick, fn, job, prog, done ) {
		var i = 0;
		(function tick () {
			if (job.canceled) return ;
			var end = Math.min (n, i + perTick);
			for (; i < end; ++i) fn (i);
			prog && prog (n ? i / n : 1);
			if (i < n) w.setTimeout (tick, 0);
			else done ();
		})();
	}

	function channelsOf ( buf ) {
		for (var c = 0, a = []; c < buf.numberOfChannels; ++c) a[c] = buf.getChannelData (c);
		return a;
	}

	/* 依靜音：每 10ms 算一次 RMS（dB），找出夠長的靜音段，在其中放標記 */
	function silenceCuts ( buf, o, job, prog, done ) {
		var sr = buf.sampleRate, chs = channelsOf (buf), nch = chs.length;
		var hop = Math.max (1, Math.round (sr * 0.01)), hs = hop / sr;
		var n = Math.floor (buf.length / hop);
		var db = new Float32Array ( n );

		loopChunks (n, 20000, function ( i ) {
			var s = i * hop, e = s + hop, sum = 0, c, j, v, x;
			for (c = 0; c < nch; ++c) {
				x = chs[c];
				for (j = s; j < e; ++j) { v = x[j]; sum += v * v; }
			}
			db[i] = 10 * Math.log10 (sum / (hop * nch) + 1e-12);
		}, job, prog, function () { done (silenceCutsFromDb (db, hs, o)); });
	}

	/* 純函式：音量包絡（每 10 ms 一個 RMS dB）→ 靜音切點（秒）。[預覽] 對話框用同一份包絡即時重算，結果與實際加入的完全一致 */
	function silenceCutsFromDb ( db, hs, o ) {
			var n = db.length, runs = [], merged = [], cuts = [], a = -1, i, r, last, mid, t;

			for (i = 0; i <= n; ++i) {
				var sil = i < n && db[i] < o.thr;
				if (sil && a < 0) a = i;
				else if (!sil && a >= 0) { runs.push ([a, i]); a = -1; }
			}
			/* 中間只夾著不到 40ms 的短促聲響（爆音、點擊）→ 視為同一段靜音 */
			for (i = 0; i < runs.length; ++i) {
				r = runs[i]; last = merged[merged.length - 1];
				if (last && r[0] - last[1] < 4) last[1] = r[1];
				else merged.push ([r[0], r[1]]);
			}
			for (i = 0; i < merged.length; ++i) {
				r = merged[i];
				if (r[0] === 0 || r[1] === n) continue;	/* 開頭、結尾的靜音不切 */
				if ((r[1] - r[0]) * hs < o.minSil) continue;
				mid = (r[0] + r[1]) / 2 * hs;
				t = o.place === 'sound' ? Math.max (mid, r[1] * hs - 0.1) : mid;
				cuts.push (t);
			}
			return cuts;
	}

	/* 依聲音特性變化：每 50ms 取 12 個頻帶的能量（dB），
	 * 比較「這一刻之前 N 秒」與「之後 N 秒」的平均頻譜差距，差距出現峰值的地方就是分割點。
	 * 講者換人、音色改變、說話↔音樂、音量段落改變都會有明顯的峰值。 */
	function changeCuts ( buf, o, job, prog, done ) {
		var sr = buf.sampleRate, chs = channelsOf (buf), nch = chs.length;
		var N = 1024, B = 12, hopS = 0.05, hop = Math.max (1, Math.round (sr * hopS));
		var n = Math.floor ((buf.length - N) / hop) + 1;
		if (n < 16) { done ([]); return ; }

		/* FFT 與頻帶表 */
		var re = new Float32Array (N), im = new Float32Array (N), win = new Float32Array (N);
		var rev = new Uint16Array (N), cs = new Float32Array (N / 2), sn = new Float32Array (N / 2);
		var i, j, k, b, bits = 10;
		for (i = 0; i < N; ++i) {
			win[i] = 0.5 - 0.5 * Math.cos (2 * Math.PI * i / (N - 1));
			for (j = 0, k = i, rev[i] = 0; j < bits; ++j, k >>= 1) rev[i] = (rev[i] << 1) | (k & 1);
		}
		for (i = 0; i < N / 2; ++i) { cs[i] = Math.cos (2 * Math.PI * i / N); sn[i] = Math.sin (2 * Math.PI * i / N); }

		var fmin = 100, fmax = Math.min (8000, sr / 2 * 0.95), bLo = [], bHi = [];
		for (b = 0; b < B; ++b) {
			var f0 = fmin * Math.pow (fmax / fmin, b / B), f1 = fmin * Math.pow (fmax / fmin, (b + 1) / B);
			bLo[b] = Math.max (1, Math.floor (f0 * N / sr));
			bHi[b] = Math.min (N / 2, Math.max (bLo[b] + 1, Math.floor (f1 * N / sr)));
		}

		function fft () {
			var a, c, t, size, half, step, ar, ai, tr, ti;
			for (a = 0; a < N; ++a) {
				c = rev[a];
				if (c > a) { t = re[a]; re[a] = re[c]; re[c] = t; t = im[a]; im[a] = im[c]; im[c] = t; }
			}
			for (size = 2; size <= N; size <<= 1) {
				half = size >> 1; step = N / size;
				for (a = 0; a < N; a += size) {
					for (c = 0, t = 0; c < half; ++c, t += step) {
						ar = a + c; ai = ar + half;
						tr = re[ai] * cs[t] + im[ai] * sn[t];
						ti = im[ai] * cs[t] - re[ai] * sn[t];
						re[ai] = re[ar] - tr; im[ai] = im[ar] - ti;
						re[ar] += tr; im[ar] += ti;
					}
				}
			}
		}

		var F = new Float32Array (n * B), maxdb = -200;

		loopChunks (n, 150, function ( f ) {
			var s = f * hop, c, v, e, p, q;
			for (j = 0; j < N; ++j) {
				v = 0;
				for (c = 0; c < nch; ++c) v += chs[c][s + j];
				re[j] = v / nch * win[j]; im[j] = 0;
			}
			fft ();
			for (p = 0; p < B; ++p) {
				e = 0;
				for (q = bLo[p]; q < bHi[p]; ++q) e += re[q] * re[q] + im[q] * im[q];
				v = 10 * Math.log10 (e / (bHi[p] - bLo[p]) + 1e-9);
				F[f * B + p] = v;
				if (v > maxdb) maxdb = v;
			}
		}, job, function ( p ) { prog && prog (p * 0.95); }, function () {
			/* 地板：比最大值低 80dB 以下的當作無聲，避免數位靜音的 -100dB 把其他變化壓扁 */
			var floor = maxdb - 80, mean = new Float64Array (B), sd = new Float64Array (B), v, d0;
			for (i = 0; i < n * B; ++i) if (F[i] < floor) F[i] = floor;
			for (i = 0; i < n; ++i) for (b = 0; b < B; ++b) mean[b] += F[i * B + b];
			for (b = 0; b < B; ++b) mean[b] /= n;
			for (i = 0; i < n; ++i) for (b = 0; b < B; ++b) { d0 = F[i * B + b] - mean[b]; sd[b] += d0 * d0; }
			for (b = 0; b < B; ++b) sd[b] = Math.sqrt (sd[b] / n) || 1;
			for (i = 0; i < n; ++i) for (b = 0; b < B; ++b) F[i * B + b] = (F[i * B + b] - mean[b]) / sd[b];

			/* 前綴和，用來快速算「前後 W 幀」的平均 */
			var P = new Float64Array ((n + 1) * B);
			for (i = 0; i < n; ++i) for (b = 0; b < B; ++b) P[(i + 1) * B + b] = P[i * B + b] + F[i * B + b];

			var W = Math.max (4, Math.round (o.win / hopS)), nov = new Float32Array (n), ss, a1, a2, ww;
			for (i = 1; i < n; ++i) {
				ww = Math.min (W, i, n - i);
				if (ww < Math.max (3, W / 4)) continue;
				ss = 0;
				for (b = 0; b < B; ++b) {
					a1 = (P[i * B + b] - P[(i - ww) * B + b]) / ww;
					a2 = (P[(i + ww) * B + b] - P[i * B + b]) / ww;
					ss += (a1 - a2) * (a1 - a2);
				}
				nov[i] = Math.sqrt (ss / B);
			}

			var nm = 0, ns = 0;
			for (i = 0; i < n; ++i) nm += nov[i];
			nm /= n;
			for (i = 0; i < n; ++i) ns += (nov[i] - nm) * (nov[i] - nm);
			ns = Math.sqrt (ns / n);
			var thr = nm + o.sens * ns;

			/* 取區域最大值 → 依強度排序 → 與已選的點距離不小於「最短片段」 */
			var r = Math.max (2, Math.round (Math.max (o.minSeg, o.win) * 0.5 / hopS)), cand = [], ok, m;
			for (i = 1; i < n; ++i) {
				if (nov[i] < thr) continue;
				ok = true;
				for (m = Math.max (0, i - r); m <= Math.min (n - 1, i + r); ++m)
					if (nov[m] > nov[i] || (nov[m] === nov[i] && m < i)) { ok = false; break; }
				if (ok) cand.push (i);
			}
			cand.sort (function ( x, y ) { return nov[y] - nov[x]; });

			var minD = Math.max (1, Math.round (o.minSeg / hopS)), pick = [], cuts = [];
			for (i = 0; i < cand.length && pick.length < 500; ++i) {
				ok = true;
				for (m = 0; m < pick.length; ++m) if (Math.abs (pick[m] - cand[i]) < minD) { ok = false; break; }
				if (ok) pick.push (cand[i]);
			}
			pick.sort (function ( x, y ) { return x - y; });
			for (i = 0; i < pick.length; ++i) cuts.push (pick[i] * hopS);
			prog && prog (1);
			done (cuts);
		});
	}

	/* ------------------------------------------------------------------
	 * [有聲句段] 找出「有說話的區間」，而不是切在靜音處
	 *  1. 每 10 ms 取一個音量（峰值或 RMS，dB）
	 *  2. 超過「音量門檻」開始一句；低於「音量門檻 − 結束門檻差」連續達「最短靜音」才結束
	 *  3. 合併過短碎片 → 丟掉短於「最短有效句段」的 → 超過「最長句段」的在最安靜處切開 → 前後留白
	 * segmentsFromDb 是純函式（只吃音量陣列），之後做即時預估可以直接重用
	 * ------------------------------------------------------------------ */
	function segmentsFromDb ( db, f0, hs, o, lo, hi, dropped ) {
		var n = db.length, segs = [], inS = false, st = 0, last = 0, i, k, v, g;
		var thrS = o.thr, thrE = o.thr - o.endOff, minF = Math.max (1, Math.round (o.minSil / hs));

		for (i = 0; i < n; ++i) {
			v = db[i];
			if (!inS) { if (v >= thrS) { inS = true; st = i; last = i; } }
			else if (v >= thrE) last = i;
			else if (i - last >= minF) { segs.push ([st, last + 1]); inS = false; }
		}
		if (inS) segs.push ([st, last + 1]);
		segs = segs.map (function ( a ) { return [(f0 + a[0]) * hs, (f0 + a[1]) * hs]; });

		/* 合併過短碎片：併入間隔較近的鄰居；離鄰居太遠（超過 1 秒或兩倍最短靜音）的不併（之後交給「最短有效句段」處理） */
		if (o.mergeShort > 0) {
			for (;;) {
				var mi = -1, ml = o.mergeShort, gp, gn;
				if (segs.length < 2) break;
				for (k = 0; k < segs.length; ++k) {
					g = segs[k];
					if (!g[2] && g[1] - g[0] < ml) { ml = g[1] - g[0]; mi = k; }
				}
				if (mi < 0) break;
				gp = mi > 0 ? segs[mi][0] - segs[mi - 1][1] : Infinity;
				gn = mi < segs.length - 1 ? segs[mi + 1][0] - segs[mi][1] : Infinity;
				if (Math.min (gp, gn) > Math.max (1, o.minSil * 2)) { segs[mi][2] = 1; continue; }
				if (gp <= gn) { segs[mi - 1][1] = segs[mi][1]; segs.splice (mi, 1); }
				else { segs[mi + 1][0] = segs[mi][0]; segs.splice (mi, 1); }
			}
		}

		/* 丟掉太短的（咳嗽、點擊） */
		segs = segs.filter ( function ( a ) {
			var keep = a[1] - a[0] >= o.minSpeech;
			if (!keep && dropped) dropped.push ([a[0], a[1]]);	/* [預覽] 記下被濾掉的片段，讓使用者看出丟了什麼 */
			return keep;
		});

		/* 太長的句段：在「前半到上限」之間最安靜的地方切開（取 5 幀平均，避免切在單一低點） */
		if (o.maxSeg > 0) {
			var out = [], s0, e0, ws, we, best, bv, t;
			for (i = 0; i < segs.length; ++i) {
				s0 = segs[i][0]; e0 = segs[i][1];
				while (e0 - s0 > o.maxSeg) {
					ws = Math.max (2, Math.floor ((s0 + o.maxSeg * 0.5) / hs) - f0);
					we = Math.min (n - 3, Math.floor ((s0 + o.maxSeg) / hs) - f0);
					best = -1; bv = 1e9;
					for (k = ws; k <= we; ++k) {
						v = (db[k - 2] + db[k - 1] + db[k] + db[k + 1] + db[k + 2]) / 5;
						if (v < bv) { bv = v; best = k; }
					}
					if (best < 0) break;
					t = (f0 + best) * hs;
					if (t <= s0 + 0.05 || t >= e0 - 0.05) break;
					out.push ([s0, t]); s0 = t;
				}
				out.push ([s0, e0]);
			}
			segs = out;
		}

		/* 前後留白：相鄰兩句的空隙不夠就各讓一半，不重疊；不超出分析範圍 */
		if (o.pad > 0) {
			var pd = [], pg, ng, ns, ne;
			for (i = 0; i < segs.length; ++i) {
				pg = i > 0 ? segs[i][0] - segs[i - 1][1] : Infinity;
				ng = i < segs.length - 1 ? segs[i + 1][0] - segs[i][1] : Infinity;
				ns = Math.max (lo, segs[i][0] - Math.min (o.pad, pg / 2));
				ne = Math.min (hi, segs[i][1] + Math.min (o.pad, ng / 2));
				pd.push ([ns, ne]);
			}
			segs = pd;
		}
		return segs.map ( function ( a ) { return [a[0], a[1]]; });
	}

	/* 音量包絡：每 10 ms 一個 dB 值（峰值或 RMS）。只跟「音訊、範圍、偵測模式」有關，與滑桿參數無關，
	 * 所以對話框只算一次並快取；之後拖動滑桿只重跑 segmentsFromDb，幾乎是即時的 */
	function computeEnv ( buf, lo, hi, detect, job, prog, done ) {
		var sr = buf.sampleRate, chs = channelsOf (buf), nch = chs.length;
		var hop = Math.max (1, Math.round (sr * 0.01)), hs = hop / sr;
		var f0 = Math.max (0, Math.floor (lo / hs)), f1 = Math.min (Math.floor (buf.length / hop), Math.ceil (hi / hs));
		var n = f1 - f0, db, peak = detect !== 'rms';
		if (n <= 0) { done ({ db: new Float32Array (0), f0: f0, hs: hs }); return ; }
		db = new Float32Array (n);

		loopChunks (n, 20000, function ( i ) {
			var s = (f0 + i) * hop, e = Math.min (buf.length, s + hop), sum = 0, pk = 0, c, j, v, x;
			for (c = 0; c < nch; ++c) {
				x = chs[c];
				for (j = s; j < e; ++j) {
					v = x[j];
					if (peak) { if (v < 0) v = -v; if (v > pk) pk = v; }
					else sum += v * v;
				}
			}
			db[i] = peak ? 20 * Math.log10 (pk + 1e-6) : 10 * Math.log10 (sum / (Math.max (1, e - s) * nch) + 1e-12);
		}, job, prog, function () { done ({ db: db, f0: f0, hs: hs }); });
	}

	function speechSegs ( buf, o, lo, hi, job, prog, done ) {
		computeEnv (buf, lo, hi, o.detect, job, prog, function ( e ) {
			done (e.db.length ? segmentsFromDb (e.db, e.f0, e.hs, o, lo, hi) : []);
		});
	}

	/* 套用範圍與最短片段限制 */
	function postFilter ( cuts, lo, hi, minSeg ) {
		var out = [], last = lo, i, t;
		cuts.sort (function ( a, b ) { return a - b; });
		for (i = 0; i < cuts.length; ++i) {
			t = cuts[i];
			if (t <= lo + 0.01 || t >= hi - 0.01) continue;
			if (t - last < minSeg || hi - t < minSeg) continue;
			out.push (t); last = t;
		}
		return out;
	}

	/* opts 另可帶 lo / hi（秒）指定分析範圍；done ( 分割點秒數陣列 ) */
	function analyze ( buf, opts, job, prog, done ) {
		var o = clean (opts), lo = opts && opts.lo > 0 ? opts.lo : 0;
		var hi = opts && opts.hi > 0 ? Math.min (opts.hi, buf.duration) : buf.duration;
		var fn = o.mode === 'change' ? changeCuts : silenceCuts;
		fn (buf, o, job, prog, function ( cuts ) { done (postFilter (cuts, lo, hi, o.minSeg)); });
	}

	/* 統一入口：任何模式都回傳 [[起, 迄], ...]（silence／change 為連續相接的區間，speech 為有聲句段） */
	function analyzeSegs ( buf, opts, job, prog, done ) {
		var o = clean (opts), lo = opts && opts.lo > 0 ? opts.lo : 0;
		var hi = opts && opts.hi > 0 ? Math.min (opts.hi, buf.duration) : buf.duration;
		if (o.mode === 'speech') { speechSegs (buf, o, lo, hi, job, prog, done); return ; }
		analyze (buf, opts, job, prog, function ( cuts ) { done (cutsToSegs (cuts, lo, hi)); });
	}

	function cutsToSegs ( cuts, lo, hi ) {
		var out = [], start = lo, i;
		for (i = 0; i < cuts.length; ++i) { out.push ([start, cuts[i], '']); start = cuts[i]; }
		out.push ([start, hi, '']);
		return out;
	}

	/* ------------------------------------------------------------------
	 * 取得要分析的音訊（單軌：目前緩衝區；多軌：整體混音）
	 * ------------------------------------------------------------------ */
	function mtOf ( app ) {
		var h = PKAE._deps.uiHelpers;
		return h && h.activeMultitrackFor ? h.activeMultitrackFor ( app ) : null;
	}

	function regionOf ( app ) {
		var h = PKAE._deps.uiHelpers;
		return h && h.activeRegionFor ? h.activeRegionFor ( app ) : null;
	}

	function getBuffer ( app, cb ) {
		var mt = mtOf ( app ), ws = app.engine && app.engine.wavesurfer;
		if (mt) {
			if (mt.MixdownAsync) mt.MixdownAsync (false, cb);
			else cb (mt.Mixdown ? mt.Mixdown (false) : null);
			return ;
		}
		cb (ws && ws.backend && ws.backend.buffer ? ws.backend.buffer : null);
	}

	function newJob () {
		return { canceled: false, cancel: function () { this.canceled = true; } };
	}

	/* 匯出對話框用：mode = 'silence' | 'change'，range = false 或 [起, 迄]。
	 * done ( segs )；segs 長度 1 代表沒找到分割點。回傳 job（可 cancel） */
	function detectSegments ( app, mode, range, prog, done ) {
		var job = newJob (), o = loadOpts ();
		o.mode = mode === 'change' ? 'change' : mode === 'speech' ? 'speech' : 'silence';
		getBuffer ( app, function ( buf ) {
			if (job.canceled) return ;
			if (!buf) { done ([], false); return ; }
			var lo = range ? range[0] : 0, hi = range ? range[1] : buf.duration;
			o.lo = lo; o.hi = hi;
			/* done ( segs, found )：found＝有音訊可分析（speech 模式可能一句都沒找到，segs 為空） */
			analyzeSegs (buf, o, job, prog, function ( segs ) {
				done (segs.map ( function ( g ) { return [g[0], g[1], '']; }), true);
			});
		});
		return job;
	}

	/* ------------------------------------------------------------------
	 * 把分割點變成標記
	 * ------------------------------------------------------------------ */
	/* 算出要加入的標記（不動畫面）：回傳 { list: 全部標記, fresh: 新增的標記 }；沒有新增時 fresh 為空陣列 */
	function buildMarkerItems ( app, cuts, replace, asRange, hiT, o ) {
		var m = app.mrk, mt = !!mtOf ( app ), cur, all = [], list = [], i, j, skip, fresh = [], items = [];
		o = o || loadOpts ();
		cur = replace ? [] : (mt ? m.serMt () : m.serEd ());

		/* 現有標記放前面（保留原 id）；新標記不帶 id，由標記模組配發 */
		for (i = 0; i < cur.length; ++i) { list.push (cur[i]); all.push (cur[i].time); }
		for (i = 0; i < cuts.length; ++i) {
			for (skip = false, j = 0; j < cur.length; ++j)
				if (Math.abs (cur[j].time - cuts[i]) < 0.05) { skip = true; break; }
			if (!skip) { fresh.push (cuts[i]); all.push (cuts[i]); }
		}
		if (!fresh.length) return { list: list, fresh: [] };
		all.sort (function ( a, b ) { return a - b; });

		/* 名稱：該標記所開始的是第幾段（第 1 段在第一個標記之前，所以從 2 起算）。
		 * [命名範本] 先把「所有分割點」切成連續的段，再依範本取名；勾選「接續現有編號」時，新標記改成依序從現有最大編號的下一個開始 */
		var full = [], prev = 0, names;
		for (i = 0; i < all.length; ++i) { full.push ([prev, all[i]]); prev = all[i]; }
		full.push ([prev, Math.max (prev, hiT)]);
		if (o.contNum) {
			var fs = [];
			for (i = 0; i < fresh.length; ++i) fs.push ( full[all.indexOf (fresh[i]) + 1] );
			names = nameSegs ( fs, o, namesOf ( cur ) );
		}
		else names = nameSegs ( full, o, null );
		for (i = 0; i < fresh.length; ++i) {
			var nmv = o.contNum ? names[i] : names[all.indexOf (fresh[i]) + 1];
			var item = { time: fresh[i], name: nmv };
			var nxt = all[all.indexOf (fresh[i]) + 1];
			var en = nxt !== undefined ? nxt : hiT;
			if (asRange && en > fresh[i] + 0.01) item.end = en; /* 區間：結束點＝下一個分割點（含既有標記），最後一段到範圍／音訊結尾 */
			item.span = en; /* 只給預覽用的結束點（加入標記前會移除） */
			items.push (item);
		}
		return { list: list, fresh: items };
	}

	function applyMarkers ( app, cuts, replace, asRange, hiT, o ) {
		var m = app.mrk, mt = !!mtOf ( app ), r, i, list;
		if (!m) return 0;
		r = buildMarkerItems ( app, cuts, replace, asRange, hiT, o );
		if (!r.fresh.length) return 0;
		list = r.list;
		for (i = 0; i < r.fresh.length; ++i) { delete r.fresh[i].span; list.push (r.fresh[i]); }
		if (mt) m.loadMt (list); else m.loadEd (list);
		return r.fresh.length;
	}

	/* [有聲句段] 每一句一個標記：起點＝句首（含留白），勾選「區間」時結束點＝句尾；名稱依「名稱範本」（預設 段01、段02…） */
	function applySegMarkers ( app, segs, replace, asRange, o ) {
		var m = app.mrk, mt = !!mtOf ( app ), cur, list = [], i, j, skip, n = 0, item, names;
		if (!m) return 0;
		o = o || loadOpts ();
		cur = replace ? [] : (mt ? m.serMt () : m.serEd ());
		names = nameSegs ( segs, o, namesOf ( cur ) );	/* [命名範本] 序號與分組以「全部句段」計算，被略過的句段不會讓後面的編號錯位 */
		for (i = 0; i < cur.length; ++i) list.push (cur[i]);
		for (i = 0; i < segs.length; ++i) {
			for (skip = false, j = 0; j < cur.length; ++j)
				if (Math.abs (cur[j].time - segs[i][0]) < 0.05) { skip = true; break; }
			if (skip) continue;
			item = { time: segs[i][0], name: names[i] };
			if (asRange) item.end = segs[i][1];
			list.push (item); ++n;
		}
		if (!n) return 0;
		if (mt) m.loadMt (list); else m.loadEd (list);
		return n;
	}

	/* ------------------------------------------------------------------
	 * 對話框
	 * ------------------------------------------------------------------ */
	function open ( app ) {
		var o = loadOpts (), mid = 'asplit', job = null, busy = false, dead = false;
		var buf = null, env = null, envKey = '', envJob = null, envWait = [], envPend = '', raf = 0, mq = null;

		function $ ( id ) { return d.getElementById (id); }
		function L ( zh, en ) { return lang () === 'zh' ? zh : en; }

		function esc ( v ) { return String (v).replace (/&/g, '&amp;').replace (/"/g, '&quot;').replace (/</g, '&lt;'); }

		function sel ( id, val, items ) {
			var s = '<select id="' + id + '">', i;
			for (i = 0; i < items.length; ++i)
				s += '<option value="' + items[i][0] + '"' + (String (items[i][0]) === String (val) ? ' selected' : '') + '>' + items[i][1] + '</option>';
			return s + '</select>';
		}

		/* 滑桿：標題＋右側即時數值。fmt 負責把數值轉成顯示文字；hk＝說明鍵（滑鼠移上去／取得焦點時顯示在說明列） */
		var FM = {};
		function trim ( v ) { return String (+(+v).toFixed (2)); }
		function fdb ( v ) { return trim (v) + ' dB'; }
		function fsec ( v ) { return trim (v) + T ('sec'); }
		function fzero ( key ) { return function ( v ) { return +v > 0 ? fsec (v) : T (key); }; }
		function fendoff ( v ) { return +v > 0 ? fdb (v) : T ('same'); }
		function sld ( id, label, val, min, max, step, fmt, hk ) {
			FM[id] = fmt;
			return '<div class="asr" data-h="' + (hk || '') + '"><div class="asr_h"><label for="' + id + '">' + label + '</label><b id="' + id + '-v">' + fmt (val) + '</b></div>' +
				'<input type="range" id="' + id + '" min="' + min + '" max="' + max + '" step="' + step + '" value="' + val + '"></div>';
		}

		var sens = o.sens >= 2.2 ? 2.6 : o.sens <= 1.4 ? 1.0 : 1.8;
		var region = regionOf ( app );

		function radio ( id, val, label ) {
			return '<input type="radio" class="as_rd" id="' + id + '" name="asmode" value="' + val + '"' + (o.mode === val ? ' checked' : '') + '><label class="as_mode" for="' + id + '">' + label + '</label>';
		}
		function chk ( id, on, label, extra ) {
			return '<div class="pk_row"' + (extra || '') + '><input type="checkbox" class="pk_check" id="' + id + '"' + (on ? ' checked' : '') + '><label for="' + id + '">' + label + '</label></div>';
		}

		var body =
			'<div class="as_wrap">' +
			'<div class="as_modes" role="radiogroup" aria-label="' + T ('mode_lbl') + '">' + radio ('kas3', 'speech', T ('mode_sp')) + radio ('kas1', 'silence', T ('mode_sil_s')) + radio ('kas2', 'change', T ('mode_chg_s')) + '</div>' +
			'<div class="as_desc" id="as-desc" aria-live="polite"></div>' +
			'<div class="as_scroll">' +
				/* 基本設定：每種方式只露出 2~4 個最常調的 */
				'<div id="as-sil" class="as_grid">' +
					sld ('as-thr', T ('thr'), o.thr, -90, -10, 1, fdb, 'thr') +
					sld ('as-minsil', T ('minsil'), o.minSil, 0.05, 10, 0.05, fsec, 'minsil') +
					'<div class="asr" id="as-placerow" data-h="place"><div class="asr_h"><label for="as-place">' + T ('place') + '</label></div>' + sel ('as-place', o.place, [['mid', T ('place_mid')], ['sound', T ('place_snd')]]) + '</div>' +
				'</div>' +
				'<div id="as-sp" class="as_grid">' +
					sld ('as-minspeech', T ('minspeech'), o.minSpeech, 0, 5, 0.1, fsec, 'minspeech') +
					sld ('as-pad', T ('pad'), o.pad, 0, 1, 0.05, fsec, 'pad') +
				'</div>' +
				'<div id="as-chg" class="as_grid">' +
					'<div class="asr" data-h="sens"><div class="asr_h"><label for="as-sens">' + T ('sens') + '</label></div>' + sel ('as-sens', sens, [[2.6, T ('sens_low')], [1.8, T ('sens_mid')], [1, T ('sens_high')]]) + '</div>' +
					sld ('as-win', T ('win'), o.win, 0.5, 15, 0.5, fsec, 'win') +
				'</div>' +
				'<div id="as-minsegrow" class="as_grid">' + sld ('as-minseg', T ('minseg'), o.minSeg, 0.1, 60, 0.1, fsec, 'minseg') + '</div>' +
				/* 進階（預設收合，只有「有聲句段」才有） */
				'<details id="as-adv" class="as_det"><summary>' + T ('adv') + '</summary><div class="as_grid">' +
					sld ('as-endoff', T ('endoff'), o.endOff, 0, 30, 1, fendoff, 'endoff') +
					sld ('as-maxseg', T ('maxseg'), o.maxSeg, 0, 120, 1, fzero ('unlimited'), 'maxseg') +
					sld ('as-merge', T ('mergeshort'), o.mergeShort, 0, 5, 0.1, fzero ('off'), 'merge') +
					'<div class="asr" data-h="detect"><div class="asr_h"><label for="as-detect">' + T ('detect') + '</label></div>' + sel ('as-detect', o.detect, [['peak', T ('det_peak')], ['rms', T ('det_rms')]]) + '</div>' +
					'<div class="as_full" id="as-pvdroprow">' + chk ('as-pvdrop', o.pvDrop, T ('pvdrop')) + '</div>' +
				'</div></details>' +
				/* 勾選項：一排排好 */
				'<div class="as_checks">' +
					'<div id="as-pvrow">' + chk ('as-pv', o.pv, T ('pv_s')) + '</div>' +
					chk ('as-range', o.range, T ('range_s')) +
					chk ('as-repl', o.replace, T ('replace')) +
					(region ? chk ('as-sel', o.selOnly, T ('selonly')) : '') +
				'</div>' +
				/* 命名：摺疊起來，標題列直接顯示目前名稱範例 */
				'<details id="as-names" class="as_det"><summary>' + T ('nm_tpl') + '<span class="as_sum">' + T ('nm_ex') + '<b id="as-ex"></b></span></summary><div class="as_names">' +
					'<div class="asr"><input type="text" class="pk_txt" id="as-tpl" maxlength="40" spellcheck="false" autocomplete="off" value="' + esc (o.nameTpl) + '" placeholder="' + esc (T ('seg') + '{nn}') + '" aria-label="' + esc (T ('nm_tpl')) + '">' +
						'<div class="as_hint">' + T ('nm_hint') + '</div></div>' +
					'<div class="as_grid">' +
						'<div class="asr as_num"><div class="asr_h"><label for="as-start">' + T ('nm_start') + '</label></div><input type="number" class="pk_txt" id="as-start" min="0" max="9999" step="1" value="' + o.startNum + '"></div>' +
						'<div class="as_full">' + chk ('as-cont', o.contNum, T ('nm_cont')) + '</div>' +
						'<div id="as-grouprow" class="as_full">' + sld ('as-gap', T ('nm_gap'), o.groupGap, 0, 20, 0.5, fzero ('nm_gap_off'), 'gap') + '</div>' +
					'</div>' +
				'</div></details>' +
			'</div>' +
			'<div id="as-prog" class="as_prog"></div></div>';

		function css () {
			if ($('as-css')) return ;
			var st = d.createElement ('style');
			st.id = 'as-css';
			st.textContent = [
				/* 視窗：寬度固定、緊湊；停靠與否寬度一致，切換方式時不會忽大忽小 */
				'.pk_modal.as_modal{width:min(620px,calc(100vw - 24px));min-width:0}',
				'.as_modal .pk_modal_title{display:flex;align-items:center;gap:6px;-webkit-user-select:none;user-select:none}',
				'.as_modal .pk_modal_title>span{flex:1;min-width:0;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}',
				'.as_tb{flex:0 0 auto;cursor:pointer;color:var(--fg-2);font-size:12px;line-height:20px;padding:0 7px;border-radius:var(--r-md);white-space:nowrap}',
				'.as_tb:hover,.as_tb:focus-visible{color:var(--fg-0);background:var(--bg-3);outline:0}',
				'.as_tb:focus-visible{box-shadow:0 0 0 2px var(--ac)}',
				/* 預覽時停靠在底部：固定在視窗上（頁面捲動也不會跑掉）、可拖曳標題列移動 */
				'.pk_modal_back.pk_pv_dock{position:fixed;top:0;bottom:0;height:auto}',
				'.pk_pv_dock .pk_modal.as_modal{width:min(620px,100%)}',
				'.pk_pv_dock .as_modal .pk_modal_title{cursor:move;touch-action:none}',
				'.pk_pv_dock .as_scroll{max-height:min(40vh,300px)}',
				/* 分割方式：三選一的按鈕 */
				'.as_modes{display:flex;gap:6px;margin:2px 0 6px}',
				'.as_rd{position:absolute;left:-9999px}',
				'.as_mode{flex:1 1 0;box-sizing:border-box;min-width:0;text-align:center;padding:6px 8px;border:1px solid var(--bd);border-radius:6px;cursor:pointer;font-size:13px;color:var(--fg-1);background:var(--bg-1);transition:border-color var(--tr),color var(--tr),background var(--tr)}',
				'.as_mode:hover{border-color:var(--bd-h);color:var(--fg-0)}',
				'.as_rd:checked+.as_mode{border-color:var(--ac);color:var(--ac);background:var(--ac-soft)}',
				'.as_rd:focus-visible+.as_mode{outline:2px solid var(--ac);outline-offset:1px}',
				/* 說明列：預設顯示分割方式的說明；滑鼠移到／點選某個設定時，顯示該設定的說明 */
				'.as_desc{min-height:34px;margin:0 0 4px;font-size:12px;line-height:17px;color:var(--fg-1)}',
				'.as_desc.as_h{color:var(--ac-2)}',
				'.as_scroll{max-height:calc(100vh - 300px);min-height:0;overflow:auto;padding-right:4px}',
				'.as_grid{display:grid;grid-template-columns:1fr 1fr;gap:0 22px}',
				'.as_grid>.as_full{grid-column:1/-1}',
				'.asr{margin:4px 0 6px;min-width:0}.asr_h{display:flex;justify-content:space-between;align-items:baseline;margin-bottom:1px;gap:8px;font-size:13px}',
				'.asr_h b{color:var(--ac);font-weight:600;font-variant-numeric:tabular-nums;white-space:nowrap}',
				'.asr input[type=range]{display:block;width:100%;margin:2px 0;accent-color:var(--ac)}.asr select{width:100%}',
				/* 可摺疊區（進階、命名） */
				'.as_det{margin:4px 0 0;border-top:1px solid var(--bd)}',
				'.as_det>summary{display:flex;align-items:baseline;gap:6px;padding:7px 0;cursor:pointer;list-style:none;font-size:13px;color:var(--fg-1)}',
				'.as_det>summary::-webkit-details-marker{display:none}',
				'.as_det>summary:before{content:"\\25B8";color:var(--fg-2);font-size:11px}',
				'.as_det[open]>summary:before{content:"\\25BE"}',
				'.as_det>summary:hover{color:var(--fg-0)}',
				'.as_det>summary:focus-visible{outline:2px solid var(--ac);outline-offset:1px}',
				'.as_sum{margin-left:auto;min-width:0;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;font-size:12px;color:var(--fg-2)}',
				'.as_sum b{color:var(--ac);font-weight:600}',
				/* 勾選項排成一排 */
				'.as_checks{display:flex;flex-wrap:wrap;gap:2px 22px;margin:6px 0 4px;border-top:1px solid var(--bd);padding-top:8px}',
				'.as_checks .pk_row,.as_det .pk_row{clear:none;overflow:visible;margin:0;padding:0;border:0}',
				'.as_checks .pk_row label,.as_det .pk_row label{margin:0;font-size:13px}',
				'.as_names{padding:2px 0 6px}',
				'.as_names .pk_txt{width:100%;box-sizing:border-box;margin-top:2px}.as_num .pk_txt{max-width:120px}',
				'.as_hint{margin-top:4px;color:var(--fg-2);font-size:11px;line-height:1.5}',
				'.as_prog{margin-top:4px;min-height:16px;font-size:12px;opacity:.7}.as_prog:empty{display:none}',
				/* 預估結果放在底部按鈕列左側，省一整列高度 */
				'.as_modal .pk_modal_bottom #as-est{flex:1 1 170px;min-width:0;font-size:13px;line-height:1.4;color:var(--fg-0)}',
				'#as-est b{color:var(--ac);font-size:15px}',
				/* 收合：只剩標題列、預估與按鈕 */
				'.as_modal.as_min .as_modes,.as_modal.as_min .as_desc,.as_modal.as_min .as_scroll,.as_modal.as_min .as_prog{display:none}',
				'.as_modal.as_min .pk_modal_title{margin-bottom:0}.as_modal.as_min .pk_modal_main{padding-bottom:0}',
				'@media (max-width:560px){.as_grid{grid-template-columns:1fr}.as_mode{padding:6px 4px;font-size:12px}.as_checks{gap:2px 14px}}'
			].join ('');
			d.head.appendChild (st);
		}

		var SL = { 'as-thr': 'thr', 'as-minsil': 'minSil', 'as-win': 'win', 'as-minseg': 'minSeg', 'as-endoff': 'endOff',
			'as-minspeech': 'minSpeech', 'as-pad': 'pad', 'as-maxseg': 'maxSeg', 'as-merge': 'mergeShort' };
		/* 名稱設定（範本、起始編號、接續、分組）不隨「恢復預設」重設，避免把使用者慣用的範本洗掉 */

		function read () {
			var m = d.querySelector ('input[name="asmode"]:checked');
			return clean ({
				mode: m ? m.value : 'silence',
				thr: $('as-thr').value, minSil: $('as-minsil').value, place: $('as-place').value,
				sens: $('as-sens').value, win: $('as-win').value, minSeg: $('as-minseg').value,
				nameTpl: $('as-tpl').value, startNum: $('as-start').value, contNum: $('as-cont').checked, groupGap: $('as-gap').value, pv: $('as-pv').checked, pvDrop: $('as-pvdrop').checked,
				endOff: $('as-endoff').value, minSpeech: $('as-minspeech').value, pad: $('as-pad').value,
				maxSeg: $('as-maxseg').value, mergeShort: $('as-merge').value, detect: $('as-detect').value,
				selOnly: !!($('as-sel') && $('as-sel').checked), replace: $('as-repl').checked, range: $('as-range').checked
			});
		}

		function showVal ( id ) { var v = $(id + '-v'); if (v) v.textContent = FM[id] ($(id).value); }

		/* 說明列 */
		var modeDesc = '';
		function showHelp ( key ) {
			var el = $('as-desc');
			if (!el) return ;
			if (key) { el.textContent = T (key); el.className = 'as_desc as_h'; }
			else { el.textContent = modeDesc; el.className = 'as_desc'; }
		}
		function curMode () { var m = d.querySelector ('input[name="asmode"]:checked'); return m ? m.value : 'silence'; }
		function hkey ( el ) {
			var h = el && el.getAttribute ('data-h');
			if (!h) return '';
			return h === 'thr' ? (curMode () === 'speech' ? 'h_thr_sp' : 'h_thr_sil') : 'h_' + h;
		}

		function showMode () {
			var v = curMode (), lb = d.querySelector ('label[for="as-thr"]'), pvr = $('as-pvrow');
			$('as-sil').style.display = v === 'change' ? 'none' : '';
			$('as-placerow').style.display = v === 'silence' ? '' : 'none';
			$('as-sp').style.display = v === 'speech' ? '' : 'none';
			$('as-adv').style.display = v === 'speech' ? '' : 'none';
			$('as-chg').style.display = v === 'change' ? '' : 'none';
			$('as-minsegrow').style.display = v === 'speech' ? 'none' : '';
			$('as-grouprow').style.display = v === 'speech' ? '' : 'none'; /* 只有「有聲句段」才有「停頓」可言 */
			if (lb) lb.textContent = v === 'speech' ? T ('thr_sp') : T ('thr');
			if (pvr) pvr.style.display = (v === 'speech' || v === 'silence') && !mtOf ( app ) ? '' : 'none';
			modeDesc = T (v === 'speech' ? 'd_sp' : v === 'change' ? 'd_chg' : 'd_sil');
			showHelp (null);
			place ();
		}

		function resetDefaults () {
			var id;
			for (id in SL) { $(id).value = DEF[SL[id]]; showVal (id); }
			$('as-place').value = DEF.place; $('as-sens').value = 1.8; $('as-detect').value = DEF.detect;
			refresh ();
		}

		/* ---- 即時預估（只有「有聲句段」模式）---- */
		function bounds ( opt ) {
			var r = opt.selOnly ? regionOf ( app ) : null;
			return r && r.end > r.start ? [r.start, Math.min (r.end, buf.duration)] : [0, buf.duration];
		}
		function keyOf ( opt, b ) { return opt.detect + '|' + b[0].toFixed (3) + '|' + b[1].toFixed (3); }

		/* 取得音量包絡：同一個 key 已經算過就直接用；正在算同一個 key 就排隊等；key 變了就取消重算 */
		function ensureEnv ( opt, b, k, cb, prog ) {
			if (env && envKey === k) { cb (); return ; }
			envWait.push (cb);
			if (envJob && envPend === k) return ;
			envJob && envJob.cancel ();
			var j = envJob = newJob ();
			envPend = k;
			computeEnv (buf, b[0], b[1], opt.detect, j, prog, function ( e ) {
				if (j.canceled || dead) return ;
				envJob = null; envPend = ''; env = e; envKey = k;
				var w2 = envWait; envWait = [];
				for (var i = 0; i < w2.length; ++i) w2[i] ();
			});
		}

		/* 名稱範例：有聲句段且已算出句段時用真實的前 3 句，否則用假資料 */
		var SAMPLE = [[9.2, 12.4], [12.9, 15.0], [17.6, 21.3]];
		function showEx ( opt, segs ) {
			var ex = $('as-ex'), src, nm;
			if (!ex) return ;
			src = (segs && segs.length ? segs : SAMPLE).slice (0, 3);
			nm = nameSegs ( src, opt, null );
			ex.textContent = nm.join (L ('、', ', ')) + (!segs || !segs.length || segs.length > 3 ? '…' : '');
		}

		/* ---- [預覽] 在聲波上預覽：單軌 ＋「有聲句段」才有；其餘模式（依靜音、聲音變化、多軌）不預覽 ---- */
		function pvWanted ( opt ) { return !!(opt.pv && (opt.mode === 'speech' || opt.mode === 'silence') && app.mrk && app.mrk.preview && !mtOf ( app )); }
		function pvClear () { try { app.mrk && app.mrk.clearPreview && app.mrk.clearPreview (); } catch (e) {} }
		function pvDock ( on ) {
			if (mq && mq.el_back) mq.el_back.classList[on ? 'add' : 'remove'] ('pk_pv_dock');
			if (on !== dockOn) { dockOn = on; place (); }
		}
		function pvSend ( opt, segs, dropped ) {
			var ex = [], names, out = [], i;
			if (opt.contNum && !opt.replace) { try { ex = namesOf ( app.mrk.serEd () ); } catch (e) {} }
			names = nameSegs ( segs, opt, ex );
			for (i = 0; i < segs.length; ++i) out.push ([segs[i][0], segs[i][1], names[i]]);
			app.mrk.preview ( out, opt.pvDrop ? dropped : [] );
		}

		/* [預覽] 依靜音：整段音訊算一次 RMS 包絡（與範圍、滑桿無關），之後拖滑桿只重算切點 */
		function silenceView ( opt, est ) {
			var b = bounds ( opt ), eo = { detect: 'rms' }, full = [0, buf.duration], k = keyOf ( eo, full ), cuts, r, i, out = [], x;
			if (!(env && envKey === k)) {
				est.textContent = T ('analyzing', { p: 0 });
				ensureEnv ( eo, full, k, refresh, function ( p ) { var e2 = $('as-est'); if (e2) e2.textContent = T ('analyzing', { p: (p * 100) >> 0 }); });
				return ;
			}
			cuts = env.db.length ? postFilter ( silenceCutsFromDb ( env.db, env.hs, opt ), b[0], b[1], opt.minSeg ) : [];
			r = buildMarkerItems ( app, cuts, opt.replace, opt.range, b[1], opt );
			for (i = 0; i < r.fresh.length; ++i) { x = r.fresh[i]; out.push ([x.time, x.span, x.name]); }
			if (pvWanted ( opt )) { try { app.mrk.preview ( out, [] ); } catch (e) {} }
			if (!out.length) { est.textContent = T ('est_sil_none'); return ; }
			est.innerHTML = T ('est_sil', { n: out.length, m: out.length + 1 });
		}

		function refresh () {
			var est = $('as-est'), opt, b, k, segs, tot, i, len, drp;
			if (!est || dead) return ;
			opt = read ();
			showEx ( opt, null );
			var pvr = $('as-pvrow');
			if (pvr) pvr.style.display = (opt.mode === 'speech' || opt.mode === 'silence') && !mtOf ( app ) ? '' : 'none';
			$('as-pvdroprow').style.display = opt.pv ? '' : 'none';
			pvDock ( pvWanted ( opt ) );
			if (!pvWanted ( opt )) pvClear ();
			if (opt.mode === 'change') { est.textContent = T ('est_na'); return ; }
			if (!buf) { est.textContent = T ('mixing'); return ; }
			if (opt.mode === 'silence') { silenceView ( opt, est ); return ; }
			b = bounds ( opt ); k = keyOf ( opt, b );
			if (!(env && envKey === k)) {
				est.textContent = T ('analyzing', { p: 0 });
				ensureEnv (opt, b, k, refresh, function ( p ) { var e2 = $('as-est'); if (e2) e2.textContent = T ('analyzing', { p: (p * 100) >> 0 }); });
				return ;
			}
			drp = [];
			segs = env.db.length ? segmentsFromDb (env.db, env.f0, env.hs, opt, b[0], b[1], drp) : [];
			showEx ( opt, segs );
			if (pvWanted ( opt )) pvSend ( opt, segs, drp );
			if (!segs.length) { est.textContent = T ('est_none'); return ; }
			for (tot = 0, i = 0; i < segs.length; ++i) tot += segs[i][1] - segs[i][0];
			len = Math.max (0.001, b[1] - b[0]);
			est.innerHTML = T ('est', { n: segs.length, s: tot.toFixed (1), p: Math.round (tot / len * 100) });
		}
		function schedule () { if (!raf) raf = w.requestAnimationFrame (function () { raf = 0; refresh (); }); }

		/* 停靠時可拖曳標題列移動視窗（位置會記住；連點兩下回原位）；任何時候都不會被拖出畫面 */
		var dockOn = false, pos = { x: 0, y: 0 }, drag = null, PKPOS = 'pk_autosplit_pos';
		try { var sp = JSON.parse (w.localStorage.getItem (PKPOS) || 'null'); if (sp && isFinite (sp.x) && isFinite (sp.y)) pos = { x: +sp.x, y: +sp.y }; } catch (e) {}
		function place () {
			var el = mq && mq.el, r, vw, vh, bx, by, lo, hi;
			if (!el) return ;
			if (!dockOn) { el.style.transform = ''; return ; }
			el.style.transform = 'translate(' + pos.x + 'px,' + pos.y + 'px)';
			r = el.getBoundingClientRect (); vw = d.documentElement.clientWidth; vh = d.documentElement.clientHeight;
			bx = r.left - pos.x; by = r.top - pos.y;
			lo = -bx; hi = Math.max (lo, vw - r.width - bx); pos.x = Math.max (lo, Math.min (hi, pos.x));
			lo = -by; hi = Math.max (lo, vh - r.height - by); pos.y = Math.max (lo, Math.min (hi, pos.y));
			el.style.transform = 'translate(' + pos.x + 'px,' + pos.y + 'px)';
		}
		function onTb ( e ) { return !!(e.target && e.target.closest && e.target.closest ('.as_tb')); }
		function savePos ( clear ) { try { if (clear) w.localStorage.removeItem (PKPOS); else w.localStorage.setItem (PKPOS, JSON.stringify (pos)); } catch (e) {} }

		function progress ( p ) { var e2 = $('as-prog'); if (e2) e2.textContent = T ('analyzing', { p: (p * 100) >> 0 }); }

		new PKSimpleModal ({
			title: T ('title'),
			clss: 'as_modal',
			ondestroy: function () {
				dead = true;
				w.removeEventListener ('resize', place, false);
				pvClear ();	/* 取消、關閉、加入標記後，預覽一律清掉 */
				job && job.cancel ();
				envJob && envJob.cancel ();
				app.ui.InteractionHandler.on = false;
				app.ui.KeyHandler.removeCallback (mid + 'esc');
				app.ui.KeyHandler.removeCallback (mid + 'en');
			},
			buttons: [{
				title: T ('btn'), clss: 'pk_modal_a_accpt',
				callback: function ( q ) {
					if (busy) return ;
					var opt = read (), prog = $('as-prog');
					saveOpts (opt);
					busy = true;
					prog.textContent = T ('mixing');

					function go () {
						if (dead) return ;
						if (!buf) { busy = false; prog.textContent = ''; OneUp (T ('no_audio'), 1200); return ; }
						var b = bounds ( opt );
						if (opt.selOnly) { opt.lo = b[0]; opt.hi = b[1]; }

						if (opt.mode === 'speech') {	/* [有聲句段] 每一句一個標記；包絡已快取時幾乎立刻完成 */
							ensureEnv (opt, b, keyOf (opt, b), function () {
								busy = false;
								if (dead) return ;
								var segs = env.db.length ? segmentsFromDb (env.db, env.f0, env.hs, opt, b[0], b[1]) : [];
								if (!segs.length) { prog.textContent = ''; OneUp (T ('none'), 1800); return ; }
								var cnt = applySegMarkers ( app, segs, opt.replace, opt.range, opt );
								q.Destroy ();
								OneUp (T ('done', { n: cnt }), 1500);
							}, progress);
							return ;
						}

						job = newJob ();
						analyze (buf, opt, job, progress, function ( cuts ) {
							job = null;
							if (dead) return ;
							busy = false;
							if (!cuts.length) { prog.textContent = ''; OneUp (T ('none'), 1800); return ; }
							var n = applyMarkers ( app, cuts, opt.replace, opt.range, opt.hi > 0 ? opt.hi : buf.duration, opt );
							q.Destroy ();
							OneUp (T ('done', { n: n }), 1500);
						});
					}

					if (buf) go ();
					else getBuffer ( app, function ( bf ) { buf = bf; go (); });
				}
			}],
			body: body,
			setup: function ( q ) {
				mq = q;
				app.fireEvent ('RequestPause');
				app.ui.InteractionHandler.checkAndSet ('modal');
				app.ui.KeyHandler.addCallback (mid + 'esc', function () { q.Destroy (); }, [27]);
				app.ui.KeyHandler.addCallback (mid + 'en', function ( kc, km, e ) {
					/* 焦點在「摺疊標題」「下拉選單」「標題列按鈕」時，Enter 是操作它們，不是按下「加入標記」 */
					var t = e && e.target;
					if (t && (t.tagName === 'SUMMARY' || t.tagName === 'SELECT' || (t.classList && t.classList.contains ('as_tb')))) return ;
					q.els.bottom[0].click ();
				}, [13]);
				css ();

				/* 標題列：恢復預設、收合；預估結果移到底部按鈕列左側 */
				var tt = q.el_title, bar = q.el.querySelector ('.pk_modal_bottom'), est = d.createElement ('span'), col;
				tt.title = T ('drag_tip');
				tt.insertAdjacentHTML ('beforeend', '<a class="as_tb" id="as-reset" role="button" tabindex="0">\u21BA ' + T ('reset') + '</a>' +
					'<a class="as_tb" id="as-col" role="button" tabindex="0" aria-expanded="true" title="' + esc (T ('col_tip')) + '" aria-label="' + esc (T ('col')) + '">\u25BE</a>');
				est.id = 'as-est'; est.setAttribute ('aria-live', 'polite'); bar.appendChild (est);
				col = tt.lastChild;
				function toggleCol () {
					var on = q.el.classList.toggle ('as_min');
					col.setAttribute ('aria-expanded', on ? 'false' : 'true');
					col.textContent = on ? '\u25B4' : '\u25BE';
					place ();
				}
				col.addEventListener ('click', toggleCol, false);
				col.addEventListener ('keydown', function ( e ) { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault (); toggleCol (); } }, false);
				tt.addEventListener ('pointerdown', function ( e ) {
					if (!dockOn || e.button > 0 || onTb ( e )) return ;
					drag = { x: e.clientX - pos.x, y: e.clientY - pos.y, id: e.pointerId };
					try { tt.setPointerCapture (e.pointerId); } catch (er) {}
					e.preventDefault ();
				}, false);
				tt.addEventListener ('pointermove', function ( e ) {
					if (!drag || e.pointerId !== drag.id) return ;
					pos.x = e.clientX - drag.x; pos.y = e.clientY - drag.y; place ();
				}, false);
				function endDrag () { if (!drag) return ; drag = null; savePos (false); }
				tt.addEventListener ('pointerup', endDrag, false);
				tt.addEventListener ('pointercancel', endDrag, false);
				tt.addEventListener ('dblclick', function ( e ) {
					if (!dockOn || onTb ( e )) return ;
					pos = { x: 0, y: 0 }; place (); savePos (true);
				}, false);
				w.addEventListener ('resize', place, false);

				w.setTimeout (function () {
					if (!q.el) return ;
					showMode ();
					/* 說明列：滑鼠移到或鍵盤選到某個設定時，顯示它的說明 */
					function help ( e ) { var r = e.target && e.target.closest ? e.target.closest ('.asr') : null; showHelp (r ? hkey ( r ) : null); }
					q.el.addEventListener ('mouseover', help, false);
					q.el.addEventListener ('focusin', help, false);
					q.el.addEventListener ('mouseleave', function () { showHelp (null); }, false);
					q.el.addEventListener ('focusout', function () { showHelp (null); }, false);
					q.el.addEventListener ('toggle', place, true);	/* 展開／收起進階、命名時，高度變了，重新檢查位置 */
					q.el.addEventListener ('input', function ( e ) {
						var id = e.target && e.target.id;
						if (id && FM[id]) showVal (id);
						schedule ();
					}, false);
					q.el.addEventListener ('change', function ( e ) {
						if (e.target && e.target.name === 'asmode') showMode ();
						schedule ();
					}, false);
					var rs = $('as-reset');
					rs.addEventListener ('click', resetDefaults, false);
					rs.addEventListener ('keydown', function ( e ) { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault (); resetDefaults (); } }, false);
					/* 先把音訊準備好，預估才能即時；多軌會先混音一次 */
					refresh ();
					getBuffer ( app, function ( bf ) { if (dead) return ; buf = bf; refresh (); });
				}, 20);
			}
		}).Show ();
	}

	PKAE._deps.autosplit = {
		open: open,
		analyze: analyze,
		detectSegments: detectSegments,
		analyzeSegs: analyzeSegs,
		segmentsFromDb: segmentsFromDb,
		nameSegs: nameSegs,
		cutsToSegs: cutsToSegs,
		loadOpts: loadOpts,
		saveOpts: saveOpts,
		T: T
	};

})( window, document, PKAudioEditor );


