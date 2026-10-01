# afei-lineage1

「阿肥石器時代放置版」重建專案。

這個倉庫的方向不是把舊網頁程式碼重新堆回去，而是先以最完整的 VM 一鍵端＋手工外網端建立可追溯的世界／部署資料，再用 pinned fixed-C 校驗引擎語義與 runtime contract，最後接成一個唯一、可長時間遊玩的 PC＋手機單機網頁放置遊戲。

<!-- AUTO-README:START -->
## 📌 自動維護狀態

> 本區由 tools/generate_readme.mjs 產生。main 分支每次非 README push 都會由 GitHub Actions 自動刷新。

- 最新 commit：58059e2 — docs: correct ro0000 provenance in roadmap
- 最後更新時間：2026-10-01T18:16:59+08:00
- 版本線最高 regression workflow：V4.25
- Playable HTML entry：目前刻意為 0 個；待資料與 runtime contract 成熟後才重新建立唯一入口
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
| New-player seed | ✅ source-closed | trans 1；lv 1；pet lv 1；gold 30000；item1 24114 |
| Player creation | ✅ state contract | hometown + stats + elements + starter grant status；still headless，no playable HTML |
| Starter Pet grant | ✅ runtime | 16 RNG calls；VariableAI 0；HP after compliance；source rank closed；4 hometown templates base stat sum = 79；rank = 5；team/activePet unchanged |
| Starter Item 24114 | ⚠️ fail-closed | source max ID 23009 → ITEM_tblen 23010；configured 24114 越界；actual row id 11817 / imagenumber 24114 |
| New-player creation → Save | ✅ headless pipeline | creation → hometown position → Starter Pet → Item adapter boundary → Save Envelope → reload verification；`completed` only after Item adapter succeeds |
| Idle route catalog | ✅ indexed | 3 path-closed towns；6/8 eligible variants |
| Battle Pipeline | ✅ V4.25 | V4.01 AttackSeq Prelude → V4.02 Damage Plan → V4.03 Critical/Guard → V4.04 DamageReact → V4.05 Counter → V4.06 Death Plan → V4.07 Death Commit → V4.08 Battle End Plan → V4.09 Finish Commit → V4.10 Profit Route Plan → V4.11 DuelPoint Plan → V4.12 DuelPoint Commit → V4.13 Battle EXP Plan → V4.14 Battle Level-Up Plan → V4.15 Pet Growth Plan → V4.16 Level-Up Commit → V4.17 Battle Item Plan → V4.18 Battle Item Commit → V4.19 Battle Compliance Plan → V4.20 Battle Compliance Commit → V4.22 Battle Player Exit Plan → V4.22 Battle Player Exit Commit → V4.21 Battle Exit Plan → V4.23 Exit Transient Cleanup → V4.24 Settlement Receipt Barrier → V4.25 Receipt-Bound Exit Gate |

### NPC → ItemShop → Item → Gold → Persistent State

Browser-facing runtime contract → NPC interaction gate → NPC ItemShop → source Item template → Item allocator → Item/Economy transaction → Gold debit or credit → canonical Persistent State

目前 source 文件記錄完整 336 個 ItemShop binding。 Browser ItemShop bridge 使用同一條 contract，不另建第二套商店或貨幣規則。

### 主要 blocker

1. Resolve the 4000 -> 200 disconnected component against fixed-source map semantics; do not add a synthetic bridge or manual warp.
2. Treat the non-walkable 3000 -> 200 landing point (587,318) as unavailable while retaining the other verified landing points.
3. Advance Persistent State Schema for player, pet, inventory, equipment, skills, quests, map position, idle settings and save/migration.
4. Starter Item 24114：pinned source max ID 23009 → ITEM_tblen 23010，configured 24114 is out of range；source row is id 11817 / imagenumber 24114；keep fail-closed and do not remap.

### 永久停用

- gmque：維持永久停用，不由後續版本自動恢復。

### 資料時間

- route closure：2026-09-30
- persistent state：2026-10-01
- item/economy schema：2026-09-30
- new-player seed：2026-09-30
- starter Item 24114 audit：2026-09-30；mapping audit v2 / build closure v1：2026-09-30
- V3.50 creation/save runtime：2026-09-30
- idle route catalog：2026-09-30
- browser ItemShop contract：2026-09-30

