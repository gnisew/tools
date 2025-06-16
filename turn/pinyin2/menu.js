// 定義動態文字
const logoText = "烏衣行🥷";
const translateText = "拼音轉換";

const APP_ID = "translateText"; // 每個不同的應用都要有不同的 APP_ID，增加唯一識別符，用於區分不同的應用

// 語言配置 - 四縣
const langSixian = `
左邊選單	右邊選單	執行函數	左邊範例	右邊範例
拼音	注音	hakkaPinyinBpm	hagˋ gaˊ	ㄏㄚㄍˋ ㄍㄚˊ
注音	拼音字尾調	hakkaBpmPinyinTone	ㄏㄚㄍˋ ㄍㄚˊ	hagˋ gaˊ
拼音	字尾調	hakkaPinyinTone	hags gaz nginv	hagˋ gaˊ nginˇ
拼音	字中調	hakkaPinyinLetter	hagˋ gaˊ nginˇ	hàg gá ngǐn
拼音	字母調	hakkaPinyinZvs	hagˋ gaˊ nginˇ	hags gaz nginv
拼音	調值	sixianToneNumbers	hagˋ gaˊ nginˇ	hag2 ga24 ngin11
調值	字尾調	sixianNumbersTone	hag2 ga24 ngin11	hagˋ gaˊ nginˇ
字尾調	字中調	hakkaToneLetter	hagˋ gaˊ nginˇ	hàg gá ngǐn
字尾調	字母調	hakkaToneZvs	hagˋ gaˊ nginˇ	hags gaz nginv
字母調	字尾調	hakkaZvsTone	hags gaz nginv	hagˋ gaˊ nginˇ
字母調	字中調	hakkaZvsLetter	hags gaz nginv	hàg gá ngǐn
字中調	字尾調	hakkaLetterTone	hàg gá ngǐn	hagˋ gaˊ nginˇ
字中調	字母調	hakkaLetterZvs	hàg gá ngǐn	hags gaz nginv
詞彙本調	詞彙變調	sixianPinyinChange	tienˊ gongˊ	tienˇ gongˊ
教會羅馬字	客語拼音(字尾調)	sixianPojEduTone	Hak-kâ-ngî ke sṳ	Hagˋ-gaˊ-ngiˊ ge sii
教會羅馬字	客語拼音(字中調)	sixianPojEduLetter	Hak-kâ-ngî ke sṳ	Hàg-gá-ngí ge sii
教會羅馬字	客語拼音(字母調)	sixianPojEduZvs	Hak-kâ-ngî ke sṳ	Hags-gaz-ngiz ge sii
`;



	
	
	
// 客語拼音轉注音
function hakkaPinyinBpm(t){ 
	console.log(t)
	if (regexLetter.test(t)) {t = hakkaLetterZvs(t) }
	console.log(t)
	if (regexTone.test(t)) {t = hakkaToneToZvs(t) }	
	console.log(t)
		t = hakkaPinyinToBpm(t)
		console.log(t)
	return t;
}

// 客語注音轉拼音字尾調
function hakkaBpmPinyinTone(t){ 
	t = hakkaBpmToPinyin(t);
	return hakkaToneToFX(t);	
}

// 客語拼音轉字尾調
function hakkaPinyinTone(t){ 
	if (regexLetter.test(t)) {t = hakkaLetterTone(t) }
	if (regexZvs.test(t)) {t = hakkaZvsTone(t) }
	t = hakkaToneToFX(t);
	return t;
}

// 客語拼音轉字中調
function hakkaPinyinLetter(t){ 
	if (regexTone.test(t)) {t = hakkaToneLetter(t) }
	if (regexZvs.test(t)) {t = hakkaZvsLetter(t) }
	return t;
}

// 客語拼音轉字母調
function hakkaPinyinZvs(t){ 
	if (regexLetter.test(t)) {t = hakkaLetterZvs(t) }
	if (regexTone.test(t)) {t = hakkaToneToZvs(t) }
	return t;
}



