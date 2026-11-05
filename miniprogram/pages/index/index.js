const { createGame, createPosition, coordName } = require("../../utils/engine.js");
const { tutorials, drills, puzzles } = require("../../utils/content.js");
const draw = require("../../utils/draw.js");
const sound = require("../../utils/sound.js");

const solvedKey = "go-beginner-solved";
const reasons = {
  occupied: "这里已经有棋子了。",
  suicide: "这里没有气，又提不掉对方，不能下。",
  ko: "这一手会让局面回到以前出现过的样子，不能下。这就是劫，不能马上回提。",
  ended: "双方已经连续停着，这盘先停在这里。可以悔棋，或清空再来。",
  bounds: "这个位置超出棋盘了。",
};
const sizeSpeech = { 9: "已换成九路棋盘。", 13: "已换成十三路棋盘。", 19: "已换成十九路棋盘。" };

function colorName(color) {
  return color === "B" ? "黑棋" : "白棋";
}

function loadSolved() {
  const saved = wx.getStorageSync(solvedKey);
  return Array.isArray(saved) ? saved : [];
}

Page({
  data: {
    view: "tutorial",
    soundOn: true,
    boardPx: 320,
    panelMax: 280,
    turnClass: "black",
    turnLabel: "轮到黑棋下子",
    kicker: "",
    title: "",
    paragraphs: [],
    status: "",
    statusClass: "",
    note: "",
    showLib: true,
    showLabels: true,
    size: 9,
    turnName: "黑棋",
    capB: 0,
    capW: 0,
    record: "还没有落子。",
    numbers: [1, 2, 3, 4, 5, 6, 7, 8],
    picked: null,
    rightCount: null,
    drillProgress: "",
    puzzleList: [],
    choices: [],
    isJudge: false,
    canForget: true,
  },

  onLoad() {
    this.playGame = createGame(9);
    this.playShowLib = true;
    this.playLabels = true;
    this.playFlash = "";
    this.tutorialId = tutorials[0].id;
    this.tutorialGame = createPosition(tutorials[0].position);
    this.tutorialShowLib = true;
    this.tutorialFlash = "";
    this.drillIndex = 0;
    this.drillPicked = null;
    this.puzzleId = puzzles[0].id;
    this.solved = new Set(loadSolved());
    this.startPuzzle(this.puzzleId);
    this.setData({ soundOn: sound.isOn() });
    wx.onWindowResize(() => this.layout(() => this.paint()));
  },

  onReady() {
    this.layout(() => this.sync());
  },

  onResize() {
    this.layout(() => this.paint());
  },

  layout(done) {
    const info = wx.getWindowInfo();
    const width = info.windowWidth;
    const rpx = width / 750;
    const safe = info.safeArea ? Math.max(0, info.screenHeight - info.safeArea.bottom) : 0;
    const status = Math.ceil(88 * rpx);
    const dock = Math.ceil(168 * rpx);
    const tab = Math.ceil(108 * rpx) + safe;
    const room = Math.max(280, info.windowHeight - status - dock - tab);
    const boardPx = Math.floor(Math.min(width - Math.ceil(56 * rpx), room - Math.ceil(168 * rpx), 680));
    const panelMax = Math.max(Math.ceil(120 * rpx), room - boardPx);
    this.setData({ boardPx, panelMax }, () => this.bindCanvas(done));
  },

  bindCanvas(done) {
    wx.createSelectorQuery().in(this).select("#board").fields({ node: true, size: true }).exec((res) => {
      if (res && res[0] && res[0].node) this.canvas = res[0].node;
      if (done) done();
    });
  },

  paint() {
    if (!this.canvas || !this.boardState) return;
    draw.paint(this.canvas, this.data.boardPx, this.boardState);
  },

  switchView(event) {
    const view = event.currentTarget.dataset.view;
    if (!view || view === this.data.view) return;
    sound.stop();
    this.setData({ view }, () => this.sync());
  },

  toggleSound() {
    const next = !sound.isOn();
    sound.setOn(next);
    this.setData({ soundOn: next });
    if (next) sound.playTone("place");
  },

  onBoard(event) {
    const touch = event.changedTouches && event.changedTouches[0];
    if (!touch || !this.boardState) return;
    wx.createSelectorQuery().in(this).select("#board").boundingClientRect((rect) => {
      if (!rect) return;
      let x = touch.x;
      let y = touch.y;
      if (x == null || y == null || x > rect.width + 1 || y > rect.height + 1) {
        x = touch.clientX - rect.left;
        y = touch.clientY - rect.top;
      }
      const cell = draw.hit(x, y, this.boardState.size, this.data.boardPx, this.boardState.labels);
      if (!cell) return;
      this.playAt(cell[0], cell[1]);
    }).exec();
  },

  playAt(r, c) {
    if (this.data.view === "tutorial") this.playTutorial(r, c);
    else if (this.data.view === "play") this.playFree(r, c);
    else if (this.data.view === "life") this.playPuzzle(r, c);
  },

  sync() {
    if (this.data.view === "tutorial") this.syncTutorial();
    else if (this.data.view === "play") this.syncPlay();
    else if (this.data.view === "liberty") this.syncDrill();
    else this.syncPuzzle();
  },

  syncTutorial() {
    const tutorial = tutorials.find((item) => item.id === this.tutorialId) || tutorials[0];
    const reading = describe(this.tutorialGame, this.tutorialShowLib);
    this.showTurn(this.tutorialGame);
    this.boardState = boardOf(this.tutorialGame, {
      showLib: this.tutorialShowLib,
      liberties: reading.points,
      labels: true,
    });
    this.setData({
      kicker: tutorial.kicker,
      title: tutorial.title,
      paragraphs: tutorial.body,
      status: this.tutorialFlash || reading.text || tutorial.note,
      statusClass: "",
      note: tutorial.note,
      showLib: this.tutorialShowLib,
    }, () => this.paint());
  },

  playTutorial(r, c) {
    const result = this.tutorialGame.play(r, c);
    this.tutorialFlash = result.ok ? moveSentence(result, r, c, this.tutorialGame.size) : reasons[result.reason];
    voicePlace(result, r, c, this.tutorialGame.size);
    this.syncTutorial();
  },

  undoTutorial() {
    this.tutorialGame.undo();
    this.tutorialFlash = "已收回一手。";
    sound.speak(this.tutorialFlash);
    this.syncTutorial();
  },

  resetTutorial() {
    const tutorial = tutorials.find((item) => item.id === this.tutorialId) || tutorials[0];
    this.tutorialGame = createPosition(tutorial.position);
    this.tutorialFlash = "已恢复例图。";
    sound.speak(this.tutorialFlash);
    this.syncTutorial();
  },

  stepTutorial(event) {
    const dir = Number(event.currentTarget.dataset.dir);
    const index = tutorials.findIndex((item) => item.id === this.tutorialId);
    const next = tutorials[index + dir];
    if (!next) return;
    this.tutorialId = next.id;
    this.tutorialGame = createPosition(next.position);
    this.tutorialFlash = "";
    sound.speak(next.note);
    this.syncTutorial();
  },

  toggleTutorialLib() {
    this.tutorialShowLib = !this.tutorialShowLib;
    this.syncTutorial();
  },

  syncPlay() {
    const reading = describe(this.playGame, this.playShowLib);
    this.showTurn(this.playGame);
    this.boardState = boardOf(this.playGame, {
      showLib: this.playShowLib,
      liberties: reading.points,
      labels: this.playLabels,
    });
    this.setData({
      status: this.playFlash || reading.text,
      statusClass: this.playGame.ended ? "good" : "",
      turnName: this.playGame.ended ? "结束" : colorName(this.playGame.toPlay),
      capB: this.playGame.captures.B,
      capW: this.playGame.captures.W,
      record: recordText(this.playGame),
      showLib: this.playShowLib,
      showLabels: this.playLabels,
      size: this.playGame.size,
    }, () => this.paint());
  },

  playFree(r, c) {
    const result = this.playGame.play(r, c);
    this.playFlash = result.ok ? moveSentence(result, r, c, this.playGame.size) : reasons[result.reason];
    voicePlace(result, r, c, this.playGame.size);
    this.syncPlay();
  },

  pass() {
    const result = this.playGame.pass();
    this.playFlash = result.ok
      ? (result.ended ? "双方连续停着，这盘可以先停下来。这里不数胜负。" : `${colorName(result.color)}停着。`)
      : reasons[result.reason];
    if (result.ok && !result.ended) sound.playTone("pass");
    sound.speak(this.playFlash);
    this.syncPlay();
  },

  undoPlay() {
    this.playFlash = this.playGame.undo() ? "已悔回一手。" : "还没有可以悔的棋。";
    sound.speak(this.playFlash);
    this.syncPlay();
  },

  clearPlay() {
    this.playGame = createGame(this.playGame.size);
    this.playFlash = "棋盘已清空。";
    sound.speak(this.playFlash);
    this.syncPlay();
  },

  setSize(event) {
    const size = Number(event.currentTarget.dataset.size);
    if (size === this.playGame.size) return;
    this.playGame = createGame(size);
    this.playFlash = `已换成 ${size} 路棋盘。`;
    sound.speak(sizeSpeech[size]);
    this.syncPlay();
  },

  togglePlayLib() {
    this.playShowLib = !this.playShowLib;
    this.syncPlay();
  },

  toggleLabels() {
    this.playLabels = !this.playLabels;
    this.syncPlay();
  },

  syncDrill() {
    const drill = drills[this.drillIndex];
    const game = createPosition(drill);
    const group = game.groupAt(drill.focus[0], drill.focus[1]);
    const revealed = this.drillPicked != null;
    const correct = this.drillPicked === drill.liberties;
    this.setData({
      turnClass: "quiet",
      turnLabel: "数气，不用落子",
      kicker: `数气 ${this.drillIndex + 1} / ${drills.length}`,
      title: drill.title,
      status: !revealed ? "这一块有几气？" : (correct ? drill.explain : `是 ${drill.liberties} 气。${drill.explain}`),
      statusClass: revealed ? (correct ? "good" : "bad") : "",
      picked: this.drillPicked,
      rightCount: revealed ? drill.liberties : null,
      drillProgress: `${this.drillIndex + 1} / ${drills.length}`,
    });
    this.boardState = boardOf(game, {
      showLib: revealed,
      liberties: revealed ? group.liberties : [],
      focus: group.stones,
      labels: game.size >= 9,
    });
    this.paint();
  },

  pickCount(event) {
    const count = Number(event.currentTarget.dataset.count);
    const drill = drills[this.drillIndex];
    this.drillPicked = count;
    if (count === drill.liberties) {
      sound.playTone("ok");
      sound.speak(drill.explain);
    } else {
      sound.playTone("no");
      sound.speakFlexible([
        [`是${sound.zhCount(drill.liberties)}气。`, drill.explain],
        ["是", sound.zhCount(drill.liberties), "气。", drill.explain],
      ]);
    }
    this.syncDrill();
  },

  stepDrill(event) {
    const dir = Number(event.currentTarget.dataset.dir);
    this.drillIndex = (this.drillIndex + dir + drills.length) % drills.length;
    this.drillPicked = null;
    sound.speak("这一块有几气？");
    this.syncDrill();
  },

  startPuzzle(id) {
    const puzzle = puzzles.find((item) => item.id === id) || puzzles[0];
    this.puzzleId = puzzle.id;
    this.puzzleRun = {
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
  },

  syncPuzzle() {
    const run = this.puzzleRun;
    const puzzle = run.puzzle;
    const reading = describe(run.game, run.showLib);
    const hints = run.hint && run.node && run.node.moves
      ? Object.keys(run.node.moves).filter((key) => key !== "pass").map((key) => key.split(",").map(Number))
      : [];
    if (puzzle.kind === "judge") this.setTurnQuiet("看棋判断，不用落子");
    else if (run.locked) this.setTurnQuiet("这题已经解开");
    else this.showTurn(run.game);
    this.boardState = boardOf(run.game, {
      showLib: run.showLib,
      liberties: run.showLib ? reading.points : [],
      hints,
      eyes: run.locked ? eyesOf(run.game) : [],
      labels: run.game.size >= 9,
    });
    this.setData({
      kicker: `${puzzle.level} · 已解开 ${this.solved.size} / ${puzzles.length}`,
      title: puzzle.title,
      paragraphs: [puzzle.task],
      status: run.message,
      statusClass: run.tone || "",
      isJudge: puzzle.kind === "judge",
      choices: (puzzle.choices || []).map((choice, index) => ({
        index,
        text: choice.text,
        right: Boolean(run.judged && choice.correct),
        wrong: Boolean(run.judged && run.judged === choice && !choice.correct),
      })),
      puzzleList: puzzles.map((item) => ({
        id: item.id,
        title: item.title,
        level: item.level,
        current: item.id === puzzle.id,
        solved: this.solved.has(item.id),
      })),
      libOn: run.showLib,
      hintOn: run.hint,
    }, () => this.paint());
  },

  playPuzzle(r, c) {
    const run = this.puzzleRun;
    if (run.puzzle.kind !== "play" || run.locked) return;
    const child = run.node && run.node.moves ? run.node.moves[`${r},${c}`] : null;
    const result = run.game.play(r, c);
    if (!result.ok) {
      run.message = reasons[result.reason];
      run.tone = "bad";
      sound.playTone("forbid");
      sound.speak(run.message);
      this.syncPuzzle();
      return;
    }
    if (!child) {
      run.game.undo();
      run.message = "这一手解不开。可以看看气，或点提示。";
      run.tone = "bad";
      sound.playTone("no");
      sound.speak(run.message);
      this.syncPuzzle();
      return;
    }
    if (child.reply) {
      const reply = child.reply === "pass" ? run.game.pass() : run.game.play(child.reply[0], child.reply[1]);
      if (!reply.ok) {
        run.message = "这题的应手没有下出去，请重来。";
        run.tone = "bad";
        sound.playTone("forbid");
        sound.speak(run.message);
        this.syncPuzzle();
        return;
      }
    }
    run.node = child;
    run.hint = false;
    if (child.done) {
      run.locked = true;
      run.message = child.success;
      run.tone = "good";
      this.markSolved(run.puzzle.id);
      sound.playTone("ok");
    } else {
      run.message = child.note || "继续。";
      run.tone = "";
      sound.playTone(result.captured && result.captured.length ? "capture" : "place");
    }
    sound.speak(run.message);
    this.syncPuzzle();
  },

  answerJudge(event) {
    const run = this.puzzleRun;
    if (run.judged && run.judged.correct) return;
    const choice = run.puzzle.choices[Number(event.currentTarget.dataset.index)];
    run.judged = choice;
    run.message = choice.explain;
    run.tone = choice.correct ? "good" : "bad";
    run.showLib = true;
    if (choice.correct) {
      run.locked = true;
      this.markSolved(run.puzzle.id);
    }
    sound.playTone(choice.correct ? "ok" : "no");
    sound.speak(choice.explain);
    this.syncPuzzle();
  },

  openPuzzle(event) {
    const item = puzzles.find((puzzle) => puzzle.id === event.currentTarget.dataset.id);
    if (!item) return;
    sound.speak(item.task);
    this.startPuzzle(item.id);
    this.syncPuzzle();
  },

  hintPuzzle() {
    const run = this.puzzleRun;
    run.hint = true;
    run.message = run.puzzle.kind === "judge" ? "先看空点是连在一起，还是分成了两只眼。" : "金色的点是可以考虑的下一手。";
    sound.speak(run.message);
    this.syncPuzzle();
  },

  togglePuzzleLib() {
    this.puzzleRun.showLib = !this.puzzleRun.showLib;
    this.syncPuzzle();
  },

  restartPuzzle() {
    this.startPuzzle(this.puzzleRun.puzzle.id);
    this.syncPuzzle();
  },

  forgetSolved() {
    this.solved = new Set();
    wx.removeStorageSync(solvedKey);
    this.puzzleRun.message = "做题记录已清除。";
    sound.speak(this.puzzleRun.message);
    this.syncPuzzle();
  },

  markSolved(id) {
    this.solved.add(id);
    wx.setStorageSync(solvedKey, [...this.solved]);
  },

  showTurn(game) {
    if (game.ended) {
      this.setTurnQuiet("对局结束");
      return;
    }
    const black = game.toPlay === "B";
    this.setData({
      turnClass: black ? "black" : "white",
      turnLabel: black ? "轮到黑棋下子" : "轮到白棋下子",
    });
  },

  setTurnQuiet(text) {
    this.setData({ turnClass: "quiet", turnLabel: text });
  },
});

function moveSentence(result, r, c, size) {
  const captured = result.captured && result.captured.length ? `${colorName(result.color)}提掉了 ${result.captured.length} 子。` : "";
  return `${colorName(result.color)}下在 ${coordName(r, c, size)}，这一块有 ${result.liberties.length} 气。${captured}`;
}

function voicePlace(result, r, c, size) {
  if (!result.ok) {
    sound.playTone("forbid");
    sound.speak(reasons[result.reason]);
    return;
  }
  sound.playTone(result.captured && result.captured.length ? "capture" : "place");
  sound.speakMove({
    color: result.color,
    coord: coordName(r, c, size),
    liberties: result.liberties.length,
    captured: result.captured ? result.captured.length : 0,
  });
}

function describe(game, showLib) {
  if (game.ended) return { text: "双方连续停着。可以悔棋继续，或清空重来。", points: [] };
  if (game.lastMove) {
    const group = game.groupAt(game.lastMove.r, game.lastMove.c);
    if (group) {
      return {
        text: `上一手这块棋现在有 ${group.liberties.length} 气。`,
        points: showLib ? group.liberties : [],
      };
    }
  }
  return { text: `轮到${colorName(game.toPlay)}。点棋子可以看气。`, points: [] };
}

function boardOf(game, options) {
  return {
    size: game.size,
    board: game.cells(),
    lastMove: game.lastMove,
    labels: options.labels,
    liberties: options.showLib ? options.liberties : [],
    hints: options.hints || [],
    eyes: options.eyes || [],
    focus: options.focus || [],
  };
}

function eyesOf(game) {
  for (let r = 0; r < game.size; r += 1) {
    for (let c = 0; c < game.size; c += 1) {
      if (game.cell(r, c) === "B") return game.solidEyes(r, c);
    }
  }
  return [];
}

function recordText(game) {
  const moves = game.moves;
  if (!moves.length) return "还没有落子。";
  return moves.slice(-8).map((move, index) => {
    const number = moves.length - moves.slice(-8).length + index + 1;
    const at = move.pass ? "停着" : coordName(move.r, move.c, game.size);
    return `${number}. ${colorName(move.color)}${at}`;
  }).join("  ");
}
