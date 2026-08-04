// ================= 7_worker_whisper.js: 本地端 AI 語音辨識引擎 =================
import { pipeline, env } from 'https://cdn.jsdelivr.net/npm/@xenova/transformers@2.16.0';

// ★ 核心設定：完美的離線 AI 機制
env.allowLocalModels = false;    
env.allowRemoteModels = true;    
env.useBrowserCache = true;      // ★ 強制啟用瀏覽器快取！模型下載後永久存於本機

let transcriber = null;
let currentModelId = null;

self.onmessage = async (e) => {
    // 接收從主程式傳來的指令、音檔、語言與模型 ID
    const { type, audioData, language, segments, modelId, isLocal } = e.data;

    try {
        // 1. 初始化或切換模型
        // 如果使用者切換了語言導致模型不同，必須清空記憶體重新載入
        if (transcriber && currentModelId !== modelId) {
            transcriber = null;
        }

        if (!transcriber) {
            self.postMessage({ status: 'loading', percent: 0 });
            currentModelId = modelId || 'Xenova/whisper-tiny';

            // 動態切換讀取策略 (支援未來你自己轉好的 ONNX 模型)
            if (isLocal) {
                env.allowLocalModels = true;
                env.allowRemoteModels = false;
                env.localModelPath = './models/'; 
            } else {
                env.allowLocalModels = false;
                env.allowRemoteModels = true;
            }

            // 啟動 pipeline：若本機沒快取就會去下載；有快取則瞬間載入
            transcriber = await pipeline('automatic-speech-recognition', currentModelId, {
                progress_callback: data => {
                    if (data.status === 'progress') {
                        let percent = 0;
                        if (data.progress !== undefined) percent = Math.round(data.progress);
                        else if (data.total > 0) percent = Math.round((data.loaded / data.total) * 100);
                        self.postMessage({ status: 'loading', percent: percent });
                    }
                }
            });
        }

        // ==============================================================
        // 模式 C：純下載模型 (Preload)，不做語音辨識
        // ==============================================================
        if (type === 'preload') {
            self.postMessage({ status: 'preload_complete' });
            return; // 任務結束
        }

        // ==============================================================
        // 模式 A：一鍵全自動 (AI 自己斷句 + 聽打)
        // ==============================================================
        if (type === 'transcribe') {
            self.postMessage({ status: 'processing', message: '模型就緒！正在辨識語音與標記時間...' });
            const result = await transcriber(audioData, {
                chunk_length_s: 30,      
                stride_length_s: 5,      
                return_timestamps: true, 
                language: language || 'chinese',
                task: 'transcribe'
            });
            self.postMessage({ status: 'complete', result: result.chunks });
        }
        
        // ==============================================================
        // 模式 B：AI 批次填詞 (使用傳入的現有時間片段，AI 僅聽打)
        // ==============================================================
        else if (type === 'transcribe_batch') {
            self.postMessage({ status: 'processing', message: '模型就緒！開始批次填詞...' });
            
            for (let i = 0; i < segments.length; i++) {
                const seg = segments[i];
                
                const startSample = Math.floor(seg.start * 16000);
                const endSample = Math.floor(seg.end * 16000);
                const slice = audioData.slice(startSample, endSample);

                if (slice.length > 0) {
                    const result = await transcriber(slice, {
                        language: language || 'chinese',
                        task: 'transcribe',
                        return_timestamps: false 
                    });

                    self.postMessage({
                        status: 'progress_batch',
                        label: seg.label,
                        text: result.text.trim(),
                        current: i + 1,
                        total: segments.length
                    });
                }
            }
            self.postMessage({ status: 'complete_batch' });
        }

    } catch (error) {
        self.postMessage({ status: 'error', message: error.toString() });
    }
};