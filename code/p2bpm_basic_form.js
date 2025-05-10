var myVar="";

myVar +=" <form class=\"myfont\" name=\"myform\"> "; 
myVar +=" <center> "; 
myVar +=" <textarea class=\"myfont\" id=\"myidKiu\" name=\"myidKiu\" onkeyup=\"this.value = this.value.slice(0, 1000000)\" rows=\"8\"><\/textarea> "; 
myVar +=" <br> "; 
myVar +=" <input onclick=\"javascript:this.form.myidKiu.value='';this.form.myidKiu.focus()\" type=\"button\" value=\"↑ 清除\"> "; 
myVar +=" <input onclick=\"Goix_myA(this.form)\" type=\"button\" value=\"拼>注 ↓\"> ";
myVar +=" <input onclick=\"Goix_myB(this.form)\" type=\"button\" value=\"注>拼 ↓\"> "; 
myVar +=" <input onclick=\"Copy(this.form)\" type=\"button\" value=\"複製 ↓\"> ";
myVar +=" <br> "; 
myVar +=" <textarea class=\"myfont\" id=\"myidXin\" name=\"myidXin\" rows=\"8\"><\/textarea> "; 
myVar +=" <\/center> "; 
myVar +=" <\/form> ";


document.write(myVar);