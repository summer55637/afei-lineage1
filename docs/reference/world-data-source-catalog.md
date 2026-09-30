# World Data Source Catalog

更新日期：2026-09-30

## 目的

這份文件把 fixed C 的「世界資料層」整理成可追蹤的 source inventory。它不是 playable data，也不會自動啟用 NPC／任務／商店。

固定來源：

- repository：`gavinlinasd/StoneAge`
- ref：`1f90cb6cb57c1df70f39cde77a5a8ccd98b66c56`
- root tree：`33f71a5f804480cec28edee4bd6a6d1851ba2dab`

固定 C 的 `NPC_readNPCSettingFiles()` 會依序載入 NPC template 與 create；`npcgen.c` 再依 create 的 floor、出生範圍、移動範圍等資料生成 NPC，並把 template 的 function set 與 NPC argument 複製進角色。這代表我們日後要重建世界，不能只做「NPC 名稱清單」，而要保留：

`map → create → template → functionset → arg → source function`

這條完整關係。

## 目前盤點結果

固定 source tree 約有 5,764 個 blob files。

其中：

- `gmsv/data` 頂層資料檔：49
- `gmsv/data/npc/`：3,960 個檔案
- NPC `.arg`：1,161
- NPC `.create`：354
- NPC `.template`：88
- 另外存在大量無副檔名資料，以及少數 `.conf`、`.gen` 等檔案。

最大的 NPC 目錄是 `genout`，其次是 `my`、`eden1`、`doujyou`、`family`、`eden3` 等；因此不能只研究早期薩伊那斯 NPC。

## C 已經證明的 NPC 模型

`readnpc.c`：入口會先讀 templates，再讀 creates。

`npccreate.c`：create 格式至少包含：

- floorid
- borncenter / borncorner
- movecenter / movecorner
- dir
- graphicname
- name
- time / date
- createnum
- boundary / ignoreinvincible
- family
- action
- enemy / template references

`npcgen.c` 更進一步證明 NPC 生成會依 born region 抽座標、檢查 walkability，再將 template 的 graphic、name、function set、argument 等資料建立成實際角色。

因此下一版 world catalog 的資料模型應以「NPC instance」為中心，而不是以單一 template 為中心。

## 世界資料第一批來源

| Source | 用途 | 目前 |
|---|---|---|
| `gmsv/data/npc/**` | NPC template/create/arg/event/service | **最高優先** |
| `gmsv/data/map/mapwarp.txt` | 地圖 warp / world connectivity | **最高優先** |
| `gmsv/data/mission.txt` | 任務列表 | 高優先 |
| `gmsv/data/membershop.txt` | 會員商店 | 高優先 |
| `gmsv/data/memberpets.txt` | 會員寵物 | 高優先 |
| `gmsv/data/ride.txt` | 坐騎 | 中高優先 |
| `gmsv/data/titleconfig.txt` + `titlename.txt` | 稱號 | 中優先 |
| `gmsv/data/question.txt` | 問答 | 中優先 |
| `gmsv/data/jobdaily.txt` | 每日任務 | 中優先，依 compile flag |
| `gmsv/data/raceman.txt` / `racequiz.txt` | 寵物競賽 | 中優先 |
| `gmsv/data/needitemeneny.txt` | 道具／敵人條件 | 高優先 |

## 一個新的 source anomaly

固定版本的 `gmsv/data/npc/bank/bankman.template` 參考：

- `NPC_GambleBank`
- `NPC_MemberShop`
- `NPC_MemberPets`

但同一 pinned ref 的 `gmsv/src/npc/npctemplate.c` function-set table 中沒有 `NPC_MemberShop`、`NPC_MemberPets`。

這不能直接解讀成「應該新增兩個函式」，比較安全的判定是 **source anomaly / historical or conditional residue**。

因此目前決策：

> 不自行補 function，不讓這兩個名字直接進 playable runtime；先找到對應 source history 或 compile-condition evidence。

## 世界資料的真正下一步

接下來不是直接做 UI，而是建立第一版 machine-readable chain：

`NPC file → template/create/arg → map/floor → position → functionset → available action/service`

並再向下串：

`NPC → item/shop/quest/reward/warp/pet service`

這會直接解決目前幾個主要問題：

1. 玩家出生後能去哪裡。
2. 地圖上有哪些 NPC。
3. 每個 NPC 提供什麼服務。
4. 任務從哪裡開始。
5. 道具從哪裡取得。
6. 地圖如何連接。
7. 寵物／坐騎／稱號等服務在哪裡。
8. 哪些內容是固定 source，哪些只是歷史或條件功能。

## Evidence policy

不同 StoneAge fork 可以用來做 discovery，但不能因為另一個 fork 有某筆 NPC data 就直接升級到 pinned source。

任何要進 generated runtime 的資料，都必須保留：

- fixed repository
- fixed ref
- source path
- blob SHA
- parser / extraction rule
- closure status

無法閉合時就標成 `candidate` / `unresolved`，不猜、不跨版本搬運。

## 和最終遊戲的關係

這層完成後，才有條件把影片裡看到的：

世界場景 → NPC → 對話 → 商店／任務 → 戰鬥 → 獎勵 → 回到世界

真正串成完整遊戲。

