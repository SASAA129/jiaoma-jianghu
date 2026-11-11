// 角色配置（手改这里即可，刷新生效）：
// spriteScale = 所有人物/NPC 共用的统一缩放系数：1 个原图像素 → 多少世界像素（世界 = bg_room 1536x1024 坐标）。
//   美术已把身高差烘焙进原图（小满 100%、胖弟 ≈93%、满掌柜 ≈92%、飞飞 ≈88%，脚底同一线），
//   所以所有角色必须用同一个系数，按原图像素比例缩放，不做各自归一化。
// heightMul   = 每个角色的个别微调倍率，默认全为 1.0（只在需要单独修正时改）。背面图沿用同一角色的倍率。
// phHeight    = 缺图占位小人用的身高比例（相对小满），仅占位时生效。
// M9 rig：骨骼行走切分微调（见 SPEC.md）。false = 不切分，整图 + 上下颠（长杆/长勺穿过切线的角色）。
//   armSwingL/R：画面左/右臂摆幅倍率（拿着道具的手设 0）；front/back 可分别覆盖；headTurn：头部摆动倍率；neck/hip：切线比例。
// M10：front/back 可单独设 false（该视角整图 + 起伏）；headTurn 也可按视角覆盖。飞飞背面长袍运行时切开会分叉 → back:false；胖弟背面勺头在头部块 → back.headTurn:0。
window.CHARACTERS = {
  "spriteScale": 0.205,
  "list": {
    "xiaoman":  { "name": "小满",   "sprite": "char_xiaoman", "back": "char_xiaoman_back", "heightMul": 1.0, "phHeight": 1.00, "color": "#3b3a44", "hp": [920, 1000],  "mp": [610, 800], "rig": {} },
    "feifei":   { "name": "飞飞",   "sprite": "char_feifei",  "back": "char_feifei_back",  "heightMul": 1.0, "phHeight": 0.88, "color": "#2f3a40", "hp": [760, 900],   "mp": [880, 900], "rig": { "back": false } },
    "pangdi":   { "name": "胖弟",   "sprite": "char_pangdi",  "back": "char_pangdi_back",  "heightMul": 1.0, "phHeight": 0.93, "color": "#4a4f5c", "hp": [1200, 1300], "mp": [300, 500], "rig": { "front": { "armSwingL": 0 }, "back": { "armSwingR": 0, "headTurn": 0 } } },
    "zhanggui": { "name": "满掌柜", "sprite": "npc_zhanggui", "back": null,                "heightMul": 1.0, "phHeight": 0.92, "color": "#7a5a3a", "rig": { "armSwingR": 0 } },
    "labupa":   { "name": "辣不怕", "sprite": "npc_labupa",   "back": null,                "heightMul": 1.0, "phHeight": 0.95, "color": "#8e1d14", "rig": {} },
    "tongzi":   { "name": "辣椒童子", "sprite": "npc_tongzi", "back": null,                "heightMul": 1.0, "phHeight": 0.72, "color": "#c0452f", "rig": {} },
    "laobanniang": { "name": "茶馆老板娘", "sprite": "npc_laobanniang", "back": null,      "heightMul": 1.0, "phHeight": 0.90, "color": "#3f6b5a", "rig": {} },
    "hongtang": { "name": "红汤帮打手", "sprite": "npc_hongtang", "back": null,            "heightMul": 1.0, "phHeight": 1.02, "color": "#a3221a", "rig": false },
    "chuanniang": { "name": "阿篙", "sprite": "npc_chuanniang", "back": null,          "heightMul": 1.0, "phHeight": 0.88, "color": "#2a6f7a", "rig": false },
    "tiesuanpan": { "name": "铁算盘", "sprite": "npc_tiesuanpan", "back": null,            "heightMul": 1.0, "phHeight": 0.96, "color": "#6b2a1a", "rig": { "armSwingL": 0 } },
    "jiaonong": { "name": "老椒农", "sprite": "npc_jiaonong", "back": null,              "heightMul": 1.0, "phHeight": 0.85, "color": "#5a6b2a", "rig": false },
    "madawang": { "name": "麻大王", "sprite": "npc_madawang", "back": null,              "heightMul": 1.0, "phHeight": 1.05, "color": "#8a3a1a", "rig": { "headTurn": 0, "armSwingL": 0 } },
    "chilaosan": { "name": "赤老三", "sprite": "npc_chilaosan", "back": null,            "heightMul": 1.0, "phHeight": 1.00, "color": "#a01818", "rig": { "armSwingL": 0 } },
    "judge": { "name": "老评委", "sprite": "npc_judge", "back": null,                  "heightMul": 1.0, "phHeight": 0.86, "color": "#5a4a2a", "rig": {} }
  },
  "party": ["xiaoman", "feifei", "pangdi"]
};
