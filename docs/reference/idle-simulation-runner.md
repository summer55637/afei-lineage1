# Idle Simulation Runner

更新日期：2026-09-30

`src/stoneage_idle_simulation.mjs` 把已閉合的 first-idle route skeleton 接到 Idle Loop、Reward Transaction 與 Supply/Death Policy。

## 原則

Runner 只負責產品層 orchestration：route variant 提供已驗證的 path duration，encounter 只提供入口，battle result 必須由外部 runtime 注入。

基礎放置戰鬥策略 v1 已可透過 `BATTLE_IDLE_STRATEGY_APPLY` 對 active Battle Context 下達普通攻擊命令；目標選取使用注入的 source RNG roll，狀態阻擋／無目標則使用 wait，寵物沿用 Fixed-C 預設攻擊。這一步只完成命令策略，不計算完整 battle result；Runner 的外部 battle-result 邊界仍然存在。

Runner 不計算 damage、不決定 encounter RNG、不生成 reward、不重抽 carried loot。

## 一次 simulation

`hometown → route path time → encounter_pending → battle result → reward transaction → supply/death decision → save commit`。

Battle result 可帶 player HP/MP snapshot；該 snapshot 被視為 battle runtime 已完成的輸出。

## Death

若 battle result 導致 player HP <= 0，Runner 進 `dead`，再交給 `deathRecoveryDecision()`。沒有 policy 時預設 stop idle，不自動復活、不自動回城。

## Offline

`simulateOfflineResume()` 只計算 closedAt → resumedAt 的合法時間窗與明確 maxSeconds cap，`rewardsSimulated:false`。它不假造離線 EXP / Gold / Item。

## Save

正常 cycle 結束可直接呼叫 `commitSave()`；revision guard 會避免 stale state 覆蓋較新的 persistent state。

Regression：`tools/check_idle_simulation.mjs`。
