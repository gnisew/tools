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


let enAa =`what;什麼
is;是
your;你的、你們的
name;名字
my;我的
am;是
I;我 (shift + i)`;

let enAb =`yes;是的
how;多少
old;老
are;是
you;你；你們
six;六
seven;七
eight;八
nine;九
ten;十
years;年(複數)`;

let enAc =`a;一個
pen;筆
an;一個
eraser;橡皮擦
it;它
this;這個
that;那個
and;而；和
book;書本
ruler;尺
pencil;鉛筆
oops;唉呀`;

let enAd =`ball;球
color;顏色
red;紅色
yellow;黃色
blue;藍色
green;綠色
pink;粉紅色`;

let enBa =`kite;風箏
robot;機器人
yo-yo;溜溜球 (-在右上ㄦ)
doll;洋娃娃
yes;是的
not;不是
no;不
ball;球`;

let enBb =`happy;快樂的
angry;生氣的
sad;傷心的
hungry;飢餓的
very;非常
tired;疲累的
thirsty;口渴的
great;好棒`;

let enBc =`who;誰
he;他
dad;爸爸
she;她
mom;媽媽
brother;哥哥；弟弟
sister;姐姐；妹妹
twins;雙胞胎
guess;猜`;

let enBd =`cook;廚師
nurse;護士
doctor;醫生
student;學生
teacher;老師
too;也是
big;大的
pizza;披薩`;

//========================================;
let arrList00 = [[abcBpm, "#字母BPM"], 
[abcAbc, "#字母ABC"], 
[abcQaz, "#字母QAZ"], 
[abcFa, "#字母-食指"], 
[abcFb, "#字母-中指"], 
[abcFc, "#字母-無名指"],
[abcFd, "#字母-大小指"]];
// 陣列清單; 預設亂數，不亂數則名稱前加#，如 [biaodian, "#標點符號"], ;

let arrList01 = [[enAa, "311 名字"], 
[enAb, "312 年齡"], 
[enAc, "313 文具"], 
[enAd, "314 顏色"], 
[enBa, "321 玩具"], 
[enBb, "322 情緒"], 
[enBc, "323 家人"], 
[enBd, "324 職業"]];
// 陣列清單; 預設亂數，不亂數則名稱前加#，如 [biaodian, "#標點符號"], ;
arrList = arrList01.concat(arrList00);







