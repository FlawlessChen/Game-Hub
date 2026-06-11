const canvas = document.querySelector("#gameCanvas");
const ctx = canvas.getContext("2d");
const scoreValue = document.querySelector("#scoreValue");
const bestValue = document.querySelector("#bestValue");
const nextValue = document.querySelector("#nextValue");
const gameStatus = document.querySelector("#gameStatus");
const restartButton = document.querySelector("#restartButton");
const overlayRestartButton = document.querySelector("#overlayRestartButton");
const gameOverPanel = document.querySelector("#gameOverPanel");
const finalScore = document.querySelector("#finalScore");

const WIDTH = 420;
const HEIGHT = 680;
const WALL = 20;
const TOP_LINE = 96;
const DROP_Y = 62;
const GRAVITY = 0.34;
const DAMPING = 0.985;
const BOUNCE = 0.42;
const STORAGE_KEY = "codex-watermelon-best";

const FRUITS = [
  { name: "葡萄", radius: 15, color: "#8b5cf6", score: 2 },
  { name: "樱桃", radius: 19, color: "#ef4444", score: 4 },
  { name: "橘子", radius: 24, color: "#f97316", score: 8 },
  { name: "柠檬", radius: 29, color: "#facc15", score: 16 },
  { name: "猕猴桃", radius: 35, color: "#84cc16", score: 32 },
  { name: "番茄", radius: 42, color: "#f43f5e", score: 64 },
  { name: "桃子", radius: 50, color: "#fb7185", score: 128 },
  { name: "菠萝", radius: 59, color: "#eab308", score: 256 },
  { name: "椰子", radius: 69, color: "#a16207", score: 512 },
  { name: "西瓜", radius: 80, color: "#16a34a", score: 1024 },
];

const state = {
  fruits: [],
  nextLevel: 0,
  dropX: WIDTH / 2,
  score: 0,
  best: readBest(),
  lastFrame: 0,
  canDropAt: 0,
  gameOver: false,
  dragging: false,
  dpr: Math.max(1, window.devicePixelRatio || 1),
  nextId: 1,
};