// 客語字母調轉字尾調
function hakkaZvsTone(t){ 
	t = hakkaToneToFX(t)	
	return hakkaZvsToTone(t);	}
// 客語字母調轉字中調
function hakkaZvsLetter(t){ return hakkaZvsToLetter(t);}
// 客語字中調轉字母調
function hakkaLetterZvs(t){ 	return letterToZvs(t);}
// 客語字中調轉字尾調
function hakkaLetterTone(t){ 
	t = hakkaToneToFX(t)
	t = letterToZvs(t)
	return hakkaZvsToTone(t);
}
// 客語字尾調轉字母調
function hakkaToneZvs(t){ return hakkaToneToZvs(t);}

// 客語字尾調轉字中調
function hakkaToneLetter(t){ 
	t = hakkaToneToZvs(t);
	return hakkaZvsToLetter(t);
}


// 四縣教羅轉客拼字尾調
function sixianPojEduTone(t){
	t = sixianPojVowelToEdu(t);
	t = sixianPojConsonantToEdu(t);
	t = hakkaZvsToTone(t);
	return t;
}

// 四縣教羅轉客拼字中調
function sixianPojEduLetter(t){
	t = sixianPojVowelToEdu(t);
	t = sixianPojConsonantToEdu(t);
	t = hakkaZvsToLetter(t);
	return t;
}


// 四縣教羅轉客拼字母調
function sixianPojEduZvs(t){
	t = sixianPojVowelToEdu(t);
	t = sixianPojConsonantToEdu(t);
	return t;
}

// 四縣拼音轉變調
function sixianPinyinChange(t){ 
	if (regexLetter.test(t)) {t = hakkaLetterZvs(t) }
	if (regexTone.test(t)) {t = hakkaToneToZvs(t) }
	t = sixianPinyinToChange(t);
	t = hakkaZvsToTone(t)
	return t;
}


// 四縣聲調轉調值
function sixianToneNumbers(t){ 
	if (regexLetter.test(t)) {t = hakkaLetterZvs(t) }
	if (regexTone.test(t)) {t = hakkaToneToZvs(t) }
	t = sixianToneToNumbers(t);
	return t;
}
// 四縣調值轉字尾調
function sixianNumbersTone(t){ return sixianNumbersToTone(t);}




// 海陸語言配置
const langHailu = `
左邊選單	右邊選單	執行函數	左邊範例	右邊範例
拼音	注音	hakkaPinyinBpm	aˋ aˊ	ㄚˋ ㄚˊ
注音	拼音字尾調	hakkaBpmPinyinTone	ㄚˋ ㄚˊ	aˋ aˊ
拼音	字尾調	hakkaPinyinTone	az av as ax af	aˊ aˇ aˋ aˆ a⁺
拼音	字中調	hakkaPinyinLetter	aˊ aˇ aˋ aˆ a⁺	á ǎ à â ā
拼音	字母調	hakkaPinyinZvs	aˊ aˇ aˋ aˆ a⁺	az av as ax af
拼音	調值	hailuToneNumbers	aˊ	a24
調值	字尾調	hailuNumbersTone	a24	aˊ
字尾調	字中調	hakkaToneLetter	aˊ aˇ aˋ aˆ a⁺	á ǎ à â ā
字尾調	字母調	hakkaToneZvs	aˊ aˇ aˋ aˆ a⁺	az av as ax af
字母調	字尾調	hakkaZvsTone	az av as ax af	aˊ aˇ aˋ aˆ a⁺
字母調	字中調	hakkaZvsLetter	az av as ax af	á ǎ à â ā
字中調	字尾調	hakkaLetterTone	á ǎ à â ā	aˊ aˇ aˋ aˆ a⁺
字中調	字母調	hakkaLetterZvs	á ǎ à â ā	az av as ax af
詞彙本調	詞彙變調	hailuPinyinChange	hoˊ honˇ	ho⁺ honˇ
`;

