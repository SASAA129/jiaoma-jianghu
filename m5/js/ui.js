// M4 界面层：主菜单（继续游戏 / 新游戏）、章节标题卡、场景过场淡入淡出、获得提示、背包 / 人物 / 江湖志面板、新菜卡、终幕卡。
// 文字数据来自 data/dialogue.js（chapters）和 data/chapters.js。
(function () {
  var CH = window.CHAPTERS || { items: [], clues: [], titles: [], achievements: [] };
  var D = window.DIALOGUE || {};
  var stage, open = {}, gainQueue = [], gainBusy = false;
  function flags() { return (window.Dialog && window.Dialog.flags) || {}; }
  function cond(o) {
    if (!o) return true;
    var f = flags();
    return (o.if || []).every(function (k) { return f[k]; }) && !(o.ifNot || []).some(function (k) { return f[k]; }) &&
      (!o.ifAny || o.ifAny.some(function (k) { return f[k]; }));
  }
  function el(tag, cls, html, id) { var e = document.createElement(tag); if (cls) e.className = cls; if (id) e.id = id; if (html != null) e.innerHTML = html; return e; }
  function layer(id, cls) {
    var e = el("div", "ui hidden " + (cls || ""), "", id);
    e.addEventListener("pointerdown", function (ev) { ev.stopPropagation(); });
    stage.appendChild(e); return e;
  }
  function iconHTML(it, big) {
    var r = it.icon && window.Sprites.get(it.icon);
    if (r) return '<img class="ui-icon' + (big ? " big" : "") + (it.flip ? " flip" : "") + '" src="' + r.meta.src + '" alt="">';
    return '<span class="ui-icon ph' + (big ? " big" : "") + '">' + (it.glyph || it.name.slice(0, 1)) + "</span>";
  }
  function show(e, k) { e.classList.remove("hidden"); open[k] = true; }
  function hide(e, k) { e.classList.add("hidden"); open[k] = false; }

  // ---------- 主菜单 ----------
  var title, armedAt = 0;
  function buildTitle() {
    title = layer("title-menu");
    title.innerHTML = '<div class="tm-box"><div class="tm-seal">可玩原型 · 第一章～第三章</div><h1>椒麻<span>·</span>江湖</h1>' +
      '<div class="tm-sub">一锅红汤，几段江湖</div><div class="tm-save"></div>' +
      '<div class="tm-btns"><button data-tm="continue">继续游戏</button><button data-tm="new">新游戏</button></div>' +
      '<div class="tm-foot">点击地面行走 · 1/2/3 切换队长 · 空格交互</div></div>';
    title.addEventListener("click", function (e) {
      var b = e.target.closest("button"); if (!b || b.disabled) return;
      if (b.dataset.tm === "continue") { hide(title, "title"); window.Story && window.Story.refresh(); }
      if (b.dataset.tm === "new") {
        if (window.Save.exists() && Date.now() - armedAt > 3000) {
          armedAt = Date.now(); b.textContent = "会覆盖当前存档，再点一次确认";
          setTimeout(function () { b.textContent = "新游戏"; }, 3000); return;
        }
        newGame();
      }
    });
  }
  function newGame() {
    window.Save.reset();
    var f = flags(); Object.keys(f).forEach(function (k) { delete f[k]; });
    window.__noSave = true;          // 防止卸载前又写回旧位置
    try { sessionStorage.setItem("jm5_new", "1"); } catch (e) {}
    location.href = location.href.replace(/[?#].*$/, "");
  }
  function showTitle() {
    var sv = window.Save.load(), has = window.Save.exists();
    title.querySelector("[data-tm=continue]").disabled = !has;
    var info = "还没有存档";
    if (has) {
      var sc = sv.meta && window.Game.scenes[sv.meta.scene], t = new Date(sv.savedAt);
      var pad = function (n) { return (n < 10 ? "0" : "") + n; };
      info = "存档：" + (sv.chapter || "第一章") + " · " + (sc ? sc.name : "") + " · " + pad(t.getMonth() + 1) + "-" + pad(t.getDate()) + " " + pad(t.getHours()) + ":" + pad(t.getMinutes());
    }
    title.querySelector(".tm-save").textContent = info;
    show(title, "title");
  }

  // ---------- 章节标题卡 ----------
  var chap;
  function chapterCard(id, cb) {
    var c = (D.chapters || {})[id] || { seal: "", title: id, sub: "" };
    chap.innerHTML = '<div class="cc-seal">' + c.seal + '</div><div class="cc-title">' + c.title + '</div><div class="cc-sub">' + c.sub + '</div><div class="cc-skip">点击继续</div>';
    chap.dataset.ch = id;
    show(chap, "chapter");
    var done = false, finish = function () { if (done) return; done = true; chap.classList.add("out"); setTimeout(function () { chap.classList.remove("out"); hide(chap, "chapter"); cb && cb(); }, 450); };
    chap.onclick = finish;
    setTimeout(finish, 3200);
  }

  // ---------- 过场 ----------
  var fadeEl;
  function fade(label, mid, end) {
    fadeEl.innerHTML = '<div class="fd-label">' + (label || "") + "</div>";
    show(fadeEl, "fade"); fadeEl.classList.remove("in"); void fadeEl.offsetWidth; fadeEl.classList.add("in");
    setTimeout(function () {
      mid && mid();
      fadeEl.classList.add("label");
      setTimeout(function () {
        fadeEl.classList.remove("in", "label");
        setTimeout(function () { hide(fadeEl, "fade"); end && end(); }, 500);
      }, 900);
    }, 500);
  }

  // ---------- 获得提示 ----------
  var gainEl;
  function gain(id) { gainQueue.push(id); nextGain(); }
  function nextGain() {
    if (gainBusy) return;
    var id = gainQueue.shift(); if (!id) return;
    var it = CH.items.filter(function (i) { return i.id === id; })[0]; if (!it) return nextGain();
    gainBusy = true;
    gainEl.innerHTML = iconHTML(it, true) + '<div><div class="gn-t">获得</div><div class="gn-n">「' + it.name + "」</div></div>";
    gainEl.dataset.id = id;
    gainEl.classList.remove("hidden");
    setTimeout(function () { gainEl.classList.add("hidden"); gainBusy = false; setTimeout(nextGain, 200); }, 2400);
  }

  // ---------- 面板：背包 / 人物 / 江湖志 ----------
  var panel;
  function openPanel(kind) {
    if (!kind) return false;
    if (kind === "menu") { window.Game.hideMenu(); showTitle(); return true; }
    var body = "", head = { bag: "背 包", party: "人 物", log: "江 湖 志" }[kind];
    if (kind === "bag") {
      var items = CH.items.filter(cond);
      body = '<div class="pn-grid">' + items.map(function (it) {
        return '<div class="pn-item" data-item="' + it.id + '">' + iconHTML(it, true) + '<div class="pn-txt"><b>' + it.name + (it.count ? " ×" + it.count : "") + "</b><small>" + it.desc + "</small></div></div>";
      }).join("") + "</div>";
    } else if (kind === "party") {
      var B = window.BATTLE;
      body = '<div class="pn-party">' + window.CHARACTERS.party.map(function (id) {
        var d = window.CHARACTERS.list[id], s = B.party[id];
        return '<div class="pn-mem"><canvas width="120" height="120" data-sp="' + d.sprite + '" data-nm="' + d.name + '"></canvas><div><b>' + d.name + "</b>" +
          "<small>气血 " + s.hp + " · 内力 " + s.mp + " · 身法 " + s.spd + " · 攻 " + s.atk + " · 防 " + s.def + "</small>" +
          "<small>武学：" + s.skills.map(function (k) { return "「" + B.skills[k].name + "」"; }).join(" ") + "</small></div></div>";
      }).join("") + "</div>";
    } else if (kind === "log") {
      var clues = CH.clues.filter(cond), titles = CH.titles.filter(cond);
      body = '<div class="pn-cols"><div><h3>线索</h3>' + (clues.length ? clues.map(function (c) { return "<p>" + c.text + "</p>"; }).join("") : "<p class=\"dim\">还没有线索。</p>") + "</div>" +
        '<div><h3>称号</h3><div class="pn-titles">' + (titles.length ? titles.map(function (t) { return '<span class="title-seal" title="' + t.desc + '">' + t.name + "</span>"; }).join("") : '<p class="dim">还没有称号。</p>') + "</div>" +
        "<h3>成就</h3>" + achHTML() + "</div></div>";
    } else return false;
    panel.innerHTML = '<div class="pn-box"><div class="pn-head">' + head + '<button class="pn-close" data-close="1">✕</button></div><div class="pn-body">' + body + "</div></div>";
    panel.dataset.kind = kind;
    panel.querySelectorAll("canvas[data-sp]").forEach(function (cv) { window.Sprites.drawPortrait(cv, cv.dataset.sp, cv.dataset.nm, "#3b3a44"); });
    window.Game.hideMenu();
    show(panel, "panel");
    return true;
  }
  function achHTML() {
    return '<div class="pn-ach">' + CH.achievements.map(function (a) {
      var ok = cond(a);
      return '<div class="ach' + (ok ? " ok" : "") + '"><b>' + (ok ? a.name : "？？？") + "</b><small>" + a.desc + "</small></div>";
    }).join("") + "</div>";
  }

  // ---------- 新菜卡 / 终幕卡 ----------
  var bigCard;
  function showBigCard(kind, d, extra, btns, cb) {
    var ic = d.icon ? iconHTML({ icon: d.icon, glyph: "菜", name: d.title }, true) : "";
    bigCard.innerHTML = '<div class="bc-scroll"><div class="ec-rod"></div><div class="bc-paper"><div class="ec-seal">' + d.seal + "</div>" +
      '<h1>' + d.title + "</h1>" + (ic ? '<div class="bc-icon">' + ic + "</div>" : "") +
      '<div class="bc-lines">' + d.lines.map(function (l) { return "<p>" + l + "</p>"; }).join("") + "</div>" + (extra || "") +
      '<div class="bc-btns">' + btns.map(function (b) { return '<button data-bc="' + b[0] + '">' + b[1] + "</button>"; }).join("") + "</div></div><div class=\"ec-rod\"></div></div>";
    bigCard.dataset.kind = kind;
    show(bigCard, "card");
    bigCard.onclick = function (e) {
      var b = e.target.closest("button"); if (!b) return;
      hide(bigCard, "card"); cb && cb(b.dataset.bc);
    };
  }
  function showDish(cb) {
    var d = CH.dish;
    showBigCard("dish", d, '<div class="ec-reward">' + d.reward + "</div>", [["ok", "上菜！"]], function () { cb && cb(); });
  }
  function finale(cb) {
    var d = CH.finale, titles = CH.titles.filter(cond);
    var extra = '<div class="fn-cols"><div><h3>获得的称号（' + titles.length + "）</h3><div class=\"pn-titles\">" +
      titles.map(function (t) { return '<span class="title-seal">' + t.name + "</span>"; }).join("") + "</div></div>" +
      "<div><h3>成就（" + CH.achievements.filter(cond).length + "/" + CH.achievements.length + "）</h3>" + achHTML() + "</div></div>" +
      '<div class="fn-next">' + d.next + "</div>";
    showBigCard("finale", d, extra, [["stay", "回店里逛逛"], ["menu", "回主菜单"]], function (k) {
      if (k === "menu") showTitle();
      cb && cb();
    });
  }

  function blocking() { return Object.keys(open).some(function (k) { return open[k]; }) || !!(window.Story && window.Story.isCardOpen && window.Story.isCardOpen()) || !!(window.MiniGames && window.MiniGames.isOpen()); }

  function init() {
    stage = document.getElementById("stage");
    buildTitle();
    chap = layer("chapter-card");
    fadeEl = layer("fade");
    gainEl = el("div", "ui hidden", "", "gain"); stage.appendChild(gainEl);
    panel = layer("panel");
    panel.addEventListener("click", function (e) { if (e.target.closest("[data-close]") || e.target === panel) hide(panel, "panel"); });
    bigCard = layer("bigcard");
    window.addEventListener("keydown", function (e) {
      if (open.panel && e.key === "Escape") { hide(panel, "panel"); e.preventDefault(); }
    });
    var isNew = false;
    try { isNew = sessionStorage.getItem("jm5_new") === "1"; sessionStorage.removeItem("jm5_new"); } catch (e) {}
    var q = location.search;
    if (isNew) chapterCard("ch1", function () {});
    else if (!/[?&](skipmenu|scene|chapter)=/.test(q)) showTitle();
  }
  window.UI = { init: init, cond: cond, chapterCard: chapterCard, fade: fade, gain: gain, openPanel: openPanel, showDish: showDish, finale: finale,
    showTitle: showTitle, blocking: blocking, newGame: newGame,
    state: function () {
      return { open: JSON.parse(JSON.stringify(open)), chapter: chap && !chap.classList.contains("hidden") ? chap.dataset.ch : null,
        gain: gainEl && !gainEl.classList.contains("hidden") ? gainEl.dataset.id : null, card: open.card ? bigCard.dataset.kind : null,
        panel: open.panel ? panel.dataset.kind : null };
    } };
})();
