const canvas = document.querySelector("#gameCanvas");
const ctx = canvas.getContext("2d");
const scoreValue = document.querySelector("#scoreValue");
const livesValue = document.querySelector("#livesValue");
const bestValue = document.querySelector("#bestValue");
const gameStatus = document.querySelector("#gameStatus");
const restartButton = document.querySelector("#restartButton");
const overlayRestartButton = document.querySelector("#overlayRestartButton");
const gameOverPanel = document.querySelector("#gameOverPanel");
const finalScore = document.querySelector("#finalScore");

const WIDTH = 420;
const HEIGHT = 680;
const GRAVITY = 0.18;
const STORAGE_KEY = "codex-fruit-slice-best";

const FRUITS = [
  { name: "苹果", color: "#ef4444", radius: 27, score: 10 },
  { name: "橙子", color: "#f97316", radius: 30, score: 12 },
  { name: "梨子", color: "#84cc16", radius: 28, score: 14 },
  { name: "蓝莓", color: "#3b82f6", radius: 23, score: 16 },
  { name: "西瓜", color: "#16a34a", radius: 34, score: 22 },
];

const sceneImage = loadImage("../../assets/scenes/fruit-slice-board.png");
const coverImage = loadImage("../../assets/covers/fruit-slice.png");
const fruitSprites = FRUITS.map((_, index) => loadImage(`../../assets/sprites/fruit-slice/fruit-${index}.png`));
const bombSprite = loadImage("../../assets/sprites/fruit-slice/bomb.png");
const juiceSplashSprite = loadImage("../../assets/effects/fruit-splash.png");
const sliceGlintSprite = loadImage("../../assets/effects/slice-glint.png");

const state = {
  items: [],
  cuts: [],
  splashes: [],
  score: 0,
  best: readBest(),
  lives: 3,
  combo: 0,
  spawnTimer: 0,
  lastFrame: 0,
  gameOver: false,
  pointerDown: false,
  dpr: Math.max(1, window.devicePixelRatio || 1),
  nextId: 1,
};

function resetGame() {
  state.items = [];
  state.cuts = [];
  state.splashes = [];
  state.score = 0;
  state.lives = 3;
  state.combo = 0;
  state.spawnTimer = 0;
  state.lastFrame = 0;
  state.gameOver = false;
  state.pointerDown = false;
  gameOverPanel.hidden = true;
  gameStatus.textContent = "滑动切开水果，别碰炸弹";
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
    update(delta / 16);
  }

  draw();
  requestAnimationFrame(loop);
}

function update(step) {
  state.spawnTimer -= step;
  if (state.spawnTimer <= 0) {
    spawnWave();
    state.spawnTimer = Math.max(26, 58 - Math.floor(state.score / 90) * 4);
  }

  for (const item of state.items) {
    item.vy += GRAVITY * step;
    item.x += item.vx * step;
    item.y += item.vy * step;
    item.rotation += item.spin * step;
  }

  for (const item of state.items) {
    if (item.missed || item.y - item.radius <= HEIGHT + 20) continue;
    item.missed = true;
    if (!item.bomb) {
      loseLife("漏掉水果");
    }
  }

  state.items = state.items.filter((item) => !item.sliced && item.y - item.radius < HEIGHT + 80);
  state.cuts = state.cuts.filter((point) => {
    point.life -= step;
    return point.life > 0;
  });
  state.splashes = state.splashes.filter((splash) => {
    splash.life -= step;
    splash.x += splash.vx * step;
    splash.y += splash.vy * step;
    splash.vy += 0.08 * step;
    splash.rotation += splash.spin * step;
    return splash.life > 0;
  });
}

function spawnWave() {
  const count = Math.random() < 0.55 ? 1 : 2;
  for (let i = 0; i < count; i += 1) {
    spawnItem(Math.random() < 0.13);
  }
}

function spawnItem(bomb = false) {
  const fruitIndex = Math.floor(Math.random() * FRUITS.length);
  const fruit = FRUITS[fruitIndex];
  const radius = bomb ? 28 : fruit.radius;
  const fromLeft = Math.random() < 0.5;
  state.items.push({
    id: state.nextId++,
    bomb,
    name: bomb ? "炸弹" : fruit.name,
    color: bomb ? "#111827" : fruit.color,
    score: bomb ? 0 : fruit.score,
    spriteIndex: bomb ? -1 : fruitIndex,
    radius,
    x: fromLeft ? 40 + Math.random() * 80 : WIDTH - 40 - Math.random() * 80,
    y: HEIGHT + radius + 16,
    vx: (fromLeft ? 1 : -1) * (1.6 + Math.random() * 2.2),
    vy: -(10.8 + Math.random() * 3.6),
    spin: (Math.random() - 0.5) * 0.18,
    rotation: Math.random() * Math.PI,
    sliced: false,
    missed: false,
  });
}

