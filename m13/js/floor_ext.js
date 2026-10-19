// M13 铺满细化：火锅店底部两角的米色空地已由 tools/make_floor_ext.py 按等距地板规律续铺 → assets/bg_room_ext.png（运行时用，锁定底图不动）。
// 超出底图的部分（极端比例 / 编辑器）由 Fill.drawExtended 用同一套地板参数（assets/floor_ext.json 的值）续铺。
(function () {
  if (window.ASSETS && !window.ASSETS.bg_room_ext) window.ASSETS.bg_room_ext = { file: "bg_room_ext.png", from: "m13-floor-ext", w: 1536, h: 1024, ax: 0, ay: 0, src: "assets/bg_room_ext.png" };
  var shop = window.MAP_SHOP || window.MAP;
  if (shop) { shop.bgExt = "bg_room_ext"; shop.floorExt = { base: [226, 167, 105], line: [203, 150, 94], phase: 55, tileH: 62, slope: 0.5 }; }
})();
