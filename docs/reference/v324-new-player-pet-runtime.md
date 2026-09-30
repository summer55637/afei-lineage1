# V3.24 New-player Pet Runtime

更新日期：2026-09-30

V3.24 正式把新手 `GetPet` 從 event action plan 接到 fixed-C 的 Enemy / EnemyBase Pet 建立來源。

## Source identity

固定來源：`gavinlinasd/StoneAge@1f90cb6cb57c1df70f39cde77a5a8ccd98b66c56`。

`gmsv/src/npc/npc_eventaction.c::NPC_ActionAddPet()` 讀取 `GetPet` 數字後，直接以 `ENEMY_ID` 搜尋 Enemy row，再呼叫 `ENEMY_createPetFromEnemyIndex()`。

建立後 `gmsv/src/char/enemy.c::ENEMY_createPetFromEnemyIndex()` 會把 Enemy row 關聯的 `E_T_TEMPNO` 寫入 `CHAR_PETID`。因此本 runtime 明確分開：

`GetPet number = Enemy ID`

`created canonical Pet identity = EnemyBase TempNo`

## First-route source closure

新手 `xinshoujd.arg` 使用的 5 個 Enemy ID 已全部由 pinned `enemy1.txt` + `enemybase1.txt` 解析：

| GetPet Enemy ID | Enemy | TempNo | EnemyBase |
|---:|---|---:|---|
| 341 | 朵拉比斯 | 274 | 朵拉比斯 |
| 2057 | 水魔兽 | 1047 | 洛奇斯德 |
| 1645 | 斑尼迪克 | 812 | 斑尼迪克 |
| 1479 | 玛蕾菲雅 | 718 | 玛蕾菲雅 |
| 2547 | 玛蕾菲雅 | 401 | 玛蕾菲雅 |

Exact source blobs：

- `enemy1.txt` → `bf245a391adeace09915b6e425754b54ab69a8f6`
- `enemybase1.txt` → `a19a508975e3a982fada323861b35b2edab79349`

## Creation RNG

固定-C `ENEMY_createPetFromEnemyIndex()` 每建立一隻 Pet 會依序消耗：

1. 1 次 `RAND(ENEMY_LV_MIN, ENEMY_LV_MAX)`。
2. 4 次 base stat `RAND(0,4)-2`。
3. 10 次 `RAND(0,3)` 分配到 VIT / STR / TGH / DEX。
4. 1 次 `RAND(0,PETMAIL_EFFECTMAX)`；pinned source 的 `PETMAIL_EFFECTMAX=1`。

因此 runtime 固定為 16 次 RNG，而且 width=0 / min=max 的呼叫仍保留一次 RNG lifecycle。

EnemyBase 數值使用 fixed-C `atoi()` semantics；例如 source `4.50` 會解析成 `4`，不是 JavaScript Number 的 `4.5`。

## Canonical state adapter

`createSourcePetGetPetHandler()` 只在提供 explicit `idFactory` 時才把 source Pet 加進 canonical `pets.petBox`。這是刻意的：source `CHAR` index 與 Web canonical `pet.id` 不是同一個 identity。

source handler 固定 `CHAR_MAXPETHAVE=5` 的容量；不自動修改 `team` 或 `activePetId`。

尚未自動補上的欄位：

- `CHAR_complianceParameter()` 所導出的完整 HP/MP / derived values。
- `ENEMY_getRank()` 的 rank。
- Web canonical `pet.id`。

這些都保留給下一層 explicit adapter；不在 V3.24 猜成 gameplay。

## Regression

`tools/check_v324_new_player_pet_runtime.mjs` 鎖定 5 個 source Enemy IDs、TempNo mapping、EnemyBase template、16 次 RNG、stat 計算、5-slot capacity 與 explicit canonical id factory。

V3.24 不建立 playable HTML。
