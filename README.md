# 阿肥石器時代放置版

《石器時代 OL》風格的 PC／手機共用純前端單機放置版。

## 目前版本

**PLAYABLE CORE V2.79**

目前主線已完成 V2.79，下一個核心開發版本待定。

> **原 C 規則優先、不猜數值**

固定原 C 基準：

`gavinlinasd/StoneAge@1f90cb6cb57c1df70f39cde77a5a8ccd98b66c56`

## V2.79 — Enemy PETFLG source parity / PetSkill boundary regression

V2.79 不猜新的戰鬥效果，而是把 fixed C 的 Enemy ENEMY_PETFLG → Web sourcePetFlg → PETSKILL_BecomeFox 這條來源鏈鎖進 regression：

- generated encounter runtime 的 enemyPetFlg 必須完整覆蓋固定 enemy1.txt 的 2,958 個 EnemyID。
- 目前 source-backed 分布為 PETFLG=0：1,557、PETFLG=1：1,401。
- makeEnemyUnit() 建立 Enemy 時直接把 sourceEnemyPetFlg(resolvedEnemyId) 帶進 unit。
- PETSKILL_BecomeFox 的原始 RAND(0,99) 與 roll<31 判定維持不變；sourcePetFlg 缺失時仍 fail-closed，不用圖號、名稱或範圍猜效果。
- 同時鎖定 582／642／643 仍是 fixed functbl 未註冊的 source-missing 邊界，不把不存在的 handler 猜出來。
- save schema 維持 30。

regression：tools/check_v279_enemy_petflg_source_parity.mjs
## V2.78 — 玩家出戰 Pet RANDOMACT「PETSKILL_StatusChange」完整狀態映射

V2.78 沿固定 C 的 `PETSKILL_StatusChange()` 繼續補玩家出戰 Pet 低忠誠 `RANDOMACT` 剩餘的通用狀態攻擊解析：

- 固定 `aszStatus[]` 的 `麻／虛／劇／障／默／煞` token 現在都能正確映射到 Web runtime 的 `paralysis／weaken／deepPoison／barrier／nocast／sars`。
- parser 改成依 option 內最早出現的固定 source token 決定狀態，因此 `劇毒` 不會再被誤判成普通 `毒`。
- `PETSKILL_StatusChange()` 的通用 `StatusTbl[i]` 路徑現在接受上述新增狀態；仍沿用 fixed `BATTLE_StatusAttackCheck(..., 40, 2.0)` 與 generic `turn + 1` lifecycle。
- 現有的專用 `PETSKILL_Weaken / Deeppoison / Barrier / Nocast` command 不改動，避免把不同 fixed function 的 stored-turn 規則混在一起。
- fixed runtime 現有 12 筆 `PETSKILL_StatusChange` rows（60／61／80／90／100／110／707～712）全部通過 parser regression。
- regression：`tools/check_v278_petskill_statuschange_runtime.mjs`
- GitHub Actions：新增 V2.78 status-change regression。
- save schema 維持 **30**。

完整技術細節請看 [V2.78 詳細紀錄](docs/changelog/part-07-v1.75-onward.md)。

## V2.77 — Hunter 非戰鬥職業技能「追尋敵蹤／回避戰鬥」

V2.77 把固定 C 的兩個 Hunter 非戰鬥職技正式接入可操作 UI：

- Skill 44：`PROFESSION_TRACK / 追尋敵蹤`
- Skill 45：`PROFESSION_ESCAPE / 回避戰鬥`
- 兩者 MP 都是 13；display level 先整除 10，再乘 option rate 5。
- 追尋敵蹤：`CHAR_ENCOUNT_FIX=+floor(level/10)×5%`
- 回避戰鬥：`CHAR_ENCOUNT_FIX=-floor(level/10)×5%`
- 固定 C 的 `CHAR_ENCOUNT_NUM=time+180` 生命週期已接入。
- 重複施放時保留 source 的 `ret=-1` quirk：函式回傳失敗，但 Work 與 180 秒時間仍會被重新寫入。
- `char_walk.c` 的遇敵判定順序與過期當下仍使用 stale `p_cep` 的行為也已保留。
- 新增「非戰鬥職業技能」UI、剩餘秒數與 +/- 遇敵率修正顯示。
- regression：`tools/check_v277_profession_outofbattle_runtime.mjs`
- GitHub Actions：V2.77 regression Run `36415712288` 成功。
- save schema 維持 **30**。

