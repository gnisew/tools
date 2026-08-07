// ================= 8_worker_segmentation.js: 背景靜音分析運算引擎 =================

self.onmessage = function(e) {
    // 1. 接收來自前端主畫面的音訊資料與參數
    const { channels, sampleRate, timeRatio, threshold, minSilence, minSegment, padding, mediaDuration } = e.data;
    
    const length = channels[0].length;
    const numChannels = channels.length;
    const step = Math.floor(sampleRate / 100); // 精確度：0.01 秒
    
    let segments = [];
    let isSilence = true;
    let silenceStart = 0;
    let segmentStart = -1;

    // 設定回報時間，避免過度頻繁回報導致效能下降
    let lastReportTime = Date.now();

    // 2. 開始在背景默默地進行 1.5 億次的高速運算...
    for (let i = 0; i < length; i += step) {
        let maxAmp = 0;
        
        // 抓取這個 0.01 秒區塊內的最大音量
        for (let j = 0; j < step && (i + j) < length; j++) {
            let localMax = 0;
            for (let c = 0; c < numChannels; c++) {
                const amp = Math.abs(channels[c][i + j]);
                if (amp > localMax) localMax = amp;
            }
            if (localMax > maxAmp) maxAmp = localMax;
        }

        const currentTime = (i / sampleRate) * timeRatio;

        // 判斷靜音邏輯
        if (maxAmp < threshold) {
            if (!isSilence) {
                isSilence = true;
                silenceStart = currentTime;
            } else if (currentTime - silenceStart >= minSilence && segmentStart !== -1) {
                if (silenceStart - segmentStart >= minSegment) {
                    segments.push({ start: segmentStart, end: silenceStart });
                }
                segmentStart = -1;
            }
        } else {
            if (isSilence) {
                isSilence = false;
                if (segmentStart === -1) segmentStart = currentTime;
            }
        }

        // 3. 每處理一小段時間 (例如 200 毫秒)，就向前端回報一次進度 %
        if (Date.now() - lastReportTime > 200) {
            const percent = Math.round((i / length) * 100);
            self.postMessage({ status: 'progress', percent: percent });
            lastReportTime = Date.now();
        }
    }

    // 4. 收尾最後一段音訊
    if (segmentStart !== -1) {
        const finalEnd = isSilence ? silenceStart : mediaDuration;
        if (finalEnd - segmentStart >= minSegment) {
            segments.push({ start: segmentStart, end: finalEnd });
        }
    }

    // 5. 運算完成！把切割好的時間點陣列交還給前端主畫面
    self.postMessage({ status: 'complete', segments: segments });
};