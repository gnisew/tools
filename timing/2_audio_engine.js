function sliceAudioBuffer(buffer, startTime, endTime) {
    const sampleRate = buffer.sampleRate;
    const channels = buffer.numberOfChannels;
    const startSample = Math.max(0, Math.floor(startTime * sampleRate));
    const endSample = Math.min(buffer.length, Math.floor(endTime * sampleRate));
    const frameCount = endSample - startSample;

    const offlineCtx = new (window.OfflineAudioContext || window.webkitOfflineAudioContext)(channels, frameCount, sampleRate);
    const newBuffer = offlineCtx.createBuffer(channels, frameCount, sampleRate);

    for (let i = 0; i < channels; i++) {
        const channelData = buffer.getChannelData(i);
        const newChannelData = newBuffer.getChannelData(i);
        for (let j = 0; j < frameCount; j++) {
            newChannelData[j] = channelData[startSample + j];
        }
    }
    return newBuffer;
}

function audioBufferToWav(buffer) {
    const numOfChan = buffer.numberOfChannels;
    const sampleRate = buffer.sampleRate;
    const length = buffer.length * numOfChan * 2 + 44; 
    const bufferArray = new ArrayBuffer(length);
    const view = new DataView(bufferArray);
    let pos = 0;

    function setUint16(data) { view.setUint16(pos, data, true); pos += 2; }
    function setUint32(data) { view.setUint32(pos, data, true); pos += 4; }

    setUint32(0x46464952); setUint32(length - 8); setUint32(0x45564157); 
    setUint32(0x20746d66); setUint32(16); setUint16(1); setUint16(numOfChan);
    setUint32(sampleRate); setUint32(sampleRate * 2 * numOfChan); 
    setUint16(numOfChan * 2); setUint16(16); 
    setUint32(0x61746164); setUint32(length - pos - 4); 

    const channels = [];
    for (let i = 0; i < numOfChan; i++) channels.push(buffer.getChannelData(i));
    
    let offset = 0;
    while (pos < length) {
        for (let i = 0; i < numOfChan; i++) {
            let sample = Math.max(-1, Math.min(1, channels[i][offset]));
            sample = (sample < 0 ? sample * 0x8000 : sample * 0x7FFF) | 0;
            view.setInt16(pos, sample, true);
            pos += 2;
        }
        offset++;
    }
    return new Blob([bufferArray], { type: 'audio/wav' });
}

function audioBufferToMp3(buffer) {
    if (!window.lamejs) {
        alert("無法載入 MP3 轉換套件，將降級為 WAV 格式。");
        return audioBufferToWav(buffer);
    }
    const sampleRate = buffer.sampleRate;
    const mp3encoder = new lamejs.Mp3Encoder(1, sampleRate, 128); 
    const mp3Data = [];

    const left = buffer.getChannelData(0);
    const right = buffer.numberOfChannels > 1 ? buffer.getChannelData(1) : left;
    const sampleChunk = 1152; 
    
    let i = 0;
    while (i < left.length) {
        let chunkLength = Math.min(sampleChunk, left.length - i);
        let int16Chunk = new Int16Array(chunkLength);
        for(let j=0; j < chunkLength; j++) {
            let s = (left[i+j] + right[i+j]) / 2;
            s = Math.max(-1, Math.min(1, s)); 
            int16Chunk[j] = s < 0 ? s * 0x8000 : s * 0x7FFF;
        }
        const mp3buf = mp3encoder.encodeBuffer(int16Chunk);
        if (mp3buf.length > 0) mp3Data.push(mp3buf);
        i += sampleChunk;
    }
    const mp3buf = mp3encoder.flush();
    if (mp3buf.length > 0) mp3Data.push(mp3buf);
    return new Blob(mp3Data, {type: 'audio/mp3'});
}

