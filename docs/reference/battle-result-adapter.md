# Battle Result Adapter

更新日期：2026-09-30

本 adapter 專門把 fixed-C PvE battle 的「已經完成的結果」轉成 Idle Simulation 可以消費的資料格式。

## Fixed-C boundary

fixed-C 的 server loop 在 `BATTLE_Battling()` 後清 surprise，再呼叫 `BATTLE_OnlyRescue(side 0)` / `BATTLE_OnlyRescue(side 1)` 判定是否 finish；PvE 的 side 0 是玩家側、side 1 是 Enemy 側。因此 PvE 下 `winside=0` 映射為 `victory`，`winside=1` 映射為 `defeat`。citeturn276757view0

`BATTLE_AddProfit()` 本身只是依 `dpbattle` 分派到 `BATTLE_AddDuelPoint()` 或 `BATTLE_AddExpItem()`，所以 reward packet 仍由既有 Reward Transaction 接收，不在 adapter 重算。citeturn276757view0

## Adapter input

`battleIndex`、`winside`、`finished` 是必要 source result 欄位；可選 `player` HP/MP snapshot、normalized reward packet、`onlyRescue.side0/side1` trace。

## Fail-closed

非 PvE、battle 未完成、winside 非 0/1、reward packet 無法 normalize，都不轉換。

Adapter 不計算 damage、不抽 RNG、不判斷哪一個 Enemy 死亡、不產生 reward。

Runtime：`src/stoneage_battle_result_adapter.mjs`
Regression：`tools/check_battle_result_adapter.mjs`。
