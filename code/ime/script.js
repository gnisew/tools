// 取得所有所需物件;
var arr_cj_c = []; // 奇數列，漢字c;
var arr_cj_j = []; // 偶數列，拼音j;

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

let myL = myUrl.searchParams.get('lang'); // 設語言別;
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
		hide("#tone");
		arr_cj_c = arrJi(arr_cj); // 倉頡奇數列，漢字c;
		arr_cj_j = arrOu(arr_cj); // 倉頡偶數列，拼音j;
	}else{
		kasuData = canjie.split("\n");
		inputBox.placeholder = "";
	}
};
//======================================================;




inputBox.focus();

// 如果在打字框打字;
inputBox.onkeyup = (e)=>{
//inputBox.addEventListener("keyup", (e) => {;
//也可使用偵聽，結尾記得加 }) ;
	if(x == 0){
		where = cursorAt(inputBox);
	}

	let k = event.keyCode; // 處理方向鍵、刪除鍵不執行位置判定 where = cursorAt(inputBox);
	if ( k == 8 || k == 46 || k == 35 || k == 36 || k == 37 || k == 38 || k == 39 || k == 40 || k == 16) {	
		//cc(event.keyCode);
	}else{
		x = 1;
	}
/*
	if ( k >= 65 && k <= 90) {	
		x = 1;
	}
*/

    let userData = "";
	 
	if(myL == "cj"){
		userData = e.target.value.toLowerCase(); //user enetered data;
		e.target.value = e.target.value.toUpperCase();	
	}else{
		userData = e.target.value; //user enetered data;	
	}
	userData = userData.replace(/[^a-z]| /g,"")
    let emptyArray = [];
	if(myL == "z" && userData.match(/bb|oo|rh/g)){
		userData = userData.replace(/bb/g, "v");
		userData = userData.replace(/oo/g, "o");
		userData = userData.replace(/rh/g, "r");
		bboo = "bboo";
	}
    if(userData){
        icon.onclick = () =>{
			/*
            webLink = `https://www.google.com/search?q=${userData}`;
            linkTag.setAttribute("href", webLink);
            linkTag.click();
			*/
			inputBox.select();
			document.execCommand('copy');
        }
        //let arr = suggestions.filter((e)=>{
		let arr = kasuData.filter((e)=>{
            //filtering array value and user characters to lowercase and return only those words which are start with user enetered chars;
			let el = e.toLocaleLowerCase();
			let dl = userData.toLocaleLowerCase();
            return el.startsWith(dl);
        });
		// 如果沒配到就終止;
		if (arr.length == 0)	{
		 return;
		}
		// 只擷取配到的前50個;
		if (arr.length > 100)	{
			emptyArray = arr.slice(0, 100);
		}else{
			emptyArray = arr;
		};
		//
        emptyArray = emptyArray.map((data, index)=>{
            // passing return data inside li tag;
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
				dC = replaceArr(dB, arr_pz);
				dB = dB.replace(/(r)([aeiou])/g, "rh$2");
				dB = dB.replace(/(v)([aeiou])/g, "bb$2");
				dB = dB.replace(/([bpfdtlgkhzcs])(o)/g, "$1oo");
				dB = dB.replace(/(ng)(o)/g, "$1o");
				dB = dB.replace(/(oo)([indbmg])/g, "o$2");
				data = dA + " <span class='py'>" + dB + "</span>" + "<span class='zy'>" + dC + "</span>";
			}else{
				dB = dB.replace(/([aeioumngbd])(z)/g, "$1ˊ")
				dB = dB.replace(/([aeioumngbd])(v)/g, "$1ˇ")
				dB = dB.replace(/([aeioumngbd])(s)/g, "$1ˋ")
				dB = dB.replace(/([aeioumngbd])(f)/g, "$1⁺")
				dB = dB.replace(/([aeioumngbd])(x)/g, "$1ˆ")
				dC = replaceArr(dB, arr_pz);
				data = dA + " <span class='py'>" + dB + "</span>" + "<span class='zy'>" + dC + "</span>";
				//data = "<ruby>" + dA + "<rt><span class='zy'>" + dC + "</span>" + "</rt></ruby>" + "<span class='py'>" + dB + "</span>";
			}
			data = "<span class='xuhao'>" + (index+1) + "</span>" + " " + data;
            return data = `<li>${data}</li>`;
        });
        searchWrapper.classList.add("active"); //show autocomplete box;
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
        searchWrapper.classList.remove("active"); //隱藏選項;
		bboo = "";
    }
}





function select(element){
    let selectData = element.textContent;
    //inputBox.value = selectData.split(" ")[0].replace(/[zvsfx]/g, "");

	let v = selectData.split(" ")[1];
	//inputBox.value = prefix + v.replace(/[a-z]/g,"") + suffix;
	aa = inputBox.value.substring(0, inputBox.selectionStart); 
	bb = inputBox.value.substring(inputBox.selectionEnd); 
	if(myL == "cj"){
		inputBox.value = (aa + v + bb).replace(/[A-Za-z ]/g,"");
	}else{
		inputBox.value = (aa + v + bb).replace(/[a-z ]/g,"");
	}
	//
	/*
    icon.onclick = ()=>{
        webLink = `https://www.google.com/search?q=${selectData}`;
        linkTag.setAttribute("href", webLink);
        linkTag.click();
    }
	*/
    searchWrapper.classList.remove("active");
	inputBox.focus();
	cursorSetAt(inputBox, where + v.length-1);
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
	// 取得游標在某物件的位置;
	// cursorAt(物件);
	let p = 0;	
	if (document.selection) {
		// IE Support;
		e.focus ();
		let s = document.selection.createRange();
		s.moveStart ('character', -e.value.length);
		p = s.text.length;
	}else if (e.selectionStart || e.selectionStart == '0'){
			// Firefox support;
		p = e.selectionStart;
	}
	return (p);
}




