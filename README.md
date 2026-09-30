# afei-lineage1

本倉庫目前維持「無可玩前端」的乾淨重建狀態，先完成資料、來源證據、系統 contract 與視覺參考整理，再重新建立唯一的遊戲入口。

## 最終目標

重建「阿肥石器時代放置版」的完整遊戲體驗：

- 行為與數值：以 pinned fixed C / source evidence 為最高依據。
- 視覺與操作流程：以 `docs/reference/video-001-visual-reference.md` 為重要還原基準。
- 放置版新增規則：與原版 source 規則分層，明確標記，不混在 source parity。
- 最終網站：只保留一個 canonical playable entry，不再累積多個 HTML 入口。
- 最終呈現：採現代 3D 卡通化 MMORPG／回合 RPG 等級的世界、角色、戰鬥與 UI；依目前授權前提，可在授權範圍內直接整合石器時代手游的原始 UI／模型／貼圖／icon／字體／動畫等資產，以高還原方式完成 PC＋手機單機網頁放置版；未涵蓋的部分才使用本專案自己的素材。

## 目前狀態

- `main` 是目前唯一保留的 Git 分支。
- 舊版 `index.html`、`game.html`、`game-live.html`、`play.html` 等入口已移除。
- 舊版 `app.js`、`game.js`、`game.css`、`styles.css` 已移除。
- 舊 GitHub Actions、部署 workflow、root `CHANGELOG.md` 與 `.nojekyll` 已移除。
- 目前倉庫不包含可直接遊玩的前端。

## 已保留的研究基礎

- `_evidence/`：研究與來源證據。
- `client-assets/`：合法 client asset 注入用 manifest／介面。
- `data/generated/`：來源解析後的 runtime data、source closure 與 regression fixture。
- `docs/`：歷史研究、source contract、視覺參考與重建藍圖。
- `src/`：map / client asset / RD / palette / tile 等來源研究 runtime。
- `tools/`：解析、產生與驗證工具。

## 目前已完成的重要研究層

戰鬥規則已累積大量 fixed-C parity 與 regression；寵物、遇敵、職業技能、裝備與多個戰鬥反制流程已有 source-backed runtime。

地圖方面已完成 LS2MAP parser、mapset、battlemap、Encounter 座標探測，以及 client image → ADRNBIN → Real → RD → palette → RGBA 的技術鏈。

目前 source catalog 有 1284 個 map blobs，現有 11 張 verified map runtime；因此完整世界地圖與可行路線仍是主要待補區。

## 近期 first-route checkpoint（2026-09-30）

前一版 `stoneage-start-walkability-audit-v1` 沒有鎖定四個 hometown map 的 exact pinned source path，而是遞迴掃描 map floor 後取第一個命中，因此不足以作為 fixed-source walkability 的最終結論。

現在已修正為 `stoneage-start-walkability-audit-v2`：四張出生村地圖直接鎖定到 fixed C 的 pinned path，並在審計時驗證 Git blob SHA。

目前結果：

- 4/4 hometown source maps 通過 exact blob SHA 驗證。
- 8/8 direct hometown warp exits 可由出生座標以 source walkability 到達。
- 最短出生點→warp NPC 路徑為 4–7 步。
- 4/4 hometown start floors 都已存在 NPC service index。
- 46 個 start-floor NPC 座標現在全部由 fixed-C `borncorner` source 解出；其中 41/46 已完成 interaction reachability，5 個 `changeevent` blocks 因 pinned `npctemplate.c` 沒有 `changeevent` template 而維持 runtime-module unresolved。
- 4/4 direct destination floors 都有 source encounter row；其中 2/4（2000、3000）為 active encounter，1000、4000 僅為 0 機率／無 group 的 placeholder。

因此目前可把「出生點 → 直接離村 warp → 第一個有 encounter evidence 的 floor」視為 **source-route spine closed**。

