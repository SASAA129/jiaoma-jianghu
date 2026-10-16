// M2 剧情层：三条分支线（路线切换、目标提示、结局卡、存档面板）。数据全部来自 data/dialogue.js。
(function () {
  var D = window.DIALOGUE, C = window.CHARACTERS;
  var ROUTES = D.routes || {}, ENDINGS = D.endings || {};
  var pendingEnding = null, cardOpen = false, resetArmed = 0;
  function flags() { return window.Dialog.flags; }

  // ---------- 剧情指令 ----------
  function startRoute(r) {
    var f = flags();
    Object.keys(ROUTES).forEach(function (k) { delete f["route_" + k]; });
    Object.keys(f).forEach(function (k) { if (k.indexOf(r + "_") === 0) delete f[k]; });  // 重玩该线时清掉旧进度
    f["route_" + r] = true;
    if (ROUTES[r] && ROUTES[r].hero) window.Game.setLeader(ROUTES[r].hero);
  }
  function finishRoute(r) {
    var f = flags();
    f["end_" + r] = true;
    delete f["route_" + r];
    pendingEnding = r;
  }
  function run(list) {
    list.forEach(function (cmd) {
      if (cmd.route) startRoute(cmd.route);
      if (cmd.ending) finishRoute(cmd.ending);
      if (cmd.leader) window.Game.setLeader(cmd.leader);
    });
    window.Dialog.persist && window.Dialog.persist();
    refresh();
  }
  function activeRoute() { var f = flags(); return Object.keys(ROUTES).filter(function (r) { return f["route_" + r]; })[0] || null; }

  // ---------- 当前目标 ----------
  function objective() {
    var f = flags(), r = activeRoute();
    if (r) {
      var st = ROUTES[r].stages.filter(function (s) { return !f[s.until]; })[0];
      if (st) return { route: r, text: st.text, target: st.target };
    }
    var all = Object.keys(ROUTES).every(function (k) { return f["end_" + k]; });
    if (all) return { route: null, text: "三条线都已完成！可以在满掌柜处重温任意一条。", target: null };
    if (!f.heard_jinnang) return { route: null, text: "店里气氛不对——找满掌柜问问", target: "zhanggui" };
    return { route: null, text: "回到满掌柜处，选一条线追查锦囊", target: "zhanggui" };
  }

  // ---------- 探索面板 ----------
  var objEl, routeEl;
  function buildPanel() {
    var panel = document.getElementById("explore"), list = document.getElementById("explore-list");
    objEl = document.createElement("div"); objEl.id = "objective";
    panel.insertBefore(objEl, list);
    routeEl = document.createElement("div"); routeEl.id = "routes";
    panel.insertBefore(routeEl, panel.querySelector(".hint"));
    var btn = document.createElement("button"); btn.id = "reset-save"; btn.textContent = "重置存档";
    btn.addEventListener("click", function () {
      if (Date.now() - resetArmed > 3000) { resetArmed = Date.now(); btn.textContent = "再点一次确认重置"; setTimeout(function () { btn.textContent = "重置存档"; }, 3000); return; }
      window.Save.reset();
      Object.keys(flags()).forEach(function (k) { delete flags()[k]; });
      window.Save.reset();
      location.reload();
    });
    panel.appendChild(btn);
  }
  function refresh() {
    if (!objEl) return;
    var o = objective(), f = flags();
    objEl.innerHTML = '<div class="obj-title">' + (o.route ? "当前目标 · " + ROUTES[o.route].name : "当前目标") + '</div><div class="obj-text">' + o.text + "</div>";
    document.querySelectorAll("#explore li").forEach(function (li) { li.classList.toggle("target", li.dataset.id === o.target); });
    routeEl.innerHTML = Object.keys(ROUTES).map(function (r) {
      var R = ROUTES[r], cls = f["end_" + r] ? "done" : (f["route_" + r] ? "active" : "");
      return '<div class="route ' + cls + '"><span class="rk">' + r + "</span>" + R.heroName + "线·" + (R.short || R.name) +
        (f["end_" + r] ? '<span class="done-seal">已完</span>' : (f["route_" + r] ? '<span class="cur">进行中</span>' : "")) + "</div>";
    }).join("");
  }

  // ---------- 地图上的标记 ----------
  // 贴墙的交互点贴图（如后厨门帘）：sprite.x/y = 门槛处底边中点（世界坐标），sprite.h = 显示高度，按高度等比缩放。
  // 画在地面层（人物之前）：它挂在后墙上，墙后没有可走格，所以人物永远在它前面。
  function hasSprite(it) { return it.sprite && window.Sprites.get(it.sprite.name); }
  function drawWallSprites(ctx) {
    window.MAP.interactables.forEach(function (it) {
      if (!hasSprite(it)) return;
      var r = window.Sprites.get(it.sprite.name), m = r.meta, k = it.sprite.h / m.h;
      ctx.drawImage(r.img, it.sprite.x - m.ax * k, it.sprite.y - m.ay * k, m.w * k, m.h * k);
    });
  }
  function drawHooks(ctx) {
    var t = performance.now() / 1000, o = objective();
    window.MAP.interactables.forEach(function (it) {
      if (it.kind !== "hotspot" || !it.hit || hasSprite(it)) return;   // 有贴图就不画占位小木牌
      var h = it.hit, x = h.x + h.w / 2, y = h.y + h.h * 0.55;
      ctx.save();
      ctx.font = "bold 24px KaiTi, 'Noto Serif CJK SC', serif"; ctx.textAlign = "center"; ctx.textBaseline = "middle";
      var w = ctx.measureText(it.label || it.name).width + 22;
      ctx.fillStyle = "rgba(243,234,214,.88)"; ctx.strokeStyle = "#2b2622"; ctx.lineWidth = 2;
      ctx.fillRect(x - w / 2, y - 18, w, 36); ctx.strokeRect(x - w / 2, y - 18, w, 36);
      ctx.fillStyle = "#2b2622"; ctx.fillText(it.label || it.name, x, y + 1);
      ctx.restore();
    });
    if (o.target && !window.Dialog.isOpen()) {
      var it = window.Game.interactable(o.target); if (!it) return;
      var a = window.Game.anchorOf(it), yy = a.y - 26 + Math.sin(t * 4) * 6;
      if (it.hit) yy = it.hit.y + 6 + Math.sin(t * 4) * 6;
      ctx.save();
      ctx.fillStyle = "#b0281c"; ctx.strokeStyle = "#fff6ea"; ctx.lineWidth = 3;
      ctx.beginPath(); ctx.moveTo(a.x, yy + 22); ctx.lineTo(a.x - 15, yy); ctx.lineTo(a.x + 15, yy); ctx.closePath();
      ctx.fill(); ctx.stroke();
      ctx.restore();
    }
  }

  // ---------- 结局卡 ----------
  var card;
  function buildCard() {
    card = document.createElement("div"); card.id = "ending"; card.className = "ui hidden";
    card.innerHTML = '<div class="ec-scroll"><div class="ec-rod top"></div><div class="ec-paper">' +
      '<canvas class="ec-art" width="360" height="560"></canvas><div class="ec-body">' +
      '<div class="ec-seal"></div><h1 class="ec-title"></h1><div class="ec-lines"></div><div class="ec-reward"></div>' +
      '<div class="ec-btns"><button data-ec="back">回到店里</button><button data-ec="rechoose">重新选择</button>' +
      '<button data-ec="m3" class="m3" disabled>挑战食客（战斗即将开放，M3）</button></div></div></div><div class="ec-rod bottom"></div></div>';
    document.getElementById("stage").appendChild(card);
    card.addEventListener("pointerdown", function (e) { e.stopPropagation(); });
    card.addEventListener("click", function (e) {
      var b = e.target.closest("button"); if (!b || b.disabled) return;
      var act = b.getAttribute("data-ec");
      hideCard();
      if (act === "rechoose") window.Dialog.open("zg_choose");
    });
    window.addEventListener("keydown", function (e) { if (cardOpen) { e.stopImmediatePropagation(); e.preventDefault(); } }, true);
  }
  function showCard(r) {
    var E = ENDINGS[r]; if (!E) return;
    card.querySelector(".ec-seal").textContent = "结局 · " + r;
    card.querySelector(".ec-title").textContent = E.title;
    card.querySelector(".ec-lines").innerHTML = E.lines.map(function (l) { return "<p>" + l + "</p>"; }).join("");
    card.querySelector(".ec-reward").textContent = E.reward;
    card.querySelector(".m3").style.display = E.m3 ? "" : "none";
    var cv = card.querySelector(".ec-art"), cx = cv.getContext("2d"), sp = window.Sprites.get(E.hero);
    cx.clearRect(0, 0, cv.width, cv.height);
    if (sp) {
      var k = Math.min((cv.width - 20) / sp.meta.w, (cv.height - 20) / sp.meta.h);
      var w = sp.meta.w * k, h = sp.meta.h * k;
      cx.drawImage(sp.img, (cv.width - w) / 2, cv.height - h - 6, w, h);
    } else {
      var name = (C.list[E.hero.replace(/^char_/, "")] || {}).name || "?";
      window.Sprites.placeholderPerson(cx, cv.width / 2, cv.height - 10, cv.height * .9, "#3b3a44", name, false, false);
    }
    window.Game.hideMenu();
    card.classList.remove("hidden"); cardOpen = true;
  }
  function hideCard() { card.classList.add("hidden"); cardOpen = false; refresh(); }

  function init() {
    buildPanel(); buildCard();
    window.Game.renderHooks.push(drawHooks);
    window.Game.bgHooks.push(drawWallSprites);
    window.Dialog.onClose(function () {
      if (pendingEnding) { var r = pendingEnding; pendingEnding = null; showCard(r); }
      refresh();
    });
    var r = activeRoute();
    if (r && ROUTES[r].hero) window.Game.setLeader(ROUTES[r].hero);   // 刷新后恢复队长
    refresh();
    setInterval(refresh, 500);
  }
  window.Story = { init: init, run: run, objective: objective, activeRoute: activeRoute, showCard: showCard,
    isCardOpen: function () { return cardOpen; }, refresh: refresh };
})();
