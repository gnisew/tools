// 遊戲設定
const GRID_SIZE = 11 // 減少網格大小，使每格更大
let CELL_SIZE = 500 / GRID_SIZE // 每個格子的大小

// 角色設定
let playerChar = "😺"
let ghostChar = "👻"
let difficulty = "default" // default, try
let optionsCount = 2 // 2, 3, 4

// 遊戲狀態
let maze = []
// 在遊戲狀態部分添加初始位置變量
const player = { row: 0, col: 0 }
const initialPlayerPosition = { row: 0, col: 0 } // 保存初始位置
let ghosts = []
let words = []
let targetWord = null
let lives = 3
let level = 1
let gameRunning = true
const isMoving = false // 防止連續按鍵
let gameTime = 0 // 遊戲時間（秒）
let timerInterval = null
let gameState = "running" // 遊戲狀態: "running", "complete", "over"
// 在遊戲狀態部分添加一個變量來保存當前背景顏色
let currentBackgroundColor = ""
// 添加一個變量來防止特效重疊
let isEffectPlaying = false
// 添加一個變量來防止重複碰撞檢測
let collisionCooldown = false
// 添加一個變量來追蹤炸彈
let activeBombs = []

// 在遊戲狀態部分添加一個變量來追蹤炸彈放置時間
let bombPlacementTimer = null
let canPlaceBombTime = false

// 添加一個變量來控制過關後的延遲
let canProceedToNextLevel = false

// 添加一個變量來追蹤是否已經開始計時
let timerStarted = false

// 語詞資料庫
const wordPairs = [
  { chinese: "蘋果", english: "apple" },
  { chinese: "香蕉", english: "banana" },
  { chinese: "貓", english: "cat" },
  { chinese: "狗", english: "dog" },
  { chinese: "房子", english: "house" },
  { chinese: "車子", english: "car" },
  { chinese: "書", english: "book" },
  { chinese: "學校", english: "school" },
  { chinese: "電腦", english: "computer" },
  { chinese: "朋友", english: "friend" },
]

// 遊戲元素
const gameBoard = document.getElementById("game-board")
const mazeElement = document.getElementById("maze")
const playerElement = document.getElementById("player")
const questionElement = document.getElementById("question")
const livesElement = document.getElementById("lives").getElementsByClassName("life")
const timerElement = document.getElementById("timer-value")
const levelDisplayElement = document.getElementById("level-display")
const levelCompleteElement = document.getElementById("level-complete")
const completeTimeElement = document.getElementById("complete-time")
const remainingLivesElement = document.getElementById("remaining-lives")
const nextLevelBtn = document.getElementById("next-level-btn")
const gameOverElement = document.getElementById("game-over")
const gameOverTimeElement = document.getElementById("game-over-time")
const reachedLevelElement = document.getElementById("reached-level")
const restartBtn = document.getElementById("restart-btn")

// 行動裝置控制按鈕
const controlUp = document.getElementById("control-up")
const controlDown = document.getElementById("control-down")
const controlLeft = document.getElementById("control-left")
const controlRight = document.getElementById("control-right")

// 設定遊戲板大小
function resizeGameBoard() {
  const boardWidth = gameBoard.clientWidth
  CELL_SIZE = boardWidth / GRID_SIZE

  // 更新玩家位置
  if (player) {
    updatePlayerPosition()
  }

  // 更新鬼魂位置
  ghosts.forEach((ghost) => {
    if (ghost.element) {
      ghost.element.style.left = ghost.col * CELL_SIZE + (CELL_SIZE - 35) / 2 + "px"
      ghost.element.style.top = ghost.row * CELL_SIZE + (CELL_SIZE - 35) / 2 + "px"
    }
  })

  // 更新語詞位置
  words.forEach((word) => {
    if (word.element) {
      word.element.style.left = word.col * CELL_SIZE + "px"
      word.element.style.top = word.row * CELL_SIZE + "px"
    }
  })

  // 更新炸彈位置
  activeBombs.forEach((bomb) => {
    if (bomb.element) {
      bomb.element.style.left = bomb.col * CELL_SIZE + (CELL_SIZE - 24) / 2 + "px"
      bomb.element.style.top = bomb.row * CELL_SIZE + (CELL_SIZE - 24) / 2 + "px"
    }
  })

  // 重新渲染迷宮
  if (maze.length > 0) {
    renderMaze(true)
  }
}

