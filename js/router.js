const games = [
  {
    id: "2048",
    name: "2048",
    path: "./games/2048/index.html",
    description: "合并数字方块，冲刺更高分数。",
    tags: ["益智", "单人"],
    art: "2048",
    theme: "linear-gradient(135deg, #2364d8, #17a2a4)",
    cover: "./assets/covers/2048.png"
  },
  {
    id: "snake",
    name: "贪吃蛇",
    path: "./games/snake/index.html",
    description: "控制路线、吃掉目标、避开边界。",
    tags: ["街机", "分数"],
    art: "蛇",
    theme: "linear-gradient(135deg, #168a5c, #4e8d22)",
    cover: "./assets/covers/snake.png"
  },
  {
    id: "plane",
    name: "飞机大战",
    path: "./games/plane/index.html",
    description: "驾驶战机，躲避敌机并击落来袭目标。",
    tags: ["射击", "动作"],
    art: "机",
    theme: "linear-gradient(135deg, #2364d8, #17a2a4)",
    cover: "./assets/covers/plane.png"
  },
  {
    id: "flappy",
    name: "飞翔的小鸟",
    path: "./games/flappy/index.html",
    description: "穿过连续水管，冲刺更高分数。",
    tags: ["时机", "街机"],
    art: "鸟",
    theme: "linear-gradient(135deg, #ba6b12, #d64d3f)",
    cover: "./assets/covers/flappy.png"
  },
  {
    id: "memory",
    name: "记忆翻牌",
    path: "./games/memory/index.html",
    description: "短时记忆配对挑战。",
    tags: ["记忆", "卡牌"],
    art: "记",
    theme: "linear-gradient(135deg, #6a55ca, #2364d8)",
    cover: "./assets/covers/memory.png"
  },
  {
    id: "mole",
    name: "打地鼠",
    path: "./games/mole/index.html",
    description: "快速反应，击中出现的目标。",
    tags: ["反应", "限时"],
    art: "鼠",
    theme: "linear-gradient(135deg, #c43d3d, #ba6b12)",
    cover: "./assets/covers/mole.png"
  },
  {
    id: "brick",
    name: "打砖块",
    path: "./games/brick/index.html",
    description: "用挡板反弹小球，击碎彩色砖块并接住道具。",
    tags: ["街机", "画布"],
    art: "砖",
    theme: "linear-gradient(135deg, #07111f, #22c55e)",
    cover: "./assets/covers/brick.png"
  },
  {
    id: "watermelon",
    name: "合成大西瓜",
    path: "./games/watermelon/index.html",
    description: "拖动落点放下水果，相同水果碰撞后合成更大的水果。",
    tags: ["合成", "移动端"],
    art: "瓜",
    theme: "linear-gradient(135deg, #16a34a, #ef4444)",
    cover: "./assets/covers/watermelon.png"
  },
  {
    id: "fruit-slice",
    name: "切水果",
    path: "./games/fruit-slice/index.html",
    description: "滑动切开飞出的水果，避开炸弹并保持连击。",
    tags: ["反应", "滑动"],
    art: "切",
    theme: "linear-gradient(135deg, #f97316, #22c55e)",
    cover: "./assets/covers/fruit-slice.png"
  },
  {
    id: "pop-blocks",
    name: "方块消消乐",
    path: "./games/pop-blocks/index.html",
    description: "点击相连同色方块完成消除，连块越多得分越高。",
    tags: ["消除", "点按"],
    art: "消",
    theme: "linear-gradient(135deg, #4f46e5, #06b6d4)",
    cover: "./assets/covers/pop-blocks.png"
  },
  {
    id: "jump",
    name: "跳一跳",
    path: "./games/jump/index.html",
    description: "长按蓄力并松手起跳，精准落到下一个平台。",
    tags: ["蓄力", "移动端"],
    art: "跳",
    theme: "linear-gradient(135deg, #2563eb, #16a34a)",
    cover: "./assets/covers/jump.png"
  },
  {
    id: "dodge",
    name: "躲避小球",
    path: "./games/dodge/index.html",
    description: "拖动角色躲避从四周飞来的危险小球，坚持越久分数越高。",
    tags: ["躲避", "拖动"],
    art: "躲",
    theme: "linear-gradient(135deg, #0ea5e9, #dc2626)",
    cover: "./assets/covers/dodge.png"
  },
  {
    id: "coin-catch",
    name: "接金币",
    path: "./games/coin-catch/index.html",
    description: "拖动篮子接住金币和宝石，避开掉落的石头。",
    tags: ["接物", "拖动"],
    art: "金",
    theme: "linear-gradient(135deg, #d97706, #facc15)",
    cover: "./assets/covers/coin-catch.png"
  },
  {
    id: "nsshaft",
    name: "下一百层",
    path: "./games/nsshaft/index.html",
    description: "控制小方块踩平台下行，避开顶部钉子和地刺。",
    tags: ["街机", "移动端"],
    art: "层",
    theme: "linear-gradient(135deg, #0a1020, #38bdf8)",
    cover: "./assets/covers/nsshaft.png"
  },
  {
    id: "needle",
    name: "见缝插针",
    path: "./games/needle/index.html",
    description: "把编号小针插进旋转大球，避开已有针脚。",
    tags: ["时机", "画布"],
    art: "针",
    theme: "linear-gradient(135deg, #2563eb, #dc2626)",
    cover: "./assets/covers/needle.png"
  },
  {
    id: "tower",
    name: "建楼大师",
    path: "./games/tower/index.html",
    description: "放下摆动楼层，裁掉偏差，向上叠出更高楼。",
    tags: ["时机", "堆叠"],
    art: "楼",
    theme: "linear-gradient(135deg, #0f766e, #d97706)",
    cover: "./assets/covers/tower.png"
  },
  {
    id: "tetris",
    name: "俄罗斯方块",
    path: "./games/tetris/index.html",
    description: "旋转下落的方块，消除整行得分。",
    tags: ["益智", "街机"],
    art: "方",
    theme: "linear-gradient(135deg, #6a55ca, #34c5d6)",
    cover: "./assets/covers/tetris.png"
  }
];

