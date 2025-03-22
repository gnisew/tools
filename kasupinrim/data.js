const myData = `
分類	拼音	字詞	音檔
1. 基本元音	a	ㄚ	k001.kasupinyin
1. 基本元音	i	丨	k002.kasupinyin
1. 基本元音	aˇ i	媽媽	k003.kasupinyin
1. 基本元音	u	ㄨ	k004.kasupinyin
1. 基本元音	aˇ uˊ	爸爸	k005.kasupinyin
1. 基本元音	e	ㄝ	k006.kasupinyin
1. 基本元音	e eˆ	矮矮	k007.kasupinyin
1. 基本元音	aˇ uˊ e eˆ	爸爸矮矮	k008.kasupinyin
1. 基本元音	o	ㄛ	k009.kasupinyin
1. 基本元音	oo	ㄜ	k010.kasupinyin
1. 基本元音	oo ooˊ	兇惡	k011.kasupinyin
1. 基本元音	aˇ i ooˇ	我的媽呀	k012.kasupinyin
2. 聲母b	b	ㄅ	k013.kasupinyin
2. 聲母b	p	ㄆ	k014.kasupinyin
2. 聲母b	m	ㄇ	k015.kasupinyin
2. 聲母b	f	ㄈ	k016.kasupinyin
2. 聲母b	biˆ	比	k017.kasupinyin
2. 聲母b	pa pa	白白	k018.kasupinyin
2. 聲母b	moˋ	無	k019.kasupinyin
2. 聲母b	maˇ	馬	k020.kasupinyin
2. 聲母b	fa	畫	k021.kasupinyin
2. 聲母b	fe	睡	k022.kasupinyin
2. 聲母b	aˇ pooˋ	阿婆	k023.kasupinyin
2. 聲母b	aˇ uˊ biˇ aˇ i eˆ	爸爸比媽媽矮	k024.kasupinyin
2. 聲母b	mo⁺ miˆ	無米	k025.kasupinyin
2. 聲母b	aˇ pooˋ mo⁺ pa⁺ miˆ	阿婆無白米	k026.kasupinyin
2. 聲母b	aˇ i m⁺ fe	媽媽不肯睡	k027.kasupinyin
3. 聲母d	d	ㄉ	k028.kasupinyin
3. 聲母d	t	ㄊ	k029.kasupinyin
3. 聲母d	n	ㄋ	k030.kasupinyin
3. 聲母d	l	ㄌ	k031.kasupinyin
3. 聲母d	da	在	k032.kasupinyin
3. 聲母d	tuˋ	圖	k033.kasupinyin
3. 聲母d	te	拿	k034.kasupinyin
3. 聲母d	niˋ	泥	k035.kasupinyin
3. 聲母d	liˊ	這	k036.kasupinyin
3. 聲母d	looˆ	老	k037.kasupinyin
3. 聲母d	fa⁺ tuˋ	畫圖	k038.kasupinyin
3. 聲母d	loo fuˆ	老虎	k039.kasupinyin
3. 聲母d	aˇ teˇ	弟弟	k040.kasupinyin
3. 聲母d	pu⁺ tooˋ	葡萄	k041.kasupinyin
4. 聲母g	g	ㄍ	k042.kasupinyin
4. 聲母g	k	ㄎ	k043.kasupinyin
4. 聲母g	h	ㄏ	k044.kasupinyin
4. 聲母g	gaˊ	那	k045.kasupinyin
4. 聲母g	goo gooˇ	高高	k046.kasupinyin
4. 聲母g	kaˊ	客	k047.kasupinyin
4. 聲母g	kiˋ	騎	k048.kasupinyin
4. 聲母g	ku kuˆ	苦苦	k049.kasupinyin
4. 聲母g	haˋ	蝦	k050.kasupinyin
4. 聲母g	he	是	k051.kasupinyin
4. 聲母g	mˇ me	不是	k052.kasupinyin
4. 聲母g	hooˆ	好	k053.kasupinyin
4. 聲母g	hooˆ moˇ	好嗎？	k054.kasupinyin
4. 聲母g	mo⁺ hooˆ	不好	k055.kasupinyin
4. 聲母g	m⁺ moˆ	不可以	k056.kasupinyin
4. 聲母g	na he	好像是	k057.kasupinyin
4. 聲母g	ni⁺ haˇ	地上	k058.kasupinyin
4. 聲母g	ga ga li liˊ	那那這這	k059.kasupinyin
4. 聲母g	aˇ pooˋ da ki⁺ maˇ	阿婆在騎馬	k060.kasupinyin
4. 聲母g	gaˊ na he aˇ teˇ	那好像是弟弟	k061.kasupinyin
4. 聲母g	gaˊ mˇ me⁺ aˇ teˇ	那不是弟弟	k062.kasupinyin
4. 聲母g	loo fuˆ da ni⁺ haˇ fe	老虎在地上睡	k063.kasupinyin
5. 聲母z	z	ㄗ	k064.kasupinyin
5. 聲母z	c	ㄘ	k065.kasupinyin
5. 聲母z	s	ㄙ	k066.kasupinyin
5. 聲母z	zooˊ	捉	k067.kasupinyin
5. 聲母z	caˋ	茶	k068.kasupinyin
5. 聲母z	sooˆ	掃	k069.kasupinyin
5. 聲母z	aˇ ziˆ	姊姊	k070.kasupinyin
5. 聲母z	ciˋ	麻糬	k071.kasupinyin
5. 聲母z	nu⁺ miˇ ciˋ	糯米麻糬	k072.kasupinyin
5. 聲母z	siˆ	四	k073.kasupinyin
5. 聲母z	ti⁺ siˆ	第四	k074.kasupinyin
5. 聲母z	zoo puˋ	一起	k075.kasupinyin
5. 聲母z	zoo loo fuˆ	捉老虎	k076.kasupinyin
5. 聲母z	ca⁺ faˇ	茶花	k077.kasupinyin
5. 聲母z	soo baˆ	掃把	k078.kasupinyin
5. 聲母z	su	話	k079.kasupinyin
5. 聲母z	ka su	客家話	k080.kasupinyin
5. 聲母z	seˇ ngi	客氣	k081.kasupinyin
5. 聲母z	se zuˆ	小孩	k082.kasupinyin
5. 聲母z	ni⁺ saˋ	誰？	k083.kasupinyin
5. 聲母z	aˇ teˇ pe⁺ ti⁺ siˆ	弟弟排第四	k084.kasupinyin
5. 聲母z	aˇ ziˆ hoo⁺ ka su	姊姊學客家話	k085.kasupinyin
5. 聲母z	m⁺ suˇ seˇ ngi	不必客氣	k086.kasupinyin
6. 聲母zh	zh	ㄓ	k087.kasupinyin
6. 聲母zh	ch	ㄔ	k088.kasupinyin
6. 聲母zh	sh	ㄕ	k089.kasupinyin
6. 聲母zh	rh	ㄖ	k090.kasupinyin
6. 聲母zh	zhaˊ	隻	k091.kasupinyin
6. 聲母zh	chaˇ	車	k092.kasupinyin
6. 聲母zh	shaˋ	蛇	k093.kasupinyin
6. 聲母zh	aˇ rhiˋ	阿姨	k094.kasupinyin
6. 聲母zh	choo	正確	k095.kasupinyin
6. 聲母zh	m⁺ choo	不正確	k096.kasupinyin
6. 聲母zh	aˇ shuˊ	叔叔	k097.kasupinyin
6. 聲母zh	suˇ chaˇ	開車	k098.kasupinyin
6. 聲母zh	zhi rhiˆ	注意	k099.kasupinyin
6. 聲母zh	choo moˇ	正確嗎？	k100.kasupinyin
6. 聲母zh	aˇ rhiˋ suˇ chaˇ	阿姨開車	k101.kasupinyin
6. 聲母zh	gaˇ zha⁺ loo fuˆ oo ooˊ	那隻老虎很兇惡	k102.kasupinyin
6. 聲母zh	aˇ shuˊ ngaˋ pa pa	叔叔牙齒白白	k103.kasupinyin
7. 聲母ng	ng	兀	k104.kasupinyin
7. 聲母ng	ngaˋ	牙	k105.kasupinyin
7. 聲母ng	ngi	二	k106.kasupinyin
7. 聲母ng	ngoˋ	鵝	k107.kasupinyin
7. 聲母ng	ti⁺ ngi	第二	k108.kasupinyin
7. 聲母ng	aˇ i ngaˋ pa pa	媽媽牙齒白白	k109.kasupinyin
7. 聲母ng	aˇ uˊ fa⁺ pa⁺ ngoˋ	爸爸畫白鵝	k110.kasupinyin
7. 聲母ng	bb	万	k111.kasupinyin
7. 聲母ng	bbaˆ	靠近	k112.kasupinyin
7. 聲母ng	bbi	味	k113.kasupinyin
7. 聲母ng	bbuˆ	雨	k114.kasupinyin
7. 聲母ng	bbooˆ	哭	k115.kasupinyin
7. 聲母ng	loo⁺ bbuˆ	下雨	k116.kasupinyin
7. 聲母ng	kiˇ bbi	氣味	k117.kasupinyin
7. 聲母ng	bbu bbuˇ	黑黑	k118.kasupinyin
7. 聲母ng	bbu haˇ	房子	k119.kasupinyin
7. 聲母ng	bbuˇ pa	烏白	k120.kasupinyin
7. 聲母ng	da ni⁺ bbi	在哪裡？	k121.kasupinyin
7. 聲母ng	m⁺ moˇ bbuˇ pa⁺ te	不可以亂拿	k122.kasupinyin
8. 聲調	¯	高平	k123.kasupinyin
8. 聲調	ˊ	低升	k124.kasupinyin
8. 聲調	ˇ	低平	k125.kasupinyin
8. 聲調	ˋ	高降	k126.kasupinyin
8. 聲調	ˆ	低降	k127.kasupinyin
8. 聲調	⁺	中平	k128.kasupinyin
9. 複元音1	ai	ㄞ	k129.kasupinyin
9. 複元音1	au	ㄠ	k130.kasupinyin
9. 複元音1	bai baiˆ	拜拜	k131.kasupinyin
9. 複元音1	bau bauˆ	飽飽	k132.kasupinyin
9. 複元音1	m gaiˆ	五個	k133.kasupinyin
9. 複元音1	hoo⁺ hau	學校	k134.kasupinyin
9. 複元音1	ngaiˋ	我	k135.kasupinyin
9. 複元音1	ia	丨ㄚ	k136.kasupinyin
9. 複元音1	ua	ㄨㄚ	k137.kasupinyin
9. 複元音1	liaˊ	這裡	k138.kasupinyin
9. 複元音1	ua e	活的	k139.kasupinyin
9. 複元音1	siaˇ cu	寫字	k140.kasupinyin
9. 複元音1	liaˊ he ngaiˋ siaˆ e⁺ cu	這是我寫的字	k141.kasupinyin
9. 複元音1	gaˇ zha⁺ maˇ he⁺ ua e	那隻馬是活的	k142.kasupinyin
9. 複元音1	uai	ㄨㄞ	k143.kasupinyin
9. 複元音1	iau	丨ㄠ	k144.kasupinyin
9. 複元音1	guai guaiˆ	怪怪	k145.kasupinyin
9. 複元音1	iau iauˇ	餓餓	k146.kasupinyin
9. 複元音1	io	丨ㄜ	k147.kasupinyin
9. 複元音1	iu	丨ㄨ	k148.kasupinyin
9. 複元音1	gioˊ	腳	k149.kasupinyin
9. 複元音1	giuˆ	九	k150.kasupinyin
9. 複元音1	shiuˆ	手	k151.kasupinyin
9. 複元音1	chiu chiuˆ	臭臭	k152.kasupinyin
9. 複元音1	shiu bioˆ	手錶	k153.kasupinyin
9. 複元音1	daˇ kiuˋ	打球	k154.kasupinyin
9. 複元音1	liaˊ he⁺ ngaiˋ e⁺ shiu bioˆ	這是我的手錶	k155.kasupinyin
9. 複元音1	ngaiˋ ziu iauˇ eˇ	我好餓喔	k156.kasupinyin
9. 複元音1	gioˊ ziu chiuˆ eˇ	腳好臭喔	k157.kasupinyin
10. 複元音2	ue	ㄨㄝ	k158.kasupinyin
10. 複元音2	ui	ㄨ丨	k159.kasupinyin
10. 複元音2	fueˋ	回	k160.kasupinyin
10. 複元音2	bbue	會	k161.kasupinyin
10. 複元音2	bui	飛	k162.kasupinyin
10. 複元音2	guiˋ	他	k163.kasupinyin
10. 複元音2	guiˆ	鬼	k164.kasupinyin
10. 複元音2	pue⁺ shiˇ	背書	k165.kasupinyin
10. 複元音2	ti⁺ ngi⁺ fueˋ	第二回	k166.kasupinyin
10. 複元音2	ngaiˋ bbue⁺ pue⁺ shiˇ	我會背書	k167.kasupinyin
10. 複元音2	oi	ㄛ丨	k168.kasupinyin
10. 複元音2	eu	ㄝㄨ	k169.kasupinyin
10. 複元音2	oiˆ	愛	k170.kasupinyin
10. 複元音2	hoi	害	k171.kasupinyin
10. 複元音2	loiˋ	來	k172.kasupinyin
10. 複元音2	aˇ moiˆ	妹妹	k173.kasupinyin
10. 複元音2	teuˋ	頭	k174.kasupinyin
10. 複元音2	geuˆ	狗	k175.kasupinyin
10. 複元音2	li⁺ hoi	厲害	k176.kasupinyin
10. 複元音2	loi⁺ loi⁺ kui kuiˆ	來來去去	k177.kasupinyin
10. 複元音2	suˇ chaˇ oiˇ seˇ ngi	開車必須小心	k178.kasupinyin
10. 複元音2	gaˇ zha⁺ geuˆ teu⁺ li⁺ hoi	那隻狗最厲害	k179.kasupinyin
10. 複元音2	aˇ teˇ oi bbooˆ goo oi sioˆ	弟弟愛哭又愛笑	k180.kasupinyin
10. 複元音2	ee	乜	k181.kasupinyin
10. 複元音2	dee	大聲講	k182.kasupinyin
10. 複元音2	dee⁺ dee⁺ buiˆ	大聲講不停	k183.kasupinyin
10. 複元音2	eeu	乜ㄨ	k184.kasupinyin
10. 複元音2	leeu	玩	k185.kasupinyin
10. 複元音2	teeuˆ	跳	k186.kasupinyin
10. 複元音2	deeuˆ	鳥	k187.kasupinyin
10. 複元音2	kuiˇ ma⁺ leeuˋ leeu	去麥寮玩	k188.kasupinyin
10. 複元音2	deeuˆ bbue⁺ bui	鳥會飛	k189.kasupinyin
10. 複元音2	gaˇ zha⁺ geuˆ teeuˇ teu⁺ gooˇ	那隻狗跳最高	k190.kasupinyin
11. 閉唇m b	am	ㄚㄇ	k191.kasupinyin
11. 閉唇m b	im	丨ㄇ	k192.kasupinyin
11. 閉唇m b	ab	ㄚㄅ	k193.kasupinyin
11. 閉唇m b	ib	丨ㄅ	k194.kasupinyin
11. 閉唇m b	am amˆ	暗暗	k195.kasupinyin
11. 閉唇m b	ham	和	k196.kasupinyin
11. 閉唇m b	gim gimˇ	金金	k197.kasupinyin
11. 閉唇m b	ab maˋ	母鴨	k198.kasupinyin
11. 閉唇m b	liˇ sabˊ	垃圾	k199.kasupinyin
11. 閉唇m b	gib gibˊ	急急	k200.kasupinyin
11. 閉唇m b	shibˋ	十	k201.kasupinyin
11. 閉唇m b	samˇ kuˆ	衣褲	k202.kasupinyin
11. 閉唇m b	limˇ caˋ	喝茶	k203.kasupinyin
11. 閉唇m b	amˇ rhia	晚上	k204.kasupinyin
11. 閉唇m b	guiˋ ham⁺ ngaiˋ kuiˇ daˇ kiuˋ	他和我去打球	k205.kasupinyin
11. 閉唇m b	guiˋ limˇ shib⁺ bueˇ caˋ	他喝十杯茶	k206.kasupinyin
11. 閉唇m b	em	ㄝㄇ	k207.kasupinyin
11. 閉唇m b	emˇ piˇ	蓋被子	k208.kasupinyin
11. 閉唇m b	eem	乜ㄇ	k209.kasupinyin
11. 閉唇m b	heem heemˋ	鹹鹹	k210.kasupinyin
11. 閉唇m b	iam	丨ㄚㄇ	k211.kasupinyin
11. 閉唇m b	tiam tiamˆ	累累	k212.kasupinyin
11. 閉唇m b	rhiamˋ	鹽	k213.kasupinyin
11. 閉唇m b	rhiamˋ heem heemˋ	鹽鹹鹹	k214.kasupinyin
11. 閉唇m b	leeu⁺ dooˇ tiam tiamˆ	玩到很累	k215.kasupinyin
11. 閉唇m b	eb	ㄝㄅ	k216.kasupinyin
11. 閉唇m b	zebˊ	撮	k217.kasupinyin
11. 閉唇m b	eeb	乜ㄅ	k218.kasupinyin
11. 閉唇m b	heeb heebˋ	窄窄的	k219.kasupinyin
11. 閉唇m b	iab	丨ㄚㄅ	k220.kasupinyin
11. 閉唇m b	liabˋ	粒	k221.kasupinyin
11. 閉唇m b	giab giabˊ	黏黏的	k222.kasupinyin
11. 閉唇m b	bbu haˇ heeb heebˋ	房子窄窄的	k223.kasupinyin
11. 閉唇m b	aˇ moiˆ e⁺ shiuˆ giab giabˊ	妹妹的手黏黏的	k224.kasupinyin
12. 舌尖n l	an	ㄢ	k225.kasupinyin
12. 舌尖n l	in	丨ㄣ	k226.kasupinyin
12. 舌尖n l	ad	ㄚㄉ	k227.kasupinyin
12. 舌尖n l	id	丨ㄉ	k228.kasupinyin
12. 舌尖n l	anˊ	這樣	k229.kasupinyin
12. 舌尖n l	gin ginˆ	快快	k230.kasupinyin
12. 舌尖n l	sadˊ	結束	k231.kasupinyin
12. 舌尖n l	cidˊ	七	k232.kasupinyin
12. 舌尖n l	gidˋ	丟	k233.kasupinyin
12. 舌尖n l	rhidˊ	一	k234.kasupinyin
12. 舌尖n l	anˊ mo⁺ m⁺ choo	這樣沒錯	k235.kasupinyin
12. 舌尖n l	aˇ shuˊ chaˇ suˇ zhinˇ ginˆ	叔叔車開很快	k236.kasupinyin
12. 舌尖n l	aˇ moiˆ fa⁺ cid luiˇ faˇ	妹妹畫七朵花	k237.kasupinyin
12. 舌尖n l	liˇ chid hiˆ zooˇ sadˊ a⁺	這齣戲做完了	k238.kasupinyin
12. 舌尖n l	liˇ sabˊ te⁺ kuiˇ gidˋ	垃圾拿去丟	k239.kasupinyin
12. 舌尖n l	rhid zeb rhiamˋ	一撮鹽	k240.kasupinyin
12. 舌尖n l	rhid liab⁺ kiuˋ	一粒球	k241.kasupinyin
12. 舌尖n l	un	ㄨㄣ	k242.kasupinyin
12. 舌尖n l	en	ㄝㄣ	k243.kasupinyin
12. 舌尖n l	een	乜ㄣ	k244.kasupinyin
12. 舌尖n l	kun kunˇ	近近	k245.kasupinyin
12. 舌尖n l	henˋ	你	k246.kasupinyin
12. 舌尖n l	tenˋ	跟隨	k247.kasupinyin
12. 舌尖n l	teenˋ	田	k248.kasupinyin
12. 舌尖n l	un gaˊ	遠遠那裡	k249.kasupinyin
12. 舌尖n l	pen⁺ ngiˋ	便宜	k250.kasupinyin
12. 舌尖n l	ngaiˋ ten⁺ henˋ kuiˇ teenˋ	我跟著你去田裡	k251.kasupinyin
12. 舌尖n l	hoo⁺ hau da un gaˊ	學校在那裡	k252.kasupinyin
12. 舌尖n l	ud	ㄨㄉ	k253.kasupinyin
12. 舌尖n l	ed	ㄝㄉ	k254.kasupinyin
12. 舌尖n l	eed	乜ㄉ	k255.kasupinyin
12. 舌尖n l	gudˊ	骨	k256.kasupinyin
12. 舌尖n l	sedˊ	色	k257.kasupinyin
12. 舌尖n l	beedˊ	八	k258.kasupinyin
12. 舌尖n l	mud zhiˇ	眼睛	k259.kasupinyin
12. 舌尖n l	beed ba beed shibˋ	八百八十	k260.kasupinyin
12. 舌尖n l	liaˊ he⁺ gimˇ sedˊ	這是金色	k261.kasupinyin
12. 舌尖n l	se zuˆ zhinˇ ua⁺ gudˊ	小孩很活潑	k262.kasupinyin
12. 舌尖n l	on	ㄛㄣ	k263.kasupinyin
12. 舌尖n l	ien	丨ㄝㄣ	k264.kasupinyin
12. 舌尖n l	od	ㄛㄉ	k265.kasupinyin
12. 舌尖n l	ied	丨ㄝㄉ	k266.kasupinyin
12. 舌尖n l	hon honˋ	寒冷	k267.kasupinyin
12. 舌尖n l	cienˋ	錢	k268.kasupinyin
12. 舌尖n l	kodˊ	渴	k269.kasupinyin
12. 舌尖n l	shiedˋ	吃	k270.kasupinyin
12. 舌尖n l	lau⁺ hon	流汗	k271.kasupinyin
12. 舌尖n l	zheˆ kodˊ	口渴	k272.kasupinyin
12. 舌尖n l	hooˇ shiedˋ	好吃	k273.kasupinyin
12. 舌尖n l	mi⁺ kien	物件	k274.kasupinyin
12. 舌尖n l	sienˇ senˇ	老師	k275.kasupinyin
12. 舌尖n l	sienˇ senˇ cienˋ zhinˇ dooˇ	老師錢很多	k276.kasupinyin
12. 舌尖n l	mi⁺ kien zhinˇ hooˇ shiedˋ	東西很好吃	k277.kasupinyin
12. 舌尖n l	uen	ㄨㄝㄣ	k278.kasupinyin
12. 舌尖n l	uan	ㄨㄢ	k279.kasupinyin
12. 舌尖n l	uad	ㄨㄚㄉ	k280.kasupinyin
12. 舌尖n l	kuenˆ	勸	k281.kasupinyin
12. 舌尖n l	zhuanˇ simˇ	專心	k282.kasupinyin
12. 舌尖n l	guad ten	決定	k283.kasupinyin
12. 舌尖n l	kuad kuadˊ	寬闊	k284.kasupinyin
12. 舌尖n l	guiˋ e⁺ bbu haˇ kuad kuadˊ	他的房子很寬闊	k285.kasupinyin
12. 舌尖n l	ann	ㄚ ̊	k286.kasupinyin
12. 舌尖n l	inn	丨 ̊	k287.kasupinyin
12. 舌尖n l	annˇ	餡料	k288.kasupinyin
12. 舌尖n l	pinn	鼻	k289.kasupinyin
12. 舌尖n l	bauˇ annˇ	包餡料	k290.kasupinyin
12. 舌尖n l	lau⁺ pinn	流鼻涕	k291.kasupinyin
12. 舌尖n l	ainn	ㄞ ̊	k292.kasupinyin
12. 舌尖n l	iaunn	丨ㄠ ̊	k293.kasupinyin
12. 舌尖n l	uainn	ㄨㄞ ̊	k294.kasupinyin
12. 舌尖n l	painnˆ	壞	k295.kasupinyin
12. 舌尖n l	painnˇ shiedˋ	不好吃	k296.kasupinyin
12. 舌尖n l	ab iaunn	小鴨子	k297.kasupinyin
12. 舌尖n l	uainn uainnˇ	歪歪	k298.kasupinyin
12. 舌尖n l	cu siaˇ dooˇ uainn uainnˇ	字寫得歪歪的	k299.kasupinyin
13. 舌根ng	ang	ㄤ	k300.kasupinyin
13. 舌根ng	ing	丨ㄥ	k301.kasupinyin
13. 舌根ng	hangˋ	走	k302.kasupinyin
13. 舌根ng	ding dingˇ	堅硬	k303.kasupinyin
13. 舌根ng	ung	ㄨㄥ	k304.kasupinyin
13. 舌根ng	ong	ㄛㄥ	k305.kasupinyin
13. 舌根ng	zhungˆ	腫	k306.kasupinyin
13. 舌根ng	kongˆ	放置	k307.kasupinyin
13. 舌根ng	gongˇ su	講話	k308.kasupinyin
13. 舌根ng	lung hooˆ	都好	k309.kasupinyin
13. 舌根ng	zoo dungˆ	桌上	k310.kasupinyin
13. 舌根ng	hang⁺ gin ginˆ	走很快	k311.kasupinyin
13. 舌根ng	guiˋ e⁺ teu⁺ naˋ ding dingˇ	他的頭硬硬	k312.kasupinyin
13. 舌根ng	henˋ e⁺ mud zhiˇ zhung zhungˆ	你的眼睛腫腫	k313.kasupinyin
13. 舌根ng	mi⁺ kien kongˇ da zoo dungˆ	東西放在桌上	k314.kasupinyin
13. 舌根ng	iang	丨ㄤ	k315.kasupinyin
13. 舌根ng	uang	ㄨㄤ	k316.kasupinyin
13. 舌根ng	ziang ziangˇ	漂亮	k317.kasupinyin
13. 舌根ng	guangˆ	梗	k318.kasupinyin
13. 舌根ng	giang giangˇ	怕怕	k319.kasupinyin
13. 舌根ng	iong	丨ㄛㄥ	k320.kasupinyin
13. 舌根ng	iung	丨ㄨㄥ	k321.kasupinyin
13. 舌根ng	biongˆ	放	k322.kasupinyin
13. 舌根ng	chong chongˋ	長長	k323.kasupinyin
13. 舌根ng	giungˇ	養	k324.kasupinyin
13. 舌根ng	gooˇ hiungˋ	高雄	k325.kasupinyin
13. 舌根ng	guiˋ bbue⁺ giangˇ guiˆ	他會怕鬼	k326.kasupinyin
13. 舌根ng	henˋ e⁺ samˇ kuˆ zhinˇ ziangˇ	你的衣褲很漂亮	k327.kasupinyin
13. 舌根ng	biongˇ fungˇ cheˇ	放風箏	k328.kasupinyin
13. 舌根ng	aˇ pooˋ da giungˇ geˇ	阿婆在養雞	k329.kasupinyin
13. 舌根ng	ngai⁺ bbu haˇ da gooˇ hiungˋ	我家在高雄	k330.kasupinyin
13. 舌根ng	henˋ e⁺ gioˊ zhinˇ chongˋ	你的腳很長	k331.kasupinyin
`;