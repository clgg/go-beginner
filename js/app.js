import { coordName, createGame, createPosition } from "./engine.js";
import { drills, puzzles, tutorials } from "./content.js";
import { createBoardView } from "./board.js";

const app = document.querySelector("#app");
const boot = document.querySelector("#boot");
const tabs = document.querySelector(".tabs");
const solvedKey = "go-beginner-solved";

let playGame = createGame(9);
let playShowLib = true;
let playLabels = true;
let playHover = null;
let playFlash = "";

let tutorialKey = null;
let tutorialGame = null;
let tutorialShowLib = true;
let tutorialHover = null;
let tutorialFlash = "";

let drillIndex = 0;
let drillPicked = null;
let drillHover = null;

let puzzleId = puzzles[0].id;
let puzzleRun = null;
let puzzleHover = null;

let boardView = null;
const solved = new Set(loadSolved());

const reasons = {
  occupied: "这里已经有棋子了。",
  suicide: "这里没有气，又提不掉对方，不能下。",
  ko: "这一手会让局面回到以前出现过的样子，不能下。这就是劫，不能马上回提。",
  ended: "双方已经连续停着，这盘先停在这里。可以悔棋，或清空再来。",
  bounds: "这个位置超出棋盘了。",
};

tabs.addEventListener("click", (event) => {
  const view = event.target.closest("button")?.dataset.view;
  if (!view) return;
  const next = view === "tutorial" ? `#tutorial/${tutorials[0].id}` : `#${view}`;
  if (location.hash === next) render();
  else location.hash = next;
});

window.addEventListener("hashchange", render);
render();

function resetBoard() {
  boardView?.destroy();
  boardView = null;
}

function render() {
  boot.hidden = true;
  resetBoard();
  const [view, id] = (location.hash.replace("#", "") || "tutorial/board").split("/");
  for (const button of tabs.querySelectorAll("button")) {
    if (button.dataset.view === view) button.setAttribute("aria-current", "page");
    else button.removeAttribute("aria-current");
  }
  if (view === "play") renderPlay();
  else if (view === "liberty") renderDrill();
  else if (view === "life") renderPuzzle(id);
  else renderTutorial(id);
}

function renderTutorial(id) {
  resetBoard();
  const tutorial = tutorials.find((item) => item.id === id) || tutorials[0];
  if (tutorialKey !== tutorial.id) {
    tutorialKey = tutorial.id;
    tutorialGame = createPosition(tutorial.position);
    tutorialShowLib = true;
    tutorialHover = null;
    tutorialFlash = "";
  }
  const index = tutorials.findIndex((item) => item.id === tutorial.id);
  app.innerHTML = `
    <section class="layout">
      <article class="panel">
        <p class="kicker">${tutorial.kicker}</p>
        <h2>${tutorial.title}</h2>
        ${tutorial.body.map((paragraph) => `<p>${paragraph}</p>`).join("")}
        <p class="status" id="status"></p>
        <div class="actions">
          <button class="text-button" type="button" id="undo">收回一手</button>
          <button class="text-button" type="button" id="reset">恢复例图</button>
          <label class="check"><input id="libs" type="checkbox"> 显示气</label>
        </div>
        <div class="actions">
          <button class="text-button" type="button" id="prev" ${index === 0 ? "disabled" : ""}>上一课</button>
          <button class="text-button" type="button" id="next" ${index === tutorials.length - 1 ? "disabled" : ""}>下一课</button>
        </div>
      </article>
      <div class="board-column">
        <div class="board-frame"><div class="board-stage" id="stage"></div></div>
        <p class="moves" id="note"></p>
      </div>
    </section>`;
  document.querySelector("#libs").checked = tutorialShowLib;
  document.querySelector("#libs").onchange = (event) => {
    tutorialShowLib = event.target.checked;
    syncTutorial(tutorial);
  };
  document.querySelector("#undo").onclick = () => {
    tutorialGame.undo();
    tutorialFlash = "已收回一手。";
    syncTutorial(tutorial);
  };
  document.querySelector("#reset").onclick = () => {
    tutorialGame = createPosition(tutorial.position);
    tutorialFlash = "";
    syncTutorial(tutorial);
  };
  document.querySelector("#prev").onclick = () => {
    if (index > 0) location.hash = `#tutorial/${tutorials[index - 1].id}`;
  };
  document.querySelector("#next").onclick = () => {
    if (index < tutorials.length - 1) location.hash = `#tutorial/${tutorials[index + 1].id}`;
  };
  mount(document.querySelector("#stage"), {
    hover: (r, c) => {
      tutorialHover = r == null ? null : [r, c];
      tutorialFlash = "";
      syncTutorial(tutorial);
    },
    play: (r, c) => {
      const result = tutorialGame.play(r, c);
      tutorialFlash = result.ok ? captureText(result) : reasons[result.reason];
      syncTutorial(tutorial);
    },
  });
  syncTutorial(tutorial);
}

