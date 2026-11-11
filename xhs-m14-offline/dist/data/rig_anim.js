// M9 骨骼动画参数（数据文件，可调）。角度单位：度；像素单位：原画布像素（1024×1536 立绘），运行时 × prepScale × spriteScale。
// 步态与位移同步：基础速度下一个 walk 循环 = cycleMs，跟随者走得快时步频按速度同比加快（不滑步）。
// 左右一律按画面：armL = 画面左侧手臂，armR = 画面右侧。
// 骨骼动画白名单：默认只有这些角色走骨骼（M10：小满 + 飞飞 + 胖弟；其他 NPC 继续整图）。?rig=all 启用全员运行时切图（实验），?rig=0 全关。
window.RIG_CHARS = ['xiaoman', 'feifei', 'pangdi'];
window.RIG_ANIM = {
  "RIG_CHARS": window.RIG_CHARS,
  "default": {
    "cycleMs": 600,        // walk 循环
    "legDeg": 7,           // 腿摆幅
    "legMaxDeg": 12,       // 腿摆幅上限（长袍下摆盖住靴子）
    "armDeg": 8,           // 空手臂摆幅（与同侧腿反向）
    "headDeg": 1.5,        // 走路时头部滞后摆动
    "torsoDeg": 0.8,       // 躯干轻摇
    "bobPx": 6,            // 起伏（双腿分开时最低）
    "breathPx": 2,         // idle 呼吸
    "breathMs": 1800,      // idle 呼吸周期
    "idleArmDeg": 1.2,     // idle 手臂微摆
    "idleHeadDeg": 1,      // idle 头部微动
    "npcHeadDeg": 2.2      // NPC 待机转头
  },
  // 每角色覆盖。arms: 每只手臂的摆幅（度），握道具的手臂摆得少。
  "xiaoman": { "arms": { "armL": 3, "armR": 8 } },  // 【锁定】画面左侧手臂胸前握令牌，层级最上，只摆 ±3°；其余全用 default（600ms / 腿7°≤12° / 起伏6 / 呼吸2·1800）
  // M10 飞飞：短打长衫，裤腿露得多，步子轻快（参数取自 art/ch7/rig/feifei/rig.json 的 walk_hint / idle_hint）
  "feifei": { "cycleMs": 520, "legDeg": 8, "legMaxDeg": 12, "arms": { "armL": 3, "armR": 10 }, "headDeg": 2, "bobPx": 5,
              "breathPx": 2, "breathMs": 1600, "idleHeadDeg": 1.5,
              "backArms": { "armL": 6, "armR": 6 } },          // 背面（运行时切图）：两手自然下垂，小幅摆
  // M10 胖弟：体型壮，步频慢、起伏大；腿超过 8° 裆部露缝 → 锁死 ±6°；画面左侧扛大勺只摆 ±2°（勺随臂转），右手插兜 ±8°
  "pangdi": { "cycleMs": 680, "legDeg": 6, "legMaxDeg": 6, "arms": { "armL": 2, "armR": 8 }, "headDeg": 1.5, "bobPx": 8,
              "breathPx": 3, "breathMs": 2000, "idleHeadDeg": 1,
              "backArms": { "armL": 6, "armR": 0 } }           // 背面：扛勺手在画面右侧不摆（勺头切在头部块里，跟着身体走）
};
