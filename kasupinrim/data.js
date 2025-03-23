const myData = `
分類	字詞	拼音	音檔
1. 基本元音	ㄚ	a	k001.kasupinyin
1. 基本元音	丨	i	k002.kasupinyin
1. 基本元音	媽媽	aˇ i	k003.kasupinyin
1. 基本元音	ㄨ	u	k004.kasupinyin
1. 基本元音	爸爸	aˇ uˊ	k005.kasupinyin
1. 基本元音	ㄝ	e	k006.kasupinyin
1. 基本元音	矮矮	e eˆ	k007.kasupinyin
1. 基本元音	爸爸矮矮	aˇ uˊ e eˆ	k008.kasupinyin
1. 基本元音	ㄛ	o	k009.kasupinyin
1. 基本元音	ㄜ	oo	k010.kasupinyin
1. 基本元音	兇惡	oo ooˊ	k011.kasupinyin
1. 基本元音	我的媽呀	aˇ i ooˇ	k012.kasupinyin
2. 聲母b	ㄅ	b	k013.kasupinyin
2. 聲母b	ㄆ	p	k014.kasupinyin
2. 聲母b	ㄇ	m	k015.kasupinyin
2. 聲母b	ㄈ	f	k016.kasupinyin
2. 聲母b	比	biˆ	k017.kasupinyin
2. 聲母b	白白	pa pa	k018.kasupinyin
2. 聲母b	無	moˋ	k019.kasupinyin
2. 聲母b	馬	maˇ	k020.kasupinyin
2. 聲母b	畫	fa	k021.kasupinyin
2. 聲母b	睡	fe	k022.kasupinyin
2. 聲母b	阿婆	aˇ pooˋ	k023.kasupinyin
2. 聲母b	爸爸比媽媽矮	aˇ uˊ biˇ aˇ i eˆ	k024.kasupinyin
2. 聲母b	無米	mo⁺ miˆ	k025.kasupinyin
2. 聲母b	阿婆無白米	aˇ pooˋ mo⁺ pa⁺ miˆ	k026.kasupinyin
2. 聲母b	媽媽不肯睡	aˇ i m⁺ fe	k027.kasupinyin
3. 聲母d	ㄉ	d	k028.kasupinyin
3. 聲母d	ㄊ	t	k029.kasupinyin
3. 聲母d	ㄋ	n	k030.kasupinyin
3. 聲母d	ㄌ	l	k031.kasupinyin
3. 聲母d	在	da	k032.kasupinyin
3. 聲母d	圖	tuˋ	k033.kasupinyin
3. 聲母d	拿	te	k034.kasupinyin
3. 聲母d	泥	niˋ	k035.kasupinyin
3. 聲母d	這	liˊ	k036.kasupinyin
3. 聲母d	老	looˆ	k037.kasupinyin
3. 聲母d	畫圖	fa⁺ tuˋ	k038.kasupinyin
3. 聲母d	老虎	loo fuˆ	k039.kasupinyin
3. 聲母d	弟弟	aˇ teˇ	k040.kasupinyin
3. 聲母d	葡萄	pu⁺ tooˋ	k041.kasupinyin
4. 聲母g	ㄍ	g	k042.kasupinyin
4. 聲母g	ㄎ	k	k043.kasupinyin
4. 聲母g	ㄏ	h	k044.kasupinyin
4. 聲母g	那	gaˊ	k045.kasupinyin
4. 聲母g	高高	goo gooˇ	k046.kasupinyin
4. 聲母g	客	kaˊ	k047.kasupinyin
4. 聲母g	騎	kiˋ	k048.kasupinyin
4. 聲母g	苦苦	ku kuˆ	k049.kasupinyin
4. 聲母g	蝦	haˋ	k050.kasupinyin
4. 聲母g	是	he	k051.kasupinyin
4. 聲母g	不是	mˇ me	k052.kasupinyin
4. 聲母g	好	hooˆ	k053.kasupinyin
4. 聲母g	好嗎？	hooˆ moˇ	k054.kasupinyin
4. 聲母g	不好	mo⁺ hooˆ	k055.kasupinyin
4. 聲母g	不可以	m⁺ moˆ	k056.kasupinyin
4. 聲母g	好像是	na he	k057.kasupinyin
4. 聲母g	地上	ni⁺ haˇ	k058.kasupinyin
4. 聲母g	那那這這	ga ga li liˊ	k059.kasupinyin
4. 聲母g	阿婆在騎馬	aˇ pooˋ da ki⁺ maˇ	k060.kasupinyin
4. 聲母g	那好像是弟弟	gaˊ na he aˇ teˇ	k061.kasupinyin
4. 聲母g	那不是弟弟	gaˊ mˇ me⁺ aˇ teˇ	k062.kasupinyin
4. 聲母g	老虎在地上睡	loo fuˆ da ni⁺ haˇ fe	k063.kasupinyin
5. 聲母z	ㄗ	z	k064.kasupinyin
5. 聲母z	ㄘ	c	k065.kasupinyin
5. 聲母z	ㄙ	s	k066.kasupinyin
5. 聲母z	捉	zooˊ	k067.kasupinyin
5. 聲母z	茶	caˋ	k068.kasupinyin
5. 聲母z	掃	sooˆ	k069.kasupinyin
5. 聲母z	姊姊	aˇ ziˆ	k070.kasupinyin
5. 聲母z	麻糬	ciˋ	k071.kasupinyin
5. 聲母z	糯米麻糬	nu⁺ miˇ ciˋ	k072.kasupinyin
5. 聲母z	四	siˆ	k073.kasupinyin
5. 聲母z	第四	ti⁺ siˆ	k074.kasupinyin
5. 聲母z	一起	zoo puˋ	k075.kasupinyin
5. 聲母z	捉老虎	zoo loo fuˆ	k076.kasupinyin
5. 聲母z	茶花	ca⁺ faˇ	k077.kasupinyin
5. 聲母z	掃把	soo baˆ	k078.kasupinyin
5. 聲母z	話	su	k079.kasupinyin
5. 聲母z	客家話	ka su	k080.kasupinyin
5. 聲母z	客氣	seˇ ngi	k081.kasupinyin
5. 聲母z	小孩	se zuˆ	k082.kasupinyin
5. 聲母z	誰？	ni⁺ saˋ	k083.kasupinyin
5. 聲母z	弟弟排第四	aˇ teˇ pe⁺ ti⁺ siˆ	k084.kasupinyin
5. 聲母z	姊姊學客家話	aˇ ziˆ hoo⁺ ka su	k085.kasupinyin
5. 聲母z	不必客氣	m⁺ suˇ seˇ ngi	k086.kasupinyin
6. 聲母zh	ㄓ	zh	k087.kasupinyin
6. 聲母zh	ㄔ	ch	k088.kasupinyin
6. 聲母zh	ㄕ	sh	k089.kasupinyin
6. 聲母zh	ㄖ	rh	k090.kasupinyin
6. 聲母zh	隻	zhaˊ	k091.kasupinyin
6. 聲母zh	車	chaˇ	k092.kasupinyin
6. 聲母zh	蛇	shaˋ	k093.kasupinyin
6. 聲母zh	阿姨	aˇ rhiˋ	k094.kasupinyin
6. 聲母zh	正確	choo	k095.kasupinyin
6. 聲母zh	不正確	m⁺ choo	k096.kasupinyin
6. 聲母zh	叔叔	aˇ shuˊ	k097.kasupinyin
6. 聲母zh	開車	suˇ chaˇ	k098.kasupinyin
6. 聲母zh	注意	zhi rhiˆ	k099.kasupinyin
6. 聲母zh	正確嗎？	choo moˇ	k100.kasupinyin
6. 聲母zh	阿姨開車	aˇ rhiˋ suˇ chaˇ	k101.kasupinyin
6. 聲母zh	那隻老虎很兇惡	gaˇ zha⁺ loo fuˆ oo ooˊ	k102.kasupinyin
6. 聲母zh	叔叔牙齒白白	aˇ shuˊ ngaˋ pa pa	k103.kasupinyin
7. 聲母ng	兀	ng	k104.kasupinyin
7. 聲母ng	牙	ngaˋ	k105.kasupinyin
7. 聲母ng	二	ngi	k106.kasupinyin
7. 聲母ng	鵝	ngoˋ	k107.kasupinyin
7. 聲母ng	第二	ti⁺ ngi	k108.kasupinyin
7. 聲母ng	媽媽牙齒白白	aˇ i ngaˋ pa pa	k109.kasupinyin
7. 聲母ng	爸爸畫白鵝	aˇ uˊ fa⁺ pa⁺ ngoˋ	k110.kasupinyin
7. 聲母ng	万	bb	k111.kasupinyin
7. 聲母ng	靠近	bbaˆ	k112.kasupinyin
7. 聲母ng	味	bbi	k113.kasupinyin
7. 聲母ng	雨	bbuˆ	k114.kasupinyin
7. 聲母ng	哭	bbooˆ	k115.kasupinyin
7. 聲母ng	下雨	loo⁺ bbuˆ	k116.kasupinyin
7. 聲母ng	氣味	kiˇ bbi	k117.kasupinyin
7. 聲母ng	黑黑	bbu bbuˇ	k118.kasupinyin
7. 聲母ng	房子	bbu haˇ	k119.kasupinyin
7. 聲母ng	烏白	bbuˇ pa	k120.kasupinyin
7. 聲母ng	在哪裡？	da ni⁺ bbi	k121.kasupinyin
7. 聲母ng	不可以亂拿	m⁺ moˇ bbuˇ pa⁺ te	k122.kasupinyin
8. 聲調	高平	¯	k123.kasupinyin
8. 聲調	低升	ˊ	k124.kasupinyin
8. 聲調	低平	ˇ	k125.kasupinyin
8. 聲調	高降	ˋ	k126.kasupinyin
8. 聲調	低降	ˆ	k127.kasupinyin
8. 聲調	中平	⁺	k128.kasupinyin
9. 複元音1	ㄞ	ai	k129.kasupinyin
9. 複元音1	ㄠ	au	k130.kasupinyin
9. 複元音1	拜拜	bai baiˆ	k131.kasupinyin
9. 複元音1	飽飽	bau bauˆ	k132.kasupinyin
9. 複元音1	五個	m gaiˆ	k133.kasupinyin
9. 複元音1	學校	hoo⁺ hau	k134.kasupinyin
9. 複元音1	我	ngaiˋ	k135.kasupinyin
9. 複元音1	丨ㄚ	ia	k136.kasupinyin
9. 複元音1	ㄨㄚ	ua	k137.kasupinyin
9. 複元音1	這裡	liaˊ	k138.kasupinyin
9. 複元音1	活的	ua e	k139.kasupinyin
9. 複元音1	寫字	siaˇ cu	k140.kasupinyin
9. 複元音1	這是我寫的字	liaˊ he ngaiˋ siaˆ e⁺ cu	k141.kasupinyin
9. 複元音1	那隻馬是活的	gaˇ zha⁺ maˇ he⁺ ua e	k142.kasupinyin
10. 複元音2	ㄨㄞ	uai	k143.kasupinyin
10. 複元音2	丨ㄠ	iau	k144.kasupinyin
10. 複元音2	怪怪	guai guaiˆ	k145.kasupinyin
10. 複元音2	餓餓	iau iauˇ	k146.kasupinyin
10. 複元音2	丨ㄜ	io	k147.kasupinyin
10. 複元音2	丨ㄨ	iu	k148.kasupinyin
10. 複元音2	腳	gioˊ	k149.kasupinyin
10. 複元音2	九	giuˆ	k150.kasupinyin
10. 複元音2	手	shiuˆ	k151.kasupinyin
10. 複元音2	臭臭	chiu chiuˆ	k152.kasupinyin
10. 複元音2	手錶	shiu bioˆ	k153.kasupinyin
10. 複元音2	打球	daˇ kiuˋ	k154.kasupinyin
10. 複元音2	這是我的手錶	liaˊ he⁺ ngaiˋ e⁺ shiu bioˆ	k155.kasupinyin
10. 複元音2	我好餓喔	ngaiˋ ziu iauˇ eˇ	k156.kasupinyin
10. 複元音2	腳好臭喔	gioˊ ziu chiuˆ eˇ	k157.kasupinyin
11. 複元音3	ㄨㄝ	ue	k158.kasupinyin
11. 複元音3	ㄨ丨	ui	k159.kasupinyin
11. 複元音3	回	fueˋ	k160.kasupinyin
11. 複元音3	會	bbue	k161.kasupinyin
11. 複元音3	飛	bui	k162.kasupinyin
11. 複元音3	他	guiˋ	k163.kasupinyin
11. 複元音3	鬼	guiˆ	k164.kasupinyin
11. 複元音3	背書	pue⁺ shiˇ	k165.kasupinyin
11. 複元音3	第二回	ti⁺ ngi⁺ fueˋ	k166.kasupinyin
11. 複元音3	我會背書	ngaiˋ bbue⁺ pue⁺ shiˇ	k167.kasupinyin
11. 複元音3	ㄛ丨	oi	k168.kasupinyin
11. 複元音3	ㄝㄨ	eu	k169.kasupinyin
11. 複元音3	愛	oiˆ	k170.kasupinyin
11. 複元音3	害	hoi	k171.kasupinyin
11. 複元音3	來	loiˋ	k172.kasupinyin
11. 複元音3	妹妹	aˇ moiˆ	k173.kasupinyin
11. 複元音3	頭	teuˋ	k174.kasupinyin
11. 複元音3	狗	geuˆ	k175.kasupinyin
11. 複元音3	厲害	li⁺ hoi	k176.kasupinyin
11. 複元音3	來來去去	loi⁺ loi⁺ kui kuiˆ	k177.kasupinyin
11. 複元音3	開車必須小心	suˇ chaˇ oiˇ seˇ ngi	k178.kasupinyin
11. 複元音3	那隻狗最厲害	gaˇ zha⁺ geuˆ teu⁺ li⁺ hoi	k179.kasupinyin
11. 複元音3	弟弟愛哭又愛笑	aˇ teˇ oi bbooˆ goo oi sioˆ	k180.kasupinyin
12. 複元音4 ee	乜	ee	k181.kasupinyin
12. 複元音4 ee	大聲講	dee	k182.kasupinyin
12. 複元音4 ee	大聲講不停	dee⁺ dee⁺ buiˆ	k183.kasupinyin
12. 複元音4 ee	乜ㄨ	eeu	k184.kasupinyin
12. 複元音4 ee	玩	leeu	k185.kasupinyin
12. 複元音4 ee	跳	teeuˆ	k186.kasupinyin
12. 複元音4 ee	鳥	deeuˆ	k187.kasupinyin
12. 複元音4 ee	去麥寮玩	kuiˇ ma⁺ leeuˋ leeu	k188.kasupinyin
12. 複元音4 ee	鳥會飛	deeuˆ bbue⁺ bui	k189.kasupinyin
12. 複元音4 ee	那隻狗跳最高	gaˇ zha⁺ geuˆ teeuˇ teu⁺ gooˇ	k190.kasupinyin
13. 閉唇1 m b	ㄚㄇ	am	k191.kasupinyin
13. 閉唇1 m b	丨ㄇ	im	k192.kasupinyin
13. 閉唇1 m b	ㄚㄅ	ab	k193.kasupinyin
13. 閉唇1 m b	丨ㄅ	ib	k194.kasupinyin
13. 閉唇1 m b	暗暗	am amˆ	k195.kasupinyin
13. 閉唇1 m b	和	ham	k196.kasupinyin
13. 閉唇1 m b	金金	gim gimˇ	k197.kasupinyin
13. 閉唇1 m b	母鴨	ab maˋ	k198.kasupinyin
13. 閉唇1 m b	垃圾	liˇ sabˊ	k199.kasupinyin
13. 閉唇1 m b	急急	gib gibˊ	k200.kasupinyin
13. 閉唇1 m b	十	shibˋ	k201.kasupinyin
13. 閉唇1 m b	衣褲	samˇ kuˆ	k202.kasupinyin
13. 閉唇1 m b	喝茶	limˇ caˋ	k203.kasupinyin
13. 閉唇1 m b	晚上	amˇ rhia	k204.kasupinyin
13. 閉唇1 m b	他和我去打球	guiˋ ham⁺ ngaiˋ kuiˇ daˇ kiuˋ	k205.kasupinyin
13. 閉唇1 m b	他喝十杯茶	guiˋ limˇ shib⁺ bueˇ caˋ	k206.kasupinyin
14. 閉唇2 m b	ㄝㄇ	em	k207.kasupinyin
14. 閉唇2 m b	蓋被子	emˇ piˇ	k208.kasupinyin
14. 閉唇2 m b	乜ㄇ	eem	k209.kasupinyin
14. 閉唇2 m b	鹹鹹	heem heemˋ	k210.kasupinyin
14. 閉唇2 m b	丨ㄚㄇ	iam	k211.kasupinyin
14. 閉唇2 m b	累累	tiam tiamˆ	k212.kasupinyin
14. 閉唇2 m b	鹽	rhiamˋ	k213.kasupinyin
14. 閉唇2 m b	鹽鹹鹹	rhiamˋ heem heemˋ	k214.kasupinyin
14. 閉唇2 m b	玩到很累	leeu⁺ dooˇ tiam tiamˆ	k215.kasupinyin
14. 閉唇2 m b	ㄝㄅ	eb	k216.kasupinyin
14. 閉唇2 m b	撮	zebˊ	k217.kasupinyin
14. 閉唇2 m b	乜ㄅ	eeb	k218.kasupinyin
14. 閉唇2 m b	窄窄的	heeb heebˋ	k219.kasupinyin
14. 閉唇2 m b	丨ㄚㄅ	iab	k220.kasupinyin
14. 閉唇2 m b	粒	liabˋ	k221.kasupinyin
14. 閉唇2 m b	黏黏的	giab giabˊ	k222.kasupinyin
14. 閉唇2 m b	房子窄窄的	bbu haˇ heeb heebˋ	k223.kasupinyin
14. 閉唇2 m b	妹妹的手黏黏的	aˇ moiˆ e⁺ shiuˆ giab giabˊ	k224.kasupinyin
15. 舌尖1 n l	ㄢ	an	k225.kasupinyin
15. 舌尖1 n l	丨ㄣ	in	k226.kasupinyin
15. 舌尖1 n l	ㄚㄉ	ad	k227.kasupinyin
15. 舌尖1 n l	丨ㄉ	id	k228.kasupinyin
15. 舌尖1 n l	這樣	anˊ	k229.kasupinyin
15. 舌尖1 n l	快快	gin ginˆ	k230.kasupinyin
15. 舌尖1 n l	結束	sadˊ	k231.kasupinyin
15. 舌尖1 n l	七	cidˊ	k232.kasupinyin
15. 舌尖1 n l	丟	gidˋ	k233.kasupinyin
15. 舌尖1 n l	一	rhidˊ	k234.kasupinyin
15. 舌尖1 n l	這樣沒錯	anˊ mo⁺ m⁺ choo	k235.kasupinyin
15. 舌尖1 n l	叔叔車開很快	aˇ shuˊ chaˇ suˇ zhinˇ ginˆ	k236.kasupinyin
15. 舌尖1 n l	妹妹畫七朵花	aˇ moiˆ fa⁺ cid luiˇ faˇ	k237.kasupinyin
15. 舌尖1 n l	這齣戲做完了	liˇ chid hiˆ zooˇ sadˊ a⁺	k238.kasupinyin
15. 舌尖1 n l	垃圾拿去丟	liˇ sabˊ te⁺ kuiˇ gidˋ	k239.kasupinyin
16. 舌尖2 n l	一撮鹽	rhid zeb rhiamˋ	k240.kasupinyin
16. 舌尖2 n l	一粒球	rhid liab⁺ kiuˋ	k241.kasupinyin
16. 舌尖2 n l	ㄨㄣ	un	k242.kasupinyin
16. 舌尖2 n l	ㄝㄣ	en	k243.kasupinyin
16. 舌尖2 n l	乜ㄣ	een	k244.kasupinyin
16. 舌尖2 n l	近近	kun kunˇ	k245.kasupinyin
16. 舌尖2 n l	你	henˋ	k246.kasupinyin
16. 舌尖2 n l	跟隨	tenˋ	k247.kasupinyin
16. 舌尖2 n l	田	teenˋ	k248.kasupinyin
16. 舌尖2 n l	遠遠那裡	un gaˊ	k249.kasupinyin
16. 舌尖2 n l	便宜	pen⁺ ngiˋ	k250.kasupinyin
16. 舌尖2 n l	我跟著你去田裡	ngaiˋ ten⁺ henˋ kuiˇ teenˋ	k251.kasupinyin
16. 舌尖2 n l	學校在那裡	hoo⁺ hau da un gaˊ	k252.kasupinyin
17. 舌尖3 n l	ㄨㄉ	ud	k253.kasupinyin
17. 舌尖3 n l	ㄝㄉ	ed	k254.kasupinyin
17. 舌尖3 n l	乜ㄉ	eed	k255.kasupinyin
17. 舌尖3 n l	骨	gudˊ	k256.kasupinyin
17. 舌尖3 n l	色	sedˊ	k257.kasupinyin
17. 舌尖3 n l	八	beedˊ	k258.kasupinyin
17. 舌尖3 n l	眼睛	mud zhiˇ	k259.kasupinyin
17. 舌尖3 n l	八百八十	beed ba beed shibˋ	k260.kasupinyin
17. 舌尖3 n l	這是金色	liaˊ he⁺ gimˇ sedˊ	k261.kasupinyin
17. 舌尖3 n l	小孩很活潑	se zuˆ zhinˇ ua⁺ gudˊ	k262.kasupinyin
18. 舌尖4 n l	ㄛㄣ	on	k263.kasupinyin
18. 舌尖4 n l	丨ㄝㄣ	ien	k264.kasupinyin
18. 舌尖4 n l	ㄛㄉ	od	k265.kasupinyin
18. 舌尖4 n l	丨ㄝㄉ	ied	k266.kasupinyin
18. 舌尖4 n l	寒冷	hon honˋ	k267.kasupinyin
18. 舌尖4 n l	錢	cienˋ	k268.kasupinyin
18. 舌尖4 n l	渴	kodˊ	k269.kasupinyin
18. 舌尖4 n l	吃	shiedˋ	k270.kasupinyin
18. 舌尖4 n l	流汗	lau⁺ hon	k271.kasupinyin
18. 舌尖4 n l	口渴	zheˆ kodˊ	k272.kasupinyin
18. 舌尖4 n l	好吃	hooˇ shiedˋ	k273.kasupinyin
18. 舌尖4 n l	物件	mi⁺ kien	k274.kasupinyin
18. 舌尖4 n l	老師	sienˇ senˇ	k275.kasupinyin
18. 舌尖4 n l	老師錢很多	sienˇ senˇ cienˋ zhinˇ dooˇ	k276.kasupinyin
18. 舌尖4 n l	東西很好吃	mi⁺ kien zhinˇ hooˇ shiedˋ	k277.kasupinyin
19. 舌尖5 n l	ㄨㄝㄣ	uen	k278.kasupinyin
19. 舌尖5 n l	ㄨㄢ	uan	k279.kasupinyin
19. 舌尖5 n l	ㄨㄚㄉ	uad	k280.kasupinyin
19. 舌尖5 n l	勸	kuenˆ	k281.kasupinyin
19. 舌尖5 n l	專心	zhuanˇ simˇ	k282.kasupinyin
19. 舌尖5 n l	決定	guad ten	k283.kasupinyin
19. 舌尖5 n l	寬闊	kuad kuadˊ	k284.kasupinyin
19. 舌尖5 n l	他的房子很寬闊	guiˋ e⁺ bbu haˇ kuad kuadˊ	k285.kasupinyin
20. 鼻化nn	ㄚ ̊	ann	k286.kasupinyin
20. 鼻化nn	丨 ̊	inn	k287.kasupinyin
20. 鼻化nn	餡料	annˇ	k288.kasupinyin
20. 鼻化nn	鼻	pinn	k289.kasupinyin
20. 鼻化nn	包餡料	bauˇ annˇ	k290.kasupinyin
20. 鼻化nn	流鼻涕	lau⁺ pinn	k291.kasupinyin
20. 鼻化nn	ㄞ ̊	ainn	k292.kasupinyin
20. 鼻化nn	丨ㄠ ̊	iaunn	k293.kasupinyin
20. 鼻化nn	ㄨㄞ ̊	uainn	k294.kasupinyin
20. 鼻化nn	壞	painnˆ	k295.kasupinyin
20. 鼻化nn	不好吃	painnˇ shiedˋ	k296.kasupinyin
20. 鼻化nn	小鴨子	ab iaunn	k297.kasupinyin
20. 鼻化nn	歪歪	uainn uainnˇ	k298.kasupinyin
20. 鼻化nn	字寫得歪歪的	cu siaˇ dooˇ uainn uainnˇ	k299.kasupinyin
21. 舌根1 ng	ㄤ	ang	k300.kasupinyin
21. 舌根1 ng	丨ㄥ	ing	k301.kasupinyin
21. 舌根1 ng	走	hangˋ	k302.kasupinyin
21. 舌根1 ng	堅硬	ding dingˇ	k303.kasupinyin
21. 舌根1 ng	ㄨㄥ	ung	k304.kasupinyin
21. 舌根1 ng	ㄛㄥ	ong	k305.kasupinyin
21. 舌根1 ng	腫	zhungˆ	k306.kasupinyin
21. 舌根1 ng	放置	kongˆ	k307.kasupinyin
21. 舌根1 ng	講話	gongˇ su	k308.kasupinyin
21. 舌根1 ng	都好	lung hooˆ	k309.kasupinyin
21. 舌根1 ng	桌上	zoo dungˆ	k310.kasupinyin
21. 舌根1 ng	走很快	hang⁺ gin ginˆ	k311.kasupinyin
21. 舌根1 ng	他的頭硬硬	guiˋ e⁺ teu⁺ naˋ ding dingˇ	k312.kasupinyin
21. 舌根1 ng	你的眼睛腫腫	henˋ e⁺ mud zhiˇ zhung zhungˆ	k313.kasupinyin
21. 舌根1 ng	東西放在桌上	mi⁺ kien kongˇ da zoo dungˆ	k314.kasupinyin
22. 舌根2 ng	丨ㄤ	iang	k315.kasupinyin
22. 舌根2 ng	ㄨㄤ	uang	k316.kasupinyin
22. 舌根2 ng	漂亮	ziang ziangˇ	k317.kasupinyin
22. 舌根2 ng	梗	guangˆ	k318.kasupinyin
22. 舌根2 ng	怕怕	giang giangˇ	k319.kasupinyin
22. 舌根2 ng	丨ㄛㄥ	iong	k320.kasupinyin
22. 舌根2 ng	丨ㄨㄥ	iung	k321.kasupinyin
22. 舌根2 ng	放	biongˆ	k322.kasupinyin
22. 舌根2 ng	長長	chong chongˋ	k323.kasupinyin
22. 舌根2 ng	養	giungˇ	k324.kasupinyin
22. 舌根2 ng	高雄	gooˇ hiungˋ	k325.kasupinyin
22. 舌根2 ng	他會怕鬼	guiˋ bbue⁺ giangˇ guiˆ	k326.kasupinyin
22. 舌根2 ng	你的衣褲很漂亮	henˋ e⁺ samˇ kuˆ zhinˇ ziangˇ	k327.kasupinyin
22. 舌根2 ng	放風箏	biongˇ fungˇ cheˇ	k328.kasupinyin
22. 舌根2 ng	阿婆在養雞	aˇ pooˋ da giungˇ geˇ	k329.kasupinyin
22. 舌根2 ng	我家在高雄	ngai⁺ bbu haˇ da gooˇ hiungˋ	k330.kasupinyin
22. 舌根2 ng	你的腳很長	henˋ e⁺ gioˊ zhinˇ chongˋ	k331.kasupinyin
`;