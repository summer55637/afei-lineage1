# 阿肥石器時代放置版

《石器時代 OL》PC／手機共用的純前端單機放置版。

## 目前版本

**PLAYABLE CORE V2.08**

目前專案已經從資料整理階段進入可玩核心與原 C 行為逐步對齊階段。

固定開發原則：

> **原 C 規則優先、不猜數值**

固定原 C 基準：

`gavinlinasd/StoneAge@1f90cb6cb57c1df70f39cde77a5a8ccd98b66c56`

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