完整技術細節請看 [V2.77 詳細紀錄](docs/changelog/part-07-v1.75-onward.md)。


## V2.76 — Skill 21「移形換位」

V2.76 把職業 Skill 21 `PROFESSION_TRANSPOSE` 從 V2.75 的 source-parity core 接進可執行戰鬥流程：

- fixed C 的 `PROFESSION_CHANGE_SKILL_LEVEL_M` 轉換與 Skill 21 的回避率／有效回合完整對齊：回避 10／25／30／45／50／60／70，tier 1～5 為 3 回合、6～9 為 4 回合、10 為 5 回合。
- 依原 C 的 `CHAR_MYSKILLDUCK = turn + 1` 保存 raw counter；每個施術者行動開始的 StatusSeq 再遞減，歸零時解除效果。
- Skill 21 的職業回避判定在一般 `BATTLE_DuckCheck` 前獨立執行，命中後傷害為 0；已有效果時不刷新，符合 fixed source 的 no-refresh 行為。
- 固定 Target=5 的 raw target enum 會先形成 `BATTLE_MultiList`，再依原碼的 caster-only filter 只讓施術者真正得到 `CHAR_MYSKILLDUCKPOWER`。
- 保留 fixed C 動畫參數 `img1=101697`、`img2=101695`。
- regression：`tools/check_v276_profession_transpose_live.mjs`
- GitHub Actions：V2.76 live regression 與 `game.js` syntax gate 均已成功。
- save schema 維持 **30**。

完整技術細節請看 [V2.76 詳細紀錄](docs/changelog/part-07-v1.75-onward.md)。


## V2.75 — Skill 21「移形換位」source-parity core

V2.75 先把 Skill 21 `PROFESSION_TRANSPOSE` 的固定原 C 規則整理成獨立 runtime profile 與 battle-function adapter，確認 M-tier、回避率、回合數、target enum 與 source function signature，再交給 V2.76 接上 live battle lifecycle。

完整技術細節請看 [V2.75 詳細紀錄](docs/changelog/part-07-v1.75-onward.md)。

## V2.74 — Skills 18～20「火／雷／冰熟練度」

V2.74 把固定 C 的三個熟練度輔助技能正式整理進主線：

- Skill 18：`火熟練度 / PROFESSION_FIRE_PRACTICE`
- Skill 19：`雷熟練度 / PROFESSION_THUNDER_PRACTICE`
- Skill 20：`冰熟練度 / PROFESSION_ICE_PRACTICE`
- 三者都屬巫師 Class 2、TARGET 5、KIND 2、MP 0，不建立 battle command。
- fixed C 的 M-tier 熟練度 Work：tier 1～5=`tier×2`；tier 6～10=`(tier-5)×3+10`；上限 25。
- battle-entry 依已學技能的 display level 建立 F／I／T magic proficiency snapshot，戰鬥中的魔法 Dodge／Damage 使用這個 snapshot。
- fixed C 找不到三項 `PROFESSION_*_P` 的一般 gameplay 寫入路徑，因此 Web 目前只保留 source 可達的 skill-derived Work，不自行虛構 persistent addend。
- 三個 practice function 本身不屬 battle command，`sourceProfessionBattleFunctionSupported()` 仍回傳 false。
- regression：`tools/check_v274_profession_magic_practice_runtime.mjs`
- save schema 維持 **30**

完整技術細節請看 [V2.74 詳細紀錄](docs/changelog/part-07-v1.75-onward.md)。


## V2.73 — Skill 17「冰附體」

V2.73 在 V2.72 Enclose 共用層上接入巫師 Skill 17 `PROFESSION_ICE_ENCLOSE`，並沿 pinned fixed C 完成冰附體的三段 lifecycle：

