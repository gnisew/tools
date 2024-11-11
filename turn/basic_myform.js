var myVar="";

myVar +=`<div id="btns">`;
myVar += "<form class=\"myfont\" name=\"myform\">";
myVar += `<textarea placeholder="重要：本工具不可能完全正確，您仍須要校正。\n授權：本工具限用於個人非營利之教育用途。\n製作：烏衣行 (詔安客語教學資源中心 oikasu.com )" class="myfont" id="idA" name="idA" rows="8"></textarea><br />`;
//舊文字;

myVar += `
<div class="button-container">
    <input name="btnQingSpace" id="btnQingSpace" onclick="QingSpace()" type="button" value="GO">
    <input name="btnQing" id="btnQing" onclick="Qing()" type="button" value="↑清除">
    <input name="btnGoix" id="btnGoix" onclick="Goix()" type="button" value="標音">
    <input name="btnGoix5" id="btnGoix5" onclick="Goix5()" type="button" value="詞〔yin〕">
    <input name="btnGoix2" id="btnGoix2" onclick="Goix2()" type="button" value="[字\音]">
    <input name="btnGoix4" id="btnGoix4" onclick="Goix4()" type="button" value="[詞\音]">
	<input name="btnGoix6" id="btnGoix6" onclick="Goix6()" type="button" value="詞=音">
    <input name="btnTonv" id="btnTonv" onclick="Tonv()" type="button" value="斷詞">
    <input style="display:none" name="btnCopy" id="btnCopy" onclick="Copy()" type="button" value="複製↓">
</div>
`;

myVar += "<br \/>";
myVar += "<textarea style=\"display:none\" class=\"myfont\" id=\"idB\" name=\"idB\" rows=\"8\" onmouseup=\"Goix3()\"  onkeyup=\"Goix3()\"><\/textarea>  ";
myVar += "<br \/>  ";
myVar += "<div style=\"display:none;width:100%;\" class=\"divInnerHtml\" id=\"idC\" name=\"idC\"><\/div>";
myVar += "<br \/>  ";

//myVar += "  <input style=\"display:none\" onclick=\"Show_pinyin()\" id=\"btnShow_pinyin\" name=\"btnShow_pinyin\" type=\"button\" value=\"↓ 取出拼音\" \/>";
//myVar += "  <input style=\"display:none\" onclick=\"Show_hanzi()\" id=\"btnShow_hanzi\" name=\"btnShow_hanzi\" type=\"button\" value=\"↓ 取出漢字\" \/>";
//myVar += "<br \/>  ";
//myVar += "  <textarea readonly style=\"display:none\" class=\"myfont\" id=\"idB_pinyin\" name=\"idB_pinyin\" rows=\"8\"><\/textarea>";
//myVar += "  <textarea readonly style=\"display:none\" class=\"myfont\" id=\"idB_hanzi\" name=\"idB_hanzi\" rows=\"8\"><\/textarea>";

myVar += "<\/form>";
myVar +=`</div>`;
myVar += " <link href=\"basic_myform.css\" rel=\"stylesheet\"> ";

document.write(myVar);

const targetKeywords = ['code', 'wp', 'gnisew'];
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