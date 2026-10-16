// M4 第二章小玩法：emblem 认家徽 / duel 比口才 / wok 颠勺 / combine 合成秘方。参数和文字在 data/minigames.js。
// MiniGames.open(name, {onWin, onQuit})；赢了调用 onWin（对白里的 win 节点接着播），点“先不玩了”调用 onQuit。
(function () {
  var MG = window.MINIGAMES || {};
  var root, cur = null, raf = 0;
  function flags() { return window.Dialog.flags; }
  function el(tag, cls, html) { var e = document.createElement(tag); if (cls) e.className = cls; if (html != null) e.innerHTML = html; return e; }
  function shuffle(a) { a = a.slice(); for (var i = a.length - 1; i > 0; i--) { var j = Math.floor(Math.random() * (i + 1)); var t = a[i]; a[i] = a[j]; a[j] = t; } return a; }
  function build() {
    root = el("div", "ui hidden"); root.id = "minigame";
    root.addEventListener("pointerdown", function (e) { e.stopPropagation(); });
    document.getElementById("stage").appendChild(root);
    window.addEventListener("keydown", function (e) {
      if (!cur) return;
      e.stopImmediatePropagation(); e.preventDefault();
      if (cur.name === "wok" && (e.code === "Space" || e.key === "Enter")) wokPress();
    }, true);
  }
  function frame(title, who, body) {
    root.innerHTML = '<div class="mg-box"><div class="mg-head"><span class="mg-title">' + title + '</span>' + (who ? '<span class="mg-who">' + who + "上场</span>" : "") +
      '<button class="mg-quit">先不玩了</button></div><div class="mg-body">' + body + '</div><div class="mg-msg"></div></div>';
    root.querySelector(".mg-quit").addEventListener("click", quit);
  }
  function msg(t, cls) { var m = root.querySelector(".mg-msg"); m.textContent = t || ""; m.className = "mg-msg " + (cls || ""); }
  function open(name, cb) {
    if (!root) build();
    var cfg = MG[name]; if (!cfg) return false;
    cur = { name: name, cfg: cfg, cb: cb || {}, mistakes: 0 };
    root.classList.remove("hidden");
    ({ emblem: openEmblem, duel: openDuel, wok: openWok, combine: openCombine })[name]();
    return true;
  }
  function close() { cancelAnimationFrame(raf); root.classList.add("hidden"); root.innerHTML = ""; cur = null; }
  function win() {
    var c = cur; if (!c) return;
    if (c.cfg.perfectFlag && c.mistakes === 0) flags()[c.cfg.perfectFlag] = true;
    if (c.cfg.doneFlag) flags()[c.cfg.doneFlag] = true;
    window.Dialog.persist();
    if (c.cfg.gain && window.UI) window.UI.gain(c.cfg.gain);
    close();
    c.cb.onWin && c.cb.onWin();
  }
  function quit() { var c = cur; close(); c && c.cb.onQuit && c.cb.onQuit(); }

  // ================= 认家徽 =================
  function drawEmblem(ctx, cx, cy, R, p, col, bg) {
    ctx.save(); ctx.translate(cx, cy);
    if (bg) { ctx.fillStyle = bg; ctx.beginPath(); ctx.arc(0, 0, R * 1.12, 0, Math.PI * 2); ctx.fill(); }
    ctx.strokeStyle = col; ctx.fillStyle = col; ctx.lineWidth = R * 0.07; ctx.lineCap = "round";
    var gap = p.notch ? [-Math.PI * 0.36, -Math.PI * 0.14] : null;
    for (var i = 0; i < p.ring; i++) {
      var rr = R * (1 - i * 0.14);
      ctx.beginPath();
      if (gap && i === 0) ctx.arc(0, 0, rr, gap[1], gap[0] + Math.PI * 2); else ctx.arc(0, 0, rr, 0, Math.PI * 2);
      ctx.stroke();
    }
    if (gap) {   // 锁眼形缺口
      var a = (gap[0] + gap[1]) / 2, kx = Math.cos(a) * R, ky = Math.sin(a) * R;
      ctx.beginPath(); ctx.arc(kx, ky, R * 0.08, 0, Math.PI * 2); ctx.stroke();
    }
    for (var k = 0; k < p.petals; k++) {   // 椒叶
      var ang = -Math.PI / 2 + k * Math.PI * 2 / p.petals;
      ctx.save(); ctx.rotate(ang); ctx.beginPath();
      ctx.moveTo(R * 0.22, 0); ctx.quadraticCurveTo(R * 0.45, -R * 0.2, R * 0.68, 0); ctx.quadraticCurveTo(R * 0.45, R * 0.2, R * 0.22, 0);
      ctx.fill(); ctx.restore();
    }
    if (p.center === "jiao") [[0, -0.1], [-0.09, 0.07], [0.09, 0.07]].forEach(function (q) { ctx.beginPath(); ctx.arc(q[0] * R, q[1] * R, R * 0.07, 0, Math.PI * 2); ctx.fill(); });
    else if (p.center === "flame") { ctx.beginPath(); ctx.moveTo(0, -R * 0.18); ctx.quadraticCurveTo(R * 0.14, 0, 0, R * 0.14); ctx.quadraticCurveTo(-R * 0.14, 0, 0, -R * 0.18); ctx.fill(); }
    else { ctx.beginPath(); ctx.arc(0, 0, R * 0.1, 0, Math.PI * 2); ctx.fill(); }
    ctx.restore();
  }
  function same(a, b) { return a.ring === b.ring && a.petals === b.petals && a.center === b.center && !!a.notch === !!b.notch; }
  function openEmblem() {
    var c = cur.cfg; cur.opts = shuffle(c.options);
    frame(c.title, c.who, '<div class="em-wrap"><div class="em-ref"><canvas width="300" height="300"></canvas><div class="em-lab">' + c.refLabel + '</div></div>' +
      '<div class="em-right"><p class="mg-tip">' + c.tip + '</p><div class="em-grid">' + cur.opts.map(function (o, i) {
        return '<button class="em-opt" data-i="' + i + '"><canvas width="180" height="180"></canvas></button>';
      }).join("") + "</div></div></div>");
    var rc = root.querySelector(".em-ref canvas").getContext("2d");
    rc.fillStyle = "#7a1810"; rc.fillRect(0, 0, 300, 300);
    rc.save(); rc.translate(150, 150); rc.rotate(0.5); drawEmblem(rc, 0, 0, 100, c.answer, "#e0bd6e"); rc.restore();
    var g = rc.createRadialGradient(95, 215, 10, 95, 215, 120); g.addColorStop(0, "rgba(60,30,10,.55)"); g.addColorStop(1, "rgba(60,30,10,0)");
    rc.fillStyle = g; rc.fillRect(0, 0, 300, 300);
    root.querySelectorAll(".em-opt").forEach(function (b, i) {
      drawEmblem(b.querySelector("canvas").getContext("2d"), 90, 90, 64, cur.opts[i], "#d9a35a", "#4a2e18");
      b.addEventListener("click", function () { pickEmblem(i, b); });
    });
  }
  function pickEmblem(i, b) {
    if (!cur || cur.locked) return;
    var c = cur.cfg, o = cur.opts[i];
    if (same(o, c.answer)) {
      cur.locked = true; b.classList.add("right"); msg(c.win, "ok");
      setTimeout(win, 900);
    } else {
      cur.mistakes++; b.classList.remove("wrong"); void b.offsetWidth; b.classList.add("wrong");
      var key = ["ring", "petals", "center", "notch"].filter(function (k) { return k === "notch" ? !!o[k] !== !!c.answer[k] : o[k] !== c.answer[k]; })[0] || "ring";
      msg(c.hints[key], "bad");
    }
  }

  // ================= 比口才 =================
  function openDuel() {
    var c = cur.cfg; cur.round = 0;
    frame(c.title, c.who, '<div class="du-top"><div class="du-side"><canvas width="96" height="96" class="du-pf"></canvas><b>' + c.who + '</b></div>' +
      '<div class="du-gauge"><span>' + c.foe + ' 气势</span><div class="du-dots"></div></div>' +
      '<div class="du-side"><canvas width="96" height="96" class="du-pq"></canvas><b>' + c.foe + '</b></div></div>' +
      '<div class="du-label"></div><div class="du-line"></div><div class="du-opts"></div>');
    window.Sprites.drawPortrait(root.querySelector(".du-pf"), "char_feifei", c.who, "#2f3a40");
    window.Sprites.drawPortrait(root.querySelector(".du-pq"), null, "钱", "#2f4f7a");
    duelRound();
  }
  function duelRound() {
    var c = cur.cfg, R = c.rounds[cur.round];
    root.querySelector(".du-dots").innerHTML = c.rounds.map(function (_, i) { return '<i class="' + (i < c.rounds.length - cur.round ? "on" : "") + '"></i>'; }).join("");
    root.querySelector(".du-label").textContent = R.label;
    root.querySelector(".du-line").textContent = c.foe + "：" + R.line;
    var box = root.querySelector(".du-opts");
    box.innerHTML = R.options.map(function (o, i) { return '<button data-i="' + i + '"><b>' + (i + 1) + "</b>" + o.text + "</button>"; }).join("");
    box.querySelectorAll("button").forEach(function (b, i) { b.addEventListener("click", function () { duelPick(i); }); });
    cur.locked = false;
  }
  function duelPick(i) {
    if (!cur || cur.locked) return;
    var c = cur.cfg, R = c.rounds[cur.round], o = R.options[i];
    cur.locked = true;
    root.querySelectorAll(".du-opts button").forEach(function (b, j) { b.disabled = true; if (j === i) b.classList.add(o.ok ? "right" : "wrong"); });
    msg(c.foe + "：" + o.reply, o.ok ? "ok" : "bad");
    if (o.ok) {
      cur.round++;
      if (cur.round >= c.rounds.length) { root.querySelector(".du-dots").innerHTML = c.rounds.map(function () { return "<i></i>"; }).join(""); setTimeout(function () { msg(c.win, "ok"); setTimeout(win, 900); }, 700); }
      else setTimeout(function () { if (cur) { msg(""); duelRound(); } }, 1100);
    } else { cur.mistakes++; setTimeout(function () { if (cur) duelRound(); }, 1200); }
  }

  // ================= 颠勺 =================
  function openWok() {
    var c = cur.cfg;
    frame(c.title, c.who, '<p class="mg-tip">' + c.tip + '</p><canvas class="wk-cv" width="760" height="330"></canvas>' +
      '<div class="wk-stat"></div><div class="wk-btns"><button class="wk-go">颠！</button></div><div class="wk-fail hidden"><button data-wk="retry">再来一锅</button></div>');
    root.querySelector(".wk-go").addEventListener("click", wokPress);
    root.querySelector("[data-wk=retry]").addEventListener("click", wokReset);
    wokReset();
    var last = 0;
    var loop = function (ts) {
      if (!cur || cur.name !== "wok") return;
      var dt = Math.min(0.05, last ? (ts - last) / 1000 : 0); last = ts;
      wokUpdate(dt); wokDraw();
      raf = requestAnimationFrame(loop);
    };
    raf = requestAnimationFrame(loop);
  }
  function wokReset() {
    var c = cur.cfg;
    cur.w = { p: 0, dir: 1, speed: c.speed, zone: c.zone, zs: 0.38, hits: 0, misses: 0, toss: 0, over: false, bits: [] };
    root.querySelector(".wk-fail").classList.add("hidden"); root.querySelector(".wk-go").disabled = false; msg("");
    wokStat();
  }
  function wokStat() { var w = cur.w, c = cur.cfg; root.querySelector(".wk-stat").textContent = "颠成 " + w.hits + "/" + c.need + "　·　失手 " + w.misses + "/" + c.maxMiss; }
  function wokUpdate(dt) {
    var w = cur.w; if (w.over) return;
    w.p += w.dir * w.speed * dt;
    if (w.p > 1) { w.p = 2 - w.p; w.dir = -1; } if (w.p < 0) { w.p = -w.p; w.dir = 1; }
    w.toss = Math.max(0, w.toss - dt);
    w.bits.forEach(function (b) { b.t += dt; });
    w.bits = w.bits.filter(function (b) { return b.t < 0.9; });
  }
  function wokPress() {
    if (!cur || cur.name !== "wok" || cur.w.over) return;
    var w = cur.w, c = cur.cfg;
    if (w.p >= w.zs && w.p <= w.zs + w.zone) {
      w.hits++; w.toss = 0.6;
      for (var i = 0; i < 12; i++) w.bits.push({ a: Math.random() * Math.PI - Math.PI, v: 180 + Math.random() * 160, t: 0, c: Math.random() < 0.5 ? "#c0281c" : "#e8a33c" });
      msg(c.hit[(w.hits - 1) % c.hit.length], "ok");
      w.speed += c.speedUp; w.zone = Math.max(c.zoneMin, w.zone - c.zoneShrink); w.zs = 0.1 + Math.random() * (0.8 - w.zone);
      if (w.hits >= c.need) { w.over = true; root.querySelector(".wk-go").disabled = true; wokStat(); setTimeout(function () { msg(c.win, "ok"); setTimeout(win, 1000); }, 400); return; }
    } else {
      w.misses++; cur.mistakes++; msg(c.miss, "bad");
      if (w.misses >= c.maxMiss) { w.over = true; root.querySelector(".wk-go").disabled = true; root.querySelector(".wk-fail").classList.remove("hidden"); msg(c.fail, "bad"); }
    }
    wokStat();
  }
  function wokDraw() {
    var cv = root.querySelector(".wk-cv"); if (!cv) return;
    var ctx = cv.getContext("2d"), w = cur.w, W = cv.width;
    ctx.clearRect(0, 0, W, cv.height);
    // 灶火
    var fl = 0.6 + Math.random() * 0.4;
    ctx.fillStyle = "rgba(232,120,40," + (0.35 * fl) + ")"; ctx.beginPath(); ctx.ellipse(W / 2, 220, 170, 40, 0, 0, Math.PI * 2); ctx.fill();
    // 锅（颠起时上抬倾斜）
    var lift = Math.sin(Math.min(1, w.toss / 0.6) * Math.PI) * 26;
    ctx.save(); ctx.translate(W / 2, 190 - lift); ctx.rotate(-lift / 300);
    ctx.fillStyle = "#2b2622"; ctx.beginPath(); ctx.ellipse(0, 0, 150, 46, 0, 0, Math.PI); ctx.fill();
    ctx.fillStyle = "#3d3630"; ctx.beginPath(); ctx.ellipse(0, 0, 150, 26, 0, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = "#a3221a"; ctx.beginPath(); ctx.ellipse(0, 4, 118, 16, 0, 0, Math.PI * 2); ctx.fill();
    ctx.strokeStyle = "#2b2622"; ctx.lineWidth = 12; ctx.beginPath(); ctx.moveTo(150, -6); ctx.lineTo(250, -30); ctx.stroke();
    ctx.restore();
    w.bits.forEach(function (b) {
      var x = W / 2 + Math.cos(b.a) * b.v * b.t * 0.8, y = 180 - lift + Math.sin(b.a) * b.v * b.t + 380 * b.t * b.t;
      ctx.fillStyle = b.c; ctx.beginPath(); ctx.ellipse(x, y, 8, 4, b.a, 0, Math.PI * 2); ctx.fill();
    });
    // 刻度条
    var bx = 80, bw = W - 160, by = 280;
    ctx.fillStyle = "#3d3630"; ctx.fillRect(bx, by, bw, 24);
    ctx.fillStyle = "#e0bd6e"; ctx.fillRect(bx + bw * w.zs, by, bw * w.zone, 24);
    ctx.strokeStyle = "#2b2622"; ctx.lineWidth = 3; ctx.strokeRect(bx, by, bw, 24);
    var px = bx + bw * w.p;
    ctx.fillStyle = "#b0281c"; ctx.beginPath(); ctx.moveTo(px, by - 2); ctx.lineTo(px - 12, by - 22); ctx.lineTo(px + 12, by - 22); ctx.closePath(); ctx.fill();
    ctx.fillRect(px - 2, by, 4, 24);
  }

  // ================= 合成秘方 =================
  function paper(it, flip) {
    var r = window.Sprites.get(it);
    if (r) return '<img src="' + r.meta.src + '"' + (flip ? ' class="flip"' : "") + ' alt="">';
    return '<div class="cb-ph">' + (flip ? "下半张" : "上半张") + "</div>";
  }
  function openCombine() {
    var c = cur.cfg;
    frame(c.title, null, '<div class="cb-stage"><div class="cb-half l">' + paper("icon_recipe_half") + "<span>" + c.left + "</span></div>" +
      '<div class="cb-half r">' + paper("icon_recipe_half", true) + "<span>" + c.right + "</span></div>" +
      '<div class="cb-full hidden">' + paper("icon_recipe_full") + '<div class="cb-text"><h2>' + c.fullTitle + "</h2>" + c.lines.map(function (l) { return "<p>" + l + "</p>"; }).join("") + "</div></div></div>" +
      '<div class="cb-btns"><button class="cb-go">' + c.btn + '</button><button class="cb-done hidden">' + c.done + "</button></div>");
    root.querySelector(".mg-quit").style.display = "none";      // 合成不能跳过
    root.querySelector(".cb-go").addEventListener("click", function () {
      if (cur.joined) return; cur.joined = true;
      root.querySelector(".cb-stage").classList.add("joined");
      this.classList.add("hidden");
      setTimeout(function () {
        if (!cur) return;
        root.querySelector(".cb-full").classList.remove("hidden"); root.querySelectorAll(".cb-half").forEach(function (h) { h.classList.add("hidden"); });
        root.querySelector(".cb-done").classList.remove("hidden");
      }, 900);
    });
    root.querySelector(".cb-done").addEventListener("click", win);
  }

  window.MiniGames = { open: open, isOpen: function () { return !!cur; }, drawEmblem: drawEmblem,
    state: function () {
      if (!cur) return null;
      var o = { name: cur.name, mistakes: cur.mistakes };
      if (cur.name === "emblem") { o.options = cur.opts; o.answer = cur.cfg.answer; o.answerIndex = cur.opts.map(function (x) { return same(x, cur.cfg.answer); }).indexOf(true); }
      if (cur.name === "duel") { o.round = cur.round; o.locked = !!cur.locked; o.correct = cur.round < cur.cfg.rounds.length ? cur.cfg.rounds[cur.round].options.map(function (x) { return x.ok; }).indexOf(true) : -1; }
      if (cur.name === "wok") o.wok = { p: cur.w.p, zs: cur.w.zs, zone: cur.w.zone, hits: cur.w.hits, misses: cur.w.misses, over: cur.w.over };
      if (cur.name === "combine") o.joined = !!cur.joined;
      return o;
    } };
})();
