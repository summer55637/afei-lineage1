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


## V1.37 _TAKE_ITEMDAMAGE / BATTLE_ItemCrushSeq guaranteed RNG lifecycle

固定來源仍為 `gavinlinasd/StoneAge@1f90cb6cb57c1df70f39cde77a5a8ccd98b66c56`，維持「原 C 規則優先、不猜數值」。

### Source proof

fixed `version.h` 明確啟用 `_TAKE_ITEMDAMAGE`。所有已建模的正傷害物理路徑在完成 HP / death / status 等處理後，會進：

```c
BATTLE_ItemCrushSeq( attackindex, defindex, damage )
```

而該函式第一步固定呼叫：

```c
BATTLE_ItemCrushCheck( defindex, 1 )
```

fixed `BATTLE_ItemCrushCheck(..., flg=1)` 一進函式就先執行：

```c
Crushs = rand()%100;
```

再依 0..99 決定從 BODY / HEAD / DECORATION1 / DECORATION2 哪一格開始找裝備。

這顆 RNG 的關鍵是：它發生在「確認受擊者是不是 Player」與「找到有效裝備」之前。因此只要最後物理 damage > 0：

- Player 被打：吃一顆
- Pet 被打：仍吃一顆
- Enemy 被打：仍吃一顆
- 受擊者沒有任何可損壞防具：仍吃一顆

### What is intentionally NOT guessed

若真的找到可損壞裝備，`BATTLE_ItemCrush()` 還可能再依：

- `ITEM_DAMAGECRUSHE`
- `ITEM_MAXDAMAGECRUSHE`
- 實際裝備位置與 item runtime

執行後續耐久扣除 RAND。

目前 Web 尚未有完整、可由來源可靠還原的 Player 裝備耐久 runtime，因此 V1.37 **不建立假的耐久值，也不補第二顆條件式 RNG**。本輪只恢復無論裝備是否存在都能確定的第一顆 `rand()%100`。

### Web correction

新增 `sourceBattleFinalizeItemCrushRng(r)`：

- 只有最終正傷害物理 hit 才執行
- dodge / miss / damage <= 0 不消耗
- 每個 hit 最多執行一次，避免 wrapper 重複結算
- 使用 `cRand(0,99)` 對應 fixed `rand()%100`
- 僅記錄 `sourceItemCrushDefenderRoll`，不虛構實際裝備損壞

本輪已接到目前可達的主要物理生命週期：

- Player / Pet 普通攻擊 Enemy
- Enemy 普通近戰
- BOW / BOOMERANG / BOUNDTHROW / BREAKTHROW 多段
- BecomeFox ranged physical loop
- Player / Pet / Enemy Counter
- confusion physical hit / counter
- Combo：每一段各自一顆；最後一段特別保持在合計 HP / death / critical-Ultimate RNG 後
- StatusChange：狀態命中 RNG 先完成，再進 ItemCrush RNG
- GuardBreak / GuardBreak2
- ModifyAttack / MdfyAttack / Sonic / Gyrate / Retrace
- AttackCrazed / Tear / Regret / WildViolent / Continuation
- BattleTimid / 2BattleTimid / MpDamage / ToothCrushe / Lighttakeed
- DamageToHp / DamageToHp2
- FIREKILL physical segment
- FallGround：保留來源特例，落馬 RAND 先於 ItemCrush

### Ordering notes

普通 `BATTLE_Attack()` 的關鍵順序維持：

1. AttackSeq / DamageCalc
2. DamageSub / HP
3. DamageWakeUp
4. death + critical Ultimate 50% RAND
5. status-attack RNG（若有）
6. ItemCrush defender `rand()%100`

`BATTLE_Counter()` 則在 death block 後直接進 ItemCrush。

`BATTLE_Combo()` 每段都會跑 ItemCrush；最後一段因為該段同時套用合計傷害，所以 V1.37 特別把最後一顆 ItemCrush RNG 放在合計 HP / death 判定之後。

本輪不新增持久化欄位，schemaVersion 維持 27。

### V1.37 regression targets

- game.js syntax PASS
- positive physical hit => exactly one guaranteed defender ItemCrush RNG
- dodge / miss / damage<=0 => zero ItemCrush RNG
- weapon multi-hit => each successful positive hit owns one ItemCrush RNG
- StatusChange => status RNG before ItemCrush RNG
- BREAKTHROW paralysis RNG before ItemCrush RNG
- FallGround RAND before ItemCrush RNG
- Counter => ItemCrush before any next counter iteration
- Combo last segment => death/critical-Ultimate RNG before final ItemCrush RNG
- no guessed durability values / no conditional durability-loss RAND
- schema 27 unchanged
- V1.36 HitRight / V1.35 DamageCalc / V1.34 AttackCount regressions unchanged


## V1.38 special physical critical-death Ultimate RNG target type

固定來源仍為 `gavinlinasd/StoneAge@1f90cb6cb57c1df70f39cde77a5a8ccd98b66c56`，維持「原 C 規則優先、不猜數值」。

### Source distinction

V1.37 回歸 ItemCrush 時重新比對死亡收尾，確認普通 `BATTLE_Attack()` 與部分特殊物理函式的 critical-death Ultimate 條件其實不同。

普通 `BATTLE_Attack()` / `BATTLE_Counter()` 使用：

```c
CHAR_getInt(defindex, CHAR_WHICHTYPE) != CHAR_TYPEPLAYER
```

所以普通物理攻擊會心打死 Pet 或 Enemy，都可能消耗 `RAND(1,100) < 50`。

但 fixed 的：

- `BATTLE_DefDieType()`（`BATTLE_S_AttackDamage` 共用）
- `BATTLE_S_GBreak()`
- `BATTLE_S_GBreak2()`
- `BATTLE_S_FallGround()`
- `BATTLE_Combo()`

條件是：

```c
CHAR_getInt(defindex, CHAR_WHICHTYPE) == CHAR_TYPEENEMY
```

也就是只有死亡目標真的是 Enemy，才做 critical 50% RNG；Pet 死亡不抽。

### Previous web mismatch

`sourceTrackDamageSubUltimate()` 本來預設採普通 `BATTLE_Attack` 的「非 Player」條件。

因此 Enemy 使用上述特殊技能打死 Active Pet 且該擊為 critical 時，Web 會錯誤多消耗：

```
cRand(1,100)
```

這不只影響 Ultimate 標記，也會把後面的 ItemCrush、技能追加判定與下一次戰鬥 RNG 全部向後錯一顆。

### V1.38 correction

現有 `sourceTrackDamageSubUltimate()` 已支援 `result.ultimateCriticalEnemyOnly`，V1.38 將正確旗標接到：

- 所有 `BATTLE_S_AttackDamage` Web 路徑
  - ModifyAttack / MdfyAttack
  - Sonic / Sonic2
  - Tear
  - BattleTimid / 2BattleTimid
  - Lighttakeed
  - DamageToHp / DamageToHp2
  - MpDamage
  - ToothCrushe
- Regret / Regret2 的自訂雙段 helper
- GuardBreak
- GuardBreak2
- FallGround

`BATTLE_Combo` 在先前版本本來就已使用 `ultimateCriticalEnemyOnly:true`，保持不變。

普通 `BATTLE_Attack`、Counter、Gyrate（實際逐目標呼叫 `BATTLE_Attack`）、一般 ranged weapon loop 則繼續使用「非 Player」規則，因此 Pet critical death 仍會依來源消耗 50% RNG。

### Reachable effect

目前 Enemy 技能的正常敵對目標是 Player / Active Pet，因此這輪最直接的可達修正是：

