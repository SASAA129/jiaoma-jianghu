# 《椒麻江湖》M9 美术对接规范 · 骨骼部件（rig.json）

程序版本：game-m9 起。没有这些文件时，游戏在运行时自动把整张立绘切成部件（占位方案），不会报错。

## 目录

```
art/ch7/rig/<角色id>/
  rig.json
  front_head.png  front_torso.png  front_arm_l.png  front_arm_r.png  front_leg_l.png  front_leg_r.png
  back_head.png   back_torso.png   ...（背面可选；缺背面则背面沿用运行时自动切分）
```

- `<角色id>` 与 `data/characters.js` 的 key 一致：`xiaoman`、`feifei`、`pangdi`、`zhanggui`、`labupa` …
- 部件 PNG：透明底，**与原立绘同一像素坐标系**（推荐每块都导出成和原图一样大的画布、只保留该部件像素；也可以只导出包围盒，然后用 `x/y` 写偏移）。
- 切口处请各留 2–4px 重叠，避免旋转时出缝。
- 左右以**画面**为准：`arm_l` = 画面左侧的手臂。

## rig.json 字段

```json
{
  "version": 1,
  "id": "xiaoman",
  "canvas": { "w": 1024, "h": 1536 },
  "foot": [512, 1500],
  "views": {
    "front": {
      "parts": [
        { "name": "leg_l",  "file": "front_leg_l.png",  "x": 0, "y": 0, "pivot": [470, 900],  "parent": "hip",   "z": 1 },
        { "name": "leg_r",  "file": "front_leg_r.png",  "x": 0, "y": 0, "pivot": [555, 900],  "parent": "hip",   "z": 1 },
        { "name": "torso",  "file": "front_torso.png",  "x": 0, "y": 0, "pivot": [512, 900],  "parent": "hip",   "z": 2 },
        { "name": "arm_l",  "file": "front_arm_l.png",  "x": 0, "y": 0, "pivot": [400, 470],  "parent": "torso", "z": 3 },
        { "name": "arm_r",  "file": "front_arm_r.png",  "x": 0, "y": 0, "pivot": [625, 470],  "parent": "torso", "z": 3 },
        { "name": "head",   "file": "front_head.png",   "x": 0, "y": 0, "pivot": [512, 420],  "parent": "torso", "z": 4 }
      ]
    },
    "back": { "parts": [ ... 同上，file 用 back_*.png ... ] }
  }
}
```

| 字段 | 必填 | 说明 |
|---|---|---|
| `version` | 是 | 固定 1 |
| `id` | 是 | 角色 id |
| `canvas.w/h` | 是 | 原立绘尺寸（所有坐标都在这个坐标系里） |
| `foot` | 否 | 脚底中心点；缺省用程序算的脚底锚点 |
| `views.front` / `views.back` | front 必填 | 正面 / 背面部件表 |
| `parts[].name` | 是 | 固定六个名字之一：`head` `torso` `arm_l` `arm_r` `leg_l` `leg_r` |
| `parts[].file` | 是 | 部件 PNG 文件名（与 rig.json 同目录） |
| `parts[].x/y` | 否 | 部件 PNG 左上角放在 canvas 的位置，缺省 0,0 |
| `parts[].pivot` | 是 | 关节点（canvas 坐标）：腿=髋关节、臂=肩、头=脖子根、躯干=髋中心 |
| `parts[].parent` | 是 | 父骨骼：`hip`（根）或 `torso` |
| `parts[].z` | 否 | 绘制层级，小的先画；缺省按 腿1 躯干2 臂3 头4 |

骨骼层级固定：`hip`（根，位于躯干 pivot）→ `torso` → `head`、`arm_l`、`arm_r`；`hip` → `leg_l`、`leg_r`。

## 程序如何读取

`tools/prep_assets.py` 会把 `art/ch7/rig/*/rig.json` 和部件 PNG 复制/裁切到 `game/assets/rig/<id>/`，并生成 `data/rig_data.js`（`window.RIG_DATA = {...}`），所以 file:// 也能用。原图不会被修改。

## 运行时占位（没有 rig.json 时）

