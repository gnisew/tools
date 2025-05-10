let arrList = [];

//let wordsA = ["AA;aa","BB;bb","CC;cc","DD;dd","EE;ee","FF;ff"];


let biaodian = `，;Ctrl ，
。;Ctrl .
？;Ctrl Shift ？
；;Ctrl ；
：;Ctrl Shift：
、;Ctrl \
！;Ctrl Shift 1
「;Ctrl [
」;Ctrl ]
「」;Ctrl [ ]`;

let wordsDses = `@;在
ms1;我的學校1
.dses;東興國小
.ylc;雲林縣
.edu;教育
.tw;台灣
gg.gg/;超短網址
6962164;學校電話`;

let dsesDizhi = `6;63743
3;63743
7;63743
4;63743
3;63743
雲;雲林縣
林;雲林縣
縣;雲林縣
崙;崙背鄉
背;崙背鄉
鄉;崙背鄉
羅;羅厝村
厝;羅厝村
村;羅厝村
東;東興路1號
興;東興路1號
路;東興路1號
1;東興路1號
號;東興路1號`;



let basicWord = `啊
是
是啊
嗎
是嗎
有
沒有
你
我
你我
他的
他說
我的
說`;

let basicWord2 = `是，
啊！
是啊！
嗎？
是嗎？
有。
沒有。
你。
我。
你、我
他的；
他說：
「我的」
說：「」`;




let nanyi4201 =`
`;

let nanyi4202 =`
`;

let nanyi4203 =`
`;

let nanyi4204 =`
`;

let nanyi4205 =`
`;

let nanyi4206 =`
`;

let nanyi4207 =`
`;

let nanyi4208 =`
`;

let nanyi4209 =`
`;

let nanyi4210 =`
`;

let nanyi4211 =`
`;

let nanyi4212 =`
`;

let nanyi4213 =`
`;

let nanyi4214 =`
`;

//========================================;
let arrList00 = [[biaodian, "#選題目挑戰"], 
[biaodian, "#標點符號"], 
[basicWord, "#簡單字"], 
[basicWord2, "#簡單字+標點"], 
[wordsDses, "#東興信箱"], 
[dsesDizhi, "#東興地址"]];
// 陣列清單; 預設亂數，不亂數則名稱前加#，如 [biaodian, "#標點符號"], ;

let arrList01 = [[nanyi4201, "(1)"], 
[nanyi4202, "(2)"], 
[nanyi4203, "(3)"], 
[nanyi4204, "(4)"], 
[nanyi4205, "(5)"], 
[nanyi4206, "(6)"], 
[nanyi4207, "(7)"], 
[nanyi4208, "(8)"], 
[nanyi4209, "(9)"], 
[nanyi4210, "(10)"], 
[nanyi4211, "(11)"], 
[nanyi4212, "(12)"], 
[nanyi4213, "(13)"], 
[nanyi4214, "(14)"]];
// 陣列清單; 預設亂數，不亂數則名稱前加#，如 [biaodian, "#標點符號"], ;
arrList = arrList00.concat(arrList01);

