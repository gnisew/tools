function fn_ruby(form) {
    if (!document.getElementById) return;
    myidKiu = document.getElementById("myidKiu_ruby");
    myidXin = document.getElementById("myidXin_ruby");
    myidXinValue = myidKiu.value.replace(/(\[)([^\[]*)(\\)([^\]]*)(\])/gi, '<ruby><span ondblclick="g(this)">$2</span><rt ondblclick="g(this)">_$4_</rt></ruby>');
    myidXin.innerHTML = "<pre class=\"preInnerHtml\">" + myidXinValue + "</pre>";
}

function fn_ruby2(form) {
    if (!document.getElementById) return;
    myidKiu = document.getElementById("myidKiu_ruby");
    myidXin = document.getElementById("myidXin_ruby");
    myidKiuValue = myidKiu.value.replace(/(\<ruby\>)/gi, '\[');
    myidKiuValue = myidKiuValue.replace(/(_\<\/rt\>\<rp\>\)\<\/rp\>\<\/ruby\>)/gi, '\]');
    myidKiuValue = myidKiuValue.replace(/(_\<\/rt\>\<\/ruby\>)/gi, '\]');
    myidKiuValue = myidKiuValue.replace(/(\<\/rp\>\<\/ruby\>)/gi, '\]');
    myidKiuValue = myidKiuValue.replace(/(\(\<\/rp\>\<\/ruby\>)/gi, '\]');
    myidKiuValue = myidKiuValue.replace(/(\)\<\/rp\>\<\/ruby\>)/gi, '\]');
    myidKiuValue = myidKiuValue.replace(/(\<rp\>\(\<\/rp\>)/gi, '');
    myidKiuValue = myidKiuValue.replace(/(_\<rt\>)/gi, '\\');
    myidKiuValue = myidKiuValue.replace(/(\<rt)([^\<]*)(\>)_/gi, '\\');
    myidKiuValue = myidKiuValue.replace(/(\<)([^\_<]*)(\>)/gi, '');
    myidKiu.value = myidKiuValue;
}

function g(e) {
    var a = e.innerHTML;
    var b = document.createElement('input');
    b.type = 'text';
    b.onblur = function() {
        e.innerHTML = this.value ? this.value : a;
        if (!document.getElementById) return;
        myidKiu = document.getElementById("myidKiu_ruby");
        myidXin = document.getElementById("myidXin_ruby");
        myidXinInnerHtml = myidXin.innerHTML;
        myidXinInnerHtml = myidXinInnerHtml.replace(/(\<pre class\=preInnerHtml\>)/gi, '');
        myidXinInnerHtml = myidXinInnerHtml.replace(/(\<pre class\=\"preInnerHtml\"\>)/gi, '');
        myidXinInnerHtml = myidXinInnerHtml.replace(/(\<ruby\>\<span ondblclick\=g\(this\)\>)/gi, '\[');
        myidXinInnerHtml = myidXinInnerHtml.replace(/(\<ruby\>\<span ondblclick\=\"g\(this\)\"\>)/gi, '\[');
        myidXinInnerHtml = myidXinInnerHtml.replace(/(\<\/span\>\<rt ondblclick\=g\(this\)\>_)/gi, '\\');
        myidXinInnerHtml = myidXinInnerHtml.replace(/(\<\/span\>\<rt ondblclick\=\"g\(this\)\"\>_)/gi, '\\');
        myidXinInnerHtml = myidXinInnerHtml.replace(/(\<\/span\>\<rt ondblclick\=g\(this\)\>)/gi, '\\');
        myidXinInnerHtml = myidXinInnerHtml.replace(/(\<\/span\>\<rt ondblclick\=\"g\(this\)\"\>)/gi, '\\');
        myidXinInnerHtml = myidXinInnerHtml.replace(/(_\<\/rt\>\<\/ruby\>)/gi, '\]');
		myidXinInnerHtml = myidXinInnerHtml.replace(/(\<\/rt\>\<\/ruby\>)/gi, '\]');
        myidXinInnerHtml = myidXinInnerHtml.replace(/(\<\/pre\>)/gi, '');
        myidKiu.value = myidXinInnerHtml;
    };
    e.innerHTML = '';
    b.value = a;
    e.appendChild(b);
    b.focus();
}
document.write("標音規則：[下字\\上字]<br \/>");
document.write("直接修改：可以在標好的音點兩下修改。<br \/>");
document.write("<form class=\"myfont\" name=\"myform_ruby\">");
document.write("<br \/>");
document.write("<center>");
document.write("<textarea class=\"myfont\" id=\"myidKiu_ruby\" name=\"myidKiu_ruby\" onkeyup=\"fn_ruby(this.form)\" onmouseup=\"fn_ruby(this.form)\" onmousedown=\"fn_ruby2(this.form)\" rows=\"8\"><\/textarea>");
document.write("<br \/>");
document.write("<div class=\"divInnerHtml\" id=\"myidXin_ruby\" name=\"myidXin_ruby\" <\/div>");
document.write("<\/center>");
document.write("<\/form>");