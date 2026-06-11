const games = [
  {
    id: "2048",
    name: "2048",
    path: "./games/2048/index.html",
    description: "合并数字方块，冲刺更高分数。",
    tags: ["益智", "单人"],
    art: "2048",
    theme: "linear-gradient(135deg, #2364d8, #17a2a4)"
  },
  {
    id: "snake",
    name: "贪吃蛇",
    path: "./games/snake/index.html",
    description: "控制路线、吃掉目标、避开边界。",
    tags: ["街机", "分数"],
    art: "蛇",
    theme: "linear-gradient(135deg, #168a5c, #4e8d22)"
  },
  {
    id: "plane",
    name: "飞机大战",
    path: "./games/plane/index.html",
    description: "驾驶战机，躲避敌机并击落来袭目标。",
    tags: ["射击", "动作"],
    art: "机",
    theme: "linear-gradient(135deg, #2364d8, #17a2a4)"
  },
  {
    id: "flappy",
    name: "飞翔的小鸟",
    path: "./games/flappy/index.html",
    description: "穿过连续水管，冲刺更高分数。",
    tags: ["时机", "街机"],
    art: "鸟",
    theme: "linear-gradient(135deg, #ba6b12, #d64d3f)"
  },
  {
    id: "memory",
    name: "记忆翻牌",
    path: "./games/memory/index.html",
    description: "短时记忆配对挑战。",
    tags: ["记忆", "卡牌"],
    art: "记",
    theme: "linear-gradient(135deg, #6a55ca, #2364d8)"
  },
  {
    id: "mole",
    name: "打地鼠",
    path: "./games/mole/index.html",
    description: "快速反应，击中出现的目标。",
    tags: ["反应", "限时"],
    art: "鼠",
    theme: "linear-gradient(135deg, #c43d3d, #ba6b12)"
  },
  {
    id: "brick",
    name: "打砖块",
    path: "./games/brick/index.html",
    description: "用挡板反弹小球，击碎彩色砖块并接住道具。",
    tags: ["街机", "画布"],
    art: "砖",
    theme: "linear-gradient(135deg, #07111f, #22c55e)"
  },
  {
    id: "nsshaft",
    name: "下一百层",
    path: "./games/nsshaft/index.html",
    description: "控制小方块踩平台下行，避开顶部钉子和地刺。",
    tags: ["街机", "移动端"],
    art: "层",
    theme: "linear-gradient(135deg, #0a1020, #38bdf8)"
  },
  {
    id: "needle",
    name: "见缝插针",
    path: "./games/needle/index.html",
    description: "把编号小针插进旋转大球，避开已有针脚。",
    tags: ["时机", "画布"],
    art: "针",
    theme: "linear-gradient(135deg, #2563eb, #dc2626)"
  },
  {
    id: "tower",
    name: "建楼大师",
    path: "./games/tower/index.html",
    description: "放下摆动楼层，裁掉偏差，向上叠出更高楼。",
    tags: ["时机", "堆叠"],
    art: "楼",
    theme: "linear-gradient(135deg, #0f766e, #d97706)"
  },
  {
    id: "tetris",
    name: "俄罗斯方块",
    path: "./games/tetris/index.html",
    description: "旋转下落的方块，消除整行得分。",
    tags: ["益智", "街机"],
    art: "方",
    theme: "linear-gradient(135deg, #6a55ca, #34c5d6)"
  }
];

const app = document.querySelector("#app");
const navLinks = [...document.querySelectorAll("[data-route-link]")];
const gamePageTrackedLaunches = new Set(["brick", "nsshaft"]);
const FAVORITE_STORE_KEY = "game-hub-favorites-v1";

function getProgress(game) {
  if (!window.GameHubProgress) {
    return {
      bestText: "暂无记录",
      hasBest: false,
      plays: 0,
      achievements: [],
      unlockedAchievements: 0,
      totalAchievements: 0,
    };
  }
  return window.GameHubProgress.getGameProgress(game.id);
}

function getProgressSummary() {
  if (!window.GameHubProgress) {
    return { recordedGames: 0, totalPlays: 0, unlockedAchievements: 0, totalAchievements: 0 };
  }
  return window.GameHubProgress.getSummary(games);
}

function readFavoriteIds() {
  try {
    const stored = JSON.parse(localStorage.getItem(FAVORITE_STORE_KEY) || "[]");
    if (!Array.isArray(stored)) return [];
    return stored.filter((id) => games.some((game) => game.id === id));
  } catch {
    return [];
  }
}

function writeFavoriteIds(ids) {
  try {
    localStorage.setItem(FAVORITE_STORE_KEY, JSON.stringify(ids));
  } catch {
    // 收藏是本地增强能力，失败时不影响游戏入口。
  }
}

