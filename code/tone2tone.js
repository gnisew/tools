var myText = "本調轉變調";
var myLang ="Goix_Z";
// Goix_四海大平安SHDRZ，閩南M，馬祖福州F;

var myBtnX="↑ 清除";
var myBtnC="複製↓";
var myPs = "ps. 聲調符號 ˊ ˇ ˋ ˆ ⁺ ˈ 也可用 z v s x f l 替代。";


// ==F閩南語詞彙變調(未完成)=========================================
	function Goix_M(form) {  
	if (!document.getElementById) return;
	myXinCu=document.getElementById("myidXin");
	var myKiuCu = new String(form.myidKiu.value);

//調號卸除
	myKiuCu=myKiuCu.replace(/(ā)([aeiuomngkhy]{0,4})/gi,'af$2');
	myKiuCu=myKiuCu.replace(/(ē)([aeiuomngkhy]{0,4})/gi,'ef$2');
	myKiuCu=myKiuCu.replace(/(ī)([aeiuomngkhy]{0,4})/gi,'if$2');
	myKiuCu=myKiuCu.replace(/(ō)([aeiuomngkhy]{0,4})/gi,'of$2');
	myKiuCu=myKiuCu.replace(/(ū)([aeiuomngkhy]{0,4})/gi,'uf$2');
	myKiuCu=myKiuCu.replace(/(m̄)([aeiuomngkhy]{0,4})/gi,'mf$2');
	myKiuCu=myKiuCu.replace(/(n̄)([aeiuomngkhy]{0,4})/gi,'nf$2');
	myKiuCu=myKiuCu.replace(/(á)([aeiuomngkhy]{0,4})/gi,'az$2');
	myKiuCu=myKiuCu.replace(/(é)([aeiuomngkhy]{0,4})/gi,'ez$2');
	myKiuCu=myKiuCu.replace(/(í)([aeiuomngkhy]{0,4})/gi,'iz$2');
	myKiuCu=myKiuCu.replace(/(ó)([aeiuomngkhy]{0,4})/gi,'oz$2');
	myKiuCu=myKiuCu.replace(/(ú)([aeiuomngkhy]{0,4})/gi,'uz$2');
	myKiuCu=myKiuCu.replace(/(ḿ)([aeiuomngkhy]{0,4})/gi,'mz$2');
	myKiuCu=myKiuCu.replace(/(ń)([aeiuomngkhy]{0,4})/gi,'nz$2');
	myKiuCu=myKiuCu.replace(/(à)([aeiuomngkhy]{0,4})/gi,'as$2');
	myKiuCu=myKiuCu.replace(/(è)([aeiuomngkhy]{0,4})/gi,'es$2ss');
	myKiuCu=myKiuCu.replace(/(ì)([aeiuomngkhy]{0,4})/gi,'is$2');
	myKiuCu=myKiuCu.replace(/(ò)([aeiuomngkhy]{0,4})/gi,'os$2');
	myKiuCu=myKiuCu.replace(/(ù)([aeiuomngkhy]{0,4})/gi,'us$2');
	myKiuCu=myKiuCu.replace(/(m̀)([aeiuomngkhy]{0,4})/gi,'ms$2');
	myKiuCu=myKiuCu.replace(/(ǹ)([aeiuomngkhy]{0,4})/gi,'ns$2');
	myKiuCu=myKiuCu.replace(/(ǎ)([aeiuomngkhy]{0,4})/gi,'av$2');
	myKiuCu=myKiuCu.replace(/(ě)([aeiuomngkhy]{0,4})/gi,'ev$2');
	myKiuCu=myKiuCu.replace(/(ǐ)([aeiuomngkhy]{0,4})/gi,'iv$2');
	myKiuCu=myKiuCu.replace(/(ǒ)([aeiuomngkhy]{0,4})/gi,'ov$2');
	myKiuCu=myKiuCu.replace(/(ǔ)([aeiuomngkhy]{0,4})/gi,'uv$2');
	myKiuCu=myKiuCu.replace(/(m̌)([aeiuomngkhy]{0,4})/gi,'mv$2');
	myKiuCu=myKiuCu.replace(/(ň)([aeiuomngkhy]{0,4})/gi,'nv$2');
	myKiuCu=myKiuCu.replace(/(â)([aeiuomngkhy]{0,4})/gi,'ax$2');
	myKiuCu=myKiuCu.replace(/(ê)([aeiuomngkhy]{0,4})/gi,'ex$2');
	myKiuCu=myKiuCu.replace(/(î)([aeiuomngkhy]{0,4})/gi,'ix$2');
	myKiuCu=myKiuCu.replace(/(ô)([aeiuomngkhy]{0,4})/gi,'ox$2');
	myKiuCu=myKiuCu.replace(/(û)([aeiuomngkhy]{0,4})/gi,'ux$2');
	myKiuCu=myKiuCu.replace(/(m̂)([aeiuomngkhy]{0,4})/gi,'mx$2');
	myKiuCu=myKiuCu.replace(/(n̂)([aeiuomngkhy]{0,4})/gi,'nx$2');

	myKiuCu=myKiuCu.replace(/(a̍)([aeiuomngkhy]{0,4})/gi,'al$2');
	myKiuCu=myKiuCu.replace(/(e̍)([aeiuomngkhy]{0,4})/gi,'el$2');
	myKiuCu=myKiuCu.replace(/(i̍)([aeiuomngkhy]{0,4})/gi,'il$2');
	myKiuCu=myKiuCu.replace(/(o̍)([aeiuomngkhy]{0,4})/gi,'ol$2');
	myKiuCu=myKiuCu.replace(/(u̍)([aeiuomngkhy]{0,4})/gi,'ul$2');
	myKiuCu=myKiuCu.replace(/(m̍)([aeiuomngkhy]{0,4})/gi,'ml$2');
	myKiuCu=myKiuCu.replace(/(n̍)([aeiuomngkhy]{0,4})/gi,'nl$2');



// 調號轉字母調
	myKiuCu=myKiuCu.replace(/([a-z]{0,4})([mngbdgaeiouyptkh])(4)/gi,'$1$2z');
	myKiuCu=myKiuCu.replace(/([a-z]{0,4})([mngbdgaeiouyptkh])(7)/gi,'$1$2x');
	myKiuCu=myKiuCu.replace(/([a-z]{0,4})([mngbdgaeiouyptkh])(3)/gi,'$1$2v');
	myKiuCu=myKiuCu.replace(/([a-z]{0,4})([mngbdgaeiouyptkh])(5)/gi,'$1$2s');
	myKiuCu=myKiuCu.replace(/([a-z]{0,4})([mngbdgaeiouyptkh])(2)/gi,'$1$2f');
	myKiuCu=myKiuCu.replace(/([a-z]{0,4})([mngbdgaeiouyptkh])(1)/gi,'$1$2');
	myKiuCu=myKiuCu.replace(/([a-z]{0,4})([mngbdgaeiouyptkh])(8)/gi,'$1$2');

	myKiuCu=myKiuCu.replace(/([a-z]{0,4})([mngbdgaeiouyptkh])(ˊ)/gi,'$1$2z');
	myKiuCu=myKiuCu.replace(/([a-z]{0,4})([mngbdgaeiouyptkh])(\ˆ)/gi,'$1$2x');
	myKiuCu=myKiuCu.replace(/([a-z]{0,4})([mngbdgaeiouyptkh])(ˇ)/gi,'$1$2v');
	myKiuCu=myKiuCu.replace(/([a-z]{0,4})([mngbdgaeiouyptkh])(ˋ)/gi,'$1$2s');
	myKiuCu=myKiuCu.replace(/([a-z]{0,4})([mngbdgaeiouyptkh])(\+)/gi,'$1$2f');
	myKiuCu=myKiuCu.replace(/([a-z]{0,4})([mngbdgaeiouyptkh])(ˉ)/gi,'$1$2c');
	myKiuCu=myKiuCu.replace(/([a-z]{0,4})([mngbdgaeiouyptkh])(⁺)/gi,'$1$2f');
	myKiuCu=myKiuCu.replace(/([a-z]{0,4})([mngbdgaeiouyptkh])(\^)/gi,'$1$2x');

	myKiuCu=myKiuCu.replace(/([a-z]{0,4})([mngbdgaeiouyptkh])( ́)/gi,'$1$2z');
	myKiuCu=myKiuCu.replace(/([a-z]{0,4})([mngbdgaeiouyptkh])( ̂)/gi,'$1$2x');
	myKiuCu=myKiuCu.replace(/([a-z]{0,4})([mngbdgaeiouyptkh])( ̌)/gi,'$1$2v');
	myKiuCu=myKiuCu.replace(/([a-z]{0,4})([mngbdgaeiouyptkh])( ̀)/gi,'$1$2s');
	myKiuCu=myKiuCu.replace(/([a-z]{0,4})([mngbdgaeiouyptkh])( ̄)/gi,'$1$2c');



}
// =============================================================






