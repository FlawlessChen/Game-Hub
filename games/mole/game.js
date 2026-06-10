const HOLE_COUNT = 9;
const ROUND_SECONDS = 30;
const STORAGE_KEY = "game-hub-mole-best";

const boardEl = document.querySelector("#board");
const scoreEl = document.querySelector("#score");
const bestScoreEl = document.querySelector("#best-score");
const comboEl = document.querySelector("#combo");
const missesEl = document.querySelector("#misses");
const levelEl = document.querySelector("#level");
const timeLeftEl = document.querySelector("#time-left");
const statusEl = document.querySelector("#status");
const overlayEl = document.querySelector("#overlay");
const overlayTitleEl = document.querySelector("#overlay-title");
const overlayTextEl = document.querySelector("#overlay-text");
const overlayActionButton = document.querySelector("#overlay-action");
const restartButton = document.querySelector("#restart");
const pauseButton = document.querySelector("#pause");

const state = {
  status: "ready",
  score: 0,
  bestScore: readBestScore(),
  combo: 0,
  misses: 0,
  level: 1,
  timeLeft: ROUND_SECONDS,
  endsAt: 0,
  pausedAt: 0,
  pausedRemaining: ROUND_SECONDS * 1000,
  nextSpawnAt: 0,
  activeTargets: [],
  hitEffects: new Map(),
  missEffects: new Map(),
  rafId: null
};

function readBestScore() {
  try {
    return Number(localStorage.getItem(STORAGE_KEY)) || 0;
  } catch (error) {
    return 0;
  }
}

function saveBestScore(score) {
  try {
    localStorage.setItem(STORAGE_KEY, String(score));
  } catch (error) {
    return;
  }
}

function randomInt(min, max) {
  return Math.floor(min + Math.random() * (max - min + 1));
}

function targetDuration() {
  return Math.max(620, 1120 - state.level * 58);
}

function spawnDelay() {
  return Math.max(330, 800 - state.level * 48);
}

function maxActiveTargets() {
  return state.level >= 6 ? 3 : state.level >= 3 ? 2 : 1;
}

function resetGame() {
  stopLoop();
  state.status = "ready";
  state.score = 0;
  state.bestScore = readBestScore();
  state.combo = 0;
  state.misses = 0;
  state.level = 1;
  state.timeLeft = ROUND_SECONDS;
  state.endsAt = 0;
  state.pausedAt = 0;
  state.pausedRemaining = ROUND_SECONDS * 1000;
  state.nextSpawnAt = 0;
  state.activeTargets = [];
  state.hitEffects.clear();
  state.missEffects.clear();

  showOverlay("打地鼠", "Ready", "开始");
  render();
}

function startGame() {
  if (state.status === "running") {
    return;
  }

  const previousStatus = state.status;

  if (state.status === "finished") {
    resetGame();
  }

  const now = performance.now();

  if (previousStatus === "paused") {
    const pausedFor = now - state.pausedAt;
    state.activeTargets.forEach((target) => {
      target.expiresAt += pausedFor;
    });
    state.nextSpawnAt += pausedFor;
  }

  state.status = "running";
  state.endsAt = now + state.pausedRemaining;

  if (previousStatus !== "paused") {
    state.nextSpawnAt = now + 240;
  }

  hideOverlay();
  startLoop();
  render();
}

function pauseGame() {
  if (state.status !== "running") {
    return;
  }

  state.status = "paused";
  state.pausedAt = performance.now();
  state.pausedRemaining = Math.max(0, state.endsAt - state.pausedAt);
  stopLoop();
  showOverlay("Paused", "Score " + state.score, "继续");
  render();
}

