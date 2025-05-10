

window.onload=function(){ 
for(var ii=0; ii<document.links.length; ii++) 
document.links[ii].onfocus=function(){this.blur()} 
} 

//===============================================================================

{ //y 點擊後播放<script>y("a1.mp3")</script>
function y(path) {
document.write('<object type="application/x-shockwave-flash" data="http://163.27.202.136/gali/file/code/dewplayer-mini.swf" width="20" height="20" id="dewplayer" name="dewplayer">');
document.write('<param name="wmode" value="transparent" />');
document.write('<param name="movie" value="http://163.27.202.136/gali/file/code/dewplayer-mini.swf" />');
document.write('<param name="flashvars" value="mp3='+path+'" />');
document.write('</object>');}
}


{ //s 開啟後自動播放<script>s("a1.mp3")</script>
function s(path) {
document.write('<object type="application/x-shockwave-flash" data="http://163.27.202.136/gali/file/code/dewplayer-mini.swf" width="20" height="20" id="dewplayer" name="dewplayer">');
document.write('<param name="wmode" value="transparent" />');
document.write('<param name="movie" value="http://163.27.202.136/gali/file/code/dewplayer-mini.swf" />');
document.write('<param name="flashvars" value="mp3='+path+'&amp;autostart=1" />');
document.write('</object>');}
}


{//h 隱藏播放，可設定點字或點圖，但在</body>前要加<span id="h" style="height:0px;"></span>
// <a href="javascript:void(0);" onclick="h('a1.mp3');">點字播放</a>
// <a href="javascript:void(0);" onclick="h('a1.mp3');"><img src="pic.gif" style="border:0px;" alt="點圖播放" /></a>
function h(path) {
	content = '<object type="application/x-shockwave-flash" data="http://163.27.202.136/gali/file/code/player.swf?autolaunch=true&file=' + path + '" width="0" height="0">';
	content += '<param name="movie" value="http://163.27.202.136/gali/file/code/player.swf?autolaunch=true&file=' + path + '" />';
	content += '<param name="data" value="http://163.27.202.136/gali/file/code/player.swf?autolaunch=true&file=' + path + '" />';
	content += '<param name="src" value="http://163.27.202.136/gali/file/code/player.swf?autolaunch=true&file=' + path + '" />';
	content += '<param name="allowScriptAccess" value="sameDomain" />';
	content += '<param name="quality" value="high" />';
	content += '<param name="FlashVars" value="my_bitrate=128" />';
	content += '</object>';
	document.getElementById('h').innerHTML = content;}
}


//==========================================================================

{ //yy 點擊後播放<script>yy("a1.mp3")</script>
function yy(path) {
document.write('<object type="application/x-shockwave-flash" data="http://163.27.202.136/gali/file/code/dewplayer-mini.swf" width="160" height="20" id="dewplayer" name="dewplayer">');
document.write('<param name="wmode" value="transparent" />');
document.write('<param name="movie" value="http://163.27.202.136/gali/file/code/dewplayer-mini.swf" />');
document.write('<param name="flashvars" value="mp3='+path+'" />');
document.write('</object>');}
}

{ //ss 開啟後自動播放<script>ss("a1.mp3")</script>
function ss(path) {
document.write('<object type="application/x-shockwave-flash" data="http://163.27.202.136/gali/file/code/dewplayer-mini.swf" width="160" height="20" id="dewplayer" name="dewplayer">');
document.write('<param name="wmode" value="transparent" />');
document.write('<param name="movie" value="http://163.27.202.136/gali/file/code/dewplayer-mini.swf" />');
document.write('<param name="flashvars" value="mp3='+path+'&amp;autostart=1" />');
document.write('</object>');}
}

//==========================================================================

{ //youtube影片，寬550，高310，如<script>youtube("code")</script>
function youtube(youcode) {
document.write('<iframe width="550" height="310" src="http://www.youtube-nocookie.com/embed/'+youcode+'?rel=0" frameborder="0" allowfullscreen="true"></iframe>');}
}
























