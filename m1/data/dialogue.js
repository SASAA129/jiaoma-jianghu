// 《椒麻江湖》对白数据（数据驱动，逻辑里不写死台词）
// 节点字段：speaker 说话人 id；text 文本；next 下一节点；options 选项（2~3 个）；
//   if / ifNot：触发条件 flag 数组（不满足时跳到 else 节点，没有 else 就结束）；
//   set：进入该节点时设置的 flag；选项里也可以写 if / ifNot / set / next。
// entries：交互点 → 动作(talk 交谈 / look 查看) → 候选起始节点，按顺序取第一个条件满足的。
window.DIALOGUE = {
  "speakers": {
    "xiaoman":  { "name": "小满",   "sprite": "char_xiaoman" },
    "feifei":   { "name": "飞飞",   "sprite": "char_feifei" },
    "pangdi":   { "name": "胖弟",   "sprite": "char_pangdi" },
    "zhanggui": { "name": "满掌柜", "sprite": "npc_zhanggui" },
    "narrator": { "name": "旁白" }
  },
  "entries": {
    "sign": {
      "look": [ { "node": "sign_look" } ],
      "talk": [ { "node": "sign_talk" } ]
    },
    "table": {
      "look": [
        { "node": "table_after_eat", "if": ["ate_hotpot"] },
        { "node": "table_look" }
      ],
      "talk": [
        { "node": "table_after_eat", "if": ["ate_hotpot"] },
        { "node": "table_pangdi" }
      ]
    },
    "zhanggui": {
      "talk": [
        { "node": "zg_again", "if": ["heard_jinnang"] },
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

    "zg_look": { "speaker": "narrator", "text": "满掌柜攥着算盘，眉头拧成了一个结。" },
    "zg_1": { "speaker": "zhanggui", "text": "小满！你们可算回来了。", "next": "zg_2" },
    "zg_2": { "speaker": "zhanggui", "text": "咱家的秘方锦囊……昨夜不见了！", "set": ["heard_jinnang"], "next": "zg_3" },
    "zg_3": { "speaker": "xiaoman",  "text": "什么？那可是祖传三代的方子！", "next": "zg_4" },
    "zg_4": {
      "speaker": "zhanggui", "text": "锦囊一丢，这招牌怕是保不住了。你们……",
      "options": [
        { "text": "我们这就去查！", "next": "zg_tbc" },
        { "text": "昨夜有谁来过？", "next": "zg_tbc" },
        { "text": "先吃口火锅再说", "next": "zg_tbc" }
      ]
    },
    "zg_tbc":   { "speaker": "narrator", "text": "（待续——冒险分支将在下个版本开放）" },
    "zg_again": { "speaker": "zhanggui", "text": "锦囊的事，就拜托你们了。", "next": "zg_tbc" }
  }
};