這仍不是完整的 first-route gameplay closure：目前 46 個 start-floor NPC 座標已全部從 exact fixed-C `borncorner` 解出，其中 41 個 active-template NPC 已完成 interaction reachability、0 個 unreachable；5 個 `changeevent` instances 因 pinned `npctemplate.c` 缺少 template 而維持 runtime-unresolved。新增的 `stoneage_start_destination_closure.json` 顯示四個 destination floor 目前只有 2000 有 exact source map + walkability runtime；1000、3000、4000 的 fixed-source map blob 尚未在 source catalog 中閉合，因此不能用猜測或跨版本 map 補上。2000 的兩個 landing coordinates 都已確認 walkable。遇敵也已進一步依 fixed C 的 group item gate 分級：2000 的 Group 1018 要求 item 20219、3000 的 Group 1015 要求 item 20216，而 pinned `itemset6.txt` 是空檔，因此兩者目前都是 conditional_unresolved_item_source，不可直接當成一般掛機區。依 source world graph，四個 destination floor 往第一個具至少一個 unconditional encounter group 的候選 floor 分別是 100、100、200、200。新玩家 event 的 source create + shared script reference 已閉合，但 pinned fixed-C 的 `npctemplate.c` 沒有 `changeevent` module，且 `npccreate.c` 會拒絕 unknown template，因此目前標記為 `script_reference_closed_template_unresolved`；獎勵物品／寵物定義仍未全部閉合。對應 checkpoint 已寫入 `data/generated/stoneage_start_route_closure.json`，座標審計則在 `data/generated/stoneage_start_npc_reachability.json`。

## First-route world exit reachability 更新（2026-09-30）

本輪新增 `tools/audit_start_world_exit_reachability.mjs` 與 `data/generated/stoneage_start_world_exit_reachability.json`，將 floor-level world graph 再往下驗證成「direct landing 是否真的走得到下一層 source portal」。

結果：

- 1000→100：兩組 portal 都可達，最短 120 / 104 步。
- 2000→100：兩組 portal 都可達，最短 33 / 82 步。
- 3000→200：兩組 portal 均至少有一條可達路徑；其中一個 source origin `(73,59)` 因 object image 2 不可走。
- 4000→200：兩組 portal 的 source origins 雖然各自是 walkable cell，但都與 hometown 3 的 direct landing component 不連通，因此目前是座標級 route blocker。

同時發現原本的 `data/generated/stoneage_map_200.json` 來自 `gmsv/data/map/extra/200`，只有 30×30，不能容納 fixed-C world portal 使用到的 x=588、y=1008 等座標。fixed source tree 另有 `gmsv/data/map/jyaruga/jalga`（3,840,044 bytes）；本輪已由 GitHub Actions 直接 checkout fixed-C binary，完成 blob SHA、LS2MAP header、mapset 與 battlemap validation，floor 200 現在是 verified runtime（800×1200）。

本輪又新增 `data/generated/stoneage_start_encounter_target_index.json` 與 `data/generated/stoneage_start_encounter_path_closure.json`：Floor 100 有 32 個 unconditional rows；Floor 200 有 103 個 unconditional rows。兩張 world map 都已完成 exact runtime，且 8/8 incoming portal groups 都至少有一個 landing 能走到 unconditional encounter rectangle；mixed / unresolved rows 不會被當成無條件刷怪規則。
## Persistent State Schema / Idle Loop 更新（2026-09-30）

已新增 canonical persistent state schema：schema 1；固定 26 格 profession skills、24 格 player item slots、PetBox / Team / ActivePet 分層，以及 legacy schema 30 的 known-field migration。`tools/check_persistent_state_schema.mjs` 已通過 GitHub Actions。

同時已新增 Idle Loop Contract：disabled → moving → encounter_pending → in_battle → settlement → supply_check / moving，另處理 dead 與 offline_resume。Idle / battleSettings 明確屬於放置版產品層，不冒充 fixed-C 規則。
## First idle route catalog 更新（2026-09-30）

新增 data/generated/stoneage_first_idle_route_catalog.json 與 tools/generate_first_idle_route_catalog.mjs，將已閉合的 map / world-exit / encounter path 串成可交給 Idle Loop 的 route skeleton。

- hometown 0：1000 → 100 → Encounter 65，path closed。
- hometown 1：2000 → 100 → Encounter 28，path closed。
- hometown 2：3000 → 200 → Encounter 91，path closed，但 landing (587,318) 不可走。
- hometown 3：4000 → 200 目前 source blocked；不加入可玩 idle route。

