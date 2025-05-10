var myVar="";


myVar +=" <form class=\"myfont\" name=\"myform_p2p\"> "; 
myVar +=" <center> "; 
myVar +=" <textarea class=\"myfont\" id=\"myidKiu_p2p\" name=\"myidKiu_p2p\" onkeyup=\"this.value = this.value.slice(0, 1000000)\" rows=\"8\"><\/textarea> "; 
myVar +=" <br> "; 
myVar +=" <input onclick=\"javascript:this.form.myidKiu_p2p.value='';this.form.myidKiu_p2p.focus()\" type=\"button\" value=\"↑ 清除\"> "; 
myVar +=" <input onclick=\"Goix_p2p(this.form)\" type=\"button\" value=\"轉換 ↓\"> "; 
myVar +=" <input onclick=\"Copy_p2p(this.form)\" type=\"button\" value=\"複製 ↓\"> ";
myVar +=" <br> "; 
myVar +=" <textarea class=\"myfont\" id=\"myidXin_p2p\" name=\"myidXin_p2p\" rows=\"8\"><\/textarea> "; 
myVar +=" <\/center> "; 
myVar +=" <\/form> ";


document.write(myVar);