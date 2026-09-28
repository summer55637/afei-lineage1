# 阿肥石器時代放置版

《石器時代 OL》風格的 PC／手機共用純前端單機放置版。

## 目前版本

**PLAYABLE CORE V2.86**

目前主線已完成 V2.85；本版把目前 fixed PetSkill runtime 能不能真正走到 `sourceRuntimePending` 的 7 條邊界做成 reachability regression。

> **原 C 規則優先、不猜數值**

固定原 C 基準：

`gavinlinasd/StoneAge@1f90cb6cb57c1df70f39cde77a5a8ccd98b66c56`

## V2.86 — PetSkill source closure audit

V2.86 不新增新的技能效果；本輪把目前 fixed C / Web 的 PetSkill function closure 再做一次完整 source audit，確認沒有因 V2.85 新增的戰鬥 FALSE 邊界而留下新的未接路徑。

- fixed runtime 目前有 64 個合法 PetSkill function family；其中真正屬於 battle / all-field 的有 63 個。
- 玩家低忠誠 RANDOMACT 的 sourcePerformPetLoyalAction() 有 58 個實際 dispatcher；另外 3 個仍是 fixed PETSKILL_functbl 明確未註冊的 582／642／643，2 個則是已證明的 battle-mode FALSE 邊界 540／572。
- 唯一 field=2-only 的 function family 是 PETSKILL_Merge、PETSKILL_Fixitem、PETSKILL_Inslay；battle random skill scan 本來就會排除 field=2，不把加工／料理誤當戰鬥技。
- Enemy AI 的 source-unregistered 邊界維持 502／582；battle-false 邊界維持 540／572。其餘目前正權重 Enemy PetSkill 都有明確 dispatcher。
- sourceRuntimePending 仍保留 7 個 defensive guards；本版沒有證據證明任何一個應被改成猜測效果，因此全部維持 fail-closed。

regression：tools/check_v286_source_closure_audit.mjs
GitHub Actions：.github/workflows/v286-source-closure.yml

## V2.85 — Battle-incompatible PETSKILL_Fixitem / PETSKILL_InslayV2.85 不新增任何修復／鑲寶石效果；這版只把 pinned C 已明確證明的「戰鬥中必定 FALSE」邊界鎖進 runtime。fixed C 的 `PETSKILL_Fixitem()` 與 `PETSKILL_Inslay()` 都先要求 `CHAR_TYPEPET`，再要求主人的 `CHAR_WORKBATTLEMODE == BATTLE_CHARMODE_NONE`。因此：- Enemy AI 抽到 `540 修復` 或 `572 鑲寶石` 時，不能進普通技能效果 handler；fixed C 直接 FALSE。- 玩家 Pet 在戰鬥中隨機抽到這兩個 function 時，同樣是 PETSKILL_Use 失敗，不應落入 `sourceRuntimePending`。- 本版只回報 source-precise no-action，不建立假的戰鬥修復／精工介面，也不消耗額外 RNG。`582 自爆攻擊` 已維持原先 unregistered boundary；pinned C `version.h` 對 `_PETSKILL_EXPLODE` 是關閉狀態，因此不把它當成可執行戰鬥技。regression：`tools/check_v285_battle_false_petskills.mjs`## V2.84 — Enemy PETSKILL_Vary 600/674 + PETSKILL_Roar 734 source parity

V2.84 把目前 Enemy AI 真的會抽到、但原本還會落入 unsupported fallback 的三個 source rows 接上：

- `600 暗月變身`：`攻%+30 敏%+30 魔防%-50`
- `674 暗月變身改`：`攻%+60 敏%+50 魔防%-80`
- `734 狮王之吼`：只對指定 PETID 的玩家寵物生效

fixed C 證明：

- `PETSKILL_Vary()` 只有 `PETID 981/982/983/984` 才會成功；它只解析 `攻%`／`敏%`，`魔防%` 雖存在於 option，但原函式不讀。
- Vary 設定 `WORKTURN=0`；之後每個 battle command 讓它遞增，`>5` 才恢復 FIXSTR/FIXDEX。
- Enemy Web runtime 每回合會先重建 FIX，再套仍在 Vary window 內的攻／敏修正，符合 fixed C 的 Work 值生命週期。
- `PETSKILL_Roar()` 只設 battle command；`BATTLE_S_Roar()` 對 Player 本人 `petid=-1` 不生效，對玩家 Pet 則讀 `CHAR_PETID`，命中 option 清單後直接 `BATTLE_Exit`，不造成傷害、不算擊殺。

本版沒有把 `魔防%` 自行加進 Web，也沒有把 Roar 擴成普通玩家或未列入 option 的 Pet。

regression：`tools/check_v284_enemy_vary_roar.mjs`
## V2.83 — CHAR_WORKPETFALL → rideflg source adapter

V2.83 把 fixed `battle_command.c` 的落馬結果語意獨立鎖成 source adapter，但不假造目前 Web 沒有的正式 RidePet runtime。

- `CHAR_WORKPETFALL != 1` → `rideflg = 0`
- 一般戰鬥落馬 → `rideflg = -1`
- `CHAR_WORKFOXROUND != -1` → `rideflg = -2`
- `CHAR_BECOMEPIG > 120` → `rideflg = -3`

