// 音訊緩衝區與 WAV 編碼
// 建立音訊緩衝區（AudioBuffer 建構失敗時退回 OfflineAudioContext）
function createBufferSafe(channels, length, sampleRate) {
    if (window.AudioBuffer) {
        try {
            return new AudioBuffer({ numberOfChannels: channels, length: length, sampleRate: sampleRate });
        } catch (e) {}
    }
    const offlineCtx = new (window.OfflineAudioContext || window.webkitOfflineAudioContext)(channels, length, sampleRate);
    return offlineCtx.createBuffer(channels, length, sampleRate);
}

// 16-bit PCM WAV 編碼
function audioBufferToWav(buffer) {
    const numChannels = buffer.numberOfChannels;
    const sampleRate = buffer.sampleRate;
    const length = buffer.length;
    
    const format = 1;  // 1 = PCM
    const bitDepth = 16; 
    const bytesPerSample = 2;
    const blockAlign = numChannels * bytesPerSample;
    const byteRate = sampleRate * blockAlign;
    const dataSize = length * blockAlign;
    
    const wavBuffer = new ArrayBuffer(44 + dataSize);
    const view = new DataView(wavBuffer);
    let pos = 0;

    function writeString(s) { 
        for (let i = 0; i < s.length; i++) {
            view.setUint8(pos++, s.charCodeAt(i));
        }
    }
    function writeUint16(d) { 
        view.setUint16(pos, d, true); 
        pos += 2; 
    }
    function writeUint32(d) { 
        view.setUint32(pos, d, true); 
        pos += 4; 
    }

    // 1. RIFF Chunk Descriptor
    writeString('RIFF');
    writeUint32(36 + dataSize);  // 檔案總大小 - 8
    writeString('WAVE');

    // 2. "fmt " sub-chunk
    writeString('fmt ');
    writeUint32(16);  // PCM 標頭固定 16 bytes
    writeUint16(format);  // 1 = PCM
    writeUint16(numChannels);
    writeUint32(sampleRate);
    writeUint32(byteRate);  // SampleRate * BlockAlign
    writeUint16(blockAlign);  // Channels * BytesPerSample
    writeUint16(bitDepth);

    // 3. "data" sub-chunk
    writeString('data');
    writeUint32(dataSize);

    // 寫入 PCM 數據
    for (let i = 0; i < length; i++) {
        for (let ch = 0; ch < numChannels; ch++) {
            let sample = buffer.getChannelData(ch)[i];
            // 夾斷在 [-1, 1] 防止爆音
            sample = Math.max(-1, Math.min(1, sample));
            // 轉為 16-bit 整數
            let intSample = sample < 0 ? sample * 0x8000 : sample * 0x7FFF;
            view.setInt16(pos, intSample, true);
            pos += 2;
        }
    }

    return new Blob([wavBuffer], { type: 'audio/wav' });
}

function sliceAudioBuffer(buffer, startTime, endTime) {
    const sampleRate = buffer.sampleRate;
    const channels = buffer.numberOfChannels;
    const startSample = Math.max(0, Math.floor(startTime * sampleRate));
    const endSample = Math.min(buffer.length, Math.floor(endTime * sampleRate));
    const newLength = endSample - startSample;

    const newBuffer = createBufferSafe(channels, newLength, sampleRate);
    for (let i = 0; i < channels; i++) {
        newBuffer.getChannelData(i).set(buffer.getChannelData(i).subarray(startSample, endSample));
    }
    return newBuffer;
}

// 匯出專用切片：與 sliceAudioBuffer 相同，另外把「範圍音量調整」烤進切片（2d_volume_regions.js）。
// 批次轉檔等與目前專案無關的流程請繼續用 sliceAudioBuffer。
function sliceAudioBufferForExport(buffer, startTime, endTime) {
    const out = sliceAudioBuffer(buffer, startTime, endTime);
    if (!window.VolumeRegions || !VolumeRegions.applyToSlice) return out;
    const startSample = Math.max(0, Math.floor(startTime * buffer.sampleRate));
    return VolumeRegions.applyToSlice(out, startSample / buffer.sampleRate, buffer);
}

function appendAudioBuffers(buf1, buf2) {
    const numChannels = Math.max(buf1.numberOfChannels, buf2.numberOfChannels);
    const sampleRate = buf1.sampleRate;
    const totalLength = buf1.length + buf2.length;
    
    const newBuffer = createBufferSafe(numChannels, totalLength, sampleRate);
    for (let i = 0; i < numChannels; i++) {
        const channelData = newBuffer.getChannelData(i);
        const data1 = buf1.numberOfChannels > i ? buf1.getChannelData(i) : buf1.getChannelData(0);
        const data2 = buf2.numberOfChannels > i ? buf2.getChannelData(i) : buf2.getChannelData(0);
        channelData.set(data1, 0);
        channelData.set(data2, buf1.length);
    }
    return newBuffer;
}

// 匯出 MP3 位元率：比照原始檔（載入時由 recordOriginalBitrate() 量測），量不到時退回 320kbps
function getTargetMp3Kbps() {
    const saved = parseInt(localStorage.getItem('tagger_originalBitrateKbps'), 10);
    if (!isNaN(saved) && saved >= 32 && saved <= 320) return saved;
    return 320;
}

// MP3 轉換器
function audioBufferToMp3(buffer) {
    if (!window.lamejs) {
        if (typeof showToast === 'function') showToast('無法載入 MP3 轉換套件，將降級為 WAV 格式。', 'error');
        // showToast 尚未就緒時只記錄到 console，不使用 alert 打斷操作
        else console.warn('[audioBufferToMp3] 無法載入 MP3 轉換套件，將降級為 WAV 格式。');
        return audioBufferToWav(buffer);
    }
    
    const channels = buffer.numberOfChannels;
    const sampleRate = buffer.sampleRate;
    const kbps = getTargetMp3Kbps(); 
    
    const mp3encoder = new lamejs.Mp3Encoder(channels, sampleRate, kbps); 
    const mp3Data = [];

    const left = buffer.getChannelData(0);
    const right = channels > 1 ? buffer.getChannelData(1) : null;
    const sampleChunk = 1152; 
    
    let i = 0;
    while (i < left.length) {
        let chunkLength = Math.min(sampleChunk, left.length - i);
        
        let leftChunk = new Int16Array(chunkLength);
        let rightChunk = channels > 1 ? new Int16Array(chunkLength) : null;

        for(let j=0; j < chunkLength; j++) {
            let sLeft = Math.max(-1, Math.min(1, left[i+j])); 
            leftChunk[j] = sLeft < 0 ? sLeft * 0x8000 : sLeft * 0x7FFF;
            
            if (channels > 1) {
                let sRight = Math.max(-1, Math.min(1, right[i+j])); 
                rightChunk[j] = sRight < 0 ? sRight * 0x8000 : sRight * 0x7FFF;
            }
        }
        
        const mp3buf = channels > 1 
            ? mp3encoder.encodeBuffer(leftChunk, rightChunk) 
            : mp3encoder.encodeBuffer(leftChunk);
            
        if (mp3buf.length > 0) mp3Data.push(mp3buf);
        i += sampleChunk;
    }
    
    const mp3buf = mp3encoder.flush();
    if (mp3buf.length > 0) mp3Data.push(mp3buf);
    
    return new Blob(mp3Data, {type: 'audio/mp3'});
}

// 剪裁引擎：純記憶體無損拼接
window.cutAudioRegion = async function(start, end) {
    if (!wavesurfer || !wavesurfer.getDecodedData()) return showToast('無有效音檔', 'error');
    const buffer = wavesurfer.getDecodedData();
    showToast('正在執行剪裁...', 'normal');
    
    const sampleRate = buffer.sampleRate;
    const numChannels = buffer.numberOfChannels;
    
    // start/end 為播放器時間 (media time)，buffer 為 WaveSurfer 解碼時間；
    // MP3 編碼延遲會使兩者有落差，需以 timeRatio 換算，與自動靜音斷句一致
    const webAudioDuration = buffer.duration;
    const mediaDuration = audioPlayer.duration || webAudioDuration;
    const timeRatio = mediaDuration / webAudioDuration;  // media time / buffer time

    const bufferStart = start / timeRatio;  // 還原成 buffer 時間，才能對應正確的 sample
    const bufferEnd = end / timeRatio;

    const startSample = Math.max(0, Math.floor(bufferStart * sampleRate));
    const endSample = Math.min(buffer.length, Math.floor(bufferEnd * sampleRate));
    const newLength = buffer.length - (endSample - startSample);
    
    const newBuffer = createBufferSafe(numChannels, newLength, sampleRate);
    
    for (let i = 0; i < numChannels; i++) {
        const oldData = buffer.getChannelData(i);
        const newData = newBuffer.getChannelData(i);
        newData.set(oldData.subarray(0, startSample), 0);
        newData.set(oldData.subarray(endSample), startSample);
    }
    
    const wavBlob = audioBufferToWav(newBuffer);
    
    // 延後註銷舊網址，待新音檔載入成功後再釋放，避免 WaveSurfer 讀取時失敗
    const oldSrc = audioPlayer.src;
    const newUrl = URL.createObjectURL(wavBlob);
    
    // 標記時間平移 (Ripple Edit)：剪掉的長度是 buffer 時間，需以 timeRatio 換算為 media time
    const diff = ((endSample - startSample) / sampleRate) * timeRatio;
    if (typeof saveState === 'function') saveState(); 
    
    allLabelsOrdered.forEach(label => {
        if (timeDataMap[label]) {
            let s = typeof timeDataMap[label] === 'object' ? timeDataMap[label].start : timeDataMap[label];
            let e = typeof timeDataMap[label] === 'object' ? timeDataMap[label].end : null;

            if (s >= end) {
                s -= diff;
                if (e !== null) e -= diff;
            } else if (s >= start && s < end) {
                s = start;
                if (e !== null) e = Math.max(start, e - diff);
            } else if (e !== null && e > start) {
                e -= diff;
            }
            timeDataMap[label] = { start: parseFloat(s.toFixed(3)), end: e !== null ? parseFloat(e.toFixed(3)) : null };
        }
    });
    
    // 音量調整區段同步位移（被剪掉的範圍內的區段移除）
    if (window.VolumeRegions) VolumeRegions.shiftForCut(start, end, diff);

    audioPlayer.src = newUrl;
    audioPlayer.load();  // 強制立即載入

    // 新音檔載入成功後才釋放舊 Blob 網址
    if (oldSrc && oldSrc.startsWith('blob:')) {
        let revoked = false;
        const revokeOldBlob = () => {
            if (revoked) return;
            revoked = true;
            URL.revokeObjectURL(oldSrc);
            audioPlayer.removeEventListener('loadeddata', revokeOldBlob);
        };
        audioPlayer.addEventListener('loadeddata', revokeOldBlob, { once: true });
        // 保險機制：萬一 loadeddata 事件因故沒觸發，5 秒後強制釋放，避免記憶體一直卡住
        setTimeout(revokeOldBlob, 5000);
    }

    localStorage.setItem('tagger_localFileName', '剪裁後音檔.wav');
    localStorage.setItem('tagger_isTrimmed', 'true');  // 標記音檔已被剪裁過
    localStorage.setItem('tagger_audioType', 'local');
    // 剪裁後的新 WAV 同步存入 IndexedDB，重新整理後直接讀回剪裁版，避免時間標記與原始檔對不上
    if (typeof AudioStore !== 'undefined' && AudioStore.isSupported()) {
        AudioStore.save(wavBlob, { name: '剪裁後音檔.wav' });
    }
    saveToStorage();
    
    // 等切換到新音檔 (loadedmetadata) 後才重新初始化 WaveSurfer，避免讀到舊音檔
    let waveSurferReinitDone = false;
    const reinitWaveSurfer = () => {
        if (waveSurferReinitDone) return;
        waveSurferReinitDone = true;
        audioPlayer.removeEventListener('loadedmetadata', reinitWaveSurfer);
        window.pendingSeekTime = start;  // 游標移到剪接點
        if (typeof initWaveSurfer === 'function') initWaveSurfer();
        if (typeof updateAllTimeDisplays === 'function') updateAllTimeDisplays();
        if (tempRegion) { tempRegion.remove(); tempRegion = null; }
        if (typeof updateToolbarButtons === 'function') updateToolbarButtons();
        showToast('剪裁完成！已保留清晰音質。', 'success');
    };
    audioPlayer.addEventListener('loadedmetadata', reinitWaveSurfer, { once: true });
    // 保險機制：萬一 loadedmetadata 事件因故沒觸發，1.5 秒後還是強制執行，避免卡死不更新
    setTimeout(reinitWaveSurfer, 1500);
};