function syncTutorial(tutorial) {
  const reading = describe(tutorialGame, tutorialHover, tutorialShowLib);
  const status = document.querySelector("#status");
  status.className = "status";
  status.textContent = tutorialFlash || reading.text || tutorial.note;
  document.querySelector("#note").textContent = tutorial.note;
  paint(tutorialGame, {
    hover: tutorialHover,
    showLib: tutorialShowLib,
    liberties: reading.points,
    labels: true,
  });
}

function renderPlay() {
  resetBoard();
  app.innerHTML = `
    <section class="layout">
      <article class="panel">
        <p class="kicker">沙盘</p>
        <h2>自由摆子</h2>
        <p>规则已经打开：没气会提子，不能自杀，也不能下出让局面重复的劫。</p>
        <div class="stats">
          <div><span>轮到</span><strong id="turn"></strong></div>
          <div><span>黑提子</span><strong id="cap-b"></strong></div>
          <div><span>白提子</span><strong id="cap-w"></strong></div>
        </div>
        <p class="status" id="status"></p>
        <div class="actions">
          <button class="text-button" type="button" id="pass">停着</button>
          <button class="text-button" type="button" id="undo">悔棋</button>
          <button class="text-button" type="button" id="clear">清空</button>
        </div>
        <div class="actions">
          <label class="check">路数
            <select id="size">
              <option value="9">9 路</option>
              <option value="13">13 路</option>
              <option value="19">19 路</option>
            </select>
          </label>
          <label class="check"><input id="libs" type="checkbox"> 显示气</label>
          <label class="check"><input id="labels" type="checkbox"> 坐标</label>
        </div>
        <p class="moves" id="record"></p>
      </article>
      <div class="board-column">
        <div class="board-frame"><div class="board-stage" id="stage"></div></div>
      </div>
    </section>`;
  const size = document.querySelector("#size");
  size.value = String(playGame.size);
  document.querySelector("#libs").checked = playShowLib;
  document.querySelector("#labels").checked = playLabels;
  size.onchange = () => {
    playGame = createGame(Number(size.value));
    playFlash = `已换成 ${playGame.size} 路棋盘。`;
    playHover = null;
    syncPlay();
  };
  document.querySelector("#libs").onchange = (event) => {
    playShowLib = event.target.checked;
    syncPlay();
  };
  document.querySelector("#labels").onchange = (event) => {
    playLabels = event.target.checked;
    syncPlay();
  };
  document.querySelector("#pass").onclick = () => {
    const result = playGame.pass();
    playFlash = result.ok ? (result.ended ? "双方连续停着，这盘可以先停下来。这里不数胜负。" : `${colorName(result.color)}停着。`) : reasons[result.reason];
    syncPlay();
  };
  document.querySelector("#undo").onclick = () => {
    playFlash = playGame.undo() ? "已悔回一手。" : "还没有可以悔的棋。";
    syncPlay();
  };
  document.querySelector("#clear").onclick = () => {
    playGame = createGame(playGame.size);
    playFlash = "棋盘已清空。";
    playHover = null;
    syncPlay();
  };
  mount(document.querySelector("#stage"), {
    hover: (r, c) => {
      playHover = r == null ? null : [r, c];
      if (r != null) playFlash = "";
      syncPlay();
    },
    play: (r, c) => {
      const result = playGame.play(r, c);
      playFlash = result.ok
        ? `${colorName(result.color)}下在 ${coordName(r, c, playGame.size)}，这一块有 ${result.liberties.length} 气。${captureText(result)}`
        : reasons[result.reason];
      syncPlay();
    },
  });
  syncPlay();
}

