// ================= 7_worker_whisper.js: 本地端 AI 語音辨識引擎 =================
import { pipeline, env } from 'https://cdn.jsdelivr.net/npm/@xenova/transformers@2.16.0';

env.allowLocalModels = false;
let transcriber = null;

self.onmessage = async (e) => {
    // 新增接收 segments (時間片段陣列)
    const { type, audioData, language, segments } = e.data;

    try {
        // 1. 初始化模型
        if (!transcriber) {
            self.postMessage({ status: 'loading', percent: 0 });
            transcriber = await pipeline('automatic-speech-recognition', 'Xenova/whisper-tiny', {
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
        // 模式 A：一鍵全自動 (AI 自己斷句 + 聽打)
        // ==============================================================
        if (type === 'transcribe') {
            self.postMessage({ status: 'processing', message: '模型就緒！正在辨識語音與標記時間...' });
            const result = await transcriber(audioData, {
                chunk_length_s: 30,      
                stride_length_s: 5,      
                return_timestamps: true, // 開啟 AI 時間標記
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
            
            // 針對每一句切出音軌，單獨交給 AI
            for (let i = 0; i < segments.length; i++) {
                const seg = segments[i];
                
                // 16kHz 取樣率，將秒數轉為陣列索引 (Index)
                const startSample = Math.floor(seg.start * 16000);
                const endSample = Math.floor(seg.end * 16000);
                const slice = audioData.slice(startSample, endSample); // 切割 Float32Array

                if (slice.length > 0) {
                    // return_timestamps: false 讓模型專注於聽打，速度極快！
                    const result = await transcriber(slice, {
                        language: language || 'chinese',
                        task: 'transcribe',
                        return_timestamps: false 
                    });

                    // 每完成一句，就即時回傳給主畫面更新 UI
                    self.postMessage({
                        status: 'progress_batch',
                        label: seg.label,
                        text: result.text.trim(),
                        current: i + 1,
                        total: segments.length
                    });
                }
            }
            // 全數處理完畢
            self.postMessage({ status: 'complete_batch' });
        }

    } catch (error) {
        self.postMessage({ status: 'error', message: error.toString() });
    }
};