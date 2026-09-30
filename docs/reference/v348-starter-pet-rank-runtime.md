# V3.48 Fixed-C Starter Pet Rank Runtime

更新日期：2026-09-30。

V3.48 閉合 V3.47 尚未接入的 `ENEMY_getRank`，讓 starter Pet 的 `CHAR_PETRANK` 不再停留在 pending。

## Fixed-C source closure

固定來源：

`gavinlinasd/StoneAge@1f90cb6cb57c1df70f39cde77a5a8ccd98b66c56`

函式：

`gmsv/src/char/enemy.c::ENEMY_getRank`

來源邏輯是：

1. 取 `ENEMYTEMP_enemy[tarray].intdata` 的 `E_T_BASEVITAL / E_T_BASESTR / E_T_BASETGH / E_T_BASEDEX`。
2. 四項相加得到 `paramsum`。
3. 依 fixed-C rank table 由高到低比較：
   - 100 → rank 0
   - 95 → rank 1
   - 90 → rank 2
   - 85 → rank 3
   - 80 → rank 4
   - 0 → rank 5
4. 第一個滿足 `paramsum >= num` 的 row，其 index 就是回傳 rank。

這裡沒有使用 starter Pet 的四圍 ±2 RNG，也沒有使用後續 10 次 allocation；rank 是建立時依原始 EnemyBase template 計算。

## 四個 starter Pet

固定 source seed 的四個 hometown starter templates 都有：

`paramsum = 79`

因此四個 hometown starter Pet 都是 `petRank = 5`。

Runtime 現在同時：

- 重新由 template baseStats 計算 rank；
- 與 generated seed 的 `sourceRank` / `sourceRankParamsum` 做一致性檢查；
- 將結果寫入 `petRank`；
- 將 `sourceRankResolved` 設為 `true`；
- 保存 `sourceRankEvidence`，包含 fixed-C function、paramsum、threshold 與 rank table。

若 generated seed 與 template 計算不一致，直接 fail-closed，不建立錯誤的 starter Pet。

## RNG boundary

這一輪只補 rank source closure，不增加 RNG。

`ENEMY_getRank` 本身沒有 `RAND()`。

原本 V3.47 的 16 次 starter Pet RNG 順序保持不變：

1. level
2. four base stat rolls
3. ten allocation rolls
4. PetMailEffect

因此 V3.48 的 rank 接入不會造成後續 battle / Pet RNG 序列位移。

## CI

- generator：`tools/generate_new_player_seed_runtime.mjs`
- regression：`tools/check_v348_starter_pet_rank_runtime.mjs`
- workflow：`.github/workflows/check-v348-starter-pet-rank-runtime.yml`

Workflow 會在 GitHub Runner 上重新 checkout 固定 C source、重建 seed JSON、執行 `cmp` 與 regression。

## Remaining boundary

Starter Pet rank 已 source-closed。

Starter Item `24114` 仍維持原本的 fail-closed 邊界：source ID / creation path 已知，但 Item template / allocator 尚未完整閉合。

不新增 playable HTML。
