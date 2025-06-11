// 在 html.js 中修改語言選擇器部分
const htmlData = `    
    <div class="sidebar-overlay" id="sidebarOverlay" onclick="closeSidebar()"></div>

    <div class="sidebar" id="sidebar">
        <div class="sidebar-header">
            <a href="https://sites.google.com/view/oikasu" target="_blank" style="color: inherit; text-decoration: none;">🥷詔安客語資源中心</a>
            <div class="sidebar-close" onclick="closeSidebar()">╳</div>
        </div>

        <div class="sidebar-section">
            <h3>字體設定</h3>
            <div class="setting-item">
                <select class="setting-select" id="fontFamily" onchange="changeFontFamily()">
                    <option value="default">預設字體</option>
                    <option value="'Microsoft JhengHei', sans-serif">微軟正黑體</option>
                    <option value="'PingFang TC', sans-serif">蘋方-繁</option>
                    <option value="'Noto Sans TC', sans-serif">思源黑體</option>
                    <option value="'Source Han Sans TC', sans-serif">Source Han Sans</option>
                    <option value="serif">襯線字體</option>
                    <option value="monospace">等寬字體</option>
                </select>
            </div>

            <div class="setting-item">
                <select class="setting-select" id="fontSize" onchange="changeFontSize()">
                    <option value="14">小 (14px)</option>
                    <option value="16">中等 (16px)</option>
                    <option value="18" selected>標準 (18px)</option>
                    <option value="20">大 (20px)</option>
                    <option value="22">特大 (22px)</option>
                    <option value="24">超大 (24px)</option>
                </select>
            </div>
        </div>

        <div class="sidebar-section">
            <h3>顯示設定</h3>

            <div class="setting-item">
                <label class="setting-label">
                    <input type="checkbox" id="autoConvert" onchange="toggleAutoConvert()" checked>
                    立即轉換
                </label>
            </div>

            <div class="setting-item">
                <label class="setting-label">
                    <input type="checkbox" id="wrapText" onchange="toggleWrapText()" checked>
                    自動換行
                </label>
            </div>

            <div class="setting-item">
                <label class="setting-label">
                    <input type="checkbox" id="showLineNumbers" onchange="toggleLineNumbers()">
                    顯示行號
                </label>
            </div>

            <div class="setting-item">
                <label class="setting-label">
                    <input type="checkbox" id="syncScroll" onchange="toggleSyncScroll()">
                    同步捲動
                </label>
            </div>

            <div class="setting-item">
                <label class="setting-label">
                    <input type="checkbox" id="rememberInput" onchange="toggleRememberInput()">
                    記憶輸入
                </label>
            </div>
        </div>
    </div>

    <div class="header">
        <div class="menu-icon" onclick="toggleSidebar()">
            <span class="hamburger"></span>
        </div>
        <div class="logo" onclick="openLanguageURL()" style="cursor: pointer;">
            <span class="logo-text" id="logoText">${logoText}</span>
            <span class="translate-text" id="translateText">${translateText}</span>
        </div>
        <div class="language-selector">
            <select class="lang-select" id="languageSelect" onchange="changeLanguage()">
                <!-- 這裡將由 JavaScript 動態生成 -->
            </select>
        </div>
    </div>

    <div class="container">
        <div class="translator-box">
            <div class="language-bar">
                <div class="lang-section" id="leftLang">
                    <button class="lang-button" onclick="toggleDropdown('leftLang')">
                        <span id="leftLangText"></span>
                        <span class="dropdown-arrow">▼</span>
                    </button>
                    <ol class="lang-options" id="leftLangOptions"></ol>
                </div>

                <div class="lang-section" id="rightLang">
                    <button class="lang-button" onclick="toggleDropdown('rightLang')">
                        <span id="rightLangText"></span>
                        <span class="dropdown-arrow">▼</span>
                    </button>
                    <ol class="lang-options" id="rightLangOptions"></ol>
                </div>
            </div>

            <div class="content-area">
                <div class="input-section">
                    <div class="text-container">
                        <div class="line-numbers" id="inputLineNumbers"></div>
                        <textarea class="text-area" id="inputText" placeholder="輸入文字" oninput="handleInput(); updateLineNumbers('input');" onscroll="syncLineNumbersScroll('input')"></textarea>
                        <button class="icon-btn clear-btn" onclick="clearInput()" title="清除">
                            <i class="fas fa-times"></i>
                        </button>
                        <button class="icon-btn convert-btn" onclick="convertText()" id="convertBtn" style="display: none;" title="轉換">
                            <i class="fas fa-arrow-right"></i>
                        </button>
                    </div>
                </div>

                <div class="output-section">
                    <div class="text-container">
                        <div class="line-numbers" id="outputLineNumbers"></div>
                        <div class="output-area" id="outputText" onscroll="syncLineNumbersScroll('output')">翻譯</div>
                        <button class="icon-btn copy-btn" onclick="copyOutput()" id="copyBtn" disabled title="複製">
                            <i class="fas fa-copy"></i>
                        </button>
                        <button class="icon-btn edit-btn" onclick="toggleEdit()" id="editBtn" title="編輯">
                            <i class="fas fa-pencil"></i>
                        </button>
                    </div>
                </div>
            </div>
        </div>
    </div>
`;

// 動態生成語言選擇器選項
function generateLanguageSelector() {
    const languageSelect = document.getElementById('languageSelect');
    if (!languageSelect) return;
    
    // 清空現有選項
    languageSelect.innerHTML = '';
    
    // 根據 languageConfigs 動態生成選項
    Object.entries(languageConfigs).forEach(([key, config]) => {
        const option = document.createElement('option');
        option.value = key;
        option.textContent = config.name;
        languageSelect.appendChild(option);
    });
}

// 修改主要插入函數
function insertHTMLToBody() {
    // 將 HTML 內容插入到 body 的開頭
    document.body.insertAdjacentHTML('afterbegin', htmlData);
    
    // 動態生成語言選擇器
    generateLanguageSelector();
    
    // 動態修改頁面標題
    updatePageTitle();
}

// 修改頁面標題的函數
function updatePageTitle() {
    document.title = logoText + translateText;
}

function openLanguageURL() {
    const currentConfig = languageConfigs[currentLanguage];
    if (currentConfig && currentConfig.url) {
        window.open(currentConfig.url, '_blank');
    }
}

// 當 DOM 載入完成後執行
document.addEventListener('DOMContentLoaded', function() {
    insertHTMLToBody();
});