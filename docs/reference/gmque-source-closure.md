# GMQUE Source Closure Audit

## Scope

本文件只記錄 pinned fixed C 與目前 Web runtime 已能證明的 GMQUE 邊界。它不是新的規則來源；若未來找到更完整的 fixed source evidence，先更新本文件與 regression，再進 gameplay。

## Fixed source

- Repository: `gavinlinasd/StoneAge`
- Pin: `1f90cb6cb57c1df70f39cde77a5a8ccd98b66c56`
- Main source: [`gmsv/src/npc/npc_eventaction.c`](https://github.com/gavinlinasd/StoneAge/blob/1f90cb6cb57c1df70f39cde77a5a8ccd98b66c56/gmsv/src/npc/npc_eventaction.c)

### Lifecycle

1. `GMQUE_InSertQue()` 從 NPC argument 讀 `RANDGMQUE`，再讀 `QUEPART0..`。每個 option 先用 `RAND(1, nums)` 選一條，再依 `min-max` 產生 level，組成 `TempNo-LV` 並以 `&` 串起來。fixed C 變數名雖叫 `petID`，但下游實際按 EnemyTemp `TempNo` 使用。每個 `QUEPART` 最多只有前 11 個 option 進入 C 的計數與抽選。
2. `GMQUE_getQueStr()` 在尚未參加時建立 queue 並呼叫 `GMQUE_showQueStr()`。
3. `GMQUE_CheckQueStr()` 解析四段 `TempNo-LV` task。玩家寵物先以 `CHAR_PETID + level` exact match；TempNo 不同時再比較 source Enemy name。**四段全部通過後**，若 `GMQUENUMS <= 0` 才做 `rand()%100` 並把 0 折成 1，再執行 item / gold gate。
4. `GMQUE_DelQueStrPet()` 依同一 queue 找到要交出的寵物，並處理 default pet / pet slot 清除。
5. `GMQUE_AddQueStrTrophy()` 依已鎖定的 `GMQUENUMS` 進入 pet / item / gold reward。
6. 成功的 trophy 後才 `GMQUE_cleanQueStr()`；pet reward 的第四陣列槽是 C implicit-zero，不應自行替成第四隻寵物。

## Current data-layer evidence

### Enemy AI

`data/generated/stoneage_enemy_ai.json` 的 `byEnemyId` 存在 `1642`、`1636`、`475` 三個 Enemy ID key；本輪進一步直接回到 pinned C 的 `GMQUE_AddQueStrTrophy()`，確認 reward path 使用 `ENEMY_getEnemyArrayFromId()`，再以 pinned `enemy1.txt` / `enemybase1.txt` 完成三個 reward Enemy template 的 source closure。逐筆結果見 `data/generated/stoneage_gmque_reward_enemy_templates.json`。

### EnemyBase

舊 audit 曾把 reward ID 直接當成 EnemyBase TempNo 搜尋，因此得到 `1642/1636` not-found。這個搜尋鍵是錯的：fixed C 先用 `ENEMY_getEnemyArrayFromId()`，而 `enemy1.txt` 再提供 TempNo。現在三條 source chain 已閉合：`1642→809→瑞里西尔`、`1636→803→可可恩`、`475→5→黑乌力`。

### Main player-pet database cross-check

`data/generated/stoneage_general_lv1_pets.json` 是目前 `DATA_URL` 實際載入的玩家寵物資料。把 `species[].wildLv1Variants[].enemyIds` 反向索引後，三個 reward ID 仍然沒有對應。這表示 Web player-pet DB 尚未收錄它們；不表示 fixed C 沒有 reward template。現在 source template 已閉合，runtime 已改成消費 source-backed Enemy chain；main player-pet DB 仍只作 cross-check。

## Runtime boundary

目前只接三個純 source adapter：

- `sourceGmQueTaskEntries(taskString)`：固定四槽 `TempNo-LV` parser；`petId` 保留為 TempNo alias，避免既有 Web state/API 破壞。
- `sourceGmQueMatchPetToTask(pet, task)`：exact TempNo + level；若 TempNo 不同，只有 caller 明確提供 source name 時才允許 name fallback。
- `sourceGmQueHandoverCheck(taskString,pets,...)`：依 fixed C 的 `GMQUENUMS` 初始化與 item/gold gate 順序做 eligibility check；它本身不刪寵、不領獎。
- `sourceGmQuePrepareTaskState()` / `sourceGmQueHandoverPets()` / `sourceGmQueApplyTrophy()` 已把 persistent lifecycle 接上：保存 task、交寵、領 pet/item/gold reward、成功後 cleanup。
- 交寵不是原子 transaction：fixed `GMQUE_DelQueStrPet()` 先把匹配到的 slot 記下，再逐隻刪除；重複目標可能造成前面的寵物已刪、最後 `count` 不足而回傳 FALSE，因此 Web mutation 不做額外 rollback。
- `sourceGmQueBuildPetTemplateIndex(petDb)` 仍保留作一般 Player-Pet DB cross-check；GMQUE `sourceGmQueRewardPetTemplate(petId)` 的 production default 則改讀 `stoneage_gmque_reward_enemy_templates.json` 的 fixed-C Enemy template。
- `sourceCreateGmQueRewardPet(petId)` 再依 fixed `ENEMY_createPetFromEnemyIndex()` 的 RNG／建立順序產生純 Web Pet object，不修改 persistent state。

這樣 source contract、reward template runtime 與 persistent mutation core 已接通；剩餘 boundary 是實際 live NPC argument 與 NPC/UI wiring，仍維持 source-pending。

## Explicitly unresolved

- 實際 GMQUE NPC `RANDGMQUE / QUEPART0..3` 值；目前 pinned source tree 與公開 GitHub / Web 搜尋都沒有找到可直接證實的 live NPC arguments。
- live NPC 如何把 `GMACTION / DelGmquePet / GetGmPrize / CleanGmque` 串成實際對話頁面與 NPC 對應；在沒有 source evidence 前不建立假 NPC。

reward Enemy template、純 Web creation adapter、persistent handover/reward mutation core 已閉合；live NPC／活動 UI 仍維持 source-pending，因此尚不宣稱完整活動 playable。

## Regression

`tools/check_v310_gmque_source_closure.mjs` 會檢查固定 C pin、queue parser、GMQUE reward array、AI metadata presence、EnemyBase unresolved boundary 與 runtime fail-closed 行為。
