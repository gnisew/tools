/* k(this) 烏衣行連續音檔播放器;
<script src="k(this).js"></script>
<a onclick="s(this,'baseUrl','s01,s02')">▶</a>
<a onclick="k(this)">deu dex hef ngiongf zux</a>
<a k="hens bbuef gixy haf gaix gixcy dov gaix" onclick="k(this)">文字</a>
<a onclick="s(this,'https://oikasu.com/file/mp3/','taif,gav')">▶</a>
*/

document.write('<audio id=\"WeSingAudio\"></audio>');

function k(myThis) {
	var x = document.getElementById("WeSingAudio");
	var myUrl = "https://oikasu1.github.io/snd/mp3kasu/";
	var myK = myThis.getAttribute("k");
    //若沒設定k屬性，則以內文為音檔;
	if (myK == "" || myK == undefined ||  myK == null)
	{
	var myYin = myThis.innerHTML;
	}else{
	myYin = myK;
	}

    //聲調統一轉為字母調;
	myYin = myYin.replace(/([ˉˊˇˋˆ^])([a-z])/g,"$1 $2");
	myYin = myYin.replace(/ˉ/g," ");
	myYin = myYin.replace(/ˊ/g,"z");
	myYin = myYin.replace(/ˇ/g,"v");
	myYin = myYin.replace(/ˋ/g,"s");
	myYin = myYin.replace(/ˆ/g,"x");
	myYin = myYin.replace(/\^/g,"x");
	myYin = myYin.replace(/\⁺/g,"f");
	
    //標音符合音檔格式;
	//myYin = myYin.replace(/(rh)([aeioumn])/g,"r$2");
	myYin = myYin.replace(/oo/g,"o");
	myYin = myYin.replace(/(bb)([aeioumn])/g,"v$2");
	myYin = myYin.replace(/ji/g,"zi");
	myYin = myYin.replace(/qi/g,"ci");
	myYin = myYin.replace(/xi/g,"si");
    //標音間以空格隔開;
	myYin = myYin.replace(/[,.?:;「」!【_，。；：、？！/】\"\'-]/g," ");
	//合音字;
    myYin = myYin.replace(/(shixcd)/g,"shid");
	myYin = myYin.replace(/(vuzcd)/g,"vud");
	myYin = myYin.replace(/(gixy ha)/g,"gia");
	myYin = myYin.replace(/(gixcy dov)/g,"giof");
	myYin = myYin.replace(/(gixy dov)/g,"giof");
	myYin = myYin.replace(/(gavy hensf)/g,"genf");
	myYin = myYin.replace(/(gavy nginsf)/g,"ginf");
	myYin = myYin.replace(/(gavy ngaisf)/g,"gaif");
	myYin = myYin.replace(/(dedzcy hensz)/g,"denz");
	myYin = myYin.replace(/(dedzcy hensf)/g,"denf");
	myYin = myYin.replace(/(dedzcy guisz)/g,"duiz");
	myYin = myYin.replace(/(dedzcy guisf)/g,"duif");
	myYin = myYin.replace(/(dedzcy ngaisz)/g,"daiz");
	myYin = myYin.replace(/(dedzcy ngaisf)/g,"daif");
	myYin = myYin.replace(/(dedzcy nginsz)/g,"dinz");
	myYin = myYin.replace(/(dedzcy nginsf)/g,"dinf");
    //變聲字;
	myYin = myYin.replace(/(vmoi)/g,"moi");
	myYin = myYin.replace(/(hmo)/g,"mo");
	myYin = myYin.replace(/(hmo)/g,"mo");
    //若以字母本變調標示，留變調;
	myYin = myYin.replace(/([czvsxf])([czvsxf])/g,"$2");
	myYin = myYin.replace(/([aeioumngbd])(c)/g,"$1");
    //清除前後空格；並將標音間空格改為直豎|;
	myYin = myYin.trim();
	myYin = myYin.replace(/\s+/g,"|");
	
    //分割標音陣列;
	var myArr = myYin.split("|");
	var i = 0;

	if (myThis.bd == undefined || myThis.bd == "" || myThis.bd == null ) {
		myThis.style.color = "red";
		myThis.bd = "XX";
		x.src = myUrl + myArr[i] + ".mp3";
		x.play();
	} else if (myThis.bd == "XX") {  
		x.pause();
		x.currentTime = 0
		myThis.bd = "";
		myThis.style.color = "black";		
	} 

	x.onended = function() {
		if (i == myArr.length - 1) {
			x.currentTime = 0
			x.pause();
			myThis.bd = "";
			myThis.style.color = "black";
		} else {		
			i = i + 1;
			x.src = myUrl + myArr[i] + ".mp3";
			x.play();
			}
	}
}


function s(myThis, baseUrl, myYin) {
	var x = document.getElementById("WeSingAudio");
	var myP = myThis.innerHTML;
	var playTxt = "▶";
	var stopTxt = "◆";

	if (baseUrl == null || baseUrl == undefined || baseUrl == "" || baseUrl == "baseUrl" || baseUrl == "baseURL" || baseUrl == "base url")
	{
		baseUrl = "";
	}else {
		baseUrl = baseUrl;
    }

	//如果baseUrl右邊沒有/則幫忙加上;
	//;
	
	if (myP == playTxt) {
		myThis.innerHTML = stopTxt;
		myThis.style.color = "red";
		var myArr = [];
		var i = 0;
		myArr = myYin.split(",");
		x.src = baseUrl + myArr[i] + ".mp3";
		x.play();
	} else if (myP == stopTxt) {
		x.pause();
		x.currentTime = 0
		myThis.innerHTML = playTxt;
		myThis.style.color = "black";
	} else {
		myThis.innerHTML = playTxt;
		myThis.style.color = "black";
	}

	x.onended = function() {
		if (i == myArr.length - 1) {
			x.pause();
			x.currentTime = 0
			i = 0;
			myThis.innerHTML = playTxt;
			myThis.style.color = "black";
		} else {
			i = i + 1;
			x.src = baseUrl + myArr[i] + ".mp3";
			x.play();
		}
	}
}


/*
document.write('<a id=\"myAudioPlayOrStop\" style="display:none">P</a>');
//方式1
var audio = document.createElement("audio");
audio.src = "hangge.mp3";
audio.play();
 
//方式2
var audio = new Audio("hangge.mp3");
audio.play();


var myPlayer = document.querySelector('audio#player');
if (myPlayer.pause){
//暫停;
}else{
//播放中;
}
*/

