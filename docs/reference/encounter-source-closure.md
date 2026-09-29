# Encounter Source Closure

這份文件是 V3.10 groundwork 的 encounter data 邊界，不是另一份怪物資料表。

## Fixed source

- repository: `gavinlinasd/StoneAge`
- ref: `1f90cb6cb57c1df70f39cde77a5a8ccd98b66c56`
- active tables: `gmsv/data/group1.txt`、`gmsv/data/enemy1.txt`、`gmsv/data/enemybase1.txt`

GitHub 的 8.0 repository 結構確認 `gmsv/data` 同時包含 Group、Enemy、EnemyBase 與 NPC data；本專案仍以 pinned ref 的實際 generated data 為唯一可升級依據。

## Current closure

目前 generated encounter runtime 有 728 個被引用 Group，705 個完成解析，另有 23 個 Group ID 尚未閉合。

未閉合 Group 不會被 runtime 當成可生成隊伍；這是避免把缺失的 `group1.txt` row 用其他版本資料代替。

另有一個明確 template blocker：Group `1297` 的 `EnemyID 2455 / TempNo 145`（水双头狼）缺 `enemybase1.txt` 對應 template。僅有 `stoneage_enemy_ai.json` 的 AI metadata 不足以建立完整 Enemy；因此同樣維持 non-spawnable。

## Closure rules

1. 只有 pinned source provenance 才能把 unresolved row 升級。
2. 不跨版本直接搬 Group / Enemy / EnemyBase row。
3. AI metadata、掉落表或攻略頁只作 discovery evidence，不直接生成 Enemy template。
4. 成功補入 source 後必須同步更新 generated runtime、ledger、regression 與 CI。

## Regression

`tools/check_v310_encounter_source_closure.mjs` 會鎖定：

- 728 / 705 的固定 checkpoint counts
- 23 個 unresolved Group ID
- 每個 unresolved Group 的實際 floor / encounter impact
- Group 1297 / Enemy 2455 / TempNo 145 的 template blocker
- 不跨版本 fallback 與 provenance gate
