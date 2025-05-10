function Goix_myA(form) {
    if (!document.getElementById) return;
    myXinCu=document.getElementById("myidXin");
	var i;
	var j;

	var myKiuCu = new String(form.myidKiu.value);
	var myRE;
	var myRE2;

	for (i = 0; i < myA.length; i+=2) {
	   myRE = new RegExp (myA[i], ["g"]);
	   myKiuCu = myKiuCu.replace(myRE, "X"+i+"Y");  
	   myKiuCu=myKiuCu;
	   }
	   
	for (j = 0; j < myA.length; j+=2) {
	   myRE2 = new RegExp ("X"+j+"Y", ["g"]);
	   myKiuCu = myKiuCu.replace(myRE2, myA[j+1]);  
	   myKiuCu=myKiuCu;
	   }

    myXinCu.value = myKiuCu;
}


function Goix_myB(form) {
    if (!document.getElementById) return;
    myXinCu=document.getElementById("myidXin");
	var i;
	var j;

	var myKiuCu = new String(form.myidKiu.value);
	var myRE;
	var myRE2;

	for (i = 0; i < myB.length; i+=2) {
	   myRE = new RegExp (myB[i], ["g"]);
	   myKiuCu = myKiuCu.replace(myRE, "X"+i+"Y");  
	   myKiuCu=myKiuCu;
	   }
	   
	for (j = 0; j < myB.length; j+=2) {
	   myRE2 = new RegExp ("X"+j+"Y", ["g"]);
	   myKiuCu = myKiuCu.replace(myRE2, myB[j+1]);  
	   myKiuCu=myKiuCu;
	   }

    myXinCu.value = myKiuCu;
}
/*
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
*/
function Copy(form) {
  if (!document.getElementById) return;
  myXinCu=document.getElementById("myidXin");
  myXinCu.focus();
  myXinCu.select();document.execCommand("Copy"); 
}