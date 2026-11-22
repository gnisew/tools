(function ( w, d, PKAE ) {
	'use strict';

	function activeMultitrackFor ( app ) {
		var mt = (app && app.multitrack) || (PKAE && PKAE.multitrack);
		var root = (app && app.el) || (PKAE && PKAE.el);
		return mt &&
			mt.IsOn &&
			(mt.IsOn () || (root && root.classList.contains ('pk_mt_on'))) ?
			mt :
			null;
	}

	function activeCursorTimeFor ( app ) {
		var mt = activeMultitrackFor ( app );
		var ws = app.engine && app.engine.wavesurfer;
		return mt ? mt.GetCursor () : (ws ? ws.getCurrentTime () : 0);
	}

	function activeDurationFor ( app ) {
		var mt = activeMultitrackFor ( app );
		var ws = app.engine && app.engine.wavesurfer;
		return mt ? mt.GetDuration () : (ws ? ws.getDuration () : 0);
	}

	function activeRegionFor ( app ) {
		var mt = activeMultitrackFor ( app );
		var ws = app.engine && app.engine.wavesurfer;
		return mt && mt.GetRegion ? mt.GetRegion () :
			(ws && ws.regions ? ws.regions.list[0] : null);
	}

	function activeZoomFor ( app ) {
		var mt = activeMultitrackFor ( app );
		var ws = app.engine && app.engine.wavesurfer;
		return mt ?
			(mt.GetSeekZoomFactor ? mt.GetSeekZoomFactor () : mt.GetZoomFactor ()) :
			(ws ? ws.ZoomFactor : 1);
	}

	function activeSeekRampFor ( app ) {
		return 0.15;
	}

	function activeSeekWarmupFor ( app ) {
		return 2;
	}

	function activeReadyFor ( app ) {
		return !!activeMultitrackFor ( app ) ||
			!!(app.engine && app.engine.is_ready);
	}

	function seekMarkerEdgeFor ( app, dir ) {
		return !!(app.mrk && app.mrk.edge && app.mrk.edge (dir));
	}

	function seekRegionMarkerEdgeFor ( app, dir ) {
		var mt = activeMultitrackFor ( app );
		var r = activeRegionFor ( app );
		var total = activeDurationFor ( app );
		var pos, start, end;

		if (r && total > 0) {
			pos = mt ? (mt.GetMarker ? mt.GetMarker () : mt.GetCursor ()) :
				app.engine.wavesurfer.ActiveMarker;
			start = mt ? r.start : r.start / total;
			end = mt ? r.end : r.end / total;

			if (dir < 0) {
				if (pos > end + 0.004) {
					app.fireEvent ('RequestSeekTo', (r.end / total) - 0.0001);
					return true;
				}
				if (pos > start + 0.004) {
					app.fireEvent ('RequestSeekTo', r.start / total);
					return true;
				}
			}
			else {
				if (pos < start - 0.004) {
					app.fireEvent ('RequestSeekTo', r.start / total);
					return true;
				}
				if (pos < end - 0.004) {
					app.fireEvent ('RequestSeekTo', r.end / total);
					return true;
				}
			}
		}

		if (seekMarkerEdgeFor (app, dir)) return true;
		app.fireEvent ('RequestSeekTo', dir < 0 ? 0 : 1);
		return true;
	}

	PKAE._deps.uiHelpers = {
		activeMultitrackFor: activeMultitrackFor,
		activeCursorTimeFor: activeCursorTimeFor,
		activeDurationFor: activeDurationFor,
		activeRegionFor: activeRegionFor,
		activeZoomFor: activeZoomFor,
		activeSeekRampFor: activeSeekRampFor,
		activeSeekWarmupFor: activeSeekWarmupFor,
		activeReadyFor: activeReadyFor,
		seekMarkerEdgeFor: seekMarkerEdgeFor,
		seekRegionMarkerEdgeFor: seekRegionMarkerEdgeFor
	};

})( window, document, PKAudioEditor );