function syncPlay() {
  const reading = describe(playGame, playHover, playShowLib);
  const status = document.querySelector("#status");
  status.className = `status${playGame.ended ? " good" : ""}`;
  status.textContent = playFlash || reading.text;
  document.querySelector("#turn").textContent = playGame.ended ? "结束" : colorName(playGame.toPlay);
  document.querySelector("#cap-b").textContent = String(playGame.captures.B);
  document.querySelector("#cap-w").textContent = String(playGame.captures.W);
  document.querySelector("#record").textContent = recordText(playGame);
  paint(playGame, {
    hover: playHover,
    showLib: playShowLib,
    liberties: reading.points,
    labels: playLabels,
  });
}

function renderDrill() {
  resetBoard();
  const drill = drills[drillIndex];
  app.innerHTML = `
    <section class="layout">
      <article class="panel">
        <p class="kicker">数气 ${drillIndex + 1} / ${drills.length}</p>
        <h2>${drill.title}</h2>
        <p>金圈标出的是同一块棋。先数它有几气，斜角不算，相连的子要一起数。</p>
        <div class="numbers" id="numbers">
          ${[1, 2, 3, 4, 5, 6, 7, 8].map((count) => `<button type="button" data-count="${count}">${count}</button>`).join("")}
        </div>
        <p class="status" id="status"></p>
        <div class="actions">
          <button class="text-button" type="button" id="prev">上一题</button>
          <button class="text-button" type="button" id="next">下一题</button>
        </div>
      </article>
      <div class="board-column">
        <div class="board-frame"><div class="board-stage" id="stage"></div></div>
      </div>
    </section>`;
  document.querySelector("#numbers").onclick = (event) => {
    const count = Number(event.target.dataset.count);
    if (!count) return;
    drillPicked = count;
    syncDrill();
  };
  document.querySelector("#prev").onclick = () => {
    drillIndex = (drillIndex + drills.length - 1) % drills.length;
    drillPicked = null;
    renderDrill();
  };
  document.querySelector("#next").onclick = () => {
    drillIndex = (drillIndex + 1) % drills.length;
    drillPicked = null;
    renderDrill();
  };
  mount(document.querySelector("#stage"), {
    hover: (r, c) => {
      drillHover = r == null ? null : [r, c];
      syncDrill();
    },
    play: () => {},
  });
  syncDrill();
}

function syncDrill() {
  const drill = drills[drillIndex];
  const game = createPosition(drill);
  const group = game.groupAt(drill.focus[0], drill.focus[1]);
  const revealed = drillPicked != null;
  const correct = drillPicked === drill.liberties;
  const status = document.querySelector("#status");
  status.className = `status${revealed ? (correct ? " good" : " bad") : ""}`;
  status.textContent = !revealed
    ? "这一块有几气？"
    : correct
      ? drill.explain
      : `是 ${drill.liberties} 气。${drill.explain}`;
  for (const button of document.querySelectorAll("#numbers button")) {
    button.className = revealed && Number(button.dataset.count) === drill.liberties ? "right" : "";
  }
  const hoverGroup = drillHover && game.cell(drillHover[0], drillHover[1]) ? game.groupAt(drillHover[0], drillHover[1]) : null;
  paint(game, {
    hover: null,
    showLib: revealed,
    liberties: revealed ? (hoverGroup || group).liberties : [],
    focus: group.stones,
    labels: game.size >= 9,
  });
}

