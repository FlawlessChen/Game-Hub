const GAME_WIDTH = 480;
const GAME_HEIGHT = 640;
const STORAGE_KEY = "game-hub-plane-best";

const canvas = document.querySelector("#game");
const ctx = canvas.getContext("2d");
const scoreEl = document.querySelector("#score");
const bestScoreEl = document.querySelector("#best-score");
const livesEl = document.querySelector("#lives");
const killsEl = document.querySelector("#kills");
const levelEl = document.querySelector("#level");
const statusEl = document.querySelector("#status");
const overlayEl = document.querySelector("#overlay");
const overlayTitleEl = document.querySelector("#overlay-title");
const overlayTextEl = document.querySelector("#overlay-text");
const overlayActionButton = document.querySelector("#overlay-action");
const restartButton = document.querySelector("#restart");
const pauseButton = document.querySelector("#pause");
const fireButton = document.querySelector("#fire");
const controlButtons = document.querySelectorAll("[data-direction]");

const state = {
  status: "ready",
  score: 0,
  bestScore: readBestScore(),
  lives: 3,
  kills: 0,
  level: 1,
  player: createPlayer(),
  bullets: [],
  enemies: [],
  enemyBullets: [],
  sparks: [],
  stars: [],
  keys: { up: false, down: false, left: false, right: false },
  spawnTimer: 0,
  fireTimer: 0,
  lastTime: 0,
  rafId: null,
  pointerActive: false
};

function createPlayer() {
  return {
    x: GAME_WIDTH / 2,
    y: GAME_HEIGHT - 74,
    width: 38,
    height: 46,
    speed: 270,
    invulnerable: 0
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
    window.GameHubProgress.recordBest("plane", score);
  }

  try {
    localStorage.setItem(STORAGE_KEY, String(score));
  } catch (error) {
    return;
  }
}

function clamp(value, min, max) {
  return Math.max(min, Math.min(max, value));
}

function random(min, max) {
  return min + Math.random() * (max - min);
}

function resetGame() {
  stopLoop();
  state.status = "ready";
  state.score = 0;
  state.bestScore = readBestScore();
  state.lives = 3;
  state.kills = 0;
  state.level = 1;
  state.player = createPlayer();
  state.bullets = [];
  state.enemies = [];
  state.enemyBullets = [];
  state.sparks = [];
  state.stars = createStars();
  state.spawnTimer = 0;
  state.fireTimer = 0;
  state.keys = { up: false, down: false, left: false, right: false };

  showOverlay("飞机大战", "准备开始", "开始");
  render();
}

