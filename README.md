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

### fixed data 的 6 種正權重 StatusChange

重新掃 `stoneage_petskill_runtime.json` 與 `stoneage_enemy_ai.json`：

- 60 毒攻擊：`毒 turn 3 攻%-30` — 31 個 Enemy
- 61 猛毒攻擊：`毒 turn 5 攻%-50` — 26 個 Enemy
- 80 石化攻擊：`石 turn 3 攻%-30` — 48 個 Enemy
- 90 混亂攻擊：`亂 turn 3 攻%-30` — 50 個 Enemy
- 100 泥醉攻擊：`醉 turn 3 攻%-30` — 22 個 Enemy
- 110 催眠攻擊：`眠 turn 3 攻%-30` — 34 個 Enemy

六種全部是目前實際可抽到的 AI 行為。

V0.78 的 `enemyPrepareRoundAction()` 現在會在 EntrySort 前依 source option 建立本輪：

- `roundAttack`
- 若來源 option 有 `防%`，也同樣建立 `roundDefense`

目前正權重六種 StatusChange 都只有攻擊修正，但保留來源的防禦 parser，未猜任何額外數值。

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
- EarthRound 120：12 個 Enemy
- Charge release 使用 release-round FIX snapshot
- EarthRound hidden round 跳過 WEAKEN/BARRIER compliance tick
- EarthRound hidden round保留 DRUNK release boost
- EarthRound hidden round保留 FIX attribute work
- EarthRound release 仍為 final damage ×1.9，不改成 attack ×1.9
- Confusion 會中斷 Charge / EarthRound
- V0.73～V0.78 回歸標記保留
- save schema：仍為 **21**

