const canvas = document.querySelector("#gameCanvas");
const ctx = canvas.getContext("2d");
const floorValue = document.querySelector("#floorValue");
const bestValue = document.querySelector("#bestValue");
const finalScore = document.querySelector("#finalScore");
const gameStatus = document.querySelector("#gameStatus");
const restartButton = document.querySelector("#restartButton");
const overlayRestartButton = document.querySelector("#overlayRestartButton");
const gameOverPanel = document.querySelector("#gameOverPanel");

const LOGICAL_WIDTH = 430;
const LOGICAL_HEIGHT = 720;
const BLOCK_HEIGHT = 44;
const FOUNDATION_HEIGHT = 56;
const FOUNDATION_WIDTH = 320;
const FOUNDATION_Y = 612;
const MIN_OVERLAP = 18;
const PERFECT_TOLERANCE = 7;
const DROP_SPEED = 17;
const CAMERA_STEP = 34;
const STORAGE_KEY = "codex-tower-best";

const COLORS = ["#0f766e", "#2563eb", "#d97706", "#dc2626", "#7c3aed", "#0891b2"];

const state = {
  mode: "swing",
  time: 0,
  lastFrame: 0,
  blocks: [],
  scraps: [],
  falling: null,
  currentWidth: 284,
  score: 0,
  best: readBest(),
  cameraY: 0,
  cameraTargetY: 0,
  dpr: Math.max(1, window.devicePixelRatio || 1),
};

function resetGame() {
  state.mode = "swing";
  state.time = 0;
  state.blocks = [
    {
      x: (LOGICAL_WIDTH - FOUNDATION_WIDTH) / 2,
      y: FOUNDATION_Y,
      w: FOUNDATION_WIDTH,
      h: FOUNDATION_HEIGHT,
      color: "#334155",
      foundation: true,
    },
  ];
  state.scraps = [];
  state.falling = null;
  state.currentWidth = 284;
  state.score = 0;
  state.cameraY = 0;
  state.cameraTargetY = 0;
  gameOverPanel.hidden = true;
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
  const delta = Math.min(34, time - state.lastFrame || 16);
  state.lastFrame = time;
  state.time += delta;
  state.cameraY += (state.cameraTargetY - state.cameraY) * 0.09;

  updateScraps(delta);
  if (state.mode === "drop") updateDrop(delta);

  draw();
  requestAnimationFrame(loop);
}

function updateDrop(delta) {
  if (!state.falling) return;

  state.falling.y += DROP_SPEED * (delta / 16);

  const target = getTopBlock();
  const landingY = target.y - BLOCK_HEIGHT - state.cameraY;
  if (state.falling.y >= landingY) {
    state.falling.y = landingY;
    settleBlock();
  }
}

function updateScraps(delta) {
  for (const scrap of state.scraps) {
    scrap.x += scrap.vx * (delta / 16);
    scrap.y += scrap.vy * (delta / 16);
    scrap.vy += 0.32 * (delta / 16);
    scrap.rotation += scrap.spin * (delta / 16);
  }

  state.scraps = state.scraps.filter((scrap) => scrap.y - state.cameraY < LOGICAL_HEIGHT + 90);
}

function dropBlock() {
  if (state.mode !== "swing") return;

  const swing = getSwingBlock();
  state.falling = {
    x: swing.x,
    y: swing.y,
    w: state.currentWidth,
    h: BLOCK_HEIGHT,
    color: getBlockColor(state.score),
  };
  state.mode = "drop";
  gameStatus.textContent = "下落中";
}

function settleBlock() {
  const target = getTopBlock();
  const falling = state.falling;
  const overlapLeft = Math.max(falling.x, target.x);
  const overlapRight = Math.min(falling.x + falling.w, target.x + target.w);
  let overlapWidth = overlapRight - overlapLeft;
  let nextX = overlapLeft;

  const centerOffset = Math.abs(falling.x + falling.w / 2 - (target.x + target.w / 2));
  if (centerOffset <= PERFECT_TOLERANCE && falling.w <= target.w) {
    overlapWidth = falling.w;
    nextX = target.x + (target.w - falling.w) / 2;
  }

  if (overlapWidth < MIN_OVERLAP) {
    endGame();
    return;
  }

  addScraps(falling, overlapLeft, overlapRight, target.y - BLOCK_HEIGHT);

  state.blocks.push({
    x: nextX,
    y: target.y - BLOCK_HEIGHT,
    w: overlapWidth,
    h: BLOCK_HEIGHT,
    color: falling.color,
    foundation: false,
  });

  state.score += 1;
  state.currentWidth = Math.max(MIN_OVERLAP, overlapWidth);
  state.cameraTargetY -= CAMERA_STEP;
  state.falling = null;
  state.mode = "swing";

  if (state.score > state.best) {
    state.best = state.score;
    writeBest(state.best);
  }

  updateHud();
}

