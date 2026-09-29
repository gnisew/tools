// ========================================================================
// lessons-data.js — 打字練習程式的「課程與遊戲資料」
// ------------------------------------------------------------------------
// 這個檔案只放「資料」（課程內容、注音課程、遊戲化資料骨架），
// 不放「鍵盤引擎與計分邏輯」（那些留在 HTML 內的 <script> 裡）。
// 用一般 <script src="lessons-data.js"></script> 引入、不加 type="module"，
// 這樣雙擊 HTML 檔案也能直接在瀏覽器開啟測試，不會受 CORS 限制卡住。
//
// 注意：這裡用 const 宣告的變數（LESSONS、ZHUYIN_LESSONS…等）會是
// 這個 HTML 頁面裡所有 <script> 共用的頂層變數，HTML 內的主程式
// 可以直接使用，不需要額外 import／export。
// ========================================================================

// ---------- Lesson engine：英打課程內容 ----------
// 【課程架構】「英打基礎」與「英打」現在是兩個各自獨立的大課程（對應 HTML 內 COURSES 陣列的兩個項目）：
//   ・TYPING_BASICS_LESSONS（英打基礎）－ 給完全沒學過打字、還在「找鍵」的初學者，
//     從單一指法一路累加到能打出完整單字，全部標示 level:'beginner'，
//     課程名稱前的數字 1～21 就是建議的學習順序，請依序上完。
//   ・LESSONS（英打）－ 給已經會盲打、想練字彙／句子／全鍵盤／符號與速度的人，
//     全部標示 level:'advanced'，不包含任何指法教學內容。
//     如果還沒學過打字或常常需要看鍵盤，建議先去上「英打基礎」再回來這裡練習。
// 【重新設計】英打基礎的課程改成「逐鍵累加」的階梯式編排：
//   每一課只新增 2 個鍵（左右手對稱的同一根手指），但題目裡仍會混入前面學過的所有鍵，
//   所以手指不會只記得單一個鍵，而是一直在練「從基準鍵出發去按目標鍵」的位移感。
//   chars = 這一課可能出現的所有鍵（含複習）；focus = 這一課的新鍵（出題時權重較高）。
//   display:'upper' = 目標字顯示成大寫，跟鍵帽上刻的字一致（單鍵練習階段用）。
//   順序：首排 → 首排+下排 → 三排全字母，跟一般打字教材由近到遠的原則一致。數字與運算符號另外獨立成「數字基礎」課程（見下方 NUMBER_BASICS_LESSONS）。

// 鍵位群組（依手指分組，左右手對稱一起學）
const K_HOME_INDEX  = ['f','j'];      // 食指：基準鍵（鍵帽上有凸點）
const K_HOME_MIDDLE = ['d','k'];      // 中指
const K_HOME_RING   = ['s','l'];      // 無名指
const K_HOME_PINKY  = ['a',';'];      // 小指
const K_HOME_STRETCH= ['g','h'];      // 食指往內橫移一格
const ROW_HOME = [...K_HOME_INDEX, ...K_HOME_MIDDLE, ...K_HOME_RING, ...K_HOME_PINKY, ...K_HOME_STRETCH];

const K_BOT_INDEX   = ['v','m'];      // 食指往下（F→V、J→M）
const K_BOT_MIDDLE  = ['c',','];      // 中指往下（D→C、K→,）
const K_BOT_RING    = ['x','.'];      // 無名指往下（S→X、L→.）
const K_BOT_PINKY   = ['z','/'];      // 小指往下（A→Z、;→/）
const K_BOT_STRETCH = ['b','n'];      // 食指往下再往內
const ROW_BOTTOM = [...K_BOT_INDEX, ...K_BOT_MIDDLE, ...K_BOT_RING, ...K_BOT_PINKY, ...K_BOT_STRETCH];

const K_TOP_INDEX   = ['r','u'];      // 食指往上（F→R、J→U）
const K_TOP_MIDDLE  = ['e','i'];      // 中指往上（D→E、K→I）
const K_TOP_RING    = ['w','o'];      // 無名指往上（S→W、L→O）
const K_TOP_PINKY   = ['q','p'];      // 小指往上（A→Q、;→P）
const K_TOP_STRETCH = ['t','y'];      // 食指往上再往內
const ROW_TOP = [...K_TOP_INDEX, ...K_TOP_MIDDLE, ...K_TOP_RING, ...K_TOP_PINKY, ...K_TOP_STRETCH];

// 【新增】數字排鍵位群組（給「數字基礎」課程 NUMBER_BASICS_LESSONS 使用；分階段：先中間 4 5 6，再左邊 1 2 3，再右邊 7 8 9，最後 0）
// 排法比照數字鍵盤（小算盤）的「中排→下排→上排」，先從最順手、離食指最近的中間三個數字開始。
const K_NUM_MID    = ['4','5','6'];   // 左食指 4、5；右食指 6（食指最靈活，先練）
const K_NUM_LEFT   = ['1','2','3'];   // 左手小指 1、無名指 2、中指 3
const K_NUM_RIGHT  = ['7','8','9'];   // 右食指 7、中指 8、無名指 9
const K_NUM_ZERO   = ['0'];           // 右手小指
const DIGITS_1_9   = [...K_NUM_MID, ...K_NUM_LEFT, ...K_NUM_RIGHT];
const DIGITS_ALL   = [...DIGITS_1_9, ...K_NUM_ZERO];
// 運算符號：. + - * / = ( )（+ * ( ) 要搭配 Shift；引擎會在鍵盤圖上一起高亮 Shift 鍵）
const NUM_DOT      = ['.'];           // 右手無名指（L 的正下方）
const NUM_PLUS     = ['+'];           // Shift + =（右手小指按 =）
const NUM_MINUS    = ['-'];           // 右手小指（0 的右邊）
const NUM_TIMES    = ['*'];           // Shift + 8（右手中指按 8）
const NUM_DIV      = ['/'];           // 右手小指（分號正下方）
const NUM_EQ       = ['='];           // 右手小指（- 的右邊，不用 Shift）
const NUM_LP       = ['('];           // Shift + 9（右手無名指按 9，左手小指按住 Shift）
const NUM_RP       = [')'];           // Shift + 0（右手小指按 0，左手小指按住 Shift）

