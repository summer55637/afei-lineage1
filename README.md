# 阿肥石器時代放置版

《石器時代 OL》PC／手機共用的純前端單機放置版。

## 目前版本

**PLAYABLE CORE V2.13**

目前專案已經從資料整理階段進入可玩核心與原 C 行為逐步對齊階段。

固定開發原則：

> **原 C 規則優先、不猜數值**

固定原 C 基準：

`gavinlinasd/StoneAge@1f90cb6cb57c1df70f39cde77a5a8ccd98b66c56`

## V2.13 最新進度

V2.13 完成第一組裝備 callback：`ITEM_WearEquip / ITEM_ReWearEquip`。固定 item table 中只有 **Item 1975、20130** 使用這組 callback，兩件都是 `ITEM_TYPE=11` 戒指、無 profession 限制。

原 C 行為：

- `ITEM_WearEquip()`：`CHAR_PickAllPet = TRUE`
- `ITEM_ReWearEquip()`：`CHAR_PickAllPet = FALSE`
- `BATTLE_CaptureCheck()`：只有在 `CHAR_PickAllPet != TRUE` 時才套用「敵寵等級不得高於玩家等級 +5」；旗標 TRUE 直接跳過這條等級限制。
- 捕獲率後面的 HP／等級／DEX／Luck／Charm 計算完全不變。

Web 現在允許這一組 callback 通過裝備 gate；`sourcePlayerPickAllPetEnabled()` 從目前 9 格已裝備 existing item 推導 Work flag，所以裝上／卸下、重新讀檔都與目前裝備狀態一致，**不新增永久存檔欄位**。捕獲判定改由 `sourcePlayerCaptureLevelAllowed()` 套用 fixed `CHAR_PickAllPet` 規則。

其餘 5 組 callback 仍維持 `callback-unported` fail-closed，不擴大猜測。

新增 `tools/check_v213_pickallpet_equip_callback.mjs`。save schema 維持 **29**。

## V2.12 最新進度

V2.12 收斂玩家裝備 adapter 的 **使者／勇者信物特殊邊界**，只修 fixed C 能完整證明的部分。

- fixed build 開啟 `_ANGEL_SUMMON`。
- `ANGELITEM=2884`、`HEROITEM=2885`。
- `CHAR_moveItemFromItemBoxToEquip()` 的 MissionTable／所有權檢查 **只套用 Item 2884**。
- 2884 固定 item table 是 `ITEM_TYPE=10`，無 profession／attach／detach callback；Web 尚無多人 MissionTable，因此仍維持 `special-equip-unported`。
- 2885 固定 item table 是 `ITEM_TYPE=16 (ITEM_OTHER)`，同樣無 profession／attach／detach callback；原 C `ITEM_getEquipPlace()` 對 type 16 本來就回 `-1`，所以不是可裝備品，也不該被歸進 2884 的特殊任務 gate。

因此 `SOURCE_PLAYER_SPECIAL_EQUIP_IDS` 從 `[2884,2885]` 修正為只含 `[2884]`。新增 `tools/check_v212_special_equip_boundary.mjs`，直接執行 production `sourcePlayerEquipRequirements()` 與 `sourcePlayerEquipPlace()` 驗證分流。

save schema 維持 **29**。

## V2.11 最新進度

V2.11 不再擴張合成規則，而是先把 V2.10 的 live lifecycle 鎖成**可執行 fixture regression**。測試會直接從 `game.js` 抽出目前 production 的 `sourceMergeLifecyclePreflight()`、`sourceConsumeTrackedExistingItem()`、`sourceMergeCooldownState()`、`sourceMergeExecuteLifecycle()`，放進 Node `vm` 執行，不只做字串搜尋。

固定 fixture：

- **滿背包 preflight**：15 個背包格全滿時，直接 `merge-backpack-full`，不進材料模板／RNG。
- **pile > 1**：消耗 1 pile，只把 `ITEM_USEPILENUMS` 減 1，existing 與 aggregate inventory 都保留。
- **pile == 1**：消耗後 free existing、清 CHAR 背包 slot，aggregate inventory 才減少。
- **正常成功**：merge count +1 → 材料消耗 → 成品 existing → `ITEM_MERGEFLG=1` → 加入第一個空背包格。
- **cooldown fallback**：確認 `5+(num-2)` 命中後 timestamp 先更新，core 收到 `cooldownHit=true`，仍走材料消耗與成品生命週期。
- **mixed dish -10**：不產生成品，但 merge count 仍 +1、有效材料仍各扣 1 pile。
- **成品加入失敗**：已建立的成品 existing 會依原 C free；材料與 merge count 不回滾。

