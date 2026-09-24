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