const TYPING_BASICS_LESSONS = {
  // ===== 第一階段：首排 Home Row（手不離開基準位置）=====
  h1: { name:'1. 基準鍵 F J', desc:'食指找到鍵帽上的凸點，兩隻食指輪流按，先建立「手不用看也回得來」的感覺。',
        level:'beginner', group:'🏠 首排 Home Row', display:'upper', chars:[...K_HOME_INDEX], focus:K_HOME_INDEX },
  h2: { name:'2. 中指 D K', desc:'新增中指的 D、K，題目會跟 F、J 交錯出現，練習手指各按各的、不要整隻手移動。',
        level:'beginner', group:'🏠 首排 Home Row', display:'upper', chars:[...K_HOME_INDEX, ...K_HOME_MIDDLE], focus:K_HOME_MIDDLE },
  h3: { name:'3. 無名指 S L', desc:'新增無名指的 S、L。無名指最不靈活，速度慢沒關係，先求每次都按對。',
        level:'beginner', group:'🏠 首排 Home Row', display:'upper', chars:[...K_HOME_INDEX, ...K_HOME_MIDDLE, ...K_HOME_RING], focus:K_HOME_RING },
  h4: { name:'4. 小指 A ;', desc:'新增小指的 A、分號。按完立刻讓小指回到原位，不要一直懸空。',
        level:'beginner', group:'🏠 首排 Home Row', display:'upper', chars:[...K_HOME_INDEX, ...K_HOME_MIDDLE, ...K_HOME_RING, ...K_HOME_PINKY], focus:K_HOME_PINKY },
  h5: { name:'5. 食指橫移 G H', desc:'新增 G、H。只有食指往內橫移一格，其他手指留在原位不要跟著跑。',
        level:'beginner', group:'🏠 首排 Home Row', display:'upper', chars:[...ROW_HOME], focus:K_HOME_STRETCH },
  h6: { name:'6. 首排總複習', desc:'A S D F G H J K L ; 十個鍵隨機混合，確認每個鍵都能不看鍵盤按到。',
        level:'beginner', group:'🏠 首排 Home Row', display:'upper', chars:[...ROW_HOME] },
  h7: { name:'7. 首排小單字', desc:'as、ask、dad、glass… 只用首排字母組成的單字，開始練「連續按鍵」而不是單鍵。',
        level:'beginner', group:'🏠 首排 Home Row', type:'words',
        words:['as','ask','add','dad','sad','fad','gas','had','has','lad','all','fall','hall','gall',
               'flag','glad','flash','glass','salad','half','dash','lash','sash','slash','shall','lads','gals','alas','flask','shad'] },

  // ===== 第二階段：往下排（A 到 Z 那一排）=====
  b1: { name:'8. 下排 V M', desc:'食指從 F、J 往下按 V、M，按完立刻回到基準鍵。題目仍會混入首排的鍵。',
        level:'beginner', group:'⬇️ 首排＋下排', display:'upper', chars:[...ROW_HOME, ...K_BOT_INDEX], focus:K_BOT_INDEX },
  b2: { name:'9. 下排 C ,', desc:'中指從 D、K 往下按 C、逗號，注意手腕不要跟著往下壓。',
        level:'beginner', group:'⬇️ 首排＋下排', display:'upper', chars:[...ROW_HOME, ...K_BOT_INDEX, ...K_BOT_MIDDLE], focus:K_BOT_MIDDLE },
  b3: { name:'10. 下排 X .', desc:'無名指從 S、L 往下按 X、句點，這組最容易按歪，慢慢來。',
        level:'beginner', group:'⬇️ 首排＋下排', display:'upper', chars:[...ROW_HOME, ...K_BOT_INDEX, ...K_BOT_MIDDLE, ...K_BOT_RING], focus:K_BOT_RING },
  b4: { name:'11. 下排 Z /', desc:'小指從 A、分號往下按 Z、斜線，力氣小沒關係，位置對就好。',
        level:'beginner', group:'⬇️ 首排＋下排', display:'upper', chars:[...ROW_HOME, ...K_BOT_INDEX, ...K_BOT_MIDDLE, ...K_BOT_RING, ...K_BOT_PINKY], focus:K_BOT_PINKY },
  b5: { name:'12. 下排 B N', desc:'食指往下再往內按 B、N，是下排最遠的一組，按完記得回基準鍵。',
        level:'beginner', group:'⬇️ 首排＋下排', display:'upper', chars:[...ROW_HOME, ...ROW_BOTTOM], focus:K_BOT_STRETCH },
  b6: { name:'13. 首排＋下排複習', desc:'兩排二十個鍵隨機混合，練習上下移動後還能準確回到基準位置。',
        level:'beginner', group:'⬇️ 首排＋下排', display:'upper', chars:[...ROW_HOME, ...ROW_BOTTOM] },
  b7: { name:'14. 首排＋下排單字', desc:'can、hand、black… 只用這兩排字母組成的單字。',
        level:'beginner', group:'⬇️ 首排＋下排', type:'words',
        words:['can','man','van','ban','and','band','hand','land','sand','back','black','snack','cash','clash','flash',
               'bank','blank','calm','clam','scan','slam','chalk','flask','hands','sands','cans','vans','lands','shall','glands'] },

  // ===== 第三階段：往上排（A 到 Q 那一排）=====
  t1: { name:'15. 上排 R U', desc:'食指從 F、J 往上按 R、U，手指伸出去、按完收回來。',
        level:'beginner', group:'🔤 三排全字母', display:'upper', chars:[...ROW_HOME, ...ROW_BOTTOM, ...K_TOP_INDEX], focus:K_TOP_INDEX },
  t2: { name:'16. 上排 E I', desc:'中指從 D、K 往上按 E、I，這兩個是英文裡最常用的母音。',
        level:'beginner', group:'🔤 三排全字母', display:'upper', chars:[...ROW_HOME, ...ROW_BOTTOM, ...K_TOP_INDEX, ...K_TOP_MIDDLE], focus:K_TOP_MIDDLE },
  t3: { name:'17. 上排 W O', desc:'無名指從 S、L 往上按 W、O。',
        level:'beginner', group:'🔤 三排全字母', display:'upper', chars:[...ROW_HOME, ...ROW_BOTTOM, ...K_TOP_INDEX, ...K_TOP_MIDDLE, ...K_TOP_RING], focus:K_TOP_RING },
  t4: { name:'18. 上排 Q P', desc:'小指從 A、分號往上按 Q、P，是最遠也最容易按錯的一組。',
        level:'beginner', group:'🔤 三排全字母', display:'upper', chars:[...ROW_HOME, ...ROW_BOTTOM, ...K_TOP_INDEX, ...K_TOP_MIDDLE, ...K_TOP_RING, ...K_TOP_PINKY], focus:K_TOP_PINKY },
  t5: { name:'19. 上排 T Y', desc:'食指往上再往內按 T、Y，補齊上排最後兩個鍵。',
        level:'beginner', group:'🔤 三排全字母', display:'upper', chars:[...ROW_HOME, ...ROW_BOTTOM, ...ROW_TOP], focus:K_TOP_STRETCH },
  t6: { name:'20. 三排總複習', desc:'26 個字母加上常用標點全部混合，確認每個鍵都不用看鍵盤。',
        level:'beginner', group:'🔤 三排全字母', display:'upper', chars:[...ROW_HOME, ...ROW_BOTTOM, ...ROW_TOP] },
  t7: { name:'21. 簡短單字', desc:'the、and、cat、jump… 三到四個字母的常見單字，開始培養整個字一次打完的節奏。',
        level:'beginner', group:'🔤 三排全字母', type:'words',
        words:['the','and','you','are','for','was','not','but','can','all','her','him','out','see','two','who','how','now','new','day',
               'cat','dog','sun','run','top','pen','big','red','box','cup','toy','key','egg','map','bus','hat','bed','cow','pig','fox',
               'book','tree','fish','bird','jump','play','type','home','rain','star','moon','cake','park','song','blue','fast','good','love','time','word'] },
};

