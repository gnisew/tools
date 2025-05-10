// 判斷是漢字，或漢字加直式注音，若直注音是本調就沒轍;

/* k(this) 烏衣行連續音檔播放器;

<script src="k(this).js"></script>

<a onclick="k(this)" u="上層網址" s="mp3聲音檔名">漢字</a>
<a onclick="k(this)" u="http://web/" s="pinv imz">漢字</a>

<a onclick="k(this)" s="http://web/聲音檔名.mp3">漢字</a>

<a onclick="k(this)" s="http://web/音檔A.mp3|http://web/音檔B.mp3">漢字</a>

<a onclick="k(this)" s="file/聲音檔名.mp3">漢字</a>
<a onclick="k(this)" s="file/web/A.mp3|file/web/音檔B.mp3">漢字</a>
<a onclick="k(this)" s="../聲音檔名.mp3">漢字</a>
<a onclick="k(this)" s="../A.mp3|../音檔B.mp3">漢字</a>

<a onclick="k(this)" u="上層網址">xinz sangz</a>

//----------------;
<script>myBaseUrl="上層網址"; </script>
<a onclick="k(this)">xinz sangz</a>

<a onclick="k(this)" y="語言" u="上層網址" s="mp3聲音檔名">漢字</a>
<a onclick="k(this)" y="四縣" u="http://web/" s="xinz sangz">漢字</a>
<a onclick="k(this)" y="四" u="http://web/" s="xinz sangz">漢字</a>

<a onclick="k(this)" y="四縣" u="http://web/">xinz sangz</a>
<a onclick="k(this)" y="sx" u="http://web/">xinz sangz</a>
<a onclick="k(this)" y="四" u="http://web/">xinz sangz</a>
<a onclick="k(this)" y="s" u="http://web/">xinz sangz</a>
目前支援語言：
四縣、海陸、大埔、饒平、詔安、馬祖
按照音檔本身念，標註變調，或同時標註本調語變調。
按照變調規則念，標註本調，自動念出變調。

<a onclick="k(this)" u="上層網址" s="mp3聲音檔名">▶</a>
//=====================================================;

<a onclick="k(this)" u="上層網址" k="拼音">詔安漢字</a>
<a onclick="k(this)" u="http://web/" k="zhioxv onv">詔安漢字</a>

<script>myKurl="上層網址"; </script>
<a onclick="k(this)" k="拼音">詔安漢字</a>
<a onclick="k(this)">詔安拼音</a>
<a onclick="k(this)" k="zhiox on">詔安漢字</a>
<a onclick="k(this)" k="zhioxv on">詔安漢字</a>
<a onclick="k(this)">zhiox on</a>
<a onclick="k(this)">zhioxv on</a>

<a onclick="k(this)" y="詔" k="mp3聲音檔名">詔安漢字</a>
<a onclick="k(this)" y="z" k="zhiox on">漢字</a>
<a onclick="k(this)" y="z">zhiox on</a>
y="z" 也可 y="詔" 也可 y="安"

<a onclick="k(this)" u="上層網址" k="mp3聲音檔名">▶</a>

可再做漢字詞 > 直接轉拼音 > 並轉變調 > 後發音
<a onclick="k(this)">詔安漢字</a> (用第一個字不是字母來判斷要轉拼音)
<a onclick="k(this)" y="s">四縣漢字</a>

*/


var myKurl; // 詔安外部網址;
var myBaseUrl; // 全部改網址;
var kThisStyle; // 預設改顏色，填 no 不改顏色、符號;
//可以在網頁自己指定預設音檔網址，如「<script>myKurl ="data/";</script>」;

//=======================================================================;
function py(w) {
    // 詔安漢字轉拼音;
    var myKiuCu = w;
    var myRE = /()/;
    var cLen = c.length;

    for (let i = 0; i < cLen; i += 1) {
        myRE = new RegExp(c[i], ["g"]);
        myKiuCu = myKiuCu.replace(myRE, "X" + i + "Y");
    }

    for (let i = 0; i < cLen; i += 1) {
        myRE = new RegExp("X" + i + "Y", ["g"]);
        myKiuCu = myKiuCu.replace(myRE, d[i] + " ");
    }
    w = myKiuCu

    return w;
}
//================================================;


