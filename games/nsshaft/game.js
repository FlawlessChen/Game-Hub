const canvas = document.querySelector("#gameCanvas");
const ctx = canvas.getContext("2d");
const gameStatus = document.querySelector("#gameStatus");
const restartButton = document.querySelector("#restartButton");
const gameOverPanel = document.querySelector("#gameOverPanel");
const overlayRestartButton = document.querySelector("#overlayRestartButton");
const finalScore = document.querySelector("#finalScore");

const WIDTH = 450;
const HEIGHT = 800;
const PLAYER_SIZE = 28;
const GRAVITY = 0.52;
const PLAYER_SPEED = 5.2;
const PLATFORM_SPEED = 1.45;
const PLATFORM_HEIGHT = 16;
const PLATFORM_MIN_WIDTH = 86;
const PLATFORM_MAX_WIDTH = 170;
const PLATFORM_GAP_MIN = 86;
const PLATFORM_GAP_MAX = 126;
const SPIKE_HEIGHT = 42;
const START_LIVES = 3;
const RESPAWN_INVULN = 1200;

const COLORS = {
  backgroundTop: "#081426",
  backgroundBottom: "#0f172a",
  normalPlatform: "#38bdf8",
  spikePlatform: "#ef4444",
  player: "#f8fafc",
  playerInvuln: "#facc15",
};

const state = {
  mode: "playing",
  score: 0,
  lives: START_LIVES,
  player: {
    x: WIDTH / 2 - PLAYER_SIZE / 2,
    y: 0,
    vx: 0,
    vy: 0,
    size: PLAYER_SIZE,
    invulnerableUntil: 0,
  },
  platforms: [],
  keys: {
    left: false,
    right: false,
  },
  pointerDir: 0,
  lastFrame: 0,
};

function resetGame() {
  state.mode = "playing";
  state.score = 0;
  state.lives = START_LIVES;
  state.platforms = createInitialPlatforms();
  state.keys.left = false;
  state.keys.right = false;
  state.pointerDir = 0;
  gameOverPanel.hidden = true;

  const startPlatform = state.platforms.find((platform) => platform.safeStart) || state.platforms[0];
  placePlayerOnPlatform(startPlatform);
  state.player.invulnerableUntil = performance.now() + 600;
  updateStatus();
  draw();
}

function createInitialPlatforms() {
  const platforms = [];
  const startPlatform = {
    x: WIDTH / 2 - 120,
    y: HEIGHT - 116,
    width: 240,
    height: PLATFORM_HEIGHT,
    type: "normal",
    damaged: false,
    safeStart: true,
  };
  platforms.push(startPlatform);

  let y = startPlatform.y - 112;
  while (y > 72) {
    platforms.push(createPlatform(y));
    y -= randomBetween(PLATFORM_GAP_MIN, PLATFORM_GAP_MAX);
  }

  return platforms;
}

function createPlatform(y) {
  const width = randomBetween(PLATFORM_MIN_WIDTH, PLATFORM_MAX_WIDTH);
  const type = Math.random() < 0.24 ? "spike" : "normal";
  return {
    x: randomBetween(16, WIDTH - width - 16),
    y,
    width,
    height: PLATFORM_HEIGHT,
    type,
    damaged: false,
    safeStart: false,
  };
}

function loop(time) {
  const delta = Math.min(34, time - state.lastFrame || 16);
  state.lastFrame = time;

  if (state.mode === "playing") {
    update(delta / 16.67);
  }

  draw();
  requestAnimationFrame(loop);
}

function update(step) {
  movePlatforms(step);
  movePlayer(step);
  resolvePlatformLanding(step);
  checkPlayerBounds();
  updateStatus();
}

