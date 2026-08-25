// ================= 1a_audio_store_idb.js: 本地音檔 IndexedDB 持久化引擎 =================
// 目的：目前本地音檔只存在瀏覽器記憶體 (Blob URL)，重新整理網頁後就會消失，
//       localStorage 只記得「檔名」，逼使使用者每次都要重新選取同一個檔案，
//       而且剪裁過的音檔（cutAudioRegion 產生的新 WAV）完全沒有任何備份，
//       一旦重新整理，使用者若照提示重新選取「原始檔」，時間標記會整組對不上。
// 做法：把音檔本體 (Blob) 存進 IndexedDB（容量遠大於 localStorage 的 5-10MB 上限，
//       通常有數百 MB 甚至數 GB 可用），網頁重新開啟時直接從 IndexedDB 讀回、
//       在背景自動建立 Blob URL 掛回 <audio>，使用者完全不需要重新選檔。
//
// 使用方式（其餘檔案只需呼叫這 4 個函式）：
//   await AudioStore.save(blobOrFile, { name: '檔名.wav' })   // 存檔
//   const rec = await AudioStore.load()                        // 讀回 { blob, name, savedAt } 或 null
//   await AudioStore.clear()                                   // 清除
//   AudioStore.isSupported()                                   // 瀏覽器是否支援（無痕模式部分瀏覽器會擋）
//
// 需求：必須在 1_globals.js 之後、2_audio_engine.js / 3_data_core.js / 4b_ui_audio_loader.js
//       之前載入（在 index.html 內插入一行 <script src="1a_audio_store_idb.js"></script>）。

const AudioStore = (() => {
    const DB_NAME = 'taggerAudioDB';
    const DB_VERSION = 1;
    const STORE_NAME = 'audioFile';
    const RECORD_KEY = 'current'; // 目前這套系統一次只做一個專案，單一 key 即可

    let dbPromise = null;

    function isSupported() {
        return typeof indexedDB !== 'undefined';
    }

    function openDB() {
        if (!isSupported()) return Promise.reject(new Error('此瀏覽器不支援 IndexedDB'));
        if (dbPromise) return dbPromise;

        dbPromise = new Promise((resolve, reject) => {
            const req = indexedDB.open(DB_NAME, DB_VERSION);
            req.onupgradeneeded = () => {
                const db = req.result;
                if (!db.objectStoreNames.contains(STORE_NAME)) {
                    db.createObjectStore(STORE_NAME);
                }
            };
            req.onsuccess = () => resolve(req.result);
            req.onerror = () => reject(req.error);
            req.onblocked = () => reject(new Error('IndexedDB 被其他分頁鎖住'));
        });
        return dbPromise;
    }

    // 存檔：blob 可以是 File 或 Blob；meta 可帶 name 等額外資訊
    async function save(blob, meta = {}) {
        if (!isSupported()) return false;
        try {
            const db = await openDB();
            return await new Promise((resolve, reject) => {
                const tx = db.transaction(STORE_NAME, 'readwrite');
                tx.objectStore(STORE_NAME).put(
                    { blob: blob, name: meta.name || '', savedAt: Date.now(), ...meta },
                    RECORD_KEY
                );
                tx.oncomplete = () => resolve(true);
                tx.onerror = () => reject(tx.error);
            });
        } catch (err) {
            console.error('[AudioStore] 存檔失敗：', err);
            // 常見情況：無痕模式容量被限制、或磁碟空間不足
            if (typeof showToast === 'function') {
                showToast('音檔背景備份失敗（可能是無痕模式或空間不足），重新整理後仍需重新選取音檔', 'error');
            }
            return false;
        }
    }

    // 讀回：找不到資料時回傳 null，呼叫端要自行處理「請重新選取」的防呆流程
    async function load() {
        if (!isSupported()) return null;
        try {
            const db = await openDB();
            return await new Promise((resolve, reject) => {
                const tx = db.transaction(STORE_NAME, 'readonly');
                const req = tx.objectStore(STORE_NAME).get(RECORD_KEY);
                req.onsuccess = () => resolve(req.result || null);
                req.onerror = () => reject(req.error);
            });
        } catch (err) {
            console.error('[AudioStore] 讀取失敗：', err);
            return null;
        }
    }

    async function clear() {
        if (!isSupported()) return false;
        try {
            const db = await openDB();
            return await new Promise((resolve, reject) => {
                const tx = db.transaction(STORE_NAME, 'readwrite');
                tx.objectStore(STORE_NAME).delete(RECORD_KEY);
                tx.oncomplete = () => resolve(true);
                tx.onerror = () => reject(tx.error);
            });
        } catch (err) {
            console.error('[AudioStore] 清除失敗：', err);
            return false;
        }
    }

    return { save, load, clear, isSupported };
})();

window.AudioStore = AudioStore;