function renderPuzzle(id) {
  resetBoard();
  if (puzzles.some((puzzle) => puzzle.id === id)) puzzleId = id;
  if (!puzzleRun || puzzleRun.id !== puzzleId) startPuzzle(puzzleId);
  const puzzle = puzzleRun.puzzle;
  app.innerHTML = `
    <section class="layout">
      <article class="panel">
        <p class="kicker">${puzzle.level} · 已解开 ${solved.size} / ${puzzles.length}</p>
        <h2>${puzzle.title}</h2>
        <p>${puzzle.task}</p>
        <p class="status" id="status"></p>
        <div class="choices" id="choices"></div>
        <div class="actions">
          <button class="text-button" type="button" id="hint">提示</button>
          <button class="text-button" type="button" id="libs">看气</button>
          <button class="text-button" type="button" id="restart">重来</button>
        </div>
        <ol class="puzzle-list" id="list"></ol>
        <div class="actions">
          <button class="text-button" type="button" id="forget">清除做题记录</button>
        </div>
      </article>
      <div class="board-column">
        <div class="board-frame"><div class="board-stage" id="stage"></div></div>
      </div>
    </section>`;
  const list = document.querySelector("#list");
  for (const item of puzzles) {
    const entry = document.createElement("li");
    const button = document.createElement("button");
    button.type = "button";
    button.dataset.id = item.id;
    button.innerHTML = `<span>${item.title}</span><span>${item.level}</span>`;
    button.onclick = () => {
      location.hash = `#life/${item.id}`;
    };
    entry.append(button);
    list.append(entry);
  }
  const choices = document.querySelector("#choices");
  if (puzzle.kind === "judge") {
    for (const choice of puzzle.choices) {
      const button = document.createElement("button");
      button.type = "button";
      button.className = "choice";
      button.textContent = choice.text;
      button.onclick = () => answerJudge(choice);
      choices.append(button);
    }
  }
  document.querySelector("#hint").onclick = () => {
    puzzleRun.hint = true;
    puzzleRun.message = puzzle.kind === "judge" ? "先看空点是连在一起，还是分成了两只眼。" : "金色的点是可以考虑的下一手。";
    syncPuzzle();
  };
  document.querySelector("#libs").onclick = () => {
    puzzleRun.showLib = !puzzleRun.showLib;
    syncPuzzle();
  };
  document.querySelector("#restart").onclick = () => {
    startPuzzle(puzzle.id);
    syncPuzzle();
  };
  document.querySelector("#forget").onclick = () => {
    solved.clear();
    try { localStorage.removeItem(solvedKey); } catch { /* ignore */ }
    puzzleRun.message = "做题记录已清除。";
    syncPuzzle();
  };
  mount(document.querySelector("#stage"), {
    hover: (r, c) => {
      puzzleHover = r == null ? null : [r, c];
      syncPuzzle();
    },
    play: (r, c) => playPuzzle(r, c),
  });
  syncPuzzle();
}

function startPuzzle(id) {
  const puzzle = puzzles.find((item) => item.id === id);
  puzzleRun = {
    id,
    puzzle,
    game: createPosition(puzzle),
    node: puzzle.tree || null,
    locked: false,
    message: puzzle.task,
    tone: "",
    showLib: false,
    hint: false,
    judged: null,
  };
  puzzleHover = null;
}

function playPuzzle(r, c) {
  const run = puzzleRun;
  if (run.puzzle.kind !== "play" || run.locked) return;
  const key = `${r},${c}`;
  const child = run.node?.moves?.[key];
  const result = run.game.play(r, c);
  if (!result.ok) {
    run.message = reasons[result.reason];
    run.tone = "bad";
    syncPuzzle();
    return;
  }
  if (!child) {
    run.game.undo();
    run.message = "这一手解不开。可以看看气，或点提示。";
    run.tone = "bad";
    syncPuzzle();
    return;
  }
  if (child.reply) {
    const reply = child.reply === "pass" ? run.game.pass() : run.game.play(child.reply[0], child.reply[1]);
    if (!reply.ok) {
      run.message = "这题的应手没有下出去，请重来。";
      run.tone = "bad";
      syncPuzzle();
      return;
    }
  }
  run.node = child;
  run.hint = false;
  if (child.done) {
    run.locked = true;
    run.message = child.success;
    run.tone = "good";
    markSolved(run.id);
  } else {
    run.message = child.note || "继续。";
    run.tone = "";
  }
  syncPuzzle();
}

function answerJudge(choice) {
  const run = puzzleRun;
  run.judged = choice;
  run.message = choice.explain;
  run.tone = choice.correct ? "good" : "bad";
  run.showLib = true;
  if (choice.correct) {
    run.locked = true;
    markSolved(run.id);
  }
  syncPuzzle();
}