function startGame() {
  if (state.status === "running") {
    return;
  }

  if (state.status === "gameover") {
    resetGame();
  }

  state.status = "running";
  hideOverlay();
  state.lastTime = performance.now();
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
  state.status = "gameover";
  stopLoop();
  updateBestScore();
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

function update(dt) {
  state.level = 1 + Math.floor(state.score / 500);
  updateStars(dt);
  updatePlayer(dt);
  updateBullets(dt);
  updateEnemies(dt);
  updateEnemyBullets(dt);
  updateSparks(dt);
  handleSpawns(dt);
  handleAutoFire(dt);
  handleCollisions();
  removeInactiveObjects();
  updateBestScore();
}

function updatePlayer(dt) {
  const player = state.player;
  let dx = 0;
  let dy = 0;

  if (state.keys.left) {
    dx -= 1;
  }

  if (state.keys.right) {
    dx += 1;
  }

  if (state.keys.up) {
    dy -= 1;
  }

  if (state.keys.down) {
    dy += 1;
  }

  if (dx !== 0 || dy !== 0) {
    const length = Math.hypot(dx, dy);
    player.x += (dx / length) * player.speed * dt;
    player.y += (dy / length) * player.speed * dt;
  }

  player.x = clamp(player.x, player.width / 2 + 8, GAME_WIDTH - player.width / 2 - 8);
  player.y = clamp(player.y, GAME_HEIGHT * 0.45, GAME_HEIGHT - player.height / 2 - 10);
  player.invulnerable = Math.max(0, player.invulnerable - dt);
}

function updateBullets(dt) {
  state.bullets.forEach((bullet) => {
    bullet.y -= bullet.speed * dt;
    bullet.life -= dt;
  });
}

function updateEnemyBullets(dt) {
  state.enemyBullets.forEach((bullet) => {
    bullet.x += bullet.vx * dt;
    bullet.y += bullet.vy * dt;
    bullet.life -= dt;
  });
}

function updateEnemies(dt) {
  state.enemies.forEach((enemy) => {
    enemy.x += Math.sin(enemy.age * enemy.swayRate + enemy.seed) * enemy.sway * dt;
    enemy.y += enemy.speed * dt;
    enemy.age += dt;
    enemy.shootTimer -= dt;

    if (enemy.shootTimer <= 0 && enemy.type !== "scout") {
      shootEnemyBullet(enemy);
      enemy.shootTimer = random(1.1, 1.9) - Math.min(state.level * 0.04, 0.35);
    }
  });
}

function updateSparks(dt) {
  state.sparks.forEach((spark) => {
    spark.x += spark.vx * dt;
    spark.y += spark.vy * dt;
    spark.life -= dt;
    spark.size *= 0.985;
  });
}

function createStars() {
  return Array.from({ length: 54 }, () => ({
    x: random(0, GAME_WIDTH),
    y: random(0, GAME_HEIGHT),
    radius: random(0.7, 2.3),
    speed: random(18, 76),
    alpha: random(0.22, 0.78)
  }));
}

function updateStars(dt) {
  state.stars.forEach((star) => {
    star.y += (star.speed + state.level * 5) * dt;

    if (star.y > GAME_HEIGHT + 6) {
      star.x = random(0, GAME_WIDTH);
      star.y = -6;
      star.radius = random(0.7, 2.3);
      star.speed = random(18, 76);
      star.alpha = random(0.22, 0.78);
    }
  });
}

function handleSpawns(dt) {
  state.spawnTimer -= dt;

  if (state.spawnTimer > 0) {
    return;
  }

  spawnEnemy();
  state.spawnTimer = Math.max(0.38, 1.0 - state.level * 0.055);
}

function handleAutoFire(dt) {
  state.fireTimer -= dt;

  if (state.fireTimer > 0) {
    return;
  }

  shootPlayer();
  state.fireTimer = Math.max(0.13, 0.24 - state.level * 0.012);
}

function enemyTemplate() {
  const roll = Math.random();

  if (roll < 0.58) {
    return {
      type: "scout",
      width: 32,
      height: 34,
      hp: 1,
      speed: random(88, 126) + state.level * 5,
      score: 20,
      sway: 26,
      color: "#c43d3d"
    };
  }

  if (roll < 0.88) {
    return {
      type: "fighter",
      width: 42,
      height: 44,
      hp: 2 + Math.floor(state.level / 5),
      speed: random(66, 94) + state.level * 4,
      score: 45,
      sway: 18,
      color: "#ba6b12"
    };
  }

  return {
    type: "bomber",
    width: 58,
    height: 52,
    hp: 4 + Math.floor(state.level / 4),
    speed: random(45, 68) + state.level * 3,
    score: 90,
    sway: 12,
    color: "#7b55c7"
  };
}

function spawnEnemy() {
  const template = enemyTemplate();
  const enemy = {
    ...template,
    maxHp: template.hp,
    x: random(template.width / 2 + 10, GAME_WIDTH - template.width / 2 - 10),
    y: -template.height,
    age: 0,
    seed: random(0, Math.PI * 2),
    swayRate: random(1.2, 2.2),
    shootTimer: random(0.9, 1.8)
  };

  state.enemies.push(enemy);
}

function shootPlayer(force = false) {
  if (state.status !== "running" && !force) {
    return;
  }

  const player = state.player;
  const spread = state.level >= 5 ? [-15, 0, 15] : state.level >= 3 ? [-10, 10] : [0];

  spread.forEach((offset) => {
    state.bullets.push({
      x: player.x + offset,
      y: player.y - player.height / 2,
      radius: 4,
      speed: 520,
      damage: 1,
      life: 1.6
    });
  });
}

function shootEnemyBullet(enemy) {
  const player = state.player;
  const angle = Math.atan2(player.y - enemy.y, player.x - enemy.x);
  const speed = 145 + state.level * 8;

  state.enemyBullets.push({
    x: enemy.x,
    y: enemy.y + enemy.height * 0.42,
    radius: 5,
    vx: Math.cos(angle) * speed,
    vy: Math.sin(angle) * speed,
    life: 3.2
  });
}

function handleCollisions() {
  state.bullets.forEach((bullet) => {
    state.enemies.forEach((enemy) => {
      if (bullet.hit || enemy.dead || !circleRectCollision(bullet, enemy)) {
        return;
      }

      bullet.hit = true;
      enemy.hp -= bullet.damage;
      createSparks(bullet.x, bullet.y, "#f0b43a", 6);

      if (enemy.hp <= 0) {
        destroyEnemy(enemy);
      }
    });
  });

  if (state.player.invulnerable > 0) {
    return;
  }

  state.enemyBullets.forEach((bullet) => {
    if (bullet.hit || !circleRectCollision(bullet, state.player)) {
      return;
    }

    bullet.hit = true;
    damagePlayer();
  });

  state.enemies.forEach((enemy) => {
    if (enemy.dead || !rectsOverlap(state.player, enemy)) {
      return;
    }

    enemy.dead = true;
    createExplosion(enemy.x, enemy.y, enemy.color);
    damagePlayer();
  });
}

function destroyEnemy(enemy) {
  enemy.dead = true;
  state.kills += 1;
  state.score += enemy.score + state.level * 4;
  createExplosion(enemy.x, enemy.y, enemy.color);
}

function damagePlayer() {
  state.lives -= 1;
  state.player.invulnerable = 1.2;
  createExplosion(state.player.x, state.player.y, "#2364d8");

  if (state.lives <= 0) {
    gameOver();
  }
}

function removeInactiveObjects() {
  state.bullets = state.bullets.filter((bullet) => !bullet.hit && bullet.life > 0 && bullet.y > -20);
  state.enemyBullets = state.enemyBullets.filter(
    (bullet) =>
      !bullet.hit &&
      bullet.life > 0 &&
      bullet.x > -30 &&
      bullet.x < GAME_WIDTH + 30 &&
      bullet.y > -30 &&
      bullet.y < GAME_HEIGHT + 30
  );
  state.enemies = state.enemies.filter((enemy) => !enemy.dead && enemy.y < GAME_HEIGHT + enemy.height);
  state.sparks = state.sparks.filter((spark) => spark.life > 0 && spark.size > 0.8);
}

function updateBestScore() {
  if (state.score <= state.bestScore) {
    return;
  }

  state.bestScore = state.score;
  saveBestScore(state.bestScore);
}

function rectBounds(rect) {
  return {
    left: rect.x - rect.width / 2,
    right: rect.x + rect.width / 2,
    top: rect.y - rect.height / 2,
    bottom: rect.y + rect.height / 2
  };
}

function rectsOverlap(first, second) {
  const a = rectBounds(first);
  const b = rectBounds(second);

  return a.left < b.right && a.right > b.left && a.top < b.bottom && a.bottom > b.top;
}

function circleRectCollision(circle, rect) {
  const bounds = rectBounds(rect);
  const closestX = clamp(circle.x, bounds.left, bounds.right);
  const closestY = clamp(circle.y, bounds.top, bounds.bottom);
  const distanceX = circle.x - closestX;
  const distanceY = circle.y - closestY;

  return distanceX * distanceX + distanceY * distanceY <= circle.radius * circle.radius;
}

function createExplosion(x, y, color) {
  createSparks(x, y, color, 22);
}

function createSparks(x, y, color, count) {
  for (let index = 0; index < count; index += 1) {
    const angle = random(0, Math.PI * 2);
    const speed = random(50, 190);

    state.sparks.push({
      x,
      y,
      vx: Math.cos(angle) * speed,
      vy: Math.sin(angle) * speed,
      size: random(2, 6),
      life: random(0.25, 0.65),
      color
    });
  }
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
  livesEl.textContent = state.lives;
  killsEl.textContent = state.kills;
  levelEl.textContent = state.level;
  statusEl.textContent = statusText();
  pauseButton.textContent = state.status === "paused" ? "继续" : "暂停";
}

function resizeCanvasBuffer() {
  const rect = canvas.getBoundingClientRect();
  const ratio = window.devicePixelRatio || 1;
  const width = Math.max(320, Math.round(rect.width * ratio));
  const height = Math.max(426, Math.round(rect.height * ratio));

  if (canvas.width !== width || canvas.height !== height) {
    canvas.width = width;
    canvas.height = height;
  }

  ctx.setTransform(canvas.width / GAME_WIDTH, 0, 0, canvas.height / GAME_HEIGHT, 0, 0);
}

function render() {
  resizeCanvasBuffer();
  drawBackground();
  drawBullets();
  drawEnemies();
  drawEnemyBullets();
  drawPlayer();
  drawSparks();
  renderStats();
}

function drawBackground() {
  const gradient = ctx.createLinearGradient(0, 0, 0, GAME_HEIGHT);
  gradient.addColorStop(0, "#dff3fb");
  gradient.addColorStop(0.58, "#eef6f0");
  gradient.addColorStop(1, "#d8e3e7");

  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, GAME_WIDTH, GAME_HEIGHT);

  ctx.strokeStyle = "rgba(255, 255, 255, 0.42)";
  ctx.lineWidth = 2;

  for (let x = -40; x < GAME_WIDTH + 40; x += 80) {
    ctx.beginPath();
    ctx.moveTo(x, 0);
    ctx.lineTo(x + 120, GAME_HEIGHT);
    ctx.stroke();
  }

  state.stars.forEach((star) => {
    ctx.beginPath();
    ctx.arc(star.x, star.y, star.radius, 0, Math.PI * 2);
    ctx.fillStyle = "rgba(35, 100, 216, " + star.alpha + ")";
    ctx.fill();
  });
}

