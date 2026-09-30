# V3.65 Idle Loop → Persistent State binding

更新日期：2026-09-30

V3.65 將既有 `src/stoneage_idle_loop.mjs` 的流程 state machine 接到 canonical `Persistent State`，但不把 Idle product policy 偽裝成 fixed-C parity。

## Persistent mapping

Idle state machine 的：
- disabled
- moving
- encounter_pending
- in_battle
- settlement
- supply_check
- dead
- offline_resume

會投影到 Persistent State 的 `idle.mode`；`idle.enabled`、`idle.routeId` 與 `idle.lastSimulatedAt` 同步更新。Offline boundary 另外同步 `resumePending` 與 `lastResumedAt`。

## Ephemeral boundary

`pendingEncounter`、`pendingBattle`、`pendingReward` 屬於 transition payload，不直接塞進 persistent schema。Battle result 必須由 battle runtime 提供，Idle Loop 不自行重新計算。

## Save boundary

`commitIdleEvent()` 流程：

`Persistent State`
→ validate
→ Idle transition
→ persistent idle projection
→ `commitSave()`
→ SHA-256 Save Envelope
→ `parseAndValidateSaveEnvelope()`
→ next canonical state

revision 不在普通 event projection 時增加，只在 commitSave 時 +1。expectedRevision 不符時 fail-closed。

## Offline

V3.65 只記錄 resume boundary，不決定 offline reward 公式、最大離線時間、死亡中斷、補給規則或背包滿處理。這些仍留在 Idle product-policy boundary，等 route / encounter / battle evidence 逐項閉合。

## Regression

`tools/check_v365_idle_persistent_state_runtime.mjs` 驗證：
- full Idle transition coverage
- invalid state / invalid route fail-closed
- offline resume flags
- Save Envelope round trip
- revision conflict
- no battle-result recomputation

