//list of words
let words = [];

let word1 = ["阿依;aˇ i","阿怙;aˇ uˊ","矮矮;eˆ eˆ","惡惡;ooˊ ooˊ","比;biˆ","白白;pa pa","無;moˋ","馬;maˇ","畫;fa","睡;fe","阿婆;aˇ pooˋ","無米;moˋ miˆ","在;da","圖;tuˋ","提;te","泥;niˋ","這;liˊ","老;looˆ","畫圖;fa tuˋ","老虎;looˆ fuˆ","阿弟;aˇ teˇ","葡萄;puˋ tooˋ",];
let word2 = ["遐;gaˊ","高高;gooˇ gooˇ","客;kaˊ","騎;kiˋ","苦苦;kuˆ kuˆ","蝦;haˋ","係;he","毋係;mˇ he","好;hooˆ","好無;hooˆ moˋ","無好;moˋ hooˆ","毋好;m hooˆ","若係;na he","泥下;niˋ haˇ",];
let word3 = ["捉;zooˊ","茶;caˋ","掃;sooˆ","阿姊;aˇ ziˆ","粢;ciˋ","四;siˆ","第四;ti siˆ","作垺;zooˊ puˋ","捉老虎;zooˊ looˆ fuˆ","茶花;caˋ faˇ","掃把;sooˆ baˆ","事;su","客事;kaˊ su","細子;seˆ zuˆ","哪儕;ni saˋ","隻;zhaˊ","車;chaˇ","蛇;shaˋ","阿姨;aˇ rhiˋ","著;choo","阿叔;aˇ shuˊ","駛車;suˆ chaˇ","注意;zhiˆ rhiˆ","著無;choo moˋ",];
let word4 = ["牙;ngaˋ","二;ngi","鵝;ngoˋ","第二;ti ngi","偎;bbaˆ","味;bbi","雨;bbuˆ","唩;bbooˆ","落雨;loo bbuˆ","氣味;kiˆ bbi","烏烏;bbuˇ bbuˇ","屋下;bbuˊ haˇ","烏白;bbuˇ pa",];
let word5 = ["拜拜;baiˆ baiˆ","飽飽;bauˆ bauˆ","五個;mˆ gaiˆ","學校;hoo hau","𠊎;ngaiˋ","這;liaˊ","活个;ua e","寫字;siaˆ cu","怪怪;guaiˆ guaiˆ","枵枵;iauˇ iauˇ","腳;gioˊ","九;giuˆ","手;shiuˆ","臭臭;chiuˆ chiuˆ","手錶;shiuˆ bioˆ","打球;daˆ kiuˋ",];
let word6 = ["回;fueˋ","會;bbue","飛;bui","佢;guiˋ","鬼;guiˆ","背書;pue shiˇ","第二回;ti ngi fueˋ","愛;oiˆ","害;hoi","來;loiˋ","阿妹;aˇ moiˆ","頭;teuˋ","狗;geuˆ","厲害;li hoi","喋;dee","喋喋咈;dee dee buiˆ","尞;leeu","跳;teeuˆ","鳥;deeuˆ","鳥會飛;deeuˆ bbue bui",];
let word7 = ["暗暗;amˆ amˆ","和;ham","金金;gimˇ gimˇ","母鴨;abˊ maˋ","垃圾;liˆ sabˊ","急急;gibˊ gibˊ","十;shibˋ","衫褲;samˇ kuˆ","啉茶;limˇ caˋ","暗夜;amˆ rhia","揞被;emˇ piˇ","鹹鹹;heemˋ heemˋ","悿悿;tiamˆ tiamˆ","鹽;rhiamˋ","鹽鹹鹹;rhiamˋ heemˋ heemˋ",];
let word8 = ["撮;zebˊ","狹狹;heebˋ heebˋ","粒;liabˋ","浹浹;giabˊ giabˊ","恁;anˊ","緊緊;ginˆ ginˆ","煞;sadˊ","七;cidˊ","擊;gidˋ","一;rhidˊ","一撮鹽;rhidˊ zebˊ rhiamˋ","一粒球;rhidˊ liabˋ kiuˋ","近近;kunˇ kunˇ","你;henˋ","跈;tenˋ","田;teenˋ","便宜;penˋ ngiˋ",];
let word9 = ["骨;gudˊ","色;sedˊ","八;beedˊ","目珠;mudˊ zhiˇ","寒寒;honˋ honˋ","錢;cienˋ","渴;kodˊ","食;shiedˋ","流汗;lauˋ hon","嘴渴;zheˆ kodˊ","好食;hooˆ shiedˋ","物件;mi kien","先生;sienˇ senˇ","勸;kuenˆ","專心;zhuanˇ simˇ","決定;guadˊ ten","闊闊;kuadˊ kuadˊ",];
let word10 = ["餡;annˇ","鼻;pinn","包餡;bauˇ annˇ","流濞;lauˋ pinn","歹;painnˆ","歹食;painnˆ shiedˋ","鴨么;abˊ iaunn","歪歪;uainnˇ uainnˇ","行;hangˋ","𠕇𠕇;dingˇ dingˇ","種;zhungˆ","囥;kongˆ","講事;gongˆ su","攏好;lungˆ hooˆ","桌崠;zooˊ dungˆ","行真緊;hangˋ ginˆ ginˆ","靚;ziangˇ ziangˇ","梗;guangˆ","驚驚;giangˇ giangˇ","放;biongˆ","長長;chongˋ chongˋ","供;giungˇ","高雄;gooˇ hiungˋ","放風吹;biongˆ fungˇ cheˇ"];










