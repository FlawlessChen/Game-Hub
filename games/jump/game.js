const canvas = document.querySelector("#gameCanvas");
const ctx = canvas.getContext("2d");
const scoreValue = document.querySelector("#scoreValue");
const powerValue = document.querySelector("#powerValue");
const bestValue = document.querySelector("#bestValue");
const gameStatus = document.querySelector("#gameStatus");
const restartButton = document.querySelector("#restartButton");
const overlayRestartButton = document.querySelector("#overlayRestartButton");
const gameOverPanel = document.querySelector("#gameOverPanel");
const finalScore = document.querySelector("#finalScore");

const WIDTH = 420;
const HEIGHT = 680;
const PLAYER_RADIUS = 18;
const MAX_POWER = 100;
const POWER_SPEED = 1.55;
const MIN_JUMP_DISTANCE = 24;
const JUMP_DISTANCE_SCALE = 2.65;
const STORAGE_KEY = "codex-jump-best";

const PLATFORM_COLORS = ["#2563eb", "#16a34a", "#f97316", "#8b5cf6", "#0f766e", "#dc2626"];
const BASE_PLATFORM = { x: 145, y: 470 };

const state = {
  score: 0,
  best: readBest(),
  power: 0,
  charging: false,
  jumping: false,
  gameOver: false,
  current: null,
  target: null,
  player: { x: 0, y: 0 },
  jump: null,
  lastFrame: 0,
  dpr: Math.max(1, window.devicePixelRatio || 1),
};

function resetGame() {
  state.score = 0;
  state.power = 0;
  state.charging = false;
  state.jumping = false;
  state.gameOver = false;
  state.current = makePlatform(BASE_PLATFORM.x, BASE_PLATFORM.y, 118, 64);
  state.target = makeNextPlatform(state.current);
  state.player = topCenter(state.current);
  state.jump = null;
  gameOverPanel.hidden = true;
  gameStatus.textContent = "长按蓄力，松手跳到下一个平台";
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
    if (state.charging && !state.jumping) {
      state.power = Math.min(MAX_POWER, state.power + POWER_SPEED * (delta / 16));
      updateHud();
    }
    updateJump(delta / 16);
  }

  draw();
  requestAnimationFrame(loop);
}

function makePlatform(x, y, width = 96 + Math.random() * 34, depth = 54 + Math.random() * 18) {
  return {
    x,
    y,
    width,
    depth,
    height: 50 + Math.random() * 18,
    color: PLATFORM_COLORS[Math.floor(Math.random() * PLATFORM_COLORS.length)],
  };
}

function makeNextPlatform(from) {
  const direction = Math.random() < 0.5 ? -1 : 1;
  const dx = direction * (118 + Math.random() * 88);
  const dy = -(72 + Math.random() * 86);
  let x = from.x + dx;
  let y = from.y + dy;

  if (x < 84 || x > WIDTH - 84) {
    x = from.x - dx * 0.78;
  }

  x = clamp(x, 82, WIDTH - 82);
  y = clamp(y, 210, 415);
  return makePlatform(x, y);
}

function topCenter(platform) {
  return { x: platform.x, y: platform.y - platform.depth * 0.1 };
}

function startCharge() {
  if (state.gameOver || state.jumping) return;
  state.charging = true;
  state.power = 0;
  gameStatus.textContent = "蓄力中，松手起跳";
}

function releaseJump() {
  if (!state.charging || state.jumping || state.gameOver) return;
  state.charging = false;

  const from = topCenter(state.current);
  const to = topCenter(state.target);
  const angle = Math.atan2(to.y - from.y, to.x - from.x);
  const distance = MIN_JUMP_DISTANCE + state.power * JUMP_DISTANCE_SCALE;
  const end = {
    x: from.x + Math.cos(angle) * distance,
    y: from.y + Math.sin(angle) * distance,
  };

  state.jump = {
    from: { ...from },
    to: end,
    t: 0,
    duration: clamp(25 + distance * 0.08, 31, 47),
    distance,
  };
  state.jumping = true;
  gameStatus.textContent = "起跳";
}

