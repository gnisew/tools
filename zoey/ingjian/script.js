document.addEventListener('DOMContentLoaded', () => {
    // === DOM 元素 ===
    const homeView = document.getElementById('homeView');
    const playerView = document.getElementById('playerView');
    const menuContainer = document.getElementById('menuContainer');
    
    // Player UI
    const backBtn = document.getElementById('backBtn');
    const currentTitle = document.getElementById('currentTitle');
    const conversationArea = document.getElementById('conversationArea');
    
    // Text Elements
    const qTextEn = document.getElementById('qTextEn');
    const qTextCn = document.getElementById('qTextCn');
    const aTextEn = document.getElementById('aTextEn');
    const aTextCn = document.getElementById('aTextCn');
    
    // Controls
    const playBtn = document.getElementById('playBtn');
    const prevBtn = document.getElementById('prevBtn');
    const nextBtn = document.getElementById('nextBtn');
    
    // Quick Settings (新版)
    const speedSelect = document.getElementById('speedSelect');
    const toggleShadowing = document.getElementById('toggleShadowing');
    const toggleCn = document.getElementById('toggleCn');

    // === 狀態變數 ===
    let currentRoundData = [];
    let currentGlobalIndex = 0;
    let isPlaying = false;
    let synth = window.speechSynthesis;
    let shadowingTimeout = null;
    
    // 設定狀態
    let isShadowing = false;
    let showCn = false;

    // === 初始化選單 (Accordion) ===
    function initMenu() {
        // 從 data.js 讀取 round
        const rounds = [...new Set(qaData.map(item => item.round))].sort((a,b) => a - b);
        
        rounds.forEach(roundNum => {
            const itemDiv = document.createElement('div');
            itemDiv.className = 'accordion-item';

            const headerDiv = document.createElement('div');
            headerDiv.className = 'accordion-header';
            headerDiv.innerHTML = `<span>📚 第 ${roundNum} 回</span> <span class="arrow">▼</span>`;
            
            const contentDiv = document.createElement('div');
            contentDiv.className = 'accordion-content';

            const questions = qaData.filter(d => d.round === roundNum);
            questions.forEach((q, idx) => {
                const qLink = document.createElement('div');
                qLink.className = 'question-link';
                // 限制標題長度，避免太長不好看
                const shortQ = q.q.length > 35 ? q.q.substring(0, 35) + '...' : q.q;
                qLink.textContent = `${q.id}. ${shortQ}`;
                
                qLink.addEventListener('click', () => {
                    enterPlayer(roundNum, idx);
                });
                contentDiv.appendChild(qLink);
            });

            headerDiv.addEventListener('click', () => {
                // 手風琴切換 (如果想一次只開一個，可保留這段)
                document.querySelectorAll('.accordion-content').forEach(el => {
                    if (el !== contentDiv) el.classList.remove('active');
                });
                contentDiv.classList.toggle('active');
            });

            itemDiv.appendChild(headerDiv);
            itemDiv.appendChild(contentDiv);
            menuContainer.appendChild(itemDiv);
        });
    }

    // === 切換到播放頁面 ===
    function enterPlayer(roundNum, index) {
        currentRoundData = qaData.filter(d => d.round === roundNum);
        currentGlobalIndex = index;
        
        // 頁面切換
        homeView.classList.add('hidden');
        playerView.classList.remove('hidden');
        
        updatePlayerUI();
        stopAudio();
    }

    // 返回按鈕
    backBtn.addEventListener('click', () => {
        stopAudio();
        playerView.classList.add('hidden');
        homeView.classList.remove('hidden');
    });

    // === 設定按鈕邏輯 (Toggle Chips) ===
    toggleShadowing.addEventListener('click', () => {
        isShadowing = !isShadowing;
        toggleShadowing.classList.toggle('active', isShadowing);
    });

    toggleCn.addEventListener('click', () => {
        showCn = !showCn;
        toggleCn.classList.toggle('active', showCn);
        updateTranslationVisibility();
    });

    function updateTranslationVisibility() {
        if (showCn) {
            qTextCn.classList.remove('hidden');
            aTextCn.classList.remove('hidden');
        } else {
            qTextCn.classList.add('hidden');
            aTextCn.classList.add('hidden');
        }
    }

    // === 更新介面內容 ===
    function updatePlayerUI() {
        const item = currentRoundData[currentGlobalIndex];
        currentTitle.textContent = `第 ${item.round} 回 - Q${item.id}`;

        qTextEn.textContent = item.q;
        aTextEn.textContent = item.a;
        qTextCn.textContent = item.q_cn;
        aTextCn.textContent = item.a_cn;

        updateTranslationVisibility();

        prevBtn.disabled = currentGlobalIndex === 0;
        nextBtn.disabled = currentGlobalIndex === currentRoundData.length - 1;

        // 重置捲動
        conversationArea.scrollTop = 0;
    }

    // === 語音功能 ===
    function speak(text, volume = 1, rate = 1, onEndCallback = null) {
        if (synth.speaking && !isPlaying) return;

        const u = new SpeechSynthesisUtterance(text);
        u.lang = 'en-US';
        u.volume = volume;
        u.rate = parseFloat(speedSelect.value) * rate;
        
        const voices = synth.getVoices();
        // 優先選 Google 或 Microsoft 的英文
        const enVoice = voices.find(v => v.lang.includes('en-US') && !v.name.includes('Google')) || voices[0];
        if (enVoice) u.voice = enVoice;

        u.onend = () => { if (onEndCallback) onEndCallback(); };
        u.onerror = (e) => { console.error(e); resetPlayState(); };

        synth.speak(u);
    }

    async function playCurrent() {
        if (isPlaying) { stopAudio(); return; }

        const item = currentRoundData[currentGlobalIndex];
        isPlaying = true;
        updatePlayBtnState();

        // 1. 播放題目
        speak(item.q, 1, 1, () => {
            shadowingTimeout = setTimeout(() => {
                if (!isPlaying) return;
                
                // 自動捲動到回答
                conversationArea.scrollTo({ top: conversationArea.scrollHeight, behavior: 'smooth' });

                if (isShadowing) {
                    playShadowingAnswer(item.a);
                } else {
                    speak(item.a, 1, 1, () => resetPlayState());
                }
            }, 800);
        });
    }

    function playShadowingAnswer(fullText) {
        // 依標點分割
        const segments = fullText.match(/[^,.?!]+[,.?!]*/g) || [fullText];
        let segIndex = 0;

        function playNextSegment() {
            if (!isPlaying) return;
            if (segIndex >= segments.length) { resetPlayState(); return; }

            const segment = segments[segIndex].trim();
            if (!segment) { segIndex++; playNextSegment(); return; }

            // 大聲
            speak(segment, 1, 1, () => {
                if (!isPlaying) return;
                // 小聲 (跟讀)
                speak(segment, 0.2, 0.85, () => {
                    if (!isPlaying) return;
                    shadowingTimeout = setTimeout(() => {
                        segIndex++;
                        playNextSegment();
                    }, 1200);
                });
            });
        }
        playNextSegment();
    }

    function stopAudio() {
        synth.cancel();
        clearTimeout(shadowingTimeout);
        isPlaying = false;
        updatePlayBtnState();
    }

    function resetPlayState() {
        isPlaying = false;
        updatePlayBtnState();
    }

    function updatePlayBtnState() {
        const btnText = playBtn.querySelector('.btn-text');
        const btnIcon = playBtn.querySelector('.play-icon');
        
        if (isPlaying) {
            btnText.textContent = "停止";
            btnIcon.textContent = "⏹";
            playBtn.classList.add('playing');
        } else {
            btnText.textContent = "播放";
            btnIcon.textContent = "▶";
            playBtn.classList.remove('playing');
        }
    }

    // 導航事件
    playBtn.addEventListener('click', playCurrent);
    
    prevBtn.addEventListener('click', () => {
        if (currentGlobalIndex > 0) {
            currentGlobalIndex--;
            updatePlayerUI();
            stopAudio();
        }
    });

    nextBtn.addEventListener('click', () => {
        if (currentGlobalIndex < currentRoundData.length - 1) {
            currentGlobalIndex++;
            updatePlayerUI();
            stopAudio();
        }
    });

    if (speechSynthesis.onvoiceschanged !== undefined) {
        speechSynthesis.onvoiceschanged = () => {};
    }

    initMenu();
});