- dynamic MP：M-tier 1～3=20、4～6=30、7～9=40、10=50
- fixed Dex：`WORKQUICK+20 - RAND(work*0.2, work*0.5)`
- fixed status command uses A-tier success：`100 + A-tier×4`
- option：`凍|效%1|回%3|成%100`；施放成功的 aura StatusTbl stored=4
- `凍 → CHAR_WORK_I_ENCLOSE_2`：冰附體 on-hit counter
- 普通物理攻擊以 `20 + A-tier×2` 機率觸發 `霜`，tier<5→1 回合、tier 5～9→2 回合、tier 10→3 回合，StatusTbl stored=turn+1
- `霜 → CHAR_WORK_I_ENCLOSE`：固定 C StatusSeq 每回合把 FIXDEX 設為原敏捷的 90%
- 冰附體不走一般 magic dodge／GET_DAMAGE cast path；直接使用 profession status attack check
- same-side player／pet 直接 target 維持 fixed `TARGET_OTHER` 語意，不錯誤拒絕
- Ice Practice 只在附體成功後提升
- regression：`tools/check_v273_profession_ice_enclose_runtime.mjs`
- save schema 維持 **30**

完整技術細節請看 [V2.73 詳細紀錄](docs/changelog/part-07-v1.75-onward.md)。


## V2.72 — Skill 16「雷附體」

V2.72 在 V2.71 上接入巫師 Skill 16 `PROFESSION_THUNDER_ENCLOSE`，並修正 V2.71 Fire Enclose 的固定 C 狀態映射：

- dynamic MP：M-tier 1～3=20、4～6=30、7～9=40、10=50
- fixed Dex：`WORKQUICK+20 - RAND(work*0.2, work*0.5)`
- fixed status command uses A-tier success：`100 + A-tier×4`
- Skill 16 option：`击|效%1|回%1|成%100`，StatusTbl stored=2
- 原 C 的 `击 → CHAR_WORK_T_ENCLOSE_2` 是雷附體 on-hit counter；玩家普攻以 `20 + A-tier×2` 機率觸發
- 雷附體的 `电 → CHAR_WORK_T_ENCLOSE` 強制 1 回合，符合 fixed `BATTLE_CanMoveCheck()`
- 火附體同步修正為 `炎 → CHAR_WORK_F_ENCLOSE_2`；真正灼傷 `燒 → CHAR_WORK_F_ENCLOSE`
- regression：`tools/check_v271_profession_fire_enclose_runtime.mjs`、`tools/check_v272_profession_thunder_enclose_runtime.mjs`
- save schema 維持 **30**

完整技術細節請看 [V2.72 詳細紀錄](docs/changelog/part-07-v1.75-onward.md)。


---
## V2.71 — Skill 15「火附體」

V2.71 在 V2.70 上接入巫師 Skill 15 `PROFESSION_FIRE_ENCLOSE`；V2.72 又依 pinned fixed C 校正了這個技能的狀態映射與 on-hit aura lifecycle。

- dynamic MP：M-tier 1～3=20、4～6=30、7～9=40、10=50
- fixed Dex：`WORKQUICK+20 - RAND(work*0.2, work*0.5)`
- fixed status command uses A-tier success：`100 + A-tier×4`
- option：`炎|效%1|回%3|成%100`
- `炎 → CHAR_WORK_F_ENCLOSE_2`：火附體 on-hit counter
- `燒 → CHAR_WORK_F_ENCLOSE`：真正由玩家普攻觸發的灼傷 StatusSeq
- on-hit chance：`20 + A-tier×2`；有效回合為 tier<5→1、tier 5～9→2、tier 10→3
- tier 10 灼傷 stored=4，StatusSeq 實際造成 `150 → 100 → 50` HP
- Fire Practice 只在附體成功後提升
- 不走一般 magic dodge / practice / GET_DAMAGE cast path
- regression：`tools/check_v271_profession_fire_enclose_runtime.mjs`
- save schema 維持 **30**

完整技術細節請看 [V2.71 詳細紀錄](docs/changelog/part-07-v1.75-onward.md)。

## V2.70 — Skill 14「冰鏡術」

V2.70 在 V2.69 乾淨核心上接入巫師 Skill 14 `PROFESSION_ICE_MIRROR`：

- dynamic MP：M-tier 1～2=20、3～4=25、5～6=30、7～8=35、9～10=40
- fixed Dex：`WORKQUICK+20 - RAND(work*0.2, work*0.5)`
- Ice Practice 在 analysis 階段提升；當次施法保留 battle-entry proficiency snapshot
- fixed GET_PRACTICE 沒有 ICE_MIRROR case：power=0，但 critical + M2 RNG 仍消耗，98～102 variance 不消耗
- special damage 依目標 Defense / Toughness 計算，並保留 type=2 GET_DAMAGE 的 Thunder proficiency/resist source bug
- Ice Mirror 無額外第二段 Dodge gate
- img2=101652；direct player-side 座標 (0,50)，其他目標 (0,-50)
- fixed source 的 NPC 800 cap 索引 quirk 不猜、不強制補 cap
- regression：`tools/check_v270_profession_ice_mirror_runtime.mjs`
- save schema 維持 **30**