// ==F馬祖福州話詞彙變調=========================================
	function Goix_F(form) {  
	if (!document.getElementById) return;
	myXinCu=document.getElementById("myidXin");
	var myKiuCu = new String(form.myidKiu.value);

//調號卸除
	myKiuCu=myKiuCu.replace(/(ā)([aeiuomngkhy]{0,4})/gi,'a$2f');
	myKiuCu=myKiuCu.replace(/(ē)([aeiuomngkhy]{0,4})/gi,'e$2f');
	myKiuCu=myKiuCu.replace(/(ī)([aeiuomngkhy]{0,4})/gi,'i$2f');
	myKiuCu=myKiuCu.replace(/(ō)([aeiuomngkhy]{0,4})/gi,'o$2f');
	myKiuCu=myKiuCu.replace(/(ū)([aeiuomngkhy]{0,4})/gi,'u$2f');
	myKiuCu=myKiuCu.replace(/(m̄)([aeiuomngkhy]{0,4})/gi,'m$2f');
	myKiuCu=myKiuCu.replace(/(n̄g)([aeiuomngkhy]{0,4})/gi,'ng$2f');
	myKiuCu=myKiuCu.replace(/(á)([aeiuomngkhy]{0,4})/gi,'a$2z');
	myKiuCu=myKiuCu.replace(/(é)([aeiuomngkhy]{0,4})/gi,'e$2z');
	myKiuCu=myKiuCu.replace(/(í)([aeiuomngkhy]{0,4})/gi,'i$2z');
	myKiuCu=myKiuCu.replace(/(ó)([aeiuomngkhy]{0,4})/gi,'o$2z');
	myKiuCu=myKiuCu.replace(/(ú)([aeiuomngkhy]{0,4})/gi,'u$2z');
	myKiuCu=myKiuCu.replace(/(ḿ)([aeiuomngkhy]{0,4})/gi,'m$2z');
	myKiuCu=myKiuCu.replace(/(ńg)([aeiuomngkhy]{0,4})/gi,'ng$2z');
	myKiuCu=myKiuCu.replace(/(à)([aeiuomngkhy]{0,4})/gi,'a$2s');
	myKiuCu=myKiuCu.replace(/(è)([aeiuomngkhy]{0,4})/gi,'e$2s');
	myKiuCu=myKiuCu.replace(/(ì)([aeiuomngkhy]{0,4})/gi,'i$2s');
	myKiuCu=myKiuCu.replace(/(ò)([aeiuomngkhy]{0,4})/gi,'o$2s');
	myKiuCu=myKiuCu.replace(/(ù)([aeiuomngkhy]{0,4})/gi,'u$2s');
	myKiuCu=myKiuCu.replace(/(m̀)([aeiuomngkhy]{0,4})/gi,'m$2s');
	myKiuCu=myKiuCu.replace(/(ǹg)([aeiuomngkhy]{0,4})/gi,'ng$2s');
	myKiuCu=myKiuCu.replace(/(ǎ)([aeiuomngkhy]{0,4})/gi,'a$2v');
	myKiuCu=myKiuCu.replace(/(ě)([aeiuomngkhy]{0,4})/gi,'e$2v');
	myKiuCu=myKiuCu.replace(/(ǐ)([aeiuomngkhy]{0,4})/gi,'i$2v');
	myKiuCu=myKiuCu.replace(/(ǒ)([aeiuomngkhy]{0,4})/gi,'o$2v');
	myKiuCu=myKiuCu.replace(/(ǔ)([aeiuomngkhy]{0,4})/gi,'u$2v');
	myKiuCu=myKiuCu.replace(/(m̌)([aeiuomngkhy]{0,4})/gi,'m$2v');
	myKiuCu=myKiuCu.replace(/(ňg)([aeiuomngkhy]{0,4})/gi,'ng$2v');
	myKiuCu=myKiuCu.replace(/(â)([aeiuomngkhy]{0,4})/gi,'a$2x');
	myKiuCu=myKiuCu.replace(/(ê)([aeiuomngkhy]{0,4})/gi,'e$2x');
	myKiuCu=myKiuCu.replace(/(î)([aeiuomngkhy]{0,4})/gi,'i$2x');
	myKiuCu=myKiuCu.replace(/(ô)([aeiuomngkhy]{0,4})/gi,'o$2x');
	myKiuCu=myKiuCu.replace(/(û)([aeiuomngkhy]{0,4})/gi,'u$2x');
	myKiuCu=myKiuCu.replace(/(m̂)([aeiuomngkhy]{0,4})/gi,'m$2x');
	myKiuCu=myKiuCu.replace(/(n̂g)([aeiuomngkhy]{0,4})/gi,'ng$2x');
	myKiuCu=myKiuCu.replace(/(ý)([aeiuomngkh]{0,4})/gi,'y$2z');
	myKiuCu=myKiuCu.replace(/(ỳ)([aeiuomngkh]{0,4})/gi,'y$2s');
	myKiuCu=myKiuCu.replace(/(y̌)([aeiuomngkh]{0,4})/gi,'y$2v');
	myKiuCu=myKiuCu.replace(/(ŷ)([aeiuomngkh]{0,4})/gi,'y$2x');
	myKiuCu=myKiuCu.replace(/(ȳ)([aeiuomngkh]{0,4})/gi,'y$2f');


// 調號轉字母調
	myKiuCu=myKiuCu.replace(/([a-z]{0,4})([mngbdgaeiouyptkh])(4)/gi,'$1$2z');
	myKiuCu=myKiuCu.replace(/([a-z]{0,4})([mngbdgaeiouyptkh])(7)/gi,'$1$2x');
	myKiuCu=myKiuCu.replace(/([a-z]{0,4})([mngbdgaeiouyptkh])(3)/gi,'$1$2v');
	myKiuCu=myKiuCu.replace(/([a-z]{0,4})([mngbdgaeiouyptkh])(5)/gi,'$1$2s');
	myKiuCu=myKiuCu.replace(/([a-z]{0,4})([mngbdgaeiouyptkh])(2)/gi,'$1$2f');
	myKiuCu=myKiuCu.replace(/([a-z]{0,4})([mngbdgaeiouyptkh])(1)/gi,'$1$2');
	myKiuCu=myKiuCu.replace(/([a-z]{0,4})([mngbdgaeiouyptkh])(8)/gi,'$1$2');

	myKiuCu=myKiuCu.replace(/([a-z]{0,4})([mngbdgaeiouyptkh])(ˊ)/gi,'$1$2z');
	myKiuCu=myKiuCu.replace(/([a-z]{0,4})([mngbdgaeiouyptkh])(\ˆ)/gi,'$1$2x');
	myKiuCu=myKiuCu.replace(/([a-z]{0,4})([mngbdgaeiouyptkh])(ˇ)/gi,'$1$2v');
	myKiuCu=myKiuCu.replace(/([a-z]{0,4})([mngbdgaeiouyptkh])(ˋ)/gi,'$1$2s');
	myKiuCu=myKiuCu.replace(/([a-z]{0,4})([mngbdgaeiouyptkh])(\+)/gi,'$1$2f');
	myKiuCu=myKiuCu.replace(/([a-z]{0,4})([mngbdgaeiouyptkh])(ˉ)/gi,'$1$2c');
	myKiuCu=myKiuCu.replace(/([a-z]{0,4})([mngbdgaeiouyptkh])(⁺)/gi,'$1$2f');
	myKiuCu=myKiuCu.replace(/([a-z]{0,4})([mngbdgaeiouyptkh])(\^)/gi,'$1$2x');

	myKiuCu=myKiuCu.replace(/([a-z]{0,4})([mngbdgaeiouyptkh])( ́)/gi,'$1$2z');
	myKiuCu=myKiuCu.replace(/([a-z]{0,4})([mngbdgaeiouyptkh])( ̂)/gi,'$1$2x');
	myKiuCu=myKiuCu.replace(/([a-z]{0,4})([mngbdgaeiouyptkh])( ̌)/gi,'$1$2v');
	myKiuCu=myKiuCu.replace(/([a-z]{0,4})([mngbdgaeiouyptkh])( ̀)/gi,'$1$2s');
	myKiuCu=myKiuCu.replace(/([a-z]{0,4})([mngbdgaeiouyptkh])( ̄)/gi,'$1$2c');


//變韻(順序不能動)
    myKiuCu=myKiuCu.replace(/(a)(ng|h|k{0,1})([vxz])(--|-| )([a-z])/gi,'e$2$3$4$5');
    myKiuCu=myKiuCu.replace(/(ei)(ng|h|k{0,1})([vxz])(--|-| )([a-z])/gi,'i$2$3$4$5');
    myKiuCu=myKiuCu.replace(/(oey)(ng|h|k{0,1})([vxz])(--|-| )([a-z])/gi,'y$2$3$4$5');
    myKiuCu=myKiuCu.replace(/(ai)(ng|h|k{0,1})([vxz])(--|-| )([a-z])/gi,'ei$2$3$4$5');
    myKiuCu=myKiuCu.replace(/(iau)(ng|h|k{0,1})([vxz])(--|-| )([a-z])/gi,'ieu$2$3$4$5');
    myKiuCu=myKiuCu.replace(/(ou)(ng|h|k{0,1})([vxz])(--|-| )([a-z])/gi,'u$2$3$4$5');
    myKiuCu=myKiuCu.replace(/(au)(ng|h|k{0,1})([vxz])(--|-| )([a-z])/gi,'ou$2$3$4$5');
    myKiuCu=myKiuCu.replace(/(o)(ng|h|k{0,1})([vxz])(--|-| )([a-z])/gi,'oe$2$3$4$5');
    myKiuCu=myKiuCu.replace(/(oy)(ng|h|k{0,1})([vxz])(--|-| )([a-z])/gi,'oey$2$3$4$5');


//變調
    myKiuCu=myKiuCu.replace(/([aeiouymg])([vxz]{0,1})(--|-| )(tsh|ts|ph|th|kh|ng|p|m|t|n|l|k|h|s{0,1})([aeiouynghk]{1,5})([s]{0,1})(\b)/gi,'$1⁺$3$4$5$6$7');
    myKiuCu=myKiuCu.replace(/(h)([vxz]{0,1})(--|-| )(tsh|ts|ph|th|kh|ng|p|m|t|n|l|k|h|s{0,1})([aeiouynghk]{1,5})([s]{0,1})(\b)/gi,'⁺$3$4$5$6$7');

    myKiuCu=myKiuCu.replace(/([aeiouymgh])([vxz]{0,1})(--|-| )(tsh|ts|ph|th|kh|ng|p|m|t|n|l|k|h|s{0,1})([aeiouynghk]{1,5})([fvxz])(\b)/gi,'$1ˋ$3$4$5$6$7');
    myKiuCu=myKiuCu.replace(/(h)([vxz]{0,1})(--|-| )(tsh|ts|ph|th|kh|ng|p|m|t|n|l|k|h|s{0,1})([aeiouynghk]{1,5})([fvxz])(\b)/gi,'ˋ$3$4$5$6$7');

    myKiuCu=myKiuCu.replace(/([aeiouymg])([f])(--|-| )(tsh|ts|ph|th|kh|ng|p|m|t|n|l|k|h|s{0,1})([aeiouynghk]{1,5})([s]{0,1})(\b)/gi,'$1ˇ$3$4$5$6$7');

    myKiuCu=myKiuCu.replace(/([aeiouymg])([f])(--|-| )(tsh|ts|ph|th|kh|ng|p|m|t|n|l|k|h|s{0,1})([aeiouyng]{1,5})(f)(\b)/gi,'$1ˊ$3$4$5$6$7');

    myKiuCu=myKiuCu.replace(/([aeiouymg])([f])(--|-| )(tsh|ts|ph|th|kh|ng|p|m|t|n|l|k|h|s{0,1})([aeiouynghk]{1,5})([vxz])(\b)/gi,'$1$3$4$5$6$7');

    myKiuCu=myKiuCu.replace(/(k)([z])(--|-| )(tsh|ts|ph|th|kh|ng|p|m|t|n|l|k|h|s{0,1})([aeiouynghk]{1,5})([s]{0,1})(\b)/gi,'hˇ$3$4$5$6$7');

    myKiuCu=myKiuCu.replace(/(k)([z])(--|-| )(tsh|ts|ph|th|kh|ng|p|m|t|n|l|k|h|s{0,1})([aeiouynghk]{1,5})(f)(\b)/gi,'hˊ$3$4$5$6$7');

    myKiuCu=myKiuCu.replace(/(k)([z])(--|-| )(tsh|ts|ph|th|kh|ng|p|m|t|n|l|k|h|s{0,1})([aeiouynghk]{1,5})([vxz])(\b)/gi,'h$3$4$5$6$7');

    myKiuCu=myKiuCu.replace(/(k)()(--|-| )(tsh|ts|ph|th|kh|ng|p|m|t|n|l|k|h|s{0,1})([aeiouynghk]{1,5})([s]{0,1})(\b)/gi,'h⁺$3$4$5$6$7');
    myKiuCu=myKiuCu.replace(/(h)()(--|-| )(tsh|ts|ph|th|kh|ng|p|m|t|n|l|k|h|s{0,1})([aeiouynghk]{1,5})([s]{0,1})(\b)/gi,'⁺$3$4$5$6$7');

    myKiuCu=myKiuCu.replace(/(h)()(--|-| )(tsh|ts|ph|th|kh|ng|p|m|t|n|l|k|h|s{0,1})([aeiouynghk]{1,5})([fvxz])(\b)/gi,'ˋ$3$4$5$6$7');

    myKiuCu=myKiuCu.replace(/(k)()(--|-| )(tsh|ts|ph|th|kh|ng|p|m|t|n|l|k|h|s{0,1})([aeiouynghk]{1,5})([fvxz])(\b)/gi,'h$3$4$5$6$7');




    myKiuCu=myKiuCu.replace(/([aeiouymg])(s)(--|-| )(tsh|ts|ph|th|kh|ng|p|m|t|n|l|k|h|s{0,1})([aeiouyng]{1,5})()(\b)/gi,'$1⁺$3$4$5$6$7');
    myKiuCu=myKiuCu.replace(/([aeiouymg])(s)(--|-| )(tsh|ts|ph|th|kh|ng|p|m|t|n|l|k|h|s{0,1})([aeiouyng]{1,5})(s)(\b)/gi,'$1ˇ$3$4$5$6$7');
    myKiuCu=myKiuCu.replace(/([aeiouymg])(s)(--|-| )(tsh|ts|ph|th|kh|ng|p|m|t|n|l|k|h|s{0,1})([hk])()(\b)/gi,'$1ˇ$3$4$5$6$7');
    myKiuCu=myKiuCu.replace(/([aeiouymg])(s)(--|-| )(tsh|ts|ph|th|kh|ng|p|m|t|n|l|k|h|s{0,1})([aeiouyng]{1,5})(f)(\b)/gi,'$1⁺$3$4$5$6$7');
    myKiuCu=myKiuCu.replace(/([aeiouymg])(s)(--|-| )(tsh|ts|ph|th|kh|ng|p|m|t|n|l|k|h|s{0,1})([aeiouynghk]{1,5})([vxz])(\b)/gi,'$1ˇ$3$4$5$6$7');


//變聲
	myKiuCu=myKiuCu.replace(/([aeiouy])([ˊˇˋˆ⁺ˉ]{0,1})(--|-| )(ph|p)/gi,'$1$2$3b');
	myKiuCu=myKiuCu.replace(/([aeiouy])([ˊˇˋˆ⁺ˉ]{0,1})(--|-| )(tsh|ts)/gi,'$1$2$3j');
	myKiuCu=myKiuCu.replace(/([aeiouy])([ˊˇˋˆ⁺ˉ]{0,1})(--|-| )(th|t|s)/gi,'$1$2$3l');
	myKiuCu=myKiuCu.replace(/([aeiouy])([ˊˇˋˆ⁺ˉ]{0,1})(--|-| )(n)([aeiouy])/gi,'$1$2$3l$5');
	myKiuCu=myKiuCu.replace(/([aeiouy])([ˊˇˋˆ⁺ˉ]{0,1})(--|-| )(kh|k|h)/gi,'$1$2$3');


	myKiuCu=myKiuCu.replace(/(ng)([ˊˇˋˆ⁺ˉ]{0,1})(--|-| )(ph|p)/gi,'$1$2$3m');
	myKiuCu=myKiuCu.replace(/(ng)([ˊˇˋˆ⁺ˉ]{0,1})(--|-| )(tsh|ts)/gi,'$1$2$3j');
	myKiuCu=myKiuCu.replace(/(ng)([ˊˇˋˆ⁺ˉ]{0,1})(--|-| )(th|t|s|l)/gi,'$1$2$3n');
	myKiuCu=myKiuCu.replace(/(ng)([ˊˇˋˆ⁺ˉ]{0,1})(--|-| )(kh|k|h)/gi,'$1$2$3ng');
	myKiuCu=myKiuCu.replace(/(ng)([ˊˇˋˆ⁺ˉ]{0,1})(--|-| )([aeiouy])/gi,'$1$2$3ng$4');

//

	myKiuCu=myKiuCu.replace(/([aeiouy])([zvsxfc]{0,1})(--|-| )(ph|p)/gi,'$1$2$3b');
	myKiuCu=myKiuCu.replace(/([aeiouy])([zvsxfc]{0,1})(--|-| )(tsh|ts)/gi,'$1$2$3j');
	myKiuCu=myKiuCu.replace(/([aeiouy])([zvsxfc]{0,1})(--|-| )(th|t|s)/gi,'$1$2$3l');
	myKiuCu=myKiuCu.replace(/([aeiouy])([zvsxfc]{0,1})(--|-| )(n)([aeiouy])/gi,'$1$2$3l$5');
	myKiuCu=myKiuCu.replace(/([aeiouy])([zvsxfc]{0,1})(--|-| )(kh|k|h)/gi,'$1$2$3');


	myKiuCu=myKiuCu.replace(/(ng)([zvsxfc]{0,1})(--|-| )(ph|p)/gi,'$1$2$3m');
	myKiuCu=myKiuCu.replace(/(ng)([zvsxfc]{0,1})(--|-| )(tsh|ts)/gi,'$1$2$3j');
	myKiuCu=myKiuCu.replace(/(ng)([zvsxfc]{0,1})(--|-| )(th|t|s|l)/gi,'$1$2$3n');
	myKiuCu=myKiuCu.replace(/(ng)([zvsxfc]{0,1})(--|-| )(kh|k|h)/gi,'$1$2$3ng');

// 字母調轉調號
	myKiuCu=myKiuCu.replace(/([a-z]{0,4})([mngbdgaeiouyptkh])(z)(\b)/gi,'$1$2ˊ$4');
	myKiuCu=myKiuCu.replace(/([a-z]{0,4})([mngbdgaeiouyptkh])(x)(\b)/gi,'$1$2ˆ$4');
	myKiuCu=myKiuCu.replace(/([a-z]{0,4})([mngbdgaeiouyptkh])(v)(\b)/gi,'$1$2ˇ$4');
	myKiuCu=myKiuCu.replace(/([a-z]{0,4})([mngbdgaeiouyptkh])(s)(\b)/gi,'$1$2ˋ$4');
	myKiuCu=myKiuCu.replace(/([a-z]{0,4})([mngbdgaeiouyptkh])(f)(\b)/gi,'$1$2⁺$4');
	myKiuCu=myKiuCu.replace(/([a-z]{0,4})([mngbdgaeiouyptkh])(c)(\b)/gi,'$1$2ˉ$4');

	myXinCu.value = myKiuCu;
	}
