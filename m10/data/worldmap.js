// M9 江湖地图：节点坐标（1536×1024 地图像素）、解锁条件、快速旅行落脚点。
// 美术交付 art/ch7/map.json 后，prep_assets 生成 data/worldmap_art.js，其中的坐标/名字/路线会覆盖这里（格式见 art/ch7/SPEC_map.md）。
// M10：artRouteVia = 正式底图 bg_worldmap.png 上的路线途经点（地图像素）。路线按章节顺序连，不直线横穿江面：
//   via   = 沿岸 / 过桥的折线途经点；ferry = 雾江古渡在江心栈桥上，只有「岸边渡口 ↔ 栈桥」这一小段走水路，画成渡船虚线。
//   只在正式底图在场时使用（占位底图坐标不同）。selftest_m10 用底图水面像素逐段检查。
window.WORLDMAP = {
  "title": "渝州 · 江湖地图",
  "nodes": [
    { "id": "shop",    "name": "满记火锅店",     "glyph": "店", "x": 330,  "y": 700, "unlock": [],              "entrance": "from_market", "desc": "满家三代老店" },
    { "id": "market",  "name": "老码头夜市",     "glyph": "市", "x": 560,  "y": 820, "unlock": ["ch1_done"],    "entrance": "from_shop",   "desc": "江边夜市，灯火通明" },
    { "id": "river",   "name": "雾江古渡",       "glyph": "渡", "x": 860,  "y": 640, "unlock": ["c2_finale"],   "entrance": "from_shop",   "desc": "雾锁江心的老渡口" },
    { "id": "village", "name": "麻婆岭花椒寨",   "glyph": "岭", "x": 1220, "y": 300, "unlock": ["c3_finale"],   "entrance": "from_river",  "desc": "满山花椒树" },
    { "id": "hq",      "name": "红汤总舵",       "glyph": "舵", "x": 520,  "y": 430, "unlock": ["c4_finale"],   "entrance": "from_village","desc": "城中红汤大酒楼" },
    { "id": "arena",   "name": "天下第一锅擂台", "glyph": "擂", "x": 820,  "y": 300, "unlock": ["c5_finale"],   "entrance": "from_hq",     "desc": "城中广场的大擂台" }
  ],
  "routes": [["shop", "market"], ["market", "river"], ["river", "village"], ["village", "hq"], ["hq", "arena"], ["shop", "hq"]],
  "artRouteVia": {
    "shop-market":   { "via": [[250, 640], [262, 500]] },                                          // 西岸大路北上
    "market-river":  { "via": [[420, 330], [478, 280], [600, 288], [720, 312]], "ferry": [[790, 338]] },  // 过上游石桥 → 北岸 → 渡口 → 摆渡上栈桥
    "river-village": { "ferry": [[860, 350]], "via": [[990, 430], [1120, 452], [1200, 330]] },      // 摆渡回北岸 → 沿崖下林带 → 梯田小路上寨
    "village-hq":    { "via": [[1120, 300], [900, 300], [700, 290], [560, 250]] },                 // 北岸大路西行
    "hq-arena":      { "via": [[478, 280], [420, 330], [328, 394], [262, 500], [250, 640], [270, 800], [560, 930], [800, 960], [994, 909], [1200, 860]] }  // 过石桥 → 西岸 → 南岸 → 下游石桥 → 擂台
  }
};
