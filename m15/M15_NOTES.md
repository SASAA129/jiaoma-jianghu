# 椒麻江湖 · M15 说明（新画风 + 新界面套到第二～六章）

- 目录 /workspace/game-m15（由 game-m14 复制），本地端口 8094，存档键 `jiaoma_jianghu_m15`（读不到时依次读 m14→m13→m12→m11→m10→m9→m8）。
- 标题 / 版本 M15；自测 `tools/selftest_m15.py`（M14 全部用例 + `tools/selftest_m15_ch.py` 第二～六章用例 + `tools/mainline_m15.py` 主线机器人）。
- 未动：game、game-m2…m14、art/locked、各章旧美术原图、art/ch7 交付的新图原件、css/ui_wuxia.css、css/markers.css（与设计稿逐字节一致）。不生图、不重画旧背景。战斗界面未改，只保证可用（战斗背景随底图覆盖表一起换成新图）。

## 1. 场景清单（第二～六章，全部已在 M14 链路里，无需从旧版导入）
| 章 | 场景 id | 地图 | 入口（测试用） |
|---|---|---|---|
| 第二章 老码头夜市 | market | map_market.js 12×14 | `?ch2=1`（火锅店出发）/ `?ch2=1&scene=market` |
| 第三章 雾江夜渡 | river | map_river.js 9×8 | `?chapter=3` |
| 第四章 麻婆岭 | village | map_village.js 10×9 | `?chapter=4` |
| 第五章 红汤总舵 | hq | map_hq.js 10×9 | `?chapter=5` |
| 第六章 擂台 | arena | map_arena.js 10×9 | `?chapter=6` |
`?chapter=2` 保持旧义（第一章开局，M14 自测沿用），第二章开头另设 `?ch2=1`。

## 2. 底图 / 两口锅覆盖表（一处可配置）
- `data/art_override.js`：`window.ART_OVERRIDE`，每项 `use: "flat" | "old"`、`old`（旧图）、`flat`（新图）、`art`（原件出处）、`name`。改 `use` 即可切回旧图，不用改别处。
- `js/art_override.js`：在 assets.js 之后、sprites.js 之前运行，只替换 `ASSETS[k].src` 与 meta（不探测文件，0 个 404），并写 `window.ART_ACTIVE`。
- `tools/apply_flat_art.py`：找 art/m15、art/m15/raw、art/ch7、assets 下的 `*_flat.png` → 原样复制进 game-m15/assets（md5 与原件一致）→ 有就把该项改成 `use: "flat"` → 重跑延展层。

| 键 | 旧文件（路径 · 尺寸） | 游戏里旧资源 | 新文件（M15 现用） |
|---|---|---|---|
| bg_market | art/locked/bg_market.png · 1536×1024 RGB · 2979KB | assets/bg_market.png 1536×1024 | assets/bg_market_flat.png（= art/ch7/bg_market_flat.png）1536×1024 · 2100KB |
| bg_river | art/ch3/bg_river.png · 1536×1024 RGB · 2772KB | assets/bg_river.png 1536×1024 | assets/bg_river_flat.png 1536×1024 · 1934KB |
| bg_village | art/ch4/bg_village.png · 1536×1024 RGB · 3140KB | assets/bg_village.png 1536×1024 | assets/bg_village_flat.png 1536×1024 · 2247KB |
| bg_hq | art/ch5/bg_hq.png · 1536×1024 RGB · 2733KB | assets/bg_hq.png 1536×1024 | assets/bg_hq_flat.png 1536×1024 · 2315KB |
| bg_arena | art/ch6/bg_arena.png · 1536×1024 RGB · 3146KB | assets/bg_arena.png 1536×1024 | assets/bg_arena_flat.png 1536×1024 · 2750KB |
| prop_red_cauldron（红汤大鼎） | art/ch5/prop_red_cauldron.png · 1024×1024 RGBA · 1219KB | assets/prop_red_cauldron.png 852×951（ax 425, ay 951） | assets/prop_red_cauldron_flat.png 757×871 · ax 340, ay 869 |
| prop_giant_pot（天下第一锅） | art/ch6/prop_giant_pot.png · 1024×1024 RGBA · 1094KB | assets/prop_giant_pot.png 900×807（ax 449, ay 807） | assets/prop_giant_pot_flat.png 758×847 · ax 374, ay 846 |

