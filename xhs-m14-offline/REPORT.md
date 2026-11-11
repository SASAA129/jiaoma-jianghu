# M14 小红书离线包 1.0.0

独立副本，未改仓库里的 `m14/`、`m13/`、旧站首页和锁定素材。未登录、未安装小红书管理 CLI、未上传、未送审、未发笔记、未生图。

## 1. 仓库里的真 M14

| 项 | 值 |
| --- | --- |
| 仓库 | `https://github.com/sasaa129/jiaoma-jianghu` |
| 路径 | `m14/` |
| 引入提交 | `6b24db9a7ffbbf29df4605e16639d158766daf65` |
| 作者时间 | 2026-10-19 15:56:58 +0800 |
| 说明 | `M14 目标名牌不压招牌字；M13 标已锁定` |
| 此后 | `git diff 6b24db9 HEAD -- m14` 为空。当前 `main` 头 `7223323eb30ffa40ff1bf59ac936292bfaa33cad` 只加了跑酷原型，没有再改 M14 |
| 文件 | 127 个，合计 37,592,313 字节 |
| 图片 | 75 张 PNG，36,907,638 字节，全部是真像素图（火锅店底图 1536×1024 等），不是 LFS 指针 |

和本机记录对得上的证据：

- `m14/M14_NOTES.md`：基于 M13，只为名牌避开招牌「椒麻鸡火锅」。
- `m14/js/save.js`：存档键 `jiaoma_jianghu_m14`，读不到时再读 M13→M8。
- `m14/js/hud.js`：偏好键 `jiaoma_hud_prefs_m14`。
- `m14/js/markers.js`：`signText` / `signPad` / `moved:"sign"`。
- 与锁定的 `m13/` 相比，内容不同的只有 `index.html`、`manifest.json`、`js/hud.js`、`js/save.js`、`js/story.js`、`js/ui.js`、`js/markers.js`，外加只在 M14 的 `M14_NOTES.md`。前六个是标题、印章、存档键和会话键；玩法差异在 `markers.js`。

仓库里没有的本机文件：

- `/workspace/game-m14.zip`（你记录的 57,545,818 字节）不在这份检出里。
- `tools/selftest_m14.py` 不在仓库里。`M14_NOTES.md` 提到的 `screenshots/m14_sign_clear_*.png` 也不在。
- 37,592,313 字节的已提交目录，加上 zip 开销，对不上 57,545,818。多出来的约两千万字节没有进 git。离线包只打包已提交的可运行 M14，没有用 M15 或跑酷补内容，也没有编造缺失文件。

## 2. 体积：先分运行素材和开发文件

已提交 M14 的 37.6MB 里，约 36.9MB 是运行时 PNG。开发文件很小，删掉它们到不了 10MB。

未打进离线包、也不是章节画面的文件（合计约 143KB，另有一份对白备份）：

- 说明文档：`M14_NOTES.md`、`M13_NOTES.md`、`M11_MENU.md`、`SPEC.md`、`DIALOGUE_ID_FIX.md`
- `data/dialogue.js.bak`（91,755 字节，对白备份）
- `assets/ui/*.png`（11 张，共 44,434 字节）。M13 起圆钮和面板改由 CSS 绘制，这批 PNG 在 JS/CSS/HTML 里没有引用
- `manifest.json` 以及只被 PWA / 主屏幕图标引用的 `icons/icon-180.png`、`icon-512.png`、`icon-512-maskable.png`
- 保留 `icons/icon-192.png` 作为页面图标

60 张运行图（底图、人物、道具、骨骼件、特效、章节图标）保持原来的宽高，只从 PNG 换成 WebP quality 85。PNG 36,777,873 字节 → WebP 4,784,404 字节。抽样平均绝对误差最高约 1.1/255（`assets/rig/xiaoman/front_arm_l.png`），见 `image-encode.tsv`。没有删章节，没有缩小世界坐标。

## 3. 音效

M14 没有 `.mp3` / `.wav` / `.ogg` / `.m4a` / `.mp4`，JS/HTML/CSS 里也没有 `AudioContext`、`<audio>`、`<video>`。这是一份无文件音效、也无程序合成音效的游戏。

规范冲突仍然成立：文件类型白名单未列音频扩展名，CSP 却允许包内 `<audio>` / `<video>`，且不允许 `data:` / `blob:` 媒体。本包没有靠删音效或把音频塞进脚本躲过这条冲突。若你本地那份 57MB zip 里另有音效，仓库里没有，需要你提供后才能判断收包风险。

## 4. 离线包

| 项 | 值 |
| --- | --- |
| 文件 | `xhs-m14-offline/jiaoma-m14-xhs-1.0.0.zip` |
| 字节 | 4,980,429（小于 10,000,000，也小于官方脚本的 10MiB = 10,485,760） |
| SHA256 | `c0fd62a62f87a76e1f29be834b96e2d29878d6807504534e0a3c1f5e1276a2fb` |
| 版本 | `1.0.0`（`version.json` 与 `<meta name="version">`、文档标题） |
| 入口 | zip 根目录 `index.html` |
| 文件数 | 109 |
| 清单 | `FILELIST.tsv`（每个成员的解压大小和 SHA256） |

