// ================= 3a_media_groups_core.js: 跨句圖片群組（mediaGroups）資料層 =================
// 目的：「大範圍跨句標記」——一段時間區間可以掛一張圖片，之後播放到這段時間時
//       （例如劇場模式）可以換圖、字幕照樣逐句顯示。跟既有的逐句資料
//       （allLabelsOrdered / sentenceTextMap / timeDataMap）完全解耦：
//       mediaGroups 只認「時間區間」，不引用句子 label，所以句子怎麼合併、
//       分割、在大編輯框重新對齊，都不會影響到已經建立的圖片群組。
//
// ★ 圖片改用「網址參照」設計（不再上傳檔案存進 IndexedDB）：
//   imageUrl 直接存一個字串（絕對網址或相對路徑皆可，例如 'images/scene1.jpg'
//   或 'https://example.com/a.jpg'），瀏覽器直接用這個網址讀圖顯示。
//   好處：JSON 專案檔案本身就完整攜帶圖片資訊，換瀏覽器、換電腦匯入都不會
//   遺失縮圖；缺點：圖片檔案本身要由使用者自行架設/放到可被存取的路徑。
//
// ★ 沒有 mediaGroups 資料的舊專案，讀進來就是空陣列 []，完全不受影響。
//
// 資料結構（mediaGroups 陣列，單筆格式）：
//   {
//     id: 'grp-xxxxx',      // 流水號，由 generateMediaGroupId() 產生
//     startTime: 12.3,      // 這組涵蓋的開始時間（秒）
//     endTime: 45.6,        // 這組涵蓋的結束時間（秒），必須大於 startTime
//     imageUrl: '',         // 圖片網址（絕對或相對路徑），空字串代表尚未設定圖片
//     note: ''              // 使用者自訂註記，例如「第一幕：森林」
//   }
//
// 需求：必須在 1_globals.js（提供 mediaGroups 陣列宣告）、3_data_core.js
//       （提供 saveToStorage，已含 mediaGroups 的存讀邏輯）之後載入。
//       ★ 不再需要 1b_image_store_idb.js（圖片改用網址，不使用 IndexedDB）。

// ================= ★ 群組 id 產生器 ★ =================
function generateMediaGroupId() {
    return 'grp-' + Date.now().toString(36) + '-' + Math.random().toString(36).slice(2, 7);
}

// ================= ★ 基本查詢 ★ =================

// 依開始時間排序後的群組清單。之後的管理 UI／匯出都建議統一用這個順序，
// 避免「建立的先後順序」跟「時間軸上的先後順序」不一致造成使用者混淆。
function getSortedMediaGroups() {
    return [...mediaGroups].sort((a, b) => a.startTime - b.startTime);
}

function findMediaGroupById(id) {
    return mediaGroups.find(g => g.id === id) || null;
}

// 找出「某個時間點」落在哪個（或哪幾個，若允許重疊）群組區間內。
// 之後的播放整合（劇場模式）會用到這個函式；階段一先提供，不影響現在任何畫面。
function getMediaGroupsAt(time) {
    return mediaGroups.filter(g => time >= g.startTime && time < g.endTime);
}

// ================= ★ 新增／修改／刪除 ★ =================

// 建立一個新的圖片群組（先不掛圖片，圖片另外呼叫 setMediaGroupImageUrl 設定）。
// 防呆：開始/結束時間必須是合法數字，且結束時間要大於開始時間，否則回傳 null 並在 console 提示。
function createMediaGroup(startTime, endTime, note = '') {
    const s = Number(startTime), e = Number(endTime);
    if (!isFinite(s) || !isFinite(e) || e <= s) {
        console.warn('[mediaGroups] 建立失敗：時間區間不合法', { startTime, endTime });
        return null;
    }
    const record = {
        id: generateMediaGroupId(),
        startTime: s,
        endTime: e,
        imageUrl: '',
        note: String(note || '')
    };
    mediaGroups.push(record);
    if (typeof saveToStorage === 'function') saveToStorage();
    return record;
}

// 修改某個群組的時間區間（例如使用者事後調整範圍）
function updateMediaGroupRange(id, startTime, endTime) {
    const g = findMediaGroupById(id);
    if (!g) return false;
    const s = Number(startTime), e = Number(endTime);
    if (!isFinite(s) || !isFinite(e) || e <= s) {
        console.warn('[mediaGroups] 更新失敗：時間區間不合法', { startTime, endTime });
        return false;
    }
    g.startTime = s;
    g.endTime = e;
    if (typeof saveToStorage === 'function') saveToStorage();
    return true;
}

// 修改備註
function updateMediaGroupNote(id, note) {
    const g = findMediaGroupById(id);
    if (!g) return false;
    g.note = String(note || '');
    if (typeof saveToStorage === 'function') saveToStorage();
    return true;
}

// 刪除一個群組（圖片只是網址參照，不用額外清理任何儲存體）
function removeMediaGroup(id) {
    const idx = mediaGroups.findIndex(g => g.id === id);
    if (idx === -1) return false;
    mediaGroups.splice(idx, 1);
    if (typeof saveToStorage === 'function') saveToStorage();
    return true;
}

// ================= ★ 圖片網址設定／清除 ★ =================

// 設定（或換掉）某個群組的圖片網址。url 可以是絕對網址或相對路徑，空字串等同清除。
function setMediaGroupImageUrl(id, url) {
    const g = findMediaGroupById(id);
    if (!g) return false;
    g.imageUrl = String(url || '').trim();
    if (typeof saveToStorage === 'function') saveToStorage();
    return true;
}

// 清除某個群組的圖片（群組本身保留，只是變回「還沒設圖」的狀態）
function clearMediaGroupImage(id) {
    const g = findMediaGroupById(id);
    if (!g) return false;
    g.imageUrl = '';
    if (typeof saveToStorage === 'function') saveToStorage();
    return true;
}
