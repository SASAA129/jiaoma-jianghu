// M9 江湖地图：底栏「地图」/ 热键 M。按章节进度解锁节点；当前位置旗、当前目标红点；点已解锁节点 → 淡出淡入快速旅行。
// 底图：assets/bg_worldmap.png 存在则用它，否则代码画一张清爽的斜 45° 渝州全图（暖橙红 / 木色 / 江水蓝绿）。
(function () {
  var W = window.WORLDMAP || { nodes: [], routes: [] }, ART = window.WORLDMAP_ART;
  var root, cv, open = false, raf = 0, baseCanvas = null;
  function flags() { return (window.Dialog && window.Dialog.flags) || {}; }
  function nodes() {
    var list = W.nodes.map(function (n) { return JSON.parse(JSON.stringify(n)); });
    if (ART && ART.nodes) ART.nodes.forEach(function (a) {
      var n = list.filter(function (q) { return q.id === a.id; })[0];
      if (n) { n.x = a.x; n.y = a.y; if (a.name) n.name = a.name; if (a.label) n.label = a.label; }
    });
    return list;
  }
  function routes() { return (ART && ART.routes) || W.routes; }
  function unlocked(n) { var f = flags(); return (window.Game && window.Game.scene && window.Game.scene() === n.id) || (n.unlock || []).every(function (k) { return f[k]; }); }
  function targetScene() {
    var o = window.Story && window.Story.objective ? window.Story.objective() : null;
    if (!o) return null;
    return o.scene || "shop";
  }
  function lockReason() {
    if (window.Dialog && window.Dialog.isOpen()) return "此刻走不开";
    if (window.Battle && window.Battle.isOpen()) return "此刻走不开";
    if (window.MiniGames && window.MiniGames.isOpen()) return "此刻走不开";
    if (window.Story && window.Story.pending && window.Story.pending().length) return "此刻走不开";
    if (window.Story && window.Story.isCardOpen && window.Story.isCardOpen()) return "此刻走不开";
    var f = flags();
    if (!f.ch1_done && ["A", "B", "C"].some(function (r) { return f["route_" + r]; })) return "此刻走不开——锦囊还没找回来";
    if (f.c6_rounds && !f.c6_final_win) return "此刻走不开——赤老三堵在擂台上";
    return null;
  }

  // ---------- 代码画的占位底图 ----------
  function iso(cx, cy, w, h) { return [[cx, cy - h / 2], [cx + w / 2, cy], [cx, cy + h / 2], [cx - w / 2, cy]]; }
  function poly(c, pts, fill, stroke, lw) {
    c.beginPath(); pts.forEach(function (p, i) { i ? c.lineTo(p[0], p[1]) : c.moveTo(p[0], p[1]); }); c.closePath();
    if (fill) { c.fillStyle = fill; c.fill(); } if (stroke) { c.strokeStyle = stroke; c.lineWidth = lw || 2; c.stroke(); }
  }
  function house(c, x, y, s, roof) {
    poly(c, [[x - s, y], [x, y + s * .5], [x, y + s * 1.2], [x - s, y + s * .7]], "#e9d3ad", "#8a5a34", 1.5);
    poly(c, [[x, y + s * .5], [x + s, y], [x + s, y + s * .7], [x, y + s * 1.2]], "#d8b98a", "#8a5a34", 1.5);
    poly(c, [[x - s * 1.12, y + s * .02], [x, y - s * .62], [x + s * 1.12, y + s * .02], [x, y + s * .6]], roof || "#c8462a", "#7a2a18", 1.5);
  }
  function mountain(c, x, y, s, col) {
    poly(c, [[x - s, y], [x - s * .1, y - s * 1.15], [x + s * .15, y - s * .9], [x + s, y]], col || "#7f9a5a", "#4f6a38", 2);
    poly(c, [[x - s * .1, y - s * 1.15], [x + s * .15, y - s * .9], [x + s * .1, y - s * .55], [x - s * .25, y - s * .7]], "rgba(255,255,255,.35)");
  }
  function tree(c, x, y, s) { c.fillStyle = "#6f8f45"; c.beginPath(); c.ellipse(x, y - s, s * .7, s, 0, 0, Math.PI * 2); c.fill(); c.fillStyle = "#8a5a34"; c.fillRect(x - 2, y - s * .2, 4, s * .5); }
  function drawBase() {
    var b = document.createElement("canvas"); b.width = 1536; b.height = 1024; var c = b.getContext("2d");
    var bg = window.Sprites && window.Sprites.get("bg_worldmap");
    if (bg) { c.drawImage(bg.img, 0, 0, 1536, 1024); return b; }
    // 天空 / 远景
    var g = c.createLinearGradient(0, 0, 0, 1024); g.addColorStop(0, "#fbf3e2"); g.addColorStop(1, "#f1e2c4");
    c.fillStyle = g; c.fillRect(0, 0, 1536, 1024);
    // 大陆菱形（斜 45°）
    poly(c, iso(768, 560, 1500, 860), "#e6d3a6", "#c9a97a", 3);
    poly(c, iso(768, 548, 1460, 820), "#ecdcb4");
    // 远山（麻婆岭一带）
    [[1120, 330, 120], [1260, 280, 150], [1380, 360, 110], [1030, 250, 90], [1180, 210, 100]].forEach(function (m) { mountain(c, m[0], m[1], m[2]); });
    [[260, 330, 80], [360, 280, 95], [170, 420, 70]].forEach(function (m) { mountain(c, m[0], m[1], m[2], "#9aa76a"); });
    // 花椒林
    for (var i = 0; i < 14; i++) tree(c, 1080 + (i % 7) * 46, 380 + Math.floor(i / 7) * 34 + (i % 2) * 10, 14);
    // 长江（蓝绿，斜穿全图）
    c.save(); c.lineCap = "round"; c.lineJoin = "round";
    c.strokeStyle = "#5fa9a6"; c.lineWidth = 70;
    c.beginPath(); c.moveTo(80, 900); c.bezierCurveTo(420, 960, 620, 760, 860, 720); c.bezierCurveTo(1080, 680, 1180, 520, 1480, 470); c.stroke();
    c.strokeStyle = "#8cc7bf"; c.lineWidth = 34; c.stroke();
    // 雾江支流
    c.strokeStyle = "#5fa9a6"; c.lineWidth = 26; c.beginPath(); c.moveTo(900, 712); c.bezierCurveTo(960, 560, 1040, 470, 1150, 400); c.stroke();
    c.strokeStyle = "#a7d6cf"; c.lineWidth = 10; c.stroke();
    c.restore();
    // 浪纹
    c.strokeStyle = "rgba(255,255,255,.7)"; c.lineWidth = 2;
    [[300, 905], [520, 860], [700, 770], [1020, 660], [1260, 530]].forEach(function (p) { c.beginPath(); c.arc(p[0], p[1], 9, Math.PI, 0); c.arc(p[0] + 18, p[1], 9, Math.PI, 0); c.stroke(); });
    // 渝州城（房子群）
    [[300, 640, 22], [350, 620, 18], [260, 680, 18], [470, 400, 26], [540, 380, 20], [430, 450, 18], [600, 470, 18], [580, 800, 16], [520, 790, 15],
     [760, 300, 18], [880, 270, 16], [660, 560, 16], [380, 520, 15]].forEach(function (h, i) { house(c, h[0], h[1], h[2], i % 3 ? "#d4572f" : "#b8402a"); });
    // 码头木栈
    c.fillStyle = "#a8794a"; for (i = 0; i < 4; i++) c.fillRect(600 + i * 26, 850 + i * 6, 18, 40);
    // 擂台
    poly(c, iso(820, 330, 130, 64), "#c8462a", "#7a2a18", 2); poly(c, iso(820, 322, 110, 52), "#e9b36a", "#8a5a34", 1.5);
    // 标题框
    c.fillStyle = "rgba(255,250,240,.85)"; c.strokeStyle = "#b8402a"; c.lineWidth = 3;
    c.fillRect(40, 36, 300, 74); c.strokeRect(40, 36, 300, 74);
    c.fillStyle = "#7a2a18"; c.font = "bold 36px KaiTi, 'Noto Serif CJK SC', serif"; c.textBaseline = "middle"; c.fillText(W.title || "江湖地图", 62, 74);
    // 指北
    c.save(); c.translate(1440, 900); c.fillStyle = "#b8402a"; c.beginPath(); c.moveTo(0, -38); c.lineTo(12, 0); c.lineTo(-12, 0); c.closePath(); c.fill();
    c.fillStyle = "#7a2a18"; c.font = "22px KaiTi, serif"; c.textAlign = "center"; c.fillText("北", 0, 26); c.restore();
    return b;
  }
  function drawRoutes(c) {
    var map = {}; nodes().forEach(function (n) { map[n.id] = n; });
    c.save(); c.setLineDash([14, 10]); c.lineWidth = 5; c.lineCap = "round";
    routes().forEach(function (r) {
      var a = map[r[0]], b = map[r[1]]; if (!a || !b) return;
      var on = unlocked(a) && unlocked(b);
      c.strokeStyle = on ? "rgba(176,40,28,.85)" : "rgba(120,110,100,.35)";
      c.beginPath(); c.moveTo(a.x, a.y); c.quadraticCurveTo((a.x + b.x) / 2, Math.min(a.y, b.y) - 40, b.x, b.y); c.stroke();
    });
    c.restore();
  }
  function render() {
    if (!open) return;
    var c = cv.getContext("2d");
    if (!baseCanvas) baseCanvas = drawBase();
    c.clearRect(0, 0, 1536, 1024); c.drawImage(baseCanvas, 0, 0); drawRoutes(c);
    raf = requestAnimationFrame(render);
  }
  // ---------- DOM ----------
  function build() {
    root = document.createElement("div"); root.id = "worldmap"; root.className = "ui hidden";
    root.addEventListener("pointerdown", function (e) { e.stopPropagation(); });
    root.innerHTML = '<canvas class="wm-cv" width="1536" height="1024"></canvas><div class="wm-nodes"></div>' +
      '<div class="wm-legend"><span><i class="wm-flag"></i>当前位置</span><span><i class="wm-dot"></i>当前目标</span><span><i class="wm-lock">锁</i>未解锁</span></div>' +
      '<div class="wm-msg"></div><button class="wm-close">关闭（M）</button>';
    document.getElementById("stage").appendChild(root);
    cv = root.querySelector(".wm-cv");
    root.querySelector(".wm-close").addEventListener("click", close);
    root.querySelector(".wm-nodes").addEventListener("click", function (e) {
      var b = e.target.closest(".wm-node"); if (b) travelTo(b.dataset.node);
    });
  }
  function refreshNodes() {
    var cur = window.Game.scene(), tgt = targetScene();
    root.querySelector(".wm-nodes").innerHTML = nodes().map(function (n) {
      var u = unlocked(n), seen = flags()["map_seen_" + n.id];
      var cls = "wm-node" + (u ? " on" : " locked") + (n.id === cur ? " cur" : "") + (n.id === tgt && n.id !== cur ? " tgt" : "") + (seen ? " seen" : "");
      var lab = n.label || [0, 0];
      return '<button class="' + cls + '" data-node="' + n.id + '" style="left:' + (n.x / 15.36) + "%;top:" + (n.y / 10.24) + '%">' +
        '<span class="wm-badge">' + (u ? n.glyph : "锁") + "</span>" +
        '<span class="wm-name" style="transform:translate(calc(-50% + ' + lab[0] + "px)," + lab[1] + 'px)">' + (u ? n.name : "？？？") + "</span>" +
        (n.id === cur ? '<i class="wm-flag"></i>' : "") + (n.id === tgt && n.id !== cur ? '<i class="wm-dot"></i>' : "") + "</button>";
    }).join("");
  }
  function msg(t) { var m = root.querySelector(".wm-msg"); m.textContent = t || ""; m.classList.toggle("show", !!t); clearTimeout(msg._t); if (t) msg._t = setTimeout(function () { m.classList.remove("show"); }, 1800); }
  function openMap() {
    if (!root) build();
    if (window.Game.hideMenu) window.Game.hideMenu();
    open = true; root.classList.remove("hidden"); refreshNodes(); msg(""); cancelAnimationFrame(raf); render();
    return true;
  }
  function close() { open = false; cancelAnimationFrame(raf); if (root) root.classList.add("hidden"); }
  function travelTo(id) {
    var n = nodes().filter(function (q) { return q.id === id; })[0]; if (!n) return false;
    if (!unlocked(n)) { msg("还没去过这里——跟着剧情走"); return false; }
    if (id === window.Game.scene()) { msg("就在这儿"); return false; }
    var why = lockReason(); if (why) { msg(why); return false; }
    close();
    window.Story.travel(id, n.entrance);
    return true;
  }
  function markSeen(id) { var f = flags(); if (!f["map_seen_" + id]) { f["map_seen_" + id] = true; if (window.Dialog.persist) window.Dialog.persist(); } }
  window.addEventListener("keydown", function (e) {
    if (e.key !== "m" && e.key !== "M") return;
    if (e.target && /input|textarea/i.test(e.target.tagName)) return;
    if (open) { close(); e.preventDefault(); return; }
    if (window.UI && window.UI.blocking && window.UI.blocking()) return;
    if (window.Dialog && window.Dialog.isOpen()) return;
    openMap(); e.preventDefault();
  });
  window.addEventListener("keydown", function (e) { if (open && e.key === "Escape") { close(); e.preventDefault(); e.stopImmediatePropagation(); } }, true);
  window.WorldMap = { open: openMap, close: close, isOpen: function () { return open; }, travelTo: travelTo, markSeen: markSeen,
    state: function () {
      var cur = window.Game.scene();
      return { open: open, art: !!(window.Sprites && window.Sprites.get("bg_worldmap")), artNodes: !!(ART && ART.nodes), current: cur, target: targetScene(), lock: lockReason(),
        nodes: nodes().map(function (n) { return { id: n.id, unlocked: unlocked(n), seen: !!flags()["map_seen_" + n.id] }; }) };
    } };
})();
