// ================= 10_subtitle_theater.js: 字幕展示模式（劇場模式） =================
// 目的：提供「純觀看用」的全螢幕字幕呈現視窗，跟著音檔播放自動同步顯示目前句子，
//       supports 多種業界常見的字幕視覺風格（黑底白字 / 白底黑字 / 黃字黑邊 / 白字黑邊 /
//       半透明黑底 / 毛玻璃 / 逐字稿捲動 / 卡拉OK 上色 / 繪本模式），並支援雙語排版
//       （上下／左右／同大小不同色）。這是純展示、不可編輯的模組，不會更動任何句子
//       文字或時間標記資料。
//
// ★ 跨句圖片群組（mediaGroups）背景圖片：預設「不顯示」，不論選了哪個展示風格，
//   預設都維持該風格原本的純色/透明背景，直到使用者在設定面板勾選「顯示圖片」，
//   播放到有設定圖片的區間時才會疊上背景圖。唯一例外是「繪本模式」——這個模式
//   本身就是以圖片為主要呈現，所以一律顯示圖片，不受這個開關影響（開關在此模式下
//   會被鎖定為勾選並停用，避免使用者誤以為關掉了卻沒生效）。
//
// ★ 繪本模式：仿照 YouTube 影片的排版，畫面主體是跨句圖片群組的圖片（鋪滿全螢幕），
//   字幕改成貼在畫面底部的半透明字幕條，不再置中大字呈現。目前時間若沒有落在任何
//   已設定圖片的群組區間內，會顯示「尚無圖片」的提示文字，避免看起來像沒載入。
//
// 設計原則：完全自包含（Self-contained）——自己注入觸發按鈕、自己注入 CSS、自己注入
//       覆蓋層 DOM，不需要修改既有版面結構，降低跟其他檔案衝突的風險。
//       只讀取既有全域狀態（allLabelsOrdered / sentenceTextMap / timeDataMap / audioPlayer），
//       以及 1c_languages.js 提供的多語言工具函式，不寫回、不修改任何專案資料。
//
// 需求：必須在 1_globals.js（提供 audioPlayer / getCalculatedTimes / formatTime / showToast）
//       與 1c_languages.js（提供 splitLangs / getLang / getLangCount / getLangMultiEnabled）
//       之後載入。建議放在 index.html 最後一行 <script>。

