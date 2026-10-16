// 《椒麻江湖》对白数据（数据驱动，逻辑里不写死台词）
// ※ 第一～四章对白都是程序员 Bot 起草的【草稿】，游戏设计 Bot / 策划可直接改这个文件里的文字，不用动代码。
//
// 节点字段：speaker 说话人 id；text 文本；next 下一节点；options 选项（2~3 个，可写 if/ifNot/set/clear/do/next/doneFlag）；
//   if / ifNot：触发条件 flag 数组（不满足时跳到 else 节点，没有 else 就结束）；
//   set / clear：进入该节点时设置 / 清除的 flag；
//   do：剧情指令数组（对话关掉后按顺序执行，见 js/story.js）：
//     {"route":"A"} 开始某条线并切队长；{"ending":"A"} 弹结局卡；{"leader":"feifei"} 切队长；{"battle":"labupa"} 进入战斗；
//     {"title":"ch2"} 章节标题卡；{"minigame":"emblem","win":"节点","quit":"节点"} 小玩法（emblem 认家徽 / duel 比口才 / wok 颠勺 / combine 合成秘方）；
//     {"gain":"recipe_half"} 获得道具提示（道具定义见 data/chapters.js）；{"card":"dish","then":"节点"} 新菜卡；{"finale":true} 终幕卡；
//     {"open":"节点"} 对话结束后立刻接着开另一段对话。
//   选项 doneFlag：该 flag 为真时在选项上盖“已完”印章。
// entries：交互点 → 动作(any 交谈和查看都先查这里 / talk 交谈 / look 查看) → 候选起始节点，按顺序取第一个条件满足的。
// routes：三条线的元数据和目标（探索面板按 stages 顺序显示第一个 until 未达成的目标）。
// endings：结局卡内容。
// sceneEnter：第一次进入某场景时自动播放的对白；chapter2.stages：第二章目标（scene 为目标所在场景，不在该场景时自动指向出口）。
// 所有 flag 都会存进 localStorage（键 jiaoma_jianghu_m6），刷新后恢复。
window.DIALOGUE = {
  "speakers": {
    "xiaoman":  { "name": "小满",   "sprite": "char_xiaoman" },
    "feifei":   { "name": "飞飞",   "sprite": "char_feifei" },
    "pangdi":   { "name": "胖弟",   "sprite": "char_pangdi" },
    "zhanggui": { "name": "满掌柜", "sprite": "npc_zhanggui" },
    "labupa":   { "name": "辣不怕", "sprite": "npc_labupa", "color": "#8e1d14" },
    "tongzi":   { "name": "辣椒童子", "sprite": "npc_tongzi", "color": "#c0452f" },
    "laobanniang": { "name": "茶馆老板娘", "sprite": "npc_laobanniang", "color": "#3f6b5a" },
    "hongtang": { "name": "红汤帮打手", "sprite": "npc_hongtang", "color": "#a3221a" },
    "laozhou":  { "name": "老周（古玩摊主）", "color": "#6b5a3a", "initial": "周" },
    "qian":     { "name": "钱先生（灯谜摊主）", "color": "#2f4f7a", "initial": "钱" },
    "narrator": { "name": "旁白" }
  },

  "routes": {
    "A": { "name": "家徽之谜", "short": "家徽之谜", "hero": "xiaoman", "heroName": "小满",
      "stages": [
        { "until": "A_2",   "text": "招牌左下角好像刻着什么——去看看“椒麻鸡火锅”招牌", "target": "sign" },
        { "until": "A_3",   "text": "“锦囊在暖处，日日翻滚”——去火锅桌找找", "target": "table" },
        { "until": "end_A", "text": "把找到的锦囊交还满掌柜", "target": "zhanggui" }
      ] },
    "B": { "name": "江湖食客的吃辣挑战", "short": "吃辣挑战", "hero": "feifei", "heroName": "飞飞",
      "stages": [
        { "until": "B_2",   "text": "食客在火锅桌留了战帖——去火锅桌看看", "target": "table" },
        { "until": "B_3",   "text": "到招牌底下喊话，接下战帖", "target": "sign" },
        { "until": "end_B", "text": "回禀满掌柜", "target": "zhanggui" }
      ] },
    "C": { "name": "后厨异响", "short": "后厨异响", "hero": "pangdi", "heroName": "胖弟",
      "stages": [
        { "until": "C_2",   "text": "去后厨门帘那儿听听动静", "target": "kitchen" },
        { "until": "C_3",   "text": "黄猫钻到火锅桌底下了——去火锅桌堵它", "target": "table" },
        { "until": "end_C", "text": "把锦囊交还满掌柜", "target": "zhanggui" }
      ] }
  },

  "postObjectives": [
    { "if": ["end_B"], "ifNot": ["battle_B_win", "ch1_done", "route_A", "route_B", "route_C"], "text": "戌时三刻——到“椒麻鸡火锅”招牌下迎战辣不怕，赢回锦囊", "target": "sign" },
    { "if": ["battle_B_win"], "ifNot": ["ch1_done"], "text": "锦囊赢回来了——交给满掌柜，当面打开", "target": "zhanggui" },
    { "if": ["end_A"], "ifNot": ["ch1_done"], "text": "锦囊找到了——交给满掌柜，当面打开", "target": "zhanggui" },
    { "if": ["end_C"], "ifNot": ["ch1_done"], "text": "锦囊找到了——交给满掌柜，当面打开", "target": "zhanggui" }
  ],

  "chapters": {
    "ch1": { "seal": "第一章", "title": "锦囊失踪记", "sub": "祖传三代的秘方锦囊，一夜之间不见了。" },
    "ch2": { "seal": "第二章", "title": "锦囊里的半张方子", "sub": "半张方子，一句“渝州·老码头”，和一位二十年前的故人。" }
  },

  "sceneEnter": [
    { "scene": "market", "node": "MK_1", "ifNot": ["c2_arrived"] }
  ],

  "chapter2": {
    "name": "锦囊里的半张方子",
    "stages": [
      { "until": "c2_arrived",    "scene": "shop",   "text": "走出店门，去渝州·老码头", "target": "door" },
      { "until": "c2_met_labupa", "scene": "market", "text": "炒锅摊那边有人扯着嗓子吆喝——去看看", "target": "labupa" },
      { "until": "c2_clues",      "scene": "market", "text": "完成三位摊主的小委托，打听“故人”的下落", "checklist": [
          { "flag": "c2_e1_done", "text": "古玩摊 · 小满认家徽", "target": "stall_1", "hero": "小满" },
          { "flag": "c2_e2_done", "text": "灯谜摊 · 飞飞比口才", "target": "stall_2", "hero": "飞飞" },
          { "flag": "c2_e3_done", "text": "炒锅摊 · 胖弟帮颠勺", "target": "stall_3", "hero": "胖弟" } ] },
      { "until": "c2_deduced",    "scene": "market", "text": "三条线索都齐了——找辣不怕合计合计，故人到底是谁", "target": "labupa" },
      { "until": "c2_ht_win",     "scene": "market", "text": "红汤帮打手堵在茶馆门口——上前交涉（打不过可以再来）", "target": "hongtang_a" },
      { "until": "c2_combined",   "scene": "market", "text": "去码头茶馆找老板娘", "target": "laobanniang" },
      { "until": "c2_dish",       "scene": "shop",   "text": "带着完整的椒麻秘方回火锅店，交给满掌柜", "target": "zhanggui" },
      { "until": "c2_finale",     "scene": "shop",   "text": "满掌柜好像还有话要说", "target": "zhanggui" }
    ],
    "done": "第二章完 · 待续。可以四处逛逛，也可以回主菜单开一局新游戏。"
  },

  "endings": {
    "A": { "title": "家徽之谜", "hero": "char_xiaoman",
      "lines": ["锦囊根本没丢——那是满家祖传的考题，只有带着家徽的人才打得开招牌后的机关。",
                "小满一言不发地把锦囊收进怀里。满掌柜偷偷抹了把眼角：“第四代，稳了。”"],
      "reward": "获得称号【家徽传人】 · 道具「熏香的秘方锦囊」", "next": "M_1", "nextLabel": "当面打开锦囊" },
    "B": { "title": "江湖食客的吃辣挑战", "hero": "char_feifei", "m3": true,
      "lines": ["江湖食客“辣不怕”应下了战约：明晚戌时三刻，十成椒麻，一决胜负。",
                "飞飞合上折扇，推了推眼镜：“锦囊，我会亲手拿回来。”胖弟已经在偷偷练习吸气了。"],
      "reward": "获得称号【以扇扇辣】 · 道具「辣不怕的战帖」", "m3Label": "现在就去招牌下迎战", "laterLabel": "先准备一下" },
    "C": { "title": "后厨异响", "hero": "char_pangdi",
      "lines": ["锦囊失踪案告破：凶手是店里的黄猫“椒椒”，被锦囊上的卤香勾了魂。",
                "胖弟一勺定乾坤，从此后厨的老鼠都绕着他走。"],
      "reward": "获得称号【后厨守护者】 · 道具「沾着卤汁的锦囊」", "next": "M_1", "nextLabel": "当面打开锦囊" }
  },

  "entries": {
    "sign": {
      "any": [
        { "node": "A2_1", "if": ["route_A", "A_1"], "ifNot": ["A_2"] },
        { "node": "B3_1", "if": ["route_B", "B_2"], "ifNot": ["B_3"] },
        { "node": "B5_1", "if": ["end_B"], "ifNot": ["battle_B_win", "ch1_done", "route_A", "route_B", "route_C"] }
      ],
      "look": [ { "node": "sign_look" } ],
      "talk": [ { "node": "sign_talk" } ]
    },
    "table": {
      "any": [
        { "node": "A3_1", "if": ["route_A", "A_2"], "ifNot": ["A_3"] },
        { "node": "B2_1", "if": ["route_B", "B_1"], "ifNot": ["B_2"] },
        { "node": "C3_1", "if": ["route_C", "C_2"], "ifNot": ["C_3"] }
      ],
      "look": [
        { "node": "table_after_eat", "if": ["ate_hotpot"] },
        { "node": "table_look" }
      ],
      "talk": [
        { "node": "table_after_eat", "if": ["ate_hotpot"] },
        { "node": "table_pangdi" }
      ]
    },
    "kitchen": {
      "any": [ { "node": "C2_1", "if": ["route_C", "C_1"], "ifNot": ["C_2"] } ],
      "look": [ { "node": "kitchen_idle" } ],
      "talk": [ { "node": "kitchen_idle" } ]
    },
    "zhanggui": {
      "talk": [
        { "node": "ZG2_1", "if": ["c2_combined"], "ifNot": ["c2_dish"] },
        { "node": "ZG2_5", "if": ["c2_dish"], "ifNot": ["c2_finale"] },
        { "node": "zg_end", "if": ["c2_finale"] },
        { "node": "zg_c2b", "if": ["c2_arrived"] },
        { "node": "zg_c2", "if": ["ch1_done"] },
        { "node": "M_1", "if": ["end_A"], "ifNot": ["ch1_done", "route_A", "route_B", "route_C"] },
        { "node": "M_1", "if": ["end_C"], "ifNot": ["ch1_done", "route_A", "route_B", "route_C"] },
        { "node": "M_1", "if": ["battle_B_win"], "ifNot": ["ch1_done", "route_A", "route_B", "route_C"] },
        { "node": "zg_waitB", "if": ["end_B"], "ifNot": ["battle_B_win", "route_A", "route_B", "route_C"] },
        { "node": "A4_1", "if": ["route_A", "A_3"] },
        { "node": "B4_1", "if": ["route_B", "B_3"] },
        { "node": "C4_1", "if": ["route_C", "C_3"] },
        { "node": "zg_busy", "if": ["route_A"] },
        { "node": "zg_busy", "if": ["route_B"] },
        { "node": "zg_busy", "if": ["route_C"] },
        { "node": "zg_choose", "if": ["heard_jinnang"] },
        { "node": "zg_1" }
      ],
      "look": [ { "node": "zg_look" } ]
    },
    "door": {
      "any": [ { "node": "door_locked", "ifNot": ["ch1_done"] } ]
    },

    "labupa": {
      "any": [
        { "node": "LP_1", "ifNot": ["c2_met_labupa"] },
        { "node": "DED_1", "if": ["c2_e1_done", "c2_e2_done", "c2_e3_done"], "ifNot": ["c2_deduced"] },
        { "node": "E3_1", "ifNot": ["c2_e3_done"] },
        { "node": "LP_hint1", "ifNot": ["c2_clues"] },
        { "node": "LP_hint2", "ifNot": ["c2_ht_win"] },
        { "node": "LP_idle" }
      ]
    },
    "tongzi": {
      "any": [
        { "node": "TZ_0", "ifNot": ["c2_met_labupa"] },
        { "node": "TZ_1", "ifNot": ["c2_clues"] },
        { "node": "TZ_2", "ifNot": ["c2_ht_win"] },
        { "node": "TZ_3" }
      ]
    },
    "stall_1": {
      "any": [
        { "node": "S1_idle", "ifNot": ["c2_met_labupa"] },
        { "node": "E1_1", "ifNot": ["c2_e1_done"] },
        { "node": "E1_after" }
      ]
    },
    "stall_2": {
      "any": [
        { "node": "S2_idle", "ifNot": ["c2_met_labupa"] },
        { "node": "E2_1", "ifNot": ["c2_e2_done"] },
        { "node": "E2_after" }
      ]
    },
    "stall_3": {
      "any": [
        { "node": "LP_1", "ifNot": ["c2_met_labupa"] },
        { "node": "E3_1", "ifNot": ["c2_e3_done"] },
        { "node": "E3_after" }
      ]
    },
    "hongtang_a": { "any": [ { "node": "HT_1", "ifNot": ["c2_ht_tried"] }, { "node": "HT_retry" } ] },
    "hongtang_b": { "any": [ { "node": "HT_1", "ifNot": ["c2_ht_tried"] }, { "node": "HT_retry" } ] },
    "laobanniang": {
      "any": [
        { "node": "HT_1", "if": ["c2_deduced"], "ifNot": ["c2_ht_win", "c2_ht_tried"] },
        { "node": "HT_retry", "if": ["c2_deduced"], "ifNot": ["c2_ht_win"] },
        { "node": "LB_1", "if": ["c2_ht_win"], "ifNot": ["c2_got_half"] },
        { "node": "LB_combine", "if": ["c2_got_half"], "ifNot": ["c2_combined"] },
        { "node": "LB_after", "if": ["c2_combined"] },
        { "node": "LB_idle" }
      ]
    },
    "teahouse": {
      "any": [
        { "node": "HT_1", "if": ["c2_deduced"], "ifNot": ["c2_ht_win", "c2_ht_tried"] },
        { "node": "HT_retry", "if": ["c2_deduced"], "ifNot": ["c2_ht_win"] },
        { "node": "LB_1", "if": ["c2_ht_win"], "ifNot": ["c2_got_half"] }
      ],
      "look": [ { "node": "TH_look" } ],
      "talk": [ { "node": "LB_idle" } ]
    },
    "pier": {
      "look": [ { "node": "PIER_1" } ],
      "talk": [ { "node": "PIER_2" } ]
    }
  },

  "nodes": {
    "sign_look":  { "speaker": "xiaoman", "text": "这是小满家祖传三代的招牌。" },
    "sign_talk":  { "speaker": "pangdi",  "text": "跟招牌说话？……“椒麻鸡火锅”，你好。", "next": "sign_look" },

    "table_look": { "speaker": "narrator", "text": "铜锅里红油翻滚，椒麻的香气直往鼻子里钻。", "next": "table_pangdi" },
    "table_pangdi": {
      "speaker": "pangdi", "text": "咕……我就闻闻，真的就闻闻。",
      "options": [
        { "text": "先吃一口", "set": ["ate_hotpot"], "next": "table_eat" },
        { "text": "等会再说", "set": ["hotpot_later"], "next": "table_later" }
      ]
    },
    "table_eat":   { "speaker": "pangdi", "text": "嘶——麻！辣！香！这一口值了！" },
    "table_later": { "speaker": "feifei", "text": "先办正事，锅又跑不了。" },
    "table_after_eat": { "speaker": "pangdi", "text": "刚才那口还在嘴里麻着呢……再来一口也不过分吧？" },

    "kitchen_idle": { "speaker": "narrator", "text": "门帘后飘来一阵老卤香，灶上的火已经封了。" },

    "zg_look": { "speaker": "narrator", "text": "满掌柜攥着算盘，眉头拧成了一个结。" },
    "zg_1": { "speaker": "zhanggui", "text": "小满！你们可算回来了。", "next": "zg_2" },
    "zg_2": { "speaker": "zhanggui", "text": "咱家的秘方锦囊……昨夜不见了！", "set": ["heard_jinnang"], "next": "zg_3" },
    "zg_3": { "speaker": "xiaoman",  "text": "什么？那可是祖传三代的方子！", "next": "zg_4" },
    "zg_4": { "speaker": "zhanggui", "text": "锦囊一丢，这招牌怕是保不住了。你们……打算从哪儿查起？", "next": "zg_choose" },
    "zg_choose": {
      "speaker": "zhanggui", "text": "三条路，你们挑一条。",
      "options": [
        { "text": "【小满线】家徽之谜：小满查家徽留下的线索", "doneFlag": "end_A", "do": [{ "route": "A" }], "next": "A1_1" },
        { "text": "【飞飞线】江湖食客的吃辣挑战：飞飞去会会那位食客", "doneFlag": "end_B", "do": [{ "route": "B" }], "next": "B1_1" },
        { "text": "【胖弟线】后厨异响：胖弟去后厨探个究竟", "doneFlag": "end_C", "do": [{ "route": "C" }], "next": "C1_1" }
      ]
    },
    "zg_busy": {
      "speaker": "zhanggui", "text": "线索查得怎么样了？看看右边的“当前目标”。",
      "options": [
        { "text": "接着查", "next": null },
        { "text": "换一条线", "next": "zg_choose" }
      ]
    },

    "A1_1": { "speaker": "xiaoman",  "text": "锦囊上绣着咱家家徽，谁拿了都不好出手。", "set": ["A_1"], "next": "A1_2" },
    "A1_2": { "speaker": "zhanggui", "text": "家徽……对了！你爷爷当年在招牌上动过手脚，说是“留给下一代”。", "next": "A1_3" },
    "A1_3": { "speaker": "feifei",   "text": "那就先去看看招牌。" },
    "A2_1": { "speaker": "xiaoman",  "text": "招牌左下角刻着的纹样……和我手里这块家徽令牌一模一样。", "next": "A2_2" },
    "A2_2": { "speaker": "feifei",   "text": "纹路缺了一角，像个锁眼。试试把家徽按上去？", "next": "A2_3" },
    "A2_3": { "speaker": "narrator", "text": "“咔哒”一声，招牌背后弹出一张泛黄的纸条：锦囊在暖处，日日翻滚。", "set": ["A_2"], "next": "A2_4" },
    "A2_4": { "speaker": "pangdi",   "text": "暖处、天天翻滚……这说的不就是我吗？" },
    "A3_1": { "speaker": "pangdi",   "text": "哦——是这口锅！暖处，日日翻滚！", "next": "A3_2" },
    "A3_2": { "speaker": "narrator", "text": "小满拧开铜锅底座，暗格里躺着一个红布锦囊，熏得满是椒麻香。", "set": ["A_3"], "next": "A3_3" },
    "A3_3": { "speaker": "xiaoman",  "text": "找到了。拿去给爹看看。" },
    "A4_1": { "speaker": "zhanggui", "text": "好小子，真让你找着了！这是你爷爷出的考题，我……昨夜喝多了，给忘了。", "next": "A4_2" },
    "A4_2": { "speaker": "xiaoman",  "text": "……爹。", "do": [{ "ending": "A" }] },

    "B1_1": { "speaker": "feifei",   "text": "昨夜最后一桌客人，是那个自称“辣不怕”的江湖食客吧？", "set": ["B_1"], "next": "B1_2" },
    "B1_2": { "speaker": "zhanggui", "text": "正是！他吃完说要“借”锦囊研究研究，还在火锅桌上压了张战帖！", "next": "B1_3" },
    "B1_3": { "speaker": "feifei",   "text": "有意思。我去看看。" },
    "B2_1": { "speaker": "narrator", "text": "桌上压着一张战帖：“能吃下十成椒麻者，锦囊奉还。——辣不怕”", "next": "B2_2" },
    "B2_2": { "speaker": "feifei",   "text": "（唰地展开折扇）挑战，我接了。", "next": "B2_3" },
    "B2_3": { "speaker": "pangdi",   "text": "我、我可以帮你吃一半！不，三分之二！", "set": ["B_2"] },
    "B3_1": { "speaker": "feifei",   "text": "辣不怕！战帖我接了——明晚戌时三刻，就在这块招牌底下！", "next": "B3_2" },
    "B3_2": { "speaker": "labupa",   "text": "（门外一声大笑）好胆！到时候可别辣哭了鼻子！", "set": ["B_3"], "next": "B3_3" },
    "B3_3": { "speaker": "xiaoman",  "text": "回去跟爹说一声。" },
    "B4_1": { "speaker": "zhanggui", "text": "十成椒麻？那可是能把铜锅烧穿的辣度啊……", "next": "B4_2" },
    "B4_2": { "speaker": "feifei",   "text": "眼镜擦亮了，扇子也备好了。放心。", "do": [{ "ending": "B" }] },
    "B5_1": { "speaker": "labupa",   "text": "（辣不怕抱着一坛红油站在招牌下）十成椒麻，备好了。谁先来？", "next": "B5_2" },
    "B5_2": {
      "speaker": "feifei", "text": "（展开折扇）我们三个一起。",
      "options": [
        { "text": "迎战！（进入战斗）", "do": [{ "battle": "labupa" }], "next": null },
        { "text": "再准备一下", "next": null }
      ]
    },

    "C1_1": { "speaker": "pangdi",   "text": "说起来，昨夜后厨“咚咚”响了一宿，我还以为是我肚子在叫。", "set": ["C_1"], "next": "C1_2" },
    "C1_2": { "speaker": "zhanggui", "text": "后厨？那儿除了一口老卤缸，什么都没有啊。", "next": "C1_3" },
    "C1_3": { "speaker": "pangdi",   "text": "（抄起大汤勺）我去听听。" },
    "C2_1": { "speaker": "narrator", "text": "门帘后传来“咚、咚、咚”的闷响……还夹着吧唧嘴的声音。", "next": "C2_2" },
    "C2_2": { "speaker": "pangdi",   "text": "谁！出来！我的大汤勺可不认人！", "next": "C2_3" },
    "C2_3": { "speaker": "narrator", "text": "一只圆滚滚的黄猫叼着红布包窜了出来，一溜烟钻到了火锅桌底下。", "set": ["C_2"] },
    "C3_1": { "speaker": "pangdi",   "text": "嘘——我敲锅，你们左右包抄。", "next": "C3_2" },
    "C3_2": { "speaker": "narrator", "text": "“当！”黄猫吓得一松口，红布包落地——正是秘方锦囊，还沾着卤汁。", "set": ["C_3"], "next": "C3_3" },
    "C3_3": { "speaker": "feifei",   "text": "原来是被卤香勾来的小贼。" },
    "C4_1": { "speaker": "zhanggui", "text": "这不是咱家的猫“椒椒”嘛！难怪它昨夜一口饭都没吃。", "next": "C4_2" },
    "C4_2": { "speaker": "pangdi",   "text": "它吃得比我还好……", "do": [{ "ending": "C" }] },

    "zg_waitB": { "speaker": "zhanggui", "text": "辣不怕在招牌底下候着呢！锦囊能不能拿回来，就看你们这一战了。" },

    // ================= 汇合：三条线都拿回同一个锦囊 =================
    "M_1":  { "speaker": "zhanggui", "text": "锦囊回来了就好……来，当着你们三个的面，打开看看。", "next": "M_1b" },
    "M_1b": { "speaker": "feifei",   "text": "辣不怕把锦囊还回来的时候说过一句怪话：“这味道，我只尝到了一半。”", "if": ["battle_B_win"], "else": "M_2", "next": "M_2" },
    "M_2":  { "speaker": "narrator", "text": "红布锦囊里只有半张泛黄的方子，撕口歪歪扭扭，像是被人一把扯开的。", "set": ["ch1_done", "item_jinnang", "item_recipe_half"], "do": [{ "gain": "recipe_half" }], "next": "M_3" },
    "M_3":  { "speaker": "xiaoman",  "text": "只有一半？", "next": "M_4" },
    "M_4":  { "speaker": "zhanggui", "text": "……果然。你爷爷当年说过，这方子他和一位故人一人一半，谁也不许独吞。", "next": "M_5" },
    "M_5":  { "speaker": "feifei",   "text": "方子背面有一行小字——“渝州·老码头”。", "next": "M_6" },
    "M_6":  { "speaker": "pangdi",   "text": "老码头！那儿的夜市有全渝州最好吃的……咳，最好的线索。", "next": "M_7" },
    "M_7":  { "speaker": "zhanggui", "text": "老码头的夜市亥时才热闹。你们去走一趟，把另一半方子请回来。店门就在前头。", "set": ["c2_start"], "do": [{ "title": "ch2" }] },

    "door_locked": { "speaker": "zhanggui", "text": "锦囊还没着落，往哪儿跑？先把店里的事办了！" },
    "zg_c2":  { "speaker": "zhanggui", "text": "老码头在城东，出了店门往江边走。记着，礼数要周到——那可是你爷爷的故人。" },
    "zg_c2b": { "speaker": "zhanggui", "text": "码头那边查得怎么样？看看“当前目标”，别让红汤帮那帮人抢了先。" },

    // ================= 第二章 · 老码头夜市 =================
    "MK_1": { "speaker": "narrator", "text": "江风裹着辣香扑面而来。吊脚楼上挂满红灯笼，石板地上摊子挨着摊子——这就是渝州·老码头的夜市。", "set": ["c2_arrived"], "next": "MK_2" },
    "MK_2": { "speaker": "pangdi",   "text": "（深吸一口气）炒辣子、老鹰茶、糖油果子……我宣布，这是我这辈子最好的一次查案。", "next": "MK_3" },
    "MK_3": { "speaker": "feifei",   "text": "先办正事。炒锅摊那边有人在吆喝——那嗓门，我好像在哪儿听过。" },

    // 辣不怕：走过飞飞线的玩家是“又见面”，没走过的是“初次见面”
    "LP_1":  { "speaker": "labupa", "text": "（锅铲敲得震天响）十成辣子鸡——不辣不要钱！", "next": "LP_2" },
    "LP_2":  { "speaker": "labupa", "text": "哟！这不是椒麻鸡火锅家的三个娃？招牌下那一仗我输得心服口服，干脆在码头支了个炒锅摊，换个地方接着辣！", "if": ["battle_B_win"], "else": "LP_2n", "next": "LP_3" },
    "LP_2n": { "speaker": "labupa", "text": "你们是椒麻鸡火锅家的娃吧？昨晚我在你们店吃了一锅，够劲！可惜啊，总觉得那味道只辣到一半。", "next": "LP_2m" },
    "LP_2m": { "speaker": "xiaoman", "text": "只辣到一半……因为方子本来就只有一半。我们正是来找另一半的。", "next": "LP_3" },
    "LP_3":  { "speaker": "tongzi", "text": "师父师父，他们手里那张纸，跟那个提茶壶的人说的‘半张’是不是一回事？", "next": "LP_4" },
    "LP_4":  { "speaker": "labupa", "text": "嘘！……老码头的事，问三个人最准：古玩摊的老周、灯谜摊的钱先生，还有——我。", "next": "LP_5" },
    "LP_5":  { "speaker": "labupa", "text": "不过码头有码头的规矩，消息不白给。帮他们各办一件小事，我这儿嘛……今晚客人多，正缺个会颠勺的！", "set": ["c2_met_labupa"], "next": "LP_6" },
    "LP_6":  { "speaker": "feifei", "text": "老周认物，钱先生斗嘴，辣不怕颠勺。小满、我、胖弟，正好一人一摊。" },
    "LP_hint1": { "speaker": "labupa", "text": "还差哪家没去？右边“当前目标”里一清二楚。我这炒锅可等不了太久！" },
    "LP_hint2": { "speaker": "labupa", "text": "红汤帮那几个莽汉堵着茶馆门呢。真要动手，我给你们掠阵——辣椒粉管够！" },
    "LP_idle":  { "speaker": "labupa", "text": "方子凑齐了？好！改天开张，第一锅得让我尝。" },

    "TZ_0": { "speaker": "tongzi", "text": "炒锅摊这边！我师父的辣子鸡，辣得船工都跳江！" },
    "TZ_1": { "speaker": "tongzi", "text": "老周的眼睛贼尖，钱先生的嘴贼利，我师父的锅贼大！" },
    "TZ_2": { "speaker": "tongzi", "text": "红汤帮的人凶巴巴的……打他们的时候记得喊我，我撒辣椒粉！" },
    "TZ_3": { "speaker": "tongzi", "text": "老板娘的茶可好喝了，就是从来不给我续第二碗。" },

    // —— 委托一：古玩摊 · 小满认家徽 ——
    "S1_idle": { "speaker": "narrator", "text": "古玩摊上摊着铜钱、玉坠和一排旧铜牌。摊主老周缩在摊子后头打盹。" },
    "E1_1": { "speaker": "laozhou", "text": "（从一堆铜钱后探出头）小娃娃，看中啥了？……哟，你腰上这块令牌，有点眼熟。", "do": [{ "leader": "xiaoman" }], "next": "E1_2" },
    "E1_2": { "speaker": "xiaoman", "text": "这是满家的家徽。老伯见过一样的？", "next": "E1_3" },
    "E1_3": { "speaker": "laozhou", "text": "二十年前有人在我这儿当过一块铜牌，花纹跟你们家徽一个路数。可后来仿的、真的混了一箱——认得出真家徽，我就把旧账翻给你看。",
      "options": [
        { "text": "我来认（小满）", "do": [{ "minigame": "emblem", "win": "E1_win" }], "next": null },
        { "text": "等会儿再来", "next": null }
      ] },
    "E1_win": { "speaker": "laozhou", "text": "好眼力！一点没含糊。……旧账上写着：当铜牌的是个梳圆髻的姑娘，留了句话——“等满家的人来赎”。", "set": ["c2_e1_done", "clue_1"], "next": "E1_win2" },
    "E1_win2": { "speaker": "xiaoman", "text": "一位姑娘……爷爷的故人，是位女子。", "next": "E1_win3" },
    "E1_win3": { "speaker": "narrator", "text": "【线索一】当年收着另一半方子的，是一位女子。", "next": "CLUE_gate" },
    "E1_after": { "speaker": "laozhou", "text": "那块铜牌我还留着呢，等你们方子凑齐了，拿一碗椒麻鸡来换。" },

    // —— 委托二：灯谜摊 · 飞飞比口才 ——
    "S2_idle": { "speaker": "narrator", "text": "灯谜摊下挂着一串红灯笼，每盏灯下坠着一条谜笺。摊主钱先生摇着折扇，谁也不搭理。" },
    "E2_1": { "speaker": "qian", "text": "猜谜、对句、斗嘴，比的都是嘴上功夫。连赢我三阵，问啥答啥。", "do": [{ "leader": "feifei" }], "next": "E2_2" },
    "E2_2": { "speaker": "feifei", "text": "（唰地展开折扇）折扇对折扇，正好。",
      "options": [
        { "text": "接擂（飞飞）", "do": [{ "minigame": "duel", "win": "E2_win" }], "next": null },
        { "text": "改日再来", "next": null }
      ] },
    "E2_win": { "speaker": "qian", "text": "三阵全输，服气！你们想问那位故人？……当年码头上嘴最利的，是个爱喝老鹰茶的姑娘，就在江边支了个茶摊。", "set": ["c2_e2_done", "clue_2"], "next": "E2_win2" },
    "E2_win2": { "speaker": "qian", "text": "后来茶摊成了茶馆，人也成了老板娘……再多的，我可就不知道了。", "next": "E2_win3" },
    "E2_win3": { "speaker": "narrator", "text": "【线索二】那位女子以茶为业，当年的茶摊后来成了码头上的茶馆。", "next": "CLUE_gate" },
    "E2_after": { "speaker": "qian", "text": "下回再来，我备好了新谜。输了的人请喝茶。" },

    // —— 委托三：炒锅摊 · 胖弟帮颠勺 ——
    "E3_1": { "speaker": "labupa", "text": "胖弟！你那大勺看着就有力气——来，帮我把这锅十成辣子鸡颠出来！", "do": [{ "leader": "pangdi" }], "next": "E3_2" },
    "E3_2": { "speaker": "pangdi", "text": "颠勺？这个我熟！（撸起袖子）",
      "options": [
        { "text": "上灶（胖弟）", "do": [{ "minigame": "wok", "win": "E3_win" }], "next": null },
        { "text": "等我吃饱再来", "next": null }
      ] },
    "E3_win": { "speaker": "labupa", "text": "好手艺！……对了，你们打听的人——每晚亥时三刻，都有人来我这儿买一份椒麻鸡，说是“给老朋友留着”，自己一口不吃。", "set": ["c2_e3_done", "clue_3"], "next": "E3_win2" },
    "E3_win2": { "speaker": "tongzi", "text": "我知道！她提着一把铜茶壶来的，身上一股老鹰茶味儿！", "next": "E3_win3" },
    "E3_win3": { "speaker": "narrator", "text": "【线索三】每晚来买椒麻鸡“留给老朋友”的，是一位提铜茶壶的人。", "next": "CLUE_gate" },
    "E3_after": { "speaker": "labupa", "text": "这锅辣子鸡卖疯了！胖弟，以后码头要是混不下去，来给我当二把勺。" },

    // —— 三条线索齐了：推理 ——
    "CLUE_gate": { "speaker": "feifei", "text": "女子、茶馆、每晚为老朋友买椒麻鸡……线索齐了。", "if": ["c2_e1_done", "c2_e2_done", "c2_e3_done"], "set": ["c2_clues"], "next": "DED_2" },
    "DED_1": { "speaker": "feifei", "text": "女子、茶馆、每晚为老朋友买椒麻鸡……线索齐了。", "set": ["c2_clues"], "next": "DED_2" },
    "DED_2": { "speaker": "xiaoman", "text": "爷爷的故人，到底是谁？",
      "options": [
        { "text": "古玩摊的老周", "next": "DED_w1" },
        { "text": "码头茶馆的老板娘", "next": "DED_ok" },
        { "text": "灯谜摊的钱先生", "next": "DED_w2" }
      ] },
    "DED_w1": { "speaker": "pangdi", "text": "老周是个白胡子老爷子……跟“梳圆髻的姑娘”差得有点远。", "next": "DED_2" },
    "DED_w2": { "speaker": "feifei", "text": "钱先生自己都说了“再多的不知道”。再想想。", "next": "DED_2" },
    "DED_ok": { "speaker": "xiaoman", "text": "是码头茶馆的老板娘！她每晚提着铜茶壶来买椒麻鸡——替爷爷尝味道。", "set": ["c2_deduced"], "next": "DED_3" },
    "DED_3": { "speaker": "labupa", "text": "茶馆老板娘？我这就带你们——等等，茶馆门口那几个穿红褂子的……是红汤帮的人！", "next": "DED_4" },
    "DED_4": { "speaker": "narrator", "text": "不知何时，两个红汤帮打手抱着胳膊，堵在了茶馆门口。" },

    // —— 红汤帮拦路 ——
    "HT_1": { "speaker": "hongtang", "text": "站住！茶馆今晚不做生意。", "set": ["c2_ht_tried"], "next": "HT_2" },
    "HT_2": { "speaker": "xiaoman", "text": "我们找老板娘有事。", "next": "HT_3" },
    "HT_3": { "speaker": "hongtang", "text": "巧了，我们红汤帮也找她——为了那半张椒麻方子。识相的，滚回你们那小火锅店去！", "next": "HT_4" },
    "HT_4": { "speaker": "pangdi", "text": "我们店不小！……好吧是不大，但锅大！",
      "options": [
        { "text": "动手吧！（进入战斗）", "do": [{ "battle": "hongtang" }], "next": null },
        { "text": "先退一步，准备一下", "next": null }
      ] },
    "HT_retry": { "speaker": "hongtang", "text": "又来了？上回没辣够是吧！",
      "options": [
        { "text": "再战！（进入战斗）", "do": [{ "battle": "hongtang" }], "next": null },
        { "text": "先退一步", "next": null }
      ] },

    // —— 茶馆老板娘 ——
    "LB_idle": { "speaker": "laobanniang", "text": "（提着铜壶给船工续茶，瞥了你们一眼）年轻人，喝茶自己找座。" },
    "LB_1": { "speaker": "laobanniang", "text": "（茶馆的门吱呀一声开了）打得好。外头吵了半宿，我这壶老鹰茶都凉了。", "next": "LB_2" },
    "LB_2": { "speaker": "xiaoman", "text": "您就是……爷爷的故人？（亮出家徽令牌）", "next": "LB_3" },
    "LB_3": { "speaker": "laobanniang", "text": "满家的家徽……二十年了。你爷爷当年在我茶摊上对了一夜对子，输了，非要把方子撕一半给我当茶钱。", "next": "LB_4" },
    "LB_4": { "speaker": "laobanniang", "text": "他说：“椒麻要配茶，方子要配人。等满家出了能扛事的娃，让他们自己来取。”", "next": "LB_5" },
    "LB_5": { "speaker": "feifei", "text": "所以您每晚去买一份椒麻鸡……", "next": "LB_6" },
    "LB_6": { "speaker": "laobanniang", "text": "替那个老头子尝尝，味儿还对不对。（从袖中取出半张方子）拿去吧，这一半，我替他守够了。", "set": ["c2_got_half", "item_recipe_other"], "do": [{ "gain": "recipe_other" }], "next": "LB_7" },
    "LB_7": { "speaker": "narrator", "text": "两张泛黄的半页纸，撕口歪歪扭扭——正好能对上。", "do": [{ "minigame": "combine", "win": "LB_8" }] },
    "LB_combine": { "speaker": "narrator", "text": "两张半页方子还没合上。", "do": [{ "minigame": "combine", "win": "LB_8" }] },
    "LB_8": { "speaker": "laobanniang", "text": "回去告诉满掌柜：方子背面还有东西，让他对着灯看。", "next": "LB_9" },
    "LB_9": { "speaker": "laobanniang", "text": "去吧。老码头的夜还长，红汤帮也不会就此罢休。", "next": "LB_10" },
    "LB_10": { "speaker": "pangdi", "text": "老板娘，下回来，我们带一锅十成椒麻请您！" },
    "LB_after": { "speaker": "laobanniang", "text": "方子收好了？快回去吧，满掌柜该等急了。" },
    "TH_look": { "speaker": "narrator", "text": "茶馆门口挑着“老鹰茶”的布幌子，几个船工捧着粗瓷碗，听江水拍着石阶。" },
    "PIER_1": { "speaker": "narrator", "text": "渡口石阶一直伸进江里，几条乌篷船随着浪轻轻晃。对岸的灯火像撒了一江的辣椒籽。" },
    "PIER_2": { "speaker": "pangdi", "text": "（朝江面大喊）有——人——卖——鱼——吗——" },

    // —— 回店：解锁新菜 + 藏宝图钩子 ——
    "ZG2_1": { "speaker": "zhanggui", "text": "回来了！方子……合上了？", "next": "ZG2_2" },
    "ZG2_2": { "speaker": "xiaoman", "text": "合上了。老板娘托我们带句话：椒麻要配茶，方子要配人。", "next": "ZG2_3" },
    "ZG2_3": { "speaker": "zhanggui", "text": "（眼眶一红）这老头子……好！照着这方子，今晚就给店里添一道新菜！", "set": ["c2_dish"], "do": [{ "card": "dish", "then": "ZG2_5" }] },
    "ZG2_5": { "speaker": "narrator", "text": "满掌柜把方子举到灯下。纸背透出一片淡淡的墨痕——弯弯的江流、层层的山峦，还有一个朱砂点的小圈。", "next": "ZG2_6" },
    "ZG2_6": { "speaker": "feifei", "text": "这是……一张藏宝图？", "next": "ZG2_7" },
    "ZG2_7": { "speaker": "pangdi", "text": "宝？能吃吗？", "next": "ZG2_8" },
    "ZG2_8": { "speaker": "zhanggui", "text": "朱砂圈画在巫山脚下。看来你爷爷留下的，不止一道菜。", "next": "ZG2_9" },
    "ZG2_9": { "speaker": "xiaoman", "text": "（把方子小心收好）那就——下一站，雾江。", "set": ["c2_finale", "item_treasure_map"], "do": [{ "finale": "ch2" }] },
    "zg_end": { "speaker": "zhanggui", "text": "新菜卖得可好了！巫山的事，等你们歇够了再说。" }
  }
};


