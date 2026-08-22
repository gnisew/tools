// ================= ★ 核心升級：專業無損音訊處理引擎 ★ =================

// ================= ★ 核心升級：專業無損音訊處理引擎 ★ =================

// 安全地在記憶體中建立乾淨的音訊容器
function createBufferSafe(channels, length, sampleRate) {
    if (window.AudioBuffer) {
        try {
            return new AudioBuffer({ numberOfChannels: channels, length: length, sampleRate: sampleRate });
        } catch (e) {}
    }
    const offlineCtx = new (window.OfflineAudioContext || window.webkitOfflineAudioContext)(channels, length, sampleRate);
    return offlineCtx.createBuffer(channels, length, sampleRate);
}

// ================= ★ 核心修復：標準 16-bit PCM WAV 產生器 (100% 瀏覽器相容) ★ =================
function audioBufferToWav(buffer) {
    const numChannels = buffer.numberOfChannels;
    const sampleRate = buffer.sampleRate;
    const length = buffer.length;
    
    const format = 1; // 1 = PCM (標準 WAV，瀏覽器相容性最高)
    const bitDepth = 16; 
    const bytesPerSample = 2;
    const blockAlign = numChannels * bytesPerSample;
    const byteRate = sampleRate * blockAlign;
    const dataSize = length * blockAlign;
    
    const wavBuffer = new ArrayBuffer(44 + dataSize);
    const view = new DataView(wavBuffer);
    let pos = 0;

    // 嚴格推進 byte 指標，確保標頭絕不錯位
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
    writeString('RIFF');              // pos: 0 -> 4
    writeUint32(36 + dataSize);       // pos: 4 -> 8 (檔案總大小 - 8)
    writeString('WAVE');              // pos: 8 -> 12

    // 2. "fmt " sub-chunk
    writeString('fmt ');              // pos: 12 -> 16
    writeUint32(16);                  // pos: 16 -> 20 (PCM 標頭固定長度 16 bytes)
    writeUint16(format);              // pos: 20 -> 22 (1 = PCM)
    writeUint16(numChannels);         // pos: 22 -> 24
    writeUint32(sampleRate);          // pos: 24 -> 28
    writeUint32(byteRate);            // pos: 28 -> 32 (ByteRate = SampleRate * BlockAlign)
    writeUint16(blockAlign);          // pos: 32 -> 34 (BlockAlign = Channels * BytesPerSample)
    writeUint16(bitDepth);            // pos: 34 -> 36 (16 bits)

    // 3. "data" sub-chunk
    writeString('data');              // pos: 36 -> 40
    writeUint32(dataSize);            // pos: 40 -> 44

    // 4. 寫入 PCM 數據 (精確 16-bit 轉換與安全夾斷防爆音)
    for (let i = 0; i < length; i++) {
        for (let ch = 0; ch < numChannels; ch++) {
            let sample = buffer.getChannelData(ch)[i];
            // 防削波 (Clipping) 夾斷在 [-1.0, 1.0]
            sample = Math.max(-1, Math.min(1, sample));
            // 轉換為 16-bit 整數 (-32768 ~ 32767)
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

    const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
    const newBuffer = audioCtx.createBuffer(channels, newLength, sampleRate);
    for (let i = 0; i < channels; i++) {
        newBuffer.getChannelData(i).set(buffer.getChannelData(i).subarray(startSample, endSample));
    }
    return newBuffer;
}

function appendAudioBuffers(buf1, buf2) {
    const numChannels = Math.max(buf1.numberOfChannels, buf2.numberOfChannels);
    const sampleRate = buf1.sampleRate;
    const totalLength = buf1.length + buf2.length;
    
    const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
    const newBuffer = audioCtx.createBuffer(numChannels, totalLength, sampleRate);
    for (let i = 0; i < numChannels; i++) {
        const channelData = newBuffer.getChannelData(i);
        const data1 = buf1.numberOfChannels > i ? buf1.getChannelData(i) : buf1.getChannelData(0);
        const data2 = buf2.numberOfChannels > i ? buf2.getChannelData(i) : buf2.getChannelData(0);
        channelData.set(data1, 0);
        channelData.set(data2, buf1.length);
    }
    return newBuffer;
}

// ================= ★ MP3 轉換器保留區塊 ★ =================
function audioBufferToMp3(buffer) {
    if (!window.lamejs) {
        alert("無法載入 MP3 轉換套件，將降級為 WAV 格式。");
        return audioBufferToWav(buffer);
    }
    
    const channels = buffer.numberOfChannels;
    const sampleRate = buffer.sampleRate;
    const kbps = 320; 
    
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

// ================= ★ 剪裁引擎：純記憶體無損拼接 ★ =================
window.cutAudioRegion = async function(start, end) {
    if (!wavesurfer || !wavesurfer.getDecodedData()) return showToast('無有效音檔', 'error');
    const buffer = wavesurfer.getDecodedData();
    showToast('正在執行剪裁...', 'normal');
    
    const sampleRate = buffer.sampleRate;
    const numChannels = buffer.numberOfChannels;
    
    // ★ 核心修正：start/end 是「播放器時間」(media time，跟畫面上的秒數、標記時間一致)，
    // 但 buffer 是 WaveSurfer 內部解碼出來的「buffer 時間」(webAudioDuration)。
    // MP3 常因編碼延遲/填塞樣本，這兩者秒數會有些微落差；若直接拿 media time 乘上
    // sampleRate 去換算 buffer 裡的 sample 位置，剪到的樣本點會跟畫面上選取的範圍對不齊，
    // 且後面用來平移其他標記的 diff 也會跟著算錯，導致越剪標記越飄。
    // 這裡採用跟「自動靜音斷句」引擎完全相同的換算方式，確保兩邊時間基準一致。
    const webAudioDuration = buffer.duration;
    const mediaDuration = audioPlayer.duration || webAudioDuration;
    const timeRatio = mediaDuration / webAudioDuration; // media time / buffer time

    const bufferStart = start / timeRatio; // 還原成 buffer 時間，才能對應正確的 sample
    const bufferEnd = end / timeRatio;

    const startSample = Math.max(0, Math.floor(bufferStart * sampleRate));
    const endSample = Math.min(buffer.length, Math.floor(bufferEnd * sampleRate));
    const newLength = buffer.length - (endSample - startSample);
    
    const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
    const newBuffer = audioCtx.createBuffer(numChannels, newLength, sampleRate);
    
    for (let i = 0; i < numChannels; i++) {
        const oldData = buffer.getChannelData(i);
        const newData = newBuffer.getChannelData(i);
        newData.set(oldData.subarray(0, startSample), 0);
        newData.set(oldData.subarray(endSample), startSample);
    }
    
    const wavBlob = audioBufferToWav(newBuffer);
    
    // ★ 延後註銷：先記住舊網址，但不要馬上砍，等新音檔真正載入成功後再釋放，
    // 避免 WaveSurfer 內部還在非同步讀取舊網址時就被提前註銷，導致 fetch 失敗
    const oldSrc = audioPlayer.src;
    const newUrl = URL.createObjectURL(wavBlob);
    
    // 標記時間平移 (Ripple Edit)
    // ★ 核心修正：(endSample - startSample) / sampleRate 算出來的是「buffer 時間」的秒數差，
    // 但 timeDataMap 裡的標記時間是「media time」，兩者要用 timeRatio 換算成同一個基準，
    // 否則每剪一次，後面的標記就會多出一個小小的誤差，越剪越飄。
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
    
    audioPlayer.src = newUrl;
    audioPlayer.load(); // ★ 核心修正：強制立刻觸發載入，不要讓瀏覽器排程延後切換

    // ★ 延後註銷：等新音檔（newUrl）確定載入成功後，才安全釋放舊的 Blob 網址
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
    localStorage.setItem('tagger_isTrimmed', 'true'); // ★ 新增：標記音檔已被剪裁過
    localStorage.setItem('tagger_audioType', 'local');
    saveToStorage();
    
    // ★ 核心修正：等瀏覽器確定切換到「剪裁後的新音檔」(loadedmetadata) 後，
    // 才重新初始化 WaveSurfer。如果緊接著同步呼叫，WaveSurfer 有機率讀到
    // 還沒切換過去的舊音檔，畫面/資料就會看起來像是「刪除的那段還在」。
    let waveSurferReinitDone = false;
    const reinitWaveSurfer = () => {
        if (waveSurferReinitDone) return;
        waveSurferReinitDone = true;
        audioPlayer.removeEventListener('loadedmetadata', reinitWaveSurfer);
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
        if (filenamePrefix === "完整音檔") {
            // ★ 修改：優先使用「原始檔名」(即使中途剪裁過也不會被覆蓋)，
            // 找不到才退回用目前的 tagger_localFileName，最後才用「完整音檔備份」保底
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
    const gapMargin = 0.005; // ★ 安全防撞距離 (強制拉開 0.005 秒的空隙)
    
    for (let i = 0; i < allLabelsOrdered.length; i++) {
        if (segIndex >= segments.length) break;
        const label = allLabelsOrdered[i];
        
        // ★ 核心升級：動態彈性留白計算 (空間不夠就自動縮小)
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

    saveToStorage();

    // ================= 階段 3：畫面渲染 (95% ~ 100%) =================
    showToast('3/3 正在重新渲染畫面... 95%', 'normal');
    await new Promise(resolve => setTimeout(resolve, 10));

    if (typeof updateAllTimeDisplays === 'function') updateAllTimeDisplays();
    if (typeof renderAllRegions === 'function') renderAllRegions();
    
    if (tempRegion) { tempRegion.remove(); tempRegion = null; }
    if (typeof updateToolbarButtons === 'function') updateToolbarButtons();
    
    // ★ 核心修復：移除錯誤的 mappedCount 判斷，改為正確的全域成功提示
    showToast(`全域斷句完成！共精準切出 ${segments.length} 句`, 'success');
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
    showToast('2/3 正在套用標記資料... 85%', 'normal');
    await new Promise(resolve => setTimeout(resolve, 10));

    if (typeof saveState === 'function') saveState(); 

    let labelsToUse = [...(targetAutoSegmentRange?.labelsToClear || [])];
    
    if (labelsToUse.length < segments.length) {
        const unmapped = allLabelsOrdered.filter(lbl => !timeDataMap[lbl] && !labelsToUse.includes(lbl));
        labelsToUse = labelsToUse.concat(unmapped);
    }

    // ★ 尋找外部鄰居的邊界，防止局部斷句向外擴張撞到別的標記
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

    let mappedCount = 0;
    const gapMargin = 0.005; // ★ 安全防撞距離

    segments.forEach((seg, idx) => {
        // ★ 核心升級：動態彈性留白計算
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
        }
    });

    saveToStorage();

    // ================= 階段 3：畫面渲染 (95% ~ 100%) =================
    showToast('3/3 正在重新渲染畫面... 95%', 'normal');
    await new Promise(resolve => setTimeout(resolve, 10));

    if (typeof updateAllTimeDisplays === 'function') updateAllTimeDisplays();
    if (typeof renderAllRegions === 'function') renderAllRegions();
    
    if (tempRegion) { tempRegion.remove(); tempRegion = null; }
    if (typeof updateToolbarButtons === 'function') updateToolbarButtons();
    
    if (mappedCount < segments.length) {
        showToast(`局部斷句完成！但句子不夠，僅套用了 ${mappedCount} 句`, 'normal');
    } else {
        showToast(`局部斷句完成！共精準套用 ${mappedCount} 句`, 'success');
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

    whisperWorker.postMessage(
        { type: 'transcribe', audioData: audio16kHzData, language: 'chinese' }, 
        [audio16kHzData.buffer] 
    );
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

    whisperWorker.postMessage({ 
        type: 'transcribe_batch',
        audioData: audio16kHzData, 
        language: modelLang,
        segments: segmentsData 
    }, [audio16kHzData.buffer]);
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
        // ================= 局部範圍：套用到現有標籤 =================
        let labelsToUse = [...(targetRange.labelsToClear || [])];
        if (labelsToUse.length < segments.length) {
            const unmapped = allLabelsOrdered.filter(lbl => !timeDataMap[lbl] && !labelsToUse.includes(lbl));
            labelsToUse = labelsToUse.concat(unmapped);
        }

        let mappedCount = 0;
        segments.forEach((seg, idx) => {
            if (idx < labelsToUse.length) {
                const label = labelsToUse[idx];
                timeDataMap[label] = { start: parseFloat(seg.start.toFixed(3)), end: parseFloat(seg.end.toFixed(3)) };
                mappedCount++;
            }
        });
        
        saveToStorage();
        if (typeof updateAllTimeDisplays === 'function') updateAllTimeDisplays();
        if (typeof renderAllRegions === 'function') renderAllRegions();
        if (typeof tempRegion !== 'undefined' && tempRegion) { tempRegion.remove(); tempRegion = null; }
        if (typeof updateToolbarButtons === 'function') updateToolbarButtons();
        
        if (mappedCount < segments.length) {
            showToast(`局部等長斷句完成！但句子不夠，僅套用了 ${mappedCount} 句`, 'normal');
        } else {
            showToast(`局部等長斷句完成！共套用 ${mappedCount} 句`, 'success');
        }

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