// ---------- 數字基礎：從「英打基礎」獨立出來的數字專用課程 ----------
// 【課程架構】對應 app.js COURSES 陣列裡 id:'digits' 的大課程，共 21 課，全部標示 level:'beginner'：
//   第一階段 數字 0–9：先練中間的 4 5 6，再練左手 1 2 3，再練右手 7 8 9，最後才是最遠的 0（排法比照數字鍵盤）。
//   第二階段 小數點與運算符號：一次只新增一個符號（. + - * / = ( )），其中 + * ( ) 要搭配 Shift。
//   第三階段 運算式：把數字與符號串成算式（小數、加減、乘除、等號、括弧），像真的在打計算題。
// 建議先把「英打基礎」前 5 課（首排基準鍵）練熟，知道雙手食指要放在 F、J，再來上這個課程。
// 課程名稱前的數字 1～21 是這個課程自己的學習順序（跟英打基礎的編號互不相干）。
const NUMBER_BASICS_LESSONS = {
  // ===== 第一階段：數字 0–9（分組累加：4 5 6 → 1 2 3 → 7 8 9 → 0）=====
  n456: { name:'1. 中間數字 4 5 6', desc:'左手食指按 4、5，右手食指按 6。這三個數字離食指最近，最容易上手，先從這裡開始。按完記得讓手指回到 F、J。',
          level:'beginner', group:'🔢 數字 0–9', display:'upper', chars:[...K_NUM_MID], focus:K_NUM_MID },
  n123: { name:'2. 左手數字 1 2 3', desc:'左手小指按 1、無名指按 2、中指按 3，題目會跟 4 5 6 交錯出現。小指與無名指比較不靈活，慢慢來、先求按對。',
          level:'beginner', group:'🔢 數字 0–9', display:'upper', chars:[...K_NUM_MID, ...K_NUM_LEFT], focus:K_NUM_LEFT },
  n789: { name:'3. 右手數字 7 8 9', desc:'右手食指按 7、中指按 8、無名指按 9。現在 1～9 全部到齊了，注意手指要從基準鍵 J、K、L 往上伸出去再收回來。',
          level:'beginner', group:'🔢 數字 0–9', display:'upper', chars:[...DIGITS_1_9], focus:K_NUM_RIGHT },
  n0:   { name:'4. 數字 0', desc:'右手小指按 0，是數字排最遠的一個鍵，很多人會誤用無名指去搆。小指伸出去按完立刻回到分號。',
          level:'beginner', group:'🔢 數字 0–9', display:'upper', chars:[...DIGITS_ALL], focus:K_NUM_ZERO },
  numbers: { name:'5. 數字 0–9 總複習', desc:'0～9 十個數字隨機混合，確認每個數字都能不看鍵盤按到。',
          level:'beginner', group:'🔢 數字 0–9', display:'upper', chars:[...DIGITS_ALL] },
  nwords: { name:'6. 數字串練習', desc:'456、2026、1024… 把數字連續打成一串，練習像打單字一樣一口氣打完整串數字。',
          level:'beginner', group:'🔢 數字 0–9', type:'words',
          words:['456','123','789','147','258','369','159','357','2580','1234','5678','9012','4567','7890','3456','1024','2026','365','100','500',
                 '1000','8080','2468','1357','9876','5432','1928','4096','3210','6789','120','850','777','404','911','2024','6666','1980','7531','3901'] },

  // ===== 第二階段：小數點與運算符號（一次只新增一個符號，題目仍混入前面學過的數字與符號）=====
  ndot: { name:'7. 小數點 .', desc:'右手無名指從 L 往下按句點（小數點）。題目會混入 0～9，練習「數字→小數點→數字」的節奏，例如 3.14。',
          level:'beginner', group:'➕ 小數點與運算符號', display:'upper', chars:[...DIGITS_ALL, ...NUM_DOT], focus:NUM_DOT },
  nplus: { name:'8. 加號 +', desc:'加號 + 在 = 鍵的上層，要用 Shift：左手小指按住 Shift，右手小指按 =。這是第一個要「兩手合作」的鍵，先按住 Shift 再按 =，放開時兩手一起放。',
          level:'beginner', group:'➕ 小數點與運算符號', display:'upper', chars:[...DIGITS_ALL, ...NUM_DOT, ...NUM_PLUS], focus:NUM_PLUS },
  nminus: { name:'9. 減號 -', desc:'減號 - 在 0 的右邊，右手小指往右上伸出去按（不用 Shift）。位置很遠，按完記得讓小指回到分號。',
          level:'beginner', group:'➕ 小數點與運算符號', display:'upper', chars:[...DIGITS_ALL, ...NUM_DOT, ...NUM_PLUS, ...NUM_MINUS], focus:NUM_MINUS },
  ntimes: { name:'10. 乘號 *', desc:'乘號 * 是 Shift + 8：左手小指按住 Shift，右手中指按 8。跟加號一樣先按住 Shift 再按數字鍵。',
          level:'beginner', group:'➕ 小數點與運算符號', display:'upper', chars:[...DIGITS_ALL, ...NUM_DOT, ...NUM_PLUS, ...NUM_MINUS, ...NUM_TIMES], focus:NUM_TIMES },
  ndiv: { name:'11. 除號 /', desc:'除號 / 在句點的右邊，右手小指往下按（不用 Shift，位置跟 ; 的正下方同一根手指）。',
          level:'beginner', group:'➕ 小數點與運算符號', display:'upper', chars:[...DIGITS_ALL, ...NUM_DOT, ...NUM_PLUS, ...NUM_MINUS, ...NUM_TIMES, ...NUM_DIV], focus:NUM_DIV },
  neq: { name:'12. 等號 =', desc:'等號 = 在減號 - 的右邊，右手小指往右上伸出去按（不用 Shift，但要注意別誤按到加號，加號要按住 Shift）。算式打完最後要按的就是它。',
          level:'beginner', group:'➕ 小數點與運算符號', display:'upper', chars:[...DIGITS_ALL, ...NUM_DOT, ...NUM_PLUS, ...NUM_MINUS, ...NUM_TIMES, ...NUM_DIV, ...NUM_EQ], focus:NUM_EQ },
  nlp: { name:'13. 左括弧 (', desc:'左括弧 ( 是 Shift + 9：左手小指按住 Shift，右手無名指按 9。括弧常常夾在數字前面，要先按住 Shift 再按 9。',
          level:'beginner', group:'➕ 小數點與運算符號', display:'upper', chars:[...DIGITS_ALL, ...NUM_DOT, ...NUM_PLUS, ...NUM_MINUS, ...NUM_TIMES, ...NUM_DIV, ...NUM_EQ, ...NUM_LP], focus:NUM_LP },
  nrp: { name:'14. 右括弧 )', desc:'右括弧 ) 是 Shift + 0：左手小指按住 Shift，右手小指按 0。右手小指同時要搆 0，是這組最吃力的一個，慢慢來。',
          level:'beginner', group:'➕ 小數點與運算符號', display:'upper', chars:[...DIGITS_ALL, ...NUM_DOT, ...NUM_PLUS, ...NUM_MINUS, ...NUM_TIMES, ...NUM_DIV, ...NUM_EQ, ...NUM_LP, ...NUM_RP], focus:NUM_RP },
  nsym: { name:'15. 運算符號總複習', desc:'0～9 加上 . + - * / = ( ) 全部混合，確認每個數字與符號都能不看鍵盤按到，特別注意 + * ( ) 的 Shift 要按得穩。',
          level:'beginner', group:'➕ 小數點與運算符號', display:'upper', chars:[...DIGITS_ALL, ...NUM_DOT, ...NUM_PLUS, ...NUM_MINUS, ...NUM_TIMES, ...NUM_DIV, ...NUM_EQ, ...NUM_LP, ...NUM_RP] },

  // ===== 第三階段：運算式（把數字與符號串成算式，像真的在打計算題）=====
  ndec: { name:'16. 小數練習', desc:'96.3、3.14、0.5… 練習打出完整的小數，重點是小數點前後手指的銜接。',
          level:'beginner', group:'🧮 運算式練習', type:'words',
          words:['3.14','96.3','0.5','2.75','10.5','100.25','7.08','36.6','0.01','99.9','4.5','12.5','8.25','1.05','60.4','5.55','72.8','0.75','15.6','9.99',
                 '23.4','58.1','6.02','47.3','0.25','88.8','1.23','45.6','7.89','50.5'] },
  naddsub: { name:'17. 加減運算式', desc:'1+2、45-19、100+50… 只用加號與減號的算式，練習「數字 → 符號 → 數字」的連續按鍵（+ 記得按住 Shift）。',
          level:'beginner', group:'🧮 運算式練習', type:'words',
          words:['1+2','5-3','12+8','45-19','7+6','30-12','100+50','64-28','9+9','81-27','15+36','72-45','8+17','90-34','23+58','6+14','50-8','37+25','66-29','18+4',
                 '104-59','25+75','48-16','99+1','13+29','57-38'] },
  nmuldiv: { name:'18. 乘除運算式', desc:'12*4、28/6、100/4… 只用乘號與除號的算式（* 記得按住 Shift）。',
          level:'beginner', group:'🧮 運算式練習', type:'words',
          words:['3*4','12*4','28/6','56/7','9*9','100/4','7*8','45/9','6*15','96/8','2*35','81/3','14*5','72/9','25*4','63/7','11*11','48/6','9*12','30/5',
                 '8*13','40/8','16*3','64/4','5*24','90/15'] },
  neqn: { name:'19. 等號算式', desc:'1+2=3、12*4=48、28/4=7… 把算式連同等號和答案一起打完，練習「打完算式 → 按 = → 打答案」的流程。',
          level:'beginner', group:'🧮 運算式練習', type:'words',
          words:['1+2=3','5-3=2','12+8=20','45-19=26','7+6=13','30-12=18','9+9=18','81-27=54','3*4=12','12*4=48','28/4=7','56/7=8','9*9=81','100/4=25','7*8=56',
                 '45/9=5','6*15=90','96/8=12','2*35=70','81/3=27','25*4=100','63/7=9','11*11=121','48/6=8','3.5+1.5=5','10-2.5=7.5','0.5*8=4','9.9+0.1=10','7.5/2.5=3','12.5*4=50'] },
  nparen: { name:'20. 括弧運算式', desc:'(1+2)*3、4*(5-2)、(12+8)/4… 括弧要成對打出，重點是左右括弧都要按住 Shift，而且括弧前後的手指要順利銜接。',
          level:'beginner', group:'🧮 運算式練習', type:'words',
          words:['(1+2)*3','4*(5-2)','(12+8)/4','(9-3)*2','2*(3+4)','(6+4)*5','(20-8)/3','5*(7-2)','(15+5)/4','3*(8+2)','(18-6)/2','(2+3)*(4+1)','(30-10)/5',
                 '7*(6-1)','(9+11)/4','8*(2+3)','(50-20)/6','(4+6)*(3-1)','12/(2+4)','100/(5+5)','(1.5+2.5)*2','(10-4)*(3+2)','9/(4-1)','(25+15)/8','6*(9-4)'] },
  nmix: { name:'21. 綜合運算式', desc:'(12+8)*2=40、3.5*(2+1)=10.5、12+34-5=41… 加減乘除、小數、括弧與等號全部混合的完整算式，是數字排的畢業挑戰。',
          level:'beginner', group:'🧮 運算式練習', type:'words',
          words:['(12+8)*2=40','3.5*(2+1)=10.5','12+34-5=41','8*7+6=62','100/4-3=22','(6+4)*(3-1)=20','2*(15+5)=40','45+27-9=63','(9-3)*(4+2)=36','7.5+2.5=10',
                 '18/(3*2)=3','120-(45+15)=60','(0.5+1.5)*4=8','96.3-12=84.3','9*9-1=80','(64/8)+20=28','4*25+10=110','(33+67)-50=50','1+2*3=7','88-8*5=48',
                 '(72/8)+9=18','15*3-20=25','200/(5*2)=20','(3.6/1.2)*2=6','50-12.5=37.5'] },
};

