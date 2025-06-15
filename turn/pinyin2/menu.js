// 定義動態文字
const logoText = "烏衣行🥷";
const translateText = "拼音轉換";

const APP_ID = "translateText"; // 每個不同的應用都要有不同的 APP_ID，增加唯一識別符，用於區分不同的應用

// 語言配置 - 四縣
const langSixian = `
左邊選單	右邊選單	執行函數	左邊範例	右邊範例
字母調	聲調標上	fnA	A01\\nov	B01\\nǒ
聲調標上(ǒ)	字母調	fnB	A02\\nǒ	B02\\nov
字母調	聲調字尾	fnC	A03\\nXX	B03\\nXX
聲調字尾	字母調	fnD	A04\\nXX	B04\\nXX
聲調標上(ǒ)	聲調字尾	fnE	A02\\nǒ	B02\\nov
`;

// 海陸語言配置
const langHailu = `
左邊選單	右邊選單	執行函數	左邊範例	右邊範例
字母調	聲調標上	fnA_hailu	A01\\nov	B01\\nǒ
聲調標上(ǒ)	字母調	fnB_hailu	A02\\nǒ	B02\\nov
字母調	聲調字尾	fnC_hailu	A03\\nXX	B03\\nXX
聲調字尾	字母調	fnD_hailu	A04\\nXX	B04\\nXX
聲調標上(ǒ)	聲調字尾	fnE_hailu	A02\\nǒ	B02\\nov
`;

// 詔安語言配置
const langKasu = `
左邊選單	右邊選單	執行函數	左邊範例	右邊範例
字母調	聲調標上	fnA_zhaoan	A01\\nov	B01\\nǒ
聲調標上(ǒ)	字母調	fnB_zhaoan	A02\\nǒ	B02\\nov
字母調	聲調字尾	fnC_zhaoan	A03\\nXX	B03\\nXX
字母A調	聲調字A尾	fnC_zhaoan	A03\\nXX	B03\\nXX
字母B調	聲調字B尾	fnC_zhaoan	A03\\nXX	B03\\nXX
字母C調	聲調字C尾	fnC_zhaoan	A03\\nXX	B03\\nXX
聲調字尾	字母調	fnD_zhaoan	A04\\nXX	B04\\nXX
聲調標上(ǒ)	聲調字尾	fnE_zhaoan	A02\\nǒ	B02\\nov
`;






