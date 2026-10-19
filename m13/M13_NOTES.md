# M13 · 平涂场景 + 火锅店重标碰撞 + 平涂 UI

- 场景：assets/bg_room.png / bg_battle.png / bg_worldmap.png = art/ch7/*_flat.png（md5 一致）；data/worldmap_art.js 来自 art/ch7/map_flat.json。
- 火锅店（map.js）：四张火锅桌和红凳已画进底图，去掉旧中央桌贴图；桌凳格 + 桌后会被挡住的格标为不可走（用底图非地板像素覆盖率 + 人物身体遮挡测试算出）；
  「火锅桌」交互指左上那桌（点桌面也能触发）；店门移到前沿空地 (7,12)/(8,12)；老码头进店落脚 (7,10)(6,11)(8,11)；满掌柜站位不变。
  空白木匾由程序写「椒麻鸡火锅」；门帘贴图坐标不变（新图门洞同位）。旧存档若站在新桌上，自动退回出生点。
- 大地图：data/worldmap.js artRouteVia 按平涂底图水面掩膜 A* 重算，陆路段 0 水面，只有古渡两段 ≤150px 渡船。
- 平涂 UI：css/ui_flat.css（设计规范原样）+ css/ui_flat_m13.css（接到 M12 DOM）；HUD 圆钮/交谈钮/面板全用 CSS 画，不再用占位 PNG；
  对话框挪到屏幕层（手机 CSS 像素：正文 20px/1.7、名字牌椒红胶囊、选项 18px），被章节卡/黑场/战斗/小游戏盖住时自动让位。
- 自测：tools/selftest_m13.py（截图在 screenshots/）。

## M13 继续改（10-19 下午）：武侠夜色界面 + 招牌修正 + 铺满屏幕
- 界面：css/ui_wuxia.css（用户选的方案 A「武侠夜色」，原样复制，放在 ui_flat_m13.css 之后）。
- 招牌：去掉斜写的字；js/story.js drawShopSign 在招牌位置叠一块端正牌匾（深木框金边 + 深墨底 + 内金线 + 金字），五字逐字等距、水平居中；世界坐标绘制，随相机缩放，canvas 按 dpr 出图。map.js signText 改为 {x:363,y:91,w:358,h:186,skew:0}，招牌热区同步。
- 铺满：js/fill.js（视口 / cover 视野 / 边缘延伸色 / 全屏）；game.js 舞台 = 整个视口（逻辑尺寸 = 视口 ÷ contain 比例），canvas = 视口 × dpr，相机 cover（竖屏最多放大到 contain 的 2 倍）跟随队长、限制在地图内，地图比屏幕小的方向用底图边缘延伸色补满；
  battle.js / worldmap.js 同样 cover，但所有单位 / 节点不裁；resize、orientationchange、visualViewport resize、fullscreenchange 和每帧尺寸检查都会即时重算。css/fill_m13.css 只改布局（100dvh、全屏层跟舞台走、fs-chip）。
- 全屏：设置里「全屏 / 退出全屏」+ 首次点击弹出「全屏」钮（requestFullscreen + webkit 前缀，成功后 screen.orientation.lock('landscape')）；
  iPhone Safari 无元素全屏 → 设置里提示「分享 → 添加到主屏幕」；manifest.json（display: fullscreen，orientation: landscape，图标 icons/）+ apple-mobile-web-app-capable / black-translucent / apple-touch-icon。

## M13 继续改（10-19 下午）：招牌画进底图 + 血条加粗
- 血条：css/ui_wuxia.css 与 art/ui_wuxia/ui_wuxia.css 逐字节一致。伙伴面板 14px 带数字，HUD 左上 10px（武侠夜色初版是 7px）。ui_flat_m13.css 同步成 10/14。只改 CSS。
- 招牌：字由设计画进 `art/ch7/bg_room_flat_sign.png`（1536×1024，与旧 flat 同尺寸）。`assets/bg_room.png` 与之 md5 一致；prep_assets SRC_OVERRIDE 优先指向它。map.js `signText: null`，drawShopSign 不画任何叠字/牌匾/斜切字。
- 桌上锅：不接入 prop_pot_flat；map.js props 仍为空；写实锅仍是底图像素（用户没说锅有问题）。
- 碰撞 / 热区：底图同尺寸，walk / interactables 未改。

## 探索栏重做（2026-10-19）
- 设计稿：游戏设计 Bot 写进 `css/ui_wuxia.css` 的武侠夜色探索栏（深色半透明底、细金线、菱形标记、目标高亮、「近」章、A/B/C 金色圆章路线、「进行中」小签、完成变灰划线），原样使用未改。
- 手机小修：`css/explore_fix.css`（index.html 里排在 ui_wuxia.css 之后），只在手机尺寸（宽 ≤900 或高 ≤600）生效：
  - 设计稿按 1536 舞台 px 写，手机上整体缩到约 0.4 倍，条目只有约 26px 高、字约 9px → 按「CSS px ÷ 舞台缩放」换算，条目 / 路线行 48px、字 15/14px。
  - 横屏：贴右侧，宽 210px，夹在地名/地图钮与底部菜单之间，超出可上下滑动（路线在条目下方，滑到底可见）。
  - 竖屏：改成底部菜单上方的横向可滑卡片条（两行：探索条目 / A·B·C 路线），不再压在满掌柜头顶；走近 NPC 出现「交谈」大钮时让位。
  - 对话框、面板打开时整栏让位，不压对话框。

## 探索改头顶名牌（2026-10-19 下午，用户：「右侧探索栏不喜欢」→「做出来我先看看」）
- 去掉右侧探索栏 / 竖屏底部卡片条：`css/markers_m13.css` 把 `#explore` 整个 `display:none`（DOM 留着，旧逻辑不报错）；index.html 不再引用 `css/explore_fix.css`（文件留档未删）。`css/ui_wuxia.css` 未改。
- 头顶名牌：样式 = 游戏设计 Bot 的 `art/ui_wuxia/marker/markers.css`，原样复制为 `css/markers.css`（md5 一致，自测校验）；结构按同目录 README：
  `<div class="wx-mk npc|prop [target] [near] [edge-*]"><div class="tag">名字</div><div class="gem"></div></div>`，挂在 body 的 `#wx-markers` 层（z 39，在 HUD 之下）。
  - `js/markers.js`：每帧用 `Game.worldToClient`（含舞台缩放 / cover 相机 / dpr）把世界坐标换成屏幕 CSS px 定位。锚点：有 hit 取 hit 顶边中点，人物取头顶（`anchorOf`）。
  - 状态：人物 `.npc`、物件 `.prop`、当前目标 `.target`（金底名牌 + 红「！」圆章 + 浮动）、队长 ≤3 格 `.near`；目标在屏外 → 沿「屏幕中心→目标」贴边 `.edge-left/right/up/down` 带箭头，点它也走过去；其他屏外物件不显示；最多 6 块（目标优先）。
  - 店门（exit）不挂牌（底图已有出口牌），点店门照旧能走；出口是目标且在屏外时仍贴边指路。
  - 避让：不压 HUD（头像卡 / 当前目标 / 地名地图 / 底部菜单 / 交谈钮 / 全屏钮），不压 NPC 身体，名牌之间互不重叠；头顶被 HUD 顶下来时改挂身侧；非目标牌子挤开超过 140px 就不挂（本体照样可点）。
  - 走到旁边（出现「交谈」大钮）、对话 / 动作菜单 / 面板 / 战斗 / 地图打开时整层隐藏。
  - 点名牌 = `Game.goInteract`（A* 走过去 + 原交互菜单）；点人物 / 物件本身仍有效（game.js 原命中逻辑不变）。
  - 行为参数集中在 `Markers.config`（maxShown、minHit、nearCells、edgeMargin、hudPad、maxShift、lift、avoid…），外观全在 markers.css，按设计规格替换只换 css。
  - 手机补丁 `css/markers_m13.css`：点击区 ≥48×48（设计稿 44，取大者，透明 padding）、物件牌字 12→13px、物件当目标时补回金底（设计稿 .prop 规则写在 .target 后面把金底盖掉了）。
  - 旧的画布红三角目标标记停用（有名牌层时 story.js 不画）。
- 路线进「任务」面板：`hud.js` 任务面板加「路线」一节（`css/tasks_routes_m13.css`，行高 48、字 15）。第一章 A/B/C：点一条 → 关面板、走到满掌柜身边、开他的选线对白并用 `Dialog.choose` 点下同一个选项（route 指令 / 切队长 / 接 B1 等对白，与手点完全同一条代码）；还没听过锦囊的先播开场，到「三条路，你们挑一条」时自动选。进行中 / 已完有标签。第二章起显示本章清单，点未完成项走向目标。数据来自 `Story.routeInfo()`。
- 铺满细化：场景相机改成完全 cover（`game.js` CAM_COVER；竖屏不再放大上限 2 倍而露出底图外的米色填充），镜头跟随队长并夹在底图内。
  （v1 曾在墙线外续铺地板，已在 v2 撤掉，见下节。）
- 自测：`tools/selftest_m13.py` 第 8 节换成名牌 / 路线 / 铺满用例 + 锁定 178 个文件 md5 基线校验。截图：`screenshots/m13_markers_{land_iphone,land_android,port_iphone,port_android}.png`（`*_edge.png` 贴边）、`m13_markers_routes.png`、`m13_markers_before_after.png`。

## M13 v2（10-19 15:25 游戏设计 Bot 两处修改）：竖屏缩放上限 + 墙线外改墙色
- 缩放上限：`js/fill.js` view 新增 `minViewW`；`game.js` 相机 cover 但一屏至少看到 768 世界 px 宽（火锅店底图 1536 的一半）。竖屏 iPhone 390×844 / Android 360×800 视野 768 × 1662 / 1707（v1 只有约 473 宽）。
  镜头横向跟着队长（小满）走，限制在店内；竖屏高度方向整店可见，上下多出的部分由延展图铺满；屏外目标交给贴边名牌。横屏不变（本来就满宽）。
- 墙线外不铺地板：撤掉 v1 的 `tools/make_floor_ext.py` 和运行时代码地板（fill.js floorPattern 已删）。
  新 `tools/make_wall_ext.py` → `assets/bg_room_ext.png`（1536×1864，世界 y=-420 起画）：底图里与图边连通的米色空地（墙线外）+ 上下各 420px 延展 = 深木墙色平涂渐变，紧贴墙线 #5A4130，离墙线 260px 到 #3B2C22，无纹理。
  地板只在墙线内侧往下延展：左墙外沿（底边 x≈306）和地板右沿（x≈1268）按底图实测等距斜率 1.86 往下收拢成地板下角，区域内沿左墙方向回溯底图最后一行取色（墙带 + 地板缝自然接上）。
  视野再超出延展图时（极端比例）：`Fill.drawWallExt` 左右按同一墙色从 #5A4130 渐变到 #3B2C22，上下用 #3B2C22（=渐变终点），不铺地板、不填米色。
- 墙外不可走 / 不可点：`data/room_outside.js`（8px 一格掩膜，1=墙外），`js/floor_ext.js` 给火锅店挂 `outsideAt(x,y)`；`game.js` rebuild 把格心在墙外的格标为障碍（当前地图没有这样的格，自测核对 0 个），clickWorld 点到墙外直接返回 "outside"（不寻路、不弹交互、不出涟漪）。
- 自测 v2 新增：视野宽 ≥768 且在延展图内、队长在画面里、下半屏米色 <1%、四边无纯黑、墙外取色在 #5A4130~#3B2C22 之间且判定为墙外、点墙外 5 处全部无效、墙外格不可走、墙内延展地板可点。截图 `screenshots/m13_markers_port_iphone_v2.png`、`m13_markers_port_android_v2.png`（四机型 m13_markers_*.png 已重拍）。