function isFavorite(gameId) {
  return readFavoriteIds().includes(gameId);
}

function toggleFavorite(gameId) {
  const favoriteIds = readFavoriteIds();
  const nextIds = favoriteIds.includes(gameId)
    ? favoriteIds.filter((id) => id !== gameId)
    : [gameId, ...favoriteIds];
  writeFavoriteIds(nextIds);
}

function getFavoriteGames() {
  return readFavoriteIds()
    .map((id) => games.find((game) => game.id === id))
    .filter(Boolean);
}

function getRecentGames(limit = 4) {
  return games
    .map((game) => ({ game, progress: getProgress(game) }))
    .filter((item) => item.progress.lastPlayed)
    .sort((first, second) => Date.parse(second.progress.lastPlayed) - Date.parse(first.progress.lastPlayed))
    .slice(0, limit)
    .map((item) => item.game);
}

function formatPlays(plays) {
  return plays > 0 ? `${plays} 次启动` : "未开始";
}

function formatAchievementCount(progress) {
  return `${progress.unlockedAchievements}/${progress.totalAchievements} 个成就`;
}

function formatLastPlayed(value) {
  const timestamp = Date.parse(value || "");
  if (!Number.isFinite(timestamp)) return "还没开始";

  const minutes = Math.max(0, Math.floor((Date.now() - timestamp) / 60000));
  if (minutes < 1) return "刚刚玩过";
  if (minutes < 60) return `${minutes} 分钟前`;

  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours} 小时前`;

  const days = Math.floor(hours / 24);
  return `${days} 天前`;
}

function achievementBadges(progress) {
  return progress.achievements
    .map(
      (achievement) => `
        <div class="achievement-badge ${achievement.unlocked ? "is-unlocked" : "is-locked"}">
          <strong>${achievement.name}</strong>
          <span>${achievement.description}</span>
        </div>
      `
    )
    .join("");
}

function gameCard(game) {
  const progress = getProgress(game);
  return `
    <article class="game-card">
      <a class="game-art" style="--art-bg: ${game.theme}" href="#/game/${game.id}" aria-label="${game.name}">
        <span>${game.art}</span>
      </a>
      <div class="game-body">
        <h3>${game.name}</h3>
        <p>${game.description}</p>
        <div class="game-meta">
          ${game.tags.map((tag) => `<span class="pill">${tag}</span>`).join("")}
        </div>
        <div class="game-progress">
          <div>
            <strong>${progress.bestText}</strong>
            <span>${formatAchievementCount(progress)}</span>
          </div>
          <span>${formatPlays(progress.plays)}</span>
        </div>
      </div>
      <div class="game-action">
        <span class="status">${progress.hasBest ? "已记录" : "待挑战"}</span>
        <a class="button" href="#/game/${game.id}">进入</a>
      </div>
    </article>
  `;
}

function quickGameCard(game) {
  const progress = getProgress(game);
  return `
    <article class="quick-card">
      <a class="quick-art" style="--art-bg: ${game.theme}" href="#/game/${game.id}" aria-label="${game.name}">
        <span>${game.art}</span>
      </a>
      <div class="quick-body">
        <h3>${game.name}</h3>
        <p>${progress.bestText}</p>
        <span>${formatLastPlayed(progress.lastPlayed)}</span>
      </div>
      <a class="quick-link" href="#/game/${game.id}">进入</a>
    </article>
  `;
}

function renderQuickSection(title, items, summaryText, emptyText) {
  return `
    <section class="quick-section" aria-label="${title}">
      <div class="section-head">
        <h2>${title}</h2>
        <span>${summaryText}</span>
      </div>
      ${
        items.length
          ? `<div class="quick-grid">${items.map(quickGameCard).join("")}</div>`
          : `<div class="empty-strip">${emptyText}</div>`
      }
    </section>
  `;
}

function renderHome() {
  const progress = getProgressSummary();
  const recentGames = getRecentGames();
  const favoriteGames = getFavoriteGames();
  app.innerHTML = `
    <section class="dashboard">
      <div class="summary">
        <div>
          <h1>游戏中心</h1>
          <p>${games.map((game) => game.name).join("、")}</p>
        </div>
        <div class="stats" aria-label="游戏概览">
          <div class="stat">
            <strong>${games.length}</strong>
            <span>游戏数</span>
          </div>
          <div class="stat">
            <strong>${progress.recordedGames}</strong>
            <span>有记录</span>
          </div>
          <div class="stat">
            <strong>${progress.unlockedAchievements}/${progress.totalAchievements}</strong>
            <span>成就</span>
          </div>
          <div class="stat">
            <strong>${progress.totalPlays}</strong>
            <span>启动次数</span>
          </div>
        </div>
      </div>

      ${renderQuickSection(
        "最近游玩",
        recentGames,
        recentGames.length ? `${recentGames.length} 个最近入口` : "等待第一次游玩",
        "开始任意游戏后，这里会自动记录最近入口。"
      )}

      ${renderQuickSection(
        "我的收藏",
        favoriteGames,
        favoriteGames.length ? `${favoriteGames.length} 款收藏` : "还没有收藏",
        "进入游戏详情页，可以把常玩的游戏加入收藏。"
      )}

      <div class="section-head">
        <h2>推荐游戏</h2>
        <span>${games.length} 款游戏</span>
      </div>

      <section class="game-grid" aria-label="推荐游戏">
        ${games.map(gameCard).join("")}
      </section>
    </section>
  `;
}

function renderLibrary() {
  app.innerHTML = `
    <section class="dashboard">
      <div class="section-head">
        <h2>游戏库</h2>
        <span>${games.length} 款游戏</span>
      </div>
      <section class="game-grid" aria-label="游戏库">
        ${games.map(gameCard).join("")}
      </section>
    </section>
  `;
}

function renderGame(id) {
  const game = games.find((item) => item.id === id);

  if (!game) {
    renderNotFound();
    return;
  }

  const progress = getProgress(game);
  const favorite = isFavorite(game.id);

  app.innerHTML = `
    <section class="detail">
      <article class="detail-panel">
        <div class="game-art" style="--art-bg: ${game.theme}">
          <span>${game.art}</span>
        </div>
        <div class="detail-content">
          <h1>${game.name}</h1>
          <p>${game.description}</p>
          <div class="game-meta">
            ${game.tags.map((tag) => `<span class="pill">${tag}</span>`).join("")}
          </div>
          <div class="detail-stats" aria-label="本地进度">
            <div class="mini-stat">
              <strong>${progress.bestText}</strong>
              <span>本地最佳</span>
            </div>
            <div class="mini-stat">
              <strong>${progress.plays}</strong>
              <span>启动次数</span>
            </div>
            <div class="mini-stat">
              <strong>${progress.unlockedAchievements}/${progress.totalAchievements}</strong>
              <span>成就</span>
            </div>
          </div>
          <div class="achievement-list" aria-label="成就徽章">
            ${achievementBadges(progress)}
          </div>
          <div class="detail-actions">
            <a class="button" href="${game.path}" data-game-start="${game.id}">开始</a>
            <button
              class="ghost-button favorite-button ${favorite ? "is-active" : ""}"
              type="button"
              data-favorite-toggle="${game.id}"
              aria-pressed="${favorite ? "true" : "false"}"
            >${favorite ? "已收藏" : "收藏"}</button>
            <a class="ghost-button" href="#/">返回首页</a>
          </div>
        </div>
      </article>
    </section>
  `;
}

function renderNotFound() {
  app.innerHTML = `
    <section class="empty">
      <h1>页面不存在</h1>
      <p>当前路由没有匹配到页面。</p>
      <div class="detail-actions">
        <a class="button" href="#/">返回首页</a>
      </div>
    </section>
  `;
}

function setActiveNav(route) {
  navLinks.forEach((link) => {
    link.classList.toggle("is-active", link.dataset.routeLink === route);
  });
}

function route() {
  const hash = window.location.hash.replace(/^#/, "") || "/";
  const parts = hash.split("/").filter(Boolean);

  if (hash === "/") {
    setActiveNav("/");
    renderHome();
    return;
  }

  if (hash === "/library") {
    setActiveNav("/library");
    renderLibrary();
    return;
  }

  if (parts[0] === "game" && parts[1]) {
    setActiveNav("");
    renderGame(parts[1]);
    return;
  }

  setActiveNav("");
  renderNotFound();
}

app.addEventListener("click", (event) => {
  const target = event.target;
  if (!(target instanceof Element)) return;

  const favoriteButton = target.closest("[data-favorite-toggle]");
  if (favoriteButton) {
    const gameId = favoriteButton.dataset.favoriteToggle;
    if (!gameId) return;
    toggleFavorite(gameId);
    renderGame(gameId);
    return;
  }

  const startLink = target.closest("[data-game-start]");
  if (!startLink || !window.GameHubProgress) return;
  const gameId = startLink.dataset.gameStart;
  if (gamePageTrackedLaunches.has(gameId)) return;
  window.GameHubProgress.recordLaunch(gameId);
});

window.addEventListener("hashchange", route);
window.addEventListener("DOMContentLoaded", route);