// 初始化遊戲
function initGame() {
  // 重設遊戲狀態
  maze = []
  ghosts = []
  words = []
  activeBombs = []
  lives = 3
  gameRunning = true
  gameTime = 0
  gameState = "running"
  isEffectPlaying = false
  collisionCooldown = false
  canPlaceBombTime = false
  canProceedToNextLevel = false
  timerStarted = false // 重設計時器開始標誌

  // 更新關卡顯示
  updateLevelDisplay()

  // 清除之前的炸彈放置計時器
  if (bombPlacementTimer) {
    clearTimeout(bombPlacementTimer)
  }

  // 設置炸彈放置時間窗口
  bombPlacementTimer = setTimeout(() => {
    canPlaceBombTime = true

    // 30秒後關閉炸彈放置時間窗口
    setTimeout(() => {
      canPlaceBombTime = false
    }, 25000) // 30秒 - 5秒 = 25秒
  }, 5000) // 5秒後開始允許放置炸彈

  // 更新生命顯示
  updateLives()

  // 重設計時器
  clearInterval(timerInterval)
  timerElement.textContent = "00:00"
  // 不在這裡啟動計時器，而是在第一次移動時啟動
  // startTimer()

  // 生成迷宮
  generateMaze()

  // 放置玩家
  placePlayer()

  // 生成鬼魂
  generateGhosts()

  // 生成語詞
  generateWords()

  // 設定問題
  setQuestion()

  // 隱藏遊戲結束和過關畫面
  levelCompleteElement.style.display = "none"
  gameOverElement.style.display = "none"

  // 更新玩家角色顯示
  playerElement.innerHTML = playerChar

  // 調整遊戲板大小
  resizeGameBoard()
}

// 更新關卡顯示
function updateLevelDisplay() {
  levelDisplayElement.textContent = `第 ${level} 關`
}

// 開始計時器
function startTimer() {
  if (timerStarted) return // 如果已經開始計時，則不重複啟動
  
  timerStarted = true // 標記已開始計時
  timerInterval = setInterval(() => {
    if (gameRunning) {
      gameTime++
      updateTimerDisplay()
    }
  }, 1000)
}

// 更新計時器顯示
function updateTimerDisplay() {
  const minutes = Math.floor(gameTime / 60)
  const seconds = gameTime % 60
  timerElement.textContent = `${minutes.toString().padStart(2, "0")}:${seconds.toString().padStart(2, "0")}`
}

// 生成迷宮 (使用簡化的迷宮生成算法)
function generateMaze() {
  // 清空迷宮元素
  mazeElement.innerHTML = ""
  mazeElement.style.gridTemplateColumns = `repeat(${GRID_SIZE}, 1fr)`
  mazeElement.style.gridTemplateRows = `repeat(${GRID_SIZE}, 1fr)`

  // 初始化迷宮網格 (全部設為牆)
  for (let row = 0; row < GRID_SIZE; row++) {
    maze[row] = []
    for (let col = 0; col < GRID_SIZE; col++) {
      maze[row][col] = 1 // 1 表示牆
    }
  }

  // 使用改進的迷宮生成算法
  generateSimpleMaze()

  // 確保迷宮邊緣是牆
  for (let i = 0; i < GRID_SIZE; i++) {
    maze[0][i] = 1
    maze[GRID_SIZE - 1][i] = 1
    maze[i][0] = 1
    maze[i][GRID_SIZE - 1] = 1
  }

  // 渲染迷宮
  renderMaze()
}

// 渲染迷宮
function renderMaze(keepColor = false) {
  // 清空迷宮元素
  mazeElement.innerHTML = ""

  // 渲染迷宮
  for (let row = 0; row < GRID_SIZE; row++) {
    for (let col = 0; col < GRID_SIZE; col++) {
      const cell = document.createElement("div")
      cell.className = maze[row][col] === 1 ? "cell wall" : "cell path"
      cell.style.gridRow = row + 1
      cell.style.gridColumn = col + 1
      cell.dataset.row = row
      cell.dataset.col = col
      mazeElement.appendChild(cell)
    }
  }

  // 設定迷宮背景顏色 (保持原色或隨機)
  if (!keepColor) {
    const colors = ["#8A2BE2", "#4169E1", "#00BFFF", "#32CD32", "#FF6347"]
    currentBackgroundColor = colors[Math.floor(Math.random() * colors.length)]
  }

  gameBoard.style.backgroundColor = currentBackgroundColor

  // 為路徑單元格添加淺色背景
  const pathCells = document.querySelectorAll(".path")
  pathCells.forEach((cell) => {
    cell.style.backgroundColor = currentBackgroundColor
  })
}