Battle strategy、補給、捕捉、背包滿、死亡恢復與 offline accrual 尚未被 route catalog 視為完成；它們仍屬 Idle Loop product policy boundary。

## 現代 3D 卡通化最終視覺目標

最終作品不再以舊版 2D 網頁畫面作為終點。世界地圖、角色、寵物、戰鬥與 UI 都要進化到現代 3D 卡通手遊的完成度：斜俯視 3D 世界、卡通角色與寵物、集中式戰鬥場景、手機 RPG 式 HUD、技能／普攻／防禦／召喚／AUTO 等操作，以及完整的村莊與 NPC 互動框架。詳細規格已寫入 `docs/reference/modern-3d-mobile-visual-ui-target.md`。

這裡的「一模一樣」目標，現在以實際授權範圍為準：授權涵蓋的 UI／畫面／原始美術資產可以直接高還原整合；不在授權範圍的外部素材則不直接搬入。

## 現階段優先事項

World Data Source Catalog 已完成；現在也完成第一版 World NPC Index、functionset reachability audit、NPC Service Index、World Graph、NPC Event Action Index、auxiliary world data index、Item / Quest Event Closure、NPC Item Acquisition Graph 與 Start Flow Index。固定 source 的 7,979 個 NPC create blocks 全部找到 template；27 個 file/arg 參照保留為 unresolved；5,457 筆 mapwarp 全部通過 source map floor/座標範圍驗證；world graph 已整理成 1,139 個 floor nodes、2,182 條 directed edges。NPC service bindings 共 9,335；NPC event DSL 掃描找到 4,860 次 source action-key matches。

最新 item closure 顯示 NPC event 共引用 2,301 個不同 item ID，其中 2,065 已閉合、236 仍 unresolved；另有 ownerless event IDs 尚未提升為 gameplay 規則。

現在仍不做 playable UI，而是依 `docs/rebuild-roadmap.md` 收斂；四個 hometown 的出生座標、新手寵物選擇、新增的 source-route spine，以及出生村 NPC 已進入 source-backed Start Flow / Start Route closure：

1. World Data Catalog：NPC、任務、商店、傳送、服務、事件等。
2. Map Coverage Expansion：主要世界地圖與地圖連接；目前已補上 first-route 下一層 warp portal coordinate evidence，並開始建立可批量產生 verified map runtime 的工具。
3. Persistent State Schema：玩家、寵物、裝備、背包、技能、任務與掛機狀態；canonical schema v1 已建立。
4. Reward Transaction：battle result → source reward credit → atomic EXP/Gold/Item/Pet commit；不重抽 RNG。
5. Idle Loop Contract：自動移動、遇敵、戰鬥、結算、補給、死亡、離線恢復；state machine 與 policy boundary 已建立。
6. NPC / Economy Runtime：互動、取得來源、商店、製作與任務。
7. Authorized Asset Integration：依實際授權範圍導入石器時代原始 client／3D／UI assets，並建立來源、授權狀態、版本與用途 manifest。
8. 唯一可玩入口：以上資料與 contract 成熟後才建立。

## 明確停用項目

`data/generated/stoneage_disabled_features.json` 已固定 GMQUE／抓寵活動為永久停用，因此它不再作為主線 blocker，也不會自行恢復。

## 閱讀順序

先看：

- `docs/rebuild-roadmap.md`
- `docs/reference/video-001-visual-reference.md`
- `docs/reference/v320-real-tile-presentation.md`
- `docs/reference/encounter-source-closure.md`
- `docs/reference/gmque-source-closure.md`
- `docs/reference/modern-3d-mobile-visual-ui-target.md`
- `data/generated/stoneage_start_route_closure.json`
- `data/generated/stoneage_start_destination_closure.json`
- `data/generated/stoneage_new_player_event_closure.json`
- `docs/reference/start-world-exit-reachability.md`
- `docs/reference/start-encounter-target-index.md`
- `docs/reference/idle-loop-contract.md`
- `docs/reference/save-envelope-contract.md`
- `docs/reference/reward-transaction-contract.md`
- `docs/reference/item-economy-runtime.md`
- `docs/reference/item-source-runtime.md`
- `docs/reference/idle-supply-death-offline-policy.md`
- `docs/reference/idle-simulation-runner.md`
- `docs/reference/persistent-state-schema.md`
- `data/generated/stoneage_start_destination_warp_coordinates.json`

