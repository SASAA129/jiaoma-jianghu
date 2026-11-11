// 等距坐标换算（2:1 菱形网格）。grid 坐标为连续值：格 (x,y) 的中心是 (x+0.5, y+0.5)。
// 世界坐标 = bg_room 原图像素坐标（1536x1024），画布再整体等比缩放。
(function () {
  function gridToScreen(gx, gy, m) {
    m = m || window.MAP;
    return { x: m.originX + (gx - gy) * m.tileW / 2, y: m.originY + (gx + gy) * m.tileH / 2 };
  }
  function screenToGrid(sx, sy, m) {
    m = m || window.MAP;
    var a = (sx - m.originX) / (m.tileW / 2), b = (sy - m.originY) / (m.tileH / 2);
    return { x: (a + b) / 2, y: (b - a) / 2 };
  }
  function screenToCell(sx, sy, m) {
    var g = screenToGrid(sx, sy, m);
    return { x: Math.floor(g.x), y: Math.floor(g.y) };
  }
  function cellCenter(x, y, m) { return gridToScreen(x + 0.5, y + 0.5, m); }
  window.Iso = { gridToScreen: gridToScreen, screenToGrid: screenToGrid, screenToCell: screenToCell, cellCenter: cellCenter };
  window.gridToScreen = gridToScreen;
  window.screenToGrid = screenToGrid;
})();
