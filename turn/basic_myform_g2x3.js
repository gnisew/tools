// name, id, 函數 名稱設定規則如函數Copy，name 為 btn_Copy，id 為 id_Copy。
var myTonvGKshow = "+";
var myTonvGKhide = "-";
var myVar="";

myVar +=`<div id="btns">`;
myVar += "<form class=\"myfont\" name=\"myform\">";
myVar += "<center>";
myVar += `<textarea placeholder="重要：本工具不可能完全正確，您仍得要校正。\n授權：本工具限用於個人非營利之教育用途。\n其他：「 + 」有更多轉換工具。\n製作：烏衣行 (詔安客語教學資源中心 oikasu.com )" class="myfont" id="idA" name="idA" rows="8"></textarea><br />`;
//舊文字;



myVar += "<input name=\"btn_myX\" id=\"btn_myX\" onclick=\"Qing()\" type=\"button\" value=\""+ myX +"\" \/>";
//清除;

//myVar +=" <input onclick=\"javascript:this.form.idA.value='';this.form.idA.focus()\" type=\"button\" value=\"" + myX +"\" \/>";
myVar += "<input name=\"btn_Goix\" id=\"btn_Goix\" onclick=\"Goix()\" type=\"button\" value=\""+ myG2K +"\" \/>";
//國轉客;


myVar += `<input name="btn_Goix2" id="btn_Goix2" onclick="Goix2()" type="button" value=" > "/>`;

//myVar += "<input name=\"btn_Goix2\" id=\"btn_Goix2\" onclick=\"Goix2()\" type=\"button\" value=\""+ ">" +"\" \/>";
//國轉客，刪空格，直接複製;

myVar += "<input name=\"btn_GoixKG\" id=\"btn_GoixKG\" onclick=\"GoixK2G()\" type=\"button\" value=\""+myK2G+"\" \/>";
//客轉國;

myVar += "<input name=\"btn_GoixKG2\" id=\"btn_GoixKG2\" onclick=\"GoixK2G2()\" type=\"button\" value=\""+">"+"\" \/>";
//客轉國，刪空格，直接複製;


//myVar += "<input name=\"button4\" id=\"button4\" onclick=\"Goix2()\" onmouseout=\"Goix3()\" type=\"button\" value=\"字+音 ↓\" \/>";
//myVar += "<input name=\"button8\" id=\"button8\" onclick=\"Goix4()\" onmouseout=\"Goix3()\" type=\"button\" value=\"詞+音 ↓\" \/>";

/*
myVar +=" <input name=\"btn_myTonvGKshow\" id=\"btn_myTonvGKshow\" onclick=\"javascript:this.form.btn_GK.style.display='';this.form.btn_KG.style.display='';this.form.btn_TonvG.style.display='';this.form.btn_TonvK.style.display='';this.form.btn_myTonvGKshow.style.display='none';this.form.btn_myTonvGKhide.style.display=''\" type=\"button\" value=\"" + myTonvGKshow +"\"\/>";

myVar +=" <input style=\"display:none\" name=\"btn_myTonvGKhide\" id=\"btn_myTonvGKhide\" onclick=\"javascript:this.form.btn_GK.style.display='none';this.form.btn_KG.style.display='none';this.form.btn_TonvG.style.display='none';this.form.btn_TonvK.style.display='none';this.form.btn_myTonvGKshow.style.display='';this.form.btn_myTonvGKhide.style.display='none'\" type=\"button\" value=\"" + myTonvGKhide +"\"\/>";
*/

myVar += "<input name=\"btn_Other\" id=\"btn_Other\" onclick=\"Other()\" type=\"button\" value=\""+ myOther +"\" \/>";

myVar += "<br \/>";

myVar += "<input style=\"display:none\" name=\"btn_TonvG\" id=\"btn_TonvG\" onclick=\"TonvG()\" type=\"button\" value=\""+ myTonvG +"\" \/>";
//國斷詞;

myVar += "<input style=\"display:none\" name=\"btn_TonvK\" id=\"btn_TonvK\" onclick=\"TonvK()\" type=\"button\" value=\""+ myTonvK +"\" \/>";
//客斷詞;

myVar += "<input style=\"display:none\" name=\"btn_GNK\" id=\"btn_GNK\" onclick=\"GNK()\" type=\"button\" value=\""+ myGNK +"\" \/>";
//國\客;

myVar += "<input style=\"display:none\" name=\"btn_KNG\" id=\"btn_KNG\" onclick=\"KNG()\" type=\"button\" value=\""+ myKNG +"\" \/>";
//客\國;