// 生成簡化的迷宮
function generateSimpleMaze() {
  // 從中心開始
  const startRow = Math.floor(GRID_SIZE / 2)
  const startCol = Math.floor(GRID_SIZE / 2)
  maze[startRow][startCol] = 0 // 0 表示路

  // 使用改進的迷宮生成算法
  const stack = [{ row: startRow, col: startCol }]
  const visited = new Set()
  visited.add(`${startRow},${startCol}`)

  while (stack.length > 0) {
    const current = stack[stack.length - 1]

    // 四個方向: 上、右、下、左
    const directions = [
      [-2, 0],
      [0, 2],
      [2, 0],
      [0, -2],
    ]

    // 隨機排序方向
    directions.sort(() => Math.random() - 0.5)

    let foundNext = false

    for (const [dr, dc] of directions) {
      const newRow = current.row + dr
      const newCol = current.col + dc

      // 檢查是否在邊界內且未訪問過
      if (
        newRow > 0 &&
        newRow < GRID_SIZE - 1 &&
        newCol > 0 &&
        newCol < GRID_SIZE - 1 &&
        !visited.has(`${newRow},${newCol}`)
      ) {
        // 打通牆壁
        maze[current.row + dr / 2][current.col + dc / 2] = 0
        maze[newRow][newCol] = 0

        // 標記為已訪問
        visited.add(`${newRow},${newCol}`)

        // 添加到堆疊
        stack.push({ row: newRow, col: newCol })
        foundNext = true
        break
      }
    }

    if (!foundNext) {
      stack.pop()
    }
  }

  // 添加一些隨機的開口，使迷宮更簡單
  const openings = 3 + Math.floor(level / 2)
  for (let i = 0; i < openings; i++) {
    const row = 1 + Math.floor(Math.random() * (GRID_SIZE - 2))
    const col = 1 + Math.floor(Math.random() * (GRID_SIZE - 2))

    if (maze[row][col] === 1) {
      maze[row][col] = 0
    }
  }
}

// 放置玩家
function placePlayer() {
  // 尋找空位
  let placed = false
  while (!placed) {
    const row = Math.floor(Math.random() * (GRID_SIZE - 2)) + 1
    const col = Math.floor(Math.random() * (GRID_SIZE - 2)) + 1

    if (maze[row][col] === 0) {
      player.row = row
      player.col = col
      // 保存初始位置
      initialPlayerPosition.row = row
      initialPlayerPosition.col = col
      updatePlayerPosition()
      placed = true
    }
  }
}

// 更新玩家位置
function updatePlayerPosition() {
  playerElement.style.left = player.col * CELL_SIZE + (CELL_SIZE - 35) / 2 + "px"
  playerElement.style.top = player.row * CELL_SIZE + (CELL_SIZE - 35) / 2 + "px"
}

// 生成鬼魂
function generateGhosts() {
  // 移除現有鬼魂
  const existingGhosts = document.querySelectorAll(".ghost")
  existingGhosts.forEach((ghost) => ghost.remove())

  // 移除現有炸彈
  const existingBombs = document.querySelectorAll(".bomb")
  existingBombs.forEach((bomb) => bomb.remove())

  ghosts = []
  activeBombs = []

  // 根據難度決定鬼魂數量
  let ghostCount = 0 // 預設沒有鬼

  if (difficulty === "try") {
    ghostCount = 1 // 嘗試模式有一隻鬼
  }

  // 如果沒有鬼魂，直接返回
  if (ghostCount === 0) {
    return
  }

  // 生成新鬼魂
  for (let i = 0; i < ghostCount; i++) {
    let placed = false
    let ghostRow, ghostCol

    // 確保鬼魂不會太靠近玩家
    while (!placed) {
      ghostRow = Math.floor(Math.random() * (GRID_SIZE - 2)) + 1
      ghostCol = Math.floor(Math.random() * (GRID_SIZE - 2)) + 1

      const distance = Math.sqrt(Math.pow(ghostRow - player.row, 2) + Math.pow(ghostCol - player.col, 2))

      if (maze[ghostRow][ghostCol] === 0 && distance > 4) {
        placed = true
      }
    }

    // 創建鬼魂元素
    const ghost = document.createElement("div")
    ghost.className = "ghost"
    ghost.innerHTML = ghostChar
    ghost.style.left = ghostCol * CELL_SIZE + (CELL_SIZE - 35) / 2 + "px"
    ghost.style.top = ghostRow * CELL_SIZE + (CELL_SIZE - 35) / 2 + "px"
    gameBoard.appendChild(ghost)

    // 添加到鬼魂陣列
    ghosts.push({
      element: ghost,
      row: ghostRow,
      col: ghostCol,
      direction: Math.floor(Math.random() * 4), // 0: 上, 1: 右, 2: 下, 3: 左
      moveTimer: null,
      canPlaceBomb: true, // 每關可以放一次炸彈
      bombPlaced: false, // 是否已經放置炸彈
      bombTimer: null,
    })

    // 設定鬼魂移動
    startGhostMovement(ghosts[ghosts.length - 1])
  }
}

// 開始鬼魂移動
function startGhostMovement(ghost) {
  ghost.moveTimer = setInterval(() => {
    if (!gameRunning) return

    // 先移動鬼魂
    moveGhost(ghost)

    // 然後檢查碰撞 - 使用嚴格的網格位置比較
    if (ghost.row === player.row && ghost.col === player.col && !collisionCooldown) {
      // 碰到鬼魂扣除生命值並回到初始位置
      handleGhostCollision()
    }
  }, 400) // 每400毫秒移動一次
}