// ---------- 英打（英打練習 Typing Practice）：給已經會打字的人練字彙、句子、全鍵盤與速度 ----------
// 這裡不教指法，如果還不熟悉鍵盤位置、常常需要看鍵盤才能打字，
// 建議先去上「英打基礎」課程，把 21 課的指法練過一輪之後再回來這裡練習。
const LESSONS = {
  words:   { name:'常用單字 Common Words', desc:'the, and, cat, run… 等 80 個常見英文單字', level:'advanced', type:'words',
    words:['the','and','you','was','for','are','but','not','can','all',
           'get','has','him','his','how','man','new','now','old','see',
           'two','way','who','boy','did','its','let','put','say','she',
           'too','use','cat','dog','sun','red','big','run','top','job',
           'fun','pen','desk','fast','slow','jump','play','type','word','home',
           'ball','book','tree','fish','bird','frog','king','ship','lamp','door',
           'wall','rain','snow','wind','star','moon','milk','cake','rice','soup',
           'farm','park','song','ring','gold','iron','rock','sand','pink','blue'] },
  // 【新增】長單字挑戰：6～9 個字母的單字。單字夠長，太空落字才有「一整個單字落下、要一口氣打完」的感覺，
  // 預設自動套用「太空落字」（見 app.js 的 AUTO_GAME_BY_LESSON）。
  longwords: { name:'長單字挑戰 Long Words', desc:'garden, monster, picture, keyboard… 6～9 個字母的單字，一口氣打完整個字。', level:'advanced', type:'words',
    words:['garden','monster','picture','keyboard','weather','morning','kitchen','holiday','teacher','library',
           'monkey','rocket','planet','pocket','basket','window','bridge','flower','yellow','purple',
           'orange','school','friend','family','animal','summer','winter','spring','captain','dolphin',
           'penguin','giraffe','chicken','rainbow','sandwich','mountain','elephant','birthday','airplane','umbrella',
           'football','computer','chocolate','adventure','treasure','universe','galaxy','spaceship','astronaut','dinosaur'] },
  sentences: { name:'句子練習 Sentence Practice', desc:'the cat ran to the sun. 等短句', level:'advanced', type:'sentences',
    sentences:[
      'the cat ran to the sun.',
      'she can see the big dog.',
      'we play and run all day.',
      'he has a new red pen.',
      'put the cup on the desk.',
      'how did you get the job.',
      'the boy and girl play fast.',
      'let us type the word now.',
      'you can use this old key.',
      'she said the test was fun.',
      'a good friend is like a star.',
      'the sun is up and the sky is blue.',
      'we ate a big red apple today.',
      'my cat likes to jump on the bed.',
      'the dog ran fast to catch the ball.'
    ] },
  // 'all'（全鍵盤綜合）的 chars 依賴實際鍵盤上有哪些按鍵字元，
  // 這裡先放空陣列，等 HTML 主程式把鍵盤 DOM 建好之後，
  // 會自動把可用字元填進來（見 HTML 內 `LESSONS.all.chars = ...` 那一行）。
  all:     { name:'全鍵盤綜合', desc:'字母、數字與符號鍵混合練習', level:'advanced', chars: [] },
  shortcuts: { name:'常用快速鍵 Shortcuts', desc:'Ctrl+C 複製、Ctrl+V 貼上…等9個常用電腦快速鍵。Win 開頭的兩個鍵由作業系統接管，練習時「請勿實際按下去」，比出手勢後按「下一題」按鈕即可（避免跳出系統的語音輸入或截圖功能）。', level:'advanced', type:'shortcuts',
    shortcuts:[
      {keys:['ctrl','c'], label:'Ctrl + C', desc:'複製'},
      {keys:['ctrl','v'], label:'Ctrl + V', desc:'貼上'},
      {keys:['ctrl','x'], label:'Ctrl + X', desc:'剪下'},
      {keys:['ctrl','a'], label:'Ctrl + A', desc:'全選'},
      {keys:['ctrl','s'], label:'Ctrl + S', desc:'儲存'},
      {keys:['ctrl','f'], label:'Ctrl + F', desc:'尋找'},
      {keys:['ctrl','h'], label:'Ctrl + H', desc:'取代'},
      {keys:['win','h'], label:'Win + H', desc:'語音輸入', osLevel:true},
      {keys:['win','shift','s'], label:'Win + Shift + S', desc:'截圖', osLevel:true}
    ] }
};

// ---------- 注音課程（Phase 2 重新設計：從「單鍵」進到「符合真實鍵位習慣的音節」） ----------
// 【重新設計說明】原本的注音課程只有「認識鍵位」（聲符/韻符/聲調各自散練）與最後一個
// 「全鍵盤混合」（21+16+4 個符號完全隨機），這樣的「全鍵盤混合」不符合實際打注音的手感：
// 真正打字時，大多數音節是「中排（A–; 這排：ㄇㄋㄎㄑㄕㄘㄨㄜㄠㄤ）」單獨就能組成
// （書、可、貓、忙…），所以應該最先練；接著才是中排分別搭配下排、上排、數字排；
// 最後才是常用詞語與短語句子的整段輸出。
// 新的鍵位分排（跟英打鍵盤同一組實體鍵，只是刻的符號不同）：
//   中排 A S D F G H J K L ;  → ㄇ ㄋ ㄎ ㄑ ㄕ ㄘ ㄨ ㄜ ㄠ ㄤ
//   下排 Z X C V B N M , . /  → ㄈ ㄌ ㄏ ㄒ ㄖ ㄙ ㄩ ㄝ ㄡ ㄥ
//   上排 Q W E R T Y U I O P  → ㄆ ㄊ ㄍ ㄐ ㄔ ㄗ ㄧ ㄛ ㄟ ㄣ
//   數字排 1234567890-        → ㄅ ㄉ ˇ ˋ ㄓ ˊ ˙ ㄚ ㄞ ㄢ ㄦ（聲調符號也在這一排）
// 【重要】ㄓㄔㄕㄖ（翹舌）與ㄗㄘㄙ（平舌）這 7 個聲符後面接的「空韻」（业、吃、诗、日、资、次、思
// 那種不捲舌也不圓唇的音）在注音裡「不寫出任何韻符」，例如「詩」只打 ㄕ 加聲調，不會多打一個ㄧ；
// 這點在下面的音節資料裡都已經處理過，玩家練到這幾個聲符時不會被要求多按一個不存在的鍵。
const ZY_INITIALS = ['ㄅ','ㄆ','ㄇ','ㄈ','ㄉ','ㄊ','ㄋ','ㄌ','ㄍ','ㄎ','ㄏ','ㄐ','ㄑ','ㄒ','ㄓ','ㄔ','ㄕ','ㄖ','ㄗ','ㄘ','ㄙ'];
const ZY_FINALS   = ['ㄧ','ㄨ','ㄩ','ㄚ','ㄛ','ㄜ','ㄝ','ㄞ','ㄟ','ㄠ','ㄡ','ㄢ','ㄣ','ㄤ','ㄥ','ㄦ'];
const ZY_TONES    = ['ˊ','ˇ','ˋ','˙'];

// ---------- 音節組合資料（依鍵位排別，逐步疊加）----------
// 每個項目 {word, syllables} 沿用跟 ZY_WORDS 一樣的形狀，但這裡的 word 只是給維護者看的
// 拼音註記（方便日後對照鍵位），不是要對應到某個特定漢字，所以刻意不強求聲調要跟某個常用字一致，
// 只要求「這個音節本身在國語裡真的存在」，畢竟這幾課練的是「按鍵組合」而不是「認漢字」。
// 第 1～3 階段（中排單獨／中排+下排／中排+上排）先不出現聲調符號，維持「先熟悉聲符+韻符的組合手感」；
// 第 4 階段開始（中排+數字排）因為數字排本身就有聲調符號，才自然地把聲調一起帶進來，
// 之後每個階段都會持續混入聲調，不會在課名裡特別重複標注。

