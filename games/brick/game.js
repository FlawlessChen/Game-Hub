const canvas = document.querySelector("#gameCanvas");
const ctx = canvas.getContext("2d");
const gameStatus = document.querySelector("#gameStatus");
const restartButton = document.querySelector("#restartButton");
const overlay = document.querySelector("#overlay");
const overlayTitle = document.querySelector("#overlayTitle");
const overlayMessage = document.querySelector("#overlayMessage");
const overlayButton = document.querySelector("#overlayButton");

const WIDTH = 800;
const HEIGHT = 600;
const BRICK_ROWS = 5;
const BRICK_COLS = 8;
const BRICK_GAP = 8;
const BRICK_WIDTH = 80;
const BRICK_HEIGHT = 28;
const BRICK_TOP = 74;
const BRICK_LEFT = 52;
const PADDLE_BASE_WIDTH = 112;
const PADDLE_HEIGHT = 16;
const PADDLE_Y = 552;
const PADDLE_SPEED = 8.6;
const BALL_RADIUS = 8;
const BALL_SPEED = 6.3;
const POWER_SIZE = 24;
const POWER_SPEED = 2.7;
const EXTEND_DURATION = 8000;
const STORAGE_KEY = "game-hub-brick-best";

const BRICK_COLORS = ["#ef4444", "#f97316", "#eab308", "#22c55e", "#38bdf8"];
const POWER_TYPES = {
  extend: { color: "#22c55e", label: "A" },
  split: { color: "#facc15", label: "B" },
};

const state = {
  mode: "ready",
  score: 0,
  best: readBestScore(),
  lives: 3,
  bricks: [],
  balls: [],
  powerUps: [],
  keys: { left: false, right: false },
  paddle: {
    x: WIDTH / 2 - PADDLE_BASE_WIDTH / 2,
    y: PADDLE_Y,
    width: PADDLE_BASE_WIDTH,
    height: PADDLE_HEIGHT,
    extendedUntil: 0,
  },
  lastFrame: 0,
};

function resetGame() {
  state.mode = "ready";
  state.score = 0;
  state.best = readBestScore();
  state.lives = 3;
  state.bricks = createBricks();
  state.powerUps = [];
  state.paddle.width = PADDLE_BASE_WIDTH;
  state.paddle.x = WIDTH / 2 - state.paddle.width / 2;
  state.paddle.extendedUntil = 0;
  serveBall();
  hideOverlay();
  setStatus("点击画布或按空格键发球");
  draw();
}

function createBricks() {
  return Array.from({ length: BRICK_ROWS }, (_, row) =>
    Array.from({ length: BRICK_COLS }, (_, col) => {
      const life = row < 2 ? 2 : 1;
      return {
        x: BRICK_LEFT + col * (BRICK_WIDTH + BRICK_GAP),
        y: BRICK_TOP + row * (BRICK_HEIGHT + BRICK_GAP),
        width: BRICK_WIDTH,
        height: BRICK_HEIGHT,
        status: true,
        color: BRICK_COLORS[row],
        life,
        maxLife: life,
        special: (row + col) % 3 === 0,
      };
    })
  );
}

function serveBall() {
  state.balls = [
    {
      x: state.paddle.x + state.paddle.width / 2,
      y: state.paddle.y - BALL_RADIUS - 1,
      vx: 0,
      vy: 0,
      radius: BALL_RADIUS,
      stuck: true,
    },
  ];
  state.mode = "ready";
}

function launchBalls() {
  if (state.mode !== "ready") return;

  for (const ball of state.balls) {
    if (!ball.stuck) continue;
    ball.stuck = false;
    ball.vx = 3.2;
    ball.vy = -Math.sqrt(BALL_SPEED * BALL_SPEED - ball.vx * ball.vx);
  }

  state.mode = "playing";
  hideOverlay();
  setStatus("游戏进行中");
}

function loop(time) {
  const delta = Math.min(34, time - state.lastFrame || 16);
  state.lastFrame = time;

  update(delta);
  draw();
  requestAnimationFrame(loop);
}