function resetGame() {
  state.fruits = [];
  state.nextLevel = randomNextLevel();
  state.dropX = WIDTH / 2;
  state.score = 0;
  state.lastFrame = 0;
  state.canDropAt = 0;
  state.gameOver = false;
  state.dragging = false;
  gameOverPanel.hidden = true;
  gameStatus.textContent = "拖动选择落点，松手放下水果";
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

function loop(time) {
  const delta = Math.min(32, time - state.lastFrame || 16);
  state.lastFrame = time;

  if (!state.gameOver) {
    updatePhysics(delta / 16);
    checkLose();
  }

  draw();
  requestAnimationFrame(loop);
}

function updatePhysics(step) {
  for (const fruit of state.fruits) {
    fruit.vy += GRAVITY * step;
    fruit.x += fruit.vx * step;
    fruit.y += fruit.vy * step;
    fruit.vx *= DAMPING;
    fruit.vy *= DAMPING;
    fruit.age += step;

    if (fruit.x - fruit.radius < WALL) {
      fruit.x = WALL + fruit.radius;
      fruit.vx = Math.abs(fruit.vx) * BOUNCE;
    }
    if (fruit.x + fruit.radius > WIDTH - WALL) {
      fruit.x = WIDTH - WALL - fruit.radius;
      fruit.vx = -Math.abs(fruit.vx) * BOUNCE;
    }
    if (fruit.y + fruit.radius > HEIGHT - WALL) {
      fruit.y = HEIGHT - WALL - fruit.radius;
      fruit.vy = -Math.abs(fruit.vy) * BOUNCE;
      fruit.vx *= 0.93;
    }
  }

  for (let pass = 0; pass < 4; pass += 1) {
    resolveCollisions();
  }
}

function resolveCollisions() {
  for (let i = 0; i < state.fruits.length; i += 1) {
    for (let j = i + 1; j < state.fruits.length; j += 1) {
      const first = state.fruits[i];
      const second = state.fruits[j];
      if (!first || !second || first.removed || second.removed) continue;

      const dx = second.x - first.x;
      const dy = second.y - first.y;
      const distance = Math.max(0.001, Math.hypot(dx, dy));
      const minDistance = first.radius + second.radius;
      if (distance >= minDistance) continue;

      if (first.level === second.level && first.level < FRUITS.length - 1 && first.age > 8 && second.age > 8) {
        mergeFruits(first, second);
        continue;
      }

      const overlap = (minDistance - distance) / 2;
      const nx = dx / distance;
      const ny = dy / distance;
      first.x -= nx * overlap;
      first.y -= ny * overlap;
      second.x += nx * overlap;
      second.y += ny * overlap;

      const relativeVelocity = (second.vx - first.vx) * nx + (second.vy - first.vy) * ny;
      if (relativeVelocity < 0) {
        const impulse = -relativeVelocity * 0.34;
        first.vx -= nx * impulse;
        first.vy -= ny * impulse;
        second.vx += nx * impulse;
        second.vy += ny * impulse;
      }
    }
  }

  state.fruits = state.fruits.filter((fruit) => !fruit.removed);
}

function mergeFruits(first, second) {
  first.removed = true;
  second.removed = true;
  const nextLevel = first.level + 1;
  const nextFruit = FRUITS[nextLevel];
  state.fruits.push({
    id: state.nextId++,
    level: nextLevel,
    radius: nextFruit.radius,
    x: (first.x + second.x) / 2,
    y: (first.y + second.y) / 2,
    vx: (first.vx + second.vx) * 0.32,
    vy: Math.min(first.vy, second.vy) * 0.25 - 2,
    age: 0,
  });
  state.score += nextFruit.score;
  state.best = Math.max(state.best, state.score);
  writeBest(state.best);
  gameStatus.textContent = `合成 ${nextFruit.name}，得分 ${state.score}`;
  updateHud();
}

function dropFruit() {
  if (state.gameOver || performance.now() < state.canDropAt) return;
  const data = FRUITS[state.nextLevel];
  state.fruits.push({
    id: state.nextId++,
    level: state.nextLevel,
    radius: data.radius,
    x: clamp(state.dropX, WALL + data.radius, WIDTH - WALL - data.radius),
    y: DROP_Y,
    vx: 0,
    vy: 1.2,
    age: 0,
  });
  state.nextLevel = randomNextLevel();
  state.canDropAt = performance.now() + 520;
  gameStatus.textContent = "继续选择落点";
  updateHud();
}

function checkLose() {
  const danger = state.fruits.some((fruit) => fruit.age > 150 && fruit.y - fruit.radius < TOP_LINE);
  if (!danger) return;
  state.gameOver = true;
  state.best = Math.max(state.best, state.score);
  writeBest(state.best);
  finalScore.textContent = `得分 ${state.score}`;
  gameStatus.textContent = "水果越过警戒线";
  gameOverPanel.hidden = false;
  updateHud();
}

function draw() {
  const scale = Math.min(canvas.width / WIDTH, canvas.height / HEIGHT);
  const offsetX = (canvas.width - WIDTH * scale) / 2;
  const offsetY = (canvas.height - HEIGHT * scale) / 2;

  ctx.save();
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  drawBackground();
  ctx.translate(offsetX, offsetY);
  ctx.scale(scale, scale);

  drawBoard();
  drawDropper();
  for (const fruit of state.fruits) {
    drawFruit(fruit.x, fruit.y, fruit.level, fruit.radius);
  }

  ctx.restore();
}

function drawBackground() {
  const gradient = ctx.createLinearGradient(0, 0, 0, canvas.height);
  gradient.addColorStop(0, "#f9fffb");
  gradient.addColorStop(0.55, "#edf8f1");
  gradient.addColorStop(1, "#ddf0e4");
  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, canvas.width, canvas.height);
}

function drawBoard() {
  ctx.fillStyle = "rgba(255, 255, 255, 0.7)";
  roundRect(WALL, TOP_LINE, WIDTH - WALL * 2, HEIGHT - TOP_LINE - WALL, 18);
  ctx.fill();

  ctx.strokeStyle = "#94a3b8";
  ctx.lineWidth = 2;
  ctx.setLineDash([8, 8]);
  ctx.beginPath();
  ctx.moveTo(WALL + 10, TOP_LINE);
  ctx.lineTo(WIDTH - WALL - 10, TOP_LINE);
  ctx.stroke();
  ctx.setLineDash([]);

  ctx.fillStyle = "#64748b";
  ctx.font = "800 13px Inter, Segoe UI, Arial";
  ctx.textAlign = "center";
  ctx.fillText("警戒线", WIDTH / 2, TOP_LINE - 12);
}

