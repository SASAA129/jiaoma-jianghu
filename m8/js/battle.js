// M3 回合制战斗原型：我方 3 人 vs 敌方 1~2 人；按身法排出手顺序；攻击 / 武学 / 防御 / 道具 / 撤退。
(function () {
  var B = window.BATTLE, C = window.CHARACTERS, S = window.Sprites;
  var WW = 1536, WH = 1024, BS = 1.2;                // BS：战斗场景里所有人统一放大倍率
  var PH_BASE = 1306;
  var root, canvas, ctx, cmdEl, subEl, orderEl, statusEl, resultEl, tipEl;
  var st = null;          // 战斗状态
  var rand = Math.random;
  var POS_PARTY = { xiaoman: [1010, 610], feifei: [1150, 745], pangdi: [900, 840] };
  var POS_ENEMY = [[430, 800], [610, 650]];

  function el(tag, cls, html) { var e = document.createElement(tag); if (cls) e.className = cls; if (html != null) e.innerHTML = html; return e; }
  function build() {
    root = el("div", "ui hidden"); root.id = "battle";
    root.innerHTML =
      '<canvas class="bt-canvas"></canvas>' +
      '<div class="bt-title"></div>' +
      '<div class="bt-order"><span class="bt-order-label">出手顺序</span><div class="bt-order-list"></div></div>' +
      '<div class="bt-tip"></div>' +
      '<div class="bt-status"></div>' +
      '<div class="bt-cmd hidden">' +
      '<button data-cmd="attack">攻击</button><button data-cmd="skill">武学</button><button data-cmd="defend">防御</button>' +
      '<button data-cmd="item">道具</button><button data-cmd="flee">撤退</button></div>' +
      '<div class="bt-sub hidden"></div>' +
      '<div class="bt-result hidden"><div class="br-paper"><div class="br-big"></div><div class="br-title"></div><div class="br-lines"></div><div class="br-reward"></div><button data-br="back">回到地图</button></div></div>';
    document.getElementById("stage").appendChild(root);
    canvas = root.querySelector(".bt-canvas"); ctx = canvas.getContext("2d");
    cmdEl = root.querySelector(".bt-cmd"); subEl = root.querySelector(".bt-sub");
    orderEl = root.querySelector(".bt-order-list"); statusEl = root.querySelector(".bt-status");
    resultEl = root.querySelector(".bt-result"); tipEl = root.querySelector(".bt-tip");
    root.addEventListener("pointerdown", function (e) { e.stopPropagation(); });
    cmdEl.addEventListener("click", function (e) { var b = e.target.closest("button"); if (b && !b.disabled) command(b.getAttribute("data-cmd")); });
    subEl.addEventListener("click", function (e) {
      var b = e.target.closest("button"); if (!b || b.disabled) return;
      if (b.dataset.back) { closeSub(); setTip(actor().name + " 的回合：选择指令"); return; }
      if (b.dataset.skill) chooseSkill(b.dataset.skill); else if (b.dataset.item) chooseItem(b.dataset.item);
    });
    canvas.addEventListener("pointerup", function (e) {
      if (!st || !st.picking) return;
      var r = canvas.getBoundingClientRect(), x = (e.clientX - r.left) / r.width * WW, y = (e.clientY - r.top) / r.height * WH;
      var u = unitAt(x, y); if (u) pickTarget(u);
    });
    resultEl.querySelector("button").addEventListener("click", function () { end(); });
    window.addEventListener("keydown", function (e) {
      if (!st) return;
      e.stopImmediatePropagation(); e.preventDefault();
      if (e.key === "Escape" && st.picking) { st.picking = null; showCmd(true); setTip(actor().name + " 的回合：选择指令"); }
    }, true);
  }

  // ---------- 单位 ----------
  function makeParty(id) {
    var s = B.party[id], d = C.list[id];
    return { id: id, side: "party", name: d.name, sprite: d.sprite, color: d.color, phHeight: d.phHeight, heightMul: d.heightMul || 1,
      hp: s.hp, hpMax: s.hp, mp: s.mp, mpMax: s.mp, spd: s.spd, atk: s.atk, def: s.def, skills: s.skills,
      x: POS_PARTY[id][0], y: POS_PARTY[id][1], flip: true, defending: false, anim: null, shake: 0 };
  }
  function makeEnemy(id, i) {
    var s = B.enemies[id], PE = (st && st.cfg.posEnemy) || POS_ENEMY;
    return { id: id + (i ? "_" + i : ""), key: id, side: "enemy", name: s.name, sprite: s.sprite, color: s.color, phHeight: s.phHeight, heightMul: 1,
      hp: s.hp, hpMax: s.hp, mp: s.mp, mpMax: s.mp, spd: s.spd, atk: s.atk, def: s.def, skills: s.skills,
      // 立绘原始朝向 facing（默认 right）；敌人站在左边，要面朝右边的我方，原图朝左才翻转
      x: PE[i][0], y: PE[i][1], flip: (s.facing || "right") === "left", defending: false, anim: null, shake: 0 };
  }
  function alive(side) { return st.units.filter(function (u) { return u.hp > 0 && (!side || u.side === side); }); }
  function actor() { return st.order[st.turn]; }
  function unitHeight(u) {
    var r = u.sprite && S.get(u.sprite);
    if (r) return (r.meta.bodyH || r.meta.h) * C.spriteScale / (r.meta.prepScale || 1) * u.heightMul * BS;
    return PH_BASE * C.spriteScale * (u.phHeight || 1) * u.heightMul * BS;
  }
  function unitRect(u) { var h = unitHeight(u); return { x: u.x - h * 0.22, y: u.y - h, w: h * 0.44, h: h }; }
  function unitAt(x, y) {
    var c = st.units.filter(function (u) { return u.hp > 0 && st.picking.filter(u); });
    for (var i = c.length - 1; i >= 0; i--) { var r = unitRect(c[i]); if (x >= r.x && x <= r.x + r.w && y >= r.y && y <= r.y + r.h + 20) return c[i]; }
    return null;
  }

  // ---------- 流程 ----------
  function start(battleId, opts) {
    var cfg = B.battles[battleId]; if (!cfg) return false;
    opts = opts || {};
    st = { id: battleId, cfg: cfg, round: 0, turn: 0, order: [], floats: [], busy: false, picking: null, result: null, log: [],
      items: {}, onEnd: opts.onEnd || null, t: 0, fx: [], fxCount: { fx_skill: 0, fx_hit: 0 } };
    Object.keys(B.items).forEach(function (k) { st.items[k] = B.items[k].count; });
    st.units = C.party.map(makeParty).concat(cfg.enemies.slice(0, 2).map(makeEnemy));
    root.querySelector(".bt-title").textContent = cfg.title;
    resultEl.classList.add("hidden");
    root.classList.remove("hidden");
    resize();
    newRound();
    requestAnimationFrame(loop);
    return true;
  }
  function newRound() {
    st.round++;
    st.order = alive().slice().sort(function (a, b) { return b.spd - a.spd || (a.side === "party" ? -1 : 1); });
    st.turn = -1;
    log("—— 第 " + st.round + " 回合 ——");
    next();
  }
  function next() {
    if (checkEnd()) return;
    st.turn++;
    while (st.turn < st.order.length && st.order[st.turn].hp <= 0) st.turn++;
    if (st.turn >= st.order.length) { newRound(); return; }
    var u = actor();
    u.defending = false;                       // 防御持续到自己下次行动
    renderOrder(); renderStatus();
    if (u.side === "party") { showCmd(true); setTip(u.name + " 的回合：选择指令"); }
    else { showCmd(false); setTip(u.name + " 的回合……"); setTimeout(enemyAct, 650); }
  }
  function enemyAct() {
    if (!st || st.result) return;
    var u = actor(), targets = alive("party");
    var sk = u.skills.map(function (k) { return B.skills[k]; }).filter(function (s, i) { s._id = u.skills[i]; return s.mp <= u.mp; });
    var useSkill = sk.length && rand() < 0.45 ? sk[Math.floor(rand() * sk.length)] : null;
    var tgt = targets.slice().sort(function (a, b) { return a.hp / a.hpMax - b.hp / b.hpMax; })[rand() < 0.6 ? 0 : Math.floor(rand() * targets.length)];
    if (useSkill) doSkill(u, useSkill._id, useSkill.target === "allParty" ? targets : [tgt]);
    else doAttack(u, tgt);
  }
  function checkEnd() {
    if (!alive("enemy").length) { finish("win"); return true; }
    if (!alive("party").length) { finish("lose"); return true; }
    return false;
  }

  // ---------- 指令 ----------
  function command(c) {
    var u = actor(); closeSub();
    if (c === "attack") pick("选择攻击目标（点敌人）", function (t) { return t.side === "enemy"; }, function (t) { doAttack(u, t); });
    else if (c === "skill") openSub("skill");
    else if (c === "item") openSub("item");
    else if (c === "defend") { showCmd(false); u.defending = true; float(u, "防御", "#2f5d8a"); u.mp = Math.min(u.mpMax, u.mp + 30); log(u.name + " 摆出防御架势"); after(600); }
    else if (c === "flee") {
      showCmd(false);
      if (rand() < B.fleeChance) { float(u, "撤退！", "#2b2622"); log("撤退成功"); setTimeout(function () { finish("flee"); }, 700); }
      else { float(u, "撤退失败", "#b0281c"); log(u.name + " " + (st.cfg.fleeFail || "想撤，被拦住了")); after(800); }
    }
  }
  function openSub(kind) {
    var u = actor(), html = "";
    if (kind === "skill") u.skills.forEach(function (k) {
      var s = B.skills[k];
      html += '<button data-skill="' + k + '"' + (u.mp < s.mp ? " disabled" : "") + '><b>' + s.name + '</b><small>内力 ' + s.mp + " · " + (s.desc || "") + "</small></button>";
    });
    else Object.keys(B.items).forEach(function (k) {
      var it = B.items[k];
      var ic = it.icon && S.get(it.icon) ? '<img class="bt-icon" src="' + S.get(it.icon).meta.src + '" alt="">' : '<span class="bt-icon ph">' + it.name.slice(0, 1) + "</span>";
      html += '<button class="has-icon" data-item="' + k + '"' + (st.items[k] <= 0 ? " disabled" : "") + '>' + ic + '<span class="bt-itxt"><b>' + it.name + " ×" + st.items[k] + '</b><small>' + it.desc + "</small></span></button>";
    });
    html += '<button data-back="1" class="back">返回</button>';
    subEl.innerHTML = html; subEl.classList.remove("hidden"); cmdEl.classList.add("hidden");
    setTip(kind === "skill" ? "选择武学（消耗内力）" : "选择道具");
  }
  function closeSub() { subEl.classList.add("hidden"); if (st && actor() && actor().side === "party" && !st.picking) cmdEl.classList.remove("hidden"); }
  function chooseSkill(k) {
    var u = actor(), s = B.skills[k]; subEl.classList.add("hidden");
    if (s.target === "enemy") pick("「" + s.name + "」选择目标", function (t) { return t.side === "enemy"; }, function (t) { doSkill(u, k, [t]); });
    else if (s.target === "ally") pick("「" + s.name + "」选择同伴", function (t) { return t.side === "party"; }, function (t) { doSkill(u, k, [t]); });
    else if (s.target === "self") doSkill(u, k, [u]);
    else doSkill(u, k, alive("enemy"));
  }
  function chooseItem(k) {
    var u = actor(), it = B.items[k]; subEl.classList.add("hidden");
    pick("使用「" + it.name + "」：选择同伴", function (t) { return t.side === "party"; }, function (t) {
      showCmd(false); st.items[k]--;
      if (it.hp) { var h = Math.min(it.hp, t.hpMax - t.hp); t.hp += h; float(t, "+" + h, "#2e8b3a", null, 0, it.icon); }
      if (it.mp) { var m = Math.min(it.mp, t.mpMax - t.mp); t.mp += m; float(t, "+" + m + " 内力", "#2f6fae", null, 0, it.icon); }
      log(u.name + " 给 " + t.name + " 用了" + it.name);
      after(700);
    });
  }
  function pick(tip, filter, cb) { showCmd(false); st.picking = { filter: filter, cb: cb }; setTip(tip + "　(Esc 返回)"); }
  function pickTarget(u) { var p = st.picking; st.picking = null; p.cb(u); }

  // ---------- 结算 ----------
  function damage(a, t, power) {
    var v = Math.round(a.atk * power * (0.9 + rand() * 0.2) - t.def * 0.5);
    v = Math.max(1, v); if (t.defending) v = Math.max(1, Math.round(v / 2));
    return v;
  }
  function hit(a, t, power, delay) {
    setTimeout(function () {
      if (!st) return;
      var v = damage(a, t, power); t.hp = Math.max(0, t.hp - v); t.shake = 0.35;
      playFx("fx_hit", t, 230, 0.45, 0);
      float(t, "-" + v + (t.defending ? " 防" : ""), "#c0281c");
      if (t.hp <= 0) float(t, "倒下", "#2b2622", 26);
      renderStatus();
    }, delay || 0);
  }
  function lunge(a, t) { a.anim = { t: 0, dur: 0.5, tx: t.x + (a.side === "party" ? 120 : -120), ty: t.y }; }
  function doAttack(a, t) {
    showCmd(false); lunge(a, t); hit(a, t, 1, 250);
    log(a.name + " 攻击 " + t.name);
    after(900);
  }
  function doSkill(a, k, targets) {
    var s = B.skills[k]; showCmd(false);
    a.mp -= s.mp; float(a, "「" + s.name + "」", "#6b3fa0", 30);
    playFx("fx_skill", a, 300, 0.9, 2.5);                                   // 施放者处
    if (!s.heal) targets.forEach(function (t) { setTimeout(function () { if (st) playFx("fx_skill", t, 340, 0.8, -3); }, 200); });  // 目标处
    else targets.forEach(function (t) { if (t !== a) setTimeout(function () { if (st) playFx("fx_skill", t, 260, 0.8, 2); }, 250); });
    log(a.name + " 使出「" + s.name + "」");
    if (s.heal) targets.forEach(function (t) { var h = Math.min(s.heal, t.hpMax - t.hp); t.hp += h; setTimeout(function () { float(t, "+" + h, "#2e8b3a"); renderStatus(); }, 350); });
    else { if (targets.length === 1) lunge(a, targets[0]); targets.forEach(function (t, i) { hit(a, t, s.power, 300 + i * 120); }); }
    after(1100);
  }
  function after(ms) { st.busy = true; renderStatus(); setTimeout(function () { if (!st || st.result) return; st.busy = false; next(); }, ms); }
  function finish(kind) {
    if (st.result) return;
    st.result = kind; showCmd(false); subEl.classList.add("hidden"); setTip("");
    var r = st.cfg[kind] || {};
    var f = window.Dialog.flags;
    (r.set || []).forEach(function (k) { f[k] = true; });
    if (kind === "win" && r.flawless && st.units.every(function (u) { return u.side !== "party" || u.hp > 0; })) r.flawless.forEach(function (k) { f[k] = true; });
    if (window.Dialog.persist) window.Dialog.persist();
    resultEl.querySelector(".br-big").textContent = r.title || "";
    resultEl.querySelector(".br-big").className = "br-big " + kind;
    resultEl.querySelector(".br-title").textContent = { win: "比试胜利", lose: "比试落败", flee: "撤退成功" }[kind] + " · 共 " + st.round + " 回合";
    resultEl.querySelector(".br-lines").innerHTML = (r.lines || []).map(function (l) { return "<p>" + l + "</p>"; }).join("");
    resultEl.querySelector(".br-reward").textContent = r.reward || "";
    setTimeout(function () { resultEl.classList.remove("hidden"); }, 500);
  }
  function end() {
    var cb = st && st.onEnd, kind = st && st.result, tmap = (st && st.cfg.toast) || { win: "胜！", lose: "败了……改日再战", flee: "撤退了" };
    st = null; root.classList.add("hidden");
    if (window.Story) window.Story.refresh();
    if (cb) cb(kind);
    if (window.Game) window.Game.toast(tmap[kind] || "");
  }

  // ---------- 界面 ----------
  function setTip(t) { tipEl.textContent = t; tipEl.style.display = t ? "" : "none"; }
  function showCmd(v) { cmdEl.classList.toggle("hidden", !v); if (!v) subEl.classList.add("hidden"); }
  function log(t) { st.log.push(t); if (t.indexOf("——") !== 0) setTip(t); }
  // 数字（伤害/回复）飘在胸口；文字（武学名、防御、撤退）飘在头顶上方，避开顶部顺序条和敌人血条
  function float(u, text, color, size, dy, icon) {
    var H = unitHeight(u), isNum = /^[-+]\d/.test(text);
    var y = isNum ? u.y - H * 0.55 : Math.max(280, u.y - H - 70 + (dy || 0));
    st.floats.push({ x: u.x, y: y, text: text, color: color, size: size || (isNum ? 40 : 30), t: 0, icon: icon || null });
  }
  // 特效：fx_skill 武学（施放者/目标处，缓转）、fx_hit 每次命中（目标身上，快闪）。缺图时不播，不影响流程。
  function playFx(name, u, size, dur, spin) {
    if (!S.get(name)) return;
    var H = unitHeight(u);
    st.fx.push({ name: name, x: u.x, y: u.y - H * 0.5, size: size, dur: dur, t: 0, rot: Math.random() * Math.PI * 2, spin: spin || 0 });
    st.fxCount[name]++;
  }
  function renderOrder() {
    orderEl.innerHTML = "";
    st.order.forEach(function (u, i) {
      var c = el("div", "bt-chip " + u.side + (i === st.turn ? " cur" : "") + (u.hp <= 0 ? " dead" : "") + (i < st.turn ? " done" : ""));
      var cv = el("canvas"); cv.width = 72; cv.height = 72; c.appendChild(cv);
      c.appendChild(el("span", "", u.name + "<i>身法 " + u.spd + "</i>"));
      S.drawPortrait(cv, u.sprite, u.name, u.color);
      orderEl.appendChild(c);
    });
  }
  function renderStatus() {
    statusEl.innerHTML = alive().length >= 0 ? st.units.filter(function (u) { return u.side === "party"; }).map(function (u) {
      return '<div class="bs-row' + (actor() === u ? " cur" : "") + (u.hp <= 0 ? " dead" : "") + '"><b>' + u.name + (u.defending ? '<em>防</em>' : "") + '</b>' +
        '<div class="bs-bar hp"><i style="width:' + (u.hp / u.hpMax * 100) + '%"></i><span>气血 ' + u.hp + "/" + u.hpMax + "</span></div>" +
        '<div class="bs-bar mp"><i style="width:' + (u.mp / u.mpMax * 100) + '%"></i><span>内力 ' + u.mp + "/" + u.mpMax + "</span></div></div>";
    }).join("") : "";
  }
  function resize() {
    var main = document.getElementById("game");
    canvas.width = main.width; canvas.height = main.height;
  }

  // ---------- 绘制 ----------
  function drawUnit(u, dt) {
    var x = u.x, y = u.y;
    if (u.anim) {
      u.anim.t += dt; var k = u.anim.t / u.anim.dur, e = k < .5 ? k * 2 : (1 - k) * 2;
      x += (u.anim.tx - u.x) * e * 0.85; y += (u.anim.ty - u.y) * e * 0.85;
      if (k >= 1) u.anim = null;
    }
    if (u.shake > 0) { u.shake -= dt; x += Math.sin(st.t * 80) * 8; }
    var H = unitHeight(u), cur = actor() === u && !st.result;
    ctx.save();
    if (u.hp <= 0) ctx.globalAlpha = 0.35;
    ctx.fillStyle = "rgba(30,20,10,.3)"; ctx.beginPath(); ctx.ellipse(x, y, H * .2, H * .06, 0, 0, Math.PI * 2); ctx.fill();
    if (cur) { ctx.strokeStyle = "#c9a45c"; ctx.lineWidth = 4; ctx.beginPath(); ctx.ellipse(x, y, H * .26, H * .08, 0, 0, Math.PI * 2); ctx.stroke(); }
    if (st.picking && u.hp > 0 && st.picking.filter(u)) {
      ctx.strokeStyle = "rgba(192,40,28," + (0.6 + Math.sin(st.t * 8) * 0.4) + ")"; ctx.lineWidth = 5;
      ctx.beginPath(); ctx.ellipse(x, y, H * .3, H * .09, 0, 0, Math.PI * 2); ctx.stroke();
    }
    var bob = cur ? Math.sin(st.t * 5) * 3 : 0;
    var r = u.sprite && S.get(u.sprite);
    if (r) {
      var k2 = C.spriteScale / (r.meta.prepScale || 1) * u.heightMul * BS;
      ctx.save(); ctx.translate(x, y - bob); if (u.flip) ctx.scale(-1, 1);
      ctx.drawImage(r.img, -r.meta.ax * k2, -r.meta.h * k2, r.meta.w * k2, r.meta.h * k2); ctx.restore();
    } else S.placeholderPerson(ctx, x, y - bob, H, u.color, u.name, u.flip, false);
    ctx.restore();
    if (u.side === "enemy" && u.hp > 0) {      // 敌人头顶血条
      var w = 170, bx = u.x - w / 2, by = u.y - H - 44;
      ctx.fillStyle = "rgba(43,38,34,.8)"; ctx.fillRect(bx - 3, by - 26, w + 6, 44);
      ctx.fillStyle = "#f3e7c9"; ctx.font = "20px KaiTi, 'Noto Serif CJK SC', serif"; ctx.textAlign = "left"; ctx.textBaseline = "alphabetic";
      ctx.fillText(u.name, bx + 2, by - 6);
      ctx.fillStyle = "#3d3630"; ctx.fillRect(bx, by, w, 10);
      ctx.fillStyle = "#c0281c"; ctx.fillRect(bx, by, w * u.hp / u.hpMax, 10);
      ctx.fillStyle = "#e9dcc0"; ctx.font = "14px sans-serif"; ctx.textAlign = "right"; ctx.fillText(u.hp + "/" + u.hpMax, bx + w, by - 6);
    }
  }
  // 后厨门帘：与地图同一配置（map.js → kitchen.sprite），缺图则不画
  function drawCurtain() {
    var it = (window.MAP.interactables || []).filter(function (i) { return i.id === "kitchen"; })[0];
    if (!it || !it.sprite) return;
    var r = S.get(it.sprite.name); if (!r) return;
    var k = it.sprite.h / r.meta.h;
    ctx.drawImage(r.img, it.sprite.x - r.meta.ax * k, it.sprite.y - r.meta.ay * k, r.meta.w * k, r.meta.h * k);
  }
  var last = 0;
  function loop(ts) {
    if (!st) { last = 0; return; }
    var dt = Math.min(0.05, last ? (ts - last) / 1000 : 0); last = ts; st.t += dt;
    try {
      ctx.setTransform(canvas.width / WW, 0, 0, canvas.height / WH, 0, 0);
      // 背景：有 bg_battle 用它（只加很轻的暗角）；没有则退回压淡的店内背景；再没有就纯色
      // M4：战斗配置可指定 bg（如夜市 bg_market），缺图时用 bgFallback 的代码占位
      var bgb, bg;
      if (st.cfg.bg) {
        bgb = S.get(st.cfg.bg);
        if (bgb) ctx.drawImage(bgb.img, 0, 0, WW, WH);
        else if (st.cfg.bgFallback === "market" && window.MAP_MARKET) { S.placeholderMarket(ctx, window.MAP_MARKET, st.t); bgb = true; }
        else if (st.cfg.bgFallback === "river" && window.MAP_RIVER) { S.placeholderRiver(ctx, window.MAP_RIVER, st.t); bgb = true; }
        else if (st.cfg.bgFallback === "village" && window.MAP_VILLAGE) { S.placeholderVillage(ctx, window.MAP_VILLAGE, st.t); bgb = true; }
        else if (st.cfg.bgFallback === "hq" && window.MAP_HQ) { S.placeholderHq(ctx, window.MAP_HQ, st.t); bgb = true; }
        else if (st.cfg.bgFallback === "arena" && window.MAP_ARENA) { S.placeholderArena(ctx, window.MAP_ARENA, st.t); bgb = true; }
        if (bgb) { ctx.fillStyle = "rgba(20,24,40,.18)"; ctx.fillRect(0, 0, WW, WH); }
      } else {
        bgb = S.get("bg_battle"); bg = bgb || S.get("bg_room");
        if (bg) ctx.drawImage(bg.img, 0, 0, WW, WH); else { ctx.fillStyle = "#e3d6bb"; ctx.fillRect(0, 0, WW, WH); }
        drawCurtain();     // bg_battle 与 bg_room 构图逐像素对齐，门帘用地图里同一套坐标
      }
      if (!bgb) { ctx.fillStyle = "rgba(243,234,214,.55)"; ctx.fillRect(0, 0, WW, WH); }
      var g = ctx.createRadialGradient(WW / 2, WH * .62, 260, WW / 2, WH * .62, 950);
      g.addColorStop(0, "rgba(0,0,0,0)"); g.addColorStop(1, bgb ? "rgba(30,20,10,.28)" : "rgba(30,20,10,.55)"); ctx.fillStyle = g; ctx.fillRect(0, 0, WW, WH);
      ctx.strokeStyle = bgb ? "rgba(43,38,34,.22)" : "rgba(43,38,34,.35)"; ctx.lineWidth = 3;
      ctx.beginPath(); ctx.ellipse(WW / 2 + 60, 740, 620, 190, 0, 0, Math.PI * 2); ctx.stroke();
      st.units.slice().sort(function (a, b) { return a.y - b.y; }).forEach(function (u) { drawUnit(u, dt); });
      st.fx = st.fx.filter(function (f) { return (f.t += dt) < f.dur; });
      st.fx.forEach(function (f) {
        var r = S.get(f.name); if (!r) return;
        var k = f.t / f.dur, a = k < .2 ? k / .2 : (k > .6 ? (1 - k) / .4 : 1), sc = (0.6 + 0.5 * Math.min(1, k / .35)) * f.size / Math.max(r.meta.w, r.meta.h);
        ctx.save(); ctx.globalAlpha = Math.max(0, a); ctx.translate(f.x, f.y); ctx.rotate(f.rot + f.spin * f.t);
        ctx.drawImage(r.img, -r.meta.ax * sc, -r.meta.ay * sc, r.meta.w * sc, r.meta.h * sc);
        ctx.restore();
      });
      st.floats = st.floats.filter(function (f) { return (f.t += dt) < 1.3; });
      st.floats.forEach(function (f) {
        var k = f.t / 1.3;
        ctx.save(); ctx.globalAlpha = 1 - Math.max(0, k - .6) / .4;
        ctx.font = "bold " + f.size + "px KaiTi, 'Noto Serif CJK SC', serif"; ctx.textAlign = "center";
        var ic = f.icon && S.get(f.icon);
        if (ic) { var tw = ctx.measureText(f.text).width; ctx.drawImage(ic.img, f.x - tw / 2 - 52, f.y - k * 60 - 40, 48, 48); }
        ctx.lineWidth = 5; ctx.strokeStyle = "#fff6ea"; ctx.strokeText(f.text, f.x, f.y - k * 60);
        ctx.fillStyle = f.color; ctx.fillText(f.text, f.x, f.y - k * 60);
        ctx.restore();
      });
    } catch (err) { console.error(err); }
    requestAnimationFrame(loop);
  }

  window.Battle = {
    init: build, start: start, isOpen: function () { return !!st; },
    setRandom: function (f) { rand = f || Math.random; },
    state: function () {
      if (!st) return null;
      return { round: st.round, turn: st.turn, actor: actor() && actor().id, busy: st.busy, result: st.result, picking: !!st.picking,
        order: st.order.map(function (u) { return u.id; }), items: JSON.parse(JSON.stringify(st.items)), log: st.log.slice(),
        floats: st.floats.map(function (f) { return f.text; }), floatIcons: st.floats.filter(function (f) { return f.icon; }).map(function (f) { return f.icon; }),
        fx: st.fx.map(function (f) { return f.name; }), fxCount: JSON.parse(JSON.stringify(st.fxCount)), bg: st.cfg.bg ? (S.get(st.cfg.bg) ? st.cfg.bg : (st.cfg.bgFallback || "none")) : (S.get("bg_battle") ? "bg_battle" : (S.get("bg_room") ? "bg_room" : "none")), id: st.id,
        units: st.units.map(function (u) { return { id: u.id, name: u.name, side: u.side, hp: u.hp, hpMax: u.hpMax, mp: u.mp, mpMax: u.mpMax, spd: u.spd, defending: u.defending, x: u.x, y: u.y, h: unitHeight(u), sprite: !!(u.sprite && S.get(u.sprite)) }; }) };
    },
    // 测试用：直接对某单位造成伤害
    _debugSet: function (id, hp) { st.units.forEach(function (u) { if (u.id === id) u.hp = hp; }); renderStatus(); }
  };
})();