// 添加鬼魂碰撞處理函數
function handleGhostCollision() {
  // 如果已經在播放特效或冷卻中，則不重複播放
  if (isEffectPlaying || collisionCooldown) return

  // 設置碰撞冷卻，防止短時間內多次碰撞
  collisionCooldown = true

  // 播放震動特效
  playEffect("shake")

  // 扣除一點生命值
  loseLife()

  // 如果還有生命，將玩家送回初始位置
  if (lives > 0) {
    player.row = initialPlayerPosition.row
    player.col = initialPlayerPosition.col
    updatePlayerPosition()
  }

  // 1秒後解除碰撞冷卻
  setTimeout(() => {
    collisionCooldown = false
  }, 1000)
}

// 移動鬼魂
function moveGhost(ghost) {
  // 方向: 0: 上, 1: 右, 2: 下, 3: 左
  const directions = [
    [-1, 0],
    [0, 1],
    [1, 0],
    [0, -1],
  ]

  // 檢查是否可以放炸彈
  if (ghost.canPlaceBomb && !ghost.bombPlaced && canPlaceBombTime) {
    // 隨機決定是否放炸彈 (5%機率)
    if (Math.random() < 0.05) {
      placeBomb(ghost)
      return // 放炸彈後不移動
    }
  }

  // 嘗試繼續當前方向
  const newRow = ghost.row + directions[ghost.direction][0]
  const newCol = ghost.col + directions[ghost.direction][1]

  // 檢查是否可以繼續當前方向
  if (newRow > 0 && newRow < GRID_SIZE - 1 && newCol > 0 && newCol < GRID_SIZE - 1 && maze[newRow][newCol] === 0) {
    // 繼續當前方向
    ghost.row = newRow
    ghost.col = newCol
  } else {
    // 碰到牆，需要改變方向

    // 獲取可行方向
    const validDirections = []
    for (let i = 0; i < 4; i++) {
      const [dr, dc] = directions[i]
      const checkRow = ghost.row + dr
      const checkCol = ghost.col + dc

      if (
        checkRow > 0 &&
        checkRow < GRID_SIZE - 1 &&
        checkCol > 0 &&
        checkCol < GRID_SIZE - 1 &&
        maze[checkRow][checkCol] === 0
      ) {
        validDirections.push(i)
      }
    }

    if (validDirections.length > 0) {
      // 95%的機率不會選擇相反方向（除非沒有其他選擇）
      const oppositeDirection = (ghost.direction + 2) % 4
      const nonOppositeDirections = validDirections.filter((dir) => dir !== oppositeDirection)

      if (nonOppositeDirections.length > 0 && Math.random() < 0.95) {
        ghost.direction = nonOppositeDirections[Math.floor(Math.random() * nonOppositeDirections.length)]
      } else {
        ghost.direction = validDirections[Math.floor(Math.random() * validDirections.length)]
      }

      // 移動到新方向
      const [dr, dc] = directions[ghost.direction]
      ghost.row += dr
      ghost.col += dc
    }
  }

  // 偶爾隨機改變方向 (2%機率)
  if (Math.random() < 0.02) {
    const validDirections = []
    for (let i = 0; i < 4; i++) {
      const [dr, dc] = directions[i]
      const checkRow = ghost.row + dr
      const checkCol = ghost.col + dc

      if (
        checkRow > 0 &&
        checkRow < GRID_SIZE - 1 &&
        checkCol > 0 &&
        checkCol < GRID_SIZE - 1 &&
        maze[checkRow][checkCol] === 0
      ) {
        validDirections.push(i)
      }
    }

    if (validDirections.length > 0) {
      ghost.direction = validDirections[Math.floor(Math.random() * validDirections.length)]
    }
  }

  // 更新鬼魂位置
  ghost.element.style.left = ghost.col * CELL_SIZE + (CELL_SIZE - 35) / 2 + "px"
  ghost.element.style.top = ghost.row * CELL_SIZE + (CELL_SIZE - 35) / 2 + "px"
}

