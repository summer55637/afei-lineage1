# 重建藍圖：最終目標前的資料與系統補齊

更新日期：2026-09-30

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

目前已有 10 張 verified map runtime；source catalog 本身有 1284 個 map blobs，因此「全世界地圖」仍遠未閉合。四張 first-route destination maps 已經加入這 10 張 verified runtime。

四個 hometown 的原始 LS2MAP 已完成 exact pinned-source walkability audit，但這四張目前仍不代表完整世界地圖 coverage；下一階段仍要把 destination maps 與主要世界 route 逐步轉成 verified runtime。

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

現在 1284 個 source map blobs 只有 7 張已轉成 verified runtime。

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

目前 first-route spine 已證明四個出生村的直接 warp 在 pinned source 上是可走的。destination 層也已完成 4/4 exact map source、7/7 landing walkability；1000/3000/4000 是非 numeric filename、由 LS2MAP header 識別 floor。2000 的 Group 1018 需要 item 20219、3000 的 Group 1015 需要 item 20216，而 pinned `itemset6.txt` 是空檔，所以兩者仍是 `conditional_unresolved_item_source`；1000/4000 的 direct destination 僅有 placeholder。下一階段不再花時間補 destination map source，而是把 active encounter region、changeevent module 與 reward closure 往下接。

## C. 玩家／寵物完整資料模型：高優先

雖然戰鬥公式研究很多，但要做成長時間運作的遊戲，還需要統一的 persistent state schema：

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

這是最終遊戲與普通 Stone Age 重建之間最重要的產品層。

需要先定義、再實作：

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
2. **Start Route Closure**：source-route spine 已 closed；46/46 start-floor NPC coordinates 已 source-resolved；41/46 active-template NPC interactions 已完成 reachability、0 個 unreachable，5 個 `changeevent` runtime-unresolved。destination-map source／landing walkability 也已 4/4、7/7 closed；下一步集中在 active encounter eligibility／一般掛機 region、changeevent module discrepancy 與 reward definitions。
3. **Map Coverage Expansion**：由目前 10 張 verified map 繼續擴到能形成主要世界路線的完整地圖群。
4. **Persistent State Schema**：整理玩家／寵物／背包／裝備／技能／任務／掛機的統一狀態模型。
5. **Idle Loop Contract**：定義自動遇敵、戰鬥、結算、補給、死亡、停機／離線的正式流程。
6. **Battle Presentation Contract**：把已驗證 battle result 接到完整場景與動畫事件。
7. **NPC / Economy Runtime**：讓世界不是只有打怪，而是能移動、互動、取得資源。
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


## 2026-09-30 最新校正：Start-floor NPC 不是座標缺口，而是 template 缺口

`data/generated/stoneage_start_npc_coordinate_closure.json` 已把 46/46 start-floor NPC 的座標全部從 exact `borncorner` source 解出；`data/generated/stoneage_start_npc_reachability.json` 再以 fixed-C interaction contract 驗證 41/46 可達、0 個 unreachable。

剩餘 5 個不是座標問題，而是 `changeevent` runtime module 問題：4 個 `xinshou` 新手接待員加上 1 個薩姆吉爾村長，均由 source create 宣告 `enemy=changeevent|...`，但 pinned `gmsv/src/npc/npctemplate.c` 的 `functionSet[]` 找不到 `changeevent`。依 `gmsv/src/npc/npccreate.c::NPC_templateGetTemplateIndex` 的 unknown-template 行為，這些 block 不應被當成已實例化、可互動的 NPC。

## 2026-09-30 更新：四張 destination maps 全部閉合

fixed-C recursive tree 與 LS2MAP headers 已確認四個直接離村 destination floor 都有 exact map：1000 為 `sainasu/samugiru/samugiru`、2000 為 `sainasu/marinasu/2000`、3000 為 `jyaruga/jaja/jaja`、4000 為 `jyaruga/karutana/karutana`。目前 10 張 map runtime 已完成 verified index。

四個 destination 共 7 個 landing points 全部通過 tile/object walkability。這表示 destination map source 與 landing walkability 已經不是 blocker；接下來要處理的是 encounter 條件、一般掛機 region、changeevent runtime discrepancy 與 reward data closure。

## 2026-09-30 checkpoint：first-route source closure 已進入 encounter / module 階段

目前已完成四村起點 → direct warp → destination map 的 source-backed closure：四村出生點、8 個 direct warp exits、46 個 start-floor NPC coordinates、41/46 active-template NPC interactions，以及 4/4 destination map runtimes、7/7 landing walkability 均已有固定 C 證據。剩餘 blocker 已縮成三類：

1. `changeevent` 在 pinned `npctemplate.c` 不存在，5 個 start-floor blocks 因此維持 runtime-unresolved；
2. 2000/3000 direct encounter 是 item-gated，而 pinned `itemset6.txt` 為空；1000/4000 direct encounter 是 placeholder，需要沿 exact world graph 找真正的 unconditional encounter region；
3. 新玩家 event 的 reward item/pet definitions 尚未全部在 pinned source 中閉合。

這個 checkpoint 之後，Map Coverage 的工作由「找第一張 destination map」轉向「找可執行的 ordinary encounter region 與其座標級路徑」，再進入 Persistent State / Idle Loop，而不是回頭建立 playable HTML。