#!/usr/bin/env python3
"""Build an independent Xiaohongshu offline copy of committed M14.

Does not modify /workspace/m14 or any locked tree. Images stay at their
original pixel size; only the encoding changes from PNG to WebP.
"""
from __future__ import annotations

import hashlib
import io
import re
import shutil
import zipfile
from pathlib import Path

from PIL import Image

ROOT = Path("/workspace")
SRC = ROOT / "m14"
OUT = ROOT / "xhs-m14-offline"
DIST = OUT / "dist"
COMPAT = OUT / "compat"
QUALITY = 85
SKIP_DIRS = {"assets/ui"}
SKIP_NAMES = {
    "M14_NOTES.md",
    "M13_NOTES.md",
    "M11_MENU.md",
    "SPEC.md",
    "DIALOGUE_ID_FIX.md",
    "manifest.json",
    "dialogue.js.bak",
}
# PWA icons that are only referenced by the removed manifest / apple-touch link.
SKIP_ICONS = {"icon-180.png", "icon-512.png", "icon-512-maskable.png"}


def sha256(data: bytes) -> str:
    return hashlib.sha256(data).hexdigest()


def convert_png(src: Path, dest: Path) -> dict:
    im = Image.open(src)
    bands = im.getbands()
    if im.mode not in ("RGB", "RGBA"):
        im = im.convert("RGBA" if "A" in bands else "RGB")
    dest.parent.mkdir(parents=True, exist_ok=True)
    im.save(dest, "WEBP", quality=QUALITY, method=6)
    back = Image.open(dest).convert("RGBA")
    base = im.convert("RGBA")
    if base.size != back.size:
        raise SystemExit(f"size changed: {src}")
    # Mean absolute error on a stride sample, 0 = identical.
    step = 16
    a = list(base.resize((max(1, base.width // step), max(1, base.height // step))).getdata())
    b = list(back.resize((max(1, back.width // step), max(1, back.height // step))).getdata())
    n = min(len(a), len(b)) or 1
    err = 0
    for i in range(n):
        pa, pb = a[i], b[i]
        err += abs(pa[0] - pb[0]) + abs(pa[1] - pb[1]) + abs(pa[2] - pb[2]) + abs(pa[3] - pb[3])
    mae = err / (n * 4)
    return {
        "src": str(src.relative_to(SRC)),
        "dest": str(dest.relative_to(DIST)),
        "px": f"{base.width}x{base.height}",
        "mode": im.mode,
        "png": src.stat().st_size,
        "webp": dest.stat().st_size,
        "mae": round(mae, 3),
    }


def rewrite_paths(text: str) -> str:
    def repl(match: re.Match) -> str:
        path = match.group(1)
        webp = path[:-4] + ".webp"
        if (DIST / webp).is_file():
            return webp
        return path

    text = re.sub(r"((?:assets|icons)/[A-Za-z0-9_./-]+\.png)", repl, text)
    text = text.replace('"assets/" + key + ".png"', '"assets/" + key + ".webp"')
    text = text.replace("'assets/'+d.cg+'.png'", "'assets/'+d.cg+'.webp'")
    return text


def patch_index(text: str) -> str:
    drop_exact = [
        '<meta name="apple-mobile-web-app-capable" content="yes">\n',
        '<meta name="mobile-web-app-capable" content="yes">\n',
        '<meta name="apple-mobile-web-app-status-bar-style" content="black-translucent">\n',
        '<meta name="apple-mobile-web-app-title" content="椒麻江湖">\n',
        '<link rel="manifest" href="manifest.json">\n',
        '<link rel="apple-touch-icon" href="icons/icon-180.png">\n',
    ]
    for line in drop_exact:
        text = text.replace(line, "")
    text = text.replace(
        "<title>椒麻江湖 · M14 名牌避让招牌字</title>",
        "<title>椒麻江湖 · M14 · 1.0.0</title>",
    )
    if 'name="version"' not in text:
        text = text.replace(
            '<meta charset="utf-8">',
            '<meta charset="utf-8">\n<meta name="version" content="1.0.0">',
        )
    text = text.replace(
        '<link rel="stylesheet" href="css/fill_m13.css">',
        '<link rel="stylesheet" href="css/fill_m13.css">\n<link rel="stylesheet" href="./css/chrome61.css">',
    )
    text = text.replace(
        '<script src="assets.js"></script>',
        '<script src="./js/chrome61.js"></script>\n<script src="./assets.js"></script>',
    )

    def prefix(match: re.Match) -> str:
        attr, quote, url = match.group(1), match.group(2), match.group(3)
        if url.startswith(("./", "/", "#", "data:", "http:", "https:")):
            return match.group(0)
        return f"{attr}={quote}./{url}{quote}"

    text = re.sub(r'\b(href|src)=(["\'])([^"\']+)\2', prefix, text)
    return text


FILL_OLD = """// - Fill.fs：全屏（requestFullscreen + webkit 前缀，能锁就锁横屏）；iPhone Safari 不支持元素全屏 → 设置里提示「添加到主屏幕」。"""
FILL_NEW = """// - Fill.fs：离线包不调用网页全屏。画面用 CSS 铺满窗口，全屏由小红书容器管理。"""

FILL_BLOCK_OLD = """  // ---------- 全屏 ----------
  var ua = navigator.userAgent || "";
  var isIOS = /iPad|iPhone|iPod/.test(ua) || (navigator.platform === "MacIntel" && navigator.maxTouchPoints > 1);
  var de = document.documentElement;
  function supported() { return !!(de.requestFullscreen || de.webkitRequestFullscreen || de.webkitEnterFullscreen); }
  function active() { return !!(document.fullscreenElement || document.webkitFullscreenElement); }
  function standalone() { return !!((window.matchMedia && (matchMedia("(display-mode: fullscreen)").matches || matchMedia("(display-mode: standalone)").matches)) || navigator.standalone); }
  function lockLandscape() {
    try { if (screen.orientation && screen.orientation.lock) screen.orientation.lock("landscape").catch(function () {}); } catch (e) {}
  }
  function enter() {
    var r;
    try {
      if (de.requestFullscreen) r = de.requestFullscreen({ navigationUI: "hide" });
      else if (de.webkitRequestFullscreen) r = de.webkitRequestFullscreen();
    } catch (e) {}
    if (r && r.then) r.then(lockLandscape).catch(function () {}); else setTimeout(lockLandscape, 300);
    return !!r || supported();
  }
  function exit() { try { (document.exitFullscreen || document.webkitExitFullscreen || function () {}).call(document); } catch (e) {} }
  function toggle() { if (active()) exit(); else enter(); }
  var iosHint = "iPhone 的 Safari 不支持网页全屏：点 Safari 底部「分享」→「添加到主屏幕」，再从主屏幕图标打开，就没有地址栏了。";

  window.Fill = { viewport: viewport, view: view, drawExtended: drawExtended, drawWallExt: drawWallExt, edgeColors: edgeColors,
    fs: { supported: supported, active: active, standalone: standalone, enter: enter, exit: exit, toggle: toggle, isIOS: isIOS, iosHint: iosHint } };"""

FILL_BLOCK_NEW = """  // ---------- 全屏 ----------
  // 容器禁止网页全屏接口。画面已经按视口铺满，这里只保留原来的调用形状，避免设置按钮走到被禁接口。
  function supported() { return false; }
  function active() { return false; }
  function standalone() { return false; }
  function enter() { return false; }
  function exit() {}
  function toggle() {}
  var iosHint = "画面已铺满窗口。全屏由小红书容器管理。";

  window.Fill = { viewport: viewport, view: view, drawExtended: drawExtended, drawWallExt: drawWallExt, edgeColors: edgeColors,
    fs: { supported: supported, active: active, standalone: standalone, enter: enter, exit: exit, toggle: toggle, isIOS: false, iosHint: iosHint } };"""

HUD_OLD = """  // M13：全屏。安卓 / 桌面 / iPad：requestFullscreen（含 webkit 前缀），能锁就锁横屏；
  // iPhone Safari 不支持网页元素全屏 → 设置里给「添加到主屏幕」提示（manifest display: fullscreen + apple-mobile-web-app-capable）。"""
HUD_NEW = """  // 离线包：不再提供网页全屏。设置里只说明画面已铺满、全屏由容器管理。"""

EDITOR_OLD = """  function exportMap() {
    var blob = new Blob([exportText()], { type: "text/javascript" });
    var a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = fileName();
    document.body.appendChild(a); a.click();
    setTimeout(function () { URL.revokeObjectURL(a.href); a.remove(); }, 1000);
    window.Game.toast("已导出 " + fileName() + "，替换 game-m4/" + fileName() + " 即生效");
  }"""
EDITOR_NEW = """  function exportMap() {
    var text = exportText();
    var box = document.getElementById("ed-export-box");
    if (!box) {
      box = document.createElement("pre");
      box.id = "ed-export-box";
      box.setAttribute("tabindex", "0");
      box.style.cssText = "max-height:140px;overflow:auto;white-space:pre-wrap;word-break:break-all;font:12px/1.4 monospace;background:#1c140e;color:#f3e7c9;padding:6px;margin-top:6px;-webkit-user-select:text;user-select:text;";
      document.getElementById("editor").appendChild(box);
    }
    box.textContent = text;
    if (window.Game) window.Game.toast("校准结果已显示在编辑器里，可长按选中复制");
  }"""


def main() -> None:
    if DIST.exists():
        shutil.rmtree(DIST)
    DIST.mkdir(parents=True)
    rows = []
    excluded = []
    for src in sorted(SRC.rglob("*")):
        if not src.is_file():
            continue
        rel = src.relative_to(SRC).as_posix()
        top = rel.split("/")[0]
        if rel in SKIP_NAMES or Path(rel).name in SKIP_NAMES or rel.startswith("assets/ui/") or Path(rel).name in SKIP_ICONS:
            excluded.append((rel, src.stat().st_size))
            continue
        if src.suffix.lower() == ".png" and top != "icons":
            dest = DIST / (str(src.relative_to(SRC).with_suffix(".webp")))
            rows.append(convert_png(src, dest))
            continue
        dest = DIST / rel
        dest.parent.mkdir(parents=True, exist_ok=True)
        if src.suffix.lower() in {".js", ".html", ".css", ".json"}:
            text = src.read_text(encoding="utf-8")
            text = rewrite_paths(text)
            dest.write_text(text, encoding="utf-8")
        else:
            shutil.copy2(src, dest)

    shutil.copy2(COMPAT / "chrome61.css", DIST / "css" / "chrome61.css")
    shutil.copy2(COMPAT / "chrome61.js", DIST / "js" / "chrome61.js")

    index = DIST / "index.html"
    index.write_text(patch_index(index.read_text(encoding="utf-8")), encoding="utf-8")

    fill = DIST / "js" / "fill.js"
    fill_text = fill.read_text(encoding="utf-8")
    if FILL_OLD not in fill_text or FILL_BLOCK_OLD not in fill_text:
        raise SystemExit("fill.js patch anchor missing")
    fill.write_text(fill_text.replace(FILL_OLD, FILL_NEW).replace(FILL_BLOCK_OLD, FILL_BLOCK_NEW), encoding="utf-8")

    hud = DIST / "js" / "hud.js"
    hud_text = hud.read_text(encoding="utf-8")
    if HUD_OLD not in hud_text:
        raise SystemExit("hud.js patch anchor missing")
    hud.write_text(hud_text.replace(HUD_OLD, HUD_NEW), encoding="utf-8")

    editor = DIST / "js" / "editor.js"
    editor_text = editor.read_text(encoding="utf-8")
    if EDITOR_OLD not in editor_text:
        raise SystemExit("editor.js patch anchor missing")
    editor.write_text(editor_text.replace(EDITOR_OLD, EDITOR_NEW), encoding="utf-8")

    (DIST / "version.json").write_text(
        '{\n'
        '  "name": "椒麻江湖",\n'
        '  "version": "1.0.0",\n'
        '  "source": "m14",\n'
        '  "sourceCommit": "6b24db9a7ffbbf29df4605e16639d158766daf65"\n'
        '}\n',
        encoding="utf-8",
    )

    report = OUT / "image-encode.tsv"
    lines = ["src\tdest\tpx\tmode\tpng\twebp\tmae"]
    for row in rows:
        lines.append("\t".join(str(row[k]) for k in ("src", "dest", "px", "mode", "png", "webp", "mae")))
    report.write_text("\n".join(lines) + "\n", encoding="utf-8")
    excl = OUT / "excluded-nonruntime.tsv"
    excl.write_text(
        "path\tbytes\treason\n"
        + "\n".join(f"{p}\t{n}\tnon-runtime" for p, n in excluded)
        + "\n",
        encoding="utf-8",
    )
    png_sum = sum(r["png"] for r in rows)
    webp_sum = sum(r["webp"] for r in rows)
    print(f"converted {len(rows)} png -> webp q={QUALITY}")
    print(f"png {png_sum} webp {webp_sum}")
    print(f"excluded {len(excluded)} files, {sum(n for _, n in excluded)} bytes")
    worst = sorted(rows, key=lambda r: -r["mae"])[:8]
    print("highest mae", [(w["src"], w["mae"], w["px"]) for w in worst])


if __name__ == "__main__":
    main()
