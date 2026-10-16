// 《椒麻江湖》M3 回合制战斗数据（数据驱动；数值为程序员 Bot 起草的草稿，策划可直接改）。
// 属性：hp 气血、mp 内力、spd 身法（每回合按身法从高到低出手，同值我方优先）、atk 攻、def 防。
// 伤害 = max(1, round(攻 × 倍率 × 随机(0.9~1.1) − 防 × 0.5))；防御状态下受到伤害减半，直到自己下次行动。
// 立绘：sprite 有图用图（facing 写原图朝向，引擎自动翻转成面朝我方）（与我方同一 spriteScale 缩放），没图自动用代码占位小人（phHeight 为相对小满的身高）。
// 撤退：成功率 fleeChance（默认 50%），成功→结算“撤退”回地图；失败→本回合行动作废（飘字“撤退失败”）。
window.BATTLE = {
  "fleeChance": 0.5,
  "party": {
    "xiaoman": { "hp": 1000, "mp": 800, "spd": 12, "atk": 120, "def": 60, "skills": ["jiaomazhang", "jiahui"] },
    "feifei":  { "hp": 900,  "mp": 900, "spd": 16, "atk": 105, "def": 45, "skills": ["liangfeng", "qingfeng"] },
    "pangdi":  { "hp": 1300, "mp": 500, "spd": 9,  "atk": 135, "def": 80, "skills": ["yiguoduan"] }
  },
  "enemies": {
    "labupa":  { "name": "辣不怕",   "hp": 2600, "mp": 600, "spd": 14, "atk": 125, "def": 55, "color": "#8e1d14", "phHeight": 0.95,
                 "skills": ["huoguoquan", "layoupomo"], "sprite": "npc_labupa", "facing": "right" },
    "tongzi":  { "name": "辣椒童子", "hp": 800,  "mp": 200, "spd": 11, "atk": 80,  "def": 30, "color": "#c0452f", "phHeight": 0.72,
                 "skills": ["lajiaofen"], "sprite": "npc_tongzi", "facing": "right" }
  },
  "skills": {
    "jiaomazhang": { "name": "家传椒麻掌", "mp": 120, "target": "enemy", "power": 1.8, "desc": "单体重击" },
    "jiahui":      { "name": "家徽·定心",  "mp": 100, "target": "self",  "heal": 280, "desc": "回复自身气血" },
    "liangfeng":   { "name": "折扇·凉风扫", "mp": 150, "target": "allEnemies", "power": 1.1, "desc": "扇击全体敌人" },
    "qingfeng":    { "name": "清风解辣",   "mp": 120, "target": "ally",  "heal": 300, "desc": "为一名同伴回复气血" },
    "yiguoduan":   { "name": "大勺·一锅端", "mp": 100, "target": "enemy", "power": 1.6, "desc": "单体重击" },
    "huoguoquan":  { "name": "十成椒麻·火锅拳", "mp": 150, "target": "enemy", "power": 1.7 },
    "layoupomo":   { "name": "辣油泼墨",   "mp": 120, "target": "allParty", "power": 0.8 },
    "lajiaofen":   { "name": "辣椒粉迷眼", "mp": 60,  "target": "enemy", "power": 1.3 }
  },
  "items": {
    "liangcha": { "name": "凉茶", "icon": "icon_liangcha", "count": 3, "target": "ally", "hp": 300, "desc": "回复 300 气血" },
    "bingfen":  { "name": "冰粉", "icon": "icon_bingfen", "count": 2, "target": "ally", "mp": 200, "desc": "回复 200 内力" }
  },
  "battles": {
    "labupa": {
      "title": "江湖食客的吃辣挑战 · 招牌下决战",
      "enemies": ["labupa", "tongzi"],
      "win":  { "set": ["battle_B_win"], "title": "胜", "lines": ["辣不怕捂着嘴连喝三碗凉茶：“服了！锦囊还你们！”", "飞飞收起折扇：“承让。”"], "reward": "获得「秘方锦囊」 · 称号【辣不倒】" },
      "lose": { "set": ["battle_B_lose"], "title": "败", "lines": ["三人被辣得眼泪直流，辣不怕哈哈大笑：“明晚再来！”"], "reward": "可以回到招牌下再战" },
      "flee": { "set": ["battle_B_fled"], "title": "撤", "lines": ["三人捂着嘴冲回店里猛灌凉茶……这一战，改日再比。"], "reward": "可以回到招牌下再战" }
    }
  }
};
