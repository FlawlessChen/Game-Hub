(() => {
  const root = document.documentElement;
  const CHANGE_EVENT = "gamehub:viewportchange";
  const MIN_PLAYFIELD_WIDTH = 220;
  let frameId = 0;
  let lastSignature = "";

  function clamp(value, min, max) {
    return Math.min(max, Math.max(min, value));
  }

  function toPixels(value) {
    const parsed = Number.parseFloat(value);
    return Number.isFinite(parsed) ? parsed : 0;
  }

  function getViewport() {
    const viewport = window.visualViewport;
    const width = viewport?.width || window.innerWidth || root.clientWidth || 1;
    const height = viewport?.height || window.innerHeight || root.clientHeight || 1;

    return {
      width: Math.max(1, Math.round(width)),
      height: Math.max(1, Math.round(height)),
      offsetTop: Math.max(0, Math.round(viewport?.offsetTop || 0)),
      offsetLeft: Math.max(0, Math.round(viewport?.offsetLeft || 0)),
    };
  }

  function getCanvasAspect(wrap) {
    const canvas = wrap.querySelector("canvas");
    const width = Number(canvas?.getAttribute("width"));
    const height = Number(canvas?.getAttribute("height"));

    if (width > 0 && height > 0) {
      return width / height;
    }

    const rect = wrap.getBoundingClientRect();
    if (rect.width > 0 && rect.height > 0) {
      return rect.width / rect.height;
    }

    return 1;
  }

  function visiblePanelChildren(panel) {
    return Array.from(panel.children).filter((child) => {
      const style = window.getComputedStyle(child);
      return style.display !== "none" && style.position !== "absolute";
    });
  }

  function fitShellPlayfield(viewport, edgeGuard) {
    const shell = document.querySelector(".game-shell");
    const panel = shell?.querySelector(".game-panel");
    const canvasWrap = shell?.querySelector(".canvas-wrap");

    if (!shell || !panel || !canvasWrap) {
      return "";
    }

    const shellStyle = window.getComputedStyle(shell);
    const panelStyle = window.getComputedStyle(panel);
    const rowGap = toPixels(panelStyle.rowGap || panelStyle.gap);
    const shellPaddingY = toPixels(shellStyle.paddingTop) + toPixels(shellStyle.paddingBottom);
    const shellPaddingX = toPixels(shellStyle.paddingLeft) + toPixels(shellStyle.paddingRight);
    const children = visiblePanelChildren(panel);
    const reservedHeight = children
      .filter((child) => child !== canvasWrap)
      .reduce((total, child) => total + child.getBoundingClientRect().height, 0);
    const totalGap = rowGap * Math.max(0, children.length - 1);
    const availableHeight = Math.max(
      MIN_PLAYFIELD_WIDTH,
      viewport.height - reservedHeight - totalGap - shellPaddingY - edgeGuard
    );
    const panelWidth = panel.getBoundingClientRect().width || viewport.width;
    const availableWidth = Math.max(MIN_PLAYFIELD_WIDTH, Math.min(panelWidth, viewport.width - shellPaddingX));
    const aspect = getCanvasAspect(canvasWrap);
    const fittedWidth = Math.floor(Math.min(availableWidth, availableHeight * aspect));

    root.style.setProperty("--playfield-width", `${Math.max(MIN_PLAYFIELD_WIDTH, fittedWidth)}px`);
    return root.style.getPropertyValue("--playfield-width");
  }

  function update() {
    frameId = 0;

    const viewport = getViewport();
    const edgeGuard = Math.round(clamp(viewport.height * 0.018, 8, 16));

    root.classList.add("has-mobile-viewport");
    root.style.setProperty("--app-width", `${viewport.width}px`);
    root.style.setProperty("--app-height", `${viewport.height}px`);
    root.style.setProperty("--viewport-offset-top", `${viewport.offsetTop}px`);
    root.style.setProperty("--viewport-offset-left", `${viewport.offsetLeft}px`);
    root.style.setProperty("--browser-ui-guard", `${edgeGuard}px`);

    const playfieldWidth = fitShellPlayfield(viewport, edgeGuard);
    const signature = [
      viewport.width,
      viewport.height,
      viewport.offsetTop,
      viewport.offsetLeft,
      playfieldWidth,
    ].join(":");

    if (signature === lastSignature) {
      return;
    }

    lastSignature = signature;
    window.dispatchEvent(new CustomEvent(CHANGE_EVENT, { detail: viewport }));
  }

  function queueUpdate() {
    if (frameId) {
      return;
    }

    frameId = window.requestAnimationFrame(update);
  }

  window.GameHubViewport = {
    eventName: CHANGE_EVENT,
    refresh: queueUpdate,
  };

  window.addEventListener("resize", queueUpdate, { passive: true });
  window.addEventListener("orientationchange", queueUpdate, { passive: true });
  window.addEventListener("pageshow", queueUpdate, { passive: true });
  document.addEventListener("visibilitychange", queueUpdate);
  document.addEventListener("DOMContentLoaded", queueUpdate);
  window.visualViewport?.addEventListener("resize", queueUpdate, { passive: true });
  window.visualViewport?.addEventListener("scroll", queueUpdate, { passive: true });

  update();
})();
