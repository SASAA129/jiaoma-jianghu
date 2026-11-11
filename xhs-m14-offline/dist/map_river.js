// 《椒麻江湖》地图配置 · 场景三：雾江·古渡夜航（渡船甲板）。字段含义同 map.js。
// 校准：index.html?scene=river → E → 导出 map_river.js。
window.MAP_RIVER = {
  "version": 1,
  "id": "river", "name": "雾江·古渡夜航", "time": "子时", "bg": "bg_river", "placeholder": "river", "night": true,
  "world": { "w": 1536, "h": 1024 },
  "cols": 9,
  "rows": 8,
  "originX": 680,
  "originY": 300,
  "tileW": 124,
  "tileH": 62,
  "walk": [
    "..##.....",
    ".##......",
    ".........",
    ".........",
    ".........",
    ".........",
    ".........",
    ".......#."
  ],
  "props": [],
  "npcs": [
    { "id": "chuanniang", "char": "chuanniang", "x": 6, "y": 3, "flip": true },
    { "id": "tiesuanpan", "char": "tiesuanpan", "x": 3, "y": 2, "flip": true, "if": ["c3_box_safe"], "ifNot": ["c3_ts_win"] }
  ],
  "spawn": [
    { "id": "xiaoman", "x": 2, "y": 5 },
    { "id": "feifei", "x": 1, "y": 5 },
    { "id": "pangdi", "x": 2, "y": 6 }
  ],
  "entrances": {
    "from_market": [{ "x": 2, "y": 5 }, { "x": 1, "y": 5 }, { "x": 2, "y": 6 }],
    "from_shop": [{ "x": 2, "y": 5 }, { "x": 1, "y": 5 }, { "x": 2, "y": 6 }]
  },
  "interactables": [
    { "id": "chuanniang", "name": "船娘阿篙", "kind": "npc", "cells": [[6, 3]] },
    { "id": "stars", "name": "桅杆 · 认星位", "kind": "sign", "cells": [[1, 1], [2, 1]],
      "hit": { "x": 560, "y": 320, "w": 170, "h": 110 }, "label": "认星位" },
    { "id": "net", "name": "船舷 · 下网", "kind": "sign", "cells": [[4, 6], [5, 6]],
      "hit": { "x": 760, "y": 760, "w": 190, "h": 100 }, "label": "下网捞物" },
    { "id": "boat_deck", "name": "船甲板", "kind": "sign", "cells": [[3, 4], [4, 4]],
      "hit": { "x": 700, "y": 560, "w": 140, "h": 80 }, "hideInList": true },
    { "id": "tiesuanpan", "name": "铁算盘（红汤帮二当家）", "kind": "npc", "cells": [[3, 2]],
      "if": ["c3_box_safe"], "ifNot": ["c3_ts_win"] },
    { "id": "cabin", "name": "船舱", "kind": "sign", "cells": [[7, 2], [8, 2]],
      "hit": { "x": 1180, "y": 420, "w": 160, "h": 180 }, "hideInList": true },
    { "id": "back_market", "name": "回老码头", "kind": "exit", "to": "market", "entrance": "from_shop",
      "cells": [[0, 4], [0, 5]], "hit": { "x": 260, "y": 480, "w": 160, "h": 90 }, "label": "回老码头" },
    { "id": "path", "name": "上岸山路（往麻婆岭）", "kind": "exit", "to": "village", "entrance": "from_river",
      "cells": [[7, 5], [8, 5]], "hit": { "x": 1100, "y": 680, "w": 180, "h": 100 }, "label": "麻婆岭",
      "if": ["c3_finale"] }
  ]
};
