// 《椒麻江湖》对白数据（数据驱动，逻辑里不写死台词）
// ※ M2 三条分支线的对白是程序员 Bot 起草的【草稿】，美术/策划可直接改这个文件里的文字，不用动代码。
//
// 节点字段：speaker 说话人 id；text 文本；next 下一节点；options 选项（2~3 个，可写 if/ifNot/set/clear/do/next/doneFlag）；
//   if / ifNot：触发条件 flag 数组（不满足时跳到 else 节点，没有 else 就结束）；
//   set / clear：进入该节点时设置 / 清除的 flag；
//   do：剧情指令数组，{"route":"A"} 开始某条线并切队长，{"ending":"A"} 对话结束后弹结局卡，{"leader":"feifei"} 切队长；
//   选项 doneFlag：该 flag 为真时在选项上盖“已完”印章。
// entries：交互点 → 动作(any 交谈和查看都先查这里 / talk 交谈 / look 查看) → 候选起始节点，按顺序取第一个条件满足的。
// routes：三条线的元数据和目标（探索面板按 stages 顺序显示第一个 until 未达成的目标）。
// endings：结局卡内容。
// 所有 flag 都会存进 localStorage（键 jiaoma_jianghu_m2），刷新后恢复。
window.DIALOGUE = {
  "speakers": {
    "xiaoman":  { "name": "小满",   "sprite": "char_xiaoman" },
    "feifei":   { "name": "飞飞",   "sprite": "char_feifei" },
    "pangdi":   { "name": "胖弟",   "sprite": "char_pangdi" },
    "zhanggui": { "name": "满掌柜", "sprite": "npc_zhanggui" },
    "labupa":   { "name": "辣不怕", "color": "#8e1d14" },
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
    { "if": ["end_B"], "ifNot": ["battle_B_win", "route_A", "route_B", "route_C"], "text": "戌时三刻——到“椒麻鸡火锅”招牌下迎战辣不怕（M3 战斗）", "target": "sign" }
  ],

  "endings": {
    "A": { "title": "家徽之谜", "hero": "char_xiaoman",
      "lines": ["锦囊根本没丢——那是满家祖传的考题，只有带着家徽的人才打得开招牌后的机关。",
                "小满一言不发地把锦囊收进怀里。满掌柜偷偷抹了把眼角：“第四代，稳了。”"],
      "reward": "获得称号【家徽传人】 · 道具「熏香的秘方锦囊」" },
    "B": { "title": "江湖食客的吃辣挑战", "hero": "char_feifei", "m3": true,
      "lines": ["江湖食客“辣不怕”应下了战约：明晚戌时三刻，十成椒麻，一决胜负。",
                "飞飞合上折扇，推了推眼镜：“锦囊，我会亲手拿回来。”胖弟已经在偷偷练习吸气了。"],
      "reward": "获得称号【以扇扇辣】 · 道具「辣不怕的战帖」" },
    "C": { "title": "后厨异响", "hero": "char_pangdi",
      "lines": ["锦囊失踪案告破：凶手是店里的黄猫“椒椒”，被锦囊上的卤香勾了魂。",
                "胖弟一勺定乾坤，从此后厨的老鼠都绕着他走。"],
      "reward": "获得称号【后厨守护者】 · 道具「沾着卤汁的锦囊」" }
  },

  "entries": {
    "sign": {
      "any": [
        { "node": "A2_1", "if": ["route_A", "A_1"], "ifNot": ["A_2"] },
        { "node": "B3_1", "if": ["route_B", "B_2"], "ifNot": ["B_3"] },
        { "node": "B5_1", "if": ["end_B"], "ifNot": ["battle_B_win", "route_A", "route_B", "route_C"] }
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
    "C4_2": { "speaker": "pangdi",   "text": "它吃得比我还好……", "do": [{ "ending": "C" }] }
  }
};