不同公開 StoneAge fork 仍保留同一組 `CHAR_WORKPETFALL`／`rideflg` protocol lifecycle；但 pinned C 與目前 Web model 都沒有足以證明「active Pet = RidePet」的資料來源，因此 V2.83 只新增純 source adapter 與 regression，不把 `ridePetId` 硬接到玩家或出戰寵物。

regression：`tools/check_v283_rideflg_boundary.mjs`

## V2.82 — FallGround DamageReact gate / CHAR_WORKPETFALL ride-system boundary

V2.82 接著 V2.80／V2.81 的 source-gap audit，這次追到 battle_event.c::BATTLE_S_FallGround() 的 react == 0 門檻，以及 CHAR_WORKPETFALL 在 battle command 結算時的真實用途。

- fixed C 明確要求 skill_type == BATTLE_COM_S_FALLRIDE、damage > 0、react == 0 才會消耗 RAND(0,100) 並進入落馬判定；Web 原先只看 clean hit，會在可識別的 Enemy DamageReact（目前 source-backed 為 ACUPUNCTURE）下多消耗一顆 FallGround RNG。
- sourcePerformPetFallGroundSkill() 現在先保存 sourcePetOriginalDamageReact(target)，只有 !hadDamageReact && damage>0 && !dodge && !miss 才會抽 RAND(0,100)。
- CHAR_WORKPETFALL 的 fixed C 主要是 battle result / rideflg lifecycle：落馬後先保留旗標，battle_command.c 送出 -1／變狐時 -2／烏力化時 -3，然後清除 Work；battle 結束另會短暫使用 CHAR_RIDEPET=-2 後恢復 -1。
- 目前 Web 沒有已證明的正式 CHAR_RIDEPET／battle rideflg runtime；因此這部分仍 fail-closed，不把 active pet 冒充騎寵，也不虛構 ridePetId。既有 BecomeFox dismount marker 只在 source-backed ride state 真正存在時才會觸發。
- 不改 FallGround RAND(0,100)、>50、ridePetId source boundary，也不猜 Enemy 騎寵資料。

regression：tools/check_v282_fallground_react.mjs
## V2.81 — PetSkill runtime reachability / pending boundary audit

V2.81 不新增猜測效果；把目前 61 個合法 PetSkill function family、36 筆 `PETSKILL_Combined` 與 7 個 `sourceRuntimePending` 防守點做靜態可達性鎖定：

- 61 個合法 function family 中，58 個有 fixed Web loyal dispatcher；剩下 3 個正是 fixed `PETSKILL_functbl` 沒有同名註冊的 582／642／643。
- `PETSKILL_StatusChange` 現有 12 rows 的狀態／turn／攻擊倍率 token 全部能被目前 parser 唯一解析。
- `PETSKILL_Refresh` 目前 583／584／591／592／593 的 `默／剧／障／全／虚` 都有來源 parser 路徑；特殊 `Weaken／Deeppoison／Barrier／Nocast` 12 rows 也都具備 `status + turn + 成功率`。
- `PETSKILL_MagicStatusChange` 4 rows 全部是 fixed `铁壁`，走已證明的 `superWall` adapter。
- `PETSKILL_BattleProperty` 的唯一合法 row 612 保持精確 `PET_PetskillPropertyEvent` callback。
- 36 筆 Combined 一共引用 101 個唯一 magic ID；每一個都已有固定分流或 `MAGIC_AttMagic` runtime row，458／459／462 則維持明確 source-missing，不會走成猜測效果。
- 7 個 `sourceRuntimePending` 不刪除，仍是 future/unmapped data 的 fail-closed 防線；本版 regression 只證明目前 fixed runtime 不會繞進這些分支。

regression：`tools/check_v281_petskill_reachability.mjs`

## V2.80 — Enemy FallGround / Combined source boundary audit

V2.80 沿 fixed C 繼續往 Enemy／Pet 的特殊技能邊界追，這輪沒有猜新效果，而是把兩個資料斷點正式鎖進 regression：

- PETSKILL_FallGround（Skill 210）固定 option 為 攻%-30，原 C 的 BATTLE_S_FallGround() 確實有 _ENEMY_FALLGROUND 分支，但 Enemy 建立時只做 ridePetTable 外觀圖轉換，沒有把 CHAR_RIDEPET 設成正值；目前 generated Enemy runtime 也沒有 source-backed ridePetId，因此不自行製造騎寵。
- 落馬判定的 RAND(0,100) 與 >50 仍保留；只有 runtime 本身已帶有正值 ridePetId 時才會進 0.7 倍 STR／TOUGH／VITAL 分支。
- PETSKILL_Combined 固定 36 筆；Skill 715「火牛狂襲」的 458／459／460／461／462 中，fixed magic.txt 目前只有 460／461 可由已證明的 MagicStatusChange 路徑接出，458／459／462 沒有 source magic row，維持 missingMagicRow fail-closed。
- 不從技能名稱「火牛狂襲」自行推導多體傷害、火屬性或其他 magic 效果。
- save schema 維持 30。

regression：tools/check_v280_source_boundaries.mjs

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

**目前核心版本：V2.82**

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