const app = document.querySelector("#app");
const navLinks = [...document.querySelectorAll("[data-route-link]")];
const gamePageTrackedLaunches = new Set([
  "brick",
  "nsshaft",
  "watermelon",
  "fruit-slice",
  "pop-blocks",
  "jump",
  "dodge",
  "coin-catch",
]);
const FAVORITE_STORE_KEY = "game-hub-favorites-v1";
const libraryFilters = {
  query: "",
  status: "all",
  category: "all",
  sort: "default",
};
const DAILY_CHALLENGE_POOL = [
  { gameId: "2048", target: 512, label: "达到 512 分", unit: "分" },
  { gameId: "snake", target: 100, label: "达到 100 分", unit: "分" },
  { gameId: "plane", target: 1200, label: "达到 1200 分", unit: "分" },
  { gameId: "flappy", target: 10, label: "达到 10 分", unit: "分" },
  { gameId: "memory", target: 40, label: "40 步内完成", unit: "步", better: "lower" },
  { gameId: "mole", target: 300, label: "达到 300 分", unit: "分" },
  { gameId: "brick", target: 200, label: "达到 200 分", unit: "分" },
  { gameId: "nsshaft", target: 20, label: "下潜 20 层", unit: "层" },
  { gameId: "needle", target: 6, label: "插入 6 根针", unit: "根" },
  { gameId: "tower", target: 10, label: "盖到 10 层", unit: "层" },
  { gameId: "tetris", target: 1000, label: "达到 1000 分", unit: "分" },
];

