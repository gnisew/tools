class MusicPlayer {
  constructor() {
    // 初始化基本屬性
    this.audioPlayer = new Audio();
    this.playlist = [];
    this.currentIndex = 0;
    this.isPlaying = false;
    this.loopMode = "none"; // none, single, all
    this.isShuffleMode = false;
    this.isAutoNextMode = true;
    this.shuffleIndices = [];
	this.currentPlaybackRate = 1.0;
    this.repeatCount = 0;
    this.currentRepeatCount = 0;
    this.selectedFiles = [];
    this.isMultilineNameDisplay = false;
    
    // 排序方向追踪
    this.isSortAscending = true;
    this.isSortAllAscending = true;
    
    // 刪除確認設定
    this.confirmDelete = true;
    
    // 按鈕顯示設定
    this.buttonVisibility = {
      prevBtn: false,
      nextBtn: false,
      loopBtn: false,
      shuffleBtn: false,
      speedControl: false,
      repeatControl: false,
		  stopBtn: false,
		  waveform: false	
    };
    
    // 初始化各項功能
    this.initElements();
    this.initEventListeners();
    this.initLocalStorage();
    this.initSettingsPanel();
    this.initPlaylistResize();
    this.initWaveform();
    
    // 應用設定
    this.applyButtonVisibility();
    
    // 檢查播放清單是否為空，並更新按鈕位置
    this.updateAddButtonPosition();
    
    // 頁面載入後嘗試重新載入聲波圖
    this.tryReloadWaveformAfterPageLoad();
  }

  // 初始化元素引用
  initElements() {




    // 播放控制相關元素
    this.playPauseBtn = document.getElementById("playPauseBtn");
    this.playPauseIcon = document.getElementById("playPauseIcon");
	this.fullscreenBtn = document.getElementById("fullscreenBtn");
    this.fullscreenIcon = document.getElementById("fullscreenIcon");
    this.isFullscreen = false; // 追蹤滿版狀態
    this.prevBtn = document.getElementById("prevBtn");
    this.stopBtn = document.getElementById("stopBtn");
    this.nextBtn = document.getElementById("nextBtn");
    this.progressBar = document.getElementById("progressBar");
    this.progressContainer = document.getElementById("progressContainer");
    this.currentTimeDisplay = document.getElementById("currentTime");
    this.durationDisplay = document.getElementById("duration");
    this.currentTrack = document.getElementById("currentTrack");
    this.loopBtn = document.getElementById("loopBtn");
    this.shuffleBtn = document.getElementById("shuffleBtn");
    this.stopBtnVisibility = document.getElementById("stopBtnVisibility");
	this.waveformVisibility = document.getElementById("waveformVisibility");
	this.waveformContainer = document.querySelector(".waveform-container");

    // 播放清單相關元素
    this.playlistContainer = document.getElementById("playlistContainer");
    this.clearPlaylistBtn = document.getElementById("clearPlaylistBtn");
    this.clearPlaylistBtn.title = "清除已勾選項目";
    this.exportBtn = document.getElementById("exportBtn");
    this.playlistTools = document.querySelector(".playlist-tools");
    this.checkAllBtn = document.getElementById("checkAllBtn");
    this.sortBtn = document.getElementById("sortBtn");
    this.sortAllBtn = document.getElementById("sortAllBtn");
    this.toggleNameDisplayBtn = document.getElementById("toggleNameDisplayBtn");
    this.toolToggleBtn = document.getElementById("toolToggleBtn");
    
    // 添加音樂相關元素
    this.addMusicBtn = document.getElementById("addMusicBtn");
    this.addMusicModal = document.getElementById("addMusicModal");
    this.closeModal = document.getElementById("closeModal");
    this.audioFile = document.getElementById("audioFile");
    this.audioUrls = document.getElementById("audioUrls");
    this.tabButtons = document.querySelectorAll(".tab-button");
    this.tabContents = document.querySelectorAll(".tab-content");
    this.confirmUrlsBtn = document.getElementById("confirmUrls");
    this.fileInfo = document.getElementById("fileInfo");
    this.fileCount = document.getElementById("fileCount");
    this.fileList = document.getElementById("fileList");
    this.basePath = document.getElementById("basePath");
    this.confirmFiles = document.getElementById("confirmFiles");
    this.clearFiles = document.getElementById("clearFiles");
    this.clearUrls = document.getElementById("clearUrls");
    
    // 聲波圖相關元素
    this.waveformCanvas = document.getElementById("waveformCanvas");
    this.waveformLoading = document.getElementById("waveformLoading");
    this.viewModeBtn = document.getElementById("viewModeBtn");
    this.zoomInBtn = document.getElementById("zoomInBtn");
    this.zoomOutBtn = document.getElementById("zoomOutBtn");
    this.resetZoomBtn = document.getElementById("resetZoomBtn");
    this.waveformViewSetting = document.getElementById("waveformViewSetting");
    
    // 播放清單調整相關元素
    this.playlistResizeBtn = document.getElementById("playlistResizeBtn");
    this.playlistElement = document.querySelector(".playlist");
    this.mainPlayerElement = document.querySelector(".main-player");
    
    // 設定面板相關元素
    this.settingsBtn = document.getElementById("settingsBtn");
    this.settingsPanel = document.getElementById("settingsPanel");
    this.closeSettings = document.getElementById("closeSettings");
    this.autoNextSetting = document.getElementById("autoNextSetting");
    this.speedSetting = document.getElementById("speedSetting");
    this.repeatSetting = document.getElementById("repeatSetting");
    this.volumeSetting = document.getElementById("volumeSetting");
    this.volumeSettingValue = document.getElementById("volumeSettingValue");
    this.confirmDeleteSetting = document.getElementById("confirmDeleteSetting");
    
    // 按鈕顯示設定元素
    this.prevBtnVisibility = document.getElementById("prevBtnVisibility");
    this.nextBtnVisibility = document.getElementById("nextBtnVisibility");
    this.loopBtnVisibility = document.getElementById("loopBtnVisibility");
    this.shuffleBtnVisibility = document.getElementById("shuffleBtnVisibility");
    this.speedControlVisibility = document.getElementById("speedControlVisibility");
    this.repeatControlVisibility = document.getElementById("repeatControlVisibility");
    
    // 工具列控制項
    this.speedControlContainer = document.getElementById("speedControlContainer");
    this.toolbarSpeedSelect = document.getElementById("toolbarSpeedSelect");
    this.repeatControlContainer = document.getElementById("repeatControlContainer");
    this.toolbarRepeatSelect = document.getElementById("toolbarRepeatSelect");
  }

  // 應用按鈕顯示設定
	applyButtonVisibility() {
	  // 設定、播放/暫停按鈕必須顯示
	  this.settingsBtn.style.display = "inline-flex";
	  this.playPauseBtn.style.display = "inline-flex";
	  
	  // 停止按鈕根據設定顯示或隱藏
	  this.stopBtn.style.display = this.buttonVisibility.stopBtn ? "inline-flex" : "none";

	  // 其他按鈕根據設定顯示或隱藏
	  this.prevBtn.style.display = this.buttonVisibility.prevBtn ? "inline-flex" : "none";
	  this.nextBtn.style.display = this.buttonVisibility.nextBtn ? "inline-flex" : "none";
	  this.loopBtn.style.display = this.buttonVisibility.loopBtn ? "inline-flex" : "none";
	  this.shuffleBtn.style.display = this.buttonVisibility.shuffleBtn ? "inline-flex" : "none";

	  // 更新工具列控制項顯示
	  if (this.speedControlContainer) {
		this.speedControlContainer.style.display = this.buttonVisibility.speedControl ? "flex" : "none";
	  }

	  if (this.repeatControlContainer) {
		this.repeatControlContainer.style.display = this.buttonVisibility.repeatControl ? "flex" : "none";
	  }
	  
	  // 更新聲波圖顯示
	  if (this.waveformContainer) {
		this.waveformContainer.style.display = this.buttonVisibility.waveform ? "block" : "none";
	  }
	  
	  // 更新設定面板中的按鈕顯示設定
	  this.updateSettingsVisibility();
	}
  
  // 更新設定面板中的按鈕顯示設定

	updateSettingsVisibility() {
	  if (this.prevBtnVisibility) this.prevBtnVisibility.checked = this.buttonVisibility.prevBtn;
	  if (this.nextBtnVisibility) this.nextBtnVisibility.checked = this.buttonVisibility.nextBtn;
	  if (this.loopBtnVisibility) this.loopBtnVisibility.checked = this.buttonVisibility.loopBtn;
	  if (this.shuffleBtnVisibility) this.shuffleBtnVisibility.checked = this.buttonVisibility.shuffleBtn;
	  if (this.speedControlVisibility) this.speedControlVisibility.checked = this.buttonVisibility.speedControl;
	  if (this.repeatControlVisibility) this.repeatControlVisibility.checked = this.buttonVisibility.repeatControl;
	  if (this.stopBtnVisibility) this.stopBtnVisibility.checked = this.buttonVisibility.stopBtn;
	  if (this.waveformVisibility) this.waveformVisibility.checked = this.buttonVisibility.waveform;
	}

  // 初始化播放清單調整功能
  initPlaylistResize() {
    // 檢查是否有本地存儲的播放清單狀態
    const playlistState = localStorage.getItem("playlistState");
    if (playlistState) {
      if (playlistState === "collapsed") {
        this.playlistElement.classList.add("collapsed");
        this.updateResizeButton(true);
      } else if (playlistState === "expanded") {
        this.playlistElement.classList.add("expanded");
        this.updateResizeButton(false);
      }
    }

    // 添加調整按鈕事件
    this.playlistResizeBtn.addEventListener("click", () => {
      // 檢查當前狀態
      if (this.playlistElement.classList.contains("collapsed")) {
        // 如果是折疊狀態，展開到正常狀態
        this.playlistElement.classList.remove("collapsed");
        this.playlistElement.classList.remove("expanded");
        localStorage.setItem("playlistState", "normal");
        this.updateResizeButton(false);
      } else if (this.playlistElement.classList.contains("expanded")) {
        // 如果是展開狀態，折疊
        this.playlistElement.classList.remove("expanded");
        this.playlistElement.classList.add("collapsed");
        localStorage.setItem("playlistState", "collapsed");
        this.updateResizeButton(true);
      } else {
        // 如果是正常狀態，展開
        this.playlistElement.classList.add("expanded");
        localStorage.setItem("playlistState", "expanded");
        this.updateResizeButton(false);
      }

      // 重新調整聲波圖大小
      setTimeout(() => {
        this.resizeWaveformCanvas();

        // 如果不是折疊狀態且有正在播放的曲目，確保它在視圖中
        if (!this.playlistElement.classList.contains("collapsed") && this.currentIndex >= 0) {
          this.scrollToCurrentTrack();
        }
      }, 300); // 等待CSS過渡效果完成
    });

    // 監聽窗口大小變化，重新調整聲波圖
    window.addEventListener("resize", () => {
      this.resizeWaveformCanvas();
    });
  }

  // 更新調整按鈕圖標
  updateResizeButton(isCollapsed) {
    if (isCollapsed) {
      this.playlistResizeBtn.innerHTML = '<span class="material-icons">chevron_left</span>';
      this.playlistResizeBtn.title = "展開播放清單";
    } else {
      this.playlistResizeBtn.innerHTML = '<span class="material-icons">chevron_right</span>';
      this.playlistResizeBtn.title = "收合播放清單";
    }
  }

  // 初始化聲波圖
  initWaveform() {
    // 聲波圖相關變數
    this.audioContext = null;
    this.audioBuffer = null;
    this.waveformCtx = this.waveformCanvas.getContext("2d");
    this.zoomLevel = 1;
    this.viewMode = "waveform"; // 'waveform' 或 'line'
    this.isWaveformLoaded = false;

    // 設置畫布尺寸
    this.resizeWaveformCanvas();

    // 添加聲波圖相關事件監聽
    window.addEventListener("resize", () => this.resizeWaveformCanvas());

    this.viewModeBtn.addEventListener("click", () => {
      this.viewMode = this.viewMode === "waveform" ? "line" : "waveform";
      this.updateViewModeButton();
      this.drawWaveform();
    });

    this.zoomInBtn.addEventListener("click", () => {
      this.zoomLevel = Math.min(this.zoomLevel * 1.5, 10);
      this.drawWaveform();
    });

    this.zoomOutBtn.addEventListener("click", () => {
      this.zoomLevel = Math.max(this.zoomLevel / 1.5, 1);
      this.drawWaveform();
    });

    this.resetZoomBtn.addEventListener("click", () => {
      this.zoomLevel = 1;
      this.drawWaveform();
    });

    this.waveformCanvas.addEventListener("click", (e) => {
      if (!this.audioBuffer || !this.isWaveformLoaded) return;

      const rect = this.waveformCanvas.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const width = this.waveformCanvas.width;

      // 計算縮放後的可見區域
      const duration = this.audioBuffer.duration;
      const visibleDuration = duration / this.zoomLevel;
      const startTime = Math.max(0, this.audioPlayer.currentTime - visibleDuration / 2);
      const endTime = Math.min(duration, startTime + visibleDuration);

      // 計算點擊位置對應的時間
      const clickTime = startTime + (x / width) * (endTime - startTime);

      // 設置音訊播放時間
      this.audioPlayer.currentTime = clickTime;
    });

    // 設定面板中的聲波圖檢視模式選擇
    this.waveformViewSetting.addEventListener("change", (e) => {
      this.viewMode = e.target.value;
      localStorage.setItem("playerWaveformView", this.viewMode);
      this.updateViewModeButton();
      this.drawWaveform();
    });
  }

  // 更新聲波圖檢視模式按鈕
  updateViewModeButton() {
    if (this.viewMode === "waveform") {
      this.viewModeBtn.innerHTML = '<span class="material-icons">graphic_eq</span>';
      this.viewModeBtn.title = "切換至線段檢視";
    } else {
      this.viewModeBtn.innerHTML = '<span class="material-icons">show_chart</span>';
      this.viewModeBtn.title = "切換至聲波檢視";
    }
  }

  // 調整聲波圖畫布大小
  resizeWaveformCanvas() {
    if (this.waveformCanvas) {
      // 獲取當前畫布的實際寬度
      const containerWidth = this.waveformCanvas.parentElement.clientWidth;

      // 設置畫布尺寸
      this.waveformCanvas.width = containerWidth;
      this.waveformCanvas.height = this.waveformCanvas.clientHeight;

      // 重繪波形
      this.drawWaveform();
    }
  }

  // 載入音訊數據
  loadAudioData(audioUrl) {
    if (!audioUrl) return;

    this.isWaveformLoaded = false;
    if (this.waveformLoading) {
      this.waveformLoading.style.display = "flex";
    }

    // 創建音訊上下文
    if (!this.audioContext) {
      this.audioContext = new (window.AudioContext || window.webkitAudioContext)();
    }

    // 獲取音訊數據
    fetch(audioUrl)
      .then((response) => {
        if (!response.ok) {
          throw new Error(`無法載入音訊檔案: ${response.status} ${response.statusText}`);
        }
        return response.arrayBuffer();
      })
      .then((arrayBuffer) => this.audioContext.decodeAudioData(arrayBuffer))
      .then((audioBuffer) => {
        this.audioBuffer = audioBuffer;
        this.isWaveformLoaded = true;
        if (this.waveformLoading) {
          this.waveformLoading.style.display = "none";
        }
        this.drawWaveform();
      })
      .catch((error) => {
        console.error("載入音訊數據失敗:", error);
        // 如果直接載入失敗，嘗試使用備用方法
        const currentTrack = this.playlist[this.currentIndex];
        if (currentTrack) {
          this.fallbackAudioLoad(currentTrack);
        } else if (this.waveformLoading) {
          this.waveformLoading.style.display = "none";
        }
      });
  }

  // 備用音訊載入方式
  fallbackAudioLoad(track) {
    console.log("使用備用方法載入音訊...");

    // 創建一個臨時的 Audio 元素
    const tempAudio = new Audio();

    // 設置音訊來源
    if (track.type === "file" && track.basePath) {
      tempAudio.src = `${track.basePath}/${track.name}`;
    } else if (track.src) {
      tempAudio.src = track.src;
    } else {
      if (this.waveformLoading) {
        this.waveformLoading.style.display = "none";
        this.waveformLoading.textContent = "載入中...";
      }
      console.error("無法確定音訊來源");
      return;
    }

    // 監聽載入事件
    tempAudio.addEventListener("loadedmetadata", () => {
      console.log("音訊元數據已載入");

      // 使用 MediaElementSourceNode 連接音訊元素
      if (!this.audioContext) {
        this.audioContext = new (window.AudioContext || window.webkitAudioContext)();
      }

      const source = this.audioContext.createMediaElementSource(tempAudio);

      // 創建分析器節點
      const analyser = this.audioContext.createAnalyser();
      analyser.fftSize = 2048;

      // 連接節點
      source.connect(analyser);

      // 創建數據數組
      const bufferLength = analyser.frequencyBinCount;
      const dataArray = new Float32Array(bufferLength);

      // 模擬音訊緩衝區
      this.audioBuffer = {
        duration: tempAudio.duration,
        sampleRate: this.audioContext.sampleRate,
        getChannelData: () => {
          // 獲取當前音訊數據
          analyser.getFloatTimeDomainData(dataArray);
          return dataArray;
        },
        length: bufferLength,
      };

      this.isWaveformLoaded = true;
      if (this.waveformLoading) {
        this.waveformLoading.style.display = "none";
      }

      // 繪製聲波圖
      this.drawWaveform();

      // 斷開連接並釋放資源
      source.disconnect();
      tempAudio.pause();
      tempAudio.src = "";
    });

    // 監聽錯誤事件
    tempAudio.addEventListener("error", (e) => {
      console.error("備用音訊載入失敗:", e);
      if (this.waveformLoading) {
        this.waveformLoading.style.display = "none";
        this.waveformLoading.textContent = "載入中...";
      }
    });

    // 開始載入
    tempAudio.load();
  }

  // 頁面載入後嘗試重新載入聲波圖
  tryReloadWaveformAfterPageLoad() {
    // 確保播放清單已經從 localStorage 載入
    setTimeout(() => {
      if (this.playlist.length > 0 && this.currentIndex >= 0 && this.currentIndex < this.playlist.length) {
        const currentTrack = this.playlist[this.currentIndex];

        // 顯示載入中提示
        if (this.waveformLoading) {
          this.waveformLoading.style.display = "flex";
          this.waveformLoading.textContent = "重新載入聲波圖...";
        }

        // 嘗試重新載入音訊檔案以生成聲波圖
        this.reloadAudioForWaveform(currentTrack);
      }

      // 在播放清單載入後檢查並更新按鈕位置
      this.updateAddButtonPosition();
    }, 500); // 給予一些時間讓播放清單從 localStorage 載入
  }

  // 重新載入音訊檔案以生成聲波圖
  reloadAudioForWaveform(track) {
    if (!track) return;

    // 根據音訊來源類型處理
    if (track.type === "file" && track.basePath) {
      const fullPath = `${track.basePath}/${track.name}`;

      console.log("嘗試重新載入音訊檔案:", fullPath);

      // 使用 fetch 嘗試載入音訊檔案
      fetch(fullPath)
        .then((response) => {
          if (!response.ok) {
            throw new Error(`無法載入音訊檔案: ${response.status} ${response.statusText}`);
          }
          return response.arrayBuffer();
        })
        .then((arrayBuffer) => {
          // 成功載入音訊檔案，更新聲波圖
          console.log("成功載入音訊檔案，更新聲波圖");

          // 創建音訊上下文
          if (!this.audioContext) {
            this.audioContext = new (window.AudioContext || window.webkitAudioContext)();
          }

          return this.audioContext.decodeAudioData(arrayBuffer);
        })
        .then((audioBuffer) => {
          this.audioBuffer = audioBuffer;
          this.isWaveformLoaded = true;
          if (this.waveformLoading) {
            this.waveformLoading.style.display = "none";
          }
          this.drawWaveform();
        })
        .catch((error) => {
          console.error("重新載入音訊檔案失敗:", error);

          // 如果直接載入失敗，嘗試使用 Audio 元素間接載入
          this.fallbackAudioLoad(track);
        });
    } else if (track.src) {
      // 對於其他類型的音訊來源，直接使用 src
      this.loadAudioData(track.src);
    }
  }

  // 繪製聲波圖
  drawWaveform() {
    const canvas = this.waveformCanvas;
    const ctx = this.waveformCtx;

    if (!canvas || !ctx) return;

    // 清除畫布
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // 繪製背景
    ctx.fillStyle = "#f8f8f8";
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    if (!this.audioBuffer || !this.isWaveformLoaded) {
      // 如果沒有音訊數據，顯示提示文字
      ctx.fillStyle = "#999";
      ctx.font = "14px Arial";
      ctx.textAlign = "center";
      ctx.fillText("請選擇音樂檔案以顯示聲波圖", canvas.width / 2, canvas.height / 2);
      return;
    }

    // 獲取音訊數據
    const channelData = this.audioBuffer.getChannelData(0);
    const duration = this.audioBuffer.duration;

    // 計算縮放後的可見區域
    const visibleDuration = duration / this.zoomLevel;

    // 計算可見區域的起始和結束時間
    let startTime = 0;
    let endTime = duration;

    // 如果有縮放，則根據縮放等級和當前播放位置計算可見區域
    if (this.zoomLevel > 1) {
      // 計算可見區域的一半寬度
      const halfVisibleDuration = visibleDuration / 2;

      // 計算中心點，確保當前播放位置在可見區域中間
      const centerTime = this.audioPlayer.currentTime;

      // 確保可見區域不會超出音頻範圍
      startTime = Math.max(0, centerTime - halfVisibleDuration);
      endTime = Math.min(duration, centerTime + halfVisibleDuration);

      // 如果可見區域長度小於預期，調整起始或結束時間
      if (endTime - startTime < visibleDuration) {
        if (startTime === 0) {
          // 如果已經到達開頭，則延長結束時間
          endTime = Math.min(duration, visibleDuration);
        } else if (endTime === duration) {
          // 如果已經到達結尾，則提前起始時間
          startTime = Math.max(0, duration - visibleDuration);
        }
      }
    }

    // 計算採樣點
    const startSample = Math.floor(startTime * this.audioBuffer.sampleRate);
    const endSample = Math.floor(endTime * this.audioBuffer.sampleRate);
    const samplesPerPixel = Math.max(1, Math.floor((endSample - startSample) / canvas.width));

    // 繪製時間軸
    ctx.fillStyle = "#e9ecef";
    const currentTimePixel = ((this.audioPlayer.currentTime - startTime) / (endTime - startTime)) * canvas.width;
    if (currentTimePixel >= 0 && currentTimePixel <= canvas.width) {
      ctx.fillRect(currentTimePixel, 0, 2, canvas.height);
    }

    // 繪製波形
    ctx.strokeStyle = "#4CAF50";
    ctx.lineWidth = 2;
    ctx.beginPath();

    const centerY = canvas.height / 2;

    if (this.viewMode === "waveform") {
      // 波形模式
      for (let x = 0; x < canvas.width; x++) {
        const sampleIndex = startSample + Math.floor((x * (endSample - startSample)) / canvas.width);

        if (sampleIndex < channelData.length) {
          // 計算每個像素的最大和最小值
          let minSample = 1.0;
          let maxSample = -1.0;

          for (let j = 0; j < samplesPerPixel && sampleIndex + j < channelData.length; j++) {
            const sampleValue = channelData[sampleIndex + j];
            minSample = Math.min(minSample, sampleValue);
            maxSample = Math.max(maxSample, sampleValue);
          }

          // 繪製垂直線段
          ctx.moveTo(x, centerY + minSample * centerY * 0.9);
          ctx.lineTo(x, centerY + maxSample * centerY * 0.9);
        }
      }
    } else {
      // 線段模式
      ctx.moveTo(0, centerY);

      for (let x = 0; x < canvas.width; x++) {
        const sampleIndex = startSample + Math.floor((x * (endSample - startSample)) / canvas.width);

        if (sampleIndex < channelData.length) {
          // 計算每個像素的平均值
          let sum = 0;
          let count = 0;

          for (let j = 0; j < samplesPerPixel && sampleIndex + j < channelData.length; j++) {
            sum += channelData[sampleIndex + j];
            count++;
          }

          const avgSample = count > 0 ? sum / count : 0;
          ctx.lineTo(x, centerY + avgSample * centerY * 0.9);
        }
      }
    }

    ctx.stroke();

    // 繪製時間標記
    ctx.fillStyle = "#666";
    ctx.font = "12px Arial";
    ctx.textAlign = "center";

    const timeStep = Math.ceil(visibleDuration / 10);
    for (let t = Math.ceil(startTime); t <= endTime; t += timeStep) {
      const x = ((t - startTime) / (endTime - startTime)) * canvas.width;
      const minutes = Math.floor(t / 60);
      const seconds = Math.floor(t % 60);
      const timeText = `${minutes}:${seconds.toString().padStart(2, "0")}`;

      ctx.fillText(timeText, x, canvas.height - 5);
    }
  }

  // 初始化本地儲存
  initLocalStorage() {
    const savedPlaylist = localStorage.getItem("musicPlaylist");
    if (savedPlaylist) {
      try {
        const parsed = JSON.parse(savedPlaylist);
        parsed.forEach((item) => {
          if (item.type === "file" && item.basePath) {
            const fullPath = `${item.basePath}/${item.name}`;
            this.addToPlaylist({
              name: item.name,
              src: fullPath,
              type: "file",
              basePath: item.basePath,
            });
          } else if (item.type === "url") {
            // 處理 URL 類型的音樂
            this.addToPlaylist({
              name: item.name,
              src: item.src,
              type: "url",
            });
          }
        });

        // 在載入播放清單後，嘗試恢復當前播放的曲目
        const savedCurrentIndex = localStorage.getItem("currentTrackIndex");
        if (savedCurrentIndex !== null && this.playlist.length > 0) {
          const index = Number.parseInt(savedCurrentIndex);
          if (!isNaN(index) && index >= 0 && index < this.playlist.length) {
            this.currentIndex = index;
            this.audioPlayer.src = this.playlist[index].src;
            const nameWithoutExtension = this.playlist[index].name.replace(/\.[^/.]+$/, "");
            this.currentTrack.textContent = nameWithoutExtension;
          }
        }
      } catch (e) {
        console.error("載入播放清單失敗:", e);
      }
    }

    // 載入刪除確認設定
    const confirmDelete = localStorage.getItem("confirmDelete");
    if (confirmDelete !== null) {
      this.confirmDelete = confirmDelete === "true";
      this.confirmDeleteSetting.checked = this.confirmDelete;
    }

    // 載入按鈕顯示設定
    const buttonVisibility = localStorage.getItem("buttonVisibility");
    if (buttonVisibility) {
      try {
        this.buttonVisibility = JSON.parse(buttonVisibility);
        this.updateSettingsVisibility();
      } catch (e) {
        console.error("載入按鈕顯示設定失敗:", e);
      }
    }

    // 載入工具列顯示狀態
    const toolsExpanded = localStorage.getItem("toolsExpanded");
    if (toolsExpanded !== null) {
      if (toolsExpanded === "true") {
        this.playlistTools.classList.add("expanded");
        this.updateToolToggleButton(true);
      }
    }
	// 【新增】載入其他播放設定
    // 1. 載入自動播放下一首設定
    const savedAutoNext = localStorage.getItem("playerAutoNext");
    if (savedAutoNext !== null) {
      this.isAutoNextMode = savedAutoNext === "true";
      if (this.autoNextSetting) this.autoNextSetting.checked = this.isAutoNextMode;
    }

    // 2. 載入播放速度
    const savedSpeed = localStorage.getItem("playerSpeed");
    if (savedSpeed !== null) {
      this.currentPlaybackRate = Number.parseFloat(savedSpeed);
      this.audioPlayer.playbackRate = this.currentPlaybackRate;
      if (this.speedSetting) this.speedSetting.value = savedSpeed;
      if (this.toolbarSpeedSelect) this.toolbarSpeedSelect.value = savedSpeed;
    }

    // 3. 載入重複次數
    const savedRepeat = localStorage.getItem("playerRepeat");
    if (savedRepeat !== null) {
      this.repeatCount = savedRepeat === "Infinity" ? "Infinity" : Number.parseInt(savedRepeat);
      if (this.repeatSetting) this.repeatSetting.value = savedRepeat;
      if (this.toolbarRepeatSelect) this.toolbarRepeatSelect.value = savedRepeat;
    }

    // 4. 載入聲波圖檢視模式
    const savedWaveformView = localStorage.getItem("playerWaveformView");
    if (savedWaveformView !== null) {
      this.viewMode = savedWaveformView;
      if (this.waveformViewSetting) this.waveformViewSetting.value = savedWaveformView;
      this.updateViewModeButton();
    }

  }

  // 初始化設定面板
  initSettingsPanel() {
	// 設定按鈕切換設定面板
	this.settingsBtn.addEventListener("click", (e) => {
	  // 阻止事件冒泡，避免觸發document的點擊事件
	  e.stopPropagation();
	  
	  // 切換設定面板的顯示狀態
	  this.settingsPanel.classList.toggle("show");
	});

	// 停止按鈕顯示設定變更事件
	this.stopBtnVisibility.addEventListener("change", (e) => {
	  this.buttonVisibility.stopBtn = e.target.checked;
	  this.applyButtonVisibility();
	  localStorage.setItem("buttonVisibility", JSON.stringify(this.buttonVisibility));
	});

	// 聲波圖顯示設定變更事件
	this.waveformVisibility.addEventListener("change", (e) => {
	  this.buttonVisibility.waveform = e.target.checked;
	  this.applyButtonVisibility();
	  localStorage.setItem("buttonVisibility", JSON.stringify(this.buttonVisibility));
	});

	// 關閉按鈕隱藏設定面板
	this.closeSettings.addEventListener("click", (e) => {
	  // 阻止事件冒泡
	  e.stopPropagation();
	  this.settingsPanel.classList.remove("show");
	});
    this.closeSettings.addEventListener("click", (e) => {
      // 阻止事件冒泡
      e.stopPropagation();
      this.settingsPanel.classList.remove("show");
    });

    // 防止點擊設定面板內部時關閉面板
    this.settingsPanel.addEventListener("click", (e) => {
      e.stopPropagation();
    });

    // 點擊設定面板以外的區域關閉設定面板
    document.addEventListener("click", () => {
      if (this.settingsPanel.classList.contains("show")) {
        this.settingsPanel.classList.remove("show");
      }
    });
    
    // 設定變更事件
    this.autoNextSetting.addEventListener("change", (e) => {
      this.isAutoNextMode = e.target.checked;
      localStorage.setItem("playerAutoNext", this.isAutoNextMode);
    });

    this.speedSetting.addEventListener("change", (e) => {
      this.currentPlaybackRate = Number.parseFloat(e.target.value);
      this.audioPlayer.playbackRate = this.currentPlaybackRate;
      localStorage.setItem("playerSpeed", e.target.value);

      // 同步工具列中的速度選擇
      if (this.toolbarSpeedSelect) {
        this.toolbarSpeedSelect.value = this.currentPlaybackRate;
      }
    });

    this.repeatSetting.addEventListener("change", (e) => {
      // 處理無限重複選項
      this.repeatCount = e.target.value === "Infinity" ? "Infinity" : Number.parseInt(e.target.value);
      this.currentRepeatCount = 0;
      localStorage.setItem("playerRepeat", e.target.value);

      // 同步工具列中的重複次數選擇
      if (this.toolbarRepeatSelect) {
        this.toolbarRepeatSelect.value = e.target.value;
      }
    });


   
    // 1. 啟動時先讀取本地儲存的音量，若無則使用 HTML 上的預設值
    const savedVolume = localStorage.getItem("playerVolume");
    if (savedVolume !== null) {
      this.volumeSetting.value = savedVolume;
      this.audioPlayer.volume = savedVolume / 100;
      this.volumeSettingValue.textContent = `${savedVolume}%`;
    } else {
      this.audioPlayer.volume = this.volumeSetting.value / 100;
      this.volumeSettingValue.textContent = `${this.volumeSetting.value}%`;
    }

    // 2. 監聽音量改變並存檔
    this.volumeSetting.addEventListener("input", (e) => {
      const volume = e.target.value / 100;
      this.audioPlayer.volume = volume;
      this.volumeSettingValue.textContent = `${e.target.value}%`;
      // 將音量偏好存入 localStorage
      localStorage.setItem("playerVolume", e.target.value); 
    });

    // 刪除確認設定變更事件
    this.confirmDeleteSetting.addEventListener("change", (e) => {
      this.confirmDelete = e.target.checked;
      localStorage.setItem("confirmDelete", this.confirmDelete);
    });
    
    // 按鈕顯示設定變更事件
    this.prevBtnVisibility.addEventListener("change", (e) => {
      this.buttonVisibility.prevBtn = e.target.checked;
      this.applyButtonVisibility();
      localStorage.setItem("buttonVisibility", JSON.stringify(this.buttonVisibility));
    });
    
    this.nextBtnVisibility.addEventListener("change", (e) => {
      this.buttonVisibility.nextBtn = e.target.checked;
      this.applyButtonVisibility();
      localStorage.setItem("buttonVisibility", JSON.stringify(this.buttonVisibility));
    });
    
    this.loopBtnVisibility.addEventListener("change", (e) => {
      this.buttonVisibility.loopBtn = e.target.checked;
      this.applyButtonVisibility();
      localStorage.setItem("buttonVisibility", JSON.stringify(this.buttonVisibility));
    });
    
    this.shuffleBtnVisibility.addEventListener("change", (e) => {
      this.buttonVisibility.shuffleBtn = e.target.checked;
      this.applyButtonVisibility();
      localStorage.setItem("buttonVisibility", JSON.stringify(this.buttonVisibility));
    });
    
    this.speedControlVisibility.addEventListener("change", (e) => {
      this.buttonVisibility.speedControl = e.target.checked;
      this.applyButtonVisibility();
      localStorage.setItem("buttonVisibility", JSON.stringify(this.buttonVisibility));
    });
    
    this.repeatControlVisibility.addEventListener("change", (e) => {
      this.buttonVisibility.repeatControl = e.target.checked;
      this.applyButtonVisibility();
      localStorage.setItem("buttonVisibility", JSON.stringify(this.buttonVisibility));
    });
  }

  // 切換工具列顯示狀態
  toggleToolsPanel() {
    const isExpanded = this.playlistTools.classList.toggle("expanded");
    this.updateToolToggleButton(isExpanded);
    localStorage.setItem("toolsExpanded", isExpanded);
  }

  // 更新工具列切換按鈕圖示
  updateToolToggleButton(isExpanded) {
    if (isExpanded) {
      this.toolToggleBtn.innerHTML = '<span class="material-icons">expand_less</span>';
      this.toolToggleBtn.title = "隱藏工具列";
    } else {
      this.toolToggleBtn.innerHTML = '<span class="material-icons">expand_more</span>';
      this.toolToggleBtn.title = "顯示工具列";
    }
  }

  // 初始化事件監聽器
  initEventListeners() {
    // 播放控制相關事件
    this.fullscreenBtn.addEventListener("click", () => this.toggleFullscreen());
    
    this.playPauseBtn.addEventListener("click", () => this.togglePlayPause());
    this.playPauseBtn.addEventListener("click", () => this.togglePlayPause());
    this.prevBtn.addEventListener("click", () => this.playPrevious());
    this.stopBtn.addEventListener("click", () => this.stop());
    this.nextBtn.addEventListener("click", () => this.playNext());

    this.audioPlayer.addEventListener("timeupdate", () => {
      this.updateProgressBar();
      this.drawWaveform(); // 更新聲波圖
    });
    this.progressContainer.addEventListener("click", (e) => this.seekProgress(e));

    this.loopBtn.addEventListener("click", () => this.toggleLoopMode());
    this.shuffleBtn.addEventListener("click", () => this.toggleShuffleMode());

    this.audioPlayer.addEventListener("play", () => {
      this.isPlaying = true;
      this.updatePlayPauseButton();
    });

    this.audioPlayer.addEventListener("pause", () => {
      this.isPlaying = false;
      this.updatePlayPauseButton();
    });

	this.audioPlayer.addEventListener("ended", () => {
	  if (this.loopMode === "single") {
		this.audioPlayer.currentTime = 0;
		this.play();
	  } else {
		// 檢查是否為無限重複或是否還有重複次數
		if (this.repeatCount === "Infinity" || this.currentRepeatCount < this.repeatCount) {
		  this.currentRepeatCount++;
		  this.audioPlayer.currentTime = 0;
		  this.play();
		} else {
		  this.currentRepeatCount = 0;
		  if (this.isAutoNextMode || this.loopMode === "all") {
			this.playNext();
		  }
		}
	  }
	});

    // 工具列控制項事件
    this.toolbarSpeedSelect.addEventListener("change", (e) => {
      this.currentPlaybackRate = Number.parseFloat(e.target.value);
      this.audioPlayer.playbackRate = this.currentPlaybackRate;
      // 同步設定面板中的速度選擇
      if (this.speedSetting) {
        this.speedSetting.value = this.currentPlaybackRate;
      }
    });

	this.toolbarRepeatSelect.addEventListener("change", (e) => {
	  // 處理無限重複選項
	  this.repeatCount = e.target.value === "Infinity" ? "Infinity" : Number.parseInt(e.target.value);
	  this.currentRepeatCount = 0;
	  
	  // 同步設定面板中的重複次數選擇
	  if (this.repeatSetting) {
		this.repeatSetting.value = e.target.value;
	  }
	});

    // 播放清單相關事件
    this.clearPlaylistBtn.addEventListener("click", () => {
      this.clearPlaylist();
    });

    this.sortBtn.addEventListener("click", () => {
      this.sortPlaylist();
      // 更新排序按鈕圖標
      this.updateSortButtonIcon();
    });

    this.exportBtn.addEventListener("click", () => {
      this.exportPlaylist();
    });

    this.toggleNameDisplayBtn.addEventListener("click", () => {
      this.toggleNameDisplayMode();
    });

    this.checkAllBtn.addEventListener("click", () => {
      // 檢查是否所有曲目都已啟用
      const allEnabled = this.playlist.every((track) => track.enabled);

      // 根據當前狀態切換
      this.playlist.forEach((track) => (track.enabled = !allEnabled));

      // 更新按鈕圖示
      const icon = this.checkAllBtn.querySelector(".material-icons");
      icon.textContent = allEnabled ? "check_box_outline_blank" : "check_box";
      this.checkAllBtn.title = allEnabled ? "全部勾選" : "取消全選";

      // 如果取消全選且正在播放，則停止播放
      if (allEnabled && this.isPlaying) {
        this.stop();
      }

      this.updatePlaylistView();
    });

    this.sortAllBtn.addEventListener("click", () => {
      // 切換排序方向
      this.isSortAllAscending = !this.isSortAllAscending;

      // 根據當前排序方向排序
      if (this.isSortAllAscending) {
        this.playlist.sort((a, b) => a.name.localeCompare(b.name));
      } else {
        this.playlist.sort((a, b) => b.name.localeCompare(a.name));
      }

      // 更新當前播放索引
      if (this.isPlaying) {
        this.currentIndex = this.playlist.findIndex((track) => track.src === this.audioPlayer.src);
      }

      // 如果在隨機播放模式，重新生成隨機索引
      if (this.isShuffleMode) {
        this.shuffleIndices = this.generateShuffleIndices();
      }

      // 更新排序按鈕圖標
      this.updateSortAllButtonIcon();

      // 更新播放清單視圖
      this.updatePlaylistView();
    });

    // 工具列切換按鈕事件
    this.toolToggleBtn.addEventListener("click", () => {
      this.toggleToolsPanel();
    });

    // 添加音樂相關事件
    this.addMusicBtn.addEventListener("click", () => {
      this.addMusicModal.classList.add("show");
    });

    this.closeModal.addEventListener("click", () => {
      this.addMusicModal.classList.remove("show");
    });

    this.addMusicModal.addEventListener("click", (e) => {
      if (e.target === this.addMusicModal) {
        this.addMusicModal.classList.remove("show");
      }
    });

    this.audioFile.addEventListener("change", (e) => {
      this.selectedFiles = Array.from(e.target.files);
      this.updateFileInfo();
    });

    this.confirmFiles.addEventListener("click", () => {
      const basePath = this.basePath.value.trim();
      this.selectedFiles.forEach((file) => {
        const fileData = {
          name: file.name,
          src: URL.createObjectURL(file),
          type: "file",
        };

        if (basePath) {
          fileData.basePath = basePath;
        }

        this.addToPlaylist(fileData);
      });

      this.clearFileSelection();
      this.saveToLocalStorage();
      this.addMusicModal.classList.remove("show");

      // 更新新增按鈕位置
      this.updateAddButtonPosition();
    });

    this.clearFiles.addEventListener("click", () => {
      this.clearFileSelection();
    });

    this.clearUrls.addEventListener("click", () => {
      this.audioUrls.value = "";
    });

    this.confirmUrlsBtn.addEventListener("click", () => {
      const urls = this.audioUrls.value.split("\n").filter((url) => url.trim());

      urls.forEach((url) => {
        let processedUrl = url.trim();

        // 處理 Google Drive 連結
        if (url.includes("drive.google.com")) {
          let fileId = url.match(/[-\w]{25,}/);
          if (fileId) {
            processedUrl = `https://drive.google.com/uc?export=download&id=${fileId[0]}`;
          }
        }

        this.addToPlaylist({
          name: this.extractFileName(processedUrl),
          src: processedUrl,
          type: "url",
        });
      });

      this.audioUrls.value = "";
      this.addMusicModal.classList.remove("show");
      this.saveToLocalStorage();

      // 更新新增按鈕位置
      this.updateAddButtonPosition();
    });

    this.tabButtons.forEach((button) => {
      button.addEventListener("click", () => {
        const tabName = button.dataset.tab;

        this.tabButtons.forEach((btn) => btn.classList.remove("active"));
        button.classList.add("active");

        this.tabContents.forEach((content) => {
          if (content.dataset.tab === tabName) {
            content.classList.add("active");
          } else {
            content.classList.remove("active");
          }
        });
      });
    });
  }

  // 更新排序按鈕圖標
  updateSortButtonIcon() {
    const icon = this.sortBtn.querySelector(".material-icons");
    if (this.isSortAscending) {
      icon.textContent = "arrow_downward";
      this.sortBtn.title = "勾選項目排序 (遞減)";
    } else {
      icon.textContent = "arrow_upward";
      this.sortBtn.title = "勾選項目排序 (遞增)";
    }
  }

  // 更新全部排序按鈕圖標
  updateSortAllButtonIcon() {
    const icon = this.sortAllBtn.querySelector(".material-icons");
    if (this.isSortAllAscending) {
      icon.textContent = "arrow_downward";
      this.sortAllBtn.title = "全部排序 (遞減)";
    } else {
      icon.textContent = "arrow_upward";
      this.sortAllBtn.title = "全部排序 (遞增)";
    }
  }

  // 更新新增按鈕位置
  updateAddButtonPosition() {
    const playlistElement = document.querySelector(".playlist");
    if (this.playlist.length === 0) {
      // 播放清單為空時，添加 playlist-empty 類別
      playlistElement.classList.add("playlist-empty");
    } else {
      // 播放清單有檔案時，移除 playlist-empty 類別
      playlistElement.classList.remove("playlist-empty");
    }
  }

  // 更新檔案資訊
  updateFileInfo() {
    if (this.selectedFiles.length > 0) {
      this.fileInfo.style.display = "block";
      this.fileCount.textContent = this.selectedFiles.length;
      this.fileList.innerHTML = this.selectedFiles
        .map((file) => `<div class="file-list-item">${file.name}</div>`)
        .join("");
    } else {
      this.fileInfo.style.display = "none";
    }
  }

  // 切換檔名顯示模式
  toggleNameDisplayMode() {
    this.isMultilineNameDisplay = !this.isMultilineNameDisplay;

    // 更新按鈕圖標和提示
    if (this.isMultilineNameDisplay) {
      this.toggleNameDisplayBtn.innerHTML = '<span class="material-icons">short_text</span>';
      this.toggleNameDisplayBtn.title = "切換為單行顯示";
    } else {
      this.toggleNameDisplayBtn.innerHTML = '<span class="material-icons">wrap_text</span>';
      this.toggleNameDisplayBtn.title = "切換為完整顯示";
    }

    // 更新播放清單視圖
    this.updatePlaylistView();
  }

  // 清除檔案選擇
  clearFileSelection() {
    this.selectedFiles = [];
    this.audioFile.value = "";
    this.basePath.value = "";
    this.updateFileInfo();
  }

  // 匯出播放清單
  exportPlaylist() {
    const exportList = this.playlist.map((track) => {
      if (track.type === "file") {
        if (track.basePath) {
          return `${track.basePath}/${track.name}`;
        }
        return track.name;
      }
      return track.src; // 如果是網址就直接返回
    });

    const exportText = exportList.join("\n");

    // 複製到剪貼簿
    navigator.clipboard
      .writeText(exportText)
      .then(() => {
        alert("播放清單已複製到剪貼簿");
      })
      .catch((err) => {
        console.error("複製失敗:", err);
        alert("複製失敗，請手動複製");
        // 創建一個臨時文本區域用於複製
        const textarea = document.createElement("textarea");
        textarea.value = exportText;
        document.body.appendChild(textarea);
        textarea.select();
        document.execCommand("copy");
        document.body.removeChild(textarea);
      });
  }

  // 保存到本地儲存
  saveToLocalStorage() {
    const playlistData = this.playlist.map((item) => ({
      name: item.name,
      type: item.type,
      basePath: item.basePath,
      src: item.type === "url" ? item.src : undefined, // 保存 URL 類型的 src
    }));
    localStorage.setItem("musicPlaylist", JSON.stringify(playlistData));

    // 保存當前播放曲目索引
    localStorage.setItem("currentTrackIndex", this.currentIndex.toString());

    // 保存刪除確認設定
    localStorage.setItem("confirmDelete", this.confirmDelete);

    // 保存按鈕顯示設定
    localStorage.setItem("buttonVisibility", JSON.stringify(this.buttonVisibility));

    // 保存工具列顯示狀態
    localStorage.setItem("toolsExpanded", this.playlistTools.classList.contains("expanded"));
  }

  // 排序播放清單
  sortPlaylist() {
    // 切換排序方向
    this.isSortAscending = !this.isSortAscending;

    // 先將播放清單分成已啟用和未啟用兩組
    const enabledTracks = this.playlist.filter((track) => track.enabled);
    const disabledTracks = this.playlist.filter((track) => !track.enabled);

    // 根據當前排序方向排序已啟用的曲目
    if (this.isSortAscending) {
      enabledTracks.sort((a, b) => a.name.localeCompare(b.name));
    } else {
      enabledTracks.sort((a, b) => b.name.localeCompare(a.name));
    }

    // 合併排序後的清單
    this.playlist = [...enabledTracks, ...disabledTracks];

    // 更新當前播放索引
    if (this.isPlaying) {
      const currentTrack = this.playlist.find((track, index) => index === this.currentIndex);
      this.currentIndex = this.playlist.indexOf(currentTrack);
    }

    // 如果在隨機播放模式，重新生成隨機索引
    if (this.isShuffleMode) {
      this.shuffleIndices = this.generateShuffleIndices();
    }

    // 更新播放清單視圖
    this.updatePlaylistView();
  }

  // 切換循環模式
  toggleLoopMode() {
    const modes = {
      none: "single",
      single: "all",
      all: "none",
    };
    const icons = {
      none: "repeat",
      single: "repeat_one",
      all: "repeat",
    };
    this.loopMode = modes[this.loopMode];
    const icon = this.loopBtn.querySelector(".material-icons");
    icon.textContent = icons[this.loopMode];

    if (this.loopMode === "none") {
      this.loopBtn.classList.remove("active");
    } else {
      this.loopBtn.classList.add("active");
    }
  }

  // 切換隨機播放模式
  toggleShuffleMode() {
    this.isShuffleMode = !this.isShuffleMode;
    if (this.isShuffleMode) {
      this.shuffleIndices = this.generateShuffleIndices();
      this.shuffleBtn.classList.add("active");
    } else {
      this.shuffleIndices = [];
      this.shuffleBtn.classList.remove("active");
    }
  }

  // 生成隨機索引
  generateShuffleIndices() {
    const indices = Array.from(
      {
        length: this.playlist.length,
      },
      (_, i) => i,
    );
    for (let i = indices.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [indices[i], indices[j]] = [indices[j], indices[i]];
    }
    return indices;
  }

  // 獲取下一個索引 (完全重寫，加強安全性)
  getNextIndex() {
    if (this.playlist.length <= 1) return 0;

    // 防呆檢查：如果所有曲目都被停用，直接回傳 -1 停止播放
    const hasEnabledTrack = this.playlist.some((track) => track.enabled);
    if (!hasEnabledTrack) return -1;

    if (this.isShuffleMode) {
      let currentShuffleIndex = this.shuffleIndices.indexOf(this.currentIndex);
      if (currentShuffleIndex === -1) currentShuffleIndex = 0; // 防呆
      
      let attempts = 0; // 避免無窮迴圈的計數器
      const maxAttempts = this.shuffleIndices.length;

      do {
        currentShuffleIndex++;
        if (currentShuffleIndex >= this.shuffleIndices.length) {
          if (this.loopMode === "all") {
            currentShuffleIndex = 0; // 回到洗牌陣列的開頭
          } else {
            return -1; // 播放結束
          }
        }
        attempts++;
        
        // 確保找到的這首歌是「已啟用」的
        let nextTrackIndex = this.shuffleIndices[currentShuffleIndex];
        if (this.playlist[nextTrackIndex].enabled) {
          return nextTrackIndex;
        }
      } while (attempts < maxAttempts);

      return -1;
    } else {
      let nextIndex = this.currentIndex;
      let attempts = 0;
      const maxAttempts = this.playlist.length;
      
      do {
        nextIndex++;
        if (nextIndex >= this.playlist.length) {
          if (this.loopMode === "all") {
            nextIndex = 0;
          } else {
            return -1;
          }
        }
        attempts++;
        
        if (this.playlist[nextIndex].enabled) {
          return nextIndex;
        }
      } while (attempts < maxAttempts);

      return -1;
    }
  }

  // 獲取上一個索引 (完全重寫，加強安全性)
  getPreviousIndex() {
    if (this.playlist.length <= 1) return 0;

    // 防呆檢查：如果所有曲目都被停用，回傳當前索引或停止
    const hasEnabledTrack = this.playlist.some((track) => track.enabled);
    if (!hasEnabledTrack) return this.currentIndex;

    if (this.isShuffleMode) {
      let currentShuffleIndex = this.shuffleIndices.indexOf(this.currentIndex);
      if (currentShuffleIndex === -1) currentShuffleIndex = 0;
      
      let attempts = 0;
      const maxAttempts = this.shuffleIndices.length;

      do {
        currentShuffleIndex--;
        if (currentShuffleIndex < 0) {
          if (this.loopMode === "all") {
            currentShuffleIndex = this.shuffleIndices.length - 1;
          } else {
            return this.currentIndex;
          }
        }
        attempts++;
        
        let prevTrackIndex = this.shuffleIndices[currentShuffleIndex];
        if (this.playlist[prevTrackIndex].enabled) {
          return prevTrackIndex;
        }
      } while (attempts < maxAttempts);

      return this.currentIndex;
    } else {
      let prevIndex = this.currentIndex;
      let attempts = 0;
      const maxAttempts = this.playlist.length;
      
      do {
        prevIndex--;
        if (prevIndex < 0) {
          if (this.loopMode === "all") {
            prevIndex = this.playlist.length - 1;
          } else {
            return this.currentIndex;
          }
        }
        attempts++;
        
        if (this.playlist[prevIndex].enabled) {
          return prevIndex;
        }
      } while (attempts < maxAttempts);

      return this.currentIndex;
    }
  }

  // 清除播放清單
  clearPlaylist() {
    const hasCheckedItems = this.playlist.some((track) => track.enabled);
    if (!hasCheckedItems) {
      alert("沒有已勾選的項目");
      return;
    }

    // 根據設定決定是否需要確認
    if (!this.confirmDelete || confirm("確定要清除已勾選的項目嗎？")) {
      const wasPlaying = this.isPlaying;
      const currentTrack = this.playlist[this.currentIndex];

      // 過濾出未勾選的項目
      const newPlaylist = this.playlist.filter((track) => !track.enabled);
      this.playlist = newPlaylist;

      if (this.playlist.length === 0) {
        this.stop();
        this.audioPlayer.src = "";
        this.currentTrack.textContent = "未選擇音樂";
        this.currentIndex = 0;
      } else if (wasPlaying) {
        // 如果正在播放的曲目被清除，播放下一首
        if (!this.playlist.includes(currentTrack)) {
          this.currentIndex = 0;
          this.playTrack(0);
        }
      }

      if (this.isShuffleMode) {
        this.shuffleIndices = this.generateShuffleIndices();
      }

      this.updatePlaylistView();
      this.saveToLocalStorage();

      // 更新新增按鈕位置
      this.updateAddButtonPosition();
    }
  }

  // 播放下一首
  playNext() {
    const nextIndex = this.getNextIndex();
    if (nextIndex !== -1 && nextIndex !== this.currentIndex) {
      this.playTrack(nextIndex);
    } else {
      this.stop();
    }
  }

  // 播放上一首
  playPrevious() {
    const prevIndex = this.getPreviousIndex();
    if (prevIndex !== this.currentIndex) {
      this.playTrack(prevIndex);
    }
  }

  // 切換滿版模式
  toggleFullscreen() {
    this.isFullscreen = !this.isFullscreen;
    
    if (this.isFullscreen) {
      // 1. 加入 CSS 滿版類別 (撐滿瀏覽器視窗)
      document.body.classList.add("fullscreen-mode");
      this.fullscreenIcon.textContent = "fullscreen_exit";
      this.fullscreenBtn.title = "退出滿版";
    } else {
      // 1. 移除 CSS 滿版類別 (恢復原本大小並置中)
      document.body.classList.remove("fullscreen-mode");
      this.fullscreenIcon.textContent = "fullscreen";
      this.fullscreenBtn.title = "滿版模式";
    }
    
    // 等待 CSS 轉場動畫結束後，重新繪製聲波圖大小，避免圖形變形
    setTimeout(() => this.resizeWaveformCanvas(), 300);
  }

  // 切換播放/暫停
  togglePlayPause() {
    if (this.playlist.length === 0) return;
    if (this.isPlaying) {
      this.pause();
    } else {
      this.play();
    }
  }

  // 更新播放/暫停按鈕
  updatePlayPauseButton() {
    this.playPauseIcon.textContent = this.isPlaying ? "pause" : "play_arrow";
  }

  // 播放
  play() {
    if (this.playlist.length > 0) {
      if (!this.audioPlayer.src) {
        this.playTrack(0);
        return;
      }
      this.audioPlayer.play();
    }
  }

  // 暫停
  pause() {
    this.audioPlayer.pause();
  }

  // 停止
  stop() {
    this.audioPlayer.pause();
    this.audioPlayer.currentTime = 0;
  }

  // 播放指定曲目
  playTrack(index) {
    if (index >= 0 && index < this.playlist.length) {
      if (this.playlist[index].enabled) {
        this.currentIndex = index;
        this.audioPlayer.src = this.playlist[index].src;
        const nameWithoutExtension = this.playlist[index].name.replace(/\.[^/.]+$/, "");
        this.currentTrack.textContent = nameWithoutExtension;
        this.audioPlayer.playbackRate = this.currentPlaybackRate;
        this.currentRepeatCount = 0; // 重置重複播放計數
        this.play();
        this.updatePlaylistView();

        // 保存當前狀態到 localStorage
        this.saveToLocalStorage();

        // 如果播放清單不是折疊狀態，確保當前播放項目在視圖中
        if (!this.playlistElement.classList.contains("collapsed")) {
          setTimeout(() => this.scrollToCurrentTrack(), 100);
        }

        // 載入聲波圖
        this.loadAudioData(this.playlist[index].src);
      } else {
        this.playNext();
      }
    }
  }

  // 滾動到當前播放的曲目
  scrollToCurrentTrack() {
    if (this.currentIndex < 0 || this.playlist.length === 0) return;

    // 找到當前播放的曲目元素
    const currentTrackElement = this.playlistContainer.querySelector(".playlist-item.active");
    if (!currentTrackElement) return;

    // 獲取容器和元素的位置信息
    const container = this.playlistContainer;
    const rect = currentTrackElement.getBoundingClientRect();
    const containerRect = container.getBoundingClientRect();

    // 計算元素相對於容器的位置
    const isInView = rect.top >= containerRect.top && rect.bottom <= containerRect.bottom;

	// 如果元素不在可視區域內，則滾動
	if (!isInView) {
	  // 將元素滾動到容器頂部位置，添加10px的偏移量
	  container.scrollTop = currentTrackElement.offsetTop - 3;
	}
  }

  // 添加到播放清單
  addToPlaylist(track) {
    if (!this.playlist.some((t) => t.src === track.src)) {
      // 新增 enabled 屬性，預設為 true
      track.enabled = true;
      this.playlist.push(track);
      if (this.isShuffleMode) {
        this.shuffleIndices = this.generateShuffleIndices();
      }
      this.updatePlaylistView();
      // 如果是第一首歌，只設置來源但不播放
      if (this.playlist.length === 1) {
        this.currentIndex = 0;
        this.audioPlayer.src = this.playlist[0].src;
        const nameWithoutExtension = this.playlist[0].name.replace(/\.[^/.]+$/, "");
        this.currentTrack.textContent = nameWithoutExtension;

        // 載入聲波圖
        this.loadAudioData(this.playlist[0].src);
      }

      // 保存到本地儲存
      this.saveToLocalStorage();

      // 更新新增按鈕位置
      this.updateAddButtonPosition();
    }
  }

  // 更新播放清單視圖
  updatePlaylistView() {
    const hasItems = this.playlist.length > 0;
    const toolButtons = document.querySelectorAll(".tool-btn");
    toolButtons.forEach((btn) => {
      btn.disabled = !hasItems;
    });

    // 更新新增按鈕位置
    this.updateAddButtonPosition();

    this.playlistContainer.innerHTML = "";
    this.playlist.forEach((track, index) => {
      const trackElement = document.createElement("div");
      trackElement.classList.add("playlist-item");
      if (index === this.currentIndex) {
        trackElement.classList.add("active");
      }

      // 核取方塊的事件處理
      const checkbox = document.createElement("input");
      checkbox.type = "checkbox";
      checkbox.checked = track.enabled;
      checkbox.classList.add("playlist-item-checkbox");
      checkbox.addEventListener("click", (e) => {
        // 阻止事件冒泡,這樣就不會觸發父元素的點擊事件
        e.stopPropagation();
        track.enabled = checkbox.checked;
        // 如果目前播放的曲目被禁用,自動播放下一首
        if (index === this.currentIndex && !track.enabled && this.isPlaying) {
          this.playNext();
        }
      });

      const numberSpan = document.createElement("span");
      numberSpan.textContent = `${index + 1}`;
      numberSpan.classList.add("playlist-item-number");

      const nameSpan = document.createElement("span");
      const nameWithoutExtension = track.name.replace(/\.[^/.]+$/, "");
      nameSpan.textContent = nameWithoutExtension;
      nameSpan.classList.add("playlist-item-name");
      if (this.isMultilineNameDisplay) {
        nameSpan.classList.add("multiline");
      }

      const removeBtn = document.createElement("span");
      removeBtn.textContent = "×";
      removeBtn.classList.add("playlist-item-remove");
      removeBtn.title = "移除";
      removeBtn.addEventListener("click", (e) => {
        e.stopPropagation();
        this.removeFromPlaylist(index);
      });

      trackElement.appendChild(checkbox);
      trackElement.appendChild(numberSpan);
      trackElement.appendChild(nameSpan);
      trackElement.appendChild(removeBtn);

      trackElement.addEventListener("click", () => {
        if (track.enabled) {
          this.playTrack(index);
        }
      });

      this.playlistContainer.appendChild(trackElement);
    });
  }

  // 從播放清單移除
  removeFromPlaylist(index) {
    // 根據設定決定是否需要確認
    if (!this.confirmDelete || confirm("確定要移除此項目嗎？")) {
      const wasPlaying = this.isPlaying;
      const removingCurrentTrack = index === this.currentIndex;

      this.playlist.splice(index, 1);

      if (this.isShuffleMode) {
        this.shuffleIndices = this.generateShuffleIndices();
      }

      if (this.playlist.length === 0) {
        this.stop();
        this.audioPlayer.src = "";
        this.currentTrack.textContent = "未選擇音樂";
        this.currentIndex = 0;

        // 清除聲波圖
        this.isWaveformLoaded = false;
        this.drawWaveform();
      } else if (removingCurrentTrack) {
        if (index >= this.playlist.length) {
          this.currentIndex = 0;
        }
        this.playTrack(this.currentIndex);
        if (!wasPlaying) {
          this.pause();
        }
      } else if (index < this.currentIndex) {
        this.currentIndex--;
      }

      this.updatePlaylistView();
      this.saveToLocalStorage();

      // 更新新增按鈕位置
      this.updateAddButtonPosition();
    }
  }

  // 更新進度條
  updateProgressBar() {
    if (!isNaN(this.audioPlayer.duration)) {
      const progress = (this.audioPlayer.currentTime / this.audioPlayer.duration) * 100;
      this.progressBar.style.width = `${progress}%`;
      this.currentTimeDisplay.textContent = this.formatTime(this.audioPlayer.currentTime);
      this.durationDisplay.textContent = this.formatTime(this.audioPlayer.duration);
    }
  }

  // 跳轉進度
  seekProgress(e) {
    if (!this.audioPlayer.duration || isNaN(this.audioPlayer.duration)) return;

    const rect = this.progressContainer.getBoundingClientRect();
    const clickPosition = (e.clientX - rect.left) / rect.width;
    this.audioPlayer.currentTime = clickPosition * this.audioPlayer.duration;
  }

  // 格式化時間
  formatTime(seconds) {
    if (isNaN(seconds)) return "00:00";
    const minutes = Math.floor(seconds / 60);
    seconds = Math.floor(seconds % 60);
    return `${minutes.toString().padStart(2, "0")}:${seconds.toString().padStart(2, "0")}`;
  }

  // 從URL提取檔名
  extractFileName(url) {
    try {
      const parsedUrl = new URL(url);
      const pathParts = parsedUrl.pathname.split("/");
      let fileName = decodeURIComponent(pathParts[pathParts.length - 1]);

      // 如果檔名為空或只有副檔名，則使用主機名稱
      if (!fileName || fileName.startsWith(".")) {
        fileName = parsedUrl.hostname + (fileName || "");
      }

      // 移除查詢參數
      fileName = fileName.split("?")[0];

      // 處理 Google Drive 檔案
      if (url.includes("drive.google.com")) {
        if (fileName === "uc") {
          // 從查詢參數中提取檔案 ID
          const fileId = parsedUrl.searchParams.get("id");
          if (fileId) {
            fileName = `GoogleDrive-${fileId}`;
          } else {
            fileName = "GoogleDrive-File";
          }
        }
      }

      return fileName || "未知音樂";
    } catch (e) {
      console.error("解析 URL 失敗:", e);
      // 如果無法解析 URL，嘗試從字串中提取檔名
      const parts = url.split("/");
      return parts[parts.length - 1] || "未知音樂";
    }
  }
}

// 初始化播放器
const musicPlayer = new MusicPlayer();