const GAME_WIDTH = 420;
const GAME_HEIGHT = 560;
const GROUND_HEIGHT = 64;
const STORAGE_KEY = "game-hub-flappy-best";

const canvas = document.querySelector("#game");
const ctx = canvas.getContext("2d");
const scoreEl = document.querySelector("#score");
const bestScoreEl = document.querySelector("#best-score");
const passedEl = document.querySelector("#passed");
const skinEl = document.querySelector("#skin");
const stageEl = document.querySelector("#stage");
const statusEl = document.querySelector("#status");
const overlayEl = document.querySelector("#overlay");
const overlayTitleEl = document.querySelector("#overlay-title");
const overlayTextEl = document.querySelector("#overlay-text");
const overlayActionButton = document.querySelector("#overlay-action");
const restartButton = document.querySelector("#restart");
const pauseButton = document.querySelector("#pause");
const flapButton = document.querySelector("#flap");

const GRAVITY = 1450;
const FLAP_FORCE = -430;
const PLAYER_X = 112;

const skins = [
  { name: "晨羽", body: "#f0b43a", hair: "#2364d8", wing: "#ffffff", accent: "#d85b2a" },
  { name: "霓光", body: "#17a2a4", hair: "#7b55c7", wing: "#e9f8ff", accent: "#f0b43a" },
  { name: "夜巡", body: "#2364d8", hair: "#152033", wing: "#dce6ef", accent: "#c43d3d" },
  { name: "樱风", body: "#d85b82", hair: "#ba6b12", wing: "#fff0f5", accent: "#2364d8" }
];

const stages = [
  {
    name: "晨空",
    top: "#dff4fb",
    bottom: "#f2f7e8",
    cloud: "rgba(255, 255, 255, 0.72)",
    pipe: "#168a5c",
    pipeDark: "#0f6845",
    ground: "#d8b064"
  },
  {
    name: "午后",
    top: "#fbe2b8",
    bottom: "#dff4fb",
    cloud: "rgba(255, 255, 255, 0.68)",
    pipe: "#2364d8",
    pipeDark: "#174ca9",
    ground: "#c99658"
  },
  {
    name: "黄昏",
    top: "#f7c0a6",
    bottom: "#cfd8ef",
    cloud: "rgba(255, 246, 230, 0.66)",
    pipe: "#ba6b12",
    pipeDark: "#8d4f0d",
    ground: "#b78152"
  },
  {
    name: "夜色",
    top: "#22365b",
    bottom: "#61708d",
    cloud: "rgba(228, 236, 248, 0.36)",
    pipe: "#7b55c7",
    pipeDark: "#513692",
    ground: "#77675a"
  }
];

const state = {
  status: "ready",
  score: 0,
  bestScore: readBestScore(),
  passed: 0,
  player: createPlayer(),
  pipes: [],
  clouds: [],
  particles: [],
  spawnTimer: 0,
  groundOffset: 0,
  lastTime: 0,
  rafId: null
};

function createPlayer() {
  return {
    x: PLAYER_X,
    y: GAME_HEIGHT * 0.46,
    radius: 18,
    velocity: 0,
    rotation: 0
  };
}

function readBestScore() {
  try {
    return Number(localStorage.getItem(STORAGE_KEY)) || 0;
  } catch (error) {
    return 0;
  }
}

function saveBestScore(score) {
  if (window.GameHubProgress) {
    window.GameHubProgress.recordBest("flappy", score);
  }

  try {
    localStorage.setItem(STORAGE_KEY, String(score));
  } catch (error) {
    return;
  }
}

function random(min, max) {
  return min + Math.random() * (max - min);
}

function clamp(value, min, max) {
  return Math.max(min, Math.min(max, value));
}

function groundY() {
  return GAME_HEIGHT - GROUND_HEIGHT;
}

function level() {
  return 1 + Math.floor(state.score / 5);
}

function themeIndex() {
  return Math.min(stages.length - 1, Math.floor(state.score / 5));
}