按 `data/characters.js` 里每个角色的 `rig` 配置切分整张立绘（比例都相对“头顶→脚底”的身高）：

```js
"rig": { "neck": 0.17, "shoulder": 0.20, "hip": 0.53, "armW": 0.24, "armEnd": 0.62, "legSplit": 0.5, "overlap": 3 }
// 或 "rig": false   → 这个角色不切分，整图 + 上下颠
```

## 补充（M9 已实装，与 art/ch7/rig/xiaoman 交付件一致）
- 可选字段 `walk_hint` / `idle_hint` / `note`：程序不读，仅作说明；实际动画参数在游戏 `data/rig_anim.js`（RIG_ANIM，可按角色覆盖）。
  - 默认：walk 循环 600ms（基础速度；相位按位移推进，快走步频同比加快不滑步），腿 ±7°（按步幅最大 12°），空手臂 ±8°，起伏 6px，idle 呼吸 2px / 1800ms。
  - xiaoman：`arms: { armL: 3, armR: 8 }`（画面左侧握令牌的手臂只摆 ±3°）。
- 绘制顺序按 `z` 从小到大（小满：腿 → 躯干 → 空手臂 → 头 → 握令牌臂）；`parent: torso` 的部件随躯干摆动和呼吸，整个 hip 随起伏上下。
- 部件查找顺序：`art/ch7/rig/<id>/`（正式）→ `art/m9/rig/<id>/`（早期格式，prep 自动转换：canvas 数组→对象、角色自身左右→画面左右）→ 运行时自动切图。
- 某个视角缺失（如只交了 `views.front`），该视角用运行时切图；`characters.js` 中 `rig:false` 则整图 + 起伏。
- prep_assets 把部件按立绘 prepScale 预缩放后放到 `assets/rig/<id>/`，坐标按 `(p - trim) × prepScale` 换算，与整图像素对齐。


# 《椒麻江湖》M9 江湖地图规范（bg_worldmap.png + map.json）

## 文件

```
art/ch7/bg_worldmap.png   1536×1024，清爽画风，配色与锁定素材一致（暖橙红、木色、江水蓝绿），斜 45° 渝州全图感
art/ch7/map.json          六个地点坐标
```

没有 `bg_worldmap.png` 时，游戏用代码画占位地图；没有 `map.json` 时用程序内置坐标（`data/worldmap.js`）。

## map.json 字段

```json
{
  "version": 1,
  "image": "bg_worldmap.png",
  "size": { "w": 1536, "h": 1024 },
  "nodes": [
    { "id": "shop",    "name": "满记火锅店",     "x": 360,  "y": 640 },
    { "id": "market",  "name": "老码头夜市",     "x": 560,  "y": 760 },
    { "id": "river",   "name": "雾江古渡",       "x": 820,  "y": 600 },
    { "id": "village", "name": "麻婆岭花椒寨",   "x": 1180, "y": 300 },
    { "id": "hq",      "name": "红汤总舵",       "x": 600,  "y": 420 },
    { "id": "arena",   "name": "天下第一锅擂台", "x": 860,  "y": 330 }
  ],
  "routes": [["shop","market"],["market","river"],["river","village"],["village","hq"],["hq","arena"]]
}
```

| 字段 | 必填 | 说明 |
|---|---|---|
| `nodes[].id` | 是 | 必须是场景 id 之一：`shop` `market` `river` `village` `hq` `arena` |
| `nodes[].name` | 否 | 显示名，缺省用程序内置名 |
| `nodes[].x/y` | 是 | 节点中心，图片像素坐标（1536×1024） |
| `nodes[].label` | 否 | `[dx, dy]` 名字标签相对节点的偏移，缺省在节点下方 |
| `routes` | 否 | 路线虚线（节点 id 两两相连），缺省按章节顺序连 |

解锁规则、当前位置、当前目标标记、快速旅行入口格都在程序里，不需要美术管。

## 程序如何读取

`tools/prep_assets.py` 把 `map.json` 转成 `data/worldmap_art.js`（`window.WORLDMAP_ART = {...}`），把 `bg_worldmap.png` 复制为 `assets/bg_worldmap.png`，file:// 也能用。
