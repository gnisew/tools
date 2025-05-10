var myVar="";

myVar +=" <form class=\"myfont\" name=\"myform\"> "; 
myVar +=" <center> "; 
myVar +=" <textarea class=\"myfont\" id=\"myidKiu\" name=\"myidKiu\" rows=\"8\"><\/textarea> "; 
myVar +=" <br> "; 
myVar +=" <input onclick=\"javascript:this.form.myidKiu.value='';this.form.myidKiu.focus()\" type=\"button\" value=\"" +btnX +   "\"> "; 
myVar +=" <input onclick=\"Goix_myA(this.form)\" id=\"btnA\" type=\"button\" value=\"" +btnA +   "\"> ";
myVar +=" <input onclick=\"Goix_myB(this.form)\" id=\"btnB\" type=\"button\" value=\"" +btnB + "\"> "; 
myVar +=" <input onclick=\"Copy(this.form)\" id=\"btnC\" type=\"button\" value=\"" +btnC + "\"> ";
myVar +=" <br> "; 
myVar +=" <textarea class=\"myfont\" id=\"myidXin\" name=\"myidXin\" rows=\"8\"><\/textarea> "; 
myVar +=" <br> "; 
myVar +=" <\/center> "; 
myVar +=" <\/form> ";

document.write(myVar);