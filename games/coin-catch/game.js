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
const BASKET_WIDTH = 86;
const BASKET_HEIGHT = 26;
const STORAGE_KEY = "codex-coin-catch-best";

const state = {
  basketX: WIDTH / 2,
  items: [],
  particles: [],
  score: 0,
  best: readBest(),
  lives: 3,
  spawnTimer: 0,
  lastFrame: 0,
  gameOver: false,
  dragging: false,
  dpr: Math.max(1, window.devicePixelRatio || 1),
};

function resetGame() {
  state.basketX = WIDTH / 2;
  state.items = [];
  state.particles = [];
  state.score = 0;
  state.lives = 3;
  state.spawnTimer = 0;
  state.lastFrame = 0;
  state.gameOver = false;
  state.dragging = false;
  gameOverPanel.hidden = true;
  gameStatus.textContent = "拖动篮子接金币，避开石头";
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
    spawnItem();
    state.spawnTimer = Math.max(8, 24 - Math.floor(state.score / 120));
  }

  const basket = getBasket();
  for (const item of state.items) {
    item.y += item.speed * step;
    item.rotation += item.spin * step;

    if (!item.caught && intersectsBasket(item, basket)) {
      item.caught = true;
      collectItem(item);
    }

    if (!item.caught && item.y - item.radius > HEIGHT) {
      item.caught = true;
      if (item.type !== "rock") loseLife("漏掉金币");
    }
  }

  state.items = state.items.filter((item) => !item.caught && item.y - item.radius < HEIGHT + 80);
  state.particles = state.particles.filter((particle) => {
    particle.life -= step;
    particle.x += particle.vx * step;
    particle.y += particle.vy * step;
    particle.vy += 0.05 * step;
    return particle.life > 0;
  });
  updateHud();
}

function spawnItem() {
  const roll = Math.random();
  const type = roll < 0.14 ? "rock" : roll > 0.88 ? "gem" : "coin";
  const radius = type === "rock" ? 20 : type === "gem" ? 16 : 14;
  state.items.push({
    type,
    x: 32 + Math.random() * (WIDTH - 64),
    y: -radius - 10,
    radius,
    speed: 3.1 + Math.random() * 2.2 + Math.min(2.4, state.score / 220),
    rotation: Math.random() * Math.PI,
    spin: (Math.random() - 0.5) * 0.12,
    caught: false,
  });
}

function collectItem(item) {
  if (item.type === "rock") {
    burst(item.x, item.y, "#64748b", 10);
    loseLife("接到石头");
    return;
  }

  const gained = item.type === "gem" ? 35 : 10;
  state.score += gained;
  state.best = Math.max(state.best, state.score);
  writeBest(state.best);
  burst(item.x, item.y, item.type === "gem" ? "#06b6d4" : "#f59e0b", 9);
  gameStatus.textContent = item.type === "gem" ? "接到宝石，+35" : "接到金币，+10";
}