function addScraps(falling, overlapLeft, overlapRight, worldY) {
  if (falling.x < overlapLeft) {
    state.scraps.push({
      x: falling.x,
      y: worldY,
      w: overlapLeft - falling.x,
      h: BLOCK_HEIGHT,
      color: falling.color,
      vx: -2.1,
      vy: 3.2,
      rotation: 0,
      spin: -0.04,
    });
  }

  const fallingRight = falling.x + falling.w;
  if (fallingRight > overlapRight) {
    state.scraps.push({
      x: overlapRight,
      y: worldY,
      w: fallingRight - overlapRight,
      h: BLOCK_HEIGHT,
      color: falling.color,
      vx: 2.1,
      vy: 3.2,
      rotation: 0,
      spin: 0.04,
    });
  }
}

function endGame() {
  state.mode = "over";
  state.falling = null;
  if (state.score > state.best) {
    state.best = state.score;
    writeBest(state.best);
  }
  finalScore.textContent = String(state.score);
  gameStatus.textContent = "游戏结束";
  gameOverPanel.hidden = false;
  updateHud();
}

function updateHud() {
  floorValue.textContent = String(state.score);
  bestValue.textContent = String(state.best);

  if (state.mode === "over") return;
  gameStatus.textContent = `第 ${state.score + 1} 层`;
}

function draw() {
  if (state.blocks.length === 0) return;

  const view = getView();
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  ctx.save();
  ctx.translate(view.offsetX, view.offsetY);
  ctx.scale(view.scale, view.scale);

  drawBackground();
  drawCrane();
  drawBlocks();
  drawScraps();
  drawFallingBlock();
  if (state.mode === "swing") drawSwingingBlock();
  drawHudLine();

  ctx.restore();
}

function drawBackground() {
  const gradient = ctx.createLinearGradient(0, 0, 0, LOGICAL_HEIGHT);
  gradient.addColorStop(0, "#e8f6ff");
  gradient.addColorStop(0.54, "#f7fbff");
  gradient.addColorStop(1, "#dbe8f1");
  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, LOGICAL_WIDTH, LOGICAL_HEIGHT);

  ctx.fillStyle = "rgba(15, 118, 110, 0.08)";
  for (let x = -20; x < LOGICAL_WIDTH; x += 74) {
    ctx.fillRect(x, 560, 38, 110);
    ctx.fillRect(x + 8, 540, 22, 22);
  }

  ctx.strokeStyle = "rgba(16, 32, 51, 0.08)";
  ctx.lineWidth = 1;
  for (let y = 120; y < LOGICAL_HEIGHT; y += 80) {
    ctx.beginPath();
    ctx.moveTo(0, y);
    ctx.lineTo(LOGICAL_WIDTH, y);
    ctx.stroke();
  }
}

function drawCrane() {
  const swing = getSwingBlock();
  const anchorX = state.mode === "swing" ? swing.anchorX : LOGICAL_WIDTH / 2;

  ctx.save();
  ctx.strokeStyle = "#102033";
  ctx.lineWidth = 8;
  ctx.lineCap = "round";
  ctx.beginPath();
  ctx.moveTo(38, 34);
  ctx.lineTo(LOGICAL_WIDTH - 38, 34);
  ctx.stroke();

  ctx.fillStyle = "#d97706";
  ctx.fillRect(anchorX - 18, 22, 36, 24);
  ctx.fillStyle = "#ffffff";
  ctx.fillRect(anchorX - 11, 28, 22, 6);

  if (state.mode === "swing") {
    ctx.strokeStyle = "#475569";
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.moveTo(swing.anchorX, 46);
    ctx.lineTo(swing.centerX, swing.centerY - BLOCK_HEIGHT / 2);
    ctx.stroke();
  }

  ctx.restore();
}

function drawBlocks() {
  for (const block of state.blocks) {
    drawBlock(block.x, block.y - state.cameraY, block.w, block.h, block.color, block.foundation);
  }
}

function drawScraps() {
  for (const scrap of state.scraps) {
    ctx.save();
    ctx.translate(scrap.x + scrap.w / 2, scrap.y - state.cameraY + scrap.h / 2);
    ctx.rotate(scrap.rotation);
    drawBlock(-scrap.w / 2, -scrap.h / 2, scrap.w, scrap.h, scrap.color, false);
    ctx.restore();
  }
}

