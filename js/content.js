export const tutorials = [
  {
    id: "board",
    kicker: "第一课",
    title: "棋盘",
    body: [
      "围棋下在交叉点上，不在格子中间。入门常用九路棋盘，小一点，看得清。",
      "小黑点叫星位，用来认位置。列从左到右是 A、B、C……没有 I；行从下往上数。所以左上角是 A9，右下角是 J1。",
    ],
    position: { size: 9, toPlay: "B" },
    note: "先看星位和坐标。可以随便落子，熟悉「子在线上」。",
  },
  {
    id: "move",
    kicker: "第二课",
    title: "黑先落子",
    body: [
      "对局黑棋先走，然后双方轮流下一子。一子落下，就不能再挪。",
      "棋子只和上下左右连成一块。斜着挨着，不算连在一起。",
    ],
    position: {
      size: 7,
      stones: [
        ["B", 2, 2],
        ["B", 2, 3],
        ["B", 3, 4],
      ],
      toPlay: "B",
    },
    note: "上面两颗黑子是一块，斜下方那颗是另一块。鼠标放上去，可以分别看它们的气。",
  },
  {
    id: "qi",
    kicker: "第三课",
    title: "气",
    body: [
      "气是一颗子或一块棋上下左右紧挨着的空点。斜角不算气。",
      "棋盘中央的一子有四气，边上有三气，角上有两气。同一块棋的气要合在一起数，两子共用的空点只算一口气。",
    ],
    position: {
      size: 9,
      stones: [
        ["B", 0, 0],
        ["B", 0, 4],
        ["B", 4, 4],
        ["W", 4, 5],
      ],
      toPlay: "B",
    },
    note: "把鼠标移到每颗子上。角上 2 气，边上 3 气，中央被白子挡住一气后是 3 气。",
  },
  {
    id: "capture",
    kicker: "第四课",
    title: "提子",
    body: [
      "一块棋一气都没有，就要从棋盘上拿掉，这叫提子，也常说吃子。",
      "把对方最后一口气堵住，如果自己这一手不是没气，就可以提。被提掉的子记在提子数里。",
    ],
    position: {
      picture: `
.....
.XOX.
..X..
.....
.....
`,
      toPlay: "B",
    },
    note: "黑先。白子只剩正上方一口气，堵住它。",
  },
  {
    id: "eyes",
    kicker: "第五课",
    title: "眼、活棋和死棋",
    body: [
      "眼是一块棋围住的空点，这个空点的上下左右都是自己的棋。两只眼必须分开，不能连成一条缝。",
      "有两只真眼的棋是活棋，对方填不进来。只有一只眼，或者几口气连在一起，一般都是死棋。直三要看谁先占中间：轮到自己下在中间，就能分成两只眼。",
    ],
    position: {
      picture: `
.........
.OOOOOOO.
.OXXXXXO.
.OX.X.XO.
.OXXXXXO.
.OOOOOOO.
.........
.........
.........
`,
      toPlay: "W",
    },
    note: "轮到白棋。试试把子填进黑棋的眼里，会发现那里不能下。",
  },
  {
    id: "ko",
    kicker: "第六课",
    title: "禁着点和劫",
    body: [
      "没有气、又提不掉对方的地方，不能下。这是禁着点，避免自己把子送到对方手里。",
      "有一种形状叫劫：你刚提掉对方一子，对方如果马上在原处提回来，棋盘会和提劫之前一模一样。这种全局同形不允许马上回提，要先在别处走一手。",
    ],
    position: {
      picture: `
..X..
.XOX.
.O.O.
..O..
.....
`,
      toPlay: "B",
    },
    note: "先用黑棋提掉中间上方的白子，再换白棋，试着立刻提回来。",
  },
  {
    id: "start",
    kicker: "第七课",
    title: "一盘棋怎么走",
    body: [
      "正式对局多在十九路棋盘上下，入门用九路就够。黑先，双方轮流落子，也可以停着。",
      "双方连续停着，这盘就结束。胜负要数地，也就是围住的空点，入门先把气、提子和死活认熟，这里暂不数胜负。",
      "接下来可以自由摆子，或去做死活题。做题时只接受解得开的一手，下错会收回。",
    ],
    position: { size: 9, toPlay: "B" },
    note: "把这一盘当作沙盘。停着、悔棋、看气都可以试。",
  },
];

