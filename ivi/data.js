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
  },
// Unit 28 Stories
  {
    title: "Unit 28: The New Album",
    units: [28],
    text: "The singer released a new {album} last week. It was {brilliant} and quickly broke the {record}. She has a huge {influence} on young people. However, she looks {pale} because she is on a strict {diet}. Her fans {cheer} for her whenever she appears on a TV {channel}. She plans to {create} more songs in the future.",
    translations: [
      { text: "The singer released a new album last week.", trans: "這位歌手上週發行了一張新專輯。" },
      { text: "It was brilliant and quickly broke the record.", trans: "它非常出色，並迅速打破了紀錄。" },
      { text: "She has a huge influence on young people.", trans: "她對年輕人有巨大的影響力。" },
      { text: "However, she looks pale because she is on a strict diet.", trans: "然而，她看起來臉色蒼白，因為她正在嚴格節食。" },
      { text: "Her fans cheer for her whenever she appears on a TV channel.", trans: "每當她出現在電視頻道上，她的粉絲都會為她歡呼。" },
      { text: "She plans to create more songs in the future.", trans: "她計劃在未來創作更多歌曲。" }
    ]
  },
  {
    title: "Unit 28: Environmental Issues",
    units: [28],
    text: "We should care about our {environment}. Recently, the {temperature} has gone {beyond} normal levels. It is a {similar} situation in many countries. We simply cannot go {against} nature. Some people {blanket} the roof with solar panels to save energy. It is our {personal} duty to protect the earth before the damage is {due}.",
    translations: [
      { text: "We should care about our environment.", trans: "我們應該關心我們的環境。" },
      { text: "Recently, the temperature has gone beyond normal levels.", trans: "最近，氣溫已經超過了正常水平。" },
      { text: "It is a similar situation in many countries.", trans: "許多國家的情況都很相似。" },
      { text: "We simply cannot go against nature.", trans: "我們簡直無法違抗大自然。" },
      { text: "Some people blanket the roof with solar panels to save energy.", trans: "有些人用太陽能板覆蓋屋頂以節省能源。" },
      { text: "It is our personal duty to protect the earth before the damage is due.", trans: "在損害造成之前保護地球是我們個人的責任。" }
    ]
  },
  {
    title: "Unit 28: The Interview",
    units: [28],
    text: "I had to {accept} an invitation to an {event}. It was a meeting with a famous writer. I read the business {section} of the newspaper to prepare {material}. My mind went {blank} when I saw him. {Therefore}, I just smiled. He spoke {highly} of my questions. It was not a {usual} day for me.",
    translations: [
      { text: "I had to accept an invitation to an event.", trans: "我必須接受一個活動的邀請。" },
      { text: "It was a meeting with a famous writer.", trans: "那是與一位著名作家的會議。" },
      { text: "I read the business section of the newspaper to prepare material.", trans: "我閱讀報紙的商業版以準備素材。" },
      { text: "My mind went blank when I saw him.", trans: "當我看到他時，我的腦袋一片空白。" },
      { text: "Therefore, I just smiled.", trans: "因此，我只是微笑。" },
      { text: "He spoke highly of my questions.", trans: "他對我的問題評價很高。" },
      { text: "It was not a usual day for me.", trans: "對我來說，這不是平常的一天。" }
    ]
  },
  // Unit 29 Stories
  {
    title: "Unit 29: The Ocean Clean-up",
    units: [29],
    text: "The ocean {surface} was covered with trash. A non-profit {organization} made a {decision} to clean it. They found that many bottles {contain} harmful chemicals. The plastic {industry} is the main {source} of this pollution. They want to restore the {natural} beauty of the sea. It was a {clever} plan to help the fish live in {peace}.",
    translations: [
      { text: "The ocean surface was covered with trash.", trans: "海面被垃圾覆蓋。" },
      { text: "A non-profit organization made a decision to clean it.", trans: "一個非營利組織決定清理它。" },
      { text: "They found that many bottles contain harmful chemicals.", trans: "他們發現許多瓶子含有有害化學物質。" },
      { text: "The plastic industry is the main source of this pollution.", trans: "塑膠工業是這種污染的主要來源。" },
      { text: "They want to restore the natural beauty of the sea.", trans: "他們想要恢復海洋的自然美景。" },
      { text: "It was a clever plan to help the fish live in peace.", trans: "這是一個幫助魚類和平共處的聰明計畫。" }
    ]
  },
  {
    title: "Unit 29: Fashion Design",
    units: [29],
    text: "Linda loves {fashion}. She creates clothes with great {detail}. Recently, she won a {prize} for her design. She knows how to {manage} her time well. She used a {single} piece of cloth to make a dress. Even though she {lack}s money, she never gives up. It is {likely} that she will become famous soon.",
    translations: [
      { text: "Linda loves fashion.", trans: "琳達熱愛時尚。" },
      { text: "She creates clothes with great detail.", trans: "她創作的衣服細節非常棒。" },
      { text: "Recently, she won a prize for her design.", trans: "最近，她的設計贏得了一個獎項。" },
      { text: "She knows how to manage her time well.", trans: "她懂得如何妥善管理時間。" },
      { text: "She used a single piece of cloth to make a dress.", trans: "她用單一塊布料做了一件洋裝。" },
      { text: "Even though she lacks money, she never gives up.", trans: "即使她缺錢，她也從不放棄。" },
      { text: "It is likely that she will become famous soon.", trans: "她很有可能很快就會成名。" }
    ]
  },
  {
    title: "Unit 29: A True Story",
    units: [29],
    text: "The box was {empty}. The {actual} thief had taken everything. He wore a {mask} to hide his face. The police tried to {lift} fingerprints from the door. It is {equal} to finding a needle in a haystack. They need to go back to {basics} to solve this case. I hope the truth will {surface} soon.",
    translations: [
      { text: "The box was empty.", trans: "箱子是空的。" },
      { text: "The actual thief had taken everything.", trans: "真正的小偷把一切都拿走了。" },
      { text: "He wore a mask to hide his face.", trans: "他戴著面具遮住臉。" },
      { text: "The police tried to lift fingerprints from the door.", trans: "警方試圖從門上採集指紋。" },
      { text: "It is equal to finding a needle in a haystack.", trans: "這就像大海撈針一樣。" },
      { text: "They need to go back to basics to solve this case.", trans: "他們需要回到基本面來解決這個案件。" },
      { text: "I hope the truth will surface soon.", trans: "我希望真相能很快浮出水面。" }
    ]
  },
  // Unit 30 Stories
  {
    title: "Unit 30: The Art Gallery",
    units: [30],
    text: "The {artist} displayed his works in the {central} hall. In my {opinion}, the {quality} of his painting is high. He gained {support} from a wealthy buyer. He used his sister as a {model} for the portrait. The {entire} collection shows his {growth} as a painter. There is no {failure} here, only success.",
    translations: [
      { text: "The artist displayed his works in the central hall.", trans: "這位藝術家在中央大廳展示他的作品。" },
      { text: "In my opinion, the quality of his painting is high.", trans: "依我看，他的畫作品質很高。" },
      { text: "He gained support from a wealthy buyer.", trans: "他獲得了一位富有買家的支持。" },
      { text: "He used his sister as a model for the portrait.", trans: "他用他的妹妹作為肖像畫的模特兒。" },
      { text: "The entire collection shows his growth as a painter.", trans: "整個系列展示了他作為畫家的成長。" },
      { text: "There is no failure here, only success.", trans: "這裡沒有失敗，只有成功。" }
    ]
  },
  {
    title: "Unit 30: A Difficult Talk",
    units: [30],
    text: "I had a {conversation} with my neighbor. He is very {shy} and avoids eye contact. We talked about the {repair} of the fence. He didn't have the {nerve} to admit he broke it. I tried to {emphasize} that good {relation}s are important. {Unless} he pays for it, I will have to {remove} the old fence myself.",
    translations: [
      { text: "I had a conversation with my neighbor.", trans: "我和鄰居進行了一次對話。" },
      { text: "He is very shy and avoids eye contact.", trans: "他非常害羞，避免眼神接觸。" },
      { text: "We talked about the repair of the fence.", trans: "我們談到了圍欄的修理。" },
      { text: "He didn't have the nerve to admit he broke it.", trans: "他沒有勇氣承認是他弄壞的。" },
      { text: "I tried to emphasize that good relations are important.", trans: "我試著強調良好關係的重要性。" },
      { text: "Unless he pays for it, I will have to remove the old fence myself.", trans: "除非他付錢，否則我將不得不自己拆除舊圍欄。" }
    ]
  },
  {
    title: "Unit 30: The Hotel Stay",
    units: [30],
    text: "Upon my {arrival} at the hotel, I checked the room. They {charge} extra for internet service. The view {range}s from the city to the ocean. I am {particular} about cleanliness. I saw some {blood} on the carpet, which was terrible. I asked the manager to handle this {occur}rence immediately.",
    translations: [
      { text: "Upon my arrival at the hotel, I checked the room.", trans: "一抵達飯店，我就檢查了房間。" },
      { text: "They charge extra for internet service.", trans: "他們對網路服務額外收費。" },
      { text: "The view ranges from the city to the ocean.", trans: "視野範圍從城市延伸到海洋。" },
      { text: "I am particular about cleanliness.", trans: "我對整潔很挑剔。" },
      { text: "I saw some blood on the carpet, which was terrible.", trans: "我看到地毯上有一些血跡，這太糟糕了。" },
      { text: "I asked the manager to handle this occurrence immediately.", trans: "我要求經理立即處理這個事件。" }
    ]
  },
  // Unit 31 Stories
  {
    title: "Unit 31: The Lost Wallet",
    units: [31],
    text: "I suffered a {loss} yesterday. My {wallet} was stolen. The thief played a {trick} on me to distract my attention. It contained a {sample} of my work and some cash. I felt like I was facing an {enemy}. I had to go to the police station to fill out a {form}. It was a great {difficulty} for me.",
    translations: [
      { text: "I suffered a loss yesterday.", trans: "我昨天遭受了損失。" },
      { text: "My wallet was stolen.", trans: "我的錢包被偷了。" },
      { text: "The thief played a trick on me to distract my attention.", trans: "小偷對我耍了個把戲來分散我的注意力。" },
      { text: "It contained a sample of my work and some cash.", trans: "裡面有我的工作樣品和一些現金。" },
      { text: "I felt like I was facing an enemy.", trans: "我覺得我像是在面對敵人。" },
      { text: "I had to go to the police station to fill out a form.", trans: "我必須去警察局填寫表格。" },
      { text: "It was a great difficulty for me.", trans: "這對我來說是一個巨大的困難。" }
    ]
  },
  {
    title: "Unit 31: A Wedding Toast",
    units: [31],
    text: "We {gather}ed to celebrate the wedding. The happy {couple} stood in front of us. I proposed a {toast} to wish them happiness. I have deep {respect} for their love. The {whole} room was full of joy. The groom said the {meaning} of marriage is to share life together. Everyone was {confident} about their future.",
    translations: [
      { text: "We gathered to celebrate the wedding.", trans: "我們聚集在一起慶祝婚禮。" },
      { text: "The happy couple stood in front of us.", trans: "這對幸福的夫婦站在我們面前。" },
      { text: "I proposed a toast to wish them happiness.", trans: "我舉杯祝他們幸福。" },
      { text: "I have deep respect for their love.", trans: "我對他們的愛深表尊敬。" },
      { text: "The whole room was full of joy.", trans: "整個房間充滿了歡樂。" },
      { text: "The groom said the meaning of marriage is to share life together.", trans: "新郎說婚姻的意義在於共同分享生活。" },
      { text: "Everyone was confident about their future.", trans: "大家對他們的未來充滿信心。" }
    ]
  },
  {
    title: "Unit 31: Shipping Goods",
    units: [31],
    text: "The company wants to {trade} with partners in {distant} lands. We send the goods by {express} mail. We need to {weigh} every package carefully. In {addition}, we must make sure the box is {shut} tight. Even a small error can cause a problem to some {degree}. We don't want to see any {wound} on the products.",
    translations: [
      { text: "The company wants to trade with partners in distant lands.", trans: "公司想要與遙遠國度的夥伴進行貿易。" },
      { text: "We send the goods by express mail.", trans: "我們用快遞寄送貨物。" },
      { text: "We need to weigh every package carefully.", trans: "我們需要仔細稱重每個包裹。" },
      { text: "In addition, we must make sure the box is shut tight.", trans: "此外，我們必須確保箱子緊緊關上。" },
      { text: "Even a small error can cause a problem to some degree.", trans: "即使是一個小錯誤也在某種程度上會造成問題。" },
      { text: "We don't want to see any wound on the products.", trans: "我們不想看到產品上有任何損傷。" }
    ]
  },


