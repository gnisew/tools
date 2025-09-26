
function C(t) {
  console.log(t)
}

// 解析拼音字典資料
function parsePinyinDict(data) {
	data = data.toLowerCase();
  const dict = {}
  const lines = data.trim().split("\n")

  for (const line of lines) {
    const [pinyin, chars] = line.trim().split("\t")
    if (pinyin && chars) {
      dict[pinyin] = Array.from(chars)
    }
  }

  return dict
}

// 解析詞庫資料
function parseWordDict(data) {
	data = data.toLowerCase();
  const dict = {}
  const lines = data.trim().split("\n")

  for (const line of lines) {
    const [pinyin, word] = line.trim().split("\t")
    if (pinyin && word) {
      dict[pinyin] = word
    }
  }

  return dict
}

// DOM 元素
const inputText = document.getElementById("inputText")
const outputArea = document.getElementById("outputArea")
const statusBar = document.getElementById("statusBar")
const candidatePanel = document.getElementById("candidatePanel")
const candidateList = document.getElementById("candidateList")
const dictionaryPanel = document.getElementById("dictionaryPanel")
const dictionaryList = document.getElementById("dictionaryList")
const newWordPinyin = document.getElementById("newWordPinyin")
const newWordHanzi = document.getElementById("newWordHanzi")
const fontSizeSelect = document.getElementById("fontSize")
const lineHeightSelect = document.getElementById("lineHeight")
const pinyinHintTypeSelect = document.getElementById("pinyinHintType")
const displayModeSelect = document.getElementById("displayMode")
// 新增輸入模式選擇器
const inputModeSelect = document.getElementById("inputMode")
const pinyinModeSelect = document.getElementById("pinyinMode")

// 按鈕
const convertBtn = document.getElementById("convertBtn")
const clearInputBtn = document.getElementById("clearInputBtn")
const copyOutputBtn = document.getElementById("copyOutputBtn")
const pasteExampleBtn = document.getElementById("pasteExampleBtn")
const toggleDictionaryBtn = document.getElementById("toggleDictionaryBtn")
const addWordBtn = document.getElementById("addWordBtn")
const copyRubyBtn = document.getElementById("copyRubyBtn")

// 設置選項
const realTimeConversionCheckbox = document.getElementById("realTimeConversion")

// 狀態變量
let outputText = ""
let pinyinToCharMap = []
let userDict = {}
let selectedRange = { start: 0, end: 0 }
let isMobileDevice = false
let currentSelectedElement = null
let currentSelectedPosition = -1
let multiSelectMode = false
let multiSelectStartPosition = -1

// 標點符號處理函數
function preprocessPunctuation(input) {
  const myBiaodian = `!""'',:;.?。「「」」『『』』！（），：；？～─}~''""`;
  
  // 建立標點符號的正則表達式
  // 需要轉義特殊字符
  const escapedBiaodian = myBiaodian.replace(/[.*+?^${}()|[\]\\]/g, '');
  const tokens = []
  let currentPos = 0
  const punctuationPattern = new RegExp(`([${escapedBiaodian}])`, 'g');
  
  return input.replace(punctuationPattern, (match, punct, offset, string) => {
    const nextChar = string[offset + 1];
    
    // 如果標點後面是：
    // 1. 字串結尾 -> 不加空格
    // 2. 已經是空格 -> 不加空格
    // 3. 另一個標點 -> 不加空格
    // 4. 其他情況 -> 加空格
    if (!nextChar || nextChar === ' ' || myBiaodian.includes(nextChar)) {
      return punct;
    } else {
      return punct + ' ';
    }
  });
}

function preprocessPunctuationPrevNext(input) {
  const myBiaodian = `!""'',:;.?。「」『』！（），：；？～─~''""`;
  
  // 建立標點符號的正則表達式，正確轉義特殊字符
  const escapedBiaodian = myBiaodian.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const punctuationPattern = new RegExp(`([${escapedBiaodian}])`, 'g');
  
  return input.replace(punctuationPattern, (match, punct, offset, string) => {
    const prevChar = string[offset - 1];
    const nextChar = string[offset + 1];
    
    let result = punct;
    
    // 標點前加空格的條件：前一個字符存在且不是空格且不是標點
    if (prevChar && prevChar !== ' ' && !myBiaodian.includes(prevChar)) {
      result = ' ' + result;
    }
    
    // 標點後加空格的條件：後一個字符存在且不是空格且不是標點
    if (nextChar && nextChar !== ' ' && !myBiaodian.includes(nextChar)) {
      result = result + ' ';
    }
    
    return result;
  });
}

function parseHanziPinyinFormat(input) {
  // 先處理標點符號
  let processedInput = "";

  const tokens = []
  let currentPos = 0
  
  // 匹配 字(拼音) 格式的正則表達式
  const inputMode = inputModeSelect.value
  let hanziPinyinPattern
  
  switch (inputMode) {
    case "hanzi-pinyin":
      hanziPinyinPattern = /([^()\s]+)\(([^)]+)\)/g
	  processedInput = preprocessPunctuation(input);
      break
    case "hanzi-slash-pinyin":
      hanziPinyinPattern = /([^\\\s]+)\\([^\\\s]+)/g
      processedInput = preprocessPunctuationPrevNext(input);
      break
    case "hanzi-tab-pinyin":
      hanziPinyinPattern = /([^()\s]+)\(([^)]+)\)/g
	  processedInput = preprocessPunctuation(input);
      break
    default:
      // 如果沒有匹配的模式，直接處理為純文字
      processTextWithNewlines(input, tokens)
      return tokens
  }
  
  
  let match
  while ((match = hanziPinyinPattern.exec(processedInput)) !== null) {
    const matchStart = match.index
    const matchEnd = match.index + match[0].length
    
    // 如果匹配前有其他文字，需要逐字符處理以保留換行
    if (matchStart > currentPos) {
      const textBefore = processedInput.substring(currentPos, matchStart)
      processTextWithNewlines(textBefore, tokens)
    }
    
    // 添加匹配到的字(音)組合
    const hanzi = match[1]
    const pinyin = match[2]
    tokens.push({
      type: "ruby",
      content: match[0],
      hanzi: hanzi,
      pinyin: pinyin,
    })   
    currentPos = matchEnd
  }
  
  // 添加最後剩餘的文字
  if (currentPos < processedInput.length) {
    const textAfter = processedInput.substring(currentPos)
    processTextWithNewlines(textAfter, tokens)
  }
  
  return tokens
}

// 輔助函數：處理文字並保留換行符號
function processTextWithNewlines(text, tokens) {
  let currentText = ""
  
  for (let i = 0; i < text.length; i++) {
    const char = text[i]
    
    if (char === '\n') {
      // 如果有累積的文字，先添加為文字token
      if (currentText.length > 0) {
        tokens.push({
          type: "text",
          content: currentText,
          hanzi: "",
          pinyin: "",
        })
        currentText = ""
      }
      
      // 添加換行token
      tokens.push({
        type: "newline",
        content: "\n",
        hanzi: "",
        pinyin: "",
      })
    } else {
      currentText += char
    }
  }
  
  // 添加最後剩餘的文字（如果有且不為空白）
  if (currentText.length > 0 && currentText.trim()) {
    tokens.push({
      type: "text",
      content: currentText,
      hanzi: "",
      pinyin: "",
    })
  }
}




function parseHanziTabPinyinFormat(input) {
  // 先處理標點符號
  const processedInput = preprocessPunctuation(input);

  const tokens = []
  let currentPos = 0
  
  // 按行分割處理
  const lines = processedInput.split('\n')
  
  for (let lineIndex = 0; lineIndex < lines.length; lineIndex++) {
    const line = lines[lineIndex].trim()
    
    if (!line) {
      // 空行處理
      if (lineIndex > 0) {
        tokens.push({
          type: "text",
          content: "\n",
          hanzi: "",
          pinyin: "",
        })
      }
      continue
    }
    
    // 檢查是否包含 tab 字符
    if (line.includes('\t')) {
      const parts = line.split('\t')
      if (parts.length >= 2) {
        const hanzi = parts[0].trim()
        const pinyin = parts[1].trim()
        
        if (hanzi && pinyin) {
          // 添加換行符（除了第一行）
          if (lineIndex > 0) {
            tokens.push({
              type: "text",
              content: "\n",
              hanzi: "",
              pinyin: "",
            })
          }
          
          tokens.push({
            type: "hanzi-tab-pinyin",
            content: line,
            hanzi: hanzi,
            pinyin: pinyin,
          })
          continue
        }
      }
    }
    
    // 如果不是有效的字\t音格式，當作普通文字處理
    if (lineIndex > 0) {
      tokens.push({
        type: "text",
        content: "\n",
        hanzi: "",
        pinyin: "",
      })
    }
    
    tokens.push({
      type: "text",
      content: line,
      hanzi: "",
      pinyin: "",
    })
  }
  return tokens
}

const pinyinDict = parsePinyinDict(pinyinDictData)
const wordDict = parseWordDict(wordDictData)



// 新增：字 音格式轉換為字(音)格式的函數
function convertHanziTabPinyinToHanziPinyin(input) {
  const lines = input.split('\n').filter(line => line.trim());
  const convertedLines = lines.map(line => convertLine(line));
  return convertedLines.join('\n');
}

function convertLine(line) {
  const parts = line.split('\t');
  if (parts.length !== 2) return line;
  
  const [chineseText, pinyinText] = parts.map(part => part.trim());
  
  // 使用 Array.from 正確處理中文字符
  const chineseChars = Array.from(chineseText);
  const pinyinSegments = pinyinText.split(/\s+/);
  
  let result = '';
  let chineseIndex = 0;
  let pinyinIndex = 0;
  
  while (chineseIndex < chineseChars.length) {
    const char = chineseChars[chineseIndex];
    
    // 如果是標點符號或空白字符，直接添加
    if (isPunctuation(char) || /\s/.test(char)) {
      result += char;
      chineseIndex++;
      continue;
    }
    
    // 處理漢字：找到對應的拼音
    if (pinyinIndex >= pinyinSegments.length) {
      // 沒有更多拼音了，直接添加漢字
      result += char;
      chineseIndex++;
      continue;
    }
    
    const currentPinyin = pinyinSegments[pinyinIndex];
    const cleanPinyin = removePunctuation(currentPinyin);
    const syllableCount = cleanPinyin.split(/--|-/).length;
    
    // 收集對應數量的漢字（從當前位置開始）
    let chineseWord = '';
    let collectedCount = 0;
    let lookAheadIndex = chineseIndex;
    
    // 先收集足夠的漢字（跳過標點符號）
    while (collectedCount < syllableCount && lookAheadIndex < chineseChars.length) {
      if (!isPunctuation(chineseChars[lookAheadIndex]) && !/\s/.test(chineseChars[lookAheadIndex])) {
        chineseWord += chineseChars[lookAheadIndex];
        collectedCount++;
      }
      lookAheadIndex++;
    }
    
    // 現在按順序輸出，保持標點符號在原位置
    let outputCount = 0;
    while (chineseIndex < chineseChars.length && outputCount < syllableCount) {
      const currentChar = chineseChars[chineseIndex];
      
      if (isPunctuation(currentChar) || /\s/.test(currentChar)) {
        result += currentChar;
        chineseIndex++;
      } else {
        // 這是要處理的漢字
        if (outputCount === syllableCount - 1) {
          // 最後一個漢字，加上拼音
          result += currentChar + '(' + cleanPinyin + ')';
        } else {
          result += currentChar;
        }
        outputCount++;
        chineseIndex++;
      }
    }
    
    pinyinIndex++;
  }
  return result;
}

function isPunctuation(char) {
  // 中英文標點符號的正則表達式
  const punctuationRegex = /[\u3000-\u303F\uFF00-\uFFEF\u2000-\u206F\u0020-\u002F\u003A-\u0040\u005B-\u0060\u007B-\u007E,──]/;
  return punctuationRegex.test(char);
}

function removePunctuation(text) {
  // 移除文字開頭和結尾的標點符號
  return text.replace(/^[\u3000-\u303F\uFF00-\uFFEF\u2000-\u206F\u0020-\u002F\u003A-\u0040\u005B-\u0060\u007B-\u007E]+|[\u3000-\u303F\uFF00-\uFFEF\u2000-\u206F\u0020-\u002F\u003A-\u0040\u005B-\u0060\u007B-\u007E,─]+$/g, '');
}




// 修改：更新輸入模式時的提示文字
function updateInputPlaceholder() {
  const inputMode = inputModeSelect.value
  if (inputMode === "hanzi-pinyin") {
    inputText.placeholder = "請輸入字(音)格式，例如：朋友(Ping5-iu2) 你(li2) 好(ho2)"
  } else if (inputMode === "hanzi-tab-pinyin") {
    inputText.placeholder = "請輸入字\\t音格式，例如：世界\\tse3-kai3"
  } else if (inputMode === "hanzi-slash-pinyin") {
    inputText.placeholder = "請輸入字\\音格式，例如：世界\\se3-kai3"
  } else {
    inputText.placeholder = "請輸入數字標調拼音，例如：ni3 hao3 zhong1 guo2"
  }
}


function convertPinyinForDisplay(pinyin) {
  const pinyinMode = pinyinModeSelect.value
  if (pinyinMode === "tailo") {
    return numberToRoma(pinyin)
  }
  return pinyin
}

// 修改：更新示例按鈕的內容
function updatePasteExample() {
  const inputMode = inputModeSelect.value
  if (inputMode === "hanzi-pinyin") {
    inputText.value = "朋友(Ping5-iu2) 你(li2) 好(ho2)。Hello1 2023！今仔日(Kin1-a2-jit8) 是(si7) 世界(se3-kai3)。"
  } else if (inputMode === "hanzi-tab-pinyin") {
    inputText.value = "朋友，今仔日你好。\tPing5-iu2, Kin1-a2--jit8 li2 ho2.\n鋼琴家\tkng3-khim5-ka1\n世界\tse3-kai3"
  } else if (inputMode === "hanzi-slash-pinyin") {
    inputText.value = "朋友\\Ping5-iu2 ， 今仔日\\Kin1-a2--jit8 你\\li2 好\\ho2 。"
  } else {
    inputText.value =
      "Ping5-iu2 li2 ho2 ping5-iu2 ping5iu2. Hello 2023! Kin1-a2-jit8 si7 se3-kai3 chhut4-mia5 e5 kng3-khim5-ka1."
  }

  if (realTimeConversionCheckbox.checked) {
    convertPinyin()
  }
}

