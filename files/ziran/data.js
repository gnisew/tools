const quizData = [
  {
    id: "yx11",
    title: "月相 1a",
    category: "月相",
    questions: [
      {
        question: "從上午到下午，會發現大樹的影子由西向東移動。",
        options: ["○", "╳"],
        answer: 1,
        explanation: "太陽從東邊升起，上午影子在西邊；太陽向西邊落下，下午影子在東邊。"
      },
      {
        question: "雲量多的夜晚較容易觀察到月亮。",
        options: ["○", "╳"],
        answer: 2,
        explanation: "雲層會遮擋視線，因此雲量多的夜晚較難觀察到月亮。"
      },
      {
        question: "我們只能在晚上看到月亮。",
        options: ["○", "╳"],
        answer: 2,
        explanation: "月亮在白天也可能出現，只是因為太陽光太強而較難觀察到。"
      },
      {
        question: "利用指北針和高度角觀測器，可以比較準確的描述月亮的位置。",
        options: ["○", "╳"],
        answer: 1,
        explanation: "指北針可以測量方位，高度角觀測器可以測量高度，兩者搭配使用可以精準描述天體位置。"
      },
      {
        question: "利用拳頭數測量月亮高度角時，遮住月亮所疊的拳頭數愈少，表示月亮高度角愈小。",
        options: ["○", "╳"],
        answer: 1,
        explanation: "拳頭數愈少，代表高度愈低，因此高度角愈小。"
      },
      {
        question: "同一時間、在相近的地點利用高度角觀測器測量月亮高度角時，所測量出的月亮高度角幾乎相同。",
        options: ["○", "╳"],
        answer: 1,
        explanation: "由於月亮距離地球非常遙遠，在相近地點測量的高度角差異極小，可視為相同。"
      },
      {
        question: "柔柔想知道月相變化的資料，她可以利用網路查詢氣象署網站資料。",
        options: ["○", "╳"],
        answer: 1,
        explanation: "氣象署網站通常會提供相關的天文資訊，包含月相變化。"
      },
      {
        question: "面向南方觀測月亮，每年聖誕節晚上出現的月相都是　 。",
        options: ["○", "╳"],
        answer: 2,
        explanation: "月相變化與農曆日期有關，與國曆日期（如聖誕節）無關。"
      },
      {
        question: "月相變化是有規律性的，變化週期大約是　29　天或　30　天。",
        options: ["○", "╳"],
        answer: 1,
        explanation: "月相變化週期約為一個朔望月，平均約為29.5天。"
      },
      {
        question: "就算不是中秋節，只要天氣晴朗，農曆每個月　15　日還是可以看到滿月。",
        options: ["○", "╳"],
        answer: 1,
        explanation: "滿月是農曆每月15日前後出現，與中秋節並無絕對關係。"
      },
      {
        question: "下列敘述何者正確？",
        options: ["下午太陽的位置比中午高", "太陽由西向東移動", "每顆星星的亮度看起來都不太一樣", "月亮的位置是固定不動的。"],
        answer: 3,
        explanation: "太陽由東向西移動，中午位置最高，月亮和星星的位置都會移動。而星星的亮度因其大小、距離等因素而有所不同。"
      },
      {
        question: "滿月當天，月亮在天空移動的路線是呈",
        options: ["直線", "鋸齒形", "弧形", "斜線。"],
        answer: 3,
        explanation: "月亮在天空移動時，會隨著地球自轉而呈現弧形的移動軌跡。"
      },
      {
        question: "一天中，月亮高度角會如何改變？",
        options: ["由小到大，再由大到小", "由大到小，再由小到大", "由小到大", "由大到小。"],
        answer: 1,
        explanation: "月亮從地平線升起時高度角小，升到最高點時高度角最大，然後再慢慢下降。"
      },
      {
        question: "翔翔面向南方，抬頭看到的月相是　 ，當天有可能是農曆",
        options: ["1日", "8日", "15日", "27日。"],
        answer: 4,
        explanation: "此月相為殘月，通常在農曆下旬（約23至29日）出現，因此27日最有可能。"
      },
      {
        question: "面向南方觀測月亮，下列哪一個是上弦月？",
        options: ["🌘", "🌓", "🌗", "🌕"],
        answer: 2,
        explanation: "上弦月通常在農曆初七、初八出現，面向南方觀看時亮面在右邊。選項中B圖亮面朝右，因此為上弦月。"
      }
    ]
  },
  {
    id: "yx12",
    title: "月相 1b",
    category: "月相",
    questions: [
      {
        question: "早上到下午，樹影的移動方向是從東邊慢慢跑到西邊。",
        options: ["○", "╳"],
        answer: 2,
        explanation: "早上太陽在東邊，影子在西邊；下午太陽在西邊，影子在東邊。所以影子是從西向東移動。"
      },
      {
        question: "烏雲密布的晚上，月亮會比晴朗的夜晚看得更清楚。",
        options: ["○", "╳"],
        answer: 2,
        explanation: "雲層就像是遮蔽物，會擋住我們的視線，所以雲多時月亮很難看到。"
      },
      {
        question: "只有晚上才有可能看到月亮。",
        options: ["○", "╳"],
        answer: 2,
        explanation: "白天有時候也看得到月亮喔，只是因為太陽光太亮了，所以比較難發現。"
      },
      {
        question: "只要用指北針和一個測量角度的工具，就能準確說出月亮在哪個位置。",
        options: ["○", "╳"],
        answer: 1,
        explanation: "指北針可以知道方向，測量角度的工具可以知道高度，兩個一起用就能精確標示出天體的位置。"
      },
      {
        question: "用拳頭來量月亮高度，疊的拳頭愈少，代表月亮離地平線愈近。",
        options: ["○", "╳"],
        answer: 1,
        explanation: "用拳頭數來測量高度，拳頭數少就表示月亮位置比較低，高度角也就比較小。"
      },
      {
        question: "在同一個時間，兩個在附近的朋友各自測量月亮的高度，結果會差不多。",
        options: ["○", "╳"],
        answer: 1,
        explanation: "因為月亮離地球很遠，就算在附近的兩個地方測量，角度的差異也小到幾乎可以忽略不計。"
      },
      {
        question: "如果想知道月亮什麼時候圓、什麼時候缺，可以上氣象局網站查。",
        options: ["○", "╳"],
        answer: 1,
        explanation: "氣象局網站除了天氣，也常常會提供一些像月相變化這樣的天文資訊。"
      },
      {
        question: "每年的耶誕節晚上，在南邊看到的月亮都長得一模一樣。",
        options: ["○", "╳"],
        answer: 2,
        explanation: "月亮的形狀（月相）是跟農曆日期有關，不是看國曆日期（像耶誕節）來決定的。"
      },
      {
        question: "月亮的形狀變化是有固定模式的，大概每隔一個月會重複一次。",
        options: ["○", "╳"],
        answer: 1,
        explanation: "月亮的圓缺變化週期大約是一個月（約29.5天），很有規律。"
      },
      {
        question: "只要天氣好，不是中秋節的農曆十五，我們一樣能看到又圓又亮的滿月。",
        options: ["○", "╳"],
        answer: 1,
        explanation: "滿月通常是在農曆每個月的15號前後出現，跟是不是中秋節沒有關係。"
      },
      {
        question: "關於太陽和星星，哪一句話是正確的？",
        options: ["中午的太陽位置比下午低", "太陽從西邊升起", "每顆星星的亮度都一樣", "星星看起來的亮度和大小不太一樣"],
        answer: 4,
        explanation: "太陽是由東往西移動，中午位置最高。星星因為距離地球遠近和本身大小不同，看起來的亮度也不同。"
      },
      {
        question: "滿月在天空移動的樣子，像哪一種形狀？",
        options: ["彎彎的弧線", "直直的一條線", "歪斜的斜線", "鋸齒狀"],
        answer: 1,
        explanation: "月亮隨著地球自轉，在天空看起來的移動軌跡會是彎彎的弧線。"
      },
      {
        question: "一整天下來，月亮的高度角變化是怎麼樣的？",
        options: ["先變小再變大", "一直都是一樣的", "一直在變小", "先變大再變小"],
        answer: 4,
        explanation: "月亮從地平線升起時，高度角最小；升到最高點時最大；之後會慢慢下降，所以高度角是先變大再變小。"
      },
      {
        question: "小安面對南方，看到月亮右半邊是亮的，這天最可能是農曆幾號？",
        options: ["15日", "27日", "8日", "1日"],
        answer: 3,
        explanation: "月亮右半邊亮是上弦月，通常出現在農曆初七、初八左右，所以在選項中最接近的是8日。"
      },
      {
        question: "小華面對南方，看到的月相是　🌘　，這天最可能是農曆幾號？",
        options: ["27日", "8日", "15日", "1日"],
        answer: 1,
        explanation: "圖中這個月相是殘月，通常在農曆下旬（約23到29號）出現，所以選項中的27日最有可能。"
      }
    ]
  },
  {
    id: "yx-1-A",
    title: "月相 1 評量A",
    category: "月相",
    questions: [
      {
        question: "天空中常能看見太陽、月亮和星星。",
        options: ["O", "X"],
        answer: 1,
        explanation: "抬頭常見這三種星體。"
      },
      {
        question: "早上看見太陽時，它是從東方升起。",
        options: ["O", "X"],
        answer: 1,
        explanation: "太陽每天東升西落。"
      },
      {
        question: "月亮和太陽不一樣，是從西方升起。",
        options: ["O", "X"],
        answer: 2,
        explanation: "月亮也是東升西落。"
      },
      {
        question: "月亮在天空移動的路線，和太陽很像。",
        options: ["O", "X"],
        answer: 1,
        explanation: "兩者都是從東向西移動。"
      },
      {
        question: "白天陽光太強，使我們看不見星星。",
        options: ["O", "X"],
        answer: 1,
        explanation: "星光微弱被陽光遮蓋。"
      },
      {
        question: "夜晚天空變暗，比白天更容易看清月亮。",
        options: ["O", "X"],
        answer: 1,
        explanation: "背景暗時月亮更明顯。"
      },
      {
        question: "晚上沒有陽光照射，月亮就沒辦法發光。",
        options: ["O", "X"],
        answer: 2,
        explanation: "月亮會反射太陽的光。"
      },
      {
        question: "在晴朗的夜空，星星和月亮能同時看見。",
        options: ["O", "X"],
        answer: 1,
        explanation: "夜晚常能同時見到星月。"
      },
      {
        question: "天黑時的夜空，比白天更適合看星星。",
        options: ["O", "X"],
        answer: 1,
        explanation: "晚上沒有強烈陽光遮擋。"
      },
      {
        question: "隨著時間過去，月亮在空中的位置都不會改變。",
        options: ["O", "X"],
        answer: 2,
        explanation: "月亮整夜持續移動。"
      },
      {
        question: "早上與傍晚，太陽在天空中的位置不同。",
        options: ["O", "X"],
        answer: 1,
        explanation: "太陽位置隨時間改變。"
      },
      {
        question: "中午的太陽，看起來比傍晚時還要高。",
        options: ["O", "X"],
        answer: 1,
        explanation: "中午太陽仰角最大。"
      },
      {
        question: "在陽光下，物體的影子永遠指向光源方向。",
        options: ["O", "X"],
        answer: 2,
        explanation: "影子方向與光源相反。"
      },
      {
        question: "早上的陽光照在校門左邊，表示左邊是東方。",
        options: ["O", "X"],
        answer: 1,
        explanation: "太陽是從東方升起的。"
      },
      {
        question: "不管面向哪一方，早上的太陽一定都在右邊。",
        options: ["O", "X"],
        answer: 2,
        explanation: "位置要看自己面向哪裡。"
      },
      {
        question: "月亮在天空中移動的方向是怎麼樣的？",
        options: ["東升西落", "西升東落", "南升北降", "靜止不動"],
        answer: 1,
        explanation: "月亮和太陽都是東升西落。"
      },
      {
        question: "月圓的夜晚，月亮一開始會由哪一個方向升起？",
        options: ["南方", "東方", "北方", "西方"],
        answer: 2,
        explanation: "月亮也是由東方升起的。"
      },
      {
        question: "白天沒辦法清楚看見星星，主要原因是？",
        options: ["星星白天不發光", "星星白天掉落", "白天太陽光太過明亮", "白天天空被雲遮住"],
        answer: 3,
        explanation: "陽光太強遮住微弱星光。"
      },
      {
        question: "想要清楚看見月亮，哪一個時間最適合？",
        options: ["大正午烈日下", "清晨日出時", "下午3點整", "晴朗的夜晚"],
        answer: 4,
        explanation: "晚上天空變暗最易看見。"
      },
      {
        question: "一天之中，太陽在天空中的位置何時最高？",
        options: ["中午12點", "早上6點", "傍晚6點", "上午9點"],
        answer: 1,
        explanation: "中午太陽高度角最高。"
      },
      {
        question: "早晨面對太陽升起的方向站好，右手指向哪一方？",
        options: ["東方", "西方", "南方", "北方"],
        answer: 3,
        explanation: "面向東方時右側為南方。"
      },
      {
        question: "下午陽光照在樹上，樹的影子會朝向哪一方？",
        options: ["北方", "東方", "西方", "南方"],
        answer: 2,
        explanation: "太陽在西則影子朝東。"
      },
      {
        question: "地面上影子的移動方向，和太陽移動的方向關係是什麼？",
        options: ["完全相同", "毫無關聯", "永不變動", "正好相反"],
        answer: 4,
        explanation: "影子方向與太陽正好相反。"
      }
    ]
  },
  {
    id: "yx-1-B",
    title: "月相 1 評量B",
    category: "月相",
    questions: [
      {
        question: "白天晴朗時，抬頭能看到太陽。",
        options: ["O", "X"],
        answer: 1,
        explanation: "白天最容易看見太陽。"
      },
      {
        question: "到了晚上，太陽會落到地平線下。",
        options: ["O", "X"],
        answer: 1,
        explanation: "太陽由西方落下。"
      },
      {
        question: "天上的星星，只有在夜晚才會存在。",
        options: ["O", "X"],
        answer: 2,
        explanation: "星星白天也在，光被遮住。"
      },
      {
        question: "夜晚的天空，有時能同時看到月亮和星星。",
        options: ["O", "X"],
        answer: 1,
        explanation: "夜空常同時看見星月。"
      },
      {
        question: "月亮和太陽一樣，也是由東向西移動。",
        options: ["O", "X"],
        answer: 1,
        explanation: "天體大多東升西落。"
      },
      {
        question: "一天之中，月亮在天空的位置完全不會變。",
        options: ["O", "X"],
        answer: 2,
        explanation: "月亮位置會隨時間改變。"
      },
      {
        question: "面向早晨的太陽，自己的背後就是西方。",
        options: ["O", "X"],
        answer: 1,
        explanation: "太陽東升，背對東方是西。"
      },
      {
        question: "背對太陽站著，影子會出現在身體後方。",
        options: ["O", "X"],
        answer: 2,
        explanation: "影子會在身體的前方。"
      },
      {
        question: "一天當中，太陽在空中的高度都一樣高。",
        options: ["O", "X"],
        answer: 2,
        explanation: "正午最高，早晚較低。"
      },
      {
        question: "月亮自己會發光，就像一顆大燈泡。",
        options: ["O", "X"],
        answer: 2,
        explanation: "月亮是反射太陽的光。"
      },
      {
        question: "清晨太陽剛升起，樹的影子會朝向哪裡？",
        options: ["南方", "西方", "東方", "北方"],
        answer: 2,
        explanation: "影子的方向和太陽相反。"
      },
      {
        question: "大晴天時，操場上的竿影在何時最短？",
        options: ["清晨", "傍晚", "正午", "深夜"],
        answer: 3,
        explanation: "中午太陽最高，影子最短。"
      },
      {
        question: "夜晚仰望星空，月亮移動的方向通常是？",
        options: ["東升西落", "西升東落", "南升北落", "北升南落"],
        answer: 1,
        explanation: "天體都是由東向西行進。"
      },
      {
        question: "早晨面對太陽站立，右手所指的方向是？",
        options: ["北方", "東方", "西方", "南方"],
        answer: 4,
        explanation: "面朝東方，右手就是南方。"
      },
      {
        question: "一天之中，太陽在什麼時候位置最高？",
        options: ["清晨六點", "中午十二點", "下午三點", "傍晚六點"],
        answer: 2,
        explanation: "中午時太陽升到最高處。"
      },
      {
        question: "白天看不見滿天星空，主要的原因是？",
        options: ["星星全躲起來", "星星白天不發光", "陽光太過強烈", "星星掉到地面"],
        answer: 3,
        explanation: "強烈陽光遮蓋了微弱星光。"
      },
      {
        question: "下午放學時，看見大樹的影子會朝向哪方？",
        options: ["東方", "西方", "南方", "北方"],
        answer: 1,
        explanation: "下午太陽在西，影子在東。"
      },
      {
        question: "下列哪一個時間，最適合用肉眼看星星？",
        options: ["中午十二點", "早上八點", "下午兩點", "晚上九點"],
        answer: 4,
        explanation: "夜空暗，容易看見星星。"
      },
      {
        question: "下列哪一種物體，不會每天規律東升西落？",
        options: ["白天的太陽", "飛過的人造飛機", "夜空的月亮", "天上的星座"],
        answer: 2,
        explanation: "飛機不是自然運行的天體。"
      },
      {
        question: "觀察地上的影子，移動方向和太陽有何關係？",
        options: ["方向完全相同", "沒有任何關聯", "方向正好相反", "影子固定不動"],
        answer: 3,
        explanation: "影子方向必定與光源相反。"
      },
      {
        question: "早晨八點和下午四點，太陽的位置有何差別？",
        options: ["位置完全不同", "都在正頭頂", "都在正西方", "完全沒有改變"],
        answer: 1,
        explanation: "太陽隨時間不斷向西移。"
      },
      {
        question: "白天在戶外看見月亮，代表什麼意思？",
        options: ["一定是半夜", "絕不可能發生", "一定是眼睛看錯", "白天也有機會看見"],
        answer: 4,
        explanation: "有些時候白天也能看見月亮。"
      },
      {
        question: "關於太陽高度與影子長度，下列何者正確？",
        options: ["太陽愈高影子愈長", "太陽愈高影子愈短", "中午時影子最長", "影子方向與太陽同向"],
        answer: 2,
        explanation: "太陽位置愈高，影子愈短。"
      }
    ]
  },
  {
    id: "yx21",
    title: "月相 2a",
    category: "月相",
    questions: [
      {
        question: "奶奶中午去買中餐時，會發現太陽的位置看起來比清晨去運動時高。",
        options: ["○", "╳"],
        answer: 1,
        explanation: "太陽從東方升起，中午時分位置最高，然後向西方落下。"
      },
      {
        question: "太陽很刺眼，我們無法直視它，但是可以從影子方位的變化，了解太陽在天空中的移動情形。",
        options: ["○", "╳"],
        answer: 1,
        explanation: "影子的方向與太陽位置相反，所以觀察影子變化可以推斷太陽的移動。"
      },
      {
        question: "白天可以清楚看到星星，仔細觀察會發現每顆星星的亮度不太一樣。",
        options: ["○", "╳"],
        answer: 2,
        explanation: "白天太陽光太強，通常無法看到星星。"
      },
      {
        question: "一天中，月亮的高度角、方位和月相會有明顯變化。",
        options: ["○", "╳"],
        answer: 2,
        explanation: "月相變化需要較長時間，一天之內不會有明顯變化。"
      },
      {
        question: "一天中，月亮和太陽都是從東方升起，向西方落下。",
        options: ["○", "╳"],
        answer: 1,
        explanation: "太陽和月亮都會因地球自轉而呈現東升西落的現象。"
      },
      {
        question: "當觀測者面向物體前後移動幾步時，近物的高度角變化會比遠物大。",
        options: ["○", "╳"],
        answer: 1,
        explanation: "近物與觀測者的距離短，視角變化明顯；遠物則因距離遠，視角變化不明顯。"
      },
      {
        question: "在不同日期的相同時刻，所觀測到的月亮高度角會不太一樣。",
        options: ["○", "╳"],
        answer: 1,
        explanation: "月球繞行地球的軌道並非正圓形，且地球自轉軸有傾角，因此不同日期觀測到的月亮高度角會有所不同。"
      },
      {
        question: "不管天氣是否晴朗，每個月的農曆　1　日都看不到月亮。",
        options: ["○", "╳"],
        answer: 1,
        explanation: "農曆初一為「朔」，此時月球位於地球與太陽之間，面向地球的部分沒有被太陽照射，因此看不見月亮。"
      },
      {
        question: "今天的月相是下弦月，大約經過　30　天後會看到上弦月。",
        options: ["○", "╳"],
        answer: 2,
        explanation: "下弦月約在農曆22、23日，上弦月約在農曆初七、初八，兩者相隔約半個月，而非30天。"
      },
      {
        question: "從農曆初一開始的一個月中，我們可以看到兩次滿月。",
        options: ["○", "╳"],
        answer: 2,
        explanation: "滿月週期約為29.5天，一個農曆月通常只會看到一次滿月。"
      },
      {
        question: "下列哪一個時間可能可以在天空中看見月亮？",
        options: ["清晨", "傍晚", "晚上", "清晨、傍晚、晚上都有可能"],
        answer: 4,
        explanation: "月亮在天空中運行，白天或晚上都有可能出現。"
      },
      {
        question: "同一時間，用高度角觀測器測量下列哪一種景物，高度角最不會受到測量距離的影響？",
        options: ["紅綠燈", "遠方的大樓", "大樹", "月亮"],
        answer: 4,
        explanation: "月亮距離地球非常遙遠，因此觀測者移動時，高度角幾乎不會改變。"
      },
      {
        question: "觀測月亮位置的移動時，不需要記錄下列哪一項？",
        options: ["時間", "高度角", "方位", "風向"],
        answer: 4,
        explanation: "風向與月亮位置的移動無關。"
      },
      {
        question: "想要完整記錄月相變化，至少需要觀察多久時間？",
        options: ["一小時", "一天", "一個月", "一年"],
        answer: 3,
        explanation: "月相變化的週期約為一個月。"
      },
      {
        question: "每年元宵節的晚上，我們看見的月相是哪一個？",
        options: ["上弦月", "望", "下弦月", "不一定"],
        answer: 2,
        explanation: "元宵節是農曆正月十五日，此時月相為滿月，也稱作「望」。"
      }
    ]
  },
  {
    id: "yx22",
    title: "月相 2b",
    category: "月相",
    questions: [
      {
        question: "早上剛出門和中午時比起來，太陽的高度看起來是愈來愈高的。",
        options: ["○", "╳"],
        answer: 1,
        explanation: "太陽早上從東方升起，中午是它一整天最高的時候，然後才會往西邊落下。"
      },
      {
        question: "太陽光太刺眼不能直視，但我們可以從影子的長度變化，知道太陽的位置在哪裡。",
        options: ["○", "╳"],
        answer: 1,
        explanation: "影子的方向和長短會隨著太陽位置移動而變化，所以觀察影子就能推斷太陽的位置。"
      },
      {
        question: "白天太陽出來時，我們可以清楚看到天空有很多星星。",
        options: ["○", "╳"],
        answer: 2,
        explanation: "白天因為太陽光太強了，把星星的光芒都蓋住了，所以通常看不到星星。"
      },
      {
        question: "月亮的高度、方向和月亮的圓缺，在一天內都會有很大的改變。",
        options: ["○", "╳"],
        answer: 2,
        explanation: "月亮的高度和方向在一天內會變，但月亮的圓缺（月相）變化很慢，一天內看不出差別。"
      },
      {
        question: "一天當中，太陽和月亮都是從東邊升起，從西邊落下。",
        options: ["○", "╳"],
        answer: 1,
        explanation: "地球會自己轉動，所以我們看太陽和月亮時，它們都會像從東邊出來，西邊下去。"
      },
      {
        question: "你往前走幾步，靠近一樣東西，你會發現近的東西比遠的東西高度角變化更明顯。",
        options: ["○", "╳"],
        answer: 1,
        explanation: "離你比較近的東西，你只要稍微動一下，看的角度就會有很大的變化；遠的東西則看不出什麼改變。"
      },
      {
        question: "在不同的日子，即使是在同一時間看月亮，月亮的高度也會有點不一樣。",
        options: ["○", "╳"],
        answer: 1,
        explanation: "月亮繞地球的軌道不是完美的圓，而且地球本身也是斜著轉，所以每天看月亮的高度都會有細微的差別。"
      },
      {
        question: "不管天氣好不好，農曆每個月的第一天都絕對看不到月亮。",
        options: ["○", "╳"],
        answer: 1,
        explanation: "農曆初一月亮剛好在地球和太陽中間，這時候月亮沒有被太陽照亮的那一面是朝向我們的，所以我們看不到。"
      },
      {
        question: "現在是上弦月，過了大約半個月後會變成下弦月。",
        options: ["○", "╳"],
        answer: 1,
        explanation: "上弦月大概在農曆初七、初八，下弦月大概在農曆二十二、二十三，兩者大約相隔半個月。"
      },
      {
        question: "在一個農曆月中，我們會看到兩次滿月。",
        options: ["○", "╳"],
        answer: 2,
        explanation: "月亮從圓到缺，再到圓，整個週期大約是29.5天，所以一個月只會看到一次滿月。"
      },
      {
        question: "以下哪個時間，最不可能在天空看到月亮？",
        options: ["早上", "傍晚", "中午", "晚上"],
        answer: 3,
        explanation: "白天太陽光很強，月亮光比較弱，所以中午時段，太陽光最強，最不容易看到月亮。"
      },
      {
        question: "你用高度角觀察器來量下面哪一個東西，不管你走幾步，測出來的角度都不會變？",
        options: ["大樹", "遠方的高樓", "月亮", "交通號誌"],
        answer: 3,
        explanation: "因為月亮離我們非常非常遠，所以就算你移動了幾步，它跟你的角度幾乎沒有變化。"
      },
      {
        question: "我們在觀察月亮移動時，下列哪一項紀錄最不重要？",
        options: ["測量的時間", "月亮的高度", "月亮的方位", "溫度的高低"],
        answer: 4,
        explanation: "觀察月亮移動需要記錄時間、高度和方位，天氣狀況只會影響你看不看得到，但跟月亮的位置移動無關。"
      },
      {
        question: "想要完整記錄月亮從缺到圓的變化，最少要觀察多久？",
        options: ["一天", "一個小時", "一個月", "一年"],
        answer: 3,
        explanation: "月亮從朔（看不到）到望（滿月），再回到朔，整個週期大約是一個月。"
      },
      {
        question: "每年的端午節晚上，我們最常看到什麼形狀的月亮？",
        options: ["滿月", "不一定", "峨眉月", "下弦月"],
        answer: 2,
        explanation: "端午節是國曆的固定日期，但月相是跟農曆日期有關，所以每年端午節的月亮形狀都不一樣。"
      }
    ]
  },
  {
    id: "yx-2-A",
    title: "月相 2 評量A",
    category: "月相",
    questions: [
      {
        question: "觀察月相時，必須選在天氣晴朗看得到月亮的夜晚。",
        options: ["O", "X"],
        answer: 1,
        explanation: "要能看到月亮才能做記錄。"
      },
      {
        question: "我們可以利用指北針，找出月亮所在的方位。",
        options: ["O", "X"],
        answer: 1,
        explanation: "指北針可以用來找出方位。"
      },
      {
        question: "用數拳頭測量月亮仰角時，最底下的拳頭要固定好。",
        options: ["O", "X"],
        answer: 1,
        explanation: "基準拳頭要固定量才準。"
      },
      {
        question: "數拳頭測量時，拳頭數越少，表示月亮仰角越高。",
        options: ["O", "X"],
        answer: 2,
        explanation: "拳頭數越多代表高度越高。"
      },
      {
        question: "用數拳頭的方式測仰角，比高度角觀測器更準確。",
        options: ["O", "X"],
        answer: 2,
        explanation: "高度角觀測器測量更準確。"
      },
      {
        question: "想測出準確的仰角度數，用拳頭測量最合適。",
        options: ["O", "X"],
        answer: 2,
        explanation: "要用高度角觀測器才準確。"
      },
      {
        question: "月亮離地球非常遠，沒辦法用一般的尺測量距離。",
        options: ["O", "X"],
        answer: 1,
        explanation: "距離太遠要用角度觀測。"
      },
      {
        question: "記錄月亮移動時，每隔一小時要更換不同的參考建築物。",
        options: ["O", "X"],
        answer: 2,
        explanation: "地面參考的物體必須固定。"
      },
      {
        question: "在同一個地點觀察，月亮一整晚的高度都相同。",
        options: ["O", "X"],
        answer: 2,
        explanation: "月亮高度會隨時間改變。"
      },
      {
        question: "在不同日子的同一個時間，月亮的高度角會不一樣。",
        options: ["O", "X"],
        answer: 1,
        explanation: "每天同一時間位置不同。"
      },
      {
        question: "晚上觀察月亮時，第一步要先確定方位。",
        options: ["O", "X"],
        answer: 1,
        explanation: "觀察前要先確認方位。"
      },
      {
        question: "想知道月亮所在的方位，應該使用哪一種工具？",
        options: ["溫度計", "指北針", "量筒", "直尺"],
        answer: 2,
        explanation: "指北針可以用來辨別方位。"
      },
      {
        question: "想觀察月亮的高度角和方位，哪一個時間最適合？",
        options: ["晚間8點", "正午12點", "上午10點", "下午2點"],
        answer: 1,
        explanation: "晚上天色暗最易看清楚。"
      },
      {
        question: "在同一個晚上，月亮哪一項特徵的變化最明顯？",
        options: ["發光顏色", "表面溫度", "天空位置", "月亮形狀"],
        answer: 3,
        explanation: "月亮會隨著時間向西移動。"
      },
      {
        question: "月亮在空中移動的方向，和下列哪一個規律相同？",
        options: ["隨風漂移的雲", "偶爾掠過的流星", "地面行駛的車輛", "白天升落的太陽"],
        answer: 4,
        explanation: "月亮和太陽都是東升西落。"
      },
      {
        question: "在教室量黑板頂端高度角，後排量60度，前排量出來大約是？",
        options: ["80度", "40度", "30度", "10度"],
        answer: 1,
        explanation: "距離越近測得高度角越大。"
      },
      {
        question: "使用高度角觀測器量仰角，哪一個物體最不受遠近影響？",
        options: ["操場大樹", "校舍頂樓", "天空中的月亮", "鄰近路燈"],
        answer: 3,
        explanation: "月亮很遠所以距離沒影響。"
      },
      {
        question: "農曆十五滿月當晚，月亮仰角何時最高？",
        options: ["晚上6點", "半夜12點", "晚上8點", "下午5點"],
        answer: 2,
        explanation: "半夜時月亮位置最接近天頂。"
      }
    ]
  },
  {
    id: "yx-2-B",
    title: "月相 2 評量B",
    category: "月相",
    questions: [
      {
        question: "月球離地球非常遠，無法拿長尺直接量距離。",
        options: ["O", "X"],
        answer: 1,
        explanation: "距離太遠，無法直接測量。"
      },
      {
        question: "同一天晚上，月亮在空中的高度都不會變。",
        options: ["O", "X"],
        answer: 2,
        explanation: "月亮會隨時間升起落下。"
      },
      {
        question: "連續幾天的同一個時刻，月亮位置會有些微改變。",
        options: ["O", "X"],
        answer: 1,
        explanation: "月球公轉使每天位置不同。"
      },
      {
        question: "用拳頭數測量月亮仰角，手臂應該要打直。",
        options: ["O", "X"],
        answer: 1,
        explanation: "手臂打直測量才準確。"
      },
      {
        question: "量出來的拳頭數愈多，代表月亮的高度角愈大。",
        options: ["O", "X"],
        answer: 1,
        explanation: "拳頭數愈多，仰角愈高。"
      },
      {
        question: "想確認月亮在天空中的方位，可以用指北針。",
        options: ["O", "X"],
        answer: 1,
        explanation: "指北針能幫忙確認方位。"
      },
      {
        question: "觀測月亮移動時，可以隨意更換地面的參考物。",
        options: ["O", "X"],
        answer: 2,
        explanation: "地面的參考物必須固定。"
      },
      {
        question: "高度角觀測器比用手數拳頭，測出的度數更精確。",
        options: ["O", "X"],
        answer: 1,
        explanation: "儀器刻度比肉眼更精準。"
      },
      {
        question: "站在路燈前抬頭看，後退幾步後仰角會如何？",
        options: ["變得更大", "保持不變", "變得更小", "變成零度"],
        answer: 3,
        explanation: "離目標愈遠，仰角愈小。"
      },
      {
        question: "想測量月亮在天空中的方位，最適合使用？",
        options: ["指北針", "三角板", "溫度計", "放大鏡"],
        answer: 1,
        explanation: "指北針用來測量方位。"
      },
      {
        question: "用握拳數測量高度角，一個拳頭大約代表幾度？",
        options: ["約5度", "約45度", "約90度", "約10度"],
        answer: 4,
        explanation: "一個拳頭視角約10度。"
      },
      {
        question: "同一天晚上，月亮在空中最明顯的變化是？",
        options: ["顏色改變", "所在位置", "大小縮放", "形狀改變"],
        answer: 2,
        explanation: "幾小時內位置改變最明顯。"
      },
      {
        question: "抬頭看頭頂正上方，這時的高度角是幾度？",
        options: ["45度", "90度", "180度", "0度"],
        answer: 2,
        explanation: "頭頂正上方的仰角是90度。"
      },
      {
        question: "看很遠的月亮時，往前走幾步，仰角會如何？",
        options: ["立刻變大", "完全變成零", "幾乎沒有改變", "忽大忽小"],
        answer: 3,
        explanation: "月球太遠，走幾步沒影響。"
      },
      {
        question: "在農曆十五滿月當晚，月亮何時升到最高？",
        options: ["清晨時分", "下午三點", "日落剛出", "半夜前後"],
        answer: 4,
        explanation: "滿月大約在半夜升到最高。"
      },
      {
        question: "觀測月亮在空中的移動，地面參考物應該？",
        options: ["固定不動", "隨時更換", "隨風搖晃", "發出亮光"],
        answer: 1,
        explanation: "地面參考物必須保持固定。"
      },
      {
        question: "下列哪種天氣，最不適合進行觀賞月亮的活動？",
        options: ["晴空萬里", "涼爽無雲", "烏雲密布下大雨", "微風徐徐"],
        answer: 3,
        explanation: "厚重雲層會把月亮遮住。"
      },
      {
        question: "使用高度角觀測器時，鉛錘自然下垂是指向哪？",
        options: ["朝向月亮", "垂直朝向地面", "水平方向", "朝向東方"],
        answer: 2,
        explanation: "鉛錘受重力自然垂直向下。"
      }
    ]
  },
  {
    id: "yx-3-A",
    title: "月相 3 評量A",
    category: "月相",
    questions: [
      {
        question: "只要到了中秋節，晚上一定能看見滿月。",
        options: ["O", "X"],
        answer: 2,
        explanation: "如果遇到陰雨天就看不到。"
      },
      {
        question: "中秋節和端午節這兩天，晚上看到的月相都相同。",
        options: ["O", "X"],
        answer: 2,
        explanation: "端午節初五不是滿月。"
      },
      {
        question: "記錄月相時如果遇到天氣不好，可以不用記錄直接留白。",
        options: ["O", "X"],
        answer: 2,
        explanation: "沒看到也要誠實寫下原因。"
      },
      {
        question: "即使天氣晴朗沒有雲，夜晚也有可能完全看不到月亮。",
        options: ["O", "X"],
        answer: 1,
        explanation: "農曆初一晚上看不到月亮。"
      },
      {
        question: "我們可以用電腦的月相模擬軟體，來查詢月相的變化。",
        options: ["O", "X"],
        answer: 1,
        explanation: "模擬軟體可以幫助觀察月相。"
      },
      {
        question: "下弦月是在滿月之後，才會在農曆每個月的後半個月出現。",
        options: ["O", "X"],
        answer: 1,
        explanation: "下弦月出現在二十二日左右。"
      },
      {
        question: "上弦月的形狀，看起來會比滿月還要圓。",
        options: ["O", "X"],
        answer: 2,
        explanation: "滿月的時候形狀才是最圓的。"
      },
      {
        question: "月相變化的規律性，是依照國曆日期來推算的。",
        options: ["O", "X"],
        answer: 2,
        explanation: "月相變化主要對應農曆日期。"
      },
      {
        question: "在天空中稱為「朔」的月相，會出現在農曆哪一天？",
        options: ["農曆初八", "農曆二十二", "農曆初一", "農曆十五"],
        answer: 3,
        explanation: "農曆初一為新月朔。"
      },
      {
        question: "抬頭如果在夜空中看見圓圓的滿月，最可能是農曆哪一天？",
        options: ["農曆十五日", "農曆初三日", "農曆初八日", "農曆二十六日"],
        answer: 1,
        explanation: "農曆十五前後為滿月。"
      },
      {
        question: "每個月出現又大又圓的「滿月」通常是在什麼時候？",
        options: ["農曆初二", "農曆初七", "農曆二十三", "農曆十五"],
        answer: 4,
        explanation: "滿月通常在農曆十五日出現。"
      },
      {
        question: "從農曆月初到月中，月亮看起來的變化是怎麼樣的？",
        options: ["越變越小", "越來越圓", "由圓變缺", "形狀都不變"],
        answer: 2,
        explanation: "月亮從眉月漸漸變成圓月。"
      },
      {
        question: "下列傳統節日中，哪一個節日晚上一定看不到滿月？",
        options: ["元宵節", "端午節", "中秋節", "中元節"],
        answer: 2,
        explanation: "端午節是初五不是滿月。"
      },
      {
        question: "面向南方看農曆下半月的月相，缺口朝向哪一邊？",
        options: ["朝向右邊", "朝向左邊", "缺在正中", "四周皆缺"],
        answer: 1,
        explanation: "滿月後月亮從右邊開始變缺。"
      },
      {
        question: "今天如果看見上弦月，大約要隔多久才會再次看見上弦月？",
        options: ["約7天", "約15天", "約30天", "約1年"],
        answer: 3,
        explanation: "月相變化週期大約是一個月。"
      }
    ]
  },
  {
    id: "yx-3-B",
    title: "月相 3 評量B",
    category: "月相",
    questions: [
      {
        question: "農曆十五或十六的晚上，容易看到圓圓的滿月。",
        options: ["O", "X"],
        answer: 1,
        explanation: "農曆十五前後常是滿月。"
      },
      {
        question: "月相形狀的規律變化，是跟著國曆日期走的。",
        options: ["O", "X"],
        answer: 2,
        explanation: "月相變化是對應農曆日期。"
      },
      {
        question: "農曆初一的夜晚，天空中完全看不到月亮。",
        options: ["O", "X"],
        answer: 1,
        explanation: "初一為朔，晚上看不到月亮。"
      },
      {
        question: "月相由滿月到下一次滿月，大約要經過一年。",
        options: ["O", "X"],
        answer: 2,
        explanation: "月相週期大約是一個月。"
      },
      {
        question: "農曆初七、初八時，看到的月亮接近半圓形。",
        options: ["O", "X"],
        answer: 1,
        explanation: "初七、初八前後為上弦月。"
      },
      {
        question: "觀測月相若遇到下雨看不見，也要誠實記錄。",
        options: ["O", "X"],
        answer: 1,
        explanation: "沒看到也要記下天氣原因。"
      },
      {
        question: "中秋節和端午節這兩天，晚上看到的月相相同。",
        options: ["O", "X"],
        answer: 2,
        explanation: "農曆日期不同，月相不同。"
      },
      {
        question: "每個月的農曆初一，晚上的月相通常是？",
        options: ["圓圓的滿月", "半圓形月亮", "完全看不見", "像香蕉的細月"],
        answer: 3,
        explanation: "農曆初一為朔，看不見月亮。"
      },
      {
        question: "中秋節是農曆八月十五，當晚最可能看見什麼月相？",
        options: ["細細的眉月", "看不見月亮", "半圓形月亮", "圓圓的滿月"],
        answer: 4,
        explanation: "中秋節常能看見滿月。"
      },
      {
        question: "從農曆初三到農曆十五，月亮亮面有何變化？",
        options: ["愈來愈大", "愈來愈小", "完全沒變化", "先變小再變大"],
        answer: 1,
        explanation: "初三到十五亮面愈變愈圓。"
      },
      {
        question: "月相完成一次「圓到缺再到圓」，大約多久？",
        options: ["大約七天", "大約三十天", "大約半年", "大約一年"],
        answer: 2,
        explanation: "月相一個週期約農曆一個月。"
      },
      {
        question: "下列哪一個節日的夜晚，絕對不可能看見滿月？",
        options: ["元宵節", "中元節", "端午節", "中秋節"],
        answer: 3,
        explanation: "端午是初五，不是滿月。"
      },
      {
        question: "傍晚看到亮面朝西的半圓月，稱為什麼月相？",
        options: ["下弦月", "新月", "滿月", "上弦月"],
        answer: 4,
        explanation: "初七初八亮西邊為上弦月。"
      },
      {
        question: "阿光今天看見滿月，下次再看到滿月要等多久？",
        options: ["大約三十天", "大約七天", "大約一年", "大約三個月"],
        answer: 1,
        explanation: "月相循環大約需要一個月。"
      },
      {
        question: "農曆初八和農曆二十二的月相，外觀看起來？",
        options: ["都是滿月", "都很接近半圓", "都完全看不見", "都是細細彎眉"],
        answer: 2,
        explanation: "兩者都是半圓狀的弦月。"
      }
    ]
  },
  {
    id: "sy11",
    title: "水域 1a",
    category: "水域",
    questions: [
      {
        question: "臺灣有許多不同的水域環境。",
        options: ["○", "╳"],
        answer: 1,
        explanation: "臺灣擁有河流、湖泊、池塘、水田和海洋等多樣的水域環境。"
      },
      {
        question: "調查水田的環境時，可能會發現田螺、泥鰍和小丑魚的蹤跡。",
        options: ["○", "╳"],
        answer: 2,
        explanation: "田螺和泥鰍可能在水田中發現，但小丑魚是海水魚，生活在海洋。"
      },
      {
        question: "根長在水底土裡、葉片漂在水面上的水生植物，稱為漂浮性植物。",
        options: ["○", "╳"],
        answer: 2,
        explanation: "這種植物稱為「浮葉性植物」，漂浮性植物的根不固著在土裡。"
      },
      {
        question: "大萍能漂浮在水面上，是因為葉面上的葉脈很明顯。",
        options: ["○", "╳"],
        answer: 2,
        explanation: "大萍能漂浮是因為葉片有許多通氣組織，內部充滿空氣。"
      },
      {
        question: "布袋蓮能浮在水面上，是因為布袋蓮膨大的葉柄中有許多通氣組織，裡面存在著許多空氣。",
        options: ["○", "╳"],
        answer: 1,
        explanation: "葉柄中的通氣組織充滿空氣，提供了浮力，使布袋蓮能漂浮。"
      },
      {
        question: "蝦和蝌蚪的運動方式完全一樣。",
        options: ["○", "╳"],
        answer: 2,
        explanation: "蝦主要是利用腹部的游泳足或尾部划水移動，蝌蚪則是靠尾巴擺動。"
      },
      {
        question: "魚在水中，魚口和鰓蓋不停的開合，是在呼吸。",
        options: ["○", "╳"],
        answer: 1,
        explanation: "魚口吸入水，鰓蓋開合使水流經鰓部，進行氣體交換，是魚的呼吸方式。"
      },
      {
        question: "為了適應水中環境，水生植物的植物體通常比陸生植物堅硬。",
        options: ["○", "╳"],
        answer: 2,
        explanation: "水有浮力，水生植物不需要堅硬的莖來支持，所以通常較為柔軟。"
      },
      {
        question: "水域環境除了提供人們進行休閒活動，人們也可以從水域環境裡取得許多資源。",
        options: ["○", "╳"],
        answer: 1,
        explanation: "水域環境提供漁業、水利灌溉、觀光等資源。"
      },
      {
        question: "在河流上游進行濫墾、濫伐，會破壞下游水域生態環境。",
        options: ["○", "╳"],
        answer: 1,
        explanation: "濫墾濫伐會造成水土流失，泥沙沖刷到下游，影響水質和生態。"
      },
      {
        question: "調查水域環境時，不需要記錄什麼事項？",
        options: ["水域環境類型", "水質狀況", "水域的地點", "同行的人"],
        answer: 4,
        explanation: "調查水域環境應著重在自然環境本身，同行者屬於個人資訊，與環境調查無關。"
      },
      {
        question: "下列哪一種水生植物的根長在水底土裡，葉片會保持平貼在水面？",
        options: ["浮萍", "睡蓮", "蓮", "水蘊草"],
        answer: 2,
        explanation: "睡蓮是浮葉性植物，根部在土中，葉片平貼水面；蓮的葉片會挺出水面。"
      },
      {
        question: "把水族箱的水量減少，水面降低後，在水裡的水蘊草會有什麼變化？",
        options: ["挺出水面", "浮在水面上", "沉在水面下", "無法生存"],
        answer: 3,
        explanation: "水蘊草是沉水性植物，葉片會完全生長在水面下。"
      },
      {
        question: "哪個關於孔雀魚的敘述正確？",
        options: ["只利用背鰭游泳", "呼吸時，會把口張開，鰓蓋閉合，讓水流到魚鰓", "可以用魚鰭爬行", "利用肺呼吸"],
        answer: 2,
        explanation: "魚的呼吸是透過口部吸水，水流經鰓部進行氣體交換。"
      },
      {
        question: "紅娘華在水中是利用哪一個部位來游泳的？",
        options: ["細長的中、後腳", "呼吸管", "前腳", "頭"],
        answer: 1,
        explanation: "紅娘華的中、後腳細長，可用於划水游泳。"
      }
    ]
  },
  {
    id: "sy12",
    title: "水域 1b",
    category: "水域",
    questions: [
      {
        question: "臺灣有許多種類的水域，像河流、湖泊、池塘和海洋等。",
        options: ["○", "╳"],
        answer: 1,
        explanation: "臺灣地形多變，所以有各種不同的水域環境。"
      },
      {
        question: "在觀察稻田時，你可能會看到田螺、泥鰍，還有熱帶魚。",
        options: ["○", "╳"],
        answer: 2,
        explanation: "田螺和泥鰍可能在田裡出現，但熱帶魚是生活在海洋或熱帶河流，不可能在水田中。"
      },
      {
        question: "根長在水底泥土裡，葉子浮在水面上的植物，就叫做漂浮性植物。",
        options: ["○", "╳"],
        answer: 2,
        explanation: "這種植物是「浮葉性植物」，漂浮性植物的根是懸在水中的。"
      },
      {
        question: "浮萍能漂在水面上，是因為它的葉子又大又硬。",
        options: ["○", "╳"],
        answer: 2,
        explanation: "浮萍能浮起來是因為它的葉子裡有很多空氣，讓它有浮力。"
      },
      {
        question: "布袋蓮的葉柄膨脹得像氣球一樣，裡面充滿了空氣，所以能浮在水面上。",
        options: ["○", "╳"],
        answer: 1,
        explanation: "布袋蓮膨大的葉柄裡有很多通氣組織，裡面有很多空氣，可以幫助它浮在水面上。"
      },
      {
        question: "蝦子和蝌蚪都是靠擺動尾巴在水裡移動。",
        options: ["○", "╳"],
        answer: 2,
        explanation: "蝦子主要用腹部的游泳腳或尾巴划水，而蝌蚪則是靠擺動尾巴來移動。"
      },
      {
        question: "魚一直張開和閉合嘴巴，是在進行呼吸。",
        options: ["○", "╳"],
        answer: 1,
        explanation: "魚會吸入水，讓水流過鰓部，這樣可以從水裡吸取氧氣，這是牠們呼吸的方式。"
      },
      {
        question: "為了抵抗水的浮力，水生植物的莖通常比陸生植物更堅硬。",
        options: ["○", "╳"],
        answer: 2,
        explanation: "水有浮力，可以支撐水生植物，所以它們不需要很硬的莖，通常都比較柔軟。"
      },
      {
        question: "水域環境除了可以讓我們玩樂，還能提供許多有用的東西。",
        options: ["○", "╳"],
        answer: 1,
        explanation: "水域環境不只可以划船、釣魚，還提供漁獲、灌溉用水等資源。"
      },
      {
        question: "如果在河流的上游亂砍樹木，會讓下游的水變得比較髒。",
        options: ["○", "╳"],
        answer: 1,
        explanation: "亂砍樹木會造成土壤流失，泥沙會跟著水流到下游，讓水質變差，破壞生態。"
      },
      {
        question: "調查水域時，以下哪項不需要特別記錄？",
        options: ["水域在哪個地方", "水的乾淨程度", "水裡有什麼生物", "今天的心情"],
        answer: 4,
        explanation: "觀察水域環境時，應該記錄地點、水質和生物，跟個人心情無關。"
      },
      {
        question: "哪一種植物的根在土裡，葉子卻緊貼著水面？",
        options: ["浮萍", "睡蓮", "水蘊草", "布袋蓮"],
        answer: 2,
        explanation: "睡蓮是浮葉性植物，它的根部在水底的泥土裡，但葉子是平平地浮在水面上。"
      },
      {
        question: "如果把水草缸裡的水放掉一些，原本在水裡的水蘊草會怎麼樣？",
        options: ["露出水面", "沉在水底", "浮在水面", "無法生長"],
        answer: 2,
        explanation: "水蘊草是沉水性植物，葉子會在水面下生長，所以就算水變少，它還是會保持在水底。"
      },
      {
        question: "關於孔雀魚，哪一句話是正確的？",
        options: ["只用尾巴游動", "張開嘴巴讓水流進去，閉上鰓蓋", "用鰓呼吸時，會吸入空氣", "會用魚鰭走路"],
        answer: 2,
        explanation: "魚的呼吸方式是透過嘴巴吸水，讓水流過鰓部來進行氣體交換。"
      },
      {
        question: "紅娘華在水裡游動時，主要靠身體的哪一個部分？",
        options: ["細長的前腳", "呼吸管", "中間和後面的腳", "頭部"],
        answer: 3,
        explanation: "紅娘華的中、後腳比較細長，很適合在水裡划水游泳。"
      }
    ]
  },
  {
    id: "sy-1-A",
    title: "水域 1 評量A",
    category: "水域",
    questions: [
      {
        question: "在臺灣的許多地方，到處都可以看見水域環境。",
        options: ["O", "X"],
        answer: 1,
        explanation: "臺灣水域環境十分多樣。"
      },
      {
        question: "水田裡的水流速度，通常比溪流平緩。",
        options: ["O", "X"],
        answer: 1,
        explanation: "水田的水流平緩或靜止。"
      },
      {
        question: "水田是人工開闢的，所以水中完全不會有生物生活。",
        options: ["O", "X"],
        answer: 2,
        explanation: "水田常有青蛙田螺等生物。"
      },
      {
        question: "海水含鹽量很高，所以海洋裡很難有生物生存。",
        options: ["O", "X"],
        answer: 2,
        explanation: "海洋裡生活著豐富的生物。"
      },
      {
        question: "在淡水的溪流裡，可以抓到小丑魚來觀察。",
        options: ["O", "X"],
        answer: 2,
        explanation: "小丑魚生活在海水中。"
      },
      {
        question: "臺灣清溪蟹是生活在深海裡的鹹水生物。",
        options: ["O", "X"],
        answer: 2,
        explanation: "清溪蟹生活在淡水小溪中。"
      },
      {
        question: "蓄水的水田和生態池，都屬於濕地環境。",
        options: ["O", "X"],
        answer: 1,
        explanation: "水陸交界處屬於濕地。"
      },
      {
        question: "在校園的生態池裡，常可以找到樹蛙和蓋斑鬥魚。",
        options: ["O", "X"],
        answer: 1,
        explanation: "都是常見的淡水生物。"
      },
      {
        question: "到水邊觀察生態時，一個人自己去最方便。",
        options: ["O", "X"],
        answer: 2,
        explanation: "一定要有大人陪同才安全。"
      },
      {
        question: "選擇想要觀察的水域時，應該選擇安全又方便到達的地點。",
        options: ["O", "X"],
        answer: 1,
        explanation: "觀察水域要注意自身安全。"
      },
      {
        question: "到水域進行觀察時，應該避免破壞原有的環境。",
        options: ["O", "X"],
        answer: 1,
        explanation: "要好好愛護大自然環境。"
      },
      {
        question: "出發去觀察水域環境之前，應該先查好適合的時間。",
        options: ["O", "X"],
        answer: 1,
        explanation: "做好準備才能觀察順利。"
      },
      {
        question: "觀察撈起來的水生生物後，離開前要放回原處。",
        options: ["O", "X"],
        answer: 1,
        explanation: "要尊重生命放回原處。"
      },
      {
        question: "在水域觀察的過程中，順便生火烤肉很適合。",
        options: ["O", "X"],
        answer: 2,
        explanation: "烤肉會製造垃圾汙染水質。"
      },
      {
        question: "想觀察對岸遠處的水鳥，應該使用放大鏡。",
        options: ["O", "X"],
        answer: 2,
        explanation: "看遠處物體要用望遠鏡。"
      },
      {
        question: "地球表面範圍最大的水域環境是什麼？",
        options: ["內陸湖泊", "地下水庫", "海洋", "小水溝"],
        answer: 3,
        explanation: "海洋佔地表約七成面積。"
      },
      {
        question: "選擇要觀察的水域時，哪一種地點應該避免前往？",
        options: ["地勢平坦", "岸邊危險陡峭", "光線充足", "交通便利"],
        answer: 2,
        explanation: "陡峭易滑地點十分危險。"
      },
      {
        question: "進行水域生態觀察時，下列哪一種行為是不對的？",
        options: ["攜伴互助", "詳實做筆記", "愛護周邊植物", "隨便拔走野生植物"],
        answer: 4,
        explanation: "不能隨便破壞大自然植物。"
      },
      {
        question: "下列哪一種生物的生活環境，和其他三種不一樣？",
        options: ["蓋斑鬥魚", "大海龜", "小丑魚", "綠海藻"],
        answer: 1,
        explanation: "鬥魚為淡水其餘為海水。"
      },
      {
        question: "下列哪一種水域環境中，最容易看見大片的水稻？",
        options: ["湍急溪流", "平緩水田", "深山水庫", "沿海潟湖"],
        answer: 2,
        explanation: "水稻種植於平緩水田裡。"
      },
      {
        question: "在一般的水田裡，最不容易發現下列哪一種生物？",
        options: ["浮萍", "泥鰍", "海藻", "田螺"],
        answer: 3,
        explanation: "海藻生長在鹹鹹海水中。"
      },
      {
        question: "觀察紀錄表寫著「水流平靜、有一整排水稻」，是指哪種水域？",
        options: ["水田", "湖泊", "瀑布", "池塘"],
        answer: 1,
        explanation: "種水稻且水流平靜的是水田。"
      }
    ]
  },
  {
    id: "sy-1-B",
    title: "水域 1 評量B",
    category: "水域",
    questions: [
      {
        question: "溪流、池塘與海洋，都屬於地球上的水域環境。",
        options: ["O", "X"],
        answer: 1,
        explanation: "這些都是常見的水域環境。"
      },
      {
        question: "農田裡的水流速度，通常比山上的溪流更緩慢。",
        options: ["O", "X"],
        answer: 1,
        explanation: "農田水流平緩，溪流湍急。"
      },
      {
        question: "小丑魚原本生活在海裡，無法在淡水河川生存。",
        options: ["O", "X"],
        answer: 1,
        explanation: "小丑魚是海水魚類。"
      },
      {
        question: "水田是人工開闢的，所以裡面完全沒有生物生存。",
        options: ["O", "X"],
        answer: 2,
        explanation: "水田裡也有泥鰍、青蛙等。"
      },
      {
        question: "到戶外進行水域調查，一定要有大人陪同才安全。",
        options: ["O", "X"],
        answer: 1,
        explanation: "親水活動要有大人陪同。"
      },
      {
        question: "在野外撈起觀察的水生生物，觀察完應放回原地。",
        options: ["O", "X"],
        answer: 1,
        explanation: "愛護生命，觀察完放回原處。"
      },
      {
        question: "乾淨的溪流就算倒進一點工廠廢水，也不影響魚。",
        options: ["O", "X"],
        answer: 2,
        explanation: "污水會破壞水質毒害生物。"
      },
      {
        question: "地球表面被水覆蓋的面積，比陸地面積還要大。",
        options: ["O", "X"],
        answer: 1,
        explanation: "海洋佔地球表面約七成。"
      },
      {
        question: "下列哪一種水域環境，佔地球表面的面積最大？",
        options: ["水庫", "池塘", "高山湖泊", "海洋"],
        answer: 4,
        explanation: "海洋是地球上面積最大的水域。"
      },
      {
        question: "我們常吃的水稻，大多種植在哪一種水域環境？",
        options: ["水田", "深海", "湍急溪流", "高山水庫"],
        answer: 1,
        explanation: "水稻種植在積水的水田中。"
      },
      {
        question: "下列哪一種生物，通常生活在鹹鹹的海洋中？",
        options: ["大肚魚", "海龜", "蓋斑鬥魚", "拉氏清溪蟹"],
        answer: 2,
        explanation: "海龜生活在廣大的海洋中。"
      },
      {
        question: "做戶外水域觀察時，應該避免前往哪種地點？",
        options: ["有護欄的步道", "校園裡的生態池", "水流很急的深潭", "安全的公園池塘"],
        answer: 3,
        explanation: "深水急流容易發生危險。"
      },
      {
        question: "在淡水的稻田或水溝中，最不可能發現何者？",
        options: ["大肚魚", "水蚤", "福壽螺", "海裡的珊瑚"],
        answer: 4,
        explanation: "珊瑚生活在清澈溫暖的海水。"
      },
      {
        question: "想採樣水中的小昆蟲，最適合帶哪一種器材？",
        options: ["水網", "量角器", "指北針", "長鐵尺"],
        answer: 1,
        explanation: "水網方便在水中撈取生物。"
      },
      {
        question: "下列哪一種做法，最能保護溪流的水質？",
        options: ["把髒廢水倒進溪裡", "少用化學清潔劑", "在溪邊烤肉丟垃圾", "隨意放生外來魚種"],
        answer: 2,
        explanation: "少用清潔劑可減少水質污染。"
      },
      {
        question: "平原上的溼地與水田，在生態上有什麼好處？",
        options: ["徹底曬乾所有土壤", "消滅所有水中昆蟲", "蓄水並提供生物家園", "讓大型船隻開進去"],
        answer: 3,
        explanation: "溼地能蓄水並孕育多樣生物。"
      },
      {
        question: "下列哪一種水域，水流的速度通常最為湍急？",
        options: ["水稻田", "平原湖泊", "公園小池子", "高山溪流"],
        answer: 4,
        explanation: "高山溪流坡度大且流速快。"
      },
      {
        question: "在水邊活動如果不小心落水，第一步應該怎麼做？",
        options: ["放鬆身體大聲呼救", "雙手亂抓水草尖叫", "閉上眼睛沉到水底", "脫下衣服往深處游"],
        answer: 1,
        explanation: "保持冷靜並呼救等待救援。"
      },
      {
        question: "下列哪一組生物，都生活在淡水環境中？",
        options: ["海龜與飛魚", "蓋斑鬥魚與蝌蚪", "小丑魚與海藻", "鯨魚與珊瑚"],
        answer: 2,
        explanation: "鬥魚與蝌蚪生活在淡水裡。"
      },
      {
        question: "想觀察水滴裡細小微小的浮游生物，該用何者？",
        options: ["望遠鏡", "普通手電筒", "顯微鏡或放大鏡", "指南針"],
        answer: 3,
        explanation: "顯微鏡能放大微小生物。"
      },
      {
        question: "池塘表面漂著一片片綠色的小葉片，最可能是？",
        options: ["玫瑰花", "榕樹葉", "蒲公英", "浮萍"],
        answer: 4,
        explanation: "浮萍是漂在水面的小植物。"
      },
      {
        question: "下列哪種行為，會直接破壞溪流原本的生態？",
        options: ["工廠把廢水倒進溪流", "在步道旁安靜散步", "拿放大鏡看石頭青苔", "用相機拍水中小魚"],
        answer: 1,
        explanation: "工廠廢水會毒死水中生物。"
      }
    ]
  },
  {
    id: "sy21",
    title: "水域 2a",
    category: "水域",
    questions: [
      {
        question: "河川的水流和生態池的水流相比，河川的比較緩慢。",
        options: ["○", "╳"],
        answer: 2,
        explanation: "河川的水流通常比生態池的水流快。"
      },
      {
        question: "調查水域環境時，可以準備放大鏡、紀錄表、圖鑑、撈網、水桶和望遠鏡等用具。",
        options: ["○", "╳"],
        answer: 1,
        explanation: "這些工具可以幫助我們觀察、記錄和採集水域中的生物與環境。"
      },
      {
        question: "依生長方式來分，蓮和睡蓮都是屬於挺水性植物。",
        options: ["○", "╳"],
        answer: 2,
        explanation: "蓮是挺水性植物，但睡蓮是浮葉性植物。"
      },
      {
        question: "只要水生植物的根、莖和葉都漂浮在水面，就可以稱為浮葉性植物。",
        options: ["○", "╳"],
        answer: 2,
        explanation: "浮葉性植物的根是生長在水底土裡，葉片漂浮在水面上，而根、莖和葉都漂浮在水面的植物稱為漂浮性植物。"
      },
      {
        question: "大萍的葉片裡具有通氣組織，可儲存空氣，幫助它漂浮在水面上。",
        options: ["○", "╳"],
        answer: 1,
        explanation: "葉片內的通氣組織充滿空氣，可以提供浮力。"
      },
      {
        question: "睡蓮的葉柄不會隨水位高低而伸展或彎曲。",
        options: ["○", "╳"],
        answer: 2,
        explanation: "睡蓮的葉柄會隨著水位高低而伸展或彎曲，使葉片能保持在水面上。"
      },
      {
        question: "任何一種水生動物，牠的呼吸都是利用鰓來進行的。",
        options: ["○", "╳"],
        answer: 2,
        explanation: "有些水生動物，如青蛙、烏龜等，是利用肺呼吸。"
      },
      {
        question: "紅娘華是利用鰓來進行呼吸。",
        options: ["○", "╳"],
        answer: 2,
        explanation: "紅娘華是利用呼吸管到水面換氣，再利用氣孔呼吸。"
      },
      {
        question: "人類可以從水域環境取得資源，例如：利用珊瑚礁建造房屋。",
        options: ["○", "╳"],
        answer: 1,
        explanation: "珊瑚礁是一種天然資源，可以用來建造房屋等。"
      },
      {
        question: "農業肥料可以讓水生植物長得更好，所以可以直接排入水域中。",
        options: ["○", "╳"],
        answer: 2,
        explanation: "過量的肥料會造成水域優養化，進而破壞生態環境。"
      },
      {
        question: "有關蝌蚪與青蛙適應環境的方式，下列哪一項有誤？",
        options: ["蝌蚪用鰓呼吸", "蝌蚪用尾擺動游泳", "青蛙用腳爬行", "青蛙用肺呼吸"],
        answer: 3,
        explanation: "青蛙主要是用腳跳躍，而非爬行。"
      },
      {
        question: "依生長方式來分，下列哪一種水生植物和其他三種不同？",
        options: ["水蘊草", "布袋蓮", "大萍", "浮萍"],
        answer: 1,
        explanation: "水蘊草是沉水性植物，布袋蓮、大萍、浮萍則為漂浮性植物。"
      },
      {
        question: "有關蓮的敘述，哪一項錯誤？",
        options: ["蓮藕有通氣組織", "花和葉片會挺出水面", "蓮子是蓮的種子", "葉柄裡無中空管道"],
        answer: 4,
        explanation: "蓮的葉柄和莖都有中空管道，用來通氣。"
      },
      {
        question: "下列哪一種水生動物的運動方式只有一種？",
        options: ["蝌蚪", "蛙", "蝦", "蟹"],
        answer: 1,
        explanation: "蝌蚪只會用尾巴游泳；青蛙會跳、游、爬；蝦和蟹則會游、爬、走。"
      },
      {
        question: "哪個做法無法保護溪流裡的水生生物？",
        options: ["不隨意棄養水生生物", "排放工廠廢水到溪流中", "養鴨場的汙水不隨意排放", "不在溪邊烤肉"],
        answer: 2,
        explanation: "排放工廠廢水會汙染水質，嚴重危害水生生物的生存。"
      }
    ]
  },
  {
    id: "sy22",
    title: "水域 2b",
    category: "水域",
    questions: [
      {
        question: "河裡的水流，通常會比池塘或生態池的水流還要快。",
        options: ["○", "╳"],
        answer: 1,
        explanation: "河川的水流一般都比較急，而池塘或生態池的水流則比較緩慢或靜止。"
      },
      {
        question: "觀察水域時，準備望遠鏡、撈網、紀錄本、放大鏡這些工具會很有幫助。",
        options: ["○", "╳"],
        answer: 1,
        explanation: "這些工具可以讓我們更仔細地觀察、記錄和收集水中的生物和環境資料。"
      },
      {
        question: "荷花和睡蓮的葉子，都會高高地挺出水面。",
        options: ["○", "╳"],
        answer: 2,
        explanation: "荷花的葉子會挺出水面，但睡蓮的葉子是平貼在水面上的。"
      },
      {
        question: "只要水生植物的葉子浮在水面上，就可以叫做浮葉性植物。",
        options: ["○", "╳"],
        answer: 2,
        explanation: "浮葉性植物的根是長在土裡，葉子才浮在水面。如果根、莖、葉都浮在水面，那是漂浮性植物。"
      },
      {
        question: "大萍的葉子裡面有很多小洞洞，可以存空氣，幫助它漂在水上。",
        options: ["○", "╳"],
        answer: 1,
        explanation: "大萍葉片裡的通氣組織就像小氣囊，裡面充滿空氣，提供了浮力。"
      },
      {
        question: "睡蓮的葉柄長短不會因為水位的改變而變化。",
        options: ["○", "╳"],
        answer: 2,
        explanation: "睡蓮的葉柄會隨著水位高低伸長或縮短，這樣葉片才能一直浮在水面上。"
      },
      {
        question: "所有的水生動物都是用鰓呼吸的。",
        options: ["○", "╳"],
        answer: 2,
        explanation: "有些水生動物像青蛙、海龜，是透過肺部呼吸，需要到水面換氣。"
      },
      {
        question: "紅娘華像魚一樣，用鰓在水裡呼吸。",
        options: ["○", "╳"],
        answer: 2,
        explanation: "紅娘華是利用尾巴末端的呼吸管伸出水面吸取空氣，不是用鰓呼吸。"
      },
      {
        question: "人類可以利用水域環境的珊瑚礁來蓋房子。",
        options: ["○", "╳"],
        answer: 1,
        explanation: "珊瑚礁是一種天然的石灰岩，可以用來當作建材。"
      },
      {
        question: "為了讓水草長得更好，可以直接把農業肥料倒入河川。",
        options: ["○", "╳"],
        answer: 2,
        explanation: "過多的肥料會讓水中藻類大量生長，造成水質變差，傷害水域生態。"
      },
      {
        question: "關於蝌蚪和青蛙的說法，哪一個是錯誤的？",
        options: ["蝌蚪是用鰓呼吸", "蝌蚪用尾巴游泳", "青蛙用肺呼吸", "青蛙是用腳在地上爬行"],
        answer: 4,
        explanation: "青蛙在陸地上主要是用腳跳躍或走路，不是爬行。"
      },
      {
        question: "下列哪種植物的生長方式和其他三種不同？",
        options: ["睡蓮", "布袋蓮", "浮萍", "大萍"],
        answer: 1,
        explanation: "睡蓮的根在土裡，葉子浮在水面；其他三種植物的根、莖、葉都在水面上漂浮。"
      },
      {
        question: "關於蓮花的敘述，哪一項是不對的？",
        options: ["藕（蓮花的莖）裡面有通氣的洞", "它的花和葉子會挺出水面", "蓮子是它的種子", "葉柄裡面是實心的"],
        answer: 4,
        explanation: "蓮花的葉柄和莖部都是中空的，用來運送空氣到水下。"
      },
      {
        question: "哪一種水生動物在水中移動的方式只有一種？",
        options: ["蝦子", "螃蟹", "蝌蚪", "青蛙"],
        answer: 3,
        explanation: "蝌蚪只會用尾巴划水游泳；蝦和螃蟹會游泳也會爬行；青蛙會游泳也會跳。"
      },
      {
        question: "哪一個行為會傷害溪流裡的生物？",
        options: ["不隨意把寵物魚丟到溪裡", "把工廠的廢水排到溪裡", "養鴨場的汙水不亂排", "不在溪邊亂丟垃圾"],
        answer: 2,
        explanation: "排放工廠廢水會嚴重污染水質，對水裡的生物造成很大的傷害。"
      }
    ]
  },
  {
    id: "sy-2-A",
    title: "水域 2 評量A",
    category: "水域",
    questions: [
      {
        question: "生長在水域環境中的植物，都稱為水生植物。",
        options: ["O", "X"],
        answer: 1,
        explanation: "長在水裡的都算水生植物。"
      },
      {
        question: "插秧生長在水田裡的水稻，不是水生植物。",
        options: ["O", "X"],
        answer: 2,
        explanation: "水稻能適應積水環境生長。"
      },
      {
        question: "根長在水底泥土裡、葉子平貼在水面上的，稱為浮葉性植物。",
        options: ["O", "X"],
        answer: 1,
        explanation: "葉子貼在水面上是浮葉性。"
      },
      {
        question: "水蘊草整株都漂浮在水面上，屬於漂浮性水生植物。",
        options: ["O", "X"],
        answer: 2,
        explanation: "水蘊草整株沉在水面下。"
      },
      {
        question: "把水蘊草拿出水面時，它的莖會軟軟的向下垂，無法直立。",
        options: ["O", "X"],
        answer: 1,
        explanation: "離開水面沒有水提供浮力。"
      },
      {
        question: "睡蓮的葉柄很柔軟，會隨著水位高低彎曲或伸展。",
        options: ["O", "X"],
        answer: 1,
        explanation: "柔軟葉柄讓葉片浮在水面。"
      },
      {
        question: "布袋蓮的葉柄裡有氣室，所以會沉入水底。",
        options: ["O", "X"],
        answer: 2,
        explanation: "氣室充滿空氣會浮在水上。"
      },
      {
        question: "蓮花長長的葉柄和泥裡的蓮藕，內部都有通氣組織。",
        options: ["O", "X"],
        answer: 1,
        explanation: "通氣組織可以儲存運送空氣。"
      },
      {
        question: "餐桌上常吃的蓮藕，是蓮的哪一個構造？",
        options: ["地下莖", "根部", "花朵", "葉柄"],
        answer: 1,
        explanation: "蓮藕是膨大的地下莖。"
      },
      {
        question: "關於漂浮性植物布袋蓮的特徵，哪一項描述是錯誤的？",
        options: ["根深深長在水底土裡", "葉柄膨大像球", "葉柄裡有氣室", "葉片浮在水上"],
        answer: 4,
        explanation: "漂浮植物根懸浮在水中。"
      },
      {
        question: "漂浮性水生植物能浮在水面上，主要的原因是什麼？",
        options: ["葉片分泌油脂", "膨大部位充滿空氣", "根部緊扣池泥", "水質特別黏稠"],
        answer: 2,
        explanation: "氣室充滿空氣所以會浮起。"
      },
      {
        question: "有些水生植物體內有儲存和運送空氣的構造，稱為什麼？",
        options: ["導水管", "支撐木質", "通氣組織", "儲脂囊"],
        answer: 3,
        explanation: "通氣組織能幫忙運送空氣。"
      },
      {
        question: "荷花葉柄裡的中空管道，主要有什麼功能？",
        options: ["捕食水蚤", "凝結水分", "儲存種子", "儲存與運送空氣"],
        answer: 4,
        explanation: "中空管道可儲存運送空氣。"
      },
      {
        question: "把整株布袋蓮壓進水裡再放手，會發生什麼事？",
        options: ["沉入底沙", "迅速浮起", "碎裂解體", "變重下墜"],
        answer: 2,
        explanation: "體內有空氣所以會浮起來。"
      },
      {
        question: "水族箱的水位降低後，生長在裡面的水蘊草會怎麼樣？",
        options: ["挺出水面", "浮出水面", "跟著水位下降沉在水裡", "枯黃硬化"],
        answer: 3,
        explanation: "沉水植物始終留在水面下。"
      },
      {
        question: "無論水位高或低，睡蓮葉子都能平貼水面，是靠什麼構造調整的？",
        options: ["長而柔軟的葉柄", "肥厚葉片", "堅硬粗莖", "巨大根系"],
        answer: 1,
        explanation: "柔軟長柄隨水深彎曲伸展。"
      }
    ]
  },
  {
    id: "sy-2-B",
    title: "水域 2 評量B",
    category: "水域",
    questions: [
      {
        question: "能夠長期生長在水裡或水邊的植物，叫水生植物。",
        options: ["O", "X"],
        answer: 1,
        explanation: "適應水中生活的植物叫水生植物。"
      },
      {
        question: "布袋蓮整株漂在水面，根部並沒有固定在泥土裡。",
        options: ["O", "X"],
        answer: 1,
        explanation: "漂浮植物根懸浮在水中。"
      },
      {
        question: "水蘊草拿出水面後，莖和葉依然能像大樹般筆直。",
        options: ["O", "X"],
        answer: 2,
        explanation: "離開水缺乏浮力會倒下。"
      },
      {
        question: "水生植物體內常有通氣組織，可幫忙運送空氣。",
        options: ["O", "X"],
        answer: 1,
        explanation: "通氣組織能儲存運送氣體。"
      },
      {
        question: "睡蓮的葉子平平貼在水面上，屬於沉水性植物。",
        options: ["O", "X"],
        answer: 2,
        explanation: "睡蓮屬於浮葉性植物。"
      },
      {
        question: "荷花的葉柄挺立出水面，屬於挺水性水生植物。",
        options: ["O", "X"],
        answer: 1,
        explanation: "荷花枝葉直立伸出水面。"
      },
      {
        question: "切開布袋蓮膨大的葉柄，會看見許多充滿氣的孔洞。",
        options: ["O", "X"],
        answer: 1,
        explanation: "孔洞充滿空氣能幫助漂浮。"
      },
      {
        question: "大萍葉片表面長有細毛，具有防水不沾水的效果。",
        options: ["O", "X"],
        answer: 1,
        explanation: "葉面細毛能防水托住葉片。"
      },
      {
        question: "布袋蓮能穩穩浮在水面不下沉，最關鍵的構造是？",
        options: ["粗大的木質莖", "膨大且有氣室的葉柄", "厚硬的果實外殼", "扎在土裡的長根"],
        answer: 2,
        explanation: "氣室充滿空氣可產生浮力。"
      },
      {
        question: "我們平常吃的美味蓮藕，是蓮花植物體的哪部分？",
        options: ["長在泥裡的地下莖", "吸收養分的細根", "結出種子的果實", "開出花朵的花瓣"],
        answer: 1,
        explanation: "蓮藕是蓮的地下塊莖。"
      },
      {
        question: "下列哪一種水生植物，整株都完全浸在水面下生長？",
        options: ["漂在水上的浮萍", "挺出水面的荷花", "完全沉水的水蘊草", "平貼水面的睡蓮"],
        answer: 3,
        explanation: "水蘊草是常見沉水性植物。"
      },
      {
        question: "水池水位稍微升高時，睡蓮如何讓葉面維持浮在水上？",
        options: ["根部脫離泥土漂起", "葉子長出大氣囊", "花朵沉到水底支撐", "柔軟的葉柄順應伸長"],
        answer: 4,
        explanation: "柔軟葉柄能配合水位伸縮。"
      },
      {
        question: "把整株布袋蓮壓入水中再放手，會發生什麼變化？",
        options: ["布袋蓮會浮出水面", "整株立刻沉入池底", "池水溫度大幅上升", "葉柄立刻斷裂碎掉"],
        answer: 1,
        explanation: "體內空氣讓它自動浮起。"
      },
      {
        question: "切開荷花挺立的葉柄，裡面中空的小孔有何作用？",
        options: ["用來抓住水底石頭", "儲存並運送空氣呼吸", "防止被小魚咬破", "完全沒有任何作用"],
        answer: 2,
        explanation: "中空孔道可輸送氣體。"
      },
      {
        question: "把魚缸裡的金魚藻拿出來放桌上，金魚藻會變成怎樣？",
        options: ["直挺挺立在桌上", "立刻化成水蒸氣", "癱軟扁平在桌面上", "像木棒一樣堅硬"],
        answer: 3,
        explanation: "沒有水的浮力支撐便癱軟。"
      }
    ]
  },
  {
    id: "sy-3-A",
    title: "水域 3 評量A",
    category: "水域",
    questions: [
      {
        question: "青蛙可以離開水面在陸地上生活，所以不屬於水生動物。",
        options: ["O", "X"],
        answer: 2,
        explanation: "青蛙產卵在水裡是水生動物。"
      },
      {
        question: "許多水生動物長有方便在水裡游泳的蹼或鰭等構造。",
        options: ["O", "X"],
        answer: 1,
        explanation: "蹼或鰭能幫助在水中游泳。"
      },
      {
        question: "生活在水裡的各種水生動物，游動的方式都不一樣。",
        options: ["O", "X"],
        answer: 1,
        explanation: "水生動物行動方式很多元。"
      },
      {
        question: "魚在水裡嘴巴和鰓蓋不斷一張一合，是在呼吸。",
        options: ["O", "X"],
        answer: 1,
        explanation: "魚利用鰓吸收水中的氧氣。"
      },
      {
        question: "魚在水中游來游去，主要依靠身上的魚鰭來划水。",
        options: ["O", "X"],
        answer: 1,
        explanation: "魚鰭能幫助游泳和控制方向。"
      },
      {
        question: "蝌蚪是用鰓呼吸，長大變成青蛙後主要是用肺呼吸。",
        options: ["O", "X"],
        answer: 1,
        explanation: "幼體用鰓成體改用肺。"
      },
      {
        question: "人類的各種工程建設，對水域環境的生態完全沒有影響。",
        options: ["O", "X"],
        answer: 2,
        explanation: "過度開發會破壞自然生態。"
      },
      {
        question: "海裡的珊瑚很漂亮，去浮潛或游泳時可以隨手摘採帶回家。",
        options: ["O", "X"],
        answer: 2,
        explanation: "隨意採集會破壞珊瑚礁。"
      },
      {
        question: "河川和海洋如果遭到汙染，對人類的生活完全沒有影響。",
        options: ["O", "X"],
        answer: 2,
        explanation: "水汙染最後會影響人類健康。"
      },
      {
        question: "下列哪一種水生動物是用鰓呼吸，而且靠腹足在水底爬行？",
        options: ["泥鰍", "烏龜", "田螺", "溪蟹"],
        answer: 3,
        explanation: "田螺具腹足並用鰓呼吸。"
      },
      {
        question: "下列水生動物中，哪一種動物擁有的腳最多？",
        options: ["螃蟹", "綠頭鴨", "水生紅娘華", "牛蛙"],
        answer: 1,
        explanation: "螃蟹有五對共十隻腳。"
      },
      {
        question: "下列哪一組水生生物，全部都是用鰓來呼吸的？",
        options: ["烏龜與蝌蚪", "溪蝦與螃蟹", "水蛇與鯽魚", "樹蛙與紅娘華"],
        answer: 2,
        explanation: "蝦和蟹都是用鰓呼吸。"
      },
      {
        question: "下列哪一種做法，可以有效保護河川水域環境？",
        options: ["往溪水丟塑膠袋", "隨意倒清潔劑", "在溪邊生火烤肉", "減少使用化學洗劑"],
        answer: 4,
        explanation: "少用化學洗劑可減輕污染。"
      },
      {
        question: "看到池塘水面漂滿垃圾和雜物，怎樣處理才對？",
        options: ["倒漂白水消毒", "請大人協助打撈清理", "拿葉子遮住當作沒看見", "放著不管讓它爛掉"],
        answer: 2,
        explanation: "大家幫忙清理保持水質乾淨。"
      },
      {
        question: "下列哪一種生活資源，是來自我們周圍的水域環境？",
        options: ["水庫自來水", "天然海鹽", "海產魚蝦", "以上都是"],
        answer: 4,
        explanation: "這三種都來自水域環境。"
      },
      {
        question: "靠扁平的腹足在水底爬行，而且在水中用鰓呼吸的水生動物是？",
        options: ["石田螺", "蓋斑鬥魚", "蝌蚪", "溪蟹"],
        answer: 1,
        explanation: "石田螺用腹足爬行生活。"
      },
      {
        question: "身體有硬殼和許多隻腳，用鰓呼吸且擅長橫著走的是？",
        options: ["青蛙", "紅娘華", "螃蟹", "泥鰍"],
        answer: 3,
        explanation: "螃蟹用鰓且多足爬行。"
      },
      {
        question: "尾端伸出細長呼吸管吸取空氣，用腳在水草間爬行的水生昆蟲是？",
        options: ["石田螺", "紅娘華", "蝌蚪", "龍蝨"],
        answer: 2,
        explanation: "紅娘華用尾端呼吸管換氣。"
      },
      {
        question: "長大後主要用肺呼吸，靠強壯後腿跳躍或划水的是？",
        options: ["蝌蚪", "鯽魚", "水蛭", "青蛙"],
        answer: 4,
        explanation: "青蛙長大用肺呼吸後腿跳。"
      },
      {
        question: "小時候在水中生活用鰓呼吸，甩動細長尾巴游動的是？",
        options: ["蝌蚪", "螃蟹", "田螺", "紅娘華"],
        answer: 1,
        explanation: "蝌蚪用鰓呼吸甩尾游泳。"
      }
    ]
  },
  {
    id: "sy-3-B",
    title: "水域 3 評量B",
    category: "水域",
    questions: [
      {
        question: "魚類在水中生活，主要依靠魚鰓過濾氧氣來呼吸。",
        options: ["O", "X"],
        answer: 1,
        explanation: "魚鰓能吸取水中的氧氣。"
      },
      {
        question: "小蝌蚪長成青蛙後，鰓會消失，改用肺與皮膚呼吸。",
        options: ["O", "X"],
        answer: 1,
        explanation: "青蛙長大改用肺和皮膚呼吸。"
      },
      {
        question: "水生昆蟲紅娘華，是利用觸角伸出水面吸空氣。",
        options: ["O", "X"],
        answer: 2,
        explanation: "紅娘華靠腹部呼吸管換氣。"
      },
      {
        question: "魚身上的魚鰭，可以幫忙保持身體平衡與前進。",
        options: ["O", "X"],
        answer: 1,
        explanation: "魚鰭幫助游泳與平衡。"
      },
      {
        question: "石田螺是利用柔軟的腹足，在水底石頭上慢慢爬。",
        options: ["O", "X"],
        answer: 1,
        explanation: "石田螺靠腹足慢慢爬行。"
      },
      {
        question: "所有的水生動物運動方式都相同，都只會划水前進。",
        options: ["O", "X"],
        answer: 2,
        explanation: "水生動物有游、爬等多種方式。"
      },
      {
        question: "青蛙的後腳趾間長有薄蹼，可以幫助在水中划水。",
        options: ["O", "X"],
        answer: 1,
        explanation: "蹼能增加推力幫助游泳。"
      },
      {
        question: "水鳥的羽毛表面有一層油脂，能防水避免身體下沉。",
        options: ["O", "X"],
        answer: 1,
        explanation: "油脂防水能讓水鳥浮起。"
      },
      {
        question: "水域環境受到污染，只會影響魚蝦，跟人類無關。",
        options: ["O", "X"],
        answer: 2,
        explanation: "水質污染最後也會危害人體。"
      },
      {
        question: "去海邊玩水時，可以隨意把活珊瑚挖回家做紀念。",
        options: ["O", "X"],
        answer: 2,
        explanation: "珊瑚受保護不能隨意採集。"
      },
      {
        question: "下列哪一種水生動物，靠腹部末端的細管換氣？",
        options: ["青蛙", "紅娘華", "石田螺", "大肚魚"],
        answer: 2,
        explanation: "紅娘華具有細長呼吸管。"
      },
      {
        question: "關於蝌蚪長大變成青蛙的呼吸器官，何者正確？",
        options: ["由鰓變為肺", "由肺變為鰓", "終生都只用皮膚", "終生都只用魚鰓"],
        answer: 1,
        explanation: "成蛙由鰓呼吸轉為肺呼吸。"
      },
      {
        question: "下列水生動物中，哪一種動物擁有的腳最多隻？",
        options: ["大肚魚（0隻）", "青蛙（4隻）", "水黽（6隻）", "螃蟹（10隻）"],
        answer: 4,
        explanation: "螃蟹有十隻腳，數量最多。"
      },
      {
        question: "水生動物石田螺，主要靠身體哪個構造來移動？",
        options: ["背上的外殼", "頭頂的觸角", "柔軟的腹足", "胸前的魚鰭"],
        answer: 3,
        explanation: "石田螺依靠腹足貼地爬行。"
      },
      {
        question: "下列哪一組水生動物，長大後都是用鰓呼吸？",
        options: ["青蛙與烏龜", "吳郭魚與草蝦", "水鴨與海豚", "紅娘華與水獺"],
        answer: 2,
        explanation: "魚類與蝦類都是用鰓呼吸。"
      },
      {
        question: "魚在水裡游動時，鰓蓋不停開合是在做什麼？",
        options: ["咬碎吃進去的水草", "發出聲音嚇跑敵人", "讓身體排汗散熱", "吸取水中氧氣呼吸"],
        answer: 4,
        explanation: "鰓蓋開合引水入鰓進行呼吸。"
      },
      {
        question: "下列哪一種構造，不是水生動物適應游泳的特徵？",
        options: ["身上長出魚鰭", "腳趾間有薄蹼", "厚重羽毛吸飽水分", "身體呈流線形"],
        answer: 3,
        explanation: "羽毛吸滿水會變重下沉。"
      },
      {
        question: "看見校園水池裡飄著塑膠袋，最棒的做法是什麼？",
        options: ["請師長協助撈出", "倒更多垃圾進去", "丟石頭把垃圾壓沉", "倒整瓶洗碗精消毒"],
        answer: 1,
        explanation: "清理垃圾能維護乾淨環境。"
      }
    ]
  },
  {
    id: "wz01",
    title: "物質 1基礎",
    category: "物質",
    questions: [
      {
        question: "沙子、土壤、水是物質。",
        options: ["○", "╳"],
        answer: 1,
        explanation: "佔有空間、有重量的東西都是物質。"
      },
      {
        question: "空氣會漂浮，所以不是物質。",
        options: ["○", "╳"],
        answer: 2,
        explanation: "佔有空間又有重量，就是物質。"
      },
      {
        question: "物質會受環境因素改變，這些因素如水、溫度、空氣。",
        options: ["○", "╳"],
        answer: 1,
        explanation: "鐵生鏽是因為同時接觸到「水」和「空氣」才變紅色的。如果環境很乾燥，鐵反而不容易生鏽。"
      },
      {
        question: "鐵礦因為在較乾燥的地方，而呈現生鏽的紅色。",
        options: ["○", "╳"],
        answer: 2,
        explanation: "例如鐵碰到水和空氣會生鏽，冰塊碰到溫暖的溫度會融化。"
      },
      {
        question: "溫泉上的煙霧，是水蒸氣遇冷而凝結成小水滴。",
        options: ["○", "╳"],
        answer: 1,
        explanation: "真正的水蒸氣是看不見的，我們看到的白煙其實是「小水滴」。"
      },
      {
        question: "麵團要發酵，溫度要控制在較低的2~3度。",
        options: ["○", "╳"],
        answer: 2,
        explanation: "麵團發酵要在較溫暖的25~30度。"
      },
      {
        question: "液態豆漿加鹽巴，就可以變成塊狀的鹹豆漿。",
        options: ["○", "╳"],
        answer: 2,
        explanation: "要加醋這種酸性物質，豆漿才會凝固。"
      },
      {
        question: "物質會相互影響而產生變化。",
        options: ["○", "╳"],
        answer: 1,
        explanation: "例如把醋加進小蘇打粉會冒泡泡，這就是物質互相影響。"
      },
      {
        question: "風吹起灰塵，使得灰塵有什麼改變？",
        options: ["形狀改變", "顏色改變", "位置改變", "大小改變"],
        answer: 3,
        explanation: "風吹灰塵，只是把灰塵從一個地方搬到另一個地方。"
      },
      {
        question: "麵團加酵母菌發酵過後，有什麼改變？",
        options: ["顏色改變", "大小改變", "位置改變", "沒有改變"],
        answer: 2,
        explanation: "酵母菌會在麵團裡面產生氣體，像吹氣球一樣把麵團撐起來。"
      },
      {
        question: "冰塊受太陽熱影響，有什麼改變？",
        options: ["形狀改變", "顏色改變", "位置改變", "沒有改變"],
        answer: 1,
        explanation: "從硬硬的冰變成流動的水，是「形狀」發生了改變。"
      }
    ]
  },
  {
    id: "wz11",
    title: "物質 1a",
    category: "物質",
    questions: [
      {
        question: "物質會相互影響，例如：石頭被流水沖刷而移動。",
        options: ["○", "╳"],
        answer: 1,
        explanation: "水流沖刷石頭是物質相互影響的例子。"
      },
      {
        question: "水中含有砂石會使水變混濁，這種變化無法讓水再恢復清澈了。",
        options: ["○", "╳"],
        answer: 2,
        explanation: "靜置一段時間後，砂石會沉澱，水可以恢復清澈。"
      },
      {
        question: "戶外的鐵窗生鏽的主要因素是受到水、溫度、空氣和酸鹼的影響。",
        options: ["○", "╳"],
        answer: 1,
        explanation: "鐵生鏽是鐵與氧、水反應的結果，溫度和酸鹼也會加速反應。"
      },
      {
        question: "「在水裡加冰塊」和「燃燒瓦斯把湯加熱」都是讓溫度升高的方法。",
        options: ["○", "╳"],
        answer: 2,
        explanation: "在水裡加冰塊是讓水溫降低，而非升高。"
      },
      {
        question: "萱萱雙手在摩擦前測量到的溫度為　35.4　℃，摩擦後再測，得到的溫度會比　35.4　℃低。",
        options: ["○", "╳"],
        answer: 2,
        explanation: "摩擦會產生熱能，所以摩擦後的溫度會比摩擦前高。"
      },
      {
        question: "固態的奶油加熱變成液態後，就無法回復成固態。",
        options: ["○", "╳"],
        answer: 2,
        explanation: "液態的奶油冷卻後，會恢復成固態。"
      },
      {
        question: "鹼粽是浸泡過鹼水的糯米製成的。",
        options: ["○", "╳"],
        answer: 1,
        explanation: "製作鹼粽的過程會使用鹼水，因此得名。"
      },
      {
        question: "沙拉中的紫色高麗菜加入油醋時，紫色高麗菜的顏色不會有變化。",
        options: ["○", "╳"],
        answer: 2,
        explanation: "油醋中含有醋（酸性），會使紫色高麗菜的顏色發生變化。"
      },
      {
        question: "下列哪一種現象主要是風造成的？",
        options: ["水變混濁", "彎曲的河道", "塵沙飛揚", "河川上的鵝卵石"],
        answer: 3,
        explanation: "塵沙飛揚是風吹動地面上的塵土造成的現象。"
      },
      {
        question: "下列哪一項變化，主要是受到溫度的影響？",
        options: ["一陣大風過後塵土飛揚", "溫泉上方出現白色水霧", "春風徐徐吹來，湖面產生漣漪", "大雨下過，河水變混濁"],
        answer: 2,
        explanation: "溫泉上方出現白色水霧是熱氣遇冷凝結所致，主要是溫度的影響。"
      },
      {
        question: "鐵窗在哪一種環境下最容易生鏽？",
        options: ["沙漠地區", "海邊", "河流附近", "高山上"],
        answer: 2,
        explanation: "海邊空氣中含有鹽分，能加速鐵製品生鏽。"
      },
      {
        question: "有甲、乙兩碗豆漿，甲豆漿加入醋、蔥花及蝦米；乙豆漿加入食鹽、蔥花及蝦米，哪一碗豆漿會產生塊狀的豆腐花？",
        options: ["甲豆漿", "乙豆漿", "兩碗豆漿都會產生豆腐花", "兩碗豆漿都不會產生豆腐花"],
        answer: 1,
        explanation: "醋（酸性）會使豆漿中的蛋白質凝結，形成豆腐花。"
      },
      {
        question: "有關線香受熱的敘述，下列何者錯誤？",
        options: ["達到一定溫度時才會燃燒", "顏色會改變", "無法回復原來的形態", "燃燒後，外形不變"],
        answer: 4,
        explanation: "線香燃燒後會變成灰燼，外形會改變。"
      }
    ]
  },
  {
    id: "wz12",
    title: "物質 1b",
    category: "物質",
    questions: [
      {
        question: "物質之間會互相影響，像風會吹動樹葉就是一個例子。",
        options: ["○", "╳"],
        answer: 1,
        explanation: "風吹動樹葉，是風和樹葉這兩種物質互相作用的現象。"
      },
      {
        question: "把泥土加進水裡，水會變混濁，過一會兒泥土沉下去，水又會變乾淨。",
        options: ["○", "╳"],
        answer: 1,
        explanation: "泥土會沉到水底，讓原本混濁的水變回清澈，這個變化是可逆的。"
      },
      {
        question: "鐵生鏽主要是因為它碰到了水和空氣。",
        options: ["○", "╳"],
        answer: 1,
        explanation: "鐵生鏽是鐵和氧氣、水反應的結果，環境中的溫度和酸鹼也會影響生鏽的速度。"
      },
      {
        question: "把熱水瓶裡的熱水倒入杯子，杯子裡的水會變冷，這是讓溫度降低的方法。",
        options: ["○", "╳"],
        answer: 1,
        explanation: "熱水會將溫度傳給杯子，然後再散失到空氣中，所以水的溫度會慢慢降低。"
      },
      {
        question: "小明用手摩擦繩子，繩子會變熱，測量到的溫度會比摩擦前高。",
        options: ["○", "╳"],
        answer: 1,
        explanation: "摩擦會產生熱，所以摩擦後的溫度會升高。"
      },
      {
        question: "冰塊融化成水之後，就無法再變回冰塊了。",
        options: ["○", "╳"],
        answer: 2,
        explanation: "融化成水後，只要再冷卻，水就會結冰變回固體。"
      },
      {
        question: "鹼粽是用浸泡過酸性水的糯米做的。",
        options: ["○", "╳"],
        answer: 2,
        explanation: "鹼粽是使用鹼水製作的，不是酸性水。"
      },
      {
        question: "把醋淋在麵條上，麵條會變酸，但外觀和顏色不會有任何變化。",
        options: ["○", "╳"],
        answer: 1,
        explanation: "醋是酸性物質，加在麵條上只會改變味道，麵條本身的外觀和顏色不會有明顯的改變。"
      },
      {
        question: "下面哪一種現象跟流水的作用關係最大？",
        options: ["風把樹葉吹得滿天飛", "溪水把石頭磨成鵝卵石", "大太陽把地上的水曬乾", "雨水沖走地上的泥土"],
        answer: 2,
        explanation: "溪水長期沖刷石頭，會把石頭磨得光滑圓潤，變成鵝卵石。"
      },
      {
        question: "哪一種現象主要是因為溫度的變化？",
        options: ["海邊的沙灘變得很濕", "下雨後，河水變得混濁", "放在冰箱裡的巧克力融化", "吹來一陣強風，樹葉掉落"],
        answer: 3,
        explanation: "巧克力在常溫下是固態，但當溫度變高（沒有放冰箱）就會融化成液態，這是受溫度影響的變化。"
      },
      {
        question: "鐵門在下面哪一種環境最容易生鏽？",
        options: ["乾燥的房間", "學校操場邊", "海邊", "高山上"],
        answer: 3,
        explanation: "海邊的空氣中含有鹽分，鹽分會加速鐵生鏽的速度。"
      },
      {
        question: "小麗在兩碗豆漿中都加了蔥花和香菇，但其中一碗會變成豆花，請問是哪一碗？",
        options: ["加了鹽巴的那碗", "加了醬油的那碗", "加了醋的那碗", "兩碗都不會"],
        answer: 3,
        explanation: "醋是酸性的，加到豆漿裡會讓豆漿裡的蛋白質凝固，變成豆花。"
      },
      {
        question: "關於燃燒火柴的過程，哪一項是錯誤的？",
        options: ["燃燒後會變成灰燼", "燃燒後無法恢復原狀", "燃燒時外觀會改變", "燃燒時外觀不會改變"],
        answer: 4,
        explanation: "火柴燃燒後會變成焦黑的灰燼，外觀已經完全改變了。"
      }
    ]
  },
  {
    id: "wz-1-A",
    title: "物質 1 評量A",
    category: "物質",
    questions: [
      {
        question: "大自然裡的各種事物，會彼此產生影響。",
        options: ["O", "X"],
        answer: 1,
        explanation: "自然界事物常互相關聯。"
      },
      {
        question: "打開瓦斯爐點火加熱，可以讓鍋子裡的湯溫度升高。",
        options: ["O", "X"],
        answer: 1,
        explanation: "燃燒發熱使物體溫度升高。"
      },
      {
        question: "把生雞蛋放進熱鍋裡煎，蛋液會凝固變硬。",
        options: ["O", "X"],
        answer: 1,
        explanation: "受熱使蛋白質凝結硬化。"
      },
      {
        question: "冰塊融化和鐵釘生鏽，都只和溫度的改變有關。",
        options: ["O", "X"],
        answer: 2,
        explanation: "鐵生鏽需水分與空氣參與。"
      },
      {
        question: "玉米粒加熱爆成爆米花後，放涼冷卻後可以變回原來的玉米粒。",
        options: ["O", "X"],
        answer: 2,
        explanation: "爆米花沒辦法變回玉米。"
      },
      {
        question: "蚊香需要點火加熱到一定溫度，才會開始燃燒。",
        options: ["O", "X"],
        answer: 1,
        explanation: "達到燃點物質才會燃燒。"
      },
      {
        question: "想讓熱熱的物體溫度快速下降，下列哪一個方法最有效？",
        options: ["放在爐火旁", "放進冰箱冷藏室", "用雙手搓揉", "放在太陽底下曬"],
        answer: 2,
        explanation: "冰箱冷氣能使物體降溫。"
      },
      {
        question: "下列哪一種現象，不是因為受到外在環境的影響而改變？",
        options: ["頭髮慢慢長長", "強風吹起沙石", "河水沖刷河岸", "雨水使鐵門生鏽"],
        answer: 1,
        explanation: "頭髮長長是自體生長。"
      },
      {
        question: "做麵包時麵團在室內發酵變大，最容易受到哪一種條件的影響？",
        options: ["周遭環境的溫度", "麵粉袋的外包裝", "麵團本身的顏色", "裝麵團容器的輕重"],
        answer: 1,
        explanation: "溫度會影響發酵效果。"
      },
      {
        question: "放在室外的鐵釘會生鏽，和下列哪一項沒有關係？",
        options: ["空氣中的濕氣", "鐵釘本身的形狀", "接觸到酸雨", "環境的溫度"],
        answer: 2,
        explanation: "物體外形不影響生鏽。"
      },
      {
        question: "下列哪一種東西和水一樣，受熱會融化、冷卻後又會凝固？",
        options: ["生雞蛋", "木炭", "固體奶油", "生黃豆"],
        answer: 3,
        explanation: "奶油受熱融化冷卻凝固。"
      },
      {
        question: "想證明融化的液態奶油遇冷會凝固，應該怎麼做？",
        options: ["用熱風吹拂", "放在太陽下曬", "倒進滾水中", "泡進冰塊水裡"],
        answer: 4,
        explanation: "冰水降溫使油脂凝固。"
      },
      {
        question: "下列哪一種東西加熱改變後，放涼冷卻後沒辦法變回原狀？",
        options: ["結凍的冰塊", "爆米花", "融化的巧克力", "融化的奶油"],
        answer: 2,
        explanation: "爆米花組織破壞無法復原。"
      },
      {
        question: "吃鹹豆漿時裡面會出現像豆花一樣的小碎塊，是因為加入了什麼？",
        options: ["白糖", "清水", "食用醋", "香油"],
        answer: 3,
        explanation: "酸性促使豆漿凝結結塊。"
      },
      {
        question: "強風把地上的落葉和塵土吹到遠處，屬於哪一種變化？",
        options: ["位置改變", "發生生鏽", "凝固結塊", "形狀變化"],
        answer: 1,
        explanation: "外力造成空間位置移動。"
      },
      {
        question: "太陽曬熱讓山上的積雪融化成雪水，屬於哪一種變化？",
        options: ["生鏽腐蝕", "空間位置改變", "形態改變", "出現沉澱"],
        answer: 3,
        explanation: "固態雪融化成液態水。"
      },
      {
        question: "做麵包時靜置的生麵團慢慢脹大鼓起來，屬於哪一種變化？",
        options: ["產生鐵鏽", "體積與形狀改變", "溫度歸零", "碎裂消失"],
        answer: 2,
        explanation: "產氣使麵團體積外觀膨大。"
      },
      {
        question: "戶外的鐵架經過日曬雨淋後表面變黃剝落，屬於哪一種變化？",
        options: ["金屬熔化", "凝固變硬", "產生結塊", "氧化生鏽"],
        answer: 4,
        explanation: "鐵受水與氧氣作用生鏽。"
      },
      {
        question: "把酸酸的檸檬汁滴進溫熱的無糖豆漿裡，會看到什麼現象？",
        options: ["立即沸騰冒泡", "析出棉絮狀的小凝塊", "整杯變成透明的", "迅速燃燒起來"],
        answer: 2,
        explanation: "酸性物質使豆漿產生沉澱。"
      }
    ]
  },
  {
    id: "wz-1-B",
    title: "物質 1 評量B",
    category: "物質",
    questions: [
      {
        question: "自然界中的各種物質互相接觸，常會產生變化。",
        options: ["O", "X"],
        answer: 1,
        explanation: "物質接觸常引發形態變化。"
      },
      {
        question: "鐵釘生鏽，完全只是因為天氣太熱所造成的。",
        options: ["O", "X"],
        answer: 2,
        explanation: "生鏽是水分和空氣的影響。"
      },
      {
        question: "生雞蛋煎熟變成荷包蛋，放涼後會變回生雞蛋。",
        options: ["O", "X"],
        answer: 2,
        explanation: "雞蛋受熱凝固後無法復原。"
      },
      {
        question: "乾燥玉米粒爆成爆米花，降溫後能還原成玉米。",
        options: ["O", "X"],
        answer: 2,
        explanation: "爆米花爆開後無法再還原。"
      },
      {
        question: "把固體巧克力隔水加熱，會慢慢融化成巧克力醬。",
        options: ["O", "X"],
        answer: 1,
        explanation: "巧克力吸熱後會融化成液態。"
      },
      {
        question: "融化的液態巧克力放進冰箱，又會凝固變硬。",
        options: ["O", "X"],
        answer: 1,
        explanation: "降溫冷卻後會再次凝固。"
      },
      {
        question: "點燃蚊香或蠟燭時，溫度要達到燃點才會燃燒。",
        options: ["O", "X"],
        answer: 1,
        explanation: "物體達到燃點才會起火。"
      },
      {
        question: "熱豆漿裡加入哪一種調味料，會凝結成豆花塊狀？",
        options: ["白砂糖", "純自來水", "食用醋", "香菜碎屑"],
        answer: 3,
        explanation: "醋的酸性會使豆漿結塊。"
      },
      {
        question: "下列哪一種物質受熱融化後，放涼還能再凝固？",
        options: ["生雞蛋", "青菜葉", "白米飯", "奶油塊"],
        answer: 4,
        explanation: "奶油加熱融化、受冷凝固。"
      },
      {
        question: "麵包師傅讓麵糰發酵膨脹，最關鍵的影響因素是？",
        options: ["適當溫度", "麵糰顏色", "麵糰長短", "盤子形狀"],
        answer: 1,
        explanation: "溫暖環境有助於酵母發酵。"
      },
      {
        question: "戶外的鐵窗容易生鏽，和下列哪一項因素最無關？",
        options: ["空氣中的氧氣", "鐵窗上的花紋", "環境中的濕氣", "是否常淋到雨"],
        answer: 2,
        explanation: "鐵窗花紋與生鏽化學無關。"
      },
      {
        question: "想要讓融化的液態蠟油快速變硬，哪種方法最好？",
        options: ["用吹風機吹熱風", "放在大太陽底下", "浸泡在冰水裡", "放在熱瓦斯爐旁"],
        answer: 3,
        explanation: "低溫冷卻可讓液態蠟油凝固。"
      },
      {
        question: "下列哪一種受熱產生的變化，冷卻後完全無法復原？",
        options: ["冰塊融成水", "巧克力融成醬", "固體奶油化成油", "紙張燒成黑灰燼"],
        answer: 4,
        explanation: "燃燒成灰是不可復原的。"
      },
      {
        question: "一陣強風把地上的枯葉吹到空中，這屬於何種變化？",
        options: ["物體位置改變", "物體生鏽腐蝕", "物體產生凝結塊", "物體化學燃燒"],
        answer: 1,
        explanation: "風力吹拂讓枯葉位置移動。"
      },
      {
        question: "冬天的雪人受熱融化成一灘水，這是什麼改變？",
        options: ["物體顏色變黑", "物質形狀與形態改變", "雪人長出塊狀物", "雪人生鏽腐蝕"],
        answer: 2,
        explanation: "固態雪受熱融成液態水。"
      },
      {
        question: "做饅頭的麵糰發酵後體積變大，這是屬於何種現象？",
        options: ["完全沒有任何改變", "物體外表嚴重生鏽", "形狀與體積改變", "物體融化成水狀"],
        answer: 3,
        explanation: "氣體讓麵糰形狀體積脹大。"
      },
      {
        question: "鐵欄杆長年吹風淋雨而斑駁剝落，這是何種變化？",
        options: ["位置由南往北移", "發酵膨脹成麵包", "完全化成透明液體", "金屬生鏽與腐蝕"],
        answer: 4,
        explanation: "鐵碰水與空氣氧化生鏽。"
      },
      {
        question: "在溫豆漿裡加入食用醋，會觀察到什麼明顯現象？",
        options: ["冒出強烈彩色火焰", "產生白色豆花狀硬塊", "豆漿瞬間全部蒸發", "豆漿變成硬鐵塊"],
        answer: 2,
        explanation: "酸性使豆漿蛋白質凝結塊狀。"
      },
      {
        question: "下列哪一種方法，可以讓杯子裡的溫水溫度下降？",
        options: ["放入幾顆小冰塊", "拿到太陽底下曬", "放在瓦斯爐上煮", "用兩隻手搓杯子"],
        answer: 1,
        explanation: "冰塊吸熱使水溫降低。"
      }
    ]
  },
  {
    id: "wz21",
    title: "物質 2a",
    category: "物質",
    questions: [
      {
        question: "鐵受到空氣和水的影響會變得更光亮、更堅硬。",
        options: ["○", "╳"],
        answer: 2,
        explanation: "鐵受到空氣和水的影響會生鏽，變得更脆、更不堅硬。"
      },
      {
        question: "鐵礦表面可能會因為處在較潮溼的環境中，而呈現紅色。",
        options: ["○", "╳"],
        answer: 1,
        explanation: "鐵礦在潮溼環境中容易氧化生鏽，表面會呈現紅褐色。"
      },
      {
        question: "廚房裡的瓦斯爐架有生鏽的現象，應該是受到開關的影響。",
        options: ["○", "╳"],
        answer: 2,
        explanation: "瓦斯爐架生鏽是受到空氣、水和溫度等因素的影響，與開關無關。"
      },
      {
        question: "「冬天時，烏龜在石頭上晒太陽，是為了要讓體溫升高。」由此可推斷，被太陽照射可以讓溫度上升。",
        options: ["○", "╳"],
        answer: 1,
        explanation: "烏龜是變溫動物，需要透過晒太陽來吸收熱能，提高體溫。"
      },
      {
        question: "溫度的改變可能會使物質產生變化。",
        options: ["○", "╳"],
        answer: 1,
        explanation: "冰塊融化成水、水加熱成水蒸氣都是溫度的改變使物質產生變化的例子。"
      },
      {
        question: "添加了酵母的麵團，揉好後，在溫度　26　℃下放置一段時間，麵團不會發生任何變化。",
        options: ["○", "╳"],
        answer: 2,
        explanation: "酵母菌在適當的溫度下會進行發酵，使麵團膨脹。"
      },
      {
        question: "具有酸鹼性的物質，我們都可以利用它的氣味來辨別。",
        options: ["○", "╳"],
        answer: 2,
        explanation: "有些酸鹼性物質有氣味，但不是所有都有，且有些有毒，不能用聞的方式辨別。"
      },
      {
        question: "除了紫色高麗菜遇到酸性物質時顏色會變成紅色，其它物質遇到酸性物質時都不會有變化。",
        options: ["○", "╳"],
        answer: 2,
        explanation: "還有許多天然色素，例如蝶豆花、洛神花等，遇到酸鹼物質時顏色都會改變。"
      },
      {
        question: "自然界中的物質會受到許多因素影響而產生變化，下列何者錯誤？",
        options: ["石頭經過流水沖刷會移動位置", "水中含有大量砂石時，水會變混濁", "強風吹過水面時，水面並不會有變化", "風吹動塵土，會影響空氣品質"],
        answer: 3,
        explanation: "強風吹過水面會產生波浪或漣漪，水面會產生變化。"
      },
      {
        question: "室溫下，放在桌面上的冰塊經過一段時間會融化成水，主要是受到哪一個因素的影響？",
        options: ["桌面高度", "時間", "環境溫度", "光線"],
        answer: 3,
        explanation: "冰塊融化是吸熱的過程，主要是周圍環境的溫度高於冰點所致。"
      },
      {
        question: "在豆漿裡加入哪一種物質，會形成塊狀物？",
        options: ["糖", "醋", "鹽", "醬油"],
        answer: 2,
        explanation: "醋是酸性物質，加入豆漿後會使豆漿中的蛋白質凝固，形成塊狀物。"
      },
      {
        question: "麵團中加入酵母後，什麼因素會影響發酵的快慢？",
        options: ["溫度", "水量多少", "麵粉價格", "加入小蘇打"],
        answer: 1,
        explanation: "酵母菌的發酵速度會受到溫度的影響，溫度越高，發酵越快。"
      },
      {
        question: "下列哪一個方法無法使溫度升高？",
        options: ["被太陽照射", "瓦斯爐燃燒瓦斯來料理食物", "摩擦雙手", "在水中加入冰塊"],
        answer: 4,
        explanation: "在水中加入冰塊會使水溫降低，而不是升高。"
      },
      {
        question: "陳瑞買了一瓶飲料，下列哪一項可以判斷這瓶飲料的酸鹼性？",
        options: ["飲料的顏色", "飲料的價格", "觀察紫色高麗菜泡入飲料的顏色變化", "飲料的出產地"],
        answer: 3,
        explanation: "紫色高麗菜汁是一種天然的酸鹼指示劑，遇到酸鹼性物質時會變色。"
      }
    ]
  },
  {
    id: "wz22",
    title: "物質 2b",
    category: "物質",
    questions: [
      {
        question: "鐵碰到空氣和水會變得更亮更硬。",
        options: ["○", "╳"],
        answer: 2,
        explanation: "鐵碰到空氣和水會生鏽，變得比較脆，也沒有那麼堅硬了。"
      },
      {
        question: "潮濕的環境會讓鐵礦石表面看起來紅紅的。",
        options: ["○", "╳"],
        answer: 1,
        explanation: "鐵礦石在潮濕的環境中容易氧化，也就是生鏽，表面就會變成紅褐色。"
      },
      {
        question: "廚房瓦斯爐的鐵架會生鏽，跟我們開關瓦斯爐有關。",
        options: ["○", "╳"],
        answer: 2,
        explanation: "瓦斯爐鐵架生鏽是因為空氣、水和溫度等因素造成的，跟開關瓦斯爐的動作沒有關係。"
      },
      {
        question: "冬天烏龜喜歡曬太陽，這代表太陽光可以讓東西變熱。",
        options: ["○", "╳"],
        answer: 1,
        explanation: "烏龜是變溫動物，需要吸收太陽的熱量來提高自己的體溫，這說明太陽光可以升高溫度。"
      },
      {
        question: "溫度改變可能會讓物質的樣子也跟著變。",
        options: ["○", "╳"],
        answer: 1,
        explanation: "像是冰塊融化成水、水煮沸變成水蒸氣，都是因為溫度改變而產生的變化。"
      },
      {
        question: "在麵團裡加了酵母，在26℃的環境中放一段時間，麵團不會有任何改變。",
        options: ["○", "╳"],
        answer: 2,
        explanation: "酵母菌在溫暖的環境中會發酵，產生氣體，讓麵團變大。"
      },
      {
        question: "所有的酸性或鹼性物質，都可以靠聞味道來判斷。",
        options: ["○", "╳"],
        answer: 2,
        explanation: "有些有毒的酸鹼物質不能用聞的，而且也不是所有酸鹼物質都有味道。"
      },
      {
        question: "只有紫色高麗菜碰到酸性物質會變色，其他東西都不會。",
        options: ["○", "╳"],
        answer: 2,
        explanation: "像蝶豆花、洛神花這些植物，碰到酸性或鹼性物質時，顏色也會改變。"
      },
      {
        question: "關於大自然中的變化，哪一個說法是錯的？",
        options: ["河水可以把石頭沖到別的地方", "充滿泥沙的水會變得很混濁", "風吹過水面，水面也不會有變化", "風把沙子吹起來會影響空氣品質"],
        answer: 3,
        explanation: "強風吹過水面時，會讓水面產生波浪或漣漪，所以水面會有變化。"
      },
      {
        question: "放在桌上的冰塊會自己融化成水，這是受到什麼影響？",
        options: ["桌子的高度", "時間的長短", "環境的溫度", "太陽光線"],
        answer: 3,
        explanation: "冰塊融化主要是因為周圍的空氣溫度高於冰點，讓冰塊吸收熱量而融化。"
      },
      {
        question: "在豆漿中加入哪一種東西，會讓豆漿變成像豆花一樣的塊狀物？",
        options: ["砂糖", "食用醋", "食用鹽", "醬油"],
        answer: 2,
        explanation: "醋是酸性物質，加到豆漿裡會讓蛋白質凝固，形成塊狀物。"
      },
      {
        question: "麵團中加了酵母後，哪一個因素會影響麵團發酵的速度？",
        options: ["環境的溫度", "加了多少水", "麵粉的價錢", "有沒有加糖"],
        answer: 1,
        explanation: "酵母菌在溫暖的環境中發酵得比較快，所以溫度會影響發酵速度。"
      },
      {
        question: "下列哪種做法不能讓東西的溫度升高？",
        options: ["曬太陽", "摩擦兩隻手", "用瓦斯爐煮東西", "在水中加冰塊"],
        answer: 4,
        explanation: "在水中加冰塊，會讓水的溫度降低，而不是升高。"
      },
      {
        question: "小文買了一瓶飲料，他想知道這瓶飲料是酸性還是鹼性，下面哪個方法最有用？",
        options: ["觀察飲料的顏色", "看飲料的價格", "把紫色高麗菜汁滴進去，看顏色有沒有變", "看飲料是在哪裡做的"],
        answer: 3,
        explanation: "紫色高麗菜汁可以當作酸鹼試劑，如果滴入飲料後變色，就能判斷飲料是酸性或鹼性。"
      }
    ]
  },
  {
    id: "wz03",
    title: "物質 3基礎",
    category: "物質",
    questions: [
      {
        question: "醋是什麼性？",
        options: ["酸性", "鹼性"],
        answer: 1,
        explanation: "醋帶酸味，所以是酸性。"
      },
      {
        question: "鹼水是什麼性？",
        options: ["酸性", "鹼性"],
        answer: 2,
        explanation: "鹼水含鹼性成分，所以是鹼性。"
      },
      {
        question: "酸性物質聞起來的味道是？",
        options: ["酸酸的", "甜甜的"],
        answer: 1,
        explanation: "酸性物質通常聞起來酸酸的。"
      },
      {
        question: "肥皂水摸起來滑滑的，可能是什麼性？",
        options: ["酸性", "鹼性"],
        answer: 2,
        explanation: "肥皂水滑滑的，代表它是鹼性。"
      },
      {
        question: "乳酸飲料酸酸的，可能是什麼性？",
        options: ["酸性", "鹼性"],
        answer: 1,
        explanation: "乳酸飲料酸酸的，所以是酸性。"
      },
      {
        question: "汽水或可樂有加糖，但實際上是什麼性？",
        options: ["酸性", "鹼性"],
        answer: 1,
        explanation: "汽水和可樂會呈酸性。"
      },
      {
        question: "運動飲料通常是什麼性？",
        options: ["酸性", "鹼性"],
        answer: 1,
        explanation: "運動飲料多半呈酸性。"
      },
      {
        question: "用來清潔的小蘇打溶液是什麼性？",
        options: ["酸性", "鹼性"],
        answer: 2,
        explanation: "小蘇打溶液具有鹼性。"
      },
      {
        question: "食醋是什麼性？",
        options: ["酸性", "鹼性"],
        answer: 1,
        explanation: "食醋本身就是酸性。"
      },
      {
        question: "紫色高麗菜汁遇到酸性物質變成什麼色系？",
        options: ["藍綠色系", "紅色系"],
        answer: 2,
        explanation: "紫色高麗菜汁遇酸會變紅色系。"
      },
      {
        question: "蝶豆花水加入鹼性物質變成什麼色系？",
        options: ["藍綠色系", "紅色系"],
        answer: 1,
        explanation: "蝶豆花水遇鹼會變藍綠色系。"
      },
      {
        question: "紫色高麗菜汁滴入檸檬汁會變成什麼色系？",
        options: ["藍綠色系", "紅色系"],
        answer: 2,
        explanation: "紫色高麗菜汁加檸檬會變紅色系。"
      },
      {
        question: "豆漿變成塊狀的鹹豆漿，是因為加入什麼物質？",
        options: ["酸性物質", "鹼性物質"],
        answer: 1,
        explanation: "鹹豆漿會凝固是因為加入酸性物質。"
      },
      {
        question: "紫色高麗菜汁加入小蘇打水變成什麼色系？",
        options: ["藍綠色系", "紅色系"],
        answer: 1,
        explanation: "紫色高麗菜汁加小蘇打會變藍綠色系。"
      },
      {
        question: "紫色高麗菜汁加入肥皂水變成什麼色系？",
        options: ["藍綠色系", "紅色系"],
        answer: 1,
        explanation: "紫色高麗菜汁加肥皂水會變藍綠色系。"
      },
      {
        question: "紫色高麗菜汁加入食醋變成什麼色系？",
        options: ["藍綠色系", "紅色系"],
        answer: 2,
        explanation: "紫色高麗菜汁加醋會變紅色系。"
      }
    ]
  },
  {
    id: "wz-3-A",
    title: "物質 3 評量A",
    category: "物質",
    questions: [
      {
        question: "廚房裡的食用醋和做鹼粽用的鹼水，都屬於酸性液體。",
        options: ["O", "X"],
        answer: 2,
        explanation: "鹼水屬於鹼性水溶液。"
      },
      {
        question: "帶有酸性的食材或液體，聞起來通常有酸酸的氣味。",
        options: ["O", "X"],
        answer: 1,
        explanation: "酸性物質多具揮發酸味。"
      },
      {
        question: "用手摸肥皂水感覺滑滑的，代表它可能偏向鹼性。",
        options: ["O", "X"],
        answer: 1,
        explanation: "鹼性液體摸起來常有滑膩感。"
      },
      {
        question: "養樂多等乳酸飲料喝起來酸酸甜甜的，其性質屬於酸性。",
        options: ["O", "X"],
        answer: 1,
        explanation: "乳酸飲料含有酸性物質。"
      },
      {
        question: "汽水喝起來甜甜的，因此它屬於鹼性飲料。",
        options: ["O", "X"],
        answer: 2,
        explanation: "汽水含有碳酸屬於酸性。"
      },
      {
        question: "用來清洗廚房油垢的小蘇打水，是鹼性物質。",
        options: ["O", "X"],
        answer: 1,
        explanation: "小蘇打水溶液呈弱鹼性。"
      },
      {
        question: "紫色高麗菜汁遇到酸性水溶液，會變成藍綠色。",
        options: ["O", "X"],
        answer: 2,
        explanation: "遇酸性溶液呈現紅色系。"
      },
      {
        question: "料理調味用的白醋屬於何種性質？",
        options: ["酸性", "鹼性"],
        answer: 1,
        explanation: "食用醋為酸性物質。"
      },
      {
        question: "新鮮現榨的檸檬原汁屬於何種性質？",
        options: ["酸性", "鹼性"],
        answer: 1,
        explanation: "檸檬汁富含檸檬酸。"
      },
      {
        question: "清洗熱水瓶水垢的檸檬酸水溶液屬於？",
        options: ["酸性", "鹼性"],
        answer: 1,
        explanation: "檸檬酸水溶液為酸性。"
      },
      {
        question: "市面上賣的優酪乳或發酵乳屬於何種性質？",
        options: ["酸性", "鹼性"],
        answer: 1,
        explanation: "發酵乳含乳酸呈酸性。"
      },
      {
        question: "常用於打掃去污的小蘇打水溶液屬於何種性質？",
        options: ["酸性", "鹼性"],
        answer: 2,
        explanation: "小蘇打水為鹼性溶液。"
      },
      {
        question: "洗手或洗澡用的肥皂泡沫水屬於何種性質？",
        options: ["酸性", "鹼性"],
        answer: 2,
        explanation: "肥皂水屬於鹼性水溶液。"
      },
      {
        question: "將檸檬汁滴入紫色高麗菜汁中，顏色會？",
        options: ["轉為紅色系", "轉為藍綠色系"],
        answer: 1,
        explanation: "酸性使紫高麗菜汁變紅。"
      },
      {
        question: "將白醋倒入紫色高麗菜汁中，顏色會？",
        options: ["轉為紅色系", "轉為藍綠色系"],
        answer: 1,
        explanation: "酸性液體呈現紅色系。"
      },
      {
        question: "將小蘇打水倒入紫色高麗菜汁中，顏色會？",
        options: ["轉為紅色系", "轉為藍綠色系"],
        answer: 2,
        explanation: "鹼性使紫高麗菜汁變藍綠。"
      },
      {
        question: "將肥皂水倒入紫色高麗菜汁中，顏色會？",
        options: ["轉為紅色系", "轉為藍綠色系"],
        answer: 2,
        explanation: "鹼性水溶液轉呈藍綠色。"
      },
      {
        question: "下列哪一種特徵或方法，最適合用來辨別酸性液體？",
        options: ["摸起來黏黏的", "外觀呈現金黃色", "聞起來有微酸氣味", "遇到紫高麗菜汁變綠"],
        answer: 3,
        explanation: "酸性液體常有酸嗆味。"
      },
      {
        question: "傳統鹼粽在包製前，需浸泡何種鹼性液體？",
        options: ["鮮榨檸檬汁", "碳酸汽水", "鹼水", "蘋果醋"],
        answer: 3,
        explanation: "鹼粽加入鹼水製作。"
      },
      {
        question: "下列常見生活用品中，哪一個不屬於酸性？",
        options: ["洗澡肥皂水", "食用烏醋", "現榨柳橙汁", "運動飲料"],
        answer: 1,
        explanation: "肥皂水為常見鹼性洗劑。"
      },
      {
        question: "哪種液體滴在紫色高麗菜葉上，會呈現紅色？",
        options: ["食用白醋", "純淨水", "鹼水", "小蘇打水"],
        answer: 1,
        explanation: "酸性遇紫甘藍呈紅色。"
      },
      {
        question: "紫色高麗菜汁滴入哪種液體中，幾乎不變色？",
        options: ["碳酸汽水", "中性自來水", "濃醋酸液", "洗衣粉水"],
        answer: 2,
        explanation: "中性液體不會引起變色。"
      },
      {
        question: "分別滴入哪一組水溶液，紫色高麗菜汁會呈現同一色系？",
        options: ["白醋與小蘇打水", "汽水與鹼粽水", "肥皂水與小蘇打水", "檸檬汁與肥皂水"],
        answer: 3,
        explanation: "兩者皆鹼性均呈藍綠色。"
      },
      {
        question: "拌沙拉時如果不小心打翻檸檬汁，紫色高麗菜葉將會？",
        options: ["完全無變化", "轉為紅色色系", "轉為深藍綠色", "變成純白色"],
        answer: 2,
        explanation: "檸檬酸使菜葉轉紅。"
      },
      {
        question: "紫色高麗菜汁遇到鹼性水溶液時，會轉變成什麼顏色？",
        options: ["鮮紅色系", "烏黑色系", "金黃色系", "藍綠色系"],
        answer: 4,
        explanation: "鹼性環境呈現藍綠色。"
      }
    ]
  },
  {
    id: "wz-3-B",
    title: "物質 3 評量B",
    category: "物質",
    questions: [
      {
        question: "檸檬汁聞起來有酸味，在性質上屬於酸性溶液。",
        options: ["O", "X"],
        answer: 1,
        explanation: "檸檬汁富含有機酸。"
      },
      {
        question: "用手指摸肥皂水滑滑的，肥皂水大多偏向鹼性。",
        options: ["O", "X"],
        answer: 1,
        explanation: "鹼性水溶液常有滑膩感。"
      },
      {
        question: "純淨的自來水既非酸性也非鹼性，屬於中性液體。",
        options: ["O", "X"],
        answer: 1,
        explanation: "純淨水性質屬於中性。"
      },
      {
        question: "紫色高麗菜汁碰到酸性液體時，通常會變紅色系。",
        options: ["O", "X"],
        answer: 1,
        explanation: "花青素遇酸會變紅粉色。"
      },
      {
        question: "紫色高麗菜汁碰到鹼性水溶液時，會呈現藍綠色系。",
        options: ["O", "X"],
        answer: 1,
        explanation: "花青素遇鹼呈藍綠色。"
      },
      {
        question: "市售汽水喝起來甜甜的，所以汽水是鹼性飲料。",
        options: ["O", "X"],
        answer: 2,
        explanation: "汽水含碳酸，屬於酸性。"
      },
      {
        question: "做清潔常用的小蘇打水，在性質上屬於鹼性物質。",
        options: ["O", "X"],
        answer: 1,
        explanation: "小蘇打水性質屬於弱鹼。"
      },
      {
        question: "食用醋屬於酸性還是鹼性物質？",
        options: ["酸性", "鹼性"],
        answer: 1,
        explanation: "醋含醋酸，屬於酸性。"
      },
      {
        question: "小蘇打水屬於酸性還是鹼性物質？",
        options: ["酸性", "鹼性"],
        answer: 2,
        explanation: "小蘇打溶於水呈弱鹼性。"
      },
      {
        question: "新鮮檸檬汁屬於酸性還是鹼性物質？",
        options: ["酸性", "鹼性"],
        answer: 1,
        explanation: "檸檬汁富含檸檬酸。"
      },
      {
        question: "一般的洗手肥皂水，屬於酸性還是鹼性物質？",
        options: ["酸性", "鹼性"],
        answer: 2,
        explanation: "肥皂水大多偏向鹼性。"
      },
      {
        question: "食用白醋滴入紫色高麗菜汁，會產生什麼變化？",
        options: ["變紅色系", "變藍綠色系"],
        answer: 1,
        explanation: "酸性使高麗菜汁變紅。"
      },
      {
        question: "小蘇打水滴入紫色高麗菜汁，會產生什麼變化？",
        options: ["變紅色系", "變藍綠色系"],
        answer: 2,
        explanation: "鹼性使高麗菜汁變藍綠。"
      },
      {
        question: "酸性飲料加入紫色高麗菜汁，顏色大多如何變化？",
        options: ["變紅色系", "變藍綠色系"],
        answer: 1,
        explanation: "酸性物質會讓試劑變紅。"
      },
      {
        question: "一般的肥皂水加入紫色高麗菜汁，顏色會如何變化？",
        options: ["變紅色系", "變藍綠色系"],
        answer: 2,
        explanation: "鹼性物質讓試劑變藍綠。"
      },
      {
        question: "下列哪一種常見的液體，性質屬於「酸性」？",
        options: ["小蘇打水", "純肥皂水", "食用白醋", "自來水"],
        answer: 3,
        explanation: "食用白醋富含酸性成分。"
      },
      {
        question: "滴入紫色高麗菜汁會呈現紅色系的物質是？",
        options: ["自來水", "小蘇打水", "一般肥皂水", "檸檬酸水"],
        answer: 4,
        explanation: "檸檬酸為酸性，變紅色系。"
      },
      {
        question: "傳統包鹼粽時，會把糯米加入哪種鹼性液體？",
        options: ["鹼水", "白糖水", "食用醋", "柳橙汁"],
        answer: 1,
        explanation: "鹼粽製作過程添加鹼水。"
      },
      {
        question: "將紫色高麗菜汁滴入哪種液體中，幾乎不會變色？",
        options: ["食用白醋", "純淨自來水", "洗碗肥皂水", "檸檬原汁"],
        answer: 2,
        explanation: "中性自來水不使試劑變色。"
      },
      {
        question: "下列哪一組水溶液加入高麗菜汁，會呈現相同色系？",
        options: ["白醋與檸檬水", "肥皂水與食醋", "小蘇打水與汽水", "自來水與白醋"],
        answer: 1,
        explanation: "兩者皆為酸性，都變紅色。"
      },
      {
        question: "媽媽用來洗油垢的小蘇打水，其性質屬於哪一種？",
        options: ["強烈劇毒", "中性溫和", "強烈濃酸", "偏弱鹼性"],
        answer: 4,
        explanation: "小蘇打水屬於安全弱鹼性。"
      },
      {
        question: "做自然酸鹼實驗時，下列哪一項做法是絕對禁止的？",
        options: ["戴護目鏡保護雙眼", "用舌頭舔味道辨酸鹼", "用滴管取少量藥水", "實驗做完把手洗淨"],
        answer: 2,
        explanation: "藥品可能有害，不可放嘴裡。"
      },
      {
        question: "下列哪一種天然植物的汁液，最適合當酸鹼指示劑？",
        options: ["白蘿蔔汁", "馬鈴薯汁", "紫色高麗菜汁", "小黃瓜汁"],
        answer: 3,
        explanation: "紫色高麗菜富含花青素。"
      },
      {
        question: "做實驗如果不小心被弱酸性液體噴到手，該怎麼辦？",
        options: ["立刻用大量清水沖洗", "拿打火機烘乾", "拿強鹼塗在手上", "用紙巾擦乾不管它"],
        answer: 1,
        explanation: "用大量清水沖洗最安全。"
      }
    ]
  },
  {
    id: "sg01",
    title: "聲光 1基礎",
    category: "聲光",
    questions: [
      {
        question: "鼓發出聲音時，鼓面會怎樣？",
        options: ["振動", "靜止"],
        answer: 1,
        explanation: ""
      },
      {
        question: "人發出聲音時，喉嚨有什麼感覺？",
        options: ["振動", "靜止"],
        answer: 1,
        explanation: ""
      },
      {
        question: "握住發出聲音的三角鐵，聲音停了，三角鐵會怎樣？",
        options: ["振動", "靜止"],
        answer: 2,
        explanation: ""
      },
      {
        question: "物體發出聲音時，發音部位會怎樣？",
        options: ["振動", "靜止"],
        answer: 1,
        explanation: ""
      },
      {
        question: "物體停止振動時，聲音會怎樣？",
        options: ["變大", "變小", "停止"],
        answer: 3,
        explanation: ""
      },
      {
        question: "站在水邊聽到哨音，聲音透過什麼傳播？",
        options: ["液體", "固體", "氣體"],
        answer: 3,
        explanation: ""
      },
      {
        question: "在游泳池水裡聽到哨音，聲音透過什麼傳播？",
        options: ["液體", "固體", "氣體"],
        answer: 1,
        explanation: ""
      },
      {
        question: "用紙杯接棉線來聽聲音，聲音透過什麼傳播？",
        options: ["液體", "固體", "氣體"],
        answer: 2,
        explanation: ""
      },
      {
        question: "宇宙的太空裡兩個物體相撞，卻沒有聲音，為什麼？",
        options: ["太空裡沒有空氣可傳播", "太空裡的物體都很輕"],
        answer: 1,
        explanation: ""
      },
      {
        question: "用筷子在水裡敲擊，是要做什麼實驗？",
        options: ["聲音可透過液體傳播", "光會直線前進", "酸鹼物質變色"],
        answer: 1,
        explanation: ""
      },
      {
        question: "用嚎叫集結同伴的動物是？",
        options: ["青蛙", "五色鳥", "野狼", "獅子"],
        answer: 3,
        explanation: ""
      },
      {
        question: "把鳴囊鼓大，用鳴叫來求偶的動物是？",
        options: ["青蛙", "五色鳥", "野狼", "獅子"],
        answer: 1,
        explanation: ""
      },
      {
        question: "用大聲吼叫來警告敵人的動物是？",
        options: ["青蛙", "五色鳥", "野狼", "獅子"],
        answer: 4,
        explanation: ""
      },
      {
        question: "電影裡的士兵趴在鐵軌上聽有沒有火車的聲音，這聲音透過什麼傳播？(趴鐵軌不可模仿)",
        options: ["液體", "固體", "氣體"],
        answer: 2,
        explanation: ""
      },
      {
        question: "聲音在哪種物質傳播速度最快？",
        options: ["液體", "固體", "氣體"],
        answer: 2,
        explanation: ""
      },
      {
        question: "電影裡的士兵，小明站著聽火車聲音，小華趴在鐵軌聽，誰最先聽到火車的聲音？(趴鐵軌不可模仿)",
        options: ["小明", "小華", "一樣快"],
        answer: 2,
        explanation: ""
      }
    ]
  },
  {
    id: "sg11",
    title: "聲光 1a",
    category: "聲光",
    questions: [
      {
        question: "將防水手錶放入水中，是無法聽到防水手錶發出的聲響的。",
        options: ["○", "╳"],
        answer: 2,
        explanation: "聲音在水中也能傳播，雖然傳播方式與空氣中不同，但仍然可以聽到聲音。"
      },
      {
        question: "物體有振動的現象會產生聲音，當振動停止後，還需要經過一段時間後聲音才會消失。",
        options: ["○", "╳"],
        answer: 2,
        explanation: "物體振動停止時，聲音也會立即停止。"
      },
      {
        question: "動物的聲音可以有不同的目的，例如：求偶、警告或同類間的溝通。",
        options: ["○", "╳"],
        answer: 1,
        explanation: "動物會利用聲音來進行溝通、求偶、警告敵人等行為。"
      },
      {
        question: "本身能發光的物體，稱為光源。",
        options: ["○", "╳"],
        answer: 1,
        explanation: "光源是能夠自己發光，不依靠反射其他光源光線的物體。"
      },
      {
        question: "在黑暗的房間裡，我們可以清楚看到白色的物品。",
        options: ["○", "╳"],
        answer: 2,
        explanation: "在完全黑暗的環境中，沒有光源照射，任何物品都無法被看到。"
      },
      {
        question: "操作「光的行進」實驗時，當排水軟管呈彎曲狀，手電筒的光線從一端照入後，就無法從另一端射出。",
        options: ["○", "╳"],
        answer: 1,
        explanation: "光的行進路線是直線，遇到彎曲的障礙物時，光線無法轉彎。"
      },
      {
        question: "我們無法改變光的行進路線。",
        options: ["○", "╳"],
        answer: 2,
        explanation: "光線在遇到物體時會產生反射或折射，可以改變其行進路線。"
      },
      {
        question: "鏡子的表面光滑，具有反射光線的特性。",
        options: ["○", "╳"],
        answer: 1,
        explanation: "鏡子光滑的表面能使光線以規律的方式反射，形成清晰的影像。"
      },
      {
        question: "下面哪一種方式無法讓鈴鼓產生聲音？",
        options: ["拍打鼓面", "搖動鈴鼓", "將鈴鼓靜止不動", "用鼓棒敲打鼓邊。"],
        answer: 3,
        explanation: "物體必須振動才會產生聲音，靜止不動無法產生振動。"
      },
      {
        question: "小靜在還沒看到消防車時就已經聽到消防車的鳴笛聲，鳴笛聲是利用哪一種物質傳播？",
        options: ["行道樹", "空氣", "陽光", "路燈。"],
        answer: 2,
        explanation: "聲音主要藉由空氣傳播到我們的耳朵。"
      },
      {
        question: "下列四種情形中，哪種是利用固體傳播聲音？",
        options: ["水裡聽到哨音", "聽見門口外的狗叫聲", "耳貼地面可聽見腳步聲", "臺上聽到臺下鼓掌聲。"],
        answer: 3,
        explanation: "聲音可以藉由固體、液體和氣體傳播，耳貼地面聽腳步聲是聲音透過地面（固體）傳播。"
      },
      {
        question: "手電筒的光從彎曲的排水軟管一端射入後，光會如何行進？",
        options: ["光會通過彎曲排水軟管，從另一端射出光", "只有一半光從排水軟管另一端射出", "光一陣一陣射出", "光無法通過彎曲的排水軟管，在另一端無法看見有光射出。"],
        answer: 4,
        explanation: "光是直線傳播的，無法沿著彎曲的軟管行進。"
      },
      {
        question: "燈塔用來指引船隻航行的燈光是哪一種的應用？",
        options: ["光", "聲音", "光和聲音", "空氣。"],
        answer: 1,
        explanation: "燈塔是利用強烈的光線來指引船隻在夜間或惡劣天氣中航行。"
      }
    ]
  },
  {
    id: "sg12",
    title: "聲光 1b",
    category: "聲光",
    questions: [
      {
        question: "就算把防水手錶放進水裡，還是聽得到它發出的聲音。",
        options: ["○", "╳"],
        answer: 1,
        explanation: "聲音在水裡一樣可以傳播，只是跟在空氣中的感覺不太一樣。"
      },
      {
        question: "只要東西有在動，就會發出聲音，但東西一停下來，聲音也會馬上停止。",
        options: ["○", "╳"],
        answer: 1,
        explanation: "聲音是物體振動產生的，所以一旦振動停止，聲音也會立刻消失。"
      },
      {
        question: "動物發出的聲音有很多種目的，像是警告危險、找伴侶或跟同伴說話。",
        options: ["○", "╳"],
        answer: 1,
        explanation: "許多動物會用聲音來溝通，像是發出求偶聲、警戒聲或是互相聯絡。"
      },
      {
        question: "自己會發光的東西，我們就叫它光源。",
        options: ["○", "╳"],
        answer: 1,
        explanation: "光源就是能夠自己發出光線的物體，例如太陽、燈泡。"
      },
      {
        question: "在一片漆黑的房間裡，白色的東西看起來會特別亮。",
        options: ["○", "╳"],
        answer: 2,
        explanation: "在完全黑暗、沒有光線的地方，任何東西都看不見，不管它原本是什麼顏色。"
      },
      {
        question: "把手電筒的光從彎彎的管子一頭照進去，光就沒辦法從另一頭出來。",
        options: ["○", "╳"],
        answer: 1,
        explanation: "光是走直線的，所以遇到彎曲的管子，光線無法轉彎，就不能從另一頭射出。"
      },
      {
        question: "我們可以用鏡子來改變光的行進方向。",
        options: ["○", "╳"],
        answer: 1,
        explanation: "鏡子光滑的表面會反射光線，所以可以改變光的行進路線。"
      },
      {
        question: "鏡子之所以能照出清楚的影像，是因為它的表面光滑，可以反射光線。",
        options: ["○", "╳"],
        answer: 1,
        explanation: "鏡子表面非常平滑，光線射到上面後會規律地反射，所以能形成清楚的影像。"
      },
      {
        question: "下列哪種做法不能讓手上的沙鈴發出聲音？",
        options: ["搖動它", "輕拍它的表面", "用力敲打它", "把它靜靜地拿著不動"],
        answer: 4,
        explanation: "只有當物體振動時才會產生聲音，靜止不動無法產生振動。"
      },
      {
        question: "你在還沒看到車子時就先聽到鳴笛聲，聲音是透過什麼傳到你耳朵的？",
        options: ["行道樹", "空氣", "陽光", "輪胎"],
        answer: 2,
        explanation: "聲音會藉由空氣傳播到我們的耳朵，所以我們才能聽到。"
      },
      {
        question: "下面哪一個例子，是聲音利用固體傳播的？",
        options: ["在水底聽到朋友吹的哨音", "隔著門聽到外面的狗叫聲", "耳朵貼著牆壁，聽到隔壁的說話聲", "在臺下聽到臺上老師的講話聲"],
        answer: 3,
        explanation: "耳朵貼著牆壁聽聲音，就是利用牆壁這個固體來傳播聲音。"
      },
      {
        question: "手電筒的光從彎曲的水管一端照入，光會怎麼樣？",
        options: ["光會從另一端出來", "光只會跑一半", "光會一閃一閃地出來", "光無法通過水管，另一端是黑暗的"],
        answer: 4,
        explanation: "光是直線前進的，沒辦法轉彎，所以彎曲的水管會擋住光，另一端就不會有光。"
      },
      {
        question: "消防車的警報器是利用哪一種方式來提醒大家？",
        options: ["聲音", "光線", "聲音和光線", "空氣"],
        answer: 3,
        explanation: "消防車會同時發出響亮的警笛聲和閃爍的燈光，利用聲音和光線來提醒大家。"
      }
    ]
  },
  {
    id: "sg-1-A",
    title: "聲光 1 評量A",
    category: "聲光",
    questions: [
      {
        question: "敲打金屬風鈴會發聲，是因為鈴管在振動。",
        options: ["O", "X"],
        answer: 1,
        explanation: "物體受敲擊振動而發聲。"
      },
      {
        question: "我們開口說話時，用手觸摸喉部會感到震動。",
        options: ["O", "X"],
        answer: 1,
        explanation: "發聲時喉部聲帶會振動。"
      },
      {
        question: "想讓鈴鼓聲停止，只要更加用力拍打即可。",
        options: ["O", "X"],
        answer: 2,
        explanation: "需按住鼓面制止振動。"
      },
      {
        question: "聲音能藉由固體物質，向四面八方傳播。",
        options: ["O", "X"],
        answer: 1,
        explanation: "固體可以傳播聲音。"
      },
      {
        question: "敲擊桌面的聲響，無法經由木質桌面傳遞。",
        options: ["O", "X"],
        answer: 2,
        explanation: "木頭等固體能傳導聲音。"
      },
      {
        question: "把耳朵貼在桌面上，能聽見輕敲遠端桌角的聲音。",
        options: ["O", "X"],
        answer: 1,
        explanation: "聲音沿著桌面固體傳入。"
      },
      {
        question: "隔著水泥牆能聽見敲門聲，證實固體能傳播聲音。",
        options: ["O", "X"],
        answer: 1,
        explanation: "牆壁固體能傳遞聲音振動。"
      },
      {
        question: "青蛙叫與雄獅吼叫，兩者目的均是為了求偶。",
        options: ["O", "X"],
        answer: 2,
        explanation: "獅吼主要用於宣示與警告。"
      },
      {
        question: "野生動物鳴叫，兼具傳訊、警告與求偶之用。",
        options: ["O", "X"],
        answer: 1,
        explanation: "鳴叫聲是動物通訊管道。"
      },
      {
        question: "趴在木桌上聽敲擊桌腳聲，主要傳聲介質為何？",
        options: ["空氣", "固體木桌"],
        answer: 2,
        explanation: "木桌固體直接傳遞振動。"
      },
      {
        question: "玩紙杯傳聲筒通話，聲波主要藉由何者傳播？",
        options: ["空氣", "拉直繃緊的棉線"],
        answer: 2,
        explanation: "緊繃棉線為傳音之固體。"
      },
      {
        question: "音樂廳中聆聽鋼琴獨奏，琴聲藉由何者傳播？",
        options: ["流動的空氣", "舞台木板"],
        answer: 1,
        explanation: "琴聲由空氣傳入人耳。"
      },
      {
        question: "遠方天空中響起的雷鳴聲，主要藉由何者傳來？",
        options: ["周圍的空氣", "地表土壤"],
        answer: 1,
        explanation: "雷聲透過空氣傳遞。"
      },
      {
        question: "敲打三角鐵後立刻用手掌握緊，聲音將會？",
        options: ["逐漸變大聲", "立即減弱消失"],
        answer: 2,
        explanation: "手阻礙金屬振動使音止。"
      },
      {
        question: "當發聲體的振動完全停止時，聲音會發生何變化？",
        options: ["轉為高音", "聲量暴增", "立即停止消失", "持續迴響"],
        answer: 3,
        explanation: "振動終止則聲音消逝。"
      },
      {
        question: "處在下列哪種情境下，完全無法製造出聲音？",
        options: ["用嘴吹響直笛", "直笛靜置在桌上", "撥動吉他琴弦", "雙手拍手鼓掌"],
        answer: 2,
        explanation: "靜止無震盪不會發聲。"
      },
      {
        question: "下列何項日常經驗，能直接證明水（液體）可以傳聲？",
        options: ["潛入水中聽見哨音", "走廊聽見談話", "聽見屋頂落雨", "枕邊聽見鬧鐘"],
        answer: 1,
        explanation: "水中聞哨證明水可傳音。"
      },
      {
        question: "聲音可在下列哪些狀態的物質之中傳遞？",
        options: ["僅限空氣", "僅限水體", "僅限岩石", "固體、液體與氣體"],
        answer: 4,
        explanation: "固液氣三態皆能傳播。"
      },
      {
        question: "站在瀑布旁聽見隆隆水聲，與下列何者無關？",
        options: ["流水碰撞岩石", "空氣受擾振動", "水花互相拍擊", "水把所有聲音都吸光"],
        answer: 4,
        explanation: "全被吸收則無法聽聞。"
      },
      {
        question: "所有物體在發出聲音時，必然伴隨何種現象？",
        options: ["物體急速升溫", "產生快速振動", "顏色產生轉變", "體積縮小變扁"],
        answer: 2,
        explanation: "發音源必有動態振動。"
      },
      {
        question: "下列哪種動物發出長嚎叫聲，主要目的在召集同伴？",
        options: ["青蛙夜間鳴叫", "猛獸咆哮驅敵", "深山狼群長嚎", "蟬兒夏日鳴叫"],
        answer: 3,
        explanation: "狼嚎能號召遠處同伴。"
      },
      {
        question: "用鐵棒輕敲吊掛的三角鐵，會伴隨何種現象？",
        options: ["鐵棒劇烈發燙", "鐵身發光", "鐵身振動並傳出聲音", "鐵身融化變形"],
        answer: 3,
        explanation: "敲擊引發金屬微幅震盪。"
      }
    ]
  },
  {
    id: "sg-1-B",
    title: "聲光 1 評量B",
    category: "聲光",
    questions: [
      {
        question: "輕敲音叉發出嗡嗡聲時，用手摸會覺得麻麻的。",
        options: ["O", "X"],
        answer: 1,
        explanation: "發聲物體都在快速振動。"
      },
      {
        question: "說話時用手指摸著喉嚨，可以感覺到聲帶在振動。",
        options: ["O", "X"],
        answer: 1,
        explanation: "發出聲音時聲帶正在振動。"
      },
      {
        question: "物體的振動如果完全停下來，發出的聲音也會停止。",
        options: ["O", "X"],
        answer: 1,
        explanation: "振動停止，聲音就會消失。"
      },
      {
        question: "聲音只能在空氣中傳播，完全無法穿過水或桌子。",
        options: ["O", "X"],
        answer: 2,
        explanation: "固體、液體和氣體都能傳聲。"
      },
      {
        question: "耳朵貼在長木桌上，能清楚聽到遠處手指輕敲桌面。",
        options: ["O", "X"],
        answer: 1,
        explanation: "木頭固體能良好傳遞聲音。"
      },
      {
        question: "不同動物發出不同叫聲，常有警告或找同伴的作用。",
        options: ["O", "X"],
        answer: 1,
        explanation: "動物靠聲音傳遞訊息。"
      },
      {
        question: "在完全沒有空氣的太空中，聲音依然能直接傳開。",
        options: ["O", "X"],
        answer: 2,
        explanation: "真空沒有介質，無法傳聲。"
      },
      {
        question: "耳朵貼在課桌上聽到的敲擊聲，主要是透過何者傳遞？",
        options: ["空氣傳遞", "桌面固體傳遞"],
        answer: 2,
        explanation: "課桌固體能有效傳遞聲音。"
      },
      {
        question: "在教室裡聽見老師講課的聲音，主要是透過何者傳遞？",
        options: ["空氣傳遞", "桌面固體傳遞"],
        answer: 1,
        explanation: "聲音透過空氣傳入耳朵。"
      },
      {
        question: "夏天聽到遠處天空轟隆隆的雷聲，主要是透過何者傳遞？",
        options: ["空氣傳遞", "地面固體傳遞"],
        answer: 1,
        explanation: "雷聲由空氣傳播開來。"
      },
      {
        question: "用紙杯和拉直的棉線做成傳聲筒，聲音主要靠何者傳遞？",
        options: ["杯內空氣", "拉緊的棉線"],
        answer: 2,
        explanation: "拉直的棉線是傳聲的固體。"
      },
      {
        question: "敲響銅鑼後，如何讓響亮的鑼聲在瞬間停下來？",
        options: ["對著銅鑼大力吹氣", "用手掌緊緊按住鑼面", "拿起鼓棒再敲一下", "把眼睛閉上不看"],
        answer: 2,
        explanation: "按住鑼面制止振動即可消音。"
      },
      {
        question: "下列哪一種操作情況，完全不會發出任何聲音？",
        options: ["用手彈緊繃橡皮筋", "敲打掛著的三角鐵", "把尺平放在桌上不動", "兩手大力拍掌"],
        answer: 3,
        explanation: "靜止沒有振動就不會發聲。"
      },
      {
        question: "游泳時把頭埋在水裡，能聽見岸上的哨音，證明？",
        options: ["只有固體能傳聲", "只有空氣能傳聲", "光線會製造聲音", "水也能夠傳播聲音"],
        answer: 4,
        explanation: "水等液體也能傳播聲音。"
      },
      {
        question: "下列哪一種介質傳播聲音的速度，通常最為迅速？",
        options: ["堅硬的鋼鐵固體", "流動的水池液體", "飄動的自然空氣", "完全無物的真空"],
        answer: 1,
        explanation: "固體傳播聲音速度最快。"
      },
      {
        question: "狼群在黑夜中長聲嚎叫，最主要的目的通常是？",
        options: ["恐嚇天上的太陽", "呼喚同伴與宣示領域", "幫助肚子消化食物", "吸引水裡的小魚"],
        answer: 2,
        explanation: "嚎叫用來集結同伴與警戒。"
      },
      {
        question: "下列何者最能證明「固體可以良好傳遞聲音」？",
        options: ["看見窗外小鳥飛過", "坐在操場聽飛機聲", "醫生用聽診器聽心跳", "在大街上聽車喇叭聲"],
        answer: 3,
        explanation: "聽診器靠固體管壁傳導心跳。"
      },
      {
        question: "將橡皮筋套在盒子上彈撥，橡皮筋拉得愈緊時？",
        options: ["發出的聲音音調愈高", "發出的聲音音調愈低", "完全無法發出聲音", "聲音會立刻爆炸"],
        answer: 1,
        explanation: "拉得越緊振動越快音調越高。"
      },
      {
        question: "敲擊裝了不同水量的高腳杯，水最少的那一杯？",
        options: ["完全沒有聲音", "敲起來音調最低", "音調跟滿水一樣", "敲起來音調最高"],
        answer: 4,
        explanation: "水少質量輕，敲擊音調高。"
      },
      {
        question: "大瀑布發出嘩啦嘩啦的水聲，主要是什麼原因？",
        options: ["水流撞擊岩石震動空氣", "水溫太熱發出哀號", "魚群在水底下拍手", "天上的雲朵在唱歌"],
        answer: 1,
        explanation: "水撞擊岩石引起空氣震盪。"
      },
      {
        question: "下列哪一種做法，最能減少大馬路傳來的噪音？",
        options: ["把家裡窗戶全部敞開", "安裝厚窗簾與氣密隔音窗", "在客廳大聲敲鐵盆", "把電視音量開到最大"],
        answer: 2,
        explanation: "隔音窗與厚布能阻絕聲波。"
      },
      {
        question: "下列哪一組東西，全部都可以透過敲擊或吹奏發聲？",
        options: ["風鈴、笛子、鼓", "影子、雲朵、鏡子", "鉛筆、橡皮擦、墊板", "自來水、墨汁、白紙"],
        answer: 1,
        explanation: "三者皆能受力振動發聲。"
      }
    ]
  },
  {
    id: "sg02",
    title: "聲光 2基礎",
    category: "聲光",
    questions: [
      {
        question: "自身能發出光的物體叫做？",
        options: ["光源", "震源", "水源"],
        answer: 1,
        explanation: "能自己發出光的物體稱為光源。"
      },
      {
        question: "哪一個是光源？",
        options: ["反光背心", "閃亮的水面", "被光照到的鏡子", "點亮的車燈"],
        answer: 4,
        explanation: "車燈能自行發光，所以是光源。"
      },
      {
        question: "哪一個不是光源？",
        options: ["太陽", "月亮", "流星", "螢火蟲"],
        answer: 2,
        explanation: "月亮不會發光，只是反射太陽光。"
      },
      {
        question: "光照射到不透明的物體，會怎樣？",
        options: ["形成影子", "光會穿透", "光會消失"],
        answer: 1,
        explanation: "光照到不透明的物體時，會被擋住而形成影子。"
      },
      {
        question: "影子的位置，跟光源如何？",
        options: ["同一邊", "相反邊"],
        answer: 2,
        explanation: "影子會出現在與光源的相反邊。"
      },
      {
        question: "影子在物體左邊，光源在物體哪一邊？",
        options: ["左邊", "右邊"],
        answer: 2,
        explanation: "影子在左邊，表示光源在物體的右邊。"
      },
      {
        question: "玩手影遊戲，手、影子、光在一直線上要怎麼排？",
        options: ["光－手－影", "手－光－影", "手－影－光", "手－光－影"],
        answer: 1,
        explanation: "光在前、手在中間、影子在後。"
      },
      {
        question: "用手電筒照射彎曲的水管，光線會怎樣？",
        options: ["從出口照射出來", "無法照射出來"],
        answer: 2,
        explanation: "光是直線前進，所以無法從彎曲的水管照射出來。"
      },
      {
        question: "用手電筒照射彎曲的水管的實驗，要證明什麼？",
        options: ["光是直線前進", "光有三原色"],
        answer: 1,
        explanation: "這個實驗是用來證明光會直線前進。"
      },
      {
        question: "哪個物品最容易反光？",
        options: ["抹布", "報紙", "橡皮擦", "玻璃"],
        answer: 4,
        explanation: "玻璃表面光滑，最容易反射光線。"
      },
      {
        question: "容易反光的物體，表面是怎樣？",
        options: ["粗糙", "光滑"],
        answer: 2,
        explanation: "容易反光的物體通常表面很光滑。"
      },
      {
        question: "光照到鏡子後，反射的光會繼續怎樣前進？",
        options: ["彎曲", "直線", "波浪", "鋸齒"],
        answer: 2,
        explanation: "光照到鏡子反射後，仍會直線前進。"
      },
      {
        question: "太陽系裡的哪個行星會發光？",
        options: ["金星", "火星", "木星", "都不會"],
        answer: 4,
        explanation: "太陽系的行星都不會發光，都是反射太陽光。"
      },
      {
        question: "通過門縫的光是如何繼續前進？",
        options: ["彎曲", "波浪", "直線", "鋸齒"],
        answer: 3,
        explanation: "通過門縫的光會直線繼續前進。"
      },
      {
        question: "汽車遮陽板用光的什麼特性來隔熱？",
        options: ["反光", "直線前進", "光有三原色"],
        answer: 1,
        explanation: "汽車遮陽板利用光的反射來減少熱量進入車內。"
      },
      {
        question: "哪一個運用光的反射來操作？",
        options: ["放大鏡聚集陽光", "導護老師的背心", "建築師的水平雷射光", "舞台表演的光束"],
        answer: 2,
        explanation: "導護老師的背心利用光的反射讓人更容易被看見。"
      }
    ]
  },
  {
    id: "sg21",
    title: "聲光 2a",
    category: "聲光",
    questions: [
      {
        question: "空氣和水可以傳播聲音，固態物體則無法傳播聲音。",
        options: ["○", "╳"],
        answer: 2,
        explanation: "聲音在固態物體中的傳播速度甚至比空氣和水更快。"
      },
      {
        question: "在游泳池裡，潛在水中游泳的學生可以聽到老師的哨子聲，表示水可以傳播聲音。",
        options: ["○", "╳"],
        answer: 1,
        explanation: "聲音可以透過水作為介質傳播，證明水可以傳聲。"
      },
      {
        question: "當我們在說話時，手摸喉嚨會有振動的感覺。",
        options: ["○", "╳"],
        answer: 1,
        explanation: "說話時聲帶振動，這種振動會產生聲音，我們用手可以感覺到。"
      },
      {
        question: "同一種動物可能會發出不同的聲音來達成不同的目的。",
        options: ["○", "╳"],
        answer: 1,
        explanation: "例如，狗會用叫聲表達警告或興奮，是一種多功能的溝通方式。"
      },
      {
        question: "在完全黑暗的環境中是無法看見任何東西的。",
        options: ["○", "╳"],
        answer: 1,
        explanation: "缺乏光源時，眼睛無法接收光線，因此無法看到物體。"
      },
      {
        question: "進行「光的行進」實驗時，手電筒從排水軟管的一端照射，無論是彎曲或拉直排水軟管，光線都可以從另一端照射出來。",
        options: ["○", "╳"],
        answer: 2,
        explanation: "光是直線傳播的，只有將排水軟管拉直，光線才能順利通過。"
      },
      {
        question: "光的直線前進現象可以讓物體產生影子。",
        options: ["○", "╳"],
        answer: 1,
        explanation: "光線被不透明物體阻擋後，其直線傳播的特性會讓物體後面產生陰影。"
      },
      {
        question: "路上的反光裝置，是利用光的反射現象設計的。",
        options: ["○", "╳"],
        answer: 1,
        explanation: "反光裝置能將車燈的光反射回駕駛者，讓駕駛者更容易看見。"
      },
      {
        question: "要讓物體發出聲音時，我們必須讓物體發生哪一種變化？",
        options: ["改變溫度", "讓物體振動", "移動物體的位置", "改變物體形狀。"],
        answer: 2,
        explanation: "聲音的產生是物體快速振動的結果。"
      },
      {
        question: "「趴在桌子上，貼在桌面的耳朵可以聽到拍打桌面的聲音。」這是利用下列哪一種物質傳播聲音？",
        options: ["桌子", "雙手", "空氣", "水。"],
        answer: 1,
        explanation: "聲音透過桌面（固體）傳播，因此耳朵貼在桌面上聽得更清楚。"
      },
      {
        question: "老師利用雷射筆投射光線在白板上進行講解，這是利用光的哪一個特性？",
        options: ["具有熱", "直線行進", "可以四面八方照射", "彎曲行進。"],
        answer: 2,
        explanation: "雷射筆的光線是筆直的，正好說明光是直線行進的。"
      },
      {
        question: "下列哪一種物品無法讓停電的夜晚看見周圍的物體？",
        options: ["手電筒", "燭火", "鏡子", "螢光棒。"],
        answer: 3,
        explanation: "鏡子本身不發光，只會反射光線，因此在沒有其他光源的情況下，無法用來照明。"
      },
      {
        question: "日常生活中除了鏡子外，下列哪一種物質也會明顯反射光線？",
        options: ["報紙", "樹幹", "沙灘", "平靜的水面。"],
        answer: 4,
        explanation: "平靜的水面像鏡子一樣光滑，能反射光線，呈現倒影。"
      },
      {
        question: "下列何者是聲音在生活上的應用？",
        options: ["語音輸入編輯文件", "標示緊急出口處", "燈塔的燈光", "太陽能路燈。"],
        answer: 1,
        explanation: "語音輸入是利用聲音辨識技術，屬於聲音的應用。其他選項都與光有關。"
      }
    ]
  },
  {
    id: "sg22",
    title: "聲光 2b",
    category: "聲光",
    questions: [
      {
        question: "只有空氣和水可以傳遞聲音，硬的東西（固體）無法傳聲。",
        options: ["○", "╳"],
        answer: 2,
        explanation: "聲音在硬的東西裡傳得更快，所以固體也能傳播聲音。"
      },
      {
        question: "游泳時潛到水裡，還是能聽到岸上教練的哨子聲，這說明水可以傳遞聲音。",
        options: ["○", "╳"],
        answer: 1,
        explanation: "聲音可以通過水傳播，這就是為什麼在水裡也能聽到聲音。"
      },
      {
        question: "說話時把手輕輕放在喉嚨上，會感覺到它在動。",
        options: ["○", "╳"],
        answer: 1,
        explanation: "說話時，我們的聲帶會振動，這種振動產生了聲音，用手可以感覺到。"
      },
      {
        question: "同一種動物發出的不同叫聲，可能代表著不同的意思。",
        options: ["○", "╳"],
        answer: 1,
        explanation: "像是狗的叫聲，有時是高興，有時是警戒，牠們會用不同的聲音來表達不同的情緒或目的。"
      },
      {
        question: "在一個完全沒有光的房間裡，我們什麼東西都看不到。",
        options: ["○", "╳"],
        answer: 1,
        explanation: "要看到東西，需要有光線照到東西上，再反射到眼睛裡。沒有光，眼睛就無法接收到任何訊息。"
      },
      {
        question: "實驗時，把手電筒的光從水管的一頭照進去，不論水管是彎的還是直的，光都可以從另一頭出來。",
        options: ["○", "╳"],
        answer: 2,
        explanation: "光是走直線的，所以只有水管是直的，光才能順利穿過；水管是彎的，光就會被擋住。"
      },
      {
        question: "物體的影子，是因為光會直線前進而產生的。",
        options: ["○", "╳"],
        answer: 1,
        explanation: "當不透明的物體擋住光線，而光又會走直線時，物體後面就會形成一片陰影，也就是影子。"
      },
      {
        question: "馬路上的反光片，是利用光的反射原理來做的。",
        options: ["○", "╳"],
        answer: 1,
        explanation: "反光片會把車燈的光反射回來，讓開車的人更容易看到路上的東西，這就是利用光的反射。"
      },
      {
        question: "如果想讓一個東西發出聲音，要先讓它發生什麼變化？",
        options: ["改變它的溫度", "讓它搖晃或振動", "移動它的位置", "改變它的形狀"],
        answer: 2,
        explanation: "聲音都是因為東西振動而產生的，所以要讓東西發出聲音，就必須讓它振動。"
      },
      {
        question: "把耳朵貼在桌子上，可以聽到有人拍桌子的聲音，這是聲音透過什麼傳過來的？",
        options: ["桌子", "空氣", "雙手", "水"],
        answer: 1,
        explanation: "聲音是透過桌面（固體）傳到你的耳朵，所以會聽得比透過空氣更清楚。"
      },
      {
        question: "老師用雷射筆在黑板上畫線，這是在運用光的哪一個特性？",
        options: ["會發熱", "會走直線", "會四面八方亂射", "會轉彎"],
        answer: 2,
        explanation: "雷射筆射出的光線是筆直的一條線，這就是光會直線前進的特性。"
      },
      {
        question: "停電時，下面哪一個東西無法幫助你看見周圍的物品？",
        options: ["手電筒", "蠟燭", "鏡子", "螢光棒"],
        answer: 3,
        explanation: "手電筒、蠟燭、螢光棒自己都會發光，可以當作光源。鏡子只會反射光，本身不會發光。"
      },
      {
        question: "除了鏡子，還有哪一種東西也會很明顯地反射光線？",
        options: ["報紙", "樹幹", "平靜的水面", "沙灘"],
        answer: 3,
        explanation: "平靜的水面很光滑，可以像鏡子一樣把光線反射，所以會看到倒影。"
      },
      {
        question: "下列哪一個是聲音在生活中的應用？",
        options: ["語音輸入法", "燈塔的燈光", "標示緊急出口的燈", "太陽能路燈"],
        answer: 1,
        explanation: "語音輸入法是利用聲音來進行操作，屬於聲音的應用。其他都是光的應用。"
      }
    ]
  },
  {
    id: "sg-2-A",
    title: "聲光 2 評量A",
    category: "聲光",
    questions: [
      {
        question: "天上的太陽、點亮的燈泡與燭火，都是自身會發光的光源。",
        options: ["O", "X"],
        answer: 1,
        explanation: "能自行發光者稱為光源。"
      },
      {
        question: "若無任何光源照射，我們的眼睛無法看見任何東西。",
        options: ["O", "X"],
        answer: 1,
        explanation: "眼睛看見物體需光線進入。"
      },
      {
        question: "光照射到不透光的物體時，背光面會形成陰影。",
        options: ["O", "X"],
        answer: 1,
        explanation: "不透光物質遮光形成影子。"
      },
      {
        question: "身處漆黑山洞中，打開手電筒光線可看清周圍。",
        options: ["O", "X"],
        answer: 1,
        explanation: "手電筒照亮物體反射入眼。"
      },
      {
        question: "平靜湖面上波光閃耀，是由於水面反射陽光。",
        options: ["O", "X"],
        answer: 1,
        explanation: "水面如鏡反射外界光源。"
      },
      {
        question: "拍照時使用反光板，可改變光向補充臉部光線。",
        options: ["O", "X"],
        answer: 1,
        explanation: "反光板藉反射引導光線。"
      },
      {
        question: "門縫中透出的筆直光柱，說明光是沿著直線行進。",
        options: ["O", "X"],
        answer: 1,
        explanation: "光在大氣中沿直線傳播。"
      },
      {
        question: "眼睛透過多次彎折的水管，依然能看見後方的光源。",
        options: ["O", "X"],
        answer: 2,
        explanation: "光走直線無法通過曲管。"
      },
      {
        question: "只有光滑平整的鏡面，才能產生光的反射。",
        options: ["O", "X"],
        answer: 2,
        explanation: "多數物體表面皆會反射光。"
      },
      {
        question: "擋風玻璃下的鋁箔遮陽板，是應用光的反射嗎？",
        options: ["是", "否"],
        answer: 1,
        explanation: "鋁箔反射強光防止升溫。"
      },
      {
        question: "道路分隔島上的紅色警示標誌，是應用光的反射嗎？",
        options: ["是", "否"],
        answer: 1,
        explanation: "反光片能反射來車大燈。"
      },
      {
        question: "交通警察夜間穿著的反光背心，是應用光的反射嗎？",
        options: ["是", "否"],
        answer: 1,
        explanation: "特殊條紋能高強度反光。"
      },
      {
        question: "閱讀小字的放大鏡，是利用光的反射原理嗎？",
        options: ["是", "否"],
        answer: 2,
        explanation: "放大鏡是光的折射原理。"
      },
      {
        question: "下列何種自然現象，並非由光直線前進造成的？",
        options: ["太陽底下在地上的影子", "樹林中穿透的筆直光線", "山谷中傳來的回音", "門縫漏出的直條光線"],
        answer: 3,
        explanation: "回音是聲音反射不是光。"
      },
      {
        question: "下列何種物品表面，最不容易觀察到反光光斑？",
        options: ["粗糙黑橡皮擦", "拋光不鏽鋼碗", "透明壓克力板", "平面玻璃鏡"],
        answer: 1,
        explanation: "粗糙暗色表面多吸收光線。"
      },
      {
        question: "夜裡銀白色的明月，其光芒主要源自何處？",
        options: ["地球路燈反射", "太陽照射後反射", "月球岩石自體發光", "星星聚集照亮"],
        answer: 2,
        explanation: "月球表面反射太陽光芒。"
      },
      {
        question: "打開雷射筆射出的光束，在空氣中如何行進？",
        options: ["旋轉前進", "彎曲前進", "筆直前進", "折返前進"],
        answer: 3,
        explanation: "光束沿直線路徑前進。"
      },
      {
        question: "若路燈照映下，自己的影子落在正右方，路燈在？",
        options: ["正上方", "正後方", "正下方", "正左方"],
        answer: 4,
        explanation: "陰影方向恆與光源相對。"
      },
      {
        question: "當一束手電筒光照過來，何者最不容易反射光線？",
        options: ["光亮的白車漆", "深黑色的絨布", "大樓玻璃窗", "金屬製鏡面"],
        answer: 2,
        explanation: "深黑粗糙布料極易吸光。"
      },
      {
        question: "傾斜手電筒照射鏡面，反射出去的光線將會？",
        options: ["隨照射角度改變方向", "轉彎成波浪狀", "直接穿過鏡子", "原地停留不動"],
        answer: 1,
        explanation: "入射角改變則反射角隨之變。"
      }
    ]
  },
  {
    id: "sg-2-B",
    title: "聲光 2 評量B",
    category: "聲光",
    questions: [
      {
        question: "太陽與點燃的蠟燭能自己發光，都屬於光源。",
        options: ["O", "X"],
        answer: 1,
        explanation: "會自己發光的物體是光源。"
      },
      {
        question: "在完全漆黑沒任何光的暗室裡，眼睛仍能看清色彩。",
        options: ["O", "X"],
        answer: 2,
        explanation: "沒有光線，眼睛看不見。"
      },
      {
        question: "光在空氣中行進時，是以筆直的直線向前傳播。",
        options: ["O", "X"],
        answer: 1,
        explanation: "光是沿直線行進的。"
      },
      {
        question: "光照在平滑的鏡子表面上，會產生規則的反射。",
        options: ["O", "X"],
        answer: 1,
        explanation: "光滑表面能良好反射光線。"
      },
      {
        question: "拿一根彎彎的水管，眼睛仍然能透過它看見燭光。",
        options: ["O", "X"],
        answer: 2,
        explanation: "光走直線無法轉彎繞過彎管。"
      },
      {
        question: "夜空中的月亮會發亮，是因為月亮本身是大光源。",
        options: ["O", "X"],
        answer: 2,
        explanation: "月亮只是反射太陽的光芒。"
      },
      {
        question: "放大鏡是否主要利用「光的反射」原理來設計的？",
        options: ["是", "否"],
        answer: 2,
        explanation: "放大鏡是利用光的折射原理。"
      },
      {
        question: "汽車遮陽板是否利用「光的反射」把陽光擋在車外？",
        options: ["是", "否"],
        answer: 1,
        explanation: "反射板將陽光照回車外。"
      },
      {
        question: "交通警察穿的反光背心，是否利用「光的反射」來發亮？",
        options: ["是", "否"],
        answer: 1,
        explanation: "反光條反射車燈保護安全。"
      },
      {
        question: "下列哪一個物體能自己發光，屬於真正的「光源」？",
        options: ["乾淨的大面鏡子", "發亮的手電筒", "光滑的反光板", "透明玻璃珠"],
        answer: 2,
        explanation: "通電發亮的燈具是光源。"
      },
      {
        question: "晴天走路時，影子出現在身體左邊，太陽在哪邊？",
        options: ["身體正上方", "身體左邊", "身體右邊", "身體正後方"],
        answer: 3,
        explanation: "影子方向必定與太陽相反。"
      },
      {
        question: "下列哪一個日常現象，最能證明「光走直線」？",
        options: ["鏡子映照出人影", "筷子插水裡看起來折斷", "雨後天邊出現彩虹", "陽光穿過樹葉在地上成影"],
        answer: 4,
        explanation: "擋住光線形成影子是走直線。"
      },
      {
        question: "下列哪一種生活用品，主要是利用「光的反射」？",
        options: ["汽車照後鏡", "近視眼鏡鏡片", "透明玻璃水杯", "放大鏡鏡片"],
        answer: 1,
        explanation: "照後鏡藉由反射映照後方。"
      },
      {
        question: "用雷射筆射向牆壁上的平面鏡，光線會如何？",
        options: ["原路直線倒退回去", "朝另一邊斜斜反射出去", "穿過鏡子穿進牆內", "被鏡子完全吸光消失"],
        answer: 2,
        explanation: "光照射鏡面會反彈折向對側。"
      },
      {
        question: "下列哪一種物體的表面，最不容易產生清晰的反光？",
        options: ["平靜乾淨的池水面", "粗糙吸光的黑布", "光亮的不鏽鋼湯匙", "擦拭乾淨的大鏡子"],
        answer: 2,
        explanation: "深色粗糙表面不易反射光。"
      },
      {
        question: "大馬路轉角處安裝的大凸面鏡，主要功能是什麼？",
        options: ["擴大視野看清轉角盲區", "把刺眼車燈光線全部吸掉", "聚光用來燒水生火", "把路牌文字放大十倍"],
        answer: 1,
        explanation: "凸面鏡反射光線擴大視野。"
      },
      {
        question: "我們能看見課本上的文字與圖片，光線是怎麼走的？",
        options: ["書本自己發出強烈光芒", "眼睛發出光線照在書本上", "光在空中轉圈飛進眼睛", "光源照在書本再反射進眼"],
        answer: 4,
        explanation: "物體反射光源光線入眼成像。"
      },
      {
        question: "玩皮影戲時，把手偶慢慢靠近燈光，牆上的影子？",
        options: ["影子會慢慢變大", "影子會慢慢變小", "影子會瞬間消失", "影子會轉變成彩色"],
        answer: 1,
        explanation: "靠近光源遮光面積大影子變大。"
      },
      {
        question: "夜晚走在路燈底下，離路燈愈近時，地上的影子？",
        options: ["影子會愈拉愈長", "影子完全不會變", "影子會愈縮愈短", "影子會自動跳舞"],
        answer: 3,
        explanation: "光源在頭頂正上方時影子最短。"
      },
      {
        question: "下列哪一種現象屬於「光的折射」，而不是走直線？",
        options: ["吸管插在水杯裡看起來像斷了", "大太陽下出現樹蔭與影子", "手電筒照出筆直筆直的光束", "利用手偶在牆上做出各種影子"],
        answer: 1,
        explanation: "光穿過水發生偏折為折射。"
      }
    ]
  },
  {
    id: "sg03",
    title: "聲光 3基礎",
    category: "聲光",
    questions: [
      {
        question: "各種聲音與光，帶給我們的感受都相同。",
        options: ["O", "X"],
        answer: 2,
        explanation: "不同的聲音和光會帶給我們不同的感覺，所以不可能都相同。"
      },
      {
        question: "螢火蟲發出鳴叫來吸引異性。",
        options: ["O", "X"],
        answer: 2,
        explanation: "螢火蟲是靠發光而不是鳴叫來吸引異性。"
      },
      {
        question: "紅綠燈來提醒大家前進或停止，是聲光的哪種應用？",
        options: ["光", "聲音", "光與聲音", "溫度"],
        answer: 1,
        explanation: "紅綠燈是利用光的變化來提醒人們前進或停止。"
      },
      {
        question: "電話鈴響，是聲光的哪種應用？",
        options: ["光", "聲音", "光與聲音", "空氣"],
        answer: 2,
        explanation: "電話鈴響是利用聲音來提醒有人來電。"
      },
      {
        question: "垃圾車播音樂告訴大家要倒垃圾了，是聲光的哪種應用？",
        options: ["光", "聲音", "光與聲音", "溫度"],
        answer: 2,
        explanation: "垃圾車播放音樂是利用聲音通知大家可以倒垃圾了。"
      },
      {
        question: "救護車鳴笛並閃警示燈，是聲光的哪種應用？",
        options: ["光", "聲音", "光與聲音", "空氣"],
        answer: 3,
        explanation: "救護車同時用警笛聲和警示燈來提醒周圍的人注意。"
      },
      {
        question: "鐵路平交道發出警鈴與號誌，是聲光的哪種應用？",
        options: ["光", "聲音", "光與聲音", "溫度"],
        answer: 3,
        explanation: "鐵路平交道用警鈴和號誌一起提醒人車注意安全。"
      },
      {
        question: "火災警示器發出警鈴，是聲光的哪種應用？",
        options: ["光", "聲音", "光與聲音", "溫度"],
        answer: 2,
        explanation: "火災警示器用警鈴聲來提醒發生火災。"
      },
      {
        question: "夜間的路燈，是聲光的哪種應用？",
        options: ["光", "聲音", "光與聲音", "溫度"],
        answer: 1,
        explanation: "夜間路燈是利用光來照亮道路。"
      },
      {
        question: "放煙火時的巨大聲響與美麗火花，是聲光的哪種應用？",
        options: ["光", "聲音", "光與聲音", "溫度"],
        answer: 3,
        explanation: "放煙火時同時產生聲音和光，所以是聲光的應用。"
      },
      {
        question: "萬花筒是運用光的什麼原理來設計？",
        options: ["光的直線前進", "光的反射", "光的折射"],
        answer: 2,
        explanation: "萬花筒是利用光的反射原理來形成美麗圖案。"
      }
    ]
  },
  {
    id: "sg-3-A",
    title: "聲光 3 評量A",
    category: "聲光",
    questions: [
      {
        question: "現代科技結合聲光技術，為日常生活帶來便利。",
        options: ["O", "X"],
        answer: 1,
        explanation: "聲光科技大幅便利生活。"
      },
      {
        question: "震耳爆竹聲與柔和小夜燈，帶給人的感受是一樣的。",
        options: ["O", "X"],
        answer: 2,
        explanation: "不同聲光引發不同感受。"
      },
      {
        question: "室內煙霧警報器響起大聲鈴響，是警示人員避難逃生。",
        options: ["O", "X"],
        answer: 1,
        explanation: "警鈴以強烈聲響警告危機。"
      },
      {
        question: "夜間飛舞的螢火蟲，主要是依靠鳴叫吸引同伴。",
        options: ["O", "X"],
        answer: 2,
        explanation: "螢火蟲是利用發光求偶。"
      },
      {
        question: "對著手機說話轉換成文字搜尋，屬於聲音的科技應用。",
        options: ["O", "X"],
        answer: 1,
        explanation: "語音辨識屬於聲音科技。"
      },
      {
        question: "海邊燈塔發出明亮光芒，是為了指引船隻航行方向。",
        options: ["O", "X"],
        answer: 1,
        explanation: "燈塔光柱引導夜航船隻。"
      },
      {
        question: "聆聽優美的合唱歌曲，能感受演唱者傳達的心情。",
        options: ["O", "X"],
        answer: 1,
        explanation: "音樂聲響能抒發豐富情感。"
      },
      {
        question: "聲音與光線兩項要素，在日常生活中無法結合並用。",
        options: ["O", "X"],
        answer: 2,
        explanation: "平交道閃燈鳴鈴即為結合。"
      },
      {
        question: "慶典夜空施放煙火伴隨巨響，屬於何種應用？",
        options: ["同時結合聲與光", "單純只有光線"],
        answer: 1,
        explanation: "火光為光，爆炸巨響為聲。"
      },
      {
        question: "警車出任務時鳴笛並閃爍警示燈，屬於何種應用？",
        options: ["同時結合聲與光", "單純只有聲音"],
        answer: 1,
        explanation: "閃爍為光，刺耳警笛為聲。"
      },
      {
        question: "救護車在路上鳴笛且頂燈閃爍，屬於何種應用？",
        options: ["同時結合聲與光", "單純只有光線"],
        answer: 1,
        explanation: "警示燈為光，急促長笛為聲。"
      },
      {
        question: "火車快來時平交道紅燈閃爍並叮咚作響，屬於？",
        options: ["同時結合聲與光", "單純只有聲音"],
        answer: 1,
        explanation: "閃爍紅燈配上警鈴聲響。"
      },
      {
        question: "傍晚垃圾車播放音樂提醒大家倒垃圾，屬於何者？",
        options: ["結合聲光", "純粹聲音應用"],
        answer: 2,
        explanation: "僅藉由旋律提醒民眾。"
      },
      {
        question: "客廳電話機發出響亮鈴聲通知接聽，屬於何種應用？",
        options: ["結合聲光", "純粹聲音應用"],
        answer: 2,
        explanation: "鈴音屬於單一聲音訊息。"
      },
      {
        question: "下列各項日常生活實例中，何者屬於聲音的應用？",
        options: ["路邊路燈照明", "陽光促進生長", "垃圾車音樂通知", "港口導航燈號"],
        answer: 3,
        explanation: "播送旋律提醒居民倒垃圾。"
      },
      {
        question: "下列何者是現代生活中，純粹利用光線傳遞訊息？",
        options: ["馬路路口的紅綠燈", "倒車發出的嗶嗶聲", "救護車長鳴警笛", "學校上課的鐘聲"],
        answer: 1,
        explanation: "號誌燈號變換指揮車流。"
      },
      {
        question: "客廳電話機發出急促鈴響通知接聽，是何種應用？",
        options: ["空氣濕度感應", "聲音聽覺應用", "熱能轉換", "水流動力"],
        answer: 2,
        explanation: "電話以響鈴提醒通話。"
      },
      {
        question: "下列哪一項公共設施，同時整合了光線與聲音警報？",
        options: ["樓梯間小夜燈", "手機純錄音", "鐵路平交道閃燈與警鈴", "公園噴水池"],
        answer: 3,
        explanation: "警鈴警示聽覺閃燈警示視覺。"
      },
      {
        question: "「馬路紅綠燈、手搖鈴鐺、海邊燈塔、防盜警示紅燈」，有幾項應用光？",
        options: ["1項", "2項", "4項", "3項"],
        answer: 4,
        explanation: "紅綠燈、燈塔、警燈共3項。"
      }
    ]
  },
  {
    id: "sg-3-B",
    title: "聲光 3 評量B",
    category: "聲光",
    questions: [
      {
        question: "消防車閃著紅色的旋轉警示燈，是光在生活的應用。",
        options: ["O", "X"],
        answer: 1,
        explanation: "警示燈利用光線遠距警示。"
      },
      {
        question: "救護車在路上大聲鳴笛，是利用聲音傳遞緊急訊號。",
        options: ["O", "X"],
        answer: 1,
        explanation: "警笛利用聲音提醒車輛避讓。"
      },
      {
        question: "生活中的器具只能單獨用光或聲音，不能兩者結合。",
        options: ["O", "X"],
        answer: 2,
        explanation: "許多設備兼具聲音與發光。"
      },
      {
        question: "十字路口的紅綠燈，利用光來維持行人與行車秩序。",
        options: ["O", "X"],
        answer: 1,
        explanation: "交通號誌是標準的光應用。"
      },
      {
        question: "螢火蟲在夏夜腹部發光，主要是為了照亮腳下的路。",
        options: ["O", "X"],
        answer: 2,
        explanation: "螢火蟲發光主要用於求偶。"
      },
      {
        question: "下課鈴聲響起，提醒大家休息，這是聲音的日常應用。",
        options: ["O", "X"],
        answer: 1,
        explanation: "鐘聲利用聲音傳達作息訊息。"
      },
      {
        question: "放煙火時有巨響和火花，這是有結合聲光還是無結合？",
        options: ["有結合聲光", "無結合聲光"],
        answer: 1,
        explanation: "巨響是聲，火花是光。"
      },
      {
        question: "警車的鳴笛聲與警示燈，這是有結合聲光還是無結合？",
        options: ["有結合聲光", "無結合聲光"],
        answer: 1,
        explanation: "警笛是聲，閃燈是光。"
      },
      {
        question: "救護車鳴笛並閃著紅燈，這是有結合聲光還是無結合？",
        options: ["有結合聲光", "無結合聲光"],
        answer: 1,
        explanation: "鳴笛是聲，紅燈是光。"
      },
      {
        question: "鐵路平交道的警鈴與紅燈，這是有結合聲光還是無？",
        options: ["有結合聲光", "無結合聲光"],
        answer: 1,
        explanation: "叮噹是聲，閃燈是光。"
      },
      {
        question: "垃圾車播放音樂提醒倒垃圾，這是有結合聲光還是無？",
        options: ["有結合聲光", "無結合聲光"],
        answer: 2,
        explanation: "純播放音樂，屬聲音應用。"
      },
      {
        question: "客廳電話發出的響亮鈴聲，這是有結合聲光還是無？",
        options: ["有結合聲光", "無結合聲光"],
        answer: 2,
        explanation: "單純鈴聲響，屬聲音應用。"
      },
      {
        question: "下列哪一項生活應用，純粹屬於「聲音」的提醒功能？",
        options: ["燈塔在黑夜發光", "學校鐘聲提醒下課", "汽車車尾的煞車紅燈", "路邊閃爍的霓虹招牌"],
        answer: 2,
        explanation: "上下課鐘聲純靠聲音提醒。"
      },
      {
        question: "下列哪一項生活設備，純粹屬於「光」的視覺引導？",
        options: ["馬路上的紅綠燈", "駕駛按喇叭叭叭聲", "垃圾車播放少女的祈禱", "火車站廣播列車進站"],
        answer: 1,
        explanation: "紅綠燈純以燈光指示通行。"
      },
      {
        question: "下列哪一種生活情境，同時結合了「聲音」與「光線」？",
        options: ["純文字的童話書", "沒發光的水果鈴鐺", "不發聲的充電手電筒", "平交道噹噹響與紅閃燈"],
        answer: 4,
        explanation: "平交道同時有警鈴聲與紅燈。"
      },
      {
        question: "跨年倒數施放高空煙火時，大家會同時感受到什麼？",
        options: ["璀璨的花火與震撼巨響", "只有耳朵聽見大爆炸聲", "只有安靜不動的文字燈", "完全無聲也無光一片黑"],
        answer: 1,
        explanation: "煙火燃放伴隨光影與音效。"
      },
      {
        question: "夜晚騎腳踏車時，後車架裝設紅色閃爍尾燈的作用？",
        options: ["讓腳踏車踩得更快更輕鬆", "在全黑環境看清楚前方坑洞", "提醒後方來車保持安全距離", "吸引路旁螢火蟲飛過來"],
        answer: 3,
        explanation: "亮燈能提醒後車注意安全。"
      },
      {
        question: "視障朋友要過馬路時，路口常有什麼無障礙輔助設施？",
        options: ["彩色高亮度的箭頭指示看板", "發出鳥鳴或布穀聲的號誌", "大面凸面鏡映照車輛影子", "地上畫著五彩美麗斑馬線"],
        answer: 2,
        explanation: "有聲號誌利用聲音引導過路。"
      },
      {
        question: "救護車出任務時，同時開啟警笛與紅閃燈的主要目的？",
        options: ["測試車上的喇叭壞了沒", "好玩熱鬧吸引路人鼓掌", "讓車廂內部保持通風涼爽", "雙重提醒路上車輛迅速禮讓"],
        answer: 4,
        explanation: "聲光雙重提醒讓車輛禮讓。"
      }
    ]
  },
  {
    id: "li-1-A",
    title: "力 1 評量A",
    category: "力",
    questions: [
      {
        question: "想讓滾動中的球停下來，不需要用到力。",
        options: ["O", "X"],
        answer: 2,
        explanation: "阻擋運動物體仍需施力。"
      },
      {
        question: "用手把黏土壓扁或搓圓，是受到力的作用。",
        options: ["O", "X"],
        answer: 1,
        explanation: "施力能改變物體外形。"
      },
      {
        question: "輕輕拉長橡皮筋後放手，會恢復原來的樣子。",
        options: ["O", "X"],
        answer: 1,
        explanation: "彈性物體受力後可復原。"
      },
      {
        question: "磁鐵可以隔空吸起桌上的鐵夾，這是磁力的現象。",
        options: ["O", "X"],
        answer: 1,
        explanation: "磁力可吸引鐵質物品。"
      },
      {
        question: "推開窗戶時，可以從窗戶的位置移動看到力的作用。",
        options: ["O", "X"],
        answer: 1,
        explanation: "施力會促使物體位置移動。"
      },
      {
        question: "橡皮筋被拉長，屬於改變物體的運動情形。",
        options: ["O", "X"],
        answer: 2,
        explanation: "長度改變屬於形狀變化。"
      },
      {
        question: "搖動身體讓呼拉圈轉動，是改變物體的運動情形。",
        options: ["O", "X"],
        answer: 1,
        explanation: "旋轉屬於改變運動狀態。"
      },
      {
        question: "用腳踩住滾動中的足球讓球停下來，是改變運動情形。",
        options: ["O", "X"],
        answer: 1,
        explanation: "由動轉靜為運動狀態改變。"
      },
      {
        question: "用力把球丟向遠方，是改變球的運動情形。",
        options: ["O", "X"],
        answer: 1,
        explanation: "投擲促使物體由靜轉動。"
      },
      {
        question: "輕輕拉長橡皮筋後放手，它的形狀能不能恢復原狀？",
        options: ["能恢復原狀", "無法恢復原狀"],
        answer: 1,
        explanation: "橡膠彈性具恢復能力。"
      },
      {
        question: "用雙手壓扁皮球後放手，皮球能不能恢復原狀？",
        options: ["能恢復原狀", "無法恢復原狀"],
        answer: 1,
        explanation: "球內空氣彈性使其復原。"
      },
      {
        question: "用削鉛筆機把鉛筆削尖，削掉的部分能不能變回原狀？",
        options: ["能恢復原狀", "無法恢復原狀"],
        answer: 2,
        explanation: "削去木質無法自行長回。"
      },
      {
        question: "用手把黏土壓成扁扁的形狀，放手後能不能恢復原狀？",
        options: ["能恢復原狀", "無法恢復原狀"],
        answer: 2,
        explanation: "黏土缺乏彈性無法復原。"
      },
      {
        question: "下列哪一種改變，不能用來判斷物體有沒有受到力？",
        options: ["移動快慢改變", "形狀外觀改變", "物件品牌名稱", "位置移動改變"],
        answer: 3,
        explanation: "品牌名稱與力學無關。"
      },
      {
        question: "下列哪一種現象，不屬於物體受到力後「形狀改變」？",
        options: ["壓扁易開罐", "拉長橡皮筋", "捏扁麵團", "把足球踢進球門"],
        answer: 4,
        explanation: "進球門屬於位置位移。"
      },
      {
        question: "下列物品受到外力改變後，哪一種沒辦法恢復原狀？",
        options: ["被撕碎的紙張", "被拉長的彈簧", "壓扁的海綿", "按壓的皮球"],
        answer: 1,
        explanation: "碎紙纖維斷裂無法復原。"
      },
      {
        question: "折斷粉筆的現象，和下列哪一種最相似？",
        options: ["壓扁彈簧玩具", "用剪刀剪開色紙", "躺在枕頭上", "拉開弓箭射箭"],
        answer: 2,
        explanation: "兩者皆為不可逆破壞。"
      },
      {
        question: "關於用力對物體運動的影響，下列哪一項是正確的？",
        options: ["雙手接住球時球速變快", "踢足球時球會由滾動變靜止", "風力越大風車轉得越快", "風力變小時葉片會加速"],
        answer: 3,
        explanation: "施加外力越大運動越劇烈。"
      },
      {
        question: "流動的溪水推動水車轉動，是運用大自然的哪一種力量？",
        options: ["磁力", "水力", "風力", "動物的力"],
        answer: 2,
        explanation: "水流衝擊力轉化為動力。"
      },
      {
        question: "利用拉長的橡皮筋把玩具飛機彈射出去，是利用什麼力？",
        options: ["磁力", "水力", "彈力", "風力"],
        answer: 3,
        explanation: "彈性恢復產生彈力推進。"
      },
      {
        question: "按壓原子筆讓筆尖伸出來，是利用裡面的什麼零件產生的彈力？",
        options: ["磁鐵", "氣壓", "金屬彈簧", "水柱"],
        answer: 3,
        explanation: "彈簧形變產生彈性回饋。"
      },
      {
        question: "以前農夫利用牛來幫忙拉車或耕田，主要是借助什麼力？",
        options: ["風力", "磁力", "彈力", "動物的力(獸力)"],
        answer: 4,
        explanation: "動物肌肉出力稱為獸力。"
      },
      {
        question: "空曠地方的大型風力發電機轉動，是依靠哪種自然力？",
        options: ["風力", "地心引力", "水力", "太陽光"],
        answer: 1,
        explanation: "空氣流動推動葉片旋轉。"
      },
      {
        question: "磁鐵可以把散落的鐵迴紋針吸起來，是借助哪一種力？",
        options: ["浮力", "重力", "磁力", "靜電"],
        answer: 3,
        explanation: "磁極對鐵物質產生吸引。"
      },
      {
        question: "在沙漠中利用駱駝幫忙搬運重物，是利用哪一種力量？",
        options: ["風力", "動物的力(獸力)", "地熱", "彈力"],
        answer: 2,
        explanation: "役使動物出力為獸力。"
      }
    ]
  },
  {
    id: "li-1-B",
    title: "力 1 評量B",
    category: "力",
    questions: [
      {
        question: "雙手用力拉橡皮筋後鬆開手，橡皮筋會縮回原狀。",
        options: ["O", "X"],
        answer: 1,
        explanation: "橡皮筋具有良好彈性。"
      },
      {
        question: "把彩色黏土捏成小鴨子，放手後會自己彈回原狀。",
        options: ["O", "X"],
        answer: 2,
        explanation: "黏土變形後無法自己恢復。"
      },
      {
        question: "靜止在草地上的足球被踢一腳後滾動，是受到了力。",
        options: ["O", "X"],
        answer: 1,
        explanation: "施力能改變物體的運動狀態。"
      },
      {
        question: "滾動中的球撞到牆壁停下來，完全沒有受到力的作用。",
        options: ["O", "X"],
        answer: 2,
        explanation: "牆壁阻力讓運動的球停下。"
      },
      {
        question: "磁鐵隔著一段距離能吸起小鐵夾，說明磁力也是力。",
        options: ["O", "X"],
        answer: 1,
        explanation: "磁力是不需接觸就能作用的力。"
      },
      {
        question: "用手輕輕拉長橡皮筋後放開，這形狀是否能恢復？",
        options: ["可恢復", "不可恢復"],
        answer: 1,
        explanation: "橡皮筋具彈性能自行恢復。"
      },
      {
        question: "用削鉛筆機把鉛筆削短，這形狀是否能自行恢復？",
        options: ["可恢復", "不可恢復"],
        answer: 2,
        explanation: "削掉的木頭無法再還原。"
      },
      {
        question: "用雙手輕輕壓扁海灘球再放開，這形狀是否能恢復？",
        options: ["可恢復", "不可恢復"],
        answer: 1,
        explanation: "空氣充氣球受壓後會彈回。"
      },
      {
        question: "把黏土壓成扁平的形狀，這形狀放開後是否能恢復？",
        options: ["可恢復", "不可恢復"],
        answer: 2,
        explanation: "黏土受力變形無法自行恢復。"
      },
      {
        question: "橡皮筋被拉長，是因為受力改變了運動情形。",
        options: ["O", "X"],
        answer: 2,
        explanation: "橡皮筋變長是形狀改變。"
      },
      {
        question: "呼拉圈在腰上旋轉，是因為受力改變了運動情形。",
        options: ["O", "X"],
        answer: 1,
        explanation: "旋轉轉動是運動情形改變。"
      },
      {
        question: "伸出腳把滾動的球擋住，是因為受力改變運動情形。",
        options: ["O", "X"],
        answer: 1,
        explanation: "使球停下是運動情形改變。"
      },
      {
        question: "把手中的棒球用力投出去，是受力改變運動情形。",
        options: ["O", "X"],
        answer: 1,
        explanation: "球飛出去是運動狀態改變。"
      },
      {
        question: "水車不停旋轉，是因為受到流動溪水施加的水力。",
        options: ["O", "X"],
        answer: 1,
        explanation: "水流推動水車葉片旋轉。"
      },
      {
        question: "把一張白紙用力撕成碎片，屬於何種受力後的變化？",
        options: ["完全沒有受力", "形狀改變且無法復原", "形狀改變且能自行彈回", "只有位置移動形狀未變"],
        answer: 2,
        explanation: "紙張撕裂後無法自動還原。"
      },
      {
        question: "下列哪一個現象，屬於物體受力後「運動狀態改變」？",
        options: ["用腳把飛來的足球踢進球門", "用美工刀將橡皮擦切半", "雙手用力將鐵絲折彎", "把麵糰搓揉成細長條狀"],
        answer: 1,
        explanation: "改變球的行進方向與速度。"
      },
      {
        question: "下列哪一種物體受力變形後，鬆手時「最容易自行復原」？",
        options: ["摔破在地的陶瓷碗", "踩扁的新鮮番茄", "折斷的白色粉筆", "拉開後放手的彈簧鋼圈"],
        answer: 4,
        explanation: "彈簧具有良好的回彈能力。"
      },
      {
        question: "古代農夫牽黃牛下田耕地，主要運用了哪種力量？",
        options: ["水力", "獸力", "風力", "磁力"],
        answer: 2,
        explanation: "動物產生的力量稱為獸力。"
      },
      {
        question: "風車的葉片在大風中快速旋轉，是利用了哪種力量？",
        options: ["磁力", "地熱力", "風力", "電力"],
        answer: 3,
        explanation: "風的流動推動葉片產生力。"
      },
      {
        question: "下列哪一種現象，不需要碰到物體就能產生力量作用？",
        options: ["磁鐵隔空吸起鐵製迴紋針", "雙手用力推開大木門", "用剪刀剪斷厚紙板", "用腳踩腳踏車踏板"],
        answer: 1,
        explanation: "磁力不需接觸即可吸引鐵器。"
      },
      {
        question: "在地上滾動的彈珠慢慢停下，主要是受到什麼影響？",
        options: ["彈珠重量突然消失", "空氣推力愈變愈大", "完全沒有受到任何力", "地面摩擦力的阻礙"],
        answer: 4,
        explanation: "地面摩擦力讓滾動彈珠停下。"
      },
      {
        question: "按壓式的原子筆一按筆心就彈出，裡面主要裝了什麼？",
        options: ["微型水車", "伸縮小彈簧", "天然磁鐵", "小風車"],
        answer: 2,
        explanation: "彈簧的彈力能讓筆心伸縮。"
      },
      {
        question: "用羽毛球拍把迎面飛來的球大力打回去，球改變了什麼？",
        options: ["球的行進方向與速度", "只有球的顏色變深", "只有球的重量加倍", "球完全沒有受到外力"],
        answer: 1,
        explanation: "球拍施力改變球的運動狀態。"
      },
      {
        question: "兩人站在箱子左右兩側用一樣大的力互推，箱子會？",
        options: ["快速向右邊衝出去", "快速向左邊衝出去", "停在原地保持不動", "立刻飛上天空"],
        answer: 3,
        explanation: "大小相等方向相反的力抵消。"
      },
      {
        question: "用橡皮筋當動力把紙飛機彈射出去，是利用什麼力？",
        options: ["水力", "風力", "獸力", "彈力"],
        answer: 4,
        explanation: "橡皮筋變形恢復產生彈力。"
      }
    ]
  },
  {
    id: "li01",
    title: "力 1基礎",
    category: "力",
    questions: [
      {
        question: "「力」可以看得見嗎？",
        options: ["看得見", "看不見"],
        answer: 2,
        explanation: "我們看不見力，只能觀察物體受力後的變化。"
      },
      {
        question: "可以從物體受力後的變化，觀察到力的作用。",
        options: ["O", "X"],
        answer: 1,
        explanation: "從物體的變化，就能發現力正在作用。"
      },
      {
        question: "把滾動的球停下來，不需要使用力。",
        options: ["O", "X"],
        answer: 2,
        explanation: "讓滾動的球停下來需要出力擋住它，所以需要力。"
      },
      {
        question: "回收時，把寶特瓶壓扁，主要是什麼改變？",
        options: ["形狀", "顏色", "位置移動", "運動狀態"],
        answer: 1,
        explanation: "寶特瓶被壓扁，是外表的「形狀」改變了。"
      },
      {
        question: "把靜止的球放到箱子裡，主要是什麼改變？",
        options: ["形狀", "顏色", "位置移動", "運動狀態"],
        answer: 3,
        explanation: "球被換放到箱子裡，是所在的「位置移動」了。"
      },
      {
        question: "靜止的風車，被風吹而開始轉動，主要是什麼改變？",
        options: ["形狀", "顏色", "位置移動", "運動狀態"],
        answer: 4,
        explanation: "風車從不動變成轉動，是「運動狀態」改變。"
      },
      {
        question: "把靜止的球踢出去，主要是什麼改變？",
        options: ["形狀", "顏色", "位置移動", "運動狀態"],
        answer: 4,
        explanation: "球從靜止被踢飛出去，是「運動狀態」改變。"
      },
      {
        question: "把丟過來的飛盤接住，主要是什麼改變？",
        options: ["形狀", "顏色", "位置移動", "運動狀態"],
        answer: 4,
        explanation: "飛盤從飛動到被接住停下，是「運動狀態」改變。"
      },
      {
        question: "迴紋針被一個鐵塊吸起來，這最可能是什麼力？",
        options: ["磁力", "風力", "水力", "彈力"],
        answer: 1,
        explanation: "像磁鐵能吸起鐵塊的力量，就是「磁力」。"
      },
      {
        question: "在溪流旁滾動的木輪，這最可能是什麼力？",
        options: ["浮力", "風力", "水力", "彈力"],
        answer: 3,
        explanation: "溪水推動木輪轉動的力量，就是「水力」。"
      },
      {
        question: "沙漠裡用駱駝載運物品，這最可能是什麼力？",
        options: ["獸力", "風力", "水力", "彈力"],
        answer: 1,
        explanation: "靠駱駝等動物幫忙搬東西的力量，叫做「獸力」。"
      },
      {
        question: "在游泳池，抱著游泳圈而不會沉下去，這最可能是什麼力？",
        options: ["浮力", "風力", "水力", "彈力"],
        answer: 1,
        explanation: "水把游泳圈往上托的力量，叫做「浮力」。"
      },
      {
        question: "原子筆裡有個環形的金屬線，按壓時筆心會伸縮，這最可能是什麼力？",
        options: ["浮力", "風力", "水力", "彈力"],
        answer: 4,
        explanation: "筆裡面的彈簧壓下去會彈回來，這就是「彈力」。"
      },
      {
        question: "哪個物體不再施力後，可以復原？",
        options: ["折斷竹筷子", "拉長橡皮筋", "打破玻璃", "紙張撕成兩條"],
        answer: 2,
        explanation: "橡皮筋拉長後放開，就會自己恢復原狀。"
      },
      {
        question: "哪個物體施力後不能再復原？",
        options: ["彈力球往地上丟", "繩子打結再鬆開", "敲碎雞蛋的殼", "撥動吉他的弦"],
        answer: 3,
        explanation: "蛋殼破了無法再恢復。"
      }
    ]
  },
  {
    id: "li02",
    title: "力 2基礎",
    category: "力",
    questions: [
      {
        question: "同一個圓形的氣球，哪種狀態受力最大？",
        options: ["壓得很扁", "保持圓形", "稍微壓扁"],
        answer: 1,
        explanation: "氣球被壓得越扁，代表它受到的力越大。"
      },
      {
        question: "把同一個橡皮筋拉長，哪種狀態受力最大？",
        options: ["拉長到10公分", "拉長到12公分", "拉長到14公分", "拉長到16公分"],
        answer: 4,
        explanation: "橡皮筋被拉得最長（16公分），代表受力最大。"
      },
      {
        question: "把同一顆足球被踢動，哪種狀態受力最小？",
        options: ["移動10公尺", "移動20公尺", "移動30公尺", "移動40公尺"],
        answer: 1,
        explanation: "足球被踢得最近（10公尺），代表受力最小。"
      },
      {
        question: "量物品重量的受力情形，用什麼來實驗較合適？",
        options: ["足球", "氣球", "橡皮筋", "飛盤"],
        answer: 3,
        explanation: "橡皮筋拉長的長度很明顯，適合用來量重量大小。"
      },
      {
        question: "量物品移動遠近的受力情形，用什麼來實驗較合適？",
        options: ["足球", "氣球", "橡皮筋", "游泳圈"],
        answer: 1,
        explanation: "足球滾動的遠近很明顯，適合用來觀察推力大小。"
      },
      {
        question: "要測量物體受力大小，量什麼變化較不適合？",
        options: ["形狀改變", "顏色改變", "距離改變", "運動狀態"],
        answer: 2,
        explanation: "顏色變化比較看不出差異，不適合測量。"
      },
      {
        question: "力的表示，三角形箭號表示什麼？",
        options: ["力的大小", "力的方向", "受力的作用點"],
        answer: 2,
        explanation: "箭號指著哪邊，就代表力往哪邊推拉的「力的方向」。"
      },
      {
        question: "力的表示，箭號長度線越長表示什麼？",
        options: ["施力越小", "施力越大"],
        answer: 2,
        explanation: "箭號的線條畫得越長，代表「施力越大」。"
      },
      {
        question: "力的表示，在球碰到腳的地方畫記號，這記號是什麼？",
        options: ["力的大小", "力的方向", "受力的作用點"],
        answer: 3,
        explanation: "碰到物體開始出力的那個點，叫作「受力的作用點」。"
      },
      {
        question: "力的表示，對物體施力的位置，畫什麼記號？",
        options: ["三角形", "直線", "小圓點"],
        answer: 3,
        explanation: "我們通常在施力的位置，畫一個「小圓點」當記號。"
      },
      {
        question: "力的表示，表示施力大小，畫什麼記號？",
        options: ["三角形", "直線", "小圓點"],
        answer: 2,
        explanation: "我們會畫一條「直線」，用長度來代表施力大小。"
      }
    ]
  },
  {
    id: "li-3-A",
    title: "力 3 評量A",
    category: "力",
    questions: [
      {
        question: "用手指壓氣球，氣球凹陷得越深，代表受到的力越大。",
        options: ["O", "X"],
        answer: 1,
        explanation: "形變量越大顯示受力越大。"
      },
      {
        question: "實驗時橡皮筋被拉得越長，表示受到的拉力越大。",
        options: ["O", "X"],
        answer: 1,
        explanation: "伸長長度與受力大小成正比。"
      },
      {
        question: "彈簧下面掛的砝碼越多，對彈簧產生的拉力就越大。",
        options: ["O", "X"],
        answer: 1,
        explanation: "重量疊加使總拉力增強。"
      },
      {
        question: "自然界中只有水能傳遞力量，空氣沒辦法傳遞力量。",
        options: ["O", "X"],
        answer: 2,
        explanation: "氣體與液體皆可傳送動力。"
      },
      {
        question: "用吹風機吹出強風把落葉吹在一起，是利用固體傳遞力量。",
        options: ["O", "X"],
        answer: 2,
        explanation: "風是流動氣體傳送動力。"
      },
      {
        question: "想比較力的大小，下列哪一種現象不能用來判斷？",
        options: ["物體顏色的改變", "彈簧被拉長的長度", "物體被推動的距離", "軟墊被壓下去的深度"],
        answer: 1,
        explanation: "力的作用不改變物體色澤。"
      },
      {
        question: "站在同一個地方用力向右推開窗戶，關窗戶時要往哪邊用力？",
        options: ["往上方", "往下方", "往左方", "往右方"],
        answer: 3,
        explanation: "關窗推力方向與開窗相反。"
      },
      {
        question: "掛著相同的橡皮筋，哪一條受到的拉力最大？",
        options: ["伸長2公分", "伸長0.5公分", "伸長1公分", "伸長1.5公分"],
        answer: 1,
        explanation: "伸長量最長者受力最大。"
      },
      {
        question: "坐在沙發上，陷下去的深度是甲>乙>丙，誰施加的力最大？",
        options: ["丙", "乙", "無法比較", "甲"],
        answer: 4,
        explanation: "壓陷越深代表向下施力越重。"
      },
      {
        question: "下列生活中的現象，哪一個和力量的傳遞沒有關係？",
        options: ["水槍噴水把紙杯沖倒", "推倒骨牌讓骨牌連續倒下", "雕像靜靜站在廣場上", "洗車機的水柱沖洗車子"],
        answer: 3,
        explanation: "靜立不動無動力傳遞現象。"
      },
      {
        question: "在圖畫上畫箭號來表示受力情形，哪一項敘述是錯誤的？",
        options: ["箭頭指向代表力的方向", "箭號線條長度代表方向", "箭號長度代表力的大小", "箭號起點在受力的地方"],
        answer: 2,
        explanation: "箭號長度代表力量的大小。"
      }
    ]
  },
  {
    id: "li-3-B",
    title: "力 3 評量B",
    category: "力",
    questions: [
      {
        question: "向下壓彈簧出的力愈大，彈簧被壓得愈扁、縮得愈短。",
        options: ["O", "X"],
        answer: 1,
        explanation: "施力愈大，彈簧壓縮量愈大。"
      },
      {
        question: "彈簧下掛一顆彈珠伸長1公分，掛兩顆會伸長2公分。",
        options: ["O", "X"],
        answer: 1,
        explanation: "負重愈重，彈簧伸長量愈大。"
      },
      {
        question: "氣球放氣時往前飛衝，證明氣體也能傳遞推動力。",
        options: ["O", "X"],
        answer: 1,
        explanation: "噴射氣流的反作用力能推動。"
      },
      {
        question: "水槍射出的強力水柱能把紙杯推倒，說明水能傳送力。",
        options: ["O", "X"],
        answer: 1,
        explanation: "流動的水能傳遞衝擊力。"
      },
      {
        question: "科學圖示用箭頭「→」標示力時，箭線長短代表？",
        options: ["力的作用時間", "力的大小程度", "物體的顏色深淺", "施力的起點位置"],
        answer: 2,
        explanation: "箭線長短表示力的大小。"
      },
      {
        question: "箭號「→」的箭頭尖端指向，在科學圖示中代表？",
        options: ["物體的重量", "物體的溫度", "受力的方向", "實驗進行的時間"],
        answer: 3,
        explanation: "箭頭尖端明確表示受力方向。"
      },
      {
        question: "在同一個彈簧下吊掛重物，哪種情況彈簧伸長最長？",
        options: ["掛一顆雞蛋", "掛三顆相同雞蛋", "掛五顆相同雞蛋", "完全不掛任何東西"],
        answer: 3,
        explanation: "吊掛物品愈重，拉力愈大。"
      },
      {
        question: "大人和小朋友一起坐在海綿沙發上，誰坐的位置凹較深？",
        options: ["體重較輕的小朋友", "體重較重的大人", "兩人凹陷完全一樣", "海綿完全不會凹陷"],
        answer: 2,
        explanation: "重量愈重，施加的下壓力愈大。"
      },
      {
        question: "推倒第一張骨牌後整排相繼倒下，這是什麼現象？",
        options: ["力的傳送與連鎖碰撞", "磁鐵同極排斥反應", "光線穿透的視覺錯覺", "熱脹冷縮造成的位移"],
        answer: 1,
        explanation: "碰撞過程讓動能依序傳遞。"
      },
      {
        question: "下列哪一種方法，完全無法用來比較力的大小？",
        options: ["看彈簧被拉長的長度", "看海綿被壓陷的深度", "看橡皮筋伸長的距離", "看物體出廠的價格標籤"],
        answer: 4,
        explanation: "物品價格與物理受力大小無關。"
      },
      {
        question: "想把一台向右滑行的玩具小車煞車停住，該往哪施力？",
        options: ["向上施力", "向左施力", "向右施力", "向下施力"],
        answer: 2,
        explanation: "施加反方向的力能減速停下。"
      }
    ]
  },
  {
    id: "li03",
    title: "力 3基礎",
    category: "力",
    questions: [
      {
        question: "落葉吹風機將落葉聚集，是透過什麼傳送力",
        options: ["液體", "氣體", "固體"],
        answer: 2,
        explanation: "吹風機吹出空氣（氣體）變成風，把落葉吹跑。"
      },
      {
        question: "骨牌一個接一個倒下，是透過什麼傳送力？",
        options: ["液體", "氣體", "固體"],
        answer: 3,
        explanation: "骨牌是硬硬的「固體」，一個撞一個來傳送力。"
      },
      {
        question: "水槍射倒杯子，是透過什麼傳送力？",
        options: ["液體", "氣體", "固體"],
        answer: 1,
        explanation: "水槍射出水（液體），用水的衝力推倒杯子。"
      },
      {
        question: "搧動書本，沒碰到杯子，杯子卻倒了，是透過什麼傳送力",
        options: ["液體", "氣體", "固體"],
        answer: 2,
        explanation: "搧書本推動空氣（氣體），製造風把杯子吹倒。"
      },
      {
        question: "踢球撞倒瓶子，是透過什麼傳送力",
        options: ["液體", "氣體", "固體"],
        answer: 3,
        explanation: "足球是「固體」，飛過去撞倒了瓶子。"
      },
      {
        question: "鴨子在池塘擺動腳來使自己移動，是透過什麼傳送力",
        options: ["液體", "氣體", "固體"],
        answer: 1,
        explanation: "鴨子划動水（液體），靠水的推力往前游。"
      },
      {
        question: "直升機轉動螺旋槳而起飛，是透過什麼傳送力",
        options: ["液體", "氣體", "固體"],
        answer: 2,
        explanation: "螺旋槳往下吹空氣（氣體），把直升機往上推。"
      },
      {
        question: "牛頓擺的鐵球不斷撞擊，是透過什麼傳送力",
        options: ["液體", "氣體", "固體"],
        answer: 3,
        explanation: "鐵球是「固體」，互相撞擊來傳送力。"
      },
      {
        question: "塑膠管連接甲乙兩個注射筒，裡面充滿水，甲從30mL推到20mL，乙從0mL上升到多少？",
        options: ["10mL", "20mL", "30mL", "40mL"],
        answer: 1,
        explanation: "甲推過去10mL的水，乙就會剛好增加10mL。"
      },
      {
        question: "塑膠管連接甲乙兩個注射筒，裡面充滿水，甲從30mL推到10mL，乙從0mL上升到多少？",
        options: ["10mL", "20mL", "30mL", "40mL"],
        answer: 2,
        explanation: "甲推過去20mL的水，乙就會跟著上升20mL。"
      },
      {
        question: "塑膠管連接甲乙兩個注射筒，裡面充滿水，甲從30mL推到0mL，乙從0mL上升到多少？",
        options: ["10mL", "20mL", "30mL", "40mL"],
        answer: 3,
        explanation: "甲推過去30mL的水，乙就會準確上升30mL。"
      },
      {
        question: "塑膠管連接甲乙兩個注射筒，裡面充滿水，甲從30mL推到25mL，乙從0mL上升到多少？",
        options: ["5mL", "15mL", "25mL", "35mL"],
        answer: 1,
        explanation: "甲推過去5mL的水（30減25），乙就只會上升5mL。"
      },
      {
        question: "塑膠管連接注射筒傳送力的實驗，為什麼用水比用空氣適合？",
        options: ["空氣看不清楚", "水重量比較重", "水不可被壓縮", "空氣不可被壓縮"],
        answer: 3,
        explanation: "因為「水不可被壓縮」，推多少水過去就上升多少。"
      }
    ]
  },
  {
    id: "sui-1-A",
    title: "水 1 評量A",
    category: "水",
    questions: [
      {
        question: "把水倒進奇形怪狀的容器裡，靜止時水面不會保持水平。",
        options: ["O", "X"],
        answer: 2,
        explanation: "液體靜止時水面恆為水平。"
      },
      {
        question: "裝半瓶水的水瓶隨意傾斜，等水靜止後水面一定是水平的。",
        options: ["O", "X"],
        answer: 1,
        explanation: "靜止水體表面保持水平狀態。"
      },
      {
        question: "把水倒進底部相通的管子裡，靜止時每個管子的水面都一樣高。",
        options: ["O", "X"],
        answer: 1,
        explanation: "此為連通管原理之特性。"
      },
      {
        question: "工人可以利用裝了水的透明軟管，來檢查掛畫有沒有掛平。",
        options: ["O", "X"],
        answer: 1,
        explanation: "兩端等高水面能校準水平。"
      },
      {
        question: "幾個形狀不同的容器底部相通，就可以形成連通管。",
        options: ["O", "X"],
        answer: 1,
        explanation: "底部相通裝置即為連通管。"
      },
      {
        question: "把裝水的透明軟管左邊抬高，等水靜止後右邊的水面會比較高。",
        options: ["O", "X"],
        answer: 2,
        explanation: "靜止後兩端液面完全等高。"
      },
      {
        question: "泡茶用的茶壺，壺嘴和壺身是連通管原理的生活實例。",
        options: ["O", "X"],
        answer: 1,
        explanation: "壺嘴與壺身底部彼此相通。"
      },
      {
        question: "看著山上的瀑布往下沖，說明水是受到重力由高處往低處流。",
        options: ["O", "X"],
        answer: 1,
        explanation: "水在自然界由高處往低流。"
      },
      {
        question: "裝潢時拿裝水的透明軟管靠在桌旁，是為了測量桌子的高矮。",
        options: ["O", "X"],
        answer: 2,
        explanation: "主要用於檢驗桌面是否水平。"
      },
      {
        question: "觀察軟管裡的水面高度時，視線要平平看著水面才準確。",
        options: ["O", "X"],
        answer: 1,
        explanation: "平視觀測可避免視差誤差。"
      },
      {
        question: "裝水的透明軟管兩端一高一低，裡面靜止的水面也會一高一低。",
        options: ["O", "X"],
        answer: 2,
        explanation: "兩管口水面高度依然相同。"
      },
      {
        question: "用裝水軟管測量水平時，要先把其中一端的水面固定在基準點。",
        options: ["O", "X"],
        answer: 1,
        explanation: "固定一端基準以比對另一端。"
      },
      {
        question: "軟管兩端的水面剛好對齊桌子兩邊邊緣，代表桌面是水平的。",
        options: ["O", "X"],
        answer: 1,
        explanation: "水面水平證實桌面等高平正。"
      },
      {
        question: "裝水的杯子靜靜放在桌面上，水面會呈現什麼狀態？",
        options: ["斜斜的", "水平的表面", "凹凸不平", "圓弧形"],
        answer: 2,
        explanation: "平靜液面必維持水平狀態。"
      },
      {
        question: "粗細不同的水管底部相通，粗管的水面高9公分，細管的水面有多高？",
        options: ["9公分", "12公分", "4.5公分", "0公分"],
        answer: 1,
        explanation: "連通管液面高度必然相同。"
      },
      {
        question: "拿著裝水的透明軟管兩端一高一低，等水靜止後兩端水面的高度？",
        options: ["低的那端比較高", "高的那端比較高", "一樣高", "無法預測"],
        answer: 3,
        explanation: "不受管口位置影響恆等高。"
      },
      {
        question: "裝潢工人利用哪一種水的特性，來檢查相框有沒有掛正？",
        options: ["水的浮力", "毛細現象", "水的蒸發", "連通管原理"],
        answer: 4,
        explanation: "連通管可指出精確水平線。"
      },
      {
        question: "熱水瓶外面的透明水位窗可以看到裡面的水量，是應用什麼原理？",
        options: ["連通管原理", "虹吸現象", "水的浮力", "水的表面張力"],
        answer: 1,
        explanation: "內外相通使水位完全一致。"
      },
      {
        question: "傾斜茶壺倒茶時茶水會流出來，是利用了哪一種原理？",
        options: ["光的折射", "連通管原理", "水的蒸發", "磁力現象"],
        answer: 2,
        explanation: "傾斜打破連通平衡而出水。"
      },
      {
        question: "下列生活常見的物品中，哪一個是應用連通管原理設計的？",
        options: ["吸水抹布", "泡茶的茶壺", "喝飲料的吸管", "充氣救生圈"],
        answer: 2,
        explanation: "壺嘴與壺腹相通為連通管。"
      }
    ]
  },
  {
    id: "sui-1-B",
    title: "水 1 評量B",
    category: "水",
    questions: [
      {
        question: "靜止的水面，無論容器怎麼傾斜，水面永遠保持水平。",
        options: ["O", "X"],
        answer: 1,
        explanation: "靜止的液體表面一定是水平的。"
      },
      {
        question: "水總是往低處流，是因為受到地球引力的牽引。",
        options: ["O", "X"],
        answer: 1,
        explanation: "重力使水自然流向地勢低處。"
      },
      {
        question: "底部相通的容器加水靜止後，各開口水面高度一定等高。",
        options: ["O", "X"],
        answer: 1,
        explanation: "連通管各管水面保持齊平。"
      },
      {
        question: "茶壺的壺嘴如果比壺身開口還低，水裝滿時會流出來。",
        options: ["O", "X"],
        answer: 1,
        explanation: "連通管原理使兩端水位等高。"
      },
      {
        question: "工人用裝水的透明水管，能檢查牆上的兩個洞是否等高。",
        options: ["O", "X"],
        answer: 1,
        explanation: "兩端水面等高能確認水平線。"
      },
      {
        question: "裝半杯水的水杯斜著放，裡面的水面也會變成斜斜的。",
        options: ["O", "X"],
        answer: 2,
        explanation: "水面靜止後依然是平平的。"
      },
      {
        question: "熱水瓶外面的透明水位刻度管，是連通管原理的應用。",
        options: ["O", "X"],
        answer: 1,
        explanation: "外側水管與內部底部連通。"
      },
      {
        question: "用裝水軟管測量桌面時，兩端水面等高表示桌面是平的。",
        options: ["O", "X"],
        answer: 1,
        explanation: "兩端水面等高表示桌面水平。"
      },
      {
        question: "用裝水軟管測量時，眼睛最好比水面高出許多往下看。",
        options: ["O", "X"],
        answer: 2,
        explanation: "平視水面才能看得最準確。"
      },
      {
        question: "把水管左邊抬高，水流過去後，右邊靜止水面會較高。",
        options: ["O", "X"],
        answer: 2,
        explanation: "靜止後兩端水面高度一樣高。"
      },
      {
        question: "把不同形狀的容器底部用管子連通，這就是連通管裝置。",
        options: ["O", "X"],
        answer: 1,
        explanation: "底部相通的裝置即為連通管。"
      },
      {
        question: "在桌上放半杯水，杯底右邊墊橡皮擦，靜止水面呈何狀？",
        options: ["永遠保持水平狀態", "傾斜右高左低", "傾斜左高右低", "凹凸起伏的波浪"],
        answer: 1,
        explanation: "水面靜止時必定呈水平面。"
      },
      {
        question: "三種粗細不同的杯子底部相連，倒水靜止後水面會？",
        options: ["粗杯子水面最高", "細杯子水面最高", "三個杯子水面等高", "彎曲杯子水面最低"],
        answer: 3,
        explanation: "連通管靜止時各處水面齊平。"
      },
      {
        question: "傳統泡茶壺的壺嘴開口，通常要設計得？",
        options: ["比壺身底部還低", "比茶壺頂部低一大截", "隨便設計無所謂", "至少要和壺身等高或更高"],
        answer: 4,
        explanation: "壺嘴過低會使茶水自動流出。"
      },
      {
        question: "水電師傅貼磁磚時，常拿裝水透明軟管校正，主要是利用？",
        options: ["光線的折射", "連通管原理", "毛細現象", "浮力原理"],
        answer: 2,
        explanation: "兩端水面齊平可找出水平線。"
      },
      {
        question: "高山上的小溪往平原流動，主要的原因是什麼？",
        options: ["水受到重力自然往低處流", "山頂的巨大磁鐵排斥溪水", "水在白天會主動往上爬", "風力把整條河流往下吹"],
        answer: 1,
        explanation: "重力使水往地勢低處流。"
      },
      {
        question: "下列哪一種居家設施的設計，符合「連通管原理」？",
        options: ["用抹布擦拭水漬", "用紙巾吸乾墨汁", "洗手台下的U型防臭水管", "吸管吸起杯子裡的紅茶"],
        answer: 3,
        explanation: "U型管底存水隔絕臭氣逆流。"
      },
      {
        question: "裝半瓶水的寶特瓶，倒著放或斜著放，靜止水面有何共通點？",
        options: ["水面全部變成球形", "水面會隨瓶身歪斜", "水會全部結成冰塊", "水面永遠與地面水平平行"],
        answer: 4,
        explanation: "水面靜止時必定保持水平。"
      },
      {
        question: "在水管水平測量實驗中，看兩端水面時，視線應該如何？",
        options: ["從正上方俯看", "與水面平行平視", "從水管正下方仰看", "閉上一隻眼斜看"],
        answer: 2,
        explanation: "視線平視水面能避免誤差。"
      },
      {
        question: "客廳牆壁上的相框歪了，可以用下列何者檢查有沒有掛正？",
        options: ["裝水且兩端微翹的透明水管", "一根乾燥的木筷子", "一顆沉重的金屬球", "一把普通的塑膠梳子"],
        answer: 1,
        explanation: "水管水面水平線可當校正工具。"
      }
    ]
  },
  {
    id: "sui01",
    title: "水 1基礎",
    category: "水",
    questions: [
      {
        question: "水會往哪個方向流動？",
        options: ["高處", "低處"],
        answer: 2,
        explanation: "水受地球引力影響，會往低處流。"
      },
      {
        question: "靜止的水面叫做什麼？",
        options: ["斜坡面", "水切面", "水平面"],
        answer: 3,
        explanation: "水靜止時平坦的表面就是「水平面」。"
      },
      {
        question: "在塑膠盒裝水，當水不再動時，水面會如何？",
        options: ["平平的", "中間高", "四邊高", "一邊高一邊低"],
        answer: 1,
        explanation: "水只要靜止，水面永遠是平的。"
      },
      {
        question: "容器裝了一半的水，將左邊墊高，從桌面量容器右邊水的高度是6公分，則墊高的那邊水高度是多少？",
        options: ["4公分", "6公分", "8公分", "10公分"],
        answer: 2,
        explanation: "靜止的水面維持水平，所以各處高度都相同。"
      },
      {
        question: "用靜止的寶特瓶水平面，在牆上固定一條基準線，則拿其他的裝冰水的寶特瓶來測量，冰水的水平面會跟基準線如何？",
        options: ["重疊", "左邊高右邊低", "右邊高左邊低"],
        answer: 1,
        explanation: "靜止的水面絕對水平，因此會跟基準線重疊。"
      },
      {
        question: "一條塑膠管裝水，靜止時，兩邊水的高度如何？",
        options: ["左邊高右邊低", "右邊高左邊低", "高度相同", "高度不一定"],
        answer: 3,
        explanation: "底部相通的容器，水靜止時兩邊水面會一樣高。"
      },
      {
        question: "一條塑膠管裝水，拉高右邊水管，水靜止時，兩邊水的高度如何？",
        options: ["左邊高右邊低", "右邊高左邊低", "高度相同", "高度不一定"],
        answer: 3,
        explanation: "根據連通管原理，拉高水管不影響兩端水面等高。"
      },
      {
        question: "大注射管跟小注射管，用塑膠管相接，裝水後水靜止時，水的高度如何？",
        options: ["小注射管水較高", "大注射管水較高", "兩個注射管水一樣高"],
        answer: 3,
        explanation: "連通管靜止時水面高度相同，跟管子的粗細無關。"
      },
      {
        question: "用水的連通管原理可以做什麼應用？",
        options: ["調整張貼的海報有沒有平", "幫水族箱換水", "讓水從隙縫爬到高處"],
        answer: 1,
        explanation: "利用連通管兩邊水面等高的特性，可以測量物品有沒有平。"
      },
      {
        question: "茶壺的壺嘴與壺身相連接，也是連通管。",
        options: ["O", "X"],
        answer: 1,
        explanation: "壺嘴和壺身底部相通，就是標準的連通管構造。"
      },
      {
        question: "熱水瓶從外面水位視窗，就可以知道裡面水位，這是水的什麼特性。",
        options: ["虹吸現象", "連通管原理", "毛細現象"],
        answer: 2,
        explanation: "視窗管子與熱水瓶內部相通，這是連通管原理的應用。"
      },
      {
        question: "連通的容器，在一端裝水後，水面都保持一樣高，這是什麼現象或原理？",
        options: ["虹吸現象", "連通管原理", "毛細現象"],
        answer: 2,
        explanation: "底部連通的容器，靜止時水面等高的現象就叫連通管原理。"
      },
      {
        question: "茶壺倒茶是運用什麼現象或原理？",
        options: ["虹吸現象", "連通管原理", "毛細現象"],
        answer: 2,
        explanation: "茶壺利用連通管原理，讓水能從壺嘴順利流出。"
      }
    ]
  },
  {
    id: "sui02",
    title: "水 2基礎",
    category: "水",
    questions: [
      {
        question: "用一條塑膠管幫水族箱換水，是運用什麼現象或原理？",
        options: ["連通管原理", "毛細現象", "虹吸現象"],
        answer: 3,
        explanation: "這是利用水位高低差引水的「虹吸現象」。"
      },
      {
        question: "幫水族箱換水，哪個方法快速但不安全？",
        options: ["用手搬起去倒水", "用水瓢把水舀掉", "用虹吸管把水吸出"],
        answer: 1,
        explanation: "整缸搬起來太重，容易手滑摔破。"
      },
      {
        question: "虹吸現象實驗不需要哪個器具？",
        options: ["水桶", "水管", "注射筒"],
        answer: 3,
        explanation: "只需要水管和水桶，用不到注射筒。"
      },
      {
        question: "虹吸現象換水時，至少要幾條水管？",
        options: ["1條", "2條", "3條", "4條"],
        answer: 1,
        explanation: "只要一條水管就能引水。"
      },
      {
        question: "虹吸現象飲水時，水管要如何做？",
        options: ["充滿水", "充滿空氣"],
        answer: 1,
        explanation: "水管裡必須先裝滿水，不能有空氣。"
      },
      {
        question: "可以用虹吸現象，把地上水桶的水，引到桌上的水族箱嗎？",
        options: ["可以", "不行"],
        answer: 2,
        explanation: "虹吸現象只能讓水從高處流向低處。"
      },
      {
        question: "玩引水接力遊戲時，A容器比B容器低，則水會流向哪裡？",
        options: ["A容器", "B容器"],
        answer: 1,
        explanation: "水會自動流向位置比較低的地方。"
      },
      {
        question: "玩引水接力遊戲時，甲容器比乙容器高，則水會流向哪裡？",
        options: ["甲容器", "甲容器"],
        answer: 1,
        explanation: "水會從高處流向低處。"
      },
      {
        question: "虹吸現象實驗時，水管出水口高度要比容器水面如何？",
        options: ["高", "低", "一樣"],
        answer: 2,
        explanation: "出水口必須比水面低，水才流得出來。"
      },
      {
        question: "水族水面離地面100公分，用虹吸現象換水時，水管出水口高度在哪裡才能換水？",
        options: ["出水口離地面80公分", "出水口離地面100公分", "出水口離地面120公分", "出水口離地面140公分"],
        answer: 1,
        explanation: "80公分比100公分低，水才會往下流。"
      }
    ]
  },
  {
    id: "sui-3-A",
    title: "水 3 評量A",
    category: "水",
    questions: [
      {
        question: "裝滿水的水管越過障礙物，把水由高處引導到低處，稱為虹吸現象。",
        options: ["O", "X"],
        answer: 1,
        explanation: "此為虹吸現象之標準定義。"
      },
      {
        question: "用水管做虹吸現象換水實驗時，水管裡面必須全部都是空的。",
        options: ["O", "X"],
        answer: 2,
        explanation: "管內需先充滿液體才能引流。"
      },
      {
        question: "虹吸引水時，出水口要比水面低水才會流，一樣高時水就會停。",
        options: ["O", "X"],
        answer: 1,
        explanation: "需有水位落差水流才會持續。"
      },
      {
        question: "利用虹吸水管，可以直接把地板上水桶裡的水抽到桌上的水槽。",
        options: ["O", "X"],
        answer: 2,
        explanation: "虹吸無法將水由低處抽往高。"
      },
      {
        question: "大樓的水塔通常裝在頂樓，是利用水由高處往低處流的特性。",
        options: ["O", "X"],
        answer: 1,
        explanation: "水塔居高臨下便利供水輸送。"
      },
      {
        question: "頂樓水塔和家裡的水龍頭連通送水，和連通管原理完全沒有關係。",
        options: ["O", "X"],
        answer: 2,
        explanation: "自來水管網運用連通管原理。"
      },
      {
        question: "兩個水桶的水位如果甲桶高、乙桶低，虹吸水流一定會由甲流向乙。",
        options: ["O", "X"],
        answer: 1,
        explanation: "水受壓力差驅動流向低處。"
      },
      {
        question: "想利用虹吸現象把A水槽的水引流到B水槽，兩個水槽的位置應該？",
        options: ["B水槽比A水槽高", "A水槽比B水槽高", "兩個水槽一樣高", "隨便放都可以"],
        answer: 2,
        explanation: "供水端水位必須高於出水端。"
      },
      {
        question: "準備用水管幫魚缸換水前，水管裡面應該先裝什麼？",
        options: ["裡面先裝滿水", "灌進很多空氣", "水管兩頭鑽洞", "曬乾保持乾燥"],
        answer: 1,
        explanation: "管內注滿水才能建立虹吸。"
      },
      {
        question: "用水管做虹吸換水卻一直沒有出水，最可能是什麼原因？",
        options: ["水桶太重了", "水太乾淨了", "出水口比魚缸水面高", "水管太長了"],
        answer: 3,
        explanation: "出水口高於水源無法引流。"
      },
      {
        question: "想幫大魚缸換水，哪一種抽水換水的方法最省力又安全？",
        options: ["用水杯一次一次慢慢舀", "用吸水海綿慢慢吸", "利用水管用虹吸現象抽水", "用雙手把大魚缸翻倒"],
        answer: 3,
        explanation: "虹吸引水最為安全省力。"
      },
      {
        question: "下列哪一種生活上的做法，是利用虹吸現象？",
        options: ["用吸管喝飲料", "用水管幫魚缸換水", "釣魚浮標浮在水上", "石頭沉到水底"],
        answer: 2,
        explanation: "魚缸換水為虹吸典型應用。"
      },
      {
        question: "幫魚缸做虹吸排水換水時，最少需要準備幾條水管？",
        options: ["3條", "2條", "1條", "4條"],
        answer: 3,
        explanation: "僅需一條充水管即可作業。"
      },
      {
        question: "魚缸水面離地面80公分，想要順利引水，出水口的高度應該？",
        options: ["100公分", "90公分", "85公分", "80公分以下"],
        answer: 4,
        explanation: "出水口必須低於魚缸水面。"
      }
    ]
  },
  {
    id: "sui-3-B",
    title: "水 3 評量B",
    category: "水",
    questions: [
      {
        question: "用裝滿水的軟管幫魚缸換水，是運用了虹吸現象。",
        options: ["O", "X"],
        answer: 1,
        explanation: "管內充滿水引流即為虹吸。"
      },
      {
        question: "用虹吸管抽水時，出水口的位置一定要比魚缸水面低。",
        options: ["O", "X"],
        answer: 1,
        explanation: "水位高低差才能引發水流。"
      },
      {
        question: "管內完全沒有水只有空氣，也可以直接啟動虹吸抽水。",
        options: ["O", "X"],
        answer: 2,
        explanation: "管內必須先裝滿水才行。"
      },
      {
        question: "水塔通常蓋在大樓頂樓，利用地勢高低差讓水流到各戶。",
        options: ["O", "X"],
        answer: 1,
        explanation: "高處往下流能產生穩定水壓。"
      },
      {
        question: "當虹吸管出水口的水位升到跟魚缸等高時，水會停止流動。",
        options: ["O", "X"],
        answer: 1,
        explanation: "水位高低差消失，水便不流。"
      },
      {
        question: "利用虹吸現象抽水，地上水桶的水可以自然抽到桌上魚缸。",
        options: ["O", "X"],
        answer: 2,
        explanation: "水只能從高處流向低處。"
      },
      {
        question: "想利用虹吸管幫魚缸換水，接水的水桶應該放在哪裡？",
        options: ["放在魚缸正上方", "放在比魚缸更低的地上", "放在比魚缸高的書架頂", "放在跟魚缸一樣高的桌上"],
        answer: 2,
        explanation: "出水口要比魚缸水面更低。"
      },
      {
        question: "下列哪一種情況，會導致虹吸換水途中「突然中斷」？",
        options: ["出水口比水面低很多", "水桶的容量非常大", "水管破洞跑進空氣", "魚缸裡的水很乾淨"],
        answer: 3,
        explanation: "管內漏氣進空氣會破壞虹吸。"
      },
      {
        question: "頂樓水塔的水能順利送到一樓廚房，主要是依靠什麼？",
        options: ["重力由高處流向低處的壓力", "水塔上的強力大磁鐵吸引", "陽光照射水滴產生的光芒", "水管裡的水蒸氣向上拉扯"],
        answer: 1,
        explanation: "高低落差能提供穩定給水動力。"
      },
      {
        question: "學校生態池底部有許多淤泥髒水，最省力的排水方法是？",
        options: ["大家合力把水泥池抬起來倒", "用小布丁湯匙慢慢舀水", "用乾毛巾把池水全部吸乾", "用裝滿水的長軟管虹吸排水"],
        answer: 4,
        explanation: "虹吸現象能持續自流排水。"
      },
      {
        question: "虹吸抽水時，若把出水口漸漸抬高到高於魚缸水面？",
        options: ["水流會加速十倍噴出", "水會停止流動甚至倒流", "軟管會像氣球爆炸破裂", "魚缸水會立刻全部結冰"],
        answer: 2,
        explanation: "出水口高於水面時水會停止。"
      },
      {
        question: "下列哪一個日常生活的例子，是虹吸現象的應用？",
        options: ["用長塑膠軟管幫大魚缸換水", "用乾毛巾把臉上的汗擦乾", "下雨天撐開雨傘擋雨水", "用放大鏡在太陽下燒黑紙"],
        answer: 1,
        explanation: "魚缸換水是常見虹吸應用。"
      },
      {
        question: "利用虹吸管抽水時，水管內部一定要先填滿什麼？",
        options: ["乾燥的空氣", "乾淨的小碎石", "水或液體", "海邊的白沙"],
        answer: 3,
        explanation: "管內必須充滿水才能引流。"
      },
      {
        question: "魚缸水面離地80公分，用虹吸換水，出水口高度必須在？",
        options: ["90公分處", "100公分處", "85公分處", "80公分以下"],
        answer: 4,
        explanation: "出水口必須低於魚缸水面。"
      }
    ]
  },
  {
    id: "sui03",
    title: "水 3基礎",
    category: "水",
    questions: [
      {
        question: "洗手台下的水管為什麼要做成U型？",
        options: ["U的造型比較好看", "讓水能停在U型管", "讓沖水更順暢"],
        answer: 2,
        explanation: "U型管的彎曲處能把水留在管子底部。"
      },
      {
        question: "洗手台下的U型水管，保留一些水的目的是？",
        options: ["阻擋水道的臭味", "保持水管濕潤", "避免水管生鏽"],
        answer: 1,
        explanation: "留在管子裡的水，能像蓋子一樣擋住下水道的臭味。"
      },
      {
        question: "九龍公道杯使用什麼現象或原理？",
        options: ["虹吸現象", "連通管原理", "毛細現象"],
        answer: 1,
        explanation: "水裝太滿會引發「虹吸現象」，把水全部排光。"
      },
      {
        question: "為了讓水流到各個住家，水塔會設置在哪裡？",
        options: ["地下室", "地面", "頂樓"],
        answer: 3,
        explanation: "水塔蓋在頂樓高處，水才能順利往下流。"
      },
      {
        question: "水塔的水送到住家，使用什麼現象或原理？",
        options: ["虹吸現象", "連通管原理", "毛細現象"],
        answer: 2,
        explanation: "利用「連通管原理」，高處的水會自動流向較低的住家。"
      },
      {
        question: "毛巾可以吸水，使用什麼現象或原理？",
        options: ["虹吸現象", "連通管原理", "毛細現象"],
        answer: 3,
        explanation: "毛巾有很多細小縫隙，是靠「毛細現象」把水吸進去。"
      },
      {
        question: "水壺壺身傾斜，水會從壺嘴流出，這使用什麼現象或原理？",
        options: ["虹吸現象", "連通管原理", "毛細現象"],
        answer: 2,
        explanation: "壺身和壺嘴底部相通，這是「連通管原理」。"
      },
      {
        question: "不必自己澆水的小盆栽，在盆栽底部有棉線連接下方容器的水，這使用什麼現象或原理？",
        options: ["虹吸現象", "連通管原理", "毛細現象"],
        answer: 3,
        explanation: "棉線有細小縫隙，利用「毛細現象」把水往上吸給植物。"
      },
      {
        question: "熱水瓶不打開，就可以從外面看到水位高度，這使用什麼現象或原理？",
        options: ["虹吸現象", "連通管原理", "毛細現象"],
        answer: 2,
        explanation: "視窗管子跟熱水瓶內部相通且水面等高，是「連通管原理」。"
      },
      {
        question: "吸油管按壓擠下後，油就自動一直流出來，這使用什麼現象或原理？",
        options: ["虹吸現象", "連通管原理", "毛細現象"],
        answer: 1,
        explanation: "先按壓把油引出來後，接著靠「虹吸現象」讓油自動流向低處。"
      }
    ]
  },
  {
    id: "sui04",
    title: "水 毛細現象",
    category: "水",
    questions: [
      {
        question: "物品能吸水而讓水在它的隙縫中移動的現象稱為？",
        options: ["蒸散現象", "虹吸現象", "毛細現象", "磁吸現象"],
        answer: 3,
        explanation: "水會沿著物品裡面小小的縫隙往上爬，這就是「毛細現象」喔！"
      },
      {
        question: "免澆水盆栽是在花盆裡放入一條棉芯，棉芯的一端接到另一個水盆裡，水便能順著棉芯進到花盆中。請問這運用了哪一種科學原理？",
        options: ["虹吸原理", "毛細現象", "蒸發原理", "連通管原理"],
        answer: 2,
        explanation: "水會順著棉線裡小小的縫隙跑到花盆裡，這是毛細現象的幫忙！"
      },
      {
        question: "雅築不小心把水打翻了，急忙找東西來擦，她發現塑膠袋不能把水擦乾，乾抹布卻可以快速擦乾。老師帶她做滴水實驗後歸納出科學原理。請問雅築可以提出哪個好問題，且符合實驗原理解釋？",
        options: ["抹布會吸水嗎？【原理解釋：虹吸現象】", "水越多會吸的越快嗎？【原理解釋：蒸發作用】", "為什麼有些物品吸水快，有些吸水慢呢？【原理解釋：毛細現象】", "塑膠布會吸水嗎？【原理解釋：連通管原理】"],
        answer: 3,
        explanation: "抹布有小縫隙可以把水吸走（毛細現象），但塑膠袋沒有縫隙所以吸不了水。"
      },
      {
        question: "阿榮用相同材質但疏密程度不同的布料進行毛細現象實驗，20秒後水上升高度紀錄為：甲(3公分)、乙(6公分)、丙(1公分)、丁(9公分)。依照毛細現象的定義，哪一種布料的隙縫最小？",
        options: ["甲材質", "乙材質", "丙材質", "丁材質"],
        answer: 4,
        explanation: "布料的縫隙越小，水就會爬得越高，所以水爬最高的「丁」縫隙最小！"
      },
      {
        question: "奇異筆的筆尖必須維持濕潤的狀態，才能一直有墨水來寫出字體，這個現象與下面哪一個的原理相同？",
        options: ["利用抹布擦拭溼的桌面", "將攪拌棒放入裝有水的杯中，會感覺變形", "裝有冰水的杯子一段時間後，外圍有小水珠", "倒出來的水會從高處往低處流動"],
        answer: 1,
        explanation: "抹布吸水和奇異筆出水，都是靠著小縫隙讓水跑出來的「毛細現象」。"
      },
      {
        question: "根據毛細現象，將養樂多的細吸管插入水杯中可以發現吸管內部的水位會比杯中高。若想讓吸管內部的水位更高，下列哪一種方法較為可行？",
        options: ["換成更粗的吸管", "換成更細的吸管", "換成更長的吸管", "換成更短的吸管"],
        answer: 2,
        explanation: "吸管越細，裡面的空間就像小縫隙一樣，可以產生毛細現象讓水爬得更高！"
      },
      {
        question: "采瑩在爬山的時候迷路了，只有找到泥巴水坑，請問她可以用哪一種方式從泥巴水中取出比較乾淨的水？",
        options: ["用粗水管連接泥巴水與罐子，運用毛細現象吸水", "用空水管連接，運用虹吸現象吸乾淨的水", "用水管連接，運用連通管原理移水", "用棉繩連接泥巴水及空罐子，運用毛細現象讓乾淨的水移動到罐子中"],
        answer: 4,
        explanation: "乾淨的水會沿著棉繩的小縫隙跑過來，但泥沙太大過不去，就能濾出乾淨的水囉！"
      }
    ]
  },
  {
    id: "sui07",
    title: "水 挑戰1",
    category: "水",
    questions: [
      {
        question: "水沿著物體內部細微縫隙移動的現象稱為什麼？",
        options: ["蒸散作用", "連通管原理", "毛細現象", "虹吸現象"],
        answer: 3,
        explanation: "水會沿著微小縫隙向上或向四周移動，這就是毛細現象的特徵喔！"
      },
      {
        question: "運動毛巾的一端泡在水盆裡，過不久整條毛巾都濕了。這是運用了什麼科學原理？",
        options: ["虹吸原理", "毛細現象", "蒸發作用", "連通管原理"],
        answer: 2,
        explanation: "水會沿著毛巾纖維間的小縫隙慢慢移動，這正是毛細現象的應用。"
      },
      {
        question: "爸爸掛畫時想確認有沒有掛平，可以利用哪種方法測量？",
        options: ["用吸管運用虹吸現象測量", "在透明軟管內裝水，運用連通管原理測量", "用棉繩運用毛細現象測量", "觀察水桶水面運用蒸發原理測量"],
        answer: 2,
        explanation: "透明軟管裝水呈U字型時，兩邊的水面會一樣高，剛好可以拿來確認物品有沒有水平。"
      },
      {
        question: "小明發現衛生紙能吸水但塑膠墊板不行，他想針對此現象提問。哪個問題最符合原理解釋？",
        options: ["衛生紙會吸水嗎？【虹吸現象】", "水越多吸越快嗎？【蒸發作用】", "為何有些材質吸水快有些不吸水？【毛細現象】", "墊板會吸水嗎？【連通管原理】"],
        answer: 3,
        explanation: "衛生紙有細小縫隙能產生毛細現象來吸水，塑膠墊板沒有縫隙所以無法吸水。"
      },
      {
        question: "幾個底部相通、上半部形狀大小皆不同的玻璃容器，加水靜止後哪個容器水面最高？",
        options: ["最粗的容器", "最細的容器", "造型最彎曲的容器", "全部一樣高"],
        answer: 4,
        explanation: "只要容器底部是相通的，不管形狀長怎樣，水靜止時各管的水面都一定會一樣高。"
      },
      {
        question: "小明換魚缸水時，把裝滿水的管子一端放魚缸，另一端放較低的盆子，水就自動流出。這是什麼原理？",
        options: ["毛細現象", "虹吸原理", "連通管原理", "蒸發原理"],
        answer: 2,
        explanation: "只要管子充滿水，就能讓水自動從高處的魚缸沿著管子流到低處，這就是好用的虹吸原理。"
      },
      {
        question: "有一個底部相通的特殊造型連通容器，加水後關於各開口的水位敘述何者正確？",
        options: ["最寬的開口水位最高", "傾斜的開口水位最低", "所有開口向上的水位都一樣高", "造型複雜的開口水位最低"],
        answer: 3,
        explanation: "因為底部是連通的，所以當水停下來的時候，所有開口的水面高度都會保持一致。"
      },
      {
        question: "如果馬桶的沖水按鈕壞了，該怎麼利用「虹吸現象」把排泄物沖走？",
        options: ["往馬桶丟大量衛生紙", "抽乾馬桶內的水", "用力對馬桶內部吹氣", "快速倒入大量水，讓水位超過彎管最高點"],
        answer: 4,
        explanation: "必須倒入足夠的水，讓水淹過馬桶內部彎管的最高點，才能產生虹吸現象把水通通吸走！"
      }
    ]
  },
  {
    id: "sui08",
    title: "水 挑戰2",
    category: "水",
    questions: [
      {
        question: "小華用不同紙張做實驗，10分鐘後水上升高度為：甲(2cm)、乙(5cm)、丙(1cm)、丁(7cm)。哪種紙張的縫隙最小？",
        options: ["甲紙張", "乙紙張", "丙紙張", "丁紙張"],
        answer: 4,
        explanation: "縫隙越小，毛細現象越明顯，水往上爬的高度就會越高喔！"
      },
      {
        question: "毛筆沾墨水後可以寫字，筆毛能吸水的原理與下列何者相同？",
        options: ["用衛生紙吸乾桌面的水", "吸管在水杯中看起來折斷了", "冰棒周圍有白霧", "水往低處流"],
        answer: 1,
        explanation: "衛生紙吸水和毛筆吸墨水，都是利用微小縫隙產生的「毛細現象」。"
      },
      {
        question: "將水倒入U型管，左右水位一樣高。若把右邊管子稍微往上提，水位會如何變化？",
        options: ["右邊水位變高", "兩邊水位仍維持一樣高", "左邊水位變高", "兩邊水位都會下降"],
        answer: 2,
        explanation: "不論U型管怎麼移動或拉開，只要底部有通，兩端的水面就一定會自動調整到一樣高。"
      },
      {
        question: "把細玻璃管插入水中，管內水位會比水杯高。想讓管內水位升得更高該怎麼做？",
        options: ["換更粗的管子", "換更細的管子", "換更長的管子", "換更短的管子"],
        answer: 2,
        explanation: "管子越細，內部的縫隙就越小，毛細現象會讓水爬得更高！"
      },
      {
        question: "浴室洗手台下方的水管常設計成彎曲的U字型來阻擋臭味，這是應用什麼原理？",
        options: ["連通管原理", "虹吸原理", "毛細現象", "沉降原理"],
        answer: 1,
        explanation: "U型管底部積水且兩端等高，形成一道水牆（水封），能有效阻擋下水道臭味竄出。"
      },
      {
        question: "野外求生時想從混濁泥水中取得乾淨的水，哪種方法最合適？",
        options: ["用粗吸管直接吸取", "用塑膠管運用虹吸現象吸取", "用連通管原理把水移出", "用毛線連接泥水和空杯，運用毛細現象濾水"],
        answer: 4,
        explanation: "乾淨的水會沿著毛線縫隙移動，泥沙太大過不去，就能成功過濾出乾淨的水。"
      },
      {
        question: "想利用水管把魚缸底部的髒水吸出來，怎麼做才對？",
        options: ["將空水管一端放水中，另一端高於水面", "將空水管一端放水中，另一端低於水面", "將裝滿水的管子一端放水中，另一端高於水面", "將裝滿水的管子一端放水中，另一端低於水面"],
        answer: 4,
        explanation: "水管內必須先充滿水排出空氣，且出水口要放得比魚缸的水面低，水才會順利流出來喔！"
      },
      {
        question: "下列哪一個生活應用「沒有」用到連通管原理？",
        options: ["觀察熱水瓶外的透明水線得知水量", "抽水馬桶底部的水會維持一定高度", "自來水廠建在較高處以便供水", "植物根部吸收水分運送到葉子"],
        answer: 4,
        explanation: "植物運送水分主要是依賴「毛細現象」與蒸散作用；其他三個才是連通管原理的應用。"
      },
      {
        question: "把甲杯墊高，並用裝滿水呈倒U型的管子連接較低的乙杯。下列哪種方式可以讓甲杯的水流出最多？",
        options: ["兩杯放平地，管子水平連接", "乙杯墊得比甲杯高，管子接底部", "管子一端插到甲杯最底部，另一端放乙杯", "兩杯放平地，管子接底部"],
        answer: 3,
        explanation: "運用虹吸原理，只要甲杯的水面比乙杯高，且管子插到甲杯的最深處，就能把水吸得最乾淨。"
      }
    ]
  },
  {
    id: "sui06",
    title: "水 虹吸原理",
    category: "水",
    questions: [
      {
        question: "阿榮家裡馬桶的水箱壞掉無法沖水。哪一種方法會產生「虹吸現象」讓髒水順利流進水管內呢？",
        options: ["往馬桶內丟衛生紙", "抽水讓馬桶內的水位降低", "將水管插入水中，用力吹氣", "往馬桶內大量加水，讓水位高過內部彎管的最高點"],
        answer: 4,
        explanation: "要倒很多水，讓水淹過馬桶裡彎管的最高點，才能產生虹吸現象把髒水通通吸走！"
      },
      {
        question: "幫水族箱換水時，我們會將裝滿水的管子，一端放入魚缸中，另一端出水口位置低於魚缸的水面，魚缸中的水就會順著管子流出。這是運用哪一種原理？",
        options: ["毛細現象", "虹吸原理", "連通管原理", "蒸發原理"],
        answer: 2,
        explanation: "管子裡裝滿水後，水會自動從高處的魚缸沿著管子流到低處，這就是好用的「虹吸原理」。"
      },
      {
        question: "小華想清理魚缸底下的糞便，下列哪一位家人的作法比較可行？",
        options: ["爺爺：將空水管一端放進魚缸，另外一端高於水面", "爸爸：將空水管一端放進魚缸，另外一端低於水面", "媽媽：將注滿水的水管一端放進魚缸，另外一端高於水面", "姑姑：將注滿水的水管一端放進魚缸，另外一端低於水面"],
        answer: 4,
        explanation: "水管裡面要先裝滿水不能有空氣，而且流出來的那頭要放得比魚缸低，水才會自己跑出來喔！"
      },
      {
        question: "兩個大小相同的A與B杯，將裝滿水的A杯墊高，接上管子與平放的B杯相接。下列哪一種接法最後流進B杯的水會最多？",
        options: ["兩杯放在平地，管子水平連接兩杯的一半高度", "B杯墊高，管子水平連接兩杯底部", "A杯墊高，利用注滿水的水管(呈倒U型)一端插至A杯最底部，另一端放入B杯", "兩杯放在平地，管子連接兩杯底部"],
        answer: 3,
        explanation: "用裝滿水的管子把墊高的 A 杯水吸出來，只要 A 杯的水面比 B 杯高，水就會一直流過去！"
      }
    ]
  },
  {
    id: "sui05",
    title: "水 連通管原理",
    category: "水",
    questions: [
      {
        question: "哥哥想知道春聯有沒有貼正，可以用哪一種方法來幫助測量？",
        options: ["在水管內裝水，利用虹吸管原理測量水平", "在透明水管內裝水，運用連通管原理測量水平", "用兩支不同粗細的吸管吸水，運用毛細現象測量水平", "在水桶內中裝水，運用蒸發原理測量水平"],
        answer: 2,
        explanation: "把裝水的水管變成 U 字型，兩邊的水面會一樣高，就能幫忙看出春聯有沒有貼歪！"
      },
      {
        question: "有一個底部相通，但上半部造型不同（有粗、有細、有彎曲形狀）的連通容器。將一些水注入後，當水位靜止時，哪一個管子裡的水面會最高？",
        options: ["最細的管子", "最粗的管子", "造型彎曲的管子", "一樣高"],
        answer: 4,
        explanation: "只要這些管子的底部是通的，不管它們長得圓的扁的，裡面的水面最後都會一樣高。"
      },
      {
        question: "在多個不同形狀且開口向上的罐子內加水（底部皆相通），下列關於容器內水位高度的敘述何者正確？",
        options: ["只有最粗的容器水位最高", "傾斜的容器水位會比較低", "所有開口向上的容器水位一樣高", "造型複雜的容器水位會最低"],
        answer: 3,
        explanation: "因為這些罐子的底下是連通的，所以水停下來的時候，大家的水面都會排得一樣高！"
      },
      {
        question: "將水倒入U型水管中後，左右兩端的水位呈現一樣高。下列關於此現象的敘述何者正確？",
        options: ["若將左端水管加粗，右端的水位高度就會高於左端", "若將左右兩端間距分開更遠，兩端的水位高度仍然維持不變(一樣高)", "若將左端水管向上提，左端的水位高度就會高於右端", "若將水管內的水量減少，兩端水位高度就會不一樣高"],
        answer: 2,
        explanation: "U型水管不管拉開多遠，只要底部有通，兩邊的水面就一定會維持一樣高。"
      },
      {
        question: "洗手台下方的管路常會做成 U 型以阻隔臭味，請問這是運用了何種原理？",
        options: ["連通管原理", "虹吸原理", "毛細現象", "沉降原理"],
        answer: 1,
        explanation: "U型水管裡會積水並且兩邊水面一樣高，這段積水剛好可以把下水道的臭味擋在外面。"
      },
      {
        question: "下列哪一個「沒有」應用到連通管原理？",
        options: ["熱水瓶外部透明板可以看到瓶內的水位", "沖水後，馬桶內部的水面會維持一定高度", "自來水廠蓋在較高的地方以利供水", "酒精燈燃燒時，酒精會順著棉芯上升"],
        answer: 4,
        explanation: "酒精順著棉線往上爬是靠小縫隙的「毛細現象」，其他三個才是讓水面一樣高的「連通管原理」。"
      }
    ]
  },
  {
    id: "dd-1-A",
    title: "大地 1 評量A",
    category: "大地",
    questions: [
      {
        question: "地球的陸地表面，覆蓋著岩石、細沙與泥土。",
        options: ["O", "X"],
        answer: 1,
        explanation: "此三者為陸地常見底質。"
      },
      {
        question: "樹木只要有充足的陽光，不需要長在泥土裡就能好好長大。",
        options: ["O", "X"],
        answer: 2,
        explanation: "植物生長需要土壤供給養分。"
      },
      {
        question: "花蓮的太魯閣國家公園，以雄偉的大理石峽谷非常出名。",
        options: ["O", "X"],
        answer: 1,
        explanation: "太魯閣以壯麗大理石崖聞名。"
      },
      {
        question: "用手摸海灘上的沙子和農田的泥土，兩者的粗細感覺完全一樣。",
        options: ["O", "X"],
        answer: 2,
        explanation: "沙粒顆粒較粗泥土較細緻。"
      },
      {
        question: "大石頭經過長年的風吹雨淋碎裂後，會慢慢變成沙子和泥土。",
        options: ["O", "X"],
        answer: 1,
        explanation: "岩石風化碎裂形成土砂。"
      },
      {
        question: "堅硬又結實的大石頭，很早以前就常常被用來當作蓋房子的材料。",
        options: ["O", "X"],
        answer: 1,
        explanation: "石材常充當築牆造屋材料。"
      },
      {
        question: "挖土機在採石場開採打碎大石頭，屬於哪一種原因造成的？",
        options: ["人類活動", "大自然力量"],
        answer: 1,
        explanation: "機械開採屬於人為作用。"
      },
      {
        question: "長在懸崖邊的樹根鑽進岩石縫裡把岩石撐破，屬於哪種原因？",
        options: ["人類活動", "大自然力量"],
        answer: 2,
        explanation: "植物根系生長屬自然作用。"
      },
      {
        question: "強風吹起沙子長年磨損岩石表面，屬於哪一種原因造成的？",
        options: ["人類活動", "大自然力量"],
        answer: 2,
        explanation: "季風吹拂為天然風化營力。"
      },
      {
        question: "大海浪不斷拍打海岸岩石衝撞出海蝕洞，屬於哪一種成因？",
        options: ["人類活動", "大自然力量"],
        answer: 2,
        explanation: "海浪沖刷屬於自然侵蝕。"
      },
      {
        question: "製作「沙漏」來計算時間，裡面主要裝的是哪一種材料？",
        options: ["堅硬石塊", "乾燥細沙", "潮濕土壤"],
        answer: 2,
        explanation: "細沙流動順暢適合作沙漏。"
      },
      {
        question: "雕刻家想要雕刻出精美的石雕作品，應該選用哪一種材料？",
        options: ["堅硬石頭", "鬆散細沙", "軟爛泥土"],
        answer: 1,
        explanation: "石材堅硬質地適合雕塑。"
      },
      {
        question: "農夫種植小白菜種子讓它發芽長大，需要種在什麼裡面？",
        options: ["光滑鵝卵石", "海邊細沙", "肥沃泥土"],
        answer: 3,
        explanation: "土壤蘊含作物生長養分。"
      },
      {
        question: "建造登山步道鋪設耐踩的階梯，最適合選用哪一種材料？",
        options: ["耐磨岩石", "海邊細沙", "鬆軟黑土"],
        answer: 1,
        explanation: "石質堅硬耐磨適合鋪路。"
      },
      {
        question: "在花園裡翻開哪裡，最容易看見蚯蚓在裡面鑽動生活？",
        options: ["鵝卵石堆", "炎熱沙灘", "濕潤泥土"],
        answer: 3,
        explanation: "蚯蚓棲居於濕潤土壤中。"
      },
      {
        question: "公園遊戲場裡讓小朋友堆沙堡玩耍的沙坑，鋪的是什麼材料？",
        options: ["尖銳碎石", "乾淨細沙", "黏稠黑土"],
        answer: 2,
        explanation: "柔軟細沙安全適合堆沙堡。"
      },
      {
        question: "下列讓岩石破碎或改變的原因中，哪一個是屬於人為因素？",
        options: ["工地重型機械開挖", "大地震強烈搖晃", "水結冰膨脹撐裂岩石", "大雨水流沖刷侵蝕"],
        answer: 1,
        explanation: "機械施工屬於人類活動。"
      },
      {
        question: "比較石頭、沙子和泥土，哪一種的顆粒最大？",
        options: ["黏土", "細沙", "石頭", "泥土"],
        answer: 3,
        explanation: "岩塊石粒體積明顯最大。"
      },
      {
        question: "幫盆栽換土時，花盆最底下鋪什麼東西最能幫助排水？",
        options: ["粗顆粒碎石", "很細的細沙", "黑色泥土", "塑膠紙片"],
        answer: 1,
        explanation: "粗碎石排水佳且阻擋泥土。"
      },
      {
        question: "關於泥土、沙子與石頭的觀察，下列哪一項敘述是正確的？",
        options: ["沙子在生活完全沒用", "用放大鏡看泥土有枯枝動植物屑", "石頭顆粒比細沙還要小", "岩石摸起來比泥土軟"],
        answer: 2,
        explanation: "土壤包含有機腐植質碎屑。"
      },
      {
        question: "在教室觀察採集回來的泥土與沙石，哪一種做法是不可以的？",
        options: ["用放大鏡觀察外觀", "用手捏摸感覺顆粒", "輕輕壓看看軟硬", "放進嘴巴品嘗味道"],
        answer: 4,
        explanation: "土壤含雜菌切勿放入口中。"
      },
      {
        question: "文章描述「海岸邊連綿起伏的壯觀沙丘」，最可能是指臺灣哪裡？",
        options: ["桃園草漯沙丘", "阿里山神木林", "太魯閣峽谷", "陽明山小油坑"],
        answer: 1,
        explanation: "草漯沙丘以海岸沙丘著稱。"
      }
    ]
  },
  {
    id: "dd-1-B",
    title: "大地 1 評量B",
    category: "大地",
    questions: [
      {
        question: "地球表面分布著石頭、細沙與土壤等不同環境。",
        options: ["O", "X"],
        answer: 1,
        explanation: "地表大多由石、沙、土構成。"
      },
      {
        question: "大自然中的堅硬岩石經過長年風化，會碎成石頭與泥沙。",
        options: ["O", "X"],
        answer: 1,
        explanation: "長年風化使岩石碎裂成泥沙。"
      },
      {
        question: "花園裡的大樹不需要土壤，也能吸到大量養分生長。",
        options: ["O", "X"],
        answer: 2,
        explanation: "土壤提供植物水分與養分。"
      },
      {
        question: "細沙和土壤的顆粒大小摸起來完全一樣，沒有差別。",
        options: ["O", "X"],
        answer: 2,
        explanation: "沙顆粒較粗，土壤較細軟。"
      },
      {
        question: "開採堅固的花崗岩等石頭，可以當作蓋房子的材料。",
        options: ["O", "X"],
        answer: 1,
        explanation: "岩石質地堅固，適合當建材。"
      },
      {
        question: "花園土壤裡只有乾燥的沙，完全不會有動植物碎屑。",
        options: ["O", "X"],
        answer: 2,
        explanation: "土壤含有水分與腐植質。"
      },
      {
        question: "怪手開鑿大石頭，這屬於人為影響還是自然因素？",
        options: ["人為影響", "自然因素影響"],
        answer: 1,
        explanation: "怪手施工純屬人為活動。"
      },
      {
        question: "植物樹根撐裂岩石，這屬於人為影響還是自然因素？",
        options: ["人為影響", "自然因素影響"],
        answer: 2,
        explanation: "植物生長屬於大自然力量。"
      },
      {
        question: "強風長年吹拂岩石，這屬於人為影響還是自然因素？",
        options: ["人為影響", "自然因素影響"],
        answer: 2,
        explanation: "風力吹拂是大自然的力量。"
      },
      {
        question: "海水海浪拍打岩石，這屬於人為影響還是自然因素？",
        options: ["人為影響", "自然因素影響"],
        answer: 2,
        explanation: "海水侵蝕是大自然的作用。"
      },
      {
        question: "地表的組成成分中，哪一種的顆粒通常最大顆？",
        options: ["菜園土壤", "海灘細沙", "堅硬石頭", "空中灰塵"],
        answer: 3,
        explanation: "石頭的顆粒比沙和土壤大。"
      },
      {
        question: "在花盆最底部鋪上一層小碎石，主要有什麼好處？",
        options: ["防止泥土流失並利於排水", "讓花盆重量變很輕", "給植物根部鮮豔顏色", "完全阻斷空氣流通"],
        answer: 1,
        explanation: "小碎石有助於排水防土流失。"
      },
      {
        question: "下列哪一種物品，是利用「細沙」的流動性來做的？",
        options: ["蓋大樓的鋼筋", "古代計時的沙漏", "發電的電線銅芯", "吸在黑板上的磁鐵"],
        answer: 2,
        explanation: "沙漏藉由沙子均勻下漏計時。"
      },
      {
        question: "農夫想要種出鮮翠的青菜，選哪一種土壤最適合？",
        options: ["海邊的高鹽分白沙", "鋪馬路的瀝青碎石", "光滑的大鵝卵石", "富含養分的鬆軟土壤"],
        answer: 4,
        explanation: "鬆軟肥沃土壤最適合蔬菜生長。"
      },
      {
        question: "在學校觀察土壤成分時，哪一種做法是絕對不可做的？",
        options: ["用手輕輕摸觸感", "用放大鏡仔細看", "放進嘴巴裡嚐嚐味道", "用托盤把土攤開看"],
        answer: 3,
        explanation: "泥土含雜菌，絕對不可放嘴裡。"
      },
      {
        question: "大自然中的蚯蚓在地底鑽洞生活，主要住在何處？",
        options: ["潮濕且鬆軟的土壤裡", "乾燥光禿的大石頭上", "陽光曝曬的熱沙漠中", "滾燙的柏油馬路中央"],
        answer: 1,
        explanation: "蚯蚓生活在潮濕肥沃的土壤。"
      },
      {
        question: "公園常設置「遊戲沙坑」給小朋友玩，主要原因？",
        options: ["沙子通電會發出彩光", "沙子顆粒細軟好塑形且安全", "沙子比水泥還要堅硬", "沙子含有劇毒能殺菌"],
        answer: 2,
        explanation: "細沙質地柔軟且易於堆疊造型。"
      },
      {
        question: "花蓮太魯閣國家公園壯麗的峽谷，主要由何種岩石構成？",
        options: ["人工水泥牆", "天然深色橡膠", "堅固的大理岩岩層", "鬆軟脆弱的沙丘堆"],
        answer: 3,
        explanation: "太魯閣以壯麗大理石岩層聞名。"
      },
      {
        question: "下列哪一種方法，最能防止陡峭山坡的泥土被雨水沖走？",
        options: ["在山坡種植樹木與草皮", "把山坡上的樹全砍光", "在山坡表面鋪滿白紙", "每天用高壓水槍沖山坡"],
        answer: 1,
        explanation: "植物根系能牢牢抓住泥土。"
      },
      {
        question: "用手指摸乾燥的細沙與菜園土壤，感覺有何不同？",
        options: ["兩者摸起來完全沒差別", "沙子比鋼刀還要尖銳", "土壤像冰塊般極度光滑", "沙子顆粒粗糙，土壤較綿軟"],
        answer: 4,
        explanation: "沙粒觸感粗，土壤細軟綿密。"
      },
      {
        question: "下列哪一種地表材料，可以直接拿來捏塑並高溫燒製成碗盤？",
        options: ["海邊的大鵝卵石", "陶土黏土", "粗粒的建築沙子", "馬路上的碎柏油塊"],
        answer: 2,
        explanation: "陶土黏土適合高溫燒製陶瓷。"
      },
      {
        question: "下列何者是岩石變成細沙與土壤的「人為因素」？",
        options: ["海水拍打岩石", "大雨沖刷土石", "植物樹根撐裂石頭", "工人用怪手開鑿巨石"],
        answer: 4,
        explanation: "工程機械開鑿屬於人為因素。"
      }
    ]
  },
  {
    id: "dd-2-A",
    title: "大地 2 評量A",
    category: "大地",
    questions: [
      {
        question: "下大雨時山路上流著混濁的泥水，說明雨水有沖刷與搬運泥沙的能力。",
        options: ["O", "X"],
        answer: 1,
        explanation: "暴雨沖蝕泥沙使溪流混濁。"
      },
      {
        question: "在大自然中，只有流動的水才會對岩石造成磨損或改變。",
        options: ["O", "X"],
        answer: 2,
        explanation: "風力與氣溫亦會侵蝕岩石。"
      },
      {
        question: "水流的沖刷和風的吹拂，是大自然改變地表外觀的主要力量。",
        options: ["O", "X"],
        answer: 1,
        explanation: "風與水持續塑造大地風貌。"
      },
      {
        question: "河床上的鵝卵石受到急流長年撞擊碰撞，形狀會越來越圓滑。",
        options: ["O", "X"],
        answer: 1,
        explanation: "流水具磨圓與搬運作用。"
      },
      {
        question: "沙丘表面漂亮的波浪狀紋路，是風吹動沙子堆積造成的。",
        options: ["O", "X"],
        answer: 1,
        explanation: "風動堆積形成沙丘波痕。"
      },
      {
        question: "大自然的各種岩石與地形景觀，幾萬年來永遠都不會改變。",
        options: ["O", "X"],
        answer: 2,
        explanation: "地貌會受營力持續風化改變。"
      },
      {
        question: "高雄月世界的泥岩地形，是只經歷一場短暫的午後雷雨沖刷出來的。",
        options: ["O", "X"],
        answer: 2,
        explanation: "為千萬年長時間沖蝕之產物。"
      },
      {
        question: "北海岸老梅綠石槽是海浪侵蝕出來的溝槽，春天會長滿綠色海藻。",
        options: ["O", "X"],
        answer: 1,
        explanation: "海蝕槽春季長滿綠海藻。"
      },
      {
        question: "下大雨能沖走泥沙，讓原本乾淨清澈的小水溝變成混濁的泥水。",
        options: ["O", "X"],
        answer: 1,
        explanation: "雨水沖蝕泥沙帶入水體。"
      },
      {
        question: "新北市石門洞的大石洞，完全是由陸地上的強風吹蝕掏空形成的。",
        options: ["O", "X"],
        answer: 2,
        explanation: "石門洞為海水侵蝕的海蝕門。"
      },
      {
        question: "在泥土堆上淋水的實驗中，可以看到泥沙順著水流流到低處堆積。",
        options: ["O", "X"],
        answer: 1,
        explanation: "流水具明顯泥沙搬運能力。"
      },
      {
        question: "受到流水沖刷形成的奇特岩石與溝槽，大多分布在接觸水流的地方。",
        options: ["O", "X"],
        answer: 1,
        explanation: "臨水處受水蝕作用最明顯。"
      },
      {
        question: "桃園的草漯沙丘，是風吹動沙子堆積形成的大自然海岸景觀。",
        options: ["O", "X"],
        answer: 1,
        explanation: "草漯為海岸風成沙丘地景。"
      },
      {
        question: "野柳的女王頭長年受到風吹雨淋與海浪侵蝕，脖子正一年比一年粗。",
        options: ["O", "X"],
        answer: 2,
        explanation: "風化侵蝕使頸部越來越細。"
      },
      {
        question: "野柳女王頭和草漯沙丘，都是受到大自然的力量慢慢形成的景觀。",
        options: ["O", "X"],
        answer: 1,
        explanation: "兩者皆屬天然地質景觀。"
      },
      {
        question: "風稜石帶有鋒利的稜角，常常是強風夾帶沙子長年磨蝕出來的。",
        options: ["O", "X"],
        answer: 1,
        explanation: "風砂磨蝕易形成風稜石。"
      },
      {
        question: "讓地表外貌和岩石形狀發生改變的自然力量包含哪些？",
        options: ["強風吹蝕", "海浪拍打", "雨水沖刷", "以上力量都有可能"],
        answer: 4,
        explanation: "風與水皆是重要地表營力。"
      },
      {
        question: "做實驗時拿水持續沖淋土堆，隨著水量變大，土堆會發生什麼變化？",
        options: ["土堆變矮且流出混濁泥水", "土堆越來越高", "水流變得很清澈", "完全沒有變化"],
        answer: 1,
        explanation: "大水沖刷帶走大量泥土。"
      },
      {
        question: "下列哪一種大自然景觀，不是由風吹侵蝕所造成的？",
        options: ["有稜有角的風稜石", "從高處往下沖的瀑布", "有起伏波紋的沙丘", "飛沙漫天的沙漠"],
        answer: 2,
        explanation: "瀑布是由高處流水侵蝕形成。"
      },
      {
        question: "下列海邊景觀中，哪一個是以前的人用雙手搬石頭堆疊建造成的？",
        options: ["蘭嶼情人洞", "澎湖七美雙心石滬", "野柳豆腐岩", "墾丁珊瑚礁岩"],
        answer: 2,
        explanation: "雙心石滬為傳統人工捕魚陷阱。"
      }
    ]
  },
  {
    id: "dd-2-B",
    title: "大地 2 評量B",
    category: "大地",
    questions: [
      {
        question: "下大雨時地表流水常帶著泥沙，所以看起來黃黃混濁。",
        options: ["O", "X"],
        answer: 1,
        explanation: "雨水沖刷泥沙讓水變混濁。"
      },
      {
        question: "大自然的地貌一旦形成後，永遠都不會再發生改變。",
        options: ["O", "X"],
        answer: 2,
        explanation: "風化與流水會持續改變地貌。"
      },
      {
        question: "海風長年吹拂沙灘，會在沙丘表面吹出美麗的風紋。",
        options: ["O", "X"],
        answer: 1,
        explanation: "風力吹動細沙堆積出紋理。"
      },
      {
        question: "野柳的女王頭奇石，是長年受到風吹、日曬和海水侵蝕形成的。",
        options: ["O", "X"],
        answer: 1,
        explanation: "風化與海蝕塑造女王頭奇景。"
      },
      {
        question: "溪水沖刷碰撞石頭，會把有稜有角的石頭磨成圓圓的鵝卵石。",
        options: ["O", "X"],
        answer: 1,
        explanation: "水流滾動碰撞磨圓了石頭。"
      },
      {
        question: "河流的上游通常水流平緩，到了下游出海口反而非常湍急。",
        options: ["O", "X"],
        answer: 2,
        explanation: "上游流速湍急，下游較平緩。"
      },
      {
        question: "高雄月世界光禿禿的特殊地形，是受到雨水長期沖蝕造成的。",
        options: ["O", "X"],
        answer: 1,
        explanation: "泥岩受雨水長期侵蝕成惡地。"
      },
      {
        question: "野柳女王頭的頸部因為長年風化，每年會逐漸變得更粗。",
        options: ["O", "X"],
        answer: 2,
        explanation: "長年風化會讓女王頭脖子變細。"
      },
      {
        question: "春天時新北老梅石槽上綠油油的，是因為石頭上長滿了海藻。",
        options: ["O", "X"],
        answer: 1,
        explanation: "春季石槽上常繁茂長滿海藻。"
      },
      {
        question: "下列哪些大自然的力量，會持續改變地表的樣貌？",
        options: ["雨水與溪流", "強勁的海風", "拍打的海浪", "以上都會改變地表"],
        answer: 4,
        explanation: "風、水與海浪皆能改變地貌。"
      },
      {
        question: "用澆水器澆土堆模擬流水，當水量愈大、流速愈快時？",
        options: ["土堆被沖刷得愈低矮", "土堆堆得愈來愈高", "土堆完全沒有任何變化", "流下來的水愈清澈"],
        answer: 1,
        explanation: "水量越大，侵蝕與搬運泥沙越多。"
      },
      {
        question: "澎湖著名的「雙心石滬」，它的形成原因是什麼？",
        options: ["海浪天然沖刷成心形", "古代先民堆砌石頭捕魚的人工設施", "風力在石壁上刮出的紋路", "火山熔岩噴發凝固成的心形"],
        answer: 2,
        explanation: "雙心石滬是傳統石砌捕魚設施。"
      },
      {
        question: "從河流上游走到下游，河床上的石頭外觀通常有何變化？",
        options: ["上游石頭全是一樣大的正方體", "上游多圓圓小鵝卵石，下游多巨大尖石", "上游多有稜角大巨石，下游多平滑小鵝卵石", "整條河流的石頭大小完全沒變"],
        answer: 3,
        explanation: "河水搬運越遠，石頭磨得越圓。"
      },
      {
        question: "海岸邊懸崖上海蝕洞與海蝕門，主要是何種力量造成的？",
        options: ["內陸沙漠大風吹拂", "高山冰川推移刮磨", "海浪長年拍打侵蝕", "人工炸藥開鑿"],
        answer: 3,
        explanation: "海浪長年拍打岩壁形成海蝕洞。"
      },
      {
        question: "在桃園草漯沙丘漫步，看到的大沙丘主要是靠什麼力量形成？",
        options: ["強勁海風吹動細沙堆積", "地下溫泉高溫噴發", "火山熔岩流動堆疊", "大地震擠壓地面隆起"],
        answer: 1,
        explanation: "強勁海風吹動細沙堆積成沙丘。"
      },
      {
        question: "暴雨後山洪滾滾而下，水流帶著大量泥沙巨石，這證明？",
        options: ["水流有強大的侵蝕與搬運力", "水流完全無法移動石頭", "泥沙在水中會自動燃燒", "水流碰到泥沙會立刻結冰"],
        answer: 1,
        explanation: "洪流具強大侵蝕與搬運能力。"
      },
      {
        question: "海邊美麗金黃的平緩沙灘，通常是由何種力量沉積形成？",
        options: ["火山噴發的滾燙黑灰", "高山雪崩滾落的冰塊", "隕石高速撞擊地面", "海浪與潮流搬運細沙堆積"],
        answer: 4,
        explanation: "海水將細沙搬運並堆積在岸邊。"
      },
      {
        question: "下列哪一種做法，最能防止海邊的沙子被強風吹走？",
        options: ["把海邊樹木全部砍掉", "在沿岸種植防風林護沙", "把沙灘上的石頭全部炸碎", "往海灘灌入大量酸水"],
        answer: 2,
        explanation: "種植防風林能固沙減緩風蝕。"
      },
      {
        question: "關於溪流對石頭的作用，下列敘述何者完全正確？",
        options: ["水流愈湍急，能搬動的石頭愈大", "水流完全沒有能力搬動泥沙", "乾旱沒水的地方最常看見大瀑布", "河流下游的流速永遠比瀑布還快"],
        answer: 1,
        explanation: "水流越急，衝力與搬動力越大。"
      },
      {
        question: "新北市著名的石門洞地景，主要是受到什麼作用形成的？",
        options: ["大風在山頂吹出的洞", "古代工人用鐵鎚敲出來的", "海浪長年沖刷侵蝕出的海蝕洞", "落雷直接劈開岩石形成的"],
        answer: 3,
        explanation: "海水長年拍打沖刷形成海蝕洞。"
      }
    ]
  },
  {
    id: "dd-3-A",
    title: "大地 3 評量A",
    category: "大地",
    questions: [
      {
        question: "地震、颱風與大水災，都屬於大自然造成的天然災害。",
        options: ["O", "X"],
        answer: 1,
        explanation: "此三者為常見之自然災害。"
      },
      {
        question: "大暴雨引發大洪水，強大的水流衝擊力可能沖倒大樹與沖斷橋梁。",
        options: ["O", "X"],
        answer: 1,
        explanation: "洪水具極大破壞性動力。"
      },
      {
        question: "大地震強烈搖晃與大洪水，都可能造成馬路坍方或橋梁毀壞。",
        options: ["O", "X"],
        answer: 1,
        explanation: "兩者皆能重創公共道路。"
      },
      {
        question: "在戶外遇到大地震時，應該趕快遠離建築物跑到空曠的安全地點。",
        options: ["O", "X"],
        answer: 1,
        explanation: "空曠處可防高空墜物砸傷。"
      },
      {
        question: "強烈颱風帶來狂風暴雨，對地表環境完全不會造成任何破壞。",
        options: ["O", "X"],
        answer: 2,
        explanation: "風雨常造成嚴重沖刷坍方。"
      },
      {
        question: "地震來臨時最重要的避難原則是「趴下、掩護、穩住」。",
        options: ["O", "X"],
        answer: 1,
        explanation: "趴下掩護穩住為標準要領。"
      },
      {
        question: "因為地震沒辦法提前預報，所以平時不需要做任何防震準備與演練。",
        options: ["O", "X"],
        answer: 2,
        explanation: "平時需有萬全演練與準備。"
      },
      {
        question: "地震劇烈搖晃的當下，在室內的人應該立刻打開大門衝出去。",
        options: ["O", "X"],
        answer: 2,
        explanation: "當下應先就地掩蔽頭部。"
      },
      {
        question: "在大樓裡遇到地震強烈搖晃時，應該趕快搭電梯下樓逃生。",
        options: ["O", "X"],
        answer: 2,
        explanation: "地震易斷電導致受困電梯。"
      },
      {
        question: "地震搖晃停止之後，應該立刻關閉廚房瓦斯爐火與總電源。",
        options: ["O", "X"],
        answer: 1,
        explanation: "關閉火源能防止次生火災。"
      },
      {
        question: "學校進行防震疏散時，要依照逃生路線和老師的指示行動。",
        options: ["O", "X"],
        answer: 1,
        explanation: "依循安全動線防踩踏推擠。"
      },
      {
        question: "地震搖晃時躲在堅固的桌子底下保護頭部，是正確安全的做法。",
        options: ["O", "X"],
        answer: 1,
        explanation: "堅實掩蔽能阻擋掉落物。"
      },
      {
        question: "進行地震避難疏散時，要記得背起平時準備好的緊急避難包。",
        options: ["O", "X"],
        answer: 1,
        explanation: "避難包備有救生維生物資。"
      },
      {
        question: "感覺到大地震劇烈搖晃時，只要躺在沙發上繼續看電視就好。",
        options: ["O", "X"],
        answer: 2,
        explanation: "應立刻找尋安全遮蔽物。"
      },
      {
        question: "街道兩旁粗壯的行道樹被整棵吹倒拔起，是屬於哪一種災害？",
        options: ["強風災害", "水災水患", "大地震"],
        answer: 1,
        explanation: "強勁陣風吹折脆弱路樹。"
      },
      {
        question: "大暴雨讓溪水暴漲沖毀跨河大橋的橋墩，屬於哪一種災害？",
        options: ["強風災害", "洪水沖刷", "地震滑動"],
        answer: 2,
        explanation: "湍急水流破壞橋墩結構。"
      },
      {
        question: "強烈的地表搖晃讓老房子龜裂倒塌，是屬於哪一種災害？",
        options: ["颱風風災", "水庫洩洪", "地震災害"],
        answer: 3,
        explanation: "強震造成建築物結構崩塌。"
      },
      {
        question: "山坡上大量泥沙石塊順著雨水滾滾沖下淹沒農田，是屬於？",
        options: ["強風吹襲", "豪雨土石流", "地層抬升"],
        answer: 2,
        explanation: "暴雨夾帶土石形成土石流。"
      },
      {
        question: "掛在高空的大型廣告招牌被吹落掉到地上，主要是什麼造成的？",
        options: ["颱風強風", "大雨沖刷", "板塊推擠"],
        answer: 1,
        explanation: "暴風破壞廣告懸掛招牌。"
      },
      {
        question: "地震過後馬路上出現長長裂痕和高低落差的斷層，是什麼造成的？",
        options: ["吹焚風", "海水漲退潮", "地震擠壓推擠"],
        answer: 3,
        explanation: "地震板塊推擠使地表斷裂。"
      },
      {
        question: "樹木粗壯的枝幹被強風吹斷掉在地上，是屬於哪一種大自然力量？",
        options: ["地熱蒸氣", "水流衝擊", "空氣風力", "地震變動"],
        answer: 3,
        explanation: "強大氣流風壓造成破壞。"
      },
      {
        question: "整理家裡的緊急地震避難包時，下列哪一種東西不適合放進去？",
        options: ["電玩遊戲機", "急救醫藥箱", "瓶裝飲用水", "手搖式手電筒"],
        answer: 1,
        explanation: "避難背包應以維生品為主。"
      },
      {
        question: "下列哪一項行動，是「地震正在發生搖晃的當下」應該做的？",
        options: ["把書架釘緊固定", "趕快就地抱頭掩蔽", "和家人討論逃生路線", "到超市採買乾糧儲存"],
        answer: 2,
        explanation: "就地抱頭掩護為震時應變。"
      },
      {
        question: "關於防震避難的常識，下列哪一項說法是錯誤的？",
        options: ["避難時要遠離玻璃窗戶", "大地震後可能還會有餘震", "防震演練是演戲不必認真", "避難包食物過期要更換"],
        answer: 3,
        explanation: "防災演練務必嚴肅認真。"
      },
      {
        question: "關於大自然的天然災害，下列哪一項敘述是不正確的？",
        options: ["大洪水不會造成任何危害", "颱風可能會吹掀鐵皮屋頂", "大地震可能使地面產生裂縫", "下大暴雨容易引發土石流"],
        answer: 1,
        explanation: "洪水會造成嚴重生命財產損失。"
      }
    ]
  },
  {
    id: "dd-3-B",
    title: "大地 3 評量B",
    category: "大地",
    questions: [
      {
        question: "常見的天然災害包括地震、颱風帶來的洪水與強風。",
        options: ["O", "X"],
        answer: 1,
        explanation: "地震、風災與水災為常見災害。"
      },
      {
        question: "大洪水夾帶大量土石奔流，可能沖毀橋樑與道路。",
        options: ["O", "X"],
        answer: 1,
        explanation: "洪水沖擊力大，會沖垮橋路。"
      },
      {
        question: "在室內遇到強烈地震時，應該立刻搭電梯下樓逃生。",
        options: ["O", "X"],
        answer: 2,
        explanation: "地震易斷電，搭電梯會被困住。"
      },
      {
        question: "地震保命三步驟的口訣是：趴下、掩護、穩住。",
        options: ["O", "X"],
        answer: 1,
        explanation: "趴下、掩護、穩住是保命動作。"
      },
      {
        question: "目前的科學技術，已經能提前一個月準確預報地震。",
        options: ["O", "X"],
        answer: 2,
        explanation: "地震發生時間目前無法長期預報。"
      },
      {
        question: "地震搖晃停止後，應先關閉瓦斯爐火並切斷電源。",
        options: ["O", "X"],
        answer: 1,
        explanation: "關閉瓦斯與電源防引發火災。"
      },
      {
        question: "家裡的緊急避難包，裡面的飲水和乾糧應定期檢查更換。",
        options: ["O", "X"],
        answer: 1,
        explanation: "物資過期會失效，應定期更新。"
      },
      {
        question: "在操場上遇到地震時，要立刻跑進大樓教室裡躲避。",
        options: ["O", "X"],
        answer: 2,
        explanation: "室外空曠處遠離掉落物最安全。"
      },
      {
        question: "地震發生時，坐電梯下樓逃生是否正確？",
        options: ["正確", "不正確"],
        answer: 2,
        explanation: "電梯斷電極易故障受困。"
      },
      {
        question: "地震搖晃停止後，關閉電源和火源是否正確？",
        options: ["正確", "不正確"],
        answer: 1,
        explanation: "關閉火源能防止發生二次火災。"
      },
      {
        question: "地震發生時，依照緊急逃生路線避難是否正確？",
        options: ["正確", "不正確"],
        answer: 1,
        explanation: "依循指示路線逃生最安全。"
      },
      {
        question: "地震發生時，躲在堅固桌子下保護頭部是否正確？",
        options: ["正確", "不正確"],
        answer: 1,
        explanation: "躲在桌下抓穩桌腳保護頭頸。"
      },
      {
        question: "地震發生時，隨身帶好緊急避難包是否正確？",
        options: ["正確", "不正確"],
        answer: 1,
        explanation: "避難包備有救命應急物資。"
      },
      {
        question: "地震發生時，不理會搖晃繼續坐在沙發看電視是否正確？",
        options: ["正確", "不正確"],
        answer: 2,
        explanation: "地震來時必須立刻尋找掩護。"
      },
      {
        question: "大馬路旁的行道樹被吹倒折斷，主要是受到何種災害？",
        options: ["水力洪水", "颱風強風", "大地震動", "地底火力"],
        answer: 2,
        explanation: "強陣風吹襲易吹倒路樹。"
      },
      {
        question: "準備地震緊急避難包時，下列哪一項「最不需要」放進去？",
        options: ["瓶裝飲用水", "小急救藥包", "備用手電筒", "電玩遊戲機"],
        answer: 4,
        explanation: "避難包應以救命急用物資為主。"
      },
      {
        question: "在室內遇到強震劇烈搖晃時，第一時間最正確的動作是？",
        options: ["立刻趴下、掩護並抓穩桌腳", "大叫並衝向大門推擠", "站在大窗戶玻璃旁往外看", "站在天花板大吊燈正下方"],
        answer: 1,
        explanation: "躲在堅固桌下保護頭頸部。"
      },
      {
        question: "下列哪一項做法，屬於平時在家的良好防震準備？",
        options: ["把臥室逃生動線用紙箱堆滿", "將沉重的大書櫃用螺絲固定在牆上", "在床頭正上方掛大片厚玻璃相框", "把滅火器鎖在找不到的櫃子裡"],
        answer: 2,
        explanation: "固定大家具可避免倒塌壓傷人。"
      },
      {
        question: "颱風過境時，街道上常出現哪種危險的風災現象？",
        options: ["廣告招牌與鐵皮被吹落", "柏油路瞬間結成萬年冰塊", "溪水完全乾掉露出大石頭", "天上掉下煮熟的香噴噴玉米"],
        answer: 1,
        explanation: "強風容易吹落懸掛的招牌。"
      },
      {
        question: "在學校參加防震演練時，大家應該抱持何種正確態度？",
        options: ["嬉皮笑臉當成遊戲打鬧", "故意用腳絆倒跑步的同學", "聽從師長指揮，確實做好掩護", "躲在廁所裡睡覺不參加"],
        answer: 3,
        explanation: "認真演練才能在災害時保命。"
      },
      {
        question: "下列何者是強烈大地震可能對地表造成的直接破壞？",
        options: ["海水溫度永遠固定零度", "空氣中的氧氣全變成黃金", "地面產生巨大裂縫或隆起錯動", "所有泥土變成草莓果醬"],
        answer: 3,
        explanation: "地殼斷層劇烈錯動使地表撕裂。"
      },
      {
        question: "在百貨公司逛街遇到地震，應該特別避開何種危險區域？",
        options: ["平坦寬敞的走道中庭", "標示清楚的安全逃生梯口", "服務台擺放宣導手冊的檯面", "大片玻璃櫥窗與大型吊燈下方"],
        answer: 4,
        explanation: "碎裂玻璃與掉落燈具極易砸傷。"
      },
      {
        question: "關於緊急避難包的擺放與準備，下列何者最正確？",
        options: ["應放在門口或容易拿到的顯眼處", "每隔三十年檢查一次即可", "裡面只需要放漫畫書與玩具", "重量至少要達到五十公斤以上"],
        answer: 1,
        explanation: "放置顯眼處便於逃生時順手取用。"
      },
      {
        question: "土石流夾帶大量泥沙巨石衝下山，其強大破壞力主要來自？",
        options: ["泥石發出的耀眼彩色光芒", "巨大泥石從高處快速衝下的強大力量", "泥石與空氣摩擦引發的爆炸", "外星人發出的神秘引力拉扯"],
        answer: 2,
        explanation: "巨量土石自高處下衝，力量非常驚人。"
      },
      {
        question: "地震保命三步驟中，用雙手最優先保護的是哪一部位？",
        options: ["腳趾頭", "手肘關節", "頭部與頸部", "手掌指甲"],
        answer: 3,
        explanation: "頭頸部為人體生命中樞首要保護。"
      }
    ]
  },
  {
    id: "dp-1-A",
    title: "燈泡 1 評量A",
    category: "燈泡",
    questions: [
      {
        question: "地球上只有太陽光能產生能量，其他東西都沒辦法產生能量。",
        options: ["O", "X"],
        answer: 2,
        explanation: "煤炭瓦斯亦能產生能量。"
      },
      {
        question: "烏龜趴在石頭上曬太陽，是藉由吸收陽光的熱量來提高體溫。",
        options: ["O", "X"],
        answer: 1,
        explanation: "變溫動物藉日曬暖和身軀。"
      },
      {
        question: "從地底湧出來熱呼呼的溫泉水，主要是受到太陽照射加熱形成的。",
        options: ["O", "X"],
        answer: 2,
        explanation: "溫泉是由地底地熱加熱形成。"
      },
      {
        question: "汽車引擎燃燒汽油釋放能量，沒辦法變成推動車輪轉動的動力。",
        options: ["O", "X"],
        answer: 2,
        explanation: "汽油能量能轉換為車行動力。"
      },
      {
        question: "燃燒煤炭把熱能轉換成電能，是現代常見的發電方式。",
        options: ["O", "X"],
        answer: 1,
        explanation: "火力發電將燃料轉換為電力。"
      },
      {
        question: "電動車把電池裡的電能轉化成動力，推動馬達讓車子前進。",
        options: ["O", "X"],
        answer: 1,
        explanation: "電動車把電能化為行車動能。"
      },
      {
        question: "電能可以轉換成各種能量，例如電扶梯帶動階梯方便人們上下樓。",
        options: ["O", "X"],
        answer: 1,
        explanation: "電能驅動手扶梯帶來便利。"
      },
      {
        question: "廚房瓦斯爐炒菜時，主要是利用瓦斯燃燒發出的強光把菜煮熟。",
        options: ["O", "X"],
        answer: 2,
        explanation: "瓦斯燃燒利用熱能烹煮食物。"
      },
      {
        question: "打開手電筒照亮黑暗的房間，主要是把電能轉換成什麼能量？",
        options: ["光能(發光)", "熱能(發熱)", "動能(旋轉)"],
        answer: 1,
        explanation: "電流通過燈絲激發光能。"
      },
      {
        question: "用電烤箱烤麵包蛋糕，主要是把電能轉換成什麼能量？",
        options: ["光能", "高溫熱能", "動力"],
        answer: 2,
        explanation: "電熱管通電轉化為熱能。"
      },
      {
        question: "插電打開電風扇讓扇葉轉動吹風，主要是把電能轉換成？",
        options: ["光能", "聲音", "機械動力"],
        answer: 3,
        explanation: "馬達通電轉動為機械動力。"
      },
      {
        question: "用電子鍋煮白米飯，主要是把電能轉換成哪一種能量？",
        options: ["光能", "熱能", "動能"],
        answer: 2,
        explanation: "電熱盤發熱將米粒蒸熟。"
      },
      {
        question: "下列哪一個是人類直接利用大自然風力的例子？",
        options: ["用地熱加熱溫泉", "張開帆布推動帆船", "燒柴火取暖", "用電磁爐煮水"],
        answer: 2,
        explanation: "帆船善用風壓作為動力推力。"
      },
      {
        question: "現代的發電方式中，哪一種能把自然界的能源轉換成電力？",
        options: ["水力發電", "風力發電", "火力燃煤發電", "以上方法都可以"],
        answer: 4,
        explanation: "水力風力燃煤皆可發電。"
      },
      {
        question: "下列哪一種生活設備和電動車一樣，都是把電能轉換成動力？",
        options: ["搭乘電梯上下樓", "書桌檯燈看書", "浴室暖風機吹熱風", "烤麵包機烤吐司"],
        answer: 1,
        explanation: "電梯馬達將電能化為提升動力。"
      },
      {
        question: "用電鍋蒸煮食物，主要是把電能轉換成什麼能量？",
        options: ["聲音能量", "高溫熱能", "水流力量", "強烈光芒"],
        answer: 2,
        explanation: "電熱圈通電產熱蒸煮食材。"
      },
      {
        question: "在海面上航行的風帆船，主要是靠什麼能源推動前進？",
        options: ["柴油引擎", "空氣流動的風力", "大容量電池", "高壓蒸氣"],
        answer: 2,
        explanation: "帆布攔截海風推動船身前行。"
      },
      {
        question: "以前農田旁旋轉的水車，主要是依靠什麼力量來帶動運轉？",
        options: ["流動的水力", "柴油發動機", "微波爐", "水上摩托車"],
        answer: 1,
        explanation: "水車利用落水位能驅動轉輪。"
      },
      {
        question: "關於家裡各種電器與設備所使用的能源，哪一項配對是正確的？",
        options: ["家用電燈→天然瓦斯", "電烤箱→家用電力", "電磁爐→柴油煤油", "瓦斯爐→自來水力"],
        answer: 2,
        explanation: "電烤箱需插接電網供電。"
      },
      {
        question: "爬在石頭上的蜥蜴，通常是靠什麼能量來讓身體暖和？",
        options: ["曬太陽吸收熱量", "汽車排氣管", "溪水流動", "風力發電機"],
        answer: 1,
        explanation: "爬蟲類藉日曬提高體溫活動。"
      },
      {
        question: "家裡的瓦斯爐能炒菜煮飯，是燃燒什麼燃料來獲得熱量？",
        options: ["純氧氣", "桶裝或天然瓦斯", "空氣水蒸氣", "二氧化碳"],
        answer: 2,
        explanation: "瓦斯氣體燃燒提供穩定熱源。"
      },
      {
        question: "溫泉區能用熱滾滾的泉水煮溫泉蛋，是利用大自然的什麼能源？",
        options: ["燒煤炭", "強風吹拂", "地底的地熱能", "潮汐能"],
        answer: 3,
        explanation: "地底岩漿釋放地熱加熱泉水。"
      },
      {
        question: "水溝旁的水車轉個不停，是利用了哪一種大自然能源？",
        options: ["流動的水力", "汽油燃燒", "太陽輻射", "電池電力"],
        answer: 1,
        explanation: "流水衝擊力促使輪葉旋轉。"
      },
      {
        question: "推動帆船在水面上破浪前進的大自然推力，主要來自於？",
        options: ["空氣流動的風力", "瓦斯氣體", "地下溫泉", "磁鐵吸力"],
        answer: 1,
        explanation: "風力提供帆船推進動能。"
      },
      {
        question: "馬路上跑的一般汽車，大部分是加什麼燃料來產生動力？",
        options: ["自來水", "汽油或柴油", "溫泉水", "太陽能板"],
        answer: 2,
        explanation: "汽柴油燃燒驅動汽車引擎。"
      }
    ]
  },
  {
    id: "dp-1-B",
    title: "燈泡 1 評量B",
    category: "燈泡",
    questions: [
      {
        question: "太陽的光和熱，是地球上生命生存最重要的能量。",
        options: ["O", "X"],
        answer: 1,
        explanation: "太陽能源源不絕滋養地球。"
      },
      {
        question: "蜥蜴或烏龜常在石頭上曬太陽，是利用太陽的熱提高體溫。",
        options: ["O", "X"],
        answer: 1,
        explanation: "曬太陽可吸收熱能提升體溫。"
      },
      {
        question: "廚房瓦斯爐煮水，是利用瓦斯燃燒產生的熱把水燒開。",
        options: ["O", "X"],
        answer: 1,
        explanation: "瓦斯燃燒產生熱能煮開水。"
      },
      {
        question: "電動車是將電池裡的電能，轉換成推動車輪前進的動力。",
        options: ["O", "X"],
        answer: 1,
        explanation: "電動馬達將電能轉為動力。"
      },
      {
        question: "水力發電是利用高處流下的湍急水流，推動發電機發電。",
        options: ["O", "X"],
        answer: 1,
        explanation: "流水落差推動發電機發電。"
      },
      {
        question: "自然界中只有太陽有能量，其他風力或煤炭完全沒有能量。",
        options: ["O", "X"],
        answer: 2,
        explanation: "風、水、化石等都蘊含能量。"
      },
      {
        question: "手電筒發光照路，主要將電能轉換成什麼？",
        options: ["光能", "熱能"],
        answer: 1,
        explanation: "手電筒通電主要發出光芒。"
      },
      {
        question: "電烤箱烤香甜麵包，主要將電能轉換成什麼？",
        options: ["光能", "熱能"],
        answer: 2,
        explanation: "電熱元件發熱烘烤食物。"
      },
      {
        question: "電風扇轉動吹出涼風，主要將電能轉換成什麼？",
        options: ["熱能", "動力"],
        answer: 2,
        explanation: "馬達帶動扇葉轉動產生風。"
      },
      {
        question: "電熱水瓶把冷水煮沸，主要將電能轉換成什麼？",
        options: ["熱能", "動力"],
        answer: 1,
        explanation: "加熱底盤發熱把水煮開。"
      },
      {
        question: "果汁機刀片高速旋轉打碎水果，主要將電能轉換成？",
        options: ["熱能", "動力"],
        answer: 2,
        explanation: "馬達提供動力帶動刀片旋轉。"
      },
      {
        question: "大樓電梯載客上下樓，主要將電能轉換成什麼？",
        options: ["光能", "動力"],
        answer: 2,
        explanation: "電梯馬達將電能轉換為動力。"
      },
      {
        question: "電視機亮起畫面並播放音樂，主要將電能轉換成？",
        options: ["光能與聲音", "水力能與風能", "汽油與地熱能", "冰凍能與磁力"],
        answer: 1,
        explanation: "電能轉為螢幕光影與揚聲器聲音。"
      },
      {
        question: "下列哪一種交通工具在行駛時，純靠人體肌肉出力？",
        options: ["普通腳踏車", "柴油大公車", "充電電動車", "燃油重型機車"],
        answer: 1,
        explanation: "腳踏車純靠人力踩踏前進。"
      },
      {
        question: "古代農村的風車磨坊，是利用何種天然能量來磨麥？",
        options: ["地底火山熱能", "空氣流動的風力", "星光的微弱反射", "雷電瞬間的電壓"],
        answer: 2,
        explanation: "風力推動巨大葉片轉動石磨。"
      },
      {
        question: "水庫讓高處水流往下衝擊水輪機來發電，這屬於何種發電？",
        options: ["火力發電", "核能發電", "水力發電", "太陽能發電"],
        answer: 3,
        explanation: "水流落差衝擊渦輪即水力發電。"
      },
      {
        question: "在野外溫泉池裡煮熟溫泉蛋，是利用了何種能量？",
        options: ["地底岩層的地熱能", "天上海鷗拍翅力", "樹木生長伸長力", "指南針的磁力能"],
        answer: 1,
        explanation: "地熱加熱地下水形成高溫溫泉。"
      },
      {
        question: "廚房裡的微波爐加熱飯菜，主要是消耗哪種能源？",
        options: ["煤炭燃料", "柴火木材", "家用電能", "自然風力"],
        answer: 3,
        explanation: "微波爐是使用電力的廚房家電。"
      },
      {
        question: "下列各種家電與能量轉換的配對，哪一組完全正確？",
        options: ["吹風機吹熱風：電能轉成熱能與動力", "手電筒發光：熱能轉成重力能", "水車旋轉：電能轉成太陽光能", "烤麵包機跳起：光能轉成冰凍能"],
        answer: 1,
        explanation: "吹風機發熱絲生熱且馬達吹風。"
      },
      {
        question: "燃油汽車在路上奔馳，是將汽油的化學能主要轉換成？",
        options: ["照亮天空的雷射光", "讓輪胎結冰的超低溫", "推動車子前進的動力", "讓車子漂浮的磁力"],
        answer: 3,
        explanation: "燃油燃燒推動引擎產生動力。"
      },
      {
        question: "媽媽用電熨斗把衣服燙得平整，最主要是利用電能轉成什麼？",
        options: ["運動的機械動力", "高溫熱能", "微弱的蜂鳴聲", "五彩的照明光芒"],
        answer: 2,
        explanation: "熨斗底板發熱撫平衣物皺褶。"
      },
      {
        question: "帆船在海面乘風破浪前進，完全不需要引擎，主要是依靠？",
        options: ["海面海風的推力", "海底水流的吸引力", "水手用手用力推水", "指南針的磁場拉力"],
        answer: 1,
        explanation: "風力吹拂風帆推動船隻前進。"
      },
      {
        question: "冬天開電暖爐取暖，最主要是將電能轉換成什麼？",
        options: ["強力的吸塵風道", "彩色的虛擬投影", "大量熱能使室內溫暖", "輕快的古典音樂"],
        answer: 3,
        explanation: "發熱元件持續釋放熱量增溫。"
      },
      {
        question: "下列哪一種電器的主要用途，是把電能轉換成「動力」？",
        options: ["電熱水瓶", "電風扇", "電烤箱", "電熨斗"],
        answer: 2,
        explanation: "電風扇馬達帶動扇葉旋轉。"
      },
      {
        question: "下列哪一種工具運作時，主要需要的能源是流動的「水力」？",
        options: ["風帆船", "電扶梯", "轉動的水車", "電烤箱"],
        answer: 3,
        explanation: "水流推動水車葉片產生動力。"
      }
    ]
  },
  {
    id: "dp-2-A",
    title: "燈泡 2 評量A",
    category: "燈泡",
    questions: [
      {
        question: "乾電池凸出來的金屬端是正極，平平的那一端是負極。",
        options: ["O", "X"],
        answer: 1,
        explanation: "凸端為正極平端為負極。"
      },
      {
        question: "電線連接燈泡的金屬螺紋、底部的接觸點與電池兩端，形成通路。",
        options: ["O", "X"],
        answer: 1,
        explanation: "形成完整迴路電流才能暢通。"
      },
      {
        question: "即使電池裡面已經完全沒有電了，只要接成通路燈泡依然會發光。",
        options: ["O", "X"],
        answer: 2,
        explanation: "缺乏電能驅動燈絲不會發光。"
      },
      {
        question: "電線、電池和燈泡正確連接成完整迴路讓燈泡發亮，稱為通路。",
        options: ["O", "X"],
        answer: 1,
        explanation: "電流畅行無阻的狀態即為通路。"
      },
      {
        question: "組裝電路時，小燈泡應該裝在燈座上，乾電池應該裝在電池盒裡。",
        options: ["O", "X"],
        answer: 2,
        explanation: "燈泡固定於燈座電池入電池盒。"
      },
      {
        question: "自製簡易開關時，中間連接導電的部分只要用橡皮筋製作即可。",
        options: ["O", "X"],
        answer: 2,
        explanation: "開關接觸點需用導電金屬製成。"
      },
      {
        question: "電線鬆脫或電路沒有接好造成燈泡不亮，稱為斷路。",
        options: ["O", "X"],
        answer: 1,
        explanation: "電流中斷不通即屬於斷路。"
      },
      {
        question: "手電筒裡面的金屬片能導電，外面的塑膠外殼可以避免觸電。",
        options: ["O", "X"],
        answer: 1,
        explanation: "金屬導電外層塑膠防觸電。"
      },
      {
        question: "辦公用的鐵迴紋針，是屬於電的導體還是不良導體？",
        options: ["電的導體(容易導電)", "電的不良導體(不易導電)"],
        answer: 1,
        explanation: "鐵金屬能輕易傳導電流。"
      },
      {
        question: "書包裡的金屬鐵尺，是屬於電的導體還是不良導體？",
        options: ["電的導體(容易導電)", "電的不良導體(不易導電)"],
        answer: 1,
        explanation: "金屬鐵尺為良好導電體。"
      },
      {
        question: "剪刀前端的金屬刀片，是屬於電的哪一種導體？",
        options: ["電的導體(容易導電)", "電的不良導體(不易導電)"],
        answer: 1,
        explanation: "鋼刃金屬易於導電流通。"
      },
      {
        question: "紙張印製的自然課本，是屬於電的導體還是不良導體？",
        options: ["電的導體(容易導電)", "電的不良導體(不易導電)"],
        answer: 2,
        explanation: "乾燥紙張不易導電為不良導體。"
      },
      {
        question: "綁便當盒的橡皮筋，是屬於電的導體還是不良導體？",
        options: ["電的導體(容易導電)", "電的不良導體(不易導電)"],
        answer: 2,
        explanation: "橡膠為優良的絕緣不良導體。"
      },
      {
        question: "擦鉛筆字的橡皮擦，是屬於電的哪一種導體？",
        options: ["電的導體(容易導電)", "電的不良導體(不易導電)"],
        answer: 2,
        explanation: "橡膠材質難以讓電流通過。"
      },
      {
        question: "家用電線外面包著塑膠皮，裡面的金屬線通常是用什麼做的？",
        options: ["銅線", "玻璃絲", "棉線", "尼龍繩"],
        answer: 1,
        explanation: "銅線延展與導電性俱佳。"
      },
      {
        question: "檢查燈泡不會亮的電路，下列哪一個一定不是燈泡不亮的原因？",
        options: ["燈泡鎢絲燒斷", "電池完全沒電", "電線外皮包著紅色塑膠", "電線沒有接好"],
        answer: 3,
        explanation: "絕緣皮顏色與導電性能無關。"
      },
      {
        question: "拆開元宵節會發光的小提燈，裡面通常不會有哪一種零件？",
        options: ["提供電力的電池", "磁鐵", "LED小燈泡", "連接的電線"],
        answer: 2,
        explanation: "發光電路不需要安裝磁鐵。"
      },
      {
        question: "下列常見的文具中，哪一個是不容易導電的「不良導體」？",
        options: ["金屬鐵夾", "鐵訂書針", "乾燥的影印紙", "金屬迴紋針"],
        answer: 3,
        explanation: "紙張阻絕電流為不良導體。"
      },
      {
        question: "組裝電路時使用燈座和電池盒，下列哪一項不是它們的優點？",
        options: ["固定零件避免電線鬆脫", "方便更換壞掉的零件", "避免金屬裸露碰在一起", "能讓電池的電量變多一倍"],
        answer: 4,
        explanation: "塑膠盒體無法提高電池容量。"
      },
      {
        question: "在電路中接上哪一種零件，可以最方便控制燈泡亮或不亮？",
        options: ["條形磁鐵", "開關", "空的燈座", "空的電池盒"],
        answer: 2,
        explanation: "開關能隨心切換通路與斷路。"
      }
    ]
  },
  {
    id: "dp-2-B",
    title: "燈泡 2 評量B",
    category: "燈泡",
    questions: [
      {
        question: "乾電池凸起的一端是正極，平坦的一端是負極。",
        options: ["O", "X"],
        answer: 1,
        explanation: "凸端為正極，平端為負極。"
      },
      {
        question: "電流通暢使燈泡正常發亮的完整迴路，稱為通路。",
        options: ["O", "X"],
        answer: 1,
        explanation: "電流暢通之完整線路為通路。"
      },
      {
        question: "電路中只要有一根電線鬆脫斷開，就稱為斷路。",
        options: ["O", "X"],
        answer: 1,
        explanation: "電路中斷無法通電即為斷路。"
      },
      {
        question: "鐵製迴紋針容易導電，在性質上屬於電的良導體。",
        options: ["O", "X"],
        answer: 1,
        explanation: "鐵金屬能輕易導電為良導體。"
      },
      {
        question: "乾燥的塑膠直尺不易導電，屬於電的不良導體。",
        options: ["O", "X"],
        answer: 1,
        explanation: "塑膠不容易導電為不良導體。"
      },
      {
        question: "電線外皮包覆塑膠，是為了絕緣並防止我們觸電。",
        options: ["O", "X"],
        answer: 1,
        explanation: "塑膠皮絕緣可避免觸電危險。"
      },
      {
        question: "鐵製圖釘是良導體還是不良導體？",
        options: ["良導體", "不良導體"],
        answer: 1,
        explanation: "鐵金屬容易導電為良導體。"
      },
      {
        question: "木製牙籤是電的良導體還是不良導體？",
        options: ["良導體", "不良導體"],
        answer: 2,
        explanation: "乾燥木材不易導電為不良導體。"
      },
      {
        question: "金屬硬幣是電的良導體還是不良導體？",
        options: ["良導體", "不良導體"],
        answer: 1,
        explanation: "金屬硬幣能良好導電為良導體。"
      },
      {
        question: "擦布橡皮擦是電的良導體還是不良導體？",
        options: ["良導體", "不良導體"],
        answer: 2,
        explanation: "橡膠不易導電為不良導體。"
      },
      {
        question: "剪刀的金屬刀刃是電的良導體還是不良導體？",
        options: ["良導體", "不良導體"],
        answer: 1,
        explanation: "金屬刀刃能導電為良導體。"
      },
      {
        question: "紙製自然課本是電的良導體還是不良導體？",
        options: ["良導體", "不良導體"],
        answer: 2,
        explanation: "紙張不易導電為不良導體。"
      },
      {
        question: "下列哪一種小物品接在電路中，可以讓燈泡亮起來？",
        options: ["塑膠原子筆管", "乾燥的衛生紙", "鐵製長尾夾", "布質球鞋鞋帶"],
        answer: 3,
        explanation: "金屬長尾夾是電的良導體。"
      },
      {
        question: "拆開傳統小燈泡，裡面通電發光發熱的細金屬絲是？",
        options: ["鎢絲", "塑膠絲", "棉繩線", "橡皮筋"],
        answer: 1,
        explanation: "小燈泡通電發光的是鎢絲。"
      },
      {
        question: "組裝電路時，使用「電池盒」與「燈泡座」的主要好處？",
        options: ["能讓一顆電池電量用不完", "能讓燈泡變成五彩顏色", "能固定零件，避免接觸不良形成斷路", "能讓小燈泡發出太陽般強光"],
        answer: 3,
        explanation: "座盒能穩固零件確保電流通暢。"
      },
      {
        question: "下列哪一種情況，會導致電路形成「斷路」燈泡不亮？",
        options: ["電線金屬芯線斷裂分開", "使用全新的飽滿乾電池", "開關切換在緊密接通位置", "所有接點都緊緊固定接觸"],
        answer: 1,
        explanation: "導線斷裂阻礙電流通過成斷路。"
      },
      {
        question: "家用電器插頭外側包覆厚橡膠或塑膠，最主要的功能是？",
        options: ["讓插頭插拔時防止觸電", "增加插頭的重量", "防止插頭表面沾染灰塵", "讓插頭在暗處自動唱歌"],
        answer: 1,
        explanation: "絕緣外殼可保護用電安全。"
      },
      {
        question: "在電路中加入下列哪一個裝置，最方便控制開燈與關燈？",
        options: ["大磁鐵", "簡易開關", "玻璃放大鏡", "小溫度計"],
        answer: 2,
        explanation: "開關能靈活切換通路與斷路。"
      },
      {
        question: "下列哪一組物品，全部都屬於「電的不良導體」？",
        options: ["鐵釘、迴紋針、銅線", "金項鍊、銀戒指、鐵尺", "金屬湯匙、鐵叉子", "乾燥白紙、塑膠墊板、橡皮擦"],
        answer: 4,
        explanation: "紙、塑膠與橡皮皆不易導電。"
      },
      {
        question: "一般的電線內部，通常會包裹哪種金屬作為導電金屬線？",
        options: ["鉛筆筆芯", "細軟羊毛", "銅線或鋁線", "乾燥木絲"],
        answer: 3,
        explanation: "銅金屬導電性優良且延展性佳。"
      }
    ]
  },
  {
    id: "dp-3-A",
    title: "燈泡 3 評量A",
    category: "燈泡",
    questions: [
      {
        question: "第一顆電池的正極連接第二顆電池的負極，稱為電池串聯。",
        options: ["O", "X"],
        answer: 1,
        explanation: "電池正負相接即為串聯。"
      },
      {
        question: "教室天花板的電燈大多採用並聯，其中一盞燈壞掉其他燈依然會亮。",
        options: ["O", "X"],
        answer: 2,
        explanation: "燈管採並聯安裝才能互不影響。"
      },
      {
        question: "兩個小燈泡接在同一條電路上一個接著一個，稱為燈泡串聯。",
        options: ["O", "X"],
        answer: 2,
        explanation: "接於同條線路上稱為串聯。"
      },
      {
        question: "兩個小燈泡分別接在不同分岔的線路上，稱為燈泡並聯。",
        options: ["O", "X"],
        answer: 2,
        explanation: "獨立分支迴路稱為燈泡並聯。"
      },
      {
        question: "串聯兩顆電池時，如果拿掉其中一顆電池，小燈泡就不會發亮。",
        options: ["O", "X"],
        answer: 1,
        explanation: "串聯一處斷開全線電流中斷。"
      },
      {
        question: "並聯越多的乾電池，小燈泡發出來的光芒就會越來越亮。",
        options: ["O", "X"],
        answer: 2,
        explanation: "電池並聯亮度不變但更持久。"
      },
      {
        question: "電路中換上電力充足的全新電池，會讓小燈泡看起來比較亮。",
        options: ["O", "X"],
        answer: 1,
        explanation: "全新電池電壓足燈泡較亮。"
      },
      {
        question: "接一顆小燈泡時，哪一種電池接法會讓小燈泡最亮？",
        options: ["兩顆電池串聯", "兩顆電池並聯"],
        answer: 1,
        explanation: "電池串聯提供加倍電壓較亮。"
      },
      {
        question: "接一顆小燈泡時，哪一種電池接法可以讓小燈泡亮最久？",
        options: ["電池串聯接法", "電池並聯接法"],
        answer: 2,
        explanation: "並聯平均分擔電量更持久。"
      },
      {
        question: "拔掉其中一顆電池後，哪一種接法的小燈泡依然會繼續發亮？",
        options: ["電池串聯接法", "電池並聯接法"],
        answer: 2,
        explanation: "並聯支路獨立仍維持供電。"
      },
      {
        question: "鬆開其中一顆電池後，哪一種接法會造成斷路讓燈泡熄滅？",
        options: ["電池串聯接法", "電池並聯接法"],
        answer: 1,
        explanation: "串聯只要缺一不可成迴路。"
      },
      {
        question: "用一顆電池接兩顆小燈泡時，哪一種接法的小燈泡比較亮？",
        options: ["兩個燈泡串聯", "兩個燈泡並聯"],
        answer: 2,
        explanation: "燈泡並聯各自分享全額電壓。"
      },
      {
        question: "轉下其中一顆小燈泡，哪一種接法的另一顆小燈泡依然會發亮？",
        options: ["燈泡串聯", "燈泡並聯"],
        answer: 2,
        explanation: "並聯各燈泡擁有獨立迴路。"
      },
      {
        question: "當其中一顆燈泡的鎢絲燒斷時，哪種接法會讓另一顆也跟著熄滅？",
        options: ["燈泡串聯", "燈泡並聯"],
        answer: 1,
        explanation: "串聯燈泡共用單一電流路徑。"
      },
      {
        question: "家裡的電燈大多是採用哪一種接法，讓每個電燈可以各自開關？",
        options: ["串聯接法", "並聯接法"],
        answer: 2,
        explanation: "並聯可獨立啟閉互不干擾。"
      },
      {
        question: "電池數量相同時，下列哪一種接法的小燈泡看起來最暗？",
        options: ["3顆燈泡串聯", "2顆燈泡並聯", "3顆燈泡並聯", "2顆燈泡串聯"],
        answer: 1,
        explanation: "燈泡串聯越多分到電壓越低。"
      },
      {
        question: "下列哪一種電池接法，能讓小燈泡發出最亮的光？",
        options: ["2顆電池並聯", "3顆電池並聯", "3顆電池串聯", "2顆電池串聯"],
        answer: 3,
        explanation: "串聯電池越多端電壓越高。"
      },
      {
        question: "4顆燈泡串聯的電路中，如果其中1顆燈泡燒壞了，結果會？",
        options: ["只有壞掉的1顆不亮", "4顆燈泡全都不會亮", "剩下的3顆依然會亮", "隨機2顆會亮"],
        answer: 2,
        explanation: "串聯斷路導致全線熄滅。"
      },
      {
        question: "4顆燈泡並聯的電路中，如果其中1顆燈泡壞掉了，結果會？",
        options: ["4顆燈泡全都不亮", "只有壞掉的1顆不亮", "2顆不亮", "3顆不亮"],
        answer: 2,
        explanation: "並聯各支線獨立供電互不影響。"
      },
      {
        question: "想要讓一顆小燈泡變得最亮，應該怎麼連接電池？",
        options: ["並聯2顆電池", "並聯3顆電池", "串聯2顆電池", "串聯3顆電池"],
        answer: 4,
        explanation: "串聯3顆電池電壓最強最亮。"
      }
    ]
  },
  {
    id: "dp-3-B",
    title: "燈泡 3 評量B",
    category: "燈泡",
    questions: [
      {
        question: "將兩顆電池的正極接負極串成一條線，稱為電池串聯。",
        options: ["O", "X"],
        answer: 1,
        explanation: "電池首尾正負相接為串聯。"
      },
      {
        question: "將兩顆燈泡分別接在兩條獨立分支上，稱為燈泡並聯。",
        options: ["O", "X"],
        answer: 1,
        explanation: "燈泡在獨立分支上為並聯。"
      },
      {
        question: "在電池串聯電路中，若一顆電池沒接好，燈泡就不會亮。",
        options: ["O", "X"],
        answer: 1,
        explanation: "串聯一處斷開整條即斷路。"
      },
      {
        question: "家裡的客廳與房間電燈大多採用並聯，關一盞不影響其他盞。",
        options: ["O", "X"],
        answer: 1,
        explanation: "並聯各電器獨立互不干擾。"
      },
      {
        question: "兩顆燈泡串聯時，只要取下一顆燈泡，另一顆仍然會亮。",
        options: ["O", "X"],
        answer: 2,
        explanation: "燈泡串聯拆一顆即形成斷路。"
      },
      {
        question: "接一顆燈泡，哪種電池接法會使燈泡比較亮？",
        options: ["電池串聯", "電池並聯"],
        answer: 1,
        explanation: "電池串聯電力疊加，燈泡較亮。"
      },
      {
        question: "接一顆燈泡，哪種電池接法能讓燈泡亮得比較持久？",
        options: ["電池串聯", "電池並聯"],
        answer: 2,
        explanation: "電池並聯分擔電流，更為持久。"
      },
      {
        question: "一顆電池沒接好時，哪種接法的燈泡依然會發亮？",
        options: ["電池串聯", "電池並聯"],
        answer: 2,
        explanation: "電池並聯各路獨立，仍能供電。"
      },
      {
        question: "一顆電池沒接好時，哪種接法的燈泡會立刻熄滅？",
        options: ["電池串聯", "電池並聯"],
        answer: 1,
        explanation: "串聯電路斷開即形成斷路。"
      },
      {
        question: "電池相同時，哪一種燈泡接法會讓燈泡比較明亮？",
        options: ["燈泡串聯", "燈泡並聯"],
        answer: 2,
        explanation: "燈泡並聯不分電壓，比較亮。"
      },
      {
        question: "一顆燈泡壞掉時，哪種接法的另一顆燈泡仍然會亮？",
        options: ["燈泡串聯", "燈泡並聯"],
        answer: 2,
        explanation: "燈泡並聯分支獨立互不影響。"
      },
      {
        question: "一顆燈泡壞掉時，哪種接法的另外一顆燈泡也不會亮？",
        options: ["燈泡串聯", "燈泡並聯"],
        answer: 1,
        explanation: "燈泡串聯在同線，壞一顆全滅。"
      },
      {
        question: "一顆燈泡接一顆電池，改串聯兩顆相同新電池後，亮度？",
        options: ["亮度明顯變亮", "完全熄滅不亮", "變得非常暗", "亮度完全沒變"],
        answer: 1,
        explanation: "電池串聯電壓提升，燈泡變亮。"
      },
      {
        question: "一顆燈泡接一顆電池，改並聯兩顆相同新電池後，亮度？",
        options: ["亮度大幅增加十倍", "亮度與接一顆電池差不多", "燈泡立刻燒毀破裂", "亮度變成原本的一半"],
        answer: 2,
        explanation: "電池並聯電壓不變，亮度相當。"
      },
      {
        question: "在電池數量固定下，將三顆相同燈泡「串聯」在一起？",
        options: ["比只接一顆燈泡時更暗", "比只接一顆燈泡時更亮", "所有燈泡立刻劇烈爆炸", "每顆燈泡亮度完全不受影響"],
        answer: 1,
        explanation: "燈泡串聯分走電壓，燈泡變暗。"
      },
      {
        question: "三顆燈泡並聯在同一電路中，其中一顆燒壞，其餘兩顆？",
        options: ["另外兩顆會立刻熄滅", "另外兩顆依然保持發亮", "另外兩顆會融化成水", "另外兩顆會變成手電筒"],
        answer: 2,
        explanation: "並聯各支路電流獨立通暢。"
      },
      {
        question: "下列哪一種裝置方式，能讓單一顆小燈泡發出「最亮」的光？",
        options: ["串聯三顆全新乾電池", "並聯三顆全新乾電池", "只接一顆舊電池", "完全不接任何電池"],
        answer: 1,
        explanation: "串聯三顆電池電壓最高最明亮。"
      },
      {
        question: "耶誕樹上的小彩燈有一顆壞掉，結果整串全滅，這是？",
        options: ["無線傳輸接法", "並聯接法", "串聯接法", "太陽能驅動接法"],
        answer: 3,
        explanation: "串聯電路只要一處斷開就全斷。"
      },
      {
        question: "教室天花板的日光燈，壞了一根其他仍亮著，這是？",
        options: ["隨意亂接", "串聯連接", "單線直串接法", "並聯連接"],
        answer: 4,
        explanation: "教室電燈採用並聯，互不干擾。"
      },
      {
        question: "想讓玩具遙控車跑得更快更有力，在安全範圍內可？",
        options: ["把電池數量減少一半", "增加電池並改為串聯", "把電池全部泡進冷水", "把電池正極和負極直接貼死"],
        answer: 2,
        explanation: "電池串聯提高電壓提供更大動力。"
      },
      {
        question: "在電路中串聯過多顆全新電池，最容易對小燈泡造成？",
        options: ["燈泡鎢絲過熱燒斷損壞", "燈泡玻璃罩結出厚霜", "燈泡自動變大十倍", "燈泡變成純金飾品"],
        answer: 1,
        explanation: "電壓過高超載容易燒毀鎢絲。"
      },
      {
        question: "下列關於串聯與並聯的比較，何者敘述完全正確？",
        options: ["燈泡並聯愈多個別必定愈暗", "電池並聯愈多總電壓成倍暴增", "並聯各路獨立，串聯一斷全斷", "串聯比並聯更適合全家電器接法"],
        answer: 3,
        explanation: "並聯各路獨立，串聯單點斷全滅。"
      },
      {
        question: "想比兩顆電池誰電力強，接相同燈泡後應如何觀察？",
        options: ["看哪一顆接上時燈泡較亮", "用手指按壓看誰比較軟", "用鼻子聞哪顆散發花香", "放在秤上看哪顆重十倍"],
        answer: 1,
        explanation: "接上燈泡越亮代表輸出電力越強。"
      }
    ]
  },
  {
    id: "dp-4-A",
    title: "燈泡 4 評量A",
    category: "燈泡",
    questions: [
      {
        question: "地球上的能源用都用不完，而且使用時絕不會造成環境汙染。",
        options: ["O", "X"],
        answer: 2,
        explanation: "化石能源有限且排放污染。"
      },
      {
        question: "夏天把冷氣溫度調到超低溫16度，是節能省電的好方法。",
        options: ["O", "X"],
        answer: 2,
        explanation: "溫度設過低會造成壓縮機耗電。"
      },
      {
        question: "埋在地底下的煤礦和石油數量有限，一直開採總有一天會用完。",
        options: ["O", "X"],
        answer: 1,
        explanation: "化石燃料屬不可再生資源。"
      },
      {
        question: "城市大停電讓馬路上的紅綠燈熄滅，容易影響行車和行人的安全。",
        options: ["O", "X"],
        answer: 1,
        explanation: "號誌失效大幅增加事故風險。"
      },
      {
        question: "騎吃汽油的機車出門，比騎腳踏車更加符合節能減碳。",
        options: ["O", "X"],
        answer: 2,
        explanation: "自行車無排煙最符合環保。"
      },
      {
        question: "家裡把傳統燈泡換成省電LED燈泡，可以達到省電節能的效果。",
        options: ["O", "X"],
        answer: 1,
        explanation: "LED耗電極低且壽命更長。"
      },
      {
        question: "多利用風力和水力等乾淨的再生能源，可以減少空氣汙染。",
        options: ["O", "X"],
        answer: 1,
        explanation: "再生綠能發電過程低污染。"
      },
      {
        question: "平時養成隨手節約能源的習慣，能讓地球上的能源用得更久。",
        options: ["O", "X"],
        answer: 1,
        explanation: "節約能源能延長資源壽命。"
      },
      {
        question: "離開教室時隨手把電燈關掉，能不能達到節約能源的效果？",
        options: ["可以節約能源", "無法節約能源"],
        answer: 1,
        explanation: "隨手關燈杜絕無謂電力浪費。"
      },
      {
        question: "到巷口的超商買東西，用走路散步代替開車，算不算是節能行為？",
        options: ["可以節約能源", "無法節約能源"],
        answer: 1,
        explanation: "步行零油耗健康又環保。"
      },
      {
        question: "買家電時挑選貼有「節能標章」的電器，能不能節省能源？",
        options: ["可以節約能源", "無法節約能源"],
        answer: 1,
        explanation: "節能電器耗電量顯著較低。"
      },
      {
        question: "出門上學多搭乘公車或捷運，能不能達到節約能源的效果？",
        options: ["可以節約能源", "無法節約能源"],
        answer: 1,
        explanation: "大眾運輸大幅降低人均油耗。"
      },
      {
        question: "到兩三層樓的地方多走樓梯少搭電梯，能不能節省電力？",
        options: ["可以節約能源", "無法節約能源"],
        answer: 1,
        explanation: "少搭短程電梯能省馬達用電。"
      },
      {
        question: "開冰箱拿東西時迅速拿好關上、減少開門次數，能不能省電？",
        options: ["可以節約能源", "無法節約能源"],
        answer: 1,
        explanation: "避免冷氣外洩減輕冷藏負擔。"
      },
      {
        question: "夏天睡覺把冷氣整晚開在18度吹，能不能達到省電節能？",
        options: ["可以節約能源", "無法節約能源"],
        answer: 2,
        explanation: "溫差過大導致耗電量倍增。"
      },
      {
        question: "只上一層樓也常常按電梯搭電梯上下樓，能不能達到節約能源？",
        options: ["可以節約能源", "無法節約能源"],
        answer: 2,
        explanation: "頻繁啟動升降馬達極度耗電。"
      },
      {
        question: "屋頂上裝太陽能板利用陽光來發電，太陽能是不是再生能源？",
        options: ["是再生能源", "不是再生能源"],
        answer: 1,
        explanation: "太陽能取之不盡屬再生能源。"
      },
      {
        question: "水庫利用流動的溪水沖動發電機的水力發電，是不是再生能源？",
        options: ["是再生能源", "不是再生能源"],
        answer: 1,
        explanation: "水循環自然循環屬於再生能。"
      },
      {
        question: "從地下礦坑挖出來的煤炭，是不是屬於再生能源？",
        options: ["是再生能源", "不是再生能源"],
        answer: 2,
        explanation: "煤炭耗盡即竭非再生資源。"
      },
      {
        question: "從大海底下油井抽出來的石油，是不是屬於再生能源？",
        options: ["是再生能源", "不是再生能源"],
        answer: 2,
        explanation: "石油形成需百萬年無法速生。"
      },
      {
        question: "當城市發生突然的大停電時，會造成生活上的什麼困擾？",
        options: ["馬路紅綠燈全部熄滅", "冰箱裡的食物壞掉", "電梯突然停住有人受困", "以上情況都有可能發生"],
        answer: 4,
        explanation: "斷電全面癱瘓各項電器設備。"
      },
      {
        question: "下列大自然提供的資源中，哪一種是沒辦法再生的能源？",
        options: ["河流水力", "地熱", "天然氣", "太陽光"],
        answer: 3,
        explanation: "天然氣為消耗性化石氣體。"
      },
      {
        question: "在日常家居生活中，下列哪一種做法沒辦法達到省電節能？",
        options: ["離開房間隨手關燈", "長時間把冷氣開在超低溫", "多搭捷運和公車出門", "選用有一級節能標章的冷氣"],
        answer: 2,
        explanation: "過低溫空調造成大量電力消耗。"
      },
      {
        question: "想要減少汽車停在路邊不熄火造成的廢氣汙染與浪費油，哪種做法最好？",
        options: ["停車等候時隨手熄火", "開車速度開得很慢很慢", "改開老舊的烏賊柴油車", "停車時引擎一直發動著"],
        answer: 1,
        explanation: "怠速熄火能減廢氣並節約汽油。"
      },
      {
        question: "下列大自然提供的資源中，哪一種屬於取之不盡、源源不絕的能源？",
        options: ["煤炭", "石油", "地底的地熱能", "天然氣"],
        answer: 3,
        explanation: "地熱為地球內部之源源熱量。"
      }
    ]
  },
  {
    id: "dp-4-B",
    title: "燈泡 4 評量B",
    category: "燈泡",
    questions: [
      {
        question: "石油與煤炭需要億萬年形成，屬於有限且不可再生能源。",
        options: ["O", "X"],
        answer: 1,
        explanation: "化石燃料儲量有限，用完無法再生。"
      },
      {
        question: "太陽能與風力能取之不盡，屬於永續利用的再生能源。",
        options: ["O", "X"],
        answer: 1,
        explanation: "大自然循環能源具備再生特性。"
      },
      {
        question: "夏天將冷氣溫度設定在16度，能達到最佳的省電效果。",
        options: ["O", "X"],
        answer: 2,
        explanation: "冷氣溫度設太低會大幅增加耗電。"
      },
      {
        question: "離開房間隨手關掉不用的照明燈，是節能的好習慣。",
        options: ["O", "X"],
        answer: 1,
        explanation: "隨手關燈能避免浪費電力。"
      },
      {
        question: "搭乘公車或捷運大眾運輸，比每個人開車更環保節能。",
        options: ["O", "X"],
        answer: 1,
        explanation: "大眾運輸能有效減少能源消耗。"
      },
      {
        question: "把家裡的傳統鎢絲燈泡換成LED燈泡，能更加省電。",
        options: ["O", "X"],
        answer: 1,
        explanation: "LED燈泡耗電量低且較省電。"
      },
      {
        question: "深層地底蘊藏的地熱能，屬於何種能源？",
        options: ["再生能源", "非再生能源"],
        answer: 1,
        explanation: "地熱能源源不絕，屬於再生能源。"
      },
      {
        question: "在地下坑道開採的煤礦，屬於何種能源？",
        options: ["再生能源", "非再生能源"],
        answer: 2,
        explanation: "煤炭開採耗盡便無法短時間再生。"
      },
      {
        question: "海底油井開採的原油石油，屬於何種能源？",
        options: ["再生能源", "非再生能源"],
        answer: 2,
        explanation: "石油儲量有限，屬於非再生能源。"
      },
      {
        question: "水庫水流落差產生的水力能，屬於何種能源？",
        options: ["再生能源", "非再生能源"],
        answer: 1,
        explanation: "水循環生生不息，屬於再生能源。"
      },
      {
        question: "平時多走樓梯少搭電梯，對於節能有何影響？",
        options: ["可節約能源", "不可節約能源"],
        answer: 1,
        explanation: "減少搭電梯能省下馬達耗電。"
      },
      {
        question: "隨意打開冰箱門發呆很久不關，對於節能有何影響？",
        options: ["可節約能源", "不可節約能源"],
        answer: 2,
        explanation: "冷氣跑掉會促使壓縮機加倍耗電。"
      },
      {
        question: "購買新電器時選有「節能標章」的，對節能有何影響？",
        options: ["可節約能源", "不可節約能源"],
        answer: 1,
        explanation: "節能標章認證電器更省電。"
      },
      {
        question: "短距離路程改用走路或騎自行車，對節能有何影響？",
        options: ["可節約能源", "不可節約能源"],
        answer: 1,
        explanation: "不消耗燃油，環保又零碳排。"
      },
      {
        question: "夏天把冷氣溫度調到最低溫，對節能有何影響？",
        options: ["可節約能源", "不可節約能源"],
        answer: 2,
        explanation: "溫度設太低會消耗大量電力。"
      },
      {
        question: "下列哪一種家庭用電習慣，最符合「節省用電」原則？",
        options: ["夏天冷氣開到最強並開著窗戶", "白天採光良好依然把大燈全開", "冷氣設定26到28度搭配電風扇", "出門玩一整週電視不關機"],
        answer: 3,
        explanation: "冷氣配風扇既涼爽又省電。"
      },
      {
        question: "下列哪一種能源大量燃燒後，最容易加劇空氣污染？",
        options: ["煤炭與石油", "風力發電能", "太陽能板", "潮汐海水能"],
        answer: 1,
        explanation: "化石燃料燃燒會排放廢氣與碳。"
      },
      {
        question: "如果在炎熱夏天遇到全城大停電，哪種情況最不可能？",
        options: ["水龍頭流出的水變成橘子汽水", "紅綠燈熄滅導致十字路口大塞車", "冰箱不冷導致生鮮魚肉臭酸", "冷氣風扇全停讓人悶熱難耐"],
        answer: 1,
        explanation: "停電絕不會改變自來水成分。"
      },
      {
        question: "下列哪一種自然界的能源，屬於「非再生能源」？",
        options: ["地下天然氣礦產", "取之不盡的太陽能", "高山豐沛的溪水力", "海邊四季吹拂的強風"],
        answer: 1,
        explanation: "天然氣儲量有限耗盡無法補充。"
      },
      {
        question: "買新冷氣時，看「能源效率分級標示」，第幾級最省電？",
        options: ["第5級（最耗電）", "第2級", "第1級（最省電）", "第4級"],
        answer: 3,
        explanation: "能源效率第1級代表最為省電。"
      },
      {
        question: "下列哪一項不是過度燃燒化石燃料帶來的環境壞處？",
        options: ["大自然動植物全都長生不老", "廢氣形成酸雨腐蝕建築", "排放溫室氣體造成地球暖化", "空中懸浮微粒引發呼吸疾病"],
        answer: 1,
        explanation: "污染會傷害健康絕不會長生不老。"
      },
      {
        question: "下列哪一項做法，最符合打造「綠能城市」的具體行動？",
        options: ["全面禁止屋頂裝設太陽能板", "推廣公共自行車與低碳電動公車", "鼓勵每個人天天開大休旅車上班", "把公園綠地全部鋪上水泥柏油"],
        answer: 2,
        explanation: "綠色大眾交通能顯著降低排碳。"
      },
      {
        question: "全家人要出門旅行一星期，最好的節電做法是什麼？",
        options: ["讓所有電視電燈持續待機開著", "用濕布緊緊包住所有插座", "拔掉不用的電器插頭或關閉開關", "把所有電器的開關全部打開"],
        answer: 3,
        explanation: "拔除插頭切斷待機電力最省電。"
      },
      {
        question: "屋頂加裝太陽能熱水器，主要是利用太陽的何種能量？",
        options: ["太陽光產生的輻射熱能", "太陽發出的細微聲音", "太陽引發的摩擦力", "太陽黑子的磁場能量"],
        answer: 1,
        explanation: "集熱板吸收太陽熱能加熱冷水。"
      },
      {
        question: "下列哪一種生活觀念，最符合「珍惜資源、愛護地球」？",
        options: ["出門不關冷氣回家才涼爽", "只要有錢繳費愛怎麼浪費都行", "吃完飯把所有碗盤連剩菜丟掉", "愛惜物品，隨手關燈與節約用水"],
        answer: 4,
        explanation: "節約資源是保護地球的公民責任。"
      },
      {
        question: "風力發電廠常設在海邊迎風處，最主要的考量是什麼？",
        options: ["海邊風力強勁且風向穩定充足", "海邊方便工程師天天抓魚吃", "海邊完全沒有陽光比較涼快", "海邊土壤能讓風車發芽長大"],
        answer: 1,
        explanation: "充足穩定的風場是風力發電首選。"
      }
    ]
  }
];