// 遊戲常數
const GRID_SIZE = 11
const CELL_SIZE = 500 / GRID_SIZE
const QUIZ_TIME_LIMIT = 20
const PLAYER_MOVE_INTERVAL = 300
const GHOST_MOVE_INTERVAL = 300
const COLLISION_COOLDOWN = 2000
const EFFECT_DURATION = 500
const COLLISION_CHECK_INTERVAL = 300 // 與移動間隔同步
const COUNTDOWN_TIME = 120 // 添加倒數時間常數，每關120秒

// 遊戲狀態
const state = {
  maze: [],
  player: { row: 0, col: 0 },
  initialPlayerPosition: { row: 0, col: 0 },
  ghosts: [],
  stars: [],
  lives: 3,
  level: 1,
  gameRunning: true,
  isPaused: false,
  remainingTime: COUNTDOWN_TIME, // 修改為剩餘時間
  gameState: "running",
  currentBackgroundColor: "",
  isEffectPlaying: false,
  collisionCooldown: false,
  canProceedToNextLevel: false,
  collectedStars: 0,
  currentQuizOptionIndex: 0,
  quizTimeRemaining: QUIZ_TIME_LIMIT,
  currentDirection: null,
  isGhostCollisionChecking: false,
  autoMoveInterval: null,
  isPlayerMoving: false,
  lastCollisionTime: 0, // 新增：記錄上次碰撞時間

  settings: {
    playerChar: "😺",
    ghostChar: "👻",
    difficulty: "default",
    optionsCount: 4,
  },
}

// 計時器管理
const timers = {}

function startTimer(name, callback, interval) {
  stopTimer(name)
  timers[name] = setInterval(callback, interval)
  return timers[name]
}

function stopTimer(name) {
  if (timers[name]) {
    clearInterval(timers[name])
    delete timers[name]
  }
}

function stopAllTimers() {
  Object.keys(timers).forEach(stopTimer)
}

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
  { chinese: "水", english: "water" },
  { chinese: "麵包", english: "bread" },
  { chinese: "鳥", english: "bird" },
  { chinese: "魚", english: "fish" },
  { chinese: "花", english: "flower" },
  { chinese: "樹", english: "tree" },
  { chinese: "太陽", english: "sun" },
  { chinese: "月亮", english: "moon" },
  { chinese: "星星", english: "star" },
  { chinese: "天空", english: "sky" },
]

// 遊戲元素
const elements = {
  gameBoard: document.getElementById("game-board"),
  mazeElement: document.getElementById("maze"),
  playerElement: document.getElementById("player"),
  livesElement: document.getElementById("lives").getElementsByClassName("life"),
  timerElement: document.getElementById("timer-value"),
  levelDisplayElement: document.getElementById("level-display"),
  starsDisplayElement: document.getElementById("stars-display"),
  levelCompleteElement: document.getElementById("level-complete"),
  completeTimeElement: document.getElementById("complete-time"),
  remainingLivesElement: document.getElementById("remaining-lives"),
  collectedStarsElement: document.getElementById("collected-stars"),
  nextLevelBtn: document.getElementById("next-level-btn"),
  gameOverElement: document.getElementById("game-over"),
  gameOverTimeElement: document.getElementById("game-over-time"),
  reachedLevelElement: document.getElementById("reached-level"),
  finalStarsElement: document.getElementById("final-stars"),
  restartBtn: document.getElementById("restart-btn"),
  quizModal: document.getElementById("quiz-modal"),
  quizQuestion: document.getElementById("quiz-question"),
  quizOptions: document.getElementById("quiz-options"),
  quizResult: document.getElementById("quiz-result"),
  controlUp: document.getElementById("control-up"),
  controlDown: document.getElementById("control-down"),
  controlLeft: document.getElementById("control-left"),
  controlRight: document.getElementById("control-right"),
}

// UI 更新函數
function updateLevelDisplay() {
  elements.levelDisplayElement.textContent = `第 ${state.level} 關`
}

function updateStarsDisplay() {
  elements.starsDisplayElement.textContent = `⭐ ${state.collectedStars}`
}

function updateTimerDisplay() {
  const minutes = Math.floor(state.remainingTime / 60)
  const seconds = state.remainingTime % 60
  elements.timerElement.textContent = `${minutes.toString().padStart(2, "0")}:${seconds.toString().padStart(2, "0")}`
}

function updateLives() {
  for (let i = 0; i < elements.livesElement.length; i++) {
    elements.livesElement[i].style.display = i < state.lives ? "inline-block" : "none"
  }
}

function updatePlayerPosition() {
  const cellSize = elements.gameBoard.clientWidth / GRID_SIZE
  elements.playerElement.style.transition = "left 0.28s linear, top 0.28s linear"
  elements.playerElement.style.left = state.player.col * cellSize + (cellSize - 35) / 2 + "px"
  elements.playerElement.style.top = state.player.row * cellSize + (cellSize - 35) / 2 + "px"
}

// 確保 levelComplete 函數顯示正確的星星總數
function showLevelComplete(currentLevelStars) {
  elements.completeTimeElement.textContent = elements.timerElement.textContent
  elements.remainingLivesElement.textContent = state.lives
  elements.collectedStarsElement.textContent = `${currentLevelStars} (總計: ${state.collectedStars})`
  elements.levelCompleteElement.style.display = "flex"
}

function showGameOver() {
  elements.gameOverTimeElement.textContent = elements.timerElement.textContent
  elements.reachedLevelElement.textContent = state.level
  elements.finalStarsElement.textContent = state.collectedStars
  elements.gameOverElement.style.display = "flex"
}

function hideEndScreens() {
  elements.levelCompleteElement.style.display = "none"
  elements.gameOverElement.style.display = "none"
}

function updateKeyHint() {
  const keyHint = elements.levelCompleteElement.querySelector(".key-hint")
  if (keyHint) keyHint.style.color = "#fff"
}

