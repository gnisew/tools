var myVar="";
myVar += "<form class=\"myfont\" name=\"myform\">";
myVar += "<center>";
myVar += "<textarea class=\"myfont\" id=\"myidKiu\" name=\"myidKiu\" rows=\"8\"><\/textarea><br \/>";
myVar += "<input name=\"button1\" id=\"button1\" onclick=\"Qing(this.form)\" type=\"button\" value=\"↑ 清除\" \/>";
myVar += "<input name=\"button2\" id=\"button2\" onclick=\"Goix(this.form)\" type=\"button\" value=\"轉換 ↓\" \/>";
//myVar += "<input name=\"button4\" id=\"button4\" onclick=\"Goix2(this.form)\" onmouseout=\"Goix3(this.form)\" type=\"button\" value=\"字音 ↓\" \/>";
//myVar += "<input name=\"button8\" id=\"button8\" onclick=\"Goix4(this.form)\" onmouseout=\"Goix3(this.form)\" type=\"button\" value=\"詞音 ↓\" \/>";
//myVar += "<input name=\"button3\" id=\"button3\" onclick=\"Tonv(this.form)\" type=\"button\" value=\"斷詞 ↓\" \/>";
myVar += "<input style=\"display:none\" name=\"button5\" id=\"button5\" onclick=\"Copy(this.form)\" type=\"button\" value=\"複製 ↓\" \/>";


myVar += "<br \/>";
myVar += "<textarea style=\"display:none\" class=\"myfont\" id=\"myidXin\" name=\"myidXin\" rows=\"8\" onmouseup=\"Goix3(this.form)\"  onkeyup=\"Goix3(this.form)\"><\/textarea>  ";
myVar += "<br \/>  ";
myVar += "<div style=\"display:none\" class=\"divInnerHtml\" id=\"myidXin2\" name=\"myidXin2\"><\/div>";
myVar += "<br \/>  ";

//myVar += "  <input style=\"display:none\" onclick=\"Show_pinyin(this.form)\" id=\"button6\" name=\"button6\" type=\"button\" value=\"↓ 取出拼音\" \/>";
//myVar += "  <input style=\"display:none\" onclick=\"Show_hanzi(this.form)\" id=\"button7\" name=\"button7\" type=\"button\" value=\"↓ 取出漢字\" \/>";
//myVar += "<br \/>  ";
//myVar += "  <textarea readonly style=\"display:none\" class=\"myfont\" id=\"myidXin_pinyin\" name=\"myidXin_pinyin\" rows=\"8\"><\/textarea>";
//myVar += "  <textarea readonly style=\"display:none\" class=\"myfont\" id=\"myidXin_hanzi\" name=\"myidXin_hanzi\" rows=\"8\"><\/textarea>";

myVar += "<\/center>";
myVar += "<\/form>";

document.write(myVar);