words2 = ["諸儂;tsy noèyng > tsēy noèyng","倪囝;niè kiāng > niè iāng","大儂;tuâi noèyng > toēy noèyng","老儂;lâu noèyng > lō noèyng","朋友;pèing iū > pēing ngiū","好儂;hō noèyng > hǒ noèyng","獃儂;ngài noèyng > ngěi noèyng","年輕;nièng khing > niēng khing","可愛;khō ǎi > kho ǎi","好疼;hō thiǎng > ho liǎng","尚緊;suông kīng > suòng ngīng","無𩑵;mò mêi > mǒ mêi","好笑;hō tshiǔ > ho tshiǔ","有味;ôu mêi > ù mêi","聰明;tshung mìng > tshōng mìng","妥當;thō tǒung > tho lǒung","結䋾;kiéh tā > kiét tā","定蟲;tiâng thoèyng > tiāng thoèyng","野忙;iā mòng > iǎ mòng","有閒;ôu èing > ū èing","你好;nȳ hō >","早安;tsiā ang > tsiǎ ang","再見;tsǎi kiěng > tsèi kiěng","頭髮;thàu huóh > thǒu uóh","目睭;meih tsiu > mēi tsiu","喙皮;tshuǐ phuì > tshuī buì","鬍鬚;hù sy > hū ly","牙齒;ngà khī > ngēi","脰脖;tâu uóh > tòu uóh","肩頭;kieng thàu > kiēng nàu","手臂;tshiū piě > tshiu biě","身體;sing thē > sìng thē","心臟;sing tsâung > sìng nâung","骹腿;kha thoēy > khà loēy","爽快;sōung khuǎi > soung nguǎi","健康;kyǒng khoung > kyōng khoung","清醒;tshing tshiāng > tshìng ngiāng","氣虧;khěi khui > khǐ khui","虛弱;hy yóh > hỳ yóh","強壯;kyòng tsâung > kyǒng tsâung","感冒;kāng mô > kang mô","㾤嗽;khoeyng sǎu > khoèyng nǎu","生命;seing mêing > sìng miâng","牲的;seing tih > seing nǐ","活的;uah tih > uah tǐ","傷害;suong hâi > suòng hâi","拍針;pháh tseing > phā jeing","拉尿;nà niû > nǎ niû","拉屎;nà sēi > nā sēi","擸𢶍;la tshia > lā tshia","家庭;ka tìng > kā tìng","老嬤;lâu mā > lòu mā","丈夫;tâung puo > tōung muo","爸嬭;pa nē > pà nē","依公;i kung > ī kung","依嬤;i mā > ì mā","叔公;tsýh kung > tsy̌ kung","嬸婆;sīng pò > sǐng mò","依爹;i tia > ī tia","依嬭;i nē > ì nē","依伯;i páh > ì páh","依母;i mū > ì mū","依家;i ka > ī ka","依嬸;i sīng > ì nīng","姑丈;ku tâung > kù luông","依姑;i ku > ī ku","依舅;i kiû > ì kiû","依妗;i kêing > ì kêing","姨丈;ì tâung > ǐ luông","依姨;i ì > ī ì","依哥;i ko > ī ko","依弟;i tiê > ì tiê","姊妹;tsiā muǐ > tsia muǐ","依姊;i tsiā > ì tsiā","依妹;i muǐ > ì muǐ","出世;tshóuh siě > tshu siě","生活;seing uah > sēing nguah","儂家;nùng ka > nǔng nga","我的;nguī tih > ngui lǐ","伊的;i tih > i lǐ","你的;nȳ tih > ny lǐ","渾儂;hùng noèyng > hǔng noèyng","底儂;tiē noèyng > tiě noèyng","無儂;mò noèyng > mǒ noèyng","只底;tsī tiē > tsí liē","夫底;hi tiē > hí liē","夫隻;hu tsiéh > huò iéh","另外;lêing nguî > lìng nguî","兩其;lâng kì > lāng ngì","什乇;seih nóh > siè nóh","底所;tiē noē > tié noē","怎能;tsēing nèing > tsěing neing","醫生;i seing > ī leing","護士;hôu soêy > hù loêy","郵差;iù tshe > iū je","警察;kīng tshiáh > king niáh","商人;suong ìng > suōng ngìng","漁民;ngỳ mìng > ngy̌ mìng","駕駛;kǎ sȳ > kà lȳ","工人;koeyng ìng > koēyng ngìng","兵哥;ping ko > pīng ko","歌手;ko tshiū > kò tshiū","總統;tsūng thōung > tsúng thōung","老闆;lâu pēing > lóu pēing","生意;seing ěi > sèing ngěi","職業;tséih ngieh > tsǐ ngieh","碎錢;tshǒy tsièng > tshoēy jièng","硼囝;phèing kiāng > phēing ngiāng","便宜;pièng ngì > pěing ngiè","價錢;kǎ tsièng > kā ièng","值錢;teih tsièng > tēih tsièng","耗費;hǒ hiě > hò iě","水果;tsuī kuō > tsuí uō","芭蕉;pa tsiu > pa jiu","葡萄;pò tò > pǒ lò","柑橘;kang kéih > kàng ngéih","蕃茄;huang khêi > huàng khêi","西瓜;se kua > sē ua","青菜;tshiang tshǎi > tshiàng nǎi","綠豆;luoh tâu > luò lâu","麵包;miêng pou > miēng pou","雞肉;kie nyh > kiē nyh","豬肉;ty nyh > tȳ nyh","泡麵;phǎu miêng > phòu miêng","餅乾;piāng kang > piǎng kang","月餅;nguoh piāng > nguò piāng","卵糕;lâung ko > lōung ngo","鹹餅;kèing piāng > kēing miāng","飲料;īng liâu > ing liâu","果汁;kuō tsáih > kuo tsáih","牛奶;ngù nèing > ngǔ nèing","豉油;siê iù > siē iù","點心;tiēng sing > tiěng ning","好食;hō sieh > hǒ lieh","喙燋;tshuǐ ta > tshuǐ ta","杯杯;pui pui > puī pui","盤盤;puàng puàng > puǎng puàng","瓢羹;phiù keing > phiū eing","刀囝;to kiāng > tò iāng","菜刀;tshǎi to > tshēi lo","食薰;sieh houng > siēh houng","眼鏡;ngāng kiǎng > ngang ngiǎng","衣裳;i suòng > ī luòng","外套;nguî thǒ > nguì thǒ","皮帶;phuì tǎi > phuǐ lǎi","袋袋;tôy tôy > toěy tôy","手指;tshiū tsī > tshiú lī","雨衣;ȳ i > y̌ i","運動;ôung tôyng > ùng tôung","籃球;làng kiù > lǎng ngiù","棒球;pâung kiù > pōung ngiù","𢲲球;lǒung kiù > lōung ngiù","跳舞;thiǔ ū > thiù ū","跑步;phàu puô > phǒu puô","泅水;siù tsuī > siū tsuī","溜冰;liû ping > liū ping","紙鷂;tsēi iû > tshèi iû","電動;tiêng tôung > tièng tôung","電影;tiêng īng > tièng ngīng","爬山;páh sang > pā sang","抱倒;pô tō > pò lō","雜誌;tsiah tsêi > tsià tsêi","報紙;pǒ tsēi > pò jēi","散步;sǎng puô > sàng puô","旅行;lȳ hèing > ly̌ èing","釣魚;tiǔ ngỳ > tiū ngỳ","做廚;tsǒ tuò > tsō tuò","評糷;phàng lâng > phǎng lâng","烤肉;khō nyh > khǒ nyh","鋼琴;kǒung khìng > kōung khìng","唱歌;tshuǒng ko > tshuōng ko","骹遛;kha liù > khā liù","骹遛;kha liù > khā liù","比賽;pī sǒy > pi lǒy","樂團;ngouh thuàng > ngōu thuàng","做歲;tsǒ huǐ > tsò uǐ","新年;sing nièng > sīng nièng","節慶;tsáih khěing > tseih khěing","假期;kǎ ki > kā ki","放假;pǒung kǎ > pùng ngǎ","慶祝;khěing tsóuh > khěing tsóuh","樓面;làu měing > lǒu měing","風燈;hung teing > hūng neing","房間;pùng kang > pūng ngang","房間;pùng kang > pūng ngang","廚房;tuò pùng > tuǒ bùng","書房;tsy pùng > tsȳ bùng","客廳;kháh thiang > khā liang","糞池;pǒung tiè > pūng thiè","樓頂;làu tīng > lōu līng","樓下;làu â > lǒu â","樓梯;làu thei > lōu thei","走廊;tsōu lòung > tsǒu lòung","水池;tsuī tiè > tsuǐ liè","花園;hua huòng > huā nguòng","牆壁;tshuòng piáh > tshuǒng piáh","書桌;tsy tóh > tsỳ lóh","長椅;tòung iē > tōung ngiē","鎖匙;sō siè > sǒ liè","機器;ki khěi > kì ěi","電話;tiêng uâ > tièng nguâ","電光;tiêng kuong > tiēng nguong","電腦;tiêng nō > tièng nō","電視;tiêng sêi > tièng sêi","冰箱;ping suong > pīng suong","鉸刀;ka to > kā lo","拾刷;kháh sáuh > kha sáuh","修理;siu lī > siù lī","成立;sìng lih > sǐng lih","校長;hâu tuōng > hòu luōng","主任;tsuō êing > tsuo êing","先生;sieng siang > sīng niang","學生;houh seing > hōuh seing","班長;pang tuōng > pàng tuōng","同學;tòung houh > tǔng ngouh","組長;tsū tuōng > tsú luōng","課本;khuǒ puōng > khuò buōng","書典;tsy tiēng > tsỳ tiēng","鉛筆;yòng péih > yǒng méih","粉筆;hūng péih > hung méih","黑板;heih pēing > héi pēing","圖畫;tù uâ > tǔ uâ","課業;khuǒ ngieh > khuō ngieh","國語;kuóh ngȳ > kuó ngȳ","數學;sǒu houh > sū ouh","自然;tsoêy yòng > tsȳ yòng","音樂;ing ngouh > īng ngouh","社會;siâ huî > sià uî","美術;mī suh > mǐ luh","話語;uâ ngȳ > uà ngȳ","健康;kyǒng khoung > kyōng khoung","體育;thē yh > thě yh","學校;houh hâu > hòu hâu","校園;hâu huòng > hōu nguòng","教室;kou séih > kòu léih","班級;pang kéih > pàng ngéih","小學;siū oh > siǔ oh","國中;kuóh tyng > kuǒ tyng","高中;ko tyng > kō lyng","大學;tuâi oh > toēy oh","拼音;phing ing > phīng nging","造句;tsǒ kuǒ > tsò kuǒ","答覆;táh hóuh > ta hóuh","練習;liêng sih > liēng sih","研究;ngièng kiǔ > ngieng kiǔ","伓別;īng páih > ìng máih","了解;liēu kē > liú kē","解釋;kē séih > ke léih","講話;kōung uâ > koung nguâ","捭鬮;pi khou > pī khou","測驗;tsháih ngiêng > tshei ngiêng","分數;hung sǒu > hùng nǒu","改正;kēi tsěing > ke tsěing","通過;thung kuǒ > thùng kuǒ","考書;khō tsy > khǒ y","成績;sìng tséih > sǐng néih","進步;tsěing puô > tsìng puô","退步;thǒy puô > thoèy buô","無𧸜;mò tâng > mǒ lâng","意見;ěi kiěng > ì kiěng","意思;ěi soěy > ì loěy","問題;ôung tè > ūng tè","故事;kǒu soêy > ku loêy","禮品;lē phīng > lé bīng","爬起;páh khī > pà ī","立正;lih tsěing > lì tsěing","行禮;kiàng lē > kiāng lē","禮拜;lē puǎi > le buǎi","禮拜;lē puǎi > le buǎi","拜六;puǎi loeyh > puēi loeyh","月份;nguoh hôung > nguò hôung","正月;tsiang nguoh > tsiāng nguoh","二月;nêi nguoh > nī nguoh","三月;sang nguoh > sāng nguoh","四月;sěi nguoh > sī nguoh","五月;ngôu nguoh > ngū nguoh","六月;loeyh nguoh > loēy nguoh","七月;tshéih nguoh > tshǐ nguoh","八月;páih nguoh > pěi nguoh","九月;kōu nguoh > kǒu nguoh","十月;seih nguoh > sēi nguoh","季份;kiě hôung > kiè ôung","春水;tshung tsuī > tshùng nuī","秋天;tshiu thieng > tshiū lieng","冬天;toeyng thieng > toēyng nieng","下晝;â tǎu > à lǎu","半晡;puǎng puo > puāng puo","暝晡;màng puo > māng muo","今旦;king tǎng > kìng nǎng","昨暝;tsō màng > suǒ màng","明旦;mièng tǎng > miěng nǎng","分鐘;hung tsyng > hūng ngyng","點鐘;tēing tsyng > těing nyng","故底;kǒu tē > kù lē","現在;hiêng tsâi > hièng jâi","以後;ī hâu > i hâu","時間;sì kang > sī kang","日中;nih toung > nīt toung","暝晡;màng puo > māng muo","仂𣆯;néih òung > nī òung","駸駸;tshīng tshīng > tshíng nīng","此刻;tshȳ kháih > tshy kháih","蜀下;suoh â > suǒ â","溜溜;liû liû > liù liû","點鐘;tēing tsyng > těing nyng","手表;tshiū piū > tshiú piū","方向;huong hyǒng > huòng ngyǒng","位處;uî tshoěy > uì joěy","地方;têi huong > tī uong","地方;têi huong > tī uong","後斗;âu tāu > àu lāu","前斗;sièng tāu > sēing nāu","倒邊;tō pieng > tō being","右邊;iû pieng > iū being","當中;tang toung > tāng noung","東邊;toeyng pieng > toēyng mieng","西邊;se pieng > sē bieng","北邊;póyh pieng > poěy pieng","南邊;nàng pieng > nāng mieng","書店;tsy tǎing > tsỳ lǎing","飯店;puông tǎing > puòng nǎing","旅館;lȳ kuāng > lý uāng","市場;tshêi tuòng > tshī luòng","工廠;koeyng tshuōng > koèyng tshuōng","銀行;ngỳng hòung > ngy̌ng ngòung","郵局;iù kuò > iǔ kuò","醫院;i iêng > ì iêng","公園;kung huòng > kūng nguòng","城市;siàng tshêi > siǎng tshêi","園地;huòng têi > huǒng nêi","本地;puōng têi > puon nêi","馬祖;mā tsū > má jū","北竿;póyh kang > poěy kang","南竿;nàng kang > nāng ngang","白犬;pah khēing > pà īng","東引;toeyng īng > toèyng ngīng","世界;siě kǎi > siè kǎi","國家;kuóh ka > kuǒ ka","台灣;tài uang > tēi uang","大陸;tuâi lyh > toēy lyh","交通;kou thung > kōu thung","汽車;khěi tshia > khī ia","公車;kung tshia > kūng nia","火車;huī tshia > huǐ jia","飛機;hi ki > hī ki","車站;tshia tsiâng > tshià jiâng","碼頭;mā thàu > mǎ làu","行墿;kiàng tuô > kiǎng nuô","駕駛;kǎ sȳ > kà lȳ","轉彎;tuōng uang > tuǒng nguang","經過;king kuǒ > kìng kuǒ","停車;tìng tshia > tīng tshia","鐵墿;thiéh tuô > thiet tuô","地圖;têi tù > tī lù","地址;têi tsī > tì tsī","地球;têi kiù > tī kiù","日頭;nih thàu > nī thàu","星星;sing sing > sīng sing","空氣;khoung khěi > khùng khěi","天氣;thieng khěi > thièng khěi","好天;hō thieng > hǒ lieng","逿雨;tâung ȳ > tòung ngȳ","獃天;ngài thieng > ngēi lieng","爧線;niāng siǎng > niang niǎng","水庫;tsuī khǒu > tsui khǒu","海灘;hēi thang > hěi thang","水井;tsuī tsiāng > tsuí iāng","風颱;hung thei > hūng nei","風透;hung thǎu > hung thǎu","塗沙;thù sei > thū lei","䃹磹;làng thàng > lǎng thàng","結冰;kiéh ping > kiě ping","動物;tôung uh > tūng nguh","老鼠;lō tshȳ > ló jȳ","老虎;lâu hū > làu ū","老蛇;lâu siè > lōu liè","猴囝;kàu kiāng > kōu iāng","雞囝;kie kiāng > kiè iāng","雞母;kie mō > kiè mō","雞角;kie kóyh > kiè óyh","貓囝;mà kiāng > mā iāng","菩蠅;pù sìng > pǔ lìng","鳥囝;tsiēu kiāng > tsiéu iāng","殼菜;khóyh tshǎi > khoey tshǎi","黃蜱;uòng phè > uǒng phè","花蛤;hua káh > huà ák","鰻魚;muàng ngỳ > muǎng ngỳ","風蚊;hung muòng > hūng muòng","紅蟻;hòung ngiê > uong ngiê","翼翼;sih sih > sǐ sih","尾尾;muī muī > muī muī","箬箬;nuoh nuoh > nuǒ nuoh","紅色;oèyng sáih > oěyng náih","橘色;kéih sáih > kih sáih","黃色;uòng sáih > uǒng náih","綠色;luoh sáih > luò láih","色鎮;sáih těing > sáih těing","藍色;làng sáih > lǎng náih","紫色;tsiē sáih > tsie láih","白色;pah sáih > pà láih","灰色;hui sáih > huì láih","塗色;thù sáih > thǔ láih","烏色;u sáih > ù láih","顏色;ngàng sáih > ngǎng náih","十二;seih nêi > sěi nêi","頭頭;thàu thàu > thǒu thàu","最後;tsǒy âu > tsoèy âu","蜀其;suoh kì > suō ì","每蜀;muī suoh > muǐ suoh","全部;tsuòng puô > tsuǒng puô","部份;puô hôung > può ôung","號碼;hô mā > hò mā","大嫩;tuâi nâung > toèy nâung","尺寸;tshuóh tshǒung > tshuò jǒung","公分;kung hung > kūng hung","公尺;kung tshuóh > kùng tshuóh","公里;kung lī > kùng lī","公斤;kung kyng > kūng kyng","形狀;hìng tsâung > hǐng nâung","圓的;ièng tih > ièng nǐ","神明;sìng mìng > sǐng mìng","紅包;oèyng pou > oēyng mou","領袖;liāng siǔ > liang siǔ","名字;miàng tsêi > miǎng jêi","生日;siang nih > siāng nih","年歲;nièng huǐ > niěng nguǐ","平安;pìng ang > pīng ngang","安全;ang tsuòng > āng tsuòng","罐罐;kuǎng kuǎng > kuǎng kuǎng","氣球;khěi kiù > khī iù","心情;sing tsìng > sīng tsìng","歡喜;huang hī > huàng ngī","想法;suōng huáh > suong huáh","事計;tâi kiě > tèi iě","事實;soêy sih > sȳ lih","經驗;king ngiêng > kìng ngiêng","麻煩;mà huàng > mǎ huàng","命令;mêing lêing > mìng nêing","討論;thō lôung > tho lôung","想法;suōng huáh > suong huáh","理由;lī iù > lǐ iù","規則;kie tsáih > kiè tsáih","機會;ki huî > kì uî","位處;uî tshoěy > uì joěy","手機;tshiū ki > tshiǔ ki","網路;uōng lôu > uong lôu","郵件;iù kyông > iǔ yông","新聞;sing ùng > sīng ngùng","中心;tyng sing > tȳng sing","聲音;siang ing > siāng nging","糞埽;pǒung sǒ > pùng nǒ","自由;tsoêy iù > tsȳ iù","安靜;ang tsêing > àng tsêing","幸福;hâing hóuh > hèing hóuh","甘願;kang nguông > kàng nguông","有味;ôu mêi > ùng mêi","驚其;kiang kì > kiang ngǐ","危險;nguì hiēng > nguī hiēng","困難;khǎung nàng > khōung nàng","重要;toêyng iǔ > tỳng ngiǔ","普通;phuō thung > phǔ lung","特別;táih piéh > těi piéh","魔術;mò suh > mǒ luh","唯一;mì éih > mǐ éih","真的;tsing tih > tsing nǐ","蜀樣;suoh yông > suǒ yông","奇怪;kì kuǎi > kǐ kuǎi","可能;khō nèing > khǒ nèing","野𡖯;iā sâ > ia lâ","大聲;tuâi siang > toēy liang","方便;huong pêing > hòung piêng","公共;kung kôyng > kùng kôyng","仱仱;tang tang > tang nang","現代;hiêng tâi > hièng nâi","外國;nguî kuóh > nguì uóh","行時;kiàng sì > kiǎng nì","沃水;uóh tsuī > uòh tsuī","啼𩔶;thiè mà > thiě mà","拍破;pháh phuǎi > phà buǎi","帶領;tǎi līng > tèi līng","拜拜;puǎi puǎi > puài puǎi","振動;tīng tôyng > tìng nôyng","出去;tshóuh khǒ > tshu khǒ","歡迎;huang ngìng > huāng ngìng","影印;īng ěing > ing ngěing","開始;khei sȳ > khèi sȳ","結束;kiéh sóuh > kie sóuh","分開;puong khui > puong khuī","拍無;pháh mò > phā mò","對手;tǒy tshiū > toèy iū","遇著;ngoêy tuoh >","逿下;tâung kiâ > tâung ngiâ","得著;táih tuoh >","拜託;puǎi tháuh > puèi tháuh","參加;tshiang ka > tshiāng ka","會使;â sēi > è sēi","應該;ing kei > īng kei","伓是;īng sêi > ìng nêi","已經;ī king > ǐ king","一定;éih têing > i têing","注意;tsoěy ěi > tsỳ ěi","會肯;â khīng > è khīng","準備;tsūng pêi > tsung pêi","𣍐記;mê kěi > mè kěi","想念;suōng niêng > suong niêng","相信;suong sěing > suòng sěing","分享;hung hyōng > hùng hyōng","希望;hi uông > hì uông","掛心;kuǎ sing > kuā ling","決定;kyóh têing > kyoh têing","驚著;kiang tuoh >","謝謝;siâ siâ > sià liâ","感覺;kāng káuh > kang káuh","喜歡;hī huang > hǐ uang","煩惱;huàng nō > huāng nō","討厭;thō iěng > tho iěng","歡喜;huang hī > huàng hī","附近;hôu koêyng > hù koêyng","為了;uî lǒ > uî lǒ","固是;kǒu sêi > kù lêi","因為;ing uî > ìng nguî","但是;tǎng sêi > tàng sêi","雖然;sui yòng > suī yòng","大概;tuâi khǎi > toèy khǎi","安是;ang sêi > àng nêi","平常;pìng suòng > pǐng suòng","或者;hoyh tsiā > hoèy tsiā","稠稠;sièu sièu > siěu sièu","屢屢;lī lī > lí lī","正好;tsiǎng hō > tsiàng ngō","固是;kǒu sêi > kù lêi","固未;kǒu muî > kù muî","然後;yòng hâu > yǒng ngâu","最後;tsǒy hâu > tsoèy hâu","也是;iā sêi > ià lêi","個啷;kǒ loung > kō loung","看看;khǎng khǎng > khàng khǎng","去了;khǒ lōu > o lōu"];
let splitWord = ";";