function playEffect(effectType) {
  if (state.isEffectPlaying) return

  state.isEffectPlaying = true
  elements.playerElement.classList.remove("shake-effect", "rotate-effect", "flash-effect")
  elements.playerElement.classList.add(`${effectType}-effect`)

  setTimeout(() => {
    elements.playerElement.classList.remove(`${effectType}-effect`)
    state.isEffectPlaying = false
  }, EFFECT_DURATION)
}

// 遊戲狀態管理
function resetGameState(keepLevelAndStars = false) {
  const currentLevel = keepLevelAndStars ? state.level : 1
  const currentStars = keepLevelAndStars ? state.collectedStars : 0
  const currentLives = keepLevelAndStars ? state.lives : 3

  state.maze = []
  state.ghosts = []
  state.stars = []
  state.heart = null
  state.gameRunning = true
  state.isPaused = false
  state.remainingTime = COUNTDOWN_TIME // 重置倒數時間為120秒
  state.gameState = "running"
  state.isEffectPlaying = false
  state.collisionCooldown = false
  state.canProceedToNextLevel = false
  state.isGhostCollisionChecking = false
  state.isPlayerMoving = false
  state.lastCollisionTime = 0 // 重置上次碰撞時間

  state.level = currentLevel
  state.collectedStars = currentStars
  state.lives = currentLives

  updateLevelDisplay()
  updateLives()
  updateStarsDisplay()
  updateTimerDisplay() // 更新計時器顯示
}

function pauseGame() {
  state.isPaused = true
}

function resumeGame() {
  state.isPaused = false
}

function gameOver() {
  state.gameRunning = false
  state.gameState = "over"
  stopAllTimers()
  showGameOver()
}

function levelComplete() {
  state.gameRunning = false
  state.gameState = "complete"
  stopAllTimers()

  const currentLevelStars = state.stars.filter((s) => s.collected).length
  showLevelComplete(currentLevelStars)

  setTimeout(() => {
    state.canProceedToNextLevel = true
    updateKeyHint()
  }, 1000)
}

function nextLevel() {
  if (state.canProceedToNextLevel) {
    state.level++
    initGame(true)
  }
}

function restart() {
  state.level = 1
  state.collectedStars = 0
  state.lives = 3
  initGame(false)
}

function loseLife() {
  state.lives--
  updateLives()
  if (state.lives <= 0) gameOver()
}

// 計時器函數
function startGameTimer() {
  startTimer(
    "gameTimer",
    () => {
      if (state.gameRunning && !state.isPaused) {
        state.remainingTime--
        updateTimerDisplay()

        // 當時間歸零時結束遊戲
        if (state.remainingTime <= 0) {
          gameOver()
        }
      }
    },
    1000,
  )
}

function startQuizTimer(star) {
  const timerBar = document.getElementById("quiz-timer-bar")
  state.quizTimeRemaining = QUIZ_TIME_LIMIT
  timerBar.style.width = "100%"
  timerBar.classList.remove("warning", "danger")

  startTimer(
    "quizTimer",
    () => {
      state.quizTimeRemaining -= 0.1
      const percentRemaining = (state.quizTimeRemaining / QUIZ_TIME_LIMIT) * 100
      timerBar.style.width = `${percentRemaining}%`

      if (percentRemaining <= 30 && percentRemaining > 15) {
        timerBar.classList.add("warning")
        timerBar.classList.remove("danger")
      } else if (percentRemaining <= 15) {
        timerBar.classList.remove("warning")
        timerBar.classList.add("danger")
      }

      if (state.quizTimeRemaining <= 0) {
        stopTimer("quizTimer")
        const correctAnswer = star.english
        const options = document.querySelectorAll(".quiz-option")
        let incorrectOption = null

        for (const option of options) {
          if (option.dataset.value !== correctAnswer) {
            incorrectOption = option.dataset.value
            break
          }
        }

        handleOptionSelection(incorrectOption, correctAnswer, star)
      }
    },
    100,
  )
}

// 迷宮生成與渲染
function generateMaze() {
  elements.mazeElement.innerHTML = ""
  elements.mazeElement.style.gridTemplateColumns = `repeat(${GRID_SIZE}, 1fr)`
  elements.mazeElement.style.gridTemplateRows = `repeat(${GRID_SIZE}, 1fr)`

  for (let row = 0; row < GRID_SIZE; row++) {
    state.maze[row] = []
    for (let col = 0; col < GRID_SIZE; col++) {
      state.maze[row][col] = 1
    }
  }

  generateSimpleMaze()

  for (let i = 0; i < GRID_SIZE; i++) {
    state.maze[0][i] = 1
    state.maze[GRID_SIZE - 1][i] = 1
    state.maze[i][0] = 1
    state.maze[i][GRID_SIZE - 1] = 1
  }

  renderMaze()
}

function generateSimpleMaze() {
  const startRow = Math.floor(GRID_SIZE / 2)
  const startCol = Math.floor(GRID_SIZE / 2)
  state.maze[startRow][startCol] = 0

  const stack = [{ row: startRow, col: startCol }]
  const visited = new Set()
  visited.add(`${startRow},${startCol}`)

  while (stack.length > 0) {
    const current = stack[stack.length - 1]
    const directions = [
      [-2, 0],
      [0, 2],
      [2, 0],
      [0, -2],
    ].sort(() => Math.random() - 0.5)
    let foundNext = false

    for (const [dr, dc] of directions) {
      const newRow = current.row + dr
      const newCol = current.col + dc

      if (
        newRow > 0 &&
        newRow < GRID_SIZE - 1 &&
        newCol > 0 &&
        newCol < GRID_SIZE - 1 &&
        !visited.has(`${newRow},${newCol}`)
      ) {
        state.maze[current.row + dr / 2][current.col + dc / 2] = 0
        state.maze[newRow][newCol] = 0
        visited.add(`${newRow},${newCol}`)
        stack.push({ row: newRow, col: newCol })
        foundNext = true
        break
      }
    }

    if (!foundNext) stack.pop()
  }

  const openings = 3 + Math.floor(state.level / 2)
  for (let i = 0; i < openings; i++) {
    const row = 1 + Math.floor(Math.random() * (GRID_SIZE - 2))
    const col = 1 + Math.floor(Math.random() * (GRID_SIZE - 2))
    if (state.maze[row][col] === 1) state.maze[row][col] = 0
  }
}

