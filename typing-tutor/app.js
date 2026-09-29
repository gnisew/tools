(function(){

  // ---------- Keyboard data ----------
  const rows = [
    [
      {label:'`',char:'`',finger:'lp',shift:'~'},{label:'1',char:'1',finger:'lp',zhuyin:'ㄅ',shift:'!'},{label:'2',char:'2',finger:'lr',zhuyin:'ㄉ',shift:'@'},
      {label:'3',char:'3',finger:'lm',zhuyin:'ˇ',shift:'#'},{label:'4',char:'4',finger:'li',zhuyin:'ˋ',shift:'$'},{label:'5',char:'5',finger:'li',zhuyin:'ㄓ',shift:'%'},
      {label:'6',char:'6',finger:'ri',zhuyin:'ˊ',shift:'^'},{label:'7',char:'7',finger:'ri',zhuyin:'˙',shift:'&'},{label:'8',char:'8',finger:'rm',zhuyin:'ㄚ',shift:'*'},
      {label:'9',char:'9',finger:'rr',zhuyin:'ㄞ',shift:'('},{label:'0',char:'0',finger:'rp',zhuyin:'ㄢ',shift:')'},{label:'-',char:'-',finger:'rp',zhuyin:'ㄦ',shift:'_'},
      {label:'=',char:'=',finger:'rp',shift:'+'},{label:'Backspace',finger:'rp',special:true,flex:2}
    ],
    [
      {label:'Tab',finger:'lp',special:true,flex:1.4},{label:'Q',char:'q',finger:'lp',zhuyin:'ㄆ'},{label:'W',char:'w',finger:'lr',zhuyin:'ㄊ'},
      {label:'E',char:'e',finger:'lm',zhuyin:'ㄍ'},{label:'R',char:'r',finger:'li',zhuyin:'ㄐ'},{label:'T',char:'t',finger:'li',zhuyin:'ㄔ'},
      {label:'Y',char:'y',finger:'ri',zhuyin:'ㄗ'},{label:'U',char:'u',finger:'ri',zhuyin:'ㄧ'},{label:'I',char:'i',finger:'rm',zhuyin:'ㄛ'},
      {label:'O',char:'o',finger:'rr',zhuyin:'ㄟ'},{label:'P',char:'p',finger:'rp',zhuyin:'ㄣ'},{label:'[',char:'[',finger:'rp',shift:'{'},
      {label:']',char:']',finger:'rp',shift:'}'},{label:'\\',char:'\\',finger:'rp',flex:1.3,shift:'|'}
    ],
    [
      {label:'Caps Lock',finger:'lp',special:true,flex:1.7},{label:'A',char:'a',finger:'lp',zhuyin:'ㄇ'},{label:'S',char:'s',finger:'lr',zhuyin:'ㄋ'},
      {label:'D',char:'d',finger:'lm',zhuyin:'ㄎ'},{label:'F',char:'f',finger:'li',bump:true,zhuyin:'ㄑ'},{label:'G',char:'g',finger:'li',zhuyin:'ㄕ'},
      {label:'H',char:'h',finger:'ri',zhuyin:'ㄘ'},{label:'J',char:'j',finger:'ri',bump:true,zhuyin:'ㄨ'},{label:'K',char:'k',finger:'rm',zhuyin:'ㄜ'},
      {label:'L',char:'l',finger:'rr',zhuyin:'ㄠ'},{label:';',char:';',finger:'rp',zhuyin:'ㄤ',shift:':'},{label:"'",char:"'",finger:'rp',shift:'"'},
      {label:'Enter',finger:'rp',special:true,flex:1.7}
    ],
    [
      {label:'Shift',finger:'lp',special:true,flex:2.1},{label:'Z',char:'z',finger:'lp',zhuyin:'ㄈ'},{label:'X',char:'x',finger:'lr',zhuyin:'ㄌ'},
      {label:'C',char:'c',finger:'lm',zhuyin:'ㄏ'},{label:'V',char:'v',finger:'li',zhuyin:'ㄒ'},{label:'B',char:'b',finger:'li',zhuyin:'ㄖ'},
      {label:'N',char:'n',finger:'ri',zhuyin:'ㄙ'},{label:'M',char:'m',finger:'ri',zhuyin:'ㄩ'},{label:',',char:',',finger:'rm',zhuyin:'ㄝ',shift:'<'},
      {label:'.',char:'.',finger:'rr',zhuyin:'ㄡ',shift:'>'},{label:'/',char:'/',finger:'rp',zhuyin:'ㄥ',shift:'?'},{label:'Shift',finger:'rp',special:true,flex:2.1}
    ],
    [
      {label:'Ctrl',finger:'lp',special:true,flex:1.3},{label:'Win',finger:'lp',special:true,flex:1.1},{label:'Alt',finger:'lp',special:true,flex:1.1},
      {label:'Space',char:' ',finger:'thumb',special:true,flex:6},
      {label:'Alt',finger:'rp',special:true,flex:1.1},{label:'Ctrl',finger:'rp',special:true,flex:1.3}
    ]
  ];

  const fingerColor = {
    lp:'var(--f-lp)', lr:'var(--f-lr)', lm:'var(--f-lm)', li:'var(--f-li)',
    ri:'var(--f-ri)', rm:'var(--f-rm)', rr:'var(--f-rr)', rp:'var(--f-rp)', thumb:'var(--f-thumb)'
  };
  const fingerLabel = {
    lp:'左手小指', lr:'左手無名指', lm:'左手中指', li:'左手食指',
    ri:'右手食指', rm:'右手中指', rr:'右手無名指', rp:'右手小指', thumb:'大拇指'
  };
  const fingerNames = ['lp','lr','lm','li','ri','rm','rr','rp'];

  // Win 鍵改用簡化的四方格圖示（代表「視窗」鍵），單色線條風格，與其餘鍵帽的極簡設計一致
  const WIN_KEY_ICON = '<svg class="win-icon" viewBox="0 0 20 20" aria-hidden="true"><rect x="1" y="1" width="8" height="8" rx="1.2"/><rect x="11" y="1" width="8" height="8" rx="1.2"/><rect x="1" y="11" width="8" height="8" rx="1.2"/><rect x="11" y="11" width="8" height="8" rx="1.2"/></svg>';

  // ---------- Build keyboard DOM ----------
  const keyboardEl = document.getElementById('keyboard');
  const keyElByChar = {};
  // 特殊鍵（Ctrl / Shift / Alt / Win）依名稱分組，供「快速鍵課程」同時高亮多顆鍵使用
  const keyElsBySpecial = {};

  rows.forEach(row=>{
    const rowEl = document.createElement('div');
    rowEl.className = 'row';
    row.forEach(k=>{
      const keyEl = document.createElement('div');
      keyEl.className = 'key' + (k.special ? ' special':'') + (k.bump ? ' bump':'') + (k.shift ? ' has-shift':'');
      keyEl.style.flex = k.flex || 1;
      keyEl.style.setProperty('--finger-color', fingerColor[k.finger]);
      keyEl.dataset.finger = k.finger;
      if (k.zhuyin) {
        keyEl.dataset.zhuyin = k.zhuyin;
        keyEl.innerHTML = `<span class="zhuyin-label">${k.zhuyin}</span><span class="key-main-label">${k.label}</span>`;
      } else if (k.label === 'Win') {
        keyEl.innerHTML = `<span class="key-main-label">${WIN_KEY_ICON}</span>`;
      } else {
        keyEl.innerHTML = `<span class="key-main-label">${k.label}</span>`;
      }
      // 【新增】數字/符號鍵的右上角符號角標(如 1! 2@ 等),一般模式與 show-zhuyin 模式顯示
      if (k.shift) {
        keyEl.insertAdjacentHTML('beforeend', `<span class="shift-label">${k.shift}</span>`);
      }
      if (k.char) {
        keyEl.dataset.char = k.char;
        keyElByChar[k.char] = keyEl;
      }
      if (k.special) {
        const specialName = k.label.toLowerCase();
        if (['ctrl','shift','alt','win'].includes(specialName)) {
          (keyElsBySpecial[specialName] = keyElsBySpecial[specialName] || []).push(keyEl);
        }
      }
      // 點擊/觸控畫面上的鍵帽也能輸入（手機、平板沒有實體鍵盤時可以直接用畫面操作）
      keyEl.addEventListener('click', (e)=>onscreenKeyClick(k, e));
      rowEl.appendChild(keyEl);
    });
    keyboardEl.appendChild(rowEl);
  });

  // ---------- 注音鍵盤資料骨架（Phase 2 用，目前只提供資料結構，不含課程內容與輸入判定） ----------
  // zhuyinToChar：注音符號 -> 對應的實體按鍵字元（可反查 keyElByChar 找到 DOM）
  // zhuyinFingerMap：注音符號 -> 該鍵慣用手指（沿用同一實體鍵位的指法，供之後注音課程的提示泡泡使用）
  const zhuyinToChar = {};
  const zhuyinFingerMap = {};
  const charToZhuyin = {};
  rows.forEach(row=>{
    row.forEach(k=>{
      if (k.zhuyin && k.char) {
        zhuyinToChar[k.zhuyin] = k.char;
        zhuyinFingerMap[k.zhuyin] = k.finger;
        charToZhuyin[k.char] = k.zhuyin;
      }
    });
  });

  // ---------- Legend（移到側邊欄）----------
  const legendEl = document.getElementById('sidebarLegend');
  const legendNames = {lp:'左手小指',lr:'左手無名指',lm:'左手中指',li:'左手食指',ri:'右手食指',rm:'右手中指',rr:'右手無名指',rp:'右手小指'};
  fingerNames.forEach(f=>{
    const s = document.createElement('div');
    s.className = 'legend-item';
    s.innerHTML = `<i style="background:${fingerColor[f]}"></i>${legendNames[f]}`;
    legendEl.appendChild(s);
  });
  // 【新增】「指法顏色說明」預設摺疊，點標題才展開／收合
  const legendToggleBtnEl = document.getElementById('legendToggleBtn');
  legendToggleBtnEl.addEventListener('click', ()=>{
    const open = legendEl.style.display === 'none';
    legendEl.style.display = open ? 'flex' : 'none';
    legendToggleBtnEl.setAttribute('aria-expanded', String(open));
  });

  // ---------- Lesson engine ----------
  // TYPING_BASICS_LESSONS（英打基礎）、LESSONS（英打）、ZHUYIN_LESSONS（注音）、
  // MONSTERS、SHOP_ITEMS 等課程／遊戲資料已搬到獨立的 lessons-data.js
  // （用 <script src="lessons-data.js"> 於本檔案 <head> 或
  // 本段 <script> 之前引入，兩者共用同一份全域 const，這裡不再重複宣告）。
  // 'all'（全鍵盤綜合）在資料檔裡先給空陣列，這裡等鍵盤 DOM 建好、keyElByChar 有內容後才補上實際字元：
  LESSONS.all.chars = Object.keys(keyElByChar).filter(c=>c!==' ');

  // 【新增】三層課程架構：COURSES是「大課程」清單（英打基礎／英打／注音），每個大課程底下有自己的一組「小課程」(lessons)。
  // 「英打基礎」是從「英打」獨立出來的入門課程，專門教完全沒學過打字的人指法；
  // 「英打」則保留給已經會打字、想練字彙／句子／全鍵盤／速度的人，兩者互不混雜。
  // 「注音打字模式」原本是設定面板裡的開關，現在改成選一個大課程，跟課程選單合而為一，語意更清楚，也才能放進網址參數分享。
  const COURSES = [
    { id:'basics',  name:'英打基礎', lessons: TYPING_BASICS_LESSONS, defaultLesson:'h1' },
    { id:'english', name:'英打',     lessons: LESSONS,               defaultLesson:'words' },
    { id:'zhuyin',  name:'注音',     lessons: ZHUYIN_LESSONS,        defaultLesson:'layout1' }
  ];
  function getCourse(id){ return COURSES.find(c=>c.id===id) || COURSES[0]; }
  let currentCourse = 'basics'; // 預設帶新使用者從「英打基礎」開始，已經會打字的人可自行切到「英打」
  let lessonByCourse = { basics:'h1', english:'words', zhuyin:'layout1' }; // 記住每個大課程「上次選的小課程」，切換大課程再切回來時能還原
  // 【新增】切到目前大課程底下的「下一課」，給結束畫面的「下一關」按鈕用；
  // 練到最後一課時繞回第一課（而不是卡住不能按），方便想從頭複習一輪的人
  function goToNextLesson(){
    const source = activeLessonSet();
    const keys = Object.keys(source);
    if(!keys.length) return;
    const curIdx = keys.indexOf(activeLessonKey());
    const nextIdx = (curIdx + 1) % keys.length;
    drillChars = null; // 若原本在加強練習模式，換下一關就直接離開，回到正常課程
    lessonByCourse[currentCourse] = keys[nextIdx];
    syncLessonSelectDisplay();
    updateUrlParams();
    resetAll();
  }

  function activeLessonSet(){ return getCourse(currentCourse).lessons; }
  function activeLessonKey(){ return lessonByCourse[currentCourse]; }
  function activeLesson(){ return activeLessonSet()[activeLessonKey()]; }

  // 【新增】「自動時間」：依目前課程內容估算合適的練習秒數，取代固定寫死的 90 秒。
  // 設計原則：
  //   1. 內容越少（例如只練 F、J 兩個鍵）代表越快就能上手，不需要久練 → 估出來的時間要短。
  //   2. 內容越多（鍵數多、單字/句子多、快速鍵多）需要更多輪次才能大致都練過一次 → 估出來的時間要長一點。
  //   3. 但不管內容多寡，自動估算的時間都不超過 3 分鐘（180 秒）——太長容易失去專注力，
  //      練不完的部分本來就會在下一輪、或用「加強練習」再回頭複習到。
  //   4. 最短也給 20 秒，太短會感覺才剛開始就結束，缺乏「進入狀況」的緩衝。
  //   各類型內容給不同的估算公式，理由見各分支註解。
  function estimateAutoSeconds(lesson){
    const MIN_SECONDS = 20;
    const MAX_SECONDS = 180; // 使用者要求：自動時間最長不超過 3 分鐘
    let seconds;
    if(lesson.type === 'shortcuts'){
      // 快速鍵：每一個組合鍵都要多花時間「反應＋比出手勢」，用組合數量估算，每個給 12 秒
      const count = (lesson.shortcuts && lesson.shortcuts.length) || 8;
      seconds = 12 * count;
    } else if(lesson.type === 'words' || lesson.type === 'zhuyinWords'){
      // 單字／詞語：字彙量越大，需要越久才能大致把常見的項目都練過一輪；
      // 用 sqrt 而不是直接乘上數量，避免單字表一長（例如 80 個常用字）估出離譜的時間
      const count = (lesson.words && lesson.words.length) || 20;
      seconds = 20 + 9 * Math.sqrt(count);
    } else if(lesson.type === 'sentences' || lesson.type === 'zhuyinSentences'){
      // 句子：以句子數量 × 平均長度估算，句子越長、越多句，需要的時間自然越多
      const list = lesson.sentences || [];
      const avgLen = list.length ? list.reduce((s,x)=>s+String(x).length,0)/list.length : 12;
      seconds = 20 + list.length * (avgLen/3);
    } else {
      // 一般單鍵／全字母／數字排等課程：依這一課牽涉到的鍵數估算——
      // 鍵越少（例如剛開始的 F、J 兩鍵課）代表越快就能熟悉，鍵越多（例如三排全字母）需要的時間越久；
      // 沒有列出 chars 的課程（例如「全鍵盤綜合」all）視同高難度，給預設 30 鍵份量
      const charCount = (lesson.chars && lesson.chars.length) || 30;
      seconds = 15 + 6 * charCount;
    }
    seconds = Math.max(MIN_SECONDS, Math.min(MAX_SECONDS, seconds));
    return Math.round(seconds/5)*5; // 湊整到 5 秒的倍數，數字比較好看
  }

  // 【新增】取得目前應該拿來估算時間的「內容」：一般情況是目前選的小課程，
  // 但如果正在「加強練習」模式（只複習少數幾個容易按錯的鍵），改用那幾個鍵來估算，
  // 通常會比原本課程更短，因為加強練習的範圍本來就比一整課小很多
  function currentLessonForAutoTime(){
    if(drillChars && drillChars.length) return { chars: drillChars };
    return activeLesson();
  }

  // 【新增】當「自動時間」模式開啟時，依目前課程內容重新計算 TOTAL_TIME；
  // 在 resetAll() 一開始呼叫，確保每次切換課程、進出加強練習、或按下重新開始時都會用最新內容重新估算
  function syncAutoTime(){
    if(!AUTO_TIME) return;
    TOTAL_TIME = estimateAutoSeconds(currentLessonForAutoTime());
  }
  function isZhuyinMode(){ return currentCourse === 'zhuyin'; } // 【新增】取代原本的 settings.zhuyinMode，判斷依據改成「目前選的大課程是不是注音」
  // 詞彙／句子課程改用「整段文字顯示」模式；加強練習（drillChars）與單鍵／注音課程仍用原本的大字＋鍵盤高亮
  function isPassageMode(){
    if(drillChars && drillChars.length) return false;
    const lesson = activeLesson();
    return lesson.type === 'words' || lesson.type === 'sentences';
  }
  // 快速鍵課程：目標不是單一字元，而是「修飾鍵＋主鍵」的組合（例如 Ctrl+C）
  function isShortcutMode(){
    if(drillChars && drillChars.length) return false;
    return activeLesson().type === 'shortcuts';
  }
  // 取得某個快速鍵組合對應的所有鍵帽 DOM（修飾鍵可能不只一顆，例如左右 Ctrl 都會一起高亮）
  function comboKeyEls(shortcut){
    const els = [];
    shortcut.keys.forEach((k,i)=>{
      const isMain = i === shortcut.keys.length - 1;
      if(isMain){
        if(keyElByChar[k]) els.push(keyElByChar[k]);
      } else if(keyElsBySpecial[k]){
        els.push(...keyElsBySpecial[k]);
      }
    });
    return els;
  }
  const QUEUE_LEN = 14;
  // 【新增】隱藏鍵盤時改用的佇列長度：畫面不用留給鍵盤，可以一次攤開比較多題
  const QUEUE_LEN_NO_KB = 45;
  let TOTAL_TIME = 90; // 一輪練習的秒數；可由頂部時間選單切換為 60/90/120/180/300/600 秒、Infinity（無限），或由「自動」模式依課程內容動態算出
  let AUTO_TIME = true; // 【新增】是否使用「自動時間」：預設開啟，TOTAL_TIME 會在每次 resetAll() 時依 estimateAutoSeconds() 重新計算，不需要使用者自己選
  let infiniteElapsed = 0; // 無限模式下計時「已經過幾秒」，取代倒數用
  let queue = [];
  let lastSentence = null;
  let lastZhuyinSentence = null;
  let queueIndex = 0;
  // 【新增】「依序」課程（目前是注音認識鍵位的兩課）專用：記住上次已經練到 pool 陣列的第幾個位置。
  // 佇列每次用完會呼叫 buildQueue() 重新出一批，若不記住位置，每次都會從頭（索引0＝ㄅ）重新開始，
  // 使用者就會一直卡在同樣的前幾個字、永遠到不了 ㄦ，這個變數就是用來接續進度、避免那個問題。
  let zySeqIndex = 0;
  let score = 0, correct = 0, wrong = 0;
  let streak = 0, bestStreak = 0;
  let wrongCounts = {};
  let timeLeft = TOTAL_TIME;
  let speedBaselineElapsed = 0; // 「重設統計」時記錄當下已經過秒數，之後算速度只算重設後新累積的時間，避免時間沒歸零導致速度亂跳
  let timerId = null;
  let ended = false;
  let started = false;        // 倒數是否已結束、正式開始計分計時
  let counting = false;       // 是否正在倒數中（尚未 started）
  let countdownId = null;
  let drillChars = null;          // 非 null 時代表目前在「加強練習錯誤鍵」模式
  let mistakeCharsForDrill = [];  // 上一輪結束時，依錯誤次數排序的錯誤鍵清單

  // ---------- 打字小遊戲：文字賽跑（只比距離：倒數時間內看誰跑得遠）----------
  const RACE_LAP = 20; // 跑道一趟的步數，跑滿一趟就折返
  let racePos = 0;     // 累積總步數（打對+1、打錯-1，不設上限）
  const raceTrackWrapEl = document.getElementById('raceTrackWrap');
  const raceRunnerEl = document.getElementById('raceRunner');
  const raceProgressLabelEl = document.getElementById('raceProgressLabel');
  // 【新增】「？」按鈕：點擊切換規則說明小卡的顯示／收合
  const raceInfoBtnEl = document.getElementById('raceInfoBtn');
  const raceInfoTipEl = document.getElementById('raceInfoTip');
  raceInfoBtnEl.addEventListener('click', ()=>{
    raceInfoTipEl.classList.toggle('show');
    raceInfoBtnEl.classList.toggle('open', raceInfoTipEl.classList.contains('show'));
  });

  // 只留「貼身對手」一個對手
  const RACE_OPPONENTS = [
    { id:'rival', name:'貼身對手', emoji:'🦊', paceMode:'adaptive', factor:1.00 }
  ];
  // 對手用「時間」持續前進（不像玩家是打對/打錯才跳格），起跑時玩家速度還是0，
  // 所以需要一個「保底參考速度」，依課程難度給，玩家真實速度追上後自然會蓋過這個保底值
  const RACE_BASE_PACE = { beginner: 40, advanced: 65 };
  let opponentState = {}; // { [id]: {pos, arrived, adaptiveFactor, adaptiveTarget, rerollIn} }
  function getPlayerPaceForRace(){
    const base = RACE_BASE_PACE[activeLesson().level] || 40;
    const live = Number(speedNumEl.textContent) || 0;
    return Math.max(base, live);
  }

  const dotsEl = document.getElementById('progressDots');
  const textPassageEl = document.getElementById('textPassage');
  const fingerLabelEl = document.getElementById('fingerLabel');
  const targetLabelEl = document.getElementById('targetLabel');
  const singleTargetWrapEl = document.getElementById('singleTargetWrap');
  const passageTargetWrapEl = document.getElementById('passageTargetWrap');
  const bubbleWaitingEl = document.getElementById('bubbleWaiting');
  const mascotRowEl = document.getElementById('mascotRow'); // 【新增】整個吉祥物泡泡區塊（頭像＋白色對話框），氣球遊戲時要整塊隱藏
  const bubbleCountdownEl = document.getElementById('bubbleCountdown');
  const countdownBubbleNumEl = document.getElementById('countdownBubbleNum');
  const bubbleNormalEl = document.getElementById('bubbleNormal');
  const keyHintBarEl = document.getElementById('keyHintBar');
  const physicalKeyHintEl = document.getElementById('physicalKeyHint');
  const bubbleEndedEl = document.getElementById('bubbleEnded');
  const resultTitleEl = document.getElementById('resultTitle');
  const resultStatsEl = document.getElementById('resultStats');
  const finalSampleNoteEl = document.getElementById('finalSampleNote');
  const mistakesLineEl = document.getElementById('mistakesLine');
  const finalScoreEl = document.getElementById('finalScore');
  const finalCorrectEl = document.getElementById('finalCorrect');
  const finalWrongEl = document.getElementById('finalWrong');
  const finalAccuracyEl = document.getElementById('finalAccuracy');
  const finalSpeedEl = document.getElementById('finalSpeed');
  const finalStreakEl = document.getElementById('finalStreak');
  const timeNumEl = document.getElementById('timeNum');
  const scoreNumEl = document.getElementById('scoreNum');
  const correctNumEl = document.getElementById('correctNum');
  const wrongNumEl = document.getElementById('wrongNum');
  const accuracyNumEl = document.getElementById('accuracyNum');
  const speedNumEl = document.getElementById('speedNum');
  const streakNumEl = document.getElementById('streakNum');
  const streakToastEl = document.getElementById('streakToast');
  let streakToastTimer = null;
  const trayEl = document.getElementById('keyboardTray');
  const footerNoteEl = document.getElementById('footerNote');
  const lessonInfoNameEl = document.getElementById('lessonInfoName');
  const lessonInfoDescEl = document.getElementById('lessonInfoDesc');
  const lessonSelectEl = document.getElementById('lessonSelect');
  // 【新增】小課程自訂下拉選單的相關元素（外層容器、清單、按鈕文字）
  const lessonDropdownWrapEl = document.getElementById('lessonDropdownWrap');
  const lessonDropdownMenuEl = document.getElementById('lessonDropdownMenu');
  const lessonSelectLabelEl = document.getElementById('lessonSelectLabel');
  const drillMistakesBtn = document.getElementById('drillMistakesBtn');
  // 【新增】結束畫面的「重新開始」「下一關」按鈕
  const resultRestartBtn = document.getElementById('resultRestartBtn');
  const resultNextLessonBtn = document.getElementById('resultNextLessonBtn');
  const resultHomeBtn = document.getElementById('resultHomeBtn'); // 【新增】結算畫面的「課程首頁」按鈕
  const exitDrillBtn = document.getElementById('exitDrillBtn');

  // 【新增】單鍵練習（含加強練習、一般單鍵/整排/數字排/注音符號等課程）原本是完全隨機的單一字元佇列，
  // 鍵位選擇少時（例如剛開始只有 F、J 兩鍵）很容易變成「手指自動反射、腦袋沒在想」地連打，
  // 反而練不到「看到目標字→找鍵→按下」這個完整動作。
  // 改成把鍵位切成一小群一小群（2～4 鍵一組，鍵越少的課程群組越長、更有組合變化），
  // 群組之間插入空白鍵當作強制停頓（使用者要按空白鍵才能繼續），逼自己重新確認下一組要打什麼，
  // 而不是手指自己滑過去。群組內允許同一鍵連打兩次（例如 jj，這是刻意保留的節奏，複習「同鍵連擊」的手感），
  // 但避免連續三次以上同一鍵（例如 jjj），那樣就真的變成無意識重複、失去練習意義。
  function buildClusteredCharQueue(pool, targetCount){
    const q = [];
    let produced = 0;
    let last = null, lastLast = null;
    while(produced < targetCount){
      const maxLen = pool.length <= 3 ? 4 : 3; // 鍵越少（例如只有 2 鍵）允許組長一點，變化才不會太單調
      const clusterLen = 2 + Math.floor(Math.random()*(maxLen-1)); // 群組長度 2～maxLen
      for(let i=0; i<clusterLen && produced<targetCount; i++){
        let pick, tries=0;
        do {
          pick = pool[Math.floor(Math.random()*pool.length)];
          tries++;
        } while(pick===last && pick===lastLast && pool.length>1 && tries<8); // 只擋連續三個同鍵，連續兩個（雙擊）是允許的
        q.push(pick);
        lastLast = last;
        last = pick;
        produced++;
      }
      if(produced < targetCount) q.push(' '); // 【新增】群組之間插入空白鍵，強迫停頓一下再開始下一組
      last = null; lastLast = null; // 空白之後重新起算，不用管跟前一組怎麼銜接
    }
    return q;
  }

  // 【新增】給「認識鍵位」這種初次認識鍵盤位置的課程用：跟 buildClusteredCharQueue 一樣切成
  // 小群組＋空白鍵停頓，但群組「內容」不是隨機抽的，而是照 pool 陣列原本的順序往下走
  // （pool 陣列本身已經照實體鍵盤欄位排好），排到底了就從頭繞回去繼續排，直到湊滿 targetCount。
  // 這樣使用者每次練習都會照著鍵盤的實際排列一路走過去，才是真正在建立「這個鍵在哪裡、下一個在哪裡」
  // 的位置記憶；隨機亂跳順序對第一次認識鍵位沒有幫助，所以這裡刻意不用亂數選鍵。
  function buildSequentialClusteredQueue(pool, targetCount){
    const q = [];
    let idx = zySeqIndex; // 【修改】接續上次跑到的位置，不是每次都從索引 0（也就是第一個字）重新開始
    while(q.length < targetCount){
      const maxLen = pool.length <= 3 ? 4 : 3; // 鍵越少，群組可以稍長一點，跟 buildClusteredCharQueue 邏輯一致
      const clusterLen = 2 + Math.floor(Math.random()*(maxLen-1)); // 群組長度 2～maxLen（隨機的只有「切幾個一組」，不是內容）
      for(let i=0; i<clusterLen && q.length<targetCount; i++){
        q.push(pool[idx % pool.length]);
        idx++;
      }
      if(q.length < targetCount) q.push(' '); // 群組之間插入空白鍵，強迫停頓一下再開始下一組
    }
    zySeqIndex = idx % pool.length; // 【新增】記住這次跑到哪裡，下次 buildQueue() 重新出題時從這裡接著走
    return q;
  }

  // 【新增】氣球模式：不要把空白鍵當成打字題目——原始佇列（buildQueueRaw）裡用來分隔單字／句子的空白，
  // 對一般模式（字卡／整段文字）來說是必要的練習內容，但在氣球遊戲裡會變成一顆很奇怪、看不清楚符號的「空白氣球」，
  // 所以氣球模式底下直接把空白從佇列裡拿掉，忍者只需要接連打出真正的字母／注音，不用打空白鍵。
  function buildQueue(){
    const q = buildQueueRaw();
    if(isBalloonMode()) return q.filter(item => item !== ' ');
    return q;
  }
  function buildQueueRaw(){
    // 【新增】沒有顯示鍵盤時，畫面空出一大塊，一次給更多內容（像 TypingClub 那樣攤開整篇），
    // 有顯示鍵盤時維持原本的短佇列，才不會被鍵盤擠到需要捲動。
    const qLen = settings.keyboard ? QUEUE_LEN : QUEUE_LEN_NO_KB;
    const scale = settings.keyboard ? 1 : 3; // 單字／詞語類課程的題量倍率
    // 加強練習模式：只從上一輪「按錯的鍵」抽取，錯越多次出現機率不變、但保證每個鍵都練到多次；
    // 【修改】改用 buildClusteredCharQueue 切成小群組＋空白鍵分隔（原理見上方函式註解）
    if(drillChars && drillChars.length){
      const targetCount = Math.max(10, drillChars.length * 3) * scale; // 【修改】乘上 scale：隱藏鍵盤時一次多給一點
      return buildClusteredCharQueue(drillChars, targetCount);
    }
    const lesson = activeLesson();
    // 快速鍵課程：把所有快速鍵洗牌兩輪，佇列項目是「組合鍵物件」而不是單一字元
    if(lesson.type === 'shortcuts'){
      const pool = lesson.shortcuts;
      const q = [];
      let last = null;
      const rounds = 2;
      for(let r=0;r<rounds;r++){
        const shuffled = pool.slice().sort(()=>Math.random()-0.5);
        if(shuffled.length>1 && shuffled[0]===last){
          [shuffled[0],shuffled[1]] = [shuffled[1],shuffled[0]];
        }
        q.push(...shuffled);
        last = shuffled[shuffled.length-1];
      }
      return q;
    }
    // 【新增】微軟新注音的真實規則：一個字有沒有標聲調符號（ˊˇˋ˙）決定要不要按空白鍵選字。
    // 只有第一聲（不標任何聲調符號）打完聲符+韻符後，注音輸入法還沒辦法自動選字，需要按空白鍵；
    // 第二聲以上，打完聲調符號那一下輸入法就直接選字了，不必再按空白鍵。
    // 這個函式判斷「打完這個字之後，還需不需要再按一次空白鍵才能接下一個字」。
    function zhuyinSyllableNeedsSpace(syl){
      return !syl.some(sym => ZY_TONES.includes(sym));
    }
    // 注音詞語課程：隨機挑幾個詞，拆成注音符號佇列。
    // 【修改】每個字之間原本一律插入空白鍵分隔，現在改成只有「第一聲（沒標聲調符號）」的字
    // 才需要空白鍵，其餘聲調打完聲調符號就直接接下一個字，跟微軟新注音的實際打字手感一致。
    // 【修改】原本這批題目「最後一個字」不管有沒有聲調一律不加空白鍵（怕使用者以為還沒打完）；
    // 但這樣使用者永遠學不到「結尾字沒標聲調也要按空白鍵」的習慣，所以拿掉這個例外，
    // 只要沒標聲調（第一聲）就一定要加空白鍵，不管是不是這批題目的最後一個字。
    if(lesson.type === 'zhuyinWords'){
      const wordPool = lesson.words;
      const wordCount = 2 * scale; // 【修改】原固定 2 個詞，隱藏鍵盤時乘上 scale 一次多給幾個
      const chosen = [];
      let lastIdx = -1;
      for(let i=0;i<wordCount;i++){
        let idx;
        do { idx = Math.floor(Math.random()*wordPool.length); } while(idx===lastIdx && wordPool.length>1);
        chosen.push(wordPool[idx]);
        lastIdx = idx;
      }
      const q = [];
      chosen.forEach((wObj)=>{
        wObj.syllables.forEach((syl)=>{
          q.push(...syl);
          if(zhuyinSyllableNeedsSpace(syl)) q.push(' ');
        });
      });
      return q;
    }
    // 注音句子練習：隨機挑一句（避開上一句），整句依「字」拆成注音符號佇列。
    // 【修改】同上，只要沒標聲調（第一聲）就加空白鍵，包含句子的最後一個字，
    // 讓使用者確實養成「沒聲調＝要按空白鍵選字」的習慣，不因為是句尾就例外。
    if(lesson.type === 'zhuyinSentences'){
      const pool = lesson.sentences;
      let s;
      do { s = pool[Math.floor(Math.random()*pool.length)]; } while(s===lastZhuyinSentence && pool.length>1);
      lastZhuyinSentence = s;
      const q = [];
      s.syllables.forEach((syl)=>{
        q.push(...syl);
        if(zhuyinSyllableNeedsSpace(syl)) q.push(' ');
      });
      return q;
    }
    // 句子練習：隨機挑一句（避開上一句），整句拆成字元佇列
    // 【修改】隱藏鍵盤時改成一次給 scale 句、句子之間用空白鍵分隔，讓攤開的內容有整篇文章的感覺
    if(lesson.type === 'sentences'){
      const pool = lesson.sentences;
      const picked = [];
      for(let i=0;i<scale;i++){
        let s;
        do { s = pool[Math.floor(Math.random()*pool.length)]; } while(s===lastSentence && pool.length>1);
        lastSentence = s;
        picked.push(s);
      }
      return Array.from(picked.join(' '));
    }
    // 常用單字課程：隨機挑幾個單字，拆成字母佇列、單字間用空白鍵分隔
    if(lesson.type === 'words'){
      const wordPool = lesson.words;
      const wordCount = 3 * scale; // 【修改】原固定 3 個單字，隱藏鍵盤時乘上 scale 一次多給幾個
      const chosen = [];
      let lastWord = null;
      for(let i=0;i<wordCount;i++){
        let w;
        do { w = wordPool[Math.floor(Math.random()*wordPool.length)]; } while(w===lastWord && wordPool.length>1);
        chosen.push(w);
        lastWord = w;
      }
      const q = [];
      chosen.forEach((w,i)=>{
        q.push(...w.split(''));
        if(i < chosen.length-1) q.push(' ');
      });
      return q;
    }
    // 其餘課程：單鍵練習。【新增】若課程有 focus（這一課的新鍵），新鍵權重 ×3，
    // 讓題目以新鍵為主、舊鍵穿插複習，而不是新舊鍵各佔一樣比例（舊鍵越多新鍵就越練不到）
    // 【修改】改用 buildClusteredCharQueue 切成小群組＋空白鍵分隔，鍵位少的課程（例如剛開始的 2 鍵課）尤其需要，
    // 否則很容易變成手指自動反射地連打，而不是每次都重新看清楚目標字再按（原理見函式本身的註解）
    // 【新增】依鍵盤順序出題的課程（目前是注音「認識鍵位」的聲符練習）：不隨機抽鍵，
    // 直接照 lesson.chars 的順序（已經是照實體鍵盤欄位排好的）一路練過去，繞完再重頭開始。
    if(lesson.sequential){
      return buildSequentialClusteredQueue(lesson.chars, qLen);
    }
    const pool = (lesson.focus && lesson.focus.length)
      ? [...lesson.chars, ...lesson.focus, ...lesson.focus]
      : lesson.chars;
    return buildClusteredCharQueue(pool, qLen);
  }

  // 【新增】這一課的目標字要不要顯示成大寫（跟鍵帽上刻的字一致）。
  // 單鍵練習階段用大寫（初學者是在「找鍵」，大寫比較好對照）；
  // 單字／句子課程用原本的小寫（那時是在「讀字」，小寫才是英文真實的樣子）。
  function useUpperDisplay(){
    if(isZhuyinMode()) return false;
    if(drillChars && drillChars.length) return true; // 加強練習是單鍵複習，比照單鍵課程
    return activeLesson().display === 'upper';
  }

  function renderDots(){
    dotsEl.innerHTML = '';
    queue.forEach((item,i)=>{
      const d = document.createElement('div');
      const isSpace = item === ' ';
      const isCombo = typeof item !== 'string';
      const label = isCombo ? item.keys[item.keys.length-1].toUpperCase()
                            : (isSpace ? '␣' : (useUpperDisplay() ? item.toUpperCase() : item));
      d.className = 'dot' + (i<queueIndex ? ' done' : (i===queueIndex ? ' current' : '')) + (isSpace ? ' space' : '');
      d.textContent = label;
      dotsEl.appendChild(d);
    });
  }

  function renderPassage(){
    textPassageEl.innerHTML = '';
    queue.forEach((ch,i)=>{
      const span = document.createElement('span');
      const isSpace = ch === ' ';
      span.className = 'ch' + (i<queueIndex ? ' done' : (i===queueIndex ? ' current' : ' pending'));
      span.textContent = isSpace ? ' ' : (useUpperDisplay() ? ch.toUpperCase() : ch);
      textPassageEl.appendChild(span);
    });
  }

  // ---------- 【修改】打字小遊戲：忍者抓氣球 ----------
  // 【設計重點・新玩法，像 TypingClub 一樣】氣球排「固定不動」：一批固定畫出 BALLOON_COUNT 顆氣球之後，位置就不再整批移動。
  // 打對一個字，忍者會「跳到」剛剛那顆氣球上，然後兩者一起慢慢落回地板（ninja-ride 動畫，時間＝BALLOON_FALL_MS）；
  // 如果在落地前，玩家又打對了下一個字，忍者就會立刻改跳到下一顆氣球上（不必等這次真的落地），
  // 這樣越打越快就能讓忍者一直在半空中跳來跳去、不落地；如果太慢、真的讓忍者落地了，就扣一次生命值，
  // 扣完 3 次遊戲結束。剛剛被跳過的氣球會自己獨立掉落、淡出消失，跟忍者的跳躍動畫各自播放、互不影響。
  // 等這一批全部打完，才整批換下一批新的氣球（換題次數比之前「每打一下就整排跳一格」少很多）。
  const balloonSkyEl = document.getElementById('balloonSky');
  const balloonTrackEl = document.getElementById('balloonTrack');
  const balloonNinjaEl = document.getElementById('balloonNinja');
  const balloonStartMarkerEl = document.getElementById('balloonStartMarker'); // 【新增】忍者出場前，顯示在題目左邊的星號佔位符號
  const balloonScoreEl = document.getElementById('balloonScore');
  const balloonLivesEl = document.getElementById('balloonLives');    // 【新增】左下角生命值（愛心）容器
  const balloonMsgEl = document.getElementById('balloonMsg');
  const BALLOON_COUNT = 6;                                            // 一批同時畫出幾顆
  const BALLOON_EMOJIS = ['🎈'];   // 【修改】原本輪流換成風箏／星星／蘋果／泡泡／棒棒糖等不同 emoji，但深淺不一，字母疊在上面有時看不清楚；改成全部固定用氣球，辨識度比較穩定
  const BALLOON_Y = [0, 22, 8, 30, 4, 18];                            // 高低錯落，看起來比較自然（固定值，不會自己動）
  const BALLOON_LIVES_MAX = 3;                                        // 【新增】總共 3 次生命值
  const BALLOON_BASE_FALL_MS = 3000; // 基礎（最慢）掉落時間，維持原本的 3 秒
  const BALLOON_MIN_FALL_MS = 1000;  // 合理的速度上限：最快 1 秒落地
  const BALLOON_SPEEDUP_STEP = 10;   // 每打對一顆氣球，偷偷加速 10 毫秒
  let currentBalloonFallMs = BALLOON_BASE_FALL_MS; // 記錄當前的動態掉落時間
  const NINJA_HOP_MS = 380;                                           // 【修改】原 340，改成 380；須跟 CSS 的 ninja-hop-in 動畫時間（.38s）一致
  let balloonBatchStart = -1;                                         // 目前這一批氣球，第一顆對應到 queue 的第幾個 index；-1 代表還沒畫過
  let balloonSlotEls = [];                                            // 目前這一批氣球的 DOM 元素，畫出來後固定不動，不會整批重排
  let balloonLivesLeft = BALLOON_LIVES_MAX;                           // 【新增】目前剩餘生命值
  let balloonEndedByLives = false;                                    // 【新增】這一輪是不是因為生命值扣完才結束（給 endSession 判斷要不要照樣顯示成績）
  let ninjaRideTimer = null;                                          // 【新增】忍者目前這一次「跳上氣球→落地」的倒數計時器；在時間內打對下一個字就會被清掉，不會真的落地扣血

  function isBalloonMode(){
    // 快速鍵課程的題目是組合鍵、不是單一字元，不適合做成一顆一顆氣球
    return settings.balloonGame && !isShortcutMode();
  }
  function balloonLabel(item){
    if(item === ' ') return '␣';
    return useUpperDisplay() ? String(item).toUpperCase() : String(item);
  }
  // 把忍者移到某個氣球元素正下方：用實際量到的位置計算，氣球格寬用 vw 也能對得準；
  // skipAnim＝true 時忍者「瞬間」歸位（換新一批、或整輪重設時用），不要看到用走路動畫滑過去
  function moveNinjaTo(el, skipAnim){
    if(!el) return;
    let left;
    if (el === balloonStartMarkerEl) {
      left = el.offsetLeft + el.offsetWidth / 2 - balloonNinjaEl.offsetWidth / 2;
    } else {
      left = balloonTrackEl.offsetLeft + el.offsetLeft + el.offsetWidth / 2 - balloonNinjaEl.offsetWidth / 2;
    }
    if(skipAnim){
      balloonNinjaEl.style.transition = 'none';
      balloonNinjaEl.style.left = left + 'px';
      void balloonNinjaEl.offsetWidth; // 強制 reflow
      balloonNinjaEl.style.transition = '';
    } else {
      balloonNinjaEl.style.left = left + 'px';
    }
  }
  // 【新增】算出忍者要往上跳多少像素，才會剛好站在某顆氣球上：
  // 用「氣球目前位置」跟「忍者站在地板時的高度」比較，回傳負值代表氣球在地板上方、忍者要往上跳這麼多。
  function computeSitDy(el){
    const skyRect = balloonSkyEl.getBoundingClientRect();
    const elRect = el.getBoundingClientRect();
    const ninjaH = balloonNinjaEl.offsetHeight;
    const floorTop = skyRect.bottom - 12 - ninjaH; // 12px 對齊 CSS 裡忍者 bottom:12px 的落地高度
    return elRect.top - floorTop;
  }
  // 【新增】讀出忍者「目前畫面上」實際的垂直位移（transform 的 translateY）。
  // riding 動畫進行到一半時（忍者還在半空中），這個值不是 0，而是動畫當下算出來的中間值；
  // 用來讓「跳到下一顆氣球」的新動畫從這個高度接著出發，而不是每次都被拉回地板(0)再往上跳。
  function getNinjaCurrentTranslateY(){
    const tr = getComputedStyle(balloonNinjaEl).transform;
    if(!tr || tr === 'none') return 0;
    const m = tr.match(/matrix\(([^)]+)\)/);
    if(!m) return 0;
    const vals = m[1].split(',').map(Number);
    return vals[5] || 0; // 2D matrix(a,b,c,d,e,f) 的 f 就是 translateY（此處不涉及旋轉/縮放，可直接取用）
  }
  function startNinjaRide(el, onLanded){
    if(ninjaRideTimer){ clearTimeout(ninjaRideTimer); ninjaRideTimer = null; }
    if(!el){ balloonNinjaEl.classList.remove('riding'); balloonNinjaEl.classList.remove('hopping'); return; }
    startNinjaFall(el, onLanded);
  }
  // 【新增】原本 startNinjaRide 裡「套用 ninja-ride、開始 3 秒落下倒數」那段獨立出來，
  // 讓「打對字後跳去下一顆氣球」跟「跳過去站好之後才開始倒數落下」都能呼叫同一段邏輯，行為跟原本完全一致。
  function startNinjaFall(el, onLanded){
    moveNinjaTo(el);
    const dy = computeSitDy(el);
    // 若忍者目前還在上一輪的跳起／落下動畫中（人還在半空中），先量出「現在畫面上實際的高度」，
    // 讓接下來要播的新動畫從這個高度接著跳到下一顆氣球；否則（例如剛跳到站好、或剛落地）
    // 就從目前站的高度（dy）開始，不會再瞬間跳一段。
    const wasAnimating = balloonNinjaEl.classList.contains('riding') || balloonNinjaEl.classList.contains('hopping');
    const startY = wasAnimating ? getNinjaCurrentTranslateY() : dy;
    balloonNinjaEl.style.setProperty('--ninja-y-start', startY + 'px');
    balloonNinjaEl.style.setProperty('--ride-dy', dy + 'px');
    balloonNinjaEl.classList.remove('riding');
    balloonNinjaEl.classList.remove('hopping');
    void balloonNinjaEl.offsetWidth; // 強制 reflow，確保動畫可以「重新」播放一次（而不是被瀏覽器忽略）
    balloonNinjaEl.classList.add('riding');
    ninjaRideTimer = setTimeout(()=>{
      ninjaRideTimer = null;
      balloonNinjaEl.classList.remove('riding');
      onLanded();
    }, currentBalloonFallMs);
  }
  function sitNinjaOnTop(el){
    if(ninjaRideTimer){ clearTimeout(ninjaRideTimer); ninjaRideTimer = null; }
    balloonNinjaEl.classList.remove('riding');
    balloonNinjaEl.classList.remove('hopping');
    balloonNinjaEl.classList.remove('hide'); // 確保忍者現身
    if(balloonStartMarkerEl) {
      balloonStartMarkerEl.classList.remove('hide');
      balloonStartMarkerEl.classList.remove('fall-floor'); // 清除可能殘留的動畫
      balloonStartMarkerEl.style.opacity = '1';
      balloonStartMarkerEl.style.transform = '';
      balloonStartMarkerEl.style.pointerEvents = 'auto';
    }
    moveNinjaTo(balloonStartMarkerEl, true); // 定位到星號上
    const markerStartDy = balloonStartMarkerEl ? computeSitDy(balloonStartMarkerEl) : 0;
    balloonNinjaEl.style.setProperty('--ninja-y-start', markerStartDy + 'px');
    balloonNinjaEl.style.transform = `translateY(${markerStartDy}px)`;
  }
  function onNinjaLanded(){
    if(ended) return; 
    loseLife();

    // 【新增】如果玩家來不及打字導致掉落，表示目前速度對他來說太快了，把速度重置回最慢，給予緩衝
    currentBalloonFallMs = BALLOON_BASE_FALL_MS;
    document.documentElement.style.setProperty('--fall-duration', currentBalloonFallMs + 'ms');
    if(balloonStartMarkerEl) {
      balloonStartMarkerEl.classList.remove('hide');
      balloonStartMarkerEl.classList.remove('fall-floor');
      balloonStartMarkerEl.style.opacity = '1';
      balloonStartMarkerEl.style.transform = '';
      balloonStartMarkerEl.style.pointerEvents = 'auto';
    }
    sitNinjaOnTop(balloonStartMarkerEl);
    if(balloonLivesLeft <= 0) balloonGameOver();
  }
  // 【新增】讓忍者正式開始「站上這顆氣球→倒數三秒→沒打對就落地扣血」的流程；
  // 遊戲正式開始（玩家按空白鍵、三二一倒數結束）時，或每次換新一批氣球時呼叫。
  function startBalloonFallCountdown(el){
    startNinjaRide(el, onNinjaLanded);
  }
  // 【新增】畫出目前的生命值（愛心）；lost 的愛心用淡化＋灰階表示已經用掉
  function renderBalloonLives(){
    if(!balloonLivesEl) return;
    let html = '';
    for(let i=0; i<BALLOON_LIVES_MAX; i++){
      html += `<span class="life${i >= balloonLivesLeft ? ' lost' : ''}">❤️</span>`;
    }
    balloonLivesEl.innerHTML = html;
  }
  function popBalloon(poppedEl){
    if(!poppedEl) return;
    poppedEl.classList.remove('target');
    const skyRect = balloonSkyEl.getBoundingClientRect();
    const balloonRect = poppedEl.getBoundingClientRect();
    const fallDy = Math.max(0, skyRect.bottom - balloonRect.bottom - 12); 
    poppedEl.style.setProperty('--fall-dy', fallDy + 'px');
    poppedEl.classList.add('fall-floor');
    setTimeout(()=>{ poppedEl.style.pointerEvents = 'none'; }, currentBalloonFallMs);
  }
  // 【新增】扣一次生命值：忍者與氣球落地時呼叫
  function loseLife(){
    balloonLivesLeft = Math.max(0, balloonLivesLeft - 1);
    renderBalloonLives();
    balloonLivesEl.classList.remove('shake');
    void balloonLivesEl.offsetWidth;
    balloonLivesEl.classList.add('shake');
  }
  // 【新增】生命值歸零：顯示這一輪得分並停止遊戲（沿用原本時間到時的結算畫面）
  function balloonGameOver(){
    balloonEndedByLives = true;
    endSession();
  }
  // 畫出全新一批氣球（從 queue 的第 start 個字開始），畫出來後位置就固定
  // 畫出全新一批氣球（從 queue 的第 start 個字開始），畫出來後位置就固定
  function drawBalloonBatch(start){
    
    // 【新增】檢查佇列裡剩下的字元夠不夠畫滿一整排（BALLOON_COUNT 顆）。
    // 如果不夠，就立刻呼叫 buildQueue() 產生新題目並無縫加進佇列尾端，確保氣球永遠是整排出現。
    while (start + BALLOON_COUNT > queue.length) {
      queue.push(...buildQueue());
    }

    balloonBatchStart = start;
    let html = '';
    for(let i=0; i<BALLOON_COUNT; i++){
      const idx = start + i;
      // 因為上面已經確保了 queue.length 絕對大於 start + BALLOON_COUNT，
      // 所以原本的 if(idx >= queue.length) break; 判斷式可以直接拿掉
      const emoji = BALLOON_EMOJIS[idx % BALLOON_EMOJIS.length];
      const y = BALLOON_Y[idx % BALLOON_Y.length];
      html += `<div class="balloon${i===0?' target':''}" style="margin-top:${y}px">${emoji}<span class="char">${balloonLabel(queue[idx])}</span></div>`;
    }
    balloonTrackEl.innerHTML = html;
    balloonSlotEls = Array.from(balloonTrackEl.children);
    
    // 換新一批氣球時，清除舊的動畫計時器
    if(ninjaRideTimer){ clearTimeout(ninjaRideTimer); ninjaRideTimer = null; }
    balloonNinjaEl.classList.remove('riding');

    // 每次換新一批氣球時，都要確保「星號」恢復原狀並顯示
    if(balloonStartMarkerEl) {
      balloonStartMarkerEl.classList.remove('hide');
      balloonStartMarkerEl.classList.remove('fall-floor');
      balloonStartMarkerEl.style.opacity = '1';
      balloonStartMarkerEl.style.transform = '';
      balloonStartMarkerEl.style.pointerEvents = 'auto';
    }

    if(balloonSlotEls[0]){
      if(started) {
        // 遊戲進行中（換下一輪題目時）：讓忍者回到星號上，並且與星號一起掉落
        moveNinjaTo(balloonStartMarkerEl, true);
        startBalloonFallCountdown(balloonStartMarkerEl);
        if (balloonStartMarkerEl) {
          popBalloon(balloonStartMarkerEl);
        }
      }
      else {
        // 遊戲尚未開始（初次載入）：讓忍者站在星號上等待
        sitNinjaOnTop(balloonStartMarkerEl);
      }
    }
  }
  // 【修改】打對字時的新玩法（像 TypingClub）：忍者跳到剛剛那顆氣球上，然後跟著它一起慢慢落回地板；
  // 如果在落地前，玩家又打對了下一個字，忍者就會立刻改跳到下一顆氣球（不必等這次真的落地）；
  // 真的落地了才扣一次生命值，扣完 3 次遊戲結束。剛剛那顆氣球則是自己獨立掉落淡出，跟忍者動畫互不影響。
  function renderBalloons(){
    const slot = queueIndex - balloonBatchStart;
    if(balloonBatchStart < 0 || slot < 0){
      // 第一次進氣球模式，或佇列整個重新開始，直接起一批新的
      drawBalloonBatch(queueIndex);
    } else if(slot <= balloonSlotEls.length && slot > 0){
      const poppedEl = balloonSlotEls[slot - 1];      // 剛剛打對的這顆氣球──忍者要跳上去、跟它一起落地
      const isLastInBatch = slot >= balloonSlotEls.length;
      popBalloon(poppedEl); // 這顆氣球自己掉落淡出，純視覺、跟忍者的跳躍動畫各自獨立播放
      if(isLastInBatch){
        // 這一批最後一顆剛好打完：不用等忍者落地，直接換下一批新的氣球（忍者瞬間歸位到新的第一顆下方）
        drawBalloonBatch(queueIndex);
      } else {
        const nextTargetEl = balloonSlotEls[slot];    // 下一個要打的字，先標記起來讓玩家知道要打哪一顆
        nextTargetEl.classList.add('target');
        // 忍者跳上剛剛那顆氣球、一起落地；如果落地前玩家又打對下一個字，
        // renderBalloons() 會再被呼叫一次、直接用新的目標重新呼叫 startBalloonFallCountdown，
        // 這次呼叫的計時器會被清掉、onNinjaLanded 不會執行，等於不算落地、不扣血。
        // 沒有歸零：忍者已經落回地板、停在剛剛那顆氣球原本的位置，等玩家打對「下一個字」時，
        // 下一次 renderBalloons() 會呼叫 startBalloonFallCountdown(nextTargetEl) 讓忍者跳過去
        // 玩家成功打對！在讓忍者跳向下一個氣球前，偷偷加速一點點 (不能低於最快極限)
		currentBalloonFallMs = Math.max(BALLOON_MIN_FALL_MS, currentBalloonFallMs - BALLOON_SPEEDUP_STEP);
		// 把算好的新速度更新到網頁的 CSS 變數中
		document.documentElement.style.setProperty('--fall-duration', currentBalloonFallMs + 'ms');
		
		startBalloonFallCountdown(poppedEl);
      }
    }
    balloonScoreEl.textContent = '🎈 ' + correct;
  }
  // 打錯時：目標氣球左右晃一下、忍者往後仰，給一個「沒抓到」的回饋（打錯不扣生命值）
  function balloonWrong(){
    if(!isBalloonMode()) return;
    const t = balloonTrackEl.querySelector('.balloon.target');
    if(t){
      t.classList.remove('shake');
      void t.offsetWidth;
      t.classList.add('shake');
    }
    balloonNinjaEl.classList.add('miss');
    setTimeout(()=>balloonNinjaEl.classList.remove('miss'), 200);
  }
  // 依目前是不是氣球模式，決定顯示天空還是原本的字卡（progress-dots）／整段文字（text-passage）
  function applyBalloonDisplay(){
    const on = isBalloonMode();
    balloonSkyEl.classList.toggle('show', on);
    // 【新增】不管「顯示鍵盤」開關現在是開是關，氣球遊戲一律不顯示鍵盤圖，
    // 讓遊戲畫面像 TypingClub 一樣佔滿空間；同時把鍵盤開關暫時鎖住，
    // 避免使用者點了以為有效果，其實氣球模式下永遠不會顯示鍵盤。
    document.body.classList.toggle('balloon-mode', on);
    keyboardToggleBtnEl.disabled = on;
    keyboardToggleBtnEl.title = on ? '忍者抓氣球遊戲中不顯示鍵盤' : '顯示／隱藏鍵盤';
    toggleKeyboardEl.classList.toggle('disabled', on);
    // 【修改】氣球遊戲時，遊戲區自己就有中間提示字／生命值可以看，
    // 不需要再顯示左上角吉祥物泡泡（等待開始／倒數／「跟著下面鍵盤提示」）跟鍵盤下方的按鍵提示列，
    // 兩邊重複顯示反而分散注意力；整塊 mascotRowEl 一起收起，而不是只藏裡面的文字，
    // 不然還是會留下一個空的白色對話框。結算畫面（bubbleEnded）不受這裡影響，
    // 會在 endSession() 裡把 mascotRowEl 重新顯示出來，仍照舊由 endSession()/resetAll() 各自控制顯示。
    mascotRowEl.style.display = on ? 'none' : '';
    if(on){
      bubbleWaitingEl.style.display = 'none';
      bubbleCountdownEl.style.display = 'none';
      bubbleNormalEl.style.display = 'none';
      keyHintBarEl.style.display = 'none';
    }
    if(!on) return;
    dotsEl.style.display = 'none';
    textPassageEl.classList.remove('show');
    balloonMsgEl.classList.toggle('hide', started); // 開始之後就把「按 Space 開始」那行字收起來
    renderBalloonLives(); // 【新增】切到氣球模式時，順便把生命值（愛心）畫出來
    renderBalloons();
  }

  function clearKeyStates(){
    keyboardEl.querySelectorAll('.key').forEach(el=>el.classList.remove('target','correct','wrong'));
  }

  function showTarget(){
    clearKeyStates();
    if(queueIndex >= queue.length){
      queue = buildQueue();
      queueIndex = 0;
    }
    const target = queue[queueIndex];
    if(isShortcutMode()){
      fingerLabelEl.textContent = '雙手';
      targetLabelEl.textContent = target.label;
      if(target.osLevel){
        physicalKeyHintEl.textContent = `（用途：${target.desc}／此鍵由系統接管，請勿實際按下，比出手勢後按「下一題」）`;
        comboManualNextBtn.style.display = 'inline-block';
      } else {
        physicalKeyHintEl.textContent = `（用途：${target.desc}）`;
        comboManualNextBtn.style.display = 'none';
      }
      if(settings.hint){
        comboKeyEls(target).forEach(el=>el.classList.add('target'));
      }
      dotsEl.style.display = 'flex';
      textPassageEl.classList.remove('show');
      singleTargetWrapEl.style.display = 'inline';
      passageTargetWrapEl.style.display = 'none';
      renderDots();
      applyBalloonDisplay(); // 【新增】快速鍵課程不套用氣球模式，這裡只負責把天空收起來
      return;
    }
    let physicalChar, finger, displayLabel;
    if(isZhuyinMode() && target !== ' '){
      physicalChar = zhuyinToChar[target];
      finger = zhuyinFingerMap[target];
      displayLabel = target;
      physicalKeyHintEl.textContent = physicalChar ? `（實體按鍵：${physicalChar.toUpperCase()}）` : '';
    } else {
      physicalChar = target;
      finger = keyElByChar[target] ? keyElByChar[target].dataset.finger : undefined;
      displayLabel = target === ' ' ? '␣ 空白鍵' : target.toUpperCase();
      physicalKeyHintEl.textContent = '';
    }
    fingerLabelEl.textContent = fingerLabel[finger];
    targetLabelEl.textContent = displayLabel;
    if(settings.hint && physicalChar && keyElByChar[physicalChar]){
      keyElByChar[physicalChar].classList.add('target');
    }
    const passageMode = isPassageMode();
    dotsEl.style.display = passageMode ? 'none' : 'flex';
    textPassageEl.classList.toggle('show', passageMode);
    singleTargetWrapEl.style.display = passageMode ? 'none' : 'inline';
    passageTargetWrapEl.style.display = passageMode ? 'inline' : 'none';
    if(passageMode){
      renderPassage();
    } else {
      renderDots();
    }
    applyBalloonDisplay(); // 【新增】氣球模式時改成畫天空與氣球（會覆蓋上面的字卡／整段文字顯示）
  }

  // ---------- Sound ----------
  let audioCtx = null;
  function beep(freq, dur){
    if(!settings.sound) return;
    try{
      audioCtx = audioCtx || new (window.AudioContext||window.webkitAudioContext)();
      const osc = audioCtx.createOscillator();
      const gain = audioCtx.createGain();
      osc.type = 'sine';
      osc.frequency.value = freq;
      gain.gain.setValueAtTime(0.06, audioCtx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.0001, audioCtx.currentTime+dur);
      osc.connect(gain).connect(audioCtx.destination);
      osc.start();
      osc.stop(audioCtx.currentTime+dur);
    }catch(e){}
  }

  // ---------- Accuracy ----------
  function updateAccuracy(){
    // 【修改】total===0（完全沒按過鍵）時不再預設顯示 100%，改顯示「－」，
    // 避免使用者一眼看到 100% 誤以為「打得很好」，其實只是還沒開始打字
    const total = correct + wrong;
    const rate = total===0 ? null : Math.round((correct/total)*100);
    accuracyNumEl.textContent = rate===null ? '－' : rate + '%';
  }

  // ---------- Speed (字/分) ----------
  function getElapsedSeconds(){
    return TOTAL_TIME === Infinity ? infiniteElapsed : (TOTAL_TIME - timeLeft);
  }
  function updateSpeed(){
    const elapsed = getElapsedSeconds() - speedBaselineElapsed;
    const speed = elapsed <= 0 ? 0 : Math.round((correct / elapsed) * 60);
    speedNumEl.textContent = speed;
  }

  // ---------- Streak toast ----------
  function showStreakToast(n){
    streakToastEl.textContent = `🔥 連續 ${n} 次全對！`;
    streakToastEl.classList.add('show');
    clearTimeout(streakToastTimer);
    streakToastTimer = setTimeout(()=>streakToastEl.classList.remove('show'),1200);
  }

  // ---------- 打字小遊戲：文字賽跑的畫面更新與加減規則 ----------
  // 折返跑：每跑滿一趟（RACE_LAP）就轉向一次，累積總步數 racePos 才是拿來比的距離，不受跑道寬度限制
  function posToPct(pos){
    const leg = Math.floor(pos / RACE_LAP);   // 第幾趟（偶數趟往右、奇數趟往左）
    const inLeg = pos % RACE_LAP;
    return (leg % 2 === 0) ? (inLeg / RACE_LAP) * 100 : 100 - (inLeg / RACE_LAP) * 100;
  }
  function updateRaceVisual(){
    raceRunnerEl.style.left = posToPct(racePos) + '%';
    raceProgressLabelEl.textContent = Math.round(racePos) + ' 步';
  }
  // 依 RACE_OPPONENTS 初始化／歸零對手狀態
  function initOpponentState(){
    opponentState = {};
    RACE_OPPONENTS.forEach(o=>{
      opponentState[o.id] = { pos:0, adaptiveFactor:1.00, adaptiveTarget:1.00, rerollIn:2 };
      updateOpponentVisual(o);
    });
  }
  function updateOpponentVisual(o){
    const st = opponentState[o.id];
    const runnerEl = document.getElementById('raceRunner-'+o.id);
    const labelEl = document.getElementById('raceProgressLabel-'+o.id);
    if(runnerEl) runnerEl.style.left = posToPct(st.pos) + '%';
    if(labelEl) labelEl.textContent = Math.round(st.pos) + ' 步';
  }
  // 每秒（掛在 tick() 上）呼叫一次：對手依節奏公式持續前進，直到本輪時間結束
  function updateOpponents(){
    if(!settings.raceGame) return;
    RACE_OPPONENTS.forEach(o=>{
      const st = opponentState[o.id];
      let pace;
      if(o.paceMode === 'adaptive'){
        // 貼身對手：每2~3秒重抽一次目標倍率，中間平滑過渡，避免速度抖動
        st.rerollIn--;
        if(st.rerollIn <= 0){
          st.adaptiveTarget = 0.95 + Math.random() * 0.10;
          st.rerollIn = 2 + Math.floor(Math.random() * 2);
        }
        st.adaptiveFactor += (st.adaptiveTarget - st.adaptiveFactor) * 0.3;
        pace = getPlayerPaceForRace() * st.adaptiveFactor;
      } else {
        pace = getPlayerPaceForRace() * o.factor;
      }
      st.pos += pace / 60; // pace是「字/分」，換算成這一秒前進多少步
      updateOpponentVisual(o);
    });
  }
  function resetRace(){
    racePos = 0;
    updateRaceVisual();
    initOpponentState();
  }
  // delta：+1（打對前進）或 -1（打錯後退）；距離不設上限，最低為0
  function raceStep(delta){
    if(!settings.raceGame) return;
    racePos = Math.max(0, racePos + delta);
    updateRaceVisual();
  }

  // ---------- 【新增】亂打防呆：連續打錯 N 次就鎖住鍵盤幾秒（時間照常倒數）----------
  const LOCK_AFTER_WRONG = 5; // 連續打錯幾次觸發
  const LOCK_SECONDS = 5;     // 鎖住幾秒
  let wrongStreak = 0;        // 目前連續打錯次數（打對就歸零）
  let locked = false;
  let lockoutId = null;
  const lockoutOverlayEl = document.getElementById('lockoutOverlay');

  function clearLockout(){
    clearTimeout(lockoutId);
    lockoutId = null;
    locked = false;
    wrongStreak = 0;
    lockoutOverlayEl.classList.remove('show');
  }
  function startLockout(){
    locked = true;
    clearKeyStates();
    lockoutOverlayEl.classList.add('show');
    clearTimeout(lockoutId);
    lockoutId = setTimeout(()=>{
      clearLockout();
      if(started && !ended) showTarget(); // 恢復「下一個要按的鍵」高亮
    }, LOCK_SECONDS * 1000);
  }
  // 每次判定後呼叫：打對歸零、打錯累加，達門檻就鎖住
  function noteResult(isCorrect){
    if(isCorrect){ wrongStreak = 0; return; }
    wrongStreak++;
    if(wrongStreak >= LOCK_AFTER_WRONG) startLockout();
  }

  // ---------- Key handling ----------
  function handleKey(ch){
    if(ended || !started || locked) return;
    const target = queue[queueIndex];
    const keyEl = keyElByChar[ch];
    const pressedValue = isZhuyinMode() ? (ch === ' ' ? ' ' : charToZhuyin[ch]) : ch;
    const isMatch = pressedValue !== undefined && pressedValue === target;
    if(isMatch){
      correct++; score += 10;
      streak++;
      if(streak > bestStreak) bestStreak = streak;
      if(streak % 5 === 0) showStreakToast(streak);
      if(keyEl){
        keyEl.classList.remove('target');
        keyEl.classList.add('correct');
        setTimeout(()=>keyEl.classList.remove('correct'),160);
      }
      beep(660,0.12);
      raceStep(1);
      noteResult(true); // 【新增】
      queueIndex++;
      showTarget();
    } else if(keyElByChar[ch]){
      wrong++;
      wrongCounts[target] = (wrongCounts[target] || 0) + 1;
      streak = 0;
      keyEl.classList.add('wrong');
      setTimeout(()=>keyEl.classList.remove('wrong'),280);
      beep(180,0.18);
      raceStep(-1);
      balloonWrong(); // 【新增】氣球模式：目標氣球晃動、忍者往後仰
      if(isPassageMode()){
        const currentSpan = textPassageEl.children[queueIndex];
        if(currentSpan){
          currentSpan.classList.add('wrong-flash');
          setTimeout(()=>currentSpan.classList.remove('wrong-flash'),280);
        }
      }
      noteResult(false); // 【新增】
    }
    correctNumEl.textContent = correct;
    wrongNumEl.textContent = wrong;
    scoreNumEl.textContent = score;
    streakNumEl.textContent = streak;
    updateAccuracy();
  }

  // ---------- 快速鍵課程的按鍵判定 ----------
  function highlightComboKeys(target, cls, duration){
    const els = comboKeyEls(target);
    els.forEach(el=>{ el.classList.remove('target'); el.classList.add(cls); });
    setTimeout(()=>{ els.forEach(el=>el.classList.remove(cls)); }, duration);
  }
  // 判定「修飾鍵狀態」是否吻合目前這個快速鍵組合，並記錄對錯、更新統計。
  // 鍵盤事件（KeyboardEvent）與滑鼠/觸控點擊（合成的修飾鍵狀態）都共用這一段邏輯。
  function attemptShortcut(target, mods){
    const requiredMods = target.keys.slice(0, -1);
    const matches = (mods.ctrlKey === requiredMods.includes('ctrl')) &&
                     (mods.shiftKey === requiredMods.includes('shift')) &&
                     (mods.altKey === requiredMods.includes('alt')) &&
                     (mods.metaKey === requiredMods.includes('win'));
    if(matches){
      correct++; score += 10; streak++;
      if(streak > bestStreak) bestStreak = streak;
      if(streak % 5 === 0) showStreakToast(streak);
      highlightComboKeys(target, 'correct', 160);
      beep(660, 0.12);
      raceStep(1);
      noteResult(true); // 【新增】
      queueIndex++;
      showTarget();
    } else {
      wrong++;
      wrongCounts[target.label] = (wrongCounts[target.label] || 0) + 1;
      streak = 0;
      highlightComboKeys(target, 'wrong', 280);
      beep(180, 0.18);
      raceStep(-1);
      noteResult(false); // 【新增】
    }
    correctNumEl.textContent = correct;
    wrongNumEl.textContent = wrong;
    scoreNumEl.textContent = score;
    streakNumEl.textContent = streak;
    updateAccuracy();
  }
  function handleShortcutKey(e){
    const target = queue[queueIndex];
    if(target.osLevel) return; // 系統層級快速鍵改用「下一題」按鈕手動確認，不監聽實際按鍵
    const main = target.keys[target.keys.length-1];
    const pressedKey = e.key.toLowerCase();
    // 只有按下「主鍵」時才判定；同時攔截任何 Ctrl/Win 組合，降低跳出瀏覽器功能（尋找、儲存…）的機率
    if(e.ctrlKey || e.metaKey) e.preventDefault();
    if(pressedKey !== main) return;
    e.preventDefault();
    attemptShortcut(target, {ctrlKey:e.ctrlKey, shiftKey:e.shiftKey, altKey:e.altKey, metaKey:e.metaKey});
  }

  // 點擊/觸控畫面鍵盤時的判定邏輯，行為盡量比照實體鍵盤的 keydown：
  // - 尚未開始時，點空白鍵視同按空白鍵開始倒數
  // - 一般課程：點到的字元直接送進 handleKey() 判定
  // - 快速鍵課程：系統層級（osLevel）快速鍵不支援點擊，需改用「已比出手勢，下一題」按鈕；
  //   一般組合鍵則只有點到「主鍵」才判定，並用點擊當下滑鼠/觸控事件本身的 ctrlKey/shiftKey 等
  //   修飾鍵狀態去比對（也就是使用者仍需實際按住 Ctrl 等鍵、用滑鼠點主鍵）
  function onscreenKeyClick(k, e){
    if(ended || locked) return; // 【修改】鎖定期間不接受點擊
    if(!started){
      if(k.char === ' ' && !counting) startCountdown();
      return;
    }
    if(isShortcutMode()){
      const target = queue[queueIndex];
      if(target.osLevel) return; // 系統層級快速鍵：點畫面鍵盤沒有作用，請改按「下一題」按鈕
      const main = target.keys[target.keys.length-1];
      if(!k.char || k.char !== main) return;
      attemptShortcut(target, {ctrlKey:!!e.ctrlKey, shiftKey:!!e.shiftKey, altKey:!!e.altKey, metaKey:!!e.metaKey});
      return;
    }
    if(!k.char) return; // Tab / Shift / Enter 等特殊鍵不參與一般打字判定
    handleKey(k.char);
  }

  window.addEventListener('keydown', (e)=>{
    // 【新增】不在打字練習畫面時（例如停在課程首頁或打字紀錄頁）不接收按鍵，
    // 否則在首頁按空白鍵會偷偷觸發看不見的倒數與計分
    if(practiceViewEl.style.display === 'none') return;
    if(ended) return;
    if(locked){ e.preventDefault(); return; } // 【新增】鎖定期間吃掉所有按鍵
    const k = e.key.toLowerCase();
    if(k===' ' || k==='tab') e.preventDefault();
    if(!started){
      if(k===' ' && !counting) startCountdown(); // 按空白鍵才開始倒數
      return; // 尚未開始或倒數準備中，先不觸發按鍵效果與計分
    }
    // 手指按住不放時，瀏覽器會自動連續觸發多次 keydown（e.repeat===true）；
    // 這種「自動重複」不算玩家又打了一次，直接忽略，避免正確率被灌爆。
    if(e.repeat) return;
    if(isShortcutMode()){
      handleShortcutKey(e);
      return;
    }
    if(keyElByChar[k]){
      e.preventDefault();
      keyElByChar[k].classList.add('pressed');
    }
    handleKey(k);
  });

  window.addEventListener('keyup', (e)=>{
    const k = e.key.toLowerCase();
    if(keyElByChar[k]) keyElByChar[k].classList.remove('pressed');
  });

  // ---------- Timer ----------
  function tick(){
    if(TOTAL_TIME === Infinity){
      infiniteElapsed++;
      const m = Math.floor(infiniteElapsed/60), s = infiniteElapsed%60;
      timeNumEl.textContent = m+':'+String(s).padStart(2,'0');
      updateSpeed();
      updateOpponents(); // 【新增】每秒讓對手依節奏公式前進（只在 settings.raceGame 開啟時生效）
      return;
    }
    timeLeft--;
    if(timeLeft<=0){
      timeLeft=0;
      endSession();
    }
    const m = Math.floor(timeLeft/60), s = timeLeft%60;
    timeNumEl.textContent = m+':'+String(s).padStart(2,'0');
    updateSpeed();
    updateOpponents(); // 【新增】同上，一般計時模式也一樣掛在 tick() 上
  }
  function startTimer(){
    clearInterval(timerId);
    timerId = setInterval(tick,1000);
  }
  function endSession(){
    clearLockout(); // 【新增】時間到時解除鎖定
    ended = true;
    clearInterval(timerId);
    trayEl.classList.add('ended');
    clearKeyStates();
    endInfiniteBtn.style.display = 'none';
    comboManualNextBtn.style.display = 'none';

    const totalAttempts = correct + wrong; // 【新增】這一輪總共按了幾次鍵（正確+錯誤），用來判斷樣本夠不夠
    finalScoreEl.textContent = score;
    finalCorrectEl.textContent = correct;
    finalWrongEl.textContent = wrong;
    finalAccuracyEl.textContent = accuracyNumEl.textContent;
    finalAccuracyEl.classList.remove('small'); // 【新增】預設用大數字，樣本太少時才縮小
    finalSampleNoteEl.textContent = totalAttempts>0 ? `(共${totalAttempts}次)` : ''; // 【新增】正確率旁標註樣本數，方便自行判斷這個百分比有沒有參考價值
    finalSpeedEl.textContent = speedNumEl.textContent;
    finalStreakEl.textContent = bestStreak;

    // 【新增】依「這一輪總共按了幾次鍵」分三種情況顯示不同的結算內容：
    // 1) 完全沒打字：不顯示歸零的數字統計，只給一句引導文字
    // 2) 打了但次數太少（< MIN_VALID_ATTEMPTS）：正確率改顯示「樣本太少」，避免 1 次全對就顯示 100% 誤導
    // 3) 樣本足夠：正常結算，維持原本「顯示最容易錯的鍵／全部打對」邏輯
    // 【新增】每次結算前先還原標題顯示，避免上一輪「成功結算」把它隱藏後，這一輪變成「沒打字」卻沒把標題顯示回來
    resultTitleEl.style.display = '';

    if(totalAttempts === 0){
      resultTitleEl.textContent = '🙂 這一輪還沒開始打字喔';
      resultStatsEl.style.display = 'none';
      mistakesLineEl.textContent = '跟著鍵盤上的提示打打看，按「重設」再試一次！';
      mistakeCharsForDrill = [];
      drillMistakesBtn.style.display = 'none';
    } else if(totalAttempts < MIN_VALID_ATTEMPTS && !balloonEndedByLives){ // 【修改】忍者抓氣球生命值扣完時，即使打字次數不多也照樣顯示分數，不套用「樣本太少」的判定
      resultTitleEl.textContent = '⏱️ 這一輪打太少次了';
      resultStatsEl.style.display = 'grid';
      finalAccuracyEl.textContent = '樣本太少';
      finalAccuracyEl.classList.add('small'); // 【新增】文字較長，改用小字級避免撐破格子
      mistakesLineEl.textContent = `再多打${MIN_VALID_ATTEMPTS}次以上，正確率才有參考價值，這輪不會列入打字紀錄，再試一次吧！`;
      mistakeCharsForDrill = [];
      drillMistakesBtn.style.display = 'none';
    } else {
      // 【修改】不需要「🎉 時間到！這一輪的成績」這句話，下面已經有成績網格可以看，標題直接隱藏
      resultTitleEl.style.display = 'none';
      resultStatsEl.style.display = 'grid';
      const allMistakeEntries = Object.entries(wrongCounts).sort((a,b)=>b[1]-a[1]);
      const mistakes = allMistakeEntries.slice(0,3);
      if(mistakes.length && isShortcutMode()){
        // 快速鍵課程：只顯示文字統計，不提供逐鍵「加強練習」（組合鍵不適合用單鍵佇列重播）
        const label = mistakes.map(([lbl,n])=> lbl + '×' + n).join('、');
        mistakesLineEl.textContent = '最容易搞混的快速鍵：' + label;
        mistakeCharsForDrill = [];
        drillMistakesBtn.style.display = 'none';
      } else if(mistakes.length){
        const label = mistakes.map(([ch,n])=> (ch===' '?'␣':ch.toUpperCase()) + '×' + n).join('、');
        mistakesLineEl.textContent = '最容易按錯的鍵：' + label;
        mistakeCharsForDrill = allMistakeEntries.map(([ch])=>ch);
        drillMistakesBtn.style.display = 'inline-block';
      } else {
        // 【修改】全對時不需要「這一輪全部打對，太厲害了！」這種稱讚話術，直接留空、不顯示這行文字
        mistakesLineEl.textContent = '';
        mistakeCharsForDrill = [];
        drillMistakesBtn.style.display = 'none';
      }
    }

    bubbleNormalEl.style.display = 'none';
    keyHintBarEl.style.display = 'none';
    mascotRowEl.style.display = ''; // 【新增】結束時把泡泡區塊還原顯示（氣球模式進行中會被 applyBalloonDisplay 整塊隱藏），確保看得到成績
    balloonSkyEl.classList.remove('show'); // 【新增】結束時一併收起氣球天空，把版面讓給結算卡片
    dotsEl.style.display = 'none'; // 【新增】結束時隱藏中間「單鍵佇列」預覽，避免跟上方結算卡片同時出現顯得雜亂
    textPassageEl.classList.remove('show'); // 【新增】結束時隱藏中間「文章模式」的文字內容，同上
    bubbleEndedEl.style.display = 'block';
    // 【新增】「重新開始」與「下一關」不像「加強練習這些鍵」要看有沒有錯誤鍵才出現，只要結束了就一律顯示；
    // 「下一關」只在目前這個大課程底下有超過 1 課可以換的時候才顯示（理論上每個大課程都有好幾課，這裡只是防呆）
    resultRestartBtn.style.display = 'inline-block';
    resultNextLessonBtn.style.display = Object.keys(activeLessonSet()).length > 1 ? 'inline-block' : 'none';
    resultHomeBtn.style.display = 'inline-block'; // 【新增】結束就一律顯示，方便回課程首頁挑下一課
    updateStartBtnLabel();
    // 【修改】只有樣本數足夠（總按鍵次數 ≥ MIN_VALID_ATTEMPTS）才寫進打字紀錄；
    // 完全沒打字或打太少次都不列入，避免紀錄頁被一堆「0分／樣本太少」的無意義資料灌爆
    // 【修改】「🎯 加強練習複習」（drillChars 模式）不列入打字紀錄：這只是針對錯誤鍵的臨時複習，
    // 不是正式課程進度，混進紀錄頁只會干擾查看真正的課程表現，所以額外排除
    if(totalAttempts >= MIN_VALID_ATTEMPTS && !(drillChars && drillChars.length)){
      addHistoryRecord({
        ts: Date.now(),
        course: currentCourse,
        lessonName: activeLesson().name,
        score, correct, wrong,
        accuracy: accuracyNumEl.textContent,
        speed: speedNumEl.textContent,
        bestStreak,
        duration: getElapsedSeconds()
      });
      // 【新增】同一個條件下，也把這一課標記成「已完成」寫進課程進度（給課程首頁的卡片打勾用），
      // 並保留歷史最佳的正確率／速度顯示在卡片右下角
      markLessonDone(currentCourse, activeLessonKey(), {
        accuracy: parseInt(accuracyNumEl.textContent, 10),
        speed: parseInt(speedNumEl.textContent, 10)
      });
    }
    // 【刪除】結束時原本會在賽道下方跳出「⏰ 時間到！你 X 步、對手 Y 步，...」的訊息；
    // 你／對手的步數本來就常駐顯示在賽道下方的資訊列，這裡不再重複顯示
  }

  function resetAll(){
    syncAutoTime(); // 【新增】若目前是自動時間模式，先依當下課程／加強練習內容重新算出 TOTAL_TIME
    clearLockout(); // 【新增】重新開始時解除鎖定
    zySeqIndex = 0; // 【新增】重新開始／切換課程時，「依序」課程要從第一個字（ㄅ）重新算起，避免接到上一輪或上一課的位置
    ended = false;
    started = false;
    counting = false;
    clearInterval(timerId);
    clearInterval(countdownId);
    updateStartBtnLabel();
    score=0; correct=0; wrong=0; timeLeft=TOTAL_TIME;
    infiniteElapsed = 0;
    speedBaselineElapsed = 0;
    resetRace();
    streak=0; bestStreak=0;
    wrongCounts = {};
    queue = buildQueue();
    queueIndex = 0;
    trayEl.classList.remove('ended');
    scoreNumEl.textContent=0; correctNumEl.textContent=0; wrongNumEl.textContent=0;
    accuracyNumEl.textContent='－';
    speedNumEl.textContent='0';
    streakNumEl.textContent=0;
    streakToastEl.classList.remove('show');
    endInfiniteBtn.style.display = 'none';
    comboManualNextBtn.style.display = 'none';
    if(TOTAL_TIME === Infinity){
      timeNumEl.textContent = '0:00';
    } else {
      const m0 = Math.floor(TOTAL_TIME/60), s0 = TOTAL_TIME%60;
      timeNumEl.textContent = m0+':'+String(s0).padStart(2,'0');
    }
    bubbleEndedEl.style.display = 'none';
    bubbleCountdownEl.style.display = 'none';
    bubbleNormalEl.style.display = 'none';
    keyHintBarEl.style.display = 'none';
    mistakesLineEl.textContent = '';
    bubbleWaitingEl.style.display = 'block';
    if(drillChars && drillChars.length){
      const keysLabel = drillChars.map(c=>c===' '?'␣':c.toUpperCase()).join('、');
      lessonInfoNameEl.textContent = '🎯 加強練習模式';
      lessonInfoDescEl.textContent = `反覆練習最容易按錯的鍵（${keysLabel}）－按「返回一般練習」可切回課程`;
      lessonSelectEl.title = '加強練習模式（錯誤鍵複習）';
      exitDrillBtn.style.display = 'inline-block';
    } else {
      const lesson = activeLesson();
      const levelLabel = lesson.level === 'beginner' ? '🌱 初學' : '🚀 進階';
      lessonInfoNameEl.innerHTML = `${lesson.name} <span class="badge">${levelLabel}</span>`;
      lessonInfoDescEl.textContent = lesson.desc;
      lessonSelectEl.title = `${lesson.name}：${lesson.desc}`;
      exitDrillBtn.style.display = 'none';
    }
    clearKeyStates();
    const passageMode = isPassageMode();
    dotsEl.style.display = passageMode ? 'none' : 'flex';
    textPassageEl.classList.toggle('show', passageMode);
    if(passageMode){
      renderPassage();
    } else {
      renderDots();
    }
    balloonMsgEl.textContent = '按 Space 開始，打出忍者面前那顆氣球上的字'; // 【新增】重設時還原提示字
    balloonBatchStart = -1; // 【修改】重設後下一次畫氣球要重新起一批（原本叫 balloonRendered）
    balloonSlotEls = [];    // 【新增】清掉上一輪殘留的氣球元素參照
    balloonLivesLeft = BALLOON_LIVES_MAX; // 【新增】重設時生命值補回滿血（3 次）
    balloonEndedByLives = false;          // 【新增】清掉上一輪「因生命值歸零而結束」的標記
    if(ninjaRideTimer){ clearTimeout(ninjaRideTimer); ninjaRideTimer = null; } 
    balloonNinjaEl.classList.remove('riding'); 
    balloonNinjaEl.classList.remove('hide'); // 移除隱藏，保持顯示
    if(balloonStartMarkerEl) {
      balloonStartMarkerEl.classList.remove('hide');
      balloonStartMarkerEl.classList.remove('fall-floor');
      balloonStartMarkerEl.style.opacity = '1';
      balloonStartMarkerEl.style.transform = '';
      balloonStartMarkerEl.style.pointerEvents = 'auto';
    }
    currentBalloonFallMs = BALLOON_BASE_FALL_MS; // 重設時恢復基礎速度
    document.documentElement.style.setProperty('--fall-duration', currentBalloonFallMs + 'ms');
    
    renderBalloonLives();                 
    applyBalloonDisplay();
  }

  // ---------- Pre-round countdown（顯示在左上角泡泡內，不遮住鍵盤；氣球模式改顯示在畫面正中間） ----------
  function startCountdown(){
    if(counting || started) return;
    counting = true;
    clearInterval(countdownId);
    const balloonMode = isBalloonMode(); // 【新增】氣球模式：倒數期間不用左上角泡泡，改把倒數數字顯示在遊戲畫面正中間（balloonMsgEl）
    bubbleWaitingEl.style.display = 'none';
    bubbleCountdownEl.style.display = balloonMode ? 'none' : 'block'; // 【修改】氣球模式不顯示左上角倒數泡泡
    let n = 3;
    countdownBubbleNumEl.textContent = n;
    balloonMsgEl.textContent = n; // 【修改】原本固定寫死「準備…」，改成跟左上角一樣顯示實際倒數數字，並顯示在畫面中間
    countdownBubbleNumEl.classList.remove('pop');
    void countdownBubbleNumEl.offsetWidth; // 重新觸發進場動畫
    countdownBubbleNumEl.classList.add('pop');
    beep(440, 0.08);
    countdownId = setInterval(()=>{
      n--;
      if(n > 0){
        countdownBubbleNumEl.textContent = n;
        balloonMsgEl.textContent = n; // 【新增】同步更新畫面中間的倒數數字
        countdownBubbleNumEl.classList.remove('pop');
        void countdownBubbleNumEl.offsetWidth;
        countdownBubbleNumEl.classList.add('pop');
        beep(440, 0.08);
      } else {
        clearInterval(countdownId);
        countdownBubbleNumEl.textContent = '開始！';
        balloonMsgEl.textContent = '開始！'; // 【新增】同步更新畫面中間的文字
        countdownBubbleNumEl.classList.remove('pop');
        void countdownBubbleNumEl.offsetWidth;
        countdownBubbleNumEl.classList.add('pop');
        beep(660, 0.16);
        setTimeout(()=>{
            counting = false;
            bubbleCountdownEl.style.display = 'none';
            if(!balloonMode){ 
              bubbleNormalEl.style.display = 'block';
              keyHintBarEl.style.display = 'block';
            }
            started = true;
            updateStartBtnLabel();
            endInfiniteBtn.style.display = (TOTAL_TIME === Infinity) ? 'inline-block' : 'none';
            showTarget();
            startTimer();
            if(balloonMode){
              startBalloonFallCountdown(balloonStartMarkerEl); // 忍者在星號上開始落下
              if(balloonStartMarkerEl) {
                popBalloon(balloonStartMarkerEl); // 星號也跟著掉落
              }
            }
          }, 450);
      }
    }, 700);
  }

  // ---------- Settings ----------
  const settings = {hint:true, finger:true, sound:true, keyLetter:true, keyZhuyin:false, keySymbol:false, raceGame:false, fingerVivid:false, keyboard:true, balloonGame:false}; // fingerVivid：指法顏色是否加深（預設淺色）；keyLetter/keyZhuyin/keySymbol 的初始值由 applyKeycapDisplayDefaults() 依課程覆寫；【新增】keyboard：是否顯示鍵盤圖（Keyboard Guide）；【新增】balloonGame：忍者抓氣球遊戲模式
  const settingsBtn = document.getElementById('menuBtn');
  const sidebarEl = document.getElementById('sidebar');
  const sidebarOverlayEl = document.getElementById('sidebarOverlay');
  const sidebarCloseBtn = document.getElementById('sidebarCloseBtn');
  function openSidebar(){
    sidebarEl.classList.add('open');
    sidebarOverlayEl.classList.add('open');
  }
  function closeSidebar(){
    sidebarEl.classList.remove('open');
    sidebarOverlayEl.classList.remove('open');
  }
  settingsBtn.addEventListener('click', openSidebar);
  sidebarCloseBtn.addEventListener('click', closeSidebar);
  sidebarOverlayEl.addEventListener('click', closeSidebar);

  function bindToggle(id, key, onChange){
    const el = document.getElementById(id);
    el.addEventListener('click', ()=>{
      if(el.classList.contains('disabled')) return; // 被鎖住時（例如注音打字模式已開）不回應點擊
      settings[key] = !settings[key];
      el.classList.toggle('on', settings[key]);
      if(onChange) onChange();
    });
  }
  // 【新增】顯示／隱藏鍵盤（Keyboard Guide）：
  // 關閉時在 <body> 掛上 .no-keyboard（CSS 會藏掉鍵盤托盤、把練習內容放大攤開），
  // 並重建佇列（隱藏鍵盤時一次給比較多題，見 buildQueue 的 qLen / scale）。
  // 側欄開關與頂部列的「⌨️ 鍵盤」按鈕共用這個函式，兩邊狀態永遠一致。
  const keyboardToggleBtnEl = document.getElementById('keyboardToggleBtn');
  const toggleKeyboardEl = document.getElementById('toggleKeyboard');
  function applyKeyboardVisibility(){
    document.body.classList.toggle('no-keyboard', !settings.keyboard);
    toggleKeyboardEl.classList.toggle('on', settings.keyboard);
    keyboardToggleBtnEl.classList.toggle('toggle-off', !settings.keyboard);
    keyboardToggleBtnEl.textContent = settings.keyboard ? '⌨️ 鍵盤' : '⌨️ 鍵盤（已隱藏）';
  }
  function setKeyboardVisible(on){
    settings.keyboard = on;
    applyKeyboardVisibility();
    resetAll(); // 佇列長度會跟著改變，視同重設本輪練習
  }
  toggleKeyboardEl.addEventListener('click', ()=>{
    if(toggleKeyboardEl.classList.contains('disabled')) return; // 【新增】氣球遊戲中鍵盤開關暫時鎖住，不回應點擊
    setKeyboardVisible(!settings.keyboard);
  });
  keyboardToggleBtnEl.addEventListener('click', ()=>{ setKeyboardVisible(!settings.keyboard); });

  bindToggle('toggleHint','hint', ()=>{
    clearKeyStates();
    if(settings.hint && started && !ended){
      const t = queue[queueIndex];
      if(isShortcutMode()){
        comboKeyEls(t).forEach(el=>el.classList.add('target'));
      } else {
        const pc = isZhuyinMode() && t!==' ' ? zhuyinToChar[t] : t;
        if(pc && keyElByChar[pc]) keyElByChar[pc].classList.add('target');
      }
    }
  });
  bindToggle('toggleFinger','finger', ()=>{ keyboardEl.classList.toggle('show-fingers', settings.finger); });
  bindToggle('toggleFingerVivid','fingerVivid', ()=>{ keyboardEl.classList.toggle('vivid-fingers', settings.fingerVivid); }); // 【新增】切換指法顏色濃淡
  bindToggle('toggleSound','sound');
  const toggleKeyLetterEl = document.getElementById('toggleKeyLetter');
  const toggleKeyZhuyinEl = document.getElementById('toggleKeyZhuyin');
  const toggleKeySymbolEl = document.getElementById('toggleKeySymbol');
  // 【新增】「鍵帽加字母」與「鍵帽加注音」互相保護：兩者至少要留一層開著，
  // 不然鍵帽會完全空白、看不出對應鍵位。點擊會讓兩者同時變 off 的那一下會被擋下，
  // 並讓開關小晃動一下當作回饋，而不是靜默無反應。
  function bindKeycapLayerToggle(id, key, otherKey, keyboardClass){
    const el = document.getElementById(id);
    el.addEventListener('click', ()=>{
      const turningOff = settings[key];
      if(turningOff && !settings[otherKey]){
        el.classList.remove('locked-shake');
        void el.offsetWidth; // 強制 reflow，讓同一個動畫可以連續觸發
        el.classList.add('locked-shake');
        return;
      }
      settings[key] = !settings[key];
      el.classList.toggle('on', settings[key]);
      keyboardEl.classList.toggle(keyboardClass, settings[key]);
    });
  }
  bindKeycapLayerToggle('toggleKeyLetter','keyLetter','keyZhuyin','show-letter');
  bindKeycapLayerToggle('toggleKeyZhuyin','keyZhuyin','keyLetter','show-zhuyin');
  bindToggle('toggleKeySymbol','keySymbol', ()=>{ keyboardEl.classList.toggle('show-symbol', settings.keySymbol); });
  // 【修改】原本「鍵帽顯示注音」在注音課程時會被鎖住、強制開啟；
  // 現在字母／注音／符號三個開關彼此獨立，使用者在任何課程都能自由組合。
  // 唯一保留的行為是：切換「英打／注音」大課程時，套用該課程慣用的預設組合
  // (英數鍵盤預設只顯字母；注音鍵盤預設只顯注音)，之後使用者仍可自行調整。
  function applyKeycapDisplayDefaults(){
    const zhuyin = isZhuyinMode();
    settings.keyLetter = !zhuyin;
    settings.keyZhuyin = zhuyin;
    settings.keySymbol = false;
    toggleKeyLetterEl.classList.toggle('on', settings.keyLetter);
    toggleKeyZhuyinEl.classList.toggle('on', settings.keyZhuyin);
    toggleKeySymbolEl.classList.toggle('on', settings.keySymbol);
    keyboardEl.classList.toggle('show-letter', settings.keyLetter);
    keyboardEl.classList.toggle('show-zhuyin', settings.keyZhuyin);
    keyboardEl.classList.toggle('show-symbol', settings.keySymbol);
    keyboardEl.classList.toggle('zhuyin-emphasis', zhuyin);
  }

  function renderLessonOptions(){
    const source = activeLessonSet();
    lessonDropdownMenuEl.innerHTML = '';
    const keys = Object.keys(source);
    // 【修改】原本只依 level 分「🌱初學／🚀進階」兩組；現在如果課程資料裡有更細的 group 欄位
    // （目前只有「英打基礎」的每一課有標，依首排/首排+下排/三排全字母/數字排分），就改用 group 分組，
    // 讓 22 課的長清單拆成 4 個小群組、方便掃視與跳選；沒有 group 欄位的課程照舊用 level 分兩組
    const groupOf = key => source[key].group || (source[key].level === 'beginner' ? '🌱 初學' : '🚀 進階');
    const orderedGroups = [];
    keys.forEach(key=>{
      const g = groupOf(key);
      if(!orderedGroups.includes(g)) orderedGroups.push(g);
    });
    // 【修改】原本用 <optgroup> 分組，現在改成手動組出群組標題＋項目 div（見上方 .lesson-dropdown-* 樣式）
    orderedGroups.forEach(g=>{
      const groupKeys = keys.filter(k=>groupOf(k)===g);
      if(!groupKeys.length) return;
      const groupEl = document.createElement('div');
      groupEl.className = 'lesson-dropdown-group';
      groupEl.textContent = g;
      lessonDropdownMenuEl.appendChild(groupEl);
      groupKeys.forEach(key=>{
        const item = document.createElement('div');
        item.className = 'lesson-dropdown-item';
        // 【修改】原本只放課名文字；現在多一個勾勾欄位（實際要不要顯示交給 syncLessonSelectDisplay 依進度決定）
        item.innerHTML = '<span class="item-check"></span><span class="item-name"></span>';
        item.querySelector('.item-name').textContent = source[key].name;
        item.dataset.key = key;
        lessonDropdownMenuEl.appendChild(item);
      });
    });
    syncLessonSelectDisplay();
  }

  // 【新增】把目前選到的小課程同步反映到按鈕文字，以及清單裡哪一項要顯示成「已選取」
  function syncLessonSelectDisplay(){
    const activeKey = activeLessonKey();
    lessonDropdownMenuEl.querySelectorAll('.lesson-dropdown-item').forEach(item=>{
      item.classList.toggle('selected', item.dataset.key === activeKey);
      // 【新增】完成過的課程在課名前加勾勾，跟課程首頁卡片的狀態一致
      const check = item.querySelector('.item-check');
      if(check){
        const p = getLessonProgress(currentCourse, item.dataset.key);
        check.textContent = (p && p.done) ? '✓' : '';
      }
    });
    const lesson = activeLessonSet()[activeKey];
    if(lesson) lessonSelectLabelEl.textContent = lesson.name;
  }

  // 【新增】網址參數：讀取 ?course=xxx&lesson=yyy 決定一開始要選哪個大課程／小課程，方便分享指定連結
  // 【新增】hasLessonInUrl：網址有沒有明確指定小課程；有的話開啟後直接進練習畫面，沒有就停在課程首頁
  let hasLessonInUrl = false;
  // 尋找此函式並替換成以下內容：
  function readInitialStateFromUrl(){
    try{
      const params = new URLSearchParams(location.search);
      const courseParam = params.get('course');
      if(courseParam && COURSES.some(c=>c.id===courseParam)){
        currentCourse = courseParam;
      }
      const lessonParam = params.get('lesson');
      if(lessonParam && activeLessonSet()[lessonParam]){
        lessonByCourse[currentCourse] = lessonParam;
        hasLessonInUrl = true; 
      }
      // 【新增】讀取遊戲參數
      const gameParam = params.get('game');
      if (gameParam === 'balloon') {
        settings.balloonGame = true;
        settings.raceGame = false;
      } else if (gameParam === 'race') {
        settings.raceGame = true;
        settings.balloonGame = false;
      }
    }catch(e){
      // 網址參數格式異常時，安靜地使用預設值即可，不影響正常使用
    }
  }
  // 【修改】把目前選的大課程／小課程同步寫回網址列（用 replaceState，不會多留瀏覽紀錄），方便使用者複製網址分享指定課程。
  // includeLesson 預設為 true（練習畫面情境：分享出去要直接開啟該小課程）；
  // 在課程首頁只選了「大課程」、還沒點進特定小課程時傳 false，網址只留 course，
  // 這樣分享或重新整理這個網址時會停在首頁（而不是被強制帶進某一小課程的練習畫面）。
  // 尋找此函式並替換成以下內容：
  function updateUrlParams(includeLesson){
    const params = new URLSearchParams();
    params.set('course', currentCourse);
    if(includeLesson !== false){
      params.set('lesson', activeLessonKey());
    }
    
    // 【新增】將目前開啟的小遊戲寫入網址參數
    if (settings.balloonGame) {
      params.set('game', 'balloon');
    } else if (settings.raceGame) {
      params.set('game', 'race');
    }

    const qs = params.toString();
    const newUrl = location.pathname + (qs ? '?' + qs : '') + location.hash;
    history.replaceState(null, '', newUrl);
  }

  // 【修改】大課程選單（英打／注音）：取代原本設定面板裡的「注音打字模式」開關
  const courseSelectEl = document.getElementById('courseSelect');
  courseSelectEl.addEventListener('change', ()=>{
    currentCourse = courseSelectEl.value;
    applyKeycapDisplayDefaults();
    drillChars = null;
    renderLessonOptions();
    updateUrlParams();
    resetAll();
  });

  // 取得兩個遊戲的開關元素，用來做互斥切換的樣式更新
  const toggleBalloonGameEl = document.getElementById('toggleBalloonGame');
  const toggleRaceGameEl = document.getElementById('toggleRaceGame');

  // 忍者抓氣球：切換後重設本輪
  bindToggle('toggleBalloonGame','balloonGame', ()=>{
    if(settings.balloonGame){
      settings.raceGame = false;
      toggleRaceGameEl.classList.remove('on');
      raceTrackWrapEl.classList.remove('show'); 
    }
    updateUrlParams();
    resetAll();
  });

  bindToggle('toggleRaceGame','raceGame', ()=>{
    if(settings.raceGame){
      settings.balloonGame = false;
      toggleBalloonGameEl.classList.remove('on');
    }
    raceTrackWrapEl.classList.toggle('show', settings.raceGame);
    updateUrlParams();
    resetAll();
  });

  // 【刪除】「重設統計」按鈕與 resetStats() 函式：功能跟右上角「開始／重設」按鈕重複，已移除按鈕，函式跟著一起刪掉

  const startBtn = document.getElementById('startBtn');
  function updateStartBtnLabel(){
    startBtn.textContent = (started || ended) ? '重設' : '開始';
  }
  startBtn.addEventListener('click', ()=>{
    if(!started && !ended && !counting){
      startCountdown(); // 尚未開始：按下直接開始倒數（等同按空白鍵）
    } else {
      resetAll(); // 練習中或已結束：按下重新開始
    }
  });

  // ---------- 時間長度選單 ----------
  const timeStatBtn = document.getElementById('timeStatBtn');
  const timeMenuEl = document.getElementById('timeMenu');
  // 【新增】時鐘／閃電圖示切換：「自動時間」開啟時，時間旁的圖示改成閃電（跟選單裡「⚡ 自動」呼應），
  // 關閉（選了固定秒數）則改回原本的時鐘圖示
  const timeIconEl = document.getElementById('timeIcon');
  const TIME_ICON_CLOCK = '<circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 3"/>';
  const TIME_ICON_BOLT = '<path d="M13 2 4 14h6l-1 8 9-12h-6z" fill="currentColor" stroke="none"/>';
  function updateTimeIcon(){
    timeIconEl.innerHTML = AUTO_TIME ? TIME_ICON_BOLT : TIME_ICON_CLOCK;
  }
  updateTimeIcon(); // 【新增】頁面載入時 AUTO_TIME 預設為 true，圖示要一開始就顯示閃電，跟選單預設選中「自動」一致
  timeStatBtn.addEventListener('click', (e)=>{
    e.stopPropagation();
    timeMenuEl.classList.toggle('open');
  });
  timeMenuEl.querySelectorAll('.time-menu-item').forEach(item=>{
    item.addEventListener('click', (e)=>{
      e.stopPropagation();
      // 【修改】新增「自動」選項：選到它就開啟 AUTO_TIME，實際秒數交給 resetAll() 裡的 syncAutoTime() 動態算；
      // 選其他固定秒數則關閉自動模式，行為跟原本一樣
      if(item.dataset.seconds === 'auto'){
        AUTO_TIME = true;
      } else {
        AUTO_TIME = false;
        const seconds = parseInt(item.dataset.seconds, 10);
        TOTAL_TIME = seconds === 0 ? Infinity : seconds;
      }
      updateTimeIcon(); // 【新增】切換自動／固定秒數時，同步切換時鐘／閃電圖示
      timeMenuEl.querySelectorAll('.time-menu-item').forEach(i=>i.classList.remove('selected'));
      item.classList.add('selected');
      timeMenuEl.classList.remove('open');
      resetAll(); // 切換時間長度視同重設本輪練習
    });
  });
  document.addEventListener('click', ()=>{ timeMenuEl.classList.remove('open'); lessonDropdownWrapEl.classList.remove('open'); });

  // ---------- 無限模式：手動結束本輪 ----------
  const endInfiniteBtn = document.getElementById('endInfiniteBtn');
  endInfiniteBtn.addEventListener('click', ()=>{
    if(started && !ended) endSession();
  });

  // ---------- 系統層級快速鍵（Win 開頭）：手動確認「已比出手勢」後前進下一題 ----------
  const comboManualNextBtn = document.getElementById('comboManualNextBtn');
  comboManualNextBtn.addEventListener('click', ()=>{
    if(!started || ended) return;
    const target = queue[queueIndex];
    if(isShortcutMode() && target && target.osLevel){
      queueIndex++;
      showTarget();
    }
  });

  drillMistakesBtn.addEventListener('click', ()=>{
    if(!mistakeCharsForDrill.length) return;
    drillChars = mistakeCharsForDrill.slice();
    resetAll();
  });
  // 【新增】結束畫面的「重新開始」：跟上面主要的「重設」按鈕做一樣的事，只是就近放在結算畫面裡，不用把視線移開
  resultRestartBtn.addEventListener('click', ()=>{
    resetAll();
  });
  // 【新增】結束畫面的「下一關」：切到下一課再開始新的一輪
  resultNextLessonBtn.addEventListener('click', ()=>{
    goToNextLesson();
  });
  exitDrillBtn.addEventListener('click', ()=>{
    drillChars = null;
    resetAll();
  });

  // 【修改】原本是原生 select 的 change 事件；現在改成按鈕點擊開關清單、清單項目點擊才選課
  // 【新增】因為選單改成 position:fixed（見上方 CSS 說明），這裡改用 JS 依按鈕當下位置算出清單要出現的座標
  lessonSelectEl.addEventListener('click', (e)=>{
    e.stopPropagation();
    const willOpen = !lessonDropdownWrapEl.classList.contains('open');
    if(willOpen){
      const rect = lessonSelectEl.getBoundingClientRect();
      lessonDropdownMenuEl.style.top = (rect.bottom + 8) + 'px';
      lessonDropdownMenuEl.style.left = rect.left + 'px';
      // 展開高度限制在「按鈕下緣到畫面底部」與「畫面 80% 高」兩者取較小值，避免清單超出畫面底部
      lessonDropdownMenuEl.style.maxHeight = Math.min(window.innerHeight * 0.8, window.innerHeight - rect.bottom - 16) + 'px';
    }
    lessonDropdownWrapEl.classList.toggle('open');
  });
  lessonDropdownMenuEl.addEventListener('click', (e)=>{
    const item = e.target.closest('.lesson-dropdown-item');
    if(!item) return;
    e.stopPropagation();
    drillChars = null;
    lessonByCourse[currentCourse] = item.dataset.key;
    syncLessonSelectDisplay();
    lessonDropdownWrapEl.classList.remove('open');
    updateUrlParams();
    resetAll();
  });

  // ---------- 【新增】打字紀錄（History） ----------
  const HISTORY_KEY = 'typingTutorHistory';
  const HISTORY_MAX = 20; // 只保留最近 20 筆
  // 【新增】一輪練習至少要按這麼多次鍵（正確+錯誤）才算數：門檻以下的正確率沒有參考價值，
  // 也不會寫進打字紀錄，避免「完全沒打字」或「打1個字就停」被誤判成 100% 的好成績
  const MIN_VALID_ATTEMPTS = 5;

  function loadHistory(){
    try{
      const raw = localStorage.getItem(HISTORY_KEY);
      const list = raw ? JSON.parse(raw) : [];
      return Array.isArray(list) ? list : [];
    }catch(e){
      return []; // localStorage 不可用或資料格式異常時，安靜地當作沒有紀錄即可
    }
  }
  function saveHistory(list){
    try{
      localStorage.setItem(HISTORY_KEY, JSON.stringify(list.slice(0, HISTORY_MAX)));
    }catch(e){
      // 存不進去（例如無痕模式關閉了 localStorage）就放棄，不影響練習本身
    }
  }
  // 每完成一輪練習（endSession 內）呼叫一次，新紀錄放最前面，超過 20 筆自動丟掉最舊的
  function addHistoryRecord(record){
    const list = loadHistory();
    list.unshift(record);
    saveHistory(list);
  }
  function formatDuration(sec){
    sec = Math.max(0, Math.round(sec||0));
    const m = Math.floor(sec/60), s = sec%60;
    return m + ':' + String(s).padStart(2,'0');
  }
  function formatHistoryTime(ts){
    const d = new Date(ts);
    return d.toLocaleString('zh-TW', {month:'numeric', day:'numeric', hour:'2-digit', minute:'2-digit', hour12:false});
  }
  const historyBtnEl = document.getElementById('historyBtn');
  const brandTitleEl = document.getElementById('brandTitle'); // 【新增】給標題掛回首頁點擊事件用
  const practiceViewEl = document.getElementById('practiceView');
  const historyViewEl = document.getElementById('historyView');
  const topbarControlsEl = document.getElementById('topbarControls');
  const backToPracticeBtnEl = document.getElementById('backToPracticeBtn');
  const historyListEl = document.getElementById('historyList');
  const historyEmptyEl = document.getElementById('historyEmpty');
  const historyCountBadgeEl = document.getElementById('historyCountBadge');
  const historyHintEl = document.getElementById('historyHint'); // 【修改】原 clearHistoryBtnEl，清除功能已拿掉，改抓移到清單下方的提示文字

  // 每筆紀錄的統計都配一個 emoji 圖示，讀起來比純文字有趣一點
  function renderHistoryCard(record){
    const courseIcon = record.course === 'zhuyin' ? 'ㄅㄆ 注音' : record.course === 'basics' ? '🔤 英打基礎' : '⌨️ 英打';
    const totalAttempts = record.correct + record.wrong; // 【新增】這筆紀錄的總按鍵次數，標註在正確率旁邊
    return `
      <div class="history-card">
        <div class="history-card-top">
          <div class="history-card-lesson">
            <span class="history-course-icon">${courseIcon}</span>
            <span>${record.lessonName}</span>
          </div>
          <div class="history-card-time">📅 ${formatHistoryTime(record.ts)}</div>
        </div>
        <div class="history-card-stats">
          <div class="history-stat"><span class="icon">🏆</span>得分 <span class="val">${record.score}</span></div>
          <div class="history-stat ok"><span class="icon">✅</span><span class="val">${record.correct}</span></div>
          <div class="history-stat bad"><span class="icon">❌</span><span class="val">${record.wrong}</span></div>
          <div class="history-stat acc"><span class="icon">🎯</span>正確率 <span class="val">${record.accuracy}</span><span class="sample-note">(共${totalAttempts}次)</span></div>
          <div class="history-stat"><span class="icon">⚡</span><span class="val">${record.speed}</span> 字/分</div>
          <div class="history-stat streak"><span class="icon">🔥</span>連續 <span class="val">${record.bestStreak}</span></div>
          <div class="history-stat"><span class="icon">⏱️</span><span class="val">${formatDuration(record.duration)}</span></div>
        </div>
      </div>`;
  }
  function renderHistory(){
    const list = loadHistory();
    historyCountBadgeEl.textContent = list.length;
    if(!list.length){
      historyEmptyEl.classList.add('show');
      historyListEl.innerHTML = '';
      historyHintEl.style.display = 'none'; // 【新增】沒有紀錄時，「只保留最近20筆」這句話沒有意義，跟著隱藏
      return;
    }
    historyEmptyEl.classList.remove('show');
    historyListEl.innerHTML = list.map(renderHistoryCard).join('');
    historyHintEl.style.display = 'block'; // 【新增】有紀錄時才在清單最下面顯示這句提示
  }
  function showHistoryView(){
    practiceViewEl.style.display = 'none';
    homeViewEl.style.display = 'none';            // 【新增】切到紀錄頁時要一併收起課程首頁
    homeNavBtnEl.style.display = 'inline-block';  // 【新增】紀錄頁也保留「📚 課程」回首頁入口
    topbarControlsEl.style.display = 'none';
    homeCourseSelectEl.style.display = 'none';    // 【新增】主課程選單只在課程首頁顯示，紀錄頁收起
    historyViewEl.style.display = 'flex';
    renderHistory();
  }
  function showPracticeView(){
    historyViewEl.style.display = 'none';
    homeViewEl.style.display = 'none';            // 【新增】進入練習畫面時收起課程首頁
    homeNavBtnEl.style.display = 'inline-block';  // 【新增】練習時顯示「📚 課程」，隨時可以回首頁換課
    homeCourseSelectEl.style.display = 'none';    // 【新增】主課程選單只在課程首頁顯示，練習畫面收起
    practiceViewEl.style.display = 'block';
    topbarControlsEl.style.display = 'flex';
  }
  // 【修改】「打字紀錄」現在固定放在設定側欄裡，點下去就直接開啟紀錄頁並收起側欄
  historyBtnEl.addEventListener('click', ()=>{
    closeSidebar();
    showHistoryView();
  });
  // 【修改】點左上角「烏衣行打字」標題原本是回「練習畫面」；現在課程首頁才是真正的首頁，
  // 改成跟 TypingClub 點 logo 一樣回到課程卡片首頁
  brandTitleEl.addEventListener('click', ()=>{
    closeSidebar();
    showHomeView();
  });
  // 【新增】紀錄頁裡的「返回練習」按鈕，取代原本靠同一顆按鈕切換文字的做法
  backToPracticeBtnEl.addEventListener('click', showPracticeView);
  // 【刪除】清除紀錄功能已整個拿掉（含 clearHistoryBtnEl 變數與這段點擊事件、對應的 HTML 按鈕），
  // 因為使用者不需要能清除紀錄

  // ---------- 【新增】課程進度（Progress）：記住每一課有沒有完成過、最佳成績 ----------
  // 儲存格式：{ "basics:h1": { done:true, times:3, bestAccuracy:96, bestSpeed:28, ts:1712... }, ... }
  // key 用「大課程id:小課程key」，這樣三個大課程的同名 key（例如 english 與 zhuyin 都有 words）不會互相蓋掉。
  // 【設計取捨】刻意「不鎖定」未完成的課程：任何一張卡片都能直接點進去練，
  // 進度只用來顯示打勾與完成度，不限制學習順序。
  const PROGRESS_KEY = 'typingTutorProgress';
  function loadProgress(){
    try{
      const raw = localStorage.getItem(PROGRESS_KEY);
      const obj = raw ? JSON.parse(raw) : {};
      return (obj && typeof obj === 'object') ? obj : {};
    }catch(e){
      return {}; // localStorage 不可用時，安靜地當作沒有進度，不影響練習
    }
  }
  function saveProgress(obj){
    try{ localStorage.setItem(PROGRESS_KEY, JSON.stringify(obj)); }catch(e){}
  }
  let progress = loadProgress();
  function progressKeyOf(courseId, lessonKey){ return courseId + ':' + lessonKey; }
  function getLessonProgress(courseId, lessonKey){ return progress[progressKeyOf(courseId, lessonKey)] || null; }
  // 完成一輪有效練習時呼叫（見 endSession）：標記完成、累加次數，並保留歷史最佳的正確率與速度
  function markLessonDone(courseId, lessonKey, stat){
    const k = progressKeyOf(courseId, lessonKey);
    const prev = progress[k] || { done:false, times:0, bestAccuracy:0, bestSpeed:0 };
    const acc = Number.isFinite(stat.accuracy) ? stat.accuracy : 0;
    const spd = Number.isFinite(stat.speed) ? stat.speed : 0;
    progress[k] = {
      done: true,
      times: prev.times + 1,
      bestAccuracy: Math.max(prev.bestAccuracy || 0, acc),
      bestSpeed: Math.max(prev.bestSpeed || 0, spd),
      ts: Date.now()
    };
    saveProgress(progress);
    syncLessonSelectDisplay(); // 下拉清單的勾勾也一起更新
  }

  // ---------- 【新增】課程首頁（Home view）：TypingClub 風格的卡片方格 ----------
  const homeViewEl = document.getElementById('homeView');
  const homeCourseSelectEl = document.getElementById('homeCourseSelect');
  const homeGroupsEl = document.getElementById('homeGroups');
  const homeNavBtnEl = document.getElementById('homeNavBtn');
  const resetProgressBtnEl = document.getElementById('resetProgressBtn');

  const COURSE_TAB_LABEL = { basics:'🔤 英打基礎', english:'⌨️ 英打', zhuyin:'ㄅㄆ 注音' };

  // 卡片中央的主視覺：盡量沿用 TypingClub「看圖就知道這課在練什麼」的做法——
  // 只教少數幾個新鍵的課直接把鍵名放大顯示（例如 F J），其他依課程類型給對應的圖示
  function lessonVisual(lesson, courseId){
    const name = lesson.name || '';
    if(lesson.type === 'shortcuts') return { cls:'emoji', text:'⚡' };
    if(lesson.type === 'sentences' || lesson.type === 'zhuyinSentences') return { cls:'emoji', text:'📖' };
    if(lesson.type === 'words' || lesson.type === 'zhuyinWords') return { cls:'emoji', text:'📦' };
    if(lesson.focus && lesson.focus.length) return { cls:'keys', text: lesson.focus.map(k=>k.toUpperCase()).join(' ') };
    if(/數字/.test(name)) return { cls:'emoji', text:'🔢' };
    if(/複習|總覽|綜合/.test(name)) return { cls:'emoji', text:'🔍' };
    if(lesson.chars && lesson.chars.length && lesson.chars.length <= 4){
      return { cls:'keys', text: lesson.chars.map(k=>k.toUpperCase()).join(' ') };
    }
    return { cls:'emoji', text: courseId === 'zhuyin' ? 'ㄅ' : '⌨️' };
  }
  // 課名前面的「1. 」「12. 」序號在卡片左上角已經另外顯示，名稱本身就不用再重複
  function stripLessonNumber(name){ return String(name||'').replace(/^\s*\d+\s*[.、]\s*/, ''); }
  // 跟下拉選單同一套分組規則（有 group 就用 group，沒有就用 level 分初學／進階）
  function groupNameOf(lesson){
    return lesson.group || (lesson.level === 'beginner' ? '🌱 初學' : '🚀 進階');
  }

  function renderHomeView(){
    // 1) 右上角大課程下拉選單（取代原本的分頁按鈕）
    homeCourseSelectEl.innerHTML = COURSES.map(c=>
      `<option value="${c.id}"${c.id===currentCourse?' selected':''}>${COURSE_TAB_LABEL[c.id] || c.name}</option>`
    ).join('');
    homeCourseSelectEl.value = currentCourse;

    const source = activeLessonSet();
    const keys = Object.keys(source);
    const activeKey = activeLessonKey();

    // 2) 依 group 分區的卡片方格
    const orderedGroups = [];
    keys.forEach(k=>{
      const g = groupNameOf(source[k]);
      if(!orderedGroups.includes(g)) orderedGroups.push(g);
    });
    let html = '';
    orderedGroups.forEach(g=>{
      const groupKeys = keys.filter(k=>groupNameOf(source[k])===g);
      if(!groupKeys.length) return;
      html += `<div class="home-group"><div class="home-group-title">${g}</div><div class="home-grid">`;
      groupKeys.forEach(k=>{
        const lesson = source[k];
        const idx = keys.indexOf(k) + 1;               // 卡片左上角的序號＝這一課在大課程裡的順序
        const p = getLessonProgress(currentCourse, k);
        const done = !!(p && p.done);
        const v = lessonVisual(lesson, currentCourse);
        const meta = done && p.bestAccuracy ? `🎯 ${p.bestAccuracy}% · ⚡ ${p.bestSpeed}` : '';
        html += `
          <button type="button" class="lesson-card${done?' done':''}${k===activeKey?' current':''}" data-key="${k}" title="${lesson.desc ? String(lesson.desc).replace(/"/g,'&quot;') : lesson.name}">
            <span class="lesson-card-num">${idx}</span>
            ${done ? '<span class="lesson-card-check">✓</span>' : ''}
            <span class="lesson-card-visual ${v.cls}">${v.text}</span>
            <span class="lesson-card-name">${stripLessonNumber(lesson.name)}</span>
            ${meta ? `<span class="lesson-card-meta">${meta}</span>` : ''}
          </button>`;
      });
      html += '</div></div>';
    });
    homeGroupsEl.innerHTML = html;
  }

  // 【修改】選頂部列的主課程（大課程）下拉選單：切換大課程並重畫卡片（同時同步頂部列原本的大課程下拉與小課程清單），
  // 並把新選的大課程寫回網址參數（只留 course，不含 lesson），方便使用者複製課程首頁的網址分享
  homeCourseSelectEl.addEventListener('change', ()=>{
    currentCourse = homeCourseSelectEl.value;
    courseSelectEl.value = currentCourse;
    applyKeycapDisplayDefaults();
    drillChars = null;
    renderLessonOptions();
    updateUrlParams(false);
    renderHomeView();
  });

  // 點卡片：選定這一課，進入打字練習畫面
  homeGroupsEl.addEventListener('click', (e)=>{
    const card = e.target.closest('.lesson-card');
    if(!card) return;
    drillChars = null;
    lessonByCourse[currentCourse] = card.dataset.key;
    syncLessonSelectDisplay();
    updateUrlParams();
    showPracticeView();
    resetAll();
  });

  // 【修改】「重設進度」現在放在課程首頁最下面，點下去直接跳出確認視窗
  resetProgressBtnEl.addEventListener('click', ()=>{
    if(!confirm('確定要清除所有課程的完成紀錄嗎？（打字紀錄不會被刪除）')) return;
    progress = {};
    saveProgress(progress);
    renderHomeView();
    syncLessonSelectDisplay();
  });

  function showHomeView(){
    // 【新增】練習進行中（或已結束停在結算畫面）按「📚 課程」回首頁時，先把這一輪重設掉，
    // 否則計時器會在看不見的畫面裡繼續跑
    if(started || counting || ended) resetAll();
    practiceViewEl.style.display = 'none';
    historyViewEl.style.display = 'none';
    topbarControlsEl.style.display = 'none'; // 課程首頁不需要頂部的課程下拉／時間／開始鈕
    homeNavBtnEl.style.display = 'none';     // 已經在首頁了，「📚 課程」按鈕就不用出現
    homeCourseSelectEl.style.display = 'inline-block'; // 【新增】主課程選單跟主標題同一列顯示
    homeViewEl.style.display = 'flex';
    renderHomeView();
  }
  homeNavBtnEl.addEventListener('click', showHomeView);
  resultHomeBtn.addEventListener('click', showHomeView);

  // ---------- Init ----------
  readInitialStateFromUrl();       // 先讀網址參數，決定要開哪個大課程／小課程與遊戲模式
  
  // 【新增】同步小遊戲的開關 UI 樣式（若網址帶有遊戲參數，這裡會自動亮起開關）
  const toggleBalloonGameInitEl = document.getElementById('toggleBalloonGame');
  const toggleRaceGameInitEl = document.getElementById('toggleRaceGame');
  if(toggleBalloonGameInitEl) toggleBalloonGameInitEl.classList.toggle('on', settings.balloonGame);
  if(toggleRaceGameInitEl) toggleRaceGameInitEl.classList.toggle('on', settings.raceGame);

  courseSelectEl.value = currentCourse;
  applyKeycapDisplayDefaults();
  applyKeyboardVisibility();       
  renderLessonOptions();
  updateUrlParams(hasLessonInUrl); 
  
  // 【新增】如果初始化時文字賽跑是開啟的，確保賽道可見
  raceTrackWrapEl.classList.toggle('show', settings.raceGame);

  resetAll();
  
  if(hasLessonInUrl){
    showPracticeView();
  } else {
    showHomeView();
  }

})();
