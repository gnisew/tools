const qaData = [
  // --- 第 1 回 ---
  {
    round: 1, id: 1,
    q: "What do you usually do on weekends?",
    q_cn: "你週末通常都在做什麼？",
    a: "I draw anime characters, read light novels, and play piano at home. Sometimes I meet friends for delicious food.",
    a_cn: "我在家畫動漫人物、看輕小說和彈鋼琴。有時候我會和朋友見面去吃好吃的。"
  },
  {
    round: 1, id: 2,
    q: "Where do you like to go shopping?",
    q_cn: "你喜歡去哪裡購物？",
    a: "I love online shopping for art supplies and cute Japanese manga books. It's so convenient!",
    a_cn: "我喜歡上網買美術用品和可愛的日本漫畫書。這非常方便！"
  },
  {
    round: 1, id: 3,
    q: "What do you like to eat for breakfast?",
    q_cn: "你早餐喜歡吃什麼？",
    a: "My favorite is a Western-style breakfast with toast, jam, and a big glass of milk. It’s quick and yummy.",
    a_cn: "我最喜歡西式早餐，有吐司、果醬和一大杯牛奶。既快速又美味。"
  },
  {
    round: 1, id: 4,
    q: "Do you like to exercise?",
    q_cn: "你喜歡運動嗎？",
    a: "I don't exercise much, but I love walking to nearby stores for snacks. Drawing and piano practice keep me busy!",
    a_cn: "我不太運動，但我喜歡走到附近的商店買零食。畫畫和練鋼琴讓我非常忙碌！"
  },
  {
    round: 1, id: 5,
    q: "What do you usually do after work or school?",
    q_cn: "你放學或下班後通常做什麼？",
    a: "After school, I do my homework fast, then draw or practice piano. I relax by reading my favorite books.",
    a_cn: "放學後，我會快速寫完功課，然後畫畫或練琴。我透過閱讀我最愛的書來放鬆。"
  },
  {
    round: 1, id: 6,
    q: "How do you usually get to work or school?",
    q_cn: "你通常怎麼去上班或上學？",
    a: "My parents drive me to the school bus stop, then I take the bus. It’s faster and safer that way.",
    a_cn: "我父母載我到校車站，然後我搭校車。那樣比較快也比較安全。"
  },
  {
    round: 1, id: 7,
    q: "What do you like to do when it rains?",
    q_cn: "下雨時你喜歡做什麼？",
    a: "I stay cozy inside, watch Japanese anime, and draw characters from the show. It's the best time for art.",
    a_cn: "我會舒適地待在室內，看日本動漫，並畫劇中的角色。這是做藝術最好的時光。"
  },
  // --- 第 2 回 ---
  {
    round: 2, id: 1,
    q: "When is your birthday?",
    q_cn: "你的生日是什麼時候？",
    a: "My birthday is in spring. I usually celebrate by having a special dinner with my family at a fancy restaurant.",
    a_cn: "我的生日在春天。我通常會和家人去高級餐廳吃頓特別的晚餐來慶祝。"
  },
  {
    round: 2, id: 2,
    q: "Do you enjoy learning English? Why or why not?",
    q_cn: "你喜歡學英文嗎？為什麼？",
    a: "Yes, I enjoy it! I love reading English books and light novels. It helps me understand foreign culture better.",
    a_cn: "是的，我很喜歡！我愛看英文書和輕小說。這幫助我更了解外國文化。"
  },
  {
    round: 2, id: 3,
    q: "How many people are there in your family? Who are they?",
    q_cn: "你家有幾個人？有誰？",
    a: "There are four people: my parents, my younger brother, and me. We enjoy eating delicious food together.",
    a_cn: "有四個人：我父母、我弟弟和我。我們喜歡一起享用美食。"
  },
  {
    round: 2, id: 4,
    q: "Have you ever been abroad?",
    q_cn: "你有出過國嗎？",
    a: "No, but I really want to visit Japan to try the food and see the places in my favorite anime shows.",
    a_cn: "沒有，但我真的很想去日本嘗嘗美食，並看看我最愛動漫裡的場景。"
  },
  {
    round: 2, id: 5,
    q: "What kind of sport do you like to play?",
    q_cn: "你喜歡做什麼運動？",
    a: "I don't play sports, but I sometimes do stretching exercises. I prefer drawing or playing the piano for fun.",
    a_cn: "我不做運動，但我有時會做伸展操。我比較喜歡畫畫或彈琴來娛樂。"
  },
  {
    round: 2, id: 6,
    q: "Do you have a lucky number? What is it?",
    q_cn: "你有幸運數字嗎？是多少？",
    a: "My lucky number is 7. I use it for passwords, and I feel like it brings me good luck on tests.",
    a_cn: "我的幸運數字是7。我用它當密碼，而且我覺得它在考試時帶給我好運。"
  },
  {
    round: 2, id: 7,
    q: "Are you a shy or outgoing person?",
    q_cn: "你是個害羞還是外向的人？",
    a: "I'm generally quiet, but when I talk about food or anime, I become really outgoing and talkative.",
    a_cn: "我通常很安靜，但當我談論食物或動漫時，我會變得非常外向且健談。"
  },
  // --- 第 3 回 ---
  {
    round: 3, id: 1,
    q: "Do you love outdoor activities?",
    q_cn: "你喜歡戶外活動嗎？",
    a: "Not really. I prefer staying inside where I can read, draw, and practice piano comfortably, away from the heat.",
    a_cn: "不怎麼喜歡。我比較喜歡待在室內，可以舒服地閱讀、畫畫和練琴，遠離炎熱。"
  },
  {
    round: 3, id: 2,
    q: "What's the first thing you do after you wake up?",
    q_cn: "你起床後做的第一件事是什麼？",
    a: "The first thing I do is check my phone for updates. Then I get ready for school quickly before my parents drive me.",
    a_cn: "我做的第一件事是看手機有沒有新訊息。然後在父母載我之前快速準備上學。"
  },
  {
    round: 3, id: 3,
    q: "Have you ever shopped online?",
    q_cn: "你有網購過嗎？",
    a: "Yes, I shop online often! I buy drawing supplies, books, and Japanese snacks. It is very convenient.",
    a_cn: "有，我常網購！我買畫具、書和日本零食。非常方便。"
  },
  {
    round: 3, id: 4,
    q: "Do you like to go to night markets?",
    q_cn: "你喜歡去夜市嗎？",
    a: "Yes! I love the snacks, especially the local street foods. The lively atmosphere is so enjoyable and fun.",
    a_cn: "喜歡！我愛那些小吃，特別是當地街頭美食。熱鬧的氣氛很令人享受且有趣。"
  },
  {
    round: 3, id: 5,
    q: "Do you prefer cooking at home or eating out?",
    q_cn: "你比較喜歡在家煮還是出去吃？",
    a: "Eating out. I love trying new delicious foods, and I don't really know how to cook myself.",
    a_cn: "出去吃。我喜歡嘗試新的美食，而且我不太會自己煮。"
  },
  {
    round: 3, id: 6,
    q: "How many languages do you speak?",
    q_cn: "你會說幾種語言？",
    a: "I speak Chinese and English. I’m also learning some Japanese to watch anime without subtitles!",
    a_cn: "我會說中文和英文。我因為想看動漫不用字幕，也在學一些日文！"
  },
  {
    round: 3, id: 7,
    q: "What kind of movies do you like the most?",
    q_cn: "你最喜歡哪種電影？",
    a: "I love animation movies, especially Japanese anime films. They have beautiful drawings and exciting stories.",
    a_cn: "我喜歡動畫電影，特別是日本動畫片。它們有美麗的畫風和刺激的故事。"
  },
  // --- 第 4 回 ---
  {
    round: 4, id: 1,
    q: "What did you eat for dinner yesterday?",
    q_cn: "你昨天晚餐吃什麼？",
    a: "I had delicious ramen noodles with pork and vegetables. My dad cooked it, and it was super yummy!",
    a_cn: "我吃了美味的豬肉蔬菜拉麵。我爸煮的，超級好吃！"
  },
  {
    round: 4, id: 2,
    q: "Are you a dog person or a cat person?",
    q_cn: "你是狗派還是貓派？",
    a: "I am a cat person. Cats are cute and independent. I love watching videos of them being lazy.",
    a_cn: "我是貓派。貓很可愛又獨立。我喜歡看牠們懶洋洋的影片。"
  },
  {
    round: 4, id: 3,
    q: "What would you do if you had a week off?",
    q_cn: "如果你有一週的假，你會做什麼？",
    a: "I would draw a lot of new artwork and practice new piano pieces. I'd also try a famous local dessert place.",
    a_cn: "我會畫很多新作品並練習新的鋼琴曲。我也會去試試當地有名的甜點店。"
  },
  {
    round: 4, id: 4,
    q: "How much time do you spend using your phone in a day?",
    q_cn: "你一天花多少時間滑手機？",
    a: "Maybe three hours a day. I use it for texting friends, listening to music while drawing, and watching anime.",
    a_cn: "大概一天三小時。我用來傳訊息給朋友、畫畫時聽音樂，還有看動漫。"
  },
  {
    round: 4, id: 5,
    q: "Who do you usually talk to when you feel upset?",
    q_cn: "你心情不好時通常會跟誰說？",
    a: "I talk to my mom. She always listens to me patiently and gives me supportive advice about school and friends.",
    a_cn: "我會跟我媽說。她總是耐心聽我說，並給我關於學校和朋友的支持建議。"
  },
  {
    round: 4, id: 6,
    q: "Have you made any plans for the weekend?",
    q_cn: "你這週末有什麼計畫嗎？",
    a: "I plan to visit a new bookstore and then try the famous bubble tea shop. I also need to finish my drawing project.",
    a_cn: "我計畫去逛一間新書店，然後去喝那家有名的珍珠奶茶。我還得完成我的繪畫作業。"
  },
  {
    round: 4, id: 7,
    q: "Do you have any hobbies?",
    q_cn: "你有什麼嗜好嗎？",
    a: "Drawing is my main hobby. I also love playing the piano and trying new and exciting restaurants.",
    a_cn: "畫畫是我的主要嗜好。我也喜歡彈鋼琴和嘗試新奇的餐廳。"
  },
  // --- 第 5 回 ---
  {
    round: 5, id: 1,
    q: "What's your must-eat when you go to a night market?",
    q_cn: "你去夜市必吃的是什麼？",
    a: "Bubble tea! I love the chewy tapioca pearls and the creamy, sweet milk tea flavor. It's the best treat.",
    a_cn: "珍珠奶茶！我喜歡有嚼勁的珍珠和香甜的奶茶味。這是最棒的享受。"
  },
  {
    round: 5, id: 2,
    q: "What is your favorite season? Why?",
    q_cn: "你最喜歡哪個季節？為什麼？",
    a: "Fall! The weather is cool and perfect for staying in to read books and draw without feeling hot or sticky.",
    a_cn: "秋天！天氣很涼爽，非常適合待在室內看書畫畫，不會覺得熱或黏膩。"
  },
  {
    round: 5, id: 3,
    q: "Do you prefer waking up early or staying up late?",
    q_cn: "你比較喜歡早起還是熬夜？",
    a: "I prefer staying up late. It's quiet and peaceful, which is the perfect time for reading and drawing my art pieces.",
    a_cn: "我比較喜歡熬夜。那是安靜又和平的時光，最適合閱讀和畫我的作品。"
  },
  {
    round: 5, id: 4,
    q: "Who is the most important person in your life?",
    q_cn: "你生命中最重要的人是誰？",
    a: "My mother. She always encourages me to challenge myself in my art and studies. She is very supportive.",
    a_cn: "我媽媽。她總是鼓勵我在藝術和學業上挑戰自己。她非常支持我。"
  },
  {
    round: 5, id: 5,
    q: "Is there something new you want to learn?",
    q_cn: "有什麼新事物是你想學的嗎？",
    a: "I want to learn digital painting skills. I want to create professional-looking artwork of my favorite anime characters.",
    a_cn: "我想學電繪技巧。我想創作出看起來很專業的我最愛動漫角色的作品。"
  },
  {
    round: 5, id: 6,
    q: "What have you been busy with lately?",
    q_cn: "你最近在忙什麼？",
    a: "I've been busy practicing a very difficult piano piece for a school concert. It takes lots of focus and time.",
    a_cn: "我最近在忙著為學校音樂會練習一首很難的鋼琴曲。那需要很多專注和時間。"
  },
  {
    round: 5, id: 7,
    q: "Do you have single eyelids or double eyelids?",
    q_cn: "你是單眼皮還是雙眼皮？",
    a: "I have double eyelids. I like them because they make my eyes look bigger and more expressive when I draw.",
    a_cn: "我是雙眼皮。我喜歡，因為那讓我的眼睛在畫畫時看起來更大更有神。"
  },
  // --- 第 6 回 ---
  {
    round: 6, id: 1,
    q: "Do you prefer hot days to cold days? Why or why not?",
    q_cn: "你喜歡熱天還是冷天？為什麼？",
    a: "I prefer cold days. I love wearing warm, cozy clothes while sipping hot chocolate and reading manga indoors.",
    a_cn: "我喜歡冷天。我喜歡穿著溫暖舒適的衣服，在室內喝熱巧克力看漫畫。"
  },
  {
    round: 6, id: 2,
    q: "How many hours do you work or study each day?",
    q_cn: "你每天讀書或工作幾小時？",
    a: "I usually study about six hours each day, including class time, homework, and review for tests.",
    a_cn: "我通常一天讀書六小時，包含上課、寫功課和複習考試。"
  },
  {
    round: 6, id: 3,
    q: "Do you have any pets? What pets do you have?",
    q_cn: "你有寵物嗎？養什麼？",
    a: "I don't have pets, but I would love to have a rabbit someday. They are so cute and easy to care for!",
    a_cn: "我沒有寵物，但我希望有一天能養隻兔子。牠們很可愛又好照顧！"
  },
  {
    round: 6, id: 4,
    q: "Can you briefly describe your looks?",
    q_cn: "你能簡述一下你的外表嗎？",
    a: "I am average height, have long brown hair, and usually wear casual clothes. My best feature is my big smile.",
    a_cn: "我身高適中，長棕髮，通常穿休閒服。我最大的特徵是我的大笑容。"
  },
  {
    round: 6, id: 5,
    q: "Have you ever tried dieting? Did it work?",
    q_cn: "你有試過節食嗎？有效嗎？",
    a: "No, I haven't tried dieting. I just focus on eating balanced meals, especially lots of delicious food, and stay healthy.",
    a_cn: "不，我沒試過節食。我只專注於飲食均衡，特別是很多好吃的食物，並保持健康。"
  },
  {
    round: 6, id: 6,
    q: "Do you play any mobile games?",
    q_cn: "你玩手遊嗎？",
    a: "No, I rarely play mobile games. I prefer watching anime or drawing, because the small screen hurts my eyes.",
    a_cn: "不，我很少玩手遊。我比較喜歡看動漫或畫畫，因為小螢幕傷眼。"
  },
  {
    round: 6, id: 7,
    q: "What's your favorite way to relax?",
    q_cn: "你最喜歡的放鬆方式是什麼？",
    a: "My favorite way to relax is reading fantasy novels. It lets me escape reality and explore different worlds.",
    a_cn: "我最愛的放鬆方式是看奇幻小說。這讓我逃離現實並探索不同的世界。"
  },
  // --- 第 7 回 ---
  {
    round: 7, id: 1,
    q: "Are you interested in sports or arts?",
    q_cn: "你對運動感興趣還是藝術？",
    a: "I am passionate about arts. I enjoy drawing and painting because I can express my creativity and feelings.",
    a_cn: "我熱愛藝術。我喜歡畫畫，因為我可以表達我的創意和感受。"
  },
  {
    round: 7, id: 2,
    q: "Do you prefer eating alone or with other people?",
    q_cn: "你喜歡一個人吃還是跟別人吃？",
    a: "I prefer eating with my family on weekends. We can chat and share delicious dishes together.",
    a_cn: "週末我喜歡跟家人一起吃。我們可以聊天並一起分享美味的菜餚。"
  },
  {
    round: 7, id: 3,
    q: "What's your best subject in school?",
    q_cn: "你在學校最好的科目是什麼？",
    a: "Arts/Drawing! I love creating things and expressing my imagination. It is the subject I feel most creative in.",
    a_cn: "美術/繪畫！我喜歡創作和表達我的想像力。這是我覺得最有創意的科目。"
  },
  {
    round: 7, id: 4,
    q: "If you had money, what would you like to do the most?",
    q_cn: "如果你有錢，你最想做什麼？",
    a: "I would travel to Japan immediately! I want to experience the culture, eat authentic food, and visit anime studios.",
    a_cn: "我會立刻去日本旅行！我想體驗文化、吃道地美食，並參觀動畫工作室。"
  },
  {
    round: 7, id: 5,
    q: "How many rooms are there in your house?",
    q_cn: "你家有幾個房間？",
    a: "My family has three bedrooms, a living room, a kitchen, and two bathrooms. I share a bedroom with my younger sister.",
    a_cn: "我家有三間臥室、一間客廳、一間廚房和兩間浴室。我和妹妹共用一間臥室。"
  },
  {
    round: 7, id: 6,
    q: "Are you popular at school or work?",
    q_cn: "你在學校或職場受歡迎嗎？",
    a: "I'm not super popular, but I have a few close, trustworthy friends who support my love for anime and art.",
    a_cn: "我不是超級受歡迎，但我有幾個親近、值得信賴的朋友，他們支持我對動漫和藝術的熱愛。"
  },
  {
    round: 7, id: 7,
    q: "If you could choose, would you want to be a man or a woman?",
    q_cn: "如果可以選擇，你想當男生還是女生？",
    a: "I'm happy being a woman. I enjoy being myself and I feel comfortable. I can still draw and play piano either way!",
    a_cn: "我很開心當女生。我享受做自己而且我覺得很自在。不管怎樣我都還是可以畫畫和彈琴！"
  },
  // --- 第 8 回 ---
  {
    round: 8, id: 1,
    q: "Can you play any musical instruments, like the piano or the flute?",
    q_cn: "你會演奏任何樂器嗎，像鋼琴或長笛？",
    a: "Yes, I can play the piano. I have been learning since I was little, and it helps me relax and focus.",
    a_cn: "會，我會彈鋼琴。我從小就開始學，它幫助我放鬆和專注。"
  },
  {
    round: 8, id: 2,
    q: "What do you usually do before you go to bed?",
    q_cn: "你睡前通常做什麼？",
    a: "I usually read a book before bed. It helps me calm down and fall asleep faster, escaping the stress of the day.",
    a_cn: "我通常睡前會看書。它幫我靜下心來並更快入睡，逃離一天的壓力。"
  },
  {
    round: 8, id: 3,
    q: "Is there anything you're afraid of? What is it?",
    q_cn: "你有害怕什麼東西嗎？是什麼？",
    a: "Ghosts! I don't like watching horror movies at night because they make me feel uneasy and overthink everything.",
    a_cn: "鬼！我不喜歡晚上看恐怖片，因為會讓我覺得不安和胡思亂想。"
  },
  {
    round: 8, id: 4,
    q: "How often do you go to a fast-food restaurant?",
    q_cn: "你多常去速食店？",
    a: "I go to a fast-food restaurant about once a month. I enjoy their burgers and fries, but I know it's not healthy.",
    a_cn: "我大約一個月去一次。我喜歡他們的漢堡和薯條，但我知道那不健康。"
  },
  {
    round: 8, id: 5,
    q: "Do you prefer mountains or the sea?",
    q_cn: "你喜歡山還是海？",
    a: "I prefer the sea. I love swimming, and the ocean breeze makes me feel peaceful and cheerful when I visit.",
    a_cn: "我比較喜歡海。我喜歡游泳，而且海風讓我在造訪時感到平靜和愉悅。"
  },
  {
    round: 8, id: 6,
    q: "What kind of movies or dramas do you like?",
    q_cn: "你喜歡哪種電影或劇？",
    a: "I prefer watching animation movies, especially fantasy and adventure ones. I love beautiful graphics and emotional stories.",
    a_cn: "我比較喜歡看動畫電影，特別是奇幻和冒險類的。我愛美麗的畫面和感人的故事。"
  },
  {
    round: 8, id: 7,
    q: "If you could only bring one thing to an island, what would you bring?",
    q_cn: "如果你只能帶一樣東西去荒島，你會帶什麼？",
    a: "I would bring my sketchbook and pencils. I could draw the beautiful scenery and maybe signal for help using my drawings.",
    a_cn: "我會帶我的素描本和鉛筆。我可以畫下美麗的風景，或許還可以用畫來求救。"
  },
  // --- 第 9 回 ---
  {
    round: 9, id: 1,
    q: "How do you spend your free time when you're at home?",
    q_cn: "你在家有空時都怎麼打發時間？",
    a: "I usually draw my favorite anime characters, read books, or practice new songs on the piano in my room.",
    a_cn: "我通常在房裡畫我最愛的動漫角色、看書，或練習鋼琴新歌。"
  },
  {
    round: 9, id: 2,
    q: "Are you satisfied with your height? Why or why not?",
    q_cn: "你滿意你的身高嗎？為什麼？",
    a: "Yes, I'm satisfied. I'm average height, and it's easy for me to wear comfortable clothes and move around.",
    a_cn: "是的，我很滿意。我身高適中，穿舒適的衣服和活動都很方便。"
  },
  {
    round: 9, id: 3,
    q: "Have you ever seen the sunrise? Who did you watch it with?",
    q_cn: "你看過日出嗎？跟誰看的？",
    a: "No, I haven't, but I hope to see the sunrise from a beautiful beach one day with my best friends.",
    a_cn: "不，我沒看過，但我希望有一天能跟好朋友在美麗的海灘看日出。"
  },
  {
    round: 9, id: 4,
    q: "Which ride is your favorite when you go to an amusement park?",
    q_cn: "去遊樂園時你最喜歡哪個設施？",
    a: "The roller coaster! It's super fast, and the sudden drops make my heart race. It’s exciting and thrilling.",
    a_cn: "雲霄飛車！它超快，突然的墜落讓我心跳加速。既刺激又驚悚。"
  },
  {
    round: 9, id: 5,
    q: "Can you tell me three of your strengths?",
    q_cn: "能告訴我你的三個優點嗎？",
    a: "I am creative in art, patient with piano practice, and responsible enough to always finish my homework first.",
    a_cn: "我在藝術上有創意、練琴有耐心，而且很有責任感總是先做完功課。"
  },
  {
    round: 9, id: 6,
    q: "What do you think about traveling around the island by motorcycle?",
    q_cn: "你對騎機車環島有什麼想法？",
    a: "It sounds exciting and gives freedom. But I think I would worry too much about the safety and bad weather.",
    a_cn: "聽起來很刺激且自由。但我想要是我會太擔心安全和壞天氣。"
  },
  {
    round: 9, id: 7,
    q: "Do you wear glasses? Are there any inconveniences with them?",
    q_cn: "你戴眼鏡嗎？有什麼不便嗎？",
    a: "I don't wear glasses, but I wear contact lenses when I play the piano sometimes. It is more convenient.",
    a_cn: "我不戴眼鏡，但我有時彈琴會戴隱形眼鏡。比較方便。"
  },
  // --- 第 10 回 ---
  {
    round: 10, id: 1,
    q: "Do you have a job now? What is it?",
    q_cn: "你現在有工作嗎？是什麼？",
    a: "No, I am a student. My focus now is studying, drawing, and practicing the piano for my future.",
    a_cn: "不，我是學生。我現在的重心是讀書、畫畫和練琴，為了我的未來。"
  },
  {
    round: 10, id: 2,
    q: "What gift would you like to receive the most?",
    q_cn: "你最想收到什麼禮物？",
    a: "I would love a free trip to Japan to explore the culture and try local food. That would be the dream gift!",
    a_cn: "我想要一趟免費的日本之旅，去探索文化和品嘗當地美食。那是夢幻禮物！"
  },
  {
    round: 10, id: 3,
    q: "Do you prefer meat or seafood when eating hot pot?",
    q_cn: "吃火鍋時你喜歡肉還是海鮮？",
    a: "I prefer meat, especially beef and pork. They absorb the soup flavor well and are very juicy in hot pot.",
    a_cn: "我喜歡肉，特別是牛和豬。它們很吸湯汁，在火鍋裡很多汁。"
  },
  {
    round: 10, id: 4,
    q: "How do you usually prepare for a big test or exam?",
    q_cn: "你通常怎麼準備大考？",
    a: "I review my notes and practice tests. I also take short breaks to stay focused and keep my mind calm.",
    a_cn: "我會複習筆記和做模擬考。我也會小歇一下來保持專注和冷靜。"
  },
  {
    round: 10, id: 5,
    q: "If you could get a pet, what would you like to have?",
    q_cn: "如果你能養寵物，你想養什麼？",
    a: "I would like to have a rabbit or maybe a quiet, gentle cat. They are small, cute, and easy to care for.",
    a_cn: "我想養兔子或是安靜溫和的貓。牠們小小的、很可愛且好照顧。"
  },
  {
    round: 10, id: 6,
    q: "What did you do at home during the COVID-19 pandemic?",
    q_cn: "疫情期間你在家做什麼？",
    a: "I stayed home, practiced piano, and did online courses to improve my English skills and my drawing techniques.",
    a_cn: "我待在家練琴，並上線上課程來增進我的英文能力和繪畫技巧。"
  },
  {
    round: 10, id: 7,
    q: "When you see a doctor, what do you say to him/her?",
    q_cn: "你看醫生時會跟他說什麼？",
    a: "I would say, \"I have a sore throat, runny nose, and a slight fever. Could it be the flu? I feel very tired.\"",
    a_cn: "我會說：「我喉嚨痛、流鼻水還有一點發燒。會是流感嗎？我覺得很累。」"
  },
  // --- 第 11 回 ---
  {
    round: 11, id: 1,
    q: "When did you start learning English?",
    q_cn: "你何時開始學英文？",
    a: "I started learning English when I was in elementary school. It was hard at first, but now I enjoy reading English books.",
    a_cn: "我小學開始學英文。起初很難，但現在我享受看英文書。"
  },
  {
    round: 11, id: 2,
    q: "What is the first thing you do after waking up?",
    q_cn: "你起床第一件事做什麼？",
    a: "I drink a large glass of water. It makes me feel refreshed and helps me wake up before getting ready for school.",
    a_cn: "我喝一大杯水。那讓我感覺清爽，並幫助我在準備上學前醒腦。"
  },
  {
    round: 11, id: 3,
    q: "Do you think you are a good friend?",
    q_cn: "你覺得你是個好朋友嗎？",
    a: "Yes, I think so. I always listen to my friends, share secrets, and offer support when they face problems.",
    a_cn: "是的，我覺得是。我總是傾聽朋友、分享秘密，並在他們遇到問題時提供支持。"
  },
  {
    round: 11, id: 4,
    q: "What is your best subject? Do you like it?",
    q_cn: "你最拿手的科目是什麼？你喜歡嗎？",
    a: "English, because I enjoy learning new words by reading books and practicing conversations with my classmates.",
    a_cn: "英文，因為我喜歡透過閱讀學新單字，並和同學練習對話。"
  },
  {
    round: 11, id: 5,
    q: "How often do you clean your bedroom?",
    q_cn: "你多常清理房間？",
    a: "I clean my room about twice a month, but I always make my bed and organize my desk every week.",
    a_cn: "我大約一個月清兩次，但我每週都會鋪床和整理書桌。"
  },
  {
    round: 11, id: 6,
    q: "What do you think your weaknesses are?",
    q_cn: "你覺得你的缺點是什麼？",
    a: "I sometimes talk too much when I am excited, and I can be impatient. I am working on listening more carefully.",
    a_cn: "我興奮時有時話太多，而且我有點沒耐心。我正在努力更仔細傾聽。"
  },
  {
    round: 11, id: 7,
    q: "Today is your best friend's birthday. Say something to him/her.",
    q_cn: "今天是你好朋友生日。跟他說句話吧。",
    a: "Happy birthday, my best friend! I hope you have a wonderful day filled with happiness. Let’s create unforgettable memories today!",
    a_cn: "生日快樂，我的摯友！祝你有個充滿快樂的美好一天。讓我們今天創造難忘的回憶吧！"
  },
  // --- 第 12 回 ---
  {
    round: 12, id: 1,
    q: "Are you interested in pop music?",
    q_cn: "你對流行音樂有興趣嗎？",
    a: "Yes, I enjoy pop music, especially songs from Japanese anime soundtracks. They are catchy and energetic.",
    a_cn: "有，我喜歡流行音樂，特別是日本動漫原聲帶的歌。它們很朗朗上口又有活力。"
  },
  {
    round: 12, id: 2,
    q: "Do you like having a day off during a typhoon?",
    q_cn: "你喜歡颱風假嗎？",
    a: "Yes, I love it! I can stay home, watch movies, and draw anime all day. It feels like an unexpected, cozy holiday.",
    a_cn: "喜歡，我超愛！我可以待在家整天看電影和畫動漫。感覺像是意料之外的舒適假期。"
  },
  {
    round: 12, id: 3,
    q: "Can you tell me today's date and the current time?",
    q_cn: "能告訴我今天的日期和現在時間嗎？",
    a: "Today is March 15th, and it's 9 AM. I am trying to finish my piano practice before lunchtime.",
    a_cn: "今天是3月15日，早上9點。我正試著在午餐前練完鋼琴。"
  },
  {
    round: 12, id: 4,
    q: "If tomorrow were the end of the world, what would you do today?",
    q_cn: "如果明天是世界末日，你今天會做什麼？",
    a: "I would spend the whole day with my family, telling them how much I love them, and eating all my favorite foods.",
    a_cn: "我會整天陪家人，告訴他們我多愛他們，並吃光所有我愛吃的食物。"
  },
  {
    round: 12, id: 5,
    q: "Are you the oldest child in your family?",
    q_cn: "你是家中排行老大嗎？",
    a: "No, I am the middle child. I have an older brother and a younger sister. It’s fun but challenging sometimes.",
    a_cn: "不，我是老二。我有個哥哥和妹妹。很有趣但有時也充滿挑戰。"
  },
  {
    round: 12, id: 6,
    q: "What's your favorite space in your home? Why?",
    q_cn: "你最喜歡家裡哪個空間？為什麼？",
    a: "My bedroom. It's quiet and comfortable, perfect for reading novels, listening to music, and doing my art.",
    a_cn: "我的臥室。安靜又舒服，最適合看小說、聽音樂和搞藝術創作。"
  },
  {
    round: 12, id: 7,
    q: "If you had a chance to meet your idol, what would you like to say to him/her?",
    q_cn: "如果你有機會見到偶像，你想跟他說什麼？",
    a: "I would ask them for an autograph and tell them how much I admire their work. I might be too nervous to speak much!",
    a_cn: "我會跟他要簽名，並告訴他我多欣賞他的作品。我可能會緊張到說不出話！"
  }
];