// 第1階段：中排（A–;）自己就能組成的音節（ㄇㄋㄎㄕㄘ + ㄨㄜㄠㄤ；ㄑ在中排內找不到搭得起來的韻符，留到之後跟ㄧ/ㄩ搭配）
const ZY_SYL_HOME = [
  {word:'mu',   syllables:[['ㄇ','ㄨ']]},
  {word:'mao',  syllables:[['ㄇ','ㄠ']]},
  {word:'mang', syllables:[['ㄇ','ㄤ']]},
  {word:'nu',   syllables:[['ㄋ','ㄨ']]},
  {word:'ne',   syllables:[['ㄋ','ㄜ']]},
  {word:'nao',  syllables:[['ㄋ','ㄠ']]},
  {word:'ku',   syllables:[['ㄎ','ㄨ']]},
  {word:'ke',   syllables:[['ㄎ','ㄜ']]},
  {word:'kao',  syllables:[['ㄎ','ㄠ']]},
  {word:'kang', syllables:[['ㄎ','ㄤ']]},
  {word:'shu',  syllables:[['ㄕ','ㄨ']]},
  {word:'she',  syllables:[['ㄕ','ㄜ']]},
  {word:'shao', syllables:[['ㄕ','ㄠ']]},
  {word:'cu',   syllables:[['ㄘ','ㄨ']]},
  {word:'cao',  syllables:[['ㄘ','ㄠ']]},
];

// 第2階段新增：中排＋下排才組得出來的音節（例如ㄑㄩ、ㄋㄩ 要靠下排的ㄩ；ㄈㄏㄌㄕㄨㄙ等要靠下排的ㄡㄥ）
const ZY_SYL_HOME_BOTTOM_NEW = [
  {word:'nv',   syllables:[['ㄋ','ㄩ']]},
  {word:'qu',   syllables:[['ㄑ','ㄩ']]},
  {word:'mou',  syllables:[['ㄇ','ㄡ']]},
  {word:'kou',  syllables:[['ㄎ','ㄡ']]},
  {word:'shou', syllables:[['ㄕ','ㄡ']]},
  {word:'meng', syllables:[['ㄇ','ㄥ']]},
  {word:'sheng',syllables:[['ㄕ','ㄥ']]},
  {word:'fu',   syllables:[['ㄈ','ㄨ']]},
  {word:'fang', syllables:[['ㄈ','ㄤ']]},
  {word:'lu',   syllables:[['ㄌ','ㄨ']]},
  {word:'le',   syllables:[['ㄌ','ㄜ']]},
  {word:'hu',   syllables:[['ㄏ','ㄨ']]},
  {word:'he',   syllables:[['ㄏ','ㄜ']]},
  {word:'hao',  syllables:[['ㄏ','ㄠ']]},
  {word:'ru',   syllables:[['ㄖ','ㄨ']]},
  {word:'su',   syllables:[['ㄙ','ㄨ']]},
];

// 第3階段新增：中排＋上排（上排補上ㄧㄛㄟㄣ，以及ㄆㄊㄍㄐㄔㄗ這幾個聲符）
const ZY_SYL_HOME_TOP_NEW = [
  {word:'mi',   syllables:[['ㄇ','ㄧ']]},
  {word:'ni',   syllables:[['ㄋ','ㄧ']]},
  {word:'qi',   syllables:[['ㄑ','ㄧ']]},
  {word:'mei',  syllables:[['ㄇ','ㄟ']]},
  {word:'gao',  syllables:[['ㄍ','ㄠ']]},
  {word:'ge',   syllables:[['ㄍ','ㄜ']]},
  {word:'tang', syllables:[['ㄊ','ㄤ']]},
  {word:'chao', syllables:[['ㄔ','ㄠ']]},
  {word:'zang', syllables:[['ㄗ','ㄤ']]},
  {word:'pu',   syllables:[['ㄆ','ㄨ']]},
  {word:'tu',   syllables:[['ㄊ','ㄨ']]},
  {word:'gu',   syllables:[['ㄍ','ㄨ']]},
  {word:'chu',  syllables:[['ㄔ','ㄨ']]},
  {word:'zu',   syllables:[['ㄗ','ㄨ']]},
  {word:'pi',   syllables:[['ㄆ','ㄧ']]},
  {word:'ti',   syllables:[['ㄊ','ㄧ']]},
];

// 第4階段新增：中排＋數字排。數字排除了ㄅㄉㄓㄚㄞㄢ之外還有聲調，這裡開始正式把聲調帶進音節
const ZY_SYL_HOME_NUM_NEW = [
  {word:'ma',    syllables:[['ㄇ','ㄚ']]},
  {word:'mai3',  syllables:[['ㄇ','ㄞ','ˇ']]},
  {word:'nan2',  syllables:[['ㄋ','ㄢ','ˊ']]},
  {word:'na4',   syllables:[['ㄋ','ㄚ','ˋ']]},
  {word:'kai',   syllables:[['ㄎ','ㄞ']]},
  {word:'kan4',  syllables:[['ㄎ','ㄢ','ˋ']]},
  {word:'shan',  syllables:[['ㄕ','ㄢ']]},
  {word:'shai4', syllables:[['ㄕ','ㄞ','ˋ']]},
  {word:'cai4',  syllables:[['ㄘ','ㄞ','ˋ']]},
  {word:'can',   syllables:[['ㄘ','ㄢ']]},
  {word:'bu4',   syllables:[['ㄅ','ㄨ','ˋ']]},
  {word:'bao',   syllables:[['ㄅ','ㄠ']]},
  {word:'du2',   syllables:[['ㄉ','ㄨ','ˊ']]},
  {word:'zhu4',  syllables:[['ㄓ','ㄨ','ˋ']]},
  {word:'zhe4',  syllables:[['ㄓ','ㄜ','ˋ']]},
  {word:'zhang', syllables:[['ㄓ','ㄤ']]},
];

// 第5階段新增：下排＋上排（聲調持續混入，不再於課名重複標注）
const ZY_SYL_BOTTOM_TOP_NEW = [
  {word:'fo2',   syllables:[['ㄈ','ㄛ','ˊ']]},
  {word:'fei',   syllables:[['ㄈ','ㄟ']]},
  {word:'fen',   syllables:[['ㄈ','ㄣ']]},
  {word:'li3',   syllables:[['ㄌ','ㄧ','ˇ']]},
  {word:'lei4',  syllables:[['ㄌ','ㄟ','ˋ']]},
  {word:'hei',   syllables:[['ㄏ','ㄟ']]},
  {word:'hen3',  syllables:[['ㄏ','ㄣ','ˇ']]},
  {word:'xi',    syllables:[['ㄒ','ㄧ']]},
  {word:'ren2',  syllables:[['ㄖ','ㄣ','ˊ']]},
  {word:'peng2', syllables:[['ㄆ','ㄥ','ˊ']]},
  {word:'tou2',  syllables:[['ㄊ','ㄡ','ˊ']]},
  {word:'gou3',  syllables:[['ㄍ','ㄡ','ˇ']]},
  {word:'ju',    syllables:[['ㄐ','ㄩ']]},
  {word:'chou',  syllables:[['ㄔ','ㄡ']]},
  {word:'zou3',  syllables:[['ㄗ','ㄡ','ˇ']]},
  {word:'sen',   syllables:[['ㄙ','ㄣ']]},
];

// 第6階段新增：下排＋數字排
const ZY_SYL_BOTTOM_NUM_NEW = [
  {word:'fa3',    syllables:[['ㄈ','ㄚ','ˇ']]},
  {word:'fan4',   syllables:[['ㄈ','ㄢ','ˋ']]},
  {word:'lai2',   syllables:[['ㄌ','ㄞ','ˊ']]},
  {word:'lan2',   syllables:[['ㄌ','ㄢ','ˊ']]},
  {word:'hai3',   syllables:[['ㄏ','ㄞ','ˇ']]},
  {word:'han4',   syllables:[['ㄏ','ㄢ','ˋ']]},
  {word:'ran2',   syllables:[['ㄖ','ㄢ','ˊ']]},
  {word:'san',    syllables:[['ㄙ','ㄢ']]},
  {word:'dou',    syllables:[['ㄉ','ㄡ']]},
  {word:'zhou',   syllables:[['ㄓ','ㄡ']]},
  {word:'deng',   syllables:[['ㄉ','ㄥ']]},
  {word:'zheng4', syllables:[['ㄓ','ㄥ','ˋ']]},
];

