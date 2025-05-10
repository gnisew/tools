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

let enAo =`three hundred;300
five hundred;500
six hundred;600
eight hundred;800
three hundred and twenty;320
five hundred and forty-one;541
five hundred and eight;508
six hundred and thirty-four;634
eight hundred and twenty-eight;828`;

let enAa =`coffee;咖啡
cola;可樂
soda;汽水
tea;茶
bubble tea;珍珠奶茶
hot chocolate;熱巧克力
soy milk;豆漿`;

let enAb =`apples;蘋果（複數）
bananas;香蕉（複數）
grapes;葡萄（複數）
guavas;芭樂（複數）
oranges;柳橙（複數）
papayas;木瓜（複數）
pineapples;鳳梨（複數）
how many;多少（數量）
need;需要`;

let enAc =`day;一天，一日
today;今天
Sunday;星期日
Monday;星期一
Tuesday;星期二
Wednesday;星期三
Thursday;星期四
Friday;星期五
Saturday;星期六`;

let enAd =`art;藝術；美術
math;數學
music;音樂
PE;體育
his;他的
her;她的
our;我們的
their;他們的
favorite;最喜愛的
subject;科目
Chinese;國語；中文
English;英語；英文
science;自然；科學
social studies;社會`;

let enBo =`three hundred;300
five hundred;500
six hundred;600
eight hundred;800
three hundred and twenty;320
five hundred and forty-one;541
five hundred and eight;508
six hundred and thirty-four;634
eight hundred and twenty-eight;828`;


let enBa =`bakery;麵包店
bank;銀行
bookstore;書店
hospital;醫院
park;公園
post office;郵局
restaurant;餐廳
supermarket;超市
surprise;驚喜
your turn;輪到你
walk the dog;遛狗
minute;分鐘`;

let enBb =`bike;腳踏車
bus;公車
car;汽車
MRT;捷運
plane;飛機
taxi;計程車
train;火車
get;到達
there;那裡
by;搭乘
city;城市
walk;走路
far away;遠
scooter;機車
adventure;冒險`;

let enBc =`how much;多少
dollar;元
bring;攜帶
those;那些
or;或者
try on;試穿
dress;洋裝
skirt;裙子
sweater;毛衣
pants;長褲
shorts;短褲
socks;襪子(常用複數)
T-shirt;短袖上衣
sneakers;運動鞋(常用複數)
wedding;婚禮
go shopping;購物`;

let enBd =`jacket;夾克
keys;鑰匙(複數)
whose;誰的
tissue;衛生紙
umbrella;雨傘
watch;手錶
glasses;眼鏡
backpack;後背包
water bottle;水壺
smartphone;智慧型手機`;

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

let arrList01 = [[enAo, "#510 數字"], 
[enAa, "#511 飲料"], 
[enAb, "#512 水果"], 
[enAc, "#513 星期"], 
[enAd, "#514 科目"], 
[enBo, "#520 數字"], 
[enBa, "#521 場所"], 
[enBb, "#522 交通"], 
[enBc, "#523 衣物"], 
[enBd, "#524 所有物"],
[enA, "51 上學期全部"],
[enB, "52 下學期全部"]];
// 陣列清單; 預設亂數，不亂數則名稱前加#，如 [biaodian, "#標點符號"], ;
arrList = arrList01.concat(arrList00);