const word = document.getElementById("word");
const small = document.getElementById("small");
const text = document.getElementById("text");
const scoreEl = document.getElementById("score");
const timeEl = document.getElementById("time");
const endgameEl = document.getElementById("end-game-container");
const settingBtn = document.getElementById("setting-btn");
const settings = document.getElementById("setting");
const settingsForm = document.getElementById("setting-form");
const settingsForm2 = document.getElementById("setting-form2");
const difficultySelect = document.getElementById("difficulty");
const wordArrSelect = document.getElementById("wordArr");
const xie = document.getElementById("xie");
const timeText = document.getElementById("time");
const startBtn = document.getElementById("start");



//init word
let randomWord;
let w1; 
let w2;
let screenWidth = (window.innerWidth) * 0.96;
let score = 0;
let wrong = 0; //打錯時的計數;
let niuCss = 0; //打錯時的抖動;
text.disabled = true;

let difficulty =
    localStorage.getItem("difficulty") !== null ?
    localStorage.getItem("difficulty") :
    "average";
//set diff select value
difficultySelect.value = difficulty;
//
let wordArr =
    localStorage.getItem("wordArr") !== null ?
    localStorage.getItem("wordArr") :
    "average";
//set diff select value
wordArrSelect.value = wordArr;
//


let timeScreen = 60;

