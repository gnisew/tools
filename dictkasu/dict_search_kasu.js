var i = 0;
var j = 0;
var no = 0;
var txt = "";
var s = 0;

var x = [];
var xx = [];
var cc = [];
var dd = [];
var dBun = [];//放本調;
var dBunTxt = "";
var ee = [];
var ff = [];
var ddBen = [];
var ddBien = [];

var myOut = "";
var txtOut = ""
var xT = "";
var xxT = "";
var ccT = "";
var ddT = "";
var ddTben = "";
var ddTbien = "";
var eeT = "";
var ffT = "";

var trtd = "<tr><td>";
var tdtd = "</td><td>";
var tdtr = "</td></tr>";


var playA = "<a class='' k=\"";
var playB = "\" onclick=k(this)>";
var playC = "</a>";
var playA2 = "<a style=\"display:none\" onclick=k(this)>";


var tpA = "<span class=\"tp\">";
var tpB = "<span class=\"tptxt\">";
var tpC = "<\/span><\/span>";

var myHow = "<br /><br /><table class='myTable'><tr><td>【漢字符號】</td><td>【範例】</td><td>【查詢結果】</td><td>【說明】</td></tr><tr><td>^ 或 \<</td><td>^天</td><td>天公、天氣、天光日</td><td>以○開頭</tr></td><tr><td>$ 或 \></td><td>天$</td><td>好天、寒天、落雨天</td><td>以○結尾</tr></td><tr><td>+</td><td>天+地</td><td>天公、地球、天地</td><td>有○或◇</tr></td><tr><td>#</td><td>天#地</td><td>天地、烏天暗地</td><td>同時有○與◇</tr></td><tr><td>?</td><td>天?</td><td>天公、天氣、天崠</td><td>以○開頭二字詞</tr></td><tr><td>??</td><td>天??</td><td>天光日、天公生、天甫光</td><td>以○開頭三字詞</tr></td><tr><td>???</td><td>天???</td><td>天狗食日、天光白日</td><td>以○開頭四字詞</tr></td><tr><td>=</td><td>學生=</td><td>學生、弟子、門徒</td><td>跟○同類的詞</tr></td></table><br /><table border=\"1\"><tr><td>【拼音符號】</td><td>【範例】</td><td>【查詢結果】</td><td>【說明】</tr></td><tr><td>^ 或 \<</td><td> &lt;tai </td><td>tai、tai gaˇ、tai lu、tai chongˋ</td><td>以○開頭的字詞</tr></td><tr><td>$ 或 ></td><td>tai></td><td>si tai、kuanˆ tai、kuiˇ tai</td><td>以○結尾的字詞</tr></td><tr><td>*</td><td>ba*</td><td>ba、baˊ、baˇ、baˋ、baˆ</td><td>跟○同音的調</tr></td><tr><td>-</td><td>pa-</td><td>pa、pai、padˊ、pangˋ</td><td>以○開頭的單字</tr><tr><td>-</td><td>-en</td><td>pen、pien、teen、hen</td><td>以○結尾的單字</tr><tr><td>~</td><td>t~n</td><td>ten、ton、tun、teen</td><td>中間為任意音的單字</tr></td></table><br /><table border=\"1\"><tr><td>【聲調符號】</td><td>【範例】</td><td>【查詢結果】</td><td>【說明】</tr></td><tr><td>z</td><td>baz</td><td>baˊ、baˊ simˇ、baˊ sanˇ</td><td>也可用 baˊ 查</tr></td><tr><td>v</td><td>bav </td><td>baˇ、baˇ giedˊ、labˋ baˇ</td><td>也可用 baˇ 查</tr></td><tr><td>s</td><td>bas</td><td>baˋ、baˋ dai、baˋ zaiˆ</td><td>也可用 baˋ 查</tr></td><tr><td>x</td><td>bax</td><td>baˆ、baˆ hiˆ、mˆ baˆ</td><td>也可用 baˆ 查</tr></td></table><br /><table border=\"1\"><tr><td>【疊字符號】</td><td>【範例】</td><td>【查詢結果】</td><td>【說明】</tr></td><tr><td>ABC</td><td>AAAA</td><td>汀汀汀汀、念念念念</td><td>○○○○</tr></td><tr><td>ABC</td><td>AABB</td><td>長長久久、家家屋屋</td><td>○○◇◇</tr></td><tr><td>ABC</td><td>ABAB</td><td>恬靜恬靜、古早古早</td><td>○◇○◇</tr></td><tr><td>ABC</td><td>AABC</td><td>代代相傳、寬寬子講</td><td>○○◇□</tr></td><tr><td>ABC</td><td>AAA</td><td>長長長、狹狹狹</td><td>○○○</tr></td><tr><td>ABC</td><td>AAB</td><td>堵堵好、蚯蚯婆</td><td>○○◇</tr></td><tr><td>ABC</td><td>ABB</td><td>暗摸摸、恬卒卒</td><td>○◇◇</tr></td><tr><td>ABC</td><td>AA</td><td>暗暗、拜拜</td><td>○○</tr></td></table>";

var tableG = "<div class='table-container'><table class='myTable' id='myTable'><tr><td>no.<\/td><td>【國語】<\/td><td>【詔安客】<\/td><td>【標音】<\/td><\/tr><\/div>";

var noDataG = "<br \/>" + "不好意思，找不到。" + "<br \/>" + "(歹勢，尋無。)" + "<br \/>" + myHow;
var noDataK = "<br \/>" + "歹勢，尋無。" + "<br \/>" + "(不好意思，找不到。)" + "<br \/>" + myHow;
var noDataY = "<br \/>" + "歹勢，尋無。" + "<br \/>" + "painnx-shex, cims mos." + "<br \/>" + "(不好意思，找不到。)" + "<br \/>" + myHow;





function myWordOX(){
    var myWord = document.getElementById("myWord");
	var myWordOX = document.getElementById("myWordOX");
    var myTxt = myWordOX.innerHTML;
	if (myTxt == "⊕")
	{
		myWord.style.display = "";
		myWordOX.innerHTML = "⊖";
		myWordOX.style.backgroundColor= "#eee";
	}else if (myTxt == "⊖")
	{
		myWord.style.display = "none";
		myWordOX.innerHTML = "⊕";
		myWordOX.style.backgroundColor= "#fff";
	}
}

function myWordOX2(){
		document.getElementById("myWord").style.display = "none";
		document.getElementById("myWordOX").innerHTML = "⊕";
		document.getElementById("myWordOX").style.backgroundColor= "#fff";
}



