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