// —— 第三章「雾江夜渡」：官方对白（game-design/jiaoma/dialogue_ch3.js）合并进 DIALOGUE ——
// 《椒麻江湖》第三章「雾江夜渡」对白（游戏设计 Bot）
// 格式对齐 /workspace/game-m4/data/dialogue.js；程序员 Bot 可整段合并进 DIALOGUE。
// 场景建议：river（雾江古渡，背景 bg_river）
// 交互点建议：chuanniang（船娘阿篙）、stars（桅杆/星空）、boat_deck（船甲板）、net（渔网）、tiesuanpan（铁算盘拦船）
// 素材：art/ch3/ → bg_river, npc_chuanniang(0.88), npc_tiesuanpan(0.96), icon_treasure_map
// 战斗 id 建议：tiesuanpan
// 小玩法（可选，没有实现时用 *_win 节点直接过）：stars 认星 / song 对山歌 / net 下网

window.DIALOGUE_CH3 = {
  "speakers_add": {
    "chuanniang": { "name": "阿篙", "sprite": "npc_chuanniang", "color": "#2a6f7a" },
    "tiesuanpan": { "name": "铁算盘", "sprite": "npc_tiesuanpan", "color": "#6b2a1a" }
  },

  "chapters_add": {
    "ch3": { "seal": "第三章", "title": "雾江夜渡", "sub": "藏宝图指向上游。雾锁江面，渡口的船娘正等着满家的人。" }
  },

  "sceneEnter": [
    { "scene": "river", "node": "RV_1", "ifNot": ["c3_arrived"] }
  ],

  "chapter3": {
    "name": "雾江夜渡",
    "stages": [
      { "until": "c3_arrived",     "scene": "shop",  "text": "带着藏宝图，去雾江古渡", "target": "door" },
      { "until": "c3_met_agu",     "scene": "river", "text": "渡口有条乌篷船，船头站着一位船娘——去问问", "target": "chuanniang" },
      { "until": "c3_clues",       "scene": "river", "text": "帮阿篙办完三桩事，再开船", "checklist": [
          { "flag": "c3_e1_done", "text": "桅杆下 · 小满认星位", "target": "stars", "hero": "小满" },
          { "flag": "c3_e2_done", "text": "船头 · 飞飞对山歌", "target": "chuanniang", "hero": "飞飞" },
          { "flag": "c3_e3_done", "text": "船舷 · 胖弟下网捞物", "target": "net", "hero": "胖弟" } ] },
      { "until": "c3_box_safe",    "scene": "river", "text": "铁盒捞上来了——找阿篙合计怎么开", "target": "chuanniang" },
      { "until": "c3_ts_win",      "scene": "river", "text": "江心有人拦船！上前交涉（打不过可以再来）", "target": "tiesuanpan" },
      { "until": "c3_got_pepper",  "scene": "river", "text": "打开铁盒，看看里头是什么", "target": "chuanniang" },
      { "until": "c3_finale",      "scene": "river", "text": "阿篙好像还有话要说", "target": "chuanniang" }
    ],
    "done": "第三章完 · 下一站：麻婆岭。可以四处逛逛，也可以回主菜单。"
  },

  "entries": {
    "chuanniang": {
      "any": [
        { "node": "AG_1", "ifNot": ["c3_met_agu"] },
        { "node": "AG_song", "if": ["c3_met_agu"], "ifNot": ["c3_e2_done"] },
        { "node": "BOX_1", "if": ["c3_e1_done", "c3_e2_done", "c3_e3_done"], "ifNot": ["c3_box_safe"] },
        { "node": "OPEN_1", "if": ["c3_ts_win"], "ifNot": ["c3_got_pepper"] },
        { "node": "HOOK_1", "if": ["c3_got_pepper"], "ifNot": ["c3_finale"] },
        { "node": "AG_hint", "ifNot": ["c3_clues"] },
        { "node": "AG_idle" }
      ]
    },
    "stars": {
      "any": [
        { "node": "ST_idle", "ifNot": ["c3_met_agu"] },
        { "node": "E1_1", "ifNot": ["c3_e1_done"] },
        { "node": "E1_after" }
      ]
    },
    "net": {
      "any": [
        { "node": "NT_idle", "ifNot": ["c3_met_agu"] },
        { "node": "E3_1", "ifNot": ["c3_e3_done"] },
        { "node": "E3_after" }
      ]
    },
    "boat_deck": {
      "look": [ { "node": "DECK_look" } ],
      "talk": [ { "node": "DECK_talk" } ]
    },
    "tiesuanpan": {
      "any": [
        { "node": "TS_1", "if": ["c3_box_safe"], "ifNot": ["c3_ts_tried"] },
        { "node": "TS_retry", "if": ["c3_box_safe"], "ifNot": ["c3_ts_win"] },
        { "node": "TS_gone" }
      ]
    }
  },

  "nodes": {
    // —— 进场 ——
    "RV_1": { "speaker": "narrator", "text": "雾把江面糊成一锅白汤。渡口的石阶湿漉漉的，一条乌篷船轻轻蹭着木桩，船头点着一盏小红灯。", "set": ["c3_arrived"], "do": [{ "title": "ch3" }], "next": "RV_2" },
    "RV_2": { "speaker": "pangdi", "text": "这雾……我要是喊一声“开饭”，对岸听得见吗？", "next": "RV_3" },
    "RV_3": { "speaker": "feifei", "text": "藏宝图上的朱砂圈就在这一带。先找摆渡的人。" },

    // —— 船娘阿篙 ——
    "AG_1": { "speaker": "chuanniang", "text": "（撑篙点住船舷）雾江夜渡，一个人三个铜板。——等等，你们腰上那块铜牌……满家的？", "next": "AG_2" },
    "AG_2": { "speaker": "xiaoman", "text": "（亮出家徽令牌）我们找“椒麻之源”。茶馆老板娘说，您认得路。", "next": "AG_3" },
    "AG_3": { "speaker": "chuanniang", "text": "老板娘的信我收到了。满家的人，我免费送——规矩有三条。", "next": "AG_4" },
    "AG_4": { "speaker": "chuanniang", "text": "一，认星位，别让船漂到乱礁上；二，跟我对上三句山歌，算过船资；三，船舷那张旧网，帮我捞一捞——江底昨晚掉了东西。", "next": "AG_5" },
    "AG_5": { "speaker": "feifei", "text": "认星、对歌、捞物。小满、我、胖弟，一人一桩。", "set": ["c3_met_agu"], "next": "AG_6" },
    "AG_6": { "speaker": "chuanniang", "text": "办完了，我撑你们去上游。红汤帮最近也在江上晃，动作快点。" },
    "AG_hint": { "speaker": "chuanniang", "text": "哪桩还没办？右边“当前目标”写着呢。雾散了不好走。" },
    "AG_idle": { "speaker": "chuanniang", "text": "江风凉，把衣襟扣好。麻婆岭那地方，比雾江还野。" },

    // —— 委托一：小满认星位 ——
    "ST_idle": { "speaker": "narrator", "text": "桅杆顶挂着一串旧铜铃。雾缝里偶尔漏出几颗星。" },
    "E1_1": { "speaker": "chuanniang", "text": "把藏宝图摊开。图上这三颗星，要对上今晚的北斗缺口。", "next": "E1_2" },
    "E1_2": { "speaker": "xiaoman", "text": "（举起藏宝图对着雾缝）左边一颗亮的……是天枢。缺口在这儿。",
      "do": [{ "minigame": "stars", "win": "E1_win", "quit": "E1_quit" }] },
    "E1_quit": { "speaker": "xiaoman", "text": "雾又厚了。等散一点再对。" },
    "E1_win": { "speaker": "xiaoman", "text": "对上了。船头朝东北偏东，就能避开乱礁。", "set": ["c3_e1_done"], "next": "E1_win2" },
    "E1_win2": { "speaker": "chuanniang", "text": "好眼力。你爷爷当年也是这么认路的。" },
    "E1_after": { "speaker": "narrator", "text": "铜铃轻轻响了一下。航向已经定好了。" },

    // —— 委托二：飞飞对山歌 ——
    "AG_song": { "speaker": "chuanniang", "text": "（拍拍船舷）山歌对上三句，船资就算清。我起头——“雾锁江心月不明——”",
      "do": [{ "minigame": "song", "win": "E2_win", "quit": "E2_quit" }] },
    "E2_quit": { "speaker": "feifei", "text": "（合上折扇）再想一句。山歌急不得。" },
    "E2_win": { "speaker": "feifei", "text": "“灯开渡口人先行。”——第二句，“船过乱礁心要稳——”", "next": "E2_win2" },
    "E2_win2": { "speaker": "chuanniang", "text": "“椒麻入锅味自馨。”——第三句齐了！（笑）满家嘴上功夫，没丢。", "set": ["c3_e2_done"], "next": "E2_win3" },
    "E2_win3": { "speaker": "pangdi", "text": "我也会！“咕——咕——”……这算吗？" },

    // —— 委托三：胖弟下网 ——
    "NT_idle": { "speaker": "narrator", "text": "船舷挂着一张结了苔的旧网，网坠还滴着水。" },
    "E3_1": { "speaker": "chuanniang", "text": "昨晚有船从这儿过，掉了个铁盒子。网往下沉的时候，听水声——“当”一声就收。", "next": "E3_2" },
    "E3_2": { "speaker": "pangdi", "text": "（挽起袖子）颠勺我在行，捞东西……也差不多吧？",
      "do": [{ "minigame": "net", "win": "E3_win", "quit": "E3_quit" }] },
    "E3_quit": { "speaker": "pangdi", "text": "滑走了！再来一网！" },
    "E3_win": { "speaker": "narrator", "text": "“当！”网里沉甸甸的——一只锈迹斑斑的铁盒，锁扣上刻着半个满家家徽。", "set": ["c3_e3_done", "item_iron_box"], "do": [{ "gain": "iron_box" }], "next": "E3_win2" },
    "E3_win2": { "speaker": "pangdi", "text": "捞着了！……等等，这盒子会不会是辣椒？我先闻——呸，铁锈味。", "next": "E3_win3" },
    "E3_win3": { "speaker": "feifei", "text": "家徽对得上。先交给阿篙看。" },
    "E3_after": { "speaker": "narrator", "text": "铁盒搁在船板上，雾气在它周围绕了一圈。" },

    // —— 三事办完：准备开盒，却被拦船 ——
    "BOX_1": { "speaker": "chuanniang", "text": "三桩事齐了。这铁盒……锁是满家旧式，得用家徽令牌拧。", "set": ["c3_clues", "c3_box_safe"], "next": "BOX_2" },
    "BOX_2": { "speaker": "xiaoman", "text": "我来——", "next": "BOX_3" },
    "BOX_3": { "speaker": "narrator", "text": "江心忽然传来桨声。雾里驶出一条快船，船头站着个算盘挂在腰间的瘦高个。", "next": "BOX_4" },
    "BOX_4": { "speaker": "tiesuanpan", "text": "满家的娃？铁盒留下。红汤帮二当家“铁算盘”——这笔账，我替帮主收了。", "next": "BOX_5" },
    "BOX_5": { "speaker": "chuanniang", "text": "（撑篙横在船前）想抢我船上的货，先问问这根篙答不答应。" },

    // —— 铁算盘战斗 ——
    "TS_1": { "speaker": "tiesuanpan", "text": "（算盘珠子拨得啪啪响）一个铜板都不差——铁盒，或者你们三个，二选一。", "set": ["c3_ts_tried"], "next": "TS_2" },
    "TS_2": { "speaker": "xiaoman", "text": "都不选。", "next": "TS_3" },
    "TS_3": { "speaker": "tiesuanpan", "text": "嘴硬。雾江之上，算盘声就是战鼓！",
      "options": [
        { "text": "迎战！（进入战斗）", "do": [{ "battle": "tiesuanpan" }], "next": null },
        { "text": "先退一步，准备一下", "next": null }
      ] },
    "TS_retry": { "speaker": "tiesuanpan", "text": "又凑上来了？账还没算完呢！",
      "options": [
        { "text": "再战！（进入战斗）", "do": [{ "battle": "tiesuanpan" }], "next": null },
        { "text": "先退一步", "next": null }
      ] },
    "TS_gone": { "speaker": "narrator", "text": "快船已经驶远，只剩算盘珠子的余音和一串水花。" },

    // —— 战后开盒 ——
    "OPEN_1": { "speaker": "tiesuanpan", "text": "（退回快船，咬牙）帮主不会放过你们……麻婆岭见！", "next": "OPEN_2" },
    "OPEN_2": { "speaker": "chuanniang", "text": "走了就好。小满，开盒吧。", "next": "OPEN_3" },
    "OPEN_3": { "speaker": "narrator", "text": "家徽令牌拧进锁眼。“咔。”盒盖弹开——丝绒托上躺着一颗金色的花椒，旁边压着一张纸条。", "set": ["c3_got_pepper", "item_golden_pepper"], "do": [{ "gain": "golden_pepper" }], "next": "OPEN_4" },
    "OPEN_4": { "speaker": "feifei", "text": "（念）“椒源在麻婆岭。”", "next": "OPEN_5" },
    "OPEN_5": { "speaker": "pangdi", "text": "金色的……能下锅吗？", "next": "OPEN_6" },
    "OPEN_6": { "speaker": "xiaoman", "text": "先收好。阿篙，麻婆岭怎么走？" },

    // —— 章末钩子 ——
    "HOOK_1": { "speaker": "chuanniang", "text": "上游再半日水路，上岸就是麻婆岭。那儿的花椒寨，认满家的金花椒。", "next": "HOOK_2" },
    "HOOK_2": { "speaker": "chuanniang", "text": "不过——铁算盘说“帮主不会放过你们”。红汤帮盯上椒源，恐怕比抢铁盒更狠。", "next": "HOOK_3" },
    "HOOK_3": { "speaker": "feifei", "text": "那就先到麻婆岭，问清楚再说。", "next": "HOOK_4" },
    "HOOK_4": { "speaker": "pangdi", "text": "路上要是有卖椒麻鸡的……我可以负责探路。", "next": "HOOK_5" },
    "HOOK_5": { "speaker": "chuanniang", "text": "（笑着撑篙）坐稳了。雾江夜渡，下一程——麻婆岭。", "set": ["c3_finale"], "do": [{ "finale": "ch3" }] },

    "DECK_look": { "speaker": "narrator", "text": "船板被江水泡得发黑，散着干辣椒和绳索的气味。" },
    "DECK_talk": { "speaker": "pangdi", "text": "这船晃得……我的胃也在对山歌。" }
  },

  "props_note": {
    "iron_box": { "name": "锈铁盒", "desc": "锁扣刻着半个满家家徽，江底捞起。" },
    "golden_pepper": { "name": "金花椒", "desc": "丝绒托上的金色花椒，纸条写着：椒源在麻婆岭。" }
  },

  "battle_note": {
    "tiesuanpan": {
      "name": "铁算盘",
      "sprite": "npc_tiesuanpan",
      "hint": "红汤帮二当家；章末 Boss。可参考 hongtang / labupa 的回合制配置。",
      "height": 0.96
    }
  },

  "minigame_note": {
    "stars": "对照藏宝图三颗星与雾缝星位（可做成点选三星，或直接跳 E1_win）",
    "song": "对山歌三句（可做成选项对答，或直接跳 E2_win）",
    "net": "听水声收网（可做成时机条，或直接跳 E3_win）"
  }
};