最後整理：2026-09-30。


## 本輪 first-route / map runtime 進度（2026-09-30）

新增 `tools/generate_verified_map_runtime.mjs` 與 synthetic fixture `tools/check_verified_map_runtime_generator.mjs`，正式固定「LS2MAP binary → exact Git blob SHA → mapset image validation → battlemap candidates → verified runtime/index」的批量生成介面。工具不會用猜測資料補 map。

新增 `data/generated/stoneage_start_destination_warp_coordinates.json`，將 first-route 下一層 exact source warp portal 座標獨立保存。`1000→100`、`2000→100`、`3000→200`、`4000→200` 均已有 source row；四個 destination map 現在也都有 exact verified runtime，7/7 warp landing points 均 walkable。

## 本輪新手事件 closure（2026-09-30）

`stoneage_new_player_event_closure.json` 已確認四個 hometown 的 `炎龍新手接待員` 都引用同一個 fixed-C `xinshoujd.arg`，並閉合 4 段 `TRANS/LV/ENDEV` 分支與 `EndSetFlg` 366/365/364/363；但 pinned `npctemplate.c` 沒有 `changeevent` functionSet，因此目前是 source script/reference closed、runtime module unresolved，不能當成已實例化的 NPC。

本輪也新增 `tools/audit_new_player_event_closure.mjs`。

## Start-floor NPC closure 更新（2026-09-30）

`data/generated/stoneage_start_npc_coordinate_closure.json` 已將原本 30 個 coordinate-unresolved rows 全部從 fixed-C NPCCREATE `borncorner` 解出，現在 46/46 start-floor NPC 都有 source coordinate。`data/generated/stoneage_start_npc_reachability.json` 進一步顯示 41/46 active-template NPC 的 interaction reachability 已閉合、0 個 unreachable；5 個 `changeevent` create blocks 仍因 pinned `gmsv/src/npc/npctemplate.c` 沒有 `changeevent` functionSet 而維持 runtime-module unresolved。


## Start-floor closure 最新狀態（2026-09-30）

目前 46/46 start-floor NPC coordinates 均已由 fixed-C exact `NPCCREATE borncorner` source 解出。`stoneage_start_npc_reachability.json` 已完成 41/46 interaction reachability，0 個 unreachable；剩餘 5 個（4 個 xinshou + 1 個薩姆吉爾村長）都是 `changeevent`，而 pinned `gmsv/src/npc/npctemplate.c::functionSet[]` 沒有 `changeevent`，所以依 `gmsv/src/npc/npccreate.c` 的 unknown-template 行為維持 runtime-unresolved，不把它們偽裝成已可玩的 NPC。


## Destination map closure 更新（2026-09-30）

四個 hometown 的 direct destination map 已全部從 pinned fixed-C source 找到並轉成 verified runtime：`1000=samugiru/samugiru`、`2000=marinasu/2000`、`3000=jaja/jaja`、`4000=karutana/karutana`。這也修正了先前只看檔名而漏掉 nonnumeric map filename 的判斷。

四個 destination floor 共 7 個 landing points，現在 7/7 都通過 exact tile/object walkability。floor 100 與 world floor 200 的 fixed-C binary runtime 也已完成 verified；floor 100 / 200 的 incoming portal → unconditional encounter path 已完成 8/8 group closure。2000/3000 的 direct encounter 仍受 item gate 影響；1000/4000 direct destination row 仍是 placeholder。

## Map source identity update（2026-09-30）

這一輪確認了一個重要 source 規則：fixed-C `gmsv/data/map` 的檔名不一定等於 floor ID。`1000` 使用 `sainasu/samugiru/samugiru`、`3000` 使用 `jyaruga/jaja/jaja`、`4000` 使用 `jyaruga/karutana/karutana`；真正的 floor identity 以 LS2MAP header 為準。這三張圖已直接由 pinned binary 產生 verified runtime；加上 floor 100 與正確的 world floor 200 jalga runtime，目前專案共有 11 張 verified maps。

