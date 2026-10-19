// 剧情层：第一～六章（全剧终）。数据全部来自 data/*.js / DIALOGUE_CH3。
// 对白里的 do 指令：route / leader / gain 立刻执行；ending / battle / minigame / card / title / finale / open 排队，等对话框关掉后按顺序执行。
(function () {
  var D = window.DIALOGUE, C = window.CHARACTERS;
  var ROUTES = D.routes || {}, ENDINGS = D.endings || {}, CH2 = D.chapter2 || { stages: [] }, CH3 = D.chapter3 || { stages: [] }, CH4 = D.chapter4 || { stages: [] }, CH5 = D.chapter5 || { stages: [] }, CH6 = D.chapter6 || { stages: [] };
  var pending = [], cardOpen = false, resetArmed = 0, busy = false;
  function flags() { return window.Dialog.flags; }
  function persist() { if (window.Dialog.persist) window.Dialog.persist(); }
  function cond(o) { return window.UI ? window.UI.cond(o) : true; }

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
    pending.push({ ending: r });
  }
  function run(list) {
    list.forEach(function (cmd) {
      if (cmd.route) startRoute(cmd.route);
      if (cmd.ending) finishRoute(cmd.ending);
      if (cmd.leader) window.Game.setLeader(cmd.leader);
      if (cmd.gain && window.UI) window.UI.gain(cmd.gain);
      if (cmd.battle || cmd.minigame || cmd.card || cmd.title || cmd.finale || cmd.open || cmd.cg) pending.push(cmd);
    });
    persist();
    refresh();
  }
  // 依次执行排队的指令（每个指令结束后再调 drain）
  function drain() {
    if (busy || window.Dialog.isOpen() || cardOpen || (window.Battle && window.Battle.isOpen())) return;
    var a = pending.shift(); if (!a) { refresh(); return; }
    busy = true;
    var done = function () { busy = false; refresh(); setTimeout(drain, 0); };
    if (a.ending) { busy = false; showCard(a.ending); return; }
    if (a.battle) { busy = false; startBattle(a.battle); return; }
    if (a.open) { busy = false; window.Dialog.open(a.open); return; }
    if (a.title) { window.UI.chapterCard(a.title, done); return; }
    if (a.card) { window.UI.showDish(function () { busy = false; if (a.then) window.Dialog.open(a.then); else done(); }, a.card === "feast" ? "feast" : "dish"); return; }
    if (a.finale === "ch2" || a.finale === 2) { window.UI.finale(done, "finale2"); return; }
    if (a.finale === "ch3" || a.finale === 3) { window.UI.finale(done, "finale3"); return; }
    if (a.finale === "ch4" || a.finale === 4) { window.UI.finale(done, "finale4"); return; }
    if (a.finale === "ch5" || a.finale === 5) { window.UI.finale(done, "finale5"); return; }
    if (a.finale) { window.UI.finale(done, "finale"); return; }
    if (a.cg) { window.UI.showCg(a.cg === true ? "ending" : a.cg, done); return; }
    if (a.minigame) {
      var opened = window.MiniGames && window.MiniGames.open(a.minigame, {
        onWin: function () { busy = false; persist(); refresh(); if (a.win) window.Dialog.open(a.win); else setTimeout(drain, 0); },
        onQuit: function () { busy = false; pending = []; refresh(); if (a.quit) window.Dialog.open(a.quit); }
      });
      if (!opened) { busy = false; if (a.win) window.Dialog.open(a.win); else setTimeout(drain, 0); }
      return;
    }
    done();
  }
  function activeRoute() { var f = flags(); return Object.keys(ROUTES).filter(function (r) { return f["route_" + r]; })[0] || null; }

  // ---------- 当前目标 ----------
  function exitTo(scene) { return window.Game.interactables().filter(function (i) { return i.kind === "exit" && i.to === scene; })[0]; }
  function chapter2Stage() {
    var f = flags();
    return CH2.stages.filter(function (s) { return !f[s.until]; })[0] || null;
  }
  function objective() {
    var f = flags(), r = activeRoute();
    if (!f.ch1_done) {
      if (r) {
        var st = ROUTES[r].stages.filter(function (s) { return !f[s.until]; })[0];
        if (st) return { route: r, text: st.text, target: st.target };
      }
      var post = (D.postObjectives || []).filter(cond)[0];
      if (post) return withScene({ route: null, text: post.text, target: post.target, scene: "shop" });
      if (!f.heard_jinnang) return withScene({ route: null, text: "店里气氛不对——找满掌柜问问", target: "zhanggui", scene: "shop" });
      return withScene({ route: null, text: "回到满掌柜处，选一条线追查锦囊", target: "zhanggui", scene: "shop" });
    }
    if (!f.c2_finale) {
      var s2 = chapter2Stage();
      if (!s2) return { route: null, chapter: 2, text: CH2.done, target: null };
      return withScene(stageObj(2, s2));
    }
    if (!f.c3_finale) {
      var s3 = (CH3.stages || []).filter(function (s) { return !f[s.until]; })[0];
      if (!s3) return { route: null, chapter: 3, text: CH3.done || "第三章完 · 待续", target: null };
      return withScene(stageObj(3, s3));
    }
    if (!f.c4_finale) {
      var s4 = (CH4.stages || []).filter(function (s) { return !f[s.until]; })[0];
      if (!s4) return { route: null, chapter: 4, text: CH4.done || "第四章完 · 待续", target: null };
      return withScene(stageObj(4, s4));
    }
    if (!f.c5_finale) {
      var s5 = (CH5.stages || []).filter(function (s) { return !f[s.until]; })[0];
      if (!s5) return { route: null, chapter: 5, text: CH5.done || "第五章完 · 待续", target: null };
      return withScene(stageObj(5, s5));
    }
    var s6 = (CH6.stages || []).filter(function (s) { return !f[s.until]; })[0];
    if (!s6) return { route: null, chapter: 6, text: CH6.done || "第六章完 · 全剧终", target: null };
    return withScene(stageObj(6, s6));
  }
  function stageObj(ch, st) {
    var f = flags(), o = { route: null, chapter: ch, text: st.text, target: st.target, scene: st.scene };
    if (st.checklist) {
      var left = st.checklist.filter(function (c) { return !f[c.flag]; });
      o.text = st.text + "（" + (st.checklist.length - left.length) + "/" + st.checklist.length + "）";
      o.target = left.length ? left[0].target : (st.target || (ch === 5 ? "cauldron" : ch === 4 ? "jiaonong" : "chuanniang"));
      if (!left.length) o.text = ch === 5 ? "三条线齐了——到大鼎前会合" : ch === 4 ? "三桩事办完了——回去找老椒农" : "三桩事办完了——找阿篙回话";
      o.checklist = st.checklist.map(function (c) { return { text: c.text, done: !!f[c.flag] }; });
    }
    return o;
  }
  // 目标不在当前场景：箭头改指向通往目标场景的出口
  function withScene(o) {
    if (o.scene && window.Game.scene && o.scene !== window.Game.scene()) {
      var ex = exitTo(o.scene);
      if (ex) { o.target = ex.id; o.via = ex.name; }
    }
    return o;
  }

  // ---------- 探索面板 ----------
  var objEl, routeEl, lastSig = "";
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
      try { sessionStorage.setItem("jm14_new", "1"); } catch (e) {}
      location.reload();
    });
    panel.appendChild(btn);
    // M9/M10：骨骼动画开关（默认控制白名单 RIG_CHARS 三人；?rig=all 时控制全员）
    var rb = document.createElement("button"); rb.id = "rig-toggle";
    var lab = function () { rb.textContent = (/[?&]rig=all/.test(location.search) ? "骨骼动画（全员）：" : "三人骨骼动画：") + (window.Rig && window.Rig.enabled() ? "开" : "关"); };
    lab(); rb.addEventListener("click", function () { if (window.Rig) { window.Rig.setEnabled(!window.Rig.enabled()); lab(); } });
    panel.appendChild(rb);
  }
  function refresh() {
    if (!objEl) return;
    window.Game.refreshVisibility();
    var o = objective(), f = flags();
    var title = o.route ? "当前目标 · " + ROUTES[o.route].name : (o.chapter ? ("当前目标 · 第" + "一二三四五六"[o.chapter] + "章") : "当前目标 · 第一章");
    var html = '<div class="obj-title">' + title + '</div><div class="obj-text">' + o.text + "</div>" +
      (o.via ? '<div class="obj-via">→ 先去「' + o.via + "」</div>" : "");
    var rhtml;
    if (f.c5_finale) {
      rhtml = '<div class="ch-name">第六章 · ' + (CH6.name || "") + "</div>" +
        '<div class="route"><span class="rk">★</span>三轮比赛 · 决战 · 回店交接</div>';
    } else if (f.c4_finale) {
      rhtml = '<div class="ch-name">第五章 · ' + (CH5.name || "") + "</div>" + ((CH5.stages || []).filter(function (s) { return s.checklist; })[0] || { checklist: [] }).checklist.map(function (c, i) {
        var d = !!f[c.flag];
        return '<div class="route ' + (d ? "done" : "") + '"><span class="rk">' + (i + 1) + "</span>" + c.text + (d ? '<span class="done-seal">已完</span>' : "") + "</div>";
      }).join("");
    } else if (f.c3_finale) {
      rhtml = '<div class="ch-name">第四章 · ' + (CH4.name || "") + "</div>" + ((CH4.stages || []).filter(function (s) { return s.checklist; })[0] || { checklist: [] }).checklist.map(function (c, i) {
        var d = !!f[c.flag];
        return '<div class="route ' + (d ? "done" : "") + '"><span class="rk">' + (i + 1) + "</span>" + c.text + (d ? '<span class="done-seal">已完</span>' : "") + "</div>";
      }).join("");
    } else if (f.c2_finale) {
      rhtml = '<div class="ch-name">第三章 · ' + (CH3.name || "") + "</div>" + ((CH3.stages || []).filter(function (s) { return s.checklist; })[0] || { checklist: [] }).checklist.map(function (c, i) {
        var d = !!f[c.flag];
        return '<div class="route ' + (d ? "done" : "") + '"><span class="rk">' + (i + 1) + "</span>" + c.text + (d ? '<span class="done-seal">已完</span>' : "") + "</div>";
      }).join("");
    } else if (f.ch1_done) {
      rhtml = '<div class="ch-name">第二章 · ' + (CH2.name || "") + "</div>" + (CH2.stages.filter(function (s) { return s.checklist; })[0] || { checklist: [] }).checklist.map(function (c, i) {
        var d = !!f[c.flag];
        return '<div class="route ' + (d ? "done" : "") + '"><span class="rk">' + (i + 1) + "</span>" + c.text + (d ? '<span class="done-seal">已完</span>' : "") + "</div>";
      }).join("");
    } else {
      rhtml = Object.keys(ROUTES).map(function (r) {
        var R = ROUTES[r], cls = f["end_" + r] ? "done" : (f["route_" + r] ? "active" : "");
        return '<div class="route ' + cls + '"><span class="rk">' + r + "</span>" + R.heroName + "线·" + (R.short || R.name) +
          (f["end_" + r] ? '<span class="done-seal">已完</span>' : (f["route_" + r] ? '<span class="cur">进行中</span>' : "")) + "</div>";
      }).join("");
    }
    var sig = html + rhtml;
    if (sig !== lastSig) { objEl.innerHTML = html; routeEl.innerHTML = rhtml; lastSig = sig; }
    document.querySelectorAll("#explore li").forEach(function (li) { li.classList.toggle("target", li.dataset.id === o.target); });
  }

  // ---------- M13：「任务」面板里的「路线」一节（取代右侧探索栏里的 A/B/C） ----------
  // 第一章：A/B/C 三条线；之后各章：本章清单。行数据给 hud.js 渲染。
  function routeInfo() {
    var f = flags();
    var chk = function (ch, CHX) {
      var st = (CHX.stages || []).filter(function (s) { return s.checklist; })[0] || { checklist: [] };
      return { kind: "checklist", title: "第" + "一二三四五六"[ch] + "章 · " + (CHX.name || ""), rows: st.checklist.map(function (c, i) {
        return { key: c.flag, rk: String(i + 1), text: c.text, state: f[c.flag] ? "done" : "", target: c.target || null };
      }) };
    };
    if (f.c5_finale) return { kind: "checklist", title: "第六章 · " + (CH6.name || ""), rows: [{ key: "c6", rk: "★", text: "三轮比赛 · 决战 · 回店交接", state: f.c6_finale ? "done" : "", target: null }] };
    if (f.c4_finale) return chk(5, CH5);
    if (f.c3_finale) return chk(4, CH4);
    if (f.c2_finale) return chk(3, CH3);
    if (f.ch1_done) return chk(2, CH2);
    return { kind: "routes", title: "第一章 · 三条线（选线找满掌柜）", rows: Object.keys(ROUTES).map(function (r) {
      var R = ROUTES[r];
      return { key: r, rk: r, text: R.heroName + "线·" + (R.short || R.name), state: f["end_" + r] ? "done" : (f["route_" + r] ? "active" : ""), target: "zhanggui" };
    }) };
  }
  // 点路线 = 走到满掌柜身边，开他的选线对白，并替玩家点下同一个选项（Dialog.choose，与手点选项完全一样：route 指令 + 切队长 + 接后续对白）
  var autoRoute = null;
  function routeOptionIndex(r) {
    var n = D.nodes.zg_choose; if (!n) return -1;
    var list = (n.options || []).filter(function (o) { return cond(o); });
    for (var i = 0; i < list.length; i++) if ((list[i].do || []).some(function (d) { return d.route === r; })) return i;
    return -1;
  }
  function pickRoute(r) {
    var f = flags();
    if (f.ch1_done || !ROUTES[r]) return "closed";
    if (f["route_" + r]) { window.Game.toast("这条线正在查"); return "active"; }
    if (window.Hud && window.Hud.close) window.Hud.close();
    if (!window.Game.interactable("zhanggui")) { window.Game.toast("回火锅店找满掌柜选线"); return "away"; }
    autoRoute = { r: r, t: Date.now() };
    window.Game.goInteract("zhanggui", function () {
      if (flags().heard_jinnang) window.Dialog.open("zg_choose");
      else window.Dialog.startEntry("zhanggui", "talk");     // 还没听掌柜说锦囊：先播开场，到选线那句时再替你选
    });
    return "go";
  }
  function goRow(target) {
    if (window.Hud && window.Hud.close) window.Hud.close();
    var it = target && window.Game.interactable(target);
    if (it) { window.Game.goInteract(target); return "go"; }
    window.Game.toast("不在这里——看「当前目标」"); return "away";
  }
  setInterval(function () {
    if (!autoRoute) return;
    if (window.Dialog.isOpen()) autoRoute.seen = true;                     // 开场对白可能读很久：对话开着就一直等
    else if (autoRoute.seen || Date.now() - autoRoute.t > 45000) { autoRoute = null; return; }   // 对白关了还没到选线 / 走了 45 秒没到 → 作废
    if (window.Dialog.current() === "zg_choose") {
      var i = routeOptionIndex(autoRoute.r); autoRoute = null;
      window.Dialog.finish(); if (i >= 0) window.Dialog.choose(i);
    }
  }, 80);

  // ---------- 地图上的标记 ----------
  // 贴墙的交互点贴图（如后厨门帘）：sprite.x/y = 门槛处底边中点（世界坐标），sprite.h = 显示高度，按高度等比缩放。
  function hasSprite(it) { return it.sprite && window.Sprites.get(it.sprite.name); }
  function drawWallSprites(ctx) {
    window.Game.interactables().forEach(function (it) {
      if (!hasSprite(it)) return;
      var r = window.Sprites.get(it.sprite.name), m = r.meta, k = it.sprite.h / m.h;
      ctx.drawImage(r.img, it.sprite.x - m.ax * k, it.sprite.y - m.ay * k, m.w * k, m.h * k);
    });
  }
  // M13：平涂底图的招牌是空白木匾 → 程序写上「椒麻鸡火锅」（顺着匾面斜度）
  // M13：招牌字改为画进底图 bg_room_flat_sign（map.js signText = null 时这里不画任何东西）。
  // 保留斜切画法作备用：signText 填 {text,x,y,size,skew} 即按木匾透视画金字，不画底板。
  var SIGN_FONT = "'PingFang SC','HarmonyOS Sans SC','MiSans','Noto Sans SC','Noto Sans CJK SC','Source Han Sans SC','Microsoft YaHei',sans-serif";
  function signBox() {
    var s = window.Game.map().signText; if (!s) return null;
    // 斜切后外接框（截图/热区用）：按字宽 × |skew| 估竖直外扩
    var fs = s.size || 56, n = Array.from(s.text || "").length, gap = Math.round(fs * 0.08);
    var tw = n * fs + Math.max(0, n - 1) * gap, th = fs * 1.15;
    var sk = s.skew || 0, pad = 18;
    var x0 = s.x - tw / 2 - pad, x1 = s.x + tw / 2 + pad;
    var yTop = Math.min(s.y - th / 2 + sk * (-tw / 2), s.y - th / 2 + sk * (tw / 2)) - pad;
    var yBot = Math.max(s.y + th / 2 + sk * (-tw / 2), s.y + th / 2 + sk * (tw / 2)) + pad;
    return { x: x0, y: yTop, w: x1 - x0, h: yBot - yTop, cx: s.x, cy: s.y, size: fs, text: s.text, skew: sk };
  }
  function drawShopSign(ctx) {
    if (window.Game.scene() !== "shop" || !window.Sprites.get("bg_room")) return;
    var s = window.Game.map().signText; if (!s || !s.text) return;
    var fs = s.size || 56, chars = Array.from(s.text), gap = Math.round(fs * 0.08);
    var total = chars.length * fs + Math.max(0, chars.length - 1) * gap;
    ctx.save();
    // 当前相机变换 × 平移到匾心 × 竖直剪切（右端上扬，贴合木匾透视）
    var m = ctx.getTransform().multiply(new DOMMatrix([1, s.skew || 0, 0, 1, s.x, s.y]));
    ctx.setTransform(m);
    ctx.font = "900 " + fs + "px " + SIGN_FONT;
    ctx.textAlign = "center"; ctx.textBaseline = "middle";
    ctx.lineJoin = "round"; ctx.miterLimit = 2;
    chars.forEach(function (ch, i) {
      var x = -total / 2 + fs / 2 + i * (fs + gap);
      // 薄暗描边 + 金字（无底板），贴在木匾炭黑面上
      ctx.lineWidth = Math.max(3, fs * 0.08);
      ctx.strokeStyle = "rgba(20,16,12,.72)";
      ctx.strokeText(ch, x, 1);
      ctx.fillStyle = "#E8C77E";
      ctx.fillText(ch, x, 0);
    });
    ctx.restore();
  }
  function drawHooks(ctx) {
    var t = performance.now() / 1000, o = objective();
    window.Game.interactables().forEach(function (it) {
      if ((it.kind !== "hotspot" && it.kind !== "exit") || !it.hit || hasSprite(it)) return;   // 有贴图就不画占位小木牌
      var h = it.hit, x = h.x + h.w / 2, y = h.y + h.h * 0.55;
      ctx.save();
      ctx.font = "bold 24px KaiTi, 'Noto Serif CJK SC', serif"; ctx.textAlign = "center"; ctx.textBaseline = "middle";
      var label = (it.kind === "exit" ? "⇦ " : "") + (it.label || it.name), w = ctx.measureText(label).width + 22;
      ctx.fillStyle = it.kind === "exit" ? "rgba(43,38,34,.82)" : "rgba(243,234,214,.88)"; ctx.strokeStyle = it.kind === "exit" ? "#c9a45c" : "#2b2622"; ctx.lineWidth = 2;
      ctx.fillRect(x - w / 2, y - 18, w, 36); ctx.strokeRect(x - w / 2, y - 18, w, 36);
      ctx.fillStyle = it.kind === "exit" ? "#f3e7c9" : "#2b2622"; ctx.fillText(label, x, y + 1);
      ctx.restore();
    });
    if (o.target && !window.Dialog.isOpen() && !window.Markers) {   // M13：目标改由头顶名牌（js/markers.js）表示
      var it = window.Game.interactable(o.target); if (!it) return;
      var a = window.Game.anchorOf(it), yy = a.y - 26 + Math.sin(t * 4) * 6;
      if (it.hit) yy = it.hit.y + 6 + Math.sin(t * 4) * 6;
      if (it.kind === "exit") yy = it.hit.y - 30 + Math.sin(t * 4) * 6;
      ctx.save();
      ctx.fillStyle = "#b0281c"; ctx.strokeStyle = "#fff6ea"; ctx.lineWidth = 3;
      ctx.beginPath(); ctx.moveTo(a.x, yy + 22); ctx.lineTo(a.x - 15, yy); ctx.lineTo(a.x + 15, yy); ctx.closePath();
      ctx.fill(); ctx.stroke();
      ctx.restore();
    }
  }

  // ---------- 场景切换 ----------
  function useExit(it) {
    window.Game.hideMenu();
    if (window.Dialog.startEntry(it.id, "talk")) return;        // 出口被剧情锁住时（如第一章还没完）播放提示对白
    travel(it.to, it.entrance);
  }
  function travel(to, entrance) {
    var m = window.Game.scenes[to]; if (!m) return;
    window.UI.fade(m.name, function () {
      window.Game.setScene(to, entrance);
      if (window.WorldMap) window.WorldMap.markSeen(to);
      persist(); refresh();
    }, function () {
      var se = (D.sceneEnter || []).filter(function (e) { return e.scene === to && cond(e); })[0];
      if (se) window.Dialog.open(se.node);
    });
  }

  // ---------- 结局卡（第一章） ----------
  var card;
  function buildCard() {
    card = document.createElement("div"); card.id = "ending"; card.className = "ui hidden";
    card.innerHTML = '<div class="ec-scroll"><div class="ec-rod top"></div><div class="ec-paper">' +
      '<canvas class="ec-art" width="360" height="560"></canvas><div class="ec-body">' +
      '<div class="ec-seal"></div><h1 class="ec-title"></h1><div class="ec-lines"></div><div class="ec-reward"></div>' +
      '<div class="ec-btns"><button data-ec="next" class="primary">当面打开锦囊</button>' +
      '<button data-ec="m3" class="m3 primary">现在就去迎战</button><button data-ec="back">先准备一下</button></div></div></div><div class="ec-rod bottom"></div></div>';
    document.getElementById("stage").appendChild(card);
    card.addEventListener("pointerdown", function (e) { e.stopPropagation(); });
    card.addEventListener("click", function (e) {
      var b = e.target.closest("button"); if (!b || b.disabled) return;
      var act = b.getAttribute("data-ec"), E = ENDINGS[card.dataset.r] || {};
      hideCard();
      if (act === "next" && E.next) window.Dialog.open(E.next);
      else if (act === "m3") startBattle("labupa");
      else setTimeout(drain, 0);
    });
    window.addEventListener("keydown", function (e) { if (cardOpen) { e.stopImmediatePropagation(); e.preventDefault(); } }, true);
  }
  function showCard(r) {
    var E = ENDINGS[r]; if (!E) return;
    card.dataset.r = r;
    card.querySelector(".ec-seal").textContent = "第一章 · 结局 " + r;
    card.querySelector(".ec-title").textContent = E.title;
    card.querySelector(".ec-lines").innerHTML = E.lines.map(function (l) { return "<p>" + l + "</p>"; }).join("");
    card.querySelector(".ec-reward").textContent = E.reward;
    var bn = card.querySelector("[data-ec=next]"), bm = card.querySelector(".m3"), bb = card.querySelector("[data-ec=back]");
    bn.style.display = E.next ? "" : "none"; bn.textContent = E.nextLabel || "继续";
    bm.style.display = E.m3 ? "" : "none"; bm.textContent = E.m3Label || "迎战";
    bb.style.display = ""; bb.textContent = E.laterLabel || (E.next ? "稍后再开" : "回到店里");
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

  // ---------- 战斗 ----------
  var AFTER_WIN = { labupa: "M_1", hongtang: "LB_1", tiesuanpan: "OPEN_1", madawang: "MW_reform", chilaosan: "POST_1", chilaosan_final: "JD_crown" };     // 赢了之后自动接的对白
  function startBattle(id) {
    window.Game.hideMenu();
    if (!window.Battle) return;
    window.Battle.start(id, { onEnd: function (kind) {
      persist(); refresh();
      if (kind === "win" && AFTER_WIN[id] && !(id === "labupa" && flags().ch1_done)) setTimeout(function () { window.Dialog.open(AFTER_WIN[id]); }, 300);
      else setTimeout(drain, 0);
    } });
  }

  function init() {
    if (window.Battle) window.Battle.init();
    buildPanel(); buildCard();
    window.Game.renderHooks.push(drawHooks);
    window.Game.bgHooks.push(drawWallSprites);
    window.Game.bgHooks.push(drawShopSign);
    window.Game.signBox = signBox;
    window.Dialog.onClose(function () { refresh(); setTimeout(drain, 0); });
    // 读档：恢复场景、位置、队长
    var sv = window.Save.load(), meta = sv && sv.meta, q = location.search;
    var forcedScene = (q.match(/[?&]scene=(market|river|shop|village|hq|arena)/) || [])[1];
    var forceCh3 = /[?&]chapter=3/.test(q), forceCh4 = /[?&]chapter=4/.test(q), forceCh5 = /[?&]chapter=5/.test(q), forceCh6 = /[?&]chapter=6/.test(q);
    if (forceCh3 || forceCh4 || forceCh5 || forceCh6) {
      window.__noSave = true;
      var f0 = flags(), base = ["heard_jinnang","end_A","ch1_done","c2_finale","item_treasure_map","c2_combined","c2_dish"];
      base.forEach(function (k) { f0[k] = true; });
      var ch3 = ["c3_arrived","c3_met_agu","c3_e1_done","c3_e2_done","c3_e3_done","c3_clues","c3_box_safe","c3_ts_win","c3_got_pepper","c3_finale","item_golden_pepper"];
      var ch4 = ["c4_arrived","c4_met_nong","c4_e1_done","c4_e2_done","c4_e3_done","c4_quests","c4_talked","c4_mw_win","c4_reformed","c4_finale"];
      var ch5 = ["c5_arrived","c5_inside","c5_e1_done","c5_e2_done","c5_e3_done","c5_quests","c5_truth","c5_cl_tried","c5_fought","c5_finale","item_challenge"];
      if (forceCh6) {
        ch3.concat(ch4).concat(ch5).forEach(function (k) { f0[k] = true; });
        forcedScene = forcedScene || "arena";
      } else if (forceCh5) {
        ch3.concat(ch4).forEach(function (k) { f0[k] = true; });
        forcedScene = forcedScene || "hq";
      } else if (forceCh4) {
        ch3.forEach(function (k) { f0[k] = true; });
        forcedScene = forcedScene || "village";
      } else {
        forcedScene = forcedScene || "river";
      }
    }
    if (forcedScene) { window.__noSave = true; window.Game.setScene(forcedScene); }
    else if (meta && meta.scene && window.Game.scenes[meta.scene]) window.Game.setScene(meta.scene, null, meta.cells, meta.leader);
    var r = activeRoute();
    if (r && ROUTES[r].hero && !(meta && meta.leader)) window.Game.setLeader(ROUTES[r].hero);
    if (window.UI) window.UI.init();
    if (window.WorldMap) window.WorldMap.markSeen(window.Game.scene());
    refresh();
    setInterval(refresh, 500);
    // 校准 / 调试入口：强制进场景后也播一次 sceneEnter
    if (forcedScene) {
      setTimeout(function () {
        var se = (D.sceneEnter || []).filter(function (e) { return e.scene === forcedScene && cond(e); })[0];
        if (se) window.Dialog.open(se.node);
      }, 400);
    }
  }
  window.Story = { init: init, run: run, objective: objective, routeInfo: routeInfo, pickRoute: pickRoute, goRow: goRow, activeRoute: activeRoute, showCard: showCard,
    isCardOpen: function () { return cardOpen; }, refresh: refresh, startBattle: startBattle, useExit: useExit, travel: travel,
    pending: function () { return pending.slice(); }, drain: drain };
})();
