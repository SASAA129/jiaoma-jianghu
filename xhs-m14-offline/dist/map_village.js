// 《椒麻江湖》地图 · 场景四：麻婆岭·花椒寨。校准：index.html?scene=village → E → 导出 map_village.js。
window.MAP_VILLAGE = {
  "version": 1,
  "id": "village", "name": "麻婆岭·花椒寨", "time": "申时", "bg": "bg_village", "placeholder": "village", "night": false,
  "world": { "w": 1536, "h": 1024 },
  "cols": 10, "rows": 9,
  "originX": 720, "originY": 280, "tileW": 124, "tileH": 62,
  "walk": [
    "..######..",
    ".##....##.",
    "..........",
    "..........",
    "..........",
    "..........",
    "..........",
    "..........",
    ".........."
  ],
  "props": [],
  "npcs": [
    { "id": "jiaonong", "char": "jiaonong", "x": 7, "y": 3, "flip": true },
    { "id": "madawang", "char": "madawang", "x": 3, "y": 2, "flip": true, "if": ["c4_talked"], "ifNot": ["c4_reformed"] }
  ],
  "spawn": [
    { "id": "xiaoman", "x": 2, "y": 6 },
    { "id": "feifei", "x": 1, "y": 6 },
    { "id": "pangdi", "x": 2, "y": 7 }
  ],
  "entrances": {
    "from_river": [{ "x": 2, "y": 6 }, { "x": 1, "y": 6 }, { "x": 2, "y": 7 }],
    "from_shop": [{ "x": 2, "y": 6 }, { "x": 1, "y": 6 }, { "x": 2, "y": 7 }]
  },
  "interactables": [
    { "id": "jiaonong", "name": "老椒农", "kind": "npc", "cells": [[7, 3]] },
    { "id": "field", "name": "椒田地界", "kind": "sign", "cells": [[1, 3], [2, 3]],
      "hit": { "x": 480, "y": 420, "w": 170, "h": 100 }, "label": "椒田地界" },
    { "id": "cliff", "name": "崖顶野椒", "kind": "sign", "cells": [[8, 1], [9, 1]],
      "hit": { "x": 1180, "y": 220, "w": 160, "h": 120 }, "label": "崖顶" },
    { "id": "wok", "name": "寨中大锅", "kind": "sign", "cells": [[5, 5], [6, 5]],
      "hit": { "x": 820, "y": 620, "w": 160, "h": 100 }, "label": "大锅" },
    { "id": "madawang", "name": "麻大王", "kind": "npc", "cells": [[3, 2]],
      "if": ["c4_talked"], "ifNot": ["c4_reformed"] },
    { "id": "back_river", "name": "回雾江渡口", "kind": "exit", "to": "river", "entrance": "from_shop",
      "cells": [[0, 6], [0, 7]], "hit": { "x": 200, "y": 560, "w": 150, "h": 90 }, "label": "回雾江" },
    { "id": "path", "name": "下山进城（往红汤总舵）", "kind": "exit", "to": "hq", "entrance": "from_village",
      "cells": [[9, 6], [9, 7]], "hit": { "x": 1280, "y": 640, "w": 160, "h": 100 }, "label": "进城",
      "if": ["c4_finale"] }
  ]
};
