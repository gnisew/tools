// --- 基礎設定與資料 ---

// EMOJI 列表
const EMOJIS = ["🐶", "🐱", "🐭", "🐹", "🐰", "🦊", "🐻", "🐼", "🐨", "🐯", "🦁", "🐮", "🐷", "🐸", "🐵", "🐔", "🐧", "🐦", "🐤", "🦆", "🦅", "🦉", "🦇", "🐺", "🐗", "🐴", "🦄", "🐝", "🐛", "🦋", "🐌", "🐞", "🐜", "🦟", "🦗", "🕷", "🕸", "🦂", "🐢", "🐍", "🦎", "🦖", "🦕", "🐙", "🦑", "🦐", "🦞", "🦀", "🐡", "🐠", "🐟", "🐬", "🐳", "🐋", "🦈", "🐊", "🐅", "🐆", "🦓", "🦍", "🦧", "🐘", "🦛", "🦏", "🐪", "🐫", "🦒", "🦘", "🐃", "🐂", "🐄", "🐎", "🐖", "🐏", "🐑", "🦙", "🐐", "🦌", "🐕", "🐩", "🦮", "🐕‍🦺", "🐈", "🐈‍⬛", "🐓", "🦃", "🦚", "🦜", "🦢", "🦩", "🕊", "🐇", "🦝", "🦨", "🦡", "🦦", "🦥", "🐁", "🐀", "🐿", "🦔", "🐾", "🐉", "🐲", "⛷", "🏂", "🪂", "🏋️", "🤼", "🤸", "⛹️", "🤺", "🤾", "🏌️", "🏇", "🧘"];