- 特殊 AttackDamage / GBreak / FallGround critical 打死 Active Pet：
  - 原 C：不抽 50% Ultimate RNG
  - V1.37 Web：可能誤抽
  - V1.38：不再誤抽

FallGround 的可達 RNG 順序因此也回到：

1. AttackSeq / Damage
2. HP / death deterministic work
3. FallGround `RAND(0,100)`
4. （只有目標為 CHAR_TYPEENEMY 才可能有 critical-death 50% RAND；正常 Enemy→Player/Pet 不會）
5. ItemCrush defender `rand()%100`

本輪不新增 save 欄位，schemaVersion 維持 27。

### V1.38 regression targets

- game.js syntax PASS
- BATTLE_S_AttackDamage critical-kill Pet => no Ultimate 50% RNG
- GBreak / GBreak2 critical-kill Pet => no Ultimate 50% RNG
- FallGround critical-kill Pet => Fall RAND then ItemCrush, no extra Ultimate RNG
- ordinary BATTLE_Attack critical-kill Pet => still keeps 50% RNG
- Counter critical-kill Pet => still keeps 50% RNG
- Gyrate -> BATTLE_Attack critical-kill Pet => still keeps 50% RNG
- Combo remains Enemy-only as before
- V1.37 ItemCrush guaranteed RNG unchanged
- schema 27 unchanged


## V1.39 BATTLE_S_AttackDamage tail RNG lifecycle

固定來源仍為 `gavinlinasd/StoneAge@1f90cb6cb57c1df70f39cde77a5a8ccd98b66c56`，維持「原 C 規則優先、不猜數值」。

### 1. TIMID / 2TIMID damage == 1 still consumes RNG

fixed `BATTLE_S_AttackDamage()` 在完成 DamageSub、death 與通用 ItemCrush 後才進技能 switch。

若最後 `damage <= 0`，TIMID 類 command 會先被改成 `skill_type = -1`，因此不進 TIMID switch。

但只要 `damage > 0`，TIMID switch 會執行。原碼：

```c
int timid = rand()%100;
if( timid < 15 && damage > 1 ) {
    ...
}
```

2TIMID 原碼：

```c
if( rand()%100 < timid && damage > 1 ) {
    ...
}
```

C 的 `&&` 是由左到右求值，所以：

- damage <= 0：不進技能 switch，不抽
- damage == 1：**仍先抽 rand()%100**，但效果必定不能成立
- damage > 1：抽 rand()%100，再依成功率決定效果

V1.38 Web 把 RNG 包在 `damage > 1` 裡，因此 1 傷害時少吃一顆 RNG。V1.39 改成 `damage > 0` 就先抽，再把 `damage > 1` 留在效果條件裡。

### 2. TOOTHCRUSHE has a second ItemCrushCheck RNG

fixed `BATTLE_S_AttackDamage()` 對所有正傷害先跑：

```c
BATTLE_ItemCrushSeq(attackindex, defindex, damage)
```

在 V1.37 已還原其中受擊方 `BATTLE_ItemCrushCheck(defindex,1)` 的第一顆 `rand()%100`。

但 `BATTLE_COM_S_TOOTHCRUSHE` 隨後又呼叫：

```c
BATTLE_S_ToothCrushe(...)
```

而 `BATTLE_S_ToothCrushe()`：

```c
if (CHAR_getInt(defindex, CHAR_WHICHTYPE) != CHAR_TYPEPLAYER)
    return;

if ((crushindex = BATTLE_ItemCrushCheck(defindex,1)) >= 0) {
    ...
}
```

所以當目標是 Player 且 damage > 0：

1. 通用 ItemCrushSeq 先吃一顆 `rand()%100`
2. ToothCrushe 再吃第二顆 `rand()%100`
3. 第二次才依部位搜尋真正裝備
4. 若沒有裝備，第二顆 RNG 仍已消耗

目前 Web 沒有可可靠對回原版 `ITEM_DAMAGECRUSHE / ITEM_MAXDAMAGECRUSHE` 的玩家裝備耐久資料，所以 V1.39 只還原這個**必定可確定的第二次部位選擇 RNG**，記為 `toothCrushCheckRoll`；不猜後續耐久值。

Pet 目標會在原 `BATTLE_S_ToothCrushe` 一開始直接 return，因此不吃這第二顆。

### V1.39 ordering

TIMID / 2TIMID 正傷害：

1. Damage / HP
2. special Enemy-only critical-death Ultimate RNG（若條件成立）
3. generic ItemCrush defender rand()%100
4. TIMID / 2TIMID rand()%100
5. damage > 1 時才可能產生退場／召回效果

TOOTHCRUSHE 正傷害 Player：

1. Damage / HP
2. special Enemy-only critical-death Ultimate RNG（Player 不會）
3. generic ItemCrush defender rand()%100
4. ToothCrushe second ItemCrushCheck rand()%100
5. only if real equipment exists: durability modification branch

本輪 schemaVersion 維持 27。

### V1.39 regression targets

- game.js syntax PASS
- TIMID damage=0 => no TIMID RNG
- TIMID damage=1 => one TIMID rand()%100 after generic ItemCrush
- TIMID damage>1 => same RNG plus normal success logic
- 2TIMID damage=1 => one rand()%100 even though recall cannot trigger
- TOOTHCRUSHE positive Player hit => generic ItemCrush RNG + second ToothCrushe rand()%100
- TOOTHCRUSHE positive Pet hit => generic ItemCrush RNG only
- no guessed durability values
- V1.38 special critical-death target rules unchanged
- schema 27 unchanged


## V1.40 REGRET / PROFESSION_BATTLE_StatusAttackCheck early RNG

固定來源仍為 `gavinlinasd/StoneAge@1f90cb6cb57c1df70f39cde77a5a8ccd98b66c56`，維持「原 C 規則優先、不猜數值」。

### Source proof

`REGRET / REGRET2` 在 fixed `BATTLE_S_AttackDamage()` 有特殊例外：

```c
if (damage <= 0) {
    if (skill_type != BATTLE_COM_S_SONIC &&
        skill_type != BATTLE_COM_S_SONIC2 &&
        skill_type != BATTLE_COM_S_REGRET &&
        skill_type != BATTLE_COM_S_REGRET2)
        skill_type = -1;
}
```

所以 REGRET 即使物理段最後 damage=0，仍會進技能尾段並呼叫：

```c
PROFESSION_BATTLE_StatusAttackCheck(attackindex, defindex, 12, Success)
```

更重要的是該函式第一行：

```c
int rand_num = RAND(1,100);
```

之後才依序檢查：

- status 是否有效
- target HP <= 0
- CHAR_ISDIE
- 是否已有其他異常狀態

因此這顆 RNG 的真實規則是「**呼叫就先吃**」，不是「通過前置條件才吃」。

### Previous web mismatch

舊 `enemyTryRegretDizzy()` 先做：

- 目標存在
- 目標存活
- 目標目前沒有異常

全部通過後才 `cRand(1,100)`。

因此下列情況 Web 會少吃一顆 RNG：

- REGRET 物理段直接把目標打死
- REGRET 目標本來已有其他異常
- 其他任何在原 `PROFESSION_BATTLE_StatusAttackCheck` 內部 early return 的情況

### V1.40 correction

`enemyTryRegretDizzy()` 現在一進函式就先：

```js
const roll=cRand(1,100);
```

再檢查 alive / existing status / success threshold。

實際眩暈效果仍只在原條件允許時成立；本輪修的是 RNG 生命週期，不放寬技能效果。

### Ordering

REGRET / REGRET2：

1. AttackSeq / Damage
2. DamageSub / HP
3. special Enemy-only critical-death Ultimate RNG（若條件成立）
4. generic ItemCrush defender rand()%100（damage>0 才有）
5. `PROFESSION_BATTLE_StatusAttackCheck` RAND(1,100) — **呼叫即消耗**
6. 再判斷目標死亡 / 已有異常 / roll success

