﻿let arrList = [];

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




let nanyi5101 =`年邁
疲累
灌注
疲倦
感恩
遇上
賠償
焦急
謹慎
因禍得福
一擁而上
灘
某
邁
拖
疲
擁
灌
倦
恩
遇
擦
痕
賠
償
焦
謹
慎
禍`;

let nanyi5102 =`師傅
延長線
豐富
平穩
熟練
準確
掃把
服務
讚美
口碑
業績
保障
效率
內涵
預見
井然有序
傅
釘
延
遞
富
穩
井
熟
確
掃
務
讚
碑
績
障
率
涵
預`;

let nanyi5103 =`評語
索性
相似
考卷
清楚
拼音
妒忌
愛惜
慈祥
慚愧
張燈結綵
橡皮擦
糊里糊塗
眉清目秀
評
性
似
卷
楚
綵
橡
塗
拼
眉
秀
妒
忌
屏
惜
慈
慚
愧`;

let nanyi5104 =`乳白色
渲染
臭美
岩漿
產生
物質
煙囪
遠眺
排列
耀眼
關係
漲潮
特殊
呈現
面貌
星羅棋布
目眩神迷
乳
渲
臭
漿
泉
產
質
囪
眺
列
羅
耀
眩
係
漲
殊
呈
貌`;

let nanyi5105 =`行駛
陡峭
蕾絲
斷崖
躍動
坑洞
稻田
翠綠
搖曳
醉心
黃澄澄
凹凸不平
鬼斧神工
駛
陡
峭
蕾
崖
躍
燕
凹
凸
坑
斧
臨
縱
澄
稻
翠
曳
醉`;

let nanyi5106 =`綻放
螃蟹
似乎
水溝
緩緩
印象
腹部
浸溼
繁殖
愈加
喪命
悲劇
顯得
阻斷
目不暇給
綻
暇
螃
乎
溝
緩
印
蹲
腹
浸
陸
殖
愈
喪
悲
顯
阻
歷`;

let nanyi5107 =`設計
圓弧
磁磚
鱗片
糖霜
天際
偉大
堅持
鐵欄杆
目瞪口呆
張牙舞爪
設
弧
杆
棟
磁
鱗
薑
霜
爪
聖
際
瞪
繪
玻
璃
遺
偉
堅`;

let nanyi5108 =`相撲
螺貝
山葵
柔美
旋律
硬是
抗議
辣椒
大蒜
蓋子
家鄉味
疊羅漢
鄉
撲
螺
鮭
葵
稠
柔
旋
律
麥
硬
扁
抗
筋
椒
蒜
漢
蓋`;

let nanyi5109 =`一股
藉由
探訪
購買
協助
翻譯
捐款
開挖
賺錢
雜務
鄰居
不夠
鐵路局
基金會
付諸實行
股
藉
訪
購
票
售
協
譯
局
款
挖
賺
雜
鄰
幣
夠
基
諸`;

let nanyi5110 =`閒事
責罵
究竟
拐彎
擔心
規勸
記仇
討論
郊遊
聯繫
互相
情誼
音訊
鬧彆扭
光明磊落
閒
罵
究
拐
擔
彆
扭
規
勸
仇
討
郊
鍋
繫
互
誼
訊
磊`;

let nanyi5111 =`瀑布
下垂
財富
炫耀
守衛
鬍子
輕盈
飛逝
禱告
上帝
驚訝
百貨公司
恍然大悟
黯然失色
昂貴
瀑
垂
財
炫
黯
錶
衛
鬍
盈
逝
貨
司
禱
帝
訝
恍
悟
昂`;

let nanyi5112 =`桂花
詩人
幽靜
繚繞
描寫
敏銳
辭藻
輕舟
白帝城
歸心似箭
鳴
澗
桂
詩
幽
繚
描
煩
敏
銳
城
辭
猿
啼
舟
赦
歸
箭`;


//========================================;
let arrList00 = [[biaodian, "#標點符號"], 
[basicWord, "#簡單字"], 
[basicWord2, "#簡單字+標點"], 
[wordsDses, "#東興信箱"], 
[dsesDizhi, "#東興地址"]];
// 陣列清單; 預設亂數，不亂數則名稱前加#，如 [biaodian, "#標點符號"], ;

let arrList01 = [[nanyi5101, "#(1)幸福筆記本"], 
[nanyi5102, "#(2)做人做事做長久"], 
[nanyi5103, "#(3)孔雀錯了"], 
[nanyi5104, "#(4)特別的海"], 
[nanyi5105, "#(5)漫遊花東"], 
[nanyi5106, "#(6)護送螃蟹過馬路"], 
[nanyi5107, "#(7)高第的魔法建築"], 
[nanyi5108, "#(8)嘗嘗我的家鄉味"], 
[nanyi5109, "#(9)小小力量將世界照亮"], 
[nanyi5110, "#(10)男生說，女生說"], 
[nanyi5111, "#(11)耶誕禮物"], 
[nanyi5112, "#(12)漫遊詩情"]];
// 陣列清單; 預設亂數，不亂數則名稱前加#，如 [biaodian, "#標點符號"], ;
arrList = arrList01.concat(arrList00);

