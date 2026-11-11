// M9 骨骼行走：运行时把整张立绘切成 头 / 躯干 / 左右臂 / 左右腿，按 2D 骨骼旋转（不改原图）。
// 数据：data/rig_data.js（auto = prep_assets 量出的切线；art = 美术 rig.json，见 SPEC.md），characters.js 每角色 rig 配置微调。
// 关闭：?rig=0 或 菜单「骨骼动画」开关（localStorage jiaoma_rig=0）。角色 rig:false → 整图 + 上下颠。
(function () {
  var RD = window.RIG_DATA || { auto: {}, art: {} }, C = window.CHARACTERS || { list: {} };
  var cache = {}, OV = 3;
  function lsGet(k) { try { return localStorage.getItem(k); } catch (e) { return null; } }
  function lsSet(k, v) { try { localStorage.setItem(k, v); } catch (e) {} }
  // 模式：默认只有白名单 RIG_CHARS（小满）走骨骼，其余角色保持 M8 整图；?rig=all 全员运行时切图；?rig=0 全关。
  // 探索面板开关 / localStorage jiaoma_rig 只控制白名单角色（?rig=all 时控制全员）。
  var allMode = /[?&]rig=all/.test(location.search);
  var WL = window.RIG_CHARS || ((window.RIG_ANIM || {}).RIG_CHARS) || ["xiaoman"];
  var enabled = !/[?&]rig=0/.test(location.search) && lsGet("jiaoma_rig") !== "0";
  function allowed(id) { return allMode || WL.indexOf(id) >= 0; }
  function cfgOf(def) { return def && def.rig === false ? false : ((def && def.rig) || {}); }
  function headTurnOf(cfg, view) { var v = (cfg[view] || {}).headTurn; return v != null ? v : (cfg.headTurn != null ? cfg.headTurn : 1); }
  function charIdOf(spriteName) { return spriteName.replace(/^(char|npc)_/, "").replace(/_back$/, ""); }

  function cut(img, x, y, w, h, clip) {
    var cv = document.createElement("canvas"); x = Math.max(0, Math.floor(x)); y = Math.max(0, Math.floor(y));
    w = Math.max(1, Math.min(img.width - x, Math.ceil(w))); h = Math.max(1, Math.min(img.height - y, Math.ceil(h)));
    cv.width = w; cv.height = h;
    var c = cv.getContext("2d"); c.drawImage(img, x, y, w, h, 0, 0, w, h);
    return { cv: cv, ox: x, oy: y };
  }
  // 运行时切分（立绘像素坐标）
  function buildAuto(name, r, view, cfg) {
    var a = RD.auto[name]; if (!a) return null;
    var img = r.img, w = img.width, h = img.height, body = h - a.top, vc = (cfg[view] || {});
    var neck = a.top + body * (cfg.neck || 0) || a.neck; if (!cfg.neck) neck = a.neck;
    var hip = cfg.hip ? a.top + body * cfg.hip : a.hip, shoulder = Math.max(a.shoulder, neck + body * .02);
    var armL = a.armL, armR = a.armR, split = a.split;
    var armEnd = Math.min(a.armEnd, hip + body * .07);
    var P = {};
    P.legL = cut(img, 0, hip - OV, split + OV, h - hip + OV); P.legL.px = (armL + split) / 2; P.legL.py = hip;
    P.legR = cut(img, split - OV, hip - OV, w - split + OV, h - hip + OV); P.legR.px = (split + armR) / 2; P.legR.py = hip;
    P.torso = cut(img, 0, neck - OV, w, hip - neck + OV * 2); P.torso.px = r.meta.ax; P.torso.py = hip;
    P.armL = cut(img, 0, shoulder - OV, armL + OV, armEnd - shoulder + OV); P.armL.px = armL; P.armL.py = shoulder + body * .025;
    P.armR = cut(img, armR - OV, shoulder - OV, w - armR + OV, armEnd - shoulder + OV); P.armR.px = armR; P.armR.py = shoulder + body * .025;
    P.head = cut(img, 0, 0, w, neck + OV); P.head.px = r.meta.ax; P.head.py = neck;
    return { parts: P, legLen: h - hip, swingL: vc.armSwingL != null ? vc.armSwingL : (cfg.armSwingL != null ? cfg.armSwingL : 1),
      swingR: vc.armSwingR != null ? vc.armSwingR : (cfg.armSwingR != null ? cfg.armSwingR : 1),
      headTurn: headTurnOf(cfg, view), legScale: cfg.legScale || 1, src: "auto" };
  }
  // 美术交付的部件（rig.json 坐标是原画布坐标 → prep 后立绘坐标：(p - trim) * prepScale；部件 PNG 已由 prep 预缩放 scaled 倍）
  var MAP = { head: "head", torso: "torso", arm_l: "armL", arm_r: "armR", leg_l: "legL", leg_r: "legR" };
  function buildArt(name, r, view, cfg) {
    var A = RD.art[charIdOf(name)]; if (!A || !A.views || !A.views[view]) return null;
    var tr = r.meta.trim || [0, 0], sc = r.meta.prepScale || 1, P = {}, hipY = 0, order = [];
    A.views[view].parts.forEach(function (pt, i) {
      var key = MAP[pt.name]; if (!key) return;
      var im = new Image(); im.src = pt.src;
      var o = { img: im, ox: ((pt.x || 0) - tr[0]) * sc, oy: ((pt.y || 0) - tr[1]) * sc, px: (pt.pivot[0] - tr[0]) * sc, py: (pt.pivot[1] - tr[1]) * sc,
        dw: (pt.w || 0) * sc, dh: (pt.h || 0) * sc, sc: sc / (pt.scaled || 1), z: pt.z != null ? pt.z : i, parent: pt.parent || (key === "legL" || key === "legR" || key === "torso" ? "hip" : "torso"), key: key };
      P[key] = o; order.push(o); if (key === "legL" || key === "legR") hipY = Math.max(hipY, o.py);
    });
    if (!P.torso || !P.head) return null;
    order.sort(function (x, y) { return x.z - y.z; });
    return { parts: P, order: order, legLen: r.meta.h - hipY, swingL: 1, swingR: 1, headTurn: headTurnOf(cfg, view),
      legScale: cfg.legScale || 1, prep: sc, src: "art", from: A.from || "art/ch7" };
  }
  var AUTO_ORDER = ["legL", "legR", "torso", "armL", "armR", "head"];
  function finishAuto(rig, r) {
    rig.prep = r.meta.prepScale || 1;
    rig.order = AUTO_ORDER.map(function (k) { var p = rig.parts[k]; p.key = k; p.parent = (k === "legL" || k === "legR" || k === "torso") ? "hip" : "torso"; return p; });
    return rig;
  }
  function get(name, def, back) {
    var S = window.Sprites, r = S && S.get(name); if (!r) return null;
    if (!allowed(charIdOf(name))) return null;      // 白名单外：整图（不进 cache，不算回退）
    var cfg = cfgOf(def); if (cfg === false) return null;
    if (cfg[back ? "back" : "front"] === false) return null;   // M10：某个视角单独回退整图（如飞飞背面长袍一切就分叉）
    var k = name; if (cache[k] !== undefined) return cache[k];
    var view = back ? "back" : "front", rig = null;
    try { rig = buildArt(name, r, view, cfg); if (!rig) { rig = buildAuto(name, r, view, cfg); if (rig) finishAuto(rig, r); } } catch (e) { rig = null; }
    if (rig) { rig.anim = animOf(charIdOf(name)); rig.view = view; rig.id = charIdOf(name); }
    cache[k] = rig; return rig;
  }
  var AN = window.RIG_ANIM || {};
  function animOf(id) {
    var d = {}, a = AN["default"] || {}, o = AN[id] || {}, kk;
    for (kk in a) d[kk] = a[kk]; for (kk in o) d[kk] = o[kk];
    d.cycleMs = d.cycleMs || 600; return d;
  }
  var D2R = Math.PI / 180;
  function drawPart(ctx, p, ang) {
    if (!p) return;
    var src = p.cv || p.img; if (!src || (p.img && !(p.img.complete && p.img.naturalWidth))) return;
    ctx.save(); ctx.translate(p.px, p.py); if (ang) ctx.rotate(ang);
    if (p.cv) ctx.drawImage(src, p.ox - p.px, p.oy - p.py);
    else ctx.drawImage(src, p.ox - p.px, p.oy - p.py, src.naturalWidth * p.sc, src.naturalHeight * p.sc);
    ctx.restore();
  }
  // 一个 walk 循环对应的走动距离（格）：基础速度 × cycleMs → 相位按位移推进，不滑步
  function phaseRate(rig, speedCells, baseSpeed) {
    if (typeof rig === "string") rig = { anim: animOf(rig) };      // M10：按角色 id 取步频（飞飞 520ms / 胖弟 680ms；小满 = default 600ms）
    var cyc = ((rig && rig.anim && rig.anim.cycleMs) || ((AN["default"] || {}).cycleMs) || 600) / 1000;
    return 2 * Math.PI * speedCells / (baseSpeed * cyc);
  }
  // pose：{ walk, phase, t(秒), seed, npc, stride(半步位移，立绘像素) }
  function poseOf(rig, o) {
    var an = rig.anim || animOf(""), P = { legL: 0, legR: 0, armL: 0, armR: 0, torso: 0, head: 0, bob: 0, breath: 0, view: rig.view || "front" };
    var arms = (rig.view === "back" && an.backArms) || an.arms || {}, aL = (arms.armL != null ? arms.armL : an.armDeg * rig.swingL) * D2R, aR = (arms.armR != null ? arms.armR : an.armDeg * rig.swingR) * D2R;
    if (o.walk) {
      var A = an.legDeg * D2R;
      if (o.stride && rig.legLen) A = Math.asin(Math.min(.5, o.stride / (2 * rig.legLen)));   // 步幅推出的角度，夹在 legDeg..legMaxDeg
      A = Math.max(an.legDeg * D2R, Math.min(an.legMaxDeg * D2R, A)) * rig.legScale;
      var s = Math.sin(o.phase);
      P.legL = A * s; P.legR = -A * s;
      P.armL = -aL * s; P.armR = aR * s;                                   // 手臂与同侧腿反向
      P.torso = an.torsoDeg * D2R * Math.sin(o.phase * 2);
      P.head = -an.headDeg * D2R * Math.sin(o.phase - .9) * rig.headTurn;  // 头稍滞后
      P.bob = an.bobPx * rig.prep * Math.abs(s);                           // 双腿分开时最低
    } else {
      var w = 2 * Math.PI / (an.breathMs / 1000), b = Math.sin(o.t * w + o.seed);
      P.breath = -an.breathPx * rig.prep * (b * .5 + .5);
      var ia = an.idleArmDeg * D2R * Math.sin(o.t * w + o.seed + 1);
      P.armL = ia * (aL ? aL / Math.max(aL, aR) : 0); P.armR = -ia * (aR ? aR / Math.max(aL, aR) : 0);
      P.head = (o.npc ? an.npcHeadDeg * Math.sin(o.t * .7 + o.seed * 3) : an.idleHeadDeg * b) * D2R * rig.headTurn;
    }
    return P;
  }
  // 在「立绘像素坐标」里画（调用方已 translate 到脚底并按 k 缩放、-ax/-h 平移、按需水平翻转）
  // 层级：hip 为根（整体起伏 bob）→ 躯干（摆动+呼吸）→ 头/手臂；hip → 腿。按 z 从小到大画。
  function draw(ctx, rig, P) {
    var T = rig.parts.torso;
    ctx.save(); if (P.bob) ctx.translate(0, P.bob);
    rig.order.forEach(function (p) {
      if (p.parent === "torso" || p.key === "torso") {
        ctx.save(); ctx.translate(T.px, T.py + (P.breath || 0)); if (P.torso) ctx.rotate(P.torso); ctx.translate(-T.px, -T.py);
        drawPart(ctx, p, p.key === "torso" ? 0 : P[p.key]); ctx.restore();
      } else drawPart(ctx, p, P[p.key]);
    });
    ctx.restore();
  }
  var last = null, lastBy = {};
  window.Rig = {
    get: get, poseOf: poseOf, phaseRate: phaseRate, anim: animOf, draw: function (ctx, rig, P, id) { draw(ctx, rig, P); if (id) lastBy[id] = P; },
    enabled: function () { return enabled; },
    mode: function () { return !enabled ? "off" : allMode ? "all" : "chars"; },
    whitelist: function () { return WL.slice(); },
    allowed: allowed,
    setEnabled: function (v) { enabled = !!v; lsSet("jiaoma_rig", v ? "1" : "0"); },
    state: function () {
      var built = {}; Object.keys(cache).forEach(function (k) { built[k] = cache[k] ? Object.keys(cache[k].parts).length + ":" + cache[k].src + (cache[k].src === "art" ? "(" + cache[k].from + ")" : "") : "fallback"; });
      return { enabled: enabled, mode: !enabled ? "off" : allMode ? "all" : "chars", whitelist: WL.slice(), built: built, pose: JSON.parse(JSON.stringify(lastBy)) };
    },
    fallbackList: function () { return Object.keys(C.list).filter(function (k) { return C.list[k].rig === false; }); }   // ?rig=all 时整图回退的角色
  };
})();
