# V3.10 development checkpoint — GMQUE handoff runtime

> PLAYABLE CORE 仍為 V3.09；本文件記錄下一個 source-backed 開發 checkpoint，不把未完成的 NPC 活動設定包裝成已完成玩法。

固定原 C：
`gavinlinasd/StoneAge@1f90cb6cb57c1df70f39cde77a5a8ccd98b66c56`

## Evidence

`gmsv/src/npc/npc_eventaction.c` 已確認 GMQUE 的 handler 順序：`GMACTION` → `GMQUE_getQueStr`、`ShowGmque` → 顯示 queue、`DelGmquePet` → 交寵、`GetGmPrize` → 領獎、`CleanGmque` → 清理。

`GMQUE_InSertQue()` 讀取 NPC arg 中的 `RANDGMQUE` 與 `QUEPART0..`，每欄先計算逗號 option 數，再以 `RAND(1,nums)` 抽一項；寵物等級再以 option 裡的 `LVmin-LVmax` 做 inclusive RAND，最後保存 `petID-LV&...` 並設 `CHAR_GMQUEFLG=10`。

`GMQUE_CheckQueStr()` 逐一掃四個 queue token，對 CHAR 的持有寵使用 exact `CHAR_PETID`＋exact LV；TempNo 不同時才用 EnemyTemp name 做 fallback。Check 通過後才把 `CHAR_GMQUENUMS` 以 `rand()%100` 初始化，0 折成 1，再檢查 item／gold gate。

`GMQUE_DelQueStrPet()` 會再次找出對應寵 slot，實際清除寵物；`GMQUE_AddQueStrTrophy()` 依已保存的 reward roll 決定 pet／item／gold。只有 reward 成功後才呼叫 `GMQUE_cleanQueStr()`。

## Runtime

Web 新增：

- `sourceGmQueParseNpcArg()`
- `sourceGmQueParseTaskString()`
- `sourceGmQueFindPetMatches()`
- `sourceGmQueCheck()`
- `sourceGmQueDeleteMatchedPets()`
- `sourceGmQueClaimPrize()`

`state.quest.gmque` 保留 `flag / taskString / nums / handoverComplete`，讓 UI 可以呈現 fixed C 的 Check → 交寵 → 領獎分段。

GMQUE reward item 使用現有 `sourceItemRuntimeAlloc()` + `sourcePlayerAddSpecificExistingItem()`，因此 item existing-index 與 9～23 背包 slot 規則沿用既有 source runtime。Gold 直接沿用現有 trophy resolver。Reward pet 暫不從 AI row 猜 Enemy template；沒有完整 template 時 fail-closed。

## Regression

`tools/check_v310_gmque_handoff.mjs` 鎖定：

- `RANDGMQUE`／`QUEPART` queue generation。
- 四隻 exact TempNo／Lv match。
- `GMQUENUMS` 只在 Check 成功後鎖定。
- item full 與 gold ≥800,000 gate。
- handover 後 flag／reward roll 仍保留，符合 fixed action separation。
- gold claim 成功後才清理 queue。
- TempNo 不同時的 name fallback，以及沒有 source name 時的 fail-closed。

CI：`.github/workflows/v310-gmque-handoff.yml`。