完整技術細節請看 [V2.70 詳細紀錄](docs/changelog/part-07-v1.75-onward.md)。

---
## V2.69 — Skill 13「火龍槍」

V2.69 為 Skill 13「火龍槍」歷史核心版本，完成：

- 巫師 Skill 13 `PROFESSION_FIRE_SPEAR`
- dynamic MP：M-tier 1～2=30、3～4=40、5～6=60、7～8=70、9～10=80
- fixed `CHAR_DOOMTIME` 共享集氣 lifecycle
- 火龍槍 2→1→0、世界末日 3→2→1→0 的 actor-pass release
- command receipt 階段扣 MP／職業技能熟練度，集氣期間不重扣
- Guard／Capture 不覆寫有效集氣 command
- DRAGNET 清除玩家 profession charge
- Fire Practice / GET_PRACTICE、type1 Fire dodge、damage、animation 與原 C RNG 順序
- FIRE_SPEAR 的 target-sort 行為維持 fixed source 的實際 live path
- save schema 維持 **30**

完整技術細節請看：

- [V2.69 詳細紀錄](docs/changelog/part-07-v1.75-onward.md)
- [完整 CHANGELOG](CHANGELOG.md)

## 最終目標
### 參考資料方式

後續開發固定同時查找兩類外部資料：

- **GitHub／原始碼**：優先找 fixed C、技能實作、資料表、動畫／封包結構，以及其他 Stone Age 開源專案做交叉比對。
- **Google／公開資料**：找舊版攻略、遊戲截圖、戰鬥流程、介面配置、地圖與玩家實機資料，補足原始碼沒有描述的視覺與操作資訊。

參考資料不直接取代專案的 fixed C 基準；遇到規則衝突時，以已確認的固定原 C 行為為核心，再用其他資料補足畫面、流程與缺少的細節。


這個專案的最終目標不是只完成「石器時代風格」的放置遊戲，而是做成一個可以直接在瀏覽器與手機遊玩的、**高度還原《石器時代 OL》遊戲體驗**的單機版。

還原範圍包含：

- 世界地圖、城鎮、野外、NPC、角色、寵物、敵人與玩家操作介面
- 主畫面 HUD、選單、道具欄、角色資訊與各種提示
- **完整戰鬥畫面與流程**，包含戰鬥佈局、角色／寵物位置、技能施放、攻擊動作、受擊、傷害跳字、MISS、DODGE、狀態效果、特效與回合節奏
- 技能、寵物、道具、任務、裝備、合成、捕獲與各種 lifecycle
- 在不猜數值的前提下，重要規則、數值、RNG 與行為盡可能依 fixed 原 C 實作
- 視覺與操作不只追求「像」，而是持續朝**版面、流程、節奏與演出高度還原**前進

原版素材若無法確認可直接使用，改以自行重製、重新繪製或使用有權限的素材，避免把不明來源的原版資源直接放進專案。

## 開發方向

後續版本會直接沿著 Git history 與 pinned 原 C 行為往下做，不重新發明一套規則。

**目前核心版本：V2.77**

- V2.70 已完成 Skill 14 冰鏡術核心
- V2.71 完成 Skill 15 火附體 fixed C mapping correction
- V2.72 已完成 Skill 16 雷附體 on-hit aura lifecycle
- V2.73 已完成 Skill 17 冰附體 fixed C mapping、on-hit aura 與 FIXDEX lifecycle
- V2.74 已完成 Skills 18～20 火／雷／冰熟練度 fixed C magic-proficiency parity
- V2.75 已完成 Skill 21 移形換位 source-parity core
- V2.76 已完成 Skill 21 移形換位 live battle execution、StatusSeq 與獨立 skill dodge lifecycle
- V2.77 已完成 Skill 44／45 追尋敵蹤、回避戰鬥的非戰鬥職技 live UI、180 秒遇敵 Work 與 encounter pipeline lifecycle
- 後續版本依序繼續 fixed C source → runtime → regression → CI → 視覺還原
- 不確定的 source 行為維持 fail-closed，不自行補數值

## 目前主要系統

