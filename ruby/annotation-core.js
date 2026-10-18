/**
 * annotation-core.js
 * 標註區（ruby 排版）的「單一來源」：網頁畫面、下載 HTML 都用這裡的 CSS 與輔助函式。
 * 載入順序：必須在 export.js、script.js 之前。
 *
 * 規則：
 *   - 只放「版面」規則（會影響字距、行距、斷行）。
 *   - hover / 底色 / 游標 / 動畫等互動效果仍留在 style.css。
 */

const ANNOTATION_CORE_CSS = `
:root {
    --ink-2: #334155;
    --rt-scale: 0.68;
}

/* ---------- ruby 基本排版 ---------- */
ruby {
    ruby-position: over;
    text-align: center;
    display: inline-flex;
    flex-direction: column-reverse; /* 讓 rb 在 rt 下方 */
    vertical-align: middle;
    margin: 0 0.05em;
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

/* ---------- 字 / 詞 / 標點 ---------- */
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
.word-unit .glyph-word {
    padding: 0.1rem 0.12rem;
}
.glyph.punct {
    padding: 0.18rem 0.08rem;
    color: var(--ink-2);
}

/* ---------- 句 / 詞外殼（自然斷行：允許跨行） ---------- */
.clause {
    display: inline;
    padding: 0.2rem 0;
    margin: 0;
    -webkit-box-decoration-break: clone;
    box-decoration-break: clone;
}
.word-unit {
    display: inline;
    -webkit-box-decoration-break: clone;
    box-decoration-break: clone;
}

/* ---------- 行 ---------- */
.line-wrap {
    display: block;
    margin: 0.35rem 0;
    line-height: 2.1;
    word-break: keep-all;
    white-space: normal;
}

/* ---------- 直注音：隱藏 rt，字緊密排列 ---------- */
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

/* ---------- 楷體（網頁的 #resultArea 與匯出頁的 .annot-export 共用；保留 id 的權重） ---------- */
:is(#resultArea, .annot-export).font-kai,
:is(#resultArea, .annot-export).font-kai ruby,
:is(#resultArea, .annot-export).font-kai rb,
:is(#resultArea, .annot-export).font-kai rt {
    font-family: "台灣楷體", twkai;
}
`;

/** 把共用 CSS 放進 <head> 最前面，讓 style.css 的互動效果仍能覆蓋它 */
function injectAnnotationCoreStyle() {
    if (document.getElementById('annotation-core-style')) return;
    const style = document.createElement('style');
    style.id = 'annotation-core-style';
    style.textContent = ANNOTATION_CORE_CSS;
    document.head.insertBefore(style, document.head.firstChild);
}

/**
 * 在每個 ruby / 標點後補上軟換行點 <wbr class="wrap-fix">。
 * 網頁（MutationObserver）與下載 HTML 共用，確保斷行位置一致。
 * @param {ParentNode} root
 */
function injectWrapPoints(root) {
    if (!root) return;
    root.querySelectorAll('ruby, span.punct, span.alphanum').forEach(el => {
        const next = el.nextSibling;
        if (!next || (next.nodeName !== 'WBR' && next.className !== 'wrap-fix')) {
            const wbr = document.createElement('wbr');
            wbr.className = 'wrap-fix';
            el.after(wbr);
        }
    });
}

/**
 * 「複製標註」貼進 Word 時，包在剪貼簿 HTML 裡的內嵌 CSS。
 * @param {string} phoneticDisplayMode
 * @returns {string}
 */
function buildWordClipboardCss(phoneticDisplayMode) {
    const vertical = phoneticDisplayMode === 'vertical-zhuyin';
    const bodyLineHeight = vertical ? '18pt' : '1.5';
    const rbLineHeight = vertical ? '1.0' : '1.5';
    const rtStyle = vertical
        ? 'font-size: 1pt; line-height: 0; color: transparent; display: block; height: 0; overflow: hidden;'
        : 'font-size: 0.68em; color: #334155; letter-spacing: .02em; display: block; margin-bottom: .06em; text-align: center; font-family: "台灣楷體", twkai;';
    return `*{font-family:"台灣楷體", twkai;box-shadow:none!important;outline:none!important;border:none!important;background:transparent!important}
ruby{ruby-position:over;ruby-align:center;font-family:"台灣楷體", twkai;}
rb{display:inline;font-family:"台灣楷體", twkai; line-height: ${rbLineHeight};}
rt{${rtStyle}}
${vertical ? 'ruby{margin:0!important;}' : ''}
p { margin: 0; padding: 0; }
body{font-size:14pt;line-height:${bodyLineHeight};font-family:"台灣楷體", twkai;}`;
}

if (typeof document !== 'undefined') injectAnnotationCoreStyle();