(function () {
    'use strict';

    // ================= ① 設定狀態（存在 localStorage，跨重整保留） =================
    const LS_PREFIX = 'tagger_theater_';
    const THEMES = ['dark', 'light', 'yellow-outline', 'white-outline', 'translucent', 'frosted', 'lyrics', 'karaoke', 'picturebook'];
    const LAYOUTS = ['single', 'stacked', 'side', 'colorsplit'];

    function loadState() {
        const g = (k, d) => {
            const v = localStorage.getItem(LS_PREFIX + k);
            return v === null ? d : v;
        };
        return {
            theme: THEMES.includes(g('theme')) ? g('theme') : 'dark',
            layout: LAYOUTS.includes(g('layout')) ? g('layout') : 'single',
            langA: parseInt(g('langA', '0'), 10) || 0,
            langB: parseInt(g('langB', '1'), 10) || 1,
            showSpeaker: g('showSpeaker', 'false') === 'true',
            mono: g('mono', 'false') === 'true',
            bold: g('bold', 'false') === 'true', // ★ 修改：預設改為不粗體
            // ★ 新增：隱藏標點，預設啟用（沒存過設定的人，第一次開啟就是隱藏）
            hidePunct: g('hidePunct', 'true') === 'true',
            // ★ 新增：跟讀模式，預設不啟用；跟讀次數預設 1、限制在 1～10
            followMode: g('followMode', 'false') === 'true',
            followCount: Math.min(10, Math.max(1, parseInt(g('followCount', '1'), 10) || 1)),
            immersive: g('immersive', 'false') === 'true',
            bgMode: ['none', 'auto', 'custom'].includes(g('bgMode')) ? g('bgMode') : 'none',
            bgAutoSeed: g('bgAutoSeed', ''),
            fontScale: parseFloat(g('fontScale', '1')) || 1,
            // ★ 新增：跨句圖片群組背景是否顯示。預設 false＝維持各主題原本的純色底，
            // 使用者要主動勾選才會在播放到圖片區間時疊圖（繪本模式例外，見上方說明）。
            showGroupImage: g('showGroupImage', 'false') === 'true'
        };
    }
    function saveState() {
        localStorage.setItem(LS_PREFIX + 'theme', st.theme);
        localStorage.setItem(LS_PREFIX + 'layout', st.layout);
        localStorage.setItem(LS_PREFIX + 'langA', String(st.langA));
        localStorage.setItem(LS_PREFIX + 'langB', String(st.langB));
        localStorage.setItem(LS_PREFIX + 'showSpeaker', String(st.showSpeaker));
        localStorage.setItem(LS_PREFIX + 'mono', String(st.mono));
        localStorage.setItem(LS_PREFIX + 'bold', String(st.bold));
        localStorage.setItem(LS_PREFIX + 'hidePunct', String(st.hidePunct));
        localStorage.setItem(LS_PREFIX + 'followMode', String(st.followMode));
        localStorage.setItem(LS_PREFIX + 'followCount', String(st.followCount));
        localStorage.setItem(LS_PREFIX + 'immersive', String(st.immersive));
        localStorage.setItem(LS_PREFIX + 'bgMode', st.bgMode);
        localStorage.setItem(LS_PREFIX + 'bgAutoSeed', st.bgAutoSeed);
        localStorage.setItem(LS_PREFIX + 'fontScale', String(st.fontScale));
        localStorage.setItem(LS_PREFIX + 'showGroupImage', String(st.showGroupImage));
        syncTheaterUrl(); // ★ 新增：設定一改，網址跟著更新
    }

    let st = loadState();

    // ================= ★ 新增：網址參數（theater=風格-排版-設定…，以 - 隔開） =================
    const URL_THEATER_PARAM = 'theater';
    const THEME_CODES = { 'dark': 'dark', 'light': 'light', 'yellow-outline': 'yellow', 'white-outline': 'white',
        'translucent': 'trans', 'frosted': 'frosted', 'lyrics': 'lyrics', 'karaoke': 'karaoke', 'picturebook': 'book' };
    const LAYOUT_CODES = { 'single': 'single', 'stacked': 'stacked', 'side': 'side', 'colorsplit': 'split' };
    const CODE_TO_THEME = Object.fromEntries(Object.entries(THEME_CODES).map(([k, v]) => [v, k]));
    const CODE_TO_LAYOUT = Object.fromEntries(Object.entries(LAYOUT_CODES).map(([k, v]) => [v, k]));
    let pendingUrlState = null; // 由網址解析出來、等開啟時套用的完整設定（null = 用 localStorage）

    // 目前設定 → 字串。風格一定寫；其餘只寫「非預設值」，網址才會短
    function encodeTheaterSettings(s) {
        const t = [THEME_CODES[s.theme] || 'dark'];
        if (s.layout !== 'single') t.push(LAYOUT_CODES[s.layout]);
        if (s.langA !== 0) t.push('a' + s.langA);
        if (s.langB !== 1) t.push('b' + s.langB);
        if (s.fontScale !== 1) t.push('z' + s.fontScale);
        if (s.showSpeaker) t.push('sp');
        if (s.mono) t.push('mono');
        if (s.bold) t.push('bold'); // ★ 修改：預設不粗體，所以「開啟」才寫進網址
        if (!s.hidePunct) t.push('nopunct');
        if (s.followMode) t.push('f' + s.followCount);
        if (s.immersive) t.push('im');
        if (s.showGroupImage) t.push('img');
        return t.join('-');
    }

    // 字串 → 完整設定（沒寫的一律用預設值，不吃 localStorage，分享出去的連結才會一致）
    function parseTheaterSettings(str) {
        const s = { theme: 'dark', layout: 'single', langA: 0, langB: 1, showSpeaker: false, mono: false,
            bold: false, hidePunct: true, followMode: false, followCount: 1, immersive: false, // ★ 修改：bold 預設 false
            bgMode: 'none', bgAutoSeed: '', fontScale: 1, showGroupImage: false };
        String(str).split('-').forEach(raw => {
            const tok = raw.trim().toLowerCase();
            if (!tok) return;
            if (CODE_TO_THEME[tok]) s.theme = CODE_TO_THEME[tok];
            else if (CODE_TO_LAYOUT[tok]) s.layout = CODE_TO_LAYOUT[tok];
            else if (tok === 'sp') s.showSpeaker = true;
            else if (tok === 'mono') s.mono = true;
            else if (tok === 'bold') s.bold = true; // ★ 修改：原本是 nobold
            else if (tok === 'nopunct') s.hidePunct = false;
            else if (tok === 'im') s.immersive = true;
            else if (tok === 'img') s.showGroupImage = true;
            else {
                const m = tok.match(/^(a|b|z|f)(\d+(?:\.\d+)?)$/);
                if (!m) return;
                const n = parseFloat(m[2]);
                if (m[1] === 'a') s.langA = Math.min(9, Math.floor(n));
                else if (m[1] === 'b') s.langB = Math.min(9, Math.floor(n));
                else if (m[1] === 'z') s.fontScale = Math.min(2, Math.max(0.6, n));
                else if (m[1] === 'f') { s.followMode = true; s.followCount = Math.min(10, Math.max(1, Math.floor(n) || 1)); }
            }
        });
        return s;
    }

    // 把目前狀態寫進網址：開啟中 → 寫入 theater 參數；關閉後 → 移除。其他參數與 #hash 保留
    function syncTheaterUrl() {
        try {
            const url = new URL(window.location.href);
            if (overlay.classList.contains('stz-open')) url.searchParams.set(URL_THEATER_PARAM, encodeTheaterSettings(st));
            else url.searchParams.delete(URL_THEATER_PARAM);
            const next = url.pathname + url.search + url.hash;
            const cur = window.location.pathname + window.location.search + window.location.hash;
            if (next !== cur) history.replaceState(null, '', next);
        } catch (e) { /* file:// 等環境不允許改網址時，安靜略過 */ }
    }

    // 載入時依網址自動開啟：音檔（IndexedDB 還原）與字幕資料是非同步載入的，
    // 所以每 300ms 檢查一次，最多等 15 秒；等不到就放棄並清掉網址參數。
    // ★ 等待期間先蓋一層全螢幕遮罩，避免重新整理時閃出底層的聲波區與編輯區
    function restoreTheaterFromUrl() {
        const raw = new URLSearchParams(window.location.search).get(URL_THEATER_PARAM);
        if (raw === null) return;
        pendingUrlState = /^(|1|true)$/i.test(raw) ? null : parseTheaterSettings(raw);

        const cover = document.createElement('div');
        const isLight = (pendingUrlState || loadState()).theme === 'light';
        cover.style.cssText = 'position:fixed;inset:0;z-index:99999;display:flex;align-items:center;' +
            'justify-content:center;font-size:1.1rem;letter-spacing:2px;' +
            (isLight ? 'background:#fff;color:#999;' : 'background:#000;color:#555;');
        cover.textContent = '載入中…';
        document.body.appendChild(cover);
        const removeCover = () => cover.remove();

        let tries = 0;
        const timer = setInterval(() => {
            tries++;
            const ready = audioPlayer && audioPlayer.src && allLabelsOrdered.length > 0;
            if (ready) { clearInterval(timer); openTheater(); removeCover(); }
            else if (tries >= 50) { clearInterval(timer); pendingUrlState = null; syncTheaterUrl(); removeCover(); }
        }, 300);
    }

    // ================= ② 樣式注入 =================
    const css = `
    .stz-overlay{position:fixed;inset:0;z-index:99999;display:none;--stz-scale:1;
        background:#000;font-family:var(--main-font-family, sans-serif);}
    .stz-overlay.stz-open{display:block;}
    .stz-bg-image{position:absolute;inset:0;background-size:cover;background-position:center;
        display:none;}
    [data-stz-theme="frosted"] .stz-bg-image, [data-stz-theme="translucent"] .stz-bg-image{
        display:block;}
    /* ★ 跨句圖片群組專用背景層。跟 .stz-bg-image（設定面板的「背景圖片：自動／自訂」）
       是兩回事、互不影響：這層只在①目前播放時間落在某個 mediaGroups 區間內，且
       ②使用者已勾選「顯示圖片」（或目前是一律顯示圖片的繪本模式）時才會顯示，
       優先度較高（疊在 .stz-bg-image 上面）。是否要顯示是由 JS（tick 函式）判斷，
       CSS 這裡只負責「命中時」怎麼疊出來，不論是哪個展示風格，字幕仍照原本邏輯
       逐句顯示在最上層。 */
    .stz-mg-bg{position:absolute;inset:0;background-size:cover;background-position:center;
        display:none;}
    .stz-overlay.stz-mg-active .stz-mg-bg{display:block;}
    .stz-overlay.stz-mg-active .stz-stage{background:rgba(0,0,0,.45) !important;}
    .stz-overlay[data-stz-theme="light"].stz-mg-active .stz-stage{background:rgba(255,255,255,.55) !important;}
    .stz-stage{position:absolute;inset:0;display:flex;align-items:center;justify-content:center;
        padding:6vh 6vw;text-align:center;cursor:pointer;overflow:hidden;}
    .stz-lines{display:flex;align-items:center;justify-content:center;max-width:100%;}
    .stz-lines[data-layout="stacked"], .stz-lines[data-layout="colorsplit"]{flex-direction:column;}
    .stz-lines[data-layout="side"]{flex-direction:row;gap:28px;flex-wrap:wrap;}
    .stz-primary{font-weight:400;line-height:1.35;word-break:break-word;white-space:pre-wrap;
        font-size:calc(clamp(26px,6vw,110px) * var(--stz-scale));transition:opacity .15s;}
    .stz-secondary{line-height:1.4;word-break:break-word;white-space:pre-wrap;margin-top:16px;
        font-size:calc(clamp(16px,3.2vw,52px) * var(--stz-scale));opacity:.85;transition:opacity .15s;}
    .stz-lines[data-layout="side"] .stz-secondary{margin-top:0;}
    .stz-lines[data-layout="single"] .stz-secondary{display:none;}
    .stz-speaker{position:absolute;right:24px;bottom:24px;z-index:2;display:inline-block;
        font-size:calc(clamp(12px,1.3vw,17px)*var(--stz-scale));
        font-weight:bold;color:#fff;border-radius:20px;padding:2px 12px;
        letter-spacing:1px;font-family:monospace;opacity:.7;}
    .stz-overlay.stz-mono .stz-primary, .stz-overlay.stz-mono .stz-secondary{
        font-family:Consolas,"Courier New",monospace;}
    .stz-overlay.stz-bold .stz-primary{font-weight:900;}
    .stz-overlay.stz-bold .stz-lyric-line{font-weight:700;}

    /* --- 主題：黑底白字 --- */
    [data-stz-theme="dark"] .stz-stage{background:#000;}
    [data-stz-theme="dark"] .stz-primary{color:#fff;}
    [data-stz-theme="dark"] .stz-secondary{color:#B0BEC5;}

    /* --- 主題：白底黑字 --- */
    [data-stz-theme="light"] .stz-stage{background:#fff;}
    [data-stz-theme="light"] .stz-primary{color:#111;}
    [data-stz-theme="light"] .stz-secondary{color:#555;}

    /* --- 主題：黃字黑邊 / 白字黑邊（無底色，方格代表透明示意） --- */
    [data-stz-theme="yellow-outline"] .stz-stage, [data-stz-theme="white-outline"] .stz-stage{
        background-image:repeating-conic-gradient(#1c1c1c 0% 25%, #272727 0% 50%);
        background-size:30px 30px;}
    [data-stz-theme="yellow-outline"] .stz-primary{color:#FFEE58;-webkit-text-stroke:1.6px #000;
        paint-order:stroke fill;text-shadow:0 2px 6px rgba(0,0,0,.5);}
    [data-stz-theme="yellow-outline"] .stz-secondary{color:#FFF59D;-webkit-text-stroke:1px #000;
        paint-order:stroke fill;text-shadow:0 1px 4px rgba(0,0,0,.5);}
    [data-stz-theme="white-outline"] .stz-primary{color:#fff;-webkit-text-stroke:1.6px #000;
        paint-order:stroke fill;text-shadow:0 2px 6px rgba(0,0,0,.5);}
    [data-stz-theme="white-outline"] .stz-secondary{color:#eee;-webkit-text-stroke:1px #000;
        paint-order:stroke fill;text-shadow:0 1px 4px rgba(0,0,0,.5);}

    /* --- 主題：半透明黑底（可疊在原本畫面上） --- */
    [data-stz-theme="translucent"] .stz-stage{background:rgba(0,0,0,.55);}
    [data-stz-theme="translucent"] .stz-primary{color:#fff;}
    [data-stz-theme="translucent"] .stz-secondary{color:#E0E0E0;}

    /* --- 主題：毛玻璃霧面 --- */
    [data-stz-theme="frosted"] .stz-stage{background:rgba(255,255,255,.10);
        backdrop-filter:blur(18px);-webkit-backdrop-filter:blur(18px);}
    [data-stz-theme="frosted"] .stz-primary{color:#fff;text-shadow:0 2px 14px rgba(0,0,0,.35);}
    [data-stz-theme="frosted"] .stz-secondary{color:rgba(255,255,255,.82);}

    /* --- 主題：卡拉OK 逐字上色（依目前句子播放進度左到右上色） --- */
    [data-stz-theme="karaoke"] .stz-stage{background:#000;}
    [data-stz-theme="karaoke"] .stz-secondary{color:#B0BEC5;}
    [data-stz-theme="karaoke"] .stz-primary{
        background-image:linear-gradient(90deg,#FFD54F var(--stz-progress,0%),rgba(255,255,255,.32) var(--stz-progress,0%));
        -webkit-background-clip:text;background-clip:text;color:transparent;}

    /* --- 主題：逐字稿捲動（Spotify 歌詞風） --- */
    [data-stz-theme="lyrics"] .stz-stage{background:linear-gradient(#0c0c0c,#000);padding:0;cursor:default;}
    .stz-lyrics-wrap{display:none;width:100%;height:100%;overflow-y:auto;padding:40vh 8vw;
        box-sizing:border-box;scroll-behavior:smooth;}
    [data-stz-theme="lyrics"] .stz-lyrics-wrap{display:block;}
    [data-stz-theme="lyrics"] .stz-lines{display:none;}
    .stz-lyric-line{color:#616161;font-size:calc(clamp(18px,3vw,40px)*var(--stz-scale));
        line-height:1.9;font-weight:400;text-align:center;transition:color .25s, transform .25s;
        cursor:pointer;white-space:pre-wrap;word-break:break-word;}
    .stz-lyric-line:hover{color:#9E9E9E;}
    .stz-lyric-line.stz-lyric-active{color:#fff;transform:scale(1.04);}
    .stz-lyric-line .stz-lyric-sub{display:block;font-size:.55em;font-weight:400;opacity:.65;margin-top:4px;}

    /* --- 主題：繪本模式（圖片為主要呈現，字幕貼在底部，仿照影片字幕條） ---
       這個模式一律顯示跨句圖片群組的圖片（不受「顯示圖片」開關影響，見 JS 端邏輯），
       .stz-mg-bg 鋪滿整個畫面當背景，字幕從置中大字改成貼底部的半透明字幕條。 */
    [data-stz-theme="picturebook"] .stz-stage{background:#000;padding:0;align-items:flex-end;}
    [data-stz-theme="picturebook"] .stz-mg-bg{background-color:#000;}
    /* ★ 圖片要清楚：上面 .stz-overlay.stz-mg-active .stz-stage 那條全域規則會把舞台蓋上
       45% 黑色（是為了讓其他主題的大字在照片上還能維持對比），但繪本模式本來就是要
       讓圖片本身清楚呈現，所以這裡蓋掉、改回透明，不要疊灰。 */
    .stz-overlay[data-stz-theme="picturebook"].stz-mg-active .stz-stage{background:transparent !important;}
    /* 字幕條：預設字級較小、上下邊距較窄、不要圓角，比較貼近一般影片字幕的比例，
       不搶過圖片本身的視覺焦點。★ 這裡刻意不設 position/z-index——.stz-stage 本身
       在 DOM 順序上已經排在 .stz-mg-bg / .stz-pb-empty 之後，自然會蓋在上面，不需要
       額外建立定位環境；若在這裡加 position:relative 反而會讓段落編號（.stz-speaker，
       靠 right/bottom 定位）誤把這個字幕條窄框當成定位基準，跑到正中央擋住字幕。 */
    [data-stz-theme="picturebook"] .stz-lines{max-width:88%;
        margin:0 auto 2.5vh;background:rgba(0,0,0,.6);border-radius:0;
        padding:5px 20px;box-sizing:border-box;}
    [data-stz-theme="picturebook"] .stz-primary{color:#fff;
        font-size:calc(clamp(15px,2.2vw,30px)*var(--stz-scale));}
    [data-stz-theme="picturebook"] .stz-secondary{color:#E0E0E0;
        font-size:calc(clamp(12px,1.6vw,20px)*var(--stz-scale));}
    /* 段落編號：其他主題是貼在整個畫面右下角的小標籤，但繪本模式的右下角現在是
       字幕條的位置，會疊在一起、擋住字幕文字，所以繪本模式改貼到畫面左上角
       （圖片本身的角落），跟字幕分開，不互相干擾。 */
    [data-stz-theme="picturebook"] .stz-speaker{top:20px;left:20px;right:auto;bottom:auto;}
    /* 目前時間沒有落在任何「已設定圖片」的群組區間內時，顯示提示文字，
       避免畫面看起來只是黑畫面／沒載入成功 */
    .stz-pb-empty{position:absolute;inset:0;z-index:0;display:none;
        align-items:center;justify-content:center;color:#555;font-size:1.3rem;
        letter-spacing:2px;}
    [data-stz-theme="picturebook"]:not(.stz-mg-active) .stz-pb-empty{display:flex;}

    /* --- 排版：同大小不同色雙語 --- */
    .stz-lines[data-layout="colorsplit"] .stz-secondary{opacity:1;color:#4FC3F7;font-size:inherit;margin-top:12px;}
    [data-stz-theme="light"] .stz-lines[data-layout="colorsplit"] .stz-secondary{color:#1565C0;}

    /* --- 控制列與設定面板：浮貼在畫面上方／下方，底色依主題為黑或白（不透空） --- */
    .stz-topbar, .stz-controlbar{position:absolute;left:0;right:0;z-index:3;
        display:flex;align-items:center;background:rgba(0,0,0,.62);color:#fff;
        transition:opacity .3s, transform .3s;}
    .stz-topbar{top:0;justify-content:flex-end;gap:2px;padding:8px 10px;}
    .stz-controlbar{bottom:0;gap:10px;padding:10px 16px;flex-wrap:nowrap;}
    .stz-overlay.stz-hide-ui .stz-controlbar, .stz-overlay.stz-hide-ui .stz-topbar{
        opacity:0;pointer-events:none;}
    .stz-overlay.stz-hide-ui .stz-topbar{transform:translateY(-6px);}
    .stz-overlay.stz-hide-ui .stz-controlbar{transform:translateY(6px);}
    .stz-overlay.stz-hide-ui .stz-stage{cursor:none;}

    /* 白底黑字主題：控制列改為淺色底、深色字，維持可讀性 */
    [data-stz-theme="light"] .stz-topbar, [data-stz-theme="light"] .stz-controlbar{
        background:rgba(255,255,255,.9);color:#111;}
    [data-stz-theme="light"] .stz-time{color:#111;}
    [data-stz-theme="light"] .stz-seek{accent-color:#1565C0;}

    /* 按鈕：拿掉灰色橢圓底，預設透明、僅在 hover / focus 時給輕微提示 */
    .stz-btn{background:transparent;border:none;color:inherit;width:36px;height:36px;
        border-radius:6px;display:flex;align-items:center;justify-content:center;cursor:pointer;
        flex-shrink:0;opacity:.88;transition:background .15s,opacity .15s;}
    .stz-btn:hover, .stz-btn:focus-visible{background:rgba(128,128,128,.18);opacity:1;}
    .stz-btn:active{background:rgba(128,128,128,.28);}
    .stz-btn .material-icons{font-size:21px;}
    .stz-seek{flex:1;accent-color:#4FC3F7;cursor:pointer;min-width:40px;background:transparent;}
    .stz-time{color:#fff;font-size:.78rem;font-family:monospace;white-space:nowrap;flex-shrink:0;}
    .stz-settings-panel{position:absolute;top:56px;left:14px;z-index:3;background:#1e1e1e;
        color:#eee;border-radius:10px;padding:16px;width:250px;box-sizing:border-box;
        box-shadow:0 6px 24px rgba(0,0,0,.4);display:none;font-size:.85rem;
        max-height:calc(100% - 56px - 76px);overflow-y:auto;overscroll-behavior:contain;}
    /* ★ 修改：面板高度改成「扣掉頂端位置(56px)與底部控制列(約 60px＋間距)」，並用 % 取代 100vh（手機瀏覽器網址列會讓 100vh 比實際可視高度大），避免面板最下方（字級大小）被控制列蓋住 */
    .stz-overlay.stz-immersive .stz-settings-panel{max-height:calc(100% - 72px);} /* ★ 增加：沉浸式隱藏控制列時，面板可用到接近底部 */
    .stz-settings-panel::-webkit-scrollbar{width:8px;}
    .stz-settings-panel::-webkit-scrollbar-thumb{background:#555;border-radius:4px;}
    .stz-settings-panel::-webkit-scrollbar-track{background:transparent;}
    .stz-settings-panel.stz-show{display:block;}
    .stz-settings-panel label{display:block;margin:10px 0 4px;font-weight:bold;color:#B0BEC5;}
    .stz-settings-panel select, .stz-settings-panel input[type=range]{width:100%;box-sizing:border-box;}
    .stz-settings-panel select{background:#2c2c2c;color:#fff;border:1px solid #444;border-radius:6px;padding:5px;}
    .stz-chkrow{display:flex;align-items:center;gap:8px;margin:10px 0;cursor:pointer;}
    .stz-mini-btn{background:#333;color:#fff;border:1px solid #555;border-radius:6px;
        padding:6px 10px;cursor:pointer;font-size:.78rem;}
    .stz-mini-btn:hover{background:#3d3d3d;}
    .stz-follow-count-row{display:flex;align-items:center;gap:8px;margin:2px 0 4px 26px;color:#B0BEC5;}
    .stz-settings-panel input[type=number]{width:64px;box-sizing:border-box;background:#2c2c2c;color:#fff;
        border:1px solid #444;border-radius:6px;padding:4px 6px;}
    .stz-hint-small{font-size:.7rem;color:#888;margin-top:4px;line-height:1.4;}
    .stz-empty{color:#888;font-size:1.2rem;text-align:center;padding:20px;}

    /* --- 沉浸式播放：完全隱藏工具列與時間軸，純鍵盤操作 --- */
    .stz-overlay.stz-immersive .stz-topbar,
    .stz-overlay.stz-immersive .stz-controlbar{display:none !important;}
    .stz-corner-trigger{position:absolute;top:0;left:0;width:64px;height:64px;z-index:4;
        cursor:pointer;background:transparent;}
    .stz-corner-close{position:absolute;top:0;right:0;width:64px;height:64px;z-index:4;
        cursor:pointer;background:transparent;pointer-events:none;}
    .stz-overlay.stz-immersive .stz-corner-close{pointer-events:auto;}
    .stz-overlay.stz-immersive .stz-corner-trigger::after{content:'tune';
        font-family:'Material Icons';position:absolute;top:10px;left:10px;font-size:20px;
        color:rgba(255,255,255,.32);opacity:0;transition:opacity .2s;}
    .stz-overlay.stz-immersive .stz-corner-close::after{content:'close';
        font-family:'Material Icons';position:absolute;top:10px;right:10px;font-size:20px;
        color:rgba(255,255,255,.32);opacity:0;transition:opacity .2s;}
    .stz-overlay.stz-immersive .stz-corner-trigger:hover::after,
    .stz-overlay.stz-immersive .stz-corner-close:hover::after{opacity:1;}
    [data-stz-theme="light"] .stz-overlay.stz-immersive .stz-corner-trigger::after,
    [data-stz-theme="light"] .stz-overlay.stz-immersive .stz-corner-close::after{color:rgba(0,0,0,.32);}

    /* --- 沉浸式播放：靠近左下角/右下角時浮現播放鈕與時間軸 --- */
    .stz-corner-playpause{position:absolute;left:0;bottom:0;width:70px;height:70px;z-index:4;
        display:none;align-items:center;justify-content:center;cursor:pointer;pointer-events:none;}
    .stz-overlay.stz-immersive .stz-corner-playpause{display:flex;pointer-events:auto;}
    .stz-corner-playpause .material-icons{font-size:24px;opacity:0;transition:opacity .2s;
        color:rgba(255,255,255,.32);}
    .stz-corner-playpause:hover .material-icons{opacity:1;}
    [data-stz-theme="light"] .stz-corner-playpause .material-icons{color:rgba(0,0,0,.32);}

    .stz-corner-seek{position:absolute;right:16px;bottom:18px;width:260px;max-width:42vw;
        z-index:4;display:none;align-items:center;gap:8px;opacity:0;transition:opacity .25s;
        pointer-events:none;}
    .stz-overlay.stz-immersive .stz-corner-seek{display:flex;pointer-events:auto;}
    .stz-overlay.stz-immersive .stz-corner-seek:hover,
    .stz-overlay.stz-immersive .stz-corner-seek:focus-within{opacity:1;}
    `;
    const styleTag = document.createElement('style');
    styleTag.id = 'stzStyles';
    styleTag.textContent = css;
    document.head.appendChild(styleTag);

    // ================= ③ DOM 建構 =================
    const overlay = document.createElement('div');
    overlay.className = 'stz-overlay';
    overlay.innerHTML = `
        <div class="stz-corner-trigger" data-act="settings" title="設定"></div>
        <div class="stz-corner-close" data-act="close" title="關閉"></div>
        <div class="stz-corner-playpause" data-act="playpause" title="播放／暫停 (Space)">
            <span class="material-icons" id="stzImmersivePlayIcon">play_arrow</span>
        </div>
        <div class="stz-corner-seek">
            <input type="range" class="stz-seek" id="stzImmersiveSeek" min="0" max="1000" value="0">
            <span class="stz-time" id="stzImmersiveTimeLabel">0:00 / 0:00</span>
        </div>
        <div class="stz-bg-image" id="stzBgImage"></div>
        <!-- ★ 新增（階段三）：跨句圖片群組背景層，疊在上面那層之上 -->
        <div class="stz-mg-bg" id="stzMgBg"></div>
        <!-- ★ 新增：繪本模式專用，目前時間沒有落在已設圖片的群組區間內時顯示 -->
        <div class="stz-pb-empty" id="stzPbEmpty">（尚無圖片）</div>
        <div class="stz-topbar">
            <button class="stz-btn" data-act="settings" title="顯示設定"><span class="material-icons">tune</span></button>
            <button class="stz-btn" data-act="fullscreen" title="全螢幕"><span class="material-icons" id="stzFsIcon">fullscreen</span></button>
            <button class="stz-btn" data-act="close" title="關閉 (Esc)"><span class="material-icons">close</span></button>
        </div>
        <div class="stz-settings-panel" id="stzSettingsPanel">
            <label>展示風格</label>
            <select id="stzThemeSel">
                <option value="dark">黑底白字</option>
                <option value="light">白底黑字</option>
                <option value="yellow-outline">黃字黑邊（無底色）</option>
                <option value="white-outline">白字黑邊（無底色）</option>
                <option value="translucent">半透明黑底（可疊畫面）</option>
                <option value="frosted">毛玻璃霧面</option>
                <option value="lyrics">逐字稿捲動（歌詞風）</option>
                <option value="karaoke">卡拉OK 逐句上色</option>
                <option value="picturebook">繪本模式（圖片為主，字幕在下方）</option>
            </select>
            <label>雙語排版</label>
            <select id="stzLayoutSel">
                <option value="single">只顯示語言 A</option>
                <option value="stacked">上下雙語（A大 / B小）</option>
                <option value="side">左右雙語（同排）</option>
                <option value="colorsplit">上下雙語（同大小不同色）</option>
            </select>
            <label>語言 A（主要）</label>
            <select id="stzLangASel"></select>
            <label>語言 B（次要）</label>
            <select id="stzLangBSel"></select>
            <label class="stz-chkrow"><input type="checkbox" id="stzSpeakerChk"> 顯示段落編號</label>
            <label class="stz-chkrow"><input type="checkbox" id="stzMonoChk"> 等寬字型</label>
            <label class="stz-chkrow"><input type="checkbox" id="stzBoldChk"> 粗體字</label>
            <label class="stz-chkrow"><input type="checkbox" id="stzHidePunctChk"> 隱藏標點（句首、句尾的標點移除；句中的標點改為一個空格）</label>
            <label class="stz-chkrow"><input type="checkbox" id="stzFollowChk"> 跟讀模式（每句唸完後停頓，再以較小音量重複）</label>
            <div id="stzFollowRow" style="display:none;">
                <div class="stz-follow-count-row">跟讀次數 <input type="number" id="stzFollowCountInput" min="1" max="10" step="1" value="1"> 次</div>
                <div class="stz-hint-small" style="margin-left:26px;">跨句群組涵蓋的句子不會套用跟讀（太長，跟讀無意義）。</div>
            </div>
            <label class="stz-chkrow"><input type="checkbox" id="stzImmersiveChk"> 沉浸式播放（隱藏工具列與時間軸，純鍵盤操作）</label>
            <label class="stz-chkrow"><input type="checkbox" id="stzShowGroupImageChk"> 顯示圖片（播放到跨句圖片群組已設定圖片的區間時，疊上背景圖）</label>
            <div class="stz-hint-small" id="stzShowGroupImageHint" style="display:none;">繪本模式一律顯示圖片，此選項已鎖定。</div>
            <label>背景圖片（毛玻璃／半透明主題才看得到）</label>
            <select id="stzBgModeSel">
                <option value="none">無（純色）</option>
                <option value="auto">自動隨機風景圖</option>
                <option value="custom">自訂上傳圖片</option>
            </select>
            <div id="stzBgAutoRow" style="display:none;margin-top:6px;">
                <button type="button" class="stz-mini-btn" id="stzBgRefreshBtn">🔄 換一張</button>
            </div>
            <input type="file" id="stzBgFileInput" accept="image/*" style="display:none;margin-top:6px;width:100%;">
            <div class="stz-hint-small" id="stzBgHint" style="display:none;">重新整理頁面後需要重新選取，圖片不會被保存。</div>
            <label>字級大小</label>
            <input type="range" id="stzFontRange" min="0.6" max="2" step="0.1" value="1">
        </div>
        <div class="stz-stage">
            <div class="stz-lines" id="stzLines" data-layout="single">
                <div>
                    <div class="stz-speaker" id="stzSpeaker" style="display:none;"></div>
                    <div class="stz-primary" id="stzPrimary"></div>
                    <div class="stz-secondary" id="stzSecondary"></div>
                </div>
            </div>
            <div class="stz-lyrics-wrap" id="stzLyricsWrap"></div>
        </div>
        <div class="stz-controlbar">
            <button class="stz-btn" data-act="prev" title="上一句"><span class="material-icons">skip_previous</span></button>
            <button class="stz-btn" data-act="playpause" title="播放／暫停 (Space)"><span class="material-icons" id="stzPlayIcon">play_arrow</span></button>
            <button class="stz-btn" data-act="next" title="下一句"><span class="material-icons">skip_next</span></button>
            <input type="range" class="stz-seek" id="stzSeek" min="0" max="1000" value="0">
            <span class="stz-time" id="stzTimeLabel">0:00 / 0:00</span>
        </div>
    `;
    document.body.appendChild(overlay);

    // 快取節點
    const els = {
        lines: overlay.querySelector('#stzLines'),
        primary: overlay.querySelector('#stzPrimary'),
        secondary: overlay.querySelector('#stzSecondary'),
        speaker: overlay.querySelector('#stzSpeaker'),
        lyricsWrap: overlay.querySelector('#stzLyricsWrap'),
        settingsPanel: overlay.querySelector('#stzSettingsPanel'),
        themeSel: overlay.querySelector('#stzThemeSel'),
        layoutSel: overlay.querySelector('#stzLayoutSel'),
        langASel: overlay.querySelector('#stzLangASel'),
        langBSel: overlay.querySelector('#stzLangBSel'),
        speakerChk: overlay.querySelector('#stzSpeakerChk'),
        monoChk: overlay.querySelector('#stzMonoChk'),
        boldChk: overlay.querySelector('#stzBoldChk'),
        hidePunctChk: overlay.querySelector('#stzHidePunctChk'),
        followChk: overlay.querySelector('#stzFollowChk'),
        followRow: overlay.querySelector('#stzFollowRow'),
        followCountInput: overlay.querySelector('#stzFollowCountInput'),
        immersiveChk: overlay.querySelector('#stzImmersiveChk'),
        showGroupImageChk: overlay.querySelector('#stzShowGroupImageChk'),
        showGroupImageHint: overlay.querySelector('#stzShowGroupImageHint'),
        bgImage: overlay.querySelector('#stzBgImage'),
        mgBg: overlay.querySelector('#stzMgBg'),
        bgModeSel: overlay.querySelector('#stzBgModeSel'),
        bgAutoRow: overlay.querySelector('#stzBgAutoRow'),
        bgRefreshBtn: overlay.querySelector('#stzBgRefreshBtn'),
        bgFileInput: overlay.querySelector('#stzBgFileInput'),
        bgHint: overlay.querySelector('#stzBgHint'),
        fontRange: overlay.querySelector('#stzFontRange'),
        playIcon: overlay.querySelector('#stzPlayIcon'),
        fsIcon: overlay.querySelector('#stzFsIcon'),
        seek: overlay.querySelector('#stzSeek'),
        timeLabel: overlay.querySelector('#stzTimeLabel'),
        immersivePlayIcon: overlay.querySelector('#stzImmersivePlayIcon'),
        immersiveSeek: overlay.querySelector('#stzImmersiveSeek'),
        immersiveTimeLabel: overlay.querySelector('#stzImmersiveTimeLabel')
    };

    // ================= ④ 觸發入口綁定：掛在既有「檢視」選單裡的項目上 =================
    // 展示模式的開關現在是 index.html #viewMenu 裡的 #openSubtitleTheaterMenuBtn 選單項，
    // 不再另外注入一顆獨立按鈕；找不到該選單項時（例如 index.html 尚未加上該項）才退回
    // 浮動按鈕備援，避免功能完全消失、找不到入口。
    function bindTriggerMenuItem() {
        const menuItem = document.getElementById('openSubtitleTheaterMenuBtn');
        if (menuItem) {
            menuItem.addEventListener('click', (e) => {
                e.stopPropagation();
                document.getElementById('viewMenu')?.classList.remove('show');
                openTheater();
            });
            return;
        }
        // 備援：找不到「檢視」選單項目時，改用固定在畫面右下角的浮動按鈕
        const btn = document.createElement('button');
        btn.id = 'openSubtitleTheaterBtn';
        btn.title = '字幕展示模式（純觀看，可投影／分享畫面）';
        btn.setAttribute('aria-label', '字幕展示模式');
        btn.innerHTML = '<span class="material-icons">theaters</span>';
        btn.style.cssText = 'background:#111;color:#FFD54F;border:1px solid #333;position:fixed;right:20px;bottom:20px;z-index:9000;width:48px;height:48px;box-shadow:0 2px 10px rgba(0,0,0,.3);border-radius:50%;';
        btn.addEventListener('click', openTheater);
        document.body.appendChild(btn);
    }
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', bindTriggerMenuItem);
    } else {
        bindTriggerMenuItem();
    }

    // ================= ⑤ 核心同步邏輯 =================
    let rafHandle = null;
    let lastActiveLabel = null;
    let stzSeeking = false;
    let lastUiInteract = 0;
    let lastMouseMove = 0;
    let customBgObjectUrl = null; // 使用者自訂上傳的背景圖片（僅存於本次瀏覽階段，不持久化）
    let prevBodyOverflow = '';
    let prevHtmlOverflow = '';
    // ★ 跨句圖片群組背景整合。圖片改用網址參照（見 3a_media_groups_core.js），
    // 直接設成 background-image 即可，不需要非同步讀檔，也不需要快取或釋放任何 Blob URL。
    // lastMgGroupId 只用來偵測「目前命中的群組是否換了」，避免每個影格都重複設定同一張圖。
    let lastMgGroupId = null;

    function randomBgUrl(seed) {
        return `https://picsum.photos/1600/900?random=${encodeURIComponent(seed || '1')}`;
    }

    function applyBgImage() {
        if (st.bgMode === 'auto') {
            if (!st.bgAutoSeed) { st.bgAutoSeed = String(Date.now()); saveState(); }
            els.bgImage.style.backgroundImage = `url("${randomBgUrl(st.bgAutoSeed)}")`;
        } else if (st.bgMode === 'custom' && customBgObjectUrl) {
            els.bgImage.style.backgroundImage = `url("${customBgObjectUrl}")`;
        } else {
            els.bgImage.style.backgroundImage = 'none';
        }
    }

    function findActiveLabelByTime(t) {
        let found = null;

        // ★ 修正：找出「最後一個有時間標記」的句子索引，用來判斷是否已經播放完畢。
        //   下面的 fallback（t >= times.start 就沿用該句字幕）原本是為了處理句與句
        //   之間的自然空檔（例如 C08 結束到 C09 開始中間有段靜音，畫面繼續顯示 C08），
        //   但對「最後一句」而言，迴圈之後沒有下一句可以再覆蓋 found，導致只要播放
        //   時間一過 t >= times.start，不論是否早已超過 times.end（整段播放已結束），
        //   字幕都會永遠卡在畫面上不消失。
        let lastValidIdx = -1;
        for (let i = allLabelsOrdered.length - 1; i >= 0; i--) {
            if (timeDataMap[allLabelsOrdered[i]] !== undefined) { lastValidIdx = i; break; }
        }

        for (let i = 0; i < allLabelsOrdered.length; i++) {
            const label = allLabelsOrdered[i];
            if (timeDataMap[label] === undefined) continue;
            const times = getCalculatedTimes(label, i);
            if (!times) continue;
            if (t >= times.start && t < times.end) { found = label; break; }
            if (t >= times.start) {
                // 若是最後一句，且已經超過它的結束時間，代表整份字幕已播放完畢，
                // 不應該再繼續顯示任何字幕（清空，而不是沿用最後一句）。
                if (i === lastValidIdx && t >= times.end) {
                    found = null;
                } else {
                    found = label;
                }
            }
        }
        return found;
    }

    // 依目前播放時間，找出落在哪個跨句圖片群組（mediaGroups）內。
    // 只認時間區間，跟句子 label 完全無關，句子合併/分割不會影響到這裡的判斷。
    // 只挑「已經設定圖片網址」的群組——純書籤、還沒填網址的群組先當作沒有命中，維持原本畫面。
    function findActiveMediaGroupByTime(t) {
        if (typeof getMediaGroupsAt !== 'function') return null;
        const hits = getMediaGroupsAt(t);
        return hits.find(g => g.imageUrl && g.imageUrl.trim()) || null;
    }

    // 依命中的群組切換背景圖層；group 為 null 時代表離開所有群組範圍，還原成一般畫面。
    // ★ 圖片是網址參照，直接設定 background-image 即可，不需要任何非同步讀檔。
    function updateMediaGroupBg(group) {
        if (!group) {
            overlay.classList.remove('stz-mg-active');
            els.mgBg.style.backgroundImage = 'none';
            return;
        }
        overlay.classList.add('stz-mg-active');
        els.mgBg.style.backgroundImage = `url("${group.imageUrl}")`;
    }

    // ================= ★ 新增：隱藏標點 =================
    // 規則：句首、句尾的標點（連同相鄰空白）整段移除；句中的標點改成「一個空格」，
    //       多個標點（或標點加空白）連在一起，同樣只變成一個空格。
    // 標點的判定：Unicode 標點類別 \p{P}（涵蓋全形／半形的 ，。、！？「」『』【】（）… — _ 等），
    //             另外補上 ~ ～（它們在 Unicode 不算標點，但字幕常當標點用）。
    // 以下情況不算標點，會原樣保留，避免弄壞內容：
    //   1. ALWAYS_KEEP：% & @ # * 這類「符號」（例如 50%）。
    //   2. KEEP_INNER：' ’ - . , : / 夾在兩個英數字之間時（don't、3.5、12:30、e-mail）。
    //   3. 客語拼音的聲調符號 ˊ ˋ ˇ ^ ` ´ 在 Unicode 屬於符號／修飾字母，不是 \p{P}，本來就不會被動到。
    const PUNCT_RE = /[\p{P}~～]/u;
    const ALWAYS_KEEP = new Set(['%', '％', '&', '＆', '@', '＠', '#', '＃', '*', '＊', '‰', '‱']);
    const KEEP_INNER = new Set(["'", '’', '-', '.', ',', ':', '/']);
    const ALNUM_RE = /[A-Za-z0-9]/;

    function stripPunctuation(text) {
        const chars = Array.from(String(text == null ? '' : text));
        const n = chars.length;
        const isWs = c => /\s/.test(c);
        const isPunct = i => {
            const c = chars[i];
            if (!PUNCT_RE.test(c) || ALWAYS_KEEP.has(c)) return false;
            if (KEEP_INNER.has(c) && i > 0 && i < n - 1 &&
                ALNUM_RE.test(chars[i - 1]) && ALNUM_RE.test(chars[i + 1])) return false;
            return true;
        };
        let out = '';
        let i = 0;
        while (i < n) {
            if (!isWs(chars[i]) && !isPunct(i)) { out += chars[i]; i++; continue; }
            // 找出這一段連續的「標點／空白」
            let j = i, hasPunct = false;
            while (j < n && (isWs(chars[j]) || isPunct(j))) { if (isPunct(j)) hasPunct = true; j++; }
            if (!hasPunct) out += chars.slice(i, j).join('');      // 純空白：原樣保留
            else if (out.trim() !== '' && j < n) out += ' ';         // 句中：一個空格（句首、句尾則整段丟掉）
            i = j;
        }
        return out;
    }

    // 顯示前的統一出口：依設定決定要不要隱藏標點
    function displayText(text) {
        return st.hidePunct ? stripPunctuation(text) : text;
    }

    function paragraphColor(letterCode) {
        const idx = (letterCode - 65 + 10) % 10; // A=0 ... 循環使用 10 色調色盤
        return `var(--color-p${idx}, #607D8B)`;
    }

    function renderCurrent(label) {
        if (!label || !sentenceTextMap.hasOwnProperty(label)) {
            els.primary.textContent = allLabelsOrdered.length ? '' : '（尚無字幕資料）';
            els.secondary.textContent = '';
            els.speaker.style.display = 'none';
            overlay.style.setProperty('--stz-progress', '0%');
            return;
        }
        const raw = sentenceTextMap[label] || '';
        const textA = (typeof getLang === 'function') ? getLang(raw, st.langA) : raw;
        const textB = (typeof getLang === 'function' && getLangMultiEnabled()) ? getLang(raw, st.langB) : '';
        els.primary.textContent = displayText(textA);
        els.secondary.textContent = displayText(textB);

        if (st.showSpeaker) {
            const letter = label.charAt(0);
            els.speaker.textContent = label;
            els.speaker.style.background = paragraphColor(letter.charCodeAt(0));
            els.speaker.style.display = 'inline-block';
        } else {
            els.speaker.style.display = 'none';
        }
    }

    function updateKaraokeProgress(label) {
        if (st.theme !== 'karaoke' || !label) return;
        const idx = allLabelsOrdered.indexOf(label);
        const times = getCalculatedTimes(label, idx);
        if (!times || times.duration <= 0) { overlay.style.setProperty('--stz-progress', '0%'); return; }
        const frac = Math.min(1, Math.max(0, (audioPlayer.currentTime - times.start) / times.duration));
        overlay.style.setProperty('--stz-progress', (frac * 100).toFixed(1) + '%');
    }

    // 逐字稿捲動清單：只在切換到 lyrics 主題、或開啟時重建一次
    let lyricsBuilt = false;
    function buildLyricsList() {
        let html = '';
        allLabelsOrdered.forEach(label => {
            const raw = sentenceTextMap[label] || '';
            const textA = (typeof getLang === 'function') ? getLang(raw, st.langA) : raw;
            const textB = (typeof getLang === 'function' && getLangMultiEnabled() && st.layout !== 'single') ? getLang(raw, st.langB) : '';
            html += `<div class="stz-lyric-line" data-label="${label}">${escapeHtml(displayText(textA)) || '&nbsp;'}${displayText(textB) ? `<span class="stz-lyric-sub">${escapeHtml(displayText(textB))}</span>` : ''}</div>`;
        });
        els.lyricsWrap.innerHTML = html || '<div class="stz-empty">（尚無字幕資料）</div>';
        lyricsBuilt = true;
        els.lyricsWrap.querySelectorAll('.stz-lyric-line').forEach(node => {
            node.addEventListener('click', () => jumpToLabel(node.dataset.label, false));
        });
    }
    function escapeHtml(s) {
        return String(s || '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
    }
    function highlightLyricsLine(label) {
        const prev = els.lyricsWrap.querySelector('.stz-lyric-active');
        if (prev) prev.classList.remove('stz-lyric-active');
        if (!label) return;
        const node = els.lyricsWrap.querySelector(`.stz-lyric-line[data-label="${CSS.escape(label)}"]`);
        if (node) {
            node.classList.add('stz-lyric-active');
            node.scrollIntoView({ block: 'center', behavior: 'smooth' });
        }
    }

    function tick() {
        if (!overlay.classList.contains('stz-open')) return;
        const t = audioPlayer.currentTime || 0;
        let label = findActiveLabelByTime(t);

        // ★ 新增：跟讀模式狀態機。跟讀進行中（含停頓、重複播放）時，畫面固定停在被跟讀的那一句，
        //   不能讓字幕在停頓期間跳去下一句（句子首尾相接，t 剛好落在下一句的範圍內）。
        followTick(t, label);
        if (follow.active) label = follow.label;

        if (label !== lastActiveLabel) {
            lastActiveLabel = label;
            if (st.theme === 'lyrics') highlightLyricsLine(label);
            else renderCurrent(label);
        }
        if (st.theme === 'karaoke') updateKaraokeProgress(label);

        // 跨句圖片群組偵測，跟上面的逐句字幕邏輯完全獨立、互不影響。
        // ★ 預設不偵測（維持原本純色背景）：只有使用者勾選「顯示圖片」，
        // 或目前是一律顯示圖片的繪本模式，才會真的去找目前時間命中哪個群組。
        const wantsGroupImage = st.showGroupImage || st.theme === 'picturebook';
        const activeGroup = wantsGroupImage ? findActiveMediaGroupByTime(t) : null;
        const activeGroupId = activeGroup ? activeGroup.id : null;
        if (activeGroupId !== lastMgGroupId) {
            lastMgGroupId = activeGroupId;
            updateMediaGroupBg(activeGroup);
        }

        // 播放圖示與底部進度條（一般控制列 + 沉浸模式左下/右下角的版本，兩邊同步）
        const playLabel = audioPlayer.paused ? 'play_arrow' : 'pause';
        els.playIcon.textContent = playLabel;
        els.immersivePlayIcon.textContent = playLabel;
        if (!stzSeeking && audioPlayer.duration) {
            const seekVal = Math.round((t / audioPlayer.duration) * 1000);
            els.seek.value = seekVal;
            els.immersiveSeek.value = seekVal;
        }
        const timeStr = `${formatTime(t)} / ${formatTime(audioPlayer.duration || 0)}`;
        els.timeLabel.textContent = timeStr;
        els.immersiveTimeLabel.textContent = timeStr;

        // 播放中且閒置超過 3 秒，自動淡出控制列（單純展示、不干擾畫面）
        // ★ 沉浸模式下：只看「滑鼠」是否 3 秒沒動（按鍵盤不算），即使尚未開始播放也要隱藏
        const idleSince = st.immersive ? lastMouseMove : lastUiInteract;
        if ((st.immersive || !audioPlayer.paused) && Date.now() - idleSince > 3000) {
            overlay.classList.add('stz-hide-ui');
        }

        rafHandle = requestAnimationFrame(tick);
    }

    function wakeUi(mouseMoved) {
        lastUiInteract = Date.now();
        if (mouseMoved) lastMouseMove = Date.now();
        // 沉浸模式下，只有滑鼠動作才能讓畫面重新出現；按鍵盤不會喚醒游標/工具列
        if (mouseMoved || !st.immersive) {
            overlay.classList.remove('stz-hide-ui');
        }
    }

    // ================= ★ 新增：跟讀模式 =================
    // 流程：某一句自然播放到句尾 → 立刻暫停 → 停頓 FOLLOW_PAUSE_MS → 跳回句首、以較小音量重播
    //       → 重複滿「跟讀次數」→ 還原音量、再停頓一下 → 從下一句繼續正常播放。
    // 不套用的情況：該句的時間範圍與任何「跨句群組」重疊（群組太長，跟讀沒意義）。
    // 判定句尾是靠 tick（requestAnimationFrame，約 16ms 一次），比 timeupdate（約 250ms）精準，
    // 不會讓下一句的開頭漏出來。
    const FOLLOW_PAUSE_MS = 700;        // 唸完一遍後、重複前（以及全部重複完、繼續下一句前）的停頓，毫秒
    const FOLLOW_VOLUME_RATIO = 0.5;    // 重複時的音量 = 原音量 × 此比例
    const FOLLOW_TRIGGER_EARLY = 0.03;  // 提前一點判定句尾，抵銷 rAF 與 pause() 的延遲（秒）
    const FOLLOW_MAX_LAG = 0.4;         // 判定句尾時若已超過句尾這麼久（多半是使用者拖曳／跳轉），不觸發（秒）

    let followArmed = null; // 正在「自然播放中」的句子：{ label, start, end }
    const follow = {
        active: false,      // 跟讀流程進行中（包含停頓期間）
        token: 0,           // 每次啟動／取消都遞增，讓過期的 setTimeout 自動作廢
        timer: null,
        phase: 'idle',      // 'waiting'（停頓中）｜'repeating'（重複播放中）｜'idle'
        label: null, start: 0, end: 0,
        remaining: 0,       // 還剩幾次要重複
        resumeTime: 0,      // 全部重複完後，回到這個時間點繼續往下播
        baseVolume: 1,      // 啟動前的原音量
        lockUntil: 0        // 剛 seek 完的短時間內，不判定句尾（避免 seek 尚未完成就誤判）
    };

    function seekTo(time) {
        if (typeof wavesurfer !== 'undefined' && wavesurfer) wavesurfer.setTime(time);
        else audioPlayer.currentTime = time;
    }
    function safePlay() {
        const p = audioPlayer.play();
        if (p !== undefined) p.catch(err => { if (err.name !== 'AbortError') console.warn(err); });
    }

    // 該句時間範圍是否與任何跨句群組重疊
    function isSentenceInMediaGroup(times) {
        if (typeof mediaGroups === 'undefined' || !Array.isArray(mediaGroups)) return false;
        return mediaGroups.some(g => times.start < g.endTime && times.end > g.startTime);
    }

    // 中止跟讀並還原音量（不動播放位置與播放狀態，由呼叫端決定接下來怎麼做）
    function cancelFollow() {
        if (follow.active) audioPlayer.volume = follow.baseVolume;
        follow.token++;
        clearTimeout(follow.timer);
        follow.timer = null;
        follow.active = false;
        follow.phase = 'idle';
        followArmed = null;
    }

    function scheduleRepeat(token) {
        follow.phase = 'waiting';
        clearTimeout(follow.timer);
        follow.timer = setTimeout(() => {
            if (token !== follow.token || !follow.active) return;
            audioPlayer.volume = Math.min(1, follow.baseVolume * FOLLOW_VOLUME_RATIO);
            seekTo(follow.start);
            follow.lockUntil = Date.now() + 250;
            follow.phase = 'repeating';
            safePlay();
        }, FOLLOW_PAUSE_MS);
    }

    function scheduleResume(token) {
        follow.phase = 'waiting';
        clearTimeout(follow.timer);
        follow.timer = setTimeout(() => {
            if (token !== follow.token || !follow.active) return;
            const resumeAt = follow.resumeTime;
            cancelFollow(); // 此時音量已還原；cancelFollow 會清掉狀態
            const dur = audioPlayer.duration || 0;
            if (dur && resumeAt >= dur - 0.05) { seekTo(dur); return; } // 最後一句：停在結尾即可
            seekTo(resumeAt);
            safePlay();
        }, FOLLOW_PAUSE_MS);
    }

    function startFollow(a, t) {
        const token = ++follow.token;
        follow.active = true;
        follow.label = a.label;
        follow.start = a.start;
        follow.end = a.end;
        follow.remaining = st.followCount;
        follow.resumeTime = Math.max(t, a.end);
        follow.baseVolume = audioPlayer.volume;
        if (typeof verifyEndTime !== 'undefined') verifyEndTime = null; // 避免主程式殘留的「自動暫停」干擾重播
        audioPlayer.pause();
        scheduleRepeat(token);
    }

    function finishOneRepeat() {
        const token = follow.token;
        audioPlayer.pause();
        follow.remaining--;
        if (follow.remaining > 0) { scheduleRepeat(token); return; }
        audioPlayer.volume = follow.baseVolume; // 全部重複完，先把音量還原
        scheduleResume(token);
    }

    // 每個 tick 呼叫一次。label 為「依播放時間算出的句子」（尚未被跟讀流程覆蓋）
    function followTick(t, label) {
        if (!st.followMode) {
            if (follow.active || followArmed) cancelFollow();
            return;
        }
        if (follow.active) {
            if (follow.phase !== 'repeating') return;
            // 重複播放中被外部暫停（例如 play() 被瀏覽器擋下、或其他程式呼叫 pause）：放棄跟讀
            if (audioPlayer.paused && !audioPlayer.ended) { cancelFollow(); return; }
            if (audioPlayer.seeking || Date.now() < follow.lockUntil) return;
            if (t >= follow.end - FOLLOW_TRIGGER_EARLY || audioPlayer.ended) finishOneRepeat();
            return;
        }

        const playing = !audioPlayer.paused || audioPlayer.ended;

        // ① 先檢查「剛剛上膛的那一句」是否已播到句尾（必須在上膛之前檢查，
        //    否則句子首尾相接時，句尾的那一刻 label 已經是下一句，會把它覆蓋掉）
        if (followArmed && playing && t >= followArmed.end - FOLLOW_TRIGGER_EARLY) {
            const a = followArmed;
            followArmed = null;
            if (t - a.end <= FOLLOW_MAX_LAG && !isSentenceInMediaGroup(a)) {
                startFollow(a, t);
                return;
            }
        }

        // ② 播放中且落在某句範圍內 → 上膛
        if (playing && label) {
            const idx = allLabelsOrdered.indexOf(label);
            const times = getCalculatedTimes(label, idx);
            if (times && t >= times.start && t < times.end) {
                if (!followArmed || followArmed.label !== label) {
                    followArmed = { label: label, start: times.start, end: times.end };
                }
            }
        }
    }

    // ================= ⑥ 跳轉／播放控制（沿用專案既有的時間跳轉模式） =================
    function jumpToLabel(label, autoplay) {
        cancelFollow(); // ★ 新增：使用者手動跳句（上一句／下一句／點逐字稿）時，中止跟讀並還原音量
        if (!label || timeDataMap[label] === undefined) return;
        const idx = allLabelsOrdered.indexOf(label);
        const times = getCalculatedTimes(label, idx);
        if (!times) return;
        if (typeof wavesurfer !== 'undefined' && wavesurfer) {
            wavesurfer.setTime(times.start);
        } else {
            audioPlayer.currentTime = times.start;
        }
        if (autoplay) {
            const p = audioPlayer.play();
            if (p !== undefined) p.catch(err => { if (err.name !== 'AbortError') console.warn(err); });
        }
    }

    function stepSentence(dir) {
        if (!allLabelsOrdered.length) return;
        const t = audioPlayer.currentTime || 0;
        // ★ 修改：跟讀進行中，停頓期間 t 已落在下一句範圍，要以「被跟讀的那句」為基準，否則會多跳一句
        const wasPlaying = follow.active ? true : !audioPlayer.paused;
        let curLabel = follow.active ? follow.label : findActiveLabelByTime(t);
        let idx = curLabel ? allLabelsOrdered.indexOf(curLabel) : -1;
        let nextIdx = idx + dir;
        // 跳過沒有時間標記的句子
        while (nextIdx >= 0 && nextIdx < allLabelsOrdered.length && timeDataMap[allLabelsOrdered[nextIdx]] === undefined) {
            nextIdx += dir;
        }
        if (nextIdx < 0 || nextIdx >= allLabelsOrdered.length) return;
        jumpToLabel(allLabelsOrdered[nextIdx], wasPlaying);
    }

    function togglePlayPause() {
        // ★ 新增：跟讀進行中（含停頓期間）按下播放／暫停 = 中止跟讀、還原音量，暫停在「下一句的開頭」，
        //   再按一次即從下一句繼續正常播放。
        if (follow.active) {
            const resumeAt = follow.resumeTime;
            cancelFollow();
            audioPlayer.pause();
            seekTo(resumeAt);
            return;
        }
        if (audioPlayer.paused) {
            const p = audioPlayer.play();
            if (p !== undefined) p.catch(err => { if (err.name !== 'AbortError') console.warn(err); });
        } else {
            audioPlayer.pause();
        }
    }

    // ================= ⑦ 設定面板套用 =================
    function populateLangSelects() {
        const count = (typeof getLangCount === 'function') ? getLangCount() : 1;
        const multi = (typeof getLangMultiEnabled === 'function') && getLangMultiEnabled() && count > 1;
        [els.langASel, els.langBSel].forEach(sel => sel.innerHTML = '');
        for (let i = 0; i < Math.max(count, 1); i++) {
            const label = (typeof getLangName === 'function') ? getLangName(i) : `語言${i + 1}`;
            els.langASel.appendChild(new Option(label, i));
            els.langBSel.appendChild(new Option(label, i));
        }
        els.langASel.value = st.langA;
        els.langBSel.value = st.langB;
        const langBlock = els.langBSel.closest('.stz-settings-panel');
        els.langBSel.disabled = !multi;
        els.layoutSel.disabled = !multi;
        if (!multi) st.layout = 'single';
    }

    function applyAll() {
        overlay.dataset.stzTheme = st.theme;
        els.lines.dataset.layout = st.layout;
        overlay.classList.toggle('stz-mono', st.mono);
        overlay.classList.toggle('stz-bold', st.bold);
        overlay.classList.toggle('stz-immersive', st.immersive);
        overlay.style.setProperty('--stz-scale', st.fontScale);

        els.themeSel.value = st.theme;
        els.layoutSel.value = st.layout;
        els.speakerChk.checked = st.showSpeaker;
        els.monoChk.checked = st.mono;
        els.boldChk.checked = st.bold;
        els.hidePunctChk.checked = st.hidePunct;
        els.followChk.checked = st.followMode;
        els.followRow.style.display = st.followMode ? 'block' : 'none';
        els.followCountInput.value = st.followCount;
        els.immersiveChk.checked = st.immersive;
        els.fontRange.value = st.fontScale;

        // ★ 跨句圖片群組「顯示圖片」開關：繪本模式一律顯示圖片，鎖定勾選框避免誤解已關閉。
        const isPicturebook = (st.theme === 'picturebook');
        els.showGroupImageChk.checked = isPicturebook ? true : st.showGroupImage;
        els.showGroupImageChk.disabled = isPicturebook;
        els.showGroupImageHint.style.display = isPicturebook ? 'block' : 'none';

        els.bgModeSel.value = st.bgMode;
        els.bgAutoRow.style.display = (st.bgMode === 'auto') ? 'block' : 'none';
        els.bgFileInput.style.display = (st.bgMode === 'custom') ? 'block' : 'none';
        els.bgHint.style.display = (st.bgMode === 'custom') ? 'block' : 'none';
        applyBgImage();

        if (st.theme === 'lyrics') {
            buildLyricsList();
            lastActiveLabel = null; // 強制下一個 tick 重新高亮
        } else {
            lastActiveLabel = null;
            renderCurrent(findActiveLabelByTime(audioPlayer.currentTime || 0));
        }
    }

    // ================= ⑧ 開啟 / 關閉 =================
    function openTheater() {
        if (!audioPlayer || !audioPlayer.src) {
            if (typeof showToast === 'function') showToast('請先載入音檔與字幕文字，才能開啟展示模式', 'error');
            else alert('請先載入音檔與字幕文字，才能開啟展示模式');
            return;
        }
        st = pendingUrlState || loadState(); // ★ 修改：網址帶了設定就優先用網址的
        pendingUrlState = null;              // ★ 新增
        cancelFollow(); // ★ 新增：每次開啟都從乾淨狀態開始
        populateLangSelects();
        applyAll();
        overlay.classList.add('stz-open');
        // 鎖住底層頁面的捲動，避免展示模式開著時背後那條捲軸還能滾、還看得到
        prevBodyOverflow = document.body.style.overflow;
        prevHtmlOverflow = document.documentElement.style.overflow;
        document.body.style.overflow = 'hidden';
        document.documentElement.style.overflow = 'hidden';
        wakeUi();
        if (!rafHandle) rafHandle = requestAnimationFrame(tick);
        document.addEventListener('keydown', onKeydown, true);
        syncTheaterUrl(); // ★ 新增：開啟後寫入網址（放在 applyAll 之後，才會拿到校正後的設定）
    }

    function closeTheater() {
        cancelFollow(); // ★ 新增：關閉時中止跟讀並還原音量，避免關掉展示模式後音量停在一半
        if (audioPlayer && !audioPlayer.paused) audioPlayer.pause(); // ★ 新增：關閉展示模式時停止播放（順序在 cancelFollow 之後，音量已先還原）
        overlay.classList.remove('stz-open');
        syncTheaterUrl(); // ★ 新增：關閉時把 theater 參數從網址移除
        document.body.style.overflow = prevBodyOverflow;
        document.documentElement.style.overflow = prevHtmlOverflow;
        if (rafHandle) { cancelAnimationFrame(rafHandle); rafHandle = null; }
        document.removeEventListener('keydown', onKeydown, true);
        if (document.fullscreenElement === overlay) document.exitFullscreen().catch(() => {});
        // 重置跨句圖片群組狀態，確保下次開啟時會重新判斷目前時間落在哪個群組
        lastMgGroupId = null;
        overlay.classList.remove('stz-mg-active');
        els.mgBg.style.backgroundImage = 'none';
    }

    // ================= ⑨ 事件綁定 =================
    overlay.addEventListener('mousemove', () => wakeUi(true));

    // 防止滾輪／觸控滑動「穿透」展示視窗，捲到底層頁面去；只允許逐字稿清單／設定面板本身捲動
    function blockScrollLeak(e) {
        if (e.target.closest('.stz-lyrics-wrap, .stz-settings-panel, .stz-controlbar, .stz-corner-seek')) return;
        e.preventDefault();
    }
    overlay.addEventListener('wheel', blockScrollLeak, { passive: false });
    overlay.addEventListener('touchmove', blockScrollLeak, { passive: false });

    // 點擊設定面板「以外」的任何地方，就自動關閉設定面板（左上角觸發區與設定按鈕本身除外）
    overlay.addEventListener('click', (e) => {
        if (!els.settingsPanel.classList.contains('stz-show')) return;
        if (e.target.closest('.stz-settings-panel, [data-act="settings"]')) return;
        els.settingsPanel.classList.remove('stz-show');
    });

    overlay.addEventListener('click', (e) => {
        // 只有點擊「舞台」本身（非文字稿捲動清單、非控制列、非設定面板、非左上角觸發區）才切換播放
        if (e.target.closest('.stz-controlbar, .stz-settings-panel, .stz-topbar, .stz-lyrics-wrap, .stz-corner-trigger, .stz-corner-close, .stz-corner-playpause, .stz-corner-seek')) return;
        togglePlayPause();
        wakeUi(true);
    });

    overlay.addEventListener('click', (e) => {
        const actBtn = e.target.closest('[data-act]');
        if (!actBtn) return;
        wakeUi(true);
        const act = actBtn.dataset.act;
        if (act === 'close') closeTheater();
        else if (act === 'playpause') togglePlayPause();
        else if (act === 'prev') stepSentence(-1);
        else if (act === 'next') stepSentence(1);
        else if (act === 'settings') els.settingsPanel.classList.toggle('stz-show');
        else if (act === 'fullscreen') {
            if (document.fullscreenElement === overlay) document.exitFullscreen().catch(() => {});
            else overlay.requestFullscreen?.().catch(() => {});
        }
    });

    document.addEventListener('fullscreenchange', () => {
        els.fsIcon.textContent = (document.fullscreenElement === overlay) ? 'fullscreen_exit' : 'fullscreen';
    });

    function wireSeekControl(rangeEl, labelEl) {
        rangeEl.addEventListener('mousedown', () => stzSeeking = true);
        rangeEl.addEventListener('touchstart', () => stzSeeking = true);
        rangeEl.addEventListener('input', () => {
            if (!audioPlayer.duration) return;
            labelEl.textContent = `${formatTime((rangeEl.value / 1000) * audioPlayer.duration)} / ${formatTime(audioPlayer.duration)}`;
        });
        function commit() {
            // ★ 新增：拖曳進度條時中止跟讀並還原音量；若當時處於跟讀（含停頓）期間，代表使用者原本在播放，拖完要接著播
            const wasFollowing = follow.active;
            cancelFollow();
            if (audioPlayer.duration) audioPlayer.currentTime = (rangeEl.value / 1000) * audioPlayer.duration;
            stzSeeking = false;
            if (wasFollowing) safePlay();
        }
        rangeEl.addEventListener('change', commit);
        rangeEl.addEventListener('mouseup', commit);
        rangeEl.addEventListener('touchend', commit);
    }
    wireSeekControl(els.seek, els.timeLabel);
    wireSeekControl(els.immersiveSeek, els.immersiveTimeLabel);

    els.themeSel.addEventListener('change', () => { st.theme = els.themeSel.value; saveState(); applyAll(); });
    els.layoutSel.addEventListener('change', () => { st.layout = els.layoutSel.value; saveState(); applyAll(); });
    els.langASel.addEventListener('change', () => { st.langA = parseInt(els.langASel.value, 10); saveState(); applyAll(); });
    els.langBSel.addEventListener('change', () => { st.langB = parseInt(els.langBSel.value, 10); saveState(); applyAll(); });
    els.speakerChk.addEventListener('change', () => { st.showSpeaker = els.speakerChk.checked; saveState(); applyAll(); });
    els.monoChk.addEventListener('change', () => { st.mono = els.monoChk.checked; saveState(); applyAll(); });
    els.boldChk.addEventListener('change', () => { st.bold = els.boldChk.checked; saveState(); applyAll(); });
    els.hidePunctChk.addEventListener('change', () => { st.hidePunct = els.hidePunctChk.checked; saveState(); applyAll(); });
    els.followChk.addEventListener('change', () => {
        st.followMode = els.followChk.checked;
        saveState();
        // 關閉跟讀時若正在跟讀流程中：還原音量，並直接接著往下播，不要停在半途
        if (!st.followMode && follow.active) {
            const resumeAt = follow.resumeTime;
            cancelFollow();
            seekTo(resumeAt);
            safePlay();
        }
        applyAll();
    });
    els.followCountInput.addEventListener('change', () => {
        st.followCount = Math.min(10, Math.max(1, parseInt(els.followCountInput.value, 10) || 1));
        els.followCountInput.value = st.followCount;
        saveState();
    });
    els.immersiveChk.addEventListener('change', () => { st.immersive = els.immersiveChk.checked; saveState(); applyAll(); });
    els.showGroupImageChk.addEventListener('change', () => { st.showGroupImage = els.showGroupImageChk.checked; saveState(); applyAll(); });
    els.bgModeSel.addEventListener('change', () => {
        st.bgMode = els.bgModeSel.value;
        if (st.bgMode === 'auto' && !st.bgAutoSeed) st.bgAutoSeed = String(Date.now());
        saveState();
        applyAll();
    });
    els.bgRefreshBtn.addEventListener('click', () => {
        st.bgAutoSeed = String(Date.now()) + Math.random().toString(36).slice(2, 6);
        saveState();
        applyBgImage();
    });
    els.bgFileInput.addEventListener('change', () => {
        const file = els.bgFileInput.files && els.bgFileInput.files[0];
        if (!file) return;
        if (customBgObjectUrl) URL.revokeObjectURL(customBgObjectUrl);
        customBgObjectUrl = URL.createObjectURL(file);
        applyBgImage();
    });
    els.fontRange.addEventListener('input', () => { st.fontScale = parseFloat(els.fontRange.value); saveState(); overlay.style.setProperty('--stz-scale', st.fontScale); });

    function onKeydown(e) {
        if (!overlay.classList.contains('stz-open')) return;
        // 展示模式開啟時，攔截這些按鍵，避免同時觸發底層編輯畫面的同名快捷鍵
        if (['Space', 'Escape', 'ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown', 'KeyF', 'KeyS'].includes(e.code)) {
            e.preventDefault();
            e.stopPropagation();
        } else {
            return;
        }
        wakeUi(false);
        if (e.code === 'Space') togglePlayPause();
        else if (e.code === 'Escape') closeTheater();
        else if (e.code === 'ArrowLeft') stepSentence(-1);
        else if (e.code === 'ArrowRight') stepSentence(1);
        else if (e.code === 'ArrowUp') { st.fontScale = Math.min(2, +(st.fontScale + 0.1).toFixed(1)); saveState(); overlay.style.setProperty('--stz-scale', st.fontScale); els.fontRange.value = st.fontScale; }
        else if (e.code === 'ArrowDown') { st.fontScale = Math.max(0.6, +(st.fontScale - 0.1).toFixed(1)); saveState(); overlay.style.setProperty('--stz-scale', st.fontScale); els.fontRange.value = st.fontScale; }
        else if (e.code === 'KeyF') { if (document.fullscreenElement === overlay) document.exitFullscreen().catch(() => {}); else overlay.requestFullscreen?.().catch(() => {}); }
        else if (e.code === 'KeyS') els.settingsPanel.classList.toggle('stz-show');
    }

    // ★ 新增：載入時依網址還原
    if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', restoreTheaterFromUrl);
    else restoreTheaterFromUrl();

    // 對外暴露，方便其他檔案（如需要）主動開啟，或除錯用
    window.SubtitleTheater = { open: openTheater, close: closeTheater };
})();