`tools/generate_verified_map_runtime.mjs` 已固定這套流程；battlemap candidate 不足三個時依 fixed-C `readmap.c` 的初始化行為以 `0` 補足三個 slot，不會自行創造戰場編號。

## Reward / Idle runtime update（2026-09-30）

新增 `src/stoneage_reward_transaction.mjs`：把 fixed-C `BATTLE_AddProfit / BATTLE_AddExpItem` 的 reward boundary 轉成 transaction。一次只提交已決定的 player EXP、Pet credit、Gold、existing-item；transactionId 提供 idempotent commit，背包滿時不做部分提交。

新增 `src/stoneage_idle_policy.mjs`：Healer recovery 已來源化為玩家 HP/MP 全補；補給門檻、死亡 recovery mode、offline max seconds 必須由明確 policy 提供，不偷渡成固定 C 規則。

## Save / Simulation runtime 更新（2026-09-30）

新增 `src/stoneage_save_transaction.mjs`、`docs/reference/save-envelope-contract.md` 與 regression：canonical state 以 deterministic JSON + SHA-256 payload hash 包裝，支援 schema validation、legacy migration 與 revision conflict guard；hash 使用 Web Crypto，保持未來 browser runtime 可用。

新增 `src/stoneage_idle_simulation.mjs`、`docs/reference/idle-simulation-runner.md` 與 regression：把 first-idle route skeleton 串到 battle-result injection、reward transaction、supply/death decision 與 save commit。offline resume 目前只計算明確時間窗，不自動發生 offline reward。

## Battle / Offline integration update（2026-09-30）

新增 `src/stoneage_battle_result_adapter.mjs`：固定 C PvE battle 的完成結果現在可以用統一 adapter 交給 Idle Simulation；`BATTLE_Battling` 後的 `BATTLE_OnlyRescue` 結果在 PvE 下映射成 player `victory/defeat`，adapter 不重新計算戰鬥或獎勵。citeturn276757view0

新增 `src/stoneage_offline_resume.mjs`：offline resume 目前以 eligible → time-window → resume checkpoint → Save Envelope 的兩階段 transaction 保存；`accruedSeconds` 在沒有完整 offline reward simulation 前維持 0，不自行產生 EXP / Gold / Item。

`src/stoneage_idle_simulation.mjs` 已整合 fixed-C raw battle result adapter 與 offline resume commit。

## 2026-09-30 Item / Economy Runtime v1

新增 `src/stoneage_item_economy_runtime.mjs` 與 `tools/check_item_economy_runtime.mjs`，正式把 Gold 與 Item transaction 接到 canonical persistent state，並把 Gold cap / dangling existing-item reference 接入 persistent-state validation。

- Gold 上限沿用 fixed-C `CHAR_getMaxHaveGold()`：`1,000,000 + 轉生 × 1,800,000`。
- Player inventory 固定 24 slots；背包 transaction 只操作 9–23。
- Shop buy 使用 source-resolved Item ID / cost / buy_rate；真正的 Item creation 必須由 source allocator 提供，沒有 allocator 就 fail-closed，不自行猜 Item template 或 66-field RNG。
- Shop sell 使用 source-resolved cost / sell_rate；base item cost 上限固定 9,999，賣出後才增加 Gold。
- Stack sell 保留 existing item：pile 下降仍使用同一 existing index，降到 0 才清 slot / runtime item。
- 買賣 transaction 具 idempotency bookkeeping；allocation failure 不污染原 state。

Generated contract：`data/generated/stoneage_item_economy_runtime_schema.json`；詳細邊界：`docs/reference/item-economy-runtime.md`。

## 2026-09-30 Source Item Runtime / Allocator v1

新增 `src/stoneage_item_source_runtime.mjs`、`tools/check_item_source_runtime.mjs` 與 `docs/reference/item-source-runtime.md`，正式把 fixed-C 的 `ITEM_makeItem()` / `ITEM_makeItemAndRegist()` 66-field lifecycle 接到上一階段的 Item / Economy transaction。

