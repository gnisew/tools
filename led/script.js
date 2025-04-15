// 獲取元素
const textInput = document.getElementById("textInput")
const speedDisplay = document.getElementById("speedDisplay")
const fsSpeedValue = document.getElementById("fsSpeedValue")
const increaseSpeedBtn = document.getElementById("increaseSpeedBtn")
const decreaseSpeedBtn = document.getElementById("decreaseSpeedBtn")
const fsIncreaseSpeedBtn = document.getElementById("fsIncreaseSpeedBtn")
const fsDecreaseSpeedBtn = document.getElementById("fsDecreaseSpeedBtn")
const directionSelect = document.getElementById("directionSelect")
const colorPicker = document.getElementById("colorPicker")
const bgColorPicker = document.getElementById("bgColorPicker")
const colorOptions = document.querySelectorAll(".color-option")
const toggleRunningBtn = document.getElementById("toggleRunningBtn")
const fsToggleRunningBtn = document.getElementById("fsToggleRunningBtn")
const fullscreenBtn = document.getElementById("fullscreenBtn")
const exitFullscreenBtn = document.getElementById("exitFullscreenBtn")
const fullscreenControls = document.getElementById("fullscreenControls")
const fsSpeedControls = document.getElementById("fsSpeedControls")
const fontSizeControls = document.getElementById("fontSizeControls")
const increaseFontBtn = document.getElementById("increaseFontBtn")
const decreaseFontBtn = document.getElementById("decreaseFontBtn")
const ledText = document.getElementById("ledText")
const marqueeContainer = document.getElementById("marqueeContainer")
const fontStyles = document.querySelectorAll("#fontStyles .style-option")
const effectBlink = document.getElementById("effectBlink")
const effectShadow = document.getElementById("effectShadow")
const effectOutline = document.getElementById("effectOutline")
const saveTextBtn = document.getElementById("saveTextBtn")
const savedTextsList = document.getElementById("savedTextsList")
const tabButtons = document.querySelectorAll(".tab-btn")
const tabPanes = document.querySelectorAll(".tab-pane")

// 編輯模式相關元素
const editTextsBtn = document.getElementById("editTextsBtn")
const viewMode = document.getElementById("viewMode")
const editMode = document.getElementById("editMode")
const textsEditor = document.getElementById("textsEditor")
const cancelEditBtn = document.getElementById("cancelEditBtn")
const saveEditsBtn = document.getElementById("saveEditsBtn")
const editActionButtons = document.querySelector(".edit-action-buttons")

// 全螢幕文字切換相關元素
const textNavControls = document.getElementById("textNavControls")
const prevTextBtn = document.getElementById("prevTextBtn")
const nextTextBtn = document.getElementById("nextTextBtn")
const selectTextBtn = document.getElementById("selectTextBtn")
const textSelectionPanel = document.getElementById("textSelectionPanel")
const textSelectionContent = document.getElementById("textSelectionContent")
const closeTextPanelBtn = document.getElementById("closeTextPanelBtn")

// 初始化變數
let animationId = null // 確保有一個明確的初始值
let isRunning = false // 預設不跑動
let isFullscreen = false
let position = marqueeContainer.offsetWidth
let speed = 5 // 初始速度
let direction = directionSelect.value
const defaultFontSize = Number.parseInt(getComputedStyle(ledText).fontSize)
let currentFontSize = defaultFontSize
let fullscreenPaused = false // 記錄全螢幕模式下是否暫停
let savedTexts = [] // 儲存的文字清單
let activeTab = "appearance" // 預設活躍頁籤
let isEditMode = false // 是否處於編輯模式
let currentTextIndex = 0 // 目前顯示的文字索引
let orientationChanged = false // 追蹤螢幕方向是否改變

// 從 localStorage 載入設定
loadSettings()

// 初始化文字 - 靜態顯示
updateText()
setStaticDisplay()

// 載入儲存的文字清單
loadSavedTexts()

// 頁籤切換
tabButtons.forEach((button) => {
  button.addEventListener("click", () => {
    const tabId = button.getAttribute("data-tab")
    switchTab(tabId)
  })
})

