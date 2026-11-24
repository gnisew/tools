(function ( w, d, PKAE ) {
	'use strict';

	var h = PKAE._deps.uiHelpers;
	var activeMultitrackFor = h.activeMultitrackFor;
	var activeRegionFor = h.activeRegionFor;

	/* [新增] 目前（單軌或多軌）的標記清單 */
	function markerListFor ( app ) {
		if (!app.mrk) return [];
		return activeMultitrackFor ( app ) ? app.mrk.serMt () : app.mrk.serEd ();
	}

	/* [新增] 依標記切成區段：回傳 [[起, 迄, 起點標記名稱], ...]（秒）。range 為選取範圍或 false */
	function splitSegmentsFor ( app, range ) {
		var mt = activeMultitrackFor ( app );
		var total = mt ? (mt.GetDuration ? mt.GetDuration () : 0) : app.engine.wavesurfer.getDuration ();
		var lo = range ? range[0] : 0, hi = range ? range[1] : total;
		var all = markerListFor ( app );
		/* [階段 2 項目 8] 只要有區間標記，就改用「區間標記直接當成一段」的規則（見 rangeSegments） */
		if (all.some (function ( m ) { return m.end > m.time; })) return rangeSegments ( all, lo, hi );
		var cuts = all.filter (function ( m ) { return m.time > lo + 0.01 && m.time < hi - 0.01; });
		var out = [], start = lo, name = '', id = null, type = '';
		/* [新增] 剛好落在起點的標記（例如 0:00 的「開場」）要當成第一段的名稱，原本會被忽略 */
		for (var a = 0; a < all.length; ++a)
			if (all[a].time <= lo + 0.01 && all[a].time >= lo - 0.01) { name = all[a].name; id = all[a].id; type = all[a].type || ''; }
		for (var c = 0; c < cuts.length; ++c) {
			out.push ([start, cuts[c].time, name, id, type]);	/* [新增] 第 4 欄：起點標記 id（給「只匯出勾選段落」用） */
			start = cuts[c].time;
			name = cuts[c].name;
			id = cuts[c].id;
			type = cuts[c].type || '';
		}
		out.push ([start, hi, name, id, type]);
		return out;
	}

	/* [階段 2 項目 8] 區間標記直接當成一段：
	 *   - 區間標記 → [起, 結束]
	 *   - 點標記 → [起, 下一個標記的起點]（沒有下一個就到結尾）；落在別的區間裡面的點標記略過
	 *   - 區間之間沒被標記涵蓋的空隙不匯出；超出選取範圍的部分裁掉，短於 10 毫秒的略過
	 *   回傳 [起, 迄, 名稱, 標記id, 類型]，前四欄與 splitSegmentsFor 相同 */
	function rangeSegments ( all, lo, hi ) {
		var out = [], i, j, m, s, e, inside;
		for (i = 0; i < all.length; ++i) {
			m = all[i];
			if (m.end > m.time) e = m.end;
			else {
				inside = false;
				for (j = 0; j < all.length && !inside; ++j)
					inside = j !== i && all[j].end > all[j].time && m.time > all[j].time + 0.001 && m.time < all[j].end - 0.001;
				if (inside) continue;
				e = hi;
				for (j = i + 1; j < all.length; ++j)
					if (all[j].time > m.time + 0.001) { e = all[j].time; break; }
			}
			s = Math.max (m.time, lo); e = Math.min (e, hi);
			if (e - s < 0.01) continue;
			out.push ([s, e, m.name, m.id, m.type || '']);
		}
		return out;
	}

	/* [新增] 分割檔名範本：{name}/{檔名} 輸出檔名、{n}/{序號} 序號、{marker}/{標記名} 起點標記名稱 */
	var SPLIT_TPL_KEY = 'pk_split_tpl';
	var SPLIT_TPL_DEF = '{name}_{n}_{marker}';
	function splitLang () {
		var l = '';
		try { l = PKLocale.getLang () || ''; } catch (e) {}
		return /^(zh|kasu|hak)/i.test (l) ? 'zh' : 'en';
	}
	function LT ( zh, en ) { return splitLang () === 'zh' ? zh : en; }
	/* [階段 2 項目 7] 檔名用的時間：1m23s／1h02m03s */
	function tagTime ( s ) {
		s = Math.max (0, Math.floor (s + 1e-9));
		var h = (s / 3600) >> 0, m = ((s % 3600) / 60) >> 0, c = s % 60;
		return (h ? h + 'h' + (m < 10 ? '0' : '') : '') + m + 'm' + (c < 10 ? '0' : '') + c + 's';
	}
	function typeWord ( t ) { return t === 'chapter' ? LT ('章節', 'chapter') : t === 'loop' ? LT ('循環', 'loop') : t === '' ? LT ('一般', 'normal') : ''; }
	function splitNames ( tpl, base, segs, ext ) {
		var digits = String (segs.length).length < 2 ? 2 : String (segs.length).length, used = {}, out = [], i, num, s, k, n;
		tpl = (tpl || '').trim () || SPLIT_TPL_DEF;
		if (!/\{(n|序號)\}/.test (tpl)) tpl += '_{n}';	/* 沒寫序號就補上，避免檔名重複互相覆蓋 */
		for (i = 0; i < segs.length; ++i) {
			num = String (i + 1); while (num.length < digits) num = '0' + num;
			s = tpl.replace (/\{(name|檔名)\}/g, function () { return base; })
				.replace (/\{(n|序號)\}/g, function () { return num; })
				.replace (/\{(marker|標記名)\}/g, function () { return segs[i][2] || ''; })
				.replace (/\{(type|類型)\}/g, function () { return segs[i][4] === undefined ? '' : typeWord (segs[i][4]); })
				.replace (/\{(start|起點)\}/g, function () { return tagTime (segs[i][0]); })
				.replace (/\{(end|結束)\}/g, function () { return tagTime (segs[i][1]); });
			s = s.replace (/[\\\/:*?"<>|]/g, '_').replace (/_{2,}/g, '_').replace (/^[_\-\s]+|[_\-\s]+$/g, '') || (base + '_' + num);
			k = s; n = 1;
			while (used[ k.toLowerCase () ]) k = s + '_' + (++n);
			used[ k.toLowerCase () ] = 1;
			out.push ( k + ext );
		}
		return out;
	}

	function _menuFile ( app ) {
		var t = PKLocale.t;
		var AS = PKAE._deps.autosplit;	/* [新增] 自動分割（autosplit.js），沒載入時維持原本只能依標記分割 */
		function K ( id ) { var s = PKAE._deps.shortcuts; return s ? ' ' + s.hint ( id ) : ''; }
		return {
			name: t('menu.file'),
			children : [
				{ name: t('load.computer') + K ('open'), type: 'file', action: function () { app.fireEvent ('RequestLoadLocalFile'); } },
				{
					name: t('load.url'),
					action: function () {
						new PKSimpleModal({
							title: t('load.url_title'),
							ondestroy: function( q ) { app.ui.InteractionHandler.on = false; app.ui.KeyHandler.removeCallback ('modalTemp'); app.ui.KeyHandler.removeCallback ('modalTempEnter'); },
							buttons:[{
								title: t('load.url_btn'), clss:'pk_modal_a_accpt',
								callback: function( q ) {
									var input = q.el_body.getElementsByTagName('input')[0];
									var value = input.value.trim();
									function isURL ( str ) { return /^((https?:)?\/\/)?(?:\S+(?::\S*)?@)?(?:(?:(?:[a-z\d](?:[a-z\d-]*[a-z\d])*)\.)+[a-z]{2,}|(?:\d{1,3}\.){3}\d{1,3})(?::\d+)?(?:\/[-a-z\d%_.~+]*)*(?:\?[;&a-z\d%_.~+=-]*)?(?:#[-a-z\d_]*)?$/i.test(str); }
									if (isURL (value)) { if (app.fireEvent ('RequestLoadURL', value) !== true) app.engine.LoadURL ( value ); q.Destroy (); }
									else OneUp (t('load.url_invalid'), 1100);
								}
							}],
							body:'<label for="k00">' + t('load.url_label') + '</label>' +
								'<input style="min-width:250px" placeholder="' + t('load.url_placeholder') + '" class="pk_txt" type="text" id="k00" />',
							setup:function( q ) {
								app.fireEvent ('RequestPause');
								app.ui.InteractionHandler.checkAndSet ('modal');
								app.ui.KeyHandler.addCallback ('modalTemp', function ( e ) { q.Destroy (); }, [27]);
								app.ui.KeyHandler.addCallback ('modalTempEnter', function ( e ) { q.els.bottom[0].click (); }, [13]);
								setTimeout(function() { q.el && q.el.getElementsByTagName('input')[0].focus (); },20);
							}
						}).Show();
					}
				},
				{ name: t('load.sample'), action: function () { if (app.fireEvent ('RequestLoadSampleFile') !== true) app.engine.LoadSample ('test.mp3'); } },
				{ name: '---' },
				{ name: t('new_recording') + '…', action: function () { app.fireEvent('RequestActionNewRec'); } },
				/* [新增] 錄音倒數：關 → 3 秒 → 5 秒 循環切換 */
				{ name: t('rec.countdown_menu'), action: function () {
					var P = app._deps.recPrefs; if (!P) return ;
					var order = [0, 3, 5];
					var next = order[ (order.indexOf ( P.get ().countdown ) + 1) % order.length ];
					P.set ('countdown', next);
					OneUp (t('rec.countdown_menu') + '：' + (next ? t('rec.countdown_sec', { n: next }) : t('rec.countdown_off')), 1200);
				} },
				/* [新增] 錄音聲道：單聲道 ↔ 立體聲（偏好會被記住）。
				 * 立體聲只在「目前文件是立體聲」時生效；單聲道文件仍以單聲道錄音。 */
				{ name: t('rec.channels_menu'), action: function () {
					var P = app._deps.recPrefs; if (!P) return ;
					var next = P.get ().channels === 2 ? 1 : 2;
					P.set ('channels', next);
					var msg = t('rec.channels_menu') + '：' + t(next === 2 ? 'rec.channels_stereo' : 'rec.channels_mono');
					try {
						var buf = app.engine && app.engine.is_ready && app.engine.wavesurfer.backend.buffer;
						if (next === 2 && buf && buf.numberOfChannels < 2) msg += '（' + t('rec.channels_need_stereo') + '）';
					} catch (e) {}
					OneUp (msg, next === 2 ? 2200 : 1200);
				} },
				{ name: '---' },
				{
					name: t('save_draft'), clss: 'pk_inact',
					action: function ( e ) {
						if (!app.engine.is_ready) return ;
						var saving = function ( type, name ) {
							var buff = app.engine.wavesurfer.backend.buffer;
							if (type === 'copy') buff = app.engine.GetCopyBuff ();
							else if (type === 'sel') buff = app.engine.GetSel ();
							var func = function ( fls ) { var rr = Math.random().toString(36).substring(7); fls.SaveSession (buff, rr, name); app.stopListeningFor ('DidOpenDB', func); };
							app.listenFor ('DidOpenDB', func);
							if (!app.fls.on) app.fls.Init (function(err){if(err){alert(PKLocale.t('ui.db_error'))}});
							else app.fireEvent ('DidOpenDB', app.fls);
						};
						new PKSimpleModal ({
							title: t('save_local_title'),
							ondestroy: function( q ) { app.ui.InteractionHandler.on = false; app.ui.KeyHandler.removeCallback ('modalTempErr'); },
							buttons:[{
								title: t('save_local.btn'), clss:'pk_modal_a_accpt',
								callback: function( q ) {
									var type = 'whole'; var input = q.el_body.getElementsByTagName ('input'); var name = input[ input.length - 1 ].value;
									if (name) { name = name.trim (); if (name.length >= 100) name = name.substr(0,99).trim(); if (name.length === 0) name = null; } else name = null;
									for (var i = 0; i < input.length; ++i) { if (input[i].checked) { type = input[i].value; break; } }
									saving (type, name); q.Destroy ();
								}
							}],
							body:'<p>' + t('save_local_choose') + '</p>' +
								'<p style="font-size:11px;opacity:.7;margin:0 0 8px">' + t('drafts.tip') + '</p>' +	/* [新增] 草稿保存位置說明 */
								'<div class="pk_row"><input type="radio" class="pk_check" id="sl1" name="rdslnc" checked value="whole"><label style="vertical-align:top" for="sl1">' + t('save_local.whole_track') + '</label>' +
								'<input type="radio" class="pk_check" id="sl2" name="rdslnc" value="sel"><label style="vertical-align:top" class="pk_lblsel" for="sl2">' + t('save_local.selection') + '</label>'+
								'<input type="radio" class="pk_check" id="sl3" name="rdslnc" value="copy"><label style="vertical-align:top" class="pk_lblsel2" for="sl3">' + t('save_local.clipboard') + '</label></div>'+
								'<div class="pk_row"><label for="slk0">' + t('save_local.name_label') + '</label>' +
								'<input style="min-width:250px" placeholder="' + t('save_local.name_placeholder') + '" maxlength="100" class="pk_txt" type="text" id="slk0" /></div>',
							setup:function( q ) {
								var wv = app.engine.wavesurfer;
								var region = wv.regions.list[0];
								var lblr = q.el_body.getElementsByClassName('pk_lblsel')[0];
								if (!region) lblr.className = 'pk_dis';
								else { q.el_body.getElementsByClassName('pk_check')[1].checked = true; lblr.childNodes[1].textContent = app.ui.formatTime(region.start) + ' – ' + app.ui.formatTime(region.end); }
								var copy = app.engine.GetCopyBuff ();
								if (!copy) { var lbl = q.el_body.getElementsByClassName('pk_lblsel2')[0]; lbl.className = 'pk_dis'; }
								if (!app.isMobile) setTimeout(function() { q.el && q.el.getElementsByClassName('pk_txt')[0].focus (); },20);
								app.fireEvent ('RequestPause');
								app.ui.InteractionHandler.checkAndSet ('modal');
								app.ui.KeyHandler.addCallback ('modalTempErr', function ( e ) { q.Destroy (); }, [27]);
							}
						}).Show ();
					},
					setup: function ( obj ) {
						obj.title = t('drafts.tip');	/* [新增] 滑過時說明草稿存在哪裡 */
						app.listenFor ('DidUnloadFile', function () { obj.classList.add ('pk_inact'); });
						app.listenFor ('DidLoadFile', function () { obj.classList.remove ('pk_inact'); });
						app.listenFor ('DidStoreDB', function ( obj, e ) {
							var name = obj.id;
							var txt = '<div style="padding:2px 0">' + t('drafts.id') + ' ' + name + '</div><div style="padding:2px 0"><span>' + t('drafts.durr') + ' ' + obj.durr + 's</span>&nbsp;&nbsp;&nbsp;<span>' + t('drafts.chn') + ' ' + (obj.chans === 1 ? t('drafts.mono') : t('drafts.stereo')) + '</span></div><div style="padding:2px 0"><img src="' + obj.thumb + '" /></div>';
							new PKSimpleModal ({
								title: t('stored.title'),
								ondestroy: function( q ) { app.ui.InteractionHandler.on = false; app.ui.KeyHandler.removeCallback ('modalTempErr'); },
								buttons:[{ title: t('stored.open_new'), callback: function( q ) { window.open ( window.location.pathname + '?local=' + name); q.Destroy (); } }],
								body:'<p>' + t('stored.open_confirm') + '</p>' + txt,
								setup:function( q ) { app.fireEvent ('RequestPause'); app.fireEvent( 'RequestRegionClear'); app.ui.InteractionHandler.checkAndSet ('modal'); app.ui.KeyHandler.addCallback ('modalTempErr', function ( e ) { q.Destroy (); }, [27]); }
							}).Show ();
						});
					}
				},
				{
					name: t('open_drafts'),
					action: function ( e ) {
						var datenow = new Date ();
						/* [修改] 相對時間依語言顯示；原本寫死英文，且會覆寫 datenow（第一筆 < 60 秒後，其餘草稿全變 NaN） */
						var time_ago = function ( arg ) {
							var a = Math.max (0, (datenow - arg) / 1E3 >> 0), n;
							if (a < 60) return LT (a + ' 秒前', a + ' second' + (a === 1 ? '' : 's') + ' ago');
							if (a < 3600) { n = Math.floor (a / 60); return LT (n + ' 分鐘前', n + ' minute' + (n > 1 ? 's' : '') + ' ago'); }
							if (a < 86400) { n = Math.floor (a / 3600); return LT (n + ' 小時前', n + ' hour' + (n > 1 ? 's' : '') + ' ago'); }
							if (a < 2592000) { n = Math.floor (a / 86400); return LT (n + ' 天前', n + ' day' + (n > 1 ? 's' : '') + ' ago'); }
							n = Math.floor (a / 2592000); return LT (n + ' 個月前', n + ' month' + (n > 1 ? 's' : '') + ' ago');
						};
						var pad2 = function ( n ) { return (n < 10 ? '0' : '') + n; };
						var func = function ( fls ) {
							fls.ListSessions(function( ret ) {
								var msg = '';
								if (ret.length === 0) { msg += t('drafts.no_drafts'); }
								else {
									for (var i = 0; i < ret.length; ++i) {
										var curr = ret[i]; var date = new Date(curr.created);
										var datestr = (splitLang () === 'zh' ? date.getFullYear()+'/'+pad2(date.getMonth()+1)+'/'+pad2(date.getDate()) : (date.getMonth()+1)+'/'+date.getDate()+'/'+date.getFullYear())+' '+pad2(date.getHours())+':'+pad2(date.getMinutes())+':'+pad2(date.getSeconds());
										var agostr = time_ago (date); var filename = app.escapeHtml (curr.name || '-'); var duration = curr.durr; var thumb = curr.thumb;
										var chns = (curr.chans === 1 ? t('drafts.mono') : t('drafts.stereo'));
										msg += '<div id="pk_' + curr.id + '" class="pk_lcldrf"><div style="padding-bottom:2px"><span><i class="pk_i">' + t('drafts.name') + '</i>' + filename + '</span></div>' +
											'<div><span class="pk_lcls"><i class="pk_i">' + t('drafts.id') + '</i><strong>' + curr.id + '</strong><br/><i class="pk_i">' + t('drafts.chn') + '</i>'+ chns +'</span>' +
											'<span class="pk_lcls" style="width:50%;text-align:center"><i class="pk_i">' + t('drafts.date') + '</i><span>' + datestr + '<br/>'+ agostr +'</span></span>' +
											'<span style="text-align:right;float:right" class="pk_lcls"><i class="pk_i">' + t('drafts.durr') + '</i>' + duration + 's</span></div><div>' +
											'<img class="pk_lcli" src="' + thumb + '" />' +
											'<a class="pk_lcla2" onclick="PKAudioEditor.fireEvent(\'LoadDraft\',\'' + curr.id + '\', 3);">' + t('drafts.play') + '</a>' +
											'<a class="pk_lcla" onclick="PKAudioEditor.fireEvent(\'LoadDraft\',\'' + curr.id + '\');">' + t('drafts.open') + '</a>';
										if (app.engine.is_ready) msg += '<a onclick="PKAudioEditor.fireEvent(\'LoadDraft\',\'' + curr.id + '\',1);" class="pk_lcla">' + t('drafts.append') + '</a>';
										msg += '<a class="pk_lcla" style="color:#ad2b2b" onclick="PKAudioEditor.fireEvent(\'LoadDraft\',\'' + curr.id + '\',2);">' + t('drafts.del') + '</a></div></div>';
									}
								}
								var modal;
								var closeModal = function ( val, val2 ) { if (val2 === 2 || val2 === 3) return ; modal.Destroy (); modal = null; };
								var set_act_btn = function ( name, state ) { var act; if (!state) { act = modal.el_body.getElementsByClassName('pk_act')[0]; if (act) act.classList.remove ('pk_act'); } else { var el = document.getElementById ('pk_' + name); if (el) { act = el.getElementsByClassName ('pk_lcla2')[0]; act && act.classList.add ('pk_act'); } } };
								app.listenFor ('_lclStart', set_act_btn);
								modal = new PKSimpleModal ({ title: t('drafts.title'), clss: 'pk_bigger',
									ondestroy: function( q ) { app.fireEvent ('_lclStop'); app.ui.InteractionHandler.on = false; app.ui.KeyHandler.removeCallback ('modalTempErr'); app.stopListeningFor ('LoadDraft', closeModal); app.stopListeningFor ('_lclStart', set_act_btn); },
									buttons:[], body:'<div>' + msg + '</div>',
									setup:function( q ) { app.fireEvent ('RequestPause'); app.fireEvent( 'RequestRegionClear'); app.listenFor ('LoadDraft', closeModal); app.ui.InteractionHandler.checkAndSet ('modal'); app.ui.KeyHandler.addCallback ('modalTempErr', function ( e ) { q.Destroy (); }, [27]); }
								});
								modal.Show ();
							});
							app.stopListeningFor ('DidOpenDB', func);
						};
						app.listenFor ('DidOpenDB', func);
						if (!app.fls.on) app.fls.Init (function(err){if(err){alert(PKLocale.t('ui.db_error'))}});
						else app.fireEvent ('DidOpenDB', app.fls);
					},
					setup: function ( obj ) {
						obj.title = t('drafts.tip');	/* [新增] 滑過時說明草稿存在哪裡 */
						var source = {};
						app.listenFor ('_lclStop', function () { if (source.src) { source.src.stop (); source.src.disconnect (); source.src.onended = null; source.aud.close && source.aud.close (); source = {}; } });
						app.listenFor ('LoadDraft', function ( name, append ) {
							app.fls.Init (function (err) {
								if (err) return ;
								if (append === 2) {
									if (source.id === name) { app.fireEvent ('_lclStart', source.id, 0); source.src.stop (); source.src.disconnect (); source.src.onended = null; source.aud.close && source.aud.close (); source = {}; }
									app.fls.DelSession (name, function (name) { var el = document.getElementById ('pk_' + name); if (el) { if ( el.parentNode.children.length === 1 ) el.parentNode.innerHTML = t('drafts.no_drafts'); else el.parentNode.removeChild(el); } });
									return ;
								}
								if (append === 3) {
									if (source.id) { var xt = source.id === name; app.fireEvent ('_lclStart', source.id, 0); source.src.stop (); source.src.disconnect (); source.src.onended = null; source.aud.close && source.aud.close (); source = {}; if (xt) return ; }
									var aud_cont = new (w.AudioContext || w.webkitAudioContext)();
									if (aud_cont && aud_cont.state == 'suspended') aud_cont.resume && aud_cont.resume ();
									app.fls.GetSession (name, function ( e ) {
										if(e && e.id === name) {
											source.id = e.id; source.aud = aud_cont;
											source.src = app.engine.PlayBuff (e.data, e.chans, e.samplerate, aud_cont);
											if (!source.src) { source.aud && source.aud.close && source.aud.close (); source = {}; return ; }
											source.src.onended = function () { app.fireEvent ('_lclStart', source.id, 0); source.src.stop (); source.src.disconnect (); source.src.onended = null; source.aud.close && source.aud.close (); source = {}; };
											app.fireEvent ('_lclStart', e.id, 1);
										}
									});
									return ;
								}
								var overwrite = (function ( app, name, append ) {
									return function () { app.fls.GetSession (name, function ( e ) { if(e && e.id === name) { app.fireEvent ('RequestOriginalEditor'); app.engine.wavesurfer.backend._add = append ? 1 : 0; app.engine.LoadDB ( e ); } }); };
								})( app, name, append );
								if (app.engine.is_ready && !append) {
									var mm = new PKSimpleModal ({
										title: t('open_existing.title'), body: '<div>' + t('open_existing.body') + '</div>',
										buttons:[
											{ title: t('open_existing.open'), clss:'pk_modal_a_accpt', callback: function( q ) { overwrite (); q.Destroy (); } },
											{ title: t('open_existing.open_new'), clss:'pk_modal_a_accpt', callback: function( q ) { window.open (window.location.pathname + '?local=' + name); q.Destroy (); } }
										],
										setup: function ( q ) { app.ui.InteractionHandler.checkAndSet ('mm'); app.ui.KeyHandler.addCallback ('mmErr', function ( e ) { q.Destroy (); }, [27]); },
										ondestroy: function ( q ) { overwrite = null; app.ui.InteractionHandler.on = false; app.ui.KeyHandler.removeCallback ('mmErr'); }
									});
									setTimeout(function() { mm.Show (); },0);
									return ;
								}
								overwrite ();
							});
						});
					}
				},
				{ name: '---' },
				{
					name: t('export.title') + '…' + K ('save'),
					action: function () {
						new PKSimpleModal({
							title: t('export.title'),
							ondestroy: function( q ) { if (q._asJob) q._asJob.cancel (); app.ui.InteractionHandler.on = false; app.ui.KeyHandler.removeCallback ('modalTemp'); },
							buttons:[{
								title: t('export.export_btn'), clss:'pk_modal_a_accpt',
								callback: function( q ) {
									var input = q.el_body.getElementsByTagName('input')[0];
									var value = input.value.trim();
									var format = 'mp3', kbps = 128, export_sel = false, stereo = false, bit_depth = 16, split_on = false;
									var radios = q.el_body.getElementsByClassName ('pk_check');
									var l = radios.length;
									while (l-- > 0) {
										if (radios[l].checked) {
											if (radios[l].name == 'frmtex') format = radios[l].value;
											else if (radios[l].name == 'xport') { if (radios[l].value === 'sel') { var region = activeRegionFor ( app ); export_sel = region ? [region.start, region.end] : false; } }
											else if (radios[l].name == 'chnl') { if (radios[l].value === 'stereo') stereo = true; }
											else if (radios[l].name == 'wavbits') bit_depth = radios[l].value / 1;
										else if (radios[l].name == 'split') split_on = true;
											else if (radios[l].name == 'rdslnc') kbps = radios[l].value / 1;
										}
									}
									var dither_chk = document.getElementById ('wav-dither');
									var dither = !!(dither_chk && dither_chk.checked);
									if (format === 'amss') { var mt = activeMultitrackFor ( app ); if (mt) mt.ExportSession ( value ); q.Destroy (); return ; }
									if (format == 'flac') kbps = document.getElementById('flac-comp').value / 1;
									/* [新增] opus / aac 位元率；匯出取樣率（opus 固定 48000） */
									if (format === 'opus' || format === 'aac') kbps = document.getElementById('exp-wcbr').value / 1;
									/* [新增] 標籤欄位（mp3 → ID3v2、opus → Vorbis comment），演出者會記住 */
									var tg_title = document.getElementById ('ktag-title').value.trim ();
									var tg_artist = document.getElementById ('ktag-artist').value.trim ();
									var tg_album = document.getElementById ('ktag-album').value.trim ();
									try { w.localStorage.setItem ('pk_export_artist', tg_artist); } catch (e) {}
									var tg_ok = format === 'mp3' || format === 'opus' || format === 'flac';
									/* [新增] mp3：把標記寫成章節（ID3 CHAP/CTOC），時間相對於匯出範圍的起點 */
									var chap_in = document.getElementById ('kchap'), chapters = null;
									if (format === 'mp3' && chap_in && chap_in.checked && !chap_in.disabled) {
										var csegs = splitSegmentsFor ( app, export_sel ), clo = export_sel ? export_sel[0] : 0;
										chapters = csegs.map (function ( sg, ci ) { return { start: sg[0] - clo, end: sg[1] - clo, title: sg[2] || LT ('章節 ', 'Chapter ') + (ci + 1) }; });
									}
									var single_tag = tg_ok && (tg_title || tg_artist || tg_album || chapters) ? { title: tg_title, artist: tg_artist, album: tg_album, chapters: chapters } : null;
									var sr_sel = document.getElementById ('exp-srate');
									var target_rate = format === 'opus' ? 48000 : (sr_sel ? sr_sel.value / 1 : 0);
									/* [新增] 匯出響度正規化（目標 LUFS｜真峰值上限 dBTP） */
									var loud_sel = document.getElementById ('exp-loud');
									var loud = null;
									if (loud_sel && loud_sel.value) { var lp = loud_sel.value.split ('|'); loud = { target: lp[0] / 1, ceiling: lp[1] / 1 }; }
									/* [修改] 依標記／依靜音／依聲音特性變化分割：每段一個檔，打包成 zip */
									if (split_on && format !== 'amss') {
										var split_mode = AS && document.getElementById ('ksplitmode') ? document.getElementById ('ksplitmode').value : 'markers';
										var tpl_in = document.getElementById ('ksplit-tpl');
										var split_tpl = tpl_in ? tpl_in.value.trim () : '';
										try { w.localStorage.setItem (SPLIT_TPL_KEY, split_tpl || SPLIT_TPL_DEF); } catch (e) {}
										var ck_in = document.getElementById ('ksplit-ck');
										var only_ck = !!(ck_in && ck_in.checked && !ck_in.disabled);
										var runSplit = function ( segs ) {
											var base = value.replace (/\.[^.\/\\]+$/, '') || 'soundit-output';
											var ext = value.indexOf ('.') === -1 ? '' : value.substr (value.lastIndexOf ('.'));
											var names = splitNames ( split_tpl, base, segs, ext || '.' + format ), tags = [];	/* [修改] 檔名依範本產生（預設與原本相同） */
											for (var si = 0; si < segs.length; ++si) {
												tags.push ( tg_ok ? { title: segs[si][2] || tg_title || base, artist: tg_artist, album: tg_album || base, track: (si + 1) + '/' + segs.length } : null );
											}
											app.engine.ExportSegments ( base + '.zip', names, format, kbps, segs, stereo, bit_depth, dither, target_rate, tags, loud );
											q.Destroy ();
										};
										if (split_mode === 'markers') {
											var msegs = splitSegmentsFor ( app, export_sel );
											/* [新增] 只匯出標記清單勾選的段落（段落以起點標記判斷） */
											if (only_ck) {
												var ck_ids = (PKAE._deps.mrkpanel && PKAE._deps.mrkpanel.checked) ? PKAE._deps.mrkpanel.checked () : [];
												msegs = msegs.filter (function ( sg ) { return sg[3] && ck_ids.indexOf (sg[3]) !== -1; });
												if (msegs.length) { runSplit ( msegs ); return ; }
												OneUp (LT ('勾選的標記沒有對應的段落', 'No segments match the checked markers'), 1800);
												return ;
											}
											if (msegs.length > 1) { runSplit ( msegs ); return ; }
										}
										else {
											/* [新增] 自動分割：先分析再匯出，分析期間對話框保持開啟並顯示進度 */
											if (q._asBusy) return ;
											var prog = document.getElementById ('ksplit-prog');
											q._asBusy = true;
											if (prog) prog.textContent = AS.T ('mixing');
											q._asJob = AS.detectSegments ( app, split_mode, export_sel, function ( p ) {
												if (prog && q.el) prog.textContent = AS.T ('analyzing', { p: (p * 100) >> 0 });
											}, function ( asegs, found ) {
												q._asJob = null;
												if (!q.el) return ;
												q._asBusy = false;
												if (prog) prog.textContent = '';
												if (asegs.length > 1 || (split_mode === 'speech' && asegs.length === 1)) runSplit ( asegs );	/* 有聲句段：只有一句也要匯出 */
												else OneUp (AS.T (asegs.length || found ? 'none' : 'no_audio'), 1800);
											});
											return ;
										}
									}
									app.engine.DownloadFile ( value, format, kbps, export_sel, stereo, bit_depth, dither, target_rate, single_tag, loud );
									q.Destroy ();
								}
							}],
							body:'<div class="pk_row"><label for="k0">' + t('export.name_label') + '</label>' +
								'<input style="min-width:250px" placeholder="' + t('export.name_placeholder') + '" value="soundit-output.mp3" class="pk_txt" type="text" id="k0" /></div>'+
								'<div class="pk_row" id="frmtex" style="padding-bottom:4px"><label style="display:inline">' + t('export.format') + '</label>'+
								'<input type="radio" class="pk_check" id="k01" name="frmtex" checked value="mp3"><label for="k01">mp3</label>' +
								'<input type="radio" class="pk_check" id="k02" name="frmtex" value="wav"><label for="k02">wav</label>' +
								'<input type="radio" class="pk_check" id="k03" name="frmtex" value="flac"><label for="k03">flac</label>' +
								'<input type="radio" class="pk_check" id="kopus" name="frmtex" value="opus"><label for="kopus">opus</label>' +
								'<input type="radio" class="pk_check" id="kaac" name="frmtex" value="aac"><label for="kaac">aac</label>' +
								'<br class="pk_amss"><input type="radio" class="pk_check pk_amss" id="k04" name="frmtex" value="amss"><label class="pk_amss" for="k04">' + t('export.session_file') + '</label></div>' +
								'<div class="pk_row" id="frmtex-mp3"><input type="radio" class="pk_check" id="k1" name="rdslnc" checked value="128"><label for="k1">128kbps</label>' +
								'<input type="radio" class="pk_check" id="k2" name="rdslnc" value="192"><label for="k2">192kbps</label>'+
								'<input type="radio" class="pk_check" id="k3" name="rdslnc" value="256"><label for="k3">256kbps</label></div>'+
								'<div class="pk_row" style="display:none" id="frmtex-flac"><label>' + t('export.compression_level') + '</label>'+
								'<input type="range" class="pk_horiz" min="0" max="8" step="1" value="5" id="flac-comp"><span class="pk_val" style="float:left;margin-left:15px">5</span></div>' +
								'<div class="pk_row" style="display:none" id="frmtex-wav">'+
								'<input type="radio" class="pk_check" id="kwb1" name="wavbits" checked value="16"><label for="kwb1">16-bit</label>'+
								'<input type="radio" class="pk_check" id="kwb2" name="wavbits" value="24"><label for="kwb2">24-bit</label>'+
								'<input type="radio" class="pk_check" id="kwb3" name="wavbits" value="32"><label for="kwb3">32-bit float</label>'+
								'<div id="wav-dither-wrap" style="margin-top:6px"><input type="checkbox" class="pk_check" id="wav-dither"><label for="wav-dither">TPDF dither</label></div></div>' +
								'<div class="pk_row" style="display:none" id="frmtex-wc"><label>' + t('export.bitrate') + '</label>' +
								'<select id="exp-wcbr"><option value="64">64 kbps</option><option value="96">96 kbps</option><option value="128" selected>128 kbps</option><option value="160">160 kbps</option><option value="192">192 kbps</option><option value="256">256 kbps</option></select></div>' +
								'<div class="pk_row" id="frmtex-sr"><label>' + t('export.sample_rate') + '</label>' +
								'<select id="exp-srate"><option value="0" selected>' + t('export.sr_original') + '</option><option value="44100">44.1 kHz</option><option value="48000">48 kHz</option><option value="96000">96 kHz</option></select></div>' +
								'<div class="pk_row" id="frmtex-loud"><label>' + t('export.loudness') + '</label>' +
								'<select id="exp-loud"><option value="" selected>' + t('export.loud_off') + '</option><option value="-14|-1">Spotify / YouTube (-14 LUFS)</option><option value="-23|-1">' + t('export.loud_ebu') + ' (-23 LUFS)</option></select></div>' +
								'<div class="pk_row" style="padding-bottom:5px">' +
								'<input type="radio" class="pk_check" id="k6" name="chnl" checked value="mono"><label for="k6">' + t('export.mono') + '</label>'+
								'<input type="radio" class="pk_check pk_stereo" id="k7" name="chnl" value="stereo"><label for="k7">' + t('export.stereo') + '</label></div>'+
								'<div class="pk_row">' +
								'<input type="radio" class="pk_check" id="k4" name="xport" checked value="whole"><label for="k4">' + t('export.whole_file') + '</label>'+
								'<input type="radio" class="pk_check" id="k5" name="xport" value="sel"><label class="pk_lblmp3" for="k5">' + t('export.selection_only') + '</label></div>' +
								'<div class="pk_row" id="frmtex-split"><input type="checkbox" class="pk_check" id="ksplit" name="split"><label for="ksplit">' + t('export.split_markers') + '</label>' +
								(AS ? '<select id="ksplitmode" style="margin-left:8px"><option value="markers">' + AS.T ('sp_markers') + '</option><option value="silence">' + AS.T ('sp_silence') + '</option><option value="change">' + AS.T ('sp_change') + '</option><option value="speech">' + AS.T ('sp_speech') + '</option></select>' +
								'<div id="ksplit-prog" style="min-height:14px;font-size:11px;opacity:.7"></div>' : '') + '</div>' +
								/* [新增] 分割檔名範本，以及「只匯出標記清單勾選的段落」 */
								'<div class="pk_row" id="frmtex-splitopt" style="font-size:11px">' +
								'<label for="ksplit-tpl" title="{name} {n} {marker} {type} {start} {end} / {檔名} {序號} {標記名} {類型} {起點} {結束}">' + LT ('檔名範本', 'File name') + '</label>' +
								'<input class="pk_txt" type="text" id="ksplit-tpl" style="width:46%;margin-left:6px" maxlength="80" value="' + (function () { var v = SPLIT_TPL_DEF; try { v = w.localStorage.getItem (SPLIT_TPL_KEY) || v; } catch (e) {} return v.replace (/&/g, '&amp;').replace (/"/g, '&quot;').replace (/</g, '&lt;'); })() + '">' +
								'<br><input type="checkbox" class="pk_check" id="ksplit-ck"><label for="ksplit-ck" id="ksplit-cklbl">' + LT ('只匯出標記清單勾選的段落', 'Only segments checked in the marker list') + '</label></div>' +
								'<div class="pk_row" style="display:none;font-size:11px" id="frmtex-chap"><input type="checkbox" class="pk_check" id="kchap"><label for="kchap" id="kchap-lbl">' + LT ('把標記寫成 MP3 章節', 'Write markers as MP3 chapters') + '</label></div>' +
								'<div class="pk_row" style="display:none" id="frmtex-tag"><label>' + t('export.tags') + '</label>' +
								'<input class="pk_txt" type="text" id="ktag-title" placeholder="' + t('export.tag_title') + '" style="width:30%">' +
								'<input class="pk_txt" type="text" id="ktag-artist" placeholder="' + t('export.tag_artist') + '" style="width:30%;margin-left:4px">' +
								'<input class="pk_txt" type="text" id="ktag-album" placeholder="' + t('export.tag_album') + '" style="width:30%;margin-left:4px"></div>',
							setup:function( q ) {
								var wv = PKAudioEditor.engine.wavesurfer;
								var mt_on = activeMultitrackFor ( app );
								var region = activeRegionFor ( app );
								if (!region) { var lbl = q.el_body.getElementsByClassName('pk_lblmp3')[0]; lbl.className = 'pk_dis'; }
								var chan_num = mt_on ? 2 : (wv.backend.buffer ? wv.backend.buffer.numberOfChannels : 1);
								if (chan_num === 2) q.el_body.getElementsByClassName('pk_stereo')[0].checked = true;
								app.fireEvent ('RequestPause');
								app.ui.InteractionHandler.checkAndSet ('modal');
								app.ui.KeyHandler.addCallback ('modalTemp', function ( e ) { q.Destroy (); }, [27]);
								setTimeout(function() {
									if (!q.el) return ;
									var inputtxt = q.el.getElementsByTagName('input')[0];
									inputtxt && inputtxt.select ();
									var format = document.getElementById('frmtex');
									var mp3conf = document.getElementById('frmtex-mp3');
									var flacconf = document.getElementById('frmtex-flac');
									var wavconf = document.getElementById('frmtex-wav');
									var ditherWrap = document.getElementById('wav-dither-wrap');
									var amss = q.el_body.getElementsByClassName ('pk_amss');
									function setDitherFor ( bits ) { var on = bits === 16; document.getElementById('wav-dither').disabled = !on; ditherWrap.classList.toggle ('pk_inact', !on); }
									var splitchk = document.getElementById ('ksplit');
									/* [新增] 「只匯出勾選段落」：清單有勾選且分割方式為「依現有標記」時才能用 */
									var ckbox = document.getElementById ('ksplit-ck'), cklbl = document.getElementById ('ksplit-cklbl'), spm = document.getElementById ('ksplitmode');
									function syncCk () {
										var n = (PKAE._deps.mrkpanel && PKAE._deps.mrkpanel.checked) ? PKAE._deps.mrkpanel.checked ().length : 0;
										var ok = n > 0 && (!spm || spm.value === 'markers');
										ckbox.disabled = !ok;
										if (!ok) ckbox.checked = false;
										cklbl.className = ok ? '' : 'pk_dis';
										cklbl.title = ok ? '' : LT ('先在「標記清單」勾選要匯出的標記，並選擇「依現有標記」', 'Check markers in the Marker list first and choose "At existing markers"');
									}
									syncCk ();
									spm && spm.addEventListener ('change', syncCk);
									/* [修改] 沒有標記時：有 autosplit 就預設改用「依靜音」，沒有才停用 */
									if (!markerListFor ( app ).length) {
										var spmode = document.getElementById ('ksplitmode');
										if (spmode) { spmode.options[0].disabled = true; spmode.value = 'silence'; }
										else { splitchk.disabled = true; splitchk.nextSibling.className = 'pk_dis'; splitchk.nextSibling.title = t('export.split_none'); }
									}
									var wcconf = document.getElementById('frmtex-wc');
									var srconf = document.getElementById('frmtex-sr');
									var loudconf = document.getElementById('frmtex-loud');
									var srsel = document.getElementById('exp-srate');
									var tagrow = document.getElementById('frmtex-tag');
									var chaprow = document.getElementById('frmtex-chap');
									if (!markerListFor ( app ).length) { var kc = document.getElementById ('kchap'); kc.disabled = true; document.getElementById ('kchap-lbl').className = 'pk_dis'; document.getElementById ('kchap-lbl').title = LT ('目前沒有標記', 'No markers'); }
									try { document.getElementById ('ktag-artist').value = w.localStorage.getItem ('pk_export_artist') || ''; } catch (e) {}
									function showConf ( m, f, w, c ) { chaprow.style.display = m ? 'block' : 'none'; tagrow.style.display = (m || f || (c && document.getElementById ('kopus').checked)) ? 'block' : 'none'; mp3conf.style.display = m ? 'block' : 'none'; flacconf.style.display = f ? 'block' : 'none'; wavconf.style.display = w ? 'block' : 'none'; wcconf.style.display = c ? 'block' : 'none'; }
									/* [新增] 依格式調整取樣率選單：opus 固定 48k；mp3 / aac 不提供 96k */
									function syncRate ( v ) {
										var o = srsel.options;
										o[3].disabled = (v === 'mp3' || v === 'aac' || v === 'opus');
										if (v === 'opus') { srsel.value = '48000'; srsel.disabled = true; }
										else { srsel.disabled = false; if (o[3].disabled && srsel.value === '96000') srsel.value = '0'; }
									}
									syncRate ('mp3');
									showConf (1, 0, 0, 0);
									/* [新增] 偵測瀏覽器是否支援 opus / aac 編碼，不支援就停用 */
									['opus', 'aac'].forEach(function ( f ) {
										var r = document.getElementById (f === 'opus' ? 'kopus' : 'kaac');
										var lb = r && r.nextSibling;
										var PE = PKAudioEditor._deps.webEnc;
										function off () { r.disabled = true; if (lb) { lb.className = 'pk_dis'; lb.title = t('export.codec_unsupported', {fmt: f}); } }
										if (!PE || !PE.hasEncoder ()) { off (); return ; }
										PE.isSupported ( f ).then(function ( ok ) { if (!ok) off (); });
									});
									var k6 = document.getElementById ('k6'); var k7 = document.getElementById ('k7');
									if (!mt_on) { for (var x = 0; x < amss.length; ++x) amss[x].style.display = 'none'; }
									function setExt ( ext ) { inputtxt.value = inputtxt.value.replace (/\.(mp3|wav|flac|opus|aac|amss)$/i, '') + ext; }
									function chanOff ( off ) { k6.disabled = k7.disabled = !!off; }
									if (mt_on) { document.getElementById ('k01').checked = true; showConf (1, 0, 0); chanOff ( false ); setExt ('.mp3'); }
									document.getElementById('flac-comp').oninput = function() { this.parentNode.getElementsByTagName('span')[0].innerText = this.value; };
									setDitherFor (16);
									wavconf.addEventListener ('change', function () { var ws = wavconf.getElementsByTagName ('input'); for (var i = 0; i < ws.length; ++i) if (ws[i].name === 'wavbits' && ws[i].checked) { setDitherFor (ws[i].value / 1); break; } }, false);
									format && format.addEventListener('change', function(e){ var inputs = this.getElementsByTagName('input'); for (var i = 0; i < inputs.length; ++i) { if (inputs[i].checked) { var v = inputs[i].value; chanOff (v === 'amss'); showConf (v === 'mp3', v === 'flac', v === 'wav', v === 'opus' || v === 'aac'); srconf.style.display = loudconf.style.display = v === 'amss' ? 'none' : 'block'; syncRate (v); setExt ('.' + v); } } }, false);
								},20);
							}
						}).Show();
					},
					clss: 'pk_inact',
					setup: function ( obj ) {
						obj.setAttribute('data-id', 'dl');
						function setExportReady () { var mt = activeMultitrackFor ( app ); if (mt || (app.engine && app.engine.is_ready)) obj.classList.remove ('pk_inact'); else obj.classList.add ('pk_inact'); }
						app.listenFor ('DidUnloadFile', setExportReady);
						app.listenFor ('DidLoadFile', setExportReady);
						app.listenFor ('DidUpdateMultitrack', setExportReady);
						setExportReady ();
					}
				},
				/* [新增] 批次處理：多個檔案套用同一套處理流程後一次匯出（batch.js）。不需要先開啟檔案 */
				{
					name: LT ('批次處理…', 'Batch Process…'),
					action: function () {
						var B = PKAE._deps.batch;
						if (B) B.open ( app ); else OneUp (LT ('批次處理模組未載入', 'Batch module not loaded'), 1500);
					}
				}
			]
		};
	}

	PKAE._deps._menuFile = _menuFile;

})( window, document, PKAudioEditor );


