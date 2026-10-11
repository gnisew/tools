// 跨句圖片群組（mediaGroups）資料層
// 一段時間區間可掛一張圖片，播放到該區間時（例如劇場模式）換圖，字幕照常逐句顯示。
// mediaGroups 只認時間區間，不引用句子 label，因此句子合併、分割、重新對齊都不影響群組。
// 圖片以網址參照（絕對網址或相對路徑）存在 imageUrl，JSON 專案檔即完整攜帶圖片資訊；
// 圖片檔需由使用者自行放在可被存取的位置。沒有 mediaGroups 的舊專案讀入時為空陣列。
//
// 單筆資料格式：
//   {
//     id: 'grp-xxxxx',  // 由 generateMediaGroupId() 產生
//     startTime: 12.3,  // 開始時間（秒）
//     endTime: 45.6,    // 結束時間（秒），必須大於 startTime
//     imageUrl: '',     // 圖片網址，空字串代表尚未設定
//     note: ''          // 使用者自訂註記
//   }
//
// 依賴：1_globals.js（mediaGroups 宣告）、3_data_core.js（saveToStorage，已含 mediaGroups 存讀）

function generateMediaGroupId() {
    return 'grp-' + Date.now().toString(36) + '-' + Math.random().toString(36).slice(2, 7);
}

// 查詢

// 依開始時間排序，管理 UI 與匯出統一使用此順序
function getSortedMediaGroups() {
    return [...mediaGroups].sort((a, b) => a.startTime - b.startTime);
}

function findMediaGroupById(id) {
    return mediaGroups.find(g => g.id === id) || null;
}

// 回傳某個時間點所在的群組（允許重疊，故可能有多個）
function getMediaGroupsAt(time) {
    return mediaGroups.filter(g => time >= g.startTime && time < g.endTime);
}

// 新增／修改／刪除

// 建立群組（圖片另以 setMediaGroupImageUrl 設定）；時間區間不合法時回傳 null
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

function updateMediaGroupNote(id, note) {
    const g = findMediaGroupById(id);
    if (!g) return false;
    g.note = String(note || '');
    if (typeof saveToStorage === 'function') saveToStorage();
    return true;
}

function removeMediaGroup(id) {
    const idx = mediaGroups.findIndex(g => g.id === id);
    if (idx === -1) return false;
    mediaGroups.splice(idx, 1);
    if (typeof saveToStorage === 'function') saveToStorage();
    return true;
}

// 圖片網址

// 設定或更換圖片網址，空字串等同清除
function setMediaGroupImageUrl(id, url) {
    const g = findMediaGroupById(id);
    if (!g) return false;
    g.imageUrl = String(url || '').trim();
    if (typeof saveToStorage === 'function') saveToStorage();
    return true;
}

// 清除圖片，群組本身保留
function clearMediaGroupImage(id) {
    const g = findMediaGroupById(id);
    if (!g) return false;
    g.imageUrl = '';
    if (typeof saveToStorage === 'function') saveToStorage();
    return true;
}
