// Beginner Chinese rules: orthogonal connection, capture with no liberties,
// suicide banned, and positional superko (no previous board may return).

export function stonesFromPicture(picture) {
  const rows = picture.trim().split("\n").map((row) => row.trim());
  const size = rows.length;
  if (size < 2 || rows.some((row) => row.length !== size)) {
    throw new Error("picture must be a square of . X O");
  }
  const stones = [];
  rows.forEach((line, r) => {
    [...line].forEach((ch, c) => {
      if (ch === "X") stones.push(["B", r, c]);
      else if (ch === "O") stones.push(["W", r, c]);
      else if (ch !== ".") throw new Error(`bad cell ${ch}`);
    });
  });
  return { size, stones };
}

export function createGame(size) {
  if (size < 2 || size > 19) throw new Error("board size");
  let board = empty(size);
  let toPlay = "B";
  let captures = { B: 0, W: 0 };
  let seen = new Set([hashOf(board)]);
  let history = [];
  let moves = [];
  let lastMove = null;
  let consecutivePasses = 0;

  function inBoard(r, c) {
    return r >= 0 && c >= 0 && r < size && c < size;
  }

  function neighbors(r, c) {
    const out = [];
    if (r > 0) out.push([r - 1, c]);
    if (r + 1 < size) out.push([r + 1, c]);
    if (c > 0) out.push([r, c - 1]);
    if (c + 1 < size) out.push([r, c + 1]);
    return out;
  }

  function groupOf(cells, r, c) {
    const color = cells[r][c];
    if (!color) return null;
    const stones = [];
    const liberties = [];
    const member = new Set([key(r, c)]);
    const libs = new Set();
    const stack = [[r, c]];
    while (stack.length) {
      const [y, x] = stack.pop();
      stones.push([y, x]);
      for (const [ny, nx] of neighbors(y, x)) {
        const value = cells[ny][nx];
        const id = key(ny, nx);
        if (!value) {
          if (!libs.has(id)) {
            libs.add(id);
            liberties.push([ny, nx]);
          }
        } else if (value === color && !member.has(id)) {
          member.add(id);
          stack.push([ny, nx]);
        }
      }
    }
    return { color, stones, liberties };
  }

  function inspect(r, c, color = toPlay) {
    if (!inBoard(r, c)) return { legal: false, reason: "bounds" };
    if (board[r][c]) return { legal: false, reason: "occupied" };
    const next = clone(board);
    next[r][c] = color;
    const opponent = color === "B" ? "W" : "B";
    const captured = [];
    const visited = new Set();
    for (const [nr, nc] of neighbors(r, c)) {
      const id = key(nr, nc);
      if (next[nr][nc] !== opponent || visited.has(id)) continue;
      const group = groupOf(next, nr, nc);
      for (const [sr, sc] of group.stones) visited.add(key(sr, sc));
      if (group.liberties.length === 0) {
        for (const [sr, sc] of group.stones) {
          next[sr][sc] = null;
          captured.push([sr, sc]);
        }
      }
    }
    const self = groupOf(next, r, c);
    if (!self || self.liberties.length === 0) return { legal: false, reason: "suicide" };
    const digest = hashOf(next);
    if (seen.has(digest)) return { legal: false, reason: "ko" };
    return { legal: true, board: next, captured, liberties: self.liberties, hash: digest };
  }

  function snapshot() {
    return {
      board: clone(board),
      toPlay,
      captures: { ...captures },
      seen: new Set(seen),
      moves: moves.map((move) => ({ ...move })),
      lastMove: lastMove ? { ...lastMove } : null,
      consecutivePasses,
    };
  }

  function restore(state) {
    board = clone(state.board);
    toPlay = state.toPlay;
    captures = { ...state.captures };
    seen = new Set(state.seen);
    moves = state.moves.map((move) => ({ ...move }));
    lastMove = state.lastMove ? { ...state.lastMove } : null;
    consecutivePasses = state.consecutivePasses;
  }

  function pushHistory() {
    history.push(snapshot());
  }

  return {
    get size() {
      return size;
    },
    get toPlay() {
      return toPlay;
    },
    get captures() {
      return { ...captures };
    },
    get lastMove() {
      return lastMove ? { ...lastMove } : null;
    },
    get moves() {
      return moves.map((move) => ({ ...move }));
    },
    get ended() {
      return consecutivePasses >= 2;
    },
    cell(r, c) {
      return board[r][c];
    },
    cells() {
      return clone(board);
    },
    count(color) {
      let total = 0;
      for (const row of board) for (const value of row) if (value === color) total += 1;
      return total;
    },
    load(stones, turn = "B") {
      board = empty(size);
      for (const [color, r, c] of stones) {
        if (!inBoard(r, c) || (color !== "B" && color !== "W")) throw new Error("bad stone");
        if (board[r][c]) throw new Error("overlap");
        board[r][c] = color;
      }
      toPlay = turn;
      captures = { B: 0, W: 0 };
      seen = new Set([hashOf(board)]);
      history = [];
      moves = [];
      lastMove = null;
      consecutivePasses = 0;
    },
    inspect(r, c, color = toPlay) {
      return inspect(r, c, color);
    },
    groupAt(r, c) {
      if (!inBoard(r, c)) return null;
      return groupOf(board, r, c);
    },
    solidEyes(r, c) {
      const group = groupOf(board, r, c);
      if (!group) return [];
      const members = new Set(group.stones.map(([y, x]) => key(y, x)));
      const eyes = [];
      for (const [y, x] of group.liberties) {
        const around = neighbors(y, x);
        if (around.length && around.every(([ny, nx]) => members.has(key(ny, nx)))) eyes.push([y, x]);
      }
      return eyes;
    },
    play(r, c) {
      if (consecutivePasses >= 2) return { ok: false, reason: "ended" };
      const analysis = inspect(r, c, toPlay);
      if (!analysis.legal) return { ok: false, reason: analysis.reason };
      pushHistory();
      const played = toPlay;
      board = analysis.board;
      captures[played] += analysis.captured.length;
      seen.add(analysis.hash);
      lastMove = { r, c, color: played };
      moves.push({ r, c, color: played, captured: analysis.captured.length });
      consecutivePasses = 0;
      toPlay = played === "B" ? "W" : "B";
      return { ok: true, color: played, captured: analysis.captured, liberties: analysis.liberties };
    },
    pass() {
      if (consecutivePasses >= 2) return { ok: false, reason: "ended" };
      pushHistory();
      const played = toPlay;
      moves.push({ pass: true, color: played, captured: 0 });
      lastMove = null;
      consecutivePasses += 1;
      toPlay = played === "B" ? "W" : "B";
      return { ok: true, color: played, ended: consecutivePasses >= 2 };
    },
    undo() {
      const previous = history.pop();
      if (!previous) return false;
      restore(previous);
      return true;
    },
    clone() {
      const copy = createGame(size);
      copy.restore(snapshot());
      return copy;
    },
    restore,
  };
}

export function createPosition(spec) {
  const parsed = spec.picture ? stonesFromPicture(spec.picture) : { size: spec.size, stones: spec.stones || [] };
  const game = createGame(parsed.size);
  game.load(parsed.stones, spec.toPlay || "B");
  return game;
}

export function starsFor(size) {
  if (size === 9) return [[2, 2], [2, 6], [4, 4], [6, 2], [6, 6]];
  if (size === 13) {
    const lines = [3, 6, 9];
    return lines.flatMap((r) => lines.map((c) => [r, c]));
  }
  if (size === 19) {
    const lines = [3, 9, 15];
    return lines.flatMap((r) => lines.map((c) => [r, c]));
  }
  return [];
}

export function coordName(r, c, size) {
  const letters = "ABCDEFGHJKLMNOPQRST";
  return `${letters[c]}${size - r}`;
}

function empty(size) {
  return Array.from({ length: size }, () => Array(size).fill(null));
}

function clone(cells) {
  return cells.map((row) => row.slice());
}

function hashOf(cells) {
  let text = "";
  for (const row of cells) {
    for (const value of row) text += value || ".";
  }
  return text;
}

function key(r, c) {
  return `${r},${c}`;
}
