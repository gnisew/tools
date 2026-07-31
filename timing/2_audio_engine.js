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

// ================= 自動靜音斷句核心引擎 =================

// ================= 非同步高效能自動靜音斷句引擎 =================

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
    
    const step = Math.floor(sampleRate / 100); // 精度 10 毫秒
    
    let segments = [];
    let isSilence = true;
    let silenceStart = 0;
    let segmentStart = -1;

    showToast('正在分析音訊，請稍候... 0%', 'normal');

    // 迴圈改為 async，並利用分段讓出執行緒以防畫面卡死
    for (let i = 0; i < length; i += step) {
        let maxAmp = 0;
        
        for (let j = 0; j < step && (i + j) < length; j++) {
            let localMax = 0;
            for (let c = 0; c < numChannels; c++) {
                const amp = Math.abs(channels[c][i + j]);
                if (amp > localMax) localMax = amp;
            }
            if (localMax > maxAmp) maxAmp = localMax;
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

        // 效能優化：每處理 5 秒鐘的音訊，就讓出主執行緒一次，顯示進度並保持畫面流暢
        if (i % (sampleRate * 5) === 0) {
            const percent = Math.round((i / length) * 100);
            showToast(`正在分析音訊，請稍候... ${percent}%`, 'normal');
            await new Promise(resolve => setTimeout(resolve, 0));
        }
    }

    if (segmentStart !== -1) {
        const finalEnd = isSilence ? silenceStart : mediaDuration;
        if (finalEnd - segmentStart >= minSegment) {
            segments.push({ start: segmentStart, end: finalEnd });
        }
    }

    if (segments.length === 0) {
        return showToast('找不到符合條件的斷句，請調高門檻或縮短時長', 'error');
    }

    if (allLabelsOrdered.length === 0) {
        for (let i = 0; i < segments.length; i++) {
            const group = Math.floor(i / 99);
            const num = (i % 99) + 1;
            const prefix = String.fromCharCode(65 + group);
            const label = `${prefix}${num.toString().padStart(2, '0')}`;
            allLabelsOrdered.push(label);
            sentenceTextMap[label] = '';
        }
        if (typeof renderSentenceList === 'function') renderSentenceList(); 
    }

    timeDataMap = {};
    let segIndex = 0;
    
    for (let i = 0; i < allLabelsOrdered.length; i++) {
        if (segIndex >= segments.length) break;
        
        const label = allLabelsOrdered[i];
        let s = segments[segIndex].start - padding;
        let e = segments[segIndex].end + padding;
        
        s = Math.max(0, s);
        e = Math.min(mediaDuration, e);
        
        timeDataMap[label] = { 
            start: parseFloat(s.toFixed(3)), 
            end: parseFloat(e.toFixed(3)) 
        };
        segIndex++;
    }

    saveToStorage();
    if (typeof updateAllTimeDisplays === 'function') updateAllTimeDisplays();
    
    if (segIndex < segments.length && sentenceTextMap[allLabelsOrdered[0]] !== '') {
        showToast(`自動斷句完成！共精準標記 ${segIndex} 句`, 'success');
    } else {
        showToast(`自動斷句完成！共精準標記 ${segIndex} 句`, 'success');
    }
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