所以：
- dodge / miss：沒有 ItemCrush，但仍有 REGRET status RNG
- positive nonlethal：ItemCrush 後再 status RNG
- lethal hit：death 處理 → ItemCrush → status RNG；status 因 HP<=0 不生效，但 RNG 已吃
- existing abnormal status：status 不生效，但 RNG 已吃

本輪 schemaVersion 維持 27。

### V1.40 regression targets

- game.js syntax PASS
- REGRET miss / dodge => still consumes one status RAND
- REGRET lethal hit => consumes status RAND after death + ItemCrush
- REGRET target with existing status => consumes RAND before early return
- successful valid target still uses the same roll for success comparison
- V1.39 TIMID / ToothCrushe RNG unchanged
- schema 27 unchanged


## V1.41 BATTLE_CounterCheckPlayer zero-rate RNG

固定來源仍為 `gavinlinasd/StoneAge@1f90cb6cb57c1df70f39cde77a5a8ccd98b66c56`，維持「原 C 規則優先、不猜數值」。

### Source proof

fixed `BATTLE_CounterCheckPlayer()` 在算完：

```c
per = CriPer * At_Soubi * 0.1 + At_Luck ...
*pPar = per;
per *= 100;
```

之後對 `per <= 0` 的處理不是 return，而是：

```c
if (per <= 0) {
    per = 1;
    *pPar = 0;
}

if (RAND(1,10000) < per) {
    flg = TRUE;
}
```

因為 `RAND(1,10000)` 的最小值是 1：

- `per <= 0` 時，實際成功率仍是 0%
- 但 **RAND 仍固定消耗一顆**
- 判定為 `1 < 1`，永遠不成立

### Previous web mismatch

舊 `battleCounterCheck()` 的 Player 分支：

```js
if(raw<=0)return {success:false,raw:0};
```

因此 Player 反擊率為 0 或負數時，Web 少消耗一顆 RNG，導致後面的：

- Counter AttackSeq
- 下一名角色行動
- 狀態判定
- ItemCrush
- AI / target RNG

全部可能向前錯一顆。

### V1.41 correction

Player 分支現在：

1. `rollPer = raw * 100`
2. 若 `rollPer <= 0`，改成 1
3. 顯示用 raw 維持 0
4. **固定執行 `cRand(1,10000) < rollPer`**

所以：
- raw <= 0：吃 RNG，但必定失敗
- raw > 0：沿用原本嚴格 `<` 判定

Pet / Enemy 分支沒有改動，仍依 fixed `BATTLE_CounterCheckPet()` 使用：
- per <= 0 => 內部 per=1
- `RAND(1,10000) <= 1`
- 真正保留 1/10000 下限

這個「Player 0%、Pet 仍有 1/10000」是原 C 本身的不對稱行為，V1.41 保留。

本輪 schemaVersion 維持 27。

### V1.41 regression targets

- game.js syntax PASS
- Player counter raw<=0 => consumes exactly one RAND, success always false
- Player counter raw>0 => strict RAND < threshold unchanged
- Pet/Enemy counter raw<=0 => existing 1/10000 <= behavior unchanged
- throw-weapon blocked counter => still returns before RNG
- V1.40 REGRET status RNG unchanged
- V1.39 TIMID / ToothCrushe RNG unchanged
- schema 27 unchanged


## V1.42 BATTLE_BattleModel_ATTACK alive-only ItemCrush RNG

固定來源仍為 `gavinlinasd/StoneAge@1f90cb6cb57c1df70f39cde77a5a8ccd98b66c56`，維持「原 C 規則優先、不猜數值」。

### Source proof

fixed `BATTLE_BattleModel_ATTACK()` 和普通 `BATTLE_Attack()` 的 ItemCrush 呼叫條件不同。

BattleModel 在完成 AttackSeq / DamageSub / return-state / wake-up 後：

```c
if (CHAR_getInt(iDefindex, CHAR_HP) <= 0) {
    // death / critical Ultimate
}
else {
    BATTLE_ItemCrushSeq(charaindex, iDefindex, iDamage);

    if (iDamage > 0 &&
        BATTLE_StatusAttackCheck(...)) {
        ...
    }
}
```

因此 BattleModel 的規則是：

- **目標死亡：完全不呼叫 ItemCrushSeq**
- **目標存活：一定呼叫 ItemCrushSeq**
- ItemCrushSeq 在這裡沒有 `damage > 0` 外層條件
- 所以 DODGE / MISS / 0 damage 只要目標仍活著，也照樣進 ItemCrushSeq

### Why one guaranteed RNG still exists

fixed `BATTLE_ItemCrushSeq()` 先做：

```c
BATTLE_ItemCrushCheck(defender, 1)
```

`flg=1` 的 `BATTLE_ItemCrushCheck()` 一進去固定：

```c
Crushs = rand()%100;
```

之後才找 BODY / HEAD / DECORATION1 / DECORATION2。

ItemCrushSeq 接著還會呼叫：

```c
BATTLE_ItemCrushCheck(attacker, 2)
```

但 `flg=2` 只直接檢查 CHAR_ARM，**沒有 RNG**。因此在沒有可靠裝備耐久 runtime 的現況下，可確定的固定 RNG 仍只有受擊方這一顆。

### Previous Web mismatch

V1.37 的通用 `sourceBattleFinalizeItemCrushRng()` 正確描述普通物理路徑：

- positive damage => defender rand()%100
- dodge / miss / damage<=0 => no ItemCrush RNG

但 `enemyApplyDirectGuardianSkillHit()` 是共用 helper，BattleModel 也經過它，因此 V1.41 前會錯成：

- BattleModel 致死正傷害 => **誤吃一顆 ItemCrush RNG**
- BattleModel 存活但 DODGE / MISS / 0 damage => **少吃一顆 ItemCrush RNG**

兩邊都會讓後續 BattleModel 攻擊物件與整場 RNG 序列錯位。

### V1.42 correction

新增 `sourceBattleModelAliveItemCrushRng(r,targetDesc)`，只服務 BattleModel：

- actual target 已死亡 => 0 顆
- actual target 存活 => 固定 1 顆 `cRand(0,99)`
- 不看 dodge / miss / damage
- 記錄到既有 `sourceItemCrushDefenderRoll`
- 不虛構後續耐久扣除

`enemyApplyDirectGuardianSkillHit()` 增加可選的 `finalizeItemCrush:false`，BattleModel 先關掉共用正傷害 ItemCrush，再依自己的 source lifecycle 結算。

FIREKILL 等其他使用同 helper 的路徑維持預設行為，不受影響。

### Status check clarification

本輪也重新確認 BattleModel 用的是普通：

```c
BATTLE_StatusAttackCheck(...)
```

不是 REGRET 用的：

```c
PROFESSION_BATTLE_StatusAttackCheck(...)
```

所以 BattleModel 的 existing-status early return 本來就應該發生在 status RNG 之前；V1.40 的「先抽 RNG」規則**不能套到 BattleModel**。

BattleModel 狀態判定仍維持：

1. target 必須存活
2. damage > 0
3. ItemCrush RNG 已完成
4. existing abnormal status 先拒絕
5. 通過後才做 StatusAttackCheck RAND

### V1.42 regression targets

- game.js syntax PASS
- BattleModel lethal positive hit => no ItemCrush RNG
- BattleModel surviving positive hit => exactly one defender rand()%100
- BattleModel surviving MISS / DODGE / 0 damage => still exactly one defender rand()%100
- BattleModel ItemCrush RNG occurs before optional status RNG
- Guardian substitution uses actual protected target for alive/death decision
- generic BATTLE_Attack positive-hit ItemCrush behavior unchanged
- FIREKILL shared direct helper unchanged by default
- REGRET PROFESSION status RNG behavior unchanged
- schema 27 unchanged


