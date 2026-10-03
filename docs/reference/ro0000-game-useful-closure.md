# RO0000 Game-Useful Closure Audit

更新：2026-10-03

## 目的

本文件定義 RO0000 在「阿肥石器時代放置版」中的實際完成標準：

> 只要求所有會影響遊戲製作的資料與語義完成解析；純歷史、備份、殘留或與產品玩法無關的資料不要求逐檔完成。

RO0000 是實際部署 snapshot。VM 一鍵端與手工外網端為實際部署資料的主要來源；Pinned Fixed-C 只用來確認 loader、runtime semantics、資料格式與執行順序，不可自動覆蓋 endpoint variant。

## 已閉合的高價值範圍

- 世界／地圖：主要 source-route、四個 hometown 起始路徑、首條 idle route 的地圖與 landing/encounter path 已建立 source-backed closure；產品專用的 4000 修補維持為獨立 runtime overlay，不修改原始 RO0000。
- 戰鬥資料鏈：endpoint `encount.txt → group1.txt → enemy1.txt → enemybase1.txt` 的 Group→Enemy 與 Enemy→EnemyBase 引用已閉合；首條 idle route 使用的 Encounter 65／28／91／95 已有 source-backed route closure。
- NPC：hometown 100/200/300/400 的 NPC path 均完整保留；endpoint variant 與 Fixed-C 不同時以 endpoint 為準。
- Item/Economy：endpoint `setup.cf`、`itemset6.csv` 與 runtime loader semantics 已解析；`ITEM1=32003` 在目前 endpoint item table 中確實沒有 exact source-ID row，因此不做 24114 或其他 ID 的猜測替換。這是資料邊界已知，不是「尚未找到 parser」。
- Pet skill / battle variants：`petskill2.txt`、`skillcode.txt` 等已確認存在實際 data/hydata gameplay 差異，不做全域覆蓋。
- Event / NPC script：已建立 source authority 與 loader admission 規則；對無 authoritative binding 的 residue/variant 保持未啟用，不把猜測版本當成正式 runtime。

## 目前真正仍需保留的「遊戲相關證據缺口」

### 1. Endpoint Encounter→Group 的 30 個 active Group refs

目前 endpoint battle audit 明確列出：

`1, 196, 200, 791, 792, 793, 794, 795, 796, 797, 800, 802, 804, 805, 806, 808, 809, 811, 821, 823, 824, 826, 827, 1131, 1315, 1316, 1327, 1328, 1467, 1500`

其中：
- Group 1131 在 endpoint `data/group1.txt` 與 `hydata/group1.txt` 均以 `#` 開頭，屬註解／inactive row，不應當成已缺失的正式 active row。
- Group 1467 在 `hydata/group1.txt` 有正式 active row；endpoint `data/group1.txt` 沒有，這是 data/hydata variant，而不是可以自行補寫的缺檔。
- 其餘 current endpoint unresolved IDs 在 selected `group1.txt` 內沒有 active row。

這些 refs 分布於 floor 100、200、300、400 與多個特殊／活動／副本 floor。它們不是首條 idle route 的必要 encounter 來源；首條路線目前依 Encounter 65／28／91／95 閉合。因此產品主線不應被這 30 個 optional/variant coverage refs 阻塞。但若日後要求恢復相應地圖的完整野怪覆蓋，仍需另外找到 endpoint-authoritative provenance。

### 2. `appear.txt`

RO0000 endpoint 的 `data/appear.txt` 與 `hydata/data/appear.txt` 均不存在。

Fixed-C 已完整解析此檔案的格式與 runtime 使用：
- server startup 直接呼叫 `CHAR_initAppearPosition(getAppearfile())`
- 每個有效行是 `floor x y`
- `CHAR_isAppearPosition()` 以 floor exact match 取得座標
- character load 時，命中 appear floor 會回到 `CHAR_LASTTALKELDER` 對應的 elder position

因此「語義」已解析完成；但 RO0000 endpoint 的原始 `appear.txt` bytes 沒有來源，不能用 Fixed-C 或公開其他版本資料冒充 endpoint。

### 3. Pet skill shop Lua hook binding

RO0000 `setup.cf` 指向：
`data/ablua/freepetskillshop.lua`

RO0000 的 `data` 與 `hydata` 實際存在：
`data/ablua/petskillshop.lua`

該 Lua payload 已讀取並解析，核心 `FreePetSkillShop()` 直接 `return 1`，其餘 `data()/main()` 為空殼。

Fixed-C 的 `npc_freepetskillshop.c` 也已解析，包含寵物特殊技能條件、gold/item gate、skill slot 寫入與 warp 邏輯。

