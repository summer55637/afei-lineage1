# V4.46 Browser Battle Round Runtime

更新日期：2026-10-03

## 目的

把目前已完成的 Browser Battle 單步 runtime 接成一個「單回合 driver」，只閉合目前真正已有 source-backed contract 的基礎物理戰鬥路徑。

Pinned source：

- Repository：`gavinlinasd/StoneAge`
- Ref：`1f90cb6cb57c1df70f39cde77a5a8ccd98b66c56]

## 來源對照

Fixed-C 的 `BATTLE_Command()` 在命令完成後依序：

1. `turn++`
2. `BATTLE_ai_all()`
3. `BATTLE_Battling()`
4. 雙方勝負檢查
5. `BATTLE_PreCommandSeq()`
6. 勝負成立時 `BATTLE_FinishSet()`

`BATTLE_Battling()` 本身先依戰鬥角色敏捷／序列排序，再於每個角色自己的 action 前呼叫 `BATTLE_StatusSeq()` 與 `BATTLE_CanMoveCheck()`；普通攻擊再進入 AttackSeq、Damage、DamageReact 與傷害／死亡提交。

V4.46 將這條已完成的 runtime 契約組成一個 controller action：

`BATTLE_ROUND_RESOLVE`

## 已閉合

- 每回合 `turn` 遞增。
- 依現有 Browser Battle Context 的 `quick` / `sequencePower` / `bid` 建立 deterministic action order。
- 每個 actor action 前執行 V4.45 StatusSeq。
- `NONE`／`GUARD`／`WAIT` 可直接完成。
- 基礎物理攻擊依序呼叫：
  `AttackPreflight → AttackSeqPrelude → DamagePlan → CriticalDamagePlan → DamageReactPlan → DamageDeathChain`
- Target 死亡或無效時，可以使用既有 DefaultTarget contract 重新找合法目標。
- 傷害仍只寫入 transient Battle Context；Persistent State 不在本回合 driver 中修改。
- 回合末執行 BattleEnd plan。
- 尚存活角色回到 C_WAIT，準備下一回合。

## 目前明確延後

這版**不宣稱完整戰鬥已完成**。

為避免把尚未閉合的行為偽裝成完成，本版明確採：

`counterPolicy = "defer"`

因此 `BATTLE_Counter()` 不在 V4.46 round driver 中執行，只產生 deferred receipt。

同樣延後：

- 特殊 WAZA 尚未對應完整 execution pipeline 的命令。
- Vanish / Absorb / Reflect / Trap / Acupuncture 等特殊 DamageReact commit。
- 多段攻擊／真正的 source `BATTLE_GetAttackCount()`。
- 完整 Battle Finish → Profit → Persistent settlement 串接。
- 離線收益與補給／死亡恢復策略。

這些分支缺資料或缺完整 contract 時維持 fail-closed，不用 fixture 或猜測補橋。

## RNG contract

V4.46 不在 runtime 內偷偷產生不可追溯 RNG。每個 attack bundle 由 caller 提供：

- `duckRoll`
- `criticalRoll`
- `damageRollNear` / `damageRollWide`
- 必要時 `guardRoll`
- 必要時 `lowDamageRoll`
- 可選 weapon／field／reaction 參數

StatusSeq 的 RNG 以 `statusRandomRollsByBid` 提供。

因此回合 regression 可以完全重播，且沒有將隨機狀態寫入 Persistent State。

## Regression

`tools/check_v446_browser_battle_round_runtime.mjs` 使用現有：

- Encounter 65
- Group 94
- source enemy generation
- Browser Battle initialization
- Idle player strategy
- source-backed Enemy AI

然後把 3 個可執行的普通攻擊交給 V4.46 round driver，驗證：

- turn = 1
- player 與 enemy 的 transient HP 都實際下降
- round 結束後 live actors 回到 C_WAIT
- Persistent State revision 仍只反映既有 battle-entry mutation contract
- 3 個 counter branch 均明確記錄為 deferred

## Evidence boundary

V4.46 是「已完成單步戰鬥 contract 的 orchestration」，不是把所有戰鬥系統一次假稱完成。

下一個可以安全提升的邊界是把 `BATTLE_Counter()` 的最多 5 次反擊 chain 以 source-order、獨立 RNG bundle 與完整 transaction receipts 接進來；再之後才是特殊 DamageReact 與多段攻擊。
