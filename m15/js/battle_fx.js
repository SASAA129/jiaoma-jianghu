// M15 战斗打击感（纯代码，不用图）：受击闪白 / 伤害飘字 / 震屏 / 出招残影 / 暴击顿帧。
// 独立模块，js/battle.js 只调用这里的接口；后面战斗界面换皮（武侠夜色）时直接接这一层。
//   BattleFX.roll(a, t)          → { crit, miss }（独立随机源，不动 battle.js 的 rand，旧自测的 setRandom 不受影响）
//   BattleFX.onHit(t, kind)      → 闪白 + 震屏 (+ 暴击顿帧)；kind = "normal" | "crit"
//   BattleFX.float(list, f)      → 按 kind 套飘字样式（normal / crit / heal / miss / text）
//   BattleFX.step(dt)            → 顿帧期间返回 0（画面定格），否则返回 dt
//   BattleFX.shakeOffset(dt)     → 当前震屏偏移（世界 px，随时间衰减）
//   BattleFX.ghostStart(u) / ghostTrack(u, x, y) / drawGhosts(ctx, u, drawBody)
//   BattleFX.drawFlash(ctx, u, img, dx, dy, dw, dh, flip, rect)
//   BattleFX.drawFloat(ctx, f, k)
//   测试：BattleFX.force({ crit: true }) / force({ miss: true }) / force(null)；BattleFX.stats()；BattleFX.reset()
(function () {
  var CFG = {
    crit: 0.12, critMul: 1.5,        // 暴击率 / 倍率
    miss: 0.06,                       // 敌方出手被闪避的概率（我方出手不 miss，免得拖节奏）
    flash: 0.1,                       // 受击闪白时长（秒）：80–120ms
    hitStop: 0.08,                    // 暴击顿帧（秒）：60–100ms
    shakeNormal: 7, shakeCrit: 18,    // 震屏幅度（世界 px）
    shakeDecay: 6.5,                  // 衰减速度（越大越快）
    ghosts: 4, ghostGap: 0.035, ghostLife: 0.22,   // 残影：最多 4 个，每 35ms 记一个，每个 220ms 淡出
    reducedShake: 0.25                // prefers-reduced-motion：震屏只留 25%，残影减到 2 个
  };
  var mq = window.matchMedia ? window.matchMedia("(prefers-reduced-motion: reduce)") : null;
  function reduced() { return !!(mq && mq.matches) || !!window.__fxReduced; }
  var forced = null, rnd = Math.random;
  var S = { flash: 0, shake: 0, shakeCrit: 0, hitStop: 0, ghost: 0, floats: { normal: 0, crit: 0, heal: 0, miss: 0, text: 0 }, lastShake: 0, maxShakePx: 0 };
  var trauma = 0, stopLeft = 0, ph = 1;

  function roll(a, t) {
    var f = forced || {};
    var miss = f.miss != null ? !!f.miss : (a && a.side === "enemy" && rnd() < CFG.miss);
    var crit = !miss && (f.crit != null ? !!f.crit : rnd() < CFG.crit);
    return { crit: crit, miss: miss };
  }
  function onHit(t, kind) {
    t.fxFlashUntil = now() + CFG.flash * 1000; S.flash++;           // 按真实时间算（掉帧也是 ~100ms）
    var amp = kind === "crit" ? CFG.shakeCrit : CFG.shakeNormal;
    shake(amp);
    if (kind === "crit") { S.shakeCrit++; stopLeft = Math.max(stopLeft, CFG.hitStop); S.hitStop++; }
  }
  function shake(amp) { trauma = Math.max(trauma, amp * (reduced() ? CFG.reducedShake : 1)); S.shake++; S.lastShake = trauma; }
  function step(dt) {
    if (stopLeft > 0) { stopLeft -= dt; return 0; }
    return dt;
  }
  function shakeOffset(dt) {
    if (trauma <= 0.05) { trauma = 0; return { x: 0, y: 0 }; }
    ph = -ph || 1;                                   // 每帧左右换向，幅度 = 当前强度（掉帧时峰值也稳定）
    var o = { x: ph * trauma * (0.75 + 0.25 * Math.random()), y: (Math.random() - 0.5) * trauma * 0.9 };
    S.maxShakePx = Math.max(S.maxShakePx, Math.abs(o.x), Math.abs(o.y));
    trauma *= Math.exp(-CFG.shakeDecay * dt);
    return o;
  }
  // ---- 残影 ----
  function ghostStart(u) { u.fxGhost = { list: [], acc: 0, on: true }; S.ghost++; }
  function ghostTrack(u, x, y, dt, moving) {
    var g = u.fxGhost; if (!g) return;
    var max = reduced() ? 2 : CFG.ghosts;
    g.list.forEach(function (p) { p.t += dt; });
    g.list = g.list.filter(function (p) { return p.t < CFG.ghostLife; });
    if (moving) {
      g.acc += dt;
      if (g.acc >= CFG.ghostGap) { g.acc = 0; g.list.push({ x: x, y: y, t: 0 }); while (g.list.length > max) g.list.shift(); }
    } else if (!g.list.length) u.fxGhost = null;
  }
  function drawGhosts(ctx, u, drawBody) {
    var g = u.fxGhost; if (!g || !g.list.length) return;
    g.list.forEach(function (p, i) {
      var a = (1 - p.t / CFG.ghostLife) * (0.18 + 0.32 * (i + 1) / g.list.length);
      if (a <= 0) return;
      ctx.save(); ctx.globalAlpha = a; ctx.filter = "sepia(1) saturate(3) hue-rotate(-20deg) brightness(1.15)";   // 朱金色调残影
      drawBody(p.x, p.y); ctx.restore();
    });
  }
  function ghostCount(u) { return u.fxGhost ? u.fxGhost.list.length : 0; }
  // ---- 受击闪白：白色剪影缓存（每张图做一次），叠在身体上 ----
  var white = new WeakMap();
  function silhouette(img) {
    var c = white.get(img); if (c) return c;
    c = document.createElement("canvas"); c.width = img.naturalWidth || img.width; c.height = img.naturalHeight || img.height;
    var x = c.getContext("2d"); x.drawImage(img, 0, 0); x.globalCompositeOperation = "source-in"; x.fillStyle = "#fffaf0"; x.fillRect(0, 0, c.width, c.height);
    white.set(img, c); return c;
  }
  function drawFlash(ctx, u, img, dx, dy, dw, dh, rect) {
    var left = (u.fxFlashUntil || 0) - now(); if (left <= 0) return;
    var a = Math.min(1, left / (CFG.flash * 1000)) * 0.55 + 0.4;
    ctx.save(); ctx.globalAlpha = a;
    if (img) ctx.drawImage(silhouette(img), dx, dy, dw, dh);
    else if (rect) { ctx.fillStyle = "#fffaf0"; ctx.fillRect(rect.x, rect.y, rect.w, rect.h); }
    ctx.restore();
  }
  function flashing(u) { return (u.fxFlashUntil || 0) > now(); }
  function now() { return window.performance ? performance.now() : Date.now(); }
  // ---- 飘字（武侠夜色：金 / 朱红，深色描边）----
  // 武侠夜色（art/ui_wuxia/battle/README）：伤害 #FFE3C2/#7A1A10；暴击 ×1.5 +「暴」印 #F0D79A；治疗 #BFF0C0/#1F4F2A；招式名金字横幅
  var STYLE = {
    normal: { fill: "#FFE3C2", stroke: "#7A1A10", size: 44, rise: 70, life: 1.1, strokeW: 6 },
    crit:   { fill: "#F0D79A", stroke: "#7A1A10", size: 66, rise: 90, life: 1.3, strokeW: 7, sub: "暴", subFill: "#D9573C" },
    heal:   { fill: "#BFF0C0", stroke: "#1F4F2A", size: 40, rise: 60, life: 1.2, strokeW: 6 },
    miss:   { fill: "#d9d0bd", stroke: "#1b1a22", size: 34, rise: 50, life: 1.0, italic: true, strokeW: 5 },
    text:   { fill: "#E3C27A", stroke: "#1b1310", size: 30, rise: 60, life: 1.3, strokeW: 5, banner: true }
  };
  function float(list, f) {
    var s = STYLE[f.kind] || STYLE.text;
    f.size = f.size || s.size; f.life = s.life; f.st = s; S.floats[f.kind in S.floats ? f.kind : "text"]++;
    list.push(f); return f;
  }
  function drawFloat(ctx, f, k) {
    var s = f.st || STYLE.text, rise = s.rise * (1 - Math.pow(1 - k, 2));
    var pop = f.kind === "crit" ? (k < 0.12 ? 0.6 + k / 0.12 * 0.75 : (k < 0.25 ? 1.35 - (k - 0.12) / 0.13 * 0.35 : 1)) : (k < 0.1 ? 0.8 + k * 2 : 1);
    var y = f.y - rise;
    ctx.save(); ctx.globalAlpha = 1 - Math.max(0, k - 0.6) / 0.4;
    ctx.translate(f.x, y); ctx.scale(pop, pop);
    ctx.font = (s.italic ? "italic " : "") + "bold " + f.size + "px KaiTi, 'Noto Serif CJK SC', serif"; ctx.textAlign = "center"; ctx.textBaseline = "alphabetic";
    if (s.banner) {   // 招式名：两端渐隐金字横幅（与 .bt-tip 同色）
      var tw0 = ctx.measureText(f.text).width + 48, bh = f.size + 18;
      var g0 = ctx.createLinearGradient(-tw0 / 2, 0, tw0 / 2, 0);
      g0.addColorStop(0, "rgba(24,28,38,0)"); g0.addColorStop(0.2, "rgba(24,28,38,.88)"); g0.addColorStop(0.8, "rgba(24,28,38,.88)"); g0.addColorStop(1, "rgba(24,28,38,0)");
      ctx.fillStyle = g0; ctx.fillRect(-tw0 / 2, -f.size * 0.85, tw0, bh);
      ctx.strokeStyle = "rgba(201,164,92,.55)"; ctx.lineWidth = 1; ctx.beginPath(); ctx.moveTo(-tw0 / 2 + 20, -f.size * 0.85); ctx.lineTo(tw0 / 2 - 20, -f.size * 0.85); ctx.moveTo(-tw0 / 2 + 20, -f.size * 0.85 + bh); ctx.lineTo(tw0 / 2 - 20, -f.size * 0.85 + bh); ctx.stroke();
    }
    ctx.lineJoin = "round"; ctx.lineWidth = s.strokeW || Math.max(5, f.size * 0.16); ctx.strokeStyle = s.stroke; ctx.strokeText(f.text, 0, 0);
    if (f.kind === "crit") { var g = ctx.createLinearGradient(0, -f.size, 0, 0); g.addColorStop(0, "#fff8d8"); g.addColorStop(1, s.fill); ctx.fillStyle = g; } else ctx.fillStyle = s.fill;
    ctx.fillText(f.text, 0, 0);
    if (f.iconImg) { var tw = ctx.measureText(f.text).width; ctx.drawImage(f.iconImg, -tw / 2 - 52, -f.size * 0.95, 46, 46); }
    if (s.sub) {   // 「暴」字小印
      var ss = Math.round(f.size * 0.38), bx = -f.size * 0.85, by = -f.size * 1.05;
      ctx.fillStyle = s.subFill; ctx.beginPath(); ctx.moveTo(bx, by); ctx.lineTo(bx + ss, by); ctx.lineTo(bx + ss, by + ss); ctx.lineTo(bx, by + ss); ctx.closePath(); ctx.fill();
      ctx.strokeStyle = "#f3e7c9"; ctx.lineWidth = 1.5; ctx.stroke();
      ctx.fillStyle = "#f3e7c9"; ctx.font = "bold " + Math.round(ss * 0.72) + "px KaiTi, 'Noto Serif CJK SC', serif"; ctx.fillText(s.sub, bx + ss / 2, by + ss * 0.78);
    }
    ctx.restore();
  }
  window.BattleFX = {
    CFG: CFG, STYLE: STYLE, roll: roll, onHit: onHit, shake: shake, step: step, shakeOffset: shakeOffset,
    ghostStart: ghostStart, ghostTrack: ghostTrack, drawGhosts: drawGhosts, ghostCount: ghostCount,
    drawFlash: drawFlash, flashing: flashing, float: float, drawFloat: drawFloat, reduced: reduced,
    frozen: function () { return stopLeft > 0; },
    force: function (o) { forced = o || null; }, setRandom: function (f) { rnd = f || Math.random; },
    stats: function () { return JSON.parse(JSON.stringify(Object.assign({}, S, { trauma: trauma, frozen: stopLeft > 0, reduced: reduced() }))); },
    reset: function () { S.flash = S.shake = S.shakeCrit = S.hitStop = S.ghost = 0; S.lastShake = S.maxShakePx = 0; Object.keys(S.floats).forEach(function (k) { S.floats[k] = 0; }); trauma = 0; stopLeft = 0; }
  };
})();