function updateJump(step) {
  if (!state.jump) return;

  state.jump.t += step;
  const progress = Math.min(1, state.jump.t / state.jump.duration);
  const eased = easeInOut(progress);
  const arc = Math.sin(progress * Math.PI) * (72 + state.jump.distance * 0.18);
  state.player.x = lerp(state.jump.from.x, state.jump.to.x, eased);
  state.player.y = lerp(state.jump.from.y, state.jump.to.y, eased) - arc;

  if (progress < 1) return;

  state.player = { ...state.jump.to };
  state.jump = null;
  state.jumping = false;
  judgeLanding();
}

function judgeLanding() {
  const landing = { ...state.player };
  const insideTarget = isPointOnPlatform(landing, state.target);
  const insideCurrent = isPointOnPlatform(landing, state.current);

  if (!insideTarget) {
    endGame(insideCurrent ? "跳得太近了" : "落空了");
    return;
  }

  const targetCenter = topCenter(state.target);
  const centerDistance = Math.hypot(landing.x - targetCenter.x, landing.y - targetCenter.y);
  const bonus = centerDistance < 10 ? 2 : 1;
  state.score += bonus;
  state.best = Math.max(state.best, state.score);
  writeBest(state.best);

  state.current = { ...state.target };
  state.player = topCenter(state.current);
  state.target = makeNextPlatform(state.current);
  recenterScene();
  state.power = 0;
  gameStatus.textContent = bonus > 1 ? "中心落点，+2" : "成功，继续";
  updateHud();
}

function isPointOnPlatform(point, platform) {
  const top = topCenter(platform);
  const dx = Math.abs(point.x - top.x) / (platform.width / 2);
  const dy = Math.abs(point.y - top.y) / (platform.depth / 2);
  return dx + dy <= 1.08;
}

function recenterScene() {
  const offsetX = BASE_PLATFORM.x - state.current.x;
  const offsetY = BASE_PLATFORM.y - state.current.y;
  translatePlatform(state.current, offsetX, offsetY);
  translatePlatform(state.target, offsetX, offsetY);
  state.player.x += offsetX;
  state.player.y += offsetY;
}

function translatePlatform(platform, offsetX, offsetY) {
  platform.x += offsetX;
  platform.y += offsetY;
}

function endGame(reason) {
  state.gameOver = true;
  state.charging = false;
  state.best = Math.max(state.best, state.score);
  writeBest(state.best);
  finalScore.textContent = `得分 ${state.score}`;
  gameStatus.textContent = reason;
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

  const platforms = [state.target, state.current].sort((a, b) => a.y - b.y);
  for (const platform of platforms) drawPlatform(platform, platform === state.target);
  drawJumpGuide();
  drawPlayer();

  ctx.restore();
}

function drawBackground() {
  const gradient = ctx.createLinearGradient(0, 0, 0, canvas.height);
  gradient.addColorStop(0, "#fbfdff");
  gradient.addColorStop(0.58, "#eef6ff");
  gradient.addColorStop(1, "#dbeafe");
  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, canvas.width, canvas.height);
}

function drawPlatform(platform, target) {
  const halfW = platform.width / 2;
  const halfD = platform.depth / 2;
  const topY = platform.y - platform.depth * 0.1;

  ctx.save();
  ctx.translate(platform.x, topY);

  ctx.fillStyle = "rgba(15, 23, 42, 0.12)";
  ctx.beginPath();
  ctx.ellipse(10, platform.height + halfD + 8, halfW * 0.86, halfD * 0.42, 0, 0, Math.PI * 2);
  ctx.fill();

  ctx.fillStyle = shadeColor(platform.color, -36);
  ctx.beginPath();
  ctx.moveTo(-halfW, 0);
  ctx.lineTo(0, halfD);
  ctx.lineTo(0, halfD + platform.height);
  ctx.lineTo(-halfW, platform.height);
  ctx.closePath();
  ctx.fill();

  ctx.fillStyle = shadeColor(platform.color, -22);
  ctx.beginPath();
  ctx.moveTo(halfW, 0);
  ctx.lineTo(0, halfD);
  ctx.lineTo(0, halfD + platform.height);
  ctx.lineTo(halfW, platform.height);
  ctx.closePath();
  ctx.fill();

  const gradient = ctx.createLinearGradient(0, -halfD, 0, halfD);
  gradient.addColorStop(0, target ? "#ffffff" : "#dbeafe");
  gradient.addColorStop(0.18, platform.color);
  gradient.addColorStop(1, shadeColor(platform.color, -12));
  ctx.fillStyle = gradient;
  ctx.beginPath();
  ctx.moveTo(0, -halfD);
  ctx.lineTo(halfW, 0);
  ctx.lineTo(0, halfD);
  ctx.lineTo(-halfW, 0);
  ctx.closePath();
  ctx.fill();

  ctx.strokeStyle = target ? "rgba(255, 255, 255, 0.75)" : "rgba(255, 255, 255, 0.35)";
  ctx.lineWidth = target ? 3 : 2;
  ctx.stroke();
  ctx.restore();
}