// 匯出音檔檔名（含副檔名），依「設定 → 匯出音檔的檔名規則」組成
// usedNames（Set，選填）：打包 ZIP 時用來自動加上 (2)、(3)，避免同名覆蓋
// 4d_ui_settings.js 未載入時，退回「編號_文字」
function getAudioExportFilename(label, ext, usedNames) {
    let base;
    if (typeof buildAudioExportBaseName === 'function') {
        base = buildAudioExportBaseName(label);
    } else {
        const safeText = sanitizeFilename(sentenceTextMap[label] || '').substring(0, 30);
        base = `${label}${safeText ? '_' + safeText : ''}`;
    }
    let filename = base + ext;
    if (usedNames) {
        let n = 2;
        while (usedNames.has(filename.toLowerCase())) { filename = `${base}(${n})${ext}`; n++; }
        usedNames.add(filename.toLowerCase());
    }
    return filename;
}

window.downloadSingleAudio = function(label) {
    if (!wavesurfer || !wavesurfer.getDecodedData()) return showToast('請先載入音檔並等待分析完成', 'error');
    const times = getCalculatedTimes(label);
    if (!times) return showToast('此句尚未標記時間', 'error');
    showToast('正在轉碼音檔，請稍候...', 'success');
    
    setTimeout(() => {
        const buffer = wavesurfer.getDecodedData();
        const slicedBuffer = sliceAudioBufferForExport(buffer, times.start, times.end);
        const format = exportAudioFormatSelect.value;
        const ext = format === 'mp3' ? '.mp3' : '.wav';
        const finalBlob = format === 'mp3' ? audioBufferToMp3(slicedBuffer) : audioBufferToWav(slicedBuffer);
        
        const filename = getAudioExportFilename(label, ext);
        
        const url = URL.createObjectURL(finalBlob);
        const a = document.createElement('a');
        a.style.display = 'none'; a.href = url; a.download = filename;
        document.body.appendChild(a); a.click();
        setTimeout(() => { document.body.removeChild(a); window.URL.revokeObjectURL(url); }, 100);
    }, 50);
};

window.downloadTimeRangeAudio = function(start, end, filenamePrefix) {
    if (!wavesurfer || !wavesurfer.getDecodedData()) return showToast('請先載入音檔並等待分析完成', 'error');
    showToast('正在轉碼選取範圍，請稍候...', 'success');
    
    setTimeout(() => {
        const buffer = wavesurfer.getDecodedData();
        // 利用既有的 sliceAudioBuffer 切割音訊
        const slicedBuffer = sliceAudioBufferForExport(buffer, start, end);
        
        // 讀取側邊欄的格式設定 (MP3 或是 WAV)
        const format = exportAudioFormatSelect ? exportAudioFormatSelect.value : 'wav';
        const ext = format === 'mp3' ? '.mp3' : '.wav';
        const finalBlob = format === 'mp3' ? audioBufferToMp3(slicedBuffer) : audioBufferToWav(slicedBuffer);
        
        let filename = `${filenamePrefix}_${formatTime(start).replace(':', '')}至${formatTime(end).replace(':', '')}${ext}`;
        if (filenamePrefix === "完整音檔") {
            // 優先使用原始檔名（剪裁後不被覆蓋），其次 tagger_localFileName，最後用「完整音檔備份」
            const originalName = localStorage.getItem('tagger_originalFileName') || localStorage.getItem('tagger_localFileName');
            const baseName = originalName ? originalName.replace(/\.[^/.]+$/, '') : '完整音檔備份';
            filename = `${baseName}${ext}`;
        }
        
        const url = URL.createObjectURL(finalBlob);
        const a = document.createElement('a');
        a.style.display = 'none'; a.href = url; a.download = filename;
        document.body.appendChild(a); a.click();
        setTimeout(() => { document.body.removeChild(a); window.URL.revokeObjectURL(url); }, 100);
    }, 50);
};

exportAudioZipBtn?.addEventListener('click', () => {
    if (!wavesurfer || !wavesurfer.getDecodedData()) return showToast('請先載入音檔並等待分析完成', 'error');
    if (typeof JSZip === 'undefined') return showToast('缺少 JSZip 套件，請重新載入網頁', 'error');
    
    const labelsToExport = allLabelsOrdered.filter(label => timeDataMap[label] !== undefined);
    if (labelsToExport.length === 0) return showToast('尚未打點任何句子，無法打包音檔！', 'error');
    
    showToast(`開始打包 ${labelsToExport.length} 個音檔，請不要關閉視窗...`, 'success');
    setTimeout(() => {
        const zip = new JSZip();
        const buffer = wavesurfer.getDecodedData();
        const format = exportAudioFormatSelect.value;
        const ext = format === 'mp3' ? '.mp3' : '.wav';
        const usedNames = new Set();  // 記錄已用過的檔名，避免重複覆蓋
        
        labelsToExport.forEach(label => {
            const times = getCalculatedTimes(label);
            if (times) {
                const slicedBuffer = sliceAudioBufferForExport(buffer, times.start, times.end);
                const finalBlob = format === 'mp3' ? audioBufferToMp3(slicedBuffer) : audioBufferToWav(slicedBuffer);
                const filename = getAudioExportFilename(label, ext, usedNames);
                zip.file(filename, finalBlob);
            }
        });
        
        zip.generateAsync({ type: "blob" }).then(function(content) {
            const url = URL.createObjectURL(content);
            const a = document.createElement('a');
            a.style.display = 'none'; a.href = url; a.download = "烏衣行音檔_打包匯出.zip";
            document.body.appendChild(a); a.click();
            setTimeout(() => { document.body.removeChild(a); window.URL.revokeObjectURL(url); showToast('打包完成！開始下載檔案。', 'success'); }, 100);
        });
    }, 100);
});

// 自動靜音斷句核心引擎

// 引擎 A：全域自動斷句引擎
// 外層包裝：用 try/finally 確保「開始分析」按鈕在成功、提早返回或例外時都會恢復
async function performAutoSegmentation() {
    try {
        return await performAutoSegmentationCore();
    } finally {
        if (asConfirmBtn) asConfirmBtn.disabled = false;
    }
}

