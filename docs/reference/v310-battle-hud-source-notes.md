# V3.10 battle HUD source notes

這份文件固定 V3.10 的戰鬥 HUD 呈現邊界；它只讀取現有 battle runtime 狀態，不新增戰鬥規則。

## 本輪固定的視覺對應

- 回合：直接讀現有 `enemy.sourceBattleTurn`。
- 目標：直接讀現有 `targetEnemyUnit()`。
- 玩家：直接讀 `state.level / state.hp / state.maxHp / state.mp / state.maxMp`。
- 出戰寵物：直接讀 `activePet()` 與其 HP／MP。
- 敵方：沿用既有 `enemy`／`enemy.units` 的 battle state。
- 右上指令窗：呈現攻擊、技能、防禦、捕獲、道具、更換寵物、逃跑等經典戰鬥操作層級；目前只有既有可執行的防禦／捕獲／自動捕獲與職業戰鬥技能保留實際操作。
- 尚未有 source-backed runtime 的功能保持非互動，不建立猜測型 gameplay。

## 與 fixed C 的邊界

本輪不修改：

- `normalBattleOrder()` 的既有回合遞增與排序。
- 傷害公式、Counter、Guardian、Acupuncture、CaptureCheck。
- 任何戰鬥 RNG。
- 既有 Player／Pet／Enemy data source。

## Visual reference

最終視覺參考仍為 `docs/reference/video-001-visual-reference.md`。影片中的戰鬥畫面要求完整場景、敵我明確站位、Battle HUD、目標標記與操作入口；公開舊版介面資料亦描述敵方左上、我方右下、右上指令視窗的配置。