因此目前缺口是「setup path 與 deployed Lua filename 的 provenance/binding」，不是 Lua 語義未解析。沒有找到 authoritative loader call-site 前，不做 rename/copy。

## 舊報告的口徑修正

- Fixed-C 的一般 encounter closure 曾把 Group 1230 列為 unresolved；但直接核對 RO0000 endpoint 後，Group 1230 實際存在於 endpoint data/hydata，因此不能把它繼續列為 RO0000 缺檔。
- 舊的 Item/Event 236 unresolved report 是「Fixed-C event references 對 Fixed-C itemset6.txt catalog」的分析，不是 RO0000 endpoint event/item 缺檔清單；不得把 236 直接當成 RO0000 missing items。
- 因此後續任何「RO0000 未完成」判定，必須優先引用 endpoint-primary audit，而不是固定來源的歷史 closure 統計。

## 完成判定

目前可以宣稱：

> RO0000 對「阿肥石器時代放置版」的主要、已納入產品路線的遊戲資料與 runtime 語義已完成解析；剩餘項目只保留為明確標記的 endpoint provenance / optional coverage 缺口，不以猜測資料補齊。

若產品範圍擴大到「所有 RO0000 特殊地圖／活動的完整原版 encounter coverage」或要求 server 原始 boot 100% 自洽，則上述缺口仍需額外 provenance，不應假裝已閉合。



## 2026-10-03 Encounter→Group 深度覆核

新增 `data/generated/stoneage_endpoint_active_group_gap_triage.json`。

這輪不是只檢查 Group row 是否存在，而是把 30 個 unresolved active Group reference 同時對 endpoint `encount.txt`、hydata 與 pinned Fixed-C 的 active Encounter rows 交叉比對。

結果：

- 30 個 Group refs 全部確實被至少一個 active Encounter row 使用。
- endpoint `group1.txt` 沒有任何正式 active row；Group 1131 只有一條 commented row。
- hydata `group1.txt` 有正式 Group 1467；其內容與 Fixed-C 的 Group 1467 不同。
- Fixed-C `group1.txt` 有正式 Group 1131、1467、1500。
- 其餘 27 個 Group ID 在 endpoint data、endpoint hydata 與 Fixed-C 的 `group1.txt` 都沒有正式 Group definition。

因此目前把這 30 個問題重新定義為 **Encounter coverage source gap**，而不是「找到一個相似 Group 就可以補上」：

- 核心世界 floor 100：791／792／793／794／1315／1316
- 核心世界 floor 200：800／808／811／1131
- 核心世界 floor 300：824／827
- 核心世界 floor 400：809
- 其餘為特殊地圖／副本／活動相關 floor。

其中 endpoint 與 Fixed-C 的 Encounter 參照本身大多數相同；真正明顯的部署 variant 包含 Group 809 的 floor-400 Encounter 編號與矩形，以及 Group 1500 的 endpoint floor 5507 使用方式。

這批資料對「完整恢復所有原版 encounter coverage」仍有價值，尤其是 100／200／300／400 四個核心世界；但它們目前沒有阻塞首條放置主線，因首條閉合路線使用的 Encounter 65／28／91／95 已完成 source-backed closure。



## 2026-10-03 單機 Item／PetSkill 解析

### 新玩家出生道具

RO0000 `setup.cf` 實際配置了 15 個新玩家 Item：

`32003, 32004, 32005, 32006, 32007, 32013, 32008, 32009, 32010, 32011, 32160, 22407, 22077, 32419, 32420`。

對 endpoint `itemset6.csv` 做完整 exact numeric scan 後，**15 個 ID 全部為 0 次**。

Pinned Fixed-C 的新玩家建立流程已核對：`CHAR_loginAddItemForNew()` 在 `_HELP_NEWHAND` 下對 15 個 slot 逐一呼叫 `getNewplayergiveitem(i)`；成功值會直接進 `ITEM_makeItemAndRegist()`，再經 `ITEM_CHECKITEMTABLE()` 判斷 Item 是否存在。Item 建立失敗時不會插入玩家背包。

因此 RO0000 endpoint 的「15 個出生 Item 設定」與目前部署 Item table 之間是一個**已知且可精確描述的 source boundary**：目前 snapshot 沒有 source-backed successful starter-item grant。不能把 Fixed-C 的 24114 或其他 Item image number 當成替代品。

### 寵物技能

RO0000 `setup.cf` 的 active skill file 是：

`./data/petskill2.txt`

因此單機版的 endpoint-primary 寵物技能資料應以：

`ro0000/server/merged-source/gmsv/data/petskill2.txt`

為準，不以 hydata 覆蓋。

已確認最明顯的 gameplay variant：

