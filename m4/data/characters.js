// 角色配置（手改这里即可，刷新生效）：
// spriteScale = 所有人物/NPC 共用的统一缩放系数：1 个原图像素 → 多少世界像素（世界 = bg_room 1536x1024 坐标）。
//   美术已把身高差烘焙进原图（小满 100%、胖弟 ≈93%、满掌柜 ≈92%、飞飞 ≈88%，脚底同一线），
//   所以所有角色必须用同一个系数，按原图像素比例缩放，不做各自归一化。
// heightMul   = 每个角色的个别微调倍率，默认全为 1.0（只在需要单独修正时改）。背面图沿用同一角色的倍率。
// phHeight    = 缺图占位小人用的身高比例（相对小满），仅占位时生效。
window.CHARACTERS = {
  "spriteScale": 0.205,
  "list": {
    "xiaoman":  { "name": "小满",   "sprite": "char_xiaoman", "back": "char_xiaoman_back", "heightMul": 1.0, "phHeight": 1.00, "color": "#3b3a44", "hp": [920, 1000],  "mp": [610, 800] },
    "feifei":   { "name": "飞飞",   "sprite": "char_feifei",  "back": "char_feifei_back",  "heightMul": 1.0, "phHeight": 0.88, "color": "#2f3a40", "hp": [760, 900],   "mp": [880, 900] },
    "pangdi":   { "name": "胖弟",   "sprite": "char_pangdi",  "back": "char_pangdi_back",  "heightMul": 1.0, "phHeight": 0.93, "color": "#4a4f5c", "hp": [1200, 1300], "mp": [300, 500] },
    "zhanggui": { "name": "满掌柜", "sprite": "npc_zhanggui", "back": null,                "heightMul": 1.0, "phHeight": 0.92, "color": "#7a5a3a" },
    "labupa":   { "name": "辣不怕", "sprite": "npc_labupa",   "back": null,                "heightMul": 1.0, "phHeight": 0.95, "color": "#8e1d14" },
    "tongzi":   { "name": "辣椒童子", "sprite": "npc_tongzi", "back": null,                "heightMul": 1.0, "phHeight": 0.72, "color": "#c0452f" },
    "laobanniang": { "name": "茶馆老板娘", "sprite": "npc_laobanniang", "back": null,      "heightMul": 1.0, "phHeight": 0.90, "color": "#3f6b5a" },
    "hongtang": { "name": "红汤帮打手", "sprite": "npc_hongtang", "back": null,            "heightMul": 1.0, "phHeight": 1.02, "color": "#a3221a" }
  },
  "party": ["xiaoman", "feifei", "pangdi"]
};