官方 `audit_artifact.py` 对目录：`PASS: 109 file(s), 0 warning(s)`。对 zip：`PASS`，并有一条建议值警告：`zip is 4.75 MiB; recommended target is 2 MiB`。体积硬门槛通过。2MiB 只是建议值，没有再压画质去凑它。

规范包已重新下载并核对：40,037 字节，SHA256 `add225e1e03d8872347788ef74cddfbe4215164c90c12d1d4738cf937791c531`，12 个普通文件，无路径穿越。`SKILL.md` 和全部 reference 已读。在线文档 `https://miniapp-sandbox.xiaohongshu.com/minitool/doc` 请求 20 秒超时，未完成在线核验，没有播报新增能力。实现按包内 2026-10-30 基线保守处理，没有接入云存储、排行榜或头像昵称授权。

副本里为规范改过的点（只在 `xhs-m14-offline/dist`，不在 `m14/`）：

- 资源改为相对路径；脚本保持经典外链，无内联脚本、无 `type="module"`。
- 去掉 PWA manifest 和「添加到主屏幕」相关标签。网页全屏接口、横屏锁定和 UA 判断已去掉，画面仍按视口铺满。设置里说明全屏由容器管理。
- 校准编辑器的「导出」不再触发 blob 下载，改为编辑器内可选中文本。
- `css/chrome61.css` + `js/chrome61.js`：Flex `gap` 用实测后的外边距基线，Grid 补 `grid-gap`，`min()` / `max()` / `inset` / `100dvh` / `:has()` 有基线。新内核检测到 Flex gap 生效后去掉补上的外边距。
- 两处 `.onclick` 和图片 `onload` 改为 `addEventListener`。
- 存档仍用原来的 `localStorage` 键 `jiaoma_jianghu_m14`。读写失败时沿用原有内存档。没有调用 `window.xhs.miniTool`。

静态扫描：无 `fetch`、XHR、WebSocket、`eval`、`new Function`、WASM、Worker、外部 `http(s)` URL。JS 未发现可选链、`??`、对象展开等 ES2018+ 语法。`node --check` 通过。引用的 106 个相对资源都在包内。

## 5. 桌面 Chrome 实测

环境是本机 headless Chrome（当前桌面版），页面由 `127.0.0.1:8765` 提供。这不是小红书容器，也不是 Android 8.1 / Chrome 61。

| 步骤 | 结果 |
| --- | --- |
| 标题页，42 张运行图 | 全部 `ok`，失败 0。文档标题 `椒麻江湖 · M14 · 1.0.0` |
| 新游戏 → 第一章卡 | 文案为「第一章 / 锦囊失踪记」 |
| 进入火锅店 | 场景 `shop`，队长格 (7,11) |
| 名牌 | `Markers.list()` 中满掌柜为 `target` 且 `moved:"sign"`。名牌矩形与三块招牌字区不相交 |
| 点地走路 | `clickWorld` 返回 `move:7,7`，走到后队长格为 (7,7) |
| 走向满掌柜并交谈 | 动作菜单打开后 `doAction("talk")`，对白节点 `zg_1`，界面出现「小满！你们可算回来了」 |
| 第二至六章底图 | `setScene` 到 market / river / village / hq / arena，对应 `bg_*` 状态均为 `ok`。擂台截图能看到「天下第一锅」「老评委」 |
| 资源请求 | 105 条，全部来自 `127.0.0.1:8765`，没有外链 |
| 存档 | `jiaoma_jianghu_m14` 能写入探针旗标 |
| 存储被抛错 | 注入的 `localStorage` / `sessionStorage` 一读就抛错。标题页仍能进新游戏，内存档能读回探针旗标 |

截图在 `evidence/`：`01-title-portrait.png`、`02-chapter-portrait.png`、`03-shop-portrait.png`、`04-moved-portrait.png`、`05-shop-landscape.png`、`06-storage-fallback.png`、`07-talk.png`、`08-arena.png`。

## 6. 未测

- 小红书创服模拟器：未测。未登录、未上传。
- 小红书 Android / iOS 容器与真机扫码：未测。桌面 Chrome 不能代替。
- Android 8.1 / Chrome 61 真内核：未测。语法和 CSS 基线只做了静态对照。桌面 Chrome 走的是支持 Flex gap 的增强路径。
- `file://` 双击打开：未单独测。本地服务器上的相对路径已测。
- 原 `tools/selftest_m14.py`：仓库里没有这份脚本，未跑。
- 在线小工具文档：获取超时，API 未与线上核对。
- 帧率、内存、低端机：未实测。游戏是 Canvas 2D，没有 WebGL。

上传前仍需要你在创服模拟器里走一遍，再用 Android 和 iOS 真机扫同一份 zip。不要把上面的桌面结果写成容器验收。

## 7. 部署

GitHub Pages 源是 `main` 根目录（`https://sasaa129.github.io/jiaoma-jianghu/`），唯一的 Actions 工作流是 Pages 的 `pages-build-deployment`。推送 `cursor/m14-xhs-offline-32ea` 不会发布旧站。不要把这个分支合并进 `main`，否则下次 Pages 构建会把新目录一起公开。本分支没有改首页，也没有改 `m14/`。