//開始==1bit Mp3播放器 ================================================

// 只要在網頁內寫 <a href="test.mp3"></a> 即可播放該聲音檔
// 若寫成 <a href="test.mp3">文字</a> 則點按鈕播聲音，點 "文字" 可連結或下載聲音
// 但在 </head> 之前要加 <script src="wesingcode.js"></script>
// 當然 1bit.swf 必須跟 wesingcode.js 同在一個資料夾
// 如果要設定連結到 mp3 的CSS樣式，可在</head>前添加如下
/*
	<style type="text/css">
    	.onebit_mp3 a { color: #CC0000; }
    </style>
*/

// 下面 [播放鈕設定] 可設定播放的大小與顏色

// 網站名稱 1 Bit Audio Player 
// 原始網站 http://1bit.markwheeler.net/ 
// 原始檔案 https://github.com/dsingleton/1bit-audio-player

//--SWFObject--------------------------------
/**
 * SWFObject v1.5: Flash Player detection and embed - http://blog.deconcept.com/swfobject/
 *
 * SWFObject is (c) 2007 Geoff Stearns and is released under the MIT License:
 * http://www.opensource.org/licenses/mit-license.php
 *
 */
if(typeof deconcept=="undefined"){var deconcept=new Object();}if(typeof deconcept.util=="undefined"){deconcept.util=new Object();}if(typeof deconcept.SWFObjectUtil=="undefined"){deconcept.SWFObjectUtil=new Object();}deconcept.SWFObject=function(_1,id,w,h,_5,c,_7,_8,_9,_a){if(!document.getElementById){return;}this.DETECT_KEY=_a?_a:"detectflash";this.skipDetect=deconcept.util.getRequestParameter(this.DETECT_KEY);this.params=new Object();this.variables=new Object();this.attributes=new Array();if(_1){this.setAttribute("swf",_1);}if(id){this.setAttribute("id",id);}if(w){this.setAttribute("width",w);}if(h){this.setAttribute("height",h);}if(_5){this.setAttribute("version",new deconcept.PlayerVersion(_5.toString().split(".")));}this.installedVer=deconcept.SWFObjectUtil.getPlayerVersion();if(!window.opera&&document.all&&this.installedVer.major>7){deconcept.SWFObject.doPrepUnload=true;}if(c){this.addParam("bgcolor",c);}var q=_7?_7:"high";this.addParam("quality",q);this.setAttribute("useExpressInstall",false);this.setAttribute("doExpressInstall",false);var _c=(_8)?_8:window.location;this.setAttribute("xiRedirectUrl",_c);this.setAttribute("redirectUrl","");if(_9){this.setAttribute("redirectUrl",_9);}};deconcept.SWFObject.prototype={useExpressInstall:function(_d){this.xiSWFPath=!_d?"expressinstall.swf":_d;this.setAttribute("useExpressInstall",true);},setAttribute:function(_e,_f){this.attributes[_e]=_f;},getAttribute:function(_10){return this.attributes[_10];},addParam:function(_11,_12){this.params[_11]=_12;},getParams:function(){return this.params;},addVariable:function(_13,_14){this.variables[_13]=_14;},getVariable:function(_15){return this.variables[_15];},getVariables:function(){return this.variables;},getVariablePairs:function(){var _16=new Array();var key;var _18=this.getVariables();for(key in _18){_16[_16.length]=key+"="+_18[key];}return _16;},getSWFHTML:function(){var _19="";if(navigator.plugins&&navigator.mimeTypes&&navigator.mimeTypes.length){if(this.getAttribute("doExpressInstall")){this.addVariable("MMplayerType","PlugIn");this.setAttribute("swf",this.xiSWFPath);}_19="<embed type=\"application/x-shockwave-flash\" src=\""+this.getAttribute("swf")+"\" width=\""+this.getAttribute("width")+"\" height=\""+this.getAttribute("height")+"\" style=\""+this.getAttribute("style")+"\"";_19+=" id=\""+this.getAttribute("id")+"\" name=\""+this.getAttribute("id")+"\" ";var _1a=this.getParams();for(var key in _1a){_19+=[key]+"=\""+_1a[key]+"\" ";}var _1c=this.getVariablePairs().join("&");if(_1c.length>0){_19+="flashvars=\""+_1c+"\"";}_19+="/>";}else{if(this.getAttribute("doExpressInstall")){this.addVariable("MMplayerType","ActiveX");this.setAttribute("swf",this.xiSWFPath);}_19="<object id=\""+this.getAttribute("id")+"\" classid=\"clsid:D27CDB6E-AE6D-11cf-96B8-444553540000\" width=\""+this.getAttribute("width")+"\" height=\""+this.getAttribute("height")+"\" style=\""+this.getAttribute("style")+"\">";_19+="<param name=\"movie\" value=\""+this.getAttribute("swf")+"\" />";var _1d=this.getParams();for(var key in _1d){_19+="<param name=\""+key+"\" value=\""+_1d[key]+"\" />";}var _1f=this.getVariablePairs().join("&");if(_1f.length>0){_19+="<param name=\"flashvars\" value=\""+_1f+"\" />";}_19+="</object>";}return _19;},write:function(_20){if(this.getAttribute("useExpressInstall")){var _21=new deconcept.PlayerVersion([6,0,65]);if(this.installedVer.versionIsValid(_21)&&!this.installedVer.versionIsValid(this.getAttribute("version"))){this.setAttribute("doExpressInstall",true);this.addVariable("MMredirectURL",escape(this.getAttribute("xiRedirectUrl")));document.title=document.title.slice(0,47)+" - Flash Player Installation";this.addVariable("MMdoctitle",document.title);}}if(this.skipDetect||this.getAttribute("doExpressInstall")||this.installedVer.versionIsValid(this.getAttribute("version"))){var n=(typeof _20=="string")?document.getElementById(_20):_20;n.innerHTML=this.getSWFHTML();return true;}else{if(this.getAttribute("redirectUrl")!=""){document.location.replace(this.getAttribute("redirectUrl"));}}return false;}};deconcept.SWFObjectUtil.getPlayerVersion=function(){var _23=new deconcept.PlayerVersion([0,0,0]);if(navigator.plugins&&navigator.mimeTypes.length){var x=navigator.plugins["Shockwave Flash"];if(x&&x.description){_23=new deconcept.PlayerVersion(x.description.replace(/([a-zA-Z]|\s)+/,"").replace(/(\s+r|\s+b[0-9]+)/,".").split("."));}}else{if(navigator.userAgent&&navigator.userAgent.indexOf("Windows CE")>=0){var axo=1;var _26=3;while(axo){try{_26++;axo=new ActiveXObject("ShockwaveFlash.ShockwaveFlash."+_26);_23=new deconcept.PlayerVersion([_26,0,0]);}catch(e){axo=null;}}}else{try{var axo=new ActiveXObject("ShockwaveFlash.ShockwaveFlash.7");}catch(e){try{var axo=new ActiveXObject("ShockwaveFlash.ShockwaveFlash.6");_23=new deconcept.PlayerVersion([6,0,21]);axo.AllowScriptAccess="always";}catch(e){if(_23.major==6){return _23;}}try{axo=new ActiveXObject("ShockwaveFlash.ShockwaveFlash");}catch(e){}}if(axo!=null){_23=new deconcept.PlayerVersion(axo.GetVariable("$version").split(" ")[1].split(","));}}}return _23;};deconcept.PlayerVersion=function(_29){this.major=_29[0]!=null?parseInt(_29[0]):0;this.minor=_29[1]!=null?parseInt(_29[1]):0;this.rev=_29[2]!=null?parseInt(_29[2]):0;};deconcept.PlayerVersion.prototype.versionIsValid=function(fv){if(this.major<fv.major){return false;}if(this.major>fv.major){return true;}if(this.minor<fv.minor){return false;}if(this.minor>fv.minor){return true;}if(this.rev<fv.rev){return false;}return true;};deconcept.util={getRequestParameter:function(_2b){var q=document.location.search||document.location.hash;if(_2b==null){return q;}if(q){var _2d=q.substring(1).split("&");for(var i=0;i<_2d.length;i++){if(_2d[i].substring(0,_2d[i].indexOf("="))==_2b){return _2d[i].substring((_2d[i].indexOf("=")+1));}}}return "";}};deconcept.SWFObjectUtil.cleanupSWFs=function(){var _2f=document.getElementsByTagName("OBJECT");for(var i=_2f.length-1;i>=0;i--){_2f[i].style.display="none";for(var x in _2f[i]){if(typeof _2f[i][x]=="function"){_2f[i][x]=function(){};}}}};if(deconcept.SWFObject.doPrepUnload){if(!deconcept.unloadSet){deconcept.SWFObjectUtil.prepUnload=function(){__flash_unloadHandler=function(){};__flash_savedUnloadHandler=function(){};window.attachEvent("onunload",deconcept.SWFObjectUtil.cleanupSWFs);};window.attachEvent("onbeforeunload",deconcept.SWFObjectUtil.prepUnload);deconcept.unloadSet=true;}}if(!document.getElementById&&document.all){document.getElementById=function(id){return document.all[id];};}var getQueryParamValue=deconcept.util.getRequestParameter;var FlashObject=deconcept.SWFObject;var SWFObject=deconcept.SWFObject;