// 海陸拼音轉變調
function hailuPinyinChange(t){ 
	if (regexLetter.test(t)) {t = hakkaLetterZvs(t) }
	if (regexTone.test(t)) {t = hakkaToneToZvs(t) }
	t = hailuPinyinToChange(t);
	t = hakkaZvsToTone(t)
	return t;
}

// 海陸聲調轉調值
function hailuToneNumbers(t){ 
	if (regexLetter.test(t)) {t = hakkaLetterZvs(t) }
	if (regexTone.test(t)) {t = hakkaToneToZvs(t) }
	t = hailuToneToNumbers(t);
	return t;
}
// 海陸調值轉字尾調
function hailuNumbersTone(t){ return hailuNumbersToTone(t);}


// 大埔語言配置
const langDapu = `
左邊選單	右邊選單	執行函數	左邊範例	右邊範例
拼音	注音	hakkaPinyinBpm	aˋ aˊ	ㄚˋ ㄚˊ
注音	拼音字尾調	hakkaBpmPinyinTone	ㄚˋ ㄚˊ	aˋ aˊ
拼音	字尾調	hakkaPinyinTone	az av as ax af	aˊ aˇ aˋ aˆ a⁺
拼音	字中調	hakkaPinyinLetter	aˊ aˇ aˋ aˆ a⁺	á ǎ à â ā
拼音	字母調	hakkaPinyinZvs	aˊ aˇ aˋ aˆ a⁺	az av as ax af
拼音	調值	dapuToneNumbers	aˆ	a31
調值	字尾調	dapuNumbersTone	a31	aˆ
字尾調	字中調	hakkaToneLetter	aˊ aˇ aˋ aˆ a⁺	á ǎ à â ā
字尾調	字母調	hakkaToneZvs	aˊ aˇ aˋ aˆ a⁺	az av as ax af
字母調	字尾調	hakkaZvsTone	az av as ax af	aˊ aˇ aˋ aˆ a⁺
字母調	字中調	hakkaZvsLetter	az av as ax af	á ǎ à â ā
字中調	字尾調	hakkaLetterTone	á ǎ à â ā	aˊ aˇ aˋ aˆ a⁺
字中調	字母調	hakkaLetterZvs	á ǎ à â ā	az av as ax af
詞彙本調	詞彙變調	dapuPinyinChange	sin⁺ ngienˇ	sinˊ ngienˇ
`;

// 大埔拼音轉變調
function dapuPinyinChange(t){ 
	if (regexLetter.test(t)) {t = hakkaLetterZvs(t) }
	if (regexTone.test(t)) {t = hakkaToneToZvs(t) }
	t = dapuPinyinToChange(t);
	t = hakkaZvsToTone(t)
	return t;
}

// 大埔聲調轉調值
function dapuToneNumbers(t){ 
	if (regexLetter.test(t)) {t = hakkaLetterZvs(t) }
	if (regexTone.test(t)) {t = hakkaToneToZvs(t) }
	t = dapuToneToNumbers(t);
	return t;
}
// 大埔調值轉字尾調
function dapuNumbersTone(t){ return dapuNumbersToTone(t);}

// 饒平語言配置
const langRaoping = `
左邊選單	右邊選單	執行函數	左邊範例	右邊範例
拼音	注音	hakkaPinyinBpm	aˋ aˊ	ㄚˋ ㄚˊ
注音	拼音字尾調	hakkaBpmPinyinTone	ㄚˋ ㄚˊ	aˋ aˊ
拼音	字尾調	hakkaPinyinTone	az av as ax af	aˊ aˇ aˋ aˆ a⁺
拼音	字中調	hakkaPinyinLetter	aˊ aˇ aˋ aˆ a⁺	á ǎ à â ā
拼音	字母調	hakkaPinyinZvs	aˊ aˇ aˋ aˆ a⁺	az av as ax af
拼音	調值	raopingToneNumbers	aˊ	a24
調值	字尾調	raopingNumbersTone	a24	aˊ
字尾調	字中調	hakkaToneLetter	aˊ aˇ aˋ aˆ a⁺	á ǎ à â ā
字尾調	字母調	hakkaToneZvs	aˊ aˇ aˋ aˆ a⁺	az av as ax af
字母調	字尾調	hakkaZvsTone	az av as ax af	aˊ aˇ aˋ aˆ a⁺
字母調	字中調	hakkaZvsLetter	az av as ax af	á ǎ à â ā
字中調	字尾調	hakkaLetterTone	á ǎ à â ā	aˊ aˇ aˋ aˆ a⁺
字中調	字母調	hakkaLetterZvs	á ǎ à â ā	az av as ax af
詞彙本調	詞彙變調	raopingPinyinChange	denˊ lu⁺	den⁺ lu⁺
`;

