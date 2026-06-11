const GRID_SIZE = 20;
const STORAGE_KEY = "game-hub-snake-best";
const SPEEDS = {
  slow: { label: "慢速", delay: 150 },
  normal: { label: "普通", delay: 110 },
  fast: { label: "快速", delay: 78 }
};

const canvas = document.querySelector("#game");
const ctx = canvas.getContext("2d");
const scoreEl = document.querySelector("#score");
const bestScoreEl = document.querySelector("#best-score");
const lengthEl = document.querySelector("#length");
const streakEl = document.querySelector("#streak");
const statusEl = document.querySelector("#status");
const speedLabelEl = document.querySelector("#speed-label");
const overlayEl = document.querySelector("#overlay");
const overlayTitleEl = document.querySelector("#overlay-title");
const overlayTextEl = document.querySelector("#overlay-text");
const overlayActionButton = document.querySelector("#overlay-action");
const restartButton = document.querySelector("#restart");
const pauseButton = document.querySelector("#pause");
const controlButtons = document.querySelectorAll("[data-direction]");
const speedButtons = document.querySelectorAll("[data-speed]");

const state = {
  snake: [],
  food: { x: 14, y: 10 },
  direction: { x: 1, y: 0 },
  pendingDirection: { x: 1, y: 0 },
  score: 0,
  bestScore: readBestScore(),
  streak: 0,
  speed: "normal",
  status: "ready",
  timer: null,
  touchStart: null
};

function readBestScore() {
  try {
    return Number(localStorage.getItem(STORAGE_KEY)) || 0;
  } catch (error) {
    return 0;
  }
}

function saveBestScore(score) {
  if (window.GameHubProgress) {
    window.GameHubProgress.recordBest("snake", score);
  }

  try {
    localStorage.setItem(STORAGE_KEY, String(score));
  } catch (error) {
    return;
  }
}

function sameCell(first, second) {
  return first.x === second.x && first.y === second.y;
}

function directionForName(name) {
  const directions = {
    up: { x: 0, y: -1 },
    down: { x: 0, y: 1 },
    left: { x: -1, y: 0 },
    right: { x: 1, y: 0 }
  };

  return directions[name];
}

function isOpposite(first, second) {
  return first.x + second.x === 0 && first.y + second.y === 0;
}

function setDirection(name) {
  const nextDirection = directionForName(name);

  if (!nextDirection || isOpposite(nextDirection, state.direction)) {
    return;
  }

  state.pendingDirection = nextDirection;

  if (state.status === "ready") {
    start();
  }
}

function createInitialSnake() {
  return [
    { x: 8, y: 10 },
    { x: 7, y: 10 },
    { x: 6, y: 10 }
  ];
}

function isSnakeCell(cell, snake = state.snake) {
  return snake.some((part) => sameCell(part, cell));
}

function randomFood() {
  const openCells = [];

  for (let y = 0; y < GRID_SIZE; y += 1) {
    for (let x = 0; x < GRID_SIZE; x += 1) {
      const cell = { x, y };

      if (!isSnakeCell(cell)) {
        openCells.push(cell);
      }
    }
  }

  return openCells[Math.floor(Math.random() * openCells.length)] || { x: 0, y: 0 };
}

function updateBestScore() {
  if (state.score <= state.bestScore) {
    return;
  }

  state.bestScore = state.score;
  saveBestScore(state.bestScore);
}

function scoreForFood() {
  const baseScore = 10;
  const streakBonus = Math.min(state.streak, 8) * 2;

  return baseScore + streakBonus;
}

function resetGame() {
  stopTimer();
  state.snake = createInitialSnake();
  state.food = randomFood();
  state.direction = { x: 1, y: 0 };
  state.pendingDirection = { x: 1, y: 0 };
  state.score = 0;
  state.streak = 0;
  state.status = "ready";
  state.bestScore = readBestScore();

  showOverlay("贪吃蛇", "准备开始", "开始");
  render();
}

function start() {
  if (state.status === "running") {
    return;
  }

  if (state.status === "gameover") {
    resetGame();
  }

  state.status = "running";
  hideOverlay();
  startTimer();
  render();
}

function pause() {
  if (state.status !== "running") {
    return;
  }

  state.status = "paused";
  stopTimer();
  showOverlay("已暂停", "得分 " + state.score, "继续");
  render();
}

function resume() {
  if (state.status !== "paused") {
    return;
  }

  state.status = "running";
  hideOverlay();
  startTimer();
  render();
}

