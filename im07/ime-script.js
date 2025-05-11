// IME 主要功能

class IMEManager {
  constructor() {
    // 元素參考
    this.editor = document.getElementById("editor")
    this.toolbar = document.querySelector(".toolbar")

    // IME 狀態
    this.imeActive = true // 預設啟用
    this.isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent)
    this.currentLang = Object.keys(langMap)[0] // 預設使用 langMap 中的第一個鍵
    this.composingText = ""
    this.candidates = []
    this.currentPage = 0
    this.pageSize = 5
    this.isKeyboardCollapsed = false

    // 鍵盤配置相關
    this.keyboardLayouts = {
      qwerty: {
        name: "QWERTY",
        rows: [
          "1234567890".split(""),
          "qwertyuiop".split(""),
          "asdfghjkl".split(""),
          ["shift", ..."zxcvbnm".split(""), "backspace"],
          ["mode", "globe", "space", "enter"],
        ],
      },
      zhuyin: {
        name: "注音",
        rows: [
          "ㄅㄆㄇㄈㄉㄊㄋㄌㄍㄎ".split(""),
          "ㄏㄐㄑㄒㄓㄔㄕㄖㄗㄘ".split(""),
          "ㄙㄧㄨㄩㄚㄛㄜㄝㄞㄟ".split(""),
          ["shift", ..."ㄠㄡㄢㄣㄤㄥㄦ".split(""), "backspace"],
          ["mode", "globe", "space", "enter"],
        ],
        keyMapping: {
          ㄅ: { display: "ㄅ", hint: "1", code: "ㄅ", mapping: "1" },
          ㄆ: { display: "ㄆ", hint: "q", code: "ㄆ", mapping: "q" },
          ㄇ: { display: "ㄇ", hint: "a", code: "ㄇ", mapping: "a" },
          ㄈ: { display: "ㄈ", hint: "z", code: "ㄈ", mapping: "z" },
          ㄉ: { display: "ㄉ", hint: "2", code: "ㄉ", mapping: "2" },
          ㄊ: { display: "ㄊ", hint: "w", code: "ㄊ", mapping: "w" },
          ㄋ: { display: "ㄋ", hint: "s", code: "ㄋ", mapping: "s" },
          ㄌ: { display: "ㄌ", hint: "x", code: "ㄌ", mapping: "x" },
          ㄍ: { display: "ㄍ", hint: "e", code: "ㄍ", mapping: "e" },
          ㄎ: { display: "ㄎ", hint: "d", code: "ㄎ", mapping: "d" },
          ㄏ: { display: "ㄏ", hint: "c", code: "ㄏ", mapping: "c" },
          ㄐ: { display: "ㄐ", hint: "r", code: "ㄐ", mapping: "r" },
          ㄑ: { display: "ㄑ", hint: "f", code: "ㄑ", mapping: "f" },
          ㄒ: { display: "ㄒ", hint: "v", code: "ㄒ", mapping: "v" },
          ㄓ: { display: "ㄓ", hint: "5", code: "ㄓ", mapping: "5" },
          ㄔ: { display: "ㄔ", hint: "t", code: "ㄔ", mapping: "t" },
          ㄕ: { display: "ㄕ", hint: "g", code: "ㄕ", mapping: "g" },
          ㄖ: { display: "ㄖ", hint: "b", code: "ㄖ", mapping: "b" },
          ㄗ: { display: "ㄗ", hint: "y", code: "ㄗ", mapping: "y" },
          ㄘ: { display: "ㄘ", hint: "h", code: "ㄘ", mapping: "h" },
          ㄙ: { display: "ㄙ", hint: "n", code: "ㄙ", mapping: "n" },
          ㄧ: { display: "ㄧ", hint: "u", code: "ㄧ", mapping: "u" },
          ㄨ: { display: "ㄨ", hint: "j", code: "ㄨ", mapping: "j" },
          ㄩ: { display: "ㄩ", hint: "m", code: "ㄩ", mapping: "m" },
          ㄚ: { display: "ㄚ", hint: "8", code: "ㄚ", mapping: "8" },
          ㄛ: { display: "ㄛ", hint: "i", code: "ㄛ", mapping: "i" },
          ㄜ: { display: "ㄜ", hint: "k", code: "ㄜ", mapping: "k" },
          ㄝ: { display: "ㄝ", hint: ",", code: "ㄝ", mapping: "," },
          ㄞ: { display: "ㄞ", hint: "9", code: "ㄞ", mapping: "9" },
          ㄟ: { display: "ㄟ", hint: "o", code: "ㄟ", mapping: "o" },
          ㄠ: { display: "ㄠ", hint: "l", code: "ㄠ", mapping: "l" },
          ㄡ: { display: "ㄡ", hint: ".", code: "ㄡ", mapping: "." },
          ㄢ: { display: "ㄢ", hint: "0", code: "ㄢ", mapping: "0" },
          ㄣ: { display: "ㄣ", hint: "p", code: "ㄣ", mapping: "p" },
          ㄤ: { display: "ㄤ", hint: ";", code: "ㄤ", mapping: ";" },
          ㄥ: { display: "ㄥ", hint: "/", code: "ㄥ", mapping: "/" },
          ㄦ: { display: "ㄦ", hint: "-", code: "ㄦ", mapping: "-" },
        },
      },
      cangjie: {
        name: "倉頡",
        rows: [
          "1234567890".split(""),
          "手田水口廿卜山戈人心".split(""),
          "日尸木火土竹十大中".split(""),
          ["shift", ..."難金女月弓一".split(""), "backspace"],
          ["mode", "globe", "space", "enter"],
        ],
        keyMapping: {
          手: { display: "手", hint: "q", code: "手", mapping: "q" },
          田: { display: "田", hint: "w", code: "田", mapping: "w" },
          水: { display: "水", hint: "e", code: "水", mapping: "e" },
          口: { display: "口", hint: "r", code: "口", mapping: "r" },
          廿: { display: "廿", hint: "t", code: "田", mapping: "t" },
          卜: { display: "卜", hint: "y", code: "卜", mapping: "y" },
          山: { display: "山", hint: "u", code: "山", mapping: "u" },
          戈: { display: "戈", hint: "i", code: "戈", mapping: "i" },
          人: { display: "人", hint: "o", code: "人", mapping: "o" },
          心: { display: "心", hint: "p", code: "心", mapping: "p" },
          日: { display: "日", hint: "a", code: "日", mapping: "a" },
          尸: { display: "尸", hint: "s", code: "尸", mapping: "s" },
          木: { display: "木", hint: "d", code: "木", mapping: "d" },
          火: { display: "火", hint: "f", code: "火", mapping: "f" },
          土: { display: "土", hint: "g", code: "土", mapping: "g" },
          竹: { display: "竹", hint: "h", code: "竹", mapping: "h" },
          十: { display: "十", hint: "j", code: "十", mapping: "j" },
          大: { display: "大", hint: "k", code: "大", mapping: "k" },
          中: { display: "中", hint: "l", code: "中", mapping: "l" },
          難: { display: "難", hint: "z", code: "難", mapping: "z" },
          金: { display: "金", hint: "x", code: "金", mapping: "x" },
          女: { display: "女", hint: "c", code: "女", mapping: "c" },
          月: { display: "月", hint: "v", code: "月", mapping: "v" },
          弓: { display: "弓", hint: "b", code: "弓", mapping: "b" },
          一: { display: "一", hint: "n", code: "一", mapping: "n" },
        },
      },
    }

    // 當前鍵盤配置
    this.currentKeyboardLayout = "qwerty"

    // 自訂鍵盤配置
    this.customLayouts = {}

    // 從本地存儲加載自訂配置
    const savedCustomLayouts = localStorage.getItem("imeCustomLayouts")
    if (savedCustomLayouts) {
      try {
        this.customLayouts = JSON.parse(savedCustomLayouts)
      } catch (e) {
        console.error("無法解析自訂鍵盤配置", e)
      }
    }

    // 從本地存儲加載當前鍵盤配置
    const savedKeyboardLayout = localStorage.getItem("imeKeyboardLayout")
    if (savedKeyboardLayout) {
      if (this.keyboardLayouts[savedKeyboardLayout] || this.customLayouts[savedKeyboardLayout]) {
        this.currentKeyboardLayout = savedKeyboardLayout
      }
    }

    this.punctuationMarks = [
      "，",
      "。",
      "？",
      "！",
      "：",
      "「",
      "」",
      "；",
      "、",
      "『",
      "』",
      "（",
      "）",
      "《",
      "》",
      "〈",
      "〉",
      "──",
      "…",
      "﹏",
      "＿",
      "．",
      "—",
      "～",
    ]

    this.englishPunctuationMarks = [
      ",",
      ".",
      "?",
      ":",
      "!",
      ";",
      "/",
      "'",
      "'",
      '"',
      "ˇ",
      "ˋ",
      "ˊ",
      "ˆ",
      "⁺",
      "(",
      ")",
      "+",
      "-",
      "=",
      "_",
      "^",
      "*",
      "$",
      "@",
      "{",
      "}",
      "[",
      "]",
      "<",
      ">",
      "#",
      "%",
      "&",
    ]

    this.candidateCount = 9 // 默认候选字数量
    this.candidateFontSize = "medium" // 默认字体大小
    this.candidateFont = "default" // 默认字体
    this.displayMode = "vertical" // 默认垂直显示

    // 从本地存储加载设置
    const savedSettings = localStorage.getItem("imeSettings")
    if (savedSettings) {
      try {
        const settings = JSON.parse(savedSettings)
        this.candidateCount = settings.candidateCount || 9
        this.candidateFontSize = settings.candidateFontSize || "medium"
        this.candidateFont = settings.candidateFont || "default"
        this.displayMode = settings.displayMode || "vertical"
      } catch (e) {
        console.error("无法解析设置", e)
      }
    }

    // 拖曳狀態
    this.isDraggingToolbar = false
    this.isDraggingCandidates = false
    this.dragOffsetX = 0
    this.dragOffsetY = 0

    // 記錄光標位置
    this.cursorPosition = {
      start: 0,
      end: 0,
    }

    // 字元長度計算函數
    this.get_length = (txt) => Array.from(txt).length

