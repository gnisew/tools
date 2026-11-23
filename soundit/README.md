# 語言檔結構

語言檔與 `index.html` 放在同一層，檔名以 `lang-` 開頭。

```
locale.js          語言核心（登錄、偵測、取字串）
lang-en.js         English（預設，缺字串時最後回退）
lang-zh-TW.js      繁體中文
lang-kasu.js       詔安客語（缺少的字串回退到繁中）
```

## 新增語言（例：日文 ja）
1. 複製 `lang-zh-TW.js` 為 `lang-ja.js`，把第一個參數改成 `'ja'`，翻譯字串。
2. 結尾選項改為 `{ name: '日本語', match: ['ja'] }`。
   - `name`：選單顯示名稱
   - `match`：瀏覽器語言前綴，用於自動偵測
   - `fallback`：缺字串時優先使用的語言（可省略）
3. `index.html` 在 `lang-kasu.js` 後加一行 `<script src="lang-ja.js"></script>`。
4. `sw.js` 的 `REQUIRED_ASSETS` 加入 `'./lang-ja.js'`，並把 `CACHE_NAME` 版本號加一。

## 抽換 / 移除語言
刪除該檔的 `<script>` 與 `sw.js` 路徑即可；`lang-en.js` 不可移除。
