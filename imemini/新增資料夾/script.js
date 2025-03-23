var arr_cj_c = []; // 奇數列，漢字c;
var arr_cj_j = []; // 偶數列，拼音j;
var arr_cj = ["日","A","月","B","金","C","木","D","水","E","火","F","土","G","竹","H","戈","I","十","J","大","K","中","L","一","M","弓","N","人","O","心","P","手","Q","口","R","尸","S","廿","T","山","U","女","V","田","W","卜","Y","難","X"];

const searchWrapper = document.querySelector(".search-input");
const inputBox = searchWrapper.querySelector("input");
const suggBox = searchWrapper.querySelector(".autocom-box");
const icon = searchWrapper.querySelector(".icon");
let linkTag = searchWrapper.querySelector("a");
let webLink;
let hz = "[\u3007\u3400-\u4DB5\u4E00-\u9FCB\uE815-\uE864]|[\uD840-\uD87F][\uDC00-\uDFFF]";
let aa;
let bb;
let where = 0;
let x = 0;
let bboo = "";
//=================================================;
var kasuData = [];
let myUrl = new URL(location.href);

let myL = myUrl.searchParams.get('lang');
if (myL == null) {
    location.href = location.protocol + "//" + location.hostname + location.pathname + "?lang=";
} else if (myL == "") {
    kasuData = kasu.split("\n");
	inputBox.placeholder = "詔安客語單字";
} else if (myL != "") {
    if (myL == "s") {
        kasuData = sixian.split("\n");
		inputBox.placeholder = "烏衣行四縣客語";
    } else if (myL == "h") {
        kasuData = hailu.split("\n");
		inputBox.placeholder = "烏衣行海陸客語";
    } else if (myL == "d") {
        kasuData = dapu.split("\n");
		inputBox.placeholder = "烏衣行大埔客語";
    } else if (myL == "r") {
        kasuData = raoping.split("\n");
		inputBox.placeholder = "烏衣行饒平客語";
    } else if (myL == "z") {
        kasuData = kasu.split("\n");
		inputBox.placeholder = "烏衣行詔安客語";
    } else if (myL == "m") {
        kasuData = minnan.split("\n");
		inputBox.placeholder = "烏衣行台灣閩南語";
    } else if (myL == "f") {
        kasuData = fuzhou.split("\n");
		inputBox.placeholder = "烏衣行馬祖閩東語";
    } else if (myL == "cj") {
        kasuData = canjie.split("\n");
		inputBox.placeholder = "烏衣行倉頡單字";
		arr_cj_c = arrJi(arr_cj); // 倉頡奇數列，漢字c;
		arr_cj_j = arrOu(arr_cj); // 倉頡偶數列，拼音j;
	}else{
		kasuData = canjie.split("\n");
		inputBox.placeholder = "";
	}
};


function arrJi(arr){
	return arr.filter((e,i) => i%2 == 0);
}
function arrOu(arr){
	return arr.filter((e,i) => i%2 == 1);
}


inputBox.focus();

