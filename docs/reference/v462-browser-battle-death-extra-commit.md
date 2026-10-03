# V4.62 Browser Battle Death Extra Commit

固定來源：`gavinlinasd/StoneAge@1f90cb6cb57c1df70f39cde77a5a8ccd98b66c56`

V4.62 將 V4.61 Battle Context 的 death-extra 事件正式接到 Persistent State transaction。

## Commit contract

- action：`BATTLE_DEATH_EXTRA_COMMIT`
- transaction bucket：`runtimeMeta.battleDeathExtraTransactions`
- expectedRevision：必須與目前 Persistent State revision 一致。
- 同 transactionId 重送：idempotent，不增加 revision。
- stale Player Charm / Pet VariableAI / DeadPetCount / Marefia alloc / MODAI：拒絕提交。
- 所有 mutation 先寫 clone，成功後一次產生新的 Persistent State revision。

## Settlement receipt

Battle Context 存在 `sourceDeathExtraEvents` 時，`BATTLE_SETTLEMENT_RECEIPT_COMMIT` 將 `deathExtra` 列為 required branch。

玩家已死亡的普通 PVE 場次可以只需要 deathExtra transaction；玩家存活時仍保留既有 LevelUp/EXP requirement。

## Scope

本版不改網路、DB、UI，也不把特殊 PVP/DANTAI/WinFunc/PkFunc branch 混入 ordinary-world encounter。
