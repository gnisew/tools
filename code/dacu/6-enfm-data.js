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

let enAo = `basketball;籃球
piano;鋼琴
chess;西洋棋
recorder;直笛
blue;藍色
blocks;積木
blue;藍色
blocks;積木
glass;玻璃杯
glue;膠水
clean;乾淨的
clock;時鐘`;

let enAa =`breakfast;早餐
lunch;午餐
have dinner;晚餐
get up;起床
go to school;上學
go home;回家
go to bed;上床睡覺
weekend;週末
artist;藝術家
sound;聲音
still;還
move on;前進
no entry;禁止進入
so;非常
glad;高興的
crack;裂痕
brick;磚塊
bride;新娘
press;按；壓
prince;王子
grass;草；草地
grapes;葡萄
crab;螃蟹
Come on!;來吧！
That’s for sure.;那當然。
cry;哭泣`;

let enAb =`pizza;披薩
rice;米、飯
steak;牛排
would;（表請求、意願的助動詞）
need;需要
first;首先；第一
share;分享
our;我們的
pass;傳；通過
brush;刷子
fried chicken;炸雞
dumplings;水餃（常用複數）
noodles;麵（常用複數）
French fries;薯條（常用複數）
train;火車
tree;樹
trick;把戲
dream;夢
dress;洋裝
drum;鼓`;

let enAc =`from;從……來
market;市場
over there;在那裡
past;過去
Italy;義大利
Japan;日本
Taiwan;臺灣
the UK;英國
the USA;美國
Canada;加拿大
Egypt;埃及
Greece;希臘
bank;銀行
pink;粉紅色
tank;坦克車
king;國王
long;長的
ring;戒指`;

let enAd =`key;鑰匙
umbrella;雨傘
watch;手錶
water bottle;水壺
glasses;眼鏡
gloves;手套（複數）
shoes;鞋子（複數）
whose;誰的
take a rest;休息
may;可以
scary;嚇人的
those;那些
sunglasses;太陽眼鏡
cellphone;手機
Your Majesty;陛下
skunk;臭鼬
ski;滑雪
spy;間諜
spoon;湯匙
stick;樹枝
stool;凳子`;

let enBo =`glue;膠水
marker;彩色筆
notebook;筆記本
tape;膠帶
Whose marker is it?;那是誰的彩色筆？
It's my marker.;是我的彩色筆。
Whose notebook is it?;那是誰的筆記本？
It's my notebook.;是我的筆記本。`;


let enBa =`shirt;襯衫
just;只是
winning;快要贏了
Go!;加油！
cheer for;為......打氣；鼓舞
winner;贏家
kid;小孩
next;下一個
these;這些
shopping;正在購物
pants;長褲
those;那些
dollar;元
camp;營隊
socks;襪子
sweater;毛衣
vest;背心
shorts;短褲
sneakers;運動鞋
how much;多少
scarf;圍巾
sold out;售完`;

let enBb =`go fishing;去釣魚
home;主場
guest;客場
team;隊伍
period;節
go swimming;去游泳
go surfing;去衝浪
go shopping;去購物
free time;休閒時間
go hiking;去健行
go biking;去騎腳踏車
go camping;去露營
Hollywood;好萊塢（地名）`;

let enBc =`spot;斑點
cold;感冒
Africa;非洲
tooth;牙齒
fever;發燒
toothache;牙痛
runny nose;流鼻水
sore throat;喉嚨痛
stomachache;胃痛
headache;頭痛`;

let enBd =`coffee shop;咖啡廳
bookstore;書店
closed;關門的
chicken pie;雞肉派
nearby;附近
bus stop;公車站
movie theater;電影院
night market;夜市
train station;火車站
restaurant;餐廳`;

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

