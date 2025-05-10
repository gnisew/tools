let arrList = [];

//let wordsA = ["AA;aa","BB;bb","CC;cc","DD;dd","EE;ee","FF;ff"];


let ka01 = `a;ㄚ
ba;ㄅㄚ
pa;ㄆㄚ
ma;ㄇㄚ
fa;ㄈㄚ
bba;万ㄚ
da;ㄉㄚ
na;ㄋㄚ
la;ㄌㄚ
ga;ㄍㄚ
ka;ㄎㄚ
nga;兀ㄚ
ha;ㄏㄚ
za;ㄗㄚ
zha;ㄓㄚ
ca;ㄘㄚ
cha;ㄔㄚ
sa;ㄙㄚ
sha;ㄕㄚ`;

let ka02 = `i;ㄧ
bi;ㄅㄧ
pi;ㄆㄧ
mi;ㄇㄧ
fi;ㄈㄧ
bbi;万ㄧ
di;ㄉㄧ
ti;ㄊㄧ
ni;ㄋㄧ
li;ㄌㄧ
gi;ㄍㄧ
ki;ㄎㄧ
ngi;兀ㄧ
hi;ㄏㄧ
zi;ㄗㄧ
zhi;ㄓㄧ
ci;ㄘㄧ
chi;ㄔㄧ
si;ㄙㄧ
shi;ㄕㄧ
rhi;ㄖㄧ`;

let ka03 = `u;ㄨ
bu;ㄅㄨ
pu;ㄆㄨ
fu;ㄈㄨ
bbu;万ㄨ
du;ㄉㄨ
tu;ㄊㄨ
nu;ㄋㄨ
lu;ㄌㄨ
gu;ㄍㄨ
ku;ㄎㄨ
zu;ㄗㄨ
zhu;ㄓㄨ
cu;ㄘㄨ
su;ㄙㄨ
shu;ㄕㄨ
rhu;ㄖㄨ`;

let ka04 = `ai;ㄞ
bai;ㄅㄞ
pai;ㄆㄞ
mai;ㄇㄞ
fai;ㄈㄞ
bbai;万ㄞ
dai;ㄉㄞ
tai;ㄊㄞ
nai;ㄋㄞ
lai;ㄌㄞ
gai;ㄍㄞ
ngai;兀ㄞ
zai;ㄗㄞ
cai;ㄘㄞ
sai;ㄙㄞ
au;ㄠ
bau;ㄅㄠ
pau;ㄆㄠ
nau;ㄋㄠ
lau;ㄌㄠ
gau;ㄍㄠ
kau;ㄎㄠ
ngau;兀ㄠ
hau;ㄏㄠ
zau;ㄗㄠ
cau;ㄘㄠ
sau;ㄙㄠ`;

let ka05 = `ia;ㄧㄚ
bia;ㄅㄧㄚ
pia;ㄆㄧㄚ
mia;ㄇㄧㄚ
gia;ㄍㄧㄚ
kia;ㄎㄧㄚ
ngia;兀ㄧㄚ
zia;ㄗㄧㄚ
cia;ㄘㄧㄚ
sia;ㄙㄧㄚ
rhia;ㄖㄧㄚ
iau;ㄧㄠ
ngiau;兀ㄧㄠ
siau;ㄙㄧㄠ
rhiau;ㄖㄧㄠ
ua;ㄨㄚ
gua;ㄍㄨㄚ
ngua;兀ㄨㄚ
sua;ㄙㄨㄚ
uai;ㄨㄞ
guai;ㄍㄨㄞ
kuai;ㄎㄨㄞ
nguai;兀ㄨㄞ`;

let ka06 = `iu;ㄧㄨ
liu;ㄌㄧㄨ
giu;ㄍㄧㄨ
kiu;ㄎㄧㄨ
ngiu;兀ㄧㄨ
hiu;ㄏㄧㄨ
ziu;ㄗㄧㄨ
zhiu;ㄓㄧㄨ
ciu;ㄘㄧㄨ
chiu;ㄔㄧㄨ
siu;ㄙㄧㄨ
shiu;ㄕㄧㄨ
rhiu;ㄖㄧㄨ
ui;ㄨㄧ
bui;ㄅㄨㄧ
pui;ㄆㄨㄧ
mui;ㄇㄨㄧ
fui;ㄈㄨㄧ
bbui;万ㄨㄧ
nui;ㄋㄨㄧ
lui;ㄌㄨㄧ
gui;ㄍㄨㄧ
kui;ㄎㄨㄧ
ngui;兀ㄨㄧ
sui;ㄙㄨㄧ`;