function drawBullets() {
  state.bullets.forEach((bullet) => {
    ctx.fillStyle = "#f0b43a";
    drawRoundRect(bullet.x - 3, bullet.y - 13, 6, 18, 3);
    ctx.fill();
    ctx.fillStyle = "rgba(255, 255, 255, 0.7)";
    drawRoundRect(bullet.x - 1.5, bullet.y - 10, 3, 9, 2);
    ctx.fill();
  });
}

function drawEnemyBullets() {
  state.enemyBullets.forEach((bullet) => {
    ctx.beginPath();
    ctx.arc(bullet.x, bullet.y, bullet.radius, 0, Math.PI * 2);
    ctx.fillStyle = "#c43d3d";
    ctx.fill();
  });
}

function drawEnemies() {
  state.enemies.forEach((enemy) => {
    ctx.save();
    ctx.translate(enemy.x, enemy.y);
    ctx.fillStyle = enemy.color;

    ctx.beginPath();
    ctx.moveTo(0, enemy.height / 2);
    ctx.lineTo(-enemy.width / 2, -enemy.height * 0.12);
    ctx.lineTo(-enemy.width * 0.18, -enemy.height * 0.2);
    ctx.lineTo(0, -enemy.height / 2);
    ctx.lineTo(enemy.width * 0.18, -enemy.height * 0.2);
    ctx.lineTo(enemy.width / 2, -enemy.height * 0.12);
    ctx.closePath();
    ctx.fill();

    ctx.fillStyle = "rgba(255, 255, 255, 0.26)";
    drawRoundRect(-enemy.width * 0.12, -enemy.height * 0.28, enemy.width * 0.24, enemy.height * 0.33, 4);
    ctx.fill();

    if (enemy.maxHp > 1) {
      const barWidth = enemy.width;
      ctx.fillStyle = "rgba(21, 32, 51, 0.28)";
      ctx.fillRect(-barWidth / 2, enemy.height / 2 + 6, barWidth, 4);
      ctx.fillStyle = "#168a5c";
      ctx.fillRect(-barWidth / 2, enemy.height / 2 + 6, barWidth * (enemy.hp / enemy.maxHp), 4);
    }

    ctx.restore();
  });
}