// 和樂語言配置
const langHolo = `
左邊選單	右邊選單	執行函數	左邊範例	右邊範例
拼音	台羅	holoPinyinLetter	Tsiau3-an1 Kheh4-ue7 ti7 Lun7-pue3	Tsiàu-an Kheh-uē tī Lūn-puè
拼音	數字調	holoPinyinNumber	Tsiau3-an1 Kheh4-ue7 ti7 Lun7-pue3	Tsiau3-an1 Kheh4-ue7 ti7 Lun7-pue3
拼音	字母調	holoPinyinZvs	Tsiau3-an1 Kheh4-ue7 ti7 Lun7-pue3	Tsiaus-an Kheh-uef tif Lunf-pues
台羅	數字調	holoToneNumber	Tsiàu-an Kheh-uē tī Lūn-puè	Tsiau3-an1 Kheh4-ue7 ti7 Lun7-pue3
台羅	字母調	holoToneZvs	Tsiàu-an Kheh-uē tī Lūn-puè	Tsiaus-an Kheh-uef tif Lunf-pues
數字調	台羅	holoNumberTone	Tsiau3-an1 Kheh4-ue7 ti7 Lun7-pue3	Tsiàu-an Kheh-uē tī Lūn-puè
數字調	字母調	holoNumberZvs	Tsiau3-an1 Kheh4-ue7 ti7 Lun7-pue3	Tsiaus-an Kheh-uef tif Lunf-pues
字母調	台羅	holoZvsTone	Tsiaus-an Kheh-uef tif Lunf-pues	Tsiàu-an Kheh-uē tī Lūn-puè
字母調	數字調	holoZvsNumber	Tsiaus-an Kheh-uef tif Lunf-pues	Tsiau3-an1 Kheh4-ue7 ti7 Lun7-pue3
教羅	台羅	holoPojTailo	Chiàu-an Kheh-oē tī Lūn-poè	Tsiàu-an Kheh-uē tī Lūn-puè
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


function holoToneNumber(t){ 
	t = letterToZvs(t)
	return holoZvsToNumber(t); }
function holoToneZvs(t){ return letterToZvs(t); }
function holoNumberTone(t){ return holoNumberToTone(t); }
function holoNumberZvs(t){ return holoNumberToZvs(t); }
function holoZvsTone(t){ return holoZvsToTone(t); }
function holoZvsNumber(t){ return holoZvsToNumber(t); }
function holoPojTailo(t){ return holoPojToTailo(t); }


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

function matsuBpmPinyinTone(t){ return matsuBpmToPinyin(t); }
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

function matsuNumberTone(t){ return matsuNumberToTone(t); }
function matsuNumberZvs(t){ return matsuNumberToZvs(t); }
function matsuToneNumber(t){ return matsuToneToNumber(t); }
function matsuToneZvs(t){ return matsuToneToZvs(t); }
function matsuZvsTone(t){ return matsuZvsToTone(t); }
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


// 語言配置映射
const languageConfigs = {
    'sixian': { name: '四縣', config: langSixian, param: 'sixian', url: 'https://sites.google.com/view/oikasu/hoka' },
    'hailu': { name: '海陸', config: langHailu, param: 'hailu', url: 'https://sites.google.com/view/oikasu/hoka' },
    'holo': { name: '和樂', config: langHolo, param: 'holo', url: 'https://sites.google.com/view/oikasu/holo' },
    'matsu': { name: '馬祖', config: langMatsu, param: 'matsu', url: 'https://sites.google.com/view/oikasu/matsu' }
};

let currentLanguage = 'sixian'; // 預設語言
let currentLanguageConfig = langSixian; // 當前語言配置


// 初始化語言設定
const firstLine = langSixian.trim().split('\n')[1];
const [defaultLeftLang, defaultRightLang] = firstLine.split('\t').map(s => s.trim());



//-------------------------------
// 原有的四縣轉換函數
function fnA(t) {
    t = Xing_Zhi(t) 
    return t;
}

function fnB(t) {
    t = Zhi_Xing(t) 	
    return t;
}

function fnC(t) {
    t = Zhi_XingK(t) 
    return t;
}

function fnD(t) {
    t = Zhi_XingK2(t)
    return t;
}

function fnE(t) {
    t = Zhi_Xing(t) 	
    t = Zhi_XingK(t) 
    return t;
}

// 海陸轉換函數
function fnA_hailu(t) {
    // 海陸專用轉換邏輯
    t = Xing_Zhi_Hailu(t);
    return t;
}

function fnB_hailu(t) {
    t = Zhi_Xing_Hailu(t);
    return t;
}

function fnC_hailu(t) {
    t = Zhi_XingK_Hailu(t);
    return t;
}

function fnD_hailu(t) {
    t = Zhi_XingK2_Hailu(t);
    return t;
}

function fnE_hailu(t) {
    t = Zhi_Xing_Hailu(t);
    t = Zhi_XingK_Hailu(t);
    return t;
}

// 詔安轉換函數
function fnA_zhaoan(t) {
    // 詔安專用轉換邏輯
    t = Xing_Zhi_Zhaoan(t);
    return t;
}

function fnB_zhaoan(t) {
    t = Zhi_Xing_Zhaoan(t);
    return t;
}

function fnC_zhaoan(t) {
    t = Zhi_XingK_Zhaoan(t);
    return t;
}

function fnD_zhaoan(t) {
    t = Zhi_XingK2_Zhaoan(t);
    return t;
}

function fnE_zhaoan(t) {
    t = Zhi_Xing_Zhaoan(t);
    t = Zhi_XingK_Zhaoan(t);
    return t;
}

// 原有的四縣轉換邏輯函數
function Xing_Zhi(txt) {
    txt = txt.replace(/(n)(g{0,1})(h{0,1})(l)/g, 'n̍$2$3');
    return txt;
}

function Zhi_Xing(txt) {
    txt = txt.replace(/űn/g, 'unzz');
    return txt;
}

function Zhi_XingK(txt) {
    txt = txt.replace(/([aeioumngrbd])(z)(\b)/gi, '$1ˊ');
    return txt;
}

function Zhi_XingK2(txt) {
    txt = txt.replace(/([aeioumnrgbd])(ˊ)/gi, '$1z');
    return txt;
}

// 海陸轉換邏輯函數
function Xing_Zhi_Hailu(txt) {
    // 海陸專用轉換邏輯
    txt = txt.replace(/(n)(g{0,1})(h{0,1})(l)/g, 'n̍$2$3');
    return txt;
}

function Zhi_Xing_Hailu(txt) {
    txt = txt.replace(/űn/g, 'unzz');
    return txt;
}

function Zhi_XingK_Hailu(txt) {
    txt = txt.replace(/([aeioumngrbd])(z)(\b)/gi, '$1ˊ');
    return txt;
}

function Zhi_XingK2_Hailu(txt) {
    txt = txt.replace(/([aeioumnrgbd])(ˊ)/gi, '$1z');
    return txt;
}

// 詔安轉換邏輯函數
function Xing_Zhi_Zhaoan(txt) {
    // 詔安專用轉換邏輯
    txt = txt.replace(/(n)(g{0,1})(h{0,1})(l)/g, 'n̍$2$3');
    return txt;
}

function Zhi_Xing_Zhaoan(txt) {
    txt = txt.replace(/űn/g, 'unzz');
    return txt;
}

function Zhi_XingK_Zhaoan(txt) {
    txt = txt.replace(/([aeioumngrbd])(z)(\b)/gi, '$1ˊ');
    return txt;
}

function Zhi_XingK2_Zhaoan(txt) {
    txt = txt.replace(/([aeioumnrgbd])(ˊ)/gi, '$1z');
    return txt;
}




