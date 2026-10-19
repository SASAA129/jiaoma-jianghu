// M13 v2 铺满：火锅店延展图 assets/bg_room_ext.png（tools/make_wall_ext.py 生成；锁定底图不动）
//   - 底图上下各 pad px 的延展 + 墙线外的米色空地 → 深木墙色平涂渐变（#5A4130 → #3B2C22），墙线外不铺地板；
//   - 地板只在墙线内侧往下延展（沿左墙 / 右地板沿收拢到地板下角）。
//   - 墙外掩膜 data/room_outside.js：该区域不可走（rebuild 标障碍）、不可点（clickWorld 直接忽略，不寻路不弹交互）。
(function () {
  var O = window.ROOM_OUTSIDE, pad = (O && O.pad) || 0;
  if (window.ASSETS && !window.ASSETS.bg_room_ext) window.ASSETS.bg_room_ext = { file: "bg_room_ext.png", from: "m13-wall-ext", w: 1536, h: 1024 + 2 * pad, ax: 0, ay: 0, src: "assets/bg_room_ext.png" };
  var shop = window.MAP_SHOP || window.MAP;
  if (shop && O) {
    shop.bgExt = "bg_room_ext";
    shop.bgExtRect = { x: 0, y: -pad, w: 1536, h: 1024 + 2 * pad };
    shop.wallColors = [O.c0 || "#5A4130", O.c1 || "#3B2C22"];
    // 世界坐标点是否在墙线外（延展图之外一律算墙外）
    shop.outsideAt = function (x, y) {
      var c = Math.floor(x / O.cell), r = Math.floor((y + O.pad) / O.cell);
      if (c < 0 || r < 0 || c >= O.w || r >= O.h) return true;
      return O.rows[r].charAt(c) === "1";
    };
  }
})();
