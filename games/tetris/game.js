const COLS = 10;
const ROWS = 20;
const STORAGE_KEY = "codex-tetris-best-score";

const COLORS = {
  I: "#2bb8d8",
  O: "#f6c343",
  T: "#a46be3",
  S: "#54c66b",
  Z: "#e45b5b",
  J: "#4b7bec",
  L: "#f28c38",
};

const SHAPES = {
  I: [
    [0, 0, 0, 0],
    [1, 1, 1, 1],
    [0, 0, 0, 0],
    [0, 0, 0, 0],
  ],
  O: [
    [1, 1],
    [1, 1],
  ],
  T: [
    [0, 1, 0],
    [1, 1, 1],
    [0, 0, 0],
  ],
  S: [
    [0, 1, 1],
    [1, 1, 0],
    [0, 0, 0],
  ],
  Z: [
    [1, 1, 0],
    [0, 1, 1],
    [0, 0, 0],
  ],
  J: [
    [1, 0, 0],
    [1, 1, 1],
    [0, 0, 0],
  ],
  L: [
    [0, 0, 1],
    [1, 1, 1],
    [0, 0, 0],
  ],
};

const boardCanvas = document.querySelector("#boardCanvas");
const nextCanvas = document.querySelector("#nextCanvas");
const mobileNextCanvas = document.querySelector("#mobileNextCanvas");
const scoreValue = document.querySelector("#scoreValue");
const levelValue = document.querySelector("#levelValue");
const linesValue = document.querySelector("#linesValue");
const bestValue = document.querySelector("#bestValue");
const mobileScoreValue = document.querySelector("#mobileScoreValue");
const mobileLevelValue = document.querySelector("#mobileLevelValue");
const mobileLinesValue = document.querySelector("#mobileLinesValue");
const mobileBestValue = document.querySelector("#mobileBestValue");
const gameStatus = document.querySelector("#gameStatus");
const overlay = document.querySelector("#overlay");
const startButton = document.querySelector("#startButton");
const pauseButton = document.querySelector("#pauseButton");
const resetButton = document.querySelector("#resetButton");
const soundButton = document.querySelector("#soundButton");
const themeButton = document.querySelector("#themeButton");
const leftButton = document.querySelector("#leftButton");
const rightButton = document.querySelector("#rightButton");
const rotateButton = document.querySelector("#rotateButton");
const downButton = document.querySelector("#downButton");

class Tetromino {
  constructor(type) {
    this.type = type;
    this.matrix = cloneMatrix(SHAPES[type]);
    this.color = COLORS[type];
    this.x = Math.floor(COLS / 2) - Math.ceil(this.matrix[0].length / 2);
    this.y = 0;
  }

  rotateClockwise() {
    const size = this.matrix.length;
    const rotated = Array.from({ length: size }, () => Array(size).fill(0));
    for (let y = 0; y < size; y += 1) {
      for (let x = 0; x < size; x += 1) {
        rotated[x][size - 1 - y] = this.matrix[y][x];
      }
    }
    return rotated;
  }
}

class Board {
  constructor(cols, rows) {
    this.cols = cols;
    this.rows = rows;
    this.reset();
  }

  reset() {
    this.grid = Array.from({ length: this.rows }, () => Array(this.cols).fill(null));
  }

  isValid(matrix, offsetX, offsetY) {
    for (let y = 0; y < matrix.length; y += 1) {
      for (let x = 0; x < matrix[y].length; x += 1) {
        if (!matrix[y][x]) continue;

        const boardX = offsetX + x;
        const boardY = offsetY + y;

        if (boardX < 0 || boardX >= this.cols || boardY >= this.rows) return false;
        if (boardY >= 0 && this.grid[boardY][boardX]) return false;
      }
    }
    return true;
  }

  place(piece) {
    for (let y = 0; y < piece.matrix.length; y += 1) {
      for (let x = 0; x < piece.matrix[y].length; x += 1) {
        if (!piece.matrix[y][x]) continue;

        const boardX = piece.x + x;
        const boardY = piece.y + y;
        if (boardY >= 0) {
          this.grid[boardY][boardX] = { type: piece.type, color: piece.color };
        }
      }
    }
  }

  clearLines() {
    let cleared = 0;
    const nextGrid = [];

    for (let y = this.rows - 1; y >= 0; y -= 1) {
      if (this.grid[y].every(Boolean)) {
        cleared += 1;
      } else {
        nextGrid.unshift(this.grid[y]);
      }
    }

    while (nextGrid.length < this.rows) {
      nextGrid.unshift(Array(this.cols).fill(null));
    }

    this.grid = nextGrid;
    return cleared;
  }
}