myVar += "<input style=\"display:none\" name=\"btn_GK\" id=\"btn_GK\" onclick=\"GoixGK()\" type=\"button\" value=\""+ myGK +"\" \/>";
//國：客註釋;

myVar += "<input style=\"display:none\" name=\"btn_KG\" id=\"btn_KG\" onclick=\"GoixKG()\" type=\"button\" value=\""+ myKG +"\" \/>";
//客：國註釋;

myVar += "<input style=\"display:none\" name=\"btn_GKP\" id=\"btn_GKP\" onclick=\"GoixGKP()\" type=\"button\" value=\""+ myGKP +"\" \/>";
//國：客註釋全;

myVar += "<input style=\"display:none\" name=\"btn_KGP\" id=\"btn_KGP\" onclick=\"GoixKGP()\" type=\"button\" value=\""+ myKGP +"\" \/>";
//客：國註釋全;


myVar += "<input style=\"display:none\" name=\"btn_GoixCaG\" id=\"btn_GoixCaG\" onclick=\"GoixCaG()\" type=\"button\" value=\""+ myCaG +"\" \/>";
//國查客詞;
myVar += "<input style=\"display:none\" name=\"btn_GoixCaK\" id=\"btn_GoixCaK\" onclick=\"GoixCaK()\" type=\"button\" value=\""+ myCaK +"\" \/>";
//客查國詞;


myVar += "<input style=\"display:none\" name=\"btn_newG\" id=\"btn_newG\" onclick=\"newG()\" type=\"button\" value=\""+ myNewG +"\" \/>";
//新國詞;

myVar += "<input style=\"display:none\" name=\"btn_newK\" id=\"btn_newK\" onclick=\"newK()\" type=\"button\" value=\""+ myNewK +"\" \/>";
//新客詞;



myVar += "<br \/>";

myVar += "<textarea style=\"display:none\" class=\"myfont\" id=\"idB\" name=\"idB\" rows=\"8\"><\/textarea>";
//新文字;

myVar += "<br \/>";

myVar += "<input style=\"display:none\" name=\"btn_DeleteSpare\" id=\"btn_DeleteSpare\" onclick=\"DeleteSpare()\" type=\"button\" value=\""+myXS+"\" \/>";
//刪除空格;

myVar += "<input style=\"display:none\" name=\"btn_Copy\" id=\"btn_Copy\" onclick=\"Copy()\" type=\"button\" value=\""+myC+"\" \/>";
//複製;

//myVar += "<textarea style=\"display:none\" class=\"myfont\" id=\"idB\" name=\"idB\" rows=\"8\" onmouseup=\"Goix3()\"  onkeyup=\"Goix3()\"><\/textarea>  ";

myVar += "<br \/>  ";

//myVar += "<div style=\"display:none;width:100%;\" class=\"divInnerHtml\" id=\"idB2\" name=\"idB2\"><\/div>";
//myVar += "<br \/>  ";

//myVar += "  <input style=\"display:none\" onclick=\"Show_pinyin()\" id=\"button6\" name=\"button6\" type=\"button\" value=\"↓ 取出拼音\" \/>";
//myVar += "  <input style=\"display:none\" onclick=\"Show_hanzi()\" id=\"button7\" name=\"button7\" type=\"button\" value=\"↓ 取出漢字\" \/>";
//myVar += "<br \/>  ";
//myVar += "  <textarea readonly style=\"display:none\" class=\"myfont\" id=\"idB_pinyin\" name=\"idB_pinyin\" rows=\"8\"><\/textarea>";
//myVar += "  <textarea readonly style=\"display:none\" class=\"myfont\" id=\"idB_hanzi\" name=\"idB_hanzi\" rows=\"8\"><\/textarea>";

myVar += "<\/form>";
myVar +=`</div>`;
myVar += " <link href=\"basic_myform_g2x3.css\" rel=\"stylesheet\"> ";

document.write(myVar);


const targetKeywords = ['code', 'wp'];
const currentURL = window.location.href;
if (!targetKeywords.some(keyword => currentURL.includes(keyword))) {
    const btnsDiv = document.getElementById('btns');
    if (btnsDiv) btnsDiv.style.display = 'none';
}


document.addEventListener("DOMContentLoaded", function() {
    var firstH3Element = document.querySelector("h3");
    firstH3Element.addEventListener("click", function() {
        window.open("https://sites.google.com/view/oikasu", "_blank");
    });
});