function renderMaze(keepColor = false) {
  const fragment = document.createDocumentFragment()

  for (let row = 0; row < GRID_SIZE; row++) {
    for (let col = 0; col < GRID_SIZE; col++) {
      const cell = document.createElement("div")
      cell.className = state.maze[row][col] === 1 ? "cell wall" : "cell path"
      cell.style.gridRow = row + 1
      cell.style.gridColumn = col + 1
      cell.dataset.row = row
      cell.dataset.col = col
      fragment.appendChild(cell)
    }
  }

  elements.mazeElement.innerHTML = ""
  elements.mazeElement.appendChild(fragment)

  if (!keepColor) {
    const colors = ["#8A2BE2", "#4169E1", "#00BFFF", "#32CD32", "#FF6347"]
    state.currentBackgroundColor = colors[Math.floor(Math.random() * colors.length)]
  }

  elements.gameBoard.style.backgroundColor = state.currentBackgroundColor
  document.querySelectorAll(".path").forEach((cell) => {
    cell.style.backgroundColor = state.currentBackgroundColor
  })
}

// 玩家相關函數
function placePlayer() {
  let placed = false
  while (!placed) {
    const row = Math.floor(Math.random() * (GRID_SIZE - 2)) + 1
    const col = Math.floor(Math.random() * (GRID_SIZE - 2)) + 1

    if (state.maze[row][col] === 0) {
      state.player.row = row
      state.player.col = col
      state.initialPlayerPosition.row = row
      state.initialPlayerPosition.col = col
      updatePlayerPosition()
      placed = true
    }
  }
}

function movePlayer(direction) {
  if (!state.gameRunning || state.isPaused) return

  if (state.currentDirection === direction && state.autoMoveInterval) return

  if (
    (state.currentDirection === "up" && direction === "down") ||
    (state.currentDirection === "down" && direction === "up") ||
    (state.currentDirection === "left" && direction === "right") ||
    (state.currentDirection === "right" && direction === "left")
  ) {
    if (state.autoMoveInterval) {
      clearInterval(state.autoMoveInterval)
      state.autoMoveInterval = null
    }
  }

  state.currentDirection = direction
  startAutoMove()
}

function startAutoMove() {
  if (!timers.gameTimer || state.remainingTime === COUNTDOWN_TIME) {
    startGameTimer()
  }

  const canMove = performMove()

  if (!canMove && state.autoMoveInterval) {
    return
  }

  if (state.autoMoveInterval) {
    clearInterval(state.autoMoveInterval)
  }

  state.autoMoveInterval = setInterval(() => {
    if (!state.isPlayerMoving) {
      performMove()
    }
  }, PLAYER_MOVE_INTERVAL)
}