// 放置炸彈
function placeBomb(ghost) {
  // 標記鬼魂已放置炸彈
  ghost.bombPlaced = true
  ghost.canPlaceBomb = false

  // 尋找附近的內部牆壁
  const directions = [
    [-1, 0],
    [0, 1],
    [1, 0],
    [0, -1],
  ]

  // 過濾出可以炸的內部牆壁
  const wallDirections = []

  for (const [dr, dc] of directions) {
    const checkRow = ghost.row + dr
    const checkCol = ghost.col + dc

    // 確保不是邊界牆
    if (
      checkRow > 0 &&
      checkRow < GRID_SIZE - 1 &&
      checkCol > 0 &&
      checkCol < GRID_SIZE - 1 &&
      maze[checkRow][checkCol] === 1
    ) {
      wallDirections.push([dr, dc])
    }
  }

  // 如果沒有可炸的內部牆，就不放炸彈
  if (wallDirections.length === 0) {
    ghost.bombPlaced = false
    ghost.canPlaceBomb = true
    return
  }

  // 隨機選擇一個方向的內部牆
  const [dr, dc] = wallDirections[Math.floor(Math.random() * wallDirections.length)]
  const wallRow = ghost.row + dr
  const wallCol = ghost.col + dc

  // 創建炸彈元素 - 放在鬼魂位置
  const bomb = document.createElement("div")
  bomb.className = "bomb"
  bomb.innerHTML = "💣"
  bomb.style.left = ghost.col * CELL_SIZE + (CELL_SIZE - 24) / 2 + "px"
  bomb.style.top = ghost.row * CELL_SIZE + (CELL_SIZE - 24) / 2 + "px"
  gameBoard.appendChild(bomb)

  // 添加炸彈到活動炸彈列表
  const bombInfo = {
    element: bomb,
    row: ghost.row,
    col: ghost.col,
    targetRow: wallRow,
    targetCol: wallCol,
  }
  activeBombs.push(bombInfo)

  // 檢查玩家是否在炸彈位置 - 使用嚴格的網格位置比較
  if (player.row === ghost.row && player.col === ghost.col && !collisionCooldown) {
    // 如果玩家在炸彈位置，播放旋轉特效
    playEffect("rotate")

    // 設置碰撞冷卻，防止短時間內多次碰撞
    collisionCooldown = true

    // 扣除一點生命值
    loseLife()

    // 如果還有生命，將玩家送回初始位置
    if (lives > 0) {
      player.row = initialPlayerPosition.row
      player.col = initialPlayerPosition.col
      updatePlayerPosition()
    }

    // 1秒後解除碰撞冷卻
    setTimeout(() => {
      collisionCooldown = false
    }, 1000)
  }

  // 2秒後引爆炸彈
  ghost.bombTimer = setTimeout(() => {
    // 移除炸彈
    bomb.remove()

    // 從活動炸彈列表中移除
    const bombIndex = activeBombs.findIndex((b) => b.element === bomb)
    if (bombIndex !== -1) {
      activeBombs.splice(bombIndex, 1)
    }

    // 創建爆炸效果
    const explosion = document.createElement("div")
    explosion.className = "explosion"
    explosion.style.left = wallCol * CELL_SIZE + (CELL_SIZE - 40) / 2 + "px"
    explosion.style.top = wallRow * CELL_SIZE + (CELL_SIZE - 40) / 2 + "px"
    gameBoard.appendChild(explosion)

    // 炸開牆壁
    maze[wallRow][wallCol] = 0

    // 更新迷宮顯示，保持背景顏色不變
    renderMaze(true)

    // 移除檢查玩家是否在炸彈爆炸範圍內的邏輯，只有直接碰到炸彈才會受傷

    // 0.5秒後移除爆炸效果
    setTimeout(() => {
      explosion.remove()
    }, 500)
  }, 2000)
}

