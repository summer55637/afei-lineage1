# 重建藍圖：最終目標前的資料與系統補齊

更新日期：2026-09-30

## 2026-09-30 新增：V3.50 new-player creation → save pipeline

V3.50 把目前已 source-closed 的新玩家流程串成單一 headless pipeline：`creation input → hometown world.position → Starter Pet → starter-item adapter boundary → creation.completed → Save Envelope → reload verification`。

`applyPlayerCreationInput()` 現在會將 fixed-C hometown 的 floor/x/y 正式寫進 `state.world.position`；Starter Pet 使用 V3.48 的 rank-closed runtime 寫入 `pets.petBox`；Save 使用既有 `commitSave()` / `parseAndValidateSaveEnvelope()`。

`creation.completed=true` 只有在 starter-item adapter 成功後才設定。因 Item 24114 的 template 仍未閉合，production path 目前會在 `starter-item-template-unresolved` fail-closed，返回可檢查但未完成的 headless state，不產生 completed save。 這個 pending checkpoint 可以直接 resume 到 Item stage；resume 不重新抽 Starter Pet RNG，也不重新建立第二隻 Starter Pet。

這個 pipeline 的 staged commit 是產品/runtime transaction boundary，不宣稱 fixed-C `CHAR_createNewChar()` 本身是 atomic transaction。測試中的 Item adapter 是 test-only synthetic fixture，只驗證未來取得正式 Item adapter 後，creation → save → reload contract 能完整工作，不升格為正式 Item data。

## 2026-09-30 新增：V3.51 Starter Item 24114 source mapping audit

V3.51 修正 V3.49 的錯誤資料判讀：固定 pinned commit 的 `gmsv/data/itemset6.txt` 並非 0 bytes，而是 2,777,181 bytes、10,744 行。

更重要的是，`ITEM1=24114` 不是該檔案第 17 欄 `id`。固定 build 啟用 `_ITEMSET2_ITEM`，`ITEM_readItemConfFile()` 使用第 17 個 token 作為 `ITEM_ID`；而 pinned `version.h` 沒有定義 `_IMPOROVE_ITEMTABLE`，所以不存在 `ITEM_TransformList` 的 ID remap。

在 `itemset6.txt` 第 3602 行，24114 的唯一數值 occurrence 位於第 18 欄：`id=11817`、`imagenumber=24114`、`cost=9900`、`type=16`。因此 source Item table key 是 11817，不是 24114。

固定 C 的 `CHAR_loginAddItemForNew()` 直接把 `ITEM1=24114` 傳入 `ITEM_makeItemAndRegist(24114)`，而 `ITEM_makeItem()` 先檢查 `ITEM_CHECKITEMTABLE(24114)`。在目前 pinned build 下不能把 imageNumber 24114 自行重映射成 Item ID 24114，否則會改變 fixed-C semantics。

所以目前正確狀態是：Item source file ✅、24114 對應資料 row ✅、allocator implementation ✅，但 configured source Item ID 24114 的執行閉合仍 ❌，因此 starter-item grant 維持 fail-closed。V3.50 的 creation → save pending/resume boundary 不變。

## 2026-09-30 新增：V3.48 fixed-C Starter Pet rank closure

V3.48 已把 pinned C 的 `gmsv/src/char/enemy.c::ENEMY_getRank` 正式接回 starter Pet runtime。

來源函式只把 `E_T_BASEVITAL + E_T_BASESTR + E_T_BASETGH + E_T_BASEDEX` 相加成 `paramsum`，再依 100 / 95 / 90 / 85 / 80 / 0 的 fixed rank table 回傳 0..5。四個 starter EnemyBase 都是 paramsum 79，因此四個 hometown starter Pet 都是 `petRank=5`。

Runtime 現在會重新計算 rank、與 generated seed 的 source rank evidence 做一致性檢查，並把 `sourceRankResolved=true` / `petRank` / `sourceRankEvidence` 保存進 Pet object。rank 計算本身不消耗 RNG，所以原本 16-call starter Pet sequence 不變。

同時校正 `tools/generate_new_player_seed_runtime.mjs` 的生成結果，移除不在 committed artifact 中的 stale `sha256` 欄位，並讓 V3.45 的 seed `cmp` regression 可以與現行 generated JSON 對齊。

## 2026-09-30 新增：V3.47 starter Pet grant runtime

V3.47 將 V3.45 source-closed starter Pet 接到 canonical Persistent State：沿 fixed-C `ENEMY_createPetFromEnemyIndex` 保留 16 次 RNG、四圍/元素/metadata、PetMailEffect、VariableAI=0 與 compliance HP=MaxHP，並鎖定 duplicate-grant、petBox cap、Save round-trip。Starter Item 24114 仍因 item template 尚未閉合而保持 pending；不新增 playable HTML。

## 2026-09-30 新增：V3.46 player creation runtime

V3.46 把 fixed-C 創角輸入正式接進 canonical Persistent State：四圍 0..20 / 總和≤20、元素總和10 / 最多兩屬性 / Earth+Fire 與 Water+Wind 禁配，並保存 hometown、creationPlayerStats、elements 與 starter grant 狀態。加入 `src/stoneage_player_creation_runtime.mjs` 與 regression；仍不新增 playable HTML。

## 2026-09-30 新增：V3.45 new-player seed runtime

V3.45 將 fixed-C setup.cf 出生 seed 正式獨立：TRANS=1、LV=1、PETLV=1、GOLD=30000、ITEM1=24114；並把 PET1 → config slot 1 而 getter(0) 讀 slot 0 的 parser quirk 明確寫入 contract。四個 hometown fallback starter pet 由 pinned enemy1.txt + enemybase1.txt 閉合為 EnemyID 1/2/3/4、TempNo 2/112/102/34。24114 只完成 source item-ID / creation-path closure，不猜 item template。新增 seed generator、V3.45 regression 與 pinned-source rebuild CI；仍保持 0 個 playable HTML。

