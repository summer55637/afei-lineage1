# V4.64 Browser Battle Player Equipment Relife

固定來源：`gavinlinasd/StoneAge@1f90cb6cb57c1df70f39cde77a5a8ccd98b66c56`

V4.64 接入固定來源 `CHECK_ITEM_RELIFE -> ITEM_DIErelife -> BATTLE_MultiReLife`。

## Source contract

- Feature flag：`_Item_ReLifeAct=true`
- `CHECK_ITEM_RELIFE` 掃描 Player item slot 0..4，使用第一個有效的 `ITEM_DIErelife` item。
- Ultimate death 排除：Fixed-C `BATTLE_getBattleDieIndex()` 不把 Ultimate entry 列入 relife scan。
- `ITEM_DIErelife` 的 HP argument：缺失=1、`FULL`=目前 WORKMAXHP、其他值使用 C `atoi` 語義。
- `BATTLE_MultiReLife`：HP 至少 1，最高不超過 WORKMAXHP，並清除死亡旗標。
- Fixed-C build 的 `_DUMMYDIE=false`、`_LOSE_FINCH=false`，所以本版只重建 Player equipment relife；Pet relife 不假裝完成。
- 現有 source item catalog 確認 5 個 relife item：20131、20132、20133、21128、19180。

## Browser transaction boundary

Battle Context 建立時從 canonical `inventory.playerItemSlots + inventory.itemRuntime.slots` 快照 slot 0..4 的所有有效 relife item instance。

復活發生於完成 actor command 的死亡判定後、AddProfit 前；這對應 Fixed-C `BATTLE_Battling` 的順序：

`Damage/Death -> CHECK_ITEM_RELIFE -> ITEM_DIErelife -> BATTLE_AddProfit -> next action`

因此 Relife 成功時，後續 `BATTLE_AddProfit` 不再把該 Player 當成死亡者處理，不會產生戰敗 Charm / DefaultPet VariableAI death-extra。

Relife 只先修改 Battle Context，並記錄 `sourceRelifeEvents`；不立即修改 Persistent State。

`BATTLE_RELIFE_COMMIT` 使用 `runtimeMeta.battleReLifeTransactions`，以 existing item index + slot + itemId 驗證 stale plan，成功後刪除該 existing item、清除 slot、扣除 aggregate pile，並一次增加 Persistent State revision。同 transactionId 重送為 idempotent。

同一場 Battle 可連續使用多個 relife item；第一件消耗後，第二次死亡使用下一個 source-scanned item。沒有 source catalog 時，只要 slot 0..4 存在 existing item，Battle Context 建立直接 fail-closed。

## Settlement

當 Battle Context 含 `sourceRelifeEvents`，Settlement Receipt 必須包含 `relife` transaction；否則不得完成結算。

## Regression

`tools/check_v464_browser_battle_relife.mjs` 覆蓋：
- build-time source candidate snapshot
- slot 0..4 scan order
- 20131 HP 200
- 20132 HP 500（超過 MAXHP 時 clamp）
- slot 5 不被掃描
- Ultimate exclusion
- consecutive two-death relife
- persistent consumption + pile deletion
- transaction idempotence
- missing catalog fail-closed
