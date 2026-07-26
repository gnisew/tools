
// ================= 2. DOM 元素 =================
const menuBtn = document.getElementById('menuBtn');
const headerRight = document.getElementById('headerRight');
const searchWrapper = document.getElementById('searchWrapper');
const searchIconBtn = document.getElementById('searchIconBtn');
const searchInput = document.getElementById('searchInput');

const toggleRubyBtn = document.getElementById('toggleRubyBtn');
const fontSizeControls = document.getElementById('fontSizeControls');

const sidebar = document.getElementById('sidebar');
const sidebarOverlay = document.getElementById('sidebarOverlay');
const closeSidebarBtn = document.getElementById('closeSidebarBtn');
const sidebarList = document.getElementById('sidebarList');
const logo = document.getElementById('logo');
const navAbout = document.getElementById('navAbout');

const homeBanner = document.getElementById('homeBanner');
const homeView = document.getElementById('homeView');
const articleView = document.getElementById('articleView');
const aboutView = document.getElementById('aboutView');
const directoryGrid = document.getElementById('directoryGrid');
const searchResults = document.getElementById('searchResults');

const articleTitle = document.getElementById('articleTitle');
const articleLevel = document.getElementById('articleLevel');
const articleImage = document.getElementById('articleImage'); 
const articleContent = document.getElementById('articleContent');
const articleVocab = document.getElementById('articleVocab');

const audioPlayer = document.getElementById('audioPlayer');
const showPlayerFab = document.getElementById('showPlayerFab');
const closePlayerBtn = document.getElementById('closePlayerBtn');
const audioVoice = document.getElementById('audioVoice');
const audioBgm = document.getElementById('audioBgm');
const playPauseBtn = document.getElementById('playPauseBtn');
const playIcon = document.getElementById('playIcon');
const trackToggleBtn = document.getElementById('trackToggleBtn');
const progressBar = document.getElementById('progressBar');

const sentenceDataMap = new Map(); // 儲存 A01: { hakka: '...', mandarin: '...', current: 'hakka' }

const toggleViewModeBtn = document.getElementById('toggleViewModeBtn');
let isSentenceMode = false;

let currentFontSize = 18;
let currentRubyMode = 0; // 0: 字音, 1: 漢字, 2: 拼音
const rubyModes = ['字音', '漢字', '拼音'];
let isPlaying = false;
let isVoiceTrack = true;

toggleRubyBtn.classList.add('active'); 
toggleRubyBtn.textContent = '字音'; // 初始化按鈕文字

const toggleLangBtn = document.getElementById('toggleLangBtn');
let isTranslateMode = false; // false = 客語, true = 華語
let currentArticleData = null;



// ================= 3. 畫面與側邊欄初始化 =================
function initUI() {
    directoryGrid.innerHTML = '';
    sidebarList.innerHTML = '';
    
    articlesData.forEach((article, index) => {
        // ★ 產生 01, 02 格式的編號 ★
        const numberStr = String(index + 1).padStart(2, '0');
        
        const card = document.createElement('div');
        card.className = 'card';
        card.innerHTML = `<div class="card-number">${numberStr}</div>
                          <div class="card-icon">${article.icon}</div>
                          <div class="card-title">${article.title}</div>`;
        card.addEventListener('click', () => loadArticle(article.id));
        directoryGrid.appendChild(card);

        const li = document.createElement('li');
        li.innerHTML = `<span class="material-icons" style="font-size:18px; color:#4DB6AC;">article</span> ${article.title}`;
        li.addEventListener('click', () => {
            loadArticle(article.id);
            closeSidebar();
        });
        sidebarList.appendChild(li);
    });
}
initUI();











// ================= 4. UI 互動與導覽邏輯 =================


