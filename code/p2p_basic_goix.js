function Goix_p2p(form) {
	if (!document.getElementById) return;
	myXinCu=document.getElementById("myidXin_p2p");
	var i;
	
	var myKiuCu = new String(form.myidKiu_p2p.value);
	var myRE;
	for (i = 0; i < B.length; i+=2) {   
		myRE = new RegExp (B[i], ["g"]);
	    myKiuCu = myKiuCu.replace(myRE, B[i+1]+"");
	    }   
	myXinCu.value = myKiuCu;
	}

function Copy_p2p(form) {
  if (!document.getElementById) return;
  myXinCu=document.getElementById("myidXin_p2p");
  myXinCu.focus();
  myXinCu.select();document.execCommand("Copy"); 
}