function movePlatforms(step) {
  for (const platform of state.platforms) {
    platform.y -= PLATFORM_SPEED * step;
  }

  const remaining = [];
  for (const platform of state.platforms) {
    if (platform.y + platform.height < 0) {
      state.score += 1;
    } else {
      remaining.push(platform);
    }
  }
  state.platforms = remaining;

  let lowestY = Math.max(...state.platforms.map((platform) => platform.y));
  while (lowestY < HEIGHT + 70) {
    const nextY = lowestY + randomBetween(PLATFORM_GAP_MIN, PLATFORM_GAP_MAX);
    state.platforms.push(createPlatform(nextY));
    lowestY = nextY;
  }
}

function movePlayer(step) {
  const player = state.player;
  const dir = getMoveDirection();
  player.x += dir * PLAYER_SPEED * step;
  player.x = clamp(player.x, 0, WIDTH - player.size);

  player.prevY = player.y;
  player.vy += GRAVITY * step;
  player.y += player.vy * step;
}

function resolvePlatformLanding(step) {
  const player = state.player;
  if (player.vy < 0) return;

  const prevBottom = player.prevY + player.size;
  const currentBottom = player.y + player.size;
  let landedPlatform = null;

  for (const platform of state.platforms) {
    const horizontalOverlap =
      player.x + player.size > platform.x + 4 && player.x < platform.x + platform.width - 4;
    const verticalCatch =
      currentBottom >= platform.y &&
      prevBottom <= platform.y + Math.max(12, PLATFORM_SPEED * step + 10) &&
      player.y < platform.y + platform.height;

    if (horizontalOverlap && verticalCatch) {
      landedPlatform = platform;
      break;
    }
  }

  if (!landedPlatform) return;

  player.y = landedPlatform.y - player.size;
  player.vy = 0;

  if (landedPlatform.type === "spike" && !landedPlatform.damaged) {
    landedPlatform.damaged = true;
    loseLife("spike");
  }
}

function checkPlayerBounds() {
  const player = state.player;
  if (player.y <= SPIKE_HEIGHT - 4) {
    loseLife("top");
    return;
  }

  if (player.y > HEIGHT) {
    loseLife("bottom");
  }
}

function loseLife(reason) {
  const now = performance.now();
  if (state.mode !== "playing") return;
  if (now < state.player.invulnerableUntil) return;

  state.lives -= 1;
  if (state.lives <= 0) {
    endGame();
    return;
  }

  if (reason === "spike") {
    gameStatus.textContent = `踩到地刺，剩余 ${state.lives} 条命`;
  } else if (reason === "top") {
    gameStatus.textContent = `撞到顶部钉子，剩余 ${state.lives} 条命`;
  } else {
    gameStatus.textContent = `跌落出屏幕，剩余 ${state.lives} 条命`;
  }

  respawnPlayer();
}

function respawnPlayer() {
  let platform = state.platforms
    .filter((item) => item.type === "normal" && item.y > HEIGHT * 0.48 && item.y < HEIGHT - 70)
    .sort((a, b) => b.y - a.y)[0];

  if (!platform) {
    platform = {
      x: WIDTH / 2 - 110,
      y: HEIGHT - 120,
      width: 220,
      height: PLATFORM_HEIGHT,
      type: "normal",
      damaged: false,
      safeStart: false,
    };
    state.platforms.push(platform);
  }

  placePlayerOnPlatform(platform);
  state.player.invulnerableUntil = performance.now() + RESPAWN_INVULN;
}

function placePlayerOnPlatform(platform) {
  state.player.x = platform.x + platform.width / 2 - state.player.size / 2;
  state.player.y = platform.y - state.player.size;
  state.player.vx = 0;
  state.player.vy = 0;
  state.player.prevY = state.player.y;
}

function endGame() {
  state.mode = "over";
  finalScore.textContent = String(state.score);
  gameOverPanel.hidden = false;
  gameStatus.textContent = "Game Over";
}

function updateStatus() {
  if (state.mode !== "playing") return;
  gameStatus.textContent = `层数 ${state.score} / 生命 ${state.lives}`;
}

function getMoveDirection() {
  const keyboard = (state.keys.right ? 1 : 0) - (state.keys.left ? 1 : 0);
  return keyboard || state.pointerDir;
}