class SoundBank {
  constructor() {
    this.enabled = true;
    this.context = null;
  }

  setEnabled(enabled) {
    this.enabled = enabled;
  }

  ensure() {
    if (!this.enabled) return null;
    if (!this.context) {
      const AudioContext = window.AudioContext || window.webkitAudioContext;
      if (!AudioContext) return null;
      this.context = new AudioContext();
    }
    if (this.context.state === "suspended") this.context.resume();
    return this.context;
  }

  play(name) {
    const context = this.ensure();
    if (!context) return;

    const presets = {
      move: [180, 0.03, 0.02],
      rotate: [260, 0.04, 0.03],
      lock: [110, 0.08, 0.04],
      clear: [440, 0.12, 0.06],
      over: [80, 0.25, 0.05],
    };
    const [frequency, duration, gainValue] = presets[name] || presets.move;
    const osc = context.createOscillator();
    const gain = context.createGain();
    osc.type = "square";
    osc.frequency.value = frequency;
    gain.gain.setValueAtTime(gainValue, context.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, context.currentTime + duration);
    osc.connect(gain).connect(context.destination);
    osc.start();
    osc.stop(context.currentTime + duration);
  }
}

class UI {
  constructor(engine) {
    this.engine = engine;
    this.boardCtx = boardCanvas.getContext("2d");
    this.nextCtx = nextCanvas.getContext("2d");
    this.mobileNextCtx = mobileNextCanvas.getContext("2d");
    this.dpr = Math.max(1, window.devicePixelRatio || 1);
    this.themeIndex = 0;
    this.resize();
    window.addEventListener("resize", () => this.resize());
  }

  resize() {
    this.dpr = Math.max(1, window.devicePixelRatio || 1);
    this.resizeCanvas(boardCanvas);
    this.resizeCanvas(nextCanvas);
    this.resizeCanvas(mobileNextCanvas);
    this.render();
  }

  resizeCanvas(canvas) {
    const rect = canvas.getBoundingClientRect();
    canvas.width = Math.max(1, Math.floor(rect.width * this.dpr));
    canvas.height = Math.max(1, Math.floor(rect.height * this.dpr));
  }

  updateStats() {
    setText([scoreValue, mobileScoreValue], this.engine.score);
    setText([levelValue, mobileLevelValue], this.engine.level);
    setText([linesValue, mobileLinesValue], this.engine.lines);
    setText([bestValue, mobileBestValue], this.engine.bestScore);
    soundButton.textContent = this.engine.sound.enabled ? "声音开" : "声音关";
    soundButton.setAttribute("aria-pressed", String(this.engine.sound.enabled));
    startButton.disabled = this.engine.running && !this.engine.paused;
    startButton.textContent = startButton.disabled ? "进行中" : "继续";
    pauseButton.textContent = this.engine.paused ? "继续" : "暂停";

    if (this.engine.gameOver) {
      gameStatus.textContent = "游戏结束";
      startButton.disabled = false;
      startButton.textContent = "重开";
      this.showOverlay("游戏结束", "点击重开");
    } else if (this.engine.paused) {
      gameStatus.textContent = "已暂停";
      this.showOverlay("已暂停", "点击继续");
    } else if (this.engine.running) {
      gameStatus.textContent = "进行中";
      this.hideOverlay();
    } else {
      gameStatus.textContent = "准备开始";
      startButton.disabled = false;
      startButton.textContent = "开始";
      this.showOverlay("俄罗斯方块", "点击开始");
    }
  }

  showOverlay(title, subtitle) {
    overlay.innerHTML = `<strong>${title}</strong><span>${subtitle}</span>`;
    overlay.classList.add("is-visible");
  }

  hideOverlay() {
    overlay.classList.remove("is-visible");
  }

  render() {
    this.updateStats();
    this.drawBoard();
    this.drawNext();
  }

