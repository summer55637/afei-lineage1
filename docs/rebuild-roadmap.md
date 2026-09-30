# 重建藍圖：最終目標前的資料與系統補齊

更新日期：2026-09-30

## 2026-09-30 進度

已完成第一版 **World Data Source Catalog**：固定 source `gavinlinasd/StoneAge@1f90cb6cb57c1df70f39cde77a5a8ccd98b66c56` 的 5,764 個 blob files、3,960 個 NPC data files，以及主要世界資料檔案已建立 machine-readable inventory。NPC 的 template → create → floor/region → argument 關係也已用 pinned C 的載入／生成流程固定。

本輪沒有建立 playable HTML，也沒有把未閉合 NPC／任務資料硬塞成 gameplay。

下一步直接進入 **world-npc-index**：從固定 NPC tree 中建立可追蹤的 NPC instance index，優先閉合地圖、位置、template、functionset 與 arg 的關係，再向 shop / quest / warp / service 擴展。

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

目前只有 7 張 verified map runtime；source catalog 本身有 1284 個 map blobs，因此「全世界地圖」仍遠未閉合。

### 4. 原版客戶端圖像技術鏈

已完成 parser / resolver / decoder / palette / tile presentation adapter。

目前 `client-assets/manifest.json` 是 unavailable，沒有發布原版 BIN，因此真實原版圖片不會自動進入網站。

## 現在最需要補的部分

## A. 世界資料層：最高優先

這是目前最重要的缺口。

原始 server data 除了已解析的 encounter、enemy、item、magic、petskill、profession、map 外，還存在 NPC、mission、memberpets、membershop、ride、title、question、event 等資料層。

因此下一階段應建立「World Data Catalog」，至少整理：

- NPC 出現位置與 template/create/arg 關係
- NPC 對話與條件
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

這樣才有可能做出真正「世界」，而不是只顯示幾張測試地圖。

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

1. **World Data Catalog**：先把 fixed C 的 NPC / mission / shop / warp / event data 全面盤點與來源定位。
2. **Map Coverage Expansion**：由 7 張 verified map 擴到可形成主要世界路線的完整地圖群。
3. **Persistent State Schema**：整理玩家／寵物／背包／裝備／技能／任務／掛機的統一狀態模型。
4. **Idle Loop Contract**：定義自動遇敵、戰鬥、結算、補給、死亡、停機／離線的正式流程。
5. **Battle Presentation Contract**：把已驗證 battle result 接到完整場景與動畫事件。
6. **NPC / Economy Runtime**：讓世界不是只有打怪，而是能移動、互動、取得資源。
7. **Authorized Asset Integration**：有合法 client assets 時再打開真實 sprite / tile。
8. **唯一可玩入口**：前面資料與系統成熟後，才重新建立新的遊戲頁。

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

