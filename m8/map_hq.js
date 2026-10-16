// 《椒麻江湖》地图 · 场景五：红汤总舵大酒楼。校准：index.html?scene=hq → E → 导出 map_hq.js。
// 设计提醒：大厅地面四角有桌子 → walk 四角不可走；大鼎 prop 参与遮挡/挡路。
window.MAP_HQ = {
  "version": 1,
  "id": "hq", "name": "红汤总舵·大酒楼", "time": "戌时", "bg": "bg_hq", "placeholder": "hq", "night": true,
  "world": { "w": 1536, "h": 1024 },
  "cols": 10, "rows": 9,
  "originX": 720, "originY": 260, "tileW": 124, "tileH": 62,
  "walk": [
    "##......##",
    "#........#",
    "..........",
    "....##....",
    "....##....",
    "..........",
    "..........",
    "#........#",
    "##......##"
  ],
  "props": [
    { "id": "cauldron", "sprite": "prop_red_cauldron", "ph": "cauldron", "label": "红汤大鼎",
      "x": 4, "y": 3, "w": 2, "h": 2, "scale": 0.85, "offX": 0, "offY": -8 }
  ],
  "npcs": [
    { "id": "chilaosan", "char": "chilaosan", "x": 6, "y": 4, "flip": true,
      "if": ["c5_truth"], "ifNot": ["c5_fought"] }
  ],
  "spawn": [
    { "id": "xiaoman", "x": 2, "y": 7 },
    { "id": "feifei", "x": 1, "y": 7 },
    { "id": "pangdi", "x": 2, "y": 8 }
  ],
  "entrances": {
    "from_village": [{ "x": 2, "y": 7 }, { "x": 1, "y": 7 }, { "x": 2, "y": 8 }],
    "from_shop": [{ "x": 2, "y": 7 }, { "x": 1, "y": 7 }, { "x": 2, "y": 8 }]
  },
  "interactables": [
    { "id": "gate", "name": "门房", "kind": "sign", "cells": [[2, 8], [3, 8]],
      "hit": { "x": 520, "y": 860, "w": 160, "h": 90 }, "label": "门房" },
    { "id": "ledger", "name": "账房", "kind": "sign", "cells": [[1, 2], [2, 2]],
      "hit": { "x": 380, "y": 320, "w": 150, "h": 100 }, "label": "账房" },
    { "id": "poet", "name": "雅座门客", "kind": "sign", "cells": [[8, 2], [9, 2]],
      "hit": { "x": 1180, "y": 300, "w": 160, "h": 110 }, "label": "雅座" },
    { "id": "kitchen", "name": "后厨", "kind": "sign", "cells": [[8, 6], [9, 6]],
      "hit": { "x": 1200, "y": 680, "w": 150, "h": 100 }, "label": "后厨" },
    { "id": "cauldron", "name": "红汤大鼎", "kind": "sign", "cells": [[4, 3], [5, 3], [4, 4], [5, 4]],
      "hit": { "x": 700, "y": 420, "w": 180, "h": 140 }, "label": "大鼎" },
    { "id": "chilaosan", "name": "赤老三", "kind": "npc", "cells": [[6, 4]],
      "if": ["c5_truth"], "ifNot": ["c5_fought"] },
    { "id": "back_village", "name": "回麻婆岭", "kind": "exit", "to": "village", "entrance": "from_river",
      "cells": [[0, 7], [0, 8]], "hit": { "x": 200, "y": 720, "w": 150, "h": 90 }, "label": "回麻婆岭" },
    { "id": "path", "name": "赴擂台（天下第一锅）", "kind": "exit", "to": "arena", "entrance": "from_hq",
      "cells": [[9, 7], [9, 8]], "hit": { "x": 1280, "y": 740, "w": 160, "h": 100 }, "label": "赴擂台",
      "if": ["c5_finale"] }
  ]
};
