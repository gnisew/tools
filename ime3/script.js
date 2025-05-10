document.addEventListener("DOMContentLoaded", () => {
  // 元素參考
  const editor = document.getElementById("editor")
  const saveBtn = document.getElementById("saveBtn")
  const copyBtn = document.getElementById("copyBtn")
  const clearBtn = document.getElementById("clearBtn")
  const undoBtn = document.getElementById("undoBtn")
  const redoBtn = document.getElementById("redoBtn")
  const searchBtn = document.getElementById("searchBtn")
  const wrapBtn = document.getElementById("wrapBtn")
  const fontSizeBtn = document.getElementById("fontSizeBtn")
  const fontSizeMenu = document.getElementById("fontSizeMenu")
  const fontSizeOptions = fontSizeMenu.querySelectorAll(".dropdown-item")
  const moreBtn = document.getElementById("moreBtn")
  const moreMenu = document.getElementById("moreMenu")
  const searchDialog = document.getElementById("searchDialog")
  const dialogHeader = document.querySelector(".dialog-header")
  const dialogTitle = document.getElementById("dialogTitle")
  const closeSearchDialog = document.getElementById("closeSearchDialog")
  const searchInput = document.getElementById("searchInput")
  const replaceInput = document.getElementById("replaceInput")
  const prevMatchBtn = document.getElementById("prevMatchBtn")
  const nextMatchBtn = document.getElementById("nextMatchBtn")
  const regexToggleBtn = document.getElementById("regexToggleBtn")
  const replaceBtn = document.getElementById("replaceBtn")
  const replaceAllBtn = document.getElementById("replaceAllBtn")
  const toast = document.getElementById("toast")
  const widthToggleBtn = document.getElementById('widthToggleBtn');

	// 工具按鈕參考，用於響應式處理
	const toolButtons = {
	  save: { element: saveBtn, priority: "always-show", icon: "save" },
	  copy: { element: copyBtn, priority: "always-show", icon: "content_copy" },
	  clear: { element: clearBtn, priority: "always-show", icon: "delete" },
	  undo: { element: undoBtn, priority: "always-show", icon: "undo" },
	  redo: { element: redoBtn, priority: "medium", icon: "redo" },
	  fontSize: { element: fontSizeBtn, priority: "medium", icon: "format_size" },
	  search: { element: searchBtn, priority: "medium", icon: "search" },
	  wrap: { element: wrapBtn, priority: "medium", icon: "wrap_text" },
	  widthToggle: { element: widthToggleBtn, priority: "medium", icon: "aspect_ratio" }
	};




  // 狀態變數
  let history = [""]
  let historyIndex = 0
  let isWordWrapEnabled = true
  let currentFontSize = "fit"
  let isRegexEnabled = false
  let currentMatches = []
  let currentMatchIndex = -1

  // 搜尋對話框拖曳相關變數
  let isDragging = false
  let dragOffsetX = 0
  let dragOffsetY = 0

  // 初始化
  initEditor()
  setupEventListeners()
  setupResponsiveToolbar()
  setupDraggableDialog()

  // 初始化編輯器
  function initEditor() {
    const savedText = localStorage.getItem("editorText")
    if (savedText) {
      editor.value = savedText
      history = [savedText]
    }

    // 載入儲存的字體大小
    const savedFontSize = localStorage.getItem("editorFontSize")
    if (savedFontSize) {
      setFontSize(savedFontSize)
    }

    updateButtonStates()
  }

  // 設定事件監聽器
  function setupEventListeners() {
    // 編輯器變更事件
    editor.addEventListener("input", handleTextChange)

    // 工具列按鈕事件
    saveBtn.addEventListener("click", handleSave)
    copyBtn.addEventListener("click", handleCopy)
    clearBtn.addEventListener("click", handleClear)
    undoBtn.addEventListener("click", handleUndo)
    redoBtn.addEventListener("click", handleRedo)
    searchBtn.addEventListener("click", toggleSearchDialog)
    wrapBtn.addEventListener("click", toggleWordWrap)

    // 字體大小選單
    fontSizeBtn.addEventListener("click", (e) => {
      e.stopPropagation()
      fontSizeMenu.classList.toggle("show")
    })

    // 字體大小選項
    fontSizeOptions.forEach((option) => {
      option.addEventListener("click", () => {
        const size = option.dataset.size
        setFontSize(size)
        fontSizeMenu.classList.remove("show")
      })
    })

    // 更多選項選單
    moreBtn.addEventListener("click", (e) => {
      e.stopPropagation()
      updateMoreMenu()
      moreMenu.classList.toggle("show")
    })

    // 點擊其他地方關閉下拉選單
    document.addEventListener("click", (e) => {
      // 如果點擊的不是搜尋對話框內的元素，則關閉下拉選單
      if (!searchDialog.contains(e.target) || e.target === closeSearchDialog) {
        fontSizeMenu.classList.remove("show")
        moreMenu.classList.remove("show")
      }
    })

    // 搜尋對話框事件
    closeSearchDialog.addEventListener("click", hideSearchDialog)
    searchInput.addEventListener("input", handleSearch)
    searchInput.addEventListener("focus", () => {
      // 確保焦點在搜尋輸入框
      setTimeout(() => searchInput.focus(), 0)
    })
    prevMatchBtn.addEventListener("click", () => {
      findMatch("prev")
      editor.focus() // Focus the editor after navigation
    })
    nextMatchBtn.addEventListener("click", () => {
      findMatch("next")
      editor.focus() // Focus the editor after navigation
    })
    regexToggleBtn.addEventListener("click", toggleRegex)
    replaceBtn.addEventListener("click", () => {
      handleReplace()
      editor.focus() // Focus the editor after replace
    })
    replaceAllBtn.addEventListener("click", () => {
      handleReplaceAll()
      editor.focus() // Focus the editor after replace all
    })

    // 防止搜尋對話框內的點擊事件導致焦點丟失
    searchDialog.addEventListener("mousedown", (e) => {
      if (e.target !== searchInput && e.target !== replaceInput) {
        e.preventDefault()
      }
    })

    // 鍵盤快捷鍵
    document.addEventListener("keydown", (e) => {
      if (e.ctrlKey) {
        switch (e.key.toLowerCase()) {
          case "s":
            e.preventDefault()
            handleSave()
            break
          case "z":
            e.preventDefault()
            handleUndo()
            break
          case "y":
            e.preventDefault()
            handleRedo()
            break
          case "f":
            e.preventDefault()
            toggleSearchDialog()
            break
        }
      } else if (e.key === "Escape") {
        hideSearchDialog()
        fontSizeMenu.classList.remove("show")
        moreMenu.classList.remove("show")
      } else if (e.key === "Enter" && searchDialog.style.display === "block") {
        e.preventDefault()
        findMatch("next")
      }
    })

    // 監聽視窗大小變化
    window.addEventListener("resize", setupResponsiveToolbar)
  }



// 獲取容器元素
const container = document.querySelector('.container');

// 初始化頁面寬度設置
function initPageWidth() {
  // 從本地存儲中獲取寬度設置，如果沒有則默認為 compact-width
  const savedWidth = localStorage.getItem('pageWidth') || 'compact-width';
  
  // 應用寬度設置
  if (savedWidth === 'full-width') {
    container.classList.remove('compact-width');
    container.classList.add('full-width');
    widthToggleBtn.classList.add('active');
  } else {
    container.classList.add('compact-width');
    container.classList.remove('full-width');
    widthToggleBtn.classList.remove('active');
  }
}

// 切換頁面寬度
function togglePageWidth() {
  if (container.classList.contains('compact-width')) {
    // 切換到最大寬度
    container.classList.remove('compact-width');
    container.classList.add('full-width');
    widthToggleBtn.classList.add('active');
    localStorage.setItem('pageWidth', 'full-width');
  } else {
    // 切換到較小寬度
    container.classList.add('compact-width');
    container.classList.remove('full-width');
    widthToggleBtn.classList.remove('active');
    localStorage.setItem('pageWidth', 'compact-width');
  }
}

// 添加寬度切換按鈕事件監聽器
widthToggleBtn.addEventListener('click', togglePageWidth);

// 在頁面加載時初始化寬度設置
document.addEventListener('DOMContentLoaded', function() {
  initPageWidth();
});



  // 設定搜尋對話框拖曳功能
  function setupDraggableDialog() {
    dialogHeader.addEventListener("mousedown", startDrag)
    document.addEventListener("mousemove", drag)
    document.addEventListener("mouseup", stopDrag)

    // 觸控支援
    dialogHeader.addEventListener("touchstart", startDragTouch)
    document.addEventListener("touchmove", dragTouch)
    document.addEventListener("touchend", stopDrag)
  }

  // 開始拖曳
  function startDrag(e) {
    if (e.target === closeSearchDialog) return
    isDragging = true
    const rect = searchDialog.getBoundingClientRect()
    dragOffsetX = e.clientX - rect.left
    dragOffsetY = e.clientY - rect.top
    searchDialog.style.cursor = "grabbing"
  }

  // 開始觸控拖曳
  function startDragTouch(e) {
    if (e.touches.length === 1) {
      isDragging = true
      const touch = e.touches[0]
      const rect = searchDialog.getBoundingClientRect()
      dragOffsetX = touch.clientX - rect.left
      dragOffsetY = touch.clientY - rect.top
    }
  }

  // 拖曳
  function drag(e) {
    if (!isDragging) return
    e.preventDefault()

    const x = e.clientX - dragOffsetX
    const y = e.clientY - dragOffsetY

    // 確保對話框��會被拖出視窗
    const maxX = window.innerWidth - searchDialog.offsetWidth
    const maxY = window.innerHeight - searchDialog.offsetHeight

    searchDialog.style.left = `${Math.max(0, Math.min(x, maxX))}px`
    searchDialog.style.top = `${Math.max(0, Math.min(y, maxY))}px`
    searchDialog.style.right = "auto"
  }

  // 觸控拖曳
  function dragTouch(e) {
    if (!isDragging || e.touches.length !== 1) return
    e.preventDefault()

    const touch = e.touches[0]
    const x = touch.clientX - dragOffsetX
    const y = touch.clientY - dragOffsetY

    // 確保對話框不會被拖出視窗
    const maxX = window.innerWidth - searchDialog.offsetWidth
    const maxY = window.innerHeight - searchDialog.offsetHeight

    searchDialog.style.left = `${Math.max(0, Math.min(x, maxX))}px`
    searchDialog.style.top = `${Math.max(0, Math.min(y, maxY))}px`
    searchDialog.style.right = "auto"
  }

  // 停止拖曳
  function stopDrag() {
    isDragging = false
    searchDialog.style.cursor = "move"
  }

  // 設定響應式工具列
  function setupResponsiveToolbar() {
    updateMoreMenu()
  }

	// 更新更多選單內容
	function updateMoreMenu() {
	  moreMenu.innerHTML = "";

	  for (const key in toolButtons) {
		const button = toolButtons[key];
		if (window.getComputedStyle(button.element).display === "none") {
		  const menuItem = document.createElement("div");
		  menuItem.className = "dropdown-item";
		  
		  // 複製圖示
		  const iconSpan = document.createElement("span");
		  iconSpan.className = "material-icons";
		  iconSpan.textContent = button.icon; // 需要為每個按鈕添加icon屬性
		  
		  menuItem.appendChild(iconSpan);
		  menuItem.appendChild(document.createTextNode(" " + button.element.title));

		  menuItem.addEventListener("click", () => {
			button.element.click();
			moreMenu.classList.remove("show");
		  });

		  moreMenu.appendChild(menuItem);
		}
	  }

	  moreBtn.style.display = moreMenu.children.length === 0 ? "none" : "flex";
	}




  // 處理文字變更
  function handleTextChange() {
    if (editor.value !== history[historyIndex]) {
      history = history.slice(0, historyIndex + 1)
      history.push(editor.value)
      historyIndex = history.length - 1
      updateButtonStates()
    }
  }

  // 處理儲存
  function handleSave() {
    localStorage.setItem("editorText", editor.value)
    showToast("已儲存")
  }

  // 處理複製
  function handleCopy() {
    editor.select()
    document.execCommand("copy")
    showToast("已複製到剪貼簿")
  }

  // 處理清除
  function handleClear() {
    editor.value = ""
    history = [""]
    historyIndex = 0
    localStorage.removeItem("editorText")
    updateButtonStates()
    showToast("已清除")
  }

  // 處理還原
  function handleUndo() {
    if (historyIndex > 0) {
      historyIndex--
      editor.value = history[historyIndex]
      updateButtonStates()
    }
  }

  // 處理重做
  function handleRedo() {
    if (historyIndex < history.length - 1) {
      historyIndex++
      editor.value = history[historyIndex]
      updateButtonStates()
    }
  }

  // 切換搜尋對話框
  function toggleSearchDialog() {
    if (searchDialog.style.display === "block") {
      hideSearchDialog()
    } else {
      showSearchDialog()
    }
  }

  // 顯示搜尋對話框
  function showSearchDialog() {
    // 如果對話框還沒有定位，則設定初始位置
    if (!searchDialog.style.left) {
      searchDialog.style.left = "auto"
      searchDialog.style.top = "60px"
      searchDialog.style.right = "20px"
    }

    searchDialog.style.display = "block"
    searchInput.focus()
    handleSearch()
  }

  // 隱藏搜尋對話框
  function hideSearchDialog() {
    searchDialog.style.display = "none"
    clearSearch()
  }

  // 清除搜尋
  function clearSearch() {
    currentMatches = []
    currentMatchIndex = -1
    updateDialogTitle("尋找與取代")
  }

  // 切換正則表達式
  function toggleRegex() {
    isRegexEnabled = !isRegexEnabled
    regexToggleBtn.classList.toggle("active")
    handleSearch()
  }

  // 更新對話框標題
  function updateDialogTitle(text) {
    dialogTitle.textContent = text
  }

  // 處理搜尋
  function handleSearch() {
    const query = searchInput.value
    if (!query) {
      clearSearch()
      return
    }

    try {
      const content = editor.value
      const searchRegex = isRegexEnabled ? new RegExp(query, "g") : new RegExp(escapeRegExp(query), "g")
      currentMatches = Array.from(content.matchAll(searchRegex))
      currentMatchIndex = -1

      // 更新對話框標題顯示符合數量
      updateDialogTitle(`尋找與取代 (符合${currentMatches.length}個)`)

      if (currentMatches.length > 0) {
        findMatch("next")
      }
    } catch (error) {
      updateDialogTitle("尋找與取代 (正則無效)")
      currentMatches = []
      currentMatchIndex = -1
    }
  }

  // 尋找匹配
  function findMatch(direction) {
    if (currentMatches.length === 0) return

    if (direction === "next") {
      currentMatchIndex = (currentMatchIndex + 1) % currentMatches.length
    } else {
      currentMatchIndex = currentMatchIndex <= 0 ? currentMatches.length - 1 : currentMatchIndex - 1
    }

    const match = currentMatches[currentMatchIndex]
    editor.setSelectionRange(match.index, match.index + match[0].length)
    // No longer refocus to search input - let the caller decide where focus should be
  }

  // 處理取代
  function handleReplace() {
    if (currentMatches.length === 0 || currentMatchIndex === -1) return

    const match = currentMatches[currentMatchIndex]
    const replacement = replaceInput.value
    const content = editor.value
    const newContent =
      content.substring(0, match.index) + replacement + content.substring(match.index + match[0].length)

    editor.value = newContent
    handleTextChange()
    handleSearch()
  }

  // 處理全部取代
  function handleReplaceAll() {
    const query = searchInput.value
    if (!query) return

    try {
      const content = editor.value
      const searchRegex = isRegexEnabled ? new RegExp(query, "g") : new RegExp(escapeRegExp(query), "g")
      const replacement = replaceInput.value
      const newContent = content.replace(searchRegex, replacement)
      const count = (content.match(searchRegex) || []).length

      if (count > 0) {
        editor.value = newContent
        handleTextChange()
        handleSearch()
        showToast(`已取代 ${count} 處「${query}」為「${replacement}」`)
      }
    } catch (error) {
      updateDialogTitle("尋找與取代 (正則無效)")
    }
  }

  // 切換換行
  function toggleWordWrap() {
    isWordWrapEnabled = !isWordWrapEnabled
    if (isWordWrapEnabled) {
      editor.classList.remove("nowrap")
      wrapBtn.classList.remove("active")
    } else {
      editor.classList.add("nowrap")
      wrapBtn.classList.add("active")
    }
    showToast(isWordWrapEnabled ? "已啟用換行" : "已停用換行")
  }

  // 設定字體大小
  function setFontSize(size) {
    editor.classList.remove(
      "font-thin",
      "font-small",
      "font-fit",
      "font-medium",
      "font-large",
      "font-huge",
      "font-giant",
      "font-extreme",
      "font-massive",
    )
    editor.classList.add(`font-${size}`)

    fontSizeOptions.forEach((option) => {
      if (option.dataset.size === size) {
        option.classList.add("active")
      } else {
        option.classList.remove("active")
      }
    })

    localStorage.setItem("editorFontSize", size)
    currentFontSize = size

    // 顯示對應的中文名稱
    const sizeNames = {
      thin: "細",
      small: "小",
      fit: "適",
      medium: "中",
      large: "大",
      huge: "巨",
      giant: "洪",
      extreme: "極",
      massive: "狂",
    }

    //showToast(`已設定字體大小為${sizeNames[size]}`)
  }

  // 更新按鈕狀態
  function updateButtonStates() {
    undoBtn.disabled = historyIndex <= 0
    redoBtn.disabled = historyIndex >= history.length - 1
  }

  // 顯示提示訊息
  function showToast(message, isError = false) {
    toast.textContent = message
    toast.className = "toast show"
    toast.style.backgroundColor = isError ? "#d93025" : "#323232"

    setTimeout(() => {
      toast.className = "toast"
    }, 2000)
  }

  // 轉義正則表達式特殊字符
  function escapeRegExp(string) {
    return string.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")
  }
})