window.downloadSingleAudio = function(label) {
    if (!wavesurfer || !wavesurfer.getDecodedData()) return showToast('請先載入音檔並等待分析完成', 'error');
    const times = getCalculatedTimes(label);
    if (!times) return showToast('此句尚未標記時間', 'error');
    showToast('正在轉碼音檔，請稍候...', 'success');
    
    setTimeout(() => {
        const buffer = wavesurfer.getDecodedData();
        const slicedBuffer = sliceAudioBuffer(buffer, times.start, times.end);
        const format = exportAudioFormatSelect.value;
        const ext = format === 'mp3' ? '.mp3' : '.wav';
        const finalBlob = format === 'mp3' ? audioBufferToMp3(slicedBuffer) : audioBufferToWav(slicedBuffer);
        
        const text = sentenceTextMap[label] || '';
        const safeText = sanitizeFilename(text).substring(0, 30); 
        const filename = `${label}${safeText ? '_' + safeText : ''}${ext}`;
        
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
        const slicedBuffer = sliceAudioBuffer(buffer, start, end);
        
        // 讀取側邊欄的格式設定 (MP3 或是 WAV)
        const format = exportAudioFormatSelect ? exportAudioFormatSelect.value : 'wav';
        const ext = format === 'mp3' ? '.mp3' : '.wav';
        const finalBlob = format === 'mp3' ? audioBufferToMp3(slicedBuffer) : audioBufferToWav(slicedBuffer);
        
        // 組合聰明的檔名
        let filename = `${filenamePrefix}_${formatTime(start).replace(':', '')}至${formatTime(end).replace(':', '')}${ext}`;
        if (filenamePrefix === "完整音檔") filename = `完整音檔備份${ext}`;
        
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
        
        labelsToExport.forEach(label => {
            const times = getCalculatedTimes(label);
            if (times) {
                const slicedBuffer = sliceAudioBuffer(buffer, times.start, times.end);
                const finalBlob = format === 'mp3' ? audioBufferToMp3(slicedBuffer) : audioBufferToWav(slicedBuffer);
                const text = sentenceTextMap[label] || '';
                const safeText = sanitizeFilename(text).substring(0, 30);
                const filename = `${label}${safeText ? '_' + safeText : ''}${ext}`;
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

// ================= 自動靜音斷句核心引擎 (動態切片與階段進度版) =================

// 【引擎 A】全域自動斷句引擎
async function performAutoSegmentation() {
    if (!wavesurfer || !wavesurfer.getDecodedData()) {
        return showToast('請先載入音檔並等待分析完成', 'error');
    }

    const buffer = wavesurfer.getDecodedData();
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
    
    const step = Math.floor(sampleRate / 100); 
    
    let segments = [];
    let isSilence = true;
    let silenceStart = 0;
    let segmentStart = -1;

    if (asConfirmBtn) asConfirmBtn.disabled = true;
    showToast('1/3 正在分析全域波形... 0%', 'normal');

    // ★ 動態時間切片：追蹤系統時間
    let lastYieldTime = Date.now();

    for (let i = 0; i < length; i += step) {
        let maxAmp = 0;
        const localEnd = Math.min(i + step, length);
        
        // 尋找最大振幅
        for (let j = i; j < localEnd; j++) {
            for (let c = 0; c < numChannels; c++) {
                const amp = Math.abs(channels[c][j]);
                if (amp > maxAmp) maxAmp = amp;
            }
        }

        const currentTime = (i / sampleRate) * timeRatio;

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

        // ★ 每經過 40 毫秒 (約 25fps)，強制瀏覽器更新畫面一次
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

    // ================= 階段 2：生成與分配標記資料 (85% ~ 95%) =================
    showToast('2/3 正在生成標記資料... 85%', 'normal');
    await new Promise(resolve => setTimeout(resolve, 10)); // 暫停一下讓 UI 更新

    if (allLabelsOrdered.length === 0) {
        for (let i = 0; i < segments.length; i++) {
            const group = Math.floor(i / 99);
            const num = (i % 99) + 1;
            const prefix = String.fromCharCode(65 + group);
            const label = `${prefix}${num.toString().padStart(2, '0')}`;
            allLabelsOrdered.push(label);
            sentenceTextMap[label] = '';
        }
    }

    timeDataMap = {};
    let segIndex = 0;
    
    for (let i = 0; i < allLabelsOrdered.length; i++) {
        if (segIndex >= segments.length) break;
        const label = allLabelsOrdered[i];
        let s = segments[segIndex].start - padding;
        let e = segments[segIndex].end + padding;
        
        timeDataMap[label] = { 
            start: parseFloat(Math.max(0, s).toFixed(3)), 
            end: parseFloat(Math.min(mediaDuration, e).toFixed(3)) 
        };
        segIndex++;
    }

    saveToStorage();

    // ================= 階段 3：畫面渲染 (95% ~ 100%) =================
    showToast('3/3 正在渲染畫面與波形... 95%', 'normal');
    await new Promise(resolve => setTimeout(resolve, 10));

    // 統一在最後渲染一次，徹底解決畫面凍結
    if (typeof renderSentenceList === 'function') renderSentenceList();
    if (typeof updateAllTimeDisplays === 'function') updateAllTimeDisplays();

    if (asConfirmBtn) asConfirmBtn.disabled = false;
    showToast(`自動斷句完成！共精準標記 ${segIndex} 句`, 'success');
}


// 【引擎 B】局部範圍自動斷句引擎
async function performRegionAutoSegmentation(startTime, endTime) {
    if (!wavesurfer || !wavesurfer.getDecodedData()) return showToast('請先載入音檔', 'error');

    const buffer = wavesurfer.getDecodedData();
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
    
    const step = Math.floor(sampleRate / 100); 
    
    let segments = [];
    let isSilence = true;
    let silenceStart = startTime;
    let segmentStart = -1;

    showToast('1/3 正在分析局部波形... 0%', 'normal');
    let lastYieldTime = Date.now();

    for (let i = startSample; i < endSample; i += step) {
        let maxAmp = 0;
        const localEnd = Math.min(i + step, endSample);
        for (let j = i; j < localEnd; j++) {
            for (let c = 0; c < numChannels; c++) {
                const amp = Math.abs(channels[c][j]);
                if (amp > maxAmp) maxAmp = amp;
            }
        }

        const currentTime = (i / sampleRate) * timeRatio;

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

    // ================= 階段 2：批次寫入資料 (85% ~ 95%) =================
    showToast('2/3 正在寫入與排版資料... 85%', 'normal');
    await new Promise(resolve => setTimeout(resolve, 10));

    if (typeof saveState === 'function') saveState(); 

    // ★ 核心優化：移除原本呼叫 N 次 insertRowChronologically 的災難級效能瓶頸
    // 改為一次性找到插入點，並批次推入陣列中
    let insertIndex = allLabelsOrdered.length;
    for (let i = 0; i < allLabelsOrdered.length; i++) {
        const lbl = allLabelsOrdered[i];
        if (timeDataMap[lbl]) {
            const lblStart = typeof timeDataMap[lbl] === 'object' ? timeDataMap[lbl].start : timeDataMap[lbl];
            if (lblStart > startTime) { insertIndex = i; break; }
        }
    }

    let prefix = 'A';
    if (insertIndex > 0) { 
        prefix = allLabelsOrdered[insertIndex - 1].charAt(0); 
    } else if (allLabelsOrdered.length > 0) { 
        prefix = allLabelsOrdered[0].charAt(0); 
    }

    segments.forEach((seg, idx) => {
        let s = Math.max(startTime, seg.start - padding);
        let e = Math.min(endTime, seg.end + padding);
        
        // 產生安全的暫存標籤
        const tempLabel = prefix + '_TEMP_AUTO_' + Date.now() + '_' + idx;
        
        allLabelsOrdered.splice(insertIndex + idx, 0, tempLabel);
        timeDataMap[tempLabel] = { start: parseFloat(s.toFixed(3)), end: parseFloat(e.toFixed(3)) };
        sentenceTextMap[tempLabel] = '';
    });

    // ================= 階段 3：畫面渲染 (95% ~ 100%) =================
    showToast('3/3 正在重新渲染畫面... 95%', 'normal');
    await new Promise(resolve => setTimeout(resolve, 10));

    // 呼叫重新排號 (內含 renderSentenceList)，僅執行「一次」DOM 繪製
    if (typeof reassignLabels === 'function') reassignLabels();
    
    if (tempRegion) { tempRegion.remove(); tempRegion = null; }
    if (typeof updateToolbarButtons === 'function') updateToolbarButtons();
    
    showToast(`局部斷句完成！共新增 ${segments.length} 句`, 'success');
}

// ================= 多重音訊處理引擎 (打包與合併) =================
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
        
        for (let i = 0; i < labels.length; i++) {
            const label = labels[i];
            const times = getCalculatedTimes(label);
            if (times) {
                const slicedBuffer = sliceAudioBuffer(buffer, times.start, times.end);
                const finalBlob = format === 'mp3' ? audioBufferToMp3(slicedBuffer) : audioBufferToWav(slicedBuffer);
                const text = sentenceTextMap[label] || '';
                const safeText = sanitizeFilename(text).substring(0, 30);
                const filename = `${label}${safeText ? '_' + safeText : ''}${ext}`;
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
                const slicedBuffer = sliceAudioBuffer(buffer, times.start, times.end);
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
                currentOffset += silenceFrames; // 留白，預設為 0 不填入資料即為靜音
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
        fileNames.push(file.name.replace(/\.[^/.]+$/, "")); // 移除副檔名作為文字
        const arrayBuffer = await file.arrayBuffer();
        const audioBuffer = await audioCtx.decodeAudioData(arrayBuffer);
        decodedBuffers.push(audioBuffer);
    }

    if (decodedBuffers.length === 0) throw new Error("沒有找到有效的音檔");

    // 3. 計算總畫布長度與統一取樣率 (以第一首為基準，通常是雙聲道 44100 或 48000)
    const sampleRate = decodedBuffers[0].sampleRate;
    const channels = 2; // 強制輸出雙聲道避免單/雙聲道混合出錯
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
            if (/[A-Z]/.test(firstChar)) prefix = firstChar; // 偵測到英文字母則自動換段
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


// ================= ★ 本地端 WebAssembly Whisper AI 引擎 ★ =================

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
    const originalBtnHtml = localAiSubtitleBtn.innerHTML; // 記住按鈕原本的長相
    
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

    // ★ 關鍵修復點：必須加上 { type: 'module' } 且檔名需完全對應
    const whisperWorker = new Worker('7_worker_whisper.js', { type: 'module' });

    whisperWorker.onmessage = function(e) {
        const data = e.data;
        
        if (data.status === 'loading') {
            // UI 動態更新：顯示下載進度
            const percent = data.percent || 0;
            localAiSubtitleBtn.innerHTML = `<span class="material-icons rotating">cloud_download</span> 下載 AI 模型 ${percent}%`;
            
        } else if (data.status === 'processing') {
            // UI 動態更新：下載完成，開始語音辨識
            localAiSubtitleBtn.innerHTML = `<span class="material-icons rotating">sync</span> 正在聽打與標記...`;
            showToast(data.message, 'normal');
            
        } else if (data.status === 'error') {
            showToast('AI 處理失敗，請查看控制台', 'error');
            console.error(data.message);
            // 恢復 UI 狀態
            localAiSubtitleBtn.innerHTML = originalBtnHtml;
            localAiSubtitleBtn.style.pointerEvents = 'auto';
            whisperWorker.terminate();
            
        } else if (data.status === 'complete') {
            const chunks = data.result; 
            
            if (!chunks || chunks.length === 0) {
                showToast('AI 聽不到任何內容', 'error');
                localAiSubtitleBtn.innerHTML = originalBtnHtml;
                localAiSubtitleBtn.style.pointerEvents = 'auto';
                whisperWorker.terminate(); return;
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
                sentenceTextMap[label] = chunk.text.trim();
                timeDataMap[label] = { start: parseFloat(startTime.toFixed(3)), end: parseFloat(endTime.toFixed(3)) };
            });

            saveToStorage();
            if (typeof renderSentenceList === 'function') renderSentenceList();
            if (typeof updateAllTimeDisplays === 'function') updateAllTimeDisplays();
            if (typeof isScriptMode !== 'undefined' && isScriptMode && typeof populateScriptEditor === 'function') {
                populateScriptEditor();
            }
            
            showToast(`一鍵 AI 字幕完成！共生成 ${chunks.length} 句。`, 'success');
            
            // 恢復 UI 狀態
            localAiSubtitleBtn.innerHTML = originalBtnHtml;
            localAiSubtitleBtn.style.pointerEvents = 'auto';
            whisperWorker.terminate(); 
        }
    };

    // 啟動 Worker
    whisperWorker.postMessage({ type: 'transcribe', audioData: audio16kHzData, language: 'chinese' });
}

// ================= ★ 新增：AI 批次填詞 (保留標記，僅轉文字) ★ =================
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

    const whisperWorker = new Worker('7_worker_whisper.js', { type: 'module' });
    
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

    whisperWorker.onmessage = function(e) {
        const data = e.data;

        if (data.status === 'loading') {
            const percent = data.percent || 0;
            localAiTranscribeBtn.innerHTML = `<span class="material-icons rotating">cloud_download</span> 模型 ${percent}%`;
        } 
        else if (data.status === 'processing') {
            localAiTranscribeBtn.innerHTML = `<span class="material-icons rotating">sync</span> 辨識中...`;
            showToast(data.message, 'normal');
        } 
        else if (data.status === 'progress_batch') {
            // 即時動態回饋：更新單一句子的文字並捲動畫面
            localAiTranscribeBtn.innerHTML = `<span class="material-icons rotating">sync</span> 辨識 ${data.current}/${data.total}`;
            
            const label = data.label;
            const text = data.text;
            sentenceTextMap[label] = text; // 寫入資料

            // 即時更新畫面上的文字框
            const itemDiv = document.getElementById(`item-${label}`);
            if (itemDiv) {
                const textDisplay = itemDiv.querySelector('.sentence-text-display');
                if (textDisplay) textDisplay.textContent = text;
                itemDiv.dataset.rawText = text;
                
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
        else if (data.status === 'error') {
            showToast('AI 處理失敗，請查看控制台', 'error');
            localAiTranscribeBtn.innerHTML = originalBtnHtml;
            localAiTranscribeBtn.style.pointerEvents = 'auto';
            whisperWorker.terminate();
        } 
        else if (data.status === 'complete_batch') {
            showToast(`AI 批次填詞完成！共填入 ${segmentsData.length} 句。`, 'success');
            localAiTranscribeBtn.innerHTML = originalBtnHtml;
            localAiTranscribeBtn.style.pointerEvents = 'auto';
            
            if (typeof renderSentenceList === 'function') renderSentenceList();
            
            whisperWorker.terminate();
        }
    };

    if (typeof saveState === 'function') saveState(); // 紀錄狀態以便 Undo

    // =====================================
    // 讀取 UI 設定的語言
    // =====================================

    if (langCode.includes('en')) modelLang = 'english';
    if (langCode.includes('ja')) modelLang = 'japanese';

    // 啟動 Worker
    whisperWorker.postMessage({ 
        type: 'transcribe', 
        audioData: audio16kHzData, 
        language: modelLang // 套用選擇的語言
    });
}
// =========================================================================

// ================= 【引擎 C】等長無縫自動斷句引擎 (支援全域與局部) =================
window.performTimeSegmentation = async function(targetRange) {
    if (!audioPlayer || !audioPlayer.duration) return showToast('無法取得音檔長度，請先載入音檔', 'error');

    // ★ 核心修復：讀取「分」與「秒」的值，並換算為總秒數
    const minutes = parseFloat(document.getElementById('asFixedTimeMinutes').value) || 0;
    const seconds = parseFloat(document.getElementById('asFixedTimeSeconds').value) || 0;
    const fixedLength = (minutes * 60) + seconds;

    // 防呆檢查：如果輸入的時間為 0 或負數，阻擋執行
    if (fixedLength <= 0) return showToast('請設定有效的標記長度', 'error');

    const mediaDuration = audioPlayer.duration;

    let segments = [];
    let startTime = targetRange ? targetRange.start : 0;
    let endTime = targetRange ? targetRange.end : mediaDuration;

    // 核心演算法：無縫切割，每段結尾等於下一段開頭
    for (let t = startTime; t < endTime; t += fixedLength) {
        segments.push({ start: t, end: Math.min(t + fixedLength, endTime) });
    }

    if (segments.length === 0) return showToast('範圍太小，無法進行切割', 'error');

    if (targetRange) {
        // ================= 局部範圍：插入新標籤 =================
        let insertIndex = allLabelsOrdered.length;
        for (let i = 0; i < allLabelsOrdered.length; i++) {
            const lbl = allLabelsOrdered[i];
            if (timeDataMap[lbl]) {
                const lblStart = typeof timeDataMap[lbl] === 'object' ? timeDataMap[lbl].start : timeDataMap[lbl];
                if (lblStart > startTime) { insertIndex = i; break; }
            }
        }

        let prefix = 'A';
        if (insertIndex > 0) prefix = allLabelsOrdered[insertIndex - 1].charAt(0);
        else if (allLabelsOrdered.length > 0) prefix = allLabelsOrdered[0].charAt(0);

        segments.forEach((seg, idx) => {
            const tempLabel = prefix + '_TEMP_TIME_' + Date.now() + '_' + idx;
            allLabelsOrdered.splice(insertIndex + idx, 0, tempLabel);
            timeDataMap[tempLabel] = { start: parseFloat(seg.start.toFixed(3)), end: parseFloat(seg.end.toFixed(3)) };
            sentenceTextMap[tempLabel] = '';
        });

        if (typeof reassignLabels === 'function') reassignLabels();
        if (typeof tempRegion !== 'undefined' && tempRegion) { tempRegion.remove(); tempRegion = null; }
        if (typeof updateToolbarButtons === 'function') updateToolbarButtons();
        showToast(`局部等長斷句完成！共無縫切出 ${segments.length} 句`, 'success');

    } else {
        // ================= 全域模式：洗掉重來 =================
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
        showToast(`全域等長斷句完成！共無縫切出 ${segments.length} 句`, 'success');
    }
};