function k(myThis) {
	let x = document.getElementById("WeSingAudio");	
	if(!x){
		let audio = document.createElement("div");
		audio.innerHTML = `<audio id="WeSingAudio"></audio>`
		document.getElementsByTagName("body")[0].appendChild(audio);	
	}
	x = document.getElementById("WeSingAudio");	

    var y = "";
    y = myThis.getAttribute("y"); //語言別yuyan;
    var myYin;
    var isKasu = "";
    var myKurlTxt;
    var myK = "",
        myS = "",
        myU = "";
    myK = myThis.getAttribute("k"); //詔安拼音kasu;
    myS = myThis.getAttribute("s"); //非詔安拼音sound;
    myU = myThis.getAttribute("u"); //基礎網址url;

    if (myS) {
        myK = myS;
        isKasu = "nos"; //有屬性 s="";
        console.log("有S");
    } else if (myK) {
        myK = myK;
        isKasu = "yes"; //有屬性 k="";
        console.log("有K");
    } else {
        myK = myK;
        isKasu = "yes2"; // 無屬性 s="" 也無 k="";
        console.log("無SK");
    }

    if (isKasu == "yes2") {
        console.log("是SK");

        myYin = myThis.innerText; // 暫時不用 innerHTML;
        console.log(myYin);
        //myYin = py(myYin);
        //讀取漢字轉拼音;

        var reBpmZ = /[-]/g;
        var reBpmS = /[-]/g;
        if (myYin.search(reBpmZ) >= 0) {
            myYin = kasuBpm2Pin("Z", myYin);
        } else if (myYin.search(reBpmS) >= 0) {
            myYin = kasuBpm2Pin("S", myYin);
        }
        //轉換直注音;
        console.log(myYin);

    } else {
        myYin = myK;
    }
    //若沒設定k屬性，則以內文為音檔，如「<a onclick="k(this)">deu dex hef ngiongf zux</a>」;

    if (myU && myU.slice(-1, ) != "/") {
        myU = myU + "/";
    }
    // 如果有u屬性，但最右邊忘了/，則補上;

    if (myU && myS || myU == "" && myS) {
        myKurlTxt = myU;
        console.log("有U有S");
    } else if (myU && myK || myU == "" && myK) {
        myKurlTxt = myU;
        console.log("有U有K");
    } else if (myS) {
        myKurlTxt = "";
        console.log("無U有S");
    } else if (myK) {
        myKurlTxt = "https://oikasu.com/file/mp3/";
        console.log("無U有K");
    } else if (myU || myU == "") {
        myKurlTxt = myU;
        console.log("有U無KS");
    } else {
        myKurlTxt = "https://oikasu.com/file/mp3/";
        console.log("預設網址");
    }
    //若沒設定預設網址，則為"https://oikasu.com/file/mp3/"；;
    //若有設定，就依設定的值：<script>myKurl ="myfile/";</script>;
    //或設定為本地同路徑的空： <script>myKurl ="";</script>;


    if (myBaseUrl || myBaseUrl == "") {
        myKurlTxt = myBaseUrl;
        console.log("全部改外部網址");
    }
    console.log(myKurlTxt);

    if (myS && myS.slice(0, 4) == "http" || myK && myK.slice(0, 4) == "http" ||
        myS && myS.slice(0, 3) == "../" || myK && myK.slice(0, 3) == "../" ||
        myS && myS.slice(0, 4) == "file" || myK && myK.slice(0, 4) == "file" ||
        myS && myS.slice(0, 3) == "mp3" || myK && myK.slice(0, 3) == "mp3" ||
        myS && myS.slice(0, 5) == "sound" || myK && myK.slice(0, 5) == "sound") {
        //如果完整網址http://.../a.mp3|http://.../b.mp3 要用直豎|分割;
        //而且 內定網址 u 跟 預設網址 myBaseUrl 都被改為空"";
        myKurlTxt = "";
        myYin = myYin;
        console.log("http");
        console.log(myYin);
        console.log(myKurlTxt);
        //不要取代;
    } else {
        myYin = myYin.toLowerCase(); //轉為小寫;
        myYin = myYin.replace(/\.mp3/g, ""); //移除.mp3，之後再加;
        //============================================;
        //未來增加語言別取代;
        myYin = myYin.replace(/[,.?:;「」!【_，。；：、？！/】\"\'-]/g, " "); //移除標點，只留標音;

        if (y && y == "sx" || y && y == "四縣") {
            myYin = gongHakka(myYin, "sx");
        } else if (y && y == "hl" || y && y == "海陸") {
            myYin = gongHakka(myYin, "hl");
        } else if (y && y == "dp" || y && y == "大埔") {
            myYin = gongHakka(myYin, "dp");
        } else if (y && y == "rp" || y && y == "饒平") {
            myYin = gongHakka(myYin, "rp");
        } else if (y && y == "mn" || y && y == "閩南" || y && y == "漳州") {
            myYin = gongHolo(myYin, "mn");
        } else if (y && y == "mn2" || y && y == "泉州" || y && y == "海口") {
            myYin = gongHolo(myYin, "mn2");
        } else if (y && y == "mz" || y && y == "fz" || y && y == "馬祖" || y && y == "福州") {
            myYin = gongMatsu(myYin);
        } else if (y && y == "s" || y && y == "四") {
            myYin = gongHakkaS(myYin); //四縣詞彙自動變調;
        } else if (y && y == "h" || y && y == "海") {
            myYin = gongHakkaH(myYin); //海陸詞彙自動變調 ;
        } else if (y && y == "d" || y && y == "p" || y && y == "大" || y && y == "埔") {
            myYin = gongHakkaD(myYin); //大埔詞彙自動變調 ;
        } else if (y && y == "r" || y && y == "饒" || y && y == "平") {
            myYin = gongHakkaR(myYin); //饒平詞彙自動變調 ;
        } else if (y && y == "z" || y && y == "詔" || y && y == "安") {
            myYin = gongHakkaZ(myYin); //詔安詞彙自動變調 ;
        } else if (y && y == "m" || y && y == "閩" || y && y == "漳") {
            myYin = gongHoloM(myYin); //漳州腔詞彙自動變調;
        } else if (y && y == "m2" || y && y == "泉" || y && y == "海") {
            myYin = gongHoloM2(myYin); //泉州腔詞彙自動變調;
        } else if (y && y == "f" || y && y == "馬" || y && y == "福") {
            myYin = gongMatsu(myYin); //馬祖詞彙自動變調;
        }

        if (isKasu == "yes" || isKasu == "yes2") {
            myYin = gongKasu(myYin);
            //改為詔安標音，處理單字或本變;
        }
        if (myKurl && myKurlTxt == "https://oikasu.com/file/mp3/" || myKurl == "" && myKurlTxt == "https://oikasu.com/file/mp3/") {
            myKurlTxt = myKurl;
        }
        //只改 k 詔安的網址;

        myYin = myYin.trim(); //移除多於空格;
        myYin = myYin.replace(/\s+/g, "|"); // 標音間空格改為直豎|，給後頭切割;

    }


    var myArr = myYin.split("|");
    var myArrLen = myArr.length;
    //分割標音陣列;


    var i = 0;
    console.log("開始第" + i);



    if (myThis.bd == undefined || myThis.bd == "" || myThis.bd == null) {
        if (kThisStyle != "no") {
            myThis.style.color = "red";
            console.log("RED");
        }
        myThis.bd = "XX";
        x.src = myKurlTxt + myArr[i] + ".mp3";

        if (myThis.innerHTML.slice(0, 1) == "▶") {
            myThis.innerHTML = "◆" + myThis.innerHTML.slice(1, );
        }
        x.play();

    } else if (myThis.bd == "XX") {
        x.pause();
        x.currentTime = 0
        myThis.bd = "";
        if (kThisStyle != "no") {
            myThis.style.color = "black";
        }
        if (myThis.innerHTML.slice(0, 1) == "◆") {
            myThis.innerHTML = "▶" + myThis.innerHTML.slice(1, );
        }
        console.log("被終止第" + i);
    }

    x.onended = function() {
        if (i == myArrLen - 1 || myArr[i] == null) {
            x.currentTime = 0
            x.pause();
            myThis.bd = "";
            if (kThisStyle != "no") {
                myThis.style.color = "black";
            }
            if (myThis.innerHTML.slice(0, 1) == "◆") {
                myThis.innerHTML = "▶" + myThis.innerHTML.slice(1, );
            }
            console.log("結束第" + i);

        } else {

            i = i + 1;
            console.log("這是第" + i);
            x.src = myKurlTxt + myArr[i] + ".mp3";
            x.play();
        }
    }

    x.onabort = function() {
        //被終止時;
    }

    x.onerror = function() {
        //如果始路徑錯誤，就跳過;
        if (i == myArrLen - 1) {
            //如果最後一個是錯誤路徑，就結束;
            x.currentTime = 0
            x.pause();
            myThis.bd = "";
            if (kThisStyle != "no") {
                myThis.style.color = "black";
            }
            if (myThis.innerHTML.slice(0, 1) == "◆") {
                myThis.innerHTML = "▶" + myThis.innerHTML.slice(1, );
            }
        } else {
            i = i + 1;
            x.src = myKurlTxt + myArr[i] + ".mp3";
            x.play();
        }
    }
}




function gongKasu(y) {

    //聲調統一轉為字母調;
    y = y.replace(/([ˉˊˇˋˆ^⁺])([a-z])/g, "$1 $2");
    y = y.replace(/([aeioumngbdr])(ˉ)/g, "$1 ");
    y = y.replace(/([aeioumngbdr])(ˊ)/g, "$1z");
    y = y.replace(/([aeioumngbdr])(ˇ)/g, "$1v");
    y = y.replace(/([aeioumngbdr])(ˋ)/g, "$1s");
    y = y.replace(/([aeioumngbdr])(ˆ)/g, "$1x");
    y = y.replace(/([aeioumngbdr])(\^)/g, "$1x");
    y = y.replace(/([aeioumngbdr])(\+)/g, "$1f");
    y = y.replace(/([aeioumngbdr])(⁺)/g, "$1f");

    //標音符合音檔格式;
    //y = y.replace(/(rh)([aeioumn])/g,"r$2");
    y = y.replace(/oo/g, "o");
    y = y.replace(/(bb)([aeioumn])/g, "v$2");
    y = y.replace(/ji/g, "zi");
    y = y.replace(/qi/g, "ci");
    y = y.replace(/xi/g, "si");

    //合音字;
    y = y.replace(/(shixcd)/g, "shid");
    y = y.replace(/(vuzcd)/g, "vud");
    y = y.replace(/(gixy ha)/g, "gia");
    y = y.replace(/(gixcy dov)/g, "giof");
    y = y.replace(/(gixy dov)/g, "giof");
    y = y.replace(/(gavy hensf)/g, "genf");
    y = y.replace(/(gavy nginsf)/g, "ginf");
    y = y.replace(/(gavy ngaisf)/g, "gaif");
    y = y.replace(/(dedzcy hensz)/g, "denz");
    y = y.replace(/(dedzcy hensf)/g, "denf");
    y = y.replace(/(dedzcy guisz)/g, "duiz");
    y = y.replace(/(dedzcy guisf)/g, "duif");
    y = y.replace(/(dedzcy ngaisz)/g, "daiz");
    y = y.replace(/(dedzcy ngaisf)/g, "daif");
    y = y.replace(/(dedzcy nginsz)/g, "dinz");
    y = y.replace(/(dedzcy nginsf)/g, "dinf");
    //變聲字;
    y = y.replace(/(vmoi)/g, "moi");
    y = y.replace(/(hmo)/g, "mo");
    y = y.replace(/(hmo)/g, "mo");
    //若以字母本變調標示，留變調;
    y = y.replace(/([aeioumngbdr])([czvsxf])([czvsxf])(\b)/g, "$1$3$4");
    y = y.replace(/([aeioumngbdr])(c)(\b)/g, "$1$3");
    return y;
}


function gongHakka(y, lang) {

    //聲調統一轉為字母調;
    y = y.replace(/([ˉˊˇˋˆ^⁺])([a-z])/g, "$1 $2");
    y = y.replace(/([aeioumngbdr])(ˉ)/g, "$1 ");
    y = y.replace(/([aeioumngbdr])(ˊ)/g, "$1z");
    y = y.replace(/([aeioumngbdr])(ˇ)/g, "$1v");
    y = y.replace(/([aeioumngbdr])(ˋ)/g, "$1s");
    y = y.replace(/([aeioumngbdr])(ˆ)/g, "$1x");
    y = y.replace(/([aeioumngbdr])(\^)/g, "$1x");
    y = y.replace(/([aeioumngbdr])(\+)/g, "$1f");
    y = y.replace(/([aeioumngbdr])(⁺)/g, "$1f");

    if (lang = "sx") {
        y = y.replace(/([aeioumngbdr])(s)(\b)/g, "$1x$3");
    } else if (lang = "hl") {
        y = y.replace(/(ag|eg|ig|og|ug|b|d)(s)(\b)/g, "$1x$3");
    } else if (lang = "dp") {
        y = y.replace(/([aeioumngr])(v)/g, "$1w"); //v 改跟國語一樣 w;
    } else if (lang = "rp") {
        y = y.replace(/(ag|eg|ig|og|ug|b|d)(s)(\b)/g, "$1x$3");
    }
    //若以字母本變調標示，留變調;
    y = y.replace(/([aeioumngbdr])([czvsxf])([czvsxf])(\b)/g, "$1$3$4");
    y = y.replace(/([aeioumngbdr])(c)(\b)/g, "$1$3");
    return y;
}

function gongHolo(y, lang) {
    if (lang = "mn") {
        console.log("漳州腔");
    } else if (lang == "mn2") {
        console.log("泉州腔");
    }

    //若以字母本變調標示，留變調;
    y = y.replace(/([aeioumngbdr])([czvsxf])([czvsxf])(\b)/g, "$1$3$4");
    y = y.replace(/([aeioumngbdr])(c)(\b)/g, "$1$3");
    return y;
    /*
    b p m v, d t n l, g k q h, z c s r,
    a e i o>oo u or er oo>o
    c s v x z f l
    */
}



function gongMatsu(y) {
    // ac-55 az-24 av-11 as-53 ax-31 af-33 al-5 aj-35 aw-213 ;
    y = y.replace(/([aeioumngbdghr])(v)(\b)/g, "$1w$3");
    //若以字母本變調標示，留變調;
    y = y.replace(/([aeioumngbdr])([czvsxf])([czvsxf])(\b)/g, "$1$3$4");
    y = y.replace(/([aeioumngbdr])(c)(\b)/g, "$1$3");
    return y;

}


// ==國語詞彙變調=========================================;
function gongGuoyu(y) {
    // ac-55 az-24 av-11 as-53 ax-31 af-33 al-5 aj-35 aw-213 ;
    y = y.replace(/([aeioumngr])(v)(\b)/g, "$1w$3");
    //若以字母本變調標示，留變調;
    y = y.replace(/([aeioumngbdr])([czvsxf])([czvsxf])(\b)/g, "$1$3$4");
    y = y.replace(/([aeioumngbdr])(c)(\b)/g, "$1$3");
    return y;
}
// ===========================================================;




// ==馬祖話詞彙變調=========================================;
function gongMatsu(y) {
    //調號卸除
    y = y.replace(/(ā)([aeiuomngkhy]{0,4})/gi, 'a$2f');
    y = y.replace(/(ē)([aeiuomngkhy]{0,4})/gi, 'e$2f');
    y = y.replace(/(ī)([aeiuomngkhy]{0,4})/gi, 'i$2f');
    y = y.replace(/(ō)([aeiuomngkhy]{0,4})/gi, 'o$2f');
    y = y.replace(/(ū)([aeiuomngkhy]{0,4})/gi, 'u$2f');
    y = y.replace(/(m̄)([aeiuomngkhy]{0,4})/gi, 'm$2f');
    y = y.replace(/(n̄g)([aeiuomngkhy]{0,4})/gi, 'ng$2f');
    y = y.replace(/(á)([aeiuomngkhy]{0,4})/gi, 'a$2z');
    y = y.replace(/(é)([aeiuomngkhy]{0,4})/gi, 'e$2z');
    y = y.replace(/(í)([aeiuomngkhy]{0,4})/gi, 'i$2z');
    y = y.replace(/(ó)([aeiuomngkhy]{0,4})/gi, 'o$2z');
    y = y.replace(/(ú)([aeiuomngkhy]{0,4})/gi, 'u$2z');
    y = y.replace(/(ḿ)([aeiuomngkhy]{0,4})/gi, 'm$2z');
    y = y.replace(/(ńg)([aeiuomngkhy]{0,4})/gi, 'ng$2z');
    y = y.replace(/(à)([aeiuomngkhy]{0,4})/gi, 'a$2s');
    y = y.replace(/(è)([aeiuomngkhy]{0,4})/gi, 'e$2s');
    y = y.replace(/(ì)([aeiuomngkhy]{0,4})/gi, 'i$2s');
    y = y.replace(/(ò)([aeiuomngkhy]{0,4})/gi, 'o$2s');
    y = y.replace(/(ù)([aeiuomngkhy]{0,4})/gi, 'u$2s');
    y = y.replace(/(m̀)([aeiuomngkhy]{0,4})/gi, 'm$2s');
    y = y.replace(/(ǹg)([aeiuomngkhy]{0,4})/gi, 'ng$2s');
    y = y.replace(/(ǎ)([aeiuomngkhy]{0,4})/gi, 'a$2v');
    y = y.replace(/(ě)([aeiuomngkhy]{0,4})/gi, 'e$2v');
    y = y.replace(/(ǐ)([aeiuomngkhy]{0,4})/gi, 'i$2v');
    y = y.replace(/(ǒ)([aeiuomngkhy]{0,4})/gi, 'o$2v');
    y = y.replace(/(ǔ)([aeiuomngkhy]{0,4})/gi, 'u$2v');
    y = y.replace(/(m̌)([aeiuomngkhy]{0,4})/gi, 'm$2v');
    y = y.replace(/(ňg)([aeiuomngkhy]{0,4})/gi, 'ng$2v');
    y = y.replace(/(â)([aeiuomngkhy]{0,4})/gi, 'a$2x');
    y = y.replace(/(ê)([aeiuomngkhy]{0,4})/gi, 'e$2x');
    y = y.replace(/(î)([aeiuomngkhy]{0,4})/gi, 'i$2x');
    y = y.replace(/(ô)([aeiuomngkhy]{0,4})/gi, 'o$2x');
    y = y.replace(/(û)([aeiuomngkhy]{0,4})/gi, 'u$2x');
    y = y.replace(/(m̂)([aeiuomngkhy]{0,4})/gi, 'm$2x');
    y = y.replace(/(n̂g)([aeiuomngkhy]{0,4})/gi, 'ng$2x');
    y = y.replace(/(ý)([aeiuomngkh]{0,4})/gi, 'y$2z');
    y = y.replace(/(ỳ)([aeiuomngkh]{0,4})/gi, 'y$2s');
    y = y.replace(/(y̌)([aeiuomngkh]{0,4})/gi, 'y$2v');
    y = y.replace(/(ŷ)([aeiuomngkh]{0,4})/gi, 'y$2x');
    y = y.replace(/(ȳ)([aeiuomngkh]{0,4})/gi, 'y$2f');


    // 調號轉字母調
    y = y.replace(/([a-z]{0,4})([mngbdgaeiouyptkh])(4)/gi, '$1$2z');
    y = y.replace(/([a-z]{0,4})([mngbdgaeiouyptkh])(7)/gi, '$1$2x');
    y = y.replace(/([a-z]{0,4})([mngbdgaeiouyptkh])(3)/gi, '$1$2v');
    y = y.replace(/([a-z]{0,4})([mngbdgaeiouyptkh])(5)/gi, '$1$2s');
    y = y.replace(/([a-z]{0,4})([mngbdgaeiouyptkh])(2)/gi, '$1$2f');
    y = y.replace(/([a-z]{0,4})([mngbdgaeiouyptkh])(1)/gi, '$1$2');
    y = y.replace(/([a-z]{0,4})([mngbdgaeiouyptkh])(8)/gi, '$1$2');

    y = y.replace(/([a-z]{0,4})([mngbdgaeiouyptkh])(ˊ)/gi, '$1$2z');
    y = y.replace(/([a-z]{0,4})([mngbdgaeiouyptkh])(\ˆ)/gi, '$1$2x');
    y = y.replace(/([a-z]{0,4})([mngbdgaeiouyptkh])(ˇ)/gi, '$1$2v');
    y = y.replace(/([a-z]{0,4})([mngbdgaeiouyptkh])(ˋ)/gi, '$1$2s');
    y = y.replace(/([a-z]{0,4})([mngbdgaeiouyptkh])(\+)/gi, '$1$2f');
    y = y.replace(/([a-z]{0,4})([mngbdgaeiouyptkh])(ˉ)/gi, '$1$2c');
    y = y.replace(/([a-z]{0,4})([mngbdgaeiouyptkh])(⁺)/gi, '$1$2f');
    y = y.replace(/([a-z]{0,4})([mngbdgaeiouyptkh])(\^)/gi, '$1$2x');

    y = y.replace(/([a-z]{0,4})([mngbdgaeiouyptkh])( ́)/gi, '$1$2z');
    y = y.replace(/([a-z]{0,4})([mngbdgaeiouyptkh])( ̂)/gi, '$1$2x');
    y = y.replace(/([a-z]{0,4})([mngbdgaeiouyptkh])( ̌)/gi, '$1$2v');
    y = y.replace(/([a-z]{0,4})([mngbdgaeiouyptkh])( ̀)/gi, '$1$2s');
    y = y.replace(/([a-z]{0,4})([mngbdgaeiouyptkh])( ̄)/gi, '$1$2c');


    //變韻(順序不能動)
    y = y.replace(/(a)(ng|h|k{0,1})([vxz])(--|-| )([a-z])/gi, 'e$2$3$4$5');
    y = y.replace(/(ei)(ng|h|k{0,1})([vxz])(--|-| )([a-z])/gi, 'i$2$3$4$5');
    y = y.replace(/(oey)(ng|h|k{0,1})([vxz])(--|-| )([a-z])/gi, 'y$2$3$4$5');
    y = y.replace(/(ai)(ng|h|k{0,1})([vxz])(--|-| )([a-z])/gi, 'ei$2$3$4$5');
    y = y.replace(/(iau)(ng|h|k{0,1})([vxz])(--|-| )([a-z])/gi, 'ieu$2$3$4$5');
    y = y.replace(/(ou)(ng|h|k{0,1})([vxz])(--|-| )([a-z])/gi, 'u$2$3$4$5');
    y = y.replace(/(au)(ng|h|k{0,1})([vxz])(--|-| )([a-z])/gi, 'ou$2$3$4$5');
    y = y.replace(/(o)(ng|h|k{0,1})([vxz])(--|-| )([a-z])/gi, 'oe$2$3$4$5');
    y = y.replace(/(oy)(ng|h|k{0,1})([vxz])(--|-| )([a-z])/gi, 'oey$2$3$4$5');


    //變調
    y = y.replace(/([aeiouymg])([vxz]{0,1})(--|-| )(tsh|ts|ph|th|kh|ng|p|m|t|n|l|k|h|s{0,1})([aeiouynghk]{1,5})([s]{0,1})(\b)/gi, '$1⁺$3$4$5$6$7');
    y = y.replace(/(h)([vxz]{0,1})(--|-| )(tsh|ts|ph|th|kh|ng|p|m|t|n|l|k|h|s{0,1})([aeiouynghk]{1,5})([s]{0,1})(\b)/gi, '⁺$3$4$5$6$7');

    y = y.replace(/([aeiouymgh])([vxz]{0,1})(--|-| )(tsh|ts|ph|th|kh|ng|p|m|t|n|l|k|h|s{0,1})([aeiouynghk]{1,5})([fvxz])(\b)/gi, '$1ˋ$3$4$5$6$7');
    y = y.replace(/(h)([vxz]{0,1})(--|-| )(tsh|ts|ph|th|kh|ng|p|m|t|n|l|k|h|s{0,1})([aeiouynghk]{1,5})([fvxz])(\b)/gi, 'ˋ$3$4$5$6$7');

    y = y.replace(/([aeiouymg])([f])(--|-| )(tsh|ts|ph|th|kh|ng|p|m|t|n|l|k|h|s{0,1})([aeiouynghk]{1,5})([s]{0,1})(\b)/gi, '$1ˇ$3$4$5$6$7');

    y = y.replace(/([aeiouymg])([f])(--|-| )(tsh|ts|ph|th|kh|ng|p|m|t|n|l|k|h|s{0,1})([aeiouyng]{1,5})(f)(\b)/gi, '$1ˊ$3$4$5$6$7');

    y = y.replace(/([aeiouymg])([f])(--|-| )(tsh|ts|ph|th|kh|ng|p|m|t|n|l|k|h|s{0,1})([aeiouynghk]{1,5})([vxz])(\b)/gi, '$1$3$4$5$6$7');

    y = y.replace(/(k)([z])(--|-| )(tsh|ts|ph|th|kh|ng|p|m|t|n|l|k|h|s{0,1})([aeiouynghk]{1,5})([s]{0,1})(\b)/gi, 'hˇ$3$4$5$6$7');

    y = y.replace(/(k)([z])(--|-| )(tsh|ts|ph|th|kh|ng|p|m|t|n|l|k|h|s{0,1})([aeiouynghk]{1,5})(f)(\b)/gi, 'hˊ$3$4$5$6$7');

    y = y.replace(/(k)([z])(--|-| )(tsh|ts|ph|th|kh|ng|p|m|t|n|l|k|h|s{0,1})([aeiouynghk]{1,5})([vxz])(\b)/gi, 'h$3$4$5$6$7');

    y = y.replace(/(k)()(--|-| )(tsh|ts|ph|th|kh|ng|p|m|t|n|l|k|h|s{0,1})([aeiouynghk]{1,5})([s]{0,1})(\b)/gi, 'h⁺$3$4$5$6$7');
    y = y.replace(/(h)()(--|-| )(tsh|ts|ph|th|kh|ng|p|m|t|n|l|k|h|s{0,1})([aeiouynghk]{1,5})([s]{0,1})(\b)/gi, '⁺$3$4$5$6$7');

    y = y.replace(/(h)()(--|-| )(tsh|ts|ph|th|kh|ng|p|m|t|n|l|k|h|s{0,1})([aeiouynghk]{1,5})([fvxz])(\b)/gi, 'ˋ$3$4$5$6$7');

    y = y.replace(/(k)()(--|-| )(tsh|ts|ph|th|kh|ng|p|m|t|n|l|k|h|s{0,1})([aeiouynghk]{1,5})([fvxz])(\b)/gi, 'h$3$4$5$6$7');

    y = y.replace(/([aeiouymg])(s)(--|-| )(tsh|ts|ph|th|kh|ng|p|m|t|n|l|k|h|s{0,1})([aeiouyng]{1,5})()(\b)/gi, '$1⁺$3$4$5$6$7');
    y = y.replace(/([aeiouymg])(s)(--|-| )(tsh|ts|ph|th|kh|ng|p|m|t|n|l|k|h|s{0,1})([aeiouyng]{1,5})(s)(\b)/gi, '$1ˇ$3$4$5$6$7');
    y = y.replace(/([aeiouymg])(s)(--|-| )(tsh|ts|ph|th|kh|ng|p|m|t|n|l|k|h|s{0,1})([hk])()(\b)/gi, '$1ˇ$3$4$5$6$7');
    y = y.replace(/([aeiouymg])(s)(--|-| )(tsh|ts|ph|th|kh|ng|p|m|t|n|l|k|h|s{0,1})([aeiouyng]{1,5})(f)(\b)/gi, '$1⁺$3$4$5$6$7');
    y = y.replace(/([aeiouymg])(s)(--|-| )(tsh|ts|ph|th|kh|ng|p|m|t|n|l|k|h|s{0,1})([aeiouynghk]{1,5})([vxz])(\b)/gi, '$1ˇ$3$4$5$6$7');

    //變聲
    y = y.replace(/([aeiouy])([ˊˇˋˆ⁺ˉ]{0,1})(--|-| )(ph|p)/gi, '$1$2$3b');
    y = y.replace(/([aeiouy])([ˊˇˋˆ⁺ˉ]{0,1})(--|-| )(tsh|ts)/gi, '$1$2$3j');
    y = y.replace(/([aeiouy])([ˊˇˋˆ⁺ˉ]{0,1})(--|-| )(th|t|s)/gi, '$1$2$3l');
    y = y.replace(/([aeiouy])([ˊˇˋˆ⁺ˉ]{0,1})(--|-| )(n)([aeiouy])/gi, '$1$2$3l$5');
    y = y.replace(/([aeiouy])([ˊˇˋˆ⁺ˉ]{0,1})(--|-| )(kh|k|h)/gi, '$1$2$3');

    y = y.replace(/(ng)([ˊˇˋˆ⁺ˉ]{0,1})(--|-| )(ph|p)/gi, '$1$2$3m');
    y = y.replace(/(ng)([ˊˇˋˆ⁺ˉ]{0,1})(--|-| )(tsh|ts)/gi, '$1$2$3j');
    y = y.replace(/(ng)([ˊˇˋˆ⁺ˉ]{0,1})(--|-| )(th|t|s|l)/gi, '$1$2$3n');
    y = y.replace(/(ng)([ˊˇˋˆ⁺ˉ]{0,1})(--|-| )(kh|k|h)/gi, '$1$2$3ng');
    y = y.replace(/(ng)([ˊˇˋˆ⁺ˉ]{0,1})(--|-| )([aeiouy])/gi, '$1$2$3ng$4');
    //
    y = y.replace(/([aeiouy])([zvsxfc]{0,1})(--|-| )(ph|p)/gi, '$1$2$3b');
    y = y.replace(/([aeiouy])([zvsxfc]{0,1})(--|-| )(tsh|ts)/gi, '$1$2$3j');
    y = y.replace(/([aeiouy])([zvsxfc]{0,1})(--|-| )(th|t|s)/gi, '$1$2$3l');
    y = y.replace(/([aeiouy])([zvsxfc]{0,1})(--|-| )(n)([aeiouy])/gi, '$1$2$3l$5');
    y = y.replace(/([aeiouy])([zvsxfc]{0,1})(--|-| )(kh|k|h)/gi, '$1$2$3');

    y = y.replace(/(ng)([zvsxfc]{0,1})(--|-| )(ph|p)/gi, '$1$2$3m');
    y = y.replace(/(ng)([zvsxfc]{0,1})(--|-| )(tsh|ts)/gi, '$1$2$3j');
    y = y.replace(/(ng)([zvsxfc]{0,1})(--|-| )(th|t|s|l)/gi, '$1$2$3n');
    y = y.replace(/(ng)([zvsxfc]{0,1})(--|-| )(kh|k|h)/gi, '$1$2$3ng');

    return y;
}
// ===========================================================;



// ==S四縣客語詞彙變調=========================================;
function gongHakkaS(y) {
    // 調號轉字母調;
    y = y.replace(/([a-z]{0,4})([mngbdgaeiou])(ˊ)/gi, '$1$2z');
    y = y.replace(/([a-z]{0,4})([mngbdgaeiou])(ˇ)/gi, '$1$2v');
    y = y.replace(/([a-z]{0,4})([mngbdgaeiou])(ˋ)/gi, '$1$2s');
    y = y.replace(/([a-z]{0,4})([mngbdgaeiou])(ˉ)/gi, '$1$2c');

    y = y.replace(/([a-z]{0,4})([mngbdgaeiou])( ́)/gi, '$1$2z');
    y = y.replace(/([a-z]{0,4})([mngbdgaeiou])( ̌)/gi, '$1$2v');
    y = y.replace(/([a-z]{0,4})([mngbdgaeiou])( ̀)/gi, '$1$2s');
    y = y.replace(/([a-z]{0,4})([mngbdgaeiou])( ̄)/gi, '$1$2c');

    // 四字變調;
    //用分隔成x-xx-x;
    y = y.replace(/([a-z])(-|_| )([a-z])(-|_| )([a-z])(-|_| )([a-z])(\b)/gi, '$1$2$3$4$5$6$7$8');

    // 三疊字z不變調;
    y = y.replace(/([a-z]{1,6})(z)(-|_| )(\1)(z)(-|_| )(\1)(z)(\b)/gi, '$1ˊ$3$4ˊ$6$7ˊ$9');
    // 三疊字v變調;
    y = y.replace(/([a-z]{1,6})(v)(-|_| )(\1)(v)(-|_| )(\1)(v)(\b)/gi, '$1ˊ$3$4$5$6$7$8$9');
    // z二字變調;
    y = y.replace(/([aeiouymng])(z)(-|_| )(zh|ch|sh|rh|ng|b|p|m|f|v|d|t|n|l|g|k|h|z|c|s|j|q|x|r{0,1})([aeioumngbd]{1,5})([z]{0,1})(\b)/gi, '$1ˇ$3$4$5$6$7');

    // e變調;
    y = y.replace(/([aeiouymngbd])(s)(-|_| )()(e)(s)(\b)/gi, '$1$2$3$4$5ˇ$7');

    return y;
}
//=============================================================;



// ==H海陸客語詞彙變調=========================================;
function gongHakkaH(y) {
    // 調號轉字母調;
    y = y.replace(/([a-z]{0,4})([mngbdgaeiour])(ˊ)/gi, '$1$2z');
    y = y.replace(/([a-z]{0,4})([mngbdgaeiour])(ˇ)/gi, '$1$2v');
    y = y.replace(/([a-z]{0,4})([mngbdgaeiour])(ˋ)/gi, '$1$2s');
    y = y.replace(/([a-z]{0,4})([mngbdgaeiour])(\+)/gi, '$1$2f');
    y = y.replace(/([a-z]{0,4})([mngbdgaeiour])(⁺)/gi, '$1$2f');

    y = y.replace(/([a-z]{0,4})([mngbdgaeiour])( ́)/gi, '$1$2z');
    y = y.replace(/([a-z]{0,4})([mngbdgaeiour])( ̌)/gi, '$1$2v');
    y = y.replace(/([a-z]{0,4})([mngbdgaeiour])( ̀)/gi, '$1$2s');

    // 四字變調;
    //用分隔成x-xx-x;
    y = y.replace(/([a-z])(-|_| )([a-z])(-|_| )([a-z])(-|_| )([a-z])(\b)/gi, '$1$2$3$4$5$6$7$8');

    // 三疊字z不變調;
    y = y.replace(/([a-z]{1,6})(z)(-|_| )(\1)(z)(-|_| )(\1)(z)(\b)/gi, '$1ˊ$3$4ˊ$6$7ˊ$9');
    // 三疊字vsfc變調;
    y = y.replace(/([a-z]{1,6})([vsf]{0,1})(-|_| )(\1)(\2)(-|_| )(\1)(\2)(\b)/gi, '$1ˊ$3$4$5$6$7$8$9');


    // 二字變調;
    y = y.replace(/([aeiouymng])(z)(-|_| )(zh|ch|sh|rh|ng|b|p|m|f|v|d|t|n|l|g|k|h|z|c|s|j|q|x|r{0,1})([aeioumngbdr]{1,5})([zvsf]{0,1})(\b)/gi, '$1$3$4$5$6$7');
    y = y.replace(/([aeiou])([bdg])(-|_| )(zh|ch|sh|rh|ng|b|p|m|f|v|d|t|n|l|g|k|h|z|c|s|j|q|x|r{0,1})([aeioumngbdr]{1,5})([zvsf]{0,1})(\b)/gi, '$1$2ˋ$3$4$5$6$7');

    // 移除;
    y = y.replace(//gi, '');
    return y;
}
//=============================================================;




// ==D大埔客語詞彙變調=========================================;
function gongHakkaD(y) {
    // 調號轉字母調;
    y = y.replace(/([a-z]{0,4})([mngbdgaeiour])(ˊ)/gi, '$1$2z');
    y = y.replace(/([a-z]{0,4})([mngbdgaeiour])(\ˆ)/gi, '$1$2x');
    y = y.replace(/([a-z]{0,4})([mngbdgaeiour])(ˇ)/gi, '$1$2v');
    y = y.replace(/([a-z]{0,4})([mngbdgaeiour])(ˋ)/gi, '$1$2s');
    y = y.replace(/([a-z]{0,4})([mngbdgaeiour])(\+)/gi, '$1$2f');
    y = y.replace(/([a-z]{0,4})([mngbdgaeiour])(⁺)/gi, '$1$2f');
    y = y.replace(/([a-z]{0,4})([mngbdgaeiour])(\^)/gi, '$1$2x');

    y = y.replace(/([a-z]{0,4})([mngbdgaeiour])( ́)/gi, '$1$2z');
    y = y.replace(/([a-z]{0,4})([mngbdgaeiour])( ̂)/gi, '$1$2x');
    y = y.replace(/([a-z]{0,4})([mngbdgaeiour])( ̌)/gi, '$1$2v');
    y = y.replace(/([a-z]{0,4})([mngbdgaeiour])( ̀)/gi, '$1$2s');

    // 四字變調;
    //用分隔成x-xx-x;
    y = y.replace(/([a-z])(-|_| )([a-z])(-|_| )([a-z])(-|_| )([a-z])(\b)/gi, '$1$2$3$4$5$6$7$8');

    // 三疊字vsfc變調;
    y = y.replace(/([a-z]{1,6})([vxsf])(-|_| )(\1)([fs])(-|_| )(\1)(\2)(\b)/gi, '$1ˊ$3$4ˇ$6$7$8$9');
    y = y.replace(/([a-z]{1,6})([vxsf])(-|_| )(\1)([v])(-|_| )(\1)(\2)(\b)/gi, '$1ˊ$3$4⁺$6$7$8$9');

    // 二字變調;
    y = y.replace(/([aeiouymng])(f)(-|_| )(zh|ch|sh|rh|ng|b|p|m|f|v|d|t|n|l|g|k|h|z|c|s|j|q|x|r{0,1})([aeioumngbdr]{1,5})([vx])(\b)/gi, '$1ˊ$3$4$5$6$7');
    y = y.replace(/([aeiouymng])(v)(-|_| )(zh|ch|sh|rh|ng|b|p|m|f|v|d|t|n|l|g|k|h|z|c|s|j|q|x|r{0,1})([aeioumngr]{1,5})([v])(\b)/gi, '$1⁺$3$4$5$6$7');
    y = y.replace(/([aeiouymng])(s)(-|_| )(zh|ch|sh|rh|ng|b|p|m|f|v|d|t|n|l|g|k|h|z|c|s|j|q|x|r{0,1})([aeioumngbdr]{1,5})([xs])(\b)/gi, '$1$3$4$5$6$7');

    // 移除;
    y = y.replace(//gi, '');
    return y;
}
//=============================================================;




// ==R饒平客語詞彙變調=========================================;
function gongHakkaR(y) {
    // 調號轉字母調;
    y = y.replace(/([a-z]{0,4})([mngbdgaeiour])(ˊ)/gi, '$1$2z');
    y = y.replace(/([a-z]{0,4})([mngbdgaeiour])(\ˆ)/gi, '$1$2x');
    y = y.replace(/([a-z]{0,4})([mngbdgaeiour])(ˇ)/gi, '$1$2v');
    y = y.replace(/([a-z]{0,4})([mngbdgaeiour])(ˋ)/gi, '$1$2s');
    y = y.replace(/([a-z]{0,4})([mngbdgaeiour])(\+)/gi, '$1$2f');
    y = y.replace(/([a-z]{0,4})([mngbdgaeiour])(⁺)/gi, '$1$2f');
    y = y.replace(/([a-z]{0,4})([mngbdgaeiour])(\^)/gi, '$1$2x');

    y = y.replace(/([a-z]{0,4})([mngbdgaeiour])( ́)/gi, '$1$2z');
    y = y.replace(/([a-z]{0,4})([mngbdgaeiour])( ̂)/gi, '$1$2x');
    y = y.replace(/([a-z]{0,4})([mngbdgaeiour])( ̌)/gi, '$1$2v');
    y = y.replace(/([a-z]{0,4})([mngbdgaeiour])( ̀)/gi, '$1$2s');

    // 四字變調;
    //用分隔成x-xx-x;
    y = y.replace(/([a-z])(-|_| )([a-z])(-|_| )([a-z])(-|_| )([a-z])(\b)/gi, '$1$2$3$4$5$6$7$8');


    // 二字變調;
    y = y.replace(/([aeiouymng])()(-|_| )(zh|ch|sh|rh|ng|b|p|m|f|v|d|t|n|l|g|k|h|z|c|s|j|q|x|r{0,1})([aeioumngbdr]{1,5})([vs])(\b)/gi, '$1ˋ$3$4$5$6$7');
    y = y.replace(/([aeiouymng])()(-|_| )(zh|ch|sh|rh|ng|b|p|m|f|v|d|t|n|l|g|k|h|z|c|s|j|q|x|r{0,1})([aeioumngbdr]{1,5})([z]{0,1})(\b)/gi, '$1⁺$3$4$5$6$7');

    y = y.replace(/([aeiouymng])(s)(-|_| )(zh|ch|sh|rh|ng|b|p|m|f|v|d|t|n|l|g|k|h|z|c|s|j|q|x|r{0,1})(ng|a|e|i|o|u|m|n|r{1,5})([vs])(\b)/gi, '$1⁺$3$4$5$6$7');
    y = y.replace(/([aeiouymng])(s)(-|_| )(zh|ch|sh|rh|ng|b|p|m|f|v|d|t|n|l|g|k|h|z|c|s|j|q|x|r{0,1})([aeioumngbdrr]{1,5})([zs]{0,1})(\b)/gi, '$1ˇ$3$4$5$6$7');

    y = y.replace(/([aeiouymng])(z)(-|_| )(zh|ch|sh|rh|ng|b|p|m|f|v|d|t|n|l|g|k|h|z|c|s|j|q|x|r{0,1})([aeioumngbdr]{1,5})([zvs]{0,1})(\b)/gi, '$1⁺$3$4$5$6$7');

    y = y.replace(/(ag|eg|ig|og|ug|b|d)(s)(-|_| )(zh|ch|sh|rh|ng|b|p|m|f|v|d|t|n|l|g|k|h|z|c|s|j|q|x|r{0,1})([aeioumngbdr]{1,5})([zvs]{0,1})(\b)/gi, '$1$3$4$5$6$7');

    // 移除;
    y = y.replace(//gi, '');
    return y;
}
//=============================================================;




// ==Z詔安客語詞彙變調=========================================;
function gongHakkaZ(y) {
    // 調號轉字母調;
    y = y.replace(/([a-z]{0,4})([mngbdgaeiou])(ˊ)/gi, '$1$2z');
    y = y.replace(/([a-z]{0,4})([mngbdgaeiou])(\ˆ)/gi, '$1$2x');
    y = y.replace(/([a-z]{0,4})([mngbdgaeiou])(ˇ)/gi, '$1$2v');
    y = y.replace(/([a-z]{0,4})([mngbdgaeiou])(ˋ)/gi, '$1$2s');
    y = y.replace(/([a-z]{0,4})([mngbdgaeiou])(\+)/gi, '$1$2f');
    y = y.replace(/([a-z]{0,4})([mngbdgaeiou])(ˉ)/gi, '$1$2c');
    y = y.replace(/([a-z]{0,4})([mngbdgaeiou])(⁺)/gi, '$1$2f');
    y = y.replace(/([a-z]{0,4})([mngbdgaeiou])(\^)/gi, '$1$2x');

    y = y.replace(/([a-z]{0,4})([mngbdgaeiou])( ́)/gi, '$1$2z');
    y = y.replace(/([a-z]{0,4})([mngbdgaeiou])( ̂)/gi, '$1$2x');
    y = y.replace(/([a-z]{0,4})([mngbdgaeiou])( ̌)/gi, '$1$2v');
    y = y.replace(/([a-z]{0,4})([mngbdgaeiou])( ̀)/gi, '$1$2s');
    y = y.replace(/([a-z]{0,4})([mngbdgaeiou])( ̄)/gi, '$1$2c');

    // 四字變調;
    //x-x-x-x 用分隔成x-xx-x;
    y = y.replace(/([aeiouymng])(x)(-|_| )(zh|ch|sh|rh|ng|b|p|m|f|v|d|t|n|l|g|k|h|z|c|s|j|q|x|r{0,1})([aeiouymng]{1,5})(x)(-|_| )(zh|ch|sh|rh|ng|b|p|m|f|v|d|t|n|l|g|k|h|z|c|s|j|q|x|r{0,1})([aeiouymng]{1,5})(x)(-|_| )(zh|ch|sh|rh|ng|b|p|m|f|v|d|t|n|l|g|k|h|z|c|s|j|q|x|r{0,1})([aeiouymng]{1,5})(x)(\b)/gi, '$1$2$3$4$5$6$7$8$9$10$11$12$13$14$15');
    //w-x-x-x 用分隔成w-xx-x;
    y = y.replace(/([aeiouymng])([zvs]{0,1})(-|_| )(zh|ch|sh|rh|ng|b|p|m|f|v|d|t|n|l|g|k|h|z|c|s|j|q|x|r{0,1})([aeiouymng]{1,5})(x)(-|_| )(zh|ch|sh|rh|ng|b|p|m|f|v|d|t|n|l|g|k|h|z|c|s|j|q|x|r{0,1})([aeiouymng]{1,5})(x)(-|_| )(zh|ch|sh|rh|ng|b|p|m|f|v|d|t|n|l|g|k|h|z|c|s|j|q|x|r{0,1})([aeiouymng]{1,5})(x)(\b)/gi, '$1$2$3$4$5$6$7$8$9$10$11$12$13$14$15');
    //x-x-x-w 用分隔成x-xx-w;
    y = y.replace(/([aeiouymng])(x)(-|_| )(zh|ch|sh|rh|ng|b|p|m|f|v|d|t|n|l|g|k|h|z|c|s|j|q|x|r{0,1})([aeiouymng]{1,5})(x)(-|_| )(zh|ch|sh|rh|ng|b|p|m|f|v|d|t|n|l|g|k|h|z|c|s|j|q|x|r{0,1})([aeiouymng]{1,5})(x)(-|_| )(zh|ch|sh|rh|ng|b|p|m|f|v|d|t|n|l|g|k|h|z|c|s|j|q|x|r{0,1})([aeiouymng]{1,5})([zvs]{0,1})(\b)/gi, '$1$2$3$4$5$6$7$8$9$10$11$12$13$14$15');

    //w-x-x-w 用分隔成w-xx-w;
    y = y.replace(/([aeiouymng])([zvs]{0,1})(-|_| )(zh|ch|sh|rh|ng|b|p|m|f|v|d|t|n|l|g|k|h|z|c|s|j|q|x|r{0,1})([aeiouymng]{1,5})(x)(-|_| )(zh|ch|sh|rh|ng|b|p|m|f|v|d|t|n|l|g|k|h|z|c|s|j|q|x|r{0,1})([aeiouymng]{1,5})(x)(-|_| )(zh|ch|sh|rh|ng|b|p|m|f|v|d|t|n|l|g|k|h|z|c|s|j|q|x|r{0,1})([aeiouymng]{1,5})([zvs]{0,1})(\b)/gi, '$1$2$3$4$5$6$7$8$9$10$11$12$13$14$15');

    // 三疊字vsfc變調;
    y = y.replace(/([a-z]{1,6})([zvsx])(-|_| )(\1)(\2)(-|_| )(\1)(\2)(\b)/gi, '$1$3$4⁺$6$7$8$9');
    y = y.replace(/([a-z]{1,6})()(-|_| )(\1)(\2)(-|_| )(\1)(\2)(\b)/gi, '$1$3$4⁺$6$7$8$9');

    // 三字變調 x-x-x;
    //x-x-x;
    y = y.replace(/([aeiouymng])(x)(-|_| )(zh|ch|sh|rh|ng|b|p|m|f|v|d|t|n|l|g|k|h|z|c|s|j|q|x|r{0,1})([aeiouymng]{1,5})(x)(-|_| )(zh|ch|sh|rh|ng|b|p|m|f|v|d|t|n|l|g|k|h|z|c|s|j|q|x|r{0,1})([aeiouymng]{1,5})(x)(\b)/gi, '$1ˇ$3$4$5$7$8$9$10$11');

    // 再處理輕聲;
    y = y.replace(/([aeiouymng])([zvsx]{0,1})(--|-|_| )(go)(x)(-|_| )(loi)(s)(\b)/gi, '$1$2$3$4ˆ$6$7ˇ$9');
    y = y.replace(/([aeiouymng])([zvsx]{0,1})(--|-|_| )(go)(x)(-|_| )(kui)(x)(\b)/gi, '$1$2$3$4ˆ$6$7ˇ$9');

    y = y.replace(/([aeiouymng])([zvsx]{0,1})(--|-|_| )(ki)(x)(-|_| )(loi)(s)(\b)/gi, '$1$2$3$4ˆ$6$7ˇ$9');
    y = y.replace(/([aeiouymng])([zvsx]{0,1})(--|-|_| )(ki)(x)(-|_| )(kui)(x)(\b)/gi, '$1$2$3$4ˆ$6$7ˇ$9');

    y = y.replace(/([aeiouymng])([zvsx]{0,1})(--|-|_| )(ngib)(s)(-|_| )(loi)(s)(\b)/gi, '$1$2$3$4⁺$6$7ˇ$9');
    y = y.replace(/([aeiouymng])([zvsx]{0,1})(--|-|_| )(ngib)(s)(-|_| )(kui)(x)(\b)/gi, '$1$2$3$4⁺$6$7ˇ$9');

    y = y.replace(/([aeiouymng])([zvsx]{0,1})(--|-|_| )(chid)(z)(-|_| )(loi)(s)(\b)/gi, '$1$2$3$4ˊ$6$7ˇ$9');
    y = y.replace(/([aeiouymng])([zvsx]{0,1})(--|-|_| )(chid)(z)(-|_| )(kui)(x)(\b)/gi, '$1$2$3$4ˊ$6$7ˇ$9');

    y = y.replace(/([aeiouymng])([zvsx]{0,1})(--|-|_| )(loo|lo)()(-|_| )(loi)(s)(\b)/gi, '$1$2$3$4⁺$6$7ˇ$9');
    y = y.replace(/([aeiouymng])([zvsx]{0,1})(--|-|_| )(loo|lo)()(-|_| )(kui)(x)(\b)/gi, '$1$2$3$4⁺$6$7ˇ$9');

    y = y.replace(/([aeiouymng])([zvsx]{0,1})(--|-|_| )(rhid|rid)(z)(-|_| )(ha)()(\b)/gi, '$1$2$3$4⁺$6$7⁺$9');
    y = y.replace(/([aeiouymng])([zvsx]{0,1})(--|-|_| )(rhid|rid)(z)(-|_| )(baix)()(\b)/gi, '$1$2$3$4⁺$6$7$8$9');
    y = y.replace(/([aeiouymng])([zvsx]{0,1})(--|-|_| )(rhid|rid)(z)(-|_| )(fue)(s)(\b)/gi, '$1$2$3$4⁺$6$7ˆ$9');

    // 二字輕聲--;
    y = y.replace(/([aeiouymng])([zvsx]{0,1})(--)(loo|lo)()(\b)/gi, '$1$2$3$4⁺$6');
    y = y.replace(/([aeiouymng])([zvsx]{0,1})(--)(choo|cho)()(\b)/gi, '$1$2$3$4⁺$6');
    y = y.replace(/([aeiouymng])([zvsx]{0,1})(--)(loi)(s)(\b)/gi, '$1$2$3$4ˇ$6');
    y = y.replace(/([aeiouymng])([zvsx]{0,1})(--)(ngib)(s)(\b)/gi, '$1$2$3$4⁺$6');
    y = y.replace(/([aeiouymng])([zvsx]{0,1})(--)(kui)(x)(\b)/gi, '$1$2$3$4ˇ$6');
    // 人變調
    y = y.replace(/(ngai|hen|gui)(s)(--|-| )(ngin)(s)(\b)/gi, '$1$2$3$4⁺$6');
    y = y.replace(/(een)(v)(--|-| )(ngin)(s)(\b)/gi, '$1$2$3$4⁺$6');

    // 月份變調;
    //c-zvsx;
    y = y.replace(/(zhangx|beedz|samv|rhidz|liuz|cidz|qidz|giux|shibs|ridz|xix|ngi|six|mx)(--|-|_| )(ngied)(s)(\b)/gi, '$1$2$3ˇ$5');

    // 二疊字變調;
    y = y.replace(/([a-z]{1,6})([zvsx])(-|_| )(\1)(\2)(\b)/gi, '$1$3$4$5$6');
    y = y.replace(/([a-z]{1,6})()(-|_| )(\1)(\2)(\b)/gi, '$1$3$4$5$6');

    // 二字變調;
    //c-zvsx;
    y = y.replace(/([aeiouymng])()(-|_| )(zh|ch|sh|rh|ng|b|p|m|f|v|d|t|n|l|g|k|h|z|c|s|j|q|x|r{0,1})([aeiouymng]{1,5})([zvxs]{0,1})(\b)/gi, '$1⁺$3$4$5$6$7');
    //x-zvs;
    y = y.replace(/([aeiouymng])(x)(-|_| )(zh|ch|sh|rh|ng|b|p|m|f|v|d|t|n|l|g|k|h|z|c|s|j|q|x|r{0,1})([aeiouymngbd]{1,5})([zvs]{0,1})(\b)/gi, '$1ˇ$3$4$5$6$7');
    //x-x;
    y = y.replace(/([aeiouymng])(x)(-|_| )(zh|ch|sh|rh|ng|b|p|m|f|v|d|t|n|l|g|k|h|z|c|s|j|q|x|r{0,1})([aeiouymng]{1,5})(x)(\b)/gi, '$1$3$4$5$6$7');
    //z-zvsx;
    y = y.replace(/([aeiouymngbd])(z)(-|_| )(zh|ch|sh|rh|ng|b|p|m|f|v|d|t|n|l|g|k|h|z|c|s|j|q|x|r{0,1})([aeiouymng]{1,5})([zvxs]{0,1})(\b)/gi, '$1$3$4$5$6$7');
    //s-zvsx;
    y = y.replace(/([aeiouymngbd])(s)(-|_| )(zh|ch|sh|rh|ng|b|p|m|f|v|d|t|n|l|g|k|h|z|c|s|j|q|x|r{0,1})([aeiouymng]{1,5})([zvxs]{0,1})(\b)/gi, '$1⁺$3$4$5$6$7');


    // 移除;
    y = y.replace(//gi, '');
    return y;
}



function kasuBpm2Pin(bsz, txt) {
    var arrBpmZ = ["", "", "", "", "", "", "", "", "", "", "", "", "", "", "", "", "", "", "", "", "", "", "", "", "", "", "", "", "", "", "", "", "", "", "", "", "", "", "", "", "", "", "", "", "", "", "", "", "", "", "", "", "", "", "", "", "", "", "", "", "", "", "", "", "", "", "", "", "", "", "", "", "", "", "", "", "", "", "", "", "", "", "", "", "", "", "", "", "", "", "", "", "", "", "", "", "", "", "", "", "", "", "", "", "", "", "", "", "", "", "", "", "", "", "", "", "", "", "", "", "", "", "", "", "", "", "", "", "", "", "", "", "", "", "", "", "", "", "", "", "", "", "", "", "", "", "", "", "", "", "", "", "", "", "", "", "", "", "", "", "", "", "", "", "", "", "", "", "", "", "", "", "", "", "", ""];
    var arrPinZ = ["ien", "a", "a", "a", "a", "a", "ai", "ai", "ai", "ainn", "ainn", "ainn", "am", "am", "am", "an", "an", "an", "ang", "ang", "ang", "ann", "ann", "ann", "au", "au", "au", "aunn", "aunn", "aunn", "b", "b", "b", "b", "b", "bb", "bb", "c", "c", "c", "c", "c", "ch", "ch", "ch", "d", "d", "d", "d", "d", "e", "e", "e", "e", "e", "ee", "ee", "ee", "ee", "ee", "enn", "enn", "enn", "enn", "enn", "f", "f", "g", "g", "g", "g", "g", "h", "h", "h", "i", "i", "i", "i", "i", "i", "iam", "iem", "iem", "ien", "inn", "inn", "ion", "iong", "iun", "iung", "k", "k", "l", "l", "m", "m", "m", "m", "m", "m", "m", "m", "n", "n", "n", "n", "n", "n", "ng", "ng", "ng", "ng", "ng", "ng", "o", "o", "o", "o", "o", "o", "o", "o", "o", "om", "om", "om", "ong", "ong", "ong", "onn", "onn", "onn", "p", "p", "rh", "rh", "rh", "s", "s", "s", "s", "s", "s", "s", "s", "sh", "sh", "sh", "t", "t", "u", "u", "u", "u", "u", "uen", "v", "v", "v", "v", "v", "x", "x", "x", "z", "z", "z", "z", "z", "z", "z", "zh", "z", "zh", "zh"];

    var arrBpmS = ["", "", "", "", "", "", "", "", "", "", "", "", "", "", "", "", "", "", "", "", "", "", "", "", "", "", "", "", "", "", "", "", "", "", "", "", "", "", "", "", "", "", "", "", "", "", "", "", "", "", "", "", "", "", "", "", ""];
    var arrPinS = ["ien", "b", "p", "m", "f", "d", "t", "n", "l", "g", "k", "h", "z", "c", "s", "zh", "ch", "sh", "rh", "z", "c", "s", "a", "o", "o", "e", "ai", "au", "an", "n", "ang", "ng", "i", "u", "bb", "v", "ng", "bb", "ee", "enn", "onn", "ann", "m", "ainn", "aunn", "am", "om", "ong", "inn", "b", "d", "g", "z", "v", "s", "x", "f"];

    var arrBpm = [];
    var arrPin = [];

    if (bsz == "Z" || bsz == "z" || bsz == "zhiz") {
        arrBpm = arrBpmZ;
        arrPin = arrPinZ;
    } else if (bsz == "S" || bsz == "s" || bsz == "small") {
        arrBpm = arrBpmS;
        arrPin = arrPinS;
    } else if (bsz == "B" || bsz == "b" || bsz == "big") {
        arrBpm = arrBpmB;
        arrPin = arrPinB;
    }

    var BpmLen = arrBpm.length;
    var PinLen = arrPin.length;
    var reBpm = /()/;

    for (let i = 0; i < BpmLen; i++) {
        reBpm = new RegExp(arrBpm[i], "g");
        txt = txt.replace(reBpm, arrPin[i])
    }
    return txt;
}