// ================= 語言切換 (客語 / 華語) =================
toggleLangBtn.addEventListener('click', function() {
    isTranslateMode = !isTranslateMode;
    const targetLang = isTranslateMode ? 'mandarin' : 'hakka';
    
    if (isTranslateMode) {
        toggleLangBtn.textContent = '華語';
        toggleLangBtn.classList.remove('active'); 
        toggleRubyBtn.classList.add('disabled');  
    } else {
        toggleLangBtn.textContent = '客語';
        toggleLangBtn.classList.add('active');    
        toggleRubyBtn.classList.remove('disabled'); 
    }
    
    document.querySelectorAll('.sentence-block').forEach(block => {
        const label = block.getAttribute('data-label');
        const data = sentenceDataMap.get(label);
        if (data) {
            data.current = targetLang;
            block.innerHTML = data[targetLang];
            // 處理單句深色徽章的樣式復原
            if (isTranslateMode) {
                block.classList.remove('is-translated');
            }
        }
    });
    
    const keyword = searchInput.value.trim();
    if (keyword) highlightArticle(articleContent, keyword);
});





function openSidebar() { 
    sidebar.classList.add('open'); 
    sidebarOverlay.style.display = 'block'; 
    document.body.style.overflow = 'hidden'; 
    sidebarList.scrollTop = 0; 
}

function closeSidebar() { 
    sidebar.classList.remove('open'); 
    sidebarOverlay.style.display = 'none'; 
    document.body.style.overflow = ''; 
}

menuBtn.addEventListener('click', openSidebar);
closeSidebarBtn.addEventListener('click', closeSidebar);
sidebarOverlay.addEventListener('click', closeSidebar);

function hideAllViews() {
    homeView.style.display = 'none';
    articleView.style.display = 'none';
    aboutView.style.display = 'none';
    audioPlayer.style.display = 'none';
    showPlayerFab.style.display = 'none';
   
    audioVoice.pause(); audioBgm.pause();
    isPlaying = false; playIcon.textContent = 'play_arrow';
}

navAbout.addEventListener('click', () => {
    closeSidebar();
    showAbout(true);
});

logo.addEventListener('click', () => {
    closeSearch();
    searchResults.innerHTML = ''; directoryGrid.style.display = 'grid'; 
    showHome();
});

// ================= 顯示關於本站 =================
function showAbout(pushHistory = true) {
    hideAllViews(); // 隱藏其他所有畫面
    window.scrollTo({ top: 0, behavior: 'smooth' });
    
    if (typeof aboutView !== 'undefined') {
        aboutView.style.display = 'block'; 
    }

    if (pushHistory) {
        const newUrl = window.location.pathname + '?view=about';
        window.history.pushState({ view: 'about' }, '', newUrl);
    }
}

function showHome() {
    hideAllViews();
    window.scrollTo({ top: 0, behavior: 'smooth' });
    homeBanner.style.display = 'block'; 
    homeView.style.display = 'block';
    
    window.history.pushState(null, '', window.location.pathname);
}

backBtn.addEventListener('click', () => {
    hideAllViews();
    window.scrollTo({ top: 0, behavior: 'smooth' });
    homeView.style.display = 'block';
    
    window.history.pushState(null, '', window.location.pathname);
    
    if (searchInput.value.trim() !== '') {
        homeBanner.style.display = 'none';
        directoryGrid.style.display = 'none';
        searchResults.style.display = 'block';
    } else {
        homeBanner.style.display = 'block';
        directoryGrid.style.display = 'grid';
        searchResults.style.display = 'none';
    }
});

function closeSearch() {
    searchInput.classList.remove('active');
    headerRight.classList.remove('searching'); 
    searchInput.value = '';
}

searchIconBtn.addEventListener('click', (e) => {
    e.stopPropagation(); 
    const isActive = searchInput.classList.contains('active');
    if (!isActive) {
        searchInput.classList.add('active');
        headerRight.classList.add('searching'); 
        searchInput.focus();
    } else if (searchInput.value.trim() !== '') {
        performSearch(searchInput.value.trim());
    } else {
        closeSearch();
    }
});

searchInput.addEventListener('click', (e) => e.stopPropagation());
searchInput.addEventListener('keypress', (e) => {
    if (e.key === 'Enter' && searchInput.value.trim() !== '') performSearch(searchInput.value.trim());
});