function update(delta) {
  const step = delta / 16.67;
  updatePaddle(step);

  if (state.mode === "ready") {
    const ball = state.balls[0];
    if (ball?.stuck) {
      ball.x = state.paddle.x + state.paddle.width / 2;
      ball.y = state.paddle.y - ball.radius - 1;
    }
    return;
  }

  if (state.mode !== "playing") return;

  updatePaddleEffect();
  updateBalls(step);
  updatePowerUps(step);
  checkWin();
}

function updatePaddle(step) {
  if (state.keys.left) state.paddle.x -= PADDLE_SPEED * step;
  if (state.keys.right) state.paddle.x += PADDLE_SPEED * step;
  state.paddle.x = clamp(state.paddle.x, 0, WIDTH - state.paddle.width);
}

function updatePaddleEffect() {
  if (state.paddle.extendedUntil && performance.now() > state.paddle.extendedUntil) {
    const center = state.paddle.x + state.paddle.width / 2;
    state.paddle.width = PADDLE_BASE_WIDTH;
    state.paddle.x = clamp(center - state.paddle.width / 2, 0, WIDTH - state.paddle.width);
    state.paddle.extendedUntil = 0;
    setStatus("挡板恢复正常");
  }
}

function updateBalls(step) {
  for (const ball of state.balls) {
    ball.x += ball.vx * step;
    ball.y += ball.vy * step;

    collideWithWalls(ball);
    collideWithPaddle(ball);
    collideWithBricks(ball);
  }

  state.balls = state.balls.filter((ball) => ball.y - ball.radius <= HEIGHT);

  if (state.balls.length === 0 && state.mode === "playing") {
    state.lives -= 1;
    state.powerUps = [];
    if (state.lives <= 0) {
      endGame();
    } else {
      serveBall();
      setStatus(`剩余生命 ${state.lives}，点击或空格继续`);
    }
  }
}

function collideWithWalls(ball) {
  if (ball.x - ball.radius <= 0) {
    ball.x = ball.radius;
    ball.vx = Math.abs(ball.vx);
  }

  if (ball.x + ball.radius >= WIDTH) {
    ball.x = WIDTH - ball.radius;
    ball.vx = -Math.abs(ball.vx);
  }

  if (ball.y - ball.radius <= 0) {
    ball.y = ball.radius;
    ball.vy = Math.abs(ball.vy);
  }
}

function collideWithPaddle(ball) {
  const paddle = state.paddle;
  const insideX = ball.x + ball.radius >= paddle.x && ball.x - ball.radius <= paddle.x + paddle.width;
  const insideY = ball.y + ball.radius >= paddle.y && ball.y - ball.radius <= paddle.y + paddle.height;
  if (!insideX || !insideY || ball.vy <= 0) return;

  ball.y = paddle.y - ball.radius;
  let hit = (ball.x - (paddle.x + paddle.width / 2)) / (paddle.width / 2);
  hit = clamp(hit, -1, 1);

  if (Math.abs(hit) < 0.08) {
    hit = ball.vx >= 0 ? 0.08 : -0.08;
  }

  const maxAngle = degToRad(64);
  const angle = hit * maxAngle;
  const speed = getBallSpeed(ball);
  ball.vx = Math.sin(angle) * speed;
  ball.vy = -Math.cos(angle) * speed;
}

function collideWithBricks(ball) {
  for (const row of state.bricks) {
    for (const brick of row) {
      if (!brick.status || !circleIntersectsRect(ball, brick)) continue;

      resolveBrickBounce(ball, brick);
      brick.life -= 1;

      if (brick.life <= 0) {
        brick.status = false;
        state.score += brick.maxLife * 10;
        updateBestScore();
        maybeSpawnPowerUp(brick);
        setStatus(`得分 ${state.score}`);
      }
      return;
    }
  }
}

