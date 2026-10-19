# M13 · 平涂场景 + 火锅店重标碰撞 + 平涂 UI

- 场景：assets/bg_room.png / bg_battle.png / bg_worldmap.png = art/ch7/*_flat.png（md5 一致）；data/worldmap_art.js 来自 art/ch7/map_flat.json。
- 火锅店（map.js）：四张火锅桌和红凳已画进底图，去掉旧中央桌贴图；桌凳格 + 桌后会被挡住的格标为不可走（用底图非地板像素覆盖率 + 人物身体遮挡测试算出）；
  「火锅桌」交互指左上那桌（点桌面也能触发）；店门移到前沿空地 (7,12)/(8,12)；老码头进店落脚 (7,10)(6,11)(8,11)；满掌柜站位不变。
  空白木匾由程序写「椒麻鸡火锅」；门帘贴图坐标不变（新图门洞同位）。旧存档若站在新桌上，自动退回出生点。
- 大地图：data/worldmap.js artRouteVia 按平涂底图水面掩膜 A* 重算，陆路段 0 水面，只有古渡两段 ≤150px 渡船。
- 平涂 UI：css/ui_flat.css（设计规范原样）+ css/ui_flat_m13.css（接到 M12 DOM）；HUD 圆钮/交谈钮/面板全用 CSS 画，不再用占位 PNG；
  对话框挪到屏幕层（手机 CSS 像素：正文 20px/1.7、名字牌椒红胶囊、选项 18px），被章节卡/黑场/战斗/小游戏盖住时自动让位。
- 自测：tools/selftest_m13.py（截图在 screenshots/）。