function getProgress(game) {
  if (!window.GameHubProgress) {
    return {
      best: 0,
      bestText: "暂无记录",
      hasBest: false,
      plays: 0,
      lastPlayed: "",
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

function escapeAttribute(value) {
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll('"', "&quot;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;");
}

function getArtStyle(game) {
  const cover = game.cover ? `; --cover-image: url("${game.cover}")` : "";
  return escapeAttribute(`--art-bg: ${game.theme}${cover}`);
}

function renderGameArt(game, className, href = "") {
  const classValue = `${className}${game.cover ? " has-cover" : ""}`;
  const content = `<span>${game.art}</span>`;
  if (!href) {
    return `<div class="${classValue}" style="${getArtStyle(game)}">${content}</div>`;
  }
  return `<a class="${classValue}" style="${getArtStyle(game)}" href="${escapeAttribute(href)}" aria-label="${escapeAttribute(game.name)}">${content}</a>`;
}

function getRecentGames(limit = 4) {
  return games
    .map((game) => ({ game, progress: getProgress(game) }))
    .filter((item) => item.progress.lastPlayed)
    .sort((first, second) => Date.parse(second.progress.lastPlayed) - Date.parse(first.progress.lastPlayed))
    .slice(0, limit)
    .map((item) => item.game);
}

function getTodayKey() {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, "0");
  const day = String(now.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function hashString(value) {
  return [...value].reduce((hash, char) => ((hash * 31 + char.charCodeAt(0)) >>> 0), 0);
}

function getDailyChallenges(limit = 3) {
  const todayKey = getTodayKey();
  return DAILY_CHALLENGE_POOL
    .map((challenge) => ({
      ...challenge,
      order: hashString(`${todayKey}:${challenge.gameId}`),
      game: games.find((game) => game.id === challenge.gameId),
    }))
    .filter((challenge) => challenge.game)
    .sort((first, second) => first.order - second.order)
    .slice(0, limit)
    .map(({ order, ...challenge }) => challenge);
}

function isChallengeComplete(challenge, progress) {
  const best = Number(progress.best || 0);
  if (challenge.better === "lower") return best > 0 && best <= challenge.target;
  return best >= challenge.target;
}

function formatChallengeBest(challenge, progress) {
  if (!progress.hasBest) return "暂无记录";
  return `${progress.best} ${challenge.unit}`;
}

function getAchievementDefinition(gameId) {
  if (!window.GameHubProgress || !window.GameHubProgress.definitions) {
    return { better: "higher" };
  }
  return window.GameHubProgress.definitions[gameId] || { better: "higher" };
}

function clampNumber(value, min, max) {
  return Math.min(max, Math.max(min, value));
}

function getAchievementMetric(game, progress, achievement) {
  const definition = getAchievementDefinition(game.id);
  const target = Number(achievement.target || 0);
  if (!target) {
    return {
      current: 0,
      target: 0,
      ratio: achievement.unlocked ? 1 : 0,
      label: achievement.unlocked ? "已完成" : "等待挑战",
    };
  }

  if (achievement.type === "plays") {
    const current = Number(progress.plays || 0);
    return {
      current,
      target,
      ratio: clampNumber(current / target, 0, 1),
      label: `进度 ${Math.min(current, target)}/${target} 次启动`,
    };
  }

  if (achievement.type === "best") {
    const current = Number(progress.best || 0);
    const ratio =
      definition.better === "lower"
        ? current > 0 ? clampNumber(target / current, 0, 1) : 0
        : clampNumber(current / target, 0, 1);
    return {
      current,
      target,
      ratio,
      label: progress.hasBest ? `当前 ${progress.bestText}` : "暂无记录",
    };
  }

  return {
    current: 0,
    target,
    ratio: achievement.unlocked ? 1 : 0,
    label: achievement.unlocked ? "已完成" : "等待挑战",
  };
}

function getAchievementGoals(limit = 4) {
  const goals = games.flatMap((game) => {
    const progress = getProgress(game);
    return progress.achievements.map((achievement) => ({
      game,
      achievement,
      metric: getAchievementMetric(game, progress, achievement),
    }));
  });

  const lockedGoals = goals
    .filter((goal) => !goal.achievement.unlocked)
    .sort((first, second) => second.metric.ratio - first.metric.ratio || first.game.name.localeCompare(second.game.name));

  if (lockedGoals.length) return lockedGoals.slice(0, limit);

  return goals
    .filter((goal) => goal.achievement.unlocked)
    .sort((first, second) => first.game.name.localeCompare(second.game.name))
    .slice(0, limit);
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
      ${renderGameArt(game, "game-art", `#/game/${game.id}`)}
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
      ${renderGameArt(game, "quick-art", `#/game/${game.id}`)}
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

function challengeCard(challenge) {
  const progress = getProgress(challenge.game);
  const complete = isChallengeComplete(challenge, progress);
  return `
    <article class="challenge-card ${complete ? "is-complete" : ""}">
      ${renderGameArt(challenge.game, "challenge-art", `#/game/${challenge.game.id}`)}
      <div class="challenge-body">
        <div>
          <h3>${challenge.game.name}</h3>
          <span class="challenge-status">${complete ? "已完成" : "未完成"}</span>
        </div>
        <p>${challenge.label}</p>
        <small>当前：${formatChallengeBest(challenge, progress)}</small>
      </div>
      <a class="challenge-link" href="#/game/${challenge.game.id}">去挑战</a>
    </article>
  `;
}

function renderDailyChallengeSection(challenges) {
  const completedCount = challenges.filter((challenge) =>
    isChallengeComplete(challenge, getProgress(challenge.game))
  ).length;
  return `
    <section class="daily-section" aria-label="每日挑战">
      <div class="section-head">
        <h2>每日挑战</h2>
        <span>完成 ${completedCount}/${challenges.length}</span>
      </div>
      <div class="challenge-grid">
        ${challenges.map(challengeCard).join("")}
      </div>
    </section>
  `;
}

function achievementGoalCard(goal) {
  const complete = goal.achievement.unlocked;
  const percent = Math.round(goal.metric.ratio * 100);
  return `
    <article class="goal-card ${complete ? "is-complete" : ""}" style="--goal-percent: ${percent}%">
      ${renderGameArt(goal.game, "goal-art", `#/game/${goal.game.id}`)}
      <div class="goal-body">
        <div class="goal-title">
          <h3>${goal.achievement.name}</h3>
          <span>${complete ? "已解锁" : `${percent}%`}</span>
        </div>
        <p>${goal.game.name} · ${goal.achievement.description}</p>
        <small>${goal.metric.label}</small>
        <div class="goal-meter" aria-hidden="true"><span></span></div>
      </div>
    </article>
  `;
}

function renderAchievementGoalsSection(goals, progressSummary) {
  return `
    <section class="goal-section" aria-label="成就目标">
      <div class="section-head">
        <h2>成就目标</h2>
        <span>${progressSummary.unlockedAchievements}/${progressSummary.totalAchievements} 已解锁</span>
      </div>
      ${
        goals.length
          ? `<div class="goal-grid">${goals.map(achievementGoalCard).join("")}</div>`
          : `<div class="empty-strip">开始任意游戏后，这里会展示下一批可冲刺成就。</div>`
      }
    </section>
  `;
}

function getAchievementRatio(progress) {
  if (!progress.totalAchievements) return 0;
  return progress.unlockedAchievements / progress.totalAchievements;
}

function getLibrarySearchText(game) {
  return [game.name, game.description, game.art, ...game.tags].join(" ").toLowerCase();
}

function getLibraryCategories() {
  return [...new Set(games.flatMap((game) => game.tags))].sort((first, second) =>
    first.localeCompare(second, "zh-CN")
  );
}

function matchesLibraryStatus(game, progress) {
  if (libraryFilters.status === "favorite") return isFavorite(game.id);
  if (libraryFilters.status === "started") return progress.hasBest || progress.plays > 0;
  if (libraryFilters.status === "unplayed") return !progress.hasBest && !progress.plays;
  return true;
}

function matchesLibraryCategory(game) {
  if (libraryFilters.category === "all") return true;
  return game.tags.includes(libraryFilters.category);
}

function getLibraryItems() {
  const query = libraryFilters.query.trim().toLowerCase();
  const items = games
    .map((game, index) => ({ game, progress: getProgress(game), index }))
    .filter((item) => {
      if (query && !getLibrarySearchText(item.game).includes(query)) return false;
      if (!matchesLibraryCategory(item.game)) return false;
      return matchesLibraryStatus(item.game, item.progress);
    });

  return items.sort((first, second) => {
    if (libraryFilters.sort === "recent") {
      const firstTime = Date.parse(first.progress.lastPlayed || "") || 0;
      const secondTime = Date.parse(second.progress.lastPlayed || "") || 0;
      return secondTime - firstTime || first.index - second.index;
    }
    if (libraryFilters.sort === "plays") {
      return second.progress.plays - first.progress.plays || first.index - second.index;
    }
    if (libraryFilters.sort === "achievements") {
      return getAchievementRatio(second.progress) - getAchievementRatio(first.progress) || first.index - second.index;
    }
    if (libraryFilters.sort === "name") {
      return first.game.name.localeCompare(second.game.name, "zh-CN") || first.index - second.index;
    }
    return first.index - second.index;
  });
}

function libraryStatusButton(value, label) {
  const active = libraryFilters.status === value;
  return `
    <button
      class="filter-button ${active ? "is-active" : ""}"
      type="button"
      data-library-status="${value}"
      aria-pressed="${active ? "true" : "false"}"
    >${label}</button>
  `;
}

function libraryCategoryButton(value, label) {
  const active = libraryFilters.category === value;
  return `
    <button
      class="category-button ${active ? "is-active" : ""}"
      type="button"
      data-library-category="${escapeAttribute(value)}"
      aria-pressed="${active ? "true" : "false"}"
    >${label}</button>
  `;
}

function librarySortOption(value, label) {
  const selected = libraryFilters.sort === value ? " selected" : "";
  return `<option value="${value}"${selected}>${label}</option>`;
}

function renderLibraryTools(resultCount) {
  const categories = getLibraryCategories();
  return `
    <section class="library-tools" aria-label="游戏库筛选">
      <label class="library-search">
        <span>搜索</span>
        <input
          type="search"
          value="${escapeAttribute(libraryFilters.query)}"
          placeholder="搜索游戏、标签或玩法"
          data-library-query
        />
      </label>
      <div class="library-filters" aria-label="进度筛选">
        ${libraryStatusButton("all", "全部")}
        ${libraryStatusButton("started", "有进度")}
        ${libraryStatusButton("unplayed", "未开始")}
        ${libraryStatusButton("favorite", "已收藏")}
      </div>
      <div class="library-categories" aria-label="分类标签">
        <span>分类</span>
        <div>
          ${libraryCategoryButton("all", "全部分类")}
          ${categories.map((category) => libraryCategoryButton(category, category)).join("")}
        </div>
      </div>
      <label class="library-sort">
        <span>排序</span>
        <select data-library-sort>
          ${librarySortOption("default", "默认排序")}
          ${librarySortOption("recent", "最近游玩")}
          ${librarySortOption("plays", "游玩次数")}
          ${librarySortOption("achievements", "成就进度")}
          ${librarySortOption("name", "名称排序")}
        </select>
      </label>
      <span class="library-count">${resultCount} 款匹配</span>
    </section>
  `;
}

function renderHome() {
  const progress = getProgressSummary();
  const recentGames = getRecentGames();
  const favoriteGames = getFavoriteGames();
  const dailyChallenges = getDailyChallenges();
  const achievementGoals = getAchievementGoals();
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

      ${renderDailyChallengeSection(dailyChallenges)}

      ${renderAchievementGoalsSection(achievementGoals, progress)}

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
  const libraryItems = getLibraryItems();
  app.innerHTML = `
    <section class="dashboard">
      <div class="section-head">
        <h2>游戏库</h2>
        <span>${games.length} 款游戏</span>
      </div>
      ${renderLibraryTools(libraryItems.length)}
      ${
        libraryItems.length
          ? `<section class="game-grid" aria-label="游戏库">
              ${libraryItems.map((item) => gameCard(item.game)).join("")}
            </section>`
          : `<div class="empty-strip">没有找到匹配的游戏，换个关键词或筛选条件再试。</div>`
      }
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
        ${renderGameArt(game, "game-art")}
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

  const statusButton = target.closest("[data-library-status]");
  if (statusButton) {
    libraryFilters.status = statusButton.dataset.libraryStatus || "all";
    renderLibrary();
    return;
  }

  const categoryButton = target.closest("[data-library-category]");
  if (categoryButton) {
    libraryFilters.category = categoryButton.dataset.libraryCategory || "all";
    renderLibrary();
    return;
  }

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

app.addEventListener("input", (event) => {
  const target = event.target;
  if (!(target instanceof Element) || !target.matches("[data-library-query]")) return;
  libraryFilters.query = target.value || "";
  const cursor = target.selectionStart || libraryFilters.query.length;
  renderLibrary();
  const nextInput = app.querySelector("[data-library-query]");
  if (nextInput) {
    nextInput.focus();
    nextInput.setSelectionRange(cursor, cursor);
  }
});

app.addEventListener("change", (event) => {
  const target = event.target;
  if (!(target instanceof Element) || !target.matches("[data-library-sort]")) return;
  libraryFilters.sort = target.value || "default";
  renderLibrary();
});

window.addEventListener("hashchange", route);
window.addEventListener("DOMContentLoaded", route);
