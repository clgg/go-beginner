import { starsFor, coordName } from "./engine.js";

export function createBoardView(stage, handlers) {
  const canvas = document.createElement("canvas");
  canvas.setAttribute("aria-hidden", "true");
  const hits = document.createElement("div");
  hits.className = "hits";
  stage.replaceChildren(canvas, hits);
  const ctx = canvas.getContext("2d");
  let state = null;
  let built = "";

  const observer = new ResizeObserver(() => draw());
  observer.observe(stage);

  function layout() {
    const cssW = stage.clientWidth;
    const showLabels = state?.labels !== false;
    const label = cssW * (showLabels ? 0.09 : 0.06);
    const gap = (cssW - label * 2) / Math.max(1, (state?.size || 9) - 1);
    const radius = Math.min(gap * 0.47, label * 0.86);
    return { cssW, label, gap, radius };
  }

  function point(r, c, box) {
    return [box.label + c * box.gap, box.label + r * box.gap];
  }

  function ensureHits(box) {
    const stamp = `${state.size}:${state.labels !== false}`;
    if (stamp === built && hits.childElementCount === state.size * state.size) {
      updateHitLabels();
      return;
    }
    built = stamp;
    hits.replaceChildren();
    for (let r = 0; r < state.size; r += 1) {
      for (let c = 0; c < state.size; c += 1) {
        const button = document.createElement("button");
        button.type = "button";
        button.className = "hit";
        button.dataset.r = String(r);
        button.dataset.c = String(c);
        const [x, y] = point(r, c, box);
        const target = box.gap;
        button.style.left = `${(x / box.cssW) * 100}%`;
        button.style.top = `${(y / box.cssW) * 100}%`;
        button.style.width = `${(target / box.cssW) * 100}%`;
        button.style.height = `${(target / box.cssW) * 100}%`;
        button.addEventListener("pointerenter", (event) => {
          if (event.pointerType === "touch") return;
          handlers.hover?.(r, c);
        });
        button.addEventListener("pointerleave", () => handlers.hover?.(null, null));
        button.addEventListener("click", () => handlers.play?.(r, c));
        button.addEventListener("keydown", (event) => moveFocus(event, r, c));
        hits.append(button);
      }
    }
    updateHitLabels();
  }

  function updateHitLabels() {
    if (!state) return;
    for (const button of hits.children) {
      const r = Number(button.dataset.r);
      const c = Number(button.dataset.c);
      const stone = state.board?.[r]?.[c];
      const where = coordName(r, c, state.size);
      const who = stone === "B" ? "黑子" : stone === "W" ? "白子" : "空点";
      button.setAttribute("aria-label", `${where} ${who}`);
    }
  }

  function moveFocus(event, r, c) {
    const step = { ArrowUp: [-1, 0], ArrowDown: [1, 0], ArrowLeft: [0, -1], ArrowRight: [0, 1] }[event.key];
    if (!step) return;
    const next = hits.querySelector(`[data-r="${r + step[0]}"][data-c="${c + step[1]}"]`);
    if (!next) return;
    event.preventDefault();
    next.focus();
  }

  function draw() {
    if (!state || !stage.clientWidth) return;
    const box = layout();
    const dpr = window.devicePixelRatio || 1;
    canvas.style.width = "100%";
    canvas.style.height = `${box.cssW}px`;
    canvas.width = Math.round(box.cssW * dpr);
    canvas.height = Math.round(box.cssW * dpr);
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    paintWood(box.cssW);
    paintLines(box);
    paintStars(box);
    paintDots(state.hints || [], box, "rgba(176, 122, 28, 0.95)", 0.16);
    paintDots(state.liberties || [], box, "#b64032", 0.13);
    paintEyes(state.eyes || [], box);
    if (state.ghost) paintGhost(state.ghost, box);
    paintStones(box);
    ensureHits(box);
  }

  function paintWood(cssW) {
    const grain = ctx.createLinearGradient(0, 0, cssW, cssW);
    grain.addColorStop(0, "#f2ce90");
    grain.addColorStop(0.45, "#e2b15c");
    grain.addColorStop(1, "#c99645");
    ctx.fillStyle = grain;
    ctx.fillRect(0, 0, cssW, cssW);
    const shade = ctx.createRadialGradient(cssW / 2, cssW / 2, cssW * 0.2, cssW / 2, cssW / 2, cssW * 0.72);
    shade.addColorStop(0, "rgba(255,255,255,0.12)");
    shade.addColorStop(1, "rgba(90,48,12,0.16)");
    ctx.fillStyle = shade;
    ctx.fillRect(0, 0, cssW, cssW);
  }

  function paintLines(box) {
    ctx.strokeStyle = "#4a3422";
    ctx.lineWidth = Math.max(1, box.cssW / 420);
    ctx.beginPath();
    for (let i = 0; i < state.size; i += 1) {
      const [x0, y0] = point(i, 0, box);
      const [x1] = point(i, state.size - 1, box);
      ctx.moveTo(x0, y0);
      ctx.lineTo(x1, y0);
      const [topX, topY] = point(0, i, box);
      const [, bottomY] = point(state.size - 1, i, box);
      ctx.moveTo(topX, topY);
      ctx.lineTo(topX, bottomY);
    }
    ctx.stroke();
    if (state.labels === false) return;
    ctx.fillStyle = "#5c4630";
    ctx.font = `${Math.max(11, box.label * 0.38)}px "Iowan Old Style", "Songti SC", serif`;
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    for (let i = 0; i < state.size; i += 1) {
      const [x, top] = point(0, i, box);
      const [, bottom] = point(state.size - 1, i, box);
      const letter = coordName(0, i, state.size)[0];
      ctx.fillText(letter, x, top - box.label * 0.48);
      ctx.fillText(letter, x, bottom + box.label * 0.48);
      const [left, y] = point(i, 0, box);
      const [right] = point(i, state.size - 1, box);
      const row = String(state.size - i);
      ctx.fillText(row, left - box.label * 0.5, y);
      ctx.fillText(row, right + box.label * 0.5, y);
    }
  }

  function paintStars(box) {
    ctx.fillStyle = "#3b2918";
    for (const [r, c] of starsFor(state.size)) {
      const [x, y] = point(r, c, box);
      ctx.beginPath();
      ctx.arc(x, y, Math.max(2.5, box.gap * 0.09), 0, Math.PI * 2);
      ctx.fill();
    }
  }

  function paintDots(points, box, color, scale) {
    ctx.fillStyle = color;
    for (const [r, c] of points) {
      if (state.board?.[r]?.[c]) continue;
      const [x, y] = point(r, c, box);
      ctx.beginPath();
      ctx.arc(x, y, Math.max(3, box.gap * scale), 0, Math.PI * 2);
      ctx.fill();
    }
  }

  function paintEyes(points, box) {
    ctx.strokeStyle = "#2f6f4e";
    ctx.lineWidth = Math.max(1.5, box.gap * 0.06);
    for (const [r, c] of points) {
      const [x, y] = point(r, c, box);
      ctx.beginPath();
      ctx.arc(x, y, Math.max(4, box.gap * 0.2), 0, Math.PI * 2);
      ctx.stroke();
    }
  }

  function paintGhost(ghost, box) {
    const [x, y] = point(ghost.r, ghost.c, box);
    ctx.beginPath();
    ctx.arc(x, y, box.radius, 0, Math.PI * 2);
    ctx.fillStyle = ghost.color === "B" ? "rgba(20,20,20,0.35)" : "rgba(255,255,255,0.55)";
    ctx.fill();
    if (ghost.legal === false) {
      ctx.strokeStyle = "#b64032";
      ctx.lineWidth = Math.max(2, box.radius * 0.12);
      ctx.beginPath();
      ctx.moveTo(x - box.radius * 0.38, y - box.radius * 0.38);
      ctx.lineTo(x + box.radius * 0.38, y + box.radius * 0.38);
      ctx.moveTo(x + box.radius * 0.38, y - box.radius * 0.38);
      ctx.lineTo(x - box.radius * 0.38, y + box.radius * 0.38);
      ctx.stroke();
    }
  }

  function paintStones(box) {
    const focus = new Set((state.focus || []).map(([r, c]) => `${r},${c}`));
    for (let r = 0; r < state.size; r += 1) {
      for (let c = 0; c < state.size; c += 1) {
        const color = state.board?.[r]?.[c];
        if (!color) continue;
        const [x, y] = point(r, c, box);
        drawStone(x, y, box.radius, color);
        if (focus.has(`${r},${c}`)) {
          ctx.beginPath();
          ctx.arc(x, y, box.radius + 2, 0, Math.PI * 2);
          ctx.strokeStyle = "#a56b12";
          ctx.lineWidth = Math.max(2, box.radius * 0.1);
          ctx.stroke();
        }
        if (state.lastMove && state.lastMove.r === r && state.lastMove.c === c) {
          ctx.beginPath();
          ctx.arc(x, y, box.radius * 0.28, 0, Math.PI * 2);
          ctx.fillStyle = color === "B" ? "#f4efe4" : "#b64032";
          ctx.fill();
        }
      }
    }
  }

  function drawStone(x, y, radius, color) {
    ctx.beginPath();
    ctx.ellipse(x + radius * 0.08, y + radius * 0.2, radius * 0.82, radius * 0.42, 0, 0, Math.PI * 2);
    ctx.fillStyle = "rgba(50, 28, 10, 0.28)";
    ctx.fill();
    const gradient = ctx.createRadialGradient(x - radius * 0.35, y - radius * 0.4, radius * 0.08, x, y, radius);
    if (color === "B") {
      gradient.addColorStop(0, "#6e6e6e");
      gradient.addColorStop(1, "#141414");
    } else {
      gradient.addColorStop(0, "#ffffff");
      gradient.addColorStop(1, "#d7d7d7");
    }
    ctx.beginPath();
    ctx.arc(x, y, radius, 0, Math.PI * 2);
    ctx.fillStyle = gradient;
    ctx.fill();
    if (color === "W") {
      ctx.strokeStyle = "rgba(30, 20, 10, 0.28)";
      ctx.lineWidth = Math.max(1, radius * 0.06);
      ctx.stroke();
    }
  }

  return {
    setState(next) {
      state = next;
      draw();
    },
    destroy() {
      observer.disconnect();
    },
  };
}