// --- Unit 202510 Stories (October) ---
  {
    title: "Unit 202510: The City Tour",
    units: [202510],
    // Days: 1, 2, 3, 6
    text: "We took a {train} to the {city}. It was {lovely}. We played {tennis} and {volleyball}. It was a {wonder} on {Earth}. The {powerful} engine gave us a smooth {ride}. We took a {tour}. Then we saw people {dance}. The {main} {decoration} was big. I gave my mom a {hug}. We ate {stew} with {bean}s and {vinegar}. We used a {microwave} to heat it. Then we {wash}ed up. {Inside} the kitchen, we used a {paper towel}.",
    translations: [
      { text: "We took a train to the city.", trans: "我們搭火車去城市。" },
      { text: "It was lovely.", trans: "那裡很美好。" },
      { text: "We played tennis and volleyball.", trans: "我們打了網球和排球。" },
      { text: "It was a wonder on Earth.", trans: "那真是世上的奇觀。" },
      { text: "The powerful engine gave us a smooth ride.", trans: "強力的引擎讓旅程很平順。" },
      { text: "We took a tour.", trans: "我們參加了導覽。" },
      { text: "Then we saw people dance.", trans: "然後我們看到人們跳舞。" },
      { text: "The main decoration was big.", trans: "主要的裝飾很大。" },
      { text: "I gave my mom a hug.", trans: "我擁抱了媽媽。" },
      { text: "We ate stew with beans and vinegar.", trans: "我們吃了加豆子和醋的燉菜。" },
      { text: "We used a microwave to heat it.", trans: "我們用微波爐加熱它。" },
      { text: "Then we washed up.", trans: "然後我們清洗餐具。" },
      { text: "Inside the kitchen, we used a paper towel.", trans: "在廚房裡，我們使用了紙巾。" }
    ]
  },
  {
    title: "Unit 202510: The Formal Event",
    units: [202510],
    // Days: 7, 8, 9, 10
    text: "He wore a {suit} and I wore a {dress} to the {film}. We were {almost} late so we didn't {wait}. I was {able} to go because I was {free}. Is the seat {available}? We need to {figure out} the plan and {mark} the date. I am {sure} it will happen {suddenly}. Can you {make it}? I will {take the day off}. There is {nothing} to worry about. We need a {gram} of sugar. We ate {boiled} eggs. I like to {cook}. The {event} was fun. We helped {decorate}.",
    translations: [
      { text: "He wore a suit and I wore a dress to the film.", trans: "他穿西裝，我穿洋裝去看電影。" },
      { text: "We were almost late so we didn't wait.", trans: "我們差點遲到，所以沒有等。" },
      { text: "I was able to go because I was free.", trans: "我能去是因為我有空。" },
      { text: "Is the seat available?", trans: "這座位有人坐嗎？" },
      { text: "We need to figure out the plan and mark the date.", trans: "我們需要想出計畫並標記日期。" },
      { text: "I am sure it will happen suddenly.", trans: "我確定事情會發生得很突然。" },
      { text: "Can you make it?", trans: "你能趕上嗎？" },
      { text: "I will take the day off.", trans: "我會請假。" },
      { text: "There is nothing to worry about.", trans: "沒什麼好擔心的。" },
      { text: "We need a gram of sugar.", trans: "我們需要一公克的糖。" },
      { text: "We ate boiled eggs.", trans: "我們吃了水煮蛋。" },
      { text: "I like to cook.", trans: "我喜歡烹飪。" },
      { text: "The event was fun.", trans: "活動很有趣。" },
      { text: "We helped decorate.", trans: "我們幫忙裝飾。" }
    ]
  },
  {
    title: "Unit 202510: Table Manners",
    units: [202510],
    // Days: 13, 14, 15, 16
    text: "I found the {key} in my {pocket}. It was not in the {drawer}. It was {between} the books {next to} the lamp. We must have good {manners}. Keep your {elbow} off the table. Be {polite}. Don't talk with your {mouth} full. {For example}, sit up straight. Use your {left} hand. Use a {fork} and {spoon}, or a {chopstick}. Don't {point} at people. The food looked {familiar}. It looked like a {frog}, an {elephant}, or a {kangaroo}. That is {unusual}.",
    translations: [
      { text: "I found the key in my pocket.", trans: "我在口袋裡找到了鑰匙。" },
      { text: "It was not in the drawer.", trans: "它不在抽屜裡。" },
      { text: "It was between the books next to the lamp.", trans: "它在檯燈旁的書本之間。" },
      { text: "We must have good manners.", trans: "我們必須有良好的禮儀。" },
      { text: "Keep your elbow off the table.", trans: "手肘不要放在桌上。" },
      { text: "Be polite.", trans: "要有禮貌。" },
      { text: "Don't talk with your mouth full.", trans: "嘴裡有食物時不要說話。" },
      { text: "For example, sit up straight.", trans: "舉例來說，坐直。" },
      { text: "Use your left hand.", trans: "用你的左手。" },
      { text: "Use a fork and spoon, or a chopstick.", trans: "使用叉子和湯匙，或筷子。" },
      { text: "Don't point at people.", trans: "不要指著別人。" },
      { text: "The food looked familiar.", trans: "食物看起來很眼熟。" },
      { text: "It looked like a frog, an elephant, or a kangaroo.", trans: "它看起來像青蛙、大象或袋鼠。" },
      { text: "That is unusual.", trans: "那很不尋常。" }
    ]
  },
  {
    title: "Unit 202510: The Hidden Dragon",
    units: [202510],
    // Days: 17, 20, 21, 22
    text: "We went to an {unknown} place. We saw a {dragon}. It was not {ugly}. It had big {muscle}s. It lived {deep} in a cave. We ate {pie}, {pumpkin}, {cake}, {cookie}, and a {pear}. The {passenger} was {slow}. I had a bad {feeling}. I tried to {focus} but I needed a {nap}. We decided to {build} a house of {straw}, {stick}, and {brick}. He had {hair} on his {chin}.",
    translations: [
      { text: "We went to an unknown place.", trans: "我們去了一個未知的地方。" },
      { text: "We saw a dragon.", trans: "我們看見了一條龍。" },
      { text: "It was not ugly.", trans: "它並不醜陋。" },
      { text: "It had big muscles.", trans: "它有大肌肉。" },
      { text: "It lived deep in a cave.", trans: "它住在深處的洞穴裡。" },
      { text: "We ate pie, pumpkin, cake, cookie, and a pear.", trans: "我們吃了派、南瓜、蛋糕、餅乾和梨子。" },
      { text: "The passenger was slow.", trans: "那個乘客動作很慢。" },
      { text: "I had a bad feeling.", trans: "我有種不好的預感。" },
      { text: "I tried to focus but I needed a nap.", trans: "我試著專注但我需要小睡一下。" },
      { text: "We decided to build a house of straw, stick, and brick.", trans: "我們決定用稻草、樹枝和磚塊蓋房子。" },
      { text: "He had hair on his chin.", trans: "他下巴有毛。" }
    ]
  },
  {
    title: "Unit 202510: Sports Day",
    units: [202510],
    // Days: 23, 24, 27, 28
    text: "I heard a {knock} and a {cry}. Take a deep {breath}. Look at the {pot}. The {wise} man said to {recycle} {waste}. The {machine} made the paper {flat}. We can {print} on it. It is made of {metal}. We played {soccer}. Every {adult} went to the {yard}. The {player} tried to {score}. American {football} is fun. {Shoot} the ball! The fans went {crazy}. They {wave}d a flag and wore a {scarf}.",
    translations: [
      { text: "I heard a knock and a cry.", trans: "我聽到敲門聲和叫喊聲。" },
      { text: "Take a deep breath.", trans: "深呼吸。" },
      { text: "Look at the pot.", trans: "看那個鍋子。" },
      { text: "The wise man said to recycle waste.", trans: "智者說要回收垃圾。" },
      { text: "The machine made the paper flat.", trans: "機器把紙壓平了。" },
      { text: "We can print on it.", trans: "我們可以印在上面。" },
      { text: "It is made of metal.", trans: "它是金屬製的。" },
      { text: "We played soccer.", trans: "我們踢足球。" },
      { text: "Every adult went to the yard.", trans: "每個大人都去了操場。" },
      { text: "The player tried to score.", trans: "球員試圖得分。" },
      { text: "American football is fun.", trans: "美式足球很有趣。" },
      { text: "Shoot the ball!", trans: "射門！" },
      { text: "The fans went crazy.", trans: "粉絲們瘋狂了。" },
      { text: "They waved a flag and wore a scarf.", trans: "他們揮舞旗幟並戴著圍巾。" }
    ]
  },
  {
    title: "Unit 202510: Daily Goals",
    units: [202510],
    // Days: 29, 30, 31
    text: "It is my {daily} routine to {wake up} early. The {alarm} rang. I looked at the {screen}. My phone battery might {die}. Don't {spend} too much time. It is a bad {habit}. {Set} a time {limit}. I {appreciate} your help. I had {trouble} with the math. Help me {solve} it. It is {exciting} to {improve}. Life is an {adventure}.",
    translations: [
      { text: "It is my daily routine to wake up early.", trans: "早起是我的日常慣例。" },
      { text: "The alarm rang.", trans: "鬧鐘響了。" },
      { text: "I looked at the screen.", trans: "我看了看螢幕。" },
      { text: "My phone battery might die.", trans: "我手機電池可能快沒電了。" },
      { text: "Don't spend too much time.", trans: "不要花太多時間。" },
      { text: "It is a bad habit.", trans: "那是個壞習慣。" },
      { text: "Set a time limit.", trans: "設定時間限制。" },
      { text: "I appreciate your help.", trans: "我感謝你的幫忙。" },
      { text: "I had trouble with the math.", trans: "我數學遇到困難。" },
      { text: "Help me solve it.", trans: "幫我解決它。" },
      { text: "It is exciting to improve.", trans: "進步是令人興奮的。" },
      { text: "Life is an adventure.", trans: "人生是一場冒險。" }
    ]
  },

