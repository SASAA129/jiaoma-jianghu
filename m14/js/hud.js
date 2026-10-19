// M12 手机界面返工：少挡画面、≥48px 热区、横竖屏都可玩、靠近 NPC 「交谈」大按钮。
// M13：换平涂 UI（art/ui_flat/UI_SPEC.md）——圆钮/交谈钮/面板全用 CSS 画，不再用占位 PNG；对话框移到屏幕层按手机 CSS 像素排版。
// 不做：虚拟摇杆、点任务自动寻路、自动战斗、二倍速、NPC 圆环菜单（等用户回「1」/后续批次）。
// 场景平涂新图等用户锁定后再换，本版不改 bg_*。
(function () {
  var BTNS = [
    { id: "bag", label: "背包", img: "bag" },
    { id: "wuxue", label: "武学", img: "wuxue" },
    { id: "huoban", label: "伙伴", img: "huoban" },
    { id: "renwu", label: "任务", img: "renwu" },
    { id: "caipu", label: "菜谱", img: "caipu" },
    { id: "shezhi", label: "设置", img: "shezhi" }
  ];
  var PREF_KEY = "jiaoma_hud_prefs_m14";
  var root, panel, panelKind = null, lastSig = "", resetArmed = 0;
  var prefs = loadPrefs();
  var trackOpen = false, panelOpenedAt = 0, menuOpen = true;

  function loadPrefs() {
    try {
      var r = JSON.parse(localStorage.getItem(PREF_KEY) || "{}");
      return {
        hudCollapsed: !!r.hudCollapsed,
        btnLarge: r.btnLarge !== false, // 默认「更大」
        menuOpen: r.menuOpen !== false
      };
    } catch (e) { return { hudCollapsed: false, btnLarge: true, menuOpen: true }; }
  }
  function savePrefs() {
    try { localStorage.setItem(PREF_KEY, JSON.stringify(prefs)); } catch (e) {}
  }
  function $(s, r) { return (r || root).querySelector(s); }
  function esc(s) { return String(s == null ? "" : s).replace(/[&<>"]/g, function (c) { return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]; }); }
  function flags() { return (window.Dialog && window.Dialog.flags) || {}; }
  function cond(o) { return window.UI && window.UI.cond ? window.UI.cond(o) : true; }
  function stats(id) {
    var d = window.CHARACTERS.list[id] || {}, b = (window.BATTLE && window.BATTLE.party[id]) || {};
    var hp = d.hp || [b.hp, b.hp], mp = d.mp || [b.mp, b.mp];
    return { name: d.name, sprite: d.sprite, color: d.color, hp: hp, mp: mp, spd: b.spd, atk: b.atk, def: b.def, skills: b.skills || [] };
  }
  function bar(cls, v) { return '<div class="hud-bar ' + cls + '"><i style="width:' + Math.max(0, Math.min(100, v[0] / v[1] * 100)) + '%"></i><span>' + v[0] + "/" + v[1] + "</span></div>"; }

  function syncStageScale() {
    var st = document.getElementById("stage");
    if (!st) return;
    var tr = getComputedStyle(st).transform, scale = 1;
    if (tr && tr !== "none") {
      var m = tr.match(/matrix\(([-0-9.]+)/);
      if (m) scale = Math.abs(parseFloat(m[1])) || 1;
    }
    document.documentElement.style.setProperty("--stage-scale", String(scale));
    // 让舞台内主按钮在 CSS 像素上大约 ≥48（战斗圆钮按 120 舞台 px 估）
    var boost = Math.min(3.5, Math.max(1, 56 / (120 * scale)));
    document.documentElement.style.setProperty("--ui-boost", String(boost));
    document.documentElement.style.setProperty("--inv-scale", String(Math.min(3, 1 / scale)));
  }

  // 舞台里的全屏层（章节卡/黑场/战斗/小游戏/大卡片/CG/主菜单）盖住时，屏幕层对话框也让位
  function isShown(sel) {
    var e = document.querySelector(sel); if (!e || e.classList.contains("hidden")) return false;
    var cs = getComputedStyle(e); return cs.display !== "none" && cs.visibility !== "hidden" && parseFloat(cs.opacity) > 0.05;
  }
  function syncDialogCover() {
    var dlg = document.getElementById("dialog"); if (!dlg) return;
    var u = window.UI && window.UI.state ? window.UI.state() : {};
    var cover = !!(u.chapter || u.card || isShown("#fade") || isShown("#title-menu") || isShown("#cg-card") || isShown("#ending") ||
      (window.Battle && window.Battle.isOpen && window.Battle.isOpen()) || (window.MiniGames && window.MiniGames.isOpen && window.MiniGames.isOpen()));
    dlg.classList.toggle("uf-covered", cover);
  }
  function applyChrome() {
    document.documentElement.classList.add("m12-hud");
    document.documentElement.classList.toggle("hud-btn-large", !!prefs.btnLarge);
    document.documentElement.classList.toggle("hud-btn-std", !prefs.btnLarge);
    if (root) {
      root.classList.toggle("hud-collapsed", !!prefs.hudCollapsed);
      root.classList.toggle("menu-open", !!menuOpen);
      root.classList.toggle("track-open", !!trackOpen);
    }
  }

  function build() {
    menuOpen = prefs.menuOpen !== false;
    root = document.createElement("div"); root.id = "hud";
    root.innerHTML =
      '<div class="hud-tl">' +
        '<button class="hud-avatar" data-hud="huoban" aria-label="伙伴"><canvas width="120" height="120"></canvas></button>' +
        '<div class="hud-stat"><div class="hud-name"></div><div class="hud-bars"></div></div>' +
      "</div>" +
      '<button type="button" class="hud-track" aria-live="polite" data-hud="track-toggle">' +
        '<div class="hud-track-t">当前目标</div><div class="hud-track-x"></div>' +
      "</button>" +
      '<div class="hud-tr"><div class="hud-loc"></div><button class="hud-map" data-hud="map" aria-label="地图"><span>地图</span></button></div>' +
      '<div class="hud-br">' +
        '<button type="button" class="hud-fab primary" data-hud="menu-toggle" aria-label="菜单"><span class="hud-fab-lab">菜单</span><span class="hud-fab-x">收起</span></button>' +
        '<div class="hud-br-row">' + BTNS.map(function (b) {
          return '<button class="hud-rb' + (b.id === "shezhi" ? " primary" : "") + '" data-hud="' + b.id + '" aria-label="' + b.label + '"><span>' + b.label + "</span></button>";
        }).join("") + "</div>" +
      "</div>" +
      '<button type="button" class="hud-talk primary hidden" data-hud="talk" aria-label="交谈"><b>交谈</b><span class="hud-talk-who"></span></button>';
    document.body.appendChild(root);
    // M13：对话框挪到屏幕层（不随 1536×1024 舞台缩小），字号/行距按手机 CSS 像素
    var dlg = document.getElementById("dialog");
    if (dlg && dlg.parentNode !== document.body) { document.body.appendChild(dlg); dlg.classList.add("uf-screen"); }
    (function coverLoop() { syncDialogCover(); requestAnimationFrame(coverLoop); })();
    panel = document.createElement("div"); panel.id = "hud-panel"; panel.className = "hidden";
    document.body.appendChild(panel);
    // Mobile: #hud is pointer-events:none; touch hits the button, but the
    // synthesized click retargets to the canvas underneath. Act on pointerup
    // and preventDefault on pointerdown so the ghost click never fires.
    var ptrHud = null, lastHudAt = 0;
    function fireHud(b) {
      if (!b) return;
      var now = Date.now();
      if (now - lastHudAt < 400) return;
      lastHudAt = now;
      onHudClick({ target: b, preventDefault: function () {}, stopPropagation: function () {} });
    }
    root.addEventListener("pointerdown", function (e) {
      e.stopPropagation();
      var b = e.target && e.target.closest ? e.target.closest("[data-hud]") : null;
      if (b) { ptrHud = b; try { e.preventDefault(); } catch (err) {} }
      else ptrHud = null;
    });
    root.addEventListener("pointerup", function (e) {
      e.stopPropagation();
      var b = e.target && e.target.closest ? e.target.closest("[data-hud]") : null;
      if (b && b === ptrHud) fireHud(b);
      ptrHud = null;
    });
    root.addEventListener("pointercancel", function () { ptrHud = null; });
    root.addEventListener("click", function (e) {
      var b = e.target && e.target.closest ? e.target.closest("[data-hud]") : null;
      if (b) fireHud(b);
    });
    panel.addEventListener("pointerdown", function (e) { e.stopPropagation(); });
    panel.addEventListener("click", onPanelClick);
    window.addEventListener("keydown", function (e) { if (panelKind && e.key === "Escape") { closePanel(); e.preventDefault(); e.stopImmediatePropagation(); } }, true);
    if (window.UI && window.UI.blocking) {
      var ob = window.UI.blocking;
      window.UI.blocking = function () { return ob() || !!panelKind; };
    }
    applyChrome();
    setupFsChip();
    syncStageScale();
    window.addEventListener("resize", syncStageScale);
    window.addEventListener("jm-resize", syncStageScale);
    setInterval(function () { tick(); syncStageScale(); }, 200); tick();
  }

  function onHudClick(e) {
    var b = e.target && e.target.closest ? e.target.closest("[data-hud]") : e.target; if (!b || !b.getAttribute) return;
    var id = b.getAttribute("data-hud");
    if (id === "track-toggle") {
      trackOpen = !trackOpen; root.classList.toggle("track-open", trackOpen); return;
    }
    if (id === "menu-toggle") {
      menuOpen = !menuOpen; prefs.menuOpen = menuOpen; savePrefs();
      root.classList.toggle("menu-open", menuOpen); return;
    }
    if (id === "talk") { doTalk(); return; }
    if (id === "map") {
      if (window.Game) window.Game.hideMenu();
      if (window.WorldMap && window.WorldMap.open()) return;
      if (window.Game) window.Game.toast("地图 · 暂不可用");
      return;
    }
    openPanel(id);
  }

  function doTalk() {
    var n = window.Game && window.Game.nearestInteractable && window.Game.nearestInteractable();
    if (!n) return;
    if (window.Game.hideMenu) window.Game.hideMenu();
    // 大按钮直接进入交谈（不经过动作菜单，避免触摸穿透关掉菜单）
    if (window.Dialog && window.Dialog.startEntry) {
      if (!window.Dialog.startEntry(n.id, "talk") && window.Game.toast) window.Game.toast("……它不会说话。");
      return;
    }
    if (window.Game.arriveAt) window.Game.arriveAt(n);
  }

  function openPanel(kind) {
    var head = { bag: "背 包", wuxue: "武 学", huoban: "伙 伴", renwu: "任 务", caipu: "菜 谱", shezhi: "设 置" }[kind], body = "";
    var CH = window.CHAPTERS || { items: [], clues: [] }, B = window.BATTLE || { skills: {} }, party = window.CHARACTERS.party;
    if (kind === "bag") {
      var items = (CH.items || []).filter(cond);
      body = items.length ? '<div class="hp-list">' + items.map(function (it) {
        return '<div class="hp-row"><b>' + esc(it.name) + (it.count ? " ×" + it.count : "") + "</b><small>" + esc(it.desc || "") + "</small></div>";
      }).join("") + "</div>" : '<p class="hp-empty">背包是空的。</p>';
    } else if (kind === "wuxue") {
      body = party.map(function (id) {
        var s = stats(id);
        return '<div class="hp-sec"><h3>' + esc(s.name) + "</h3>" + s.skills.map(function (k) {
          var sk = B.skills[k] || { name: k };
          return '<div class="hp-row"><b>「' + esc(sk.name) + "」</b><small>" + esc(sk.desc || "") + (sk.mp ? " · 内力 " + sk.mp : "") + "</small></div>";
        }).join("") + "</div>";
      }).join("") + '<p class="hp-note">占位：只列出现有招式。</p>';
    } else if (kind === "huoban") {
      var lead = window.Game && window.Game.leaderId();
      body = '<div class="hp-party">' + party.map(function (id) {
        var s = stats(id);
        return '<div class="hp-mem' + (id === lead ? " lead" : "") + '" data-mem="' + id + '"><canvas width="120" height="120" data-sp="' + s.sprite + '" data-nm="' + esc(s.name) + '" data-col="' + (s.color || "#3b3a44") + '"></canvas>' +
          '<div class="hp-mem-x"><b>' + esc(s.name) + (id === lead ? '<em>队长</em>' : "") + "</b>" + bar("hp", s.hp) + bar("mp", s.mp) +
          '<div class="hp-nums"><span>身法 ' + s.spd + "</span><span>攻 " + s.atk + "</span><span>防 " + s.def + "</span></div>" +
          (id === lead ? "" : '<button class="hp-btn" data-lead="' + id + '">设为队长</button>') + "</div></div>";
      }).join("") + "</div>";
    } else if (kind === "renwu") {
      var o = window.Story ? window.Story.objective() : { text: "" };
      body = '<div class="hp-sec"><h3>当前目标</h3><p class="hp-goal">' + esc(o.text) + "</p>" + (o.via ? '<p class="hp-via">→ 先去「' + esc(o.via) + "」</p>" : "") +
        (o.checklist ? '<div class="hp-list">' + o.checklist.map(function (c) { return '<div class="hp-row' + (c.done ? " done" : "") + '"><b>' + (c.done ? "✔ " : "· ") + esc(c.text) + "</b></div>"; }).join("") + "</div>" : "") + "</div>";
      // M13：路线（原右侧探索栏里的 A/B/C / 各章清单）收进任务面板；行高 48、字 15
      var ri = window.Story && window.Story.routeInfo ? window.Story.routeInfo() : null;
      if (ri) body += '<div class="hp-sec hp-routes"><h3>路线</h3><p class="hp-rt-title">' + esc(ri.title) + "</p>" + ri.rows.map(function (r) {
        return '<button type="button" class="hp-route ' + r.state + '" data-route="' + esc(r.key) + '" data-rkind="' + ri.kind + '"' + (r.target ? ' data-target="' + esc(r.target) + '"' : "") + '>' +
          '<span class="rk">' + esc(r.rk) + '</span><span class="rt">' + esc(r.text) + "</span>" +
          (r.state === "done" ? '<span class="done-seal">已完</span>' : r.state === "active" ? '<span class="cur">进行中</span>' : (ri.kind === "routes" ? '<span class="go">选这条 ›</span>' : "")) + "</button>";
      }).join("") + "</div>";
      var clues = (CH.clues || []).filter(cond);
      body += '<div class="hp-sec"><h3>线索</h3>' + (clues.length ? clues.map(function (c) { return "<p>" + esc(c.text) + "</p>"; }).join("") : '<p class="hp-empty">还没有线索。</p>') + "</div>";
    } else if (kind === "caipu") {
      body = '<p class="hp-empty">还没有学会的菜谱。</p><p class="hp-note">占位面板。</p>';
    } else if (kind === "shezhi") {
      var rig = window.Rig && window.Rig.enabled();
      body = '<div class="hp-set">' +
        '<button class="hp-btn wide" data-set="hud">' + (prefs.hudCollapsed ? "展开 HUD" : "收起 HUD") + "</button>" +
        '<button class="hp-btn wide" data-set="btnsize">按钮：' + (prefs.btnLarge ? "更大" : "标准") + "（点此切换）</button>" +
        fsRow() +
        '<button class="hp-btn wide" data-set="rig">三人骨骼动画：' + (rig ? "开" : "关") + "</button>" +
        '<button class="hp-btn wide" data-set="title">回主菜单</button>' +
        '<button class="hp-btn wide danger" data-set="reset">重置存档</button>' +
        '<p class="hp-note">摇杆 / 自动战斗 / 二倍速等仍待批准。</p></div>';
    } else return false;
    panel.innerHTML = '<div class="hp-box" role="dialog" aria-label="' + head.replace(/ /g, "") + '"><div class="hp-head"><span>' + head + '</span><button class="hp-close" data-close="1" aria-label="关闭">✕</button></div><div class="hp-body">' + body + "</div></div>";
    panel.dataset.kind = kind; panelKind = kind;
    panel.querySelectorAll("canvas[data-sp]").forEach(function (cv) { window.Sprites.drawPortrait(cv, cv.dataset.sp, cv.dataset.nm, cv.dataset.col); });
    if (window.Game) window.Game.hideMenu();
    panel.classList.remove("hidden");
    panelOpenedAt = Date.now();
    return true;
  }
  function closePanel() { panel.classList.add("hidden"); panelKind = null; }

  // M13：全屏。安卓 / 桌面 / iPad：requestFullscreen（含 webkit 前缀），能锁就锁横屏；
  // iPhone Safari 不支持网页元素全屏 → 设置里给「添加到主屏幕」提示（manifest display: fullscreen + apple-mobile-web-app-capable）。
  function FS() { return (window.Fill && window.Fill.fs) || { supported: function () { return false; }, active: function () { return false; }, standalone: function () { return false; }, toggle: function () {}, isIOS: false, iosHint: "" }; }
  function fsRow() {
    var f = FS(), html = "";
    if (f.supported()) html += '<button class="hp-btn wide" data-set="fs">' + (f.active() ? "退出全屏" : "全屏") + "</button>";
    if (f.standalone()) html += '<p class="hp-fs-tip">已从主屏幕打开：无地址栏运行中。</p>';
    else if (f.isIOS || !f.supported()) html += '<p class="hp-fs-tip" data-ios-tip="1">' + esc(f.iosHint) + "</p>";
    return html;
  }
  function toggleFullscreen() { FS().toggle(); setTimeout(function () { if (panelKind === "shezhi") openPanel("shezhi"); }, 400); }
  // 首次点击屏幕时给一个「全屏」提示钮（只在支持全屏、还没全屏、不是主屏幕打开时；每次打开页面一次；8 秒后自动收起）
  function setupFsChip() {
    var chip = document.createElement("div"); chip.id = "fs-chip"; chip.className = "hidden";
    chip.innerHTML = '<button type="button" class="fs-go" aria-label="全屏">全屏</button><button type="button" class="fs-x" aria-label="不用">✕</button>';
    document.body.appendChild(chip);
    var shown = false, timer = 0;
    function hide() { chip.classList.add("hidden"); clearTimeout(timer); }
    chip.addEventListener("pointerdown", function (e) { e.stopPropagation(); });
    chip.querySelector(".fs-go").addEventListener("click", function (e) { e.stopPropagation(); hide(); FS().enter(); });
    chip.querySelector(".fs-x").addEventListener("click", function (e) { e.stopPropagation(); hide(); });
    function first() {
      if (shown) return; shown = true;
      window.removeEventListener("pointerdown", first, true);
      var f = FS();
      if (!f.supported() || f.active() || f.standalone()) return;
      // 晚 400ms 再出现，不抢这次点击本身（例如关掉竖屏提示条）
      setTimeout(function () { if (!FS().active()) { chip.classList.remove("hidden"); timer = setTimeout(hide, 8000); } }, 400);
    }
    window.addEventListener("pointerdown", first, true);
    window.FsChip = { el: chip, hide: hide, show: function () { shown = false; first(); } };
  }

  function onPanelClick(e) {
    if (e.target === panel || e.target.closest("[data-close]")) {
      // Ignore ghost click that lands on the dimmer right after open (mobile).
      if (e.target === panel && Date.now() - panelOpenedAt < 500) return;
      closePanel(); return;
    }
    var b = e.target.closest("button"); if (!b) return;
    if (b.dataset.route) {
      if (b.dataset.rkind === "routes") window.Story.pickRoute(b.dataset.route);
      else if (!b.classList.contains("done")) window.Story.goRow(b.dataset.target);
      return;
    }
    if (b.dataset.lead) { window.Game.setLeader(b.dataset.lead); openPanel("huoban"); return; }
    var s = b.dataset.set;
    if (s === "hud") { prefs.hudCollapsed = !prefs.hudCollapsed; savePrefs(); applyChrome(); openPanel("shezhi"); }
    else if (s === "btnsize") { prefs.btnLarge = !prefs.btnLarge; savePrefs(); applyChrome(); openPanel("shezhi"); }
    else if (s === "fs") { toggleFullscreen(); }
    else if (s === "rig" && window.Rig) { window.Rig.setEnabled(!window.Rig.enabled()); openPanel("shezhi"); }
    else if (s === "title") { closePanel(); window.UI.showTitle(); }
    else if (s === "reset") {
      if (Date.now() - resetArmed > 3000) { resetArmed = Date.now(); b.textContent = "再点一次确认重置"; setTimeout(function () { b.textContent = "重置存档"; }, 3000); return; }
      window.Save.reset(); var f = flags(); Object.keys(f).forEach(function (k) { delete f[k]; }); window.Save.reset();
      try { sessionStorage.setItem("jm14_new", "1"); } catch (er) {}
      location.reload();
    }
  }

  function hiddenNow() {
    var u = window.UI && window.UI.state ? window.UI.state() : { open: {} };
    var o = u.open || {};
    return !!(o.title || o.panel || o.card || o.cg || u.chapter || (window.Battle && window.Battle.isOpen()) || (window.MiniGames && window.MiniGames.isOpen()) ||
      (window.WorldMap && window.WorldMap.isOpen()) || (window.Story && window.Story.isCardOpen && window.Story.isCardOpen()) || (window.Editor && window.Editor.isActive()));
  }

  function tick() {
    if (!root || !window.Game || !window.Game.leaderId) return;
    var hide = hiddenNow(), talking = window.Dialog && window.Dialog.isOpen();
    root.classList.toggle("off", hide);
    root.classList.toggle("talking", !!talking);
    if (hide && panelKind) closePanel();

    var near = window.Game.nearestInteractable && window.Game.nearestInteractable();
    var talkBtn = $(".hud-talk");
    var showTalk = !hide && !talking && !panelKind && near && near.kind !== "exit";
    talkBtn.classList.toggle("hidden", !showTalk);
    if (showTalk) talkBtn.querySelector(".hud-talk-who").textContent = near.name || "";

    var id = window.Game.leaderId(); if (!id) return;
    var s = stats(id), o = window.Story ? window.Story.objective() : { text: "" };
    var loc = (document.querySelector("#topbar .loc") || {}).textContent || "", tm = (document.querySelector("#topbar .time") || {}).textContent || "";
    var nearId = near && near.id;
    var sig = [id, s.hp.join("/"), s.mp.join("/"), o.text, o.via, loc, tm, nearId, !!(window.Sprites.get && window.Sprites.get(s.sprite)), prefs.hudCollapsed, prefs.btnLarge, menuOpen].join("|");
    if (sig === lastSig) return; lastSig = sig;
    window.Sprites.drawPortrait($(".hud-avatar canvas"), s.sprite, s.name, s.color);
    $(".hud-name").textContent = s.name;
    $(".hud-bars").innerHTML = bar("hp", s.hp) + bar("mp", s.mp);
    var tx = o.text + (o.via ? "（先去「" + o.via + "」）" : "");
    $(".hud-track-x").textContent = tx;
    $(".hud-loc").innerHTML = esc(loc) + (tm ? "<em>" + esc(tm) + "</em>" : "");
  }

  function init() { if (!root) build(); }
  window.Hud = {
    init: init, open: openPanel, close: closePanel, tick: tick, prefs: function () { return JSON.parse(JSON.stringify(prefs)); },
    state: function () {
      return {
        panel: panelKind,
        hidden: root ? root.classList.contains("off") : true,
        talking: root ? root.classList.contains("talking") : false,
        buttons: BTNS.map(function (b) { return b.id; }),
        menuOpen: !!menuOpen,
        trackOpen: !!trackOpen,
        hudCollapsed: !!prefs.hudCollapsed,
        btnLarge: !!prefs.btnLarge,
        talkVisible: root ? !$(".hud-talk").classList.contains("hidden") : false
      };
    }
  };
  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", function () { setTimeout(init, 0); }); else setTimeout(init, 0);
})();
