const canvas = document.querySelector("#gameCanvas");
const ctx = canvas.getContext("2d");
const scoreValue = document.querySelector("#scoreValue");
const levelValue = document.querySelector("#levelValue");
const bestValue = document.querySelector("#bestValue");
const gameStatus = document.querySelector("#gameStatus");
const restartButton = document.querySelector("#restartButton");

const WIDTH = 420;
const HEIGHT = 680;
const COLS = 8;
const ROWS = 10;
const GAP = 6;
const BOARD_TOP = 110;
const BOARD_LEFT = 24;
const CELL = (WIDTH - BOARD_LEFT * 2 - GAP * (COLS - 1)) / COLS;
const STORAGE_KEY = "codex-pop-blocks-best";

const COLORS = [
  "#ef4444",
  "#f97316",
  "#eab308",
  "#22c55e",
  "#3b82f6",
  "#8b5cf6",
];

const state = {
  board: [],
  score: 0,
  best: readBest(),
  level: 1,
  selected: [],
  pulse: 0,
  dpr: Math.max(1, window.devicePixelRatio || 1),
};

function resetGame() {
  state.score = 0;
  state.level = 1;
  state.selected = [];
  fillBoard();
  ensureMove();
  gameStatus.textContent = "点击 2 个以上相连同色方块";
  updateHud();
  draw();
}

function resizeCanvas() {
  const rect = canvas.getBoundingClientRect();
  state.dpr = Math.max(1, window.devicePixelRatio || 1);
  canvas.width = Math.max(1, Math.floor(rect.width * state.dpr));
  canvas.height = Math.max(1, Math.floor(rect.height * state.dpr));
  draw();
}

function fillBoard() {
  state.board = Array.from({ length: ROWS }, () =>
    Array.from({ length: COLS }, () => randomColor())
  );
}

function randomColor() {
  const count = Math.min(COLORS.length, 4 + Math.floor(state.level / 3));
  return Math.floor(Math.random() * count);
}

function handleTap(event) {
  const point = pointerToGame(event);
  const cell = cellAt(point.x, point.y);
  if (!cell) return;

  const color = state.board[cell.row][cell.col];
  if (color === null) return;

  const group = findGroup(cell.row, cell.col, color);
  if (group.length < 2) {
    state.selected = group;
    gameStatus.textContent = "至少需要 2 个相连方块";
    draw();
    return;
  }

  removeGroup(group);
}

function removeGroup(group) {
  for (const cell of group) {
    state.board[cell.row][cell.col] = null;
  }

  const gained = group.length * group.length * 5 + Math.max(0, group.length - 4) * 10;
  state.score += gained;
  state.best = Math.max(state.best, state.score);
  writeBest(state.best);
  state.selected = [];
  gameStatus.textContent = `消除 ${group.length} 个，+${gained}`;
  applyGravity();

  if (!hasMove()) {
    const bonus = emptyCount() * 3;
    state.score += bonus;
    state.level += 1;
    fillBoard();
    ensureMove();
    gameStatus.textContent = bonus ? `进入第 ${state.level} 关，清场奖励 +${bonus}` : `进入第 ${state.level} 关`;
    state.best = Math.max(state.best, state.score);
    writeBest(state.best);
  }

  updateHud();
  draw();
}

function applyGravity() {
  for (let col = 0; col < COLS; col += 1) {
    const stack = [];
    for (let row = ROWS - 1; row >= 0; row -= 1) {
      const value = state.board[row][col];
      if (value !== null) stack.push(value);
    }

    for (let row = ROWS - 1; row >= 0; row -= 1) {
      state.board[row][col] = stack[ROWS - 1 - row] ?? null;
    }
  }

  const columns = [];
  for (let col = 0; col < COLS; col += 1) {
    const values = [];
    for (let row = 0; row < ROWS; row += 1) {
      values.push(state.board[row][col]);
    }
    if (values.some((value) => value !== null)) columns.push(values);
  }

  while (columns.length < COLS) {
    columns.push(Array.from({ length: ROWS }, () => null));
  }

  for (let col = 0; col < COLS; col += 1) {
    for (let row = 0; row < ROWS; row += 1) {
      state.board[row][col] = columns[col][row];
    }
  }
}

function findGroup(startRow, startCol, color) {
  const queue = [{ row: startRow, col: startCol }];
  const seen = new Set([`${startRow}:${startCol}`]);

  for (let index = 0; index < queue.length; index += 1) {
    const current = queue[index];
    for (const next of neighbors(current.row, current.col)) {
      const key = `${next.row}:${next.col}`;
      if (seen.has(key) || state.board[next.row][next.col] !== color) continue;
      seen.add(key);
      queue.push(next);
    }
  }

  return queue;
}

function neighbors(row, col) {
  return [
    { row: row - 1, col },
    { row: row + 1, col },
    { row, col: col - 1 },
    { row, col: col + 1 },
  ].filter((cell) => cell.row >= 0 && cell.row < ROWS && cell.col >= 0 && cell.col < COLS);
}

function hasMove() {
  for (let row = 0; row < ROWS; row += 1) {
    for (let col = 0; col < COLS; col += 1) {
      const color = state.board[row][col];
      if (color === null) continue;
      if (neighbors(row, col).some((cell) => state.board[cell.row][cell.col] === color)) return true;
    }
  }
  return false;
}

function ensureMove() {
  let guard = 0;
  while (!hasMove() && guard < 20) {
    fillBoard();
    guard += 1;
  }
}

function emptyCount() {
  return state.board.flat().filter((value) => value === null).length;
}