function currentStage() {
  return stages[themeIndex()];
}

function currentSkin() {
  return skins[themeIndex()];
}

function createClouds() {
  return Array.from({ length: 7 }, () => ({
    x: random(0, GAME_WIDTH),
    y: random(30, 250),
    width: random(46, 90),
    speed: random(10, 26)
  }));
}

function resetGame() {
  stopLoop();
  state.status = "ready";
  state.score = 0;
  state.bestScore = readBestScore();
  state.passed = 0;
  state.player = createPlayer();
  state.pipes = [];
  state.clouds = createClouds();
  state.particles = [];
  state.spawnTimer = 0.75;
  state.groundOffset = 0;

  showOverlay("飞翔的小鸟", "准备开始", "开始");
  render();
}

function startGame() {
  if (state.status === "running") {
    flap();
    return;
  }

  if (state.status === "gameover") {
    resetGame();
  }

  state.status = "running";
  hideOverlay();
  state.lastTime = performance.now();
  flap();
  startLoop();
  renderStats();
}

function pauseGame() {
  if (state.status !== "running") {
    return;
  }

  state.status = "paused";
  stopLoop();
  showOverlay("已暂停", "得分 " + state.score, "继续");
  renderStats();
}

function resumeGame() {
  if (state.status !== "paused") {
    return;
  }

  state.status = "running";
  hideOverlay();
  state.lastTime = performance.now();
  startLoop();
  renderStats();
}

function gameOver() {
  if (state.status === "gameover") {
    return;
  }

  state.status = "gameover";
  stopLoop();
  updateBestScore();
  burst(state.player.x, state.player.y, currentSkin().accent, 18);
  showOverlay("游戏结束", "得分 " + state.score, "重开");
  render();
}

function startLoop() {
  stopLoop();
  state.rafId = window.requestAnimationFrame(loop);
}

function stopLoop() {
  if (state.rafId !== null) {
    window.cancelAnimationFrame(state.rafId);
    state.rafId = null;
  }
}

function loop(time) {
  if (state.status !== "running") {
    state.rafId = null;
    return;
  }

  const dt = Math.min((time - state.lastTime) / 1000, 0.033);
  state.lastTime = time;

  update(dt);
  render();
  state.rafId = window.requestAnimationFrame(loop);
}

function flap() {
  state.player.velocity = FLAP_FORCE;
  state.player.rotation = -0.42;
  burst(state.player.x - 18, state.player.y + 12, currentSkin().wing, 5);
}

function update(dt) {
  updatePlayer(dt);
  updatePipes(dt);
  updateClouds(dt);
  updateParticles(dt);
  updateGround(dt);
  spawnPipes(dt);
  detectCollisions();
  updateBestScore();
}

function updatePlayer(dt) {
  const player = state.player;

  player.velocity += GRAVITY * dt;
  player.y += player.velocity * dt;
  player.rotation = clamp(player.velocity / 650, -0.5, 1.1);
}

function updatePipes(dt) {
  const speed = pipeSpeed();

  state.pipes.forEach((pipe) => {
    pipe.x -= speed * dt;

    if (!pipe.passed && pipe.x + pipe.width < state.player.x - state.player.radius) {
      pipe.passed = true;
      state.score += 1;
      state.passed += 1;
      burst(state.player.x, state.player.y, currentSkin().accent, 8);
    }
  });

  state.pipes = state.pipes.filter((pipe) => pipe.x + pipe.width > -20);
}

function updateClouds(dt) {
  const speed = pipeSpeed() * 0.16;

  state.clouds.forEach((cloud) => {
    cloud.x -= (speed + cloud.speed) * dt;

    if (cloud.x + cloud.width < -20) {
      cloud.x = GAME_WIDTH + random(20, 120);
      cloud.y = random(30, 250);
      cloud.width = random(46, 90);
      cloud.speed = random(10, 26);
    }
  });
}

