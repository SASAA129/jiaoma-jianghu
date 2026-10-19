// M13：铺满手机屏幕（无黑边）的公共工具。
// - Fill.viewport()：当前可见视口（CSS px），优先 visualViewport（未缩放时），地址栏收起/展开、旋转都会变。
// - Fill.view(...)：按设备比例算相机视野（cover，但关键区域不裁），超出地图的方向用 Fill.drawExtended 补边缘延伸色。
// - Fill.fs：全屏（requestFullscreen + webkit 前缀，能锁就锁横屏）；iPhone Safari 不支持元素全屏 → 设置里提示「添加到主屏幕」。
(function () {
  function viewport() {
    var w = window.innerWidth, h = window.innerHeight, vv = window.visualViewport;
    if (vv && vv.width > 0 && vv.height > 0 && Math.abs((vv.scale || 1) - 1) < 0.01) { w = vv.width; h = vv.height; }
    return { w: Math.max(1, Math.round(w)), h: Math.max(1, Math.round(h)) };
  }
  var edgeCache = typeof WeakMap !== "undefined" ? new WeakMap() : null;
  // 每条边的平均色（平涂延伸色）
  function edgeColors(img) {
    var c = edgeCache && edgeCache.get(img); if (c) return c;
    var out = { top: "#efe6d2", bottom: "#efe6d2", left: "#efe6d2", right: "#efe6d2" };
    try {
      var cv = document.createElement("canvas"); cv.width = 32; cv.height = 32;
      var x = cv.getContext("2d"); x.drawImage(img, 0, 0, 32, 32);
      var d = x.getImageData(0, 0, 32, 32).data;
      var avg = function (pts) {
        var r = 0, g = 0, b = 0; pts.forEach(function (p) { var i = (p[1] * 32 + p[0]) * 4; r += d[i]; g += d[i + 1]; b += d[i + 2]; });
        var n = pts.length; r = Math.max(24, r / n | 0); g = Math.max(20, g / n | 0); b = Math.max(18, b / n | 0);   // 不会出现纯黑
        return "rgb(" + r + "," + g + "," + b + ")";
      };
      var T = [], B = [], L = [], R = [];
      for (var i = 0; i < 32; i++) { T.push([i, 0]); B.push([i, 31]); L.push([0, i]); R.push([31, i]); }
      out = { top: avg(T), bottom: avg(B), left: avg(L), right: avg(R) };
    } catch (e) {}
    if (edgeCache) edgeCache.set(img, out);
    return out;
  }
  // 在世界坐标里画底图 (0,0,W,H)，并把视野 v（世界坐标矩形）里超出底图的部分用边缘延伸色补满
  function drawExtended(ctx, img, W, H, v, fallback) {
    ctx.fillStyle = fallback || "#efe6d2";
    ctx.fillRect(v.x - 2, v.y - 2, v.w + 4, v.h + 4);
    if (!img) return;
    var iw = img.naturalWidth || img.width, ih = img.naturalHeight || img.height, kx = iw / W, ky = ih / H, E = edgeColors(img), s = 3;
    var x0 = v.x - 2, y0 = v.y - 2, x1 = v.x + v.w + 2, y1 = v.y + v.h + 2;
    function strip(sx, sy, sw, sh, dx, dy, dw, dh) { if (dw > 0 && dh > 0) ctx.drawImage(img, sx, sy, sw, sh, dx, dy, dw, dh); }
    function fade(dx, dy, dw, dh, col, dir) {
      if (dw <= 0 || dh <= 0) return;
      var g;
      if (dir === "top") g = ctx.createLinearGradient(0, dy + dh, 0, dy);
      else if (dir === "bottom") g = ctx.createLinearGradient(0, dy, 0, dy + dh);
      else if (dir === "left") g = ctx.createLinearGradient(dx + dw, 0, dx, 0);
      else g = ctx.createLinearGradient(dx, 0, dx + dw, 0);
      var span = dir === "top" || dir === "bottom" ? dh : dw, k = Math.min(1, 60 / Math.max(1, span));
      g.addColorStop(0, "rgba(0,0,0,0)"); g.addColorStop(k, col); g.addColorStop(1, col);
      // 用 source-over 叠一层由透明渐变到平均色的平涂色
      ctx.save(); ctx.fillStyle = col; ctx.globalAlpha = 1;
      var tmp = g; ctx.fillStyle = tmp;
      ctx.fillRect(dx, dy, dw, dh); ctx.restore();
    }
    if (y0 < 0) { strip(0, 0, iw, s, 0, y0, W, -y0); fade(0, y0, W, -y0, E.top, "top"); }
    if (y1 > H) { strip(0, ih - s, iw, s, 0, H, W, y1 - H); fade(0, H, W, y1 - H, E.bottom, "bottom"); }
    var ty = Math.max(0, y0), by = Math.min(H, y1);
    if (x0 < 0) { strip(0, ty * ky, s, (by - ty) * ky, x0, ty, -x0, by - ty); fade(x0, ty, -x0, by - ty, E.left, "left"); }
    if (x1 > W) { strip(iw - s, ty * ky, s, (by - ty) * ky, W, ty, x1 - W, by - ty); fade(W, ty, x1 - W, by - ty, E.right, "right"); }
    // 四角：平均色
    ctx.fillStyle = E.top;
    if (x0 < 0 && y0 < 0) ctx.fillRect(x0, y0, -x0, -y0);
    if (x1 > W && y0 < 0) ctx.fillRect(W, y0, x1 - W, -y0);
    ctx.fillStyle = E.bottom;
    if (x0 < 0 && y1 > H) ctx.fillRect(x0, H, -x0, y1 - H);
    if (x1 > W && y1 > H) ctx.fillRect(W, H, x1 - W, y1 - H);
    ctx.drawImage(img, 0, 0, W, H);
  }
  // 屏幕（宽 SW × 高 SH，任意单位）看世界（W×H）：
  //   cover 缩放，但不小于 contain、不把 safe（世界坐标矩形）裁掉；中心尽量放在 focus，镜头限制在地图里。
  //   返回 { k: 每世界 px 对应的屏幕单位, x, y, w, h: 视野（世界坐标）}
  function view(SW, SH, W, H, opt) {
    opt = opt || {};
    var contain = Math.min(SW / W, SH / H), cover = Math.max(SW / W, SH / H), k = cover;
    if (opt.safe) k = Math.min(k, SW / opt.safe.w, SH / opt.safe.h);
    if (opt.maxZoom) k = Math.min(k, contain * opt.maxZoom);
    k = Math.max(contain, k);
    var vw = SW / k, vh = SH / k, f = opt.focus || { x: W / 2, y: H / 2 };
    function axis(c, span, total, s0, s1) {
      var x = c - span / 2;
      if (span >= total) return (total - span) / 2;                // 地图比屏幕小 → 居中，两侧补延伸色
      if (s0 !== undefined) { x = Math.min(x, s0); x = Math.max(x, s1 - span); }   // 关键区域不出画
      return Math.max(0, Math.min(total - span, x));                // 镜头限制在地图里
    }
    var sf = opt.safe;
    return { k: k, w: vw, h: vh,
      x: axis(f.x, vw, W, sf && sf.x, sf && sf.x + sf.w),
      y: axis(f.y, vh, H, sf && sf.y, sf && sf.y + sf.h) };
  }

  // ---------- 全屏 ----------
  var ua = navigator.userAgent || "";
  var isIOS = /iPad|iPhone|iPod/.test(ua) || (navigator.platform === "MacIntel" && navigator.maxTouchPoints > 1);
  var de = document.documentElement;
  function supported() { return !!(de.requestFullscreen || de.webkitRequestFullscreen || de.webkitEnterFullscreen); }
  function active() { return !!(document.fullscreenElement || document.webkitFullscreenElement); }
  function standalone() { return !!((window.matchMedia && (matchMedia("(display-mode: fullscreen)").matches || matchMedia("(display-mode: standalone)").matches)) || navigator.standalone); }
  function lockLandscape() {
    try { if (screen.orientation && screen.orientation.lock) screen.orientation.lock("landscape").catch(function () {}); } catch (e) {}
  }
  function enter() {
    var r;
    try {
      if (de.requestFullscreen) r = de.requestFullscreen({ navigationUI: "hide" });
      else if (de.webkitRequestFullscreen) r = de.webkitRequestFullscreen();
    } catch (e) {}
    if (r && r.then) r.then(lockLandscape).catch(function () {}); else setTimeout(lockLandscape, 300);
    return !!r || supported();
  }
  function exit() { try { (document.exitFullscreen || document.webkitExitFullscreen || function () {}).call(document); } catch (e) {} }
  function toggle() { if (active()) exit(); else enter(); }
  var iosHint = "iPhone 的 Safari 不支持网页全屏：点 Safari 底部「分享」→「添加到主屏幕」，再从主屏幕图标打开，就没有地址栏了。";

  window.Fill = { viewport: viewport, view: view, drawExtended: drawExtended, edgeColors: edgeColors,
    fs: { supported: supported, active: active, standalone: standalone, enter: enter, exit: exit, toggle: toggle, isIOS: isIOS, iosHint: iosHint } };
})();