(function () {
  var D = window.DIALOGUE, C3 = window.DIALOGUE_CH3;
  if (!D || !C3) return;
  var k;
  if (C3.speakers_add) for (k in C3.speakers_add) D.speakers[k] = C3.speakers_add[k];
  if (C3.chapters_add) for (k in C3.chapters_add) D.chapters[k] = C3.chapters_add[k];
  if (C3.sceneEnter) D.sceneEnter = (D.sceneEnter || []).concat(C3.sceneEnter);
  if (C3.chapter3) D.chapter3 = C3.chapter3;
  if (C3.entries) {
    for (k in C3.entries) {
      if (!D.entries[k]) D.entries[k] = C3.entries[k];
      else {
        var src = C3.entries[k], dst = D.entries[k];
        ["any", "talk", "look"].forEach(function (a) {
          if (src[a]) dst[a] = (dst[a] || []).concat(src[a]);
        });
      }
    }
  }
  if (C3.nodes) for (k in C3.nodes) D.nodes[k] = C3.nodes[k];
})();


// —— 第四章「麻婆岭」：官方对白（game-design/jiaoma/dialogue_ch4.js）——
// 《椒麻江湖》第四章「麻婆岭」对白（游戏设计 Bot）
// 格式对齐 dialogue_ch3.js / game-m4 dialogue.js；接第三章金花椒钩子。
// 场景建议：village（花椒寨，背景 bg_village）
// 交互点：jiaonong（老椒农）、field（椒田地界）、cliff（崖顶野椒）、wok（寨中大锅）、madawang（麻大王）
// 素材：art/ch4/ → bg_village, npc_jiaonong(0.85), npc_madawang(1.05), icon_golden_pepper
// 战斗 id：madawang
// 小玩法（可选）：mediate 调解 / climb 采椒 / cook 做椒麻鸡