function finishGame() {
  if (state.status === "finished") {
    return;
  }

  state.status = "finished";
  state.timeLeft = 0;
  state.activeTargets = [];
  stopLoop();
  updateBestScore();
  showOverlay("完成", "Score " + state.score, "再来");
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

function loop(now) {
  if (state.status !== "running") {
    state.rafId = null;
    return;
  }

  update(now);
  render();
  state.rafId = window.requestAnimationFrame(loop);
}

function update(now) {
  state.timeLeft = Math.max(0, Math.ceil((state.endsAt - now) / 1000));

  if (state.timeLeft <= 0) {
    finishGame();
    return;
  }

  expireTargets(now);
  cleanupEffects(now);
  state.level = 1 + Math.floor(state.score / 120);

  while (state.activeTargets.length < maxActiveTargets() && now >= state.nextSpawnAt) {
    spawnTarget(now);
    state.nextSpawnAt = now + spawnDelay();
  }
}

function spawnTarget(now) {
  const occupied = new Set(state.activeTargets.map((target) => target.hole));
  const freeHoles = [];

  for (let index = 0; index < HOLE_COUNT; index += 1) {
    if (!occupied.has(index)) {
      freeHoles.push(index);
    }
  }

  if (freeHoles.length === 0) {
    return;
  }

  const hole = freeHoles[randomInt(0, freeHoles.length - 1)];
  const isGold = Math.random() < 0.14;

  state.activeTargets.push({
    id: `${hole}-${now}-${Math.random().toString(36).slice(2)}`,
    hole,
    type: isGold ? "gold" : "normal",
    expiresAt: now + (isGold ? targetDuration() * 0.78 : targetDuration())
  });
}

function expireTargets(now) {
  const remaining = [];

  state.activeTargets.forEach((target) => {
    if (target.expiresAt > now) {
      remaining.push(target);
      return;
    }

    state.combo = 0;
    state.misses += 1;
    state.missEffects.set(target.hole, now + 260);
  });

  state.activeTargets = remaining;
}

function cleanupEffects(now) {
  for (const [hole, expiresAt] of state.hitEffects) {
    if (expiresAt <= now) {
      state.hitEffects.delete(hole);
    }
  }

  for (const [hole, expiresAt] of state.missEffects) {
    if (expiresAt <= now) {
      state.missEffects.delete(hole);
    }
  }
}

function hitHole(hole) {
  if (state.status !== "running") {
    startGame();
    return;
  }

  const target = state.activeTargets.find((item) => item.hole === hole);
  const now = performance.now();

  if (!target) {
    state.combo = 0;
    state.misses += 1;
    state.missEffects.set(hole, now + 260);
    render();
    return;
  }

  state.activeTargets = state.activeTargets.filter((item) => item.id !== target.id);
  state.combo += 1;
  state.score += target.type === "gold" ? 30 + state.combo * 3 : 10 + state.combo * 2;
  state.hitEffects.set(hole, now + 220);
  updateBestScore();
  render();
}

function updateBestScore() {
  if (state.score <= state.bestScore) {
    return;
  }

  state.bestScore = state.score;
  saveBestScore(state.bestScore);
}

function statusText() {
  const labels = {
    ready: "Ready",
    running: "Running",
    paused: "Paused",
    finished: "Finished"
  };

  return labels[state.status];
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

function renderStats() {
  scoreEl.textContent = state.score;
  bestScoreEl.textContent = state.bestScore;
  comboEl.textContent = state.combo;
  missesEl.textContent = state.misses;
  levelEl.textContent = state.level;
  timeLeftEl.textContent = state.timeLeft;
  statusEl.textContent = statusText();
  pauseButton.textContent = state.status === "paused" ? "继续" : "暂停";
}

function renderBoard() {
  const activeByHole = new Map(state.activeTargets.map((target) => [target.hole, target]));

  boardEl.querySelectorAll("[data-hole]").forEach((button) => {
    const hole = Number(button.dataset.hole);
    const target = activeByHole.get(hole);

    button.classList.toggle("is-active", Boolean(target));
    button.classList.toggle("is-gold", target?.type === "gold");
    button.classList.toggle("is-hit", state.hitEffects.has(hole));
    button.classList.toggle("is-missed", state.missEffects.has(hole));
  });
}

function render() {
  renderBoard();
  renderStats();
}

function createBoard() {
  boardEl.innerHTML = Array.from({ length: HOLE_COUNT }, (_, index) => {
    return `
      <button class="hole" type="button" data-hole="${index}" aria-label="hole ${index + 1}">
        <span class="mole" aria-hidden="true">
          <span class="mole-body">
            <span class="mole-face"></span>
          </span>
        </span>
      </button>
    `;
  }).join("");
}

boardEl.addEventListener("click", (event) => {
  const button = event.target.closest("[data-hole]");

  if (!button) {
    return;
  }

  hitHole(Number(button.dataset.hole));
});

overlayActionButton.addEventListener("click", () => {
  if (state.status === "paused") {
    startGame();
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

  startGame();
});

window.addEventListener("keydown", (event) => {
  if (event.key === " " || event.key === "Enter") {
    event.preventDefault();

    if (state.status === "running") {
      pauseGame();
    } else {
      startGame();
    }
  }
});

document.addEventListener("visibilitychange", () => {
  if (document.hidden && state.status === "running") {
    pauseGame();
  }
});

createBoard();
resetGame();