// 拼音工具類
class PinyinUtil {
  normalizePinyin(input) {
    if (!input || input.trim() === "") return []

    // 先去除首尾多餘的空格，但不轉換為小寫
    let cleanedInput = input.trim()
    cleanedInput = pojToTailuoFn(cleanedInput) // 教羅轉台羅;
    cleanedInput = romaToNumber(cleanedInput) // 台羅轉數字;
    cleanedInput = cleanedInput.replace(/([a-z]+[1-9](( *)[a-z]+[1-9])+|[a-z]+[1-9])/g, (match) =>
      match.replace(/ /g, ""),
    )
    cleanedInput = convertToFullMark(cleanedInput) // 全形標點;

    // 使用正則表達式識別拼音模式、空格和非拼音文字
    // 使用 i 標誌使匹配不區分大小寫
    const tokens = []
    let currentPos = 0

    // 匹配模式：單音節拼音或帶連字符的多音節拼音與空格
    const pinyinPattern = /([a-z]+[1-9]((--|-)[a-z]+[1-9])+|[a-z]+[1-9])/gi
    let match

    // 尋找所有拼音匹配
    while ((match = pinyinPattern.exec(cleanedInput)) !== null) {
      const matchStart = match.index
      const matchEnd = pinyinPattern.lastIndex

      // 如果匹配前有非拼音文字
      if (matchStart > currentPos) {
        const textBefore = cleanedInput.substring(currentPos, matchStart)

        // 檢查非拼音文字中是否包含換行符
        const textParts = this.splitWithNewlines(textBefore)

        for (const part of textParts) {
          if (part === "\n") {
            // 這是換行符，標記為特殊類型
            tokens.push({
              text: part,
              isPinyin: false,
              isSpace: false,
              isNewline: true,
            })
          } else if (/^\s+$/.test(part)) {
            // 這是拼音之間的空格，標記為特殊類型
            tokens.push({
              text: part,
              isPinyin: false,
              isSpace: true,
              isNewline: false,
            })
          } else {
            // 其他非拼音文字
            tokens.push({
              text: part,
              isPinyin: false,
              isSpace: false,
              isNewline: false,
            })
          }
        }
      }

      // 添加拼音，保留原始大小寫和連字符
      tokens.push({
        text: match[0],
        originalText: match[0],
        lowerCaseText: match[0].toLowerCase(), // 存儲小寫版本用於匹配，但保留連字符
        isPinyin: true,
        isSpace: false,
        isNewline: false,
        hasHyphen: match[0].includes("-"), // 標記是否包含連字符
      })

      currentPos = matchEnd
    }

    // 添加最後剩餘的非拼音文字
    if (currentPos < cleanedInput.length) {
      const textAfter = cleanedInput.substring(currentPos)

      // 檢查非拼音文字中是否包含換行符
      const textParts = this.splitWithNewlines(textAfter)

      for (const part of textParts) {
        if (part === "\n") {
          // 這是換行符，標記為特殊類型
          tokens.push({
            text: part,
            isPinyin: false,
            isSpace: false,
            isNewline: true,
          })
        } else if (/^\s+$/.test(part)) {
          // 這是拼音之間的空格，標記為特殊類型
          tokens.push({
            text: part,
            isPinyin: false,
            isSpace: true,
            isNewline: false,
          })
        } else {
          // 其他非拼音文字
          tokens.push({
            text: part,
            isPinyin: false,
            isSpace: false,
            isNewline: false,
          })
        }
      }
    }
    return tokens
  }

  // 新增方法：分割文字，保留換行符
  splitWithNewlines(text) {
    if (!text) return []

    // 使用正則表達式將文字分成換行符和非換行符部分
    const parts = []
    let currentPos = 0
    const newlinePattern = /\n/g
    let match

    while ((match = newlinePattern.exec(text)) !== null) {
      const matchStart = match.index

      // 添加換行符前的文字
      if (matchStart > currentPos) {
        parts.push(text.substring(currentPos, matchStart))
      }

      // 添加換行符
      parts.push("\n")

      currentPos = matchStart + 1
    }

    // 添加最後剩餘的文字
    if (currentPos < text.length) {
      parts.push(text.substring(currentPos))
    }
    return parts
  }
}

const pinyinUtil = new PinyinUtil()

// 初始化
function init() {
  // 檢測是否為行動裝置
  isMobileDevice = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent)

  // 載入使用者詞庫
  const savedDict = localStorage.getItem("pinyinConverterUserDict")
  if (savedDict) {
    userDict = JSON.parse(savedDict)
    renderDictionaryList()
  }

  // 綁定事件
  inputText.addEventListener("input", handleInputChange)
  convertBtn.addEventListener("click", convertPinyin)
  clearInputBtn.addEventListener("click", clearInput)
  copyOutputBtn.addEventListener("click", copyOutput)
  pasteExampleBtn.addEventListener("click", updatePasteExample)
  toggleDictionaryBtn.addEventListener("click", toggleDictionary)
  addWordBtn.addEventListener("click", addNewWord)
  copyRubyBtn.addEventListener("click", copyRubyOutput)

  // 新增：輸入模式切換事件
  inputModeSelect.addEventListener("change", () => {
    updateInputPlaceholder()
    if (inputText.value.trim() && realTimeConversionCheckbox.checked) {
      convertPinyin()
    }
  })

  // 新增：拼音模式切換事件
  pinyinModeSelect.addEventListener("change", updateOutputDisplay)

  // 其他事件監聽器...
  outputArea.addEventListener("mouseup", handleTextSelection)
  outputArea.addEventListener("touchend", handleTextSelection)
  outputArea.addEventListener("click", handleCharClick)
  document.addEventListener("click", handleDocumentClick)
  document.addEventListener("keydown", handleKeyDown)
  document.addEventListener("keyup", handleKeyUp)

  fontSizeSelect.addEventListener("change", changeFontSize)
  lineHeightSelect.addEventListener("change", changeLineHeight)
  pinyinHintTypeSelect.addEventListener("change", updateOutputDisplay)
  displayModeSelect.addEventListener("change", updateOutputDisplay)

  // 初始化候選字面板
  updateCandidatePanel([])

  // 設置初始字體大小
  changeFontSize()
  changeLineHeight()
  updateInputPlaceholder()

  // 新增標題點擊事件
  const inputTitle = document.getElementById("inputTitle")
  const outputTitle = document.getElementById("outputTitle")
  inputTitle.addEventListener("click", toggleInputSection)
  outputTitle.addEventListener("click", toggleInputSection)

  const inputTitleText = document.getElementById("inputTitle")
  const outputTitleText = document.getElementById("outputTitle")
  inputTitleText.addEventListener("click", toggleInputSection)
  outputTitleText.addEventListener("click", toggleInputSection)
}

// 收合展開輸入區域的函數
function toggleInputSection() {
  const inputSection = document.getElementById("inputSection")
  const outputSection = document.getElementById("outputSection")
  const isCurrentlyCollapsed = inputSection.classList.contains("collapsed")

  if (isCurrentlyCollapsed) {
    // 展開
    inputSection.classList.remove("collapsed")
    outputSection.classList.remove("expanded")
    updateToggleIcon(false)
  } else {
    // 收合
    inputSection.classList.add("collapsed")
    outputSection.classList.add("expanded")
    updateToggleIcon(true)
  }

  // 更新輸出區域顯示
  updateOutputDisplay()
}

// 更新收合展開圖示
function updateToggleIcon(isCollapsed) {
  const inputTitleText = document.getElementById("inputTitle")
  const outputTitleText = document.getElementById("outputTitle")

  if (isCollapsed) {
    inputTitleText.innerHTML = "拼音 »"
    outputTitleText.innerHTML = "漢字 »"
  } else {
    inputTitleText.innerHTML = "« 拼音"
    outputTitleText.innerHTML = "« 輸出"
  }
}

// 處理輸入變化
function handleInputChange() {
  if (realTimeConversionCheckbox.checked && inputText.value.trim() !== "") {
    convertPinyin()
  }
}

// 更改字體大小
function changeFontSize() {
  const fontSize = fontSizeSelect.value
  outputArea.style.fontSize = `${fontSize}px`
}

// 更改行距
function changeLineHeight() {
  const lineHeight = lineHeightSelect.value
  outputArea.style.lineHeight = lineHeight
}