function performMove() {
  if (!state.gameRunning || !state.currentDirection || state.isPaused || state.isPlayerMoving) return false

  let newRow = state.player.row
  let newCol = state.player.col

  switch (state.currentDirection) {
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

  if (newRow >= 0 && newRow < GRID_SIZE && newCol >= 0 && newCol < GRID_SIZE && state.maze[newRow][newCol] === 0) {
    state.isPlayerMoving = true

    state.player.row = newRow
    state.player.col = newCol
    updatePlayerPosition()

    setTimeout(() => {
      const starCollision = checkStarCollision()
      const heartCollision = checkHeartCollision()

      if (!starCollision && !heartCollision) {
        checkGhostCollision()
      }

      state.isPlayerMoving = false
    }, 280)

    return true
  }
  return false
}

function resetPlayerPosition() {
  state.player.row = state.initialPlayerPosition.row
  state.player.col = state.initialPlayerPosition.col
  updatePlayerPosition()
}

// 鬼魂相關函數
function generateGhosts() {
  document.querySelectorAll(".ghost").forEach((ghost) => ghost.remove())

  state.ghosts.forEach((ghost) => {
    if (ghost.moveTimer) clearInterval(ghost.moveTimer)
  })

  state.ghosts = []

  let ghostCount = 0
  if (state.settings.difficulty === "try") ghostCount = 1
  else if (state.settings.difficulty === "challenge") ghostCount = 2

  if (ghostCount === 0) return

  const quadrants = [
    { name: "左上", minRow: 1, maxRow: Math.floor(GRID_SIZE / 2), minCol: 1, maxCol: Math.floor(GRID_SIZE / 2) },
    {
      name: "右上",
      minRow: 1,
      maxRow: Math.floor(GRID_SIZE / 2),
      minCol: Math.floor(GRID_SIZE / 2) + 1,
      maxCol: GRID_SIZE - 2,
    },
    {
      name: "左下",
      minRow: Math.floor(GRID_SIZE / 2) + 1,
      maxRow: GRID_SIZE - 2,
      minCol: 1,
      maxCol: Math.floor(GRID_SIZE / 2),
    },
    {
      name: "右下",
      minRow: Math.floor(GRID_SIZE / 2) + 1,
      maxRow: GRID_SIZE - 2,
      minCol: Math.floor(GRID_SIZE / 2) + 1,
      maxCol: GRID_SIZE - 2,
    },
  ]

  let playerQuadrant = "未知"
  for (const quadrant of quadrants) {
    if (
      state.player.row >= quadrant.minRow &&
      state.player.row <= quadrant.maxRow &&
      state.player.col >= quadrant.minCol &&
      state.player.col <= quadrant.maxCol
    ) {
      playerQuadrant = quadrant.name
      break
    }
  }

  const shuffledQuadrants = [...quadrants].sort(() => Math.random() - 0.5)

  for (let i = 0; i < ghostCount; i++) {
    let placed = false
    let ghostRow, ghostCol, ghostQuadrant

    let selectedQuadrant = null
    for (const quadrant of shuffledQuadrants) {
      if (quadrant.name !== playerQuadrant) {
        selectedQuadrant = quadrant
        break
      }
    }

    if (!selectedQuadrant) selectedQuadrant = shuffledQuadrants[0]

    while (!placed) {
      ghostRow =
        Math.floor(Math.random() * (selectedQuadrant.maxRow - selectedQuadrant.minRow + 1)) + selectedQuadrant.minRow
      ghostCol =
        Math.floor(Math.random() * (selectedQuadrant.maxCol - selectedQuadrant.minCol + 1)) + selectedQuadrant.minCol

      if (state.maze[ghostRow][ghostCol] === 0) {
        placed = true
        ghostQuadrant = selectedQuadrant.name
      }
    }

    const ghost = document.createElement("div")
    ghost.className = "ghost"
    ghost.innerHTML = state.settings.ghostChar
    ghost.style.transition = "left 0.28s linear, top 0.28s linear"
    const cellSize = elements.gameBoard.clientWidth / GRID_SIZE
    ghost.style.left = ghostCol * cellSize + (cellSize - 35) / 2 + "px"
    ghost.style.top = ghostRow * cellSize + (cellSize - 35) / 2 + "px"
    elements.gameBoard.appendChild(ghost)

    state.ghosts.push({
      element: ghost,
      row: ghostRow,
      col: ghostCol,
      quadrant: ghostQuadrant,
      direction: Math.floor(Math.random() * 4),
      moveTimer: null,
      isMoving: false,
      nextDirection: null,
    })

    startGhostMovement(state.ghosts[state.ghosts.length - 1], i)

    if (i < ghostCount - 1) {
      const index = shuffledQuadrants.indexOf(selectedQuadrant)
      if (index > -1) shuffledQuadrants.splice(index, 1)
    }
  }
}

function startGhostMovement(ghost, ghostIndex) {
  if (ghost.moveTimer) clearInterval(ghost.moveTimer)

  moveGhost(ghost)

  ghost.moveTimer = setInterval(() => {
    if (!state.gameRunning || state.isPaused) return

    if (!ghost.isMoving) {
      moveGhost(ghost)
    }
  }, GHOST_MOVE_INTERVAL)
}

function moveGhost(ghost) {
  if (state.isPaused) return

  ghost.isMoving = true

  const directions = [
    [-1, 0],
    [0, 1],
    [1, 0],
    [0, -1],
  ]
  const prevRow = ghost.row
  const prevCol = ghost.col

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
      state.maze[checkRow][checkCol] === 0
    ) {
      validDirections.push(i)
    }
  }

  if (validDirections.length > 1 && Math.random() < 0.15) {
    ghost.direction = validDirections[Math.floor(Math.random() * validDirections.length)]
  }

  const newRow = ghost.row + directions[ghost.direction][0]
  const newCol = ghost.col + directions[ghost.direction][1]

  if (
    newRow > 0 &&
    newRow < GRID_SIZE - 1 &&
    newCol > 0 &&
    newCol < GRID_SIZE - 1 &&
    state.maze[newRow][newCol] === 0
  ) {
    ghost.row = newRow
    ghost.col = newCol
  } else {
    if (validDirections.length > 0) {
      const oppositeDirection = (ghost.direction + 2) % 4
      const nonOppositeDirections = validDirections.filter((dir) => dir !== oppositeDirection)

      if (nonOppositeDirections.length > 0 && Math.random() < 0.95) {
        ghost.direction = nonOppositeDirections[Math.floor(Math.random() * nonOppositeDirections.length)]
      } else {
        ghost.direction = validDirections[Math.floor(Math.random() * validDirections.length)]
      }

      const [dr, dc] = directions[ghost.direction]
      const nextRow = ghost.row + dr
      const nextCol = ghost.col + dc

      if (
        nextRow > 0 &&
        nextRow < GRID_SIZE - 1 &&
        nextCol > 0 &&
        nextCol < GRID_SIZE - 1 &&
        state.maze[nextRow][nextCol] === 0
      ) {
        ghost.row = nextRow
        ghost.col = nextCol
      }
    }
  }

  const cellSize = elements.gameBoard.clientWidth / GRID_SIZE
  ghost.element.style.left = ghost.col * cellSize + (cellSize - 35) / 2 + "px"
  ghost.element.style.top = ghost.row * cellSize + (cellSize - 35) / 2 + "px"

  setTimeout(() => {
    ghost.isMoving = false
    // 移動完成後檢查碰撞
    if (!state.isPaused) {
      checkGhostCollision()
    }
  }, 280)
}

