const canvas = document.querySelector("#gameCanvas");
const ctx = canvas.getContext("2d");
const scoreValue = document.querySelector("#scoreValue");
const shieldValue = document.querySelector("#shieldValue");
const bestValue = document.querySelector("#bestValue");
const gameStatus = document.querySelector("#gameStatus");
const restartButton = document.querySelector("#restartButton");
const overlayRestartButton = document.querySelector("#overlayRestartButton");
const gameOverPanel = document.querySelector("#gameOverPanel");
const finalScore = document.querySelector("#finalScore");

const WIDTH = 420;
const HEIGHT = 680;
const PLAYER_RADIUS = 17;
const STORAGE_KEY = "codex-dodge-best";

const state = {
  player: { x: WIDTH / 2, y: HEIGHT - 120 },
  hazards: [],
  particles: [],
  score: 0,
  best: readBest(),
  shield: 3,
  spawnTimer: 0,
  invincible: 0,
  gameOver: false,
  dragging: false,
  lastFrame: 0,
  elapsed: 0,
  dpr: Math.max(1, window.devicePixelRatio || 1),
};

function resetGame() {
  state.player = { x: WIDTH / 2, y: HEIGHT - 120 };
  state.hazards = [];
  state.particles = [];
  state.score = 0;
  state.shield = 3;
  state.spawnTimer = 0;
  state.invincible = 0;
  state.gameOver = false;
  state.dragging = false;
  state.lastFrame = 0;
  state.elapsed = 0;
  gameOverPanel.hidden = true;
  gameStatus.textContent = "拖动蓝色小球，躲开红色危险球";
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
  state.elapsed += step;
  state.score = Math.floor(state.elapsed / 3);
  state.best = Math.max(state.best, state.score);
  state.spawnTimer -= step;
  state.invincible = Math.max(0, state.invincible - step);

  if (state.spawnTimer <= 0) {
    spawnHazard();
    state.spawnTimer = Math.max(7, 26 - Math.floor(state.score / 60));
  }

  for (const hazard of state.hazards) {
    hazard.x += hazard.vx * step;
    hazard.y += hazard.vy * step;
    hazard.spin += 0.05 * step;
    if (state.invincible <= 0 && circlesOverlap(state.player, PLAYER_RADIUS, hazard, hazard.radius)) {
      hitHazard(hazard);
    }
  }

  state.hazards = state.hazards.filter(
    (hazard) =>
      !hazard.hit &&
      hazard.x > -80 &&
      hazard.x < WIDTH + 80 &&
      hazard.y > -80 &&
      hazard.y < HEIGHT + 80
  );

  state.particles = state.particles.filter((particle) => {
    particle.life -= step;
    particle.x += particle.vx * step;
    particle.y += particle.vy * step;
    return particle.life > 0;
  });

  updateHud();
}

function spawnHazard() {
  const side = Math.floor(Math.random() * 4);
  const radius = 12 + Math.random() * 12;
  const speed = 2.3 + Math.random() * 1.9 + Math.min(2.5, state.score / 90);
  let x = 0;
  let y = 0;

  if (side === 0) {
    x = -radius;
    y = 80 + Math.random() * (HEIGHT - 160);
  } else if (side === 1) {
    x = WIDTH + radius;
    y = 80 + Math.random() * (HEIGHT - 160);
  } else if (side === 2) {
    x = 50 + Math.random() * (WIDTH - 100);
    y = -radius;
  } else {
    x = 50 + Math.random() * (WIDTH - 100);
    y = HEIGHT + radius;
  }

  const angle = Math.atan2(state.player.y - y, state.player.x - x) + (Math.random() - 0.5) * 0.55;
  state.hazards.push({
    x,
    y,
    vx: Math.cos(angle) * speed,
    vy: Math.sin(angle) * speed,
    radius,
    spin: 0,
    hit: false,
  });
}

function hitHazard(hazard) {
  hazard.hit = true;
  state.shield -= 1;
  state.invincible = 58;
  burst(state.player.x, state.player.y);
  gameStatus.textContent = `被碰到，剩余 ${state.shield} 层护盾`;
  if (state.shield <= 0) {
    endGame();
  }
}