// 修正的拼音轉漢字函數
function convertPinyin() {

  if (inputText.value.trim() === "") {
    return
  }

  // 清空輸出結果
  outputText = ""
  pinyinToCharMap = []
  // 重置全域詞彙ID計數器
  globalWordIdCounter = 0

  const inputMode = inputModeSelect.value

  if (inputMode === "hanzi-pinyin" || inputMode === "hanzi-tab-pinyin" || inputMode === "hanzi-slash-pinyin") {
    // 字(音)模式處理
    let inputTextValue = "";

    if (inputMode === "hanzi-pinyin") {
      inputTextValue = inputText.value;
    } else if (inputMode === "hanzi-tab-pinyin") {
      const processedInput = preprocessPunctuation(inputText.value);
      inputTextValue = convertHanziTabPinyinToHanziPinyin(processedInput)
    } else if (inputMode === "hanzi-slash-pinyin") {
      inputTextValue = inputText.value;
    }

    const tokens = parseHanziPinyinFormat(inputTextValue)

    if (tokens.length === 0) {
      return
    }

    let result = ""
    let position = 0

    for (const token of tokens) {
      if (token.type === "ruby") {
        // 處理字(音)格式
        const hanzi = token.hanzi
        const pinyin = token.pinyin

        // 標準化拼音
        const normalizedPinyin = pojToTailuoFn(pinyin)
        const numberPinyin = romaToNumber(normalizedPinyin)

        result += hanzi

        // 為每個漢字建立對應關係
        const hanziChars = Array.from(hanzi)
        const pinyinParts = numberPinyin.split(/[-\s]+/).filter((p) => p.trim())

        // 關鍵修改：為每個詞生成唯一ID
        const uniqueWordId = ++globalWordIdCounter

        for (let i = 0; i < hanziChars.length; i++) {
          const char = hanziChars[i]
          const charPinyin = i < pinyinParts.length ? pinyinParts[i] : pinyinParts[pinyinParts.length - 1] || pinyin

          // 查找候選字
          let candidates = []
          const lowerCasePinyin = charPinyin.toLowerCase()
          if (pinyinDict[lowerCasePinyin]) {
            candidates = pinyinDict[lowerCasePinyin]
          }

          pinyinToCharMap.push({
            char: char,
            pinyin: charPinyin,
            originalPinyin: charPinyin,
            candidates: candidates,
            isWord: hanziChars.length > 1,
            wordPinyin: hanziChars.length > 1 ? pinyin : "",
            uniqueWordId: hanziChars.length > 1 ? uniqueWordId : null, // 新增唯一詞ID
            position: position + i,
            isConverted: true,
            isNewline: false,
          })
        }

        position += hanziChars.length
      } else {
        // 處理其他文字（包括換行符）
        result += token.content

        const textChars = Array.from(token.content)

        for (let i = 0; i < textChars.length; i++) {
          const char = textChars[i]
          pinyinToCharMap.push({
            char: char,
            pinyin: "",
            candidates: [],
            isWord: false,
            uniqueWordId: null, // 非詞字符沒有詞ID
            position: position + i,
            isConverted: false,
            isNewline: char === "\n",
          })
        }

        position += textChars.length
      }
    }

    outputText = result
    updateOutputDisplay()
  } else {
    // 拼音模式處理
    // 標準化輸入的拼音，獲取拼音和非拼音的標記
    const tokens = pinyinUtil.normalizePinyin(inputText.value)

    // 如果沒有找到任何內容
    if (tokens.length === 0) {
      return
    }

    // 檢查是否包含拼音
    const hasPinyin = tokens.some((token) => token.isPinyin)
    if (!hasPinyin) {
      return
    }

    // 預處理標記：處理拼音，保留連字符的多音節詞
    const processedTokens = []
    let pinyinGroup = []
    const tokensLength = tokens.length

	for (let i = 0; i < tokens.length; i++) {
	  const token = tokens[i]

	  if (token.isPinyin) {
		// 如果是帶連字符的多音節詞，直接添加
		if (token.hasHyphen) {	
		  processedTokens.push({
			text: token.text,
			lowerCaseText: token.lowerCaseText,
			isPinyin: true,
			isSpace: false,
			isNewline: false,
			originalPinyins: [token],
			hasHyphen: true,
		  })
		} else {
		  // 將空格分隔的拼音拆分成單個拼音 token
		  const pinyinArray = token.text.split(" ").filter(p => p.trim())
		  const lowerCasePinyinArray = token.lowerCaseText.split(" ").filter(p => p.trim())

		  for (let j = 0; j < pinyinArray.length; j++) {
			processedTokens.push({
			  text: pinyinArray[j],
			  lowerCaseText: lowerCasePinyinArray[j],
			  isPinyin: true,
			  isSpace: false,
			  isNewline: false,
			  originalPinyins: [{
				text: pinyinArray[j],
				lowerCaseText: lowerCasePinyinArray[j],
				isPinyin: true,
				isSpace: false,
				isNewline: false,
			  }],
			})
		  }
		}
	  } else {
		// 直接添加非拼音 token
		processedTokens.push(token)
	  }
	}

    // 處理最後剩餘的拼音
    if (pinyinGroup.length > 0) {
      processedTokens.push({
        text: pinyinGroup.map((p) => p.text).join(" "),
        lowerCaseText: pinyinGroup.map((p) => p.lowerCaseText).join(" "),
        isPinyin: true,
        isSpace: false,
        isNewline: false,
        originalPinyins: [...pinyinGroup],
      })
    }

    // 開始轉換 - 這裡是主要的修改部分
    let result = ""
    
    // 合併用戶詞庫和系統詞庫
    const combinedWordDict = { ...wordDict, ...userDict }

    // 將所有拼音 token 提取出來，用於全域詞彙匹配
    const pinyinTokens = processedTokens.filter(token => token.isPinyin)

    // 建立一個已處理的 token 索引集合
    const processedTokenIndices = new Set()

    // 處理所有標記
    for (let i = 0; i < processedTokens.length; i++) {

      // 如果這個 token 已經被處理過，跳過
      if (processedTokenIndices.has(i)) {
        continue
      }

      const token = processedTokens[i]

      if (token.isNewline) {
        // 直接保留換行符
        const currentLength = Array.from(result).length
        result += token.text

        // 記錄換行符
        pinyinToCharMap.push({
          char: token.text,
          pinyin: "",
          candidates: [],
          isWord: false,
          uniqueWordId: null, // 換行符沒有詞ID
          position: currentLength,
          isConverted: false,
          isNewline: true,
        })
      } else if (!token.isPinyin) {
        // 直接保留非拼音文字
        const currentLength = Array.from(result).length
        result += token.text

        // 記錄非拼音文字
        const textChars = Array.from(token.text)
        for (let j = 0; j < textChars.length; j++) {
          pinyinToCharMap.push({
            char: textChars[j],
            pinyin: "",
            candidates: [],
            isWord: false,
            uniqueWordId: null, // 非拼音文字沒有詞ID
            position: currentLength + j,
            isConverted: false,
            isNewline: false,
          })
        }
      } else {

        // 處理拼音 - 實現最長優先匹配
        let matchFound = false
        let maxMatchLength = 0
        let bestMatch = null


        // 從當前位置開始，嘗試最長的詞彙匹配（最多5個單位）
        for (let len = Math.min(5, processedTokens.length - i); len >= 1; len--) {
          // 檢查從當前位置開始的 len 個 token 是否都是拼音
          let allPinyin = true
          let pinyinSequence = []
          
          for (let j = 0; j < len; j++) {
            const checkToken = processedTokens[i + j]
            if (!checkToken || !checkToken.isPinyin) {
              allPinyin = false
              break
            }
            pinyinSequence.push(checkToken)
          }

          if (!allPinyin) {
            continue
          }

          // 建立詞彙查詢鍵
          let wordPinyinKey = ""
          
          // 處理每個拼音 token
          for (let j = 0; j < pinyinSequence.length; j++) {
            const pinyinToken = pinyinSequence[j]
            
            if (pinyinToken.hasHyphen) {
              // 帶連字符的多音節詞，直接使用
              wordPinyinKey += (j > 0 ? " " : "") + pinyinToken.lowerCaseText
            } else {
              // 空格分隔的拼音，提取第一個音節
              const firstPinyin = pinyinToken.lowerCaseText.split(" ")[0]
              wordPinyinKey += (j > 0 ? " " : "") + firstPinyin
            }
          }

          // 檢查詞庫中是否有匹配
          if (combinedWordDict[wordPinyinKey]) {

            if (len > maxMatchLength) {
              maxMatchLength = len
              bestMatch = {
                word: combinedWordDict[wordPinyinKey],
                pinyinKey: wordPinyinKey,
                tokenSequence: pinyinSequence,
                length: len
              }
            }
          }
        }

		if (bestMatch) {
		  // 找到最佳匹配
		  const currentLength = Array.from(result).length;
		  result += bestMatch.word;

		  // 標記相關的 token 為已處理
		  for (let j = 0; j < bestMatch.length; j++) {
			processedTokenIndices.add(i + j);
		  }

		  // 按空格拆分拼音單元
		  const pinyinUnits = bestMatch.pinyinKey.split(" ");
		  const wordChars = Array.from(bestMatch.word);

		  // 為每個拼音單元分配對應的漢字
		  let charIndex = 0;
		  for (let j = 0; j < pinyinUnits.length && charIndex < wordChars.length; j++) {
			const currentPinyin = pinyinUnits[j];
			const syllableCount = currentPinyin.split(/--|-/).length; // 計算音節數
			const uniqueWordId = `word_${Date.now()}_${Math.floor(Math.random() * 1000)}`; // 為每個拼音單元生成唯一ID

			// 分配漢字給當前拼音單元
			for (let k = 0; k < syllableCount && charIndex < wordChars.length; k++) {
			  const char = wordChars[charIndex];
			  const pinyinPart = currentPinyin.split(/--|-/)[k] || currentPinyin.split(/--|-/)[0];
			  let candidates = pinyinDict[pinyinPart.toLowerCase()] || [];

			  pinyinToCharMap.push({
				char: char,
				pinyin: pinyinPart,
				originalPinyin: pinyinPart,
				candidates: candidates,
				isWord: syllableCount > 1 || pinyinUnits.length > 1,
				wordPinyin: currentPinyin, // 使用單個拼音單元作為 wordPinyin
				uniqueWordId: uniqueWordId, // 每個拼音單元有獨立唯一ID
				position: currentLength + charIndex,
				isConverted: true,
				isNewline: false,
			  });
			  charIndex++;
			}
		  }

		  matchFound = true;
		}

		// 如果沒有找到詞彙匹配，處理當前的單個拼音 token
		if (!matchFound) {
		  const pinyinText = token.text;
		  const lowerCasePinyinText = token.lowerCaseText;

if (token.hasHyphen) {
  // 處理帶連字符的拼音，進行大單位到小單位的匹配
  const pinyinUnits = lowerCasePinyinText
    .replace(/([a-z0-9]+)(--|-|$)/g, '$1 ').trim()
    .split(' ')
    .filter(p => p.trim());
  const originalPinyinUnits = pinyinText
    .replace(/([a-z0-9]+)(--|-|$)/g, '$1 ').trim()
    .split(' ')
    .filter(p => p.trim());

  let currentLength = Array.from(result).length;
  let convertedText = '';
  const uniqueWordId = `word_${Date.now()}_${Math.floor(Math.random() * 1000)}`;
  let processedPinyinParts = [];
  let processedOriginalPinyinParts = [];

  // 嘗試由大到小單位匹配
  let remainingPinyin = lowerCasePinyinText;
  let remainingOriginalPinyin = pinyinText;

  while (remainingPinyin) {
    let matched = false;
    const units = remainingPinyin
      .replace(/([A-Za-z0-9]+)(--|-|$)/g, '$1 ').trim()
      .split(' ')
      .filter(p => p.trim());
    const originalUnits = remainingOriginalPinyin
      .replace(/([A-Za-z0-9]+)(--|-|$)/g, '$1 ').trim()
      .split(' ')
      .filter(p => p.trim());

    if (units.length === 0) break;

    // 從最大單位開始嘗試
    for (let j = units.length; j >= 1; j--) {
      const subPinyin = units.slice(0, j).join('-');
      const subOriginalPinyin = originalUnits.slice(0, j).join('-');

      if (wordDict[subPinyin]) {
        convertedText += wordDict[subPinyin];
        processedPinyinParts.push(subPinyin);
        processedOriginalPinyinParts.push(subOriginalPinyin);
        remainingPinyin = units.slice(j).join('-');
        remainingOriginalPinyin = originalUnits.slice(j).join('-');
        matched = true;
        break;
      }
    }

    // 若無匹配，處理單個音節
    if (!matched) {
      const singlePinyin = units[0];
      const singleOriginalPinyin = originalUnits[0];

      if (pinyinDict[singlePinyin] && pinyinDict[singlePinyin].length > 0) {
        convertedText += pinyinDict[singlePinyin][0];
      } else {
        convertedText += '□';
      }
      processedPinyinParts.push(singlePinyin);
      processedOriginalPinyinParts.push(singleOriginalPinyin);
      remainingPinyin = units.slice(1).join('-');
      remainingOriginalPinyin = originalUnits.slice(1).join('-');
    }
  }

  result += convertedText;

  // 記錄每個字符
  const convertedChars = Array.from(convertedText);
  const displayMode = displayModeSelect.value;

  for (let j = 0; j < convertedChars.length; j++) {
    let currentPinyin = '';
    let candidates = [];

    // 在字檢視模式下，確保每個字符對應正確的拼音
    if (displayMode === "char") {
      // 直接從 originalPinyinUnits 獲取對應的拼音
      if (j < originalPinyinUnits.length) {
        currentPinyin = originalPinyinUnits[j];
        candidates = pinyinDict[originalPinyinUnits[j].toLowerCase()] || [];
      } else {
        currentPinyin = originalPinyinUnits[originalPinyinUnits.length - 1] || '';
        candidates = pinyinDict[currentPinyin.toLowerCase()] || [];
      }
    } else {
      // 詞檢視模式，保留原邏輯
      let charCount = 0;
      for (let k = 0; k < processedPinyinParts.length; k++) {
        const part = processedPinyinParts[k];
        const partChars = Array.from(wordDict[part] ? wordDict[part] : pinyinDict[part] ? pinyinDict[part][0] : '□');
        const partLength = partChars.length;

        if (j >= charCount && j < charCount + partLength) {
          const pinyinParts = processedOriginalPinyinParts[k].split(/--|-/);
          const charPinyinIndex = j - charCount;
          currentPinyin = pinyinParts[charPinyinIndex] || pinyinParts[0];
          candidates = pinyinDict[pinyinParts[charPinyinIndex]] || [];
          break;
        }
        charCount += partLength;
      }
    }

    pinyinToCharMap.push({
      char: convertedChars[j],
      pinyin: currentPinyin,
      originalPinyin: currentPinyin,
      candidates: candidates,
      isWord: processedPinyinParts.length > 1 && displayMode === "word", // 僅在詞模式下標記為詞
      wordPinyin: displayMode === "word" ? pinyinText : '', // 詞模式下保留完整拼音
      uniqueWordId: displayMode === "word" ? uniqueWordId : null, // 僅在詞模式下設置 uniqueWordId
      position: currentLength + j,
      isConverted: true,
      isNewline: false,
    });
  }
  currentLength += convertedChars.length;
		  } else {
			// 處理單音節拼音（無連字符），保持原邏輯
			const pinyinArray = pinyinText.split(" ");
			const lowerCasePinyinArray = lowerCasePinyinText.split(" ");

			const pinyinWithTone = pinyinArray[0];
			const lowerCasePinyinWithTone = lowerCasePinyinArray[0];

			if (pinyinDict[lowerCasePinyinWithTone] && pinyinDict[lowerCasePinyinWithTone].length > 0) {
			  const char = pinyinDict[lowerCasePinyinWithTone][0];
			  const currentLength = Array.from(result).length;
			  result += char;

			  pinyinToCharMap.push({
				char: char,
				pinyin: pinyinWithTone,
				originalPinyin: pinyinWithTone,
				candidates: pinyinDict[lowerCasePinyinWithTone],
				isWord: false,
				wordPinyin: "",
				uniqueWordId: null,
				position: currentLength,
				isConverted: true,
				isNewline: false,
			  });
			} else {
			  const currentLength = Array.from(result).length;
			  result += pinyinWithTone;

			  pinyinToCharMap.push({
				char: pinyinWithTone,
				pinyin: pinyinWithTone,
				originalPinyin: pinyinWithTone,
				candidates: [],
				isWord: false,
				uniqueWordId: null,
				position: currentLength,
				isConverted: false,
				isNewline: false,
			  });
			}

			if (pinyinArray.length > 1) {
			  const remainingPinyins = pinyinArray.slice(1);
			  const remainingLowerCasePinyins = lowerCasePinyinArray.slice(1);

			  processedTokens.splice(i + 1, 0, {
				text: remainingPinyins.join(" "),
				lowerCaseText: remainingLowerCasePinyins.join(" "),
				isPinyin: true,
				isSpace: false,
				isNewline: false,
				originalPinyins: remainingPinyins.map((p, idx) => ({
				  text: p,
				  lowerCaseText: remainingLowerCasePinyins[idx],
				  isPinyin: true,
				  isSpace: false,
				  isNewline: false,
				})),
			  });
			}
		  }
		}

      }
    }

    outputText = result
    updateOutputDisplay()
  }

  // 清空候選字面板
  updateCandidatePanel([])

  // 清除當前選中元素
  clearAllSelectedElements()

  // 重置選取位置
  currentSelectedPosition = -1
  multiSelectStartPosition = -1
  multiSelectMode = false
}


// 更新輸出顯示
function updateOutputDisplay() {
  const pinyinHintType = pinyinHintTypeSelect.value

  if (pinyinHintType === "ruby-top" || pinyinHintType === "ruby-bottom") {
    generateRubyOutput(outputText, pinyinToCharMap, pinyinHintType)
  } else {
    generateHoverOutput(outputText, pinyinToCharMap, pinyinHintType === "hover")
  }
}

function generateHoverOutput(text, charMap, showHint) {
  let html = "";
  const chars = Array.from(text);
  const displayMode = displayModeSelect.value;

  if (displayMode === "word") {
    const mergedCharMap = [];
    let i = 0;

    while (i < charMap.length) {
      const currentChar = charMap[i];

      if (currentChar.isConverted && currentChar.isWord && currentChar.wordPinyin) {
        const wordChars = [currentChar];
        let nextIndex = i + 1;

        while (nextIndex < charMap.length) {
          const nextChar = charMap[nextIndex];
          if (
            nextChar.isConverted &&
            nextChar.isWord &&
            nextChar.wordPinyin &&
            currentChar.wordPinyin &&
            nextChar.wordPinyin === currentChar.wordPinyin &&
            nextChar.uniqueWordId === currentChar.uniqueWordId
          ) {
            wordChars.push(nextChar);
            nextIndex++;
          } else {
            break;
          }
        }

        if (wordChars.length > 1) {
          const mergedChar = {
            char: wordChars.map((c) => c.char).join(""),
            pinyin: currentChar.wordPinyin, // 使用完整的 wordPinyin
            wordPinyin: currentChar.wordPinyin,
            uniqueWordId: currentChar.uniqueWordId,
            candidates: [],
            isWord: true,
            position: currentChar.position,
            isConverted: true,
            isNewline: false,
            originalChars: wordChars,
          };

          mergedCharMap.push(mergedChar);
          i = nextIndex;
        } else {
          mergedCharMap.push(currentChar);
          i++;
        }
      } else {
        mergedCharMap.push(currentChar);
        i++;
      }
    }

    for (let i = 0; i < mergedCharMap.length; i++) {
      const charInfo = mergedCharMap[i];

      if (charInfo.isNewline) {
        html += "<br>";
      } else if (charInfo.isConverted) {
        const convertedPinyin = convertPinyinForDisplay(charInfo.pinyin); // 使用 wordPinyin
        const pinyinHint = showHint ? `<span class="pinyin-hint">${convertedPinyin}</span>` : "";

        html += `<span class="char-hover" data-pinyin="${charInfo.pinyin}" data-position="${charInfo.position}" data-is-word="${charInfo.isWord}" ${
          charInfo.wordPinyin ? `data-word-pinyin="${charInfo.wordPinyin}"` : ""
        } ${
          charInfo.uniqueWordId ? `data-unique-word-id="${charInfo.uniqueWordId}"` : ""
        }>${charInfo.char}${pinyinHint}</span>`;
      } else {
        html += `<span class="normal-text">${charInfo.char}</span>`;
      }
    }
  } else {
    for (let i = 0; i < chars.length; i++) {
      const char = chars[i];
      const charInfo = charMap.find((item) => item.position === i);

      if (charInfo) {
        if (charInfo.isNewline) {
          html += "<br>";
        } else if (charInfo.isConverted) {
          const convertedPinyin = convertPinyinForDisplay(charInfo.pinyin); // 使用單字符拼音
          const pinyinHint = showHint ? `<span class="pinyin-hint">${convertedPinyin}</span>` : "";

          html += `<span class="char-hover" data-pinyin="${charInfo.pinyin}" data-position="${i}" data-is-word="${charInfo.isWord}" ${
            charInfo.wordPinyin ? `data-word-pinyin="${charInfo.wordPinyin}"` : ""
          } ${
            charInfo.uniqueWordId ? `data-unique-word-id="${charInfo.uniqueWordId}"` : ""
          }>${char}${pinyinHint}</span>`;
        } else {
          html += `<span class="normal-text">${char}</span>`;
        }
      } else {
        html += `<span class="normal-text">${char}</span>`;
      }
    }
  }

  outputArea.innerHTML = html;
}