## 2026-09-30 新增：V3.43 cross-contract closure

本輪把 first-route closure 的跨 contract 狀態重新對齊：new-player 四段 Item/Pet reward definition 已由 pinned itemset6／enemy1 source closure 驗證完成，因此不再列為 route blocker；changeevent 本身仍維持 strict unresolved，不能因 reward closure 而自動註冊 alias。4000→200 仍依 fixed-C map walkability 保持 disconnected fail-closed。新增 `tools/check_v343_cross_contract_closure.mjs` 與 CI，鎖定 reward closure、4000 component 與 route blocker 不漂移。

## 2026-09-30 新增：V3.44 Persistent State ↔ Save Envelope join


V3.44 不新增 playable HTML，先把 canonical Persistent State v1 與 Save Envelope v1 做完整 headless join。新增 `tools/check_v344_persistent_state_save_join.mjs` 與對應 CI，鎖定 26 個 profession skill slots、24 個 player item slots、backpack existing-item references、pet team / activePetId integrity、world / quest / event / idle state round-trip、legacy schema 30 unknown-key preservation，以及 Save Envelope revision guard。此輪只強化資料保存邊界，不把 idle battle policy 或 changeevent compatibility alias 升格成 fixed-C。

## 2026-09-30 進度

已完成第一版 **World Data Source Catalog**：固定 source `gavinlinasd/StoneAge@1f90cb6cb57c1df70f39cde77a5a8ccd98b66c56` 的 5,764 個 blob files、3,960 個 NPC data files，以及主要世界資料檔案已建立 machine-readable inventory。NPC 的 template → create → floor/region → argument 關係也已用 pinned C 的載入／生成流程固定。

本輪沒有建立 playable HTML，也沒有把未閉合 NPC／任務資料硬塞成 gameplay。

另外完成 World NPC Index、NPC Service Index、World Graph 與 NPC Event Action Index：7,979 create blocks 已全部閉合到 template；27 個 file/arg 參照維持 unresolved；5,457 筆 mapwarp 全部通過 source map header 的 floor/座標範圍驗證；world graph 已形成 1,139 個 floor nodes、2,182 條 directed floor edges；NPC service bindings 共 9,335；NPC event DSL 掃描找到 4,860 次 source action-key matches。另已整理 mission、jobdaily、ride、title、question、raceman、racequiz、member shop/pet 等 auxiliary world data。

目前正處於 **item-acquisition / quest-event closure**；reward gap 已改為 direct-source occurrence 掃描，避免用 sample path 估算；NPC acquisition graph 已建立並校正 EventNo -1 sentinel；Start Flow Index 也已完成，正式鎖定四個 hometown 出生座標與新手寵物選擇規則。Item loader 已依 fixed C 對齊到 `itemset6.txt` 第 17 欄 `ITEM_ID`；NPC event 共引用 2,301 個不同 item ID，其中 2,065 已閉合、236 unresolved，未閉合引用共 751 次。事件旗標正在進一步依 `EventNo` / `EventEnd` / NPC-specific script / encounter event owner 反查，不再只用 mission / jobdaily 判定。

### First-route checkpoint（2026-09-30）

已修正 hometown walkability audit 的 source-selection 問題。舊版 audit 沒有鎖定四個 hometown map 的 exact pinned source path，而是遞迴掃描 map floor 後取第一個命中；這不足以作為 fixed-source walkability 的最終結論。

新版 `stoneage_start_walkability_audit.json` 已鎖定四個固定 source map path，並在審計時驗證 Git blob SHA。結果為：

- 4/4 hometown source maps 通過 exact blob SHA 驗證。
- 8/8 direct hometown warp exits 可由出生座標透過 source walkability 到達。
- 最短出生點→warp NPC 路徑為 4–7 步。
- 固定 C 的 `CHAR_walk_move` 先做 `MAP_walkAble`，NPC warp 再透過 `CHAR_ISOVERED` 與 `NPC_WarpWatch` 接收成功的 `CHAR_ACTWALK`；因此 warp NPC 的占位不會讓原本可走的 map cell 變成不可走。

目前新增 `stoneage_start_route_closure.json`，將四個 hometown 的 source-route spine 接到 start-floor service presence、NPC coordinate/reachability 與 depth-1 encounter evidence；另外新增 `stoneage_start_npc_reachability.json` 與 `stoneage_start_npc_coordinate_closure.json`，把全部 46 個 start-floor NPC 的 exact source coordinates 與 interaction status 分開保存。四個 hometown 都已具備 source-route spine 條件；目前 46 個 start-floor NPC 已有 numeric coordinate；41 個 active-template NPC 已完成 interaction reachability，0 個 unreachable；5 個 `changeevent` instances 因 pinned `npctemplate.c` 缺少 module 而維持 runtime-unresolved，因此目前標記：

- `sourceRouteSpine = closed`
- `fullFirstRoute = partial`

這裡的 closed 只代表 source-level route spine 已閉合，不代表已經可以直接做 playable gameplay。完整 first-route 還要處理 5 個 `changeevent` runtime-module discrepancy、destination map / first encounter region 的 walkability，以及新玩家 reward definition closure。

下一步不直接做 playable UI，而是把 unresolved item / event 依 NPC path、事件 owner 與起始 floor 分群；目前 236 個 item IDs 與 ownerless event IDs 仍需 closure。最高優先仍是四個出生村的 first-route closure，但 start-floor coordinate 本身已不再是 blocker。

## 新增最終目標：現代 3D 卡通手遊化

最終產品目標正式加入現代 3D 卡通化方向。這不是把舊版網頁 UI 換成 3D 圖片，而是把整個 presentation layer 升級：3D 卡通世界、角色／寵物模型、斜俯視鏡頭、現代 RPG HUD、集中式回合戰鬥、技能演出、AUTO／掛機、村莊與 NPC 互動。依目前授權前提，授權範圍內的石器時代手游原始 UI／模型／貼圖／icon／字體／動畫等資產可以直接納入正式版本，以高還原為實作目標。