// 第7階段新增：上排＋數字排（練完這一組，四排的聲符／韻符就都練過一輪了）
const ZY_SYL_TOP_NUM_NEW = [
  {word:'pa4',  syllables:[['ㄆ','ㄚ','ˋ']]},
  {word:'pai',  syllables:[['ㄆ','ㄞ']]},
  {word:'pan2', syllables:[['ㄆ','ㄢ','ˊ']]},
  {word:'ta',   syllables:[['ㄊ','ㄚ']]},
  {word:'tai4', syllables:[['ㄊ','ㄞ','ˋ']]},
  {word:'gai',  syllables:[['ㄍ','ㄞ']]},
  {word:'cha2', syllables:[['ㄔ','ㄚ','ˊ']]},
  {word:'zai4', syllables:[['ㄗ','ㄞ','ˋ']]},
  {word:'bi3',  syllables:[['ㄅ','ㄧ','ˇ']]},
  {word:'bo',   syllables:[['ㄅ','ㄛ']]},
  {word:'bei4', syllables:[['ㄅ','ㄟ','ˋ']]},
  {word:'di4',  syllables:[['ㄉ','ㄧ','ˋ']]},
  {word:'di3',  syllables:[['ㄉ','ㄧ','ˇ']]},
  {word:'zhen', syllables:[['ㄓ','ㄣ']]},
];

// 第8階段（全鍵盤綜合）新增：真正常見、需要「聲符＋介音＋韻符＋聲調」四個符號、
// 橫跨好幾排鍵位的完整音節，練到這裡才算真正貼近平常打注音的手感
const ZY_SYL_ALL_NEW = [
  {word:'jiao4',  syllables:[['ㄐ','ㄧ','ㄠ','ˋ']]},
  {word:'xiang3', syllables:[['ㄒ','ㄧ','ㄤ','ˇ']]},
  {word:'qian2',  syllables:[['ㄑ','ㄧ','ㄢ','ˊ']]},
  {word:'xue2',   syllables:[['ㄒ','ㄩ','ㄝ','ˊ']]},
  {word:'jia',    syllables:[['ㄐ','ㄧ','ㄚ']]},
  {word:'xie4',   syllables:[['ㄒ','ㄧ','ㄝ','ˋ']]},
  {word:'guo2',   syllables:[['ㄍ','ㄨ','ㄛ','ˊ']]},
  {word:'hua4',   syllables:[['ㄏ','ㄨ','ㄚ','ˋ']]},
  {word:'xiao3',  syllables:[['ㄒ','ㄧ','ㄠ','ˇ']]},
  {word:'tian',   syllables:[['ㄊ','ㄧ','ㄢ']]},
  {word:'niao3',  syllables:[['ㄋ','ㄧ','ㄠ','ˇ']]},
  {word:'yao4',   syllables:[['ㄧ','ㄠ','ˋ']]},
  {word:'wo3',    syllables:[['ㄨ','ㄛ','ˇ']]},
  {word:'ni3',    syllables:[['ㄋ','ㄧ','ˇ']]},
];

// 累加型的課程內容池：每一階段＝前面所有階段＋這一階段新增的音節，
// 讓玩家在學新排的同時持續複習舊排，跟英打基礎（TYPING_BASICS_LESSONS）同一個設計邏輯
const ZY_SYL_STAGE1 = [...ZY_SYL_HOME];
const ZY_SYL_STAGE2 = [...ZY_SYL_STAGE1, ...ZY_SYL_HOME_BOTTOM_NEW];
const ZY_SYL_STAGE3 = [...ZY_SYL_STAGE2, ...ZY_SYL_HOME_TOP_NEW];
const ZY_SYL_STAGE4 = [...ZY_SYL_STAGE3, ...ZY_SYL_HOME_NUM_NEW];
const ZY_SYL_STAGE5 = [...ZY_SYL_STAGE4, ...ZY_SYL_BOTTOM_TOP_NEW];
const ZY_SYL_STAGE6 = [...ZY_SYL_STAGE5, ...ZY_SYL_BOTTOM_NUM_NEW];
const ZY_SYL_STAGE7 = [...ZY_SYL_STAGE6, ...ZY_SYL_TOP_NUM_NEW];
const ZY_SYL_STAGE8 = [...ZY_SYL_STAGE7, ...ZY_SYL_ALL_NEW];
const ZY_WORDS = [
  { word:'你好',   syllables:[['ㄋ','ㄧ','ˇ'],['ㄏ','ㄠ','ˇ']] },
  { word:'謝謝',   syllables:[['ㄒ','ㄧ','ㄝ','ˋ'],['ㄒ','ㄧ','ㄝ','ˋ']] },
  { word:'早安',   syllables:[['ㄗ','ㄠ','ˇ'],['ㄢ']] },
  { word:'晚安',   syllables:[['ㄨ','ㄢ','ˇ'],['ㄢ']] },
  { word:'再見',   syllables:[['ㄗ','ㄞ','ˋ'],['ㄐ','ㄧ','ㄢ','ˋ']] },
  { word:'老師',   syllables:[['ㄌ','ㄠ','ˇ'],['ㄕ']] },
  { word:'同學',   syllables:[['ㄊ','ㄨ','ㄥ','ˊ'],['ㄒ','ㄩ','ㄝ','ˊ']] },
  { word:'朋友',   syllables:[['ㄆ','ㄥ','ˊ'],['ㄧ','ㄡ','ˇ']] },
  { word:'家人',   syllables:[['ㄐ','ㄧ','ㄚ'],['ㄖ','ㄣ','ˊ']] },
  { word:'爸爸',   syllables:[['ㄅ','ㄚ','ˋ'],['ㄅ','ㄚ']] },
  { word:'媽媽',   syllables:[['ㄇ','ㄚ'],['ㄇ','ㄚ']] },
  { word:'哥哥',   syllables:[['ㄍ','ㄜ'],['ㄍ','ㄜ']] },
  { word:'姐姐',   syllables:[['ㄐ','ㄧ','ㄝ','ˇ'],['ㄐ','ㄧ','ㄝ']] },
  { word:'弟弟',   syllables:[['ㄉ','ㄧ','ˋ'],['ㄉ','ㄧ']] },
  { word:'妹妹',   syllables:[['ㄇ','ㄟ','ˋ'],['ㄇ','ㄟ']] },
  { word:'學生',   syllables:[['ㄒ','ㄩ','ㄝ','ˊ'],['ㄕ','ㄥ']] },
  { word:'老闆',   syllables:[['ㄌ','ㄠ','ˇ'],['ㄅ','ㄢ','ˇ']] },
  { word:'星期',   syllables:[['ㄒ','ㄧ','ㄥ'],['ㄑ','ㄧ','ˊ']] },
  { word:'學校',   syllables:[['ㄒ','ㄩ','ㄝ','ˊ'],['ㄒ','ㄧ','ㄠ','ˋ']] },
  { word:'老虎',   syllables:[['ㄌ','ㄠ','ˇ'],['ㄏ','ㄨ','ˇ']] },
  { word:'蘋果',   syllables:[['ㄆ','ㄧ','ㄥ','ˊ'],['ㄍ','ㄨ','ㄛ','ˇ']] },
  { word:'香蕉',   syllables:[['ㄒ','ㄧ','ㄤ'],['ㄐ','ㄧ','ㄠ']] },
  { word:'太陽',   syllables:[['ㄊ','ㄞ','ˋ'],['ㄧ','ㄤ','ˊ']] },
  { word:'月亮',   syllables:[['ㄩ','ㄝ','ˋ'],['ㄌ','ㄧ','ㄤ','ˋ']] },
  { word:'電腦',   syllables:[['ㄉ','ㄧ','ㄢ','ˋ'],['ㄋ','ㄠ','ˇ']] },
  { word:'手機',   syllables:[['ㄕ','ㄡ','ˇ'],['ㄐ','ㄧ']] },
  { word:'快樂',   syllables:[['ㄎ','ㄨ','ㄞ','ˋ'],['ㄌ','ㄜ','ˋ']] },
  { word:'生日',   syllables:[['ㄕ','ㄥ'],['ㄖ','ˋ']] },
  { word:'禮物',   syllables:[['ㄌ','ㄧ','ˇ'],['ㄨ','ˋ']] },
  { word:'天空',   syllables:[['ㄊ','ㄧ','ㄢ'],['ㄎ','ㄨ','ㄥ']] },
  { word:'海洋',   syllables:[['ㄏ','ㄞ','ˇ'],['ㄧ','ㄤ','ˊ']] },
  { word:'森林',   syllables:[['ㄙ','ㄣ'],['ㄌ','ㄧ','ㄣ','ˊ']] },
  { word:'花園',   syllables:[['ㄏ','ㄨ','ㄚ'],['ㄩ','ㄢ','ˊ']] },
  { word:'圖書館', syllables:[['ㄊ','ㄨ','ˊ'],['ㄕ','ㄨ'],['ㄍ','ㄨ','ㄢ','ˇ']] },
  { word:'醫院',   syllables:[['ㄧ'],['ㄩ','ㄢ','ˋ']] },
  { word:'公車',   syllables:[['ㄍ','ㄨ','ㄥ'],['ㄔ','ㄜ']] },
  { word:'火車',   syllables:[['ㄏ','ㄨ','ㄛ','ˇ'],['ㄔ','ㄜ']] },
  { word:'飛機',   syllables:[['ㄈ','ㄟ'],['ㄐ','ㄧ']] },
  { word:'音樂',   syllables:[['ㄧ','ㄣ'],['ㄩ','ㄝ','ˋ']] }
];
const ZY_SENTENCES = [
  { sentence:'我愛你',     syllables:[['ㄨ','ㄛ','ˇ'],['ㄞ','ˋ'],['ㄋ','ㄧ','ˇ']] },
  { sentence:'我很好',     syllables:[['ㄨ','ㄛ','ˇ'],['ㄏ','ㄣ','ˇ'],['ㄏ','ㄠ','ˇ']] },
  { sentence:'你是誰',     syllables:[['ㄋ','ㄧ','ˇ'],['ㄕ','ˋ'],['ㄕ','ㄟ','ˊ']] },
  { sentence:'天氣很好',   syllables:[['ㄊ','ㄧ','ㄢ'],['ㄑ','ㄧ','ˋ'],['ㄏ','ㄣ','ˇ'],['ㄏ','ㄠ','ˇ']] },
  { sentence:'我要回家',   syllables:[['ㄨ','ㄛ','ˇ'],['ㄧ','ㄠ','ˋ'],['ㄏ','ㄨ','ㄟ','ˊ'],['ㄐ','ㄧ','ㄚ']] },
  { sentence:'謝謝老師',   syllables:[['ㄒ','ㄧ','ㄝ','ˋ'],['ㄒ','ㄧ','ㄝ'],['ㄌ','ㄠ','ˇ'],['ㄕ']] },
  { sentence:'今天星期五', syllables:[['ㄐ','ㄧ','ㄣ'],['ㄊ','ㄧ','ㄢ'],['ㄒ','ㄧ','ㄥ'],['ㄑ','ㄧ','ˊ'],['ㄨ','ˇ']] },
  { sentence:'我想睡覺',   syllables:[['ㄨ','ㄛ','ˇ'],['ㄒ','ㄧ','ㄤ','ˇ'],['ㄕ','ㄨ','ㄟ','ˋ'],['ㄐ','ㄧ','ㄠ','ˋ']] },
  { sentence:'我在家裡看書', syllables:[['ㄨ','ㄛ','ˇ'],['ㄗ','ㄞ','ˋ'],['ㄐ','ㄧ','ㄚ'],['ㄌ','ㄧ','ˇ'],['ㄎ','ㄢ','ˋ'],['ㄕ','ㄨ']] }
];
// ---------- 認識鍵位用：依「實體鍵盤欄位」分組的注音符號 ----------
// 每一欄＝同一根手指負責、由數字排到下排直向排列的 4 個鍵（最後一欄只有 1 個），
// 對應到鍵盤：1QAZ、2WSX、3EDC、4RFV、5TGB、6YHN、7UJM、8IK,、9OL.、0P;/、-（單一鍵）。
// 聲符主要落在第1~6欄（鍵盤中間偏左），韻符主要落在第7~11欄（鍵盤右半邊），
// 聲調符號（ˇˋˊ˙）夾在第3、4、6、7欄的第一列，剛好是打注音時最先摸到聲調鍵的位置。
const ZY_COL1  = ['ㄅ','ㄆ','ㄇ','ㄈ'];   // 1 Q A Z
const ZY_COL2  = ['ㄉ','ㄊ','ㄋ','ㄌ'];   // 2 W S X
const ZY_COL3  = ['ˇ','ㄍ','ㄎ','ㄏ'];   // 3 E D C
const ZY_COL4  = ['ˋ','ㄐ','ㄑ','ㄒ'];   // 4 R F V
const ZY_COL5  = ['ㄓ','ㄔ','ㄕ','ㄖ'];   // 5 T G B
const ZY_COL6  = ['ˊ','ㄗ','ㄘ','ㄙ'];   // 6 Y H N
const ZY_COL7  = ['˙','ㄧ','ㄨ','ㄩ'];   // 7 U J M
const ZY_COL8  = ['ㄚ','ㄛ','ㄜ','ㄝ'];   // 8 I K ,
const ZY_COL9  = ['ㄞ','ㄟ','ㄠ','ㄡ'];   // 9 O L .
const ZY_COL10 = ['ㄢ','ㄣ','ㄤ','ㄥ'];   // 0 P ; /
const ZY_COL11 = ['ㄦ'];                  // -