// 切換頁籤函數
function switchTab(tabId) {
  // 更新活躍頁籤
  activeTab = tabId

  // 更新頁籤按鈕狀態
  tabButtons.forEach((btn) => {
    btn.classList.toggle("active", btn.getAttribute("data-tab") === tabId)
  })

  // 更新頁籤內容顯示
  tabPanes.forEach((pane) => {
    pane.classList.toggle("active", pane.id === `${tabId}-tab`)
  })

  // 如果切換到已儲存文字頁籤，重新渲染文字清單
  if (tabId === "saved") {
    renderSavedTextsList()
  }

  // 儲存設定
  saveSettings()
}

// 編輯按鈕點擊事件
editTextsBtn.addEventListener("click", () => {
  toggleEditMode(true)
})

// 取消編輯按鈕點擊事件
cancelEditBtn.addEventListener("click", () => {
  toggleEditMode(false)
})

// 儲存編輯按鈕點擊事件
saveEditsBtn.addEventListener("click", () => {
  saveTextEdits()
  toggleEditMode(false)
})

// 切換編輯模式
function toggleEditMode(isEdit) {
  isEditMode = isEdit

  if (isEdit) {
    // 進入編輯模式
    viewMode.style.display = "none"
    editMode.style.display = "block"
    editTextsBtn.style.display = "none"
    editActionButtons.style.display = "flex"

    // 將儲存的文字填入文字區塊
    textsEditor.value = savedTexts.join("\n")
    textsEditor.focus()
  } else {
    // 退出編輯模式
    viewMode.style.display = "block"
    editMode.style.display = "none"
    editTextsBtn.style.display = "block"
    editActionButtons.style.display = "none"
  }
}

// 儲存文字編輯
function saveTextEdits() {
  const textLines = textsEditor.value
    .split("\n")
    .map((line) => line.trim())
    .filter((line) => line.length > 0)

  // 更新儲存的文字清單
  savedTexts = textLines

  // 儲存到 localStorage
  localStorage.setItem("ledMarqueeSavedTexts", JSON.stringify(savedTexts))

  // 重新渲染文字清單
  renderSavedTextsList()
}

// 全螢幕文字選擇面板
selectTextBtn.addEventListener("click", () => {
  toggleTextSelectionPanel()
})

closeTextPanelBtn.addEventListener("click", () => {
  textSelectionPanel.classList.remove("visible")
})

// 切換文字選擇面板
function toggleTextSelectionPanel() {
  textSelectionPanel.classList.toggle("visible")

  if (textSelectionPanel.classList.contains("visible")) {
    renderTextSelectionPanel()
  }
}

// 渲染文字選擇面板
function renderTextSelectionPanel() {
  textSelectionContent.innerHTML = ""

  if (savedTexts.length === 0) {
    textSelectionContent.innerHTML = '<div class="no-saved-texts">尚未儲存任何文字</div>'
    return
  }

  savedTexts.forEach((text, index) => {
    const textItem = document.createElement("div")
    textItem.className = "panel-text-item"
    if (index === currentTextIndex && textInput.value === text) {
      textItem.classList.add("active")
    }
    textItem.textContent = text

    textItem.addEventListener("click", () => {
      textInput.value = text
      currentTextIndex = index
      updateText()
      saveSettings()
      textSelectionPanel.classList.remove("visible")
    })

    textSelectionContent.appendChild(textItem)
  })
}

// 上一個文字按鈕
prevTextBtn.addEventListener("click", () => {
  navigateText(-1)
})

// 下一個文字按鈕
nextTextBtn.addEventListener("click", () => {
  navigateText(1)
})

// 文字導航函數
function navigateText(direction) {
  if (savedTexts.length === 0) return

  // 找到當前文字的索引
  let index = savedTexts.indexOf(textInput.value)

  // 如果找不到當前文字，使用當前索引
  if (index === -1) {
    index = currentTextIndex
  }

  // 計算新索引
  index = (index + direction + savedTexts.length) % savedTexts.length
  currentTextIndex = index

  // 更新文字
  textInput.value = savedTexts[index]
  updateText()
  saveSettings()
}

// 儲存文字按鈕
saveTextBtn.addEventListener("click", () => {
  const text = textInput.value.trim()
  if (text) {
    saveText(text)
    // 儲存後自動切換到已儲存文字頁籤
    switchTab("saved")
  }
})

// 速度控制 - 設定頁
increaseSpeedBtn.addEventListener("click", () => {
  adjustSpeed(1)
})

decreaseSpeedBtn.addEventListener("click", () => {
  adjustSpeed(-1)
})

