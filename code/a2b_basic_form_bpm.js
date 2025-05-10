var myVar="";

myVar +=" <form class=\"myfont\" name=\"myform\"> "; 
myVar +=" <center> "; 
myVar +=" <textarea class=\"myfont\" id=\"myidKiu\" name=\"myidKiu\" onkeyup=\"this.value = this.value.slice(0, 1000000)\" rows=\"8\"><\/textarea> "; 
myVar +=" <br> "; 
myVar +=" <input onclick=\"javascript:this.form.myidKiu.value='';this.form.myidKiu.focus()\" type=\"button\" value=\"" +btnX +   "\"> "; 
myVar +=" <input onclick=\"Goix_myA(this.form)\" type=\"button\" value=\"" +btnA +   "\"> ";
myVar +=" <input onclick=\"Goix_myB(this.form)\" type=\"button\" value=\"" +btnB + "\"> "; 
myVar +=" <input onclick=\"Copy(this.form)\" type=\"button\" value=\"" +btnC + "\"> ";
myVar +=" <br> "; 
myVar +=" <textarea class=\"myfont\" id=\"myidXin\" name=\"myidXin\" rows=\"8\"><\/textarea> "; 
myVar +=" <br> "; 
myVar +=" <input onclick=\"Goix_BpmB2S(this.form)\" type=\"button\" value=\"" +btnB2S +   "\"> ";
myVar +=" <input onclick=\"Goix_BpmS2B(this.form)\" type=\"button\" value=\"" +btnS2B + "\"> "; 
myVar +=" <input onclick=\"Goix_ToneB2U(this.form)\" type=\"button\" value=\"" +btnB2U +   "\"> ";
myVar +=" <input onclick=\"Goix_ToneU2B(this.form)\" type=\"button\" value=\"" +btnU2B + "\"> "; 

myVar +=" <\/center> "; 
myVar +=" <\/form> ";

document.write(myVar);