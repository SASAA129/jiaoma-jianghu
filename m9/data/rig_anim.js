// M9 骨骼动画参数（数据文件，可调）。角度单位：度；像素单位：原画布像素（1024×1536 立绘），运行时 × prepScale × spriteScale。
// 步态与位移同步：基础速度下一个 walk 循环 = cycleMs，跟随者走得快时步频按速度同比加快（不滑步）。
// 左右一律按画面：armL = 画面左侧手臂，armR = 画面右侧。
window.RIG_ANIM = {
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
  "xiaoman": { "arms": { "armL": 3, "armR": 8 } }   // 画面左侧手臂胸前握令牌，层级最上，只摆 ±3°
};