- PC／手機共用網頁遊戲
- Encounter → Group → Enemy → RandomEnemy → RandomChange
- 玩家／寵物／Enemy 戰鬥核心
- PetSkill 與原 C RNG lifecycle
- Player 9 裝備格 + 15 existing-item 背包格
- ITEM_makeItem / ITEM_equipEffect source-backed runtime
- 玩家裝備、屬性、異常抗性、命中、會心、忽防、額外傷防
- Player / Pet death、Ultimate、裝備死亡復活、GMQUE trophy lifecycle

## 重要檔案

- `game.html`：遊戲入口
- `game.js`：主要遊戲與原 C 對齊邏輯
- `game.css`：PC／手機共用介面
- `data/generated/`：固定來源生成 runtime
- `tools/`：資料生成、檢查與 regression
- `docs/changelog/`：分段開發紀錄

## 完整開發紀錄

歷史開發紀錄依版本分檔：

- [專案起點～V0.46](docs/changelog/part-01-intro-to-v0.46.md)
- [V0.47～V0.72](docs/changelog/part-02-v0.47-to-v0.72.md)
- [V0.73～V0.96](docs/changelog/part-03-v0.73-to-v0.96.md)
- [V0.97～V1.26](docs/changelog/part-04-v0.97-to-v1.26.md)
- [V1.27～V1.51](docs/changelog/part-05-v1.27-to-v1.51.md)
- [V1.52～V1.74](docs/changelog/part-06-v1.52-to-v1.74.md)
- [V1.75～V2.77](docs/changelog/part-07-v1.75-onward.md)

README 只保留目前版本、自述與開發方向；詳細技術內容統一放在 CHANGELOG，避免首頁再次堆積過時說明。

## 歷史版本 regression 入口

歷史核心標記：`PLAYABLE CORE V2.70`、`PLAYABLE CORE V2.71`、`PLAYABLE CORE V2.72`、`PLAYABLE CORE V2.73`、`PLAYABLE CORE V2.74`、`PLAYABLE CORE V2.75`、`PLAYABLE CORE V2.76`、`PLAYABLE CORE V2.77`。

以下歷史版 heading 保留作為 regression／文件索引，詳細內容以 `docs/changelog/part-07-v1.75-onward.md` 為準。

## V2.61 最新進度
已完成 Skill 5 附身術；詳見歷史紀錄與對應 regression。

## V2.62 最新進度
已完成 Skill 6 召雷術；詳見歷史紀錄與對應 regression。

## V2.63 最新進度
已完成 Skill 7 暴風雨；詳見歷史紀錄與對應 regression。

## V2.64 最新進度
已完成 Skill 8 電流術；詳見歷史紀錄與對應 regression。

## V2.65 最新進度
已完成 Skill 9 火星球；詳見歷史紀錄與對應 regression。

## V2.66 最新進度
已完成 Skill 10 嗜血蠱；詳見歷史紀錄與對應 regression。

## V2.67 最新進度
已完成 Skill 11 嗜血成性；詳見歷史紀錄與對應 regression。

## V2.68 最新進度
已完成 Skill 12 冰箭術；詳見歷史紀錄與對應 regression。

## V2.69 最新進度
已完成 Skill 13 火龍槍；詳見歷史紀錄與對應 regression。

## V2.70 最新進度
已完成 Skill 14 冰鏡術；詳見歷史紀錄與對應 regression。

## V2.71 最新進度
已完成 Skill 15 火附體 fixed C mapping correction；V2.72 已把其 on-hit aura lifecycle 校正回固定 C。

## V2.74 最新進度
已完成 Skills 18～20 火／雷／冰熟練度 fixed C magic-proficiency parity；詳見歷史紀錄與對應 regression。

## V2.75 最新進度
已完成 Skill 21 移形換位 source-parity core；詳見歷史紀錄與對應 regression。

## V2.76 最新進度
已完成 Skill 21 移形換位 live battle execution、獨立 skill dodge、StatusSeq lifecycle 與 CI regression；詳見歷史紀錄與對應 regression。

## V2.77 最新進度
已完成 Skill 44 追尋敵蹤、Skill 45 回避戰鬥的非戰鬥職技 live UI、180 秒 CHAR_ENCOUNT_FIX / CHAR_ENCOUNT_NUM lifecycle 與 encounter regression；詳見歷史紀錄與對應 regression。
