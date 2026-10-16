// 存档：剧情 flag + 场景 / 队长 / 三人位置 + 摘要，存进 localStorage（键 jiaoma_jianghu_m7）。file:// 和 http 都可用；不可用时静默降级为内存。
(function () {
  var KEY = "jiaoma_jianghu_m7";
  var mem = null;
  function ls() { try { return window.localStorage; } catch (e) { return null; } }
  function load() {
    var s = ls();
    try { var raw = s ? s.getItem(KEY) : mem; return raw ? JSON.parse(raw) : null; } catch (e) { return null; }
  }
  function summarize(flags) {
    var route = ["A", "B", "C"].filter(function (r) { return flags["route_" + r]; })[0] || null;
    var progress = {}, endings = [];
    ["A", "B", "C"].forEach(function (r) {
      progress[r] = Object.keys(flags).filter(function (k) { return flags[k] && k.indexOf(r + "_") === 0; }).sort();
      if (flags["end_" + r]) endings.push(r);
    });
    var chapter = flags.c4_finale ? "第四章 · 完" : (flags.c4_arrived ? "第四章" : (flags.c3_finale ? "第三章 · 完" : (flags.c3_arrived ? "第三章" : (flags.c2_finale ? "第二章 · 完" : (flags.ch1_done ? "第二章" : "第一章")))));
    return { route: route, progress: progress, endings: endings, chapter: chapter };
  }
  function persist(flags) {
    if (window.__noSave) return;            // ?scene= / ?chapter= 校准模式不写存档
    var f = {};
    Object.keys(flags).forEach(function (k) { if (flags[k]) f[k] = true; });
    var sm = summarize(f);
    var meta = (window.Game && window.Game.saveMeta && window.Game.saveMeta()) || (load() || {}).meta || null;
    var data = JSON.stringify({ v: 6, savedAt: new Date().toISOString(), chapter: sm.chapter, route: sm.route, progress: sm.progress,
      endings: sm.endings, meta: meta, flags: f });
    var s = ls();
    try { if (s) s.setItem(KEY, data); else mem = data; } catch (e) { mem = data; }
  }
  function reset() { var s = ls(); try { if (s) s.removeItem(KEY); } catch (e) {} mem = null; }
  function exists() { var d = load(); return !!(d && d.flags && Object.keys(d.flags).length); }
  window.Save = { KEY: KEY, load: load, persist: persist, reset: reset, summarize: summarize, exists: exists };
})();
