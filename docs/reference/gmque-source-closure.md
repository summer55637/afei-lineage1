# GMQUE Source Closure Audit

## Scope

本文件只記錄 pinned fixed C 與目前 Web runtime 已能證明的 GMQUE 邊界。它不是新的規則來源；若未來找到更完整的 fixed source evidence，先更新本文件與 regression，再進 gameplay。

## Fixed source

- Repository: `gavinlinasd/StoneAge`
- Pin: `1f90cb6cb57c1df70f39cde77a5a8ccd98b66c56`
- Main source: [`gmsv/src/npc/npc_eventaction.c`](https://github.com/gavinlinasd/StoneAge/blob/1f90cb6cb57c1df70f39cde77a5a8ccd98b66c56/gmsv/src/npc/npc_eventaction.c)

### Lifecycle

1. `GMQUE_InSertQue()` 從 NPC argument 讀 `RANDGMQUE`，再讀 `QUEPART0..`。每個 option 先用 `RAND(1, nums)` 選一條，再依 `min-max` 產生 level，組成 `petID-LV` 並以 `&` 串起來。
2. `GMQUE_getQueStr()` 在尚未參加時建立 queue 並呼叫 `GMQUE_showQueStr()`。
3. `GMQUE_CheckQueStr()` 解析四段 task。玩家寵物先以 `CHAR_PETID + level` exact match；ID 不同時再比較 source Enemy name。若 `GMQUENUMS <= 0`，先做 `rand()%100` 並把 0 折成 1，再執行 item / gold gate。
4. `GMQUE_DelQueStrPet()` 依同一 queue 找到要交出的寵物，並處理 default pet / pet slot 清除。
5. `GMQUE_AddQueStrTrophy()` 依已鎖定的 `GMQUENUMS` 進入 pet / item / gold reward。
6. 成功的 trophy 後才 `GMQUE_cleanQueStr()`；pet reward 的第四陣列槽是 C implicit-zero，不應自行替成第四隻寵物。

## Current data-layer evidence

### Enemy AI

`data/generated/stoneage_enemy_ai.json` 的 `byEnemyId` 存在 `1642`、`1636`、`475` 三個 Enemy ID key；其 `_meta.source` 是 `enemy1.txt + enemybase1.txt`。這只能證明 AI metadata 有索引，不能直接證明 Web 有可用的完整 pet template。

### EnemyBase

對 pinned `gmsv/data/enemybase1.txt` 的直接核對沒有找到 TempNo `1642` 或 `1636`。因此不能把 `enemy_ai` row 當成 `ENEMY_createPetFromEnemyIndex()` 所需要的完整建立資料。

### Main player-pet database cross-check

`data/generated/stoneage_general_lv1_pets.json` 是目前 `DATA_URL` 實際載入的玩家寵物資料。把 `species[].wildLv1Variants[].enemyIds` 反向索引後，GMQUE reward IDs `1642`、`1636`、`475` **全部沒有對應**。

因此目前至少有兩層明確證據都不能直接形成 reward Pet template：`stoneage_enemy_ai.json` 只有 AI metadata，而 main player-pet DB 也沒有這三個 Enemy ID 的 variant。runtime 現在會將它們標成 `pet-template-pending`，不再只回傳一個看似可用的 pet ID。

### Encounter 1642 occurrence

目前 Web encounter runtime 的 Group 124、125、128 有 `enemyItems[0]=1642`。這些欄位位於 Enemy 掉落表，代表 **item drop ID**，不是 GMQUE reward pet 的 Enemy ID template；本 audit 特別把這兩個 data layer 分開。

## Runtime boundary

目前只接三個純 source adapter：

- `sourceGmQueTaskEntries(taskString)`：固定四槽 `petID-LV` parser。
- `sourceGmQueMatchPetToTask(pet, task)`：exact ID + level；若 ID 不同，只有 caller 明確提供 source name 時才允許 name fallback。
- `sourceGmQueHandoverCheck(taskString,pets,...)`：依 fixed C 的 `GMQUENUMS` 初始化與 item/gold gate 順序做 eligibility check。它**不刪寵、不領獎、不變更 persistent state**。
- `sourceGmQueBuildPetTemplateIndex(petDb)` + `sourceGmQueRewardPetTemplate(petId)`：只接受 main player-pet DB 已有 `enemyIds` 對應的完整 variant；目前三個 GMQUE reward ID 都沒有命中，因此 pet reward 仍 fail-closed。

這樣可以先把 source contract 鎖住，等 NPC argument 與 Enemy template closure 完成後再接真正 handover mutation。

## Explicitly unresolved

- 實際 GMQUE NPC `RANDGMQUE / QUEPART0..` 值。
- reward pet `1642` 完整 Enemy template。
- reward pet `1636` 完整 Enemy template。
- reward pet `475` 完整 reward-template mapping。

在這四項 source evidence 沒有閉合以前，不建立虛構 NPC 活動內容、不猜寵物名稱／能力／初始數值、不直接清除玩家寵物。

## Regression

`tools/check_v310_gmque_source_closure.mjs` 會檢查固定 C pin、queue parser、GMQUE reward array、AI metadata presence、EnemyBase unresolved boundary 與 runtime fail-closed 行為。