《石器時代：覺醒》的官方商店資訊包含回合制策略、上百寵物、職業、野外捕捉與離線掛機；《石器時代：放置冒險》則以放置玩法與寵物成長為產品核心。現代產品的參考程度，以及能否直接採用其特定 UI／美術資產，改由實際授權範圍決定；不在授權範圍的外部素材仍只作研究參考。

正式規格：`docs/reference/modern-3d-mobile-visual-ui-target.md`。

## 目的

本文件不是可玩前端規格，而是「在重新建立唯一遊戲入口以前，先把資料、來源證據與核心系統補齊」的工作順序。

最終目標仍是重建「阿肥石器時代放置版」：行為以 pinned fixed C 為最高優先來源，視覺與操作流程以 `docs/reference/video-001-visual-reference.md` 為重要基準，最後形成一個完整、可長時間遊玩的石器時代風格放置遊戲。

目前刻意不新增任何可玩的 HTML。

## 目前已經很完整的部分

### 1. 戰鬥規則研究

V1.x～V2.x 已累積大量 fixed-C parity 與 regression，涵蓋玩家／寵物技能、BattleModel、DamageReact、Counter、Guardian、Acupuncture、Capture、裝備回調、職業技能與多個 RNG／執行順序細節。

這些結果目前主要存在於 `docs/changelog/`、`tools/check_v*.mjs` 與 generated runtime 中。

### 2. 寵物與遇敵資料

目前已有：

- Lv1 寵物資料
- Enemy AI runtime
- 一般 Encounter runtime
- Group / Enemy / EnemyBase source-closure ledger
- Capture condition item catalog
- PetSkill runtime
- Pet merge / make item 研究

Encounter 仍有 23 個 unresolved Group，以及 1 個明確 EnemyBase template blocker；不可用資料維持 non-spawnable，禁止跨版本硬補。

### 3. 地圖資料鏈

目前已完成：

- LS2MAP binary parser
- mapset walkability contract
- battlemap candidate contract
- map header catalog
- Encounter Floor/X/Y → tile/object probe
- client image → ADRNBIN → Real → RD decoder → palette → RGBA 的資料鏈

目前已有 11 張 verified map runtime；source catalog 本身有 1284 個 map blobs，因此「全世界地圖」仍遠未閉合。這 11 張包含四個 hometown destination、floor 100 與正確的 world floor 200 jalga。direct landing → 下一層 portal origin 與 encounter target 已完成座標級檢查，避免把 floor-level world edge 誤當成玩家可走路線。

四個 hometown 與 first-route destination 的原始 LS2MAP 已完成 exact pinned-source walkability audit；floor 100 與 world floor 200 亦已完成 fixed-C binary verified runtime。下一階段 Map Coverage 轉為擴張主要世界 route，而不是再處理這批 first-route destination source identity。

### 4. 原版客戶端圖像技術鏈

已完成 parser / resolver / decoder / palette / tile presentation adapter。

目前 `client-assets/manifest.json` 是 unavailable，沒有發布原版 BIN，因此真實原版圖片不會自動進入網站。

## 現在最需要補的部分

## A. 世界資料層：最高優先

這是目前最重要的缺口。

目前已完成第一輪 NPC → Event DSL → Item / Pet / Event State closure 與四個 hometown Start Flow Index；剩餘工作集中在起始路徑的逐點閉合。

原始 server data 除了已解析的 encounter、enemy、item、magic、petskill、profession、map 外，還存在 NPC、mission、memberpets、membershop、ride、title、question、event 等資料層。

因此下一階段應建立「World Data Catalog」，至少整理：

- NPC 出現位置與 template/create/arg 關係
- NPC 對話與條件
- NPC Event DSL / Event owner closure
- NPC 商店與購買／出售
- 任務／事件
- 地圖傳送與 warp
- 治療、存點、轉職、轉生等服務 NPC
- 坐騎與交通
- 稱號／聲望
- 問答／小遊戲類資料
- 事件型獎勵

原則仍是 source-backed；沒有 pinned evidence 的資料只能標成 candidate / unresolved，不能直接成為遊戲規則。

## B. 完整地圖閉合：最高優先

現在 1284 個 source map blobs 已有 11 張 verified runtime。

下一階段應把 map pipeline 變成可批量產生的流程：

source map
→ header 驗證
→ tile/object parser
→ mapset attributes
→ image ID
→ battlemap candidate
→ verified runtime

最後再建立：

- 地圖名稱／地區層級
- 地圖連接關係
- warp / door / cave / building entrance
- NPC / object 座標
- walkable / blocked / height
- encounter region
- battle field 對應

目前 first-route spine 已證明四個出生村的直接 warp 在 pinned source 上是可走的。destination 層 4/4 exact map source、7/7 landing walkability 已 closed。floor 100 / 200 的 fixed-C binary runtime 也已 verified，並完成 incoming landing → unconditional encounter rectangle path closure：8/8 portal groups 都至少有一個可用 landing 可抵達 unconditional encounter。2000 的 Group 1018 仍需要 item 20219、3000 的 Group 1015 仍需要 item 20216，而 pinned itemset6.txt 是空檔；這些 direct encounter 仍維持 conditional_unresolved_item_source，不被當作一般無條件刷怪規則。

## C. 玩家／寵物完整資料模型：高優先

Persistent State Schema 第一版已開始實作：canonical schema、24 格玩家 item slots、26 格 profession skill slots、PetBox/Team/ActivePet 分層，以及 legacy schema 30 的 known-field migration 已建立。下一步是把更多 source-backed state 欄位接到正式 runtime，仍不把 unresolved source 語義猜成規則。