<!-- AUTO-README:END -->

## 對話交接／開發自述

這一區是跨新對話的工作交接基準。開始新的 ChatGPT 對話時，先讀本區，再以 GitHub 實際內容為準接續，不要求使用者重新貼之前已確認的長篇檔案清單。

### Source snapshot

- 外部端參考資料統一放在 `ro0000/`。
- 目前 `ro0000/` 已整理為：
  - `server/merged-source/`：來源規則已校正：只有 `wwwroot/` 資料夾屬手工外網端；其餘快照資料均屬 VM 一鍵端。
  - `server/database/175sa.sql`：資料庫參考，屬 VM 一鍵端。
  - `client/android/冰河石器-隐盟.apk`：Android Client 主程式／研究參考。
  - `docs/搭建教程.txt`：手工外網端架設教程。
  - `docs/隐盟文本教程.txt`：VM 一鍵端架設／維運教程。
- 原始內容優先保留；後續整理或差異分析不得因檔名相同就假設內容相同。
- 完整來源角色：依目前已確認 provenance，VM 一鍵端＋手工外網端是從可直接架設石器時代手游的實際部署資料複製取得，因此是目前最完整、最接近完整可部署版本的實機／部署資料主來源；pinned fixed-C 是引擎行為與語義校驗基準；詳見 `docs/source-authority-and-provenance.md`。

### VM／WinSCP 使用狀態

- 目前 VM 與 WinSCP 已完成第一輪來源盤點。
- 沒有進一步需要時可以關閉 VM 與 WinSCP，但不要刪除 VM、原始檔案或來源環境。
- 若之後發現 `ro0000` 漏檔或需要驗證原始內容，再重新開啟 VM／WinSCP。

### 下一個主要工作

目前不再繼續手工搬運 VM 檔案。`ro0000/` 的 endpoint provenance 已固定，且 VM 一鍵端＋手工外網端正式升級為首要重建資料來源。

後續 source audit 先依 endpoint provenance 與 exact identity 判定實際部署資料，再用 fixed-C 做 engine semantics / parity 校驗。與 fixed-C 不同但能證明屬於 endpoint 的內容，標記為 endpoint variant，不因 mismatch 自動丟棄。完整順序為：Endpoint Provenance → Exact Identity → Endpoint Completeness → Fixed-C Semantic Check → Evidence / Regression → Canonical Runtime。

### 交接規則

- 新對話開始時，先讀本區與目前 README AUTO-README 狀態。
- 不重問使用者已經在 GitHub 留下答案的問題。
- 不要求使用者重新貼已經完成的長篇目錄清單；優先直接讀 GitHub。
- 若需要重新取得原始端資料，只在 GitHub 現有 snapshot 缺失且 VM／WinSCP 能提供新 evidence 時才回到 VM。
- 使用 GitHub／Google 做 source audit 時，避免重複同一批無新決定性證據的搜尋，遵守本 README 的 blocker 再檢查規則。
- README 中本區是工作交接基準；實際程式狀態仍以 repository、commit、regression 與 evidence 為準。

## 最終目標

### Source parity

來源策略採分層制：完整 endpoint 資料主導「實際部署版本有什麼」，pinned fixed-C 主導「引擎行為應如何運作」。兩者衝突時先辨識 variant，再決定 runtime eligibility；不自動把 endpoint mismatch 當成錯誤。

沒有足夠證據的資料不能猜測、不能跨版本硬補，也不能因為「看起來合理」就直接變成遊戲規則。無法閉合的項目維持 unresolved / fail-closed。

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

Player / Browser-facing runtime contract
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

- browser-facing runtime contract（不等於可玩 HTML）
- Persistent State Schema v1
- Save Envelope / migration contract
- Idle Loop contract
- Reward Transaction
- NPC interaction runtime
- NPC ItemShop runtime
- Item source runtime
- Item / Economy runtime
- browser-facing ItemShop bridge（headless contract）
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

目前刻意不保留任何 HTML playable entry。等資料、runtime contract 與 regression 成熟後，才一次建立唯一 canonical playable entry。

研究工具、generated data 與 runtime module 維持獨立，不再累積 game.html、game-live.html、play.html、start.html 等平行入口。

### Fixture 不得冒充 production data

