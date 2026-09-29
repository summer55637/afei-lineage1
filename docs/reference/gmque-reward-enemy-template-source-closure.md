# GMQUE Reward Pet Enemy Template Source Closure

## 結論

固定 C 的 GMQUE reward pet 陣列不是 Player-Pet DB 的 enemyIds 欄位來源，而是：

`int petID[4]={1642,1636,475};`

接著在 `GMQUE_AddQueStrTrophy()`：

`ENEMY_getEnemyArrayFromId(petID[rands])` → `ENEMY_createPetFromEnemyIndex()`

因此這三個值必須以 **Enemy ID** 解讀，再由 pinned `enemy1.txt` 找到 Enemy record，並由該 record 的 TempNo 對到 `enemybase1.txt` template。

## Pinned source

- Repository: `gavinlinasd/StoneAge`
- Ref: `1f90cb6cb57c1df70f39cde77a5a8ccd98b66c56`
- Function: `gmsv/src/npc/npc_eventaction.c::GMQUE_AddQueStrTrophy`
- Data: `gmsv/data/enemy1.txt`
- Data: `gmsv/data/enemybase1.txt`

## 已閉合的三個 reward pet

| Reward Enemy ID | enemy1 TempNo | Enemy 名稱 | EnemyBase key | Source status |
| --- | ---: | --- | ---: | --- |
| 1642 | 809 | 瑞里西尔 | 809 | resolved |
| 1636 | 803 | 可可恩 | 803 | resolved |
| 475 | 5 | 黑乌力 | 5 | resolved |

第四槽是 C 陣列未填值產生的 implicit zero，不應視為第四隻寵物。

## 直接 source evidence

`data/generated/stoneage_gmque_reward_enemy_templates.json` 保存本輪逐筆核對結果與原始 source row。這個檔案是 **source evidence artifact**，不是新的遊戲規則，也不代表目前 runtime 已經啟用 reward pet。

## 與舊 ledger 的修正

舊版 audit 把 `1642 / 1636 / 475` 當成「必須在 main player-pet DB 的 `species[].wildLv1Variants[].enemyIds` 找到的 mapping」。這個檢查可以作為 player-pet DB cross-check，但不能取代 fixed C 自己的 Enemy lookup path。

因此目前正確狀態是：

**source template：已解析**

**runtime adapter：尚未接入**

仍然維持 fail-closed，直到 runtime 明確改成消費這個 Enemy-ID→TempNo→EnemyBase contract。

## 下一個 runtime 邊界

接下來要把 reward-pet resolver 從：

`main player-pet enemyIds reverse index`

改成 source-backed：

`reward Enemy ID` → `enemy1 record` → `TempNo` → `enemybase1 template` → 建立 Web Pet template

並額外保留 fixed C 的 implicit-zero slot 與 `ENEMY_createPetFromEnemyIndex()` failure semantics。