新增 `tools/check_v211_merge_live_fixtures.mjs`，並加入 GitHub Actions。save schema 維持 **29**。

## V2.10 最新進度

V2.10 正式把 200／201 `PETSKILL_Merge` 從 pending gate 接成可玩的原 C lifecycle；RNG 與物品 mutation 現在一次完整執行，不再存在「只吃 RNG、不刪材料／不產生成品」的半套狀態。

固定順序：

1. `CHAR_findEmptyItemBox` 等價檢查先執行；背包 15 格全滿時直接拒絕，**0 RNG、0 材料 mutation**。
2. 每個有效 `CANMERGEFROM==1` input 先各跑 `ITEM_makeItem`，仍是 66 顆 RAND／件。
3. 有效材料 >1 後，以 `time(NULL)` 秒級 timestamp 鏡像 `CHAR_WORKLASTMERGETIME`：門檻是 `5+(num-2)` 秒；命中 cooldown 會更新 timestamp，再吃 `RAND(0,num-1)` 回傳某個 input ITEM_ID。
4. 正常路徑接 V2.09 atom／retry executor；`-10` mixed dish 與 `-1` no-atom 都視為原 C 真實負結果。
5. 只要已進 `ITEM_mergeItem()`，原 C 都先把本次有效材料各扣 1 `ITEM_USEPILENUMS`；扣到 0 才解除背包 slot 並 `ITEM_endExistItemsOne`。
6. `ret>=0` 才 `ITEM_makeItemAndRegist(ret)`；這一步會再跑成品自己的 66-field `ITEM_makeItem` RNG。
7. 成品 existing 先設 `ITEM_MERGEFLG=TRUE`，再 `CHAR_addItemSpecificItemIndex` 加入背包。
8. 若加入背包失敗，依原 C 立刻銷毀新成品 existing；已消耗的材料與 RNG 不回滾。
9. `CHAR_MERGEITEMCOUNT` 也在每次有效材料 >1 的嘗試後累加；Web 以 `mergeItemCount` 保存。
10. `CHAR_WORKLASTMERGETIME` 是 Work 值，因此 Web 只保留在目前頁面執行期，不寫入存檔；save schema 維持 **29**。

新增 `sourceMergeCooldownState()`、`sourceMergeLifecyclePreflight()`、`sourceMergeExecuteLifecycle()` 與 `tools/check_v210_merge_live_lifecycle.mjs`。

## V2.09 最新進度

V2.09 把 200／201 的 fixed-C RNG **執行核心**串完整，但為避免「吃 RNG 卻不產生成品」的半套狀態，玩家按鈕仍不呼叫 executor；下一版和材料刪除／成品建立一起原子化啟用。

已固定執行順序：

1. 依背包 slot 升冪掃選取物品。
2. 只有 `CANMERGEFROM==1` 的物品先各跑一次 `ITEM_makeItem()`。
3. 每件 `ITEM_makeItem()` 固定消耗 **66 顆 RAND**，包含 width=0 的欄位。
4. 若有效材料不足 2 件，到此結束；已發生的 66×N RNG 不回滾。
5. 原 C 5+(num-2) 秒 cooldown 位於這些 66×N RNG **之後**；cooldown 命中時再吃一顆 `RAND(0,num-1)`，直接回傳其中一件 input ITEM_ID。
6. 正常路徑才做 mixed-dish、atom simplify 與每 atom 的 `ITEM_randRange()`。
7. `ITEM_randRange()` 只有真正 range>0 時才吃一顆 RAND；rate=0、range=0 等原 C early return 不吃 RNG。
8. 然後第一次 candidate scan 取得 hitnum。
9. 每次 `ITEM_merge_with_retry()` 先吃 `RAND(0,999)`，**再**檢查 `extractcnt>=ideal`；完全失敗時所以會多一顆 terminal RAND。
10. 命中 candidate 後再吃一顆 `random()%match`。
11. 一個 `ITEM_mergeItem()` 最多呼叫 5 次 retry；五次全敗後再吃一顆 `RAND(0,num-1)`，回傳一個 input ITEM_ID。

GNU libc 的 `rand()` 與 `random()` 共用同一個 `__random()` 狀態，因此 V2.09 也維持 Web 既有的單一 RNG stream lifecycle；Web 並不宣稱複製 glibc 的 bit-for-bit PRNG，只鎖原 C 的呼叫順序與分支消耗。