// ================= 點擊外部的智慧處理 =================
document.addEventListener('click', (e) => {
    if (searchInput.classList.contains('active') && !headerRight.contains(e.target)) {
        
        if (searchInput.value.trim() === '') {
            closeSearch();
        } else {
            searchInput.blur();
        }
    }
});

function normalizeToneMarks(text) {
    if (!text) return '';
    return text
        .replace(/\s*\u0301/g, 'ˊ') 
        .replace(/\s*\u030C/g, 'ˇ') 
        .replace(/\s*\u0300/g, 'ˋ'); 
}

// ================= 5. 載入文章與進階解析邏輯 =================
function loadArticle(id, pushHistory = true) {
    const article = articlesData.find(a => a.id === id);
    if (!article) return;

    if (pushHistory) {
        const newUrl = window.location.pathname + '?id=' + id;
        window.history.pushState({ articleId: id }, '', newUrl);
    }
    currentArticleData = article;
    isTranslateMode = false;
    toggleLangBtn.textContent = '客語';
    toggleLangBtn.classList.add('active');
    toggleRubyBtn.classList.remove('disabled');
    


    if (article.translate && article.translate.trim() !== '') {
        toggleLangBtn.style.display = 'block';
    } else {
        toggleLangBtn.style.display = 'none';
    }

    articleTitle.textContent = article.title;
    articleLevel.textContent = article.level;
    
    if (article.image) {
        articleImage.src = article.image; articleImage.style.display = 'block';
    } else {
        articleImage.style.display = 'none';
    }

    articleContent.innerHTML = parseTextToRuby(article.content, article.translate);
    
    const keyword = searchInput.value.trim();
    if (keyword) {
        highlightArticle(articleContent, keyword);
    }
    
    articleVocab.innerHTML = article.vocab.map(v => `<li>${v}</li>`).join('');
    audioVoice.src = article.audioVoice; audioBgm.src = article.audioBgm; progressBar.value = 0;

    hideAllViews();
    homeBanner.style.display = 'none';
    articleView.style.display = 'block';
    showPlayerFab.style.display = 'flex';
    
    window.scrollTo({ top: 0, behavior: 'smooth' });
}

// 單一句子解析輔助函式
function parseSingleSentence(sentence) {
    if (!sentence) return '';
    const rubyRegex = /([^\(\s，。、！？；：「」『』,.\?!]+)\(([^)]+)\)/g;
    let sentHTML = sentence.replace(rubyRegex, function(match, char, pinyin) {
        let normalizedPinyin = normalizeToneMarks(pinyin);
        return `<ruby><rb>${char}</rb><rt>${normalizedPinyin}</rt></ruby>`;
    });
    return sentHTML.replace(/<\/ruby>\s+<ruby>/g, '</ruby><ruby>');
}



function parseTextToRuby(rawText, rawTranslateText = '') {
    sentenceDataMap.clear(); // 清空舊的對照表

    const rawParagraphs = rawText.split('\n').filter(p => p.trim() !== '');
    const transParagraphs = rawTranslateText ? rawTranslateText.split('\n').filter(p => p.trim() !== '') : [];
    const sentenceRegex = /.+?(?:[，。：；！？、,.\?!「」『』]\s*)+|.+?$/g;

    const paragraphsHTML = rawParagraphs.map((para, paraIndex) => {
        const paraLetter = String.fromCharCode(65 + paraIndex); 
        const sentences = para.match(sentenceRegex) || [para];
        // 抓出對應的華語段落進行斷句
        const transSentences = transParagraphs[paraIndex] ? transParagraphs[paraIndex].match(sentenceRegex) || [] : [];
        
        const sentencesHTML = sentences.map((sentence, sentIndex) => {
            const sentNumber = String(sentIndex + 1).padStart(2, '0');
            const label = `${paraLetter}${sentNumber}`; 
            
            // 分別解析客語與華語的 HTML
            const hakkaHTML = parseSingleSentence(sentence);
            const mandarinHTML = transSentences[sentIndex] ? parseSingleSentence(transSentences[sentIndex]) : hakkaHTML;
            
            // 將結果存入記憶體地圖中
            sentenceDataMap.set(label, {
                hakka: hakkaHTML,
                mandarin: mandarinHTML,
                current: 'hakka' // 預設顯示客語
            });
            
            return `<span class="sentence-block" data-label="${label}">${hakkaHTML}</span>`;
        }).join('');
        
        return `<p>${sentencesHTML}</p>`;
    });
    
    return paragraphsHTML.join('');
}