  drawBoard() {
    const ctx = this.boardCtx;
    const width = boardCanvas.width;
    const height = boardCanvas.height;
    const cell = Math.floor(Math.min(width / COLS, height / ROWS));
    const offsetX = Math.floor((width - cell * COLS) / 2);
    const offsetY = Math.floor((height - cell * ROWS) / 2);

    ctx.clearRect(0, 0, width, height);
    ctx.fillStyle = getCssVar("--board");
    ctx.fillRect(0, 0, width, height);
    this.drawGrid(ctx, offsetX, offsetY, cell, COLS, ROWS);

    for (let y = 0; y < ROWS; y += 1) {
      for (let x = 0; x < COLS; x += 1) {
        const block = this.engine.board.grid[y][x];
        if (block) this.drawCell(ctx, offsetX + x * cell, offsetY + y * cell, cell, block.color);
      }
    }

    if (this.engine.current) {
      const ghostY = this.engine.getGhostY();
      this.drawPiece(ctx, this.engine.current, cell, offsetX, offsetY, 0.24, ghostY);
      this.drawPiece(ctx, this.engine.current, cell, offsetX, offsetY, 1);
    }
  }

  drawNext() {
    this.drawNextCanvas(this.nextCtx, nextCanvas);
    this.drawNextCanvas(this.mobileNextCtx, mobileNextCanvas);
  }

  drawNextCanvas(ctx, canvas) {
    const width = canvas.width;
    const height = canvas.height;
    ctx.clearRect(0, 0, width, height);
    ctx.fillStyle = getCssVar("--board");
    ctx.fillRect(0, 0, width, height);

    const piece = this.engine.next;
    if (!piece) return;

    const matrix = piece.matrix;
    const cell = Math.floor(Math.min(width, height) / 5);
    const blockWidth = matrix[0].length * cell;
    const blockHeight = matrix.length * cell;
    const startX = Math.floor((width - blockWidth) / 2);
    const startY = Math.floor((height - blockHeight) / 2);

    for (let y = 0; y < matrix.length; y += 1) {
      for (let x = 0; x < matrix[y].length; x += 1) {
        if (matrix[y][x]) this.drawCell(ctx, startX + x * cell, startY + y * cell, cell, piece.color);
      }
    }
  }

  drawGrid(ctx, offsetX, offsetY, cell, cols, rows) {
    ctx.strokeStyle = getCssVar("--board-line");
    ctx.lineWidth = Math.max(1, Math.floor(cell * 0.04));
    for (let x = 0; x <= cols; x += 1) {
      const px = offsetX + x * cell;
      ctx.beginPath();
      ctx.moveTo(px, offsetY);
      ctx.lineTo(px, offsetY + rows * cell);
      ctx.stroke();
    }
    for (let y = 0; y <= rows; y += 1) {
      const py = offsetY + y * cell;
      ctx.beginPath();
      ctx.moveTo(offsetX, py);
      ctx.lineTo(offsetX + cols * cell, py);
      ctx.stroke();
    }
  }

  drawPiece(ctx, piece, cell, offsetX, offsetY, alpha = 1, forcedY = piece.y) {
    ctx.save();
    ctx.globalAlpha = alpha;
    for (let y = 0; y < piece.matrix.length; y += 1) {
      for (let x = 0; x < piece.matrix[y].length; x += 1) {
        if (!piece.matrix[y][x]) continue;
        const boardY = forcedY + y;
        if (boardY < 0) continue;
        this.drawCell(ctx, offsetX + (piece.x + x) * cell, offsetY + boardY * cell, cell, piece.color);
      }
    }
    ctx.restore();
  }

  drawCell(ctx, x, y, size, color) {
    const gap = Math.max(1, Math.floor(size * 0.08));
    const inner = size - gap * 2;
    ctx.fillStyle = color;
    ctx.fillRect(x + gap, y + gap, inner, inner);
    ctx.fillStyle = "rgba(255, 255, 255, 0.22)";
    ctx.fillRect(x + gap, y + gap, inner, Math.max(2, Math.floor(inner * 0.18)));
    ctx.fillStyle = "rgba(0, 0, 0, 0.22)";
    ctx.fillRect(x + gap, y + size - gap - Math.max(2, Math.floor(inner * 0.18)), inner, Math.max(2, Math.floor(inner * 0.18)));
  }

  cycleTheme() {
    this.themeIndex = (this.themeIndex + 1) % 2;
    document.body.classList.toggle("theme-night", this.themeIndex === 1);
    this.render();
  }
}

class GameEngine {
  constructor() {
    this.board = new Board(COLS, ROWS);
    this.sound = new SoundBank();
    this.bestScore = readBestScore();
    this.keys = new Set();
    this.lastTime = 0;
    this.dropCounter = 0;
    this.running = false;
    this.paused = false;
    this.gameOver = false;
    this.resetState();
    this.ui = new UI(this);
    this.bindEvents();
    this.ui.render();
    requestAnimationFrame((time) => this.loop(time));
  }