// 速度控制 - 全螢幕
fsIncreaseSpeedBtn.addEventListener("click", () => {
  adjustSpeed(1)
})

fsDecreaseSpeedBtn.addEventListener("click", () => {
  adjustSpeed(-1)
})

// 調整速度函數
function adjustSpeed(change) {
  speed = Math.max(1, Math.min(20, speed + change))
  speedDisplay.textContent = speed
  fsSpeedValue.textContent = speed

  // 儲存設定
  saveSettings()

  // 如果正在跑動，更新速度
  if (isRunning || (isFullscreen && !fullscreenPaused)) {
    stopAnimation() // 先停止現有動畫
    animateMarquee() // 再以新速度開始
  }
}

// 更新文字內容
textInput.addEventListener("input", () => {
  updateText()
  saveSettings()
})

// 更改方向
directionSelect.addEventListener("change", () => {
  direction = directionSelect.value
  saveSettings()

  if (isRunning || (isFullscreen && !fullscreenPaused)) {
    resetPosition()
  }
})

// 更改顏色
colorPicker.addEventListener("input", () => {
  ledText.style.color = colorPicker.value
  // 移除所有活躍狀態
  colorOptions.forEach((option) => option.classList.remove("active"))
  saveSettings()
})

// 更改背景顏色
bgColorPicker.addEventListener("input", () => {
  marqueeContainer.style.backgroundColor = bgColorPicker.value
  saveSettings()
})

// 預設顏色選項
colorOptions.forEach((option) => {
  option.addEventListener("click", () => {
    const color = option.getAttribute("data-color")
    colorPicker.value = color
    ledText.style.color = color

    // 更新活躍狀態
    colorOptions.forEach((opt) => opt.classList.remove("active"))
    option.classList.add("active")

    saveSettings()
  })
})

// 切換跑動/靜止功能 (主界面按鈕)
toggleRunningBtn.addEventListener("click", () => {
  isRunning = !isRunning

  if (isRunning) {
    // 開始跑動
    toggleRunningBtn.textContent = "停止"
    setScrollingDisplay()
    stopAnimation() // 確保先停止任何現有動畫
    animateMarquee()
  } else {
    // 完全停止跑動，顯示全部文字
    toggleRunningBtn.textContent = "預覽"
    stopAnimation()
    setStaticDisplay()
  }

  saveSettings()
})

// 全螢幕模式下的暫停/播放按鈕
fsToggleRunningBtn.addEventListener("click", () => {
  fullscreenPaused = !fullscreenPaused

  if (fullscreenPaused) {
    // 暫停動畫
    fsToggleRunningBtn.textContent = "▶"
    stopAnimation()
  } else {
    // 繼續動畫
    fsToggleRunningBtn.textContent = "❚❚"
    animateMarquee()
  }
})

// 停止動畫的輔助函數
function stopAnimation() {
  if (animationId !== null) {
    cancelAnimationFrame(animationId)
    animationId = null
  }
}

// 設定靜態顯示
function setStaticDisplay() {
  stopAnimation()
  ledText.classList.add("static-mode")
  ledText.style.transform = "translateX(0)"
  ledText.style.width = "100%"
  ledText.style.textAlign = "center"
  ledText.style.left = "0"
}

// 設定滾動顯示
function setScrollingDisplay() {
  ledText.classList.remove("static-mode")
  ledText.style.width = "auto"
  ledText.style.textAlign = "left"
  resetPosition()
}

// 切換全螢幕
fullscreenBtn.addEventListener("click", () => {
  enterFullscreen()
})

// 退出全螢幕
exitFullscreenBtn.addEventListener("click", () => {
  exitFullscreen()
})

// 字體大小調整
increaseFontBtn.addEventListener("click", () => {
  adjustFontSize(10) // 增加10px
})

decreaseFontBtn.addEventListener("click", () => {
  adjustFontSize(-10) // 減少10px
})

// 調整字體大小函數
function adjustFontSize(change) {
  const newSize = currentFontSize + change

  // 獲取視窗尺寸
  const windowWidth = window.innerWidth
  const windowHeight = window.innerHeight

  // 計算最大允許的字體大小 (不超過螢幕)
  const maxSize = Math.min(windowWidth * 0.8, windowHeight * 0.8)

  // 確保字體大小在合理範圍內
  if (newSize >= 20 && newSize <= maxSize) {
    currentFontSize = newSize
    ledText.style.fontSize = `${currentFontSize}px`
  }
}