function resolveBrickBounce(ball, brick) {
  const overlapLeft = ball.x + ball.radius - brick.x;
  const overlapRight = brick.x + brick.width - (ball.x - ball.radius);
  const overlapTop = ball.y + ball.radius - brick.y;
  const overlapBottom = brick.y + brick.height - (ball.y - ball.radius);
  const overlapX = Math.min(overlapLeft, overlapRight);
  const overlapY = Math.min(overlapTop, overlapBottom);

  if (overlapX < overlapY) {
    ball.vx *= -1;
    ball.x += overlapLeft < overlapRight ? -overlapX : overlapX;
  } else {
    ball.vy *= -1;
    ball.y += overlapTop < overlapBottom ? -overlapY : overlapY;
  }
}

function circleIntersectsRect(ball, rect) {
  const closestX = clamp(ball.x, rect.x, rect.x + rect.width);
  const closestY = clamp(ball.y, rect.y, rect.y + rect.height);
  const dx = ball.x - closestX;
  const dy = ball.y - closestY;
  return dx * dx + dy * dy <= ball.radius * ball.radius;
}

function maybeSpawnPowerUp(brick) {
  if (!brick.special || Math.random() >= 0.2) return;

  const type = Math.random() < 0.5 ? "extend" : "split";
  state.powerUps.push({
    type,
    x: brick.x + brick.width / 2 - POWER_SIZE / 2,
    y: brick.y + brick.height / 2 - POWER_SIZE / 2,
    size: POWER_SIZE,
    vy: POWER_SPEED,
  });
}

function updatePowerUps(step) {
  for (const power of state.powerUps) {
    power.y += power.vy * step;
  }

  state.powerUps = state.powerUps.filter((power) => {
    if (power.y > HEIGHT + power.size) return false;
    if (rectsIntersect(power, state.paddle)) {
      applyPowerUp(power.type);
      return false;
    }
    return true;
  });
}

function applyPowerUp(type) {
  if (type === "extend") {
    const center = state.paddle.x + state.paddle.width / 2;
    state.paddle.width = PADDLE_BASE_WIDTH * 1.5;
    state.paddle.x = clamp(center - state.paddle.width / 2, 0, WIDTH - state.paddle.width);
    state.paddle.extendedUntil = performance.now() + EXTEND_DURATION;
    setStatus("绿色道具：挡板变长 8 秒");
    return;
  }

  if (type === "split") {
    splitBall();
    setStatus("黄色道具：小球分裂");
  }
}

function splitBall() {
  const origin = state.balls.find((ball) => !ball.stuck);
  if (!origin) return;

  const speed = getBallSpeed(origin);
  const variants = [-0.72, 0.72];
  for (const direction of variants) {
    state.balls.push({
      x: origin.x,
      y: origin.y,
      vx: direction * speed,
      vy: -Math.sqrt(Math.max(1, speed * speed - (direction * speed) ** 2)),
      radius: BALL_RADIUS,
      stuck: false,
    });
  }
}

function checkWin() {
  const hasLivingBrick = state.bricks.some((row) => row.some((brick) => brick.status));
  if (hasLivingBrick) return;

  state.mode = "won";
  updateBestScore();
  showOverlay("你赢了！", `得分 ${state.score}`);
  setStatus("你赢了！");
}

function endGame() {
  state.mode = "over";
  updateBestScore();
  showOverlay("游戏结束", `得分 ${state.score}`);
  setStatus("游戏结束");
}

function draw() {
  drawBackground();
  drawCanvasHud();
  drawBricks();
  drawPowerUps();
  drawPaddle();
  drawBalls();
  drawReadyText();
}

function drawBackground() {
  const gradient = ctx.createLinearGradient(0, 0, 0, HEIGHT);
  gradient.addColorStop(0, "#07111f");
  gradient.addColorStop(0.58, "#0b1422");
  gradient.addColorStop(1, "#111827");
  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, WIDTH, HEIGHT);

  ctx.strokeStyle = "rgba(56, 189, 248, 0.08)";
  ctx.lineWidth = 1;
  for (let x = 0; x <= WIDTH; x += 40) {
    ctx.beginPath();
    ctx.moveTo(x, 0);
    ctx.lineTo(x, HEIGHT);
    ctx.stroke();
  }
  for (let y = 0; y <= HEIGHT; y += 40) {
    ctx.beginPath();
    ctx.moveTo(0, y);
    ctx.lineTo(WIDTH, y);
    ctx.stroke();
  }
}