function drawDropper() {
  const data = FRUITS[state.nextLevel];
  const x = clamp(state.dropX, WALL + data.radius, WIDTH - WALL - data.radius);

  ctx.save();
  ctx.strokeStyle = "rgba(15, 23, 42, 0.22)";
  ctx.lineWidth = 2;
  ctx.setLineDash([6, 8]);
  ctx.beginPath();
  ctx.moveTo(x, 24);
  ctx.lineTo(x, TOP_LINE - 8);
  ctx.stroke();
  ctx.setLineDash([]);
  drawFruit(x, 42, state.nextLevel, data.radius * 0.82);
  ctx.restore();
}

function drawFruit(x, y, level, radius) {
  const data = FRUITS[level];
  const gradient = ctx.createRadialGradient(x - radius * 0.35, y - radius * 0.4, radius * 0.15, x, y, radius);
  gradient.addColorStop(0, "#ffffff");
  gradient.addColorStop(0.18, data.color);
  gradient.addColorStop(1, shadeColor(data.color, -22));

  ctx.save();
  ctx.fillStyle = gradient;
  ctx.beginPath();
  ctx.arc(x, y, radius, 0, Math.PI * 2);
  ctx.fill();

  ctx.strokeStyle = "rgba(15, 23, 42, 0.18)";
  ctx.lineWidth = Math.max(2, radius * 0.06);
  ctx.stroke();

  ctx.fillStyle = "rgba(255, 255, 255, 0.72)";
  ctx.beginPath();
  ctx.arc(x - radius * 0.28, y - radius * 0.3, radius * 0.18, 0, Math.PI * 2);
  ctx.fill();

  if (radius >= 24) {
    ctx.fillStyle = "#ffffff";
    ctx.font = `900 ${Math.max(10, radius * 0.32)}px Inter, Segoe UI, Arial`;
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText(data.name.slice(0, 1), x, y + 1);
  }
  ctx.restore();
}

function updateHud() {
  scoreValue.textContent = String(state.score);
  bestValue.textContent = String(state.best);
  nextValue.textContent = FRUITS[state.nextLevel].name;
}

function randomNextLevel() {
  return Math.floor(Math.random() * 4);
}

function pointerToGame(event) {
  const rect = canvas.getBoundingClientRect();
  const scale = Math.min(rect.width / WIDTH, rect.height / HEIGHT);
  const offsetX = (rect.width - WIDTH * scale) / 2;
  return {
    x: clamp((event.clientX - rect.left - offsetX) / scale, WALL + 12, WIDTH - WALL - 12),
  };
}

function handlePointerMove(event) {
  const point = pointerToGame(event);
  state.dropX = point.x;
}

function handlePointerDown(event) {
  state.dragging = true;
  handlePointerMove(event);
  canvas.setPointerCapture?.(event.pointerId);
}

function handlePointerUp(event) {
  if (!state.dragging) return;
  state.dragging = false;
  handlePointerMove(event);
  dropFruit();
}

function clamp(value, min, max) {
  return Math.min(max, Math.max(min, value));
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

function readBest() {
  try {
    return Number(localStorage.getItem(STORAGE_KEY) || 0);
  } catch {
    return 0;
  }
}

function writeBest(score) {
  if (window.GameHubProgress) {
    window.GameHubProgress.recordBest("watermelon", score);
  }

  try {
    localStorage.setItem(STORAGE_KEY, String(score));
  } catch {
    // 本地记录失败不影响游戏流程。
  }
}

canvas.addEventListener("pointerdown", handlePointerDown);
canvas.addEventListener("pointermove", handlePointerMove);
canvas.addEventListener("pointerup", handlePointerUp);
canvas.addEventListener("pointercancel", () => {
  state.dragging = false;
});
restartButton.addEventListener("click", resetGame);
overlayRestartButton.addEventListener("click", resetGame);
window.addEventListener("resize", resizeCanvas);

if (window.GameHubProgress) {
  window.GameHubProgress.registerGamePage("watermelon");
}

resizeCanvas();
resetGame();
requestAnimationFrame(loop);
