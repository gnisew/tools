var btnA="聲調標後>標上↓";
var btnB="聲調標上>標後↓";

var btnX="↑清除";
var btnC="複製↓";

function Goix_myA(form) {
	if (!document.getElementById) return;
	myXinCu=document.getElementById("myidXin");
	var myKiuCu = new String(form.myidKiu.value);


	myKiuCu=myKiuCu.replace(/([-,-])([])(ˊ|z)/gi,'$1$2́');
	myKiuCu=myKiuCu.replace(/([-,-])([])(ˇ|v)/gi,'$1$2̌');
	myKiuCu=myKiuCu.replace(/([-,-])([])(ˋ|s)/gi,'$1$2̀');
	myKiuCu=myKiuCu.replace(/([-,-])([])(ˆ|x|\^)/gi,'$1$2̂');
	myKiuCu=myKiuCu.replace(/([-,-])([])(⁺|f|\+)/gi,'$1$2̄');  



	myKiuCu=myKiuCu.replace(/([])([])(ˊ|z)/gi,'$1́$2');
	myKiuCu=myKiuCu.replace(/([])([])(ˇ|v)/gi,'$1̌$2');
	myKiuCu=myKiuCu.replace(/([])([])(ˋ|s)/gi,'$1̀$2');
	myKiuCu=myKiuCu.replace(/([])([])(ˆ|x|\^)/gi,'$1̂$2');
	myKiuCu=myKiuCu.replace(/([])([])(⁺|f|\+)/gi,'$1̄$2');

	myKiuCu=myKiuCu.replace(/([])(ˊ|z)/gi,'$1́');
	myKiuCu=myKiuCu.replace(/([])(ˇ|v)/gi,'$1̌');
	myKiuCu=myKiuCu.replace(/([])(ˋ|s)/gi,'$1̀');
	myKiuCu=myKiuCu.replace(/([])(ˆ|x|\^)/gi,'$1̂');
	myKiuCu=myKiuCu.replace(/([])(⁺|f|\+)/gi,'$1̄');

	myKiuCu=myKiuCu.replace(/()()(ˊ|z)/gi,'$1́$2');
	myKiuCu=myKiuCu.replace(/()()(ˇ|v)/gi,'$1̌$2');
	myKiuCu=myKiuCu.replace(/()()(ˋ|s)/gi,'$1̀$2');
	myKiuCu=myKiuCu.replace(/()()(ˆ|x|\^)/gi,'$1̂$2');
	myKiuCu=myKiuCu.replace(/()()(⁺|f|\+)/gi,'$1̄$2');

	myKiuCu=myKiuCu.replace(/()()(ˊ|z)/gi,'$1́$2');
	myKiuCu=myKiuCu.replace(/()()(ˇ|v)/gi,'$1̌$2');
	myKiuCu=myKiuCu.replace(/()()(ˋ|s)/gi,'$1̀$2');
	myKiuCu=myKiuCu.replace(/()()(ˆ|x|\^)/gi,'$1̂$2');
	myKiuCu=myKiuCu.replace(/()()(⁺|f|\+)/gi,'$1̄$2');

	myKiuCu=myKiuCu.replace(/()()(ˊ|z)/gi,'$1́$2');
	myKiuCu=myKiuCu.replace(/()()(ˇ|v)/gi,'$1̌$2');
	myKiuCu=myKiuCu.replace(/()()(ˋ|s)/gi,'$1̀$2');
	myKiuCu=myKiuCu.replace(/()()(ˆ|x|\^)/gi,'$1̂$2');
	myKiuCu=myKiuCu.replace(/()()(⁺|f|\+)/gi,'$1̄$2');

	myXinCu.value = myKiuCu;
	}

function Goix_myB(form) {

	if (!document.getElementById) return;
	myXinCu=document.getElementById("myidXin");
	var myKiuCu = new String(form.myidKiu.value);

myKiuCu=myKiuCu.replace(/([-]{0,5})(́)([-]{0,5})/g,'$1$3ˊ');
myKiuCu=myKiuCu.replace(/([-]{0,5})(̌)([-]{0,5})/g,'$1$3ˇ');  
myKiuCu=myKiuCu.replace(/([-]{0,5})(̀)([-]{0,5})/g,'$1$3ˋ');  
myKiuCu=myKiuCu.replace(/([-]{0,5})(̂)([-]{0,5})/g,'$1$3ˆ');  
myKiuCu=myKiuCu.replace(/([-]{0,5})(̄)([-]{0,5})/g,'$1$3⁺');  

	myXinCu.value = myKiuCu;

	}

function Copy(form) {
  if (!document.getElementById) return;
  myXinCu=document.getElementById("myidXin");
  myXinCu.focus();
  myXinCu.select();document.execCommand("Copy"); 
}