function loseLife(reason) {
  state.lives -= 1;
  gameStatus.textContent = `${reason}，剩余 ${state.lives} 条命`;
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

function burst(x, y, color, count) {
  for (let i = 0; i < count; i += 1) {
    const angle = (Math.PI * 2 * i) / count;
    const speed = 1 + Math.random() * 2.2;
    state.particles.push({
      x,
      y,
      vx: Math.cos(angle) * speed,
      vy: Math.sin(angle) * speed,
      color,
      life: 24 + Math.random() * 12,
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
  drawWorld();
  for (const item of state.items) drawItem(item);
  drawParticles();
  drawBasket();
  ctx.restore();
}

function drawBackground() {
  const gradient = ctx.createLinearGradient(0, 0, 0, canvas.height);
  gradient.addColorStop(0, "#fffdf5");
  gradient.addColorStop(0.58, "#fffbeb");
  gradient.addColorStop(1, "#fef3c7");
  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, canvas.width, canvas.height);
}

function drawWorld() {
  ctx.fillStyle = "rgba(255, 255, 255, 0.52)";
  roundRect(18, 18, WIDTH - 36, HEIGHT - 36, 22);
  ctx.fill();

  ctx.fillStyle = "rgba(120, 53, 15, 0.28)";
  ctx.font = "900 13px Inter, Segoe UI, Arial";
  ctx.textAlign = "center";
  ctx.fillText("接住奖励，避开石头", WIDTH / 2, 44);
}

function drawItem(item) {
  ctx.save();
  ctx.translate(item.x, item.y);
  ctx.rotate(item.rotation);

  if (item.type === "rock") {
    ctx.fillStyle = "#64748b";
    ctx.beginPath();
    ctx.moveTo(-item.radius, -item.radius * 0.2);
    ctx.lineTo(-item.radius * 0.25, -item.radius);
    ctx.lineTo(item.radius * 0.9, -item.radius * 0.55);
    ctx.lineTo(item.radius * 0.75, item.radius * 0.7);
    ctx.lineTo(-item.radius * 0.55, item.radius);
    ctx.closePath();
    ctx.fill();
  } else if (item.type === "gem") {
    ctx.fillStyle = "#06b6d4";
    ctx.beginPath();
    ctx.moveTo(0, -item.radius);
    ctx.lineTo(item.radius, 0);
    ctx.lineTo(0, item.radius);
    ctx.lineTo(-item.radius, 0);
    ctx.closePath();
    ctx.fill();
    ctx.fillStyle = "rgba(255, 255, 255, 0.65)";
    ctx.fillRect(-4, -item.radius * 0.5, 8, item.radius);
  } else {
    const gradient = ctx.createRadialGradient(-5, -6, 4, 0, 0, item.radius);
    gradient.addColorStop(0, "#ffffff");
    gradient.addColorStop(0.2, "#facc15");
    gradient.addColorStop(1, "#d97706");
    ctx.fillStyle = gradient;
    ctx.beginPath();
    ctx.arc(0, 0, item.radius, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = "rgba(120, 53, 15, 0.42)";
    ctx.lineWidth = 3;
    ctx.stroke();
  }

  ctx.restore();
}

function drawBasket() {
  const basket = getBasket();
  ctx.save();
  ctx.fillStyle = "rgba(120, 53, 15, 0.16)";
  roundRect(basket.x + 7, basket.y + 8, basket.w, basket.h, 10);
  ctx.fill();

  const gradient = ctx.createLinearGradient(0, basket.y, 0, basket.y + basket.h);
  gradient.addColorStop(0, "#f59e0b");
  gradient.addColorStop(1, "#92400e");
  ctx.fillStyle = gradient;
  roundRect(basket.x, basket.y, basket.w, basket.h, 10);
  ctx.fill();
  ctx.strokeStyle = "#78350f";
  ctx.lineWidth = 3;
  ctx.stroke();
  ctx.restore();
}

function drawParticles() {
  for (const particle of state.particles) {
    ctx.globalAlpha = Math.max(0, particle.life / 36);
    ctx.fillStyle = particle.color;
    ctx.beginPath();
    ctx.arc(particle.x, particle.y, 3.2, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.globalAlpha = 1;
}

function getBasket() {
  return {
    x: state.basketX - BASKET_WIDTH / 2,
    y: HEIGHT - 82,
    w: BASKET_WIDTH,
    h: BASKET_HEIGHT,
  };
}

function intersectsBasket(item, basket) {
  return (
    item.x + item.radius > basket.x &&
    item.x - item.radius < basket.x + basket.w &&
    item.y + item.radius > basket.y &&
    item.y - item.radius < basket.y + basket.h
  );
}

function pointerToGame(event) {
  const rect = canvas.getBoundingClientRect();
  const scale = Math.min(rect.width / WIDTH, rect.height / HEIGHT);
  const offsetX = (rect.width - WIDTH * scale) / 2;
  return clamp((event.clientX - rect.left - offsetX) / scale, BASKET_WIDTH / 2 + 12, WIDTH - BASKET_WIDTH / 2 - 12);
}

function moveBasket(event) {
  state.basketX = pointerToGame(event);
}

function updateHud() {
  scoreValue.textContent = String(state.score);
  livesValue.textContent = String(state.lives);
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
    window.GameHubProgress.recordBest("coin-catch", score);
  }

  try {
    localStorage.setItem(STORAGE_KEY, String(score));
  } catch {
    // 本地记录失败不影响游戏流程。
  }
}

canvas.addEventListener("pointerdown", (event) => {
  event.preventDefault();
  state.dragging = true;
  canvas.setPointerCapture?.(event.pointerId);
  moveBasket(event);
});
canvas.addEventListener("pointermove", (event) => {
  if (!state.dragging) return;
  event.preventDefault();
  moveBasket(event);
});
canvas.addEventListener("pointerup", () => {
  state.dragging = false;
});
canvas.addEventListener("pointercancel", () => {
  state.dragging = false;
});
restartButton.addEventListener("click", resetGame);
overlayRestartButton.addEventListener("click", resetGame);
window.addEventListener("resize", resizeCanvas);

if (window.GameHubProgress) {
  window.GameHubProgress.registerGamePage("coin-catch");
}

resetGame();
resizeCanvas();
requestAnimationFrame(loop);