function gameOver() {
  state.status = "gameover";
  stopTimer();
  updateBestScore();
  showOverlay("游戏结束", "得分 " + state.score, "重开");
  render();
}

function startTimer() {
  stopTimer();
  state.timer = window.setInterval(tick, SPEEDS[state.speed].delay);
}

function stopTimer() {
  if (state.timer) {
    window.clearInterval(state.timer);
    state.timer = null;
  }
}

function nextHead() {
  const head = state.snake[0];

  return {
    x: head.x + state.pendingDirection.x,
    y: head.y + state.pendingDirection.y
  };
}

function isOutOfBounds(cell) {
  return cell.x < 0 || cell.x >= GRID_SIZE || cell.y < 0 || cell.y >= GRID_SIZE;
}

function tick() {
  if (state.status !== "running") {
    return;
  }

  state.direction = state.pendingDirection;

  const head = nextHead();
  const eatsFood = sameCell(head, state.food);
  const bodyToCheck = eatsFood ? state.snake : state.snake.slice(0, -1);

  if (isOutOfBounds(head) || isSnakeCell(head, bodyToCheck)) {
    gameOver();
    return;
  }

  state.snake.unshift(head);

  if (eatsFood) {
    state.streak += 1;
    state.score += scoreForFood();
    updateBestScore();
    state.food = randomFood();
  } else {
    state.snake.pop();
    state.streak = 0;
  }

  render();
}

function showOverlay(title, text, actionText) {
  overlayTitleEl.textContent = title;
  overlayTextEl.textContent = text;
  overlayActionButton.textContent = actionText;
  overlayEl.classList.remove("is-hidden");
}

function hideOverlay() {
  overlayEl.classList.add("is-hidden");
}

function statusText() {
  const labels = {
    ready: "准备开始",
    running: "进行中",
    paused: "已暂停",
    gameover: "游戏结束"
  };

  return labels[state.status];
}

function renderStats() {
  scoreEl.textContent = state.score;
  bestScoreEl.textContent = state.bestScore;
  lengthEl.textContent = state.snake.length;
  streakEl.textContent = state.streak;
  statusEl.textContent = statusText();
  speedLabelEl.textContent = SPEEDS[state.speed].label;
  pauseButton.textContent = state.status === "paused" ? "继续" : "暂停";
}

function resizeCanvasBuffer() {
  const rect = canvas.getBoundingClientRect();
  const scale = window.devicePixelRatio || 1;
  const nextSize = Math.max(320, Math.round(rect.width * scale));

  if (canvas.width !== nextSize || canvas.height !== nextSize) {
    canvas.width = nextSize;
    canvas.height = nextSize;
  }
}

function cellSize() {
  return canvas.width / GRID_SIZE;
}

function drawBoard() {
  const size = canvas.width;
  const unit = cellSize();

  ctx.clearRect(0, 0, size, size);
  ctx.fillStyle = "#eef4ef";
  ctx.fillRect(0, 0, size, size);

  ctx.strokeStyle = "#dce5ed";
  ctx.lineWidth = Math.max(1, unit * 0.035);

  for (let index = 1; index < GRID_SIZE; index += 1) {
    const offset = index * unit;
    ctx.beginPath();
    ctx.moveTo(offset, 0);
    ctx.lineTo(offset, size);
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(0, offset);
    ctx.lineTo(size, offset);
    ctx.stroke();
  }
}

function drawRoundedRect(x, y, width, height, radius) {
  const r = Math.min(radius, width / 2, height / 2);

  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.lineTo(x + width - r, y);
  ctx.quadraticCurveTo(x + width, y, x + width, y + r);
  ctx.lineTo(x + width, y + height - r);
  ctx.quadraticCurveTo(x + width, y + height, x + width - r, y + height);
  ctx.lineTo(x + r, y + height);
  ctx.quadraticCurveTo(x, y + height, x, y + height - r);
  ctx.lineTo(x, y + r);
  ctx.quadraticCurveTo(x, y, x + r, y);
  ctx.closePath();
}

function drawCell(cell, color, inset = 0.12) {
  const unit = cellSize();
  const gap = unit * inset;
  const x = cell.x * unit + gap;
  const y = cell.y * unit + gap;
  const size = unit - gap * 2;

  drawRoundedRect(x, y, size, size, unit * 0.18);
  ctx.fillStyle = color;
  ctx.fill();
}