- 玩家基本資料
- 等級／經驗／轉數
- 四大屬性與衍生 Work
- HP / MP / 狀態
- 裝備欄與背包
- 寵物欄、出戰寵、寵物狀態
- 技能與職業技能
- 寵物技能
- 稱號／聲望
- 金錢
- 任務／事件狀態
- 地圖／座標／存點
- 掛機設定
- 戰鬥設定
- offline / idle 統計
- save schema 與 migration

這一層應先做成與 UI 無關的資料模型，避免未來再把舊版 `game.js` 的狀態結構搬回來。

## D. 「放置版」核心循環：高優先

Idle Loop Contract 第一版已完成；下一步在這個 contract 上接 reward transaction、supply/death policy、offline resume 與長時間 simulation regression。這是最終遊戲與普通 Stone Age 重建之間最重要的產品層。

目前 route skeleton 已有 3 個 hometown path-closed variants，並保留 4000 source-blocked route exception。

需要再定義、再實作：

進入地圖
→ 自動移動／遇敵
→ 自動戰鬥策略
→ 戰鬥完成
→ EXP / Gold / Item / Pet 結算
→ 回復／補給
→ 繼續循環

並處理：

- 戰鬥設定
- 人物首次／一般行動
- 寵物首次／一般行動
- 補血門檻
- 捕捉策略
- 自動換寵
- 逃跑策略
- 背包滿時行為
- 死亡時行為
- 長時間運轉
- 暫停／恢復
- offline progress 的計算邊界

這一區不能直接用「方便的遊戲設計」取代 source 行為；真正原版有證據的部分照 source，真正屬於放置版產品層的新規則則要獨立標記。

## E. 戰鬥 presentation：中高優先

目前已有 HUD、target marker、battle feedback 的 contract，但還沒到影片中的完整戰場表現。

需要補：

- 真實 battle field
- 真正角色／寵物 sprite
- 敵我固定站位
- 技能動畫
- 攻擊動作
- 受傷／死亡
- 狀態效果
- 捕捉演出
- 回合節奏
- 目標選取
- battle result
- 戰鬥 UI 與自動戰鬥 UI 的整合

其中「演出」不能重新計算 battle result；應吃已完成的 battle result event。

## F. 真實素材與合法資產管線：中優先

V3.16～V3.20 的技術鏈已經夠用了，但目前沒有可直接使用的 client binary。

因此需要再把「授權資產注入」流程做完整：

- asset manifest
- ADRNBIN
- Real
- Palette
- sprite cache
- tile cache
- asset hash
- missing asset fallback
- dev / production asset profile

仍不把未確認授權的原版 BIN 直接提交到 repository。

## G. NPC / 任務 / 經濟系統：中高優先

目前已完成第一輪 NPC service 與 event DSL 索引，並建立 Item / Quest Event Closure；下一階段由「知道 NPC 存在」推進到「知道 NPC 會對玩家做什麼」。

要讓遊戲像完整作品，除了打怪還需要：

- NPC 對話
- 商店
- 買賣
- 製作
- 道具取得來源
- 任務
- 獎勵
- 傳送
- 治療
- 存點
- 轉職／職業
- 轉生
- 寵物相關服務

尤其目前 `capture_items.json` 已明確顯示部分捕捉／外觀條件道具的「來源」仍 unresolved，這正是值得往 NPC / quest / shop data 深挖的切口。

## H. 音效／動畫／細節 UI：後期

影片不只是靜態畫面，還包含完整的 UI 節奏。

後期需要統一：

- 音效事件
- BGM
- 按鈕反饋
- 視窗開關
- hover / selected / disabled
- 數值跳動
- 物品獲得
- 任務完成
- 等級提升
- 寵物升級
- 戰鬥勝負
- 掛機開始／停止
- 聊天／系統訊息

## 暫時不要做的事情

### GMQUE

`data/generated/stoneage_disabled_features.json` 已把 GMQUE／抓寵活動永久停用。

因此它不再是重建主線 blocker，也不應重新打開。

### 再次建立大量 HTML 入口

新的網站只保留一個 canonical playable entry。

研究資料、runtime modules、測試工具與網站入口要分離，避免再次出現 `index.html`、`game.html`、`game-live.html`、`play.html` 多頭分裂。

## 建議的下一個實際工作順序

1. **World Data Catalog**：已完成第一輪；目前進入 Start Flow / Item Acquisition / Quest Closure。
2. **Start Route Closure**：source-route spine 已 closed；46/46 start-floor NPC coordinates 已 source-resolved；41/46 active-template NPC interactions 已完成 reachability，5 個 `changeevent` runtime-unresolved。destination maps 4/4 verified、7/7 landing walkability closed；floor 100 / 200 也已完成 verified runtime 與 8/8 encounter landing-path closure。剩餘 blocker 集中在 4000→200 source transition、5 個 changeevent module discrepancy、3000→200 的單一不可走 landing，以及新玩家 reward definitions。
3. **Map Coverage Expansion**：由目前 11 張 verified map 繼續擴到主要世界路線的完整地圖群；first-route floor 100 / 200 已 verified，接下來以 route skeleton 對應的 missing map branches 為擴張入口。
4. **Persistent State Schema**：第一版 canonical schema 已建立；本輪補上 Gold、reward transaction persistence 與 idle state containers。
5. **Idle Loop Contract**：state machine 已建立，reward transaction 與 supply/death/offline policy boundary 已建立；下一步是 simulation runner、save commit 與 offline resume。
6. **Battle Presentation Contract**：把已驗證 battle result 接到完整場景與動畫事件。
7. **NPC / Economy Runtime**：Item / Economy transaction v1 已接到 canonical state；下一步是接 source Item allocator、NPC shop data、製作與任務取得路徑。
8. **Authorized Asset Integration**：依實際授權範圍導入石器時代原始 client／3D／UI assets，並建立來源、授權狀態、版本與用途 manifest。
9. **唯一可玩入口**：前面資料與系統成熟後，才重新建立新的遊戲頁。

## 判定標準

進入「做可玩遊戲」階段前，至少要能回答：

