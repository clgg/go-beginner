import { createGame, createPosition } from "./engine.js";
import { tutorials, drills, puzzles } from "./content.js";

const failures = [];

function fail(message) {
  failures.push(message);
}

function assertHealthy(game, label) {
  const seen = new Set();
  for (let r = 0; r < game.size; r += 1) {
    for (let c = 0; c < game.size; c += 1) {
      if (!game.cell(r, c) || seen.has(`${r},${c}`)) continue;
      const group = game.groupAt(r, c);
      for (const [y, x] of group.stones) seen.add(`${y},${x}`);
      if (group.liberties.length === 0) fail(`${label} has a group with no liberties at ${r},${c}`);
    }
  }
}

function goalMet(puzzle, game, startWhite) {
  if (puzzle.goal === "clear-white") return game.count("W") === 0;
  if (puzzle.goal === "took-ko") {
    return game.captures.B === 1 && game.cell(puzzle.target[0], puzzle.target[1]) == null;
  }
  if (puzzle.goal === "atari") {
    if (game.count("W") !== startWhite) return false;
    let min = Infinity;
    const seen = new Set();
    for (let r = 0; r < game.size; r += 1) {
      for (let c = 0; c < game.size; c += 1) {
        if (game.cell(r, c) !== "W" || seen.has(`${r},${c}`)) continue;
        const group = game.groupAt(r, c);
        for (const [y, x] of group.stones) seen.add(`${y},${x}`);
        min = Math.min(min, group.liberties.length);
      }
    }
    return min === 1;
  }
  if (puzzle.goal === "two-eyes") {
    let origin = null;
    let blacks = 0;
    for (let r = 0; r < game.size; r += 1) {
      for (let c = 0; c < game.size; c += 1) {
        if (game.cell(r, c) === "B") {
          blacks += 1;
          origin ??= [r, c];
        }
      }
    }
    if (!origin) return false;
    const group = game.groupAt(origin[0], origin[1]);
    return group.stones.length === blacks && game.solidEyes(origin[0], origin[1]).length >= 2;
  }
  fail(`${puzzle.id} has no goal`);
  return false;
}

function applyKey(game, key) {
  if (key === "pass") return game.pass();
  const [r, c] = key.split(",").map(Number);
  return game.play(r, c);
}

function applyReply(game, reply) {
  if (!reply) return { ok: true };
  if (reply === "pass") return game.pass();
  return game.play(reply[0], reply[1]);
}

function walk(puzzle, game, node, startWhite, path) {
  const moves = node.moves || {};
  const keys = Object.keys(moves);
  if (keys.length === 0) {
    if (!node.done) fail(`${puzzle.id} ${path} ends without success`);
    else if (!goalMet(puzzle, game, startWhite)) fail(`${puzzle.id} ${path} does not meet ${puzzle.goal}`);
    return;
  }
  if (node.done) fail(`${puzzle.id} ${path} is done but has more moves`);
  for (const key of keys) {
    const child = moves[key];
    const copy = game.clone();
    const played = applyKey(copy, key);
    if (!played.ok) {
      fail(`${puzzle.id} ${path}/${key} illegal: ${played.reason}`);
      continue;
    }
    const replied = applyReply(copy, child.reply);
    if (!replied.ok) {
      fail(`${puzzle.id} ${path}/${key} reply illegal: ${replied.reason}`);
      continue;
    }
    if (child.moves && goalMet(puzzle, copy, startWhite)) {
      fail(`${puzzle.id} ${path}/${key} finishes before the last move`);
    }
    walk(puzzle, copy, child, startWhite, `${path}/${key}`);
  }
}

function rootKeys(puzzle) {
  return new Set(Object.keys(puzzle.tree?.moves || {}));
}

for (const tutorial of tutorials) {
  try {
    assertHealthy(createPosition(tutorial.position), tutorial.id);
  } catch (error) {
    fail(`${tutorial.id} ${error.message}`);
  }
}

for (const drill of drills) {
  try {
    const game = createPosition(drill);
    assertHealthy(game, drill.id);
    const group = game.groupAt(drill.focus[0], drill.focus[1]);
    if (!group) fail(`${drill.id} focus is empty`);
    else if (group.liberties.length !== drill.liberties) {
      fail(`${drill.id} liberties ${group.liberties.length} !== ${drill.liberties}`);
    }
  } catch (error) {
    fail(`${drill.id} ${error.message}`);
  }
}

const ids = new Set();
for (const puzzle of puzzles) {
  if (ids.has(puzzle.id)) fail(`duplicate ${puzzle.id}`);
  ids.add(puzzle.id);
  try {
    const game = createPosition(puzzle);
    assertHealthy(game, puzzle.id);
    if (puzzle.kind === "judge") {
      const eyes = countEyes(game);
      if (eyes !== puzzle.expectEyes) fail(`${puzzle.id} eyes ${eyes} !== ${puzzle.expectEyes}`);
      const correct = puzzle.choices.filter((choice) => choice.correct);
      if (correct.length !== 1) fail(`${puzzle.id} needs one correct choice`);
      continue;
    }
    const startWhite = game.count("W");
    walk(puzzle, game, puzzle.tree, startWhite, puzzle.id);
    for (let r = 0; r < game.size; r += 1) {
      for (let c = 0; c < game.size; c += 1) {
        const key = `${r},${c}`;
        if (rootKeys(puzzle).has(key)) continue;
        const copy = game.clone();
        const played = copy.play(r, c);
        if (played.ok && goalMet(puzzle, copy, startWhite)) fail(`${puzzle.id} alternative ${key} also solves`);
      }
    }
  } catch (error) {
    fail(`${puzzle.id} ${error.message}`);
  }
}

function countEyes(game) {
  for (let r = 0; r < game.size; r += 1) {
    for (let c = 0; c < game.size; c += 1) {
      if (game.cell(r, c) === "B") return game.solidEyes(r, c).length;
    }
  }
  return 0;
}

const ko = createPosition(puzzles.find((puzzle) => puzzle.id === "ko"));
if (!ko.play(2, 2).ok) fail("ko capture failed");
const recapture = ko.play(1, 2);
if (recapture.ok || recapture.reason !== "ko") fail(`immediate recapture should be ko, got ${recapture.reason}`);
const afterTenuki = createPosition(puzzles.find((puzzle) => puzzle.id === "ko"));
afterTenuki.play(2, 2);
if (!afterTenuki.play(4, 4).ok) fail("ko tenuki failed");
if (!afterTenuki.pass().ok) fail("ko pass failed");
if (!afterTenuki.play(1, 2).ok) fail("ko recapture after tenuki should be legal");

const suicide = createGame(3);
suicide.load([
  ["W", 0, 1],
  ["W", 1, 0],
  ["W", 1, 2],
  ["W", 2, 1],
], "B");
const blocked = suicide.play(1, 1);
if (blocked.ok || blocked.reason !== "suicide") fail(`expected suicide, got ${blocked.reason}`);

const center = createGame(5);
const middle = center.play(2, 2);
if (!middle.ok || middle.liberties.length !== 4) fail("center stone should have 4 liberties");

if (failures.length) {
  console.error(failures.join("\n"));
  process.exit(1);
}
console.log(`ok ${tutorials.length} lessons, ${drills.length} drills, ${puzzles.length} puzzles`);
