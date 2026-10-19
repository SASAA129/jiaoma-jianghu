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
