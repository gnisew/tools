// 定義動態文字
const logoText = "烏衣行🥷";
const translateText = "拼音轉換";

const APP_ID = "translateText"; // 每個不同的應用都要有不同的 APP_ID，增加唯一識別符，用於區分不同的應用

// 語言配置
const myLang = `
左邊選單	右邊選單	執行函數	左邊範例	右邊範例
字母調	聲調標上	fnA	A01\\nov	B01\\nǒ
聲調標上(ǒ)	字母調	fnB	A02\\nǒ	B02\\nov
字母調	聲調字尾	fnC	A03\\nXX	B03\\nXX
聲調字尾	字母調	fnD	A04\\nXX	B04\\nXX
聲調標上(ǒ)	聲調字尾	fnE	A02\\nǒ	B02\\nov
`;

// 實際轉換函數
function fnA(t) {
	t = Xing_Zhi(t) 
    // 白話字 → 聲調標上
    // 在這裡實作實際的轉換邏輯
    return t; // 暫時返回原文，請根據需求實作轉換邏輯
}



function fnB(t) {
    // 白話字 → 聲調字母
    // 在這裡實作實際的轉換邏輯
	t = Zhi_Xing(t) 	
    return t; // 暫時返回原文，請根據需求實作轉換邏輯
}

function fnC(t) {
t = Zhi_XingK(t) 
    // 白話字 → 聲調字尾
    // 在這裡實作實際的轉換邏輯
    return t; // 暫時返回原文，請根據需求實作轉換邏輯
}

function fnD(t) {
t = Zhi_XingK2(t)
    // 聲調字母 → 聲調字尾
    // 在這裡實作實際的轉換邏輯
    return t; // 暫時返回原文，請根據需求實作轉換邏輯
}

function fnE(t) {
t = Zhi_Xing(t) 	
t = Zhi_XingK(t) 
    return t; // 暫時返回原文，請根據需求實作轉換邏輯
}

function fnF(t) {
    // 聲調標上 → 聲調字尾
    // 在這裡實作實際的轉換邏輯
    return t; // 暫時返回原文，請根據需求實作轉換邏輯
}

function fnG(t) {
    // 聲調標上 → 聲調字母
    // 在這裡實作實際的轉換邏輯
    return t; // 暫時返回原文，請根據需求實作轉換邏輯
}



function Xing_Zhi(txt) {
		txt = txt.replace(/(n)(g{0,1})(h{0,1})(l)/g, 'n̍$2$3');
return txt;
}


function Zhi_Xing(txt) {
txt = txt.replace(/űn/g, 'unzz');
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