function getPureText(rawText) { 
    return rawText.replace(/\([^)]+\)/g, '').replace(/\s+/g, ''); 
}

// ★ 新增：文章內容高亮核心邏輯 ★
function highlightArticle(container, keyword) {
    if (!keyword) return;
    
    // 1. 抓取文章內所有的「純文字節點」
    const walker = document.createTreeWalker(container, NodeFilter.SHOW_TEXT, null, false);
    const textNodes = [];
    let node;
    while ((node = walker.nextNode())) {
        // 跳過拼音 (<rt>) 與我們塞入的特殊空白 (.ruby-space)
        if (node.parentNode.tagName.toLowerCase() === 'rt') continue;
        if (node.parentNode.classList.contains('ruby-space')) continue;
        textNodes.push(node);
    }
    
    // 2. 建立無空白的純文字與 DOM 節點的對應地圖 (Map)
    let pureText = '';
    let charMap = [];
    
    for (let i = 0; i < textNodes.length; i++) {
        let text = textNodes[i].nodeValue;
        for (let j = 0; j < text.length; j++) {
            // 排除空白與換行，模擬出跟搜尋時一模一樣的字串結構
            if (!/\s/.test(text[j])) { 
                pureText += text[j];
                charMap.push({ node: textNodes[i], index: j });
            }
        }
    }
    
    // 3. 找出所有關鍵字出現的位置
    let matches = [];
    let matchIndex = pureText.indexOf(keyword);
    while (matchIndex !== -1) {
        matches.push(matchIndex);
        matchIndex = pureText.indexOf(keyword, matchIndex + keyword.length);
    }
    
    // 4. 倒序處理：從後面開始高亮，確保切割文字節點時不會影響前面的索引
    for (let i = matches.length - 1; i >= 0; i--) {
        let start = matches[i];
        let end = start + keyword.length - 1;
        
        for (let k = end; k >= start; k--) {
            let mapData = charMap[k];
            let textNode = mapData.node;
            let offset = mapData.index;
            
            // 完美切出單一字元
            if (offset + 1 < textNode.nodeValue.length) {
                textNode.splitText(offset + 1);
            }
            let charNode = textNode.splitText(offset);
            
            // 用 <mark> 標籤包裝起來，創造黃底高亮效果
            let mark = document.createElement('mark');
            charNode.parentNode.insertBefore(mark, charNode);
            mark.appendChild(charNode);
        }
    }
}