- 玩家從哪裡出生？
- 可以去哪裡？
- 每張主要地圖怎麼連？
- NPC 是誰、在哪裡、提供什麼？
- 每種遇敵怎麼生成？
- 戰鬥每一步怎麼結算？
- 玩家與寵物怎麼成長？
- 道具怎麼取得、使用、裝備、製作？
- 任務怎麼開始／完成？
- 放置模式怎麼循環？
- 斷線／關閉後怎麼處理？
- 哪些是 fixed C，哪些是影片還原，哪些是本專案新增的放置版規則？

只要這些問題還有大面積空白，就先繼續做資料與 contract，而不是急著寫首頁。

Destination closure checkpoint：`data/generated/stoneage_start_destination_closure.json`；審計工具：`tools/audit_start_destination_closure.mjs`。


## 2026-09-30 新增：destination portal 與 verified map runtime pipeline

`data/generated/stoneage_start_destination_warp_coordinates.json` 已把 four-town first-route 下一層 exact source portal 座標從 floor graph 拆出，避免只用 floor-level edge 代替真正的座標證據。

同時新增 `tools/generate_verified_map_runtime.mjs`：輸入 fixed-C 的 LS2MAP binary 後，會驗證 Git blob SHA、解析 `MAP_readMapOne()` 格式、檢查 mapset image IDs、依 battlefield source manifest 建立 `RAND(0,2)` 的三候選 battlemap resolver，最後寫入 verified runtime 與 runtime index。`tools/check_verified_map_runtime_generator.mjs` 提供 synthetic 1×1 map regression。

目前已用 fixed-C binary source 直接生成 1000/3000/4000 runtime；1000/3000/4000 的檔名不是 floor ID，而是由 LS2MAP header 精確辨識 floor。

## 2026-09-30 新增：新玩家 event owner closure

四個 hometown 的 `炎龍新手接待員` source owner 已閉合到 `gmsv/data/npc/almark/xinshou/xinshou.create`，共用 `almark/xinshou/xinshoujd.arg`。腳本的四段等級／轉生分支與對應 EndSetFlg 已納入 `data/generated/stoneage_new_player_event_closure.json`，並由 `tools/audit_new_player_event_closure.mjs` 驗證。

其中四個 source 座標原本在 Start Flow Index 中無法安全解析，現在已從 pinned `xinshou.create` 解出；由於其座標與出生點重疊，互動是否可在同格或必須站鄰格不能套用其他 NPC service 規則，暫維持未審計。

## 2026-09-30 修正：Start-floor NPC coordinate / runtime closure

原本 Start Flow Index 的 30 個 unresolved coordinates 是索引層未反解 `borncorner`，不是 fixed-C source 沒有位置。現在已全部由 exact create blocks 解出，形成 `data/generated/stoneage_start_npc_coordinate_closure.json`。

之後套用 fixed-C template / interaction contract 後，41/46 NPC 已可驗證從出生點到合法互動站位；5 個 `changeevent` blocks（4 個 xinshou + 1 個薩姆吉爾村長）因 `gmsv/src/npc/npctemplate.c` 的 `functionSet[]` 不存在 `changeevent`，並依 `gmsv/src/npc/npccreate.c` 的 unknown-template rejection 規則維持 runtime-unresolved，不視為已實例化 NPC。


## 2026-09-30 新增：world exit 座標級可達性與 floor 200 衝突

新增 `data/generated/stoneage_start_world_exit_reachability.json` 與 `tools/audit_start_world_exit_reachability.mjs`，把 direct destination → 下一層 world portal 從 floor-level edge 降到固定 map runtime 的座標級 path proof。

結果：

- 1000→100：2/2 portal groups usable，最短 120 / 104 步。
- 2000→100：2/2 portal groups usable，最短 33 / 82 步。
- 3000→200：2/2 portal groups usable；第二組 6 個 source origins 中 5 個可達，(73,59) 因 object image 2 不可走。
- 4000→200：0/2 portal groups usable；兩組 source portal origins 都是 walkable cell，但都與 direct landing component 不連通，因此不能直接升格成 playable route。

同時確認目前 `data/generated/stoneage_map_200.json` 是 `gmsv/data/map/extra/200` 的 30×30 map，不能容納 fixed-C world portal 的 x=588、y=1008 等座標。fixed source tree 另有 `gmsv/data/map/jyaruga/jalga`，blob SHA=`dcbb20f0212192fc852e1489a29a0d6d8d4c95ce`、size=3,840,044 bytes；公開地圖編號資料亦把 floor 200（加魯卡）對應到此 path。這一點現在已完成 fixed-C binary verification；`jalga` 已成為 floor 200 的 verified runtime，沒有使用猜測或跨版本資料。

因此 first-route 現在以「可從 direct landing 實際走到 source portal / encounter target」作為 route promotion 條件。4000 仍需完成 disconnected source-transition 分析；3000→200 的單一不可走 landing 維持明確例外，其餘 path closure 已成立。
## 2026-09-30 新增：ordinary encounter target 座標索引

新增 data/generated/stoneage_start_encounter_target_index.json 與 tools/generate_start_encounter_target_index.mjs，把 fixed-C encount/group 的 floor 100、200 encounter rectangle 變成可供後續 path testing 的 target set。

- floor 100：46 rows；32 unconditional、1 mixed、11 unresolved group、1 conditional item、1 placeholder。
- floor 200：114 rows；103 unconditional、5 mixed、5 unresolved group、1 conditional item。
- floor 100 source map identity 已由 fixed source catalog 對齊到 gmsv/data/map/sainasu/sainasu，並已完成 800×800 binary-level runtime verification。
- floor 200 的 gmsv/data/map/jyaruga/jalga 已完成 800×1200 binary-level runtime verification。