function drawPlayer() {
  const player = state.player;

  if (player.invulnerable > 0 && Math.floor(player.invulnerable * 14) % 2 === 0) {
    return;
  }

  ctx.save();
  ctx.translate(player.x, player.y);

  ctx.fillStyle = "rgba(35, 100, 216, 0.25)";
  ctx.beginPath();
  ctx.ellipse(0, player.height * 0.46, player.width * 0.42, 8, 0, 0, Math.PI * 2);
  ctx.fill();

  ctx.fillStyle = "#2364d8";
  ctx.beginPath();
  ctx.moveTo(0, -player.height / 2);
  ctx.lineTo(-player.width * 0.24, player.height * 0.1);
  ctx.lineTo(-player.width / 2, player.height * 0.38);
  ctx.lineTo(-player.width * 0.16, player.height * 0.25);
  ctx.lineTo(0, player.height / 2);
  ctx.lineTo(player.width * 0.16, player.height * 0.25);
  ctx.lineTo(player.width / 2, player.height * 0.38);
  ctx.lineTo(player.width * 0.24, player.height * 0.1);
  ctx.closePath();
  ctx.fill();

  ctx.fillStyle = "#17a2a4";
  drawRoundRect(-player.width * 0.13, -player.height * 0.18, player.width * 0.26, player.height * 0.32, 5);
  ctx.fill();

  ctx.fillStyle = "#f0b43a";
  ctx.beginPath();
  ctx.moveTo(-7, player.height * 0.42);
  ctx.lineTo(0, player.height * 0.66);
  ctx.lineTo(7, player.height * 0.42);
  ctx.closePath();
  ctx.fill();

  ctx.restore();
}

