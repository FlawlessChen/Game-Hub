const SIZE = 4;
const WIN_TILE = 2048;
const STORAGE_KEY = "game-hub-2048-best";

const boardEl = document.querySelector("#board");
const scoreEl = document.querySelector("#score");
const bestScoreEl = document.querySelector("#best-score");
const movesEl = document.querySelector("#moves");
const largestTileEl = document.querySelector("#largest-tile");
const messageEl = document.querySelector("#message");
const messageTitleEl = document.querySelector("#message-title");
const messageTextEl = document.querySelector("#message-text");
const newGameButton = document.querySelector("#new-game");
const retryButton = document.querySelector("#retry");
const keepGoingButton = document.querySelector("#keep-going");
const controlButtons = document.querySelectorAll("[data-direction]");

const state = {
  board: createEmptyBoard(),
  score: 0,
  bestScore: readBestScore(),
  moves: 0,
  won: false,
  keepPlaying: false,
  over: false
};

let touchStart = null;

function createEmptyBoard() {
  return Array.from({ length: SIZE }, () => Array(SIZE).fill(0));
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
    window.GameHubProgress.recordBest("2048", score);
  }

  try {
    localStorage.setItem(STORAGE_KEY, String(score));
  } catch (error) {
    return;
  }
}

function randomEmptyCell() {
  const emptyCells = [];

  state.board.forEach((row, rowIndex) => {
    row.forEach((value, colIndex) => {
      if (value === 0) {
        emptyCells.push({ row: rowIndex, col: colIndex });
      }
    });
  });

  if (emptyCells.length === 0) {
    return null;
  }

  return emptyCells[Math.floor(Math.random() * emptyCells.length)];
}

function addRandomTile() {
  const cell = randomEmptyCell();

  if (!cell) {
    return false;
  }

  state.board[cell.row][cell.col] = Math.random() < 0.9 ? 2 : 4;
  return true;
}

function mergeLine(line) {
  const values = line.filter((value) => value !== 0);
  const merged = [];
  let gained = 0;

  for (let index = 0; index < values.length; index += 1) {
    if (values[index] === values[index + 1]) {
      const nextValue = values[index] * 2;
      merged.push(nextValue);
      gained += nextValue;
      index += 1;
    } else {
      merged.push(values[index]);
    }
  }

  while (merged.length < SIZE) {
    merged.push(0);
  }

  return { line: merged, gained };
}

function getColumn(board, colIndex) {
  return board.map((row) => row[colIndex]);
}

function setColumn(board, colIndex, values) {
  values.forEach((value, rowIndex) => {
    board[rowIndex][colIndex] = value;
  });
}

function processLine(line, reverse = false) {
  const input = reverse ? [...line].reverse() : [...line];
  const result = mergeLine(input);

  if (reverse) {
    result.line.reverse();
  }

  return result;
}

function calculateMove(direction) {
  const nextBoard = createEmptyBoard();
  let gained = 0;

  if (direction === "left" || direction === "right") {
    state.board.forEach((row, rowIndex) => {
      const result = processLine(row, direction === "right");
      nextBoard[rowIndex] = result.line;
      gained += result.gained;
    });
  }

  if (direction === "up" || direction === "down") {
    for (let colIndex = 0; colIndex < SIZE; colIndex += 1) {
      const column = getColumn(state.board, colIndex);
      const result = processLine(column, direction === "down");
      setColumn(nextBoard, colIndex, result.line);
      gained += result.gained;
    }
  }

  return { board: nextBoard, gained };
}

function boardsMatch(firstBoard, secondBoard) {
  return firstBoard.every((row, rowIndex) =>
    row.every((value, colIndex) => value === secondBoard[rowIndex][colIndex])
  );
}

function hasOpenCell() {
  return state.board.some((row) => row.some((value) => value === 0));
}

function hasMergeAvailable() {
  for (let row = 0; row < SIZE; row += 1) {
    for (let col = 0; col < SIZE; col += 1) {
      const value = state.board[row][col];

      if (state.board[row][col + 1] === value || state.board[row + 1]?.[col] === value) {
        return true;
      }
    }
  }

  return false;
}

function hasMovesAvailable() {
  return hasOpenCell() || hasMergeAvailable();
}

function maxTile() {
  return Math.max(...state.board.flat());
}

