// M9 江湖地图：节点坐标（1536×1024 地图像素）、解锁条件、快速旅行落脚点。
// 美术交付 art/ch7/map.json 后，prep_assets 生成 data/worldmap_art.js，其中的坐标/名字会覆盖这里（格式见 art/ch7/SPEC_map.md）。
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
  "routes": [["shop", "market"], ["market", "river"], ["river", "village"], ["village", "hq"], ["hq", "arena"], ["shop", "hq"]]
};
