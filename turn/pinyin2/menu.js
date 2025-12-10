// 定義動態文字
const logoText = "烏衣行🥷";
const translateText = "拼音轉換";

const APP_ID = "translateText"; // 每個不同的應用都要有不同的 APP_ID，增加唯一識別符，用於區分不同的應用

// 語言配置 - 四縣
const langSixian = `
左邊選單	右邊選單	執行函數	左邊範例	右邊範例
拼音	注音	hakkaPinyinBpm	hagˋ gaˊ	ㄏㄚㄍˋ ㄍㄚˊ
拼音	小注音	hakkaPinyinBpmSmall	hagˋ gaˊ	ˋ ˊ
拼音	直注音	hakkaPinyinBpmTiny	hagˋ gaˊ	 
拼音	國際音標	sixianPinyinIpa	ngaiˋ	ŋai⁵³
國際音標	拼音	sixianIpaPinyin	ŋai⁵³	ngaiˋ
注音	拼音字尾調	hakkaBpmPinyinTone	ㄏㄚㄍˋ ㄍㄚˊ ˋ ˊ	hagˋ gaˊ hagˋ gaˊ
注音	小注音	bpmBigSmall	ㄏㄚㄍˋ ㄍㄚˊ	ˋ ˊ
注音	大注音	bpmSmallBig	ˋ ˊ	ㄏㄚㄍˋ ㄍㄚˊ
注音	直注音	bpmSmallTiny	ˋ ˊ	 
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



	



// 海陸語言配置
const langHailu = `
左邊選單	右邊選單	執行函數	左邊範例	右邊範例
拼音	注音	hakkaPinyinBpm	aˋ aˊ	ㄚˋ ㄚˊ
拼音	小注音	hakkaPinyinBpmSmall	aˋ	ˋ
拼音	直注音	hakkaPinyinBpmTiny	aˋ	
拼音	國際音標	hailuPinyinIpa	ngaiˋ	ŋai⁵³
國際音標	拼音	hailuIpaPinyin	ŋai⁵³	ngaiˋ
注音	拼音字尾調	hakkaBpmPinyinTone	ㄚˋ ˋ	aˋ aˋ
注音	小注音	bpmBigSmall	ㄚˋ	ˋ
注音	大注音	bpmSmallBig	ˋ	ㄚˋ
注音	直注音	bpmSmallTiny	ˋ ˊ	 
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




// 大埔語言配置
const langDapu = `
左邊選單	右邊選單	執行函數	左邊範例	右邊範例
拼音	注音	hakkaPinyinBpm	aˋ aˊ	ㄚˋ ㄚˊ
拼音	小注音	hakkaPinyinBpmSmall	aˋ	ˋ
拼音	直注音	hakkaPinyinBpmTiny	aˋ	
拼音	國際音標	dapuPinyinIpa	ngaiˋ	ŋai⁵³
國際音標	拼音	dapuIpaPinyin	ŋai⁵³	ngaiˋ
注音	拼音字尾調	hakkaBpmPinyinTone	ㄚˋ ˋ	aˋ aˋ
注音	小注音	bpmBigSmall	ㄚˋ	ˋ
注音	大注音	bpmSmallBig	ˋ	ㄚˋ
注音	直注音	bpmSmallTiny	ˋ ˊ	 
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


// 饒平語言配置
const langRaoping = `
左邊選單	右邊選單	執行函數	左邊範例	右邊範例
拼音	注音	hakkaPinyinBpm	aˋ aˊ	ㄚˋ ㄚˊ
拼音	小注音	hakkaPinyinBpmSmall	aˋ	ˋ
拼音	直注音	hakkaPinyinBpmTiny	aˋ	
拼音	國際音標	raopingPinyinIpa	ngaiˋ	ŋai⁵³
國際音標	拼音	raopingIpaPinyin	ŋai⁵³	ngaiˋ
注音	拼音字尾調	hakkaBpmPinyinTone	ㄚˋ ˋ	aˋ aˋ
注音	小注音	bpmBigSmall	ㄚˋ	ˋ
注音	大注音	bpmSmallBig	ˋ	ㄚˋ
注音	直注音	bpmSmallTiny	ˋ ˊ	 
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


// 詔安語言配置
const langKasu = `
左邊選單	右邊選單	執行函數	左邊範例	右邊範例
拼音	注音	kasuPinyinBpmSmall	aˋ aˊ	ˋ ˊ
拼音	直注音	kasuPinyinBpmTiny	aˋ aˊ	ˋ ˊ
拼音	字尾調	hakkaPinyinTone	az av as ax af	aˊ aˇ aˋ aˆ a⁺
拼音	字中調	hakkaPinyinLetter	aˊ aˇ aˋ aˆ a⁺	á ǎ à â ā
拼音	字母調	hakkaPinyinZvs	aˊ aˇ aˋ aˆ a⁺	az av as ax af
拼音	調值	kasuToneNumbers	aˊ	a24
拼音	國際音標	kasuPinyinIpa	ngaiˋ	ŋai⁵³
國際音標	拼音	kasuIpaPinyin	ŋai⁵³	ngaiˋ
注音	拼音字尾調	kasuBpmSmallPinyin	ㄚˋ ˋ	aˋ aˋ
注音	拼音字母調	kasuBpmSmallZvs	ㄚˋ ˋ	as as
注音	小注音	bpmBigSmall	ㄚˋ	ˋ
注音	大注音	bpmSmallBig	ˋ	ㄚˋ
注音	直注音	bpmSmallTiny	ˋ	ㄚˋ
調值	字尾調	kasuNumbersTone	a24	aˊ
調值	字母調	kasuNumbersZvs	a24	az
字尾調	字中調	hakkaToneLetter	aˊ aˇ aˋ aˆ a⁺	á ǎ à â ā
字尾調	字母調	hakkaToneZvs	aˊ aˇ aˋ aˆ a⁺	az av as ax af
字母調	字尾調	hakkaZvsTone	az av as ax af	aˊ aˇ aˋ aˆ a⁺
字母調	字中調	hakkaZvsLetter	az av as ax af	á ǎ à â ā
字中調	字尾調	hakkaLetterTone	á ǎ à â ā	aˊ aˇ aˋ aˆ a⁺
字中調	字母調	hakkaLetterZvs	á ǎ à â ā	az av as ax af
詞彙本調	詞彙變調	kasuPinyinChange	kaˊ su	ka su
`;



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
TaiwaneseSerif	台羅	holoTaiwaneseTailuo	të	tē
`;


// 馬祖語言配置
const langMatsu = `
左邊選單	右邊選單	執行函數	左邊範例	右邊範例
拼音	注音	matsuPinyinBpm	ma⁺ tsu⁺	ㄇㄚ⁺ ㄗㄨ⁺
拼音	小注音	matsuPinyinBpmSmall	ma⁺ tsu⁺	⁺ ⁺
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
本音注音	大注音變音(尾調形)	matsuBpmOriginalChangeTone	ㄇㄚ⁺ ㄗㄨ⁺	ㄇㄚˊ ㄖㄨ⁺
本音注音	小注音變音(尾調形)	matsuBpmSmallOriginalChangeTone	⁺ ⁺	ˊ ⁺
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