let ka07 = `oo;ㄜ
boo;ㄅㄜ
poo;ㄆㄜ
mo;ㄇㄛ
foo;ㄈㄜ
bboo;万ㄜ
doo;ㄉㄜ
too;ㄊㄜ
loo;ㄌㄜ
goo;ㄍㄜ
koo;ㄎㄜ
ngo;兀ㄛ
hoo;ㄏㄜ
zoo;ㄗㄜ
coo;ㄘㄜ
choo;ㄔㄜ
soo;ㄙㄜ
shoo;ㄕㄜ`;

let ka08 = `io;ㄧㄜ
bio;ㄅㄧㄜ
pio;ㄆㄧㄜ
mio;ㄇㄧㄜ
lio;ㄌㄧㄜ
gio;ㄍㄧㄜ
kio;ㄎㄧㄜ
zio;ㄗㄧㄜ
zhio;ㄓㄧㄜ
sio;ㄙㄧㄜ
shio;ㄕㄧㄜ
rhio;ㄖㄧㄜ
oi;ㄛㄧ
moi;ㄇㄛㄧ
doi;ㄉㄛㄧ
toi;ㄊㄛㄧ
loi;ㄌㄛㄧ
goi;ㄍㄛㄧ
koi;ㄎㄛㄧ
hoi;ㄏㄛㄧ
coi;ㄘㄛㄧ
soi;ㄙㄛㄧ`;

let ka09 = `e;ㄝ
pe;ㄆㄝ
fe;ㄈㄝ
de;ㄉㄝ
te;ㄊㄝ
le;ㄌㄝ
ge;ㄍㄝ
ke;ㄎㄝ
he;ㄏㄝ
ze;ㄗㄝ
zhe;ㄓㄝ
ce;ㄘㄝ
che;ㄔㄝ
se;ㄙㄝ
she;ㄕㄝ
bue;ㄅㄨㄝ
pue;ㄆㄨㄝ
fue;ㄈㄨㄝ
guen;ㄍㄨㄝㄣ
cue;ㄘㄨㄝ`;

let ka10 = `eu;ㄝㄨ
deu;ㄉㄝㄨ
teu;ㄊㄝㄨ
neu;ㄋㄝㄨ
leu;ㄌㄝㄨ
geu;ㄍㄝㄨ
keu;ㄎㄝㄨ
heu;ㄏㄝㄨ
zeu;ㄗㄝㄨ
seu;ㄙㄝㄨ
ee;乜
eeu;乜ㄨ
deeu;ㄉ乜ㄨ
teeu;ㄊ乜ㄨ
neeu;ㄋ乜ㄨ
leeu;ㄌ乜ㄨ
m;ㄇ
hm;ㄏㄇ`;

let ka11 = `ab;ㄚㄅ
dab;ㄉㄚㄅ
tab;ㄊㄚㄅ
nab;ㄋㄚㄅ
lab;ㄌㄚㄅ
gab;ㄍㄚㄅ
hab;ㄏㄚㄅ
zab;ㄗㄚㄅ
cab;ㄘㄚㄅ
sab;ㄙㄚㄅ
lib;ㄌㄧㄅ
gib;ㄍㄧㄅ
kib;ㄎㄧㄅ
ngib;兀ㄧㄅ
hib;ㄏㄧㄅ
zhib;ㄓㄧㄅ
shib;ㄕㄧㄅ
liab;ㄌㄧㄚㄅ
giab;ㄍㄧㄚㄅ
ngiab;兀ㄧㄚㄅ
ziab;ㄗㄧㄚㄅ
ciab;ㄘㄧㄚㄅ
zob;ㄗㄛㄅ
seb;ㄙㄝㄅ
teeb;ㄊ乜ㄅ`;