  resetState() {
    this.board.reset();
    this.score = 0;
    this.lines = 0;
    this.level = 1;
    this.dropInterval = 820;
    this.current = null;
    this.next = this.createPiece();
    this.dropCounter = 0;
    this.gameOver = false;
    this.paused = false;
  }

  bindEvents() {
    document.addEventListener("keydown", (event) => this.handleKeyDown(event));
    document.addEventListener("keyup", (event) => this.handleKeyUp(event));
    startButton.addEventListener("click", () => this.startOrResume());
    pauseButton.addEventListener("click", () => this.togglePause());
    resetButton.addEventListener("click", () => this.restart());
    overlay.addEventListener("click", () => (this.gameOver ? this.restart() : this.startOrResume()));
    soundButton.addEventListener("click", () => {
      this.sound.setEnabled(!this.sound.enabled);
      this.ui.render();
    });
    themeButton.addEventListener("click", () => this.ui.cycleTheme());

    this.bindPointerButton(leftButton, () => this.move(-1), true);
    this.bindPointerButton(rightButton, () => this.move(1), true);
    this.bindPointerButton(rotateButton, () => this.rotate());
    this.bindPointerButton(downButton, () => this.softDrop(), true);
    this.bindBoardGestures();
  }

  bindPointerButton(button, action, repeat = false) {
    let timer = 0;
    let interval = 0;
    const stop = () => {
      window.clearTimeout(timer);
      window.clearInterval(interval);
    };
    const start = (event) => {
      event.preventDefault();
      capturePointer(event.currentTarget, event.pointerId);
      this.startOrResume();
      action();
      if (!repeat) return;
      timer = window.setTimeout(() => {
        interval = window.setInterval(action, 55);
      }, 160);
    };
    button.addEventListener("pointerdown", start);
    button.addEventListener("pointerup", stop);
    button.addEventListener("pointerleave", stop);
    button.addEventListener("pointercancel", stop);
  }

  bindBoardGestures() {
    let startPoint = null;

    boardCanvas.addEventListener("pointerdown", (event) => {
      if (event.pointerType === "mouse" && event.button !== 0) return;
      event.preventDefault();
      capturePointer(boardCanvas, event.pointerId);
      this.startOrResume();
      startPoint = {
        x: event.clientX,
        y: event.clientY,
      };
    });

    boardCanvas.addEventListener("pointerup", (event) => {
      if (!startPoint) return;
      event.preventDefault();
      const dx = event.clientX - startPoint.x;
      const dy = event.clientY - startPoint.y;
      const absX = Math.abs(dx);
      const absY = Math.abs(dy);
      startPoint = null;

      if (!this.canAct()) return;
      if (Math.max(absX, absY) < 18) {
        this.rotate();
      } else if (absX > absY) {
        this.move(dx > 0 ? 1 : -1);
      } else if (dy > 0) {
        this.softDrop();
        this.softDrop();
      } else {
        this.rotate();
      }
    });

    boardCanvas.addEventListener("pointercancel", () => {
      startPoint = null;
    });
  }

  handleKeyDown(event) {
    if (["ArrowLeft", "ArrowRight", "ArrowUp", "ArrowDown", " ", "Spacebar"].includes(event.key)) {
      event.preventDefault();
    }

    if (event.key === "p" || event.key === "P") {
      this.togglePause();
      return;
    }

    if (event.key === "r" || event.key === "R") {
      this.restart();
      return;
    }

    if (!this.running) this.startOrResume();
    if (this.paused || this.gameOver) return;

    if (event.key === "ArrowLeft") this.move(-1);
    if (event.key === "ArrowRight") this.move(1);
    if (event.key === "ArrowUp" || event.key === " " || event.key === "Spacebar") this.rotate();
    if (event.key === "ArrowDown") {
      this.keys.add("down");
      this.softDrop();
    }
  }

  handleKeyUp(event) {
    if (event.key === "ArrowDown") this.keys.delete("down");
  }

  startOrResume() {
    this.sound.ensure();
    if (this.gameOver) {
      this.restart();
      return;
    }
    if (!this.current) this.spawnPiece();
    this.running = true;
    this.paused = false;
    this.ui.render();
  }

  restart() {
    this.resetState();
    this.spawnPiece();
    this.running = true;
    this.ui.render();
  }

  togglePause() {
    if (this.gameOver) return;
    if (!this.running) {
      this.startOrResume();
      return;
    }
    this.paused = !this.paused;
    this.ui.render();
  }

