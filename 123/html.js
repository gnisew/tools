// HTML 內容模板
const htmlData = `    
    <div class="sidebar-overlay" id="sidebarOverlay" onclick="closeSidebar()"></div>

    <div class="sidebar" id="sidebar">
        <div class="sidebar-header">
            🥷設定
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
    </div>

    <div class="header">
		<div class="menu-icon" onclick="toggleSidebar()">
			<span class="hamburger"></span>
		</div>
        <div class="logo">
            <span class="logo-text" id="logoText">${logoText}</span>
            <span class="translate-text" id="translateText">${translateText}</span>
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
                    <div class="lang-options" id="leftLangOptions"></div>
                </div>

                <div class="lang-section" id="rightLang">
                    <button class="lang-button" onclick="toggleDropdown('rightLang')">
                        <span id="rightLangText"></span>
                        <span class="dropdown-arrow">▼</span>
                    </button>
                    <div class="lang-options" id="rightLangOptions"></div>
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

// 主要函數：將內容加到 body 裡
function insertHTMLToBody() {
    // 將 HTML 內容插入到 body 的開頭
    document.body.insertAdjacentHTML('afterbegin', htmlData);
    
    // 動態修改頁面標題
    updatePageTitle();
}

// 修改頁面標題的函數
function updatePageTitle() {
    document.title = logoText + translateText;
}

// 當 DOM 載入完成後執行
document.addEventListener('DOMContentLoaded', function() {
    insertHTMLToBody();
});
