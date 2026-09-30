# V3.83 Browser World Encounter Group Select

更新日期：2026-10-01

V3.83 接在 V3.80 Encounter source resolve 與 V3.81/3.82 CEP roll/persistence 之後，處理 fixed-C ENEMY_getEnemy() 的第一個 battle-side source boundary：選擇 Encounter 對應的 Group。

## Fixed-C contract

Pinned `gmsv/src/char/enemy.c::ENEMY_getEnemy()` 先從目前 Encounter row 取得 Group IDs，檢查每個 Group 的：

- `GROUP_APPEARBYITEMID`
- `GROUP_NOTAPPEARBYITEMID`

通過後，以 Encounter 的 Group probability 權重做一次 `RAND(0, sum(weight)-1)`，選出一個 Group。

V3.83 的 `WORLD_ENCOUNTER_GROUP_SELECT` 把 RNG 改成 caller-injected `groupRoll`，並保留：

- zero-weight Group 不可被選中
- unresolved Group 不 promotion
- item gate 不通過就不進 eligible set
- invalid RNG fail-closed

## First-route example

Encounter 65 的 Group 為 89 / 92 / 94，三者 fixed-C 權重皆為 1，因此：

- roll 0 → Group 89
- roll 1 → Group 92
- roll 2 → Group 94

Group 89 / 92 / 94 的 source Enemy template 已由 pinned `enemy1.txt` 完整閉合：

- Group 89 → Enemy 120
- Group 92 → Enemy 123
- Group 94 → Enemy 120 + Enemy 123

## Boundary

V3.83 仍是 read-only source adapter：

- RNG 由 caller 注入，不呼叫隱藏的 Math.random。
- 不修改 Persistent State。
- 不建立 battle context。
- 不決定本戰人數。
- 不進行 Enemy random replacement。
- 不處理 big-enemy ordering。

這些會在下一個 battle-side adapter 中逐項閉合，避免把 `ENEMY_getEnemy()` 後半段的 RNG 順序與 team creation 混進 Group selection。

Regression：`tools/check_v383_browser_world_encounter_group_runtime.mjs`
