// 《椒麻江湖》主逻辑：等距地图行走、交互、渲染。M4：多场景（火锅店 ↔ 老码头夜市），window.MAP 始终指向当前场景。
(function () {
  var SCENES = { shop: window.MAP_SHOP || window.MAP, market: window.MAP_MARKET, river: window.MAP_RIVER };
  var M = window.MAP, C = window.CHARACTERS, S = window.Sprites, PF = window.PathFind;
  var sceneId = M.id || "shop";
  var G = window.Iso.gridToScreen;
  var WW = M.world.w, WH = M.world.h;
  var SPEED = 3;                 // 格/秒
  var stage, canvas, ctx, viewScale = 1, dpr = 1;
  var showGrid = false, time = 0, lastErr = 0;
  var blocked = {}, party = {}, chain = [], npcs = [], ripples = [], visSig = "";
  var menuTarget = null, toastTimer = null;
  var PH_BASE = 1306;            // 小满原图实际身高(px)，仅用于占位小人换算

  // ---------------- 地图 ----------------
  function key(x, y) { return x + "," + y; }
  function inGrid(x, y) { return x >= 0 && y >= 0 && x < M.cols && y < M.rows; }
  function walkable(x, y) { return inGrid(x, y) && !blocked[key(x, y)]; }
  // M4：npcs / props / interactables 可带 if / ifNot（flag 条件）
  function visible(o) {
    var f = (window.Dialog && window.Dialog.flags) || {};
    return (o.if || []).every(function (k) { return f[k]; }) && !(o.ifNot || []).some(function (k) { return f[k]; });
  }
  function ints() { return M.interactables.filter(visible); }
  function signature() { return sceneId + "|" + M.npcs.concat(M.props, M.interactables).map(function (o) { return visible(o) ? 1 : 0; }).join(""); }
  function rebuild() {
    blocked = {}; visSig = signature();
    for (var y = 0; y < M.rows; y++) for (var x = 0; x < M.cols; x++)
      if ((M.walk[y] || "")[x] === "#") blocked[key(x, y)] = "wall";
    M.props.filter(visible).forEach(function (p) {
      for (var i = 0; i < p.w; i++) for (var j = 0; j < p.h; j++) blocked[key(p.x + i, p.y + j)] = "prop";
    });
    var vn = M.npcs.filter(visible);
    vn.forEach(function (n) { blocked[key(n.x, n.y)] = "npc"; });
    npcs = vn.map(function (n) {
      return { id: n.id, def: C.list[n.char || n.id] || { name: n.name, sprite: n.sprite, heightMul: 1, phHeight: 1, color: "#7a5a3a" },
        cell: { x: n.x, y: n.y }, pos: { x: n.x + .5, y: n.y + .5 }, flip: !!n.flip, back: false, phase: 0 };
    });
    if (window.Editor && window.Editor.refresh) window.Editor.refresh();
  }
  function refreshVisibility() { if (signature() !== visSig) { rebuild(); buildExplore(); } }

  // ---------------- 场景切换 ----------------
  // entrance：目标场景 entrances 里的落脚点名；cells：直接指定三人的格（读档用）
  function setScene(id, entrance, cells, leaderId) {
    var m = SCENES[id]; if (!m) return false;
    hideMenu();
    sceneId = id; M = m; window.MAP = m;
    rebuild();
    var spots = cells || (entrance && m.entrances && m.entrances[entrance]) || m.spawn;
    if (leaderId && party[leaderId]) chain = [leaderId].concat(C.party.filter(function (x) { return x !== leaderId; }));
    chain.forEach(function (pid, i) {
      var sp = spots[i] || spots[0] || { x: 0, y: 0 }, ch = party[pid];
      ch.cell = { x: sp.x, y: sp.y }; ch.pos = { x: sp.x + .5, y: sp.y + .5 };
      ch.to = null; ch.from = null; ch.path = []; ch.onArrive = null; ch.t = 0; ch.back = false; ch.flip = false;
    });
    ripples = [];
    stage.className = "scene-" + id;
    buildExplore(); refreshParty();
    var tb = document.querySelector("#topbar .loc"), tt = document.querySelector("#topbar .time");
    if (tb) tb.textContent = m.name || ""; if (tt) tt.textContent = m.time || "";
    return true;
  }

  // ---------------- 角色 ----------------
  function makeChar(id, sp) {
    return { id: id, def: C.list[id], cell: { x: sp.x, y: sp.y }, pos: { x: sp.x + .5, y: sp.y + .5 },
      to: null, from: null, t: 0, segLen: 1, path: [], flip: false, back: false, phase: 0, onArrive: null };
  }
  function initParty() {
    C.party.forEach(function (id, i) {
      var sp = M.spawn.filter(function (s) { return s.id === id; })[0] || M.spawn[i];
      party[id] = makeChar(id, sp);
    });
    chain = C.party.slice();
  }
  function leader() { return party[chain[0]]; }
  function adjacentOK(a, b) {
    var dx = b.x - a.x, dy = b.y - a.y;
    if (Math.max(Math.abs(dx), Math.abs(dy)) !== 1) return false;
    return PF.canStep(walkable, a.x, a.y, dx, dy);
  }
  function lastCell(ch) { return ch.path.length ? ch.path[ch.path.length - 1] : (ch.to || ch.cell); }
  function pushFollow(f, c) {
    var last = lastCell(f);
    if (last.x === c.x && last.y === c.y) return;
    if (adjacentOK(last, c)) { f.path.push({ x: c.x, y: c.y }); return; }
    var p = PF.astar(walkable, M.cols, M.rows, last.x, last.y, c.x, c.y);
    if (p) f.path = f.path.concat(p); else f.path.push({ x: c.x, y: c.y });
  }
  function startStep(ch, idx) {
    var nx = ch.path.shift();
    ch.from = { x: ch.cell.x, y: ch.cell.y }; ch.to = nx;
    ch.segLen = (nx.x !== ch.cell.x && nx.y !== ch.cell.y) ? Math.SQRT2 : 1;
    var sx = (nx.x - ch.cell.x) - (nx.y - ch.cell.y), sy = (nx.x - ch.cell.x) + (nx.y - ch.cell.y);
    var hasBack = ch.def.back && S.get(ch.def.back);
    ch.back = !!(sy < 0 && hasBack);
    if (sx !== 0) ch.flip = ch.back ? sx > 0 : sx < 0;   // 正面图朝右下，背面图朝左上
    var f = party[chain[idx + 1]];
    if (f) pushFollow(f, ch.from);
  }
  function updateChar(ch, idx, dt) {
    if (!ch.to && ch.path.length) { startStep(ch, idx); ch.t = 0; }
    if (ch.to) {
      var sp = SPEED * (idx > 0 && ch.path.length > 0 ? 1.35 : 1);
      ch.t += dt * sp / ch.segLen;
      ch.phase += dt * sp * Math.PI * 2;
      if (ch.t >= 1) {
        var over = (ch.t - 1) * ch.segLen;
        ch.cell = ch.to; ch.to = null;
        if (ch.path.length) { startStep(ch, idx); ch.t = over / ch.segLen; }
        else {
          ch.t = 0; ch.back = false; ch.phase = 0;
          if (idx === 0 && ch.onArrive) { var cb = ch.onArrive; ch.onArrive = null; cb(); }
        }
      }
    }
    if (ch.to) {
      ch.pos.x = ch.from.x + .5 + (ch.to.x - ch.from.x) * ch.t;
      ch.pos.y = ch.from.y + .5 + (ch.to.y - ch.from.y) * ch.t;
    } else { ch.pos.x = ch.cell.x + .5; ch.pos.y = ch.cell.y + .5; }
  }
  function moving(ch) { return !!ch.to || ch.path.length > 0; }

  function moveLeaderTo(tx, ty, onArrive) {
    var L = leader(), s = L.to || L.cell, goal = { x: tx, y: ty };
    var path = walkable(tx, ty) ? PF.astar(walkable, M.cols, M.rows, s.x, s.y, tx, ty) : null;
    if (!path) {
      var n = PF.nearestReachable(walkable, M.cols, M.rows, s.x, s.y, tx, ty);
      if (!n) return false;
      goal = n;
      path = PF.astar(walkable, M.cols, M.rows, s.x, s.y, n.x, n.y) || [];
    }
    L.path = path; L.onArrive = onArrive || null;
    if (!L.to && !path.length && L.onArrive) { var cb = L.onArrive; L.onArrive = null; cb(); }
    return goal;
  }
  function setLeader(id) {
    if (!party[id] || chain[0] === id) { refreshParty(); return; }
    chain = [id].concat(C.party.filter(function (x) { return x !== id; }));
    chain.forEach(function (k) { party[k].path = []; party[k].onArrive = null; });
    hideMenu();
    refreshParty();
  }

  // ---------------- 交互点 ----------------
  function interactable(id) { return ints().filter(function (i) { return i.id === id; })[0]; }
  function nearOf(it, c) {
    return it.cells.some(function (fc) { return Math.max(Math.abs(fc[0] - c.x), Math.abs(fc[1] - c.y)) <= 1; });
  }
  function nearestInteractable() {
    var L = leader(); if (moving(L)) return null;
    var list = ints();
    for (var i = 0; i < list.length; i++) if (list[i].kind !== "exit" && nearOf(list[i], L.cell)) return list[i];
    return null;
  }
  function approachCells(it) {
    var fp = {}, out = [], seen = {};
    it.cells.forEach(function (c) { fp[key(c[0], c[1])] = 1; });
    it.cells.forEach(function (c) {
      for (var dx = -1; dx <= 1; dx++) for (var dy = -1; dy <= 1; dy++) {
        var x = c[0] + dx, y = c[1] + dy, k = key(x, y);
        if (fp[k] || seen[k] || !walkable(x, y)) continue;
        seen[k] = 1; out.push({ x: x, y: y });
      }
    });
    return out;
  }
  function anchorOf(it) { // 菜单弹出位置（世界坐标）
    if (it.hit) return { x: it.hit.x + it.hit.w / 2, y: it.hit.y + it.hit.h + 10 };
    if (it.kind === "npc") {
      var n = npcs.filter(function (q) { return q.id === it.id; })[0];
      if (n) { var f = G(n.pos.x, n.pos.y); return { x: f.x, y: f.y - charHeight(n) - 10 }; }
    }
    var sx = 0, sy = 0;
    it.cells.forEach(function (c) { sx += c[0] + .5; sy += c[1] + .5; });
    var p = G(sx / it.cells.length, sy / it.cells.length);
    return { x: p.x, y: p.y - M.tileH * 1.6 };
  }
  function goInteract(id) {
    var it = interactable(id); if (!it) return;
    hideMenu();
    var L = leader(), s = L.to || L.cell, cells = approachCells(it), best = null;
    if (!L.to && cells.some(function (c) { return c.x === s.x && c.y === s.y; })) { arriveAt(it); return; }
    cells.forEach(function (c) {
      var p = PF.astar(walkable, M.cols, M.rows, s.x, s.y, c.x, c.y);
      if (p && (!best || pathCost(p, s) < pathCost(best, s))) best = p;
    });
    if (!best) { toast("走不过去"); return; }
    L.path = best; L.onArrive = function () { arriveAt(it); };
  }
  function pathCost(p, s) {
    var c = 0, prev = s;
    p.forEach(function (q) { c += (q.x !== prev.x && q.y !== prev.y) ? Math.SQRT2 : 1; prev = q; });
    return c;
  }
  function arriveAt(it) {
    if (it.kind === "exit") { if (window.Story && window.Story.useExit) window.Story.useExit(it); return; }   // M4：出口直接走
    var L = leader(), a = anchorOf(it), me = G(L.pos.x, L.pos.y);
    L.flip = a.x < me.x - 4; L.back = false;
    showMenu(it);
  }
  function showMenu(it) {
    var el = document.getElementById("action-menu"), a = anchorOf(it);
    menuTarget = it;
    el.querySelector(".am-title").textContent = it.name;
    el.style.left = Math.max(90, Math.min(WW - 90, a.x)) + "px";
    el.style.top = Math.max(210, Math.min(WH - 20, a.y)) + "px";
    el.classList.remove("hidden");
  }
  function hideMenu() { menuTarget = null; document.getElementById("action-menu").classList.add("hidden"); }
  function uiBlocking() { return !!(window.UI && window.UI.blocking && window.UI.blocking()) || !!(window.Battle && window.Battle.isOpen()); }
  function doAction(act) {
    var it = menuTarget; hideMenu();
    if (!it) return;
    if (act === "spar") { toast("切磋 · 即将开放"); return; }
    if (!window.Dialog.startEntry(it.id, act)) toast(act === "talk" ? "……它不会说话。" : "没什么特别的。");
  }

  // ---------------- 尺寸 ----------------
  function charScaleOf(ch, meta) { return C.spriteScale / (meta.prepScale || 1) * (ch.def.heightMul || 1); }
  function charHeight(ch) {
    var r = S.get(ch.def.sprite);
    if (r) return (r.meta.bodyH || r.meta.h) * charScaleOf(ch, r.meta);
    return PH_BASE * C.spriteScale * (ch.def.phHeight || 1) * (ch.def.heightMul || 1);
  }
  function spriteRect(ch) {
    var f = G(ch.pos.x, ch.pos.y), r = S.get(ch.def.sprite);
    if (r) { var k = charScaleOf(ch, r.meta); return { x: f.x - r.meta.ax * k, y: f.y - r.meta.h * k, w: r.meta.w * k, h: r.meta.h * k }; }
    var H = charHeight(ch); return { x: f.x - H * .18, y: f.y - H, w: H * .36, h: H };
  }

  // ---------------- 绘制 ----------------
  function drawShadow(f, scale) {
    ctx.save(); ctx.fillStyle = "rgba(30,20,10,.28)";
    ctx.beginPath(); ctx.ellipse(f.x, f.y, M.tileW * .27 * scale, M.tileH * .27 * scale, 0, 0, Math.PI * 2); ctx.fill();
    ctx.restore();
  }
  function drawChar(ch, walkingNow) {
    var f = G(ch.pos.x, ch.pos.y), H = charHeight(ch);
    var bob = walkingNow ? Math.abs(Math.sin(ch.phase)) * H * .028 : Math.sin(time * 2 + ch.pos.x) * H * .004;
    var sway = walkingNow ? Math.sin(ch.phase) * .035 : 0;
    if (M.night) {   // 夜市：足底一圈暖色灯光，人物在偏蓝的夜景里更好认
      ctx.save(); var gl = ctx.createRadialGradient(f.x, f.y, 4, f.x, f.y, M.tileW * .62);
      gl.addColorStop(0, "rgba(255,170,90,.34)"); gl.addColorStop(1, "rgba(255,170,90,0)");
      ctx.fillStyle = gl; ctx.beginPath(); ctx.ellipse(f.x, f.y, M.tileW * .62, M.tileH * .62, 0, 0, Math.PI * 2); ctx.fill(); ctx.restore();
    }
    drawShadow(f, walkingNow ? 1 - Math.abs(Math.sin(ch.phase)) * .12 : 1);
    var name = ch.back && ch.def.back && S.get(ch.def.back) ? ch.def.back : ch.def.sprite;
    var r = S.get(name);
    ctx.save();
    ctx.translate(f.x, f.y - bob);
    ctx.rotate(sway);
    if (r) {
      var k = charScaleOf(ch, r.meta);
      if (ch.flip) ctx.scale(-1, 1);
      ctx.drawImage(r.img, -r.meta.ax * k, -r.meta.h * k, r.meta.w * k, r.meta.h * k);
      ctx.restore();
    } else {
      ctx.restore();
      ctx.save(); ctx.translate(0, -bob);
      S.placeholderPerson(ctx, f.x, f.y, H, ch.def.color, ch.def.name, ch.flip, ch.back);
      ctx.restore();
    }
  }
  function drawProp(p) {
    var r = S.get(p.sprite), fw = (p.w + p.h) * M.tileW / 2;
    if (r) {
      var k = fw / r.meta.w * (p.scale || 1), v = G(p.x + p.w, p.y + p.h);
      ctx.drawImage(r.img, v.x - r.meta.ax * k + (p.offX || 0), v.y - r.meta.h * k + (p.offY || 0), r.meta.w * k, r.meta.h * k);
    } else if (p.ph === "stall") S.placeholderStall(ctx, M, p);
    else if (p.ph === "jars") S.placeholderJars(ctx, M, p);
    else S.placeholderTable(ctx, M, p);
  }
  function diamond(x, y) {
    var a = G(x, y), b = G(x + 1, y), c = G(x + 1, y + 1), d = G(x, y + 1);
    ctx.beginPath(); ctx.moveTo(a.x, a.y); ctx.lineTo(b.x, b.y); ctx.lineTo(c.x, c.y); ctx.lineTo(d.x, d.y); ctx.closePath();
  }
  function drawGrid(editing) {
    ctx.save(); ctx.lineWidth = 1.5;
    for (var y = 0; y < M.rows; y++) for (var x = 0; x < M.cols; x++) {
      diamond(x, y);
      ctx.fillStyle = walkable(x, y) ? "rgba(40,190,60,.28)" : "rgba(220,30,30,.38)";
      ctx.fill(); ctx.strokeStyle = "rgba(20,60,20,.6)"; ctx.stroke();
      if (editing) {
        var c = G(x + .5, y + .5);
        ctx.fillStyle = "rgba(0,0,0,.65)"; ctx.font = "13px sans-serif"; ctx.textAlign = "center"; ctx.textBaseline = "middle";
        ctx.fillText(x + "," + y, c.x, c.y);
      }
    }
    if (editing) {
      var o = G(0, 0);
      ctx.fillStyle = "#ffd36e"; ctx.strokeStyle = "#000";
      ctx.beginPath(); ctx.arc(o.x, o.y, 7, 0, Math.PI * 2); ctx.fill(); ctx.stroke();
      ints().forEach(function (it) { if (it.hit) { ctx.strokeStyle = "#ffd36e"; ctx.setLineDash([8, 6]); ctx.strokeRect(it.hit.x, it.hit.y, it.hit.w, it.hit.h); ctx.setLineDash([]); } });
    }
    ctx.restore();
  }
  function drawRipples(dt) {
    ripples = ripples.filter(function (r) { return (r.t += dt) < 0.9; });
    ripples.forEach(function (r) {
      var k = r.t / 0.9;
      ctx.save(); ctx.strokeStyle = "rgba(30,24,20," + (0.75 * (1 - k)) + ")";
      for (var i = 0; i < 2; i++) {
        var kk = Math.max(0, k - i * 0.22);
        ctx.lineWidth = (3.5 - i * 1.4) * (1 - kk) + .5;
        ctx.beginPath(); ctx.ellipse(r.x, r.y, 10 + kk * M.tileW * .45, 5 + kk * M.tileH * .45, 0, 0, Math.PI * 2); ctx.stroke();
      }
      ctx.fillStyle = "rgba(30,24,20," + (0.6 * (1 - k)) + ")";
      ctx.beginPath(); ctx.ellipse(r.x, r.y, 5 * (1 - k) + 1, 2.5 * (1 - k) + .5, 0, 0, Math.PI * 2); ctx.fill();
      ctx.restore();
    });
  }
  function drawBang(ch) {
    var f = G(ch.pos.x, ch.pos.y), H = charHeight(ch), y = f.y - H - 34 + Math.sin(time * 6) * 5;
    ctx.save();
    ctx.fillStyle = "#b0281c"; ctx.strokeStyle = "#fff6ea"; ctx.lineWidth = 3;
    ctx.beginPath(); ctx.arc(f.x, y, 20, 0, Math.PI * 2); ctx.fill(); ctx.stroke();
    ctx.fillStyle = "#fff6ea"; ctx.font = "bold 28px KaiTi, 'Noto Serif CJK SC', serif"; ctx.textAlign = "center"; ctx.textBaseline = "middle";
    ctx.fillText("！", f.x + 1, y + 1);
    ctx.restore();
  }
  function drawLeaderMark(ch) {
    var f = G(ch.pos.x, ch.pos.y);
    ctx.save(); ctx.strokeStyle = "rgba(201,164,92,.9)"; ctx.lineWidth = 2.5;
    ctx.beginPath(); ctx.ellipse(f.x, f.y, M.tileW * .34, M.tileH * .34, 0, 0, Math.PI * 2); ctx.stroke(); ctx.restore();
  }
  function render(dt) {
    ctx.setTransform(canvas.width / WW, 0, 0, canvas.height / WH, 0, 0);
    ctx.clearRect(0, 0, WW, WH);
    var bg = S.get(M.bg || "bg_room");
    if (bg) ctx.drawImage(bg.img, 0, 0, WW, WH);
    else if (M.placeholder === "market") S.placeholderMarket(ctx, M, time);
    else if (M.placeholder === "river") S.placeholderRiver(ctx, M, time);
    else S.placeholderRoom(ctx, M, interactable("sign"));
    (window.Game.bgHooks || []).forEach(function (f) { f(ctx); });       // M2：贴墙装饰（门帘），画在地面层，所有人物之前
    var editing = window.Editor.isActive();
    if (showGrid || editing) drawGrid(editing);
    drawRipples(dt);
    drawLeaderMark(leader());
    var items = [];
    chain.forEach(function (id) { var ch = party[id]; items.push({ d: ch.pos.x + ch.pos.y, o: 1, draw: function () { drawChar(ch, !!ch.to); } }); });
    npcs.forEach(function (n) { items.push({ d: n.pos.x + n.pos.y, o: 1, draw: function () { drawChar(n, false); } }); });
    M.props.filter(visible).forEach(function (p) { items.push({ d: p.x + p.w / 2 + p.y + p.h / 2, o: 0, draw: function () { drawProp(p); } }); });
    items.sort(function (a, b) { return a.d - b.d || a.o - b.o; });
    items.forEach(function (it) { it.draw(); });
    (window.Game.renderHooks || []).forEach(function (f) { f(ctx); });   // M2：剧情层绘制（目标标记、无图交互点）
    var near = nearestInteractable();
    if (near && !window.Dialog.isOpen() && !menuTarget && !uiBlocking()) drawBang(leader());
    document.querySelectorAll("#explore li").forEach(function (li) { li.classList.toggle("near", !!near && li.dataset.id === near.id); });
  }

  // ---------------- 输入 ----------------
  function toWorld(e) {
    var r = canvas.getBoundingClientRect();
    return { x: (e.clientX - r.left) / r.width * WW, y: (e.clientY - r.top) / r.height * WH };
  }
  function inRect(p, r) { return p.x >= r.x && p.x <= r.x + r.w && p.y >= r.y && p.y <= r.y + r.h; }
  function hitInteractable(p) {
    var c = window.Iso.screenToCell(p.x, p.y);
    for (var i = 0; i < npcs.length; i++) {
      var R = spriteRect(npcs[i]), pad = R.w * .15;
      if (inRect(p, { x: R.x + pad, y: R.y, w: R.w - 2 * pad, h: R.h })) return interactable(npcs[i].id);
    }
    var res = null;
    ints().forEach(function (it) {
      if (res) return;
      if (it.hit && inRect(p, it.hit)) { res = it; return; }
      if (it.kind === "prop" && it.cells.some(function (fc) { return fc[0] === c.x && fc[1] === c.y; })) res = it;
    });
    if (res) return res;
    // 桌子贴图范围内、但点到的不是可走格（例如桌面上方）也算点桌子
    M.props.filter(visible).forEach(function (pr) {
      var r = S.get(pr.sprite); if (!r || res || walkable(c.x, c.y)) return;
      var fw = (pr.w + pr.h) * M.tileW / 2, k = fw / r.meta.w * (pr.scale || 1), v = G(pr.x + pr.w, pr.y + pr.h);
      if (inRect(p, { x: v.x - r.meta.ax * k, y: v.y - r.meta.h * k, w: r.meta.w * k, h: r.meta.h * k })) res = interactable(pr.id);
    });
    return res;
  }
  function clickWorld(p) {
    if (window.Dialog.isOpen()) return "dialog";
    if (uiBlocking()) return "ui";
    if (menuTarget) { hideMenu(); return "menu-closed"; }
    ripples.push({ x: p.x, y: p.y, t: 0 });
    var it = hitInteractable(p);
    if (it) { goInteract(it.id); return "interact:" + it.id; }
    var g = window.screenToGrid(p.x, p.y);
    var goal = moveLeaderTo(Math.floor(g.x), Math.floor(g.y));
    return goal ? "move:" + goal.x + "," + goal.y : "none";
  }
  var down = null;
  function bindInput() {
    canvas.addEventListener("pointerdown", function (e) {
      e.preventDefault();
      var p = toWorld(e); down = { p: p, id: e.pointerId };
      if (window.Editor.isActive()) { window.Editor.pointerDown(p); canvas.setPointerCapture(e.pointerId); }
    });
    canvas.addEventListener("pointermove", function (e) { if (down && window.Editor.isActive()) window.Editor.pointerMove(toWorld(e)); });
    canvas.addEventListener("pointerup", function (e) {
      if (!down) return;
      var p = toWorld(e); down = null;
      if (window.Editor.isActive()) { window.Editor.pointerUp(p); return; }
      clickWorld(p);
    });
    window.addEventListener("keydown", function (e) {
      if (window.Dialog.isOpen()) { if (window.Dialog.key(e)) e.preventDefault(); return; }
      if (uiBlocking()) return;
      if (window.Editor.isActive() && window.Editor.key(e)) { e.preventDefault(); return; }
      var k = e.key.toLowerCase();
      if (k === "g") showGrid = !showGrid;
      else if (k === "e") { window.Editor.setActive(!window.Editor.isActive()); hideMenu(); }
      else if (k === "1" || k === "2" || k === "3") setLeader(C.party[+k - 1]);
      else if (e.code === "Space" || k === "enter") { var n = nearestInteractable(); if (n) arriveAt(n); e.preventDefault(); }
      else if (k === "escape") { hideMenu(); if (window.Editor.isActive()) window.Editor.setActive(false); }
    });
    document.getElementById("action-menu").addEventListener("pointerdown", function (e) { e.stopPropagation(); });
    document.getElementById("action-menu").addEventListener("click", function (e) {
      var b = e.target.closest("button"); if (b) doAction(b.getAttribute("data-act"));
    });
    document.querySelectorAll("#menu-btns button").forEach(function (b) {
      b.addEventListener("click", function () {
        if (window.UI && window.UI.openPanel && window.UI.openPanel(b.getAttribute("data-panel"))) return;   // M4：背包 / 人物 / 江湖志
        toast(b.getAttribute("data-soon") + " · 即将开放");
      });
    });
    document.getElementById("rotate-hint").addEventListener("click", function () { this.classList.add("closed"); });
  }

  // ---------------- 界面 ----------------
  function buildExplore() {
    var ul = document.getElementById("explore-list"); ul.innerHTML = "";
    ints().forEach(function (it) {
      if (it.hideInList) return;
      var li = document.createElement("li"); li.textContent = it.name; li.dataset.id = it.id;
      li.addEventListener("click", function () { if (!window.Dialog.isOpen()) goInteract(it.id); });
      ul.appendChild(li);
    });
  }
  function buildParty() {
    var box = document.getElementById("party"); box.innerHTML = "";
    C.party.forEach(function (id, i) {
      var d = C.list[id], card = document.createElement("div");
      card.className = "pcard"; card.dataset.id = id;
      card.innerHTML = '<canvas width="120" height="120"></canvas><div class="info"><div class="nm">' + d.name +
        '<small>' + (i + 1) + '</small></div><div class="bar hp"><i style="width:' + (d.hp[0] / d.hp[1] * 100) + '%"></i></div>' +
        '<div class="bar mp"><i style="width:' + (d.mp[0] / d.mp[1] * 100) + '%"></i></div></div>';
      card.title = "气血 " + d.hp.join("/") + "　内力 " + d.mp.join("/");
      card.addEventListener("click", function () { setLeader(id); });
      box.appendChild(card);
    });
    refreshParty();
  }
  function refreshParty() {
    document.querySelectorAll(".pcard").forEach(function (card) {
      var d = C.list[card.dataset.id];
      card.classList.toggle("active", card.dataset.id === chain[0]);
      S.drawPortrait(card.querySelector("canvas"), d.sprite, d.name, d.color);
    });
  }
  function toast(msg) {
    var el = document.getElementById("toast");
    el.textContent = msg; el.classList.remove("hidden");
    clearTimeout(toastTimer);
    toastTimer = setTimeout(function () { el.classList.add("hidden"); }, 1600);
  }
  function resize() {
    var vw = window.innerWidth, vh = window.innerHeight;
    viewScale = Math.min(vw / WW, vh / WH);
    dpr = Math.min(window.devicePixelRatio || 1, 3);
    var l = (vw - WW * viewScale) / 2, t = (vh - WH * viewScale) / 2;
    stage.style.transform = "translate(" + l + "px," + t + "px) scale(" + viewScale + ")";
    canvas.width = Math.max(1, Math.round(WW * viewScale * dpr));
    canvas.height = Math.max(1, Math.round(WH * viewScale * dpr));
  }

  // ---------------- 主循环 ----------------
  var last = 0, lastPosKey = "";
  function frame(ts) {
    var dt = Math.min(0.05, last ? (ts - last) / 1000 : 0); last = ts; time += dt;
    try {
      chain.forEach(function (id, i) { updateChar(party[id], i, dt); });
      var L0 = leader(), pk = sceneId + ":" + L0.cell.x + "," + L0.cell.y + ":" + chain[0];
      if (!moving(L0) && pk !== lastPosKey) { lastPosKey = pk; if (window.Dialog.persist) window.Dialog.persist(); }   // M4：停步即存档（场景 + 位置 + 队长）
      window.Dialog.update(dt);
      render(dt);
    } catch (err) {
      if (time - lastErr > 2) { lastErr = time; console.error(err); }
    }
    requestAnimationFrame(frame);
  }
  function start() {
    stage = document.getElementById("stage");
    canvas = document.getElementById("game");
    ctx = canvas.getContext("2d");
    stage.className = "scene-" + sceneId;
    rebuild(); initParty();
    window.Dialog.init(); window.Editor.init();
    buildExplore(); buildParty(); bindInput();
    resize();
    window.addEventListener("resize", resize);
    window.addEventListener("orientationchange", resize);
    S.onLoad(function () { refreshParty(); });
    if (window.Story) window.Story.init();
    lastPosKey = sceneId + ":" + leader().cell.x + "," + leader().cell.y + ":" + chain[0];
    requestAnimationFrame(frame);
  }

  // 测试/调试用接口
  window.Game = {
    rebuild: rebuild, refreshVisibility: refreshVisibility, setScene: setScene, scenes: SCENES, visible: visible, interactables: ints,
    scene: function () { return sceneId; }, map: function () { return M; }, isMoving: function () { return moving(leader()); },
    saveMeta: function () { if (!chain.length) return null; return { scene: sceneId, leader: chain[0], cells: chain.map(function (id) { return { x: party[id].cell.x, y: party[id].cell.y }; }) }; },
    toast: toast, setLeader: setLeader, goInteract: goInteract, clickWorld: clickWorld,
    walkable: walkable, anchorOf: anchorOf, interactable: interactable, hideMenu: hideMenu,
    leaderId: function () { return chain[0]; }, renderHooks: [], bgHooks: [],
    colorOf: function (id) { return C.list[id] && C.list[id].color; },
    cellCenter: function (x, y) { return G(x + .5, y + .5); },
    toggleGrid: function (v) { showGrid = v === undefined ? !showGrid : v; },
    state: function () {
      return {
        scene: sceneId, leader: chain[0], chain: chain.slice(),
        npcs: npcs.map(function (n) { return n.id; }), interactables: ints().map(function (i) { return i.id; }),
        party: chain.map(function (id) {
          var ch = party[id], f = G(ch.pos.x, ch.pos.y);
          return { id: id, cell: ch.cell, moving: moving(ch), screen: f, height: charHeight(ch), back: ch.back, flip: ch.flip };
        }),
        menu: menuTarget && menuTarget.id, dialog: window.Dialog.current(), flags: window.Dialog.flags,
        sprites: S.status(), near: (nearestInteractable() || {}).id || null
      };
    }
  };
  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", start); else start();
})();
