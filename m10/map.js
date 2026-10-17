// 《椒麻江湖》地图配置 · 场景一：火锅店（逻辑层）。可在游戏里按 E 校准后点“导出”下载新的 map.js，替换本文件即生效。
// M4：每个场景一份地图。id 场景名；name 顶栏地名；bg 背景图名（缺图时用 placeholder 指定的代码占位）；
//   entrances：从别的场景进来时三人的落脚格（按队伍顺序）；交互点 kind:"exit" 是出口（to 目标场景，entrance 落脚点，if/ifNot 条件）。
//   npcs / interactables 可写 if / ifNot（flag 条件）控制出现与否。
// 坐标：x 轴朝屏幕右下，y 轴朝屏幕左下；格 (x,y) 的中心在 gridToScreen(x+0.5, y+0.5)。
// walk[y] 是第 y 行的字符串，'.' 可走，'#' 障碍。道具/NPC 占的格会在运行时自动再标为障碍。
window.MAP = window.MAP_SHOP = {
  "version": 1,
  "id": "shop", "name": "皇族小满家·椒麻鸡火锅", "time": "戌时", "bg": "bg_room", "placeholder": "room",
  "world": { "w": 1536, "h": 1024 },
  "cols": 10,
  "rows": 12,
  "originX": 900,
  "originY": 262,
  "tileW": 124,
  "tileH": 62,
  "walk": [
    "#.......##",
    "#........#",
    "#.........",
    "..........",
    "..........",
    "..........",
    "..........",
    "..........",
    "..........",
    "..........",
    "..........",
    ".........."
  ],
  "props": [
    { "id": "table", "sprite": "prop_table_hotpot", "x": 4, "y": 4, "w": 3, "h": 3, "scale": 1.0, "offX": 0, "offY": 0 }
  ],
  "npcs": [
    { "id": "zhanggui", "name": "满掌柜", "sprite": "npc_zhanggui", "x": 0, "y": 5 }
  ],
  "spawn": [
    { "id": "xiaoman", "x": 7, "y": 11 },
    { "id": "feifei", "x": 8, "y": 10 },
    { "id": "pangdi", "x": 9, "y": 9 }
  ],
  "entrances": {
    "from_market": [{ "x": 4, "y": 10 }, { "x": 3, "y": 11 }, { "x": 5, "y": 11 }]
  },
  "interactables": [
    { "id": "zhanggui", "name": "满掌柜", "kind": "npc", "cells": [[0, 5]] },
    { "id": "table", "name": "火锅桌", "kind": "prop", "cells": [[4,4],[5,4],[6,4],[4,5],[5,5],[6,5],[4,6],[5,6],[6,6]] },
    { "id": "sign", "name": "“椒麻鸡火锅”招牌", "kind": "sign", "cells": [[-1, 2], [-1, 3]], "hit": { "x": 232, "y": 20, "w": 420, "h": 190 } },
    { "id": "kitchen", "name": "后厨门帘", "kind": "hotspot", "cells": [[0, -1], [-1, -1]], "hit": { "x": 900, "y": 69, "w": 75, "h": 155 }, "label": "后厨",
      "sprite": { "name": "prop_kitchen_curtain", "x": 938, "y": 224, "h": 155 } },
    { "id": "door", "name": "店门（往老码头）", "kind": "exit", "to": "market", "entrance": "from_shop", "cells": [[3, 12], [4, 12]],
      "hit": { "x": 318, "y": 724, "w": 168, "h": 74 }, "label": "店门 · 老码头", "ifNot": ["c2_finale"] },
    { "id": "door", "name": "店门（往雾江古渡）", "kind": "exit", "to": "river", "entrance": "from_shop", "cells": [[3, 12], [4, 12]],
      "hit": { "x": 318, "y": 724, "w": 168, "h": 74 }, "label": "店门 · 雾江", "if": ["c2_finale"] }
  ]
};