function drawFood() {
  const unit = cellSize();
  const centerX = state.food.x * unit + unit / 2;
  const centerY = state.food.y * unit + unit / 2;

  ctx.beginPath();
  ctx.arc(centerX, centerY, unit * 0.34, 0, Math.PI * 2);
  ctx.fillStyle = "#c43d3d";
  ctx.fill();
  ctx.beginPath();
  ctx.arc(centerX - unit * 0.1, centerY - unit * 0.12, unit * 0.08, 0, Math.PI * 2);
  ctx.fillStyle = "rgba(255, 255, 255, 0.75)";
  ctx.fill();
}

function drawSnake() {
  state.snake.forEach((part, index) => {
    drawCell(part, index === 0 ? "#0f6845" : "#168a5c", index === 0 ? 0.08 : 0.13);
  });

  const head = state.snake[0];
  const unit = cellSize();
  const eyeSize = Math.max(2, unit * 0.08);
  const centerX = head.x * unit + unit / 2;
  const centerY = head.y * unit + unit / 2;
  const eyeOffsetX = state.direction.y === 0 ? unit * 0.12 : unit * 0.16;
  const eyeOffsetY = state.direction.x === 0 ? unit * 0.12 : unit * 0.16;

  ctx.fillStyle = "#ffffff";
  ctx.beginPath();
  ctx.arc(centerX - eyeOffsetX, centerY - eyeOffsetY, eyeSize, 0, Math.PI * 2);
  ctx.arc(centerX + eyeOffsetX, centerY + eyeOffsetY, eyeSize, 0, Math.PI * 2);
  ctx.fill();
}

function render() {
  resizeCanvasBuffer();
  drawBoard();
  drawFood();
  drawSnake();
  renderStats();
}

function directionFromKey(key) {
  const directions = {
    ArrowUp: "up",
    w: "up",
    W: "up",
    ArrowDown: "down",
    s: "down",
    S: "down",
    ArrowLeft: "left",
    a: "left",
    A: "left",
    ArrowRight: "right",
    d: "right",
    D: "right"
  };

  return directions[key];
}

function handleKeydown(event) {
  const direction = directionFromKey(event.key);

  if (direction) {
    event.preventDefault();
    setDirection(direction);
    return;
  }

  if (event.key === " " || event.key === "Enter") {
    event.preventDefault();
    if (state.status === "running") {
      pause();
    } else if (state.status === "paused") {
      resume();
    } else {
      start();
    }
  }
}

function handleTouchStart(event) {
  const touch = event.changedTouches[0];
  state.touchStart = {
    x: touch.clientX,
    y: touch.clientY
  };
}

function handleTouchEnd(event) {
  if (!state.touchStart) {
    return;
  }

  const touch = event.changedTouches[0];
  const deltaX = touch.clientX - state.touchStart.x;
  const deltaY = touch.clientY - state.touchStart.y;
  const absX = Math.abs(deltaX);
  const absY = Math.abs(deltaY);
  const minSwipe = 24;

  state.touchStart = null;

  if (Math.max(absX, absY) < minSwipe) {
    return;
  }

  setDirection(absX > absY ? (deltaX > 0 ? "right" : "left") : deltaY > 0 ? "down" : "up");
}

function setSpeed(speed) {
  if (!SPEEDS[speed]) {
    return;
  }

  state.speed = speed;
  speedButtons.forEach((button) => {
    button.classList.toggle("is-active", button.dataset.speed === speed);
  });

  if (state.status === "running") {
    startTimer();
  }

  renderStats();
}

overlayActionButton.addEventListener("click", () => {
  if (state.status === "paused") {
    resume();
    return;
  }

  start();
});

restartButton.addEventListener("click", resetGame);
pauseButton.addEventListener("click", () => {
  if (state.status === "running") {
    pause();
    return;
  }

  if (state.status === "paused") {
    resume();
    return;
  }

  start();
});

controlButtons.forEach((button) => {
  button.addEventListener("click", () => {
    setDirection(button.dataset.direction);
  });
});

speedButtons.forEach((button) => {
  button.addEventListener("click", () => {
    setSpeed(button.dataset.speed);
  });
});

window.addEventListener("keydown", handleKeydown);
window.addEventListener("resize", render);
canvas.addEventListener("touchstart", handleTouchStart, { passive: true });
canvas.addEventListener("touchend", handleTouchEnd);

if (window.GameHubProgress) {
  window.GameHubProgress.registerGamePage("snake");
}

resetGame();