function updateParticles(dt) {
  state.particles.forEach((particle) => {
    particle.x += particle.vx * dt;
    particle.y += particle.vy * dt;
    particle.vy += 320 * dt;
    particle.life -= dt;
    particle.size *= 0.985;
  });

  state.particles = state.particles.filter((particle) => particle.life > 0 && particle.size > 0.6);
}

function updateGround(dt) {
  state.groundOffset = (state.groundOffset + pipeSpeed() * dt) % 32;
}

function spawnPipes(dt) {
  state.spawnTimer -= dt;

  if (state.spawnTimer > 0) {
    return;
  }

  addPipe();
  state.spawnTimer = Math.max(1.05, 1.55 - level() * 0.035);
}

function pipeSpeed() {
  return Math.min(238, 150 + level() * 8);
}

function pipeGap() {
  return Math.max(124, 166 - level() * 4);
}

function addPipe() {
  const gap = pipeGap();
  const minCenter = gap / 2 + 48;
  const maxCenter = groundY() - gap / 2 - 38;

  state.pipes.push({
    x: GAME_WIDTH + 26,
    width: 72,
    gapY: random(minCenter, maxCenter),
    gap,
    passed: false
  });
}

function detectCollisions() {
  const player = state.player;

  if (player.y - player.radius <= 0 || player.y + player.radius >= groundY()) {
    gameOver();
    return;
  }

  for (const pipe of state.pipes) {
    const topRect = {
      x: pipe.x,
      y: 0,
      width: pipe.width,
      height: pipe.gapY - pipe.gap / 2
    };
    const bottomRect = {
      x: pipe.x,
      y: pipe.gapY + pipe.gap / 2,
      width: pipe.width,
      height: groundY() - (pipe.gapY + pipe.gap / 2)
    };

    if (circleRectCollision(player, topRect) || circleRectCollision(player, bottomRect)) {
      gameOver();
      return;
    }
  }
}

function circleRectCollision(circle, rect) {
  const closestX = clamp(circle.x, rect.x, rect.x + rect.width);
  const closestY = clamp(circle.y, rect.y, rect.y + rect.height);
  const dx = circle.x - closestX;
  const dy = circle.y - closestY;

  return dx * dx + dy * dy <= circle.radius * circle.radius;
}

function burst(x, y, color, count) {
  for (let index = 0; index < count; index += 1) {
    const angle = random(0, Math.PI * 2);
    const speed = random(35, 130);

    state.particles.push({
      x,
      y,
      vx: Math.cos(angle) * speed,
      vy: Math.sin(angle) * speed,
      size: random(2, 5),
      life: random(0.25, 0.6),
      color
    });
  }
}

function updateBestScore() {
  if (state.score <= state.bestScore) {
    return;
  }

  state.bestScore = state.score;
  saveBestScore(state.bestScore);
}

function showOverlay(title, text, actionText) {
  overlayTitleEl.textContent = title;
  overlayTextEl.textContent = text;
  overlayActionButton.textContent = actionText;
  overlayEl.classList.remove("is-hidden");
}

function hideOverlay() {
  overlayEl.classList.add("is-hidden");
}

function statusText() {
  const labels = {
    ready: "准备开始",
    running: "进行中",
    paused: "已暂停",
    gameover: "游戏结束"
  };

  return labels[state.status];
}

function renderStats() {
  scoreEl.textContent = state.score;
  bestScoreEl.textContent = state.bestScore;
  passedEl.textContent = state.passed;
  skinEl.textContent = currentSkin().name;
  stageEl.textContent = currentStage().name;
  statusEl.textContent = statusText();
  pauseButton.textContent = state.status === "paused" ? "继续" : "暂停";
}

function resizeCanvasBuffer() {
  const rect = canvas.getBoundingClientRect();
  const ratio = window.devicePixelRatio || 1;
  const width = Math.max(300, Math.round(rect.width * ratio));
  const height = Math.max(400, Math.round(rect.height * ratio));

  if (canvas.width !== width || canvas.height !== height) {
    canvas.width = width;
    canvas.height = height;
  }

  ctx.setTransform(canvas.width / GAME_WIDTH, 0, 0, canvas.height / GAME_HEIGHT, 0, 0);
}

