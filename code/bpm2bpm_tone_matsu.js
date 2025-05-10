	function Goix(form) {
	if (!document.getElementById) return;
	myXinCu=document.getElementById("myidXin");
	var myKiuCu = new String(form.myidKiu.value);
// 調號轉字母調
	myKiuCu=myKiuCu.replace(/([ㄅ-ㆷ,廿])(4)/gi,'$1z');
	myKiuCu=myKiuCu.replace(/([ㄅ-ㆷ,廿])(7)/gi,'$1x');
	myKiuCu=myKiuCu.replace(/([ㄅ-ㆷ,廿])(3)/gi,'$1v');
	myKiuCu=myKiuCu.replace(/([ㄅ-ㆷ,廿])(5)/gi,'$1s');
	myKiuCu=myKiuCu.replace(/([ㄅ-ㆷ,廿])(2)/gi,'$1f');
	myKiuCu=myKiuCu.replace(/([ㄅ-ㆷ,廿])(1)/gi,'$1');
	myKiuCu=myKiuCu.replace(/([ㄅ-ㆷ,廿])(8)/gi,'$1');
	myKiuCu=myKiuCu.replace(/([ㄅ-ㆷ,廿])(ˊ)/gi,'$1z');
	myKiuCu=myKiuCu.replace(/([ㄅ-ㆷ,廿])(\ˆ)/gi,'$1x');
	myKiuCu=myKiuCu.replace(/([ㄅ-ㆷ,廿])(ˇ)/gi,'$1v');
	myKiuCu=myKiuCu.replace(/([ㄅ-ㆷ,廿])(ˋ)/gi,'$1s');
	myKiuCu=myKiuCu.replace(/([ㄅ-ㆷ,廿])(\+)/gi,'$1f');
	myKiuCu=myKiuCu.replace(/([ㄅ-ㆷ,廿])(ˉ)/gi,'$1c');
	myKiuCu=myKiuCu.replace(/([ㄅ-ㆷ,廿])(⁺)/gi,'$1f');
	myKiuCu=myKiuCu.replace(/([ㄅ-ㆷ,廿])(\^)/gi,'$1x');
	myKiuCu=myKiuCu.replace(/([ㄅ-ㆷ,廿])( ́)/gi,'$1z');
	myKiuCu=myKiuCu.replace(/([ㄅ-ㆷ,廿])( ̂)/gi,'$1x');
	myKiuCu=myKiuCu.replace(/([ㄅ-ㆷ,廿])( ̌)/gi,'$1v');
	myKiuCu=myKiuCu.replace(/([ㄅ-ㆷ,廿])( ̀)/gi,'$1s');
	myKiuCu=myKiuCu.replace(/([ㄅ-ㆷ,廿])( ̄)/gi,'$1c');
//變韻(順序不能動)
    myKiuCu=myKiuCu.replace(/(ㄚ)(ㄥ|ㄏ|ㄍ|ㆶ|ㆷ{0,1})([vxz])(--|-| )([ㄅ-ㆷ,廿])/gi,'ㄝ$2$3$4$5');
    myKiuCu=myKiuCu.replace(/(ㄟ)(ㄥ|ㄏ|ㄍ|ㆶ|ㆷ{0,1})([vxz])(--|-| )([ㄅ-ㆷ,廿])/gi,'ㄧ$2$3$4$5');
    myKiuCu=myKiuCu.replace(/(廿ㄩ)(ㄥ|ㄏ|ㄍ|ㆶ|ㆷ{0,1})([vxz])(--|-| )([ㄅ-ㆷ,廿])/gi,'ㄩ$2$3$4$5');
    myKiuCu=myKiuCu.replace(/(ㄞ)(ㄥ|ㄏ|ㄍ|ㆶ|ㆷ{0,1})([vxz])(--|-| )([ㄅ-ㆷ,廿])/gi,'ㄟ$2$3$4$5');
    myKiuCu=myKiuCu.replace(/(ㄧㄠ)(ㄥ|ㄏ|ㄍ|ㆶ|ㆷ{0,1})([vxz])(--|-| )([ㄅ-ㆷ,廿])/gi,'ㄧㄝㄨ$2$3$4$5');
    myKiuCu=myKiuCu.replace(/(ㄡ)(ㄥ|ㄏ|ㄍ|ㆶ|ㆷ{0,1})([vxz])(--|-| )([ㄅ-ㆷ,廿])/gi,'ㄨ$2$3$4$5');
    myKiuCu=myKiuCu.replace(/(ㄠ)(ㄥ|ㄏ|ㄍ|ㆶ|ㆷ{0,1})([vxz])(--|-| )([ㄅ-ㆷ,廿])/gi,'ㄡ$2$3$4$5');
    myKiuCu=myKiuCu.replace(/(ㄛ)(ㄥ|ㄏ|ㄍ|ㆶ|ㆷ{0,1})([vxz])(--|-| )([ㄅ-ㆷ,廿])/gi,'廿$2$3$4$5');
    myKiuCu=myKiuCu.replace(/(ㄛㄩ)(ㄥ|ㄏ|ㄍ|ㆶ|ㆷ{0,1})([vxz])(--|-| )([ㄅ-ㆷ,廿])/gi,'廿ㄩ$2$3$4$5');
//變調
    myKiuCu=myKiuCu.replace(/([ㄚ-ㄩ,ㄏ,廿,ㆬ,ㆲ])([vxz]{0,1})(--|-| )([ㄅ-ㄙ,兀,ㄫ]{0,1})([ㄚ-ㄩ,ㄏ,ㄍ,廿,ㆬ,ㆲ]{1,5})([s]{0,1})(\b)/gi,'$1⁺$3$4$5$6$7');
    myKiuCu=myKiuCu.replace(/(ㄏ)([vxz]{0,1})(--|-| )([ㄅ-ㄙ,兀,ㄫ]{0,1})([ㄚ-ㄩ,ㄏ,ㄍ,廿,ㆬ,ㆲ]{1,5})([s]{0,1})(\b)/gi,'⁺$3$4$5$6$7');
    myKiuCu=myKiuCu.replace(/([ㄚ-ㄩ,ㄏ,廿,ㆬ,ㆲ])([vxz]{0,1})(--|-| )([ㄅ-ㄙ,兀,ㄫ]{0,1})([ㄚ-ㄩ,ㄏ,ㄍ,廿,ㆬ,ㆲ]{1,5})([fvxz])(\b)/gi,'$1ˋ$3$4$5$6$7');
    myKiuCu=myKiuCu.replace(/(ㄏ)([vxz]{0,1})(--|-| )([ㄅ-ㄙ,兀,ㄫ]{0,1})([ㄚ-ㄩ,ㄏ,ㄍ,廿,ㆬ,ㆲ]{1,5})([fvxz])(\b)/gi,'ˋ$3$4$5$6$7');
    myKiuCu=myKiuCu.replace(/([ㄚ-ㄩ,ㄏ,廿,ㆬ,ㆲ])([f])(--|-| )([ㄅ-ㄙ,兀,ㄫ]{0,1})([ㄚ-ㄩ,廿,ㆬ,ㆲ]{1,5})(f)(\b)/gi,'$1ˊ$3$4$5$6$7');
    myKiuCu=myKiuCu.replace(/([ㄚ-ㄩ,ㄏ,廿,ㆬ,ㆲ])([f])(--|-| )([ㄅ-ㄙ,兀,ㄫ]{0,1})([ㄚ-ㄩ,ㄏ,ㄍ,廿,ㆬ,ㆲ]{1,5})([vxz])(\b)/gi,'$1$3$4$5$6$7');
    myKiuCu=myKiuCu.replace(/([ㄚ-ㄩ,ㄏ,廿,ㆬ,ㆲ])([f])(--|-| )([ㄅ-ㄙ,兀,ㄫ]{0,1})([ㄚ-ㄩ,ㄏ,ㄍ,廿,ㆬ,ㆲ]{1,5})([s]{0,1})(\b)/gi,'$1ˇ$3$4$5$6$7');//更換順序;
    myKiuCu=myKiuCu.replace(/(ㄍ)([z])(--|-| )([ㄅ-ㄙ,兀,ㄫ]{0,1})([ㄚ-ㄩ,ㄏ,ㄍ,廿,ㆬ,ㆲ]{1,5})([s]{0,1})(\b)/gi,'hˇ$3$4$5$6$7');
    myKiuCu=myKiuCu.replace(/(ㄍ)([z])(--|-| )([ㄅ-ㄙ,兀,ㄫ]{0,1})([ㄚ-ㄩ,ㄏ,ㄍ,廿,ㆬ,ㆲ]{1,5})(f)(\b)/gi,'hˊ$3$4$5$6$7');
    myKiuCu=myKiuCu.replace(/(ㄍ)([z])(--|-| )([ㄅ-ㄙ,兀,ㄫ]{0,1})([ㄚ-ㄩ,ㄏ,ㄍ,廿,ㆬ,ㆲ]{1,5})([vxz])(\b)/gi,'h$3$4$5$6$7');
    myKiuCu=myKiuCu.replace(/(ㄍ)()(--|-| )([ㄅ-ㄙ,兀,ㄫ]{0,1})([ㄚ-ㄩ,ㄏ,ㄍ,廿,ㆬ,ㆲ]{1,5})([s]{0,1})(\b)/gi,'h⁺$3$4$5$6$7');
    myKiuCu=myKiuCu.replace(/(ㄏ)()(--|-| )([ㄅ-ㄙ,兀,ㄫ]{0,1})([ㄚ-ㄩ,ㄏ,ㄍ,廿,ㆬ,ㆲ]{1,5})([s]{0,1})(\b)/gi,'⁺$3$4$5$6$7');
    myKiuCu=myKiuCu.replace(/(ㄏ)()(--|-| )([ㄅ-ㄙ,兀,ㄫ]{0,1})([ㄚ-ㄩ,ㄏ,ㄍ,廿,ㆬ,ㆲ]{1,5})([fvxz])(\b)/gi,'ˋ$3$4$5$6$7');
    myKiuCu=myKiuCu.replace(/(ㄍ)()(--|-| )([ㄅ-ㄙ,兀,ㄫ]{0,1})([ㄚ-ㄩ,ㄏ,ㄍ,廿,ㆬ,ㆲ]{1,5})([fvxz])(\b)/gi,'h$3$4$5$6$7');
    myKiuCu=myKiuCu.replace(/([ㄚ-ㄩ,ㄏ,廿,ㆬ,ㆲ])(s)(--|-| )([ㄅ-ㄙ,兀,ㄫ]{0,1})([ㄚ-ㄩ,廿,ㆬ,ㆲ]{1,5})()(\b)/gi,'$1⁺$3$4$5$6$7');
    myKiuCu=myKiuCu.replace(/([ㄚ-ㄩ,ㄏ,廿,ㆬ,ㆲ])(s)(--|-| )([ㄅ-ㄙ,兀,ㄫ]{0,1})([ㄚ-ㄩ,廿,ㆬ,ㆲ]{1,5})(s)(\b)/gi,'$1ˇ$3$4$5$6$7');
    myKiuCu=myKiuCu.replace(/([ㄚ-ㄩ,ㄏ,廿,ㆬ,ㆲ])(s)(--|-| )([ㄅ-ㄙ,兀,ㄫ]{0,1})([ㄏㄍ])()(\b)/gi,'$1ˇ$3$4$5$6$7');
    myKiuCu=myKiuCu.replace(/([ㄚ-ㄩ,ㄏ,廿,ㆬ,ㆲ])(s)(--|-| )([ㄅ-ㄙ,兀,ㄫ]{0,1})([ㄚ-ㄩ,廿,ㆬ,ㆲ]{1,5})(f)(\b)/gi,'$1⁺$3$4$5$6$7');
    myKiuCu=myKiuCu.replace(/([ㄚ-ㄩ,ㄏ,廿,ㆬ,ㆲ])(s)(--|-| )([ㄅ-ㄙ,兀,ㄫ]{0,1})([ㄚ-ㄩ,ㄏ,ㄍ,廿,ㆬ,ㆲ]{1,5})([vxz])(\b)/gi,'$1ˇ$3$4$5$6$7');
//變聲
	myKiuCu=myKiuCu.replace(/([ㄚ-ㄩ,廿,ㆬ,ㆲ])([ˊˇˋˆ⁺ˉ]{0,1})(--|-| )(ㄆ|ㄅ)/gi,'$1$2$3勺');
	myKiuCu=myKiuCu.replace(/([ㄚ-ㄩ,廿,ㆬ,ㆲ])([ˊˇˋˆ⁺ˉ]{0,1})(--|-| )(ㄘ|ㄗ)/gi,'$1$2$3ㄖ');
	myKiuCu=myKiuCu.replace(/([ㄚ-ㄩ,廿,ㆬ,ㆲ])([ˊˇˋˆ⁺ˉ]{0,1})(--|-| )(ㄊ|ㄉ|ㄙ)/gi,'$1$2$3ㄌ');
	myKiuCu=myKiuCu.replace(/([ㄚ-ㄩ,廿,ㆬ,ㆲ])([ˊˇˋˆ⁺ˉ]{0,1})(--|-| )(ㄋ)([ㄚ-ㄩ,廿,ㆬ,ㆲ])/gi,'$1$2$3ㄌ$5');
	myKiuCu=myKiuCu.replace(/([ㄚ-ㄩ,廿,ㆬ,ㆲ])([ˊˇˋˆ⁺ˉ]{0,1})(--|-| )(ㄎ|ㄍ|ㄏ)/gi,'$1$2$3');
	myKiuCu=myKiuCu.replace(/(ㄣ|ㄤ|ㄥ|ㆬ,ㆲ)([ˊˇˋˆ⁺ˉ]{0,1})(--|-| )(ㄆ|ㄅ)/gi,'$1$2$3ㄇ');
	myKiuCu=myKiuCu.replace(/(ㄣ|ㄤ|ㄥ|ㆬ,ㆲ)([ˊˇˋˆ⁺ˉ]{0,1})(--|-| )(ㄘ|ㄗ)/gi,'$1$2$3ㄖ');
	myKiuCu=myKiuCu.replace(/(ㄣ|ㄤ|ㄥ|ㆬ,ㆲ)([ˊˇˋˆ⁺ˉ]{0,1})(--|-| )(ㄊ|ㄉ|ㄙ|ㄌ)/gi,'$1$2$3ㄋ');
	myKiuCu=myKiuCu.replace(/(ㄣ|ㄤ|ㄥ|ㆬ,ㆲ)([ˊˇˋˆ⁺ˉ]{0,1})(--|-| )(ㄎ|ㄍ|ㄏ)/gi,'$1$2$3兀');
	myKiuCu=myKiuCu.replace(/(ㄣ|ㄤ|ㄥ|ㆬ,ㆲ)([ˊˇˋˆ⁺ˉ]{0,1})(--|-| )([ㄚ-ㄩ,廿,ㆬ,ㆲ])/gi,'$1$2$3兀$4');
//
	myKiuCu=myKiuCu.replace(/([ㄚ-ㄩ,廿])([zvsxfc]{0,1})(--|-| )(ㄆ|ㄅ)/gi,'$1$2$3勺');
	myKiuCu=myKiuCu.replace(/([ㄚ-ㄩ,廿])([zvsxfc]{0,1})(--|-| )(ㄘ|ㄗ)/gi,'$1$2$3ㄖ');
	myKiuCu=myKiuCu.replace(/([ㄚ-ㄩ,廿])([zvsxfc]{0,1})(--|-| )(ㄊ|ㄉ|ㄙ)/gi,'$1$2$3ㄌ');
	myKiuCu=myKiuCu.replace(/([ㄚ-ㄩ,廿])([zvsxfc]{0,1})(--|-| )(ㄋ)([ㄚ-ㄩ,廿,ㆬ,ㆲ])/gi,'$1$2$3ㄌ$5');
	myKiuCu=myKiuCu.replace(/([ㄚ-ㄩ,廿,])([zvsxfc]{0,1})(--|-| )(ㄎ|ㄍ|ㄏ)/gi,'$1$2$3');
	myKiuCu=myKiuCu.replace(/(ㄣ|ㄤ|ㄥ|ㆬ,ㆲ)([zvsxfc]{0,1})(--|-| )(ㄆ|ㄅ)/gi,'$1$2$3ㄇ');
	myKiuCu=myKiuCu.replace(/(ㄣ|ㄤ|ㄥ|ㆬ,ㆲ)([zvsxfc]{0,1})(--|-| )(ㄘ|ㄗ)/gi,'$1$2$3ㄖ');
	myKiuCu=myKiuCu.replace(/(ㄣ|ㄤ|ㄥ|ㆬ,ㆲ)([zvsxfc]{0,1})(--|-| )(ㄊ|ㄉ|ㄙ|ㄌ)/gi,'$1$2$3ㄋ');
	myKiuCu=myKiuCu.replace(/(ㄣ|ㄤ|ㄥ|ㆬ,ㆲ)([zvsxfc]{0,1})(--|-| )(ㄎ|ㄍ|ㄏ)/gi,'$1$2$3兀');
// 字母調轉調號
	myKiuCu=myKiuCu.replace(/([ㄅ-ㆷ,廿])(z)(\b)/gi,'$1ˊ$3');
	myKiuCu=myKiuCu.replace(/([ㄅ-ㆷ,廿])(x)(\b)/gi,'$1ˆ$3');
	myKiuCu=myKiuCu.replace(/([ㄅ-ㆷ,廿])(v)(\b)/gi,'$1ˇ$3');
	myKiuCu=myKiuCu.replace(/([ㄅ-ㆷ,廿])(s)(\b)/gi,'$1ˋ$3');
	myKiuCu=myKiuCu.replace(/([ㄅ-ㆷ,廿])(f)(\b)/gi,'$1⁺$3');
	myKiuCu=myKiuCu.replace(/([ㄅ-ㆷ,廿])(c)(\b)/gi,'$1ˉ$3');
	myXinCu.value = myKiuCu;}

    function Copy(form) {
    if (!document.getElementById) return;
    myXinCu=document.getElementById("myidXin");
    myXinCu.focus();
    myXinCu.select();document.execCommand("Copy"); 
}






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
var arrBpm = new Array("ㄅ","","ㄆ","","ㄇ","","ㄈ","","ㄉ","","ㄊ","","ㄋ","","ㄌ","","ㄍ","","ㄎ","","ㄏ","","ㄐ","","ㄑ","","ㄒ","","ㄓ","","ㄔ","","ㄕ","","ㄖ","","ㄗ","","ㄘ","","ㄙ","","ㄧ","","ㄨ","","ㄩ","","ㄚ","","ㄛ","","ㄜ","","ㄝ","","ㄞ","","ㄟ","","ㄠ","","ㄡ","","ㄢ","","ㄣ","","ㄤ","","ㄥ","","ㄦ","","ㄪ","","ㄫ","","ㄬ","","ㆠ","","ㆣ","","ㆢ","","ㆡ","","ㆳ","","ㆫ","","ㆩ","","ㆦ","","ㆧ","","ㆤ","","ㆥ","","ㆮ","","ㆯ","","ㆬ","","ㆰ","","ㆱ","","ㆲ","","ㆭ","","勺","","廿","","工","","万","","兀","");
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

	myKiuBpm=myKiuBpm.replace(/([])([])(ˊ|z)/gi,'$1́$2');
	myKiuBpm=myKiuBpm.replace(/([])([])(ˇ|v)/gi,'$1̌$2');
	myKiuBpm=myKiuBpm.replace(/([])([])(ˋ|s)/gi,'$1̀$2');
	myKiuBpm=myKiuBpm.replace(/([])([])(ˆ|x|\^)/gi,'$1̂$2');
	myKiuBpm=myKiuBpm.replace(/([])([])(⁺|f|\+)/gi,'$1̄$2');

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