// 饒平拼音轉變調
function raopingPinyinChange(t){ 
	if (regexLetter.test(t)) {t = hakkaLetterZvs(t) }
	if (regexTone.test(t)) {t = hakkaToneToZvs(t) }
	t = raopingPinyinToChange(t);
	t = hakkaZvsToTone(t)
	return t;
}

// 饒平聲調轉調值
function raopingToneNumbers(t){ 
	if (regexLetter.test(t)) {t = hakkaLetterZvs(t) }
	if (regexTone.test(t)) {t = hakkaToneToZvs(t) }
	t = raopingToneToNumbers(t);
	return t;
}
// 饒平調值轉字尾調
function raopingNumbersTone(t){ return raopingNumbersToTone(t);}

// 詔安語言配置
const langKasu = `
左邊選單	右邊選單	執行函數	左邊範例	右邊範例
拼音	字尾調	hakkaPinyinTone	az av as ax af	aˊ aˇ aˋ aˆ a⁺
拼音	字中調	hakkaPinyinLetter	aˊ aˇ aˋ aˆ a⁺	á ǎ à â ā
拼音	字母調	hakkaPinyinZvs	aˊ aˇ aˋ aˆ a⁺	az av as ax af
拼音	調值	kasuToneNumbers	aˊ	a24
調值	字尾調	kasuNumbersTone	a24	aˊ
字尾調	字中調	hakkaToneLetter	aˊ aˇ aˋ aˆ a⁺	á ǎ à â ā
字尾調	字母調	hakkaToneZvs	aˊ aˇ aˋ aˆ a⁺	az av as ax af
字母調	字尾調	hakkaZvsTone	az av as ax af	aˊ aˇ aˋ aˆ a⁺
字母調	字中調	hakkaZvsLetter	az av as ax af	á ǎ à â ā
字中調	字尾調	hakkaLetterTone	á ǎ à â ā	aˊ aˇ aˋ aˆ a⁺
字中調	字母調	hakkaLetterZvs	á ǎ à â ā	az av as ax af
詞彙本調	詞彙變調	kasuPinyinChange	kaˊ su	ka su
`;

// 詔安拼音轉變調
function kasuPinyinChange(t){ 
	if (regexLetter.test(t)) {t = hakkaLetterZvs(t) }
if (regexTone.test(t)) {t = hakkaToneToZvs(t) }
	t = kasuPinyinToChange(t);
	t = hakkaZvsToTone(t)
	return t;
}

// 詔安聲調轉調值
function kasuToneNumbers(t){ 
	if (regexLetter.test(t)) {t = hakkaLetterZvs(t) }
	if (regexTone.test(t)) {t = hakkaToneToZvs(t) }
	t = kasuToneToNumbers(t);
	return t;
}
// 詔安調值轉字尾調
function kasuNumbersTone(t){ return kasuNumbersToTone(t);}