// 課程1用：單純從第1欄掃到第11欄，跟手指從鍵盤左邊移到右邊的方向一致
const ZY_KEYPOS_SEQ = [
  ...ZY_COL1, ...ZY_COL2, ...ZY_COL3, ...ZY_COL4, ...ZY_COL5, ...ZY_COL6,
  ...ZY_COL7, ...ZY_COL8, ...ZY_COL9, ...ZY_COL10, ...ZY_COL11
];
// 課程2用：左欄（聲符，第1~6欄）跟對應的右欄（韻符，第7~11欄）兩兩交錯，
// 第6欄左手邊沒有對應的右欄了，排在最後單獨出現
const ZY_KEYPOS_LR = [
  ...ZY_COL1, ...ZY_COL7, ...ZY_COL2, ...ZY_COL8, ...ZY_COL3, ...ZY_COL9,
  ...ZY_COL4, ...ZY_COL10, ...ZY_COL5, ...ZY_COL11, ...ZY_COL6
];

const ZHUYIN_LESSONS = {
  // ===== 第一階段：認識鍵位（41 個注音鍵：21 聲符＋16 韻符＋4 聲調，都是實體鍵盤上的位置）=====
  // 【重新設計】原本想拆成「聲符／韻符／聲調」各自獨立一課，但那是注音符號的「分類」，
  // 不是鍵盤上真正的排列方式，練起來反而不是在認識鍵位。改成兩課，兩課都是 sequential:true
  // （出題不隨機抽，直接照 chars 陣列固定順序一路推進，繞完 41 鍵再從頭開始）：
  //   1. 依欄位順序：跟手指從鍵盤最左邊掃到最右邊同一個方向，一欄一欄（同一根手指負責的直向 4 鍵）
  //      走過去，建立「這一鍵在這裡、下一鍵在旁邊」的基礎位置感。
  //   2. 左右交錯：聲符集中在左半邊鍵盤（第1~6欄）、韻符集中在右半邊（第7~11欄），
  //      這一課把對應的左欄、右欄兩兩配對交替出現，讓雙手輪流動，
  //      也避免練右手韻符時，剛學的左手聲符位置就忘了。
  layout1: { name:'1. 鍵位總覽（依欄位順序）', desc:'21 個聲符＋16 個韻符＋4 個聲調，共 41 鍵，照鍵盤實際欄位從左掃到右（不隨機跳）。',
             level:'beginner', group:'🔤 認識鍵位', chars: ZY_KEYPOS_SEQ, sequential:true },
  layout2: { name:'2. 鍵位總覽（左右交錯）', desc:'一樣是這 41 鍵，改成左欄（聲符）配對應的右欄（韻符）交替出現，雙手輪流練習、互相複習。',
             level:'beginner', group:'🔤 認識鍵位', chars: ZY_KEYPOS_LR, sequential:true },

  // ===== 第二階段：音節組合，依「中排優先、逐排疊加」的順序安排 =====
  // 【分兩段】8 課太長，拆成兩組，玩法也刻意區分（遊戲對照見 app.js 的 AUTO_GAME_BY_LESSON.zhuyin）：
  //   ・音節組合（基礎）3～6 課：中排為主、逐步加入其他排，一般練習、不自動套用遊戲，專心建立手感。
  //   ・音節組合（遊戲挑戰）7～10 課：四排互相搭配，每課自動套用不同小遊戲，把學會的組合打得更快、更穩。
  // 【重新設計】一般人打注音時，中排（A–;）自己就能組成很多真實存在的音節（書、可、忙…），
  // 所以優先練中排；接著中排分別搭配下排、上排、數字排；最後才是四排一起的全鍵盤綜合，
  // 取代原本「聲符+韻符+聲調 21+16+4 個符號完全隨機」的全鍵盤混合（那樣不符合實際打字時
  // 「先中排、後其他排」的手感，也常出現ㄑ配ㄤ這種國語裡根本不存在的音節）。
  z1: { name:'3. 中排音節 ㄇㄋㄎㄕㄘ', desc:'只用中排（A S D F G H J K L ;）就能組成的音節，例如 ㄕㄨ、ㄎㄜ、ㄇㄠ，是最常見的組合，優先練。',
        level:'beginner', group:'🀄 音節組合（基礎）', type:'zhuyinWords', words: ZY_SYL_STAGE1 },
  z2: { name:'4. 中排＋下排音節', desc:'加入下排（Z X C V B N M , . /）的ㄩㄝㄡㄥ與ㄈㄌㄏㄒㄖㄙ，題目仍會混入中排已學過的音節。',
        level:'beginner', group:'🀄 音節組合（基礎）', type:'zhuyinWords', words: ZY_SYL_STAGE2 },
  z3: { name:'5. 中排＋上排音節', desc:'加入上排（Q W E R T Y U I O P）的ㄧㄛㄟㄣ與ㄆㄊㄍㄐㄔㄗ，持續複習前面練過的音節。',
        level:'beginner', group:'🀄 音節組合（基礎）', type:'zhuyinWords', words: ZY_SYL_STAGE3 },
  z4: { name:'6. 中排＋數字排音節', desc:'加入數字排（1234567890-）的ㄅㄉㄓㄚㄞㄢ，這排也有聲調符號，從這裡開始音節會正式帶聲調。',
        level:'beginner', group:'🀄 音節組合（基礎）', type:'zhuyinWords', words: ZY_SYL_STAGE4 },
  z5: { name:'7. 下排＋上排音節', desc:'換方向，練下排跟上排搭出來的音節，聲調持續混入。',
        level:'beginner', group:'🎮 音節組合（遊戲挑戰）', type:'zhuyinWords', words: ZY_SYL_STAGE5 },
  z6: { name:'8. 下排＋數字排音節', desc:'下排搭數字排的音節。',
        level:'beginner', group:'🎮 音節組合（遊戲挑戰）', type:'zhuyinWords', words: ZY_SYL_STAGE6 },
  z7: { name:'9. 上排＋數字排音節', desc:'上排搭數字排的音節，練完這一課，四排就都搭配過一輪了。',
        level:'beginner', group:'🎮 音節組合（遊戲挑戰）', type:'zhuyinWords', words: ZY_SYL_STAGE7 },
  z8: { name:'10. 全鍵盤音節綜合', desc:'加入需要「聲符＋介音＋韻符＋聲調」四個符號、橫跨好幾排鍵位的完整音節（例如ㄒㄧㄤˇ想、ㄒㄧㄠˇ小），最貼近平常打注音的手感。',
        level:'advanced', group:'🎮 音節組合（遊戲挑戰）', type:'zhuyinWords', words: ZY_SYL_STAGE8 },

  // ===== 第三階段：常用詞語與短語句子 =====
  // 【修改】原本每個字之間一律按空白鍵分隔；微軟新注音其實只有「第一聲（不標聲調符號）」
  // 才需要按空白鍵選字，第二聲以上打完聲調符號就直接選字了，不需要再按空白鍵。
  // 這個規則已經在 HTML 內組字佇列的地方（buildQueue 的 zhuyinWords / zhuyinSentences 分支）
  // 改成依每個字有沒有標聲調符號來決定要不要插入空白鍵，這裡的資料本身不用改。
  words:    { name:'11. 常用注音詞語', desc:'你好、謝謝…等常用詞語。跟微軟新注音一樣，只有第一聲（不標聲調）的字後面才需要按空白鍵，其餘聲調打完直接接下一個字。',
              level:'advanced', group:'📝 詞語與句子', type:'zhuyinWords', words: ZY_WORDS },
  sentences:{ name:'12. 常用注音句子', desc:'我愛你、我很好…等常用短句。空白鍵規則同上：只有第一聲的字才需要按空白鍵。',
              level:'advanced', group:'📝 詞語與句子', type:'zhuyinSentences', sentences: ZY_SENTENCES }
};