新增：

- `sourceMergeMakeInputClones()`
- `sourceMergeCollectCloneAtoms()`
- `sourceMergePrepareClones()`
- `sourceMergeExecuteRandRangePlan()`
- `sourceMergeExecuteRetryOnce()`
- `sourceMergeExecuteRetryOuter()`
- `sourceMergeExecuteCoreRng()`
- `tools/check_v209_merge_rng_lifecycle.mjs`

代表 regression：

- ideal=3 立即命中：1 顆 retry RAND + 1 顆 modulo RNG
- ideal=3 完整失敗一次：3 個 unique class + 1 顆 terminal extra RAND = 4 顆
- duplicate class 仍吃 RNG，不增加 extractcnt
- ideal=3 五次 retry 全敗 + input fallback：**21 顆** retry/fallback RAND

目前 live 200/201 回傳 `mergeRngLifecycleReady=true`，但仍保持按鈕端 **0 RNG consumption**，等下一批 lifecycle 原子化。

save schema 維持 **29**。

## V2.08 最新進度

V2.08 延續 200／201 `PETSKILL_Merge`，完成 `ITEM_merge_with_retry()` 的**候選 cache 與 retry 規則前置**，仍不實際擲 RNG。

固定來源結果：

- pinned build `_IMPOROVE_ITEMTABLE` 關閉，因此 `icache[i]` 的 `i` 就是 `ITEM_ID`
- itemset6 共 5808 個 `CANMERGETO`
- 其中 5804 個具有至少 1 個可解析 ingredient，成為真正 candidate
- candidate ingredient 數量分布：
  - 1 種：11
  - 2 種：270
  - 3 種：1278
  - 4 種：2892
  - 5 種：1353
- 31518 個 ingredient entry 全部可對到固定 112 atom，unknown = 0
- fixed `MAXMATCH=2048`

`ITEM_merge_with_retry()` 第一個新的 RNG 是 `RAND(0,999)`，依 unique atom 數（最多 5）決定這次要求 candidate 必須有幾種 ingredient。V2.08 已鎖定原表：

- ideal 1：1種 100%
- ideal 2：1種 25%、2種 75%
- ideal 3：1種 15%、2種 25%、3種 60%
- ideal 4：1種 7%、2種 19%、3種 44%、4種 30%
- ideal 5：1種 4%、2種 16%、3種 30%、4種 24%、5種 26%

同一 `ITEM_merge_with_retry()` 呼叫裡，第一次 class 才掃全部 icache 並寫 `hitnum`；後續抽到不同 class 只重用第一次的 hitnum。若抽到已試過的 class，仍會消耗 RNG 後直接 continue。

候選 range matching 也已來源化成 pure plan：

- 加工：依 `ItemRandTableForItem[table].rate` 比上下限，普通寵上限額外 cap 1000
- 料理：`ItemSearchTable[1] = 0.7～1.3`
- 普通寵料理會把過高的 `ingtable[k]` **原地改成 814**（`1059 / 1.3` 的 C int 截斷），這個 mutation 已保留
- candidate 必須 `hitnum == inguse == extractnum`
- 輸入材料本身的 ITEM_ID 不可成為結果
- 命中結果最後由原 C `random() % match` 再選一個

代表 regression：

- atom 皮/骨/線，各 305 → extract 3 唯一命中 candidate **2106**
- 料理 atom 26、值 900 → 先原地 clamp 814，extract 1 唯一命中 **2506**

目前 action 只建立 candidate cache + retry spec，保持 `sourceNoRngConsumed=true`。下一步才會把前面的 `ITEM_makeItem` 66×N RNG、atom `ITEM_randRange` RNG、retry `RAND(0,999)` 與 `random()%match` 串成真正原 C RNG lifecycle。

save schema 維持 **29**。

## V2.07 最新進度

V2.07 延續 200／201 `PETSKILL_Merge`，只完成下一小塊固定數值鏈：

`ITEM_simplify_atoms() → ITEM_getTableNum() → ITEM_randRange() plan`

這一版仍 **不實際消耗 RNG、不產生成品、不刪材料**；只把可以完全由原 C 證明的「材料整理＋隨機範圍計畫」算出來。

已固定：

