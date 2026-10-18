// M12 手机界面返工：少挡画面、≥48px 热区、横竖屏都可玩、靠近 NPC 「交谈」大按钮。
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
  var PREF_KEY = "jiaoma_hud_prefs_m12";
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
        '<button class="hud-avatar" data-hud="huoban" aria-label="伙伴"><img class="hud-frame" src="assets/ui/ui_hud_portrait_frame.png" alt=""><canvas width="120" height="120"></canvas></button>' +
        '<div class="hud-stat"><div class="hud-name"></div><div class="hud-bars"></div></div>' +
      "</div>" +
      '<button type="button" class="hud-track" aria-live="polite" data-hud="track-toggle">' +
        '<div class="hud-track-t">当前目标</div><div class="hud-track-x"></div>' +
      "</button>" +
      '<div class="hud-tr"><div class="hud-loc"></div><button class="hud-map" data-hud="map" aria-label="地图"><img src="assets/ui/ui_btn_round_map.png" alt=""><span>地图</span></button></div>' +
      '<div class="hud-br">' +
        '<button type="button" class="hud-fab" data-hud="menu-toggle" aria-label="菜单"><img src="assets/ui/ui_btn_round_menu.png" alt=""><span class="hud-fab-lab">菜单</span></button>' +
        '<div class="hud-br-row">' + BTNS.map(function (b) {
          return '<button class="hud-rb" data-hud="' + b.id + '" aria-label="' + b.label + '"><img src="assets/ui/ui_btn_round_' + b.img + '.png" alt=""><span>' + b.label + "</span></button>";
        }).join("") + "</div>" +
      "</div>" +
      '<button type="button" class="hud-talk hidden" data-hud="talk" aria-label="交谈"><img src="assets/ui/ui_btn_interact.png" alt=""><span>交谈</span></button>';
    document.body.appendChild(root);
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
    syncStageScale();
    window.addEventListener("resize", syncStageScale);
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
      var clues = (CH.clues || []).filter(cond);
      body += '<div class="hp-sec"><h3>线索</h3>' + (clues.length ? clues.map(function (c) { return "<p>" + esc(c.text) + "</p>"; }).join("") : '<p class="hp-empty">还没有线索。</p>') + "</div>";
    } else if (kind === "caipu") {
      body = '<p class="hp-empty">还没有学会的菜谱。</p><p class="hp-note">占位面板。</p>';
    } else if (kind === "shezhi") {
      var rig = window.Rig && window.Rig.enabled();
      body = '<div class="hp-set">' +
        '<button class="hp-btn wide" data-set="hud">' + (prefs.hudCollapsed ? "展开 HUD" : "收起 HUD") + "</button>" +
        '<button class="hp-btn wide" data-set="btnsize">按钮：' + (prefs.btnLarge ? "更大" : "标准") + "（点此切换）</button>" +
        '<button class="hp-btn wide" data-set="fs">全屏</button>' +
        '<button class="hp-btn wide" data-set="rig">三人骨骼动画：' + (rig ? "开" : "关") + "</button>" +
        '<button class="hp-btn wide" data-set="title">回主菜单</button>' +
        '<button class="hp-btn wide danger" data-set="reset">重置存档</button>' +
        '<p class="hp-note">摇杆 / 自动战斗 / 二倍速等仍待批准。场景平涂新图等用户锁定后再换。</p></div>';
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

  function toggleFullscreen() {
    var d = document;
    if (!d.fullscreenElement && !d.webkitFullscreenElement) {
      var el = d.documentElement;
      (el.requestFullscreen || el.webkitRequestFullscreen || function () {}).call(el);
    } else {
      (d.exitFullscreen || d.webkitExitFullscreen || function () {}).call(d);
    }
  }

  function onPanelClick(e) {
    if (e.target === panel || e.target.closest("[data-close]")) {
      // Ignore ghost click that lands on the dimmer right after open (mobile).
      if (e.target === panel && Date.now() - panelOpenedAt < 500) return;
      closePanel(); return;
    }
    var b = e.target.closest("button"); if (!b) return;
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
      try { sessionStorage.setItem("jm12_new", "1"); } catch (er) {}
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
    if (showTalk) talkBtn.querySelector("span").textContent = "交谈 · " + (near.name || "");

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