// 和樂語言配置
const langHolo = `
左邊選單	右邊選單	執行函數	左邊範例	右邊範例
拼音	台羅	holoPinyinLetter	Tsiau3-an1 Kheh4-ue7 ti7 Lun7-pue3	Tsiàu-an Kheh-uē tī Lūn-puè
拼音	數字調	holoPinyinNumber	Tsiau3-an1 Kheh4-ue7 ti7 Lun7-pue3	Tsiau3-an1 Kheh4-ue7 ti7 Lun7-pue3
拼音	字母調	holoPinyinZvs	Tsiau3-an1 Kheh4-ue7 ti7 Lun7-pue3	Tsiaus-an Kheh-uef tif Lunf-pues
拼音	國際音標	holoPinyinIpa	Tsiàu-an Kheh-uē tī Lūn-puè	ʦiau3-an1 kʰeʔ4-ue7 ti7 lun7-pue3
台羅	數字調	holoToneNumber	Tsiàu-an Kheh-uē tī Lūn-puè	Tsiau3-an1 Kheh4-ue7 ti7 Lun7-pue3
台羅	字母調	holoToneZvs	Tsiàu-an Kheh-uē tī Lūn-puè	Tsiaus-an Kheh-uef tif Lunf-pues
台羅	國際音標	holoPinyinIpa	Tsiàu-an Kheh-uē tī Lūn-puè	ʦiau3-an1 kʰeʔ4-ue7 ti7 lun7-pue3
數字調	台羅	holoNumberTone	Tsiau3-an1 Kheh4-ue7 ti7 Lun7-pue3	Tsiàu-an Kheh-uē tī Lūn-puè
數字調	字母調	holoNumberZvs	Tsiau3-an1 Kheh4-ue7 ti7 Lun7-pue3	Tsiaus-an Kheh-uef tif Lunf-pues
字母調	台羅	holoZvsTone	Tsiaus-an Kheh-uef tif Lunf-pues	Tsiàu-an Kheh-uē tī Lūn-puè
字母調	數字調	holoZvsNumber	Tsiaus-an Kheh-uef tif Lunf-pues	Tsiau3-an1 Kheh4-ue7 ti7 Lun7-pue3
教羅	台羅	holoPojTailo	Chiàu-an Kheh-oē tī Lūn-poè	Tsiàu-an Kheh-uē tī Lūn-puè
國際音標	台羅	holoIpaTailo	ʦiau3 an1 kʰeʔ4 ue7 ti7 lun7 pue3	tsiàu an kheh uē tī lūn puè
國際音標	台羅數字	holoIpaNumber	ʦiau3 an1 kʰeʔ4 ue7 ti7 lun7 pue3	tsiau3 an1 kheh4 ue7 ti7 lun7 pue3
`;

function holoPinyinLetter(t){
	if (regexNumber.test(t)) {t = holoNumberToTone(t) }
	if (regexZvs.test(t)) {t = holoZvsToTone(t) }
	return t;
}

function holoPinyinNumber(t){
	if (regexLetter.test(t)) {t = letterToZvs(t) }
	return holoZvsToNumber(t);
}

function holoPinyinZvs(t){ 
	if (regexLetter.test(t)) {t = letterToZvs(t) }
	if (regexNumber.test(t)) {t = holoNumberToZvs(t) }
	return t;
}

function holoPinyinIpa(t){
	if (regexLetter.test(t)) {t = letterToZvs(t) }
	if (regexZvs.test(t)) {t = holoZvsToNumber(t) }
	return holoTailoToIpa(t);
}

function holoTailoIpa(t){
	if (regexLetter.test(t)) {t = letterToZvs(t) }
	if (regexZvs.test(t)) {t = holoZvsToNumber(t) }
	return holoTailoToIpa(t);
}

function holoIpaNumber(t){
	return holoIpaToNumber(t);
}

function holoIpaTailo(t){
	t = holoIpaToNumber(t);
	return holoNumberToTone(t);
}


function holoToneNumber(t){ 
	t = letterToZvs(t)
	return holoZvsToNumber(t); }
function holoToneZvs(t){ return letterToZvs(t); }
function holoNumberTone(t){ return holoNumberToTone(t); }
function holoNumberZvs(t){ return holoNumberToZvs(t); }
function holoZvsTone(t){ return holoZvsToTone(t); }
function holoZvsNumber(t){ return holoZvsToNumber(t); }
function holoPojTailo(t){ return holoPojToTailo(t); }
function holoIpaTailo(t){ return holoIpaToTailo(t); }