function draw() {
  drawBackground();
  drawSpikes();
  drawHud();
  drawPlatforms();
  drawPlayer();
  drawTouchZones();
}

function drawBackground() {
  const gradient = ctx.createLinearGradient(0, 0, 0, HEIGHT);
  gradient.addColorStop(0, COLORS.backgroundTop);
  gradient.addColorStop(1, COLORS.backgroundBottom);
  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, WIDTH, HEIGHT);

  ctx.strokeStyle = "rgba(56, 189, 248, 0.08)";
  ctx.lineWidth = 1;
  for (let y = 76; y < HEIGHT; y += 58) {
    ctx.beginPath();
    ctx.moveTo(0, y);
    ctx.lineTo(WIDTH, y);
    ctx.stroke();
  }
}

function drawSpikes() {
  ctx.fillStyle = "#dbeafe";
  ctx.fillRect(0, 0, WIDTH, 8);

  const spikeWidth = 30;
  for (let x = 0; x < WIDTH; x += spikeWidth) {
    ctx.beginPath();
    ctx.moveTo(x, 8);
    ctx.lineTo(x + spikeWidth / 2, SPIKE_HEIGHT);
    ctx.lineTo(x + spikeWidth, 8);
    ctx.closePath();
    ctx.fillStyle = x % 60 === 0 ? "#f8fafc" : "#cbd5e1";
    ctx.fill();
  }
}

function drawHud() {
  ctx.save();
  ctx.fillStyle = "rgba(6, 17, 31, 0.6)";
  roundRect(ctx, 14, 50, 176, 38, 7);
  ctx.fill();
  roundRect(ctx, WIDTH - 142, 50, 128, 38, 7);
  ctx.fill();

  ctx.fillStyle = "#edf6ff";
  ctx.font = "900 18px Inter, Segoe UI, Arial";
  ctx.textAlign = "left";
  ctx.textBaseline = "middle";
  ctx.fillText(`层数 ${state.score}`, 28, 69);

  ctx.textAlign = "right";
  ctx.fillText(`生命 ${state.lives}`, WIDTH - 28, 69);
  ctx.restore();
}

function drawPlatforms() {
  for (const platform of state.platforms) {
    if (platform.y > HEIGHT + 40 || platform.y + platform.height < -40) continue;
    if (platform.type === "spike") {
      drawSpikePlatform(platform);
    } else {
      drawNormalPlatform(platform);
    }
  }
}

function drawNormalPlatform(platform) {
  ctx.save();
  ctx.fillStyle = "rgba(0, 0, 0, 0.28)";
  roundRect(ctx, platform.x + 3, platform.y + 4, platform.width, platform.height, 6);
  ctx.fill();

  const gradient = ctx.createLinearGradient(platform.x, platform.y, platform.x + platform.width, platform.y);
  gradient.addColorStop(0, "#0ea5e9");
  gradient.addColorStop(0.5, "#67e8f9");
  gradient.addColorStop(1, "#22c55e");
  ctx.fillStyle = gradient;
  roundRect(ctx, platform.x, platform.y, platform.width, platform.height, 6);
  ctx.fill();
  ctx.restore();
}

function drawSpikePlatform(platform) {
  ctx.save();
  ctx.fillStyle = "rgba(0, 0, 0, 0.3)";
  roundRect(ctx, platform.x + 3, platform.y + 4, platform.width, platform.height, 6);
  ctx.fill();

  ctx.fillStyle = platform.damaged ? "#7f1d1d" : COLORS.red;
  roundRect(ctx, platform.x, platform.y, platform.width, platform.height, 6);
  ctx.fill();

  ctx.fillStyle = "#fee2e2";
  const count = Math.max(3, Math.floor(platform.width / 18));
  const gap = platform.width / count;
  for (let index = 0; index < count; index += 1) {
    const x = platform.x + index * gap + gap / 2;
    ctx.beginPath();
    ctx.moveTo(x - 7, platform.y);
    ctx.lineTo(x, platform.y - 15);
    ctx.lineTo(x + 7, platform.y);
    ctx.closePath();
    ctx.fill();
  }
  ctx.restore();
}