function sliceAt(point, previous) {
  if (state.gameOver) return;
  state.cuts.push({ ...point, life: 11 });
  if (!previous) return;

  for (const item of state.items) {
    if (item.sliced) continue;
    if (distanceToSegment(item, previous, point) > item.radius + 8) continue;
    item.sliced = true;

    if (item.bomb) {
      burst(item, "#111827", 10);
      state.combo = 0;
      loseLife("切到炸弹");
      continue;
    }

    const comboBonus = Math.min(20, state.combo * 2);
    state.combo += 1;
    state.score += item.score + comboBonus;
    state.best = Math.max(state.best, state.score);
    writeBest(state.best);
    gameStatus.textContent = comboBonus ? `连击 +${comboBonus}` : `切开 ${item.name}`;
    burst(item, item.color, 8);
    updateHud();
  }
}

function loseLife(reason) {
  state.lives -= 1;
  state.combo = 0;
  gameStatus.textContent = `${reason}，剩余 ${state.lives} 条命`;
  updateHud();
  if (state.lives <= 0) {
    endGame();
  }
}

function endGame() {
  state.gameOver = true;
  state.best = Math.max(state.best, state.score);
  writeBest(state.best);
  finalScore.textContent = `得分 ${state.score}`;
  gameStatus.textContent = "游戏结束";
  gameOverPanel.hidden = false;
  updateHud();
}

function burst(item, color, count) {
  for (let i = 0; i < count; i += 1) {
    const angle = (Math.PI * 2 * i) / count + Math.random() * 0.4;
    const speed = 1.2 + Math.random() * 2.8;
    state.splashes.push({
      x: item.x,
      y: item.y,
      vx: Math.cos(angle) * speed,
      vy: Math.sin(angle) * speed,
      color,
      life: 28 + Math.random() * 10,
      radius: 3 + Math.random() * 4,
      size: 22 + Math.random() * 24,
      rotation: Math.random() * Math.PI * 2,
      spin: (Math.random() - 0.5) * 0.18,
    });
  }
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
  drawHudHint();
  for (const item of state.items) drawItem(item);
  drawSplashes();
  drawCutTrail();
  ctx.restore();
}

function drawBackground() {
  if (drawSceneBackground(sceneImage)) {
    return;
  }

  const gradient = ctx.createLinearGradient(0, 0, 0, canvas.height);
  gradient.addColorStop(0, "#fffaf0");
  gradient.addColorStop(0.6, "#ffedd5");
  gradient.addColorStop(1, "#fed7aa");
  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  drawCoverBackground(coverImage, 0.1);
}

function drawHudHint() {
  ctx.fillStyle = "rgba(255, 255, 255, 0.3)";
  roundRect(18, 18, WIDTH - 36, HEIGHT - 36, 20);
  ctx.fill();

  ctx.fillStyle = "rgba(17, 24, 39, 0.36)";
  ctx.font = "900 13px Inter, Segoe UI, Arial";
  ctx.textAlign = "center";
  ctx.fillText("滑动切水果", WIDTH / 2, 42);
}

