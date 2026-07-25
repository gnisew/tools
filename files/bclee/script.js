
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

let currentFontSize = 18;
let isRubyMode = true; 
let isPlaying = false;
let isVoiceTrack = true;

toggleRubyBtn.classList.add('active'); 

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
function openSidebar() { 
    sidebar.classList.add('open'); 
    sidebarOverlay.style.display = 'block'; 
    // ★ 鎖住背後網頁的滾動 ★
    document.body.style.overflow = 'hidden'; 
    // ★ 每次打開時，側邊欄清單滾動到最頂部 ★
    sidebarList.scrollTop = 0; 
}

function closeSidebar() { 
    sidebar.classList.remove('open'); 
    sidebarOverlay.style.display = 'none'; 
    // ★ 恢復背後網頁的滾動 ★
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
    
    toggleRubyBtn.style.display = 'none';
    fontSizeControls.style.display = 'none';
    
    audioVoice.pause(); audioBgm.pause();
    isPlaying = false; playIcon.textContent = 'play_arrow';
}

navAbout.addEventListener('click', () => {
    closeSidebar(); hideAllViews();
    window.scrollTo({ top: 0, behavior: 'smooth' }); 
    homeBanner.style.display = 'block'; aboutView.style.display = 'block';
});

logo.addEventListener('click', () => {
    closeSearch();
    searchResults.innerHTML = ''; directoryGrid.style.display = 'grid'; 
    showHome();
});

function showHome() {
    hideAllViews();
    window.scrollTo({ top: 0, behavior: 'smooth' });
    homeBanner.style.display = 'block'; homeView.style.display = 'block';
}

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

document.addEventListener('click', (e) => {
    if (searchInput.classList.contains('active') && !headerRight.contains(e.target)) {
        closeSearch();
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
function loadArticle(id) {
    const article = articlesData.find(a => a.id === id);
    if (!article) return;

    articleTitle.textContent = article.title;
    articleLevel.textContent = article.level;
    
    if (article.image) {
        articleImage.src = article.image; articleImage.style.display = 'block';
    } else {
        articleImage.style.display = 'none';
    }

    // 只需要這一行就能產出完美的 HTML
    articleContent.innerHTML = parseTextToRuby(article.content);
    
    articleVocab.innerHTML = article.vocab.map(v => `<li>${v}</li>`).join('');
    audioVoice.src = article.audioVoice; audioBgm.src = article.audioBgm; progressBar.value = 0;

    hideAllViews();
    homeBanner.style.display = 'none';
    articleView.style.display = 'block';
    showPlayerFab.style.display = 'flex';
    
    toggleRubyBtn.style.display = 'block';
    fontSizeControls.style.display = 'flex';
    
    window.scrollTo({ top: 0, behavior: 'smooth' });
}

// ★ 淨化後的解析函式 ★
function parseTextToRuby(rawText) {
    const regex = /([^\(\s，。、！？；：「」『』,.\?!]+)\(([^)]+)\)/g;
    
    let html = rawText.replace(regex, function(match, char, pinyin) {
        let normalizedPinyin = normalizeToneMarks(pinyin);
        return `<ruby><rb>${char}</rb><rt>${normalizedPinyin}</rt></ruby>`;
    });
    
    // 移除原始多餘空白，讓 CSS 完全接管排版
    html = html.replace(/<\/ruby>\s+<ruby>/g, '</ruby><ruby>');
    
    const paragraphs = html.split('\n').filter(p => p.trim() !== '');
    return paragraphs.map(p => `<p>${p}</p>`).join('');
}



function getPureText(rawText) { 
    return rawText.replace(/\([^)]+\)/g, '').replace(/\s+/g, ''); 
}

// ================= 6. 功能切換 =================
function performSearch(keyword) {
    hideAllViews(); window.scrollTo({ top: 0, behavior: 'smooth' });
    homeBanner.style.display = 'none'; homeView.style.display = 'block'; directoryGrid.style.display = 'none';
    let resultsHTML = '';
    articlesData.forEach(article => {
        const pureText = getPureText(article.content);
        const matchIndex = pureText.indexOf(keyword);
        if (matchIndex >= 0) {
            const startIndex = Math.max(0, matchIndex - 10);
            const endIndex = matchIndex + keyword.length + 10;
            let snippet = pureText.substring(startIndex, endIndex);
            if (startIndex > 0) snippet = '...' + snippet;
            if (endIndex < pureText.length) snippet = snippet + '...';
            const highlightedSnippet = snippet.split(keyword).join(`<mark>${keyword}</mark>`);
            resultsHTML += `<div class="result-item" data-id="${article.id}" style="background:white; padding:15px; border-radius:8px; margin-bottom:15px; border:1px solid #EBEBEB; cursor:pointer;">
                                <div class="result-title" style="color:var(--primary-color); font-weight:bold; margin-bottom:5px;">${article.title}</div>
                                <div>${highlightedSnippet}</div>
                            </div>`;
        }
    });
    searchResults.innerHTML = resultsHTML || '<p style="padding: 20px; text-align:center;">找不到符合的結果哦！</p>';
    document.querySelectorAll('.result-item').forEach(item => {
        item.addEventListener('click', function() {
            loadArticle(this.getAttribute('data-id'));
            searchResults.innerHTML = ''; closeSearch();
        });
    });
}

toggleRubyBtn.addEventListener('click', function() {
    isRubyMode = !isRubyMode;
    if (isRubyMode) {
        articleContent.classList.remove('hide-ruby');
        toggleRubyBtn.classList.add('active');
    } else {
        articleContent.classList.add('hide-ruby');
        toggleRubyBtn.classList.remove('active'); 
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