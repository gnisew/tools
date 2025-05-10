let arrList = [];

//let wordsA = ["AA;aa","BB;bb","CC;cc","DD;dd","EE;ee","FF;ff"];


let abcBpm = `aaa;A
eee;E
iii;I
ooo;O
uuu;U
www;W
yyy;Y
bbb;B
ppp;P
mmm;M
fff;F
ddd;D
ttt;T
nnn;N
lll;L
ggg;G
kkk;K
hhh;H
zzz;Z
ccc;C
sss;S
jjj;J
qqq;Q
xxx;X
rrr;R
vvv;V`;

let abcAbc = `aa;A
bb;B
cc;C
dd;D
ee;E
ff;F
gg;G
hh;H
ii;I
jj;J
kk;K
ll;L
mm;M
nn;N
oo;O
pp;P
qq;Q
rr;R
ss;S
tt;T
uu;U
vv;V
ww;W
xx;X
yy;Y
zz;Z`;

let abcQaz = `qaz
qz
wsx
ws
edc
ed
rfv
fv
tgb
tb
yhn
yh
ujm
jm
ik,
ol.
p`;

let abcFa = `ff;F
jj;J
gg;G
hh;H
rr;R
uu;U
tt;T
yy;Y
vv;V
mm;M
bb;B
nn;N`;

let abcFb = `dd;D
kk;K
ee;E
ii;I
cc;C
,,`;

let abcFc = `ss;S
ll;L
ww;W
oo;O
xx;X
..;.`;

let abcFd = `aa;A
qq;Q
pp;P
zz;Z
a a;A
q q;Q
p p;P
z z;Z`;

let enAo =`eleven;十一
twelve;十二
thirteen;十三
fourteen;十四
fifteen;十五
sixteen;十六
seventeen;十七
eighteen;十八
nineteen;十九
twenty;二十`;

let enAa =`cloudy;陰天的
rainy;下雨的
sunny;晴朗的
windy;颳風的
cold;冷的
hot;熱的
how;如何
weather;天氣`;

let enAb =`fifteen;十五
twenty;二十
twenty-five;二十五
thirty;三十
forty;四十
fifty;五十
time;時間
o'clock;點鐘`;

let enAc =`book;書
eraser;橡皮擦
marker;簽字筆;彩色筆
pen;原子筆
pencil;鉛筆
ruler;尺`;

let enAd =`in;在...裡面
on;在...上面
under;在...底下
box;盒子
chair;椅子
desk;書桌
where;哪裡`;

let enBo =`sixty;六十
seventy;七十
eighty;八十
ninety;九十
one hundred;一百`;


let enBa =`bathroom;浴室；洗手間
bedroom;臥室
kitchen;廚房
dining room;餐廳
living room;客廳`;

let enBb =`cooking;（正在）下廚
eating;（正在）吃東西
reading;（正在）讀書
sleeping;（正在）睡覺
writing;（正在）寫字
running;（正在）跑步`;

let enBc =`juice;果汁
milk;牛奶
water;水
ice cream;冰淇淋
a hamburger;漢堡
hamburgers;漢堡（複數）
a hot dog;熱狗
hot dogs;熱狗（複數）`;

let enBd =`bears;熊（複數）
lions;獅子（複數）
monkeys;猴子（複數）
tigers;老虎（複數）
zebras;斑馬（複數）`;

enA = enAo.concat(enAa , enAb, enAc, enAd);
enB = enBo.concat(enBa , enBb, enBc, enBd);

//========================================;
let arrList00 = [[abcBpm, "#字母BPM"], 
[abcAbc, "#字母ABC"], 
[abcQaz, "#字母QAZ"], 
[abcFa, "#字母-食指"], 
[abcFb, "#字母-中指"], 
[abcFc, "#字母-無名指"],
[abcFd, "#字母-大小指"]];
// 陣列清單; 預設亂數，不亂數則名稱前加#，如 [biaodian, "#標點符號"], ;

let arrList01 = [[enAo, "#410 數字"], 
[enAa, "#411 天氣"], 
[enAb, "#412 時間"], 
[enAc, "#413 文具"], 
[enAd, "#414 介詞"], 
[enBo, "#420 數字"], 
[enBa, "#421 房間"], 
[enBb, "#422 動作"], 
[enBc, "#423 食物"], 
[enBd, "#424 動物"],
[enA, "41 上學期全部"],
[enB, "42 下學期全部"]];
// 陣列清單; 預設亂數，不亂數則名稱前加#，如 [biaodian, "#標點符號"], ;
arrList = arrList01.concat(arrList00);

