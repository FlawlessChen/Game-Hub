const PAIR_COUNT = 8;
const STORAGE_KEY = "game-hub-memory-best";
const labels = ["A1", "B2", "C3", "D4", "E5", "F6", "G7", "H8"];

const boardEl = document.querySelector("#board");
const movesEl = document.querySelector("#moves");
const bestScoreEl = document.querySelector("#best-score");
const matchesEl = document.querySelector("#matches");
const timerEl = document.querySelector("#timer");
const accuracyEl = document.querySelector("#accuracy");
const statusEl = document.querySelector("#status");
const overlayEl = document.querySelector("#overlay");
const overlayTitleEl = document.querySelector("#overlay-title");
const overlayTextEl = document.querySelector("#overlay-text");
const overlayActionButton = document.querySelector("#overlay-action");
const restartButton = document.querySelector("#restart");
const shuffleButton = document.querySelector("#shuffle");

const state = {
  deck: [],
  flipped: [],
  moves: 0,
  matches: 0,
  mismatches: 0,
  locked: false,
  status: "ready",
  startedAt: 0,
  elapsed: 0,
  timerId: null,
  bestMoves: readBestMoves()
};

function readBestMoves() {
  try {
    return Number(localStorage.getItem(STORAGE_KEY)) || 0;
  } catch (error) {
    return 0;
  }
}

function saveBestMoves(moves) {
  try {
    localStorage.setItem(STORAGE_KEY, String(moves));
  } catch (error) {
    return;
  }
}

function createDeck() {
  const cards = [];

  for (let index = 0; index < PAIR_COUNT; index += 1) {
    cards.push(createCard(index, 0));
    cards.push(createCard(index, 1));
  }

  return shuffle(cards);
}

function createCard(pairId, copy) {
  return {
    id: `${pairId}-${copy}-${Math.random().toString(36).slice(2)}`,
    pairId,
    label: labels[pairId],
    theme: pairId,
    flipped: false,
    matched: false,
    wrong: false
  };
}

function shuffle(items) {
  const result = [...items];

  for (let index = result.length - 1; index > 0; index -= 1) {
    const randomIndex = Math.floor(Math.random() * (index + 1));
    [result[index], result[randomIndex]] = [result[randomIndex], result[index]];
  }

  return result;
}

function resetGame() {
  stopTimer();
  state.deck = createDeck();
  state.flipped = [];
  state.moves = 0;
  state.matches = 0;
  state.mismatches = 0;
  state.locked = false;
  state.status = "ready";
  state.startedAt = 0;
  state.elapsed = 0;
  state.bestMoves = readBestMoves();

  showOverlay("记忆翻牌", "Ready", "开始");
  render();
}

function startGame() {
  if (state.status === "running") {
    return;
  }

  if (state.status === "finished") {
    resetGame();
  }

  state.status = "running";
  state.startedAt = Date.now() - state.elapsed * 1000;
  hideOverlay();
  startTimer();
  renderStats();
}

function startTimer() {
  stopTimer();
  state.timerId = window.setInterval(() => {
    state.elapsed = Math.floor((Date.now() - state.startedAt) / 1000);
    renderStats();
  }, 250);
}

function stopTimer() {
  if (state.timerId) {
    window.clearInterval(state.timerId);
    state.timerId = null;
  }
}

function finishGame() {
  state.status = "finished";
  stopTimer();

  if (!state.bestMoves || state.moves < state.bestMoves) {
    state.bestMoves = state.moves;
    saveBestMoves(state.bestMoves);
  }

  showOverlay("完成", `${state.moves} moves`, "再来");
  render();
}

function flipCard(cardId) {
  if (state.status !== "running") {
    startGame();
  }

  if (state.locked || state.flipped.length >= 2) {
    return;
  }

  const card = state.deck.find((item) => item.id === cardId);

  if (!card || card.flipped || card.matched) {
    return;
  }

  card.flipped = true;
  state.flipped.push(card);
  render();

  if (state.flipped.length === 2) {
    resolvePair();
  }
}

function resolvePair() {
  const [first, second] = state.flipped;
  state.moves += 1;

  if (first.pairId === second.pairId) {
    first.matched = true;
    second.matched = true;
    state.matches += 1;
    state.flipped = [];

    if (state.matches === PAIR_COUNT) {
      finishGame();
      return;
    }

    render();
    return;
  }

  state.locked = true;
  state.mismatches += 1;
  first.wrong = true;
  second.wrong = true;
  render();

  window.setTimeout(() => {
    first.flipped = false;
    second.flipped = false;
    first.wrong = false;
    second.wrong = false;
    state.flipped = [];
    state.locked = false;
    render();
  }, 720);
}

function formatTime(seconds) {
  const minutes = Math.floor(seconds / 60);
  const rest = seconds % 60;

  return `${String(minutes).padStart(2, "0")}:${String(rest).padStart(2, "0")}`;
}

function accuracy() {
  if (state.moves === 0) {
    return 100;
  }

  return Math.round((state.matches / state.moves) * 100);
}

function statusText() {
  const labelsByStatus = {
    ready: "Ready",
    running: "Running",
    finished: "Finished"
  };

  return labelsByStatus[state.status];
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
  movesEl.textContent = state.moves;
  bestScoreEl.textContent = state.bestMoves ? state.bestMoves : "--";
  matchesEl.textContent = `${state.matches}/${PAIR_COUNT}`;
  timerEl.textContent = formatTime(state.elapsed);
  accuracyEl.textContent = `${accuracy()}%`;
  statusEl.textContent = statusText();
}

function renderCard(card) {
  const classes = [
    "card",
    `theme-${card.theme}`,
    card.flipped ? "is-flipped" : "",
    card.matched ? "is-matched" : "",
    card.wrong ? "is-wrong" : ""
  ]
    .filter(Boolean)
    .join(" ");

  const disabled = state.locked || card.matched || card.flipped ? "disabled" : "";

  return `
    <button class="${classes}" type="button" data-card-id="${card.id}" aria-label="card" ${disabled}>
      <span class="card-inner">
        <span class="card-face card-back"></span>
        <span class="card-face card-front">
          <span class="photo"></span>
          <span class="photo-label">${card.label}</span>
        </span>
      </span>
    </button>
  `;
}

function render() {
  boardEl.innerHTML = state.deck.map(renderCard).join("");
  renderStats();
}

boardEl.addEventListener("click", (event) => {
  const card = event.target.closest("[data-card-id]");

  if (!card) {
    return;
  }

  flipCard(card.dataset.cardId);
});

overlayActionButton.addEventListener("click", startGame);
restartButton.addEventListener("click", () => {
  resetGame();
  startGame();
});
shuffleButton.addEventListener("click", () => {
  resetGame();
  startGame();
});

resetGame();