function generateRubyOutput(text, charMap, rubyPosition) {
  let html = "";
  const rubyClass = rubyPosition === "ruby-top" ? "ruby-top" : "ruby-bottom";
  const chars = Array.from(text);
  const displayMode = displayModeSelect.value;

  if (displayMode === "word") {
    const mergedCharMap = [];
    let i = 0;
    const charMapLength = charMap.length;

    while (i < charMapLength) {
      const currentChar = charMap[i];

      if (currentChar.isConverted && currentChar.isWord && currentChar.wordPinyin) {
        const wordChars = [currentChar];
        let nextIndex = i + 1;

        while (nextIndex < charMapLength) {
          const nextChar = charMap[nextIndex];
          if (
            nextChar.isConverted &&
            nextChar.isWord &&
            nextChar.wordPinyin &&
            currentChar.wordPinyin &&
            nextChar.wordPinyin === currentChar.wordPinyin &&
            nextChar.uniqueWordId === currentChar.uniqueWordId
          ) {
            wordChars.push(nextChar);
            nextIndex++;
          } else {
            break;
          }
        }

        if (wordChars.length > 1) {
          const mergedChar = {
            char: wordChars.map((c) => c.char).join(""),
            pinyin: currentChar.wordPinyin, // 使用完整的 wordPinyin
            wordPinyin: currentChar.wordPinyin,
            uniqueWordId: currentChar.uniqueWordId,
            candidates: [],
            isWord: true,
            position: currentChar.position,
            isConverted: true,
            isNewline: false,
            originalChars: wordChars,
          };

          mergedCharMap.push(mergedChar);
          i = nextIndex;
        } else {
          mergedCharMap.push(currentChar);
          i++;
        }
      } else {
        mergedCharMap.push(currentChar);
        i++;
      }
    }

    for (let i = 0; i < mergedCharMap.length; i++) {
      const charInfo = mergedCharMap[i];

      if (charInfo.isNewline) {
        html += "<br>";
      } else if (charInfo.isConverted) {
        const convertedPinyin = convertPinyinForDisplay(charInfo.pinyin); // 使用 wordPinyin
        html += `<span class="ruby-container">
                <ruby class="${rubyClass}" data-pinyin="${charInfo.pinyin}" data-position="${charInfo.position}" data-is-word="${charInfo.isWord}" ${
                  charInfo.wordPinyin ? `data-word-pinyin="${charInfo.wordPinyin}"` : ""
                } ${
                  charInfo.uniqueWordId ? `data-unique-word-id="${charInfo.uniqueWordId}"` : ""
                }>
                  <span class="ruby-base">${charInfo.char}</span>
                  <rt class="ruby-text">${convertedPinyin}</rt>
                </ruby>
              </span>`;
      } else {
        html += `<span class="normal-text">${charInfo.char}</span>`;
      }
    }
  } else {
    for (let i = 0; i < chars.length; i++) {
      const char = chars[i];
      const charInfo = charMap.find((item) => item.position === i);

      if (charInfo) {
        if (charInfo.isNewline) {
          html += "<br>";
        } else if (charInfo.isConverted) {
          const convertedPinyin = convertPinyinForDisplay(charInfo.pinyin); // 使用單字符拼音
          html += `<span class="ruby-container">
                  <ruby class="${rubyClass}" data-pinyin="${charInfo.pinyin}" data-position="${i}" data-is-word="${charInfo.isWord}" ${
                    charInfo.wordPinyin ? `data-word-pinyin="${charInfo.wordPinyin}"` : ""
                  } ${
                    charInfo.uniqueWordId ? `data-unique-word-id="${charInfo.uniqueWordId}"` : ""
                  }>
                    <span class="ruby-base">${char}</span>
                    <rt class="ruby-text">${convertedPinyin}</rt>
                  </ruby>
                </span>`;
        } else {
          html += `<span class="normal-text">${char}</span>`;
        }
      } else {
        html += `<span class="normal-text">${char}</span>`;
      }
    }
  }

  outputArea.innerHTML = html;
}

// 修改：清除所有選中元素
function clearAllSelectedElements() {
  // 清除所有帶有 char-selected 或 char-multiselect 類的元素
  const selectedElements = outputArea.querySelectorAll(".char-selected, .char-multiselect")
  selectedElements.forEach((element) => {
    element.classList.remove("char-selected")
    element.classList.remove("char-multiselect")
  })

  // 不重置當前選中元素和位置，只清除視覺樣式
  currentSelectedElement = null
}

// 清除當前選中元素
function clearSelectedElement() {
  if (currentSelectedElement) {
    // 移除選中樣式
    currentSelectedElement.classList.remove("char-selected")
    currentSelectedElement.classList.remove("char-multiselect")
    currentSelectedElement = null
    currentSelectedPosition = -1
  }
}

// 處理文檔點擊事件，取消選取
function handleDocumentClick(event) {
  // 如果點擊的不是輸出區域內的元素，且不是候選面板內的元素
  if (!outputArea.contains(event.target) && !candidatePanel.contains(event.target)) {
    clearAllSelectedElements()
    updateCandidatePanel([])
  }
}

// 處理鍵盤按鍵釋放事件
function handleKeyUp(event) {
  // 如果釋放的是 Shift 鍵，且之前處於多選模式
  if (event.key === "Shift") {
    // 保持選取狀態，但標記多選模式結束
    multiSelectMode = false
  }
}

// 處理鍵盤事件
function handleKeyDown(event) {
    const inputText = document.getElementById("inputText");
    if (document.activeElement === inputText) {
        return; // 如果焦點在 inputText，直接返回，保持原生輸入行為
    }

  // 檢查是否有候選項
  const candidateElements = candidateList.querySelectorAll(".candidate-word")
  if (candidateElements.length > 0) {
    // 檢查按鍵是否是1-9或a-z
    const key = event.key.toLowerCase()
    const isDigit = /^[1-9]$/.test(key)
    const isLetter = /^[a-z]$/.test(key)
    const isPlusKey = key === "+" || key === "=" // 支援「+」鍵（有些鍵盤需要Shift+「=」）

    if (isDigit || isLetter) {
      // 查找對應的候選項
      let targetIndex = ""
      if (isDigit) {
        targetIndex = key // 1-9
      } else if (isLetter) {
        targetIndex = key // a-z
      }

      // 查找並選擇對應的候選項
      for (const element of candidateElements) {
        if (element.getAttribute("data-index") === targetIndex) {
          // 模擬點擊該候選項
          element.click()
          event.preventDefault() // 防止按鍵的默認行為
          return
        }
      }
    } else if (isPlusKey) {
      // 查找自定義按鈕（帶有 add-custom-button 類的元素）
      const addCustomButton = candidateList.querySelector(".add-custom-button")
      if (addCustomButton) {
        // 模擬點擊自定義按鈕
        addCustomButton.click()
        event.preventDefault() // 防止按鍵的默認行為
        return
      }
    }
  }

  // 如果輸出區域為空，則不處理鍵盤事件
  if (outputText.length === 0) {
    return
  }

  // 按 ESC 鍵取消選取
  if (event.key === "Escape") {
    // 清除瀏覽器默認選取
    window.getSelection().removeAllRanges()
    clearAllSelectedElements()
    updateCandidatePanel([])
    return
  }

  // 方向鍵導航 - 增加「0」等同左鍵，「.」等同右鍵
  if (event.key === "ArrowLeft" || event.key === "0" || event.key === "ArrowRight" || event.key === ".") {
    event.preventDefault() // 防止頁面滾動

    // 清除瀏覽器默認選取
    window.getSelection().removeAllRanges()

    // 確定實際的方向
    const isLeftDirection = event.key === "ArrowLeft" || event.key === "0"

    const isRuby = pinyinHintTypeSelect.value === "ruby-top" || pinyinHintTypeSelect.value === "ruby-bottom"
    const selector = isRuby ? ".ruby-container" : ".char-hover"
    const allCharElements = Array.from(outputArea.querySelectorAll(selector))

    if (allCharElements.length === 0) return

    // 如果沒有當前選中位置，選擇第一個元素
    if (currentSelectedPosition === -1) {
      const firstElement = allCharElements[0]
      firstElement.classList.add("char-selected")
      currentSelectedElement = firstElement

      const position = isRuby
        ? Number.parseInt(firstElement.querySelector("ruby").getAttribute("data-position"))
        : Number.parseInt(firstElement.getAttribute("data-position"))

      currentSelectedPosition = position
      multiSelectStartPosition = position
      selectedRange = { start: position, end: position }

      // 更新候選面板 - 考慮詞模式
      if (displayModeSelect.value === "word") {
        // 獲取完整詞的候選項
        const selectedElement = firstElement
        let selectedText = ""

        if (isRuby) {
          const rubyBase = selectedElement.querySelector(".ruby-base")
          if (rubyBase) {
            selectedText = rubyBase.textContent
          }
        } else {
          selectedText = selectedElement.textContent.replace(/\s+/g, "").trim()
          // 移除拼音提示
          const pinyinHint = selectedElement.querySelector(".pinyin-hint")
          if (pinyinHint) {
            selectedText = selectedText.replace(pinyinHint.textContent, "").trim()
          }
        }

        // 獲取詞的拼音
        const pinyin = isRuby
          ? selectedElement.querySelector("ruby").getAttribute("data-pinyin")
          : selectedElement.getAttribute("data-pinyin")

        // 如果是多字詞，使用完整詞的拼音查找候選項
        if (Array.from(selectedText).length > 1) {
          const wordChars = getSelectedChars(position, position + Array.from(selectedText).length - 1)
          // 修正：添加 forceShowAddButton 參數，確保多字詞顯示「+」按鈕
          const isMultiChar = Array.from(selectedText).length > 1
          const forceShowAddButton = displayModeSelect.value === "word" && isMultiChar
          updateCandidatePanel(getCandidatesForChars(wordChars), forceShowAddButton)
        } else {
          updateCandidatePanel(getCandidatesForPosition(position))
        }
      } else {
        updateCandidatePanel(getCandidatesForPosition(position))
      }
      return
    }

    // 獲取當前選中元素的索引
    let currentIndex = -1
    for (let i = 0; i < allCharElements.length; i++) {
      const element = allCharElements[i]
      const position = isRuby
        ? Number.parseInt(element.querySelector("ruby").getAttribute("data-position"))
        : Number.parseInt(element.getAttribute("data-position"))

      if (position === currentSelectedPosition) {
        currentIndex = i
        break
      }
    }

    if (currentIndex === -1) return

    // 計算新的索引
    let newIndex = currentIndex
    if (isLeftDirection) {
      newIndex = Math.max(0, currentIndex - 1)
    } else {
      newIndex = Math.min(allCharElements.length - 1, currentIndex + 1)
    }

    // 獲取新元素的位置
    const newElement = allCharElements[newIndex]
    const newPosition = isRuby
      ? Number.parseInt(newElement.querySelector("ruby").getAttribute("data-position"))
      : Number.parseInt(newElement.getAttribute("data-position"))

    // 如果是多選模式（Shift + 方向鍵）
    if (event.shiftKey) {
      // 如果是第一次進入多選模式，記錄起始位置
      if (!multiSelectMode) {
        multiSelectMode = true
        multiSelectStartPosition = currentSelectedPosition
      }

      // 清除所有選中元素的樣式
      clearAllSelectedElements()

      // 計算選取範圍
      const startPos = Math.min(multiSelectStartPosition, newPosition)
      const endPos = Math.max(multiSelectStartPosition, newPosition)

      // 選中範圍內的所有元素
      for (let i = 0; i < allCharElements.length; i++) {
        const element = allCharElements[i]
        const position = isRuby
          ? Number.parseInt(element.querySelector("ruby").getAttribute("data-position"))
          : Number.parseInt(element.getAttribute("data-position"))

        if (position >= startPos && position <= endPos) {
          element.classList.add("char-multiselect")
        }
      }

      // 更新選取範圍
      selectedRange = { start: startPos, end: endPos }

      // 更新當前選中位置，但保持多選起始位置不變
      currentSelectedPosition = newPosition

      // 獲取選取範圍內的所有字符及其拼音
      const selectedChars = getSelectedChars(startPos, endPos)

      // 修正：添加 forceShowAddButton 參數，確保多字詞顯示「+」按鈕
      const isMultiChar = selectedChars.length > 1
      const forceShowAddButton = displayModeSelect.value === "word" && isMultiChar
      updateCandidatePanel(getCandidatesForChars(selectedChars), forceShowAddButton)
    } else {
      // 單選模式（僅方向鍵）
      // 清除多選模式
      multiSelectMode = false
      multiSelectStartPosition = -1

      // 清除所有選中元素
      clearAllSelectedElements()

      // 選中新元素
      newElement.classList.add("char-selected")
      currentSelectedElement = newElement

      // 更新當前選中位置
      currentSelectedPosition = newPosition

      // 更新選取範圍
      selectedRange = { start: newPosition, end: newPosition }

      // 更新候選面板 - 考慮詞模式
      if (displayModeSelect.value === "word") {
        // 獲取完整詞的候選項
        let selectedText = ""

        if (isRuby) {
          const rubyBase = newElement.querySelector(".ruby-base")
          if (rubyBase) {
            selectedText = rubyBase.textContent
          }
        } else {
          selectedText = newElement.textContent.replace(/\s+/g, "").trim()
          // 移除拼音提示
          const pinyinHint = newElement.querySelector(".pinyin-hint")
          if (pinyinHint) {
            selectedText = selectedText.replace(pinyinHint.textContent, "").trim()
          }
        }

        // 如果是多字詞，使用完整詞的拼音查找候選項
        if (Array.from(selectedText).length > 1) {
          // 獲取詞的拼音
          const pinyin = isRuby
            ? newElement.querySelector("ruby").getAttribute("data-pinyin")
            : newElement.getAttribute("data-pinyin")

          // 計算詞的結束位置
          const wordEndPosition = newPosition + Array.from(selectedText).length - 1

          // 獲取詞的所有字符
          const wordChars = getSelectedChars(newPosition, wordEndPosition)

          // 更新選取範圍以包含整個詞
          selectedRange = { start: newPosition, end: wordEndPosition }

          // 修正：添加 forceShowAddButton 參數，確保多字詞顯示「+」按鈕
          const isMultiChar = Array.from(selectedText).length > 1
          const forceShowAddButton = displayModeSelect.value === "word" && isMultiChar
          updateCandidatePanel(getCandidatesForChars(wordChars), forceShowAddButton)
        } else {
          updateCandidatePanel(getCandidatesForPosition(newPosition))
        }
      } else {
        updateCandidatePanel(getCandidatesForPosition(newPosition))
      }
    }
  }
}

// 獲取指定位置的候選字
function getCandidatesForPosition(position) {
  let candidates = []
  const charInfo = pinyinToCharMap.find((item) => item.position === position)

  if (charInfo && charInfo.isConverted) {
    const lowerCasePinyin = charInfo.pinyin ? charInfo.pinyin.toLowerCase() : ""

    if (charInfo.candidates && charInfo.candidates.length > 0) {
      candidates = charInfo.candidates
    } else if (lowerCasePinyin && pinyinDict[lowerCasePinyin]) {
      candidates = pinyinDict[lowerCasePinyin]
    }
  }

  return candidates
}

// 獲取選取範圍內的字符
function getSelectedChars(startPos, endPos) {
  const selectedChars = []

  for (let i = startPos; i <= endPos; i++) {
    const charInfo = pinyinToCharMap.find((item) => item.position === i)
    if (charInfo && charInfo.isConverted) {
      selectedChars.push({
        char: charInfo.char,
        pinyin: charInfo.pinyin,
        lowerCasePinyin: charInfo.pinyin ? charInfo.pinyin.toLowerCase() : "",
        position: i,
        isWord: charInfo.isWord,
        wordPinyin: charInfo.wordPinyin,
        lowerCaseWordPinyin: charInfo.wordPinyin ? charInfo.wordPinyin.toLowerCase() : "",
      })
    }
  }

  return selectedChars
}

// 獲取選取字符的候選詞
function getCandidatesForChars(selectedChars) {
  let candidates = []

  if (selectedChars.length === 0) return candidates

  // 如果只選取了一個字符
  if (Array.from(selectedChars).length === 1) {
    const charInfo = selectedChars[0]
    const lowerCasePinyin = charInfo.lowerCasePinyin.replace(/--|-/g, "")

    if (pinyinDict[lowerCasePinyin]) {
      candidates = pinyinDict[lowerCasePinyin]
    }
  }
  // 如果選取了多個字符
  else {
    // 獲取選取的拼音序列，使用小寫版本進行匹配
	selectedCharsLowerCasePinyin = selectedChars[0].lowerCaseWordPinyin

    // 查找詞庫中匹配的詞彙
    const combinedWordDict = { ...wordDict, ...userDict }
    for (const [pinyin, word] of Object.entries(combinedWordDict)) {
      // 確保詞的長度與選取的字符數量相同
      if (Array.from(word).length === selectedChars.length) {
        // 只檢查拼音是否完全匹配（不區分大小寫）
        if (pinyin.toLowerCase() === selectedCharsLowerCasePinyin) {
          if (!candidates.includes(word)) {
            candidates.push(word)
          }
        }
      }
    }
  }

  return candidates
}

