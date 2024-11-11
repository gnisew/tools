var varForm="";

varForm +=" <div class=\"search\"> "; 
varForm +=" <div class=\"autocomplete\"> "; 
varForm +=" <button id=\"myWordOX\" onclick=\"myWordOX()\">⊕</button> "; 
varForm +=" <input type=\"text\" class=\"mySearch\" value=\"\" id=\"AAA\" placeholder=\"" + btnT + "\" autofocus onkeypress=\"if(event.keyCode == 13){Kasu('K'); myWordOX2();}\"> "; 
varForm +=" <span class=\"btn-group\"> "; 
varForm +=" <button onclick=\"Kasu('K'); myWordOX2();\">" + btnK + "</button><button onclick=\"Kasu('G'); myWordOX2();\">" + btnG + "</button> "; 
varForm +=" </span>   "; 
varForm +=" </div> "; 
varForm +=" <script>myWord();</script> "; 
varForm +=" <br /> "; 
varForm +=" <div id=\"BBB\"></div> "; 
varForm +=" </div> ";

document.write(varForm);