function drawFallingBlock() {
  if (!state.falling) return;
  drawBlock(state.falling.x, state.falling.y, state.falling.w, state.falling.h, state.falling.color, false);
}

function drawSwingingBlock() {
  const swing = getSwingBlock();
  drawBlock(swing.x, swing.y, state.currentWidth, BLOCK_HEIGHT, getBlockColor(state.score), false);
}

function drawBlock(x, y, w, h, color, foundation) {
  if (y > LOGICAL_HEIGHT + 80 || y + h < -100) return;

  ctx.save();
  ctx.fillStyle = "rgba(16, 32, 51, 0.14)";
  ctx.fillRect(x + 4, y + h - 5, w, 8);

  ctx.fillStyle = color;
  ctx.fillRect(x, y, w, h);

  ctx.fillStyle = foundation ? "rgba(255, 255, 255, 0.1)" : "rgba(255, 255, 255, 0.2)";
  ctx.fillRect(x, y, w, Math.max(5, h * 0.18));

  ctx.strokeStyle = "rgba(16, 32, 51, 0.24)";
  ctx.lineWidth = 2;
  ctx.strokeRect(x, y, w, h);

  if (foundation) {
    ctx.strokeStyle = "rgba(255, 255, 255, 0.22)";
    ctx.lineWidth = 3;
    for (let lineX = x + 18; lineX < x + w; lineX += 34) {
      ctx.beginPath();
      ctx.moveTo(lineX, y + h);
      ctx.lineTo(lineX + 24, y);
      ctx.stroke();
    }
  } else {
    drawWindows(x, y, w, h);
  }

  ctx.restore();
}

function drawWindows(x, y, w, h) {
  const count = Math.max(1, Math.floor(w / 32));
  const gap = w / (count + 1);
  ctx.fillStyle = "rgba(255, 244, 191, 0.92)";
  for (let index = 1; index <= count; index += 1) {
    const windowX = x + gap * index - 5;
    ctx.fillRect(windowX, y + 13, 10, Math.max(9, h - 25));
  }
}

function drawHudLine() {
  const target = getTopBlock();
  const y = target.y - state.cameraY - BLOCK_HEIGHT;
  if (y < 160 || y > LOGICAL_HEIGHT - 90) return;

  ctx.save();
  ctx.setLineDash([6, 8]);
  ctx.strokeStyle = "rgba(15, 118, 110, 0.36)";
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(target.x, y);
  ctx.lineTo(target.x + target.w, y);
  ctx.stroke();
  ctx.restore();
}

function getSwingBlock() {
  const target = getTopBlock();
  const speed = 0.00235 + state.score * 0.00008;
  const maxAngle = Math.min(0.76, 0.43 + state.score * 0.012);
  const angle = Math.sin(state.time * speed) * maxAngle;
  const ropeLength = 100;
  const anchorX = clamp(target.x + target.w / 2, 108, LOGICAL_WIDTH - 108);
  const centerX = anchorX + Math.sin(angle) * ropeLength;
  const centerY = 46 + Math.cos(angle) * ropeLength;

  return {
    anchorX,
    centerX,
    centerY,
    x: clamp(centerX - state.currentWidth / 2, 18, LOGICAL_WIDTH - state.currentWidth - 18),
    y: centerY - BLOCK_HEIGHT / 2,
  };
}

function getTopBlock() {
  return state.blocks[state.blocks.length - 1];
}

function getBlockColor(index) {
  return COLORS[index % COLORS.length];
}

function getView() {
  const scale = Math.min(canvas.width / LOGICAL_WIDTH, canvas.height / LOGICAL_HEIGHT);
  return {
    scale,
    offsetX: (canvas.width - LOGICAL_WIDTH * scale) / 2,
    offsetY: (canvas.height - LOGICAL_HEIGHT * scale) / 2,
  };
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
    window.GameHubProgress.recordBest("tower", score);
  }

  try {
    localStorage.setItem(STORAGE_KEY, String(score));
  } catch {
    // 最佳分数持久化失败不影响游戏流程。
  }
}

function handleAction(event) {
  const target = event.target;
  if (target instanceof Element && target.closest("button, a")) return;
  dropBlock();
}

document.addEventListener("pointerdown", handleAction);
document.addEventListener("keydown", (event) => {
  if (event.key === " " || event.key === "Spacebar") {
    event.preventDefault();
    dropBlock();
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
  window.GameHubProgress.registerGamePage("tower");
}

resetGame();
resizeCanvas();
requestAnimationFrame(loop);