- exact Item template 必須存在於 generated `stoneage_item_make_runtime-v2` catalog；缺失 template fail-closed 且 0 RNG。
- 每次 Item creation 固定消耗 66 次 inclusive RNG，包含 width=0 的欄位；完成後 `ITEM_LEAKLEVEL=1`。
- existing item index 掃描沿用 fixed-C `Sindex` 概念，allocator instance 保存 cursor，不把 engine cursor污染到 persistent save。
- `ITEM_INITFUNC` 不猜行為；沒有明確 source callback handler 時 fail-closed，避免把 callback-sensitive item 當普通 item。
- `buyShopItem()` 可直接接 `createSourceItemAllocator(...).allocate`，因此 Economy Buy 現在有完整 source Item creation adapter path。

詳細邊界：`docs/reference/item-source-runtime.md`。

## 2026-09-30 NPC ItemShop Runtime v1

新增 `src/stoneage_npc_itemshop_runtime.mjs`、`tools/generate_npc_itemshop_runtime.mjs`、`tools/check_npc_itemshop_runtime.mjs` 與 `docs/reference/npc-itemshop-runtime.md`，把 fixed-C `npcgen_shop` → `.arg` → `ItemList/buy_rate/sell_rate` 正式接到 Item / Economy runtime。

- `ItemList` 支援 source single ID / inclusive range；generator 依 fixed-C `NPC_SetNewItem()` 保留 buy range 展開順序。
- `itemIndex` 反查單一 Item 可由哪些 shop 買到，避免後續 acquisition / quest / reward 還要人工維護清單。
- `LimitItemType` / `LimitItemNo` 與 `special_item` / `special_rate` 的 sell policy 已來源化。
- Buy request 會先由 source Item template 取得 base cost，再乘 NPC `buy_rate`，最後交給既有 `buyShopItem()` 與 Item allocator。
- generator 只接受 pinned `gavinlinasd/StoneAge@1f90cb6cb57c1df70f39cde77a5a8ccd98b66c56`；source checkout 若可驗證 Git HEAD 不同就直接停止。
- 完整 source generator 尚未把固定 C checkout 複製到本 repo，所以目前不宣稱 336 個 ItemShop binding 已全部寫入 generated catalog；現有 service index 已確認 ItemShop = 336 bindings / 190 floors。

詳細邊界：`docs/reference/npc-itemshop-runtime.md`。

## V3.21 NPC Event / Quest Plan Runtime

新增 `src/stoneage_npc_event_runtime.mjs`、`tools/check_npc_event_runtime.mjs`、`.github/workflows/check-v321-npc-event-runtime.yml` 與 `docs/reference/v321-npc-event-plan-runtime.md`。

- source-compatible condition parser：`LV / TRANS / GOLD / ITEM / ENDEV / NOWEV`。
- condition 組合保留 fixed-C 的 comma alternatives + `&` conjunction。
- branch selector 直接吃已閉合的 new-player event source。
- `GetItem / GetPet / Charm / EndSetFlg / NowSetFlg` 先編譯成 literal action plan，不在尚未閉合時猜 mutation 語意。
- unsupported condition / 缺少 event-state adapter 時 fail-closed。
- 下一層才將 action plan 接 Item allocator、Pet factory、event-state writer 與 Save Transaction。

V3.21 regression 已納入 GitHub Actions。

## V3.22 NPC Event Action Transaction

新增 `src/stoneage_npc_event_transaction.mjs`、`tools/check_npc_event_transaction.mjs`、`.github/workflows/check-v322-npc-event-transaction.yml` 與 `docs/reference/v322-npc-event-transaction.md`。

- V3.21 action plan 現在有獨立 atomic mutation boundary。
- `GetItem / GetPet / Charm / EndSetFlg / NowSetFlg` 全部要求 explicit handler。
- 所有 handler 都只作用在 staged clone；任一 action 失敗，canonical 原 state 不變。
- transactionId 提供 idempotency，成功後才 revision +1 與寫入 transaction ledger。
- unresolved Item / Pet definition 與 Charm semantics 不在這層猜測。

V3.22 regression 已納入 GitHub Actions。

## V3.23 NPC Event Orchestrator