两口锅：显示宽度倍率 `meta.dispScale`（大鼎 0.95、巨锅 0.88，17:38 微调）；`drawProp` 与点击判定改按 `meta.ay` 落地（旧图 ay = h，不受影响）；脚底锚点 (ax, ay) 落在旧锅同一个地面点 `G(x+w, y+h)`，显示宽度沿用旧图（`(w+h)·tileW/2·scale`）。

## 3. 逐章核对（新图 vs 旧图叠图：可走格、NPC 站位、热区、摆件、出生点、出口）
五张新图构图与旧图一致，叠图检查（/tmp/m14p/ov_*_{old,new}.png）全部对得上，碰撞 / 站位 / 出口无需重标。新图上没有画进去的招牌字；名牌改为避开代码画的出口木牌（`Story.hookRects()`，火锅店保持 M14 摆法）。

## 4. 底图外延展（按新图边缘重新取色，`tools/make_scene_ext.py`）
| 场景 | 上半（边缘色→外侧） | 下半 | 图内判为「图外」的像素 |
|---|---|---|---|
| market | #39374B → #282735 | #7E6356 → #59463D | 0 |
| river | #1A4162 → #122E45 | #2B3F4D → #1E2D37 | 0 |
| village | #5E8B7F → #43635A | #A4926C → #74674C | 53397 |
| hq（室内） | #5A4130 → #3B2C22 深木 | 同左 | 45611 |
| arena | #656B65 → #474B48 | #897864 → #615547 | 0 |
延展区与图内掩膜：不可走（rebuild 标障碍）、不可点（clickWorld 返回 "outside"）；不出现纯黑、米色。

## 5. 顺带修的问题
- 第五章找赤老三对质会误进擂台兜底对白 CF_idle（M14 及更早版本同样存在，主线卡死）：data/dialogue.js 合并时给无条件的 CF_ 节点加 `if: c6_arrived`。
- 任务条 / 任务面板章号差一（第三章显示成「第四章」）：story.js 改用「〇一二三四五六七」取字。
- 出生点挨着非目标物件时（如第三章船甲板）原来会把所有名牌藏起来：现在只藏其他名牌，当前目标名牌照样显示；挨着的正好是目标时仍按 M14 让位给「交谈」钮。

## 6. 仍是旧画风的清单
- 场景底图：0 张（火锅店 / 战斗 / 大地图 M12 起已是平涂，第二～六章本版全部换成 *_flat）。
- 仍是旧画风的非底图素材：各章 NPC 立绘（npc_labupa、npc_laobanniang、npc_hongtang、npc_chuanniang、npc_tiesuanpan、npc_tongzi、npc_jiaonong、npc_madawang、npc_chilaosan、npc_judge）、夜市三个摊位 prop_stall_1/2/3、结局 CG cg_ending.png。

## 进度记录
- 2026-10-19 17:12 已完成：复制改名、覆盖表、新图接入（5 底图 + 2 锅、锚点 340/869、374/846）、逐章叠图核对、延展层重取色、名牌/任务面板套到 2–6 章、主线机器人跑通 c2→c6（196s）、修 CF_idle 卡关与章号；全量自测进行中
- 2026-10-19 17:11 用户锁定 art/ch7 七张平涂图（基线 470 行）；md5sum -c 470 个全过；game-m15/assets 里 7 张副本与原件逐字节一致；自测 md5 用例改为按基线实际行数
- 2026-10-19 17:18 全量自测第 1 轮 586/587（唯一失败 = 旧写死 463 行的 md5 用例，文件本身 0 处不符）；已改用例，开第 2 轮全量
- 2026-10-19 17:19 publish.sh 加 M15（待验收置顶）、M14 改已锁定；DRY 运行：安全扫描 / 路径大小写通过，site/m13、site/m14 无改动；verify_online.py 已加 M15 用例与 /m13/、/m14/ 逐字节比对
- 2026-10-19 17:30 全量自测第 2 轮 587/587 全过；截图 m15_ch{2..6}_{4 机型}、m15_chapters_overview、m15_flat_before_after 已出
- 2026-10-19 17:30 打包 /workspace/game-m15.zip（273 个文件、232MB，只带本轮 M15 截图，不含 __pycache__）
- 2026-10-19 17:30 已用 publish.sh 发布（提交「M15 新画风 + 新界面套到第二～六章；M14 标已锁定」），等 Pages 构建后跑 verify_online.py
- 2026-10-19 17:36 verify_online.py 147/147 通过（含 /m13/、/m14/ 逐字节未变、M15 十个章节×机型抽检）；md5sum -c 470 个全过；全部完成
- 2026-10-19 17:45 锅显示宽度微调：data/art_override.js 加 dispScale（红汤大鼎 ×0.95、天下第一锅 ×0.88；锚点 340/869、374/846 与图片不动），game.js 绘制与点击判定同乘；擂台巨锅点击热区跟新锅图重标 x 680→744（原热区只有 69% 落在锅图内）；第 5–6 章四机型场景 114/114、主线 ch5→ch6 终幕 73s 0 报错、md5 470 全过；截图 screenshots/m15_pots_fix.png
- 2026-10-19 17:45 重打 /workspace/game-m15.zip；接着 publish.sh 发布 + verify_online.py
- 2026-10-19 17:55 锅微调已发布；verify_online.py 第一轮 145/148（m12 一张图线上返回 503 + m11 HUD 用例连带失败，本次未改 m11/m12），重跑 148/148 全过，/m13/、/m14/ 逐字节未变