這一層只做 source-coordinate closure，不把 rectangle 當成玩家一定能走到的可玩刷怪區。下一階段須把 incoming portal landing → encounter rectangle 做 exact walkability/path proof。unresolved group 與 mixed rows 繼續分層處理，不跨版本補值。
## 2026-09-30 最新校正：Start-floor NPC 不是座標缺口，而是 template 缺口

`data/generated/stoneage_start_npc_coordinate_closure.json` 已把 46/46 start-floor NPC 的座標全部從 exact `borncorner` source 解出；`data/generated/stoneage_start_npc_reachability.json` 再以 fixed-C interaction contract 驗證 41/46 可達、0 個 unreachable。

剩餘 5 個不是座標問題，而是 `changeevent` runtime module 問題：4 個 `xinshou` 新手接待員加上 1 個薩姆吉爾村長，均由 source create 宣告 `enemy=changeevent|...`，但 pinned `gmsv/src/npc/npctemplate.c` 的 `functionSet[]` 找不到 `changeevent`。依 `gmsv/src/npc/npccreate.c::NPC_templateGetTemplateIndex` 的 unknown-template 行為，這些 block 不應被當成已實例化、可互動的 NPC。

## 2026-09-30 更新：四張 destination maps 全部閉合

fixed-C recursive tree 與 LS2MAP headers 已確認四個直接離村 destination floor 都有 exact map：1000 為 `sainasu/samugiru/samugiru`、2000 為 `sainasu/marinasu/2000`、3000 為 `jyaruga/jaja/jaja`、4000 為 `jyaruga/karutana/karutana`。目前 11 張 map runtime 已完成 verified index。

四個 destination 共 7 個 landing points 全部通過 tile/object walkability。這表示 destination map source 與 landing walkability 已經不是 blocker；接下來要處理的是 encounter 條件、一般掛機 region、changeevent runtime discrepancy 與 reward data closure。

## 2026-09-30 checkpoint：first-route source closure 已進入 encounter / module 階段

目前已完成四村起點 → direct warp → destination map 的 source-backed closure：四村出生點、8 個 direct warp exits、46 個 start-floor NPC coordinates、41/46 active-template NPC interactions，以及 4/4 destination map runtimes、7/7 landing walkability 均已有固定 C 證據。剩餘 blocker 已縮成三類：

1. `changeevent` 在 pinned `npctemplate.c` 不存在，5 個 start-floor blocks 因此維持 runtime-unresolved；
2. 2000/3000 direct encounter 仍是 item-gated，而 pinned `itemset6.txt` 為空；1000/4000 direct destination rows 是 placeholder，但可經 world exit path 接到已驗證的 floor 100 / 200 unconditional encounter target；
3. 新玩家 event 的 reward item/pet definitions 尚未全部在 pinned source 中閉合。

這個 checkpoint 之後，Map Coverage 的 first-route groundwork 已完成一個可執行的 ordinary encounter path closure layer，現在正式進入 Persistent State / Idle Loop；仍不回頭建立多個 playable HTML。
## 2026-09-30 Idle Loop Contract v1

新增 src/stoneage_idle_loop.mjs、docs/reference/idle-loop-contract.md、data/generated/stoneage_idle_loop_contract.json 與 regression。

Idle state machine 已固定為 disabled → moving → encounter_pending → in_battle → settlement → supply_check / moving，另處理 dead 與 offline_resume。battle result 是輸入，不在 presentation 或 idle orchestration 重新計算。

同步新增 data/generated/stoneage_first_idle_route_catalog.json，將已閉合的 map/portal/encounter path 串成首批 idle route skeleton：3 個 hometown 有 path-closed variants、1 個 hometown（4000）在 source portal 前被 block。battle strategy、補給、捕捉、背包滿、死亡恢復、offline accrual 仍維持 product-policy boundary。
## 2026-09-30 Persistent State Schema v1

新增 `src/stoneage_persistent_state.mjs`、`docs/reference/persistent-state-schema.md`、`data/generated/stoneage_persistent_state_schema.json` 與 `tools/check_persistent_state_schema.mjs`。

Canonical state schema = 1；fixed-C legacy save schema provenance = 30。固定 structural contracts：profession skill slots 26、player item slots 24。PetBox / Team / ActivePet 分離保存；legacy migration 採 known-field copy，未知 top-level keys 進 preservedUnknownKeys，不猜語義。

Idle 與 battleSettings 明確標示為放置版產品層，不冒充 fixed-C。
## 2026-09-30 Reward Transaction v1

新增 `src/stoneage_reward_transaction.mjs`、`docs/reference/reward-transaction-contract.md`、`data/generated/stoneage_reward_transaction_schema.json` 與 regression。Reward layer 只接受 battle/source runtime 已決定的 EXP / Gold / existing-item / Pet credit，不重新抽 reward RNG。固定 source 的 AddProfit 邊界與 carried loot ordering 已映射到 atomic transaction；inventory full 不做 partial commit，同 transactionId 重複提交不重複發獎勵。

## 2026-09-30 Idle Supply / Death / Offline Policy v1

新增 `src/stoneage_idle_policy.mjs`、`docs/reference/idle-supply-death-offline-policy.md`、`data/generated/stoneage_idle_policy_schema.json` 與 regression。Healer 的 player HP/MP full recovery 是 source-backed；supply threshold、death recovery mode、offline cap 與 offline reward simulation 維持 explicit product policy，不自行設定。

## 2026-09-30 Save Envelope / Simulation v1

新增 `src/stoneage_save_transaction.mjs`：canonical state 現在有 deterministic serialization、SHA-256 hash、schema validation / migration、revision conflict guard。Hash 採 Web Crypto，避免未來瀏覽器 runtime 依賴 Node-only crypto。

新增 `src/stoneage_idle_simulation.mjs`：first-idle route 可被執行成 pure simulation；route path time → encounter → injected battle result → reward transaction → supply/death decision → save commit。Runner 不重算 battle 或 reward RNG。offline resume 目前只計算時間窗與 explicit cap，不自行創造離線收益。

