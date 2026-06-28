(function ( w, d, PKAE ) {
	'use strict';

	var h = PKAE._deps.uiHelpers;
	var activeMultitrackFor = h.activeMultitrackFor;
	var activeRegionFor = h.activeRegionFor;

	function _menuFile ( app ) {
		var t = PKLocale.t;
		return {
			name: t('menu.file'),
			children : [
				{
					name: t('export.title'),
					action: function () {
						new PKSimpleModal({
							title: t('export.title'),
							ondestroy: function( q ) { app.ui.InteractionHandler.on = false; app.ui.KeyHandler.removeCallback ('modalTemp'); },
							buttons:[{
								title: t('export.export_btn'), clss:'pk_modal_a_accpt',
								callback: function( q ) {
									var input = q.el_body.getElementsByTagName('input')[0];
									var value = input.value.trim();
									var format = 'mp3', kbps = 128, export_sel = false, stereo = false, bit_depth = 16;
									var radios = q.el_body.getElementsByClassName ('pk_check');
									var l = radios.length;
									while (l-- > 0) {
										if (radios[l].checked) {
											if (radios[l].name == 'frmtex') format = radios[l].value;
											else if (radios[l].name == 'xport') { if (radios[l].value === 'sel') { var region = activeRegionFor ( app ); export_sel = region ? [region.start, region.end] : false; } }
											else if (radios[l].name == 'chnl') { if (radios[l].value === 'stereo') stereo = true; }
											else if (radios[l].name == 'wavbits') bit_depth = radios[l].value / 1;
											else kbps = radios[l].value / 1;
										}
									}
									var dither_chk = document.getElementById ('wav-dither');
									var dither = !!(dither_chk && dither_chk.checked);
									if (format === 'amss') { var mt = activeMultitrackFor ( app ); if (mt) mt.ExportSession ( value ); q.Destroy (); return ; }
									if (format == 'flac') kbps = document.getElementById('flac-comp').value / 1;
									app.engine.DownloadFile ( value, format, kbps, export_sel, stereo, bit_depth, dither );
									q.Destroy ();
								}
							}],
							body:'<div class="pk_row"><label for="k0">' + t('export.name_label') + '</label>' +
								'<input style="min-width:250px" placeholder="' + t('export.name_placeholder') + '" value="audiomass-output.mp3" class="pk_txt" type="text" id="k0" /></div>'+
								'<div class="pk_row" id="frmtex" style="padding-bottom:4px"><label style="display:inline">' + t('export.format') + '</label>'+
								'<input type="radio" class="pk_check" id="k01" name="frmtex" checked value="mp3"><label for="k01">mp3</label>' +
								'<input type="radio" class="pk_check" id="k02" name="frmtex" value="wav"><label for="k02">wav <i>(44100hz)</i></label>' +
								'<input type="radio" class="pk_check" id="k03" name="frmtex" value="flac"><label for="k03">flac</label>' +
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
								'<div class="pk_row" style="padding-bottom:5px">' +
								'<input type="radio" class="pk_check" id="k6" name="chnl" checked value="mono"><label for="k6">' + t('export.mono') + '</label>'+
								'<input type="radio" class="pk_check pk_stereo" id="k7" name="chnl" value="stereo"><label for="k7">' + t('export.stereo') + '</label></div>'+
								'<div class="pk_row">' +
								'<input type="radio" class="pk_check" id="k4" name="xport" checked value="whole"><label for="k4">' + t('export.whole_file') + '</label>'+
								'<input type="radio" class="pk_check" id="k5" name="xport" value="sel"><label class="pk_lblmp3" for="k5">' + t('export.selection_only') + '</label></div>',
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
									function showConf ( m, f, w ) { mp3conf.style.display = m ? 'block' : 'none'; flacconf.style.display = f ? 'block' : 'none'; wavconf.style.display = w ? 'block' : 'none'; }
									var k6 = document.getElementById ('k6'); var k7 = document.getElementById ('k7');
									if (!mt_on) { for (var x = 0; x < amss.length; ++x) amss[x].style.display = 'none'; }
									function setExt ( ext ) { inputtxt.value = inputtxt.value.replace (/\.(mp3|wav|flac|amss)$/i, '') + ext; }
									function chanOff ( off ) { k6.disabled = k7.disabled = !!off; }
									if (mt_on) { document.getElementById ('k01').checked = true; showConf (1, 0, 0); chanOff ( false ); setExt ('.mp3'); }
									document.getElementById('flac-comp').oninput = function() { this.parentNode.getElementsByTagName('span')[0].innerText = this.value; };
									setDitherFor (16);
									wavconf.addEventListener ('change', function () { var ws = wavconf.getElementsByTagName ('input'); for (var i = 0; i < ws.length; ++i) if (ws[i].name === 'wavbits' && ws[i].checked) { setDitherFor (ws[i].value / 1); break; } }, false);
									format && format.addEventListener('change', function(e){ var inputs = this.getElementsByTagName('input'); for (var i = 0; i < inputs.length; ++i) { if (inputs[i].checked) { var v = inputs[i].value; chanOff (v === 'amss'); showConf (v === 'mp3', v === 'flac', v === 'wav'); setExt ('.' + v); } } }, false);
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
				{ name: t('load.computer'), type: 'file', action: function () { app.fireEvent ('RequestLoadLocalFile'); } },
				{ name: t('load.sample'), action: function () { if (app.fireEvent ('RequestLoadSampleFile') !== true) app.engine.LoadSample ('test.mp3'); } },
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
									function isURL ( str ) { var pattern = new RegExp('^((https?:)?\\/\\/)?(?:\\S+(?::\\S*)?@)?(?:(?:[a-z\\d](?:[a-z\\d-]*[a-z\\d])*)\\.)+[a-z]{2,}|((?:\\d{1,3}\\.){3}\\d{1,3}))(\\:\\d+)?(\\/[-a-z\\d%_.~+]*)*(\\?[;&a-z\\d%_.~+=-]*)?(\\#[-a-z\\d_]*)?$','i'); return pattern.test(str); }
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
				{ name: t('new_recording'), action: function () { app.fireEvent('RequestActionNewRec'); } },
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
							if (!app.fls.on) app.fls.Init (function(err){if(err){alert("db error")}});
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
								else { q.el_body.getElementsByClassName('pk_check')[1].checked = true; lblr.childNodes[1].textContent = app.ui.formatTime(region.start) + ' to ' + app.ui.formatTime(region.end); }
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
						app.listenFor ('DidUnloadFile', function () { obj.classList.add ('pk_inact'); });
						app.listenFor ('DidLoadFile', function () { obj.classList.remove ('pk_inact'); });
						app.listenFor ('DidStoreDB', function ( obj, e ) {
							var name = obj.id;
							var txt = '<div style="padding:2px 0">id: ' + name + '</div><div style="padding:2px 0"><span>durr: ' + obj.durr + 's</span>&nbsp;&nbsp;&nbsp;<span>chan: ' + (obj.chans === 1 ? 'mono' : 'stereo') + '</span></div><div style="padding:2px 0"><img src="' + obj.thumb + '" /></div>';
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
						var time_ago = function ( arg ) {
							var a = (datenow - arg) / 1E3 >> 0;
							if (59 >= a) return datenow = 1 < a ? 's' : '', a + ' second' + datenow + ' ago';
							if (60 <= a && 3599 >= a) return a = Math.floor(a / 60), a + ' minute' + (1 < a ? 's' : '') + ' ago';
							if (3600 <= a && 86399 >= a) return a = Math.floor(a / 3600), a + ' hour' + (1 < a ? 's' : '') + ' ago';
							if (86400 <= a && 2592030 >= a) return a = Math.floor(a / 86400), a + ' day' + (1 < a ? 's' : '') + ' ago';
							if (2592031 <= a) return a = Math.floor(a / 2592E3), a + ' month' + (1 < a ? 's' : '') + ' ago';
						};
						var func = function ( fls ) {
							fls.ListSessions(function( ret ) {
								var msg = '';
								if (ret.length === 0) { msg += t('drafts.no_drafts'); }
								else {
									for (var i = 0; i < ret.length; ++i) {
										var curr = ret[i]; var date = new Date(curr.created);
										var datestr = (date.getMonth()+1)+'/'+date.getDate()+'/'+date.getFullYear()+' '+date.getHours()+':'+date.getMinutes()+':'+date.getSeconds();
										var agostr = time_ago (date); var filename = curr.name || '-'; var duration = curr.durr; var thumb = curr.thumb;
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
						if (!app.fls.on) app.fls.Init (function(err){if(err){alert("db error")}});
						else app.fireEvent ('DidOpenDB', app.fls);
					},
					setup: function () {
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
				}
			]
		};
	}

	PKAE._deps._menuFile = _menuFile;

})( window, document, PKAudioEditor );