window.DIALOGUE_CH4 = {
  "speakers_add": {
    "jiaonong": { "name": "老椒农", "sprite": "npc_jiaonong", "color": "#5a6b2a" },
    "madawang": { "name": "麻大王", "sprite": "npc_madawang", "color": "#8a3a1a" },
    "nong_a": { "name": "东家椒农", "color": "#4a5a2a", "initial": "东" },
    "nong_b": { "name": "西家椒农", "color": "#5a4a2a", "initial": "西" }
  },

  "chapters_add": {
    "ch4": { "seal": "第四章", "title": "麻婆岭", "sub": "金花椒是信物。花椒寨里，有人在争地，有人在占山。" }
  },

  "sceneEnter": [
    { "scene": "village", "node": "VL_1", "ifNot": ["c4_arrived"] }
  ],

  "chapter4": {
    "name": "麻婆岭",
    "stages": [
      { "until": "c4_arrived",    "scene": "river",   "text": "跟着阿篙上岸，进麻婆岭花椒寨", "target": "path" },
      { "until": "c4_met_nong",   "scene": "village", "text": "寨口有位老椒农在晒花椒——去亮出金花椒", "target": "jiaonong" },
      { "until": "c4_quests",     "scene": "village", "text": "帮寨里办完三桩事，老椒农才肯说椒源", "checklist": [
          { "flag": "c4_e1_done", "text": "椒田 · 小满调解地界", "target": "field", "hero": "小满" },
          { "flag": "c4_e2_done", "text": "崖顶 · 飞飞采野椒", "target": "cliff", "hero": "飞飞" },
          { "flag": "c4_e3_done", "text": "大锅 · 胖弟做椒麻鸡", "target": "wok", "hero": "胖弟" } ] },
      { "until": "c4_talked",     "scene": "village", "text": "三桩事齐了——回去找老椒农", "target": "jiaonong" },
      { "until": "c4_mw_win",     "scene": "village", "text": "麻大王带人来强收椒园——上前拦下（打不过可以再来）", "target": "madawang" },
      { "until": "c4_reformed",   "scene": "village", "text": "问问麻大王，红汤帮主到底是谁", "target": "madawang" },
      { "until": "c4_finale",     "scene": "village", "text": "老椒农还有话要交代", "target": "jiaonong" }
    ],
    "done": "第四章完 · 下一站：红汤总舵。可以四处逛逛，也可以回主菜单。"
  },

  "entries": {
    "jiaonong": {
      "any": [
        { "node": "JN_1", "ifNot": ["c4_met_nong"] },
        { "node": "JN_mid", "if": ["c4_e1_done", "c4_e2_done", "c4_e3_done"], "ifNot": ["c4_talked"] },
        { "node": "JN_finale", "if": ["c4_reformed"], "ifNot": ["c4_finale"] },
        { "node": "JN_hint", "ifNot": ["c4_quests"] },
        { "node": "JN_idle" }
      ]
    },
    "field": {
      "any": [
        { "node": "FD_idle", "ifNot": ["c4_met_nong"] },
        { "node": "E1_1", "ifNot": ["c4_e1_done"] },
        { "node": "E1_after" }
      ]
    },
    "cliff": {
      "any": [
        { "node": "CL_idle", "ifNot": ["c4_met_nong"] },
        { "node": "E2_1", "ifNot": ["c4_e2_done"] },
        { "node": "E2_after" }
      ]
    },
    "wok": {
      "any": [
        { "node": "WK_idle", "ifNot": ["c4_met_nong"] },
        { "node": "E3_1", "ifNot": ["c4_e3_done"] },
        { "node": "E3_after" }
      ]
    },
    "madawang": {
      "any": [
        { "node": "MW_1", "if": ["c4_talked"], "ifNot": ["c4_mw_tried"] },
        { "node": "MW_retry", "if": ["c4_talked"], "ifNot": ["c4_mw_win"] },
        { "node": "MW_reform", "if": ["c4_mw_win"], "ifNot": ["c4_reformed"] },
        { "node": "MW_idle" }
      ]
    }
  },

  "nodes": {
    // —— 进场 ——
    "VL_1": { "speaker": "narrator", "text": "山路一转，花椒树成了林。寨门挂着干椒串，风一吹，满山都是麻香。", "set": ["c4_arrived"], "do": [{ "title": "ch4" }], "next": "VL_2" },
    "VL_2": { "speaker": "pangdi", "text": "（吸了一大口）我宣布：这里比老码头还香。", "next": "VL_3" },
    "VL_3": { "speaker": "feifei", "text": "金花椒是信物。先找认得它的人。" },

    // —— 老椒农 ——
    "JN_1": { "speaker": "jiaonong", "text": "（晒花椒的老汉抬眼）外乡人？……等等，你手里那颗——金色的？", "next": "JN_2" },
    "JN_2": { "speaker": "xiaoman", "text": "铁盒里捞出来的。纸条上写：椒源在麻婆岭。", "next": "JN_3" },
    "JN_3": { "speaker": "jiaonong", "text": "（双手接过，眼眶一热）满家祖上留下的信物……三十年了。你们是满家后人？", "next": "JN_4" },
    "JN_4": { "speaker": "xiaoman", "text": "我是小满。这两个是飞飞、胖弟。", "next": "JN_5" },
    "JN_5": { "speaker": "jiaonong", "text": "好。椒源的事我能说——可寨里正乱着：东家西家争地界，崖顶野椒没人敢采，今晚又该全寨开锅却没人掌勺。", "next": "JN_6" },
    "JN_6": { "speaker": "jiaonong", "text": "三桩事办完，我把椒源的来历、还有最近占山的那个“麻大王”，一并告诉你们。", "set": ["c4_met_nong"], "next": "JN_7" },
    "JN_7": { "speaker": "feifei", "text": "调解、采椒、掌勺。还是一人一桩。" },
    "JN_hint": { "speaker": "jiaonong", "text": "哪桩没办完，看右边“当前目标”。麻大王的人白日里少来，夜里就凶。" },
    "JN_idle": { "speaker": "jiaonong", "text": "花椒要晒透才香。人呢，也一样。" },

    // —— 小满调解地界 ——
    "FD_idle": { "speaker": "narrator", "text": "两垄椒田中间竖着一根歪木桩，两边的人正吵得脸红。", "next": null },
    "E1_1": { "speaker": "nong_a", "text": "这垄是我爹种的！木桩往西挪半尺都不成！", "next": "E1_1b" },
    "E1_1b": { "speaker": "nong_b", "text": "放屁！雨水冲的，桩本来就在东边！", "next": "E1_2" },
    "E1_2": { "speaker": "xiaoman", "text": "两位先停一停。满家旧规矩：地界以“椒根年轮”为准，不看木桩。",
      "do": [{ "minigame": "mediate", "win": "E1_win", "quit": "E1_quit" }] },
    "E1_quit": { "speaker": "xiaoman", "text": "再让我看看根。别急着拔桩。" },
    "E1_win": { "speaker": "xiaoman", "text": "东侧这棵年轮多一圈——地界在这儿。木桩挪回来，两边各让半垄做公田，秋天对半分。", "set": ["c4_e1_done"], "next": "E1_win2" },
    "E1_win2": { "speaker": "nong_a", "text": "……行。满家说话，我们听。", "next": "E1_win3" },
    "E1_win3": { "speaker": "nong_b", "text": "公田的椒，腌一坛寄给满掌柜！" },
    "E1_after": { "speaker": "narrator", "text": "木桩已经挪正，两边椒农并排除起草。" },

    // —— 飞飞采野椒 ——
    "CL_idle": { "speaker": "narrator", "text": "崖顶云雾来回刮，几丛野椒挂在石缝里，红得发亮。" },
    "E2_1": { "speaker": "jiaonong", "text": "野椒只生在崖顶。腿脚稳、眼力好的人，才能采够今晚开锅的分量。", "next": "E2_2" },
    "E2_2": { "speaker": "feifei", "text": "（推了推眼镜，折扇别在腰后）我去。",
      "do": [{ "minigame": "climb", "win": "E2_win", "quit": "E2_quit" }] },
    "E2_quit": { "speaker": "feifei", "text": "风太大。换条石缝再试。" },
    "E2_win": { "speaker": "narrator", "text": "飞飞踩着石棱上去，采下一小竹篓野椒，叶上还挂着露水。", "set": ["c4_e2_done", "item_wild_pepper"], "do": [{ "gain": "wild_pepper" }], "next": "E2_win2" },
    "E2_win2": { "speaker": "feifei", "text": "分量够了。胖弟，别偷吃。" },
    "E2_after": { "speaker": "narrator", "text": "竹篓搁在寨门边，麻香一路飘到锅台。" },

    // —— 胖弟做椒麻鸡 ——
    "WK_idle": { "speaker": "narrator", "text": "寨中心一口大铁锅，底下架着柴，还没人点火。" },
    "E3_1": { "speaker": "jiaonong", "text": "今晚全寨聚餐。有野椒、有土鸡——就缺个会颠勺的。", "next": "E3_2" },
    "E3_2": { "speaker": "pangdi", "text": "（抄起锅铲）交给我。秘方在心里，胃在锅边。",
      "do": [{ "minigame": "cook", "win": "E3_win", "quit": "E3_quit" }] },
    "E3_quit": { "speaker": "pangdi", "text": "火候差一点……再来！我不信颠不起来！" },
    "E3_win": { "speaker": "narrator", "text": "锅气冲天。一勺定乾坤——椒麻鸡色红油亮，寨里的娃都围过来了。", "set": ["c4_e3_done"], "do": [{ "card": "dish" }], "next": "E3_win2" },
    "E3_win2": { "speaker": "pangdi", "text": "（尝了一口，眼泪汪汪）麻……对了。就是这个麻。", "next": "E3_win3" },
    "E3_win3": { "speaker": "jiaonong", "text": "好手艺。满家的锅，没丢。" },
    "E3_after": { "speaker": "narrator", "text": "大锅还在余温里响，空碗码了一摞。" },

    // —— 三事齐：老椒农揭幕，麻大王杀到 ——
    "JN_mid": { "speaker": "jiaonong", "text": "地界和了，野椒有了，锅也香了。该说正事。", "set": ["c4_quests", "c4_talked"], "next": "JN_mid2" },
    "JN_mid2": { "speaker": "jiaonong", "text": "椒源就在寨后那片老林。金花椒是钥匙——只有满家人种得活母株。", "next": "JN_mid3" },
    "JN_mid3": { "speaker": "jiaonong", "text": "可近来有个自称“麻大王”的，带人占山，要强收椒园。我疑心他背后——", "next": "JN_mid4" },
    "JN_mid4": { "speaker": "narrator", "text": "寨门外蹄声乱响。一个披红大氅的壮汉踹开寨门，身后跟着一串打手。", "next": "JN_mid5" },
    "JN_mid5": { "speaker": "madawang", "text": "老东西还在磨嘴皮？今日起，麻婆岭的椒，归我麻大王！" },

    // —— 麻大王战斗 ——
    "MW_1": { "speaker": "madawang", "text": "哪来的三个娃娃？滚——或者留下金花椒，给我当投名状！", "set": ["c4_mw_tried"], "next": "MW_2" },
    "MW_2": { "speaker": "xiaoman", "text": "金花椒是满家的。椒园也是寨里的。", "next": "MW_3" },
    "MW_3": { "speaker": "madawang", "text": "嘴硬！让你们尝尝什么叫“十成麻”！",
      "options": [
        { "text": "迎战！（进入战斗）", "do": [{ "battle": "madawang" }], "next": null },
        { "text": "先退一步，准备一下", "next": null }
      ] },
    "MW_retry": { "speaker": "madawang", "text": "还敢回来？麻劲还没过呢！",
      "options": [
        { "text": "再战！（进入战斗）", "do": [{ "battle": "madawang" }], "next": null },
        { "text": "先退一步", "next": null }
      ] },

    // —— 战后改邪归正 ——
    "MW_reform": { "speaker": "madawang", "text": "（坐在地上喘）……打不过。金花椒……你们收好。", "next": "MW_r2" },
    "MW_r2": { "speaker": "feifei", "text": "谁让你来占山的？", "next": "MW_r3" },
    "MW_r3": { "speaker": "madawang", "text": "红汤帮主。他给银子，要我把椒源霸住，不让满家靠近。", "next": "MW_r4" },
    "MW_r4": { "speaker": "xiaoman", "text": "帮主是谁？", "next": "MW_r5" },
    "MW_r5": { "speaker": "madawang", "text": "城里红汤总舵的大酒楼。帮主从不露真名……手下都叫他“赤爷”。说是火锅行里的旧人。", "set": ["c4_reformed"], "next": "MW_r6" },
    "MW_r6": { "speaker": "pangdi", "text": "火锅行旧人？听着像我们那行的。", "next": "MW_r7" },
    "MW_r7": { "speaker": "madawang", "text": "我错了。金花椒还你们，椒园我不管了。——以后要打红汤帮，喊一声，我麻大王说话算数。" },
    "MW_idle": { "speaker": "madawang", "text": "（揉着肩膀）十成麻……下次我请客。" },

    // —— 章末钩子 ——
    "JN_finale": { "speaker": "jiaonong", "text": "赤爷……红汤总舵。你们若要问个明白，就得进那座大酒楼。", "next": "JN_f2" },
    "JN_f2": { "speaker": "jiaonong", "text": "金花椒收好。母株的事，等满家没事了，我再教你们种。", "next": "JN_f3" },
    "JN_f3": { "speaker": "xiaoman", "text": "谢过前辈。下一站——红汤总舵。", "next": "JN_f4" },
    "JN_f4": { "speaker": "feifei", "text": "城里大酒楼，混进去不难。难的是活着问出真名。", "next": "JN_f5" },
    "JN_f5": { "speaker": "pangdi", "text": "后厨我熟。到时候我负责——吃。不对，探。", "set": ["c4_finale"], "do": [{ "finale": "ch4" }] }
  },

  "props_note": {
    "wild_pepper": { "name": "崖顶野椒", "desc": "石缝里采下的野椒，今晚开锅用。" },
    "golden_pepper": { "name": "金花椒", "desc": "满家信物，花椒寨认它。" }
  },

  "battle_note": {
    "madawang": {
      "name": "麻大王",
      "sprite": "npc_madawang",
      "hint": "占山Boss，战后改邪归正并供出赤爷/红汤总舵。height 1.05",
      "height": 1.05
    }
  },

  "minigame_note": {
    "mediate": "选对地界依据（年轮/木桩/抛硬币），选年轮即胜；或直接跳 E1_win",
    "climb": "崖顶时机跳跃/点选安全石缝；或直接跳 E2_win",
    "cook": "颠勺节奏（可复用 wok）；或直接跳 E3_win"
  }
};

