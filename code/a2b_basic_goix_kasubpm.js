function Goix_myA(form) {
	if (!document.getElementById) return;
	myXinCu=document.getElementById("myidXin");
	//var i;
	var myKiuCu = new String(form.myidKiu.value);

	var myREU; //陣列：漢字,造字;
	for (let i = 0; i < myU.length; i+=2) {   
		myREU = new RegExp ( myU[i] , ["g"]);
	    myKiuCu = myKiuCu.replace(myREU, myU[i+1]+"");
	    }

	myKiuCu = myKiuCu.replace(/([^a-z])([a-z]{1,9})([ˊˇˋ⁺+^ˆ]{0,1})/g,'\[$1【$2$3】\\$2$3\]');
	myKiuCu = myKiuCu.replace(/([czvsx])(y)(】)/g,'$1$3'); //本調音;
	myKiuCu = myKiuCu.replace(/(c)(d)(】)/g,'$1$3'); //本調音;

	myKiuCu = myKiuCu.replace(/(【)(rm)([aeiou])/g,'$1r$3'); //變調音;
	myKiuCu = myKiuCu.replace(/(【)(hm)([aeiou])/g,'$1h$3'); //變調音;
	myKiuCu = myKiuCu.replace(/(【)(vm)([aeiou])/g,'$1v$3'); //變調音;
	myKiuCu = myKiuCu.replace(/(【)(fuui)/g,'$1fu'); //變調音;
	myKiuCu = myKiuCu.replace(/(【)(hteem)/g,'$1heem'); //變調音;

	myKiuCu = myKiuCu.replace(/([czvsx])([czvsxf])(】)/g,'$1$3'); //本調音;
	myKiuCu = myKiuCu.replace(/([aeioumngbd])(f)(】)/g,'$1$3'); //本調音;
	myKiuCu = myKiuCu.replace(/([aeioumngbd])([c])(】)/g,'$1$3'); //變調音;
	myKiuCu = myKiuCu.replace(/([czvsx])([czvsxf])(\])/g,'$1$3'); //本調音;
	myKiuCu = myKiuCu.replace(/([aeioumngbd])(f)(\])/g,'$1$3'); //本調音;
	myKiuCu = myKiuCu.replace(/([aeioumngbd])(c)(\])/g,'$1$3'); //本調音;

	myKiuCu = myKiuCu.replace(/(\\)(rm)([aeiou])/g,'$1r$3'); //本調音;
	myKiuCu = myKiuCu.replace(/(\\)(hm)([aeiou])/g,'$1h$3'); //本調音;
	myKiuCu = myKiuCu.replace(/(\\)(vm)([aeiou])/g,'$1v$3'); //本調音;
	myKiuCu = myKiuCu.replace(/(\\)(fuui)/g,'$1fu'); //本調音;
	myKiuCu = myKiuCu.replace(/(\\)(hteem)/g,'$1heem'); //本調音;

	myKiuCu = myKiuCu.replace(/(\\)(r)([aeiou])/g,'$1rh$3'); //本調音;
	myKiuCu = myKiuCu.replace(/(\\)(v)([aeiou])/g,'$1bb$3'); //本調音;
	myKiuCu = myKiuCu.replace(/(\\)([bpfdtlgkhzcsr])(o)/g,'$1$2oo'); //本調音;
	myKiuCu = myKiuCu.replace(/(\\)(oo)([nibdgm])/g,'$1o$3'); //本調音;
	myKiuCu = myKiuCu.replace(/(\\)(o)([zvsx]{0,1})(\])/g,'$1oo$3$4'); //本調音;

	var myRE;
	for (let i = 0; i < myA.length; i+=2) {   
		myRE = new RegExp ("【" + myA[i] + "】", ["g"]);
	    myKiuCu = myKiuCu.replace(myRE, myA[i+1]+"");
	    }

	var myREZ; //陣列：造字,漢字;
	for (let i = 0; i < myZ.length; i+=2) {   
		myREU2Z = new RegExp ( myZ[i] , ["g"]);
	    myKiuCu = myKiuCu.replace(myREZ, myZ[i+1]+"");
	    }

	myKiuCu = myKiuCu.replace(/([aeioumngbd])(z)(\])/g,'$1ˊ$3');
	myKiuCu = myKiuCu.replace(/([aeioumngbd])(v)(\])/g,'$1ˇ$3');
	myKiuCu = myKiuCu.replace(/([aeioumngbd])(s)(\])/g,'$1ˋ$3');
	myKiuCu = myKiuCu.replace(/([aeioumngbd])(x)(\])/g,'$1ˆ$3');

	myXinCu.value = myKiuCu;
	}


