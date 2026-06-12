const canvas = document.querySelector("#gameCanvas");
const ctx = canvas.getContext("2d");
const gameStatus = document.querySelector("#gameStatus");
const restartButton = document.querySelector("#restartButton");
const overlayRestartButton = document.querySelector("#overlayRestartButton");
const gameOverPanel = document.querySelector("#gameOverPanel");

const LOGICAL_WIDTH = 420;
const LOGICAL_HEIGHT = 700;
const BALL_RADIUS = 50;
const PIN_LENGTH = 112;
const PIN_HEAD_RADIUS = 5;
const FIRE_SPEED = 18;
const ROTATION_SPEED = 0.017;
const TOTAL_PINS = 12;
const STARTING_PINS = [-115, -42, 38, 126];
const STORAGE_KEY = "codex-needle-best";

const state = {
  angle: 0,
  pins: [],
  queue: [],
  flyingPin: null,
  score: 0,
  best: readBest(),
  gameOver: false,
  lastFrame: 0,
  dpr: Math.max(1, window.devicePixelRatio || 1),
};

function resetGame() {
  state.angle = 0;
  state.pins = STARTING_PINS.map((angle) => ({
    id: null,
    angle: degToRad(angle),
  }));
  state.queue = Array.from({ length: TOTAL_PINS }, (_, index) => index + 1);
  state.flyingPin = null;
  state.score = 0;
  state.gameOver = false;
  gameOverPanel.hidden = true;
  gameStatus.textContent = "点击屏幕或按空格键发射";
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
    state.angle = normalizeAngle(state.angle + ROTATION_SPEED * (delta / 16));
    updateFlyingPin(delta);
  }

  draw();
  requestAnimationFrame(loop);
}

function updateFlyingPin(delta) {
  if (!state.flyingPin) return;

  state.flyingPin.y -= FIRE_SPEED * (delta / 16);
  const ball = getBall();
  const attachY = ball.y + BALL_RADIUS - 3;

  if (state.flyingPin.y <= attachY) {
    attachFlyingPin();
  }
}

function firePin() {
  if (state.gameOver) return;
  if (state.flyingPin || state.queue.length === 0) return;

  const next = state.queue.shift();
  state.flyingPin = {
    id: next,
    x: LOGICAL_WIDTH / 2,
    y: LOGICAL_HEIGHT - 116,
  };
  gameStatus.textContent = `发射 ${next}`;
}

function attachFlyingPin() {
  const pin = state.flyingPin;
  if (!pin) return;

  const attachAngle = normalizeAngle(Math.PI / 2 - state.angle);
  const hit = state.pins.some((existingPin) => angleDistance(existingPin.angle, attachAngle) < 0.19);

  if (hit) {
    endGame();
    return;
  }

  state.pins.push({ id: pin.id, angle: attachAngle });
  state.flyingPin = null;
  state.score += 1;
  console.log("hit", { pin: pin.id, score: state.score });

  if (state.queue.length === 0) {
    state.best = Math.max(state.best, state.score);
    writeBest(state.best);
    gameStatus.textContent = "全部插入，点击或按空格继续下一局";
    setTimeout(resetGame, 700);
  } else {
    gameStatus.textContent = `成功 ${state.score}/${TOTAL_PINS}`;
  }
}

function endGame() {
  state.gameOver = true;
  state.best = Math.max(state.best, state.score);
  writeBest(state.best);
  gameStatus.textContent = "游戏结束";
  gameOverPanel.hidden = false;
}

function draw() {
  const scale = Math.min(canvas.width / LOGICAL_WIDTH, canvas.height / LOGICAL_HEIGHT);
  const offsetX = (canvas.width - LOGICAL_WIDTH * scale) / 2;
  const offsetY = (canvas.height - LOGICAL_HEIGHT * scale) / 2;

  ctx.save();
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  drawBackground();
  ctx.translate(offsetX, offsetY);
  ctx.scale(scale, scale);

  drawScore();
  drawPins();
  drawBall();
  drawFlyingPin();
  drawQueue();

  ctx.restore();
}