timeText.innerHTML = timeScreen + " 秒";
let time = timeScreen;


switch (wordArr) {
    case 'word1':
        words = word1;
        break;
    case 'word2':
        words = word2;
        break;
    case 'word3':
        words = word3;
        break;
    case 'word4':
        words = word4;
        break;
    case 'word5':
        words = word5;
        break;
    case 'word7':
        words = word7;
        break;
    case 'word8':
        words = word8;
        break;
    case 'word9':
        words = word9;
        break;
    case 'word10':
        words = word10;
        break;
    case 'words2':
        words = words2;
        break;
    default:
        words = word1;
}



function startGame() {
    localStorage.setItem("startGame", 1);
    location.reload();	
}


let wordsRand = set_random(words.slice(0)); /* 複製出一個完整題庫，並打亂; */

if (localStorage.getItem("startGame") == 1) {
    localStorage.setItem("startGame", 0);
	//startBtn.style.display="none";
	//settings.classList.toggle("hide");
	text.disabled = false;
    //focus on text
    text.focus();

    //start count down
    const timeInterval = setInterval(updateTime, 1000);

    //generate random word
    function getRandomWord() {
        return words[Math.floor(Math.random() * words.length)];
    }




    //add word to dom
    function addWordToDOM() {
        randomWord = wordsRand[0];
        let arr = randomWord.split(splitWord);
        w1 = arr[0];		
        w2 = arr[1];
        if (w2 == undefined) {
            w2 = "";
        }
		/*
		let wArr = w1.split("");
		let r = Math.floor(Math.random()*wArr.length);
		wArr.splice(r,1,"？");
		let wTxt = wArr.join("");
        word.innerHTML = wTxt;
		*/
		word.innerHTML = w1;

        small.innerHTML = w2;
		//small.innerHTML = "　";
        text.placeholder = w2;

    }

    addWordToDOM();



    function updateScore() {
        score++;
        scoreEl.innerHTML = score;
    }

    function updateTime() {
        time--;
        timeEl.innerHTML = time + " 秒";

        if (xie.style.width > settingBtn.style.width) {
            //console.log(Number(xie.style.width.slice(0,-2)));
        } else if (xie.style.width < container.style.width) {}


        if (time > timeScreen) {
            xie.style.width = screenWidth + "px";
        } else {
            xie.style.width = (time * screenWidth) / timeScreen + "px";
        }
        if (time === 0) {
            clearInterval(timeInterval);
            gameOver();
        }
    }

    function gameOver() {
		//startBtn.style.display="block";
		//settings.classList.toggle("hide");
        endgameEl.innerHTML = `
        <h1>時間結束</h1>
        <p>你的成績是： ${score}</p>
        <button onclick="startGame()">重新開始</button>
    `;
        endgameEl.style.display = "flex";
        localStorage.setItem("startGame", 0);
    }
	

};


