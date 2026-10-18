// 由 tools/prep_assets.py 从 art/ch7/map.json 生成（格式见 art/ch7/SPEC_map.md）；null = 用 data/worldmap.js 内置坐标。
window.WORLDMAP_ART = {
 "version": 1,
 "image": "bg_worldmap.png",
 "size": {
  "w": 1536,
  "h": 1024
 },
 "nodes": [
  {
   "id": "shop",
   "name": "满记火锅店",
   "x": 270,
   "y": 800,
   "label": [
    200,
    110
   ]
  },
  {
   "id": "market",
   "name": "老码头夜市",
   "x": 328,
   "y": 394,
   "label": [
    0,
    160
   ]
  },
  {
   "id": "river",
   "name": "雾江古渡",
   "x": 807,
   "y": 478,
   "label": [
    0,
    110
   ]
  },
  {
   "id": "village",
   "name": "麻婆岭花椒寨",
   "x": 1276,
   "y": 188,
   "label": [
    0,
    130
   ]
  },
  {
   "id": "hq",
   "name": "红汤总舵",
   "x": 460,
   "y": 105,
   "label": [
    0,
    130
   ]
  },
  {
   "id": "arena",
   "name": "天下第一锅擂台",
   "x": 1332,
   "y": 769,
   "label": [
    0,
    -190
   ]
  }
 ],
 "routes": [
  [
   "shop",
   "market"
  ],
  [
   "market",
   "river"
  ],
  [
   "river",
   "village"
  ],
  [
   "village",
   "hq"
  ],
  [
   "hq",
   "arena"
  ]
 ]
};