## 7. M15 战斗打击感 + 武侠夜色战斗界面（2026-10-20）
范围：只做界面与特效，不做 A/B/C 玩法加深、不做 2 倍速 / 自动战斗；战斗背景新图等设计 Bot。

### 打击感（独立模块 `js/battle_fx.js`，纯代码不生图）
| 特效 | 实现 |
|---|---|
| 受击闪白 | 白色剪影叠在受击单位上，真实时间约 100ms（CFG.flash） |
| 伤害飘字 | 普通 #FFE3C2/#7A1A10；暴击 ×1.5 +「暴」朱印 #F0D79A；治疗 #BFF0C0/#1F4F2A；闪避灰白斜体；招式名金字横幅 |
| 震屏 | 普通 7px / 暴击 18px，指数衰减；`prefers-reduced-motion` 只留 25% |
| 出招残影 | 冲刺时留 2–4 个朱金色半透明残影（减弱动效时 ≤2） |
| 暴击顿帧 | hit-stop 约 80ms（CFG.hitStop），画面定格、闪白仍走完 |

`js/battle.js` 只调 BattleFX 接口；`index.html` 在 battle.js 之前加载 battle_fx.js。

### 武侠夜色战斗界面
- `css/ui_battle_wuxia.css` 从 `art/ui_wuxia/battle/` 复制（md5 一致），紧跟 `fill_m13.css` 引入。
- 画布四处（README）：敌人名牌深墨金边 + 朱红渐变血条；当前行动金圈 / 可选目标朱红闪圈；擂台线 `rgba(201,164,92,.28)`；竖屏收紧 bview.safe、上下用 #3B2C22 / rgba(20,23,32,.9) 延展。

### 自测 / 截图
- `tools/selftest_m15_fx.py`：49/49（四机型闪白·飘字·震屏·残影·顿帧·减弱动效·性能·打完流程 + 界面接入断言）。
- 截图：`screenshots/m15_fx_{ghost,crit}_{land,port}_iphone.png`、`m15_fx_miss_port_iphone.png`、`m15_fx_ui_{land,port}.png`。

- $(date '+%Y-%m-%d %H:%M') 战斗打击感五件套 + ui_battle_wuxia.css + README 四处画布改动完成；自测 49/49；基线 md5 470 全过；接着 zip / publish / verify
- 2026-10-20 09:48 战斗打击感五件套 + ui_battle_wuxia.css + README 四处画布改动完成；自测 49/49；基线 md5 470 全过；接着 zip / publish / verify
- 2026-10-20 09:48 已 publish（打击感 + 武侠夜色战斗界面）；等待 Pages 后跑 verify_online.py
- 2026-10-20 09:51 接入战斗背景 bg_battle_duel_flat.png（覆盖表，未动锁定 bg_battle_flat）；打击感自测 52/52；接着 zip/publish/verify
- 2026-10-20 09:51 已 publish（含 duel 背景）；等 Pages 后 verify
- 2026-10-20 10:03 verify_online.py 151/151 全过（含 /m13/ /m14/ 未变、duel 背景、打击感冒烟）；基线 md5 470 全过；战斗返工第一步完成
- 2026-10-20 11:07 竖屏镜头留白：bview 加 guardOrderGap（最高单位含名牌上沿距出手顺序条底 ≥40 舞台 px，不够自动下让），6 机型实测最小 386.7；五场章节战斗删 bg/bgFallback 统一走对峙图 bg_battle_duel_flat（场景图保留供探索）；全量自测 672/672（分两批），对比图 m15_ch_battles_duel.png；接着 zip/publish/verify