function render() {
  resizeCanvasBuffer();
  drawBackground();
  drawClouds();
  drawPipes();
  drawPlayer();
  drawParticles();
  drawGround();
  renderStats();
}

function drawBackground() {
  const stage = currentStage();
  const gradient = ctx.createLinearGradient(0, 0, 0, GAME_HEIGHT);
  gradient.addColorStop(0, stage.top);
  gradient.addColorStop(1, stage.bottom);

  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, GAME_WIDTH, GAME_HEIGHT);

  ctx.fillStyle = "rgba(255, 255, 255, 0.22)";
  for (let y = 70; y < groundY(); y += 88) {
    ctx.fillRect(0, y, GAME_WIDTH, 1.5);
  }

  ctx.fillStyle = themeIndex() === 3 ? "rgba(255, 255, 255, 0.55)" : "rgba(255, 214, 93, 0.8)";
  ctx.beginPath();
  ctx.arc(GAME_WIDTH - 72, 76, 30, 0, Math.PI * 2);
  ctx.fill();
}

function drawClouds() {
  const stage = currentStage();

  state.clouds.forEach((cloud) => {
    ctx.fillStyle = stage.cloud;
    drawCloud(cloud.x, cloud.y, cloud.width);
  });
}

function drawCloud(x, y, width) {
  const height = width * 0.36;

  ctx.beginPath();
  ctx.arc(x + width * 0.25, y + height * 0.55, height * 0.45, 0, Math.PI * 2);
  ctx.arc(x + width * 0.48, y + height * 0.35, height * 0.55, 0, Math.PI * 2);
  ctx.arc(x + width * 0.72, y + height * 0.58, height * 0.42, 0, Math.PI * 2);
  ctx.fillRect(x + width * 0.22, y + height * 0.45, width * 0.58, height * 0.38);
  ctx.fill();
}

function drawPipes() {
  const stage = currentStage();

  state.pipes.forEach((pipe) => {
    const topHeight = pipe.gapY - pipe.gap / 2;
    const bottomY = pipe.gapY + pipe.gap / 2;
    const bottomHeight = groundY() - bottomY;

    drawPipe(pipe.x, 0, pipe.width, topHeight, true, stage);
    drawPipe(pipe.x, bottomY, pipe.width, bottomHeight, false, stage);
  });
}

function drawPipe(x, y, width, height, flip, stage) {
  if (height <= 0) {
    return;
  }

  ctx.fillStyle = stage.pipe;
  ctx.fillRect(x, y, width, height);

  ctx.fillStyle = "rgba(255, 255, 255, 0.2)";
  ctx.fillRect(x + 10, y, 9, height);

  ctx.fillStyle = stage.pipeDark;
  ctx.fillRect(x + width - 12, y, 12, height);

  const capHeight = 24;
  const capY = flip ? y + height - capHeight : y;
  ctx.fillStyle = stage.pipeDark;
  drawRoundRect(x - 8, capY, width + 16, capHeight, 6);
  ctx.fill();
}

