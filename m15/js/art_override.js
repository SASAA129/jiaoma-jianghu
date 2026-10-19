// M15：按 data/art_override.js 把底图 / 锅换成新画风（use = "flat" 时）。须在 assets.js 之后、js/sprites.js 之前加载。
(function () {
  var T = window.ART_OVERRIDE || {}, A = window.ASSETS || {};
  window.ART_ACTIVE = {};
  Object.keys(T).forEach(function (k) {
    var o = T[k], a = A[k]; if (!a) return;
    var flat = o.use === "flat";
    a.src = flat ? o.flat : o.old;
    if (flat && o.meta) Object.keys(o.meta).forEach(function (m) { a[m] = o.meta[m]; });
    window.ART_ACTIVE[k] = flat ? "flat" : "old";
  });
})();
