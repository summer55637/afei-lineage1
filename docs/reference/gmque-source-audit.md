# GMQUE Source Audit

本頁記錄 `main` 目前已證實的 GMQUE source contract，以及尚未足以啟用完整活動 UI 的資料缺口。

## 固定來源

- Repository：`gavinlinasd/StoneAge`
- Ref：`1f90cb6cb57c1df70f39cde77a5a8ccd98b66c56`
- Source：`gmsv/src/npc/npc_eventaction.c`
- 相關 function：`GMQUE_InSertQue`、`GMQUE_getQueStr`、`GMQUE_showQueStr`、`GMQUE_CheckQueStr`、`GMQUE_DelQueStrPet`、`GMQUE_AddQueStrTrophy`、`GMQUE_cleanQueStr`
- [固定 C source](https://github.com/gavinlinasd/StoneAge/blob/1f90cb6cb57c1df70f39cde77a5a8ccd98b66c56/gmsv/src/npc/npc_eventaction.c)

## 已證實的 queue / handover lifecycle

### 1. 建立任務

`GMQUE_InSertQue()` 從 NPC arg 讀取 `RANDGMQUE`，再依 `QUEPART%d` 讀取每一組候選資料。每組先以 `RAND(1, nums)` 選 option，再依 `LV=` 的 min/max 取 inclusive level，最後組成 `petID-LV` token；成功後寫入 `CHAR_GMQUESTR1` 並把 `CHAR_GMQUEFLG` 設為 10。

### 2. 顯示任務

`GMQUE_showQueStr()` 逐筆解析四個 token，透過 Enemy template 的 tempNo 查名字與 level。這表示完整可視化任務不能只顯示四個任意字串，必須能對應 pinned Enemy data。

### 3. Check

`GMQUE_CheckQueStr()` 要求目前 GMQUE flag 正確，並逐槽驗證四隻寵。主要匹配是 exact `CHAR_PETID` + level；在 tempNo 不一致時才有 Enemy template name fallback。所有四槽符合後，才第一次建立 `CHAR_GMQUENUMS`。該值來自 `rand()%100`，結果 0 會被正規化成 1。

### 4. 交寵

`GMQUE_DelQueStrPet()` 再驗證四個 target slot，符合後逐隻清除玩家 Pet slot 並結束 Pet object。它本身不負責獎勵抽取。

### 5. 領獎

`GMQUE_AddQueStrTrophy()` 讀取已保存的 `CHAR_GMQUENUMS`：

- `98..99`：pet，2/100。
- `41..97`：item，57/100。
- `1..40`：gold，41/100。

Item branch 再做 `RAND(0,100)`，落入五個固定 pool；Gold branch 做 `RAND(0,30)`，`15..30=20000`、`10..14=50000`，`0..9` 再做 `RAND(2,4)` 對應 100000 / 150000 / 200000。

### 6. Cleanup

只有成功的 trophy branch 才會呼叫 `GMQUE_cleanQueStr()`，清掉 `CHAR_GMQUESTR1`、`CHAR_GMQUEFLG`、`CHAR_GMQUENUMS`。

## 目前 Web runtime 對照

`data/generated/stoneage_gmque_trophy_runtime.json` 已固定保存上述 trophy branch、item pool、pet array、gold table、item lifecycle 與 cleanup contract；`game.js` 目前已有 `sourceGmQueActionValue()`、`sourceGmQueRewardType()`、`sourceGmQueResolveTrophy()`。

目前 `game.html` 仍明確標示「完整 GMQUE 活動 UI／交寵流程尚未啟用」。這是刻意維持的狀態：queue 的實際 NPC data 尚未閉合，而 reward pet template 雖已完成 source closure，persistent handover mutation 仍在下一個 runtime boundary。

## 尚未閉合的兩個 source boundary

### NPC `RANDGMQUE / QUEPART0..` data

C function 已明確證實 parser 與 token format，但尚未取得 pinned ref 下可直接核對的實際 NPC data entries。因此不能自行建立一組活動任務。

### Pet reward Enemy template

C 明確使用 `petID[] = {1642, 1636, 475}`，陣列第 4 格因 C zero-initialization 實際為 `0`；再用 `RAND(0,3)` 選擇。當選到 0 時 `ENEMY_getEnemyArrayFromId(0)` 可失敗。

目前只把 **ID 與 zero slot 行為**視為 fixed evidence；未取得完整 Enemy template 前，不建立 1642 / 1636 / 475 的自行拼裝 Pet。

## Evidence rule

Google / 其他 StoneAge fork 可以協助定位檔名、欄位與歷史脈絡，但不同 fork 的 data 不直接提升成 pinned source。只有能回到上述 fixed C ref 的資料或能以多個獨立來源一致證實、且不與 fixed C 衝突的資訊，才可以進 runtime。
