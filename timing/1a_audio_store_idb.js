// 1a_audio_store_idb.js: 以 IndexedDB 保存本地音檔，重新整理後不必重新選檔
// API：AudioStore.save(blob, { name }) / load() / clear() / isSupported()
// 載入順序：1_globals.js 之後、2_audio_engine.js 之前

const AudioStore = (() => {
    const DB_NAME = 'taggerAudioDB';
    const DB_VERSION = 1;
    const STORE_NAME = 'audioFile';
    const RECORD_KEY = 'current'; // 一次只處理一個專案，使用單一 key

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
            if (typeof showToast === 'function') {
                showToast('音檔背景備份失敗（可能是無痕模式或空間不足），重新整理後仍需重新選取音檔', 'error');
            }
            return false;
        }
    }

    // 找不到資料時回傳 null，由呼叫端處理「請重新選取」
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