function tileClass(value) {
  const sizeClass = value >= 1000 ? "tile-large" : value >= 100 ? "tile-small" : "";
  const valueClass = value <= WIN_TILE ? `tile-${value}` : "tile-super";

  return ["tile", valueClass, sizeClass].filter(Boolean).join(" ");
}

function renderBoard() {
  boardEl.innerHTML = "";

  for (let index = 0; index < SIZE * SIZE; index += 1) {
    const cell = document.createElement("div");
    cell.className = "cell";
    cell.style.gridRowStart = Math.floor(index / SIZE) + 1;
    cell.style.gridColumnStart = (index % SIZE) + 1;
    boardEl.append(cell);
  }

  state.board.forEach((row, rowIndex) => {
    row.forEach((value, colIndex) => {
      if (value === 0) {
        return;
      }

      const tile = document.createElement("div");
      tile.className = tileClass(value);
      tile.textContent = value;
      tile.style.gridRowStart = rowIndex + 1;
      tile.style.gridColumnStart = colIndex + 1;
      boardEl.append(tile);
    });
  });
}

function renderStats() {
  scoreEl.textContent = state.score;
  bestScoreEl.textContent = state.bestScore;
  movesEl.textContent = state.moves;
  largestTileEl.textContent = maxTile();
}

function render() {
  renderBoard();
  renderStats();
}

function showMessage(title, text, allowContinue) {
  messageTitleEl.textContent = title;
  messageTextEl.textContent = text;
  keepGoingButton.hidden = !allowContinue;
  messageEl.classList.remove("is-hidden");
}

function hideMessage() {
  messageEl.classList.add("is-hidden");
}

function updateBestScore() {
  if (state.score <= state.bestScore) {
    return;
  }

  state.bestScore = state.score;
  saveBestScore(state.bestScore);
}

function updateGameStatus() {
  if (!state.won && maxTile() >= WIN_TILE) {
    state.won = true;
    showMessage("2048", "完成", true);
    return;
  }

  if (!hasMovesAvailable()) {
    state.over = true;
    showMessage("结束", "没有可移动方块", false);
  }
}

function canMove() {
  return !state.over && (!state.won || state.keepPlaying);
}

function move(direction) {
  if (!canMove()) {
    return;
  }

  const result = calculateMove(direction);

  if (boardsMatch(state.board, result.board)) {
    return;
  }

  state.board = result.board;
  state.score += result.gained;
  state.moves += 1;
  updateBestScore();
  addRandomTile();
  updateGameStatus();
  render();
}

function startGame() {
  state.board = createEmptyBoard();
  state.score = 0;
  state.moves = 0;
  state.won = false;
  state.keepPlaying = false;
  state.over = false;
  state.bestScore = readBestScore();

  addRandomTile();
  addRandomTile();
  hideMessage();
  render();
  boardEl.focus();
}

function directionFromKey(key) {
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

function handleKeydown(event) {
  const direction = directionFromKey(event.key);

  if (!direction) {
    return;
  }

  event.preventDefault();
  move(direction);
}

function handleTouchStart(event) {
  const touch = event.changedTouches[0];
  touchStart = {
    x: touch.clientX,
    y: touch.clientY
  };
}

function handleTouchEnd(event) {
  if (!touchStart) {
    return;
  }

  const touch = event.changedTouches[0];
  const deltaX = touch.clientX - touchStart.x;
  const deltaY = touch.clientY - touchStart.y;
  const absX = Math.abs(deltaX);
  const absY = Math.abs(deltaY);
  const minSwipe = 24;

  touchStart = null;

  if (Math.max(absX, absY) < minSwipe) {
    return;
  }

  move(absX > absY ? (deltaX > 0 ? "right" : "left") : deltaY > 0 ? "down" : "up");
}

newGameButton.addEventListener("click", startGame);
retryButton.addEventListener("click", startGame);
keepGoingButton.addEventListener("click", () => {
  state.keepPlaying = true;
  hideMessage();
  boardEl.focus();
});

controlButtons.forEach((button) => {
  button.addEventListener("click", () => {
    move(button.dataset.direction);
    boardEl.focus();
  });
});

window.addEventListener("keydown", handleKeydown);
boardEl.addEventListener("touchstart", handleTouchStart, { passive: true });
boardEl.addEventListener("touchend", handleTouchEnd);

if (window.GameHubProgress) {
  window.GameHubProgress.registerGamePage("2048");
}

startGame();