function Goix_myB(form) {
	if (!document.getElementById) return;
	myXinCu=document.getElementById("myidXin");
	//var i;
	var myKiuCu = new String(form.myidKiu.value);

	var myREU; //陣列：漢字,造字;
	for (let i = 0; i < myU.length; i+=2) {   
		myREU = new RegExp ( myU[i] , ["g"]);
	    myKiuCu = myKiuCu.replace(myREU, myU[i+1]+"");
	    }


	myKiuCu = myKiuCu.replace(/([^a-z])([a-z]{1,9})([ˊˇˋ⁺+^ˆ]{0,1})/g,'\[$1【$2$3】\\$2$3\]');
	myKiuCu = myKiuCu.replace(/([czvsx])(y)(】)/g,'$1$3'); //本調音;
	myKiuCu = myKiuCu.replace(/(c)(d)(】)/g,'$1$3'); //本調音;

	myKiuCu = myKiuCu.replace(/(【)(rm)([aeiou])/g,'$1m$3'); //變調音;
	myKiuCu = myKiuCu.replace(/(【)(hm)([aeiou])/g,'$1m$3'); //變調音;
	myKiuCu = myKiuCu.replace(/(【)(vm)([aeiou])/g,'$1m$3'); //變調音;
	myKiuCu = myKiuCu.replace(/(【)(fuui)/g,'$1fui'); //變調音;
	myKiuCu = myKiuCu.replace(/(【)(hteem)/g,'$1teem'); //變調音;


	myKiuCu = myKiuCu.replace(/([czvsx])([zvsxf])(】)/g,'$2$3'); //變調音;
	myKiuCu = myKiuCu.replace(/([zvsx])([c])(】)/g,'$3'); //變調音;
	myKiuCu = myKiuCu.replace(/([czvsx])([czvsxf])(\])/g,'$1$3'); //本調音;
	myKiuCu = myKiuCu.replace(/([aeioumngbd])(f)(\])/g,'$1$3'); //本調音;
	myKiuCu = myKiuCu.replace(/([aeioumngbd])(c)(\])/g,'$1$3'); //本調音;

	myKiuCu = myKiuCu.replace(/(\\)(rm)([aeiou])/g,'$1r$3'); //本調音;
	myKiuCu = myKiuCu.replace(/(\\)(hm)([aeiou])/g,'$1h$3'); //本調音;
	myKiuCu = myKiuCu.replace(/(\\)(vm)([aeiou])/g,'$1v$3'); //本調音;
	myKiuCu = myKiuCu.replace(/(\\)(fuui)/g,'$1fu'); //本調音;
	myKiuCu = myKiuCu.replace(/(\\)(hteem)/g,'$1heem'); //本調音;

	myKiuCu = myKiuCu.replace(/(\\)(r)([aeiou])/g,'$1rh$3'); //本調音;
	myKiuCu = myKiuCu.replace(/(\\)(v)([aeiou])/g,'$1bb$3'); //本調音;
	myKiuCu = myKiuCu.replace(/(\\)([bpfdtlgkhzcsr])(o)/g,'$1$2oo'); //本調音;
	myKiuCu = myKiuCu.replace(/(\\)(oo)([nibdgm])/g,'$1o$3'); //本調音;
	myKiuCu = myKiuCu.replace(/(\\)(o)([zvsx]{0,1})(\])/g,'$1oo$3$4'); //本調音;

	var myRE;
	for (let i = 0; i < myA.length; i+=2) {   
		myRE = new RegExp ("【" + myA[i] + "】", ["g"]);
	    myKiuCu = myKiuCu.replace(myRE, myA[i+1]+"");
	    }

	var myREZ; //陣列：造字,漢字;
	for (let i = 0; i < myZ.length; i+=2) {   
		myREU2Z = new RegExp ( myZ[i] , ["g"]);
	    myKiuCu = myKiuCu.replace(myREZ, myZ[i+1]+"");
	    }

	myKiuCu = myKiuCu.replace(/([aeioumngbd])(z)(\])/g,'$1ˊ$3');
	myKiuCu = myKiuCu.replace(/([aeioumngbd])(v)(\])/g,'$1ˇ$3');
	myKiuCu = myKiuCu.replace(/([aeioumngbd])(s)(\])/g,'$1ˋ$3');
	myKiuCu = myKiuCu.replace(/([aeioumngbd])(x)(\])/g,'$1ˆ$3');

	myXinCu.value = myKiuCu;
	}




function Copy(form) {
  if (!document.getElementById) return;
  myXinCu=document.getElementById("myidXin");
  myXinCu.focus();
  myXinCu.select();document.execCommand("Copy"); 
}