    // 初始化
    this.init()
  }

  init() {
    this.createIMEButton()
    this.createIMEToolbar()
    this.createCandidateArea()

    if (this.isMobile) {
      this.createMobileCandidateArea()
      this.createKeyboard()

      // 創建一個隱藏的光標指示器
      this.createCursorIndicator()

      // 確保編輯器可以顯示系統游標
      this.editor.style.caretColor = "auto"
      this.editor.style.webkitUserSelect = "text"
      this.editor.style.userSelect = "text"
      this.editor.style.cursor = "text"

      // 添加這一行，設置 inputmode="none"
      this.editor.setAttribute("inputmode", "none")
    }

    this.setupEventListeners()

    // 載入上次使用的語言
    const savedLang = localStorage.getItem("imeLang")

    // 載入上次的候選字區域大小
    const savedSize = localStorage.getItem("imeCandidateSize")
    if (savedSize && this.candidateArea) {
      try {
        const size = JSON.parse(savedSize)
        if (size.width) {
          this.candidateArea.style.width = `${size.width}px`
        }
      } catch (e) {
        console.error("無法解析候選字區域大小", e)
      }
    }

    if (savedLang && imeData[savedLang]) {
      this.currentLang = savedLang
      this.updateToolbarLang()
    }

    // 預設啟用輸入法
    this.activateIME()

    // 確保 IME 按鈕顯示為啟用狀態
    this.imeButton.classList.add("active")
    this.editor.classList.add("editor-ime-active")

    // 如果是行動裝置，顯示鍵盤
    if (this.isMobile && this.keyboard) {
      // 調整編輯器高度，避免被鍵盤遮擋
      setTimeout(() => {
        if (this.keyboard) {
          this.editor.style.height = `calc(100vh - ${this.keyboard.offsetHeight + 20}px)`
        }
      }, 100)

      // 顯示標點符號作為候選字
      this.showPunctuationCandidates()

      // 更新隱藏鍵盤按鈕狀態
      this.updateHideKeyboardButton()

      // 初始化光標位置
      this.cursorPosition = {
        start: this.editor.selectionStart,
        end: this.editor.selectionEnd,
      }

      // 在移動設備上，我們通過其他方式阻止系統鍵盤
      this.preventNativeKeyboard()
    }

    // 修復複製按鈕功能
    const copyBtn = document.getElementById("copyBtn")
    if (copyBtn && this.isMobile) {
      copyBtn.addEventListener("click", () => {
        // 暫時移除只讀屬性
        this.editor.removeAttribute("readonly")

        // 選擇所有文本
        this.editor.focus()
        this.editor.select()

        // 嘗試複製
        try {
          const successful = document.execCommand("copy")
          if (successful) {
            // 顯示成功提示
            if (window.showToast) {
              window.showToast("已複製到剪貼簿")
            }
          } else {
            console.error("複製失敗")
          }
        } catch (err) {
          console.error("複製時發生錯誤:", err)
        }

        // 恢復光標位置
        setTimeout(() => {
          this.editor.blur()
          this.updateCursorIndicator()
        }, 100)
      })
    }
  }

  createCursorIndicator() {
    // 創建一個視覺光標指示器
    const cursorIndicator = document.createElement("div")
    cursorIndicator.className = "ime-cursor-indicator"

    // Initially hide the cursor indicator
    cursorIndicator.style.display = "none"

    // 將游標指示器添加到編輯器容器內，而不是 body
    const editorContainer = this.editor.parentElement
    editorContainer.style.position = "relative"
    editorContainer.appendChild(cursorIndicator)

    this.cursorIndicator = cursorIndicator
  }

  updateCursorIndicator() {
    if (!this.cursorIndicator || !this.isMobile) return

    // Get the current readonly state
    const isReadonly = this.editor.hasAttribute("readonly")

    // Only show the custom cursor when the editor is readonly (system cursor is hidden)
    if (isReadonly) {
      // Get cursor position
      const cursorPos = this.getCursorPosition()
      const editorRect = this.editor.getBoundingClientRect()

      // Set cursor indicator position
      this.cursorIndicator.style.left = `${editorRect.left + cursorPos.left}px`
      this.cursorIndicator.style.top = `${editorRect.top + cursorPos.top}px`
      this.cursorIndicator.style.height = `${Number.parseInt(window.getComputedStyle(this.editor).lineHeight)}px`

      // Show cursor indicator
      this.cursorIndicator.style.display = "block"

      // Blink effect
      this.cursorIndicator.classList.add("blink")
    } else {
      // Hide the custom cursor when the system cursor is visible
      this.cursorIndicator.style.display = "none"

      // Ensure the editor has focus to show the system cursor
      if (document.activeElement !== this.editor) {
        this.editor.focus()
      }
    }
  }

  hideCursorIndicator() {
    if (this.cursorIndicator) {
      this.cursorIndicator.style.display = "none"
    }
  }

  preventNativeKeyboard() {
    if (!this.isMobile) return

    // 設置 inputmode="none" 屬性，告訴瀏覽器不要顯示任何特定類型的鍵盤
    this.editor.setAttribute("inputmode", "none")

    // 使用更可靠的方法阻止系統鍵盤
    this.editor.addEventListener(
      "touchstart",
      (e) => {
        if (this.imeActive) {
          // 立即設置為只讀，阻止系統鍵盤
          this.editor.setAttribute("readonly", "readonly")

          // 獲取點擊位置
          const touch = e.touches[0]
          const rect = this.editor.getBoundingClientRect()
          const x = touch.clientX - rect.left
          const y = touch.clientY - rect.top

          // 計算點擊位置對應的文字位置
          const position = this.getTextPositionFromCoordinates(x, y)

          // 更新光標位置
          this.cursorPosition = {
            start: position,
            end: position,
          }

          // 立即更新視覺光標，不等待延遲
          this.updateCursorIndicator()

          // 設置編輯器的選擇範圍，使系統游標顯示在正確位置
          setTimeout(() => {
            // 短暫延遲後移除只讀屬性，允許編輯
            this.editor.removeAttribute("readonly")
            this.editor.setSelectionRange(position, position)

            // 再次更新視覺光標，確保位置正確
            this.updateCursorIndicator()
          }, 10)
        }
      },
      { passive: false },
    )

    // 確保編輯器始終保持焦點狀態
    this.editor.addEventListener("blur", () => {
      if (this.imeActive) {
        // 在失去焦點時，確保游標仍然顯示
        this.updateCursorIndicator()
      }
    })

    // 阻止系統鍵盤彈出
    this.editor.addEventListener("focus", (e) => {
      if (this.imeActive) {
        // 設置為只讀，阻止系統鍵盤
        this.editor.setAttribute("readonly", "readonly")

        // 確保游標顯示
        this.updateCursorIndicator()

        // 短暫延遲後移除只讀屬性，允許編輯
        setTimeout(() => {
          this.editor.removeAttribute("readonly")
          this.updateCursorIndicator()
        }, 100)
      }
    })

    // 阻止系統鍵盤彈出 (額外保障)
    this.editor.addEventListener("click", (e) => {
      if (this.imeActive) {
        e.preventDefault()

        // 立即更新游標位置
        this.cursorPosition = {
          start: this.editor.selectionStart,
          end: this.editor.selectionEnd,
        }
        this.updateCursorIndicator()
      }
    })
  }

  // 改進 getTextPositionFromCoordinates 方法，使其更準確
  getTextPositionFromCoordinates(x, y) {
    // 如果編輯器為空，返回0
    if (!this.editor.value) return 0

    // 創建一個臨時元素來計算位置
    const temp = document.createElement("div")
    temp.style.position = "absolute"
    temp.style.visibility = "hidden"
    temp.style.whiteSpace = "pre-wrap"
    temp.style.wordBreak = "break-word"
    temp.style.font = window.getComputedStyle(this.editor).font
    temp.style.padding = window.getComputedStyle(this.editor).padding
    temp.style.width = `${this.editor.clientWidth}px`
    temp.style.lineHeight = window.getComputedStyle(this.editor).lineHeight
    temp.style.letterSpacing = window.getComputedStyle(this.editor).letterSpacing
    temp.style.boxSizing = "border-box"

    document.body.appendChild(temp)

    // 將編輯器文本分割成行
    const lines = this.editor.value.split("\n")
    let totalHeight = 0
    let lineIndex = 0

    // 找到點擊的行
    for (let i = 0; i < lines.length; i++) {
      temp.textContent = lines[i] || " " // 空行也需要高度
      const lineHeight = Number.parseFloat(window.getComputedStyle(temp).height)

      if (totalHeight + lineHeight > y) {
        lineIndex = i
        break
      }

      totalHeight += lineHeight

      if (i < lines.length - 1) {
        // 不是最後一行
        // 累加位置，包括換行符
        if (i === 0) {
          // 第一行不需要加上前面的換行符
        } else {
          // 其他行需要加上前面的換行符
        }
      }
    }

    // 如果點擊在所有行之後，選擇最後一行
    if (lineIndex >= lines.length) {
      lineIndex = lines.length - 1
    }

    // 計算到當前行開始的字符位置
    let position = 0
    for (let i = 0; i < lineIndex; i++) {
      position += lines[i].length + 1 // +1 for the newline character
    }

    // 找到行內的字符位置
    temp.textContent = ""
    const line = lines[lineIndex] || ""

    // 如果是空行或點擊在行尾
    if (
      line.length === 0 ||
      x >= this.editor.clientWidth - Number.parseFloat(window.getComputedStyle(this.editor).paddingRight)
    ) {
      position += line.length
    } else {
      // 逐字符測量寬度
      for (let i = 0; i <= line.length; i++) {
        temp.textContent = line.substring(0, i)
        if (Number.parseFloat(window.getComputedStyle(temp).width) >= x) {
          // 找到了最接近點擊位置的字符
          position += i
          break
        }

        // 如果到了行尾還沒找到
        if (i === line.length) {
          position += line.length
        }
      }
    }

    document.body.removeChild(temp)

    // 確保位置在有效範圍內
    return Math.min(Math.max(0, position), this.editor.value.length)
  }

  createIMEButton() {
    // 建立 IME 按鈕
    const imeButton = document.createElement("button")
    imeButton.id = "imeBtn"
    imeButton.className = "tool-btn ime-button"
    imeButton.title = "輸入法"
    imeButton.innerHTML = `
<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
  <rect x="2" y="4" width="20" height="16" rx="2" ry="2"></rect>
  <path d="M6 8h.01"></path>
  <path d="M10 8h.01"></path>
  <path d="M14 8h.01"></path>
  <path d="M18 8h.01"></path>
  <path d="M8 12h.01"></path>
  <path d="M12 12h.01"></path>
  <path d="M16 12h.01"></path>
  <path d="M7 16h10"></path>
</svg>
<span class="ime-indicator"></span>
`

    // 插入到工具列最前面
    const saveBtn = document.getElementById("saveBtn")
    if (saveBtn) {
      this.toolbar.insertBefore(imeButton, saveBtn)
    } else {
      this.toolbar.insertBefore(imeButton, this.toolbar.firstChild)
    }

    this.imeButton = imeButton

    // 建立語言選擇器按鈕 (只在網頁版顯示)
    const langSelector = document.createElement("button")
    langSelector.id = "imeLangBtn"
    langSelector.className = "tool-btn ime-lang-btn"
    langSelector.style.display = this.isMobile ? "none" : "block" // 手機版不顯示

    langSelector.textContent = langMap[this.currentLang] || Object.values(langMap)[0]

    // 插入到 IME 按鈕後面
    this.toolbar.insertBefore(langSelector, imeButton.nextSibling)
    this.langSelector = langSelector

    // 設定語言選擇器點擊事件
    langSelector.addEventListener("click", (e) => {
      e.stopPropagation()
      this.showLangMenu()
    })
  }

  createIMEToolbar() {
    // 建立語言選單
    this.createLangMenu()
  }

  createLangMenu() {
    // 建立語言選單
    const langMenu = document.createElement("div")
    langMenu.className = "dropdown-menu ime-lang-menu"
    langMenu.style.display = "none"

    // 使用已有的 langMap 替代 languages 陣列
    Object.entries(langMap).forEach(([id, name]) => {
      const langItem = document.createElement("div")
      langItem.className = `dropdown-item ime-lang-item ${id === this.currentLang ? "active" : ""}`
      langItem.dataset.lang = id
      langItem.textContent = name
      langItem.addEventListener("click", (e) => {
        e.stopPropagation()
        this.currentLang = id
        localStorage.setItem("imeLang", id)
        this.updateToolbarLang()
        langMenu.style.display = "none"
        // 更新空白鍵顯示
        if (this.isMobile && this.spaceBtn) {
          this.updateSpaceButtonText()
        }
      })
      langMenu.appendChild(langItem)
    })

    document.body.appendChild(langMenu)
    this.langMenu = langMenu
  }

  updateToolbarLang() {
    // 更新語言選擇器文字

    if (this.langSelector) {
      this.langSelector.textContent = langMap[this.currentLang] || Object.values(langMap)[0]
    }

    // 更新語言選單
    const langItems = this.langMenu.querySelectorAll(".ime-lang-item")
    langItems.forEach((item) => {
      if (item.dataset.lang === this.currentLang) {
        item.classList.add("active")
      } else {
        item.classList.remove("active")
      }
    })

    // 更新空白鍵顯示
    if (this.isMobile && this.spaceBtn) {
      this.updateSpaceButtonText()
    }
  }

  showLangMenu() {
    // 顯示語言選單
    const rect = this.langSelector.getBoundingClientRect()

    this.langMenu.style.display = "block"
    this.langMenu.style.position = "absolute"
    this.langMenu.style.left = `${rect.left}px`
    this.langMenu.style.top = `${rect.bottom + 5}px`

    // 點擊其他地方關閉選單
    const closeMenu = (e) => {
      if (!this.langMenu.contains(e.target) && !this.langSelector.contains(e.target)) {
        this.langMenu.style.display = "none"
        document.removeEventListener("click", closeMenu)
      }
    }

    setTimeout(() => {
      document.addEventListener("click", closeMenu)
    }, 0)
  }

  createCandidateArea() {
    // 建立候選字區域 (桌面版)
    const candidateArea = document.createElement("div")
    candidateArea.className = "ime-candidate-area"
    candidateArea.innerHTML = `
  <div class="ime-composing-header">
    <div class="ime-composing-text"></div>
    <div class="ime-controls">
      <div class="ime-pagination">
        <div class="ime-page-btn ime-prev-page disabled">
          <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <polyline points="15 18 9 12 15 6"></polyline>
          </svg>
        </div>
        <div class="ime-page-btn ime-next-page disabled">
          <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <polyline points="9 18 15 12 9 6"></polyline>
          </svg>
        </div>
      </div>
      <div class="ime-settings-btn">
        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          <circle cx="12" cy="12" r="1"></circle>
          <circle cx="12" cy="5" r="1"></circle>
          <circle cx="12" cy="19" r="1"></circle>
        </svg>
      </div>
    </div>
  </div>
  <div class="ime-candidate-list"></div>
`

    document.body.appendChild(candidateArea)

    // 添加調整大小的把手
    const resizeHandle = document.createElement("div")
    resizeHandle.className = "ime-resize-handle"
    candidateArea.appendChild(resizeHandle)
    this.resizeHandle = resizeHandle

    // 設定調整大小功能
    this.setupResizable(candidateArea, resizeHandle)

    this.candidateArea = candidateArea
    this.candidateList = candidateArea.querySelector(".ime-candidate-list")
    this.composingTextDisplay = candidateArea.querySelector(".ime-composing-text")
    this.prevPageBtn = candidateArea.querySelector(".ime-prev-page")
    this.nextPageBtn = candidateArea.querySelector(".ime-next-page")
    this.settingsBtn = candidateArea.querySelector(".ime-settings-btn")

    // 创建设置面板
    this.createSettingsPanel()

    // 设置设置按钮点击事件
    this.settingsBtn.addEventListener("click", () => {
      this.toggleSettingsPanel()
    })

    // 設定編碼點擊事件
    this.composingTextDisplay.addEventListener("click", () => {
      if (this.composingText.length > 0) {
        this.insertText(this.composingText)
        this.composingText = ""
        this.hideCandidates()
      }
    })

    // 設定翻頁按鈕事件
    this.prevPageBtn.addEventListener("click", () => {
      this.navigateCandidates("prev")
    })

    this.nextPageBtn.addEventListener("click", () => {
      this.navigateCandidates("next")
    })

    // 設定拖曳功能
    this.setupDraggable(candidateArea, "candidate")

    // 載入上次的位置
    const savedCandidatePos = localStorage.getItem("imeCandidatePos")
    if (savedCandidatePos) {
      try {
        const pos = JSON.parse(savedCandidatePos)
        candidateArea.style.left = `${pos.left}px`
        candidateArea.style.top = `${pos.top}px`
      } catch (e) {
        console.error("無法解析候選字區域位置", e)
      }
    } else {
      // 預設位置：視窗中間偏下
      candidateArea.style.left = "50%"
      candidateArea.style.top = "70%"
      candidateArea.style.transform = "translate(-50%, -50%)"
    }
  }

  createMobileCandidateArea() {
    // 建立行動裝置候選字區域
    const mobileCandidateArea = document.createElement("div")
    mobileCandidateArea.className = "ime-mobile-candidate-area"
    mobileCandidateArea.innerHTML = `
    <div class="ime-hide-keyboard-btn">
      <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
      <polyline points="6 9 12 15 18 9"></polyline>
      </svg>
    </div>
    <div class="ime-mobile-candidate-container with-button">
      <div class="ime-mobile-composing-text"></div>
      <div class="ime-mobile-candidate-list"></div>
    </div>
  `

    this.mobileCandidateArea = mobileCandidateArea
    this.mobileCandidateContainer = mobileCandidateArea.querySelector(".ime-mobile-candidate-container")
    this.mobileCandidateList = mobileCandidateArea.querySelector(".ime-mobile-candidate-list")
    this.mobileComposingText = mobileCandidateArea.querySelector(".ime-mobile-composing-text")
    this.hideKeyboardBtn = mobileCandidateArea.querySelector(".ime-hide-keyboard-btn")

    // 設定編碼點擊事件
    this.mobileComposingText.addEventListener("click", () => {
      if (this.composingText.length > 0) {
        this.insertText(this.composingText)
        this.composingText = ""
        this.hideMobileCandidates()
        this.showPunctuationCandidates()
        this.updateSpaceButtonText()
      }
    })

    // 設定隱藏鍵盤按鈕事件
    this.hideKeyboardBtn.addEventListener("click", () => {
      this.collapseKeyboard()
    })
  }

  setupDraggable(element, type) {
    element.addEventListener("mousedown", (e) => {
      // 如果點擊的是按鈕，不啟動拖曳
      if (
        e.target.tagName === "BUTTON" ||
        e.target.closest("button") ||
        e.target.closest(".ime-page-btn") ||
        e.target.closest(".ime-candidate-item")
      ) {
        return
      }

      if (type === "toolbar") {
        this.isDraggingToolbar = true
      } else if (type === "candidate") {
        this.isDraggingCandidates = true
      }

      // 計算點擊位置與元素左上角的偏移
      const rect = element.getBoundingClientRect()
      this.dragOffsetX = e.clientX - rect.left
      this.dragOffsetY = e.clientY - rect.top

      // 移除可能的 transform
      element.style.transform = "none"

      // 防止選取文字
      e.preventDefault()
    })

    document.addEventListener("mousemove", (e) => {
      if (this.isDraggingToolbar && type === "toolbar") {
        const left = e.clientX - this.dragOffsetX
        const top = e.clientY - this.dragOffsetY

        element.style.left = `${left}px`
        element.style.top = `${top}px`
      } else if (this.isDraggingCandidates && type === "candidate") {
        const left = e.clientX - this.dragOffsetX
        const top = e.clientY - this.dragOffsetY

        element.style.left = `${left}px`
        element.style.top = `${top}px`
      }
    })

    document.addEventListener("mouseup", () => {
      if (this.isDraggingToolbar && type === "toolbar") {
        this.isDraggingToolbar = false

        // 儲存位置
        const rect = element.getBoundingClientRect()
        localStorage.setItem(
          "imeToolbarPos",
          JSON.stringify({
            left: rect.left,
            top: rect.top,
          }),
        )
      } else if (this.isDraggingCandidates && type === "candidate") {
        this.isDraggingCandidates = false

        // 調整位置確保在視窗內
        this.adjustCandidatePosition()

        // 儲存位置
        const rect = element.getBoundingClientRect()
        localStorage.setItem(
          "imeCandidatePos",
          JSON.stringify({
            left: rect.left,
            top: rect.top,
          }),
        )
      }
    })
  }

  setupResizable(element, handle) {
    let isResizing = false
    let startWidth, startX

    handle.addEventListener("mousedown", (e) => {
      // 防止觸發拖曳
      e.stopPropagation()

      isResizing = true
      startWidth = element.offsetWidth
      startX = e.clientX

      // 防止選取文字
      e.preventDefault()
    })

    document.addEventListener("mousemove", (e) => {
      if (!isResizing) return

      const newWidth = startWidth + (e.clientX - startX)

      // 設定最小寬度
      const minWidth = 200

      if (newWidth >= minWidth) {
        element.style.width = `${newWidth}px`

        // 更新候選字區域
        if (this.composingText.length > 0) {
          this.adjustCandidatePosition()
          this.updateCandidates() // 重新計算並顯示候選字
        }
      }
    })

    document.addEventListener("mouseup", () => {
      if (isResizing) {
        isResizing = false

        // 儲存寬度
        const size = {
          width: element.offsetWidth,
        }
        localStorage.setItem("imeCandidateSize", JSON.stringify(size))
      }
    })
  }

  createKeyboard() {
    // 建立行動裝置鍵盤
    const keyboard = document.createElement("div")
    keyboard.className = "ime-keyboard"

    // 獲取當前鍵盤配置
    const layoutKey = this.currentKeyboardLayout
    const layout = this.customLayouts[layoutKey] || this.keyboardLayouts[layoutKey] || this.keyboardLayouts.qwerty

    // 建立鍵盤行
    layout.rows.forEach((row, rowIndex) => {
      const rowElement = document.createElement("div")
      rowElement.className = "ime-keyboard-row"

      // 處理每一行的按鍵
      row.forEach((key) => {
        let btn

        if (key === "shift") {
          // Shift 鍵
          btn = document.createElement("div")
          btn.className = "ime-key-btn ime-special ime-shift"
          btn.innerHTML = `
            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <path d="M12 8l-9 9h6v5h6v-5h6z"></path>
            </svg>
          `
          btn.dataset.key = "shift"
        } else if (key === "backspace") {
          // 退格鍵
          btn = document.createElement("div")
          btn.className = "ime-key-btn ime-special ime-backspace"
          btn.innerHTML = `
            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <path d="M21 4H8l-7 8 7 8h13a2 2 0 0 0 2-2V6a2 2 0 0 0-2-2z"></path>
              <line x1="18" y1="9" x2="12" y2="15"></line>
              <line x1="12" y1="9" x2="18" y2="15"></line>
            </svg>
          `
          btn.dataset.key = "backspace"
        } else if (key === "mode") {
          // 模式切換鍵
          btn = document.createElement("div")
          btn.className = "ime-key-btn ime-special ime-mode"
          btn.textContent = "中/英"
          btn.dataset.key = "mode"
        } else if (key === "globe") {
          // 地球圖示 (語言切換)
          btn = document.createElement("div")
          btn.className = "ime-key-btn ime-special ime-globe"
          btn.innerHTML = `
            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <circle cx="12" cy="12" r="10"></circle>
              <line x1="2" y1="12" x2="22" y2="12"></line>
              <path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"></path>
            </svg>
          `
          btn.dataset.key = "globe"
        } else if (key === "space") {
          // 空格鍵 - 顯示當前語言
          btn = document.createElement("div")
          btn.className = "ime-key-btn ime-space"
          btn.textContent = langMap[this.currentLang] || Object.values(langMap)[0]
          btn.dataset.key = " "
        } else if (key === "enter") {
          // 回車鍵
          btn = document.createElement("div")
          btn.className = "ime-key-btn ime-special ime-return"
          btn.innerHTML = `
            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <path d="M9 10 4 15l5 5"></path>
              <path d="M20 4v7a4 4 0 0 1-4 4H4"></path>
            </svg>
          `
          btn.dataset.key = "enter"
        } else if (key === "settings") {
          // 設定按鈕
          btn = document.createElement("div")
          btn.className = "ime-key-btn ime-special ime-settings"
          btn.innerHTML = `
            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <circle cx="12" cy="12" r="3"></circle>
              <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z"></path>
            </svg>
          `
          btn.dataset.key = "settings"
        } else {
          // 一般按鍵
          btn = document.createElement("div")
          btn.className = "ime-key-btn"

          // 檢查是否有自訂按鍵映射
          if (layout.keyMapping && layout.keyMapping[key]) {
            const keyMapping = layout.keyMapping[key]
            btn.innerHTML = `
              <span class="ime-key-display">${keyMapping.display}</span>
              <span class="ime-key-hint">${keyMapping.hint}</span>
            `
            btn.dataset.key = keyMapping.mapping
            btn.dataset.display = keyMapping.display
            btn.dataset.hint = keyMapping.hint
            btn.dataset.code = keyMapping.code
            btn.dataset.mapping = keyMapping.mapping
          } else {
            btn.textContent = key
            btn.dataset.key = key
          }
        }

        rowElement.appendChild(btn)
      })

      keyboard.appendChild(rowElement)
    })

    // 添加鍵盤配置切換按鈕
    const keyboardSettingsBtn = document.createElement("div")
    keyboardSettingsBtn.className = "ime-keyboard-settings-btn"
    keyboardSettingsBtn.innerHTML = `
      <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
        <circle cx="12" cy="12" r="3"></circle>
        <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z"></path>
      </svg>
    `
    keyboard.appendChild(keyboardSettingsBtn)
    this.keyboardSettingsBtn = keyboardSettingsBtn

    // 添加候選字區域到鍵盤上方
    keyboard.insertBefore(this.mobileCandidateArea, keyboard.firstChild)

    document.body.appendChild(keyboard)
    this.keyboard = keyboard

    // 儲存按鍵參考
    this.shiftBtn = keyboard.querySelector(".ime-shift")
    this.modeBtn = keyboard.querySelector(".ime-mode")
    this.globeBtn = keyboard.querySelector(".ime-globe")
    this.backspaceBtn = keyboard.querySelector(".ime-backspace")
    this.spaceBtn = keyboard.querySelector(".ime-space")
    this.settingsBtn = keyboard.querySelector(".ime-settings")
    this.isShiftActive = false
    this.isEnglishMode = false

    // 建立行動裝置語言選單
    this.createMobileLangMenu()

    // 建立鍵盤配置選單
    this.createKeyboardLayoutMenu()

    // 設定地球圖示點擊事件
    this.globeBtn.addEventListener("click", () => {
      this.showMobileLangMenu()
    })

    // 設定鍵盤配置按鈕點擊事件
    this.keyboardSettingsBtn.addEventListener("click", () => {
      this.showKeyboardLayoutMenu()
    })

    // 設定設定按鈕點擊事件
    if (this.settingsBtn) {
      this.settingsBtn.addEventListener("click", () => {
        this.showKeyboardLayoutMenu()
      })
    }

    // 建立展開鍵盤按鈕
    const expandBtn = document.createElement("div")
    expandBtn.className = "ime-keyboard-expand"
    expandBtn.innerHTML = `
      <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
        <rect x="2" y="4" width="20" height="16" rx="2" ry="2"></rect>
        <path d="M6 8h.01"></path>
        <path d="M10 8h.01"></path>
        <path d="M14 8h.01"></path>
        <path d="M18 8h.01"></path>
        <path d="M8 12h.01"></path>
        <path d="M12 12h.01"></path>
        <path d="M16 12h.01"></path>
        <path d="M7 16h10"></path>
      </svg>
    `
    expandBtn.addEventListener("click", () => {
      this.expandKeyboard()
    })
    document.body.appendChild(expandBtn)
    this.expandBtn = expandBtn
  }

  createMobileLangMenu() {
    // 建立行動裝置語言選單
    const mobileLangMenu = document.createElement("div")
    mobileLangMenu.className = "ime-mobile-lang-menu"
    mobileLangMenu.style.display = "none"

    // 使用已經定義好的 langMap 來建立語言選項
    Object.entries(langMap).forEach(([id, name]) => {
      const langItem = document.createElement("div")
      langItem.className = `ime-mobile-lang-item ${id === this.currentLang ? "active" : ""}`
      langItem.dataset.lang = id
      langItem.textContent = name
      langItem.addEventListener("click", () => {
        this.currentLang = id
        localStorage.setItem("imeLang", id)
        // 更新選中狀態
        mobileLangMenu.querySelectorAll(".ime-mobile-lang-item").forEach((item) => {
          if (item.dataset.lang === id) {
            item.classList.add("active")
          } else {
            item.classList.remove("active")
          }
        })
        // 更新空白鍵顯示
        this.updateSpaceButtonText()
        // 如果正在輸入，更新候選字
        if (this.composingText.length > 0) {
          this.updateMobileCandidates()
        }
        // 隱藏選單
        mobileLangMenu.style.display = "none"
      })
      mobileLangMenu.appendChild(langItem)
    })

    document.body.appendChild(mobileLangMenu)
    this.mobileLangMenu = mobileLangMenu
  }

  createKeyboardLayoutMenu() {
    // 建立鍵盤配置選單
    const keyboardLayoutMenu = document.createElement("div")
    keyboardLayoutMenu.className = "ime-keyboard-layout-menu"
    keyboardLayoutMenu.style.display = "none"

    // 添加標題
    const menuTitle = document.createElement("div")
    menuTitle.className = "ime-menu-title"
    menuTitle.textContent = "鍵盤配置"
    keyboardLayoutMenu.appendChild(menuTitle)

    // 添加內建配置
    const builtInSection = document.createElement("div")
    builtInSection.className = "ime-menu-section"

    const builtInTitle = document.createElement("div")
    builtInTitle.className = "ime-section-title"
    builtInTitle.className = "ime-section-title"
    builtInTitle.textContent = "內建配置"
    builtInSection.appendChild(builtInTitle)

    // 添加內建鍵盤配置選項
    Object.entries(this.keyboardLayouts).forEach(([id, layout]) => {
      const layoutItem = document.createElement("div")
      layoutItem.className = `ime-layout-item ${id === this.currentKeyboardLayout ? "active" : ""}`
      layoutItem.dataset.layout = id

      const layoutName = document.createElement("span")
      layoutName.textContent = layout.name
      layoutItem.appendChild(layoutName)

      layoutItem.addEventListener("click", () => {
        this.switchKeyboardLayout(id)
        keyboardLayoutMenu.style.display = "none"
      })

      builtInSection.appendChild(layoutItem)
    })

    keyboardLayoutMenu.appendChild(builtInSection)

    // 添加自訂配置
    const customSection = document.createElement("div")
    customSection.className = "ime-menu-section"

    const customTitle = document.createElement("div")
    customTitle.className = "ime-section-title"
    customTitle.textContent = "自訂配置"
    customSection.appendChild(customTitle)

    // 添加自訂鍵盤配置選項
    if (Object.keys(this.customLayouts).length > 0) {
      Object.entries(this.customLayouts).forEach(([id, layout]) => {
        const layoutItem = document.createElement("div")
        layoutItem.className = `ime-layout-item ${id === this.currentKeyboardLayout ? "active" : ""}`
        layoutItem.dataset.layout = id

        const layoutName = document.createElement("span")
        layoutName.textContent = layout.name
        layoutItem.appendChild(layoutName)

        // 添加編輯按鈕
        const editBtn = document.createElement("span")
        editBtn.className = "ime-layout-edit"
        editBtn.style.display = "flex" // 始終顯示編輯按鈕
        editBtn.innerHTML = `
          <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path>
            <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path>
          </svg>
        `
        editBtn.addEventListener("click", (e) => {
          e.stopPropagation()
          this.editCustomLayout(id)
          keyboardLayoutMenu.style.display = "none"
        })
        layoutItem.appendChild(editBtn)

        // 添加刪除按鈕
        const deleteBtn = document.createElement("span")
        deleteBtn.className = "ime-layout-delete"
        deleteBtn.style.display = "flex" // 始終顯示刪除按鈕
        deleteBtn.innerHTML = `
          <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <polyline points="3 6 5 6 21 6"></polyline>
            <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
            <line x1="10" y1="11" x2="10" y2="17"></line>
            <line x1="14" y1="11" x2="14" y2="17"></line>
          </svg>
        `
        deleteBtn.addEventListener("click", (e) => {
          e.stopPropagation()
          this.deleteCustomLayout(id)
          keyboardLayoutMenu.style.display = "none"
        })
        layoutItem.appendChild(deleteBtn)

        layoutItem.addEventListener("click", () => {
          this.switchKeyboardLayout(id)
          keyboardLayoutMenu.style.display = "none"
        })

        customSection.appendChild(layoutItem)
      })
    } else {
      const noCustomLayout = document.createElement("div")
      noCustomLayout.className = "ime-no-custom-layout"
      noCustomLayout.textContent = "尚無自訂配置"
      customSection.appendChild(noCustomLayout)
    }

    keyboardLayoutMenu.appendChild(customSection)

    // 添加新增自訂配置按鈕
    const addCustomBtn = document.createElement("div")
    addCustomBtn.className = "ime-add-custom-btn"
    addCustomBtn.innerHTML = `
      <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
        <circle cx="12" cy="12" r="10"></circle>
        <line x1="12" y1="8" x2="12" y2="16"></line>
        <line x1="8" y1="12" x2="16" y2="12"></line>
      </svg>
      <span>新增自訂配置</span>
    `
    addCustomBtn.addEventListener("click", () => {
      this.createCustomLayout()
      keyboardLayoutMenu.style.display = "none"
    })
    keyboardLayoutMenu.appendChild(addCustomBtn)

    document.body.appendChild(keyboardLayoutMenu)
    this.keyboardLayoutMenu = keyboardLayoutMenu
  }

  showKeyboardLayoutMenu() {
    if (!this.keyboardLayoutMenu) return

    // 獲取鍵盤配置按鈕位置
    const rect = this.keyboardSettingsBtn.getBoundingClientRect()

    // 設定選單位置
    this.keyboardLayoutMenu.style.display = "block"
    this.keyboardLayoutMenu.style.position = "fixed"
    this.keyboardLayoutMenu.style.bottom = `${window.innerHeight - rect.top + 10}px`
    this.keyboardLayoutMenu.style.left = `${rect.left - this.keyboardLayoutMenu.offsetWidth / 2}px`

    // 更新選中狀態
    this.keyboardLayoutMenu.querySelectorAll(".ime-layout-item").forEach((item) => {
      if (item.dataset.layout === this.currentKeyboardLayout) {
        item.classList.add("active")
      } else {
        item.classList.remove("active")
      }
    })

    // 點擊其他地方關閉選單
    const closeMenu = (e) => {
      if (!this.keyboardLayoutMenu.contains(e.target) && !this.keyboardSettingsBtn.contains(e.target)) {
        this.keyboardLayoutMenu.style.display = "none"
        document.removeEventListener("click", closeMenu)
      }
    }

    setTimeout(() => {
      document.addEventListener("click", closeMenu)
    }, 0)
  }

  showMobileLangMenu() {
    if (!this.mobileLangMenu) return

    // Get the position of the globe button
    const rect = this.globeBtn.getBoundingClientRect()

    // Set the menu to fixed position instead of absolute
    this.mobileLangMenu.style.display = "block"
    this.mobileLangMenu.style.position = "fixed"
    this.mobileLangMenu.style.bottom = `${window.innerHeight - rect.top + 10}px`
    this.mobileLangMenu.style.left = `${rect.left - 50}px`

    // Update selected language status
    this.mobileLangMenu.querySelectorAll(".ime-mobile-lang-item").forEach((item) => {
      if (item.dataset.lang === this.currentLang) {
        item.classList.add("active")
      } else {
        item.classList.remove("active")
      }
    })

    // Close menu when clicking outside
    const closeMenu = (e) => {
      if (!this.mobileLangMenu.contains(e.target) && !this.globeBtn.contains(e.target)) {
        this.mobileLangMenu.style.display = "none"
        document.removeEventListener("click", closeMenu)
      }
    }

    setTimeout(() => {
      document.addEventListener("click", closeMenu)
    }, 0)
  }

  updateSpaceButtonText() {
    if (!this.spaceBtn) return

    // 根據是否有編碼決定顯示語言名稱或空白
    if (this.composingText.length > 0) {
      this.spaceBtn.textContent = "空白"
    } else {
      this.spaceBtn.textContent = langMap[this.currentLang] || Object.values(langMap)[0]
    }
  }

  updateHideKeyboardButton() {
    if (!this.hideKeyboardBtn || !this.mobileCandidateContainer) return

    // 根據是否有編碼決定是否顯示隱藏鍵盤按鈕
    if (this.composingText.length > 0) {
      this.hideKeyboardBtn.classList.add("hidden")
      this.mobileCandidateContainer.classList.remove("with-button")
    } else {
      this.hideKeyboardBtn.classList.remove("hidden")
      this.mobileCandidateContainer.classList.add("with-button")
    }
  }

  collapseKeyboard() {
    if (this.keyboard) {
      this.keyboard.style.display = "none"
      this.expandBtn.style.display = "flex"
      this.isKeyboardCollapsed = true

      // 恢復編輯器高度
      this.editor.style.height = ""
    }
  }

  expandKeyboard() {
    if (this.keyboard) {
      this.keyboard.style.display = "block"
      this.expandBtn.style.display = "none"
      this.isKeyboardCollapsed = false

      // 調整編輯器高度，避免被鍵盤遮擋
      this.editor.style.height = `calc(100vh - ${this.keyboard.offsetHeight + 20}px)`
    }
  }

  setupEventListeners() {
    // IME 按鈕點擊事件
    this.imeButton.addEventListener("click", () => {
      this.toggleIME()
    })

    // 編輯器輸入事件
    this.editor.addEventListener("keydown", (e) => {
      if (!this.imeActive) return

      // 如果是行動裝置，阻止預設輸入法
      if (this.isMobile) {
        e.preventDefault()
        return
      }

      // 處理鍵盤輸入
      this.handleKeyDown(e)
    })

    // 編輯器點擊事件
    this.editor.addEventListener("click", () => {
      if (!this.imeActive) return

      // 如果是行動裝置且輸入法已啟用，更新光標位置
      if (this.isMobile) {
        // 更新光標位置
        setTimeout(() => {
          this.cursorPosition = {
            start: this.editor.selectionStart,
            end: this.editor.selectionEnd,
          }
          console.log("Click updated cursor position:", this.cursorPosition)
          this.updateCursorIndicator()
        }, 10)
        return
      }

      this.hideCandidates()
      this.composingText = ""
    })

    // 如果是行動裝置，設定鍵盤事件
    if (this.isMobile && this.keyboard) {
      this.keyboard.addEventListener("click", (e) => {
        if (e.target.classList.contains("ime-key-btn") || e.target.closest(".ime-key-btn")) {
          const keyBtn = e.target.classList.contains("ime-key-btn") ? e.target : e.target.closest(".ime-key-btn")
          const key = keyBtn.dataset.key
          this.handleMobileKeyPress(key)
        }
      })

      // 設定行動裝置候選字點擊事件
      if (this.isMobile && this.mobileCandidateList) {
        this.mobileCandidateList.addEventListener("click", (e) => {
          const candidateItem = e.target.closest(".ime-mobile-candidate-item")
          if (candidateItem) {
            const index = Number.parseInt(candidateItem.dataset.index)
            if (!isNaN(index)) {
              this.selectCandidate(index)

              setTimeout(() => {
                this.editor.removeAttribute("readonly")
                this.editor.setSelectionRange(this.cursorPosition.start, this.cursorPosition.end)
                this.updateCursorIndicator()
              }, 10)
            }
          }
        })
      }
    }

    // 視窗大小變更事件
    window.addEventListener("resize", () => {
      if (this.imeActive) {
        if (this.candidateArea.style.display === "block") {
          this.adjustCandidatePosition()

          // 如果有候選字，重新計算並顯示
          if (this.composingText.length > 0) {
            this.updateCandidates()
          }
        }
      }
    })

    // 添加滾動事件監聽器
    window.addEventListener("scroll", () => {
      if (this.imeActive && this.candidateArea.style.display === "block" && !this.isMobile) {
        this.adjustCandidatePosition()
      }
    })
  }

  activateIME() {
    if (!this.imeActive) {
      this.imeActive = true
      this.imeButton.classList.add("active")
      this.editor.classList.add("editor-ime-active")

      // 添加這一行，確保啟用輸入法時設置 inputmode="none"
      if (this.isMobile) {
        this.editor.setAttribute("inputmode", "none")
      }

      // 如果是行動裝置，顯示鍵盤
      if (this.isMobile && this.keyboard) {
        this.keyboard.style.display = "block"
        this.expandBtn.style.display = "none"
        this.isKeyboardCollapsed = false

        // 調整編輯器高度，避免被鍵盤遮擋
        this.editor.style.height = `calc(100vh - ${this.keyboard.offsetHeight + 20}px)`

        // 記錄當前光標位置
        this.cursorPosition = {
          start: this.editor.selectionStart,
          end: this.editor.selectionEnd,
        }

        // 顯示標點符號作為候選字
        this.showPunctuationCandidates()

        // 更新隱藏鍵盤按鈕狀態
        this.updateHideKeyboardButton()

        // 更新視覺光標
        this.updateCursorIndicator()
      }

      // 聚焦編輯器
      if (!this.isMobile) {
        this.editor.focus()
      }
    }
  }

  toggleIME() {
    this.imeActive = !this.imeActive

    if (this.imeActive) {
      this.imeButton.classList.add("active")
      this.editor.classList.add("editor-ime-active")

      // 添加這一行，確保啟用輸入法時設置 inputmode="none"
      if (this.isMobile) {
        this.editor.setAttribute("inputmode", "none")
      }

      // 如果是行動裝置，顯示鍵盤
      if (this.isMobile && this.keyboard) {
        this.keyboard.style.display = "block"
        this.expandBtn.style.display = "none"
        this.isKeyboardCollapsed = false

        // 調整編輯器高度，避免被鍵盤遮擋
        this.editor.style.height = `calc(100vh - ${this.keyboard.offsetHeight + 20}px)`

        // 顯示標點符號作為候選字
        this.showPunctuationCandidates()

        // 更新隱藏鍵盤按鈕狀態
        this.updateHideKeyboardButton()

        // 更新視覺光標
        this.updateCursorIndicator()
      }
    } else {
      this.imeButton.classList.remove("active")
      this.editor.classList.remove("editor-ime-active")

      // 添加這一行，禁用輸入法時移除 inputmode="none"
      if (this.isMobile) {
        this.editor.removeAttribute("inputmode")
      }

      this.hideCandidates()

      // 添加檢查確保只在移動設備上調用
      if (this.isMobile) {
        this.hideMobileCandidates()
        this.hideCursorIndicator()
      }

      this.composingText = ""

      // 如果是行動裝置，隱藏鍵盤
      if (this.isMobile && this.keyboard) {
        this.keyboard.style.display = "none"
        this.expandBtn.style.display = "none"

        // 恢復編輯器高度
        this.editor.style.height = ""
      }
    }

    // 聚焦編輯器
    if (!this.isMobile) {
      this.editor.focus()
    }
  }

  handleKeyDown(e) {
    if (!this.imeActive) return

    // 如果是行動裝置，阻止預設輸入法
    if (this.isMobile) {
      e.preventDefault()
      return
    }

    // 檢查是否按下了修飾鍵 (Ctrl, Shift, Alt)
    if (e.ctrlKey || e.altKey) {
      // 如果按下了修飾鍵，不處理這個按鍵事件，讓瀏覽器使用預設行為
      return
    }

    // 處理鍵盤輸入
    // 如果正在輸入中文且候選字區域顯示中
    if (this.composingText.length > 0 && this.candidateArea.style.display === "block") {
      // 處理特殊鍵
      switch (e.key) {
        case "Escape":
          e.preventDefault()
          this.composingText = ""
          this.hideCandidates()
          return
        case "Backspace":
          e.preventDefault()
          this.composingText = this.composingText.slice(0, -1)
          if (this.composingText.length === 0) {
            this.hideCandidates()
          } else {
            this.updateCandidates()
          }
          return
        case "Enter":
          e.preventDefault()
          // 直接輸出當前編碼
          this.insertText(this.composingText)
          this.composingText = ""
          this.hideCandidates()
          return
        case "ArrowRight":
          e.preventDefault()
          this.navigateCandidates("next")
          return
        case "ArrowLeft":
          e.preventDefault()
          this.navigateCandidates("prev")
          return
        case " ":
          e.preventDefault()
          // 檢查當前輸入法是否包含數字編碼
          const currentIMEData = imeData[this.currentLang]
          const hasNumericCodes = Object.keys(currentIMEData.data).some((key) => /\d/.test(key))

          // 如果有編碼但沒有候選字，按空白鍵清空編碼
          if (this.candidates.length === 0) {
            this.composingText = ""
            this.hideCandidates()
            return
          }

          if (hasNumericCodes) {
            // 如果包含數字編碼
            if (this.composingText.endsWith(" ")) {
              // 已經有空格作為編碼截止鍵，現在用空格選擇第一個候選字
              if (this.candidates.length > 0) {
                this.selectCandidate(0)
              }
            } else {
              // 第一次按空格，作為編碼截止鍵
              this.composingText += " "
              // 如果添加空格後沒有候選字，但之前有前綴匹配的候選字，保留這些候選字
              const prevCandidates = [...this.candidates]
              this.updateCandidates()

              // 如果更新後沒有候選字但之前有，則恢復之前的候選字
              if (this.candidates.length === 0 && prevCandidates.length > 0) {
                this.candidates = prevCandidates
                this.showCandidates()
              }
            }
          } else {
            // 不包含數字編碼，直接選擇第一個候選字
            if (this.candidates.length > 0) {
              this.selectCandidate(0)
            }
          }
          return
        case ",":
          e.preventDefault()
          this.navigateCandidates("prev")
          return
        case ".":
          e.preventDefault()
          this.navigateCandidates("next")
          return
      }

      // 處理數字鍵選擇候選字
      if (e.key >= "1" && e.key <= "9") {
        const index = Number.parseInt(e.key) - 1
        const currentIMEData = imeData[this.currentLang]

        // 檢查當前輸入法是否包含數字編碼
        const hasNumericCodes = Object.keys(currentIMEData.data).some((key) => /\d/.test(key))

        if (hasNumericCodes) {
          // 如果包含數字編碼，需要按空格後才能用數字選字
          if (this.composingText.endsWith(" ")) {
            e.preventDefault()
            this.selectCandidate(index)
            return
          }
        } else {
          // 如果不包含數字編碼，可以直接用數字選字
          if (index < this.candidates.length) {
            e.preventDefault()
            this.selectCandidate(index)
            return
          }
        }
      }
    }

    // 如果是字母或數字，加入到輸入中
    if (/^[a-z0-9]$/i.test(e.key)) {
      e.preventDefault()
      this.composingText += e.key.toLowerCase()
      this.updateCandidates()
    }
  }

  handleMobileKeyPress(key) {
    if (!this.imeActive) return

    // Handle special keys
    switch (key) {
      case "shift":
        this.isShiftActive = !this.isShiftActive
        this.shiftBtn.classList.toggle("ime-active", this.isShiftActive)
        this.updateKeyboardCase()
        return
      case "mode":
        this.isEnglishMode = !this.isEnglishMode
        this.modeBtn.classList.toggle("ime-active", this.isEnglishMode)
        this.modeBtn.textContent = this.isEnglishMode ? "英文" : "中文"

        // 切換模式時更新標點符號列表
        if (this.isMobile) {
          // 更新候選字區域
          this.showPunctuationCandidates()
        }
        return
      case "globe":
        this.showMobileLangMenu()
        return
      case "settings":
        this.showKeyboardLayoutMenu()
        return
      case "backspace":
        if (this.composingText && this.composingText.length > 0) {
          // 有編碼時，刪除編碼的最後一個字符
          this.composingText = this.composingText.slice(0, -1)

          if (this.composingText.length === 0) {
            // 如果編碼被完全刪除，顯示標點符號
            this.hideMobileCandidates()
            this.showPunctuationCandidates()
            // 更新空白鍵顯示
            this.updateSpaceButtonText()
            // 更新隱藏鍵盤按鈕狀態
            this.updateHideKeyboardButton()
          } else {
            // 否則更新候選字
            this.updateMobileCandidates()
          }
        } else {
          // 沒有編碼時，刪除編輯器中的文字
          // 使用保存的光標位置
          const start = this.cursorPosition.start
          const end = this.cursorPosition.end

          if (start === end && start > 0) {
            // 刪除光標前的一個字符
            const newValue = this.editor.value.slice(0, start - 1) + this.editor.value.slice(end)
            this.editor.value = newValue

            // 更新光標位置
            const newPosition = start - 1
            this.cursorPosition = {
              start: newPosition,
              end: newPosition,
            }

            // 設置編輯器的選擇範圍，使系統游標顯示在正確位置
            this.editor.setSelectionRange(newPosition, newPosition)
          } else if (start !== end) {
            // 刪除選中的文字
            const newValue = this.editor.value.slice(0, start) + this.editor.value.slice(end)
            this.editor.value = newValue

            // 更新光標位置
            this.cursorPosition = {
              start: start,
              end: start,
            }

            // 設置編輯器的選擇範圍，使系統游標顯示在正確位置
            this.editor.setSelectionRange(start, start)
          }

          // 觸發 input 事件
          const event = new Event("input", { bubbles: true })
          this.editor.dispatchEvent(event)

          // 更新視覺光標
          this.updateCursorIndicator()
        }
        return

      case "enter":
        if (this.composingText.length > 0) {
          // 直接輸出當前編碼
          this.insertText(this.composingText)
          this.composingText = ""
          this.hideMobileCandidates()
          // 顯示標點符號作為候選字
          this.showPunctuationCandidates()
          // 更新空白鍵顯示
          this.updateSpaceButtonText()
          // 更新隱藏鍵盤按鈕狀態
          this.updateHideKeyboardButton()
        } else {
          // Insert newline
          // Use saved cursor position
          const start = this.cursorPosition.start
          const end = this.cursorPosition.end

          const newValue = this.editor.value.slice(0, start) + "\n" + this.editor.value.slice(end)
          this.editor.value = newValue

          // Update cursor position
          this.cursorPosition = {
            start: start + 1,
            end: start + 1,
          }

          // Trigger input event
          const event = new Event("input", { bubbles: true })
          this.editor.dispatchEvent(event)

          // Ensure the editor is not readonly
          this.editor.removeAttribute("readonly")

          // Set selection range to update the cursor position
          this.editor.setSelectionRange(this.cursorPosition.start, this.cursorPosition.end)

          // Force focus to ensure the cursor is visible
          this.editor.focus()

          // Update visual cursor
          this.updateCursorIndicator()
        }
        return
    }

    // Ensure cursor visibility after any key press
    setTimeout(() => {
      // Remove readonly to ensure the cursor can be displayed
      this.editor.removeAttribute("readonly")

      // Set selection range to update the cursor position
      this.editor.setSelectionRange(this.cursorPosition.start, this.cursorPosition.end)

      // Force focus to ensure the cursor is visible
      this.editor.focus()

      // Update the cursor indicator
      this.updateCursorIndicator()
    }, 10)

    // 英文模式直接輸入
    if (this.isEnglishMode) {
      const char = this.isShiftActive ? key.toUpperCase() : key

      // 使用保存的光標位置
      const start = this.cursorPosition.start
      const end = this.cursorPosition.end

      const newValue = this.editor.value.slice(0, start) + char + this.editor.value.slice(end)
      this.editor.value = newValue

      // 更新光標位置
      this.cursorPosition = {
        start: start + 1,
        end: start + 1,
      }

      // 觸發 input 事件
      const event = new Event("input", { bubbles: true })
      this.editor.dispatchEvent(event)

      // 在英文模式下，shift 鍵保持按下狀態，不自動關閉
      // 不需要做任何操作，保留 shift 狀態

      // 更新視覺光標
      this.updateCursorIndicator()
      return
    }

    // 中文模式處理輸入
    if (key === " ") {
      const currentIMEData = imeData[this.currentLang]
      const hasNumericCodes = Object.keys(currentIMEData.data).some((key) => /\d/.test(key))

      // 如果有編碼但沒有候選字，按空白鍵清空編碼
      if (this.composingText.length > 0 && this.candidates.length === 0) {
        this.composingText = ""
        this.hideMobileCandidates()
        // 顯示標點符號作為候選字
        this.showPunctuationCandidates()
        // 更新空白鍵顯示
        this.updateSpaceButtonText()
        // 更新隱藏鍵盤按鈕狀態
        this.updateHideKeyboardButton()
        return
      }

      if (hasNumericCodes && this.composingText.length > 0) {
        // 如果包含數字編碼且正在輸入中
        if (this.composingText.endsWith(" ")) {
          // 已經有空格作為編碼截止鍵，現在用空格選擇第一個候選字
          if (this.candidates.length > 0) {
            this.selectCandidate(0)
          }
        } else {
          // 第一次按空格，作為編碼截止鍵
          this.composingText += " "
          // 如果添加空格後沒有候選字，但之前有前綴匹配的候選字，保留這些候選字
          const prevCandidates = [...this.candidates]
          this.updateMobileCandidates()

          // 如果更新後沒有候選字但之前有，則恢復之前的候選字
          if (this.candidates.length === 0 && prevCandidates.length > 0) {
            this.candidates = prevCandidates
            // 重新顯示候選字
            this.mobileCandidateList.innerHTML = ""
            this.candidates.forEach((candidate, index) => {
              const candidateItem = document.createElement("div")
              candidateItem.className = "ime-mobile-candidate-item"
              candidateItem.textContent = candidate
              candidateItem.dataset.index = index
              this.mobileCandidateList.appendChild(candidateItem)
            })
            this.showMobileCandidates()
          }
        }
      } else if (this.composingText.length > 0 && this.candidates.length > 0) {
        // 不包含數字編碼，直接選擇第一個候選字
        this.selectCandidate(0)
      } else {
        // 插入空格
        const start = this.cursorPosition.start
        const end = this.cursorPosition.end

        const newValue = this.editor.value.slice(0, start) + " " + this.editor.value.slice(end)
        this.editor.value = newValue

        // 更新光標位置
        this.cursorPosition = {
          start: start + 1,
          end: start + 1,
        }

        // 觸發 input 事件
        const event = new Event("input", { bubbles: true })
        this.editor.dispatchEvent(event)

        // 更新視覺光標
        this.updateCursorIndicator()
      }
    } else {
      // 處理其他按鍵（包括多字符按鍵）
      // 不再檢查是否符合單個字母或數字的模式
      this.composingText += key.toLowerCase()
      this.updateMobileCandidates()
      // 更新空白鍵顯示
      this.updateSpaceButtonText()
      // 更新隱藏鍵盤按鈕狀態
      this.updateHideKeyboardButton()
    }
  }

  updateKeyboardCase() {
    if (!this.keyboard) return

    const keyButtons = this.keyboard.querySelectorAll(".ime-key-btn")
    keyButtons.forEach((btn) => {
      const key = btn.dataset.key
      if (key && key.length === 1 && /^[a-z]$/i.test(key)) {
        btn.textContent = this.isShiftActive ? key.toUpperCase() : key.toLowerCase()
      }
    })
  }

  updateCandidates() {
    // 清空候選字列表
    this.candidateList.innerHTML = ""

    // 更新當前編碼顯示\
    this.composingTextDisplay.textContent = this.composingText

    // 獲取當前語言的 IME 資料
    const currentIMEData = imeData[this.currentLang].data

    // 查找匹配的候選字
    this.candidates = []

    const searchKey = this.composingText.trim() // Remove trailing space when searching

    // 精確匹配
    if (currentIMEData[searchKey]) {
      this.candidates = currentIMEData[searchKey]
    }

    // 前綴匹配 (只在沒有精確匹配時才做前綴匹配)
    if (this.candidates.length === 0) {
      // 如果有空格，先嘗試使用不帶空格的搜索鍵進行前綴匹配
      const searchKeyWithoutSpace = searchKey.replace(/\s+$/, "")

      for (const key in currentIMEData) {
        if (key.startsWith(searchKeyWithoutSpace)) {
          this.candidates = this.candidates.concat(currentIMEData[key])
        }
      }
    }

    // 修改 updateCandidates 函數，確保即使沒有候選字也保持基本寬度
    // 找到 updateCandidates 函數中處理沒有候選字的部分，並修改為：

    // 如果沒有候選字，但有編碼，仍然顯示候選字區域
    if (this.candidates.length === 0 && this.composingText.length === 0) {
      this.hideCandidates()
      return
    } else if (this.candidates.length === 0 && this.composingText.length > 0) {
      // 有編碼但沒有候選字，顯示空的候選字區域
      this.candidateList.innerHTML = '<div class="ime-no-candidates">...</div>'
      this.showCandidates()
      return
    }

    this.pageSize = this.candidateCount
    this.updateCandidateStyles()

    // 計算當前頁的候選字
    const startIndex = this.currentPage * this.pageSize
    const endIndex = Math.min(startIndex + this.pageSize, this.candidates.length)
    const currentPageCandidates = this.candidates.slice(startIndex, endIndex)

    // 顯示候選字
    currentPageCandidates.forEach((candidate, index) => {
      const candidateItem = document.createElement("div")
      candidateItem.className = "ime-candidate-item"
      // 處理過長的候選字
      let displayText = candidate
      const candidateLength = this.get_length(candidate)

      // 在水平模式下處理文字截斷
      if (this.displayMode === "horizontal") {
        // 獲取當前候選字區域的寬度
        const candidateAreaWidth = this.candidateArea.offsetWidth

        // 計算每個候選字的可用寬度
        let availableWidth
        if (this.candidateCount === 9) {
          // 9個候選字時，每行顯示3個
          availableWidth = Math.floor((candidateAreaWidth - 40) / 3)
        } else {
          // 5個候選字時，每行顯示5個
          availableWidth = Math.floor((candidateAreaWidth - 40) / Math.min(5, this.candidateCount))
        }

        // 創建臨時元素來測量文字寬度
        const tempEl = document.createElement("span")
        tempEl.style.font = window.getComputedStyle(this.candidateList).font
        tempEl.style.visibility = "hidden"
        tempEl.style.position = "absolute"
        tempEl.style.whiteSpace = "nowrap"
        document.body.appendChild(tempEl)

        // 測量候選字的寬度
        tempEl.textContent = candidate
        const textWidth = tempEl.offsetWidth

        // 如果文字太長，需要智能截斷
        if (textWidth > availableWidth - 25) {
          // 減少一點空間給編號和間距
          const chars = Array.from(candidate)

          // 先測量最後一個字符加上"~"的寬度
          tempEl.textContent = "~" + chars[chars.length - 1]
          const suffixWidth = tempEl.offsetWidth

          // 計算可用於前綴字符的寬度
          const prefixAvailableWidth = availableWidth - 25 - suffixWidth

          // 逐個添加前綴字符，直到達到可用寬度
          let prefixText = ""
          let i = 0

          while (i < chars.length - 1) {
            const nextChar = chars[i]
            tempEl.textContent = prefixText + nextChar
            if (tempEl.offsetWidth > prefixAvailableWidth) {
              break
            }
            prefixText += nextChar
            i++
          }

          // 如果至少能顯示一個前綴字符
          if (i > 0) {
            displayText = prefixText + "~" + chars[chars.length - 1]
          } else {
            // 如果連一個前綴字符都顯示不下，只顯示首尾
            displayText = chars[0] + "~" + chars[chars.length - 1]
          }
        }

        // 移除臨時元素
        document.body.removeChild(tempEl)
      }

      candidateItem.innerHTML = `
    <span class="ime-key">${index + 1}</span>
    <span class="ime-char" title="${candidate}">${displayText}</span>
  `

      candidateItem.addEventListener("click", () => {
        this.selectCandidate(index)
      })

      this.candidateList.appendChild(candidateItem)
    })

    // 更新翻頁按鈕狀態
    this.updatePaginationButtons()

    // 顯示候選字區域
    this.showCandidates()
  }

  updateMobileCandidates() {
    // 清空候選字列表
    this.mobileCandidateList.innerHTML = ""

    // 更新當前編碼顯示
    this.mobileComposingText.textContent = this.composingText
    this.mobileComposingText.style.display = this.composingText ? "inline-block" : "none"

    // 獲取當前語言的 IME 資料
    const currentIMEData = imeData[this.currentLang].data

    // 查找匹配的候選字
    this.candidates = []

    const searchKey = this.composingText.trim()

    // 精確匹配
    if (currentIMEData[searchKey]) {
      this.candidates = currentIMEData[searchKey]
    }

    // 前綴匹配 (只在沒有精確匹配時才做前綴匹配)
    if (this.candidates.length === 0) {
      // 如果有空格，先嘗試使用不帶空格的搜索鍵
      const searchKeyWithoutSpace = searchKey.replace(/\s+$/, "")

      for (const key in currentIMEData) {
        if (key.startsWith(searchKeyWithoutSpace)) {
          this.candidates = this.candidates.concat(currentIMEData[key])
        }
      }
    }

    // 如果沒有候選字，隱藏候選字區域
    if (this.candidates.length === 0 && this.composingText.length === 0) {
      this.hideMobileCandidates()
      return
    }

    // 顯示所有候選字（不分頁）
    this.candidates.forEach((candidate, index) => {
      const candidateItem = document.createElement("div")
      candidateItem.className = "ime-mobile-candidate-item"
      candidateItem.textContent = candidate
      candidateItem.dataset.index = index

      this.mobileCandidateList.appendChild(candidateItem)
    })

    // 顯示候選字區域
    this.showMobileCandidates()

    // 更新隱藏鍵盤按鈕狀態
    this.updateHideKeyboardButton()
  }

  showPunctuationCandidates() {
    // 確保在移動設備上且元素存在
    if (!this.isMobile || !this.mobileCandidateList) return

    // 清空候選字列表
    this.mobileCandidateList.innerHTML = ""

    // 隱藏編碼顯示
    if (this.mobileComposingText) {
      this.mobileComposingText.style.display = "none"
    }

    // 根據當前模式選擇標點符號列表
    if (this.isEnglishMode) {
      this.candidates = this.englishPunctuationMarks
    } else {
      this.candidates = this.punctuationMarks
    }

    // 顯示所有標點符號
    this.candidates.forEach((punctuation, index) => {
      const candidateItem = document.createElement("div")
      candidateItem.className = "ime-mobile-candidate-item"
      candidateItem.textContent = punctuation
      candidateItem.dataset.index = index

      this.mobileCandidateList.appendChild(candidateItem)
    })

    // 顯示候選字區域
    this.showMobileCandidates()

    // 更新隱藏鍵盤按鈕狀態
    this.updateHideKeyboardButton()
  }

  updatePaginationButtons() {
    // 更新翻頁按鈕狀態
    if (this.currentPage <= 0) {
      this.prevPageBtn.classList.add("disabled")
    } else {
      this.prevPageBtn.classList.remove("disabled")
    }

    if ((this.currentPage + 1) * this.pageSize >= this.candidates.length) {
      this.nextPageBtn.classList.add("disabled")
    } else {
      this.nextPageBtn.classList.remove("disabled")
    }
  }
  showCandidates() {
    // 顯示候選字區域
    this.candidateArea.style.display = "block"

    // 行動裝置時跟隨游標
    if (this.isMobile) {
      const cursorPos = this.getCursorPosition()
      this.candidateArea.style.left = `${cursorPos.left}px`
      this.candidateArea.style.top = `${cursorPos.top + 20}px`

      // 確保候選字區域不超出視窗
      const rect = this.candidateArea.getBoundingClientRect()
      if (rect.right > window.innerWidth) {
        this.candidateArea.style.left = `${window.innerWidth - rect.width}px`
      }

      if (rect.bottom > window.innerHeight) {
        this.candidateArea.style.top = `${cursorPos.top - rect.height - 5}px`
      }
    } else {
      // 電腦版確保候選字區域不超出視窗
      this.adjustCandidatePosition()
    }
  }

  // 添加新函數 adjustCandidatePosition，用於調整候選視窗位置
  adjustCandidatePosition() {
    // 獲取候選字區域的位置和大小
    const rect = this.candidateArea.getBoundingClientRect()

    // 確保不超出右邊界
    if (rect.right > window.innerWidth) {
      this.candidateArea.style.left = `${window.innerWidth - rect.width - 10}px`
    }

    // 確保不超出左邊界
    if (rect.left < 0) {
      this.candidateArea.style.left = "10px"
    }

    // 確保不超出上邊界
    if (rect.top < 0) {
      this.candidateArea.style.top = "10px"
    }

    // 確保不超出下邊界
    if (rect.bottom > window.innerHeight) {
      this.candidateArea.style.top = `${window.innerHeight - rect.height - 10}px`
    }
  }

  showMobileCandidates() {
    // 顯示行動裝置候選字區域
    if (this.mobileCandidateArea) {
      this.mobileCandidateArea.style.display = "block"
    }
  }

  hideCandidates() {
    this.candidateArea.style.display = "none"
    this.currentPage = 0
  }

  hideMobileCandidates() {
    // 添加檢查確保 mobileCandidateArea 存在
    if (this.mobileCandidateArea) {
      this.mobileCandidateArea.style.display = "none"
    }
    this.currentPage = 0
  }

  navigateCandidates(direction) {
    if (direction === "next") {
      if ((this.currentPage + 1) * this.pageSize < this.candidates.length) {
        this.currentPage++
        if (this.isMobile) {
          this.updateMobileCandidates()
        } else {
          this.updateCandidates()
        }
      }
    } else if (direction === "prev") {
      if (this.currentPage > 0) {
        this.currentPage--
        if (this.isMobile) {
          this.updateMobileCandidates()
        } else {
          this.updateCandidates()
        }
      }
    }
  }

  selectCandidate(index) {
    const startIndex = this.currentPage * this.pageSize
    const selectedIndex = startIndex + index

    if (selectedIndex < this.candidates.length) {
      const candidate = this.candidates[selectedIndex]
      this.insertText(candidate)
      this.composingText = ""
      this.hideCandidates()

      // 移除候選字後，重置候選字列表，避免重複累加
      this.candidates = []

      // In mobile version, show punctuation marks after selecting a candidate
      if (this.isMobile) {
        this.hideMobileCandidates()

        // 只顯示標點符號，但不自動選擇
        // 延遲顯示標點符號，避免誤觸
        setTimeout(() => {
          this.showPunctuationCandidates()
          // Update space button text
          this.updateSpaceButtonText()
          // Update hide keyboard button status
          this.updateHideKeyboardButton()
        }, 100)

        // Ensure the cursor is visible after text insertion
        setTimeout(() => {
          // Remove readonly to ensure the cursor can be displayed
          this.editor.removeAttribute("readonly")

          // Set selection range to update the cursor position
          this.editor.setSelectionRange(this.cursorPosition.start, this.cursorPosition.end)

          // Force focus to ensure the cursor is visible
          this.editor.focus()

          // Update the cursor indicator
          this.updateCursorIndicator()
        }, 50)
      } else {
        // For desktop, directly focus the editor
        this.editor.focus()
      }
    }
  }

  // 修改 insertText 方法，確保正確更新光標位置
  insertText(text) {
    if (this.isMobile) {
      // Use saved cursor position
      const start = this.cursorPosition.start
      const end = this.cursorPosition.end

      // Get current editor value
      const currentValue = this.editor.value

      // Insert text
      const newValue = currentValue.slice(0, start) + text + currentValue.slice(end)
      this.editor.value = newValue

      // Update cursor position
      const newPosition = start + text.length
      this.cursorPosition = {
        start: newPosition,
        end: newPosition,
      }

      // Set editor selection range to show system cursor at correct position
      this.editor.setSelectionRange(newPosition, newPosition)

      // Trigger input event
      const event = new Event("input", { bubbles: true })
      this.editor.dispatchEvent(event)

      // Ensure the editor is not readonly
      this.editor.removeAttribute("readonly")

      // Force focus to ensure the cursor is visible
      this.editor.focus()

      // Update visual cursor
      this.updateCursorIndicator()
    } else {
      const start = this.editor.selectionStart
      const end = this.editor.selectionEnd

      this.editor.value = this.editor.value.slice(0, start) + text + this.editor.value.slice(end)

      // Set cursor position after the inserted text
      const newPosition = start + text.length
      this.editor.selectionStart = newPosition
      this.editor.selectionEnd = newPosition

      // Trigger input event to notify editor of content change
      const event = new Event("input", { bubbles: true })
      this.editor.dispatchEvent(event)

      // Ensure editor maintains focus
      this.editor.focus()
    }
  }

  getCursorPosition() {
    // 創建一個臨時元素來計算光標位置
    const temp = document.createElement("div")
    temp.style.position = "absolute"
    temp.style.visibility = "hidden"
    temp.style.whiteSpace = "pre-wrap"
    temp.style.font = window.getComputedStyle(this.editor).font
    temp.style.padding = window.getComputedStyle(this.editor).padding
    temp.style.width = window.getComputedStyle(this.editor).width

    // 複編輯器內容到光標位置
    const content = this.editor.value.substring(0, this.cursorPosition.start)
    temp.textContent = content

    // 添加一個標記來表示光標位置
    const marker = document.createElement("span")
    marker.id = "cursor-position-marker"
    temp.appendChild(marker)

    document.body.appendChild(temp)

    // 獲取標記的位置
    const markerRect = marker.getBoundingClientRect()
    const editorRect = this.editor.getBoundingClientRect()

    // 移除臨時元素
    document.body.removeChild(temp)

    // 返回相對於編輯器的位置
    return {
      left: markerRect.left - editorRect.left + this.editor.scrollLeft,
      top: markerRect.top - editorRect.top + this.editor.scrollTop,
    }
  }

  createSettingsPanel() {
    const settingsPanel = document.createElement("div")
    settingsPanel.className = "ime-settings-panel"
    settingsPanel.style.display = "none"

    settingsPanel.innerHTML = `
<div class="ime-settings-header">
  <div class="ime-settings-title">候選設定</div>
  <div class="ime-settings-close">
    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
      <line x1="18" y1="6" x2="6" y2="18"></line>
      <line x1="6" y1="6" x2="18" y2="18"></line>
    </svg>
  </div>
</div>
<div class="ime-settings-content">
  <div class="ime-settings-item">
    <div class="ime-settings-row">
      <label class="ime-settings-label">候選數量：</label>
      <div class="ime-settings-options">
        <div class="ime-settings-option ${this.candidateCount === 5 ? "active" : ""}" data-value="5">五個</div>
        <div class="ime-settings-option ${this.candidateCount === 9 ? "active" : ""}" data-value="9">九個</div>
      </div>
    </div>
  </div>
  <div class="ime-settings-item">
    <div class="ime-settings-row">
      <label class="ime-settings-label">候選方式：</label>
      <div class="ime-settings-options">
        <div class="ime-settings-option ${this.displayMode === "horizontal" ? "active" : ""}" data-mode="horizontal">水平</div>
        <div class="ime-settings-option ${this.displayMode === "vertical" ? "active" : ""}" data-mode="vertical">垂直</div>
      </div>
    </div>
  </div>
  <div class="ime-settings-item">
    <div class="ime-settings-row">
      <label class="ime-settings-label">字體大小：</label>
      <select class="ime-settings-select" id="ime-font-size-select">
        <option value="small" ${this.candidateFontSize === "small" ? "selected" : ""}>小</option>
        <option value="medium" ${this.candidateFontSize === "medium" ? "selected" : ""}>中</option>
        <option value="large" ${this.candidateFontSize === "large" ? "selected" : ""}>大</option>
        <option value="huge" ${this.candidateFontSize === "huge" ? "selected" : ""}>巨</option>
        <option value="extreme" ${this.candidateFontSize === "extreme" ? "selected" : ""}>極</option>
      </select>
    </div>
  </div>
  <div class="ime-settings-item">
    <div class="ime-settings-row">
      <label class="ime-settings-label">字體樣式：</label>
      <select class="ime-settings-select" id="ime-font-style-select">
        <option value="default" ${this.candidateFont === "default" ? "selected" : ""}>預設</option>
        <option value="kaiti" ${this.candidateFont === "kaiti" ? "selected" : ""}>台灣楷體</option>
        <option value="songti" ${this.candidateFont === "songti" ? "selected" : ""}>台灣宋體</option>
        <option value="heiti" ${this.candidateFont === "heiti" ? "selected" : ""}>台灣黑體</option>
      </select>
    </div>
  </div>
</div>
`

    document.body.appendChild(settingsPanel)
    this.settingsPanel = settingsPanel

    // 关闭按钮事件
    const closeBtn = settingsPanel.querySelector(".ime-settings-close")
    closeBtn.addEventListener("click", () => {
      this.settingsPanel.style.display = "none"
    })

    // 设置候选数量选项点击事件
    const countOptions = settingsPanel.querySelectorAll(".ime-settings-option[data-value]")
    countOptions.forEach((option) => {
      option.addEventListener("click", () => {
        const value = option.dataset.value

        // 移除同组中的所有 active 类
        option.parentElement.querySelectorAll(".ime-settings-option").forEach((opt) => {
          opt.classList.remove("active")
        })

        // 添加 active 类到当前选项
        option.classList.add("active")

        // 更新设置
        this.candidateCount = Number.parseInt(value)
        this.pageSize = this.candidateCount

        // 保存设置
        this.saveSettings()

        // 更新候选字区域
        this.updateCandidateStyles()
        if (this.composingText.length > 0) {
          this.updateCandidates()
        }
      })
    })

    // 设置显示模式选项点击事件
    const modeOptions = settingsPanel.querySelectorAll(".ime-settings-option[data-mode]")
    modeOptions.forEach((option) => {
      option.addEventListener("click", () => {
        const mode = option.dataset.mode

        // 移除同组中的所有 active 类
        option.parentElement.querySelectorAll(".ime-settings-option").forEach((opt) => {
          opt.classList.remove("active")
        })

        // 添加 active 类到 当前选项
        option.classList.add("active")

        // 更新设置
        this.displayMode = mode

        // 保存设置
        this.saveSettings()

        // 更新候选字区域
        this.updateCandidateStyles()
        if (this.composingText.length > 0) {
          this.updateCandidates()
        }
      })
    })

    // 设置字体大小下拉菜单事件
    const fontSizeSelect = settingsPanel.querySelector("#ime-font-size-select")
    fontSizeSelect.addEventListener("change", () => {
      this.candidateFontSize = fontSizeSelect.value

      // 保存设置
      this.saveSettings()

      // 更新候选字区域
      this.updateCandidateStyles()
      if (this.composingText.length > 0) {
        this.updateCandidates()
      }
    })

    // 设置字体样式下拉菜单事件
    const fontStyleSelect = settingsPanel.querySelector("#ime-font-style-select")
    fontStyleSelect.addEventListener("change", () => {
      this.candidateFont = fontStyleSelect.value

      // 保存设置
      this.saveSettings()

      // 更新候选字区域
      this.updateCandidateStyles()
      if (this.composingText.length > 0) {
        this.updateCandidates()
      }
    })
  }

  // 添加 toggleSettingsPanel 方法
  toggleSettingsPanel() {
    if (this.settingsPanel.style.display === "none") {
      // 获取设置按钮位置
      const rect = this.settingsBtn.getBoundingClientRect()

      // 设置面板位置
      this.settingsPanel.style.display = "block"
      this.settingsPanel.style.position = "absolute"
      this.settingsPanel.style.left = `${rect.right - this.settingsPanel.offsetWidth}px`
      this.settingsPanel.style.top = `${rect.bottom + 5}px`

      // 确保面板在视窗内
      const panelRect = this.settingsPanel.getBoundingClientRect()
      if (panelRect.right > window.innerWidth) {
        this.settingsPanel.style.left = `${window.innerWidth - panelRect.width - 10}px`
      }
      if (panelRect.bottom > window.innerHeight) {
        this.settingsPanel.style.top = `${rect.top - panelRect.height - 5}px`
      }
    } else {
      this.settingsPanel.style.display = "none"
    }
  }

  // 添加 saveSettings 方法
  saveSettings() {
    const settings = {
      candidateCount: this.candidateCount,
      candidateFontSize: this.candidateFontSize,
      candidateFont: this.candidateFont,
      displayMode: this.displayMode,
    }

    localStorage.setItem("imeSettings", JSON.stringify(settings))
  }

  // 添加 updateCandidateStyles 方法
  updateCandidateStyles() {
    // 更新字体大小
    this.candidateArea.classList.remove(
      "ime-font-small",
      "ime-font-medium",
      "ime-font-large",
      "ime-font-huge",
      "ime-font-extreme",
    )
    this.candidateArea.classList.add(`ime-font-${this.candidateFontSize}`)

    // 更新字体
    this.candidateArea.classList.remove("ime-font-default", "ime-font-kaiti", "ime-font-songti", "ime-font-heiti")
    this.candidateArea.classList.add(`ime-font-${this.candidateFont}`)
    this.candidateList.classList.remove("ime-layout-single", "ime-layout-double", "ime-layout-vertical")

    if (this.displayMode === "vertical") {
      this.candidateList.classList.add("ime-layout-vertical")
    } else {
      // 水平模式
      this.candidateList.classList.add(this.candidateCount > 5 ? "ime-layout-double" : "ime-layout-single")
    }
  }

  switchKeyboardLayout(layoutId) {
    // 切換鍵盤配置
    if (this.currentKeyboardLayout === layoutId) return

    this.currentKeyboardLayout = layoutId
    localStorage.setItem("imeKeyboardLayout", layoutId)

    // 重建鍵盤
    if (this.keyboard) {
      document.body.removeChild(this.keyboard)
      this.createKeyboard()

      // 重新綁定鍵盤事件
      this.keyboard.addEventListener("click", (e) => {
        if (e.target.classList.contains("ime-key-btn") || e.target.closest(".ime-key-btn")) {
          const keyBtn = e.target.classList.contains("ime-key-btn") ? e.target : e.target.closest(".ime-key-btn")
          const key = keyBtn.dataset.key
          this.handleMobileKeyPress(key)
        }
      })

      // 設定行動裝置候選字點擊事件
      if (this.mobileCandidateList) {
        this.mobileCandidateList.addEventListener("click", (e) => {
          const candidateItem = e.target.closest(".ime-mobile-candidate-item")
          if (candidateItem) {
            const index = Number.parseInt(candidateItem.dataset.index)
            if (!isNaN(index)) {
              this.selectCandidate(index)

              setTimeout(() => {
                this.editor.removeAttribute("readonly")
                this.editor.setSelectionRange(this.cursorPosition.start, this.cursorPosition.end)
                this.updateCursorIndicator()
              }, 10)
            }
          }
        })
      }

      // 顯示標點符號作為候選字
      this.showPunctuationCandidates()
    }
  }

  createCustomLayout() {
    // 建立自訂鍵盤配置編輯器
    const editor = document.createElement("div")
    editor.className = "ime-custom-layout-editor"

    // 添加標題
    const editorTitle = document.createElement("div")
    editorTitle.className = "ime-editor-title"
    editorTitle.textContent = "新增自訂鍵盤配置"
    editor.appendChild(editorTitle)

    // 添加配置名稱輸入
    const nameContainer = document.createElement("div")
    nameContainer.className = "ime-editor-field"

    const nameLabel = document.createElement("label")
    nameLabel.textContent = "配置名稱："
    nameContainer.appendChild(nameLabel)

    const nameInput = document.createElement("input")
    nameInput.type = "text"
    nameInput.className = "ime-editor-input"
    nameInput.placeholder = "請輸入配置名稱"
    nameContainer.appendChild(nameInput)

    editor.appendChild(nameContainer)

    // 添加基於現有配置的選擇
    const baseContainer = document.createElement("div")
    baseContainer.className = "ime-editor-field"

    const baseLabel = document.createElement("label")
    baseLabel.textContent = "基於配置："
    baseContainer.appendChild(baseLabel)

    const baseSelect = document.createElement("select")
    baseSelect.className = "ime-editor-select"

    // 添加內建配置選項
    Object.entries(this.keyboardLayouts).forEach(([id, layout]) => {
      const option = document.createElement("option")
      option.value = id
      option.textContent = layout.name
      baseSelect.appendChild(option)
    })

    // 添加自訂配置選項
    Object.entries(this.customLayouts).forEach(([id, layout]) => {
      const option = document.createElement("option")
      option.value = id
      option.textContent = `${layout.name} (自訂)`
      baseSelect.appendChild(option)
    })

    baseContainer.appendChild(baseSelect)
    editor.appendChild(baseContainer)

    // 添加鍵盤預覽區域
    const previewContainer = document.createElement("div")
    previewContainer.className = "ime-editor-preview-container"

    const previewLabel = document.createElement("div")
    previewLabel.className = "ime-editor-preview-label"
    previewLabel.textContent = "鍵盤預覽："
    previewContainer.appendChild(previewLabel)

    const previewArea = document.createElement("div")
    previewArea.className = "ime-editor-preview"
    previewContainer.appendChild(previewArea)

    editor.appendChild(previewContainer)

    // 添加說明
    const helpText = document.createElement("div")
    helpText.className = "ime-editor-help"
    helpText.textContent = "點擊按鍵可編輯對應的字元"
    editor.appendChild(helpText)

    // 添加按鈕區域
    const buttonContainer = document.createElement("div")
    buttonContainer.className = "ime-editor-buttons"

    const cancelBtn = document.createElement("button")
    cancelBtn.className = "ime-editor-btn ime-editor-cancel"
    cancelBtn.textContent = "取消"
    cancelBtn.addEventListener("click", () => {
      document.body.removeChild(editor)
    })
    buttonContainer.appendChild(cancelBtn)

    const saveBtn = document.createElement("button")
    saveBtn.className = "ime-editor-btn ime-editor-save"
    saveBtn.textContent = "儲存"
    saveBtn.addEventListener("click", () => {
      const name = nameInput.value.trim()
      if (!name) {
        alert("請輸入配置名稱")
        return
      }

      // 獲取基於的配置
      const baseLayoutId = baseSelect.value
      let baseLayout

      if (this.customLayouts[baseLayoutId]) {
        baseLayout = JSON.parse(JSON.stringify(this.customLayouts[baseLayoutId]))
      } else {
        baseLayout = JSON.parse(JSON.stringify(this.keyboardLayouts[baseLayoutId]))
      }

      // 獲取自訂的按鍵
      const customKeys = {}
      const keyMapping = {}

      previewArea.querySelectorAll(".ime-preview-key").forEach((keyElement) => {
        if (keyElement.dataset.original && keyElement.dataset.custom) {
          customKeys[keyElement.dataset.original] = keyElement.dataset.custom

          // 獲取按鍵映射
          if (
            keyElement.dataset.display &&
            keyElement.dataset.hint &&
            keyElement.dataset.code &&
            keyElement.dataset.mapping
          ) {
            keyMapping[keyElement.dataset.custom] = {
              display: keyElement.dataset.display,
              hint: keyElement.dataset.hint,
              code: keyElement.dataset.code,
              mapping: keyElement.dataset.mapping,
            }
          }
        }
      })

      // 創建新的自訂配置
      const layoutId = `custom_${Date.now()}`
      this.customLayouts[layoutId] = {
        name: name,
        baseLayout: baseLayoutId,
        customKeys: customKeys,
        keyMapping: keyMapping,
        rows: baseLayout.rows.map((row) => {
          return row.map((key) => {
            if (typeof key === "string" && customKeys[key]) {
              return customKeys[key]
            }
            return key
          })
        }),
      }

      // 儲存自訂配置
      localStorage.setItem("imeCustomLayouts", JSON.stringify(this.customLayouts))

      // 切換到新配置
      this.switchKeyboardLayout(layoutId)

      // 關閉編輯器
      document.body.removeChild(editor)
    })
    buttonContainer.appendChild(saveBtn)

    editor.appendChild(buttonContainer)

    document.body.appendChild(editor)

    // 更新預覽
    const updatePreview = () => {
      previewArea.innerHTML = ""

      const baseLayoutId = baseSelect.value
      let layout

      if (this.customLayouts[baseLayoutId]) {
        layout = this.customLayouts[baseLayoutId]
      } else {
        layout = this.keyboardLayouts[baseLayoutId]
      }

      // 建立預覽鍵盤
      layout.rows.forEach((row) => {
        const rowElement = document.createElement("div")
        rowElement.className = "ime-preview-row"

        row.forEach((key) => {
          const keyElement = document.createElement("div")
          keyElement.className = "ime-preview-key"

          if (
            typeof key === "string" &&
            !["shift", "backspace", "mode", "globe", "space", "enter", "settings"].includes(key)
          ) {
            // 檢查是否有按鍵映射
            if (layout.keyMapping && layout.keyMapping[key]) {
              const keyMapping = layout.keyMapping[key]
              keyElement.innerHTML = `
                <span class="ime-preview-key-display">${keyMapping.display}</span>
                <span class="ime-preview-key-hint">${keyMapping.hint}</span>
              `
              keyElement.dataset.original = key
              keyElement.dataset.display = keyMapping.display
              keyElement.dataset.hint = keyMapping.hint
              keyElement.dataset.code = keyMapping.code
              keyElement.dataset.mapping = keyMapping.mapping
            } else {
              keyElement.textContent = key
              keyElement.dataset.original = key
            }

            // 添加點擊事件
            keyElement.addEventListener("click", () => {
              // 創建編輯對話框
              const keyEditor = document.createElement("div")
              keyEditor.className = "ime-key-editor"
              keyEditor.innerHTML = `
                <div class="ime-key-editor-title">編輯按鍵</div>
                <div class="ime-key-editor-field">
                  <label>顯示符號：</label>
                  <input type="text" class="ime-key-display-input" value="${keyElement.dataset.display || key}" maxlength="1">
                </div>
                <div class="ime-key-editor-field">
                  <label>右上角提示符號：</label>
                  <input type="text" class="ime-key-hint-input" value="${keyElement.dataset.hint || key}">
                </div>
                <div class="ime-key-editor-field">
                  <label>編碼顯示符號：</label>
                  <input type="text" class="ime-key-code-input" value="${keyElement.dataset.code || key}">
                </div>
                <div class="ime-key-editor-field">
                  <label>實際對應符號：</label>
                  <input type="text" class="ime-key-mapping-input" value="${keyElement.dataset.mapping || key}">
                </div>
                <div class="ime-key-editor-buttons">
                  <button class="ime-key-editor-cancel">取消</button>
                  <button class="ime-key-editor-save">儲存</button>
                </div>
              `

              document.body.appendChild(keyEditor)

              // 設定按鈕事件
              const cancelBtn = keyEditor.querySelector(".ime-key-editor-cancel")
              const saveBtn = keyEditor.querySelector(".ime-key-editor-save")

              cancelBtn.addEventListener("click", () => {
                document.body.removeChild(keyEditor)
              })

              saveBtn.addEventListener("click", () => {
                const displayInput = keyEditor.querySelector(".ime-key-display-input")
                const hintInput = keyEditor.querySelector(".ime-key-hint-input")
                const codeInput = keyEditor.querySelector(".ime-key-code-input")
                const mappingInput = keyEditor.querySelector(".ime-key-mapping-input")

                const display = displayInput.value.trim()
                const hint = hintInput.value.trim()
                const code = codeInput.value.trim()
                const mapping = mappingInput.value.trim()

                if (!display || !hint || !code || !mapping) {
                  alert("所有欄位都必須填寫")
                  return
                }

                // 更新按鍵顯示
                keyElement.innerHTML = `
                  <span class="ime-preview-key-display">${display}</span>
                  <span class="ime-preview-key-hint">${hint}</span>
                `
                keyElement.dataset.custom = display
                keyElement.dataset.display = display
                keyElement.dataset.hint = hint
                keyElement.dataset.code = code
                keyElement.dataset.mapping = mapping
                keyElement.classList.add("ime-preview-key-custom")

                document.body.removeChild(keyEditor)
              })
            })
          } else {
            // 特殊按鍵
            switch (key) {
              case "shift":
                keyElement.innerHTML = "⇧"
                keyElement.className += " ime-preview-key-special"
                break
              case "backspace":
                keyElement.innerHTML = "⌫"
                keyElement.className += " ime-preview-key-special"
                break
              case "mode":
                keyElement.innerHTML = "中/英"
                keyElement.className += " ime-preview-key-special"
                break
              case "globe":
                keyElement.innerHTML = "🌐"
                keyElement.className += " ime-preview-key-special"
                break
              case "space":
                keyElement.innerHTML = "空白"
                keyElement.className += " ime-preview-key-space"
                break
              case "enter":
                keyElement.innerHTML = "⏎"
                keyElement.className += " ime-preview-key-special"
                break
              case "settings":
                keyElement.innerHTML = "⚙️"
                keyElement.className += " ime-preview-key-special"
                break
              default:
                keyElement.textContent = key
            }
          }

          rowElement.appendChild(keyElement)
        })

        previewArea.appendChild(rowElement)
      })
    }

    // 初始更新預覽
    updatePreview()

    // 當基於配置變更時更新預覽
    baseSelect.addEventListener("change", updatePreview)
  }

  editCustomLayout(layoutId) {
    const layout = this.customLayouts[layoutId]
    if (!layout) return

    // 建立自訂鍵盤配置編輯器
    const editor = document.createElement("div")
    editor.className = "ime-custom-layout-editor"

    // 添加標題
    const editorTitle = document.createElement("div")
    editorTitle.className = "ime-editor-title"
    editorTitle.textContent = "編輯自訂鍵盤配置"
    editor.appendChild(editorTitle)

    // 添加配置名稱輸入
    const nameContainer = document.createElement("div")
    nameContainer.className = "ime-editor-field"

    const nameLabel = document.createElement("label")
    nameLabel.textContent = "配置名稱："
    nameContainer.appendChild(nameLabel)

    const nameInput = document.createElement("input")
    nameInput.type = "text"
    nameInput.className = "ime-editor-input"
    nameInput.value = layout.name
    nameContainer.appendChild(nameInput)

    editor.appendChild(nameContainer)

    // 添加鍵盤預覽區域
    const previewContainer = document.createElement("div")
    previewContainer.className = "ime-editor-preview-container"

    const previewLabel = document.createElement("div")
    previewLabel.className = "ime-editor-preview-label"
    previewLabel.textContent = "鍵盤預覽："
    previewContainer.appendChild(previewLabel)

    const previewArea = document.createElement("div")
    previewArea.className = "ime-editor-preview"
    previewContainer.appendChild(previewArea)

    editor.appendChild(previewContainer)

    // 添加說明
    const helpText = document.createElement("div")
    helpText.className = "ime-editor-help"
    helpText.textContent = "點擊按鍵可編輯對應的字元"
    editor.appendChild(helpText)

    // 添加按鈕區域
    const buttonContainer = document.createElement("div")
    buttonContainer.className = "ime-editor-buttons"

    const cancelBtn = document.createElement("button")
    cancelBtn.className = "ime-editor-btn ime-editor-cancel"
    cancelBtn.textContent = "取消"
    cancelBtn.addEventListener("click", () => {
      document.body.removeChild(editor)
    })
    buttonContainer.appendChild(cancelBtn)

    // 添加刪除按鈕
    const deleteBtn = document.createElement("button")
    deleteBtn.className = "ime-editor-btn ime-editor-delete"
    deleteBtn.textContent = "刪除"
    deleteBtn.style.backgroundColor = "#d93025"
    deleteBtn.style.color = "#ffffff"
    deleteBtn.style.marginRight = "auto" // 將刪除按鈕推到左側
    deleteBtn.addEventListener("click", () => {
      if (confirm("確定要刪除此鍵盤配置嗎？")) {
        this.deleteCustomLayout(layoutId)
        document.body.removeChild(editor)
      }
    })
    buttonContainer.appendChild(deleteBtn)

    const saveBtn = document.createElement("button")
    saveBtn.className = "ime-editor-btn ime-editor-save"
    saveBtn.textContent = "儲存"
    saveBtn.addEventListener("click", () => {
      const name = nameInput.value.trim()
      if (!name) {
        alert("請輸入配置名稱")
        return
      }

      // 獲取自訂的按鍵
      const customKeys = {}
      const keyMapping = {}

      previewArea.querySelectorAll(".ime-preview-key").forEach((keyElement) => {
        if (keyElement.dataset.original && keyElement.dataset.custom) {
          customKeys[keyElement.dataset.original] = keyElement.dataset.custom

          // 獲取按鍵映射
          if (
            keyElement.dataset.display &&
            keyElement.dataset.hint &&
            keyElement.dataset.code &&
            keyElement.dataset.mapping
          ) {
            keyMapping[keyElement.dataset.custom] = {
              display: keyElement.dataset.display,
              hint: keyElement.dataset.hint,
              code: keyElement.dataset.code,
              mapping: keyElement.dataset.mapping,
            }
          }
        }
      })

      // 更新自訂配置
      this.customLayouts[layoutId].name = name
      this.customLayouts[layoutId].customKeys = customKeys
      this.customLayouts[layoutId].keyMapping = keyMapping

      // 更新行
      const baseLayoutId = layout.baseLayout
      let baseLayout

      if (this.customLayouts[baseLayoutId]) {
        baseLayout = JSON.parse(JSON.stringify(this.customLayouts[baseLayoutId]))
      } else {
        baseLayout = JSON.parse(JSON.stringify(this.keyboardLayouts[baseLayoutId]))
      }

      this.customLayouts[layoutId].rows = baseLayout.rows.map((row) => {
        return row.map((key) => {
          if (typeof key === "string" && customKeys[key]) {
            return customKeys[key]
          }
          return key
        })
      })

      // 儲存自訂配置
      localStorage.setItem("imeCustomLayouts", JSON.stringify(this.customLayouts))

      // 如果當前正在使用此配置，重新載入鍵盤
      if (this.currentKeyboardLayout === layoutId) {
        this.switchKeyboardLayout(layoutId)
      }

      // 關閉編輯器
      document.body.removeChild(editor)
    })
    buttonContainer.appendChild(saveBtn)

    editor.appendChild(buttonContainer)

    document.body.appendChild(editor)

    // 更新預覽
    const updatePreview = () => {
      previewArea.innerHTML = ""

      // 建立預覽鍵盤
      layout.rows.forEach((row) => {
        const rowElement = document.createElement("div")
        rowElement.className = "ime-preview-row"

        row.forEach((key) => {
          const keyElement = document.createElement("div")
          keyElement.className = "ime-preview-key"

          // 找出原始按鍵
          let originalKey = key
          for (const [orig, custom] of Object.entries(layout.customKeys || {})) {
            if (custom === key) {
              originalKey = orig
              break
            }
          }

          if (
            typeof key === "string" &&
            !["shift", "backspace", "mode", "globe", "space", "enter", "settings"].includes(key)
          ) {
            // 檢查是否有按鍵映射
            if (layout.keyMapping && layout.keyMapping[key]) {
              const keyMapping = layout.keyMapping[key]
              keyElement.innerHTML = `
                <span class="ime-preview-key-display">${keyMapping.display}</span>
                <span class="ime-preview-key-hint">${keyMapping.hint}</span>
              `
              keyElement.dataset.original = originalKey
              keyElement.dataset.custom = key
              keyElement.dataset.display = keyMapping.display
              keyElement.dataset.hint = keyMapping.hint
              keyElement.dataset.code = keyMapping.code
              keyElement.dataset.mapping = keyMapping.mapping
              keyElement.classList.add("ime-preview-key-custom")
            } else {
              keyElement.textContent = key
              keyElement.dataset.original = originalKey

              if (originalKey !== key) {
                keyElement.dataset.custom = key
                keyElement.classList.add("ime-preview-key-custom")
              }
            }

            // 添加點擊事件
            keyElement.addEventListener("click", () => {
              // 創建編輯對話框
              const keyEditor = document.createElement("div")
              keyEditor.className = "ime-key-editor"
              keyEditor.innerHTML = `
                <div class="ime-key-editor-title">編輯按鍵</div>
                <div class="ime-key-editor-field">
                  <label>顯示符號：</label>
                  <input type="text" class="ime-key-display-input" value="${keyElement.dataset.display || key}" maxlength="1">
                </div>
                <div class="ime-key-editor-field">
                  <label>右上角提示符號：</label>
                  <input type="text" class="ime-key-hint-input" value="${keyElement.dataset.hint || key}">
                </div>
                <div class="ime-key-editor-field">
                  <label>編碼顯示符號：</label>
                  <input type="text" class="ime-key-code-input" value="${keyElement.dataset.code || key}">
                </div>
                <div class="ime-key-editor-field">
                  <label>實際對應符號：</label>
                  <input type="text" class="ime-key-mapping-input" value="${keyElement.dataset.mapping || key}">
                </div>
                <div class="ime-key-editor-buttons">
                  <button class="ime-key-editor-cancel">取消</button>
                  <button class="ime-key-editor-save">儲存</button>
                </div>
              `

              document.body.appendChild(keyEditor)

              // 設定按鈕事件
              const cancelBtn = keyEditor.querySelector(".ime-key-editor-cancel")
              const saveBtn = keyEditor.querySelector(".ime-key-editor-save")

              cancelBtn.addEventListener("click", () => {
                document.body.removeChild(keyEditor)
              })

              saveBtn.addEventListener("click", () => {
                const displayInput = keyEditor.querySelector(".ime-key-display-input")
                const hintInput = keyEditor.querySelector(".ime-key-hint-input")
                const codeInput = keyEditor.querySelector(".ime-key-code-input")
                const mappingInput = keyEditor.querySelector(".ime-key-mapping-input")

                const display = displayInput.value.trim()
                const hint = hintInput.value.trim()
                const code = codeInput.value.trim()
                const mapping = mappingInput.value.trim()

                if (!display || !hint || !code || !mapping) {
                  alert("所有欄位都必須填寫")
                  return
                }

                // 更新按鍵顯示
                keyElement.innerHTML = `
                  <span class="ime-preview-key-display">${display}</span>
                  <span class="ime-preview-key-hint">${hint}</span>
                `
                keyElement.dataset.custom = display
                keyElement.dataset.display = display
                keyElement.dataset.hint = hint
                keyElement.dataset.code = code
                keyElement.dataset.mapping = mapping
                keyElement.classList.add("ime-preview-key-custom")

                document.body.removeChild(keyEditor)
              })
            })
          } else {
            // 特殊按鍵
            switch (key) {
              case "shift":
                keyElement.innerHTML = "⇧"
                keyElement.className += " ime-preview-key-special"
                break
              case "backspace":
                keyElement.innerHTML = "⌫"
                keyElement.className += " ime-preview-key-special"
                break
              case "mode":
                keyElement.innerHTML = "中/英"
                keyElement.className += " ime-preview-key-special"
                break
              case "globe":
                keyElement.innerHTML = "🌐"
                keyElement.className += " ime-preview-key-special"
                break
              case "space":
                keyElement.innerHTML = "空白"
                keyElement.className += " ime-preview-key-space"
                break
              case "enter":
                keyElement.innerHTML = "⏎"
                keyElement.className += " ime-preview-key-special"
                break
              case "settings":
                keyElement.innerHTML = "⚙️"
                keyElement.className += " ime-preview-key-special"
                break
              default:
                keyElement.textContent = key
            }
          }

          rowElement.appendChild(keyElement)
        })

        previewArea.appendChild(rowElement)
      })
    }

    // 初始更新預覽
    updatePreview()
  }

  deleteCustomLayout(layoutId) {
    if (!confirm("確定要刪除此鍵盤配置嗎？")) return

    // 刪除自訂配置
    delete this.customLayouts[layoutId]

    // 儲存自訂配置
    localStorage.setItem("imeCustomLayouts", JSON.stringify(this.customLayouts))

    // 如果當前正在使用此配置，切換到預設配置
    if (this.currentKeyboardLayout === layoutId) {
      this.switchKeyboardLayout("qwerty")
    }
  }

  updateShiftButton() {
    if (this.shiftBtn) {
      if (this.isShiftActive) {
        this.shiftBtn.classList.add("ime-active")
      } else {
        this.shiftBtn.classList.remove("ime-active")
      }
      this.updateKeyboardCase()
    }
  }

  deleteChar() {
    // 沒有編碼時，刪除編輯器中的文字
    const start = this.cursorPosition.start
    const end = this.cursorPosition.end

    if (start === end && start > 0) {
      // 刪除光標前的一個字符
      const newValue = this.editor.value.slice(0, start - 1) + this.editor.value.slice(end)
      this.editor.value = newValue

      // 更新光標位置
      const newPosition = start - 1
      this.cursorPosition = {
        start: newPosition,
        end: newPosition,
      }

      // 設置編輯器的選擇範圍，使系統游標顯示在正確位置
      this.editor.setSelectionRange(newPosition, newPosition)
    } else if (start !== end) {
      // 刪除選中的文字
      const newValue = this.editor.value.slice(0, start) + this.editor.value.slice(end)
      this.editor.value = newValue

      // 更新光標位置
      this.cursorPosition = {
        start: start,
        end: start,
      }

      // 設置編輯器的選擇範圍，使系統游標顯示在正確位置
      this.editor.setSelectionRange(start, start)
    }

    // 觸發 input 事件
    const event = new Event("input", { bubbles: true })
    this.editor.dispatchEvent(event)

    // 更新視覺光標
    this.updateCursorIndicator()
  }

  insertEnter() {
    // Insert newline
    const start = this.cursorPosition.start
    const end = this.cursorPosition.end

    const newValue = this.editor.value.slice(0, start) + "\n" + this.editor.value.slice(end)
    this.editor.value = newValue

    // Update cursor position
    this.cursorPosition = {
      start: start + 1,
      end: start + 1,
    }

    // Trigger input event
    const event = new Event("input", { bubbles: true })
    this.editor.dispatchEvent(event)

    // Ensure the editor is not readonly
    this.editor.removeAttribute("readonly")

    // Set selection range to update the cursor position
    this.editor.setSelectionRange(this.cursorPosition.start, this.cursorPosition.end)

    // Force focus to ensure the cursor is visible
    this.editor.focus()

    // Update visual cursor
    this.updateCursorIndicator()
  }
}

// 初始化 IME 管理器
document.addEventListener("DOMContentLoaded", () => {
  // 確保編輯器已載入
  if (document.getElementById("editor")) {
    window.imeManager = new IMEManager()
  } else {
    console.error("編輯器元素未找到，無法初始化輸入法")
  }
})