document.addEventListener("DOMContentLoaded", () => {
  // Disable pull-to-refresh on mobile
  if (/Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent)) {
    document.body.style.overscrollBehavior = "none"
    document.addEventListener(
      "touchmove",
      (e) => {
        // Only prevent pull-to-refresh when at the top of the page AND the user is pulling down
        if (window.scrollY === 0 && e.touches[0].clientY > e.touches[0].initialClientY) {
          // This only prevents the pull-to-refresh gesture, not normal scrolling
          e.preventDefault()
        }
      },
      { passive: false },
    )
  }

  // Initialize
  function initEditor() {
    // Placeholder for initEditor function
    console.log("initEditor function called");
  }

  function setupEventListeners() {
    // Placeholder for setupEventListeners function
    console.log("setupEventListeners function called");
  }

  initEditor()
  setupEventListeners()


})


// 說明視窗功能
const myHelp = `
標題	🥷烏衣行線上輸入法
標題連結	https://sites.google.com/view/oikasu
說明1	電腦請切換到英數模式
說明2	帶數字的輸入法，請打完拼音後，加空格，再選字。
說明3	選字時，空格可選第一個候選字詞。
說明4	候選太多使用 < > 翻頁。
說明5	可在候選視窗更改橫式直式候選。
`;

// 創建說明視窗
function createHelpModal() {
  // 檢查是否已存在說明視窗
  if (document.getElementById('helpModal')) {
    return document.getElementById('helpModal');
  }
  
  // 創建模態視窗容器
  const modal = document.createElement('div');
  modal.id = 'helpModal';
  modal.className = 'help-modal';
  
  // 創建模態視窗內容
  const modalContent = document.createElement('div');
  modalContent.className = 'help-modal-content';
  
  // 創建關閉按鈕
  const closeBtn = document.createElement('span');
  closeBtn.className = 'help-modal-close';
  closeBtn.innerHTML = '&times;';
  closeBtn.onclick = function() {
    modal.style.display = 'none';
  };
  
  // 解析並格式化幫助內容
  const helpLines = myHelp.trim().split('\n');
  const helpContent = document.createElement('div');
  helpContent.className = 'help-content';
  
  helpLines.forEach(line => {
    if (line.trim() === '') return;
    
    const parts = line.split('\t');
    const row = document.createElement('div');
    row.className = 'help-row';
    
    if (parts.length >= 2) {
      // 處理標題和標題連結
      if (parts[0].trim() === '標題') {
        const title = document.createElement('h2');
        title.textContent = parts[1];
        helpContent.appendChild(title);
        return;
      }
      
      if (parts[0].trim() === '標題連結') {
        const link = document.createElement('a');
        link.href = parts[1];
        link.textContent = parts[1];
        link.target = '_blank';
        link.className = 'help-link';
        helpContent.appendChild(link);
        // 添加分隔線
        const hr = document.createElement('hr');
        helpContent.appendChild(hr);
        return;
      }
      
      // 處理說明項目
      const label = document.createElement('div');
      label.className = 'help-label';
      label.textContent = parts[0];
      
      const value = document.createElement('div');
      value.className = 'help-value';
      value.textContent = parts[1];
      
      row.appendChild(label);
      row.appendChild(value);
      helpContent.appendChild(row);
    }
  });
  
  // 組裝模態視窗
  modalContent.appendChild(closeBtn);
  modalContent.appendChild(helpContent);
  modal.appendChild(modalContent);
  
  // 點擊模態視窗外部關閉
  window.onclick = function(event) {
    if (event.target === modal) {
      modal.style.display = 'none';
    }
  };
  
  // 添加到文檔
  document.body.appendChild(modal);
  return modal;
}

// 初始化說明視窗功能
function initHelpModal() {
  const editorTitle = document.querySelector('.editor-title');
  if (editorTitle) {
    editorTitle.style.cursor = 'pointer';
    editorTitle.addEventListener('click', function() {
      const modal = createHelpModal();
      modal.style.display = 'block';
    });
  }
}

// 在文檔加載完成後初始化
document.addEventListener('DOMContentLoaded', initHelpModal);