// 全螢幕相關函數
function enterFullscreen() {
  // 使用瀏覽器的全螢幕 API
  if (document.documentElement.requestFullscreen) {
    document.documentElement.requestFullscreen()
  } else if (document.documentElement.webkitRequestFullscreen) {
    /* Safari */
    document.documentElement.webkitRequestFullscreen()
  } else if (document.documentElement.msRequestFullscreen) {
    /* IE11 */
    document.documentElement.msRequestFullscreen()
  }

  // 設置全螢幕狀態
  isFullscreen = true
  marqueeContainer.classList.add("fullscreen")
  exitFullscreenBtn.classList.add("visible")
  fullscreenControls.classList.add("visible")
  fsSpeedControls.classList.add("visible")
  fontSizeControls.classList.add("visible")

  // 如果有儲存的文字，顯示文字導航控制
  if (savedTexts.length > 0) {
    textNavControls.classList.add("visible")
  }

  // 調整全螢幕時的字體大小
  adjustFullscreenFontSize()

  // 進入全螢幕時直接開始滾動
  fullscreenPaused = false // 確保不是暫停狀態
  fsToggleRunningBtn.textContent = "❚❚" // 顯示暫停圖示

  // 設置滾動顯示並開始動畫
  setScrollingDisplay()
  stopAnimation() // 確保先停止任何現有動畫
  animateMarquee()
}

function exitFullscreen() {
  // 使用瀏覽器的退出全螢幕 API
  if (document.exitFullscreen) {
    document.exitFullscreen()
  } else if (document.webkitExitFullscreen) {
    /* Safari */
    document.webkitExitFullscreen()
  } else if (document.msExitFullscreen) {
    /* IE11 */
    document.msExitFullscreen()
  }

  // 重置全螢幕狀態
  isFullscreen = false
  marqueeContainer.classList.remove("fullscreen")
  exitFullscreenBtn.classList.remove("visible")
  fullscreenControls.classList.remove("visible")
  fsSpeedControls.classList.remove("visible")
  fontSizeControls.classList.remove("visible")
  textNavControls.classList.remove("visible")
  textSelectionPanel.classList.remove("visible")

  // 恢復原來的字體大小
  currentFontSize = defaultFontSize
  ledText.style.fontSize = `${defaultFontSize}px`

  // 退出全螢幕時恢復到主界面的狀態
  if (isRunning) {
    // 如果主界面是跑動狀態，繼續跑動
    setScrollingDisplay()
    stopAnimation() // 確保先停止任何現有動畫
    animateMarquee()
  } else {
    // 如果主界面是靜止狀態，顯示靜態
    stopAnimation()
    setStaticDisplay()
  }
}

// 監聽全螢幕變化事件
document.addEventListener("fullscreenchange", handleFullscreenChange)
document.addEventListener("webkitfullscreenchange", handleFullscreenChange)
document.addEventListener("mozfullscreenchange", handleFullscreenChange)
document.addEventListener("MSFullscreenChange", handleFullscreenChange)

// 處理全螢幕變化事件
function handleFullscreenChange() {
  // 檢查是否處於全螢幕模式
  const isDocumentFullscreen =
    document.fullscreenElement ||
    document.webkitFullscreenElement ||
    document.mozFullScreenElement ||
    document.msFullscreenElement

  // 如果不在全螢幕模式但我們的狀態是全螢幕，則執行退出全螢幕的操作
  if (!isDocumentFullscreen && isFullscreen) {
    exitFullscreen()
  }
}

// 調整全螢幕時的字體大小
function adjustFullscreenFontSize() {
  // 獲取視窗的尺寸
  const windowWidth = window.innerWidth
  const windowHeight = window.innerHeight

  // 判斷是橫向還是縱向
  const isLandscape = windowWidth > windowHeight

  // 計算字體大小
  let fontSize

  if (isLandscape) {
    fontSize = Math.floor(windowHeight * 0.6)
  } else {
    fontSize = Math.min(Math.floor(windowWidth * 0.8), Math.floor(windowHeight * 0.6))
  }

  // 設置字體大小
  currentFontSize = fontSize
  ledText.style.fontSize = `${currentFontSize}px`
}