// 馬祖語言配置
const langMatsu = `
左邊選單	右邊選單	執行函數	左邊範例	右邊範例
拼音	注音	matsuPinyinBpm	ma⁺ tsu⁺	ㄇㄚ⁺ ㄗㄨ⁺
拼音	拼音(尾調形)	matsuPinyinTone	ma⁺ tsu⁺	ma⁺ tsu⁺
拼音	拼音(數字調)	matsuPinyinNumber	ma⁺ tsu⁺	ma2 tsu2
拼音	拼音(字中調)	matsuPinyinLetter	ma⁺ tsu⁺	mā tsū
拼音	拼音(字母調)	matsuPinyinZvs	ma⁺ tsu⁺	maf tsuf
注音	拼音(尾調形)	matsuBpmPinyinTone	ㄇㄚ⁺ ㄗㄨ⁺	ma⁺ tsu⁺
注音	拼音(數字調)	matsuBpmPinyinNumber	ㄇㄚ⁺ ㄗㄨ⁺	ma2 tsu2
注音	拼音(字中調)	matsuBpmPinyinLetter	ㄇㄚ⁺ ㄗㄨ⁺	mā tsū
注音	拼音(字母調)	matsuBpmPinyinZvs	ㄇㄚ⁺ ㄗㄨ⁺	maf tsuf
本音拼音	變音(尾調形)	matsuPinyinOriginalChangeTone	ma⁺ tsu⁺	maˊ ju⁺
本音拼音	變音(字母調)	matsuPinyinOriginalChangeZvs	ma⁺ tsu⁺	maz juf
本音注音	變音(尾調形)	matsuBpmOriginalChangeTone	ㄇㄚ⁺ ㄗㄨ⁺	ㄇㄚˊ ㄖㄨ⁺
拼音(數字調)	尾調形	matsuNumberTone	ma2 tsu2	ma⁺ tsu⁺
拼音(數字調)	字中調	matsuNumberLetter	ma2 tsu2	mā tsū
拼音(數字調)	字母調	matsuNumberZvs	ma2 tsu2	maf tsuf
拼音(尾調形)	數字調	matsuToneNumber	ma⁺ tsu⁺	ma2 tsu2
拼音(尾調形)	字中調	matsuToneLetter	ma⁺ tsu⁺	mā tsū
拼音(尾調形)	字母調	matsuToneZvs	ma⁺ tsu⁺	maf tsuf
拼音(字母調)	尾調形	matsuZvsTone	maf tsuf	ma⁺ tsu⁺
拼音(字母調)	字中調	zvsToLetter	maf tsuf	mā tsū
拼音(字母調)	數字調	matsuZvsNumber	maf tsuf	ma2 tsu2
`;

function matsuPinyinBpm(t){
	 if (regexLetter.test(t)) {t = letterToZvs(t) }
	 if (regexTone.test(t)) {t = matsuToneToZvs(t) }
	 if (regexNumber.test(t)) {t = matsuNumberToZvs(t) }
	return matsuPinyinToBpm(t);
}

function matsuPinyinTone(t){
	 if (regexLetter.test(t)) {t = letterToZvs(t) }
	 if (regexTone.test(t)) {t = matsuToneToZvs(t) }
	 if (regexNumber.test(t)) {t = matsuNumberToZvs(t) }
	 t = mstsuToneToFX(t);
	return matsuZvsToTone(t);
}

function matsuPinyinNumber(t){
	 if (regexLetter.test(t)) {t = letterToZvs(t) }
	 if (regexTone.test(t)) {t = matsuToneToZvs(t) }
	 //if (regexNumber.test(t)) {t = matsuNumberToZvs(t) }
	return matsuZvsToNumber(t);
}

