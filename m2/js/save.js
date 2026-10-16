// M2 存档：所有剧情 flag + 路线/进度/结局摘要存进 localStorage。file:// 和 http 都可用；不可用时静默降级为内存。
(function () {
  var KEY = "jiaoma_jianghu_m2";
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
    return { route: route, progress: progress, endings: endings };
  }
  function persist(flags) {
    var f = {};
    Object.keys(flags).forEach(function (k) { if (flags[k]) f[k] = true; });
    var sm = summarize(f);
    var data = JSON.stringify({ v: 1, savedAt: new Date().toISOString(), route: sm.route, progress: sm.progress, endings: sm.endings, flags: f });
    var s = ls();
    try { if (s) s.setItem(KEY, data); else mem = data; } catch (e) { mem = data; }
  }
  function reset() { var s = ls(); try { if (s) s.removeItem(KEY); } catch (e) {} mem = null; }
  window.Save = { KEY: KEY, load: load, persist: persist, reset: reset, summarize: summarize };
})();