新增 `src/stoneage_npc_event_orchestrator.mjs`、`tools/check_npc_event_orchestrator.mjs`、`.github/workflows/check-v323-npc-event-orchestrator.yml` 與 `docs/reference/v323-npc-event-orchestrator.md`。

- 將 V3.21 branch selection + V3.22 atomic event transaction 合成單一 `executeNpcSourceEvent()`。
- `execute:false` 只產生 source action plan；`execute:true` 才透過 explicit handlers 在 staged clone 上執行。
- transactionId、revision 與完成分支阻擋都由同一入口處理。
- unresolved Item / Pet / Charm semantics 仍不會被 orchestrator 偷換成遊戲規則。

V3.23 regression 已納入 GitHub Actions。

## V3.24 New-player Pet Runtime

新增 `src/stoneage_new_player_pet_runtime.mjs`、`tools/generate_new_player_pet_runtime.mjs`、`tools/check_v324_new_player_pet_runtime.mjs`、`data/generated/stoneage_new_player_pet_runtime.json`、`.github/workflows/check-v324-new-player-pet-runtime.yml` 與 `docs/reference/v324-new-player-pet-runtime.md`。

- `xinshoujd.arg` 的 5 個 `GetPet` Enemy ID 已全部 source-closed。
- fixed-C `NPC_ActionAddPet()` 的 lookup 確認使用 Enemy ID；建立後 `CHAR_PETID` 使用 EnemyBase TempNo。
- Enemy ID → EnemyBase TempNo / name / image / skills / elements / status 等來源鏈已固定。
- `ENEMY_createPetFromEnemyIndex()` 的 16 次 RNG lifecycle 與 `atoi()` 數值解析已來源化。
- canonical Web Pet ID 仍要求 explicit `idFactory`；PetBox 上限固定 5，暫不猜 team / activePet 行為。
- 新手 event closure 的 Pet definitions 現已標為 source-closed；Item definitions 仍維持 item-source-pending。

V3.24 regression 已納入 GitHub Actions。

## V3.25 New-player Item Reward Runtime

新增 `src/stoneage_new_player_item_reward_runtime.mjs`、`tools/generate_new_player_item_reward_runtime.mjs`、`tools/check_v325_new_player_item_reward_runtime.mjs`、`data/generated/stoneage_new_player_item_reward_runtime.json`、`.github/workflows/check-v325-new-player-item-reward-runtime.yml` 與 `docs/reference/v325-new-player-item-reward-runtime.md`。

- new-player closure 的 16 個 `GetItem` ID 全部在 source-backed `stoneage-item-make-runtime-v2` 找到。
- `NPC_ActionAddItem()` 的 `ITEM_makeItemAndRegist → CHAR_addItemSpecificItemIndex` 已映射到 canonical Item allocator + player slots 9–23。
- 每個 reward item 都保留 66-field Item creation lifecycle。
- focused catalog 只提升 closure 明確引用的 16 個 Item，不擴張成未驗證的完整 quest reward 表。
- new-player closure 現在標示 Item / Pet definitions 都已 source-closed；`Charm` concrete semantics 與 `changeevent` template runtime 仍 pending。

V3.25 regression 已納入 GitHub Actions。

## V3.26 Event Flag Runtime

新增 `src/stoneage_event_flag_runtime.mjs`、`tools/check_v326_event_flag_runtime.mjs`、`.github/workflows/check-v326-event-flag-runtime.yml` 與 `docs/reference/v326-event-flag-runtime.md`。

- fixed-C `CHAR_ENDEVENT/CHAR_NOWEVENT` 旗標現在以 `eventId / 32` + `eventId % 32` bitset 規則來源化。
- dynamic `endWords / nowWords` 支援高於前 96 個旗標的 first-route event（例如 363–366），不硬猜固定 word 數。
- `EndSetFlg / NowSetFlg` 可直接由 V3.22 transaction 使用 source-backed handlers。
- V3.21 `ENDEV / NOWEV` condition 在沒有 caller override 時會直接讀 canonical event flag runtime。
- `Charm:1` 仍未被猜成任何 canonical mutation。

V3.26 regression 已納入 GitHub Actions。

## V3.27 First-route Reward Handler Bundle