// 星星相關函數
function generateStars() {
  document.querySelectorAll(".star").forEach((star) => star.remove())
  state.stars = []

  const starCount = state.settings.optionsCount

  const quadrants = [
    { name: "左上", minRow: 1, maxRow: Math.floor(GRID_SIZE / 2), minCol: 1, maxCol: Math.floor(GRID_SIZE / 2) },
    {
      name: "右上",
      minRow: 1,
      maxRow: Math.floor(GRID_SIZE / 2),
      minCol: Math.floor(GRID_SIZE / 2) + 1,
      maxCol: GRID_SIZE - 2,
    },
    {
      name: "左下",
      minRow: Math.floor(GRID_SIZE / 2) + 1,
      maxRow: GRID_SIZE - 2,
      minCol: 1,
      maxCol: Math.floor(GRID_SIZE / 2),
    },
    {
      name: "右下",
      minRow: Math.floor(GRID_SIZE / 2) + 1,
      maxRow: GRID_SIZE - 2,
      minCol: Math.floor(GRID_SIZE / 2) + 1,
      maxCol: GRID_SIZE - 2,
    },
  ]

  const shuffledQuadrants = [...quadrants].sort(() => Math.random() - 0.5)
  const shuffledWordPairs = [...wordPairs].sort(() => Math.random() - 0.5)
  const selectedWordPairs = shuffledWordPairs.slice(0, starCount)

  for (let i = 0; i < starCount; i++) {
    let placed = false
    let starRow, starCol

    const selectedQuadrant = shuffledQuadrants[i % shuffledQuadrants.length]

    while (!placed) {
      starRow =
        Math.floor(Math.random() * (selectedQuadrant.maxRow - selectedQuadrant.minRow + 1)) + selectedQuadrant.minRow
      starCol =
        Math.floor(Math.random() * (selectedQuadrant.maxCol - selectedQuadrant.minCol + 1)) + selectedQuadrant.minCol

      if (state.maze[starRow][starCol] === 0 && !state.stars.some((s) => s.row === starRow && s.col === starCol)) {
        placed = true
      }
    }

    const star = document.createElement("div")
    star.className = "star"
    star.innerHTML = "⭐"
    const cellSize = elements.gameBoard.clientWidth / GRID_SIZE
    star.style.left = starCol * cellSize + (cellSize - 30) / 2 + "px"
    star.style.top = starRow * cellSize + (cellSize - 30) / 2 + "px"
    elements.gameBoard.appendChild(star)

    state.stars.push({
      element: star,
      row: starRow,
      col: starCol,
      chinese: selectedWordPairs[i].chinese,
      english: selectedWordPairs[i].english,
      collected: false,
    })
  }
}

function generateHeart() {
  // 如果玩家生命值已滿（等於3），不生成心
  if (state.lives >= 3) return

  // 移除任何現有的心
  document.querySelectorAll(".heart-item").forEach((heart) => heart.remove())

  // 如果已經有心在狀態中，先清除
  if (state.heart && state.heart.element) {
    state.heart.element.remove()
    state.heart = null
  }

  // 尋找適合放置心的位置
  const placed = false
  let heartRow, heartCol
  const attempts = 0
  const maxAttempts = 100 // 防止無限循環

  // 收集所有可用的路徑位置
  const availablePaths = []
  for (let row = 1; row < GRID_SIZE - 1; row++) {
    for (let col = 1; col < GRID_SIZE - 1; col++) {
      // 確保位置是路徑且不是玩家起始位置，且不與星星重疊
      if (
        state.maze[row][col] === 0 &&
        !(row === state.initialPlayerPosition.row && col === state.initialPlayerPosition.col) &&
        !state.stars.some((s) => s.row === row && s.col === col)
      ) {
        availablePaths.push({ row, col })
      }
    }
  }

  // 如果沒有可用路徑，則退出
  if (availablePaths.length === 0) {
    console.log("沒有可用的路徑來放置心形道具")
    return
  }

  // 從可用路徑中隨機選擇一個位置
  const randomIndex = Math.floor(Math.random() * availablePaths.length)
  const selectedPath = availablePaths[randomIndex]
  heartRow = selectedPath.row
  heartCol = selectedPath.col

  // 創建心元素
  const heart = document.createElement("div")
  heart.className = "heart-item"
  heart.innerHTML = "❤️"
  heart.style.position = "absolute"
  heart.style.width = "30px"
  heart.style.height = "30px"
  heart.style.fontSize = "24px"
  heart.style.display = "flex"
  heart.style.justifyContent = "center"
  heart.style.alignItems = "center"
  heart.style.zIndex = "3"
  heart.style.animation = "pulse 1.5s infinite alternate"

  const cellSize = elements.gameBoard.clientWidth / GRID_SIZE
  heart.style.left = heartCol * cellSize + (cellSize - 30) / 2 + "px"
  heart.style.top = heartRow * cellSize + (cellSize - 30) / 2 + "px"
  elements.gameBoard.appendChild(heart)

  // 將心的位置儲存在狀態中
  state.heart = {
    element: heart,
    row: heartRow,
    col: heartCol,
    collected: false,
  }

  console.log("心形道具已生成在路徑上，位置：", heartRow, heartCol)
}

function collectStar(star) {
  star.collected = true
  if (star.element) star.element.remove()

  state.collectedStars++
  updateStarsDisplay()

  if (state.stars.every((s) => s.collected)) {
    levelComplete()
  }
}

// 碰撞檢測函數
function checkStarCollision() {
  for (const star of state.stars) {
    if (star.collected) continue

    if (state.player.row === star.row && state.player.col === star.col) {
      showQuizModal(star)
      return true
    }
  }
  return false
}

function checkHeartCollision() {
  if (!state.heart || state.heart.collected) return false

  if (state.player.row === state.heart.row && state.player.col === state.heart.col) {
    collectHeart()
    return true
  }
  return false
}

function collectHeart() {
  if (!state.heart || state.heart.collected) return

  state.heart.collected = true
  if (state.heart.element) state.heart.element.remove()

  // 增加生命值
  state.lives++
  updateLives()

  // 播放效果
  playEffect("rotate")

  // 顯示提示訊息（可選）
  const message = document.createElement("div")
  message.textContent = "+1 生命值"
  message.style.position = "absolute"
  message.style.color = "red"
  message.style.fontWeight = "bold"
  message.style.fontSize = "18px"
  message.style.top = "10px"
  message.style.left = "50%"
  message.style.transform = "translateX(-50%)"
  message.style.zIndex = "100"
  message.style.backgroundColor = "rgba(255, 255, 255, 0.7)"
  message.style.padding = "5px 10px"
  message.style.borderRadius = "5px"
  elements.gameBoard.appendChild(message)

  setTimeout(() => {
    message.remove()
  }, 1500)
}