function matsuPinyinLetter(t){
	 //if (regexLetter.test(t)) {t = letterToZvs(t) }
	 if (regexTone.test(t)) {t = matsuToneToZvs(t) }
	 if (regexNumber.test(t)) {t = matsuNumberToZvs(t) }
	return zvsToLetter(t);
}

function matsuPinyinZvs(t){
	 if (regexLetter.test(t)) {t = letterToZvs(t) }
	 if (regexTone.test(t)) {t = matsuToneToZvs(t) }
	 if (regexNumber.test(t)) {t = matsuNumberToZvs(t) }
	return t;
}

function matsuBpmPinyinTone(t){ 
	 t = mstsuToneToFX(t);
	return matsuBpmToPinyin(t); }
function matsuBpmPinyinNumber(t){ 
	t=matsuBpmToPinyin(t);
	t=matsuToneToNumber(t);
	return t; 
}
function matsuBpmPinyinZvs(t){ 
	t=matsuBpmToPinyin(t);
	t=matsuToneToZvs(t);
	return t; 
}

function matsuBpmPinyinLetter(t){ 
	t=matsuBpmToPinyin(t);
	t=matsuToneToZvs(t);
	return zvsToLetter(t); 
}

function matsuNumberTone(t){ 
	 t = mstsuToneToFX(t);
	return matsuNumberToTone(t); }
function matsuNumberZvs(t){ return matsuNumberToZvs(t); }
function matsuToneNumber(t){ return matsuToneToNumber(t); }
function matsuToneZvs(t){ return matsuToneToZvs(t); }
function matsuZvsTone(t){ 
	 t = mstsuToneToFX(t);
	return matsuZvsToTone(t); }
function matsuZvsNumber(t){ return matsuZvsToNumber(t); }
function matsuPinyinOriginalChangeZvs(t){
	 if (regexLetter.test(t)) {t = letterToZvs(t) }
	 if (regexTone.test(t)) {t = matsuToneToZvs(t) }
	 if (regexNumber.test(t)) {t = matsuNumberToZvs(t) }
    return matsuOriginalToChange(t); 
}
function matsuPinyinOriginalChangeTone(t){
	t = matsuPinyinOriginalChangeZvs(t);
	return matsuZvsToTone(t);
}
function matsuBpmOriginalChangeTone(t){
	t = matsuBpmPinyinZvs(t);
	t = matsuPinyinOriginalChangeZvs(t);
	t = matsuPinyinBpm(t);
	return t;
}


function matsuToneLetter(t){
	t = matsuToneToZvs(t)
	return zvsToLetter(t);
}
function matsuNumberLetter(t){
	t = matsuNumberToZvs(t)
	return zvsToLetter(t);
}


//==============================;




// 語言配置映射
const languageConfigs = {
    'sixian': { name: '四縣', config: langSixian, param: 'sixian', url: 'https://sites.google.com/view/oikasu/hoka' },
    'hailu': { name: '海陸', config: langHailu, param: 'hailu', url: 'https://sites.google.com/view/oikasu/hoka' },
    'dapu': { name: '大埔', config: langDapu, param: 'dapu', url: 'https://sites.google.com/view/oikasu/hoka' },
    'raoping': { name: '饒平', config: langRaoping, param: 'raoping', url: 'https://sites.google.com/view/oikasu/hoka' },
    'kasu': { name: '詔安', config: langKasu, param: 'kasu', url: 'https://sites.google.com/view/oikasu' },
    'holo': { name: '和樂', config: langHolo, param: 'holo', url: 'https://sites.google.com/view/oikasu/holo' },
    'matsu': { name: '馬祖', config: langMatsu, param: 'matsu', url: 'https://sites.google.com/view/oikasu/matsu' }
};





let currentLanguage = 'kasu'; // 預設語言
let currentLanguageConfig = langKasu; // 當前語言配置


// 初始化語言設定
const firstLine = langSixian.trim().split('\n')[1];
const [defaultLeftLang, defaultRightLang] = firstLine.split('\t').map(s => s.trim());