function drawPlayer() {
  const player = state.player;
  const skin = currentSkin();

  ctx.save();
  ctx.translate(player.x, player.y);
  ctx.rotate(player.rotation);

  ctx.fillStyle = "rgba(21, 32, 51, 0.14)";
  ctx.beginPath();
  ctx.ellipse(1, player.radius + 11, 20, 6, 0, 0, Math.PI * 2);
  ctx.fill();

  ctx.fillStyle = skin.wing;
  ctx.beginPath();
  ctx.ellipse(-13, 3, 14, 8, -0.55, 0, Math.PI * 2);
  ctx.fill();
  ctx.strokeStyle = "rgba(21, 32, 51, 0.14)";
  ctx.lineWidth = 2;
  ctx.stroke();

  ctx.fillStyle = skin.body;
  ctx.beginPath();
  ctx.ellipse(0, 0, 19, 17, 0, 0, Math.PI * 2);
  ctx.fill();

  ctx.fillStyle = skin.hair;
  ctx.beginPath();
  ctx.moveTo(-15, -10);
  ctx.quadraticCurveTo(-3, -25, 12, -11);
  ctx.quadraticCurveTo(1, -15, -15, -10);
  ctx.fill();

  ctx.fillStyle = "#ffffff";
  ctx.beginPath();
  ctx.arc(8, -3, 5.5, 0, Math.PI * 2);
  ctx.fill();

  ctx.fillStyle = "#152033";
  ctx.beginPath();
  ctx.arc(10, -2.5, 2.3, 0, Math.PI * 2);
  ctx.fill();

  ctx.fillStyle = skin.accent;
  ctx.beginPath();
  ctx.moveTo(18, 0);
  ctx.lineTo(30, 5);
  ctx.lineTo(18, 10);
  ctx.closePath();
  ctx.fill();

  ctx.restore();
}

function drawParticles() {
  state.particles.forEach((particle) => {
    ctx.globalAlpha = clamp(particle.life / 0.6, 0, 1);
    ctx.fillStyle = particle.color;
    ctx.beginPath();
    ctx.arc(particle.x, particle.y, particle.size, 0, Math.PI * 2);
    ctx.fill();
    ctx.globalAlpha = 1;
  });
}

function drawGround() {
  const stage = currentStage();
  const y = groundY();

  ctx.fillStyle = stage.ground;
  ctx.fillRect(0, y, GAME_WIDTH, GROUND_HEIGHT);

  ctx.fillStyle = "rgba(255, 255, 255, 0.24)";
  ctx.fillRect(0, y, GAME_WIDTH, 8);

  ctx.fillStyle = "rgba(21, 32, 51, 0.12)";
  for (let x = -32 - state.groundOffset; x < GAME_WIDTH + 32; x += 32) {
    ctx.fillRect(x, y + 18, 18, 4);
    ctx.fillRect(x + 10, y + 42, 20, 4);
  }
}

function drawRoundRect(x, y, width, height, radius) {
  const r = Math.min(radius, width / 2, height / 2);

  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.lineTo(x + width - r, y);
  ctx.quadraticCurveTo(x + width, y, x + width, y + r);
  ctx.lineTo(x + width, y + height - r);
  ctx.quadraticCurveTo(x + width, y + height, x + width - r, y + height);
  ctx.lineTo(x + r, y + height);
  ctx.quadraticCurveTo(x, y + height, x, y + height - r);
  ctx.lineTo(x, y + r);
  ctx.quadraticCurveTo(x, y, x + r, y);
  ctx.closePath();
}

function handleAction() {
  if (state.status === "paused") {
    resumeGame();
    return;
  }

  startGame();
}

function handleKeydown(event) {
  if (event.key === " " || event.key === "ArrowUp" || event.key === "w" || event.key === "W") {
    event.preventDefault();
    startGame();
    return;
  }

  if (event.key === "Enter") {
    event.preventDefault();
    handleAction();
    return;
  }

  if (event.key === "Escape") {
    pauseGame();
  }
}

overlayActionButton.addEventListener("click", handleAction);
restartButton.addEventListener("click", () => {
  resetGame();
  startGame();
});
pauseButton.addEventListener("click", () => {
  if (state.status === "running") {
    pauseGame();
    return;
  }

  handleAction();
});
flapButton.addEventListener("click", startGame);
canvas.addEventListener("pointerdown", (event) => {
  event.preventDefault();
  startGame();
});
window.addEventListener("keydown", handleKeydown);
window.addEventListener("resize", render);
window.addEventListener("gamehub:viewportchange", render);
document.addEventListener("visibilitychange", () => {
  if (document.hidden && state.status === "running") {
    pauseGame();
  }
});

if (window.GameHubProgress) {
  window.GameHubProgress.registerGamePage("flappy");
}

resetGame();