## V1.43 BATTLE_BattleModel random-target RNG interleaving

固定來源仍為 `gavinlinasd/StoneAge@1f90cb6cb57c1df70f39cde77a5a8ccd98b66c56`，維持「原 C 規則優先、不猜數值」。

### Source order

fixed `BATTLE_BattleModel()` 先建立一次初始 `iToList`。

當 `iObjectNum >= initial target count` 時：

```c
for (i=0; i<iObjectNum; i++) {
    if (iToList[i] == -1) break;
    AAttackObject[i].target = iToList[i];
    BATTLE_BattleModel_ATTACK(...);
}

for (; i<iObjectNum; i++) {
    AAttackObject[i].target = iToList[RAND(0,i0-1)];
    BATTLE_BattleModel_ATTACK(...);
}
```

關鍵是第二段迴圈每一次都是：

1. 抽一顆 `RAND(0,i0-1)`
2. 立刻執行該分身的完整 `BATTLE_BattleModel_ATTACK`
3. 下一個多餘分身才再抽下一顆 target RNG

所以 target RNG 會和下列 RNG **交錯**：

- Duck / SetDuck
- Critical
- DamageCalc
- GuardAdjust
- DamageCalc 的 fixed 裝備 RNG
- critical-death Ultimate
- V1.42 BattleModel ItemCrush
- BattleModel StatusAttackCheck

### Previous Web mismatch

V1.42 前 Web 先建立完整 `sequence`：

```js
while(sequence.length < spec.objectNum)
  sequence.push(initial[cRand(...)]);
```

然後才開始逐一攻擊。

例如 2 個初始目標、5 個 AttackObject：

來源：

```
attack target0
attack target1
target RNG #1 -> attack
target RNG #2 -> attack
target RNG #3 -> attack
```

舊 Web：

```
target RNG #1
target RNG #2
target RNG #3
attack target0
attack target1
attack
attack
attack
```

因此雖然抽 target 的顆數相同，整場 RNG 序列的位置完全不同。

### V1.43 correction

BattleModel 的 `sequence` 現在只先建立：

- 固定 initial target entries
- 額外 AttackObject 的 random placeholders

真正進 attack loop 時，遇到 random placeholder 才：

```js
randomTargetRoll=cRand(0,initial.length-1);
target=initial[randomTargetRoll];
```

然後立即執行該次攻擊。

這也自然保留原 C 的另一個行為：

- 隨機池是 command 開始時建立的原始 `iToList`
- 前面的攻擊即使已把某目標打死，後面的 RAND 仍可能再次抽到那個原始 slot
- 抽中後 `BATTLE_BattleModel_ATTACK` 會因 TargetCheck 失敗直接 return
- 但「選到死目標的那顆 target RNG」本身仍已消耗

Web 現在同樣會先抽，再以即時 `battleStatusDescAlive()` 決定是否跳過攻擊。

當 `objectNum < initial target count` 時，來源沒有額外 target RAND；既有固定／coverAll 流程保持不變。

本輪 schemaVersion 維持 27。

### V1.43 regression targets

- game.js syntax PASS
- BattleModel extra target RNG is drawn inside the attack loop, not during plan construction
- initial targets attack before first extra target RNG
- each extra target RNG is immediately followed by that object's attack path
- random pool remains the command-start initial target list
- a later random selection may select a target killed by an earlier object; RNG still consumed, attack skipped
- objectNum < initial count => no added target RNG
- V1.42 alive-only BattleModel ItemCrush lifecycle unchanged
- schema 27 unchanged


## V1.44 BECOMEFOX post-attack rand()%100 evaluation order

固定來源仍為 `gavinlinasd/StoneAge@1f90cb6cb57c1df70f39cde77a5a8ccd98b66c56`，維持「原 C 規則優先、不猜數值」。

### Source proof

fixed `battle.c` 在普通 BATTLE_Attack 與最多 5 次 Counter 鏈完成後，才處理 BECOMEFOX：

```c
if (
    COM == BATTLE_COM_S_BECOMEFOX
    && ReturnData != BATTLE_RET_MISS
    && ReturnData != BATTLE_RET_DODGE
    && ReturnData != BATTLE_RET_ALLGUARD
    && ReturnData != BATTLE_RET_ARRANGE
    && BATTLE_TargetCheck(battleindex, defNo)
    && (rand()%100 < 31)
    && targetType != CHAR_TYPEPLAYER
    && targetPetFlg != 0
    ...
) {
    // apply fox transform
}
```

C 的 `&&` 由左到右短路求值，因此順序非常重要：

1. 先確認攻擊 return code 不是 MISS / DODGE / ALLGUARD / ARRANGE
2. 再確認**原始 defNo** 經 Counter 鏈後仍存活
3. **接著立刻執行 rand()%100**
4. 只有 roll < 31 才繼續檢查 target type
5. 再檢查 `CHAR_WORK_PETFLG != 0`

### Reachable current-data behavior

目前 Enemy BECOMEFOX 的敵對目標只有 Player / Active Pet：

- Player：在 RNG 之後才因 `CHAR_TYPEPLAYER` 被排除
- 玩家擁有的 Active Pet：type 條件可過，但其 `CHAR_WORK_PETFLG` 來源初始化為 0，因此仍被排除

所以「變狐效果本身不可達」不代表 RNG 不可達。

只要前面的普通攻擊符合 return-code 條件，而且原始目標在整條 Counter 鏈後仍活著，fixed source 就會消耗：

```
rand()%100
```

即使之後必然因 type / PETFLG 失敗。

### Previous Web mismatch

舊 `performEnemyBecomeFox()` 因已知玩家側 transform 條件永遠不成立，直接只執行普通物理攻擊，完全跳過後置 RNG。

這會使每次合格的 BECOMEFOX 行動少一顆 RNG，進而影響下一名角色的：

- target selection
- Duck / Critical
- DamageCalc
- ItemCrush
- status / AI RNG

### V1.44 correction

`performEnemyBecomeFox()` 現在：

1. 先完整執行 `performEnemyPrimaryAttack()`，包含來源 Counter 鏈
2. 依原始 target 檢查 Counter 後是否仍存活
3. 排除 Web 可表達的 DODGE / MISS（ALLGUARD 的 0 傷害目前落在 miss；ARRANGE runtime 尚不可達）
4. 通過後固定執行 `cRand(0,99)`
5. 記錄 `foxRoll` / `foxRollPassed`
6. 然後才套用現有來源資料邊界：Player type 或 Player-owned Pet 的 PETFLG=0 使 transform 不成立

Guardian 代擋不改變 source 的原目標 defNo 存活檢查；若原目標是 Player 且忠犬承傷，只要 Player 在 Counter 後仍活著，仍會依來源消耗 fox RNG。

### BECOMEPIG contrast

同一段 source 的 BECOMEPIG 順序不同：

- 先檢查 target 必須是 `CHAR_TYPEPLAYER`
- 再進技能 block
- block 內才 `rand()%100 < petrate`

因此 Pet 目標不應為 BECOMEPIG 消耗該 RNG。現有 Web 的 Player-only roll 保留不動。

本輪 schemaVersion 維持 27。

### V1.44 regression targets

- game.js syntax PASS
- BECOMEFOX successful non-dodge/non-miss hit + original Player alive after Counter => one cRand(0,99)
- same with original Active Pet alive => one cRand(0,99)
- original target dead after attack / Counter => no fox RNG
- DODGE / MISS / ALLGUARD-equivalent => no fox RNG
- roll occurs only after full primary attack + Counter chain
- Player / player-owned Pet transform remains unavailable with current source data
- V1.43 BattleModel target interleaving unchanged
- schema 27 unchanged