function checkGhostCollision() {
  // 如果在冷卻期間或遊戲暫停，不檢查碰撞
  if (state.isPaused) return false

  // 檢查冷卻時間
  const currentTime = Date.now()
  if (currentTime - state.lastCollisionTime < COLLISION_COOLDOWN) {
    return false
  }

  // 檢查所有鬼魂是否與玩家碰撞
  for (const ghost of state.ghosts) {
    if (isGhostCollidingWithPlayer(ghost)) {
      return true
    }
  }
  return false
}

function isGhostCollidingWithPlayer(ghost) {
  // 確保玩家和鬼魂在同一格子
  if (state.player.row === ghost.row && state.player.col === ghost.col) {
    // 記錄碰撞時間並處理碰撞
    state.lastCollisionTime = Date.now()
    handleGhostCollision()
    return true
  }
  return false
}

function handleGhostCollision() {
  // 停止自動移動
  if (state.autoMoveInterval) {
    clearInterval(state.autoMoveInterval)
    state.autoMoveInterval = null
    state.currentDirection = null
  }

  // 播放碰撞效果並扣除生命值
  playEffect("shake")
  loseLife()

  // 如果還有生命，重置玩家位置
  if (state.lives > 0) {
    resetPlayerPosition()
  }
}

function startGlobalCollisionCheck() {
  stopTimer("globalCollisionCheck")

  startTimer(
    "globalCollisionCheck",
    () => {
      if (state.gameRunning && !state.isPaused) {
        checkGhostCollision()
      }
    },
    COLLISION_CHECK_INTERVAL,
  )
}

// 遊戲初始化
function initGame(keepLevelAndStars = false) {
  resetGameState(keepLevelAndStars)

  if (state.autoMoveInterval) {
    clearInterval(state.autoMoveInterval)
    state.autoMoveInterval = null
    state.currentDirection = null
  }

  stopAllTimers() // 確保所有計時器被清除
  elements.timerElement.textContent = "02:00" // 顯示初始時間 2 分鐘

  generateMaze()
  placePlayer()
  generateGhosts()
  generateStars()
  generateHeart()

  hideQuizModal()
  hideEndScreens()

  elements.playerElement.innerHTML = state.settings.playerChar

  resizeGameBoard()
  startGlobalCollisionCheck()
}

// 問答相關函數
// 修改 showQuizModal 函數，讓問答介面占滿整個視窗
function showQuizModal(star) {
  state.currentQuizOptionIndex = 0
  pauseGame()

  // 設定問題文字
  elements.quizQuestion.textContent = `「${star.chinese}」的英文是什麼？`
  elements.quizOptions.innerHTML = ""

  const correctAnswer = star.english
  const allOptions = [correctAnswer]

  const otherWords = wordPairs.filter((word) => word.english !== correctAnswer)
  const shuffledOtherWords = [...otherWords].sort(() => Math.random() - 0.5)

  for (let i = 0; i < 3; i++) {
    if (shuffledOtherWords[i]) {
      allOptions.push(shuffledOtherWords[i].english)
    }
  }

  const shuffledOptions = [...allOptions].sort(() => Math.random() - 0.5)
  const numberEmojis = ["1️⃣", "2️⃣", "3️⃣", "4️⃣"]

  shuffledOptions.forEach((option, index) => {
    const optionButton = document.createElement("button")
    optionButton.className = "quiz-option"
    optionButton.innerHTML = `<span class="option-number">${numberEmojis[index]}</span> ${option}`
    optionButton.dataset.value = option
    optionButton.dataset.index = index

    optionButton.addEventListener("click", () => {
      handleOptionSelection(option, correctAnswer, star)
    })

    elements.quizOptions.appendChild(optionButton)
  })

  updateSelectedOption()

  // 修改問答介面樣式，使其占滿整個視窗
  elements.quizModal.style.display = "flex"
  elements.quizModal.style.position = "fixed" // 改為固定定位
  elements.quizModal.style.top = "0"
  elements.quizModal.style.left = "0"
  elements.quizModal.style.width = "100vw" // 使用視窗寬度
  elements.quizModal.style.height = "100vh" // 使用視窗高度
  elements.quizModal.style.zIndex = "1000" // 確保在最上層

  // 調整問答容器的大小
  elements.quizContainer = document.getElementById("quiz-container")
  elements.quizContainer.style.maxWidth = "90vw" // 在行動裝置上使用更大的寬度
  elements.quizContainer.style.width = "500px" // 在桌面版上限制最大寬度
  elements.quizContainer.style.padding = "30px" // 增加內部間距

  // 增加問題和選項的字體大小
  elements.quizQuestion.style.fontSize = "24px" // 增加問題字體大小
  elements.quizQuestion.style.marginBottom = "30px" // 增加問題下方間距

  // 調整選項樣式
  document.querySelectorAll(".quiz-option").forEach((option) => {
    option.style.fontSize = "20px" // 增加選項字體大小
    option.style.padding = "15px 15px 15px 60px" // 增加選項內部間距
  })

  document.querySelectorAll(".option-number").forEach((number) => {
    number.style.fontSize = "22px" // 增加選項編號字體大小
  })

  elements.quizResult.textContent = ""
  elements.quizResult.className = "quiz-result"
  elements.quizResult.style.fontSize = "22px" // 增加結果字體大小
  elements.quizResult.style.marginTop = "20px" // 增加結果上方間距

  document.addEventListener("keydown", handleQuizKeydown)
  startQuizTimer(star)
}

// 修改 hideQuizModal 函數，重置問答介面樣式
function hideQuizModal() {
  elements.quizModal.style.display = "none"

  // 重置問答介面樣式
  elements.quizModal.style.position = ""
  elements.quizModal.style.top = ""
  elements.quizModal.style.left = ""
  elements.quizModal.style.width = ""
  elements.quizModal.style.height = ""

  document.removeEventListener("keydown", handleQuizKeydown)
  stopTimer("quizTimer")
}

