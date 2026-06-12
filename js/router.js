const games = [
  {
    id: "2048",
    name: "2048",
    path: "./games/2048/index.html",
    description: "合并数字方块，冲刺更高分数。",
    tags: ["益智", "单人"],
    art: "2048",
    theme: "linear-gradient(135deg, #2364d8, #17a2a4)",
    cover: "./assets/covers/2048.png",
  },
  {
    id: "snake",
    name: "贪吃蛇",
    path: "./games/snake/index.html",
    description: "控制路线、吃掉目标、避开边界。",
    tags: ["街机", "分数"],
    art: "蛇",
    theme: "linear-gradient(135deg, #168a5c, #4e8d22)",
    cover: "./assets/covers/snake.png",
  },
  {
    id: "plane",
    name: "飞机大战",
    path: "./games/plane/index.html",
    description: "驾驶战机，躲避敌机并击落来袭目标。",
    tags: ["射击", "动作"],
    art: "机",
    theme: "linear-gradient(135deg, #2364d8, #17a2a4)",
    cover: "./assets/covers/plane.png",
  },
  {
    id: "flappy",
    name: "飞翔的小鸟",
    path: "./games/flappy/index.html",
    description: "穿过连续水管，冲刺更高分数。",
    tags: ["时机", "街机"],
    art: "鸟",
    theme: "linear-gradient(135deg, #ba6b12, #d64d3f)",
    cover: "./assets/covers/flappy.png",
  },
  {
    id: "memory",
    name: "记忆翻牌",
    path: "./games/memory/index.html",
    description: "短时记忆配对挑战。",
    tags: ["记忆", "卡牌"],
    art: "记",
    theme: "linear-gradient(135deg, #6a55ca, #2364d8)",
    cover: "./assets/covers/memory.png",
  },
  {
    id: "mole",
    name: "打地鼠",
    path: "./games/mole/index.html",
    description: "快速反应，击中出现的目标。",
    tags: ["反应", "限时"],
    art: "鼠",
    theme: "linear-gradient(135deg, #c43d3d, #ba6b12)",
    cover: "./assets/covers/mole.png",
  },
  {
    id: "brick",
    name: "打砖块",
    path: "./games/brick/index.html",
    description: "用挡板反弹小球，击碎彩色砖块并接住道具。",
    tags: ["街机", "画布"],
    art: "砖",
    theme: "linear-gradient(135deg, #07111f, #22c55e)",
    cover: "./assets/covers/brick.png",
  },
  {
    id: "watermelon",
    name: "合成大西瓜",
    path: "./games/watermelon/index.html",
    description: "拖动落点放下水果，相同水果碰撞后合成更大的水果。",
    tags: ["合成", "移动端"],
    art: "瓜",
    theme: "linear-gradient(135deg, #16a34a, #ef4444)",
    cover: "./assets/covers/watermelon.png",
  },
  {
    id: "fruit-slice",
    name: "切水果",
    path: "./games/fruit-slice/index.html",
    description: "滑动切开飞出的水果，避开炸弹并保持连击。",
    tags: ["反应", "滑动"],
    art: "切",
    theme: "linear-gradient(135deg, #f97316, #22c55e)",
    cover: "./assets/covers/fruit-slice.png",
  },
  {
    id: "pop-blocks",
    name: "方块消消乐",
    path: "./games/pop-blocks/index.html",
    description: "点击相连同色方块完成消除，连块越多得分越高。",
    tags: ["消除", "点按"],
    art: "消",
    theme: "linear-gradient(135deg, #4f46e5, #06b6d4)",
    cover: "./assets/covers/pop-blocks.png",
  },
  {
    id: "jump",
    name: "跳一跳",
    path: "./games/jump/index.html",
    description: "长按蓄力并松手起跳，精准落到下一个平台。",
    tags: ["蓄力", "移动端"],
    art: "跳",
    theme: "linear-gradient(135deg, #2563eb, #16a34a)",
    cover: "./assets/covers/jump.png",
  },
  {
    id: "dodge",
    name: "躲避小球",
    path: "./games/dodge/index.html",
    description: "拖动角色躲避从四周飞来的危险小球，坚持越久分数越高。",
    tags: ["躲避", "拖动"],
    art: "躲",
    theme: "linear-gradient(135deg, #0ea5e9, #dc2626)",
    cover: "./assets/covers/dodge.png",
  },
  {
    id: "coin-catch",
    name: "接金币",
    path: "./games/coin-catch/index.html",
    description: "拖动篮子接住金币和宝石，避开掉落的石头。",
    tags: ["接物", "拖动"],
    art: "金",
    theme: "linear-gradient(135deg, #d97706, #facc15)",
    cover: "./assets/covers/coin-catch.png",
  },
  {
    id: "nsshaft",
    name: "下一百层",
    path: "./games/nsshaft/index.html",
    description: "控制小方块踩平台下行，避开顶部钉子和地刺。",
    tags: ["街机", "移动端"],
    art: "层",
    theme: "linear-gradient(135deg, #0a1020, #38bdf8)",
    cover: "./assets/covers/nsshaft.png",
  },
  {
    id: "needle",
    name: "见缝插针",
    path: "./games/needle/index.html",
    description: "把编号小针插进旋转大球，避开已有针脚。",
    tags: ["时机", "画布"],
    art: "针",
    theme: "linear-gradient(135deg, #2563eb, #dc2626)",
    cover: "./assets/covers/needle.png",
  },
  {
    id: "tower",
    name: "建楼大师",
    path: "./games/tower/index.html",
    description: "放下摆动楼层，裁掉偏差，向上叠出更高楼。",
    tags: ["时机", "堆叠"],
    art: "楼",
    theme: "linear-gradient(135deg, #0f766e, #d97706)",
    cover: "./assets/covers/tower.png",
  },
  {
    id: "tetris",
    name: "俄罗斯方块",
    path: "./games/tetris/index.html",
    description: "旋转下落的方块，消除整行得分。",
    tags: ["益智", "街机"],
    art: "方",
    theme: "linear-gradient(135deg, #6a55ca, #34c5d6)",
    cover: "./assets/covers/tetris.png",
  },
];

