var myVar = "";
myVar +=" <form name=\"myform\"> ", 
myVar +=" <center> ", 
myVar +=" <textarea id=\"myidKiu\" rows=\"8\" name=\"myidKiu\"></textarea> ", 
myVar +=" <br> ", 
myVar +=" <input onclick=\"javascript:this.form.myidKiu.value='';this.form.myidKiu.focus()\" value=\""+ myBtnX+"\" type=\"button\" name=\"button1\"> ", 
myVar +=" <input onclick=\""+ myLang +"(this.form)\" value=\""+ myText +"\" type=\"button\" name=\"button2\"> ", 
myVar +=" <input onclick=\"Copy(this.form)\" value=\""+ myBtnC +"\" type=\"button\" name=\"button4\"> ", 
myVar +=" <br> ", 
myVar +=" <textarea id=\"myidXin\" rows=\"8\" name=\"myidXin\"></textarea> ", 
myVar +=" </center> ", 
myVar += myPs , 
myVar +=" </form> ", 

document.write(myVar);
