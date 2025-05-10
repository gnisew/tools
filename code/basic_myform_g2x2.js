// name, id, 函數 名稱設定規則如函數Copy，name 為 btn_Copy，id 為 id_Copy。

var myTonvGKshow = "+";

var myTonvGKhide = "-";

var myVar=`<form class="myfont" name="myform">

<center>

<textarea class="myfont" id="myidKiu" name="myidKiu" rows="8"></textarea><br />

<input name="btn_myX" id="btn_myX" onclick="javascript:this.form.btn_myTonvGKshow.style.display='';this.form.btn_myTonvGKhide.style.display='none';Qing(this.form)" type="button" value="${myX}" />

/* //<input onclick="javascript:this.form.myidKiu.value='';this.form.myidKiu.focus()" type="button" value="" + myX +"" /> */

<input name="btn_Goix" id="btn_Goix" onclick="Goix(this.form)" type="button" value="${myG2K}" />

<input name="btn_GoixKG" id="btn_GoixKG" onclick="GoixKG(this.form)" type="button" value="${myK2G}" />

/* //<input name="button4" id="button4" onclick="Goix2(this.form)" onmouseout="Goix3(this.form)" type="button" value="字+音 ↓" />*/

/* //<input name="button8" id="button8" onclick="Goix4(this.form)" onmouseout="Goix3(this.form)" type="button" value="詞+音 ↓" />*/

<input name="btn_myTonvGKshow" id="btn_myTonvGKshow" onclick="javascript:this.form.btn_TonvG.style.display='';this.form.btn_TonvK.style.display='';this.form.btn_myTonvGKshow.style.display='none';this.form.btn_myTonvGKhide.style.display=''" type="button" value="${myTonvGKshow}"/>

<input style="display:none" name="btn_myTonvGKhide" id="btn_myTonvGKhide" onclick="javascript:this.form.btn_TonvG.style.display='none';this.form.btn_TonvK.style.display='none';this.form.btn_myTonvGKshow.style.display=''; this.form.btn_myTonvGKhide.style.display='none'" type="button" value="${myTonvGKhide}"/>

<input style="display:none" name="btn_TonvG" id="btn_TonvG" onclick="TonvG(this.form)" type="button" value="${myTonvG}" />

<input style="display:none" name="btn_TonvK" id="btn_TonvK" onclick="TonvK(this.form)" type="button" value="${myTonvK}" />



<br />

<textarea style="display:none" class="myfont" id="myidXin" name="myidXin" rows="8"></textarea>

<br />

<input style="display:none" name="btn_DeleteSpare" id="btn_DeleteSpare" onclick="DeleteSpare(this.form)" type="button" value="${myXS}" />

<input style="display:none" name="btn_Copy" id="btn_Copy" onclick="Copy(this.form)" type="button" value="${myC}" />

<br /> 

/* //<textarea style="display:none" class="myfont" id="myidXin" name="myidXin" rows="8" onmouseup="Goix3(this.form)"  onkeyup="Goix3(this.form)"></textarea>  



/* //<div style="display:none;width:100%;" class="divInnerHtml" id="myidXin2" name="myidXin2"></div>

/* //<br />  



/* //  <input style="display:none" onclick="Show_pinyin(this.form)" id="button6" name="button6" type="button" value="↓ 取出拼音" />

/* //  <input style="display:none" onclick="Show_hanzi(this.form)" id="button7" name="button7" type="button" value="↓ 取出漢字" />

/* //<br />  

/* //  <textarea readonly style="display:none" class="myfont" id="myidXin_pinyin" name="myidXin_pinyin" rows="8"></textarea>

/* //  <textarea readonly style="display:none" class="myfont" id="myidXin_hanzi" name="myidXin_hanzi" rows="8"></textarea>*/

</center>
</form>
<link href="basic_myform_g2x3.css" rel="stylesheet">`



document.write(myVar);