(function () {
  var D = window.DIALOGUE, C4 = window.DIALOGUE_CH4;
  if (!D || !C4) return;
  var k;
  if (C4.speakers_add) for (k in C4.speakers_add) D.speakers[k] = C4.speakers_add[k];
  if (C4.chapters_add) for (k in C4.chapters_add) D.chapters[k] = C4.chapters_add[k];
  if (C4.sceneEnter) D.sceneEnter = (D.sceneEnter || []).concat(C4.sceneEnter);
  if (C4.chapter4) D.chapter4 = C4.chapter4;
  if (C4.entries) {
    for (k in C4.entries) {
      if (!D.entries[k]) D.entries[k] = C4.entries[k];
      else {
        var src = C4.entries[k], dst = D.entries[k];
        ["any", "talk", "look"].forEach(function (a) {
          if (src[a]) dst[a] = (dst[a] || []).concat(src[a]);
        });
      }
    }
  }
  if (C4.nodes) for (k in C4.nodes) D.nodes[k] = C4.nodes[k];
  // 寨中开锅用专属宴席卡，不用第二章新菜卡
  if (D.nodes.E3_win && D.nodes.E3_win.do) {
    D.nodes.E3_win.do = D.nodes.E3_win.do.map(function (c) {
      return c.card === "dish" ? { card: "feast" } : c;
    });
  }
})();