function drawCanvasHud() {
  ctx.fillStyle = "#edf6ff";
  ctx.font = "800 20px Inter, Segoe UI, Arial";
  ctx.textAlign = "left";
  ctx.textBaseline = "middle";
  ctx.fillText(`得分 ${state.score}`, 22, 28);

  ctx.textAlign = "right";
  ctx.fillText(`生命 ${state.lives}`, WIDTH - 22, 28);

  ctx.textAlign = "center";
  ctx.fillText(`最佳 ${state.best}`, WIDTH / 2, 28);

  if (state.paddle.extendedUntil) {
    const seconds = Math.max(0, Math.ceil((state.paddle.extendedUntil - performance.now()) / 1000));
    ctx.fillStyle = "#22c55e";
    ctx.font = "800 15px Inter, Segoe UI, Arial";
    ctx.fillText(`加长 ${seconds} 秒`, WIDTH - 22, 54);
  }
}

function drawBricks() {
  for (const row of state.bricks) {
    for (const brick of row) {
      if (!brick.status) continue;
      drawBrick(brick);
    }
  }
}

function drawBrick(brick) {
  const alpha = brick.life / brick.maxLife;
  ctx.save();
  ctx.globalAlpha = 0.72 + alpha * 0.28;
  ctx.fillStyle = brick.color;
  roundRect(ctx, brick.x, brick.y, brick.width, brick.height, 5);
  ctx.fill();

  ctx.fillStyle = "rgba(255, 255, 255, 0.22)";
  roundRect(ctx, brick.x + 3, brick.y + 3, brick.width - 6, 7, 3);
  ctx.fill();

  ctx.strokeStyle = brick.special ? "rgba(250, 204, 21, 0.9)" : "rgba(255, 255, 255, 0.18)";
  ctx.lineWidth = brick.special ? 2 : 1;
  roundRect(ctx, brick.x, brick.y, brick.width, brick.height, 5);
  ctx.stroke();

  if (brick.maxLife > 1) {
    ctx.fillStyle = "#07111f";
    ctx.font = "900 13px Inter, Segoe UI, Arial";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText(String(brick.life), brick.x + brick.width / 2, brick.y + brick.height / 2 + 1);
  }
  ctx.restore();
}

function drawPaddle() {
  const paddle = state.paddle;
  const gradient = ctx.createLinearGradient(paddle.x, paddle.y, paddle.x + paddle.width, paddle.y);
  gradient.addColorStop(0, "#38bdf8");
  gradient.addColorStop(0.5, "#edf6ff");
  gradient.addColorStop(1, "#22c55e");

  ctx.fillStyle = "rgba(0, 0, 0, 0.32)";
  roundRect(ctx, paddle.x + 4, paddle.y + 5, paddle.width, paddle.height, 8);
  ctx.fill();

  ctx.fillStyle = gradient;
  roundRect(ctx, paddle.x, paddle.y, paddle.width, paddle.height, 8);
  ctx.fill();
}

function drawBalls() {
  for (const ball of state.balls) {
    const gradient = ctx.createRadialGradient(ball.x - 3, ball.y - 4, 2, ball.x, ball.y, ball.radius + 3);
    gradient.addColorStop(0, "#ffffff");
    gradient.addColorStop(0.45, "#facc15");
    gradient.addColorStop(1, "#f97316");
    ctx.fillStyle = gradient;
    ctx.beginPath();
    ctx.arc(ball.x, ball.y, ball.radius, 0, Math.PI * 2);
    ctx.fill();
  }
}

