let timeScreen = 100;
if (typeof(timeLimit) == "undefined") {
    timeScreen = 100;
} else {
    timeScreen = timeLimit;
}

const checkbox = document.getElementById('muteCheckbox');
let myMute = "no";
//const audio = document.getElementById('audioPlayer');

checkbox.addEventListener('change', function() {
    if (checkbox.checked) {
        myMute = "yes";
    } else {
        myMute = "no";
    }
});


//list of words
let words = [];
//let wordsA = ["AA;aa","BB;bb","CC;cc","DD;dd","EE;ee","FF;ff"];
let splitWord = ";";

let ttsArr = ["2ce35932741b48c4b5e38c2f2a7ade31", "811aa58314464154be4de062c289e342", "dbf82f7407a144ba8cb97011513e34ac", "a1e2bd1a4527484fbc9dc48742d8fc9f", "9e66e3008c32401985d30200fe6cd533", "cc19a05655ae4959958183b119e40251", "6212b3d8ef084f1c80a87078ff4a289a", "6bd2a9bd73834c80bab9928234097db5", "e83a6fd4f27141699eb7598dcd4cafad", "6350d8975a134e5f84656c20616dd422", "bb04a45ae31446f7a06162a4f58e1cc1", "2a9f1fd498714fe3a8bccfc04b65c6ae", "784db78a8b8141d9849a3172393605ce", "bb6416d011124cfaaa4e34ffab03c8be", "777f7d37c8114b69b5c2a691b489a32b", "d6f6e493346846c7bb1add42df991a4d", "ee0cf441133c4f8d9ec02122d5458409", "528d1a82bb98409188266c2bb8f953fc", "7ffba855207c4e24aad21209264273b3", "3113a5b7d09d4de7aa42228efbea67fe", "25e890acf1874326951ad4414b9543fc", "6f657339e30b40d2bbac417e8672496c", "19f0b371d5ee40ceab9d2da42e37cdc3", "0c423867b6944c15b8762ab96c4d147a", "3ee0eb4002074e1ea89aa4c9cb57122a", "e3ec13980a2e42c4909dbca7f5aea6a2", "be02f985a9744d7ea1423de4bf50fcbf", "83972d64d9e04b559e57c2d10ad1de74", "f40c241f3bf3479d8931722ec04c794f", "8762b579fc4245dcaf8380c29964aa4b"];
// mail...@midiharmonica.com ;
// https://mail.tm/zh ;
// https://www.voicerss.org ;
function arrRand(a, b) {
    var num = Math.random() > 0.5 ? -1 : 1;
    return num;
}
ttsArr = ttsArr.sort(arrRand);
let voiceEnArr = ["Akemi", "Lee", "Lin"];
// voicerss.org;

const word = document.getElementById("word");
const small = document.getElementById("small");
const text = document.getElementById("text");
const scoreEl = document.getElementById("score");
const timeEl = document.getElementById("time");
const endgameEl = document.getElementById("end-game-container");
const settingBtn = document.getElementById("setting-btn");
const settings = document.getElementById("setting");
const settingsForm = document.getElementById("setting-form");
const settingsForm2 = document.getElementById("setting-form2");
const difficultySelect = document.getElementById("difficulty");
const wordArrSelect = document.getElementById("wordArr");
const xie = document.getElementById("xie");
const timeText = document.getElementById("time");
const startBtn = document.getElementById("start");

const MuteCheckboxBtn = document.getElementById("myMuteCheckbox");



let playMp3 = "";
if (typeof(playAudio) == "undefined") {
    MuteCheckboxBtn.style.visibility = "hidden";
} else {
    playMp3 = playAudio;
}
if (playMp3 !== "yes" && playMp3 !== "kk") {
    MuteCheckboxBtn.style.visibility = "";
}

//顯示隱藏靜音按鈕;


//init word
let randomWord;
let w1;
let w2;
let screenWidth = (window.innerWidth) * 0.96;
let score = 0;
let wrong = 0; //打錯時的計數;
let niuCss = 0; //打錯時的抖動;
text.disabled = true;
let wrongArr = []; //打錯時的字元;


/*
console.log(arrList);
arrList = rpArrHakka2(arrList);
console.log(arrList);

function rpArrHakka2(arr) {
	//取代客語字尾調data;
	let arrJoin = arr.join("|");
	arrJoin = arrJoin.replace(/([aeioumngr])(z)/gi, '$1ˊ')
            .replace(/([aeioumngr])(v)/gi, '$1ˇ')
            .replace(/([aeioumngr])(s)/gi, '$1ˋ')
            .replace(/([aeioumngr])(x)/gi, '$1ˆ')
		    .replace(/(bb)([aeiou])/gi, '$1_')
		    .replace(/([aeioumngr])(f)/gi, '$1⁺');
	arr = arrJoin.split("|");
	return arr;
}
*/



timeText.innerHTML = timeScreen + " 秒";
let time = timeScreen;

let wordsRand = [];



option(arrList);

function option(arr) {
    // 題目選單名稱;
    let len = arr.length;
    for (let i = 0; i < len; i++) {
        let arr1 = arr[i][1];
        let arr2 = arr[i][1];
        if (arr2.slice(0, 1) == "#") {
            arr2 = arr2.slice(1)
        }
        creat(arr1, i+1 + ". " + arr2);
        // 建立 選單項目;
    }
}

function creat(v, html) {
    // 建立 選單項目;
    let x = document.createElement("option")
    x.innerHTML = html;
    x.value = v;
    wordArrSelect.appendChild(x);
}

let difficulty =
    localStorage.getItem("difficulty") !== null ?
    localStorage.getItem("difficulty") : "average";
difficultySelect.value = difficulty;
//預設難度;

let wordArr =
    localStorage.getItem("wordArr") !== null ?
    localStorage.getItem("wordArr") : arrList[0][1];
wordArrSelect.value = wordArr;
//預設題目項目;