- `itematom.txt` 跨檔名稱比對改用 latin1 1:1 source-byte key，與 V2.04 `ITEM_INGNAME` runtime 相同
- `ItemRandTableForItem` 20 級：0～24、25～54……最後 3692～4000
- `ITEM_GEN_RATE=0.7`
- `oddstable = 0.1, 0.25, 0.35, ... 0.53`
- 同素材先升冪排序，再以前一筆「已被修正後的 double 值」逐級疊加
- 最終依 C cast 截成 int；普通出戰寵上限 1000
- 超過 15 筆同 atom 會碰到原 C oddstable 邊界，因此 Web 直接 no-guess，不讀陣列外
- `ITEM_randRange` 的 min/max rate、C `rint`（ties-to-even）、range=0 時回 base 的怪行為已轉成 plan
- 加工／料理仍由第一個可合成物品的 `ITEM_TYPE==20` 決定 searchtable，不拿技能 ID 200/201 猜
- 非 `CANMERGEFROM` 物品依原 C 跳過；料理與非料理混用依原 C `-10` 規則拒絕
- item ingredient 找不到 atom 時，依原 ADD_INGRED 巨集直接跳到下一件物品，該物品後續 ingredient 不處理

V2.07 action 目前會回報 static prepare 結果與「預計 atom RNG 次數」，但保持 `sourceNoRngConsumed=true`。下一缺口仍是 `ITEM_merge_with_retry()` 的成品候選搜尋與後續完整 lifecycle。

save schema 維持 **29**。

## V2.06 最新進度

V2.06 先以小批次完成 200／201 `PETSKILL_Merge` 的 **enemybase 寵物加工修正來源層**；成品抽選與完整 lifecycle 尚未接完，所以仍維持「不猜合成結果」。

### V2.06 enemybase / itematom Pet merge-fix runtime

新增 pinned runtime：

- `enemybase1.txt`：1816 列、1813 個唯一 TempNo
- 980 個 TempNo 有 ATOM 加工修正
- 4602 個非空 ATOMFIX slot
- 4572 個可在 `itematom.txt` 精確解析；30 個固定來源本身無對應 atom
- `itematom.txt`：112 個唯一素材名稱
- 固定 `_MERGE_NEW_8` 關閉，因此 `ITEM_RANDRANGEDOM_BASE=0`
- 2 組 min/max 依原 C 在成功解析 atom 後交換
- 原 `ITEM_merge_getPetFix()` 外層 5 次迴圈會把 5 個 slot 重跑 5 次；有效資料實際展開 22860 筆
- 找不到 atom 時原巨集的 `continue` 會直接進下一個外層 pass，因此後續 slot 被跳過；固定資料共發生 75 次 pass abort
- runtime 維持 lazy-load，不加入開機 Promise.all
- 玩家 Pet 已有的 source `petId`（fixed `CHAR_PETID = E_T_TEMPNO`）直接作 TempNo lookup，不拿 Web id 猜

新增：

- `tools/generate_pet_merge_fix_runtime.py`
- `data/generated/stoneage_pet_merge_fix_runtime.json`
- `tools/check_v206_pet_merge_fix_runtime.mjs`

200 加工／201 料理現在會先載入並解析出戰寵的固定 ATOM 修正；但 `ITEM_mergeItem_merge` 的完整 merge table/runtime 與成品 lifecycle 尚未完全來源化，因此仍回傳 pending，不先造合成結果。

save schema 維持 **29**。

## V2.05 最新進度

V2.04～V2.05 已正式進入 **field=2 寵物生活技能**。

### V2.04 固定 item field=2 runtime

新增 pinned `itemset6.txt` 字串 runtime：

- 固定來源：`gavinlinasd/StoneAge@1f90cb6cb57c1df70f39cde77a5a8ccd98b66c56`
- `itemset6.txt` **10737 / 10737** 筆模板解析成功
- syntax error 0、duplicate ID 0
- 296 筆模板有 `TYPECODE`
- 9437 筆模板有修復材料 `INGNAME0～4`
- 1759 個 nonblank item function string
- 保留 `TYPECODE / INLAYCODE / ARGUMENT / SECRETNAME / INGNAME0～4` 與完整 function strings
- legacy 字串採 latin1 byte-preserving，只做原 C exact equality / ASCII token 判斷，不把亂碼當顯示文字猜譯
- 約 1.9 MB runtime **只在真的使用 field=2 技能時懶載入**，不增加每次開遊戲的手機負擔

### V2.05 540 修復 / 572 鑲寶石

玩家目前可從現有 15 格 source-backed 背包選材料，並由出戰寵實際擁有的 field=2 PetSkill 執行：

