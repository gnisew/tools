(function ( w, d, PKAE ) {
	'use strict';

	function _topbarConfig ( app, ui ) {
		return [
			PKAE._deps._menuFile ( app ),
			PKAE._deps._menuEdit ( app ),
			PKAE._deps._menuEffects ( app ),
			PKAE._deps._menuView ( app ),
			PKAE._deps._menuHelp ( app )
		];
	}

	PKAE._deps._topbarConfig = _topbarConfig;

})( window, document, PKAudioEditor );
