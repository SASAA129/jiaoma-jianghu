/* 小红书离线包：Chrome 61 能力检测。不改玩法。 */
(function () {
  function supportsFlexGap() {
    var flex = document.createElement("div");
    flex.style.position = "absolute";
    flex.style.visibility = "hidden";
    flex.style.display = "flex";
    flex.style.flexDirection = "column";
    flex.style.rowGap = "1px";
    flex.appendChild(document.createElement("div"));
    flex.appendChild(document.createElement("div"));
    document.body.appendChild(flex);
    var supported = flex.scrollHeight === 1;
    flex.parentNode.removeChild(flex);
    return supported;
  }
  if (supportsFlexGap()) document.documentElement.classList.add("supports-flex-gap");

  /* :has() 在 Chrome 61 整段失效。对话 / 面板 / 交谈钮出现时仍收起探索栏。 */
  function syncExplore() {
    var hud = document.getElementById("hud");
    var panel = document.getElementById("hud-panel");
    var talk = hud && hud.querySelector(".hud-talk:not(.hidden)");
    var hide = !!((hud && hud.classList.contains("talking")) || talk || (panel && !panel.classList.contains("hidden")));
    document.body.classList.toggle("xhs-hide-explore", hide);
  }
  function arm() {
    syncExplore();
    if (!window.MutationObserver) return;
    var obs = new MutationObserver(syncExplore);
    obs.observe(document.body, { attributes: true, attributeFilter: ["class"], subtree: true, childList: true });
  }
  if (document.body) arm();
  else document.addEventListener("DOMContentLoaded", arm);
})();
