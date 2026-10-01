# GMQUE Source Closure Audit

## Scope

本文件記錄 pinned fixed-C 的 GMQUE engine contract，以及目前最完整 VM 一鍵端＋手工外網端資料重新開案後的 source closure 狀態。

**2026-10-01 起，GMQUE／抓寵活動不再列為永久停用。** 先前 `data/generated/stoneage_disabled_features.json` 的永久停用決定已撤回；活動目前進入 `reopened-for-source-reconstruction`，但 `runtimeEnabled=false`、`playable=false`，不會因重開追查而自動啟用。

## Fixed source

- Repository: `gavinlinasd/StoneAge`
- Pin: `1f90cb6cb57c1df70f39cde77a5a8ccd98b66c56`
- Main source: `gmsv/src/npc/npc_eventaction.c`

### Lifecycle

1. `GMQUE_InSertQue()` 從 NPC argument 讀取 `RANDGMQUE`，再讀 `QUEPART0..`；每個 option 先用 `RAND(1, nums)` 選一條，再依 `min-max` 產生 level，組成 `petID-LV` 並以 `&` 串起來。
2. `GMQUE_getQueStr()` 在尚未參加時建立 queue 並呼叫 `GMQUE_showQueStr()`。
3. `GMQUE_CheckQueStr()` 解析四段 task；玩家寵物先以 `CHAR_PETID + level` exact match；ID 不同時再比較 source Enemy name。若 `GMQUENUMS <= 0`，先做 `rand()%100` 並把 0 折成 1，再執行 item / gold gate。
4. `GMQUE_DelQueStrPet()` 依同一 queue 找到要交出的寵物，並處理 default pet / pet slot 清除。
5. `GMQUE_AddQueStrTrophy()` 依已鎖定的 `GMQUENUMS` 進入 pet / item / gold reward。
6. 成功的 trophy 後才 `GMQUE_cleanQueStr()`；pet reward 的第四陣列槽是 C implicit-zero，不應自行替成第四隻寵物。

## Reopened endpoint investigation

目前新 endpoint corpus 的最高優先檢查範圍：

- `ro0000/server/merged-source/gmsv/data/npc/`
- `ro0000/server/merged-source/gmsv/data/enemy1.txt`
- `ro0000/server/merged-source/gmsv/data/enemybase1.txt`
- `ro0000/server/merged-source/gmsv/setup.cf`
- `ro0000/server/database/175sa.sql`

目前尚未拿到可逐筆核對的 endpoint GMQUE NPC argument，也尚未完成 reward pet 1642 / 1636 / 475 的 endpoint Enemy / EnemyBase 建立語義。

Google 以 `RANDGMQUE`、`QUEPART0`、GMQUE reward ID 等精確關鍵字交叉查找，本次沒有得到可直接採信的實際活動參數，因此外部搜尋不能取代 endpoint corpus。

## Existing fixed-C evidence

`data/generated/stoneage_gmque_source_closure.json` 已保存：

- 四槽 task grammar。
- `RANDGMQUE` / `QUEPART0..3` parser contract。
- trophy 的 pet / item / gold branch。
- reward pet IDs `1642 / 1636 / 475` 與 C zero slot 行為。
- 目前 unresolved boundaries。

這些仍然有效，但它們描述的是 **engine semantics**，不是 endpoint 實際活動配置。

## Reopen rule

以後只要出現新的 authoritative endpoint evidence、不同版本的實質資料差異、以前未查過的 evidence layer 或新的 runtime prerequisite，就可以重新開案。

重開不等於啟用：

`reopened → source closure → semantic check → regression → runtime admission → playable`

沒有完整 endpoint argument / reward template 前：

- 不建立虛構 NPC task。
- 不猜活動寵物名稱或能力。
- 不直接清除玩家寵物。
- 不把 AI metadata 當成完整 pet template。