// --- Unit 202511 Stories (November) ---
  {
    title: "Unit 202511: The Apartment Idea",
    units: [202511],
    // Days: 3, 4, 5
    text: "My {wife} and I act like a new {couple}. We had an {idea} to {explore} a {high} {apartment}. We took the {elevator} and saw a {terrific} view. But we had to {face} a problem: we {run out of} money. We looked at the {menu} but didn't {expect} the price. We found the {exit} and walked a {meter} away to {row} a boat instead.",
    translations: [
      { text: "My wife and I act like a new couple.", trans: "我和我太太表現得像一對新婚夫婦。" },
      { text: "We had an idea to explore a high apartment.", trans: "我們有個點子要去探索一間高樓層公寓。" },
      { text: "We took the elevator and saw a terrific view.", trans: "我們搭電梯並看到了極好的景色。" },
      { text: "But we had to face a problem: we run out of money.", trans: "但我們必須面對一個問題：我們錢用完了。" },
      { text: "We looked at the menu but didn't expect the price.", trans: "我們看了菜單但沒料到那個價格。" },
      { text: "We found the exit and walked a meter away to row a boat instead.", trans: "我們找到出口並走了一公尺遠去改為划船。" }
    ]
  },
  {
    title: "Unit 202511: The Active Hunter",
    units: [202511],
    // Days: 6, 7, 10
    text: "An {active} {hunter} likes the {style} of nature. He made a {drawing} of an {owl} with a {serious} {eye}. He is a {member} of a club that keeps an old {custom}. He is {thankful} for the food. He grows {cabbage}, {lettuce}, {onion}, {green bean}, and {corn}. It is hard work.",
    translations: [
      { text: "An active hunter likes the style of nature.", trans: "一位活躍的獵人喜歡大自然的風格。" },
      { text: "He made a drawing of an owl with a serious eye.", trans: "他畫了一隻眼神嚴肅的貓頭鷹。" },
      { text: "He is a member of a club that keeps an old custom.", trans: "他是一個保有舊習俗的俱樂部成員。" },
      { text: "He is thankful for the food.", trans: "他對食物心存感激。" },
      { text: "He grows cabbage, lettuce, onion, green bean, and corn.", trans: "他種植高麗菜、生菜、洋蔥、四季豆和玉米。" },
      { text: "It is hard work.", trans: "這是辛苦的工作。" }
    ]
  },
  {
    title: "Unit 202511: Quiet Neighborhood",
    units: [202511],
    // Days: 11, 12, 13
    text: "I live in an {amazing} {neighborhood}. It is {quiet} and {bright}. I sat on the {balcony} to {finish} my lunch of {spinach}, {broccoli}, and {squash}. I saw a cat {climb} a {wall} near the {base} of a tree. The path is {narrow}, so I {worry} about my {pin} falling down.",
    translations: [
      { text: "I live in an amazing neighborhood.", trans: "我住在一個令人驚嘆的社區。" },
      { text: "It is quiet and bright.", trans: "這裡安靜且明亮。" },
      { text: "I sat on the balcony to finish my lunch of spinach, broccoli, and squash.", trans: "我坐在陽台吃完了我的午餐：菠菜、花椰菜和南瓜。" },
      { text: "I saw a cat climb a wall near the base of a tree.", trans: "我看見一隻貓在樹的底部附近爬牆。" },
      { text: "The path is narrow, so I worry about my pin falling down.", trans: "小徑很窄，所以我擔心我的別針掉下去。" }
    ]
  },
  {
    title: "Unit 202511: Special Dinner",
    units: [202511],
    // Days: 14, 17, 18
    text: "We sat {around} a {dish} of {rice}. Everyone started to {clap} at the {sound} of music. The {place} seemed {rich} with a {special} {flower}. In the {darkness}, a {treasure} seemed to {shine}. We read a {poem} under a {blanket}. It was a warm night.",
    translations: [
      { text: "We sat around a dish of rice.", trans: "我們圍坐在一盤飯旁。" },
      { text: "Everyone started to clap at the sound of music.", trans: "聽到音樂聲，大家都開始鼓掌。" },
      { text: "The place seemed rich with a special flower.", trans: "這個地方似乎因一朵特別的花而顯得豐富。" },
      { text: "In the darkness, a treasure seemed to shine.", trans: "在黑暗中，寶藏似乎在閃耀。" },
      { text: "We read a poem under a blanket.", trans: "我們在毯子下讀了一首詩。" },
      { text: "It was a warm night.", trans: "那是個溫暖的夜晚。" }
    ]
  },
  {
    title: "Unit 202511: The Garage Sale",
    units: [202511],
    // Days: 19, 20, 21
    text: "I decided to {choose} a {gift} at the {garage} sale. I saw a {used} {package} that was {valuable}. I had to {yell} to my friend to {grab} it {easily}. We should {reuse} and not {throw away}. {Unfortunately}, I had no money in my {account}, so I could not {sell} or buy. I had to {stay} home.",
    translations: [
      { text: "I decided to choose a gift at the garage sale.", trans: "我決定在車庫拍賣選一個禮物。" },
      { text: "I saw a used package that was valuable.", trans: "我看見一個值錢的二手包裹。" },
      { text: "I had to yell to my friend to grab it easily.", trans: "我必須對朋友大喊以便輕鬆抓住它。" },
      { text: "We should reuse and not throw away.", trans: "我們應該重複使用而不是丟棄。" },
      { text: "Unfortunately, I had no money in my account, so I could not sell or buy.", trans: "不幸的是，我帳戶沒錢，所以我不能買賣。" },
      { text: "I had to stay home.", trans: "我必須待在家。" }
    ]
  },
  {
    title: "Unit 202511: Business Call",
    units: [202511],
    // Days: 24, 25, 26, 27, 28 (Combined)
    text: "I tried to {dial} the number to get {information} about the {bill}. I was {on hold} but the clerk said {welcome}. I made an {appointment} to {visit}. He used a {slide} to {explain} the {environment} issue. Please {follow} the {guide} and pay {attention}. Don't {miss} the {phrase} on the screen.",
    translations: [
      { text: "I tried to dial the number to get information about the bill.", trans: "我試著撥號以獲取關於帳單的資訊。" },
      { text: "I was on hold but the clerk said welcome.", trans: "我被保留通話，但店員說了歡迎。" },
      { text: "I made an appointment to visit.", trans: "我預約了拜訪。" },
      { text: "He used a slide to explain the environment issue.", trans: "他用投影片解釋環境議題。" },
      { text: "Please follow the guide and pay attention.", trans: "請跟隨導引並注意。" },
      { text: "Don't miss the phrase on the screen.", trans: "別錯過螢幕上的片語。" }
    ]
  },