inputBox.onkeyup = (e)=>{
	if(x == 0){
		where = cursorAt(inputBox);
	}

	let k = event.keyCode; // 處理方向鍵、刪除鍵不執行位置判定 where = cursorAt(inputBox);
	if ( k == 8 || k == 46 || k == 35 || k == 36 || k == 37 || k == 38 || k == 39 || k == 40 || k == 16) {	
		//cc(event.keyCode);
	}else{
		x = 1;
	}

    let userData = "";
	 
	if(myL == "cj"){
		userData = e.target.value.toLowerCase(); //user enetered data;
		e.target.value = e.target.value.toUpperCase();	
	}else{
		userData = e.target.value; //user enetered data;	
	}
	userData = userData.replace(/[^a-z]| /g,"")
	userData = userData.toLowerCase();

    let emptyArray = [];
	if(myL == "z" && userData.match(/bb|oo|rh/g)){
		userData = userData.replace(/bb/g, "v");
		userData = userData.replace(/oo/g, "o");
		userData = userData.replace(/rh/g, "r");
		bboo = "bboo";
	}
    if(userData){
        icon.onclick = () =>{
			inputBox.select();
			document.execCommand('copy');
        }
		let arr = kasuData.filter((e)=>{
			let el = e.toLocaleLowerCase();
			let dl = userData.toLocaleLowerCase();
            return el.startsWith(dl);
        });
		if (arr.length == 0)	{
		 return;
		}
		if (arr.length > 100)	{
			emptyArray = arr.slice(0, 100);
		}else{
			emptyArray = arr;
		};
        emptyArray = emptyArray.map((data, index)=>{
			data = data.replace(/([a-z]{1,})(\t)([^a-z]{1,})([a-z]{0,})/g, "$3$4$2$1");
			
			let dA = data.split("\t")[0];
			let dB = data.split("\t")[1];
			let dC;

			if(myL == "cj"){
				dC = replaceArr(dB.toUpperCase(), arr_cj_j, arr_cj_c);
				data = dA + " <span class='cjZ'>" + dB.toUpperCase() + "</span>" + " <span class='cjH'>" + dC + "</span>";
			}else if(myL == "z" && bboo == "bboo"){
				dB = dB.replace(/([aeioumngbd])(z)/g, "$1ˊ");
				dB = dB.replace(/([aeioumngbd])(v)/g, "$1ˇ");
				dB = dB.replace(/([aeioumngbd])(s)/g, "$1ˋ");
				dB = dB.replace(/([aeioumngbd])(f)/g, "$1⁺");
				dB = dB.replace(/([aeioumngbd])(x)/g, "$1ˆ");
				//dC = replaceArr(dB, arr_pz);
				dB = dB.replace(/(r)([aeiou])/g, "rh$2");
				dB = dB.replace(/(v)([aeiou])/g, "bb$2");
				dB = dB.replace(/([bpfdtlgkhzcs])(o)/g, "$1oo");
				dB = dB.replace(/(ng)(o)/g, "$1o");
				dB = dB.replace(/(oo)([indbmg])/g, "o$2");
				//data = dA + " <span class='py'>" + dB + "</span>" + "<span class='zy'>" + dC + "</span>";
				data = dA + " <span class='py'>" + dB + "</span>";
			}else{
				dB = dB.replace(/([aeioumngbd])(z)/g, "$1ˊ")
				dB = dB.replace(/([aeioumngbd])(v)/g, "$1ˇ")
				dB = dB.replace(/([aeioumngbd])(s)/g, "$1ˋ")
				dB = dB.replace(/([aeioumngbd])(f)/g, "$1⁺")
				dB = dB.replace(/([aeioumngbd])(x)/g, "$1ˆ")
				//dC = replaceArr(dB, arr_pz);
				//data = dA + " <span class='py'>" + dB + "</span>" + "<span class='zy'>" + dC + "</span>";
				data = dA + " <span class='py'>" + dB + "</span>";
			}
			data = "<span class='xuhao'>" + (index+1) + "</span>" + " " + data;
            return data = `<li>${data}</li>`;
        });
        searchWrapper.classList.add("active");
        showSuggestions(emptyArray);
        let allList = suggBox.querySelectorAll("li");
		allList.forEach((e, i, arr) => arr[i] = e.setAttribute("onclick", "select(this)"));
		// 數字選擇鍵;
		let ek = event.key;
			if(k == 32){
				e.target.value = e.target.value.replace(/[0-9]/g,"")
				select(allList[0]);				
			}else if( (event.shiftKey) && (event.keyCode!=16) && k >=49 && k <= 57){
				e.target.value = e.target.value.replace(/[!@#$%^&*()]/g,"")
				select(allList[k-39]);
			}else if(ek == 0){
				e.target.value = e.target.value.replace(/[0-9]/g,"")
				select(allList[9]);			
			}else if( ek >=1 && ek <= 9){
				e.target.value = e.target.value.replace(/[0-9]/g,"")
				select(allList[ek-1]);
			}else if(ek == 0){
				e.target.value = e.target.value.replace(/[0-9]/g,"")
				select(allList[9]);			
			}
    }else{
        searchWrapper.classList.remove("active");
		bboo = "";
    }
}





function select(element){
    let selectData = element.textContent;

	let v = selectData.split(" ")[1];
	aa = inputBox.value.substring(0, inputBox.selectionStart); 
	bb = inputBox.value.substring(inputBox.selectionEnd); 
	if(myL == "cj"){
		inputBox.value = (aa + v + bb).replace(/[A-Za-z ]/g,"");
	}else{
		inputBox.value = (aa + v + bb).replace(/[a-z ]/g,"");
	}
    searchWrapper.classList.remove("active");
	inputBox.focus();
	cursorSetAt(inputBox, where - v.length +1);
	x = 0;
	bboo = "";
}


function showSuggestions(list){
    let listData;
    if(!list.length){
        userValue = inputBox.value;
        listData = `<li>${userValue}</li>`;
    }else{
      listData = list.join('');
    }
    suggBox.innerHTML = listData;
}



function cursorAt(e) {
	let p = 0;	
	if (document.selection) {
		e.focus ();
		let s = document.selection.createRange();
		s.moveStart ('character', -e.value.length);
		p = s.text.length;
	}else if (e.selectionStart || e.selectionStart == '0'){
		p = e.selectionStart;
	}
	return (p);
}


function cursorSetAt(e, p){
	// 設定游標在某物件的位置;
	// cursorSetAt(物件, 位置);
	if(e.setSelectionRange){
		e.focus();
		e.setSelectionRange(p, p);
	}else if (e.createTextRange) {
		let r = e.createTextRange();
		r.collapse(true);
		r.moveEnd('character', p);
		r.moveStart('character', p);
		r.select();
	}
}


function replaceArr(e, arr, brr = arr, gi = "g", add1 = "", add2 = "", type = 0, crr, drr = crr){
	// 陣列取代;
	// replaceArr(e元素, a陣列, b陣列, 全搜與大小寫, 前加, 後加, 類型);
	// replaceArr(e, arr) 同一個陣列，0取代為1，2取代為3;
	// replaceArr(e, arr, brr) 兩個陣列，a陣列取代為b陣列;
	// replaceArr(e, arr, arr, "g") 同一個陣列，全部取代，區分大小寫;
	// replaceArr(e, arr, brr, "gi") 不同陣列，全部取代，不分大小寫;
	// replaceArr(e, arr, brr, "gi", "[", "]") 前加[，後加];
	// replaceArr(e, arr, brr, "gi", "[", "]", 2) 類型0：a轉b，類型1：a轉a[b])，類型2：a轉b[a];
	// 也可自訂成：function rp(e, arr, brr, add1, add2){ return replaceArr(e, arr, brr, "gi", add1, add2); } 
	let re; //正則;
	let len = 0;
	//let y = 0; //用於計算單一陣列與否的位置;
	let txtA = "☺"; //前阻擋字元;
	let txtB = "☹"; //後阻擋字元;
	let arrN = []; //於陣列中有的編號; 
	let arrX = []; //於陣列中有的;
	let arrY = []; //有的對應應取代的;
	let searchLen;
	let out = "";



	if(e.match(/(\#)(\w+)/)){
		e = document.getElementById(e.slice(1)).innerHTML;
	}
	if(e.match(/(\@)(\w+)/)){
		e = document.getElementsByTagName(e.slice(1))[0].innerHTML;
	}

	if(arr[0].A === undefined){

		if(brr == arr){		
			brr = arr.filter((e,i) => i%2 == 1); // 偶數列;
			arr = arr.filter((e,i) => i%2 == 0); // 奇數列;
		}

		len = arr.length;

		for (let i = 0; i < len; i++) { 
			if (arr[i] === "") { continue; }
			re = new RegExp (arr[i], "g");
			if(e.match(re)){
				// 若有找到，則取代成阻擋字元+數字;		
				arrN.push(txtA + i + txtB);
				arrX.push(arr[i]);
				arrY.push(brr[i]);
				e = e.replace(re, txtA + i + txtB);
			}			
		}
	}else{
		//let y = 0;
		len = arr.length;
		//if(brr == arr)	y = 1; // 若兩個陣列相同(預設值);
		for (let i = 0; i < len; i++) {
			if (arr[i].A === "") { continue; } // 空值則跳過;
			re = new RegExp (arr[i].A, "g");
			if(e.match(re)){
				// 若有找到，則取代成阻擋字元+數字;
				arrN.push(txtA + i + txtB);
				arrX.push(arr[i].A);
				arrY.push(arr[i].B);
				e = e.replace(re, txtA + i + txtB);
			}			
		}
	}

	let s = "";
	searchLen = arrN.length;
	//找到的個數；以下則只處理找到的，免跑陣列全部;
	let searchCrr = [];
	if(type == "acb" || type == 3){
		searchCrr = arrX.map((e) => replaceArr2(e, crr, drr));
	}
	
	for (let i = 0; i < searchLen; i++) {   
		re = new RegExp (arrN[i], ["g"]);
		s = e.replace(re, arrY[i]);
		
		// 輸出類型;
		if(type == 0){
			e = add1 + s + add2;
		}else if(type == "ab" || type == 1){
			e = arrX[i] + add1 + s + add2;
		}else if(type == "a\b"){
			e = "<ruby>" + arrX[i] + "<rt>" + add1 + s + add2 + "</rt></ruby>";
		}else if(type == "ba" || type == 2){
			e = s + add1 + arrX[i] + add2;
		}else if(type == "acb" || type == 3){
			out = out  + arrX[i] + add1 + searchCrr[i] + add2 + arrY[i] + "。\n";
			e = out;
		}
	}
	return e;
};