let ka12 = `bad;ㄅㄚㄉ
pad;ㄆㄚㄉ
mad;ㄇㄚㄉ
fad;ㄈㄚㄉ
bbad;万ㄚㄉ
lad;ㄌㄚㄉ
cad;ㄘㄚㄉ
bid;ㄅㄧㄉ
pid;ㄆㄧㄉ
bbid;万ㄧㄉ
gid;ㄍㄧㄉ
kid;ㄎㄧㄉ
ngid;兀ㄧㄉ
zid;ㄗㄧㄉ
zhid;ㄓㄧㄉ
cid;ㄘㄧㄉ
chid;ㄔㄧㄉ
sid;ㄙㄧㄉ
shid;ㄕㄧㄉ
bud;ㄅㄨㄉ
pud;ㄆㄨㄉ
mud;ㄇㄨㄉ
fud;ㄈㄨㄉ
bbud;万ㄨㄉ
lud;ㄌㄨㄉ
gud;ㄍㄨㄉ
kud;ㄎㄨㄉ
cud;ㄘㄨㄉ
sud;ㄙㄨㄉ
dod;ㄉㄛㄉ
lod;ㄌㄛㄉ
god;ㄍㄛㄉ
kod;ㄎㄛㄉ`;

let ka13 = `bed;ㄅㄝㄉ
med;ㄇㄝㄉ
ded;ㄉㄝㄉ
ted;ㄊㄝㄉ
led;ㄌㄝㄉ
zhed;ㄓㄝㄉ
ced;ㄘㄝㄉ
sed;ㄙㄝㄉ
shed;ㄕㄝㄉ
pied;ㄆㄧㄝㄉ
fied;ㄈㄧㄝㄉ
lied;ㄌㄧㄝㄉ
kied;ㄎㄧㄝㄉ
ngied;兀ㄧㄝㄉ
hied;ㄏㄧㄝㄉ
zied;ㄗㄧㄝㄉ
cied;ㄘㄧㄝㄉ
sied;ㄙㄧㄝㄉ
shied;ㄕㄧㄝㄉ
beed;ㄅ乜ㄉ
deed;ㄉ乜ㄉ
teed;ㄊ乜ㄉ
need;ㄋ乜ㄉ
cheed;ㄔ乜ㄉ
rheed;ㄖ乜ㄉ
biag;ㄅㄧㄚㄍ
pog;ㄆㄛㄍ
dog;ㄉㄛㄍ`;

let ka14 = `am;ㄚㄇ
fam;ㄈㄚㄇ
dam;ㄉㄚㄇ
tam;ㄊㄚㄇ
lam;ㄌㄚㄇ
gam;ㄍㄚㄇ
kam;ㄎㄚㄇ
ngam;兀ㄚㄇ
zam;ㄗㄚㄇ
cam;ㄘㄚㄇ
sam;ㄙㄚㄇ
dim;ㄉㄧㄇ
lim;ㄌㄧㄇ
gim;ㄍㄧㄇ
him;ㄏㄧㄇ
zhim;ㄓㄧㄇ
cim;ㄘㄧㄇ
sim;ㄙㄧㄇ
shim;ㄕㄧㄇ
rhim;ㄖㄧㄇ`;

let ka15 = `diam;ㄉㄧㄚㄇ
tiam;ㄊㄧㄚㄇ
liam;ㄌㄧㄚㄇ
giam;ㄍㄧㄚㄇ
kiam;ㄎㄧㄚㄇ
ngiam;兀ㄧㄚㄇ
hiam;ㄏㄧㄚㄇ
ziam;ㄗㄧㄚㄇ
zhiam;ㄓㄧㄚㄇ
rhiam;ㄖㄧㄚㄇ
em;ㄝㄇ
kem;ㄎㄝㄇ
sem;ㄙㄝㄇ
deem;ㄉ乜ㄇ
teem;ㄊ乜ㄇ
neem;ㄋ乜ㄇ
heem;ㄏ乜ㄇ`;

let ka16 = `an;ㄢ
ban;ㄅㄢ
pan;ㄆㄢ
man;ㄇㄢ
fan;ㄈㄢ
bban;万ㄢ
dan;ㄉㄢ
tan;ㄊㄢ
nan;ㄋㄢ
lan;ㄌㄢ
han;ㄏㄢ
can;ㄘㄢ
san;ㄙㄢ
bin;ㄅㄧㄣ
pin;ㄆㄧㄣ
min;ㄇㄧㄣ
fin;ㄈㄧㄣ
bbin;万ㄧㄣ
din;ㄉㄧㄣ
lin;ㄌㄧㄣ
gin;ㄍㄧㄣ
kin;ㄎㄧㄣ
ngin;兀ㄧㄣ
hin;ㄏㄧㄣ
zin;ㄗㄧㄣ
zhin;ㄓㄧㄣ
cin;ㄘㄧㄣ
chin;ㄔㄧㄣ
sin;ㄙㄧㄣ
shin;ㄕㄧㄣ
rhin;ㄖㄧㄣ`;