export const drills = [
  {
    id: "center",
    title: "中央一子",
    size: 9,
    stones: [["B", 4, 4]],
    focus: [4, 4],
    liberties: 4,
    explain: "中央一子，上下左右四个空点，是 4 气。斜角的四个空点都不算。",
  },
  {
    id: "edge",
    title: "边上的子",
    size: 9,
    stones: [["B", 0, 4]],
    focus: [0, 4],
    liberties: 3,
    explain: "子在边上，少了棋盘外面的那一口气，所以是 3 气。",
  },
  {
    id: "corner",
    title: "角上的子",
    size: 9,
    stones: [["B", 0, 0]],
    focus: [0, 0],
    liberties: 2,
    explain: "角上只有两个方向还在棋盘里，是 2 气。",
  },
  {
    id: "corner-blocked",
    title: "角上被挡住",
    size: 9,
    stones: [
      ["B", 0, 0],
      ["W", 1, 0],
    ],
    focus: [0, 0],
    liberties: 1,
    explain: "角上本来有 2 气。下面被白子挡住以后，只剩旁边这一气。",
  },
  {
    id: "vertical",
    title: "竖着的两子",
    size: 9,
    stones: [
      ["B", 4, 4],
      ["B", 5, 4],
    ],
    focus: [4, 4],
    liberties: 6,
    explain: "上下相连也是一块。左右和两头的空点合起来是 6 气。",
  },
  {
    id: "blocked",
    title: "被挡住的气",
    size: 9,
    stones: [
      ["B", 4, 4],
      ["W", 4, 5],
    ],
    focus: [4, 4],
    liberties: 3,
    explain: "右边被白子挡住。白子不是空点，这一气没了，黑子还剩 3 气。",
  },
  {
    id: "group",
    title: "两子算一块",
    size: 9,
    stones: [
      ["B", 4, 4],
      ["B", 4, 5],
    ],
    focus: [4, 4],
    liberties: 6,
    explain: "横着相连是同一块。每颗子外侧各有三气，合起来 6 气，不能按 4 加 4 去数。",
  },
  {
    id: "atari",
    title: "只剩一口气",
    picture: `
.....
.XOX.
..X..
.....
.....
`,
    focus: [1, 2],
    liberties: 1,
    explain: "白子上下左右里，三面是黑棋，只剩上面一个空点。这就是 1 气，也叫被叫吃。",
  },
];

