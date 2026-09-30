# World NPC Service Index

更新日期：2026-09-30

這份索引把 World NPC Index 中的 template/functionset 綁定進一步整理成「服務類型 → floor」資料。它仍是 source research data，不會直接啟用 playable NPC。

## 統計

- service functionsets：55
- service bindings：9,335
- unique service floors：1,031
- 同一 floor 存在兩種以上服務類型：592

注意：service binding 是 NPC template/create 的 functionset 綁定，不等同於玩家視角一定看到的唯一 NPC 數量。

## 已辨識的主要服務

| 類別 | functionsets | bindings | floors |
|---|---|---:|---:|
| 商店 | ItemShop / ItemchangeMan / PetSkillShop / PetShop / PoolItemShop | 557 | 246 |
| 移動 | Warp / WarpMan / Airplane / TranserMan / FMWarpMan / Bus / Riderman | 4,495 | 837 |
| 治療 | WindowHealer / Healer / FmHealer | 67 | 61 |
| 進程 | Transmigration / PetFusion | 9 | 5 |
| 資訊 | TownPeople / SignBoard / Quiz / Dengon / Windowman | 1,079 | 274 |
| 社交 | FmDengon / Familyman / Bankman / FMPKMan / FMPKCallMan / FmLetter | 103 | 50 |
| 系統 | TimeMan / Charm / LuckyMan / Mic | 52 | 26 |

## 未閉合 functionset

World NPC Index 仍有 20 種 data functionset 沒有直接對應 pinned C 主 registry。

其中：

- `ExChageMan` → pinned registry 有 `ExChangeMan`，屬 alias candidate。
- `NPC_MemberShop` / `NPC_MemberPets`：目前只有 bank template evidence。
- `Auctioneer`、`BigSmallMaster`、`BigSmallPet`、`Doorman` 等可以找到 C module，但主 registry 仍沒有同名 entry。
- 其餘若沒有對應 source module 的名稱保持 unknown / non-promoted。

因此 service index 只作「來源定位」，不會把 unknown 自動變成可用功能。

## Map connectivity

同時已建立 World Graph：

- mapwarp rows：5,457
- floor nodes：1,139
- directed floor edges：2,182
- same-floor rows：645
- cross-floor rows：4,812
- weak components：24
- 最大 weak component：685 floors

所有 5,457 筆 mapwarp endpoint 已通過 source map header 的 floor / width / height 驗證；沒有缺失 floor，也沒有越界座標。

這使後續可以從「NPC 位於哪張圖」進一步推進到「玩家可以從哪裡到哪裡」。

## 下一步

接下來把三條資料正式接起來：

`World Graph floor → NPC service → NPC arg → item / quest / warp target`

先處理真正會影響早期遊戲流程的：

- 出生地與新手 NPC
- 主要城鎮商店／醫療／存點
- 主要野外入口與傳送點
- 任務開始／完成 NPC
- 寵物店／寵技／職業服務

仍不建立 playable HTML。
