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

let enAo =`one;一
two;二
three;三
four;四
five;五`;

let enAa =`six;六
seven;七
eight;八
nine;九
ten;十
how old;幾歲
are;是
you;你
am;是
years old;歲(複數)
I;我`;

let enAb =`yes;是的
no;不；不是
not;不是
angry;生氣的
happy;快樂的
sad;難過的
hungry;飢餓的
thirsty;口渴的`;

let enAc =`it;它
is;是
a;一個
ball;皮球
car;車
what;什麼
this;這個
that;那個
doll;洋娃娃
kite;風箏
robot;機器人
yo-yo;溜溜球`;

let enAd =`color;顔色
blue;藍色
green;綠色
pink;粉紅色
purple;紫色
red;紅色
yellow;黄色`;

let enBo =`eleven;十一
twelve;十二
thirteen;十三
fourteen;十四
fifteen;十五`;

let enBa =`bird;鳥
cat;貓
dog;狗
frog;青蛙
rabbit;兔子
ox;牛`;

let enBb =`can;會;能夠
dance;跳舞
draw;畫圖
sing;唱歌
swim;游泳
fly a kite;放風箏
ride a bike;騎腳踏車`;

let enBc =`who;誰
he;他
she;她
father;爸爸
mother;媽媽
brother;哥哥;弟弟
sister;姊姊;妹妹
grandpa;爺爺;外公
grandma;奶奶;外婆`;

let enBd =`cook;廚師
doctor;醫師
nurse;護理師;護理人員
student;學生
teacher;教師`;

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

let arrList01 = [[enAo, "#310 數字"], 
[enAa, "#311 年齡"], 
[enAb, "#312 感覺"], 
[enAc, "#313 玩具"], 
[enAd, "#314 顏色"], 
[enBo, "#320 數字"], 
[enBa, "#321 動物"], 
[enBb, "#322 才能"], 
[enBc, "#323 家人"], 
[enBd, "#324 職業"],
[enA, "31 上學期全部"],
[enB, "32 下學期全部"]];
// 陣列清單; 預設亂數，不亂數則名稱前加#，如 [biaodian, "#標點符號"], ;
arrList = arrList01.concat(arrList00);