text.addEventListener("keyup", (e) => {
    //按下Enter後判斷;
    const insetedText = e.target.value;

    text.className = "";

    if (event.keyCode === 13) {		

        if (insetedText == w1) {
			//small.innerHTML = "　";

			if (wrong == 0) {
                //如果沒有打錯;
                wordsRand.shift(); //刪頭;
                wordsRand.push(randomWord); //添尾;
            } else {
                //如果有打錯;
                wordsRand.shift(); //刪頭;
                wordsRand.splice(4, 0, randomWord); //添到第四個，再練習;
                wrong = 0; //恢復打錯計數為0;
            }
            addWordToDOM();



            updateScore();
            e.target.value = "";
            if (difficulty == "hard") {
                time += 2;
            } else if (difficulty == "average") {
                time += 3;
            } else {
                time += 4;
            }
        } else {
			small.innerHTML = w2;
            wrong = wrong + 1; //打錯時，錯誤+1;



            text.className = "niu"; //發出錯誤震動;


        }
        //updateTime();	  
    }
});


//settingBtn.addEventListener("click", () => settings.classList.toggle("hide"));
settingsForm.addEventListener("change", (e) => {
    difficulty = e.target.value;
    localStorage.setItem("difficulty", difficulty);
});

settingsForm2.addEventListener("change", (e) => {
    wordArr = e.target.value;
    localStorage.setItem("wordArr", wordArr);
});

function set_random(arr) {
    return arr.sort(function() {
        return Math.random() - 0.5;
    });
}
/* 設定陣列亂數排序;	 */