function drawSparks() {
  state.sparks.forEach((spark) => {
    ctx.globalAlpha = clamp(spark.life / 0.65, 0, 1);
    ctx.beginPath();
    ctx.arc(spark.x, spark.y, spark.size, 0, Math.PI * 2);
    ctx.fillStyle = spark.color;
    ctx.fill();
    ctx.globalAlpha = 1;
  });
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

function keyDirection(key) {
  const directions = {
    ArrowUp: "up",
    w: "up",
    W: "up",
    ArrowDown: "down",
    s: "down",
    S: "down",
    ArrowLeft: "left",
    a: "left",
    A: "left",
    ArrowRight: "right",
    d: "right",
    D: "right"
  };

  return directions[key];
}

function setDirection(name, active) {
  if (!Object.prototype.hasOwnProperty.call(state.keys, name)) {
    return;
  }

  state.keys[name] = active;
  controlButtons.forEach((button) => {
    if (button.dataset.direction === name) {
      button.classList.toggle("is-held", active);
    }
  });
}

function handleKeydown(event) {
  const direction = keyDirection(event.key);

  if (direction) {
    event.preventDefault();
    setDirection(direction, true);

    if (state.status === "ready") {
      startGame();
    }

    return;
  }

  if (event.key === " " || event.key === "Enter") {
    event.preventDefault();

    if (state.status === "running") {
      shootPlayer(true);
    } else if (state.status === "paused") {
      resumeGame();
    } else {
      startGame();
    }
  }

  if (event.key === "Escape") {
    pauseGame();
  }
}

function handleKeyup(event) {
  const direction = keyDirection(event.key);

  if (!direction) {
    return;
  }

  event.preventDefault();
  setDirection(direction, false);
}

function canvasPoint(event) {
  const rect = canvas.getBoundingClientRect();

  return {
    x: ((event.clientX - rect.left) / rect.width) * GAME_WIDTH,
    y: ((event.clientY - rect.top) / rect.height) * GAME_HEIGHT
  };
}

function movePlayerToEvent(event) {
  if (state.status === "ready") {
    startGame();
  }

  if (state.status !== "running") {
    return;
  }

  const point = canvasPoint(event);
  state.player.x = clamp(point.x, state.player.width / 2 + 8, GAME_WIDTH - state.player.width / 2 - 8);
  state.player.y = clamp(point.y, GAME_HEIGHT * 0.45, GAME_HEIGHT - state.player.height / 2 - 10);
}

overlayActionButton.addEventListener("click", () => {
  if (state.status === "paused") {
    resumeGame();
    return;
  }

  startGame();
});

restartButton.addEventListener("click", () => {
  resetGame();
  startGame();
});

pauseButton.addEventListener("click", () => {
  if (state.status === "running") {
    pauseGame();
    return;
  }

  if (state.status === "paused") {
    resumeGame();
    return;
  }

  startGame();
});

fireButton.addEventListener("click", () => {
  if (state.status === "ready") {
    startGame();
  }

  shootPlayer(true);
});

controlButtons.forEach((button) => {
  const direction = button.dataset.direction;

  button.addEventListener("pointerdown", (event) => {
    event.preventDefault();
    setDirection(direction, true);
    button.setPointerCapture(event.pointerId);

    if (state.status === "ready") {
      startGame();
    }
  });

  button.addEventListener("pointerup", (event) => {
    event.preventDefault();
    setDirection(direction, false);
  });

  button.addEventListener("pointercancel", () => setDirection(direction, false));
  button.addEventListener("pointerleave", () => setDirection(direction, false));
});

canvas.addEventListener("pointerdown", (event) => {
  state.pointerActive = true;
  canvas.setPointerCapture(event.pointerId);
  movePlayerToEvent(event);
});

canvas.addEventListener("pointermove", (event) => {
  if (state.pointerActive) {
    movePlayerToEvent(event);
  }
});

canvas.addEventListener("pointerup", () => {
  state.pointerActive = false;
});

canvas.addEventListener("pointercancel", () => {
  state.pointerActive = false;
});

window.addEventListener("keydown", handleKeydown);
window.addEventListener("keyup", handleKeyup);
window.addEventListener("resize", render);
window.addEventListener("gamehub:viewportchange", render);
document.addEventListener("visibilitychange", () => {
  if (document.hidden && state.status === "running") {
    pauseGame();
  }
});

if (window.GameHubProgress) {
  window.GameHubProgress.registerGamePage("plane");
}

resetGame();
