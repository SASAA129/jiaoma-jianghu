// M13：头顶名字牌（取代右侧探索栏）。样式 = 游戏设计 Bot 的 css/markers.css（原样，类名 .wx-mk .npc/.prop/.target/.near/.edge-*）；
// 手机补丁（热区 ≥48、字 ≥13、层级）在 css/markers_m13.css。结构按 art/ui_wuxia/marker/README.md：
//   <div class="wx-mk npc|prop [target] [near] [edge-up|down|left|right]"><div class="tag">名字</div><div class="gem"></div></div>
// 每帧把实体世界坐标 → 屏幕 CSS px（Game.worldToClient，已含舞台缩放 / 相机 / dpr）定位到 body 上（position:fixed）。
// 点牌子 = Game.goInteract（A* 走过去 + 原有交互菜单）；点人物 / 物件本身照旧有效（game.js 原逻辑不变）。
(function () {
  // 行为参数集中在这里（外观全在 markers.css，按设计规格替换只需换那份 css）
  var CFG = {
    maxShown: 6,              // 同一时刻最多显示几块（目标优先，其次人物，再按离队长远近）
    minHit: 48,               // 牌子点击区最小宽高（CSS px）；设计稿建议 44，取大者
    nearCells: 3,             // 队长离它 ≤ 几格时加 .near 光晕
    hideWhenAdjacent: true,   // 走到旁边（出现「交谈」大钮）时全部隐藏
    showExits: false,         // 店门等出口不挂牌（底图已画出口牌）；出口是当前目标且在屏外时仍贴边指路
    edgeMargin: 8,            // 贴边时离屏幕边的距离
    hudPad: 6,                // 与 HUD / 底部菜单保持的间距
    maxShift: 140,            // 非目标牌子为了躲 HUD / 人 / 别的牌子最多挪多远（CSS px），再远就不挂
    lift: { npc: 14, prop: 2 },// 牌子底边离锚点的额外抬高（CSS px）
    avoid: ["#hud .hud-tl", "#hud .hud-track", "#hud .hud-tr", "#hud .hud-br", "#hud .hud-talk", "#fs-chip:not(.hidden)", "#rotate-hint:not(.closed)"]
  };
  var layer = null, pool = {}, lastList = [], hudRects = [], hudAt = 0;

  function G() { return window.Game; }
  function ready() { return G() && G().interactables && G().worldToClient && window.Dialog; }
  function hiddenAll() {
    var g = G(), h = window.Hud && window.Hud.state ? window.Hud.state() : null;
    if (window.Dialog.isOpen() || (g.menuOpen && g.menuOpen()) || (g.uiBlocking && g.uiBlocking())) return "ui";
    if (h && (h.hidden || h.panel)) return "hud";
    if (window.Editor && window.Editor.isActive && window.Editor.isActive()) return "editor";
    if (window.WorldMap && window.WorldMap.isOpen && window.WorldMap.isOpen()) return "map";
    if (CFG.hideWhenAdjacent && g.nearestInteractable && g.nearestInteractable()) return "near";
    return "";
  }
  function anchorWorld(it) {
    if (it.hit) return { x: it.hit.x + it.hit.w / 2, y: it.hit.y };       // README：hit 顶边中点
    return G().anchorOf(it);                                               // 人物：头顶上方
  }
  function cellDist(it) {
    var L = G().leaderCell && G().leaderCell(); if (!L) return 99;
    return Math.min.apply(null, it.cells.map(function (c) { return Math.max(Math.abs(c[0] - L.x), Math.abs(c[1] - L.y)); }));
  }
  function el(key, it) {
    var e = pool[key];
    if (!e) {
      e = document.createElement("div"); e.className = "wx-mk"; e.setAttribute("role", "button");
      e.innerHTML = '<div class="tag"></div><div class="gem"></div>';
      e.addEventListener("pointerdown", function (ev) { ev.stopPropagation(); });
      e.addEventListener("click", function (ev) { ev.stopPropagation(); ev.preventDefault(); var id = e.dataset.id; if (id && !hiddenAll()) G().goInteract(id); });
      layer.appendChild(e); pool[key] = e;
    }
    return e;
  }
  function refreshHud() {
    var now = performance.now(); if (now - hudAt < 150) return; hudAt = now;
    hudRects = [];
    CFG.avoid.forEach(function (sel) {
      document.querySelectorAll(sel).forEach(function (n) {
        var cs = getComputedStyle(n); if (cs.display === "none" || cs.visibility === "hidden" || n.classList.contains("hidden")) return;
        var r = n.getBoundingClientRect(); if (r.width < 2 || r.height < 2) return;
        hudRects.push({ l: r.left, t: r.top, r: r.right, b: r.bottom, top: (r.top + r.bottom) / 2 < innerHeight / 2 });
      });
    });
  }
  function overlaps(a, b, p) { return a.l < b.r + p && b.l < a.r + p && a.t < b.b + p && b.t < a.b + p; }
  // box = 牌子外框（屏幕 px）；与 HUD 撞了就往屏幕中间推开（上方 HUD 往下推，下方往上推；贴左右边的牌子沿边上下移）
  function resolve(box, edge) {
    for (var k = 0; k < 4; k++) {
      var moved = false;
      hudRects.forEach(function (r) {
        if (!overlaps(box, r, CFG.hudPad)) return;
        var h = box.b - box.t, w = box.r - box.l;
        if (edge === "left" || edge === "right" || edge === "") {
          var dy = r.top ? (r.b + CFG.hudPad - box.t) : (r.t - CFG.hudPad - box.b);
          box.t += dy; box.b += dy;
        } else {
          var dx = (r.l + r.r) / 2 > innerWidth / 2 ? (r.l - CFG.hudPad - box.r) : (r.r + CFG.hudPad - box.l);
          box.l += dx; box.r += dx;
        }
        moved = true; void h; void w;
      });
      if (!moved) break;
    }
    var m = CFG.edgeMargin, w = box.r - box.l, h = box.b - box.t;
    if (box.l < m) { box.l = m; box.r = m + w; } if (box.r > innerWidth - m) { box.r = innerWidth - m; box.l = box.r - w; }
    if (box.t < m) { box.t = m; box.b = m + h; } if (box.b > innerHeight - m) { box.b = innerHeight - m; box.t = box.b - h; }
    return box;
  }
  // 人物身体（屏幕 px，左右各收 18%）：牌子不压在人身上
  function npcBodies() {
    var g = G(); if (!g.npcRect || !g.npcIds) return [];
    return g.npcIds().map(function (id) {
      var R = g.npcRect(id); if (!R) return null;
      var a = g.worldToClient(R.x + R.w * .18, R.y + R.h * .06), b = g.worldToClient(R.x + R.w * .82, R.y + R.h);
      return { id: id, l: a.x, t: a.y, r: b.x, b: b.y };
    }).filter(Boolean);
  }
  // 牌子之间互不重叠：后放的（优先级低）横向让开，横向放不下再往下让
  function apart(box, placed) {
    for (var k = 0; k < 6; k++) {
      var hit = placed.filter(function (o) { return overlaps(box, o, 2); })[0]; if (!hit) return box;
      var w = box.r - box.l, h = box.b - box.t, cx = (box.l + box.r) / 2, oc = (hit.l + hit.r) / 2, m = CFG.edgeMargin;
      var nl = cx < oc ? hit.l - 4 - w : hit.r + 4;
      if (nl >= m && nl + w <= innerWidth - m) { box.l = nl; box.r = nl + w; }
      else { box.t = hit.b + 4; box.b = box.t + h; }
      var r2 = resolve({ l: box.l, r: box.r, t: box.t, b: box.b }, ""); box.l = r2.l; box.r = r2.r; box.t = r2.t; box.b = r2.b;
    }
    return box;
  }
  function frame() {
    requestAnimationFrame(frame);
    if (!ready()) return;
    if (!layer) { layer = document.createElement("div"); layer.id = "wx-markers"; document.body.insertBefore(layer, document.getElementById("hud") || null); }
    var why = hiddenAll(), list = [];
    layer.classList.toggle("mk-hidden", !!why); layer.dataset.why = why;
    if (why) { lastList = []; Object.keys(pool).forEach(function (k) { pool[k].classList.add("mk-off"); }); return; }
    refreshHud();
    var o = window.Story && window.Story.objective ? window.Story.objective() : {}, tgt = o && o.target;
    var W = innerWidth, H = innerHeight, used = {}, placed = [], bodies = npcBodies();
    G().interactables().forEach(function (it, idx) {
      if (it.hideInList) return;
      var isT = it.id === tgt, isExit = it.kind === "exit";
      if (isExit && !CFG.showExits && !isT) return;
      var a = anchorWorld(it), p = G().worldToClient(a.x, a.y);
      var on = p.x >= 0 && p.x <= W && p.y >= 0 && p.y <= H, side = null;
      if (!on && it.kind === "npc" && G().npcRect) {      // 头在屏外、身子还在画面里：牌子挂在身侧，不压人
        var R = G().npcRect(it.id);
        if (R) {
          var q0 = G().worldToClient(R.x, R.y), q1 = G().worldToClient(R.x + R.w, R.y + R.h);
          var vis = { l: Math.max(0, q0.x), r: Math.min(W, q1.x), t: Math.max(0, q0.y), b: Math.min(H, q1.y) };
          if (vis.r - vis.l > 20 && vis.b - vis.t > 40) { on = true; side = { l: q0.x + (q1.x - q0.x) * .15, r: q1.x - (q1.x - q0.x) * .15, t: vis.t }; }
        }
      }
      if (!on && !isT) return;                       // 其他物件不在画面内就不显示
      if (isExit && on && !CFG.showExits) return;      // 出口在画面里：用底图上的出口牌
      list.push({ it: it, key: it.id + "#" + idx, p: p, on: on, side: side, t: isT, d: cellDist(it), npc: it.kind === "npc" });
    });
    list.sort(function (a, b) { return (b.t - a.t) || (b.npc - a.npc) || (a.d - b.d); });
    list = list.slice(0, CFG.maxShown);
    list.forEach(function (m) {
      m.shown = false;
      var e = el(m.key, m.it), it = m.it, edge = "";
      e.dataset.id = it.id; e.dataset.kind = it.kind;
      var name = it.mkName || it.name; var tagEl = e.firstChild; if (tagEl.textContent !== name) tagEl.textContent = name;
      e.setAttribute("aria-label", name);
      var cls = "wx-mk " + (m.npc ? "npc" : "prop") + (m.t ? " target" : "") + (!m.t && m.d <= CFG.nearCells ? " near" : "");
      var x = m.p.x, y = m.p.y - (m.npc ? CFG.lift.npc : CFG.lift.prop);
      if (!m.on) {                                     // 目标在屏外：沿「屏幕中心 → 目标」方向贴边
        var cx = W / 2, cy = H / 2, dx = m.p.x - cx, dy = m.p.y - cy;
        var sx = Math.abs(dx) / (W / 2 - 40), sy = Math.abs(dy) / (H / 2 - 30), s = Math.max(sx, sy, 1e-6);
        edge = sx >= sy ? (dx < 0 ? "left" : "right") : (dy < 0 ? "up" : "down");
        x = cx + dx / s; y = cy + dy / s;
      }
      cls += edge ? " edge-" + edge : "";
      if (e.className !== cls) e.className = cls;
      var bw = e.offsetWidth || CFG.minHit, bh = e.offsetHeight || CFG.minHit;
      if (m.side) {                                      // 身侧：优先右边，放不下放左边；高度取画面里可见的头部附近
        x = m.side.r + bw / 2 + 4; if (x + bw / 2 > W - CFG.edgeMargin) x = m.side.l - bw / 2 - 4;
        y = m.side.t + bh + 24;
      }
      // 设计稿 transform: translate(-50%,-100%) → (left, top) 是牌子底边中点
      var box = { l: x - bw / 2, r: x + bw / 2, t: y - bh, b: y };
      box = resolve(box, edge === "up" || edge === "down" ? "v" : edge);
      if (m.npc && !m.side && !edge && box.b > y + 4) {   // 头顶被 HUD 顶下来、压到自己脸上 → 改挂到身侧
        var me = bodies.filter(function (q) { return q.id === it.id; })[0];
        if (me && box.b > me.t) {
          var nx = me.r + bw / 2 + 4; if (nx + bw / 2 > W - CFG.edgeMargin) nx = me.l - bw / 2 - 4;
          box = resolve({ l: nx - bw / 2, r: nx + bw / 2, t: box.t, b: box.b }, "");
        }
      }
      var want = { x: (box.l + box.r) / 2, y: box.b };
      box = apart(box, placed.concat(bodies.filter(function (q) { return q.id !== it.id; })));
      // 非目标的牌子被挤得离本体太远（> maxShift）就不挂了（本体照样能点）
      if (!m.t && Math.hypot((box.l + box.r) / 2 - want.x, box.b - want.y) > CFG.maxShift) return;
      placed.push(box); m.shown = true;
      e.style.left = ((box.l + box.r) / 2).toFixed(1) + "px"; e.style.top = box.b.toFixed(1) + "px";
      used[m.key] = 1; m.box = box; m.edge = edge;
    });
    Object.keys(pool).forEach(function (k) { pool[k].classList.toggle("mk-off", !used[k]); });
    lastList = list.filter(function (m) { return m.shown; });
  }
  requestAnimationFrame(frame);
  window.Markers = {
    config: CFG,
    setConfig: function (p) { Object.keys(p || {}).forEach(function (k) { CFG[k] = p[k]; }); },
    // 测试用：当前显示的牌子
    list: function () {
      return lastList.map(function (m) {
        var e = pool[m.key], r = e.getBoundingClientRect();
        return { id: m.it.id, kind: m.it.kind, name: e.firstChild.textContent, cls: e.className, target: m.t, edge: m.edge, on: m.on,
          rect: [r.left, r.top, r.right, r.bottom], fs: parseFloat(getComputedStyle(e.firstChild).fontSize) };
      });
    },
    hiddenReason: function () { return ready() ? hiddenAll() : "loading"; }
  };
})();