// ================= 6. 功能切換 =================
function performSearch(keyword) {
    hideAllViews(); 
    window.scrollTo({ top: 0, behavior: 'smooth' });
    homeBanner.style.display = 'none'; 
    homeView.style.display = 'block'; 
    directoryGrid.style.display = 'none';
    
    // ★ 關鍵修復：明確將搜尋結果區塊顯示出來 ★
    searchResults.style.display = 'block'; 
    
    let resultsHTML = '';
    
    articlesData.forEach(article => {
        const pureText = getPureText(article.content);
        let matchIndex = pureText.indexOf(keyword);
        
        if (matchIndex >= 0) {
            let snippetsHTML = '';
            let lastSearchIndex = 0;
            
            // ... 原本的程式碼 (在 performSearch 函式內) ...

            while (matchIndex !== -1) {
                let startIndex = Math.max(0, matchIndex - 15);
                let endIndex = Math.min(pureText.length, matchIndex + keyword.length + 15);
                
                // 如果 startIndex 剛好切在特殊字的「後半段 (Low Surrogate)」，往前推一格包含整個字
                if (startIndex > 0 && 
                    pureText.charCodeAt(startIndex) >= 0xDC00 && 
                    pureText.charCodeAt(startIndex) <= 0xDFFF) {
                    startIndex--;
                }
                
                // 如果 endIndex 剛好切在特殊字的「前半段 (High Surrogate)」，往後延一格包含整個字
                if (endIndex < pureText.length && 
                    pureText.charCodeAt(endIndex - 1) >= 0xD800 && 
                    pureText.charCodeAt(endIndex - 1) <= 0xDBFF) {
                    endIndex++;
                }
                // =========================================================

                let snippet = pureText.substring(startIndex, endIndex);
                
                if (startIndex > 0) snippet = '...' + snippet;
                if (endIndex < pureText.length) snippet = snippet + '...';
                
                const highlightedSnippet = snippet.split(keyword).join(`<mark>${keyword}</mark>`);
                
                snippetsHTML += `<div style="margin-top: 10px; font-size: 0.95rem; color: #555; line-height: 1.6;">
                                    ${highlightedSnippet}
                                 </div>`;
                
                lastSearchIndex = matchIndex + keyword.length;
                matchIndex = pureText.indexOf(keyword, lastSearchIndex);
            }
            
            resultsHTML += `
                <div class="result-item" data-id="${article.id}" style="background:white; padding:15px 20px; border-radius:8px; margin-bottom:15px; border:1px solid #EBEBEB; cursor:pointer; transition: box-shadow 0.2s;">
                    <div class="result-title" style="color:var(--primary-color); font-weight:bold; font-size: 1.1rem; margin-bottom:5px; border-bottom: 1px dashed #DDD; padding-bottom: 8px;">
                        <span class="material-icons" style="font-size: 1.1rem; vertical-align: text-bottom; margin-right: 4px;">article</span>${article.title}
                    </div>
                    <div>${snippetsHTML}</div>
                </div>`;
        }
    });
    
    searchResults.innerHTML = resultsHTML || '<p style="padding: 20px; text-align:center;">找不到符合的結果哦！</p>';
    
    document.querySelectorAll('.result-item').forEach(item => {
        item.addEventListener('click', function() {
            loadArticle(this.getAttribute('data-id'));
            searchInput.blur(); 
        });
    });
}


// ================= 檢視模式切換 (段落 / 斷句) =================
toggleViewModeBtn.addEventListener('click', function() {
    isSentenceMode = !isSentenceMode;
    if (isSentenceMode) {
        articleContent.classList.add('mode-sentence');
        toggleViewModeBtn.textContent = '斷句';
        toggleViewModeBtn.classList.remove('active'); // 斷句模式改為空心樣式
    } else {
        articleContent.classList.remove('mode-sentence');
        toggleViewModeBtn.textContent = '段落';
        toggleViewModeBtn.classList.add('active'); // 段落模式恢復實心樣式
    }
});

toggleRubyBtn.addEventListener('click', function() {
    // 循環切換 0 -> 1 -> 2 -> 0
    currentRubyMode = (currentRubyMode + 1) % 3;
    toggleRubyBtn.textContent = rubyModes[currentRubyMode];
    
    // 清除所有的模式 Class
    articleContent.classList.remove('mode-hanzi-only', 'mode-pinyin-only');
    
    if (currentRubyMode === 0) {
        // 【狀態 0：字音模式】
        toggleRubyBtn.classList.add('active'); // 實心樣式
        
    } else if (currentRubyMode === 1) {
        // 【狀態 1：漢字模式】只顯示漢字
        articleContent.classList.add('mode-hanzi-only');
        toggleRubyBtn.classList.remove('active'); // 空心樣式
        
    } else if (currentRubyMode === 2) {
        // 【狀態 2：拼音模式】只顯示拼音
        articleContent.classList.add('mode-pinyin-only');
        toggleRubyBtn.classList.add('active'); // 實心樣式
    }
});

document.getElementById('fontSizePlusBtn').addEventListener('click', () => {
    if (currentFontSize < 30) currentFontSize += 2;
    document.documentElement.style.setProperty('--base-font-size', currentFontSize + 'px');
});
document.getElementById('fontSizeMinusBtn').addEventListener('click', () => {
    if (currentFontSize > 14) currentFontSize -= 2;
    document.documentElement.style.setProperty('--base-font-size', currentFontSize + 'px');
});

