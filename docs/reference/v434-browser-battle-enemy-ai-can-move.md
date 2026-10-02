# V4.34 Browser Battle Enemy AI Can-Move Override

更新日期：2026-10-02

V4.34 對齊 Fixed-C `BATTLE_ai_all()` 的後置 `BATTLE_CanMoveCheck()`：AI callback 成功選出行動後，若 Enemy 不能移動，最終命令會覆成 NONE，並仍提交為 C_OK。

## 行為

- 阻止行動狀態：`paralysis`、`stone`、`sleep`；`barrier` 僅在 `_MAGIC_BARRIER` 編譯設定啟用時阻擋（本 runtime 目前依可用來源資料將 barrier 視為啟用）。
- AI action 與攻擊 target 的選取先於 can-move 覆寫，因此必要 action / target RNG 仍會消耗，最後命令才改成 NONE。
- `dizzy`、`dragnet`、`confusion`、`nocast`、`poison`、`drunk` 不列入這個固定 C `BATTLE_CanMoveCheck()` 後置 blocker；其中部分狀態會由其他 player command preflight 或各自 StatusSeq 處理。
- 狀態可以來自 canonical `battleStatus`、`status` 或 entry direct fields；優先讀取第一個有明確欄位的來源。
- Dead Enemy Entry 仍依 V4.33 規則走 AI callback；本版只處理命令覆寫，不改動死亡狀態。

本版不執行傷害、不修改 Persistent State，也不改變 player command preflight。

## Regression

`tools/check_v434_browser_battle_enemy_ai_can_move.mjs` 覆蓋六種不能行動狀態、非 blocker、AI/target RNG 順序與最後 NONE/C_OK commit。Workflow 重跑 V4.29–V4.34 AI 回歸。

Pinned Fixed-C：`gavinlinasd/StoneAge@1f90cb6cb57c1df70f39cde77a5a8ccd98b66c56`。
