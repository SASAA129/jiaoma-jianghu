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
