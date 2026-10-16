// 《椒麻江湖》第二章小玩法数据（数据驱动，文字和参数都可以直接改）。
// perfectFlag：一次没错时额外设置的 flag（成就用）；doneFlag / gain：完成时设置的 flag / 获得的道具。
window.MINIGAMES = {
  // 委托一：认家徽——对照锦囊上的绣纹（被熏花了、还歪着），从一箱铜牌里挑出真家徽。认错可以一直重认。
  // 家徽参数：ring 外圈道数，petals 椒叶片数，center 正中纹样（jiao 花椒三粒 / flame 火焰 / dot 圆点），notch 是否缺一角（像锁眼）。
  "emblem": {
    "title": "认家徽 · 古玩摊", "perfectFlag": "c2_e1_perfect",
    "who": "小满",
    "tip": "左边是锦囊上的家徽绣纹（熏花了，还绣歪了）。从老周的箱子里挑出与它一模一样的那块铜牌。",
    "refLabel": "锦囊绣纹",
    "answer": { "ring": 2, "petals": 3, "center": "jiao", "notch": true },
    "options": [
      { "ring": 2, "petals": 3, "center": "jiao",  "notch": true },
      { "ring": 1, "petals": 3, "center": "jiao",  "notch": true },
      { "ring": 2, "petals": 4, "center": "jiao",  "notch": true },
      { "ring": 2, "petals": 3, "center": "flame", "notch": true },
      { "ring": 2, "petals": 3, "center": "jiao",  "notch": false },
      { "ring": 1, "petals": 5, "center": "dot",   "notch": true }
    ],
    "hints": {
      "ring":   "不对——数数外圈有几道。",
      "petals": "不对——数数椒叶有几片。",
      "center": "不对——看看正中间刻的是什么。",
      "notch":  "不对——满家家徽的纹路缺了一角，像个锁眼。"
    },
    "win": "就是它！"
  },

  // 委托二：比口才——钱先生连出三阵，每阵三个回答，答对他的气势掉一格；答错被噎住，本阵重来。
  "duel": {
    "title": "比口才 · 灯谜摊", "perfectFlag": "c2_e2_perfect",
    "who": "飞飞",
    "foe": "钱先生",
    "rounds": [
      { "label": "第一阵 · 猜灯谜", "line": "“一口咬掉牛尾巴”——打一字。",
        "options": [
          { "text": "是个“告”字：一口，加上没了尾巴的牛。", "ok": true,  "reply": "嗬，有两下子。" },
          { "text": "是个“吃”字，咬嘛。",                   "ok": false, "reply": "吃什么吃，牛尾巴还在呢！重来。" },
          { "text": "是个“牛”字，尾巴咬掉还是牛。",         "ok": false, "reply": "牛是牛，字可不对。重来。" } ] },
      { "label": "第二阵 · 对对子", "line": "上联：“码头灯火千家亮”。",
        "options": [
          { "text": "天上星星一闪闪。",       "ok": false, "reply": "这是儿歌，不是对子。重来。" },
          { "text": "我家火锅最好吃。",       "ok": false, "reply": "平仄呢？对仗呢？重来！" },
          { "text": "锅里红汤万户香。",       "ok": true,  "reply": "……对得工整。" } ] },
      { "label": "第三阵 · 斗嘴", "line": "“毛头小娃，也懂江湖？”",
        "options": [
          { "text": "我、我回去问问掌柜……",                         "ok": false, "reply": "哈哈哈，回家喝奶去吧！重来。" },
          { "text": "江湖不看年纪，看嘴上功夫，也看心里分寸。",       "ok": true,  "reply": "（折扇一合）……说得好。" },
          { "text": "你才毛头！你全家都毛头！",                       "ok": false, "reply": "急了急了。重来。" } ] }
    ],
    "win": "三阵全胜！钱先生的扇子都不摇了。"
  },

  // 委托三：颠勺——指针在刻度上来回摆，落进金色区间时点“颠！”（或按空格）。
  // 颠成 need 下赢；失手 maxMiss 次这锅糊了，可以重来。每颠成一下，指针更快、金区更窄。
  "wok": {
    "title": "颠勺 · 炒锅摊", "perfectFlag": "c2_e3_perfect",
    "who": "胖弟",
    "tip": "指针摆进金色区间时，点“颠！”或按空格。",
    "need": 5, "maxMiss": 3,
    "speed": 0.8, "speedUp": 0.14,
    "zone": 0.24, "zoneShrink": 0.025, "zoneMin": 0.14,
    "hit": ["好！", "漂亮！", "稳！", "香！", "绝了！"],
    "miss": "锅铲一歪，辣子撒了一地！",
    "fail": "这锅糊了……辣不怕：“没事，再来一锅！”",
    "win": "十成辣子鸡出锅！整条码头都在咳嗽。"
  },

  // 合成秘方：两半方子对上撕口，点“合璧”。
  "combine": {
    "title": "合璧 · 椒麻秘方", "doneFlag": "c2_combined", "gain": "recipe_full",
    "left": "半张方子 · 锦囊",
    "right": "另一半 · 老板娘",
    "btn": "合　璧",
    "fullTitle": "满家椒麻秘方",
    "lines": ["主料：三年土鸡一只，斩块冷水下锅", "麻：汉源贡椒二两，青花椒一两", "辣：二荆条、朝天椒各半，热油激香",
              "汤：老鹰茶汤吊底，文火一炷香", "诀：椒麻要配茶，方子要配人"],
    "done": "收　好"
  }
};