// 故事資料
const STORIES = [
  // Unit 23 Stories
  {
    title: "Unit 23: The Reporter",
    units: [23],
    text: "John is a {reporter}. He had an {interview} with a {popular} singer for a TV {program}. Before the meeting, he watched a {video} of her shows. {Early} in the morning, he had to {pack} his bags. He went to a {hotel} near the city center. He waited at the {corner} for his taxi. He felt a bit {lonely} because he traveled alone, but it was a great {experience}.",
    translations: [
      { text: "John is a reporter.", trans: "約翰是一位記者。" },
      { text: "He had an interview with a popular singer for a TV program.", trans: "他為了一個電視節目採訪一位受歡迎的歌手。" },
      { text: "Before the meeting, he watched a video of her shows.", trans: "在會議之前，他看了她表演的影片。" },
      { text: "Early in the morning, he had to pack his bags.", trans: "一大早，他必須打包他的行李。" },
      { text: "He went to a hotel near the city center.", trans: "他去了市中心附近的一家飯店。" },
      { text: "He waited at the corner for his taxi.", trans: "他在轉角處等計程車。" },
      { text: "He felt a bit lonely because he traveled alone, but it was a great experience.", trans: "他覺得有點寂寞因為他獨自旅行，但這是一個很棒的經驗。" }
    ]
  },
  {
    title: "Unit 23: A Strange Dream",
    units: [23],
    text: "Last night, I had a {dream}. I saw a {lovely} {butterfly} trying to {hide} behind a high {wall}. It wanted to find its friends to be {together}. {However}, a large {machine} appeared and scared it. Only a {fool} would stay there. An {excellent} wizard appeared and {change} the machine into a flower. Then I woke up. It was a {quarter} past six.",
    translations: [
      { text: "Last night, I had a dream.", trans: "昨晚，我做了一個夢。" },
      { text: "I saw a lovely butterfly trying to hide behind a high wall.", trans: "我看見一隻可愛的蝴蝶試圖躲在高牆後。" },
      { text: "It wanted to find its friends to be together.", trans: "它想要找它的朋友聚在一起。" },
      { text: "However, a large machine appeared and scared it.", trans: "然而，一台巨大的機器出現並嚇到了它。" },
      { text: "Only a fool would stay there.", trans: "只有傻瓜才會留在那裡。" },
      { text: "An excellent wizard appeared and changed the machine into a flower.", trans: "一位傑出的巫師出現並將機器變成了花朵。" },
      { text: "Then I woke up. It was a quarter past six.", trans: "然後我醒了。時間是六點十五分。" }
    ]
  },
  {
    title: "Unit 23: School Life",
    units: [23],
    text: "Mary likes to {study} hard. She wants to {pick} a good college. Her {relative} gave her a study planner as a gift. She has {already} finished her homework. Sometimes she needs to {borrow} a pen from me. She wears a {glove} when she rides her bike. She is smart and working hard is her {mine} of gold.",
    translations: [
      { text: "Mary likes to study hard.", trans: "瑪麗喜歡用功讀書。" },
      { text: "She wants to pick a good college.", trans: "她想要挑選一所好大學。" },
      { text: "Her relative gave her a study planner as a gift.", trans: "她的親戚送她一本學習計畫表當作禮物。" },
      { text: "She has already finished her homework.", trans: "她已經完成了她的家庭作業。" },
      { text: "Sometimes she needs to borrow a pen from me.", trans: "有時她需要跟我借一支筆。" },
      { text: "She wears a glove when she rides her bike.", trans: "她騎腳踏車時會戴手套。" },
      { text: "She is smart and working hard is her mine of gold.", trans: "她很聰明，而努力工作是她的金礦。" }
    ]
  },
  // Unit 24 Stories
  {
    title: "Unit 24: Healthy Life",
    units: [24],
    text: "My grandfather is a {wise} man. He told me that {exercise} is important. One {day}, I had a {headache} and a sore {throat}. I went to see a {doctor}. The doctor gave me some {medicine} and told me to rest {until} I felt better. He said it's {convenient} to exercise in the park. Now I sit on a {bench} and eat a {carrot} for a snack.",
    translations: [
      { text: "My grandfather is a wise man.", trans: "我的祖父是個有智慧的人。" },
      { text: "He told me that exercise is important.", trans: "他告訴我運動很重要。" },
      { text: "One day, I had a headache and a sore throat.", trans: "有一天，我頭痛且喉嚨痛。" },
      { text: "I went to see a doctor.", trans: "我去看醫生。" },
      { text: "The doctor gave me some medicine and told me to rest until I felt better.", trans: "醫生給了我一些藥並叫我休息直到感覺好一點。" },
      { text: "He said it's convenient to exercise in the park.", trans: "他說在公園運動很方便。" },
      { text: "Now I sit on a bench and eat a carrot for a snack.", trans: "現在我坐在長椅上吃紅蘿蔔當點心。" }
    ]
  },
  {
    title: "Unit 24: City Living",
    units: [24],
    text: "Lilly lives in a small {town}. She moved into a {comfortable} {apartment} a {month} {ago}. Her neighbor is a {famous} {lawyer}. Sometimes they {share} a taxi to work. It is a {pleasure} to meet nice people. In the {future}, she wants to travel {abroad} and visit a big {museum}. For now, she enjoys her {modern} life here.",
    translations: [
      { text: "Lilly lives in a small town.", trans: "莉莉住在一個小城鎮。" },
      { text: "She moved into a comfortable apartment a month ago.", trans: "她在一個月前搬進一間舒適的公寓。" },
      { text: "Her neighbor is a famous lawyer.", trans: "她的鄰居是一位有名的律師。" },
      { text: "Sometimes they share a taxi to work.", trans: "有時他們共乘計程車去上班。" },
      { text: "It is a pleasure to meet nice people.", trans: "很高興能遇見好人。" },
      { text: "In the future, she wants to travel abroad and visit a big museum.", trans: "未來，她想要出國旅遊並參觀大博物館。" },
      { text: "For now, she enjoys her modern life here.", trans: "目前，她享受她在這裡的現代生活。" }
    ]
  },
  {
    title: "Unit 24: The Festival",
    units: [24],
    text: "Last {year}, we had a big {party} to {celebrate} the winter {festival}. Although there was {thick} {snow} outside, the house was warm. We decided to {invite} all our friends. We prepared {salad} and turkey. We played games and had a great time. We didn't sleep {until} midnight. It was the best day of the year.",
    translations: [
      { text: "Last year, we had a big party to celebrate the winter festival.", trans: "去年，我們舉辦了一個大派對來慶祝冬季節慶。" },
      { text: "Although there was thick snow outside, the house was warm.", trans: "雖然外面有厚厚的雪，屋子裡很溫暖。" },
      { text: "We decided to invite all our friends.", trans: "我們決定邀請所有的朋友。" },
      { text: "We prepared salad and turkey.", trans: "我們準備了沙拉和火雞。" },
      { text: "We played games and had a great time.", trans: "我們玩遊戲且玩得很開心。" },
      { text: "We didn't sleep until midnight.", trans: "我們直到午夜才睡覺。" },
      { text: "It was the best day of the year.", trans: "那是這一年最棒的一天。" }
    ]
  },
  // Unit 25 Stories
  {
    title: "Unit 25: The School Club",
    units: [25],
    text: "I joined the {engineer} {club} at school. We have the {ability} to build robots. One day, we used {string} and {tape} to make a robot arm, but we {fail} {twice}. Our teacher gave us a {dictionary} to {define} some terms and {explain} the problem. He is a nice {guy} and we are {proud} of our work.",
    translations: [
      { text: "I joined the engineer club at school.", trans: "我參加了學校的工程社團。" },
      { text: "We have the ability to build robots.", trans: "我們有能力建造機器人。" },
      { text: "One day, we used string and tape to make a robot arm, but we failed twice.", trans: "有一天，我們用繩子和膠帶製作機械手臂，但我們失敗了兩次。" },
      { text: "Our teacher gave us a dictionary to define some terms and explain the problem.", trans: "我們的老師給我們一本字典來定義一些術語並解釋問題。" },
      { text: "He is a nice guy and we are proud of our work.", trans: "他是個好人，我們為我們的作品感到自豪。" }
    ]
  },
  {
    title: "Unit 25: A Shopping Error",
    units: [25],
    text: "Yesterday, I bought an {item} {online}. I didn't {expect} it to be {wet}. I found a dirty {mark} on the {button}. The {clerk} made an {error}. I wrote a letter, put it in an {envelope}, and went to the post office to {drop} it. I hope they can {repeat} the order correctly this time.",
    translations: [
      { text: "Yesterday, I bought an item online.", trans: "昨天，我在網路上買了一件物品。" },
      { text: "I didn't expect it to be wet.", trans: "我沒料到它是溼的。" },
      { text: "I found a dirty mark on the button.", trans: "我在扣子上發現一個髒汙點。" },
      { text: "The clerk made an error.", trans: "店員犯了一個錯誤。" },
      { text: "I wrote a letter, put it in an envelope, and went to the post office to drop it.", trans: "我寫了一封信，放進信封裡，然後去郵局寄出。" },
      { text: "I hope they can repeat the order correctly this time.", trans: "我希望他們這次能正確地重發訂單。" }
    ]
  },
  {
    title: "Unit 25: The Soldier's Story",
    units: [25],
    text: "The {soldier} wears a green {uniform}. He is an {honest} man. He likes to {collect} old {pin}s. Once, he helped a {blind} man cross the street. He also saw a dog {attack} a cat near the {temple}. He used a {towel} to clean the cat. He is a good {example} for every {teenager}.",
    translations: [
      { text: "The soldier wears a green uniform.", trans: "這個軍人穿著綠色制服。" },
      { text: "He is an honest man.", trans: "他是個誠實的人。" },
      { text: "He likes to collect old pins.", trans: "他喜歡收集舊別針。" },
      { text: "Once, he helped a blind man cross the street.", trans: "有一次，他幫助一位盲人過馬路。" },
      { text: "He also saw a dog attack a cat near the temple.", trans: "他還看見一隻狗在寺廟附近攻擊一隻貓。" },
      { text: "He used a towel to clean the cat.", trans: "他用毛巾擦乾淨那隻貓。" },
      { text: "He is a good example for every teenager.", trans: "他是每個青少年的好榜樣。" }
    ]
  },
  // Unit 26 Stories
  {
    title: "Unit 26: The Countryside Trip",
    units: [26],
    text: "I suggest we {consider} a trip to the {countryside}. The {village} has a beautiful {field} and fresh air. We can stay with a {fisherman} who can {provide} us with fresh fish. He is a {social} person and likes to {share} stories. {Whenever} he is free, he teaches visitors how to {sail}. I {figure} it will be a {better} experience than staying in the city.",
    translations: [
      { text: "I suggest we consider a trip to the countryside.", trans: "我建議我們考慮去鄉下旅行。" },
      { text: "The village has a beautiful field and fresh air.", trans: "那個村莊有美麗的原野和新鮮空氣。" },
      { text: "We can stay with a fisherman who can provide us with fresh fish.", trans: "我們可以住在一位漁夫家，他能提供我們新鮮的魚。" },
      { text: "He is a social person and likes to share stories.", trans: "他是個善於交際的人，喜歡分享故事。" },
      { text: "Whenever he is free, he teaches visitors how to sail.", trans: "每當他有空時，他會教遊客如何航行。" },
      { text: "I figure it will be a better experience than staying in the city.", trans: "我認為這將會比待在城市裡是個更好的體驗。" }
    ]
  },
  {
    title: "Unit 26: A Business Challenge",
    units: [26],
    text: "The {president} of the {company} faced a big {challenge}. Sales began to {increase} but they couldn't {supply} enough goods. He had to make a {firm} decision. He asked his staff to {develop} a new plan. He {regard} every employee as an important {value} to the team. After careful {consideration}, they solved the problem and avoided the {worst} situation.",
    translations: [
      { text: "The president of the company faced a big challenge.", trans: "公司的總裁面臨一個巨大的挑戰。" },
      { text: "Sales began to increase but they couldn't supply enough goods.", trans: "銷售額開始增加，但他們無法供應足夠的貨物。" },
      { text: "He had to make a firm decision.", trans: "他必須做出一個堅定的決定。" },
      { text: "He asked his staff to develop a new plan.", trans: "他要求員工制定一個新計畫。" },
      { text: "He regards every employee as an important value to the team.", trans: "他將每位員工視為團隊的重要資產。" },
      { text: "After careful consideration, they solved the problem and avoided the worst situation.", trans: "經過仔細考慮後，他們解決了問題並避免了最糟的情況。" }
    ]
  },
  {
    title: "Unit 26: The Escape",
    units: [26],
    text: "The prisoner tried to {escape} from jail. He put on a pair of {sock}s and climbed over a {stone} wall. The police had a good {system} to {burn} his plan. They caught him at a {bookstore}. The {effect} of his action was bad. He could no longer enjoy a {soft} bed or eat good food. He had to think about his {thought}s in prison.",
    translations: [
        { text: "The prisoner tried to escape from jail.", trans: "囚犯試圖逃獄。" },
        { text: "He put on a pair of socks and climbed over a stone wall.", trans: "他穿上一雙襪子並爬過石牆。" },
        { text: "The police had a good system to burn his plan.", trans: "警方有一個很好的系統來粉碎他的計畫。" },
        { text: "They caught him at a bookstore.", trans: "他們在一家書店抓到了他。" },
        { text: "The effect of his action was bad.", trans: "他行為的後果很糟。" },
        { text: "He could no longer enjoy a soft bed or eat good food.", trans: "他再也無法享受柔軟的床或吃好吃的食物。" },
        { text: "He had to think about his thoughts in prison.", trans: "他必須在監獄裡反省他的想法。" }
    ]
  },
  // Unit 27 Stories
  {
    title: "Unit 27: The General's Command",
    units: [27],
    text: "The {government} sent the {army} to the {border}. The general had total {control} of the {military}. He gave a {command} to {obey} the law. The soldiers took {pride} in their duty. During this {period}, they faced many {accident}s, but the {result} was good. It was a {super} victory in this {century}.",
    translations: [
      { text: "The government sent the army to the border.", trans: "政府派遣軍隊前往邊境。" },
      { text: "The general had total control of the military.", trans: "將軍完全掌控了軍隊。" },
      { text: "He gave a command to obey the law.", trans: "他下令遵守法律。" },
      { text: "The soldiers took pride in their duty.", trans: "士兵們以他們的職責為榮。" },
      { text: "During this period, they faced many accidents, but the result was good.", trans: "在此期間，他們面臨許多意外，但結果是好的。" },
      { text: "It was a super victory in this century.", trans: "這是本世紀的一場超級勝利。" }
    ]
  },
  {
    title: "Unit 27: School Rules",
    units: [27],
    text: "In this {term}, students must {attend} school every day. The teacher asked us to pay {attention}. She {describe}d the {importance} of not making {waste}. We should pick up {trash} and {garbage}. There is a {difference} {among} being {used} to bad habits and having good ones. Being a good {user} of resources is {necessary}.",
    translations: [
      { text: "In this term, students must attend school every day.", trans: "這學期，學生必須每天上學。" },
      { text: "The teacher asked us to pay attention.", trans: "老師要求我們專心。" },
      { text: "She described the importance of not making waste.", trans: "她描述了不製造浪費的重要性。" },
      { text: "We should pick up trash and garbage.", trans: "我們應該撿起垃圾。" },
      { text: "There is a difference among being used to bad habits and having good ones.", trans: "習慣壞習慣與擁有好習慣之間是有區別的。" },
      { text: "Being a good user of resources is necessary.", trans: "成為良好的資源使用者是必要的。" }
    ]
  },
  {
    title: "Unit 27: The Chess Game",
    units: [27],
    text: "I met a {local} man who likes to play {chess}. He put the {board} on the table. He used a special {method} to {approach} the game. He ate every {bit} of his {supper} while playing. He works in the {production} {department} and helps {produce} cars. He is {such} a smart player. There is a {limit} to his patience though.",
    translations: [
      { text: "I met a local man who likes to play chess.", trans: "我遇見一位喜歡下西洋棋的當地人。" },
      { text: "He put the board on the table.", trans: "他把棋盤放在桌上。" },
      { text: "He used a special method to approach the game.", trans: "他用一種特殊的方法來進行比賽。" },
      { text: "He ate every bit of his supper while playing.", trans: "他邊玩邊把晚餐吃得一乾二淨。" },
      { text: "He works in the production department and helps produce cars.", trans: "他在生產部門工作，幫忙生產汽車。" },
      { text: "He is such a smart player.", trans: "他真是個聰明的玩家。" },
      { text: "There is a limit to his patience though.", trans: "不過他的耐心是有限度的。" }
    ]
  }
];

