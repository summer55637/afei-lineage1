# 阿肥石器時代放置版資料工程

這個倉庫目前作為《石器時代 OL》PC / 手機網頁放置版的資料整合與開發工作區。

## 已完成的核心資料層

- 587 個客戶端寵物動畫群組
- 503 個有服務端寵物模板
- 226 個有 Lv1 可捕獲遇敵紀錄的動畫群組
- 清除博物館、家族、副本／測試等特殊 floor 後：
  - **166 個一般野外 Lv1 寵物外觀種**
  - **169 個有效 TempNo**
  - **171 個 EnemyID**
  - **85 個有效 floor**
- 85/85 floor 已建立名稱對照
- group1.txt 出現道具門檻與 battle_event.c 捕獲道具門檻已拆成不同規則層
- E_T_GET 已確認為捕獲公式修正值，負值保留
- Lv1 遇敵率模型已按服務端流程還原：群組權重、怪物權重、生成上限、大型怪限制與 100 次保護迴圈

## 資料來源

主要服務端資料：
- https://github.com/gavinlinasd/StoneAge

客戶端圖像／動畫標籤：
- https://github.com/liuhaoyu9019/StoneAge_imgTool

## 目前目標

先完成可直接給網頁遊戲使用的正式寵物資料庫，再開始做 PC + 手機皆可遊玩的單機放置版前端。

> 注意：AnimationGroupId、TempNo、EnemyID 是三個不同身分層，不能單純依寵物名稱去重。


## 2026-09-24 可玩核心進度

目前已從純資料工程進入第一版可玩原型：

- `game.html`：PC／手機共用遊戲入口
- `game.js`：讀取 166 種正式 Lv1 寵物資料
- 85 個 floor 可切換狩獵
- 自動遭遇／自動戰鬥
- 角色 HP、攻擊、防禦、經驗、升級、石幣
- LocalStorage 單機存檔
- 第一版測試收服與寵物箱
- `index.html` 保留為資料圖鑑／抓寵地圖／驗證頁

目前正式資料驗證仍為：

- Species 166 / 166
- TempNo 169 / 169
- EnemyID 171 / 171
- Floor 85 / 85
- Validation PASS

> 可玩核心中的傷害、戰鬥獎勵與測試收服率屬於放置版第一階段參數；原始服務端的正式資料層沒有被改寫。後續會把玩法規則逐項替換成正式設計。


## V0.2 捕獲與寵物隊伍

已完成第一輪寵物玩法核心：

- 固定 15% 測試收服已移除
- 捕獲率改依原服務端 `BATTLE_CaptureCheck` 結構計算
  - 敵方目前 HP / 最大 HP
  - 玩家與敵方等級差
  - 玩家與敵方敏捷差
  - 寵物模板 `E_T_GET`（資料庫欄位 `captureBase`）
  - 玩家運
  - 玩家魅力
- 捕獲率最高沿用服務端 99% 上限
- 特殊捕獲條件讀取 `captureRule.requiresAllItems`
- 特殊條件道具只在捕獲成功後消耗
- 地圖出現條件讀取 `appearanceInventoryItemIds`
- 捕獲後建立獨立寵物個體，不再只記錄數量
- 5 格寵物隊伍
- 可指定一隻出戰寵物
- 出戰寵物會在角色攻擊後追加一次攻擊
- 舊 V0.1 LocalStorage 寵物數量存檔會自動轉成 V0.2 個體格式
- 自動捕獲會在野生寵物 HP ≤ 20% 時開始嘗試

目前角色的敏捷／魅力／運仍是放置版暫定初始參數；公式結構與寵物資料來源則直接依服務端與正式資料庫。


## V0.3 條件道具背包

已從 166 種一般野外 Lv1 正式資料庫反向整理出 9 種會影響「出現」或「捕獲」的條件道具：

- 出現條件與捕獲條件分開保存
- 背包數量進入 LocalStorage 存檔
- 地圖路線會依出現條件道具即時鎖定／解鎖
- 捕獲特殊寵物會檢查指定條件道具
- 捕獲成功後才消耗捕獲條件道具
- 新增 `data/generated/capture_items.json`
- 遊戲介面新增條件道具背包，可看到道具 ID、用途、關聯寵物與 floor
- 正式取得來源尚未解出的項目明確標示「正式來源待解」
- 暫時提供「開發測試補給：每種 +1」，只用於驗證特殊寵物與地圖條件，不視為正式遊戲取得方式

原始服務端的 `itemset6.txt` 為舊編碼大型資料檔，目前 GitHub 連接器無法可靠解出其中的中文與取得來源，因此未臆造 NPC／商店／任務來源。


## V0.4 正式道具來源研究

已將原 NPC／事件腳本中可確認的取得來源寫回 `data/generated/capture_items.json`，不再只保存「需要什麼道具」。

目前 9 種條件道具中已有 3 種正式來源確認：

- `19720 草食性飼料一號`
  - 原腳本：`gmsv/data/npc/eden1/zoo1/barrel82_01`
  - 條件：`ENDEV=81 & NOWEV=82`
  - 取得：`GetItem:19720`
- `19733 雷爾胖專用飼料`
  - 原腳本：`gmsv/data/npc/eden1/zoo1/employee82_01`
  - 條件：`ENDEV=81 & NOWEV=82`
  - 取得：`GetItem:19733`
  - 找到雷爾胖後腳本會 `DelItem:19733`
- `20259 會員捕寵結晶石`
  - 原腳本：`gmsv/data/npc/my/chongwu/vip.arg`
  - VIP 會員限定
  - 費用：100000 石幣
  - 材料：21885、20636、20637、20638、20639、20640、20641 各 1
  - 取得：`GetRandItem:20259`

遊戲背包介面現在會直接區分「正式來源已確認」與「正式來源待解」，並顯示已確認來源摘要。

尚未確認來源：1690、1691、1692、12636、13062、20247。


### V0.4 來源研究追加

新增確認兩種海藍裝備來源：

- `1690 海藍之棒`
  - 來源：加魯卡野生威威系怪物掉落
  - `enemy.txt`：EnemyID 372 / 373 / 374，掉落參數 30
  - `group.txt`：群組 229 / 230 / 231 / 232 / 233
  - `encount.txt`：Floor 200（加魯卡）
  - Lv1 威威群組已包含此掉落來源
- `1691 海藍之兜`
  - 來源：加魯卡較高等級威威系怪物掉落
  - `enemy.txt`：EnemyID 436，掉落參數 30
  - `group.txt`：群組 311 / 313
  - `encount.txt`：Floor 200（加魯卡）

目前 9 種條件道具已有 **5 種正式來源確認**。


### V0.4 來源研究追加（二）

新增確認：

- `13062 精靈的羽毛`
  - 服務端：`gmsv/src/item/item_event.c`
  - `ITEM_useMaxRedSocks` 的聖誕紅襪隨機獎勵池直接包含 `13062`
  - 因此正式來源進度由 5/9 提升為 **6/9**
  - 目前只把它記為「可確認來源之一」，不宣稱是唯一取得方式

另外三項加入外部歷史資料交叉證據，但**不提升為 server verified**：

- `12636 香噴噴麵包`：舊料理資料記載配方為橡樹果2＋炭2
- `1692 海藍之鎧`：歷史資料確認屬海藍全套，早期取得方式包含官方包／來吉卡
- `20247 魔法鑽戒[地LV3-1]`：歷史攻略與服務端捕獲限制都確認為嘎吱拉必要條件，但製作來源仍待舊編碼資料解出

資料層現在明確拆成：
- `sourceStatus=verified`：原服務端程式／資料直接證實
- `externalEvidence`：外部歷史資料交叉確認，永遠不自動升格為正式來源


## V0.5 服務端掉落實裝

已確認服務端 `_FIX_ITEMPROB` 為開啟狀態。原始 `enemy.c` 掉落判定：

`RAND(0,999) < ENEMY_ITEMPROB`

因此：

- 掉落參數 `30` = **3%**
- `1690 海藍之棒`
  - Lv1 威威 EnemyID 372 已存在目前一般野外 Lv1 資料
  - 現在擊敗對應威威後會依服務端規則以 3% 機率掉落
- `1691 海藍之兜`
  - EnemyID 436 同樣為 3%
  - 但屬較高等級威威，目前 Lv1 放置版尚未開放，因此只保留正式來源資料，等高等內容接入後自動可用

遊戲掉落改為從 `capture_items.json -> sources[type=enemy_drop]` 資料驅動，不把個別物品 ID 寫死在戰鬥函式內。


## V0.6 伊甸動物園任務

新增 `data/generated/zoo_quest.json`，把原服務端 Event 81 / 82 / 83 的已驗證規則獨立資料化。

目前正式接入：

- Event 81
  - 服務端 `npc_eventaction.c` 明確標示事件 81 = 金飛任務
  - 已由 `eden1/init/eden81*` 與 `event81_*f.arg` 重建正式核心流程
  - 起點：角色必須 `LV>80`（即 Lv81+）且 `ENDEV=4`
  - 打工名人克拉克給 Item 19696 推薦函
  - 霍特雷敦收 19696、給 Item 19697 飛龍捕捉證明書
  - 可交付帖拉格恩 271／洛卡倫恩 272／加寶格恩 273／朵拉比斯 274 任一隻
  - 交付後正式進入 `NOWEV=81`
  - Floor 5576：PC團盜賊金剛陣三層，EnemyID 1704
  - Floor 5582：PC團老大 EnemyID 1705；原編成為老大×1＋盜賊×9
  - 戰後老大給 Item 19698 悔過書
  - 回霍特雷敦取得 Item 19699 研究報告並正式 `EndSetFlg:81`
  - 完成後飛龍航空路線需要 10,000 石幣；可前往伊甸
  - Floor 7016 飛龍總教練布魯斯收 19699，正式給 200,000 石幣
  - 舊「開發測試：完成 Event 81」按鈕與 handler 已移除
- Event 82
  - 原腳本：`eden1/zoo1/manager82_01`
  - 前置：Event 81 完成
  - 目標：
    - 雷爾胖 TempNo 905 / EnemyID 1798
    - 波波頓 TempNo 786 / EnemyID 1762
    - 動物園養的拉斯基 TempNo 854 / EnemyID 1733
  - 園長獎勵 `GetPet:1563` 已確認為 EnemyID 1563 → TempNo 730 布伊胖
- 正式飼料 NPC
  - 19720～19725 六個飼料桶
  - 19733 雷爾胖專用飼料由布伊太郎給予
- 任務狩獵區
  - 雷爾胖：Encounter 778 / Group 927 / 19733
    - 加入 EnemyID 1741 / TempNo 855 不可捕獲布伊胖作為原群組干擾
    - 雷爾胖採已重建的 2.960298802% 戰鬥出現率
  - 波波頓：Encounter 780 / Group 942 / 19723
    - Group 942 只有可捕獲波波頓 EnemyID 1762
    - 同 encounter 其他飼料群組會依道具條件排除
- 捕獲後任務面板會自動檢查 TempNo 905 / 786 / 854
- 雷爾胖回報時依 `employee82_01` 收回 19733
- 波波頓可向飼育員確認 Lv1 個體

Event 83 已確認：

- `zoo2/event83a.create` 為拉斯基後半任務
- 地下入口：`event83_17`
- 席格戰鬥：Floor 60044 / `event83_18.arg`
- 戰後席格：Floor 60045 / `event83_19`
- `GetPet:1733` → EnemyID 1733 → TempNo 854「動物園養的拉斯基」
- `19714` 由里拉拉物品鏈正式產出

完整 Event 83 物品鏈與 Event 71 前置仍未開放，因此 V0.6 不會用假按鈕冒充正式拉斯基取得流程。


## 2026-09-24 資料版本修正

重新核對 `gmsv/setup.cf` 後確認目前服務端實際載入：

- `enemyfile=./data/enemy1.txt`
- `enemybasefile=./data/enemybase1.txt`
- `groupfile=./data/group1.txt`
- `encountfile=./data/encount.txt`

因此先前用舊 `enemy.txt` 推導的兩個來源必須撤回：

- `1690 海藍之棒`：舊 enemy.txt 曾掛在威威掉落，但現行 enemy1.txt 的同一批威威 EnemyID 372/373/374 掉落 Item 1234，參數 300（30%）
- `1691 海藍之兜`：舊 enemy.txt 曾掛在高等威威掉落，但現行 enemy1.txt 的 EnemyID 436 掉落 Item 1235，參數 300（30%）

所以 1690／1691 不再標記為現行 server verified，也不再由遊戲戰鬥掉落。
正式來源數由 6/9 修正為 **4/9**（19720、19733、20259、13062）。

後續所有怪物／群組掉落研究以 setup.cf 實際載入檔為準。


## V0.7 Event83 拉斯基支線

本輪先修正資料版本基準：`setup.cf` 實際載入 `enemy1.txt / enemybase1.txt / group1.txt / encount.txt`，所以所有 Event83 掉落與遇敵都以現行表為準。

Event83 已接入可玩核心：

- 前置仍要求 Event81 完成、Event82 進行中、Event71 進行中、Item 2414
- Event71／2414 的一鍵開發前置已移除；目前改走原服務端可追溯流程
- 園丁借鏟子：19701
- 白蘿蔔採集：
  - 19702：90%
  - 19703：10%
- 柯奧 Floor 1100 特產品商店 `genout/ss_1100_59_49` 正式貨架包含 12093
  - 25 石幣售價來自歷史價目交叉資料，並非 itemset6 直接解碼
- 園丁：12093 + 19703 → 19704
- 里拉拉：19704 依序推進至 19711
- 19716 項圈：
  - EnemyID 1792
  - Group 966 / Encounter 809 / Floor 7000
  - 需要 19711 才出現
  - enemy1.txt 掉落參數 50 → 5%
- 19717 怪衣：
  - EnemyID 1793
  - Group 965 / Encounter 808 / Floor 7000
  - 需要 19713 才出現
  - enemy1.txt 掉落參數 50 → 5%
- 19718 黑旗：
  - EnemyID 1788
  - Group 962 / 地下 Floor 60041～60043
  - enemy1.txt 掉落參數 100 → 10%
  - group1.txt 設定 NOTAPPEARBYITEM=19718，拿到旗後該群組停止出現
- 席格：
  - Floor 60044
  - `event83_18.arg` 要求 `item:19718`
  - `steal:1`，因此開戰收掉黑旗
  - 原編成：席格×1、不良少年B×4、凶悍格爾希洛×5
  - V0.11 起已改成真正 10 人 formation，不再以席格單體代表整隊；原編成完整保存在資料層
- 席格戰後：
  - `event83_19` → `GetPet:1733`
  - EnemyID 1733 → TempNo 854「動物園養的拉斯基」
  - Event83 完成
- 之後可帶 854 完成 Event82，園長仍依原腳本給 TempNo 730 布伊胖

另外已將開發測試補給限制回「原 9 種特殊出現／捕獲條件道具」，不再直接灌入 Event83 任務物品。


### V0.7 Event71＋Item2414 正式前置

- Item 2414 已解出正式名稱與來源：**不可思議的貝殼**
  - Event 2 日美子先給 Item 2415
  - 彌生腳本正式執行 `DelItem:2415`、`GetItem:2414`、`EndSetFlg:2`
- Event 4 成人式已正式接入，不再壓縮略過：
  - NPC 位置：Floor 10204
  - 「儀式的審判」以 EventNo 4 / TYPE:REQUEST 開始成人禮
  - 「儀式審判的差使」在 NOWEV=4 且未持有 2417 時正式給 `GetItem:2417*15`
  - 原對話把 Item 2417 稱為「儀玉」
  - 交回 15 個 2417 後，審判腳本執行 `DelItem:2417*15`、`GetItem:2418`、`EndSetFlg:4`
  - Item 2418 的 ID 與用途已確認，但現行來源內尚未解出精確正式物品名稱
  - Event69 起點 `event69_3` 明確要求 `ENDEV=4`，現在遊戲也會照此阻擋
- Event69／70 精靈少女前傳已從精簡前置拆成正式核心流程：
  - 願藏祖父在 `ENDEV=4` 後開 Event69
  - 庫伊爺爺給發亮護身符 19621
  - 卡卡金寶收走 19621，放行進 Floor 30601 蛙洞
  - Floor 30602 新藏給金珠 19622
  - Floor 30605 里昂蛙王戰依 `event69_5.arg` 實裝；V0.11 起真正生成 EnemyID 1685 ×1 + 1681 ×9
  - 戰後 Floor 30607 交回 19622，蛙王給黑玉 19623
  - 回新藏以 19623 開 Event70，再由新藏正式 `EndSetFlg:69`
  - 願藏祖母正式 `GetPet:1479`、`GetItem:19624`、`EndSetFlg:70`
  - 19621／19622／19623／19624 的用途與語意名稱都已由原 NPC 對話／腳本確認
- 願藏祖母的原腳本會交付 EnemyID 1479；服務端程式已確認它對應瑪蕾菲雅 TempNo 718
- `npc_transmigration.c` 的正式寵物轉生檢查已確認：
  - 玩家 Lv80+
  - Event 4、69、70 已完成
  - 唯一一隻瑪蕾菲雅 TempNo 718 且 Lv79
  - 接受祝福的目標寵物 Lv80+
- 轉生成功後原程式直接執行 `NPC_NowEventSetFlg(toindex, 71)`
- 因此 Event83 繼續嚴格檢查 **NOWEV=71**，不會誤寫成 ENDEV=71
- Floor 40 封印迷宮水池與密語「地為界水為憑火為引風為信」也已由 `event69_alpha.create`＋`event69_9` 確認
- 放置版目前讓一般出戰寵物可隨戰鬥累積 EXP 到 Lv80+，作為正式轉寵目標
- 瑪蕾菲雅回憶巡禮已改為逐段可玩，不再直接給 Lv79：
  - EnemyID 1479／TempNo 718 依現行 `enemy1.txt` 從 Lv1 開始
  - 出戰戰鬥可累積 EXP；本放置版在每個原始 EVENTRUN 等級點暫停，完成回憶後才開放下一段
  - 14 個來源節點依 `ptalk01.arg`：Lv10/Floor1000 → Lv15/1400 → Lv20/1200 → Lv25/5542 → Lv30/4000 → Lv35/20301 → Lv40/3300 → Lv45/21201 → Lv50/20105 → Lv55/6000 → Lv60/31901 → Lv65/30703 → Lv70/31201 → Lv75/40
  - Floor 30703 的 Lv65 EVENTRUN7 依原腳本額外給 Item 19688 ×3
  - Floor 40 完成後開放至 Lv79；Lv79 再觸發 EVENTRUN2 的「拯救精靈王」使命對話，之後才允許寵物轉生並設 NOWEV=71
  - 舊版已經被精簡流程直接給到 Lv79 的存檔會自動遷移為「14 段回憶已完成」，避免破壞既有進度


## V0.8 Event81 金飛航空正式流程

- 新增 Event81 獨立存檔狀態，schema 升為 9
- 單純按過舊 Event81 測試旗標、但尚未進入 Event82／83 的舊存檔，會清回正式 Event81 流程
- 已經開始 Event82／83 的舊存檔會保留 Event81 完成狀態，避免既有進度倒退
- 現行一般 Lv1 資料已確認可直接捕捉 **加寶格恩 TempNo 273**（Floor 30702），因此 Event81 不需要再灌測試寵物
- PC團三層與老大戰都接入現有戰鬥核心；V0.10 起不再以單體代表多人編成，改為真正生成所有敵方成員
- V0.9 起不再用「固定三連戰」近似：金剛陣改用原 `event81_6f/7f/8f.arg` 的亂數 WARP 候選表
- Event81 戰鬥地圖同時使用 quest stage、Floor 與 maze X 座標鎖定，未到正確位置不會生成對應敵人
- 原 `eden81_2` 標準完成分支會給 19699 並 `EndSetFlg:81`，但未寫 `DelItem:19698`；放置版保留此原始腳本行為
- 飛龍航空也保留原始禁運道具 2402～2413 與 10,000 石幣旅費檢查


## V0.9 Event81 金剛陣亂數傳送＋飛龍航空路線

- 存檔 schema 升為 **10**
- Event81 金剛陣新增持久化座標：
  - `mazeFloor`
  - `mazeX`
  - `mazeY`
  - `mazeBattles`
- 入口以 Floor 5576 `(24,86)` 作為第一區起點
- 第一區（x=24）直接使用 `event81_6f.arg` 的 10 個 WARP 候選：
  - 2 個結果送到 x=28
  - 其餘留在第一區
  - 前進率 **2/10**
- 第二區（x=28）直接使用 `event81_7f.arg` 的 11 個 WARP 候選：
  - 2 個結果送到 x=32
  - 2 個結果退回 x=24
  - 其餘留在第二區
  - 前進率 **2/11**
- 第三區（x=32）直接使用 `event81_8f.arg` 的 11 個 WARP 候選：
  - 唯一一個 `5582,33,87` 結果進 PC團老大區
  - 2 個結果退回 x=28
  - 其餘留在第三區
  - 進老大區機率 **1/11**
- 老大戰勝利後依 `event81_3f.arg` 固定記錄到 Floor 5580 `(58,20)`
- V0.8 舊存檔如果已經停在「第一／第二／第三區或老大前」，V0.9 會自動轉成對應的原始座標，不需要重跑 Event81
- 飛龍航空三名 NPC 的三條 `routeto1` 已全部保存：
  - 1 號線：17 個座標節點
  - 2 號線：17 個座標節點
  - 3 號線：18 個座標節點
- 三條路線都保留原腳本：
  - `needstone:10000`
  - 禁運道具 2402～2413
  - 波拉 → 伊甸園的 Floor 5579 / 5540 / 5561 / 5581 / 7000 路徑
- 玩家現在可以直接選 1／2／3 號線；存檔會記錄實際搭乘路線與完整 waypoint

## V0.10 真正多敵人任務戰鬥

- 一般 Lv1 野怪與捕捉公式維持原本單敵人流程，不改變既有抓寵資料與操作
- 任務資料只要提供 `formation` 就會啟用多敵人模式
- Event81 金剛陣三區正式編成：
  - EnemyID 1704 / TempNo 714 PC團盜賊 ×2
  - 每隻獨立 HP、等級、攻擊、防禦
- Event81 Floor 5582 老大戰正式編成：
  - EnemyID 1705 / TempNo 713 PC團老大 ×1（Lv100）
  - EnemyID 1704 / TempNo 714 PC團盜賊 ×9（Lv70～75）
- 玩家每回合攻擊第一個存活敵人；出戰寵物追擊時會鎖定當下第一個存活敵人
- 每名仍存活的敵人都會獨立計算一次反擊傷害
- 為避免 10 人編成在手機上一回合寫入 10 次日誌，實際傷害仍逐隻計算，但 UI 日誌合併為一筆「N 名敵人合計傷害」
- 多敵人任務編成整隊不可捕獲；捕獲按鈕會自動停用
- 只有整個 formation 全滅後才會：
  - 計算整場勝利
  - 觸發 Event81 原始亂數 WARP
  - 或老大戰後固定傳送到 Floor 5580 `(58,20)`
- 戰鬥畫面會逐隻顯示敵人 HP；倒下的成員保留在編成列表並降低透明度
- 任務編成的 EXP / 石幣目前依敵方實際人數乘算，單體野怪獎勵不變

## V0.11 Event69／83 真正 Boss 編成

- Event69 里昂蛙王戰已套用 V0.10 多敵人核心：
  - 黑蛙王 EnemyID 1685 / TempNo 842 ×1，Lv90
  - 黑蛙 EnemyID 1681 / TempNo 841 ×9，Lv50
  - 兩者四圍與等級皆直接取自現行 `enemy1.txt / enemybase1.txt`
  - 必須 10 隻全滅後才會進入戰後 Floor 30607 流程
- Event83 席格戰已套用真正 10 人編成：
  - 席格 EnemyID 1791 / TempNo 900 ×1，Lv70～80
  - 不良少年B EnemyID 1789 / TempNo 898 ×4，Lv70～80
  - 凶悍格爾希洛 EnemyID 1787 / TempNo 897 ×5，Lv70～80
  - `19718` 黑旗仍依原 `steal:1` 在開戰前消耗
  - 必須 10 隻全滅後才會觸發 `event83-complete` 並取得任務版拉斯基
- 一般 Lv1 野怪仍不使用 `formation`，所以既有抓寵流程與捕獲率不受影響
- Event81／69／83 三類多人任務現在都共用同一套 formation 戰鬥核心

## V0.12 Event82／83 原始 ENCOUNT／GROUP 動態群組

- 這一版開始區分兩種多人戰：
  - `formation`：Boss／固定編成，成員與數量固定
  - `dynamicFormation`：一般 ENCOUNT／GROUP，先決定本戰人數，再按 Group 權重逐隻生成
- 動態群組生成直接對齊 `gmsv/src/char/enemy.c::ENEMY_getEnemy()` 的核心規則：
  - 先由 encounter 的 `enemymaxnum` 與各 Enemy 的 `CREATEMAXNUM` 決定本戰最大可生成數
  - 實際本戰人數為 `RAND(1, enemyentrymax)`
  - 每一格再按 `group1.txt` 的 `CREATEPROB` 權重抽 EnemyID
  - 若某 Enemy 已達自己的 `CREATEMAXNUM`，該次抽選作廢並重抽
- Event82 雷爾胖：Encounter 778 / Group 927
  - 布伊胖 EnemyID 1741：權重 99、CREATEMAX 5
  - 雷爾胖 EnemyID 1798：權重 1、CREATEMAX 5
  - 本戰人數 1～5
  - 至少出現一隻雷爾胖的理論戰鬥機率約 **2.960298802%**，與先前重建值一致
- Event82 波波頓：Encounter 780 / Group 942
  - EnemyID 1762 唯一成員
  - encounter enemymax=10，但 EnemyID1762 的 CREATEMAX=5，所以實際每戰 1～5 隻
- Event83 項圈：Encounter 809 / Group 966
  - EnemyID1792 每戰 1～10 隻
  - 每一隻各自以 5% 判定掉落 19716
- Event83 怪衣：Encounter 808 / Group 965
  - EnemyID1793 每戰 1～5 隻
  - 每一隻各自以 5% 判定掉落 19717
- Event83 地下 Encounter 806：
  - Group962／963／964 的 encounter 權重都是 10，因此符合條件時先以相同權重選組
  - Group962：不良少年A EnemyID1788 權重10、不良少年B EnemyID1789 權重20；兩者各 CREATEMAX 5
  - Group962 在持有 19718 後依 `NOTAPPEARBYITEM=19718` 停止出現
  - Group963：凶悍格爾希洛 EnemyID1787，CREATEMAX 5
  - Group964：不良少年B EnemyID1789，CREATEMAX 5
- 動態群戰現在支援捕獲：
  - 只針對目前第一個存活目標判定
  - 目標可捕獲時，捕獲成功後只移除該成員，其他敵人繼續戰鬥
  - 固定 Boss formation 仍維持整隊不可捕獲
- 動態群組的任務掉落改為逐隻判定；若同一戰生成多隻 1792／1793／1788，每一隻都依自己的 5%／5%／10% 機率獨立判定
- 一般 166 組野外 Lv1 資料尚未全面切到 dynamicFormation；V0.12 先套 Event82／83 已驗證任務區，避免一次改動所有抓寵區


## V0.13 一般野外 Lv1 ENCOUNT／GROUP 動態群戰

- 166 個一般野外 Lv1 外觀種仍維持原正式資料範圍，不把清洗時排除的特殊 floor 加回來。
- 現行資料實際包含：
  - 190 條 Lv1 抓寵 route
  - 164 個唯一 GroupID
  - 198 條 route → Group 關係
  - 176 個唯一 Encounter → Group 組合
  - 318 個 Group 成員 Enemy 模板
- 164 個 Group 全部重新直接讀取現行 `gmsv/data/group1.txt`：
  - EnemyID
  - `CREATEPROB` 權重
  - 出現道具／禁止出現道具條件
- 每個 Group 成員再由現行 `enemy1.txt + enemybase1.txt` 補齊：
  - TempNo
  - Lv 範圍
  - `CREATEMAXNUM`
  - 可捕獲旗標
  - 四圍、屬性、E_T_GET、動畫群組
- 一般野外戰鬥不再把 route 代表寵物直接生成成單體；現在會：
  1. 依該 route 對應的原 Encounter Group 權重選 Group
  2. 依 `enemyMax` 與各成員 `CREATEMAXNUM` 決定本戰最大人數
  3. 亂數決定本戰人數
  4. 依 Group 的 `CREATEPROB` 逐隻抽 Enemy
  5. 超過該 Enemy 的 `CREATEMAXNUM` 時重抽
- 一般野外 dynamicFormation 與 Event82／83 共用同一套多人戰核心：
  - 每個存活敵人都會反擊
  - 目前第一個存活目標可依原捕獲條件逐隻捕獲
  - 捕獲成功後只移除該成員，其餘敵人照常反擊並繼續戰鬥
  - 掉落按實際擊敗的 Enemy 逐隻判定
- 批量驗證結果：164/164 Group、318/318 成員都能對到現行服務端資料，缺 Group / Enemy / EnemyBase / 空群組皆為 0。


## V0.14 Floor → Encounter → Group → Enemy

- V0.13 已完成 Group → Enemy 動態群戰；V0.14 再把外層 route 抽選拿掉。
- 原服務端遇敵順序重新核對 `encount.c + enemy.c`：
  1. 角色座標先命中 Encounter 矩形。
  2. Encounter 矩形重疊時，以較高 `zorder` 為有效區域。
  3. 該 Encounter 依 Group 權重抽一個可出現 Group。
  4. Group 再依 `CREATEPROB`、`CREATEMAXNUM`、`enemyMax` 生成敵方整隊。
- 放置版沒有原地圖逐格行走座標，因此 V0.14 改為讓玩家直接選擇 Encounter 狩獵區：
  - 顯示 EncounterID
  - 顯示 X / Y 原始矩形範圍
  - 顯示 `enemyMax`
  - 不再用「某隻寵物的 battleAppearanceChance」當作選戰鬥權重
- 166 種一般 Lv1 清洗資料共對應：
  - 85 個 Floor
  - 161 個唯一 Encounter
  - 520 個 Encounter → GroupID 引用
- 現行 `group1.txt` 可解析其中 **506 個 GroupID**，合計 **865 個 Enemy 成員模板**。
- `encount.txt` 另有 14 個 GroupID 在現行 `group1.txt` 找不到：
  - 791、794、795、796、799、802、804、808、809、824、826、827、1230、1327
- 這 14 個只標記為 unresolved；遊戲生成時排除，不使用舊 `group.txt` 或其他版本補造。
- 原 164 個 Lv1 目標 Group 全部仍可解析，缺失數為 0。
- Event82／83 任務區仍使用已驗證的任務 dynamicFormation，不受一般野外 Encounter 選擇器影響。


## V0.15 zorder／大型怪／100 次生成保護

- 新增 `data/generated/stoneage_general_encounter_runtime.json`，專門保存一般 Lv1 所在 85 個 Floor 的完整遇敵 runtime。
- 不是只保存 161 個 Lv1 目標 Encounter，而是把這 85 個 Floor 上的 **479 個 Encounter** 全部納入 zorder 判定。
- 共引用 728 個 GroupID：
  - 705 個可由現行 `group1.txt` 解析
  - 23 個為現行 `encount.txt` 的失聯 Group 引用，維持 unresolved，不從舊檔補造
- 705 個 Group 共整理 **1165 個 Enemy 成員模板**。
- 其中現行資料發現 1 個不完整成員：
  - Group 1297
  - EnemyID 2455
  - TempNo 145
  - `enemybase1.txt` 無 TempNo 145
  - runtime 保留其 Group 權重與 Enemy 欄位，但標記 `validTemplate=false`；抽中時不生成，並照原流程消耗一次 100 次保護迴圈。
- `E_T_SIZE` 已依 `enemy.h` 與 `enemybase1.txt` 對齊：
  - CSV 整數欄位 38
  - 0 = normal
  - 1 = big
- `buildDynamicFormation()` 現在依原 `ENEMY_getEnemy()` 還原：
  - `entrymax = RAND(1, min(enemyMax, sum(CREATEMAXNUM)))`
  - 每個 Enemy 受自身 `CREATEMAXNUM` 限制
  - 大型怪最多 5 隻
  - 第 6 隻大型怪被抽到時，會縮減本戰目標人數
  - 大型怪若在第 6 格以後生成，會依原碼與前 5 格普通怪交換位置
  - 整個生成迴圈最多 **100 次**
- Encounter 選擇改為原 `ENCOUNT_getEncountAreaArray()` 邏輯：
  - 每戰先在玩家選定的 Encounter 矩形內隨機取得一個漫遊座標
  - 掃描該 Floor 全部 Encounter
  - 只接受 `zorder > 0`
  - 多個矩形重疊時取較高 zorder
  - zorder 相同時保留原 `encount.txt` 較早出現的那一列
- 另發現 Group 125（`sai_n_013_9/11`）雖存在於現行 `group1.txt`，但唯一 EnemyID 161 沒有正值 `CREATEPROB`；runtime 保留原資料，遊戲抽 Group 時把這種「無有效生成權重」群組視為不可用，避免產生空戰鬥。\n- 戰鬥畫面現在會顯示實際命中的 Encounter、Group 與漫遊座標；大型怪會標示「大型」。


## V0.16 RandomEnemy／samecount／CEP 遇敵節奏

### ENEMY_RandomEnemyArray

原 `enemy.c` 的特殊 EnemyID：

- 945～956
- 964～969

不是最終怪物，而是「本場建立 Group slot 時先隨機替換」的 placeholder。

V0.16 已完整資料化原 18 個 placeholder 對應池，合計 **92 個唯一替代 EnemyID**。替代方式依原碼：

1. Group slot 先讀原 EnemyID。
2. 若命中 RandomEnemy placeholder，從該 placeholder 的固定陣列等機率抽 1 個 EnemyID。
3. 此 slot 在本場後續生成期間固定使用該替代結果，不會每生成一隻重新抽。
4. Group 原本的 `CREATEPROB` 權重不變；`CREATEMAXNUM`、大小、等級與模板資料改用替代後 Enemy。

目前 85 個一般 Lv1 Floor 的 705 個可解析 Group 本身沒有引用 945～956／964～969，因此一般 Lv1 當前內容不會突然換怪；引擎與資料已先完整接好，未來接入 Group 424～429 等區域時會直接生效。

### samecount × CREATEMAXNUM

原 `ENEMY_getEnemy()` 在 RandomEnemy 替換後，會計算有幾個 Group slot 指向同一個 Enemy array：

`實際上限 = ENEMY_CREATEMAXNUM × samecount`

V0.16 已改成相同規則。這也處理了未來兩個 RandomEnemy slot 剛好抽到同一 EnemyID 時的上限倍率。

另外修正一個 V0.15 還沒完全對齊的細節：

- Group 中 **權重為 0 但 Enemy 有效**的 slot，原碼仍會加入 `createenemynum`
- 它不會被權重抽中，但可能拉高 `entrymax`
- 若因此抽到超過可實際填滿的數量，最後由原版 **100 次 loop guard** 截斷

因此 runtime v2 現在保存完整 **1167 個 Group slot**，不再只保存正權重成員。

### CEP 走路遇敵

原 `char_walk.c` 的一般野外遇敵不是固定每次直接開戰，而是每走一步：

`rand() % 120 < CEP`

流程：

1. 先把 CEP clamp 到目前 Encounter 的 `encounterMin / encounterMax`
2. 若 `rand()%120 < CEP`：
   - 觸發遇敵
   - CEP 重設為 `encounterMin`
3. 若沒遇敵：
   - CEP 未到 max 時 +1
4. 下一步重複

V0.16 已正式接入此狀態機。

放置版沒有原客戶端實際走路封包速度，因此**只還原每一步的機率演算法，不宣稱牆鐘時間等同原版**。目前轉譯參數：

- 原戰鬥 tick 維持 900ms
- 沒有戰鬥時，每個 tick 模擬 **3 個虛擬走路步驟**
- 即約 300ms / 虛擬步，只是放置版節奏參數，不是服務端資料常數
- UI 會顯示目前 CEP、min/max、累積虛擬步數
- 真正觸發戰鬥時會顯示該次 `CEP / Roll`

任務固定戰鬥區（Event81／82／83）不走 CEP，仍維持任務按鈕／固定狩獵區立即生成，避免把 NPC／腳本戰鬥錯套成一般走路遇敵。


## V0.17 ENEMY_createEnemy／RandomChange／原衍生能力

### enemybase1 的真正整數解析

重新核對 `ENEMYTEMP_initEnemy()` 後確認：`enemybase1.txt` 的整數欄位全部經 `atoi()` 載入。

因此像：

`E_T_LVUPPOINT = "4.50"`

服務端實際得到的是：

`4`

不是 4.5。

V0.17 runtime v3 因此同時保留：

- `sourceLvUpPointText`：原始文字
- `serverLvUpPoint`：依 C `atoi()` 真正進服務端記憶體的整數
- `serverInitNum`
- 原七格 PetSkill
- Enemy Style

### ENEMY_createEnemy 四圍生成

一般野怪每一個 Enemy instance 現在依原 `enemy.c`：

1. VITAL / STR / TGH / DEX 各自先加 `RAND(0,4)-2`
2. 保存該階段的 allocation seed
3. 再做 10 次 `RAND(0,3)`
4. 每次把 1 點加到四圍其中一項

也就是每一隻同 EnemyID、同等級的野怪，能力不再完全相同。

之後套原式：

`factor = (level - 1) * atoi(E_T_LVUPPOINT) + E_T_INITNUM`

`CHAR_VITAL = factor * rolledVital`

`CHAR_STR = factor * rolledStr`

`CHAR_TOUGH = factor * rolledTgh`

`CHAR_DEX = factor * rolledDex`

### CHAR_complianceParameter 衍生值

V0.17 一般野怪的 HP／攻／防／敏改用原 `CHAR_initcharWorkInt()`：

`Attack = trunc(STR*0.01 + TOUGH*0.001 + VITAL*0.001 + DEX*0.0005)`

`Defense = trunc(TOUGH*0.01 + STR*0.001 + VITAL*0.001 + DEX*0.0005)`

`Quick = trunc(DEX*0.01)`

`MaxHP = trunc((VITAL*4 + STR + TOUGH + DEX) * 0.01)`

其中 trunc 對應 C 寫入 int 的截斷行為。

這套 server derived 數值只套在有完整 `enemy1 + enemybase1` template 的 dynamicFormation Enemy；Event81／82／83 等手工任務編成若沒有完整 server create 欄位，仍保留既有安全估算，避免把任務測試流程一起打壞。

### ENEMY_RandomChange

`ENEMY_RandomChange()` 與 V0.16 的 `ENEMY_RandomEnemyArray()` 是兩套不同機制。

RandomEnemyArray：
- 先把 placeholder EnemyID 換成真正 EnemyID。

RandomChange：
- Enemy instance 建立完成後再改它的外觀／屬性／技能設定。
- 不再更換 EnemyID。

人型範圍：
- 564～580
- 739～750
- 895～906

會：
- 從 48 個 `gymbody` sprite symbol 隨機選外觀
- 重骰四屬性，且保持 Earth/Fire、Water/Wind 對向
- 從 9 種道場武器類型隨機選擇
- 依武器決定前兩格為普通攻擊，或使用 `EnemyGymSkill` 隨機池

寵物型範圍：
- 655～720
- 859～894
- 907～940

會：
- 把前兩格技能改為 `EnemyGymSkill` 隨機池

已確認固定核心 EnemyGymSkill 至少包含：
`3,10,11,12,30,31,40,41,50,51,52,60,61,80,90,100,110,150,151,152`

其餘成員受 C 編譯 feature flag 控制。由於目前網頁戰鬥尚未完整實作原 PetSkill 系統，V0.17 **只保留並顯示 RandomChange 技能規則 metadata，不偽造技能傷害效果**。

目前 85 個一般 Lv1 Floor 的 705 個 Group 直接 RandomChange slot 數仍為 **0**；但 V0.16 的 92 個 RandomEnemy 替代目標全部會命中 RandomChange：
- 24 個人型
- 68 個寵物型

因此未來接入 Group 424～429 等含 RandomEnemy placeholder 的區域時，兩層規則可以直接串起來。


### Encounter 兩角座標正規化修正

V0.17 回歸時重新核對 `ENCOUNT_initEncount()`，確認 `encount.txt` 第 3～6 欄是：

`x1, y1, x2, y2`

服務端不假設第二個角一定比較大，而是：

- `rect.x = min(x1,x2)`
- `rect.width = max(x1,x2)-min(x1,x2)`
- `rect.y = min(y1,y2)`
- `rect.height = max(y1,y2)-min(y1,y2)`

再由 `PointInRect()` 做 inclusive 邊界判定。

先前 V0.14～V0.16 runtime 直接把第 1 角當 min、第 2 角當 max；V0.17 已修正。

85 個一般 Lv1 Floor 的 479 個 Encounter 中：

- 35 列原始角點至少有一軸反向
- 其中 15 列就是 161 個 Lv1 目標 Encounter

修正後重新跑 16,100 次目標區座標／zorder 驗證：

- zorder 判定錯誤：0
- 由重疊區切換到其他有效 Encounter：820 次
- 同 zorder 保留原檔較早資料列
- 抽樣可實際成為 winner 的 Encounter：198 個
- 其中無可生成 Group 的 winner：0

另外，部分特殊 Enemy（例如木、礦石、釣竿）原始 STR／TGH／DEX 可為 0；經 `RAND(0,4)-2` 後，原服務端衍生攻防確實可能暫時為負值。V0.17 不擅自 clamp 模板衍生值；現有網頁戰鬥層仍以最低實際傷害 1 處理。


## V0.18 ENEMY_ITEM1～10／ITEMPROB1～10 原版掉落生成

V0.18 繼續沿用目前完整鏈：

`Floor → Encounter → Group → Enemy → RandomEnemy → ENEMY_createEnemy → RandomChange → CHAR_complianceParameter`

這一版把 `enemy1.txt` 的 10 組 Enemy 掉落欄位正式接入：

- `ENEMY_ITEM1～10`
- `ENEMY_ITEMPROB1～10`

已重新核對 `enemy.h`、`enemy.c`、`version.h`：

- `_FIX_ITEMPROB` 在目前來源版本為開啟
- 每一格掉落彼此獨立判定
- 原式為 `RAND(0,999) < ENEMY_ITEMPROB`
- 判定是在 Enemy instance 建立時完成，不是戰勝後才抽
- 成功的物品先掛在該 Enemy 的 `CHAR_STARTITEMARRAY + slot`

因此 `ITEMPROB=300` 就是每格 30%，而 `1000` 以上依原碼為必定成立；V0.18 不擅自 clamp 來源值。

runtime 升級為 `stoneage-general-encounter-runtime-v4`，每個可解析 Enemy template 都保留完整兩組 10 格整數陣列：

- `enemyItems[10]`
- `itemProbs[10]`

範圍統計（一般 85 Floor runtime + RandomEnemy 92 個替代目標）：

- 818 個唯一 EnemyID 全部可對回現行 `enemy1.txt`
- 558 個 EnemyID 至少有一格非 0 掉落率
- 754 個非 0 掉落格
- 223 個唯一 ItemID
- 8 格原始 `ITEMPROB >= 1000`
- 最大原始值為 `3300`，依原服務端仍視為必掉，不改寫成 1000

另外同步核對 `battle.c::BATTLE_GetExpGold()`。原服不是把所有成功生成的 Enemy 物品無限制塞給玩家，而是每位玩家有 3 格戰鬥取得欄；單人版因此對齊為：

1. 先由每隻死亡 Enemy 的 10 格 carried item 收集戰利品
2. 前 3 件依序放入結果槽
3. 超過 3 件時，原碼 50% 機率丟棄新物品，50% 機率隨機替換既有 3 格其中一格
4. 所以每場一般 Enemy 掉落最終最多取得 3 件

RandomEnemy 仍先把 placeholder 換成真正 EnemyID，再使用替代 Enemy 的 `enemyItems/itemProbs`；RandomChange 只改外觀／屬性／技能，不改掉落表。


## V0.19 Enemy 原版 EXP／等級差衰減／移除假石幣

V0.19 繼續把 `ENEMY_createEnemy → BATTLE_AddExpItem → BATTLE_GetExp` 的經驗流程接回一般野外 dynamicFormation。

### Enemy 自身 EXP

重新核對 `enemy.c::ENEMY_getExp()`：

- 若 `ENEMY_DUELPOINT <= 0`
- 且 `enemy1.txt::ENEMY_EXP != -1`
  - 直接使用 `ENEMY_EXP`
- 否則依 `enemybaseexptbl[level-1]` 與 EnemyBase 特性計算：
  - Rank 依 BASE VITAL+STR+TGH+DEX 總和決定
  - Rank bonus = 2.5 / 2 / 1.5 / 1 / 0.5 / 0
  - `alpha = (CRITICAL + COUNTER + GET + POISON + PARALYSIS + SLEEP + STONE + DRUNK + CONFUSION) / 100 + RARE`
  - `EXP = trunc(enemybaseexptbl[level-1] + (rankBonus + alpha) * level)`
  - 最低 1

runtime 升級為 `stoneage-general-encounter-runtime-v5`，並加入：

- `enemyExpOverride`
- `enemyDuelPoint`
- `enemyExpRankIndex`
- `enemyExpRankBonus`
- `enemyExpAlpha`
- 完整 200 級 `enemybaseexptbl`

目前 818 個唯一 EnemyID 中：

- 665 個使用公式 EXP
- 152 個使用 `ENEMY_EXP` override
- 1 個無完整 EnemyBase，維持 unresolved / fallback

### BATTLE_AddExpItem 等級差衰減

原服對每一隻死亡 Enemy，玩家／參戰寵物各自依自己的等級重新算：

- `角色等級 - Enemy 等級 <= 5`：全額 EXP
- 高超過 5 級後開始衰減
- 原式核心為 `EXP * (20 - 等級差) / 15`
- 以 C int 規則截斷
- 衰減後最低 1

之後 `BATTLE_GetExp()` 因目前來源版本開啟 `_GET_BATTLE_EXP`，再乘上現行 `setup.cf`：

`battleexp=100`

V0.19 也讓目前出戰寵物使用自己的等級獨立計算同一套 EXP；不再使用先前放置版暫定的「角色 EXP ×1.5」。

### 一般戰鬥不再自動發石幣

重新核對 `BATTLE_GetExpGold()`／`BATTLE_AddExpItem()`，一般 PVE 戰勝處理的是 EXP 與 Enemy 攜帶戰利品，沒有「每隻怪固定掉 2～6 石幣」這條規則。

因此 V0.19 已移除先前放置版的：

`rnd(2,6) * enemyCount`

石幣仍保留在角色資料中，供任務／商店等後續系統使用；正式石幣取得來源之後再依原服資料接入，不再用戰鬥憑空生成。

> 目前角色升級所需 EXP 與寵物升級門檻仍是放置版暫定 progression；V0.19 先把「一場戰鬥應取得多少 EXP」還原，升級表會再獨立處理。


## V0.20 exp.txt／CHAR_HandleExp／CHAR_PetLevelUp

V0.20 把 V0.19 已還原的戰鬥 EXP 繼續接到原服務端的升級消耗與寵物成長。

### exp.txt 與 CHAR_HandleExp

目前來源開啟 `_NEWOPEN_MAXEXP`、`_USER_EXP_CF`、`_TRANS_LEVEL_CF`。`LoadEXP()` 把 `data/exp.txt` 載入 `NeedLevelUpTbls[1..160]`；`CHAR_HandleExp()` 升級後會直接扣除 `CHAR_GetLevelExp(level+1)`，所以 `CHAR_EXP` 是當級進度，不是 Lv1 起算總累積。

前幾級門檻：Lv1→2 = 2、Lv2→3 = 6、Lv3→4 = 18、Lv4→5 = 37、Lv9→10 = 344。

runtime 升級為 `stoneage-general-encounter-runtime-v6` 並保存原 `NeedLevelUpTbls[1..160]`。現行 `setup.cf` 為 `LEVEL=140`、`CHARTRANS=5`、`PETTRANS=-1`。轉生尚未完整接入前，玩家先依 0 轉規則停在 Lv140；一般寵物先以 EXP 表邊界 Lv160 為安全上限，特殊任務寵仍使用自己的 `levelCap`。

### 玩家升級改回原流程

V0.19 前每級自動 MaxHP +18、攻 +3、防 +1、敏 +1 並補滿 HP 是放置版暫定值。V0.20 已移除。

依原 `BATTLE_GetExpGold()`／`CHAR_LevelUpCheck()`：

- 每升 1 級：`CHAR_SKILLUPPOINT += 3`
- 同一場戰鬥只要有升級：魅力 +2，上限 100
- 每升一級 DuelPoint 增加「新等級 ×10」
- 升級本身不直接補滿 HP

存檔 schema 升到 13，新增 `skillPoints`、`duelPoint`。能力點先顯示，正式 VITAL / STR / TOUGH / DEX 分配 UI 後續接。

### 新捕獲一般野寵接入 CHAR_PetLevelUp

V0.17 的 `allocatedFrom` 已確認就是 `ENEMY_createEnemy()` 寫入 `CHAR_ALLOCPOINT` 的四圍 ±2 後、額外 10 點前數值；EnemyBase Rank 就是 `CHAR_PETRANK`。

V0.20 新捕獲 dynamicFormation 野寵保存 `allocPointPacked`、`petRank`、`serverStats`、`serverCombat`、`serverProgression=true`。

每次升級依原 `CHAR_PetLevelUp()`：解出四個 alloc byte、再隨機分配 10 點；Rank0～5 的 RAND 範圍依序為 450–500、470–520、490–540、510–560、530–580、550–600，乘 0.01 後計算四圍增加值，再依 CHAR_complianceParameter 同系公式重算攻、防、敏與 MaxHP。

V0.20 前已存在舊存檔的寵物沒有保存原始隨機 `CHAR_ALLOCPOINT`，因此不反推、不偽造，維持 legacy progression；新捕獲的一般野寵才啟用原服成長。


## V0.21 CHAR_SkillUp／玩家四圍／CHAR_complianceParameter

V0.21 把 V0.20 已經正確取得的 `CHAR_SKILLUPPOINT` 正式變成可操作的玩家能力點。

重新核對 `char.c::CHAR_SkillUp()`：skillid 0/1/2/3 分別是 VITAL / STR / TOUGH / DEX；每次扣 1 點 `CHAR_SKILLUPPOINT`，選中的 CHAR 參數 +100，然後立即執行 `CHAR_complianceParameter()`。網頁 UI 顯示服務端值除以 100 後的整數，所以畫面 +1 就等價於原碼 +100。

玩家裸裝衍生值依 `CHAR_initcharWorkInt()`：

- 攻擊 = `trunc(STR + TOUGH×0.1 + VITAL×0.1 + DEX×0.05)`
- 防禦 = `trunc(TOUGH + STR×0.1 + VITAL×0.1 + DEX×0.05)`
- 敏捷 = `trunc(DEX)`
- MaxHP = `trunc(VITAL×4 + STR + TOUGH + DEX)`
- 重算後 HP 只做 `min(currentHP, MaxHP)`，配點不會自動補血

原創角四圍由玩家分配、正常總量 20。網頁版目前還沒有創角配點頁，因此新檔案採合法中性基準 `5/5/5/5`，對應 MaxHP 35、攻擊 6、防禦 6、敏捷 5；原 `CHAR_createNewChar()` 初始魅力 60，也同步修正。

schema 14 migration：V0.21 前沒有配點介面，所以舊存檔無法花掉升級點，會以 `(目前等級-1)×3` 補足最低應有未分配點；舊版魅力從 50 起算的固定差值也補 +10。四圍使用 5/5/5/5 migration baseline，不從先前假的攻防敏反推。

來源開啟 `_CHAR_PROFESSION`，原 CHAR_SkillUp 有職業專屬能力上限；目前放置版尚未建立正式職業系統，因此這一版不假定職業，等職業資料正式接入後再啟用限制。


## V0.22 BATTLE_DuckCheck／BATTLE_DamageCalc／會心

V0.22 把 V0.21 已經落地的玩家四圍，正式接進來源版本的普通物理戰鬥核心。

目前 `version.h` 確認：

- `_BATTLE_NEWPOWER`：開啟
- `_NPCENEMY_ADDPOWER`：開啟
- `_BATTLE_PROPERTY`：開啟
- `_EQUIT_HITRIGHT`：開啟，但裝備尚未接入，因此目前命中裝備修正為 0

runtime 升級為 `stoneage-general-encounter-runtime-v8`。

### BATTLE_DamageCalc 核心

一般未騎寵、未裝備特殊效果、未使用技能時：

1. attack = `CHAR_WORKATTACKPOWER`
2. 因 `_BATTLE_NEWPOWER` 開啟，defense = `CHAR_WORKDEFENCEPOWER × 0.70`
3. 若防守方是 Enemy，依 `_NPCENEMY_ADDPOWER` 對 defense 加入原 `rand()%10` 浮動
4. 若攻擊方是 Enemy，同樣對 attack 加入原浮動
5. 三段式原傷害：
   - `defense <= attack < defense×8/7`：`RAND(0, attack/16)`
   - `defense > attack`：`RAND(0,1)`
   - `attack >= defense×8/7`：`int((attack-defense)×2 + RAND(0,attack/8) - attack/16)`
6. 最後小於 1 時，原 `BATTLE_AttackSeq()` 仍會再 `RAND(0,1)`，所以普通攻擊現在可以真正出現 0 傷／MISS，不再強制至少 1 傷。

JS 的 `cRand()` 依原 `RAND(x,y)` 宏的 `int((y-x+1)*rand)` 語意處理浮點上限，不用一般整數亂數函式硬取 floor。

### BATTLE_DuckCheck

普通攻擊現在先做原敏捷閃避判定：

- 基礎 `gKawashiPara = 0.02`
- 玩家 → 非玩家：防守方 DEX ×0.6
- 非玩家 → 玩家：攻擊方 DEX ×0.6
- Enemy → Pet：攻擊方 DEX ×0.8
- 非 Enemy → Pet：防守方 DEX ×0.8
- 依 Big/Small、sqrt 與比值計算
- 最大閃避率 75%
- 玩家防守時會加 `Luck`

目前沒有武器／命中裝備／異常狀態，所以弓類額外修正、HITRIGHT 與狀態修正暫時都是 0。

### 會心一擊

普通攻擊通過閃避後，再接 `BATTLE_CriticalCheckPlayer()`：

- 基礎 `gCriticalPara = 0.09`
- 玩家 Luck 會加入會心判定
- 玩家打非玩家時，目標 DEX ×0.6
- Pet 打 Enemy 時，目標 DEX ×0.8
- Enemy 打 Player／Pet 時使用來源中的非 sqrt 分支
- 無裝備，所以 ITEM_CRITICAL = 0

成功會心後使用 `BATTLE_CriDamageCalc()`：

`普通傷害 + defender DEF × attacker Lv / defender Lv × 0.5`

### 元素相剋

Enemy 與 V0.20 後新捕獲的正式野寵都有 earth/water/fire/wind，因此兩邊元素資料都存在時，V0.22 會套原 `BATTLE_AttrCalc()`。

玩家目前還沒有原創角元素分配資料。原服創角要求元素總量 10、最多兩種且不能選互剋組合；V0.22 不猜 25/25/25/25，也不假造無屬性，所以**只要其中一方元素資料缺失，就暫時以倍率 1 跳過元素層**。玩家元素創角／migration 會另版處理。

### 尚未在 V0.22 混入

這一版刻意不一次塞入：

- 行動順序／敏捷排序
- Counter 反擊鏈
- Guard 防禦
- 裝備與武器種類
- 技能
- 異常狀態
- 職業
- 玩家創角元素

先把普通物理「閃避 → 傷害 → 會心」核心驗證穩定後，再逐層往外接。


## V0.23 BATTLE_DexCalc／EntrySort 行動順序

V0.23 繼續把 V0.22 已完成的普通物理「閃避 → 傷害 → 會心」往外接到原服回合順序。

重新核對 `battle.c::BATTLE_DexCalc()`、`EntrySort()` 與 `BATTLE_Attack()` 建表流程後，目前普通攻擊回合改成：

1. 玩家、出戰寵物、每一隻存活 Enemy 都各自建立一筆本回合 action entry。
2. 普通攻擊走 `BATTLE_DexCalc()` default 分支：
   - `work = CHAR_WORKQUICK + 20`
   - `dex = work - RAND(0, work * 0.3)`
   - 若結果 <= 0，固定為 1
3. 目前來源版有開 `_EQUIT_SEQUENCE`，原 `EntrySort()` 實際比較 `dex + CHAR_WORKSEQUENCEPOWER`。
4. 網頁版尚未接裝備，因此現階段所有 sequence 都視為 0，只依本回合 dex 由高到低排序。
5. 排序完成後逐一行動；先被擊倒的 Enemy 到自己順位時會直接跳過，若玩家在自己順位前被擊倒則本回合立即結束。

這次也修正單體 Enemy instance：之前非群戰 Enemy 從 `makeEnemyUnit()` 建立後只複製 HP／攻／防，會遺失 quick／elements／serverDerived 等資料；V0.23 改為保留完整 unit，讓 V0.22 的閃避、會心、元素與 V0.23 的行動排序在單體戰也能使用同一份 Enemy instance。

目前仍刻意未混入：

- `BATTLE_COM_CAPTURE` 的排序與完整捕獲回合
- Guard
- Counter
- 裝備 sequence
- 技能與異常狀態對 BATTLE_DexCalc 的分支修正
- 騎寵敏捷修正

先把「普通攻擊回合」的原服順序獨立驗證穩定，再接下一層。


## V0.24 BATTLE_COM_CAPTURE 回合排序

V0.24 把既有捕獲從「額外插入動作」改回原服回合指令。

原 `battle.c` 的 `BATTLE_COM_CAPTURE` 與普通攻擊一樣，先被收進同一份 EntryList，再由 `BATTLE_DexCalc()` 與 `EntrySort()` 決定本回合順位。捕獲本身沒有特殊敏捷分支，因此仍使用普通 default：

- `work = CHAR_WORKQUICK + 20`
- `dex = work - RAND(0, work*0.3)`
- 最低 1

因此目前手動／自動捕獲都真正消耗玩家這一回合的行動。捕獲失敗後，出戰寵物與每隻 Enemy 仍依已排好的本回合順位繼續行動；捕獲成功後，被捕獲 Enemy 立即退出戰鬥，群戰中的後續單位繼續按原順位行動。最後一隻 Enemy 被捕獲時不發放擊殺 EXP／掉落。


## V0.25 BATTLE_Counter 反擊鏈

V0.25 接入玩家與 Enemy 之間的原服普通物理反擊鏈。

重新核對 `BATTLE_CounterCalc()`、`BATTLE_CounterCheckPlayer()`、`BATTLE_CounterCheckPet()` 與 `battle.c` 在普通攻擊後的反擊迴圈：

- `gCounterPara = 0.08`
- Player 反擊非 Player 時，目標 DEX ×0.6
- 非 Player 反擊 Player 時使用 `divpara=10` 且不開平方
- Enemy 反擊 Pet 同樣使用非 sqrt 分支；Pet 反擊 Enemy 時目標 DEX ×0.8
- 玩家目前沒有武器，雙方視為 FIST；`CounterTbl[FIST,FIST]=10`，所以玩家基礎反擊率等於 CounterCalc 再加 Luck
- Enemy／Pet 分支最高 100%
- 原 `BATTLE_Counter()` 成功後再次走普通 AttackSeq，但最終傷害乘 0.75，正傷害最低 1
- 普通攻擊後最多交替反擊 5 次
- 會心、死亡、GUARD 等會關閉後續 ContFlg；MISS 會停止該次反擊，DODGE／NORMAL 可繼續鏈

目前網頁尚未建立寵物「戰鬥中當前 HP」，所以 V0.25 只先啟用 Player ↔ Enemy 反擊；Enemy ↔ Pet 反擊等寵物戰鬥 HP 狀態完成後再接。


## V0.26 BATTLE_COM_GUARD／BATTLE_GuardAdjust

V0.26 新增可操作的「防禦」回合，並修正 V0.25 捕獲回合不應具有玩家反擊資格的細節。

原服在回合開始前就已把玩家指令寫入 `CHAR_WORKBATTLECOM1`，因此即使 Enemy 的敏捷排序比玩家快，只要本回合選的是 GUARD，防禦效果在 Enemy 攻擊時就已成立；並不是等到玩家自己的排序順位才開始防禦。

`BATTLE_GuardAdjust()` 每次受擊重新擲 `RAND(1,100)`：

- 1～25：傷害 ×0
- 26～50：×0.10
- 51～70：×0.20
- 71～85：×0.30
- 86～95：×0.40
- 96～100：×0.50

之後若傷害 <1，仍依原 AttackSeq 最後規則再 `RAND(0,1)`。

另外 `BATTLE_DuckCheck()` 在 defender 為 GUARD 時直接不做閃避，所以防禦中不會同時享有敏捷閃避；`BATTLE_Attack()` 也會把 GUARD 的 ContFlg 關閉，因此該回合玩家不會進入反擊鏈。

V0.26 同步修正：玩家指令若是 CAPTURE，不符合 `BATTLE_Counter()` 只接受 ATTACK／NOGUARD 的條件，所以捕獲回合中被 Enemy 攻擊後不再觸發玩家反擊。


## V0.27 寵物 HP／Enemy ↔ Pet 反擊

V0.27 補上出戰寵物真正的戰鬥 HP 狀態，並解鎖先前刻意保留的 Enemy ↔ Pet 反擊。

重新核對原 `pet.c::PET_createPetFromCharaIndex()` 後確認：捕獲成功時，新寵物會直接複製野怪當下的 `CHAR_HP`，並不是捕獲後自動補滿。因此網頁版現在也會保留捕獲瞬間 HP。

目前規格：

- 每隻寵物持久保存 `hp / maxHp`
- 原服 serverStats 寵物以 `CHAR_complianceParameter` 同一套四圍換算得到 MaxHP
- 舊版／任務手工寵物沒有完整 serverStats 時，使用相同四圍比例的 fallback combat
- 舊存檔升級到 schemaVersion 15 時，既有寵物安全初始化為滿血
- 寵物升級增加 MaxHP 時不免費補血，只保留目前 HP 並重新 clamp
- HP = 0 視為倒下，本場後續回合不再進 EntrySort
- 倒下寵物不能重新設為出戰，對齊原 `PET_SelectBattleEntryPet()` 的死亡檢查
- 「休息補滿」現在同時恢復角色與所有寵物

反擊部分：

- Pet 攻擊 Enemy 後，只要原普通攻擊回傳仍允許 ContFlg，就可由 Enemy 依原 `BATTLE_CounterCheckPet()` 嘗試反擊
- Enemy 反擊 Pet 時使用 `divpara = 10`、不開平方
- Pet 反擊 Enemy 時，Enemy DEX ×0.8 後再走原 CounterCalc
- 成功反擊傷害仍為普通 AttackSeq 結果 ×0.75，正傷害最低 1
- 最多交替反擊 5 段
- 會心、MISS、任一方死亡會依原 ContFlg 規則中止後續鏈
- 普通攻擊、玩家捕獲回合、玩家防禦回合中的「寵物普通攻擊」都各自只掛一個 Enemy ↔ Pet 反擊入口

另外，V0.27 把單體捕獲也改成保留 target 上完整的 serverDerived／allocatedFrom／petRank 等資料，不再只有 dynamic group 捕獲才保留原服成長 metadata。


## V0.28 enemy1 at/rn 普通攻擊 AI

V0.28 開始把原 `battle_ai.c::BATTLE_ai_normal()` 的 Enemy 選目標規則接進網頁戰鬥。

新增 `data/generated/stoneage_enemy_ai.json`：

- 來源：原服 `gmsv/data/enemy1.txt`
- 共 2,958 個 Enemy ID
- 初版資料壓縮後約 86 KB
- `t` = ENEMY_TACTICS
- `a` = `at:[weight,targetType,selectMode]`
- `r` = `rn`

目前先接「普通攻擊的選目標」，尚未把 AI 的攻擊／防禦／逃跑／技能權重一起打開。

### 目標類型

依原 `battle_ai.c`：

- 1：ALL，玩家與目前出戰寵物都可成為目標
- 2：PLAYER，只選玩家
- 3：PET，只選出戰寵物
- 4：LEADER；單人放置版以玩家為 leader，並保留原碼讓非 leader 以 1/3 機率加入候選的行為
- 其他值：原 switch 會走 default，因此視為 ALL

如果指定類型目前沒有可用目標，例如設定 PET 但出戰寵物已倒下，會依原 while fallback 改回 ALL。

### 選擇方式

已接：

1. RANDOM
2. HP MAX
3. HP MIN
4. STR MAX
5. DEX MAX
6. DEX MIN
7. ATT SUBDUE

HP 直接使用戰鬥當下 HP。STR／DEX 以目前玩家與寵物四圍做同尺度比較；屬性模式複刻 `GetSubdueAttribute()` 的比較樹，再選目標相對應屬性值。

`_ENEMY_ATTACK_AI` 在來源版有開，因此 HP／STR／DEX／屬性模式也會依原 `rn` 規則偶爾改成隨機目標；未寫 rn 時沿用原陣列預設值 1。

### 與回合排序的關係

原服是在進 `EntrySort` 前先跑 `BATTLE_ai_all()` 決定 `CHAR_WORKBATTLECOM2`。

網頁版 V0.28 因此也在 `normalBattleOrder()` 建立 action entry 時就先為每隻 Enemy 固定本回合目標，再算 `BATTLE_DexCalc` 排序。若該目標在 Enemy 真正行動前已倒下，才重新依 AI 選一個有效目標，對應原 `BATTLE_TargetAdjust` 的補正概念。

Enemy 若主動選中寵物：

- 使用 Enemy → Pet 的原普通物理閃避／傷害／會心
- 寵物 HP 可被直接打到 0 並倒下
- 若原 ContFlg 允許，Pet 可依 `BATTLE_CounterCheckPet` 立刻反擊 Enemy
- 玩家本回合若選 GUARD，只有 Enemy 真正打到玩家時才套 `BATTLE_GuardAdjust`；Enemy 打寵物時不會錯把玩家防禦套到寵物

目前仍未接入 `at/gu/es/wa` 的「行動種類權重」、Enemy 自己的 GUARD、逃跑與 pet skill 執行；V0.28 只先完成普通攻擊時的原服選目標。


## V0.29 enemy1 行動權重／Enemy Guard／Escape

V0.29 從 V0.28 的「普通攻擊選目標」往前補齊原 `BATTLE_ai_normal()` 的行動抽選。

### AI runtime v3

`data/generated/stoneage_enemy_ai.json` 升級為 `stoneage-enemy-ai-v3`，來源仍是原服 `enemy1.txt + enemybase1.txt`，現在每個 Enemy ID 會保留：

- `a`：`at:[weight,targetType,selectMode]`
- `g`：`gu` 權重
- `m`：`ma` 權重
- `e`：`es` 權重
- `w`：`wa[0..6]` 七格寵技權重
- `p`：對應 `PETSKILL1..7` 的技能 ID
- `q`：EnemyBase 的 `RARE`
- `r`：`rn`
- `t`：TACTICS

來源資料中 `ma` 權重目前全部為 0，因此這版實際會抽到的是 Attack／Guard／Escape／wa。

另新增 `data/generated/stoneage_petskill_runtime.json`，直接由原 `petskill.txt` 生成技能 ID → 名稱／函式／option 的執行索引。

### 原權重抽選

現在每回合建立 EntryList 前，每隻 Enemy 先依原碼順序：

`at → gu → ma → es → wa0..wa6`

把所有權重相加，再做一次 `RAND(0, total-1)` 決定本回合 command。

如果 `wa` 抽到：

- `PETSKILL_None` → NONE
- `PETSKILL_NormalAttack` → ATTACK
- `PETSKILL_NormalGuard` → GUARD
- 其他特殊技能保留真正 skill slot／skill ID，但 V0.29 尚未把效果硬翻成普通攻擊；未接技能會明確走 no-action 暫代，避免產生假的戰鬥結果

### Enemy Guard

Enemy 若本回合 command 是 GUARD，會在 `normalBattleOrder()` 建 Entry 時就標記為 guarding。

這點對齊原服：AI command 是在 `BATTLE_DexCalc / EntrySort` 前就決定，因此即使 Enemy 的實際行動順位比玩家晚，玩家先打牠時 GUARD 已經有效。

玩家／寵物攻擊正在 Guard 的 Enemy 時：

- 不做一般敏捷閃避判定
- 傷害走既有 `BATTLE_GuardAdjust` 0～50% 原倍率
- Guard 造成的 ContFlg 中止仍會阻止反擊鏈

### Enemy Escape

Escape 接入原 `BATTLE_EscapeCheck()`：

- Enemy RARE 0 → luck 1
- RARE 1 → luck 3
- 其他 RARE → luck 5
- 使用 Enemy 自身等級與玩家側平均等級
- 保留原 `escape count` 累積
- 原碼是 `BATTLE_Escape()` 先把 Entry.escape +1，進 `BATTLE_EscapeCheck()` 時再使用 `escape+1`；V0.29 也照這個順序
- 成功條件保留原 `RAND(1,100) < Esc`

逃跑成功的 Enemy 會直接從戰場資料移除，不計入之後的擊殺 EXP／掉落。

若群戰中部分 Enemy 已被擊殺、最後存活 Enemy 逃跑，結算只會保留真正被擊殺的那些 Enemy；如果整隊都只是逃走，戰鬥結束但沒有擊殺收益。

### 尚待接入

V0.29 已把 wa 的選擇與技能 ID 真實化，但特殊 PetSkill 效果仍需逐類實作。下一層會從原 `pet_skill.c / battle.c` 能直接映射到既有物理核心的技能開始，例如：

- GuardBreak
- ContinuationAttack
- Mighty
- PowerBalance
- StatusChange
- ChargeAttack
- NoGuard

特殊魔法與後期擴充技能再另外拆層，避免用近似公式污染目前已驗證的普通物理核心。


## V0.30 基礎攻擊型 PetSkill

V0.30 開始真正執行 Enemy `wa` 抽到的特殊寵技，第一批只選能從原 `pet_skill.c + battle.c + battle_event.c` 精確映射到既有普通物理核心的技能。

### 破除防禦 — PETSKILL_GuardBreak

原 `BATTLE_S_GBreak()` 的規則不是「無視防禦的普通攻擊」，而是：

- 只有目標本回合 `BATTLE_COM_GUARD` 時才會真正造成傷害
- 目標沒有 Guard 時直接 `damage=0`
- 目標 Guard 時，因 `BATTLE_DuckCheck` 對 Guard 直接不做閃避，所以不進一般敏捷閃避
- `BATTLE_AttackSeq(..., BATTLE_COM_S_GBREAK)` 特別跳過一般 `BATTLE_GuardAdjust`，所以是直接打穿 Guard 的傷害
- GuardBreak 對 Guard 後 `iRet=FALSE`，不接普通反擊鏈

V0.30 完整照此行為。

### 連續攻擊 — PETSKILL_ContinuationAttack

原技能 option 第一個數字就是攻擊段數：

- ID 10：2 段
- ID 11：3 段
- ID 12：4 段
- ID 13：5 段

原 `battle.c` 會設定：

- `attack_max = N`
- `gDamageDiv = N`

每一段都重新跑普通物理的閃避／會心／傷害；`BATTLE_Attack()` 在每段 AttackSeq 回來後再把正傷害除以 N，若除完小於 1 則維持 1。

反擊時機也已照原碼：不是每一段各觸發一次反擊，而是整個 N 段迴圈結束後，才使用最後一段留下的 `ContFlg` 進一次最多 5 段的 `BATTLE_Counter` 鏈。

### 一擊必殺 — PETSKILL_Mighty

直接解析 `petskill.txt` option：

- 一擊必殺：`倍2 回避30`
- 一擊必殺改：`倍3 回避15`

對應原碼：

- `gBattleDamageModyfy = 2.0 / 3.0`
- `gBattleDuckModyfy = 30 / 15`

額外回避率是在原 `BATTLE_DuckCheck` 算完敏捷差後加入，最後仍受 75% 最大閃避上限限制。

傷害倍率的順序也保留原 AttackSeq：

1. 先算普通／會心傷害
2. 若目標 Guard，先跑 `BATTLE_GuardAdjust`
3. 傷害 <1 時先 `RAND(0,1)`
4. 再乘 Mighty 倍率
5. 若同時存在 `gDamageDiv`，最後才做除法

### 暫不假做的技能

以下技能已可被 AI 正確抽中並取得真實 skill ID／option，但 V0.30 仍維持 no-action，而不是拿普通攻擊冒充：

- ChargeAttack
- PowerBalance
- StatusChange（毒／眠／石／亂／醉）
- NoGuard
- AttackMagic
- 後期擴充 PetSkill

下一層會先建立「回合狀態／持續效果」資料結構，再接這些技能。


## V0.31 背水之戰／不防守戰法／反擊資格

V0.31 繼續接 `PETSKILL_PowerBalance` 與 `PETSKILL_NoGuard`，並修正原版反擊 command 限制。

### 背水之戰 — PETSKILL_PowerBalance

原 `PETSKILL_PowerBalance()` 在 AI 選好 command 時就直接改：

- `CHAR_WORKATTACKPOWER`
- `CHAR_WORKDEFENCEPOWER`

並不是等到該 Enemy 自己的敏捷順位才改。因此 V0.31 也在建立本回合 EntryList、進 `BATTLE_DexCalc / EntrySort` 前就套用。

目前三個原技能 option：

- 背水之戰 1：`攻%+25 防%-35`
- 背水之戰 2：`攻%+45 防%-55`
- 背水之戰 3：`攻%+80 防%-50`

百分比使用和原 C 程式一致的「基礎值 + trunc(基礎值 × 百分比)」方式。

效果只存在本回合；下一回合 AI 重新選 command 時會先回到 Enemy 基礎攻防再套新指令。

### 不防守戰法 — PETSKILL_NoGuard

原技能本身設定 `BATTLE_COM_S_NOGUARD`，到了 battle switch 會 `BATTLE_NoAction`，所以使用者這回合不主動攻擊。

真正生效的效果：

- NoGuard 1：回避 +30、反擊 +50
- NoGuard 2：回避 +40、反擊 +60
- NoGuard 3：回避 +50、反擊 +70

回避加成直接進原 `BATTLE_DuckCheck`，最後仍受 75% 最大閃避率限制。

反擊加成進原 `BATTLE_CounterCheckPet`，加在敏捷差算出的反擊率上，最後最高 100%。

`petskill.txt` 雖然 option 還寫了 `会心%+20/+30/+40`，但此來源版處理 NoGuard 會心加成的 `BATTLE_CriticalCheckPet()` 整段被 `#if 0` 編譯關閉，而目前啟用的 `BATTLE_CriticalCheck()` 對 Pet／Enemy 都轉到 Player 版公式。因此 V0.31 **不套這個會心加成**，以實際編譯路徑為準。

### BATTLE_Counter command 資格

重新核對 `BATTLE_Counter()` 後，反擊方只有目前 command 是：

- `BATTLE_COM_ATTACK`
- `BATTLE_COM_S_NOGUARD`

才允許進反擊。

因此現在 Enemy 若本回合正在準備 Guard、Escape、GuardBreak 等，而玩家／寵物敏捷較高先打到牠，牠不會錯誤反擊。

Mighty、ContinuationAttack、PowerBalance 這類在原 `battle.c` 進直接攻擊群組後會把 COM 改回 ATTACK 的技能，則從真正執行攻擊開始具備後續反擊／反反擊資格。


## V0.32 StatusChange／中毒／睡眠／石化

V0.32 建立第一版原服異常狀態框架，狀態只存在本場戰鬥，不寫入永久存檔；開新戰鬥時會清空，對齊原服的 CHAR_WORK* 戰鬥狀態。

### 狀態抗性資料

`stoneage_enemy_ai.json` 升級為 `stoneage-enemy-ai-v4`，每個 Enemy 新增：

`z = [毒抗, 麻痺抗, 睡眠抗, 石化抗, 酒醉抗, 混亂抗]`

來源直接是 `enemybase1.txt` 的 POISON / PARALYSIS / SLEEP / STONE / DRUNK / CONFUSION 六欄。

捕獲成功時，這組先天抗性會一起複製到寵物資料。

### StatusChange 物理部分

`PETSKILL_StatusChange()` 在 AI 選好指令時就會先套 option 中的 `攻%`／`防%` 修正，因此 V0.32 也在 EntrySort 前套用。例如：

- 毒攻擊：攻 -30%
- 猛毒攻擊：攻 -50%
- 石化／混亂／酒醉／催眠攻擊：攻 -30%

真正輪到該 Enemy 行動時，仍是一發普通物理攻擊；只有該次實際傷害 >0 才進異常狀態判定。

### 原 BATTLE_StatusAttackCheck

目前非麻痺狀態完全照來源公式：

- 目標若已有任何一種異常狀態：直接失敗，不可重疊
- `VitalPenalty = (VITAL / (VITAL+STR+TOUGH+DEX)) / 0.25 × 10`
- `Level = (攻方Lv - 守方Lv) × 2`
- Level 限制在 -40～+40
- `Per = 30 + Level + 攻方Luck - 抗性 - VitalPenalty`
- 最大 80%
- 成功條件是嚴格的 `RAND(1,100) < Per`

玩家目前沒有裝備抗性，所以玩家六項抗性先為 0。

### 回合計數

來源命中後會寫入 `gBattleStausTurn + 1`。角色輪到行動時，`BATTLE_StatusSeq()` 先把 count 減 1，再執行該回合狀態效果。

V0.32 同樣依此順序處理，因此不直接把技能寫的 turn 數當成簡化版倒數。

### 中毒

已接 `Compute_Down()`：

`down = ((VITAL+STR+DEX+TOUGH)/100 - 20) / 4`

全部使用 C 整數截斷語意；若結果 <1 則固定 1。

若毒傷會讓 HP <=0，來源會把傷害限制成 `HP-1`，因此普通中毒 **不能致死，最低留下 1 HP**。

### 睡眠

- 睡眠期間 `BATTLE_CanMoveCheck = FALSE`，輪到自己時無法行動
- 任一正物理傷害會先執行 `BATTLE_DamageWakeUp`，立即清除睡眠
- StatusChange 本身若是催眠攻擊，來源順序是「傷害先喚醒舊睡眠 → 再判定並寫入新睡眠」，V0.32 也維持此順序
- 睡眠成功後，若目標原本還沒行動，該回合 command 會失效，也不能反擊

### 石化

- 石化期間不能行動
- 原 `BATTLE_DamageCalc()` 會令石化目標 defense ×2
- V0.32 的 player / pet / enemy battle view 都已套用此倍率
- 石化目標也因 `BATTLE_CanMoveCheck = FALSE` 無法進反擊

### 酒醉與混亂（V0.32 當時狀態）

V0.32 已能辨識這兩種 StatusChange 的真實技能 ID／option，但當時特殊回合行為尚未啟用。

原因是來源版酒醉存在一段明顯不對稱程式：套用時把 `CHAR_WORKDRUNK` 本身除以 2，解除時卻把 `CHAR_WORKQUICK` 乘 2；目前尚未找到對稱的「套用時 QUICK /2」程式，因此不直接複製可能造成永久敏捷翻倍的來源異常。

混亂則會在 `BATTLE_StatusSeq` 中以 80% 機率強制改成普通攻擊，並隨機攻擊敵我任一存活單位，需要先把友軍傷害／亂打選目標完整接好後再啟用。


## V0.33 突擊／雙重突擊 BATTLE_Charge

V0.33 接入 `PETSKILL_ChargeAttack`，目前來源 petskill 有兩種：

- ID 30「突擊」：`1 攻%+90`
- ID 31「雙重突擊」：`2 攻%+110`

### 原 BATTLE_Charge 狀態機

`PETSKILL_ChargeAttack()` 先把 command 設成 `BATTLE_COM_S_CHARGE`，並把：

- low COM3 = 蓄力回合數 N
- high COM3 = 攻擊百分比

每次輪到該單位：

- low > 0：low - 1，執行 `BATTLE_NoAction`
- low <= 0：攻擊力改成 FIXSTR + FIXSTR × 百分比，command 改為 `BATTLE_COM_S_CHARGE_OK`

同一個 action 後段會重新讀取 command，因此切成 `CHARGE_OK` 的那一回合會立刻完成真正物理攻擊，不會再多等一回合。

所以實際行為是：

- 突擊：空過 1 回合，下一回合 +90% 攻擊出手
- 雙重突擊：空過 2 回合，第三回合 +110% 攻擊出手

### AI 鎖定

原 `BATTLE_ai_all()` 會先檢查 `BATTLE_IsCharge()`。只要目前 command 是 `S_CHARGE`，Enemy AI 就直接保留既有 command，不重新抽 at／gu／es／wa。

V0.33 的 Enemy 也會把 chargeState 跨回合保留，直到倒數完成。

第一次開始蓄力時鎖定的目標會一起保存；若釋放前該目標已失效，才回退到目前 Enemy AI 的有效目標補正。

### 反擊

`CHARGE_OK` 在原直接攻擊流程開始前會把 command 清成 NONE。

因此：

- 被蓄力攻擊的目標仍可依自己的 command 嘗試反擊
- 但蓄力 Enemy 在被反擊後不符合 `BATTLE_Counter()` 的 ATTACK／NoGuard 資格，不會再反反擊

V0.33 也保留此限制。

### 異常狀態中斷

原 `BATTLE_StatusSeq()` 若發現睡眠、石化、麻痺等不能行動狀態，會把目前 command 清成 NONE。

所以 V0.33 中，正在蓄力的 Enemy 若在自己行動時被判定無法行動，chargeState 會直接取消，而不是等異常解除後繼續剩餘蓄力。

## V0.34 混亂攻擊：敵我亂打

V0.34 正式啟用 `PETSKILL_StatusChange` 的混亂分支。來源技能為 ID 90「混亂攻擊」：

`乱 turn 3 攻%-30`

### 原 BATTLE_StatusSeq 混亂流程

來源每次輪到混亂中的單位時，會先照通用 StatusSeq 把剩餘 count 減 1；若該次減到 0，就只解除狀態，不再觸發混亂攻擊。

只要狀態仍有效：

- `RAND(1,100) <= 80`：把原 command 強制改成普通 `ATTACK`
- 先 `RAND(0,1)` 隨機選戰場其中一側
- 再從該側隨機起點循環尋找存活目標
- 不能選到自己
- 可以選到同陣營，因此會真正發生友軍傷害
- 若選中的那一側沒有其他合法目標，來源先把目標設為 -1，後續 `BATTLE_TargetAdjust` 會回退到正常敵對側目標
- 其餘 20% 不改 command，照原本這回合選到的攻擊／防禦／PetSkill 等動作執行

網頁放置版沒有原戰場 0～9 的固定站位，因此保留「先選側」的機率結構，再於該側目前存活單位中均勻抽一名；若該側無合法目標，再依原 TargetAdjust 語意回退敵對側。

### 友軍攻擊與反擊

V0.34 新增混亂專用的任意單位物理攻擊路徑，現在可處理：

- 玩家 → 自己的出戰寵物
- 寵物 → 玩家
- Enemy → 同隊 Enemy
- 原本的玩家／寵物 ↔ Enemy

混亂只是把 command 改成普通攻擊，因此仍走現有物理傷害、會心、閃避、睡眠受傷喚醒與反擊判定。Enemy 若正在蓄力而混亂成功改寫 command，蓄力會被中斷。

來源的防禦判定另有 `CHAR_WORKCONFUSION <= 0` 條件，因此混亂中的目標即使原 command 是 GUARD，也不能取得防禦減傷；V0.34 同步套用此規則。


## V0.35 泥醉攻擊／酒醉

V0.35 正式啟用 ID 100「泥醉攻擊」：

`醉 turn 3 攻%-30`

異常命中率仍沿用 V0.32 已接好的 `BATTLE_StatusAttackCheck`，只有該次物理傷害 >0 才會判定酒醉。

### 原碼已確認的不對稱

這份來源在 StatusChange 命中酒醉後先寫：

`CHAR_WORKDRUNK = gBattleStausTurn + 1`

但緊接著卻執行：

`CHAR_WORKDRUNK = CHAR_WORKDRUNK / 2`

而 `BATTLE_StatusSeq` 在酒醉解除時又會把 `CHAR_WORKQUICK` 乘 2。

在目前來源樹中沒有找到與解除邏輯對稱的「命中酒醉時 QUICK /2」；若逐字照搬，會縮短酒醉倒數，並可能讓解除後 QUICK 永久翻倍。

因此 V0.35 不複製這個明顯不對稱的資料寫入，而採用不污染角色永久能力值的對稱轉譯：

- `turn 3` 保持三次有效狀態行動
- 酒醉存續期間，戰鬥用 QUICK = 基礎 QUICK 的 50%（C 整數截斷）
- 只改戰鬥 view，不改玩家、寵物或 Enemy 的永久敏捷資料
- 狀態解除後自然恢復原 QUICK，不需要做 ×2 回寫

### 酒醉命中／閃避效果

原 `BATTLE_DuckCheck` 還有一條已確認規則：

若**攻擊者**處於酒醉，目標的回避判定額外增加 `RAND(20,30)` 個百分點。

V0.35 已沿用這條公式，因此酒醉會同時造成：

- 行動排序與 QUICK 相關戰鬥計算使用 50% QUICK
- 自己出手時更容易被對方閃避（額外 +20～30% 回避判定）

這兩項都只在酒醉狀態存續期間生效。

## V0.36 地球一周

V0.36 接入 ID 120「地球一周」：

`PETSKILL_EarthRound`

`攻%+90`

來源說明文字為「一回合從敵人背後以兩倍攻擊力攻擊」，但實際程式不是當回合直接打出兩倍傷害，而是一個跨回合的兩段式 command。

### 第一回合：繞背／隱身

`PETSKILL_EarthRound()` 先把 command 設成 `BATTLE_COM_S_EARTHROUND1`，並把 `攻%+90` 寫入 COM3。

真正輪到該單位時，`BATTLE_EarthRoundHide()` 會：

- 播放繞背／消失流程
- 把 `CHAR_ISATTACKED` 設為 0
- 把 command 改成 `BATTLE_COM_S_EARTHROUND0`
- 本回合不做物理攻擊

原 `BATTLE_TargetCheck()` 會拒絕 `CHAR_ISATTACKED == FALSE` 的目標，所以繞背中的單位不能被一般攻擊指定；魔法路徑也另外檢查 `EARTHROUND0` 並直接視為 Miss。

V0.36 因此把繞背中的 Enemy 從可指定目標集合排除，但仍保留在存活 Enemy 集合內，避免單隻 Enemy 繞背時被誤判成戰鬥勝利。

### 第二回合：現身攻擊

`BATTLE_IsCharge()` 會把 `EARTHROUND1`／`EARTHROUND0` 都視為需跨回合保留的 command，所以 Enemy AI 不會在下一回合重抽行動。

第二回合進入攻擊流程時：

- `gBattleDamageModyfy = 1.0 + COM3 × 0.01`
- ID 120 的 `攻%+90` 因此實際倍率為 **1.90**
- 真正攻擊前 command 會先清成 NONE
- 之後走一般 `BATTLE_Attack`，所以仍會進普通閃避、會心、防禦與反擊判定

這不是「攻擊力先乘 1.9」；來源是在普通傷害算完後用 `gBattleDamageModyfy` 乘最終傷害。V0.36 也使用現有 `damageMultiplier` 在同一層套用 ×1.90。

### 目標與反擊

第一回合選定的目標會跨回合保存；若第二回合釋放前原目標已失效，則依現有 `TargetAdjust` 語意回退到有效敵對目標。

因為原版在 EarthRound0 真正出手前會把 command 清成 NONE：

- 被地球一周命中的玩家／寵物仍可依自身條件反擊
- 地球一周施術者不具備後續反反擊資格

### 混亂／不能行動異常

若繞背期間混亂 80% 成功改寫成普通 ATTACK，地球一周會被中斷並立刻重新現身。

若睡眠、石化、麻痺等不能行動狀態在該單位行動時生效，V0.36 也會取消 EarthRound 狀態並恢復可指定，避免來源 `CHAR_ISATTACKED` 與 command 清除不同步造成永久隱身類異常。

### Enemy AI 覆蓋

目前 `stoneage_enemy_ai.json` 中共有 **27** 個 Enemy 模板帶有 Skill 120 欄位，其中 **12** 個模板的對應 AI 權重大於 0，會在目前 Enemy AI 權重抽選中實際使用地球一周。

## V0.37 落馬術／偷竊

V0.37 接入兩個目前 Enemy AI 會實際抽到、且原版資料足夠完整的 PetSkill：

- ID 210「落馬術」：`PETSKILL_FallGround`，option `攻%-30`
- ID 140「偷竊」：`PETSKILL_Steal`

### 落馬術

`PETSKILL_FallGround()` 先把本回合攻擊力改成：

`FIXSTR + FIXSTR × (-30%)`

之後進入獨立的 `BATTLE_S_FallGround()`，仍使用原普通物理 AttackSeq，因此保留：

- 閃避
- 會心
- 防禦減傷
- 屬性修正
- 睡眠受傷喚醒

但它不是普通 ATTACK case；來源在 `BATTLE_COM_S_FALLRIDE` 的獨立分支處理完就 break，沒有接普通攻擊區後段的 Counter loop。因此 V0.37 **不讓落馬術進普通反擊鏈**。

只有本次實際 `damage > 0` 才做落馬判定。無裝備落馬抗性時來源是：

`RAND(0,100) > 50`

也就是 0～100 共 101 個整數中有 50 個成功值，實際為 **50/101**。

目前網頁放置版尚未建立正式騎乘系統，所以現階段這個技能會完整執行 -30% 物理傷害與落馬亂數，但玩家沒有騎乘狀態時自然不會發生「打落坐騎」。程式已保留未來 `state.ridePetId` 的清除接點，不另外捏造騎乘規則。

目前 Enemy AI 中：

- 32 個 Enemy 模板帶有 Skill 210
- 其中 **23 個 Enemy 模板**對應技能權重大於 0，實戰會抽到

### 偷竊

原 `BATTLE_Steal()` 對玩家目標才給偷竊率：

`per = 50`

而成功條件是嚴格：

`RAND(1,100) < 50`

因此不是 50%，而是 **49%**。

成功後再做第二次同樣的嚴格 `RAND(1,100) < 50`：

- 成功：偷石幣
- 否則：偷背包道具

石幣量為：

`gold × RAND(8,12) × 0.01`

並用 C 整數截斷。若算出 0 石幣，該次視為沒有偷到。

道具分支原版會從玩家非裝備背包槽隨機挑一個項目移除。網頁版背包是 itemId → count 的堆疊模型，因此 V0.37 以目前有數量的 itemId 作為可偷槽，隨機選一種後扣 1 個。

Enemy 使用偷竊成功後，原版並沒有把石幣／道具塞進 Enemy 可持有背包；玩家端資源只會被扣除。V0.37 維持這個效果。

若 Enemy AI 原本選到出戰寵物，原版因目標不是 `CHAR_TYPEPLAYER`，偷竊率直接是 0；V0.37 同樣會失敗，不會改成偷寵物。

目前 Enemy AI 中：

- 28 個 Enemy 模板帶有 Skill 140
- 其中 **14 個 Enemy 模板**至少有一個 Skill 140 權重大於 0，實戰會抽到

### AttackMagic 暫緩

本輪也檢查了目前最常見的未接函式 `PETSKILL_AttackMagic`。

Skill runtime 已能取得像：

`magic 312 item 19658`

以及原 `TargetIndex` 的單體／橫列／全體範圍，但正式傷害仍依賴來源啟動時另外載入的：

- `data/magic.txt`
- `data/attmagic.bin`

其中 `magic.txt` 提供屬性、Power、MagicLv；`attmagic.bin` 還包含真正的範圍遮罩與動畫攻擊型態。這兩份檔案目前不在來源 GitHub，也不在本專案資料層，因此 V0.37 沒有先用猜測值實作 AttackMagic。

## V0.38 旅程伙伴／忠犬

V0.38 接入兩個目前 Enemy AI 會實際抽到、而且原始程式流程已能完整確認的 PetSkill：

- ID 130「旅程伙伴」：`PETSKILL_Abduct`
- ID 20「忠犬」：`PETSKILL_Guardian`，option `攻%-20  COM:攻击`

另外把 ID 200「加工」`PETSKILL_Merge` 明確標記為原版戰鬥外技能，不再列成「尚未接入」。

### 旅程伙伴

原 `BATTLE_Abduct()` 對目標類型有非常明確的分流。

若目標是 **PLAYER**：

- `per = 0`
- 函式直接 `return FALSE`
- 玩家本人不會被帶離
- 施術者也不會因此退出戰鬥

若目標是 **PET / ENEMY**，成功率為：

`per = max((目標等級 - 施術者等級) × 0.6 + 30, 50)`

來源中的 `per` 是 `int`，所以小數會先以 C 整數規則截斷；V0.38 也先 `Math.trunc()` 再套最低 50。

真正成功條件仍是嚴格：

`RAND(1,100) < per`

因此最低 `per=50` 時不是 50%，而是 **49%**。

對目前 Enemy → 玩家側的戰鬥而言，真正有意義的目標是出戰寵物：

- 成功：寵物退出**本場戰鬥**
- 寵物不會被刪除、不會消失，也不改永久 HP / 寵物箱資料
- 本場後續不再排回合、不再被 Enemy 指定、不再反擊
- 本場勝利結算時，被帶離的寵物不取得該場 EXP
- 下一場戰鬥重新建立 battle state 後，該寵物可正常再次出戰

原碼還有一個重要規則：只要 Abduct 已進入「非 PLAYER 目標」流程，**不論帶走成功或失敗，施術者本身最後都會 `BATTLE_Exit`**。

因此 V0.38 會在判定完成後把使用旅程伙伴的 Enemy 從本場移除；若敵方因此全數離場，沿用現有「敵方逃離」結算，不給擊殺 EXP 與掉落。

原碼在 `BattleArray[battleindex].WinFunc != NULL` 時還會把 `per` 強制設為 0。現在網頁 runtime 尚未匯入可與該欄位一一對應的 Battle WinFunc 資料，所以沒有用任務名稱或 `questOnWin` 去猜這個條件；等 WinFunc 資料層正式匯入後再精準接上。

目前 Enemy AI 中：

- 33 個 Enemy 模板資料帶有 Skill 130
- 其中 **3 個 Enemy 模板**對應 AI 權重大於 0，會實際使用旅程伙伴
- 目前可實際抽到的 Enemy ID：1097、1790、2470

### 忠犬

ID 20 的資料為：

`攻%-20  COM:攻击`

所以忠犬不是單純「被動代擋」；PetSkill 下達時會：

1. 把自己本回合攻擊力依 `攻%-20` 修正
2. command 設成 `BATTLE_COM_S_GUARDIAN_ATTACK`
3. 登記自己為 guardian
4. 找到同側「自己站位 - 5」的主人，將該主人的 `guardian` 指向自己
5. 自己仍會在本回合正常發動修正後的物理攻擊

原 `BATTLE_NewEntry()` 的站位規則是：

- 玩家：同側 Entry 0～4
- 玩家寵物：固定在主人位置 +5
- Enemy：同側 Entry 0～9 由前往後塞入第一個空位

因此 Guardian attack-mode 的 `pos - 5` 規則可等價成：

- slot 5 保護 slot 0
- slot 6 保護 slot 1
- …
- slot 9 保護 slot 4

V0.38 在 Enemy 編成建立完成後保存穩定 `battleSlot`；即使之後有 Enemy 死亡、捕獲或離場，也不重新編號，對應原版 Battle Entry 留空洞的語意。

每一回合開始時，原 `BATTLE_PreCommandSeq` 會先把所有 guardian 清成 -1，再由這一回合選到 Guardian 的單位重新登記。V0.38 同樣在 `normalBattleOrder()` 開始時清除上一回合的 guardian link。

### 忠犬代擋順序

原 `BATTLE_AttackSeq()` 的順序不是先把目標直接換成忠犬，而是：

1. 先用**原本被攻擊的目標**做 `BATTLE_DuckCheck`
2. 原目標如果成功閃避，忠犬不會代擋
3. 原目標沒有閃掉，才做 `BATTLE_GuardianCheck`
4. 若 Guardian 有效，改用忠犬本身的防禦、屬性與會心判定計算傷害
5. 不會再對忠犬做第二次閃避判定

V0.38 依照這個順序接入，而不是簡化成「攻擊一開始就換目標」。

Guardian 無效條件目前已對齊可由現有狀態系統表達的部分：

- 忠犬已死亡
- 忠犬就是本次攻擊者
- 忠犬睡眠
- 忠犬麻痺
- 忠犬石化
- 忠犬混亂

原版另有 Barrier 與投擲武器限制；目前網頁版尚未接 Barrier／武器類型資料，因此不先造假判定。

原 AttackSeq 還有一個 Guardian 特例：如果代擋後計算傷害恰好是 0，會強制改成 NORMAL 並給 **1 點傷害**。V0.38 已保留。

### 忠犬與反擊

原普通 `BATTLE_Attack()` 一旦 Guardian 成功代擋，就會把回傳 `iRet` 設為 FALSE，所以該次直接攻擊之後**不進普通 Counter loop**。V0.38 同樣在 guardian interception 發生後停止反擊鏈。

另一方面，`BATTLE_Counter()` 明確只允許：

- `BATTLE_COM_ATTACK`
- `BATTLE_COM_S_NOGUARD`

作為反擊者。

`BATTLE_COM_S_GUARDIAN_ATTACK` 不在允許清單，所以忠犬自己使用技能攻擊別人後，對方仍可能先反擊牠，但忠犬不能再反反擊回去。V0.38 已將 Guardian skill 的 `counterEligibleThisTurn` 保持關閉。

來源的 `BATTLE_Counter()` 雖然也呼叫 `BATTLE_AttackSeq`，但之後沒有像 `BATTLE_Attack()` 一樣用回傳 Guardian 去替換真正扣 HP 的 defindex，這段原碼本身存在不對稱。V0.38 不額外猜測修補這個 counter-only 行為；忠犬的正式代擋目前精準套用在普通 `BATTLE_Attack` 路徑，包括玩家／寵物普通攻擊與混亂強制普通攻擊。

目前 Enemy AI 中：

- 12 個 Enemy 模板資料帶有 Skill 20
- 其中 **2 個 Enemy 模板**對應 AI 權重大於 0
- 實際會抽到忠犬的 Enemy ID：657、861

### 加工為何不接戰鬥效果

ID 200「加工」雖然出現在 Enemy AI 資料，而且 Enemy 2213 對它有實際權重，但原 `PETSKILL_Merge()` 一開始會取得主人後檢查：

`CHAR_WORKBATTLEMODE != BATTLE_CHARMODE_NONE`

只要正在戰鬥就直接 `return FALSE`。

因此把加工硬改成攻擊、Buff 或合成戰鬥技反而會偏離來源。V0.38 現在對這個 AI 結果明確記錄「原版戰鬥中拒絕執行，本回合沒有效果」，不再把它列成未知技能。

到 V0.38 為止，目前「有可辨識函式名、而且 Enemy AI 有實際權重」的 PetSkill，除了需要外部 `magic.txt / attmagic.bin` 才能精準還原的 `PETSKILL_AttackMagic` 外，其餘這一批已知核心分支都已有對應處理或原版 no-op 判定。

## V0.39 Enemy 專屬復活／回復／招喚與嗜血技

V0.39 開始補目前 `stoneage_petskill_runtime.json` 尚未收錄、但 `enemy1` AI 已實際引用的技能 ID。

這一輪先接：

- ID 121「T地球一周」：`PETSKILL_EarthRound`，option `攻%+200`
- ID 500「E復活術」：`ENEMYSKILL_ReLife`
- ID 501「E回復技」：`ENEMYSKILL_ReHP`
- ID 502「E招喚」：`ENEMYSKILL_EnemyHelp`
- ID 503「嗜血技」：`PETSKILL_DamageToHp`，option `30|50`

### petskill2.txt 同序列資料對齊

原 `gavinlinasd/StoneAge` GitHub 沒有附完整執行時 `petskill.txt / petskill2.txt`，因此部分條件編譯技能只有 header 巨集 ID，沒有名稱與 option。

本輪另外找到 `zii/pet-sim/bin/data/petskill2.txt`，並沒有直接把它整份視為目前版本，而是先用本專案已經確認的技能做 ID 空間比對。

已比對一致的錨點包含：

- 20 忠犬
- 30 突擊
- 31 雙重突擊
- 40 一擊必殺
- 50／51／52 背水之戰
- 60／61 毒攻擊
- 80 石化攻擊
- 90 混亂攻擊
- 100 泥醉攻擊
- 110 催眠攻擊
- 120 地球一周
- 130 旅程伙伴
- 140 偷竊
- 150 不防守戰法
- 200 加工
- 210 落馬術
- 301／312 AttackMagic

上述 ID、函式與 option 幾乎全部一致；個別後期數值存在版本修訂差異，因此後續仍以「目前 runtime + C 原碼 + 同序列資料三方交叉」為原則，不會只靠 header 巨集猜 ID。

### ID 121 T地球一周

同序列資料確認：

`T地球一周,PETSKILL_EarthRound,攻%+200,...,121`

它與 ID 120 使用同一個 `PETSKILL_EarthRound` 函式，只是攻擊倍率不同。

V0.36 已經完成 EarthRound 的兩階段狀態機，因此 V0.39 只需補 metadata，即可完整沿用：

1. 本回合繞背並暫時不可被指定
2. 下一個自身回合重新現身
3. `攻%+200` 對應最終 `×3.00` 傷害
4. 原鎖定目標無效時沿用現有目標調整規則

目前 AI 中 ID 121 實際出現在 **12 個 distinct Enemy ID**，總權重 73。

### ID 500 E復活術

原 `BATTLE_E_ENEMYREFILE()` 會從同側倒地成員隨機挑一名。

基礎復活量：

`pow = maxHP / 2`

之後 `BATTLE_MultiRessurect()` 再做：

`RAND(pow × 0.9, pow × 1.1)`

並：

- 最低 1 HP
- 最高不超過 maxHP
- 原 Battle Entry 不重新編號
- 復活者不會插進已建立的當回合速度排序，因此下一回合才恢復行動

V0.39 保留這些規則。

目前 AI 中 ID 500 實際出現在 **22 個 distinct Enemy ID**，總權重 121。

### ID 501 E回復技

原 `BATTLE_E_ENEMYREHP()` 候選條件是：

`HP < maxHP × 2 / 3`

只從符合條件的存活敵方中隨機挑一名。

回復 power：

`RAND(100, maxHP)`

實際 HP 上限仍為 maxHP。

V0.39 已接入同樣的「低於 2/3 才可被選中」與隨機回復流程。

目前 AI 中 ID 501 實際出現在 **72 個 distinct Enemy ID**，總權重 344；它是目前最常見的未解析 Enemy 專屬技能之一。

### ID 502 E招喚

原 `BATTLE_E_ENEMYHELP()`：

1. 先找敵方 10 格 Entry 是否有空位
2. 以施術者自己的 Enemy template / PetID 找回原 Enemy array
3. 生成相同模板
4. 等級為：

`RAND(LV × 0.8, LV × 1.2)`

5. 再用 `BATTLE_NewEntry()` 塞進第一個空位

V0.39 的 web runtime 已保存每隻 Enemy 的 `sourceTemplate`，援軍建立時重新走現有 `makeEnemyUnit()`，因此會一起套用：

- 原 Enemy 能力生成
- RandomChange
- PetSkill
- AI
- 掉落生成
- EXP 基礎資料

而不是複製當前 HP／能力成一個假 clone。

battleSlot 會找第一個真正空位；倒地 Enemy 仍占原 slot，已離場／捕獲而從 `enemy.units` 移除的 slot 才可重新使用。

目前 AI 中 ID 502 實際只出現在 **2 個 distinct Enemy ID**，總權重 7。

### 500／501／502 失敗時不是空過回合

原 `battle.c` 的三個分支都有同一個容易漏掉的 fallback：

若：

- 500 沒有可復活的倒地目標
- 501 沒有 HP < 2/3 的存活目標
- 502 沒有空位／招喚失敗

特殊函式回傳 FALSE 後，原碼會立刻：

`BATTLE_Attack(...)`

也就是改做普通物理攻擊，而不是浪費整回合。

V0.39 已在第二輪回歸補回這個 fallback。

### ID 503 嗜血技

同序列 option：

`30|50`

資料說明是「攻擊力下降 30%，將傷害 50% 轉為己用」。

但這個來源版 `PETSKILL_DamageToHp()` 有一個實際 C 整數除法行為：

`def = (atoi(buf1) / 100)`

其中 `atoi(buf1)` 與 `100` 都是整數，所以：

`30 / 100 == 0`

之後才把 0 指派給 float。

因此這個來源的 503 **實際不會套到 -30% 攻擊**，雖然技能文字如此描述。

V0.39 選擇忠實保留程式實際行為：

- 物理攻擊力不因第一欄 30 而下降
- 正傷害後：
  `heal = damage × 50 / 100`
- 回復不超過自身 maxHP
- 先完成吸血，再進原本的 Counter loop
- 技能 command 本身不是普通 ATTACK，因此對手可反擊，但施術者不能再反反擊

目前 AI 中 ID 503 實際出現在 **23 個 distinct Enemy ID**，總權重 76。

## V0.40 狂暴攻擊／破除防禦之2

V0.40 再接兩個高使用量純物理技能：

- ID 541「狂暴攻擊」：`PETSKILL_WildViolentAttack`
- ID 543「破除防禦之2」：`PETSKILL_GuardBreak2`

### ID 541 狂暴攻擊

同序列資料：

`攻%+80 防%-35 回避30`

原 `PETSKILL_WildViolentAttack()` 直接修改本回合：

- 攻擊：FIXSTR +80%
- 防禦：FIXTOUGH -35%
- `回避30` 被存成 `gBattleDuckModyfy`

而 `BATTLE_DuckCheck()` 會：

`per += gBattleDuckModyfy`

所以這不是「自己回避 +30」，而是**被攻擊目標的閃避率額外 +30 個百分點**，也就是技能命中率下降。

更重要的是，原 `battle.c` 在此 command 下：

`attack_max = RAND(3,10)`

`gDamageDiv = attack_max`

因此狂暴攻擊會：

- 隨機 3～10 段
- 每段都走普通物理 Attack
- 每段正傷害最後再除以本次總段數
- 目標死亡時後續段數可經 TargetAdjust 改打其他存活目標
- 全部多段處理完後，才使用最後一次 `BATTLE_Attack` 的結果進一次 Counter chain

另外原 direct-attack 群組會在真正攻擊前把 command 改回 `BATTLE_COM_ATTACK`，所以使用狂暴攻擊的單位在反擊鏈中仍具備普通 ATTACK 的反反擊資格。

V0.40 已對齊以上行為。

目前 AI 中 ID 541 實際出現在 **21 個 distinct Enemy ID**，總權重 78。

### ID 543 破除防禦之2

同序列說明：

「敵防禦時攻 +30%，敵非防禦時攻 -30%」

原 `BATTLE_AttackSeq(..., BATTLE_COM_S_GBREAK2)` 的真正順序是：

1. 先完成普通閃避／Guardian／會心／基礎傷害
2. 若目標 command 是 GUARD：
   `damage ×= 1.3`
3. 否則：
   `damage ×= 0.7`
4. **之後**才檢查一般 GUARD，並套 `BATTLE_GuardAdjust()`

所以它不是「防禦時無視防禦」；防禦目標雖先得到 ×1.3，但仍會再被防禦減傷。

為了不破壞既有技能，V0.40 在 `resolveNormalAttack()` 新增可選的：

`preGuardDamageMultiplier`

只有需要這種 AttackSeq 順序的技能才會傳入，原有所有技能預設仍為 1。

反擊規則也依 `BATTLE_S_GBreak2()` 保留：

- 非防禦目標：MISS／DODGE／NORMAL 可進一次對方反擊
- CRITICAL 不進
- 防禦中會把 iRet 強制 FALSE，不進反擊
- GBreak2 command 本身不是 ATTACK，因此施術者被反擊後不能再反反擊

目前 AI 中 ID 543 實際出現在 **16 個 distinct Enemy ID**，總權重 41。

### 目前下一批高優先技能

經 V0.40 後，已確認同序列且 AI 使用量高的下一批包括：

- ID 508「MP攻擊3」：47 個 distinct Enemy，總權重 127
- ID 640「憾甲一擊」：43 個 distinct Enemy，總權重 130
- ID 616「撕裂傷口2」：25 個 distinct Enemy，總權重 47
- ID 580「沉默」：21 個 distinct Enemy，總權重 47
- ID 613「狂亂暴走」：20 個 distinct Enemy，總權重 42

508 雖然使用量高，但目前 web 玩家／寵物戰鬥模型尚未建立 MP，因此暫不以假 MP 數值硬接。

640／616 都已有名稱、函式與 option，下一輪可直接往其 C 戰鬥分支繼續還原。

## V0.41 撕裂傷口2／憾甲一擊

V0.41 接入兩個 Enemy AI 高使用量純戰鬥技能：

- ID 616「撕裂傷口2」：`PETSKILL_BattleTearDamage`，option `50`
- ID 640「憾甲一擊」：`PETSKILL_Regret`，option `命%20 攻%30 防%-50`

### 616 撕裂傷口2

原 `PETSKILL_BattleTearDamage()` 不是單純「普攻傷害 ×1.5」。

技能下達時會先把本回合能力改成：

- 攻擊：`FIXSTR × 0.9`
- 防禦：`FIXTOUGH × 0.8`

之後 `BATTLE_S_AttackDamage()` 先做普通 `BATTLE_AttackSeq()`，再計算：

`missingHP = maxHP - currentHP`

`tearBonus = missingHP × atoi(option) / 100`

ID 616 的 option 是 50，因此追加的是「目標目前已損失 HP 的 50%」。

來源還有一個很特殊的判定：

`if(userhp <= 0) damage = 0;`

也就是目標滿血、沒有舊傷時，撕裂傷口會把原本的物理傷害一起歸零，而不是照常打一發普通攻擊。

V0.41 已依這個實際 C 行為接入。

### 640 憾甲一擊

原 `PETSKILL_Regret()` 讀取：

- `攻%30`
- `防%-50`
- `命%20`

傷害公式另有專用特例。

一般 `BATTLE_DamageCalc()` 會以戰鬥防禦力計算；但攻擊者 command 是 REGRET / REGRET2 時，來源直接改成：

`defense = CHAR_WORKFIXTOUGH`

因此「無視裝備防禦」不是把防禦變成 0，而是只保留 FIXTOUGH 基礎耐力防禦。

Web 版新增 `useFixedToughDefense`，只供這類技能使用，不改其他攻擊公式。

### 前後排貫穿

原 battle slot 5～9 / 15～19 是後排；憾甲命中後排時會再取：

`defNo2 = defNo - 5`

也就是再打同欄前排。

目前放置版的玩家側以「Player + Active Pet」作為兩個獨立戰鬥單位，因此：

- 選中 Player：只打一段
- 選中 Active Pet：先打 Pet，再貫穿 Player

第二段 REGRET2 會在 **GuardAdjust 前**先：

`damage ×= 0.8`

V0.41 初版曾把這個倍率放在最終傷害階段，第二輪 C 原碼回歸後已修正為 `preGuardDamageMultiplier = 0.8`。

### 憾甲暈眩

REGRET 與 REGRET2 都各自解析 `命%`。

它使用的是 `PROFESSION_BATTLE_StatusAttackCheck`，不是一般毒／睡眠的等級與抗性公式：

- 目標已有其他異常狀態 → 失敗
- 否則固定做 `RAND(1,100) < Success`
- 640 Success = 20
- 成功後設為暈眩 1 回合，並把當前 command 清成 NONE

來源這段判定沒有要求物理傷害成功，因此 MISS／DODGE 後仍可能暈眩。

Web battle status 已增加 `dizzy`，並依目前倒數模型校正成只跳過 **一次**未來行動。

### 特殊技能反擊回歸修正

重新搜尋完整 `battle.c` 後確認，普通 `BATTLE_Counter()` loop 只存在 direct-attack 群組後方。

下列特殊 command 都是呼叫專用函式後直接 `break`：

- `BATTLE_COM_S_DAMAGETOHP`
- `BATTLE_COM_S_PETSKILLTEAR`
- `BATTLE_COM_S_REGRET`
- `BATTLE_COM_S_GBREAK2`

因此 V0.41 第二個修正 commit 統一移除了：

- 503 嗜血技的人工作用反擊
- 616 撕裂傷口的人工作用反擊
- 640 憾甲一擊的人工作用反擊
- 543 破除防禦之2的人工作用反擊

避免把特殊事件函式錯當成普通 BATTLE_Attack 分支。

## V0.42 同函式變體／狂亂暴走／疾速攻擊

V0.42 利用已驗證的同序列 `petskill2.txt`，把已完成函式的其他實際 AI ID 一起補齊。

### 嗜血變體

- 504「嗜血技2」：`PETSKILL_DamageToHp`，option `20|70`
- 505「嗜血技3」：`PETSKILL_DamageToHp`，option `10|100`

來源 `atoi(buf1)/100` 的 C 整數除法 bug 同樣存在，因此 20/100、10/100 仍先得到 0。

實際有效差異是吸血比例：

- 504：傷害 70%
- 505：傷害 100%

### 撕裂傷口變體

共用 V0.41 的 Tear 狀態機：

- 615 撕裂傷口1：option `20`
- 616 撕裂傷口2：option `50`
- 656 撕裂傷口3：option `70`
- 651 撕裂傷口4：option **`150`**

651 的說明文字與 option 不完全一致；來源戰鬥函式實際只做 `atoi(option)`，因此 web 版依資料實值 150，不自行改寫成文字描述的 100。

### 666 T憾甲一擊

同序列 option：

`命%30 攻%60 防-20%`

原 `PETSKILL_Regret()` 搜尋的是字面 `防%`，但這筆資料寫成 `防-20%`，因此來源本身不會解析到防禦修正。

V0.42 同樣保留：

- 攻 +60%
- 暈眩固定 30%
- 不額外猜測防禦 -20%

### 613 狂亂暴走

`PETSKILL_AttackCrazed`，option `3`。

來源技能下達時固定：

- 攻擊 80%
- 防禦 70%
- 攻擊次數 = option → 3

`BATTLE_TargetListSet()` 會為每一擊從敵方存活成員隨機取目標。

它位於 direct-attack 群組，因此三次攻擊全部完成後，再使用最後一擊的目標／結果進普通 Counter loop。

Web 版目前玩家側只有 Player + Active Pet，因此每一擊在兩個仍存活單位中隨機挑選。

### 542 疾速攻擊

同序列資料寫：

`防%-30 敏%+30`

但這個來源的 `PETSKILL_SpeedyAttack()` 實際只搜尋並套用 `防%`，完全沒有讀取 `敏%`。

因此 V0.42 忠實保留 C 行為：

- 防禦 -30%
- QUICK 不增加
- 接著進 direct-attack 普通物理攻擊流程

不以技能說明文字補一個來源程式沒有執行的敏捷 Buff。

## V0.43 群蝠四竄

ID 633「群蝠四竄」：

- `PETSKILL_BatFly`
- 原 command：`BATTLE_COM_S_BAT_FLY`
- 原處理：`BATTLE_BatFly()`

這是一個完全獨立於普通物理傷害系統的百分比吸血技能。

### 原 BATTLE_BatFly 規則

它先取得敵方整側所有 Battle Entry。

對每個未騎乘的獨立戰鬥單位：

- HP >= 10：
  `damage = floor(currentHP / 10)`
- HP < 10：
  `damage = 1`

扣掉的 HP 全部累加進 `addhp`，最後回復施術者：

`attackerHP = min(maxHP, attackerHP + addhp)`

來源若超過 maxHP，實際 HP 仍直接設為 maxHP。

目前 web 的 Player 與 Active Pet 本來就是兩個獨立 Battle Entry，不是原版 RidePet 綁定狀態，因此 V0.43 對兩者各自套用一次 10% 規則。

這個 command 直接呼叫 `BATTLE_BatFly()` 後 `break`，不經：

- `BATTLE_AttackSeq`
- 普通閃避
- 會心
- 屬性物理公式
- GuardAdjust
- 普通 Counter loop

V0.43 已依此接入。

目前 Enemy AI 中 ID 633 有 **5 個 distinct Enemy ID** 帶正權重，總權重 40。

### 目前暫不硬接的高使用技能

以下技能資料與 C 原碼都已找到，但各自依賴目前 web 尚未建立的正式系統，因此不做假的簡化版：

- **508 MP攻擊3**：會直接傷害 MP；目前 Player／Pet battle model 沒有 MP
- **634 分身地裂**：先使玩家 MP 減半，再做整側百分比 HP 傷害；缺正式 MP
- **624 火線獵殺**：80% 物理攻擊後，再呼叫 `BATTLE_MultiAttMagic_Fire(...,2,200)` 做火屬性範圍魔法；需要魔法攻擊等級、抗性與魔法閃避演算法

後續仍遵守「能完整還原才接入；缺底層系統就先標記依賴，不用猜數值」的原則。

## V0.44 BattleModel 分身攻擊

V0.44 接入共用函式 `PETSKILL_BattleModel`，目前啟用 Enemy AI 有正權重的三筆：

- 590「虎虎生威」：`5|5|石|3|30|攻%15|100871 100872`
- 655「虎虎生威」：同上
- 689「Q雷分身術」：`5|5|障|3|30|攻%10|101996`

### option 格式

原 `PETSKILL_BattleModel()` 依序解析：

1. 攻擊 type
2. 攻擊物件數
3. 異常狀態
4. 狀態 turn
5. 狀態命中基準
6. 能力修正
7. 動畫圖號

這三筆的 type 都是 5。

`5 & 0x4 != 0`，因此是**物理攻擊**；同時 `5 & 0x1 != 0`，所以攻擊物件比目標少時仍要覆蓋全部目標。

目前三筆 objectNum 都是 5。

### 5 發目標分配

原 `BATTLE_BattleModel()` 先取得敵方整側 Entry 列表。

當 objectNum >= 存活目標數時：

1. 每個目標先各分配一發
2. 剩餘攻擊物件再從原始目標列表隨機挑選

目前 web 玩家側是 Player + Active Pet。

兩者都存活時：

- 第 1 發 → Player
- 第 2 發 → Active Pet
- 第 3～5 發 → 在最初兩個目標中隨機

若中途目標已死亡，原 `BATTLE_BattleModel_ATTACK()` 的 TargetCheck 會直接略過該次攻擊，不重新抽另一個目標；web 版也保留此行為。

### 每發都是獨立物理 AttackSeq

每一個 AttackObject 都會獨立：

- 閃避
- 會心
- 物理傷害
- GuardAdjust
- 傷害後解除睡眠
- 狀態命中檢定

但整個 `BATTLE_COM_S_BATTLE_MODEL` 是獨立 command，結束後直接 break，因此**不進普通 BATTLE_Counter loop**。

### 攻擊能力修正

590／655：

`攻%15`

所以本回合 BattleModel 攻擊力為基礎攻擊 +15%。

689：

`攻%10`

所以本回合攻擊 +10%。

### BattleModel 狀態命中公式

原碼呼叫：

`BATTLE_StatusAttackCheck(attacker,target,status,effectHit,30,1.0,...)`

與一般 StatusChange 的參數不同。

V0.44 因此把 status chance helper 擴充成可傳：

- `perOffset = effectHit` → 目前三筆都是 30
- `range = 30`
- `bai = 1.0`

並保留：

- 目標已有其他異常狀態時不再套
- 體力占四圍比例造成的抗性項
- 攻守等級差
- 上限 80%

每一發傷害 > 0 且目標仍存活時，都各自做一次狀態檢定。

### 石化與魔障

590／655：

- 狀態：石化
- turn = 3
- 原命中基準 = 30

689：

- 狀態：魔障
- turn = 3
- 原命中基準 = 30

V0.44 新增 `barrier` battle status，與原 `BATTLE_CanMoveCheck()` 一樣視為不能行動。

### BattleModel 的 turn 不可直接用一般 StatusChange

一般狀態攻擊來源會寫：

`StatusTbl[...] = gBattleStausTurn + 1`

但 `BATTLE_BattleModel_ATTACK()` 寫的是：

`StatusTbl[iEffect] = iTurn`

沒有 +1。

因此 V0.44 新增 `battleStatusApplyRaw()`，讓 BattleModel 直接保存原始 turn 值，不套一般 StatusChange 的 +1 轉譯。

原 `BATTLE_StatusSeq()` 會先以舊狀態值決定本回合能否行動，再扣倒數，因此 raw turn=3 仍能正確對應來源的封鎖行動流程。

魔障在來源 `BATTLE_StatusSeq()` 看似會把倒數加回去，是因為同一來源在能力重算路徑另有 `CHAR_WORKBARRIER - 1`；web 沒有兩條重複倒數路徑，所以由 battle status 單一路徑每次扣 1 是等價轉譯。

### 同一個 5-hit 內的 Guard 清除

`BATTLE_BattleModel_ATTACK()` 若成功套用：

- 石化
- 魔障
- 麻痺
- 睡眠

會立即把目標 command 改為 NONE。

因此若 Player 原本本回合選擇 Guard，第一發成功石化／魔障後，後續分身再打 Player 時已不應繼續套 GuardAdjust。

V0.44 第二輪回歸已把這個同回合狀態帶入後續攻擊物件。


## V0.45 魔障／正權重同函式變體

V0.45 繼續只掃 **Enemy AI 對應權重大於 0** 的 PetSkill，並維持：

- 原 C 實際程式規則優先
- `stoneage_petskill_runtime.json` 可直接確認時優先使用
- runtime 缺資料時，以已對齊 ID 空間的 `petskill2.txt` 補名稱／函式／option，再回原 C 驗證
- 需要 MP、AttackMagic 或尚未建立的魔法底層時暫緩
- 找不到函式／option 對應時不猜技能效果

### 同函式變體補齊

下列技能的函式已在前版完成，所以 V0.45 只補來源 metadata，直接沿用同一套 C 規則：

- ID 14「T六段攻擊」：`PETSKILL_ContinuationAttack`，option `6`
- ID 15「T七段攻擊」：option `7`
- ID 16「T八段攻擊」：option `8`
- ID 17「T九段攻擊」：option `9`
- ID 53「背水之戰之其３」：`攻%+70 防%-65`
- ID 54「T背水之戰之其４」：`攻%+100 防%-70`
- ID 605「三重突擊」：`3 攻%+150`
- ID 671「暴走」：`攻%+115 防%-25 回避10`
- ID 708「石化攻擊」：`石 turn 9 攻%-30`

目前 Enemy AI 正權重統計：

| Skill | distinct Enemy ID | 正權重總和 |
| --- | ---: | ---: |
| 14 | 5 | 13 |
| 15 | 4 | 12 |
| 16 | 1 | 15 |
| 17 | 6 | 33 |
| 53 | 4 | 4 |
| 54 | 9 | 28 |
| 605 | 6 | 8 |
| 671 | 1 | 4 |
| 708 | 1 | 1 |

#### 671 仍以 option 為準

同序列資料的技能說明寫「攻擊力加 120%」，但真正 option 是 `攻%+115 防%-25 回避10`。
原 `PETSKILL_WildViolentAttack()` 是直接解析 option，因此 V0.45 使用 **+115%**，不把說明文字自行改成 +120%。

### ID 579／594 魔障

- 579「魔障」：`PETSKILL_Barrier`，`障 turn 1 成 50`
- 594「究極魔障」：`PETSKILL_Barrier`，`障 turn 3 成 50`

AI 正權重：

- 579：2 個 distinct Enemy ID，總權重 4
- 594：10 個 distinct Enemy ID，總權重 23

原 `PETSKILL_Barrier()` 本身只下達 `BATTLE_COM_S_BARRIER`，並把技能 array 留在 COM3；真正效果在 `BATTLE_S_Barrier()`。

### 原 BATTLE_S_Barrier 精確流程

來源會從 option 解析 `turn` 與 `成`（Success），接著：

1. `BATTLE_MultiList(battleindex, defNo, ToList)` 取得目標整側
2. 對每個目標各自呼叫 `BATTLE_StatusAttackCheck(attacker, target, BATTLE_ST_BARRIER, Success, 30, 1.0, ...)`
3. 成功時寫入 `CHAR_WORKBARRIER = turn + 1`

因此 579／594 **不是 AttackMagic，也沒有魔法傷害數值**；它們只是使用特殊 command 對整側做狀態檢定。

V0.45 對應為：

- 目標：目前 Player + Active Pet 的所有存活 Battle Entry
- `perOffset = Success`
- `range = 30`
- `bai = 1.0`
- 使用一般異常狀態互斥規則
- 成功後沿用既有 `battleStatusApply()` 的 `turn + 1` 倒數
- barrier 存續期間沿用 V0.44 已接的「不能行動」

579 Success=50、turn=1；594 Success=50、turn=3。

### 魔障不走攻擊與反擊

原 `BATTLE_COM_S_BARRIER` 不呼叫 `BATTLE_AttackSeq`、不造成物理／AttackMagic 傷害；執行 `BATTLE_S_Barrier()` 後直接 break，也不進普通 Counter loop。V0.45 同樣不把魔障偽裝成普通攻擊。

### 這輪掃到但仍暫緩的項目

仍明確依賴目前尚未建立底層的技能：

- 508「MP攻擊3」：需要正式 MP
- 580「沉默」：效果是禁止咒術；正式施法／咒術 command 尚未接入前不做假的替代效果
- 624「火線獵殺」：物理攻擊後還會接 `BATTLE_MultiAttMagic_Fire`
- 634「分身地裂」：會處理 MP
- 301～325 `PETSKILL_AttackMagic`：仍缺正式 `magic.txt / attmagic.bin` 對應

另外有一批 Enemy AI 正權重 ID 在目前 runtime 與已驗證同序列資料中仍沒有可可靠對上的函式／option，例如 515、513、589、512、518、114、111、112、645、510、113、560、18、729、745、65、558、588；這些仍維持 **未知即不猜**。

本輪後續掃描也已找到一些「不依賴 MP／AttackMagic、但需要再逐條核對其專用 C command」的候選：

- `PETSKILL_Modifyattack`
- `PETSKILL_Mdfyattack`
- `PETSKILL_Weaken`
- `PETSKILL_Gyrate`
- `PETSKILL_Sonic`
- `PETSKILL_SetDuck`
- `PETSKILL_Retrace`
- `PETSKILL_Sacrifice`
- `PETSKILL_Refresh`

它們不會先依技能文字猜效果，等各自 battle command／狀態欄位確認完整後再接。

## V0.46 追跡／回旋／音波／屬性攻擊

V0.46 接入五組不依賴 MP／AttackMagic 的正權重 Enemy PetSkill：

- `PETSKILL_Retrace`：713 追跡攻擊
- `PETSKILL_Gyrate`：619／653 回旋攻擊
- `PETSKILL_Sonic`：618 音波衝擊
- `PETSKILL_Modifyattack`：544／545／546／825～828 屬性強化攻擊
- `PETSKILL_Mdfyattack`：548～551 屬性轉換攻擊

### 713 追跡攻擊

同序列資料的 option 是 `攻%+100`，但原 `PETSKILL_Retrace()` 內解析攻擊百分比的整段程式被註解掉，因此首擊完全不吃 +100%。

真正規則在 `battle.c`：

- 先做一次普通物理攻擊
- 只有第一發回傳 `BATTLE_RET_DODGE` 時才檢查追擊
- 判定為嚴格 `RAND(1,100) < 80`，也就是成功值 1～79
- 成功後把攻擊力硬編碼為 `FIXSTR + FIXSTR × 0.2`
- 對同一目標再做第二次 `BATTLE_Attack()`

第二發的 `BATTLE_Attack()` 回傳值沒有覆寫原本的 `ContFlg`，所以後面的普通 Counter loop 仍以第一發結果為準。V0.46 保留這個不對稱。

### 619／653 回旋攻擊

`PETSKILL_Gyrate()` 會先依 option 修改本回合攻擊力：

- 619：`攻%-50`
- 653：`攻%+20`

之後原 `battle.c` 不走單體 TargetAdjust，而是依原目標所在 slot 判定前／後排，掃該五格所有存活單位並各呼叫一次 `BATTLE_Attack()`。

目前 web 玩家側只有 Player + Active Pet：Player 對應人物排、Active Pet 對應寵物排，因此現階段每排最多只有一個目標；仍保留原排別語意，沒有把技能擴成錯誤的全體攻擊。

這個特殊分支處理完直接離開 command case，不進共用 Counter loop。

### 618 音波衝擊

原版先對正常目標做 `BATTLE_COM_S_SONIC`。

若目標 slot 是寵物列 5～9／15～19，接著固定取 `defNo - 5` 找主人，再做一次 `BATTLE_COM_S_SONIC2`。

`SONIC2` 在 `BATTLE_AttackSeq()` 內的順序是：

1. 正常算出物理傷害
2. `damage ×= 0.5`
3. 之後才套 GuardAdjust

因此 V0.46 用 `preGuardDamageMultiplier = 0.5`，不是在最終傷害階段才除二。即使第一發閃避／MISS，只要主人仍存在，來源仍會執行第二發；web 版同樣如此。

### 544～546／825～828 屬性強化攻擊

`PETSKILL_Modifyattack()` 本身只下特殊 command；真正追加傷害在 `BATTLE_S_Modifyattack()`。

普通 `BATTLE_AttackSeq()` 已先完成原本物理傷害與屬性修正，若結果 `damage > 0`，再依 option：

`屬性碼 | 百分比`

取得目標指定屬性值 `ModNum`。只有 `ModNum > 0` 才加成：

`def = optionPercent / 100 + (rand() % (ModNum + 5)) / 100`

`damage += damage × def`

其中 damage 是 int，所以最後仍以 C 整數轉型語意截斷。

因此 825～828 的 `9999` 不是『攻擊力 +9999%』，而是普通傷害算完後追加約 99.99 倍以上的指定屬性特攻；V0.46 不把它誤做成攻擊能力值倍率。

### 548～551 屬性轉換攻擊

`PETSKILL_Mdfyattack()` 解析：

- EA → 地
- WA → 水
- FI → 火
- WI → 風

以及第二欄數值。目前四筆都是 100。

原 `BATTLE_AttrAdjust()` 在 command 是 `MDFYATTACK` 時會把攻方四屬全部清 0，再只把指定屬性設成 option 數值；也就是只對**本次物理攻擊**使用純 100 指定屬性，不永久改角色屬性。

V0.46 以一次性 attacker battle view 做相同覆寫。

### 正權重覆蓋

| Skill | distinct Enemy ID | 正權重總和 |
| --- | ---: | ---: |
| 544 | 1 | 3 |
| 545 | 1 | 3 |
| 546 | 1 | 3 |
| 548 | 2 | 4 |
| 549 | 2 | 4 |
| 550 | 1 | 1 |
| 551 | 3 | 7 |
| 618 | 2 | 6 |
| 619 | 1 | 2 |
| 653 | 5 | 6 |
| 713 | 4 | 4 |
| 825 | 4 | 16 |
| 826 | 1 | 4 |
| 827 | 1 | 4 |
| 828 | 1 | 4 |

以上五組皆為獨立特殊 command；除 713 追跡攻擊本身落入原 direct-attack 共用流程外，其餘不額外人工加入普通 Counter loop。

## V0.47 虛弱／劇毒／閃避術

V0.47 接入三組不依賴 MP／AttackMagic 的正權重 Enemy PetSkill：

- 575「虛弱」：`PETSKILL_Weaken`，`虚 turn 3 成 50`
- 576「全體虛弱」：同函式／同 option，目標為敵方整側
- 577「劇毒」：`PETSKILL_Deeppoison`，`剧 turn 5 成 50`
- 578「全體劇毒」：同函式／同 option，目標為敵方整側
- 595「閃避術」：`PETSKILL_SetDuck`，`3|60`

### 575／576 虛弱

原 `BATTLE_S_Weaken()` 解析 `turn` 與 `成` 後，呼叫：

`BATTLE_MultiParamChangeTurn(..., status, ..., turn, Success)`

`BATTLE_MultiParamChangeTurn()` 對每個目標各做：

`BATTLE_StatusAttackCheck(attacker,target,status,Success,30,1.0,...)`

成功後寫入：

`CHAR_WORKWEAKEN = turn + 1`

原能力重算路徑在虛弱存在時會：

- `FIXSTR × 0.8`
- `FIXTOUGH × 0.8`
- `FIXDEX × 0.8`

然後再把這三項寫入戰鬥攻擊／防禦／敏捷。V0.47 因此只在 battle view 套 0.8，不污染永久角色能力值。

575 使用單體目標；576 依 skill target=3 對玩家側所有存活 Battle Entry 逐一判定。

### 577／578 劇毒

原 `PETSKILL_Deeppoison()` 不是一般 Poison StatusChange，而是呼叫：

`BATTLE_MultiStatusChange(..., status, turn + 2, ..., Success)`

所以 `turn 5` 實際寫入的狀態值是 7。

原 `BATTLE_StatusSeq()` 每次輪到該單位時會先把狀態值減 1，再處理劇毒：

- 狀態值 6、5、4、3、2：各做一次與普通中毒相同的扣血公式
- 狀態值降到 1：若仍未解除，直接令 HP=0
- 若進入劇毒處理時 HP 已 <=1，也直接令 HP=0

因此資料文字『中毒5回合，第六回合前未解則陣亡』與 C 程式實際行為一致。

V0.47 用 raw `turn+2` 倒數保留這個節奏；不是簡化成套五回合後瞬間死亡。

577 為單體；578 為敵方整側。命中判定同樣使用 `Success=50 / range=30 / bai=1.0`。

### 595 閃避術

`PETSKILL_SetDuckChange_Battle()` 明確要求施術目標就是自己；若已有 `CHAR_MYSKILLDUCK > 0`，再次施放不刷新。

option `3|60` 代表：

- 回合數：3
- power：60

真正回避判定在 `BATTLE_CheckMySkillDuck()`，而且發生在普通 DEX 回避公式之前：

`rad = rand() % 100`

`rad > power` → 失敗

`rad <= power` → 直接回避

所以 power=60 的成功值為 0～60，共 **61/100**，不是 60%。

若這個獨立判定失敗，才繼續原本的普通回避公式。

回合數在 `BATTLE_StatusSeq()` 尾端每次自己行動時減 1；技能施放當回合是在 StatusSeq 後才寫入，因此有效區間涵蓋施放回合與之後兩輪，第三次未來自身行動開始前歸零。

V0.47 以 Enemy 專屬 `skillDuckTurns / skillDuckPower` 保存，不把它錯誤轉成一般 `duckBonus +60`。

### 正權重覆蓋

| Skill | distinct Enemy ID | 正權重總和 |
| --- | ---: | ---: |
| 575 | 6 | 9 |
| 576 | 1 | 3 |
| 577 | 1 | 3 |
| 578 | 2 | 6 |
| 595 | 2 | 5 |

本輪仍未接 580「沉默」：雖然其狀態命中公式已可確認，但原效果核心是禁止非寵物使用咒術頁／施法；在 web 的正式咒術 command 尚未完成前，先不造一個沒有實際作用的假沉默。

## V0.48 淨化／浴血狂襲／排序回歸

V0.48 接入兩個不依賴 MP／AttackMagic、且原 C 路徑完整的正權重技能：

- 592「淨化」：`PETSKILL_Refresh`，option `全`，target=2（ALLMYSIDE）
- 659「T浴血狂襲」：`PETSKILL_DamageToHp2`，option `100`

同時修正前版兩個出手排序差異：

- 542 疾速攻擊：`BATTLE_DexCalc()` 專用 `work + 30%`
- 659 浴血狂襲：`BATTLE_DexCalc()` 專用 `work + 20%`

### 592 淨化

`aszStatus[0]` 明確是「全」。`BATTLE_S_Refresh()` 解析到 status=0 後呼叫 `BATTLE_MultiStatusRecovery()`。

592 的 target=2 對應 `PETSKILL_TARGET_ALLMYSIDE`，因此 Enemy 使用時只處理自己這一側。

`BATTLE_MultiStatusRecovery()` 逐一檢查同側目標目前的 StatusTbl 異常並清 0。原戰鬥系統的異常互斥使同一目標通常只會有一個主要 StatusTbl 異常，因此 web 版直接清除該 Enemy 的目前 battle status。

這個技能不造成傷害，也不進普通 Counter loop。

### 659 T浴血狂襲

同序列資料：

`T浴血狂袭, ... PETSKILL_DamageToHp2,100`

原 `PETSKILL_DamageToHp2()` 本身只下 `BATTLE_COM_S_DAMAGETOHP2`；真正特例分散在排序、AttackSeq 與吸血函式。

#### 出手排序

`BATTLE_DexCalc()`：

`work = CHAR_WORKQUICK + 20`

`dex = work + work * 0.2`

這個 command 不走普通 default 的 `work - RAND(0, work*0.3)`。

#### 會心與攻擊

`BATTLE_AttackSeq()` 先做普通閃避與 Guardian，再先計算正常 `BATTLE_CriticalCheck()`。之後若 command 是 DamageToHp2：

- `perCri = perCri + perCri*0.3`
- `WORKATTACKPOWER = FIXSTR + FIXSTR*0.2`
- `WORKQUICK = FIXDEX + FIXDEX*0.2`

CriticalCheck 本身讀的是 `FIXDEX`，所以 +20% QUICK 不會再反過來提高基礎會心；真正會心增幅就是已算好的 perCri 再 ×1.3。

另外 `BATTLE_CriticalCheck()` 會先把 per 上限壓到 10000，DamageToHp2 再乘 1.3，來源並沒有再次 cap。V0.48 同樣不重新封頂。

#### 吸血

`BATTLE_S_DamageToHp2()` 直接把 option 轉百分比：

`heal = Damage * atoi(option) / 100`

659 option=100，所以回復本次傷害的 100%，最高不超過自身 maxHP。

此技能是 `BATTLE_S_AttackDamage()` 的獨立 command case，battle.c 執行後直接 break，因此不人工加入普通 Counter loop。

### 排序回歸修正

前版曾依 `PETSKILL_SpeedyAttack()` 沒有解析「敏%」而保持 QUICK 不變；重新追到 `BATTLE_DexCalc()` 後確認，542 疾速攻擊仍有 command 專用排序：

`dex = (WORKQUICK + 20) + 30%`

所以 V0.48 新增 command-specific dex mode，只影響回合排序，不把 +30% 當成永久 QUICK buff。

另外 V0.47 的虛弱雖已讓 battle view 攻／防／敏 ×0.8，但 Enemy 排序原本仍直接讀 raw unit.quick。V0.48 改成排序讀當前 enemy battle view，讓虛弱確實影響 Enemy 出手順序。

### 本輪明確暫緩

- 573 救援：HP 公式已確認，但 Enemy AI 對 `PETSKILL_TARGET_OTHER` 的實際敵我側選目標仍需再對齊，不猜目標。
- 582 自爆攻擊：來源 `version.h` 直接標註 `_SKILL_SELFEXPLODE // (不可开) ... 自爆(缺图)`，且本來源沒有可執行函式，因此不按資料文字硬做。

## V0.49 鐵壁／銅牆／大地鎧甲

V0.49 接入三個 Enemy AI 有正權重、且效果完全由 battle 狀態欄位完成、不依賴外部 magic.txt / attmagic.bin 的防禦支援技：

- 552「鐵壁」：`PETSKILL_MagicStatusChange`，`铁壁|3|30|全`
- 565「銅牆」：`PETSKILL_MagicStatusChange`，`铁壁|5|40|全`
- 601「大地鎧甲」：`PETSKILL_SetMagicPet`，`3|15|TGH`

### 552／565 鐵壁系

`PETSKILL_MagicStatusChange_Battle()` 直接解析 option：狀態／turn／nums／單全，並呼叫 `BATTLE_MultiMagicStatusChange()`。

來源 `MagicStatus[]` 中「鐵壁」對應 `CHAR_MAGICSUPERWALL`。對 ALLMYSIDE 每個目標：

- 若任何 MagicTbl 狀態已存在，跳過，不刷新
- 否則 `CHAR_MAGICSUPERWALL = turn`
- `CHAR_OTHERSTATUSNUMS = nums`

物理傷害的真正效果在 `BATTLE_DamageCalc()`：

`def = (CHAR_OTHERSTATUSNUMS + rand()%20) / 100`

`defense += defense * def`

因此：

- 552 不是固定 +30% 防，而是每次物理傷害計算時 **+30～49%**
- 565 不是固定 +40% 防，而是每次物理傷害計算時 **+40～59%**

而且順序是先以 WORKDEFENCEPOWER ×0.70 取得防禦，再套鐵壁，之後才套來源的 Enemy 隨機防禦浮動。V0.49 已照此順序接入。

`BATTLE_MagicStatusSeq()` 在每名角色行動開始前把 MagicTbl 倒數 -1；降到 0 就清除。因此同回合早於目標行動前套上的鐵壁，會在該目標輪到行動時先扣一次，保留原始行動序時序。

### 601 大地鎧甲

`PETSKILL_SetMagicPet_Battle()` 對 ALLMYSIDE 解析：

- turn = 3
- nums = 15
- type = TGH

對每個目標先檢查 `CHAR_MYSKILLDUCK / STR / TGH / DEX`；任一已存在就跳過，不覆寫也不刷新。

成功目標寫入：

`CHAR_MYSKILLTGH = 3`

`CHAR_MYSKILLTGHPOWER = 15`

真正能力加成不在施法函式內。`CHAR_complianceParameter()` 會呼叫 `Other_DefcharWorkInt()`，其中：

`FIXTOUGH += baseTough * 15 / 100`

而 battle 每回合建立參數時會對場上每個角色重新呼叫 `CHAR_complianceParameter()`，再用 `BATTLE_TurnParam()` 建立 WORKDEFENCEPOWER。

因此來源實際時序是：

- 技能在某回合中途套上後，不會倒灌重算該回合已建立的 WORKDEFENCEPOWER
- 下一次 battle turn 建表時才把 TGH +15% 算進防禦
- `BATTLE_StatusSeq()` 尾端在角色自己行動時再把 `CHAR_MYSKILLTGH` 倒數 -1

V0.49 因此用「回合建表快照」保存大地鎧甲，而不是施放瞬間直接永久修改 unit.defense。

### 與虛弱／其他技能的順序

來源 `Other_DefcharWorkInt()` 先處理 MySkill TGH，再處理虛弱 ×0.8。V0.49 保留相同概念：先建立含大地鎧甲的本回合防禦，再由 battle view 套虛弱。

同時把本回合防禦型技能修正建立在大地鎧甲快照之上，避免疾速攻擊／狂亂暴走／撕裂／背水等技能把 TGH Buff 無意覆寫掉。

### 正權重覆蓋

| Skill | distinct Enemy ID | 正權重總和 |
| --- | ---: | ---: |
| 552 | 1 | 1 |
| 565 | 20 | 20 |
| 601 | 6 | 6 |

565 銅牆是目前剩餘支援技中使用面相對高的一筆。

### 仍不硬接

- 573 救援：公式已知，但 Enemy AI 的 `TARGET_OTHER` 實際側別目標仍需再確認。
- 582 自爆攻擊：此來源 `version.h` 明確標成不可開／缺圖，且缺可執行技能函式。
- 580 沉默：狀態本身可解析，但 web 尚未有正式咒術 command 可被禁止。

## V0.50 劇毒攻擊

V0.50 接入 ID 707「劇毒攻擊」：

- `PETSKILL_StatusChange`
- option：`剧 turn 6  攻%+20`
- Enemy AI：2 個 distinct Enemy ID，正權重總和 13

### 與 577／578 劇毒的差異

707 不是 `PETSKILL_Deeppoison`，而是一般 `PETSKILL_StatusChange`。

原流程先在技能準備階段解析 `攻%+20`，因此本回合攻擊力為基礎攻擊 +20%。接著走普通 `BATTLE_Attack()`。

只有物理攻擊造成正傷害後，`BATTLE_Attack()` 才呼叫一般：

`BATTLE_StatusAttackCheck(attacker,target,status,30,40,2.0,...)`

成功後寫：

`StatusTbl[deepPoison] = gBattleStausTurn + 1`

所以 `turn 6` 實際保存 raw 7。

577／578 則是獨立 `BATTLE_S_Deeppoison()`，會先把資料的 `turn 5` 改成 `turn + 2 = 7` 再交給 MultiStatusChange。

兩條路徑最後都可能得到 raw 7，但來源原因不同；V0.50 保留各自的原 C 路徑，不把兩種技能合併成一個假規則。

707 成功套上後仍沿用 V0.47 已完成的劇毒 StatusSeq：前五次狀態行動扣血，第六次仍未解除則倒下。

### 608 E旅程伙伴3 暫緩

608 已確認 option `80` 在 `_BATTLE_ABDUCTII` 下不是裝飾值。

當目標是寵物時，來源改用：

`CHAR_WORKFIXAI < 80` → `per = 200`

否則 `per = 0`。

目前 web 寵物資料沒有 `CHAR_WORKFIXAI`／忠誠／AI 的可對應欄位，因此不能拿等級或其他數值冒充。608 暫不接入，繼續遵守『缺底層就不猜』。

## V0.51 怯戰／狂獅怒吼

V0.51 接入兩個 Enemy AI 有正權重、且原 C 特殊攻擊分支已完整可還原的技能：

- 606「怯戰」：`PETSKILL_BattleTimid`，target=6
- 636「狂獅怒吼」：`PETSKILL_2BattleTimid`，option `-攻%50+敏%30命%60`，target=7

### 606 怯戰

`PETSKILL_BattleTimid()` 不是按資料文字做一般百分比差值，而是直接覆寫本回合戰鬥能力：

- `WORKATTACKPOWER = FIXSTR × 0.7`
- `WORKDEFENCEPOWER = FIXTOUGH × 0.4`
- `WORKQUICK = FIXDEX × 0.8`

因此資料文字雖寫「防禦力 50% 下降」，本來源程式實際只剩 **40% 防禦**；V0.51 以 C 程式為準。

此 command 沒有自己的 `BATTLE_DexCalc()` case，所以排序仍走 default：

`work = modifiedQuick + 20`

`dex = work - RAND(0, work*0.3)`

真正攻擊在 `BATTLE_S_AttackDamage()`。傷害結算完成後：

`timid = rand()%100`

`timid < 15 && damage > 1`

才觸發怯戰效果。

若目標是寵物：

- `BATTLE_PetDefaultExit()`
- `CHAR_DEFAULTPET = -1`

也就是寵物直接退出本場戰鬥。

若目標不是寵物（目前玩家側即 Player）：

- `BATTLE_Exit(defindex,battleindex)`
- `CHAR_DischargePartyNoMsg(defindex)`

也就是玩家本人被迫離開整場戰鬥。

Web 對應為：

- 寵物：加入 `battlePetOutIds`，本場不再出戰
- 玩家：直接結束目前 battle，不計勝利、EXP 或掉落，保留本次已受到的傷害

此技能是獨立 `BATTLE_S_AttackDamage` case，結束後直接 break，不進普通 Counter loop。

### 636 狂獅怒吼

`PETSKILL_2BattleTimid()` 的 option parser 對：

`-攻%50+敏%30命%60`

實際處理為：

- `-攻%50` → `WORKATTACKPOWER = FIXSTR × 0.50`
- `+敏%30` → `WORKQUICK = FIXDEX + FIXDEX×0.30`
- `命%60` → 退寵判定基準 60

沒有防禦 token，所以本回合防禦維持原值。

它同樣沒有專用 DexCalc case，因此用 **130% QUICK** 再走普通 default 隨機排序。

傷害後：

`rand()%100 < 60 && damage > 1`

才進特殊效果；但來源只有 `CHAR_TYPEPET` 分支真正執行。

對寵物會呼叫：

`BATTLE_PetIn(battleindex, defNo-5)`

而原 `BATTLE_PetIn()` 內部確實會：

- `BATTLE_PetDefaultExit(owner,battleindex)`
- `CHAR_DEFAULTPET = -1`

所以它就是把出戰寵物收回寵物欄。

對玩家本人，即使 60% 判定成功，也沒有 `BATTLE_Exit` 或其他附加效果，只保留本次傷害。

### 正權重覆蓋

| Skill | distinct Enemy ID | 正權重總和 |
| --- | ---: | ---: |
| 606 | 1 | 3 |
| 636 | 2 | 2 |

### 仍未接入

- 211 捐獻：已追到 `CHAR_getDefaultChar()`，所有 work-int 預設其實是 **0**，不是 -1；而 `CHAR_WORKPLAYERINDEX` 正好共用 `CHAR_NPCWORKINT1`。Enemy 建立流程沒有另行覆寫它，所以 `BATTLE_StealMoney()` 讀到的 masterindex 是 0。若伺服器 runtime 的 character index 0 當下有有效玩家，來源甚至可能把該玩家誤當主人；若 index 0 無效才會早退。這是依賴伺服器配置／連線分配的來源 bug，web 沒有可等價的 server character index，因此不能武斷固定成 no-op 或偷錢。
- 574 嚙齒術：物理攻擊本身可還原，但核心附加效果是玩家裝備 durability／損壞／消失；web 尚未有對等耐久系統。
- 610／611 光鏡系：依賴 VANISH／REFLEC 等 DamageReact 狀態，尚未建模。
- 625 媚惑術：成功條件與 31% 判定已確認；主要效果是把寵物變成小狐狸並限制只能攻擊／防禦／待機。來源 `BATTLE_DexCalc()` 雖先寫 fox dex ×0.8，但後續普通 command 的 default 分支會再次賦值而覆蓋它；目前 web Active Pet 本來就只有普通攻擊，尚無可被禁用的 PetSkill 指令，因此先不製造假的「敏 -20%」效果。
- 635 黑烏力化：只作用玩家，option `30 180 100388` 對應 30%／180 秒／圖號；核心限制是禁止咒術與職業技能，且持續時間走即時秒數。web 尚無正式咒術／職業技能 command 與跨戰鬥秒數變身系統，暫緩。
- 627／632／637／705 `PETSKILL_Combined`：同序列 option 分別為 `综合法|6|21|139|159|169|179|189`、`综合法|1|240`、`综合法|1|61`、`综合法|1|230`。原 `PETSKILL_Combined()` 不自行執行名稱描述的效果，而是隨機／直接取其中一個數字寫入 `CHAR_WORKBATTLECOM3`，並把 command 設為 `BATTLE_COM_JYUJYUTU`；因此它們本質上直接依賴咒術／魔法底層，不能把「淨化之舞／逆轉／調和」文字拿來仿造效果。

## V0.52 缺失 PetSkill／C_WAIT

V0.52 處理的是原資料裡一批長期被誤認為「未知技能」的 Enemy AI PetSkill。

重新對照本專案採用的原 C build：

- `gavinlinasd/StoneAge`
- ref `1f90cb6cb57c1df70f39cde77a5a8ccd98b66c56`
- `version.h` 明確啟用 `_PETSKILL_OPTIMUM`
- `setup.cf` 在 `_PETSKILL2_TXT` 下讀 `gmsv/data/petskill2.txt`

### `_PETSKILL_OPTIMUM` 真正行為

`PETSKILL_initPetskill()` 讀每一列時，直接把該列的 `PETSKILL_ID` 當成 `PETSKILL_petskill[]` 的 array index。

不存在的 ID 槽位會保持初始化值 `-1`。

`PETSKILL_getPetskillArray(petskillid)` 在此 build 內：

`return PETSKILL_petskill[petskillid].data[PETSKILL_ID]`

因此如果 Enemy 的 PetSkill 欄位引用一個 `petskill2.txt` 根本沒有的 ID，回傳就是 `-1`。

`PETSKILL_Use()` 隨後：

`array = PETSKILL_getPetskillArray(petskillid)`

`if (array == -1) return FALSE`

### AI 抽到缺表技能時不是普通待機

`BATTLE_AllCharaCWaitSet()` 每回合先把所有角色：

- `COM1 = BATTLE_COM_NONE`
- `BATTLEMODE = BATTLE_CHARMODE_C_WAIT`

Enemy AI 之後才呼叫 `PETSKILL_Use()`。

若缺表技能令 `PETSKILL_Use()` 回 FALSE，`BATTLE_ai_normal()` 也回 FALSE；`BATTLE_ai_all()` 不會把該 Enemy 改成 `BATTLE_CHARMODE_C_OK`。

`BATTLE_Battling()` 建立行動序列時雖仍會算 Dex，但真正輪到該角色時先檢查：

`if (CHAR_WORKBATTLEMODE != BATTLE_CHARMODE_C_OK) continue;`

這個判斷位於 `BATTLE_StatusSeq()` 與 `BATTLE_MagicStatusSeq()` **之前**。

所以來源實際效果是：

- 該 Enemy 本回合完全不行動
- 不執行普通 `BATTLE_COM_NONE` 動畫流程
- 不執行自身 StatusSeq
- 不遞減毒／劇毒／虛弱／魔障等 battle status
- 不遞減鐵壁／大地鎧甲等在角色行動點處理的倒數

這和「合法 PETSKILL_None」不同；合法 None 會先成為 C_OK，之後才在 BATTLE_Battling 內走 StatusSeq + NoAction。

### 原 petskill2.txt 缺失、但 Enemy AI 有正權重的 ID

| ID | distinct Enemy ID | 正權重總和 | 正權重槽位 |
| ---: | ---: | ---: | ---: |
| -1 | 110 | 227 | 221 |
| 515 | 11 | 44 | 20 |
| 513 | 5 | 25 | 5 |
| 589 | 9 | 21 | 10 |
| 512 | 5 | 20 | 5 |
| 518 | 2 | 20 | 6 |
| 114 | 12 | 16 | 16 |
| 111 | 3 | 16 | 5 |
| 511 | 5 | 15 | 5 |
| 112 | 3 | 15 | 3 |
| 645 | 10 | 10 | 10 |
| 510 | 5 | 10 | 5 |
| 113 | 1 | 6 | 1 |
| 560 | 1 | 6 | 2 |
| 509 | 5 | 5 | 5 |
| 18 | 1 | 5 | 2 |
| 729 | 4 | 4 | 4 |
| 745 | 4 | 4 | 4 |
| 559 | 1 | 4 | 2 |
| 65 | 3 | 3 | 3 |
| 558 | 1 | 3 | 3 |
| 588 | 1 | 1 | 1 |

V0.52 新增 `ENEMY_SOURCE_MISSING_SKILL_IDS`，當 Enemy AI 抽中以上 ID 時，直接標記為 `sourceSkillMissing`。

在 attack／guard／capture 三條 normalBattleOrder 路徑中，會在 `processBattleStatusTurn()` 前跳過該 Enemy，對齊原 C 的 C_WAIT 行為。

### 這次也釐清了先前的「未知技能」誤區

515／513／589／512／518 等不是另一張尚未找到的技能表，也不是可以用編號推算的隱藏技能。

在這個 build 裡，它們就是 **Enemy 資料引用了不存在的 PetSkill ID**。

因此後續不再為這批 ID 猜名稱、猜函式或嘗試補假效果。

## V0.53 救援／EnemyHELP

V0.53 接入 ID 573「救援」並補正 502 `ENEMYSKILL_EnemyHELP` 的原函式大小寫。

### 573 救援

原 petskill2：

`救援,牺牲自己50%的HP　　补至他人身上,PETSKILL_Sacrifice,,,Af,573,1,1,2,10000,PETSKILL_SACRIFICE`

`PETSKILL_Sacrifice()` 先檢查：

`CHAR_HP > CHAR_WORKMAXHP * 0.2`

只有嚴格大於 20% maxHP 才會成功把 command 設為 `BATTLE_COM_S_SACRIFICE`。

若 HP 不高於 20%，函式直接 `return FALSE`。

對 Enemy AI 而言這個 FALSE 發生在 `BATTLE_ai_all()` 階段；因此和 V0.52 缺表技能相同，Enemy 不會從 C_WAIT 變成 C_OK，該回合在 StatusSeq 前直接被跳過。

V0.53 因此新增 `sourceSkillRejected / sacrifice-low-hp` C_WAIT 分支，而不是把它當成普通「技能失敗動畫」。

### Enemy 使用救援的目標方向

原 `BATTLE_ai_normal()` 先從**對手側 Entry**依 tactics 選出 `result->target`，之後才呼叫：

`PETSKILL_Use(charaindex, skillSlot, result->target, NULL)`

`PETSKILL_Sacrifice()` 本身完全不重選友軍，也不檢查同側。

所以 Enemy AI 抽到 573 時，來源實際上會把玩家或玩家出戰寵物當作救援目標。

這個結果雖然和技能文字直覺相反，但 V0.53 以原執行路徑為準，不改成「自動補 Enemy 隊友」。

### 成功時 HP 公式

`BATTLE_S_Sacrifice()`：

`attacker HP = attacker HP * 0.5`

接著：

`target HP = min(attacker new HP + target HP, target maxHP)`

最後 `Damage = attacker new HP`，也就是畫面顯示／轉移基準用的是**施術者對半後剩餘 HP**。

例如施術者目前 101 HP：

- 施術後自身變 50 HP（C int 截斷）
- 轉移基準也是 50
- 目標最多增加 50 HP，仍受 maxHP 上限限制

即使目標已滿血，施術者仍照樣先損失一半目前 HP。

此技能沒有物理攻擊，也不進普通 Counter loop。

### 502 EnemyHELP 大小寫

原 petskill2 的函式字串是：

`ENEMYSKILL_EnemyHELP`

先前 fallback 寫成 `ENEMYSKILL_EnemyHelp`。目前 generated runtime 沒有 500～502，所以實際遊戲仍會使用 fallback，功能沒有中斷；但若未來 runtime 補齊 502 原字串，舊 dispatch 會因大小寫不符而漏接。

V0.53 已改為：

- fallback 使用原字串 `ENEMYSKILL_EnemyHELP`
- dispatch 同時接受 `EnemyHelp` 與 `EnemyHELP`

避免未來資料補齊後反而失效。

## V0.54 媚惑術／PETFLG

V0.54 接入 ID 625「媚惑術」在 **Enemy AI → 玩家側** 的原 C 實際行為。

原 petskill2：

`媚惑术,使宠物变成小狐狸,PETSKILL_BecomeFox,,,Ae,625,1,1,2,3000,PETSKILL_NONE`

### 先攻擊，再判定是否變狐

`PETSKILL_BecomeFox()` 本身只設定：

- `BATTLE_COM_S_BECOMEFOX`
- 原 AI 已選定 target
- skill array

`battle.c` 把 `BATTLE_COM_S_BECOMEFOX` 放在普通物理攻擊群組中。

進入真正 `BATTLE_Attack()` 前，除 Charge／EarthRound 等少數例外外，command 會被改回：

`BATTLE_COM_ATTACK`

因此它會正常：

- 物理命中／閃避／會心
- 造成普通物理傷害
- 進入 `BATTLE_Counter()` 反擊／反反擊鏈

變成小狐狸的判定是在整段普通攻擊／Counter 流程之後才做。

### 變狐必要條件

來源要求同時成立：

- 本次結果不是 MISS
- 不是 DODGE
- 不是 ALLGUARD
- 不是 ARRANGE
- 目標仍存活
- `rand()%100 < 31`
- 目標 `CHAR_WHICHTYPE != CHAR_TYPEPLAYER`
- 目標 `CHAR_WORK_PETFLG != 0`

因此玩家本人一定不可能被 625 變狐。

### 玩家寵物的 PETFLG 為什麼也是 0

`CHAR_WORK_PETFLG` 與 `CHAR_NPCWORKINT1` 共用 work-int。

來源全域搜尋顯示，真正寫入 `CHAR_WORK_PETFLG` 的戰鬥資料流程是 `ENEMY_createEnemy()`：

`CHAR_setWorkInt(newindex, CHAR_WORK_PETFLG, ENEMY_PETFLG)`

而玩家捕獲後的寵物是透過 `PET_createPetFromCharaIndex()` 重新建立一個新的 `CharNew`：

- `CHAR_getDefaultChar(&CharNew,31010)`
- `CHAR_getDefaultChar()` 把所有 `workint[]` 初始化為 0
- 再複製 HP／能力／屬性／PetSkill 等 data
- **沒有複製 Enemy 的 work-int / PETFLG**
- 後續只設定 `CHAR_WORKPLAYERINDEX` 等玩家寵物欄位

整個來源也找不到其他會替一般玩家寵物補設 `CHAR_WORK_PETFLG` 的路徑。

所以玩家出戰寵物的 `CHAR_WORK_PETFLG` 是 0。

### Web 對應

目前玩家側正是 Player + Active Pet：

- Player：因 `CHAR_TYPEPLAYER` 條件失敗
- Active Pet：因來源等價 `PETFLG=0` 條件失敗

因此 Enemy 使用 625 時，來源可觀察到的效果就是 **一發普通物理攻擊**。

V0.54 沒有建立假的 fox status，也沒有套用資料文字推測的變身效果；直接沿用 `performEnemyPrimaryAttack()`，並把 `counterEligibleThisTurn=true`，保留普通 Counter 鏈。

如果未來 web 加入來源中的 Enemy-side PETFLG 寵物／特殊 NPC 寵物成為玩家側目標，再另外接真正變狐狀態即可；目前不提前猜。

## V0.55 旅程伙伴3／FIXAI

V0.55 接入 ID 608「E旅程伙伴3」，並新增一張只服務於原忠誠 AI 計算的小型 runtime：

`data/generated/stoneage_pet_modai.json`

來源：

- repo：`gavinlinasd/StoneAge`
- ref：`1f90cb6cb57c1df70f39cde77a5a8ccd98b66c56`
- `gmsv/data/enemybase1.txt`
- 欄位：`E_T_MODAI`

原 `enemybase1.txt` 有 1,816 筆可解析列、1,813 個唯一 TempNo；同 TempNo 的重複列沒有 MODAI 衝突。

### FIXAI 原公式

`CHAR_initcharWorkInt()` 對 `CHAR_TYPEPET`：

1. `WORKFIXAI = 0`
2. 取得主人 `CHAR_WORKPLAYERINDEX`
3. `modai = CHAR_MODAI`；若 `modai <= 0` 則改 100
4. `R = 1.10`
5. `ai = ((主人等級 × 主人 WORKFIXCHARM × R) / (寵物等級 × modai)) × 100`
6. 指派到 C int，所以先截斷
7. `ai > 100` 時先壓到 100
8. 再加 `CHAR_VARIABLEAI × 0.01`
9. 若主人有轉生再套轉生補正
10. 最後 clamp 0～100

目前 web 沒有玩家轉生系統，捕獲／任務寵也沒有 VariableAI 調整，所以現況兩項等價來源值 0；不是自行省略數值。

玩家的 `state.charm` 對應目前無裝備修正下的 `WORKFIXCHARM`。

### 608 `_BATTLE_ABDUCTII`

原 petskill2：

`E旅程伙伴3,...,PETSKILL_Abduct,80,...,608,...`

且 `version.h` 明確：

`#define _BATTLE_ABDUCTII`

`BATTLE_Abduct()` 在 option >0 且目標為 `CHAR_TYPEPET` 時，不再走普通旅程伙伴的等級差成功率。

來源改成：

`AiPer = atoi(option)`

`per = 0`

`if (target WORKFIXAI < AiPer) per = 200`

608 的 AiPer=80，因此：

- FIXAI <80 → per=200
- FIXAI ≥80 → per=0

真正成功判定仍是：

`RAND(1,100) < per`

所以 200 是實質必成功，0 是實質必失敗。

### 目標與離場

若 AI 原本選到玩家本人，`BATTLE_Abduct()` 對 `CHAR_TYPEPLAYER` 直接 return；施術者也不離場。

若目標是玩家出戰寵物：

- FIXAI 依上述公式計算
- 成功時把寵物退出本場
- 失敗時寵物留下
- **不論成功或失敗，施術 Enemy 最後都 `BATTLE_Exit()`**

V0.55 保留這個來源行為。

### 舊存檔／無 TempNo 防護

若舊版 legacy pet 沒有 TempNo，或 TempNo 無法對回 `enemybase1.txt`，web 無法安全重建 MODAI。

這種情況 V0.55 不猜 FIXAI 成敗：不擅自帶走寵物，但仍執行來源已確定的施術 Enemy 離場。

### V0.54 補充確認

V0.54 625 媚惑術的 Player/Pet 判斷再次由 `PET_createPetFromCharaIndex()` 驗證：

- 捕獲後玩家寵物重新建 Char
- work-int 全由 default char 初始化成 0
- 不複製 Enemy 的 `CHAR_WORK_PETFLG`

因此一般玩家寵物確實無法滿足 BecomeFox 的 `WORK_PETFLG != 0` 條件。

## V0.56 光鏡系 no-react 分支

V0.56 接入：

- 610「破鏡重圓」：`PETSKILL_Lighttakeed`，option `REFLEC`
- 611「穿透術」：`PETSKILL_Lighttakeed`，option `VANISH`

`version.h` 已啟用：

`#define _BATTLE_LIGHTTAKE`

### 技能前置能力

`PETSKILL_Lighttakeed()` 直接：

- `WORKATTACKPOWER = FIXSTR × 0.7`
- `WORKDEFENCEPOWER = FIXTOUGH × 0.5`

原本 QUICK ×0.95 的程式已被註解，所以不改敏捷。

### DamageReact 判斷

`BATTLE_S_AttackDamage()` 一開始呼叫：

`ReactType = BATTLE_GetDamageReact(defindex)`

`BATTLE_GetDamageReact()` 順序檢查：

1. `CHAR_WORKDAMAGEVANISH > 0` → VANISH
2. `CHAR_WORKDAMAGEABSROB > 0` → ABSROB
3. `CHAR_WORKDAMAGEREFLEC > 0` → REFLEC

若三者皆 0，回傳 0。

Lighttakeed 只有當目標確實已有 DamageReact，且種類和 option 相同時，才保留 LIGHTTAKE command 並在攻擊後把該反應剩餘次數複製到施術者。

若種類不同，來源把 `skill_type=-1`；目標原本的 DamageReact 仍照一般傷害反應規則處理。

### 現版玩家側的來源等價狀態

目前 Player + Active Pet 沒有：

- WORKDAMAGEVANISH
- WORKDAMAGEABSROB
- WORKDAMAGEREFLEC

也沒有任何已接技能／裝備會建立這三個 work-int。

因此在目前戰鬥模型中，`BATTLE_GetDamageReact()` 對玩家與玩家寵物必定是 0。

這時 610／611 的原 C 實際行為就是：

- 用攻 70%、防 50% 的施術者
- 執行一次 `BATTLE_S_AttackDamage()` 普通物理傷害
- 不吸收任何 REFLEC／VANISH
- 不進一般物理攻擊分支的 Counter loop

V0.56 精準接這個 no-react 分支。

### 為什麼現在不建立假的 REFLEC／VANISH

技能名稱雖然叫「破鏡重圓／穿透術」，但 610／611 本身不是建立光鏡守的技能，而是**吸收目標已存在的 DamageReact**。

目前沒有來源會讓玩家側先取得這些 work-int，所以若現在自行建立 reflect／vanish status，就會改變原資料可到達狀態。

等正式接入能建立 `WORKDAMAGEREFLEC / VANISH / ABSROB` 的來源技能或裝備時，再擴充同一 handler 的 transfer 分支。

## V0.57 沉默／NOCAST

V0.57 接入 ID 580「沉默」：

`沉默,敌全体无法使用咒术三回合,PETSKILL_Nocast,默 turn 3 成 50,...`

此技能不依賴 AttackMagic 傷害表；它是獨立 battle status。

### 原 `BATTLE_S_Nocast()`

技能解析：

- `turn = 3`
- `Success = 50`
- `BATTLE_MultiList()` 取目標整側

每個目標先呼叫：

`BATTLE_StatusAttackCheck(attacker,target,BATTLE_ST_NOCAST,50,30,1.0,&perStatus)`

也就是：

- PerOffset = 50
- Range = 30
- Bai = 1.0
- 仍受既有異常互斥、等級差、VITAL 比例、LUCK／抗性公式影響
- 最終成功仍是嚴格 `< per`

接著原碼還要求：

`CHAR_WHICHTYPE != CHAR_TYPEPET`

所以即使 BATTLE_MultiList 包含玩家出戰寵物，寵物也不會被寫入沉默。

V0.57 保留原 C 的 `&&` 評估順序：寵物仍會先走一次 StatusAttackCheck 路徑，再因 type=PET 被排除。

### turn 不是 `turn+1`

這點和 Barrier／一般 StatusChange 不同。

`BATTLE_S_Nocast()` 成功後直接：

`CHAR_WORKNOCAST = turn`

也就是 raw 值直接寫 3。

因此 V0.57 使用 `battleStatusApplyRaw(...,'nocast',3)`，不是一般 `battleStatusApply()` 的 `turn+1`。

若施術者在本回合比玩家早出手，玩家同一回合輪到自己時 `BATTLE_StatusSeq()` 就會先把沉默 3 減成 2。

### 沉默不會讓角色停止行動

`BATTLE_StatusSeq()` 的 `CHAR_WORKNOCAST` case 只負責通知客戶端咒術頁維持禁用。

它不屬於麻痺／睡眠／石化／魔障等不能行動類型，也不把普通 Attack／Guard 改成 NONE。

因此 web 的 `battleStatusCanMove()` **沒有**把 nocast 加入阻擋清單。

目前玩家本來就沒有正式咒術 command 可按，所以 V0.57 不製造假的按鈕禁用效果；但沉默仍有來源可觀察意義：

- 佔用異常狀態互斥槽
- 阻止其他異常在沉默期間覆蓋
- 正常依玩家行動點倒數
- 到 0 自動解除
- 可被 592 淨化移除

### 玩家寵物

來源明確排除 `CHAR_TYPEPET`，所以 Active Pet 即使在「敵全體」範圍中也不會取得 nocast status。

### Counter

580 不造成物理傷害，也不走普通 Attack，因此沒有 Counter／反反擊鏈。

## V0.58 嚙齒術／無裝備分支

V0.58 接入 ID 574「E嚙齒術」在目前 web 戰鬥模型可到達的原 C 分支。

原 petskill2：

`E啮齿术,破坏对方装备武器,PETSKILL_ToothCrushe,,,Ed,574,1,6,2,0,PETSKILL_TOOTHCRUSHE`

`version.h` 已啟用：

`#define _SKILL_TOOTH`

### `PETSKILL_ToothCrushe()`

函式只設定特殊 command／target／skill array。

原本曾有一段降低施術者攻擊力的 option parser，但整段被 `/* ... */` 註解，所以本 build **沒有攻擊力修正**。

### 戰鬥路徑

`battle.c` 對 `BATTLE_COM_S_TOOTHCRUSHE`：

1. `BATTLE_TargetAdjust()`
2. `BATTLE_S_AttackDamage(...,BATTLE_COM_S_TOOTHCRUSHE,skill)`
3. 直接 `break`

所以它是特殊 AttackDamage case，不是普通 `BATTLE_COM_ATTACK`，不接一般 Counter／反反擊鏈。

物理命中／閃避／會心／傷害則仍由 `BATTLE_AttackSeq()` 正常計算。

### 額外裝備破壞

只有 damage >0 時 `skill_type` 才能維持 TOOTHCRUSHE；接著輸出階段才呼叫：

`BATTLE_S_ToothCrushe(battleindex, attackindex, defindex, damage, skill)`

而 `BATTLE_S_ToothCrushe()` 第一個條件就是：

`if (target WHICHTYPE != CHAR_TYPEPLAYER) return;`

即使是玩家，仍要：

`BATTLE_ItemCrushCheck(defindex,1) >= 0`

找到可破壞裝備後才會讀 ITEM_DAMAGECRUSHE／MAXDAMAGECRUSHE、調降耐久，甚至耐久歸零時刪除裝備。

### 現版 web 的來源等價狀態

目前玩家沒有正式武器／防具裝備欄與耐久資料。

因此：

- 目標若是 Active Pet：來源本來就直接 return，不破壞任何東西
- 目標若是 Player：等價於 `BATTLE_ItemCrushCheck()` 找不到可破壞裝備

所以 V0.58 精準保留：

- 一次特殊物理攻擊
- 無裝備破壞
- 無普通 Counter loop

沒有自行建立假的武器或耐久值。

等正式裝備系統與 ITEM_DAMAGECRUSHE 底層存在後，再把同一 handler 的 crush 分支補上。

## V0.59 未註冊 PetSkill／C_WAIT

V0.59 修正兩個「petskill2.txt 有資料列，但原 build 實際找不到函式指標」的 Enemy PetSkill：

- 502「E招喚」
- 582「自爆攻擊」

### 502 E招喚

`petskill2.txt` 的函式字串是：

`ENEMYSKILL_EnemyHELP`

但 `PETSKILL_functbl[]` 註冊的是：

`ENEMYSKILL_EnemyHelp`

`PETSKILL_getPetskillFuncPointer()` 用 `hashpjw()` 後仍會再做：

`strcmp(PETSKILL_functbl[i].functionname, name) == 0`

`strcmp` 區分大小寫，所以 `EnemyHELP` 不會命中 `EnemyHelp`。

結果：

- `func == NULL`
- `PETSKILL_Use()` 回 FALSE
- `BATTLE_ai_normal()` 回 FALSE
- Enemy 不會被設成 C_OK
- 本回合維持 C_WAIT
- 在 `BATTLE_StatusSeq()` 前就被跳過

因此 V0.53 曾保留的 `performEnemyHelp()` 只作為未來若修正資料字串時的可用 handler；**這個原 build 的 502 不會實際進到它**。

### 582 自爆攻擊

`petskill2.txt`：

`自爆攻击,...,PETSKILL_SelfExplodeAttack,倍3 回避-50,...,582,...`

但本來源：

- `pet_skill.c` 沒有 `PETSKILL_SelfExplodeAttack()`
- `PETSKILL_functbl[]` 也沒有 `PETSKILL_SelfExplodeAttack` 註冊項
- `version.h` 只有被註解掉的：

`//#define _SKILL_SELFEXPLODE // (不可开) ... 自爆(缺图)`

所以 582 同樣會在 `PETSKILL_getPetskillFuncPointer()` 得到 NULL，`PETSKILL_Use()` 回 FALSE。

### V0.59 Web 對應

新增：

`ENEMY_SOURCE_UNREGISTERED_SKILL_IDS = {502, 582}`

Enemy AI 抽中這兩個 ID 時：

- 標記 `sourceSkillUnregistered`
- 不執行 handler
- 保持來源 C_WAIT
- 不攻擊
- 不跑自身 StatusSeq／MagicStatusSeq
- 不推進毒、劇毒、虛弱、鐵壁、大地鎧甲等自身行動點倒數

這和 V0.52 的「技能 ID 根本不存在」是不同資料錯誤，但最終 battle 行為相同。

## V0.60 黑烏力化

V0.60 接入 ID 635「黑烏力化」：

- 函式：`PETSKILL_BecomePig`
- option：`30 180 100388`
- Enemy AI：1 個 distinct Enemy，正權重總和 1

### 原技能流程

`PETSKILL_BecomePig()` 本身只設定 `BATTLE_COM_S_BECOMEPIG`、target、C_OK 與 skill array。

`battle.c` 把 BECOMEPIG 放在普通物理攻擊 command 群組，所以會先完整執行：

- 普通命中／閃避／會心
- 物理傷害
- 普通 Counter／反 Counter 鏈

之後才檢查黑烏力化附加效果。

### 只有玩家本人能被黑烏力化

附加效果要求：

- 本次不是 MISS
- 不是 DODGE
- 不是 ALLGUARD
- 不是 ARRANGE
- 目標仍存活
- 目標 `CHAR_WHICHTYPE == CHAR_TYPEPLAYER`
- 非同隊

所以打中玩家寵物時只有普通物理攻擊，不會套黑烏力化。

### option `30 180 100388`

原碼解析為：

- `petrate = 30`
- `pettime = 180` 秒
- `pigbbi = 100388`

成功判定是：

`rand()%100 < 30`

也就是 0～29，共 30/100。

第一次成功時原 `CHAR_BECOMEPIG` 初值為 -1：

`pettime + 1 + (-1) = 180`

若已有狀態，再次成功：

`CHAR_BECOMEPIG = pettime + current`

所以剩餘秒數會直接再加 180 秒。

### 真正限制哪些戰鬥指令

黑烏力化期間，原 `battle.c` 明確允許：

- ATTACK
- GUARD
- NONE
- ITEM
- ESCAPE
- CAPTURE
- WAIT
- PETIN
- PETOUT

只有其他指令才會被強制改成 GUARD，訊息寫的是「變成烏力後不能使用咒術和職業技能」。

此外武器會被視為 FIST，回力標也被改回一般攻擊。

目前 web 沒有武器系統、咒術 command、職業技能 command、騎寵系統；而玩家目前可用的攻擊／防禦／捕捉都在原允許清單。

因此 V0.60 **不添加任何攻擊／防禦／敏捷 debuff**，只保存真正存在的黑烏力秒數狀態。

### 秒數與戰鬥結束時序

來源 `net.c` 每秒把 `CHAR_BECOMEPIG` 減 1。

當倒數要降到 0：

- 先把值設為 0
- 若當時不在戰鬥，立刻設回 -1 並解除
- 若仍在戰鬥，不設 -1

`battle.c` 判定黑烏力化用的是 `CHAR_BECOMEPIG > -1`，所以**戰鬥中即使秒數已經倒到 0，狀態仍持續到離開戰鬥後才解除**。

V0.60 用 `playerPigUntilMs` 保存 wall-clock 到期時間；若時間已到但戰鬥仍存在，`playerPigActive()` 仍回 true，直到戰鬥離開後才清除。

這個欄位寫入存檔，故 180 秒狀態可以跨重新整理保留。

### Save schema

V0.60 將 `schemaVersion` 15 升為 16，新增：

- `playerPigUntilMs`
- `playerPigImage`

舊存檔透過 fresh-state merge 自動取得預設值，不需要破壞既有角色／寵物／任務資料。

### V0.60 正權重非 MP／魔法掃描邊界

以原 `gmsv/data/petskill2.txt`、`version.h`、實際 `PETSKILL_functbl[]` 與目前 Enemy AI 正權重重新交叉掃描後，V0.60 已沒有其他可在「不補 MP／AttackMagic／咒術底層」前提下安全新增的技能。

目前仍有正權重但未接入的來源函式只剩：

| 類型 | ID | 正權重總和 | 暫緩原因 |
| --- | --- | ---: | --- |
| `PETSKILL_AttackMagic` | 27 個（301～325 等） | 504 | 直接指定 magic ID + item ID，需正式 magic／attmagic 執行層 |
| `PETSKILL_MpDamage` | 506／507／508 | 196 | 技能本身會做物理攻擊，但核心附加結果直接修改目標 MP；玩家／寵物正式 MP 尚未建模 |
| `PETSKILL_Firekill` | 624 | 32 | 先做 80% 物理攻擊，再固定呼叫 `BATTLE_MultiAttMagic_Fire(...,2,200)`；不能只截掉後半魔法 |
| `PETSKILL_StealMoney` | 211 | 8 | Enemy 的 `CHAR_WORKPLAYERINDEX` 預設為 0；index 0 是否有效取決於原伺服器全域 Char runtime，前端沒有等價配置 |
| `PETSKILL_Combined` | 627／632／637／705 | 6 | 只是挑 option 內的咒術編號後改成 `BATTLE_COM_JYUJYUTU`，效果完全依賴咒術底層 |
| `PETSKILL_DivideAttack` | 634 | 5 | `BATTLE_DivideAttack()` 先把敵方所有玩家 MP 扣半，再做全側 HP 比例傷害並處理騎寵分攤 |

另外 502／582 雖有 petskill2 資料列，但原 build 的 functbl 無法取得函式指標，已由 V0.59 正式還原為 C_WAIT；V0.52 的缺 ID 引用也已同樣完成。

因此下一階段若繼續擴技能，應先建正式 MP／magic／JYUJYUTU 底層，而不是再從技能名稱猜效果。

## V0.61 AttackMagic 正式底層

V0.61 開始正式接入原版攻擊魔法，不再把 `PETSKILL_AttackMagic` 視為缺資料技能。

本輪新增：

`data/generated/stoneage_attack_magic_runtime.json`

來源固定為：

- `gavinlinasd/StoneAge`
- ref `1f90cb6cb57c1df70f39cde77a5a8ccd98b66c56`
- `gmsv/data/magic.txt`
- `gmsv/data/attmagic.bin`

原 build 明確開啟：

- `__ATTACK_MAGIC`
- `_FIX_MAGICDAMAGE`
- `_MAGIC_OPTIMUM`

因此 V0.61 使用新版 FIX_MAGICDAMAGE 公式。

### attmagic.bin

`AttMagic` struct 全部由 32-bit 欄位組成：18 個 scalar + `siField[3][5]` 共 33 個欄位，每筆 132 bytes。

`attmagic.bin` 為 7128 bytes：

- 7128 / 132 = 54 raw records
- loader 再要求偶數並除 2
- 得到 27 個 attack-magic idx

每個 idx 兩筆：

- Enemy／左上方施法者 `attackNo >= 10` → `idx*2`
- Player／右下方施法者 `attackNo < 10` → `idx*2+1`

V0.61 runtime 已保存兩側 sprite、attackType 與原 `siField[3][5]`。

### magic 301～325

目前正式接入 25 個原 `MAGIC_AttMagic_Battle`：

- 301～306 地
- 307～312 水
- 313～318 火
- 319～324 風
- 325 毀天滅地（火，Power 350，MagicLv 5）

每筆直接保存 magic.txt 的：

- Magic ID
- name
- option
- field / target / deadFlag
- AttMagic idx
- 屬性
- Power
- MagicLv
- `TargetIndex` 特殊範圍 rewrite

### 範圍還原

不是只把魔法粗分成單體／全體。

V0.61 同時移植來源：

- `CharTable[4][5]`
- `CharTableIdx[20][2]`
- `attmagic.bin -> siField[3][5]`
- `TargetIndex[25][2]`

因此目前 Player slot 0 + Active Pet slot 5 能保留原格位語意。

回歸例：

- 301 岩石撞擊：選玩家只打玩家；選寵物只打寵物
- 303 土石流：整排；目前每排各只有一個可見單位
- 304 巨岩撞擊：十字範圍，無論選玩家或同欄寵物，Player + Active Pet 都會被波及
- 305 地震：敵方全體，Player + Active Pet 都受影響
- 321 龍捲風：整排
- 325 毀天滅地：敵方全體

### Enemy 魔法熟練度

原 `BATTLE_MultiAttMagic()` 對 `CHAR_TYPEENEMY`：

`att_magic_lv[attr] = CHAR_LV * 0.9`

寫入 int，所以 V0.61 使用截斷值。

每次施法共用一次：

`Check = rand()%100`

`TrueMagic = !(Check > att_magic_lv[attr])`

也就是 `Check <= attMagicLv` 才是 TrueMagic。

False 時，最後魔法傷害會再：

`attvalue *= 0.7`

並以 C int 規則截斷。

### 魔法閃避

玩家：

`fLuck = LUCK*3 + 해당屬性魔抗*0.15`

目前沒有裝備魔法迴避，所以 equipment 部分為來源等價 0。

寵物：

`fLuck = level*0.2`，上限 30。

真正判定：

`rand()%100 + 1 <= (int)fLuck`

成功則該目標本次魔法傷害為 0，且不進後續魔抗成長。

### `_FIX_MAGICDAMAGE` Power

對每一個沒有閃過的目標：

`Kmagic = attackerMagicLv*1.4 - defenderResist`

`Mmagic = max(attackerMagicLv,1)`

`Amagic = (Kmagic² / Mmagic²) + (rand()%20)/100`

`APower = int(Power * (1 + MagicLv/10) * Amagic)`

### 魔法屬性相剋

V0.61 沒直接重用物理 `normalizedElements()`。

原因是 `BATTLE_getMagicAdjustInt()` 會建立一個**非正規化攻擊屬性向量**：

- `MagicLv *= 10`
- 指定魔法屬性 = `MagicLv + MagicLv*(施術者該屬性/50)`
- `/50` 是 C int division
- 其他四屬中的三屬清 0
- 原本的 None 屬性仍保留
- 接著所有攻方屬性都乘 APower

再交給原 `BATTLE_AttrCalc()` 的 1.5／1.0／0.6 四屬相剋矩陣。

V0.61 新增 `magicAttrCalcRaw()`，逐項以 C int 截斷還原，不把魔法向量錯誤重新正規化回 100。

目前尚未接入 676 的戰場屬性改變，因此 `BattleArray.field_att` 在現況等價 NONE；`BATTLE_FieldAttAdjust()` 攻守雙方都是 0.5，比例正好為 1。

### 睡眠解除

原 `BATTLE_MultiAttMagic()` 只要目標沒有魔法閃避，就會加入 `def_be_hit`；整段結束後若該目標正在睡眠，直接清除睡眠。

V0.61 同樣在魔法未閃避時解除 sleep，即使最後傷害為 0 也不自行改規則。

### 魔抗成長

Save schema 由 16 升到 17。

玩家新增：

- `magicResist[4]`：地／水／火／風
- `magicResistExp[4]`

每隻寵物同樣保存這兩個陣列。

來源 default char 的整數欄位初始化為 0，且捕獲寵建立流程沒有額外複製魔抗，因此舊存檔與新寵預設四屬魔抗都為 0。

`Magic_ComputeDefExp()`：

- 單次傷害 <200：不成長
- `addEx = (Damage/20) * (MagicLv*2)`，`Damage/20` 為 C int division
- exp >100 時清 0，該屬性魔抗 +1，最高 100
- 同時處理 `(attr+1)%4` 的相克魔抗：若其 level >1，exp -2；若跌破 0，exp 設 90、level -1

V0.61 已把這套進度持久化到 save。

### 尚未包含

`PETSKILL_AttackMagic` 還有兩筆不是 `MAGIC_AttMagic_Battle`：

- 676 → magic 204：戰場水屬性改變
- 688 → magic 435：MAGIC_Weaken

這兩筆 V0.61 不會拿 AttackMagic 傷害公式硬套；下一步分別接 FieldAttChange 與正式 Magic Weaken。

### V0.61 MP／item runtime 補充確認

後續追 `MAGIC_DirectUse()` 時確認，PetSkill option 內的 `item 19647～19671` 對非玩家施術者會直接當成全域 `ITEM_item[]` existing-item index，並讀 `ITEM_MAGICUSEMP`。

若該 existing-item index 無效，`ITEM_getInt()` 會回 `-1`；`MAGIC_DirectUse()` 的 `if (mp < 0) {}` 區塊是空的，仍會把 `mp=-1` 傳進 magic function。

但這**不影響 V0.61 已接的 301～325**，因為原 `MAGIC_AttMagic_Battle(charaindex,toNo,marray,mp)` 從頭到尾完全沒有讀取 `mp`：

- 不做 `CHAR_MP < mp` 檢查
- 不扣 MP
- 直接解析 attr／Power／MagicLv／attidx
- 直接呼叫 `BATTLE_MultiAttMagic()`

所以 301～325 的原 build 行為確實與 dynamic item slot 內容、Enemy MP 都無關；V0.61 目前直接執行 AttackMagic 是正確的。

相對地，magic 204 `MAGIC_FieldAttChange` 與 magic 435 `MAGIC_Weaken` 都會檢查並扣傳入的 mp，因此 676／688 仍不能沿用 301～325 的無 MP 路徑，必須另外處理。


## V0.62 火線獵殺

V0.62 接入 Enemy 正權重 PetSkill 624「火線獵殺」。

來源固定為：

- `gavinlinasd/StoneAge`
- ref `1f90cb6cb57c1df70f39cde77a5a8ccd98b66c56`
- `gmsv/data/petskill2.txt`
- `gmsv/src/battle/pet_skill.c`
- `gmsv/src/battle/battle.c`
- `gmsv/src/battle/battle_event.c`
- `gmsv/src/battle/battle_magic.c`

### PetSkill 資料

原 `petskill2.txt`：

- ID：624
- 名稱：火線獵殺
- function：`PETSKILL_Firekill`
- target：1
- option：空

`PETSKILL_Firekill()` 本身只設定 `BATTLE_COM_S_FIREKILL`、target、C_OK 與 skill array，不從 option 猜任何額外數值。

### 物理段

原 `battle.c` 的 `BATTLE_COM_S_FIREKILL`：

1. 先確認／調整有效目標。
2. 同隊目標直接拒絕。
3. 固定：
   `CHAR_WORKATTACKPOWER = CHAR_WORKFIXSTR * 0.8`
4. 呼叫 `BATTLE_Attack_FIREKILL()`。
5. 接著呼叫 `BATTLE_MultiAttMagic_Fire(battleindex,attackNo,defNo,2,200)`。
6. 直接結束該 command。

因此 V0.62 的物理段固定使用原攻擊力 80%，而且**不進普通物理攻擊的 Counter／反 Counter loop**。

`BATTLE_DamageSub_FIREKILL()` 內即使前面讀了 DamageReact，隨後也明確：

`react = BATTLE_MD_NONE`

所以目前 web 沒有額外自行加入鏡／守／吸收等反應。

### 火魔法段

`BATTLE_MultiAttMagic_Fire(...,2,200)` 的固定參數：

- `FieldAttr = 2` → 火
- `Power = 200`
- 函式內 `MagicLv = 4`
- 作用範圍為原目標所在的 5 格橫排

目前 web 戰鬥模型只有 Player slot 0 與 Active Pet slot 5，兩者位於不同排，因此現況：

- 選到玩家 → 火焰追加打玩家所在排
- 選到 Active Pet → 火焰追加打寵物所在排

不把它錯誤擴成 Player + Pet 全體。

### Enemy 魔法公式

Enemy 施術者仍依原碼：

`att_magic_lv = int(level * 0.9)`

每次火魔法段仍會先消耗一次：

`Check = rand()%100`

並計算 `TrueMagic`。

但 Firekill 專用 `BATTLE_MultiAttMagic_Fire()` 中，原本可能套用的：

`attvalue *= 0.7`

在 `_FIX_MAGICDAMAGE` 路徑實際上是註解碼，故 **FalseMagic 不降低 Firekill 傷害**。V0.62 保留該 RNG 消耗，但不自行加上 0.7。

真正傷害仍沿用 V0.61 已還原的：

- Enemy 魔法熟練度
- 玩家／寵物魔法閃避
- `_FIX_MAGICDAMAGE` 的 Kmagic / Mmagic / Amagic / APower
- 火屬性相剋
- 玩家／寵物魔抗成長
- 魔法命中後解除睡眠

### Save schema

V0.62 沒有新增持久化欄位，因此 schema **維持 17**。

### 正權重掃描更新

接入 624 後，V0.60 邊界中原先因缺正式 magic 底層而暫緩的 Firekill 已解除。

仍需後續處理的正權重技能集中在：

- 506／507／508：`PETSKILL_MpDamage`，需要正式 MP
- 676：`PETSKILL_AttackMagic -> magic 204`，FieldAttChange 且會檢查／扣 MP
- 688：`PETSKILL_AttackMagic -> magic 435`，Magic Weaken 且會檢查／扣 MP
- 211：`PETSKILL_StealMoney`
- 634：`PETSKILL_DivideAttack`，包含玩家 MP 減半
- 627／632／637／705：`PETSKILL_Combined`，依賴 JYUJYUTU／咒術底層

繼續維持「原 C 規則優先、不猜數值」；在正式 MP／JYUJYUTU 或可驗證 runtime 尚未建立前，不把這些技能偷換成普通攻擊或自行猜效果。


## V0.63 玩家 MP 與 MP攻擊

V0.63 建立最小但正式的玩家 MP runtime，並接入 Enemy 正權重 PetSkill 506／507／508。

來源固定為：

- `gavinlinasd/StoneAge`
- ref `1f90cb6cb57c1df70f39cde77a5a8ccd98b66c56`
- `gmsv/src/char/char.c`
- `gmsv/src/battle/pet_skill.c`
- `gmsv/src/battle/battle.c`
- `gmsv/src/battle/battle_event.c`
- `gmsv/data/petskill2.txt`

### 玩家 MP 初始化

原 `CHAR_createNewChar()` 明確：

`ch.data[CHAR_MAXMP] = ch.data[CHAR_MP] = 100;`

而 `CHAR_initcharWorkInt()` 直接：

`CHAR_WORKMAXMP = CHAR_MAXMP`

現版 web 尚無 `ITEM_MODIFYMP` 裝備效果，因此 V0.63 不猜額外成長或職業公式，玩家固定：

- MP = 100
- MaxMP = 100

Save schema 由 17 升到 18，新增：

- `mp`
- `maxMp`

舊存檔因先前沒有 MP 系統，升級時安全初始化為 100／100。

休息補滿同步參照原 Healer 行為，把角色 HP 與 MP 都補滿。

### 506／507／508 原資料

`petskill2.txt`：

- 506 MP攻擊 → `PETSKILL_MpDamage` → `50|50`
- 507 MP攻擊2 → `PETSKILL_MpDamage` → `50|75`
- 508 MP攻擊3 → `PETSKILL_MpDamage` → `50|100`

第一欄看似是「物理攻擊力下降 50%」，第二欄是 MP 損害比例。

### 原 C 的整數除法 bug

`PETSKILL_MpDamage()` 實際寫法：

`def = (float)(atoi(buf1)/100);`

對三個技能第一欄都是 50，因此 C 會先做：

`50 / 100 = 0`

再轉為 float 0.0。

後續：

`strdef = strdef - (int)(strdef * def);`

所以這個來源 build 的 506／507／508 **實際不降低物理攻擊力**。

V0.63 保留這個來源行為，不依技能文字自行修成 -50%。

### MP 傷害條件

原 battle path：

`BATTLE_COM_S_MPDAMAGE -> BATTLE_S_AttackDamage() -> BATTLE_S_MpDamage()`

`BATTLE_S_MpDamage()` 只在以下條件成立時生效：

- 本次物理 `damage >= 1`
- 目標不是 Enemy
- 目標不是 Pet
- 也就是實際上只對 Player 生效
- 目標目前 MP > 0
- `BATTLE_GetDamageReact(defindex) == 0`

目前 web 玩家沒有光／鏡／守 DamageReact work-int，所以最後一項在現況來源等價為 true。

真正扣除：

`D_MP = (int)(currentMP * percent)`

然後：

`MP = MP - D_MP`

所以 506／507／508 分別扣「**當下剩餘 MP**」的：

- 50%
- 75%
- 100%

不是 MaxMP 百分比。

例如 100 MP 連續吃兩次 506：

- 第一次：100 → 50
- 第二次：50 → 25

### 物理與反擊

506／507／508 在 `battle.c` 走 `BATTLE_S_AttackDamage()` 專用 case，處理完直接 break，不進普通 `BATTLE_Attack` 的 Counter loop。

因此 V0.63：

- 保留正常物理命中／閃避／防禦
- 不額外建立普通 Counter
- 只有物理 damage > 0 時才接 MP 削減
- 打 Active Pet 時只造成物理傷害，不扣玩家 MP

### 正權重掃描更新

506／507／508 原正權重合計 196，V0.63 後已正式接入。

下一批仍需處理的重點：

- 676 → `PETSKILL_AttackMagic -> magic 204`：FieldAttChange，會檢查並扣 MP
- 688 → `PETSKILL_AttackMagic -> magic 435`：MAGIC_Weaken，會檢查並扣 MP
- 634 → `PETSKILL_DivideAttack`：會先把玩家 MP 減半，再處理 HP
- 211 → `PETSKILL_StealMoney`：仍受 Enemy `CHAR_WORKPLAYERINDEX` 無有效 owner 限制
- 627／632／637／705 → `PETSKILL_Combined`：依賴 JYUJYUTU／咒術底層

繼續維持「原 C 規則優先、不猜數值」。


## V0.64 分身地裂

V0.64 接入 Enemy 正權重 PetSkill 634「分身地裂」。

來源固定為：

- `gavinlinasd/StoneAge`
- ref `1f90cb6cb57c1df70f39cde77a5a8ccd98b66c56`
- `gmsv/data/petskill2.txt`
- `gmsv/src/battle/pet_skill.c`
- `gmsv/src/battle/battle.c`
- `gmsv/src/battle/battle_event.c`

原資料：

- ID 634
- 名稱：分身地裂
- function：`PETSKILL_DivideAttack`
- target：敵方全體
- option：空

`PETSKILL_DivideAttack()` 只把 command 設成 `BATTLE_COM_S_DIVIDE_ATTACK`；真正效果完全位於 `BATTLE_DivideAttack()`。

### 第一階段：玩家 MP

原函式先以 `BATTLE_MultiList()` 取得敵方整側，第一輪只處理 `CHAR_TYPEPLAYER`：

`CHAR_MP = charmp - (charmp >> 1)`

也就是扣掉：

`floor(currentMP / 2)`

所以奇數值不是直接除成較小一半，例如：

- 100 → 50
- 25 → 13
- 1 → 1

因為 `1 >> 1 = 0`。

### 第二階段：HP

接著重新掃同一整側。

若 Battle Entry 沒有騎寵：

- 目前 HP >= 5：扣 `floor(currentHP/5)`
- 目前 HP < 5：固定扣 1

即一般情況為目前 HP 的 20%。

若該 Entry 是「玩家騎寵」：

- 玩家扣目前 HP 10%
- 騎寵也扣目前 HP 10%

但目前放置版的 Player slot 0 與 Active Pet slot 5 是兩個獨立 Battle Entry，沒有建立 `CHAR_RIDEPET` 騎乘關係。因此 V0.64 不能因為有 Active Pet 就擅自套騎寵分支；兩個 Entry 都依原碼落入「沒有騎寵」：

- Player 各自扣目前 HP 20%
- Active Pet 各自扣目前 HP 20%

低於 5 HP 時各自固定扣 1，因此此技能可以把 1 HP 目標直接降到 0。

### 不經一般戰鬥判定

`BATTLE_COM_S_DIVIDE_ATTACK` 直接呼叫 `BATTLE_DivideAttack()` 後結束，沒有：

- `BATTLE_AttackSeq`
- 命中／閃避
- Guard
- 屬性傷害
- `BATTLE_DamageWakeUp`
- 普通 Counter loop

V0.64 因此也不讓分身地裂喚醒睡眠或觸發反擊。

### Save schema

沒有新增持久化欄位，schema 維持 **18**。

### 正權重掃描更新

634 原正權重總和 5，V0.64 後已正式接入。

接入後剩餘正權重未處理技能：

- 676：AttackMagic → magic 204 FieldAttChange
- 688：AttackMagic → magic 435 MAGIC_Weaken
- 211：StealMoney
- 627／632／637／705：Combined → JYUJYUTU

仍維持「原 C 規則優先、不猜數值」。


## V0.65 Combined／綜合魔法

V0.65 接入目前正權重的四個 `PETSKILL_Combined`：

- 627 難得糊塗 → `综合法|6|21|139|159|169|179|189`
- 632 逆轉 → `综合法|1|240`
- 637 淨化之舞 → `综合法|1|61`
- 705 調和 → `综合法|1|230`

來源固定為：

- `gavinlinasd/StoneAge`
- ref `1f90cb6cb57c1df70f39cde77a5a8ccd98b66c56`
- `gmsv/data/petskill2.txt`
- `gmsv/data/magic.txt`
- `gmsv/src/battle/pet_skill.c`
- `gmsv/src/battle/battle.c`
- `gmsv/src/battle/battle_magic.c`
- `gmsv/src/magic/magic.c`
- `gmsv/src/item/item.c`
- `gmsv/src/char/char_data.c`
- `gmsv/src/char/defaultPlayer.h`

### Combined 的 magic 選擇

原 `PETSKILL_Combined()`：

1. 解析 `综合法|count|magic1|...`
2. 最多取 10 個 magic ID
3. 用 `kill[rand()%count]` 選一個
4. command 設為 `BATTLE_COM_JYUJYUTU`
5. `BATTLECOM3 low = magic ID`
6. **`BATTLECOM3 high = 0`**

battle.c 的 JYUJYUTU case 再呼叫：

`MAGIC_DirectUse(charaindex, magicId, toNo, 0)`

### item index 0 與 mp=-1

對非 Player 施術者，`MAGIC_DirectUse()` 直接把第四參數當成 global existing-item index，不經玩家背包轉換。

因此 Combined 固定查：

`ITEM_getInt(0, ITEM_MAGICUSEMP)`

原 existing-item allocator：

- static `Sindex = 1`
- 每次建立前先 `Sindex++`
- 正常從 index 2 開始
- wrap 後回 1
- **永遠不配置 index 0**

所以 `ITEM_CHECKINDEX(0)` 固定失敗，`ITEM_getInt()` 固定回 **-1**。

相關 MAGIC 函式的 MP 流程都是：

`if (CHAR_MP < mp) return FALSE;`
`CHAR_MP = CHAR_MP - mp;`

當 `mp=-1`：

- MP 不足判定必定通過
- Enemy MP 實際變成 `MP + 1`

### Enemy 初始 MP

`ENEMY_createEnemy()`：

- memset `CharNew`
- `CHAR_getDefaultChar(&CharNew,31010)`
- 後續沒有覆寫 `CHAR_MP / CHAR_MAXMP`

`CHAR_getDefaultChar()` 使用的 default player template 在 `defaultPlayer.h`：

- `CHAR_MP = 0`
- `CHAR_MAXMP = 0`

所以 V0.65 Enemy runtime 正式補：

- `mp = 0`
- `maxMp = 0`

Combined 每次成功進入 magic function 都可使 MP 從 0→1→2...；原碼這裡沒有 MaxMP clamp。

### 627 難得糊塗

隨機六選一：

- 21 恩惠的精靈 Lv2
- 139 毒霧的精靈 Lv5
- 159 石化精靈 Lv5
- 169 混亂精靈 Lv5
- 179 酒醉精靈 Lv5
- 189 睡眠精靈 Lv5

#### magic 21

magic.txt：

- function `MAGIC_Recovery`
- option `100`
- 範圍為對方整側

`BATTLE_MultiRecovery()` 對每個目標分別：

`RAND(100*0.9,100*1.1)`

也就是 90～110，再乘 `GetRecoveryRate()`：

- Player：`1 + VITAL * 0.00010`
- 非 Player：`1 + VITAL * 0.00005`

結果以 int 截斷，最後 cap MaxHP。

V0.65 使用目前 web 已有的原 raw VITAL 對 Player / Active Pet 各自計算，不把「100」誤做固定回血值。

#### magic 139／159／169／179／189

共同：

- turn 5
- Success 25
- `BATTLE_MultiStatusChange()`
- 每個對方存活目標各自跑 `BATTLE_StatusAttackCheck(...,25,30,1.0)`

V0.65 沿用既有正式 StatusAttackCheck port：

- 已有任何異常則不再套
- 等級差 ×1
- range ±30
- VITAL 比例抗性
- status resist
- 上限 80%
- 嚴格 `RAND(1,100) < per`

成功後狀態直接寫 **5**，不是 PetSkill StatusChange 路徑的 turn+1，因此使用 raw-turn storage。

### 637 淨化之舞

magic 61：

- 高等淨化精靈 Lv2
- `MAGIC_StatusRecovery`
- option `全`
- 我方整側

原 `BATTLE_MultiStatusRecovery()` 的「全」並不是清除所有後來新增的狀態。

條件明確限制：

`tostatus <= CHAR_WORKCONFUSION`

所以只涵蓋原基本六異常：

- 毒
- 麻痺
- 睡眠
- 石化
- 酒醉
- 混亂

V0.65 **不會**用 637 清除後來的劇毒、虛弱、魔障、沉默等狀態。

### 632 逆轉

magic 240：

- 彩虹的精靈
- `MAGIC_AttReverse`

`BATTLE_MultiAttReverse()` 先 XOR `CHAR_BATTLEFLG_REVERSE`，開啟時 `BATTLE_AttReverse()` 將 FIX 屬性：

- Earth ← Fire
- Water ← Wind
- Fire ← Earth
- Wind ← Water

即：

- 地 ↔ 火
- 水 ↔ 風

這是 battle-only work state，不修改角色原始屬性。

另外有一個重要時序：

- 第一次施放：flag OFF→ON，當下立即 swap
- 第二次施放：flag ON→OFF，`BATTLE_AttReverse()` 因 flag 已關而直接 return
- 所以**同一回合剩餘時間仍保持先前反轉的 FIX 值**
- 下一輪 `BATTLE_PreCommandSeq()` 先 `CHAR_complianceParameter()` 重建 base FIX，因 flag 已 OFF 才正式恢復

V0.65 新增 battle-only reverse flag + element work map，每輪開始重建，完整保留上述時序；不污染 save 內永久 `state.elements / pet.elements`。

### 705 調和

magic 230：

- 調和的精靈
- `MAGIC_FieldAttChange`
- option `无`

原 parser 得：

- field_att = NONE
- power 預設 30
- turn 預設 3

目前已接技能中仍沒有任何能成功把 field_att 改成非 NONE 的路徑；676 水的精靈仍受 dynamic existing-item index 的 MP cost 限制。

因此 V0.65 現有可達狀態下 705 是來源等價的：

`NONE → NONE`

仍記錄原 Power 30 / turn 3，但不虛構額外效果。

### Save schema

V0.65 新增的 Enemy MP、反轉 flag、FIX element work 都是單場 battle runtime，不持久化。

Save schema 維持 **18**。

### 剩餘正權重邊界

V0.65 後未接入正權重只剩：

- 676 → AttackMagic / magic 204 FieldAttChange
- 688 → AttackMagic / magic 435 MAGIC_Weaken
- 211 → StealMoney

676／688 的 PetSkill option 分別寫 `item 20900` / `item 20912`。對 Enemy 而言這不是 item ID，而是 **當下 ITEM_item[] existing index**；其內容取決於 server runtime 的全域物件配置，不能由靜態資料安全寫死 MP cost。

211 則在 `BATTLE_StealMoney()` 開頭直接讀 Enemy `CHAR_WORKPLAYERINDEX` 並要求 `CHAR_CHECKINDEX(masterindex)`。Enemy 建立流程沒有配置 owner，default work-int 為 0；而全域 char index 0 是否正好有效取決於原 server 當下角色配置，web 沒有等價全域 Char runtime。

因此這三項仍不能在「不猜 runtime」原則下硬接。


## V0.66 正權重 Enemy PetSkill runtime 邊界

V0.66 完成目前 Enemy AI 正權重 PetSkill 的靜態來源掃描收尾。

V0.65 後只剩：

- 211 捐獻／`PETSKILL_StealMoney`
- 676 E水的精靈／`PETSKILL_AttackMagic -> magic 204 item 20900`
- 688 E咒靈術／`PETSKILL_AttackMagic -> magic 435 item 20912`

這三個不是缺 petskill 資料、也不是函式未註冊；它們的 `PETSKILL_Use()` 本身都能成功建立 battle command。

真正無法由固定 source snapshot 唯一決定的是後續使用到的**原 server 全域 runtime index 狀態**。

### 211：CHAR_WORKPLAYERINDEX = 0 不是固定無效

`ENEMY_createEnemy()` 先經 `CHAR_getDefaultChar()`，所有 work-int 清為 0；後續 Enemy 建立流程沒有配置 `CHAR_WORKPLAYERINDEX`。

因此 211 進 `BATTLE_StealMoney()` 時：

`masterindex = 0`

接著原碼立刻：

`if (!CHAR_CHECKINDEX(masterindex)) return;`

V0.60 邊界原本還不能確定 char index 0 是否一定無效。V0.66 追到 `CHAR_initCharOneArray()` 後可確認：

- Player pool `startcnt = 0`
- 第一個 Player 就可以配置在 char index 0
- index 0 **不是保留位**

所以：

- 若原 server 當下有有效玩家佔住 char slot 0，211 可繼續執行。
- 若 slot 0 無有效玩家，211 直接 return。
- 這取決於原 server 當時全域在線角色／allocator 狀態，不能從 Enemy 靜態資料推導。

因此 web 不把自己的單機 Player 擅自視為原 server char index 0。

### 676／688：20900／20912 是 existing-item index，不是 item ID

兩筆 petskill option：

- 676：`magic 204 item 20900`
- 688：`magic 435 item 20912`

`MAGIC_DirectUse()` 對非 Player 施術者不做玩家背包 slot → existing index 轉換，而是直接：

`itemindex = itemnum`

所以實際查的是：

- `ITEM_item[20900]`
- `ITEM_item[20912]`

不是「道具 ID 20900／20912」。

`ITEM_item[]` 是原 server 的全域動態 existing-item pool。其 slot 是否正在使用、當下是哪一個 existing item，取決於：

- server 啟動後建立／銷毀物件的歷史
- NPC／Enemy／Player／掉落等所有 item allocation
- 當下 runtime occupancy

若 slot 無效，`ITEM_getInt()` 回 -1；若 slot 有效，則會讀**那個當下 existing item** 的 `ITEM_MAGICUSEMP`。

因此不能從 source repo 靜態斷言 20900／20912 的 MP cost。

### 為何 Combined 的 item 0 可以、676／688 不可以

V0.65 的 Combined 固定 itemnum=0 可以精確還原，是因為 ITEM allocator 已證明：

- static Sindex 初值 1
- 建立前先 ++
- 正常從 2 開始
- wrap 回 1
- **永遠不配置 index 0**

所以 index 0 固定 invalid → mp=-1。

相反地，20900／20912 位於正常 existing-item pool 範圍內，可能有效也可能無效，不能類推成固定 -1。

### V0.66 web 行為

新增：

`ENEMY_SOURCE_RUNTIME_BLOCKED_SKILL_IDS = {211,676,688}`

三者：

- 保留 Enemy AI 原正權重
- `PETSKILL_Use` 語意視為成功，因此仍正常跑該角色自身 StatusSeq
- battle action 時明確記錄是哪一個 runtime dependency 缺失
- 不套普通攻擊
- 不標成 source missing
- 不標成 unregistered function
- 不猜 MP cost
- 不把 web Player 假設成原 server char index 0

這比泛用「特殊寵技尚未接入」更精確，也避免未來掃描把它們誤當成漏做。

### V0.63 MP 回歸補正

V0.63 已讓手動「休息補滿」同時補滿 HP／MP，但戰敗自動回村仍只補 HP。

V0.66 補正：

- 戰敗自動回村：HP → MaxHP
- MP → MaxMP
- 日誌同步顯示「補滿 HP／MP」

不新增 save 欄位，schema 維持 **18**。

### 目前邊界結論

在「原 C 規則優先、不猜數值、不猜原 server 全域 allocator 狀態」標準下：

- 靜態可唯一還原的正權重 Enemy PetSkill 已接完。
- 剩餘 211／676／688 已正式分類為 **source runtime-dependent boundary**，不是一般未完成技能。

若下一階段要讓這三個也能完全模擬，就不是再補單一 PetSkill handler，而是要建立原 server 等價的：

- 全域 CHAR slot allocator／occupancy
- 全域 ITEM existing-item pool
- item create／destroy allocation history
- 對應 battle runtime ownership

在沒有這一層之前，硬指定任何結果都會違反「不猜 runtime」原則。


## V0.67 捐獻／StealMoney

V0.67 將正權重 PetSkill 211「捐獻」由 runtime-blocked 正式接入。

來源：

- `gavinlinasd/StoneAge`
- ref `1f90cb6cb57c1df70f39cde77a5a8ccd98b66c56`
- `gmsv/src/battle/pet_skill.c`
- `gmsv/src/battle/battle_event.c`
- `gmsv/src/battle/battle.c`
- `gmsv/src/char/char_base.c`
- `gmsv/src/include/version.h`

### 單機 CHAR runtime 對應

原 Enemy 建立後 `CHAR_WORKPLAYERINDEX` 保持 default 0。

原 `CHAR_initCharOneArray()` 的 Player pool：

- `startcnt = 0`
- 第一名 Player 可直接配置在 char index 0

本專案是單機單玩家 runtime，因此 V0.67 將唯一玩家明確對應成「空 server 的第一名 Player」＝ char slot 0。

這不是把 Enemy owner 改成玩家；只是讓原 `BATTLE_StealMoney()` 對 `masterindex=0` 的有效性檢查，在單機 runtime 有確定答案。

### Battle no. 映射與原 bug

`BATTLE_NewEntry()`：

- Player side = side 0
- Enemy side = side 1
- Enemy slot i 的 `bid = i + 10`

所以 web：

- `battleSlot 0 -> bid 10`
- `battleSlot 1 -> bid 11`
- 依此類推

`BATTLE_StealMoney()` 內有：

`if (attackNo > 10) safeSide = 1;`

因此 **bid 10 不會進入這個分支**。

對 Player target（defNo 0）：

- bid 10：被錯判為同側，`per = 0`
- bid 11～19：才走不同側偷錢機率

V0.67 保留這個來源 bug。

### 成功率

不同側 Player target：

`per = 50;`
`per = (((per + LV) / 4) + 10) >> 1;`

全部保持 C int 截斷。

實際成功條件：

`RAND(1,100) < per`

不是 `<=`。

### 偷取金額

成功命中 Player 後：

`GOLD = (int)(playerGold * RAND(1,15) * 0.01)`

也就是目前石幣的 1～15%。

此 build 已開 `_FIX_MAX_GOLD`：

`MaxGold = 1000000 + transmigration * 1800000`

目前 web 尚無轉生系統，單機角色對應初始轉生 0，因此 V0.67 的原服上限是：

**1,000,000**

原函式會在真正從 defender 扣錢前，先以 master slot 0 的 Gold 做上限 clamp。

單機 runtime 中 master slot 0 與唯一 Player 是同一角色，因此這個原本很怪的 clamp 也保留。

### Enemy 成功後

若攻擊者是 Pet：

- owner 得到 GOLD
- Pet 離場

但 Enemy 不是 Pet，因此成功後走：

`BATTLE_Exit(attackindex,battleindex)`

結果：

- Player 被扣石幣
- 沒有任何 owner 收到石幣
- 使用捐獻的 Enemy 直接離開戰鬥
- 該離場不視為擊殺，不給該 Enemy 的 EXP／掉落

若它是最後一名 Enemy，戰鬥因敵側無存活 Entry 而結束；web 同樣不產生擊殺獎勵。

### Pet target

原函式只對 Player / Enemy 明確設定 `per`。

Active Pet 作為目標時 `per` 保持 0，因此捐獻必定失敗，不會偷寵物、也不轉成普通攻擊。

### runtime-blocked 更新

V0.67：

- 211 → 已實作
- 676 → 仍 runtime-blocked
- 688 → 仍 runtime-blocked

676／688 接下來要由最小 ITEM existing-index runtime 解決。


## V0.68 ITEM existing-index runtime 與最後正權重 AttackMagic

V0.68 接入最後兩個 runtime-blocked 正權重 Enemy PetSkill：

- 676 E水的精靈 → `PETSKILL_AttackMagic` → `magic 204 item 20900`
- 688 E咒靈術 → `PETSKILL_AttackMagic` → `magic 435 item 20912`

來源：

- `gavinlinasd/StoneAge`
- ref `1f90cb6cb57c1df70f39cde77a5a8ccd98b66c56`
- `gmsv/setup.cf`
- `gmsv/src/item/item.c`
- `gmsv/src/magic/magic.c`
- `gmsv/src/battle/battle_magic.c`
- `gmsv/src/battle/battle_event.c`
- `gmsv/data/magic.txt`

### 最小 ITEM_item[] runtime

原 `setup.cf`：

`itemnum=25000`

所以 20900／20912 都在合法 array 範圍。

但 `ITEM_CHECKINDEX()` 不只檢查範圍，也要求：

`ITEM_item[index].use == TRUE`

未配置的 existing slot：

- `ITEM_CHECKINDEX == FALSE`
- `ITEM_getInt(..., ITEM_MAGICUSEMP) == -1`

原 allocator `ITEM_initExistItemsOne()`：

- static `Sindex = 1`
- 每次搜尋前先 `Sindex++`
- 到 25000 時 wrap 到 1
- index 0 永不配置

V0.68 在 save 中新增最小：

`itemRuntime = { itemnum:25000, sindex:1, slots:{} }`

並提供 source-equivalent：

- existing slot MP lookup
- Sindex allocation
- free slot

目前不把舊 web inventory count map 反推成不存在的歷史 `ITEM_item[]` allocation。

V0.67 以前的 web 根本沒有 existing-item pool，因此 schema 18 → 19 migration 明確從**空 pool**開始；這比猜測過去 allocation history 更符合「不猜 runtime」原則。

### 676：magic 204 水的精靈 Lv5

magic.txt：

- ID 204
- `MAGIC_FieldAttChange`
- option：`水 100 turn 5`

Enemy 的 `MAGIC_DirectUse()`：

- itemnum 直接當 global existing index
- 目前新 runtime 中 20900 未配置
- `ITEM_getInt -> -1`
- MP 不足檢查：`0 < -1` 為 false
- `MP -= -1`
- Enemy MP 因此 +1

成功後 BattleArray：

- `field_att = WATER`
- `att_pow = 100`
- `att_count = 5`

V0.68 新增 battle-only field state。

原每個 battle round 結尾：

- 若 field_att != NONE，`att_count--`
- <=0 時回復 NONE

因此在施放當回合結尾就會由 5 → 4，時序照原 battle.c。

### 戰場屬性倍率

原 `BATTLE_FieldAttAdjust()`：

`0.5 + pAt(field) * att_pow * 0.01 * 0.01 * 0.5`

實際傷害再乘：

`AttackerFieldPower / DefenderFieldPower`

V0.68 已接到兩條來源路徑：

1. 一般物理屬性傷害
2. `_FIX_MAGICDAMAGE` AttackMagic

AttackMagic 特別保留原時序：

- 先由 MagicLv 將攻方四屬牽引到該魔法屬性
- **先以這個尚未乘 damage 的向量算 FieldAttAdjust**
- 再把向量乘魔法 power / damage
- 做四屬相剋
- 最後乘 field ratio

不是直接拿最終魔法傷害向量算 field power。

### 705 調和同步升級

V0.65 的 705 在當時沒有非 NONE field setter，所以只記錄來源資料。

V0.68 已有正式 field runtime 後：

- magic 230「調和的精靈」會真正把 field_att 改回 NONE
- 原 att_pow=30、att_count=3 仍記錄
- 但 battle.c 只有 `field_att != NONE` 才遞減 count，所以 NONE 本身不再 tick

因此現在 705 可以真正解除 676 建立的水戰場。

### 688：magic 435 癱瘓的精靈 Lv3

magic.txt：

- ID 435
- `MAGIC_Weaken`
- option：`虛 turn 7 成 50`
- 單體

同樣透過 item 20912 查 MP。

目前 slot 20912 未配置：

- MP cost = -1
- Enemy MP +1

之後 `MAGIC_ParamChange_Turn_Battle()`：

- status = WEAKEN
- turn = 7
- Success = 50
- Range = 30
- Bai = 1.0

逐目標呼叫：

`BATTLE_StatusAttackCheck(attacker,target,WEAKEN,50,30,1.0)`

成功後原碼：

`CHAR_WORKWEAKEN = turn + 1`

即寫入 8。

web 既有 weaken battle view 已依來源降低：

- attack 20%
- defense 20%
- quick 20%

V0.68 使用現有標準 StatusAttackCheck port，成功後以 7 作邏輯回合數、內部 storage 等價 8，保持原 StatusSeq 時序。

### Save schema 19

新增：

- `itemRuntime.itemnum`
- `itemRuntime.sindex`
- `itemRuntime.slots`

Battle field state 不持久化，因為原 BattleArray 也是單場 runtime；戰鬥結束／新戰鬥時回 NONE。

### 正權重 Enemy PetSkill 狀態

V0.68 後：

- 211 已於 V0.67 接入
- 676 已接入
- 688 已接入

原本 V0.66 的 runtime-blocked 集合現在為空。

後續正權重掃描應只剩三類：

- implemented
- source missing
- unregistered function

不再存在一般未分類或 runtime-blocked PetSkill。
## V0.69 Enemy ITEM existing-index allocator 生命週期

V0.69 把 V0.68 的最小 \`ITEM_item[]\` existing-index runtime 延伸到 Enemy 真正會建立與銷毀的物品生命週期。

來源固定為：

- \`gavinlinasd/StoneAge\`
- ref \`1f90cb6cb57c1df70f39cde77a5a8ccd98b66c56\`
- \`gmsv/setup.cf\`
- \`gmsv/src/item/item.c\`
- \`gmsv/src/char/enemy.c\`
- \`gmsv/src/char/char_base.c\`
- \`gmsv/src/char/pet.c\`
- \`gmsv/src/battle/battle.c\`

### Enemy 建立時的 existing item 配置

原 \`ENEMY_createEnemy()\` 在 \`CHAR_initCharOneArray()\` 成功之後，依固定順序：

1. 掃 \`ENEMY_ITEM1～10\`。
2. 對應 \`ITEMPROB1～10\` 以本 build 的 \`_FIX_ITEMPROB\`：
   \`RAND(0,999) < ITEMPROB\`。
3. 命中才呼叫 \`ITEM_makeItemAndRegist(itemId)\`。
4. 成功取得 existing index 後放入 Enemy 的 10 格 carried item。
5. 10 格全部處理完，才依 \`ENEMY_STYLE\` 建立 \`CHAR_ARM\` 武器。
6. STYLE 武器建立完成後才進 \`ENEMY_RandomChange()\`。

STYLE 對應完全照原 C：

- 1 → Item 0
- 2 → Item 100
- 3 → Item 200
- 4 → Item 400
- 5 → Item 500
- 6 → Item 700
- 7 → Item 600

web 的 V0.69 同樣讓 carried loot 先走 existing allocator，再建立 STYLE 武器；若 \`ITEM_makeItemAndRegist\` 等價配置失敗，該物品不會被留下成不存在的 carried item。

### existing slot ownership

schema 20 起，每個 runtime slot 除原本的：

- \`use\`
- \`itemId\`
- \`magicUseMp\`

再記錄：

- \`owner\`
- \`source\`
- \`enemySlot\`

Enemy 建立出的 carried item 使用：

\`owner = enemy:<unit id>\`

STYLE 武器也屬於同一 Enemy。

這些欄位只用來讓 web 能安全重現 source 中「哪個 CHAR 持有哪個 existing index」的生命週期，不把舊存檔反推成不存在的歷史配置。

### 戰利品：Enemy carried item → Battle getitem

原 \`BATTLE_AddExpItem()\` 只掃 Enemy 的 10 格 carried item，不會把 \`CHAR_ARM\` 的 STYLE 武器當戰利品。

對戰敗 Enemy：

1. carried item 先從 Enemy item slot 拔掉。
2. existing item 本身不重新建立，原 index 直接進 Player 的 \`BATTLE_ENTRY.getitem[]\`。
3. 每名 Player 的 \`GETITEM_MAX = 3\`。
4. 前 3 個直接放入空 getitem。
5. 已滿後，每個新物品先 \`RAND(0,1)\`：
   - 成功：\`RAND(0,2)\` 隨機替換舊 getitem，舊 existing item 立即釋放。
   - 失敗：新 incoming existing item 立即釋放。

目前是單機單 Player，所以 V0.69 以一組 3 格 getitem 完整保留這段替換規則。

結果畫面結算時，若 getitem 成功進入 web 玩家背包，仍保留**同一個 existing index**，只把 owner 改成 Player；不是銷毀後再建立另一份。

### Enemy 離場與 slot 釋放

原 \`BATTLE_Exit()\` 對 \`CHAR_TYPEENEMY\` 會呼叫：

\`CHAR_endCharOneArray()\`

而 \`CHAR_endCharData()\` 會逐格 \`ITEM_endExistItemsOne()\`，所以 Enemy 身上仍留著的：

- 未進 getitem 的 carried item
- STYLE 武器

都必須釋放。

V0.69 已接到下列路徑：

- Enemy 正常被擊敗後的戰鬥結算
- Enemy 逃跑
- Enemy 技能／特殊流程直接離場
- 玩家戰敗
- 玩家被強制退出戰鬥
- 切換地圖／Encounter／任務戰區時的無獎勵清場
- 捕獲成功
- 戰鬥結束

無獎勵結束目前統一經 \`clearEnemyBattleNoReward()\`，同時：

- 釋放仍由 Enemy 持有的 existing slots
- 清空 Enemy battle object
- 清除 battle-only status / reverse / element work / field state

### 捕獲

原 \`PET_createPetFromCharaIndex()\` 會從 Enemy 複製角色／寵物能力與 PetSkill，但沒有把 Enemy 的 item slots 複製進新 Pet。

因此捕獲後 Enemy 原 carried item 與 STYLE 武器仍走 Enemy 離場清理，不會跟著變成寵物物品。

V0.69 回歸時另外修正一個靜態 formation 邊界：

- 捕獲其中一隻後，該類 formation 的現有遊戲流程會直接結束整場。
- 舊碼只釋放被捕獲 target，其他 formation 成員的 existing slots 可能留在 pool。
- 現在改為整場走 \`clearEnemyBattleNoReward()\`，其餘 Enemy 一併做 \`CHAR_endCharOneArray\` 等價清理。

動態群戰只移除被捕獲的那一隻；若它是最後一隻，同樣走統一清場。

### 玩家取得後再消耗

從 battle getitem 取得的物品會保持 tracked existing index。

玩家後續真的消耗到這類 tracked item 時，V0.69 才釋放其 existing slot；舊版／任務直接 \`giveItem()\` 產生、沒有可證明 existing-index 歷史的數量仍視為 untracked，優先消耗 untracked，避免替舊資料虛構 allocation。

### \`ITEM_MAGICUSEMP\`：未知值仍然不猜

V0.69 不把舊編碼 \`itemset6.txt\` 無法精確還原的 \`ITEM_MAGICUSEMP\` 填成 0 或其他猜測值。

runtime 規則維持：

- slot invalid / 未配置 → 原 \`ITEM_getInt()\` 等價回 \`-1\`
- slot valid 且 \`magicUseMp\` 已有可靠值 → 使用該值
- slot valid，但該 item 的 \`ITEM_MAGICUSEMP\` 無法可靠解碼 → runtime 記為 \`null\`

676／688 若剛好查到一個 valid、但 \`magicUseMp = null\` 的 20900／20912 slot：

- 不猜 MP cost
- 不扣／加 MP
- 不套 magic 204／435 的效果
- 日誌明確標記 source item MP unknown

這樣可以讓 allocator occupancy 真正影響 676／688，又不破壞「原 C 規則優先、不猜數值」。

### Save schema 20

V0.69：

- schema 19 → **20**
- V0.68 以前仍從空 existing pool migration
- V0.68 已存在但沒有 ownership 的 slot 保留其 \`use/index/itemId/magicUseMp\`
- 不替舊 slot 猜 owner

### V0.69 回歸結果

完成生命週期後重新檢查：

- \`game.js\` JavaScript 語法：通過
- Enemy 10 格 carried item：接入 existing allocator
- 2958 Enemy STYLE：接入 STYLE weapon allocation
- getitem 3 格轉移／替換／釋放：接入
- Enemy 逃跑／直接離場：釋放
- 玩家戰敗／強制離場：釋放
- 捕獲：釋放；靜態 formation 額外殘留已修
- 無獎勵戰鬥清場：統一入口
- 戰鬥勝利：保留轉給 Player 的 existing index，只清 Enemy 尚持有項目
- \`ITEM_MAGICUSEMP\` source-unknown：維持 unknown，不猜

V0.69 至此把 Enemy carried loot + STYLE 武器的 existing-index allocator 生命週期接成可持續影響 20900／20912 occupancy 的 runtime。


## V0.70 itemset6 ITEM_MAGICUSEMP runtime

V0.70 把 V0.68／V0.69 最後保留的 `ITEM_MAGICUSEMP = unknown` 邊界正式解開，讓 Enemy 建立出的 existing item 能帶入原 `itemset6.txt` 的真實 MP cost。

來源固定為：

- `gavinlinasd/StoneAge`
- ref `1f90cb6cb57c1df70f39cde77a5a8ccd98b66c56`
- `gmsv/data/itemset6.txt`
- `gmsv/src/item/item.c`
- `gmsv/src/include/item.h`
- `gmsv/src/include/version.h`
- `gmsv/data/enemy1.txt`
- `gmsv/src/char/enemy.c`

### itemset6 欄位已由原 C parser 對齊

這個 build 同時開啟 `_ITEMSET2_ITEM`、`_ITEM_INSLAY`、`_Item_ReLifeAct`、`_ITEM_MAXUSERNUM`、`_ITEMSET4_TXT`、`_TAKE_ITEMDAMAGE`、`_ADD_DEAMGEDEFC`、`_SUIT_ITEM`、`_ITEMSET5_TXT`、`_ITEMSET6_TXT` 等相關欄位。

依 `ITEM_itemconfentries[]` 與 `ITEM_readItemConfFile()`：

- 每筆有效 `itemset6.txt` 資料固定 94 欄。
- `ITEM_ID_TOKEN_INDEX = 17`。
- `ITEM_MAGICID` = 第 56 欄。
- `ITEM_MAGICPROB` = 第 57 欄。
- `ITEM_MAGICUSEMP` = 第 **58 欄**。
- 空的 `magicusemp` 欄不是 unknown；`ITEM_getDefaultItemSetting()` 先給預設值 0，只有 token 非空才用 `atoi()` 覆寫，所以空欄正式等價 **0**。

完整來源掃描：

- 10,737 筆有效 Item。
- 10,737 個唯一 Item ID，無 duplicate。
- Item ID 範圍 0～23009。
- 228 筆 `magicusemp` token 為空，依原 parser 為 0。
- 5,082 筆 `ITEM_MAGICUSEMP` 非 0。
- 非負 MP cost 整體範圍 0～100。

產物：

`data/generated/stoneage_item_magic_runtime.json`

內含來源 ref／blob、parser token 定義、統計與完整 `itemId -> magicUseMp` 對照。

### ITEM_makeItemAndRegist 的 MP cost 可以安全由模板回填

原 `ITEM_makeItem()`：

1. 從 `ITEM_tbl[itemId]` 複製完整 `ITEM_Item`。
2. 只對帶有 `randomdata[]` width 的欄位做 `RAND(0,width)`。
3. `ITEM_MAGICUSEMP` 在 parser 中是普通 `ITEM_INTENTRY`，不是 `ITEM_INTFUNC / ITEM_getRandomValue`，所以其 random width 為 0。
4. `ITEM_makeItemAndRegist()` 再把這份 Item 丟進 existing-index allocator。

全 source 搜描也沒有找到普通 Enemy `ITEM_makeItemAndRegist()` 建立路徑會在 init 時重新隨機改寫 `ITEM_MAGICUSEMP`；找到的 `ITEM_setInt(... ITEM_MAGICUSEMP ...)` 是鑲嵌／合成時把既有 Item 的 MP 值複製到另一件 Item，不屬於 Enemy carried loot／STYLE 的建立流程。

因此 V0.70 可以由 Item ID 唯一回填 Enemy 新建 existing item 的 MP cost，不需要猜值。

### existing allocator 接入

新增：

- `ITEM_MAGIC_RUNTIME_URL`
- `itemMagicDb`
- `sourceItemTemplateExists(itemId)`
- `sourceItemTemplateMagicUseMp(itemId)`

`sourceItemRuntimeAlloc()` 現在：

- 先驗證 Item ID 是否真的存在於原 `ITEM_tbl` 對應資料。
- 不存在 → 等價原 `ITEM_makeItem()` 失敗，return -1。
- 存在 → 若呼叫端沒有另外提供可靠 MP 值，就從原 `itemset6` runtime 取得真實 `ITEM_MAGICUSEMP`。
- existing slot 仍保留原 V0.69 的 `itemId / owner / source / enemySlot` 生命週期。

因此 Enemy 的：

- 10 格 carried loot
- STYLE 武器

都不再把 `magicUseMp` 寫成 null，而是建立當下直接帶入正式來源值。

### 676／688 的 runtime 現在有四種精確結果

676：

- `magic 204 item 20900`

688：

- `magic 435 item 20912`

這裡的 20900／20912 仍是 **global existing index**，不是 Item ID。

`MAGIC_DirectUse()` 等價流程現在可以區分：

1. existing slot 未配置：
   - `ITEM_getInt -> -1`
   - Enemy `MP < -1` 為 false
   - `MP -= -1`
   - Enemy MP +1
   - 魔法繼續執行

2. slot 已配置，該 Item `MAGICUSEMP = 0`：
   - 不改 MP
   - 魔法正常執行

3. slot 已配置，`MAGICUSEMP > 0` 且 Enemy MP 不足：
   - 原 `MAGIC_DirectUse()` 失敗
   - 不扣 MP
   - 不套魔法效果

4. slot 已配置，`MAGICUSEMP > 0` 且 MP 足夠：
   - 扣除正式 MP cost
   - 再執行 magic 204／435

若 legacy slot 連可唯一辨識的 Item ID 都沒有，仍維持 unknown／不猜效果；這是資料真的不足，不再是 itemset6 無法解碼。

### Enemy 掉落表與缺失 Item template

直接用同一 fixed ref 的 `enemy1.txt` 重新掃 2958 筆 Enemy：

- 正掉落機率欄：1,447 格。
- 掉落＋STYLE 共引用 470 種 Item ID。
- 有 52 種被 `enemy1.txt` 引用的 Item ID 在 `itemset6.txt` 根本不存在。
- 這 52 種缺失 ID 共出現在 115 個正機率掉落格。

原 C 對這些資料會：

`ITEM_CHECKITEMTABLE == FALSE -> ITEM_makeItem() FALSE -> ITEM_makeItemAndRegist() = -1`

所以 V0.70 同樣不建立該 carried item；不再像 V0.69 因缺少 Item template 表而可能暫時產生 phantom existing item。

目前 Enemy 實際引用且 `MAGICUSEMP > 0` 的來源 Item 至少包含：

- 2165 → 20
- 2329 → 16
- 21048 → 24
- 21170 → 10
- 21171 → 10
- 21172 → 10
- 21173 → 20

因此 676／688 的 existing-index occupancy 現在確實會被 Enemy allocation history 帶入非零 MP cost，不只是理論上的資料欄位。

### Save schema 21

V0.70：

- schema 20 → **21**
- V0.69 已存在、`itemId` 可由 source 唯一識別且 `magicUseMp = null` 的 slot，自動由第 58 欄回填。
- 若 V0.69 曾建立出原 `itemset6` 不存在的 phantom Item slot，migration 會移除。
- 若該 phantom 已是 `owner=player / source=battle-getitem`，只從 inventory 扣掉這一份 tracked 數量；不碰任務／舊版 `giveItem()` 產生的 untracked 同 ID 道具。

### V0.70 回歸結果

- `stoneage_item_magic_runtime.json`：10,737 個唯一 Item ID。
- 所有資料列 94 欄規格驗證完成。
- 空 `magicusemp` token 的 C default=0 已保留。
- Enemy missing Item template 的 source failure 已保留。
- Enemy carried loot／STYLE allocation 已改為真實 MP cost。
- 676／688 原 existing-index 語意未改成 Item ID 查詢。
- `game.js` JavaScript 語法解析：通過。

V0.70 至此把 V0.68／V0.69 的 ITEM existing-index allocator 從「只知道 occupancy／ownership」推進成「existing item 同時帶有原 itemset6 的正式 MAGICUSEMP 資料」，讓 allocator history 可以真正改變 676／688 的施法結果。


## V0.71 Enemy 武器 runtime / compliance

V0.71 把 V0.69 已建立的 Enemy STYLE existing item 從「只追蹤 ownership／生命週期」推進成原 `CHAR_complianceParameter()` 會真正讀取的戰鬥裝備。

來源固定為：

- `gavinlinasd/StoneAge`
- ref `1f90cb6cb57c1df70f39cde77a5a8ccd98b66c56`
- `gmsv/data/itemset6.txt`
- `gmsv/src/char/enemy.c`
- `gmsv/src/char/char.c`
- `gmsv/src/item/item.c`
- `gmsv/src/battle/battle.c`
- `gmsv/src/battle/battle_event.c`
- `gmsv/src/battle/battle_ai.c`

新增：

`data/generated/stoneage_enemy_weapon_runtime.json`

### STYLE 武器與 itemset6

原 `ENEMY_createEnemy()`：

1. 建立 Enemy Char。
2. 先建立 10 格 carried item。
3. 依 `ENEMY_STYLE` 建立 `CHAR_ARM` 武器。
4. 呼叫 `ENEMY_RandomChange()`。
5. 最後才呼叫 `CHAR_complianceParameter()`。

STYLE 對應仍為：

- 1 → Item 0 小斧頭
- 2 → Item 100 小棍棒
- 3 → Item 200 小的槍
- 4 → Item 400 小的弓箭
- 5 → Item 500 小的回旋標
- 6 → Item 700 小的石
- 7 → Item 600 小的投擲斧頭

目前 2958 筆 Enemy 中：

- STYLE=0：2899
- STYLE=1：7
- STYLE=2：12
- STYLE=3：4
- STYLE=4：11
- STYLE=5：8
- STYLE=6：5
- STYLE=7：12

也就是 **59 隻 Enemy 的 STYLE 武器會實際改變戰鬥能力**。

### 八個 Enemy 自動武器模板

除七種 STYLE 武器外，`ENEMY_RandomChange()` 人形分支還會用：

- Item 2498「敵人專用弓箭」

V0.71 runtime 共保存 8 個原 itemset6 模板。

和目前 battle 直接相關的來源值：

| Item | 名稱 | Type | 攻 | 防 | 敏 | Critical | AttackNum |
| ---: | --- | ---: | ---: | ---: | ---: | ---: | --- |
| 0 | 小斧頭 | AXE | +9 | -3 | -3 | 0 | 1～1 |
| 100 | 小棍棒 | CLUB | +4 | 0 | 0 | +1 | 1～1 |
| 200 | 小的槍 | SPEAR | +5 | 0 | -1 | +1 | 0～0 |
| 400 | 小的弓箭 | BOW | +2 | -1 | 0 | 0 | 1～3 |
| 500 | 小的回旋標 | BOOMERANG | +3 | 0 | 0 | 0 | 1～1 |
| 600 | 小的投擲斧頭 | BOUNDTHROW | +4 | 0 | 0 | +3 | 1～1 |
| 700 | 小的石 | BREAKTHROW | +3 | -1 | 0 | 0 | 1～1 |
| 2498 | 敵人專用弓箭 | BOW | 0 | 0 | 0 | 0 | 3～5 |

這批會進 `ITEM_equipEffect()` 的裝備 modifier pair 全部都是 min=max，所以 V0.71 可以精確套值，不需要自行增加建立道具時的猜測 RNG。

### CHAR compliance

原：

`CHAR_complianceParameter()`

先：

`CHAR_initcharWorkInt()`

建立裸：

- WORKFIXSTR
- WORKFIXTOUGH
- WORKFIXDEX
- WORKMAXHP / WORKMAXMP

再：

`ITEM_equipEffect()`

把裝備 modifier 加進 work 值。

V0.71 新增：

- `sourceEnemyWeaponTemplate()`
- `sourceEnemyWeaponCompliance()`

Enemy 最終：

- attack += weapon modifyAttack，最低 0
- defense += weapon modifyDefense，最低 -100
- quick += weapon modifyQuick，最低 -100
- maxHp / maxMp 同樣保留 equip-effect clamp
- weapon critical、type、attackNum 另保存於 Enemy battle runtime

所以例如 STYLE 1 的小斧頭不再只是 existing item：

- 攻 +9
- 防 -3
- 敏 -3

都會真正改變 Enemy 戰鬥值與出手排序。

### RandomChange 人形換武器

原 `ENEMY_RandomChange()` 的人形 Enemy 範圍：

- 564～580
- 739～750
- 895～906

目前資料共 41 隻。

它會呼叫：

`DoujyouRandomWeponSet()`

原流程不是覆蓋一個武器 ID 而已：

1. 先讀目前 `CHAR_ARM`。
2. 若 existing index 有效，先 `ITEM_endExistItemsOne()`。
3. 抽九種：
   - none
   - FIST
   - AXE
   - CLUB
   - SPEAR
   - BOW
   - BOOMERANG
   - BOUNDTHROW
   - BREAKTHROW
4. 有實體武器才再 `ITEM_makeItemAndRegist()`。
5. 新 existing index 寫回 `CHAR_ARM`。

V0.71 現在同樣：

- 先釋放原 STYLE existing slot
- 再配置新的 `enemy-dojo-weapon`
- `releaseEnemyRuntimeItems()` 同時認得最終 `weaponItemIndex`
- 不會因 RandomChange 換武器而漏 existing slot

特別注意原道場 BOW：

**BOW → Item 2498**

不是 STYLE 的 Item 400。

none／FIST 不建立新 Item；來源會留下已失效的舊 ARM index，之後 `ITEM_CHECKINDEX` 失敗，戰鬥上等價空手。web 以無有效 weapon slot 表示同一語意。

目前這 41 隻人形 RandomChange 剛好 STYLE 全為 0，但仍完整保留上述流程，避免未來資料變更後行為錯誤。

寵物型 RandomChange：

- 655～720
- 859～894
- 907～940

目前共 136 隻，只換技能、不換武器；V0.71 同樣保留。

### 武器 Critical

原 `BATTLE_CriticalCheck()` 對 Player / Pet / Enemy 最後都實際呼叫同一個：

`BATTLE_CriticalCheckPlayer()`

它會直接從 `CHAR_ARM` existing item 讀：

`ITEM_CRITICAL`

公式中的裝備值：

`At_Soubi * 0.5`

是在乘 `wari` **之前**加入。

V0.71 的 `battleCriticalChance()` 已補上這個順序。

因此：

- CLUB +1
- SPEAR +1
- BOUNDTHROW +3

都會真正影響 Enemy 會心率。

### 弓的會心傷害例外

原 `BATTLE_AttackSeq()` 即使弓箭通過 Critical 判定，若：

`gWeponType == ITEM_BOW`

不呼叫 `BATTLE_CriDamageCalc()`，而只走普通：

`BATTLE_DamageCalc()`

因此弓仍可帶 critical flag，但**不取得一般會心的額外防禦補傷**。

V0.71 已保留此例外。

### 投射武器禁止反擊

原 `BATTLE_IsThrowWepon()`：

- BOW
- BOOMERANG
- BREAKTHROW
- BOUNDTHROW

皆為 TRUE。

`BATTLE_CounterCheckPlayer()` 與 `BATTLE_CounterCheckPet()` 都先檢查：

- 反擊者是否拿投射武器
- 被反擊者是否拿投射武器

任一成立直接 return FALSE。

V0.71 的 counter path 現在同樣在最前面阻擋，因此 Enemy 拿弓／回力標／投斧／石頭時，不再錯誤觸發玩家或寵物的近身反擊鏈。

### CounterTbl 與原 SPEAR bug

Player 反擊使用：

`CriPer * CounterTbl * 0.1 + Luck`

V0.71 正式接回原 `CounterTbl`。

因此先前 web 註解假設的「FIST vs FIST = 10」並不正確；原：

- FIST → `BATTLE_C_CLAW`
- FIST vs FIST 的表值實際是 **9**

另外原 `BATTLE_ItemType2ItemMap()` 明確有：

- FIST
- AXE
- CLUB
- BOW
- BOOMERANG / BOUNDTHROW / BREAKTHROW

卻**漏掉 SPEAR**。

因此 SPEAR 會保持預設：

`BATTLE_C_NONE = 0`

V0.71 故意保留這個來源 bug，不自行幫原 C 修正。

Enemy / Pet 作為反擊者走 `BATTLE_CounterCheckPet()`，來源本來就不使用 CounterTbl；web 沒有錯套 Player 表。

### 捕獲不繼承 Enemy 武器

原 `PET_createPetFromCharaIndex()` 會複製 Enemy 的角色能力／技能等，但不複製 item slots。

因此被捕獲 Enemy 的 STYLE／道場武器不能變成新 Pet 的永久能力。

V0.71：

- Enemy 戰鬥時使用完成 equip compliance 的 attack / defense / quick
- 捕獲時 `serverCombat` 明確取 `serverDerived` 裸能力
- Pet 後續 `petBattleView()` 也會由 `serverStats` 重算裸 combat
- Enemy 武器 existing item 照原離場流程釋放

同時修正捕獲率中的 Enemy DEX：

原 `BATTLE_CaptureCheck()` 使用：

`CHAR_WORKFIXDEX`

所以 V0.71 改用已完成 compliance 的 `target.quick`，STYLE／道場武器的敏捷修正會正確進捕獲公式；不是再使用未縮放的 raw template DEX。

### ma / B_AI_MAGICMODE 的來源 C_WAIT

V0.71 追查另一個舊邊界：

`BATTLE_ai_normal()` 會讀：

`ma`

並把 `B_AI_MAGICMODE` 納入權重抽籤。

但來源函式後半只有：

- ATTACK
- GUARD
- ESCAPE
- WAZA

沒有任何 `B_AI_MAGICMODE` case。

所以若抽中 magic：

- 函式一路落到 `return FALSE`
- `BATTLE_ai_all()` 不把角色設成 C_OK
- Enemy 保持 C_WAIT
- 本回合連自己的 StatusSeq 都不執行

V0.71 已把舊的「magic effect 未配置，所以空過」改成正式 source C_WAIT。

目前 `stoneage_enemy_ai.json` 2958 隻 Enemy 的 `m > 0` 數量為 **0**，所以此 bug 在目前資料不可達；保留這個 handler 是為了未來 source 資料若出現 ma 時仍不偏離原 C。

### Save schema

V0.71 **不升 schema**，仍為 **21**。

原因：

- weapon template 是靜態 generated runtime
- Enemy unit / equipped weapon 是單場 battle runtime
- existing item ownership 仍沿用 schema 21 的 `itemRuntime`
- 沒有新增需持久化的玩家欄位

### 尚未在 V0.71 展開的 weapon command

V0.71 已接「裝備與 compliance」，但沒有把所有武器 command 一次混進來。

原 `BATTLE_GetAttackCount()` 與 battle command 還包含：

- BOW 的 AttackNum 多段／多 target 流程
- Item 2498 的 3～5 次弓攻擊
- STYLE Item 400 的 1～3 次弓攻擊
- BOOMERANG 將普通 ATTACK 改成 `BATTLE_COM_BOOMERANG`
- BREAKTHROW 的麻痺附加狀態
- 遠距武器的完整 target list / command 細節

這些屬於下一層「weapon battle command」，V0.71 不用單體普通攻擊硬冒充完整弓／回力標流程。

### V0.71 回歸

目前確認：

- `game.js` 完整 JavaScript 語法解析：PASS
- 8 個 Enemy 自動武器模板：全部存在
- equip modifier pair：全部 deterministic
- STYLE mapping：改由 runtime data 驅動
- RandomChange：在 STYLE allocation 之後
- human RandomChange：舊 ARM existing slot 先 free，再建 dojo weapon
- dojo BOW：Item 2498
- Enemy 結束：final weapon slot 可釋放
- 攻／防／敏 compliance：接入
- ITEM_CRITICAL：接入
- BOW critical damage 例外：接入
- throw weapon counter block：接入
- CounterTbl：接入，SPEAR 原 mapping bug 保留
- 捕獲：不繼承裝備，FIXDEX 使用 final compliance 值
- ma：source C_WAIT
- schema：維持 21

V0.71 至此把 Enemy STYLE 從「存在一把 item」推進成「原 C 真正會影響 WORKFIX 與物理戰鬥判定的裝備」。

下一個最直接的來源缺口是 **BATTLE_GetAttackCount + BOW / BOOMERANG / BREAKTHROW weapon command**。


## V0.72 BATTLE_GetAttackCount / weapon battle command

V0.72 延續 V0.71 的 Enemy existing-item／CHAR compliance，開始把 `CHAR_ARM` 真正帶進原 battle command。

來源仍固定：

- `gavinlinasd/StoneAge`
- ref `1f90cb6cb57c1df70f39cde77a5a8ccd98b66c56`
- `gmsv/src/battle/battle.c`
- `gmsv/src/battle/battle_event.c`
- `gmsv/data/itemset6.txt`

### BATTLE_GetAttackCount

原：

`BATTLE_GetAttackCount(charaindex)`

規則：

1. `CHAR_ARM` existing index 無效 → 回傳 0。
2. existing item 有效 → `RAND(ITEM_ATTACKNUM_MIN, ITEM_ATTACKNUM_MAX)`。
3. 抽出值 <= 0 → 強制改為 1。
4. battle 主流程若收到 0，而角色不是 Player → `attack_max = 1`。

因此 Enemy 的正式結果：

- Item 400 小的弓箭：**1～3**
- Item 2498 敵人專用弓箭：**3～5**
- Item 200 小的槍雖然資料是 0～0，但因有效 existing item，最後仍為 **1**
- 空手／無有效 ARM 的 Enemy：**1**

V0.72 新增 `sourceBattleGetAttackCount()` 與 Enemy non-player fallback；每次出手都從目前有效 `weaponItemIndex` 查 existing slot，再讀 weapon template，不把 AttackNum 固定寫死成某個 Enemy 常數。

### BOW：aBowW / target list

原 `BATTLE_TargetListSet()` 的弓不是「對同一隻重複射 N 次」。

固定 `aBowW[50]`：

```text
0 2 1 4 3 | 0 1 2 3 4
1 0 3 2 4 | 1 3 0 2 4
2 4 0 1 3 | 2 0 4 1 3
3 1 0 2 4 | 3 1 0 2 4
4 2 0 1 3 | 4 2 0 1 3
```

會依：

- 原始 `defNo % 5`
- 一次 `RAND(0,1)`
- 前／後列對應位置

展開最多 10 個候選 battle slot。

原攻擊 loop 只有在候選 slot 仍存活、真的呼叫 `BATTLE_Attack()` 後才：

`++attack_count`

所以：

- 空格不消耗發數
- 已死亡目標不消耗發數
- 同一份 bow target list 不會為了湊滿 AttackNum 無限重複同一格
- 若場上存活候選數少於抽到的 AttackNum，實際攻擊次數可以少於 AttackNum

單機目前仍維持既有 battle slot：

- Player = 0
- Active Pet = 5
- Enemy = 10 + `battleSlot`

因此弓會照原 target list 在玩家／出戰寵物的實際 slot 間尋找可攻擊目標，而不是把 Item 2498 的 3～5 發硬灌到同一個角色。

遠距 command metadata 同原：

- BOW → `BB ... w0`

### BOOMERANG

原普通：

`BATTLE_COM_ATTACK`

若 `gWeponType == ITEM_BOOMERANG`，先改成：

`BATTLE_COM_BOOMERANG`

V0.72 保留這個邊界：只有普通 ATTACK 轉換；其他直接攻擊 PetSkill 不會因拿回力標而提前誤轉 command。

原 `BoomerangVsTbl`：

```text
4  2  0  1  3
9  7  5  6  8
14 12 10 11 13
19 17 15 16 18
```

並固定：

`gBattleDamageModyfy = 0.3`

Enemy 位於 side 1，原 loop 使用：

- `k = 4`
- `j = -1`

所以 V0.72 同樣反向掃該 5-slot row，對每個仍存活的 slot 各做一次 30% 物理傷害。

command metadata：

- BOOMERANG → `BO`

### BOUNDTHROW / BREAKTHROW

原普通物理流程的遠距 command：

- BOUNDTHROW → `BB ... w1`
- BREAKTHROW → `BB ... w2`

Item 600、700 的 AttackNum 都是 1～1，所以目前各為一擊；仍由同一 `BATTLE_GetAttackCount` 路徑取得，不另外猜固定次數。

四種遠距武器：

- BOW
- BOOMERANG
- BOUNDTHROW
- BREAKTHROW

在 V0.71 已依 `BATTLE_IsThrowWepon()` 阻擋近身反擊；V0.72 延續此規則。

### BREAKTHROW 麻痺

原 battle turn 在判定武器型別後直接設定：

```c
gBattleStausChange = BATTLE_ST_PARALYSIS;
gBattleStausTurn = 0;
```

真正套狀態是在 `BATTLE_Attack()` 造成：

`damage > 0`

之後。

原 `BATTLE_StatusAttackCheck()` 對麻痺的特殊分支不是一般等級／VITAL 公式，而是：

`per = 20 - paralysis resistance`

成功條件仍是：

`RAND(1,100) < per`

且目標若已有任何 StatusTbl 異常，直接失敗。

成功後：

`gBattleStausTurn + 1 = 1`

所以投石造成正傷害後會嘗試套 **1 回合麻痺**。

V0.72 直接復用現有 `battleStatusChance(..., 'paralysis')` 與 `battleStatusApply(..., 0)`，沒有另外發明麻痺機率。

### V0.72 回歸

確認：

- `game.js` 完整 JavaScript 語法解析：PASS
- Item 400 AttackNum：1～3
- Item 2498 AttackNum：3～5
- Item 500 Type：BOOMERANG 17
- Item 600 Type：BOUNDTHROW 18
- Item 700 Type：BREAKTHROW 19
- `aBowW` Player slot 0 的兩組候選序列：
  - RAND 0 → `0,5,2,7,1,6,4,9,3,8`
  - RAND 1 → `0,5,1,6,2,7,3,8,4,9`
- `aBowW` Pet slot 5 的兩組候選序列：
  - RAND 0 → `5,0,7,2,6,1,9,4,8,3`
  - RAND 1 → `5,0,6,1,7,2,8,3,9,4`
- BOOMERANG：Enemy side 反向 5-slot traversal + 0.3 damage multiplier
- BOUNDTHROW：w1 投擲流程
- BREAKTHROW：w2 + 正傷害後原麻痺檢定
- throw weapon counter block：仍生效
- schema：仍為 21

V0.72 至此把 V0.71 已存在的 Enemy 武器，從「會影響能力／會心／反擊資格」推進成「真正依原 C 的 AttackNum、遠距 target list 與 weapon command 執行」。



## V0.73 BOW DuckCheck / throw Guardian

V0.73 繼續追 V0.72 weapon command 之後，補兩個原 C 會直接改變實戰結果的遠距武器分支。

來源仍固定：

- `gavinlinasd/StoneAge`
- ref `1f90cb6cb57c1df70f39cde77a5a8ccd98b66c56`
- `gmsv/src/battle/battle_event.c`
- `gmsv/src/battle/battle.c`

### BATTLE_DuckCheck 的 BOW 重複 +20

fixed ref 的 `BATTLE_DuckCheck()` 在同一函式裡實際存在兩段：

```c
if( gWeponType == ITEM_BOW ){
    per += 20;
}
```

第一段位於酒醉修正後，第二段位於 NoGuard 修正後。

因此原版真正順序是：

1. DEX / Luck 算基礎回避。
2. `gBattleDuckModyfy`。
3. 酒醉攻擊者：`RAND(20,30)`。
4. BOW：`+20`。
5. NoGuard 防守者的 duck bonus。
6. BOW：再 `+20`。
7. `×100`。
8. 最後套 `KAWASHI_MAX_RATE = 75%` 上限。

也就是弓攻擊會讓守方回避率在 cap 前額外 **+40 個百分點**。

這是 fixed ref 的真實重複程式，不把它當筆誤修掉。

V0.73 新增：

`sourceBattleDuckTotal()`

並讓：

- 一般 `resolveNormalAttack()`
- Enemy Guardian 前置 DuckCheck

都走同一個來源順序。

### 投射武器不能被 Guardian／忠犬代擋

原 `BATTLE_GuardianCheck()` 在確認 Guardian 有效後，還會再檢查攻擊者：

`BATTLE_IsThrowWepon(CHAR_ARM)`

若攻擊者使用：

- BOW
- BOOMERANG
- BOUNDTHROW
- BREAKTHROW

直接：

`return -1`

也就是遠距攻擊不會被 Guardian 轉移。

單機目前 Player side 沒有獨立 Guardian 站位，但 Enemy side 的忠犬／Guardian 已存在；特別是混亂狀態會使 Enemy 可能攻擊同側 Enemy，因此這個原版限制仍然是可達邏輯。

V0.73 的 `resolveAttackToEnemyWithGuardian()` 現在會在：

`attacker.throwWeapon === true`

時完全跳過 `enemyGuardianFor()`。

### 與 V0.71 / V0.72 的關係

目前四種遠距武器已同時保留：

- V0.71：禁止近身 Counter
- V0.72：正式 weapon command / AttackNum / target list
- V0.73：BOW 原版雙重回避懲罰
- V0.73：遠距攻擊禁止 Guardian 代擋

其中 BOW 目前來源行為為：

- Item 400：1～3 發
- Item 2498：3～5 發
- `aBowW[50]` 決定候選 slot
- 每次實際命中前的 DuckCheck 都有 BOW +40
- Critical flag 仍可出現
- Critical 不取得一般武器的額外防禦補傷
- 不可觸發近身 Counter
- 不可被 Guardian 代擋

### V0.73 回歸

確認：

- `game.js` JavaScript 語法：PASS
- fixed ref `BATTLE_DuckCheck()` 內 BOW `per += 20`：兩次
- web runtime：同樣兩次各 +2000 raw duck
- 最終仍 clamp 1～7500
- Guardian：`throwWeapon=true` 時不再轉移目標
- V0.72 BOW / BOOMERANG / BOUNDTHROW / BREAKTHROW handlers 保留
- schema：維持 21

V0.73 後下一個已確認的大缺口是原 `EntrySort() -> ComboCheck()` 的**合擊生命週期**：

- Enemy 普通攻擊起始機率 20%
- 非 Enemy 起始機率 50%
- 必須是排序後相鄰、同側、同目標、可行動的普通攻擊者
- BOW / BOOMERANG / BOUNDTHROW / BREAKTHROW 全部不得進合擊
- 合擊走 `BATTLE_Combo()`，會跳過普通 DuckCheck，且不走一般 Counter loop

這塊牽涉目前 Player / Pet / Enemy 三種 command 在排序後的合併，所以留作下一層，不用普通多段攻擊硬冒充。



## V0.74 EntrySort / ComboCheck / BATTLE_Combo

V0.74 從 V0.73 的 weapon command 邊界往後，正式接回原 battle turn 在排序後立即執行的合擊生命週期。

來源固定：

- `gavinlinasd/StoneAge`
- ref `1f90cb6cb57c1df70f39cde77a5a8ccd98b66c56`
- `gmsv/src/battle/battle.c`
- `gmsv/src/battle/battle_event.c`
- `gmsv/src/battle/pet_skill.c`
- `gmsv/src/include/version.h`

### 原呼叫順序

原 battle turn：

```text
EntrySort()
→ ComboCheck()
→ 逐 Entry：StatusSeq / CanMove / command execution
```

因此合擊分組使用的是**排序完成後、但該角色本回合 StatusSeq 尚未執行前**的 command / target 狀態。

V0.74 的 `normalBattleOrder()` 現在同樣：

1. 建立 Player / Active Pet / Enemy entry。
2. 依原 `BATTLE_DexCalc` 等價 dex 排序。
3. 呼叫 `sourceComboCheck()`。
4. 才開始逐角色執行 StatusSeq 與 action。

### ComboCheck 起始機率

原 `ComboCheck()`：

- Enemy：`per = 20`
- 非 Enemy：`per = 50`

目前單機沒有 Player/Pet 的正式裝備 argument `合击...`，因此 `_ITEM_ADDCOMBO` 的裝備額外機率不可達，不自行猜值。

起始條件必須同時：

- command == `BATTLE_COM_ATTACK`
- 非投射武器
- 存活且可行動
- 有有效目標
- `RAND(1,100) <= per`

### 連續成員條件

一旦某個排序 Entry 成為 starter，後面的**相鄰 Entry**只有同時符合：

- command 仍是普通 ATTACK
- 同一個 `CHAR_WORKBATTLECOM2` 目標
- 同一 side
- 非投射武器
- 可行動

才加入同一 ComboId。

加入後不再重新擲 20% / 50%。

任一條件不符會中斷目前鏈；該不相容 Entry 若自身符合 starter 條件，仍可以再擲一次並成為下一組起點。

### 投射武器完全排除

`ComboCheck()` 會先用：

`BATTLE_IsThrowWepon(CHAR_ARM)`

標記：

- BOW
- BOOMERANG
- BOUNDTHROW
- BREAKTHROW

四種皆：

`armtype = 1`

而 starter / member 都要求：

`armtype != 1`

所以 V0.72 / V0.73 接好的遠距武器不會錯誤加入合擊。

### Enemy skill 與 COM_ATTACK 邊界

fixed ref 的 `pet_skill.c` 搜描確認，明確寫入 `BATTLE_COM_ATTACK` 的 PetSkill 路徑有：

- `PETSKILL_NormalAttack`
- `PETSKILL_Explode` 在非 PvP 時退回普通 ATTACK

但 fixed ref `version.h`：

```c
//#define _PETSKILL_EXPLODE
```

明確是關閉狀態。

因此此固定 build 的目前 Enemy 可達範圍，`enemyAction === 'attack'` 可精確對應原 `BATTLE_COM_ATTACK`；不把其他直接傷害 Skill 擅自算成普通合擊成員。

### Player command 不混淆

V0.74 額外把共用排序的 Player command 明確拆開：

- attackTurn → `playerCommand:'attack'`
- guardTurn → `playerCommand:'guard'`
- captureTurn → `playerCommand:'capture'`

原因是原 `ComboCheck()` 僅接受：

`BATTLE_COM_ATTACK`

所以捕獲與防禦不能因共用 `normalBattleOrder()` 而被誤算成 Player 50% 合擊 starter。

Pet 仍依目前放置版設計在三種回合中自動普通攻擊；若 Player 本人不是 ATTACK，Player 會自然切斷 Player/Pet 的同側合擊鏈。

### ComboCheck2 / 失效後退回普通攻擊

原執行到 `BATTLE_COM_COMBO` 時還會呼叫：

`ComboCheck2()`

若目前 Entry 後面已沒有同 ComboId 且仍可行動的成員，就把它改回普通 ATTACK。

V0.74 的：

- `sourceComboHasLater()`
- `sourceComboConsumed`

保留這個語意。

例如兩人合擊中第一人被異常狀態阻止：

- 第一人不動
- 第二人已沒有後續有效 combo member
- 第二人改走自己的普通 ATTACK

若原本三人合擊第一人失效，而第二、第三仍有效：

- 第二、第三仍可繼續成為實際合擊。

### BATTLE_Combo

原 `BATTLE_Combo()` 對每一名有效 member 呼叫：

`BATTLE_AttackSeq(..., BATTLE_COM_COMBO)`

這帶來幾個和普通攻擊不同的關鍵差異：

1. `opt == BATTLE_COM_COMBO` → **跳過 DuckCheck**。
2. `Guardian = -2` → **不執行 GuardianCheck**。
3. Critical 判定仍執行。
4. Guard damage adjust 仍執行。
5. 每名 member 的 AttackSeq 若 damage <= 0，合擊層再強制成 1。
6. 一般傷害先累積為 `AllDamage`。
7. 最後一名 member 才以 `BATTLE_DamageSub2` 一次扣除累積傷害。
8. 主 battle.c 的一般 Counter loop 不會執行。

V0.74 的 `sourcePerformCombo()` 因此：

- 使用 `disableDodge:true`
- 不跑 Guardian
- 每段最低 1
- 先累計
- 最後一次寫入 HP
- 不接 `resolvePlayerEnemyCounterChain` / `resolvePetEnemyCounterChain`

### 後續 member 的 StatusSeq

原 combo branch 在收後續 member 時會先：

- `BATTLE_StatusSeq()`
- `BATTLE_MagicStatusSeq()`
- 再檢查 `BATTLE_CanMoveCheck()` / HP

V0.74 同樣在 `sourcePerformCombo()` 對後續成員呼叫目前等價的 `processBattleStatusTurn()`。

若後續 member 因異常不能動，就跳過該 member。

若 Confusion 在這個 StatusSeq 中把其 command / target 改成亂打，來源 combo branch 並沒有重新讀新 target，而只是確認它是否仍可移動，之後仍使用既定 combo `defNo`；V0.74 保留這個來源流程，不把後續 member 額外拆成一次混亂攻擊。

### V0.74 回歸

確認：

- `game.js` JavaScript 語法：PASS
- Player ATTACK + Active Pet 同目標：starter roll <= 50 可成組
- Player starter roll 51：不成組
- CAPTURE：Player 不可當 combo starter/member
- GUARD：Player 不可當 combo starter/member
- Enemy 同目標普通攻擊：starter roll <= 20 可成組
- Enemy starter roll 21：不成組
- Throw weapon：斷鏈且自身不可成為 starter
- 不同 target：斷鏈；後方相容成員可重新建立新 group
- `PETSKILL_Explode`：fixed build compile flag 關閉，不納入可達 command
- V0.72 / V0.73 遠距規則仍保留
- schema：仍為 **21**

V0.74 至此把普通攻擊從「每個 Entry 各自執行」推進到原 C 的排序後合擊編組與合擊結算流程。



## V0.75 ranged PetSkill / shared weapon loop

V0.75 不是再新增一種武器，而是修正「PetSkill 已經進原 battle.c 共用物理攻擊區後，仍必須服從目前 CHAR_ARM」這一層。

來源固定：

- `gavinlinasd/StoneAge`
- ref `1f90cb6cb57c1df70f39cde77a5a8ccd98b66c56`
- `gmsv/src/battle/pet_skill.c`
- `gmsv/src/battle/battle.c`
- `gmsv/src/battle/battle_event.c`

### 為什麼 V0.72 還不夠

V0.72 已讓普通 ATTACK 正確使用：

- BOW / `aBowW`
- BOOMERANG
- BOUNDTHROW
- BREAKTHROW
- `BATTLE_GetAttackCount()`

但原 C 有一批 PetSkill 並不是自己完成傷害，而是先設定：

- command
- attack / defense modifier
- status / attack count

最後仍落入 battle.c 的同一個 weapon attack loop。

因此同一個 Skill 若 Enemy 手上是弓，不能被 web 簡化成「固定打一個目標一次」。

### fixed data 的實際可達案例

重新掃 `stoneage_enemy_ai.json` 的 STYLE 與正權重 Skill，確認這不是理論分支。

#### Enemy 961

- `STYLE=4`
- STYLE 4 → Item 400 小的弓箭
- Item 400 → BOW
- AttackNum = **1～3**

正權重：

- 61 猛毒攻擊
- 80 石化攻擊
- 90 混亂攻擊
- 100 酒醉攻擊
- 110 催眠攻擊

五個全部是：

`PETSKILL_StatusChange`

所以原服確實存在：

**狀態攻擊 + 弓 1～3 發 + aBowW 多目標**

的可達組合。

#### Enemy 2332

- `STYLE=4`
- Item 400 BOW

正權重包含：

- 13 T五段攻擊 → `PETSKILL_ContinuationAttack`

原 `BATTLE_COM_S_RENZOKU` 會把：

```text
attack_max = 技能段數
gDamageDiv = 技能段數
```

之後仍進同一 BOW target-list loop。

因此五段攻擊拿弓時不是對同一人固定打五次，而是：

- `attack_max = 5`
- 每次物理傷害再 /5
- 候選目標由 `aBowW` 決定
- 空格／死人仍不消耗實際 attack_count
- target list 用完即可提前結束

### StatusChange × BOW

原順序：

1. 每回合初始化 `gBattleStausChange`。
2. 若武器是 BREAKTHROW，先暫設 PARALYSIS。
3. command 是 `BATTLE_COM_S_STATUSCHANGE` 時：
   - 再把 `gBattleStausChange` 改成技能自己的 status
   - 寫入技能 turn
4. `BATTLE_TargetListSet()`
5. 進共用 BOW attack loop
6. 每次真正 `BATTLE_Attack()` 造成 `damage > 0`：
   - 先 `BATTLE_DamageWakeUp()`
   - 再 `BATTLE_StatusAttackCheck()`
   - 成功才寫入本次技能異常

V0.75 現在同樣讓 StatusChange 在 BOW 時：

- 使用 Item 400 的 1～3 AttackNum
- 使用原 `aBowW[50]`
- 每一個實際命中的 slot 各自做狀態判定
- 被睡眠中的目標會先因正傷害醒來，再重新做本次狀態判定

不再把整個弓狀態技硬縮成單一目標一擊。

### StatusChange × BREAKTHROW 的覆寫順序

這裡保留一個容易寫錯的來源細節。

battle.c 一開始：

`ITEM_BREAKTHROW -> gBattleStausChange = PARALYSIS`

但稍後：

`BATTLE_COM_S_STATUSCHANGE`

又會把同一個 global：

`gBattleStausChange`

覆寫成：

- 毒
- 石
- 亂
- 醉
- 眠
- 劇毒

因此若未來／其他 fixed data 出現：

**StatusChange + 投石**

它不是「技能異常 + 額外投石麻痺」兩種都判定。

實際只保留最後覆寫後的 **技能異常**。

V0.75 的 ranged StatusChange 因此會以：

`breakthrowStatus:false`

進共用投擲 loop，再由 StatusChange callback 套技能異常。

### ContinuationAttack × ranged weapon

原 `BATTLE_COM_S_RENZOKU`：

```c
attack_max = CHAR_GETWORKINT_LOW(...);
gDamageDiv = attack_max;
```

並不建立自己的傷害迴圈，而是繼續落入共用 weapon loop。

V0.75 的 ranged helper 現在支援：

- `attackMaxOverride`
- 共用 `attackOptions.damageDivisor`
- 每擊 callback
- BREAKTHROW status 是否啟用的來源控制

因此：

#### BOW + 連續攻擊

- attack_max = 技能段數
- 每段 / 技能段數
- 走 aBowW
- 不使用武器本身 1～3 的 AttackNum，因 RENZOKU 已在 battle.c 後面覆寫 attack_max

#### BOUNDTHROW + 連續攻擊

- attack_max = 技能段數
- 同一合法目標重複投擲
- 目標倒下後才依原非 BOW TargetAdjust 語意換下一個目標

#### BREAKTHROW + 連續攻擊

與 BOUNDTHROW 相同，但原：

- RENZOKU 沒有覆寫 `gBattleStausChange`
- 所以先前 BREAKTHROW 設定的 PARALYSIS 仍保留

故每次正傷害都可各自進原：

`20 - paralysis resistance`

麻痺檢定。

fixed data 也確實有可達案例：

- Enemy 11003
- `STYLE=6`
- STYLE 6 → Item 700 小的石
- Type 19 BREAKTHROW
- 正權重反覆使用 16／17：
  - T八段攻擊
  - T九段攻擊

也就是原資料中真的存在「投石 8／9 段、每一段皆可觸發投石麻痺」的路徑。

### BOOMERANG 的特殊邊界

BOOMERANG 不是「只要手上拿回力標就一定橫掃」。

battle.c 前置轉換只在：

`COM == BATTLE_COM_ATTACK`

時才：

`ATTACK -> BATTLE_COM_BOOMERANG`

所以：

- 普通 ATTACK + 回力標 → 30% 橫掃
- StatusChange + 回力標 → 不轉換，仍單一目標
- ContinuationAttack + 回力標 → 不轉換，仍對單一目標 N 段

V0.75 保留這個差異，沒有因為 `weaponType===BOOMERANG` 就把所有特殊物理技誤改成橫掃。

fixed data 同樣有：

- Enemy 2329 / 2335 / 10001 / 10004 / 10007 / 10010
- `STYLE=5`
- 回力標
- 其中多隻會使用 ContinuationAttack / StatusChange / PowerBalance 等

因此這個 ATTACK-only boomerang 轉換也是可達規則，不是純理論保護。

### V0.74 校正：Combo wake timing

在 V0.75 開始前也重新逐行對過原 `BATTLE_Combo()`。

來源其實是：

- 每一 member 先算自己的 damage
- 正常合擊傷害先累加
- 最後一 member 才用 `BATTLE_DamageSub2` 一次扣總 HP
- **但每一 member 只要自己的 damage > 0，就立即呼叫 `BATTLE_DamageWakeUp()`**

因此 V0.74 已補一筆精準校正：

- 不再等總傷害扣血後才醒
- 每一段正傷害算出後就先解除睡眠
- 總 HP 傷害仍最後一次寫入

這不改 V0.74 的合擊傷害模型，只修正 source timing。

### V0.75 回歸

目前確認：

- `game.js` JavaScript 語法：PASS
- Enemy 961：
  - STYLE 4
  - 正權重 StatusChange 61/80/90/100/110
  - 已走 BOW shared weapon loop
- Enemy 2332：
  - STYLE 4
  - Skill 13 五段攻擊
  - 已以 5 覆寫 attack_max 並使用 BOW target list
- Enemy 11003：
  - STYLE 6
  - Skill 16/17 八／九段攻擊
  - STYLE 6 → Item 700 BREAKTHROW
  - 已保留逐擊麻痺
- STYLE mapping 再驗：
  - 4 → Item 400 BOW
  - 5 → Item 500 BOOMERANG
  - 6 → Item 700 BREAKTHROW
  - 7 → Item 600 BOUNDTHROW
- Item 400 AttackNum：1～3
- Item 700 AttackNum：1～1
- Item 600 AttackNum：1～1
- StatusChange 的 BREAKTHROW 預設麻痺：會被技能 status 覆寫
- ContinuationAttack 的 BREAKTHROW 麻痺：保留
- schema：仍為 **21**

V0.75 至此把「武器只影響普通 ATTACK」再往前推成原 C 的正確模型：**任何實際落入 shared weapon loop 的 command，都要服從該回合的武器 target / attack-count 規則；但 BOOMERANG 的特殊 command 轉換仍只屬於普通 ATTACK。**



## V0.76 DRUNK lifecycle source bug

V0.76 校正的是 fixed C 的酒醉實際生命週期，不採資料說明文字推測。

固定來源：

- `gavinlinasd/StoneAge`
- ref `1f90cb6cb57c1df70f39cde77a5a8ccd98b66c56`
- `gmsv/src/battle/battle_event.c`
- `gmsv/src/battle/battle_magic.c`
- `gmsv/src/battle/battle.c`
- `gmsv/src/char/char.c`

### 一般物理 StatusChange 的原 bug

`BATTLE_Attack()` 在酒醉命中成功後先做：

```c
CHAR_setWorkInt(defindex, StatusTbl[BATTLE_ST_DRUNK],
    gBattleStausTurn + 1);
```

緊接著原碼不是把 QUICK 減半，而是：

```c
CHAR_setWorkInt(defindex, CHAR_WORKDRUNK,
    CHAR_getWorkInt(defindex, CHAR_WORKDRUNK) / 2);
```

也就是 **把酒醉倒數本身除以 2**。

fixed ref 全域搜尋沒有另一條一般 DRUNK 命中時把 `CHAR_WORKQUICK` 除 2 的路徑。

所以 Skill 100：

`醉 turn 3 攻%-30`

在一般 `BATTLE_Attack()` 成功附加後實際是：

```text
turn 3
→ 先存 4
→ CHAR_WORKDRUNK = 4 / 2
→ 最終 stored turn = 2
```

V0.76 的 `sourceEnemyApplyStatusAttackHit()` 現在保留這個 bug。

### 酒醉期間 QUICK 不下降

`_CHAR_complianceParameter()` 每輪會：

```c
WORKQUICK = WORKFIXDEX
```

而且函式完全不讀 `CHAR_WORKDRUNK`。

`BATTLE_StatusSeq()` 的 `CHAR_WORKDRUNK` case 本身也沒有降低 QUICK。

因此 V0.75 以前 web 用「酒醉期間 QUICK /2」做對稱轉譯，雖然看起來合理，但不是這個 fixed build 的真實行為。

V0.76 改為：

- 酒醉 active 時 QUICK 維持原值
- 酒醉者攻擊時仍依 `BATTLE_DuckCheck()` 讓目標回避額外 `RAND(20,30)`
- 不再虛構敏捷減半

### 酒醉解除反而 QUICK ×2

原 `BATTLE_StatusSeq()` 在倒數減到 0 時：

```c
if(StatusTbl[i] == CHAR_WORKDRUNK){
    CHAR_setWorkInt(charaindex, CHAR_WORKQUICK,
        CHAR_getWorkInt(charaindex, CHAR_WORKQUICK) * 2);
}
```

也就是來源因前面的 bug 沒有真的把 QUICK 減半，卻仍執行「還原」：

**酒醉解除的該回合 QUICK 反而翻倍。**

下一個 battle turn 的：

`BATTLE_PreCommandSeq() -> CHAR_complianceParameter()`

會再把：

`WORKQUICK = FIXDEX`

所以這個 2× 不是永久能力增加，而是只存在於「酒醉剛解除的剩餘當回合」。

V0.76 新增：

`battleDrunkReleaseBoostKeys`

用途：

1. 每輪 `normalBattleOrder()` 開始時清空，等價下一輪 PreCommandSeq 重建 QUICK。
2. `processBattleStatusTurn()` 若 DRUNK 倒數剛歸 0，把該角色加入 transient set。
3. 該回合後續 `battleDrunkQuick()` 對這個角色回傳 base QUICK ×2。
4. 下一輪自動清除。

排序本身發生在 StatusSeq 前，所以解除當次的 2× QUICK 不會倒灌改變已完成的 EntrySort；但會影響該次行動後續使用 WORKQUICK 的命中／回避／會心等計算，符合原流程。

### 魔法酒醉不能套物理 /2 bug

`BATTLE_MultiStatusChange()` 是另一條獨立路徑。

成功時只做：

```c
CHAR_setWorkInt(toindex, StatusTbl[status], turn);
```

沒有：

`CHAR_WORKDRUNK / 2`

因此 Combined 的酒醉精靈 magic 179：

- 原 magic turn = 5
- web 仍用 `battleStatusApplyRaw(..., 5)`
- 不套一般物理 `(turn+1)/2`

但它倒數歸零時仍經同一個 `BATTLE_StatusSeq()`，因此同樣會出現解除當回合 QUICK ×2 的來源 bug。

### fixed data 可達性

這不是只為理論相容性。

正權重 Enemy AI 中：

- Skill 100「泥醉攻擊」
- `PETSKILL_StatusChange`
- option：`醉 turn 3 攻%-30`
- 共有 **22 個 Enemy** 正權重引用
- 包含 V0.75 已驗證的 Enemy 961：
  - STYLE 4
  - BOW
  - 酒醉攻擊可進 aBowW 多發流程

所以 V0.76 會直接改變目前可實際遇到的戰鬥結果。

### V0.76 回歸

確認：

- `game.js` JavaScript 語法：PASS
- Skill 100 fixed option：`醉 turn 3 攻%-30`
- 物理酒醉 stored turn：`(3+1)/2 = 2`
- magic 179 stored turn：5
- 酒醉 active：不再 QUICK /2
- 酒醉解除：當回合 transient QUICK ×2
- 下一輪 `normalBattleOrder()` 清 transient boost
- `BATTLE_DuckCheck` 的 DRUNK +20～30 回避懲罰保留
- V0.75 ranged StatusChange / Continuation weapon flow 保留
- save schema：仍為 **21**



## V0.77 WEAKEN / BARRIER PreCommand lifecycle

V0.77 校正兩個已可達、但倒數位置不同於一般 StatusTbl 的狀態：

- WEAKEN / 虛弱
- BARRIER / 魔障

固定來源：

- `gavinlinasd/StoneAge`
- ref `1f90cb6cb57c1df70f39cde77a5a8ccd98b66c56`
- `gmsv/src/battle/battle.c`
- `gmsv/src/battle/battle_event.c`
- `gmsv/src/battle/battle_magic.c`
- `gmsv/src/char/char.c`
- `gmsv/src/item/item.c`

### 為何不能用一般 StatusSeq 倒數

原 `BATTLE_StatusSeq()` 會先：

```c
cnt = StatusTbl[i];
StatusTbl[i] = --cnt;
```

但 WEAKEN / BARRIER 立刻有特殊保護：

```c
if (CHAR_WORKWEAKEN > 0)
    StatusTbl[i] = cnt + 1;

if (CHAR_WORKBARRIER > 0)
    StatusTbl[i] = cnt + 1;
```

因此只要 decrement 後仍 >0，StatusSeq 的這次 -1 會被加回去。

真正的持續時間消耗發生在每輪：

`BATTLE_PreCommandSeq() -> CHAR_complianceParameter() -> Other_DefcharWorkInt()`

且發生在 `EntrySort()` 之前。

### WEAKEN

原 `BATTLE_MultiParamChangeTurn()` 成功後：

```c
CHAR_WORKWEAKEN = turn + 1;
```

每次下一輪 complianceParameter：

```c
if (CHAR_WORKWEAKEN > 0) {
    FIXSTR   *= 0.8;
    FIXTOUGH *= 0.8;
    FIXDEX   *= 0.8;
    CHAR_WORKWEAKEN--;
}
```

所以：

- 技能命中同一輪，不會立刻把攻／防／敏乘 0.8。
- 下一次 PreCommandSeq 才建立被虛弱的本輪 FIX 快照。
- QUICK 在 EntrySort 前已被降為 80%，所以會影響出手排序。
- FIXTOUGH 同樣是 80%，不只是顯示用 defense。
- 每輪都先從基礎能力重建 FIX，再乘 0.8，因此不會發生 0.8 × 0.8 × 0.8 的永久累乘。

V0.77 新增 `battleWeakenRoundKeys`：

- 每個 PreCommandSeq 重新建立。
- 只代表「本輪 FIX 已被 WEAKEN 乘過 0.8」。
- 即使 WEAKEN 在該角色行動時剛好歸零，本輪已經生成的 0.8 FIX 仍保留到下一輪，符合原 C。

### BARRIER

原 `BATTLE_S_Barrier()` 成功：

```c
CHAR_WORKBARRIER = turn + 1;
```

真正 -1 同樣位於 complianceParameter：

```c
if (CHAR_WORKBARRIER > 0)
    CHAR_WORKBARRIER--;
```

而 `BATTLE_CanMoveCheck()` 只要 BARRIER >0 就禁止行動。

因此 BARRIER 的實際時序會保留施法先後差異：

- 若施法者先出手、目標本輪尚未行動：
  - 目標同輪就會被 BARRIER 擋住。
  - 這一輪沒有再經 PreCommand，因此 stored `turn+1` 正好保留。
- 若目標已先行動：
  - 第一次真正消耗發生在下一輪 PreCommandSeq。

例如 `turn 1`：

- stored = 2
- 下一輪 PreCommand → 1
- 該輪行動開始時仍被擋
- StatusSeq 將 1 減成 0 並解除

V0.77 不再像一般異常那樣每次角色行動直接扣一次 BARRIER。

### StatusSeq 的最後一格

WEAKEN / BARRIER 若進 StatusSeq 時：

- turns >1：來源 `--cnt` 後仍 >0，因此又寫回 `cnt+1`，淨值不變。
- turns ==1：來源先降成 0，特殊保護條件已不成立，因此真正解除。

web 現在同樣：

- >1：保持不變
- ==1：在該次行動解除
- 若 PreCommand 已先把 1 扣成 0，則直接在 PreCommand 階段視為失效

### 可達 fixed data

WEAKEN：

- 575 虛弱：`虚 turn 3 成 50`
- 576 全體虛弱：`虚 turn 3 成 50`
- 正權重 AI 引用共 8 個 slot reference

BARRIER：

- 579 魔障：`障 turn 1 成 50`
- 594 究極魔障：`障 turn 3 成 50`
- 正權重 AI 引用共 14 個 slot reference

所以這不是未使用相容碼，而是目前遊戲會實際抽到的 Enemy 行為。

### V0.77 回歸

確認：

- `game.js` JavaScript 語法：PASS
- WEAKEN 命中同輪：不立即 0.8
- WEAKEN turn 3：接下來三個 PreCommand round 套 0.8
- WEAKEN round snapshot：Attack / Defense / Quick / FixedTough 均依來源縮減
- Pet FixedTough ×0.8：整數截斷
- BARRIER turn 1 / turn 3：依 PreCommand 扣回合
- 施法者比目標快時：目標同輪可立即被 BARRIER 阻止
- 施法者比目標慢時：不會倒扣已經結束的目標行動
- StatusSeq 不會對 >1 的 WEAKEN / BARRIER 再多扣一次
- V0.76 DRUNK lifecycle 保留
- save schema：仍為 **21**



## V0.78 StatusChange stat modifiers / PreCommand FIX ordering

V0.78 修正的是兩個彼此相連、而且 fixed data 已大量可達的本輪能力值時序：

1. `PETSKILL_StatusChange()` 的 `攻%` / `防%` 不是文字說明，而是真的在 AI 決定技能時改寫本回合 WORK 能力。
2. WEAKEN 必須先在 `BATTLE_PreCommandSeq() -> complianceParameter()` 形成 0.8 FIX 快照，再讓後續 PetSkill 以這個快照計算自己的能力修正。

固定來源：

- `gavinlinasd/StoneAge`
- ref `1f90cb6cb57c1df70f39cde77a5a8ccd98b66c56`
- `gmsv/src/battle/pet_skill.c`
- `gmsv/src/battle/battle.c`
- `gmsv/src/item/item.c`

### PETSKILL_StatusChange 的真實攻擊力修正

原 `PETSKILL_StatusChange()` 會解析 option：

```c
if ((pszP = strstr(pszOption, "攻%")) != NULL) {
    sscanf(pszP+3, "%f", &fPer);
    fPer = fPer / 100;
    strdef = CHAR_getWorkInt(charaindex, CHAR_WORKFIXSTR);
    strdef = (int)(strdef * fPer);
    CHAR_setWorkInt(charaindex, CHAR_WORKATTACKPOWER,
        CHAR_getWorkInt(charaindex, CHAR_WORKFIXSTR) + strdef);
}
```

所以這不是：

`最後傷害 × 0.7`

而是：

`WORKATTACKPOWER = FIXSTR + trunc(FIXSTR * pct / 100)`

之後才進 `BATTLE_DamageCalc()`。

因為原傷害公式對 attack / defense 是非線性的，這兩種做法不能互換。

### fixed data 的 7 種正權重 StatusChange

重新掃 `stoneage_petskill_runtime.json` 與 `stoneage_enemy_ai.json`：

- 60 毒攻擊：`毒 turn 3 攻%-30` — 31 個 Enemy
- 61 猛毒攻擊：`毒 turn 5 攻%-50` — 26 個 Enemy
- 80 石化攻擊：`石 turn 3 攻%-30` — 48 個 Enemy
- 90 混亂攻擊：`亂 turn 3 攻%-30` — 50 個 Enemy
- 100 泥醉攻擊：`醉 turn 3 攻%-30` — 22 個 Enemy
- 110 催眠攻擊：`眠 turn 3 攻%-30` — 34 個 Enemy
- 708 石化攻擊：`石 turn 9 攻%-30` — Enemy 5129 正權重使用

七種全部是目前實際可抽到的 AI 行為。

V0.78 的 `enemyPrepareRoundAction()` 現在會在 EntrySort 前依 source option 建立本輪：

- `roundAttack`
- 若來源 option 有 `防%`，也同樣建立 `roundDefense`

目前正權重七種 StatusChange 都只有攻擊修正，但保留來源的防禦 parser，未猜任何額外數值。

### WEAKEN 與 PetSkill 的正確先後

V0.77 已把 WEAKEN 真正倒數位置移回：

`PreCommandSeq -> complianceParameter -> Other_DefcharWorkInt`

V0.78 再補上更深一層的順序。

原 `Other_DefcharWorkInt()`：

1. 先重建 / 套裝備與既有 battle buff 的 FIXSTR / FIXTOUGH / FIXDEX。
2. 大地鎧甲等 FIX buff 先套用。
3. 若 `CHAR_WORKWEAKEN > 0`：
   - FIXSTR ×0.8
   - FIXTOUGH ×0.8
   - FIXDEX ×0.8
   - WEAKEN counter -1
4. 最後：
   - WORKATTACKPOWER = FIXSTR
   - WORKDEFENCEPOWER = FIXTOUGH
   - WORKQUICK = FIXDEX
5. 之後才執行 Enemy AI / `PETSKILL_*`，讓技能再基於這個 FIX 值覆寫本回合 WORK。

所以正確模型不是：

`Skill modifier -> 最後再 ×0.8`

而是：

`PreCommand WEAKEN ×0.8 -> C int truncation -> Skill modifier -> C int truncation`

兩者在很多整數值上會差 1。

### Enemy 本輪 FIX snapshot

V0.78 的 `enemyPrepareRoundAction()` 現在先建立：

- `sourceFixAttack`
- `sourceFixDefense`
- `sourceFixQuick`

順序：

1. 基礎 Enemy compliant stats
2. 大地鎧甲等已存在 FIX buff
3. WEAKEN 0.8
4. 各 PetSkill 自己的本輪 stat write

並讓：

- StatusChange
- BattleModel
- BattleTearDamage
- AttackCrazed
- SpeedyAttack
- BattleTimid
- 2BattleTimid
- Firekill
- Lighttakeed
- PowerBalance
- FallGround
- Guardian
- WildViolentAttack
- Regret

等會改本回合能力值的來源分支，都從同一份 PreCommand FIX snapshot 起算。

### Enemy battle view 不再二次套 WEAKEN

V0.77 以前 web 仍在 `enemyBattleView()` 最後再檢查 WEAKEN 並 ×0.8。

V0.78 改為：

- Enemy 的 WEAKEN 已經在 `enemyPrepareRoundAction()` 前置 snapshot 正確套過一次。
- `enemyBattleView()` 只讀已完成的 `roundAttack / roundDefense / roundQuick`。
- 不再二次 0.8。

Player / Active Pet 因目前沒有相同的 Enemy AI PetSkill stat-write 流程，仍由各自 battle view 使用 V0.77 的 round snapshot 語意。

### V0.78 回歸

確認：

- `game.js` JavaScript 語法：PASS
- 正權重 Skill ID：158
- 已執行 handler：134
- 原資料缺失：22
- 原 build 未註冊：2
- dispatcher gap：0
- StatusChange 正權重六種 option 全部可解析 `攻%`
- 猛毒：-50%
- 其餘五種：-30%
- WEAKEN 先於 Skill modifier
- Enemy battle view 不再二次 WEAKEN
- StatusChange 專用 branch：僅一條
- V0.77 WEAKEN / BARRIER lifecycle 保留
- V0.76 DRUNK lifecycle bug 保留
- V0.75 ranged StatusChange / Continuation weapon flow 保留
- V0.74 Combo lifecycle 保留
- V0.73 BOW DuckCheck / Guardian rules 保留
- save schema：仍為 **21**



## V0.79 Charge / EarthRound PreCommand lifecycle

V0.79 校正兩個 fixed data 已實際可達的跨回合 PetSkill：

- 30 突擊：`1 攻%+90`，62 個正權重 Enemy。
- 31 雙重突擊：`2 攻%+110`，23 個正權重 Enemy。
- 605 三重突擊：`3 攻%+150`，fixed AI 中實際有正權重引用。
- 120 地球一周：`攻%+90`，12 個正權重 Enemy。

固定來源仍為：

- `gavinlinasd/StoneAge`
- ref `1f90cb6cb57c1df70f39cde77a5a8ccd98b66c56`
- `gmsv/src/battle/pet_skill.c`
- `gmsv/src/battle/battle.c`
- `gmsv/src/battle/battle_event.c`
- `gmsv/src/battle/battle_ai.c`

### Charge 不是鎖定第一次出招時的攻擊力

`PETSKILL_ChargeAttack()` 第一回合只把：

- 蓄力回合數寫入 COM3 low。
- `攻%` 寫入 COM3 high。
- command 改成 `BATTLE_COM_S_CHARGE`。

真正釋放由 `BATTLE_Charge()` 處理：

```c
pow = CHAR_getWorkInt(attackindex, CHAR_WORKFIXSTR);
pow += pow * N * 0.01;
CHAR_setWorkInt(attackindex, CHAR_WORKATTACKPOWER,
    pow + CHAR_getWorkInt(attackindex, CHAR_WORKMODATTACK));
```

所以釋放傷害使用的是**釋放回合重新完成 complianceParameter 後的 FIXSTR**。

V0.79 的 `performEnemyChargeState()` 現在改用該回合已建立的 `unit.roundAttack` FIX snapshot，再依 +90% / +110% 做 C-style truncation。

目前 fixed 正權重 Enemy 可達系統沒有建立 `CHAR_WORKMODATTACK` 的來源；正權重 Combined 只有 21 / 61 / 139 / 159 / 169 / 179 / 189 / 230 / 240，AttackMagic 為 301～325、204、435，不會寫該 work-int。因此目前 runtime 的額外 MODATTACK 等價 0，不自行虛構欄位。

### Charge 持續回合

`BATTLE_IsCharge()` 對 `BATTLE_COM_S_CHARGE` 回傳 TRUE。

因此每輪 `BATTLE_AllCharaCWaitSet()` 不會把 command 清掉，Enemy AI 也會直接跳過重新選招。

N=1：

1. 第一次使用技能：BATTLE_Charge 把 low 1 -> 0，不攻擊。
2. 下一輪正常 PreCommand。
3. BATTLE_Charge 看到 low 0，改成 CHARGE_OK。
4. 同一輪落入 shared physical attack loop 釋放。

N=2 則再多一輪等待。

V0.79 保留此 1 / 2 回合等待語意。

### EarthRound0 是 PreCommand 的明確例外

`PETSKILL_EarthRound()` 第一回合：

- command = `BATTLE_COM_S_EARTHROUND1`
- COM3 = `攻%+90`

`BATTLE_EarthRoundHide()`：

- `CHAR_ISATTACKED = 0`
- command -> `BATTLE_COM_S_EARTHROUND0`

下一輪 `BATTLE_PreCommandSeq()` 在清 Guardian 後立刻：

```c
if (CHAR_getWorkInt(charaindex, CHAR_WORKBATTLECOM1)
    == BATTLE_COM_S_EARTHROUND0) continue;
```

因此該隱身角色這一輪不會執行：

- `CHAR_complianceParameter()`
- `BATTLE_TurnParam()`
- FIXSTR / FIXTOUGH / FIXDEX 重建
- WEAKEN / BARRIER 的 compliance 階段扣回合
- `BATTLE_AttReverse()` 的 FIX 屬性重建

V0.79 新增角色級：

- `sourceEnemySkipsPreCommandCompliance()`
- `sourcePreCommandKeySkipsCompliance()`
- `sourcePreCommandResetTransient()`

並讓 EARTHROUND0 保留上一輪：

- roundAttack / roundDefense / roundQuick
- WEAKEN 已形成的 FIX snapshot
- BARRIER counter
- 酒醉解除時來源 bug 留下的暫時 QUICK ×2
- FIX attribute snapshot

### WEAKEN 1 -> 0 後進入 EarthRound 的特殊結果

若 EarthRound 第一回合的 PreCommand：

- WEAKEN counter 原為 1
- 先把 FIXSTR / FIXTOUGH / FIXDEX ×0.8
- 再把 WEAKEN 1 -> 0
- 之後才選到 EarthRound

則角色進入 EARTHROUND0 時，status 已經沒有 WEAKEN，但**這一輪已建立的 0.8 FIX snapshot 仍存在**。

下一隱身輪因 PreCommand 被跳過，該 0.8 snapshot 繼續保留到現身攻擊。

V0.79 保留這個看似反直覺但由 fixed C 呼叫順序直接產生的行為。

### EarthRound 的 +90% 仍是最終傷害倍率

battle.c 對 EARTHROUND0：

```c
gBattleDamageModyfy =
    1.0 + 0.01 * CHAR_getWorkInt(charaindex, CHAR_WORKBATTLECOM3);
```

所以 Skill 120 的 `攻%+90` 在這裡不是改 WORKATTACKPOWER，而是：

`gBattleDamageModyfy = 1.9`

V0.79 保留現有 `damageMultiplier = 1.9`；本版只修正它進入這個倍率前應沿用哪一輪的 WORK/FIX snapshot。

### 混亂會中斷跨回合技能

`BATTLE_IsCharge()` 只因 command 仍為：

- CHARGE
- EARTHROUND1
- EARTHROUND0

才讓跨回合流程延續。

`BATTLE_StatusSeq()` 的 CONFUSION 若發作，會把 command 強制改成普通 ATTACK 並換亂數目標。

之後下一輪 `BATTLE_AllCharaCWaitSet()` 不再視為 charge，因此原技能鏈結束。

現版原本已有：

- 混亂時清 `chargeState`
- 混亂時清 `earthRoundState`
- EarthRound 重新現身

V0.79 回歸確認這條仍保留。

### V0.79 回歸

確認：

- `game.js` JavaScript 語法：PASS
- 正權重 Skill ID：158
- 已執行 handler：134
- 原資料缺失：22
- 原 build 未註冊：2
- dispatcher gap：0
- Charge 30：62 個 Enemy
- Charge 31：23 個 Enemy
- Charge 605：fixed AI 正權重可達，3 回合後 +150%
- EarthRound 120：12 個 Enemy
- Charge release 使用 release-round FIX snapshot
- EarthRound hidden round 跳過 WEAKEN/BARRIER compliance tick
- EarthRound hidden round保留 DRUNK release boost
- EarthRound hidden round保留 FIX attribute work
- EarthRound release 仍為 final damage ×1.9，不改成 attack ×1.9
- Confusion 會中斷 Charge / EarthRound
- V0.73～V0.78 回歸標記保留
- save schema：仍為 **21**



## V0.80 FIXSTR consumers / roundFix snapshot

V0.80 把一批「原 C 明確讀 `CHAR_WORKFIXSTR`」的可達技能，從永久 base attack 改回每輪 PreCommand 已完成 compliance 後的 FIX snapshot。

固定來源：

- `gavinlinasd/StoneAge`
- ref `1f90cb6cb57c1df70f39cde77a5a8ccd98b66c56`
- `gmsv/src/battle/pet_skill.c`
- `gmsv/src/battle/battle.c`

### roundFix snapshot

V0.78 已在 `enemyPrepareRoundAction()` 算出：

- `sourceFixAttack`
- `sourceFixDefense`
- `sourceFixQuick`

V0.80 將它們明確保存為：

- `roundFixAttack`
- `roundFixDefense`
- `roundFixQuick`

之後只要原 C 寫的是 `CHAR_WORKFIXSTR / FIXTOUGH / FIXDEX`，web 就可以直接讀同一輪 `roundFix*`，不再把永久 `unit.attack / defense / quick` 冒充 FIX。

EARTHROUND0 因 V0.79 會跳過 PreCommand，因此隱身者也會自然保留上一輪的 roundFix snapshot。

### Gyrate / 回旋攻擊

原 `PETSKILL_Gyrate()` 在 AI 階段就解析：

`攻%`

並以：

`FIXSTR + trunc(FIXSTR * pct / 100)`

直接寫本輪 `WORKATTACKPOWER`。

正權重：

- 619 回旋攻擊：`攻%-50` — 1 個 Enemy
- 653 T回旋攻擊：`攻%+20` — 5 個 Enemy

V0.80 現在在 `enemyPrepareRoundAction()` 先以當輪 `sourceFixAttack` 完成這個覆寫；`performEnemyGyrate()` 只讀已完成的 `roundAttack`。

因此若同輪已有 WEAKEN 或其他 compliance FIX 修正，Gyrate 不會再錯誤回到永久 base attack。

### Retrace / 追跡攻擊

資料：

- 713 追跡攻擊
- option：`攻%+100`
- 4 個 Enemy 正權重使用

但 fixed `PETSKILL_Retrace()` 裡解析 `攻%` 的整段程式被：

```c
/*
 ...
*/
```

完整註解掉。

所以首擊**不吃 option 的 +100%**。

battle.c 只有在首擊被 DODGE 後：

- `RAND(1,100) < 80`，實際成功值 1～79
- 成功才硬寫：

```c
WORKATTACKPOWER =
    FIXSTR + FIXSTR * 0.2;
```

再做第二擊。

V0.80 保留：

- 首擊：正常當輪 WORK attack，不套 +100%
- 追擊：當輪 `roundFixAttack +20%`
- Counter loop：仍依原碼使用第一擊的回傳狀態

### DamageToHp 503～505

正權重：

- 503 嗜血技：23 個 Enemy
- 504 嗜血技2：8 個 Enemy
- 505 嗜血技3：24 個 Enemy

原 parser：

```c
def = (atoi(buf1) / 100);
strdef = FIXSTR - (int)(FIXSTR * def);
```

因為 `atoi(buf1)` 與 `100` 都是 int：

- 30 / 100 = 0
- 20 / 100 = 0
- 10 / 100 = 0

所以資料描述中的攻擊下降實際不生效。

但原結果仍是：

`WORKATTACKPOWER = 當輪 FIXSTR`

而不是永久 base STR。

V0.80 因此：

- 保留 C integer-division bug
- reduction 仍為 0
- 但基底改成 `roundFixAttack`

這樣 WEAKEN 等 PreCommand FIX 修正不會被 handler 意外洗掉。

### DamageToHp2 / 浴血狂襲

659 T浴血狂襲有正權重 Enemy 使用。

原 `BATTLE_AttackSeq(..., BATTLE_COM_S_DAMAGETOHP2)`：

1. 先完成正常 CriticalCheck
2. perCri ×1.3
3. 再硬寫：
   `WORKATTACKPOWER = FIXSTR + FIXSTR * 0.2`
4. QUICK +20% 只屬 `BATTLE_DexCalc` 排序，不改 CriticalCheck 所使用的 FIXDEX

V0.80 現在 DamageToHp2 的傷害攻擊力改為：

`roundFixAttack +20%`

不再用永久 `unit.attack +20%`。

### Charge 也改用明確 roundFix

V0.79 已確認 `BATTLE_Charge()` 釋放時讀的是釋放回合：

`CHAR_WORKFIXSTR`

V0.80 因此再把 release 基底由泛用 `roundAttack` 改成明確：

`roundFixAttack`

避免未來其他 WORKATTACKPOWER 型技能修正混入 Charge 的 FIXSTR 基底。

### V0.80 回歸

確認：

- `game.js` JavaScript 語法：PASS
- 正權重 Skill ID：158
- 已執行 handler：134
- 原資料缺失：22
- 原 build 未註冊：2
- dispatcher gap：0
- `roundFixAttack / Defense / Quick` 每輪建立
- Gyrate：Prep 階段以 FIXSTR 套 option
- Retrace：首擊不套 +100%；追擊 FIXSTR +20%
- DamageToHp2：FIXSTR +20%
- DamageToHp 503～505：保留 int division 0，但基底為 FIXSTR
- Charge：release 使用 roundFixAttack
- EarthRound：V0.79 hidden snapshot 行為保留
- 永久 `unit.attack` 的直接整數讀取，只剩 PreCommand 建立 sourceFixAttack 的合法入口
- V0.73～V0.79 回歸標記保留
- save schema：仍為 **21**



## V0.81 FIXDEX / WORKQUICK separation

V0.81 把 fixed C 中「FIXDEX」與「WORKQUICK」的用途正式拆開。

固定來源：

- `gavinlinasd/StoneAge`
- ref `1f90cb6cb57c1df70f39cde77a5a8ccd98b66c56`
- `gmsv/src/battle/battle_event.c`

### 哪些地方讀 FIXDEX

原碼：

- `BATTLE_DuckCheck()`
- `BATTLE_CriticalCheckPlayer()`
- `BATTLE_CounterCalc()`
- `BATTLE_CaptureCheck()`

全部直接讀 `CHAR_WORKFIXDEX`，不是 `CHAR_WORKQUICK`。

但 `BATTLE_DexCalc()` 的 EntrySort 則讀本回合 WORKQUICK。

因此 SpeedyAttack、本輪怯戰敏捷覆寫、酒醉解除 QUICK ×2、DamageToHp2 的 WORKQUICK +20% 等，可以改變行動順序，卻不應直接改變回避／會心／反擊公式。

### battle view 的雙敏捷欄位

V0.81 現在每個 battle view 同時提供：

- `quick`：WORKQUICK 語意，給 EntrySort 與真正讀 WORKQUICK 的流程。
- `fixedDex`：FIXDEX 語意，給 Duck / Critical / Counter / Capture。

Player / Active Pet 的 `fixedDex` 為該輪 PreCommand 後 dex snapshot；Enemy 的 `fixedDex = roundFixQuick`。

### DuckCheck：不能行動就不能閃避

fixed `BATTLE_DuckCheck()` 在一般回避公式之前先檢查 `BATTLE_CanMoveCheck(defender)`。

若為 FALSE，直接 return FALSE。

因此麻痺、石化、睡眠、魔障、暈眩等不可行動狀態，都不能再靠普通 DuckCheck 閃避。

V0.81 的 `resolveNormalAttack()` 現在在 `defender.canMove === false` 時直接禁用整個普通 dodge 判定；GUARD 仍同樣直接禁用 DuckCheck。

### Duck / Critical / Counter 全改 FIXDEX

V0.81 的：

- `battleDuckChance()`
- `battleCriticalChance()`
- `battleCounterChance()`

現在都優先讀 `fixedDex`；只有非 battle-view fallback 才退回 `quick`。

所以若 FIXDEX=100、WORKQUICK=200：

- 出手排序用 200
- 回避／會心／反擊仍用 100

### CaptureCheck 也改回 FIXDEX

原 `BATTLE_CaptureCheck()`：

```c
At_Dex = CHAR_getWorkInt(attackindex, CHAR_WORKFIXDEX);
Df_Dex = CHAR_getWorkInt(defindex, CHAR_WORKFIXDEX);
```

V0.81：

- Player 用 `playerBattleView().fixedDex`
- Enemy 用 `roundFixQuick`
- UI 預覽尚未建立當輪 snapshot 時，Enemy 才退回 compliant `quick`

實際 capture roll 發生在 `normalBattleOrder()` 完成 PreCommand snapshot 後，因此真正判定會讀到當輪 FIXDEX。

### CaptureCheck 的 C int arithmetic

原碼相關變數全部是 int：

```c
Df_HpPer = 10 - (HP * HP) / MaxHP;
Df_Level = At_Level/2 - Df_Level/2;
Df_Dex = At_Dex/15 - Df_Dex/15;
WorkGet =
  (Df_HpPer + Df_Level + Df_Dex + Df_Ge + At_Luck)
  * At_Charm / 50;
```

V0.81 已改成逐步 `Math.trunc`，不再用 JavaScript 浮點一路算到底。

原碼只限制 `WorkGet > 99`，沒有把負數強制改成 0；web 同樣保留 raw 負值，只在 UI 顯示時 clamp 到 0～99。

### Capture success 的 strict less-than

來源：

```c
if (RAND(1,100) < WorkGet)
```

因此 WorkGet=20 時成功 roll 是 1～19，不是 1～20。

V0.81 實際捕獲改為 `cRand(1,100) < raw`，完整保留 strict-less-than。

### V0.81 回歸

確認：

- `game.js` JavaScript 語法：PASS
- save schema：21
- 正權重 Skill coverage：158 / 134 / 22 / 2 / gap 0
- Player / Pet / Enemy 都有 `fixedDex`
- Enemy `fixedDex = roundFixQuick`
- Duck 使用 FIXDEX
- Critical 使用 FIXDEX
- Counter 使用 FIXDEX
- EntrySort 仍使用 WORKQUICK
- CannotMove defender 不再普通閃避
- Capture 使用雙方 FIXDEX
- Capture HP / level / dex / charm 全部 C int truncation
- Capture success 使用 `RAND(1,100) < WorkGet`
- V0.73～V0.80 回歸標記保留



## V0.82 FIXDEX integer combat math

V0.82 繼續校正 fixed C 的核心物理戰鬥算術，重點不是改公式，而是補上 C `int` 變數的實際截斷時點。

固定來源：

- `gavinlinasd/StoneAge`
- ref `1f90cb6cb57c1df70f39cde77a5a8ccd98b66c56`
- `gmsv/src/battle/battle_event.c`

原常數：

```c
float gKawashiPara = 0.02;
float gCounterPara = 0.08;
float gCriticalPara = 0.09;
#define KAWASHI_MAX_RATE (75)
```

這些常數在 web 版原本已經正確；V0.82 沒有改它們。

### Duck 的 int FIXDEX compound assignment

`BATTLE_DuckCheck()`：

```c
int Df_Dex, At_Dex;
...
At_Dex = CHAR_getWorkInt(... CHAR_WORKFIXDEX);
Df_Dex = CHAR_getWorkInt(... CHAR_WORKFIXDEX);

if(enemy -> pet) At_Dex *= 0.8;
else if(non-enemy -> pet) Df_Dex *= 0.8;
else if(non-player -> player) At_Dex *= 0.6;
else if(player -> non-player) Df_Dex *= 0.6;
```

因為 `At_Dex / Df_Dex` 是 `int`，所以 C 的：

`Df_Dex *= 0.8`

不是保留 `.8` 小數，而是算完後立刻截斷回整數。

V0.81 雖已改讀 FIXDEX，但 JS 仍讓小數一路進 `sqrt()`。

V0.82 改成：

```js
dfDex = Math.trunc(dfDex * .8)
```

同理處理 `.6` 與 attacker scaling。

### Critical 的 int FIXDEX scaling

`BATTLE_CriticalCheckPlayer()` 中：

- `At_Dex`：int
- `Df_Dex`：int
- `At_Luck`：int
- `At_Soubi`：int
- `Work`：float

因此 V0.82：

- FIXDEX 的 `.8 / .6` 先按 int 截斷
- Luck / weapon critical 以 int 讀入
- `Work=(Big-Small)/gCriticalPara` 仍保持 float，不額外截斷

這是和 Counter 不同的地方。

### Counter 的第二層 int truncation

`BATTLE_CounterCalc()`：

```c
int Df_Dex, At_Dex, Work;
float per, Big, Small, wari, divpara;
...
Work = ( Big - Small ) / divpara;
```

所以 Counter 除了 FIXDEX 的 `.8 / .6` 要先截斷外，

`(Big-Small)/divpara`

在指派給 `int Work` 時還要再截斷一次。

V0.82 改成：

```js
let work = Math.trunc((big-small)/div);
```

之後才依原碼：

- root path：`sqrt(Work)`
- non-root path：直接 `Work`

### 可觀察差異

固定測例：

```text
attacker FIXDEX = 101
defender FIXDEX = 99
Enemy -> Pet
```

Duck：

- 舊 JS 浮點：約 `3016.6206`
- fixed C int：約 `3082.2070`

Counter：

- 舊 JS 浮點：`0.2`
- fixed C：`0`

原因是 Counter 的：

`(Big-Small)/10`

最後指派到 `int Work` 時被截斷為 0。

### V0.82 保留項目

V0.82 沒有改：

- gKawashiPara 0.02
- gCounterPara 0.08
- gCriticalPara 0.09
- KAWASHI_MAX_RATE 75%
- V0.73 BOW Duck +20 重複兩次的來源 bug
- V0.76 DRUNK lifecycle bug
- V0.77 WEAKEN / BARRIER lifecycle
- V0.78 StatusChange pre-command stat ordering
- V0.79 CHARGE / EARTHROUND lifecycle
- V0.80 FIXSTR consumers
- V0.81 FIXDEX / WORKQUICK separation
- save schema 21

### V0.82 regression

已確認：

- `game.js` JavaScript syntax：PASS
- Duck FIXDEX scaling 使用 int truncation
- Critical FIXDEX scaling 使用 int truncation
- Counter FIXDEX scaling 使用 int truncation
- Counter `Work` 使用 int truncation
- 公式常數與 fixed C 相同
- save schema：21



## V0.83 physical attribute integer pipeline

V0.83 校正普通物理傷害的四屬計算，讓 web 路徑對齊 fixed C 的分段 `int` 截斷。

固定來源：

- `gavinlinasd/StoneAge`
- ref `1f90cb6cb57c1df70f39cde77a5a8ccd98b66c56`
- `gmsv/src/battle/battle_event.c`

原流程：

```text
BATTLE_DamageCalc
→ BATTLE_AttrAdjust
→ At_pow[i] *= damage
→ BATTLE_AttrCalc
→ damage *= At_FieldPow / Df_FieldPow
```

### BATTLE_GetAttr / At_pow 都是 int

來源：

```c
int At_pow[5];
int Dt_pow[5];
```

四屬由 FIX 屬性讀入，負值歸 0，無屬性：

```text
none = max(0, 100 - earth - water - fire - wind)
```

V0.83 新增 `sourceBattleElements()`，明確以 `Math.trunc` 對齊來源 int。

### At_pow *= damage

來源會先：

```c
for(i=0;i<5;i++){
    At_pow[i] *= damage;
}
```

因此進 `BATTLE_AttrCalc()` 的攻方五屬已經是：

`element * rawDamage`

的 int 值。

### BATTLE_AttrCalc 的分量逐一截斷

`BATTLE_AttrCalc()` 的參數：

```c
int My_Fire,
int My_Water,
int My_Earth,
int My_Wind,
int My_None
```

而每個 My_* 又會接收含 1.5 / 0.6 的浮點加權式。

因為左值仍是 int，所以：

- Fire component 先截斷
- Water component 先截斷
- Earth component 先截斷
- Wind component 先截斷
- None component 先截斷

之後才加總。

函式本身也是：

```c
static int BATTLE_AttrCalc(...)
```

最後：

```c
return (iRet * D_ATTR);
```

其中：

```c
#define D_ATTR (1.0/(100*100))
```

所以 `/10000` 的結果還會因 return int 再截一次。

V0.83 直接復用現有魔法路徑已驗證過的：

`magicAttrCalcRaw()`

來保留這些截斷節點。

### 戰場屬性在 AttrCalc 之後才乘

來源：

```c
damage = BATTLE_AttrCalc(...);
damage *= (At_FieldPow / Df_FieldPow);
```

`damage` 是 int，所以場地倍率乘完又截斷。

V0.82 以前普通物理是：

```text
rawDamage
× attrMultiplier
× fieldRatio
→ 最後只 trunc 一次
```

V0.83 改成：

```text
rawDamage
→ 五屬分量逐一 trunc
→ /10000 trunc
→ fieldRatio
→ 再 trunc
```

### 可觀察差異

固定整數測例：

```text
raw damage = 89

攻方：
地 18 / 水 41 / 火 15 / 風 26

守方：
地 3 / 水 45 / 火 43 / 風 9
```

舊 web 單次 multiplier：

`94`

fixed C 分段 int：

`93`

因此這是實際可改變傷害結果的差異，不只是內部重構。

### V0.83 regression

已確認：

- `game.js` JavaScript syntax：PASS
- 普通物理使用 `sourceBattleElements()`
- `At_pow * rawDamage` 以 int 表示
- 屬性核心使用 `magicAttrCalcRaw()` 的 fixed C 分量截斷
- field ratio 在 AttrCalc 後獨立套用
- V0.82 FIXDEX int 截斷保留
- V0.76 DRUNK lifecycle 保留
- positive Enemy PetSkill coverage：158
- handled：134
- source missing：22
- source unregistered：2
- dispatcher gaps：0
- save schema：21



## V0.84 DamageCalc STONE / REGRET defense ordering

V0.84 校正 fixed C `BATTLE_DamageCalc()` 內兩個共用同一條防禦時序、且目前資料可直接觸發的差異。

固定來源：

- `gavinlinasd/StoneAge`
- ref `1f90cb6cb57c1df70f39cde77a5a8ccd98b66c56`
- `gmsv/src/battle/battle_event.c`

### STONE ×2 只屬 BATTLE_DamageCalc 區域 defense

來源先建立：

```c
float defense;
defense = CHAR_getWorkInt(defindex, CHAR_WORKDEFENCEPOWER) * 0.70;
...
if(CHAR_getWorkInt(defindex, CHAR_WORKSTONE) > 0) defense *= 2.0;
```

這個 `defense *= 2` 沒有寫回 `CHAR_WORKDEFENCEPOWER`。

而會心額外傷害 `BATTLE_CriDamageCalc()` 在普通 DamageCalc 完成後重新讀：

```c
damage += CHAR_getWorkInt(defindex, CHAR_WORKDEFENCEPOWER)
    * attackerLevel / defenderLevel * 0.5;
```

所以石化目標：

- 普通物理的 DamageCalc 防禦會 ×2
- 會心額外段仍使用原 WORKDEFENCEPOWER
- 會心額外段不能再 ×2

V0.83 以前 web 把石化提前乘進 battle view 的 `defense`，因此 DamageCalc 本體雖得到雙防，critical bonus 也誤讀到雙倍 defense。

V0.84 改為：

- Player / Pet / Enemy battle view 的 `defense` 保持 WORKDEFENCEPOWER 語意
- 另外攜帶 `stone` flag
- `battleDamageCore()` 在 fixed C 的正確位置才做 `defense *= 2`
- `resolveNormalAttack()` 的 critical bonus 因而重新讀到未石化加倍的 WORKDEFENCEPOWER

固定例：

```text
WORKDEFENCEPOWER = 100
attacker level = defender level
STONE = active
```

會心額外段：

- fixed C：100 × 1 × 0.5 = 50
- 舊 web：200 × 1 × 0.5 = 100
- V0.84：50

### REGRET / 憾甲一擊是後置 FIXTOUGH 覆寫

原 `BATTLE_DamageCalc()` 的順序：

```text
WORKDEFENCEPOWER × 0.70
→ SuperWall
→ NPCENEMY_ADDPOWER
→ STONE ×2
→ REGRET / REGRET2: defense = WORKFIXTOUGH
→ 後續傷害公式
```

因此 REGRET 的 `defense = FIXTOUGH` 是覆寫，不是「一開始就改用 FIXTOUGH 再繼續套防禦修正」。

V0.83 以前 web 在進 DamageCalc 時直接：

```text
useFixedToughDefense ? FIXTOUGH : WORKDEFENCEPOWER ×0.70
```

接著仍會套 SuperWall / Enemy add-power，和 fixed C 時序不同。

V0.84 改為：

1. 一律先走正常 WORKDEFENCEPOWER ×0.70。
2. 照來源順序套 SuperWall / Enemy add-power / STONE。
3. 若為 REGRET，再以 FIXTOUGH 最後覆寫 defense。

因此 REGRET 會正確洗掉它之前的：

- SuperWall 防禦加成
- Enemy defender add-power
- 石化 ×2

### fixed data 可達性

正權重 Enemy AI：

- Skill 590「虎虎生威／石化 BattleModel」：1 個 Enemy
- Skill 655「虎虎生威／石化 BattleModel」：6 個 Enemy
- Skill 708「石化攻擊」：1 個 Enemy
- Skill 627「難得糊塗」：1 個 Enemy，候選 magic 159 可造成石化
- Skill 640「憾甲一擊」：43 個 Enemy，正權重總和 58
- Skill 666「T憾甲一擊」：10 個 Enemy，正權重總和 19

所以兩個修正都不是不可達的理論分支。

### V0.84 regression

已確認：

- `game.js` JavaScript syntax：PASS
- battle view 不再把 STONE ×2 寫進 `defense`
- Player / Pet / Enemy 都攜帶獨立 `stone` flag
- `battleDamageCore()` 順序為 SuperWall → NPC add-power → STONE → REGRET FIXTOUGH
- critical bonus 重新使用未石化加倍的 WORKDEFENCEPOWER
- REGRET 不再把 SuperWall / Enemy add-power / STONE 套到 FIXTOUGH
- V0.83 physical attribute int pipeline 保留
- V0.82 FIXDEX int combat math 保留
- V0.81 FIXDEX / WORKQUICK separation 保留
- V0.77 WEAKEN / BARRIER lifecycle 保留
- V0.76 DRUNK lifecycle bug 保留
- positive Enemy PetSkill coverage：158
- handled：134
- source missing：22
- source unregistered：2
- dispatcher gaps：0
- save schema：21


## V0.85 Modifyattack integer-division / base-attribute semantics

V0.85 校正正權重 `PETSKILL_Modifyattack`（544～546）的兩個 fixed C 細節。

固定來源：

- `gavinlinasd/StoneAge`
- ref `1f90cb6cb57c1df70f39cde77a5a8ccd98b66c56`
- `gmsv/src/battle/battle_event.c`
- `BATTLE_S_Modifyattack()`

### random attribute term 先做 C int division

來源：

```c
def = ((float)(atoi(buf2))/100);

if((ModNum = CHAR_getInt(defindex, KModKind[i].Kind)) > 0){
    def += (float)((rand()%(ModNum+5))/100);
    *damage += *damage * def;
}
```

關鍵是：

```c
(rand() % (ModNum+5)) / 100
```

左右兩邊都是 `int`，所以 **先做整數除法**，結果才 cast 成 float。

V0.84 以前 web 誤寫成：

```js
bonusRoll / 100
```

造成每個 roll 都可產生 0.01、0.02、0.03... 的連續倍率。

V0.85 改成：

```js
bonusStep = Math.trunc(bonusRoll / 100)
factor = optionPercent / 100 + bonusStep
```

因此：

- target attribute 1～95：`rand()%(ModNum+5)` 最大不超過 99，random term 永遠為 0。
- target attribute 96～100：只有 modulo 結果實際到 100 以上時，random term 才會跳成 1。
- 不再產生來源不存在的 0.01～0.99 平滑加成。

例如 Skill 544 `EA|20`、目標地屬性 50：

```text
fixed C:
rand()%55 = 0..54
0..54 / 100 (int) = 0
factor = 0.20

舊 web:
factor = 0.20 .. 0.74

V0.85:
factor = 0.20
```

### ModNum 讀 base CHAR attribute，不讀戰鬥 FIX attribute

同一函式使用：

```c
CHAR_getInt(defindex, CHAR_EARTHAT)
CHAR_getInt(defindex, CHAR_WATERAT)
CHAR_getInt(defindex, CHAR_FIREAT)
CHAR_getInt(defindex, CHAR_WINDAT)
```

它沒有讀：

```text
CHAR_WORKFIXEARTHAT
CHAR_WORKFIXWATERAT
CHAR_WORKFIXFIREAT
CHAR_WORKFIXWINDAT
```

這和前面的普通物理 `BATTLE_AttrAdjust()` 不同；普通物理本體會透過 `BATTLE_GetAttr()` 使用 WORKFIX 屬性。

因此 Attribute Reverse 的正確結果是：

1. 本次普通物理傷害：使用反轉後的 battle FIX 屬性。
2. `Modifyattack` 額外段的 `ModNum`：仍使用未反轉的 base CHAR 屬性。

V0.84 以前 web 的額外段使用 `battleElementsForDesc()`，會把反轉後 FIX 屬性錯當成 `ModNum`。

V0.85 改為額外段明確讀 `battleBaseElements()`。

### fixed data 可達性

目前正權重 Enemy AI：

- Skill 544「地屬性強化攻擊」`EA|20`：Enemy 2238，weight 3
- Skill 545「水屬性強化攻擊」`WA|20`：Enemy 2237，weight 3
- Skill 546「火屬性強化攻擊」`FI|20`：Enemy 2236，weight 3
- Skill 825「地屬性強化攻擊」`EA|9999`：4 個 Enemy，正權重總和 12
- Skill 826「水屬性強化攻擊」`WA|9999`：1 個 Enemy，weight 3
- Skill 827「火屬性強化攻擊」`FI|9999`：1 個 Enemy，weight 3
- Skill 828「風屬性強化攻擊」`WI|9999`：1 個 Enemy，weight 3

七條都是真正可達的 battle path；V0.85 的同一個 Modifyattack handler 已同時涵蓋 544～546 與 825～828。

### V0.85 regression

已確認：

- `game.js` JavaScript syntax：PASS
- Modifyattack random term 使用 `Math.trunc(bonusRoll/100)`
- 不再使用 `bonusRoll/100` 當連續小數倍率
- Modifyattack `ModNum` 使用 `battleBaseElements()`
- 普通物理 `battleAttrDamage()` 仍使用 battle FIX / reverse 後屬性
- Skill 544 / 545 / 546 正權重可達
- V0.84 STONE / REGRET DamageCalc ordering 保留
- V0.83 physical attribute integer pipeline 保留
- V0.82 FIXDEX integer combat math 保留
- V0.81 FIXDEX / WORKQUICK separation 保留
- V0.77 WEAKEN / BARRIER lifecycle 保留
- V0.76 DRUNK lifecycle bug 保留
- positive Enemy PetSkill coverage：158
- handled：134
- source missing：22
- source unregistered：2
- dispatcher gaps：0
- save schema：21


## V0.86 BatFly direct-HP drain does not wake SLEEP

V0.86 校正正權重 Skill 633「群蝠四竄」的直接 HP 吸取生命週期。

固定來源：

- `gavinlinasd/StoneAge`
- ref `1f90cb6cb57c1df70f39cde77a5a8ccd98b66c56`
- `gmsv/src/battle/battle_event.c`
- `BATTLE_BatFly()`
- `BATTLE_DamageWakeUp()`

### BatFly 不走 DamageSub / DamageWakeUp

原 `BATTLE_BatFly()` 對敵方整側逐一直接：

```c
charhp = CHAR_getInt(toindex, CHAR_HP);

if((charhp/10) == 0){
    CHAR_setInt(toindex, CHAR_HP, charhp - 1);
    charhp = 1;
}else{
    CHAR_setInt(toindex, CHAR_HP, charhp - (charhp/10));
    charhp /= 10;
}
```

未騎乘時：

- 目前 HP >= 10：扣 `floor(currentHP/10)`
- 目前 HP 1～9：固定扣 1
- 吸取量累加到 `addhp`
- 最後回復施術者，且不超過 MAXHP

整個 `BATTLE_BatFly()` 沒有呼叫：

```c
BATTLE_AttackSeq
BATTLE_DamageSub
BATTLE_DamageWakeUp
```

而 fixed `BATTLE_DamageWakeUp()` 的可見戰鬥效果是：

```c
if(CHAR_getWorkInt(defindex, CHAR_WORKSLEEP) > 0){
    CHAR_setWorkInt(defindex, CHAR_WORKSLEEP, 0);
}
```

所以「失去 HP」本身不代表一定會被喚醒；只有實際經過來源 wake 路徑才會解除 SLEEP。

### V0.85 以前 web 的偏差

原 web BatFly 在直接扣 HP 後額外做：

```js
battleStatusWakeOnDamage(target, damage)
```

因此睡眠中的 Player / Active Pet 只要被 BatFly 吸到 HP，就會被提前喚醒。

這不是 fixed C 行為。

V0.86 移除這個 wake 呼叫。

現在：

- BatFly 仍照目前 HP 的 10% / 最低 1 直接吸取
- BatFly 仍回復施術者 HP
- BatFly 不做 Duck / Critical / Guard / Counter
- **BatFly 不解除 SLEEP**
- 一般物理、Combo、BattleModel 等真正呼叫 wake 的路徑不受影響
- DivideAttack 原本就沒有錯誤 wake，維持不變

### fixed data 可達性

Skill 633「群蝠四竄」有 5 個正權重 Enemy：

- Enemy 2510：weight 4
- Enemy 5122：weight 1
- Enemy 6054：weight 2
- Enemy 6056：weight 2
- Enemy 14031：weight 3

正權重總和：12。

因此這是目前遊戲能實際遇到的狀態生命週期差異。

### V0.86 regression

已確認：

- `game.js` JavaScript syntax：PASS
- BatFly handler 不再呼叫 `battleStatusWakeOnDamage()`
- 通用 `battleStatusWakeOnDamage()` 仍保留，且只解除 SLEEP
- DivideAttack 維持 direct-HP / no-wake
- Skill 633 正權重可達：5 Enemy / weight 12
- V0.85 Modifyattack integer-division bug 保留
- V0.85 reachability 文件補齊 Skill 825～828
- V0.84 STONE / REGRET ordering 保留
- V0.83 physical attribute integer pipeline 保留
- V0.82 FIXDEX integer combat math 保留
- V0.77 WEAKEN / BARRIER lifecycle 保留
- V0.76 DRUNK lifecycle bug 保留
- positive Enemy PetSkill coverage：158
- handled：134
- source missing：22
- source unregistered：2
- dispatcher gaps：0
- save schema：21


## V0.87 DamageToHp2 critical 30% int truncation

V0.87 校正正權重 Skill 659「T浴血狂襲」的會心率強化邊界。

固定來源：`gavinlinasd/StoneAge@1f90cb6cb57c1df70f39cde77a5a8ccd98b66c56`，
`gmsv/src/battle/battle_event.c` 的 `BATTLE_AttackSeq()`。

來源先取得整數會心門檻，再做：

```c
perCri = perCri + (perCri*0.3);
if( RAND(1,10000) < perCri )
```

`perCri` 是 `int`，所以 +30% 指派回去時會立刻截斷。

例如 base `101`：

- fixed C：`101 + 30.3 -> 131`，判定 `RAND < 131`
- V0.86 web：`131.3`，判定 `RAND < 131.3`

因此 RAND=131 在舊 web 會多出一次來源不存在的成功邊界。

V0.87 改成：

```js
const criticalRaw=Math.trunc(baseCriticalRaw*criticalChanceMultiplier);
```

仍保留來源「先 cap 10000、後 ×1.3」的順序，不重新 cap。

### fixed data 可達性

- Skill 659「T浴血狂襲」
- option `100`
- Enemy 5546
- positive weight 1

### V0.87 regression

- `game.js` syntax：PASS
- DamageToHp2 +30% critical 後立即 int truncation
- critical RAND 維持嚴格 `<`
- 不重新 cap 10000
- V0.86 BatFly no-wake 保留
- V0.85 Modifyattack semantics 保留
- V0.84 STONE / REGRET ordering 保留
- positive Enemy PetSkill coverage：158
- handled：134
- source missing：22
- source unregistered：2
- dispatcher gaps：0
- save schema：21

## V0.88 SpeedyAttack negative defense int truncation

V0.88 校正正權重 Skill 542「疾速攻擊」在 `PETSKILL_SpeedyAttack()` 的防禦修正整數截斷順序。

固定來源：

- `gavinlinasd/StoneAge@1f90cb6cb57c1df70f39cde77a5a8ccd98b66c56`
- `gmsv/src/battle/pet_skill.c`
- `PETSKILL_SpeedyAttack()`

來源對 `防%` 的有效處理是：

```c
fPer = (fPer / 100);
strdef = CHAR_getWorkInt(charaindex, CHAR_WORKFIXTOUGH);
strdef = (int)(strdef * fPer);
CHAR_setWorkInt(
    charaindex,
    CHAR_WORKDEFENCEPOWER,
    CHAR_getWorkInt(charaindex, CHAR_WORKFIXTOUGH) + strdef
);
```

Skill 542 的 option 是：

```text
防%-30 敏%+30
```

這個來源函式只解析 `防%`；`敏%+30` 不會直接改寫 QUICK。疾速攻擊的 +30% 出手效果仍只來自 `BATTLE_DexCalc()` 的 command 專用排序公式。

### V0.87 以前的差異

原 C 的 `strdef` 是 `int`，因此負百分比會先對 delta 做向 0 截斷，再加回 FIXTOUGH。

例如 FIXTOUGH = 101：

- fixed C：`(int)(101 * -0.30) = -30`，最後防禦 = `101 - 30 = 71`
- V0.87 web：`Math.trunc(101 + 101 * -0.30) = Math.trunc(70.7) = 70`

兩者會在部分非整除防禦值產生 1 點實戰差異。

V0.88 改成：

```js
const baseDefense = sourceFixDefense;
unit.roundDefense =
  baseDefense + Math.trunc(baseDefense * defensePct / 100);
```

也就是忠實保留「先截斷 delta，再相加」的 C 指派順序。

### fixed data 可達性

`data/generated/stoneage_enemy_ai.json` 已確認：

- Skill 542「疾速攻擊」
- Enemy 2537
- positive weight 1

因此這不是註解區塊或死路徑，而是真正可在目前 Enemy AI 戰鬥中抽到的差異。

另外重新確認：

- `PETSKILL_ToothCrushe` 裡的 `atoi(...)/100` 攻防敏 parser 位於 `/* ... */` 註解內，不執行。
- `PETSKILL_Modifyattack` AI 階段同型 `atoi(...)/100` parser 也位於註解內；V0.85 修正的是實際可達的 `BATTLE_S_Modifyattack()` 傷害階段整數除法 bug，而不是這段註解碼。

### V0.88 regression

- `game.js` JavaScript syntax：PASS
- SpeedyAttack 防禦修正：`base + trunc(base * pct / 100)`
- FIXTOUGH 101、-30%：fixed / web 都得到 71
- SpeedyAttack QUICK 仍不直接增加
- `roundDexMode='speedy'` 保留，`BATTLE_DexCalc()` 專用 +30% 排序保留
- V0.87 DamageToHp2 critical int truncation 保留
- V0.86 BatFly no-wake lifecycle 保留
- V0.85 Modifyattack integer-division / base attribute semantics 保留
- positive Enemy PetSkill coverage：158
- handled：134
- source missing：22
- source unregistered：2
- dispatcher gaps：0
- save schema：21

## V0.89 CounterCalc int return truncation

V0.89 校正所有普通反擊共用的 `BATTLE_CounterCalc()` 回傳型別語意。

固定來源：

- `gavinlinasd/StoneAge@1f90cb6cb57c1df70f39cde77a5a8ccd98b66c56`
- `gmsv/src/battle/battle_event.c`
- `BATTLE_CounterCalc()`
- `BATTLE_CounterCheckPlayer()`
- `BATTLE_CounterCheckPet()`

來源函式宣告是：

```c
int BATTLE_CounterCalc( int attackindex, int defindex )
```

函式內雖然：

```c
float per;
...
per = (float)( (double)sqrt( Work ) );
per *= wari;
return per;
```

但回傳型別是 `int`，所以 `return per` 會先把 float 向 0 截斷。

之後：

```c
CriPer = BATTLE_CounterCalc( attackindex, defindex );
```

或：

```c
per = BATTLE_CounterCalc( attackindex, defindex );
```

拿到的都已經是被截斷過的整數基礎反擊率。

### V0.88 以前的差異

web 已在 V0.82 正確處理：

- FIXDEX 的 0.8 / 0.6 int compound assignment
- `Work = (Big-Small)/divpara` 指派到 int 的截斷

但漏掉了**函式本身回傳 int 的最後一層截斷**。

例如 Pet 攻擊 Enemy：

```text
attacker FIXDEX = 101
defender FIXDEX = 99
```

來源先做：

```text
Df_Dex = int(99 × 0.8) = 79
Work = int((101 - 79) / 0.08) = 275
sqrt(275) = 16.583...
BATTLE_CounterCalc return int => 16
```

所以 Pet/Enemy 的後續反擊判定使用 16%，不是 16.583...%。

V0.88 web 則把 16.583... 直接保留到 `RAND(1,10000)` 門檻，會多出來源不存在的反擊機率。

V0.89 改成：

```js
let per=(root?Math.sqrt(work):work)*wari;
per=Math.trunc(per);
```

而且截斷位置是在：

- Player 的 CounterTbl / Luck 加成**之前**
- Pet / Enemy 的 NoGuard counter bonus **之前**

與原函式邊界一致。

### 可達性

這不是單一 PetSkill 的特殊路徑。

`BATTLE_CounterCalc()` 是：

- 玩家普通反擊
- 寵物普通反擊
- Enemy 普通反擊

共用的基礎計算，因此只要武器／command 沒有禁止反擊、且 CounterCheck 成功條件可成立，就能實際走到這條路徑。

### V0.89 regression

- `game.js` JavaScript syntax：PASS
- Counter `Work` int truncation 保留
- `BATTLE_CounterCalc()` float `per` 在函式邊界新增 int truncation
- Pet vs Enemy：FIXDEX 101 / 99 → base counter 16，不再是 16.583...
- Player CounterTbl / Luck 在 base int return 後才套用
- Pet / Enemy counter bonus 在 base int return 後才套用
- V0.88 SpeedyAttack defense int truncation 保留
- V0.87 DamageToHp2 critical int truncation 保留
- V0.86 BatFly no-wake lifecycle 保留
- V0.85 Modifyattack semantics 保留
- positive Enemy PetSkill coverage：158
- handled：134
- source missing：22
- source unregistered：2
- dispatcher gaps：0
- save schema：21

## V0.90 StatusAttackCheck integer chance semantics

V0.90 校正共用異常狀態命中函式 `BATTLE_StatusAttackCheck()` 的 C 整數指派語意。

固定來源：

- `gavinlinasd/StoneAge@1f90cb6cb57c1df70f39cde77a5a8ccd98b66c56`
- `gmsv/src/battle/battle_event.c`
- `BATTLE_StatusAttackCheck()`

來源宣告：

```c
int Df_Reg = 0, level = 0, per = 0, i;
float templP = 0.0;
float fVitalP = 0.0;
```

非麻痺的共用命中率會先算：

```c
templP = (float)VITAL / (VITAL + STR + TOUGH + DEX);
fVitalP = templP / 0.25;
fVitalP *= 10.0;
```

接著：

```c
level = attackLv - defendLv;
level *= Bai;

per = PerOffset + level + FIXLUCK
    - Df_Reg - fVitalP;

if( per > 80 ) per = 80;

if( RAND(1,100) < per )
    return TRUE;
```

### 兩個 C int 邊界

`level` 是 `int`，所以 `level *= Bai` 若產生小數，會在 compound assignment 時先向 0 截斷。

更重要的是 `per` 也是 `int`。最後一條公式包含 `float fVitalP`，但整個結果在指派給 `per` 時會立刻向 0 截斷。

V0.89 以前 web 會把這個小數一路保留到：

```js
cRand(1,100) < per
```

因此可能多出原 C 不存在的一個 RAND 成功邊界。

### 可觀察差異

固定例：

```text
PerOffset = 30
level = 0
luck = 0
resist = 0

VITAL / total stats = 0.33
fVitalP = 0.33 / 0.25 * 10 = 13.2
```

則：

```text
fixed C:
per = int(30 - 13.2) = 16
RAND(1,100) < 16
成功 roll = 1..15

V0.89 web:
per = 16.8
RAND(1,100) < 16.8
成功 roll = 1..16
```

所以 roll=16 在舊 web 會成功，但 fixed C 會失敗。

V0.90 改成：

```js
let level=Math.trunc((attackLevel-defendLevel)*bai);
...
let per=Math.trunc(perOffset+level+luck-resist-vitalPenalty);
if(per>80)per=80;
```

並保留來源的嚴格 `RAND(1,100) < per`。

### fixed data 可達性

這是共用狀態命中公式，不只一個技能會走到。

目前正權重 Enemy AI 已確認：

| Skill | 類型 | distinct Enemy | 正權重總和 |
|---|---|---:|---:|
| 575 | 虛弱 | 6 | 9 |
| 576 | 全體虛弱 | 1 | 3 |
| 577 | 劇毒 | 1 | 3 |
| 578 | 全體劇毒 | 2 | 6 |
| 580 | 沉默 | 21 | 47 |
| 590 | BattleModel 狀態 | 1 | 4 |
| 655 | BattleModel 狀態 | 6 | 6 |
| 707 | 劇毒攻擊 | 2 | 13 |
| 708 | 石化攻擊 | 1 | 1 |

另外 Combined 狀態精靈與已接入的 AttackMagic 狀態路徑也共用同一個 web helper，因此一併取得正確的 int 門檻。

麻痺的來源特殊分支：

```c
per = 20 - RegTbl[PARALYSIS];
```

本來就是純整數，V0.90 不改它的機率語意。

### V0.90 regression

- `game.js` JavaScript syntax：PASS
- `level *= Bai` 對齊 int compound-assignment truncation
- 最終 `per = ... - fVitalP` 對齊 int assignment truncation
- `per > 80` cap 維持在截斷之後
- RAND 判定仍維持嚴格 `<`
- 例：`30 - 13.2` → fixed/web 都得到 16
- 麻痺特殊 `20 - resist` 分支不受影響
- V0.89 CounterCalc int return truncation 保留
- V0.88 SpeedyAttack defense int truncation 保留
- V0.87 DamageToHp2 critical int truncation 保留
- V0.86 BatFly no-wake lifecycle 保留
- V0.85 Modifyattack semantics 保留
- positive Enemy PetSkill coverage：158
- handled：134
- source missing：22
- source unregistered：2
- dispatcher gaps：0
- save schema：21

## V0.91 CaptureCheck float pipeline / sleep bonus

V0.91 校正核心捕獲公式 `BATTLE_CaptureCheck()` 的型別語意。

固定來源：

- `gavinlinasd/StoneAge@1f90cb6cb57c1df70f39cde77a5a8ccd98b66c56`
- `gmsv/src/battle/battle_event.c`
- `BATTLE_CaptureCheck()`

來源一開始明確宣告：

```c
float
    Df_MaxHp = 0,
    Df_HpPer = 0,
    At_Charm = 0,
    At_Level = 0,
    At_Dex = 0,
    At_Luck = 0,
    Df_Level = 0,
    Df_Dex = 0,
    Df_Ge = 30;
float WorkGet;
```

雖然這些值大多由 `CHAR_getInt()`／`CHAR_getWorkInt()` 讀入，
**後續運算是在 float 變數上進行**，不是 C 整數除法。

來源公式：

```c
Df_HpPer = 10 - ( Df_HpPer * Df_HpPer ) / Df_MaxHp;
Df_Level = ( At_Level/2 - Df_Level/2 );
Df_Dex = At_Dex / 15 - Df_Dex / 15;

WorkGet =
    ( Df_HpPer + Df_Level + Df_Dex + ( Df_Ge + At_Luck ) )
    * At_Charm / 50;

WorkGet += CHAR_getWorkInt( attackindex, CHAR_WORKMODCAPTURE );

if( CHAR_getWorkInt( defindex, CHAR_WORKSLEEP ) > 0 ){
    WorkGet += 15;
}

if( WorkGet > 99 ) WorkGet = 99;
```

### V0.90 以前的差異

舊 web 誤把捕獲公式當成「全部中間值都是 int」，因此逐段做：

```js
trunc(HP*HP/MAXHP)
trunc(level/2)
trunc(dex/15)
trunc(workSum*charm/50)
```

這不是 fixed C。

V0.91 改成：

```js
const hpTerm=10-(hp*hp)/maxHp;
const levelTerm=playerLevel/2-targetLevel/2;
const dexTerm=playerDex/15-enemyDex/15;
const workSum=hpTerm+levelTerm+dexTerm+(captureBase+luck);
let raw=workSum*charm/50;
```

也就是來源值先按 int 讀入，但公式本身保留 float 小數直到最後 RAND 判定。

### 可觀察差異

固定例：

```text
Player Lv = 10
Enemy Lv  = 10
Player FIXDEX = 30
Enemy FIXDEX  = 20
Enemy HP/MAXHP = 9/100
captureBase = 30
Luck = 0
Charm = 100
```

fixed C：

```text
HP term    = 10 - 81/100 = 9.19
Level term = 10/2 - 10/2 = 0
Dex term   = 30/15 - 20/15 = 0.666666...
WorkGet    = (9.19 + 0 + 0.666666... + 30) * 100/50
           = 79.713333...
```

V0.90 web 則因逐段截斷得到：

```text
HP term = 10
Dex term = 1
WorkGet = 82
```

差異不是單純顯示小數，而是直接改變 `RAND(1,100) < WorkGet` 的成功邊界。

### 睡眠 +15

來源還有：

```c
if( CHAR_getWorkInt( defindex, CHAR_WORKSLEEP ) > 0 ){
    WorkGet += 15;
}
```

V0.90 web 完全漏掉這一段。

V0.91 已接回：

```js
const sleepBonus=battleStatusActive(targetDesc,'sleep')?15:0;
raw += sleepBonus;
```

目前玩家側尚未建立完整主動睡眠 PetSkill 指令，因此這個 +15 在現行玩家操作中不是主要可達來源；
但保留它可以避免未來接玩家寵技後捕獲公式再次偏離 fixed C。

### WORKMODCAPTURE

來源另有：

```c
WorkGet += CHAR_getWorkInt( attackindex, CHAR_WORKMODCAPTURE );
```

現行 web 尚未建立可驗證的 `CHAR_WORKMODCAPTURE` 來源，所以 V0.91 明確維持等價預設 0，
不自行新增捕獲加成數值。

### V0.91 regression

- `game.js` JavaScript syntax：PASS
- 捕獲 HP² / MAXHP 使用 float division
- Player / Enemy level /2 使用 float division
- FIXDEX /15 使用 float division
- WorkGet × Charm /50 保留 float
- 不再對最終 WorkGet 做 `Math.trunc`
- WorkGet 上限仍為 99
- 捕獲判定仍維持嚴格 `RAND(1,100) < WorkGet`
- 睡眠目標 +15 已補回
- WORKMODCAPTURE 在缺可驗證來源時保持 0
- 固定例：舊 web 82；fixed/V0.91 約 79.713333
- V0.90 StatusAttackCheck int semantics 保留
- V0.89 CounterCalc int return truncation 保留
- V0.88 SpeedyAttack defense int truncation 保留
- V0.87 DamageToHp2 critical int truncation 保留
- V0.86 BatFly no-wake lifecycle 保留
- V0.85 Modifyattack semantics 保留
- positive Enemy PetSkill coverage：158
- handled：134
- source missing：22
- source unregistered：2
- dispatcher gaps：0
- save schema：21
## V0.92 CAPTURE_FREES deletes all matching requirement items

V0.92 還原固定來源 `_CAPTURE_FREES` 的條件捕獲道具消耗語意。

固定來源：

- `gavinlinasd/StoneAge@1f90cb6cb57c1df70f39cde77a5a8ccd98b66c56`
- `gmsv/src/include/version.h`
- `gmsv/src/battle/battle_event.c`
- `BATTLE_CaptureItemCheck()`
- `BATTLE_CaptureItemDelAll()`

固定 build 的 `version.h` 明確開啟：

```c
#define _CAPTURE_FREES
#define _WOLF_TAKE_AXE
```

### 檢查只要求「至少有一個」

捕獲前的 `BATTLE_CaptureItemCheck()` 對每個必要 ItemId 掃背包；找到一個匹配就 `break`。
因此每種必要道具只要至少存在一個就能通過捕獲前置。

### 成功後卻把同 ID 全部刪掉

成功捕獲後 `BATTLE_CaptureItemDelAll()` 會對每個必要 ItemId 再掃完整個背包。
命中後會 `CHAR_DelItem()`，但原本可以停止掃描的 `break` 被註解掉，旁邊還保留「最後還是決定全刪」的來源註解。

所以來源實際語意是：

- 捕獲前：每種必要道具有 **1 個以上**即可。
- 捕獲失敗：不刪。
- 捕獲成功：每一種必要 ItemId 在背包中的**全部副本都刪除**。

V0.92 不自行把這個來源行為修成比較合理的「只吃一個」。

### V0.91 以前的差異

舊 web 成功捕獲後只做：

```js
for(const item of c.requirements||[]) consumeItem(item.id,1);
```

因此即使背包有 5 個必要道具，也只會消耗 1 個。

V0.92 改成先讀取該 ItemId 的目前總數，再全部交給既有 `consumeItem()`；tracked existing-index 的釋放流程仍由 `consumeItem()` 負責。

### fixed data 可達性

目前 web 的 capture condition 資料已包含實際條件道具，例如：

- 夏普德：1690 海藍之棒、1691 海藍之兜、1692 海藍之鎧
- 嘎吱拉：20247 魔法鑽戒[地LV3-1]
- 斑尼迪克：20259 會員捕寵結晶石

所以只要玩家持有同一必要道具兩份以上並成功捕獲，就能觀察 V0.91 與 fixed C 的差異。

### V0.92 regression

- `game.js` JavaScript syntax：PASS
- capture requirement pre-check 仍只要求每種至少 1 個
- 捕獲失敗不消耗條件道具
- 捕獲成功改為刪除每種必要 ItemId 的全部現有數量
- tracked ITEM existing-index 仍透過 `consumeItem()` 正常釋放
- 多種必要道具會各自全刪
- V0.91 CaptureCheck float pipeline / sleep +15 保留
- V0.90 StatusAttackCheck int semantics 保留
- V0.89 CounterCalc int return truncation 保留
- V0.88 SpeedyAttack defense int truncation 保留
- V0.87 DamageToHp2 critical int truncation 保留
- V0.86 BatFly no-wake lifecycle 保留
- V0.85 Modifyattack semantics 保留
- positive Enemy PetSkill coverage：158
- handled：134
- source missing：22
- source unregistered：2
- dispatcher gaps：0
- save schema：21
## V0.93 BATTLE_SurpriseCheck first-round initiative / ambush

V0.93 接回固定來源 `BATTLE_SurpriseCheck()` 的首回合先制／偷襲流程。

固定來源：

- `gavinlinasd/StoneAge@1f90cb6cb57c1df70f39cde77a5a8ccd98b66c56`
- `gmsv/src/battle/battle_event.c`：`BATTLE_SurpriseCheck()`
- `gmsv/src/battle/battle.c`：`BATTLE_Init()` / `BATTLE_Command()`
- `gmsv/src/battle/battle_ai.c`：`BATTLE_ai_all()`
- `gmsv/src/battle/battle_command.c`：Surprise side menu flags

### fixed C 判定

`BATTLE_Init()` 每場只呼叫一次 `BATTLE_SurpriseCheck()`。若 Battle 有 `WinFunc`，來源直接不做 Surprise。

一般 PVE 以 Side 0 的第一位角色 FIXLUCK 決定 a / b：

| Luck | a | b | 敵方首輪不能動 | 玩家首輪不能動 |
|---:|---:|---:|---:|---:|
| 5 | 20 | 0 | 20% | 0% |
| 4 | 15 | 2 | 15% | 1% |
| 3 | 10 | 3 | 10% | 2% |
| 2 | 5 | 5 | 5% | 4% |
| 其他 | 0 | 7 | 0% | 6% |

來源不是直覺的兩段 `<=`：

```c
Rnd = RAND(1,100);
if( Rnd <= a ) iRet = 1;
else if( Rnd < a + b ) iRet = 2;
```

所以第二段會少一個邊界。例如 Luck 4 時：

- roll 1..15：敵方被先制
- roll 16：玩家遭偷襲
- roll 17..100：正常

不是 15% + 2%。

### 首輪行為

`iRet == 1` 時固定來源把 Side 1（Enemy）設成 `BSIDE_FLG_SURPRISE`。
`BATTLE_ai_all()` 看到 Enemy side Surprise 後直接寫 `COM_NONE + C_OK`，**不呼叫 `BATTLE_ai_normal()`**。
因此不能先抽 Enemy skill 再把行動丟掉；整個 Enemy AI 選招階段都不應發生。

`iRet == 2` 時 Side 0（Player）被標 Surprise，客戶端把 Player / Pet 操作關閉；首輪等價普通命令為 NONE。

兩側 Surprise flag 都在第一次 `BATTLE_Battling()` 後清掉，只影響首輪。

### StatusSeq 仍會跑

被 Surprise 的 actor 不是 C_WAIT 死路徑，而是正常進戰鬥處理但 command 為 NONE。
因此 V0.93 仍先跑 `processBattleStatusTurn()`，之後才跳過普通 command。

這也保留一個來源細節：若混亂 StatusSeq 在該時點把 COM 改成 ATTACK，混亂攻擊仍可覆蓋原本的 NONE；所以 Surprise skip 放在 confusionAttack 處理之後。

### Web 接法

- 一般非 questZone encounter：開戰時擲一次 Surprise。
- questZone：目前視為腳本／任務戰邊界；來源 `WinFunc != NULL` 會禁用 Surprise，而 web 沒有足夠資料把每一場腳本戰逐一證明為 WinFunc=NULL，因此不猜。
- 敵方被先制：首輪不呼叫 `enemyChooseAction()` / `enemyPrepareRoundAction()`。
- 玩家遭偷襲：開戰後直接自動結算 Enemy 首輪，玩家不用按一個假的「攻擊」按鈕才能讓偷襲發生。
- ComboCheck 把 Surprise actor 視為非普通攻擊，避免被錯誤拉進合擊。

### V0.93 regression

- `game.js` JavaScript syntax：PASS
- Surprise 每場一般 encounter 只擲一次
- Luck 4：Enemy surprise 15%、Player surprise 1% 邊界保留
- Luck 3：10% / 2%
- Luck 2：5% / 4%
- Luck 0/1/default：0% / 6%
- Enemy surprise 首輪不呼叫 Enemy AI
- Player surprise 首輪 Player / Active Pet normal command = NONE
- Surprise actor 仍先跑 StatusSeq
- confusionAttack 可在 Surprise 首輪覆蓋 NONE
- 首輪後 one-shot Surprise 狀態清除
- questZone 不猜 Surprise
- V0.92 CAPTURE_FREES 全刪條件道具保留
- V0.91 CaptureCheck float pipeline / sleep +15 保留
- V0.90 StatusAttackCheck int semantics 保留
- V0.89 CounterCalc int return truncation 保留
- V0.88 SpeedyAttack defense int truncation 保留
- V0.87 DamageToHp2 critical int truncation 保留
- V0.86 BatFly no-wake lifecycle 保留
- V0.85 Modifyattack semantics 保留
- positive Enemy PetSkill coverage：158
- handled：134
- source missing：22
- source unregistered：2
- dispatcher gaps：0
- save schema：21
## V0.94 Enemy EscapeCheck integer average / dead-entry semantics

V0.94 校正 Enemy 逃跑共用公式 `BATTLE_EscapeCheck()` 的對手平均等級來源語意。

固定來源：

- `gavinlinasd/StoneAge@1f90cb6cb57c1df70f39cde77a5a8ccd98b66c56`
- `gmsv/src/battle/battle_event.c`：`BATTLE_EscapeCheck()` / `BATTLE_Escape()`
- `gmsv/src/battle/battle.c`：Battle Entry / death cleanup

### 平均等級是 C int division

來源宣告：

```c
int mylevel, enemylevel = 0, enemycnt = 0;
```

掃完整個對手 Side 後：

```c
enemylevel += CHAR_getInt(enemyindex, CHAR_LV);
enemycnt++;
...
enemylevel /= enemycnt;
```

所以 `enemylevel / enemycnt` 是整數除法。

例如 Player Lv10 + Pet Lv11：

- fixed C：`(10 + 11) / 2 = 10`
- V0.93 web：`21 / 2 = 10.5`

以 rare=0 的 Enemy、第一次逃跑（來源實際 `escape_cnt=2`）、Enemy Lv10 為例：

- fixed C：`Esc = 30*2 - 2*(10-10) = 60`
- 舊 web：`Esc = 60 - 2*(10.5-10) = 59`

而來源判定是嚴格 `RAND(1,100) < Esc`，所以 roll=59 會產生實戰差異。

### HP=0 不等於已離開 Battle Entry

`BATTLE_EscapeCheck()` 掃對手 Entry 時只做：

```c
enemyindex = pEntry[i].charaindex;
if( CHAR_CHECKINDEX(enemyindex) == FALSE ) continue;
```

沒有檢查 HP 或 `CHAR_ISDIE`。

因此 Active Pet 在戰鬥中倒下後，只要 Entry 尚未經 `BATTLE_Exit()` 移除，其等級仍算在 enemycnt。
`BATTLE_Command()` 的一般 death cleanup 也不是把 pet side slot 立即全部移除；Pet 的 Battle Entry 可在倒下後繼續存在。

V0.93 web 原本用：

```js
if(pet&&petIsBattleActive(pet)) levels.push(pet.level);
```

`petIsBattleActive()` 會在 HP=0 時直接 false，等於把死寵比 fixed C 更早排除。

V0.94 在開戰時保存 Player side Entry snapshot；之後：

- HP=0：仍保留在 Escape 平均。
- `BattleTimid` / `2BattleTimid` / `Abduct` 等真正等價 `BATTLE_Exit` 的寵：`battlePetOutIds` 會把該 Entry 排除。

### 可達性

fixed Enemy AI 已確認：

- `escapeWeight > 0` 的 Enemy：596 個
- escape 正權重總和：843

因此這是大量一般 Enemy 都能實際走到的共用公式，不是單一特殊技能。

### V0.94 regression

- `game.js` JavaScript syntax：PASS
- Player Lv10 + Pet Lv11 → opponent average = 10，不是 10.5
- rare0 / first escape / Enemy Lv10 → Esc 60，不是 59
- battle 中 HP=0 的 Active Pet Entry 仍計入平均
- `battlePetOutIds` 的真正退出寵不計入平均
- 第一次 `BATTLE_Escape()` 的 `escape++` + `EscapeCheck escape+1` 語意維持，仍從 multiplier 2 開始
- Enemy rare 0/1/other → luck 1/3/5 映射保留
- RAND 判定維持嚴格 `< Esc`
- V0.93 SurpriseCheck 首回合流程保留
- V0.92 CAPTURE_FREES 全刪條件道具保留
- V0.91 CaptureCheck float pipeline / sleep +15 保留
- V0.90 StatusAttackCheck int semantics 保留
- V0.89 CounterCalc int return truncation 保留
- V0.88 SpeedyAttack defense int truncation 保留
- V0.87 DamageToHp2 critical int truncation 保留
- V0.86 BatFly no-wake lifecycle 保留
- V0.85 Modifyattack semantics 保留
- positive Enemy PetSkill coverage：158
- handled：134
- source missing：22
- source unregistered：2
- dispatcher gaps：0
- save schema：21



## V0.95 EntrySort / ComboCheck dead Battle Entry semantics

V0.95 繼續掃固定來源的共用戰鬥核心與 `BATTLE_DexCalc()`，修正「死亡角色太早從排序陣列消失」造成的合擊差異。

固定來源：

- `gavinlinasd/StoneAge@1f90cb6cb57c1df70f39cde77a5a8ccd98b66c56`
- `gmsv/src/battle/battle.c`：`BATTLE_PreCommandSeq()` / `BATTLE_DexCalc()` / `EntrySort()` / `ComboCheck()` / `BATTLE_Command()`
- `gmsv/src/include/util.h`：`RAND(x,y)`

### HP=0 不會在 EntrySort 前自動移除

fixed `BATTLE_Command()` 建立 EntryList 時只排除真正已經沒有 Battle Entry 的 slot：

```c
if( pEntry[j][i].charaindex == -1 ) continue;
EntryList[entrynum].charaindex = pEntry[j][i].charaindex;
EntryList[entrynum].dex = BATTLE_DexCalc(pEntry[j][i].charaindex);
entrynum++;
```

這裡沒有 HP / ISDIE 篩選。

一般死亡處理會把 HP=0 的角色標成 `CHAR_ISDIE`，但不等價於立刻 `BATTLE_Exit()` 把 Entry 設成 -1。
下一輪 `BATTLE_PreCommandSeq()` 也仍會走該 Entry 的 complianceParameter。

所以原 C 的順序是：

1. 死亡但未 Exit 的 Entry 仍做 `BATTLE_DexCalc()`。
2. 一起進 `EntrySort()`。
3. 一起進 `ComboCheck()`。
4. 到真正 action loop 才因 `CHAR_ISDIE` / `HP <= 0` continue。

### 死亡 Entry 會中斷 ComboCheck

`ComboCheck()` 對每個已排序 Entry 都會先判斷：

```c
if( CHAR_getInt(charaindex, CHAR_HP) <= 0
 || BATTLE_CanMoveCheck(charaindex) == FALSE ){
    move = 0;
}
```

若前面已經有一個候選普通攻擊者，下一個 Entry 的 `move == 0` 會讓：

```c
start = -1;
```

也就是說，倒下角色即使自己不出手，仍可能位在兩個活角色中間，阻斷原本正在形成的合擊鏈。

V0.94 web 在排序前就用 `livingEnemyUnits()` / `petIsBattleActive()` 移除 HP=0 角色，
會把兩側原本不相鄰的活角色直接接在一起，產生來源不存在的合擊機會。

V0.95 改為：

- Enemy：只要還存在於本場 `enemy.units` Entry 集合，即使 HP=0 仍建立排序 actor。
- Active Pet：沿用 V0.94 的 `sourcePlayerSideEntries` snapshot；HP=0 仍保留，只有真正等價 `BATTLE_Exit` 的 `battlePetOutIds` 才排除。
- 死亡 Entry 使用 default `BATTLE_DexCalc` 路徑參與排序。
- `sourceComboCheck()` 會把死亡 Entry 視為不可移動，正確中斷 combo。
- attack / guard / capture 的真正 action loop 在 StatusSeq 前跳過 `sourceDeadEntry`，對齊 fixed C「排序後才檢查死亡」的時點。

### BATTLE_DexCalc 同輪審核結果

本輪也重新核對了幾個容易誤修的點，**沒有為了改版而硬改**：

- fixed `RAND(x,y)` 巨集允許 `y` 是小數運算式；`RAND(0, work*0.3)` 不是先把 `work*0.3` 截成 int。現行 `cRand()` 這點是正確的。
- `PETSKILL_SpeedyAttack` 的 `work + work*0.3` 與 `DamageToHp2` 的 `work + work*0.2` 已正確在最後回傳 int 時截斷。
- `enemyPrepareRoundAction()` 每輪都先把 `roundDexMode=null`，所以疾速／浴血的排序模式不會洩漏到下一輪。
- `_EQUIT_SEQUENCE` 在 fixed build 雖然開啟，但目前 web 尚沒有可證明的非 0 runtime sequence 資料；維持 0，不猜裝備順序值。
- 同 dex 時 fixed 使用 C `qsort`，其相等元素順序沒有可攜式保證；V0.95 不虛構一個「原版固定 tie-break」。

### V0.95 regression

- `game.js` JavaScript syntax：PASS
- dead Enemy Entry 仍進 `BATTLE_DexCalc` / sort / ComboCheck
- dead Active Pet Entry 仍進 sort / ComboCheck
- 真正 `BATTLE_Exit` 的 Pet 仍排除
- dead Entry 在 source ComboCheck 中 `move=false`
- attack / guard / capture 都在 StatusSeq 前跳過 dead Entry
- SpeedyAttack / DamageToHp2 Dex 模式不跨回合殘留
- RAND fractional upper-bound 語意維持，不做錯誤的預先 int 截斷
- V0.94 Enemy EscapeCheck dead-entry average 保留
- V0.93 SurpriseCheck 首回合流程保留
- V0.92 CAPTURE_FREES 全刪條件道具保留
- V0.91 CaptureCheck float pipeline / sleep +15 保留
- V0.90 StatusAttackCheck int semantics 保留
- V0.89 CounterCalc int return truncation 保留
- V0.88 SpeedyAttack defense int truncation 保留
- V0.87 DamageToHp2 critical int truncation 保留
- V0.86 BatFly no-wake lifecycle 保留
- V0.85 Modifyattack semantics 保留
- positive Enemy PetSkill coverage：158
- handled：134
- source missing：22
- source unregistered：2
- dispatcher gaps：0
- save schema：21


## V0.96 Combo member outer-loop consumption

V0.96 繼續沿 fixed `BATTLE_Command()` 掃共用戰鬥核心，修正合擊隊員被重複跑 `StatusSeq` 的生命週期差異。

固定來源：

- `gavinlinasd/StoneAge@1f90cb6cb57c1df70f39cde77a5a8ccd98b66c56`
- `gmsv/src/battle/battle.c`
- `case BATTLE_COM_COMBO`

原 C 在 leader 執行合擊時不是只留下標記，而是直接操作外層同一個 `i`：

```c
ComboId = EntryList[i].combo;
aAttackList[0] = EntryList[i].num;
i++;
for( ; EntryList[i].combo == ComboId && i < entrynum; i++ ){
    BATTLE_StatusSeq( EntryList[i].charaindex );
    ...
    aAttackList[k++] = EntryList[i].num;
}
i--;
BATTLE_Combo(...);
```

因此 leader 已經把後續 combo member 的 `BATTLE_StatusSeq()` 處理完，外層 `for` 下一次遞增後會直接跳到 combo 鏈後面的 Entry；那些 member 不會再進一次主迴圈 StatusSeq。

V0.95 web 的 `sourcePerformCombo()` 已經在 leader 階段對 follower 執行 `processBattleStatusTurn()`，也會設 `sourceComboConsumed=true`，
但外層 attack / guard / capture loop 原本是在再次跑完 `processBattleStatusTurn(actor)` 之後才檢查 `sourceComboConsumed`。
這會讓 combo follower 的毒、睡眠、石化、酒醉、混亂、WEAKEN/BARRIER lifecycle 等多推進一次。

V0.96 改為：

- `sourceDeadBattleEntry` / source C_WAIT 檢查後，立即檢查 `sourceComboConsumed`。
- 已被 leader 合擊流程吃掉的 Entry 在外層不再進第二次 `processBattleStatusTurn()`。
- leader 內的 `sourcePerformCombo()` 仍維持原本對每名 follower 執行一次 StatusSeq / CanMove / HP 檢查。
- surprise、dead Battle Entry、V0.95 ComboCheck dead-entry interrupt 規則不變。

### V0.96 regression

- `game.js` JavaScript syntax：PASS
- attack / guard / capture 三條 action loop：combo-consumed check 均位於 StatusSeq 前
- attack / guard 不再保留 StatusSeq 後的重複 consumed check
- `sourcePerformCombo()` follower StatusSeq 保留
- V0.95 dead Entry sort / ComboCheck semantics 保留
- V0.94 Enemy EscapeCheck int-average semantics 保留
- save schema：21


## V0.97 BATTLE_PetLoyalCheck core / low-loyalty action override

V0.97 接回 fixed `BATTLE_PetLoyalCheck()` 的玩家出戰寵忠誠核心，並把它放回原 C 的 action lifecycle 時點。

固定來源：

- `gavinlinasd/StoneAge@1f90cb6cb57c1df70f39cde77a5a8ccd98b66c56`
- `gmsv/src/battle/battle.c`：`BATTLE_PetLoyalCheck()` / `BATTLE_PetRandomSkill()` / `ComboCheck2()`
- `gmsv/src/battle/battle_event.c`：`BATTLE_LostEscape()`
- `gmsv/src/char/char.c`：`CHAR_initcharWorkInt()` 的 `CHAR_WORKFIXAI`
- `gmsv/src/char/pet.c`：捕獲時 7 格 PetSkill 原樣複製
- `gmsv/data/petskill.txt`

### FIXAI 最終仍是 int

來源先把忠誠算進 int：

```c
ai = ((hostLV * FIXCHARM * 1.10) / (petLV * modai) * 100);
if (ai > 100) ai = 100;
ai += CHAR_VARIABLEAI * 0.01;
...
CHAR_setWorkInt(index, CHAR_WORKFIXAI, ai);
```

`ai += double` 的 compound assignment 最後仍寫回 C `int`，所以 V0.97 把 `VARIABLEAI*0.01` 加完後再次向 0 截整數。
目前捕獲／任務寵的 VariableAI 初值仍是 0，但先把型別語意校正，避免未來接 VariableAI 後出現小數忠誠。

### 忠誠門檻保留 strict <

`Rand = RAND(1,100)`，來源是嚴格小於：

- FIXAI >= 80：正常。
- 70..79：roll < 10 才 TARGETRANDOM，也就是 9%。
- 60..69：roll < 20，19%。
- 50..59：roll < 35，34%。
- 40..49：roll < 50，49%。
- 30..39 / 20..29：roll < 70 時 RANDOMACT，69%；其餘正常。
- 10..19：roll < 80 打主人（79%），否則隨機打敵方（21%）。
- <10：roll < 60 打主人（59%），否則逃離本場（41%）。

不改成直覺的 10/20/35/50/70/80/60%。

### action lifecycle 時點

fixed `BATTLE_Battling()` 的順序是：

1. `BATTLE_StatusSeq()`
2. `BATTLE_CanMoveCheck()`
3. Surprise side 時跳過 LoyaltyCheck
4. `BATTLE_PetLoyalCheck()`
5. 讀取 COM，若是 COMBO 再跑 `ComboCheck2()`
6. 真正執行 action

因此 V0.97：

- 睡眠／石化等不能動時不做忠誠亂數。
- Surprise 首輪仍保留 V0.93 行為：confusion 可把原 NONE 改成 ATTACK，但 Surprise 分支本身不再做 LoyaltyCheck。
- 非 Surprise 的混亂寵：先產生混亂目標，再做 LoyaltyCheck；低忠誠仍可覆蓋混亂指定。
- Pet 是 combo leader 時：LoyaltyCheck 先跑。只要進非 NORMAL mode，就等價設 AIBAD，該 leader 的 `ComboCheck2()` 失敗；後面的 combo member 仍可在自己的 Entry 重新嘗試。
- 被前一位 combo leader 吃掉的 follower 維持 V0.96：不會再跑 LoyaltyCheck。

### 低忠誠 action

V0.97 已接：

- TARGETRANDOM：依原本 COM2 所在 side 用 `BATTLE_DefaultAttacker` 語意重抽。
- OWNERATTACK：出戰寵直接普通攻擊主人。
- ENEMYATTACK：隨機普通攻擊敵方。
- ESCAPE：等價 `BATTLE_LostEscape()`：
  - 寵物只退出本場，不刪除 pet。
  - `CHAR_DEFAULTPET=-1` 等價為取消 `activePetId`。
  - 魅力 -1，下限 0。
  - `battlePetOutIds` 標成真正 `BATTLE_Exit`，後續 Escape 平均等 Entry 規則會排除。
- RANDOMACT：
  - 保留 `RAND(0,6)` raw slot。
  - 保留 `BATTLE_PetRandomSkill()`「掃描 i、最後卻 PETSKILL_Use(iNum)」的舊索引語意。
  - skill 0 `PETSKILL_None`：待機。
  - skill 1 `PETSKILL_NormalAttack`：普通攻擊。
  - 來源 PetSkill array 不存在時，不猜 C 的越界記憶體讀取。
  - 忠犬 20／突擊 30／毒攻 60／酒醉攻 100 已辨識，但玩家側專用 guardian / charge / status lifecycle 尚未在 V0.97 偷換成普通攻擊；抽中時明確保留為 pending no-effect boundary，下一輪繼續接。

### 原版 NOACT bug 保留

`BATTLE_PetLoyalCheck()` 想用：

```c
if (CHAR_getCharHaveSkill(charaindex, i)) break;
```

檢查 Pet 是否有技能，但 `CHAR_getCharHaveSkill()` 回的是角色 haveSkill slot 指標，不是 `CHAR_getPetSkill()`。
合法 index 0 幾乎直接非 NULL，因此 `PETAI_MODE_NOACT` 在一般合法 Pet 上不可達。

V0.97 不把這個來源 bug「修正」成自創的無技能判斷。

### V0.97 regression

- `game.js` JavaScript syntax：PASS
- FIXAI VariableAI compound-assignment 後 int truncation
- 70/60/50/40 門檻維持 strict `<`
- 30/20 RANDOMACT 69% 邊界
- 10..19 OWNER 79% / ENEMY 21%
- <10 OWNER 59% / ESCAPE 41%
- Surprise branch 不做 LoyaltyCheck；confusion override 仍可行動
- 非 Surprise confusion Pet 會先 StatusSeq 再 LoyaltyCheck
- Pet combo leader AIBAD 可阻斷自己的 ComboCheck2
- combo-consumed follower 不重複 LoyaltyCheck
- LostEscape：退出本場、取消 active pet、charm -1、不刪 Pet
- random skill 0 / 1 已接
- random skill 20 / 30 / 60 / 100 明確 pending，不猜效果
- V0.96 combo follower StatusSeq consumption 保留
- V0.95 dead Entry sort / ComboCheck semantics 保留
- save schema：21


## V0.98 low-loyalty Pet RANDOMACT StatusChange 60 / 100

V0.98 接續 V0.97 的 `BATTLE_PetRandomSkill()`，先完成可捕獲寵實際可抽到的玩家側 `PETSKILL_StatusChange`：

- skill 60：毒攻擊，`毒 turn 3 攻%-30`
- skill 100：泥醉攻擊，`醉 turn 3 攻%-30`

固定來源：

- `gmsv/data/petskill.txt`
- `gmsv/src/battle/pet_skill.c`：`PETSKILL_StatusChange()`
- `gmsv/src/battle/battle_event.c`：`BATTLE_AttackSeq()` / `BATTLE_StatusAttackCheck()`
- fixed source commit 不變：`1f90cb6cb57c1df70f39cde77a5a8ccd98b66c56`

### 攻擊力不是最後傷害乘 0.7

來源：

```c
strdef = CHAR_getWorkInt(charaindex, CHAR_WORKFIXSTR);
strdef = (int)(strdef * fPer);
CHAR_setWorkInt(charaindex, CHAR_WORKATTACKPOWER,
    CHAR_getWorkInt(charaindex, CHAR_WORKFIXSTR) + strdef);
```

所以 -30% 是：

```
FIXSTR + trunc(FIXSTR * -0.30)
```

不是把最終傷害乘 0.7。

V0.98 直接從當輪 `petBattleView()` 的 FIX/compliance 等價 attack 起算，再做同一個 C int 截斷。

### Guardian 先換真正 defindex，再做狀態檢定

fixed `BATTLE_AttackSeq()`：

1. 原目標先做 dodge。
2. `BATTLE_GuardianCheck()` 成功時把 local `defindex` 改成 Guardian。
3. 傷害結算。
4. `BATTLE_StatusAttackCheck(attackindex, defindex, ...)` 使用已替換後的 `defindex`。

因此若敵方忠犬代擋，毒／酒醉必須套在真正代擋者。

Web 的 `resolveAttackToEnemyWithGuardian()` 已回傳 `actualTarget`，V0.98 直接用它做 status target。

### StatusAttackCheck 與酒醉 bug

沿用 V0.90 已校正的 int pipeline：

- base perOffset 30
- level difference × 2
- range ±40
- target resist / vital penalty
- 最終 int truncation
- cap 80
- `RAND(1,100) < per` 嚴格小於

一般 status 來源會先寫 `turn+1`。
酒醉再立刻：

```c
WORKDRUNK = WORKDRUNK / 2;
```

skill 100 的 turn=3 因此實際存成：

```
(3 + 1) / 2 = 2
```

維持 V0.76 之後已確認的酒醉 lifecycle bug。

### Counter 時點

狀態是在 `BATTLE_Attack()` 內、普通 Counter chain 前就寫入。

所以：

- 若將來抽到 sleep/stone 類 StatusChange，成功後目標已不能反擊。
- 目前 skill 60 poison / 100 drunk 不會禁止移動，仍可正常進 Counter。
- Guardian 代擋後由 actual Guardian 判斷是否能反擊。

### V0.98 regression

- `game.js` JavaScript syntax：PASS
- skill 60 / 100 從 RANDOMACT dispatcher 進玩家側 StatusChange
- attack = FIX attack + trunc(FIX attack * -30 / 100)
- Guardian actualTarget 接 status
- StatusAttackCheck 使用 Pet attacker level/luck 與 Enemy resist/stats
- poison turn 3 lifecycle
- drunk turn 3 -> stored 2
- status 在 Counter 前套用
- skill 20 Guardian / 30 Charge 仍 pending，不猜
- V0.97 BATTLE_PetLoyalCheck core 保留
- V0.96 combo follower lifecycle 保留
- save schema：21


## V0.99 low-loyalty Pet RANDOMACT ChargeAttack 30

V0.99 接回低忠誠 `BATTLE_PetRandomSkill()` 可抽到的 skill 30「突擊」。

固定來源：

- `gmsv/data/petskill.txt`：`突擊 ... PETSKILL_ChargeAttack,1 攻%+90,30`
- `gmsv/src/battle/pet_skill.c`：`PETSKILL_ChargeAttack()`
- `gmsv/src/battle/battle_event.c`：`BATTLE_Charge()`
- `gmsv/src/battle/battle.c`：`BATTLE_AllCharaCWaitSet()` / `BATTLE_IsCharge()` / LoyaltyCheck / direct attack
- `gmsv/src/battle/battle_command.c`：Charge 時 Pet menu off，但 preserved COM 可繼續
- fixed source commit：`1f90cb6cb57c1df70f39cde77a5a8ccd98b66c56`

### PETSKILL_ChargeAttack 寫入的狀態

skill 30：

```c
COM1 = BATTLE_COM_S_CHARGE;
COM2 = target;
LOW(COM3) = 1;
HIGH(COM3) = 90;
```

同一個 action 馬上進 `BATTLE_Charge()`：

- low > 0：low--，本回合 NoAction。
- low <= 0：以「釋放當輪」的 FIXSTR 做 `FIXSTR + trunc(FIXSTR*90/100)`，改成 CHARGE_OK 並攻擊。

因此 skill 30 是：

- 第一次抽到：1 → 0，蓄力，不攻擊。
- 下一次輪到且 command 沒被改掉：直接釋放 +90%。

不是「抽到後隔一個完整額外空白回合再打」。

### CHARGE 跨回合保留

`BATTLE_AllCharaCWaitSet()`：

```c
if (BATTLE_IsCharge(charaindex)) {
} else {
    COM1 = NONE;
}
MODE = C_WAIT;
```

而 `BATTLE_IsCharge()` 明確包含 `BATTLE_COM_S_CHARGE`。

所以 V0.99 用 battle-only `battlePetChargeStates` 保存 charge；每場開戰 reset，不寫進永久 save。

### LoyaltyCheck 對蓄力的特殊影響

LoyaltyCheck 發生在 `BATTLE_Charge()` 前。

- NORMAL：COM 不變，蓄力繼續。
- TARGETRANDOM：來源只覆寫 COM2，**不改 COM1**；所以仍是 CHARGE，只是目標重抽。
- RANDOMACT：`BATTLE_PetRandomSkill()` 覆寫 COM1，舊 charge 中斷。
- OWNERATTACK / ENEMYATTACK：改 COM1=ATTACK，舊 charge 中斷。
- ESCAPE：改 COM1=LOSTESCAPE，舊 charge 中斷並離場。
- CONFUSION 發作：StatusSeq 在 LoyaltyCheck 前先把 COM1 改成 ATTACK，charge 中斷。
- CanMove=false：主迴圈把 COM1 改 NONE，charge 中斷。

V0.99 全部照此順序。

### Charge 不能參與 Combo

ComboCheck 在 LoyaltyCheck 前，看的仍是本輪原 COM。

持續蓄力中的 Pet 是 `COM_S_CHARGE`，不是普通 `COM_ATTACK`，因此不能當 combo candidate。
V0.99 的 `sourceComboActorInfo()` 在 charge state 存在時會回 `normalAttack=false`。

第一次 RANDOMACT 當輪抽到 Charge 時，ComboCheck 已先跑過；若該 Pet 原本是 combo leader，Loyalty non-normal 會帶 AIBAD，等價原 `ComboCheck2()` 讓該 leader combo 失敗，再執行新 Charge command。

### 釋放不進普通 Counter

fixed direct-attack group：

```c
if (COM == BATTLE_COM_S_CHARGE_OK) {
    COM1 = BATTLE_COM_NONE;
}
BATTLE_Attack(...);
...
BATTLE_Counter(...);
```

而 `BATTLE_Counter()` 只允許原攻擊者目前 COM 是 ATTACK / NOGUARD。

所以 Charge release 雖走普通物理傷害與 Guardian／dodge，但原攻擊者 COM 已是 NONE，不能觸發後續普通 Counter chain。

V0.99 因此：

- 仍走 Enemy dodge / Guardian / damage。
- **不呼叫** `resolvePetEnemyCounterChain()`。

### V0.99 regression

- `game.js` JavaScript syntax：PASS
- battle-only charge runtime 每場 reset
- skill 30：first action low 1→0 no attack
- next preserved action：release +90%
- release 使用當輪 pet FIX/compliance attack
- invalid/dead old COM2：release 時才做 enemy-side fallback target
- TARGETRANDOM：只更新 charge target，charge 不取消
- RANDOMACT / OWNERATTACK / ENEMYATTACK / ESCAPE：取消舊 charge
- confusion 發作：StatusSeq 時點取消 charge
- status/CanMove skip：取消 charge
- charge state 不進 ComboCheck normalAttack
- CHARGE_OK release 不進普通 Counter
- V0.98 poison/drunk StatusChange 保留
- V0.97 LoyaltyCheck strict thresholds 保留
- V0.96 combo follower lifecycle 保留
- save schema：21


## V1.00 low-loyalty Pet RANDOMACT Guardian 20 core

V1.00 接回可捕獲寵低忠誠 RANDOMACT 的 skill 20「忠犬」核心。

固定來源：

- `gmsv/data/petskill.txt`：skill 20 `忠犬`，option `攻%-20 COM:攻击`
- `gmsv/src/battle/pet_skill.c`：`PETSKILL_Guardian()`
- `gmsv/src/battle/battle_event.c`：`BATTLE_GuardianCheck()` / `BATTLE_AttackSeq()` / `BATTLE_Attack()`
- `gmsv/src/battle/battle.c`：`BATTLE_PreCommandSeq()`
- fixed source commit：`1f90cb6cb57c1df70f39cde77a5a8ccd98b66c56`

### 忠犬只保護「本輪後半段」

每輪 `BATTLE_PreCommandSeq()` 都先：

```c
Entry[i].guardian = -1;
flg &= ~CHAR_BATTLEFLG_GUARDIAN;
```

skill 20 真正被 `PETSKILL_Use()` 選中後才：

- Pet 設 `CHAR_BATTLEFLG_GUARDIAN`
- 主人 Entry.guardian 指向 Pet slot
- Pet 自己以 `FIXSTR + trunc(FIXSTR * -20 / 100)` 攻擊

因此：

- 若 Enemy 比 Pet 快、先打主人：本輪忠犬尚未啟動，不能代擋。
- Pet 用完忠犬後，才保護同輪後續攻擊。
- 下一輪 PreCommandSeq 一開始自動清掉，必須再次使用才會再保護。

V1.00 用 battle-only `battlePlayerGuardianPetId` 對齊，不寫入 save。

### 代擋順序不是「直接把目標換寵物」

fixed `BATTLE_AttackSeq()`：

1. 原目標（主人）先做 `BATTLE_DuckCheck()`。
2. 主人成功閃避：直接 DODGE，忠犬不出場。
3. 主人沒閃掉：才 `BATTLE_GuardianCheck()`。
4. 代擋成功後，defindex 換成 Pet。
5. Critical、DamageCalc、GuardAdjust、屬性等全部以 Pet 自身能力結算。
6. 不再讓 Pet 做第二次 dodge。

V1.00 新增 `sourceInitialDodgeOnly()` + `resolveEnemyDirectAttackToPlayer()`，照相同順序執行。

### 忠犬成立條件

fixed `BATTLE_GuardianCheck()` 會拒絕：

- Guardian 已死亡。
- Guardian flag 不存在。
- sleep / confusion / paralysis / stone / barrier / dizzy 等無法守人的狀態。
- Guardian 就是攻擊者。
- 攻擊者使用投擲／遠距武器：
  - BOW
  - BOOMERANG
  - BREAKTHROW
  - BOUNDTHROW

玩家側目前 Guardian 與 Enemy 不可能是同一 actor；其餘已由現有 battle status / weaponType runtime 對應。

### 0 傷害的來源怪規則

`BATTLE_AttackSeq()`：

```c
if (*pDamage == 0) {
    iRet = BATTLE_RET_MISS;
    if (GuardianIndex != -1) {
        iRet = BATTLE_RET_NORMAL;
        *pDamage = 1;
    }
}
```

也就是忠犬一旦成功代擋，若計算傷害掉到 0，原 C 反而強制成 1 點 NORMAL。

V1.00 保留，不改成 MISS。

### Guardian 成功時不進普通 Counter chain

`BATTLE_Attack()` 在 Guardian 成功時最後固定：

```c
iRet = FALSE;
flg |= BCF_GUARDIAN;
```

外層普通 Counter loop 依 `ContFlg` 決定是否繼續，因此成功代擋不會再讓主人／忠犬接普通反擊。

Web 既有 `resolvePlayerEnemyCounterChain()` 已對 `primaryResult.guardian` 直接 return。

### V1.00 範圍邊界

這版先完成 **skill 20 本身 + 一般近戰 BATTLE_Attack 對主人** 的完整 Guardian substitution。

本輪另外確認固定原 C 有一個特殊舊 bug：

- `BATTLE_S_AttackDamage()` 也會呼叫 `BATTLE_AttackSeq()`，所以會用 Guardian 的防禦算 damage。
- 但它沒有像 `BATTLE_Attack()` 一樣把 caller 的 defindex 更新成 Guardian。
- 因此某些特殊 PetSkill 可能出現「用忠犬能力算傷害，血卻扣原目標」的怪行為。

V1.00 不把這兩條路徑錯誤合併；特殊 `BATTLE_S_AttackDamage` Guardian bug 留待下一版逐類對齊。

### V1.00 regression

- `game.js` JavaScript syntax：PASS
- skill 20 RANDOMACT dispatcher 已接
- Guardian attack = FIX attack + trunc(FIX attack * -20 / 100)
- 每輪 PreCommandSeq 等價清 Guardian mapping
- 主人 dodge 在 GuardianCheck 前
- Guardian 不做第二次 dodge
- Guardian damage/critical 用 Pet view
- 主人 GUARD 不會套到代擋 Pet
- BOW / BOOMERANG / BREAKTHROW / BOUNDTHROW 不可代擋
- Guardian damage 0 強制 1
- Guardian 成功不進普通 Counter
- V0.99 Charge 30 保留
- V0.98 StatusChange 60 / 100 保留
- V0.97 LoyaltyCheck core 保留
- save schema：21


## V1.01 BATTLE_S_AttackDamage Guardian defindex bug

V1.01 專門對齊 fixed C 的 `BATTLE_S_AttackDamage()` 忠犬 bug，避免把 V1.00 一般 `BATTLE_Attack()` 的正常代擋邏輯錯套到所有特殊技。

固定來源：

- `gmsv/src/battle/battle_event.c`
  - `BATTLE_AttackSeq()`
  - `BATTLE_Attack()`
  - `BATTLE_S_AttackDamage()`
- `gmsv/src/battle/battle.c` 對 `BATTLE_S_AttackDamage()` 的 command dispatch
- fixed commit：`1f90cb6cb57c1df70f39cde77a5a8ccd98b66c56`

### 一般 BATTLE_Attack 與特殊 BATTLE_S_AttackDamage 不一樣

正常 `BATTLE_Attack()` 在 `BATTLE_AttackSeq()` 返回後明確：

```c
if (Guardian >= 0)
    defindex = BATTLE_No2Index(battleindex, Guardian);
BATTLE_DamageSub(..., defindex, ...);
```

所以 V1.00 正常把傷害改扣忠犬。

但 `BATTLE_S_AttackDamage()`：

```c
iWork = BATTLE_AttackSeq(attackindex, defindex, &damage, &Guardian, skill_type);
...
BATTLE_DamageSub(attackindex, defindex, &damage, ...);
```

中間沒有把 caller 的 `defindex` 更新為 Guardian。

`BATTLE_AttackSeq()` 的 `defindex` 又只是傳值 local，所以來源實際流程是：

1. 原主人先做 DuckCheck。
2. 沒閃掉時 GuardianCheck 可以成功。
3. AttackSeq local defindex 換成忠犬。
4. Critical / DamageCalc / GuardAdjust 等以忠犬能力計算。
5. 若傷害算成 0，因 GuardianIndex 存在仍強制成 NORMAL / 1。
6. 返回 `BATTLE_S_AttackDamage()` 後，caller defindex 還是主人。
7. `BATTLE_DamageSub()` 與該技能後續效果仍落在原主人。

這是 fixed source 可直接證明的老 bug，不做合理化修正。

### V1.01 已切換的現有 handler

明確 dispatch 到 `BATTLE_S_AttackDamage()` 的現有 web handler：

- BattleTimid / 2BattleTimid
- Lighttakeed
- DamageToHp / DamageToHp2
- MpDamage
- ToothCrushe
- Modifyattack / Mdfyattack
- BattleTearDamage
- Sonic 主段與 SONIC2 貫穿段
- Regret 主段與 REGRET2 貫穿段

玩家目標改走 `resolveEnemyAttackSeqBugToPlayer()` / `enemyAttackSeqBugTargetResult()`。

原目標本來就是 Pet 時不經「主人 Entry 的 Guardian」替換，維持原 Pet path。

### 後續效果仍使用原 target

因 caller defindex 未更新：

- DamageToHp 吸血量依實際對原 target 的 damage。
- MpDamage 的 MP 扣除仍以原 Player 判定。
- Tear 的 missing HP bonus 仍讀原 target。
- Modifyattack 的目標屬性 bonus 仍讀原 target。
- Timid 的擊退／退出判定仍落原 target。
- Sonic / Regret 的原 primary / secondary target 結構不變。

### V1.01 regression

- `game.js` JavaScript syntax：PASS
- V1.00 一般 `BATTLE_Attack` Guardian 真正代擋不變
- `BATTLE_S_AttackDamage`：主人先 dodge
- Guardian 成功後 critical / damage 使用 Pet view
- Guardian 成功後主人 Guard 不套到 damage
- Guardian calc damage 0 強制 1
- HP 仍扣原 Player
- skill 後續效果仍落原 Player
- throw weapon 仍阻止 GuardianCheck
- Sonic primary + through 兩段都使用同一 source bug pipeline
- Regret primary + through 玩家段都使用同一 source bug pipeline
- V0.99 Charge / V0.98 StatusChange / V0.97 Loyalty core 保留
- save schema：21


## V1.02 GBreak / GBreak2 / FallGround Guardian local-defindex semantics

V1.02 繼續逐函式掃 fixed `BATTLE_AttackSeq()` 呼叫者，補齊 `BATTLE_S_GBreak()`、`BATTLE_S_GBreak2()`、`BATTLE_S_FallGround()` 的忠犬 local-defindex 語意。固定來源仍是 `gavinlinasd/StoneAge@1f90cb6cb57c1df70f39cde77a5a8ccd98b66c56`。

fixed `BATTLE_DuckCheck()` 對 `COM_GUARD` 直接 return FALSE，所以防禦中的原主人本來就不做一般閃避；V1.02 不改這點。

三個專用函式都以 `Guardian=-1` 呼叫 `BATTLE_AttackSeq()`，但 caller 沒有像正常 `BATTLE_Attack()` 那樣把自己的 `defindex` 更新成 Guardian。因此 Guardian 成功時，AttackSeq local defindex 會用忠犬做 critical / damage 計算，最後 `BATTLE_DamageSub()` 仍作用在原主人。

GBreak 只有原 caller defindex 自己是 GUARD 時才真的扣血，且 opt=GBREAK 跳過普通 GuardAdjust。V1.02 因此保留「原主人 GUARD → 不 dodge」，但 damage 可由忠犬 stats 計算、HP 仍扣主人。

GBreak2 的 ×1.3／×0.7 判定在 GuardianCheck 之後：沒有 Guardian 時，原主人 GUARD ×1.3，非 GUARD ×0.7；Guardian 成功時 local defindex 已換成 skill20 忠犬，而忠犬 command 是 GUARDIAN_ATTACK 不是 GUARD，因此改走 ×0.7，最後仍扣原主人。GBreak2 本身不再額外套普通 GuardAdjust。

FallGround 同樣保留 calc-only Guardian bug；後面的落馬條件仍以 caller 原主人為 target，因此忠犬不會把落馬效果轉移到自己。

本輪也額外確認 `BATTLE_Counter()` 使用 `Guardian=-2`，而 AttackSeq 只有 `*pGuardian==-1` 才呼叫 GuardianCheck，所以反擊刻意不允許忠犬介入，不做修改。

### V1.02 regression

- `game.js` syntax PASS
- GuardBreak 非 GUARD 仍 0 damage
- GuardBreak GUARD 不 dodge、無普通 GuardAdjust
- GuardBreak Guardian calc-only / HP 原主人
- GuardBreak2 無 Guardian：GUARD ×1.3、非 GUARD ×0.7
- GuardBreak2 有 Guardian：local Guardian 非 GUARD → ×0.7，HP 原主人
- FallGround Guardian calc-only，落馬 target 仍原主人
- Counter Guardian=-2 不改
- V1.01 AttackDamage bug、V1.00 normal Guardian substitution、V0.99 Charge、V0.98 StatusChange、V0.97 Loyalty 保留
- save schema 21


## V1.03 Firekill / BattleModel real Guardian substitution

V1.03 繼續按 fixed `BATTLE_AttackSeq()` caller 分類，這次補的是「來源會真的把受傷者改成 Guardian」的專用路徑。

固定來源：

- `BATTLE_Attack_FIREKILL()`
- `BATTLE_BattleModel_ATTACK()`
- `battle.c` 的 `BATTLE_COM_S_FIREKILL` caller
- fixed commit：`1f90cb6cb57c1df70f39cde77a5a8ccd98b66c56`

### Firekill：物理段改忠犬，火魔法仍打原 target

`BATTLE_Attack_FIREKILL()`：

```c
iWork = BATTLE_AttackSeq(..., &Guardian, ...);
if (Guardian >= 0)
    defindex = BATTLE_No2Index(battleindex, Guardian);
...
BATTLE_DamageSub_FIREKILL(attackindex, defindex, ...);
```

所以物理段忠犬成立時，HP／死亡／喚醒等都作用在忠犬。

但 caller 隨後仍用原本的 `defNo`：

```c
BATTLE_Attack_FIREKILL(battleindex, attackNo, defNo);
BATTLE_MultiAttMagic_Fire(battleindex, attackNo, defNo, 2, 200);
```

因此原版可以出現：

- 火線獵殺物理段被忠犬真正擋下。
- 接著固定 200 火魔法仍命中原主人。

V1.03 保留這個分段 target，不把火魔法錯轉給忠犬。

### BattleModel：狀態也跟著 Guardian

`BATTLE_BattleModel_ATTACK()` 在 physical type 明確：

```c
iDefState = BATTLE_AttackSeq(..., &iGuardian, -1);
if (iType & 0x00000004) {
    if (BATTLE_TargetCheck(battleindex, iGuardian))
        if (iGuardian >= 0)
            iDefindex = BATTLE_No2Index(battleindex, iGuardian);
}
```

來源註解也直接寫：「在這之後的 iDefindex 才是真正會受傷的目標」。

後面這些都使用 `iDefindex`：

- `BATTLE_DamageSub`
- DamageWakeUp
- death / ultimate
- `BATTLE_StatusAttackCheck`
- `StatusTbl[iEffect] = iTurn`
- 石化／魔障等成功後清 COM1

目前有實際 Enemy runtime 的 BattleModel 為：

- 590 / 655「虎虎生威」：5 個物理 AttackObject + 石化
- 689「Q雷分身術」：5 個物理 AttackObject + 魔障

沒有需要額外猜測的 drunk parser。

V1.03 因此把每個 Player AttackObject 改走正常 real-Guardian substitution；若忠犬代擋：

- damage 扣 Pet。
- status chance 用 Pet level / resist / stats。
- stone / barrier 落在 Pet。
- 主人的 `playerGuardingActive` 不會因 Pet 中狀態而被錯清。
- Guardian 若被前一個 AttackObject 打死，後續 AttackObject 會自然回到 Player。

### V1.03 regression

- `game.js` syntax PASS
- Firekill physical：Player dodge → GuardianCheck → actual Pet damage
- Firekill magic：仍鎖原 chosen target
- Firekill Guardian 死亡不把 magic target 改成 Pet
- BattleModel physical Player target 支援 real Guardian substitution
- BattleModel status target = actual Guardian target
- BattleModel Guardian death 後下一物件重新判斷
- BattleModel Pet 中 stone/barrier 不清 Player GUARD
- V1.02 calc-only GBreak/FallGround、V1.01 AttackDamage bug、V1.00 normal Guardian 保留
- save schema 21


## V1.04 low-loyalty Pet NormalGuard 2

V1.04 直接從正式捕獲資料 `data/generated/stoneage_general_lv1_pets.json`（166 species / 169 wild Lv1 variants）統計實際 PetSkill。
169 個 variant 共只使用 19 個 PetSkill ID；目前玩家側 RANDOMACT 最大未接缺口是 **skill 2「防禦」**，出現在 **151 / 169** 個 variant。

fixed source：`gavinlinasd/StoneAge@1f90cb6cb57c1df70f39cde77a5a8ccd98b66c56`。

### 原 PETSKILL_NormalGuard

`gmsv/src/battle/pet_skill.c` 只做：

```c
COM1 = BATTLE_COM_GUARD;
COM2 = toindex;
MODE = C_OK;
```

因此 V1.04 新增 battle-only `battlePetGuardIds`：

- Pet 真正輪到低忠誠 RANDOMACT 並抽中 skill 2 後才開始防禦。
- 同輪較早打到 Pet 的 Enemy 不受影響。
- 同輪後續物理攻擊會讀到 Pet 自己的 GUARD。
- fixed `BATTLE_AllCharaCWaitSet()` 只保留 Charge，所以下一輪開頭清除 NormalGuard。
- 不寫入永久 save。

### COM_GUARD 與實際減傷分開

fixed `BATTLE_DuckCheck()` 只要看到 `COM_GUARD` 就直接不閃避。
但 AttackSeq 的 `BATTLE_GuardAdjust()` 還要求 `WORKCONFUSION<=0`。

因此若 Pet 先 GUARD 後又混亂：

- COM 仍是 GUARD，因此不能 dodge。
- 不吃 GuardAdjust。
- COM 不是 ATTACK / NOGUARD，因此不能進普通 Counter。

V1.04 以 `sourcePlayerPetGuardCommand()` 與 `sourcePlayerPetGuardAdjust()` 分開模擬。

### 共用 Pet-target 物理入口

已接入：

- `enemyAttackPetResult()`
- `enemySkillTargetResult()`
- `enemyAttackSeqBugTargetResult()`

所以普通攻擊、連續攻擊、狀態攻擊、狂暴、回旋、追跡、Firekill 物理段、BattleModel 物理 object 等現有共用路徑都能讀到 Pet GUARD。

### GBreak / GBreak2

`BATTLE_S_GBreak()`：

- Pet 必須是有效 GUARD 才保留傷害。
- COM_GUARD 不 dodge。
- opt=GBREAK 跳過普通 GuardAdjust，因此破防命中時不再吃 1/2 防禦減傷。

`BATTLE_S_GBreak2()`：

- multiplier 直接看 local Pet 的 `COM_GUARD`。
- Pet GUARD -> ×1.3。
- Pet 非 GUARD -> ×0.7。
- opt=GBREAK2 本身不再進普通 GuardAdjust。

### 禁行動狀態覆寫 command

fixed 普通 StatusAttack、`BATTLE_MultiStatusChange()`、BattleModel 都會在成功施加：

- paralysis
- sleep
- stone
- barrier

後寫 `COM1=NONE`。

因此 V1.04 在 `battleStatusApply()` / `battleStatusApplyRaw()` 成功時同步清除 Pet 的：

- NormalGuard battle state
- Charge battle state

只限上述四種；poison / confusion / drunk / deepPoison / nocast 不清 command。

### V1.04 regression

- `game.js` syntax PASS
- battle-only Pet Guard 每場 reset
- 每新 round 清 GUARD
- low-loyalty RANDOMACT skill 2 dispatcher
- ordinary Pet target：GUARD 禁 dodge + GuardAdjust
- confused GUARD：禁 dodge但不 GuardAdjust
- Pet COM_GUARD 不進 Counter
- GBreak Pet GUARD 專用路徑
- GBreak2 Pet GUARD ×1.3 / 非 GUARD ×0.7
- Firekill Pet physical 讀 Pet GUARD
- paralysis/sleep/stone/barrier 成功時清 Guard / Charge
- V1.03 Firekill/BattleModel true Guardian substitution 保留
- V1.02 / V1.01 Guardian 舊 bug 語意保留
- save schema 21


## V1.05 low-loyalty Pet ContinuationAttack 10 / Mighty 40

V1.05 接續 169 個 wild Lv1 variant 的實際未接清單：

- skill 10「連續攻擊」：1 個 variant（卡梅蘭恩）
- skill 40「一擊必殺」：3 個 variant（多薩金格／奧卡洛斯／沙瓦克）

fixed source 不變：`gavinlinasd/StoneAge@1f90cb6cb57c1df70f39cde77a5a8ccd98b66c56`。

### skill 10 ContinuationAttack

`PETSKILL_ContinuationAttack()`：

- `COM1=BATTLE_COM_S_RENZOKU`
- `LOW(COM3)=N`

`battle.c`：

```c
attack_max = LOW(COM3);
gDamageDiv = attack_max;
```

而 `BATTLE_TargetListSet()` 對 non-BOW 會先把整個 `aDefList` 填成原 COM2。
目前捕獲 Pet 沒有 CHAR_ARM，因此玩家寵這條固定走 non-BOW：

- skill 10 的 option=2 -> 2 段。
- 每段普通 AttackSeq 傷害後再除以 2，正傷害最低 1。
- 原目標仍活著時兩段都打原目標。
- 原目標中途倒下，下一段的 TargetAdjust 改抓同 enemy side 其他存活目標。
- Guardian / dodge / guard 每一段各自重跑。
- 所有段數完成後才用最後一次 `ContFlg` 進普通 Counter chain，不是每段反擊。

### skill 40 Mighty

`PETSKILL_Mighty()` option：

```
倍2 回避30
```

source 在真正 attack 前：

```c
gBattleDamageModyfy = LOW(COM3) * 0.01; // 2.00
gBattleDuckModyfy = HIGH(COM3);          // +30
```

因此 V1.05：

- 最終物理 damage multiplier = ×2。
- 目標 DuckCheck 額外 +30。
- 仍走普通 BATTLE_Attack 的 Guardian / guard / critical / Counter lifecycle。
- 不把「回避30」誤當成攻擊者自己的回避。

### V1.05 regression

- `game.js` syntax PASS
- skill 10 dispatcher
- skill 10 option N clamp 1..10
- skill 10 每段 `damageDivisor=N`
- non-BOW target list 保留原目標直到失效
- skill 10 只在末段結果進 Counter
- skill 40 dispatcher
- skill 40 damage ×2 / target dodge +30
- skill 40 走 ordinary Guardian / Counter
- V1.04 NormalGuard 保留
- save schema 21


## V1.06 low-loyalty Pet PowerBalance 50 / 51

V1.06 接入實際 wild Lv1 捕獲清單中的：

- 50 背水之戰其之1：`攻%+25 防%-35`
- 51 背水之戰其之2：`攻%+45 防%-55`

fixed `PETSKILL_PowerBalance()` 不是最終 damage multiplier，而是直接重寫：

```c
WORKATTACKPOWER = FIXSTR + (int)(FIXSTR * attackPercent);
WORKDEFENCEPOWER = FIXTOUGH + (int)(FIXTOUGH * defensePercent);
```

所以 V1.06 新增 battle-only `battlePetPowerMods`：

- skill 發動時以當輪 Pet battle FIX 等價 attack/defense 為基底。
- 百分比乘積按 C int 向 0 截斷。
- 修改後的 attack 用於本次普通 BATTLE_Attack。
- 修改後的 defense 會保留到本輪後續 Enemy 攻擊。
- Counter / counter-counter 再讀 `petBattleView()` 時也沿用修改後攻防。
- `fixedTough` / `fixedDex` 不被 PowerBalance 改寫。
- 下一 round PreCommand/compliance 等價重建時清掉 power override。
- 不寫入 save。

V1.06 regression：

- game.js syntax PASS
- 50 / 51 共用 `PETSKILL_PowerBalance` dispatcher
- signed attack / defense percent from source option
- C-int truncation before add-back
- attack + defense persist for remainder of current round
- counter chain uses modified WORK values
- next round clears to FIX-equivalent values
- V1.05 Continuation/Mighty 保留
- V1.04 NormalGuard 保留
- save schema 21


## V1.07 low-loyalty Pet GuardBreak 3

V1.07 接回 wild Lv1 實際可捕獲清單中的 skill 3「破除防禦」（布伊比）。

fixed `PETSKILL_GuardBreak()` 設 `COM_S_GBREAK`；`BATTLE_S_GBreak()` 有兩條很不直覺的來源行為。

### 原目標沒有 GUARD

source 並不是一開始就 NoAction：

1. 先完整呼叫 `BATTLE_AttackSeq()`。
2. 原 defindex 若不是有效 `COM_GUARD && !CONFUSION`：
   `damage=0; iWork=MISS`。
3. `BATTLE_S_GBreak()` 對 MISS 回 `TRUE`。
4. battle.c 外層因此仍用 `ContFlg=TRUE` 進普通 Counter loop。

所以低忠誠 RANDOMACT 拿破防打普通攻擊中的 Enemy 時：

- Pet 本身造成 0。
- AttackSeq 的 dodge / critical / Guardian 等 RNG 仍先被消耗。
- Enemy 若具備反擊條件，仍可能反擊 Pet。

V1.07 保留這個怪行為。

### 原目標正在 GUARD

`BATTLE_DuckCheck()` 對 COM_GUARD 直接 FALSE。
而 opt=GBREAK 在 AttackSeq 中明確跳過普通 `BATTLE_GuardAdjust()`，所以破防命中不再吃防禦減傷。

### Enemy Guardian 的 calc-only bug

`BATTLE_S_GBreak()` 傳 `Guardian=-1`，所以 AttackSeq 可以找到 Enemy Guardian；
但 caller 沒有像 `BATTLE_Attack()` 一樣更新自己的 defindex。

因此 Guardian 成功時：

- critical / DamageCalc 用 Guardian。
- 0 damage 可因 GuardianIndex 被強制成 1。
- 最後 DamageSub 仍扣原本正在 GUARD 的 Enemy。
- 原 GUARD target 使函式回 FALSE，因此不進 Counter。

V1.07 regression：

- game.js syntax PASS
- skill 3 dispatcher
- non-GUARD target：AttackSeq RNG + forced 0/MISS
- non-GUARD target：ContFlg TRUE 可進 Counter
- GUARD target：no dodge
- GUARD target：GBREAK skips GuardAdjust
- Enemy Guardian：calc-only / HP stays original target
- GUARD path no ordinary Counter
- V1.06 PowerBalance 保留
- save schema 21


## V1.08 low-loyalty Pet NoGuard 150

V1.08 接回 wild Lv1 清單中的 skill 150「不防守戰法」（沙瓦克）。

source option：`回避%+30 反击%+50 会心%+20`。

固定原 C 中真正生效的是：

- `BATTLE_DuckCheck()`：defender COM=NOGUARD 時 + high(COM3) 回避。
- `BATTLE_CounterCheckPet()`：attacker COM=NOGUARD 時 + (low(COM3)>>8) 反擊率。
- `BATTLE_Counter()`：明確允許 COM_ATTACK 或 COM_S_NOGUARD 當反擊者。

「會心 +20」則是來源死資料：唯一讀取該 low-byte 的 `BATTLE_CriticalCheckPet()` 整段被 `#if 0`，現行 `BATTLE_CriticalCheck()` 對 Pet 也改走 `BATTLE_CriticalCheckPlayer()`，後者不讀 NoGuard critical bonus。

因此 V1.08：

- 回避 +30 生效。
- 反擊 +50 生效。
- 會心 +20 保留解析與 log，但不套入 critical。
- 技能本身 NoAction。
- 從 Pet 真正使用後維持本輪剩餘時間。
- 下一 round 清除。
- paralysis/sleep/stone/barrier 覆寫 COM 時立即清除。
- 不寫 save。

V1.08 regression：

- game.js syntax PASS
- NoGuard battle state reset
- petBattleView duckBonus / counterBonus
- existing sourceBattleDuckTotal consumes +30
- existing battleCounterChance consumes +50
- critical +20 intentionally ignored
- command-clearing status removes NoGuard
- next round removes NoGuard
- V1.07 GuardBreak retained
- save schema 21


## V1.09 low-loyalty Pet EarthRound 120 + direct-release Counter correction

V1.09 接回 wild Lv1 skill 120「地球一周」(`PETSKILL_EarthRound`, `攻%+90`)。

固定來源：`gavinlinasd/StoneAge@1f90cb6cb57c1df70f39cde77a5a8ccd98b66c56`。

### StatusChange 清單先校正

正式 runtime 已確認 61 猛毒、80 石化、90 混亂、110 催眠全部是 `PETSKILL_StatusChange`。V0.98 之後 player RANDOMACT 已按 handler 共用 dispatch，parser 也已支援 poison / stone / confusion / sleep，因此四筆已實際覆蓋，不另複製四套技能。

### EarthRound lifecycle

`PETSKILL_EarthRound()` 寫 EARTHROUND1 / COM2 / COM3；skill 120 的 COM3 為 90。第一回合 `BATTLE_EarthRoundHide()` 把 `CHAR_ISATTACKED=0`，並把 COM1 改為 EARTHROUND0，所以 Pet 不攻擊且 `BATTLE_TargetCheck()` 不能選中它。

V1.09 用 `battlePetEarthRoundStates` 保存 command / target / WORK-FIX snapshot，用獨立 `battlePetHiddenIds` 保存 CHAR_ISATTACKED 語意。Enemy 即使排序前已選到 Pet，真正行動時也會重新驗證 hidden 狀態並 fallback target。

EARTHROUND0 被 `BATTLE_IsCharge()` 保留到下一輪；`BATTLE_PreCommandSeq()` 對它直接 continue，所以 release round 不重新 complianceParameter、TurnParam、AttReverse。Web 因此沿用隱身前一輪的 attack / defense / fixedDex / quick base / fixedTough / element snapshot。

### 傷害倍率

來源：
```c
gBattleDamageModyfy = 1.0 + 0.01 * COM3;
```
COM3=90，因此實際最終傷害倍率是 **×1.90**，不是文案近似的 2.00。

### Loyalty 覆寫

EARTHROUND0 下一輪仍跑 `BATTLE_PetLoyalCheck()`：
- NORMAL：現身釋放。
- TARGETRANDOM：只改 COM2，EarthRound 繼續。
- RANDOMACT / OWNERATTACK / ENEMYATTACK / confusion / blocking status：覆寫或清除 COM1，EarthRound command 中斷。
- ESCAPE：離場。

重要：EarthRound command 中斷不等於立即 `CHAR_ISATTACKED=1`。原 C 只有真正進 direct-attack 區才恢復這個旗標。因此被改成 GUARD / NONE / NOGUARD / CHARGE 等非直接動作時，hidden flag 可繼續殘留；之後普通攻擊、狀態攻擊、忠犬攻擊、多段、Mighty、PowerBalance、Charge release、EarthRound release 等 direct path 才重新現身。

### Combo

EARTHROUND0 不是 COM_ATTACK，因此 active EarthRound command 不可成為 Combo candidate。若 command 已被覆寫而 hidden flag 因來源 bug 殘留，後續 COM_ATTACK 仍照來源可進 Combo；`BATTLE_Combo()` 本身沒有恢復 CHAR_ISATTACKED，本版不自行修漂亮。

### Charge / EarthRound 第一層 Counter

重新核對 direct-attack 後的 fixed Counter loop：
k=0 的反擊者其實是原 defender；k=1 才輪到原 attacker。

CHARGE_OK / EARTHROUND0 在 `BATTLE_Attack()` 前把原 Pet COM1 改 NONE，所以：
- defender 仍可做第一下 Counter；
- 下一層 Pet counter-counter 因 COM1=NONE 失敗。

V0.99「完全不進 Counter」少了第一層。V1.09 把 Charge release 與 EarthRound release 都改成最多執行一層 defender Counter。

### V1.09 regression
- game.js syntax PASS
- battle-only EarthRound state + hidden flag reset
- skill 120 RANDOMACT dispatcher
- EARTHROUND1 no damage + untargetable
- action-time Enemy target revalidation
- EARTHROUND0 cross-round preservation
- release uses frozen WORK/FIX snapshot
- final damage ×1.90
- TARGETRANDOM preserves command, changes target only
- non-direct override may retain hidden flag
- direct attack restores targetability
- active EarthRound excluded from Combo
- Charge release first Counter only
- EarthRound release first Counter only
- 61 / 80 / 90 / 110 confirmed covered by common StatusChange
- V1.08 and earlier low-loyalty handlers retained
- save schema 21


## V1.10 low-loyalty Pet FallGround 210

V1.10 接回正式 wild Lv1 清單中最後一個「runtime 有正式 handler、player RANDOMACT 尚未接」的技能：

- 210 落馬術
- `PETSKILL_FallGround`
- option：`攻%-30`

fixed build 同時開啟：
- `_PSKILL_FALLGROUND`
- `_ENEMY_FALLGROUND`

來源固定：
`gavinlinasd/StoneAge@1f90cb6cb57c1df70f39cde77a5a8ccd98b66c56`。

### 攻擊力

`PETSKILL_FallGround()`：

```c
fPer = attackPercent / 100;
strdef = (int)(FIXSTR * fPer);
WORKATTACKPOWER = FIXSTR + strdef;
```

skill 210 為 -30%，所以 V1.10：

```
attack = FIXSTR + trunc(FIXSTR * -0.30)
```

不是最終 damage ×0.7。

### Guardian caller-defindex bug

`BATTLE_S_FallGround()`：

```c
Guardian = -1;
iWork = BATTLE_AttackSeq(attackindex, defindex, &damage, &Guardian, FALLRIDE);
BATTLE_DamageSub(attackindex, defindex, ...);
```

和 V1.02 的 Enemy->Player FallGround 一樣，caller 沒有把 defindex 更新成 Guardian。

因此 player Pet 攻擊 Enemy 時若敵方忠犬成立：

1. 原 target 先做 DuckCheck。
2. AttackSeq local defindex 改成 Guardian。
3. critical / defense / element / guard adjustment 用 Guardian 計算。
4. Guardian 若讓 damage 算到 0，AttackSeq 仍依 GuardianIndex 強制 NORMAL / 1。
5. 回到 BATTLE_S_FallGround 後，HP 仍扣原 target。
6. 落馬判定也仍讀原 target。

V1.10 以 `guardianCalcOnly` 保留，不把 HP 錯扣到 Guardian。

### 落馬 RNG

固定來源：

```c
if (damage > 0 && react == 0) {
    fallflg = RAND(0,100);
    if (fallflg > 50) { ... }
}
```

沒有裝備抗性時成功門檻是 50/101，不是整數 50%。

V1.10 在有效正傷害後仍消耗這次 `RAND(0,100)`，即使目前 target 沒有 ride runtime，以維持 RNG 次序。

### _ENEMY_FALLGROUND 現況

原 C 對 Enemy target 只有：

```c
if (CHAR_RIDEPET > 0) {
    CHAR_RIDEPET = -1;
    STR *= 0.7;
    TOUGH *= 0.7;
    VITAL *= 0.7;
    complianceParameter();
}
```

目前 `makeEnemyUnit()` 與 generated encounter runtime 沒有任何可證明的 `CHAR_RIDEPET` 對應欄位。

因此 V1.10：
- 不替野怪虛構騎乘寵。
- 不無條件把 Enemy 三能力 ×0.7。
- 只保留一個未來若 source-derived `ridePetId>0` 真正出現才可達的分支。

### CHAR_ISATTACKED

FallGround 是 battle.c 的獨立 special case，不經一般 direct-attack 群組的：
`CHAR_setFlg(charaindex, CHAR_ISATTACKED, 1)`。

所以若 Pet 因 V1.09 EarthRound command 被覆寫而留下 hidden flag，接著 RANDOMACT 抽到 FallGround，本技能不擅自讓它現身。

### Counter

`BATTLE_COM_S_FALLRIDE` 呼叫 `BATTLE_S_FallGround()` 後直接 break，不進普通 direct-attack Counter loop。

V1.10 不呼叫 `resolvePetEnemyCounterChain()`。

### V1.10 regression
- game.js syntax PASS
- 210 RANDOMACT dispatcher
- FIXSTR + trunc(FIXSTR * -30%)
- original target DuckCheck
- Enemy Guardian calc-only bug
- HP / fall target remains original Enemy
- positive damage consumes RAND(0,100)
- >50 threshold = 50/101
- no fabricated Enemy mount state
- no ordinary Counter chain
- no forced CHAR_ISATTACKED restore
- V1.09 EarthRound / Charge first-counter correction retained
- save schema 21

## V1.11 fixed petskill2.txt runtime + player Pet GuardBreak2 543

V1.11 修正 PetSkill runtime 的根資料源。fixed version.h 開啟 _PETSKILL2_TXT、_CFREE_petskill、_PETSKILL_OPTIMUM；configfile.c 因此讀 setup.cf 的 petskillfile2=./data/petskill2.txt，而不是舊的 petskill.txt。

舊 stoneage_petskill_runtime.json 只來自 petskill.txt 56 筆。V1.11 改為 fixed petskill2.txt 全表：282 筆、ID 0～841、無重複 ID，並保留 name/description/function/option/free/kind/field/target/useType/cost/illegal。

illegal 依 fixed loader 規則由 raw line 是否以 ASCII E 開頭決定；PETSKILL_Use 對 CHAR_TYPEPET 遇 PETSKILL_ILLEGAL 直接 return FALSE。player RANDOMACT 已同步。

fixed petskill2.txt 明確記錄 541=PETSKILL_WildViolentAttack、542=PETSKILL_SpeedyAttack、543=PETSKILL_GuardBreak2、573=PETSKILL_Sacrifice。wild 戈登爾頓 tempNo 768 / Enemy 1601 的 543 因此確實是破除防禦之2。

PETSKILL_GuardBreak2 本身只設 BATTLE_COM_S_GBREAK2 / target / C_OK。真正效果在 BATTLE_AttackSeq：GuardianCheck 後的 local defindex 若為 GUARD，damage ×1.3，否則 ×0.7；BATTLE_S_GBreak2 caller 又沒有把 defindex 更新成 Guardian，因此忠犬可參與 local 傷害計算，但最後 HP 仍扣原 target。

V1.11 的 sourcePerformPetGuardBreak2Skill 保留：原 target 先做 DuckCheck；GUARD 時不可 dodge；Guardian substitution 後才決定 ×1.3/×0.7；Guardian calc-only；HP 原 target；專用 case 不進普通 Counter；也不強制清除 V1.09 EarthRound 殘留 hidden flag。

Regression: game.js syntax PASS；runtime 282 unique IDs；min 0 / max 841；543 handler 正確；illegal gate 正確；GuardBreak2 dispatcher / local multiplier / calc-only / no-Counter 全部靜態檢查通過；save schema 21。

## V1.12 BATTLE_AttackSeq Guardian caller audit complete

V1.12 從 V1.02 指定的方向把 fixed `BATTLE_AttackSeq()` caller 全部掃完。固定來源仍是：

`gavinlinasd/StoneAge@1f90cb6cb57c1df70f39cde77a5a8ccd98b66c56`

fixed `gmsv/src/battle/battle_event.c` 共有 13 個實際 caller（不含 `BATTLE_AttackSeq` 自身）：

| caller | Guardian seed / caller 行為 | fixed 語意 | Web 狀態 |
| --- | --- | --- | --- |
| `BATTLE_Attack` | `Guardian=-1`，caller 會把 `defindex` 換成 Guardian | 真正代擋 | V1.00 |
| `BATTLE_Attack_FIREKILL` | `Guardian=-1`，物理段改 `defindex` | 物理真正代擋；後續固定火魔法仍用原 `defNo` | V1.03 |
| `BATTLE_Counter` | `Guardian=-2` | AttackSeq 不呼叫 GuardianCheck | 已確認，不改 |
| `BATTLE_S_GBreak` | `Guardian=-1`，caller 不改 `defindex` | calc-only；HP 原 target | V1.02 / V1.07 player |
| `BATTLE_S_GBreak2` | `Guardian=-1`，caller 不改 `defindex` | calc-only；×1.3/×0.7 看 local defindex | V1.02 / V1.11 player |
| `BATTLE_Combo` | 每段先設 `Guardian=-2` | 合擊明確不允許忠犬介入 | V0.74 |
| `BATTLE_S_FallGround` | `Guardian=-1`，caller 不改 `defindex` | calc-only；HP / 落馬 target 原目標 | V1.02 / V1.10 player |
| `BATTLE_S_Explode` | `Guardian=-1`，caller 不改 `defindex` | 若編譯會是 calc-only | fixed `_PETSKILL_EXPLODE` 關閉，不接 |
| `BATTLE_S_AttackDamage` | `Guardian=-1`，caller 不改 `defindex` | calc-only；後續效果仍原 target | V1.01 |
| `battle_profession_attack_fun` | `Guardian=-1`，caller 不改 `defindex` | calc-only | fixed 有編譯；Web 尚無職業技能 runtime |
| `battle_profession_status_chang_fun` 盾擊分支 | `Guardian=-1`，caller 不改 `defindex` | calc-only；傷害/狀態仍原 target | fixed 有編譯；Web 尚無職業技能 runtime |
| `battle_profession_status_chang_fun` 後段多目標分支 | `Guardian=-1`，AttackSeq 後明確改 `defindex=Guardian` | 真正代擋；DamageSub / 狀態跟 Guardian | fixed 有編譯；Web 尚無職業技能 runtime |
| `BATTLE_BattleModel_ATTACK` | physical type 才在 AttackSeq 後改 `iDefindex` | 物理傷害、死亡、StatusAttackCheck 全跟 Guardian | V1.03 |

固定 `version.h` 同時確認：

- `_PROFESSION_SKILL`：開啟。
- `_PETSKILL_FIREKILL`：開啟。
- `_PETSKILL_BATTLE_MODEL`：開啟。
- `_PETSKILL_EXPLODE`：關閉，且來源註記「不可開」。

因此目前 Guardian 核心不能再做任何「所有 AttackSeq caller 一律換 target」的全域處理。來源本身就同時存在 real substitution、calc-only 舊 bug、Guardian=-2 明確禁用與未編譯死碼四種語意。

另外用 V1.11 改成的 fixed `petskill2.txt` runtime 重新交叉檢查目前 166 組一般野外 Lv1 可捕獲資料：其實際 `skillIds` 所對應的 PetSkill function 已全部落在目前 player RANDOMACT 已支援集合（NormalAttack / NormalGuard / StatusChange / Mighty / Guardian / PowerBalance / GuardBreak / ContinuationAttack / ChargeAttack / EarthRound / GuardBreak2 / FallGround / NoGuard）。目前一般野外 Lv1 捕獲寵沒有新的 RANDOMACT function 缺口。

### V1.12 regression / audit

- main 基準：V1.11 `919abe99bd5621adacd6d16b88bd649ae23476da`
- fixed source：`1f90cb6cb57c1df70f39cde77a5a8ccd98b66c56`
- 13 個 AttackSeq caller 全數分類
- Firekill / BattleModel real substitution 保留
- GBreak / GBreak2 / FallGround / AttackDamage calc-only 保留
- Counter / Combo Guardian=-2 保留
- Explode fixed build disabled，不人工打開
- Profession 兩種不同 Guardian caller 語意記錄完成，但不在尚不存在的 Web profession runtime 上猜實作
- 一般野外 Lv1 捕獲寵 PetSkill function coverage：無新增缺口
- save schema：21


## V1.13 quest GetPet source template / progression

V1.13 從實際可達的任務獎勵寵回查 fixed C，修正三隻先前以手寫物件建立、沒有走原 `GetPet` 建立核心的寵物：

- Event 70：EnemyID 1479 → TempNo 718 瑪蕾菲雅
- Event 82：EnemyID 1563 → TempNo 730 布伊胖
- Event 83：EnemyID 1733 → TempNo 854 動物園養的拉斯基

固定來源仍是：
`gavinlinasd/StoneAge@1f90cb6cb57c1df70f39cde77a5a8ccd98b66c56`

### GetPet 真正建立路徑

`npc_eventaction.c::NPC_ActionAddPet()` 對 `GetPet` 參數是 **EnemyID**，找到 `enemy1.txt` 對應列後直接：

```c
ret = ENEMY_createPetFromEnemyIndex(talker, i);
```

`enemy.c::ENEMY_createPetFromEnemyIndex()` 再從該 Enemy 的 `enemybase1.txt` template 建 CHAR_TYPEPET；不是只拿名稱／四圍手寫一隻寵。

固定函式明確會：

- 四項 base stat 各自 `RAND(0,4)-2`
- 將這四項存入 `CHAR_ALLOCPOINT`
- 再把 10 點逐點 `RAND(0,3)` 分到四項
- 用 `((level-1)*atoi(LVUPPOINT)+INITNUM) * stat` 建立 CHAR 能力
- 複製四屬性
- 複製六項異常抗性
- 複製 `PETSKILL1..7`
- 由原始 base stat 總和算 `CHAR_PETRANK`
- 後續升級走 `CHAR_PetLevelUp`

三個 reward Enemy 在 `enemy1.txt` 都是 Lv1～Lv1，因此初次取得等級仍固定 Lv1。

### fixed enemybase1 模板

TempNo 718 瑪蕾菲雅：

- INITNUM 20
- LVUPPOINT `5.00` → fixed loader / C 計算為 5
- base V/S/T/D = 25/25/25/25
- 地100 水0 火0 風0
- 抗性 = 10/10/10/50/10/10
- PetSkill = 1 攻擊、2 防禦、其餘 -1
- image = 100451
- PETRANK = 0（base sum 100）
- source LIMITLEVEL = 79

TempNo 730 布伊胖：

- INITNUM 27
- LVUPPOINT 原字串 `4.50`；`ENEMYTEMP_initEnemy()` 用 `atoi()` 載入，因此 server progression 實際值為 4
- 資料展示保留 raw growth 4.5
- base V/S/T/D = 34/29/25/23
- 地0 水0 火60 風40
- 六抗全 0
- PetSkill = 1 攻擊、2 防禦；空白欄因 loader 預設 -1，所以其餘五格 = -1
- image = 100825
- PETRANK = 0（base sum 111）

TempNo 854 動物園養的拉斯基：

- INITNUM 10
- LVUPPOINT = 4
- base V/S/T/D = 20/23/21/26
- 地0 水0 火60 風40
- 六抗全 0
- PetSkill = 1 攻擊、2 防禦，其餘 -1
- image = 100853
- PETRANK = 2（base sum 90）
- source LIMITLEVEL = 10

### 修正內容

V1.13 新增共用 `sourceCreateQuestGetPet()`：

- 三個任務獎勵不再各自手寫不完整 Pet object。
- 直接使用 fixed template 常數。
- 初次建立重新使用既有 `rollEnemyCreateStats()` / `serverEnemyDerived()`，與 Enemy create 的來源 RNG 相同。
- 寫入 `serverStats / serverCombat / allocPointPacked / petRank / serverProgression`。
- 後續升級因此真正能進既有 `serverPetLevelUp()`，不再只有 level 增加、能力不成長。

舊版三隻任務寵因沒有 server progression，V1.13 將 save schema 21 → 22，載入舊存檔時只做一次 source migration：

- 保留原本 level / exp。
- 重新依原 C 產生 Lv1 建立 RNG。
- 按目前 level 重播對應次數的 `CHAR_PetLevelUp` 等價成長。
- 保留現有 HP 數值，僅在新 maxHP 下 clamp，不自行猜 HP 比例。
- 補回 source skills / resist / elements / image / progression metadata。
- 只處理帶 quest reward 標記且 TempNo 為 718 / 730 / 854 的舊寵，不碰玩家正常捕獲的同 TempNo 物件。

瑪蕾菲雅的放置版回憶巡禮門檻仍維持既有 `levelCap=10 → 15 → … → 79` 流程；V1.13 只修底層 Pet 能力與升級，不改 Event 69/70/71/83 任務狀態機。

### V1.13 regression targets

- quest GetPet 730 / 854 / 718 都走共用 source builder
- PetSkill 皆為 `[1,2,-1,-1,-1,-1,-1]`
- 718 抗性 `[10,10,10,50,10,10]`
- 730 / 854 火60風40
- 718 image 100451
- 730 raw growth 4.5 + server LVUPPOINT 4 的 atoi 差異保留
- PETRANK：718=0、730=0、854=2
- quest pet server progression 可進 `serverPetLevelUp()`
- schema 22 one-time migration
- Marefia memory levelCap lifecycle 保留


## V1.14 captured Pet loyalty / VARIABLEAI lifecycle

V1.14 繼續沿用固定原 C：

`gavinlinasd/StoneAge@1f90cb6cb57c1df70f39cde77a5a8ccd98b66c56`

本輪不是新增自訂忠誠規則，而是把一般捕獲寵目前漏掉的原服務端 lifecycle 接回來。

### 1. PET_createPetFromCharaIndex 會複製原 Enemy 的寵物欄位

`gmsv/src/char/pet.c::PET_createPetFromCharaIndex()` 會把被捕獲 Enemy 的：

- VITAL / STR / TOUGH / DEX
- LUCK
- 四屬性
- SLOT / MODAI / LV
- 六種異常抗性
- RARE / PETRANK / PETID / CRITICAL / COUNTER
- PETSKILL1..7
- ALLOCPOINT

複製進新 Pet。

`char_base.h` 中 Pet alias 又明確定義：

- `CHAR_MODAI = CHAR_CHARM`
- `CHAR_VARIABLEAI = CHAR_LUCK`

fixed Enemy 預設 `CHAR_LUCK=0`，因此一般捕獲寵建立後 VariableAI 的來源初值為 0。

### 2. 捕獲成功後有效忠誠最高 60

`battle_event.c::BATTLE_Capture()` 在 `PET_createPetFromCharaIndex()` 成功後會：

1. 設 `CHAR_PETGETLV = 當下 Pet Lv`
2. `CHAR_complianceParameter(pindex)`
3. 強制 `CHAR_VARIABLEAI = 0`
4. 計算 `CHAR_DEFAULTMAXAI(60) - CHAR_WORKFIXAI`
5. 若結果 < 0，加入 `差值 * 100` 的負 VariableAI

所以如果捕獲當下原公式會算出 FIXAI 100：

- 差值 = 60 - 100 = -40
- VariableAI = -4000
- 最終有效 FIXAI = 60

如果原 FIXAI 本來只有 48，就不會補正，仍維持 48。

V1.14 新增 `sourceApplyCapturedPetInitialAi()`，只在**新捕獲**當下依目前玩家等級、魅力、Pet 等級與 source MODAI 做這個修正。

舊存檔不強制回推，因為舊資料沒有保存「當初捕獲時」的玩家等級與魅力；用現在狀態倒算會是假資料，違反「原 C 規則優先、不猜數值」。

新捕獲 Pet 同時保存 `petGetLv`，對應原 `CHAR_PETGETLV`。

### 3. 擊倒 Enemy 會增加 VariableAI

固定 `battle.c::BATTLE_AddExp()` 對有參戰並存活的 Pet，每一名被擊倒 Enemy 都會：

- Enemy Lv > Pet Lv：`AI_FIX_PETGOLDWIN = +20`
- 否則：`AI_FIX_PETWIN = +1`

VariableAI 的單位是百分之一，所以分別等於：

- +0.20 有效忠誠
- +0.01 有效忠誠

比較使用的是戰鬥獎勵處理當下的 Pet 等級；原版是先做每隻 Enemy 的獎勵，再處理 Pet 升級，因此 V1.14 對整場所有 Enemy 都使用**升級前 Pet Lv snapshot**。

### 4. 每升一級再 +5 忠誠

固定戰鬥結果流程：

```c
for (j = 0; j < UpLevel; j++) {
    CHAR_PetLevelUp(petindex);
    CHAR_PetAddVariableAi(petindex, AI_FIX_PETLEVELUP);
}
```

而：

```c
#define AI_FIX_PETLEVELUP (+5*100)
```

因此 V1.14 的 `awardActivePetExp()` 每升一級除了既有 `CHAR_PetLevelUp` 等價能力成長，也同步：

`VariableAI += 500`

即有效忠誠 +5。

這也適用於 Event reward Pet；`GetPet` 本身不套「捕獲上限 60」，但之後正常參戰／升級仍依相同 VariableAI lifecycle 成長。

### 5. Clamp

fixed `CHAR_PetAddVariableAi()`：

- 最大 `+100*100 = +10000`
- 最小 `-100*100 = -10000`

V1.14 的 `sourcePetAddVariableAi()` 完全使用同一範圍。

### 本輪刻意未擴充

來源另有玩家死亡、Pet 死亡、必殺飛出、復活、騎乘等 VariableAI 增減。

這些行為只有在對應 Web lifecycle 能完整對齊時才接；V1.14 先處理目前可完整證明且正常流程直接可達的：

- 捕獲
- 擊倒 Enemy
- Pet 升級

不為未完整建模的系統猜補效果。

### V1.14 regression targets

- new capture：先 VariableAI=0，再把 FIXAI >60 的部分壓到 60
- FIXAI <=60 的捕獲寵不被硬抬到 60
- capture petGetLv 保存
- 每 defeated Enemy：EnemyLv>PetLv => +20；否則 +1
- 多敵人戰逐隻累積
- victory AI 比較使用升級前 Pet Lv
- 每升 1 級 VariableAI +500
- VariableAI clamp -10000..10000
- quest GetPet 不套 capture 60 cap
- 舊存檔不以現在玩家狀態偽造歷史 capture offset


## V1.15 battle death loyalty / Marefia _PET_LIMITLEVEL

固定來源仍是 gavinlinasd/StoneAge@1f90cb6cb57c1df70f39cde77a5a8ccd98b66c56。

本輪對齊 battle.c 的 BATTLE_AddProfit、BATTLE_NormalDeadExtra 與 Pet_Check_Die。

### 死亡只處理一次

原 BATTLE_AddExpItem 每次只處理 HP <= 0 且 CHAR_ISDIE == FALSE 的 Battle Entry，然後立刻把 CHAR_ISDIE 設為 TRUE。因此同一隻角色即使被多段技能打到 0 HP，死亡 lifecycle 也只執行一次。

V1.15 新增每場 battlePetDeathProcessedIds，於 battle reset 時清空。

### 一般 Pet 戰鬥死亡

AI_FIX_PETDEAD = -5*100。

- 玩家 Lv1～10：VariableAI -250，也就是有效忠誠 -2.5
- 玩家 Lv11+：VariableAI -500，也就是有效忠誠 -5

### 玩家戰鬥死亡

CH_FIX_PLAYERDEAD = -2，AI_FIX_PLAYERDEAD = -1*100，玩家 Lv<=10 時兩者除以 2。

- Lv1～10：魅力 -1；當前出戰寵 VariableAI -50
- Lv11+：魅力 -2；當前出戰寵 VariableAI -100

CHAR_AddCharm 的原範圍是 0～100，V1.15 同樣 clamp。

如果同一場 Pet 先倒下、玩家之後也倒下，兩種效果依原 C 疊加。

### Marefia 718 的 _PET_LIMITLEVEL

固定 version.h 明確開啟 _PET_LIMITLEVEL。

Pet_Check_Die 對 TempNo 718：
- 從 CHAR_ALLOCPOINT 解四個 byte
- VITAL 扣 RAND(1,8)
- STR / TOUGH / DEX 各扣 RAND(1,4)
- 四項各 clamp 0～50
- 重新 pack 回 ALLOCPOINT
- MODAI 減少 5%，寫回 int 時截斷

這裡改的是未來成長使用的 ALLOCPOINT，不是直接倒扣目前已生成的 VITAL/STR/TOUGH/DEX。因此 Web 只更新 allocPointPacked；serverStats 不倒退。

MODAI 是 Pet instance 可變欄位，因此 V1.15 新增 modAiOverride；petSourceModAi 先讀 override，再退回 TempNo 原始表。

同一次 Marefia 死亡順序保持原 C：
1. Pet_Check_Die 的 ALLOCPOINT / MODAI
2. BATTLE_NormalDeadExtra 的一般 Pet VariableAI 死亡扣減

### Regression targets

- battle reset 清空 death processed set
- 同一 Pet HP 歸零只處理一次
- Pet death：Lv<=10 -250；Lv11+ -500
- Player death：Lv<=10 charm -1 / active Pet -50；Lv11+ charm -2 / active Pet -100
- charm clamp 0～100
- Marefia VITAL RAND(1,8)
- Marefia STR/TGH/DEX RAND(1,4)
- Marefia ALLOCPOINT clamp 0～50
- Marefia MODAI 每次死亡衰減 5% 並 int 截斷
- pending Pet death 在 win / defeat early-return 前仍會被處理


## V1.16 owner attacks own Pet / AI_FIX_SEKKAN

固定來源：

gavinlinasd/StoneAge@1f90cb6cb57c1df70f39cde77a5a8ccd98b66c56

本輪對齊 battle_event.c 的 BATTLE_AttackSeq。

原 C 在真正做 DuckCheck、CriticalCheck、DamageCalc 之前先判斷：

- defender 是 CHAR_TYPEPET
- battle norisk == 0
- battle type == BATTLE_TYPE_P_vs_E
- Pet 的 CHAR_WORKPLAYERINDEX == attackindex

成立時直接：

CHAR_PetAddVariableAi(defindex, AI_FIX_SEKKAN)

而 battle.h 定義：

AI_FIX_SEKKAN = -2*100

所以主人每一次物理攻擊自己的 Pet，都會讓 VariableAI -200，也就是有效忠誠 -2。

### V1.16 對應目前 Web 可達路徑

目前玩家正常指令只攻擊敵方；但混亂 BATTLE_StatusSeq 已能把玩家改成普通攻擊己方 Pet。

另外混亂 Counter chain 也可能讓玩家在反擊階段再次攻擊自己的 Pet。

V1.16 因此把 source penalty 放進共用 battleApplyPhysicalHit 的 player -> pet 路徑。

順序刻意在 dodged / miss 判斷之前，對齊 BATTLE_AttackSeq：

1. owner/pet relationship check
2. AI_FIX_SEKKAN -200
3. DuckCheck
4. critical / damage
5. DamageSub

因此：

- Pet 閃避仍會扣忠誠
- 物理結果 MISS 仍會扣忠誠
- 每一次 Counter owner -> pet 都各自再扣一次
- Pet -> owner 不會反向套這個規則

VariableAI 仍沿用 V1.14 的 -10000..10000 source clamp。

### Regression targets

- player -> own pet primary confusion attack => VariableAI -200
- player -> own pet counter => VariableAI -200 per AttackSeq
- dodge still applies -200
- miss still applies -200
- pet -> player does not apply AI_FIX_SEKKAN
- enemy -> player/pet does not apply AI_FIX_SEKKAN
- clamp continues through sourcePetAddVariableAi


## V1.17 persist BATTLE_LostEscape default-pet rest state

固定來源仍是 gavinlinasd/StoneAge@1f90cb6cb57c1df70f39cde77a5a8ccd98b66c56。

原 battle_event.c::BATTLE_LostEscape 在低忠誠 Pet 逃跑時：

- BATTLE_Exit(pet, battleindex)
- CHAR_setInt(owner, CHAR_DEFAULTPET, -1)
- CHAR_AddCharm(owner, CH_FIX_PETESCAPE)

目前 Web 的即時戰鬥流程早已做到：

- battlePetOutIds.add(pet.id)
- activePetId = null
- charm -1
- Pet 本身仍留在 petBox / team

但 normalizeState 以前只要看到 activePetId 為 null，就會在 reload 時把 team 第一隻自動指定成 activePetId，等於把原 CHAR_DEFAULTPET=-1 狀態消掉。

V1.17 改成：

- 如果舊存檔根本沒有 activePetId 欄位，才做 legacy 自動補選
- 如果現行存檔明確保存 activePetId:null，就保留 null
- 如果舊存檔根本沒有 team 欄位，才自動把第一隻 Pet 放入 team
- 現行存檔若明確保存空 team，不再偷偷補第一隻

因此低忠誠逃跑後，即使重新整理頁面，該 Pet 仍只是留在持有欄／隊伍欄，不會自動重新變成出戰 Pet；玩家必須自己再次選「設為出戰」。

### Regression targets

- current save activePetId:null + team has Pet => reload keeps null
- legacy save missing activePetId + team has Pet => first team Pet may still auto-select
- current save explicit empty team + petBox nonempty => reload keeps empty team
- legacy save missing team + petBox nonempty => first Pet migrates into team
- BATTLE_LostEscape current flow still charm -1 and battle exit


## V1.18 Ultimate / knock-away death lifecycle

固定來源：gavinlinasd/StoneAge@1f90cb6cb57c1df70f39cde77a5a8ccd98b66c56。

本輪對齊 BATTLE_DamageSub / DamageSub2 / Attack / Counter / Combo 與 BATTLE_UltimateExtra。

原 DamageSub：
- 單次 damage >= MAXHP * 1.2 + 20 => Ultimate type 2
- 否則只有 HP 打成負值的 overkill addpoint 累積到 CHAR_WORKULTIMATE
- 累積 addpoint >= 同門檻 => type 1
- Ultimate 成立後 WORKULTIMATE 清 0

BATTLE_Attack / Counter 對死亡的非 PLAYER 目標，若本擊 critical，另做嚴格 RAND(1,100)<50；成功值 1..49，會把 ultimate 指定成 type 1，連原本 type 2 都可能被覆寫成 1。 BATTLE_Combo 的同類判定更窄，只在死亡目標是 CHAR_TYPEENEMY 時做，因此 V1.18 的 Combo tracker 使用 enemy-only critical 模式。

V1.18 用 battleUltimateWork / battleUltimateFlags 重建 battle-local WORKULTIMATE / BENT_FLG_ULTIMATE。

固定 _PETSKILL_LER 只以 CHAR_BASEBASEIMAGENUMBER 101813/101814 禁止打飛。Web 現有資料通常只有 animationGroupId，因此不從 TempNo 或名稱猜；只有物件真的提供 exact baseBase image 欄位時才套例外。

Ultimate Player：
- Lv1～10：魅力 -2、DEFAULTPET VariableAI -500
- Lv11+：魅力 -4、DEFAULTPET VariableAI -1000

Ultimate Pet：
- owner Lv1～10：VariableAI -500
- owner Lv11+：VariableAI -1000
- DEFAULTPET=-1 等價為 activePetId=null
- 本場 BATTLE_Exit 等價為 battlePetOutIds

普通死亡與 UltimateExtra 互斥。Marefia 718 的 Pet_Check_Die 在原流程先於兩個死亡分支，所以被打飛時仍先套 ALLOCPOINT / MODAI 死亡懲罰。

已接入目前可明確對應 DamageSub / DamageSub2 的普通物理、Counter、Guardian 代擋、Bow/Boomerang/BoundThrow/BreakThrow、混亂物理、已接 Enemy 物理 PetSkill，以及 Combo aggregate damage。純 attack magic／直接 HP 傷害不套 Ultimate。

Regression：
- damage >= maxHp*1.2+20 => type2
- overkill 才累積 WORKULTIMATE
- non-player lethal critical strict <50
- player critical 不做該 50% roll
- Ultimate Pet -1000 / low-level -500 + activePetId=null
- Ultimate Player charm -4 / low-level -2；Pet -1000 / low-level -500
- normal death仍保留 V1.15 數值
- battle reset 清空 Ultimate work/flags


## V1.19 BATTLE_AddExpItem kill-credit

固定來源：gavinlinasd/StoneAge@1f90cb6cb57c1df70f39cde77a5a8ccd98b66c56。

BATTLE_AddExpItem 不會在整場勝利後把每隻 Enemy EXP 平均或共享給所有出戰者。它在每次 BATTLE_AddProfit 被呼叫時掃描「HP<=0 且 ISDIE==FALSE」的 Enemy，然後只對這一次傳入的 pBidList 累加 CHAR_WORKGETEXP。

普通攻擊／Counter 的 pBidList 通常只有目前攻擊者；Combo 的 pAttackList 則可以同時包含玩家與 Pet，因此 Combo 成員各自取得完整的該 Enemy EXP。

同一段程式裡 AI_FIX_PETWIN / AI_FIX_PETGOLDWIN 也只對 pBidList 中 CHAR_TYPEPET 的成員執行。因此 V1.14 先前「只要 Pet 出戰，整場每隻死怪都增加忠誠」過寬。

V1.19 新增 Enemy death credit：
- Enemy 第一次 HP 歸 0 時固定 sourceRewardProcessed
- 記錄當次 player-side attack list 到 sourceRewardCredits
- Pet credit 在死亡當下立即執行 AI_FIX_PETWIN / PETGOLDWIN
- 後續 battle finish 不再補整場 Pet win AI
- Enemy 自己因 poison/status 或 enemy-side confusion 死亡時沒有 player-side credit，不補 EXP／掉落

一般 source-resolved encounter：
- 玩家只取得自己在 death pBidList 中的 Enemy EXP
- Pet 只取得自己在 death pBidList 中的 Enemy EXP
- Combo 中玩家＋Pet 都在 attack list 時兩者各拿完整 EXP
- Pet 若之後死亡，原 battle result 會因 CHAR_ISDIE 跳過 Pet EXP；Web 同樣不發
- Pet 若只是 LostEscape 而仍存活，原 CHAR_WORKGETEXP 仍可在結算時領取；Web 改用 petId credit，因此不要求 activePetId 仍存在

掉落也沿用 BATTLE_AddExpItem 的 proflg：
- 只有 sourceRewardPlayerSide=true 的死 Enemy 進戰利品池
- enemy-side 自滅不產生玩家戰利品
- 既有全場最多 3 格 getitem 等價池仍保留

手工任務編成目前缺少可信的逐 Enemy 原始 EXP，因此 V1.19 不把 fallbackBattleExp 硬拆成猜測值；這些戰鬥暫時維持原本明確標示的 fallback EXP。Pet 勝利忠誠仍依真實 kill-credit 即時處理。

Regression：
- player kill => player source EXP only
- Pet kill => Pet source EXP only + immediate AI_FIX_PETWIN/GOLDWIN
- player+Pet Combo kill => both get full source EXP
- enemy-side self/status death => no source EXP/drop
- Pet death after earlier kill => AI already retained, but Pet EXP skipped
- LostEscape after earlier kill => alive Pet may still receive accumulated EXP
- source-resolved drop pool only contains player-side credited Enemy
- fallback quest EXP remains explicit fallback, no invented per-unit values


## V1.20 source-timed getitem[3] carried-loot pool

固定來源：gavinlinasd/StoneAge@1f90cb6cb57c1df70f39cde77a5a8ccd98b66c56。

V1.19 已把 Enemy reward ownership 改回死亡當下的 pBidList。V1.20 繼續把 BATTLE_AddExpItem 中 carried item 的 getitem 時序接回來。

Enemy ENEMY_ITEM1..10 / ITEMPROB1..10 是否生成 existing item，仍在 Enemy 建立時決定；V1.20 不改這個既有來源規則。

真正 Enemy 死亡且 proflg==1、玩家側 pBidList 有效時，原碼對每一個 Enemy carried item 依序：

1. CHAR_setItemIndex(enemy,item,-1)
2. k = RAND(0, allnum-1)
3. 嘗試放入 pEntryPlayer[k]->getitem[0..2] 第一個空格
4. 若 3 格已滿：
   - RAND(0,1) 為真：RAND(0,2) 選一格替換，舊 item existing index 釋放
   - 否則：新 item existing index 直接釋放

本專案是單玩家模型；玩家與自己的 Pet 在原 pEntryPlayer 對映都回到同一個玩家 Entry，所以實際只有一個 3 格池。但 k = RAND(0,allnum-1) 仍會消耗原始 RNG：
- 普通 player / Pet kill：allnum=1，仍會呼叫一次 RAND(0,0)
- Player + Pet Combo kill：allnum=2，會呼叫 RAND(0,1)，即使最後仍落到同一玩家池

V1.20 新增 battleGetItemPool，並在 sourceMarkEnemyDeathCredit 內、Pet win AI 之前立即執行 sourceQueueEnemyCarriedLoot。這保持原 BATTLE_AddExpItem 的 statement order：getitem -> EXP/kill count -> Pet AI。

勝利結算時 rollVerifiedDrops 不再重新跑 carried-item reservoir RNG，只取 sourceTakeBattleGetItemPool 中已經決定留下的最多 3 件 existing item，再轉成 player ownership。

敗北／捕獲／逃離／無獎勵清場等沒有把 getitem 移入玩家背包的情況，resetBattleStatuses 會以 sourceDiscardBattleGetItemPool 釋放暫存 existing item，對應 BATTLE_DeleteItem。

原 BATTLE_GetExpGold 也確認：只有 CHAR_ISDIE==FALSE 的玩家才會把 pEntryChara->getitem 移進正式背包；玩家死亡時不領取，稍後 DeleteItem 清掉。因此 Web 戰敗不保留先前暫存 getitem 是來源一致行為。

手工 questDrop / conditionItems 的非 server carried-loot fallback 仍維持既有邏輯；V1.20 只改有 existing-index 證據的 Enemy carried item，不替任務 fallback 猜來源時序。

Regression：
- source carried loot reservoir RNG happens at enemy death, not win
- every carried item consumes owner RAND(0, allnum-1), including allnum=1
- first three items fill getitem[0..2] in order
- full pool uses RAND(0,1), then optional RAND(0,2) replacement
- replaced/rejected existing item index is immediately freed
- win takes pool without rerolling reservoir
- defeat/no-reward reset frees unclaimed battle-getitem indices
- player/pet Combo uses allnum=2 RNG while still mapping to one owner pool
- source getitem handling remains before Pet win AI


## V1.21 Marefia CHAR_CheckPetDoLimitlevel / batch level-up order

固定來源仍為 gavinlinasd/StoneAge@1f90cb6cb57c1df70f39cde77a5a8ccd98b66c56。

本輪繼續沿 BATTLE_GetExpGold → CHAR_LevelUpCheck 往下補 Pet 升級 lifecycle。

### 原始順序

BATTLE_GetExpGold 對有 WORKGETEXP 的 Pet：

1. BATTLE_GetExp(pet)
2. UpLevel = CHAR_LevelUpCheck(pet, owner)
3. 若 UpLevel > 0：
   - for(j=0; j<UpLevel; j++)
   - CHAR_PetLevelUp(pet)
   - CHAR_PetAddVariableAi(pet, AI_FIX_PETLEVELUP)

也就是「先一次算完整個 UpLevel，再做 UpLevel 次成長」，不是每升一級就立刻插一個 CHAR_PetLevelUp。

一般 Pet 這兩種寫法目前核心四圍結果等價；718 的 _PET_LIMITLEVEL 特殊規則則不等價。

### CHAR_CheckPetDoLimitlevel

fixed version.h 已開啟 _PET_LIMITLEVEL。

CHAR_LevelUpCheck 每次準備從目前 level 升到下一級前，對 Pet 呼叫：

CHAR_CheckPetDoLimitlevel(petindex, owner, level)

TempNo 718 瑪蕾菲雅在：

current level % 20 == 0

時會：

- 連續 3 次 RAND(0,3)
- 0 => VITAL -1
- 1 => STR -1
- 2 => TOUGH -1
- 3 => DEX -1
- 每項下限 0
- pack 回 CHAR_ALLOCPOINT

因此實際發生在：

- Lv20 → 21 前
- Lv40 → 41 前
- Lv60 → 61 前

來源 LIMITLEVEL=79，所以正常任務路徑不會進到 Lv80 → 81。

### RNG / 多級順序

這 3 次 RAND 發生在 CHAR_LevelUpCheck 內，而所有 CHAR_PetLevelUp 的 10 次 Param 分配 RNG + PETRANK growth RNG 都在 LevelUpCheck 完成後才開始。

因此若一場戰鬥讓瑪蕾菲雅一次從 Lv19 升到 Lv22：

- 先判 19→20
- 判 20→21 時先扣 3 次 ALLOCPOINT
- 再判 21→22
- 最後才用「已扣過的 ALLOCPOINT」連續跑 3 次 CHAR_PetLevelUp

V1.21 把 awardPetExp 改成同一順序，避免舊 Web 的「先做一次成長、再遇到 20 級門檻」造成 RNG 與能力值錯位。

### 放置版回憶 levelCap 保留

瑪蕾菲雅既有 Lv10 / 15 / 20 / 25 / ... / 75 / 79 回憶巡禮是依 ptalk01.arg EVENTRUN 節點做的可玩流程控制；V1.21 不取消這些關卡。

所以只有在回憶已解鎖到可跨過 20 / 40 / 60 時，才會觸發 source 的 level%20 成長底值衰減。

### Owner mismatch 分支暫不接

CHAR_CheckPetDoLimitlevel 另有「Pet owner 與目前帶領玩家不同」時四圍各 RAND(2,10) 扣減的分支。

目前純單機 Web 沒有寵物交易／轉手，也沒有第二玩家 owner identity 可達，因此 V1.21 不創造假的 owner mismatch；等對應系統真的存在時再接。

### 舊存檔

V1.21 不對已經跨過 20/40/60 的舊瑪蕾菲雅補抽歷史 RNG。

原因是舊存檔沒有保存當時的 rand sequence，也可能已經發生過 V1.15 的死亡 ALLOCPOINT 懲罰；現在硬補會改變原本應有的 RNG 時序與 clamp 順序。

只從 V1.21 之後「實際發生的新 level transition」按 source 規則處理，不猜歷史數值。

### Regression targets

- non-718 Pet：UpLevel batch order 不新增 limit penalty
- 718 current level 20 / 40 / 60：升下一級前恰好 3 次 RAND(0,3)
- 718 current level 10/15/25/...：不觸發 level%20 penalty
- penalty 先改 allocPointPacked，之後才跑全部 UpLevel 次 serverPetLevelUp
- 每次真正升級仍 AI_FIX_PETLEVELUP +500
- 一次連升多級時所有 PetLevelUp 都在 LevelUpCheck phase 完成後執行
- 現有 memory levelCap 流程保留
- owner-mismatch 不在不可達的單機模型中猜實作


## V1.22 _BATTLE_Exit owned Pet HP=1 recovery

固定來源仍為 gavinlinasd/StoneAge@1f90cb6cb57c1df70f39cde77a5a8ccd98b66c56。

本輪沿 BATTLE_Finish → BATTLE_GetProfit → BATTLE_Exit 繼續補最終戰鬥離場 lifecycle。

### 原始 Player BATTLE_Exit

fixed _BATTLE_Exit() 在處理 CHAR_TYPEPLAYER 時，會再掃玩家全部 CHAR_MAXPETHAVE Pet slot。

對每一隻持有 Pet：

- 若 CHAR_ISDIE == TRUE，或
- CHAR_HP <= 0

就：

- CHAR_ISDIE = FALSE
- CHAR_HP = 1

接著清 Battle mode / battle index / battle bad status 並重新 compliance。

因此「寵物在戰鬥中倒下」不是永久保留 0 HP；玩家真正離開整場戰鬥時，倒下寵會回到 **HP 1**。

### 順序非常重要

BATTLE_Finish 對每個 Battle Entry：

1. BATTLE_GetProfit / BATTLE_GetExpGold
2. BATTLE_Exit

而 BATTLE_GetExpGold 在掃持有 Pet 時先：

- CHAR_ISDIE == TRUE => continue

所以死亡寵在本場：

- **先拿不到 EXP**
- 之後 Player BATTLE_Exit 才回復到 HP 1

V1.22 保留這個順序：winBattle 先完成 V1.19 的 Pet EXP 判定，再做 sourceFinalizeOwnedPetsBattleExit。

### 全部持有寵，不只 active/team

原碼掃的是 CHAR_MAXPETHAVE，不只 DEFAULTPET。

V1.22 因此遍歷完整 state.petBox：

- active Pet
- team 內其他 Pet
- 未放入 team 的持有 Pet

只要 HP<=0，在整場離場時都改成 HP 1。

### 中途 BATTLE_Exit 不立即復活

下列流程只是單隻 Pet 在戰鬥中離場，不是玩家整場離場：

- BATTLE_LostEscape 低忠誠逃跑
- BATTLE_UltimateExtra Pet 被打飛

V1.22 不在這兩條 mid-battle 路徑直接回 HP。

如果被打飛 Pet 的 HP 已是 0，它會保持 0 到整場戰鬥真正 teardown；此時才由 Player BATTLE_Exit 等價 cleanup 回到 1。

### activePetId 不自動恢復

BATTLE_Exit 的 HP=1 掃描不會替 owner 重新設定 CHAR_DEFAULTPET。

因此 V1.17 / V1.18 的語意保留：

- LostEscape / Ultimate Pet 可把 activePetId 設成 null
- 整場結束把 Pet HP 從 0 改成 1
- **不會因此自動把 activePetId 指回該 Pet**
- reload 仍保留 explicit null

### Web 的整場 teardown

V1.22 在以下整場結束路徑做同一個 final cleanup：

- 勝利 winBattle
- 戰敗 defeat
- 捕獲使整場結束
- 敵方全逃／最後成員直接離場
- UI 切換地圖／任務區時若當下仍有 battle，clearEnemyBattleNoReward

clearEnemyBattleNoReward 只有 hadBattle=true 才跑 cleanup；單純沒戰鬥時切地圖不會碰 Pet HP。

### 玩家本人的 defeat full-heal

目前放置版 defeat() 仍保留既有「回村後玩家 HP/MP 補滿」的遊戲便利規則。

fixed _BATTLE_Exit 對玩家自身死亡的 HP 處理不是本輪範圍；V1.22 只修明確缺漏且會影響持有寵後續可用性的 Pet HP=1 lifecycle，不順手改玩家回村設計。

### Regression targets

- Pet HP=0 at win: no Pet EXP, then final exit => HP 1
- Pet HP=0 at defeat: death/loyalty penalty first, then HP 1
- all owned Pet slots are scanned, not only active/team
- alive Pet HP remains unchanged
- LostEscape does not heal mid-battle
- Ultimate Pet does not heal mid-battle
- after final exit, activePetId explicit null stays null
- capture / enemy escape / direct exit full teardown also runs cleanup
- clearEnemyBattleNoReward with no active enemy does not mutate Pet HP


## V1.23 BecomePig battle-exit lifecycle

固定來源仍為 gavinlinasd/StoneAge@1f90cb6cb57c1df70f39cde77a5a8ccd98b66c56。

本輪延續 V1.22 的 _BATTLE_Exit 稽核，修正 _PETSKILL_BECOMEPIG（黑烏力化）的最終離場語意。

### net.c 每秒倒數

fixed CONNECT_SysEvent_Loop 每秒檢查 CHAR_BECOMEPIG > -1：

- 剩餘值 - 1 > 0：減 1
- 剩餘值 - 1 <= 0：先設 CHAR_BECOMEPIG = 0
- 只有 WORKBATTLEMODE == BATTLE_CHARMODE_NONE 時，才再設成 -1、compliance 並顯示失效

因此倒數在戰鬥中到 0 時，狀態仍保留到戰鬥離場。現有 playerPigActive(enemy exists => expired timer still active) 保留。

### _BATTLE_Exit 強制復原

fixed _BATTLE_Exit 在 _PETSKILL_BECOMEPIG 開啟時：

- CHAR_BECOMEPIG > -1
- 且角色為 PLAYER

就立刻恢復 BECOMEPIG_BBI 外觀並 CHAR_complianceParameter；不檢查剩餘秒數。

所以即使還剩 150 秒，只要整場 battle exit，就立即解除。

### V1.23

新增 sourceFinalizePlayerBattleExit：

1. 先執行 V1.22 的全部持有死亡 Pet HP=1 cleanup
2. 若 playerPigUntilMs > 0，整場離場時立即清為 0

完整 Player battle teardown 改走此 helper：

- winBattle
- defeat
- clearEnemyBattleNoReward（捕獲結束、敵方全逃／直接離場、切地圖中止整場）

Pet 自己 LostEscape / Ultimate mid-battle 不觸發 Player BecomePig cleanup。

### Regression

- pig timer positive + win => immediately clear
- pig timer positive + defeat => immediately clear
- pig timer positive + capture/enemy escape full teardown => clear
- timer expires while battle continues => remains pig until exit
- Pet LostEscape / Ultimate mid-battle => does not clear player pig
- V1.22 dead-Pet HP=1 cleanup remains


## V1.24 BecomeFox / ENEMY_PETFLG core lifecycle

固定來源仍為 gavinlinasd/StoneAge@1f90cb6cb57c1df70f39cde77a5a8ccd98b66c56。

本輪接回 _PETSKILL_BECOMEFOX（PetSkill 625 媚惑術）的可達核心，不猜 PETFLG。

### ENEMY_PETFLG

fixed version.h 開啟 _BATTLENPC_WARP_PLAYER，因此 enemy.c 的 ENEMY_STARTINTNUM=4。
依 enemy.h 的 ENEMY_DATAINT 排序，ENEMY_PETFLG 對應 enemy1.txt 第 14 欄（1-based）。

從固定 commit 的 gmsv/data/enemy1.txt 解析：

- 2,958 個 EnemyID
- 0 個同 ID PETFLG 衝突
- 現行 encounter runtime 使用的 818 個 EnemyID 全部有對應值
- 其中 567 個 PETFLG != 0

結果寫入 stoneage_general_encounter_runtime.json 的 enemyPetFlg；makeEnemyUnit 只按最終 resolved EnemyID 查表，缺值回 null，不猜 0/1。

### 命中後判定

fixed battle.c 的順序是：

1. 先完成普通 BATTLE_Attack
2. 完成 Counter chain
3. 原始 defNo 仍存活
4. primary attack 不是 MISS / DODGE / ALLGUARD / ARRANGE
5. 先執行 rand()%100 < 31
6. target 不是 PLAYER
7. target CHAR_WORK_PETFLG != 0
8. caster 沒有 BECOMEPIG

Enemy 對玩家／玩家持有 Pet 的附加條件仍不可達；真正可達的是玩家出戰 Pet 在低忠誠 random-act 抽到 skill 625 後攻擊 Enemy。

V1.24 新增 sourcePerformPetBecomeFoxSkill，保留普通物理攻擊 + Counter，再按上述順序做變狐判定。PETFLG=0 時仍先消耗 31% roll，維持原 RNG 時序。

### WORKFOXROUND / battle turn

fixed pBattle->turn 每個 BATTLE_Command round 在 AI 前 +1。

V1.24 為每場 battle 加入 sourceBattleTurn，normalBattleOrder 每輪 +1；成功變狐時把當下 turn 寫到 sourceFoxTurn。

Enemy 自己進 StatusSeq 時：

- currentTurn - sourceFoxTurn <= 2：保持
- currentTurn - sourceFoxTurn > 2：解除

因此 T / T+1 / T+2 仍有效，T+3 的該 Enemy StatusSeq 恢復。

### 能力與指令

變狐有效時，依 fixed battle.c：

- WORKATTACKPOWER = WORKFIXSTR * 0.8
- WORKDEFENCEPOWER = WORKFIXTOUGH * 0.8
- WORKQUICK = WORKFIXDEX * 0.8
- int 寫回直接截斷

AI / PetSkill 仍先在 PreCommand 選好；到該 Enemy 真正執行自己的 action 時，只有 ATTACK / GUARD / NONE 保留，其餘特殊 command 改成 NONE。

### Regression targets

- game.js syntax PASS
- enemy1 PETFLG 2,958 IDs / 0 conflicts
- current runtime 818/818 EnemyID 有 PETFLG
- primary MISS / DODGE / ALLGUARD / ARRANGE 不 roll
- primary hit + target alive：PETFLG=0 仍消耗 roll，但不變狐
- PETFLG!=0 + roll 0..30 成功；31..99 失敗
- Counter 後 caster Pet 即使倒下，只要原始 target 仍活著仍可完成判定
- T / T+1 / T+2 active；T+3 StatusSeq recovery
- active fox：FIX attack / defense / quick 各 80% int truncate
- active fox：特殊 command -> NONE；ATTACK / GUARD / NONE 保留
- V1.18 Ultimate / death branch regression 不回退


## V1.25 BecomeFox ranged-weapon mixed semantics

固定來源仍為 gavinlinasd/StoneAge@1f90cb6cb57c1df70f39cde77a5a8ccd98b66c56。

V1.24 已接回 WORKFOXROUND 核心；V1.25 補齊 battle.c 中「實際裝備」與 battle loop global gWeponType 分離造成的遠距武器特殊行為。

### Source order

角色進 BATTLE_Battling 後：

1. gWeponType = BATTLE_GetWepon(charaindex)
2. 若 WORKFOXROUND != -1 或圖號 101749，gWeponType 強制改成 ITEM_FIST
3. attack_max = BATTLE_GetAttackCount(charaindex)
4. BATTLE_GetAttackCount 仍直接讀 CHAR_ARM 的 ITEM_ATTACKNUM_MIN/MAX
5. 若 attack_max > 0 且 global gWeponType == FIST，gDamageDiv = attack_max
6. BREAKTHROW 麻痺只在 global gWeponType == ITEM_BREAKTHROW 時啟用，因此 fox 狀態不啟用
7. BATTLE_TargetListSet 再次直接呼叫 BATTLE_GetWepon(charaindex)，並不讀 global gWeponType

這造成一個刻意保留的混合狀態：外層像拳頭，但部分底層仍看真正裝備。

### Current reachable weapon data

目前 stoneage_enemy_weapon_runtime 的來源武器：

- AXE：AttackNum 1
- CLUB：AttackNum 1
- SPEAR：來源 0，BATTLE_GetAttackCount 會修正為 1
- BOW 400：AttackNum 1..3
- BOW 2498：AttackNum 3..5
- BOOMERANG：AttackNum 1
- BOUNDTHROW：AttackNum 1
- BREAKTHROW：AttackNum 1

因此現行真正會因 fox + AttackNum 產生多段差異的是 Bow；其他遠距仍需要取消其專用 command / status 語意。

### Fox + actual Bow

固定原 C 的 RNG / target 順序：

1. 先 RAND(actual ITEM_ATTACKNUM_MIN, MAX)
2. 再由 BATTLE_TargetListSet 因「實際裝備是 Bow」做 RAND(0,1)，生成 aBowW 10 格序列
3. 真正執行時 global gWeponType 已是 FIST，因此第一擊不是用 aDefList[0]，而是對原 COM2 做 BATTLE_TargetAdjust
4. 第一擊後 k 由 0 變 1，才開始讀 aDefList[1]、[2]...
5. 每個候選格若無效，BATTLE_TargetAdjust 會呼叫 BATTLE_DefaultAttacker，從對方存活 Entry 均勻 RAND 一名
6. 每次正傷害在 BATTLE_Attack() 尾端除以 attack_max，最低 1
7. 動作封包分支是 BH / FIST，不是 BB-w0

V1.25 以 sourceFoxTargetAdjust / sourceFoxDefaultPlayerSideTarget 保留這個空格重抽行為，不把 bow list 的空格直接 skip。

### Which rules still use the actual equipped item

即使 fox 強制 global gWeponType=FIST，下列來源仍重新讀實際 CHAR_ARM：

- BATTLE_GetAttackCount
- BATTLE_TargetListSet 的 Bow 判定
- BATTLE_GuardianCheck 的 BATTLE_IsThrowWepon
- BATTLE_CounterCheckPlayer/Pet 的 BATTLE_IsThrowWepon
- BATTLE_CriticalCheckPlayer 的 ITEM_CRITICAL
- BATTLE_AttackSeq critical damage 內的 local gWeponType = BATTLE_GetWepon()

因此 V1.25 不修改 unit.weaponType / throwWeapon 本體，而是只把 BATTLE_DuckCheck 對應的 outer weapon type 覆寫為 FIST。

特別是 actual Bow：
- global gWeponType 已不是 Bow，所以 BATTLE_DuckCheck 不再吃原 Bow 的 +20 / +20 回避加成
- critical damage 仍因 local BATTLE_GetWepon()==Bow 而不加 CriDamageCalc 的額外防禦傷害
- Guardian / Counter 仍因實際遠距武器而被阻止

### Other actual ranged weapons

- Boomerang：不再把 ATTACK 轉成 BATTLE_COM_BOOMERANG，不走 30% 橫掃；改走 FIST/BH 單目標
- BoundThrow：改走 FIST/BH；現行 AttackNum=1
- BreakThrow：改走 FIST/BH，且不建立 paralysis；現行 AttackNum=1

### Regression targets

- game.js syntax PASS
- fox gate：ATTACK forceFist=true；GUARD/NONE 不阻擋也不 force
- normal non-fox ranged behavior完全不變
- fox + Bow：AttackNum RNG 在 Bow target-list RNG 之前
- fox + Bow：第一擊使用原 COM2；後續從 aDefList[1] 開始
- bow list 空／死格走 BATTLE_DefaultAttacker uniform fallback，而不是 skip
- fox + Bow：sourceOuterWeaponType=FIST，所以 DuckCheck 不加 Bow +40%
- actual Bow critical 判定／critical damage仍讀 actual weaponType=4
- fox + Boomerang 不走 BOOMERANG 30% 橫掃
- fox + BreakThrow 不做 paralysis
- V1.24 BecomeFox lifecycle / 31% RNG regression 不回退
- V1.18 Ultimate / death branch regression 不回退


## V1.26 Player creation elements / no guessed NONE attribute

固定來源仍為 gavinlinasd/StoneAge@1f90cb6cb57c1df70f39cde77a5a8ccd98b66c56。

V1.25 以前沒有保存玩家創角時的 CHAR_EARTHAT / WATERAT / FIREAT / WINDAT。
舊 web 的 battleBaseElements() 對缺值會回空 object，後續 BATTLE_GetAttr 等價成 none=100。
這個 fallback 雖可讓戰鬥繼續，但不是固定原 C 能證明的玩家創角值。

V1.26 移除這個猜值：舊存檔元素保持 unknown，直到玩家自己依原創角規則確認。

### Fixed CHAR_makeCharFromOptionAtCreate rules

原 gmsv/src/char/char.c：

- earth / water / fire / wind 每項必須 0..10
- 四項總和必須剛好 10
- 非 0 屬性最多兩種
- Earth + Fire 禁止
- Water + Wind 禁止
- 寫入角色時各自乘 10：
  - CHAR_EARTHAT = earth * 10
  - CHAR_WATERAT = water * 10
  - CHAR_FIREAT = fire * 10
  - CHAR_WINDAT = wind * 10

因此合法例子包含：
- 10/0/0/0 => Earth 100
- 5/5/0/0 => Earth 50 / Water 50
- 0/5/5/0 => Water 50 / Fire 50
- 0/0/5/5 => Fire 50 / Wind 50
- 5/0/0/5 => Earth 50 / Wind 50

而 5/0/5/0、0/5/0/5、三屬並存、總和不是 10 都是原 C invalid。

### Save migration

save schema 22 -> 23。

對 schema < 23：
- elements = null
- playerElementsConfigured = false
- 不從等級、能力值、寵物、地圖或既有戰鬥倒推元素

V1.26 確認成功後才持久化：
- playerElementsConfigured = true
- elements 使用原 CHAR 百分值 0..100

確認後 UI 永久鎖定，不提供免費重配，對齊「創角 option」而不是一般能力點。

### Battle gate

玩家元素未設定時：
- 自動遇敵 / 戰鬥 tick 等待
- UI 明確顯示「等待元素配點」
- 不再把 unknown player element 偷換成 none=100

確認後 existing physical / magic element pipeline 直接讀 state.elements，不另寫第二套公式。

### Regression targets

- game.js syntax PASS
- schema 23 fresh save => unconfigured / elements null
- schema 22 migration => unconfigured / elements null even if unrelated old state exists
- valid pure / adjacent dual allocations PASS
- invalid total, fractional, >10, >2 elements, Earth+Fire, Water+Wind FAIL
- stored CHAR values must be multiples of 10 and map back to a valid 10-point creation allocation
- confirmation writes point*10 and locks permanently
- unconfigured player battleBaseElements returns null, not NONE=100
- configured player battleBaseElements returns exact stored source values
- tick does not spawn/fight before configuration
- V1.25 fox ranged regression unchanged
- V1.24 BecomeFox lifecycle / 31% regression unchanged
- V1.18 Ultimate / death branch regression unchanged


## V1.27 Default CHAR_DUELPOINT = 100

固定來源：gavinlinasd/StoneAge@1f90cb6cb57c1df70f39cde77a5a8ccd98b66c56。

### Creation value

gmsv/src/char/defaultPlayer.h 的 player template：

- CHAR_CHARM = 0（之後 CHAR_createNewChar 明確改成 60）
- CHAR_LUCK = 0
- CHAR_DUELPOINT = 100

CHAR_createNewChar 沒有覆寫 CHAR_LUCK 或 CHAR_DUELPOINT，因此新角色實際出生：

- Luck = 0
- DuelPoint = 100

現行 Web 的 luck:0 原本就是正確來源值；舊 UI「沿用放置版初始參數」文字改正。

### Level-up DuelPoint

fixed gmsv/src/char/char_data.c 的 CHAR_LevelUpCheck：

CHAR_DUELPOINT += (level + 1) * 10

這裡 level 是升級前等級。

Web levelCheck() 是先 state.level++，再：

state.duelPoint += state.level * 10

兩者數值完全等價，因此升級公式不修改。

### Why old saves can migrate exactly

截至 V1.26，Web 對 duelPoint 的 mutation 只有：

1. save migration / normalize
2. levelCheck 的升級加點

目前沒有 PvP、duel result 或其他 DuelPoint 增減系統。

因此所有舊 Web 存檔都只是從錯誤的 0 起算，而不是原服的 100；不論已升幾級，差值固定都是 +100。

save schema 23 -> 24：
- fresh duelPoint = 100
- schema < 24：既有 duelPoint + 100 一次
- schema >= 24：只正規化，不再重複補

### Regression targets

- fresh schema24 DuelPoint = 100
- schema23 duelPoint 0 -> 100
- schema23 duelPoint 540 -> 640
- schema24 duelPoint 640 stays 640
- level-up from Lv1 adds 20; Lv2 adds 30, matching (oldLevel+1)*10
- V1.26 player element gate / migration unchanged
- V1.25 / V1.24 / V1.18 combat regression unchanged


## V1.28 fixed setup.cf new-player baseline / _FIX_MAX_GOLD

固定來源仍為 gavinlinasd/StoneAge@1f90cb6cb57c1df70f39cde77a5a8ccd98b66c56。

V1.27 補回 defaultPlayer.h 的 DuelPoint 100 後，本輪繼續對帳 CHAR_createNewChar / CHAR_makeCharFromOptionAtCreate 與固定 gmsv/setup.cf。

### 固定 build feature

version.h 明確開啟：

- _NEW_PLAYER_CF
- _HELP_NEWHAND
- _FIX_MAX_GOLD

因此創角不能只看 defaultPlayer.h 的 GOLD=0 / TRANSMIGRATION=0；CHAR_makeCharFromOptionAtCreate 會用 setup.cf 覆寫。

固定 setup.cf：

- TRANS=1
- LV=1
- GOLD=30000
- PETLV=1
- ITEM1=24114
- ITEM2..ITEM15 空
- PET1..PET4 空

### Fresh state

V1.28 真正新建存檔改為：

- level 1
- transmigration 1
- gold 30000
- inventory Item 24114 ×1
- DuelPoint 100 維持 V1.27
- charm 60 維持 CHAR_createNewChar

Item 24114 的「存在與 ID」由 setup.cf + _HELP_NEWHAND 唯一證明。
固定 itemset6.txt 為舊編碼，而目前 generated item runtime 尚無 24114 可唯一解析的名稱／效果，因此 Web 只保存 ItemID 24114 的持有數，不猜名稱、功能，也不偽造 existing-item template。

### normalizeState(null) 修正

舊 normalizeState(null) 會把「沒有任何存檔」誤當 schema 0：

- V1.27 DuelPoint migration 可能在 fresh 100 上再 +100
- 更早的 charm migration 也可能在 fresh 60 上再加舊版補值

V1.28 明確分流：

- raw save 不存在：直接 return freshState()
- raw save 存在：才進 legacy migration

所以新角色不再吃任何歷史 migration。

### 舊存檔 migration 邊界

player transmigration 在 schema25 以前根本不存在，也沒有玩家轉生修改路徑。
所以舊 Web 存檔可唯一判斷為「少了固定出生 TRANS=1」：

- pre-schema25：transmigration = 1
- schema25+：保留實際保存值

但 GOLD 與 Item 24114 都是可變資產：

- 石幣可能已取得、花費或被偷
- Item 24114 可能已使用、丟棄或被偷

因此 **舊存檔不追補 30,000 與 24114**，避免偽造歷史。
若罕見舊存檔連 gold 欄都不存在，保留舊 Web 出生基準 0，不套新角色 30,000。

### _FIX_MAX_GOLD

fixed char_base.c：

MaxGold = 1000000 + CHAR_TRANSMIGRATION * 1800000

新增：

- sourcePlayerTransmigration()
- sourcePlayerMaxGold()

目前 fixed starter TRANS=1，因此新角色金錢上限為 2,800,000。

既有 BATTLE_StealMoney / 「捐獻」原先把 MaxGold 寫死成 1,000,000；V1.28 改為 sourcePlayerMaxGold(state)。

### CaptureCheck 不修改

本輪重新核對 fixed battle_event.c::BATTLE_CaptureCheck。

它的 Lv+5 限制是：

- CHAR_WORK_PickAllPet != TRUE
- attacker LV + 5 < defender LV => FALSE

這裡 **沒有 CHAR_TRANSMIGRATION 條件**。

先前在其他寵物持有／交易程式看到的 TRANSMIGRATION <= 0 不能套進 CaptureCheck，因此 V1.28 明確不改現有捕獲 +5 規則。

### 起始寵暫不猜

CHAR_createNewChar 在 config PET slot 0 為 -1 時，會依 CHAR_LASTTALKELDER / hometown 選 EnemyID 1/2/3/4 之一做起始寵。

目前 Web 尚未建立可一一對應的創角 hometown 選擇，因此 V1.28 不自行指定其中一隻。
待 hometown / elder creation layer 接入後再照原碼補，不由名稱或常見版本猜。

### Regression targets

- game.js syntax PASS
- freshState schema25
- freshState transmigration=1
- freshState gold=30000
- freshState inventory 24114=1
- normalizeState(null) 不跑 legacy migrations
- fresh DuelPoint=100，不變 200
- fresh charm=60，不變 70
- legacy schema24 gold / inventory 原值完全保留
- legacy schema24 不補 24114
- legacy schema24 transmigration 精準補 1
- schema25 transmigration 保存值保留
- maxGold: trans0=1,000,000 / trans1=2,800,000 / trans5=10,000,000
- BATTLE_StealMoney 使用 sourcePlayerMaxGold
- CaptureCheck +5 規則不改
- V1.27 DuelPoint 舊存檔 migration 仍只 +100 一次


## V1.29 hometown / LASTTALKELDER / starter Pet creation

固定來源仍為 gavinlinasd/StoneAge@1f90cb6cb57c1df70f39cde77a5a8ccd98b66c56。

### fixed build 的出生模式

version.h 中 _MUSEUM 為關閉；_DELBORNPLACE 的實際 define 位在 #ifdef _MUSEUM 內，因此本固定 build 同樣未啟用。

CHAR_getInitElderPosition() 走標準四村分支，hometown 必須 0..3：

- 0 -> elder0 -> Floor 1006 (15,22)
- 1 -> elder1 -> Floor 2006 (20,16)
- 2 -> elder2 -> Floor 3006 (21,16)
- 3 -> elder3 -> Floor 4006 (14,20)

並設定 LASTTALKELDER=hometown、SAVEPOINT |= 1<<hometown。

### _NEW_PLAYER_CF 起始寵

固定 setup.cf PET1 為空，因此 getNewplayergivepet(0)==-1。
CHAR_createNewChar 按 LASTTALKELDER 寫入第一個新手寵：

- hometown 0 -> EnemyID 1 -> 烏力烏力 / TempNo 2
- hometown 1 -> EnemyID 2 -> 凱比 / TempNo 112
- hometown 2 -> EnemyID 3 -> 克克爾 / TempNo 102
- hometown 3 -> EnemyID 4 -> 威伯 / TempNo 34

四筆都已在現行 Group 1127 找到完整 valid template，固定 Lv1、INITNUM 20、LVUPPOINT 4、PetSkill [0,0,0,0,0,0,1]。

### ENEMY_createPetFromEnemyIndex RNG / progression

V1.29 sourceCreateStarterPet 保留原 statement order：

1. RAND(LV_MIN,LV_MAX)；本資料是 RAND(1,1)，仍消耗 call
2. VITAL/STR/TOUGH/DEX 各 RAND(0,4)-2
3. 先把這四個值 pack 成 ALLOCPOINT
4. 10 次 RAND(0,3) 分配額外成長點
5. 用 ((level-1)*LVUPPOINT+INITNUM)*base 建 CHAR 四圍
6. VariableAI=0
7. 複製元素／七格 PetSkill／status resist
8. ENEMY_getRank 對應 runtime enemyExpRankIndex
9. PETMAIL_EFFECT RAND(0,1)
10. compliance 後 HP=MAXHP

不走 BATTLE_Capture 的「忠誠最多 60」修正，因為這是創角 GetPet，不是捕獲。

### 不自動出戰

固定 CHAR_createNewChar 在 ENEMY_createPetFromEnemyIndex 後沒有設定 CHAR_DEFAULTPET。

Web 對應：

- petBox 新增起始寵
- team 第一個空格加入起始寵，代表第一個持有 Pet slot
- activePetId 不變，fresh 狀態仍為 null
- 玩家要自行按「設為出戰」

### 舊存檔

schema26 以前沒有 hometown / LASTTALKELDER，也沒有保存「原本那隻起始寵後來是否已被放生」。

因此不做任何歷史倒推：

- hometown=null
- hometownLegacyUnknown=true
- playerHometownConfigured=true，讓既有角色可繼續遊玩
- starterPetGranted=false
- **不補任何起始寵**

只有真正 schema26 新角色可執行一次 hometown 確認並領取 source starter。

### Web map 與 source home floor

V1.29 保存 homeFloor/homeX/homeY/hometownSavePointMask 作來源角色資料，但不把這些 Floor 強塞進目前放置版的狩獵 map router。
兩者是不同層；等正式世界移動層接入再對接。

### Creation gate

真正新角色的自動戰鬥現在同時要求：

- hometown 已確認
- 原服 10 點元素已確認

schema26 前舊角色以 hometownLegacyUnknown 通過 hometown gate，不會因無法還原歷史出生村而被卡住。

### Regression targets

- game.js syntax PASS
- Group1127 EnemyID1..4 template 全存在且 Lv1
- hometown0/1/2/3 -> EnemyID1/2/3/4 + 正確 elder/floor/x/y
- starter level RNG call 保留，即使 RAND(1,1)
- 四圍 ±2 + 10 allocation + PETMAIL_EFFECT RNG 保留
- starter VariableAI=0，不套 capture initial AI cap
- starter 加入第一個 team slot，但 activePetId 保持 null
- 二次 hometown confirm 被拒絕，不重複給寵
- normalizeState(null) 是 schema26 新角色、hometown 未確認、沒有起始寵
- pre-schema26 舊存檔 hometownLegacyUnknown=true，沒有補寵
- schema26 已確認 hometown 正規化回 source elder/座標
- battle tick 新角色需 hometown+elements；舊存檔 legacy unknown 不被 hometown gate 卡住
- V1.28 1轉／30,000／Item24114 與 fresh migration 分流不回退


## V1.30 fixed _NEW_PLAYER_CF player creation parameters

固定來源仍為 gavinlinasd/StoneAge@1f90cb6cb57c1df70f39cde77a5a8ccd98b66c56。

V1.29 已接回 hometown / LASTTALKELDER / starter Pet；本輪繼續沿 CHAR_createNewChar → CHAR_makeCharFromOptionAtCreate 對帳，發現 Web freshState 的 VITAL/STR/TOUGH/DEX 固定 5/5/5/5 並不是固定原 C 的創角規則。

### 固定 build 的創角四圍驗證

version.h 啟用 _NEW_PLAYER_CF，因此 CHAR_makeCharFromOptionAtCreate 的實際規則是：

- VITAL / STR / TOUGH / DEX 每項必須是 0..20
- 四項合計若 >20 才失敗
- 不要求一定合計 20
- 寫入 CHAR 時每一點乘 100：
  - CHAR_VITAL = vital * 100
  - CHAR_STR = str * 100
  - CHAR_TOUGH = tgh * 100
  - CHAR_DEX = dex * 100

也就是 5/5/5/5 只是其中一個合法選擇，不是 source default。甚至 0/0/0/0 也通過這個固定 server validation；因此 Web 不再自行替新角色填 5/5/5/5。

### 派生戰鬥值

fixed CHAR_initcharWorkInt 使用：

- FIXSTR = STR + TOUGH*0.1 + VITAL*0.1 + DEX*0.05
- FIXTOUGH = TOUGH + STR*0.1 + VITAL*0.1 + DEX*0.05
- FIXDEX = DEX
- MaxHP = VITAL*4 + STR + TOUGH + DEX

上述來源 CHAR 值本身是創角點數 *100，服務端計算時再 *0.01；因此 Web 直接以「點數單位」保存 playerStats，公式數值等價。

原 CHAR_createNewChar 在建立角色前先把 CHAR_HP 設成 0x7fffffff，之後 compliance 會把 HP 截到 MaxHP；因此真正新角色確認創角四圍後，Web 也以滿 HP 開始。

特別保留 source edge case：全 0 時 MaxHP=0，不再用 Math.max(1, ...) 偷補 1 HP。

### Save schema 27

真正 schema27 新角色：

- creationPlayerStats=null
- playerCreationStatsConfigured=false
- playerStats 先為 0/0/0/0
- HP/MaxHP、攻、防、敏先為 0
- 玩家確認合法創角四圍後：
  - creationPlayerStats 保存不可變創角基底
  - playerStats 由同一配點起始，後續升級能力點只改 playerStats
  - playerCreationStatsConfigured=true
  - battle gate 才放行這一層

creationPlayerStats 與 playerStats 分開保存，是因為後者會隨升級能力點增加，不能拿「目前累積四圍」反推歷史創角基底。

### 舊存檔

schema27 前只保存 cumulative playerStats，沒有獨立保存原始 creation allocation。

因此不把歷史 Web 5/5/5/5 宣稱成原服選擇，也不重算玩家已經投入的升級能力點：

- creationPlayerStats=null
- playerCreationStatsLegacyUnknown=true
- playerCreationStatsConfigured=true
- 現有 playerStats / HP / 攻防敏照存檔保留
- 舊角色直接通過 creation-stat gate

### Creation gate

真正新角色現在自動戰鬥依序需要：

- 創角四圍已確認
- hometown 已確認
- 原服 10 點元素已確認

三者都屬於固定原 C CHAR_createNewChar 的輸入，不再由 Web 猜值。

### Regression targets

- game.js syntax PASS
- freshState schema27
- fresh creationPlayerStats=null / configured=false / legacyUnknown=false
- fresh playerStats=0/0/0/0，derived combat=0
- 0/0/0/0 valid，total=0
- 20/0/0/0 valid，total=20
- 5/5/5/5 valid，total=20
- 20/1/0/0 invalid，total=21
- 任一負數、>20、非整數 invalid
- confirm 5/5/5/5 => attack 6 / defense 6 / quick 5 / MaxHP 35 / HP 35
- confirm 20/0/0/0 => attack 2 / defense 2 / quick 0 / MaxHP 80 / HP 80
- confirm 0/0/0/0 => MaxHP 0，不偷補 1
- creationPlayerStats 鎖定後，升級能力點只改 playerStats
- pre-schema27 舊存檔保留 cumulative playerStats，不倒推 creation base
- battle tick 新角色需 creation stats + hometown + elements
- V1.29 starter Pet / hometown migration 不回退
- V1.28 setup.cf 1轉／30,000／Item24114 不回退


## V1.31 Enemy AI target-selection RNG / TARGET_LEADER

固定來源仍為 gavinlinasd/StoneAge@1f90cb6cb57c1df70f39cde77a5a8ccd98b66c56，本輪直接對照 gmsv/src/battle/battle_ai.c，且 fixed version.h 已開啟 _ENEMY_ATTACK_AI。

### Single-candidate RNG order

BATTLE_ai_normal 對一般隨機選目標（select mode 1）只做：

- RAND(0, cnt-1)

但 HP_MAX / HP_MIN / STR_MAX / DEX_MAX / DEX_MIN / ATT_SUBDUE（select mode 2..7）在先找出 top 後，固定還會做：

- RAND(0, rn)
- 若結果為 0，再做 RAND(0, cnt-1)
- 否則使用 top

這個流程 **沒有 cnt==1 的捷徑**。

V1.30 以前 Web 的 enemyChooseTarget() 在 candidates.length===1 時直接回傳 RAND(0,0)，因此 mode 2..7 會少掉來源 RAND(0,rn)，而且 RAND(0,rn)==0 時也少掉後續來源 RAND(0,0)。

這不只影響「選到誰」；更重要的是會讓同一場戰鬥後續的技能、命中、迴避、傷害等 RNG 序列整體錯位。

### Current reachable proof: EnemyID 1798

現行一般 Lv1 catalog 中 EnemyID 1798 / TempNo 905 布依胖的 AI attack option 是：

- attack weight 1
- targetType 2 = PLAYER
- selectMode 2 = HP_MAX
- rn 未指定，因此 fixed battle_ai.c 預設 rn=1

它目前有兩條可達路線：

- Floor 7000 伊甸園 / Encounter 777，條件 Item 19720
- Floor 7000 伊甸園 / Encounter 778，條件 Item 19733

targetType=PLAYER 在單機模型中正常只有玩家一個 candidate，因此這正是 V1.30 以前必定少吃 RNG 的可達案例。

V1.31 移除 candidates.length===1 的提前 return。mode 2..7 現在即使只有一個候選，也依 source 消耗 RAND(0,rn)，必要時再消耗 RAND(0,0)。

### TARGET_LEADER

fixed _ENEMY_ATTACK_AI 的 targetType 4 並不是「永遠鎖玩家」。

battle_ai.c 對敵方每個 BATTLE_ENTRY：

- CHAR_WORKPARTYMODE == CHAR_PARTY_LEADER：直接加入候選
- 否則各自 RAND(0,2)，只有結果 0 才加入
- 若整輪沒有候選，才把 target type 改成 ALL 再掃一次

目前 Web 沒有玩家組隊系統；fixed CHAR_LoginBesideSetWorkInt 的單機/非組隊狀態是 CHAR_PARTY_NONE，而 CHAR_PARTY_NONE=0、CHAR_PARTY_LEADER=1。

因此 V1.31 不再把 solo player 自動視為 leader。玩家與出戰 Pet 都按非 leader 分支，各自保留 RAND(0,2)；若全部落空，再依 source fallback 到 ALL。

這條目前不是 166 組一般 Lv1 的主要可達案例，但它是同一個 fixed AI core 的確定規則，且 runtime 已存在 targetType 4 Enemy，因此一併修正，不猜 party leader。

### No save migration

本輪只修每回合 Enemy AI 的即時 target/RNG 行為，不新增持久化欄位：

- schemaVersion 維持 27
- 舊存檔不需 migration
- V1.30 創角四圍不變
- V1.29 hometown / starter Pet 不變

### Regression targets

- game.js syntax PASS
- selectMode 1 / cnt1：只消耗 RAND(0,0)，不額外跑 rn
- selectMode 2..7 / cnt1：必定先消耗 RAND(0,rn)
- selectMode 2..7 / cnt1 / rn roll=0：再消耗 RAND(0,0)
- selectMode 2..7 / cnt>1：top 比較與 rn random override 保持來源順序
- targetType 2/3 找不到指定類型時 fallback ALL
- targetType 4：solo player 不視為 CHAR_PARTY_LEADER
- targetType 4：每個非 leader candidate 各自 RAND(0,2)
- targetType 4：若全部未入選，fallback ALL
- EnemyID1798 / TempNo905 現行兩條 Floor7000 路線保留 source HP_MAX RNG 時序
- schema 27 / V1.30 creation gate / V1.29 starter Pet regressions unchanged


## V1.32 EarthRound hidden target / BATTLE_TargetAdjust

固定來源仍為 `gavinlinasd/StoneAge@1f90cb6cb57c1df70f39cde77a5a8ccd98b66c56`，維持「原 C 規則優先、不猜數值」。

本輪確認 Enemy AI 初選目標與真正執行攻擊是兩個不同階段。原 `battle_ai.c / BATTLE_ai_normal()` 建 target[] 時只排除無效 index、`CHAR_ISDIE` 與 `BATTLE_CHARMODE_RESCUE`，沒有檢查 `CHAR_ISATTACKED`。因此玩家出戰 Pet 即使進入 EarthRound 隱身，仍保留在 TARGET_ALL / TARGET_PET / TARGET_LEADER 候選中，也仍參與 V1.31 已對齊的 selectMode 與 RNG 次序。

原 `battle_event.c / BATTLE_EarthRoundHide()` 會把 `CHAR_ISATTACKED` 設為 0，並把 COM1 設成 `BATTLE_COM_S_EARTHROUND0`，但不會把 Battle Entry 移出戰場。因此 AI 可以先把隱身 Pet 寫進 COM2；真正執行一般非 BOW 攻擊時，`BATTLE_TargetAdjust()` 再透過 `BATTLE_TargetCheck()` 擋掉該 Pet，接著只呼叫 `BATTLE_DefaultAttacker()` 在目前合法目標中 `RAND(0,cnt-1)` 重選。

TargetAdjust 不會重新執行 Enemy AI 的 targetType / selectMode，也不會重新消耗 `RAND(0,rn)` 或 TARGET_LEADER 的 `RAND(0,2)`。即使只剩玩家一個合法目標，DefaultAttacker 仍保留來源的 `RAND(0,0)`。

Web 現已拆成：

- `enemyChooseTarget()`：AI 初選；EarthRound 隱身 Pet 仍在候選
- `enemyActorCommandTarget()`：保存原 COM2，不先驗證
- `enemyActorTarget()`：對應 BATTLE_TargetAdjust；COM2 無效才走 `sourceEnemyDefaultAttacker()`

同步對齊來源特例：

- BOW：不先跑 TargetAdjust；由原 COM2 建 aBowW，逐 slot 以 TargetCheck 跳過 EarthRound 目標
- BOOMERANG：保留原 COM2 所在五格列；整列沒有合法目標才用 DefaultAttacker 隨機換列，不再重新跑 Enemy AI
- BOUNDTHROW / BREAKTHROW 與非 BOW 連續段：每個後續段依原 aDefList 還原原 COM2，再跑一次 TargetAdjust
- CHARGE / EarthRound 起手：只保存原 COM2，留到釋放攻擊時依攻擊路徑驗證
- GYRATE：直接依原 COM2 所在列掃 TargetCheck，不套泛用 TargetAdjust
- FIREKILL：COM2 無效／EarthRound 時從同 side 由低 slot 找第一個合法目標，不使用隨機 DefaultAttacker

本輪不改存檔 schema，仍為 27。

### V1.32 regression targets

- game.js syntax PASS
- EarthRound hidden Pet 仍進 Enemy AI candidates
- TARGET_PET / TARGET_ALL / TARGET_LEADER 的 AI RNG 不因隱身提前消失
- non-BOW COM2 指到 hidden Pet：TargetAdjust 改走 DefaultAttacker，不重跑 Enemy AI
- DefaultAttacker 單一候選仍消耗 RAND(0,0)
- BOW raw COM2 / aBowW 次序保留，hidden slot 由 TargetCheck 跳過
- BOOMERANG hidden-only row 改由 DefaultAttacker 換列
- BOUNDTHROW / BREAKTHROW / RENZOKU 後續段逐段 TargetAdjust
- EarthRound / CHARGE release 保留原 COM2 lifecycle
- GYRATE / FIREKILL source exception 保留
- schema 27 / V1.31 target RNG / V1.30 creation / V1.29 starter Pet regressions unchanged


## V1.33 Enemy AttackMagic raw COM2 / BATTLE_MultiList

固定來源：

- `gavinlinasd/StoneAge@1f90cb6cb57c1df70f39cde77a5a8ccd98b66c56`
- `version.h`：`__ATTACK_MAGIC` 已開啟
- 維持「原 C 規則優先、不猜數值」

V1.32 對齊了普通物理攻擊的 `BATTLE_TargetAdjust()`，本輪繼續往下掃後確認：Enemy 的 `BATTLE_COM_S_ATTACK_MAGIC` 是另一條獨立目標生命週期，不能套用泛用 TargetAdjust。

### Source command order

固定 `battle.c` 的 AttackMagic 流程是：

1. 直接讀 `CHAR_WORKBATTLECOM2`（Enemy AI 先前寫入的 raw COM2）
2. 用固定 `TargetIndex[25]` 依 magic id 改寫範圍
3. 呼叫 `MAGIC_DirectUse()`
4. `MAGIC_AttMagic_Battle()` 進 `BATTLE_MultiAttMagic()`
5. `BATTLE_MultiAttMagic()` 第一件事就是 `BATTLE_MultiList()`
6. MultiList 完成目標修正後，才消耗一次 `rand()%100` 的 TrueMagic 判定

因此這條路徑不會先跑 `BATTLE_TargetAdjust()`。

### Single-target BATTLE_MultiList old behavior

在 fixed `__ATTACK_MAGIC` 下，若 toNo 是 0..19 而原目標已死亡／離場／EarthRound `CHAR_ISATTACKED=0`：

- 先把同 side 所有 `BATTLE_TargetCheck()==TRUE` 的 slot 壓縮存進 `nLifeArea[10]`
- 其餘元素保持 -1
- 然後反覆執行 `nLifeArea[rand()%10]`
- 抽到 -1 就重抽，直到抽中一個有效 compact index

這和 `BATTLE_DefaultAttacker()->RAND(0,cnt-1)` 完全不同。

例如單機模型只剩玩家 slot 0 可被攻擊時，compact array 是：

- `nLifeArea[0]=0`
- `nLifeArea[1..9]=-1`

所以來源會一直消耗 `rand()%10`，直到 roll 恰好為 0，而不是直接做 `RAND(0,0)`。

V1.33 新增 `sourceEnemyAttackMagicMultiList()`，保留這個 rejection RNG lifecycle。

### Row / all-target behavior

固定 battle.h：

- `TARGET_SIDE_0_B_ROW = 26`：先掃 slots 0..4，整排無合法目標才換到 25
- `TARGET_SIDE_0_F_ROW = 25`：先掃 slots 5..9，整排無合法目標才換到 26
- 前後排互換不消耗隨機數
- `TARGET_SIDE_0 = 20`：直接掃整個 side，不做 DefaultAttacker random fallback

因此：

- magic 311 / 暴風雪：raw COM2 在 slot 0..4 時 rewrite 26；在 slot 5..9 時 rewrite 25。若原本那排只有 EarthRound 隱身 Pet，MultiList 只換到另一排，不吃 RNG。
- magic 318 / 火山爆發：直接 rewrite 20；即使 raw COM2 原本指向 EarthRound Pet，也不該先吃任何 DefaultAttacker RNG。
- 最終魔法 field 掃描仍使用 `BATTLE_TargetCheck()`，所以 EarthRound 隱身 Pet 不會被實際命中。

### Current 85-floor reachable proof

把 `stoneage_general_encounter_runtime.json` 的正權重 group members 與 `stoneage_enemy_ai.json` 交叉後，現階段 85-floor runtime 真正有正權重可達的 AttackMagic 包含：

- 302 `E落石撞击`：EnemyID 1793
- 308 `E水刃`：EnemyID 1678
- 311 `E暴风雪`：EnemyID 2239
- 314 `E火焰连弹`：EnemyID 1679
- 318 `E火山爆发`：EnemyID 1972

其中 302 / 308 / 314 是單體、311 是排攻擊、318 是全體，剛好涵蓋本輪三種目標生命週期。

完整 Enemy AI 裡另有 204 / 435 的 AttackMagic 技能，但不在目前 85-floor 正常 encounter group 可達集合。本輪沒有拿技能說明文字猜行為；204 只保留來源「不使用 target 的 FieldAttChange」，435 則只沿來源 `MAGIC_Weaken -> BATTLE_MultiList` 套同一個 raw-COM2 helper。

### Web changes

- AttackMagic 不再從 `enemyActorTarget()` 起手
- 改由 `enemyActorCommandTarget()` / raw battle slot 保存 COM2
- 新增 `sourceEnemyAttackMagicRewriteToNo()`
- 新增 `sourceEnemyAttackMagicMultiList()`
- `enemyAttackMagicTargets()` 改吃 MultiList 已修正後的 toNo
- `magicDescForSlot()` 最終以 TargetCheck 語意排除 EarthRound hidden Pet
- MultiList fallback 必須發生在 TrueMagic `rand()%100` 之前

本輪不新增持久化資料，`schemaVersion` 維持 27。

### V1.33 regression targets

- game.js syntax PASS
- 302/308/314：raw hidden Pet COM2 不走 DefaultAttacker
- 單體 invalid COM2：`rand()%10` 可連續抽空並重試
- 單體 fallback 完成後才進 TrueMagic `rand()%100`
- 311：raw Pet row hidden-only -> 25 無 RNG fallback 到 26
- 311：raw Player row -> 26 保持原排
- 318：raw hidden Pet 仍直接 rewrite 20，不吃 retarget RNG
- 318 最終 TargetCheck 排除 hidden Pet，只命中合法 side targets
- 204 FieldAttChange 不因 raw COM2 invalid 多吃 targeting RNG
- schema 27 / V1.32 TargetAdjust / V1.31 target AI RNG regressions unchanged


## V1.34 BATTLE_GetAttackCount pre-command RNG lifecycle

固定來源仍為 `gavinlinasd/StoneAge@1f90cb6cb57c1df70f39cde77a5a8ccd98b66c56`，維持「原 C 規則優先、不猜數值」。

本輪從 V1.33 AttackMagic 繼續往 `BATTLE_Battling()` 的實際執行順序掃描，確認一個會影響整場 RNG 序列、而且目前 85-floor runtime 已實際可達的差異。

### Source order

fixed `battle.c` 每個可執行 Battle Entry 在：

- `BATTLE_StatusSeq()`
- `BATTLE_CanMoveCheck()`
- 本輪武器型別整理

之後，尚未進入真正的 command switch 前，就無條件執行：

```c
attack_max = BATTLE_GetAttackCount(charaindex);
```

`BATTLE_GetAttackCount()` 只要 `CHAR_ARM` 是有效 existing item，就一定呼叫：

```c
RAND(ITEM_ATTACKNUM_MIN, ITEM_ATTACKNUM_MAX)
```

這和最後 command 是否真的用武器無關。

因此 Enemy 本回合抽到：

- GUARD
- ESCAPE
- NONE
- AttackMagic
- 其他不使用 weapon attack loop 的技能
- StatusSeq 後已不能行動、COM 被改成 NONE

只要身上仍有有效 `CHAR_ARM`，來源都已先消耗一次 AttackNum RNG。

另外 `util.h` 的 `RAND(x,y)` 宏本身直接呼叫 `rand()`。所以即使武器是固定 `1..1` 或 `0..0`，`RAND(1,1)` / `RAND(0,0)` 仍然會消耗一顆原 RNG，不可因 min==max 省略。

### Current reachable proof

把目前 85-floor encounter group 與 Enemy AI / STYLE 武器交叉後，至少下列可達 Enemy 自帶 STYLE weapon 且存在非 Attack action：

- 1098：BREAKTHROW，AttackNum 1..1，Guard
- 1099：BOW，AttackNum 1..3，Guard
- 1100：CLUB，AttackNum 1..1，Guard
- 1101：SPEAR，AttackNum 0..0，Guard
- 1102：AXE，AttackNum 1..1，Guard
- 1104：BOUNDTHROW，AttackNum 1..1，Guard
- 1112：CLUB，AttackNum 1..1，Guard / Escape
- 1113：BOW，AttackNum 1..3，Guard / Escape
- 1115：BREAKTHROW，AttackNum 1..1，Guard / Escape
- 1116：BOUNDTHROW，AttackNum 1..1，Guard / Escape

所以這不是不可達的歷史規則；正常 85 張地圖戰鬥已會遇到。

### Web correction

新增 `sourceEnemyPrimeExecutionAttackCount(actor)`：

- 在每個 battle loop 的 StatusSeq 後執行
- 使用完整 Enemy Battle Entry unit，而不是只找 living unit
- 無有效武器時保持原 Enemy fallback attackMax=1，且不額外抽 RNG
- 有有效武器時立刻執行 `sourceBattleGetAttackCount()`
- 把結果保存到 `actor.sourceAttackMax`

BOW / BOUNDTHROW / BREAKTHROW / fox ranged 後續真正進物理攻擊時：

- 優先重用 `actor.sourceAttackMax`
- 不再第二次呼叫 `BATTLE_GetAttackCount`
- RENZOKU 等來源本來會在之後覆寫 attack_max 的技能，仍由技能自己的 override 優先

這同時修正了 throw weapon 舊順序：來源是 AttackCount RNG 在 TargetAdjust 之前；現在 Web 也不會先因失效 COM2 消耗 DefaultAttacker RNG，再去抽 AttackNum。

### C_WAIT exception

Enemy AI 若 `PETSKILL_Use()` 失敗或 B_AI_MAGICMODE 無 handler，來源 Battle mode 仍停在 C_WAIT，`BATTLE_Battling()` 在進 StatusSeq 前就 continue。

因此 Web 仍維持 `sourceEnemyCWait(actor)` 提前跳過；這類 actor 不應消耗 AttackCount RNG。

本輪不新增持久化欄位，schemaVersion 維持 27。

### V1.34 regression targets

- game.js syntax PASS
- valid CHAR_ARM + Guard：仍消耗一次 RAND(AttackNum min,max)
- valid CHAR_ARM + Escape：仍消耗一次 AttackNum RAND
- fixed 1..1 / 0..0 weapon：仍有一次 RNG call
- immobilized Enemy：StatusSeq 後仍先消耗 AttackCount RNG，再跳過 action
- C_WAIT Enemy：不消耗 AttackCount RNG
- normal BOW / THROW：重用 primed attackMax，不二次抽取
- RENZOKU explicit attackMax override 優先於 primed value
- AttackCount RNG 發生在 TargetAdjust / AttackMagic MultiList / command effect 之前
- schema 27 / V1.33 AttackMagic / V1.32 TargetAdjust regressions unchanged


## V1.35 _ADD_DEAMGEDEFC / BATTLE_DamageCalc RNG lifecycle

固定來源仍為 `gavinlinasd/StoneAge@1f90cb6cb57c1df70f39cde77a5a8ccd98b66c56`，維持「原 C 規則優先、不猜數值」。

### Source proof

fixed `version.h` 啟用 `_ADD_DEAMGEDEFC`。原 `BATTLE_DamageCalc()` 在基礎攻防 RNG 與 `BATTLE_AttrAdjust()` 完成後、return 前固定執行：

```c
apower = CHAR_getWorkInt( attackindex, CHAR_WORKOTHERDMAGE);
dpower = CHAR_getWorkInt( defindex, CHAR_WORKOTHERDEFC);
otherpower = RAND( apower*0.3, apower) - RAND( dpower*0.3, dpower);
```

`CHAR_initcharWorkInt()` 會先把 `CHAR_WORKOTHERDMAGE` / `CHAR_WORKOTHERDEFC` 初始化成 0。現有 Web weapon runtime 沒有可由原資料可靠還原的 other damage / defense 欄位；`itemset6.txt` 又是 GB18030，這一輪不猜任何非 0 裝備值。

### Web correction

`battleDamageCore()` 在 `battleAttrDamage()` 後新增 fixed `_ADD_DEAMGEDEFC` lifecycle：

- 目前 `sourceOtherDamage = 0`
- 目前 `sourceOtherDefense = 0`
- 每次 DamageCalc 無條件執行兩次 `cRand(0,0)`
- 兩個值皆為 0，所以 `sourceOtherPower` 必為 0，現有傷害數值不改變
- 仍保留原 C 的 `damage < 0 => 0` 收尾
- 不新增猜測的裝備欄位，不改 save schema

重點是 RNG lifecycle：現有 `cRand(0,0)` 仍會呼叫一次 `Math.random()`，所以兩顆固定 0 RNG 不能省略。

### V1.35 regression targets

- game.js syntax PASS
- 每次真正進入 `battleDamageCore()` 固定多消耗兩顆 RNG
- 兩顆 RNG 的位置在基礎 DamageCalc RNG + AttrAdjust 之後
- critical bonus / GuardAdjust / damage<1 fallback 等後續 RNG 順序相對來源一致
- 0 / 0 current values 不改變實際 damage
- dodge / skill-dodge 在 DamageCalc 前返回時不誤吃這兩顆 RNG
- schema 27 維持不變
- V1.34 AttackCount / V1.33 AttackMagic / V1.32 TargetAdjust regressions unchanged


## V1.36 _EQUIT_HITRIGHT / BATTLE_DuckCheck RNG lifecycle

固定來源仍為 `gavinlinasd/StoneAge@1f90cb6cb57c1df70f39cde77a5a8ccd98b66c56`，維持「原 C 規則優先、不猜數值」。

### Source proof

fixed `version.h` 明確啟用 `_EQUIT_HITRIGHT`，且 `CHAR_initcharWorkInt()` 在 `_ITEMSET5_TXT` 區段先執行：

```c
CHAR_setWorkInt( index, CHAR_WORKHITRIGHT, 0);
```

之後 `ITEM_equipEffect()` 才可能從 `ITEM_HITRIGHT` 疊加非 0 裝備值。

原 `BATTLE_DuckCheck()` 在基礎 Duck 計算、酒醉／BOW／NoGuard 修正與 75% cap 後，若攻擊者是 Player，固定執行：

```c
int AddHit = CHAR_getWorkInt( attackindex, CHAR_WORKHITRIGHT);
per -= RAND( AddHit*0.8, AddHit*1.2);
if( per < 0 ) per = 0;
```

接著才做 profession duck / chaos 修正與最後的 `RAND(1,10000)` 閃避判定。

### Current data boundary

現有 Web equipment runtime 沒有可由已接資料可靠還原的 `ITEM_HITRIGHT` 非 0 欄位，因此本輪：

- 不猜 ITEM_HITRIGHT 裝備數值
- `sourceHitRight` 維持來源初始化值 0
- 但 Player 攻擊者每次真正進入普通 `BATTLE_DuckCheck` 時，仍固定執行一顆 `cRand(0,0)`

這和 V1.35 的原則相同：數值保持 0，不代表 RNG call 可以省略。

### Web correction

`sourceBattleDuckTotal()` 現在：

1. 先完成 base duck / drunk / BOW / NoGuard / BOW
2. 先 cap 到來源的 1..7500
3. 僅 Player attacker 執行 HitRight RNG
4. 目前 0 值不改變 duck 數值，但實際消耗一顆 RNG
5. 再由 caller 執行最後 `cRand(1,10000)`

SetDuck / `BATTLE_CheckMySkillDuck()` 成功時會在這之前直接返回，因此不會誤吃 HitRight RNG；Guard / cannot-move 等來源本來就不進普通 Duck RNG 的情況也維持不消耗。

本輪不新增持久化欄位，schemaVersion 維持 27。

### V1.36 regression targets

- game.js syntax PASS
- Player attacker + normal DuckCheck：HitRight 0..0 RNG 恰好一顆
- HitRight RNG 位於 75% duck cap 後、最終 dodge RAND 前
- Enemy / Pet attacker 不額外消耗 HitRight RNG
- SetDuck 成功提前返回時不消耗 HitRight RNG
- Guard / disableDodge / cannot-move 路徑不誤吃 HitRight RNG
- 目前 HitRight=0 不改變實際 dodge threshold
- schema 27 維持不變
- V1.35 DamageCalc RNG / V1.34 AttackCount regressions unchanged
