// 数据驱动对话：读取 window.DIALOGUE，逐字打出，点击/空格继续，支持 2~3 个选项和 flag。
(function () {
  var D = window.DIALOGUE || { speakers: {}, nodes: {}, entries: {} };
  var flags = {};
  var el, portrait, seal, text, opts, more;
  var state = null; // {node, shown, full, typing, t}
  var CPS = 28;     // 每秒字数
  var onClose = null;

  function init() {
    el = document.getElementById("dialog");
    portrait = el.querySelector(".portrait");
    seal = el.querySelector(".seal");
    text = el.querySelector(".text");
    opts = el.querySelector(".options");
    more = el.querySelector(".more");
    el.addEventListener("pointerdown", function (e) { e.stopPropagation(); });
    el.addEventListener("click", function (e) {
      if (e.target.closest("button")) return;
      advance();
    });
  }
  function condOK(o) {
    if (!o) return true;
    var i;
    if (o.if) for (i = 0; i < o.if.length; i++) if (!flags[o.if[i]]) return false;
    if (o.ifNot) for (i = 0; i < o.ifNot.length; i++) if (flags[o.ifNot[i]]) return false;
    return true;
  }
  function setFlags(arr) { (arr || []).forEach(function (f) { flags[f] = true; }); }

  function startEntry(targetId, action, closeCb) {
    var list = (D.entries[targetId] || {})[action];
    if (!list) return false;
    for (var i = 0; i < list.length; i++) if (condOK(list[i])) { open(list[i].node, closeCb); return true; }
    return false;
  }
  function open(nodeId, closeCb) {
    onClose = closeCb || null;
    el.classList.remove("hidden");
    show(nodeId);
  }
  function show(nodeId) {
    var n = D.nodes[nodeId];
    while (n && !condOK(n)) { nodeId = n.else; n = nodeId ? D.nodes[nodeId] : null; }
    if (!n) { close(); return; }
    setFlags(n.set);
    var sp = D.speakers[n.speaker] || { name: n.speaker || "" };
    seal.textContent = sp.name;
    seal.style.display = sp.name ? "" : "none";
    var color = (window.Game && window.Game.colorOf(n.speaker)) || "#6b5f52";
    if (sp.sprite || n.speaker === "narrator") {
      if (n.speaker === "narrator") window.Sprites.drawPortrait(portrait, null, "墨", "#2b2622");
      else window.Sprites.drawPortrait(portrait, sp.sprite, sp.name, color);
    }
    state = { id: nodeId, node: n, full: n.text || "", shown: 0, typing: true };
    text.textContent = "";
    opts.innerHTML = "";
    more.style.display = "none";
  }
  function finishTyping() {
    if (!state) return;
    state.shown = state.full.length; state.typing = false;
    text.textContent = state.full;
    renderOptions();
  }
  function renderOptions() {
    var n = state.node;
    opts.innerHTML = "";
    var list = (n.options || []).filter(condOK);
    if (list.length) {
      list.forEach(function (o, i) {
        var b = document.createElement("button");
        b.innerHTML = "<b>" + (i + 1) + "</b>" + o.text;
        b.addEventListener("click", function (e) { e.stopPropagation(); choose(i); });
        opts.appendChild(b);
      });
      more.style.display = "none";
    } else more.style.display = "";
  }
  function choose(i) {
    if (!state || state.typing) return;
    var list = (state.node.options || []).filter(condOK), o = list[i];
    if (!o) return;
    setFlags(o.set);
    if (o.next) show(o.next); else close();
  }
  function advance() {
    if (!state) return;
    if (state.typing) { finishTyping(); return; }
    if ((state.node.options || []).filter(condOK).length) return;
    if (state.node.next) show(state.node.next); else close();
  }
  function close() {
    state = null;
    el.classList.add("hidden");
    var cb = onClose; onClose = null;
    if (cb) cb();
  }
  function update(dt) {
    if (!state || !state.typing) return;
    state.shown += dt * CPS;
    var k = Math.min(state.full.length, Math.floor(state.shown));
    text.textContent = state.full.slice(0, k);
    if (k >= state.full.length) { state.typing = false; renderOptions(); }
  }
  function key(e) {
    if (!state) return false;
    if (e.code === "Space" || e.key === "Enter") { advance(); return true; }
    var n = parseInt(e.key, 10);
    if (n >= 1 && n <= 3) { choose(n - 1); return true; }
    if (e.key === "Escape") { close(); return true; }
    return true; // 对话打开时吞掉其他按键
  }
  window.Dialog = {
    init: init, startEntry: startEntry, open: open, update: update, key: key, close: close,
    isOpen: function () { return !!state; }, flags: flags, current: function () { return state && state.id; }
  };
})();