// 單字資料庫
const VOCAB_DATA = [
  // --- Unit 23 ---
  { id: 1, unit: 23, word: 'during', kk: '[ˋdjʊrɪŋ]', part: 'prep.', def: '在...期間', sentence: 'Wendy ate a lot of popcorn during the movie.', senTrans: '溫蒂在看電影時吃了很多爆米花。', other: '' },
  { id: 2, unit: 23, word: 'medium', kk: '[ˋmidɪəm]', part: 'a.', def: '中等的', sentence: 'Please bring me this T-shirt in a medium size.', senTrans: '請給我這件 T 恤的中號尺寸。', other: '' },
  { id: 3, unit: 23, word: 'together', kk: '[təˋgɛðɚ]', part: 'adv.', def: '一起', sentence: 'Are we going together or separately?', senTrans: '我們要一起去還是分開去？', other: '' },
  { id: 4, unit: 23, word: 'tooth', kk: '[tuθ]', part: 'n.', def: '牙齒', sentence: 'Remember to brush your teeth twice a day.', senTrans: '記得一天要刷兩次牙。', other: 'teeth' },
  { id: 5, unit: 23, word: 'change', kk: '[tʃendʒ]', part: 'v.', def: '改變', sentence: 'Do you think Debbie has changed since she became famous?', senTrans: '你認為黛比自從成名後，是否改變了？', other: 'changed / changing' },
  { id: 6, unit: 23, word: 'popular', kk: '[ˋpɑpjələ]', part: 'a.', def: '流行的；受歡迎的', sentence: 'Rap and R&B are popular with young people.', senTrans: '饒舌歌和 R&B 受年輕人的歡迎。', other: '' },
  { id: 7, unit: 23, word: 'relative', kk: '[ˋrɛlətɪv]', part: 'a.', def: '相對的', sentence: 'These facts are relative to the case.', senTrans: '這些事實和本案有關。', other: '' },
  { id: 8, unit: 23, word: 'experience', kk: '[ɪkˋspɪrɪəns]', part: 'n.', def: '經驗', sentence: 'I traveled to Italy last year, and it was a great experience.', senTrans: '我去年到義大利旅行，那是個很棒的經歷。', other: 'experiences' },
  { id: 9, unit: 23, word: 'video', kk: '[ˋvɪdɪ͵o]', part: 'n.', def: '錄影；影片', sentence: 'We stayed at home watching a video last night.', senTrans: '我們昨晚待在家裡看錄影帶。', other: 'videos' },
  { id: 10, unit: 23, word: 'program', kk: '[ˋprogræm]', part: 'n.', def: '節目', sentence: 'What kind of TV programs do you enjoy watching?', senTrans: '你喜歡看哪一種電視節目？', other: 'programs' },
  { id: 11, unit: 23, word: 'card', kk: '[kɑrd]', part: 'n.', def: '卡片', sentence: 'Addison’s boyfriend only gave her a card for her birthday.', senTrans: '艾狄森的男友在她生日時只送她一張卡片。', other: 'cards' },
  { id: 12, unit: 23, word: 'pack', kk: '[pæk]', part: 'v.', def: '打包', sentence: 'Make sure you pack a jacket in your suitcase.', senTrans: '別忘了在行李箱裡放進一件夾克。', other: 'packed / packing' },
  { id: 13, unit: 23, word: 'reporter', kk: '[rɪˋportɚ]', part: 'n.', def: '記者', sentence: 'The reporter hid a camera inside his jacket.', senTrans: '那個記者在外套裡面藏了一臺照相機。', other: 'reporters' },
  { id: 14, unit: 23, word: 'interview', kk: '[ˋɪntɚ͵vju]', part: 'n.', def: '面試；採訪', sentence: 'The interviewee was very nervous during the interview.', senTrans: '面試時，這位面試者非常緊張。', other: 'interviews' },
  { id: 15, unit: 23, word: 'last', kk: '[læst]', part: 'vi.', def: '持續', sentence: 'The meeting lasted for more than two hours.', senTrans: '這場會議進行了 2 個多小時。', other: 'lasted / lasting' },
  { id: 16, unit: 23, word: 'hide', kk: '[haɪd]', part: 'v.', def: '躲藏；藏', sentence: 'Liz hides her diaries on the top shelf of her closet.', senTrans: '麗茲把日記藏在衣櫥的最上層。', other: 'hid / hidden / hiding' },
  { id: 17, unit: 23, word: 'lonely', kk: '[ˋlonlɪ]', part: 'a.', def: '寂寞的', sentence: 'Eva feels lonely when Patrick is not around.', senTrans: '派翠克不在時伊娃感到很寂寞。', other: '' },
  { id: 18, unit: 23, word: 'lovely', kk: '[ˋlʌvlɪ]', part: 'a.', def: '美好的；漂亮的', sentence: 'We had a lovely time in Rome.', senTrans: '我們在羅馬度過一段美好的時光。', other: '' },
  { id: 19, unit: 23, word: 'dream', kk: '[drim]', part: 'n.', def: '夢；夢想', sentence: 'Mike had a dream that he was a butterfly.', senTrans: '麥克夢見他是一隻蝴蝶。', other: 'dreams' },
  { id: 20, unit: 23, word: 'excellent', kk: '[ˋɛkslənt]', part: 'a.', def: '傑出的', sentence: 'The brave young man is an excellent soldier.', senTrans: '那位英勇的年輕人是一位傑出的戰士。', other: '' },
  { id: 21, unit: 23, word: 'fool', kk: '[ful]', part: 'n.', def: '傻瓜', sentence: 'Only a fool would do such a thing.', senTrans: '只有傻子會做這樣的事。', other: 'fools' },
  { id: 22, unit: 23, word: 'however', kk: '[haʊˋɛvɚ]', part: 'adv.', def: '然而', sentence: 'You can come with me. However, you have to pay your own way.', senTrans: '你可以跟我來；不過，你得全程自費。', other: '' },
  { id: 23, unit: 23, word: 'glove', kk: '[glʌv]', part: 'n.', def: '手套', sentence: 'You’d better put on your gloves when doing this job.', senTrans: '做這份工作時最好戴手套。', other: 'gloves' },
  { id: 24, unit: 23, word: 'butterfly', kk: '[ˋbʌtɚ͵flaɪ]', part: 'n.', def: '蝴蝶', sentence: 'In winter, millions of butterflies travel to Mexico.', senTrans: '在冬天，有數百萬隻蝴蝶飛至墨西哥。', other: 'butterflies' },
  { id: 25, unit: 23, word: 'borrow', kk: '[ˋbɑro]', part: 'v.', def: '借入', sentence: 'Can I borrow some money from you?', senTrans: '我能向你借一些錢嗎？', other: 'borrowed / borrowing' },
  { id: 26, unit: 23, word: 'already', kk: '[ɔlˋrɛdɪ]', part: 'adv.', def: '已經', sentence: 'Molly has already eaten dinner.', senTrans: '茉莉已經吃過晚餐了。', other: '' },
  { id: 27, unit: 23, word: 'corner', kk: '[ˋkɔrnɚ]', part: 'n.', def: '角落', sentence: 'There is a post office on the corner.', senTrans: '轉角處有一家郵局。', other: 'corners' },
  { id: 28, unit: 23, word: 'early', kk: '[ˋɝlɪ]', part: 'a.', def: '早的', sentence: 'John said it was too early to know the result.', senTrans: '約翰說太早，還不知道結果。', other: '' },
  { id: 29, unit: 23, word: 'mine', kk: '[maɪn]', part: 'n.', def: '礦；地雷', sentence: 'The coal mine on the mountain is depleted.', senTrans: '那座山上的煤礦已經開採殆盡。', other: 'mines' },
  { id: 30, unit: 23, word: 'pick', kk: '[pɪk]', part: 'v.', def: '挑選', sentence: 'Pick a color for your bedroom walls.', senTrans: '替你房間的牆選個顏色吧。', other: 'picked / picking' },
  { id: 31, unit: 23, word: 'study', kk: '[ˋstʌdɪ]', part: 'v.', def: '研讀；學習', sentence: 'Denise is a good student who studies hard.', senTrans: '狄妮絲是個用功唸書的好學生。', other: 'studies / studied / studying' },
  { id: 32, unit: 23, word: 'quarter', kk: '[ˋkwɔrtɚ]', part: 'n.', def: '四分之一', sentence: 'A quarter of the population voted for Tony.', senTrans: '有四分之一的人投票給湯尼。', other: 'quarters' },
  { id: 33, unit: 23, word: 'machine', kk: '[məˋʃin]', part: 'n.', def: '機器', sentence: 'The machine can make hammers and other tools.', senTrans: '這臺機器可以製作鐵鎚和其他工具。', other: 'machines' },
  { id: 34, unit: 23, word: 'wall', kk: '[wɔl]', part: 'n.', def: '牆壁', sentence: 'There was a stone wall around the old city.', senTrans: '舊城被一座石牆圍繞著。', other: 'walls' },
  { id: 35, unit: 23, word: 'hotel', kk: '[hoˋtɛl]', part: 'n.', def: '飯店', sentence: 'Charlie stayed at a nice hotel with a big swimming pool.', senTrans: '查理住在一間有大游泳池的優質飯店。', other: 'hotels' },
  { id: 36, unit: 23, word: 'knock', kk: '[nɑk]', part: 'v.', def: '敲；擊', sentence: 'Please knock on the door before entering the room.', senTrans: '進房間之前，請先敲門。', other: 'knocked / knocking' },

  // --- Unit 24 ---
  { id: 37, unit: 24, word: 'town', kk: '[taʊn]', part: 'n.', def: '城鎮', sentence: 'Brian grew up in a small town in Canada.', senTrans: '布萊恩在加拿大的這一個小鎮長大。', other: 'towns' },
  { id: 38, unit: 24, word: 'carrot', kk: '[ˋkærət]', part: 'n.', def: '胡蘿蔔', sentence: 'Carrots are rich in vitamin A.', senTrans: '紅蘿蔔富含維生素A。', other: 'carrots' },
  { id: 39, unit: 24, word: 'doctor', kk: '[ˋdɑktɚ]', part: 'n.', def: '醫生', sentence: 'Susan is a doctor in a large hospital.', senTrans: '蘇珊是大醫院內的醫生。', other: 'doctors' },
  { id: 40, unit: 24, word: 'until', kk: '[ənˋtɪl]', part: 'conj.', def: '直到', sentence: 'Tony played soccer until he got tired.', senTrans: '湯尼踢足球踢到累了為止。', other: '' },
  { id: 41, unit: 24, word: 'medicine', kk: '[ˋmɛdəsn]', part: 'n.', def: '藥', sentence: 'Remember to take this medicine three times a day.', senTrans: '記得一天服這個藥3次。', other: 'medicines' },
  { id: 42, unit: 24, word: 'comfortable', kk: '[ˋkʌmfətəb!]', part: 'a.', def: '舒適的', sentence: 'A soft, warm bed is comfortable to lie in.', senTrans: '柔軟溫暖的床躺起來很舒服。', other: '' },
  { id: 43, unit: 24, word: 'wait', kk: '[wet]', part: 'v.', def: '等待', sentence: 'Patty waited for the bus to arrive.', senTrans: '派蒂在等公車抵達。', other: 'waited / waiting' },
  { id: 44, unit: 24, word: 'day', kk: '[de]', part: 'n.', def: '一天', sentence: 'Joy\'s favorite day of the week is Saturday.', senTrans: '喬伊一週中最喜歡的一天是星期六。', other: 'days' },
  { id: 45, unit: 24, word: 'month', kk: '[mʌnθ]', part: 'n.', def: '月', sentence: 'Veronica\'s birthday is in the month of August.', senTrans: '薇洛妮卡的生日在8月。', other: 'months' },
  { id: 46, unit: 24, word: 'year', kk: '[jɪr]', part: 'n.', def: '年', sentence: 'Paul has been playing the guitar for 10 years.', senTrans: '保羅彈吉他10年了。', other: 'years' },
  { id: 47, unit: 24, word: 'apartment', kk: '[əˋpɑrtmənt]', part: 'n.', def: '公寓', sentence: 'Lilly moved into her new apartment last night.', senTrans: '莉莉昨晚搬進她的新公寓。', other: 'apartments' },
  { id: 48, unit: 24, word: 'wise', kk: '[waɪz]', part: 'a.', def: '有智慧的', sentence: 'I think Susan has made a wise decision to break up with John.', senTrans: '我認為蘇珊和約翰分手是個明智的決定。', other: 'wiser / wisest' },
  { id: 49, unit: 24, word: 'throat', kk: '[θrot]', part: 'n.', def: '喉嚨', sentence: 'The speaker cleared his throat before delivering the speech.', senTrans: '這位講者清了清喉嚨才開始發表演說。', other: 'throats' },
  { id: 50, unit: 24, word: 'salad', kk: '[ˋsæləd]', part: 'n.', def: '沙拉', sentence: 'We ate salad and noodles for dinner last night.', senTrans: '昨晚我們晚餐吃生菜沙拉及麵條。', other: 'salads' },
  { id: 51, unit: 24, word: 'headache', kk: '[ˋhɛd͵ek]', part: 'n.', def: '頭痛', sentence: 'Mike called in sick this morning because he had a headache.', senTrans: '麥可早上因為頭痛請病假。', other: 'headaches' },
  { id: 52, unit: 24, word: 'subject', kk: '[ˋsʌbdʒɪkt]', part: 'n.', def: '學科', sentence: 'What\'s your favorite subject at school?', senTrans: '在學校你最愛的科目是什麼？', other: 'subjects' },
  { id: 53, unit: 24, word: 'abroad', kk: '[əˋbrɔd]', part: 'adv.', def: '在國外', sentence: 'Due to COVID-19, people cannot travel abroad these days.', senTrans: '由於新冠肺炎，人們現在都無法出國旅遊。', other: '' },
  { id: 54, unit: 24, word: 'museum', kk: '[mjuˋziəm]', part: 'n.', def: '博物館', sentence: 'The artist\'s work is on display at the museum now.', senTrans: '這位藝術家的作品正在博物館展覽中。', other: 'museums' },
  { id: 55, unit: 24, word: 'net', kk: '[nɛt]', part: 'n.', def: '網子', sentence: 'The man went fishing with a fishing rod and a net.', senTrans: '這名男子帶了一支釣竿和網子去釣魚。', other: 'nets' },
  { id: 56, unit: 24, word: 'pleasure', kk: '[ˋplɛʒɚ]', part: 'n.', def: '愉快；榮幸', sentence: 'It\'s my great pleasure to deliver this speech to you.', senTrans: '能向諸位發表演講是我的榮幸。', other: 'pleasures' },
  { id: 57, unit: 24, word: 'lawyer', kk: '[ˋlɔjɚ]', part: 'n.', def: '律師', sentence: 'I suggest you consult a lawyer.', senTrans: '我建議你去請教律師。', other: 'lawyers' },
  { id: 58, unit: 24, word: 'famous', kk: '[ˋfeməs]', part: 'a.', def: '出名的', sentence: 'This restaurant is famous for its terrific steaks.', senTrans: '這家餐廳以好吃的牛排聞名。', other: '' },
  { id: 59, unit: 24, word: 'business', kk: '[ˋbɪznɪs]', part: 'n.', def: '生意', sentence: 'Our business has been prosperous over the past three years.', senTrans: '過去3年來，我們的生意蒸蒸日上。', other: 'businesses' },
  { id: 60, unit: 24, word: 'picnic', kk: '[ˋpɪknɪk]', part: 'n.', def: '野餐', sentence: 'Zoe and her family had a picnic in the park.', senTrans: '柔伊和她的家人在公園裡野餐。', other: 'picnics' },
  { id: 61, unit: 24, word: 'future', kk: '[ˋfjutʃɚ]', part: 'n.', def: '未來', sentence: 'What are you planning to do in the future?', senTrans: '你未來計劃要做什麼？', other: 'futures' },
  { id: 62, unit: 24, word: 'convenient', kk: '[kənˋvinjənt]', part: 'a.', def: '方便的', sentence: 'Is tomorrow evening convenient for you?', senTrans: '明晚你方便嗎？', other: '' },
  { id: 63, unit: 24, word: 'bench', kk: '[bɛntʃ]', part: 'n.', def: '長椅', sentence: 'Joan read a newspaper on a bench.', senTrans: '瓊安坐在一張長椅上看報紙。', other: 'benches' },
  { id: 64, unit: 24, word: 'ago', kk: '[əˋgo]', part: 'adv.', def: '...以前', sentence: 'Richard and Erin got married five years ago.', senTrans: '理查和艾琳在5年前結婚。', other: '' },
  { id: 65, unit: 24, word: 'thick', kk: '[θɪk]', part: 'a.', def: '厚的', sentence: 'The castle walls are 90 cm thick.', senTrans: '這些城牆有90公分厚。', other: '' },
  { id: 66, unit: 24, word: 'thin', kk: '[θɪn]', part: 'a.', def: '薄的', sentence: 'The road is covered with a thin layer of ice.', senTrans: '馬路覆蓋著一層薄冰。', other: '' },
  { id: 67, unit: 24, word: 'invite', kk: '[ɪnˋvaɪt]', part: 'v.', def: '邀請', sentence: 'Our new neighbors invited us to their housewarming party.', senTrans: '我們的新鄰居邀我們去參加他們的喬遷派對。', other: 'invited / inviting' },
  { id: 68, unit: 24, word: 'share', kk: '[ʃɛr]', part: 'v.', def: '分享', sentence: 'Jenny doesn\'t want to share her toys with her twin sister.', senTrans: '珍妮不願與她的雙胞胎妹妹分享玩具。', other: 'shared / sharing' },
  { id: 69, unit: 24, word: 'party', kk: '[ˋpɑrtɪ]', part: 'n.', def: '派對', sentence: 'Lauren went to a nice dinner party on Friday night.', senTrans: '蘿倫週五晚上去了一個很棒的晚宴派對。', other: 'parties' },
  { id: 70, unit: 24, word: 'exercise', kk: '[ˋɛksɚ͵saɪz]', part: 'n.', def: '運動', sentence: 'Exercise and proper diet are essential for good health.', senTrans: '運動和適當的飲食對健康很重要。', other: 'exercises' },
  { id: 71, unit: 24, word: 'modern', kk: '[ˋmɑdɚn]', part: 'a.', def: '現代的', sentence: 'Hazel likes both modern dance and classical ballet.', senTrans: '海瑟喜歡現代舞和古典芭蕾。', other: '' },
  { id: 72, unit: 24, word: 'snow', kk: '[sno]', part: 'n.', def: '雪', sentence: 'In the winter, it snows in many countries.', senTrans: '冬天時，很多國家都會下雪。', other: 'snows' },
  { id: 73, unit: 24, word: 'festival', kk: '[ˋfɛstəv!]', part: 'n.', def: '節慶', sentence: 'The music festival is held here every summer.', senTrans: '音樂祭每年夏天都在這裡舉辦。', other: 'festivals' },
  { id: 74, unit: 24, word: 'celebrate', kk: '[ˋsɛlə͵bret]', part: 'v.', def: '慶祝', sentence: 'Daniel\'s coworkers celebrated his promotion with a party.', senTrans: '丹尼爾的同事開派對慶祝他的升遷。', other: 'celebrated / celebrating' },

  // --- Unit 25 ---
  { id: 75, unit: 25, word: 'button', kk: '[ˋbʌtn]', part: 'n.', def: '鈕扣; 按鈕', sentence: 'Can you undo the buttons on my back?', senTrans: '你可以幫我解開我背後的扣子嗎？', other: 'buttons' },
  { id: 76, unit: 25, word: 'ability', kk: '[əˋbɪlətɪ]', part: 'n.', def: '能力', sentence: 'Ants have the ability to carry objects much heavier than themselves.', senTrans: '螞蟻有能力搬動比自己重得多的物體。', other: 'abilities' },
  { id: 77, unit: 25, word: 'copy', kk: '[ˋkɑpɪ]', part: 'v.', def: '複製; 模仿', sentence: 'The company was accused of copying the product of a US manufacturer.', senTrans: '該公司被指控偽造一家美國廠商的產品。', other: 'copied / copying' },
  { id: 78, unit: 25, word: 'guy', kk: '[gaɪ]', part: 'n.', def: '傢伙; 男子', sentence: 'I don\'t like that guy.', senTrans: '我不喜歡那個傢伙。', other: 'guys' },
  { id: 79, unit: 25, word: 'clerk', kk: '[klɝk]', part: 'n.', def: '店員', sentence: 'The clerk at the drugstore gave me the wrong change.', senTrans: '藥妝店的店員找錯零錢給我。', other: 'clerks' },
  { id: 80, unit: 25, word: 'explain', kk: '[ɪkˋsplen]', part: 'v.', def: '解釋', sentence: 'After the surgery, the doctor will explain how to take care of your eyes.', senTrans: '手術後，醫生會解釋如何照顧你的眼睛。', other: 'explained / explaining' },
  { id: 81, unit: 25, word: 'proud', kk: '[praʊd]', part: 'a.', def: '自豪的; 驕傲的', sentence: 'I\'m proud of my dad. He takes good care of his family.', senTrans: '我爸很照顧家人，我以他為榮。', other: '' },
  { id: 82, unit: 25, word: 'online', kk: '[ˋɑn͵laɪn]', part: 'a.', def: '網路上的', sentence: 'Not all online information is correct.', senTrans: '線上資訊並非都是正確的。', other: '' },
  { id: 83, unit: 25, word: 'collect', kk: '[kəˋlɛkt]', part: 'v.', def: '收集', sentence: 'Bill has been collecting stamps for more than thirty years.', senTrans: '比爾集郵已有30多年之久。', other: 'collected / collecting' },
  { id: 84, unit: 25, word: 'hang', kk: '[hæŋ]', part: 'v.', def: '懸掛', sentence: 'The painting was hung upside down.', senTrans: '這幅畫被掛顛倒了。', other: 'hung / hanging' },
  { id: 85, unit: 25, word: 'teenager', kk: '[ˋtin͵edʒɚ]', part: 'n.', def: '青少年', sentence: 'I often made rash decisions when I was a teenager.', senTrans: '我還青少年時，常做出輕率的決定。', other: 'teenagers' },
  { id: 86, unit: 25, word: 'wet', kk: '[wɛt]', part: 'a.', def: '溼的', sentence: 'The ground is wet after the rain.', senTrans: '下過雨後地上溼溼的。', other: 'wetter / wettest' },
  { id: 87, unit: 25, word: 'honest', kk: '[ˋɑnɪst]', part: 'a.', def: '誠實的', sentence: 'You should be honest with your parents.', senTrans: '你應該對父母誠實。', other: '' },
  { id: 88, unit: 25, word: 'towel', kk: '[ˋtaʊəl]', part: 'n.', def: '毛巾', sentence: 'After swimming, dry off with a towel.', senTrans: '游泳後，用毛巾把身體擦乾。', other: 'towels' },
  { id: 89, unit: 25, word: 'mark', kk: '[mɑrk]', part: 'n.', def: '記號; 汙點', sentence: 'There are some dirty marks on your white dress.', senTrans: '妳的白洋裝上有些髒髒的汙點。', other: 'marks' },
  { id: 90, unit: 25, word: 'dictionary', kk: '[ˋdɪkʃən͵ɛrɪ]', part: 'n.', def: '字典', sentence: 'If you don\'t know the word, consult the dictionary.', senTrans: '你若不懂這個字就查字典。', other: 'dictionaries' },
  { id: 91, unit: 25, word: 'fail', kk: '[fel]', part: 'v.', def: '失敗; 不及格', sentence: 'Lucas failed in his attempt to persuade Willa.', senTrans: '盧卡斯沒能說服薇拉。', other: 'failed / failing' },
  { id: 92, unit: 25, word: 'club', kk: '[klʌb]', part: 'n.', def: '社團', sentence: 'Iris joined the soccer club at school.', senTrans: '艾莉絲加入了學校的足球社。', other: 'clubs' },
  { id: 93, unit: 25, word: 'wake', kk: '[wek]', part: 'v.', def: '醒來; 叫醒', sentence: 'Be quiet or you\'ll wake the baby.', senTrans: '安靜點，不然你會吵醒小寶寶。', other: 'woke / woken / waking' },
  { id: 94, unit: 25, word: 'define', kk: '[dɪˋfaɪn]', part: 'v.', def: '下定義', sentence: 'It is difficult to define the word "love".', senTrans: '要為『愛』這個字去下定義是很困難的。', other: 'defined / defining' },
  { id: 95, unit: 25, word: 'tape', kk: '[tep]', part: 'n.', def: '膠帶; 錄音帶', sentence: 'Put the tape in the recorder before the speech begins.', senTrans: '演講開始前，把錄音帶放進錄音機裡。', other: 'tapes' },
  { id: 96, unit: 25, word: 'expect', kk: '[ɪkˋspɛkt]', part: 'v.', def: '預期; 等待', sentence: 'No one expected Kelly to get married so soon.', senTrans: '大家都沒料到凱莉會這麼快結婚。', other: 'expected / expecting' },
  { id: 97, unit: 25, word: 'envelope', kk: '[ˋɛnvə͵lop]', part: 'n.', def: '信封', sentence: 'What was in the envelope Liam gave you?', senTrans: '連恩給你的那個信封裡裝著什麼？', other: 'envelopes' },
  { id: 98, unit: 25, word: 'soldier', kk: '[ˋsoldʒɚ]', part: 'n.', def: '軍人', sentence: 'The brave soldier fought in three battles.', senTrans: '這個勇敢的軍人參加過3次戰役。', other: 'soldiers' },
  { id: 99, unit: 25, word: 'example', kk: '[ɪgˋzæmp!]', part: 'n.', def: '例子', sentence: 'Ethan can play many instruments, for example, piano, violin, and cello.', senTrans: '伊森會演奏很多樂器，例如鋼琴、小提琴和大提琴。', other: 'examples' },
  { id: 100, unit: 25, word: 'uniform', kk: '[ˋjunə͵fɔrm]', part: 'n.', def: '制服', sentence: 'Belle still looks beautiful in her school uniform.', senTrans: '貝兒穿校服看起來仍很美麗。', other: 'uniforms' },
  { id: 101, unit: 25, word: 'pin', kk: '[pɪn]', part: 'n.', def: '別針', sentence: 'My grandmother gave me her antique pin.', senTrans: '我的祖母把她的古董胸針給了我。', other: 'pins' },
  { id: 102, unit: 25, word: 'repeat', kk: '[rɪˋpit]', part: 'v.', def: '重複', sentence: 'Could you please repeat the question?', senTrans: '請你再把問題重複一遍好嗎？', other: 'repeated / repeating' },
  { id: 103, unit: 25, word: 'drop', kk: '[drɑp]', part: 'v.', def: '掉落', sentence: 'Stock prices dropped sharply in Asia yesterday.', senTrans: '昨天亞洲的股價劇烈下跌。', other: 'dropped / dropping' },
  { id: 104, unit: 25, word: 'attack', kk: '[əˋtæk]', part: 'v.', def: '攻擊', sentence: 'A stray dog attacked that little boy yesterday.', senTrans: '昨天有隻流浪狗攻擊那個小男孩。', other: 'attacked / attacking' },
  { id: 105, unit: 25, word: 'sign', kk: '[saɪn]', part: 'v.', def: '簽名', sentence: 'Jacob took out his pen to sign the check.', senTrans: '雅各拿出他的筆來簽支票。', other: 'signed / signing' },
  { id: 106, unit: 25, word: 'temple', kk: '[ˋtɛmp!]', part: 'n.', def: '寺廟', sentence: 'At the temple, my mother prayed for my grandfather to get well soon.', senTrans: '我媽媽在寺廟裡祈求爺爺身體早點康復。', other: 'temples' },
  { id: 107, unit: 25, word: 'item', kk: '[ˋaɪtəm]', part: 'n.', def: '物品', sentence: 'None of the items on the table belong to me.', senTrans: '桌上的物品沒有一件是我的。', other: 'items' },
  { id: 108, unit: 25, word: 'error', kk: '[ˋɛrɚ]', part: 'n.', def: '錯誤', sentence: 'Pauline made two grammatical errors in this sentence.', senTrans: '寶琳在這個句子中犯了2個文法錯誤。', other: 'errors' },
  { id: 109, unit: 25, word: 'blind', kk: '[blaɪnd]', part: 'a.', def: '盲的', sentence: 'Audrey was born blind.', senTrans: '奧黛莉天生眼盲。', other: '' },
  { id: 110, unit: 25, word: 'engineer', kk: '[͵ɛndʒəˋnɪr]', part: 'n.', def: '工程師', sentence: 'Ezra is a good mechanical engineer.', senTrans: '以斯拉是個優秀的機械工程師。', other: 'engineers' },
  { id: 111, unit: 25, word: 'twice', kk: '[twaɪs]', part: 'adv.', def: '兩次', sentence: 'Annie has only played tennis twice.', senTrans: '安妮只打過2次網球。', other: '' },
  { id: 112, unit: 25, word: 'string', kk: '[strɪŋ]', part: 'n.', def: '細繩; 線', sentence: 'I need a piece of string to tie this box.', senTrans: '我需要一條繩子來綁這個箱子。', other: 'strings' },
  { id: 113, unit: 25, word: 'pipe', kk: '[paɪp]', part: 'n.', def: '管子', sentence: 'The pipes must be clogged. The sink is full of dirty water.', senTrans: '水管一定是堵住了，水槽裡積滿了汙水。', other: 'pipes' },

  // --- Unit 26 ---
  { id: 114, unit: 26, word: 'provide', kk: '[prəˋvaɪd]', part: 'v.', def: '提供', sentence: 'I\'ll provide you with everything you need for the mission.', senTrans: '我會提供你這項任務所需的一切。', other: 'provided / providing' },
  { id: 115, unit: 26, word: 'company', kk: '[ˋkʌmpənɪ]', part: 'n.', def: '公司; 陪伴', sentence: 'The company is going out of business soon.', senTrans: '這家公司就要倒閉了。', other: 'companies' },
  { id: 116, unit: 26, word: 'soft', kk: '[sɔft]', part: 'a.', def: '柔軟的', sentence: 'This bread is soft and delicious.', senTrans: '這麵包鬆軟好吃。', other: 'softer / softest' },
  { id: 117, unit: 26, word: 'social', kk: '[ˋsoʃəl]', part: 'a.', def: '社會的; 社交的', sentence: 'Roger and my father discussed many of today\'s social issues.', senTrans: '羅傑和我父親討論了許多當今的社會議題。', other: '' },
  { id: 118, unit: 26, word: 'figure', kk: '[ˋfɪgjɚ]', part: 'v.', def: '認為; 數字; 身材', sentence: 'I never figured Johnny was a talented director.', senTrans: '我從不認為強尼是位有才華的導演。', other: 'figured / figuring' },
  { id: 119, unit: 26, word: 'countryside', kk: '[ˋkʌntrɪ͵saɪd]', part: 'n.', def: '鄉間', sentence: 'I enjoy living in the countryside because the air here is fresh.', senTrans: '我喜歡住在鄉下，因為這裡空氣很新鮮。', other: '' },
  { id: 120, unit: 26, word: 'fisherman', kk: '[ˋfɪʃɚmən]', part: 'n.', def: '漁夫', sentence: 'These fishermen were worried about the coming typhoon.', senTrans: '這些漁夫很擔心即將要來的颱風。', other: 'fishermen' },
  { id: 121, unit: 26, word: 'sock', kk: '[sɑk]', part: 'n.', def: '短襪', sentence: 'Rex is wearing a pair of yellow socks.', senTrans: '雷克斯穿了一雙黃色襪子。', other: 'socks' },
  { id: 122, unit: 26, word: 'international', kk: '[͵ɪntɚˋnæʃən!]', part: 'a.', def: '國際的', sentence: 'English is an important international language.', senTrans: '英文是個重要的國際語言。', other: '' },
  { id: 123, unit: 26, word: 'value', kk: '[ˋvælju]', part: 'n.', def: '價值; 價值觀', sentence: 'This building has a value of more than 20 million NT dollars.', senTrans: '這棟建築物價值超過 2,000 萬新臺幣。', other: 'values' },
  { id: 124, unit: 26, word: 'president', kk: '[ˋprɛzədənt]', part: 'n.', def: '總統; 總裁', sentence: 'The president is planning to visit some diplomatic allies next month.', senTrans: '總統計劃下個月去拜訪一些邦交國家。', other: 'presidents' },
  { id: 125, unit: 26, word: 'regard', kk: '[rɪˋgɑrd]', part: 'v.', def: '把...視為; 問候', sentence: 'We all regard Roger as a hero.', senTrans: '我們都把羅傑視為英雄。', other: 'regarded / regarding' },
  { id: 126, unit: 26, word: 'increase', kk: '[ɪnˋkris]', part: 'v.', def: '增加', sentence: 'The driver increased speed suddenly.', senTrans: '這位駕駛突然加速行駛。', other: 'increased / increasing' },
  { id: 127, unit: 26, word: 'escape', kk: '[əˋskep]', part: 'v.', def: '逃脫; 躲過', sentence: 'According to the news, a notorious drug dealer escaped from prison.', senTrans: '據新聞報導，一個惡名昭彰的毒販越獄了。', other: 'escaped / escaping' },
  { id: 128, unit: 26, word: 'develop', kk: '[dɪˋvɛləp]', part: 'v.', def: '發展; 沖洗(底片)', sentence: 'The mistake was ignored and later developed into a major problem.', senTrans: '這錯誤被忽略，後來就演變成一個大問題。', other: 'developed / developing' },
  { id: 129, unit: 26, word: 'burn', kk: '[bɝn]', part: 'v.', def: '燃燒; 燒焦', sentence: 'The secretary burned up all the papers before the police came.', senTrans: '那祕書在警方來之前就燒毀了所有的文件。', other: 'burned / burnt / burning' },
  { id: 130, unit: 26, word: 'effect', kk: '[ɪˋfɛkt]', part: 'n.', def: '效果; 影響', sentence: 'The medicine was starting to take effect.', senTrans: '這藥開始見效了。', other: 'effects' },
  { id: 131, unit: 26, word: 'whenever', kk: '[hwɛnˋɛvɚ]', part: 'conj.', def: '每當; 無論何時', sentence: 'Whenever I was on stage, my hands couldn\'t stop shaking.', senTrans: '每當我在臺上時，我就會手抖個不停。', other: '' },
  { id: 132, unit: 26, word: 'bookstore', kk: '[ˋbʊk͵stor]', part: 'n.', def: '書店', sentence: 'Donald went to a bookstore yesterday and bought a few novels.', senTrans: '唐納德昨天去書店買了幾本小說。', other: 'bookstores' },
  { id: 133, unit: 26, word: 'better', kk: '[ˋbɛtɚ]', part: 'a.', def: '更好的', sentence: 'George wants to buy a better car than his current one.', senTrans: '喬治想買一輛比現在更好的車。', other: '' },
  { id: 134, unit: 26, word: 'stone', kk: '[ston]', part: 'n.', def: '石頭', sentence: 'Gordon left no stone unturned in his search for the person who had saved his life.', senTrans: '戈登千方百計地想找出他的救命恩人。', other: 'stones' },
  { id: 135, unit: 26, word: 'suggest', kk: '[səgˋdʒɛst]', part: 'v.', def: '建議; 暗示', sentence: 'Frank suggested that we (should) leave early.', senTrans: '法蘭克建議我們早點離開。', other: 'suggested / suggesting' },
  { id: 136, unit: 26, word: 'challenge', kk: '[ˋtʃælɪndʒ]', part: 'n.', def: '挑戰', sentence: 'The politician is facing the biggest challenge of her career.', senTrans: '這位政治人物正面臨她職涯中最大的挑戰。', other: 'challenges' },
  { id: 137, unit: 26, word: 'firm', kk: '[fɝm]', part: 'a.', def: '堅硬的; 堅定的', sentence: 'I prefer to sleep on a firm bed.', senTrans: '我比較喜歡睡硬床。', other: '' },
  { id: 138, unit: 26, word: 'offer', kk: '[ˋɔfɚ]', part: 'v.', def: '提供; 提議', sentence: 'Thank you for offering me such a great opportunity.', senTrans: '謝謝你提供我一個這麼好的機會。', other: 'offered / offering' },
  { id: 139, unit: 26, word: 'supply', kk: '[səˋplaɪ]', part: 'v.', def: '供應; 供給', sentence: 'Despite water rationing, the large water tank can supply the residents with the water they need.', senTrans: '儘管有限水，大型水塔仍可為住戶提供用水。', other: 'supplied / supplying' },
  { id: 140, unit: 26, word: 'further', kk: '[ˋfɝðɚ]', part: 'a.', def: '更進一步的', sentence: 'Visit our website for further information.', senTrans: '如需更多資訊請上我們的網站。', other: '' },
  { id: 141, unit: 26, word: 'worse', kk: '[wɝs]', part: 'a.', def: '更糟的', sentence: 'Erica tried to help, but she actually made matters worse.', senTrans: '艾瑞卡試圖幫忙，但她實際上卻把事情弄得更糟。', other: '' },
  { id: 142, unit: 26, word: 'worst', kk: '[wɝst]', part: 'a.', def: '最糟的', sentence: 'Gloria thought the singer was the worst one she had ever heard.', senTrans: '葛羅莉亞認為這歌手是她聽過唱得最糟的歌手。', other: '' },
  { id: 143, unit: 26, word: 'village', kk: '[ˋvɪlɪdʒ]', part: 'n.', def: '村莊', sentence: 'The village was almost destroyed by fire.', senTrans: '這村莊幾乎被大火燒毀了。', other: 'villages' },
  { id: 144, unit: 26, word: 'field', kk: '[fild]', part: 'n.', def: '原野; 領域', sentence: 'There are ten cows in the field.', senTrans: '原野上有 10 頭乳牛。', other: 'fields' },
  { id: 145, unit: 26, word: 'sailor', kk: '[ˋselɚ]', part: 'n.', def: '水手; 船員', sentence: 'Those sailors were caught in a violent storm.', senTrans: '那些船員遇到一場猛烈的風暴。', other: 'sailors' },
  { id: 146, unit: 26, word: 'sail', kk: '[sel]', part: 'v.', def: '航行; 駕駛(船)', sentence: 'The sails of the boat flapped in the strong wind.', senTrans: '這艘船的帆在強風中擺動著。', other: 'sailed / sailing' },
  { id: 147, unit: 26, word: 'suppose', kk: '[səˋpoz]', part: 'v.', def: '猜想; 認為', sentence: 'It\'s late, so I suppose you must go home.', senTrans: '時間很晚了，所以我想你得回家了。', other: 'supposed / supposing' },
  { id: 148, unit: 26, word: 'consider', kk: '[kənˋsɪdɚ]', part: 'v.', def: '考慮; 把...視為', sentence: 'I\'m considering taking a trip to Japan.', senTrans: '我正考慮到日本去旅行。', other: 'considered / considering' },
  { id: 149, unit: 26, word: 'consideration', kk: '[kən͵sɪdəˋreʃən]', part: 'n.', def: '考慮', sentence: 'Further consideration is necessary before we carry out this plan.', senTrans: '在我們實施這項計畫前，必須再三考慮才行。', other: 'considerations' },
  { id: 150, unit: 26, word: 'thought', kk: '[θɔt]', part: 'n.', def: '想法', sentence: 'Kevin felt sad at the thought of his disabled child struggling at school.', senTrans: '凱文想到自己的身障孩子在學校掙扎，就感到很難過。', other: 'thoughts' },

  // --- Unit 27 (New) ---
  { id: 151, unit: 27, word: 'pride', kk: '[praɪd]', part: 'n.', def: '自豪; 自尊', sentence: 'The father takes pride in his son\'s excellent performance in school.', senTrans: '那位父親以兒子在校優異的表現為榮。', other: '' },
  { id: 152, unit: 27, word: 'govern', kk: '[ˋgʌvɚn]', part: 'v.', def: '統治; 管理', sentence: 'The president has governed that country for the last ten years.', senTrans: '這位總統在過去的 10 年一直統治著那個國家。', other: 'governed / governing' },
  { id: 153, unit: 27, word: 'government', kk: '[ˋgʌvɚnmənt]', part: 'n.', def: '政府', sentence: 'The central government has promised to cut taxes.', senTrans: '中央政府已承諾要減稅。', other: 'governments' },
  { id: 154, unit: 27, word: 'period', kk: '[ˋpɪrɪəd]', part: 'n.', def: '一段期間; 句點', sentence: 'I\'m going to stay here for a long period of time.', senTrans: '我將在這裡待上一段很長的時間。', other: 'periods' },
  { id: 155, unit: 27, word: 'term', kk: '[tɝm]', part: 'n.', def: '學期; 術語', sentence: 'All students are required to hand in a written paper at the end of the term.', senTrans: '所有學生於學期末均須繳交一篇書面報告。', other: 'terms' },
  { id: 156, unit: 27, word: 'century', kk: '[ˋsɛntʃərɪ]', part: 'n.', def: '世紀', sentence: 'Many great inventions were made in the 20th century.', senTrans: '許多偉大的發明都是在 20 世紀問世的。', other: 'centuries' },
  { id: 157, unit: 27, word: 'accident', kk: '[ˋæksədənt]', part: 'n.', def: '意外; 車禍', sentence: 'David\'s back was seriously injured in a car accident.', senTrans: '大衛的背在車禍中背部受到重傷。', other: 'accidents' },
  { id: 158, unit: 27, word: 'result', kk: '[rɪˋzʌlt]', part: 'v.', def: '由...引起; 結果', sentence: 'Ben\'s failure resulted from laziness.', senTrans: '班的失敗起因於懶惰。', other: 'resulted / resulting' },
  { id: 159, unit: 27, word: 'local', kk: '[ˋlokl]', part: 'a.', def: '當地的', sentence: 'The local market offers a great selection of fruits and vegetables.', senTrans: '本地市場供應種類繁多的蔬果。', other: '' },
  { id: 160, unit: 27, word: 'chess', kk: '[tʃɛs]', part: 'n.', def: '西洋棋', sentence: 'Jessie is very good at playing chess.', senTrans: '潔西很會下西洋棋。', other: '' },
  { id: 161, unit: 27, word: 'board', kk: '[bord]', part: 'n.', def: '板子; 董事會', sentence: 'We need more boards to build the bookshelf.', senTrans: '我們需要更多木板來做這個書架。', other: 'boards' },
  { id: 162, unit: 27, word: 'trash', kk: '[træʃ]', part: 'n.', def: '垃圾', sentence: 'The boy picked up a piece of trash and threw it in the trash can.', senTrans: '男孩撿起一個垃圾丟進了垃圾桶。', other: '' },
  { id: 163, unit: 27, word: 'garbage', kk: '[ˋgɑrbɪdʒ]', part: 'n.', def: '垃圾', sentence: 'Sort out your garbage before dumping it.', senTrans: '倒垃圾前要先將垃圾分類。', other: '' },
  { id: 164, unit: 27, word: 'waste', kk: '[west]', part: 'v.', def: '浪費', sentence: 'Don\'t waste your time watching TV.', senTrans: '不要浪費時間看電視。', other: 'wasted / wasting' },
  { id: 165, unit: 27, word: 'bit', kk: '[bɪt]', part: 'n.', def: '小塊; 少量', sentence: 'The pasta was so delicious that Susan ate every bit of it.', senTrans: '那義大利麵太美味了，蘇珊吃到一點都不剩。', other: 'bits' },
  { id: 166, unit: 27, word: 'method', kk: '[ˋmɛθəd]', part: 'n.', def: '方法', sentence: 'The method we used earlier to try to get the car started didn\'t work.', senTrans: '我們先前試著用來發動車子的方法不管用。', other: 'methods' },
  { id: 167, unit: 27, word: 'approach', kk: '[əˋprotʃ]', part: 'v.', def: '接近; 處理', sentence: 'The dogcatchers approached the dangerous dog with caution.', senTrans: '捕犬員小心翼翼地接近那隻危險的狗。', other: 'approached / approaching' },
  { id: 168, unit: 27, word: 'necessary', kk: '[ˋnɛsə͵sɛrɪ]', part: 'a.', def: '必要的', sentence: 'It is necessary for you to punch in by eight o\'clock every morning.', senTrans: '你每天早上一定要在 8 點前打卡上班。', other: '' },
  { id: 169, unit: 27, word: 'importance', kk: '[ɪmˋpɔrtns]', part: 'n.', def: '重要(性)', sentence: 'Our teacher\'s words are of great importance to us.', senTrans: '我們老師的話對我們來說很重要。', other: '' },
  { id: 170, unit: 27, word: 'control', kk: '[kənˋtrol]', part: 'v.', def: '控制', sentence: 'Don\'t worry. Everything is under control.', senTrans: '別擔心。一切都在掌控中。', other: 'controlled / controlling' },
  { id: 171, unit: 27, word: 'limit', kk: '[ˋlɪmɪt]', part: 'v.', def: '限制', sentence: 'The doctor told me that I should limit myself to two cups of tea a day.', senTrans: '醫生告訴我我應該限制自己一天只能喝 2 杯茶。', other: 'limited / limiting' },
  { id: 172, unit: 27, word: 'difference', kk: '[ˋdɪfərəns]', part: 'n.', def: '差別', sentence: 'Do you know the difference between a mule and a donkey?', senTrans: '你知道騾和驢的差別嗎？', other: 'differences' },
  { id: 173, unit: 27, word: 'produce', kk: '[prəˋdjus]', part: 'v.', def: '生產', sentence: 'This large factory produces furniture.', senTrans: '這家很大間的工廠生產傢俱。', other: 'produced / producing' },
  { id: 174, unit: 27, word: 'production', kk: '[prəˋdʌkʃən]', part: 'n.', def: '生產; 產量', sentence: 'We need to build two more assembly lines to speed up production.', senTrans: '我們需另外建立 2 條裝配線以加速生產。', other: 'productions' },
  { id: 175, unit: 27, word: 'department', kk: '[dɪˋpɑrtmənt]', part: 'n.', def: '部門', sentence: 'My sister works in the sales department of this company.', senTrans: '我姊姊在這公司的銷售部門工作。', other: 'departments' },
  { id: 176, unit: 27, word: 'attend', kk: '[əˋtɛnd]', part: 'v.', def: '參加; 出席', sentence: 'All employees are required to attend the meeting.', senTrans: '全體員工一律得去參加該會議。', other: 'attended / attending' },
  { id: 177, unit: 27, word: 'attention', kk: '[əˋtɛnʃən]', part: 'n.', def: '注意', sentence: 'You should pay attention to the coach.', senTrans: '你該注意聽教練說的話。', other: '' },
  { id: 178, unit: 27, word: 'describe', kk: '[dɪˋskraɪb]', part: 'v.', def: '描述', sentence: 'Can you describe the man who stole your purse?', senTrans: '妳能描述一下偷妳手提包的人的樣子嗎？', other: 'described / describing' },
  { id: 179, unit: 27, word: 'description', kk: '[dɪˋskrɪpʃən]', part: 'n.', def: '描述', sentence: 'The majesty of Jade Mountain is beyond description.', senTrans: '玉山的雄偉非筆墨所能形容。', other: 'descriptions' },
  { id: 180, unit: 27, word: 'within', kk: '[wɪˋðɪn]', part: 'prep.', def: '在...之內', sentence: 'Drive within the speed limit, or you\'ll get a ticket.', senTrans: '要在速限內開車，不然你會被開罰單。', other: '' },
  { id: 181, unit: 27, word: 'among', kk: '[əˋmʌŋ]', part: 'prep.', def: '在...之中', sentence: 'Karen found a picture of her old boyfriend among her photos.', senTrans: '凱倫在她的照片中發現了她以前男友的照片。', other: '' },
  { id: 182, unit: 27, word: 'used', kk: '[just]', part: 'a.', def: '習慣的; 二手的', sentence: 'Jack is used to driving to work.', senTrans: '傑克習慣開車去上班。', other: '' },
  { id: 183, unit: 27, word: 'user', kk: '[ˋjuzɚ]', part: 'n.', def: '使用者', sentence: 'Read the user manual carefully before operating the machine.', senTrans: '操作機器前請詳讀使用者手冊。', other: 'users' },
  { id: 184, unit: 27, word: 'such', kk: '[sʌtʃ]', part: 'a.', def: '如此', sentence: 'It was such an excellent performance.', senTrans: '這真是場精彩絕倫的表演。', other: '' },
  { id: 185, unit: 27, word: 'army', kk: '[ˋɑrmɪ]', part: 'n.', def: '軍隊', sentence: 'My father joined the army when he was eighteen.', senTrans: '我父親 18 歲時從軍。', other: 'armies' },
  { id: 186, unit: 27, word: 'military', kk: '[ˋmɪlə͵tɛrɪ]', part: 'n.', def: '軍隊', sentence: 'My brother plans to join the military after senior high school.', senTrans: '我弟弟計劃讀完高中後從軍。', other: '' },
  { id: 187, unit: 27, word: 'command', kk: '[kəˋmænd]', part: 'v.', def: '命令', sentence: 'The general commanded the troops to fire on the enemy.', senTrans: '將軍下令部隊向敵軍開火。', other: 'commanded / commanding' },
  { id: 188, unit: 27, word: 'obey', kk: '[oˋbe]', part: 'v.', def: '遵守; 服從', sentence: 'Obey the law, or you will be punished.', senTrans: '要守法，不然你就會受到懲處。', other: 'obeyed / obeying' },
  { id: 189, unit: 27, word: 'border', kk: '[ˋbɔrdɚ]', part: 'n.', def: '邊界', sentence: 'My aunt and uncle live on the border of Germany and France.', senTrans: '我的嬸嬸和叔叔住在德法交界處。', other: 'borders' },
  { id: 190, unit: 27, word: 'super', kk: '[ˋsupɚ]', part: 'a.', def: '超級的; 極好的', sentence: 'Kelly\'s teacher said that she did a super job on her essay.', senTrans: '凱莉的老師說她的文章寫得非常好。', other: '' },
  { id: 191, unit: 27, word: 'supper', kk: '[ˋsʌpɚ]', part: 'n.', def: '晚餐', sentence: 'Mother usually makes supper at seven.', senTrans: '媽媽通常在 7 點做晚飯。', other: 'suppers' }
];