function drawBackground() {
  const gradient = ctx.createLinearGradient(0, 0, 0, canvas.height);
  gradient.addColorStop(0, "#f9fbff");
  gradient.addColorStop(0.58, "#eef4fb");
  gradient.addColorStop(1, "#e4edf6");
  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, canvas.width, canvas.height);
}

function drawScore() {
  ctx.fillStyle = "#111827";
  ctx.font = "800 18px Inter, Segoe UI, Arial";
  ctx.textAlign = "left";
  ctx.textBaseline = "middle";
  ctx.fillText(`已插入 ${state.score}/${TOTAL_PINS}`, 26, 34);

  ctx.fillStyle = "#687385";
  ctx.font = "700 13px Inter, Segoe UI, Arial";
  ctx.textAlign = "right";
  ctx.fillText(`最佳 ${state.best}`, LOGICAL_WIDTH - 26, 34);
}

function drawBall() {
  const ball = getBall();
  const pulse = 1 + Math.sin(state.angle * 2.4) * 0.018;

  ctx.save();
  ctx.translate(ball.x, ball.y);
  ctx.rotate(state.angle);

  const gradient = ctx.createRadialGradient(-16, -18, 8, 0, 0, BALL_RADIUS * 1.4);
  gradient.addColorStop(0, "#ffffff");
  gradient.addColorStop(0.18, "#7dd3fc");
  gradient.addColorStop(0.58, "#2563eb");
  gradient.addColorStop(1, "#172554");
  ctx.fillStyle = gradient;
  ctx.beginPath();
  ctx.arc(0, 0, BALL_RADIUS * pulse, 0, Math.PI * 2);
  ctx.fill();

  ctx.strokeStyle = "rgba(255, 255, 255, 0.38)";
  ctx.lineWidth = 4;
  ctx.beginPath();
  ctx.arc(0, 0, BALL_RADIUS - 11, -0.2, Math.PI * 1.15);
  ctx.stroke();

  ctx.fillStyle = "#ffffff";
  ctx.font = "900 22px Inter, Segoe UI, Arial";
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.fillText(String(state.queue.length), 0, 1);
  ctx.restore();
}

function drawPins() {
  const ball = getBall();
  for (const pin of state.pins) {
    drawAttachedPin(ball.x, ball.y, pin.angle + state.angle, pin.id);
  }
}