function drawPowerUps() {
  for (const power of state.powerUps) {
    const config = POWER_TYPES[power.type];
    ctx.fillStyle = "rgba(0, 0, 0, 0.28)";
    roundRect(ctx, power.x + 3, power.y + 4, power.size, power.size, 5);
    ctx.fill();

    ctx.fillStyle = config.color;
    roundRect(ctx, power.x, power.y, power.size, power.size, 5);
    ctx.fill();

    ctx.fillStyle = "#07111f";
    ctx.font = "900 15px Inter, Segoe UI, Arial";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText(config.label, power.x + power.size / 2, power.y + power.size / 2 + 1);
  }
}

function drawReadyText() {
  if (state.mode !== "ready") return;

  ctx.save();
  ctx.fillStyle = "rgba(7, 17, 31, 0.58)";
  roundRect(ctx, 244, 268, 312, 58, 8);
  ctx.fill();
  ctx.strokeStyle = "rgba(56, 189, 248, 0.35)";
  ctx.stroke();
  ctx.fillStyle = "#edf6ff";
  ctx.font = "900 20px Inter, Segoe UI, Arial";
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.fillText("点击画布或按空格键发球", WIDTH / 2, 297);
  ctx.restore();
}

function setPaddleFromPointer(event) {
  const rect = canvas.getBoundingClientRect();
  const x = ((event.clientX - rect.left) / rect.width) * WIDTH;
  state.paddle.x = clamp(x - state.paddle.width / 2, 0, WIDTH - state.paddle.width);

  if (state.mode === "ready" && state.balls[0]?.stuck) {
    state.balls[0].x = state.paddle.x + state.paddle.width / 2;
  }
}

function rectsIntersect(a, b) {
  return a.x < b.x + b.width && a.x + a.size > b.x && a.y < b.y + b.height && a.y + a.size > b.y;
}

function getBallSpeed(ball) {
  return Math.max(BALL_SPEED, Math.hypot(ball.vx, ball.vy));
}

function showOverlay(title, message) {
  overlayTitle.textContent = title;
  overlayMessage.textContent = message;
  overlay.hidden = false;
}

function hideOverlay() {
  overlay.hidden = true;
}

function setStatus(message) {
  gameStatus.textContent = message;
}

function updateBestScore() {
  if (state.score <= state.best) return;
  state.best = state.score;
  saveBestScore(state.best);
}

function readBestScore() {
  try {
    return Number(localStorage.getItem(STORAGE_KEY) || 0);
  } catch {
    return 0;
  }
}

function saveBestScore(score) {
  if (window.GameHubProgress) {
    window.GameHubProgress.recordBest("brick", score);
  }

  try {
    localStorage.setItem(STORAGE_KEY, String(score));
  } catch {
    // 最佳分数持久化失败不影响游戏流程。
  }
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

function degToRad(degrees) {
  return (degrees / 180) * Math.PI;
}

document.addEventListener("keydown", (event) => {
  if (["ArrowLeft", "ArrowRight", " ", "Spacebar"].includes(event.key)) {
    event.preventDefault();
  }

  if (event.key === "ArrowLeft") state.keys.left = true;
  if (event.key === "ArrowRight") state.keys.right = true;
  if (event.key === " " || event.key === "Spacebar") launchBalls();
  if (event.key === "r" || event.key === "R") resetGame();
});

document.addEventListener("keyup", (event) => {
  if (event.key === "ArrowLeft") state.keys.left = false;
  if (event.key === "ArrowRight") state.keys.right = false;
});

canvas.addEventListener("pointermove", (event) => {
  event.preventDefault();
  setPaddleFromPointer(event);
});

canvas.addEventListener("pointerdown", (event) => {
  event.preventDefault();
  setPaddleFromPointer(event);
  launchBalls();
});

restartButton.addEventListener("click", resetGame);
overlayButton.addEventListener("click", resetGame);

if (window.GameHubProgress) {
  window.GameHubProgress.registerGamePage("brick");
}

resetGame();
requestAnimationFrame(loop);
