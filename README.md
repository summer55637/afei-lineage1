# afei-lineage1

「阿肥石器時代放置版」重建專案。

這個倉庫的方向不是把舊網頁程式碼重新堆回去，而是先用固定 source evidence 建立可驗證的資料與 runtime contract，再逐步接成一個唯一、可長時間遊玩的 PC＋手機單機網頁放置遊戲。

<!-- AUTO-README:START -->
## 📌 自動維護狀態

> 本區由 tools/generate_readme.mjs 產生。main 分支每次非 README push 都會由 GitHub Actions 自動刷新。

- 最新 commit：62dbefa — Add automatic README maintenance
- 最後更新時間：2026-09-30T15:50:55+08:00
- 版本線最高 regression workflow：V342
- Canonical browser entry：index.html；root HTML 入口目前為 1 個
- 舊入口殘留：已清除
- 固定 source：gavinlinasd/StoneAge@1f90cb6cb57c1df70f39cde77a5a8ccd98b66c56

### 核心 closure

| 區域 | 現況 | 摘要 |
|---|---|---|
| First-route spine | ✅ closed | 4/4 hometown maps；8/8 direct warp exits |
| Full first-route | ⚠️ partial | 6/8 portal groups usable |
| Verified map runtime | ✅ active | 11 maps；floor identity 以 LS2MAP header 為準 |
| World graph | ✅ indexed | 1,139 floor nodes；2,182 directed edges |
| NPC service index | ✅ indexed | 9,335 service instances；1,031 floors |
| Persistent State | ✅ schema 1 | legacy 30；skills 26；player items 24 |
| Item / Economy | ✅ runtime v1 | Gold cap 1000000 + transmigration * 1800000；backpack 9 to 23 |
| Idle route catalog | ✅ indexed | 3 path-closed towns；6/8 eligible variants |

### NPC → ItemShop → Item → Gold → Persistent State

Canonical Browser Shell → NPC interaction gate → NPC ItemShop → source Item template → Item allocator → Item/Economy transaction → Gold debit or credit → canonical Persistent State

目前 source 文件記錄完整 336 個 ItemShop binding。 Browser ItemShop bridge 使用同一條 contract，不另建第二套商店或貨幣規則。

### 主要 blocker

1. Resolve the five start-floor changeevent template/module discrepancies against the pinned build or keep them explicitly non-instantiable.
2. Resolve the 4000 -> 200 disconnected component against fixed-source map semantics; do not add a synthetic bridge or manual warp.
3. Treat the non-walkable 3000 -> 200 landing point (587,318) as unavailable while retaining the other verified landing points.
4. Close new-player event reward item/pet definitions without promoting unresolved IDs.

### 永久停用

- gmque：維持永久停用，不由後續版本自動恢復。

### 資料時間

- route closure：2026-09-30
- persistent state：2026-09-30
- item/economy schema：—
- idle route catalog：2026-09-30
- browser ItemShop contract：2026-09-30

<!-- AUTO-README:END -->

## 最終目標

### Source parity

固定 C / pinned source 是行為、數值、資料格式與執行順序的最高依據。

沒有證據的資料不能猜測、不能跨版本硬補，也不能因為「看起來合理」就直接變成遊戲規則。無法閉合的項目維持 unresolved / fail-closed。

### 視覺與操作還原

docs/reference/video-001-visual-reference.md 是重要的流程與視覺參考。

最終 presentation layer 不是舊版 2D 網頁的複製，而是現代 3D 卡通化 RPG／MMORPG 方向：斜俯視世界、角色與寵物、集中式回合戰鬥、現代 RPG HUD、技能／普攻／防禦／召喚／AUTO、村莊與 NPC 互動。

原始 UI、模型、貼圖、icon、字體與動畫只依實際授權範圍整合；授權外素材只作研究參考。

### 放置版產品層

屬於本專案新增的 idle／offline 規則，會與 fixed-C 明確分層。

基本產品循環：

自動移動 → 遇敵 → 戰鬥 → 結算 → 補給／死亡處理 → 繼續掛機

這些流程可以是產品層，但不能冒充原版 source parity。

## 核心架構

目前最重要的 runtime 主線：

Player / Canonical Browser Shell
→ NPC interaction gate
→ NPC ItemShop
→ source Item template
→ Item allocator
→ Item / Economy transaction
→ Gold debit / credit
→ canonical Persistent State

Browser、NPC、Item、Economy、Persistent State 各自有清楚的 contract；UI 不偷偷重算 source 規則。

## 目前開發位置

目前已從單純 source archaeology 進入 source-backed runtime integration 階段。

已建立：

- canonical browser shell：index.html
- Persistent State Schema v1
- Save Envelope / migration contract
- Idle Loop contract
- Reward Transaction
- NPC interaction runtime
- NPC ItemShop runtime
- Item source runtime
- Item / Economy runtime
- browser ItemShop bridge
- first-route / world-exit / encounter path closure
- verified LS2MAP runtime pipeline

這還不等於最終完整遊戲完成。完整世界地圖、完整 first-route、完整 reward definition、battle presentation、idle policy、授權素材整合與最終遊戲 UI 仍要逐步閉合。