var myVar="";

myVar +=" <form name=\"myform\"> "; 
myVar +=" <center> "; 
myVar +=" <textarea id=\"myidKiu\" name=\"myidKiu\" onkeyup=\"this.value = this.value.slice(0, 1000000)\" rows=\"8\"><\/textarea> "; 
myVar +=" <br> "; 
myVar +=" <input onclick=\"javascript:this.form.myidKiu.value='';this.form.myidKiu.focus()\" type=\"button\" value=\"↑ 清除\"> "; 
myVar +=" <input onclick=\"Goix(this.form)\" type=\"button\" value=\"本音轉變音\"> ";
myVar +=" <input onclick=\"Copy(this.form)\" type=\"button\" value=\"複製↓\"> ";
myVar +=" <br> "; 
myVar +=" <textarea id=\"myidXin\" name=\"myidXin\" rows=\"8\"><\/textarea> "; 
myVar +=" <br> "; 
myVar +=" <input onclick=\"Goix_BpmB2S(this.form)\" type=\"button\" value=\"" +btnB2S +   "\"> ";
myVar +=" <input onclick=\"Goix_BpmS2B(this.form)\" type=\"button\" value=\"" +btnS2B + "\"> "; 
myVar +=" <input onclick=\"Goix_ToneB2U(this.form)\" type=\"button\" value=\"" +btnB2U +   "\"> ";
myVar +=" <input onclick=\"Goix_ToneU2B(this.form)\" type=\"button\" value=\"" +btnU2B + "\"> "; 
myVar +=" <\/center> "; 
myVar +=" <\/form> ";

document.write(myVar);