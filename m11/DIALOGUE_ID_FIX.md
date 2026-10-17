# 对白节点 ID 冲突修复（2026-10-17）

## 问题
第三～五章小玩法节点都叫 `E1_*` / `E2_*` / `E3_*`，合并进 `DIALOGUE.nodes` 时后章覆盖前章（共 19 个同名）。第二章的 `E1_*` 也被盖掉。

## 修复
按章加前缀：
- 第二章 → `C2_E1_1` …
- 第三章 → `C3_E1_1` …（`game-design/jiaoma/dialogue_ch3.js`）
- 第四章 → `C4_E1_1` …
- 第五章 → `C5_E1_1` …
- 第六章无此类冲突，未改

已改文件：
- `/workspace/game-design/jiaoma/dialogue_ch3.js` / `ch4.js` / `ch5.js`（官方源）
- `/workspace/game-m11/data/dialogue.js`（含第二章前缀；备份 `dialogue.js.bak`）

`node --check` 通过。请程序员 Bot 在 M11 用这份对白，M10 及更早锁定版不动。