// 生成語詞
function generateWords() {
  // 移除現有語詞
  const existingWords = document.querySelectorAll(".word")
  existingWords.forEach((word) => word.remove())

  words = []

  // 隨機選擇目標語詞
  const targetIndex = Math.floor(Math.random() * wordPairs.length)
  const targetPair = wordPairs[targetIndex]

  // 放置目標語詞
  let placed = false
  let wordRow, wordCol

  while (!placed) {
    wordRow = Math.floor(Math.random() * (GRID_SIZE - 2)) + 1
    wordCol = Math.floor(Math.random() * (GRID_SIZE - 2)) + 1

    if (maze[wordRow][wordCol] === 0 && (wordRow !== player.row || wordCol !== player.col)) {
      placed = true
    }
  }

  // 創建目標語詞元素
  const targetWordElement = document.createElement("div")
  targetWordElement.className = "word"
  targetWordElement.style.left = wordCol * CELL_SIZE + "px"
  targetWordElement.style.top = wordRow * CELL_SIZE + "px"

  const targetIconElement = document.createElement("div")
  targetIconElement.className = "word-icon"

  const targetTextElement = document.createElement("div")
  targetTextElement.className = "word-text"
  targetTextElement.textContent = targetPair.english

  targetWordElement.appendChild(targetIconElement)
  targetWordElement.appendChild(targetTextElement)
  gameBoard.appendChild(targetWordElement)

  // 添加到語詞陣列
  targetWord = {
    element: targetWordElement,
    row: wordRow,
    col: wordCol,
    text: targetPair.english,
    isTarget: true,
  }

  words.push(targetWord)

  // 生成錯誤語詞
  const wrongCount = optionsCount - 1 // 根據選項數量設定錯誤選項數量
  const usedIndices = [targetIndex]

  for (let i = 0; i < wrongCount; i++) {
    let wrongIndex
    do {
      wrongIndex = Math.floor(Math.random() * wordPairs.length)
    } while (usedIndices.includes(wrongIndex))

    usedIndices.push(wrongIndex)
    const wrongPair = wordPairs[wrongIndex]

    // 放置錯誤語詞
    placed = false

    while (!placed) {
      wordRow = Math.floor(Math.random() * (GRID_SIZE - 2)) + 1
      wordCol = Math.floor(Math.random() * (GRID_SIZE - 2)) + 1

      if (maze[wordRow][wordCol] === 0 && (wordRow !== player.row || wordCol !== player.col)) {
        // 確保與其他語詞不重疊
        let tooClose = false
        for (const word of words) {
          if (Math.abs(wordRow - word.row) <= 1 && Math.abs(wordCol - word.col) <= 1) {
            tooClose = true
            break
          }
        }

        if (!tooClose) {
          placed = true
        }
      }
    }

    // 創建錯誤語詞元素
    const wrongWordElement = document.createElement("div")
    wrongWordElement.className = "word"
    wrongWordElement.style.left = wordCol * CELL_SIZE + "px"
    wrongWordElement.style.top = wordRow * CELL_SIZE + "px"

    const wrongIconElement = document.createElement("div")
    wrongIconElement.className = "word-icon"

    const wrongTextElement = document.createElement("div")
    wrongTextElement.className = "word-text"
    wrongTextElement.textContent = wrongPair.english

    wrongWordElement.appendChild(wrongIconElement)
    wrongWordElement.appendChild(wrongTextElement)
    gameBoard.appendChild(wrongWordElement)

    // 添加到語詞陣列
    words.push({
      element: wrongWordElement,
      row: wordRow,
      col: wordCol,
      text: wrongPair.english,
      isTarget: false,
    })
  }

  // 調整語詞位置以確保完全可見
  words.forEach((word) => {
    const rect = word.element.getBoundingClientRect()
    const width = rect.width
    const height = rect.height

    // 確保語詞不會超出邊界
    if (word.col * CELL_SIZE + width > gameBoard.clientWidth) {
      word.element.style.left = word.col * CELL_SIZE - (width - CELL_SIZE) + "px"
    }

    if (word.row * CELL_SIZE + height > gameBoard.clientHeight) {
      word.element.style.top = word.row * CELL_SIZE - (height - CELL_SIZE) + "px"
    }
  })
}

// 設定問題
function setQuestion() {
  const targetPair = wordPairs.find((pair) => pair.english === targetWord.text)
  questionElement.textContent = `找出「${targetPair.chinese}」的英文`
}

// 更新生命顯示
function updateLives() {
  for (let i = 0; i < livesElement.length; i++) {
    livesElement[i].style.visibility = i < lives ? "visible" : "hidden"
  }
}

// 檢查語詞碰撞
function checkWordCollision() {
  for (let i = 0; i < words.length; i++) {
    const word = words[i]

    // 使用嚴格的網格位置比較
    if (player.row === word.row && player.col === word.col) {
      if (word.isTarget) {
        // 找到目標語詞，過關
        levelComplete()
      } else if (!collisionCooldown) {
        // 如果已經在播放特效或冷卻中，則不重複播放
        if (isEffectPlaying) return true

        // 設置碰撞冷卻，防止短時間內多次碰撞
        collisionCooldown = true

        // 碰到錯誤語詞，播放閃爍特效
        playEffect("flash")

        // 碰到錯誤語詞，扣生命
        loseLife()

        // 移除該語詞
        word.element.remove()
        words.splice(i, 1)
        i--

        // 1秒後解除碰撞冷卻
        setTimeout(() => {
          collisionCooldown = false
        }, 1000)
      }
      return true
    }
  }
  return false
}

// 檢查鬼魂碰撞
function checkGhostCollision() {
  for (const ghost of ghosts) {
    // 使用嚴格的網格位置比較
    if (player.row === ghost.row && player.col === ghost.col && !collisionCooldown) {
      // 碰到鬼魂扣除生命值並回到初始位置
      handleGhostCollision()
      return true
    }
  }

  // 檢查炸彈碰撞
  for (const bomb of activeBombs) {
    // 使用嚴格的網格位置比較
    if (player.row === bomb.row && player.col === bomb.col && !collisionCooldown) {
      // 如果已經在播放特效或冷卻中，則不重複播放
      if (isEffectPlaying) return true

      // 設置碰撞冷卻，防止短時間內多次碰撞
      collisionCooldown = true

      // 碰到炸彈，播放旋轉特效
      playEffect("rotate")

      // 碰到炸彈，扣生命
      loseLife()

      // 如果還有生命，將玩家送回初始位置
      if (lives > 0) {
        player.row = initialPlayerPosition.row
        player.col = initialPlayerPosition.col
        updatePlayerPosition()
      }

      // 1秒後解除碰撞冷卻
      setTimeout(() => {
        collisionCooldown = false
      }, 1000)

      return true
    }
  }

  return false
}

