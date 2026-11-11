// A* 寻路：8 方向，斜走时两侧直角格都必须可走（不准斜穿障碍拐角）。
(function () {
  var DIRS = [[1,0],[-1,0],[0,1],[0,-1],[1,1],[1,-1],[-1,1],[-1,-1]];
  var SQ2 = Math.SQRT2;
  function canStep(walkable, x, y, dx, dy) {
    if (!walkable(x + dx, y + dy)) return false;
    if (dx && dy) return walkable(x + dx, y) && walkable(x, y + dy);
    return true;
  }
  function octile(ax, ay, bx, by) {
    var dx = Math.abs(ax - bx), dy = Math.abs(ay - by);
    return Math.max(dx, dy) + (SQ2 - 1) * Math.min(dx, dy);
  }
  // 返回从 start 到 goal 的格子数组（不含 start），走不到返回 null
  function astar(walkable, cols, rows, sx, sy, gx, gy) {
    if (sx === gx && sy === gy) return [];
    if (!walkable(gx, gy)) return null;
    var key = function (x, y) { return y * cols + x; };
    var open = [{ x: sx, y: sy, g: 0, f: octile(sx, sy, gx, gy) }];
    var g = {}, came = {}, closed = {};
    g[key(sx, sy)] = 0;
    while (open.length) {
      var bi = 0;
      for (var i = 1; i < open.length; i++) if (open[i].f < open[bi].f) bi = i;
      var cur = open.splice(bi, 1)[0], ck = key(cur.x, cur.y);
      if (closed[ck]) continue;
      closed[ck] = 1;
      if (cur.x === gx && cur.y === gy) {
        var path = [], k = ck;
        while (k !== key(sx, sy)) { path.unshift({ x: k % cols, y: Math.floor(k / cols) }); k = came[k]; }
        return path;
      }
      for (var d = 0; d < 8; d++) {
        var dx = DIRS[d][0], dy = DIRS[d][1], nx = cur.x + dx, ny = cur.y + dy;
        if (nx < 0 || ny < 0 || nx >= cols || ny >= rows) continue;
        if (!canStep(walkable, cur.x, cur.y, dx, dy)) continue;
        var nk = key(nx, ny);
        if (closed[nk]) continue;
        var ng = cur.g + (dx && dy ? SQ2 : 1);
        if (g[nk] === undefined || ng < g[nk]) {
          g[nk] = ng; came[nk] = ck;
          open.push({ x: nx, y: ny, g: ng, f: ng + octile(nx, ny, gx, gy) });
        }
      }
    }
    return null;
  }
  // 从 start 能走到的所有格及步数（Dijkstra），用于“点到障碍走最近可达格”
  function reachable(walkable, cols, rows, sx, sy) {
    var dist = {}, list = [], q = [{ x: sx, y: sy, d: 0 }];
    dist[sy * cols + sx] = 0;
    while (q.length) {
      var bi = 0;
      for (var i = 1; i < q.length; i++) if (q[i].d < q[bi].d) bi = i;
      var c = q.splice(bi, 1)[0];
      if (c.d > dist[c.y * cols + c.x]) continue;
      list.push(c);
      for (var d = 0; d < 8; d++) {
        var dx = DIRS[d][0], dy = DIRS[d][1], nx = c.x + dx, ny = c.y + dy;
        if (nx < 0 || ny < 0 || nx >= cols || ny >= rows) continue;
        if (!canStep(walkable, c.x, c.y, dx, dy)) continue;
        var nd = c.d + (dx && dy ? SQ2 : 1), nk = ny * cols + nx;
        if (dist[nk] === undefined || nd < dist[nk] - 1e-9) { dist[nk] = nd; q.push({ x: nx, y: ny, d: nd }); }
      }
    }
    return list;
  }
  // 目标不可达时，找离目标（欧氏距离）最近的可达格；同距离取步数少的
  function nearestReachable(walkable, cols, rows, sx, sy, tx, ty) {
    var list = reachable(walkable, cols, rows, sx, sy), best = null, bd = 1e9, bs = 1e9;
    for (var i = 0; i < list.length; i++) {
      var c = list[i], dd = Math.hypot(c.x - tx, c.y - ty);
      if (dd < bd - 1e-6 || (Math.abs(dd - bd) < 1e-6 && c.d < bs)) { bd = dd; bs = c.d; best = c; }
    }
    return best;
  }
  window.PathFind = { astar: astar, reachable: reachable, nearestReachable: nearestReachable, canStep: canStep };
})();