async function performAutoSegmentationCore() {
    if (!wavesurfer || !wavesurfer.getDecodedData()) {
        return showToast('請先載入音檔並等待分析完成', 'error');
    }

    const buffer = (window.VocalEnhance ? VocalEnhance.getAnalysisBuffer(wavesurfer.getDecodedData()) : wavesurfer.getDecodedData());  // 人聲強化啟用時，用壓低配樂的版本偵測靜音
    const sampleRate = buffer.sampleRate;
    const length = buffer.length;
    
    const numChannels = buffer.numberOfChannels;
    const channels = [];
    for (let c = 0; c < numChannels; c++) {
        channels.push(buffer.getChannelData(c));
    }

    const webAudioDuration = buffer.duration;
    const mediaDuration = audioPlayer.duration || webAudioDuration;
    const timeRatio = mediaDuration / webAudioDuration;

    const threshold = parseFloat(asThreshold.value) / 100;
    const minSilence = parseFloat(asSilence.value);
    const padding = parseFloat(asPadding.value);
    const minSegment = asMinSegment ? parseFloat(asMinSegment.value) : 0.5;
    const detectionMode = asDetectionMode ? asDetectionMode.value : 'peak';  // 預設 'peak'

    const step = Math.floor(sampleRate / 100); 
    
    let segments = [];
    let isSilence = true;
    let silenceStart = 0;
    let segmentStart = -1;

    if (asConfirmBtn) asConfirmBtn.disabled = true;
    showToast('1/3 正在分析全域波形... 0%', 'normal');

    // 動態時間切片：追蹤系統時間
    let lastYieldTime = Date.now();

    for (let i = 0; i < length; i += step) {
        let maxAmp = 0;
        let sumSquares = 0;  // RMS 模式累加器
        const localEnd = Math.min(i + step, length);
        const blockSampleCount = (localEnd - i) * numChannels;
        
        // 尋找最大振幅（peak 模式）／累加平方和（rms 模式）
        for (let j = i; j < localEnd; j++) {
            for (let c = 0; c < numChannels; c++) {
                const amp = Math.abs(channels[c][j]);
                if (amp > maxAmp) maxAmp = amp;
                if (detectionMode === 'rms') sumSquares += amp * amp;
            }
        }
        // RMS 模式：用均方根取代峰值，較不受單一突波影響；peak 模式維持原本行為
        const level = (detectionMode === 'rms' && blockSampleCount > 0)
            ? Math.sqrt(sumSquares / blockSampleCount)
            : maxAmp;

        const currentTime = (i / sampleRate) * timeRatio;

        if (level < threshold) {
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

        // 每經過 40 毫秒 (約 25fps)，強制瀏覽器更新畫面一次
        if (Date.now() - lastYieldTime > 40) {
            // 將波形分析階段設定為 0% ~ 85%
            const percent = Math.round((i / length) * 85);
            showToast(`1/3 正在分析全域波形... ${percent}%`, 'normal');
            await new Promise(resolve => setTimeout(resolve, 0));
            lastYieldTime = Date.now();
        }
    }

    if (segmentStart !== -1) {
        const finalEnd = isSilence ? silenceStart : mediaDuration;
        if (finalEnd - segmentStart >= minSegment) {
            segments.push({ start: segmentStart, end: finalEnd });
        }
    }

    if (segments.length === 0) {
        if (asConfirmBtn) asConfirmBtn.disabled = false;
        return showToast('找不到符合條件的斷句，請調高門檻或縮短時長', 'error');
    }

    // 階段 2：生成與分配標記資料 (85% ~ 95%)
    showToast('2/3 正在生成標記資料... 85%', 'normal');
    await new Promise(resolve => setTimeout(resolve, 10));  // 暫停一下讓 UI 更新

    // 記錄是否從 0 新增列：需整份重繪列表，否則新列只存在資料中不會顯示
    let didCreateNewLabels = false;
    if (allLabelsOrdered.length === 0) {
        for (let i = 0; i < segments.length; i++) {
            const group = Math.floor(i / 99);
            const num = (i % 99) + 1;
            const prefix = String.fromCharCode(65 + group);
            const label = `${prefix}${num.toString().padStart(2, '0')}`;
            allLabelsOrdered.push(label);
            sentenceTextMap[label] = '';
        }
        didCreateNewLabels = true;
    }

    timeDataMap = {};
    let segIndex = 0;
    const gapMargin = 0.005;  // 安全防撞距離 (強制拉開 0.005 秒的空隙)
    
    // 記錄句子數不足以承接全部靜音段的情況，超出的段落需提示使用者
    const hadExistingLabelsBeforeThisRun = !didCreateNewLabels;

    for (let i = 0; i < allLabelsOrdered.length; i++) {
        if (segIndex >= segments.length) break;
        const label = allLabelsOrdered[i];
        
        // 動態彈性留白計算 (空間不夠就自動縮小)
        let currentPaddingStart = padding;
        let currentPaddingEnd = padding;

        // 檢查與「前一段」的距離，如果空間不夠，就把留白縮小為距離的一半
        if (segIndex > 0) {
            const prevGap = segments[segIndex].start - segments[segIndex - 1].end;
            currentPaddingStart = Math.min(padding, (prevGap / 2) - gapMargin);
        }
        
        // 檢查與「後一段」的距離
        if (segIndex < segments.length - 1) {
            const nextGap = segments[segIndex + 1].start - segments[segIndex].end;
            currentPaddingEnd = Math.min(padding, (nextGap / 2) - gapMargin);
        }

        // 防呆：確保留白不會變成負數
        currentPaddingStart = Math.max(0, currentPaddingStart);
        currentPaddingEnd = Math.max(0, currentPaddingEnd);

        let s = segments[segIndex].start - currentPaddingStart;
        let e = segments[segIndex].end + currentPaddingEnd;
        
        timeDataMap[label] = { 
            start: parseFloat(Math.max(0, s).toFixed(3)), 
            end: parseFloat(Math.min(mediaDuration, e).toFixed(3)) 
        };
        segIndex++;
    }

    // 因句子數不足而被捨棄的段落數（僅在列表原本就有句子時發生）
    const discardedSegmentCount = segments.length - segIndex;

    saveToStorage();

    // 階段 3：畫面渲染 (95% ~ 100%)
    showToast('3/3 正在重新渲染畫面... 95%', 'normal');
    await new Promise(resolve => setTimeout(resolve, 10));

    // 新增整批句子時需 renderSentenceList() 整份重繪（updateAllTimeDisplays 只更新既有 DOM）
    if (didCreateNewLabels && typeof renderSentenceList === 'function') {
        renderSentenceList();
    }
    if (typeof updateAllTimeDisplays === 'function') updateAllTimeDisplays();
    if (typeof renderAllRegions === 'function') renderAllRegions();
    
    if (tempRegion) { tempRegion.remove(); tempRegion = null; }
    if (typeof updateToolbarButtons === 'function') updateToolbarButtons();

    // 有段落因句子數不足被捨棄時，以警示取代成功訊息，避免互相蓋掉
    if (hadExistingLabelsBeforeThisRun && discardedSegmentCount > 0) {
        showToast(`偵測到 ${segments.length} 段，但列表句子數不足，有 ${discardedSegmentCount} 段未套用時間（可先新增空白句子列再重新斷句）`, 'error');
    } else {
        showToast(`全域斷句完成！共精準切出 ${segments.length} 句`, 'success');
    }
}

// 檢查遺漏的聲音段落（僅視覺標示，不寫入 timeDataMap）
// 1. 合併所有標記區間，找出未被任何標記覆蓋的空隙
// 2. 以比斷句更敏感的門檻重掃空隙，持續超過門檻的聲音視為疑似遺漏
// 3. 以紅色暫時 region（id 以 "missed-" 開頭）疊在聲波圖上，重繪時自動清除
// 不能沿用斷句門檻：空隙本來就是以該門檻判為靜音，同一組門檻必然掃不到東西
// 建立「疑似遺漏」標記的內容 DOM，由 performMissedSegmentCheck 與 6_wave_controller.js 共用
function buildMissedRegionContent(regionId) {
    const contentEl = document.createElement('div');
    contentEl.style.cssText = 'display:flex;align-items:center;gap:3px;font-weight:bold;color:#B71C1C;font-size:0.75rem;pointer-events:none;';

    // 只有「✕」啟用 pointer-events，其餘部分穿透到聲波軌道，點擊 ✕ 即移除此疑似遺漏標記
    const delBtn = document.createElement('span');
    delBtn.textContent = '✕';
    delBtn.title = '移除這個疑似遺漏標示';
    delBtn.style.cssText = 'pointer-events:auto;cursor:pointer;flex:none;display:inline-flex;align-items:center;justify-content:center;width:14px;height:14px;border-radius:50%;background:#B71C1C;color:#fff;font-size:0.65rem;line-height:1;';
    delBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        if (typeof removeMissedSegment === 'function') removeMissedSegment(regionId);
    });

    const labelEl = document.createElement('span');
    labelEl.textContent = '遺漏？';

    contentEl.appendChild(delBtn);
    contentEl.appendChild(labelEl);
    return contentEl;
}