// ===========================================================;







// ==S四縣客語詞彙變調=========================================;
	function Goix_S(form) {  
	if (!document.getElementById) return;
	myXinCu=document.getElementById("myidXin");
	var myKiuCu = new String(form.myidKiu.value);

// 調號轉字母調;
	myKiuCu=myKiuCu.replace(/([a-z]{0,4})([mngbdgaeiou])(ˊ)/gi,'$1$2z');
	myKiuCu=myKiuCu.replace(/([a-z]{0,4})([mngbdgaeiou])(ˇ)/gi,'$1$2v');
	myKiuCu=myKiuCu.replace(/([a-z]{0,4})([mngbdgaeiou])(ˋ)/gi,'$1$2s');
	myKiuCu=myKiuCu.replace(/([a-z]{0,4})([mngbdgaeiou])(ˉ)/gi,'$1$2c');

	myKiuCu=myKiuCu.replace(/([a-z]{0,4})([mngbdgaeiou])( ́)/gi,'$1$2z');
	myKiuCu=myKiuCu.replace(/([a-z]{0,4})([mngbdgaeiou])( ̌)/gi,'$1$2v');
	myKiuCu=myKiuCu.replace(/([a-z]{0,4})([mngbdgaeiou])( ̀)/gi,'$1$2s');
	myKiuCu=myKiuCu.replace(/([a-z]{0,4})([mngbdgaeiou])( ̄)/gi,'$1$2c');

// 四字變調;
	//用分隔成x-xx-x;
    myKiuCu=myKiuCu.replace(/([a-z])(-|_| )([a-z])(-|_| )([a-z])(-|_| )([a-z])(\b)/gi,'$1$2$3$4$5$6$7$8');

// 三疊字z不變調;
    myKiuCu=myKiuCu.replace(/([a-z]{1,6})(z)(-|_| )(\1)(z)(-|_| )(\1)(z)(\b)/gi,'$1ˊ$3$4ˊ$6$7ˊ$9');
// 三疊字v變調;
    myKiuCu=myKiuCu.replace(/([a-z]{1,6})(v)(-|_| )(\1)(v)(-|_| )(\1)(v)(\b)/gi,'$1ˊ$3$4$5$6$7$8$9');
// z二字變調;
    myKiuCu=myKiuCu.replace(/([aeiouymng])(z)(-|_| )(zh|ch|sh|rh|ng|b|p|m|f|v|d|t|n|l|g|k|h|z|c|s|j|q|x|r{0,1})([aeioumngbd]{1,5})([z]{0,1})(\b)/gi,'$1ˇ$3$4$5$6$7');

// e變調;
    myKiuCu=myKiuCu.replace(/([aeiouymngbd])(s)(-|_| )()(e)(s)(\b)/gi,'$1$2$3$4$5ˇ$7');

// 字母調轉調號;
	myKiuCu=myKiuCu.replace(/([a-z]{0,4})([mngbdgaeiou])(z)(\b)/gi,'$1$2ˊ$4');
	myKiuCu=myKiuCu.replace(/([a-z]{0,4})([mngbdgaeiou])(x)(\b)/gi,'$1$2ˆ$4');
	myKiuCu=myKiuCu.replace(/([a-z]{0,4})([mngbdgaeiou])(v)(\b)/gi,'$1$2ˇ$4');
	myKiuCu=myKiuCu.replace(/([a-z]{0,4})([mngbdgaeiou])(s)(\b)/gi,'$1$2ˋ$4');
	myKiuCu=myKiuCu.replace(/([a-z]{0,4})([mngbdgaeiou])(f)(\b)/gi,'$1$2⁺$4');
	myXinCu.value = myKiuCu;
}
//=============================================================;