function drawAttachedPin(x, y, angle, id) {
  const start = polarPoint(x, y, angle, BALL_RADIUS - 3);
  const end = polarPoint(x, y, angle, BALL_RADIUS + PIN_LENGTH);
  const label = polarPoint(x, y, angle, BALL_RADIUS + PIN_LENGTH + 18);

  ctx.save();
  ctx.strokeStyle = "#1f2937";
  ctx.lineWidth = 4;
  ctx.lineCap = "round";
  ctx.beginPath();
  ctx.moveTo(start.x, start.y);
  ctx.lineTo(end.x, end.y);
  ctx.stroke();

  ctx.fillStyle = "#111827";
  ctx.beginPath();
  ctx.arc(end.x, end.y, PIN_HEAD_RADIUS, 0, Math.PI * 2);
  ctx.fill();

  if (id === null) {
    ctx.restore();
    return;
  }

  ctx.fillStyle = "#2563eb";
  ctx.beginPath();
  ctx.arc(label.x, label.y, 12, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = "#ffffff";
  ctx.font = "800 11px Inter, Segoe UI, Arial";
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.fillText(String(id), label.x, label.y + 0.5);
  ctx.restore();
}

function drawFlyingPin() {
  if (!state.flyingPin) return;

  const pin = state.flyingPin;
  ctx.save();
  ctx.strokeStyle = "#111827";
  ctx.lineWidth = 4;
  ctx.lineCap = "round";
  ctx.beginPath();
  ctx.moveTo(pin.x, pin.y + PIN_LENGTH);
  ctx.lineTo(pin.x, pin.y);
  ctx.stroke();

  ctx.fillStyle = "#111827";
  ctx.beginPath();
  ctx.arc(pin.x, pin.y + PIN_LENGTH, PIN_HEAD_RADIUS, 0, Math.PI * 2);
  ctx.fill();

  ctx.fillStyle = "#dc2626";
  ctx.beginPath();
  ctx.arc(pin.x, pin.y + PIN_LENGTH + 18, 12, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = "#ffffff";
  ctx.font = "800 11px Inter, Segoe UI, Arial";
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.fillText(String(pin.id), pin.x, pin.y + PIN_LENGTH + 18.5);
  ctx.restore();
}

function drawQueue() {
  const startY = LOGICAL_HEIGHT - 74;
  const visiblePins = state.queue.slice(0, 8);
  const spacing = 42;
  const totalWidth = (visiblePins.length - 1) * spacing;
  const startX = LOGICAL_WIDTH / 2 - totalWidth / 2;

  ctx.save();
  ctx.fillStyle = "#687385";
  ctx.font = "700 13px Inter, Segoe UI, Arial";
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.fillText("待发射", LOGICAL_WIDTH / 2, startY - 42);

  for (let index = 0; index < visiblePins.length; index += 1) {
    const id = visiblePins[index];
    const x = startX + index * spacing;
    ctx.strokeStyle = index === 0 ? "#dc2626" : "#475569";
    ctx.lineWidth = index === 0 ? 4 : 3;
    ctx.lineCap = "round";
    ctx.beginPath();
    ctx.moveTo(x, startY + 20);
    ctx.lineTo(x, startY - 14);
    ctx.stroke();

    ctx.fillStyle = index === 0 ? "#dc2626" : "#2563eb";
    ctx.beginPath();
    ctx.arc(x, startY + 23, 12, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = "#ffffff";
    ctx.font = "800 11px Inter, Segoe UI, Arial";
    ctx.fillText(String(id), x, startY + 23.5);
  }

  if (state.queue.length > visiblePins.length) {
    ctx.fillStyle = "#687385";
    ctx.font = "800 12px Inter, Segoe UI, Arial";
    ctx.fillText(`+${state.queue.length - visiblePins.length}`, LOGICAL_WIDTH - 28, startY + 22);
  }

  ctx.restore();
}

function getBall() {
  return {
    x: LOGICAL_WIDTH / 2,
    y: 238,
  };
}

function polarPoint(x, y, angle, radius) {
  return {
    x: x + Math.cos(angle) * radius,
    y: y + Math.sin(angle) * radius,
  };
}

function angleDistance(a, b) {
  return Math.abs(Math.atan2(Math.sin(a - b), Math.cos(a - b)));
}

function normalizeAngle(angle) {
  return Math.atan2(Math.sin(angle), Math.cos(angle));
}

function degToRad(degrees) {
  return (degrees / 180) * Math.PI;
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
    window.GameHubProgress.recordBest("needle", score);
  }

  try {
    localStorage.setItem(STORAGE_KEY, String(score));
  } catch {
    // 最佳分数持久化失败不影响游戏流程。
  }
}

function handleLaunch(event) {
  const target = event.target;
  if (target instanceof HTMLButtonElement || target instanceof HTMLAnchorElement) return;
  firePin();
}

document.addEventListener("pointerdown", handleLaunch);
document.addEventListener("keydown", (event) => {
  if (event.key === " " || event.key === "Spacebar") {
    event.preventDefault();
    firePin();
  }

  if (event.key === "r" || event.key === "R") {
    resetGame();
  }
});

restartButton.addEventListener("click", resetGame);
overlayRestartButton.addEventListener("click", resetGame);
window.addEventListener("resize", resizeCanvas);
window.addEventListener("gamehub:viewportchange", resizeCanvas);

if (window.GameHubProgress) {
  window.GameHubProgress.registerGamePage("needle");
}

resizeCanvas();
resetGame();
requestAnimationFrame(loop);
