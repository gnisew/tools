function Goix_myA(form) {
	if (!document.getElementById) return;
	myXinCu=document.getElementById("myidXin");
	var i;
	
	var myKiuCu = new String(form.myidKiu.value);
	var myRE;
	for (i = 0; i < myA.length; i+=2) {   
		myRE = new RegExp (myA[i], ["g"]);
	    myKiuCu = myKiuCu.replace(myRE, myA[i+1]+"");
	    }   
	myXinCu.value = myKiuCu;
	}

function Goix_myB(form) {
	if (!document.getElementById) return;
	myXinCu=document.getElementById("myidXin");
	var i;
	
	var myKiuCu = new String(form.myidKiu.value);
	var myRE;
	for (i = 0; i < myB.length; i+=2) {   
		myRE = new RegExp (myB[i], ["g"]);
	    myKiuCu = myKiuCu.replace(myRE, myB[i+1]+"");
	    }   
	myXinCu.value = myKiuCu;
	}

function Copy(form) {
  if (!document.getElementById) return;
  myXinCu=document.getElementById("myidXin");
  myXinCu.focus();
  myXinCu.select();document.execCommand("Copy"); 
}

//======================================;
/*
var btnX ="清除";
var btnA ="大轉小";
var btnB ="小轉大";
var btnC ="複製";
*/
var btnB2S="注音大轉小";
var btnS2B="小轉大";
var btnB2U="調移上";
var btnU2B="調移後";

//注音大小互轉;
var arrBpm = ["ㄅ","","ㄆ","","ㄇ","","ㄈ","","ㄉ","","ㄊ","","ㄋ","","ㄌ","","ㄍ","","ㄎ","","ㄏ","","ㄐ","","ㄑ","","ㄒ","","ㄓ","","ㄔ","","ㄕ","","ㄖ","","ㄗ","","ㄘ","","ㄙ","","ㄧ","","ㄨ","","ㄩ","","ㄚ","","ㄛ","","ㄜ","","ㄝ","","ㄞ","","ㄟ","","ㄠ","","ㄡ","","ㄢ","","ㄣ","","ㄤ","","ㄥ","","ㄦ","","ㄪ","","ㄫ","","ㄬ","","ㆠ","","ㆣ","","ㆢ","","ㆡ","","ㆳ","","ㆫ","","ㆩ","","ㆦ","","ㆧ","","ㆤ","","ㆥ","","ㆮ","","ㆯ","","ㆬ","","ㆰ","","ㆱ","","ㆲ","","ㆭ","","勺","","廿","","工","","万","","兀",""];
var i;
var myRE;
var myXinBpm;
var myKiuBpm;

//==================================================;
function Goix_Var(form) {
	if (!document.getElementById) return;
	myXinBpm=document.getElementById("myidXin");
	myKiuBpm = form.myidXin.value;
}

function Goix_B2S(form) {
	for (i = 0; i < arrBpm.length; i+=2) {   
		myRE = new RegExp (arrBpm[i], ["g"]);
	    myKiuBpm = myKiuBpm.replace(myRE, arrBpm[i+1]+"");
	    }   
	myXinBpm.value = myKiuBpm;
}

function Goix_S2B(form) {
	for (i = 0; i < arrBpm.length; i+=2) {   
		myRE = new RegExp (arrBpm[i+1], ["g"]);
	    myKiuBpm = myKiuBpm.replace(myRE, arrBpm[i]+"");
	    }   
	myXinBpm.value = myKiuBpm;
}