function myWord(){
	var myArr = ["⊗","ˊ","ˇ","ˋ","ˆ","　","\^","\?","\*","\~","\-","\+","\#","\$","　","𠊎","䀴","佢","恁","拁","","恬","蹛","个","吂","𠢕","尞","崠","a","拗","緪","尪","扼","","醃","b","枋","咈","挷","抔","揙","揹","哱","咇","䃗","摒","晡","𤐙","腓","偝","㗘","掊","蜱","bb","唩","䆀","搵","塕","穢","掖","c","慼","噍","筅","攕","摻","蚻","揫","亼","吮","凊","𥯥","鏨","ch","銃","㓾","掣","疶","𣛮","d","佇","竳","頕","抌","𠕇","溚","𪐞","喋","丼","掇","e","揞","擪","漚","f","炥","麩","拊","䘆","朏","癀","g","佮","跔","笐","囝","牯","𧊅","跍","勼","痀","挾","頦","墘","焿","絭","嘓","扴","胛","桱","桷","桊","𥴊","鈷","鋏","h","翕","咻","𢎙","譀","馦","嗬","閕","䫲","吓","熻","䈄","蚶","i","枵","穎","k","箍","搉","揪","揢","揜","䗁","𠖫","吱","虬","𨃰","胗","确","鬮","㧡","杙","𤲍","蜞","觳","敧","𩚨","毬","炣","硿","磡","綹","剾","l","啉","捋","壢","㐁","㪐","蝲","圝","鑢","粩","摝","爧","䉂","抐","挵","撏","腡","膦","橐","蹽","閬","m","嫲","𢫦","㜷","佅","幔","䁅","㿸","酶","鼢","n","挼","㜮","撋","楝","爁","醪","燶","㼓","ng","戇","𥍉","嗷","㘝","儑","𦜆","𪘒","o","僫","p","歕","刜","冇","䫌","疕","凴","烳","䀯","𥰔","癖","葩","抨","廍","肨","䯋","rh","燃","瘍","s","踅","𤞚","餳","𢳪","趖","嗍","穡","捎","𤺪","抋","煠","鉎","擤","雭","㘔","挱","椊","檨","糝","sh","塍","搧","豉","抒","揲","𥍆","t","跈","悿","䌈","敨","汰","砣","坉","仝","佗","𢯭","魠","u","斡","z","矺","撙","咂","㬹","唚","腈","zh","秥"];
	var arrLeng = myArr.length;
	var t = "";
	var myRule = /[a-z　]/g;
	for (let i = 0; i < arrLeng ; i++ )
	{
		if (myRule.test(myArr[i]))
		{
			t = t + "<span>" + myArr[i] + "</span>"

		}else{
		    t = t + "<button onclick='X(this)'>" + myArr[i] + "</button>"
		}
	}	
	t = "<div id='myWord' class='myWord' style='display: none'>" + t + "</div>"
document.write(t);
// <script>myWord();</script>
}

function X(myThis){
    var AAA = document.getElementById("AAA");
	var aaaTxt = AAA.value;
	var myTxt = myThis.innerHTML;
	if (myTxt == "^" || myTxt == "<")
	{
		AAA.value = myTxt + aaaTxt;
	}else if (myTxt == "⊗")
	{
		AAA.value = "";
	}else{
	AAA.value = aaaTxt + myTxt;
	}
}

//document.write('<button onclick="toTop()" id="toTop" title="去上">Top</button>');


var mybutton = document.getElementById("toTop");
window.onscroll = function() {scrollFunction()};

function scrollFunction() {
  if (document.body.scrollTop > 20 || document.documentElement.scrollTop > 20) {
    mybutton.style.display = "block";
  } else {
    mybutton.style.display = "none";
  }
}
function toTop() {
  document.body.scrollTop = 0;
  document.documentElement.scrollTop = 0;
}