function performMissedSegmentCheck() {
    if (!wavesurfer || !wavesurfer.getDecodedData()) {
        return showToast('請先載入音檔並等待分析完成', 'error');
    }

    clearMissedRegions();

    const buffer = (window.VocalEnhance ? VocalEnhance.getAnalysisBuffer(wavesurfer.getDecodedData()) : wavesurfer.getDecodedData());  // 人聲強化啟用時使用分析用 buffer
    const sampleRate = buffer.sampleRate;
    const length = buffer.length;
    const numChannels = buffer.numberOfChannels;
    const channels = [];
    for (let c = 0; c < numChannels; c++) channels.push(buffer.getChannelData(c));

    const webAudioDuration = buffer.duration;
    const mediaDuration = audioPlayer.duration || webAudioDuration;
    const timeRatio = mediaDuration / webAudioDuration;

    const detectionMode = asDetectionMode ? asDetectionMode.value : 'peak';

    // 檢查門檻比斷句門檻更敏感（減半），才抓得到被判為靜音的小聲人聲
    const segmentThreshold = parseFloat(asThreshold?.value || 5) / 100;
    const reviewThreshold = Math.max(segmentThreshold / 2, 0.005);

    // minGapToScan：空隙多長才掃描；minMissedDuration：聲音持續多久算疑似遺漏。
    // 兩者與 asMinSegment 無關，刻意設短（遺漏的常是一兩個字的短句）
    const minGapToScan = 0.1;
    const minMissedDuration = 0.15;

    // 1. 收集目前所有「已標記」區間，排序後合併重疊/相鄰的部分
    const covered = allLabelsOrdered
        .map(label => timeDataMap[label])
        .filter(t => t && typeof t.start === 'number' && typeof t.end === 'number')
        .sort((a, b) => a.start - b.start);

    const merged = [];
    covered.forEach(seg => {
        const last = merged[merged.length - 1];
        if (last && seg.start <= last.end + 0.01) {
            last.end = Math.max(last.end, seg.end);
        } else {
            merged.push({ start: seg.start, end: seg.end });
        }
    });

    // 2. 算出「完全沒有被任何標記覆蓋」的空隙
    const gaps = [];
    let cursor = 0;
    merged.forEach(seg => {
        if (seg.start - cursor >= minGapToScan) gaps.push({ start: cursor, end: seg.start });
        cursor = Math.max(cursor, seg.end);
    });
    if (mediaDuration - cursor >= minGapToScan) gaps.push({ start: cursor, end: mediaDuration });

    if (gaps.length === 0) {
        return showToast('沒有明顯的空隙，標記範圍已涵蓋整段音檔', 'success');
    }

    // 3. 針對每個空隙用更敏感的門檻重新掃描音量
    const step = Math.floor(sampleRate / 100);
    const missed = [];

    gaps.forEach(gap => {
        const startSample = Math.max(0, Math.floor((gap.start / timeRatio) * sampleRate));
        const endSample = Math.min(length, Math.ceil((gap.end / timeRatio) * sampleRate));

        let isSilence = true;
        let segStart = -1;

        for (let i = startSample; i < endSample; i += step) {
            let maxAmp = 0, sumSquares = 0;
            const localEnd = Math.min(i + step, endSample);
            const blockSampleCount = (localEnd - i) * numChannels;

            for (let j = i; j < localEnd; j++) {
                for (let c = 0; c < numChannels; c++) {
                    const amp = Math.abs(channels[c][j]);
                    if (amp > maxAmp) maxAmp = amp;
                    if (detectionMode === 'rms') sumSquares += amp * amp;
                }
            }
            const level = (detectionMode === 'rms' && blockSampleCount > 0)
                ? Math.sqrt(sumSquares / blockSampleCount)
                : maxAmp;

            const currentTime = (i / sampleRate) * timeRatio;

            if (level >= reviewThreshold) {
                if (isSilence) { isSilence = false; segStart = currentTime; }
            } else if (!isSilence) {
                isSilence = true;
                if (currentTime - segStart >= minMissedDuration) {
                    missed.push({ start: Math.max(gap.start, segStart), end: Math.min(gap.end, currentTime) });
                }
            }
        }
        if (!isSilence && segStart !== -1 && gap.end - segStart >= minMissedDuration) {
            missed.push({ start: Math.max(gap.start, segStart), end: gap.end });
        }
    });

    if (missed.length === 0) {
        return showToast('空隙皆為靜音，沒有偵測到疑似遺漏的聲音', 'success');
    }

    // 以紅色暫時標記疊在聲波圖上；需 isRendering 鎖，否則 region-created 監聽會將其誤判為手動選取框。
    // region.element 設為 pointer-events:none，純視覺提示；跳轉與移除走「疑似遺漏清單」面板
    window.missedSegmentsData = missed.map((seg, idx) => ({ id: `missed-${idx}`, start: seg.start, end: seg.end }));

    isRendering = true;
    missed.forEach((seg, idx) => {
        if (typeof wsRegions === 'undefined' || !wsRegions) return;
        const regionId = `missed-${idx}`;
        const contentEl = buildMissedRegionContent(regionId);
        const region = wsRegions.addRegion({
            id: regionId,
            start: seg.start,
            end: seg.end,
            color: 'rgba(211, 47, 47, 0.35)',
            drag: false,
            resize: false,
            content: contentEl
        });
        // 整個 region 不接收滑鼠事件，不擋住底下標記的拖曳/縮放（✕ 另設 pointer-events:auto）
        if (region && region.element) {
            region.element.style.pointerEvents = 'none';
            // 不透明紅色外框，確保標記邊界始終清楚可見
            region.element.style.border = '2px solid #D32F2F';
            region.element.style.boxSizing = 'border-box';
        }
    });
    isRendering = false;

    if (typeof renderMissedSegmentsPanel === 'function') renderMissedSegmentsPanel();

    showToast(`疑似遺漏 ${missed.length} 段，已用紅色標示在聲波圖上`, 'error');
}

// 「疑似遺漏」清單面板 —— 負責跳轉、單一移除、整批清除
function renderMissedSegmentsPanel() {
    const panel = document.getElementById('missedSegmentsPanel');
    if (!panel) return;

    const data = window.missedSegmentsData || [];
    if (data.length === 0) {
        panel.style.display = 'none';
        panel.innerHTML = '';
        return;
    }

    const fmt = (t) => `${formatTime(t)}.${Math.floor((t % 1) * 10)}`;

    panel.innerHTML = '';

    const header = document.createElement('div');
    header.className = 'missed-panel-header';
    header.innerHTML = `<span>疑似遺漏 (${data.length})</span>`;
    const closeBtn = document.createElement('button');
    closeBtn.setAttribute('aria-label', '清除全部疑似遺漏標示');
    closeBtn.title = '清除全部標示';
    closeBtn.innerHTML = '<span class="material-icons" style="font-size:1.1rem;">close</span>';
    closeBtn.addEventListener('click', () => clearMissedRegions());
    header.appendChild(closeBtn);
    panel.appendChild(header);

    const list = document.createElement('div');
    list.className = 'missed-panel-list';

    data.forEach(seg => {
        const item = document.createElement('div');
        item.className = 'missed-panel-item';

        const timeEl = document.createElement('div');
        timeEl.className = 'missed-panel-item-time';
        timeEl.innerHTML = `<span class="material-icons" style="font-size:1rem;">play_circle</span> ${fmt(seg.start)} - ${fmt(seg.end)}`;
        timeEl.title = '跳至這一段';
        timeEl.addEventListener('click', () => jumpToMissedSegment(seg));

        const removeBtn = document.createElement('button');
        removeBtn.className = 'missed-panel-item-remove';
        removeBtn.setAttribute('aria-label', '移除這個疑似遺漏標示');
        removeBtn.title = '移除這個標示';
        removeBtn.innerHTML = '<span class="material-icons" style="font-size:1.1rem;">delete_outline</span>';
        removeBtn.addEventListener('click', () => removeMissedSegment(seg.id));

        item.appendChild(timeEl);
        item.appendChild(removeBtn);
        list.appendChild(item);
    });

    panel.appendChild(list);
    panel.style.display = 'flex';
}

// 跳到某個疑似遺漏段落的開頭，方便直接聽那一段有沒有真的漏標
function jumpToMissedSegment(seg) {
    if (typeof wavesurfer !== 'undefined' && wavesurfer && audioPlayer.duration) {
        wavesurfer.setTime(seg.start);
    } else if (typeof audioPlayer !== 'undefined' && audioPlayer) {
        audioPlayer.currentTime = seg.start;
    }
    if (typeof audioPlayer !== 'undefined' && audioPlayer) audioPlayer.pause();
    if (typeof snapWaveformToTop === 'function') snapWaveformToTop();
}

// 移除單一疑似遺漏標示（紅色 region + 清單裡的這一筆）
function removeMissedSegment(id) {
    if (typeof wsRegions !== 'undefined' && wsRegions) {
        const region = wsRegions.getRegions().find(r => r.id === id);
        if (region) region.remove();
    }
    window.missedSegmentsData = (window.missedSegmentsData || []).filter(seg => seg.id !== id);
    renderMissedSegmentsPanel();
}

// 清除上一次「檢查遺漏」留下的紅色暫時標記（不影響任何正式的標記 region），並收合面板
function clearMissedRegions() {
    if (typeof wsRegions !== 'undefined' && wsRegions) {
        wsRegions.getRegions().forEach(r => {
            if (r.id && String(r.id).startsWith('missed-')) r.remove();
        });
    }
    window.missedSegmentsData = [];
    if (typeof renderMissedSegmentsPanel === 'function') renderMissedSegmentsPanel();
}

// 列表完全沒有句子列時，依需要數量建立空白句子列（編號規則同引擎 A），讓新音檔也能只框選局部斷句
// 列表已有句子列時不動作；回傳 true 代表有新增，呼叫端需 renderSentenceList() 整份重繪
function createBlankLabelsIfListEmpty(count) {
    if (allLabelsOrdered.length > 0 || count <= 0) return false;
    for (let i = 0; i < count; i++) {
        const group = Math.floor(i / 99);
        const num = (i % 99) + 1;
        const label = `${String.fromCharCode(65 + group)}${num.toString().padStart(2, '0')}`;
        allLabelsOrdered.push(label);
        sentenceTextMap[label] = '';
    }
    return true;
}