新增 `src/stoneage_first_route_reward_handlers.mjs`、`tools/check_v327_first_route_reward_handlers.mjs`、`.github/workflows/check-v327-first-route-reward-handlers.yml` 與 `docs/reference/v327-first-route-reward-handlers.md`。

- V3.24 Pet + V3.25 Item + V3.26 Event Flag 三條已閉合 adapter 已組成單一 handler bundle。
- 可直接交給 V3.22 atomic event transaction。
- Item / Pet / Event Flag 在 staged state 成功時可以一起 commit。
- `Charm` 已有 pinned `npc_exchangeman.c` concrete rule：`EvNo>0` 才加、上限 100；`xinshoujd.arg` 的 `EventNo:-1` 因此 no-op。

V3.27 regression 已納入 GitHub Actions。

## V3.28 New-player First-route Integration

新增 `src/stoneage_new_player_event_adapters.mjs`、`tools/check_v328_new_player_first_route.mjs`、`.github/workflows/check-v328-new-player-first-route.yml` 與 `docs/reference/v328-new-player-first-route.md`。

- Item / Pet / Charm-rule / EndSetFlg 四個 source adapter 已合成同一條 first-route transaction。
- `xinshoujd.arg` branch 0 在 Lv1 / TRANS0 下可產生 4 個 Item、1 個 Pet、EndSetFlg 366。
- `Charm:1` 依 pinned concrete Charm rule + `EventNo:-1` 為 no-op。
- transaction 失敗時只改 staged clone，不提交 canonical state。
- EndSetFlg 366 成功後，再用新的 transactionId 重跑會被 branch condition `ENDEV!=366` 阻擋。

V3.28 regression 已納入 GitHub Actions。

## V3.29 ChangeEvent Module Audit

新增 `data/generated/stoneage_changeevent_module_audit.json`、`tools/check_v329_changeevent_module_audit.mjs`、`.github/workflows/check-v329-changeevent-module-audit.yml` 與 `docs/reference/v329-changeevent-module-audit.md`。

- pinned `npctemplate.c/functionSet[]` 沒有 `changeevent`。
- pinned `npccreate.c` 對 unknown template 不會建立 active template reference。
- `ExChangeMan` / `Charm` / `Action` 都不被當成 `changeevent` alias。
- new-player reward mutation chain 已閉合；目前剩餘的是 NPC module instantiation / browser interaction boundary。

V3.29 audit regression 已納入 GitHub Actions。

## V3.30 First-route Save Integration

新增 `src/stoneage_first_route_save.mjs`、`tools/check_v330_first_route_save.mjs`、`.github/workflows/check-v330-first-route-save.yml` 與 `docs/reference/v330-first-route-save.md`。

- new-player branch 0 已接到既有 Save Envelope / revision guard。
- Lv1 reward commit 後可 reload 同一 Envelope，Item / Pet / Event flag 保持一致。
- 同 transactionId 不重複 save；完成 Event 366 後的新 transactionId 不再匹配。

V3.30 regression 已納入 GitHub Actions。

V3.31–V3.33 interaction / dispatch / audited-module guards 已完成：fixed-C facing+distance gate、唯一 NPC dispatch bridge，以及 pinned functionSet registry guard 都已加入 regression。`changeevent` 明確維持 module-unresolved，不用 `ExChangeMan` 等其他 entry 代替。

## V3.31–V3.32 NPC Interaction / Dispatch Boundary

新增 `src/stoneage_npc_interaction_runtime.mjs`、`src/stoneage_npc_dispatch_runtime.mjs`、對應 regression / CI 與 reference docs。

- V3.31 保留 fixed-C `NPC_Util_charIsInFrontOfChar` 的 same-floor / distance / facing gate。
- V3.32 建立唯一 dispatch bridge：`interaction gate → template module resolution → handler factory → event/save`。
- pinned `changeevent` 沒有 `functionSet[]` entry，所以 production interaction 仍 fail-closed；synthetic module 只用來驗證 bridge，本身不進 world registry。




V3.34 new-player branch matrix 已加入：Lv 1–99 / 100–139 / 140–149 / 150 四段 branch 全部以 source-backed reward + Save Envelope 回歸，並鎖定邊界不漂移。
