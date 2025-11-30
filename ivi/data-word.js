// 單字資料庫
const VOCAB_DATA = [
  // --- Unit 23 ---
  { unit: 23, word: 'during', kk: '[ˋdjʊrɪŋ]', part: 'prep.', def: '在...期間', sentence: 'Wendy ate a lot of popcorn during the movie.', senTrans: '溫蒂在看電影時吃了很多爆米花。', other: '' },
  { unit: 23, word: 'medium', kk: '[ˋmidɪəm]', part: 'a.', def: '中等的', sentence: 'Please bring me this T-shirt in a medium size.', senTrans: '請給我這件 T 恤的中號尺寸。', other: '' },
  { unit: 23, word: 'together', kk: '[təˋgɛðɚ]', part: 'adv.', def: '一起', sentence: 'Are we going together or separately?', senTrans: '我們要一起去還是分開去？', other: '' },
  { unit: 23, word: 'tooth', kk: '[tuθ]', part: 'n.', def: '牙齒', sentence: 'Remember to brush your teeth twice a day.', senTrans: '記得一天要刷兩次牙。', other: 'teeth' },
  { unit: 23, word: 'change', kk: '[tʃendʒ]', part: 'v.', def: '改變', sentence: 'Do you think Debbie has changed since she became famous?', senTrans: '你認為黛比自從成名後，是否改變了？', other: 'changed / changing' },
  { unit: 23, word: 'popular', kk: '[ˋpɑpjələ]', part: 'a.', def: '流行的；受歡迎的', sentence: 'Rap and R&B are popular with young people.', senTrans: '饒舌歌和 R&B 受年輕人的歡迎。', other: '' },
  { unit: 23, word: 'relative', kk: '[ˋrɛlətɪv]', part: 'a.', def: '相對的', sentence: 'These facts are relative to the case.', senTrans: '這些事實和本案有關。', other: '' },
  { unit: 23, word: 'experience', kk: '[ɪkˋspɪrɪəns]', part: 'n.', def: '經驗', sentence: 'I traveled to Italy last year, and it was a great experience.', senTrans: '我去年到義大利旅行，那是個很棒的經歷。', other: 'experiences' },
  { unit: 23, word: 'video', kk: '[ˋvɪdɪ͵o]', part: 'n.', def: '錄影；影片', sentence: 'We stayed at home watching a video last night.', senTrans: '我們昨晚待在家裡看錄影帶。', other: 'videos' },
  { unit: 23, word: 'program', kk: '[ˋprogræm]', part: 'n.', def: '節目', sentence: 'What kind of TV programs do you enjoy watching?', senTrans: '你喜歡看哪一種電視節目？', other: 'programs' },
  { unit: 23, word: 'card', kk: '[kɑrd]', part: 'n.', def: '卡片', sentence: 'Addison’s boyfriend only gave her a card for her birthday.', senTrans: '艾狄森的男友在她生日時只送她一張卡片。', other: 'cards' },
  { unit: 23, word: 'pack', kk: '[pæk]', part: 'v.', def: '打包', sentence: 'Make sure you pack a jacket in your suitcase.', senTrans: '別忘了在行李箱裡放進一件夾克。', other: 'packed / packing' },
  { unit: 23, word: 'reporter', kk: '[rɪˋportɚ]', part: 'n.', def: '記者', sentence: 'The reporter hid a camera inside his jacket.', senTrans: '那個記者在外套裡面藏了一臺照相機。', other: 'reporters' },
  { unit: 23, word: 'interview', kk: '[ˋɪntɚ͵vju]', part: 'n.', def: '面試；採訪', sentence: 'The interviewee was very nervous during the interview.', senTrans: '面試時，這位面試者非常緊張。', other: 'interviews' },
  { unit: 23, word: 'last', kk: '[læst]', part: 'vi.', def: '持續', sentence: 'The meeting lasted for more than two hours.', senTrans: '這場會議進行了 2 個多小時。', other: 'lasted / lasting' },
  { unit: 23, word: 'hide', kk: '[haɪd]', part: 'v.', def: '躲藏；藏', sentence: 'Liz hides her diaries on the top shelf of her closet.', senTrans: '麗茲把日記藏在衣櫥的最上層。', other: 'hid / hidden / hiding' },
  { unit: 23, word: 'lonely', kk: '[ˋlonlɪ]', part: 'a.', def: '寂寞的', sentence: 'Eva feels lonely when Patrick is not around.', senTrans: '派翠克不在時伊娃感到很寂寞。', other: '' },
  { unit: 23, word: 'lovely', kk: '[ˋlʌvlɪ]', part: 'a.', def: '美好的；漂亮的', sentence: 'We had a lovely time in Rome.', senTrans: '我們在羅馬度過一段美好的時光。', other: '' },
  { unit: 23, word: 'dream', kk: '[drim]', part: 'n.', def: '夢；夢想', sentence: 'Mike had a dream that he was a butterfly.', senTrans: '麥克夢見他是一隻蝴蝶。', other: 'dreams' },
  { unit: 23, word: 'excellent', kk: '[ˋɛkslənt]', part: 'a.', def: '傑出的', sentence: 'The brave young man is an excellent soldier.', senTrans: '那位英勇的年輕人是一位傑出的戰士。', other: '' },
  { unit: 23, word: 'fool', kk: '[ful]', part: 'n.', def: '傻瓜', sentence: 'Only a fool would do such a thing.', senTrans: '只有傻子會做這樣的事。', other: 'fools' },
  { unit: 23, word: 'however', kk: '[haʊˋɛvɚ]', part: 'adv.', def: '然而', sentence: 'You can come with me. However, you have to pay your own way.', senTrans: '你可以跟我來；不過，你得全程自費。', other: '' },
  { unit: 23, word: 'glove', kk: '[glʌv]', part: 'n.', def: '手套', sentence: 'You’d better put on your gloves when doing this job.', senTrans: '做這份工作時最好戴手套。', other: 'gloves' },
  { unit: 23, word: 'butterfly', kk: '[ˋbʌtɚ͵flaɪ]', part: 'n.', def: '蝴蝶', sentence: 'In winter, millions of butterflies travel to Mexico.', senTrans: '在冬天，有數百萬隻蝴蝶飛至墨西哥。', other: 'butterflies' },
  { unit: 23, word: 'borrow', kk: '[ˋbɑro]', part: 'v.', def: '借入', sentence: 'Can I borrow some money from you?', senTrans: '我能向你借一些錢嗎？', other: 'borrowed / borrowing' },
  { unit: 23, word: 'already', kk: '[ɔlˋrɛdɪ]', part: 'adv.', def: '已經', sentence: 'Molly has already eaten dinner.', senTrans: '茉莉已經吃過晚餐了。', other: '' },
  { unit: 23, word: 'corner', kk: '[ˋkɔrnɚ]', part: 'n.', def: '角落', sentence: 'There is a post office on the corner.', senTrans: '轉角處有一家郵局。', other: 'corners' },
  { unit: 23, word: 'early', kk: '[ˋɝlɪ]', part: 'a.', def: '早的', sentence: 'John said it was too early to know the result.', senTrans: '約翰說太早，還不知道結果。', other: '' },
  { unit: 23, word: 'mine', kk: '[maɪn]', part: 'n.', def: '礦；地雷', sentence: 'The coal mine on the mountain is depleted.', senTrans: '那座山上的煤礦已經開採殆盡。', other: 'mines' },
  { unit: 23, word: 'pick', kk: '[pɪk]', part: 'v.', def: '挑選', sentence: 'Pick a color for your bedroom walls.', senTrans: '替你房間的牆選個顏色吧。', other: 'picked / picking' },
  { unit: 23, word: 'study', kk: '[ˋstʌdɪ]', part: 'v.', def: '研讀；學習', sentence: 'Denise is a good student who studies hard.', senTrans: '狄妮絲是個用功唸書的好學生。', other: 'studies / studied / studying' },
  { unit: 23, word: 'quarter', kk: '[ˋkwɔrtɚ]', part: 'n.', def: '四分之一', sentence: 'A quarter of the population voted for Tony.', senTrans: '有四分之一的人投票給湯尼。', other: 'quarters' },
  { unit: 23, word: 'machine', kk: '[məˋʃin]', part: 'n.', def: '機器', sentence: 'The machine can make hammers and other tools.', senTrans: '這臺機器可以製作鐵鎚和其他工具。', other: 'machines' },
  { unit: 23, word: 'wall', kk: '[wɔl]', part: 'n.', def: '牆壁', sentence: 'There was a stone wall around the old city.', senTrans: '舊城被一座石牆圍繞著。', other: 'walls' },
  { unit: 23, word: 'hotel', kk: '[hoˋtɛl]', part: 'n.', def: '飯店', sentence: 'Charlie stayed at a nice hotel with a big swimming pool.', senTrans: '查理住在一間有大游泳池的優質飯店。', other: 'hotels' },
  { unit: 23, word: 'knock', kk: '[nɑk]', part: 'v.', def: '敲；擊', sentence: 'Please knock on the door before entering the room.', senTrans: '進房間之前，請先敲門。', other: 'knocked / knocking' },

  // --- Unit 24 ---
  { unit: 24, word: 'town', kk: '[taʊn]', part: 'n.', def: '城鎮', sentence: 'Brian grew up in a small town in Canada.', senTrans: '布萊恩在加拿大的這一個小鎮長大。', other: 'towns' },
  { unit: 24, word: 'carrot', kk: '[ˋkærət]', part: 'n.', def: '胡蘿蔔', sentence: 'Carrots are rich in vitamin A.', senTrans: '紅蘿蔔富含維生素A。', other: 'carrots' },
  { unit: 24, word: 'doctor', kk: '[ˋdɑktɚ]', part: 'n.', def: '醫生', sentence: 'Susan is a doctor in a large hospital.', senTrans: '蘇珊是大醫院內的醫生。', other: 'doctors' },
  { unit: 24, word: 'until', kk: '[ənˋtɪl]', part: 'conj.', def: '直到', sentence: 'Tony played soccer until he got tired.', senTrans: '湯尼踢足球踢到累了為止。', other: '' },
  { unit: 24, word: 'medicine', kk: '[ˋmɛdəsn]', part: 'n.', def: '藥', sentence: 'Remember to take this medicine three times a day.', senTrans: '記得一天服這個藥3次。', other: 'medicines' },
  { unit: 24, word: 'comfortable', kk: '[ˋkʌmfətəb!]', part: 'a.', def: '舒適的', sentence: 'A soft, warm bed is comfortable to lie in.', senTrans: '柔軟溫暖的床躺起來很舒服。', other: '' },
  { unit: 24, word: 'wait', kk: '[wet]', part: 'v.', def: '等待', sentence: 'Patty waited for the bus to arrive.', senTrans: '派蒂在等公車抵達。', other: 'waited / waiting' },
  { unit: 24, word: 'day', kk: '[de]', part: 'n.', def: '一天', sentence: 'Joy\'s favorite day of the week is Saturday.', senTrans: '喬伊一週中最喜歡的一天是星期六。', other: 'days' },
  { unit: 24, word: 'month', kk: '[mʌnθ]', part: 'n.', def: '月', sentence: 'Veronica\'s birthday is in the month of August.', senTrans: '薇洛妮卡的生日在8月。', other: 'months' },
  { unit: 24, word: 'year', kk: '[jɪr]', part: 'n.', def: '年', sentence: 'Paul has been playing the guitar for 10 years.', senTrans: '保羅彈吉他10年了。', other: 'years' },
  { unit: 24, word: 'apartment', kk: '[əˋpɑrtmənt]', part: 'n.', def: '公寓', sentence: 'Lilly moved into her new apartment last night.', senTrans: '莉莉昨晚搬進她的新公寓。', other: 'apartments' },
  { unit: 24, word: 'wise', kk: '[waɪz]', part: 'a.', def: '有智慧的', sentence: 'I think Susan has made a wise decision to break up with John.', senTrans: '我認為蘇珊和約翰分手是個明智的決定。', other: 'wiser / wisest' },
  { unit: 24, word: 'throat', kk: '[θrot]', part: 'n.', def: '喉嚨', sentence: 'The speaker cleared his throat before delivering the speech.', senTrans: '這位講者清了清喉嚨才開始發表演說。', other: 'throats' },
  { unit: 24, word: 'salad', kk: '[ˋsæləd]', part: 'n.', def: '沙拉', sentence: 'We ate salad and noodles for dinner last night.', senTrans: '昨晚我們晚餐吃生菜沙拉及麵條。', other: 'salads' },
  { unit: 24, word: 'headache', kk: '[ˋhɛd͵ek]', part: 'n.', def: '頭痛', sentence: 'Mike called in sick this morning because he had a headache.', senTrans: '麥可早上因為頭痛請病假。', other: 'headaches' },
  { unit: 24, word: 'subject', kk: '[ˋsʌbdʒɪkt]', part: 'n.', def: '學科', sentence: 'What\'s your favorite subject at school?', senTrans: '在學校你最愛的科目是什麼？', other: 'subjects' },
  { unit: 24, word: 'abroad', kk: '[əˋbrɔd]', part: 'adv.', def: '在國外', sentence: 'Due to COVID-19, people cannot travel abroad these days.', senTrans: '由於新冠肺炎，人們現在都無法出國旅遊。', other: '' },
  { unit: 24, word: 'museum', kk: '[mjuˋziəm]', part: 'n.', def: '博物館', sentence: 'The artist\'s work is on display at the museum now.', senTrans: '這位藝術家的作品正在博物館展覽中。', other: 'museums' },
  { unit: 24, word: 'net', kk: '[nɛt]', part: 'n.', def: '網子', sentence: 'The man went fishing with a fishing rod and a net.', senTrans: '這名男子帶了一支釣竿和網子去釣魚。', other: 'nets' },
  { unit: 24, word: 'pleasure', kk: '[ˋplɛʒɚ]', part: 'n.', def: '愉快；榮幸', sentence: 'It\'s my great pleasure to deliver this speech to you.', senTrans: '能向諸位發表演講是我的榮幸。', other: 'pleasures' },
  { unit: 24, word: 'lawyer', kk: '[ˋlɔjɚ]', part: 'n.', def: '律師', sentence: 'I suggest you consult a lawyer.', senTrans: '我建議你去請教律師。', other: 'lawyers' },
  { unit: 24, word: 'famous', kk: '[ˋfeməs]', part: 'a.', def: '出名的', sentence: 'This restaurant is famous for its terrific steaks.', senTrans: '這家餐廳以好吃的牛排聞名。', other: '' },
  { unit: 24, word: 'business', kk: '[ˋbɪznɪs]', part: 'n.', def: '生意', sentence: 'Our business has been prosperous over the past three years.', senTrans: '過去3年來，我們的生意蒸蒸日上。', other: 'businesses' },
  { unit: 24, word: 'picnic', kk: '[ˋpɪknɪk]', part: 'n.', def: '野餐', sentence: 'Zoe and her family had a picnic in the park.', senTrans: '柔伊和她的家人在公園裡野餐。', other: 'picnics' },
  { unit: 24, word: 'future', kk: '[ˋfjutʃɚ]', part: 'n.', def: '未來', sentence: 'What are you planning to do in the future?', senTrans: '你未來計劃要做什麼？', other: 'futures' },
  { unit: 24, word: 'convenient', kk: '[kənˋvinjənt]', part: 'a.', def: '方便的', sentence: 'Is tomorrow evening convenient for you?', senTrans: '明晚你方便嗎？', other: '' },
  { unit: 24, word: 'bench', kk: '[bɛntʃ]', part: 'n.', def: '長椅', sentence: 'Joan read a newspaper on a bench.', senTrans: '瓊安坐在一張長椅上看報紙。', other: 'benches' },
  { unit: 24, word: 'ago', kk: '[əˋgo]', part: 'adv.', def: '...以前', sentence: 'Richard and Erin got married five years ago.', senTrans: '理查和艾琳在5年前結婚。', other: '' },
  { unit: 24, word: 'thick', kk: '[θɪk]', part: 'a.', def: '厚的', sentence: 'The castle walls are 90 cm thick.', senTrans: '這些城牆有90公分厚。', other: '' },
  { unit: 24, word: 'thin', kk: '[θɪn]', part: 'a.', def: '薄的', sentence: 'The road is covered with a thin layer of ice.', senTrans: '馬路覆蓋著一層薄冰。', other: '' },
  { unit: 24, word: 'invite', kk: '[ɪnˋvaɪt]', part: 'v.', def: '邀請', sentence: 'Our new neighbors invited us to their housewarming party.', senTrans: '我們的新鄰居邀我們去參加他們的喬遷派對。', other: 'invited / inviting' },
  { unit: 24, word: 'share', kk: '[ʃɛr]', part: 'v.', def: '分享', sentence: 'Jenny doesn\'t want to share her toys with her twin sister.', senTrans: '珍妮不願與她的雙胞胎妹妹分享玩具。', other: 'shared / sharing' },
  { unit: 24, word: 'party', kk: '[ˋpɑrtɪ]', part: 'n.', def: '派對', sentence: 'Lauren went to a nice dinner party on Friday night.', senTrans: '蘿倫週五晚上去了一個很棒的晚宴派對。', other: 'parties' },
  { unit: 24, word: 'exercise', kk: '[ˋɛksɚ͵saɪz]', part: 'n.', def: '運動', sentence: 'Exercise and proper diet are essential for good health.', senTrans: '運動和適當的飲食對健康很重要。', other: 'exercises' },
  { unit: 24, word: 'modern', kk: '[ˋmɑdɚn]', part: 'a.', def: '現代的', sentence: 'Hazel likes both modern dance and classical ballet.', senTrans: '海瑟喜歡現代舞和古典芭蕾。', other: '' },
  { unit: 24, word: 'snow', kk: '[sno]', part: 'n.', def: '雪', sentence: 'In the winter, it snows in many countries.', senTrans: '冬天時，很多國家都會下雪。', other: 'snows' },
  { unit: 24, word: 'festival', kk: '[ˋfɛstəv!]', part: 'n.', def: '節慶', sentence: 'The music festival is held here every summer.', senTrans: '音樂祭每年夏天都在這裡舉辦。', other: 'festivals' },
  { unit: 24, word: 'celebrate', kk: '[ˋsɛlə͵bret]', part: 'v.', def: '慶祝', sentence: 'Daniel\'s coworkers celebrated his promotion with a party.', senTrans: '丹尼爾的同事開派對慶祝他的升遷。', other: 'celebrated / celebrating' },

  // --- Unit 25 ---
  { unit: 25, word: 'button', kk: '[ˋbʌtn]', part: 'n.', def: '鈕扣; 按鈕', sentence: 'Can you undo the buttons on my back?', senTrans: '你可以幫我解開我背後的扣子嗎？', other: 'buttons' },
  { unit: 25, word: 'ability', kk: '[əˋbɪlətɪ]', part: 'n.', def: '能力', sentence: 'Ants have the ability to carry objects much heavier than themselves.', senTrans: '螞蟻有能力搬動比自己重得多的物體。', other: 'abilities' },
  { unit: 25, word: 'copy', kk: '[ˋkɑpɪ]', part: 'v.', def: '複製; 模仿', sentence: 'The company was accused of copying the product of a US manufacturer.', senTrans: '該公司被指控偽造一家美國廠商的產品。', other: 'copied / copying' },
  { unit: 25, word: 'guy', kk: '[gaɪ]', part: 'n.', def: '傢伙; 男子', sentence: 'I don\'t like that guy.', senTrans: '我不喜歡那個傢伙。', other: 'guys' },
  { unit: 25, word: 'clerk', kk: '[klɝk]', part: 'n.', def: '店員', sentence: 'The clerk at the drugstore gave me the wrong change.', senTrans: '藥妝店的店員找錯零錢給我。', other: 'clerks' },
  { unit: 25, word: 'explain', kk: '[ɪkˋsplen]', part: 'v.', def: '解釋', sentence: 'After the surgery, the doctor will explain how to take care of your eyes.', senTrans: '手術後，醫生會解釋如何照顧你的眼睛。', other: 'explained / explaining' },
  { unit: 25, word: 'proud', kk: '[praʊd]', part: 'a.', def: '自豪的; 驕傲的', sentence: 'I\'m proud of my dad. He takes good care of his family.', senTrans: '我爸很照顧家人，我以他為榮。', other: '' },
  { unit: 25, word: 'online', kk: '[ˋɑn͵laɪn]', part: 'a.', def: '網路上的', sentence: 'Not all online information is correct.', senTrans: '線上資訊並非都是正確的。', other: '' },
  { unit: 25, word: 'collect', kk: '[kəˋlɛkt]', part: 'v.', def: '收集', sentence: 'Bill has been collecting stamps for more than thirty years.', senTrans: '比爾集郵已有30多年之久。', other: 'collected / collecting' },
  { unit: 25, word: 'hang', kk: '[hæŋ]', part: 'v.', def: '懸掛', sentence: 'The painting was hung upside down.', senTrans: '這幅畫被掛顛倒了。', other: 'hung / hanging' },
  { unit: 25, word: 'teenager', kk: '[ˋtin͵edʒɚ]', part: 'n.', def: '青少年', sentence: 'I often made rash decisions when I was a teenager.', senTrans: '我還青少年時，常做出輕率的決定。', other: 'teenagers' },
  { unit: 25, word: 'wet', kk: '[wɛt]', part: 'a.', def: '溼的', sentence: 'The ground is wet after the rain.', senTrans: '下過雨後地上溼溼的。', other: 'wetter / wettest' },
  { unit: 25, word: 'honest', kk: '[ˋɑnɪst]', part: 'a.', def: '誠實的', sentence: 'You should be honest with your parents.', senTrans: '你應該對父母誠實。', other: '' },
  { unit: 25, word: 'towel', kk: '[ˋtaʊəl]', part: 'n.', def: '毛巾', sentence: 'After swimming, dry off with a towel.', senTrans: '游泳後，用毛巾把身體擦乾。', other: 'towels' },
  { unit: 25, word: 'mark', kk: '[mɑrk]', part: 'n.', def: '記號; 汙點', sentence: 'There are some dirty marks on your white dress.', senTrans: '妳的白洋裝上有些髒髒的汙點。', other: 'marks' },
  { unit: 25, word: 'dictionary', kk: '[ˋdɪkʃən͵ɛrɪ]', part: 'n.', def: '字典', sentence: 'If you don\'t know the word, consult the dictionary.', senTrans: '你若不懂這個字就查字典。', other: 'dictionaries' },
  { unit: 25, word: 'fail', kk: '[fel]', part: 'v.', def: '失敗; 不及格', sentence: 'Lucas failed in his attempt to persuade Willa.', senTrans: '盧卡斯沒能說服薇拉。', other: 'failed / failing' },
  { unit: 25, word: 'club', kk: '[klʌb]', part: 'n.', def: '社團', sentence: 'Iris joined the soccer club at school.', senTrans: '艾莉絲加入了學校的足球社。', other: 'clubs' },
  { unit: 25, word: 'wake', kk: '[wek]', part: 'v.', def: '醒來; 叫醒', sentence: 'Be quiet or you\'ll wake the baby.', senTrans: '安靜點，不然你會吵醒小寶寶。', other: 'woke / woken / waking' },
  { unit: 25, word: 'define', kk: '[dɪˋfaɪn]', part: 'v.', def: '下定義', sentence: 'It is difficult to define the word "love".', senTrans: '要為『愛』這個字去下定義是很困難的。', other: 'defined / defining' },
  { unit: 25, word: 'tape', kk: '[tep]', part: 'n.', def: '膠帶; 錄音帶', sentence: 'Put the tape in the recorder before the speech begins.', senTrans: '演講開始前，把錄音帶放進錄音機裡。', other: 'tapes' },
  { unit: 25, word: 'expect', kk: '[ɪkˋspɛkt]', part: 'v.', def: '預期; 等待', sentence: 'No one expected Kelly to get married so soon.', senTrans: '大家都沒料到凱莉會這麼快結婚。', other: 'expected / expecting' },
  { unit: 25, word: 'envelope', kk: '[ˋɛnvə͵lop]', part: 'n.', def: '信封', sentence: 'What was in the envelope Liam gave you?', senTrans: '連恩給你的那個信封裡裝著什麼？', other: 'envelopes' },
  { unit: 25, word: 'soldier', kk: '[ˋsoldʒɚ]', part: 'n.', def: '軍人', sentence: 'The brave soldier fought in three battles.', senTrans: '這個勇敢的軍人參加過3次戰役。', other: 'soldiers' },
  { unit: 25, word: 'example', kk: '[ɪgˋzæmp!]', part: 'n.', def: '例子', sentence: 'Ethan can play many instruments, for example, piano, violin, and cello.', senTrans: '伊森會演奏很多樂器，例如鋼琴、小提琴和大提琴。', other: 'examples' },
  { unit: 25, word: 'uniform', kk: '[ˋjunə͵fɔrm]', part: 'n.', def: '制服', sentence: 'Belle still looks beautiful in her school uniform.', senTrans: '貝兒穿校服看起來仍很美麗。', other: 'uniforms' },
  { unit: 25, word: 'pin', kk: '[pɪn]', part: 'n.', def: '別針', sentence: 'My grandmother gave me her antique pin.', senTrans: '我的祖母把她的古董胸針給了我。', other: 'pins' },
  { unit: 25, word: 'repeat', kk: '[rɪˋpit]', part: 'v.', def: '重複', sentence: 'Could you please repeat the question?', senTrans: '請你再把問題重複一遍好嗎？', other: 'repeated / repeating' },
  { unit: 25, word: 'drop', kk: '[drɑp]', part: 'v.', def: '掉落', sentence: 'Stock prices dropped sharply in Asia yesterday.', senTrans: '昨天亞洲的股價劇烈下跌。', other: 'dropped / dropping' },
  { unit: 25, word: 'attack', kk: '[əˋtæk]', part: 'v.', def: '攻擊', sentence: 'A stray dog attacked that little boy yesterday.', senTrans: '昨天有隻流浪狗攻擊那個小男孩。', other: 'attacked / attacking' },
  { unit: 25, word: 'sign', kk: '[saɪn]', part: 'v.', def: '簽名', sentence: 'Jacob took out his pen to sign the check.', senTrans: '雅各拿出他的筆來簽支票。', other: 'signed / signing' },
  { unit: 25, word: 'temple', kk: '[ˋtɛmp!]', part: 'n.', def: '寺廟', sentence: 'At the temple, my mother prayed for my grandfather to get well soon.', senTrans: '我媽媽在寺廟裡祈求爺爺身體早點康復。', other: 'temples' },
  { unit: 25, word: 'item', kk: '[ˋaɪtəm]', part: 'n.', def: '物品', sentence: 'None of the items on the table belong to me.', senTrans: '桌上的物品沒有一件是我的。', other: 'items' },
  { unit: 25, word: 'error', kk: '[ˋɛrɚ]', part: 'n.', def: '錯誤', sentence: 'Pauline made two grammatical errors in this sentence.', senTrans: '寶琳在這個句子中犯了2個文法錯誤。', other: 'errors' },
  { unit: 25, word: 'blind', kk: '[blaɪnd]', part: 'a.', def: '盲的', sentence: 'Audrey was born blind.', senTrans: '奧黛莉天生眼盲。', other: '' },
  { unit: 25, word: 'engineer', kk: '[͵ɛndʒəˋnɪr]', part: 'n.', def: '工程師', sentence: 'Ezra is a good mechanical engineer.', senTrans: '以斯拉是個優秀的機械工程師。', other: 'engineers' },
  { unit: 25, word: 'twice', kk: '[twaɪs]', part: 'adv.', def: '兩次', sentence: 'Annie has only played tennis twice.', senTrans: '安妮只打過2次網球。', other: '' },
  { unit: 25, word: 'string', kk: '[strɪŋ]', part: 'n.', def: '細繩; 線', sentence: 'I need a piece of string to tie this box.', senTrans: '我需要一條繩子來綁這個箱子。', other: 'strings' },
  { unit: 25, word: 'pipe', kk: '[paɪp]', part: 'n.', def: '管子', sentence: 'The pipes must be clogged. The sink is full of dirty water.', senTrans: '水管一定是堵住了，水槽裡積滿了汙水。', other: 'pipes' },

  // --- Unit 26 ---
  { unit: 26, word: 'provide', kk: '[prəˋvaɪd]', part: 'v.', def: '提供', sentence: 'I\'ll provide you with everything you need for the mission.', senTrans: '我會提供你這項任務所需的一切。', other: 'provided / providing' },
  { unit: 26, word: 'company', kk: '[ˋkʌmpənɪ]', part: 'n.', def: '公司; 陪伴', sentence: 'The company is going out of business soon.', senTrans: '這家公司就要倒閉了。', other: 'companies' },
  { unit: 26, word: 'soft', kk: '[sɔft]', part: 'a.', def: '柔軟的', sentence: 'This bread is soft and delicious.', senTrans: '這麵包鬆軟好吃。', other: 'softer / softest' },
  { unit: 26, word: 'social', kk: '[ˋsoʃəl]', part: 'a.', def: '社會的; 社交的', sentence: 'Roger and my father discussed many of today\'s social issues.', senTrans: '羅傑和我父親討論了許多當今的社會議題。', other: '' },
  { unit: 26, word: 'figure', kk: '[ˋfɪgjɚ]', part: 'v.', def: '認為; 數字; 身材', sentence: 'I never figured Johnny was a talented director.', senTrans: '我從不認為強尼是位有才華的導演。', other: 'figured / figuring' },
  { unit: 26, word: 'countryside', kk: '[ˋkʌntrɪ͵saɪd]', part: 'n.', def: '鄉間', sentence: 'I enjoy living in the countryside because the air here is fresh.', senTrans: '我喜歡住在鄉下，因為這裡空氣很新鮮。', other: '' },
  { unit: 26, word: 'fisherman', kk: '[ˋfɪʃɚmən]', part: 'n.', def: '漁夫', sentence: 'These fishermen were worried about the coming typhoon.', senTrans: '這些漁夫很擔心即將要來的颱風。', other: 'fishermen' },
  { unit: 26, word: 'sock', kk: '[sɑk]', part: 'n.', def: '短襪', sentence: 'Rex is wearing a pair of yellow socks.', senTrans: '雷克斯穿了一雙黃色襪子。', other: 'socks' },
  { unit: 26, word: 'international', kk: '[͵ɪntɚˋnæʃən!]', part: 'a.', def: '國際的', sentence: 'English is an important international language.', senTrans: '英文是個重要的國際語言。', other: '' },
  { unit: 26, word: 'value', kk: '[ˋvælju]', part: 'n.', def: '價值; 價值觀', sentence: 'This building has a value of more than 20 million NT dollars.', senTrans: '這棟建築物價值超過 2,000 萬新臺幣。', other: 'values' },
  { unit: 26, word: 'president', kk: '[ˋprɛzədənt]', part: 'n.', def: '總統; 總裁', sentence: 'The president is planning to visit some diplomatic allies next month.', senTrans: '總統計劃下個月去拜訪一些邦交國家。', other: 'presidents' },
  { unit: 26, word: 'regard', kk: '[rɪˋgɑrd]', part: 'v.', def: '把...視為; 問候', sentence: 'We all regard Roger as a hero.', senTrans: '我們都把羅傑視為英雄。', other: 'regarded / regarding' },
  { unit: 26, word: 'increase', kk: '[ɪnˋkris]', part: 'v.', def: '增加', sentence: 'The driver increased speed suddenly.', senTrans: '這位駕駛突然加速行駛。', other: 'increased / increasing' },
  { unit: 26, word: 'escape', kk: '[əˋskep]', part: 'v.', def: '逃脫; 躲過', sentence: 'According to the news, a notorious drug dealer escaped from prison.', senTrans: '據新聞報導，一個惡名昭彰的毒販越獄了。', other: 'escaped / escaping' },
  { unit: 26, word: 'develop', kk: '[dɪˋvɛləp]', part: 'v.', def: '發展; 沖洗(底片)', sentence: 'The mistake was ignored and later developed into a major problem.', senTrans: '這錯誤被忽略，後來就演變成一個大問題。', other: 'developed / developing' },
  { unit: 26, word: 'burn', kk: '[bɝn]', part: 'v.', def: '燃燒; 燒焦', sentence: 'The secretary burned up all the papers before the police came.', senTrans: '那祕書在警方來之前就燒毀了所有的文件。', other: 'burned / burnt / burning' },
  { unit: 26, word: 'effect', kk: '[ɪˋfɛkt]', part: 'n.', def: '效果; 影響', sentence: 'The medicine was starting to take effect.', senTrans: '這藥開始見效了。', other: 'effects' },
  { unit: 26, word: 'whenever', kk: '[hwɛnˋɛvɚ]', part: 'conj.', def: '每當; 無論何時', sentence: 'Whenever I was on stage, my hands couldn\'t stop shaking.', senTrans: '每當我在臺上時，我就會手抖個不停。', other: '' },
  { unit: 26, word: 'bookstore', kk: '[ˋbʊk͵stor]', part: 'n.', def: '書店', sentence: 'Donald went to a bookstore yesterday and bought a few novels.', senTrans: '唐納德昨天去書店買了幾本小說。', other: 'bookstores' },
  { unit: 26, word: 'better', kk: '[ˋbɛtɚ]', part: 'a.', def: '更好的', sentence: 'George wants to buy a better car than his current one.', senTrans: '喬治想買一輛比現在更好的車。', other: '' },
  { unit: 26, word: 'stone', kk: '[ston]', part: 'n.', def: '石頭', sentence: 'Gordon left no stone unturned in his search for the person who had saved his life.', senTrans: '戈登千方百計地想找出他的救命恩人。', other: 'stones' },
  { unit: 26, word: 'suggest', kk: '[səgˋdʒɛst]', part: 'v.', def: '建議; 暗示', sentence: 'Frank suggested that we (should) leave early.', senTrans: '法蘭克建議我們早點離開。', other: 'suggested / suggesting' },
  { unit: 26, word: 'challenge', kk: '[ˋtʃælɪndʒ]', part: 'n.', def: '挑戰', sentence: 'The politician is facing the biggest challenge of her career.', senTrans: '這位政治人物正面臨她職涯中最大的挑戰。', other: 'challenges' },
  { unit: 26, word: 'firm', kk: '[fɝm]', part: 'a.', def: '堅硬的; 堅定的', sentence: 'I prefer to sleep on a firm bed.', senTrans: '我比較喜歡睡硬床。', other: '' },
  { unit: 26, word: 'offer', kk: '[ˋɔfɚ]', part: 'v.', def: '提供; 提議', sentence: 'Thank you for offering me such a great opportunity.', senTrans: '謝謝你提供我一個這麼好的機會。', other: 'offered / offering' },
  { unit: 26, word: 'supply', kk: '[səˋplaɪ]', part: 'v.', def: '供應; 供給', sentence: 'Despite water rationing, the large water tank can supply the residents with the water they need.', senTrans: '儘管有限水，大型水塔仍可為住戶提供用水。', other: 'supplied / supplying' },
  { unit: 26, word: 'further', kk: '[ˋfɝðɚ]', part: 'a.', def: '更進一步的', sentence: 'Visit our website for further information.', senTrans: '如需更多資訊請上我們的網站。', other: '' },
  { unit: 26, word: 'worse', kk: '[wɝs]', part: 'a.', def: '更糟的', sentence: 'Erica tried to help, but she actually made matters worse.', senTrans: '艾瑞卡試圖幫忙，但她實際上卻把事情弄得更糟。', other: '' },
  { unit: 26, word: 'worst', kk: '[wɝst]', part: 'a.', def: '最糟的', sentence: 'Gloria thought the singer was the worst one she had ever heard.', senTrans: '葛羅莉亞認為這歌手是她聽過唱得最糟的歌手。', other: '' },
  { unit: 26, word: 'village', kk: '[ˋvɪlɪdʒ]', part: 'n.', def: '村莊', sentence: 'The village was almost destroyed by fire.', senTrans: '這村莊幾乎被大火燒毀了。', other: 'villages' },
  { unit: 26, word: 'field', kk: '[fild]', part: 'n.', def: '原野; 領域', sentence: 'There are ten cows in the field.', senTrans: '原野上有 10 頭乳牛。', other: 'fields' },
  { unit: 26, word: 'sailor', kk: '[ˋselɚ]', part: 'n.', def: '水手; 船員', sentence: 'Those sailors were caught in a violent storm.', senTrans: '那些船員遇到一場猛烈的風暴。', other: 'sailors' },
  { unit: 26, word: 'sail', kk: '[sel]', part: 'v.', def: '航行; 駕駛(船)', sentence: 'The sails of the boat flapped in the strong wind.', senTrans: '這艘船的帆在強風中擺動著。', other: 'sailed / sailing' },
  { unit: 26, word: 'suppose', kk: '[səˋpoz]', part: 'v.', def: '猜想; 認為', sentence: 'It\'s late, so I suppose you must go home.', senTrans: '時間很晚了，所以我想你得回家了。', other: 'supposed / supposing' },
  { unit: 26, word: 'consider', kk: '[kənˋsɪdɚ]', part: 'v.', def: '考慮; 把...視為', sentence: 'I\'m considering taking a trip to Japan.', senTrans: '我正考慮到日本去旅行。', other: 'considered / considering' },
  { unit: 26, word: 'consideration', kk: '[kən͵sɪdəˋreʃən]', part: 'n.', def: '考慮', sentence: 'Further consideration is necessary before we carry out this plan.', senTrans: '在我們實施這項計畫前，必須再三考慮才行。', other: 'considerations' },
  { unit: 26, word: 'thought', kk: '[θɔt]', part: 'n.', def: '想法', sentence: 'Kevin felt sad at the thought of his disabled child struggling at school.', senTrans: '凱文想到自己的身障孩子在學校掙扎，就感到很難過。', other: 'thoughts' },

  // --- Unit 27 ---
  { unit: 27, word: 'pride', kk: '[praɪd]', part: 'n.', def: '自豪; 自尊', sentence: 'The father takes pride in his son\'s excellent performance in school.', senTrans: '那位父親以兒子在校優異的表現為榮。', other: '' },
  { unit: 27, word: 'govern', kk: '[ˋgʌvɚn]', part: 'v.', def: '統治; 管理', sentence: 'The president has governed that country for the last ten years.', senTrans: '這位總統在過去的 10 年一直統治著那個國家。', other: 'governed / governing' },
  { unit: 27, word: 'government', kk: '[ˋgʌvɚnmənt]', part: 'n.', def: '政府', sentence: 'The central government has promised to cut taxes.', senTrans: '中央政府已承諾要減稅。', other: 'governments' },
  { unit: 27, word: 'period', kk: '[ˋpɪrɪəd]', part: 'n.', def: '一段期間; 句點', sentence: 'I\'m going to stay here for a long period of time.', senTrans: '我將在這裡待上一段很長的時間。', other: 'periods' },
  { unit: 27, word: 'term', kk: '[tɝm]', part: 'n.', def: '學期; 術語', sentence: 'All students are required to hand in a written paper at the end of the term.', senTrans: '所有學生於學期末均須繳交一篇書面報告。', other: 'terms' },
  { unit: 27, word: 'century', kk: '[ˋsɛntʃərɪ]', part: 'n.', def: '世紀', sentence: 'Many great inventions were made in the 20th century.', senTrans: '許多偉大的發明都是在 20 世紀問世的。', other: 'centuries' },
  { unit: 27, word: 'accident', kk: '[ˋæksədənt]', part: 'n.', def: '意外; 車禍', sentence: 'David\'s back was seriously injured in a car accident.', senTrans: '大衛的背在車禍中背部受到重傷。', other: 'accidents' },
  { unit: 27, word: 'result', kk: '[rɪˋzʌlt]', part: 'v.', def: '由...引起; 結果', sentence: 'Ben\'s failure resulted from laziness.', senTrans: '班的失敗起因於懶惰。', other: 'resulted / resulting' },
  { unit: 27, word: 'local', kk: '[ˋlokl]', part: 'a.', def: '當地的', sentence: 'The local market offers a great selection of fruits and vegetables.', senTrans: '本地市場供應種類繁多的蔬果。', other: '' },
  { unit: 27, word: 'chess', kk: '[tʃɛs]', part: 'n.', def: '西洋棋', sentence: 'Jessie is very good at playing chess.', senTrans: '潔西很會下西洋棋。', other: '' },
  { unit: 27, word: 'board', kk: '[bord]', part: 'n.', def: '板子; 董事會', sentence: 'We need more boards to build the bookshelf.', senTrans: '我們需要更多木板來做這個書架。', other: 'boards' },
  { unit: 27, word: 'trash', kk: '[træʃ]', part: 'n.', def: '垃圾', sentence: 'The boy picked up a piece of trash and threw it in the trash can.', senTrans: '男孩撿起一個垃圾丟進了垃圾桶。', other: '' },
  { unit: 27, word: 'garbage', kk: '[ˋgɑrbɪdʒ]', part: 'n.', def: '垃圾', sentence: 'Sort out your garbage before dumping it.', senTrans: '倒垃圾前要先將垃圾分類。', other: '' },
  { unit: 27, word: 'waste', kk: '[west]', part: 'v.', def: '浪費', sentence: 'Don\'t waste your time watching TV.', senTrans: '不要浪費時間看電視。', other: 'wasted / wasting' },
  { unit: 27, word: 'bit', kk: '[bɪt]', part: 'n.', def: '小塊; 少量', sentence: 'The pasta was so delicious that Susan ate every bit of it.', senTrans: '那義大利麵太美味了，蘇珊吃到一點都不剩。', other: 'bits' },
  { unit: 27, word: 'method', kk: '[ˋmɛθəd]', part: 'n.', def: '方法', sentence: 'The method we used earlier to try to get the car started didn\'t work.', senTrans: '我們先前試著用來發動車子的方法不管用。', other: 'methods' },
  { unit: 27, word: 'approach', kk: '[əˋprotʃ]', part: 'v.', def: '接近; 處理', sentence: 'The dogcatchers approached the dangerous dog with caution.', senTrans: '捕犬員小心翼翼地接近那隻危險的狗。', other: 'approached / approaching' },
  { unit: 27, word: 'necessary', kk: '[ˋnɛsə͵sɛrɪ]', part: 'a.', def: '必要的', sentence: 'It is necessary for you to punch in by eight o\'clock every morning.', senTrans: '你每天早上一定要在 8 點前打卡上班。', other: '' },
  { unit: 27, word: 'importance', kk: '[ɪmˋpɔrtns]', part: 'n.', def: '重要(性)', sentence: 'Our teacher\'s words are of great importance to us.', senTrans: '我們老師的話對我們來說很重要。', other: '' },
  { unit: 27, word: 'control', kk: '[kənˋtrol]', part: 'v.', def: '控制', sentence: 'Don\'t worry. Everything is under control.', senTrans: '別擔心。一切都在掌控中。', other: 'controlled / controlling' },
  { unit: 27, word: 'limit', kk: '[ˋlɪmɪt]', part: 'v.', def: '限制', sentence: 'The doctor told me that I should limit myself to two cups of tea a day.', senTrans: '醫生告訴我我應該限制自己一天只能喝 2 杯茶。', other: 'limited / limiting' },
  { unit: 27, word: 'difference', kk: '[ˋdɪfərəns]', part: 'n.', def: '差別', sentence: 'Do you know the difference between a mule and a donkey?', senTrans: '你知道騾和驢的差別嗎？', other: 'differences' },
  { unit: 27, word: 'produce', kk: '[prəˋdjus]', part: 'v.', def: '生產', sentence: 'This large factory produces furniture.', senTrans: '這家很大間的工廠生產傢俱。', other: 'produced / producing' },
  { unit: 27, word: 'production', kk: '[prəˋdʌkʃən]', part: 'n.', def: '生產; 產量', sentence: 'We need to build two more assembly lines to speed up production.', senTrans: '我們需另外建立 2 條裝配線以加速生產。', other: 'productions' },
  { unit: 27, word: 'department', kk: '[dɪˋpɑrtmənt]', part: 'n.', def: '部門', sentence: 'My sister works in the sales department of this company.', senTrans: '我姊姊在這公司的銷售部門工作。', other: 'departments' },
  { unit: 27, word: 'attend', kk: '[əˋtɛnd]', part: 'v.', def: '參加; 出席', sentence: 'All employees are required to attend the meeting.', senTrans: '全體員工一律得去參加該會議。', other: 'attended / attending' },
  { unit: 27, word: 'attention', kk: '[əˋtɛnʃən]', part: 'n.', def: '注意', sentence: 'You should pay attention to the coach.', senTrans: '你該注意聽教練說的話。', other: '' },
  { unit: 27, word: 'describe', kk: '[dɪˋskraɪb]', part: 'v.', def: '描述', sentence: 'Can you describe the man who stole your purse?', senTrans: '妳能描述一下偷妳手提包的人的樣子嗎？', other: 'described / describing' },
  { unit: 27, word: 'description', kk: '[dɪˋskrɪpʃən]', part: 'n.', def: '描述', sentence: 'The majesty of Jade Mountain is beyond description.', senTrans: '玉山的雄偉非筆墨所能形容。', other: 'descriptions' },
  { unit: 27, word: 'within', kk: '[wɪˋðɪn]', part: 'prep.', def: '在...之內', sentence: 'Drive within the speed limit, or you\'ll get a ticket.', senTrans: '要在速限內開車，不然你會被開罰單。', other: '' },
  { unit: 27, word: 'among', kk: '[əˋmʌŋ]', part: 'prep.', def: '在...之中', sentence: 'Karen found a picture of her old boyfriend among her photos.', senTrans: '凱倫在她的照片中發現了她以前男友的照片。', other: '' },
  { unit: 27, word: 'used', kk: '[just]', part: 'a.', def: '習慣的; 二手的', sentence: 'Jack is used to driving to work.', senTrans: '傑克習慣開車去上班。', other: '' },
  { unit: 27, word: 'user', kk: '[ˋjuzɚ]', part: 'n.', def: '使用者', sentence: 'Read the user manual carefully before operating the machine.', senTrans: '操作機器前請詳讀使用者手冊。', other: 'users' },
  { unit: 27, word: 'such', kk: '[sʌtʃ]', part: 'a.', def: '如此', sentence: 'It was such an excellent performance.', senTrans: '這真是場精彩絕倫的表演。', other: '' },
  { unit: 27, word: 'army', kk: '[ˋɑrmɪ]', part: 'n.', def: '軍隊', sentence: 'My father joined the army when he was eighteen.', senTrans: '我父親 18 歲時從軍。', other: 'armies' },
  { unit: 27, word: 'military', kk: '[ˋmɪlə͵tɛrɪ]', part: 'n.', def: '軍隊', sentence: 'My brother plans to join the military after senior high school.', senTrans: '我弟弟計劃讀完高中後從軍。', other: '' },
  { unit: 27, word: 'command', kk: '[kəˋmænd]', part: 'v.', def: '命令', sentence: 'The general commanded the troops to fire on the enemy.', senTrans: '將軍下令部隊向敵軍開火。', other: 'commanded / commanding' },
  { unit: 27, word: 'obey', kk: '[oˋbe]', part: 'v.', def: '遵守; 服從', sentence: 'Obey the law, or you will be punished.', senTrans: '要守法，不然你就會受到懲處。', other: 'obeyed / obeying' },
  { unit: 27, word: 'border', kk: '[ˋbɔrdɚ]', part: 'n.', def: '邊界', sentence: 'My aunt and uncle live on the border of Germany and France.', senTrans: '我的嬸嬸和叔叔住在德法交界處。', other: 'borders' },
  { unit: 27, word: 'super', kk: '[ˋsupɚ]', part: 'a.', def: '超級的; 極好的', sentence: 'Kelly\'s teacher said that she did a super job on her essay.', senTrans: '凱莉的老師說她的文章寫得非常好。', other: '' },
  { unit: 27, word: 'supper', kk: '[ˋsʌpɚ]', part: 'n.', def: '晚餐', sentence: 'Mother usually makes supper at seven.', senTrans: '媽媽通常在 7 點做晚飯。', other: 'suppers' },

// --- Unit 28 ---
  { unit: 28, word: 'diet', kk: '[ˋdaɪət]', part: 'n.', def: '日常飲食; 節食', sentence: 'Wayne\'s diet is full of sweet food, so he has gotten fat.', senTrans: '韋恩的日常飲食都是甜食，所以他變胖了。', other: 'diets' },
  { unit: 28, word: 'environment', kk: '[ɪnˋvaɪrənmənt]', part: 'n.', def: '環境', sentence: 'We should spare no effort to protect our environment from being polluted.', senTrans: '我們應盡全力保護我們的環境免於汙染。', other: 'environments' },
  { unit: 28, word: 'highly', kk: '[ˋhaɪlɪ]', part: 'adv.', def: '極; 非常', sentence: 'David was highly delighted at the news.', senTrans: '大衛聽到這消息高興極了。', other: '' },
  { unit: 28, word: 'blank', kk: '[blæŋk]', part: 'a.', def: '空白的', sentence: 'Please write here and leave the bottom of the page blank.', senTrans: '請你寫在這裡，這一頁底部留白。', other: 'blanks' },
  { unit: 28, word: 'material', kk: '[məˋtɪrɪəl]', part: 'n.', def: '材料; 原料; 素材', sentence: 'The company sells building materials such as bricks and tiles.', senTrans: '那家公司販售建材，如磚塊、磁磚等。', other: 'materials' },
  { unit: 28, word: 'include', kk: '[ɪnˋklud]', part: 'v.', def: '包括', sentence: 'Service and taxes are included in the room price.', senTrans: '房間價格包括服務費及稅金在內。', other: 'included / including' },
  { unit: 28, word: 'record', kk: '[ˋrɛkɚd]', part: 'n.', def: '唱片; 紀錄', sentence: 'We asked the DJ to play this record.', senTrans: '我們要求 DJ 放這張唱片。', other: 'records / recorded / recording' },
  { unit: 28, word: 'section', kk: '[ˋsɛkʃən]', part: 'n.', def: '部分; 區域; 版面', sentence: 'I\'d like a seat in the non-smoking section.', senTrans: '我想要非吸菸區的座位。', other: 'sections' },
  { unit: 28, word: 'usual', kk: '[ˋjuʒʊəl]', part: 'a.', def: '通常的', sentence: 'As usual, Blake was late for work again this morning.', senTrans: '和往常一樣，布萊克今早上班又遲到了。', other: '' },
  { unit: 28, word: 'therefore', kk: '[ˋðɛr͵fɔr]', part: 'adv.', def: '因此', sentence: 'Lance didn\'t study at all; therefore, he failed the test.', senTrans: '蘭斯根本沒有念書，因此他考試不及格。', other: '' },
  { unit: 28, word: 'accept', kk: '[əkˋsɛpt]', part: 'v.', def: '接受', sentence: 'I\'m glad to accept your invitation.', senTrans: '我很高興接受您的邀請。', other: 'accepted / accepting' },
  { unit: 28, word: 'event', kk: '[ɪˋvɛnt]', part: 'n.', def: '事件; 項目', sentence: 'Eddy\'s birthday party is a big event this week.', senTrans: '艾迪的生日派對是本週的大事。', other: 'events' },
  { unit: 28, word: 'personal', kk: '[ˋpɝsn!]', part: 'a.', def: '個人的; 私人的', sentence: 'My personal belongings were all gone when I returned.', senTrans: '我回來時，我的私人物品全都不見了。', other: '' },
  { unit: 28, word: 'simply', kk: '[ˋsɪmplɪ]', part: 'adv.', def: '簡單地; 僅僅', sentence: 'Wendy is simply a beautiful lady.', senTrans: '溫蒂實在是一位美女。', other: '' },
  { unit: 28, word: 'create', kk: '[kriˋet]', part: 'v.', def: '創造', sentence: 'Gary believes that God created Heaven and Earth.', senTrans: '蓋瑞相信上帝創造了天和地。', other: 'created / creating' },
  { unit: 28, word: 'beyond', kk: '[bɪˋjɑnd]', part: 'prep.', def: '超過; 在遠處', sentence: 'The situation is beyond my control.', senTrans: '情況超過我能控制的範圍。', other: '' },
  { unit: 28, word: 'brilliant', kk: '[ˋbrɪljənt]', part: 'a.', def: '燦爛的; 出色的', sentence: 'Josh came up with a brilliant idea to solve the problem.', senTrans: '喬許想到了個很棒的方法來解決這個問題。', other: '' },
  { unit: 28, word: 'against', kk: '[əˋgɛnst]', part: 'prep.', def: '反對; 倚; 靠', sentence: 'Never do anything against the law.', senTrans: '千萬別做違法的事。', other: '' },
  { unit: 28, word: 'blanket', kk: '[ˋblæŋkɪt]', part: 'n.', def: '毯子', sentence: 'The mother wrapped the baby in a blanket.', senTrans: '這母親把嬰兒裹在毯子裡。', other: 'blankets' },
  { unit: 28, word: 'channel', kk: '[ˋtʃæn!]', part: 'n.', def: '頻道; 海峽; 管道', sentence: 'The internet has become an important channel of communication.', senTrans: '網路已成為一個重要的溝通管道。', other: 'channels' },
  { unit: 28, word: 'pale', kk: '[pel]', part: 'a.', def: '蒼白的; 淡色的', sentence: 'Jim went deathly pale upon hearing the news.', senTrans: '吉姆聽到這消息，臉色立即變得一片死白。', other: '' },
  { unit: 28, word: 'cheer', kk: '[tʃɪr]', part: 'v.', def: '歡呼; 喝彩', sentence: 'When their team scored a goal, the fans cheered.', senTrans: '當他們的球隊進球得分時，球迷們都歡呼了起來。', other: 'cheered / cheering' },
  { unit: 28, word: 'similar', kk: '[ˋsɪməlɚ]', part: 'a.', def: '相似的', sentence: 'Your taste in clothes is similar to mine.', senTrans: '你的穿著品味和我很相似。', other: '' },
  { unit: 28, word: 'album', kk: '[ˋælbəm]', part: 'n.', def: '專輯; 相簿', sentence: 'This singer is going to release her new album next month.', senTrans: '這歌手下個月會發行她的新專輯。', other: 'albums' },
  { unit: 28, word: 'due', kk: '[dju]', part: 'a.', def: '到期的; 預定的', sentence: 'The first payment is due on August 31st.', senTrans: '第一筆付款額於 8 月 31 日到期。', other: '' },
  { unit: 28, word: 'influence', kk: '[ˋɪnflʊəns]', part: 'n.', def: '影響', sentence: 'Ms. Brown has a good influence on the students.', senTrans: '布朗老師對學生有正面的影響。', other: 'influenced / influencing' },

  // --- Unit 29 ---
  { unit: 29, word: 'surface', kk: '[ˋsɝfɪs]', part: 'n.', def: '表面', sentence: 'The surface of the table was covered with dirt.', senTrans: '桌子的表面布滿灰塵。', other: 'surfaces' },
  { unit: 29, word: 'decision', kk: '[dɪˋsɪʒən]', part: 'n.', def: '決定', sentence: 'I\'m sorry, but you\'ll have to make a decision quickly.', senTrans: '很抱歉，但你必須趕快做決定。', other: 'decisions' },
  { unit: 29, word: 'contain', kk: '[kənˋten]', part: 'v.', def: '包含; 裝有', sentence: 'This photo album contains all of my grandmother\'s favorite photos.', senTrans: '這本相簿裡裝著所有我奶奶最愛的照片。', other: 'contained / containing' },
  { unit: 29, word: 'recent', kk: '[ˋrisnt]', part: 'a.', def: '最近的', sentence: 'Ivy\'s grades have improved in recent months.', senTrans: '最近幾個月來，艾薇的成績已有進步。', other: '' },
  { unit: 29, word: 'organization', kk: '[͵ɔrgənəˋzeʃən]', part: 'n.', def: '組織', sentence: 'Greenpeace is a famous non-profit organization.', senTrans: '綠色和平組織是一個有名的非營利組織。', other: 'organizations' },
  { unit: 29, word: 'industry', kk: '[ˋɪndəstrɪ]', part: 'n.', def: '工業; 行業', sentence: 'The fashion industry would be an interesting one to get into.', senTrans: '從事時裝業會很有意思。', other: 'industries' },
  { unit: 29, word: 'basic', kk: '[ˋbesɪk]', part: 'a.', def: '基本的', sentence: 'Every parent must provide their child with at least the basics.', senTrans: '每個父母都必須至少為其子女提供基本需求。', other: 'basics' },
  { unit: 29, word: 'source', kk: '[sɔrs]', part: 'n.', def: '來源', sentence: 'Reading is a wonderful source of pleasure.', senTrans: '閱讀是很棒的快樂泉源。', other: 'sources' },
  { unit: 29, word: 'peace', kk: '[pis]', part: 'n.', def: '和平; 平靜', sentence: 'Zora loves the peace of the countryside.', senTrans: '卓拉喜歡鄉間的平靜。', other: '' },
  { unit: 29, word: 'single', kk: '[ˋsɪŋg!]', part: 'a.', def: '單身的; 單一的', sentence: 'Wendy has decided to remain single for the rest of her life.', senTrans: '溫蒂已經決定此後終生單身。', other: 'singles' },
  { unit: 29, word: 'natural', kk: '[ˋnætʃərəl]', part: 'a.', def: '自然的', sentence: 'We enjoyed the natural beauty of the Grand Canyon.', senTrans: '我們欣賞著大峽谷的自然美景。', other: '' },
  { unit: 29, word: 'clever', kk: '[ˋklɛvɚ]', part: 'a.', def: '聰明的', sentence: 'Sally is such a clever girl.', senTrans: '莎莉是個如此聰明的女孩。', other: '' },
  { unit: 29, word: 'mask', kk: '[mæsk]', part: 'n.', def: '面具; 口罩', sentence: 'Always wear a face mask when you are sweeping the floor.', senTrans: '你掃地的時候，一定要戴口罩。', other: 'masks' },
  { unit: 29, word: 'likely', kk: '[ˋlaɪklɪ]', part: 'a.', def: '有可能的', sentence: 'It is likely that John and Lulu will get married.', senTrans: '約翰和露露可能會結婚。', other: '' },
  { unit: 29, word: 'actual', kk: '[ˋæktʃʊəl]', part: 'a.', def: '真實的; 確實的', sentence: 'This is the actual sword that was used in the film.', senTrans: '這是那部電影中真正用的劍。', other: '' },
  { unit: 29, word: 'lack', kk: '[læk]', part: 'v.', def: '缺乏', sentence: 'This soup lacks salt. Maybe you should add some.', senTrans: '這碗湯沒加鹽，也許你應該加一點。', other: 'lacked / lacking' },
  { unit: 29, word: 'empty', kk: '[ˋɛmptɪ]', part: 'a.', def: '空的', sentence: 'The classroom was empty, with no teacher or children in sight.', senTrans: '這教室裡空無一人，都沒看到老師和小孩。', other: 'emptied / emptying' },
  { unit: 29, word: 'lift', kk: '[lɪft]', part: 'v.', def: '舉起', sentence: 'That box is too heavy to lift.', senTrans: '那箱子太重而提不動。', other: 'lifted / lifting' },
  { unit: 29, word: 'fashion', kk: '[ˋfæʃən]', part: 'n.', def: '流行; 時尚', sentence: 'Miniskirts used to be in fashion, but they\'re out of fashion now.', senTrans: '迷你裙以前很流行，但現在退燒了。', other: 'fashions' },
  { unit: 29, word: 'detail', kk: '[ˋditel]', part: 'n.', def: '細節', sentence: 'I haven\'t had time to review the plan in detail yet.', senTrans: '我還沒有時間詳細審閱這計畫。', other: 'details' },
  { unit: 29, word: 'equal', kk: '[ˋikwəl]', part: 'a.', def: '平等的; 相等的', sentence: 'Four plus four is equal to eight.', senTrans: '4 加 4 等於 8。', other: 'equaled / equaling' },
  { unit: 29, word: 'manage', kk: '[ˋmænɪdʒ]', part: 'v.', def: '經營; 管理; 設法', sentence: 'Erin managed the hotel while her father was ill.', senTrans: '艾琳父親生病時，飯店是由艾琳經營的。', other: 'managed / managing' },
  { unit: 29, word: 'prize', kk: '[praɪz]', part: 'n.', def: '獎品; 獎金', sentence: 'Dolly won a big prize for her science experiment.', senTrans: '朵莉所做的科學實驗為她贏得了大獎。', other: 'prizes' },

  // --- Unit 30 ---
  { unit: 30, word: 'artist', kk: '[ˋɑrtɪst]', part: 'n.', def: '藝術家', sentence: 'That street artist attracted a large crowd of visitors.', senTrans: '那位街頭藝人吸引了一大群的遊客。', other: 'artists' },
  { unit: 30, word: 'failure', kk: '[ˋfeljɚ]', part: 'n.', def: '失敗', sentence: 'Failure is the mother of success.', senTrans: '失敗為成功之母。', other: 'failures' },
  { unit: 30, word: 'occur', kk: '[əˋkɝ]', part: 'v.', def: '發生', sentence: 'The serious car accident occurred because of the taxi driver\'s carelessness.', senTrans: '會發生那起嚴重車禍是因為那計程車司機很粗心大意。', other: 'occurred / occurring' },
  { unit: 30, word: 'charge', kk: '[tʃɑrdʒ]', part: 'v.', def: '收費; 充電; 控訴', sentence: 'The company charged me NT$500 for fixing the television.', senTrans: '那家公司向我索取新臺幣 500 元的電視修理費。', other: 'charged / charging' },
  { unit: 30, word: 'entire', kk: '[ɪnˋtaɪr]', part: 'a.', def: '整個的; 全部的', sentence: 'The entire staff in that company were against the new policy.', senTrans: '那家公司的全體員工一致反對那項新政策。', other: '' },
  { unit: 30, word: 'manner', kk: '[ˋmænɚ]', part: 'n.', def: '方式; 禮貌', sentence: 'The little girl answered her teacher\'s question in a confident manner.', senTrans: '小女孩很有自信地回答了老師的問題。', other: 'manners' },
  { unit: 30, word: 'range', kk: '[rendʒ]', part: 'n.', def: '範圍; 幅度', sentence: 'The price range of the product is from US$40 to US$400.', senTrans: '這種產品的價格範圍從 40 美元到 400 美元不等。', other: 'ranges' },
  { unit: 30, word: 'quality', kk: '[ˋkwɑlətɪ]', part: 'n.', def: '品質', sentence: 'That shirt is of high quality, and the price is reasonable.', senTrans: '那件襯衫品質很好，價格又合理。', other: 'qualities' },
  { unit: 30, word: 'relation', kk: '[rɪˋleʃən]', part: 'n.', def: '關係', sentence: 'I think there is a relation between media violence and crime.', senTrans: '我認為媒體暴力與犯罪之間是有關係的。', other: 'relations' },
  { unit: 30, word: 'central', kk: '[ˋsɛntrəl]', part: 'a.', def: '中央的', sentence: 'The park is in the central part of the city.', senTrans: '那座公園位於市中心。', other: '' },
  { unit: 30, word: 'support', kk: '[səˋport]', part: 'v.', def: '支持', sentence: 'My father has always supported me in whatever I want to do.', senTrans: '不論我想做什麼，我父親總是支持我。', other: 'supported / supporting' },
  { unit: 30, word: 'model', kk: '[ˋmɑd!]', part: 'n.', def: '模特兒; 模型; 榜樣', sentence: 'Mary is a famous fashion model.', senTrans: '瑪麗是知名的時裝模特兒。', other: 'models' },
  { unit: 30, word: 'northern', kk: '[ˋnɔrðɚn]', part: 'a.', def: '北方的', sentence: 'The northern part of this country is very beautiful.', senTrans: '這國家的北部很美麗。', other: '' },
  { unit: 30, word: 'opinion', kk: '[əˋpɪnjən]', part: 'n.', def: '意見', sentence: 'In my opinion, students should not be allowed to bring cellphones to school.', senTrans: '依我之見，不應允許學生帶手機到學校。', other: 'opinions' },
  { unit: 30, word: 'rather', kk: '[ˋræðɚ]', part: 'adv.', def: '相當; 寧願', sentence: 'It\'s rather hot today.', senTrans: '今天相當熱。', other: '' },
  { unit: 30, word: 'growth', kk: '[groθ]', part: 'n.', def: '成長', sentence: 'There has been a steady growth in Amber\'s business.', senTrans: '安柏的事業一直穩定成長。', other: '' },
  { unit: 30, word: 'repair', kk: '[rɪˋpɛr]', part: 'v.', def: '修理', sentence: 'My car broke down yesterday, so I\'m going to have it repaired.', senTrans: '我的車子昨天拋錨了，因此我今天要把它拿去送修。', other: 'repaired / repairing' },
  { unit: 30, word: 'remove', kk: '[rɪˋmuv]', part: 'v.', def: '移除; 去掉', sentence: 'I removed a coffee stain from the shirt with a special cleanser.', senTrans: '我用一種特別的清潔劑把襯衫上的咖啡漬去掉了。', other: 'removed / removing' },
  { unit: 30, word: 'arrival', kk: '[əˋraɪv!]', part: 'n.', def: '到達', sentence: 'Our lives have changed since the arrival of the mobile phone.', senTrans: '自從手機問世後，我們的生活便大大的改變了。', other: 'arrivals' },
  { unit: 30, word: 'rent', kk: '[rɛnt]', part: 'v.', def: '租用; 出租', sentence: 'How much is your monthly rent for your apartment?', senTrans: '你每月公寓租金是多少錢？', other: 'rented / renting' },
  { unit: 30, word: 'nerve', kk: '[nɝv]', part: 'n.', def: '神經; 勇氣', sentence: 'Arthur doesn\'t have the nerve to apologize to Bonnie.', senTrans: '亞瑟沒有勇氣向邦妮道歉。', other: 'nerves' },
  { unit: 30, word: 'blood', kk: '[blʌd]', part: 'n.', def: '血', sentence: 'Help! A man is losing a lot of blood here.', senTrans: '救命啊！有人在這裡流好多血。', other: '' },
  { unit: 30, word: 'particular', kk: '[pɚˋtɪkjəlɚ]', part: 'a.', def: '特別的; 挑剔的', sentence: 'The little boy is very particular about the food he eats.', senTrans: '那小男孩對他吃的食物很挑剔。', other: '' },
  { unit: 30, word: 'unless', kk: '[ənˋlɛs]', part: 'conj.', def: '除非', sentence: 'Unless you make a reservation, you won\'t get a table.', senTrans: '除非去訂位，要不然你不會有位子坐。', other: '' },
  { unit: 30, word: 'conversation', kk: '[͵kɑnvɚˋseʃən]', part: 'n.', def: '對話', sentence: 'Matt was eager to have a conversation with the pretty girl.', senTrans: '麥特非常想和那漂亮的女孩聊天。', other: 'conversations' },
  { unit: 30, word: 'shy', kk: '[ʃaɪ]', part: 'a.', def: '害羞的', sentence: 'The little girl is too shy to talk to anyone.', senTrans: '那小女孩太害羞了，因此沒辦法跟任何人交談。', other: '' },
  { unit: 30, word: 'emphasize', kk: '[ˋɛmfə͵saɪz]', part: 'v.', def: '強調', sentence: 'The study emphasizes the importance of a balanced diet.', senTrans: '這份研究強調均衡飲食的重要性。', other: 'emphasized / emphasizing' },

  // --- Unit 31 ---
  { unit: 31, word: 'triangle', kk: '[ˋtraɪ͵æŋg!]', part: 'n.', def: '三角形', sentence: 'The child is learning to draw a triangle.', senTrans: '這小朋友正在學畫三角形。', other: 'triangles' },
  { unit: 31, word: 'shut', kk: '[ʃʌt]', part: 'v.', def: '關閉', sentence: 'Shut the window before you leave.', senTrans: '離開前把窗戶關起來。', other: 'shut / shutting' },
  { unit: 31, word: 'wallet', kk: '[ˋwɑlɪt]', part: 'n.', def: '皮夾', sentence: 'Dad gave me a leather wallet for my birthday.', senTrans: '老爸送我皮夾子當生日禮物。', other: 'wallets' },
  { unit: 31, word: 'addition', kk: '[əˋdɪʃən]', part: 'n.', def: '加法; 添加', sentence: 'Mom, my teacher told me we would learn addition first.', senTrans: '媽媽，我老師說我們會先學加法。', other: 'additions' },
  { unit: 31, word: 'express', kk: '[ɪkˋsprɛs]', part: 'v.', def: '表達; 快遞', sentence: 'He can express himself fluently in English.', senTrans: '他能用流利的英文表達自己的意思。', other: 'expressed / expressing' },
  { unit: 31, word: 'loss', kk: '[lɔs]', part: 'n.', def: '損失; 失去', sentence: 'Mr. Wang\'s death was a great loss to our company.', senTrans: '王先生去世是我們公司的一大損失。', other: 'losses' },
  { unit: 31, word: 'couple', kk: '[ˋkʌp!]', part: 'n.', def: '一對; 夫婦', sentence: 'I think the young couple next door is very kind.', senTrans: '我覺得隔壁那對年輕夫婦很友善。', other: 'couples' },
  { unit: 31, word: 'meaning', kk: '[ˋminɪŋ]', part: 'n.', def: '意義; 意思', sentence: 'Not many people understand the meaning behind his words.', senTrans: '不是很多人了解隱藏在他話背後的含意。', other: 'meanings' },
  { unit: 31, word: 'form', kk: '[fɔrm]', part: 'n.', def: '表格; 形式', sentence: 'Fill out the application form, and then wait in line.', senTrans: '填妥申請表格，然後排隊等候。', other: 'forms' },
  { unit: 31, word: 'distant', kk: '[ˋdɪstənt]', part: 'a.', def: '遙遠的', sentence: 'The two boys are distant relatives of mine.', senTrans: '這 2 個男孩是我的遠房親戚。', other: '' },
  { unit: 31, word: 'gather', kk: '[ˋgæðɚ]', part: 'v.', def: '聚集; 收集', sentence: 'A lot of students are gathering there.', senTrans: '很多學生正聚集在那裡。', other: 'gathered / gathering' },
  { unit: 31, word: 'respect', kk: '[rɪˋspɛkt]', part: 'n.', def: '尊敬', sentence: 'Students should show their respect for their teachers.', senTrans: '學生應該尊敬老師。', other: 'respected / respecting' },
  { unit: 31, word: 'trade', kk: '[tred]', part: 'v.', def: '貿易; 交換', sentence: 'Jim traded his favorite comic book for a toy car.', senTrans: '吉姆用他最喜歡的漫畫書換了玩具車。', other: 'traded / trading' },
  { unit: 31, word: 'difficulty', kk: '[ˋdɪfə͵kʌltɪ]', part: 'n.', def: '困難', sentence: 'Do you have any difficulty understanding spoken Chinese?', senTrans: '你聽口語中文有困難嗎？', other: 'difficulties' },
  { unit: 31, word: 'enemy', kk: '[ˋɛnəmɪ]', part: 'n.', def: '敵人', sentence: 'Laziness is your own worst enemy.', senTrans: '懶惰是你最大的敵人。', other: 'enemies' },
  { unit: 31, word: 'sample', kk: '[ˋsæmp!]', part: 'n.', def: '樣品; 樣本', sentence: 'The supermarket gives customers samples of food every day.', senTrans: '此超市每天都給客人提供試吃。', other: 'samples' },
  { unit: 31, word: 'toast', kk: '[tost]', part: 'n.', def: '吐司; 敬酒', sentence: 'I had two slices of toast for breakfast.', senTrans: '我今早吃了 2 片烤麵包片當早餐。', other: 'toasts' },
  { unit: 31, word: 'whole', kk: '[hol]', part: 'a.', def: '整個的', sentence: 'Tell me the whole story.', senTrans: '把整個故事都告訴我。', other: '' },
  { unit: 31, word: 'weigh', kk: '[we]', part: 'v.', def: '稱...的重量', sentence: 'I weigh myself right after I wake up.', senTrans: '我早上一醒來就量體重。', other: 'weighed / weighing' },
  { unit: 31, word: 'degree', kk: '[dɪˋgri]', part: 'n.', def: '度; 程度; 學位', sentence: 'It\'s 0 degrees Celsius today.', senTrans: '今天氣溫攝氏 0 度。', other: 'degrees' },
  { unit: 31, word: 'trick', kk: '[trɪk]', part: 'n.', def: '把戲; 惡作劇', sentence: 'You can\'t teach an old dog new tricks.', senTrans: '老狗學不會新把戲。', other: 'tricks' },
  { unit: 31, word: 'wound', kk: '[wund]', part: 'n.', def: '傷口', sentence: 'Time heals all wounds.', senTrans: '時間會癒合所有的傷痛。', other: 'wounded / wounding' },
  { unit: 31, word: 'confident', kk: '[ˋkɑnfədənt]', part: 'a.', def: '有信心的', sentence: 'The ruling party was confident of winning the election.', senTrans: '執政黨有信心贏得選舉。', other: '' },

// --- Unit 202510 (October) ---
// Date 1
  { unit: 202510, word: 'city', kk: '[ˋsɪtɪ]', part: 'n.', def: '城市', sentence: 'Jack lives in a big city.', senTrans: '傑克住在大城市裡。', other: 'cities' },
  { unit: 202510, word: 'train', kk: '[tren]', part: 'n.', def: '火車', sentence: 'She took the train to Boston.', senTrans: '她搭火車去波士頓。', other: 'trains' },
  { unit: 202510, word: 'lovely', kk: '[ˋlʌvlɪ]', part: 'adj.', def: '美好令人愉快的; 漂亮的', sentence: 'The scenery here is lovely.', senTrans: '這裡的風景很迷人。', other: 'lovelier' },
  { unit: 202510, word: 'tennis', kk: '[ˋtɛnɪs]', part: 'n.', def: '網球', sentence: 'Dan wants to play tennis.', senTrans: '丹想要打網球。', other: '' },
  { unit: 202510, word: 'volleyball', kk: '[ˋvɑlɪ͵bɔl]', part: 'n.', def: '排球', sentence: 'They played volleyball on the beach.', senTrans: '他們在海灘上打排球。', other: '' },

// Date 2
  { unit: 202510, word: 'wonder', kk: '[ˋwʌndɚ]', part: 'n.', def: '奇景; 奇觀', sentence: 'The rainforest is a place of wonder.', senTrans: '雨林是個充滿奇觀的地方。', other: 'wonders' },
  { unit: 202510, word: 'Earth', kk: '[ɝθ]', part: 'n.', def: '地球', sentence: 'Animals live almost everywhere on Earth.', senTrans: '地球上幾乎到處都有動物居住。', other: '' },
  { unit: 202510, word: 'powerful', kk: '[ˋpaʊɚfəl]', part: 'adj.', def: '強而有力的', sentence: 'We had a powerful storm last night.', senTrans: '昨晚我們經歷了一場強烈的暴風雨。', other: '' },
  { unit: 202510, word: 'ride', kk: '[raɪd]', part: 'n.', def: '搭乘; 乘坐', sentence: 'Can you give me a ride in your car?', senTrans: '你可以載我一程嗎？', other: 'rides' },
  { unit: 202510, word: 'tour', kk: '[tur]', part: 'n.', def: '遊覽行程; 導覽', sentence: 'Everyone enjoyed the city tour.', senTrans: '大家都享受這趟城市導覽。', other: 'tours' },

// Date 3
  { unit: 202510, word: 'dance', kk: '[dæns]', part: 'v.', def: '跳舞', sentence: 'Helen enjoys music and dancing.', senTrans: '海倫喜愛音樂和跳舞。', other: 'danced / dancing' },
  { unit: 202510, word: 'main', kk: '[men]', part: 'adj.', def: '主要的', sentence: 'What is the main idea of the book?', senTrans: '這本書的主旨是什麼？', other: '' },
  { unit: 202510, word: 'decoration', kk: '[͵dɛkəˋreʃən]', part: 'n.', def: '裝飾品; 裝飾', sentence: 'We made decorations for the party.', senTrans: '我們製作了派對的裝飾品。', other: 'decorations' },
  { unit: 202510, word: 'hug', kk: '[hʌg]', part: 'v.', def: '擁抱', sentence: 'The mother hugged her child.', senTrans: '母親擁抱了她的孩子。', other: 'hugged / hugging' },
  { unit: 202510, word: 'stew', kk: '[stju]', part: 'n.', def: '燉菜', sentence: 'This beef stew is delicious.', senTrans: '這道燉牛肉很好吃。', other: 'stews' },
  { unit: 202510, word: 'bean', kk: '[bin]', part: 'n.', def: '豆子', sentence: 'She put beans in the salad.', senTrans: '她把豆子放進沙拉裡。', other: 'beans' },

// Date 6
  { unit: 202510, word: 'vinegar', kk: '[ˋvɪnɪgɚ]', part: 'n.', def: '醋', sentence: 'Do you want vinegar on your noodles?', senTrans: '你的麵要加醋嗎？', other: '' },
  { unit: 202510, word: 'microwave', kk: '[ˋmaɪkro͵wev]', part: 'n.', def: '微波爐', sentence: 'The soup is in the microwave.', senTrans: '湯在微波爐裡。', other: 'microwaves' },
  { unit: 202510, word: 'wash', kk: '[wɑʃ]', part: 'v.', def: '清洗', sentence: 'Are you washing clothes now?', senTrans: '你現在正在洗衣服嗎？', other: 'washed / washing' },
  { unit: 202510, word: 'inside', kk: '[ˋɪnˋsaɪd]', part: 'n.', def: '內部', sentence: 'Look on the inside.', senTrans: '看看裡面。', other: '' },
  { unit: 202510, word: 'paper towel', kk: '[ˋpepɚ ˋtaʊəl]', part: 'n.', def: '紙巾', sentence: 'Do you want a paper towel?', senTrans: '你要紙巾嗎？', other: 'paper towels' },

// Date 7
  { unit: 202510, word: 'suit', kk: '[sut]', part: 'n.', def: '西裝; 套裝', sentence: "He's wearing a suit to the fancy party.", senTrans: '他穿著西裝去參加那個盛大的派對。', other: 'suits' },
  { unit: 202510, word: 'film', kk: '[fɪlm]', part: 'n.', def: '影片', sentence: 'They watched a short film together.', senTrans: '他們一起看了一部短片。', other: 'films' },
  { unit: 202510, word: 'dress', kk: '[drɛs]', part: 'n.', def: '洋裝', sentence: 'Lauren put on her summer dress.', senTrans: '蘿倫穿上她的夏日洋裝。', other: 'dresses' },
  { unit: 202510, word: 'almost', kk: '[ˋɔl͵most]', part: 'adv.', def: '幾乎', sentence: "It's almost time to eat.", senTrans: '幾乎到了吃飯時間了。', other: '' },
  { unit: 202510, word: 'wait', kk: '[wet]', part: 'v.', def: '等候', sentence: 'They are waiting for the bus.', senTrans: '他們正在等公車。', other: 'waited / waiting' },

// Date 8
  { unit: 202510, word: 'able', kk: '[ˋeb!]', part: 'adj.', def: '能夠', sentence: 'Are you able to come tomorrow?', senTrans: '你明天能來嗎？', other: '' },
  { unit: 202510, word: 'free', kk: '[fri]', part: 'adj.', def: '空閒的', sentence: "He's free in the afternoon.", senTrans: '他下午有空。', other: '' },
  { unit: 202510, word: 'available', kk: '[əˋveləb!]', part: 'adj.', def: '有空的; 可獲得的', sentence: 'When will you be available?', senTrans: '你什麼時候有空？', other: '' },
  { unit: 202510, word: 'figure out', kk: '[ˋfɪgjɚ aʊt]', part: 'phr v.', def: '想出; 理解', sentence: 'Did you figure out the answer?', senTrans: '你想出答案了嗎？', other: 'figured out' },
  { unit: 202510, word: 'mark', kk: '[mɑrk]', part: 'v.', def: '做標記', sentence: "I'll mark the date on the calendar.", senTrans: '我會在日曆上標記日期。', other: 'marked / marking' },

// Date 9
  { unit: 202510, word: 'sure', kk: '[ʃʊr]', part: 'adv.', def: '當然; 確實', sentence: 'I sure like your ideas.', senTrans: '我確實喜歡你的點子。', other: '' },
  { unit: 202510, word: 'suddenly', kk: '[ˋsʌdnlɪ]', part: 'adv.', def: '意外地; 突然地', sentence: 'Suddenly a person appeared.', senTrans: '突然一個人出現了。', other: '' },
  { unit: 202510, word: 'make it', kk: '[mek ɪt]', part: 'idiom', def: '趕上; 成功', sentence: 'Can you make it for dinner?', senTrans: '你能趕上晚餐嗎？', other: 'made it' },
  { unit: 202510, word: 'take the day off', kk: '[tek ðə de ɔf]', part: 'idiom', def: '請假; 休假', sentence: 'Eric took the day off today.', senTrans: '艾瑞克今天請假。', other: 'took the day off' },
  { unit: 202510, word: 'nothing', kk: '[ˋnʌθɪŋ]', part: 'pron.', def: '沒有事物', sentence: "I'll go to the park if nothing changes.", senTrans: '如果沒變卦我就去公園。', other: '' },

// Date 10
  { unit: 202510, word: 'gram', kk: '[græm]', part: 'n.', def: '公克', sentence: 'How many grams of gold does he have?', senTrans: '他有多少公克黃金？', other: 'grams' },
  { unit: 202510, word: 'boiled', kk: '[bɔɪld]', part: 'adj.', def: '水煮的', sentence: 'Jeff likes to eat boiled meat.', senTrans: '傑夫喜歡吃水煮肉。', other: '' },
  { unit: 202510, word: 'cook', kk: '[kʊk]', part: 'v.', def: '烹飪', sentence: 'Nancy is taking cooking classes.', senTrans: '南西正在上烹飪課。', other: 'cooked / cooking' },
  { unit: 202510, word: 'event', kk: '[ɪˋvɛnt]', part: 'n.', def: '活動', sentence: 'Her birthday party is a big event.', senTrans: '她的生日派對是個大活動。', other: 'events' },
  { unit: 202510, word: 'decorate', kk: '[ˋdɛkə͵ret]', part: 'v.', def: '裝飾', sentence: 'He gave me some great decorating ideas.', senTrans: '他給了我一些很棒的裝飾點子。', other: 'decorated / decorating' },

// Date 13
  { unit: 202510, word: 'key', kk: '[ki]', part: 'n.', def: '鑰匙', sentence: 'Do you have the key to this room?', senTrans: '你有這個房間的鑰匙嗎？', other: 'keys' },
  { unit: 202510, word: 'pocket', kk: '[ˋpɑkɪt]', part: 'n.', def: '口袋', sentence: 'He keeps money in his pocket.', senTrans: '他把錢放在口袋裡。', other: 'pockets' },
  { unit: 202510, word: 'drawer', kk: '[drɔr]', part: 'n.', def: '抽屜', sentence: 'Put these pencils in your desk drawer.', senTrans: '把這些鉛筆放進你的書桌抽屜。', other: 'drawers' },
  { unit: 202510, word: 'between', kk: '[bɪˋtwin]', part: 'prep.', def: '在...之間', sentence: 'Put the paper between the books.', senTrans: '把紙放在書本之間。', other: '' },
  { unit: 202510, word: 'next to', kk: '[nɛkst tu]', part: 'idiom', def: '在...旁邊', sentence: 'Jim is standing next to Dan.', senTrans: '吉姆站在丹旁邊。', other: '' },

// Date 14
  { unit: 202510, word: 'manners', kk: '[ˋmænɚz]', part: 'n.', def: '禮儀', sentence: 'Use good manners when you eat.', senTrans: '吃飯時要有好禮儀。', other: '' },
  { unit: 202510, word: 'elbow', kk: '[ˋɛlbo]', part: 'n.', def: '手肘', sentence: 'Ouch! I hit my elbow on the table.', senTrans: '哎唷！我的手肘撞到桌子了。', other: 'elbows' },
  { unit: 202510, word: 'polite', kk: '[pəˋlaɪt]', part: 'adj.', def: '有禮貌的', sentence: 'Be polite to everyone.', senTrans: '對每個人都要有禮貌。', other: '' },
  { unit: 202510, word: 'mouth', kk: '[maʊθ]', part: 'n.', def: '嘴; 口部', sentence: "What's in the baby's mouth?", senTrans: '寶寶嘴裡有什麼？', other: 'mouths' },
  { unit: 202510, word: 'for example', kk: '[fɔr ɪgˋzæmp!]', part: 'idiom', def: '例如; 舉例而言', sentence: 'For example, you like to swim.', senTrans: '舉例來說，你喜歡游泳。', other: '' },

// Date 15
  { unit: 202510, word: 'left', kk: '[lɛft]', part: 'adj.', def: '左邊的', sentence: 'Darren writes with his left hand.', senTrans: '達倫用左手寫字。', other: '' },
  { unit: 202510, word: 'fork', kk: '[fɔrk]', part: 'n.', def: '叉子', sentence: 'Eat the salad with a fork.', senTrans: '用叉子吃沙拉。', other: 'forks' },
  { unit: 202510, word: 'spoon', kk: '[spun]', part: 'n.', def: '湯匙', sentence: 'Is this bowl and spoon clean?', senTrans: '這個碗和湯匙乾淨嗎？', other: 'spoons' },
  { unit: 202510, word: 'chopstick', kk: '[ˋtʃɑp͵stɪk]', part: 'n.', def: '筷子', sentence: 'She picked up some meat with her chopsticks.', senTrans: '她用筷子夾起一些肉。', other: 'chopsticks' },
  { unit: 202510, word: 'point', kk: '[pɔɪnt]', part: 'v.', def: '指著; 指向', sentence: "Don't point at other people.", senTrans: '不要指著別人。', other: 'pointed / pointing' },

// Date 16
  { unit: 202510, word: 'familiar', kk: '[fəˋmɪljɚ]', part: 'adj.', def: '熟悉的', sentence: 'Are you familiar with the book?', senTrans: '你熟悉這本書嗎？', other: '' },
  { unit: 202510, word: 'elephant', kk: '[ˋɛləfənt]', part: 'n.', def: '大象', sentence: 'That elephant is really big!', senTrans: '那頭大象真大！', other: 'elephants' },
  { unit: 202510, word: 'kangaroo', kk: '[͵kæŋgəˋru]', part: 'n.', def: '袋鼠', sentence: "Kangaroos are Linda's favorite animal.", senTrans: '袋鼠是琳達最喜歡的動物。', other: 'kangaroos' },
  { unit: 202510, word: 'unusual', kk: '[ʌnˋjuʒʊəl]', part: 'adj.', def: '稀奇的; 不尋常的', sentence: 'The sky is an unusual color today.', senTrans: '今天天空的顏色很不尋常。', other: '' },
  { unit: 202510, word: 'frog', kk: '[frɑg]', part: 'n.', def: '青蛙', sentence: 'The frog jumped into the water.', senTrans: '青蛙跳進水裡。', other: 'frogs' },

// Date 17
  { unit: 202510, word: 'unknown', kk: '[ʌnˋnon]', part: 'adj.', def: '未知的', sentence: 'The number is unknown.', senTrans: '號碼是未知的。', other: '' },
  { unit: 202510, word: 'dragon', kk: '[ˋdrægən]', part: 'n.', def: '龍', sentence: 'The dragon looks scary!', senTrans: '那條龍看起來很嚇人！', other: 'dragons' },
  { unit: 202510, word: 'ugly', kk: '[ˋʌglɪ]', part: 'adj.', def: '醜陋的', sentence: 'That coat is an ugly color.', senTrans: '那件外套的顏色很醜。', other: 'uglier' },
  { unit: 202510, word: 'muscle', kk: '[ˋmʌs!]', part: 'n.', def: '肌肉', sentence: 'Rob is strong and has big muscles.', senTrans: '羅伯很強壯，有大肌肉。', other: 'muscles' },
  { unit: 202510, word: 'deep', kk: '[dip]', part: 'adv.', def: '深地', sentence: 'He buried the box deep in the ground.', senTrans: '他把盒子深埋在地下。', other: '' },

// Date 20
  { unit: 202510, word: 'pie', kk: '[paɪ]', part: 'n.', def: '派', sentence: 'Do you want a piece of pie?', senTrans: '你想要一塊派嗎？', other: 'pies' },
  { unit: 202510, word: 'pumpkin', kk: '[ˋpʌmpkɪn]', part: 'n.', def: '南瓜', sentence: 'Do you like pumpkin soup?', senTrans: '你喜歡南瓜湯嗎？', other: 'pumpkins' },
  { unit: 202510, word: 'cake', kk: '[kek]', part: 'n.', def: '蛋糕', sentence: 'Ray is eating a big piece of cake.', senTrans: '雷正在吃一大塊蛋糕。', other: 'cakes' },
  { unit: 202510, word: 'cookie', kk: '[ˋkʊkɪ]', part: 'n.', def: '(甜)餅乾', sentence: 'May I have a chocolate chip cookie?', senTrans: '我可以吃一塊巧克力餅乾嗎？', other: 'cookies' },
  { unit: 202510, word: 'pear', kk: '[pɛr]', part: 'n.', def: '梨子', sentence: 'Pears are my favorite fruit.', senTrans: '梨子是我最喜歡的水果。', other: 'pears' },

// Date 21
  { unit: 202510, word: 'passenger', kk: '[ˋpæsndʒɚ]', part: 'n.', def: '乘客', sentence: 'I can take five passengers in my car.', senTrans: '我的車可以載五名乘客。', other: 'passengers' },
  { unit: 202510, word: 'slow', kk: '[slo]', part: 'adv.', def: '慢地', sentence: 'Go slow and watch for children.', senTrans: '開慢點並注意兒童。', other: 'slower' },
  { unit: 202510, word: 'feeling', kk: '[ˋfilɪŋ]', part: 'n.', def: '感覺', sentence: 'Lynn likes the feeling of flying.', senTrans: '琳喜歡飛行的感覺。', other: 'feelings' },
  { unit: 202510, word: 'focus', kk: '[ˋfokəs]', part: 'v.', def: '專注; 專心', sentence: "Let's focus on finishing the report.", senTrans: '讓我們專注於完成報告。', other: 'focused / focusing' },
  { unit: 202510, word: 'nap', kk: '[næp]', part: 'n.', def: '小睡; 打盹兒', sentence: "Jim is tired, so he's taking a nap.", senTrans: '吉姆累了，所以他在小睡。', other: 'naps' },

// Date 22
  { unit: 202510, word: 'build', kk: '[bɪld]', part: 'v.', def: '建造; 修建', sentence: "He's building a house.", senTrans: '他正在蓋房子。', other: 'built / building' },
  { unit: 202510, word: 'straw', kk: '[strɔ]', part: 'n.', def: '稻草; 吸管', sentence: 'The horse sleeps on the straw.', senTrans: '馬睡在稻草上。', other: 'straws' },
  { unit: 202510, word: 'stick', kk: '[stɪk]', part: 'n.', def: '樹枝; 木條', sentence: 'The dog is chewing on a stick.', senTrans: '狗正在咬一根樹枝。', other: 'sticks' },
  { unit: 202510, word: 'brick', kk: '[brɪk]', part: 'n.', def: '磚塊', sentence: 'These bricks are heavy.', senTrans: '這些磚塊很重。', other: 'bricks' },
  { unit: 202510, word: 'hair', kk: '[hɛr]', part: 'n.', def: '毛髮; 頭髮', sentence: 'What color is his hair?', senTrans: '他的頭髮是什麼顏色？', other: '' },
  { unit: 202510, word: 'chin', kk: '[tʃɪn]', part: 'n.', def: '下巴', sentence: 'You have some food on your chin.', senTrans: '你的下巴上有一些食物。', other: 'chins' },

// Date 23
  { unit: 202510, word: 'knock', kk: '[nɑk]', part: 'v.', def: '敲; 擊', sentence: 'She knocked on the door.', senTrans: '她敲了門。', other: 'knocked / knocking' },
  { unit: 202510, word: 'cry', kk: '[kraɪ]', part: 'v.', def: '叫喊; 哭', sentence: '"Look out!" he cried.', senTrans: '「小心！」他大叫。', other: 'cried / crying' },
  { unit: 202510, word: 'breath', kk: '[brɛθ]', part: 'n.', def: '一口氣; 呼吸', sentence: 'Take a few breaths and relax.', senTrans: '深呼吸幾次並放鬆。', other: 'breaths' },
  { unit: 202510, word: 'pot', kk: '[pɑt]', part: 'n.', def: '鍋; 壺', sentence: 'Is there any water in the pot?', senTrans: '鍋子裡有水嗎？', other: 'pots' },
  { unit: 202510, word: 'wise', kk: '[waɪz]', part: 'adj.', def: '明智的; 有智慧的', sentence: "He listened to the wise woman's advice.", senTrans: '他聽取了那位有智慧的女人的建議。', other: '' },

// Date 24
  { unit: 202510, word: 'recycle', kk: '[riˋsaɪk!]', part: 'v.', def: '回收再利用', sentence: 'George recycled the paper boxes.', senTrans: '喬治回收了紙箱。', other: 'recycled / recycling' },
  { unit: 202510, word: 'waste', kk: '[west]', part: 'n.', def: '廢棄物; 垃圾', sentence: 'Where do we put the food waste?', senTrans: '我們該把廚餘放哪裡？', other: '' },
  { unit: 202510, word: 'machine', kk: '[məˋʃin]', part: 'n.', def: '機器', sentence: 'What does this machine make?', senTrans: '這台機器是做什麼的？', other: 'machines' },
  { unit: 202510, word: 'flat', kk: '[flæt]', part: 'adj.', def: '平的; 平整的', sentence: 'They built a house on flat land.', senTrans: '他們在平坦的土地上蓋了房子。', other: '' },
  { unit: 202510, word: 'print', kk: '[prɪnt]', part: 'v.', def: '印刷; 列印', sentence: 'She printed her report.', senTrans: '她列印了她的報告。', other: 'printed / printing' },
  { unit: 202510, word: 'metal', kk: '[ˋmɛt!]', part: 'n.', def: '金屬', sentence: 'He sat on the metal chair.', senTrans: '他坐在金屬椅子上。', other: '' },

// Date 27
  { unit: 202510, word: 'soccer', kk: '[ˋsɑkɚ]', part: 'n.', def: '(英式)足球', sentence: 'I play soccer every weekend.', senTrans: '我每個週末踢足球。', other: '' },
  { unit: 202510, word: 'adult', kk: '[əˋdʌlt]', part: 'n.', def: '成年人; 大人', sentence: 'One adult can come with each child.', senTrans: '每位兒童可由一位成人陪同。', other: 'adults' },
  { unit: 202510, word: 'yard', kk: '[jɑrd]', part: 'n.', def: '操場; 庭院', sentence: "Let's play ball in the yard.", senTrans: '我們在院子裡打球吧。', other: 'yards' },
  { unit: 202510, word: 'player', kk: '[ˋpleɚ]', part: 'n.', def: '球員; 選手', sentence: 'How many players are on a team?', senTrans: '一隊有多少球員？', other: 'players' },
  { unit: 202510, word: 'score', kk: '[skɔr]', part: 'v.', def: '得分(比賽中)', sentence: 'Jeff scores goals all the time.', senTrans: '傑夫總是在進球得分。', other: 'scored / scoring' },

// Date 28
  { unit: 202510, word: 'football', kk: '[ˋfʊt͵bɔl]', part: 'n.', def: '足球(美式)', sentence: 'Football is a fun game to watch.', senTrans: '美式足球是個觀賞起來很有趣的比賽。', other: '' },
  { unit: 202510, word: 'shoot', kk: '[ʃut]', part: 'v.', def: '射(門)', sentence: 'Shoot the ball at the goal!', senTrans: '向球門射球！', other: 'shot / shooting' },
  { unit: 202510, word: 'crazy', kk: '[ˋkrezɪ]', part: 'adj.', def: '狂熱的; 著迷的', sentence: 'K-pop fans can be crazy.', senTrans: '韓流粉絲可能會很瘋狂。', other: '' },
  { unit: 202510, word: 'wave', kk: '[wev]', part: 'v.', def: '揮動; 揮手', sentence: 'Everyone in the crowd is waving a flag.', senTrans: '人群中的每個人都在揮舞旗幟。', other: 'waved / waving' },
  { unit: 202510, word: 'scarf', kk: '[skɑrf]', part: 'n.', def: '圍巾', sentence: 'She is wearing a pretty scarf.', senTrans: '她圍著一條漂亮的圍巾。', other: 'scarves' },

// Date 29
  { unit: 202510, word: 'daily', kk: '[ˋdelɪ]', part: 'adj.', def: '日常的; 每天的', sentence: 'He goes for his daily walk in the park.', senTrans: '他去公園進行日常散步。', other: '' },
  { unit: 202510, word: 'wake up', kk: '[wek ʌp]', part: 'phr v.', def: '醒來; 起床', sentence: "Wake up! It's time for school!", senTrans: '起床！上學時間到了！', other: 'woke up' },
  { unit: 202510, word: 'alarm', kk: '[əˋlɑrm]', part: 'n.', def: '鬧鐘', sentence: 'What time will the alarm ring?', senTrans: '鬧鐘幾點會響？', other: 'alarms' },
  { unit: 202510, word: 'screen', kk: '[skrin]', part: 'n.', def: '螢幕', sentence: 'I need to clean my phone screen.', senTrans: '我需要清潔我的手機螢幕。', other: 'screens' },
  { unit: 202510, word: 'die', kk: '[daɪ]', part: 'v.', def: '死亡; (電池)沒電', sentence: 'Plants will die without water.', senTrans: '沒有水植物會死。', other: 'died / dying' },

// Date 30
  { unit: 202510, word: 'spend', kk: '[spɛnd]', part: 'v.', def: '花費(時間、金錢)', sentence: 'Jack spends a lot of time reading.', senTrans: '傑克花很多時間閱讀。', other: 'spent / spending' },
  { unit: 202510, word: 'habit', kk: '[ˋhæbɪt]', part: 'n.', def: '習慣', sentence: 'Eating too much is a bad habit.', senTrans: '吃太多是個壞習慣。', other: 'habits' },
  { unit: 202510, word: 'set', kk: '[sɛt]', part: 'v.', def: '設定', sentence: 'Did you set a timer?', senTrans: '你有設定計時器嗎？', other: 'set / setting' },
  { unit: 202510, word: 'limit', kk: '[ˋlɪmɪt]', part: 'n.', def: '限制; 限度', sentence: 'The test had a time limit of one hour.', senTrans: '考試有一小時的時間限制。', other: 'limits' },
  { unit: 202510, word: 'appreciate', kk: '[əˋpriʃɪ͵et]', part: 'v.', def: '感謝; 欣賞', sentence: 'I appreciate your help.', senTrans: '我感謝你的幫忙。', other: 'appreciated / appreciating' },

// Date 31
  { unit: 202510, word: 'trouble', kk: '[ˋtrʌb!]', part: 'n.', def: '困難; 麻煩', sentence: "I'm having trouble thinking right now.", senTrans: '我現在無法思考。', other: 'troubles' },
  { unit: 202510, word: 'solve', kk: '[sɑlv]', part: 'v.', def: '解決', sentence: 'Help me solve this problem.', senTrans: '幫我解決這個問題。', other: 'solved / solving' },
  { unit: 202510, word: 'exciting', kk: '[ɪkˋsaɪtɪŋ]', part: 'adj.', def: '令人興奮的', sentence: 'Was the movie exciting?', senTrans: '這部電影精彩嗎？', other: '' },
  { unit: 202510, word: 'improve', kk: '[ɪmˋpruv]', part: 'v.', def: '進步; 改善', sentence: 'I want my English to improve.', senTrans: '我想要我的英文進步。', other: 'improved / improving' },
  { unit: 202510, word: 'adventure', kk: '[ədˋvɛntʃɚ]', part: 'n.', def: '激動人心的經歷; 冒險', sentence: "Let's go on an adventure!", senTrans: '我們去冒險吧！', other: 'adventures' },

// --- Unit 202511 (November) ---
// Date 3
  { unit: 202511, word: 'meter', kk: '[ˋmitɚ]', part: 'n.', def: '公尺', sentence: 'Josh is two meters tall.', senTrans: '喬許有兩公尺高。', other: 'meters' },
  { unit: 202511, word: 'idea', kk: '[aɪˋdiə]', part: 'n.', def: '想法; 主意', sentence: 'Tim has a great idea for the trip.', senTrans: '提姆對這次旅行有個很棒的點子。', other: 'ideas' },
  { unit: 202511, word: 'face', kk: '[fes]', part: 'v.', def: '面對', sentence: 'Turn and face the class.', senTrans: '轉過身面對班級。', other: 'faced / facing' },
  { unit: 202511, word: 'exit', kk: '[ˋɛgzɪt]', part: 'n.', def: '出口', sentence: "Where's the exit?", senTrans: '出口在哪裡？', other: 'exits' },
  { unit: 202511, word: 'menu', kk: '[ˋmɛnju]', part: 'n.', def: '菜單', sentence: 'What drinks are on the menu?', senTrans: '菜單上有什麼飲料？', other: 'menus' },

// Date 4
  { unit: 202511, word: 'apartment', kk: '[əˋpɑrtmənt]', part: 'n.', def: '公寓', sentence: 'Tom lives in a small apartment.', senTrans: '湯姆住在一間小公寓裡。', other: 'apartments' },
  { unit: 202511, word: 'couple', kk: '[ˋkʌp!]', part: 'n.', def: '幾個; 一對', sentence: 'We waited a couple of hours.', senTrans: '我們等了幾個小時。', other: 'couples' },
  { unit: 202511, word: 'high', kk: '[haɪ]', part: 'adj.', def: '高的', sentence: 'The mountain is very high.', senTrans: '這座山非常高。', other: 'higher' },
  { unit: 202511, word: 'elevator', kk: '[ˋɛlə͵vetɚ]', part: 'n.', def: '電梯', sentence: 'Take the elevator to the 20th floor.', senTrans: '搭電梯到20樓。', other: 'elevators' },
  { unit: 202511, word: 'explore', kk: '[ɪkˋsplɔr]', part: 'v.', def: '探索', sentence: "Let's explore this park.", senTrans: '我們來探索這個公園吧。', other: 'explored / exploring' },

// Date 5
  { unit: 202511, word: 'wife', kk: '[waɪf]', part: 'n.', def: '太太; 妻子', sentence: 'Where are your wife and kids?', senTrans: '你的太太和孩子在哪裡？', other: 'wives' },
  { unit: 202511, word: 'terrific', kk: '[təˋrɪfɪk]', part: 'adj.', def: '極好的', sentence: 'What a terrific idea!', senTrans: '真是個極好的點子！', other: '' },
  { unit: 202511, word: 'run out of', kk: '[rʌn aʊt əv]', part: 'idiom', def: '用完', sentence: 'The restaurant ran out of food.', senTrans: '餐廳的食物用完了。', other: 'ran out of' },
  { unit: 202511, word: 'expect', kk: '[ɪkˋspɛkt]', part: 'v.', def: '期待; 預期', sentence: 'What are you expecting today?', senTrans: '你今天有什麼期待？', other: 'expected / expecting' },
  { unit: 202511, word: 'row', kk: '[ro]', part: 'v.', def: '划(船)', sentence: 'Can you row a boat?', senTrans: '你會划船嗎？', other: 'rowed / rowing' },

// Date 6
  { unit: 202511, word: 'owl', kk: '[aʊl]', part: 'n.', def: '貓頭鷹', sentence: 'Owls are beautiful birds.', senTrans: '貓頭鷹是美麗的鳥類。', other: 'owls' },
  { unit: 202511, word: 'custom', kk: '[ˋkʌstəm]', part: 'n.', def: '習俗', sentence: 'This country has interesting customs.', senTrans: '這個國家有有趣的習俗。', other: 'customs' },
  { unit: 202511, word: 'active', kk: '[ˋæktɪv]', part: 'adj.', def: '活躍的', sentence: 'Her children are very active.', senTrans: '她的孩子們非常活躍。', other: '' },
  { unit: 202511, word: 'hunter', kk: '[ˋhʌntɚ]', part: 'n.', def: '獵人', sentence: 'Her cat is a great hunter of mice.', senTrans: '她的貓是個捕鼠高手。', other: 'hunters' },
  { unit: 202511, word: 'style', kk: '[staɪl]', part: 'n.', def: '風格', sentence: 'What style of music is this?', senTrans: '這是什麼風格的音樂？', other: 'styles' },

// Date 7
  { unit: 202511, word: 'drawing', kk: '[ˋdrɔɪŋ]', part: 'n.', def: '圖畫', sentence: 'What is this drawing of?', senTrans: '這是畫什麼？', other: 'drawings' },
  { unit: 202511, word: 'thankful', kk: '[ˋθæŋkfəl]', part: 'adj.', def: '感謝的; 感恩的', sentence: "I'm thankful for my friends and family.", senTrans: '我感謝我的朋友和家人。', other: '' },
  { unit: 202511, word: 'eye', kk: '[aɪ]', part: 'n.', def: '眼睛', sentence: 'Sylvia has beautiful blue eyes.', senTrans: '西爾維亞有美麗的藍眼睛。', other: 'eyes' },
  { unit: 202511, word: 'serious', kk: '[ˋsɪrɪəs]', part: 'adj.', def: '嚴肅的', sentence: 'Our teacher is very serious today.', senTrans: '我們老師今天很嚴肅。', other: '' },
  { unit: 202511, word: 'member', kk: '[ˋmɛmbɚ]', part: 'n.', def: '成員; 會員', sentence: 'Rick is a new team member.', senTrans: '瑞克是新團隊成員。', other: 'members' },

// Date 10
  { unit: 202511, word: 'cabbage', kk: '[ˋkæbɪdʒ]', part: 'n.', def: '高麗菜; 捲心菜', sentence: 'This cabbage is delicious.', senTrans: '這高麗菜很好吃。', other: '' },
  { unit: 202511, word: 'lettuce', kk: '[ˋlɛtəs]', part: 'n.', def: '生菜; 萵苣', sentence: 'I like lettuce in salads.', senTrans: '我喜歡沙拉裡的生菜。', other: '' },
  { unit: 202511, word: 'onion', kk: '[ˋʌnjən]', part: 'n.', def: '洋蔥', sentence: 'Do you eat raw onions?', senTrans: '你吃生洋蔥嗎？', other: 'onions' },
  { unit: 202511, word: 'green bean', kk: '[grin bin]', part: 'n.', def: '四季豆; 青豆', sentence: 'Mom is cooking green beans for dinner.', senTrans: '媽媽正在煮四季豆當晚餐。', other: 'green beans' },
  { unit: 202511, word: 'corn', kk: '[kɔrn]', part: 'n.', def: '玉米', sentence: 'Corn is her favorite vegetable.', senTrans: '玉米是她最喜歡的蔬菜。', other: '' },

// Date 11
  { unit: 202511, word: 'spinach', kk: '[ˋspɪnɪtʃ]', part: 'n.', def: '菠菜', sentence: 'Put some spinach in the salad.', senTrans: '在沙拉裡放些菠菜。', other: '' },
  { unit: 202511, word: 'pin', kk: '[pɪn]', part: 'n.', def: '插銷; 別針', sentence: "I can't find the pin.", senTrans: '我找不到別針。', other: 'pins' },
  { unit: 202511, word: 'broccoli', kk: '[ˋbrɑkəlɪ]', part: 'n.', def: '綠花椰菜', sentence: 'Broccoli is easy to cook.', senTrans: '綠花椰菜很容易煮。', other: '' },
  { unit: 202511, word: 'base', kk: '[bes]', part: 'n.', def: '底部', sentence: 'She is sitting at the base of the tree.', senTrans: '她正坐在樹的底部。', other: 'bases' },
  { unit: 202511, word: 'squash', kk: '[skwɑʃ]', part: 'n.', def: '南瓜類', sentence: 'What kind of squash is this?', senTrans: '這是哪種南瓜？', other: '' },

// Date 12
  { unit: 202511, word: 'finish', kk: '[ˋfɪnɪʃ]', part: 'v.', def: '完成; 結束', sentence: 'They finished all the food.', senTrans: '他們吃完了所有的食物。', other: 'finished / finishing' },
  { unit: 202511, word: 'balcony', kk: '[ˋbælkənɪ]', part: 'n.', def: '陽臺', sentence: 'She looked down at him from the balcony.', senTrans: '她從陽臺往下看著他。', other: 'balconies' },
  { unit: 202511, word: 'bright', kk: '[braɪt]', part: 'adj.', def: '鮮豔的; 明亮的', sentence: 'The sun is very bright today.', senTrans: '今天的太陽很明亮。', other: 'brighter' },
  { unit: 202511, word: 'quiet', kk: '[ˋkwaɪət]', part: 'adj.', def: '安靜的', sentence: "It's quiet because everyone is sleeping.", senTrans: '因為大家都在睡覺，所以很安靜。', other: '' },
  { unit: 202511, word: 'wall', kk: '[wɔl]', part: 'n.', def: '牆壁', sentence: 'There is a painting on the wall.', senTrans: '牆上有一幅畫。', other: 'walls' },

// Date 13
  { unit: 202511, word: 'narrow', kk: '[ˋnæro]', part: 'adj.', def: '狹窄的', sentence: 'This street is very narrow.', senTrans: '這條街非常狹窄。', other: '' },
  { unit: 202511, word: 'worry', kk: '[ˋwɝɪ]', part: 'v.', def: '擔心; 憂慮', sentence: 'She is worrying about her children.', senTrans: '她正在擔心她的孩子們。', other: 'worried / worrying' },
  { unit: 202511, word: 'neighborhood', kk: '[ˋnebɚ͵hʊd]', part: 'n.', def: '鄰里社區', sentence: 'Do you live in this neighborhood?', senTrans: '你住在這個社區嗎？', other: 'neighborhoods' },
  { unit: 202511, word: 'amazing', kk: '[əˋmezɪŋ]', part: 'adj.', def: '令人驚嘆的', sentence: 'We had an amazing time in Japan.', senTrans: '我們在日本度過了令人驚嘆的時光。', other: '' },
  { unit: 202511, word: 'climb', kk: '[klaɪm]', part: 'v.', def: '攀爬', sentence: 'He climbed to the top of the hill.', senTrans: '他爬到了山頂。', other: 'climbed / climbing' },

// Date 14
  { unit: 202511, word: 'clap', kk: '[klæp]', part: 'v.', def: '鼓掌', sentence: 'Everyone clapped for the musicians.', senTrans: '大家為音樂家鼓掌。', other: 'clapped / clapping' },
  { unit: 202511, word: 'sound', kk: '[saʊnd]', part: 'n.', def: '聲音', sentence: "The children didn't make a sound.", senTrans: '孩子們沒有發出一點聲音。', other: 'sounds' },
  { unit: 202511, word: 'dish', kk: '[dɪʃ]', part: 'n.', def: '菜餚', sentence: 'This beef dish is delicious.', senTrans: '這道牛肉料理很好吃。', other: 'dishes' },
  { unit: 202511, word: 'around', kk: '[əˋraʊnd]', part: 'adv.', def: '環繞; 到處', sentence: 'Walk around. Do the shoes feel OK?', senTrans: '四處走走。鞋子感覺還可以嗎？', other: '' },
  { unit: 202511, word: 'rice', kk: '[raɪs]', part: 'n.', def: '米; 飯', sentence: 'She ate rice and vegetables for dinner.', senTrans: '她晚餐吃這飯和蔬菜。', other: '' },

// Date 17
  { unit: 202511, word: 'flower', kk: '[ˋflaʊɚ]', part: 'n.', def: '花', sentence: 'Ellen loves beautiful flowers.', senTrans: '艾倫喜歡美麗的花。', other: 'flowers' },
  { unit: 202511, word: 'poem', kk: '[ˋpoəm]', part: 'n.', def: '詩', sentence: 'I like to read poems.', senTrans: '我喜歡讀詩。', other: 'poems' },
  { unit: 202511, word: 'place', kk: '[ples]', part: 'n.', def: '地方; 場所', sentence: "Let's go to a place with a lot of nature.", senTrans: '我們去一個有很多大自然的地方吧。', other: 'places' },
  { unit: 202511, word: 'darkness', kk: '[ˋdɑrknɪs]', part: 'n.', def: '黑暗', sentence: "He couldn't see in the darkness.", senTrans: '他在黑暗中看不見。', other: '' },
  { unit: 202511, word: 'special', kk: '[ˋspɛʃəl]', part: 'adj.', def: '特別的', sentence: 'You are very special to us.', senTrans: '你對我們來說很特別。', other: '' },

// Date 18
  { unit: 202511, word: 'blanket', kk: '[ˋblæŋkɪt]', part: 'n.', def: '毯子; 毛毯', sentence: 'Is there a blanket on the bed?', senTrans: '床上有毯子嗎？', other: 'blankets' },
  { unit: 202511, word: 'rich', kk: '[rɪtʃ]', part: 'adj.', def: '有錢的; 富有的', sentence: 'Tom is rich. He has lots of money.', senTrans: '湯姆很有錢。他有很多錢。', other: '' },
  { unit: 202511, word: 'treasure', kk: '[ˋtrɛʒɚ]', part: 'n.', def: '金銀財寶; 財富', sentence: 'Where does he keep his treasure?', senTrans: '他把寶藏藏在哪裡？', other: 'treasures' },
  { unit: 202511, word: 'seem', kk: '[sim]', part: 'v.', def: '看來好像; 似乎', sentence: 'You seem very happy today.', senTrans: '你今天似乎很開心。', other: 'seemed / seeming' },
  { unit: 202511, word: 'shine', kk: '[ʃaɪn]', part: 'n.', def: '光彩; 光澤', sentence: 'There is a shine on the new car.', senTrans: '新車上有光澤。', other: '' },

// Date 19
  { unit: 202511, word: 'grab', kk: '[græb]', part: 'v.', def: '抓取', sentence: 'He grabbed his bag and left.', senTrans: '他抓起他的包包就離開了。', other: 'grabbed / grabbing' },
  { unit: 202511, word: 'gift', kk: '[gɪft]', part: 'n.', def: '禮物', sentence: 'This is a gift for you.', senTrans: '這是給你的禮物。', other: 'gifts' },
  { unit: 202511, word: 'yell', kk: '[jɛl]', part: 'v.', def: '叫喊; 吼叫', sentence: "Don't yell at me.", senTrans: '不要對我吼叫。', other: 'yelled / yelling' },
  { unit: 202511, word: 'choose', kk: '[tʃuz]', part: 'v.', def: '選擇; 挑選', sentence: 'Please choose one.', senTrans: '請選擇一個。', other: 'chose / chosen / choosing' },
  { unit: 202511, word: 'easily', kk: '[ˋizəlɪ]', part: 'adv.', def: '容易地', sentence: 'She won the game easily.', senTrans: '她輕鬆地贏了比賽。', other: '' },

// Date 20
  { unit: 202511, word: 'garage', kk: '[gəˋrɑʒ]', part: 'n.', def: '車庫', sentence: 'The car is in the garage.', senTrans: '車子在車庫裡。', other: 'garages' },
  { unit: 202511, word: 'used', kk: '[juzd]', part: 'adj.', def: '用過的; 二手的', sentence: 'He bought a used car.', senTrans: '他買了一輛二手車。', other: '' },
  { unit: 202511, word: 'sell', kk: '[sɛl]', part: 'v.', def: '賣', sentence: 'They want to sell their house.', senTrans: '他們想要賣掉房子。', other: 'sold / selling' },
  { unit: 202511, word: 'package', kk: '[ˋpækɪdʒ]', part: 'n.', def: '包裝(盒、袋、箱)', sentence: 'The package arrived today.', senTrans: '包裹今天到了。', other: 'packages' },
  { unit: 202511, word: 'reuse', kk: '[riˋjuz]', part: 'v.', def: '再用; 重複使用', sentence: 'We should reuse plastic bags.', senTrans: '我們應該重複使用塑膠袋。', other: 'reused / reusing' },

// Date 21
  { unit: 202511, word: 'unfortunately', kk: '[ʌnˋfɔrtʃənɪtlɪ]', part: 'adv.', def: '可惜; 遺憾地', sentence: 'Unfortunately, I cannot go.', senTrans: '很遺憾地，我不能去。', other: '' },
  { unit: 202511, word: 'throw away', kk: '[θro əˋwe]', part: 'phr v.', def: '扔掉; 拋棄', sentence: "Don't throw away that box.", senTrans: '不要扔掉那個箱子。', other: 'threw away / thrown away' },
  { unit: 202511, word: 'account', kk: '[əˋkaʊnt]', part: 'n.', def: '帳戶', sentence: 'I have money in my bank account.', senTrans: '我的銀行帳戶裡有錢。', other: 'accounts' },
  { unit: 202511, word: 'valuable', kk: '[ˋvæljʊəb!]', part: 'adj.', def: '值錢的; 貴重的', sentence: 'This ring is very valuable.', senTrans: '這枚戒指很貴重。', other: '' },
  { unit: 202511, word: 'stay', kk: '[ste]', part: 'v.', def: '留下; 停留', sentence: 'Please stay here.', senTrans: '請留在這裡。', other: 'stayed / staying' },

// Date 24
  { unit: 202511, word: 'information', kk: '[͵ɪnfɚˋmeʃən]', part: 'n.', def: '資訊; 訊息', sentence: 'I need more information.', senTrans: '我需要更多資訊。', other: '' },
  { unit: 202511, word: 'dial', kk: '[ˋdaɪəl]', part: 'v.', def: '打電話; 撥(號)', sentence: 'Dial the number carefully.', senTrans: '小心撥打號碼。', other: 'dialed / dialing' },
  { unit: 202511, word: 'on hold', kk: '[ɑn hold]', part: 'idiom', def: '(在電話上)等待', sentence: 'He put me on hold.', senTrans: '他讓我保留通話(等待)。', other: '' },
  { unit: 202511, word: 'call back', kk: '[kɔl bæk]', part: 'phr v.', def: '回電', sentence: 'I will call you back later.', senTrans: '我稍後會回電給你。', other: 'called back' },
  { unit: 202511, word: 'welcome', kk: '[ˋwɛlkəm]', part: 'adj.', def: '(接受謝意)不客氣', sentence: "You're welcome.", senTrans: '不客氣。', other: '' },

// Date 25
  { unit: 202511, word: 'option', kk: '[ˋɑpʃən]', part: 'n.', def: '選項', sentence: 'You have two options.', senTrans: '你有兩個選項。', other: 'options' },
  { unit: 202511, word: 'address', kk: '[əˋdrɛs]', part: 'n.', def: '地址', sentence: "What is your home address?", senTrans: '你家地址是什麼？', other: 'addresses' },
  { unit: 202511, word: 'bill', kk: '[bɪl]', part: 'n.', def: '帳單', sentence: 'The electricity bill is high.', senTrans: '電費帳單很高。', other: 'bills' },
  { unit: 202511, word: 'appointment', kk: '[əˋpɔɪntmənt]', part: 'n.', def: '預約; (正式的)約會', sentence: 'I have a doctor appointment.', senTrans: '我有預約看醫生。', other: 'appointments' },
  { unit: 202511, word: 'on the line', kk: '[ɑn ðə laɪn]', part: 'idiom', def: '(電話)通話中', sentence: 'Mr. Smith is on the line.', senTrans: '史密斯先生正在線上(通話中)。', other: '' },

// Date 26
  { unit: 202511, word: 'follow', kk: '[ˋfɑlo]', part: 'v.', def: '遵行; 採用; 聽從', sentence: 'Follow the instructions.', senTrans: '遵行指示。', other: 'followed / following' },
  { unit: 202511, word: 'attention', kk: '[əˋtɛnʃən]', part: 'n.', def: '注意; 留心', sentence: 'Pay attention to the teacher.', senTrans: '注意聽老師說。', other: '' },
  { unit: 202511, word: 'explain', kk: '[ɪkˋsplen]', part: 'v.', def: '解釋', sentence: 'Can you explain this rule?', senTrans: '你能解釋這條規則嗎？', other: 'explained / explaining' },
  { unit: 202511, word: 'slide', kk: '[slaɪd]', part: 'n.', def: '投影片; 幻燈片', sentence: 'Look at the next slide.', senTrans: '看下一張投影片。', other: 'slides' },
  { unit: 202511, word: 'add', kk: '[æd]', part: 'v.', def: '添加; 增加', sentence: 'Add some sugar to the tea.', senTrans: '在茶裡加點糖。', other: 'added / adding' },

// Date 27
  { unit: 202511, word: 'flow', kk: '[flo]', part: 'n.', def: '前後連接; 連貫性', sentence: 'The flow of the story is good.', senTrans: '故事的連貫性很好。', other: '' },
  { unit: 202511, word: 'nod', kk: '[nɑd]', part: 'v.', def: '點頭', sentence: 'She nodded her head.', senTrans: '她點了點頭。', other: 'nodded / nodding' },
  { unit: 202511, word: 'phrase', kk: '[frez]', part: 'n.', def: '措辭; 片語', sentence: 'I like that phrase.', senTrans: '我喜歡那個片語。', other: 'phrases' },
  { unit: 202511, word: 'miss', kk: '[mɪs]', part: 'v.', def: '想念; 惦記', sentence: 'I miss my family.', senTrans: '我想念我的家人。', other: 'missed / missing' },
  { unit: 202511, word: 'guide', kk: '[gaɪd]', part: 'v.', def: '引導; 帶領', sentence: 'He guided us through the city.', senTrans: '他帶領我們穿越城市。', other: 'guided / guiding' },

// Date 28
  { unit: 202511, word: 'environment', kk: '[ɪnˋvaɪrənmənt]', part: 'n.', def: '環境; 自然環境', sentence: 'Protecting the environment is important.', senTrans: '保護環境很重要。', other: '' },
  { unit: 202511, word: 'visit', kk: '[ˋvɪzɪt]', part: 'v.', def: '拜訪', sentence: 'I will visit my grandmother.', senTrans: '我會去拜訪我祖母。', other: 'visited / visiting' },
  { unit: 202511, word: 'melt', kk: '[mɛlt]', part: 'v.', def: '熔化; 融化', sentence: 'The ice cream is melting.', senTrans: '冰淇淋正在融化。', other: 'melted / melting' },
  { unit: 202511, word: 'cheap', kk: '[tʃip]', part: 'adj.', def: '便宜的; 低價的', sentence: 'This shirt is very cheap.', senTrans: '這件襯衫很便宜。', other: '' },
  { unit: 202511, word: 'shape', kk: '[ʃep]', part: 'n.', def: '形狀; 外形', sentence: 'The cloud has a funny shape.', senTrans: '那朵雲有個有趣的形狀。', other: 'shapes' },


// Date 1
  { unit: 202512, word: 'movie', kk: '[ˋmuvi]', part: 'n.', def: '電影', sentence: 'Let\'s watch a movie tonight.', senTrans: '我們今晚看電影吧。', other: 'movies' },
  { unit: 202512, word: 'cards', kk: '[kɑrdz]', part: 'n.', def: '紙牌', sentence: 'We can play cards after dinner.', senTrans: '我們晚餐後可以玩紙牌。', other: 'card' },
  { unit: 202512, word: 'puzzle', kk: '[ˋpʌz!]', part: 'n.', def: '拼圖', sentence: 'They are doing a puzzle.', senTrans: '他們正在玩拼圖。', other: 'puzzles' },
  { unit: 202512, word: 'paint', kk: '[pent]', part: 'v.', def: '(用顏料)繪畫', sentence: 'She paints with bright colors.', senTrans: '她用鮮豔的顏色作畫。', other: 'painted / painting' },
  { unit: 202512, word: 'indoor', kk: '[ˋɪn͵dor]', part: 'adj.', def: '室內的', sentence: 'She likes indoor activities.', senTrans: '她喜歡室內活動。', other: '' },

  // Date 2
  { unit: 202512, word: 'snow', kk: '[sno]', part: 'n.', def: '雪', sentence: 'Look at all the beautiful, white snow!', senTrans: '看這些美麗潔白的雪！', other: '' },
  { unit: 202512, word: 'exercise', kk: '[ˋɛksɚ͵saɪz]', part: 'n.', def: '運動;鍛鍊', sentence: 'Running is good exercise.', senTrans: '跑步是很好的運動。', other: 'exercises' },
  { unit: 202512, word: 'bike', kk: '[baɪk]', part: 'n.', def: '腳踏車', sentence: 'Did you ride your bike today?', senTrans: '你今天騎腳踏車了嗎？', other: 'bikes' },
  { unit: 202512, word: 'outdoor', kk: '[ˋaʊt͵dor]', part: 'adj.', def: '戶外的', sentence: 'We played outdoor games.', senTrans: '我們玩戶外遊戲。', other: '' },
  { unit: 202512, word: 'hike', kk: '[haɪk]', part: 'v.', def: '健行', sentence: 'Where do you want to hike?', senTrans: '你想去哪裡健行？', other: 'hiked / hiking' },

  // Date 3
  { unit: 202512, word: 'comfortable', kk: '[ˋkʌmfətəb!]', part: 'adj.', def: '舒適的', sentence: 'This bed is so comfortable!', senTrans: '這張床真舒服！', other: 'more comfortable' },
  { unit: 202512, word: 'directions', kk: '[dəˋrɛkʃənz]', part: 'n.', def: '指引;方向', sentence: 'Please give me directions to your house.', senTrans: '請給我去你家的指引。', other: 'direction' },
  { unit: 202512, word: 'excited', kk: '[ɪkˋsaɪtɪd]', part: 'adj.', def: '興奮的', sentence: 'Josh is excited to visit his friend.', senTrans: '喬許很興奮要去拜訪他的朋友。', other: 'more excited' },
  { unit: 202512, word: 'mountain', kk: '[ˋmaʊntən]', part: 'n.', def: '山', sentence: 'Ed lives in the mountains.', senTrans: '艾德住在山裡。', other: 'mountains' },
  { unit: 202512, word: 'forest', kk: '[ˋfɔrɪst]', part: 'n.', def: '森林', sentence: 'We almost got lost in the forest.', senTrans: '我們差點在森林裡迷路。', other: 'forests' },

  // Date 4
  { unit: 202512, word: 'secret', kk: '[ˋsikrɪt]', part: 'adj.', def: '秘密的', sentence: 'Do you know about the secret room?', senTrans: '你知道那個密室嗎？', other: 'secrets' },
  { unit: 202512, word: 'easy', kk: '[ˋizi]', part: 'adj.', def: '簡單的', sentence: 'Is the homework easy?', senTrans: '家庭作業簡單嗎？', other: 'easier / easiest' },
  { unit: 202512, word: 'share', kk: '[ʃɛr]', part: 'v.', def: '分享', sentence: 'You can share this candy with me.', senTrans: '你可以跟我分享這顆糖果。', other: 'shared / sharing' },
  { unit: 202512, word: 'during', kk: '[ˋdjʊrɪŋ]', part: 'prep.', def: '在…期間', sentence: 'What did you do during the meeting?', senTrans: '你在會議期間做了什麼？', other: '' },
  { unit: 202512, word: 'holiday', kk: '[ˋhɑlə͵de]', part: 'n.', def: '假期', sentence: 'How was your holiday?', senTrans: '你的假期過得如何？', other: 'holidays' },

  // Date 5
  { unit: 202512, word: 'mug', kk: '[mʌg]', part: 'n.', def: '馬克杯', sentence: 'Put some coffee in my mug.', senTrans: '倒點咖啡在我的馬克杯裡。', other: 'mugs' },
  { unit: 202512, word: 'steal', kk: '[stil]', part: 'v.', def: '偷', sentence: 'Who stole the money?', senTrans: '誰偷了錢？', other: 'stole / stolen / stealing' },
  { unit: 202512, word: 'another', kk: '[əˋnʌðɚ]', part: 'adj.', def: '另一個的', sentence: 'Let\'s ask another person.', senTrans: '我們問另一個人吧。', other: '' },
  { unit: 202512, word: 'right', kk: '[raɪt]', part: 'adj.', def: '正確的;右邊', sentence: 'Is that the right answer?', senTrans: '那是正確答案嗎？', other: '' },
  { unit: 202512, word: 'notebook', kk: '[ˋnot͵bʊk]', part: 'n.', def: '筆記本', sentence: 'He wrote his name in his notebook.', senTrans: '他在筆記本上寫下他的名字。', other: 'notebooks' },

  // Date 8
  { unit: 202512, word: 'party', kk: '[ˋpɑrtɪ]', part: 'n.', def: '派對', sentence: 'Let\'s plan a party for her!', senTrans: '我們為她計畫一個派對吧！', other: 'parties' },
  { unit: 202512, word: 'chocolate chip', kk: '[ˋtʃɑkəlɪt tʃɪp]', part: 'n.', def: '巧克力豆', sentence: 'The kids are eating chocolate chips.', senTrans: '孩子們正在吃巧克力豆。', other: 'chocolate chips' },
  { unit: 202512, word: 'peanut butter', kk: '[ˋpinʌt ˋbʌtɚ]', part: 'n.', def: '花生醬', sentence: 'I like peanut butter and apples.', senTrans: '我喜歡花生醬配蘋果。', other: '' },
  { unit: 202512, word: 'sugar', kk: '[ˋʃʊgɚ]', part: 'n.', def: '糖', sentence: 'Don\'t eat too much sugar.', senTrans: '不要吃太多糖。', other: '' },
  { unit: 202512, word: 'kind', kk: '[kaɪnd]', part: 'n.', def: '種類', sentence: 'What kind of pie do you like?', senTrans: '你喜歡哪種派？', other: 'kinds' },

  // Date 9
  { unit: 202512, word: 'homemade', kk: '[ˋhomˋmed]', part: 'adj.', def: '自製的', sentence: 'Do you want some homemade bread?', senTrans: '你想要一些自製麵包嗎？', other: '' },
  { unit: 202512, word: 'raisin', kk: '[ˋrezən]', part: 'n.', def: '葡萄乾', sentence: 'I put raisins in my oatmeal.', senTrans: '我把葡萄乾放進麥片粥裡。', other: 'raisins' },
  { unit: 202512, word: 'flour', kk: '[flaʊr]', part: 'n.', def: '麵粉', sentence: 'How much flour do you need?', senTrans: '你需要多少麵粉？', other: '' },
  { unit: 202512, word: 'roll', kk: '[rol]', part: 'v.', def: '滾搓;滾動', sentence: 'She rolled the clay into a smooth ball.', senTrans: '她把黏土搓成一個光滑的球。', other: 'rolled / rolling' },
  { unit: 202512, word: 'dough', kk: '[do]', part: 'n.', def: '麵團', sentence: 'Do you like to eat cookie dough?', senTrans: '你喜歡吃餅乾麵團嗎？', other: '' },

  // Date 10
  { unit: 202512, word: 'village', kk: '[ˋvɪlɪdʒ]', part: 'n.', def: '村莊', sentence: 'Only 100 people live in the village.', senTrans: '只有100人住在這個村莊。', other: 'villages' },
  { unit: 202512, word: 'cross', kk: '[krɔs]', part: 'v.', def: '穿越;越過', sentence: 'Let\'s cross the street here.', senTrans: '我們從這裡過馬路吧。', other: 'crossed / crossing' },
  { unit: 202512, word: 'through', kk: '[θru]', part: 'prep.', def: '穿過', sentence: 'The kids walked through the park.', senTrans: '孩子們穿過公園。', other: '' },
  { unit: 202512, word: 'else', kk: '[ɛls]', part: 'adv.', def: '其他;另外', sentence: 'What else did you see in the park?', senTrans: '你在公園還看到了什麼？', other: '' },
  { unit: 202512, word: 'capture', kk: '[ˋkæptʃɚ]', part: 'v.', def: '拍攝;捕獲', sentence: 'Her photos captured nature\'s beauty.', senTrans: '她的照片捕捉了大自然的美。', other: 'captured / capturing' },

  // Date 11
  { unit: 202512, word: 'market', kk: '[ˋmɑrkɪt]', part: 'n.', def: '市場', sentence: 'She bought apples at the market.', senTrans: '她在市場買了蘋果。', other: 'markets' },
  { unit: 202512, word: 'hall', kk: '[hɔl]', part: 'n.', def: '大廳;會堂', sentence: 'We had a meeting in the town hall.', senTrans: '我們在市政廳開會。', other: 'halls' },
  { unit: 202512, word: 'fish', kk: '[fɪʃ]', part: 'n.', def: '魚', sentence: 'Let\'s have fish for dinner.', senTrans: '我們晚餐吃魚吧。', other: 'fish' },
  { unit: 202512, word: 'library', kk: '[ˋlaɪ͵brɛrɪ]', part: 'n.', def: '圖書館', sentence: 'He got some books from the library.', senTrans: '他從圖書館借了一些書。', other: 'libraries' },
  { unit: 202512, word: 'public', kk: '[ˋpʌblɪk]', part: 'adj.', def: '公共的', sentence: 'We should keep public places clean.', senTrans: '我們應該保持公共場所清潔。', other: '' },

  // Date 12
  { unit: 202512, word: 'lake', kk: '[lek]', part: 'n.', def: '湖', sentence: 'It\'s too cold to swim in the lake.', senTrans: '天氣太冷，不能在湖裡游泳。', other: 'lakes' },
  { unit: 202512, word: 'north', kk: '[nɔrθ]', part: 'adv.', def: '向北', sentence: 'The birds flew north in the spring.', senTrans: '鳥兒在春天向北飛。', other: '' },
  { unit: 202512, word: 'balloon', kk: '[bəˋlun]', part: 'n.', def: '氣球', sentence: 'Did you get balloons for the party?', senTrans: '你有為派對準備氣球嗎？', other: 'balloons' },
  { unit: 202512, word: 'sweat', kk: '[swɛt]', part: 'v.', def: '流汗', sentence: 'Everyone sweated in the hot sun.', senTrans: '大家在烈日下都流汗了。', other: 'sweated / sweating' },
  { unit: 202512, word: 'education', kk: '[͵ɛdʒʊˋkeʃən]', part: 'n.', def: '教育', sentence: 'Everyone needs a good education.', senTrans: '每個人都需要良好的教育。', other: '' },

  // Date 15
  { unit: 202512, word: 'salt', kk: '[sɔlt]', part: 'n.', def: '鹽', sentence: 'Where\'s the salt?', senTrans: '鹽在哪裡？', other: '' },
  { unit: 202512, word: 'honey', kk: '[ˋhʌnɪ]', part: 'n.', def: '蜂蜜', sentence: 'Bees make honey.', senTrans: '蜜蜂製造蜂蜜。', other: '' },
  { unit: 202512, word: 'chill', kk: '[tʃɪl]', part: 'v.', def: '使變冷', sentence: 'Can you chill the water bottles?', senTrans: '你能把水瓶冰鎮一下嗎？', other: 'chilled / chilling' },
  { unit: 202512, word: 'shape', kk: '[ʃep]', part: 'v.', def: '使成形', sentence: 'Shape the rice into balls.', senTrans: '把飯捏成球狀。', other: 'shaped / shaping' },
  { unit: 202512, word: 'step', kk: '[stɛp]', part: 'n.', def: '步驟', sentence: 'You need to follow six steps.', senTrans: '你需要遵循六個步驟。', other: 'steps' },

  // Date 16
  { unit: 202512, word: 'complain', kk: '[kəmˋplen]', part: 'v.', def: '抱怨', sentence: 'They\'re complaining about the noise.', senTrans: '他們正在抱怨噪音。', other: 'complained / complaining' },
  { unit: 202512, word: 'think', kk: '[θɪŋk]', part: 'v.', def: '思考;想', sentence: 'What are you thinking about?', senTrans: '你在想什麼？', other: 'thought / thinking' },
  { unit: 202512, word: 'lonely', kk: '[ˋlonlɪ]', part: 'adj.', def: '寂寞的', sentence: 'My grandma gets lonely sometimes.', senTrans: '我奶奶有時會感到寂寞。', other: '' },
  { unit: 202512, word: 'roommate', kk: '[ˋrum͵met]', part: 'n.', def: '室友', sentence: 'She lives with two roommates.', senTrans: '她和兩位室友住在一起。', other: 'roommates' },
  { unit: 202512, word: 'divide', kk: '[dəˋvaɪd]', part: 'v.', def: '分攤;分享', sentence: 'Let\'s divide the cake between us.', senTrans: '我們來平分蛋糕吧。', other: 'divided / dividing' },

  // Date 17
  { unit: 202512, word: 'wallet', kk: '[ˋwɑlɪt]', part: 'n.', def: '錢包', sentence: 'I have some money in my wallet.', senTrans: '我錢包裡有一些錢。', other: 'wallets' },
  { unit: 202512, word: 'jacket', kk: '[ˋdʒækɪt]', part: 'n.', def: '夾克', sentence: 'It\'s cold. Put on your jacket.', senTrans: '天氣冷。穿上你的夾克。', other: 'jackets' },
  { unit: 202512, word: 'carefully', kk: '[ˋkɛrfəlɪ]', part: 'adv.', def: '仔細地', sentence: 'Did you read the information carefully?', senTrans: '你有仔細閱讀資訊嗎？', other: '' },
  { unit: 202512, word: 'restaurant', kk: '[ˋrɛstərənt]', part: 'n.', def: '餐廳', sentence: 'Let\'s eat at this restaurant.', senTrans: '我們在這家餐廳吃吧。', other: 'restaurants' },
  { unit: 202512, word: 'far', kk: '[fɑr]', part: 'adj.', def: '遠的', sentence: 'Is your house far from your school?', senTrans: '你家離學校遠嗎？', other: '' },

  // Date 18
  { unit: 202512, word: 'sidewalk', kk: '[ˋsaɪd͵wɔk]', part: 'n.', def: '人行道', sentence: 'Please walk on the sidewalk.', senTrans: '請走人行道。', other: 'sidewalks' },
  { unit: 202512, word: 'bunch', kk: '[bʌntʃ]', part: 'n.', def: '串;束', sentence: 'Divide the flowers into bunches.', senTrans: '把花分成幾束。', other: 'bunches' },
  { unit: 202512, word: 'probably', kk: '[ˋprɑbəblɪ]', part: 'adv.', def: '大概', sentence: 'I should probably leave now.', senTrans: '我大概該走了。', other: '' },
  { unit: 202512, word: 'helpful', kk: '[ˋhɛlpfəl]', part: 'adj.', def: '有幫助的', sentence: 'Jim is a helpful person.', senTrans: '吉姆是個樂於助人的人。', other: '' },
  { unit: 202512, word: 'while', kk: '[hwaɪl]', part: 'n.', def: '一會兒', sentence: 'Did you wait a while for her?', senTrans: '你有等她一會兒嗎？', other: '' },

  // Date 19
  { unit: 202512, word: 'Japan', kk: '[dʒəˋpæn]', part: 'n.', def: '日本', sentence: 'When did you last go to Japan?', senTrans: '你上次去日本是什麼時候？', other: '' },
  { unit: 202512, word: 'Japanese', kk: '[͵dʒæpəˋniz]', part: 'n.', def: '日本人', sentence: 'Yuto and Mio are Japanese, right?', senTrans: 'Yuto 和 Mio 是日本人，對吧？', other: '' },
  { unit: 202512, word: 'France', kk: '[fræns]', part: 'n.', def: '法國', sentence: 'Josh is in France right now.', senTrans: '喬許現在在法國。', other: '' },
  { unit: 202512, word: 'French', kk: '[frɛntʃ]', part: 'n.', def: '法國人', sentence: 'My dad is French, and my mom is Chinese.', senTrans: '我爸爸是法國人，我媽媽是中國人。', other: '' },
  { unit: 202512, word: 'England', kk: '[ˋɪŋglənd]', part: 'n.', def: '英國', sentence: 'Where will you go in England?', senTrans: '你去英國會去哪裡？', other: '' },
  { unit: 202512, word: 'America', kk: '[əˋmɛrɪkə]', part: 'n.', def: '美國', sentence: 'Where do you live in America?', senTrans: '你住在美國哪裡？', other: '' },

  // Date 22
  { unit: 202512, word: 'deer', kk: '[dɪr]', part: 'n.', def: '鹿', sentence: 'My dad has deer in his yard.', senTrans: '我爸爸的院子裡有鹿。', other: 'deer' },
  { unit: 202512, word: 'gentle', kk: '[ˋdʒɛnt!]', part: 'adj.', def: '溫和的', sentence: 'Be gentle with the baby.', senTrans: '對寶寶溫柔一點。', other: '' },
  { unit: 202512, word: 'get away', kk: '[gɛt əˋwe]', part: 'phr v.', def: '逃脫', sentence: 'Can the cat get away from the dog?', senTrans: '貓能逃離狗嗎？', other: 'got away' },
  { unit: 202512, word: 'danger', kk: '[ˋdendʒɚ]', part: 'n.', def: '危險', sentence: 'Fire can be a big danger.', senTrans: '火可能是一個大危險。', other: 'dangers' },
  { unit: 202512, word: 'smell', kk: '[smɛl]', part: 'v.', def: '聞;嗅出', sentence: 'Can you smell the flowers?', senTrans: '你聞得到花香嗎？', other: 'smelled / smelling' },

  // Date 23
  { unit: 202512, word: 'picture', kk: '[ˋpɪktʃɚ]', part: 'n.', def: '照片', sentence: 'This is a good picture of you.', senTrans: '這張你的照片拍得很好。', other: 'pictures' },
  { unit: 202512, word: 'wild', kk: '[waɪld]', part: 'adj.', def: '野生的', sentence: 'Let\'s watch for wild animals.', senTrans: '我們來觀察野生動物吧。', other: '' },
  { unit: 202512, word: 'feed', kk: '[fid]', part: 'v.', def: '餵食', sentence: 'Did you feed the dog yet?', senTrans: '你餵狗了嗎？', other: 'fed / feeding' },
  { unit: 202512, word: 'believe', kk: '[bəˋliv]', part: 'v.', def: '相信', sentence: 'Do you believe her story?', senTrans: '你相信她的故事嗎？', other: 'believed / believing' },
  { unit: 202512, word: 'such', kk: '[sʌtʃ]', part: 'adv.', def: '如此', sentence: 'It\'s such a nice day.', senTrans: '今天天氣真好。', other: '' },

  // Date 24
  { unit: 202512, word: 'bucket', kk: '[ˋbʌkɪt]', part: 'n.', def: '提桶', sentence: 'Steve put water in the bucket.', senTrans: '史蒂夫把水放進桶子裡。', other: 'buckets' },
  { unit: 202512, word: 'dig', kk: '[dɪg]', part: 'v.', def: '挖', sentence: 'The dog is digging in the garden.', senTrans: '那隻狗正在花園裡挖洞。', other: 'dug / digging' },
  { unit: 202512, word: 'corner', kk: '[ˋkɔrnɚ]', part: 'n.', def: '角落', sentence: 'The cat is hiding in the corner.', senTrans: '貓正躲在角落裡。', other: 'corners' },
  { unit: 202512, word: 'candle', kk: '[ˋkænd!]', part: 'n.', def: '蠟燭', sentence: 'She put twelve candles on the cake.', senTrans: '她在蛋糕上放了十二支蠟燭。', other: 'candles' },
  { unit: 202512, word: 'eve', kk: '[iv]', part: 'n.', def: '前夕', sentence: 'They went to church on Christmas Eve.', senTrans: '他們在聖誕夜去了教堂。', other: '' },

  // Date 25
  { unit: 202512, word: 'spider', kk: '[ˋspaɪdɚ]', part: 'n.', def: '蜘蛛', sentence: 'Spiders have eight legs.', senTrans: '蜘蛛有八隻腳。', other: 'spiders' },
  { unit: 202512, word: 'living room', kk: '[ˋlɪvɪŋ rum]', part: 'n.', def: '客廳', sentence: 'Ed is taking a nap in the living room.', senTrans: '艾德正在客廳小睡。', other: 'living rooms' },
  { unit: 202512, word: 'branch', kk: '[bræntʃ]', part: 'n.', def: '樹枝', sentence: 'A bird sat on the tree branch.', senTrans: '一隻鳥停在樹枝上。', other: 'branches' },
  { unit: 202512, word: 'sunlight', kk: '[ˋsʌn͵laɪt]', part: 'n.', def: '陽光', sentence: 'The sunlight is very bright.', senTrans: '陽光非常耀眼。', other: '' },
  { unit: 202512, word: 'silver', kk: '[ˋsɪlvɚ]', part: 'n.', def: '銀子;銀色', sentence: 'He sold his silver to buy a house.', senTrans: '他賣掉他的銀子來買房。', other: '' },

  // Date 26
  { unit: 202512, word: 'wood', kk: '[wʊd]', part: 'n.', def: '木頭', sentence: 'Is this table made of wood?', senTrans: '這張桌子是木頭做的嗎？', other: '' },
  { unit: 202512, word: 'joy', kk: '[dʒɔɪ]', part: 'n.', def: '樂趣', sentence: 'He answered her with joy.', senTrans: '他高興地回答她。', other: '' },
  { unit: 202512, word: 'project', kk: '[ˋprɑdʒɛkt]', part: 'n.', def: '項目;方案', sentence: 'What project are you working on?', senTrans: '你正在做什麼專案？', other: 'projects' },
  { unit: 202512, word: 'fee', kk: '[fi]', part: 'n.', def: '費用', sentence: 'They paid a fee to enter the park.', senTrans: '他們付了費進入公園。', other: 'fees' },
  { unit: 202512, word: 'patient', kk: '[ˋpeʃənt]', part: 'adj.', def: '耐心的', sentence: 'Jenny is a very patient person.', senTrans: '珍妮是個很有耐心的人。', other: '' },

  // Date 29
  { unit: 202512, word: 'milk', kk: '[mɪlk]', part: 'n.', def: '牛奶', sentence: 'I drink milk every morning.', senTrans: '我每天早上喝牛奶。', other: '' },
  { unit: 202512, word: 'fruit', kk: '[frut]', part: 'n.', def: '水果', sentence: 'Bananas and apples are delicious fruits.', senTrans: '香蕉和蘋果是美味的水果。', other: 'fruits' },
  { unit: 202512, word: 'dairy', kk: '[ˋdɛrɪ]', part: 'n.', def: '乳製品', sentence: 'I can\'t eat dairy.', senTrans: '我不能吃乳製品。', other: '' },
  { unit: 202512, word: 'sport', kk: '[sport]', part: 'n.', def: '運動', sentence: 'Basketball is a fun sport.', senTrans: '籃球是有趣的運動。', other: 'sports' },
  { unit: 202512, word: 'soap', kk: '[sop]', part: 'n.', def: '肥皂', sentence: 'I need soap and shampoo.', senTrans: '我需要肥皂和洗髮精。', other: '' },

  // Date 30
  { unit: 202512, word: 'plan', kk: '[plæn]', part: 'n.', def: '計畫', sentence: 'What are your plans for the weekend?', senTrans: '你週末有什麼計畫？', other: 'plans' },
  { unit: 202512, word: 'travel', kk: '[ˋtræv!]', part: 'v.', def: '旅行', sentence: 'Where do you want to travel?', senTrans: '你想去哪裡旅行？', other: 'traveled / traveling' },
  { unit: 202512, word: 'return', kk: '[rɪˋtɝn]', part: 'v.', def: '返回', sentence: 'When will he return from his trip?', senTrans: '他什麼時候旅行回來？', other: 'returned / returning' },
  { unit: 202512, word: 'save', kk: '[sev]', part: 'v.', def: '存(錢)', sentence: 'Can we save more money this month?', senTrans: '我們這個月能多存點錢嗎？', other: 'saved / saving' },
  { unit: 202512, word: 'goal', kk: '[gol]', part: 'n.', def: '目標', sentence: 'What are your goals for next year?', senTrans: '你明年的目標是什麼？', other: 'goals' },

  // Date 31
  { unit: 202512, word: 'congratulations', kk: '[kən͵grætʃəˋleʃənz]', part: 'interj.', def: '恭喜', sentence: 'You\'re having a baby? Congratulations!', senTrans: '你有寶寶了？恭喜！', other: '' },
  { unit: 202512, word: 'wedding', kk: '[ˋwɛdɪŋ]', part: 'n.', def: '婚禮', sentence: 'When is Sue and Rob\'s wedding?', senTrans: '蘇和羅伯的婚禮是什麼時候？', other: 'weddings' },
  { unit: 202512, word: 'date', kk: '[det]', part: 'n.', def: '日期', sentence: 'What\'s the date of the school event?', senTrans: '學校活動的日期是哪一天？', other: 'dates' },
  { unit: 202512, word: 'consider', kk: '[kənˋsɪdɚ]', part: 'v.', def: '考慮', sentence: 'Will you consider helping me?', senTrans: '你會考慮幫我嗎？', other: 'considered / considering' },
  { unit: 202512, word: 'hire', kk: '[haɪr]', part: 'v.', def: '僱用', sentence: 'She hired Dave to paint her house.', senTrans: '她僱用戴夫來粉刷她的房子。', other: 'hired / hiring' },
];