// 處理字符點擊事件
function handleCharClick(event) {

  // 防止事件冒泡，避免觸發 document 的點擊事件
  event.stopPropagation()

  // 清除所有選中的元素
  clearAllSelectedElements()

  // 找到被點擊的元素
  let targetElement = event.target

  // 檢查拼音提示類型
  const pinyinHintType = pinyinHintTypeSelect.value
  const isRuby = pinyinHintType === "ruby-top" || pinyinHintType === "ruby-bottom"

  // 如果點擊的是 ruby 內部元素，找到父級 ruby 容器元素
  if (isRuby) {
    // 修正：只有當點擊的是 ruby-base 或 ruby-text 時才處理
    if (targetElement.classList.contains("ruby-base") || targetElement.classList.contains("ruby-text")) {
      targetElement = targetElement.closest("ruby")
      currentSelectedElement = targetElement.closest(".ruby-container")
    } else if (targetElement.tagName === "RUBY") {
      // 直接點擊到 ruby 元素
      currentSelectedElement = targetElement.closest(".ruby-container")
    } else if (targetElement.classList.contains("ruby-container")) {
      // 直接點擊到 ruby-container
      currentSelectedElement = targetElement
    } else {
      // 如果點擊的是 ruby 元素的邊緣或其他區域，不處理
      updateCandidatePanel([])
      return
    }
  } else if (targetElement.classList.contains("pinyin-hint")) {
    // 如果點擊的是拼音提示，找到父級元素
    targetElement = targetElement.parentElement
    currentSelectedElement = targetElement
  } else if (targetElement.classList.contains("char-hover")) {
    currentSelectedElement = targetElement
  } else {
    // 如果點擊的不是可選取的元素，清空候選面板並返回
    updateCandidatePanel([])
    return
  }

  // 添加選中樣式
  if (currentSelectedElement) {
    currentSelectedElement.classList.add("char-selected")
  }

  // 確保目標元素是可點擊的漢字元素
  if ((isRuby && targetElement.tagName === "RUBY") || (!isRuby && targetElement.classList.contains("char-hover"))) {
    const position = Number.parseInt(targetElement.getAttribute("data-position"));
    const pinyin = targetElement.getAttribute("data-pinyin");
    const isWord = targetElement.getAttribute("data-is-word") === "true";
    const wordPinyin = targetElement.getAttribute("data-word-pinyin");
    const uniqueWordId = targetElement.getAttribute("data-unique-word-id"); // 獲取唯一詞ID
    
    // 保存當前選中位置
    currentSelectedPosition = position;
    multiSelectStartPosition = position; // 同時設置多選起始位置

    // 獲取字符
    let char;
    if (isRuby) {
      char = targetElement.querySelector(".ruby-base").textContent;
    } else {
      char = targetElement.textContent.replace(/\s+/g, "").trim();
      const pinyinHint = targetElement.querySelector(".pinyin-hint");
      if (pinyinHint) {
        char = char.replace(pinyinHint.textContent, "").trim();
      }
    }

    // 查找候選字
    let candidates = [];
    let lowerCasePinyin = pinyin ? pinyin.toLowerCase() : "";
    
    // 檢查是否為單個字符
    if (Array.from(char).length === 1) {
      // 查找字符映射中的候選字
      const charMapInfo = pinyinToCharMap.find(
        (item) => item.position === position && item.pinyin.toLowerCase() === lowerCasePinyin
      );
      if (charMapInfo && charMapInfo.candidates && charMapInfo.candidates.length > 0) {
        candidates = charMapInfo.candidates;
      } else if (lowerCasePinyin && pinyinDict[lowerCasePinyin]) {
        candidates = pinyinDict[lowerCasePinyin];
      }
    } else {
      // 處理詞彙的情況
      const wordPinyinArray = lowerCasePinyin ? lowerCasePinyin.toLowerCase().split(" ") : [];
      let combinedLowerCasePinyin = wordPinyinArray.join(" ");

      // 查找詞庫中匹配的詞彙 // here
      const combinedWordDict = { ...wordDict, ...userDict };
      for (const [pinyin, word] of Object.entries(combinedWordDict)) {
        if (Array.from(word).length === Array.from(char).length) {
          if (pinyin.toLowerCase() === combinedLowerCasePinyin) {
            if (!candidates.includes(word)) {
              candidates.push(word);
            }
          }
        }
      }
    }

    // 保存選取範圍
    selectedRange = { start: position, end: position };
    
    // 更新候選面板
    const displayMode = displayModeSelect.value;
    const isMultiChar = Array.from(char).length > 1;
    const forceShowAddButton = displayMode === "word" && isMultiChar;
    updateCandidatePanel(candidates, forceShowAddButton);
  } else {
    updateCandidatePanel([]);
  }
}

// 處理文字選取事件
function handleTextSelection(event) {
  // 如果是點擊事件，不在這裡處理
  if (event.type === "click") {
    return
  }

  // 延遲執行，確保選取已完成
  setTimeout(() => {
    const selection = window.getSelection()

    // 如果沒有選取文字，則不處理
    if (!selection || !selection.toString().trim()) {
      return
    }

    // 確保選取的是輸出區域內的文字
    const range = selection.getRangeAt(0)
    if (!outputArea.contains(range.commonAncestorContainer)) {
      return
    }

    // 清除所有選中的元素
    clearAllSelectedElements()

    // 找出選取範圍內的所有字符及其對應拼音
    const selectedChars = []
    let startPosition = -1
    let endPosition = -1

    // 檢查拼音提示類型
    const pinyinHintType = pinyinHintTypeSelect.value
    const isRuby = pinyinHintType === "ruby-top" || pinyinHintType === "ruby-bottom"

    // 獲取當前顯示模式
    const displayMode = displayModeSelect.value

    // 根據不同的拼音提示類型選擇不同的選擇器
    const selector = isRuby ? "ruby" : ".char-hover"

    // 尋找選取範圍內的所有字符
    const allCharElements = outputArea.querySelectorAll(selector)
    for (let i = 0; i < allCharElements.length; i++) {
      const element = allCharElements[i]

      // 檢查元素是否在選取範圍內
      if (selection.containsNode(element, true)) {
        const position = Number.parseInt(element.getAttribute("data-position"))
        const pinyin = element.getAttribute("data-pinyin")
        const isWord = element.getAttribute("data-is-word") === "true"
        const wordPinyin = element.getAttribute("data-word-pinyin")

        // 獲取元素的文字內容
        let elementText = ""
        if (isRuby) {
          elementText = element.querySelector(".ruby-base").textContent
        } else {
          elementText = element.textContent.replace(/\s+/g, "").trim()
          // 移除拼音提示
          const pinyinHint = element.querySelector(".pinyin-hint")
          if (pinyinHint) {
            elementText = elementText.replace(pinyinHint.textContent, "").trim()
          }
        }

        // 在詞檢視模式下，獲取完整的詞
        if (displayMode === "word") {
          selectedChars.push({
            char: elementText, // 使用完整的文字內容
            pinyin,
            lowerCasePinyin: pinyin ? pinyin.toLowerCase() : "",
            position,
            isWord,
            wordPinyin,
            lowerCaseWordPinyin: wordPinyin ? wordPinyin.toLowerCase() : "",
          })
        } else {
          // 字檢視模式，使用原來的邏輯
          const firstChar = Array.from(elementText)[0]
          selectedChars.push({
            char: firstChar,
            pinyin,
            lowerCasePinyin: pinyin ? pinyin.toLowerCase() : "",
            position,
            isWord,
            wordPinyin,
            lowerCaseWordPinyin: wordPinyin ? wordPinyin.toLowerCase() : "",
          })
        }

        if (startPosition === -1 || position < startPosition) {
          startPosition = position
        }

        if (position > endPosition) {
          endPosition = position
        }

        // 為選中的元素添加反白效果
        if (isRuby) {
          const container = element.closest(".ruby-container")
          if (container) {
            container.classList.add("char-selected")
            if (!currentSelectedElement) {
              currentSelectedElement = container
            }
          }
        } else {
          element.classList.add("char-selected")
          if (!currentSelectedElement) {
            currentSelectedElement = element
          }
        }
      }
    }

    if (selectedChars.length === 0) return

    // 保存當前選中位置
    currentSelectedPosition = endPosition
    multiSelectStartPosition = startPosition // 設置多選起始位置

    // 檢查是否選取了完整的詞
    let candidates = []

    // 檢查是否為單個字符或詞
    if (selectedChars.length === 1) {
      const charInfo = selectedChars[0]

      // 在詞檢視模式下，檢查是否為多字詞
      if (displayMode === "word" && Array.from(charInfo.char).length > 1) {
        // 處理多字詞的情況
        const wordChars = Array.from(charInfo.char)
        const lowerCasePinyin = charInfo.pinyin ? charInfo.pinyin.toLowerCase() : ""

        // 查找詞庫中匹配的詞彙
        const combinedWordDict = { ...wordDict, ...userDict }
        for (const [pinyin, word] of Object.entries(combinedWordDict)) {
          // 確保詞的長度與選取的字符數量相同
          if (Array.from(word).length === wordChars.length) {
            // 檢查拼音是否匹配（不區分大小寫）
            if (pinyin.toLowerCase() === lowerCasePinyin) {
              if (!candidates.includes(word)) {
                candidates.push(word)
              }
            }
          }
        }
      } else {
        // 單個字符的情況，使用原來的邏輯
        const lowerCasePinyin = charInfo.lowerCasePinyin.replace(/--|-/g, "")

        // 查找字符映射中的候選字
        const charMapInfo = pinyinToCharMap.find(
          (item) => item.position === charInfo.position && item.pinyin.toLowerCase() === lowerCasePinyin,
        )

        if (charMapInfo && charMapInfo.candidates && charMapInfo.candidates.length > 0) {
          candidates = charMapInfo.candidates
        } else if (lowerCasePinyin && pinyinDict[lowerCasePinyin]) {
          // 如果在字符映射中找不到，直接查詢拼音字典
          candidates = pinyinDict[lowerCasePinyin]
        }
      }
    } else {
      // 獲取選取的拼音序列，使用小寫版本進行匹配
      const lowerCasePinyinArray = selectedChars.map((char) => char.lowerCasePinyin)
      let combinedLowerCasePinyin = lowerCasePinyinArray.join(" ")

      // 查找詞庫中匹配的詞彙
      const combinedWordDict = { ...wordDict, ...userDict }
      for (const [pinyin, word] of Object.entries(combinedWordDict)) {
        // 確保詞的長度與選取的字符數量相同
        if (Array.from(word).length === selectedChars.length) {
          // 只檢查拼音是否完全匹配（不區分大小寫）
          if (pinyin.toLowerCase() === combinedLowerCasePinyin) {
            if (!candidates.includes(word)) {
              candidates.push(word)
            }
          }
        }
      }
    }

    // 更新候選面板 - 即使沒有候選字，也要顯示「+」按鈕
    // 修改：傳入第二個參數 true，表示即使沒有候選字也要顯示「+」按鈕

    const isMultiChar =
      selectedChars.length > 1 || (selectedChars.length === 1 && Array.from(selectedChars[0].char).length > 1)
    const forceShowAddButton = displayMode === "word" && isMultiChar
    updateCandidatePanel(candidates, forceShowAddButton)

    // 保存選取範圍
    selectedRange = { start: startPosition, end: endPosition }

    // 防止事件冒泡
    event.stopPropagation()
  }, 10) // 短暫延遲，確保選取已完成
}

