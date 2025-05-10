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

let enAa =`they;他們(複數）
does;助動詞（第三人稱）
friend;朋友
grow;生長
apples;蘋果(複數）
bananas;香蕉(複數）
grapes;葡萄(複數）
oranges;柳橙(複數）
papayas;木瓜(複數）
pears;梨子(複數）
watermelons;西瓜(複數）
ouch;哎唷
lucky;幸運的`;

let enAb =`drink;喝
tea;茶
water;水
juice;果汁
milk;牛奶
soda;汽水
coffee;咖啡
too;太
make;做;製造
bitter;苦的
lemonade;檸檬水
chocolate;巧克力
maybe;也許
hurray;歡呼聲
really;真的`;

let enAc =`day;天；日
today;今天
Monday;星期一
Tuesday;星期二
Wednesday;星期三
Thursday;星期四
Friday;星期五
Saturday;星期六
Sunday;星期日
class;（一節）課
painting;繪畫
together;一起`;

let enAd =`how many;多少
need;需要
salt;鹽
garden;花園
carrots;紅蘿蔔(複數)
onions;洋蔥(複數)
potatoes;馬鈴薯(複數)
tomatoes;番茄(複數)
bell peppers;甜椒(複數)
cucumbers;小黃瓜(複數)
mushrooms;蘑菇(複數)
pick;摘採
sprinkle;撒
sweet;甜的
How come?;怎麼回事？`;

let enBa =`park;公園
restroom;廁所
hospital;醫院
bank;銀行
bakery;麵包店
music show;音樂演奏會
post office;郵局
sick;生病的
supermarket;超級市場
soon;快
violin;小提琴
library;圖書館`;

let enBb =`train;火車
scooter;機車
car;汽車
bus;公車
bike;腳踏車
MRT;捷運
get;到達
boat;小船
wonderful;美好的
nearby;在附近
walk;走路
taxi;計程車`;

let enBc =`favorite;最喜歡的
subject;科目
art;藝術；美術
music;音樂
math;數學
something;某些事情
PE;體育
Chinese;國語；中文
English;英語；英文
science;自然科學
social studies;社會`;

let enBd =`after;後面
school;學校
work;工作
sports;運動（複數）
potato;馬鈴薯
chips;片（複數）
walk the dog;遛狗
watch TV;看電視
listen to;聽
music;音樂
homework;功課
surf;衝浪
the Internet;網路
read;閱讀
books;書（複數）
later;之後
Here we are.;我們到了。`;

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

let arrList01 = [[enAa, "511 水果"], 
[enAb, "512 飲料"], 
[enAc, "513 星期"], 
[enAd, "514 蔬菜"], 
[enBa, "521 場所"], 
[enBb, "522 交通"], 
[enBc, "523 科目"], 
[enBd, "524 活動"],
[enA, "51 上學期全部"],
[enB, "52 下學期全部"]];
// 陣列清單; 預設亂數，不亂數則名稱前加#，如 [biaodian, "#標點符號"], ;
arrList = arrList01.concat(arrList00);