## V1.45 common ranged weapon-loop Counter lifecycle

固定來源仍為 `gavinlinasd/StoneAge@1f90cb6cb57c1df70f39cde77a5a8ccd98b66c56`，維持「原 C 規則優先、不猜數值」。

### Source proof

fixed `battle.c` 的 common direct-attack block 對 BOW / BOUNDTHROW / BREAKTHROW 仍共用同一個外層流程：

```c
for (attack_count = 0, k = 0;;) {
    ...
    if (attack_flg) {
        ContFlg = BATTLE_Attack(...);
        if (++attack_count >= attack_max) break;
        if (attacker HP <= 0) {
            ContFlg = FALSE;
            break;
        }
    }

    defNo = aDefList[++k];
    if (defNo < 0) break;

    if (gWeponType != ITEM_BOW) {
        if ((defNo = BATTLE_TargetAdjust(...)) < 0) break;
    }
    ...
}

gBattleDamageModyfy = 1.0;
gBattleDuckModyfy = 0;

for (k = 0; k < 5 && ContFlg == TRUE; k++) {
    ...
    ContFlg = BATTLE_Counter(...);
}
```

所以 ranged weapon loop **不是打完就 return**；只要最後一次 `BATTLE_Attack()` 的 `ContFlg` 仍允許，而且外層 `defNo` 還有效，就會進 Counter 鏈。

### Important defNo lifetime

來源有兩種不同結束方式：

1. `++attack_count >= attack_max`  
   立即 break，還沒有讀下一個 `aDefList`。  
   此時 `defNo` 仍是最後一次真正攻擊的目標，可進 Counter。

2. 尚未達到 attack_max，但：
   - BOW 的 target list 先走到 -1，或
   - 非 BOW 的 `BATTLE_TargetAdjust()` 回傳 < 0

   此時來源已把 `defNo` 換成無效值後才 break。  
   **不能拿上一個成功命中的舊目標去補 Counter。**

### Previous Web mismatch

V1.44 的：

- `performEnemyBowWeaponAttack()`
- `performEnemyThrowWeaponAttack()`

只完成 weapon hit loop 就 return，沒有把最後一擊接回 common Counter loop。

受影響的已接來源路徑包括：

- 普通 BOW / BOUNDTHROW / BREAKTHROW 攻擊
- `BATTLE_COM_S_STATUSCHANGE`
- `BATTLE_COM_S_RENZOKU`

### V1.45 correction

兩個 weapon helper 現在都回傳：

```js
sourceCounterReady
```

只在：

- `attackCount >= attackMax`
- 至少真的執行過一發 `BATTLE_Attack`
- attacker 仍存活

時為 true。

新增：

```js
sourceEnemyFinalizeWeaponSequenceCounter(...)
```

它只用最後一個成功 hit 的 target / result 接回既有 Counter chain。

#### STATUSCHANGE

StatusChange 的異常是在 `BATTLE_Attack()` 裡、外層 Counter loop 之前套用。

因此 ranged StatusChange 另帶：

```js
{requireCanMove:true}
```

若最後目標被睡眠／石化／麻痺／魔障等變成不能行動，就不開始反擊，與 fixed `BATTLE_Counter()` 的 CanMove 條件一致。

#### BOOMERANG

普通 BOOMERANG 是獨立 `BATTLE_COM_BOOMERANG` case，來源打完整排後直接 reset / FF / break，**不進 common Counter loop**。

因此 V1.45 不改 `performEnemyBoomerangWeaponAttack()`。

### V1.45 regression targets

- game.js syntax PASS
- ordinary BOW / BOUNDTHROW / BREAKTHROW that reaches attack_max can enter one post-loop Counter chain
- BOW list exhaustion before attack_max does not counter stale last target
- non-BOW TargetAdjust exhaustion before attack_max does not counter stale last target
- only the final successful BATTLE_Attack result controls the Counter chain
- STATUSCHANGE final disabling status suppresses counter
- RENZOKU ranged path counters only after all segments
- BOOMERANG remains no-counter special case
- schema 27 unchanged


## V1.46 WILDVIOLENT common weapon-loop restoration

固定來源仍為 `gavinlinasd/StoneAge@1f90cb6cb57c1df70f39cde77a5a8ccd98b66c56`，維持「原 C 規則優先、不猜數值」。

### Source proof

fixed `battle.c` 對 `BATTLE_COM_S_WILDVIOLENTATTACK` 的前置只做：

```c
attack_max = RAND(3,10);
gDamageDiv = attack_max;
gBattleDuckModyfy = CHAR_GETWORKINT_HIGH(charaindex, CHAR_WORKBATTLECOM3);
```

之後 command 仍落入同一個 common direct-attack group，並呼叫：

```c
BATTLE_TargetListSet(charaindex, attackNo, aDefList);
```

因此 WILDVIOLENT 不是獨立的「固定目標 N 次簡化攻擊」。

### Weapon behavior inherited from the common loop

#### BOW

`BATTLE_TargetListSet()` 對實際 BOW 仍建立 `aBowW` 順序。

WILDVIOLENT 的 `RAND(3,10)` 會覆寫原先的 weapon AttackNum，所以：

- target ordering = BOW / aBowW
- maximum successful attacks = WILDVIOLENT count
- each positive hit = damage / WILDVIOLENT count
- dodge modifier = WILDVIOLENT option

#### BOUNDTHROW / BREAKTHROW

仍走 common throw loop。

BREAKTHROW 在 actor 開始時已先設定：

```c
gBattleStausChange = BATTLE_ST_PARALYSIS;
```

WILDVIOLENT 沒有覆寫這個 status，因此每個符合條件的投石命中仍可走原麻痺 StatusAttackCheck。

#### BOOMERANG

只有：

```c
case BATTLE_COM_ATTACK:
    if (gWeponType == ITEM_BOOMERANG)
        COM = BATTLE_COM_BOOMERANG;
```

會轉成特殊整排回力標 command。

WILDVIOLENT 本身不是 plain ATTACK，所以持回力標時**不會**進 `BATTLE_COM_BOOMERANG`；它仍在 common loop 依 WILDVIOLENT count 連打原目標。

### Previous Web mismatch

V1.45 前 `performEnemyWildViolent()` 自己建立一條簡化 loop，直接：

- Player => `enemyAttackResult()`
- Pet => `enemyAttackPetResult()`

因此漏掉：

- BOW 的 aBowW target list
- BOUND/BREAKTHROW 的既有 weapon lifecycle
- BREAKTHROW 每段可觸發的來源麻痺
- 非投擲武器對 Player 的 Guardian substitution

### V1.46 correction

WILDVIOLENT 現在先固定消耗：

```js
count = cRand(3,10)
```

然後建立共同 attack options：

```js
damageDivisor: count
duckBonusPercent: duckBonus
```

#### BOW / BOUNDTHROW / BREAKTHROW

直接複用 V1.45 已對齊的 weapon helpers，並以：

```js
attackMaxOverride: count
```

確保不重新抽 weapon AttackNum。

完成後只接**一次** V1.45 post-loop Counter lifecycle。

#### Melee / skill-held BOOMERANG

維持逐段 common TargetAdjust 行為，但 Player target 改走：

```js
resolveEnemyDirectAttackToPlayer(...)
```

因此重新取得 fixed `BATTLE_AttackSeq()` 的 Guardian 時點：