// 文字樣式選擇
fontStyles.forEach((style) => {
  style.addEventListener("click", () => {
    // 移除所有活躍樣式類別
    fontStyles.forEach((s) => s.classList.remove("active"))
    style.classList.add("active")

    // 先移除所有字體樣式類別
    ledText.classList.remove("font-digital", "font-neon", "font-bubble", "font-retro", "font-elegant")

    // 添加選擇的樣式類別
    const styleClass = style.getAttribute("data-style")
    ledText.classList.add(styleClass)

    // 儲存設定
    saveSettings()
  })
})

// 特效切換
effectBlink.addEventListener("change", () => {
  ledText.classList.toggle("effect-blink", effectBlink.checked)
  saveSettings()
})

effectShadow.addEventListener("change", () => {
  ledText.classList.toggle("effect-shadow", effectShadow.checked)
  saveSettings()
})

effectOutline.addEventListener("change", () => {
  ledText.classList.toggle("effect-outline", effectOutline.checked)
  saveSettings()
})

// 更新文字函數
function updateText() {
  ledText.textContent = textInput.value

  if (isRunning || (isFullscreen && !fullscreenPaused)) {
    resetPosition()
  } else {
    setStaticDisplay()
  }
}

// 重置位置函數
function resetPosition() {
  if (direction === "left") {
    position = marqueeContainer.offsetWidth
  } else {
    position = -ledText.offsetWidth
  }

  ledText.style.transform = `translateX(${position}px)`

  // 取消現有動畫並重新開始
  stopAnimation()

  // 如果不是全螢幕暫停狀態，則開始動畫
  if (!(isFullscreen && fullscreenPaused)) {
    animateMarquee()
  }
}

// 動畫函數
function animateMarquee() {
  // 檢查元素是否存在且可見
  if (!ledText || !marqueeContainer || marqueeContainer.offsetWidth === 0) {
    // 如果元素不存在或不可見，延遲後重試
    setTimeout(() => {
      if (isRunning || (isFullscreen && !fullscreenPaused)) {
        animateMarquee()
      }
    }, 100)
    return
  }

  if (direction === "left") {
    position -= speed * 0.5

    if (position < -ledText.offsetWidth) {
      position = marqueeContainer.offsetWidth
    }
  } else {
    position += speed * 0.5

    if (position > marqueeContainer.offsetWidth) {
      position = -ledText.offsetWidth
    }
  }

  ledText.style.transform = `translateX(${position}px)`
  animationId = requestAnimationFrame(animateMarquee)
}

// 視窗大小改變時更新
window.addEventListener("resize", () => {
  // 標記螢幕方向已改變
  orientationChanged = true

  // 延遲處理以確保所有尺寸計算完成
  setTimeout(() => {
    if (isFullscreen) {
      adjustFullscreenFontSize()
    }

    if (isRunning || (isFullscreen && !fullscreenPaused)) {
      resetPosition()
    } else {
      setStaticDisplay()
    }

    // 重置標記
    orientationChanged = false
  }, 300)
})

// 監聽螢幕方向變化
window.addEventListener("orientationchange", () => {
  // 標記螢幕方向已改變
  orientationChanged = true

  // 延遲處理以確保所有尺寸計算完成
  setTimeout(() => {
    if (isFullscreen) {
      adjustFullscreenFontSize()
    }

    // 強制重置位置並重新開始動畫
    if (isRunning || (isFullscreen && !fullscreenPaused)) {
      stopAnimation()
      resetPosition()
      animateMarquee()
    } else {
      setStaticDisplay()
    }

    // 重置標記
    orientationChanged = false
  }, 500)
})

// ESC 鍵退出全螢幕
document.addEventListener("keydown", (e) => {
  if (e.key === "Escape" && isFullscreen) {
    exitFullscreen()
  }
})

// 儲存設定到 localStorage
function saveSettings() {
  const settings = {
    text: textInput.value,
    speed: speed,
    direction: direction,
    color: colorPicker.value,
    bgColor: bgColorPicker.value,
    fontStyle: getActiveFontStyle(),
    effects: {
      blink: effectBlink.checked,
      shadow: effectShadow.checked,
      outline: effectOutline.checked,
    },
    isRunning: isRunning,
    activeTab: activeTab,
    currentTextIndex: currentTextIndex,
  }

  localStorage.setItem("ledMarqueeSettings", JSON.stringify(settings))
}

