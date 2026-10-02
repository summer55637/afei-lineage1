# Source Authority / Provenance Contract

更新日期：2026-10-02

## 核心修正

本專案現在把「來源權威」與「資料完整度」分開管理。

依目前專案已確認的 provenance，VM 一鍵端與手工外網端都是從曾可直接架設石器時代手游的實際部署資料複製取得，因此它們不是一般網路參考資料，而是本專案的重要第一手考據材料。它們用來還原 World、NPC、Service、Item、Quest、Event、Warp、Encounter、Database、Client integration 等經典內容與規則；**它們不是本專案最終產品的伺服器架構，也不是要重新架設多人私服。**

Pinned fixed-C 仍然非常重要，但它的角色改為：

- 固定的 C 程式行為與伺服器核心語義基準；它是可讀的程式碼證據，不等同於某一個實際部署快照本身。
- 演算法、執行順序、資料結構邊界與 C runtime 行為的校驗基準。
- 當實機端資料與 fixed-C 不一致時，用來辨識 endpoint variant，而不是自動把 endpoint 資料判成錯誤。

因此「實際部署資料」與「可讀程式碼語義」是不同證據角色；不能用單一來源包辦所有問題。

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

#### A3. Android 手游端（RO0000 附帶 APK）

ro0000/client/android/冰河石器-隐盟.apk 是與此部署快照一同保存的 Android 客戶端研究材料。其適用範圍限於可由 APK 本身驗證的客戶端內容，例如畫面、操作流程、客戶端資源與版本線索。

- APK 的存在本身不構成任何地圖、伺服器規則或路線的證據。
- 必須先記錄 APK 的檔案雜湊、封裝版本與可驗證的資源／程式位置，才可將提取內容納入 client evidence。
- 客戶端地圖或行為只能證明該客戶端版本呈現／執行了什麼；不能單獨覆蓋伺服器部署資料或 Fixed-C 的伺服器語義。
- 與伺服器資料不一致時，記為 client variant，保留來源，不直接改寫 endpoint 或 fixed-C。

### B. Pinned fixed-C

gavinlinasd/StoneAge@1f90cb6cb57c1df70f39cde77a5a8ccd98b66c56

主要用途：

- 可讀 C 原始碼中的伺服器核心行為
- C runtime semantics
- 精確數值公式
- transaction / lifecycle 順序
- map / NPC / battle / item 等底層語義

注意：Fixed-C 是程式碼證據來源，不代表 RO0000 實際部署快照，也不取代 endpoint 的版本／資料事實。

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
4. fixed-C 用來驗證「可讀 C 程式碼呈現的伺服器核心行為與語義」。
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
| 手機客戶端呈現／操作及客戶端資源？ | 有雜湊與版本識別的 RO0000 Android APK evidence | endpoint server data／實機畫面交叉比對；不得推論伺服器規則 |
| 哪些是本專案新增的放置規則或修復？ | afei-lineage1 product policy／明確 repair overlay | regression；不得冒充 source parity |

這張表是跨新對話與跨版本 audit 的快速判定基準：先確認「我們在回答哪一種問題」，再選對 authority；不能用單一來源包辦所有問題。

### Android APK first-pass audit (2026-10-02)

已對 ro0000/client/android/冰河石器-隐盟.apk 執行 ZIP／Manifest 稽核，固定 SHA-256：6899bffacce3560f25709d8e834b79a66e52711cf54d849cd36b05b4e7463d8c；Git blob：eaeb7c513ca0731c4bdeedd0987081b4bf443031。Manifest package 為 com.newssa.stoneage.ko，versionCode 1、versionName 1.0、minSdk 21、targetSdk 29；ZIP CRC 檢查通過，共 38 個項目。可見資料以字型、skin 圖片、DEX 及 SDL／Stoneage 原生函式庫為主，APK archive path 未找到明顯 map/tile/gameplay 檔名；但掃描 classes.dex 與 libStoneage.so 的原生字串後，已辨識 path/map4/real.bin、s/real.bin、s/adrn.bin、s/spr.bin、s/spradrn.bin、data/serverdata.dat、data/update/list.dat 等路徑參照。

目前只代表 archive identity 與 manifest 已驗證；這些是程式內路徑參照，不代表檔案存在於 APK 或一定由伺服器下載；地圖是否由 native library、另置資料、加密／封裝資料或伺服器供應仍未定。稽核結果見 data/generated/stoneage_ro0000_android_apk_audit.json；後續 CI 會以此 SHA／Manifest 作 baseline，APK 變動需重新審核。

## 2026-10-02 Client Evidence and Product Repair Boundary

Android APK 已納入來源矩陣，但仍維持 client-scope。尚未從 APK 擷取並驗證的內容，不得寫成已確認的手機端事實。

地圖通行修復屬產品層例外：只能透過具 ID、來源雜湊、座標、前置 tile、替代 tile 與回歸測試的明確 overlay；原始 map snapshot 不得被改寫。Overlay 只可解決產品路線，不可重新標註為原作道路或原始 source parity。

## 2026-10-01 State Management Reset

本專案不再把 feature／blocker 狀態設計成不可逆終身判決。

- `stoneage_disabled_features.json`：只保存目前真正停用的 feature。
- `stoneage_reopened_features.json`：記錄因新 endpoint evidence 而重新開案、但尚未 runtime/playable 啟用的 feature。
- `stoneage_blocker_registry.json`：記錄 active / reopened / resolved / retired blocker 與下一步。
- 新 endpoint corpus 可以使舊 fixed-C blocker 重新進入 re-audit；不需要維持「無限卡住」或「永久停用」的歷史結論。

重開仍遵守：

`reopened → source closure → semantic check → regression → runtime admission → playable`
