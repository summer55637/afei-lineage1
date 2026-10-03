# V4.66 Browser Battle Full Settlement Chain

固定來源：gavinlinasd/StoneAge@1f90cb6cb57c1df70f39cde77a5a8ccd98b66c56

V4.66 把目前已完成的死亡、復活、結算元件串成一條可重播的 revision transaction 鏈。

## Chain

1. Battle 中 Player 死亡，BATTLE_AddProfit death-extra 建立 sourceDeathExtraEvents。
2. Relife 使用 source-backed existing item，Battle Context 復活 Player。
3. BATTLE_FINISH_COMMIT 固定 settlementStartRevision；Controller 的實際值就是當下 Persistent State revision。
4. Finish 後依序 commit deathExtra、relife、levelUp。
5. Settlement Receipt 必須同時引用 levelUp、deathExtra、relife transaction。
6. Player Exit commit。
7. Battle Exit commit。
8. Context Clear。

本輪故意保留單一玩家、無 Pet、普通 PVE finish-hook，避免把其他尚未完成的特殊 battle branch 混進驗證。

## Revision contract

整條回歸固定為：

rev0 -> DeathExtra rev1 -> Relife rev2 -> LevelUp rev3 -> Settlement rev4 -> PlayerExit rev5 -> BattleExit rev6

而 Finish 本身只修改 transient Battle Context，不增加 Persistent State revision。

## Regression

tools/check_v466_browser_battle_full_settlement_chain.mjs 驗證：
- Player normal death-extra + Charm -1
- Relife Item 20131 / HP 200
- Finish 時 settlementStartRevision = 0
- DeathExtra、Relife、LevelUp transaction stale/revision window
- Settlement 缺 relife transaction 會被拒絕
- Settlement receipt 成功綁定三個 branch
- Player Exit 成功
- Battle Exit 成功
- Context Clear 成功
- 最終 revision 6
