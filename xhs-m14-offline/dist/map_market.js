// 《椒麻江湖》地图配置 · 场景二：渝州·老码头夜市（逻辑层）。字段含义同 map.js。
// 网格已按 bg_market.png 校准（格子大小与火锅店相同 124×62，原点移到石阶下的石板地顶角，扩到 12×14）。以后换图要重新对齐：
//   进夜市 → 按 E 打开校准 → 拖动/方向键对齐原点、+/- 调格子、点格子改可走 → “导出”得到新的 map_market.js 替换本文件。
//   也可以直接用地址 index.html?scene=market 跳到夜市校准（不影响存档）。
// 道具 props：sprite 为贴图名（prop_stall_1..3），缺图时按 ph（stall / jars）画代码占位，label 为占位招牌字。
window.MAP_MARKET = {
  "version": 1,
  "id": "market", "name": "渝州·老码头夜市", "time": "亥时", "bg": "bg_market", "placeholder": "market", "night": true,
  "world": { "w": 1536, "h": 1024 },
  "cols": 12,
  "rows": 14,
  "originX": 950,
  "originY": 262,
  "tileW": 124,
  "tileH": 62,
  "walk": [
    "....########",
    ".......#####",
    "...........#",
    "...........#",
    "............",
    "............",
    "............",
    "............",
    "............",
    "............",
    "............",
    "............",
    "...........#",
    "..........##"
  ],
  "props": [
    { "id": "stall_1", "sprite": "prop_stall_1", "ph": "stall", "label": "古玩", "awning": "#3f6b5a", "x": 2, "y": 3, "w": 2, "h": 2, "scale": 1.15, "offX": 0, "offY": 6 },
    { "id": "stall_2", "sprite": "prop_stall_2", "ph": "stall", "label": "灯谜", "awning": "#2f4f7a", "x": 3, "y": 8, "w": 2, "h": 2, "scale": 1.15, "offX": 0, "offY": 6 },
    { "id": "stall_3", "sprite": "prop_stall_3", "ph": "stall", "label": "炒锅", "awning": "#b0281c", "x": 7, "y": 5, "w": 2, "h": 2, "scale": 1.15, "offX": 0, "offY": 6 }
  ],
  "npcs": [
    { "id": "laobanniang", "char": "laobanniang", "x": 9, "y": 2, "flip": true },
    { "id": "labupa", "char": "labupa", "x": 9, "y": 5, "flip": true },
    { "id": "tongzi", "char": "tongzi", "x": 5, "y": 9 },
    { "id": "hongtang_a", "char": "hongtang", "x": 8, "y": 3, "flip": true, "if": ["c2_deduced"], "ifNot": ["c2_ht_win"] },
    { "id": "hongtang_b", "char": "hongtang", "x": 7, "y": 2, "flip": true, "if": ["c2_deduced"], "ifNot": ["c2_ht_win"] }
  ],
  "spawn": [
    { "id": "xiaoman", "x": 1, "y": 10 },
    { "id": "feifei", "x": 1, "y": 11 },
    { "id": "pangdi", "x": 2, "y": 11 }
  ],
  "entrances": {
    "from_shop": [{ "x": 1, "y": 10 }, { "x": 1, "y": 11 }, { "x": 2, "y": 11 }]
  },
  "interactables": [
    { "id": "laobanniang", "name": "茶馆老板娘", "kind": "npc", "cells": [[9, 2]] },
    { "id": "teahouse", "name": "码头茶馆", "kind": "sign", "cells": [[9, 1], [10, 1]], "hit": { "x": 1262, "y": 330, "w": 150, "h": 170 }, "hideInList": true },
    { "id": "stall_1", "name": "古玩摊（老周）", "kind": "prop", "cells": [[2,3],[3,3],[2,4],[3,4]] },
    { "id": "stall_2", "name": "灯谜摊（钱先生）", "kind": "prop", "cells": [[3,8],[4,8],[3,9],[4,9]] },
    { "id": "stall_3", "name": "炒锅摊（辣不怕）", "kind": "prop", "cells": [[7,5],[8,5],[7,6],[8,6]] },
    { "id": "labupa", "name": "辣不怕", "kind": "npc", "cells": [[9, 5]] },
    { "id": "tongzi", "name": "辣椒童子", "kind": "npc", "cells": [[5, 9]] },
    { "id": "hongtang_a", "name": "红汤帮打手", "kind": "npc", "cells": [[8, 3]], "if": ["c2_deduced"], "ifNot": ["c2_ht_win"] },
    { "id": "hongtang_b", "name": "红汤帮打手·乙", "kind": "npc", "cells": [[7, 2]], "if": ["c2_deduced"], "ifNot": ["c2_ht_win"], "hideInList": true },
    { "id": "pier", "name": "渡口石阶", "kind": "sign", "cells": [[1, -1], [2, -1], [3, -1]], "hit": { "x": 1000, "y": 150, "w": 150, "h": 120 }, "ifNot": ["c2_finale"] },
    { "id": "pier_river", "name": "渡口石阶（往雾江）", "kind": "exit", "to": "river", "entrance": "from_market",
      "cells": [[1, -1], [2, -1], [3, -1]], "hit": { "x": 1000, "y": 150, "w": 150, "h": 120 }, "label": "雾江古渡", "if": ["c2_finale"] },
    { "id": "back", "name": "回椒麻鸡火锅", "kind": "exit", "to": "shop", "entrance": "from_market", "cells": [[-1, 10], [-1, 11]],
      "hit": { "x": 160, "y": 520, "w": 170, "h": 90 }, "label": "回火锅店" }
  ]
};