// 從 localStorage 載入設定
function loadSettings() {
  const savedSettings = localStorage.getItem("ledMarqueeSettings")

  if (savedSettings) {
    const settings = JSON.parse(savedSettings)

    // 套用設定
    textInput.value = settings.text || ""
    speed = settings.speed || 5
    speedDisplay.textContent = speed
    fsSpeedValue.textContent = speed
    direction = settings.direction || "left"
    directionSelect.value = direction

    // 顏色設定
    if (settings.color) {
      colorPicker.value = settings.color
      ledText.style.color = settings.color

      // 更新顏色選項的活躍狀態
      colorOptions.forEach((option) => {
        if (option.getAttribute("data-color") === settings.color) {
          option.classList.add("active")
        } else {
          option.classList.remove("active")
        }
      })
    }

    if (settings.bgColor) {
      bgColorPicker.value = settings.bgColor
      marqueeContainer.style.backgroundColor = settings.bgColor
    }

    // 字體樣式
    if (settings.fontStyle) {
      fontStyles.forEach((style) => {
        if (style.getAttribute("data-style") === settings.fontStyle) {
          style.classList.add("active")
          ledText.classList.add(settings.fontStyle)
        } else {
          style.classList.remove("active")
        }
      })
    }

    // 特效
    if (settings.effects) {
      effectBlink.checked = settings.effects.blink || false
      effectShadow.checked = settings.effects.shadow || false
      effectOutline.checked = settings.effects.outline || false

      ledText.classList.toggle("effect-blink", settings.effects.blink)
      ledText.classList.toggle("effect-shadow", settings.effects.shadow)
      ledText.classList.toggle("effect-outline", settings.effects.outline)
    }

    // 跑動狀態
    isRunning = settings.isRunning || false
    toggleRunningBtn.textContent = isRunning ? "停止" : "預覽"

    // 活躍頁籤
    if (settings.activeTab) {
      activeTab = settings.activeTab
      switchTab(activeTab)
    }

    // 當前文字索引
    if (settings.currentTextIndex !== undefined) {
      currentTextIndex = settings.currentTextIndex
    }
  }
}

// 獲取當前活躍的字體樣式
function getActiveFontStyle() {
  let activeStyle = "font-digital" // 預設

  fontStyles.forEach((style) => {
    if (style.classList.contains("active")) {
      activeStyle = style.getAttribute("data-style")
    }
  })

  return activeStyle
}

// 儲存文字到清單
function saveText(text) {
  // 檢查是否已存在相同文字
  if (!savedTexts.includes(text)) {
    savedTexts.push(text)
    currentTextIndex = savedTexts.length - 1
    localStorage.setItem("ledMarqueeSavedTexts", JSON.stringify(savedTexts))
    renderSavedTextsList()
  }
}

// 載入儲存的文字清單
function loadSavedTexts() {
  const savedTextsList = localStorage.getItem("ledMarqueeSavedTexts")

  if (savedTextsList) {
    savedTexts = JSON.parse(savedTextsList)
    renderSavedTextsList()
  }
}

// 渲染儲存的文字清單
function renderSavedTextsList() {
  savedTextsList.innerHTML = ""

  if (savedTexts.length === 0) {
    savedTextsList.innerHTML = '<div class="no-saved-texts">尚未儲存任何文字</div>'
    return
  }

  savedTexts.forEach((text, index) => {
    const textItem = document.createElement("div")
    textItem.className = "saved-text-item"

    const textContent = document.createElement("div")
    textContent.className = "saved-text-content"
    textContent.textContent = text
    textContent.title = text

    const deleteBtn = document.createElement("button")
    deleteBtn.className = "delete-text-btn"
    deleteBtn.innerHTML = "×"
    deleteBtn.title = "刪除"

    textItem.appendChild(textContent)
    textItem.appendChild(deleteBtn)

    // 點擊文字項目載入文字
    textContent.addEventListener("click", () => {
      textInput.value = text
      currentTextIndex = index
      updateText()
      saveSettings()
    })

    // 刪除文字
    deleteBtn.addEventListener("click", (e) => {
      e.stopPropagation()
      savedTexts.splice(index, 1)
      localStorage.setItem("ledMarqueeSavedTexts", JSON.stringify(savedTexts))
      renderSavedTextsList()
    })

    savedTextsList.appendChild(textItem)
  })
}