settingsForm2.addEventListener("change", (e) => {
    // 題目選擇項目;
    let w = e.target.value;
    localStorage.setItem("wordArr", w);
    wordArr = w;
    which(arrList);
});

which(arrList);

function which(arr) {
    let len = arr.length;
    for (let i = 0; i < len; i++) {
        if (wordArr == arr[i][1]) {
            let y = arr[i][0];
            // 取得要測驗的字串;
            // 設定語言;
            if (rpLang != "undefined") {
                if (rpLang == "kasu") {
                    y = rpTxtKasu(y);
                    y = rpTxtHakkaTone(y);
                } else if (rpLang == "hakka") {
                    y = rpTxtHakka(y);
                } else if (rpLang == "holo") {
                    y = rpTxtHoloTone(y);
                } else if (rpLang == "matsu") {
                    y = rpTxtMatsuTone(y);
                }
            }
            words = y.split("\n");
            //取代data;

            if (wordArr.slice(0, 1) == "#") {
                // 名稱前加#，不隨機;
                return wordsRand = words.slice(0);
            } else {
                return wordsRand = myRand(words.slice(0));
                // 預設隨機;
            }
        }
    }
}

function rpTxtKasu(t) {
    //取代data Txt;
    t = t.replace(/(v)([aeiou])/g, 'bb$2')
        .replace(/(r)([aeiou])/g, 'rh$2')
        //.replace(/[aeiou]/g, 'x')
        .replace(/([bpfdtglkhzcs])(o)([zvsxf])(\b)/g, '$1oo$3')
        .replace(/([bpfdtglkhzcs])(o)(\b)/g, '$1oo')
        .replace(/(ng|m|n)(oo)(\b)/g, '$1o');
    return t;
}

function rpTxtHakkaTone(t) {
    //取代data Txt;
    t = t.replace(/([aeioumngr])(z)/gi, '$1ˊ')
        .replace(/([aeioumngr])(v)/gi, '$1ˇ')
        .replace(/([aeioumngr])(s)/gi, '$1ˋ')
        .replace(/([aeioumngr])(x)/gi, '$1ˆ')
        .replace(/([aeioumngr])(f)/gi, '$1⁺');
    return t;
}




function rpArr(arr) {
    //取代data;
    let len = arr.length;
    for (var i = 0; i < len; i++) {
        arr[i] = arr[i].replace(/(v)([aeiou])/g, 'bb$2')
            .replace(/(r)([aeiou])/g, 'rh$2')
            //.replace(/[aeiou]/g, 'x')
            .replace(/([bpfdtglkhzcs])(o)(\b)/g, '$1oo')
            .replace(/(ng|m|n)(oo)(\b)/g, '$1o')
            .replace('XX', 'XX');
    }
    return arr;
}

function rpArrHakka(arr) {
    //取代客語字尾調data;
    let len = arr.length;
    for (var i = 0; i < len; i++) {
        arr[i] = arr[i].replace(/([aeioumngr])(z)/gi, '$1ˊ')
            .replace(/([aeioumngr])(v)/gi, '$1ˇ')
            .replace(/([aeioumngr])(s)/gi, '$1ˋ')
            .replace(/([aeioumngr])(x)/gi, '$1ˆ')
            .replace(/([aeioumngr])(f)/gi, '$1⁺');
    }
    return arr;
}



function rpArrHolo(arr) {
    //取代閩南語調data;
    let len = arr.length;
    for (var i = 0; i < len; i++) {
        arr[i] = arr[i].replace(/([aeioumngr])(z)/gi, '$1ˊ')
            .replace(/([aeioumngr])(v)/gi, '$1ˇ')
            .replace(/([aeioumngr])(s)/gi, '$1ˋ')
            .replace(/([aeioumngr])(x)/gi, '$1ˆ')
            .replace(/([aeioumngr])(f)/gi, '$1⁺');
    }
    return arr;
}


function myRand(array) {
    //隨機;
    return array.sort(() => Math.random() - 0.5);
}

let timeInterval;

function startGame() {
    //startBtn.style.display="none";
    settings.classList.toggle("hide");
    text.disabled = false;
    //focus on text
    text.focus();

    //start count down
    timeInterval = setInterval(updateTime, 1000);

    //generate random word
    function getRandomWord(arr) {
        return arr[Math.floor(Math.random() * arr.length)];
    }

    //add word to dom
    addWordToDOM();
}

function addWordToDOM() {

if (typeof(wordOX) != "undefined") {
    if (wordOX == "hide") {
        word.style.visibility = "hidden";
    }
}

    randomWord = wordsRand[0];
    let arr = randomWord.split(splitWord);
    w1 = arr[0];
    w2 = arr[1];
    if (w2 == undefined) {
        w2 = "";
    }

    if (hideSome != undefined && hideSome == "yes") {
        let wArr = w1.split("");
        let r = Math.floor(Math.random() * wArr.length);
        wArr.splice(r, 1, "﹏");
        let wTxt = wArr.join("");
        word.innerHTML = wTxt;
        //隱藏題目其中一個字元;
    } else {
        word.innerHTML = w1;
    }

    small.innerHTML = w2;
    //small.innerHTML = "　";
    text.placeholder = w2;
	//ppp(w1);



    //kk(w1);
    playThat();

}

function playThat() {
	let ttsUrl;
    if (myMute != "yes" && playMp3 == "yes") {
        ppp(w1);
    }
    if (myMute != "yes" && playMp3 == "zh") {
		ttsUrl = 'https://translate.google.com/translate_tts?ie=UTF-8&tl=zh_tw&client=tw-ob&ttsspeed=1&q=' + w1;
        kk(ttsUrl);
    }
    if (myMute != "yes" && playMp3 == "en") {
		ttsUrl = 'https://translate.google.com/translate_tts?ie=UTF-8&tl=en&client=tw-ob&ttsspeed=1&q=' + w1;
        kk(ttsUrl);
    }
    //播放聲音;
}

function updateScore() {
    score++;
    scoreEl.innerHTML = score;
}