## 開發原則

### Source-backed、fail-closed

固定 source 找不到，就標記 unresolved。

不建立「方便測試所以先亂補」的替代規則。

### Contract 優先於 UI

先確定資料格式、來源、transaction、state transition 與 regression，再做畫面。

### 唯一入口

正式可玩階段只保留一個 canonical HTML entry。

研究工具、generated data、runtime module、測試 regression 與 playable shell 分層，不再累積 game.html、game-live.html、play.html、start.html 等平行入口。

### Fixture 不得冒充 production data

Synthetic fixture 可以驗證 bridge contract，但不能冒充完整 fixed-C world catalog。

## 目前工作流

### World Data / Source Closure

持續整理 NPC、Event DSL、Item、Quest、Shop、Warp、Service、Encounter、Map 與世界關係。

### First Route

四個 hometown 出生點 → direct warp → destination map → 下一層 portal → encounter target，逐點要求 source evidence。

目前 route spine 已閉合，但 full first-route 仍須處理 source transition、changeevent module discrepancy 與新玩家 reward definitions。

### Persistent State

玩家、寵物、裝備、背包、技能、任務、事件、地圖位置、idle settings、save / migration 都必須先進 canonical state。

### Idle Loop

目前已有 state machine 與 simulation runner contract；battle strategy、補給、捕捉、背包滿、死亡、offline reward 等仍需逐項定義與來源化。

### NPC / Economy

目標是讓：

NPC → ItemShop → Item → Gold → Persistent State

真正形成單一 transaction boundary，並讓 source Item allocator 成為正式資料輸入，而不是由 UI 猜模板。

### Map Coverage

地圖處理鏈固定為：

LS2MAP binary → exact blob identity → header validation → mapset → battlemap candidates → verified runtime

下一階段沿 world graph / first-route 持續擴張主要世界路線的 map coverage。

### Authorized Asset Integration

等資料與 runtime contract 成熟後，再依實際授權範圍導入正式素材，並保留 asset hash、來源、版本與用途 manifest。

## 明確停用

data/generated/stoneage_disabled_features.json 是永久停用 feature 的正式清單。

目前 GMQUE／抓寵活動維持永久停用，不會因為後續版本更新而自動重新啟用，也不應以人工猜測補上缺失的 RANDGMQUE／QUEPART 設定。

## Repository 結構

_evidence/                 研究與來源證據
client-assets/             合法 client asset manifest / adapter
data/generated/            generated source closure / runtime data / schema
docs/                      roadmap、source contract、視覺與 runtime 文件
src/                       runtime modules
tools/                     generator、audit、regression
.github/workflows/         GitHub Actions regression 與 README 自動維護
index.html                 唯一 canonical browser shell
README.md                  專案總覽；狀態區由 workflow 自動更新

## 重要閱讀順序

1. docs/rebuild-roadmap.md
2. docs/reference/video-001-visual-reference.md
3. docs/reference/modern-3d-mobile-visual-ui-target.md
4. docs/reference/start-world-exit-reachability.md
5. docs/reference/start-encounter-target-index.md
6. docs/reference/idle-loop-contract.md
7. docs/reference/persistent-state-schema.md
8. docs/reference/save-envelope-contract.md
9. docs/reference/reward-transaction-contract.md
10. docs/reference/item-source-runtime.md
11. docs/reference/item-economy-runtime.md
12. docs/reference/npc-itemshop-runtime.md
13. docs/reference/v340-browser-itemshop-runtime.md

## 回歸與版本

每個重要 runtime closure 都應形成：

source evidence → generator / adapter → regression → GitHub Actions

版本歷史以 Git commit、docs/changelog/ 與 workflow regression 為主。README 只保留目前狀態、架構與導覽，不再人工堆積大量重複的「本輪新增」段落。

## README 自動整理

README 的 AUTO-README markers 之間屬於機器產生區。

main 分支每次非 README push：

1. GitHub Actions 執行 tools/generate_readme.mjs。
2. 讀取 repository 內的 generated JSON、workflow、root HTML entry 與最新 commit。
3. 更新 closure、版本、入口、runtime 主線與 blocker 摘要。
4. 若 README 有變更，就以 [docs] auto-update README commit 回 main。
5. README 自己的 commit 不會再次觸發 workflow，避免無限循環。

之後開發新版本時，重點只需要更新實際 code / docs / generated data；README 的狀態整理交給 workflow。

## 判定標準

在進入完整可玩版本前，至少要能回答：

- 玩家從哪裡出生？
- 主要地圖怎麼連？
- NPC 在哪裡、提供什麼？
- Item 怎麼取得與消耗？
- Gold 怎麼流動？
- 戰鬥怎麼結算？
- 玩家／寵物怎麼成長？
- 任務／事件怎麼保存？
- 掛機怎麼循環？
- offline resume 的邊界在哪裡？
- 哪些規則來自 fixed-C，哪些來自影片還原，哪些是本專案新增的 idle product policy？

只要還有大面積空白，就繼續補資料與 contract，不急著把 UI 當成完成品。

---

README 結構整理日期：2026-09-30。