- Skill 652「暴虐-背水之戰」：endpoint data = `攻+58%、防-45%`
- hydata = `攻+55%、防-45%`

`skillcode.txt` 同樣會直接被 Fixed-C 的 `Load_PetSkillCodes()` 以 `./data/skillcode.txt` 載入，並將 `name / TempNo / PetId / Code` 寫入 `Code_skill[]`；而 `Code` 會參與特殊寵物技能資格判定。因此它是實際 gameplay data，不是單純 UI 文本。RO0000 data 有 158 行、hydata 有 160 行，兩端各存在多筆 variant，後續維持 data-primary、variant 保留。

### GMQUE／抓寵活動

重新掃描 RO0000 endpoint 的 `gmsv/data/npc` 共 2,384 個檔案，沒有找到 `RANDGMQUE` / `QUEPART0` 等正式 endpoint task-argument source。這表示目前不能從 RO0000 建立實際活動任務內容；Fixed-C 的 parser／reward engine semantics 已解析，但沒有 endpoint authoritative task payload 就不進行猜測。

詳細結果另存於：

`data/generated/stoneage_ro0000_singleplayer_item_skill_closure.json`



## 2026-10-03 核心 Runtime Data 第二輪

又完成一輪只針對單機有用資料的 source closure：

- `map/mapset.txt)：RO0000 data / hydata 均 16,802 行且完全相同。Fixed-C `MAP_readMapConfFile()` 會將它載入成 image-number keyed map attributes；已確認可走性、高度、防禦、進出地圖傷害、battle-map selector，以及進入／離開時的異常狀態欄位都屬實際 runtime 語義。
- `magic.txt)：data / hydata 均 223 行、完全相同，並由 `MAGIC_initMagic(getMagicfile())` 載入。無 endpoint variant 缺口。
- `itematom.txt)：data / hydata 均 93 行、完全相同，並由 `ITEM_initItemAtom(getItematomfile())` 載入；屬素材／合成資料。無 endpoint variant 缺口。
- `effect.txt)：data / hydata 均 847 行、完全相同；屬 encounter／map effect 時序設定。無 endpoint variant 缺口。
- `inv.txt)：data / hydata 完全相同，48 bytes，且與 pinned Fixed-C 完全相同；Fixed-C 定義 `INV / ITM / MAG` 三類區域。由於目前 snapshot bytes 無法還原成可讀的區域記錄，不猜測其內容。
- `battlemap.txt)：既有解析已閉合為 74 active blocks、199 distinct battle-map numbers；唯一反常資料是 `3137 to 1349` 的 reversed range，保留原始資料，不自行修正。
- `petskill2.txt` / `skillcode.txt`：前一輪已確認為實際 gameplay variant，endpoint data 優先。

詳細結果另存於：

`data/generated/stoneage_ro0000_singleplayer_core_data_audit.json`



## 2026-10-03 PetSkillShop endpoint 實例閉合

本輪重新利用 RO0000 `data/npc/look.txt` 發現的 `genout/psks_*` 實際 endpoint argument 檔，補上此前未充分利用的寵技商店 evidence。

Fixed-C 的 `npcgen_petskillshop` template 對應 `PetSkillShop` function set；其 runtime 會從 NPC argstr 讀取 `pet_skill`、`skill_rate`，依 endpoint 提供的技能清單建立商店項目並以技能原始 cost × rate 計價。

已直接取得四個與四城主世界相關的 endpoint 實例：

- `psks_1003_18_13`：rate 1.0，skills `0,1,2,3,10,50,200,201,100`
- `psks_2003_18_14`：rate 1.0，skills `0,1,2,3,10,11,200,20,30,31,40,50,51,120,130,150,61,80,90,100,110`
- `psks_3003_16_13`：rate 1.0，skills `0,1,2,3,10,50,200,201`
- `psks_4003_18_15`：rate 1.0，skills `0,1,2,3,10,50,100,200,201`

這些不是 UI 文字，而是實際 NPC argument payload，因此列入單機 pet progression 的 endpoint source layer。不同地點的 skill catalog 保持原樣，不做全域合併。

另外發現：

- `look.txt` 仍列出 `freeshop/*.arg` 舊／特殊寵技商店路徑。
- 直接取得的 `freeshop02.arg` payload 卻是 `pet_skill:652,12,13,151,152,52`，而 `look.txt` 同一路徑目前列示為 `pet_skill:210`。
- 因此這是一個需要保留的 endpoint provenance anomaly；在沒有精確 NPC create → arg admission evidence 前，不把 `freeshop02.arg` 的 652 等資料直接提升為 live binding。

本輪詳細 machine-readable evidence：

`data/generated/stoneage_ro0000_petskill_shop_endpoint_audit.json`
