(function ( w, d, PKAE ) {
	'use strict';

	function _topbarConfig ( app, ui ) {
		var menus = [
			PKAE._deps._menuFile ( app ),
			PKAE._deps._menuEdit ( app )
		];
		/* [新增] 「標記」選單（ui-menu-edit.js 提供），放在編輯與效果之間；沒載入時維持原本五個選單 */
		if (PKAE._deps._menuMarker) menus.push ( PKAE._deps._menuMarker ( app ) );
		menus.push (
			PKAE._deps._menuEffects ( app ),
			PKAE._deps._menuView ( app ),
			PKAE._deps._menuHelp ( app )
		);
		return menus;
	}

	PKAE._deps._topbarConfig = _topbarConfig;

})( window, document, PKAudioEditor );
