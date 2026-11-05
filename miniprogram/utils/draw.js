const { starsFor, coordName } = require("./engine.js");

function paint(canvas, cssW, state) {
  if (!canvas || !cssW || !state) return;
  const dpr = (wx.getWindowInfo && wx.getWindowInfo().pixelRatio) || 2;
  canvas.width = Math.round(cssW * dpr);
  canvas.height = Math.round(cssW * dpr);
  const ctx = canvas.getContext("2d");
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  const box = layout(cssW, state);
  paintWood(ctx, cssW);
  paintLines(ctx, state, box);
  paintStars(ctx, state, box);
  paintDots(ctx, state, state.hints || [], box, "rgba(176, 122, 28, 0.95)", 0.16);
  paintDots(ctx, state, state.liberties || [], box, "#b64032", 0.13);
  paintEyes(ctx, state, box);
  paintStones(ctx, state, box);
}

function layout(cssW, state) {
  const showLabels = state.labels !== false;
  const label = cssW * (showLabels ? 0.09 : 0.06);
  const gap = (cssW - label * 2) / Math.max(1, state.size - 1);
  const radius = Math.min(gap * 0.47, label * 0.86);
  return { cssW, label, gap, radius };
}

function point(r, c, box) {
  return [box.label + c * box.gap, box.label + r * box.gap];
}

function hit(x, y, size, cssW, labels) {
  const box = layout(cssW, { size, labels });
  const c = Math.round((x - box.label) / box.gap);
  const r = Math.round((y - box.label) / box.gap);
  if (r < 0 || c < 0 || r >= size || c >= size) return null;
  const [px, py] = point(r, c, box);
  if (Math.hypot(x - px, y - py) > box.gap * 0.55) return null;
  return [r, c];
}

function paintWood(ctx, cssW) {
  const grain = ctx.createLinearGradient(0, 0, cssW, cssW);
  grain.addColorStop(0, "#f2ce90");
  grain.addColorStop(0.45, "#e2b15c");
  grain.addColorStop(1, "#c99645");
  ctx.fillStyle = grain;
  ctx.fillRect(0, 0, cssW, cssW);
}

function paintLines(ctx, state, box) {
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
  ctx.font = `${Math.max(11, box.label * 0.38)}px sans-serif`;
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
    ctx.fillText(String(state.size - i), left - box.label * 0.5, y);
    ctx.fillText(String(state.size - i), right + box.label * 0.5, y);
  }
}

function paintStars(ctx, state, box) {
  ctx.fillStyle = "#3b2918";
  for (const [r, c] of starsFor(state.size)) {
    const [x, y] = point(r, c, box);
    ctx.beginPath();
    ctx.arc(x, y, Math.max(2.5, box.gap * 0.09), 0, Math.PI * 2);
    ctx.fill();
  }
}

function paintDots(ctx, state, points, box, color, scale) {
  ctx.fillStyle = color;
  for (const [r, c] of points) {
    if (state.board[r][c]) continue;
    const [x, y] = point(r, c, box);
    ctx.beginPath();
    ctx.arc(x, y, Math.max(3, box.gap * scale), 0, Math.PI * 2);
    ctx.fill();
  }
}

function paintEyes(ctx, state, box) {
  ctx.strokeStyle = "#2f6f4e";
  ctx.lineWidth = Math.max(1.5, box.gap * 0.06);
  for (const [r, c] of state.eyes || []) {
    const [x, y] = point(r, c, box);
    ctx.beginPath();
    ctx.arc(x, y, Math.max(4, box.gap * 0.2), 0, Math.PI * 2);
    ctx.stroke();
  }
}

function paintStones(ctx, state, box) {
  const focus = new Set((state.focus || []).map(([r, c]) => `${r},${c}`));
  for (let r = 0; r < state.size; r += 1) {
    for (let c = 0; c < state.size; c += 1) {
      const color = state.board[r][c];
      if (!color) continue;
      const [x, y] = point(r, c, box);
      drawStone(ctx, x, y, box.radius, color);
      if (focus.has(`${r},${c}`)) {
        ctx.beginPath();
        ctx.arc(x, y, box.radius + 2, 0, Math.PI * 2);
        ctx.strokeStyle = "#a56b12";
        ctx.lineWidth = Math.max(2, box.radius * 0.1);
        ctx.stroke();
      }
      if (state.lastMove && state.lastMove.r === r && state.lastMove.c === c) {
        ctx.beginPath();
        ctx.arc(x, y, Math.max(2, box.radius * 0.28), 0, Math.PI * 2);
        ctx.fillStyle = color === "B" ? "#f4efe4" : "#b64032";
        ctx.fill();
      }
    }
  }
}

function drawStone(ctx, x, y, radius, color) {
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
    ctx.strokeStyle = "rgba(30, 20, 10, 0.35)";
    ctx.lineWidth = Math.max(1, radius * 0.06);
    ctx.stroke();
  }
}

module.exports = { paint, hit };