function drawPlayer() {
  const player = state.player;
  const invulnerable = performance.now() < player.invulnerableUntil;
  if (invulnerable && Math.floor(performance.now() / 90) % 2 === 0) return;

  ctx.save();
  ctx.fillStyle = "rgba(0, 0, 0, 0.35)";
  roundRect(ctx, player.x + 4, player.y + 5, player.size, player.size, 6);
  ctx.fill();

  const gradient = ctx.createLinearGradient(player.x, player.y, player.x + player.size, player.y + player.size);
  gradient.addColorStop(0, invulnerable ? COLORS.playerInvuln : COLORS.player);
  gradient.addColorStop(1, invulnerable ? "#fb923c" : "#93c5fd");
  ctx.fillStyle = gradient;
  roundRect(ctx, player.x, player.y, player.size, player.size, 6);
  ctx.fill();

  ctx.fillStyle = "#0f172a";
  ctx.fillRect(player.x + 8, player.y + 10, 4, 4);
  ctx.fillRect(player.x + 17, player.y + 10, 4, 4);
  ctx.restore();
}

function drawTouchZones() {
  if (state.mode !== "playing") return;

  ctx.save();
  ctx.fillStyle = "rgba(148, 163, 184, 0.08)";
  ctx.fillRect(0, HEIGHT - 76, WIDTH / 2, 76);
  ctx.fillRect(WIDTH / 2, HEIGHT - 76, WIDTH / 2, 76);
  ctx.fillStyle = "rgba(237, 246, 255, 0.32)";
  ctx.font = "900 18px Inter, Segoe UI, Arial";
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.fillText("LEFT", WIDTH * 0.25, HEIGHT - 38);
  ctx.fillText("RIGHT", WIDTH * 0.75, HEIGHT - 38);
  ctx.restore();
}

function setPointerDirection(event) {
  const target = event.target;
  if (target instanceof Element && target.closest("button, a")) return;
  state.pointerDir = event.clientX < window.innerWidth / 2 ? -1 : 1;
}

function clearPointerDirection() {
  state.pointerDir = 0;
}

function roundRect(context, x, y, width, height, radius) {
  const r = Math.min(radius, width / 2, height / 2);
  context.beginPath();
  context.moveTo(x + r, y);
  context.lineTo(x + width - r, y);
  context.quadraticCurveTo(x + width, y, x + width, y + r);
  context.lineTo(x + width, y + height - r);
  context.quadraticCurveTo(x + width, y + height, x + width - r, y + height);
  context.lineTo(x + r, y + height);
  context.quadraticCurveTo(x, y + height, x, y + height - r);
  context.lineTo(x, y + r);
  context.quadraticCurveTo(x, y, x + r, y);
}

function clamp(value, min, max) {
  return Math.min(max, Math.max(min, value));
}

function randomBetween(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

document.addEventListener("keydown", (event) => {
  if (["ArrowLeft", "ArrowRight"].includes(event.key)) {
    event.preventDefault();
  }

  if (event.key === "ArrowLeft") state.keys.left = true;
  if (event.key === "ArrowRight") state.keys.right = true;
  if (event.key === "r" || event.key === "R") resetGame();
});

document.addEventListener("keyup", (event) => {
  if (event.key === "ArrowLeft") state.keys.left = false;
  if (event.key === "ArrowRight") state.keys.right = false;
});

document.addEventListener("pointerdown", (event) => {
  setPointerDirection(event);
});
document.addEventListener("pointermove", (event) => {
  if (state.pointerDir !== 0) setPointerDirection(event);
});
document.addEventListener("pointerup", clearPointerDirection);
document.addEventListener("pointercancel", clearPointerDirection);
document.addEventListener("contextmenu", (event) => event.preventDefault());

restartButton.addEventListener("click", resetGame);
overlayRestartButton.addEventListener("click", resetGame);

resetGame();
requestAnimationFrame(loop);