function updateTime() {
    time--;
    timeEl.innerHTML = time + " 秒";

    if (xie.style.width > settingBtn.style.width) {
        //console.log(Number(xie.style.width.slice(0,-2)));
    } else if (xie.style.width < container.style.width) {}


    if (time > timeScreen) {
        xie.style.width = screenWidth + "px";
    } else {
        xie.style.width = (time * screenWidth) / timeScreen + "px";
    }
    if (time === 0) {
        clearInterval(timeInterval);
        gameOver();
    }
}

function gameOver() {
	let average = parseInt(timeScreen / score);
    startBtn.disabled = true; //開始按鈕禁止按;
    settings.classList.toggle("hide");
    endgameEl.innerHTML = `
        <h1>🏅成績：${score} 字詞</h1>
        <p>⏳總時間：${timeScreen}秒<br />😊約${average}秒1字詞</p>
        <button onclick="location.reload();startGame();">🔄 重新開始</button>
		`;
    endgameEl.style.display = "flex";
}


/*
text.addEventListener("keyup", (e) => {
    let t = "";
	t = e.target.value;
	//t = t.replace(/[ㄅ-ㄩˇˋˊ]/g, "")
	if (t.match(/[ㄅ-ㄩˇˋˊ]/) && t.match(/[\u4e00-\u9fa5]/)){
		//如果用注音輸入法輸入一個漢字，再加上注音;
		text.value="";
		e.target.value="";
		console.log(t);
	}else if (t.match(/[\u4e00-\u9fa5]/) && t.length >=2){
		//如果一次輸入兩個漢字;
		console.log("2：" +t);	
	}
});
*/

listenKey(13);

function listenKey(key) {
    text.addEventListener("keyup", (e) => {
        //按下Enter後判斷;
        let insetedText = e.target.value;
        insetedText = insetedText.trim();

        text.className = "";

        if (event.keyCode === key) {

            if (insetedText == w1) {
                //small.innerHTML = "　";

                if (wrong == 0) {
                    //如果沒有打錯;
                    wordsRand.shift(); //刪頭;
                    wordsRand.push(randomWord); //添尾;
                } else {
                    //如果有打錯;
                    wordsRand.shift(); //刪頭;
                    wordsRand.splice(4, 0, randomWord); //添到第四個，再練習;
                    wrong = 0; //恢復打錯計數為0;
                    wrongArr = [];
                }
                addWordToDOM();
                //kk(w1);//播放聲音;

                updateScore();
                e.target.value = "";
                if (difficulty == "hard") {
                    //time += 2;
                } else if (difficulty == "average") {
                    //time += 3;
                } else {
                    //time += 4;
                }
            } else {
                small.innerHTML = w2;
                wrong = wrong + 1; //打錯時，錯誤+1;
                playThat();
				//kk2("https://sutian.moe.edu.tw/media/subak/1/1234.wav");

                text.className = "niu"; //發出錯誤震動;					
                insetedText = insetedText.trim();
                e.target.value = e.target.value.trim();
                wrongArr.push(e.target.value);
                let wrongT1 = wrongArr[wrongArr.length - 1];
                let wrongT2 = wrongArr[wrongArr.length - 2];

                if (e.target.value.length > 0) {
                    word.style.visibility = "visible";
                    if (wrong > 1 && wrongT1 != wrongT2) {
                        word.innerHTML = w1;
                    }
                }
                // 如果有打字，但打錯，則顯示題目;
                // 錯一次顯示 te_t，錯兩次且打的字有不一樣則顯示全部 text;
                if (wrong > 3) {
                    e.target.value = "";
                    wrong = 0;
                }
                // 錯四次，就自動清空;
                if (wrong > 1 && wrongT1 == wrongT2) {
                    e.target.value = "";
                    wrong = 0;
                }
                // 錯三次，並直接送出相同字元，則清空;
            }
            //updateTime();	  
        }
    });
}

function listenKeyDelete(key) {
    text.addEventListener("keyup", (event) => {
        if (event.keyCode === key) {
            event.target.value = "";
        }
    });
}


if (typeof(rpInput) != "undefined") {
    //輸入文字時，聲調取代;
    if (rpInput == "kasu") {
        rpInputHakkaTone();
    } else if (rpInput == "hakka") {
        rpInputHakkaTone();
    } else if (rpInput == "holo") {
        rpInputHoloTone();
    } else if (rpInput == "matsu") {
        rpInputMatsuTone();
    }
}




function rpInputHakkaTone() {
    text.addEventListener('input', function(event) {
        let t = text.value;
        t = t.replace(/([aeioumngr])(z)/gi, '$1ˊ')
            .replace(/([aeioumngr])(v)/gi, '$1ˇ')
            .replace(/([aeioumngr])(s)/gi, '$1ˋ')
            .replace(/([aeioumngr])(x)/gi, '$1ˆ')
            .replace(/([aeioumngr])(f)/gi, '$1⁺');
        text.value = t;
    });
}




function rpInputHoloTone() {
    // 偵聽閩南語聲調;
    text.addEventListener('input', function(event) {
        text.value = rpTxtHoloTone(text.value);
    });
}