Synthetic fixture 可以驗證 bridge contract，但不能冒充完整 fixed-C world catalog.

### Blocker 再檢查規則

同一個 unresolved / fail-closed blocker 不得讓主線無限循環。第一次發現時必須完成 source audit、必要的 GitHub／Google 交叉查找、regression 與 evidence 記錄；若仍缺決定性證據，就先標記 unresolved / fail-closed，讓其他可獨立閉合的 runtime 繼續往前。

後續只有在出現新的 authoritative source、不同版本的實質資料差異、以前未查過的 evidence layer，或新 runtime 確實把該 blocker 變成必要前置條件時，才重新打開調查。單純重複同一批搜尋結果，不視為新的進展。

目前的 4000→200、3000→200 landing (587,318)、Starter Item 24114 等問題依此規則保留；它們是 unresolved boundary，不是整個專案停止的理由。若最終仍沒有足夠 source evidence，維持 fail-closed 也屬於合法 closure，不以猜測、synthetic bridge 或私自 remap 強行完成。

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

## 外部端資料

後續新增的石器時代端資料統一集中放在 `ro0000/`。

依目前已確認 provenance，VM 一鍵端＋手工外網端都是從可直接架設石器時代手游的實際部署資料複製取得，因此是目前最完整、最接近完整可部署版本的實機／部署資料主來源。

原始資料必須先保留 provenance 與 exact identity，再經 Endpoint Completeness、pinned fixed-C 語義校驗、evidence 與 regression 後，才轉成 canonical production runtime data。

同一份 endpoint data 即使與 fixed-C 不同，也不能未經分析就刪除；可證明的部署差異標記為 endpoint variant，無法判定則保持 unresolved / fail-closed。

## Repository 結構

_evidence/                 研究與來源證據
client-assets/             合法 client asset manifest / adapter
data/generated/            generated source closure / runtime data / schema
docs/                      roadmap、source authority、source contract、視覺與 runtime 文件
src/                       runtime modules
tools/                     generator、audit、regression
.github/workflows/         GitHub Actions regression 與 README 自動維護
（目前沒有 HTML playable entry）
README.md                  專案總覽；狀態區由 workflow 自動更新

## 重要閱讀順序

1. docs/source-authority-and-provenance.md
2. docs/rebuild-roadmap.md
3. docs/reference/video-001-visual-reference.md
4. docs/reference/modern-3d-mobile-visual-ui-target.md
5. docs/reference/start-world-exit-reachability.md
6. docs/reference/start-encounter-target-index.md
7. docs/reference/idle-loop-contract.md
8. docs/reference/persistent-state-schema.md
9. docs/reference/save-envelope-contract.md
10. docs/reference/reward-transaction-contract.md
11. docs/reference/item-source-runtime.md
12. docs/reference/item-economy-runtime.md
13. docs/reference/npc-itemshop-runtime.md
14. docs/reference/v340-browser-itemshop-runtime.md

## 回歸與版本

每個重要 runtime closure 都應形成：

source evidence → generator / adapter → regression → GitHub Actions

版本歷史以 Git commit、docs/changelog/ 與 workflow regression 為主。README 只保留目前狀態、架構與導覽，不再人工堆積大量重複的「本輪新增」段落。

## GitHub / CI 驗證邊界

GitHub 已與 GPT 連線，本專案的 GitHub connector 可以讀取 repository、workflow 檔案、commit 與部分 CI/status 資訊；「拿不到某一次 Actions 的 push-run」不代表 GitHub 沒有連線，也不代表該 run 失敗。

CI 判定必須區分：

- JS parser / 本地語法檢查通過：只代表程式碼可被 JavaScript parser 正常解析。
- Regression 通過：只代表實際執行的 regression 在該環境成功。
- GitHub Actions PASS：必須有對應的 GitHub Actions run / check / status 實際結果作為證據。
- 查不到 push-run：標記為「未取得該次 GitHub Actions 實際結果」，不得寫成 CI PASS，也不得寫成 CI FAIL。

後續開發回報 CI 時，優先使用實際可取得的 GitHub run、check 或 status 證據；若目前 connector 只提供 workflow 檔案或有限的 commit/status 資訊，就明確說明驗證層級，不把「GitHub 已連線」與「這一次 push 的 CI 已 PASS」混為一談。

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
