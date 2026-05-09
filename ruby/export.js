/**
 * 匯出完美的 HTML 檔案
 * @param {string} filename - 下載的檔案名稱
 * @param {Object} config - 包含由主程式傳入的狀態變數
 */
function exportToHtml(filename, config) {
    // 1. 取得與標註區「完全相同」的 DOM 節點
    // 直接呼叫 script.js 中的核心渲染函數 alignByClauses，保證 100% 邏輯一致
    const { node } = alignByClauses({
        hanzi: config.hanzi,
        pinyin: config.pinyin,
        showWarnings: false, // 下載版不顯示警告橘框
        allowEdit: false,    // 下載版不顯示編輯按鈕
        annotationMode: config.annotationMode,
        phoneticDisplayMode: config.phoneticDisplayMode
    });

    // 建立一個暫存容器來獲取 HTML 字串
    const wrapper = document.createElement('div');
    wrapper.appendChild(node);
    
    // 如果網頁中有執行調號轉換（例如 Word 聲調），下載版也需要同步轉換
    //if (typeof convertTonesInNode === 'function') {
    //    convertTonesInNode(wrapper);
    //}

    const bodyContent = wrapper.innerHTML;

    // 2. 建立與 style.css 完全對齊的獨立 CSS
    // 這確保了下載的 HTML 即使離線開啟，排版也與網頁上的標註區一模一樣
    const cssContent = `
        :root {
            --ink-2: #334155;
            --rt-scale: ${config.rtScale || 0.68};
        }
        body {
            font-family: twhei-s, TWHEI, "台灣黑體", system-ui, -apple-system, sans-serif;
            margin: 0;
            padding: 2rem;
            background-color: #fdfdfd;
            color: #333;
            font-size: ${config.fontSize || 18}px;
            /* 讓 base line-height 與網頁一致 */
            line-height: 1.5; 
        }
        .container {
            max-width: 800px;
            margin: 0 auto;
            text-align: justify;
            word-break: break-all;
            line-break: anywhere;
        }
        
        /* 補上網頁原有的行距與斷行設定 */
        .line-wrap {
            display: block;
            margin: 0.35rem 0;
            line-height: 2.1;
            word-break: keep-all;
            white-space: normal;
        }

        /* 標註區核心排版 (完全複製 style.css) */
        ruby {
            ruby-position: over;
            text-align: center;
            display: inline-flex;
            flex-direction: column-reverse;
            vertical-align: middle;
            margin: 0 0.05em;
            /* (已移除此處多餘的 padding，交由 .glyph 控制) */
        }
        rb {
            display: inline;
            line-height: 1.1;
            text-align: center;
        }
        rt {
            font-size: calc(var(--rt-scale) * 1em);
            color: var(--ink-2);
            line-height: 1;
            white-space: nowrap;
            text-align: center;
            display: block;
            margin-bottom: -0.5em;
        }
        rt:empty::before {
            content: '\\00a0'; 
            visibility: hidden; 
        }
        
        .glyph {
            display: inline-block;
            vertical-align: middle;
            padding: 0.18rem 0.16rem;
            margin: 0.06rem 0.03rem;
            border-radius: 0.5rem;
        }
        .glyph-word {
            padding: 0.18rem 0.12rem;
        }
        .glyph.punct, .glyph.alphanum {
            padding: 0.18rem 0.08rem;
            color: var(--ink-2);
        }
        .clause {
            display: inline; 
            padding: 0.2rem 0; 
            margin: 0;         
        }
        .word-unit {
            display: inline;
            -webkit-box-decoration-break: clone;
            box-decoration-break: clone;
        }
        
        /* 軟換行點 */
        wbr.wrap-fix {
            display: inline;
        }

        /* 直注音模式樣式 */
        .mode-vertical-zhuyin rt {
            display: none;
        }
        .mode-vertical-zhuyin rb {
            line-height: 1.4;
        }
        .mode-vertical-zhuyin ruby {
            margin: 0; 
            padding: 0;
        }

        /* 隱藏拼音的功能 */
        .pinyin-hidden rt {
            visibility: hidden;
        }

        /* 頂部按鈕控制區 */
        .controls {
            margin-bottom: 1.5rem;
            padding-bottom: 1rem;
            border-bottom: 1px solid #e5e7eb;
            text-align: center;
        }
        #togglePinyinBtn {
            font-size: 1rem;
            padding: 0.5rem 1rem;
            border-radius: 8px;
            border: 1px solid #e5e7eb;
            background-color: #f1f5f9;
            cursor: pointer;
            font-family: inherit;
        }
        #togglePinyinBtn:hover {
            background-color: #e2e8f0;
        }
    `;

    // 3. 組合完整的 HTML 檔案
    const htmlTemplate = `<!DOCTYPE html>
<html lang="zh-Hant">
<head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>客語標註結果</title>
    <link href="https://oikasu1.github.io/kasuexam/kasu/fonts/twhei.css" rel="stylesheet">
    <style>${cssContent}</style>
</head>
<body class="${config.phoneticDisplayMode === 'vertical-zhuyin' ? 'mode-vertical-zhuyin' : ''}">
    <div class="container">
        <header class="controls">
            <button id="togglePinyinBtn">隱藏拼音</button>
        </header>
        <main id="content">
            ${bodyContent}
        </main>
    </div>
    <script>
        document.addEventListener('DOMContentLoaded', () => {
            const toggleBtn = document.getElementById('togglePinyinBtn');
            const contentDiv = document.getElementById('content');
            if (toggleBtn && contentDiv) {
                toggleBtn.addEventListener('click', () => {
                    const isHidden = contentDiv.classList.toggle('pinyin-hidden');
                    toggleBtn.textContent = isHidden ? '顯示拼音' : '隱藏拼音';
                });
            }
        });
    </script>
</body>
</html>`;

    // 4. 觸發瀏覽器下載
    const blob = new Blob([htmlTemplate], { type: 'text/html;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);
}