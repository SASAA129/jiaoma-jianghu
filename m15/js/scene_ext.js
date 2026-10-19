// M15：第 2–6 章铺满。延展层 assets/ext_<scene>.png + 掩膜 data/scene_outside.js（tools/make_scene_ext.py 生成，按当前生效底图取色）。
//   - 画法：先铺视野里延展图之外的部分（同色平涂渐变），再画底图，再盖延展层（底图内容处透明，只盖上下延展区和底角空地）。
//   - 延展区（含底图外一切）不可走（rebuild 标障碍）、不可点（clickWorld 返回 "outside"）。
(function () {
  var O = window.SCENE_OUTSIDE || {}, A = window.ASSETS || {};
  var maps = { market: window.MAP_MARKET, river: window.MAP_RIVER, village: window.MAP_VILLAGE, hq: window.MAP_HQ, arena: window.MAP_ARENA };
  Object.keys(O).forEach(function (id) {
    var o = O[id], M = maps[id]; if (!M) return;
    var key = "ext_" + id;
    if (!A[key]) A[key] = { file: key + ".png", from: "m15-scene-ext", w: 1536, h: 1024 + 2 * o.pad, ax: 0, ay: 0, src: "assets/" + key + ".png" };
    M.bgOverlay = key;
    M.bgExtRect = { x: 0, y: -o.pad, w: 1536, h: 1024 + 2 * o.pad };
    M.extColors = { top: o.top, bottom: o.bottom, indoor: !!o.indoor };
    M.outsideAt = function (x, y) {
      var c = Math.floor(x / o.cell), r = Math.floor((y + o.pad) / o.cell);
      if (c < 0 || r < 0 || c >= o.w || r >= o.h) return true;
      return o.rows[r].charAt(c) === "1";
    };
  });
})();
