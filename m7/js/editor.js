// 校准编辑器：按 E 开关。拖动/方向键移原点，+/- 调格子，点格子切换可走/障碍，导出 map.js。
(function () {
  var M = window.MAP;          // M4：多场景，每次操作前同步到当前场景地图
  function sync() { M = window.MAP; }
  var active = false, drag = null, placing = false;
  var panel;

  function init() {
    panel = document.getElementById("editor");
    panel.addEventListener("pointerdown", function (e) { e.stopPropagation(); });
    panel.addEventListener("click", function (e) {
      var b = e.target.closest("button"); if (!b) return;
      cmd(b.getAttribute("data-ed"));
    });
    refresh();
  }
  function setActive(v) {
    sync();
    active = v; placing = false;
    panel.classList.toggle("hidden", !v);
    refresh();
  }
  function ensureWalkSize() {
    var w = [];
    for (var y = 0; y < M.rows; y++) {
      var row = (M.walk[y] || "");
      while (row.length < M.cols) row += ".";
      w.push(row.slice(0, M.cols));
    }
    M.walk = w;
  }
  function round1(v) { return Math.round(v * 10) / 10; }
  function cmd(c) {
    sync();
    switch (c) {
      case "tw-": M.tileW = round1(M.tileW - 1); break;
      case "tw+": M.tileW = round1(M.tileW + 1); break;
      case "th-": M.tileH = round1(M.tileH - 1); break;
      case "th+": M.tileH = round1(M.tileH + 1); break;
      case "both-": M.tileW = round1(M.tileW - 2); M.tileH = round1(M.tileH - 1); break;
      case "both+": M.tileW = round1(M.tileW + 2); M.tileH = round1(M.tileH + 1); break;
      case "cols-": M.cols = Math.max(2, M.cols - 1); ensureWalkSize(); break;
      case "cols+": M.cols = Math.min(40, M.cols + 1); ensureWalkSize(); break;
      case "rows-": M.rows = Math.max(2, M.rows - 1); ensureWalkSize(); break;
      case "rows+": M.rows = Math.min(40, M.rows + 1); ensureWalkSize(); break;
      case "cs-": window.CHARACTERS.spriteScale = Math.max(0.05, Math.round((window.CHARACTERS.spriteScale - 0.005) * 1000) / 1000); break;
      case "cs+": window.CHARACTERS.spriteScale = Math.round((window.CHARACTERS.spriteScale + 0.005) * 1000) / 1000; break;
      case "placeTable": placing = !placing; break;
      case "export": exportMap(); break;
    }
    window.Game.rebuild();
    refresh();
  }
  function refresh() {
    sync();
    if (!panel) return;
    document.getElementById("ed-origin").textContent = round1(M.originX) + ", " + round1(M.originY);
    document.getElementById("ed-tw").textContent = M.tileW;
    document.getElementById("ed-th").textContent = M.tileH;
    document.getElementById("ed-cols").textContent = M.cols;
    document.getElementById("ed-rows").textContent = M.rows;
    document.getElementById("ed-cs").textContent = window.CHARACTERS.spriteScale;
    document.getElementById("ed-place").classList.toggle("on", placing);
  }
  function fileName() { return M.id === "market" ? "map_market.js" : (M.id === "river" ? "map_river.js" : (M.id === "village" ? "map_village.js" : "map.js")); }
  function exportText() {
    sync();
    var head = M.id === "market" ? "window.MAP_MARKET = " : (M.id === "river" ? "window.MAP_RIVER = " : (M.id === "village" ? "window.MAP_VILLAGE = " : "window.MAP = window.MAP_SHOP = "));
    return "// 《椒麻江湖》地图配置（场景：" + (M.name || M.id) + "），由游戏内校准编辑器导出（" + new Date().toLocaleString() + "）。\n" +
      "// 替换 game-m4/" + fileName() + " 后刷新即生效。walk[y] 第 y 行：'.' 可走，'#' 障碍。\n" +
      head + JSON.stringify(M, null, 2) + ";\n";
  }
  function exportMap() {
    var blob = new Blob([exportText()], { type: "text/javascript" });
    var a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = fileName();
    document.body.appendChild(a); a.click();
    setTimeout(function () { URL.revokeObjectURL(a.href); a.remove(); }, 1000);
    window.Game.toast("已导出 " + fileName() + "，替换 game-m4/" + fileName() + " 即生效");
  }
  function toggleCell(x, y) {
    sync();
    if (x < 0 || y < 0 || x >= M.cols || y >= M.rows) return;
    var row = M.walk[y];
    M.walk[y] = row.slice(0, x) + (row[x] === "#" ? "." : "#") + row.slice(x + 1);
    window.Game.rebuild();
  }
  function placeTable(x, y) {
    sync();
    var p = M.props[0]; if (!p) return;
    var nx = x - Math.floor(p.w / 2), ny = y - Math.floor(p.h / 2);
    var dx = nx - p.x, dy = ny - p.y;
    p.x = nx; p.y = ny;
    M.interactables.forEach(function (it) {
      if (it.id === p.id) it.cells = it.cells.map(function (c) { return [c[0] + dx, c[1] + dy]; });
    });
    placing = false;
    window.Game.rebuild();
    refresh();
  }
  function pointerDown(pt) { sync(); drag = { sx: pt.x, sy: pt.y, ox: M.originX, oy: M.originY, moved: false }; }
  function pointerMove(pt) {
    if (!drag) return;
    var dx = pt.x - drag.sx, dy = pt.y - drag.sy;
    if (!drag.moved && Math.hypot(dx, dy) < 6) return;
    drag.moved = true;
    M.originX = round1(drag.ox + dx); M.originY = round1(drag.oy + dy);
    refresh();
  }
  function pointerUp(pt) {
    if (!drag) return;
    var d = drag; drag = null;
    if (d.moved) { window.Game.rebuild(); return; }
    var c = window.Iso.screenToCell(pt.x, pt.y);
    if (placing) placeTable(c.x, c.y); else toggleCell(c.x, c.y);
  }
  function key(e) {
    sync();
    var step = e.shiftKey ? 10 : 1, k = e.key;
    if (k === "ArrowLeft") M.originX -= step;
    else if (k === "ArrowRight") M.originX += step;
    else if (k === "ArrowUp") M.originY -= step;
    else if (k === "ArrowDown") M.originY += step;
    else if (k === "+" || k === "=") { cmd("both+"); return true; }
    else if (k === "-" || k === "_") { cmd("both-"); return true; }
    else if (k === "]") { cmd("tw+"); return true; }
    else if (k === "[") { cmd("tw-"); return true; }
    else if (k === "'") { cmd("th+"); return true; }
    else if (k === ";") { cmd("th-"); return true; }
    else return false;
    window.Game.rebuild(); refresh();
    return true;
  }
  window.Editor = {
    init: init, setActive: setActive, isActive: function () { return active; },
    pointerDown: pointerDown, pointerMove: pointerMove, pointerUp: pointerUp, key: key,
    exportText: exportText, exportMap: exportMap, cmd: cmd, refresh: refresh
  };
})();
