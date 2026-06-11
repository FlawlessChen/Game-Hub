(function () {
  const STORE_KEY = "game-hub-progress-v1";

  const definitions = {
    "2048": {
      key: "game-hub-2048-best",
      label: "最佳",
      suffix: " 分",
      better: "higher",
      achievements: scoreAchievements(512, 2048),
    },
    snake: {
      key: "game-hub-snake-best",
      label: "最佳",
      suffix: " 分",
      better: "higher",
      achievements: scoreAchievements(100, 300),
    },
    plane: {
      key: "game-hub-plane-best",
      label: "最佳",
      suffix: " 分",
      better: "higher",
      achievements: scoreAchievements(1000, 3000),
    },
    flappy: {
      key: "game-hub-flappy-best",
      label: "最佳",
      suffix: " 分",
      better: "higher",
      achievements: scoreAchievements(10, 30),
    },
    memory: {
      key: "game-hub-memory-best",
      label: "最佳",
      suffix: " 步",
      better: "lower",
      achievements: [
        launchAchievement(),
        bestAchievement("精准配对", "40 步内完成一局", 40),
        bestAchievement("记忆达人", "28 步内完成一局", 28),
      ],
    },
    mole: {
      key: "game-hub-mole-best",
      label: "最佳",
      suffix: " 分",
      better: "higher",
      achievements: scoreAchievements(300, 800),
    },
    brick: {
      key: "game-hub-brick-best",
      label: "最佳",
      suffix: " 分",
      better: "higher",
      achievements: scoreAchievements(200, 560),
    },
    nsshaft: {
      key: "game-hub-nsshaft-best",
      label: "最佳",
      suffix: " 层",
      better: "higher",
      achievements: floorAchievements(20, 50),
    },
    needle: {
      key: "codex-needle-best",
      label: "最佳",
      suffix: " 根",
      better: "higher",
      achievements: [
        launchAchievement(),
        bestAchievement("稳稳出针", "成功插入 6 根针", 6),
        bestAchievement("圆满一圈", "成功插入全部 12 根针", 12),
      ],
    },
    tower: {
      key: "codex-tower-best",
      label: "最佳",
      suffix: " 层",
      better: "higher",
      achievements: floorAchievements(10, 25),
    },
    tetris: {
      key: "codex-tetris-best-score",
      label: "最佳",
      suffix: " 分",
      better: "higher",
      achievements: scoreAchievements(1000, 4000),
    },
  };

  function launchAchievement() {
    return {
      id: "first-launch",
      name: "初次启动",
      description: "进入一次游戏",
      type: "plays",
      target: 1,
    };
  }

  function bestAchievement(name, description, target) {
    return {
      id: `best-${target}`,
      name,
      description,
      type: "best",
      target,
    };
  }

  function scoreAchievements(firstTarget, secondTarget) {
    return [
      launchAchievement(),
      bestAchievement("初露锋芒", `达到 ${firstTarget} 分`, firstTarget),
      bestAchievement("高分追击", `达到 ${secondTarget} 分`, secondTarget),
    ];
  }

  function floorAchievements(firstTarget, secondTarget) {
    return [
      launchAchievement(),
      bestAchievement("逐层深入", `达到 ${firstTarget} 层`, firstTarget),
      bestAchievement("深层探索", `达到 ${secondTarget} 层`, secondTarget),
    ];
  }

  function readStore() {
    try {
      return JSON.parse(localStorage.getItem(STORE_KEY) || '{"games":{}}');
    } catch {
      return { games: {} };
    }
  }

  function writeStore(store) {
    try {
      localStorage.setItem(STORE_KEY, JSON.stringify(store));
    } catch {
      // Local progress is optional; the hub still works without storage.
    }
  }

  function readNumber(key) {
    try {
      const value = Number(localStorage.getItem(key) || 0);
      return Number.isFinite(value) ? value : 0;
    } catch {
      return 0;
    }
  }

  function writeNumber(key, value) {
    try {
      localStorage.setItem(key, String(value));
    } catch {
      // Legacy game score persistence is optional.
    }
  }

  function isBetter(definition, next, current) {
    if (!current) return next > 0;
    if (definition.better === "lower") return next > 0 && next < current;
    return next > current;
  }

  function pickBest(definition, storedBest, legacyBest) {
    if (!storedBest) return legacyBest;
    if (!legacyBest) return storedBest;
    return definition.better === "lower"
      ? Math.min(storedBest, legacyBest)
      : Math.max(storedBest, legacyBest);
  }

  function formatBest(definition, value) {
    if (!value) return "暂无记录";
    return `${definition.label} ${value}${definition.suffix || ""}`;
  }

  function isAchievementUnlocked(achievement, progress, definition) {
    if (achievement.type === "plays") return progress.plays >= achievement.target;
    if (achievement.type !== "best") return false;
    if (!progress.best) return false;

    return definition.better === "lower"
      ? progress.best <= achievement.target
      : progress.best >= achievement.target;
  }

  function getAchievements(definition, progress) {
    return (definition.achievements || [launchAchievement()]).map((achievement) => ({
      ...achievement,
      unlocked: isAchievementUnlocked(achievement, progress, definition),
    }));
  }

  function getUnlockedAchievementIds(progress) {
    return new Set(
      progress.achievements
        .filter((achievement) => achievement.unlocked)
        .map((achievement) => achievement.id)
    );
  }

  function getNewAchievements(before, after) {
    const previous = getUnlockedAchievementIds(before);
    return after.achievements.filter(
      (achievement) => achievement.unlocked && !previous.has(achievement.id)
    );
  }

  function notifyAchievements(gameId, achievements) {
    if (!achievements.length) return;

    for (const achievement of achievements) {
      if (typeof window.CustomEvent === "function") {
        window.dispatchEvent(
          new window.CustomEvent("gamehub:achievement-unlocked", {
            detail: { gameId, achievement },
          })
        );
      }
      showAchievementToast(achievement);
    }
  }

  function showAchievementToast(achievement) {
    if (typeof document === "undefined" || !document.body) return;

    ensureToastStyles();
    const stack = ensureToastStack();
    const toast = document.createElement("div");
    toast.className = "gamehub-achievement-toast";
    toast.innerHTML = `
      <span>解锁成就</span>
      <strong>${achievement.name}</strong>
      <small>${achievement.description}</small>
    `;
    stack.appendChild(toast);

    window.setTimeout(() => {
      toast.classList.add("is-leaving");
      window.setTimeout(() => toast.remove(), 260);
    }, 3200);
  }

  function ensureToastStack() {
    let stack = document.querySelector(".gamehub-achievement-stack");
    if (stack) return stack;

    stack = document.createElement("div");
    stack.className = "gamehub-achievement-stack";
    stack.setAttribute("aria-live", "polite");
    document.body.appendChild(stack);
    return stack;
  }

  function ensureToastStyles() {
    if (document.querySelector("#gamehub-achievement-toast-style")) return;

    const style = document.createElement("style");
    style.id = "gamehub-achievement-toast-style";
    style.textContent = `
      .gamehub-achievement-stack {
        position: fixed;
        right: max(1rem, env(safe-area-inset-right));
        bottom: max(1rem, env(safe-area-inset-bottom));
        z-index: 9999;
        display: grid;
        gap: 0.65rem;
        width: min(21rem, calc(100vw - 2rem));
        max-width: calc(100vw - 2rem);
        pointer-events: none;
      }

      .gamehub-achievement-toast {
        display: grid;
        gap: 0.22rem;
        padding: 0.85rem 0.95rem;
        color: #172033;
        background: rgba(255, 255, 255, 0.95);
        border: 1px solid rgba(217, 224, 235, 0.95);
        border-left: 0.3rem solid #168a5c;
        border-radius: 0.5rem;
        box-shadow: 0 18px 44px rgba(23, 32, 51, 0.18);
        animation: gamehub-toast-in 220ms ease-out both;
        backdrop-filter: blur(14px);
      }

      .gamehub-achievement-toast.is-leaving {
        animation: gamehub-toast-out 220ms ease-in both;
      }

      .gamehub-achievement-toast span {
        color: #168a5c;
        font-size: 0.72rem;
        font-weight: 900;
        text-transform: uppercase;
        letter-spacing: 0;
      }

      .gamehub-achievement-toast strong {
        font-size: 0.98rem;
        line-height: 1.2;
      }

      .gamehub-achievement-toast small {
        color: #68738a;
        font-size: 0.82rem;
        font-weight: 700;
        line-height: 1.35;
      }

      @keyframes gamehub-toast-in {
        from { opacity: 0; transform: translateY(0.6rem); }
        to { opacity: 1; transform: translateY(0); }
      }

      @keyframes gamehub-toast-out {
        from { opacity: 1; transform: translateY(0); }
        to { opacity: 0; transform: translateY(0.6rem); }
      }

      @media (max-width: 480px) {
        .gamehub-achievement-stack {
          top: max(0.75rem, env(safe-area-inset-top));
          right: max(0.75rem, env(safe-area-inset-right));
          left: max(0.75rem, env(safe-area-inset-left));
          bottom: auto;
          width: auto;
          max-width: none;
        }
      }
    `;
    document.head.appendChild(style);
  }

  function getGameProgress(gameId) {
    const definition = definitions[gameId] || { label: "最佳", better: "higher" };
    const store = readStore();
    const stored = store.games[gameId] || {};
    const legacyBest = definition.key ? readNumber(definition.key) : 0;
    const best = pickBest(definition, Number(stored.best || 0), legacyBest);
    const progress = {
      best,
      bestText: formatBest(definition, best),
      hasBest: best > 0,
      plays: Number(stored.plays || 0),
      lastPlayed: stored.lastPlayed || "",
      updatedAt: stored.updatedAt || "",
    };
    const achievements = getAchievements(definition, progress);

    return {
      ...progress,
      achievements,
      unlockedAchievements: achievements.filter((achievement) => achievement.unlocked).length,
      totalAchievements: achievements.length,
    };
  }

  function recordLaunch(gameId) {
    const before = getGameProgress(gameId);
    const store = readStore();
    const current = store.games[gameId] || {};
    const lastPlayedTime = Date.parse(current.lastPlayed || "");
    const isDuplicateLaunch =
      Number.isFinite(lastPlayedTime) && Date.now() - lastPlayedTime < 5000;
    store.games[gameId] = {
      ...current,
      plays: Number(current.plays || 0) + (isDuplicateLaunch ? 0 : 1),
      lastPlayed: new Date().toISOString(),
    };
    writeStore(store);
    const after = getGameProgress(gameId);
    if (!isDuplicateLaunch) notifyAchievements(gameId, getNewAchievements(before, after));
  }

  function recordBest(gameId, value) {
    const next = Number(value || 0);
    const definition = definitions[gameId] || { label: "最佳", better: "higher" };
    if (!Number.isFinite(next) || next <= 0) return false;

    const before = getGameProgress(gameId);
    const store = readStore();
    const current = store.games[gameId] || {};
    const storedBest = Number(current.best || 0);
    const shouldUpdate =
      isBetter(definition, next, before.best) ||
      (next === before.best && next !== storedBest);
    if (!shouldUpdate) return false;

    store.games[gameId] = {
      ...current,
      best: next,
      updatedAt: new Date().toISOString(),
    };
    writeStore(store);
    if (definition.key) writeNumber(definition.key, next);
    const after = getGameProgress(gameId);
    notifyAchievements(gameId, getNewAchievements(before, after));
    return true;
  }

  function registerGamePage(gameId) {
    recordLaunch(gameId);
  }

  function getSummary(games) {
    const progress = games.map((game) => getGameProgress(game.id));
    return {
      recordedGames: progress.filter((item) => item.hasBest).length,
      totalPlays: progress.reduce((total, item) => total + item.plays, 0),
      unlockedAchievements: progress.reduce((total, item) => total + item.unlockedAchievements, 0),
      totalAchievements: progress.reduce((total, item) => total + item.totalAchievements, 0),
    };
  }

  window.GameHubProgress = {
    definitions,
    getGameProgress,
    getSummary,
    recordBest,
    recordLaunch,
    registerGamePage,
  };
})();
