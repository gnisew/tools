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

let enAa =`can;能、會
sing;唱歌
swim;游泳
read;閱讀
draw;畫圖
dance;跳舞
ride;騎
bike;腳踏車`;

let enAb =`time;時間
fifteen;15
fifty;50
thirty;30
forty;40
twenty;二十
five;25
o'clock;點鐘`;

let enAc =`where;哪裡
in;在~裡面
on;在~上面
by;在...旁邊
under;在~下面
chair;椅子
desk;書桌
table;桌子
ouch;哎呀
pet;寵物
hamster;倉鼠`;

let enAd =`find;尋找
at home;在家
bathroom;浴室
bedroom;臥室
dining;用餐
living;生活
kitchen;廚房
workbook;作業本`;

let enBa =`how;如何
cloudy;陰天
rainy;雨天
snowy;下雪天
sunny;晴天
windy;颳風天
there;那裡
weather;天氣`;

let enBb =`doing;（正在）做
cooking;（正在）烹飪
painting;（正在）繪畫
sleeping;（正在）睡覺
studying;（正在）讀書
writing;（正在）寫字
jogging;（正在）慢跑
watch me.;看我。
know.;知道`;

let enBc =`do;（助動詞）
want;想要
eat;吃
soup;湯
ice;冰
cream;膏狀物
hot;熱
dogs;狗(複數)
hamburgers;漢堡(複數)
apple;蘋果
pies;派(複數)
sandwiches;三明治(複數)`;

let enBd =`like;喜歡
nice;不錯的
bears;熊（複數）
elephants;大象（複數）
monkeys;猴子（複數）
pandas;貓熊（複數）
tigers;老虎（複數）
turtles;烏龜（複數）
roar;吼叫`;

//========================================;
let arrList00 = [[abcBpm, "#字母BPM"], 
[abcAbc, "#字母ABC"], 
[abcQaz, "#字母QAZ"], 
[abcFa, "#字母-食指"], 
[abcFb, "#字母-中指"], 
[abcFc, "#字母-無名指"],
[abcFd, "#字母-大小指"]];
// 陣列清單; 預設亂數，不亂數則名稱前加#，如 [biaodian, "#標點符號"], ;

let arrList01 = [[enAa, "411 才能"], 
[enAb, "412 時間"], 
[enAc, "413 位置"], 
[enAd, "414 房間"], 
[enBa, "421 天氣"], 
[enBb, "422 活動"], 
[enBc, "423 食物"], 
[enBd, "424 動物"]];
// 陣列清單; 預設亂數，不亂數則名稱前加#，如 [biaodian, "#標點符號"], ;
arrList = arrList01.concat(arrList00);