let ka17 = `bun;ㄅㄨㄣ
pun;ㄆㄨㄣ
mun;ㄇㄨㄣ
fun;ㄈㄨㄣ
bbun;万ㄨㄣ
dun;ㄉㄨㄣ
nun;ㄋㄨㄣ
lun;ㄌㄨㄣ
gun;ㄍㄨㄣ
kun;ㄎㄨㄣ
ngun;兀ㄨㄣ
cun;ㄘㄨㄣ
sun;ㄙㄨㄣ
guan;ㄍㄨㄢ
kuan;ㄎㄨㄢ
on;ㄛㄣ
pon;ㄆㄛㄣ
don;ㄉㄛㄣ
ton;ㄊㄛㄣ
non;ㄋㄛㄣ
lon;ㄌㄛㄣ
gon;ㄍㄛㄣ
kon;ㄎㄛㄣ
hon;ㄏㄛㄣ
con;ㄘㄛㄣ
chon;ㄔㄛㄣ
son;ㄙㄛㄣ`;

let ka18 = `en;ㄝㄣ
ben;ㄅㄝㄣ
pen;ㄆㄝㄣ
men;ㄇㄝㄣ
den;ㄉㄝㄣ
ten;ㄊㄝㄣ
nen;ㄋㄝㄣ
len;ㄌㄝㄣ
gen;ㄍㄝㄣ
ken;ㄎㄝㄣ
zhen;ㄓㄝㄣ
cen;ㄘㄝㄣ
chen;ㄔㄝㄣ
sen;ㄙㄝㄣ
shen;ㄕㄝㄣ
rhen;ㄖㄝㄣ`;

let ka19 = `bien;ㄅㄧㄝㄣ
pien;ㄆㄧㄝㄣ
mien;ㄇㄧㄝㄣ
fien;ㄈㄧㄝㄣ
bbien;万ㄧㄝㄣ
lien;ㄌㄧㄝㄣ
gien;ㄍㄧㄝㄣ
kien;ㄎㄧㄝㄣ
ngien;兀ㄧㄝㄣ
hien;ㄏㄧㄝㄣ
zien;ㄗㄧㄝㄣ
cien;ㄘㄧㄝㄣ
sien;ㄙㄧㄝㄣ
kuen;ㄎㄨㄝㄣ
been;ㄅ乜ㄣ
peen;ㄆ乜ㄣ
meen;ㄇ乜ㄣ
deen;ㄉ乜ㄣ
teen;ㄊ乜ㄣ
neen;ㄋ乜ㄣ
leen;ㄌ乜ㄣ
geen;ㄍ乜ㄣ
heen;ㄏ乜ㄣ
rheen;ㄖ乜ㄣ`;

let ka20 = `ang;ㄤ
bang;ㄅㄤ
pang;ㄆㄤ
mang;ㄇㄤ
bbang;万ㄤ
nang;ㄋㄤ
lang;ㄌㄤ
gang;ㄍㄤ
hang;ㄏㄤ
zhang;ㄓㄤ
cang;ㄘㄤ
chang;ㄔㄤ
sang;ㄙㄤ
shang;ㄕㄤ
ding;ㄉㄧㄥ
king;ㄎㄧㄥ
cing;ㄘㄧㄥ`;

let ka21 = `pung;ㄆㄨㄥ
fung;ㄈㄨㄥ
bbung;万ㄨㄥ
dung;ㄉㄨㄥ
tung;ㄊㄨㄥ
nung;ㄋㄨㄥ
lung;ㄌㄨㄥ
gung;ㄍㄨㄥ
kung;ㄎㄨㄥ
zung;ㄗㄨㄥ
zhung;ㄓㄨㄥ
cung;ㄘㄨㄥ
chung;ㄔㄨㄥ
rhung;ㄖㄨㄥ`;