closePlayerBtn.addEventListener('click', () => {
    audioPlayer.style.display = 'none'; showPlayerFab.style.display = 'flex';
});
showPlayerFab.addEventListener('click', () => {
    audioPlayer.style.display = 'flex'; showPlayerFab.style.display = 'none';
});

playPauseBtn.addEventListener('click', function() {
    if (isPlaying) {
        audioVoice.pause(); audioBgm.pause(); playIcon.textContent = 'play_arrow';
    } else {
        audioVoice.play(); audioBgm.play(); playIcon.textContent = 'pause';
    }
    isPlaying = !isPlaying;
});
trackToggleBtn.addEventListener('click', function() {
    isVoiceTrack = !isVoiceTrack;
    if (isVoiceTrack) {
        audioVoice.muted = false; audioBgm.muted = true; trackToggleBtn.textContent = '人聲';
    } else {
        audioVoice.muted = true; audioBgm.muted = false; trackToggleBtn.textContent = '音樂';
    }
});
audioVoice.addEventListener('timeupdate', function() {
    const percentage = (audioVoice.currentTime / audioVoice.duration) * 100;
    if (!isNaN(percentage)) progressBar.value = percentage;
});
progressBar.addEventListener('input', function() {
    const seekTime = (progressBar.value / 100) * audioVoice.duration;
    audioVoice.currentTime = seekTime; audioBgm.currentTime = seekTime;
});

// ================= 7. 網址參數與瀏覽器歷史紀錄 =================

// 1. 網頁初次載入時，檢查網址參數
window.addEventListener('DOMContentLoaded', () => {
    const urlParams = new URLSearchParams(window.location.search);
    const articleId = urlParams.get('id');
    const viewName = urlParams.get('view');
    
    if (viewName === 'about') {
        // 如果網址是 ?view=about，直接開啟關於本站
        showAbout(false); 
    } else if (articleId) {
        // 如果網址有 ?id=...，直接開啟該文章
        loadArticle(articleId, false);
    }
});

// 2. 支援手機或瀏覽器的實體「上一頁 / 下一頁」按鈕
window.addEventListener('popstate', (event) => {
    if (event.state && event.state.articleId) {
        // 歷史紀錄中有文章 ID
        loadArticle(event.state.articleId, false);
        
    } else if (event.state && event.state.view === 'about') {
        showAbout(false);
        
    } else {
        // 如果沒有任何狀態，代表退回到了首頁
        hideAllViews();
        window.scrollTo({ top: 0, behavior: 'smooth' });
        homeBanner.style.display = 'block'; 
        homeView.style.display = 'block';
        directoryGrid.style.display = 'grid';
        searchResults.style.display = 'none';
        
        // 確保搜尋框被關閉
        if (typeof closeSearch === 'function') closeSearch();
    }
});



// ================= 斷句模式：點擊編號單句切換 =================
articleContent.addEventListener('click', (e) => {
    // 只有在斷句模式下才啟動這個魔法
    if (!isSentenceMode) return;
    
    // 尋找被點擊的句子區塊
    const block = e.target.closest('.sentence-block');
    if (!block) return;
    
    // 計算點擊位置：我們設定徽章寬度 26px，留白 34px。
    // 如果點擊相對於句子最左側的 X 座標小於 40px，代表點中了徽章！
    const rect = block.getBoundingClientRect();
    const clickX = e.clientX - rect.left;
    
    if (clickX <= 40) {
        const label = block.getAttribute('data-label');
        const data = sentenceDataMap.get(label);
        
        // 確保這句話有翻譯才進行切換
        if (data && data.mandarin && data.mandarin !== data.hakka) {
            // 切換狀態
            data.current = data.current === 'hakka' ? 'mandarin' : 'hakka';
            
            // 抽換該句的 HTML
            block.innerHTML = data[data.current];
            
            // 切換徽章的深色狀態
            block.classList.toggle('is-translated', data.current === 'mandarin');
            
            // 如果剛好有搜尋關鍵字，為這句單獨補上高亮
            const keyword = searchInput.value.trim();
            if (keyword) highlightArticle(block, keyword);
        }
    }
});