function burst(x, y) {
  for (let i = 0; i < 16; i += 1) {
    const angle = (Math.PI * 2 * i) / 16;
    const speed = 1.2 + Math.random() * 2.4;
    state.particles.push({
      x,
      y,
      vx: Math.cos(angle) * speed,
      vy: Math.sin(angle) * speed,
      life: 24 + Math.random() * 12,
    });
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

function draw() {
  const scale = Math.min(canvas.width / WIDTH, canvas.height / HEIGHT);
  const offsetX = (canvas.width - WIDTH * scale) / 2;
  const offsetY = (canvas.height - HEIGHT * scale) / 2;

  ctx.save();
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  drawBackground();
  ctx.translate(offsetX, offsetY);
  ctx.scale(scale, scale);
  drawArena();
  for (const hazard of state.hazards) drawHazard(hazard);
  drawParticles();
  drawPlayer();
  ctx.restore();
}

function drawBackground() {
  const gradient = ctx.createLinearGradient(0, 0, 0, canvas.height);
  gradient.addColorStop(0, "#fbfdff");
  gradient.addColorStop(0.6, "#f1f5f9");
  gradient.addColorStop(1, "#e2e8f0");
  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, canvas.width, canvas.height);
}

function drawArena() {
  ctx.fillStyle = "rgba(255, 255, 255, 0.52)";
  roundRect(18, 18, WIDTH - 36, HEIGHT - 36, 22);
  ctx.fill();
  ctx.strokeStyle = "rgba(100, 116, 139, 0.22)";
  ctx.lineWidth = 2;
  ctx.stroke();
}

function drawPlayer() {
  const flash = state.invincible > 0 && Math.floor(state.invincible / 5) % 2 === 0;
  ctx.save();
  ctx.globalAlpha = flash ? 0.45 : 1;
  const gradient = ctx.createRadialGradient(state.player.x - 6, state.player.y - 8, 4, state.player.x, state.player.y, PLAYER_RADIUS * 1.3);
  gradient.addColorStop(0, "#ffffff");
  gradient.addColorStop(0.2, "#38bdf8");
  gradient.addColorStop(1, "#0369a1");
  ctx.fillStyle = gradient;
  ctx.beginPath();
  ctx.arc(state.player.x, state.player.y, PLAYER_RADIUS, 0, Math.PI * 2);
  ctx.fill();

  ctx.strokeStyle = "rgba(14, 165, 233, 0.24)";
  ctx.lineWidth = state.shield + 2;
  ctx.beginPath();
  ctx.arc(state.player.x, state.player.y, PLAYER_RADIUS + 8, 0, Math.PI * 2);
  ctx.stroke();
  ctx.restore();
}

function drawHazard(hazard) {
  ctx.save();
  ctx.translate(hazard.x, hazard.y);
  ctx.rotate(hazard.spin);
  const gradient = ctx.createRadialGradient(-hazard.radius * 0.35, -hazard.radius * 0.4, 4, 0, 0, hazard.radius);
  gradient.addColorStop(0, "#ffffff");
  gradient.addColorStop(0.18, "#ef4444");
  gradient.addColorStop(1, "#991b1b");
  ctx.fillStyle = gradient;
  ctx.beginPath();
  ctx.arc(0, 0, hazard.radius, 0, Math.PI * 2);
  ctx.fill();
  ctx.strokeStyle = "rgba(127, 29, 29, 0.5)";
  ctx.lineWidth = 2;
  ctx.stroke();
  ctx.restore();
}

function drawParticles() {
  ctx.fillStyle = "#0ea5e9";
  for (const particle of state.particles) {
    ctx.globalAlpha = Math.max(0, particle.life / 36);
    ctx.beginPath();
    ctx.arc(particle.x, particle.y, 3.5, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.globalAlpha = 1;
}

function updateHud() {
  scoreValue.textContent = String(state.score);
  shieldValue.textContent = String(state.shield);
  bestValue.textContent = String(state.best);
}

function pointerToGame(event) {
  const rect = canvas.getBoundingClientRect();
  const scale = Math.min(rect.width / WIDTH, rect.height / HEIGHT);
  const offsetX = (rect.width - WIDTH * scale) / 2;
  const offsetY = (rect.height - HEIGHT * scale) / 2;
  return {
    x: clamp((event.clientX - rect.left - offsetX) / scale, PLAYER_RADIUS + 16, WIDTH - PLAYER_RADIUS - 16),
    y: clamp((event.clientY - rect.top - offsetY) / scale, PLAYER_RADIUS + 16, HEIGHT - PLAYER_RADIUS - 16),
  };
}

function movePlayer(event) {
  const point = pointerToGame(event);
  state.player.x = point.x;
  state.player.y = point.y;
}

function circlesOverlap(first, firstRadius, second, secondRadius) {
  return Math.hypot(first.x - second.x, first.y - second.y) < firstRadius + secondRadius;
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
    window.GameHubProgress.recordBest("dodge", score);
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
  movePlayer(event);
});
canvas.addEventListener("pointermove", (event) => {
  if (!state.dragging) return;
  event.preventDefault();
  movePlayer(event);
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
window.addEventListener("gamehub:viewportchange", resizeCanvas);

if (window.GameHubProgress) {
  window.GameHubProgress.registerGamePage("dodge");
}

resetGame();
resizeCanvas();
requestAnimationFrame(loop);