let ka22 = `biang;ㄅㄧㄤ
piang;ㄆㄧㄤ
miang;ㄇㄧㄤ
liang;ㄌㄧㄤ
giang;ㄍㄧㄤ
kiang;ㄎㄧㄤ
ngiang;兀ㄧㄤ
ziang;ㄗㄧㄤ
ciang;ㄘㄧㄤ
rhiang;ㄖㄧㄤ
tiung;ㄊㄧㄨㄥ
liung;ㄌㄧㄨㄥ
giung;ㄍㄧㄨㄥ
hiung;ㄏㄧㄨㄥ
siung;ㄙㄧㄨㄥ`;

let ka23 = `ong;ㄛㄥ
bong;ㄅㄛㄥ
pong;ㄆㄛㄥ
mong;ㄇㄛㄥ
fong;ㄈㄛㄥ
bbong;万ㄛㄥ
dong;ㄉㄛㄥ
tong;ㄊㄛㄥ
long;ㄌㄛㄥ
gong;ㄍㄛㄥ
kong;ㄎㄛㄥ
ngong;兀ㄛㄥ
hong;ㄏㄛㄥ
zong;ㄗㄛㄥ
zhong;ㄓㄛㄥ
cong;ㄘㄛㄥ
chong;ㄔㄛㄥ
song;ㄙㄛㄥ
shong;ㄕㄛㄥ`;

let ka24 = `biong;ㄅㄧㄛㄥ
piong;ㄆㄧㄛㄥ
miong;ㄇㄧㄛㄥ
liong;ㄌㄧㄛㄥ
giong;ㄍㄧㄛㄥ
kiong;ㄎㄧㄛㄥ
ngiong;兀ㄧㄛㄥ
hiong;ㄏㄧㄛㄥ
ziong;ㄗㄧㄛㄥ
ciong;ㄘㄧㄛㄥ
siong;ㄙㄧㄛㄥ
rhiong;ㄖㄧㄛㄥ
ann;ㄚ°
cann;ㄘㄚ°
inn;ㄧ°
pinn;ㄆㄧ°
ginn;ㄍㄧ°
cinn;ㄘㄧ°
painn;ㄆㄞ°
hainn;ㄏㄞ°
iaunn;ㄧㄠ°
suainn;ㄙㄨㄞ°`;


let kasu01 = ka01.concat("\n", ka02, "\n", ka03, "\n", ka07, "\n", ka09);
let kasu02 = ka04.concat("\n", ka05, "\n", ka06, "\n", ka08, "\n", ka10);
let kasu03 = ka11.concat("\n", ka12, "\n", ka13);
let kasu04 = ka14.concat("\n", ka16, "\n", ka17, "\n", ka18, "\n", ka20, "\n", ka23);
let kasu05 = ka15.concat("\n", ka19, "\n", ka21, "\n", ka22, "\n", ka24);
let kasu00 = kasu01.concat("\n", kasu02, "\n", kasu03, "\n", kasu04, "\n", kasu05);

//========================================;
/*
let arrList02 = [[abcBpm, "#字母BPM"], 
[abcAbc, "#字母ABC"], 
[abcQaz, "#字母QAZ"], 
[abcFa, "#字母-食指"], 
[abcFb, "#字母-中指"], 
[abcFc, "#字母-無名指"],
[abcFd, "#字母-大小指"]];
*/
// 陣列清單; 預設亂數，不亂數則名稱前加#，如 [biaodian, "#標點符號"], ;

let arrList01 = [[kasu00, "全部"], 
[ka01, "#a"], 
[ka02, "#i"], 
[ka03, "#u"], 
[ka04, "#ai"], 
[ka05, "#ia"], 
[ka06, "#iu"], 
[ka07, "#o"], 
[ka08, "#io"], 
[ka09, "#e"], 
[ka10, "#eu"], 
[ka11, "#ab"], 
[ka12, "#bad"], 
[ka13, "#bed"], 
[ka14, "#am"], 
[ka15, "#diam"], 
[ka16, "#an"], 
[ka17, "#bun"], 
[ka18, "#en"], 
[ka19, "#bien"], 
[ka20, "#ang"], 
[ka21, "#pung"], 
[ka22, "#biang"], 
[ka23, "#ong"], 
[ka24, "#biong"],
[kasu01, "母音1"],
[kasu02, "母音2"],
[kasu03, "入聲"],
[kasu04, "鼻聲1"],
[kasu05, "鼻聲2"]];

// 陣列清單; 預設亂數，不亂數則名稱前加#，如 [biaodian, "#標點符號"], ;
//arrList = arrList01.concat(arrList00);

arrList = arrList01;