function updateCandidatePanel(candidates, forceShowAddButton = false) {
  // 完全清空候選字列表，包括所有子元素和事件監聽器
  while (candidateList.firstChild) {
    candidateList.removeChild(candidateList.firstChild);
  }

  // 檢查是否選中了有效的元素（ruby 或 hint 元素）
  const hasValidSelection = currentSelectedElement !== null && currentSelectedPosition !== -1;

  // 如果沒有候選字且（沒有有效選擇或不需要強制顯示「+」按鈕），保持空白並直接返回
  if (!hasValidSelection) {
    candidateList.innerHTML = "&nbsp;";
    return; // 直接返回，不添加空的候選字
  }

  // 獲取當前顯示模式
  const displayMode = displayModeSelect.value;

  // 計算實際的選取範圍
  const actualStart = selectedRange.start;
  let actualEnd = selectedRange.end;

  // 在詞檢視模式下，需要確保選取範圍包含整個詞
  if (displayMode === "word" && currentSelectedElement) {
    let selectedText = "";
    const pinyinHintType = pinyinHintTypeSelect.value;
    const isRuby = pinyinHintType === "ruby-top" || pinyinHintType === "ruby-bottom";

    if (isRuby) {
      const rubyBase = currentSelectedElement.querySelector(".ruby-base");
      if (rubyBase) {
        selectedText = rubyBase.textContent;
      }
    } else {
      selectedText = currentSelectedElement.textContent.replace(/\s+/g, "").trim();
      const pinyinHint = currentSelectedElement.querySelector(".pinyin-hint");
      if (pinyinHint) {
        selectedText = selectedText.replace(pinyinHint.textContent, "").trim();
      }
    }

    const wordLength = Array.from(selectedText).length;
    if (wordLength > 1) {
      actualEnd = actualStart + wordLength - 1;
    }
  }

  // 獲取當前選取的字數
  const selectedCharsCount = actualEnd - actualStart + 1;

  // 獲取當前選取的文字內容
  let selectedText = "";
  let selectedUniqueWordId = null;
  if (currentSelectedElement) {
    const pinyinHintType = pinyinHintTypeSelect.value;
    const isRuby = pinyinHintType === "ruby-top" || pinyinHintType === "ruby-bottom";

    if (isRuby) {
      const rubyBase = currentSelectedElement.querySelector(".ruby-base");
      if (rubyBase) {
        selectedText = rubyBase.textContent;
      }
      selectedUniqueWordId = currentSelectedElement.querySelector("ruby").getAttribute("data-unique-word-id");
    } else {
      selectedText = currentSelectedElement.textContent.replace(/\s+/g, "").trim();
      const pinyinHint = currentSelectedElement.querySelector(".pinyin-hint");
      if (pinyinHint) {
        selectedText = selectedText.replace(pinyinHint.textContent, "").trim();
      }
      selectedUniqueWordId = currentSelectedElement.getAttribute("data-unique-word-id");
    }
  } else if (selectedRange.start !== selectedRange.end) {
    const selectedChars = getSelectedChars(selectedRange.start, selectedRange.end);
    selectedText = selectedChars.map((char) => char.char).join("");
    selectedUniqueWordId = selectedChars[0]?.uniqueWordId || null;
  }

  // 創建所有候選字元素的陣列
  const candidateElements = [];

  // 添加候選字
  candidates.forEach((candidate, index) => {
    const candidateElement = document.createElement("span");
    candidateElement.className = "candidate-word";

    let indexLabel = "";
    if (index < 9) {
      indexLabel = (index + 1).toString();
    } else if (index < 35) {
      indexLabel = String.fromCharCode(97 + (index - 9));
    }

    if (indexLabel) {
      candidateElement.innerHTML = `<span class="candidate-index">${indexLabel}</span>${candidate}`;
    } else {
      candidateElement.textContent = candidate;
    }

    candidateElement.setAttribute("data-index", indexLabel);
    candidateElement.addEventListener("click", () => selectCandidate(candidate));
    candidateList.appendChild(candidateElement);
    candidateElements.push(candidateElement);
  });

  // 只有當有選中的字符時，才添加空的候選字和拼音編輯按鈕
  if (currentSelectedPosition !== -1) {
    let selectedPinyin = "";
    const selectedChars = getSelectedChars(actualStart, actualEnd);
    if (selectedChars.length > 0) {
      if (selectedChars.length === 1) {
        selectedPinyin = selectedChars[0].originalPinyin || selectedChars[0].pinyin;
      } else {
        const firstChar = selectedChars[0];
        if (firstChar.isWord && firstChar.wordPinyin) {
          selectedPinyin = firstChar.wordPinyin;
        } else {
          selectedPinyin = selectedChars.map((char) => char.originalPinyin || char.pinyin).join(" ");
        }
      }
    }

    // 增加一個空的候選字，供使用者自行輸入
    const customCandidateElement = document.createElement("span");
    customCandidateElement.className = "candidate-word custom-input";
    customCandidateElement.style.display = "none";

    const minWidth = Math.max(20, selectedCharsCount * 20);
    const editableSpan = document.createElement("span");
    editableSpan.contentEditable = "true";
    editableSpan.style.minWidth = `${minWidth}px`;
    editableSpan.style.display = "inline-block";
    editableSpan.style.outline = "none";
    editableSpan.style.width = "100%";
    editableSpan.style.height = "100%";
    editableSpan.textContent = selectedText;

    customCandidateElement.appendChild(editableSpan);
    candidateList.appendChild(customCandidateElement);

    // 添加編輯拼音和添加自定義字的按鈕
    const addCustomButton = document.createElement("span");
    addCustomButton.className = "candidate-word add-custom-button";
    addCustomButton.innerHTML = "+";
    addCustomButton.title = "編輯拼音與添加自定義字";
    candidateList.appendChild(addCustomButton);

    const isMultiCharWord = displayMode === "word" && selectedCharsCount > 1;

    if (isMultiCharWord) {
      const selectedChars = getSelectedChars(actualStart, actualEnd);
      const currentWordData = {
        text: selectedText,
        start: actualStart,
        end: actualEnd,
        uniqueWordId: selectedUniqueWordId,
      };

      selectedChars.forEach((charInfo, index) => {
        const charButton = document.createElement("span");
        charButton.className = "candidate-word char-button";
        charButton.textContent = charInfo.char;
        charButton.title = `修改「${charInfo.char}」字`;
        charButton.setAttribute("data-position", charInfo.position);
        charButton.setAttribute("data-pinyin", charInfo.pinyin);
        charButton.setAttribute("data-unique-word-id", charInfo.uniqueWordId || "");

        charButton.addEventListener("click", (event) => {
          event.stopPropagation();

          while (candidateList.firstChild) {
            candidateList.removeChild(candidateList.firstChild);
          }

          const charPosition = Number.parseInt(charButton.getAttribute("data-position"));
          const charPinyin = charButton.getAttribute("data-pinyin");
          const charCandidates = pinyinDict[charPinyin.toLowerCase()] || [];

          const backButton = document.createElement("span");
          backButton.className = "candidate-word back-button";
          backButton.innerHTML = "←";
          backButton.title = "返回詞選擇";
          backButton.setAttribute("data-char-position", charPosition);
          backButton.setAttribute("data-word-data", JSON.stringify(currentWordData));

          backButton.addEventListener("click", (e) => {
            e.stopPropagation();
            updateCandidatePanel(candidates, true);
          });

          candidateList.appendChild(backButton);

          charCandidates.forEach((candidate, idx) => {
            const candidateElement = document.createElement("span");
            candidateElement.className = "candidate-word";

            let indexLabel = "";
            if (idx < 9) {
              indexLabel = (idx + 1).toString();
            } else if (idx < 35) {
              indexLabel = String.fromCharCode(97 + (idx - 9));
            }

            if (indexLabel) {
              candidateElement.innerHTML = `<span class="candidate-index">${indexLabel}</span>${candidate}`;
            } else {
              candidateElement.textContent = candidate;
            }

            candidateElement.setAttribute("data-index", indexLabel);

            candidateElement.addEventListener("click", () => {
              const wordData = JSON.parse(backButton.getAttribute("data-word-data"));
              const charPosition = Number.parseInt(backButton.getAttribute("data-char-position"));

              const wordChars = getSelectedChars(wordData.start, wordData.end);
              const charIndex = wordChars.findIndex((c) => c.position === charPosition);

              if (charIndex !== -1) {
                const newWordChars = [...wordChars];
                newWordChars[charIndex] = {
                  ...newWordChars[charIndex],
                  char: candidate,
                };

                const newWord = newWordChars.map((c) => c.char).join("");
                selectCandidate(newWord);

                setTimeout(() => {
                  const updatedSelectedChars = getSelectedChars(
                    wordData.start,
                    wordData.start + Array.from(newWord).length - 1
                  );
                  const wordCandidates = getCandidatesForChars(updatedSelectedChars);
                  updateCandidatePanel(wordCandidates, true);
                }, 50);
              }
            });

            candidateList.appendChild(candidateElement);
          });

          const charCustomButton = document.createElement("span");
          charCustomButton.className = "candidate-word add-custom-button";
          charCustomButton.innerHTML = "+";
          charCustomButton.title = "自定義字符";

          charCustomButton.addEventListener("click", (e) => {
            e.stopPropagation();

            while (candidateList.firstChild) {
              candidateList.removeChild(candidateList.firstChild);
            }

            const editContainer = document.createElement("div");
            editContainer.className = "edit-container";
            editContainer.style.display = "flex";
            editContainer.style.width = "100%";
            editContainer.style.alignItems = "center";
            editContainer.style.gap = "5px";

            const editBackButton = document.createElement("span");
            editBackButton.className = "edit-back-button";
            editBackButton.innerHTML = "←";
            editBackButton.title = "返回";
            editBackButton.style.cursor = "pointer";
            editBackButton.style.padding = "0 5px";

            const hanziInput = document.createElement("span");
            hanziInput.className = "hanzi-input";
            hanziInput.contentEditable = "true";
            hanziInput.style.display = "inline-block";
            hanziInput.style.width = "30%";
            hanziInput.style.padding = "5px";
            hanziInput.style.border = "1px solid #4c8bf5";
            hanziInput.style.borderRadius = "3px";
            hanziInput.style.outline = "none";
            hanziInput.textContent = charInfo.char || "";
            hanziInput.placeholder = "漢字";

            const pinyinInput = document.createElement("span");
            pinyinInput.className = "pinyin-input";
            pinyinInput.contentEditable = "true";
            pinyinInput.style.display = "inline-block";
            pinyinInput.style.width = "50%";
            pinyinInput.style.padding = "5px";
            pinyinInput.style.border = "1px solid #4c8bf5";
            pinyinInput.style.borderRadius = "3px";
            pinyinInput.style.outline = "none";
            pinyinInput.textContent = charPinyin || "";
            pinyinInput.placeholder = "拼音";

            const confirmButton = document.createElement("span");
            confirmButton.className = "confirm-button";
            confirmButton.textContent = "確定";
            confirmButton.title = "確定變更";
            confirmButton.style.cursor = "pointer";
            confirmButton.style.padding = "5px 10px";
            confirmButton.style.backgroundColor = "#4c8bf5";
            confirmButton.style.color = "white";
            confirmButton.style.borderRadius = "3px";

            editContainer.appendChild(editBackButton);
            editContainer.appendChild(hanziInput);
            editContainer.appendChild(pinyinInput);
            editContainer.appendChild(confirmButton);
            candidateList.appendChild(editContainer);

            hanziInput.focus();
            const range = document.createRange();
            const selection = window.getSelection();
            range.selectNodeContents(hanziInput);
            range.collapse(false);
            selection.removeAllRanges();
            selection.addRange(range);

            editBackButton.addEventListener("click", (e) => {
              e.stopPropagation();
              charButton.click();
            });

            confirmButton.addEventListener("click", (e) => {
              e.stopPropagation();
              const newHanzi = hanziInput.textContent.trim();
              const newPinyin = pinyinInput.textContent.trim();

              if (newHanzi && newPinyin) {
                const inputCharsCount = Array.from(newHanzi).length;

                if (inputCharsCount === 1) {
                  const wordData = JSON.parse(backButton.getAttribute("data-word-data"));
                  const charPosition = Number.parseInt(backButton.getAttribute("data-char-position"));

                  const charMapIndex = pinyinToCharMap.findIndex((item) => item.position === charPosition);
                  if (charMapIndex !== -1) {
                    const originalWordPinyin = pinyinToCharMap[charMapIndex].wordPinyin;
                    const originalUniqueWordId = pinyinToCharMap[charMapIndex].uniqueWordId;

                    const wordChars = [];
                    for (let i = 0; i < pinyinToCharMap.length; i++) {
                      const charInfo = pinyinToCharMap[i];
                      if (
                        charInfo.isWord &&
                        charInfo.wordPinyin === originalWordPinyin &&
                        charInfo.uniqueWordId === originalUniqueWordId
                      ) {
                        wordChars.push({
                          position: charInfo.position,
                          pinyin: charInfo.pinyin,
                          char: charInfo.char,
                        });
                      }
                    }

                    wordChars.sort((a, b) => a.position - b.position);
                    const modifiedCharIndex = wordChars.findIndex((char) => char.position === charPosition);

                    if (modifiedCharIndex !== -1) {
                      wordChars[modifiedCharIndex].pinyin = newPinyin;
                      wordChars[modifiedCharIndex].char = newHanzi;

                      let newWordPinyin;
                      if (originalWordPinyin.includes("--")) {
                        newWordPinyin = wordChars.map((char) => char.pinyin).join("--");
                      } else if (originalWordPinyin.includes("-")) {
                        newWordPinyin = wordChars.map((char) => char.pinyin).join("-");
                      } else {
                        newWordPinyin = wordChars.map((char) => char.pinyin).join(" ");
                      }

                      for (let i = 0; i < pinyinToCharMap.length; i++) {
                        const charInfo = pinyinToCharMap[i];
                        if (
                          charInfo.isWord &&
                          charInfo.wordPinyin === originalWordPinyin &&
                          charInfo.uniqueWordId === originalUniqueWordId
                        ) {
                          charInfo.wordPinyin = newWordPinyin;
                          if (charInfo.position === charPosition) {
                            charInfo.pinyin = newPinyin;
                            charInfo.char = newHanzi;
                            charInfo.originalPinyin = newPinyin;
                            const lowerCasePinyin = newPinyin.toLowerCase();
                            charInfo.candidates = pinyinDict[lowerCasePinyin] || [];
                          }
                        }
                      }

                      const newWord = wordChars.map((c) => c.char).join("");
                      selectCandidate(newWord);

                      setTimeout(() => {
                        const updatedSelectedChars = getSelectedChars(
                          wordData.start,
                          wordData.start + Array.from(newWord).length - 1
                        );
                        const wordCandidates = getCandidatesForChars(updatedSelectedChars);
                        updateCandidatePanel(wordCandidates, true);
                      }, 50);
                    }
                  }
                } else {
                  setStatusMessage(`輸入的字數(${inputCharsCount})必須為1個字`);
                }
              } else {
                setStatusMessage("請輸入漢字和拼音");
              }
            });

            const handleKeyDown = (event) => {
              event.stopPropagation();
              if (event.key === "Enter") {
                event.preventDefault();
                confirmButton.click();
              } else if (event.key === "Escape") {
                event.preventDefault();
                editBackButton.click();
              }
            };

            hanziInput.addEventListener("keydown", handleKeyDown);
            pinyinInput.addEventListener("keydown", handleKeyDown);

            editContainer.addEventListener("click", (e) => {
              e.stopPropagation();
            });
          });

          candidateList.appendChild(charCustomButton);
        });

        candidateList.appendChild(charButton);
      });
    }

    addCustomButton.addEventListener("click", (event) => {
      event.stopPropagation();

      candidateElements.forEach((element) => {
        element.style.display = "none";
      });
      addCustomButton.style.display = "none";

      const charButtons = candidateList.querySelectorAll(".char-button");
      charButtons.forEach((btn) => (btn.style.display = "none"));

      const editContainer = document.createElement("div");
      editContainer.className = "edit-container";
      editContainer.style.display = "flex";
      editContainer.style.width = "100%";
      editContainer.style.alignItems = "center";
      editContainer.style.gap = "5px";

      const backButton = document.createElement("span");
      backButton.className = "edit-back-button";
      backButton.innerHTML = "←";
      backButton.title = "返回";
      backButton.style.cursor = "pointer";
      backButton.style.padding = "0 5px";

      const hanziInput = document.createElement("span");
      hanziInput.className = "hanzi-input";
      hanziInput.contentEditable = "true";
      hanziInput.style.display = "inline-block";
      hanziInput.style.width = "30%";
      hanziInput.style.padding = "5px";
      hanziInput.style.border = "1px solid #4c8bf5";
      hanziInput.style.borderRadius = "3px";
      hanziInput.style.outline = "none";
      hanziInput.textContent = selectedText || "";
      hanziInput.placeholder = "漢字";

      const pinyinInput = document.createElement("span");
      pinyinInput.className = "pinyin-input";
      pinyinInput.contentEditable = "true";
      pinyinInput.style.display = "inline-block";
      pinyinInput.style.width = "50%";
      pinyinInput.style.padding = "5px";
      pinyinInput.style.border = "1px solid #4c8bf5";
      pinyinInput.style.borderRadius = "3px";
      pinyinInput.style.outline = "none";
      pinyinInput.textContent = selectedPinyin || "";
      pinyinInput.placeholder = "拼音";

      const applyButton = document.createElement("span");
      applyButton.className = "apply-button";
      applyButton.textContent = "套用";
      applyButton.title = "套用變更";
      applyButton.style.cursor = "pointer";
      applyButton.style.padding = "5px 10px";
      applyButton.style.backgroundColor = "#4c8bf5";
      applyButton.style.color = "white";
      applyButton.style.borderRadius = "3px";

      editContainer.appendChild(backButton);
      editContainer.appendChild(hanziInput);
      editContainer.appendChild(pinyinInput);
      editContainer.appendChild(applyButton);
      candidateList.appendChild(editContainer);

      hanziInput.focus();
      const range = document.createRange();
      const selection = window.getSelection();
      range.selectNodeContents(hanziInput);
      range.collapse(false);
      selection.removeAllRanges();
      selection.addRange(range);

      backButton.addEventListener("click", (e) => {
        e.stopPropagation();
        editContainer.remove();
        candidateElements.forEach((element) => {
          element.style.display = "";
        });
        addCustomButton.style.display = "";
        const charButtons = candidateList.querySelectorAll(".char-button");
        charButtons.forEach((btn) => (btn.style.display = ""));
      });

      applyButton.addEventListener("click", (e) => {
        e.stopPropagation();
        const newHanzi = hanziInput.textContent.trim();
        const newPinyin = pinyinInput.textContent.trim();

        if (newHanzi && newPinyin) {
          const inputCharsCount = Array.from(newHanzi).length;

          if (inputCharsCount === selectedCharsCount) {
            if (newPinyin !== selectedPinyin) {
              updatePinyin(newPinyin);
            }
            selectCandidate(newHanzi);

            setTimeout(() => {
              const updatedSelectedChars = getSelectedChars(actualStart, actualEnd);
              const wordCandidates = getCandidatesForChars(updatedSelectedChars);
              updateCandidatePanel(wordCandidates, true);
            }, 50);
          } else {
            setStatusMessage(`輸入的字數(${inputCharsCount})與選取的字數(${selectedCharsCount})不符`);
          }
        } else {
          setStatusMessage("請輸入漢字和拼音");
        }
      });

      editContainer.addEventListener("click", (e) => {
        e.stopPropagation();
      });

      hanziInput.addEventListener("click", (e) => {
        e.stopPropagation();
      });

      pinyinInput.addEventListener("click", (e) => {
        e.stopPropagation();
      });

      const handleKeyDown = (event) => {
        event.stopPropagation();
        if (event.key === "Enter") {
          event.preventDefault();
          applyButton.click();
        } else if (event.key === "Escape") {
          event.preventDefault();
          backButton.click();
        }
      };

      hanziInput.addEventListener("keydown", handleKeyDown);
      pinyinInput.addEventListener("keydown", handleKeyDown);
    });

    editableSpan.addEventListener("click", (event) => {
      event.stopPropagation();
    });

    editableSpan.addEventListener("mousedown", (event) => {
      event.stopPropagation();
    });

    customCandidateElement.addEventListener("click", (event) => {
      event.stopPropagation();
      if (event.target === customCandidateElement) {
        editableSpan.focus();
        const range = document.createRange();
        const selection = window.getSelection();
        range.selectNodeContents(editableSpan);
        range.collapse(false);
        selection.removeAllRanges();
        selection.addRange(range);
      }
    });

    customCandidateElement.addEventListener("mousedown", (event) => {
      event.stopPropagation();
    });

    editableSpan.addEventListener("blur", (event) => {
      if (customCandidateElement.contains(event.relatedTarget)) {
        return;
      }

      const customText = editableSpan.textContent.trim();
      if (customText) {
        const inputCharsCount = Array.from(customText).length;

        if (inputCharsCount === selectedCharsCount) {
          selectCandidate(customText);

          setTimeout(() => {
            const updatedSelectedChars = getSelectedChars(actualStart, actualEnd);
            const wordCandidates = getCandidatesForChars(updatedSelectedChars);
            updateCandidatePanel(wordCandidates, true);
          }, 50);
        } else {
          setStatusMessage(`輸入的字數(${inputCharsCount})與選取的字數(${selectedCharsCount})不符`);
          candidateElements.forEach((element) => {
            element.style.display = "";
          });
          addCustomButton.style.display = "";
          customCandidateElement.style.display = "none";
          const charButtons = candidateList.querySelectorAll(".char-button");
          charButtons.forEach((btn) => (btn.style.display = ""));
        }
      } else {
        candidateElements.forEach((element) => {
          element.style.display = "";
        });
        addCustomButton.style.display = "";
        customCandidateElement.style.display = "none";
        const charButtons = candidateList.querySelectorAll(".char-button");
        charButtons.forEach((btn) => (btn.style.display = ""));
      }
    });

    editableSpan.addEventListener("keydown", (event) => {
      event.stopPropagation();
      if (event.key === "Enter") {
        event.preventDefault();
        editableSpan.blur();
      } else if (event.key === "Escape") {
        event.preventDefault();
        editableSpan.textContent = "";
        editableSpan.blur();
      }
    });

    editableSpan.addEventListener("input", (event) => {
      event.stopPropagation();
    });

    document.addEventListener(
      "click",
      (event) => {
        if (!customCandidateElement.contains(event.target) && !addCustomButton.contains(event.target)) {
          candidateElements.forEach((element) => {
            element.style.display = "";
          });
          addCustomButton.style.display = "";
          customCandidateElement.style.display = "none";
        }
      },
      { once: true }
    );
  }
}


