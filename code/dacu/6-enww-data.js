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

let enAo =``;

let enAa =``;

let enAb =``;

let enAc =``;

let enAd =``;

let enBo =``;


let enBa =``;

let enBb =``;

let enBc =``;

let enBd =``;

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

let arrList01 = [[enAo, "#610 活動"], 
[enAa, "#611 作息"], 
[enAb, "#612 食物"], 
[enAc, "#613 國家"], 
[enAd, "#614 物品"], 
[enBo, "#620 文具"], 
[enBa, "#621 衣物"], 
[enBb, "#622 休閒"], 
[enBc, "#623 病症"], 
[enBd, "#624 地點"],
[enA, "61 上學期全部"],
[enB, "62 下學期全部"]];
// 陣列清單; 預設亂數，不亂數則名稱前加#，如 [biaodian, "#標點符號"], ;
arrList = arrList01.concat(arrList00);