//--[播放鈕設定]------------------------------
/*
<script type="text/javascript">
oneBit = new OneBit('1bit.swf');
oneBit.ready(function() {
oneBit.specify('color', '#000000');
oneBit.specify('background', '#FFFFFF');
oneBit.specify('playerSize', '10');
oneBit.specify('position', 'after');
oneBit.specify('analytics', false);
oneBit.apply('a');
});
</script>
*/


//--播放鈕設定------------------------------
function OneBit(pluginPath) {
		// Object Vars
	
	// Relative to calling path
	this.pluginPath = pluginPath || '1bit.swf';	
	
	// Style Options
	this.color = false;
	this.background = '#FFFFFF';
	this.playerSize = false;
	this.position = 'after';
	this.analytics = false;
	
	// Semi Internal
	this.wrapperClass = 'onebit_mp3';
	
	// Internal
	this.playerCount = 1;
	this.flashVersion = 9;

		// Methods
	
	// Specify optional settings
	this.specify = function(key, value) {
		if(key == "color") {
			this.color = value;
		}
		if(key == "background") {
			this.background = value;
		}
		if(key == "playerSize") {
			this.playerSize = value;
		}
		if(key == "position") {
			this.position = value;
		}
		if(key == "analytics") {
			this.analytics = value;
		}
	};
	
	// Run through each applicable link and add a player
	this.apply = function(selector) {
		var links = this.getElementsBySelector(selector);
		for(var i = 0; i < links.length; i++) {
			
			// Avoid applying the player twice to the same link
			if (this.hasClass(links[i].parentNode, this.wrapperClass)) {
				continue;
			}
			
			// Avoid non .mp3 links
			if (links[i].href.substr(links[i].href.length - 4) != '.mp3') {
				continue;
			}
			
			this.insertPlayer(links[i]);
		}	
	};
	
	this.insertPlayer = function(elem) {
		if (!this.playerSize) {
		    // Set the playerSize from the elements height
			this.autoPlayerSize = Math.floor(elem.scrollHeight * 0.65);
		}

		if(!this.color) {
			// Set the foreColor from the element's style
			this.autoColor = this.getStyle(elem, 'color');
			// Put in extra 0's if it's a 3 digit hex (which Flash doesn't understand)
			if(this.autoColor.substr(0, 1) == '#' && this.autoColor.length == 4) {
			    this.autoColor = this.autoColor.substr(0, 2) + '0' + this.autoColor.substr(2, 1) + '0' + this.autoColor.substr(3, 1) + '0';
			}
			// Convert to hex if required
			if(this.autoColor.substr(0, 1) != '#') {
			    this.autoColor = this.autoColor.substr(4, this.autoColor.indexOf(')') - 4);
				var rgbSplit = new Array();
				rgbSplit = this.autoColor.split(', ');
				this.autoColor = '#'+this.convertColor(Number(rgbSplit[2]),Number(rgbSplit[1]),Number(rgbSplit[0]));
			}
		}

		// Make a span to encapsulate the link and flash
		var playerWrapper = document.createElement('span');
		this.addClass(playerWrapper, this.wrapperClass);
				
		// Add an empty span to be replaced by the flash by it's ID
		var hook_id = 'oneBitInsert_' + this.playerCount;
		var span = document.createElement('span');
		span.setAttribute('id', hook_id);

		// Move everything where it needs to be
		elem.parentNode.insertBefore(playerWrapper, elem);
		if(this.position == 'before') {
	 		playerWrapper.appendChild(span);
	 		playerWrapper.innerHTML += '&nbsp;';
	 		playerWrapper.appendChild(elem);
		} else {
	 		playerWrapper.appendChild(elem);
	 		playerWrapper.innerHTML += '&nbsp;';
	 		playerWrapper.appendChild(span);
		}

	    // Insert the flash
		if(!this.playerSize) {
		    this.insertPlayerSize = this.autoPlayerSize;
		} else {
		    this.insertPlayerSize = this.playerSize;
		}

		var so = new SWFObject(
			this.pluginPath,
			hook_id,
			this.insertPlayerSize,
			this.insertPlayerSize,
			this.flashVersion,
			this.background
		);

		if(this.background == 'transparent') {
			so.addParam('wmode', 'transparent');
		}
		if(!this.color) {
			so.addVariable('foreColor', this.autoColor);
		} else {
            so.addVariable('foreColor', this.color);
		}
		so.addVariable('analytics', this.analytics);
		so.addVariable('filename', elem.href);

		so.write(hook_id);		
		this.playerCount++;
	};

	// Get CSS styles - based on http://www.quirksmode.org/dom/getstyles.html
	this.getStyle = function(el, styleProp) {
		if (el.currentStyle) {
			var value = el.currentStyle[styleProp];
		} else {
			var value = document.defaultView.getComputedStyle(el, null).getPropertyValue(styleProp);
  		}
		return value;
	};
	
	// Convert RGB color into Hex
	this.convertColor = function(red, green, blue) {
	    var decColor = red + 256 * green + 65536 * blue;
	    return decColor.toString(16);
	};
	
	// Get DOM elements based on the given CSS Selector - V 1.00.A Beta
	// http://www.openjs.com/scripts/dom/css_selector/
	this.getElementsBySelector = function (all_selectors) {
		var selected = new Array();
		if(!document.getElementsByTagName) return selected;
		all_selectors = all_selectors.replace(/\s*([^\w])\s*/g,"$1");//Remove the 'beutification' spaces
		var selectors = all_selectors.split(",");
		// Grab all of the tagName elements within current context	
		var getElements = function(context,tag) {
			if (!tag) tag = '*';
			// Get elements matching tag, filter them for class selector
			var found = new Array;
			for (var a=0,len=context.length; con=context[a],a<len; a++) {
				var eles;
				if (tag == '*') eles = con.all ? con.all : con.getElementsByTagName("*");
				else eles = con.getElementsByTagName(tag);

				for(var b=0,leng=eles.length;b<leng; b++) found.push(eles[b]);
			}
			return found;
		};

		COMMA:
		for(var i=0,len1=selectors.length; selector=selectors[i],i<len1; i++) {
			var context = new Array(document);
			var inheriters = selector.split(" ");

			SPACE:
			for(var j=0,len2=inheriters.length; element=inheriters[j],j<len2;j++) {
				//This part is to make sure that it is not part of a CSS3 Selector
				var left_bracket = element.indexOf("[");
				var right_bracket = element.indexOf("]");
				var pos = element.indexOf("#");//ID
				if(pos+1 && !(pos>left_bracket&&pos<right_bracket)) {
					var parts = element.split("#");
					var tag = parts[0];
					var id = parts[1];
					var ele = document.getElementById(id);
					if(!ele || (tag && ele.nodeName.toLowerCase() != tag)) { //Specified element not found
						continue COMMA;
					}
					context = new Array(ele);
					continue SPACE;
				}

				pos = element.indexOf(".");//Class
				if(pos+1 && !(pos>left_bracket&&pos<right_bracket)) {
					var parts = element.split('.');
					var tag = parts[0];
					var class_name = parts[1];

					var found = getElements(context,tag);
					context = new Array;
	 				for (var l=0,len=found.length; fnd=found[l],l<len; l++) {
	 					if(fnd.className && fnd.className.match(new RegExp('(^|\s)'+class_name+'(\s|$)'))) context.push(fnd);
	 				}
					continue SPACE;
				}

				if(element.indexOf('[')+1) {//If the char '[' appears, that means it needs CSS 3 parsing
					// Code to deal with attribute selectors
					if (element.match(/^(\w*)\[(\w+)([=~\|\^\$\*]?)=?['"]?([^\]'"]*)['"]?\]$/)) {
						var tag = RegExp.$1;
						var attr = RegExp.$2;
						var operator = RegExp.$3;
						var value = RegExp.$4;
					}
					var found = getElements(context,tag);
					context = new Array;
					for (var l=0,len=found.length; fnd=found[l],l<len; l++) {
	 					if(operator=='=' && fnd.getAttribute(attr) != value) continue;
						if(operator=='~' && !fnd.getAttribute(attr).match(new RegExp('(^|\\s)'+value+'(\\s|$)'))) continue;
						if(operator=='|' && !fnd.getAttribute(attr).match(new RegExp('^'+value+'-?'))) continue;
						if(operator=='^' && fnd.getAttribute(attr).indexOf(value)!=0) continue;
						if(operator=='$' && fnd.getAttribute(attr).lastIndexOf(value)!=(fnd.getAttribute(attr).length-value.length)) continue;
						if(operator=='*' && !(fnd.getAttribute(attr).indexOf(value)+1)) continue;
						else if(!fnd.getAttribute(attr)) continue;
						context.push(fnd);
	 				}

					continue SPACE;
				}

				//Tag selectors - no class or id specified.
				var found = getElements(context,element);
				context = found;
			}
			for (var o=0,len=context.length;o<len; o++) selected.push(context[o]);
		}
		return selected;
	};

	
		// Support Methods
	
	this.hasClass = function(elem, cls) {
		return elem.className.match(new RegExp('(\\s|^)' + cls + '(\\s|$)'));
	};
	
	this.addClass = function(elem, cls) {
		if (!this.hasClass(elem, cls)) elem.className += " " + cls;
	};
	
	this.removeClass = function(elem, cls) {
		if (hasClass(elem ,cls)) {
			var reg = new RegExp('(\\s|^)' + cls + '(\\s|$)');
			elem.className=ele.className.replace(reg ,' ')
		}
	};
	
		// Events
		
	this.ready = function(func) {
	  var oldonload = window.onload;
	  if (typeof window.onload != 'function') {
	    window.onload = func;
	  } else {
	    window.onload = function() {
	      if (oldonload) {
	        oldonload();
	      }
	      func();
	    }
	  }
	}
};

//結束==1bit Mp3播放器 ================================================