// 更新拼音
function updatePinyin(newPinyin) {
  newPinyin = newPinyin.replace(/--|-/g, "");
  const { start, end } = selectedRange;
  const displayMode = displayModeSelect.value;

  const actualStart = start;
  let actualEnd = end;

  if (displayMode === "word" && currentSelectedElement) {
    let selectedText = "";
    const pinyinHintType = pinyinHintTypeSelect.value;
    const isRuby = pinyinHintType === "ruby-top" || pinyinHintType === "ruby-bottom";

    if (isRuby) {
      const rubyBase = currentSelectedElement.querySelector(".ruby-base");
      if (rubyBase) {
        selectedText = rubyBase.textContent;
      }
    } else {
      selectedText = currentSelectedElement.textContent.replace(/\s+/g, "").trim();
      const pinyinHint = currentSelectedElement.querySelector(".pinyin-hint");
      if (pinyinHint) {
        selectedText = selectedText.replace(pinyinHint.textContent, "").trim();
      }
    }

    const wordLength = Array.from(selectedText).length;
    if (wordLength > 1) {
      actualEnd = actualStart + wordLength - 1;
    }
  }

  const selectedChars = getSelectedChars(actualStart, actualEnd);
  if (selectedChars.length === 0) return;

  const tokens = pinyinUtil.normalizePinyin(newPinyin);
  const pinyinTokens = tokens.filter((token) => token.isPinyin);

  if (pinyinTokens.length === 0) {
    setStatusMessage("請輸入有效的拼音");
    return;
  }

  const pinyinCount = pinyinTokens.length;
  const hanziCount = selectedChars.length;

  if (pinyinCount !== hanziCount) {
    setStatusMessage(`拼音數量(${pinyinCount})與漢字數量(${hanziCount})不匹配`);
    return;
  }

  const firstCharInfo = selectedChars[0];
  const isPartOfWord = firstCharInfo && firstCharInfo.isWord && firstCharInfo.wordPinyin;
  const uniqueWordId = firstCharInfo ? firstCharInfo.uniqueWordId : null;

  if (isPartOfWord && selectedChars.length === 1) {
    const originalWordPinyin = firstCharInfo.wordPinyin;
    const wordChars = [];

    for (let i = 0; i < pinyinToCharMap.length; i++) {
      const charInfo = pinyinToCharMap[i];
      if (
        charInfo.isWord &&
        charInfo.wordPinyin === originalWordPinyin &&
        charInfo.uniqueWordId === uniqueWordId
      ) {
        wordChars.push({
          position: charInfo.position,
          pinyin: charInfo.pinyin,
          char: charInfo.char,
        });
      }
    }

    wordChars.sort((a, b) => a.position - b.position);
    const modifiedCharIndex = wordChars.findIndex((char) => char.position === actualStart);

    if (modifiedCharIndex !== -1) {
      wordChars[modifiedCharIndex].pinyin = pinyinTokens[0].text;

      let newWordPinyin;
      if (originalWordPinyin.includes("--")) {
        newWordPinyin = wordChars.map((char) => char.pinyin).join("--");
      } else if (originalWordPinyin.includes("-")) {
        newWordPinyin = wordChars.map((char) => char.pinyin).join("-");
      } else {
        newWordPinyin = wordChars.map((char) => char.pinyin).join(" ");
      }

      for (let i = 0; i < pinyinToCharMap.length; i++) {
        const charInfo = pinyinToCharMap[i];
        if (
          charInfo.isWord &&
          charInfo.wordPinyin === originalWordPinyin &&
          charInfo.uniqueWordId === uniqueWordId
        ) {
          charInfo.wordPinyin = newWordPinyin;
          if (charInfo.position === actualStart) {
            charInfo.pinyin = pinyinTokens[0].text;
            charInfo.originalPinyin = pinyinTokens[0].text;
            const lowerCasePinyin = pinyinTokens[0].text.toLowerCase();
            charInfo.candidates = pinyinDict[lowerCasePinyin] || [];
          }
        }
      }
    }
  } else if (isPartOfWord && selectedChars.length > 1) {
    const originalWordPinyin = firstCharInfo.wordPinyin;

    let newWordPinyin;
    if (originalWordPinyin.includes("--")) {
      newWordPinyin = pinyinTokens.map((token) => token.text).join("--");
    } else if (originalWordPinyin.includes("-")) {
      newWordPinyin = pinyinTokens.map((token) => token.text).join("-");
    } else {
      newWordPinyin = pinyinTokens.map((token) => token.text).join(" ");
    }

    for (let i = 0; i < selectedChars.length; i++) {
      const charInfo = selectedChars[i];
      const position = charInfo.position;
      const newPinyinToken = pinyinTokens[i];

      const charMapIndex = pinyinToCharMap.findIndex((item) => item.position === position);
      if (charMapIndex !== -1) {
        pinyinToCharMap[charMapIndex].pinyin = newPinyinToken.text;
        pinyinToCharMap[charMapIndex].originalPinyin = newPinyinToken.text;
        pinyinToCharMap[charMapIndex].wordPinyin = newWordPinyin;
        const lowerCasePinyin = newPinyinToken.text.toLowerCase();
        pinyinToCharMap[charMapIndex].candidates = pinyinDict[lowerCasePinyin] || [];
      }
    }

    for (let i = 0; i < pinyinToCharMap.length; i++) {
      const charInfo = pinyinToCharMap[i];
      if (
        charInfo.isWord &&
        charInfo.wordPinyin === originalWordPinyin &&
        charInfo.uniqueWordId === uniqueWordId
      ) {
        charInfo.wordPinyin = newWordPinyin;
      }
    }
  } else {
    const newUniqueWordId = `word_${Date.now()}_${Math.floor(Math.random() * 1000)}`;

    for (let i = 0; i < selectedChars.length; i++) {
      const charInfo = selectedChars[i];
      const position = charInfo.position;
      const newPinyinToken = pinyinTokens[i];

      const charMapIndex = pinyinToCharMap.findIndex((item) => item.position === position);
      if (charMapIndex !== -1) {
        pinyinToCharMap[charMapIndex].pinyin = newPinyinToken.text;
        pinyinToCharMap[charMapIndex].originalPinyin = newPinyinToken.text;
        if (selectedChars.length > 1) {
          pinyinToCharMap[charMapIndex].isWord = true;
          pinyinToCharMap[charMapIndex].wordPinyin = pinyinTokens.map((token) => token.text).join(" ");
          pinyinToCharMap[charMapIndex].uniqueWordId = newUniqueWordId;
        } else {
          pinyinToCharMap[charMapIndex].isWord = false;
          pinyinToCharMap[charMapIndex].wordPinyin = "";
          pinyinToCharMap[charMapIndex].uniqueWordId = null;
        }
        const lowerCasePinyin = newPinyinToken.text.toLowerCase();
        pinyinToCharMap[charMapIndex].candidates = pinyinDict[lowerCasePinyin] || [];
      }
    }
  }

  updateOutputDisplay();

  setTimeout(() => {
    const isRuby = pinyinHintTypeSelect.value === "ruby-top" || pinyinHintTypeSelect.value === "ruby-bottom";
    const selector = isRuby ? ".ruby-container" : ".char-hover";
    const allCharElements = Array.from(outputArea.querySelectorAll(selector));

    for (let i = 0; i < allCharElements.length; i++) {
      const element = allCharElements[i];
      const position = isRuby
        ? Number.parseInt(element.querySelector("ruby").getAttribute("data-position"))
        : Number.parseInt(element.getAttribute("data-position"));

      if (position >= actualStart && position <= actualEnd) {
        if (multiSelectMode) {
          element.classList.add("char-multiselect");
        } else {
          element.classList.add("char-selected");
        }

        if (position === actualStart && displayMode === "word") {
          currentSelectedElement = element;
          currentSelectedPosition = position;
        } else if (position === actualEnd && displayMode === "char") {
          currentSelectedElement = element;
          currentSelectedPosition = position;
        }
      }
    }

    const updatedSelectedChars = getSelectedChars(actualStart, actualEnd);
    updateCandidatePanel(getCandidatesForChars(updatedSelectedChars), true);
    setStatusMessage("拼音已更新");
  }, 10);
}
// 選擇候選字
function selectCandidate(candidate) {
  const { start, end } = selectedRange;
  const chars = Array.from(outputText);
  const displayMode = displayModeSelect.value;
  
  // 計算實際的選取範圍
  const actualStart = start;
  let actualEnd = end;
  
  // 在詞模式下，需要確保選取範圍包含整個詞
  if (displayMode === "word") {
    // 檢查是否選中了一個詞
    const selectedElement = currentSelectedElement;
    if (selectedElement) {
      // 獲取選中元素的文本內容（去除拼音提示）
      let selectedText = "";
      const pinyinHintType = pinyinHintTypeSelect.value;
      const isRuby = pinyinHintType === "ruby-top" || pinyinHintType === "ruby-bottom";

      if (isRuby) {
        const rubyBase = selectedElement.querySelector(".ruby-base");
        if (rubyBase) {
          selectedText = rubyBase.textContent;
        }
      } else {
        selectedText = selectedElement.textContent.replace(/\s+/g, "").trim();
        const pinyinHint = selectedElement.querySelector(".pinyin-hint");
        if (pinyinHint) {
          selectedText = selectedText.replace(pinyinHint.textContent, "").trim();
        }
      }

      // 計算詞的長度
      const wordLength = Array.from(selectedText).length;
      if (wordLength > 1) {
        actualEnd = actualStart + wordLength - 1;
      }
    }
  }
  
  // 更新輸出文字
  const beforeChars = chars.slice(0, actualStart);
  const afterChars = chars.slice(actualEnd + 1);
  const candidateChars = Array.from(candidate);
  const newChars = [...beforeChars, ...candidateChars, ...afterChars];
  outputText = newChars.join("");
  
  // 更新拼音對應表
  const newMap = [...pinyinToCharMap];
  
  // 檢查被替換的字符是否是某個詞的一部分
  const firstCharInfo = pinyinToCharMap.find((item) => item.position === actualStart);
  const isPartOfWord = firstCharInfo && firstCharInfo.isWord && firstCharInfo.wordPinyin;
  
  // 如果是詞的一部分，找出該詞的所有字符
  const wordChars = [];
  let wordStartPos = -1;
  let wordEndPos = -1;
  let uniqueWordId = null; // 保存詞的唯一ID
  
  if (isPartOfWord) {
    const wordPinyin = firstCharInfo.wordPinyin;
    uniqueWordId = firstCharInfo.uniqueWordId; // 獲取詞的唯一ID
    
    // 找出該詞的所有字符
    for (let i = 0; i < pinyinToCharMap.length; i++) {
      const charInfo = pinyinToCharMap[i];
      if (charInfo.isWord && charInfo.wordPinyin === wordPinyin && charInfo.uniqueWordId === uniqueWordId) {
        wordChars.push(charInfo);
        
        if (wordStartPos === -1 || charInfo.position < wordStartPos) {
          wordStartPos = charInfo.position;
        }
        
        if (charInfo.position > wordEndPos) {
          wordEndPos = charInfo.position;
        }
      }
    }
  }
  
  // 移除被替換的字符
  const filteredMap = newMap.filter((item) => item.position < actualStart || item.position > actualEnd);
  
  // 獲取被替換區域的拼音信息
  const replacedPinyins = [];
  for (let i = actualStart; i <= actualEnd; i++) {
    const charInfo = pinyinToCharMap.find((item) => item.position === i);
    if (charInfo && charInfo.pinyin) {
      replacedPinyins.push(charInfo.pinyin);
    }
  }
  
  // 獲取被替換區域的詞拼音（如果有）
  let wordPinyin = "";
  if (firstCharInfo && firstCharInfo.wordPinyin) {
    wordPinyin = firstCharInfo.wordPinyin;
  } else if (replacedPinyins.length > 0) {
    wordPinyin = replacedPinyins.join(" ");
  }
  
  // 生成新的唯一詞ID
  const newUniqueWordId = `word_${Date.now()}_${Math.floor(Math.random() * 1000)}`;
  
  // 添加新的字符
  if (isPartOfWord && displayMode === "char" && candidateChars.length === 1) {
    // 在字模式下替換詞中的一個字符，保持詞的完整性
    filteredMap.push({
      char: candidateChars[0],
      pinyin: replacedPinyins.length > 0 ? replacedPinyins[0] : "",
      position: actualStart,
      isWord: true,
      wordPinyin: wordPinyin,
      uniqueWordId: uniqueWordId, // 使用原詞的唯一ID
      isConverted: true,
      isNewline: false,
    });
  } else if (displayMode === "word" && candidateChars.length > 1) {
    // 在詞模式下，將多字符候選詞作為一個詞處理
    for (let i = 0; i < candidateChars.length; i++) {
      filteredMap.push({
        char: candidateChars[i],
        pinyin: i < replacedPinyins.length ? replacedPinyins[i] : replacedPinyins[replacedPinyins.length - 1] || "",
        position: actualStart + i,
        isWord: true,
        wordPinyin: wordPinyin,
        uniqueWordId: newUniqueWordId, // 使用新生成的唯一ID
        isConverted: true,
        isNewline: false,
      });
    }
  } else {
    // 在字模式下，或者候選詞只有一個字符時
    for (let i = 0; i < candidateChars.length; i++) {
      filteredMap.push({
        char: candidateChars[i],
        pinyin: i < replacedPinyins.length ? replacedPinyins[i] : replacedPinyins[replacedPinyins.length - 1] || "",
        position: actualStart + i,
        isWord: candidateChars.length > 1,
        wordPinyin: candidateChars.length > 1 ? wordPinyin : "",
        uniqueWordId: candidateChars.length > 1 ? newUniqueWordId : null, // 只有多字符候選詞才設置唯一ID
        isConverted: true,
        isNewline: false,
      });
    }
  }
  
  // 更新後續字符的位置
  const positionDiff = candidateChars.length - (actualEnd - actualStart + 1);
  
  // 如果替換的是詞中的一個字符，更新該詞中其他字符的位置和關聯
  if (isPartOfWord && displayMode === "char" && candidateChars.length === 1) {
    for (let i = 0; i < filteredMap.length; i++) {
      const item = filteredMap[i];
      
      // 更新位置
      if (item.position > actualEnd) {
        item.position += positionDiff;
      }
      
      // 更新詞關聯
      if (wordChars.length > 0 && item.isWord && item.wordPinyin === wordPinyin && item.uniqueWordId === uniqueWordId) {
        // 保持詞關聯不變
        item.isWord = true;
        item.wordPinyin = wordPinyin;
        item.uniqueWordId = uniqueWordId;
      }
    }
  } else {
    // 一般情況下的位置更新
    for (let i = 0; i < filteredMap.length; i++) {
      if (filteredMap[i].position > actualEnd) {
        filteredMap[i].position += positionDiff;
      }
    }
  }
  
  // 按照 position 屬性對 filteredMap 進行排序
  filteredMap.sort((a, b) => a.position - b.position);
  
  pinyinToCharMap = filteredMap;
  updateOutputDisplay();
  
  // 保存當前選取範圍
  const currentRange = { start: actualStart, end: actualStart + candidateChars.length - 1 };
  selectedRange = currentRange;

  // 重新選中該範圍
  setTimeout(() => {
    const isRuby = pinyinHintTypeSelect.value === "ruby-top" || pinyinHintTypeSelect.value === "ruby-bottom"
    const selector = isRuby ? ".ruby-container" : ".char-hover"
    const allCharElements = Array.from(outputArea.querySelectorAll(selector))

    // 選中範圍內的所有元素
    for (let i = 0; i < allCharElements.length; i++) {
      const element = allCharElements[i]
      const position = isRuby
        ? Number.parseInt(element.querySelector("ruby").getAttribute("data-position"))
        : Number.parseInt(element.getAttribute("data-position"))

      if (position >= currentRange.start && position <= currentRange.end) {
        if (multiSelectMode) {
          element.classList.add("char-multiselect")
        } else {
          element.classList.add("char-selected")
        }

        // 更新當前選中元素
        if (position === currentRange.start && displayMode === "word") {
          currentSelectedElement = element
          currentSelectedPosition = position
        } else if (position === currentRange.end && displayMode === "char") {
          currentSelectedElement = element
          currentSelectedPosition = position
        }
      }
    }

    // 獲取選取範圍內的所有字符及其拼音
    const selectedChars = getSelectedChars(currentRange.start, currentRange.end)

    // 更新候選面板
    updateCandidatePanel(getCandidatesForChars(selectedChars))
  }, 10)
}