function rpTxtHoloTone(t) {
    // 閩南語聲調 數字轉調號;
    t = t.replace(/([aǎāàáâa̍oǒòóôōo̍eēěèéêe̍iǐìíîīi̍uǔūùúûu̍mm̀m̂m̄m̌ḿm̍nńn̂n̄ňǹn̍gr])(4|1)/gi, '$1');
    t = t.replace(/([aǎāàáâa̍oǒòóôōo̍eēěèéêe̍iǐìíîīi̍uǔūùúûu̍mm̀m̂m̄m̌ḿm̍nńn̂n̄ňǹn̍gr])(8|l)/gi, '$1');

    t = t.replace(/([aeiounm])([aiueorg]{0,2})([ptkh])([1234567zsvxf])/gi, '$1$2$3');
    t = t.replace(/([aeionum])(̍)([aiueorg]{0,2})([ptkh])([1235678zsvxfl])/gi, '$1$2$3$4');
    t = t.replace(/([aeiounm])(̍)([aiueorg]{0,2})([ptkh])([4])/gi, '$1$3$4');
    t = t.replace(/(n)(̍g)([aiueor]{0,2})([ptkh])([4])/gi, 'ng$3$4');
    t = t.replace(/(n)(̍)([aiueor]{0,2})([ptkh])([4])/gi, 'n$3$4');

    t = t.replace(/([aǎāàáâa̍])([aeioumngr]{0,3})(7|f)/gi, 'ā$2');
    t = t.replace(/([oǒòóôōo̍])([aeioumngr]{0,3})(7|f)/gi, 'ō$2');
    t = t.replace(/([eēěèéêe̍])([aeioumngr]{0,3})(7|f)/gi, 'ē$2');

    t = t.replace(/([iǐìíîīi̍])([mngr]{0,2})(7|f)/gi, 'ī$2');
    t = t.replace(/([uǔūùúûu̍])([mngr]{0,2})(7|f)/gi, 'ū$2');
    t = t.replace(/([mḿ])(7|f)/gi, 'm̄');
    t = t.replace(/(m)([̂̄̌̀])(7|f)/gi, 'm̄');
    t = t.replace(/([nńǹ])(7|f)/gi, 'n̄');
    t = t.replace(/(n)([̂̄̌])(7|f)/gi, 'n̄');

    t = t.replace(/([aǎāàáâa̍])([aeioumngr]{0,3})(2|z)/gi, 'á$2');
    t = t.replace(/([oǒòóôōo̍])([aeioumngr]{0,3})(2|z)/gi, 'ó$2');
    t = t.replace(/([eēěèéêe̍])([aeioumngr]{0,3})(2|z)/gi, 'é$2');

    t = t.replace(/([iǐìíîīi̍])([mngr]{0,2})(2|z)/gi, 'í$2');
    t = t.replace(/([uǔūùúûu̍])([mngr]{0,2})(2|z)/gi, 'ú$2');
    t = t.replace(/([mḿ])(2|z)/gi, 'ḿ');
    t = t.replace(/(m)([̂̄̌̀])(2|z)/gi, 'ḿ');
    t = t.replace(/([nńǹ])(2|z)/gi, 'ń');
    t = t.replace(/(n)([̂̄̌])(2|z)/gi, 'ń');

    t = t.replace(/([aǎāàáâa̍])([aeioumngr]{0,3})(3|s)/gi, 'à$2');
    t = t.replace(/([oǒòóôōo̍])([aeioumngr]{0,3})(3|s)/gi, 'ò$2');
    t = t.replace(/([eēěèéêe̍])([aeioumngr]{0,3})(3|s)/gi, 'è$2');

    t = t.replace(/([iǐìíîīi̍])([mngr]{0,2})(3|s)/gi, 'ì$2');
    t = t.replace(/([uǔūùúûu̍])([mngr]{0,2})(3|s)/gi, 'ù$2');
    t = t.replace(/([mḿ])(3|s)/gi, 'm̀');
    t = t.replace(/(m)([̂̄̌̀])(3|s)/gi, 'm̀');
    t = t.replace(/([nńǹ])(3|s)/gi, 'ǹ');
    t = t.replace(/(n)([̂̄̌])(3|s)/gi, 'ǹ');


    t = t.replace(/([aǎāàáâa̍])([aeioumngr]{0,3})(6|v)/gi, 'ǎ$2');
    t = t.replace(/([oǒòóôōo̍])([aeioumngr]{0,3})(6|v)/gi, 'ǒ$2');
    t = t.replace(/([eēěèéêe̍])([aeioumngr]{0,3})(6|v)/gi, 'ě$2');

    t = t.replace(/([iǐìíîīi̍])([mngr]{0,2})(6|v)/gi, 'ǐ$2');
    t = t.replace(/([uǔūùúûu̍])([mngr]{0,2})(6|v)/gi, 'ǔ$2');
    t = t.replace(/([mḿ])(6|v)/gi, 'm̌');
    t = t.replace(/(m)([̂̄̌̀])(6|v)/gi, 'm̌');
    t = t.replace(/([nńǹ])(6|v)/gi, 'ň');
    t = t.replace(/(n)([̂̄̌])(6|v)/gi, 'ň');

    t = t.replace(/([aǎāàáâa̍])([aeioumngr]{0,3})(5|x)/gi, 'â$2');
    t = t.replace(/([oǒòóôōo̍])([aeioumngr]{0,3})(5|x)/gi, 'ô$2');
    t = t.replace(/([eēěèéêe̍])([aeioumngr]{0,3})(5|x)/gi, 'ê$2');

    t = t.replace(/([iǐìíîīi̍])([mngr]{0,2})(5|x)/gi, 'î$2');
    t = t.replace(/([uǔūùúûu̍])([mngr]{0,2})(5|x)/gi, 'û$2');
    t = t.replace(/([mḿ])(5|x)/gi, 'm̂');
    t = t.replace(/(m)([̂̄̌̀])(5|x)/gi, 'm̂');
    t = t.replace(/([nńǹ])(5|x)/gi, 'n̂');
    t = t.replace(/(n)([̂̄̌])(5|x)/gi, 'n̂');


    t = t.replace(/([aǎāàáâa̍])([aeioumngrptkh]{0,3})(8|l)/gi, 'a̍$2');
    t = t.replace(/([oǒòóôōo̍])([aeioumngrptkh]{0,3})(8|l)/gi, 'o̍$2');
    t = t.replace(/([eēěèéêe̍])([aeioumngrptkh]{0,3})(8|l)/gi, 'e̍$2');

    t = t.replace(/([iǐìíîīi̍])([mngrptkh]{0,2})(8|l)/gi, 'i̍$2');
    t = t.replace(/([uǔūùúûu̍])([mngrptkh]{0,2})(8|l)/gi, 'u̍$2');
    t = t.replace(/([mm̀m̂m̄m̌ḿm̍])([ptkh])(8|l)/gi, 'm̍$2');
    t = t.replace(/([nńn̂n̄ňǹn̍]g)([ptkh])(8|l)/gi, 'n̍g$2');
    t = t.replace(/([nńn̂n̄ňǹn̍])([ptkh])(8|l)/gi, 'n̍$2');

    return t;
    /*
    ǎāàáâa̍
    oǒòóôōo̍
    eēěèéêe̍
    iǐìíîīi̍
    uǔūùúûu̍
    mm̀m̂m̄m̌ḿm̍
    nńn̂n̄ňǹn̍
    n̂
    n̄
    ň
    m̀
    m̂
    m̄
    m̌

    (n)(̂)
    (n)(̄)
    (n)(̌)

    (m)(̀)
    (m)(̂)
    (m)(̄)
    (m)(̌)

    ([̂̄̌])

    (n)(̂)
    (n)(̄)
    (n)(̌)

    ([̀̂̄̌])
    (m)(̀)
    (m)(̂)
    (m)(̄)
    (m)(̌)

    */
}


