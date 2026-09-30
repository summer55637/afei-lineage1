# Item Reward Gap Clusters

更新日期：2026-09-30

## 固定來源

`gavinlinasd/StoneAge@1f90cb6cb57c1df70f39cde77a5a8ccd98b66c56`。

active item loader 使用 `itemset6.txt` 第 17 欄作為 `ITEM_ID`。`ITEM_makeItemAndRegist()` 對 item table 做實際 index 驗證，因此 reward ID 不存在於 active table 時，視為 source closure gap。

## 精確掃描

- NPC files：3,960
- reward occurrences：2,866
- resolved reward occurrences：2,572
- unresolved reward occurrences：294
- unique unresolved reward IDs：163
- AddItem unresolved：24 occurrences、19 IDs
- GetRandItem unresolved：274 occurrences、146 IDs

## 三個 source clusters

| Cluster | unique IDs | files | roles | 代表資料 |
|---|---:|---:|---|---|
| `my` | 140 | 18 | AddItem / GetRandItem | `mowang`、`mowang2` 魔王／兌獎鏈 |
| `party` | 17 | 4 | GetRandItem | `piggod` 烏力王事件 |
| `giiru` | 6 | 1 | GetRandItem | `event/nev1_5` 四勾玉地下城事件 |

這三群都是 custom/event data，而不是一般 ItemShop 的普遍商品表。

### my / mowang

`mowang.create` 明確在 2000、154–157、147、200、208、202 等 floor 建立魔王／兌獎／傳送／治療 NPC。`mowang0.arg`、`mowang1.arg` 會以 `AddItem` 發放 19395、19396；`jiang.arg` 再以這些票券 `DelItem` 並 `GetPet`。`mowang2/jiang.arg` 則以 22216–22224 作兌獎票，並從大型 `GetRandItem` 清單抽獎。

這表示缺失 item ID 是一條具體的活動／兌獎資料鏈，不應直接拿一般道具替代。

### party / piggod

`piggod.create` 把 NPC 放在 floor 100；`piggod`／`DEADJOE` 以 2838–2847、2880–2882 作為烏力王任務卷軸，要求 `ITEM` + `PET` + `NOWEV=170`，失敗時再 `GetRandItem`，成功時 `GetPet:2492` 與 `EndSetFlg:170`。

這是非常完整的任務／寵物／道具狀態鏈，但目前使用的部分卷軸 ID 不在 active item table，所以整條流程仍不能升格成可玩 runtime。

### giiru / nev1_5

`nev1_1.create` 在 floor 31610 放置兩個 `石像`，都指向 `giiru/event/nev1_5`。該腳本要求四個物品 2528–2531，刪除後從一組 `GetRandItem` 中隨機產生獎勵。

因此這裡的 unresolved reward items 屬事件 dungeon reward pool，與主線新手流程沒有直接等價關係。

## 判定政策

目前不把任何 unresolved reward ID 映射到其他 item，也不建立 placeholder reward。

原因很簡單：fixed C 的 item creation 是 table-index based；錯誤補值會改變真正的任務／經濟規則。

## 下一步

1. 先找出 38 個 ownerless event IDs 是否與這些 custom event cluster 有關。
2. 再建立 Item Acquisition Graph：NPC event → condition → consume → reward → event state。
3. 完成第一批主線／新手路徑後，才進 persistent state schema。