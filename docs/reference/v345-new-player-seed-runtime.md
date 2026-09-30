# V3.45 New-player Seed Runtime

更新日期：2026-09-30。

V3.45 把 fixed-C 的剛創角色出生狀態獨立成一條可保存、可測試、但尚未接到 playable HTML 的 headless contract。

## 已閉合的 source seed

固定 gmsv/setup.cf 與 _NEW_PLAYER_CF build：

- TRANS=1
- LV=1
- PETLV=1
- GOLD=30000
- ITEM1=24114
- ITEM2..ITEM15 空
- PET1..PET4 空

固定 C 的 config parser 有一個重要 mapping：PET1 寫入 newplayergivepet[1]，而 getNewplayergivepet(0) 讀的是 slot 0。因此目前空設定會讓 CHAR_createNewChar 明確進入 hometown fallback，而不是從 PET1 猜一隻寵。

四個 hometown 的 fallback starter pet 已由 pinned enemy1.txt + enemybase1.txt 完整閉合：

- hometown 0 → EnemyID 1 → TempNo 2
- hometown 1 → EnemyID 2 → TempNo 112
- hometown 2 → EnemyID 3 → TempNo 102
- hometown 3 → EnemyID 4 → TempNo 34

ITEM1=24114 只確認 source creation path 與 item ID；沒有把未知 item template 欄位自行補進 runtime，仍要求 Item allocator / item source contract。

## 邊界

這個 contract 不把 NPRIDE=3 當成 CHAR_createNewChar 的 starter-pet selector，也不建立任何 synthetic pet/item template。它只保留 fixed-C 實際會讀到的值與 fallback 分支。

不新增 playable HTML；等資料與 runtime contract 成熟後，再建立唯一 canonical entry。

## Regression

- generator：tools/generate_new_player_seed_runtime.mjs
- checker：tools/check_v345_new_player_seed_runtime.mjs
- workflow：.github/workflows/check-v345-new-player-seed-runtime.yml