function rpInputMatsuTone() {
    text.addEventListener('input', function(event) {
        text.value = rpTxtMatsuTone(text.value);
    });
}

function rpTxtMatsuTone(t) {
    /*
    ([̄́̀̌̂])
    ȳ
    ý
    ỳ
    y̌
    ŷ

    */
    t = t.replace(/([aǎāàáâa̍oǒòóôōo̍eēěèéêe̍iǐìíîīi̍uǔūùúûu̍yȳýỳy̌ŷmm̀m̂m̄m̌ḿm̍nńn̂n̄ňǹn̍gr])([16890])/gi, '$1');

    t = t.replace(/([aǎāàáâ])([mngbdgaeiouyptkh]{0,3})(2|f)/gi, 'ā$2');
    t = t.replace(/([eēěèéê])([mngbdgaeiouyptkh]{0,3})(2|f)/gi, 'ē$2');
    t = t.replace(/([oǒòóôō])([mngbdgaeiouyptkh]{0,3})(2|f)/gi, 'ō$2');
    t = t.replace(/([iǐìíîī])([mngbdgptkh]{0,3})(2|f)/gi, 'ī$2');
    t = t.replace(/([uǔūùúû])([mngbdgptkh]{0,3})(2|f)/gi, 'ū$2');
    t = t.replace(/(y)([̄́̀̌̂])([mngbdgaeiouyptkh]{0,3})(2|f)/gi, 'ȳ$3');

    t = t.replace(/([mḿ])(2|f)/gi, 'm̄');
    t = t.replace(/(m)([̂̄̌̀])(2|f)/gi, 'm̄');
    t = t.replace(/([nńǹ])(2|f)/gi, 'n̄');
    t = t.replace(/(n)([̂̄̌])(2|f)/gi, 'n̄');



    t = t.replace(/([aǎāàáâ])([mngbdgaeiouyptkh]{0,3})(4|z)/gi, 'á$2');
    t = t.replace(/([eēěèéê])([mngbdgaeiouyptkh]{0,3})(4|z)/gi, 'é$2');
    t = t.replace(/([oǒòóôō])([mngbdgaeiouyptkh]{0,3})(4|z)/gi, 'ó$2');
    t = t.replace(/([iǐìíîī])([mngbdgptkh]{0,3})(4|z)/gi, 'í$2');
    t = t.replace(/([uǔūùúû])([mngbdgptkh]{0,3})(4|z)/gi, 'ú$2');
    t = t.replace(/(y)([̄́̀̌̂])([mngbdgaeiouyptkh]{0,3})(4|z)/gi, 'ý$3');

    t = t.replace(/([mḿ])(4|z)/gi, 'ḿ');
    t = t.replace(/(m)([̂̄̌̀])(4|z)/gi, 'ḿ');
    t = t.replace(/([nńǹ])(4|z)/gi, 'ń');
    t = t.replace(/(n)([̂̄̌])(4|z)/gi, 'ń');


    t = t.replace(/([aǎāàáâ])([mngbdgaeiouyptkh]{0,3})(5|s)/gi, 'à$2');
    t = t.replace(/([eēěèéê])([mngbdgaeiouyptkh]{0,3})(5|s)/gi, 'è$2');
    t = t.replace(/([oǒòóôō])([mngbdgaeiouyptkh]{0,3})(5|s)/gi, 'ò$2');
    t = t.replace(/([iǐìíîī])([mngbdgptkh]{0,3})(5|s)/gi, 'ì$2');
    t = t.replace(/([uǔūùúû])([mngbdgptkh]{0,3})(5|s)/gi, 'ù$2');
    t = t.replace(/(y)([̄́̀̌̂])([mngbdgaeiouyptkh]{0,3})(5|s)/gi, 'ỳ$3');

    t = t.replace(/([mḿ])(5|s)/gi, 'm̀');
    t = t.replace(/(m)([̂̄̌̀])(5|s)/gi, 'm̀');
    t = t.replace(/([nńǹ])(5|s)/gi, 'ǹ');
    t = t.replace(/(n)([̂̄̌])(5|s)/gi, 'ǹ');


    t = t.replace(/([aǎāàáâ])([mngbdgaeiouyptkh]{0,3})(3|v)/gi, 'ǎ$2');
    t = t.replace(/([eēěèéê])([mngbdgaeiouyptkh]{0,3})(3|v)/gi, 'ě$2');
    t = t.replace(/([oǒòóôō])([mngbdgaeiouyptkh]{0,3})(3|v)/gi, 'ǒ$2');
    t = t.replace(/([iǐìíîī])([mngbdgptkh]{0,3})(3|v)/gi, 'ǐ$2');
    t = t.replace(/([uǔūùúû])([mngbdgptkh]{0,3})(3|v)/gi, 'ǔ$2');
    t = t.replace(/(y)([̄́̀̌̂])([mngbdgaeiouyptkh]{0,3})(3|v)/gi, 'y̌$3');

    t = t.replace(/([mḿ])(3|v)/gi, 'm̌');
    t = t.replace(/(m)([̂̄̌̀])(3|v)/gi, 'm̌');
    t = t.replace(/([nńǹ])(3|v)/gi, 'ň');
    t = t.replace(/(n)([̂̄̌])(3|v)/gi, 'ň');

    t = t.replace(/([aǎāàáâ])([mngbdgaeiouyptkh]{0,3})(7|x)/gi, 'â$2');
    t = t.replace(/([eēěèéê])([mngbdgaeiouyptkh]{0,3})(7|x)/gi, 'ê$2');
    t = t.replace(/([oǒòóôō])([mngbdgaeiouyptkh]{0,3})(7|x)/gi, 'ô$2');
    t = t.replace(/([iǐìíîī])([mngbdgptkh]{0,3})(7|x)/gi, 'î$2');
    t = t.replace(/([uǔūùúû])([mngbdgptkh]{0,3})(7|x)/gi, 'û$2');
    t = t.replace(/(y)([̄́̀̌̂])([mngbdgaeiouyptkh]{0,3})(7|x)/gi, 'ŷ$3');

    t = t.replace(/([mḿ])(7|x)/gi, 'm̂');
    t = t.replace(/(m)([̂̄̌̀])(7|x)/gi, 'm̂');
    t = t.replace(/([nńǹ])(7|x)/gi, 'n̂');
    t = t.replace(/(n)([̂̄̌])(7|x)/gi, 'n̂');

    return t;
}