// ==H海陸客語詞彙變調=========================================;
	function Goix_H(form) {  
	if (!document.getElementById) return;
	myXinCu=document.getElementById("myidXin");
	var myKiuCu = new String(form.myidKiu.value);

// 調號轉字母調;
	myKiuCu=myKiuCu.replace(/([a-z]{0,4})([mngbdgaeiour])(ˊ)/gi,'$1$2z');
	myKiuCu=myKiuCu.replace(/([a-z]{0,4})([mngbdgaeiour])(ˇ)/gi,'$1$2v');
	myKiuCu=myKiuCu.replace(/([a-z]{0,4})([mngbdgaeiour])(ˋ)/gi,'$1$2s');
	myKiuCu=myKiuCu.replace(/([a-z]{0,4})([mngbdgaeiour])(\+)/gi,'$1$2f');
	myKiuCu=myKiuCu.replace(/([a-z]{0,4})([mngbdgaeiour])(⁺)/gi,'$1$2f');

	myKiuCu=myKiuCu.replace(/([a-z]{0,4})([mngbdgaeiour])( ́)/gi,'$1$2z');
	myKiuCu=myKiuCu.replace(/([a-z]{0,4})([mngbdgaeiour])( ̌)/gi,'$1$2v');
	myKiuCu=myKiuCu.replace(/([a-z]{0,4})([mngbdgaeiour])( ̀)/gi,'$1$2s');

// 四字變調;
	//用分隔成x-xx-x;
    myKiuCu=myKiuCu.replace(/([a-z])(-|_| )([a-z])(-|_| )([a-z])(-|_| )([a-z])(\b)/gi,'$1$2$3$4$5$6$7$8');

// 三疊字z不變調;
    myKiuCu=myKiuCu.replace(/([a-z]{1,6})(z)(-|_| )(\1)(z)(-|_| )(\1)(z)(\b)/gi,'$1ˊ$3$4ˊ$6$7ˊ$9');
// 三疊字vsfc變調;
    myKiuCu=myKiuCu.replace(/([a-z]{1,6})([vsf]{0,1})(-|_| )(\1)(\2)(-|_| )(\1)(\2)(\b)/gi,'$1ˊ$3$4$5$6$7$8$9');


// 二字變調;
    myKiuCu=myKiuCu.replace(/([aeiouymng])(z)(-|_| )(zh|ch|sh|rh|ng|b|p|m|f|v|d|t|n|l|g|k|h|z|c|s|j|q|x|r{0,1})([aeioumngbdr]{1,5})([zvsf]{0,1})(\b)/gi,'$1$3$4$5$6$7');
    myKiuCu=myKiuCu.replace(/([aeiou])([bdg])(-|_| )(zh|ch|sh|rh|ng|b|p|m|f|v|d|t|n|l|g|k|h|z|c|s|j|q|x|r{0,1})([aeioumngbdr]{1,5})([zvsf]{0,1})(\b)/gi,'$1$2ˋ$3$4$5$6$7');

// 移除;
	myKiuCu=myKiuCu.replace(//gi,'');
// 字母調轉調號;
	myKiuCu=myKiuCu.replace(/([a-z]{0,4})([mngbdgaeiour])(z)(\b)/gi,'$1$2ˊ$4');
	myKiuCu=myKiuCu.replace(/([a-z]{0,4})([mngbdgaeiour])(x)(\b)/gi,'$1$2ˆ$4');
	myKiuCu=myKiuCu.replace(/([a-z]{0,4})([mngbdgaeiour])(v)(\b)/gi,'$1$2ˇ$4');
	myKiuCu=myKiuCu.replace(/([a-z]{0,4})([mngbdgaeiour])(s)(\b)/gi,'$1$2ˋ$4');
	myKiuCu=myKiuCu.replace(/([a-z]{0,4})([mngbdgaeiour])(f)(\b)/gi,'$1$2⁺$4');
	myXinCu.value = myKiuCu;
}
//=============================================================;




// ==D大埔客語詞彙變調=========================================;
	function Goix_D(form) {  
	if (!document.getElementById) return;
	myXinCu=document.getElementById("myidXin");
	var myKiuCu = new String(form.myidKiu.value);

// 調號轉字母調;
	myKiuCu=myKiuCu.replace(/([a-z]{0,4})([mngbdgaeiour])(ˊ)/gi,'$1$2z');
	myKiuCu=myKiuCu.replace(/([a-z]{0,4})([mngbdgaeiour])(\ˆ)/gi,'$1$2x');
	myKiuCu=myKiuCu.replace(/([a-z]{0,4})([mngbdgaeiour])(ˇ)/gi,'$1$2v');
	myKiuCu=myKiuCu.replace(/([a-z]{0,4})([mngbdgaeiour])(ˋ)/gi,'$1$2s');
	myKiuCu=myKiuCu.replace(/([a-z]{0,4})([mngbdgaeiour])(\+)/gi,'$1$2f');
	myKiuCu=myKiuCu.replace(/([a-z]{0,4})([mngbdgaeiour])(⁺)/gi,'$1$2f');
	myKiuCu=myKiuCu.replace(/([a-z]{0,4})([mngbdgaeiour])(\^)/gi,'$1$2x');

	myKiuCu=myKiuCu.replace(/([a-z]{0,4})([mngbdgaeiour])( ́)/gi,'$1$2z');
	myKiuCu=myKiuCu.replace(/([a-z]{0,4})([mngbdgaeiour])( ̂)/gi,'$1$2x');
	myKiuCu=myKiuCu.replace(/([a-z]{0,4})([mngbdgaeiour])( ̌)/gi,'$1$2v');
	myKiuCu=myKiuCu.replace(/([a-z]{0,4})([mngbdgaeiour])( ̀)/gi,'$1$2s');

// 四字變調;
	//用分隔成x-xx-x;
    myKiuCu=myKiuCu.replace(/([a-z])(-|_| )([a-z])(-|_| )([a-z])(-|_| )([a-z])(\b)/gi,'$1$2$3$4$5$6$7$8');

// 三疊字vsfc變調;
    myKiuCu=myKiuCu.replace(/([a-z]{1,6})([vxsf])(-|_| )(\1)([fs])(-|_| )(\1)(\2)(\b)/gi,'$1ˊ$3$4ˇ$6$7$8$9');
    myKiuCu=myKiuCu.replace(/([a-z]{1,6})([vxsf])(-|_| )(\1)([v])(-|_| )(\1)(\2)(\b)/gi,'$1ˊ$3$4⁺$6$7$8$9');

// 二字變調;
    myKiuCu=myKiuCu.replace(/([aeiouymng])(f)(-|_| )(zh|ch|sh|rh|ng|b|p|m|f|v|d|t|n|l|g|k|h|z|c|s|j|q|x|r{0,1})([aeioumngbdr]{1,5})([vx])(\b)/gi,'$1ˊ$3$4$5$6$7');
    myKiuCu=myKiuCu.replace(/([aeiouymng])(v)(-|_| )(zh|ch|sh|rh|ng|b|p|m|f|v|d|t|n|l|g|k|h|z|c|s|j|q|x|r{0,1})([aeioumngr]{1,5})([v])(\b)/gi,'$1⁺$3$4$5$6$7');
    myKiuCu=myKiuCu.replace(/([aeiouymng])(s)(-|_| )(zh|ch|sh|rh|ng|b|p|m|f|v|d|t|n|l|g|k|h|z|c|s|j|q|x|r{0,1})([aeioumngbdr]{1,5})([xs])(\b)/gi,'$1$3$4$5$6$7');

// 移除;
	myKiuCu=myKiuCu.replace(//gi,'');
// 字母調轉調號;
	myKiuCu=myKiuCu.replace(/([a-z]{0,4})([mngbdgaeiour])(z)(\b)/gi,'$1$2ˊ$4');
	myKiuCu=myKiuCu.replace(/([a-z]{0,4})([mngbdgaeiour])(x)(\b)/gi,'$1$2ˆ$4');
	myKiuCu=myKiuCu.replace(/([a-z]{0,4})([mngbdgaeiour])(v)(\b)/gi,'$1$2ˇ$4');
	myKiuCu=myKiuCu.replace(/([a-z]{0,4})([mngbdgaeiour])(s)(\b)/gi,'$1$2ˋ$4');
	myKiuCu=myKiuCu.replace(/([a-z]{0,4})([mngbdgaeiour])(f)(\b)/gi,'$1$2⁺$4');
	myXinCu.value = myKiuCu;
}
//=============================================================;




// ==R饒平客語詞彙變調=========================================;
	function Goix_R(form) {  
	if (!document.getElementById) return;
	myXinCu=document.getElementById("myidXin");
	var myKiuCu = new String(form.myidKiu.value);

// 調號轉字母調;
	myKiuCu=myKiuCu.replace(/([a-z]{0,4})([mngbdgaeiour])(ˊ)/gi,'$1$2z');
	myKiuCu=myKiuCu.replace(/([a-z]{0,4})([mngbdgaeiour])(\ˆ)/gi,'$1$2x');
	myKiuCu=myKiuCu.replace(/([a-z]{0,4})([mngbdgaeiour])(ˇ)/gi,'$1$2v');
	myKiuCu=myKiuCu.replace(/([a-z]{0,4})([mngbdgaeiour])(ˋ)/gi,'$1$2s');
	myKiuCu=myKiuCu.replace(/([a-z]{0,4})([mngbdgaeiour])(\+)/gi,'$1$2f');
	myKiuCu=myKiuCu.replace(/([a-z]{0,4})([mngbdgaeiour])(⁺)/gi,'$1$2f');
	myKiuCu=myKiuCu.replace(/([a-z]{0,4})([mngbdgaeiour])(\^)/gi,'$1$2x');

	myKiuCu=myKiuCu.replace(/([a-z]{0,4})([mngbdgaeiour])( ́)/gi,'$1$2z');
	myKiuCu=myKiuCu.replace(/([a-z]{0,4})([mngbdgaeiour])( ̂)/gi,'$1$2x');
	myKiuCu=myKiuCu.replace(/([a-z]{0,4})([mngbdgaeiour])( ̌)/gi,'$1$2v');
	myKiuCu=myKiuCu.replace(/([a-z]{0,4})([mngbdgaeiour])( ̀)/gi,'$1$2s');

// 四字變調;
	//用分隔成x-xx-x;
    myKiuCu=myKiuCu.replace(/([a-z])(-|_| )([a-z])(-|_| )([a-z])(-|_| )([a-z])(\b)/gi,'$1$2$3$4$5$6$7$8');


// 二字變調;
    myKiuCu=myKiuCu.replace(/([aeiouymng])()(-|_| )(zh|ch|sh|rh|ng|b|p|m|f|v|d|t|n|l|g|k|h|z|c|s|j|q|x|r{0,1})([aeioumngbdr]{1,5})([vs])(\b)/gi,'$1ˋ$3$4$5$6$7');
    myKiuCu=myKiuCu.replace(/([aeiouymng])()(-|_| )(zh|ch|sh|rh|ng|b|p|m|f|v|d|t|n|l|g|k|h|z|c|s|j|q|x|r{0,1})([aeioumngbdr]{1,5})([z]{0,1})(\b)/gi,'$1⁺$3$4$5$6$7');

    myKiuCu=myKiuCu.replace(/([aeiouymng])(s)(-|_| )(zh|ch|sh|rh|ng|b|p|m|f|v|d|t|n|l|g|k|h|z|c|s|j|q|x|r{0,1})(ng|a|e|i|o|u|m|n|r{1,5})([vs])(\b)/gi,'$1⁺$3$4$5$6$7');
    myKiuCu=myKiuCu.replace(/([aeiouymng])(s)(-|_| )(zh|ch|sh|rh|ng|b|p|m|f|v|d|t|n|l|g|k|h|z|c|s|j|q|x|r{0,1})([aeioumngbdrr]{1,5})([zs]{0,1})(\b)/gi,'$1ˇ$3$4$5$6$7');

    myKiuCu=myKiuCu.replace(/([aeiouymng])(z)(-|_| )(zh|ch|sh|rh|ng|b|p|m|f|v|d|t|n|l|g|k|h|z|c|s|j|q|x|r{0,1})([aeioumngbdr]{1,5})([zvs]{0,1})(\b)/gi,'$1⁺$3$4$5$6$7');

    myKiuCu=myKiuCu.replace(/(ag|eg|ig|og|ug|b|d)(s)(-|_| )(zh|ch|sh|rh|ng|b|p|m|f|v|d|t|n|l|g|k|h|z|c|s|j|q|x|r{0,1})([aeioumngbdr]{1,5})([zvs]{0,1})(\b)/gi,'$1$3$4$5$6$7');
	
// 移除;
	myKiuCu=myKiuCu.replace(//gi,'');
// 字母調轉調號;
	myKiuCu=myKiuCu.replace(/([a-z]{0,4})([mngbdgaeiour])(z)(\b)/gi,'$1$2ˊ$4');
	myKiuCu=myKiuCu.replace(/([a-z]{0,4})([mngbdgaeiour])(x)(\b)/gi,'$1$2ˆ$4');
	myKiuCu=myKiuCu.replace(/([a-z]{0,4})([mngbdgaeiour])(v)(\b)/gi,'$1$2ˇ$4');
	myKiuCu=myKiuCu.replace(/([a-z]{0,4})([mngbdgaeiour])(s)(\b)/gi,'$1$2ˋ$4');
	myKiuCu=myKiuCu.replace(/([a-z]{0,4})([mngbdgaeiour])(f)(\b)/gi,'$1$2⁺$4');
	myXinCu.value = myKiuCu;
}
//=============================================================;
















// ==Z詔安客語詞彙變調=========================================;
	function Goix_Z(form) {  
	if (!document.getElementById) return;
	myXinCu=document.getElementById("myidXin");
	var myKiuCu = new String(form.myidKiu.value);

// 調號轉字母調;
	myKiuCu=myKiuCu.replace(/([a-z]{0,4})([mngbdgaeiou])(ˊ)/gi,'$1$2z');
	myKiuCu=myKiuCu.replace(/([a-z]{0,4})([mngbdgaeiou])(\ˆ)/gi,'$1$2x');
	myKiuCu=myKiuCu.replace(/([a-z]{0,4})([mngbdgaeiou])(ˇ)/gi,'$1$2v');
	myKiuCu=myKiuCu.replace(/([a-z]{0,4})([mngbdgaeiou])(ˋ)/gi,'$1$2s');
	myKiuCu=myKiuCu.replace(/([a-z]{0,4})([mngbdgaeiou])(\+)/gi,'$1$2f');
	myKiuCu=myKiuCu.replace(/([a-z]{0,4})([mngbdgaeiou])(ˉ)/gi,'$1$2c');
	myKiuCu=myKiuCu.replace(/([a-z]{0,4})([mngbdgaeiou])(⁺)/gi,'$1$2f');
	myKiuCu=myKiuCu.replace(/([a-z]{0,4})([mngbdgaeiou])(\^)/gi,'$1$2x');

	myKiuCu=myKiuCu.replace(/([a-z]{0,4})([mngbdgaeiou])( ́)/gi,'$1$2z');
	myKiuCu=myKiuCu.replace(/([a-z]{0,4})([mngbdgaeiou])( ̂)/gi,'$1$2x');
	myKiuCu=myKiuCu.replace(/([a-z]{0,4})([mngbdgaeiou])( ̌)/gi,'$1$2v');
	myKiuCu=myKiuCu.replace(/([a-z]{0,4})([mngbdgaeiou])( ̀)/gi,'$1$2s');
	myKiuCu=myKiuCu.replace(/([a-z]{0,4})([mngbdgaeiou])( ̄)/gi,'$1$2c');

// 四字變調;
	//x-x-x-x 用分隔成x-xx-x;
    myKiuCu=myKiuCu.replace(/([aeiouymng])(x)(-|_| )(zh|ch|sh|rh|ng|b|p|m|f|v|d|t|n|l|g|k|h|z|c|s|j|q|x|r{0,1})([aeiouymng]{1,5})(x)(-|_| )(zh|ch|sh|rh|ng|b|p|m|f|v|d|t|n|l|g|k|h|z|c|s|j|q|x|r{0,1})([aeiouymng]{1,5})(x)(-|_| )(zh|ch|sh|rh|ng|b|p|m|f|v|d|t|n|l|g|k|h|z|c|s|j|q|x|r{0,1})([aeiouymng]{1,5})(x)(\b)/gi,'$1$2$3$4$5$6$7$8$9$10$11$12$13$14$15');
	//w-x-x-x 用分隔成w-xx-x;
    myKiuCu=myKiuCu.replace(/([aeiouymng])([zvs]{0,1})(-|_| )(zh|ch|sh|rh|ng|b|p|m|f|v|d|t|n|l|g|k|h|z|c|s|j|q|x|r{0,1})([aeiouymng]{1,5})(x)(-|_| )(zh|ch|sh|rh|ng|b|p|m|f|v|d|t|n|l|g|k|h|z|c|s|j|q|x|r{0,1})([aeiouymng]{1,5})(x)(-|_| )(zh|ch|sh|rh|ng|b|p|m|f|v|d|t|n|l|g|k|h|z|c|s|j|q|x|r{0,1})([aeiouymng]{1,5})(x)(\b)/gi,'$1$2$3$4$5$6$7$8$9$10$11$12$13$14$15');
	//x-x-x-w 用分隔成x-xx-w;
    myKiuCu=myKiuCu.replace(/([aeiouymng])(x)(-|_| )(zh|ch|sh|rh|ng|b|p|m|f|v|d|t|n|l|g|k|h|z|c|s|j|q|x|r{0,1})([aeiouymng]{1,5})(x)(-|_| )(zh|ch|sh|rh|ng|b|p|m|f|v|d|t|n|l|g|k|h|z|c|s|j|q|x|r{0,1})([aeiouymng]{1,5})(x)(-|_| )(zh|ch|sh|rh|ng|b|p|m|f|v|d|t|n|l|g|k|h|z|c|s|j|q|x|r{0,1})([aeiouymng]{1,5})([zvs]{0,1})(\b)/gi,'$1$2$3$4$5$6$7$8$9$10$11$12$13$14$15');

	//w-x-x-w 用分隔成w-xx-w;
    myKiuCu=myKiuCu.replace(/([aeiouymng])([zvs]{0,1})(-|_| )(zh|ch|sh|rh|ng|b|p|m|f|v|d|t|n|l|g|k|h|z|c|s|j|q|x|r{0,1})([aeiouymng]{1,5})(x)(-|_| )(zh|ch|sh|rh|ng|b|p|m|f|v|d|t|n|l|g|k|h|z|c|s|j|q|x|r{0,1})([aeiouymng]{1,5})(x)(-|_| )(zh|ch|sh|rh|ng|b|p|m|f|v|d|t|n|l|g|k|h|z|c|s|j|q|x|r{0,1})([aeiouymng]{1,5})([zvs]{0,1})(\b)/gi,'$1$2$3$4$5$6$7$8$9$10$11$12$13$14$15');

// 三疊字vsfc變調;
    myKiuCu=myKiuCu.replace(/([a-z]{1,6})([zvsx])(-|_| )(\1)(\2)(-|_| )(\1)(\2)(\b)/gi,'$1$3$4⁺$6$7$8$9');
    myKiuCu=myKiuCu.replace(/([a-z]{1,6})()(-|_| )(\1)(\2)(-|_| )(\1)(\2)(\b)/gi,'$1$3$4⁺$6$7$8$9');

// 三字變調 x-x-x;
	//x-x-x;
    myKiuCu=myKiuCu.replace(/([aeiouymng])(x)(-|_| )(zh|ch|sh|rh|ng|b|p|m|f|v|d|t|n|l|g|k|h|z|c|s|j|q|x|r{0,1})([aeiouymng]{1,5})(x)(-|_| )(zh|ch|sh|rh|ng|b|p|m|f|v|d|t|n|l|g|k|h|z|c|s|j|q|x|r{0,1})([aeiouymng]{1,5})(x)(\b)/gi,'$1ˇ$3$4$5$7$8$9$10$11');

// 再處理輕聲;
	myKiuCu=myKiuCu.replace(/([aeiouymng])([zvsx]{0,1})(--|-|_| )(go)(x)(-|_| )(loi)(s)(\b)/gi,'$1$2$3$4ˆ$6$7ˇ$9');
	myKiuCu=myKiuCu.replace(/([aeiouymng])([zvsx]{0,1})(--|-|_| )(go)(x)(-|_| )(kui)(x)(\b)/gi,'$1$2$3$4ˆ$6$7ˇ$9');

	myKiuCu=myKiuCu.replace(/([aeiouymng])([zvsx]{0,1})(--|-|_| )(ki)(x)(-|_| )(loi)(s)(\b)/gi,'$1$2$3$4ˆ$6$7ˇ$9');
	myKiuCu=myKiuCu.replace(/([aeiouymng])([zvsx]{0,1})(--|-|_| )(ki)(x)(-|_| )(kui)(x)(\b)/gi,'$1$2$3$4ˆ$6$7ˇ$9');

	myKiuCu=myKiuCu.replace(/([aeiouymng])([zvsx]{0,1})(--|-|_| )(ngib)(s)(-|_| )(loi)(s)(\b)/gi,'$1$2$3$4⁺$6$7ˇ$9');
	myKiuCu=myKiuCu.replace(/([aeiouymng])([zvsx]{0,1})(--|-|_| )(ngib)(s)(-|_| )(kui)(x)(\b)/gi,'$1$2$3$4⁺$6$7ˇ$9');

	myKiuCu=myKiuCu.replace(/([aeiouymng])([zvsx]{0,1})(--|-|_| )(chid)(z)(-|_| )(loi)(s)(\b)/gi,'$1$2$3$4ˊ$6$7ˇ$9');
	myKiuCu=myKiuCu.replace(/([aeiouymng])([zvsx]{0,1})(--|-|_| )(chid)(z)(-|_| )(kui)(x)(\b)/gi,'$1$2$3$4ˊ$6$7ˇ$9');

	myKiuCu=myKiuCu.replace(/([aeiouymng])([zvsx]{0,1})(--|-|_| )(loo|lo)()(-|_| )(loi)(s)(\b)/gi,'$1$2$3$4⁺$6$7ˇ$9');
	myKiuCu=myKiuCu.replace(/([aeiouymng])([zvsx]{0,1})(--|-|_| )(loo|lo)()(-|_| )(kui)(x)(\b)/gi,'$1$2$3$4⁺$6$7ˇ$9');

	myKiuCu=myKiuCu.replace(/([aeiouymng])([zvsx]{0,1})(--|-|_| )(rhid|rid)(z)(-|_| )(ha)()(\b)/gi,'$1$2$3$4⁺$6$7⁺$9');
	myKiuCu=myKiuCu.replace(/([aeiouymng])([zvsx]{0,1})(--|-|_| )(rhid|rid)(z)(-|_| )(baix)()(\b)/gi,'$1$2$3$4⁺$6$7$8$9');
	myKiuCu=myKiuCu.replace(/([aeiouymng])([zvsx]{0,1})(--|-|_| )(rhid|rid)(z)(-|_| )(fue)(s)(\b)/gi,'$1$2$3$4⁺$6$7ˆ$9');


// 二字輕聲--;
	myKiuCu=myKiuCu.replace(/([aeiouymng])([zvsx]{0,1})(--)(loo|lo)()(\b)/gi,'$1$2$3$4⁺$6');
	myKiuCu=myKiuCu.replace(/([aeiouymng])([zvsx]{0,1})(--)(choo|cho)()(\b)/gi,'$1$2$3$4⁺$6');
	myKiuCu=myKiuCu.replace(/([aeiouymng])([zvsx]{0,1})(--)(loi)(s)(\b)/gi,'$1$2$3$4ˇ$6');
	myKiuCu=myKiuCu.replace(/([aeiouymng])([zvsx]{0,1})(--)(ngib)(s)(\b)/gi,'$1$2$3$4⁺$6');
	myKiuCu=myKiuCu.replace(/([aeiouymng])([zvsx]{0,1})(--)(kui)(x)(\b)/gi,'$1$2$3$4ˇ$6');
// 人變調
	myKiuCu=myKiuCu.replace(/(ngai|hen|gui)(s)(--|-| )(ngin)(s)(\b)/gi,'$1$2$3$4⁺$6');
	myKiuCu=myKiuCu.replace(/(een)(v)(--|-| )(ngin)(s)(\b)/gi,'$1$2$3$4⁺$6');

// 月份變調;
    //c-zvsx;
    myKiuCu=myKiuCu.replace(/(zhangx|beedz|samv|rhidz|liuz|cidz|qidz|giux|shibs|ridz|xix|ngi|six|mx)(--|-|_| )(ngied)(s)(\b)/gi,'$1$2$3ˇ$5');

// 二疊字變調;
    myKiuCu=myKiuCu.replace(/([a-z]{1,6})([zvsx])(-|_| )(\1)(\2)(\b)/gi,'$1$3$4$5$6');
    myKiuCu=myKiuCu.replace(/([a-z]{1,6})()(-|_| )(\1)(\2)(\b)/gi,'$1$3$4$5$6');

// 二字變調;
    //c-zvsx;
    myKiuCu=myKiuCu.replace(/([aeiouymng])()(-|_| )(zh|ch|sh|rh|ng|b|p|m|f|v|d|t|n|l|g|k|h|z|c|s|j|q|x|r{0,1})([aeiouymng]{1,5})([zvxs]{0,1})(\b)/gi,'$1⁺$3$4$5$6$7');
	//x-zvs;
    myKiuCu=myKiuCu.replace(/([aeiouymng])(x)(-|_| )(zh|ch|sh|rh|ng|b|p|m|f|v|d|t|n|l|g|k|h|z|c|s|j|q|x|r{0,1})([aeiouymngbd]{1,5})([zvs]{0,1})(\b)/gi,'$1ˇ$3$4$5$6$7');
	//x-x;
    myKiuCu=myKiuCu.replace(/([aeiouymng])(x)(-|_| )(zh|ch|sh|rh|ng|b|p|m|f|v|d|t|n|l|g|k|h|z|c|s|j|q|x|r{0,1})([aeiouymng]{1,5})(x)(\b)/gi,'$1$3$4$5$6$7');
	//z-zvsx;
    myKiuCu=myKiuCu.replace(/([aeiouymngbd])(z)(-|_| )(zh|ch|sh|rh|ng|b|p|m|f|v|d|t|n|l|g|k|h|z|c|s|j|q|x|r{0,1})([aeiouymng]{1,5})([zvxs]{0,1})(\b)/gi,'$1$3$4$5$6$7');   
	//s-zvsx;
    myKiuCu=myKiuCu.replace(/([aeiouymngbd])(s)(-|_| )(zh|ch|sh|rh|ng|b|p|m|f|v|d|t|n|l|g|k|h|z|c|s|j|q|x|r{0,1})([aeiouymng]{1,5})([zvxs]{0,1})(\b)/gi,'$1⁺$3$4$5$6$7');   


// 移除;
	myKiuCu=myKiuCu.replace(//gi,'');

// 字母調轉調號;
	myKiuCu=myKiuCu.replace(/([a-z]{0,4})([mngbdgaeiou])(z)(\b)/gi,'$1$2ˊ$4');
	myKiuCu=myKiuCu.replace(/([a-z]{0,4})([mngbdgaeiou])(x)(\b)/gi,'$1$2ˆ$4');
	myKiuCu=myKiuCu.replace(/([a-z]{0,4})([mngbdgaeiou])(v)(\b)/gi,'$1$2ˇ$4');
	myKiuCu=myKiuCu.replace(/([a-z]{0,4})([mngbdgaeiou])(s)(\b)/gi,'$1$2ˋ$4');
	myKiuCu=myKiuCu.replace(/([a-z]{0,4})([mngbdgaeiou])(f)(\b)/gi,'$1$2⁺$4');

	myXinCu.value = myKiuCu;
	}

// 複製;
	function Copy(form) {
	if (!document.getElementById) return;
	myXinCu=document.getElementById("myidXin");
	myXinCu.focus();
    myXinCu.select();document.execCommand("Copy"); 
	}