{
    title: "Unit 202512: Winter Vacation",
    units: [202512],
    // Dates: 1, 2, 3, 4
    text: "We were {excited} about the {holiday}. {During} the day, we played {cards} and solved a {puzzle} {indoor}. It was {easy} and {comfortable}. Then we saw {snow} on the {mountain}. We decided to {hike} in the {forest}. We asked for {directions} to a {secret} path. It was great {exercise} to ride a {bike} {outdoor}. We like to {share} stories.",
    translations: [
      { text: "We were excited about the holiday.", trans: "我們對假期感到興奮。" },
      { text: "During the day, we played cards and solved a puzzle indoor.", trans: "白天，我們在室內玩紙牌和拼圖。" },
      { text: "It was easy and comfortable.", trans: "這很輕鬆舒適。" },
      { text: "Then we saw snow on the mountain.", trans: "然後我們看見山上有雪。" },
      { text: "We decided to hike in the forest.", trans: "我們決定去森林健行。" },
      { text: "We asked for directions to a secret path.", trans: "我們詢問了一條祕密小徑的方向。" },
      { text: "It was great exercise to ride a bike outdoor.", trans: "在戶外騎腳踏車是很好的運動。" },
      { text: "We like to share stories.", trans: "我們喜歡分享故事。" }
    ]
  },
  {
    title: "Unit 202512: The Cookie Thief",
    units: [202512],
    // Dates: 5, 8, 9, 10
    text: "I visited a small {village}. I wanted to make {homemade} cookies for a {party}. I bought {flour}, {sugar}, {peanut butter}, and a bag of {chocolate chip}s. I had to {roll} the {dough} carefully. I wrote the recipe in my {notebook}. Someone tried to {steal} a cookie from the {mug}. I had to {cross} the room to {capture} the thief. It was just my brother wanting {another} one.",
    translations: [
      { text: "I visited a small village.", trans: "我拜訪了一個小村莊。" },
      { text: "I wanted to make homemade cookies for a party.", trans: "我想為派對做自製餅乾。" },
      { text: "I bought flour, sugar, peanut butter, and a bag of chocolate chips.", trans: "我買了麵粉、糖、花生醬和一袋巧克力豆。" },
      { text: "I had to roll the dough carefully.", trans: "我必須仔細地桿麵團。" },
      { text: "I wrote the recipe in my notebook.", trans: "我把食譜寫在筆記本裡。" },
      { text: "Someone tried to steal a cookie from the mug.", trans: "有人試圖從馬克杯裡偷餅乾。" },
      { text: "I had to cross the room to capture the thief.", trans: "我必須穿過房間去抓小偷。" },
      { text: "It was just my brother wanting another one.", trans: "原來只是我弟弟想要再來一塊。" }
    ]
  },
  {
    title: "Unit 202512: Roommate Life",
    units: [202512],
    // Dates: 11, 12, 15, 16
    text: "My {roommate} and I went to the {market} to buy {fish}, {salt}, and {honey}. We walked past the {public} {library} and the town {hall}. We saw a big {balloon} flying {north} over the {lake}. It was hot and we started to {sweat}. We decided to {chill} some drinks. Don't {complain} about the heat. {Think} about your {education} and follow every {step} to success. Don't be {lonely}.",
    translations: [
      { text: "My roommate and I went to the market to buy fish, salt, and honey.", trans: "我和室友去市場買魚、鹽和蜂蜜。" },
      { text: "We walked past the public library and the town hall.", trans: "我們走過公共圖書館和市政廳。" },
      { text: "We saw a big balloon flying north over the lake.", trans: "我們看見一個大氣球飛越湖面往北飛。" },
      { text: "It was hot and we started to sweat.", trans: "天氣很熱，我們開始流汗。" },
      { text: "We decided to chill some drinks.", trans: "我們決定冰鎮一些飲料。" },
      { text: "Don't complain about the heat.", trans: "不要抱怨天氣熱。" },
      { text: "Think about your education and follow every step to success.", trans: "想想你的教育並遵循每一個成功的步驟。" },
      { text: "Don't be lonely.", trans: "不要感到寂寞。" }
    ]
  },
  {
    title: "Unit 202512: A Helpful Stranger",
    units: [202512],
    // Dates: 17, 18, 19, 22
    text: "I left my {wallet} in my {jacket} at a {restaurant} not {far} away. A {helpful} man found it on the {sidewalk}. He was from {France} but spoke good {English}. We talked for a {while}. He told me about a {gentle} {deer} in {Japan}. He said {wild} animals can {smell} {danger} and {get away}. I bought a {bunch} of flowers to thank him. He {probably} saved my day.",
    translations: [
      { text: "I left my wallet in my jacket at a restaurant not far away.", trans: "我把錢包留在不遠處一家餐廳的夾克裡。" },
      { text: "A helpful man found it on the sidewalk.", trans: "一位熱心的男士在人行道上發現了它。" },
      { text: "He was from France but spoke good English.", trans: "他來自法國但英文說得很好。" },
      { text: "We talked for a while.", trans: "我們聊了一會兒。" },
      { text: "He told me about a gentle deer in Japan.", trans: "他跟我說了關於日本溫馴的鹿的事。" },
      { text: "He said wild animals can smell danger and get away.", trans: "他說野生動物能聞到危險並逃脫。" },
      { text: "I bought a bunch of flowers to thank him.", trans: "我買了一束花謝謝他。" },
      { text: "He probably saved my day.", trans: "他大概拯救了我的一天。" }
    ]
  },
  {
    title: "Unit 202512: Christmas Eve",
    units: [202512],
    // Dates: 23, 24, 25, 26
    text: "On Christmas {Eve}, we lit a {candle} in the {living room}. I saw a {spider} on a {wood} {branch} in the {corner}. My dad used a {bucket} to {feed} the animals. He is a {patient} man. I took a {picture} of the {sunlight} hitting the {silver} snow. It was {such} a beautiful scene. I {believe} this {project} brings us {joy}. We didn't pay a {fee} to enjoy nature.",
    translations: [
      { text: "On Christmas Eve, we lit a candle in the living room.", trans: "在聖誕夜，我們在客廳點了一支蠟燭。" },
      { text: "I saw a spider on a wood branch in the corner.", trans: "我看見角落的木頭樹枝上有一隻蜘蛛。" },
      { text: "My dad used a bucket to feed the animals.", trans: "我爸爸用水桶餵動物。" },
      { text: "He is a patient man.", trans: "他是個有耐心的人。" },
      { text: "I took a picture of the sunlight hitting the silver snow.", trans: "我拍了一張陽光照在銀色雪地上的照片。" },
      { text: "It was such a beautiful scene.", trans: "真是個美麗的景色。" },
      { text: "I believe this project brings us joy.", trans: "我相信這個計畫帶給我們快樂。" },
      { text: "We didn't pay a fee to enjoy nature.", trans: "我們沒有付費就享受了大自然。" }
    ]
  },
  {
    title: "Unit 202512: New Year Goals",
    units: [202512],
    // Dates: 29, 30, 31
    text: "My {goal} is to {save} money to {travel}. I want to {return} to the place where we had the {wedding}. I remember the {date} well. {Congratulations} to us! We {plan} to {hire} a car. We will buy {fruit}, {milk}, and {soap} there. Swimming is a good {sport} to {consider}. I can't eat {dairy}, but I love the trip.",
    translations: [
      { text: "My goal is to save money to travel.", trans: "我的目標是存錢去旅行。" },
      { text: "I want to return to the place where we had the wedding.", trans: "我想回到我們舉行婚禮的地方。" },
      { text: "I remember the date well.", trans: "我記得很清楚那個日期。" },
      { text: "Congratulations to us!", trans: "恭喜我們！" },
      { text: "We plan to hire a car.", trans: "我們計畫租一輛車。" },
      { text: "We will buy fruit, milk, and soap there.", trans: "我們會在那裡買水果、牛奶和肥皂。" },
      { text: "Swimming is a good sport to consider.", trans: "游泳是個值得考慮的好運動。" },
      { text: "I can't eat dairy, but I love the trip.", trans: "我不能吃乳製品，但我愛這趟旅行。" }
    ]
  },
];