function drawPlayer() {
  const squash = state.charging ? 1 - (state.power / MAX_POWER) * 0.24 : 1;
  const shadowScale = state.jumping ? 0.72 : 1;

  ctx.save();
  ctx.fillStyle = "rgba(15, 23, 42, 0.16)";
  ctx.beginPath();
  ctx.ellipse(state.player.x, state.player.y + 18, 19 * shadowScale, 7 * shadowScale, 0, 0, Math.PI * 2);
  ctx.fill();

  ctx.translate(state.player.x, state.player.y);
  ctx.scale(1 + (1 - squash) * 0.42, squash);

  const gradient = ctx.createRadialGradient(-6, -30, 5, 0, -18, 38);
  gradient.addColorStop(0, "#ffffff");
  gradient.addColorStop(0.18, "#60a5fa");
  gradient.addColorStop(1, "#1d4ed8");
  ctx.fillStyle = gradient;
  roundRect(-PLAYER_RADIUS, -PLAYER_RADIUS * 2.2, PLAYER_RADIUS * 2, PLAYER_RADIUS * 2.4, 13);
  ctx.fill();

  ctx.fillStyle = "rgba(255, 255, 255, 0.75)";
  ctx.beginPath();
  ctx.arc(-6, -PLAYER_RADIUS * 1.55, 4, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();
}

function drawJumpGuide() {
  const from = topCenter(state.current);
  const to = topCenter(state.target);

  ctx.save();
  ctx.strokeStyle = "rgba(15, 23, 42, 0.18)";
  ctx.setLineDash([5, 8]);
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(from.x, from.y);
  ctx.lineTo(to.x, to.y);
  ctx.stroke();
  ctx.setLineDash([]);

  if (state.charging) {
    const percent = state.power / MAX_POWER;
    ctx.fillStyle = "rgba(15, 23, 42, 0.12)";
    roundRect(86, HEIGHT - 78, 248, 12, 999);
    ctx.fill();
    ctx.fillStyle = "#2563eb";
    roundRect(86, HEIGHT - 78, 248 * percent, 12, 999);
    ctx.fill();
  }
  ctx.restore();
}

function updateHud() {
  scoreValue.textContent = String(state.score);
  powerValue.textContent = `${Math.round((state.power / MAX_POWER) * 100)}%`;
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

function lerp(start, end, progress) {
  return start + (end - start) * progress;
}

function easeInOut(progress) {
  return progress < 0.5 ? 2 * progress * progress : 1 - Math.pow(-2 * progress + 2, 2) / 2;
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
    window.GameHubProgress.recordBest("jump", score);
  }

  try {
    localStorage.setItem(STORAGE_KEY, String(score));
  } catch {
    // 本地记录失败不影响游戏流程。
  }
}

canvas.addEventListener("pointerdown", (event) => {
  event.preventDefault();
  canvas.setPointerCapture?.(event.pointerId);
  startCharge();
});
canvas.addEventListener("pointerup", (event) => {
  event.preventDefault();
  releaseJump();
});
canvas.addEventListener("pointercancel", () => {
  state.charging = false;
});

document.addEventListener("keydown", (event) => {
  if (event.code !== "Space" || event.repeat) return;
  event.preventDefault();
  startCharge();
});
document.addEventListener("keyup", (event) => {
  if (event.code !== "Space") return;
  event.preventDefault();
  releaseJump();
});

restartButton.addEventListener("click", resetGame);
overlayRestartButton.addEventListener("click", resetGame);
window.addEventListener("resize", resizeCanvas);

if (window.GameHubProgress) {
  window.GameHubProgress.registerGamePage("jump");
}

resetGame();
resizeCanvas();
requestAnimationFrame(loop);
