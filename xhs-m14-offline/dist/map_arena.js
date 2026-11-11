// 《椒麻江湖》地图 · 场景六：渝州擂台广场「天下第一锅」。
window.MAP_ARENA = {
  "version": 1,
  "id": "arena", "name": "渝州·天下第一锅擂台", "time": "酉时", "bg": "bg_arena", "placeholder": "arena", "night": false,
  "world": { "w": 1536, "h": 1024 },
  "cols": 10, "rows": 9,
  "originX": 720, "originY": 250, "tileW": 124, "tileH": 62,
  "walk": [
    "..........",
    "..........",
    "....##....",
    "....##....",
    "..........",
    "..........",
    "..........",
    "..........",
    ".........."
  ],
  "props": [
    { "id": "pot", "sprite": "prop_giant_pot", "ph": "cauldron", "label": "天下第一锅",
      "x": 4, "y": 2, "w": 2, "h": 2, "scale": 0.95, "offX": 0, "offY": -12 }
  ],
  "npcs": [
    { "id": "judge", "char": "judge", "x": 7, "y": 3, "flip": true },
    { "id": "chilaosan", "char": "chilaosan", "x": 2, "y": 3, "flip": false,
      "if": ["c6_rounds"], "ifNot": ["c6_final_win"] },
    { "id": "labupa", "char": "labupa", "x": 1, "y": 6, "flip": false, "if": ["c6_registered"] },
    { "id": "madawang", "char": "madawang", "x": 8, "y": 6, "flip": true, "if": ["c6_registered"] }
  ],
  "spawn": [
    { "id": "xiaoman", "x": 5, "y": 7 },
    { "id": "feifei", "x": 4, "y": 7 },
    { "id": "pangdi", "x": 5, "y": 8 }
  ],
  "entrances": {
    "from_hq": [{ "x": 5, "y": 7 }, { "x": 4, "y": 7 }, { "x": 5, "y": 8 }],
    "from_shop": [{ "x": 5, "y": 7 }, { "x": 4, "y": 7 }, { "x": 5, "y": 8 }]
  },
  "interactables": [
    { "id": "judge", "name": "老评委", "kind": "npc", "cells": [[7, 3]] },
    { "id": "allies", "name": "助阵席", "kind": "sign", "cells": [[1, 6], [2, 6]],
      "hit": { "x": 360, "y": 700, "w": 180, "h": 100 }, "label": "助阵席",
      "if": ["c6_registered"] },
    { "id": "pot", "name": "天下第一锅", "kind": "sign", "cells": [[4, 2], [5, 2], [4, 3], [5, 3]],
      "hit": { "x": 680, "y": 360, "w": 200, "h": 150 }, "label": "巨锅" },
    { "id": "chilaosan", "name": "赤老三", "kind": "npc", "cells": [[2, 3]],
      "if": ["c6_rounds"], "ifNot": ["c6_final_win"] },
    { "id": "back_hq", "name": "回红汤楼", "kind": "exit", "to": "hq", "entrance": "from_village",
      "cells": [[0, 7], [0, 8]], "hit": { "x": 180, "y": 740, "w": 140, "h": 90 }, "label": "回总舵" },
    { "id": "home", "name": "回满记火锅店", "kind": "exit", "to": "shop", "entrance": "from_market",
      "cells": [[9, 7], [9, 8]], "hit": { "x": 1300, "y": 740, "w": 150, "h": 90 }, "label": "回店",
      "if": ["c6_crowned"] }
  ]
};