1. 原目標先 DuckCheck
2. 命中後才 GuardianCheck
3. Guardian 成立後用 Guardian 自身防禦重算傷害
4. 該段 `ContFlg` 因 Guardian 關閉
5. 全部段數結束後才依最後一段結果判斷 Counter

### gDamageDiv clarification

本輪也重新確認 fixed `BATTLE_Counter()` 自己在反擊 AttackSeq 前做：

```c
gDamageDiv = 1.0;
```

所以 WILDVIOLENT 的 `gDamageDiv = attack_max` 不會把後面的 Counter 傷害再除以段數。

Web 反擊維持既有 `counterScaledResult()`，不額外帶 WILDVIOLENT divisor。

### V1.46 regression targets

- game.js syntax PASS
- WILDVIOLENT still consumes exactly one cRand(3,10) after primed weapon AttackNum lifecycle
- BOW uses aBowW with attackMaxOverride = WILDVIOLENT count
- BOUNDTHROW uses common repeated-target / TargetAdjust loop
- BREAKTHROW keeps per-hit paralysis lifecycle
- skill-held BOOMERANG does not enter special BOOMERANG row command
- melee/common Player hit can trigger Guardian substitution
- no Counter occurs between WILDVIOLENT segments
- only final hit / final valid defNo controls post-loop Counter
- Counter damage is not divided by WILDVIOLENT count
- V1.45 ranged Counter lifecycle remains intact
- schema 27 unchanged


## V1.47 ATTCRAZED TargetListSet RNG pre-roll lifecycle

固定來源仍為 `gavinlinasd/StoneAge@1f90cb6cb57c1df70f39cde77a5a8ccd98b66c56`，維持「原 C 規則優先、不猜數值」。

### Source proof: all target RNG happens before attacks

fixed `BATTLE_TargetListSet()` has a dedicated ATTCRAZED branch:

```c
n = CHAR_GETWORKINT_HIGH(charaindex, CHAR_WORKBATTLECOM3);

for (i=defsub; i<deftop; i++) {
    if (BATTLE_TargetCheck(battleindex, i) == FALSE) continue;
    plive[j++] = i;
}

for (i=0; i<n; i++) {
    pList[i] = plive[RAND(0,j-1)];
}
pList[i] = -1;
return;
```

This function runs before the common attack loop.

Therefore all `n` random target selections are consumed consecutively **before**:

- Duck
- Critical
- DamageCalc
- ItemCrush
- per-hit status / other attack RNG

V1.46 Web instead called `enemyRandomPlayerSideTarget()` inside every hit, interleaving target RNG with attack RNG.

### Source quirk: non-BOW pList[0] is rolled but unused

The common direct block enters with `defNo` still holding the original `CHAR_WORKBATTLECOM2`.

For non-BOW:

```c
defNo = BATTLE_TargetAdjust(...);   // original COM2
...
BATTLE_Attack(..., defNo);          // first hit

defNo = aDefList[++k];              // first read is pList[1]
```

So ATTCRAZED non-BOW does something unusual:

- `pList[0]` target RNG is still consumed during TargetListSet
- its selected target is **not used**
- first attack uses original COM2 after TargetAdjust
- second attack starts at `pList[1]`

This source bug is intentionally preserved.

### BOW differs

The common block has a BOW preamble that finally does:

```c
defNo = aDefList[0];
```

Therefore BOW ATTCRAZED uses:

- first hit = pre-rolled `pList[0]`
- second hit = `pList[1]`
- etc.

Later BOW planned slots are checked with `BATTLE_TargetCheck` only. If an earlier attack killed a target that appears again later in the pre-rolled list, that later slot is skipped without a replacement target RNG.

### Non-BOW dead planned target

For segments after the first, non-BOW restores the pre-rolled raw target and then executes `BATTLE_TargetAdjust()`.

If that target died or became invalid after an earlier segment, the fixed source may call `BATTLE_DefaultAttacker()` at that later time, adding a new fallback target RNG **after** the pre-roll block.

V1.47 mirrors this distinction:

- all ATTCRAZED planned target RNG is consumed up front
- BOW dead planned slot => skip
- non-BOW dead planned slot => current DefaultAttacker fallback

### Counter lifetime

ATTCRAZED sets `attack_max = n`.

Only when the number of actual `BATTLE_Attack()` calls reaches `attack_max` does the source break before loading the next aDefList entry, leaving the final valid `defNo` for Counter.

If BOW skips enough dead planned slots that actual `attack_count < attack_max`, source eventually loads the `-1` sentinel and does not counter the stale previous target.

V1.47 records `sourceCounterReady` only when actual hits reach `count`.

### Current battle-slot mapping

The web single-player battle side maps:

- Player => source slot 0
- Active Pet => source slot 5

Both are inside the fixed ATTCRAZED scan `0..8`, and `enemyPlayerSideLivingTargets()` returns them in the same ascending source-slot order while excluding EarthRound-hidden pets.

No extra slot/value is invented.

### V1.47 regression targets

- game.js syntax PASS
- exactly count ATTCRAZED target cRand calls happen before the first attack RNG
- non-BOW planned target index 0 is rolled but not used
- non-BOW first attack still uses original COM2 / TargetAdjust
- BOW first attack uses planned target index 0
- later BOW dead planned target is skipped without fallback target RNG
- later non-BOW dead planned target uses DefaultAttacker fallback at execution time
- Counter only when actual hit count reaches attack_max
- V1.46 WildViolent common weapon loop unchanged
- schema 27 unchanged


## V1.48 manual common-direct Guardian substitution

固定來源仍為 `gavinlinasd/StoneAge@1f90cb6cb57c1df70f39cde77a5a8ccd98b66c56`，維持「原 C 規則優先、不猜數值」。

### Source scope

The following connected skills ultimately call fixed `BATTLE_Attack()` / `BATTLE_AttackSeq()` rather than a calc-only special-damage caller:

- `BATTLE_COM_S_STATUSCHANGE`
- `BATTLE_COM_S_RENZOKU`
- `BATTLE_COM_S_ATTCRAZED`
- `BATTLE_COM_S_RETRACE`
- `BATTLE_COM_S_GYRATE`

Their Player-target hits therefore inherit normal direct-attack Guardian timing.

### Fixed BATTLE_AttackSeq Guardian timing

The source order is:

1. DuckCheck on the original target
2. if not dodged, GuardianCheck
3. if Guardian succeeds, switch damage calculation to Guardian
4. do not perform a second dodge on Guardian
5. Guardian does not inherit the original Player GUARD command
6. if Guardian-substituted damage becomes zero, source forces NORMAL / damage 1

The existing `resolveEnemyDirectAttackToPlayer()` already models these rules.

V1.48 extends it with an optional attacker override so RETRACE's second hit can still use its fixed `FIXSTR + 20%` attack while preserving Guardian timing.

### STATUSCHANGE ordering

fixed `BATTLE_Attack()` changes local `defindex` to Guardian before later hit effects.

Its relevant order is:

```
AttackSeq / Guardian
DamageSub
DamageWakeUp
StatusAttackCheck + status write
ItemCrushSeq
return to outer common loop
Counter loop
```

Therefore when a Player is protected by Guardian:

- physical damage lands on Guardian
- StatusAttackCheck uses Guardian stats
- successful poison/sleep/stone/etc. is written to Guardian
- ItemCrush also uses Guardian as defender
- outer Counter still sees Guardian's false ContFlg and does not start

V1.48 calls `enemyApplyDirectGuardianSkillHit(...,{finalizeItemCrush:false})`, applies the status to the returned actual target, then performs ItemCrush. This preserves source ordering.

### RENZOKU / ATTCRAZED

Non-ranged Player segments previously used `enemyAttackResult()`, which bypasses Guardian.

They now use `resolveEnemyDirectAttackToPlayer()`.