export const puzzles = [
  {
    id: "capture-one",
    kind: "play",
    level: "入门",
    title: "提掉一子",
    task: "黑先。白子只剩一口气，把这口气堵住。",
    picture: `
.....
.XOX.
..X..
.....
.....
`,
    toPlay: "B",
    goal: "clear-white",
    tree: {
      moves: {
        "0,2": { done: true, success: "堵住最后一口气，白子被提掉。斜角不算气。" },
      },
    },
  },
  {
    id: "capture-corner",
    kind: "play",
    level: "入门",
    title: "角上提子",
    task: "黑先。白子在角上，只剩右边一口气。",
    picture: `
O...
X...
....
....
`,
    toPlay: "B",
    goal: "clear-white",
    tree: {
      moves: {
        "0,1": { done: true, success: "角上的子最多两气。这一气被堵住，白子就被提掉。" },
      },
    },
  },
  {
    id: "capture-edge",
    kind: "play",
    level: "入门",
    title: "边上提子",
    task: "黑先。白子贴在左边线上，上下都是黑棋，只剩右边一口气。",
    picture: `
X....
O....
X....
.....
.....
`,
    toPlay: "B",
    goal: "clear-white",
    tree: {
      moves: {
        "1,1": { done: true, success: "边上的子少了棋盘外面的那一口气。最后一口在旁边，堵住就能提。" },
      },
    },
  },
  {
    id: "capture-below",
    kind: "play",
    level: "入门",
    title: "从下面提",
    task: "黑先。白子的最后一口气在下面，不在上面。",
    picture: `
..X..
.XOX.
.X.X.
..X..
.....
`,
    toPlay: "B",
    goal: "clear-white",
    tree: {
      moves: {
        "2,2": { done: true, success: "气可以在上、下、左、右任何一个方向。这里堵住下面这一口，白子就被提掉。" },
      },
    },
  },
  {
    id: "capture-two",
    kind: "play",
    level: "入门",
    title: "提掉两子",
    task: "黑先。两颗白子横着连成一块，整块只剩下面一口气。",
    picture: `
.XXXX
.XOOX
.X.XX
.XXXX
.....
`,
    toPlay: "B",
    goal: "clear-white",
    tree: {
      moves: {
        "2,2": { done: true, success: "两颗子连在一起，气要一起数。堵住共有的那一口气，两子会同时被提掉。" },
      },
    },
  },
  {
    id: "atari-corner",
    kind: "play",
    level: "入门",
    title: "角上叫吃",
    task: "黑先。角上的白子有两气。占掉其中一口，让它只剩一口气。先不要提子。",
    picture: `
O....
.....
.....
.....
.....
`,
    toPlay: "B",
    goal: "atari",
    tree: {
      moves: {
        "0,1": { done: true, success: "占掉右边，白子只剩下面一口气。再堵住就能提。" },
        "1,0": { done: true, success: "占掉下面，白子只剩右边一口气。角上两气，占掉一口就是叫吃。" },
      },
    },
  },
  {
    id: "atari-edge",
    kind: "play",
    level: "入门",
    title: "边上叫吃",
    task: "黑先。白子在边上，已经少了一气。再占一口，让它变成叫吃。",
    picture: `
XO...
.....
.....
.....
.....
`,
    toPlay: "B",
    goal: "atari",
    tree: {
      moves: {
        "0,2": { done: true, success: "沿边再走一子，白子只剩下面一口气。" },
        "1,1": { done: true, success: "从下面叫吃也可以。白子现在只剩右边一口气。" },
      },
    },
  },
  {
    id: "finish-edge",
    kind: "play",
    level: "入门",
    title: "两口气都要堵",
    task: "黑先。边上的白子有两气。先占一口，白棋长不出去，再提子。",
    picture: `
.X...
OX...
.X...
X....
.....
`,
    toPlay: "B",
    goal: "clear-white",
    tree: {
      moves: {
        "0,0": {
          reply: "pass",
          note: "白棋如果去占另一口气，自己也没有气，所以只能停着。请提子。",
          moves: {
            "2,0": { done: true, success: "两口气都堵住了。边上的子也是一口气不剩就要被提。" },
          },
        },
        "2,0": {
          reply: "pass",
          note: "白棋补不上这口气，只能停着。请提子。",
          moves: {
            "0,0": { done: true, success: "先叫吃，再提子。剩下的那口气同样要堵住。" },
          },
        },
      },
    },
  },
  {
    id: "capture-string",
    kind: "play",
    level: "入门",
    title: "一口气提一串",
    task: "黑先。右边三颗白子连成一块，只剩一口气。",
    picture: `
..XO
.X.O
..XO
...X
`,
    toPlay: "B",
    goal: "clear-white",
    tree: {
      moves: {
        "1,2": { done: true, success: "相连的子是一块。一块棋没气时，会一起被提掉。" },
      },
    },
  },
  {
    id: "double-capture",
    kind: "play",
    level: "入门",
    title: "一子提两处",
    task: "黑先。左右两颗白子并不相连，但都只剩中间这一气。",
    picture: `
.....
.X.X.
XO.OX
.X.X.
.....
`,
    toPlay: "B",
    goal: "clear-white",
    tree: {
      moves: {
        "2,2": { done: true, success: "一手可以同时提掉不相连的两块，只要它们各自都没气了。" },
      },
    },
  },
  {
    id: "atari",
    kind: "play",
    level: "入门",
    title: "叫吃",
    task: "黑先。先不要提子，下一手让白子只剩一口气。这样的手段叫叫吃，也叫打吃。",
    picture: `
.....
.XO..
..X..
.....
.....
`,
    toPlay: "B",
    goal: "atari",
    tree: {
      moves: {
        "0,2": { done: true, success: "白子只剩一口气。对方如果不应，下一手就能提。" },
        "1,3": { done: true, success: "从旁边叫吃也可以。白子现在只剩上面一口气。" },
      },
    },
  },
  {
    id: "finish",
    kind: "play",
    level: "进阶",
    title: "叫吃之后提子",
    task: "黑先。白子有两气，先叫吃。白棋补不上这口气。",
    picture: `
.....
.XOX.
.X.X.
..X..
.....
`,
    toPlay: "B",
    goal: "clear-white",
    tree: {
      moves: {
        "0,2": {
          reply: "pass",
          note: "白棋没法长气，只能停着。再堵住最后一口气。",
          moves: {
            "2,2": { done: true, success: "先叫吃，再提子。对方长不出去的那口气，下一手就能堵上。" },
          },
        },
        "2,2": {
          reply: "pass",
          note: "白棋没法长气，只能停着。再堵住最后一口气。",
          moves: {
            "0,2": { done: true, success: "先叫吃，再提子。两口气都堵住以后，白子就被提掉。" },
          },
        },
      },
    },
  },
  {
    id: "ko",
    kind: "play",
    level: "进阶",
    title: "提劫",
    task: "黑先。提掉这颗白子。提完以后，白棋不能马上在原处提回来。",
    picture: `
..X..
.XOX.
.O.O.
..O..
.....
`,
    toPlay: "B",
    goal: "took-ko",
    target: [1, 2],
    tree: {
      moves: {
        "2,2": {
          done: true,
          success: "这手把劫提掉了。白棋若马上回提，局面会和提劫前一模一样，规则不允许。要先在别处走一手，才能再提。",
        },
      },
    },
  },
  {
    id: "snapback",
    kind: "play",
    level: "进阶",
    title: "倒扑",
    task: "黑先。先把一子送到左上角。白棋只能提掉这一子，然后再把白棋三子一起提回来。",
    picture: `
..X..
OOX..
XX...
.....
.....
`,
    toPlay: "B",
    goal: "clear-white",
    tree: {
      moves: {
        "0,0": {
          reply: [0, 1],
          note: "白棋提掉了送进去的那颗黑子。请在原处把三颗白子提回来。",
          moves: {
            "0,0": { done: true, success: "这就是倒扑：先送一子，对方提完以后，自己反提更多的子。" },
          },
        },
      },
    },
  },
  {
    id: "two-eyes",
    kind: "play",
    level: "进阶",
    title: "做成两只眼",
    task: "黑先。这块棋围着三个连在一起的空点。下一手要让它变成两只分开的眼。",
    picture: `
.........
.OOOOOOO.
.OXXXXXO.
.OX...XO.
.OXXXXXO.
.OOOOOOO.
.........
.........
.........
`,
    toPlay: "B",
    goal: "two-eyes",
    tree: {
      moves: {
        "3,4": {
          done: true,
          success: "下在直三的中间，左右就分成两只眼。对方填任何一只眼都没有气，又提不掉这块棋，所以不能下。这块棋活了。",
        },
      },
    },
  },
  {
    id: "judge-one-eye",
    kind: "judge",
    level: "判断",
    title: "只有一只眼",
    task: "黑棋被围住，中间只有一个空点。这块棋怎样？",
    picture: `
.......
.OOOOO.
.OXXXO.
.OX.XO.
.OXXXO.
.OOOOO.
.......
`,
    toPlay: "W",
    expectEyes: 1,
    choices: [
      {
        text: "活棋",
        correct: false,
        explain: "一只眼不够。白棋虽然不能随便填进去，但整块棋只有这一气，最后还是会被提掉。",
      },
      {
        text: "死棋",
        correct: true,
        explain: "只有一只眼。对方填这只眼时，正好提掉整块黑棋，所以它是死棋。要活，需要两只分开的眼。",
      },
      {
        text: "还要再做一个眼",
        correct: false,
        explain: "周围都是白棋，黑棋已经没有地方再做第二只眼了。",
      },
    ],
  },
  {
    id: "judge-alive",
    kind: "judge",
    level: "判断",
    title: "这两只眼",
    task: "看这块被围住的黑棋，现在是什么状态？",
    picture: `
.........
.OOOOOOO.
.OXXXXXO.
.OX.X.XO.
.OXXXXXO.
.OOOOOOO.
.........
.........
.........
`,
    toPlay: "W",
    expectEyes: 2,
    choices: [
      {
        text: "活棋",
        correct: true,
        explain: "左右两个空点互不相连，而且各自的上下左右都是黑棋。白棋填进去没有气，这块黑棋是活棋。",
      },
      {
        text: "死棋",
        correct: false,
        explain: "如果只有一只眼，才是死棋。这里有两只分开的眼，白棋填不进来。",
      },
      {
        text: "还要黑棋再补一手",
        correct: false,
        explain: "两只眼已经做好了，不用再补。再往眼里下，反而把眼填掉。",
      },
    ],
  },
  {
    id: "judge-dead",
    kind: "judge",
    level: "判断",
    title: "连在一起的两口气",
    task: "黑棋被完全围住，中间还有两个连着的空点。轮到黑棋也一样，这块棋怎样？",
    picture: `
........
.OOOOOO.
.OXXXXO.
.OX..XO.
.OXXXXO.
.OOOOOO.
........
........
`,
    toPlay: "B",
    expectEyes: 0,
    choices: [
      {
        text: "活棋",
        correct: false,
        explain: "两个空点连在一起，只算一块眼位，不是两只眼。黑棋下一手之后，还是只剩一只眼。",
      },
      {
        text: "死棋",
        correct: true,
        explain: "这是直二。黑棋无论先占哪一个空点，都只做出一只眼，白棋随后可以提掉整块棋。",
      },
      {
        text: "黑棋占住一个空点就活",
        correct: false,
        explain: "占住一个空点以后，另一个空点才变成眼，可是整块棋只剩这一气，白棋再下一手就能提。",
      },
    ],
  },
  {
    id: "judge-straight",
    kind: "judge",
    level: "判断",
    title: "直三的中间",
    task: "三个空点排成一条线。还没有人下在中间。这块黑棋怎样？",
    picture: `
.........
.OOOOOOO.
.OXXXXXO.
.OX...XO.
.OXXXXXO.
.OOOOOOO.
.........
.........
.........
`,
    toPlay: "B",
    expectEyes: 0,
    choices: [
      {
        text: "已经活了",
        correct: false,
        explain: "三个空点还连着，现在一只完成的眼都没有。白棋如果先占中间，这块棋就做不成两只眼。",
      },
      {
        text: "已经死了",
        correct: false,
        explain: "还没死透。轮到黑棋的话，下在三个空点的正中间就能做活。",
      },
      {
        text: "黑棋占住中间就能活",
        correct: true,
        explain: "直三的要点在中间。黑棋下在那里，左右变成两只分开的眼；白棋若先占中间，黑棋就活不了。",
      },
    ],
  },
];