//settingBtn.addEventListener("click", () => settings.classList.toggle("hide"));
settingsForm.addEventListener("change", (e) => {
    difficulty = e.target.value;
    localStorage.setItem("difficulty", difficulty);
});
/*
settingsForm2.addEventListener("change", (e) => {
    let w = e.target.value;
	console.log("A")
    localStorage.setItem("wordArr", w);
});
*/
function set_random(arr) {
    return arr.sort(function() {
        return Math.random() - 0.5;
    });
}
/* 設定陣列亂數排序;	 */
























function kk2(y, c = 1) {
	// kk(音檔1 音檔2 音檔3, 速度與次數與v音量)
	// kk(y) 等同 kk(y, 1) 預設播放1次;
	// kk(y, 2) 播放2次;
	// kk(y, "0.8") 播放一次，速度分別為 0.8 ;
	// kk(y, "2 1") 播放兩次，速度分別為 2 跟 1 ;
	// kk(y, "0.8, 0.5, 1") 播放三次，速度分別為 0.8, 0.5, 1 。中間可用, 或空白來隔開;
	// kk(y, "nmn") h=1.5 q=1.2 s=0.5 m=0.8 n=1;
	//;
	// kk(y, "1 2v0.5 3") 其中 2v0.5 是 播放速度2，音量0.5；音量只能0~1 ;

    let i = 0; // 第i個音檔;
	let n = 0; // 播放第n次;
	let count; // 播放總次數;
	let rateArr = [];

	if( typeof(c) == "number"){
		count = c;
		rateArr = 1;
	}else if( typeof(c) == "string"){
		if(/[hqnms]/g.test(c)){
			let rr = Array.from(c.replace(/\s+/g, ""));
			c = rr.join(" ");
			c = c.replace(/h/g, "1.5");
			c = c.replace(/q/g, "1.2");
			c = c.replace(/n/g, "1");
			c = c.replace(/m/g, "0.8");
			c = c.replace(/s/g, "0.5");
		}
		c = c.replace(/,|;/g, " ");
		rateArr = c.replace(/\s+/g, " ").split(/ /);
		count = rateArr.length;	
	}

	let x = document.getElementById("WeSingAudioKK2");	
	if(!x){
		let audio = document.createElement("div");
		audio.innerHTML = `<audio id="WeSingAudioKK2"></audio>`
		document.getElementsByTagName("body")[0].appendChild(audio);	
	}
	x = document.getElementById("WeSingAudioKK2");	

    if (!kkUpUrl){
		kkUpUrl = "";	
	}else if (kkUpUrl != "" && kkUpUrl.slice(-1, ) != "/") {
        kkUpUrl = kkUpUrl + "/";
    }// 上層網址最右邊忘了/，則補上;

    y = y.replace(/\.mp3/g, ""); //移除.mp3，之後再加;
    y = y.trim().replace(/\s+/g, " "); // 移除多於空格;標音間空格改為空格，給後面切割;
    let arr = y.split(" ");
    let len = arr.length;
	let v = 1;

	myPlay();

	function myPlay() {
		mp3Url(arr[i]);
		if( typeof(c) == "number"){
			x.playbackRate = 1;
		}else{
			let r = rateArr[n];
			if(/v/g.test(rateArr[n])){
				r = rateArr[n].split("v")[0];
				v = rateArr[n].split("v")[1];
				if( v > 1 || v < 0 || v == ""){v=1}
			}
			//cc(v)
			x.playbackRate = r;
			x.volume = v;
		}
		x.play();
		x.onended = () => playStop();
		x.onerror = () => playStop();
	}
	function playStop() {
			if (i == len - 1  && n == count-1) {
				x.currentTime = 0
				x.pause();
			}else if (i == len - 1 || arr[i] == null) {
				i = 0;
				n += 1;
				myPlay();
				
			} else {
				i = i + 1;
				myPlay();
			}
	}
    function mp3Url(url) {
        if (url.match("https://drive.google")) {
            let re = /(\/d\/)(.*)(\/view)/gi;
            let txt = "https://docs.google.com/uc?export=download&id=" + url.match(re);
            txt = txt.replace(/(\/d\/)(.*)(\/view)/gi, "$2");
            // 若用Google雲端硬碟直接分享網址，被轉成可下載且播放網址;
            x.src = txt;
        } else if (url.match("https://docs.google")) {
            x.src = url;
            // 若用Google雲端硬碟可下載且播放網址;
        } else if (url.match("https://api.voicerss.org")) {
            x.src = url;
            // 若用api.voicerss.org，直接播放網址;
        } else if (url.match("https://sutian.moe.edu.tw/media/subak/")) {
            // 若是以 http 開頭，則直接以其網址為網址，並加回.wav;
            x.src = url + "";
        } else if (url.match("http")) {
            // 若是以 http 開頭，則直接以其網址為網址，並加回.mp3;
            x.src = url + ".mp3";
        } else {
            x.src = kkUpUrl + url + ".mp3";
            // 否則，以上網址 + 文字 + .mp3;
        }
        return;
    }
}


