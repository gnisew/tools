(function ( w, d, PKAE ) {
	'use strict';

	function _toolbarSelection ( UI, app, btn_clear_selection ) {
		var t = PKLocale.t;
		var selection = d.createElement( 'div' );
		selection.className = 'pk_selection';
		selection.innerHTML = '<div class="pk_sellist">' +
			'<span class="pk_title">' + t('selection.label') + '</span>' +
			'<div><span class="title">' + t('selection.start') + '</span><span class="s_s pk_dat">-</span></div>' +
			'<div><span class="title">' + t('selection.end') + '</span><span class="s_e pk_dat">-</span></div>' +
			'<div><span  class="title">' + t('selection.duration') + '</span><span class="s_d pk_dat">-</span></div>' +
		'</div>';

		var sel_spans = selection.getElementsByClassName('pk_dat');
		var sb = null, sr = null, sd = 0;

		function closeSB () { if (!sb) return ; d.removeEventListener ('mousedown', sb._off); sb.parentNode && sb.parentNode.removeChild (sb); sb = null; }

		function tnav ( b, a, go, cl ) {
			b.onkeydown = function (ev) {
				var k = ev.keyCode, j;
				ev.stopPropagation ();
				if (k === 13) go ();
				else if (k === 27) cl ();
				else if (k > 36 && k < 41 && (j = a.indexOf (ev.target)) > -1) {
					if ((k === 37 || k === 39) && ev.target.tagName === 'INPUT' &&
						(ev.target.selectionStart !== ev.target.selectionEnd ||
						(k === 37 && ev.target.selectionStart > 0) ||
						(k === 39 && ev.target.selectionEnd < ev.target.value.length))) return ;
					j = (j + (k < 39 ? -1 : 1) + a.length) % a.length;
					a[j].focus (); a[j].tagName === 'INPUT' && a[j].select ();
					ev.preventDefault ();
				}
			};
		}

		function openSB ( e ) {
			var rg = sr, dur = sd || PKAE._deps.uiHelpers.activeDurationFor ( app );
			if (!rg || !(dur > 0)) return ;
			e.stopPropagation (); e.preventDefault (); closeSB ();
			var b = sb = d.createElement ('div');
			b.className = 'pk_pgeq_freq';
			b.style.cssText = 'padding:6px 10px;width:auto;white-space:nowrap';
			b.innerHTML = '<b style=font-size:12px>' + t('selection.start') + '</b> <input class="pk_mtbeat_bpm" style=width:62px> <b style=font-size:12px>' + t('selection.end') + '</b> <input class="pk_mtbeat_bpm" style=width:62px> <button class="pk_modal_a_bottom pk_modal_a_accpt" style="float:none;display:inline-block;vertical-align:middle">Go</button>';
			d.body.appendChild ( b );
			var i = b.getElementsByTagName ('input');
			var g = b.lastChild;
			var a = [i[0], i[1], g];
			i[0].value = rg.start.toFixed (3); i[1].value = rg.end.toFixed (3);
			var r = selection.getBoundingClientRect ();
			b.style.left = (r.left|0) + 'px'; b.style.top = ((r.top + 3)|0) + 'px';
			function go () {
				var rg = sr; var a = parseFloat (i[0].value), z = parseFloat (i[1].value);
				if (!rg) return closeSB ();
				dur = sd || PKAE._deps.uiHelpers.activeDurationFor ( app ) || dur;
				if (!(a >= 0)) a = rg.start; if (!(z >= 0)) z = rg.end;
				a = Math.max (0, Math.min (dur, a)); z = Math.max (0, Math.min (dur, z));
				if (Math.abs (z - a) > 0.001) UI.fireEvent ('RequestRegionSet', a, z);
				closeSB ();
			}
			b._off = function ( ev ) { if (!b.contains (ev.target) && !selection.contains (ev.target)) closeSB (); };
			tnav ( b, a, go, closeSB );
			g.onclick = go;
			d.addEventListener ('mousedown', b._off);
			i[e.target === sel_spans[1] ? 1 : 0].focus ();
		}
		sel_spans[0].onmousedown = sel_spans[1].onmousedown = sel_spans[2].onmousedown = openSB;

		UI.listenFor ('DidCreateRegion', function ( region ) {
			if (region && region.mt) { copy_btn.classList.add ('pk_inact'); cut_btn.classList.add  ('pk_inact'); }
			else { copy_btn.classList.remove ('pk_inact'); cut_btn.classList.remove ('pk_inact'); }
			btn_clear_selection.classList.remove  ('pk_inact');
			if (region) {
				sr = region; sd = PKAE._deps.uiHelpers.activeDurationFor ( app ) || region.end || 0;
				if (!sel_spans[0]) sel_spans = document.querySelectorAll('.pk_sellist .pk_dat');
				sel_spans[0].textContent = region.start.toFixed(3);
				sel_spans[1].textContent = region.end.toFixed(3);
				sel_spans[2].textContent = (region.end - region.start).toFixed(3);
			}
		});
		UI.listenFor ('DidDestroyRegion', function () {
			copy_btn.classList.add ('pk_inact'); cut_btn.classList.add  ('pk_inact');
			btn_clear_selection.classList.add  ('pk_inact');
			closeSB (); sr = null; sd = 0;
			if (!sel_spans[0]) sel_spans = document.querySelectorAll('.pk_sellist .pk_dat');
			sel_spans[0].textContent = '-'; sel_spans[1].textContent = '-'; sel_spans[2].textContent = '-';
		});

		selection.appendChild ( btn_clear_selection );
		return selection;
	}

	PKAE._deps._toolbarSelection = _toolbarSelection;

})( window, document, PKAudioEditor );