// 《椒麻江湖》第五章「红汤总舵」对白（游戏设计 Bot）
// 接第四章钩子：赤爷 / 红汤总舵。格式对齐 dialogue_ch3/ch4.js。
// 场景建议：hq（红汤总舵大酒楼，背景 bg_hq；大鼎角落需碰撞）
// 交互点：gate（门房）、ledger（账房）、poet（门客席）、kitchen（后厨）、cauldron（红汤大鼎）、chilaosan（赤老三）
// 素材：/workspace/art/ch5/ → bg_hq, npc_chilaosan(1.0), prop_red_cauldron
// 战斗 id：chilaosan（可逃跑/留战帖，不必击杀）
// 小玩法（可选）：ledger 假账 / poem 比诗 / kitchen 帮工

window.DIALOGUE_CH5 = {
  "speakers_add": {
    "chilaosan": { "name": "赤老三", "sprite": "npc_chilaosan", "color": "#a01818" },
    "menfang":   { "name": "门房", "color": "#5a3a2a", "initial": "门" },
    "menke":     { "name": "门客", "color": "#3a4a6a", "initial": "客" },
    "chufang":   { "name": "厨头", "color": "#6a4a2a", "initial": "厨" }
  },

  "chapters_add": {
    "ch5": { "seal": "第五章", "title": "红汤总舵", "sub": "城里大酒楼，后院一口终年沸腾的红汤大鼎。帮主，是旧相识。" }
  },

  "sceneEnter": [
    { "scene": "hq", "node": "HQ_1", "ifNot": ["c5_arrived"] }
  ],

  "chapter5": {
    "name": "红汤总舵",
    "stages": [
      { "until": "c5_arrived",   "scene": "village", "text": "出麻婆岭，去城里的红汤总舵大酒楼", "target": "path" },
      { "until": "c5_inside",    "scene": "hq", "text": "混进酒楼——门房在查人", "target": "gate" },
      { "until": "c5_quests",    "scene": "hq", "text": "三人分头探听帮主真名", "checklist": [
          { "flag": "c5_e1_done", "text": "账房 · 小满假扮账房", "target": "ledger", "hero": "小满" },
          { "flag": "c5_e2_done", "text": "雅座 · 飞飞比诗套话", "target": "poet", "hero": "飞飞" },
          { "flag": "c5_e3_done", "text": "后厨 · 胖弟当帮工", "target": "kitchen", "hero": "胖弟" } ] },
      { "until": "c5_truth",     "scene": "hq", "text": "三条线的消息齐了——到大鼎前会合", "target": "cauldron" },
      { "until": "c5_fought",    "scene": "hq", "text": "赤老三在大鼎前等着——上前对质（打不过可以再来）", "target": "chilaosan" },
      { "until": "c5_finale",    "scene": "hq", "text": "看看他留下的战帖", "target": "cauldron" }
    ],
    "done": "第五章完 · 下一站：天下第一锅。可以四处逛逛，也可以回主菜单。"
  },

  "entries": {
    "gate": {
      "any": [
        { "node": "GT_1", "ifNot": ["c5_inside"] },
        { "node": "GT_idle" }
      ]
    },
    "ledger": {
      "any": [
        { "node": "LD_idle", "ifNot": ["c5_inside"] },
        { "node": "E1_1", "ifNot": ["c5_e1_done"] },
        { "node": "E1_after" }
      ]
    },
    "poet": {
      "any": [
        { "node": "PT_idle", "ifNot": ["c5_inside"] },
        { "node": "E2_1", "ifNot": ["c5_e2_done"] },
        { "node": "E2_after" }
      ]
    },
    "kitchen": {
      "any": [
        { "node": "KT_idle", "ifNot": ["c5_inside"] },
        { "node": "E3_1", "ifNot": ["c5_e3_done"] },
        { "node": "E3_after" }
      ]
    },
    "cauldron": {
      "any": [
        { "node": "CD_wait", "ifNot": ["c5_e1_done", "c5_e2_done", "c5_e3_done"] },
        { "node": "TRUTH_1", "if": ["c5_e1_done", "c5_e2_done", "c5_e3_done"], "ifNot": ["c5_truth"] },
        { "node": "POST_1", "if": ["c5_fought"], "ifNot": ["c5_finale"] },
        { "node": "CD_look" }
      ],
      "look": [ { "node": "CD_look" } ]
    },
    "chilaosan": {
      "any": [
        { "node": "CL_1", "if": ["c5_truth"], "ifNot": ["c5_cl_tried"] },
        { "node": "CL_retry", "if": ["c5_truth"], "ifNot": ["c5_fought"] },
        { "node": "CL_gone" }
      ]
    }
  },

  "nodes": {
    // —— 进场 ——
    "HQ_1": { "speaker": "narrator", "text": "红灯笼排到巷尾。金匾上三个大字：红汤楼。后院热气冲天，像一口永远滚着的锅。", "set": ["c5_arrived"], "do": [{ "title": "ch5" }], "next": "HQ_2" },
    "HQ_2": { "speaker": "feifei", "text": "麻大王说的总舵。硬闯会被轰出去——得分头混进去。", "next": "HQ_3" },
    "HQ_3": { "speaker": "pangdi", "text": "我负责后厨。闻到味儿了。" },

    // —— 混进门 ——
    "GT_1": { "speaker": "menfang", "text": "站住！今晚帮主宴客，生人免进。——报上名号。", "next": "GT_2" },
    "GT_2": {
      "speaker": "xiaoman", "text": "我们……",
      "options": [
        { "text": "小满：新来的账房学徒", "next": "GT_ok" },
        { "text": "飞飞：慕名来赴诗宴的文友", "next": "GT_ok" },
        { "text": "胖弟：后厨缺的帮工（厨头托的）", "next": "GT_ok" }
      ]
    },
    "GT_ok": { "speaker": "menfang", "text": "……行。账房往后院东厢，雅座在二楼，后厨走侧门。别瞎逛。", "set": ["c5_inside"], "next": "GT_ok2" },
    "GT_ok2": { "speaker": "feifei", "text": "一人一线。探到帮主真名，大鼎前会合。" },
    "GT_idle": { "speaker": "menfang", "text": "进去就别出来晃。帮主不爱吵。" },

    // —— 小满：假扮账房 ——
    "LD_idle": { "speaker": "narrator", "text": "东厢账房堆着算盘和红册。桌上压着未写完的一页。" },
    "E1_1": { "speaker": "narrator", "text": "账房先生出去了。红册翻开在「人事」一栏，帮主名讳处只写了两个字的代号。", "next": "E1_2" },
    "E1_2": { "speaker": "xiaoman", "text": "（压低声音）把假账改平，顺便把这栏看清楚……",
      "do": [{ "minigame": "ledger", "win": "E1_win", "quit": "E1_quit" }] },
    "E1_quit": { "speaker": "xiaoman", "text": "有脚步声。先合上。" },
    "E1_win": { "speaker": "xiaoman", "text": "（合上红册）代号「赤爷」——旁注：旧名「赤老三」，满记火锅旧徒。", "set": ["c5_e1_done", "clue_name"], "next": "E1_win2" },
    "E1_win2": { "speaker": "xiaoman", "text": "……是爷爷的徒弟。" },
    "E1_after": { "speaker": "narrator", "text": "算盘珠静静躺着。假账已经改平。" },

    // —— 飞飞：比诗套话 ——
    "PT_idle": { "speaker": "narrator", "text": "二楼雅座里，门客摇着扇子对诗，桌上摆着半壶烧酒。" },
    "E2_1": { "speaker": "menke", "text": "新来的文友？对上三句，我请你喝。——起句：「红汤翻滚独占鳌——」",
      "do": [{ "minigame": "poem", "win": "E2_win", "quit": "E2_quit" }] },
    "E2_quit": { "speaker": "feifei", "text": "再斟酌一句。急不得。" },
    "E2_win": { "speaker": "feifei", "text": "「青史留名问谁高。」——敢问帮主平日可有雅号？", "next": "E2_win2" },
    "E2_win2": { "speaker": "menke", "text": "（酒意上脸）嘿，我们只敢叫赤爷。听师父那辈的人说，他年轻时在满记学艺，后来……不提也罢。", "set": ["c5_e2_done", "clue_past"], "next": "E2_win3" },
    "E2_win3": { "speaker": "feifei", "text": "「后来」——被逐出师门？", "next": "E2_win4" },
    "E2_win4": { "speaker": "menke", "text": "嘘！你自己去后院大鼎前听。今夜帮主要在那儿训话。" },
    "E2_after": { "speaker": "narrator", "text": "雅座里又响起下一轮起句，飞飞已经下楼了。" },

    // —— 胖弟：后厨帮工 ——
    "KT_idle": { "speaker": "narrator", "text": "侧门一推，热浪扑面。红油锅排成一排，厨头正缺人手。" },
    "E3_1": { "speaker": "chufang", "text": "新帮工？来得正好——把那三口锅颠匀，别糊底！", "next": "E3_2" },
    "E3_2": { "speaker": "pangdi", "text": "（挽袖）颠勺我专业。",
      "do": [{ "minigame": "kitchen", "win": "E3_win", "quit": "E3_quit" }] },
    "E3_quit": { "speaker": "pangdi", "text": "糊了一点……再来！我能救！" },
    "E3_win": { "speaker": "chufang", "text": "好手艺！……哎，你这手法，像满记出来的。", "set": ["c5_e3_done", "clue_theft"], "next": "E3_win2" },
    "E3_win2": { "speaker": "pangdi", "text": "（假装擦汗）厨头抬举。听没听过——昨夜去满记「取」锦囊的事？", "next": "E3_win3" },
    "E3_win3": { "speaker": "chufang", "text": "（四下看看）那是赤爷亲定的。说满记欠他一道方子。打手回来交了差，锦囊却……反正帮主今夜要在大鼎前发话。" },
    "E3_after": { "speaker": "narrator", "text": "后厨依旧嘈杂。胖弟袖口沾着一滴红油。" },

    // —— 大鼎会合：揭真相 ——
    "CD_wait": { "speaker": "narrator", "text": "后院正中一口红汤大鼎，蒸汽把梁柱都染红了。还不到会合的时候。" },
    "CD_look": { "speaker": "narrator", "text": "大鼎终年沸腾，汤面翻着深红色的浪。鼎足铸着歪歪的「赤」字。" },
    "TRUTH_1": { "speaker": "feifei", "text": "齐了。账册写旧名赤老三，门客说他是满记旧徒，厨头说偷锦囊是他亲定。", "set": ["c5_quests", "c5_truth"], "next": "TRUTH_2" },
    "TRUTH_2": { "speaker": "xiaoman", "text": "爷爷的徒弟……被逐出师门的那个。", "next": "TRUTH_3" },
    "TRUTH_3": { "speaker": "pangdi", "text": "所以他恨满家，恨到要偷方子、占椒源？", "next": "TRUTH_4" },
    "TRUTH_4": { "speaker": "narrator", "text": "鼎后脚步声响。一个红衣瘦高的中年人走到鼎边，目光扫过三人。", "next": "TRUTH_5" },
    "TRUTH_5": { "speaker": "chilaosan", "text": "满记的小辈。金花椒也带来了？……也好。今晚，把账算清。" },

    // —— 赤老三交手 ——
    "CL_1": { "speaker": "chilaosan", "text": "你爷爷逐我出门那天说：心术不正，不配掌勺。三十年了，我偏要证明——红汤也能压过椒麻！", "set": ["c5_cl_tried"], "next": "CL_2" },
    "CL_2": { "speaker": "xiaoman", "text": "偷锦囊、买通麻大王、派铁算盘拦船——这叫证明？", "next": "CL_3" },
    "CL_3": { "speaker": "chilaosan", "text": "少废话！大鼎之前，见真章！",
      "options": [
        { "text": "迎战！（进入战斗）", "do": [{ "battle": "chilaosan" }], "next": null },
        { "text": "先退一步，准备一下", "next": null }
      ] },
    "CL_retry": { "speaker": "chilaosan", "text": "还敢回来？红汤可不是请客的！",
      "options": [
        { "text": "再战！（进入战斗）", "do": [{ "battle": "chilaosan" }], "next": null },
        { "text": "先退一步", "next": null }
      ] },
    "CL_gone": { "speaker": "narrator", "text": "鼎边只剩一缕热气和一张未收的纸。" },

    // —— 战后：逃走 + 战帖 ——
    "POST_1": { "speaker": "chilaosan", "text": "（退到侧门，咬牙）今晚不算！城中「天下第一锅」大赛——擂台见！谁赢，谁就是火锅行的话事人！", "next": "POST_2" },
    "POST_2": { "speaker": "narrator", "text": "赤老三骂着消失在巷子里。鼎边飘落一张战帖，朱砂写着：「天下第一锅，见真章。」", "set": ["c5_fought", "item_challenge"], "do": [{ "gain": "challenge" }], "next": "POST_3" },
    "POST_3": { "speaker": "feifei", "text": "他跑了。但战帖是真的。", "next": "POST_4" },
    "POST_4": { "speaker": "pangdi", "text": "天下第一锅……我好像在码头海报上看过。", "next": "POST_5" },
    "POST_5": { "speaker": "xiaoman", "text": "那就赴约。方子、金花椒、还有满家的锅——一并带上。", "set": ["c5_finale"], "do": [{ "finale": true }] }
  },

  "props_note": {
    "challenge": { "name": "天下第一锅战帖", "desc": "赤老三留下的朱砂战帖：擂台见真章。" }
  },

  "battle_note": {
    "chilaosan": {
      "name": "赤老三",
      "sprite": "npc_chilaosan",
      "hint": "章末一战；战后逃跑并留战帖，不必做成击杀结算。height 1.0。bg 可用 bg_hq，道具 prop_red_cauldron 作场景摆件（角落碰撞）。",
      "height": 1.0
    }
  },

  "minigame_note": {
    "ledger": "改平三笔假账 / 点选正确人名；或直接跳 E1_win",
    "poem": "对诗三句（可复用 song/duel）；或直接跳 E2_win",
    "kitchen": "颠勺节奏（可复用 wok）；或直接跳 E3_win"
  }
};

(function () {
  var D = window.DIALOGUE, C5 = window.DIALOGUE_CH5;
  if (!D || !C5) return;
  var k;
  if (C5.speakers_add) for (k in C5.speakers_add) D.speakers[k] = C5.speakers_add[k];
  if (C5.chapters_add) for (k in C5.chapters_add) D.chapters[k] = C5.chapters_add[k];
  if (C5.sceneEnter) D.sceneEnter = (D.sceneEnter || []).concat(C5.sceneEnter);
  if (C5.chapter5) D.chapter5 = C5.chapter5;
  if (C5.entries) {
    for (k in C5.entries) {
      if (!D.entries[k]) D.entries[k] = C5.entries[k];
      else {
        var src = C5.entries[k], dst = D.entries[k];
        ["any", "talk", "look"].forEach(function (a) {
          if (src[a]) dst[a] = (dst[a] || []).concat(src[a]);
        });
      }
    }
  }
  if (C5.nodes) for (k in C5.nodes) D.nodes[k] = C5.nodes[k];
})();