// 播放特效
function playEffect(effectType) {
  if (isEffectPlaying) return

  isEffectPlaying = true

  // 移除所有特效類
  playerElement.classList.remove("shake-effect", "rotate-effect", "flash-effect")

  // 添加指定特效類
  playerElement.classList.add(`${effectType}-effect`)

  // 特效結束後移除類
  setTimeout(() => {
    playerElement.classList.remove(`${effectType}-effect`)
    isEffectPlaying = false
  }, 500)
}

// 移動玩家
function movePlayer(direction) {
  if (!gameRunning) return

  // 如果計時器還沒開始，則開始計時
  if (!timerStarted) {
    startTimer()
  }

  // 移除移動延遲，使主角移動更快
  let newRow = player.row
  let newCol = player.col

  switch (direction) {
    case "up":
      newRow--
      break
    case "down":
      newRow++
      break
    case "left":
      newCol--
      break
    case "right":
      newCol++
      break
  }

  // 檢查是否可以移動
  if (newRow >= 0 && newRow < GRID_SIZE && newCol >= 0 && newCol < GRID_SIZE && maze[newRow][newCol] === 0) {
    player.row = newRow
    player.col = newCol
    updatePlayerPosition()

    // 檢查碰撞
    checkWordCollision()
    checkGhostCollision()
  }
}

// 扣除生命
function loseLife() {
  lives--
  updateLives()

  if (lives <= 0) {
    gameOver()
  }
}

// 過關
function levelComplete() {
  gameRunning = false
  gameState = "complete"

  // 清除炸彈放置計時器
  if (bombPlacementTimer) {
    clearTimeout(bombPlacementTimer)
    bombPlacementTimer = null
  }

  // 停止所有鬼魂移動和炸彈計時器
  ghosts.forEach((ghost) => {
    clearInterval(ghost.moveTimer)
    if (ghost.bombTimer) {
      clearTimeout(ghost.bombTimer)
    }
  })

  // 移除所有炸彈
  const bombs = document.querySelectorAll(".bomb")
  bombs.forEach((bomb) => bomb.remove())

  // 停止計時器
  clearInterval(timerInterval)

  // 更新過關統計
  completeTimeElement.textContent = timerElement.textContent
  remainingLivesElement.textContent = lives

  // 顯示過關畫面
  levelCompleteElement.style.display = "flex"

  // 1秒後才允許進入下一關
  setTimeout(() => {
    canProceedToNextLevel = true
    // 更新提示文字，表示可以按任意鍵繼續
    const keyHint = levelCompleteElement.querySelector(".key-hint")
    if (keyHint) {
      keyHint.style.color = "#fff" // 將提示文字變亮
    }
  }, 1000)
}

// 遊戲結束
function gameOver() {
  gameRunning = false
  gameState = "over"

  // 清除炸彈放置計時器
  if (bombPlacementTimer) {
    clearTimeout(bombPlacementTimer)
    bombPlacementTimer = null
  }

  // 停止所有鬼魂移動和炸彈計時器
  ghosts.forEach((ghost) => {
    clearInterval(ghost.moveTimer)
    if (ghost.bombTimer) {
      clearTimeout(ghost.bombTimer)
    }
  })

  // 移除所有炸彈
  const bombs = document.querySelectorAll(".bomb")
  bombs.forEach((bomb) => bomb.remove())

  // 停止計時器
  clearInterval(timerInterval)

  // 更新遊戲結束統計
  gameOverTimeElement.textContent = timerElement.textContent
  reachedLevelElement.textContent = level

  gameOverElement.style.display = "flex"
}

// 下一關
function nextLevel() {
  // 只有在允許進入下一關時才能繼續
  if (!canProceedToNextLevel && gameState === "complete") return

  level++
  initGame()
}

// 重新開始
function restart() {
  level = 1
  initGame()
}

// 鍵盤事件監聽
document.addEventListener("keydown", (event) => {
  if (gameState === "running") {
    switch (event.key) {
      case "ArrowUp":
        movePlayer("up")
        break
      case "ArrowDown":
        movePlayer("down")
        break
      case "ArrowLeft":
        movePlayer("left")
        break
      case "ArrowRight":
        movePlayer("right")
        break
    }
  } else if (gameState === "complete") {
    // 過關時按任意鍵繼續下一關，但需要等待1秒
    if (canProceedToNextLevel) {
      nextLevel()
    }
  } else if (gameState === "over") {
    // 遊戲結束時按任意鍵重新開始
    restart()
  }
})

// 行動裝置控制按鈕事件
controlUp.addEventListener("touchstart", (e) => {
  e.preventDefault()
  movePlayer("up")
})

controlDown.addEventListener("touchstart", (e) => {
  e.preventDefault()
  movePlayer("down")
})

controlLeft.addEventListener("touchstart", (e) => {
  e.preventDefault()
  movePlayer("left")
})

controlRight.addEventListener("touchstart", (e) => {
  e.preventDefault()
  movePlayer("right")
})