function draw() {
  const scale = Math.min(canvas.width / WIDTH, canvas.height / HEIGHT);
  const offsetX = (canvas.width - WIDTH * scale) / 2;
  const offsetY = (canvas.height - HEIGHT * scale) / 2;
  state.pulse += 0.08;

  ctx.save();
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  drawBackground();
  ctx.translate(offsetX, offsetY);
  ctx.scale(scale, scale);
  drawBoard();
  ctx.restore();
}

function drawBackground() {
  const gradient = ctx.createLinearGradient(0, 0, 0, canvas.height);
  gradient.addColorStop(0, "#fbfcff");
  gradient.addColorStop(0.62, "#eef2ff");
  gradient.addColorStop(1, "#e0e7ff");
  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, canvas.width, canvas.height);
}

function drawBoard() {
  ctx.fillStyle = "rgba(255, 255, 255, 0.62)";
  roundRect(16, BOARD_TOP - 18, WIDTH - 32, ROWS * CELL + (ROWS - 1) * GAP + 36, 18);
  ctx.fill();

  const selectedSet = new Set(state.selected.map((cell) => `${cell.row}:${cell.col}`));
  for (let row = 0; row < ROWS; row += 1) {
    for (let col = 0; col < COLS; col += 1) {
      const color = state.board[row][col];
      if (color === null) continue;
      const x = BOARD_LEFT + col * (CELL + GAP);
      const y = BOARD_TOP + row * (CELL + GAP);
      const selected = selectedSet.has(`${row}:${col}`);
      drawCell(x, y, color, selected);
    }
  }
}

function drawCell(x, y, colorIndex, selected) {
  const color = COLORS[colorIndex];
  const lift = selected ? 2 + Math.sin(state.pulse) * 2 : 0;
  ctx.save();
  ctx.translate(x + CELL / 2, y + CELL / 2 - lift);

  const gradient = ctx.createLinearGradient(-CELL / 2, -CELL / 2, CELL / 2, CELL / 2);
  gradient.addColorStop(0, shadeColor(color, 24));
  gradient.addColorStop(1, shadeColor(color, -18));
  ctx.fillStyle = gradient;
  roundRect(-CELL / 2, -CELL / 2, CELL, CELL, 10);
  ctx.fill();

  ctx.strokeStyle = selected ? "#ffffff" : "rgba(17, 24, 39, 0.12)";
  ctx.lineWidth = selected ? 4 : 2;
  ctx.stroke();

  ctx.fillStyle = "rgba(255, 255, 255, 0.45)";
  roundRect(-CELL * 0.28, -CELL * 0.32, CELL * 0.42, CELL * 0.16, 6);
  ctx.fill();
  ctx.restore();
}

function cellAt(x, y) {
  const col = Math.floor((x - BOARD_LEFT) / (CELL + GAP));
  const row = Math.floor((y - BOARD_TOP) / (CELL + GAP));
  if (row < 0 || row >= ROWS || col < 0 || col >= COLS) return null;

  const cellX = BOARD_LEFT + col * (CELL + GAP);
  const cellY = BOARD_TOP + row * (CELL + GAP);
  if (x > cellX + CELL || y > cellY + CELL) return null;
  return { row, col };
}

function pointerToGame(event) {
  const rect = canvas.getBoundingClientRect();
  const scale = Math.min(rect.width / WIDTH, rect.height / HEIGHT);
  const offsetX = (rect.width - WIDTH * scale) / 2;
  const offsetY = (rect.height - HEIGHT * scale) / 2;
  return {
    x: (event.clientX - rect.left - offsetX) / scale,
    y: (event.clientY - rect.top - offsetY) / scale,
  };
}

function updateHud() {
  scoreValue.textContent = String(state.score);
  levelValue.textContent = String(state.level);
  bestValue.textContent = String(state.best);
}

function roundRect(x, y, width, height, radius) {
  ctx.beginPath();
  ctx.moveTo(x + radius, y);
  ctx.lineTo(x + width - radius, y);
  ctx.quadraticCurveTo(x + width, y, x + width, y + radius);
  ctx.lineTo(x + width, y + height - radius);
  ctx.quadraticCurveTo(x + width, y + height, x + width - radius, y + height);
  ctx.lineTo(x + radius, y + height);
  ctx.quadraticCurveTo(x, y + height, x, y + height - radius);
  ctx.lineTo(x, y + radius);
  ctx.quadraticCurveTo(x, y, x + radius, y);
  ctx.closePath();
}

function shadeColor(hex, amount) {
  const value = Number.parseInt(hex.slice(1), 16);
  const r = clamp((value >> 16) + amount, 0, 255);
  const g = clamp(((value >> 8) & 255) + amount, 0, 255);
  const b = clamp((value & 255) + amount, 0, 255);
  return `rgb(${r}, ${g}, ${b})`;
}

function clamp(value, min, max) {
  return Math.min(max, Math.max(min, value));
}

function readBest() {
  try {
    return Number(localStorage.getItem(STORAGE_KEY) || 0);
  } catch {
    return 0;
  }
}

function writeBest(score) {
  if (window.GameHubProgress) {
    window.GameHubProgress.recordBest("pop-blocks", score);
  }

  try {
    localStorage.setItem(STORAGE_KEY, String(score));
  } catch {
    // 本地记录失败不影响游戏流程。
  }
}

canvas.addEventListener("pointerdown", handleTap);
restartButton.addEventListener("click", resetGame);
window.addEventListener("resize", resizeCanvas);

if (window.GameHubProgress) {
  window.GameHubProgress.registerGamePage("pop-blocks");
}

resetGame();
resizeCanvas();