Ranged throw/BOW paths remain unchanged:

- BOW / BOOMERANG / BOUNDTHROW / BREAKTHROW are rejected by fixed GuardianCheck
- the existing `throwWeapon` gate keeps them non-Guardian

V1.47 ATTCRAZED target pre-roll order is unchanged.

### RETRACE

Both the first BATTLE_Attack and the optional +20% second BATTLE_Attack now use Guardian-aware Player resolution.

The original RETRACE quirk is preserved:

- follow-up chance is based only on first attack DODGE
- second BATTLE_Attack return value does **not** replace outer `ContFlg`
- final Counter loop still uses the first BATTLE_Attack result

So a Guardian on the second follow-up does not retroactively replace the first DODGE ContFlg.

### GYRATE

GYRATE is a special row loop that calls `BATTLE_Attack()` for each living slot and then immediately ends; it does not enter the common outer Counter loop.

Each Player row hit can nevertheless Guardian-substitute inside its own BATTLE_Attack.

V1.48 restores that per-hit substitution without adding any GYRATE Counter.

### V1.48 regression targets

- game.js syntax PASS
- direct resolver supports attackerOverride without changing existing callers
- STATUSCHANGE Player hit can redirect damage/status/ItemCrush to Guardian
- STATUSCHANGE status occurs before ItemCrush
- RENZOKU non-ranged Player segment can Guardian-substitute
- ATTCRAZED V1.47 target RNG pre-roll unchanged; Player hit can Guardian-substitute
- RETRACE first and optional second hit can Guardian-substitute
- RETRACE Counter still uses first result
- GYRATE Player row hit can Guardian-substitute but GYRATE still has no outer Counter
- ranged throw weapons remain Guardian-ineligible
- schema 27 unchanged


## V1.49 common-loop post-attack defNo lifecycle

固定來源仍為 `gavinlinasd/StoneAge@1f90cb6cb57c1df70f39cde77a5a8ccd98b66c56`，維持「原 C 規則優先、不猜數值」。

### Source finding

`BATTLE_COM_S_BECOMEFOX` 與 `BATTLE_COM_S_BECOMEPIG` 都先落入普通物理 common loop。
後置條件不是重新看最初 COM2，而是直接使用 loop 離開當下仍留在區域變數中的 `defNo`。

固定 common loop 的重要順序：

1. 真正呼叫 `BATTLE_Attack(attackNo, defNo)`
2. `++attack_count`
3. 若已達 `attack_max`，立即 break，`defNo` 保留最後實際攻擊目標
4. 若攻擊者死亡，同樣在載入下一格前 break
5. 否則先做 `defNo = aDefList[++k]`
6. 若新 `defNo < 0`，break 時後置 `defNo` 已是無效值
7. 非 BOW 再執行 `BATTLE_TargetAdjust`；若失敗，後置 `defNo` 同樣無效

### BOW / BOUNDTHROW / BREAKTHROW

V1.49 的 ranged common-loop 回傳額外保存 `sourcePostTarget` 與 `sourceLoopExit`：

- 達到 `attack_max` 或攻擊者死亡：後置目標保留最後一次真正攻擊的目標
- BOW 讀到 `-1` sentinel／目標表耗盡：後置目標清為 null
- 非 BOW 的 `TargetAdjust` 失敗：後置目標清為 null

這不改 V1.45 Counter；Counter 仍以最後實際 hit 為準。新增狀態只供 Counter 之後的 BECOMEFOX／BECOMEPIG 後置條件使用，也沒有新增任何 TargetAdjust RNG。

### BECOMEFOX

後置 RNG 現在依固定條件順序判定：

- 最後一次 BATTLE_Attack return 不是 MISS / DODGE / ALLGUARD / ARRANGE
- common loop 最終 `defNo` 仍通過 BATTLE_TargetCheck
- 然後才消耗 `rand()%100 < 31`

target type / WORK_PETFLG 仍位於 RNG 之後，維持 V1.44 已對齊的短路順序。

### BECOMEPIG

黑烏力化後置判定改用同一個 source final `defNo`，並補齊固定 C 明列門檻：

- 非 MISS / DODGE / ALLGUARD / ARRANGE
- 最終 `defNo` 仍存活可攻擊
- 最終目標必須是 PLAYER
- Enemy 對 Player 的現行路徑結構上已滿足不同 side
- 既有黑烏力時間 < 2000000000
- 以上都成立才抽 `rand()%100 < petrate`

因此 ranged common-loop 若最後 source defNo 是寵物，或目標表／TargetAdjust 已留下無效 defNo，不會再錯把最初玩家目標拿來抽黑烏力 RNG。

### V1.49 regression targets

- game.js syntax PASS
- parent fixed at V1.48 / 732d50ec28b349bfa98007ac19cb5bd311b52254
- BOW attack_max exit preserves final attacked target
- BOW sentinel clears post target
- BOUND/BREAK attack_max exit preserves final attacked target
- failed TargetAdjust clears post target without extra RNG
- BECOMEFOX uses source final defNo and full return-state gate
- BECOMEPIG uses source final defNo and full return-state/alive/type/cap gate
- V1.45 ranged Counter unchanged
- V1.48 Guardian logic unchanged
- schema 27 unchanged


## V1.50 RETRACE common weapon loop

固定來源：`gavinlinasd/StoneAge@1f90cb6cb57c1df70f39cde77a5a8ccd98b66c56`。

### Source finding

`BATTLE_COM_S_RETRACE` 並不是獨立單擊分支。它先設定 `CHAR_WORKRETRACE=1`，接著直接落入普通 physical common loop。

因此在進 RETRACE 前，來源已經完成：

1. `attack_max = BATTLE_GetAttackCount(charaindex)`
2. BREAKTHROW 時先設定全域 paralysis status
3. `BATTLE_TargetListSet(..., aDefList)`
4. BOW 建立 aBowW 目標表；非 BOW 的 aDefList 則重複 raw COM2

V1.49 以前的 Web `performEnemyRetrace()` 只做一個首擊與最多一個追擊，漏掉整個 weapon common-loop lifecycle。

### Per-primary RETRACE timing

固定來源在每一次 primary `BATTLE_Attack()` 返回後立即執行：

```c
if (Battle_Attack_ReturnData == BATTLE_RET_DODGE && COM == BATTLE_COM_S_RETRACE) {
    if (RAND(1,100) < 80) {
        WORKATTACKPOWER = FIXSTR + FIXSTR * 0.2;
        BATTLE_Attack(battleindex, attackNo, defNo);
    }
    Battle_Attack_ReturnData = 0;
}
```

因此：

- 每一個 primary segment 都可以各自觸發一次 RETRACE
- 只有 primary DODGE 才抽 `RAND(1,100)`
- 判定是嚴格 `<80`，成功值 1..79
- follow-up 不增加 `attack_count`
- follow-up 不會再遞迴觸發 RETRACE

### +20% attack persistence

來源不是只把 +20% 傳給第二擊，而是直接覆寫：

`CHAR_WORKATTACKPOWER = CHAR_WORKFIXSTR + CHAR_WORKFIXSTR * 0.2`

而 common loop 內沒有立即還原。

所以任一段 RETRACE 成功後：

- 該段 follow-up 使用 FIXSTR +20%
- 同一 command 後面的 primary segments 也繼續使用 FIXSTR +20%
- 不使用 petskill2 option 裡被註解掉的「攻%+100」猜值

V1.50 以 `unit.roundAttack` 保存這個來源生命週期。

### BOW

RETRACE + BOW 現在：