// 防止行動裝置上的雙擊縮放
document.addEventListener(
  "touchstart",
  (e) => {
    if (e.touches.length > 1) {
      e.preventDefault()
    }
  },
  { passive: false },
)

// 按鈕事件監聽
nextLevelBtn.addEventListener("click", nextLevel)
restartBtn.addEventListener("click", restart)

// 選單功能
const menuButton = document.getElementById("menu-button")
const gameMenu = document.getElementById("game-menu")
const closeMenuButton = document.getElementById("close-menu")
const applySettingsButton = document.getElementById("apply-settings")
const difficultyOptions = document.querySelectorAll('input[name="difficulty"]')
const optionsCountOptions = document.querySelectorAll('input[name="options"]')

// 展開按鈕
const expandPlayerButton = document.getElementById("expand-player")
const expandGhostButton = document.getElementById("expand-ghost")
const expandedPlayerContent = document.getElementById("expanded-player-content")
const expandedGhostContent = document.getElementById("expanded-ghost-content")

const expandPlayerH3 = document.getElementById("expand-player-h3")
const expandGhostH3 = document.getElementById("expand-ghost-h3")

// 展開/收合主角選項
expandPlayerButton.addEventListener("click", () => {
  expandedPlayerContent.classList.toggle("show")
  expandPlayerButton.textContent = expandedPlayerContent.classList.contains("show") ? "▲" : "▼"
})

// 展開/收合主角選項
expandPlayerH3.addEventListener("click", () => {
  expandedPlayerContent.classList.toggle("show")
  expandPlayerButton.textContent = expandedPlayerContent.classList.contains("show") ? "▲" : "▼"
})

// 展開/收合鬼魂選項
expandGhostButton.addEventListener("click", () => {
  expandedGhostContent.classList.toggle("show")
  expandGhostButton.textContent = expandedGhostContent.classList.contains("show") ? "▲" : "▼"
})

expandGhostH3.addEventListener("click", () => {
  expandedGhostContent.classList.toggle("show")
  expandGhostButton.textContent = expandedGhostContent.classList.contains("show") ? "▲" : "▼"
})

// 打開選單
menuButton.addEventListener("click", () => {
  gameMenu.classList.toggle("open")
})

// 關閉選單
closeMenuButton.addEventListener("click", () => {
  gameMenu.classList.remove("open")
})

// 選擇主角（包括展開區域）
document
  .querySelectorAll("#player-selection .character-item, #expanded-player-content .character-item")
  .forEach((item) => {
    item.addEventListener("click", () => {
      // 移除所有選項的選中狀態
      document
        .querySelectorAll("#player-selection .character-item, #expanded-player-content .character-item")
        .forEach((i) => i.classList.remove("selected"))
      // 添加當前選項的選中狀態
      item.classList.add("selected")
    })
  })

// 選擇鬼魂（包括展開區域）
document
  .querySelectorAll("#ghost-selection .character-item, #expanded-ghost-content .character-item")
  .forEach((item) => {
    item.addEventListener("click", () => {
      // 移除所有選項的選中狀態
      document
        .querySelectorAll("#ghost-selection .character-item, #expanded-ghost-content .character-item")
        .forEach((i) => i.classList.remove("selected"))
      // 添加當前選項的選中狀態
      item.classList.add("selected")
    })
  })

// 套用設定
applySettingsButton.addEventListener("click", () => {
  // 獲取選中的主角
  const selectedPlayerItem = document.querySelector(
    "#player-selection .character-item.selected, #expanded-player-content .character-item.selected",
  )
  if (selectedPlayerItem) {
    playerChar = selectedPlayerItem.getAttribute("data-char")
  }

  // 獲取選中的鬼魂
  const selectedGhostItem = document.querySelector(
    "#ghost-selection .character-item.selected, #expanded-ghost-content .character-item.selected",
  )
  if (selectedGhostItem) {
    ghostChar = selectedGhostItem.getAttribute("data-char")
  }

  // 獲取選中的難度
  const selectedDifficulty = document.querySelector('input[name="difficulty"]:checked')
  if (selectedDifficulty) {
    difficulty = selectedDifficulty.value
  }

  // 獲取選中的選項數量
  const selectedOptionsCount = document.querySelector('input[name="options"]:checked')
  if (selectedOptionsCount) {
    optionsCount = Number.parseInt(selectedOptionsCount.value)
  }

  // 關閉選單
  gameMenu.classList.remove("open")

  // 重新開始遊戲以套用設定
  restart()
})

// 點擊遊戲區域外的地方關閉選單
document.addEventListener("click", (event) => {
  if (!gameMenu.contains(event.target) && !menuButton.contains(event.target) && gameMenu.classList.contains("open")) {
    gameMenu.classList.remove("open")
  }
})

// 監聽視窗大小變化，調整遊戲板大小
window.addEventListener("resize", resizeGameBoard)

// 初始化遊戲
initGame()