Existing-item reward lifecycle 已依 source 修正為只接收已存在且 enemy-owned 的 runtime item，並只能放入固定 Player backpack slots 9–23；不再由 reward layer 自行建立 existing-item slot。

下一階段：把 source-backed item/economy runtime、battle simulation adapter 與真正的 save/offline resume transaction 接起來，再擴主要 world route coverage；仍不建立多個 playable HTML 入口。

## 2026-09-30 Battle Result Adapter / Offline Resume

新增 `src/stoneage_battle_result_adapter.mjs` 與 regression。fixed-C PvE 的 completed battle result 現在有獨立 adapter，Idle Simulation 不直接接受未標準化的 battle object；PvE `winside=0/1` 分別映射 player victory/defeat，battle result 與 reward RNG 都不在 adapter 重算。

新增 `src/stoneage_offline_resume.mjs` 與 regression。Offline resume 現在可透過 Idle Simulation Runner 發起 checkpoint commit；必須先有 `idle.offline.eligible=true`，時間窗驗證後寫入 Save Envelope。尚未完成 source-backed offline battle/reward simulation，因此 `accruedSeconds=0` 與 `rewardsApplied=false` 是目前的安全邊界。

下一階段可把 source-backed battle simulation output 接到這個 adapter，再決定是否形成真正的 offline reward transaction；同時開始 Item / Economy runtime 與主要 world route coverage。

## 2026-09-30 Item / Economy Runtime v1

Item / Economy 已從「資料研究」進入 canonical state transaction 層：

- `sourcePlayerMaxGold()` 固定對齊 fixed-C `CHAR_getMaxHaveGold()` 的轉生金錢上限公式。
- Buy：source-resolved Item ID / cost / buy_rate → source allocator 建立 existing item → 放入 player backpack 9–23 → 扣 Gold。
- Sell：source-resolved price → 刪除 player existing item / 扣 pile → 加 Gold；simple-shop base price 9,999 boundary 與 source gold-cap guard 已固定。
- stack item 在 pile > 0 時保留同一 existing index；pile = 0 才釋放 runtime item。
- 尚未完成 source Item maker 的完整 browser adapter，因此 Buy 不自行產生 Item；缺少 source allocator 或 Item 來源證據時直接 fail-closed。

Regression：`tools/check_item_economy_runtime.mjs`。
Generated contract：`data/generated/stoneage_item_economy_runtime_schema.json`。

Source Item allocator / Item template runtime 已接通：fixed-C 66-field Item make lifecycle、existing-index allocator、ITEM_INITFUNC callback boundary 與 Item / Economy Buy adapter 均已建立，並由 tools/check_item_source_runtime.mjs + CI regression 固定。
NPC ItemShop Runtime v1 也已接通：固定 `npcgen_shop` → `.arg` → `ItemList/buy_rate/sell_rate` 的 source parser、shop→item 與 item→shop acquisition index、sell limits，以及 Item template cost → Economy Buy adapter 均已建立；由 tools/check_npc_itemshop_runtime.mjs + CI regression 固定。完整 pinned source checkout 仍必須作為 generator input，未在 repo 內假稱已完成 336 個 binding 的資料落盤。
NPC ItemShop Runtime v1 已接通，接著 V3.21 已新增 NPC Event / Quest Plan Runtime：source condition (`LV/TRANS/GOLD/ITEM/ENDEV/NOWEV`)、comma-OR / `&`-AND、branch selection 與 literal action plan 均已固定，並以 new-player `changeevent` script 做 regression。真正 mutation 仍需 explicit Item allocator / Pet factory / event-state writer，不把 unresolved reward definition 猜成 gameplay。
V3.21 NPC Event Plan Runtime 與 V3.22 NPC Event Action Transaction 已接通：condition → branch selection → literal action plan → staged atomic mutation boundary，且以 new-player `xinshoujd.arg` regression 鎖定。真正的 Item/Pet/Event/Charm mutation 仍只透過 explicit adapters，source definitions 未閉合就不升格。
V3.23 NPC Event Orchestrator 已完成：把 `condition → branch → action plan → atomic transaction` 收成單一 source event entry point，先以 `xinshoujd.arg` 做 first-route regression。接下來不是再做另一套 event parser，而是把這個入口接到已存在的 Item allocator、Pet template resolver、event-state writer 與 Save Transaction。
V3.24 已完成 new-player Pet source closure：`GetPet Enemy ID → enemy1 row → TempNo → enemybase1 template → 16-RNG Pet creation core`，並提供 explicit canonical Pet ID handler。V3.25 又完成 16 個新手 Item reward 的 source-backed Item allocator adapter。V3.26 再把 `EndSetFlg / NowSetFlg / ENDEV / NOWEV` 的 fixed-C bitset 正式接回 event runtime，因此 first-route reward flow 現在只剩 `Charm:1` concrete semantics 與正式 `changeevent` template activation 兩個主要 source blockers。
V3.27 first-route handler bundle 已完成並通過 atomic execution / rollback regression；V3.28 再把 V3.24 Pet、V3.25 Item、V3.26 Event Flag 與 V3.27 source-gated Charm adapter 直接接進 V3.23 orchestrator，形成可重播的 Lv1 new-player reward transaction。固定-C 的 Charm concrete rule 已查明：`CHAR_CHARM<100 && EvNo>0` 才增加，`EventNo:-1` 因此為 no-op。
下一階段集中閉合 pinned source 的 `changeevent` template registration / instantiation（`npctemplate.c/functionSet[]`），再把已閉合的 first-route transaction 接到 browser NPC interaction 與 Save Transaction；不再新增平行 reward engine。