function Kasu(myLang) {
    if (!document.getElementById) return;
    myXinCu = document.getElementById("BBB");
    myXinCu.innerHTML = "";

    var myKiuCu = AAA.value;
    myKiuCu = myKiuCu.trim();
    AAA.value = myKiuCu;
    myKiuCu = myKiuCu.replace(/ /g, "");

    var abcReg = /[A-Z,a-z]/g;
    var abcMatch = abcReg.test(myKiuCu);
    myKiuCu = myKiuCu.replace(/[-!#$%^&*():;.,<>?~/\|+]/g, "");

    var aaaaArr = ["AAAA", "AAAB", "AABA", "AABB", "AABC", "ABAA", "ABAB", "ABBB", "ABBC", "ABCA", "ABCC", "ACCB", "BAAA", "BAAC", "BABA", "BABB", "BACB", "BACC", "BBAA", "BBAB", "BBAC", "BBBA", "BBBB", "BCAA", "CABC", "CCAB", "XXXX", "AAA", "AAB", "ABA", "ABB", "BAA", "BAB", "BBA", "BBB", "XXX", "AA", "BB", "XX"]
    var aaaaArrNo = aaaaArr.indexOf(myKiuCu.toUpperCase());


    if (myKiuCu == "") {
        myXinCu.innerHTML = noDataK;
    } else if (aaaaArrNo >= 0 && myLang == "K") {
        GoixK('K');
    } else if (aaaaArrNo >= 0 && myLang == "G") {
        GoixK('G');
    } else if (abcMatch == false && myLang == "K") {
        GoixK('K');
    } else if (abcMatch == false && myLang == "G") {
        GoixK('G');
    } else {
        GoixY();
    }
}




//===========================================;
function GoixY() {

    if (!document.getElementById) return;
    myXinCu = document.getElementById("BBB");
    myXinCu.innerHTML = "";

    var myKiuCu = AAA.value;
    myKiuCu = myKiuCu.trim();
    myKiuCu = myKiuCu.replace(/( )+/g, " ");
    myKiuCu = myKiuCu.toLowerCase();
    AAA.value = myKiuCu;

    // 移除-、多餘空格;
    myKiuCu = myKiuCu.replace(/([a-z,ˊˋˇ^ˆ])(\-\-)([a-z])/g, "$1 $3");
    myKiuCu = myKiuCu.replace(/([a-z,ˊˋˇ^ˆ])(\-)([a-z])/g, "$1 $3");
    myKiuCu = myKiuCu.replace(/(  )/g, " ");

    // 開頭用^或<；結尾用$或> ;
    myKiuCu = myKiuCu.replace(/\>/g, "$");
    myKiuCu = myKiuCu.replace(/\</g, "^");
    myKiuCu = myKiuCu.replace(/\?/g, ".");
    
	//把+改成~；
	myKiuCu = myKiuCu.replace(/\+/g, "f");
	myKiuCu = myKiuCu.replace(/\~/g, "+");

    // 沒有英文字母就無法查詢;
    var abcReg = /[A-Z,a-z]/g;
    var abcMatch = abcReg.test(myKiuCu);
    if (abcMatch == false) {
        myKiuCu = "XYZ";
    }

    var ridCu = "No";

    var dotNo = 0;
    var dotKiu = myKiuCu.replace(/\./g, "");
    var lenKiu = myKiuCu.length;
    dotNo = lenKiu - dotKiu.length;

    if (dotNo >= 1) {
        dotNo = 0;
        ridCu = "YES";
        myKiuCu = myKiuCu.replace(/\./g, "([a-z])");
    }

    // * 可查任意調的字與詞，如 ho* 查到 ho hoz hov hos hox;
    if (myKiuCu.indexOf("*") > 0) {
        myKiuCu = myKiuCu.replace(/([aeioumngbdg])(\*)/g, "$1([zvsx])?");
    }

    //用-，只能查一個字;
    // 這個只能在 + 判定前;

    if (myKiuCu.length - myKiuCu.indexOf("-") == 1) {		
        myKiuCu = myKiuCu.replace(/([a-z])(\-)/g, "$1([ a-z])+");
        ridCu = "YES";
    }

    if (myKiuCu.length - myKiuCu.indexOf("-") == myKiuCu.length) {
        myKiuCu = myKiuCu.replace(/(\-)([a-z])/g, "([a-z])+$2" + "([ zvsx])?");
        ridCu = "YES";
    }

    // 用 b~n，可查到 ban been bien bun；若 b~n*，可再加不同聲調;
    var plusReg = /([a-z]+)(\+)([a-z]+)/g;
    var plusMatch = plusReg.test(myKiuCu);
    if (plusMatch == true)
    {
		myKiuCu = myKiuCu.replace(/\+/g, "[a-z]*");
		ridCu = "YES";
    }

    if (myKiuCu.length - myKiuCu.indexOf("+") == 1) {
        myKiuCu = myKiuCu.replace(/([a-z])(\+)/g, "$1([a-z])+");
        ridCu = "YES";
    }

    if (myKiuCu.length - myKiuCu.indexOf("+") == myKiuCu.length) {
        myKiuCu = myKiuCu.replace(/(\+)([a-z])/g, "([a-z])+$2 + ([zvsx])?");
       ridCu = "YES";
    }


    if (myKiuCu.indexOf("$") + 1 == myKiuCu.length) {
        myKiuCu = " " + myKiuCu.replace(/\$/g, " $");
    } else if (myKiuCu.indexOf("^") == 0) {
        myKiuCu = myKiuCu.replace(/\^/g, "^ ") + " ";
    } else {
        myKiuCu = " " + myKiuCu + " ";
    }

    // 調整聲調符號為字母代號 ;
    myKiuCu = myKiuCu.replace(/(ˊ)/g, "z");
    myKiuCu = myKiuCu.replace(/(ˇ)/g, "v");
    myKiuCu = myKiuCu.replace(/(ˋ)/g, "s");
    myKiuCu = myKiuCu.replace(/(ˆ)/g, "x");
    myKiuCu = myKiuCu.replace(/([aeioumngbd])(\^)/g, "$1x");

    // 標音符號調整 ;
    myKiuCu = myKiuCu.replace(/oo/g, "o");
    myKiuCu = myKiuCu.replace(/bb/g, "v");
    myKiuCu = myKiuCu.replace(/rh/g, "r");
    myKiuCu = myKiuCu.replace(/ji/g, "zi");
    myKiuCu = myKiuCu.replace(/qi/g, "ci");
    myKiuCu = myKiuCu.replace(/xi/g, "si");

    //放本調;
	dBunTxt = d.join("|");
    dBunTxt = LiuBen(dBunTxt);
	dBun = dBunTxt.split("|");

    var result;
    var patt1 = new RegExp(myKiuCu, "i");

    for (i = 0; i < c.length; i += 1) {
        result = patt1.test(" " + dBun[i] + " ");
        if (result == true && ridCu == "No") {
			ccT = ccT + c[i] + "|"; ddT = ddT + d[i]+ "|"; eeT = eeT + e[i]+ "|"; ffT = ffT + f[i]+ "|";
        } else if (result == true && ridCu == "YES" && dBun[i].indexOf(" ") < 0) {
			ccT = ccT + c[i] + "|"; ddT = ddT + d[i]+ "|"; eeT = eeT + e[i]+ "|"; ffT = ffT + f[i]+ "|";
        }
    }

    //結果處理 ;
    if (ccT.replace(/\|/g, "") == "") {
        myXinCu.innerHTML = noDataY;
    } else {
        //  ;
        myKiuCu = myKiuCu.replace(/ \$/g, "");
        myKiuCu = myKiuCu.replace(/\^ /g, "");
        myKiuCu = myKiuCu.trim();

		//放置本調與變調;
		//本變留本調;
		ddTben = LiuBen(ddT);
		//本變留變調;
		ddTbien = LiuBien(ddT);

        //標色 ;
        var regColor = new RegExp("(" + myKiuCu + ")", "g");
        ddTben = ddTben.replace(regColor, ";ws;" + "$1" + ";wy;");
        myKiuCu = myKiuCu.replace(/( )/g, "-");
        var regColor2 = new RegExp("(" + myKiuCu + ")", "g");
        ddTben = ddTben.replace(regColor2, ";ws;" + "$1" + ";wy;");

        //聲調處理;
		ddTben = ToneFace(ddTben);
		ddTbien = ToneFace(ddTbien);

        //標色符號轉HTML;
        ddTben = ddTben.replace(/(;ws;)/g, "<span class='gaz'>");
        ddTben = ddTben.replace(/(;wy;)/g, "</span>");
        
		//造字還原;
		ccT = ZtoU(ccT);

        cc = ccT.split("|");
		dd = ddT.split("|");
		ee = eeT.split("|");
		ff = ffT.split("|");
		ddBen = ddTben.split("|");
		ddBien = ddTbien.split("|");

		var ccLeng = cc.length;

		for (i=0; i < ccLeng-1 ; i++ )
		{
			j = i+1;			
		   myOut = myOut + trtd + j + tdtd + ee[i] + tdtd +  playA + ddBien[i] + playB + cc[i] + playC + tdtd + playA + ddBien[i] + playB + tpA + ddBen[i] + tpB + ddBien[i] + tpC + playC + playA2+ ddBien[i] + playC + tdtr;
        }

        myXinCu.innerHTML = tableG + myOut + "</table>"; 
    }
  myOut = "";  ccT = "";  ddT = "";  ddTben = "";  ddTbien = "";  eeT = "";  ffT = "";
}






//================================================;
function GoixK(myLang) {

    if (!document.getElementById) return;
    myXinCu = document.getElementById("BBB");
    myXinCu.innerHTML = "";

    var myKiuCu = AAA.value;
    myKiuCu = myKiuCu.trim();
    AAA.value = myKiuCu;
    myKiuCu = myKiuCu.replace(/ /g, ""); 

        //查國語或查客語，把陣列賦予給x;
		if (myLang == "K")
		{
			x = c;
			/*
			var cJoin = c.join("|");
			cJoin = UtoZ(cJoin);
			window.alert(cJoin);
			x = cJoin.split("|");
			*/
			myKiuCu = UtoZ(myKiuCu);
			//轉造字;
		}else if (myLang == "G")
		{
			x = e;
		}


    //特殊查詢符號統一化
    myKiuCu = myKiuCu.replace(/\</g, "^");
    myKiuCu = myKiuCu.replace(/\>/g, "$");
    myKiuCu = myKiuCu.replace(/\?/g, ".");
    myKiuCu = myKiuCu.replace(/\？/g, ".");
    myKiuCu = myKiuCu.replace(/\*/g, "~");
    myKiuCu = myKiuCu.replace(/\+/g, "|");
    myKiuCu = myKiuCu.replace(/\-/g, "");
    myKiuCu = myKiuCu.replace(/\//g, "|");
    myKiuCu = myKiuCu.replace(/\&/g, "#");
    myKiuCu = myKiuCu.replace(/\＆/g, "#");

    myKiuCu = myKiuCu.replace(/\[/g, "");
    myKiuCu = myKiuCu.replace(/\]/g, "");
    myKiuCu = myKiuCu.replace(/\\/g, "");
    myKiuCu = myKiuCu.replace(/\{/g, "");
    myKiuCu = myKiuCu.replace(/\}/g, "");
    myKiuCu = myKiuCu.replace(/\(/g, "");
    myKiuCu = myKiuCu.replace(/\)/g, "");

    //避免太多任一字元......
    var dotNo = 0;
    var dotKiu = myKiuCu.replace(/\./g, "");
    var lenKiu = myKiuCu.length;
    dotNo = lenKiu - dotKiu.length;

    if (dotNo > 4) {
        dotNo = 0;
        myKiuCu = "XYZ";
    } else if (dotNo >= 1) {
        dotNo = dotNo;
    }

    // 天* 或 天~ ，可查到 天開頭 大於等於 兩個字以上的字元;
    var waveNo = 0;
    var waveKiu = myKiuCu.replace(/\~/g, "");
    waveNo = lenKiu - waveKiu.length;

    if (waveNo > 1) {
        waveNo = 0;
        myKiuCu = "XYZ";
    } else if (waveNo = 1) {
        waveNo = waveNo;
        myKiuCu = myKiuCu.replace(/\~/g, ".");
    }

    // 天= ，可查到跟「天」同類的詞 ;
    var equalNo = 0;
    var equalKiu = myKiuCu.replace(/\=/g, "");
    equalNo = lenKiu - equalKiu.length;
	var xLeng = x.length;

    if (equalNo > 0) {
        equalNo = 1;
        myKiuCu = myKiuCu.replace(/\=/g, "");
		
        for (i = 0; i < xLeng; i++) {
            if (x[i] == myKiuCu) {
                var kindYes = "YES";
                var kindText = f[i];
                break;
            }
        }
    }


    if (myKiuCu.indexOf("#") > 0 && myKiuCu.indexOf("#") + 1 != myKiuCu.length) {
        var myKiuCu1 = myKiuCu.substring(0, myKiuCu.indexOf("#"));
        var myKiuCu2 = myKiuCu.substring(myKiuCu.indexOf("#") + 1);
    }

	//myKiuCu 轉大寫
	var upKiu = myKiuCu.toUpperCase();

    // 查出符合條件的詞;
    for (i = 0; i < xLeng; i++) {

        var tA = x[i].substring(0, 1)
        var tB = x[i].substring(1, 2)
        var tC = x[i].substring(2, 3)
        var tD = x[i].substring(3, 4)

        //找同類詞；找到後會再往下找具有詞;
        if (kindYes = "YES" && kindText != "" && f[i] == kindText) {
			ccT = ccT + c[i] + "|"; ddT = ddT + d[i]+ "|"; eeT = eeT + e[i]+ "|"; ffT = ffT + f[i]+ "|";
            //疊字與特殊規則;
        } else if ( (upKiu == "AAAA" || upKiu == "BBBB") && x[i].length == 4 && tA == tB && tA == tC && tA == tD) {
			ccT = ccT + c[i] + "|"; ddT = ddT + d[i]+ "|"; eeT = eeT + e[i]+ "|"; ffT = ffT + f[i]+ "|";
        } else if ( (upKiu == "AAAB" || upKiu == "BBBA") && x[i].length == 4 && tA == tB && tA == tC && tA != tD) {
			ccT = ccT + c[i] + "|"; ddT = ddT + d[i]+ "|"; eeT = eeT + e[i]+ "|"; ffT = ffT + f[i]+ "|";
        } else if ( (upKiu == "AABA" || upKiu == "BBAB") && x[i].length == 4 && tA == tB && tA == tD && tA != tC) {
			ccT = ccT + c[i] + "|"; ddT = ddT + d[i]+ "|"; eeT = eeT + e[i]+ "|"; ffT = ffT + f[i]+ "|";
        } else if ( (upKiu == "ABAA" || upKiu == "BABB") && x[i].length == 4 && tA == tC && tA == tD && tA != tB) {
			ccT = ccT + c[i] + "|"; ddT = ddT + d[i]+ "|"; eeT = eeT + e[i]+ "|"; ffT = ffT + f[i]+ "|";
        } else if ( (upKiu == "ABBB" || upKiu == "BAAA") && x[i].length == 4 && tB == tC && tB == tD && tB != tA) {
			ccT = ccT + c[i] + "|"; ddT = ddT + d[i]+ "|"; eeT = eeT + e[i]+ "|"; ffT = ffT + f[i]+ "|";
        } else if ( (upKiu == "AABB" || upKiu == "BBAA") && x[i].length == 4 && tA == tB && tC == tD && tA != tC) {
			ccT = ccT + c[i] + "|"; ddT = ddT + d[i]+ "|"; eeT = eeT + e[i]+ "|"; ffT = ffT + f[i]+ "|";
        } else if ( (upKiu == "ABAB" || upKiu == "BABA") && x[i].length == 4 && tA == tC && tB == tD && tA != tB) {
			ccT = ccT + c[i] + "|"; ddT = ddT + d[i]+ "|"; eeT = eeT + e[i]+ "|"; ffT = ffT + f[i]+ "|";
        } else if ( (upKiu == "AABC" || upKiu == "BBAC" || upKiu == "CCAB") && x[i].length == 4 && tA == tB && tA != tC && tA != tD && tC != tD) {
			ccT = ccT + c[i] + "|"; ddT = ddT + d[i]+ "|"; eeT = eeT + e[i]+ "|"; ffT = ffT + f[i]+ "|";
        } else if ( (upKiu == "ABBC" || upKiu == "BAAC" || upKiu == "CAAB") && x[i].length == 4 && tB == tC && tA != tB && tA != tD && tB != tD) {
			ccT = ccT + c[i] + "|"; ddT = ddT + d[i]+ "|"; eeT = eeT + e[i]+ "|"; ffT = ffT + f[i]+ "|";
        } else if ( (upKiu == "ABCC" || upKiu == "BCAA") && x[i].length == 4 && tC == tD && tA != tB && tA != tC && tB != tC) {
			ccT = ccT + c[i] + "|"; ddT = ddT + d[i]+ "|"; eeT = eeT + e[i]+ "|"; ffT = ffT + f[i]+ "|";
        } else if ( (upKiu == "ABCA" || upKiu == "CABC" || upKiu == "BACB") && x[i].length == 4 && tA == tD && tA != tB && tA != tC && tB != tC) {
			ccT = ccT + c[i] + "|"; ddT = ddT + d[i]+ "|"; eeT = eeT + e[i]+ "|"; ffT = ffT + f[i]+ "|";
        } else if ( (upKiu == "AAA" || upKiu == "BBB") && x[i].length == 3 && tA == tB && tA == tC) {
			ccT = ccT + c[i] + "|"; ddT = ddT + d[i]+ "|"; eeT = eeT + e[i]+ "|"; ffT = ffT + f[i]+ "|";
        } else if ( (upKiu == "AAB" || upKiu == "BBA") && x[i].length == 3 && tA == tB && tA != tC) {;
			ccT = ccT + c[i] + "|"; ddT = ddT + d[i]+ "|"; eeT = eeT + e[i]+ "|"; ffT = ffT + f[i]+ "|";
        } else if ( (upKiu == "ABA" || upKiu == "BAB") && x[i].length == 3 && tA == tC && tA != tB) {
			ccT = ccT + c[i] + "|"; ddT = ddT + d[i]+ "|"; eeT = eeT + e[i]+ "|"; ffT = ffT + f[i]+ "|";
        } else if ( (upKiu == "ABB" || upKiu == "BAA") && x[i].length == 3 && tB == tC && tA != tB) {
			ccT = ccT + c[i] + "|"; ddT = ddT + d[i]+ "|"; eeT = eeT + e[i]+ "|"; ffT = ffT + f[i]+ "|";
        } else if ( (upKiu == "AA" || upKiu == "BB") && x[i].length == 2 && tA == tB) {
			ccT = ccT + c[i] + "|"; ddT = ddT + d[i]+ "|"; eeT = eeT + e[i]+ "|"; ffT = ffT + f[i]+ "|";
        } else if (upKiu == "XXXX" && x[i].length == 4 && c[i] != e[i]) {
			ccT = ccT + c[i] + "|"; ddT = ddT + d[i]+ "|"; eeT = eeT + e[i]+ "|"; ffT = ffT + f[i]+ "|";
        } else if (upKiu == "XXX" && x[i].length == 3 && c[i] != e[i]) {
			ccT = ccT + c[i] + "|"; ddT = ddT + d[i]+ "|"; eeT = eeT + e[i]+ "|"; ffT = ffT + f[i]+ "|";
        } else if (upKiu == "XX" && x[i].length == 2 && c[i] != e[i]) {
			ccT = ccT + c[i] + "|"; ddT = ddT + d[i]+ "|"; eeT = eeT + e[i]+ "|"; ffT = ffT + f[i]+ "|";
        } else if (x[i].indexOf(myKiuCu1) >= 0 && x[i].indexOf(myKiuCu2) >= 0) {
			ccT = ccT + c[i] + "|"; ddT = ddT + d[i]+ "|"; eeT = eeT + e[i]+ "|"; ffT = ffT + f[i]+ "|";			
        } else if (dotNo >= 1 && x[i].match(RegExp(myKiuCu))) {
            if (x[i].length == lenKiu) {
				ccT = ccT + c[i] + "|"; ddT = ddT + d[i]+ "|"; eeT = eeT + e[i]+ "|"; ffT = ffT + f[i]+ "|";
            }
        } else if (waveNo == 1 && x[i].match(RegExp(myKiuCu))) {
			ccT = ccT + c[i] + "|"; ddT = ddT + d[i]+ "|"; eeT = eeT + e[i]+ "|"; ffT = ffT + f[i]+ "|";
        } else if (x[i].match(RegExp(myKiuCu))) {
			ccT = ccT + c[i] + "|"; ddT = ddT + d[i]+ "|"; eeT = eeT + e[i]+ "|"; ffT = ffT + f[i]+ "|";
        }
    }

    //結果處理;
    if (ccT.replace(/\|/g, "") == "") {
        myXinCu.innerHTML = noDataK;
    } else {
        //結果標色處理查詢字;
        myKiuCu = myKiuCu.replace(/\./g, "");
        myKiuCu = myKiuCu.replace(/\^/g, "");
        myKiuCu = myKiuCu.replace(/\$/g, "");
        myKiuCu = myKiuCu.replace(/\|/g, "#");

        //查國語或查客語，把要標色的字串賦予給xxT;
        if (myLang == "K")
        {
			xxT = ccT;
        } else if (myLang == "G")
        {
			xxT = eeT;
        }

        if (myKiuCu.indexOf("#") > 0) {
            var myKiuCu1 = myKiuCu.substring(0, myKiuCu.indexOf("#"));
            var myKiuCu2 = myKiuCu.substring(myKiuCu.indexOf("#") + 1);
            var regColor1 = new RegExp("(" + myKiuCu1 + ")", "g");
            xxT = xxT.replace(regColor1, ";ws;" + "$1" + ";wy;");
            var regColor2 = new RegExp("(" + myKiuCu2 + ")", "g");
            xxT = xxT.replace(regColor2, ";ws;" + "$1" + ";wy;");
        } else {
            var regColor = new RegExp("(" + myKiuCu + ")", "g");
            xxT = xxT.replace(regColor, ";ws;" + "$1" + ";wy;");
        }

		//放置本調與變調;
		//本變留本調;
		ddTben = LiuBen(ddT);
		//本變留變調;
		ddTbien = LiuBien(ddT);

        //聲調字母轉為調型;
		ddTben = ToneFace(ddTben);
		ddTbien = ToneFace(ddTbien);

        xxT = xxT.replace(/(;ws;)/g, "<span class='gaz'>");
        xxT = xxT.replace(/(;wy;)/g, "</span>");
        
        //查國語或查客語，把要標完色的字串歸隊到 ccT 或 eeT;		
        if (myLang == "K")
        {
			ccT = xxT;
        } else if (myLang == "G")
        {
			eeT = xxT;
        }

		//造字還原;
		ccT = ZtoU(ccT);
		AAA.value = ZtoU(myKiuCu);

		//ddTben = BopomoHeng(ddTben);
		//ddTbien = BopomoHeng(ddTbien);


        cc = ccT.split("|");  dd = ddT.split("|");  ee = eeT.split("|");  ff = ffT.split("|");
		ddBen = ddTben.split("|");  ddBien = ddTbien.split("|");
		var ccLeng = cc.length;
		for (i=0; i < ccLeng-1 ; i++ )
		{
		   j = i+1;			
		   myOut = myOut + trtd + j + tdtd + ee[i] + tdtd +  playA + ddBien[i] + playB + cc[i] + playC + tdtd + playA + ddBien[i] + playB + tpA + ddBen[i] + tpB + ddBien[i] + tpC + playC + playA2+ ddBien[i] + playC + tdtr;
		}
        myXinCu.innerHTML = tableG + myOut + "</table>";
		
    }
    no = 0;
	myOut = "";  ccT = "";  ddT = "";  ddTben = "";  ddTbien = "";  eeT = "";  ffT = "";
}




function UtoZ(myTxt){
        //轉造字
        var regUZ;
        var uLeng = u.length;
        for (let i = 0; i < uLeng; i++) {
            regUZ = new RegExp( u[i], "g"); 
            myTxt = myTxt.replace(regUZ, z[i]);
        }
		return myTxt;
}


function ZtoU(myTxt){
        //造字還原 ;
		var regZU;
        var uLeng = u.length;
        for (let i = 0; i < uLeng; i++) {
            regZU = new RegExp( z[i], "g");
            myTxt = myTxt.replace(regZU, u[i]);
        }
		return myTxt;
}

function LiuBen(myTxt){
		//本變拼音留本音調;
        myTxt = myTxt.replace(/\-/g, " ");
        myTxt = myTxt.replace(/(  )/g, " ");
		myTxt = myTxt.replace(/([hvr])(m)(o|e)/g, "$1$3");
		myTxt = myTxt.replace(/(hteen)/g, "heen");
		myTxt = myTxt.replace(/(libizc)/g, "libz");
		myTxt = myTxt.replace(/(z|x)(cd)/g, "$1");
		myTxt = myTxt.replace(/([czvsx])(y)/g, "$1");
        myTxt = myTxt.replace(/([czvsx])([czvsxf])/g, "$1");
        myTxt = myTxt.replace(/([aeioumngbd])([fc])/g, "$1");
		return myTxt;
}

function LiuBien(myTxt){
		//本變拼音留變調;
       myTxt = myTxt.replace(/\-/g, " ");
       myTxt = myTxt.replace(/(  )/g, " ");
       myTxt = myTxt.replace(/(zoxvy ridzcy ha)/g, "zua");
       myTxt = myTxt.replace(/(d|g)(edzcy |avy )(ng|h|g)(ai|in|ui|en)(s)(z|f)/g, "$1$4$6");
       myTxt = myTxt.replace(/(d|g)(edzcy |avy )(ng|h|g)(ai|in|ui|en)(s)/g, "$1$4$5");
       myTxt = myTxt.replace(/(zoxvy ridzc)/g, "zoz");
       myTxt = myTxt.replace(/(cidzcy censf)/g, "ciens");
       myTxt = myTxt.replace(/(chavy lienxv)/g, "chienv");
       myTxt = myTxt.replace(/(fixvy pienf)/g, "fenv");
       myTxt = myTxt.replace(/(ciensfy haf)/g, "cia");
       myTxt = myTxt.replace(/(loisfy kui)/g, "lui");
       myTxt = myTxt.replace(/(duzcy hmzc)/g, "dung");
       myTxt = myTxt.replace(/(ziazcy vi)/g, "zi");
       myTxt = myTxt.replace(/(gixcy dov)/g, "gio");
       myTxt = myTxt.replace(/(gixvy ha)/g, "gia");
	   myTxt = myTxt.replace(/(zivy gav)/g, "ziav");
       myTxt = myTxt.replace(/(cinvy gav)/g, "ciangv");       
       myTxt = myTxt.replace(/(shixcd)/g, "shid");
       myTxt = myTxt.replace(/(libizc)/g, "li");
       myTxt = myTxt.replace(/(fuuisf)/g, "fuif");
       myTxt = myTxt.replace(/(v|b)(uzcd)/g, "$1ud");
	   myTxt = myTxt.replace(/(v|t|r)(m|t)/g, "$2");
       myTxt = myTxt.replace(/(hm)(o|e|i|a)/g, "m$2");
       myTxt = myTxt.replace(/([czvsx])([czvsxf])/g, "$2");
       myTxt = myTxt.replace(/([aeioumngbd])([c])/g, "$1");
	   return myTxt;
}

function ToneFace(myTxt){	
        //聲調字母轉變調號;
        myTxt = myTxt.replace(/(\b)([bpfdtlgkhzcs])(o)([zvcsxf]|\b)/g, "$1$2oo$4");
		myTxt = myTxt.replace(/(\b)(oo)([zvcsxf]|\b)/g, "$1Q$3");
        myTxt = myTxt.replace(/(\b)(o)([zvcsxf]|\b)/g, "$1oo$3");
		myTxt = myTxt.replace(/(\b)(Q)([zvcsxf]|\b)/g, "$1o$3");
        myTxt = myTxt.replace(/([aeioumngbd])([z])/g, "$1ˊ");
        myTxt = myTxt.replace(/([aeioumngbd])([v])/g, "$1ˇ");
        myTxt = myTxt.replace(/([aeioumngbd])([s])/g, "$1ˋ");
        myTxt = myTxt.replace(/([aeioumngbd])([x])/g, "$1ˆ");
		myTxt = myTxt.replace(/([aeioumngbd])([f])/g, "$1⁺");
		myTxt = myTxt.replace(/([v])([aeiou])/g, "bb$2");
        myTxt = myTxt.replace(/(r)([aeiou])/g, "rh$2");
	    return myTxt;	
}

function BopomoHeng(myTxt){	
        //拼音(聲調已轉調號)轉橫注音(無特殊符號);
		var myPin = ["([aeioumngbd])(z)","([aeioumngbd])(v)","([aeioumngbd])(s)","([aeioumngbd])(f)","([aeioumngbd])(x)","(hm)","(zh)([aeiou])","(ch)([aeiou])","(sh)([aeiou])","(rh)([aeiou])","(ng)([aeiou])","(bb)([aeiou])","(r)([aeiou])","(p)([aeiou])","(m)([aeiou])","(t)([aeiou])","(n)([aeiou])","(l)([aeiou])","(k)([aeiou])","(h)([aeiou])","(b)([aeiou])","(d)([aeiou])","(g)([aeiou])","(z)([aeou])","(c)([aeou])","(s)([aeou])","(z)(i)","(c)(i)","(s)(i)","(v)([aeiou])","(f)([aeiou])","([aeiou])(b)","([aeiou])(d)","([aeiou])(g)","(uann)(d)","(ainn)","(aunn)","(iong)","(iong)","(iong)","(iong)","(iong)","(ann)","(onn)","(ong)","(enn)","(inn)","(ang)","(ing)","(ung)","(ien)","(eem)","(am)","(om)","(im)","(em)","(ai)","(au)","(an)","(oo)","(ee)","(io)","(a)","(o)","(e)","(i)","(u)","(ng)","(n)","(m)"];
        var myZhu = ["$1ˊ","$1ˇ","$1ˋ","$1⁺","$1ˆ","ㄏㄇ","ㄓ$2","ㄔ$2","ㄕ$2","ㄖ$2","兀$2","万$2","ㄖ$2","ㄆ$2","ㄇ$2","ㄊ$2","ㄋ$2","ㄌ$2","ㄎ$2","ㄏ$2","ㄅ$2","ㄉ$2","ㄍ$2","ㄗ$2","ㄘ$2","ㄙ$2","ㄐ$2","ㄑ$2","ㄒ$2","万$2","ㄈ$2","$1ㄅ","$1ㄉ","$1ㄍ","$1ㄍ","ㄞ˚","ㄠ˚","ㄧㄛㄥ","ㄧㄛㄣ","ㄧㄛㄅ","ㄧㄛㄉ","ㄧㄛㄍ","ㄚ˚","ㄛ˚","ㄛㄥ","ㄝ˚","ㄧ˚","ㄤ","ㄧㄥ","ㄨㄥ","ㄧㄢ","乜ㄇ","ㄚㄇ","ㄛㄇ","ㄧㄇ","ㄝㄇ","ㄞ","ㄠ","ㄢ","ㄜ","乜","ㄧㄜ","ㄚ","ㄛ","ㄝ","ㄧ","ㄨ","ㄥ","ㄣ","ㄇ"];
		var regPZ;
        var pLeng = myPin.length;
        for (let i = 0; i < pLeng; i++) {
            regPZ = new RegExp( myPin[i], "g");
            myTxt = myTxt.replace(regPZ, myZhu[i]);
        }
		return myTxt;
}

function BopomoXiao(myTxt){	
        //拼音(聲調已轉調號)轉小橫注音(造字);
		var myPin = ["([aeioumngbd])(z)","([aeioumngbd])(v)","([aeioumngbd])(s)","([aeioumngbd])(f)","([aeioumngbd])(x)","(hm)","(zh)([aeiou])","(ch)([aeiou])","(sh)([aeiou])","(rh)([aeiou])","(ng)([aeiou])","(bb)([aeiou])","(r)([aeiou])","(p)([aeiou])","(m)([aeiou])","(t)([aeiou])","(n)([aeiou])","(l)([aeiou])","(k)([aeiou])","(h)([aeiou])","(b)([aeiou])","(d)([aeiou])","(g)([aeiou])","(z)([aeou])","(c)([aeou])","(s)([aeou])","(z)(i)","(c)(i)","(s)(i)","(v)([aeiou])","(f)([aeiou])","([aeiou])(b)","([aeiou])(d)","([aeiou])(g)","(uann)(d)","(ainn)","(aunn)","(iong)","(iong)","(iong)","(iong)","(iong)","(ann)","(onn)","(ong)","(enn)","(inn)","(ang)","(ing)","(ung)","(ien)","(eem)","(am)","(om)","(im)","(em)","(ai)","(au)","(an)","(oo)","(ee)","(io)","(a)","(o)","(e)","(i)","(u)","(ng)","(n)","(m)"];
		var myZhu = ["$1ˊ","$1ˇ","$1ˋ","$1⁺","$1ˆ","","$2","$2","$2","$2","$2","$2","$2","$2","$2","$2","$2","$2","$2","$2","$2","$2","$2","$2","$2","$2","$2","$2","$2","$2","$2","$1","$1","$1","$1","","","","","","","","","","","","","","","","","","","","","","","","","","","","","","","","","","",""];
		var regPZ;
        var pLeng = myPin.length;
        for (let i = 0; i < pLeng; i++) {
            regPZ = new RegExp( myPin[i], "g");
            myTxt = myTxt.replace(regPZ, myZhu[i]);
        }
		return myTxt;
}

function BopomoZhi(myTxt){	
        //拼音轉直注音(造字);
		var myPin = ["(nn)","(oo)","(ee)","([bpmfdtnlgkhzcsjqxr])(ong)","(bb)(e|i|o|u|E)(a|e|i|o|u|ng|m|n)","(z)(i)(a|e|i|o|u|ng|m|n)","(c)(i)(a|e|i|o|u|ng|m|n)","(s)(i)(a|e|i|o|u|ng|m|n)","(zh)(e|i|o|u|E)(a|e|i|o|u|ng|m|n)","(ch)(e|i|o|u|E)(a|e|i|o|u|ng|m|n)","(sh)(e|i|o|u|E)(a|e|i|o|u|ng|m|n)","(rh)(e|i|o|u|E)(a|e|i|o|u|ng|m|n)","(ng)(e|i|o|u)(a|e|i|o|u|ng|m|n)","(p)(e|i|o|u|E)(a|e|i|o|u|ng|m|n)","(m)(e|i|o|u|E)(a|e|i|o|u|ng|m|n)","(f)(e|i|o|u|E)(a|e|i|o|u|ng|m|n)","(d)(e|i|o|u|E)(a|e|i|o|u|ng|m|n)","(t)(e|i|o|u|E)(a|e|i|o|u|ng|m|n)","(n)(e|i|o|u|E)(a|e|i|o|u|ng|m|n)","(l)(e|i|o|u|E)(a|e|i|o|u|ng|m|n)","(g)(e|i|o|u|E)(a|e|i|o|u|ng|m|n)","(k)(e|i|o|u|E)(a|e|i|o|u|ng|m|n)","(h)(e|i|o|u|E)(a|e|i|o|u|ng|m|n)","(z)(e|o|u|E)(a|e|i|o|u|ng|m|n)","(c)(e|o|u|E)(a|e|i|o|u|ng|m|n)","(s)(e|o|u|E)(a|e|i|o|u|ng|m|n)","(b)(e|i|o|u|E)(a|e|i|o|u|ng|m|n)","(v)(e|i|o|u|E)(a|e|i|o|u|ng|m|n)","(r)(e|i|o|u|E)(a|e|i|o|u|ng|m|n)","([-])(iung)","([-])(iong)","([-])(ien)","([-])(ien)","([-])(iun)","([-])(uen)","([-])(ion)","([-])(ieu)","([-])(iem)","([-])(ioi)","([-])(io)","([-])(E)","([-])(Q)","([-])(i)","([-])(u)","([-])(o)","([-])(e)","([-])(aiW)","([-])(auW)","([-])(ang)","([-])(oW)","([-])(aW)","([-])(ong)","([-])(Q)","([-])(ai)","([-])(au)","([-])(an)","([-,-])(ng)","([-])(E)","([-])(am)","([-])(om)","([-])(i)","([-])(u)","([-])(a)","([-])(o)","([-])(e)","([-])(n)","([-])(m)","([-])(b)","([-])(d)","([-])(g)","([-])(z|ˊ)","([-])(v|ˇ)","([-])(s|ˋ)","([-])(f|⁺)","([-])(x|ˆ)","(ng)(ang|ong|an|a|e|i|o|u|Q|E|)","(bb)(ang|ong|an|a|e|i|o|u|Q|E|)","(zh)(ang|ong|an|a|e|i|o|u|Q|E|)","(ch)(ang|ong|an|a|e|i|o|u|Q|E|)","(sh)(ang|ong|an|a|e|i|o|u|Q|E|)","(rh)(ang|ong|an|a|e|i|o|u|Q|E|)","(r)(ang|ong|an|a|e|i|o|u|Q|E|)","(z)(i)","(c)(i)","(s)(i)","(b)(aiW|ang|ong|an|a|e|i|o|u|Q|E|)","(p)(aiW|ang|ong|an|a|e|i|o|u|Q|E|)","(m)(aiW|ang|ong|an|a|e|i|o|u|Q|E|)","(f)(aiW|ang|ong|an|a|e|i|o|u|Q|E|)","(d)(aiW|ang|ong|an|a|e|i|o|u|Q|E|)","(t)(aiW|ang|ong|an|a|e|i|o|u|Q|E|)","(n)(ang|ong|an|a|e|i|o|u|Q|E|)","(l)(aiW|ang|ong|an|a|e|i|o|u|Q|E|)","(g)(aiW|ang|ong|an|a|e|i|o|u|Q|E|)","(k)(aiW|ang|ong|an|a|e|i|o|u|Q|E|)","(h)(aiW|ang|ong|an|a|e|i|o|u|m|Q|E|)","(z)(aiW|ang|ong|an|a|e|o|u|Q|E|)","(c)(aiW|ang|ong|an|a|e|o|u|Q|E|)","(s)(aiW|ang|ong|an|a|e|o|u|Q|E|)","(v)(aiW|ang|ong|an|a|e|i|o|u|Q|E|)","(E)(u|n|m)","(i)(ang|ong|an|a|e|o|u|Q|n|m)","(u)(ang|ong|an|a|e|i|o|Q|n|m)","(o)(i|n)","(e)(u|n|m)","([-])(aiW)","([-])(auW)","([-])(eW)","([-])(ang)","([-])(oW)","([-])(aW)","([-])(iW)","([-])(ong)","([-])(Q)","([-])(ai)","([-])(au)","([-])(an)","([-])(ng)","([-])(E)","([-])(am)","([-])(om)","([-])(i)","([-])(u)","([-])(a)","([-])(o)","([-])(e)","([-])(n)","([-])(m)","([-])(b)","([-])(d)","([-])(g)","([-])(z|ˊ)","([-])(v|ˇ)","([-])(s|ˋ)","([-])(f|⁺)","([-])(x|ˆ)","aiW","auW","eW","ang","oW","aW","iW","ong","am","om","Q","ai","au","an","ng","E","m","e","n","i","u","a","o","([-])(b)","([-])(d)","([-])(g)","([-])(z|ˊ)","([-])(v|ˇ)","([-])(s|ˋ)","([-])(x|ˆ)","([-])(f|⁺)"];
		var myZhu = ["W","Q","E","$1","$2$3","$2$3","$2$3","$2$3","$2$3","$2$3","$2$3","$2$3","$2$3","$2$3","$2$3","$2$3","$2$3","$2$3","$2$3","$2$3","$2$3","$2$3","$2$3","$2$3","$2$3","$2$3","$2$3","$2$3","$2$3","$1","$1","$1","$1","$1","$1","$1","$1","$1","$1","$1","$1","$1","$1","$1","$1","$1","$1","$1","$1","$1","$1","$1","$1","$1","$1","$1","$1","$1","$1","$1","$1","$1","$1","$1","$1","$1","$1","$1","$1","$1","$1","$1","$1","$1","$1","$2","$2","$2","$2","$2","$2","$2","$2","$2","$2","$2","$2","$2","$2","$2","$2","$2","$2","$2","$2","$2","$2","$2","$2","$2","$2","$2","$2","$2","$2","$1","$1","$1","$1","$1","$1","$1","$1","$1","$1","$1","$1","$1","$1","$1","$1","$1","$1","$1","$1","$1","$1","$1","$1","$1","$1","$1","$1","$1","$1","$1","","","","","","","","","","","","","","","","","","","","","","","","$1","$1","$1","$1","$1","$1","$1","$1"];
		var regPZ;
        var pLeng = myPin.length;
        for (let i = 0; i < pLeng; i++) {
            regPZ = new RegExp( myPin[i], "g");
            myTxt = myTxt.replace(regPZ, myZhu[i]);
        }
		return myTxt;
}



/*
function OX(){
  var ox = document.getElementsByattribute("ox");
  var x =  document.getelementsbyattributevalue("x");

  for (let i = 0; i < ox.length; i++) {
    ox[i].style.display = "block";
	//OXX[i].style.display = "block";
  }
    for (let i = 0; i < x.length; i++) {
    x[i].style.display = "block";
	//OXX[i].style.display = "block";
  }

}
*/

/*
pyA
pyB
zyAZhi
zyBZhi
zyAHeng
zyBHeng
zyAXiao
zyBXiao
*/




/*
//自動完成========================================;
document.write('<script>autocomplete(document.getElementById("AAA"), c);<\/script>');
function autocomplete(myInput, myArr) {
  var currentFocus;
  myInput.addEventListener("input", function(e) {
      var a, b, i, myValue = this.value;
	  var myArrLeng = myArr.length;
	  var myValueLeng = myValue.length;
      closeAllLists();

      if (!myValue) { return false;}
      currentFocus = -1;
      //create a DIV element that will contain the items (values):;
      a = document.createElement("DIV");
      a.setAttribute("id", this.id + "autocomplete-list");
      a.setAttribute("class", "autocomplete-items");
      //append the DIV element as a child of the autocomplete container:;
      this.parentNode.appendChild(a);
	  
      for (i = 0; i < myArrLeng; i++) {
        //check if the item starts with the same letters as the text field value:;
        if (myArr[i].substr(0, myValueLeng).toUpperCase() == myValue.toUpperCase()) {
          //create a DIV element for each matching element:;
          b = document.createElement("DIV");
          //make the matching letters bold:;
          b.innerHTML = "<strong>" + myArr[i].substr(0, myValueLeng) + "</strong>";
          b.innerHTML += myArr[i].substr(myValueLeng);
          //insert a input field that will hold the current array item's value:;
          b.innerHTML += "<input type='hidden' value='" + myArr[i] + "'>";
          //execute a function when someone clicks on the item value (DIV element):;
          b.addEventListener("click", function(e) {
              //insert the value for the autocomplete text field:;
              myInput.value = this.getElementsByTagName("input")[0].value;
              closeAllLists();
          });
          a.appendChild(b);
        }
      }
  });
  //execute a function presses a key on the keyboard:;
  myInput.addEventListener("keydown", function(e) {
      var x = document.getElementById(this.id + "autocomplete-list");
      if (x) x = x.getElementsByTagName("div");
      if (e.keyCode == 40) {
        //If the arrow DOWN key is pressed, increase the currentFocus variable:;
        currentFocus++;
        //and and make the current item more visible:;
        addActive(x);
      } else if (e.keyCode == 38) {
        //If the arrow UP key is pressed,
        decrease the currentFocus variable:;
        currentFocus--;
        //and and make the current item more visible:;
        addActive(x);
      } else if (e.keyCode == 13) {
        //If the ENTER key is pressed, prevent the form from being submitted,;
        e.preventDefault();
        if (currentFocus > -1) {
          //and simulate a click on the "active" item:;
          if (x) x[currentFocus].click();
        }
      }
  });

  function addActive(x) {
    //a function to classify an item as "active":;
    if (!x) return false;
    //start by removing the "active" class on all items:;
    removeActive(x);
    if (currentFocus >= x.length) currentFocus = 0;
    if (currentFocus < 0) currentFocus = (x.length - 1);
    //add class "autocomplete-active":;
    x[currentFocus].classList.add("autocomplete-active");
  }

  function removeActive(x) {
    //a function to remove the "active" class from all autocomplete items:;
    for (var i = 0; i < x.length; i++) {
      x[i].classList.remove("autocomplete-active");
    }
  }

  function closeAllLists(elmnt) {
    //close all autocomplete lists in the document,
    except the one passed as an argument:;
    var x = document.getElementsByClassName("autocomplete-items");
    for (var i = 0; i < x.length; i++) {
      if (elmnt != x[i] && elmnt != myInput) {
        x[i].parentNode.removeChild(x[i]);
      }
    }
  }
  //execute a function when someone clicks in the document:;
  document.addEventListener("click", function (e) {
      closeAllLists(e.target);
  });
}

*/