// 添加新詞彙
function addNewWord() {
  if (newWordPinyin.value.trim() === "" || newWordHanzi.value.trim() === "") {
    setStatusMessage("請輸入完整的拼音和漢字")
    return
  }

  // 標準化拼音為數字標調格式，轉換為小寫用於存儲
  const tokens = pinyinUtil.normalizePinyin(newWordPinyin.value)

  // 提取所有拼音標記
  const pinyinTokens = tokens.filter((token) => token.isPinyin)

  if (pinyinTokens.length === 0) {
    // 不再顯示格式提示，使用更簡單的提示
    setStatusMessage("請輸入有效的拼音")
    return
  }

  // 使用小寫版本的拼音進行存儲
  const normalizedPinyin = pinyinTokens.map((token) => token.lowerCaseText).join(" ")

  // 檢查拼音數量是否與漢字數量匹配
  const pinyinCount = pinyinTokens.length
  const hanziCount = Array.from(newWordHanzi.value).length
  if (pinyinCount !== hanziCount) {
    setStatusMessage(`拼音數量(${pinyinCount})與漢字數量(${hanziCount})不匹配`)
    return
  }

  // 將詞彙添加到用戶詞庫
  userDict[normalizedPinyin] = newWordHanzi.value

  // 清空輸入框
  newWordPinyin.value = ""
  newWordHanzi.value = ""

  // 保存到本地存儲
  localStorage.setItem("pinyinConverterUserDict", JSON.stringify(userDict))

  // 更新詞庫列表
  renderDictionaryList()

  // 顯示閃示提示
  setStatusMessage("詞彙添加成功")
}

// 刪除詞彙
function deleteWord(pinyin) {
  delete userDict[pinyin]

  // 保存到本地存儲
  localStorage.setItem("pinyinConverterUserDict", JSON.stringify(userDict))

  // 更新詞庫列表
  renderDictionaryList()

  // 顯示閃示提示
  setStatusMessage("詞彙刪除成功")
}

// 渲染詞庫列表
function renderDictionaryList() {
  dictionaryList.innerHTML = ""

  for (const [pinyin, hanzi] of Object.entries(userDict)) {
    const item = document.createElement("div")
    item.className = "dictionary-item"

    const text = document.createElement("span")
    text.textContent = `${pinyin} => ${hanzi}`

    const actions = document.createElement("div")
    actions.className = "dictionary-actions"

    const deleteBtn = document.createElement("button")

    deleteBtn.className = "dictionary-action delete-word"
    deleteBtn.textContent = "刪除"
    deleteBtn.addEventListener("click", () => deleteWord(pinyin))

    actions.appendChild(deleteBtn)
    item.appendChild(text)
    item.appendChild(actions)
    dictionaryList.appendChild(item)
  }
}

// 切換詞庫面板顯示
function toggleDictionary() {
  const isVisible = dictionaryPanel.style.display !== "none"
  dictionaryPanel.style.display = isVisible ? "none" : "block"
  toggleDictionaryBtn.textContent = isVisible ? "管理自定義詞庫" : "隱藏自定義詞庫"
}

// 清空輸入
function clearInput() {
  inputText.value = ""
}

// 清空輸出
function clearOutput() {
  outputText = ""
  outputArea.innerHTML = ""
  pinyinToCharMap = []
  updateCandidatePanel([])
  clearAllSelectedElements()
  currentSelectedPosition = -1
  multiSelectStartPosition = -1
  multiSelectMode = false
}

// 複製結果
function copyOutput() {
  if (outputText.trim() === "") {
    return
  }

  navigator.clipboard
    .writeText(outputText)
    .then(() => {
      // 顯示閃示提示
      setStatusMessage("已複製到剪貼簿")
    })
    .catch(() => {
      setStatusMessage("複製失敗，請手動選取並複製")
    })
}

// 複製 Ruby 富文本輸出
function copyRubyOutput() {
  if (outputText.trim() === "") {
    setStatusMessage("沒有內容可複製")
    return
  }

  // 生成包含 ruby 標記的完整 HTML
  const rubyHtml = generateRubyHtmlForCopy(pinyinToCharMap, outputText, displayModeSelect, convertPinyinForDisplay)
  
  if (!rubyHtml) {
    setStatusMessage("無法生成標音格式")
    return
  }

  // 嘗試複製富文本格式
  copyRichText(rubyHtml)
}

function generateRubyHtmlForCopy(pinyinToCharMap, outputText, displayModeSelect, convertPinyinForDisplay) {
  if (!pinyinToCharMap || pinyinToCharMap.length === 0) {
    return null;
  }

  let html = `<!DOCTYPE html>
<html>
<head>
<meta charset="UTF-8">
<style>
ruby {
  ruby-align: center;
  font-family: 台灣楷體, 台灣黑體;
}
rt {
  font-size: 0.7em;
  font-family: 台灣楷體, 台灣黑體;
}
.ruby-container {
  display: inline-block;
}
</style>
</head>
<body>`;

  const chars = Array.from(outputText);
  const displayMode = displayModeSelect.value;

  if (displayMode === "word") {
    const mergedCharMap = [];
    let i = 0;

    while (i < pinyinToCharMap.length) {
      const currentChar = pinyinToCharMap[i];

      if (currentChar.isConverted && currentChar.isWord && currentChar.wordPinyin) {
        const wordChars = [currentChar];
        let nextIndex = i + 1;

        while (nextIndex < pinyinToCharMap.length) {
          const nextChar = pinyinToCharMap[nextIndex];
          if (
            nextChar.isConverted &&
            nextChar.isWord &&
            nextChar.wordPinyin &&
            currentChar.wordPinyin &&
            nextChar.wordPinyin === currentChar.wordPinyin &&
            nextChar.uniqueWordId === currentChar.uniqueWordId
          ) {
            wordChars.push(nextChar);
            nextIndex++;
          } else {
            break;
          }
        }

        if (wordChars.length > 1) {
          const mergedChar = {
            char: wordChars.map((c) => c.char).join(""),
            pinyin: currentChar.wordPinyin, // 使用完整的 wordPinyin
            wordPinyin: currentChar.wordPinyin,
            uniqueWordId: currentChar.uniqueWordId,
            candidates: [],
            isWord: true,
            position: currentChar.position,
            isConverted: true,
            isNewline: false,
            originalChars: wordChars,
          };

          mergedCharMap.push(mergedChar);
          i = nextIndex;
        } else {
          mergedCharMap.push(currentChar);
          i++;
        }
      } else {
        mergedCharMap.push(currentChar);
        i++;
      }
    }

    for (let i = 0; i < mergedCharMap.length; i++) {
      const charInfo = mergedCharMap[i];

      if (charInfo.isNewline) {
        html += "<br>";
      } else if (charInfo.isConverted) {
        const convertedPinyin = convertPinyinForDisplay(charInfo.pinyin); // 使用 wordPinyin
        html += `<ruby>${charInfo.char}<rt>${convertedPinyin}</rt></ruby>`;
        
        if (i < mergedCharMap.length - 1) {
          const nextChar = mergedCharMap[i + 1];
          if (nextChar && nextChar.isConverted && !nextChar.isNewline) {
            html += '\u00A0';
          }
        }
      } else {
        html += charInfo.char;
      }
    }
  } else {
    for (let i = 0; i < chars.length; i++) {
      const char = chars[i];
      const charInfo = pinyinToCharMap.find((item) => item.position === i);

      if (charInfo) {
        if (charInfo.isNewline) {
          html += "<br>";
        } else if (charInfo.isConverted) {
          const convertedPinyin = convertPinyinForDisplay(charInfo.pinyin); // 使用單字符拼音
          html += `<ruby>${char}<rt>${convertedPinyin}</rt></ruby>`;
          
          if (i < chars.length - 1) {
            const nextCharInfo = pinyinToCharMap.find((item) => item.position === i + 1);
            if (nextCharInfo && nextCharInfo.isConverted && !nextCharInfo.isNewline) {
              html += '\u00A0';
            }
          }
        } else {
          html += char;
        }
      } else {
        html += char;
      }
    }
  }

  html += `</body></html>`;
  return html;
}


// 複製富文本格式
async function copyRichText(htmlContent) {
  try {
    // 檢查瀏覽器是否支援 ClipboardItem
    if (typeof ClipboardItem !== 'undefined') {
      // 創建純文字版本作為備用
      const plainText = outputText
      
      // 創建 ClipboardItem，包含 HTML 和純文字格式
      const clipboardItem = new ClipboardItem({
        'text/html': new Blob([htmlContent], { type: 'text/html' }),
        'text/plain': new Blob([plainText], { type: 'text/plain' })
      })

      await navigator.clipboard.write([clipboardItem])
      setStatusMessage("已複製帶標音的富文本到剪貼簿")
    } else {
      // 降級處理：只複製純文字
      await navigator.clipboard.writeText(outputText)
      setStatusMessage("瀏覽器不支援富文本複製，已複製純文字")
    }
  } catch (error) {
    console.error('複製失敗:', error)
    
    // 嘗試使用舊的方法
    try {
      // 創建一個臨時的 div 元素
      const tempDiv = document.createElement('div')
      tempDiv.innerHTML = htmlContent
      tempDiv.style.position = 'absolute'
      tempDiv.style.left = '-9999px'
      document.body.appendChild(tempDiv)

      // 選擇內容
      const range = document.createRange()
      range.selectNodeContents(tempDiv)
      const selection = window.getSelection()
      selection.removeAllRanges()
      selection.addRange(range)

      // 執行複製命令
      const successful = document.execCommand('copy')
      
      // 清理
      selection.removeAllRanges()
      document.body.removeChild(tempDiv)

      if (successful) {
        setStatusMessage("已複製帶標音的富文本")
      } else {
        throw new Error('execCommand failed')
      }
    } catch (fallbackError) {
      console.error('降級複製也失敗:', fallbackError)
      setStatusMessage("複製失敗，請手動選取並複製")
    }
  }
}


// 設置狀態消息
function setStatusMessage(message, duration = 2000) {
  if (!message) {
    return
  }

  // 獲取浮動提示元素
  const floatingNotification = document.getElementById("floatingNotification")

  // 設置消息內容
  floatingNotification.textContent = message

  // 顯示提示
  floatingNotification.classList.add("show")

  // 設置定時器，自動隱藏提示
  setTimeout(() => {
    floatingNotification.classList.remove("show")
  }, duration)
}

// 頁面加載完成後初始化
document.addEventListener("DOMContentLoaded", init)
