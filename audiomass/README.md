# AudioMass (繁體中文版)

Free full-featured web-based audio &amp; waveform editing tool

Original project: [https://github.com/pkalogiros/audiomass](https://github.com/pkalogiros/audiomass)
Original author: Pantelis Kalogiros

---

## 本版修改內容

本 fork 基於 AudioMass 做了以下改動：

### 多語言 i18n
- 新增繁體中文（zh-TW）介面，包括所有選單、彈窗、效果面板、狀態訊息、Undo/Redo 描述
- 語言切換器（Help → 語言）
- 自動偵測瀏覽器語言

### PWA 修正
- 修復 `manifest.json` 在 `file://` 協定下的 CORS 問題
- 更新 Service Worker 快取清單（對應原始碼檔案）
- 新增 PWA 更新通知 UI（有新版本時顯示 Reload 按鈕）
- 移除已廢棄的 AppCache

### 程式碼重構
- 將 `ui.js`（3712 行）拆分為 11 個模組，最大單檔 1218 行
  - `ui-helpers.js` — 共用輔助函數
  - `ui-menu-*.js` — 各選單區塊（File/Edit/Effects/View/Help）
  - `ui-toolbar.js` — 工具列
  - `ui-mainview.js` — 主視圖
  - `ui.js` — 建構函數（組裝器）

---

## Getting it to Run!

1. Clone this repo (or download as zip)
2. Navigate to the `src` directory
3. Start a local server, e.g.:
   ```
   node -e "require('http').createServer((r,q)=>{var f=require('fs'),p=require('path');f.readFile(p.join('.',r.url==='/'?'index.html':r.url),(e,d)=>{q.writeHead(e?404:200,{'Content-Type':r.url.endsWith('.js')?'text/javascript':r.url.endsWith('.css')?'text/css':'text/html'});q.end(e?'Not found':d)})}).listen(8080)"
   ```
4. Navigate to [http://localhost:8080/](http://localhost:8080/)

---

## License

MIT License - see [LICENSE](LICENSE)

Third-party libraries: see [THIRD_PARTY_NOTICES.md](THIRD_PARTY_NOTICES.md)
