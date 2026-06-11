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
const MAX_POWER = 105;
const POWER_SPEED = 1.65;
const STORAGE_KEY = "codex-jump-best";

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
  state.current = { x: 128, y: 500, w: 116, h: 46, color: "#2563eb" };
  state.target = makeNextPlatform();
  state.player = { x: state.current.x, y: state.current.y - state.current.h / 2 - PLAYER_RADIUS };
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

function makeNextPlatform() {
  const dx = 96 + Math.random() * 110;
  const direction = Math.random() < 0.5 ? -1 : 1;
  const x = clamp(state.current.x + dx * direction, 84, WIDTH - 84);
  const y = clamp(state.current.y - 76 - Math.random() * 80, 210, 430);
  return {
    x,
    y,
    w: 84 + Math.random() * 46,
    h: 42 + Math.random() * 14,
    color: Math.random() < 0.5 ? "#16a34a" : "#f97316",
  };
}

function startCharge() {
  if (state.gameOver || state.jumping) return;
  state.charging = true;
  state.power = 0;
  gameStatus.textContent = "蓄力中...";
}

function releaseJump() {
  if (!state.charging || state.jumping || state.gameOver) return;
  state.charging = false;
  const dx = state.target.x - state.current.x;
  const dy = state.target.y - state.current.y;
  const distance = Math.hypot(dx, dy);
  const direction = { x: dx / distance, y: dy / distance };
  const travel = state.power * 2.18;
  const end = {
    x: state.current.x + direction.x * travel,
    y: state.current.y + direction.y * travel - state.current.h / 2 - PLAYER_RADIUS,
  };
  state.jump = {
    from: { ...state.player },
    to: end,
    t: 0,
    duration: 34,
  };
  state.jumping = true;
  gameStatus.textContent = "起跳";
}

function updateJump(step) {
  if (!state.jump) return;
  state.jump.t += step;
  const progress = Math.min(1, state.jump.t / state.jump.duration);
  const eased = 1 - Math.pow(1 - progress, 2);
  const arc = Math.sin(progress * Math.PI) * 82;
  state.player.x = lerp(state.jump.from.x, state.jump.to.x, eased);
  state.player.y = lerp(state.jump.from.y, state.jump.to.y, eased) - arc;

  if (progress < 1) return;
  state.player = { ...state.jump.to };
  state.jump = null;
  state.jumping = false;
  judgeLanding();
}

function judgeLanding() {
  const left = state.target.x - state.target.w / 2 - PLAYER_RADIUS * 0.35;
  const right = state.target.x + state.target.w / 2 + PLAYER_RADIUS * 0.35;
  const top = state.target.y - state.target.h / 2 - PLAYER_RADIUS * 1.2;
  const bottom = state.target.y + state.target.h / 2;
  const landed =
    state.player.x >= left &&
    state.player.x <= right &&
    state.player.y + PLAYER_RADIUS >= top &&
    state.player.y + PLAYER_RADIUS <= bottom;

  if (!landed) {
    endGame();
    return;
  }

  const centerError = Math.abs(state.player.x - state.target.x);
  const bonus = centerError < 8 ? 2 : 1;
  state.score += bonus;
  state.best = Math.max(state.best, state.score);
  writeBest(state.best);
  state.current = { ...state.target };
  state.player = { x: state.current.x, y: state.current.y - state.current.h / 2 - PLAYER_RADIUS };
  state.target = makeNextPlatform();
  state.power = 0;
  gameStatus.textContent = bonus > 1 ? "完美落点，+2" : "成功，继续";
  updateHud();
}

function endGame() {
  state.gameOver = true;
  state.charging = false;
  state.best = Math.max(state.best, state.score);
  writeBest(state.best);
  finalScore.textContent = `得分 ${state.score}`;
  gameStatus.textContent = "落空了";
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
  drawPlatform(state.target, true);
  drawPlatform(state.current, false);
  drawPowerGuide();
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
  ctx.save();
  ctx.translate(platform.x, platform.y);
  ctx.fillStyle = "rgba(15, 23, 42, 0.12)";
  roundRect(-platform.w / 2 + 8, -platform.h / 2 + 12, platform.w, platform.h, 12);
  ctx.fill();

  const gradient = ctx.createLinearGradient(0, -platform.h / 2, 0, platform.h / 2);
  gradient.addColorStop(0, target ? "#ffffff" : "#dbeafe");
  gradient.addColorStop(0.18, platform.color);
  gradient.addColorStop(1, shadeColor(platform.color, -24));
  ctx.fillStyle = gradient;
  roundRect(-platform.w / 2, -platform.h / 2, platform.w, platform.h, 12);
  ctx.fill();

  if (target) {
    ctx.strokeStyle = "rgba(255, 255, 255, 0.75)";
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.moveTo(-platform.w * 0.25, 0);
    ctx.lineTo(platform.w * 0.25, 0);
    ctx.stroke();
  }
  ctx.restore();
}

function drawPlayer() {
  const squash = state.charging ? 1 - state.power / MAX_POWER * 0.22 : 1;
  ctx.save();
  ctx.translate(state.player.x, state.player.y + PLAYER_RADIUS);
  ctx.scale(1 + (1 - squash) * 0.45, squash);
  const gradient = ctx.createRadialGradient(-6, -10, 5, 0, 0, PLAYER_RADIUS * 1.3);
  gradient.addColorStop(0, "#ffffff");
  gradient.addColorStop(0.18, "#60a5fa");
  gradient.addColorStop(1, "#1d4ed8");
  ctx.fillStyle = gradient;
  ctx.beginPath();
  ctx.arc(0, -PLAYER_RADIUS, PLAYER_RADIUS, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();
}

function drawPowerGuide() {
  if (!state.charging) return;
  const percent = state.power / MAX_POWER;
  ctx.fillStyle = "rgba(15, 23, 42, 0.12)";
  roundRect(90, HEIGHT - 78, 240, 12, 999);
  ctx.fill();
  ctx.fillStyle = "#2563eb";
  roundRect(90, HEIGHT - 78, 240 * percent, 12, 999);
  ctx.fill();
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
restartButton.addEventListener("click", resetGame);
overlayRestartButton.addEventListener("click", resetGame);
window.addEventListener("resize", resizeCanvas);

if (window.GameHubProgress) {
  window.GameHubProgress.registerGamePage("jump");
}

resetGame();
resizeCanvas();
requestAnimationFrame(loop);