function Goix_B2U(form) {

	myKiuBpm=myKiuBpm.replace(/()()(ˊ|z)/gi,'$1́$2');
	myKiuBpm=myKiuBpm.replace(/()()(ˇ|v)/gi,'$1̌$2');
	myKiuBpm=myKiuBpm.replace(/()()(ˋ|s)/gi,'$1̀$2');
	myKiuBpm=myKiuBpm.replace(/()()(ˆ|x|\^)/gi,'$1̂$2');
	myKiuBpm=myKiuBpm.replace(/()()(⁺|f|\+)/gi,'$1̄$2');

	myKiuBpm=myKiuBpm.replace(/()()(ˊ|z)/gi,'$1́$2');
	myKiuBpm=myKiuBpm.replace(/()()(ˇ|v)/gi,'$1̌$2');
	myKiuBpm=myKiuBpm.replace(/()()(ˋ|s)/gi,'$1̀$2');
	myKiuBpm=myKiuBpm.replace(/()()(ˆ|x|\^)/gi,'$1̂$2');
	myKiuBpm=myKiuBpm.replace(/()()(⁺|f|\+)/gi,'$1̄$2');

	myKiuBpm=myKiuBpm.replace(/()()(ˊ|z)/gi,'$1́$2');
	myKiuBpm=myKiuBpm.replace(/()()(ˇ|v)/gi,'$1̌$2');
	myKiuBpm=myKiuBpm.replace(/()()(ˋ|s)/gi,'$1̀$2');
	myKiuBpm=myKiuBpm.replace(/()()(ˆ|x|\^)/gi,'$1̂$2');
	myKiuBpm=myKiuBpm.replace(/()()(⁺|f|\+)/gi,'$1̄$2');

	myKiuBpm=myKiuBpm.replace(/([-,-])([])(ˊ|z)/gi,'$1$2́');
	myKiuBpm=myKiuBpm.replace(/([-,-])([])(ˇ|v)/gi,'$1$2̌');
	myKiuBpm=myKiuBpm.replace(/([-,-])([])(ˋ|s)/gi,'$1$2̀');
	myKiuBpm=myKiuBpm.replace(/([-,-])([])(ˆ|x|\^)/gi,'$1$2̂');
	myKiuBpm=myKiuBpm.replace(/([-,-])([])(⁺|f|\+)/gi,'$1$2̄');  

	myKiuBpm=myKiuBpm.replace(/([])([])(ˊ|z)/gi,'$1́$2');
	myKiuBpm=myKiuBpm.replace(/([])([])(ˇ|v)/gi,'$1̌$2');
	myKiuBpm=myKiuBpm.replace(/([])([])(ˋ|s)/gi,'$1̀$2');
	myKiuBpm=myKiuBpm.replace(/([])([])(ˆ|x|\^)/gi,'$1̂$2');
	myKiuBpm=myKiuBpm.replace(/([])([])(⁺|f|\+)/gi,'$1̄$2');

	myKiuBpm=myKiuBpm.replace(/([])(ˊ|z)/gi,'$1́');
	myKiuBpm=myKiuBpm.replace(/([])(ˇ|v)/gi,'$1̌');
	myKiuBpm=myKiuBpm.replace(/([])(ˋ|s)/gi,'$1̀');
	myKiuBpm=myKiuBpm.replace(/([])(ˆ|x|\^)/gi,'$1̂');
	myKiuBpm=myKiuBpm.replace(/([])(⁺|f|\+)/gi,'$1̄');


	myXinBpm.value = myKiuBpm;
}

function Goix_U2B(form){
myKiuBpm=myKiuBpm.replace(/([-]{0,5})(́)([-]{0,5})/g,'$1$3ˊ');
myKiuBpm=myKiuBpm.replace(/([-]{0,5})(̌)([-]{0,5})/g,'$1$3ˇ');  
myKiuBpm=myKiuBpm.replace(/([-]{0,5})(̀)([-]{0,5})/g,'$1$3ˋ');  
myKiuBpm=myKiuBpm.replace(/([-]{0,5})(̂)([-]{0,5})/g,'$1$3ˆ');  
myKiuBpm=myKiuBpm.replace(/([-]{0,5})(̄)([-]{0,5})/g,'$1$3⁺');  

	myXinBpm.value = myKiuBpm;
}

//==================================================;

function Goix_BpmB2S(form) {
	//注音大轉小;
Goix_Var(form);
Goix_B2S(form);
	}

function Goix_BpmS2B(form) {
	//注音小轉大，且調移後;
Goix_Var(form);
Goix_U2B(form);
Goix_S2B(form) 
	}

function Goix_ToneB2U(form) {
	//注音大轉小，且調移上;
Goix_Var(form);
Goix_B2S(form);
Goix_B2U(form);
	}

function Goix_ToneU2B(form) {
	//注音調移後;
Goix_Var(form);
Goix_U2B(form);
	}