function drawItem(item) {
  ctx.save();
  ctx.translate(item.x, item.y);
  ctx.rotate(item.rotation);

  const sprite = item.bomb ? bombSprite : fruitSprites[item.spriteIndex];
  if (drawImageAsset(sprite, -item.radius * 1.35, -item.radius * 1.35, item.radius * 2.7, item.radius * 2.7)) {
    ctx.restore();
    return;
  }

  if (item.bomb) {
    const gradient = ctx.createRadialGradient(-8, -10, 6, 0, 0, item.radius);
    gradient.addColorStop(0, "#475569");
    gradient.addColorStop(1, "#020617");
    ctx.fillStyle = gradient;
    ctx.beginPath();
    ctx.arc(0, 0, item.radius, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = "#facc15";
    ctx.lineWidth = 4;
    ctx.beginPath();
    ctx.moveTo(item.radius * 0.4, -item.radius * 0.7);
    ctx.quadraticCurveTo(item.radius * 0.9, -item.radius * 1.25, item.radius * 1.25, -item.radius * 0.88);
    ctx.stroke();
    ctx.fillStyle = "#facc15";
    ctx.beginPath();
    ctx.arc(item.radius * 1.25, -item.radius * 0.88, 4, 0, Math.PI * 2);
    ctx.fill();
  } else {
    const gradient = ctx.createRadialGradient(-item.radius * 0.35, -item.radius * 0.4, 5, 0, 0, item.radius);
    gradient.addColorStop(0, "#ffffff");
    gradient.addColorStop(0.16, item.color);
    gradient.addColorStop(1, shadeColor(item.color, -25));
    ctx.fillStyle = gradient;
    ctx.beginPath();
    ctx.arc(0, 0, item.radius, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = "rgba(255, 255, 255, 0.7)";
    ctx.beginPath();
    ctx.arc(-item.radius * 0.32, -item.radius * 0.32, item.radius * 0.18, 0, Math.PI * 2);
    ctx.fill();
  }

  ctx.restore();
}

function loadImage(src) {
  const image = new Image();
  image.src = src;
  return image;
}

function isImageReady(image) {
  return image && image.complete && image.naturalWidth > 0;
}

function drawImageAsset(image, x, y, width, height) {
  if (!isImageReady(image)) return false;
  ctx.drawImage(image, x, y, width, height);
  return true;
}

function drawCoverBackground(image, alpha) {
  if (!isImageReady(image)) return;
  ctx.save();
  ctx.globalAlpha = alpha;
  ctx.drawImage(image, 0, 0, canvas.width, canvas.height);
  ctx.restore();
}

function drawSceneBackground(image) {
  if (!isImageReady(image)) return false;
  ctx.save();
  drawImageCover(image, 0, 0, canvas.width, canvas.height);
  ctx.fillStyle = "rgba(255, 250, 240, 0.08)";
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  ctx.restore();
  return true;
}

function drawImageCover(image, x, y, width, height) {
  const scale = Math.max(width / image.naturalWidth, height / image.naturalHeight);
  const sourceWidth = width / scale;
  const sourceHeight = height / scale;
  const sourceX = (image.naturalWidth - sourceWidth) / 2;
  const sourceY = (image.naturalHeight - sourceHeight) / 2;
  ctx.drawImage(image, sourceX, sourceY, sourceWidth, sourceHeight, x, y, width, height);
}

function drawSplashes() {
  ctx.save();
  for (const splash of state.splashes) {
    const alpha = Math.max(0, splash.life / 36);
    if (isImageReady(juiceSplashSprite)) {
      ctx.save();
      ctx.globalAlpha = alpha * 0.72;
      ctx.translate(splash.x, splash.y);
      ctx.rotate(splash.rotation);
      ctx.drawImage(
        juiceSplashSprite,
        -splash.size / 2,
        -splash.size / 2,
        splash.size,
        splash.size
      );
      ctx.restore();
    }

    ctx.globalAlpha = alpha;
    ctx.fillStyle = splash.color;
    ctx.beginPath();
    ctx.arc(splash.x, splash.y, splash.radius, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.restore();
}

function drawCutTrail() {
  if (state.cuts.length < 2) return;
  ctx.save();
  ctx.lineCap = "round";
  ctx.lineJoin = "round";
  ctx.strokeStyle = "rgba(255, 255, 255, 0.88)";
  ctx.lineWidth = 8;
  ctx.beginPath();
  ctx.moveTo(state.cuts[0].x, state.cuts[0].y);
  for (const point of state.cuts.slice(1)) ctx.lineTo(point.x, point.y);
  ctx.stroke();

  ctx.strokeStyle = "rgba(249, 115, 22, 0.82)";
  ctx.lineWidth = 3;
  ctx.stroke();

  if (isImageReady(sliceGlintSprite)) {
    for (let i = 1; i < state.cuts.length; i += 3) {
      const point = state.cuts[i];
      const previous = state.cuts[i - 1];
      const angle = Math.atan2(point.y - previous.y, point.x - previous.x);
      const size = 34 + point.life * 1.5;
      ctx.save();
      ctx.globalAlpha = Math.max(0, point.life / 11) * 0.75;
      ctx.translate(point.x, point.y);
      ctx.rotate(angle);
      ctx.drawImage(sliceGlintSprite, -size * 0.7, -size * 0.35, size * 1.4, size * 0.7);
      ctx.restore();
    }
  }
  ctx.restore();
}

function updateHud() {
  scoreValue.textContent = String(state.score);
  livesValue.textContent = String(state.lives);
  bestValue.textContent = String(state.best);
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

function handlePointerDown(event) {
  state.pointerDown = true;
  const point = pointerToGame(event);
  sliceAt(point, null);
  canvas.setPointerCapture?.(event.pointerId);
}

function handlePointerMove(event) {
  if (!state.pointerDown) return;
  const previous = state.cuts[state.cuts.length - 1] || null;
  const point = pointerToGame(event);
  sliceAt(point, previous);
}

function handlePointerUp() {
  state.pointerDown = false;
}

function distanceToSegment(point, start, end) {
  const dx = end.x - start.x;
  const dy = end.y - start.y;
  const lengthSq = dx * dx + dy * dy || 1;
  const t = Math.max(0, Math.min(1, ((point.x - start.x) * dx + (point.y - start.y) * dy) / lengthSq));
  const x = start.x + dx * t;
  const y = start.y + dy * t;
  return Math.hypot(point.x - x, point.y - y);
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
    window.GameHubProgress.recordBest("fruit-slice", score);
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
canvas.addEventListener("pointercancel", handlePointerUp);
restartButton.addEventListener("click", resetGame);
overlayRestartButton.addEventListener("click", resetGame);
window.addEventListener("resize", resizeCanvas);
window.addEventListener("gamehub:viewportchange", resizeCanvas);

if (window.GameHubProgress) {
  window.GameHubProgress.registerGamePage("fruit-slice");
}

resizeCanvas();
resetGame();
requestAnimationFrame(loop);
