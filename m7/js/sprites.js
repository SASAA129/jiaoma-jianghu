// 素材加载 + 缺图占位绘制。缺图/加载失败都不会抛错，自动退回代码占位。
(function () {
  var ASSETS = window.ASSETS || {};
  var imgs = {};       // name -> {img, meta, ok}
  var listeners = [];

  function load(name) {
    var meta = ASSETS[name];
    if (!meta) return;
    var rec = { meta: meta, ok: false, failed: false, img: new Image() };
    rec.img.onload = function () { rec.ok = true; listeners.forEach(function (f) { f(name); }); };
    rec.img.onerror = function () { rec.failed = true; console.warn("[素材] 加载失败，改用占位：" + meta.src); };
    rec.img.src = meta.src;
    imgs[name] = rec;
  }
  Object.keys(ASSETS).forEach(load);

  function get(name) { var r = imgs[name]; return r && r.ok ? r : null; }
  function status() {
    var o = {};
    Object.keys(imgs).forEach(function (k) { o[k] = imgs[k].ok ? "ok" : (imgs[k].failed ? "failed" : "loading"); });
    return o;
  }

  // ---------- 占位绘制 ----------
  function placeholderPerson(ctx, x, y, H, color, name, flip, back) {
    ctx.save();
    ctx.translate(x, y);
    if (flip) ctx.scale(-1, 1);
    var headR = H * 0.085, w = H * 0.30;
    ctx.lineWidth = Math.max(2, H * 0.012);
    ctx.strokeStyle = "#2b2622";
    // 腿
    ctx.fillStyle = "#3a332d";
    ctx.fillRect(-w * 0.28, -H * 0.18, w * 0.2, H * 0.18);
    ctx.fillRect(w * 0.08, -H * 0.18, w * 0.2, H * 0.18);
    // 袍子
    ctx.beginPath();
    ctx.moveTo(-w * 0.35, -H * 0.80);
    ctx.lineTo(w * 0.35, -H * 0.80);
    ctx.lineTo(w * 0.55, -H * 0.16);
    ctx.lineTo(-w * 0.55, -H * 0.16);
    ctx.closePath();
    ctx.fillStyle = color; ctx.fill(); ctx.stroke();
    // 腰带
    ctx.fillStyle = "#2b2622";
    ctx.fillRect(-w * 0.42, -H * 0.52, w * 0.84, H * 0.03);
    // 头
    ctx.beginPath();
    ctx.arc(0, -H * 0.80 - headR, headR, 0, Math.PI * 2);
    ctx.fillStyle = back ? "#2b2622" : "#f1d9bf"; ctx.fill(); ctx.stroke();
    if (!back) { ctx.beginPath(); ctx.arc(0, -H * 0.80 - headR * 1.25, headR, Math.PI * 1.05, Math.PI * 1.95); ctx.fillStyle = "#2b2622"; ctx.fill(); }
    ctx.restore();
    // 名字（不翻转）
    ctx.save();
    ctx.font = "bold " + Math.round(H * 0.075) + "px KaiTi, 'Noto Serif CJK SC', serif";
    ctx.textAlign = "center"; ctx.textBaseline = "middle";
    ctx.fillStyle = "#fff8ea";
    ctx.fillText(name, x, y - H * 0.62);
    ctx.restore();
  }

  function isoBox(ctx, m, x0, y0, w, h, z, top, left, right) {
    var G = window.Iso.gridToScreen;
    var a = G(x0, y0, m), b = G(x0 + w, y0, m), c = G(x0 + w, y0 + h, m), d = G(x0, y0 + h, m);
    ctx.lineWidth = 2; ctx.strokeStyle = "#2b2622";
    ctx.beginPath(); ctx.moveTo(d.x, d.y); ctx.lineTo(c.x, c.y); ctx.lineTo(c.x, c.y - z); ctx.lineTo(d.x, d.y - z); ctx.closePath();
    ctx.fillStyle = left; ctx.fill(); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(c.x, c.y); ctx.lineTo(b.x, b.y); ctx.lineTo(b.x, b.y - z); ctx.lineTo(c.x, c.y - z); ctx.closePath();
    ctx.fillStyle = right; ctx.fill(); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(a.x, a.y - z); ctx.lineTo(b.x, b.y - z); ctx.lineTo(c.x, c.y - z); ctx.lineTo(d.x, d.y - z); ctx.closePath();
    ctx.fillStyle = top; ctx.fill(); ctx.stroke();
    return { a: a, b: b, c: c, d: d };
  }

  function placeholderTable(ctx, m, p) {
    var s = 0.22, inset = 0.5;
    // 四张凳子
    [[p.x + p.w / 2 - s, p.y - 0.05], [p.x - 0.05, p.y + p.h / 2 - s], [p.x + p.w - 2 * s + 0.05, p.y + p.h / 2 - s], [p.x + p.w / 2 - s, p.y + p.h - 2 * s + 0.05]]
      .forEach(function (q) { isoBox(ctx, m, q[0], q[1], 2 * s, 2 * s, m.tileH * 0.55, "#c0452f", "#8e2d1f", "#a5372a"); });
    var r = isoBox(ctx, m, p.x + inset, p.y + inset, p.w - 2 * inset, p.h - 2 * inset, m.tileH * 0.95, "#8a6a4a", "#5e4630", "#6f533a");
    var cx = (r.a.x + r.c.x) / 2, cy = (r.a.y + r.c.y) / 2 - m.tileH * 0.95;
    ctx.beginPath(); ctx.ellipse(cx, cy, m.tileW * 0.32, m.tileH * 0.32, 0, 0, Math.PI * 2);
    ctx.fillStyle = "#c98a3c"; ctx.fill(); ctx.stroke();
    ctx.beginPath(); ctx.ellipse(cx, cy, m.tileW * 0.25, m.tileH * 0.25, 0, 0, Math.PI * 2);
    ctx.fillStyle = "#b22a18"; ctx.fill();
    ctx.font = "bold 26px KaiTi, 'Noto Serif CJK SC', serif"; ctx.textAlign = "center"; ctx.fillStyle = "#fff8ea";
    ctx.fillText("火锅桌", cx, cy + m.tileH * 0.9);
  }

  function placeholderRoom(ctx, m, sign) {
    var W = m.world.w, H = m.world.h, G = window.Iso.gridToScreen;
    ctx.fillStyle = "#efe6d2"; ctx.fillRect(0, 0, W, H);
    // 地板：比网格大一圈
    var e = 2, a = G(-e, -e, m), b = G(m.cols + e, -e, m), c = G(m.cols + e, m.rows + e, m), d = G(-e, m.rows + e, m);
    // 墙
    var wallH = 300, o = G(0, 0, m), r = G(m.cols + e, 0, m), l = G(0, m.rows + e, m);
    ctx.fillStyle = "#e3d6bb"; ctx.strokeStyle = "#2b2622"; ctx.lineWidth = 3;
    ctx.beginPath(); ctx.moveTo(l.x, l.y); ctx.lineTo(o.x, o.y); ctx.lineTo(o.x, o.y - wallH); ctx.lineTo(l.x, l.y - wallH); ctx.closePath(); ctx.fill(); ctx.stroke();
    ctx.fillStyle = "#d8c9aa";
    ctx.beginPath(); ctx.moveTo(o.x, o.y); ctx.lineTo(r.x, r.y); ctx.lineTo(r.x, r.y - wallH); ctx.lineTo(o.x, o.y - wallH); ctx.closePath(); ctx.fill(); ctx.stroke();
    ctx.fillStyle = "#d9b98c";
    ctx.beginPath(); ctx.moveTo(o.x, o.y); ctx.lineTo(r.x, r.y); ctx.lineTo(c.x, c.y); ctx.lineTo(l.x, l.y); ctx.closePath(); ctx.fill();
    // 地块菱形
    ctx.strokeStyle = "rgba(90,60,30,.25)"; ctx.lineWidth = 1.5;
    for (var y = 0; y < m.rows; y++) for (var x = 0; x < m.cols; x++) {
      var p0 = G(x, y, m), p1 = G(x + 1, y, m), p2 = G(x + 1, y + 1, m), p3 = G(x, y + 1, m);
      ctx.beginPath(); ctx.moveTo(p0.x, p0.y); ctx.lineTo(p1.x, p1.y); ctx.lineTo(p2.x, p2.y); ctx.lineTo(p3.x, p3.y); ctx.closePath(); ctx.stroke();
    }
    // 招牌
    if (sign && sign.hit) {
      var h = sign.hit;
      ctx.fillStyle = "#2b2622"; ctx.fillRect(h.x, h.y + h.h * 0.2, h.w, h.h * 0.55);
      ctx.strokeStyle = "#c9a45c"; ctx.lineWidth = 4; ctx.strokeRect(h.x + 6, h.y + h.h * 0.2 + 6, h.w - 12, h.h * 0.55 - 12);
      ctx.fillStyle = "#e0bd6e"; ctx.font = "bold " + Math.round(h.h * 0.32) + "px KaiTi, 'Noto Serif CJK SC', serif";
      ctx.textAlign = "center"; ctx.textBaseline = "middle"; ctx.fillText("椒麻鸡火锅", h.x + h.w / 2, h.y + h.h * 0.48);
    }
    ctx.fillStyle = "rgba(43,38,34,.55)"; ctx.font = "20px sans-serif"; ctx.textAlign = "left";
    ctx.fillText("[占位] bg_room.png 未到位", 20, H - 150);
  }

  // ---------- M4 占位：夜市背景 / 摊位 / 酱坛（只在缺图时使用） ----------
  function placeholderStall(ctx, m, p) {
    var G = window.Iso.gridToScreen;
    isoBox(ctx, m, p.x + .2, p.y + .2, p.w - .4, p.h - .4, m.tileH * 1.1, "#8a6a4a", "#5e4630", "#6f533a");
    var a = G(p.x, p.y, m), b = G(p.x + p.w, p.y, m), c = G(p.x + p.w, p.y + p.h, m), d = G(p.x, p.y + p.h, m), z = m.tileH * 3.6;
    ctx.strokeStyle = "#2b2622"; ctx.lineWidth = 3;
    [a, b, c, d].forEach(function (q) { ctx.beginPath(); ctx.moveTo(q.x, q.y); ctx.lineTo(q.x, q.y - z); ctx.stroke(); });
    ctx.beginPath(); ctx.moveTo(a.x, a.y - z - 20); ctx.lineTo(b.x, b.y - z - 20); ctx.lineTo(c.x, c.y - z); ctx.lineTo(d.x, d.y - z); ctx.closePath();
    ctx.fillStyle = p.awning || "#b0281c"; ctx.fill(); ctx.stroke();
    ctx.font = "bold 26px KaiTi, 'Noto Serif CJK SC', serif"; ctx.textAlign = "center"; ctx.textBaseline = "middle";
    ctx.fillStyle = "#fff8ea"; ctx.fillText(p.label || "", (a.x + c.x) / 2, (a.y + c.y) / 2 - z - 4);
  }
  function placeholderJars(ctx, m, p) {
    var G = window.Iso.gridToScreen, c = G(p.x + .5, p.y + .5, m);
    [[-18, 0], [18, 4], [0, -14]].forEach(function (o) {
      ctx.fillStyle = "#6b2a1a"; ctx.strokeStyle = "#2b2622"; ctx.lineWidth = 2;
      ctx.beginPath(); ctx.ellipse(c.x + o[0], c.y + o[1] - 26, 20, 28, 0, 0, Math.PI * 2); ctx.fill(); ctx.stroke();
      ctx.fillStyle = "#b0281c"; ctx.fillRect(c.x + o[0] - 12, c.y + o[1] - 60, 24, 10);
    });
  }
  function placeholderMarket(ctx, m, t) {
    var W = m.world.w, H = m.world.h, G = window.Iso.gridToScreen;
    var sky = ctx.createLinearGradient(0, 0, 0, H); sky.addColorStop(0, "#141a2e"); sky.addColorStop(1, "#2a2f45");
    ctx.fillStyle = sky; ctx.fillRect(0, 0, W, H);
    // 江面（右上）
    ctx.fillStyle = "#1d2c4a"; ctx.beginPath(); ctx.moveTo(W * .55, 0); ctx.lineTo(W, 0); ctx.lineTo(W, H * .35); ctx.closePath(); ctx.fill();
    // 石板地
    var e = 1, a = G(-e, -e, m), b = G(m.cols + e, -e, m), c = G(m.cols + e, m.rows + e, m), d = G(-e, m.rows + e, m);
    ctx.fillStyle = "#5a5560"; ctx.beginPath(); ctx.moveTo(a.x, a.y); ctx.lineTo(b.x, b.y); ctx.lineTo(c.x, c.y); ctx.lineTo(d.x, d.y); ctx.closePath(); ctx.fill();
    ctx.strokeStyle = "rgba(20,20,30,.35)"; ctx.lineWidth = 1.5;
    for (var y = 0; y < m.rows; y++) for (var x = 0; x < m.cols; x++) {
      var p0 = G(x, y, m), p1 = G(x + 1, y, m), p2 = G(x + 1, y + 1, m), p3 = G(x, y + 1, m);
      ctx.beginPath(); ctx.moveTo(p0.x, p0.y); ctx.lineTo(p1.x, p1.y); ctx.lineTo(p2.x, p2.y); ctx.lineTo(p3.x, p3.y); ctx.closePath(); ctx.stroke();
    }
    // 后排吊脚楼 + 灯笼
    var o = G(0, 0, m), l = G(0, m.rows, m);
    ctx.fillStyle = "#3a2a22"; ctx.beginPath(); ctx.moveTo(l.x, l.y); ctx.lineTo(o.x, o.y); ctx.lineTo(o.x, o.y - 250); ctx.lineTo(l.x, l.y - 250); ctx.closePath(); ctx.fill();
    for (var i = 0; i < 8; i++) {
      var q = G(0, 1 + i * 1.6, m), k = (Math.sin((t || 0) * 2 + i) + 1) / 2;
      ctx.fillStyle = "rgba(230,80,40," + (0.75 + k * 0.25) + ")"; ctx.beginPath(); ctx.ellipse(q.x, q.y - 150, 13, 18, 0, 0, Math.PI * 2); ctx.fill();
    }
    ctx.fillStyle = "rgba(220,200,170,.65)"; ctx.font = "20px sans-serif"; ctx.textAlign = "left";
    ctx.fillText("[占位] bg_market.png 未到位", 20, H - 150);
  }

  // 在一个小 canvas 上画圆形头像：有图裁头部，没图画圆头像+名字
  function drawPortrait(cv, spriteName, fallbackName, color) {
    var ctx = cv.getContext("2d"), w = cv.width, h = cv.height;
    ctx.clearRect(0, 0, w, h);
    ctx.save();
    ctx.beginPath(); ctx.arc(w / 2, h / 2, w / 2, 0, Math.PI * 2); ctx.clip();
    ctx.fillStyle = "#e9dcc0"; ctx.fillRect(0, 0, w, h);
    var r = spriteName && get(spriteName);
    if (r && r.meta.head) {
      var hb = r.meta.head;
      ctx.drawImage(r.img, hb.x, hb.y, hb.s, hb.s, 0, 0, w, h);
    } else {
      ctx.fillStyle = color || "#6b5f52"; ctx.fillRect(0, 0, w, h);
      ctx.fillStyle = "#fff8ea"; ctx.font = "bold " + Math.round(w * 0.42) + "px KaiTi, 'Noto Serif CJK SC', serif";
      ctx.textAlign = "center"; ctx.textBaseline = "middle"; ctx.fillText((fallbackName || "?").slice(0, 1), w / 2, h / 2 + 2);
    }
    ctx.restore();
  }


  function placeholderRiver(ctx, m, t) {
    var W = m.world.w, H = m.world.h;
    ctx.fillStyle = "#0d1a28"; ctx.fillRect(0, 0, W, H);
    ctx.fillStyle = "#1a3040"; ctx.fillRect(0, H*0.45, W, H*0.55);
    ctx.fillStyle = "#3d2e22"; ctx.beginPath(); ctx.moveTo(200, H*0.55); ctx.lineTo(W-80, H*0.5); ctx.lineTo(W-120, H*0.9); ctx.lineTo(160, H*0.95); ctx.closePath(); ctx.fill();
    ctx.fillStyle = "#c9a45c"; ctx.beginPath(); ctx.arc(W*0.78, H*0.18, 36, 0, Math.PI*2); ctx.fill();
    ctx.fillStyle = "rgba(243,234,214,.7)"; ctx.font = "28px KaiTi, serif"; ctx.fillText("[占位] bg_river.png 未到位", 20, H - 40);
  }

  function placeholderVillage(ctx, m, t) {
    var W = m.world.w, H = m.world.h;
    ctx.fillStyle = "#c4a574"; ctx.fillRect(0, 0, W, H);
    ctx.fillStyle = "#6a8a4a"; ctx.fillRect(0, 0, W, H*0.35);
    ctx.fillStyle = "#8a6a3a"; ctx.fillRect(200, H*0.4, W-400, H*0.5);
    ctx.fillStyle = "#b0281c"; ctx.font = "22px KaiTi, serif"; ctx.fillText("[占位] bg_village.png", 20, H - 40);
  }

  function placeholderHq(ctx, m, t) {
    var W = m.world.w, H = m.world.h;
    ctx.fillStyle = "#2a1210"; ctx.fillRect(0, 0, W, H);
    ctx.fillStyle = "#5a1a14"; ctx.fillRect(100, 80, W-200, H*0.35);
    ctx.fillStyle = "#8a2018"; ctx.beginPath(); ctx.ellipse(W/2, H*0.55, 120, 50, 0, 0, Math.PI*2); ctx.fill();
    ctx.fillStyle = "#c9a45c"; ctx.font = "22px KaiTi, serif"; ctx.fillText("[占位] bg_hq.png", 20, H - 40);
  }
  window.Sprites = {
    get: get, status: status, onLoad: function (f) { listeners.push(f); },
    placeholderPerson: placeholderPerson, placeholderTable: placeholderTable,
    placeholderRoom: placeholderRoom, drawPortrait: drawPortrait,
    placeholderStall: placeholderStall, placeholderJars: placeholderJars, placeholderMarket: placeholderMarket,
    placeholderRiver: placeholderRiver, placeholderVillage: placeholderVillage, placeholderHq: placeholderHq
  };
})();
