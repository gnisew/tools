class MusicPlayer {
  constructor() {
    this.audioPlayer = new Audio()
    this.playlist = []
    this.currentIndex = 0
    this.isPlaying = false
    this.loopMode = "none" // none, single, all
    this.isShuffleMode = false
    this.isAutoNextMode = true
    this.shuffleIndices = []
    this.initElements()
    this.initEventListeners()
    this.currentPlaybackRate = 1.0
    this.playlist = []
    this.repeatCount = 1
    this.currentRepeatCount = 0
    this.selectedFiles = [] // 儲存選擇的檔案;
    this.initLocalStorage() // 初始化本地儲存;
    this.exportBtn = document.getElementById("exportBtn")

    this.isMultilineNameDisplay = false

    // 排序方向追踪
    this.isSortAscending = true // 勾選項目排序方向
    this.isSortAllAscending = true // 全部排序方向

    // 刪除確認設定
    this.confirmDelete = true // 預設需要確認刪除

    // 按鈕顯示設定
    this.buttonVisibility = {
      prevBtn: false, // 預設顯示前一首按鈕
      nextBtn: false, // 預設顯示下一首按鈕
      loopBtn: false, // 預設顯示循環按鈕
      shuffleBtn: false, // 預設顯示隨機按鈕
      speedControl: false, // 預設不顯示速度控制
      repeatControl: false, // 預設不顯示重複次數控制
    }

    this.initSettingsPanel()
    this.initPlaylistResize()

    // 初始化聲波圖
    this.initWaveform()

    // 初始化播放清單調整功能
    this.initPlaylistResize()

    // 應用按鈕顯示設定
    this.applyButtonVisibility()

    // 創建工具列控制項
    //this.createToolbarControls()

    // 頁面載入後嘗試重新載入聲波圖
    this.tryReloadWaveformAfterPageLoad()

    // 檢查播放清單是否為空，並更新按鈕位置
    this.updateAddButtonPosition()
  }

  // 更新新增按鈕位置
  updateAddButtonPosition() {
    const playlistElement = document.querySelector(".playlist")
    if (this.playlist.length === 0) {
      // 播放清單為空時，添加 playlist-empty 類別
      playlistElement.classList.add("playlist-empty")
    } else {
      // 播放清單有檔案時，移除 playlist-empty 類別
      playlistElement.classList.remove("playlist-empty")
    }
  }

  // 新增方法：頁面載入後嘗試重新載入聲波圖
  tryReloadWaveformAfterPageLoad() {
    // 確保播放清單已經從 localStorage 載入
    setTimeout(() => {
      if (this.playlist.length > 0 && this.currentIndex >= 0 && this.currentIndex < this.playlist.length) {
        const currentTrack = this.playlist[this.currentIndex]

        // 顯示載入中提示
        if (this.waveformLoading) {
          this.waveformLoading.style.display = "flex"
          this.waveformLoading.textContent = "重新載入聲波圖..."
        }

        // 嘗試重新載入音訊檔案以生成聲波圖
        this.reloadAudioForWaveform(currentTrack)
      }

      // 在播放清單載入後檢查並更新按鈕位置
      this.updateAddButtonPosition()
    }, 500) // 給予一些時間讓播放清單從 localStorage 載入
  }

  // 新增方法：重新載入音訊檔案以生成聲波圖
  reloadAudioForWaveform(track) {
    if (!track) return

    // 根據音訊來源類型處理
    if (track.type === "file" && track.basePath) {
      const fullPath = `${track.basePath}/${track.name}`

      console.log("嘗試重新載入音訊檔案:", fullPath)

      // 使用 fetch 嘗試載入音訊檔案
      fetch(fullPath)
        .then((response) => {
          if (!response.ok) {
            throw new Error(`無法載入音訊檔案: ${response.status} ${response.statusText}`)
          }
          return response.arrayBuffer()
        })
        .then((arrayBuffer) => {
          // 成功載入音訊檔案，更新聲波圖
          console.log("成功載入音訊檔案，更新聲波圖")

          // 創建音訊上下文
          if (!this.audioContext) {
            this.audioContext = new (window.AudioContext || window.webkitAudioContext)()
          }

          return this.audioContext.decodeAudioData(arrayBuffer)
        })
        .then((audioBuffer) => {
          this.audioBuffer = audioBuffer
          this.isWaveformLoaded = true
          if (this.waveformLoading) {
            this.waveformLoading.style.display = "none"
          }
          this.drawWaveform()
        })
        .catch((error) => {
          console.error("重新載入音訊檔案失敗:", error)

          // 如果直接載入失敗，嘗試使用 Audio 元素間接載入
          this.fallbackAudioLoad(track)
        })
    } else if (track.src) {
      // 對於其他類型的音訊來源，直接使用 src
      this.loadAudioData(track.src)
    }
  }

  // 新增方法：備用音訊載入方式
  fallbackAudioLoad(track) {
    console.log("使用備用方法載入音訊...")

    // 創建一個臨時的 Audio 元素
    const tempAudio = new Audio()

    // 設置音訊來源
    if (track.type === "file" && track.basePath) {
      tempAudio.src = `${track.basePath}/${track.name}`
    } else if (track.src) {
      tempAudio.src = track.src
    } else {
      if (this.waveformLoading) {
        this.waveformLoading.style.display = "none"
        this.waveformLoading.textContent = "載入中..."
      }
      console.error("無法確定音訊來源")
      return
    }

    // 監聽載入事件
    tempAudio.addEventListener("loadedmetadata", () => {
      console.log("音訊元數據已載入")

      // 使用 MediaElementSourceNode 連接音訊元素
      if (!this.audioContext) {
        this.audioContext = new (window.AudioContext || window.webkitAudioContext)()
      }

      const source = this.audioContext.createMediaElementSource(tempAudio)

      // 創建分析器節點
      const analyser = this.audioContext.createAnalyser()
      analyser.fftSize = 2048

      // 連接節點
      source.connect(analyser)

      // 創建數據數組
      const bufferLength = analyser.frequencyBinCount
      const dataArray = new Float32Array(bufferLength)

      // 模擬音訊緩衝區
      this.audioBuffer = {
        duration: tempAudio.duration,
        sampleRate: this.audioContext.sampleRate,
        getChannelData: () => {
          // 獲取當前音訊數據
          analyser.getFloatTimeDomainData(dataArray)
          return dataArray
        },
        length: bufferLength,
      }

      this.isWaveformLoaded = true
      if (this.waveformLoading) {
        this.waveformLoading.style.display = "none"
      }

      // 繪製聲波圖
      this.drawWaveform()

      // 斷開連接並釋放資源
      source.disconnect()
      tempAudio.pause()
      tempAudio.src = ""
    })

    // 監聽錯誤事件
    tempAudio.addEventListener("error", (e) => {
      console.error("備用音訊載入失敗:", e)
      if (this.waveformLoading) {
        this.waveformLoading.style.display = "none"
        this.waveformLoading.textContent = "載入中..."
      }
    })

    // 開始載入
    tempAudio.load()
  }

  // 修改原有的 loadAudioData 方法，增加錯誤處理和備用方案
  loadAudioData(audioUrl) {
    if (!audioUrl) return

    this.isWaveformLoaded = false
    this.waveformLoading.style.display = "flex"

    // 創建音訊上下文
    if (!this.audioContext) {
      this.audioContext = new (window.AudioContext || window.webkitAudioContext)()
    }

    // 獲取音訊數據
    fetch(audioUrl)
      .then((response) => {
        if (!response.ok) {
          throw new Error(`無法載入音訊檔案: ${response.status} ${response.statusText}`)
        }
        return response.arrayBuffer()
      })
      .then((arrayBuffer) => this.audioContext.decodeAudioData(arrayBuffer))
      .then((audioBuffer) => {
        this.audioBuffer = audioBuffer
        this.isWaveformLoaded = true
        this.waveformLoading.style.display = "none"
        this.drawWaveform()
      })
      .catch((error) => {
        console.error("載入音訊數據失敗:", error)

        // 如果直接載入失敗，嘗試使用備用方法
        const currentTrack = this.playlist[this.currentIndex]
        if (currentTrack) {
          this.fallbackAudioLoad(currentTrack)
        } else {
          this.waveformLoading.style.display = "none"
        }
      })
  }

  initElements() {
    // 原有的元素
    this.sortBtn = document.getElementById("sortBtn")
    this.playPauseBtn = document.getElementById("playPauseBtn")
    this.playPauseIcon = document.getElementById("playPauseIcon")
    this.prevBtn = document.getElementById("prevBtn")
    this.stopBtn = document.getElementById("stopBtn")
    this.nextBtn = document.getElementById("nextBtn")
    this.progressBar = document.getElementById("progressBar")
    this.progressContainer = document.getElementById("progressContainer")
    this.currentTimeDisplay = document.getElementById("currentTime")
    this.durationDisplay = document.getElementById("duration")
    this.playlistContainer = document.getElementById("playlistContainer")
    this.speedSelect = document.getElementById("speedSelect")
    this.currentTrack = document.getElementById("currentTrack")
    this.volumeSlider = document.getElementById("volumeSlider")
    this.volumeValue = document.getElementById("volumeValue")
    this.loopBtn = document.getElementById("loopBtn")
    this.shuffleBtn = document.getElementById("shuffleBtn")
    this.clearPlaylistBtn = document.getElementById("clearPlaylistBtn")
    this.clearPlaylistBtn.title = "清除已勾選項目"
    this.exportBtn = document.getElementById("exportBtn")
    this.repeatSelect = document.getElementById("repeatSelect")
    this.playlistTools = document.querySelector(".playlist-tools")
    this.checkAllBtn = document.getElementById("checkAllBtn")
    this.sortAllBtn = document.getElementById("sortAllBtn")
    // 新增的元素
    this.addMusicBtn = document.getElementById("addMusicBtn")
    this.addMusicModal = document.getElementById("addMusicModal")
    this.closeModal = document.getElementById("closeModal")
    this.audioFile = document.getElementById("audioFile")
    this.audioUrls = document.getElementById("audioUrls")
    this.tabButtons = document.querySelectorAll(".tab-button")
    this.tabContents = document.querySelectorAll(".tab-content")
    this.confirmUrlsBtn = document.getElementById("confirmUrls")
    this.fileInfo = document.getElementById("fileInfo")
    this.fileCount = document.getElementById("fileCount")
    this.fileList = document.getElementById("fileList")
    this.basePath = document.getElementById("basePath")
    this.confirmFiles = document.getElementById("confirmFiles")
    this.clearFiles = document.getElementById("clearFiles")
    this.clearUrls = document.getElementById("clearUrls")
    this.toggleNameDisplayBtn = document.getElementById("toggleNameDisplayBtn")

    // 工具列切換按鈕
    this.toolToggleBtn = document.getElementById("toolToggleBtn")

    // 聲波圖相關元素
    this.waveformCanvas = document.getElementById("waveformCanvas")
    this.waveformLoading = document.getElementById("waveformLoading")
    this.viewModeBtn = document.getElementById("viewModeBtn")
    this.zoomInBtn = document.getElementById("zoomInBtn")
    this.zoomOutBtn = document.getElementById("zoomOutBtn")
    this.resetZoomBtn = document.getElementById("resetZoomBtn")
    this.waveformViewSetting = document.getElementById("waveformViewSetting")

    // 播放清單調整相關元素
    this.playlistResizeBtn = document.getElementById("playlistResizeBtn")
    this.playlistElement = document.querySelector(".playlist")
    this.mainPlayerElement = document.querySelector(".main-player")

    // 設定按鈕
    this.settingsBtn = document.getElementById("settingsBtn")
  }

  // 應用按鈕顯示設定
  applyButtonVisibility() {
    // 設定、播放/暫停、停止按鈕必須顯示
    this.settingsBtn.style.display = "inline-flex"
    this.playPauseBtn.style.display = "inline-flex"
    this.stopBtn.style.display = "inline-flex"

    // 其他按鈕根據設定顯示或隱藏
    this.prevBtn.style.display = this.buttonVisibility.prevBtn ? "inline-flex" : "none"
    this.nextBtn.style.display = this.buttonVisibility.nextBtn ? "inline-flex" : "none"
    this.loopBtn.style.display = this.buttonVisibility.loopBtn ? "inline-flex" : "none"
    this.shuffleBtn.style.display = this.buttonVisibility.shuffleBtn ? "inline-flex" : "none"

    // 更新工具列控制項顯示
    if (this.speedControlContainer) {
      this.speedControlContainer.style.display = this.buttonVisibility.speedControl ? "flex" : "none"
    }

    if (this.repeatControlContainer) {
      this.repeatControlContainer.style.display = this.buttonVisibility.repeatControl ? "flex" : "none"
    }
  }

  // 初始化播放清單調整功能
  initPlaylistResize() {
    // 檢查是否有本地存儲的播放清單狀態
    const playlistState = localStorage.getItem("playlistState")
    if (playlistState) {
      if (playlistState === "collapsed") {
        this.playlistElement.classList.add("collapsed")
        this.updateResizeButton(true)
      } else if (playlistState === "expanded") {
        this.playlistElement.classList.add("expanded")
        this.updateResizeButton(false)
      }
    }

    // 添加調整按鈕事件
    this.playlistResizeBtn.addEventListener("click", () => {
      // 檢查當前狀態
      if (this.playlistElement.classList.contains("collapsed")) {
        // 如果是折疊狀態，展開到正常狀態
        this.playlistElement.classList.remove("collapsed")
        this.playlistElement.classList.remove("expanded")
        localStorage.setItem("playlistState", "normal")
        this.updateResizeButton(false)
      } else if (this.playlistElement.classList.contains("expanded")) {
        // 如果是展開狀態，折疊
        this.playlistElement.classList.remove("expanded")
        this.playlistElement.classList.add("collapsed")
        localStorage.setItem("playlistState", "collapsed")
        this.updateResizeButton(true)
      } else {
        // 如果是正常狀態，展開
        this.playlistElement.classList.add("expanded")
        localStorage.setItem("playlistState", "expanded")
        this.updateResizeButton(false)
      }

      // 重新調整聲波圖大小
      setTimeout(() => {
        this.resizeWaveformCanvas()
      }, 300) // 等待CSS過渡效果完成
    })

    this.playlistResizeBtn.addEventListener("click", () => {
      // 檢查當前狀態
      if (this.playlistElement.classList.contains("collapsed")) {
        // 如果是折疊狀態，展開到正常狀態
        this.playlistElement.classList.remove("collapsed")
        this.playlistElement.classList.remove("expanded")
        localStorage.setItem("playlistState", "normal")
        this.updateResizeButton(false)
      } else if (this.playlistElement.classList.contains("expanded")) {
        // 如果是展開狀態，折疊
        this.playlistElement.classList.remove("expanded")
        this.playlistElement.classList.add("collapsed")
        localStorage.setItem("playlistState", "collapsed")
        this.updateResizeButton(true)
      } else {
        // 如果是正常狀態，展開
        this.playlistElement.classList.add("expanded")
        localStorage.setItem("playlistState", "expanded")
        this.updateResizeButton(false)
      }

      // 重新調整聲波圖大小
      setTimeout(() => {
        this.resizeWaveformCanvas()

        // 如果不是折疊狀態且有正在播放的曲目，確保它在視圖中
        if (!this.playlistElement.classList.contains("collapsed") && this.currentIndex >= 0) {
          this.scrollToCurrentTrack()
        }
      }, 300) // 等待CSS過渡效果完成
    })

    // 監聽窗口大小變化，重新調整聲波圖
    window.addEventListener("resize", () => {
      this.resizeWaveformCanvas()
    })
  }

  // 更新調整按鈕圖標
  updateResizeButton(isCollapsed) {
    if (isCollapsed) {
      this.playlistResizeBtn.innerHTML = '<span class="material-icons">chevron_left</span>'
      this.playlistResizeBtn.title = "展開播放清單"
    } else {
      this.playlistResizeBtn.innerHTML = '<span class="material-icons">chevron_right</span>'
      this.playlistResizeBtn.title = "收合播放清單"
    }
  }

  initWaveform() {
    // 聲波圖相關變數
    this.audioContext = null
    this.audioBuffer = null
    this.waveformCtx = this.waveformCanvas.getContext("2d")
    this.zoomLevel = 1
    this.viewMode = "waveform" // 'waveform' 或 'line'
    this.isWaveformLoaded = false

    // 設置畫布尺寸
    this.resizeWaveformCanvas()

    // 添加聲波圖相關事件監聽
    window.addEventListener("resize", () => this.resizeWaveformCanvas())

    this.viewModeBtn.addEventListener("click", () => {
      this.viewMode = this.viewMode === "waveform" ? "line" : "waveform"
      this.waveformViewSetting.value = this.viewMode
      this.updateViewModeButton()
      this.drawWaveform()
    })

    this.zoomInBtn.addEventListener("click", () => {
      this.zoomLevel = Math.min(this.zoomLevel * 1.5, 10)
      this.drawWaveform()
    })

    this.zoomOutBtn.addEventListener("click", () => {
      this.zoomLevel = Math.max(this.zoomLevel / 1.5, 1)
      this.drawWaveform()
    })

    this.resetZoomBtn.addEventListener("click", () => {
      this.zoomLevel = 1
      this.drawWaveform()
    })

    this.waveformCanvas.addEventListener("click", (e) => {
      if (!this.audioBuffer || !this.isWaveformLoaded) return

      const rect = this.waveformCanvas.getBoundingClientRect()
      const x = e.clientX - rect.left
      const width = this.waveformCanvas.width

      // 計算縮放後的可見區域
      const duration = this.audioBuffer.duration
      const visibleDuration = duration / this.zoomLevel
      const startTime = Math.max(0, this.audioPlayer.currentTime - visibleDuration / 2)
      const endTime = Math.min(duration, startTime + visibleDuration)

      // 計算點擊位置對應的時間
      const clickTime = startTime + (x / width) * (endTime - startTime)

      // 設置音訊播放時間
      this.audioPlayer.currentTime = clickTime
    })

    // 設定面板中的聲波圖檢視模式選擇
    this.waveformViewSetting.addEventListener("change", (e) => {
      this.viewMode = e.target.value
      this.updateViewModeButton()
      this.drawWaveform()
    })
  }

  updateViewModeButton() {
    if (this.viewMode === "waveform") {
      this.viewModeBtn.innerHTML = '<span class="material-icons">graphic_eq</span>'
      this.viewModeBtn.title = "切換至線段檢視"
    } else {
      this.viewModeBtn.innerHTML = '<span class="material-icons">show_chart</span>'
      this.viewModeBtn.title = "切換至聲波檢��"
    }
  }

  resizeWaveformCanvas() {
    if (this.waveformCanvas) {
      // 獲取當前畫布的實際寬度
      const containerWidth = this.waveformCanvas.parentElement.clientWidth

      // 設置畫布尺寸
      this.waveformCanvas.width = containerWidth
      this.waveformCanvas.height = this.waveformCanvas.clientHeight

      // 重繪波形
      this.drawWaveform()
    }
  }

  // 修改原有的 loadAudioData 方法，增加錯誤處理和備用方案
  loadAudioData(audioUrl) {
    if (!audioUrl) return

    this.isWaveformLoaded = false
    this.waveformLoading.style.display = "flex"

    // 創建音訊上下文
    if (!this.audioContext) {
      this.audioContext = new (window.AudioContext || window.webkitAudioContext)()
    }

    // 獲取音訊數據
    fetch(audioUrl)
      .then((response) => {
        if (!response.ok) {
          throw new Error(`無法載入音訊檔案: ${response.status} ${response.statusText}`)
        }
        return response.arrayBuffer()
      })
      .then((arrayBuffer) => this.audioContext.decodeAudioData(arrayBuffer))
      .then((audioBuffer) => {
        this.audioBuffer = audioBuffer
        this.isWaveformLoaded = true
        this.waveformLoading.style.display = "none"
        this.drawWaveform()
      })
      .catch((error) => {
        console.error("載入音訊數據失敗:", error)

        // 如果直接載入失敗，嘗試使用備用方法
        const currentTrack = this.playlist[this.currentIndex]
        if (currentTrack) {
          this.fallbackAudioLoad(currentTrack)
        } else {
          this.waveformLoading.style.display = "none"
        }
      })
  }

  drawWaveform() {
    const canvas = this.waveformCanvas
    const ctx = this.waveformCtx

    if (!canvas || !ctx) return

    // 清除畫布
    ctx.clearRect(0, 0, canvas.width, canvas.height)

    // 繪製背景
    ctx.fillStyle = "#f8f8f8"
    ctx.fillRect(0, 0, canvas.width, canvas.height)

    if (!this.audioBuffer || !this.isWaveformLoaded) {
      // 如果沒有音訊數據，顯示提示文字
      ctx.fillStyle = "#999"
      ctx.font = "14px Arial"
      ctx.textAlign = "center"
      ctx.fillText("請選擇音樂檔案以顯示聲波圖", canvas.width / 2, canvas.height / 2)
      return
    }

    // 獲取音訊數據
    const channelData = this.audioBuffer.getChannelData(0)
    const duration = this.audioBuffer.duration

    // 計算縮放後的可見區域
    const visibleDuration = duration / this.zoomLevel

    // 修改這裡：不再根據當前播放位置調整可見區域的起始和結束時間
    // 原來的代碼會在接近末尾時自動調整視圖，導致看起來像是放大了
    // 改為固定從頭到尾顯示整個音頻，只受縮放等級影響

    // 原代碼：
    // const startTime = Math.max(0, this.audioPlayer.currentTime - visibleDuration / 2)
    // const endTime = Math.min(duration, startTime + visibleDuration)

    // 新代碼：
    let startTime = 0
    let endTime = duration

    // 如果有縮放，則根據縮放等級和當前播放位置計算可見區域
    if (this.zoomLevel > 1) {
      // 計算可見區域的一半寬度
      const halfVisibleDuration = visibleDuration / 2

      // 計算中心點，確保當前播放位置在可見區域中間
      const centerTime = this.audioPlayer.currentTime

      // 確保可見區域不會超出音頻範圍
      startTime = Math.max(0, centerTime - halfVisibleDuration)
      endTime = Math.min(duration, centerTime + halfVisibleDuration)

      // 如果可見區域長度小於預期，調整起始或結束時間
      if (endTime - startTime < visibleDuration) {
        if (startTime === 0) {
          // 如果已經到達開頭，則延長結束時間
          endTime = Math.min(duration, visibleDuration)
        } else if (endTime === duration) {
          // 如果已經到達結尾，則提前起始時間
          startTime = Math.max(0, duration - visibleDuration)
        }
      }
    }

    // 計算採樣點
    const startSample = Math.floor(startTime * this.audioBuffer.sampleRate)
    const endSample = Math.floor(endTime * this.audioBuffer.sampleRate)
    const samplesPerPixel = Math.max(1, Math.floor((endSample - startSample) / canvas.width))

    // 繪製時間軸
    ctx.fillStyle = "#e9ecef"
    const currentTimePixel = ((this.audioPlayer.currentTime - startTime) / (endTime - startTime)) * canvas.width
    if (currentTimePixel >= 0 && currentTimePixel <= canvas.width) {
      ctx.fillRect(currentTimePixel, 0, 2, canvas.height)
    }

    // 繪製波形
    ctx.strokeStyle = "#4CAF50"
    ctx.lineWidth = 2
    ctx.beginPath()

    const centerY = canvas.height / 2

    if (this.viewMode === "waveform") {
      // 波形模式
      for (let x = 0; x < canvas.width; x++) {
        const sampleIndex = startSample + Math.floor((x * (endSample - startSample)) / canvas.width)

        if (sampleIndex < channelData.length) {
          // 計算每個像素的最大和最小值
          let minSample = 1.0
          let maxSample = -1.0

          for (let j = 0; j < samplesPerPixel && sampleIndex + j < channelData.length; j++) {
            const sampleValue = channelData[sampleIndex + j]
            minSample = Math.min(minSample, sampleValue)
            maxSample = Math.max(maxSample, sampleValue)
          }

          // 繪製垂直線段
          ctx.moveTo(x, centerY + minSample * centerY * 0.9)
          ctx.lineTo(x, centerY + maxSample * centerY * 0.9)
        }
      }
    } else {
      // 線段模式
      ctx.moveTo(0, centerY)

      for (let x = 0; x < canvas.width; x++) {
        const sampleIndex = startSample + Math.floor((x * (endSample - startSample)) / canvas.width)

        if (sampleIndex < channelData.length) {
          // 計算每個像素的平均值
          let sum = 0
          let count = 0

          for (let j = 0; j < samplesPerPixel && sampleIndex + j < channelData.length; j++) {
            sum += channelData[sampleIndex + j]
            count++
          }

          const avgSample = count > 0 ? sum / count : 0
          ctx.lineTo(x, centerY + avgSample * centerY * 0.9)
        }
      }
    }

    ctx.stroke()

    // 繪製時間標記
    ctx.fillStyle = "#666"
    ctx.font = "12px Arial"
    ctx.textAlign = "center"

    const timeStep = Math.ceil(visibleDuration / 10)
    for (let t = Math.ceil(startTime); t <= endTime; t += timeStep) {
      const x = ((t - startTime) / (endTime - startTime)) * canvas.width
      const minutes = Math.floor(t / 60)
      const seconds = Math.floor(t % 60)
      const timeText = `${minutes}:${seconds.toString().padStart(2, "0")}`

      ctx.fillText(timeText, x, canvas.height - 5)
    }
  }

  // 修改 initLocalStorage 方法，增加對音訊檔案路徑的處理
  // 在 initLocalStorage 方法中添加工具列狀態的讀取
  initLocalStorage() {
    const savedPlaylist = localStorage.getItem("musicPlaylist")
    if (savedPlaylist) {
      try {
        const parsed = JSON.parse(savedPlaylist)
        parsed.forEach((item) => {
          if (item.type === "file" && item.basePath) {
            const fullPath = `${item.basePath}/${item.name}`
            this.addToPlaylist({
              name: item.name,
              src: fullPath,
              type: "file",
              basePath: item.basePath,
            })
          } else if (item.type === "url") {
            // 處理 URL 類型的音樂
            this.addToPlaylist({
              name: item.name,
              src: item.src,
              type: "url",
            })
          }
        })

        // 在載入播放清單後，嘗試恢復當前播放的曲目
        const savedCurrentIndex = localStorage.getItem("currentTrackIndex")
        if (savedCurrentIndex !== null && this.playlist.length > 0) {
          const index = Number.parseInt(savedCurrentIndex)
          if (!isNaN(index) && index >= 0 && index < this.playlist.length) {
            this.currentIndex = index
            this.audioPlayer.src = this.playlist[index].src
            const nameWithoutExtension = this.playlist[index].name.replace(/\.[^/.]+$/, "")
            this.currentTrack.textContent = nameWithoutExtension
          }
        }
      } catch (e) {
        console.error("載入播放清單失敗:", e)
      }
    }

    // 載入刪除確認設定
    const confirmDelete = localStorage.getItem("confirmDelete")
    if (confirmDelete !== null) {
      this.confirmDelete = confirmDelete === "true"
    }

    // 載入按鈕顯示設定
    const buttonVisibility = localStorage.getItem("buttonVisibility")
    if (buttonVisibility) {
      try {
        this.buttonVisibility = JSON.parse(buttonVisibility)
      } catch (e) {
        console.error("載入按鈕顯示設定失敗:", e)
      }
    }

    // 載入工具列顯示狀態
    const toolsExpanded = localStorage.getItem("toolsExpanded")
    if (toolsExpanded !== null) {
      if (toolsExpanded === "true") {
        this.playlistTools.classList.add("expanded")
        this.updateToolToggleButton(true)
      }
    }
  }

  initSettingsPanel() {
    this.settingsBtn = document.getElementById("settingsBtn")
    this.settingsPanel = document.getElementById("settingsPanel")
    this.closeSettings = document.getElementById("closeSettings")

    // 設定控制項
    this.autoNextSetting = document.getElementById("autoNextSetting")
    this.speedSetting = document.getElementById("speedSetting")
    this.repeatSetting = document.getElementById("repeatSetting")
    this.volumeSetting = document.getElementById("volumeSetting")
    this.volumeSettingValue = document.getElementById("volumeSettingValue")

    // 新增設定面板樣式
    this.updateSettingsPanelStyle()

    // 新增刪除確認設定
    // 檢查是否已存在該元素，如果不存在則創建
    if (!document.getElementById("confirmDeleteSetting")) {
      // 創建刪除確認設定的容器
      const confirmDeleteContainer = document.createElement("div")
      confirmDeleteContainer.className = "settings-item"

      // 創建標籤
      const label = document.createElement("label")
      label.htmlFor = "confirmDeleteSetting"
      label.textContent = "刪除項目時需要確認"

      // 創建複選框
      this.confirmDeleteSetting = document.createElement("input")
      this.confirmDeleteSetting.type = "checkbox"
      this.confirmDeleteSetting.id = "confirmDeleteSetting"
      this.confirmDeleteSetting.checked = this.confirmDelete

      // 將元素添加到容器中
      confirmDeleteContainer.appendChild(label)
      confirmDeleteContainer.appendChild(this.confirmDeleteSetting)

      // 將容器添加到設定面板中
      const settingsContent = this.settingsPanel.querySelector(".settings-content")
      if (settingsContent) {
        settingsContent.appendChild(confirmDeleteContainer)
      }
    } else {
      this.confirmDeleteSetting = document.getElementById("confirmDeleteSetting")
      this.confirmDeleteSetting.checked = this.confirmDelete
    }

    // 重新設計設定面板
    this.redesignSettingsPanel()

    // 初始化設定值
    this.autoNextSetting.checked = this.isAutoNextMode
    this.speedSetting.value = this.currentPlaybackRate
    this.repeatSetting.value = this.repeatCount
    this.volumeSetting.value = this.audioPlayer.volume * 100
    this.volumeSettingValue.textContent = `${Math.round(this.audioPlayer.volume * 100)}%`

    // 設定面板開關
    this.settingsBtn.addEventListener("click", (e) => {
      // 阻止事件冒泡，避免觸發document的點擊事件
      e.stopPropagation()
      this.settingsPanel.classList.add("show")
    })

    this.closeSettings.addEventListener("click", (e) => {
      // 阻止事件冒泡
      e.stopPropagation()
      this.settingsPanel.classList.remove("show")
    })

    // 防止點擊設定面板內部時關閉面板
    this.settingsPanel.addEventListener("click", (e) => {
      e.stopPropagation()
    })

    // 點擊設定面板以外的區域關閉設定面板
    document.addEventListener("click", () => {
      if (this.settingsPanel.classList.contains("show")) {
        this.settingsPanel.classList.remove("show")
      }
    })

    // 設定變更事件
    this.autoNextSetting.addEventListener("change", (e) => {
      this.isAutoNextMode = e.target.checked
    })

    this.speedSetting.addEventListener("change", (e) => {
      this.currentPlaybackRate = Number.parseFloat(e.target.value)
      this.audioPlayer.playbackRate = this.currentPlaybackRate

      // 同步工具列中的速度選擇
      if (this.toolbarSpeedSelect) {
        this.toolbarSpeedSelect.value = this.currentPlaybackRate
      }
    })

    this.repeatSetting.addEventListener("change", (e) => {
      this.repeatCount = Number.parseInt(e.target.value)
      this.currentRepeatCount = 0

      // 同步工具列中的重複次數選擇
      if (this.toolbarRepeatSelect) {
        this.toolbarRepeatSelect.value = this.repeatCount
      }
    })

    this.volumeSetting.addEventListener("input", (e) => {
      const volume = e.target.value / 100
      this.audioPlayer.volume = volume
      this.volumeSettingValue.textContent = `${e.target.value}%`
    })

    // 刪除確認設定變更事件
    this.confirmDeleteSetting.addEventListener("change", (e) => {
      this.confirmDelete = e.target.checked
      localStorage.setItem("confirmDelete", this.confirmDelete)
    })
  }

  // 重新設計設定面板
  redesignSettingsPanel() {
    // 獲取設定面板內容
    const settingsContent = this.settingsPanel.querySelector(".settings-content")
    if (!settingsContent) return

    // 清空現有內容
    settingsContent.innerHTML = ""

    // 創建設定分組
    const createSettingsGroup = (title) => {
      const group = document.createElement("div")
      group.className = "settings-group"

      const heading = document.createElement("h3")
      heading.textContent = title
      heading.className = "settings-heading"

      group.appendChild(heading)
      settingsContent.appendChild(group)

      return group
    }

    // 創建設定項
    const createSettingsItem = (group, label, control) => {
      const item = document.createElement("div")
      item.className = "settings-item"

      const labelElement = document.createElement("div")
      labelElement.className = "settings-item-label"
      labelElement.textContent = label

      const controlElement = document.createElement("div")
      controlElement.className = "settings-item-control"
      controlElement.appendChild(control)

      item.appendChild(labelElement)
      item.appendChild(controlElement)
      group.appendChild(item)

      return item
    }

    // 創建開關控制
    const createToggleControl = (id, checked, onChange) => {
      const label = document.createElement("label")
      label.className = "switch"

      const input = document.createElement("input")
      input.type = "checkbox"
      input.id = id
      input.checked = checked
      if (onChange) {
        input.addEventListener("change", onChange)
      }

      const slider = document.createElement("span")
      slider.className = "slider round"

      label.appendChild(input)
      label.appendChild(slider)

      return { container: label, input }
    }

    // 創建選擇控制
    const createSelectControl = (id, options, value, onChange) => {
      const select = document.createElement("select")
      select.id = id
      select.className = "settings-select"

      options.forEach((option) => {
        const optElement = document.createElement("option")
        optElement.value = option.value
        optElement.textContent = option.text
        // 修復這裡：確保 value 不是 undefined
        if (value !== undefined && option.value === value.toString()) {
          optElement.selected = true
        }
        select.appendChild(optElement)
      })

      if (onChange) {
        select.addEventListener("change", onChange)
      }

      return select
    }

    // 創建範圍控制
    const createRangeControl = (id, min, max, value, onChange) => {
      const container = document.createElement("div")
      container.className = "range-control"

      const range = document.createElement("input")
      range.type = "range"
      range.id = id
      range.min = min
      range.max = max
      range.value = value

      const valueDisplay = document.createElement("span")
      valueDisplay.id = `${id}Value`
      valueDisplay.textContent = `${value}%`

      if (onChange) {
        range.addEventListener("input", (e) => {
          valueDisplay.textContent = `${e.target.value}%`
          onChange(e)
        })
      }

      container.appendChild(range)
      container.appendChild(valueDisplay)

      return { container, range, valueDisplay }
    }

    // 播放設定組
    const playbackGroup = createSettingsGroup("播放設定")

    // 自動播放下一首
    const autoNextToggle = createToggleControl("autoNextSetting", this.isAutoNextMode, (e) => {
      this.isAutoNextMode = e.target.checked
    })
    this.autoNextSetting = autoNextToggle.input
    createSettingsItem(playbackGroup, "自動播放下一首", autoNextToggle.container)

    // 播放速度
    const speedOptions = [
      { value: "0.5", text: "0.50x" },
      { value: "0.7", text: "0.70x" },
      { value: "0.8", text: "0.80x" },
      { value: "0.9", text: "0.90x" },
      { value: "1", text: "1.00x" },
      { value: "1.25", text: "1.25x" },
      { value: "1.5", text: "1.50x" },
      { value: "1.75", text: "1.75x" },
      { value: "2", text: "2.00x" },
      { value: "2.5", text: "2.50x" },
      { value: "3", text: "3.00x" },
    ]

    this.speedSetting = createSelectControl("speedSetting", speedOptions, this.currentPlaybackRate, (e) => {
      this.currentPlaybackRate = Number.parseFloat(e.target.value)
      this.audioPlayer.playbackRate = this.currentPlaybackRate

      // 同步工具列中的速度選擇
      if (this.toolbarSpeedSelect) {
        this.toolbarSpeedSelect.value = this.currentPlaybackRate
      }
    })
    createSettingsItem(playbackGroup, "播放速度", this.speedSetting)

    // 重複次數
    const repeatOptions = [
      { value: "1", text: "1次" },
      { value: "2", text: "2次" },
      { value: "3", text: "3次" },
      { value: "4", text: "4次" },
      { value: "5", text: "5次" },
    ]

    this.repeatSetting = createSelectControl("repeatSetting", repeatOptions, this.repeatCount, (e) => {
      this.repeatCount = Number.parseInt(e.target.value)
      this.currentRepeatCount = 0

      // 同步工具列中的重複次數選擇
      if (this.toolbarRepeatSelect) {
        this.toolbarRepeatSelect.value = this.repeatCount
      }
    })
    createSettingsItem(playbackGroup, "重複次數", this.repeatSetting)

    // 音量
    const volumeControl = createRangeControl("volumeSetting", 0, 100, this.audioPlayer.volume * 100, (e) => {
      const volume = e.target.value / 100
      this.audioPlayer.volume = volume
    })
    this.volumeSetting = volumeControl.range
    this.volumeSettingValue = volumeControl.valueDisplay
    createSettingsItem(playbackGroup, "音量", volumeControl.container)

    // 聲波圖設定
    const waveformOptions = [
      { value: "waveform", text: "聲波" },
      { value: "line", text: "線段" },
    ]

    this.waveformViewSetting = createSelectControl("waveformViewSetting", waveformOptions, this.viewMode, (e) => {
      this.viewMode = e.target.value
      this.updateViewModeButton()
      this.drawWaveform()
    })
    createSettingsItem(playbackGroup, "聲波圖檢視", this.waveformViewSetting)

    // 刪除確認
    const confirmDeleteToggle = createToggleControl("confirmDeleteSetting", this.confirmDelete, (e) => {
      this.confirmDelete = e.target.checked
      localStorage.setItem("confirmDelete", this.confirmDelete)
    })
    this.confirmDeleteSetting = confirmDeleteToggle.input
    createSettingsItem(playbackGroup, "刪除項目時需要確認", confirmDeleteToggle.container)

    // 顯示設定組
    const displayGroup = createSettingsGroup("顯示設定")

    // 按鈕顯示設定
    const createButtonVisibilityToggle = (key, label) => {
      const toggle = createToggleControl(`${key}Visibility`, this.buttonVisibility[key], (e) => {
        this.buttonVisibility[key] = e.target.checked
        this.applyButtonVisibility()
        localStorage.setItem("buttonVisibility", JSON.stringify(this.buttonVisibility))
      })
      createSettingsItem(displayGroup, label, toggle.container)
      return toggle.input
    }

    createButtonVisibilityToggle("prevBtn", "顯示前一首按鈕")
    createButtonVisibilityToggle("nextBtn", "顯示下一首按鈕")
    createButtonVisibilityToggle("loopBtn", "顯示循環按鈕")
    createButtonVisibilityToggle("shuffleBtn", "顯示隨機按鈕")
    createButtonVisibilityToggle("speedControl", "顯示速度控制")
    createButtonVisibilityToggle("repeatControl", "顯示重複次數控制")

    // 添加自定義樣式
    const style = document.createElement("style")
    style.textContent = `
            .settings-panel {
                max-width: 350px;
                border-radius: 12px;
                box-shadow: 0 8px 24px rgba(0, 0, 0, 0.15);
                background: #fff;
                overflow: hidden;
            }
            
            .settings-header {
                display: flex;
                align-items: center;
                padding: 16px;
                background: #4CAF50;
                color: white;
            }
            
            .settings-header h2 {
                margin: 0;
                flex: 1;
                text-align: center;
                font-size: 18px;
                font-weight: 500;
            }
            
            .close-settings {
                background: none;
                border: none;
                cursor: pointer;
                color: white;
                display: flex;
                align-items: center;
                justify-content: center;
                padding: 4px;
                border-radius: 50%;
                transition: background 0.2s;
            }
            
            .close-settings:hover {
                background: rgba(255, 255, 255, 0.2);
            }
            
            .settings-content {
                padding: 16px;
                max-height: 80vh;
                overflow-y: auto;
            }
            
            .settings-group {
                margin-bottom: 24px;
            }
            
            .settings-heading {
                font-size: 16px;
                font-weight: 500;
                color: #333;
                margin: 0 0 12px 0;
                padding-bottom: 8px;
                border-bottom: 1px solid #eee;
            }
            
            .settings-item {
                display: flex;
                justify-content: space-between;
                align-items: center;
                padding: 10px 0;
                border-bottom: 1px solid #f5f5f5;
            }
            
            .settings-item:last-child {
                border-bottom: none;
            }
            
            .settings-item-label {
                font-size: 14px;
                color: #333;
            }
            
            .settings-item-control {
                display: flex;
                align-items: center;
            }
            
            .settings-select {
                padding: 8px;
                border: 1px solid #ddd;
                border-radius: 4px;
                background: white;
                min-width: 100px;
                font-size: 14px;
                color: #333;
            }
            
            .range-control {
                display: flex;
                align-items: center;
                gap: 10px;
                min-width: 150px;
            }
            
            .range-control input[type="range"] {
                flex: 1;
                height: 5px;
                background: #ddd;
                border-radius: 2px;
                -webkit-appearance: none;
            }
            
            .range-control input[type="range"]::-webkit-slider-thumb {
                -webkit-appearance: none;
                width: 16px;
                height: 16px;
                border-radius: 50%;
                background: #4CAF50;
                cursor: pointer;
            }
            
            .range-control span {
                min-width: 40px;
                text-align: right;
                font-size: 14px;
                color: #666;
            }
            
            /* 開關按鈕樣式 */
            .switch {
                position: relative;
                display: inline-block;
                width: 44px;
                height: 22px;
            }
            
            .switch input {
                opacity: 0;
                width: 0;
                height: 0;
            }
            
            .slider {
                position: absolute;
                cursor: pointer;
                top: 0;
                left: 0;
                right: 0;
                bottom: 0;
                background-color: #ccc;
                transition: .3s;
            }
            
            .slider:before {
                position: absolute;
                content: "";
                height: 16px;
                width: 16px;
                left: 3px;
                bottom: 3px;
                background-color: white;
                transition: .3s;
            }
            
            input:checked + .slider {
                background-color: #4CAF50;
            }
            
            input:checked + .slider:before {
                transform: translateX(22px);
            }
            
            .slider.round {
                border-radius: 22px;
            }
            
            .slider.round:before {
                border-radius: 50%;
            }
        `

    document.head.appendChild(style)

    // 更新設定面板標題樣式
    const header = this.settingsPanel.querySelector(".settings-header")
    if (header) {
      header.style.background = "#4CAF50"
      header.style.color = "white"
      header.style.padding = "16px"

      const title = header.querySelector("h2")
      if (title) {
        title.style.fontSize = "18px"
        title.style.fontWeight = "500"
        title.style.margin = "0"
      }

      const closeBtn = header.querySelector(".close-settings")
      if (closeBtn) {
        closeBtn.style.color = "white"
      }
    }
  }

  // 更新設定面板樣式
  updateSettingsPanelStyle() {
    // 添加自定義樣式
    const style = document.createElement("style")
    style.textContent = `
            .settings-panel {
                max-width: 350px;
                border-radius: 8px;
                box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
            }
            
            .settings-content {
                max-height: 80vh;
                overflow-y: auto;
                padding: 15px;
                padding-right: 20px;
            }
            
            /* 滾動條整體樣式 */
            .settings-content::-webkit-scrollbar {
                width: 6px;
            }
            
            /* 滾動條軌道 */
            .settings-content::-webkit-scrollbar-track {
                background: rgba(0, 0, 0, 0.05);
                border-radius: 3px;
            }
            
            /* 滾動條滑塊 */
            .settings-content::-webkit-scrollbar-thumb {
                background: rgba(0, 0, 0, 0.2);
                border-radius: 3px;
                transition: background 0.3s;
            }
            
            /* 滾動條滑塊懸停效果 */
            .settings-content::-webkit-scrollbar-thumb:hover {
                background: rgba(0, 0, 0, 0.3);
            }
            
            /* 設定項目樣式 */
            .settings-item {
                margin-bottom: 15px;
                display: flex;
                justify-content: space-between;
                align-items: center;
            }
            
            /* 設定組標題樣式 */
            .settings-group h3 {
                margin-top: 15px;
                margin-bottom: 10px;
                color: #333;
                font-size: 16px;
                font-weight: 500;
            }
            
            /* 確保設定面板在小屏幕上也能正常顯示 */
            @media (max-height: 600px) {
                .settings-content {
                    max-height: 70vh;
                }
            }
        `

    document.head.appendChild(style)

    // 設置內容區域的樣式
    const settingsContent = this.settingsPanel.querySelector(".settings-content")
    if (settingsContent) {
      settingsContent.style.maxHeight = "80vh"
      settingsContent.style.overflowY = "auto"
    }
  }

  // 設置設定面板滾動條樣式
  setupSettingsPanelScroll() {
    const settingsContent = this.settingsPanel.querySelector(".settings-content")
    if (settingsContent) {
      settingsContent.style.maxHeight = "80vh"
      settingsContent.style.overflowY = "auto"
    }
  }

  // 創建按鈕顯示設定項
  createButtonVisibilitySetting(container, buttonKey, labelText) {
    const settingItem = document.createElement("div")
    settingItem.className = "settings-item"

    const label = document.createElement("label")
    label.htmlFor = `${buttonKey}Visibility`
    label.textContent = labelText

    const checkbox = document.createElement("input")
    checkbox.type = "checkbox"
    checkbox.id = `${buttonKey}Visibility`
    checkbox.checked = this.buttonVisibility[buttonKey]

    checkbox.addEventListener("change", (e) => {
      this.buttonVisibility[buttonKey] = e.target.checked
      this.applyButtonVisibility()
      localStorage.setItem("buttonVisibility", JSON.stringify(this.buttonVisibility))
    })

    settingItem.appendChild(label)
    settingItem.appendChild(checkbox)
    container.appendChild(settingItem)
  }

  // 更新按鈕顯示設定
  updateButtonVisibilitySettings() {
    const buttonKeys = ["prevBtn", "nextBtn", "loopBtn", "shuffleBtn", "speedControl", "repeatControl"]

    buttonKeys.forEach((key) => {
      const checkbox = document.getElementById(`${key}Visibility`)
      if (checkbox) {
        checkbox.checked = this.buttonVisibility[key]
      }
    })
  }

  // 切換工具列顯示狀態
  toggleToolsPanel() {
    const isExpanded = this.playlistTools.classList.toggle("expanded")
    this.updateToolToggleButton(isExpanded)
    localStorage.setItem("toolsExpanded", isExpanded)
  }

  // 更新工具列切換按鈕圖示
  updateToolToggleButton(isExpanded) {
    if (isExpanded) {
      this.toolToggleBtn.innerHTML = '<span class="material-icons">expand_less</span>'
      this.toolToggleBtn.title = "隱藏工具列"
    } else {
      this.toolToggleBtn.innerHTML = '<span class="material-icons">expand_more</span>'
      this.toolToggleBtn.title = "顯示工具列"
    }
  }

  initEventListeners() {
    // 原有的事件監聽
    this.playPauseBtn.addEventListener("click", () => this.togglePlayPause())
    this.prevBtn.addEventListener("click", () => this.playPrevious())
    this.stopBtn.addEventListener("click", () => this.stop())
    this.nextBtn.addEventListener("click", () => this.playNext())

    this.audioPlayer.addEventListener("timeupdate", () => {
      this.updateProgressBar()
      this.drawWaveform() // 更新聲波圖
    })
    this.progressContainer.addEventListener("click", (e) => this.seekProgress(e))

    this.sortBtn.addEventListener("click", () => {
      this.sortPlaylist()
      // 更新排序按鈕圖標
      this.updateSortButtonIcon()
    })

    this.loopBtn.addEventListener("click", () => this.toggleLoopMode())
    this.shuffleBtn.addEventListener("click", () => this.toggleShuffleMode())

    this.audioPlayer.addEventListener("play", () => {
      this.isPlaying = true
      this.updatePlayPauseButton()
    })

    this.audioPlayer.addEventListener("pause", () => {
      this.isPlaying = false
      this.updatePlayPauseButton()
    })

    this.audioPlayer.addEventListener("ended", () => {
      if (this.loopMode === "single") {
        this.audioPlayer.currentTime = 0
        this.play()
      } else {
        this.currentRepeatCount++
        if (this.currentRepeatCount < this.repeatCount) {
          this.audioPlayer.currentTime = 0
          this.play()
        } else {
          this.currentRepeatCount = 0
          // 修改這行，改為直接檢查設定值
          if (this.isAutoNextMode || this.loopMode === "all") {
            this.playNext()
          }
        }
      }
    })

    this.clearPlaylistBtn.addEventListener("click", () => {
      this.clearPlaylist()
    })
    // 新增的事件監聽
    this.addMusicBtn.addEventListener("click", () => {
      this.addMusicModal.classList.add("show")
    })

    this.exportBtn.addEventListener("click", () => {
      this.exportPlaylist()
    })

    this.toggleNameDisplayBtn.addEventListener("click", () => {
      this.toggleNameDisplayMode()
    })

    this.checkAllBtn.addEventListener("click", () => {
      // 檢查是否所有曲目都已啟用
      const allEnabled = this.playlist.every((track) => track.enabled)

      // 根據當前狀態切換
      this.playlist.forEach((track) => (track.enabled = !allEnabled))

      // 更新按鈕圖示
      const icon = this.checkAllBtn.querySelector(".material-icons")
      icon.textContent = allEnabled ? "check_box_outline_blank" : "check_box"
      this.checkAllBtn.title = allEnabled ? "全部勾選" : "取消全選"

      // 如果取消全選且正在播放，則停止播放
      if (allEnabled && this.isPlaying) {
        this.stop()
      }

      this.updatePlaylistView()
    })

    this.sortAllBtn.addEventListener("click", () => {
      // 切換排序方向
      this.isSortAllAscending = !this.isSortAllAscending

      // 根據當前排序方向排序
      if (this.isSortAllAscending) {
        this.playlist.sort((a, b) => a.name.localeCompare(b.name))
      } else {
        this.playlist.sort((a, b) => b.name.localeCompare(a.name))
      }

      // 更新當前播放索引
      if (this.isPlaying) {
        this.currentIndex = this.playlist.findIndex((track) => track.src === this.audioPlayer.src)
      }

      // 如果在隨機播放模式，重新生成隨機索引
      if (this.isShuffleMode) {
        this.shuffleIndices = this.generateShuffleIndices()
      }

      // 更新排序按鈕圖標
      this.updateSortAllButtonIcon()

      // 更新播放清單視圖
      this.updatePlaylistView()
    })

    // 工具列切換按鈕事件
    this.toolToggleBtn.addEventListener("click", () => {
      this.toggleToolsPanel()
    })

    this.closeModal.addEventListener("click", () => {
      this.addMusicModal.classList.remove("show")
    })

    this.addMusicModal.addEventListener("click", (e) => {
      if (e.target === this.addMusicModal) {
        this.addMusicModal.classList.remove("show")
      }
    })

    this.audioFile.addEventListener("change", (e) => {
      this.selectedFiles = Array.from(e.target.files)
      this.updateFileInfo()
    })

    this.confirmFiles.addEventListener("click", () => {
      const basePath = this.basePath.value.trim()
      this.selectedFiles.forEach((file) => {
        const fileData = {
          name: file.name,
          src: URL.createObjectURL(file),
          type: "file",
        }

        if (basePath) {
          fileData.basePath = basePath
        }

        this.addToPlaylist(fileData)
      })

      this.clearFileSelection()
      this.saveToLocalStorage()
      this.addMusicModal.classList.remove("show")

      // 更新新增按鈕位置
      this.updateAddButtonPosition()
    })

    this.clearFiles.addEventListener("click", () => {
      this.clearFileSelection()
    })

    this.clearUrls.addEventListener("click", () => {
      this.audioUrls.value = ""
    })

    // 修正：添加 confirmUrls 按鈕的點擊事件處理
    this.confirmUrlsBtn.addEventListener("click", () => {
      const urls = this.audioUrls.value.split("\n").filter((url) => url.trim())

      urls.forEach((url) => {
        let processedUrl = url.trim()

        // 處理 Google Drive 連結
        if (url.includes("drive.google.com")) {
          const fileId = url.match(/[-\w]{25,}/)
          if (fileId) {
            processedUrl = `https://drive.google.com/uc?export=download&id=${fileId[0]}`
          }
        }

        this.addToPlaylist({
          name: this.extractFileName(processedUrl),
          src: processedUrl,
          type: "url",
        })
      })

      this.audioUrls.value = ""
      this.addMusicModal.classList.remove("show")
      this.saveToLocalStorage()

      // 更新新增按鈕位置
      this.updateAddButtonPosition()
    })

    this.tabButtons.forEach((button) => {
      button.addEventListener("click", () => {
        const tabName = button.dataset.tab

        this.tabButtons.forEach((btn) => btn.classList.remove("active"))
        button.classList.add("active")

        this.tabContents.forEach((content) => {
          if (content.dataset.tab === tabName) {
            content.classList.add("active")
          } else {
            content.classList.remove("active")
          }
        })
      })
    })
  }

  // 更新排序按鈕圖標
  updateSortButtonIcon() {
    const icon = this.sortBtn.querySelector(".material-icons")
    if (this.isSortAscending) {
      icon.textContent = "arrow_downward"
      this.sortBtn.title = "勾選項目排序 (遞減)"
    } else {
      icon.textContent = "arrow_upward"
      this.sortBtn.title = "勾選項目排序 (遞增)"
    }
  }

  // 更新全部排序按鈕圖標
  updateSortAllButtonIcon() {
    const icon = this.sortAllBtn.querySelector(".material-icons")
    if (this.isSortAllAscending) {
      icon.textContent = "arrow_downward"
      this.sortAllBtn.title = "全部排序 (遞減)"
    } else {
      icon.textContent = "arrow_upward"
      this.sortAllBtn.title = "全部排序 (遞增)"
    }
  }

  // 新增匯出方法
  exportPlaylist() {
    const exportList = this.playlist.map((track) => {
      if (track.type === "file") {
        if (track.basePath) {
          return `${track.basePath}/${track.name}`
        }
        return track.name
      }
      return track.src // 如果是網址就直接返回
    })

    const exportText = exportList.join("\n")

    // 複製到剪貼簿
    navigator.clipboard
      .writeText(exportText)
      .then(() => {
        alert("播放清單已複製到剪貼簿")
      })
      .catch((err) => {
        console.error("複製失敗:", err)
        alert("複製失敗，請手動複製")
        // 創建一個臨時文本區域用於複製
        const textarea = document.createElement("textarea")
        textarea.value = exportText
        document.body.appendChild(textarea)
        textarea.select()
        document.execCommand("copy")
        document.body.removeChild(textarea)
      })
  }

  updateFileInfo() {
    if (this.selectedFiles.length > 0) {
      this.fileInfo.style.display = "block"
      this.fileCount.textContent = this.selectedFiles.length
      this.fileList.innerHTML = this.selectedFiles
        .map((file) => `<div class="file-list-item">${file.name}</div>`)
        .join("")
    } else {
      this.fileInfo.style.display = "none"
    }
  }

  toggleNameDisplayMode() {
    this.isMultilineNameDisplay = !this.isMultilineNameDisplay

    // 更新按鈕圖標和提示
    if (this.isMultilineNameDisplay) {
      this.toggleNameDisplayBtn.innerHTML = '<span class="material-icons">short_text</span>'
      this.toggleNameDisplayBtn.title = "切換為單行顯示"
    } else {
      this.toggleNameDisplayBtn.innerHTML = '<span class="material-icons">wrap_text</span>'
      this.toggleNameDisplayBtn.title = "切換為完整顯示"
    }

    // 更新播放清單視圖
    this.updatePlaylistView()
  }

  clearFileSelection() {
    this.selectedFiles = []
    this.audioFile.value = ""
    this.basePath.value = ""
    this.updateFileInfo()
  }

  // 修改 saveToLocalStorage 方法，增加保存當前播放曲目索引和工具列狀態
  saveToLocalStorage() {
    const playlistData = this.playlist.map((item) => ({
      name: item.name,
      type: item.type,
      basePath: item.basePath,
      src: item.type === "url" ? item.src : undefined, // 保存 URL 類型的 src
    }))
    localStorage.setItem("musicPlaylist", JSON.stringify(playlistData))

    // 保存當前播放曲目索引
    localStorage.setItem("currentTrackIndex", this.currentIndex.toString())

    // 保存刪除確認設定
    localStorage.setItem("confirmDelete", this.confirmDelete)

    // 保存按鈕顯示設定
    localStorage.setItem("buttonVisibility", JSON.stringify(this.buttonVisibility))

    // 保存工具列顯示狀態
    localStorage.setItem("toolsExpanded", this.playlistTools.classList.contains("expanded"))
  }

  sortPlaylist() {
    // 切換排序方向
    this.isSortAscending = !this.isSortAscending

    // 先將播放清單分成已啟用和未啟用兩組
    const enabledTracks = this.playlist.filter((track) => track.enabled)
    const disabledTracks = this.playlist.filter((track) => !track.enabled)

    // 根據當前排序方向排序已啟用的曲目
    if (this.isSortAscending) {
      enabledTracks.sort((a, b) => a.name.localeCompare(b.name))
    } else {
      enabledTracks.sort((a, b) => b.name.localeCompare(a.name))
    }

    // 合併排序後的清單
    this.playlist = [...enabledTracks, ...disabledTracks]

    // 更新當前播放索引
    if (this.isPlaying) {
      const currentTrack = this.playlist.find((track, index) => index === this.currentIndex)
      this.currentIndex = this.playlist.indexOf(currentTrack)
    }

    // 如果在隨機播放模式，重新生成隨機索引
    if (this.isShuffleMode) {
      this.shuffleIndices = this.generateShuffleIndices()
    }

    // 更新播放清單視圖
    this.updatePlaylistView()
  }

  toggleAutoNextMode() {
    this.isAutoNextMode = !this.isAutoNextMode
  }

  toggleLoopMode() {
    const modes = {
      none: "single",
      single: "all",
      all: "none",
    }
    const icons = {
      none: "repeat",
      single: "repeat_one",
      all: "repeat",
    }
    this.loopMode = modes[this.loopMode]
    const icon = this.loopBtn.querySelector(".material-icons")
    icon.textContent = icons[this.loopMode]

    if (this.loopMode === "none") {
      this.loopBtn.classList.remove("active")
    } else {
      this.loopBtn.classList.add("active")
    }
  }

  toggleShuffleMode() {
    this.isShuffleMode = !this.isShuffleMode
    if (this.isShuffleMode) {
      this.shuffleIndices = this.generateShuffleIndices()
      this.shuffleBtn.classList.add("active")
    } else {
      this.shuffleIndices = []
      this.shuffleBtn.classList.remove("active")
    }
  }

  generateShuffleIndices() {
    const indices = Array.from(
      {
        length: this.playlist.length,
      },
      (_, i) => i,
    )
    for (let i = indices.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1))
      ;[indices[i], indices[j]] = [indices[j], indices[i]]
    }
    return indices
  }

  getNextIndex() {
    if (this.playlist.length <= 1) return 0

    if (this.isShuffleMode) {
      const currentShuffleIndex = this.shuffleIndices.indexOf(this.currentIndex)
      if (currentShuffleIndex === this.shuffleIndices.length - 1) {
        if (this.loopMode === "all") {
          this.shuffleIndices = this.generateShuffleIndices()
          return this.shuffleIndices[0]
        }
        return -1
      }
      return this.shuffleIndices[currentShuffleIndex + 1]
    } else {
      let nextIndex = this.currentIndex
      do {
        nextIndex++
        if (nextIndex >= this.playlist.length) {
          if (this.loopMode === "all") {
            nextIndex = 0
          } else {
            return -1
          }
        }
        // 找到下一個已啟用的曲目或到達清單末尾
        if (this.playlist[nextIndex].enabled || nextIndex === this.currentIndex) {
          break
        }
      } while (nextIndex !== this.currentIndex)

      return nextIndex
    }
  }

  getPreviousIndex() {
    if (this.playlist.length <= 1) return 0

    if (this.isShuffleMode) {
      const currentShuffleIndex = this.shuffleIndices.indexOf(this.currentIndex)
      if (currentShuffleIndex === 0) {
        return this.loopMode === "all" ? this.shuffleIndices[this.shuffleIndices.length - 1] : this.currentIndex
      }
      return this.shuffleIndices[currentShuffleIndex - 1]
    } else {
      let prevIndex = this.currentIndex
      do {
        prevIndex--
        if (prevIndex < 0) {
          if (this.loopMode === "all") {
            prevIndex = this.playlist.length - 1
          } else {
            return this.currentIndex
          }
        }
        // 找到前一個已啟用的曲目或回到原點
        if (this.playlist[prevIndex].enabled || prevIndex === this.currentIndex) {
          break
        }
      } while (prevIndex !== this.currentIndex)

      return prevIndex
    }
  }

  clearPlaylist() {
    const hasCheckedItems = this.playlist.some((track) => track.enabled)
    if (!hasCheckedItems) {
      alert("沒有已勾選的項目")
      return
    }

    // 根據設定決定是否需要確認
    if (!this.confirmDelete || confirm("確定要清除已勾選的項目嗎？")) {
      const wasPlaying = this.isPlaying
      const currentTrack = this.playlist[this.currentIndex]

      // 過濾出未勾選的項目
      const newPlaylist = this.playlist.filter((track) => !track.enabled)
      this.playlist = newPlaylist

      if (this.playlist.length === 0) {
        this.stop()
        this.audioPlayer.src = ""
        this.currentTrack.textContent = "未選擇音樂"
        this.currentIndex = 0
      } else if (wasPlaying) {
        // 如果正在播放的曲目被清除，播放下一首
        if (!this.playlist.includes(currentTrack)) {
          this.currentIndex = 0
          this.playTrack(0)
        }
      }

      if (this.isShuffleMode) {
        this.shuffleIndices = this.generateShuffleIndices()
      }

      this.updatePlaylistView()
      this.saveToLocalStorage()

      // 更新新增按鈕位置
      this.updateAddButtonPosition()
    }
  }

  playNext() {
    const nextIndex = this.getNextIndex()
    if (nextIndex !== -1 && nextIndex !== this.currentIndex) {
      this.playTrack(nextIndex)
    } else {
      this.stop()
    }
  }

  playPrevious() {
    const prevIndex = this.getPreviousIndex()
    if (prevIndex !== this.currentIndex) {
      this.playTrack(prevIndex)
    }
  }

  togglePlayPause() {
    if (this.playlist.length === 0) return
    if (this.isPlaying) {
      this.pause()
    } else {
      this.play()
    }
  }

  updatePlayPauseButton() {
    this.playPauseIcon.textContent = this.isPlaying ? "pause" : "play_arrow"
  }

  play() {
    if (this.playlist.length > 0) {
      if (!this.audioPlayer.src) {
        this.playTrack(0)
        return
      }
      this.audioPlayer.play()
    }
  }

  pause() {
    this.audioPlayer.pause()
  }

  stop() {
    this.audioPlayer.pause()
    this.audioPlayer.currentTime = 0
  }

  // 修改 playTrack 方法，在播放曲目時保存狀態
  playTrack(index) {
    if (index >= 0 && index < this.playlist.length) {
      if (this.playlist[index].enabled) {
        this.currentIndex = index
        this.audioPlayer.src = this.playlist[index].src
        const nameWithoutExtension = this.playlist[index].name.replace(/\.[^/.]+$/, "")
        this.currentTrack.textContent = nameWithoutExtension
        this.audioPlayer.playbackRate = this.currentPlaybackRate
        this.currentRepeatCount = 0 // 重置重複播放計數
        this.play()
        this.updatePlaylistView()

        // 保存當前狀態到 localStorage
        this.saveToLocalStorage()

        // 如果播放清單不是折疊狀態，確保當前播放項目在視圖中
        if (!this.playlistElement.classList.contains("collapsed")) {
          setTimeout(() => this.scrollToCurrentTrack(), 100)
        }

        // 載入聲波圖
        this.loadAudioData(this.playlist[index].src)
      } else {
        this.playNext()
      }
    }
  }

  // 添加一個新方法用於滾動到當前播放的曲目
  scrollToCurrentTrack() {
    if (this.currentIndex < 0 || this.playlist.length === 0) return

    // 找到當前播放的曲目元素
    const currentTrackElement = this.playlistContainer.querySelector(".playlist-item.active")
    if (!currentTrackElement) return

    // 獲取容器和元素的位置信息
    const container = this.playlistContainer
    const rect = currentTrackElement.getBoundingClientRect()
    const containerRect = container.getBoundingClientRect()

    // 計算元素相對於容器的位置
    const isInView = rect.top >= containerRect.top && rect.bottom <= containerRect.bottom

    // 如果元素不在可視區域內，則滾動
    if (!isInView) {
      // 將元素滾動到容器中間位置
      container.scrollTop = currentTrackElement.offsetTop - containerRect.height / 2 + rect.height / 2
    }
  }

  addToPlaylist(track) {
    if (!this.playlist.some((t) => t.src === track.src)) {
      // 新增 enabled 屬性，預設為 true
      track.enabled = true
      this.playlist.push(track)
      if (this.isShuffleMode) {
        this.shuffleIndices = this.generateShuffleIndices()
      }
      this.updatePlaylistView()
      // 如果是第一首歌，只設置來源但不播放
      if (this.playlist.length === 1) {
        this.currentIndex = 0
        this.audioPlayer.src = this.playlist[0].src
        const nameWithoutExtension = this.playlist[0].name.replace(/\.[^/.]+$/, "")
        this.currentTrack.textContent = nameWithoutExtension

        // 載入聲波圖
        this.loadAudioData(this.playlist[0].src)
      }

      // 保存到本地儲存
      this.saveToLocalStorage()

      // 更新新增按鈕位置
      this.updateAddButtonPosition()
    }
  }

  updatePlaylistView() {
    const hasItems = this.playlist.length > 0
    const toolButtons = document.querySelectorAll(".tool-btn")
    toolButtons.forEach((btn) => {
      btn.disabled = !hasItems
    })

    // 更新新增按鈕位置
    this.updateAddButtonPosition()

    this.playlistContainer.innerHTML = ""
    this.playlist.forEach((track, index) => {
      const trackElement = document.createElement("div")
      trackElement.classList.add("playlist-item")
      if (index === this.currentIndex) {
        trackElement.classList.add("active")

        // 延遲執行滾動，確保元素已經渲染完成
        setTimeout(() => {
          // 只有當播放清單不是折疊狀態時才執行滾動
          if (!this.playlistElement.classList.contains("collapsed")) {
            const container = this.playlistContainer
            const rect = trackElement.getBoundingClientRect()
            const containerRect = container.getBoundingClientRect()

            // 計算元素相對於容器的位置
            const isInView = rect.top >= containerRect.top && rect.bottom <= containerRect.bottom

            // 計算元素在容器中的相對位置
            const relativePosition = (rect.top - containerRect.top) / containerRect.height

            // 如果元素不在可視區域內或者在可視區域的底部，則滾動
            if (!isInView || relativePosition > 0.7) {
              // 如果在底部，則滾動到頂部附近的位置
              if (relativePosition > 0.7) {
                // 將元素滾動到容器頂部附近的位置
                container.scrollTop = trackElement.offsetTop - containerRect.height * 0.2
              } else {
                // 否則正常滾動到視圖中
                trackElement.scrollIntoView({
                  behavior: "smooth",
                  block: "nearest",
                })
              }
            }
          }
        }, 100)
      }

      // 核取方塊的事件處理
      const checkbox = document.createElement("input")
      checkbox.type = "checkbox"
      checkbox.checked = track.enabled
      checkbox.classList.add("playlist-item-checkbox")
      checkbox.addEventListener("click", (e) => {
        // 阻止事件冒泡,這樣就不會觸發父元素的點擊事件
        e.stopPropagation()
        track.enabled = checkbox.checked
        // 如果目前播放的曲目被禁用,自動播放下一首
        if (index === this.currentIndex && !track.enabled && this.isPlaying) {
          this.playNext()
        }
      })

      const numberSpan = document.createElement("span")
      numberSpan.textContent = `${index + 1}`
      numberSpan.classList.add("playlist-item-number")

      const nameSpan = document.createElement("span")
      const nameWithoutExtension = track.name.replace(/\.[^/.]+$/, "")
      nameSpan.textContent = nameWithoutExtension
      nameSpan.classList.add("playlist-item-name")
      if (this.isMultilineNameDisplay) {
        nameSpan.classList.add("multiline")
      }

      const removeBtn = document.createElement("span")
      removeBtn.textContent = "×"
      removeBtn.classList.add("playlist-item-remove")
      removeBtn.title = "移除"
      removeBtn.addEventListener("click", (e) => {
        e.stopPropagation()
        this.removeFromPlaylist(index)
      })

      trackElement.appendChild(checkbox)
      trackElement.appendChild(numberSpan)
      trackElement.appendChild(nameSpan)
      trackElement.appendChild(removeBtn)

      trackElement.addEventListener("click", () => {
        if (track.enabled) {
          this.playTrack(index)
        }
      })

      this.playlistContainer.appendChild(trackElement)
    })
  }

  removeFromPlaylist(index) {
    // 根據設定決定是否需要確認
    if (!this.confirmDelete || confirm("確定要移除此項目嗎？")) {
      const wasPlaying = this.isPlaying
      const removingCurrentTrack = index === this.currentIndex

      this.playlist.splice(index, 1)

      if (this.isShuffleMode) {
        this.shuffleIndices = this.generateShuffleIndices()
      }

      if (this.playlist.length === 0) {
        this.stop()
        this.audioPlayer.src = ""
        this.currentTrack.textContent = "未選擇音樂"
        this.currentIndex = 0

        // 清除聲波圖
        this.isWaveformLoaded = false
        this.drawWaveform()
      } else if (removingCurrentTrack) {
        if (index >= this.playlist.length) {
          this.currentIndex = 0
        }
        this.playTrack(this.currentIndex)
        if (!wasPlaying) {
          this.pause()
        }
      } else if (index < this.currentIndex) {
        this.currentIndex--
      }

      this.updatePlaylistView()
      this.saveToLocalStorage()

      // 更新新增按鈕位置
      this.updateAddButtonPosition()
    }
  }

  updateProgressBar() {
    if (!isNaN(this.audioPlayer.duration)) {
      const progress = (this.audioPlayer.currentTime / this.audioPlayer.duration) * 100
      this.progressBar.style.width = `${progress}%`
      this.currentTimeDisplay.textContent = this.formatTime(this.audioPlayer.currentTime)
      this.durationDisplay.textContent = this.formatTime(this.audioPlayer.duration)
    }
  }

  seekProgress(e) {
    const rect = this.progressContainer.getBoundingClientRect()
    const clickPosition = (e.clientX - rect.left) / rect.width
    this.audioPlayer.currentTime = clickPosition * this.audioPlayer.duration
  }

  formatTime(seconds) {
    if (isNaN(seconds)) return "00:00"
    const minutes = Math.floor(seconds / 60)
    seconds = Math.floor(seconds % 60)
    return `${minutes.toString().padStart(2, "0")}:${seconds.toString().padStart(2, "0")}`
  }

  extractFileName(url) {
    try {
      const parsedUrl = new URL(url)
      const pathParts = parsedUrl.pathname.split("/")
      let fileName = decodeURIComponent(pathParts[pathParts.length - 1])

      // 如果檔名為空或只有副檔名，則使用主機名稱
      if (!fileName || fileName.startsWith(".")) {
        fileName = parsedUrl.hostname + (fileName || "")
      }

      // 移除查詢參數
      fileName = fileName.split("?")[0]

      // 處理 Google Drive 檔案
      if (url.includes("drive.google.com")) {
        if (fileName === "uc") {
          // 從查詢參數中提取檔案 ID
          const fileId = parsedUrl.searchParams.get("id")
          if (fileId) {
            fileName = `GoogleDrive-${fileId}`
          } else {
            fileName = "GoogleDrive-File"
          }
        }
      }

      return fileName || "未知音樂"
    } catch (e) {
      console.error("解析 URL 失敗:", e)
      // 如果無法解析 URL，嘗試從字串中提取檔名
      const parts = url.split("/")
      return parts[parts.length - 1] || "未知音樂"
    }
  }
}

// 初始化播放器
const musicPlayer = new MusicPlayer()