function syncPuzzle() {
  const run = puzzleRun;
  const status = document.querySelector("#status");
  status.className = `status${run.tone ? ` ${run.tone}` : ""}`;
  status.textContent = run.message;
  document.querySelector(".kicker").textContent = `${run.puzzle.level} · 已解开 ${solved.size} / ${puzzles.length}`;
  for (const button of document.querySelectorAll(".puzzle-list button")) {
    if (button.dataset.id === run.id) button.setAttribute("aria-current", "true");
    else button.removeAttribute("aria-current");
    button.classList.toggle("solved", solved.has(button.dataset.id));
  }
  for (const button of document.querySelectorAll(".choice")) {
    const choice = run.puzzle.choices?.find((item) => item.text === button.textContent);
    button.classList.toggle("right", Boolean(run.judged && choice?.correct));
    button.classList.toggle("wrong", Boolean(run.judged && choice === run.judged && !choice.correct));
    button.disabled = Boolean(run.judged?.correct);
  }
  const reading = describe(run.game, puzzleHover, run.showLib);
  const hints = run.hint && run.node?.moves
    ? Object.keys(run.node.moves).filter((key) => key !== "pass").map((key) => key.split(",").map(Number))
    : [];
  const eyes = run.locked ? eyesOf(run.game) : [];
  paint(run.game, {
    hover: run.locked ? null : puzzleHover,
    showLib: run.showLib,
    liberties: run.showLib ? reading.points : [],
    hints,
    eyes,
    labels: run.game.size >= 9,
  });
}

function mount(stage, handlers) {
  boardView = createBoardView(stage, handlers);
}

function paint(game, options) {
  const ghost = ghostAt(game, options.hover);
  boardView.setState({
    size: game.size,
    board: game.cells(),
    lastMove: game.lastMove,
    labels: options.labels,
    liberties: options.showLib ? options.liberties : [],
    hints: options.hints || [],
    eyes: options.eyes || [],
    focus: options.focus || [],
    ghost,
  });
}

function ghostAt(game, hover) {
  if (!hover || game.cell(hover[0], hover[1]) || game.ended) return null;
  const analysis = game.inspect(hover[0], hover[1]);
  return { r: hover[0], c: hover[1], color: game.toPlay, legal: analysis.legal };
}

function describe(game, hover, showLib) {
  if (game.ended) return { text: "双方连续停着。可以悔棋继续，或清空重来。", points: [] };
  if (hover && game.cell(hover[0], hover[1])) {
    const group = game.groupAt(hover[0], hover[1]);
    return {
      text: `${colorName(group.color)}这一块有 ${group.liberties.length} 气。`,
      points: showLib ? group.liberties : [],
    };
  }
  if (hover) {
    const analysis = game.inspect(hover[0], hover[1]);
    if (!analysis.legal) return { text: reasons[analysis.reason], points: [] };
    return {
      text: `下在这里，这一块会有 ${analysis.liberties.length} 气。`,
      points: showLib ? analysis.liberties : [],
    };
  }
  if (game.lastMove) {
    const group = game.groupAt(game.lastMove.r, game.lastMove.c);
    if (group) {
      return {
        text: `上一手这块棋现在有 ${group.liberties.length} 气。`,
        points: showLib ? group.liberties : [],
      };
    }
  }
  return { text: `轮到${colorName(game.toPlay)}。把鼠标放在棋子或空点上，可以看气。`, points: [] };
}

function eyesOf(game) {
  for (let r = 0; r < game.size; r += 1) {
    for (let c = 0; c < game.size; c += 1) {
      if (game.cell(r, c) === "B") return game.solidEyes(r, c);
    }
  }
  return [];
}

function captureText(result) {
  if (!result.captured?.length) return "";
  return `${colorName(result.color)}提掉了 ${result.captured.length} 子。`;
}

function recordText(game) {
  const moves = game.moves;
  if (!moves.length) return "还没有落子。";
  return moves.slice(-12).map((move, index) => {
    const number = moves.length - moves.slice(-12).length + index + 1;
    const at = move.pass ? "停着" : coordName(move.r, move.c, game.size);
    return `${number}. ${colorName(move.color)}${at}`;
  }).join("  ");
}

function colorName(color) {
  return color === "B" ? "黑棋" : "白棋";
}

function markSolved(id) {
  solved.add(id);
  try {
    localStorage.setItem(solvedKey, JSON.stringify([...solved]));
  } catch {
    /* private mode can block storage */
  }
}

function loadSolved() {
  try {
    const saved = JSON.parse(localStorage.getItem(solvedKey) || "[]");
    return Array.isArray(saved) ? saved : [];
  } catch {
    return [];
  }
}