// 引擎 B：局部範圍自動斷句引擎
async function performRegionAutoSegmentation(startTime, endTime) {
    if (!wavesurfer || !wavesurfer.getDecodedData()) return showToast('請先載入音檔', 'error');

    const buffer = (window.VocalEnhance ? VocalEnhance.getAnalysisBuffer(wavesurfer.getDecodedData()) : wavesurfer.getDecodedData());  // 人聲強化啟用時使用分析用 buffer
    const sampleRate = buffer.sampleRate;
    const numChannels = buffer.numberOfChannels;
    const channels = [];
    for (let c = 0; c < numChannels; c++) channels.push(buffer.getChannelData(c));

    const webAudioDuration = buffer.duration;
    const mediaDuration = audioPlayer.duration || webAudioDuration;
    const timeRatio = mediaDuration / webAudioDuration;

    const startSample = Math.floor((startTime / timeRatio) * sampleRate);
    const endSample = Math.floor((endTime / timeRatio) * sampleRate);
    const totalSamples = endSample - startSample;

    const threshold = parseFloat(asThreshold.value) / 100;
    const minSilence = parseFloat(asSilence.value);
    const padding = parseFloat(asPadding.value);
    const minSegment = asMinSegment ? parseFloat(asMinSegment.value) : 0.5;
    const detectionMode = asDetectionMode ? asDetectionMode.value : 'peak';  // 預設 'peak'
    
    const step = Math.floor(sampleRate / 100); 
    
    let segments = [];
    let isSilence = true;
    let silenceStart = startTime;
    let segmentStart = -1;

    showToast('1/3 正在分析局部波形... 0%', 'normal');
    let lastYieldTime = Date.now();

    for (let i = startSample; i < endSample; i += step) {
        let maxAmp = 0;
        let sumSquares = 0;  // RMS 模式累加器
        const localEnd = Math.min(i + step, endSample);
        const blockSampleCount = (localEnd - i) * numChannels;
        for (let j = i; j < localEnd; j++) {
            for (let c = 0; c < numChannels; c++) {
                const amp = Math.abs(channels[c][j]);
                if (amp > maxAmp) maxAmp = amp;
                if (detectionMode === 'rms') sumSquares += amp * amp;
            }
        }
        const level = (detectionMode === 'rms' && blockSampleCount > 0)
            ? Math.sqrt(sumSquares / blockSampleCount)
            : maxAmp;

        const currentTime = (i / sampleRate) * timeRatio;

        if (level < threshold) {
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

        // 動態時間切片
        if (Date.now() - lastYieldTime > 40) {
            const processed = i - startSample;
            const percent = Math.round((processed / totalSamples) * 85);
            showToast(`1/3 正在分析局部波形... ${percent}%`, 'normal');
            await new Promise(resolve => setTimeout(resolve, 0));
            lastYieldTime = Date.now();
        }
    }

    if (segmentStart !== -1) {
        const finalEnd = isSilence ? silenceStart : endTime;
        if (finalEnd - segmentStart >= minSegment) {
            segments.push({ start: segmentStart, end: finalEnd });
        }
    }

    if (segments.length === 0) {
        return showToast('此範圍內找不到符合條件的斷句', 'error');
    }

    // 階段 2：批次寫入資料 (85% ~ 95%)
    showToast('2/3 正在套用標記資料... 85%', 'normal');
    await new Promise(resolve => setTimeout(resolve, 10));

    if (typeof saveState === 'function') saveState(); 

    // 依設定「斷句時新增列表」處理（預設：新增列表）
    //   勾選：沿用原本的列，多出的段落各新增一列（框選範圍每段都新增），不動其他未標記列
    //   取消：只把時間套用到既有未標記的列（列表全空時仍先建立空白列）
    const addRowMode = (typeof isAddRowEnabled !== 'function') || isAddRowEnabled('segment');

    // 列表全空時先建立空白句子列；新增列表模式下，多出的段落由 addRowsForTimes() 新增
    const didCreateNewLabels = addRowMode ? false : createBlankLabelsIfListEmpty(segments.length);

    let labelsToUse = [...(targetAutoSegmentRange?.labelsToClear || [])];
    
    if (!addRowMode && labelsToUse.length < segments.length) {
        const unmapped = allLabelsOrdered.filter(lbl => !timeDataMap[lbl] && !labelsToUse.includes(lbl));
        labelsToUse = labelsToUse.concat(unmapped);
    }

    // 尋找外部鄰居的邊界，防止局部斷句向外擴張撞到別的標記
    let globalPrevEnd = 0;
    let globalNextStart = mediaDuration;
    if (labelsToUse.length > 0) {
        const firstIdx = allLabelsOrdered.indexOf(labelsToUse[0]);
        for (let i = firstIdx - 1; i >= 0; i--) {
            if (timeDataMap[allLabelsOrdered[i]]) {
                globalPrevEnd = typeof timeDataMap[allLabelsOrdered[i]] === 'object' ? timeDataMap[allLabelsOrdered[i]].end : null;
                if (globalPrevEnd !== null) break;
            }
        }
        const lastIdx = allLabelsOrdered.indexOf(labelsToUse[labelsToUse.length - 1]);
        for (let i = lastIdx + 1; i < allLabelsOrdered.length; i++) {
            if (timeDataMap[allLabelsOrdered[i]]) {
                globalNextStart = typeof timeDataMap[allLabelsOrdered[i]] === 'object' ? timeDataMap[allLabelsOrdered[i]].start : null;
                if (globalNextStart !== null) break;
            }
        }
    }

    // 新增列表模式且無可沿用的列（框選範圍）時，以框選範圍前後最近的既有標記為外圍邊界
    if (labelsToUse.length === 0) {
        allLabelsOrdered.forEach(lbl => {
            if (!timeDataMap[lbl]) return;
            const t = typeof getCalculatedTimes === 'function' ? getCalculatedTimes(lbl) : null;
            if (!t || t.end == null) return;
            if (t.end <= startTime + 0.001 && t.end > globalPrevEnd) globalPrevEnd = t.end;
            if (t.start >= endTime - 0.001 && t.start < globalNextStart) globalNextStart = t.start;
        });
    }

    let mappedCount = 0;
    const extraTimes = [];  // 沒有現成的列可放的段落（新增列表模式下會各自新增一列）
    const gapMargin = 0.005;  // 安全防撞距離

    segments.forEach((seg, idx) => {
        // 動態彈性留白計算
        let currentPaddingStart = padding;
        let currentPaddingEnd = padding;

        // 計算與「前一個段落」或「全域外圍標記」的距離
        if (idx > 0) {
            const prevGap = seg.start - segments[idx - 1].end;
            currentPaddingStart = Math.min(padding, (prevGap / 2) - gapMargin);
        } else {
            const prevGap = seg.start - globalPrevEnd;
            currentPaddingStart = Math.min(padding, prevGap - gapMargin);
        }

        // 計算與「後一個段落」或「全域外圍標記」的距離
        if (idx < segments.length - 1) {
            const nextGap = segments[idx + 1].start - seg.end;
            currentPaddingEnd = Math.min(padding, (nextGap / 2) - gapMargin);
        } else {
            const nextGap = globalNextStart - seg.end;
            currentPaddingEnd = Math.min(padding, nextGap - gapMargin);
        }

        // 防呆保護
        currentPaddingStart = Math.max(0, currentPaddingStart);
        currentPaddingEnd = Math.max(0, currentPaddingEnd);

        let s = seg.start - currentPaddingStart;
        let e = seg.end + currentPaddingEnd;
        
        if (idx < labelsToUse.length) {
            const label = labelsToUse[idx];
            timeDataMap[label] = { 
                start: parseFloat(Math.max(0, s).toFixed(3)), 
                end: parseFloat(Math.min(mediaDuration, e).toFixed(3)) 
            };
            mappedCount++;
        } else if (addRowMode) {
            extraTimes.push({
                start: parseFloat(Math.max(0, s).toFixed(3)),
                end: parseFloat(Math.min(mediaDuration, e).toFixed(3))
            });
        }
    });

    // 新增列表模式 —— 多出來的段落各新增一列（內含存檔與列表重繪，全文模式一併同步大編輯框）
    const addedRowCount = extraTimes.length;
    if (addedRowCount > 0) {
        addRowsForTimes(extraTimes);
        mappedCount += addedRowCount;
    }

    saveToStorage();

    // 階段 3：畫面渲染 (95% ~ 100%)
    showToast('3/3 正在重新渲染畫面... 95%', 'normal');
    await new Promise(resolve => setTimeout(resolve, 10));

    // 若剛才新建了句子列，必須整份重繪列表，新句子才會立刻出現在畫面上
    if (didCreateNewLabels && typeof renderSentenceList === 'function') renderSentenceList();
    if (typeof updateAllTimeDisplays === 'function') updateAllTimeDisplays();
    if (typeof renderAllRegions === 'function') renderAllRegions();
    
    if (tempRegion) { tempRegion.remove(); tempRegion = null; }
    if (typeof updateToolbarButtons === 'function') updateToolbarButtons();
    
    if (mappedCount < segments.length) {
        showToast(`局部斷句完成！但句子不夠，僅套用了 ${mappedCount} 句`, 'normal');
    } else {
        showToast(`局部斷句完成！共精準套用 ${mappedCount} 句${addedRowCount > 0 ? `（新增 ${addedRowCount} 列）` : ''}`, 'success');
    }
}

// 多重音訊處理引擎 (打包與合併)
window.processAdvancedDownload = async function(labels, mode, silenceSeconds) {
    if (!wavesurfer || !wavesurfer.getDecodedData()) return showToast('請先載入音檔並等待分析完成', 'error');
    
    // 依照標籤在總表中的順序重新排序
    labels.sort((a, b) => allLabelsOrdered.indexOf(a) - allLabelsOrdered.indexOf(b));
    const buffer = wavesurfer.getDecodedData();
    const format = document.getElementById('exportAudioFormatSelect') ? document.getElementById('exportAudioFormatSelect').value : 'wav';
    const ext = format === 'mp3' ? '.mp3' : '.wav';

    if (mode === 'zip') {
        if (typeof JSZip === 'undefined') return showToast('缺少 JSZip 套件', 'error');
        showToast(`開始打包 ${labels.length} 個音檔...`, 'normal');
        const zip = new JSZip();
        const usedNames = new Set();  // 記錄已用過的檔名，避免重複覆蓋
        
        for (let i = 0; i < labels.length; i++) {
            const label = labels[i];
            const times = getCalculatedTimes(label);
            if (times) {
                const slicedBuffer = sliceAudioBufferForExport(buffer, times.start, times.end);
                const finalBlob = format === 'mp3' ? audioBufferToMp3(slicedBuffer) : audioBufferToWav(slicedBuffer);
                const filename = getAudioExportFilename(label, ext, usedNames);
                zip.file(filename, finalBlob);
            }
        }
        
        const content = await zip.generateAsync({ type: "blob" });
        const url = URL.createObjectURL(content);
        const a = document.createElement('a');
        a.style.display = 'none'; a.href = url; a.download = `烏衣行音檔_選取打包_${Date.now()}.zip`;
        document.body.appendChild(a); a.click();
        setTimeout(() => { document.body.removeChild(a); window.URL.revokeObjectURL(url); showToast('打包下載完成！', 'success'); }, 100);

    } else if (mode === 'merge') {
        showToast(`開始合併 ${labels.length} 個音檔 (包含靜音緩衝)...`, 'normal');
        
        const sampleRate = buffer.sampleRate;
        const channels = buffer.numberOfChannels;
        const silenceFrames = Math.floor(silenceSeconds * sampleRate);
        
        let buffersToMerge = [];
        let totalFrames = 0;

        // 1. 擷取所有片段並計算總長度
        for (let i = 0; i < labels.length; i++) {
            const times = getCalculatedTimes(labels[i]);
            if (times) {
                const slicedBuffer = sliceAudioBufferForExport(buffer, times.start, times.end);
                buffersToMerge.push(slicedBuffer);
                totalFrames += slicedBuffer.length;
            }
        }
        
        // 加入靜音的長度：(片段數 - 1) * 靜音幀數
        if (buffersToMerge.length > 1) {
            totalFrames += (buffersToMerge.length - 1) * silenceFrames;
        }

        if (buffersToMerge.length === 0) return showToast('無有效的音訊標記可合併', 'error');

        // 2. 建立新的空白畫布 (OfflineAudioContext)
        const offlineCtx = new (window.OfflineAudioContext || window.webkitOfflineAudioContext)(channels, totalFrames, sampleRate);
        const mergedBuffer = offlineCtx.createBuffer(channels, totalFrames, sampleRate);

        // 3. 依序填入音訊資料
        let currentOffset = 0;
        for (let i = 0; i < buffersToMerge.length; i++) {
            const buf = buffersToMerge[i];
            for (let c = 0; c < channels; c++) {
                mergedBuffer.getChannelData(c).set(buf.getChannelData(c), currentOffset);
            }
            // 推進偏移量，並加上靜音長度
            currentOffset += buf.length;
            if (i < buffersToMerge.length - 1) {
                currentOffset += silenceFrames;  // 留白，預設為 0 不填入資料即為靜音
            }
        }

        // 4. 轉換格式並下載
        const finalBlob = format === 'mp3' ? audioBufferToMp3(mergedBuffer) : audioBufferToWav(mergedBuffer);
        const url = URL.createObjectURL(finalBlob);
        const a = document.createElement('a');
        a.style.display = 'none'; a.href = url; a.download = `烏衣行合併音檔_${labels[0]}_至_${labels[labels.length-1]}${ext}`;
        document.body.appendChild(a); a.click();
        setTimeout(() => { document.body.removeChild(a); window.URL.revokeObjectURL(url); showToast('合併下載完成！', 'success'); }, 100);
    }
};

window.processBatchLocalFiles = async function(fileList, paddingSec, autoPara) {
    // 1. 確保檔案按照檔名(字母順序)排序
    fileList.sort((a, b) => a.name.localeCompare(b.name, 'zh-Hant', { numeric: true }));

    const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
    const decodedBuffers = [];
    const fileNames = [];

    showToast(`正在解碼 ${fileList.length} 個音檔，請稍候...`, 'normal');

    // 2. 解碼所有音檔
    for (let i = 0; i < fileList.length; i++) {
        const file = fileList[i];
        fileNames.push(file.name.replace(/\.[^/.]+$/, ""));  // 移除副檔名作為文字
        const arrayBuffer = await file.arrayBuffer();
        const audioBuffer = await audioCtx.decodeAudioData(arrayBuffer);
        decodedBuffers.push(audioBuffer);
    }

    if (decodedBuffers.length === 0) throw new Error("沒有找到有效的音檔");

    // 3. 計算總畫布長度與統一取樣率 (以第一首為基準，通常是雙聲道 44100 或 48000)
    const sampleRate = decodedBuffers[0].sampleRate;
    const channels = 2;  // 強制輸出雙聲道避免單/雙聲道混合出錯
    const paddingFrames = Math.floor(paddingSec * sampleRate);

    let totalFrames = 0;
    decodedBuffers.forEach(b => totalFrames += b.length);
    totalFrames += paddingFrames * (decodedBuffers.length > 0 ? decodedBuffers.length - 1 : 0);

    const offlineCtx = new (window.OfflineAudioContext || window.webkitOfflineAudioContext)(channels, totalFrames, sampleRate);
    const mergedBuffer = offlineCtx.createBuffer(channels, totalFrames, sampleRate);

    // 4. 開始依序貼上音檔，並產生標記資料
    let currentOffset = 0;
    const newTimeDataMap = {};
    const newSentenceTextMap = {};
    const newAllLabels = [];

    let currentParaChar = 'A';
    let currentSentNum = 1;
    let lastPrefix = '';

    for (let i = 0; i < decodedBuffers.length; i++) {
        const buf = decodedBuffers[i];
        
        // 寫入音訊數據 (支援單聲道自動複製到雙聲道)
        for (let c = 0; c < channels; c++) {
            if (c < buf.numberOfChannels) {
                mergedBuffer.getChannelData(c).set(buf.getChannelData(c), currentOffset);
            } else {
                mergedBuffer.getChannelData(c).set(buf.getChannelData(0), currentOffset);
            }
        }

        // 計算時間
        const startSec = currentOffset / sampleRate;
        const endSec = (currentOffset + buf.length) / sampleRate;

        // 智慧標記命名邏輯
        const name = fileNames[i];
        let prefix = 'A';
        if (autoPara) {
            const firstChar = name.charAt(0).toUpperCase();
            if (/[A-Z]/.test(firstChar)) prefix = firstChar;  // 偵測到英文字母則自動換段
        }

        if (i === 0) {
            lastPrefix = prefix; currentParaChar = prefix;
        } else if (prefix !== lastPrefix) {
            lastPrefix = prefix; currentParaChar = prefix; currentSentNum = 1;
        }

        const label = `${currentParaChar}${String(currentSentNum).padStart(2, '0')}`;
        currentSentNum++;

        // 儲存資料
        newAllLabels.push(label);
        newSentenceTextMap[label] = name;
        newTimeDataMap[label] = { start: parseFloat(startSec.toFixed(3)), end: parseFloat(endSec.toFixed(3)) };

        // 推進游標並加上靜音緩衝
        currentOffset += buf.length;
        if (i < decodedBuffers.length - 1) currentOffset += paddingFrames;
    }

    showToast('音軌合併完成，準備轉出 WAV 格式...', 'success');
    
    // 使用現成的轉換工具
    const wavBlob = audioBufferToWav(mergedBuffer);

    return { 
        blob: wavBlob, 
        labels: newAllLabels, 
        texts: newSentenceTextMap, 
        times: newTimeDataMap 
    };
};

// 本地端 WebAssembly Whisper AI 引擎

async function resampleAudioTo16kHz(audioBuffer) {
    const targetSampleRate = 16000;
    const offlineCtx = new (window.OfflineAudioContext || window.webkitOfflineAudioContext)(
        1, audioBuffer.duration * targetSampleRate, targetSampleRate
    );
    const source = offlineCtx.createBufferSource();
    source.buffer = audioBuffer;
    source.connect(offlineCtx.destination);
    source.start(0);
    const renderedBuffer = await offlineCtx.startRendering();
    return renderedBuffer.getChannelData(0); 
}

// Whisper Worker 生命週期管理（共用）：一鍵全自動與批次填詞共用 worker 建立、
// 按鈕鎖定/還原與 loading/processing/error 處理，各自專屬的訊息交給呼叫端
function runWhisperWorker(btnEl, originalBtnHtml, postPayload, transferList, handlers) {
    btnEl.style.pointerEvents = 'none';

    const worker = new Worker('7_worker_whisper.js', { type: 'module' });
    const restoreBtn = () => {
        btnEl.innerHTML = originalBtnHtml;
        btnEl.style.pointerEvents = 'auto';
    };

    worker.onmessage = function(e) {
        const data = e.data;

        if (data.status === 'loading') {
            const percent = data.percent || 0;
            btnEl.innerHTML = `<span class="material-icons rotating">cloud_download</span> ${handlers.loadingLabel || '下載 AI 模型'} ${percent}%`;
            return;
        }
        if (data.status === 'processing') {
            btnEl.innerHTML = `<span class="material-icons rotating">sync</span> ${handlers.processingLabel || '辨識中...'}`;
            if (data.message) showToast(data.message, 'normal');
            return;
        }
        if (data.status === 'error') {
            showToast('AI 處理失敗，請查看控制台', 'error');
            console.error(data.message);
            restoreBtn();
            worker.terminate();
            return;
        }
        // 其餘狀態（complete 等）由呼叫端各自處理
        handlers.onMessage(data, { worker, restoreBtn });
    };

    worker.postMessage(postPayload, transferList);
    return worker;
}

const localAiSubtitleBtn = document.getElementById('localAiSubtitleBtn');

localAiSubtitleBtn?.addEventListener('click', async () => {
    if (!wavesurfer || !wavesurfer.getDecodedData()) {
        return showToast('請先載入音檔並等待分析完成', 'error');
    }

    if (allLabelsOrdered.length > 0) {
        showCustomDialog({
            title: '執行全自動 AI 字幕',
            message: '此操作將呼叫本地端 AI 進行全自動聽打與時間標記。<br>初次使用將自動下載模型(約150MB)。<br><strong style="color:#C62828;">此動作將會清空並覆蓋您目前的進度。</strong><br><br>確定繼續嗎？',
            onConfirm: () => startLocalAiTranscription()
        });
    } else {
        startLocalAiTranscription();
    }
});

async function startLocalAiTranscription() {
    const audioBuffer = wavesurfer.getDecodedData();
    const originalBtnHtml = localAiSubtitleBtn.innerHTML;  // 記住按鈕原本的長相
    
    // UI 狀態：鎖定按鈕避免重複點擊
    localAiSubtitleBtn.style.pointerEvents = 'none';
    localAiSubtitleBtn.innerHTML = `<span class="material-icons rotating">hourglass_empty</span> 準備音訊中...`;
    
    let audio16kHzData;
    try {
        audio16kHzData = await resampleAudioTo16kHz(audioBuffer);
    } catch (err) {
        localAiSubtitleBtn.innerHTML = originalBtnHtml;
        localAiSubtitleBtn.style.pointerEvents = 'auto';
        return showToast('音訊格式轉換失敗', 'error');
    }

    runWhisperWorker(
        localAiSubtitleBtn,
        originalBtnHtml,
        { type: 'transcribe', audioData: audio16kHzData, language: 'chinese' },
        [audio16kHzData.buffer],
        {
            loadingLabel: '下載 AI 模型',
            processingLabel: '正在聽打與標記...',
            onMessage: (data, { worker, restoreBtn }) => {
                if (data.status !== 'complete') return;
                const chunks = data.result;

                if (!chunks || chunks.length === 0) {
                    showToast('AI 聽不到任何內容', 'error');
                    restoreBtn();
                    worker.terminate();
                    return;
                }

                if (typeof saveState === 'function') saveState();

                // 匯入資料邏輯
                allLabelsOrdered = []; sentenceTextMap = {}; timeDataMap = {};
                chunks.forEach((chunk, index) => {
                    const startTime = chunk.timestamp[0];
                    let endTime = chunk.timestamp[1];
                    if (endTime === null || endTime === undefined) endTime = audioPlayer.duration;

                    const group = Math.floor(index / 99);
                    const num = (index % 99) + 1;
                    const prefix = String.fromCharCode(65 + group);
                    const label = `${prefix}${num.toString().padStart(2, '0')}`;

                    allLabelsOrdered.push(label);
                    // 以 setLang 寫入第一語言（index 0），與批次填詞資料格式一致
                    sentenceTextMap[label] = (typeof setLang === 'function') ? setLang('', 0, chunk.text.trim()) : chunk.text.trim();
                    timeDataMap[label] = { start: parseFloat(startTime.toFixed(3)), end: parseFloat(endTime.toFixed(3)) };
                });

                saveToStorage();
                if (typeof renderSentenceList === 'function') renderSentenceList();
                if (typeof updateAllTimeDisplays === 'function') updateAllTimeDisplays();
                if (typeof isScriptMode !== 'undefined' && isScriptMode && typeof populateScriptEditor === 'function') {
                    populateScriptEditor();
                }

                showToast(`一鍵 AI 字幕完成！共生成 ${chunks.length} 句。`, 'success');
                restoreBtn();
                worker.terminate();
            }
        }
    );
}

// AI 批次填詞 (保留標記，僅轉文字)
const localAiTranscribeBtn = document.getElementById('localAiTranscribeBtn');

localAiTranscribeBtn?.addEventListener('click', async () => {
    if (!wavesurfer || !wavesurfer.getDecodedData()) {
        return showToast('請先載入音檔並等待分析完成', 'error');
    }

    // 1. 篩選出目前「有時間標記」的句子
    const labelsWithTime = allLabelsOrdered.filter(label => timeDataMap[label] !== undefined);
    if (labelsWithTime.length === 0) {
        return showToast('目前沒有任何時間標記，請先進行斷句或標記', 'error');
    }

    // 2. 篩選出「沒有文字」的句子
    let targetLabels = labelsWithTime.filter(label => !(sentenceTextMap[label] || '').trim());

    if (targetLabels.length === 0) {
        // 如果全部都有文字了，詢問是否要覆寫全部
        showCustomDialog({
            title: '覆寫文字確認',
            message: '目前所有的標記都已經有文字了。<br>您要使用 AI 重新聽打並<strong style="color:#C62828;">覆寫所有句子的文字</strong>嗎？<br>(不會更改您的時間標記)',
            onConfirm: () => startLocalAiBatchTranscribe(labelsWithTime)
        });
    } else {
        // 正常狀態：幫空白的標記填入文字
        showCustomDialog({
            title: 'AI 批次填詞',
            message: `將使用本地端 AI 為 <strong style="color:#1976D2;">${targetLabels.length}</strong> 個空白標記填入文字。<br>系統將保留您原本精準的時間斷點。<br><br>確定繼續嗎？`,
            onConfirm: () => startLocalAiBatchTranscribe(targetLabels)
        });
    }
});

async function startLocalAiBatchTranscribe(targetLabels) {
    const audioBuffer = wavesurfer.getDecodedData();
    const originalBtnHtml = localAiTranscribeBtn.innerHTML;

    // 鎖定 UI 狀態
    localAiTranscribeBtn.style.pointerEvents = 'none';
    localAiTranscribeBtn.innerHTML = `<span class="material-icons rotating">hourglass_empty</span> 準備音訊中...`;

    // 重採樣為 16kHz
    let audio16kHzData;
    try {
        audio16kHzData = await resampleAudioTo16kHz(audioBuffer);
    } catch (err) {
        localAiTranscribeBtn.innerHTML = originalBtnHtml;
        localAiTranscribeBtn.style.pointerEvents = 'auto';
        return showToast('音訊格式轉換失敗', 'error');
    }

    // 語言轉換設定
    const langSelect = document.getElementById('transcribeLangSelect');
    const langCode = langSelect ? langSelect.value : (localStorage.getItem('tagger_aiLanguage') || 'zh-TW');

    let modelLang = 'chinese';
    if (langCode.includes('en')) modelLang = 'english';
    if (langCode.includes('ja')) modelLang = 'japanese';

    // 打包時間資料給 Worker
    const segmentsData = targetLabels.map(label => {
        const times = getCalculatedTimes(label);
        return { label: label, start: times.start, end: times.end };
    });

    if (typeof saveState === 'function') saveState();  // 紀錄狀態以便 Undo

    runWhisperWorker(
        localAiTranscribeBtn,
        originalBtnHtml,
        { type: 'transcribe_batch', audioData: audio16kHzData, language: modelLang, segments: segmentsData },
        [audio16kHzData.buffer],
        {
            loadingLabel: '模型',
            processingLabel: '辨識中...',
            onMessage: (data, { worker, restoreBtn }) => {
                if (data.status === 'progress_batch') {
                    // 即時動態回饋：更新單一句子的文字並捲動畫面
                    localAiTranscribeBtn.innerHTML = `<span class="material-icons rotating">sync</span> 辨識 ${data.current}/${data.total}`;

                    const label = data.label;
                    const text = data.text;
                    // 只用 setLang 替換第一語言（index 0），避免覆蓋既有的其他語言
                    const prevFullText = sentenceTextMap[label] || '';
                    const newFullText = (typeof setLang === 'function') ? setLang(prevFullText, 0, text) : text;
                    sentenceTextMap[label] = newFullText;  // 寫入資料

                    // 即時更新畫面上的文字框：依目前「檢視模式」顯示對應的內容
                    const itemDiv = document.getElementById(`item-${label}`);
                    if (itemDiv) {
                        const textDisplay = itemDiv.querySelector('.sentence-text-display');
                        const curLangViewIndex = (typeof getCurrentLangViewIndex === 'function') ? getCurrentLangViewIndex() : null;
                        const shownText = (curLangViewIndex !== null && typeof getLang === 'function') ? getLang(newFullText, curLangViewIndex) : newFullText;
                        if (typeof isLangTableView === 'function' && isLangTableView()) {
                            // 並排表格檢視 → 逐格更新（不能把整串原始文字塞進第一格）
                            itemDiv.querySelectorAll('.sentence-text-display[data-lang-idx]').forEach(cell => {
                                const seg = getLang(newFullText, parseInt(cell.dataset.langIdx, 10));
                                cell.textContent = seg;
                                cell.classList.toggle('is-empty-cell', seg.trim() === '');
                            });
                        } else if (textDisplay) textDisplay.textContent = shownText;
                        itemDiv.dataset.rawText = newFullText;

                        const deleteBtn = Array.from(itemDiv.querySelectorAll('button')).find(btn => btn.textContent.includes('刪除'));
                        if (deleteBtn) {
                            deleteBtn.remove();
                        }

                        // 畫面智慧捲動跟隨
                        if (currentSortMode === 'default' && typeof smartScrollTo === 'function') {
                            smartScrollTo(itemDiv);
                        }
                    }

                    saveToStorage();

                    // 如果在大編輯框模式，同步更新
                    if (typeof isScriptMode !== 'undefined' && isScriptMode && typeof populateScriptEditor === 'function') {
                        populateScriptEditor();
                    }
                }
                else if (data.status === 'progress_batch_error') {
                    // 單句辨識失敗，提示使用者但不中斷整批（其餘句子繼續處理）
                    showToast(`第 ${data.current}/${data.total} 句（${data.label}）辨識失敗，已略過`, 'error');
                    localAiTranscribeBtn.innerHTML = `<span class="material-icons rotating">sync</span> 辨識 ${data.current}/${data.total}`;
                }
                else if (data.status === 'complete_batch') {
                    showToast(`AI 批次填詞完成！共填入 ${segmentsData.length} 句。`, 'success');
                    restoreBtn();
                    if (typeof renderSentenceList === 'function') renderSentenceList();
                    worker.terminate();
                }
            }
        }
    );
}

// 智慧等長分割：在目標長度前後的搜尋範圍內，找「最長的靜音」的正中間當分割點
// 以 10ms 一格算 RMS，依底噪與說話音量自動訂出靜音門檻，找不到時逐步放寬，最後退回音量最小的一格
// 人聲強化啟用時沿用分析用音訊；回傳 [] 時呼叫端退回一般等長分割
function buildSmartTimeSegments(startTime, endTime, fixedLength, windowSec) {
    const decoded = (typeof wavesurfer !== 'undefined' && wavesurfer) ? wavesurfer.getDecodedData() : null;
    if (!decoded) return [];
    const buffer = (window.VocalEnhance ? VocalEnhance.getAnalysisBuffer(decoded) : decoded);
    const sr = buffer.sampleRate, len = buffer.length;
    const mediaDuration = audioPlayer.duration || buffer.duration;
    const timeRatio = mediaDuration / buffer.duration;  // media time / buffer time（與靜音斷句相同的換算）
    const channels = [];
    for (let c = 0; c < buffer.numberOfChannels; c++) channels.push(buffer.getChannelData(c));

    const FRAME = 0.01;  // 10ms 一格
    const frameLen = Math.max(1, Math.round(sr * FRAME));
    const MARGIN = 2;  // 處理範圍前後多算 2 秒，讓跨越邊界的長靜音也能量到完整長度
    const EDGE_PAD = 0.15;  // 分割點至少離語音邊緣 0.15 秒（靜音太短時取正中間）
    const MIN_RUN = 0.08;  // 短於 80ms 的低音量不當成「停頓」（多半是字中間的氣音／爆破音）
    const RATIOS = [0.10, 0.18, 0.30, 0.50];  // 靜音門檻 = 底噪 + 比例 × (說話音量 − 底噪)，由嚴格到寬鬆

    // ---------- 1) 整個處理範圍一次算好每格音量 ----------
    const baseFrame = Math.max(0, Math.floor(((startTime - MARGIN) / timeRatio) * sr / frameLen));
    const endFrame = Math.min(Math.floor(len / frameLen), Math.ceil(((endTime + MARGIN) / timeRatio) * sr / frameLen));
    const n = endFrame - baseFrame;
    if (n < 10) return [];
    const energy = new Float32Array(n);
    for (let k = 0; k < n; k++) {
        const s = (baseFrame + k) * frameLen;
        const e = Math.min(len, s + frameLen);
        let sum = 0, cnt = 0;
        for (let c = 0; c < channels.length; c++) {
            const d = channels[c];
            for (let i = s; i < e; i += 2) { sum += d[i] * d[i]; cnt++; }
        }
        energy[k] = cnt ? Math.sqrt(sum / cnt) : 0;
    }
    // 輕微平滑（前後各 1 格），避免單一格雜訊把一段靜音切成兩半
    const sm = new Float32Array(n);
    for (let k = 0; k < n; k++) {
        const a = Math.max(0, k - 1), b = Math.min(n - 1, k + 1);
        let sum = 0; for (let j = a; j <= b; j++) sum += energy[j];
        sm[k] = sum / (b - a + 1);
    }

    const frameToTime = f => (((baseFrame + f) * frameLen) / sr) * timeRatio;  // 第 f 格的起點（media time）
    const timeToFrame = t => Math.floor(((t / timeRatio) * sr) / frameLen) - baseFrame;

    // ---------- 2) 估計底噪與說話音量（只看實際要處理的範圍） ----------
    const fs = Math.max(0, timeToFrame(startTime)), fe = Math.min(n, timeToFrame(endTime));
    if (fe - fs < 10) return [];
    const sorted = Array.from(sm.subarray(fs, fe)).sort((a, b) => a - b);
    const floorE = sorted[Math.floor(sorted.length * 0.05)];
    const speechE = sorted[Math.floor(sorted.length * 0.90)];
    if (speechE < 1e-5 || speechE - floorE < 1e-6) return [];  // 幾乎全靜音或音量沒有起伏：沒有比較基準，退回一般等長分割

    // ---------- 3) 在 [from, to]（media time）內找「最長的靜音」，回傳其中點 ----------
    function findQuietPoint(from, to, target) {
        const f0 = Math.max(0, timeToFrame(from)), f1 = Math.min(n - 1, timeToFrame(to));
        if (f1 - f0 < 3) return target;
        const halfWin = Math.max(0.001, (to - from) / 2);

        for (const ratio of RATIOS) {
            const thr = floorE + ratio * (speechE - floorE);
            let best = null;
            let k = f0;
            while (k <= f1) {
                if (sm[k] >= thr) { k++; continue; }
                // 找到靜音，往左右延伸到完整長度（可超出搜尋範圍）
                let a = k; while (a > 0 && sm[a - 1] < thr) a--;
                let b = k; while (b < n - 1 && sm[b + 1] < thr) b++;
                const runLen = (b - a + 1) * FRAME;
                if (runLen >= MIN_RUN) {
                    // 分割點取整段靜音的正中間；若超出搜尋範圍，取範圍內離中點最近且距語音至少 EDGE_PAD 的位置
                    const runStart = frameToTime(a), runEnd = frameToTime(b + 1);
                    const pad = Math.min(EDGE_PAD, (runEnd - runStart) / 2);
                    const lo2 = Math.max(from, runStart + pad), hi2 = Math.min(to, runEnd - pad);
                    let mid;
                    if (lo2 <= hi2) {
                        mid = Math.min(hi2, Math.max(lo2, (runStart + runEnd) / 2));
                    } else {
                        const ca = Math.max(a, f0), cb = Math.min(b, f1);
                        mid = (frameToTime(ca) + frameToTime(cb + 1)) / 2;
                    }
                    const dist = Math.min(1, Math.abs(mid - target) / halfWin);
                    const score = runLen * (1 - 0.3 * dist);  // 以靜音長度為主，離目標越遠最多打 7 折
                    if (!best || score > best.score) best = { score, mid };
                }
                k = b + 1;
            }
            if (best) return best.mid;
        }

        // 都沒有明確靜音：退回「音量最小的一格」（略偏向目標附近）
        let bestK = -1, bestScore = Infinity;
        for (let k = f0; k <= f1; k++) {
            const t = frameToTime(k) + FRAME / 2 * timeRatio;
            const score = sm[k] / speechE + 0.1 * Math.min(1, Math.abs(t - target) / halfWin);
            if (score < bestScore) { bestScore = score; bestK = k; }
        }
        return bestK < 0 ? target : frameToTime(bestK) + (FRAME / 2) * timeRatio;
    }

    // ---------- 4) 逐段往前推進（與原本相同） ----------
    const segments = [];
    const minTail = fixedLength * 0.25;  // 結尾剩餘不到 25% 時，併入最後一段，避免出現極短的尾巴
    let cursor = startTime;
    while (cursor < endTime - 1e-6) {
        const target = cursor + fixedLength;
        if (target >= endTime - minTail) { segments.push({ start: cursor, end: endTime }); break; }

        const lo = Math.max(cursor + fixedLength * 0.5, target - windowSec);
        const hi = Math.min(endTime - Math.min(minTail, 1), target + windowSec);
        let cut = (hi > lo) ? findQuietPoint(lo, hi, target) : target;
        if (!(cut > cursor + 0.1)) cut = target;  // 保險：不允許產生零長度或倒退的段落

        segments.push({ start: cursor, end: cut });
        cursor = cut;
    }
    return segments;
}

// 引擎 C：等長無縫自動斷句引擎 (支援全域與局部)
window.performTimeSegmentation = async function(targetRange) {
    if (!audioPlayer || !audioPlayer.duration) return showToast('無法取得音檔長度，請先載入音檔', 'error');

    // 讀取「分」與「秒」的值，並換算為總秒數
    const minutes = parseFloat(document.getElementById('asFixedTimeMinutes').value) || 0;
    const seconds = parseFloat(document.getElementById('asFixedTimeSeconds').value) || 0;
    const fixedLength = (minutes * 60) + seconds;

    // 防呆檢查：如果輸入的時間為 0 或負數，阻擋執行
    if (fixedLength <= 0) return showToast('請設定有效的標記長度', 'error');

    const mediaDuration = audioPlayer.duration;

    let segments = [];
    let startTime = targetRange ? targetRange.start : 0;
    let endTime = targetRange ? targetRange.end : mediaDuration;

    // 勾選「智慧等長分割」時由 buildSmartTimeSegments() 找安靜處分割；否則（或分析失敗）走固定間隔演算法
    if (document.getElementById('asSmartTimeCheck')?.checked) {
        const rawWin = parseFloat(document.getElementById('asSmartWindow')?.value) || 2;
        const windowSec = Math.min(rawWin, fixedLength * 0.4);  // 尋找範圍最多不超過目標長度的 40%，避免段落長短差太多
        segments = buildSmartTimeSegments(startTime, endTime, fixedLength, windowSec);
    }

    // 核心演算法：無縫切割，每段結尾等於下一段開頭
    if (segments.length === 0) {
        for (let t = startTime; t < endTime; t += fixedLength) {
            segments.push({ start: t, end: Math.min(t + fixedLength, endTime) });
        }
    }

    if (segments.length === 0) return showToast('範圍太小，無法進行切割', 'error');

    if (targetRange) {
        // 局部範圍：套用到現有標籤
        // 依設定「斷句時新增列表」決定處理方式（與局部靜音斷句一致，預設：新增列表）
        const addRowMode = (typeof isAddRowEnabled !== 'function') || isAddRowEnabled('segment');

        // 列表完全沒有句子時，先建立空白句子列來承接（新增列表模式下由 addRowsForTimes() 負責，不需預先建立）
        const didCreateNewLabels = addRowMode ? false : createBlankLabelsIfListEmpty(segments.length);

        let labelsToUse = [...(targetRange.labelsToClear || [])];
        if (!addRowMode && labelsToUse.length < segments.length) {
            const unmapped = allLabelsOrdered.filter(lbl => !timeDataMap[lbl] && !labelsToUse.includes(lbl));
            labelsToUse = labelsToUse.concat(unmapped);
        }

        let mappedCount = 0;
        const extraTimes = [];  // 沒有現成的列可放的段落
        segments.forEach((seg, idx) => {
            if (idx < labelsToUse.length) {
                const label = labelsToUse[idx];
                timeDataMap[label] = { start: parseFloat(seg.start.toFixed(3)), end: parseFloat(seg.end.toFixed(3)) };
                mappedCount++;
            } else if (addRowMode) {
                extraTimes.push({ start: seg.start, end: seg.end });
            }
        });

        // 新增列表模式 —— 多出來的段落各新增一列
        const addedRowCount = extraTimes.length;
        if (addedRowCount > 0) {
            addRowsForTimes(extraTimes);
            mappedCount += addedRowCount;
        }
        
        saveToStorage();
        if (didCreateNewLabels && typeof renderSentenceList === 'function') renderSentenceList();
        if (typeof updateAllTimeDisplays === 'function') updateAllTimeDisplays();
        if (typeof renderAllRegions === 'function') renderAllRegions();
        if (typeof tempRegion !== 'undefined' && tempRegion) { tempRegion.remove(); tempRegion = null; }
        currentActiveLabel = null;  // 清掉舊的焦點標記
        if (typeof clearSelection === 'function') clearSelection();  // 取消選取全部
        if (typeof updateToolbarButtons === 'function') updateToolbarButtons();
        
        if (mappedCount < segments.length) {
            showToast(`局部等長斷句完成！但句子不夠，僅套用了 ${mappedCount} 句`, 'normal');
        } else {
            showToast(`局部等長斷句完成！共套用 ${mappedCount} 句${addedRowCount > 0 ? `（新增 ${addedRowCount} 列）` : ''}`, 'success');
        }

    } else {
        // 全域模式：洗掉重來
        allLabelsOrdered = []; sentenceTextMap = {}; timeDataMap = {};
        segments.forEach((seg, idx) => {
            const group = Math.floor(idx / 99);
            const num = (idx % 99) + 1;
            const prefix = String.fromCharCode(65 + group);
            const label = `${prefix}${num.toString().padStart(2, '0')}`;
            allLabelsOrdered.push(label);
            sentenceTextMap[label] = '';
            timeDataMap[label] = { start: parseFloat(seg.start.toFixed(3)), end: parseFloat(seg.end.toFixed(3)) };
        });

        saveToStorage();
        if (typeof renderSentenceList === 'function') renderSentenceList();
        if (typeof updateAllTimeDisplays === 'function') updateAllTimeDisplays();
        if (typeof renderAllRegions === 'function') renderAllRegions();  // 全域模式也要重繪聲波標記（與靜音斷句一致）
        if (typeof tempRegion !== 'undefined' && tempRegion) { tempRegion.remove(); tempRegion = null; }  // 移除暫存選取區
        currentActiveLabel = null;  // 清掉舊的焦點標記
        if (typeof clearSelection === 'function') clearSelection();  // 取消選取全部（clearSelection 內會一併更新畫面）
        if (typeof updateToolbarButtons === 'function') updateToolbarButtons();  // 更新工具列按鈕狀態
        showToast(`全域等長斷句完成！共無縫切出 ${segments.length} 句`, 'success');
    }
};