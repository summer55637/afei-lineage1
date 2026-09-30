# V3.84 Browser World Encounter Enemy Generation

更新日期：2026-10-01

V3.84 接在 V3.83 Group selection 後，開始重播 pinned C 的 selected Group → Enemy roster generation。

## Fixed-C contract

`gmsv/src/char/enemy.c::ENEMY_getEnemy()` 會先把 Encounter `enemyMax` 與 selected Group 每個 Enemy 的 `CREATEMAXNUM` 加總做限制：

`enemyEntryMax = min(encounter.enemyMax, sum(CREATEMAXNUM))`

再：

`entryMax = RAND(1, enemyEntryMax)`

之後每個 roster slot 以 Group 的 `CREATEPROB` 做：

`RAND(0, sum(CREATEPROB)-1)`

若同一 Enemy 已達：

`CREATEMAXNUM × sameCount`

該次抽選作廢並繼續 loop，最多 100 次。

## Big enemy

固定 C 的 `E_T_SIZE` 將 Enemy 分成 normal / big。Big enemy：

- 全隊最多 5 隻。
- 前五格優先。
- 如果第 6 格之後抽到 big，會把前五格中第一個 normal 移到目前位置，再把 big 放入那個 normal 的位置。

V3.84 已把 `E_T_SIZE` 來源加入 Group catalog。156 個起始路線 Group 共解析 47 個 EnemyBase TempNo；目前 162 個 member 是 normal、37 個是 big。

## Explicit source boundary

`ENEMY_RandomEnemyArray()` 的特殊 EnemyID range 945–956、964–969 目前仍沒有完整 replacement table，因此 V3.84 遇到它會 fail-closed，不自行猜 RNG replacement。

V3.84 仍然：

- 不修改 Persistent State。
- 不啟動 battle。
- 不建立 battle context。
- 不計算 damage。
- 不處理 capture / reward / death。

Regression：`tools/check_v384_browser_world_encounter_enemy_runtime.mjs`