function handleOptionSelection(selectedOption, correctAnswer, star) {
  stopTimer("quizTimer")

  document.querySelectorAll(".quiz-option").forEach((btn) => {
    const btnValue = btn.dataset.value
    if (btnValue === correctAnswer) {
      btn.classList.add("correct-option")
    } else if (btnValue === selectedOption && selectedOption !== correctAnswer) {
      btn.classList.add("incorrect-option")
    }
  })

  if (selectedOption === correctAnswer) {
    elements.quizResult.textContent = "答對了！"
    elements.quizResult.className = "quiz-result correct"

    collectStar(star)

    setTimeout(() => {
      hideQuizModal()
      resumeGame()
    }, 800)
  } else {
    elements.quizResult.textContent = "答錯了！正確答案是：" + correctAnswer
    elements.quizResult.className = "quiz-result incorrect"

    loseLife()

    setTimeout(() => {
      hideQuizModal()
      resumeGame()

      if (state.lives > 0) {
        resetPlayerPosition()
      }
    }, 1500)
  }

  document.querySelectorAll(".quiz-option").forEach((btn) => {
    btn.disabled = true
  })

  document.removeEventListener("keydown", handleQuizKeydown)
}

function handleQuizKeydown(event) {
  if (!state.isPaused || elements.quizModal.style.display !== "flex") return

  const options = document.querySelectorAll(".quiz-option")
  if (options.length === 0) return

  switch (event.key) {
    case "ArrowUp":
      state.currentQuizOptionIndex = (state.currentQuizOptionIndex - 1 + options.length) % options.length
      updateSelectedOption()
      event.preventDefault()
      break
    case "ArrowDown":
      state.currentQuizOptionIndex = (state.currentQuizOptionIndex + 1) % options.length
      updateSelectedOption()
      event.preventDefault()
      break
    case "Enter":
      if (!options[state.currentQuizOptionIndex].disabled) {
        const selectedOption = options[state.currentQuizOptionIndex].dataset.value
        const star = state.stars.find((s) => !s.collected && state.player.row === s.row && state.player.col === s.col)
        if (star) {
          handleOptionSelection(selectedOption, star.english, star)
        }
      }
      event.preventDefault()
      break
    case "1":
    case "2":
    case "3":
    case "4":
      const numIndex = Number.parseInt(event.key) - 1
      if (numIndex >= 0 && numIndex < options.length && !options[numIndex].disabled) {
        state.currentQuizOptionIndex = numIndex
        updateSelectedOption()

        setTimeout(() => {
          const selectedOption = options[numIndex].dataset.value
          const star = state.stars.find((s) => !s.collected && state.player.row === s.row && state.player.col === s.col)
          if (star) {
            handleOptionSelection(selectedOption, star.english, star)
          }
        }, 100)
      }
      event.preventDefault()
      break
  }
}

function updateSelectedOption() {
  const options = document.querySelectorAll(".quiz-option")
  options.forEach((option, index) => {
    if (index === state.currentQuizOptionIndex) {
      option.classList.add("selected-option")
    } else {
      option.classList.remove("selected-option")
    }
  })
}

// 設定相關函數
function loadSettings() {
  try {
    const savedSettings = localStorage.getItem("mazeGameSettings")
    if (savedSettings) {
      const settings = JSON.parse(savedSettings)

      if (settings.playerChar) {
        state.settings.playerChar = settings.playerChar
        updateCharacterSelection(
          "#player-selection .character-item, #expanded-player-content .character-item",
          settings.playerChar,
        )
      }

      if (settings.ghostChar) {
        state.settings.ghostChar = settings.ghostChar
        updateCharacterSelection(
          "#ghost-selection .character-item, #expanded-ghost-content .character-item",
          settings.ghostChar,
        )
      }

      if (settings.difficulty) {
        state.settings.difficulty = settings.difficulty
        updateRadioSelection('input[name="difficulty"]', settings.difficulty)
      }

      if (settings.optionsCount) {
        state.settings.optionsCount = settings.optionsCount
        updateRadioSelection('input[name="options"]', settings.optionsCount.toString())
      }

      console.log("設定已從 localStorage 加載")
    }
  } catch (error) {
    console.error("加載設定時出錯:", error)
  }
}

function updateCharacterSelection(selector, value) {
  document.querySelectorAll(selector).forEach((item) => {
    if (item.getAttribute("data-char") === value) {
      item.classList.add("selected")
    } else {
      item.classList.remove("selected")
    }
  })
}

function updateRadioSelection(selector, value) {
  document.querySelectorAll(selector).forEach((radio) => {
    if (radio.value === value) {
      radio.checked = true
    }
  })
}

function saveSettings() {
  try {
    localStorage.setItem("mazeGameSettings", JSON.stringify(state.settings))
    console.log("設定已保存到 localStorage")
  } catch (error) {
    console.error("保存設定時出錯:", error)
  }
}

// 遊戲調整大小
function resizeGameBoard() {
  const boardWidth = elements.gameBoard.clientWidth
  const cellSize = boardWidth / GRID_SIZE

  elements.playerElement.style.transition = "left 0.28s linear, top 0.28s linear"
  elements.playerElement.style.left = state.player.col * cellSize + (cellSize - 35) / 2 + "px"
  elements.playerElement.style.top = state.player.row * cellSize + (cellSize - 35) / 2 + "px"

  state.ghosts.forEach((ghost) => {
    if (ghost.element) {
      ghost.element.style.transition = "left 0.28s linear, top 0.28s linear"
      ghost.element.style.left = ghost.col * cellSize + (cellSize - 35) / 2 + "px"
      ghost.element.style.top = ghost.row * cellSize + (cellSize - 35) / 2 + "px"
    }
  })

  state.stars.forEach((star) => {
    if (star.element) {
      star.element.style.left = star.col * cellSize + (cellSize - 30) / 2 + "px"
      star.element.style.top = star.row * cellSize + (cellSize - 30) / 2 + "px"
    }
  })

  if (state.heart && state.heart.element) {
    state.heart.element.style.left = state.heart.col * cellSize + (cellSize - 30) / 2 + "px"
    state.heart.element.style.top = state.heart.row * cellSize + (cellSize - 30) / 2 + "px"
  }

  if (state.maze.length > 0) {
    renderMaze(true)
  }

  // 重新啟動碰撞檢測計時器，確保正確同步
  startGlobalCollisionCheck()
}