- **540 修復 / `PETSKILL_Fixitem`**
  - 最多選 2 個物品
  - 料理不可修復
  - 必須恰好一件武器／防具（ITEM_TYPE 0～15、17～19）
  - 材料 `INGNAME0` 必須精確匹配目標 `INGNAME0～4`，或材料 `ARGUMENT=FIXITEMALL`
  - 耐久必須低於 Max × 80%
  - Max 耐久 <500 不可再修
  - 成功後新 Max = `trunc(oldMax × 0.85)`，目前耐久直接補至新 Max，`CRUSHLEVEL=0`
  - 材料依固定 `CHAR_DelItem(...,1)`：堆疊 >1 只扣 `ITEM_USEPILENUMS` 一個，剩 0 才 free existing item

- **572 鑲寶石 / `PETSKILL_Inslay`**
  - 最多選 4 個物品
  - 每個物品都必須有 nonempty、非 `NULL` TYPECODE
  - 恰好一件 TYPECODE 含 `INSLAY` 的基底裝備
  - 固定資料實際有 **200 個 INSLAY 基底模板**
  - INLAYCODE 固定三格，填第一個 `NULL`
  - 精確相加 8 欄：攻／防／敏／HP／MP／運／額外傷害／額外防禦
  - 材料 MAGICID >0 時覆蓋 MAGICID / MAGICUSEMP
  - 材料的 init / preOver / postOver / watch / use / attach / detach / drop / pickup / **relife** 10 個 function string 與 ARGUMENT 全部覆蓋到目標
  - 多材料逐個提交；後一顆失敗不回滾前面已成功的原 C 變更
  - 鑲入 `ITEM_DIErelife` 後，目標裝備死亡時會真正進現有死亡復活 lifecycle，不只是保存字串

固定資料另確認只有 **1 個 FIXITEMALL** 萬用修復材料模板。

200 加工／201 料理雖已顯示為 field=2 技能，但目前 `ITEM_mergeItem_merge` 的完整 merge table/runtime 尚未來源化，因此仍明確 **不猜合成結果**。

新增：

- `tools/generate_item_field2_runtime.py`
- `data/generated/stoneage_item_field2_runtime.json`
- `tools/check_v204_item_field2_runtime.mjs`
- `tools/check_v205_player_field2_fixitem_inslay.mjs`

V1.72～V2.06 regression 已接入同一條 CI；`game.js` syntax check 維持。

V2.03 field=0/1 coverage closure 與 V2.02 Combined lifecycle 全部保留。

save schema 維持 **29**。

## 目前主要系統

- PC／手機共用網頁遊戲
- 166 組一般野外 Lv1 捕獲基準
- Encounter → Group → Enemy → RandomEnemy → RandomChange 原版生成鏈
- Enemy 掉落與 existing-item lifecycle
- 玩家／寵物／Enemy 戰鬥核心
- 大量 PetSkill 與原 C RNG lifecycle
- Player 9 裝備格 + 15 existing-item 背包格
- ITEM_makeItem / ITEM_equipEffect source-backed runtime
- 玩家裝備需求、四屬性、異常抗性、會心、命中、忽防、額外傷防
- Player / Pet death、Ultimate、裝備死亡復活、GMQUE trophy lifecycle

## 重要檔案

- `game.html`：遊戲入口
- `game.js`：主要遊戲與原 C 對齊邏輯
- `game.css`：PC／手機共用介面
- `data/generated/stoneage_item_make_runtime.json`：固定 Item template runtime
- `tools/`：資料生成與 regression 工具

## 完整開發紀錄

原 README 已超過 GitHub 首頁 README 的顯示上限，因此從 V1.74 起改為「精簡首頁 + 歷史分檔」。

**舊內容沒有刪除。**

➡️ [查看完整 CHANGELOG / 歷史索引](CHANGELOG.md)

歷史已拆成：

- [專案起點～V0.46](docs/changelog/part-01-intro-to-v0.46.md)
- [V0.47～V0.72](docs/changelog/part-02-v0.47-to-v0.72.md)
- [V0.73～V0.96](docs/changelog/part-03-v0.73-to-v0.96.md)
- [V0.97～V1.26](docs/changelog/part-04-v0.97-to-v1.26.md)
- [V1.27～V1.51](docs/changelog/part-05-v1.27-to-v1.51.md)
- [V1.52～V1.74](docs/changelog/part-06-v1.52-to-v1.74.md)
- [V1.75～](docs/changelog/part-07-v1.75-onward.md)

之後新版本只需要在首頁更新「目前版本／最新進度」，詳細技術紀錄繼續寫入 CHANGELOG 分檔，就不會再發生首頁看起來卡在舊版本的問題。
