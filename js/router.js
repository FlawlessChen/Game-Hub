const games = [
  {
    id: "2048",
    name: "2048",
    path: "./games/2048/index.html",
    description: "合并数字方块，冲刺更高分数。",
    tags: ["Puzzle", "Solo"],
    art: "2048",
    theme: "linear-gradient(135deg, #2364d8, #17a2a4)"
  },
  {
    id: "snake",
    name: "Snake",
    path: "./games/snake/index.html",
    description: "控制路线、吃掉目标、避开边界。",
    tags: ["Arcade", "Score"],
    art: "SNK",
    theme: "linear-gradient(135deg, #168a5c, #4e8d22)"
  },
  {
    id: "plane",
    name: "飞机大战",
    path: "./games/plane/index.html",
    description: "驾驶战机，躲避敌机并击落来袭目标。",
    tags: ["Shooter", "Action"],
    art: "AIR",
    theme: "linear-gradient(135deg, #2364d8, #17a2a4)"
  },
  {
    id: "flappy",
    name: "飞翔的小鸟",
    path: "./games/flappy/index.html",
    description: "穿过连续水管，冲刺更高分数。",
    tags: ["Timing", "Arcade"],
    art: "FLY",
    theme: "linear-gradient(135deg, #ba6b12, #d64d3f)"
  },
  {
    id: "memory",
    name: "记忆翻牌",
    path: "./games/memory/index.html",
    description: "短时记忆配对挑战。",
    tags: ["Memory", "Cards"],
    art: "MEM",
    theme: "linear-gradient(135deg, #6a55ca, #2364d8)"
  },
  {
    id: "mole",
    name: "打地鼠",
    path: "./games/mole/index.html",
    description: "快速反应，击中出现的目标。",
    tags: ["Reaction", "Timer"],
    art: "MOL",
    theme: "linear-gradient(135deg, #c43d3d, #ba6b12)"
  },
  {
    id: "brick",
    name: "打砖块",
    path: "./games/brick/index.html",
    description: "用挡板反弹小球，击碎彩色砖块并接住道具。",
    tags: ["Arcade", "Canvas"],
    art: "BRK",
    theme: "linear-gradient(135deg, #07111f, #22c55e)"
  },
  {
    id: "nsshaft",
    name: "下一百层",
    path: "./games/nsshaft/index.html",
    description: "控制小方块踩平台下行，避开顶部钉子和地刺。",
    tags: ["Arcade", "Mobile"],
    art: "NS",
    theme: "linear-gradient(135deg, #0a1020, #38bdf8)"
  },
  {
    id: "needle",
    name: "见缝插针",
    path: "./games/needle/index.html",
    description: "把编号小针插进旋转大球，避开已有针脚。",
    tags: ["Timing", "Canvas"],
    art: "PIN",
    theme: "linear-gradient(135deg, #2563eb, #dc2626)"
  },
  {
    id: "tower",
    name: "建楼大师",
    path: "./games/tower/index.html",
    description: "放下摆动楼层，裁掉偏差，向上叠出更高楼。",
    tags: ["Timing", "Stack"],
    art: "BLD",
    theme: "linear-gradient(135deg, #0f766e, #d97706)"
  },
  {
    id: "tetris",
    name: "俄罗斯方块",
    path: "./games/tetris/index.html",
    description: "旋转下落的方块，消除整行得分。",
    tags: ["Puzzle", "Arcade"],
    art: "TET",
    theme: "linear-gradient(135deg, #6a55ca, #34c5d6)"
  }
];

const app = document.querySelector("#app");
const navLinks = [...document.querySelectorAll("[data-route-link]")];

function gameCard(game) {
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
      </div>
      <div class="game-action">
        <span class="status">Ready</span>
        <a class="button" href="#/game/${game.id}">进入</a>
      </div>
    </article>
  `;
}

function renderHome() {
  app.innerHTML = `
    <section class="dashboard">
      <div class="summary">
        <div>
          <h1>Game Hub</h1>
          <p>${games.map((game) => game.name).join("、")}</p>
        </div>
        <div class="stats" aria-label="游戏概览">
          <div class="stat">
            <strong>${games.length}</strong>
            <span>Games</span>
          </div>
          <div class="stat">
            <strong>${games.length}</strong>
            <span>Folders</span>
          </div>
          <div class="stat">
            <strong>1</strong>
            <span>Hub</span>
          </div>
        </div>
      </div>

      <div class="section-head">
        <h2>推荐游戏</h2>
        <span>${games.length} items</span>
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
        <span>${games.length} items</span>
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
          <div class="detail-actions">
            <a class="button" href="${game.path}">开始</a>
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

window.addEventListener("hashchange", route);
window.addEventListener("DOMContentLoaded", route);