//=====================================;
/* kk('kaz su') 烏衣行連續音檔播放器;
<a onclick="kk('kaz su')">漢字</a>
*/
//var kkUpUrl = "https://twblg.dict.edu.tw/holodict_new/audio/"; 
// https://sutian.moe.edu.tw/media/subak/0/49.mp3
//可以在網頁自己指定預設音檔網址;
let kkUpUrl;


function kk(y, c = 1) {
	// kk(音檔1 音檔2 音檔3, 速度與次數與v音量)
	// kk(y) 等同 kk(y, 1) 預設播放1次;
	// kk(y, 2) 播放2次;
	// kk(y, "0.8") 播放一次，速度分別為 0.8 ;
	// kk(y, "2 1") 播放兩次，速度分別為 2 跟 1 ;
	// kk(y, "0.8, 0.5, 1") 播放三次，速度分別為 0.8, 0.5, 1 。中間可用, 或空白來隔開;
	// kk(y, "nmn") h=1.5 q=1.2 s=0.5 m=0.8 n=1;
	//;
	// kk(y, "1 2v0.5 3") 其中 2v0.5 是 播放速度2，音量0.5；音量只能0~1 ;

    let i = 0; // 第i個音檔;
	let n = 0; // 播放第n次;
	let count; // 播放總次數;
	let rateArr = [];

	if( typeof(c) == "number"){
		count = c;
		rateArr = 1;
	}else if( typeof(c) == "string"){
		if(/[hqnms]/g.test(c)){
			let rr = Array.from(c.replace(/\s+/g, ""));
			c = rr.join(" ");
			c = c.replace(/h/g, "1.5");
			c = c.replace(/q/g, "1.2");
			c = c.replace(/n/g, "1");
			c = c.replace(/m/g, "0.8");
			c = c.replace(/s/g, "0.5");
		}
		c = c.replace(/,|;/g, " ");
		rateArr = c.replace(/\s+/g, " ").split(/ /);
		count = rateArr.length;	
	}

	let x = document.getElementById("WeSingAudioKK");	
	if(!x){
		let audio = document.createElement("div");
		audio.innerHTML = `<audio id="WeSingAudioKK"></audio>`
		document.getElementsByTagName("body")[0].appendChild(audio);	
	}
	x = document.getElementById("WeSingAudioKK");	

    if (!kkUpUrl){
		kkUpUrl = "";	
	}else if (kkUpUrl != "" && kkUpUrl.slice(-1, ) != "/") {
        kkUpUrl = kkUpUrl + "/";
    }// 上層網址最右邊忘了/，則補上;

    y = y.replace(/\.mp3/g, ""); //移除.mp3，之後再加;
    y = y.trim().replace(/\s+/g, " "); // 移除多於空格;標音間空格改為空格，給後面切割;
    let arr = y.split("|"); //注意：分割音檔;
    let len = arr.length;
	let v = 1;

	myPlay();

	function myPlay() {
		mp3Url(arr[i]);
		if( typeof(c) == "number"){
			x.playbackRate = 1;
		}else{
			let r = rateArr[n];
			if(/v/g.test(rateArr[n])){
				r = rateArr[n].split("v")[0];
				v = rateArr[n].split("v")[1];
				if( v > 1 || v < 0 || v == ""){v=1}
			}
			//cc(v)
			x.playbackRate = r;
			x.volume = v;
		}
		x.play();
		x.onended = () => playStop();
		x.onerror = () => playStop();
	}
	function playStop() {
			if (i == len - 1  && n == count-1) {
				x.currentTime = 0
				x.pause();
			}else if (i == len - 1 || arr[i] == null) {
				i = 0;
				n += 1;
				myPlay();
				
			} else {
				i = i + 1;
				myPlay();
			}
	}
    function mp3Url(url) {
        if (url.match("https://drive.google")) {
            let re = /(\/d\/)(.*)(\/view)/gi;
            let txt = "https://docs.google.com/uc?export=download&id=" + url.match(re);
            txt = txt.replace(/(\/d\/)(.*)(\/view)/gi, "$2");
            // 若用Google雲端硬碟直接分享網址，被轉成可下載且播放網址;
            x.src = txt;
        } else if (url.match("https://translate.google")) {
            x.src = url;
            // 若用Google翻譯的TTS;
        } else if (url.match("https://docs.google")) {
            x.src = url;
            // 若用Google雲端硬碟可下載且播放網址;
        } else if (url.match("https://api.voicerss.org")) {
            x.src = url;
            // 若用api.voicerss.org，直接播放網址;
        } else if (url.match("https://sutian.moe.edu.tw/media/subak/")) {
            // 若是以 http 開頭，則直接以其網址為網址，並加回.wav;
            x.src = url + "";
        } else if (url.match("http")) {
            // 若是以 http 開頭，則直接以其網址為網址，並加回.mp3;
            x.src = url + ".mp3";
        } else {
            x.src = kkUpUrl + url + ".mp3";
            // 否則，以上網址 + 文字 + .mp3;
        }
        return;
    }
}