// 初始化事件監聽
function initEventListeners() {
  document.addEventListener("keydown", (event) => {
    if (state.gameState === "running" && !state.isPaused) {
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
    } else if (state.gameState === "complete") {
      if (state.canProceedToNextLevel) nextLevel()
    } else if (state.gameState === "over") {
      restart()
    }
  })

  elements.controlUp.addEventListener("touchstart", (e) => {
    e.preventDefault()
    if (!state.isPaused) movePlayer("up")
  })

  elements.controlDown.addEventListener("touchstart", (e) => {
    e.preventDefault()
    if (!state.isPaused) movePlayer("down")
  })

  elements.controlLeft.addEventListener("touchstart", (e) => {
    e.preventDefault()
    if (!state.isPaused) movePlayer("left")
  })

  elements.controlRight.addEventListener("touchstart", (e) => {
    e.preventDefault()
    if (!state.isPaused) movePlayer("right")
  })

  document.addEventListener(
    "touchstart",
    (e) => {
      if (e.touches.length > 1) e.preventDefault()
    },
    { passive: false },
  )

  elements.nextLevelBtn.addEventListener("click", nextLevel)
  elements.restartBtn.addEventListener("click", restart)

  const menuButton = document.getElementById("menu-button")
  const gameMenu = document.getElementById("game-menu")
  const closeMenuButton = document.getElementById("close-menu")
  const applySettingsButton = document.getElementById("apply-settings")

  const expandPlayerButton = document.getElementById("expand-player")
  const expandGhostButton = document.getElementById("expand-ghost")
  const expandedPlayerContent = document.getElementById("expanded-player-content")
  const expandedGhostContent = document.getElementById("expanded-ghost-content")
  const expandPlayerH3 = document.getElementById("expand-player-h3")
  const expandGhostH3 = document.getElementById("expand-ghost-h3")

  expandPlayerButton.addEventListener("click", () => {
    expandedPlayerContent.classList.toggle("show")
    expandPlayerButton.textContent = expandedPlayerContent.classList.contains("show") ? "▲" : "▼"
  })

  expandPlayerH3.addEventListener("click", () => {
    expandedPlayerContent.classList.toggle("show")
    expandPlayerButton.textContent = expandedPlayerContent.classList.contains("show") ? "▲" : "▼"
  })

  expandGhostButton.addEventListener("click", () => {
    expandedGhostContent.classList.toggle("show")
    expandGhostButton.textContent = expandedGhostContent.classList.contains("show") ? "▲" : "▼"
  })

  expandGhostH3.addEventListener("click", () => {
    expandedGhostContent.classList.toggle("show")
    expandGhostButton.textContent = expandedGhostContent.classList.contains("show") ? "▲" : "▼"
  })

  menuButton.addEventListener("click", () => {
    gameMenu.classList.toggle("open")
  })

  closeMenuButton.addEventListener("click", () => {
    gameMenu.classList.remove("open")
  })

  document
    .querySelectorAll("#player-selection .character-item, #expanded-player-content .character-item")
    .forEach((item) => {
      item.addEventListener("click", () => {
        document
          .querySelectorAll("#player-selection .character-item, #expanded-player-content .character-item")
          .forEach((i) => i.classList.remove("selected"))
        item.classList.add("selected")
      })
    })

  document
    .querySelectorAll("#ghost-selection .character-item, #expanded-ghost-content .character-item")
    .forEach((item) => {
      item.addEventListener("click", () => {
        document
          .querySelectorAll("#ghost-selection .character-item, #expanded-ghost-content .character-item")
          .forEach((i) => i.classList.remove("selected"))
        item.classList.add("selected")
      })
    })

  applySettingsButton.addEventListener("click", () => {
    const selectedPlayerItem = document.querySelector(
      "#player-selection .character-item.selected, #expanded-player-content .character-item.selected",
    )
    if (selectedPlayerItem) {
      state.settings.playerChar = selectedPlayerItem.getAttribute("data-char")
    }

    const selectedGhostItem = document.querySelector(
      "#ghost-selection .character-item.selected, #expanded-ghost-content .character-item.selected",
    )
    if (selectedGhostItem) {
      state.settings.ghostChar = selectedGhostItem.getAttribute("data-char")
    }

    const selectedDifficulty = document.querySelector('input[name="difficulty"]:checked')
    if (selectedDifficulty) {
      state.settings.difficulty = selectedDifficulty.value
    }

    const selectedOptionsCount = document.querySelector('input[name="options"]:checked')
    if (selectedOptionsCount) {
      state.settings.optionsCount = Number.parseInt(selectedOptionsCount.value)
    }

    saveSettings()
    gameMenu.classList.remove("open")
    restart()
  })

  document.addEventListener("click", (event) => {
    if (!gameMenu.contains(event.target) && !menuButton.contains(event.target) && gameMenu.classList.contains("open")) {
      gameMenu.classList.remove("open")
    }
  })

  window.addEventListener("resize", resizeGameBoard)
}

// 啟動遊戲
window.addEventListener("DOMContentLoaded", () => {
  loadSettings()
  initEventListeners()
  initGame()
})
