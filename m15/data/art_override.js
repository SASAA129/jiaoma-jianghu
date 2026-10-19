// M15：第 2–6 章底图 + 两口锅的「新画风覆盖表」——一处配置。
//   use: "flat" → 用 flat（新平涂图）；"old" → 用 old（旧图）。由 tools/apply_flat_art.py 按「有没有 *_flat.png」自动改写，
//   也可以手改。flat 图的 w/h/ax/ay（道具切图后尺寸、锚点）由工具写进 meta；底图尺寸构图同旧图（1536×1024）。
//   运行时 js/art_override.js 只改 ASSETS[key] 的 src（和 meta），不发探测请求，所以没有 404。
window.ART_OVERRIDE = {
 "bg_market": {
  "use": "flat",
  "old": "assets/bg_market.png",
  "flat": "assets/bg_market_flat.png",
  "art": "art/locked/bg_market.png",
  "name": "第二章 渝州·老码头夜市"
 },
 "bg_river": {
  "use": "flat",
  "old": "assets/bg_river.png",
  "flat": "assets/bg_river_flat.png",
  "art": "art/ch3/bg_river.png",
  "name": "第三章 雾江·古渡夜航"
 },
 "bg_village": {
  "use": "flat",
  "old": "assets/bg_village.png",
  "flat": "assets/bg_village_flat.png",
  "art": "art/ch4/bg_village.png",
  "name": "第四章 麻婆岭·花椒寨"
 },
 "bg_hq": {
  "use": "flat",
  "old": "assets/bg_hq.png",
  "flat": "assets/bg_hq_flat.png",
  "art": "art/ch5/bg_hq.png",
  "name": "第五章 红汤总舵·大酒楼"
 },
 "bg_arena": {
  "use": "flat",
  "old": "assets/bg_arena.png",
  "flat": "assets/bg_arena_flat.png",
  "art": "art/ch6/bg_arena.png",
  "name": "第六章 天下第一锅擂台"
 },
 "prop_red_cauldron": {
  "use": "flat",
  "old": "assets/prop_red_cauldron.png",
  "flat": "assets/prop_red_cauldron_flat.png",
  "art": "art/ch5/prop_red_cauldron.png",
  "name": "第五章 红汤大鼎",
  "meta": {
   "w": 757,
   "h": 871,
   "ax": 340,
   "ay": 869,
   "dispScale": 0.95
  }
 },
 "prop_giant_pot": {
  "use": "flat",
  "old": "assets/prop_giant_pot.png",
  "flat": "assets/prop_giant_pot_flat.png",
  "art": "art/ch6/prop_giant_pot.png",
  "name": "第六章 擂台巨锅",
  "meta": {
   "w": 758,
   "h": 847,
   "ax": 374,
   "ay": 846,
   "dispScale": 0.88
  }
 }
};