  createPiece() {
    const types = Object.keys(SHAPES);
    return new Tetromino(types[Math.floor(Math.random() * types.length)]);
  }

  spawnPiece() {
    this.current = this.next;
    this.current.x = Math.floor(COLS / 2) - Math.ceil(this.current.matrix[0].length / 2);
    this.current.y = 0;
    this.next = this.createPiece();

    if (!this.board.isValid(this.current.matrix, this.current.x, this.current.y)) {
      this.endGame();
    }
  }

  loop(time) {
    const delta = time - this.lastTime;
    this.lastTime = time;

    if (this.running && !this.paused && !this.gameOver) {
      this.dropCounter += delta;
      const interval = this.keys.has("down") ? 45 : this.dropInterval;
      if (this.dropCounter > interval) {
        this.dropCounter = 0;
        this.stepDown();
      }
      this.ui.render();
    }

    requestAnimationFrame((nextTime) => this.loop(nextTime));
  }

  move(direction) {
    if (!this.canAct()) return;
    const nextX = this.current.x + direction;
    if (this.board.isValid(this.current.matrix, nextX, this.current.y)) {
      this.current.x = nextX;
      this.sound.play("move");
      this.ui.render();
    }
  }

  rotate() {
    if (!this.canAct()) return;
    if (this.current.type === "O") return;

    const rotated = this.current.rotateClockwise();
    const kicks = [0, -1, 1, -2, 2];
    for (const kick of kicks) {
      if (this.board.isValid(rotated, this.current.x + kick, this.current.y)) {
        this.current.matrix = rotated;
        this.current.x += kick;
        this.sound.play("rotate");
        this.ui.render();
        return;
      }
    }
  }

  softDrop() {
    if (!this.canAct()) return;
    if (this.stepDown()) {
      this.score += 1;
      this.updateBest();
    }
    this.ui.render();
  }

  stepDown() {
    if (!this.current) return false;
    const nextY = this.current.y + 1;
    if (this.board.isValid(this.current.matrix, this.current.x, nextY)) {
      this.current.y = nextY;
      return true;
    }

    this.lockPiece();
    return false;
  }

  lockPiece() {
    this.board.place(this.current);
    this.sound.play("lock");
    const cleared = this.board.clearLines();
    if (cleared > 0) this.awardLines(cleared);
    this.spawnPiece();
    this.ui.render();
  }

  awardLines(cleared) {
    const lineScores = [0, 100, 300, 500, 800];
    this.lines += cleared;
    this.level = Math.floor(this.lines / 10) + 1;
    this.score += lineScores[cleared] * this.level;
    this.dropInterval = Math.max(90, 820 - (this.level - 1) * 70);
    this.updateBest();
    this.sound.play("clear");
  }

  updateBest() {
    if (this.score <= this.bestScore) return;
    this.bestScore = this.score;
    writeBestScore(this.bestScore);
  }

  getGhostY() {
    let ghostY = this.current.y;
    while (this.board.isValid(this.current.matrix, this.current.x, ghostY + 1)) {
      ghostY += 1;
    }
    return ghostY;
  }

  canAct() {
    return this.running && !this.paused && !this.gameOver && Boolean(this.current);
  }

  endGame() {
    this.gameOver = true;
    this.running = false;
    this.updateBest();
    this.sound.play("over");
    this.ui.render();
  }
}

function cloneMatrix(matrix) {
  return matrix.map((row) => row.slice());
}

function getCssVar(name) {
  return getComputedStyle(document.body).getPropertyValue(name).trim();
}

function setText(elements, value) {
  for (const element of elements) {
    element.textContent = String(value);
  }
}

function capturePointer(element, pointerId) {
  try {
    if (element.setPointerCapture) element.setPointerCapture(pointerId);
  } catch {
    // Pointer capture is a convenience; controls still work without it.
  }
}

function readBestScore() {
  try {
    return Number(localStorage.getItem(STORAGE_KEY) || 0);
  } catch {
    return 0;
  }
}

function writeBestScore(score) {
  if (window.GameHubProgress) {
    window.GameHubProgress.recordBest("tetris", score);
  }

  try {
    localStorage.setItem(STORAGE_KEY, String(score));
  } catch {
    // Persistence is optional; gameplay should continue without it.
  }
}

if (window.GameHubProgress) {
  window.GameHubProgress.registerGamePage("tetris");
}

new GameEngine();