V3.29 已完成 `changeevent` module audit：
V3.31 將 fixed-C NPC facing / distance 互動 gate 變成獨立 runtime；V3.32 再把 interaction gate、module resolution、handler factory 與既有 first-route Save bridge 接成唯一 dispatch entry point。正式 `changeevent` module 仍以 pinned `npctemplate.c/functionSet[]` 缺失為 source blocker，不偷補 alias。
V3.30 已完成 first-route Save integration：`condition → reward adapters → atomic NPC event transaction → existing Save Envelope → reload parity`。reward mutation chain 現在可持久化；正式 `changeevent` template registration 仍 unresolved，browser NPC interaction 仍是後續邊界。
pinned `npctemplate.c/functionSet[]` 沒有 `changeevent`，`npccreate.c` 對 unknown template 直接不掛 template；公開文件只能證明 changeevent 的 DSL 用途，不能補出缺失的 pinned C module。Reward mutation chain 已閉合，因此下一階段切到 Save Transaction integration 與可測試的 synthetic NPC interaction boundary，同時保留正式 `changeevent` instantiation unresolved。

V3.34 已補齊四段 new-player branch matrix regression，鎖定 Lv 1–99 / 100–139 / 140–149 / 150 的 source branch、Item/Pet reward、EndSetFlg 與 Save reload parity；因此下一個工作點回到正式 `changeevent` browser instantiation，而不是再擴 reward logic。

## 2026-09-30 V3.37–V3.39 Canonical Browser Runtime

V3.37 將 strict / compatibility policy 統一到 `stoneage_npc_runtime_config`；V3.38 再將 `NPC_TALK` 接成唯一 browser state controller，且以四個 hometown 的 `xinshou` changeevent rows 做 compatibility execution / Save reload regression。V3.39 建立唯一 `index.html` canonical browser shell，CI 固定 repository 只能存在一個 HTML entry。

目前正式邊界：

`index.html → canonical browser shell → Browser State Controller → NPC Dispatch → interaction gate → audited/compatibility module registry → first-route Save`

Strict mode 仍維持 pinned `changeevent` unresolved；Compatibility mode 只在明確 opt-in 下使用 external `changeevent → ExChangeMan` corroboration。這不代表 pinned fixed-C 已補回缺失的 `changeevent` functionSet。

下一階段可以開始把 verified world/map presentation 接到這個唯一 shell；reward、save、NPC dispatch 不再另起平行 engine。


## 2026-09-30 V3.40 Browser ItemShop / Economy Bridge

V3.40 已把已存在的 Item / Economy Runtime、Source Item Allocator 與 NPC ItemShop Runtime 接進 canonical browser state controller；沒有建立第二套 currency、inventory 或 shop engine。

正式邊界：

`browser action → source interaction gate → NPC ItemShop catalog → source Item price / Item template → allocator → Economy transaction → persistent state`

三個 browser action 已固定：

- `NPC_ITEMSHOP_OPEN)：source catalog lookup，唯讀。
- `NPC_ITEMSHOP_BUY)：source Item offer / base cost → source allocator → Gold debit。
- `NPC_ITEMSHOP_SELL)：existing Item source fields → `LimitItemType / LimitItemNo / special_item / special_rate` → Gold credit。

Regression 已加入 `tools/check_v340_browser_itemshop_runtime.mjs` 與 `.github/workflows/check-v340-browser-itemshop-runtime.yml`；canonical `index.html` 的 ItemShop probe 使用 synthetic fixture，只驗證 bridge contract。

本輪沒有把 fixture 升格為完整 world catalog。正式 world ItemShop 仍以 pinned fixed-C source checkout 生成，現有 service index 的 336 ItemShop bindings / 190 floors 仍維持 source-index 證據，不偽造完整 generated catalog。

### V3.40 之後

下一個實際切入點是：

1. 用 pinned fixed-C checkout 生成完整 ItemShop catalog，並把 shop binding 與 world NPC instance / floor 坐標建立正式 join。
2. 在同一個 browser state controller 上接 shop UI state（開啟店面、offer 選取、數量確認、結果提示）。
3. 再把正式 ItemShop browser flow 接回地圖中的可互動 NPC。

仍不新增第二個 HTML 入口，也不修改 V3.39 strict `changeevent` fail-closed policy。


## 2026-09-30 V3.41 Full NPC ItemShop Source-Catalog Verification

V3.41 將正式 ItemShop source closure 提升為可重跑的 GitHub Actions job：固定 checkout `gavinlinasd/StoneAge@1f90cb6cb57c1df70f39cde77a5a8ccd98b66c56`，執行既有 `generate_npc_itemshop_runtime.mjs`，並驗證：

- ItemShop binding 數量必須為 336。
- source parser 不得留下 unresolved binding。
- 每個正式 ItemShop offer 的 Item ID 必須能在本 repo 的 `stoneage_item_make_runtime` 找到 source Item template。
- 生成結果另存為 GitHub Actions artifact，作為後續 browser/world join 的驗證輸入。

這一階段先做 source closure / cross-check，不直接把 generated artifact 當成 production world data，也不改變 V3.40 browser fixture contract。



## 2026-09-30 V3.42 NPC ItemShop / World Join

V3.42 已新增同 pinned fixed-C source 的 World NPC + ItemShop 雙生成 join regression。CI 會：

- 重建 `stoneage_world_npc_index` 與 ItemShop catalog。
- 驗證 World index / service index 的 ItemShop instance count = 336、unique floors = 190。
- 驗證 ItemShop catalog 的 335 resolved + 1 unresolved 正好對應 336 個 source create blocks。
- 逐筆 join `create path#blockIndex`、floor、templateName 與 arg fileRef。
- 驗證正式 buy offer 的 Item IDs 全部存在於本 repo 的 Item source runtime。

固定 source 目前保留 1 筆明確 anomaly：`gmsv/data/npc/my/magicdou/daochang.create#8` → `my/ruieryasi/yao.arg`。該目錄在 pinned checkout 不存在，故維持 fail-closed，不以猜測檔案內容替代。

下一步不是再造新 engine，而是把通過 join 的正式 catalog 接回 canonical browser shell / world NPC interaction，並讓這一筆 anomaly 維持不可交易狀態直到有新的可證實 source。