function ppp(w){
        //播放音檔;
        // "http://api.voicerss.org/?key=" + key + "&hl=en-us&v=Amy&src=" + words
        //let ttsUrl = "https://api.voicerss.org/?key=" + ttsArr[0] + "&hl=zh-tw&r=-2&v=" + voiceEnArr[0] + "&src=" + w + "," + w + ".";
        // play(ttsUrl);
        // kk("02426.mp3|02425.mp3");
		let ttsUrl = 'https://translate.google.com/translate_tts?ie=UTF-8&tl=zh_tw&client=tw-ob&ttsspeed=1&q=' + w;
		kk(ttsUrl);
        // ttsArr.push(ttsArr[0]); // API 陣列置後;
        // ttsArr.splice(0, 1);
        // voiceEnArr.push(ttsArr[0]); // API 陣列置後;
        // voiceEnArr.splice(0, 1);
}




/* kk('kaz su') 烏衣行連續音檔播放器;

<a onclick="kk('kaz su')">漢字</a>
*/

/*
document.write('<audio id=\"WeSingAudioKK\"></audio>');

//var kkUpUrl = "https://twblg.dict.edu.tw/holodict_new/audio/";
var kkUpUrl = "http://oikasu.com/file/mp3/";

//可以在網頁自己指定預設音檔網址;
//var kkUpUrl;

function kk(myYin) {
    var x = document.getElementById("WeSingAudioKK");

    if (!kkUpUrl) {
        kkUpUrl = "";
    }

    if (kkUpUrl != "" && kkUpUrl.slice(-1, ) != "/") {
        kkUpUrl = kkUpUrl + "/";
    }
    // 上層網址最右邊忘了/，則補上;

    myYin = myYin.replace(/\.mp3/g, ""); //移除.mp3，之後再加;
    myYin = myYin.trim(); //移除多於空格;
    myYin = myYin.replace(/\s+/g, "|"); // 標音間空格改為直豎|，給後面切割;

    var myArr = myYin.split("|");
    var myArrLen = myArr.length;
    //分割標音陣列;

    var i = 0;

    function mp3Url(myUrl) {
        if (myUrl.match("https://drive.google")) {
            let re = /(\/d\/)(.*)(\/view)/gi;
            let txt = "https://docs.google.com/uc?export=download&id=" + myUrl.match(re);
            txt = txt.replace(/(\/d\/)(.*)(\/view)/gi, "$2");
            // 若用Google雲端硬碟直接分享網址，被轉成可下載且播放網址;
            x.src = txt;
        } else if (myUrl.match("https://docs.google")) {
            x.src = myUrl;
            // 若用Google雲端硬碟可下載且播放網址;
        } else if (myUrl.match("https://api.voicerss.org")) {
            x.src = myUrl;
            // 若用api.voicerss.org，直接播放網址;
        } else if (myUrl.match("https://sutian.moe.edu.tw")) {
            // 若是以 http 開頭，則直接以其網址為網址，並加回.mp3;
            x.src = myUrl + ".mp3";
			//https://sutian.moe.edu.tw/media/subak/1/1254.mp3;
        } else if (myUrl.match("http")) {
            // 若是以 http 開頭，則直接以其網址為網址，並加回.mp3;
            x.src = myUrl + ".mp3";
        } else {
            x.src = kkUpUrl + myUrl + ".mp3";
            // 否則，以上網址 + 文字 + .mp3;
        }
        return;
    }
    mp3Url(myArr[i]);

    x.play();

    x.onended = function() {
        if (i == myArrLen - 1 || myArr[i] == null) {
            x.currentTime = 0
            x.pause();
        } else {
            i = i + 1;
            mp3Url(myArr[i]);
            x.play();
        }
    }

    x.onerror = function() {
        //如果始路徑錯誤，就跳過;
        if (i == myArrLen - 1) {
            //如果最後一個是錯誤路徑，就結束;
            x.currentTime = 0
            x.pause();
        } else {
            i = i + 1;
            mp3Url(myArr[i]);
            x.play();
        }
    }
}


function ppp(w) {
    //播放音檔;
    // "http://api.voicerss.org/?key=" + key + "&hl=en-us&v=Amy&src=" + words
    let ttsUrl = "https://api.voicerss.org/?key=" + ttsArr[0] + "&hl=zh-tw&r=-2&v=" + voiceEnArr[0] + "&src=" + w + "," + w + ".";
    // play(ttsUrl);
    // kk("02426.mp3|02425.mp3");
    kk(ttsUrl);
    ttsArr.push(ttsArr[0]); // API 陣列置後;
    ttsArr.splice(0, 1);
    voiceEnArr.push(ttsArr[0]); // API 陣列置後;
    voiceEnArr.splice(0, 1);
}

*/

/*
function multipleReplace(arr, rpObj) {
  return arr.map((item) => {
    for (const key in rpObj) {
      const value = rpObj[key];
      item = item.replace(new RegExp(key, 'g'), value);
    }
    return item;
  });
}

const arr = ['[abac]', '[dd,c]', '[kbf]'];

const replacements = {
  '(b)([aei])': 'v$2',  
  // 正則表達式替換;
  'c': 'x',
  'b': 'm',
  'a': 'q',
};

const result = multipleReplace(arr, replacements);
console.log(result); // ['[qm,x]', '[ddc]', '[kbf]']

*/

//-----------------------//


/*
function arrObjReplace(arr, obj) {
  return arr.map((item) => {
    for (const key in obj) {
      item = item.split(key).join(obj[key]);
    }
    return item;
  });
}

const arr = ['[ab,c]', '[ddc]', '[kbf]'];
const ruleObj = {
  'c': 'x',
  'b': 'm',
  'a': 'q',
  'd': 'z',
};

const result = arrObjReplace(arr, ruleObj);
console.log(result); // ['[qm,x]', '[zzx]', '[kmf]']


const myArr = [
  "c:x",
  "b:m",
  "a:q",
  "d:z",
];

const ruleObj = myArr.reduce((obj, item) => {
  const [key, value] = item.split(':');
  obj[key] = value;
  return obj;
}, {});

console.log(ruleObj);
// { 'c': 'x', 'b': 'm', 'a': 'q', 'd': 'z' }
*/