- 仍先消耗 aBowW 的 `RAND(0,1)`
- 依來源 10-slot 目標表順序掃描
- 無效／死亡／EarthRound hidden slot 只跳過，不 TargetAdjust
- `attack_count` 只計 primary BATTLE_Attack
- 每個真正 primary DODGE 都可獨立抽 RETRACE follow-up

### BOUNDTHROW / BREAKTHROW

非 BOW 仍把 raw COM2 放回後逐段執行 TargetAdjust。

BREAKTHROW 的全域 paralysis 狀態不會因 RETRACE 被清掉，因此：

- primary 正傷害：paralysis check → ItemCrush
- 若 primary 是 DODGE：沒有 status / ItemCrush，接著才抽 RETRACE RNG
- follow-up 正傷害：再次 paralysis check → ItemCrush

V1.50 沒有額外猜任何麻痺率；沿用既有 `sourceBreakthrowParalysis` 原 C 判定。

### BOOMERANG held during RETRACE

固定來源只有 `COM == BATTLE_COM_ATTACK` 時才把 command 轉成特殊 `BATTLE_COM_BOOMERANG`。

RETRACE 不會轉換，所以手持回力標時仍走普通 non-BOW common loop，而不是 BO 全排攻擊。
V1.50 依此保留 raw COM2 + TargetAdjust 的多段生命週期。

### Counter quirk

第二次 follow-up `BATTLE_Attack()` 的回傳值沒有寫回 `ContFlg`。

因此 common loop 結尾 Counter 仍只依「最後一個 primary BATTLE_Attack」決定。
V1.50 保留：

- follow-up critical 不覆寫 primary ContFlg
- follow-up Guardian 不覆寫 primary ContFlg
- 但 follow-up 若實際把目標打死，後續 liveness check 仍會自然阻止 Counter

### V1.50 regression targets

- game.js syntax PASS
- main parent fixed at V1.49 / a4a6548e0a48c8266698523d747a3079bacb841c
- RETRACE uses primed source AttackNum without duplicate weapon RNG
- BOW builds exactly one aBowW plan before first primary hit
- every primary DODGE consumes exactly one RAND(1,100)
- follow-up does not increment attack_count
- successful RETRACE persists FIXSTR +20% into later same-command segments
- BREAKTHROW applies status before ItemCrush on primary and follow-up
- non-BOW later segments rerun TargetAdjust from raw COM2
- BOOMERANG held by RETRACE stays common non-BOW, not special BO command
- Counter still uses last primary result, not follow-up result
- schema 27 unchanged


## V1.51 PowerBalance / Mighty / SpeedyAttack common non-ranged loop

固定來源：`gavinlinasd/StoneAge@1f90cb6cb57c1df70f39cde77a5a8ccd98b66c56`。

### Source finding

`BATTLE_COM_S_POWERBALANCE`、`BATTLE_COM_S_MIGHTY`、`BATTLE_COM_S_SPEEDYATTACK`
都位於普通 physical common direct-attack 群組。

三者在進入該群組前都已經完成：

1. `attack_max = BATTLE_GetAttackCount(charaindex)`
2. 若有效武器為 ITEM_FIST 且 AttackNum > 0，`gDamageDiv = attack_max`
3. `BATTLE_TargetListSet(..., aDefList)`
4. BOW 使用 aBowW；其他武器把 raw COM2 重複填入 aDefList

V1.50 前 BOW／BOUNDTHROW／BREAKTHROW 已透過既有 weapon helpers 跑完整 loop，
但近戰與「技能 command 下的 BOOMERANG」仍落回 `performEnemyPrimaryAttack()` 的單擊分支。

### Pre-command stat behavior remains unchanged

本輪沒有重寫已完成的能力快照：

- PowerBalance：
  `WORKATTACKPOWER = FIXSTR + int(FIXSTR * 攻% / 100)`
  `WORKDEFENCEPOWER = FIXTOUGH + int(FIXTOUGH * 防% / 100)`
- SpeedyAttack：
  PETSKILL 本體只改 `WORKDEFENCEPOWER`
- SpeedyAttack 的出手順序：
  `BATTLE_DexCalc` 使用 `(WORKQUICK + 20) * 1.3`
- Mighty：
  `gBattleDamageModyfy = option 倍率`
  `gBattleDuckModyfy = option 回避`

以上既有 V1.50 邏輯保留，只補執行段數與 TargetAdjust lifecycle。

### Non-BOW common sequence

新增 `sourceEnemyCommonNonRangedSkillSequence()`：

- 使用 actor 在 BATTLE_Battling 前置階段已抽好的 `sourceAttackMax`
- 不再次呼叫 `BATTLE_GetAttackCount`，避免多消耗武器 RNG
- 每段使用同一 raw COM2 再跑一次 `BATTLE_TargetAdjust`
- 原目標倒下／EarthRound hidden 時，後續段數才由 `BATTLE_DefaultAttacker` 消耗 fallback RNG
- `attack_count` 每次真正 `BATTLE_Attack` 後 +1
- 達 `attack_max` 時，最後 defNo 保留給 Counter
- TargetAdjust 失敗時不對 stale target 反擊

### FIST AttackNum damage divisor

固定 C 只有在「有效 CHAR_ARM 的 `BATTLE_GetAttackCount() > 0`」且武器型態是 ITEM_FIST 時，
才把 `gDamageDiv = attack_max`。

V1.51 使用既有 `actor.sourceAttackCountWeaponRoll` 判斷此來源條件：

- 有效 FIST 武器：每段在 BATTLE_Attack 後除以 AttackNum，正傷害最低 1
- Enemy 真空手：BATTLE_GetAttackCount 回 0，來源 fallback 為 1 擊，不額外套除數

### BOOMERANG skill quirk

battle.c 只有：

`COM == BATTLE_COM_ATTACK && gWeponType == ITEM_BOOMERANG`

才會把 command 改成 `BATTLE_COM_BOOMERANG`。

PowerBalance／Mighty／SpeedyAttack 都不是 plain ATTACK，因此手持回力標時：

- 不走 BO 全排攻擊
- 仍留在 common non-BOW loop
- AttackNum 可造成多個 primary segments
- 因回力標屬 throw weapon，Guardian / Counter 仍由既有 throw gate 阻擋

### Mighty per-segment modifiers

Mighty 的 `gBattleDamageModyfy` 與 `gBattleDuckModyfy` 是 common-loop globals，
因此每一個 primary segment 都使用相同倍率／回避加成。

Counter 前原 C 會把兩者重設，所以 V1.51 只把這些 attackOptions 套在 primary segments，
不污染 Counter。

### Counter

common loop 結束後只以最後一次 primary `BATTLE_Attack` 的 ContFlg / defNo 進 Counter。

V1.51：

- 只有完整達到 `attack_max` 才保留有效 final defNo 進 Counter
- 最後目標死亡、Guardian、GUARD、critical 等仍由既有 counter helpers 阻擋
- BOOMERANG／其他 throw weapon 進 counter helper 後會由 throw gate 直接結束，不額外抽 Counter RNG

### V1.51 regression targets

- game.js syntax PASS
- main parent fixed at V1.50 / 3043cd53da92c7a0acc051c39c531178c0abcfbd
- PowerBalance / Mighty / SpeedyAttack keep existing pre-command stat math
- non-BOW skill loop reuses primed sourceAttackMax without duplicate weapon RNG
- later non-BOW segments rerun TargetAdjust from raw COM2
- skill BOOMERANG stays common non-BOW and never becomes special BO row attack
- valid FIST weapon AttackNum uses source gDamageDiv lifecycle
- Mighty multiplier / duck modifier applies to every primary segment only
- Counter uses final primary result after full sequence
- BOW / BOUNDTHROW / BREAKTHROW continue through existing V1.49/V1.50 helpers
- schema 27 unchanged