// ---------- 遊戲化資料骨架（Phase 3 用，目前只提供資料結構，不含戰鬥、積分兌換邏輯與畫面） ----------
// Monster = { id, name, emoji, tier(第幾隻，越後面越強), maxHP(累積傷害多少才擊敗),
//             minAccuracy(正確率低於此門檻不計傷害，逼玩家打穩而不是求快), reward(擊敗後獲得的兌換點數) }
// 傷害換算方式待定，暫定方向：每完成一組（例如10鍵）為一次攻擊，
// 傷害 = 基礎值 × (本組正確率是否達 minAccuracy ? 1 : 0.3) × 速度加成，實際公式留到接上引擎時再調整。
// （目前討論後暫緩採用怪物機制，資料先保留備用，見規劃文件第5.1節）
const MONSTERS = [
  { id:'caterpillar', name:'毛毛蟲寶寶',   emoji:'🐛', tier:1,  maxHP:20,  minAccuracy:50, reward:10 },
  { id:'snail',       name:'蝸牛怪',       emoji:'🐌', tier:2,  maxHP:35,  minAccuracy:55, reward:15 },
  { id:'cricket',     name:'跳跳蟲',       emoji:'🦗', tier:3,  maxHP:50,  minAccuracy:60, reward:20 },
  { id:'boar',        name:'野豬衝衝',     emoji:'🐗', tier:4,  maxHP:70,  minAccuracy:65, reward:28 },
  { id:'scorpion',    name:'螫尾蠍',       emoji:'🦂', tier:5,  maxHP:90,  minAccuracy:70, reward:36 },
  { id:'snake',       name:'迷路巨蛇',     emoji:'🐍', tier:6,  maxHP:115, minAccuracy:72, reward:45 },
  { id:'crocodile',   name:'沼澤鱷魚',     emoji:'🐊', tier:7,  maxHP:140, minAccuracy:75, reward:55 },
  { id:'dino',        name:'暴走恐龍',     emoji:'🦖', tier:8,  maxHP:170, minAccuracy:78, reward:68 },
  { id:'imp',         name:'搗蛋小鬼',     emoji:'👹', tier:9,  maxHP:200, minAccuracy:80, reward:82 },
  { id:'dragon',      name:'傳說巨龍',     emoji:'🐉', tier:10, maxHP:260, minAccuracy:85, reward:100 },
  { id:'alien-boss',  name:'神秘外星首領', emoji:'👾', tier:11, maxHP:320, minAccuracy:88, reward:130 }
];

// ShopItem = { id, category('avatar'頭像 / 'theme'鍵盤主題色 / 'mascot'吉祥物造型),
//              name, emoji(預覽用圖示), cost(所需積分), unlocked(是否已解鎖，預設款一律 true) }
// 主題色的實際配色值留給接上引擎時再對應到 CSS 變數（例如 --tray、--key-face、--accent 等）。
const SHOP_ITEMS = [
  // 頭像
  { id:'avatar-default',  category:'avatar', name:'新手雛鳥',   emoji:'🐣', cost:0,   unlocked:true },
  { id:'avatar-cat',      category:'avatar', name:'貓咪打字手', emoji:'🐱', cost:50,  unlocked:false },
  { id:'avatar-owl',      category:'avatar', name:'夜貓子貓頭鷹', emoji:'🦉', cost:90,  unlocked:false },
  { id:'avatar-dragon',   category:'avatar', name:'打字小龍',   emoji:'🐲', cost:150, unlocked:false },
  { id:'avatar-robot',    category:'avatar', name:'打字機器人', emoji:'🤖', cost:220, unlocked:false },
  // 鍵盤主題色
  { id:'theme-default',   category:'theme', name:'雲朵藍（預設）', emoji:'☁️', cost:0,   unlocked:true },
  { id:'theme-sakura',    category:'theme', name:'櫻花粉',       emoji:'🌸', cost:80,  unlocked:false },
  { id:'theme-forest',    category:'theme', name:'森林綠',       emoji:'🌲', cost:80,  unlocked:false },
  { id:'theme-night',     category:'theme', name:'夜間深色',     emoji:'🌙', cost:130, unlocked:false },
  { id:'theme-sunset',    category:'theme', name:'夕陽橘',       emoji:'🌅', cost:130, unlocked:false },
  // 吉祥物造型
  { id:'mascot-default',  category:'mascot', name:'圓臉夥伴（預設）', emoji:'😊', cost:0,   unlocked:true },
  { id:'mascot-penguin',  category:'mascot', name:'企鵝夥伴',   emoji:'🐧', cost:60,  unlocked:false },
  { id:'mascot-panda',    category:'mascot', name:'貓熊夥伴',   emoji:'🐼', cost:100, unlocked:false },
  { id:'mascot-unicorn',  category:'mascot', name:'獨角獸夥伴', emoji:'🦄', cost:180, unlocked:false }
];
