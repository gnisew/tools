(function ( w, d, PKAE ) {
	'use strict';

	var t = PKLocale.t;
	function K ( id ) { var s = PKAE._deps.shortcuts; return s ? ' ' + s.hint ( id ) : ''; }

	/* 語言檔沒有該 key 時用內建中／英文（與 ui-menu-view.js 相同做法） */
	function tf ( key, zh, en ) {
		var s = t ( key );
		if (s && s !== key) return s;
		var lang = '';
		try { lang = PKLocale.getLang (); } catch (e) {}
		return lang === 'en' ? en : zh;
	}

	/* [新增] 編輯、標記兩個選單共用的小工具（都要 app，所以包成一個函式） */
	function tools ( app ) {
		/* 載入音訊（或開啟多軌）後才能用的項目 */
		function readyGate ( obj ) {
			function sync () {
				var h = PKAE._deps.uiHelpers;
				if (h && h.activeReadyFor ( app )) obj.classList.remove ('pk_inact'); else obj.classList.add ('pk_inact');
			}
			app.listenFor ('DidUnloadFile', sync);
			app.listenFor ('DidLoadFile', sync);
			app.listenFor ('DidUpdateMultitrack', sync);
			sync ();
		}

		/* 剪下／複製／刪除：有選取範圍才能用（和工具列按鈕的狀態一致） */
		function selGate ( obj ) {
			app.listenFor ('DidSelectClip', function () { obj.classList.remove ('pk_inact'); });
			app.listenFor ('DidDeselectClip', function () { obj.classList.add ('pk_inact'); });
			app.listenFor ('DidUnloadFile', function () { obj.classList.add ('pk_inact'); });
		}

		/* 貼上：剪貼簿有內容才能用 */
		function clipGate ( obj ) {
			app.listenFor ('DidSetClipboard', function ( val ) { if (val) obj.classList.remove ('pk_inact'); else obj.classList.add ('pk_inact'); });
		}

		/* 一般項目：label、動作、快捷鍵 id、啟用條件（'ready' 或 setup 函式） */
		function item ( label, action, sc, gate ) {
			var o = { name: label + (sc ? K ( sc ) : ''), action: action };
			if (gate) {
				o.clss = 'pk_inact';
				o.setup = gate === 'ready' ? readyGate : gate;
			}
			return o;
		}

		/* 呼叫標記模組（沒載入時什麼都不做） */
		function M ( fn ) { return function () { var m = PKAE.mrk; if (m) fn ( m ); }; }

		return { item: item, M: M, selGate: selGate, clipGate: clipGate };
	}

	function _menuEdit ( app ) {
		var u = tools ( app ), item = u.item;

		/* [修改] 編輯選單：標記相關全部搬到獨立的「標記」選單（見下方 _menuMarker），這裡只留一般編輯 */
		return {
			name: t('menu.edit'),
			children:[
				{
					name: t('edit.undo') + K ('undo'),
					clss: 'pk_inact',
					action: function () { app.fireEvent ('StateRequestUndo'); },
					setup: function ( obj ) {
						app.listenFor ('DidStateChange', function ( undo_states ) {
							if (undo_states.length === 0) { obj.innerHTML = t('edit.undo') + K ('undo'); obj.classList.add ('pk_inact'); }
							else { obj.innerHTML = t('edit.undo') + '&nbsp;<i style="pointer-events:none">' + undo_states[undo_states.length - 1].desc + '</i>' + K ('undo'); obj.classList.remove ('pk_inact'); }
						});
					}
				},
				{
					name: t('edit.redo') + K ('redo'),
					clss: 'pk_inact',
					action: function () { app.fireEvent ('StateRequestRedo'); },
					setup: function ( obj ) {
						app.listenFor('DidStateChange', function ( undo_states, redo_states ) {
							if (redo_states.length === 0) { obj.innerHTML = t('edit.redo') + K ('redo'); obj.classList.add ('pk_inact'); }
							else { obj.innerHTML = t('edit.redo') + '&nbsp;<i style="pointer-events:none">' + redo_states[0].desc + '</i>' + K ('redo'); obj.classList.remove ('pk_inact'); }
						});
					}
				},
				{
					name: tf ('edit.ab', 'A/B 對照（套用前／後）', 'A/B Compare (before / after)') + K ('ab_toggle'),
					clss: 'pk_inact',
					action: function () { app.fireEvent ('RequestABToggle'); },
					setup: function ( obj ) {
						app.listenFor ('DidStateChange', function ( u, r ) {
							if ((u && u.length) || (r && r.length)) obj.classList.remove ('pk_inact'); else obj.classList.add ('pk_inact');
						});
					}
				},
				{
					name: tf ('edit.repeat_last', '重複上一次動作', 'Repeat Last Action') + K ('repeat_last'),
					clss: 'pk_inact',
					action: function () { app.fireEvent ('RequestRepeatLastAction'); },
					setup: function ( obj ) {
						var base = tf ('edit.repeat_last', '重複上一次動作', 'Repeat Last Action');
						app.listenFor ('DidSetRepeatLast', function ( desc ) {
							if (!desc) { obj.innerHTML = base + K ('repeat_last'); obj.classList.add ('pk_inact'); }
							else {
								obj.innerHTML = base + '&nbsp;<i style="pointer-events:none">' + app.escapeHtml ( desc ) + '</i>' + K ('repeat_last');
								obj.classList.remove ('pk_inact');
							}
						});
					}
				},
				{ name: '---' },
				{ name: t('edit.play') + K ('play_stop'), action: function () { app.fireEvent ('RequestPlay'); } },
				{ name: t('edit.stop'), action: function () { app.fireEvent ('RequestStop'); } },
				{ name: '---' },
				/* [新增] 剪下／複製／貼上／刪除／插入靜音：原本只有工具列和快捷鍵，選單裡找不到 */
				item ( t('context.cut'), function () { app.fireEvent ('RequestActionCut', 1); }, 'cut', u.selGate ),
				item ( t('context.copy'), function () { app.fireEvent ('RequestActionCopy'); }, 'copy', u.selGate ),
				item ( t('context.paste'), function () { app.fireEvent ('RequestActionPaste'); }, 'paste', u.clipGate ),
				item ( tf ('edit.delete', '刪除', 'Delete'), function () { app.fireEvent ('RequestActionCut'); }, 'delete', u.selGate ),
				item ( tf ('edit.insert_silence', '插入靜音…', 'Insert Silence…'), function () { app.fireEvent ('RequestFXUI_Silence'); }, 'silence' ),
				{ name: '---' },
				{ name: t('edit.select_all') + K ('select_all'), action: function () { app.fireEvent ('RequestSelect'); } },
				{ name: t('edit.deselect_all') + K ('deselect'), action: function () { app.fireEvent ('RequestDeselect'); } },
				{
					name: t('edit.zero_cross'), action: function () { app.fireEvent ('RequestSnapSelDrag'); },
					setup: function ( obj ) {
						var txt = t('edit.zero_cross');
						function set ( val ) { obj.innerHTML = txt + (val ? ' &#10004;' : ''); }
						set (!w.localStorage || w.localStorage.pk_snapzc !== '0');
						app.listenFor ('DidSnapSelDrag', set);
					}
				},
				{ name: '---' },
				{
					name: t('edit.channel_info'), action: function () { app.fireEvent ('RequestActionFXUI_Flip'); }, clss: 'pk_inact',
					setup: function ( obj ) {
						app.listenFor ('DidUnloadFile', function () { obj.classList.add ('pk_inact'); });
						app.listenFor ('DidLoadFile', function () { obj.classList.remove ('pk_inact'); });
					}
				},
				{ name: t('edit.seamless_loop'), action: function () { app.fireEvent ('RequestActionFXUI_SeamlessLoop'); } }
			]
		};
	}

	/* [新增] 獨立的「標記」選單（放在「編輯」和「效果」之間）：
	 * 最常用的「標記清單」「自動分割標記」排在最上面，不再藏在子選單裡 */
	function _menuMarker ( app ) {
		var u = tools ( app ), item = u.item, M = u.M;
		var AS = PKAE._deps.autosplit;
		var list_txt = tf ('view.marker_list', '標記清單', 'Marker List');
		var children = [
			{
				/* 標記清單（浮動視窗），開啟時後面加 ✔；「檢視」選單裡的同名項目也會同步 */
				name: list_txt + K ('marker_list'),
				action: function () { var P = PKAE._deps.mrkpanel; P && P.toggle (); },
				setup: function ( obj ) {
					app.listenFor ('DidToggleMarkerPanel', function ( val ) {
						obj.innerHTML = list_txt + (val ? ' &#10004;' : '') + K ('marker_list');
					});
				}
			}
		];
		/* 自動分割標記：依靜音／聲音特性變化在波形上加標記（需載入 autosplit.js）；原本放在「編輯」最底下 */
		if (AS) children.push ( item ( AS.T ('menu'), function () { AS.open ( app ); }, '', 'ready' ) );
		children.push (
			{ name: '---' },
			item ( tf ('edit.mk_add', '在游標處加入標記', 'Add Marker at Cursor'), function () { app.fireEvent ('MrkrAdd'); }, 'marker_add', 'ready' ),
			item ( tf ('edit.mk_range', '以選取範圍建立區間標記', 'Add Range Marker from Selection'), M ( function ( m ) { m.addRangeFromSelection (); } ), 'range_add', 'ready' ),
			{ name: '---' },
			item ( tf ('edit.mk_split', '在游標處分割', 'Split at Cursor'), M ( function ( m ) { m.split (); } ), 'split_marker', 'ready' ),
			item ( tf ('edit.mk_merge', '與下一段合併', 'Merge with Next'), M ( function ( m ) { m.mergeNext (); } ), 'merge_marker_next', 'ready' ),
			{ name: '---' },
			item ( tf ('edit.mk_rename', '重新命名目前標記', 'Rename Current Marker'), M ( function ( m ) { m.renameUi (); } ), 'marker_rename', 'ready' ),
			item ( tf ('edit.mk_delete', '刪除目前標記', 'Delete Current Marker'), M ( function ( m ) { var id = m.active (); if (id) m.remove ( id ); } ), 'marker_delete', 'ready' ),
			{ name: '---' },
			item ( tf ('edit.mk_prev', '上一個標記', 'Previous Marker'), function () { app.fireEvent ('MrkrPrv', 0); }, 'marker_prev', 'ready' ),
			item ( tf ('edit.mk_next', '下一個標記', 'Next Marker'), function () { app.fireEvent ('MrkrNxt', 0); }, 'marker_next', 'ready' ),
			{ name: '---' },
			item ( tf ('edit.mk_missing', '漏標檢查…', 'Check Missing Markers…'), M ( function ( m ) { m.checkMissing (); } ), '', 'ready' ),
			item ( tf ('edit.mk_shift', '平移標記…', 'Shift Markers…'), M ( function ( m ) { m.shiftUi (); } ), '', 'ready' )
		);
		return { name: tf ('menu.marker', '標記', 'Markers'), children: children };
	}

	PKAE._deps._menuEdit = _menuEdit;
	PKAE._deps._menuMarker = _menuMarker;

})( window, document, PKAudioEditor );
