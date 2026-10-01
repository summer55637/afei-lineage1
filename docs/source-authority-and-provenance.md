# Source Authority / Provenance Contract

更新日期：2026-10-01

## 核心修正

本專案現在把「來源權威」與「資料完整度」分開管理。

依目前專案已確認的 provenance，VM 一鍵端與手工外網端都是從可直接架設石器時代手游的實際部署資料複製取得，因此它們不是一般網路參考資料，而是目前最接近「完整可部署遊戲版本」的第一手資料集合。它們因此成為 World、NPC、Service、Item、Quest、Event、Warp、Encounter、Database、Web/Client integration 與部署結構的首要重建資料來源。

Pinned fixed-C 仍然非常重要，但它的角色改為：

- 固定的引擎行為與語義基準。
- 演算法、執行順序、資料結構邊界與 C runtime 行為的校驗基準。
- 當實機端資料與 fixed-C 不一致時，用來辨識 endpoint variant，而不是自動把 endpoint 資料判成錯誤。

因此「最完整的資料來源」與「最高的引擎行為依據」不是同一件事。

## 來源層級

### A. 實機／部署資料主來源

#### A1. VM 一鍵端

ro0000/ 中除明確指定的手工外網端以外，全部屬 VM 一鍵端。

主要用途：

- 世界資料
- NPC / Service
- Warp
- Encounter / Group / Enemy
- Item / Shop
- Quest / Event
- Database
- Server / Client 配套
- 實際部署所使用的 variant

#### A2. 手工外網端

只有：

- ro0000/docs/搭建教程.txt
- ro0000/server/merged-source/wwwroot/

主要用途：

- 外網端架設與操作
- Web root / website integration
- 手工部署流程與 endpoint-specific data

### B. Pinned fixed-C

gavinlinasd/StoneAge@1f90cb6cb57c1df70f39cde77a5a8ccd98b66c56

主要用途：

- 引擎行為
- C runtime semantics
- 精確數值公式
- transaction / lifecycle 順序
- map / NPC / battle / item 等底層語義

### C. 影片／視覺參考

用途：

- 流程呈現
- UI / UX
- 角色、地圖、戰鬥與操作方式的視覺方向

不能單獨用來發明 source 數值或 server 規則。

### D. GitHub / Google 等外部交叉查找

用途：

- 補缺 evidence
- 找不同版本的實作
- 驗證疑難 source boundary

只能作為補充證據；有更高層級的專案內來源時，不可覆蓋其明確證據。

### E. afei-lineage1 自有產品層

用途：

- idle loop
- offline policy
- 自動補給
- AUTO 行為
- 現代 UI
- 放置版產品體驗

必須明確標示為本專案新增規則，不得冒充原版 source parity。

## 衝突處理

當 VM / 手工外網端與 fixed-C 不一致時：

1. 先保留 endpoint provenance。
2. 比對 exact file / blob / row / record identity。
3. 判斷差異是資料 variant、程式 variant、配置 variant 還是版本差異。
4. fixed-C 用來驗證「引擎應該怎麼運作」。
5. endpoint data 用來判斷「這個實機／部署版本實際有什麼」。
6. 無法判定時，建立 explicit variant / unresolved，不任意覆蓋其中一方。

因此：

variant ≠ 錯誤

fixed-C mismatch ≠ 自動刪除 endpoint data

## Runtime 使用順序

正式 production reconstruction 的資料選擇遵循：

Endpoint Provenance → Exact Identity → Endpoint Completeness → Fixed-C Semantic Check → Evidence / Regression → Canonical Runtime

完整 endpoint corpus 由 `data/generated/stoneage_endpoint_source_catalog.json` 保存，執行規則由 `tools/generate_endpoint_source_catalog.mjs` 與 `tools/check_endpoint_source_catalog.mjs` 固定。

World-specific endpoint evidence 目前另有：`stoneage_endpoint_mapwarp_audit.json`、`stoneage_endpoint_item_seed_audit.json`、`stoneage_endpoint_battle_data_source_audit.json`、`stoneage_endpoint_npc_source_audit.json`；這些均屬 endpoint scope，不能與 pinned fixed-C generated catalog 混用。既有 `data/generated/stoneage_world_data_source_catalog.json` 則只代表 pinned fixed-C world source，不與 endpoint corpus 混用。

不是：

Fixed-C → 把所有 endpoint 差異都丟掉

## 開發底線

- 原始 endpoint 資料先保存，再做 normalized/generated data。
- 不因同名檔案就覆蓋另一端資料。
- 不把 endpoint variant 偷改成 fixed-C parity。
- 沒有足夠證據時 fail-closed。
- 若差異已能證明屬於 endpoint 的實際部署資料，優先建立 variant catalog，而不是把它當 blocker。
- blocker 仍遵守 README 的「只在有新 evidence 時重新開啟」規則。

## Authority Matrix

| 問題 | 首要依據 | 校驗依據 |
|---|---|---|
| 實際部署版本有哪些資料？ | VM 一鍵端＋手工外網端 | Exact identity / completeness |
| 世界／NPC／Item／Quest／Event 的實際配置？ | VM 一鍵端＋手工外網端 | pinned fixed-C semantics |
| C engine 怎麼執行？ | pinned fixed-C | endpoint implementation / regression |
| endpoint 為何與 fixed-C 不同？ | endpoint provenance + exact diff | 不同版本／外部 evidence |
| 哪些是本專案新增的放置規則？ | afei-lineage1 product policy | 不得冒充 source parity |

這張表是跨新對話與跨版本 audit 的快速判定基準：先確認「我們在回答哪一種問題」，再選對 authority；不能用單一來源包辦所有問題。
