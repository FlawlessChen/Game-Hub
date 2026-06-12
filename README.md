# 游戏中心

一个极简小游戏合集。首页只保留搜索框和游戏入口，点击卡片直接进入对应游戏。

## 运行

这是纯静态项目，不需要构建步骤。可以直接打开 `index.html`，也可以用任意静态服务器托管根目录。

示例：

```powershell
powershell.exe -NoProfile -ExecutionPolicy Bypass -File .mobile-audit\static-server.ps1 -Root . -Port 8123
```

然后访问：

```text
http://127.0.0.1:8123/
```

## 目录

```text
assets/
  covers/      游戏入口封面
  effects/     游戏内特效贴图
  scenes/      游戏内背景图
  sprites/     游戏内角色、道具、水果等贴图
css/
  style.css    首页样式
games/
  */           每个小游戏独立的 HTML/CSS/JS
js/
  progress.js  本地分数、启动次数和成就记录
  router.js    首页游戏数据、搜索和入口渲染
tools/
  generate-internal-assets.ps1  离线生成项目内 PNG 资源
```

## 内部 PNG 生成

项目不依赖 AI 生图。当前 `assets/scenes` 和 `assets/effects` 里的部分 PNG 可以通过脚本离线复现：

```powershell
powershell.exe -NoProfile -ExecutionPolicy Bypass -File tools\generate-internal-assets.ps1
```

脚本会生成：

- `assets/scenes/coin-catch-market.png`
- `assets/scenes/fruit-slice-board.png`
- `assets/effects/coin-spark.png`
- `assets/effects/fruit-splash.png`
- `assets/effects/slice-glint.png`

## 添加游戏

1. 在 `games/` 下新增游戏目录，例如 `games/example/`。
2. 放入该游戏的 `index.html`、`style.css`、`game.js`。
3. 在 `js/router.js` 的 `games` 数组里新增一项。
4. 如需记录启动次数或分数，在游戏页引入 `../../js/progress.js`，并调用 `window.GameHubProgress.registerGamePage("game-id")` 或 `recordBest`。

## 设计原则

- 首页保持极简：搜索框 + 游戏入口。
- 游戏入口直接启动，不做额外详情页。
- 游戏内资源优先使用项目内 PNG 或 Canvas 绘制，保证离线可运行。
- 不把每日挑战、标签分类、运营任务流放回首页。