const app = document.querySelector("#app");
const selfTrackedLaunches = new Set([
  "brick",
  "nsshaft",
  "watermelon",
  "fruit-slice",
  "pop-blocks",
  "jump",
  "dodge",
  "coin-catch",
]);
const state = {
  query: "",
};

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

function getSearchText(game) {
  return [game.name, game.description, game.art, ...game.tags].join(" ").toLowerCase();
}

function getVisibleGames() {
  const query = state.query.trim().toLowerCase();
  if (!query) return games;
  return games.filter((game) => getSearchText(game).includes(query));
}

function gameCard(game) {
  return `
    <a class="game-card" href="${game.path}" data-game-start="${game.id}">
      <span class="game-art ${game.cover ? "has-cover" : ""}" style="${getArtStyle(game)}">
        <span>${game.art}</span>
      </span>
      <span class="game-body">
        <strong>${game.name}</strong>
        <span>${game.description}</span>
      </span>
    </a>
  `;
}

function renderHome() {
  const visibleGames = getVisibleGames();
  app.innerHTML = `
    <section class="home-view">
      <label class="search-box">
        <span>搜索游戏</span>
        <input
          type="search"
          value="${escapeAttribute(state.query)}"
          placeholder="输入名称或玩法"
          autocomplete="off"
          data-search
        />
      </label>

      ${
        visibleGames.length
          ? `<section class="game-grid" aria-label="游戏列表">${visibleGames.map(gameCard).join("")}</section>`
          : `<p class="empty">没有找到匹配的游戏。</p>`
      }
    </section>
  `;
}

function route() {
  const hash = window.location.hash.replace(/^#/, "") || "/";
  const parts = hash.split("/").filter(Boolean);

  if (parts[0] === "game" && parts[1]) {
    const game = games.find((item) => item.id === parts[1]);
    if (game) {
      window.location.href = game.path;
      return;
    }
  }

  if (hash !== "/") {
    window.location.hash = "/";
    return;
  }

  renderHome();
}

app.addEventListener("input", (event) => {
  const target = event.target;
  if (!(target instanceof HTMLInputElement) || !target.matches("[data-search]")) return;

  state.query = target.value;
  const cursor = target.selectionStart || state.query.length;
  renderHome();

  const input = app.querySelector("[data-search]");
  input?.focus();
  input?.setSelectionRange(cursor, cursor);
});

app.addEventListener("click", (event) => {
  const target = event.target;
  if (!(target instanceof Element)) return;

  const startLink = target.closest("[data-game-start]");
  if (!startLink || !window.GameHubProgress) return;

  const gameId = startLink.dataset.gameStart;
  if (!gameId || selfTrackedLaunches.has(gameId)) return;
  window.GameHubProgress.recordLaunch(gameId);
});

window.addEventListener("hashchange", route);
window.addEventListener("DOMContentLoaded", route);
