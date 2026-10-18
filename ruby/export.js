/**
 * 匯出獨立的 HTML 檔案
 *
 * 標註區的排版 CSS 來自 annotation-core.js（與網頁共用），這裡只負責「頁面外殼」。
 * 標註節點由呼叫端用 buildAnnotatedNode() 產生後傳入，本檔不再自己呼叫 alignByClauses，
 * 因此不依賴 script.js 的全域狀態。
 *
 * @param {string} filename - 下載的檔案名稱
 * @param {Object} config
 * @param {HTMLElement} config.node                 標註結果節點（必填）
 * @param {string}  [config.phoneticDisplayMode]    'pinyin' | 'zhuyin' | 'pinyin-zhuyin' | 'vertical-zhuyin'
 * @param {'hei'|'kai'} [config.font]               字體
 * @param {number}  [config.fontSize]               字級（px）
 * @param {number}  [config.rtScale]                拼音相對大小
 * @param {string}  [config.title]                  網頁標題
 * @param {boolean} [config.convertTones]           是否把 rt 轉成 Word 適用調號（預設否）
 */
function exportToHtml(filename, config = {}) {
    const {
        node,
        phoneticDisplayMode = 'pinyin',
        font = 'hei',
        fontSize = 18,
        rtScale = 0.68,
        title = '標註結果',
        convertTones = false
    } = config;

    if (!node) throw new Error('exportToHtml: 需要傳入標註節點 node');

    // 1. 取得內容（複製一份，避免動到呼叫端的節點）
    const wrapper = document.createElement('div');
    wrapper.appendChild(node.cloneNode(true));

    // 與網頁一致：補上軟換行點
    if (typeof injectWrapPoints === 'function') injectWrapPoints(wrapper);

    if (convertTones && typeof convertTonesInNode === 'function') {
        convertTonesInNode(wrapper);
    }

    const bodyContent = wrapper.innerHTML;

    // 2. 頁面外殼 CSS（標註區本身的規則在 ANNOTATION_CORE_CSS）
    const fontFamily = font === 'kai'
        ? '"台灣楷體", twkai, serif'
        : 'twhei-s, TWHEI, "台灣黑體", system-ui, -apple-system, sans-serif';

    const pageCss = `
:root { --rt-scale: ${Number(rtScale) || 0.68}; }
body {
    font-family: ${fontFamily};
    margin: 0;
    padding: 2rem;
    background-color: #fdfdfd;
    color: #333;
    font-size: ${Number(fontSize) || 18}px;
    line-height: 1.5;
}
.container {
    max-width: 800px;
    margin: 0 auto;
    text-align: justify;
    word-break: break-all;
    line-break: anywhere;
}
.pinyin-hidden rt { visibility: hidden; }
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
#togglePinyinBtn:hover { background-color: #e2e8f0; }
`;

    const bodyClasses = ['annot-export'];
    if (font === 'kai') bodyClasses.push('font-kai');
    if (phoneticDisplayMode === 'vertical-zhuyin') bodyClasses.push('mode-vertical-zhuyin');

    const safeTitle = String(title).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');

    // 3. 組合完整 HTML
    const htmlTemplate = `<!DOCTYPE html>
<html lang="zh-Hant">
<head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>${safeTitle}</title>
    <link href="https://oikasu1.github.io/kasuexam/kasu/fonts/twhei.css" rel="stylesheet">
    <style>${ANNOTATION_CORE_CSS}
${pageCss}</style>
</head>
<body class="${bodyClasses.join(' ')}">
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

    // 4. 觸發下載
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
