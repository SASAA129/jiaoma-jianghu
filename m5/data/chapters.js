// 《椒麻江湖》章节附属数据：背包道具、称号、成就、江湖志线索、新菜卡、终幕卡。数据驱动，策划可直接改文字。
// 条件写法同对白：if（全部为真）/ ifNot（任一为真则不满足）/ ifAny（任一为真即可）。
// icon：素材名（assets 里有图就用图，没有就用 glyph 字画一个圆章）；flip：图标水平翻转（另一半方子复用半张方子的图）。
window.CHAPTERS = {
  "items": [
    { "id": "lingpai", "name": "满家家徽令牌", "glyph": "徽", "desc": "小满随身带着的铜令牌，刻着满家家徽。" },
    { "id": "jinnang", "name": "秘方锦囊", "glyph": "囊", "ifAny": ["end_A", "end_C", "battle_B_win", "ch1_done"], "desc": "红布锦囊，熏得满是椒麻香。" },
    { "id": "zhantie", "name": "辣不怕的战帖", "glyph": "帖", "if": ["end_B"], "desc": "“能吃下十成椒麻者，锦囊奉还。——辣不怕”" },
    { "id": "recipe_half", "name": "半张方子", "icon": "icon_recipe_half", "glyph": "半", "if": ["ch1_done"], "ifNot": ["c2_combined"],
      "desc": "锦囊里只有半张方子，背面写着“渝州·老码头”。" },
    { "id": "recipe_other", "name": "另一半方子", "icon": "icon_recipe_half", "flip": true, "glyph": "半", "if": ["c2_got_half"], "ifNot": ["c2_combined"],
      "desc": "茶馆老板娘守了二十年的另一半。" },
    { "id": "recipe_full", "name": "完整的椒麻秘方", "icon": "icon_recipe_full", "glyph": "方", "if": ["c2_combined"],
      "desc": "两半合璧的满家椒麻秘方。对着灯看，背面似乎还有墨痕。" },
    { "id": "dish", "name": "新菜谱 · 十成椒麻秘制鸡", "glyph": "菜", "if": ["c2_dish"], "desc": "照完整秘方做出的新菜，已上了店里的菜单。" },
    { "id": "treasure_map", "name": "方子背面的藏宝图", "icon": "icon_treasure_map", "glyph": "图", "if": ["c2_finale"], "desc": "江流、山峦，和巫山脚下一个朱砂小圈。" },
    { "id": "iron_box", "name": "锈铁盒", "glyph": "盒", "if": ["item_iron_box"], "ifNot": ["c3_got_pepper"], "desc": "锁扣刻着半个满家家徽，江底捞起。" },
    { "id": "golden_pepper", "name": "金花椒", "icon": "icon_golden_pepper", "glyph": "金", "if": ["c3_got_pepper"], "desc": "丝绒托上的金色花椒，纸条写着：椒源在麻婆岭。" },
    { "id": "liangcha", "name": "凉茶", "icon": "icon_liangcha", "glyph": "茶", "count": 3, "desc": "战斗用：回复 300 气血（每场战斗前自动补满）。" },
    { "id": "bingfen", "name": "冰粉", "icon": "icon_bingfen", "glyph": "冰", "count": 2, "desc": "战斗用：回复 200 内力（每场战斗前自动补满）。" }
  ],

  "clues": [
    { "if": ["heard_jinnang"], "text": "满家祖传三代的秘方锦囊，一夜之间不见了。" },
    { "if": ["ch1_done"], "text": "锦囊里只有半张方子，背面写着“渝州·老码头”。爷爷当年和一位故人一人一半。" },
    { "if": ["clue_1"], "text": "【线索一】古玩摊老周：当年当铜牌的是个梳圆髻的姑娘——故人是位女子。" },
    { "if": ["clue_2"], "text": "【线索二】灯谜摊钱先生：那姑娘爱喝老鹰茶，在江边支过茶摊，后来成了茶馆。" },
    { "if": ["clue_3"], "text": "【线索三】辣不怕：每晚有人提着铜茶壶来买椒麻鸡，“给老朋友留着”。" },
    { "if": ["c2_deduced"], "text": "推理：爷爷的故人，就是码头茶馆的老板娘。红汤帮也在打那半张方子的主意。" },
    { "if": ["c2_combined"], "text": "两半方子合璧。老板娘说：“椒麻要配茶，方子要配人。”" },
    { "if": ["c2_finale"], "text": "方子背面藏着一张图：朱砂圈画在巫山脚下。" },
    { "if": ["c3_arrived"], "text": "雾江古渡。船娘阿篙说，满家的人免费送——但要办完三桩事。" },
    { "if": ["c3_e1_done"], "text": "【雾江·星】认准北斗缺口，船头朝东北偏东，避开乱礁。" },
    { "if": ["c3_e2_done"], "text": "【雾江·歌】与阿篙对上三句山歌，船资算清。" },
    { "if": ["c3_e3_done"], "text": "【雾江·网】江底捞起锈铁盒，锁扣刻着半个满家家徽。" },
    { "if": ["c3_ts_win"], "text": "打退红汤帮二当家铁算盘。他撂下话：麻婆岭见。" },
    { "if": ["c3_got_pepper"], "text": "铁盒里有一颗金花椒，纸条写着：“椒源在麻婆岭”。" }
  ],

  "titles": [
    { "name": "家徽传人",   "if": ["end_A"],        "desc": "小满线 · 解开家徽机关" },
    { "name": "以扇扇辣",   "if": ["end_B"],        "desc": "飞飞线 · 接下吃辣战帖" },
    { "name": "后厨守护者", "if": ["end_C"],        "desc": "胖弟线 · 抓住偷锦囊的黄猫" },
    { "name": "辣不倒",     "if": ["battle_B_win"], "desc": "招牌下赢了辣不怕" },
    { "name": "认徽有眼",   "if": ["c2_e1_done"],   "desc": "古玩摊认出真家徽" },
    { "name": "灯下舌战",   "if": ["c2_e2_done"],   "desc": "连赢钱先生三阵" },
    { "name": "码头颠勺王", "if": ["c2_e3_done"],   "desc": "帮辣不怕颠出十成辣子鸡" },
    { "name": "红汤克星",   "if": ["c2_ht_win"],    "desc": "打退红汤帮打手" },
    { "name": "秘方传人",   "if": ["c2_finale"],    "desc": "合璧椒麻秘方，解锁新菜" },
    { "name": "雾江识途",   "if": ["c3_e1_done"],   "desc": "桅杆下认出北斗缺口" },
    { "name": "船头歌者",   "if": ["c3_e2_done"],   "desc": "与阿篙对上三句山歌" },
    { "name": "江底捞手",   "if": ["c3_e3_done"],   "desc": "一网捞起满家锈铁盒" },
    { "name": "算盘克星",   "if": ["c3_ts_win"],    "desc": "雾江上打退铁算盘" },
    { "name": "金椒在手",   "if": ["c3_got_pepper"], "desc": "打开铁盒，得金花椒" }
  ],

  "achievements": [
    { "name": "吃货本色",   "if": ["ate_hotpot"],      "desc": "正事之前，先尝一口火锅" },
    { "name": "化敌为友",   "if": ["c2_met_labupa"],   "desc": "辣不怕成了码头上的帮手" },
    { "name": "不打不相识", "if": ["battle_B_win"],    "desc": "在招牌下亲手赢下辣不怕" },
    { "name": "一眼认祖",   "if": ["c2_e1_perfect"],   "desc": "认家徽一次没认错" },
    { "name": "舌灿莲花",   "if": ["c2_e2_perfect"],   "desc": "比口才一句没答错" },
    { "name": "颠勺满分",   "if": ["c2_e3_perfect"],   "desc": "颠勺一次没失手" },
    { "name": "毫发无伤",   "if": ["c2_ht_flawless"],  "desc": "红汤帮一战，三人都没倒下" },
    { "name": "越挫越勇",   "ifAny": ["battle_B_lose", "c2_ht_lose"], "desc": "输过一场，还是回来打赢了" },
    { "name": "新菜上桌",   "if": ["c2_dish"],         "desc": "十成椒麻秘制鸡，上了店里的菜单" },
    { "name": "星不迷眼",   "if": ["c3_e1_perfect"],   "desc": "认星位一次没认错" },
    { "name": "歌不走调",   "if": ["c3_e2_perfect"],   "desc": "对山歌一句没答错" },
    { "name": "网不落空",   "if": ["c3_e3_perfect"],   "desc": "下网一次没失手" },
    { "name": "雾中无伤",   "if": ["c3_ts_flawless"],  "desc": "铁算盘一战，三人都没倒下" },
    { "name": "夜渡抵达",   "if": ["c3_finale"],       "desc": "雾江夜渡，第三章完" }
  ],

  "dish": {
    "seal": "新菜解锁", "title": "十成椒麻 · 秘制鸡", "icon": "icon_recipe_full",
    "lines": ["青红二椒、汉源花椒、老鹰茶汤吊底——满家秘方，二十年后终于凑齐。",
              "满掌柜亲手掌勺，第一锅端上桌，整条街都闻得到。"],
    "reward": "店里菜单新增「十成椒麻·秘制鸡」"
  },

  "finale2": {
    "seal": "第二章完", "title": "第二章完 · 待续",
    "lines": ["半张方子，一段二十年的约定。椒麻要配茶，方子要配人。",
              "而方子背面那张藏宝图，正指向雾江上游……"],
    "next": "下一站 · 雾江古渡（店门 / 码头石阶可去）"
  },
  "finale": {
    "seal": "第三章完", "title": "第三章完 · 待续",
    "lines": ["雾锁江心，金花椒入手。纸条上三个字——麻婆岭。",
              "阿篙撑篙北上，红汤帮的阴影却比雾更浓……"],
    "next": "第四章 · 麻婆岭（敬请期待）"
  }
};
