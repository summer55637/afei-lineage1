# 阿肥石器時代放置版－開發紀錄 Part 07

> 範圍：V1.75 onward  
> 固定原 C：`gavinlinasd/StoneAge@1f90cb6cb57c1df70f39cde77a5a8ccd98b66c56`  
> 原則：**原 C 規則優先、不猜數值**

## V1.75 player ranged Confusion cross-side lifecycle

V1.74 已完成玩家正常普通攻擊時的 BOW / BOOMERANG / BOUNDTHROW / BREAKTHROW pattern，但混亂狀態可以在 `BATTLE_StatusSeq()` 內把普通攻擊的 `COM2` 指回自己 side，因此上一版先明確 fail-closed。

V1.75 依 fixed 原 C 補完這個邊界。

### 原 C 執行順序

固定 `battle.c` 的主戰鬥迴圈順序為：

1. `BATTLE_StatusSeq(charaindex)`
2. 混亂若 80% 發作：
   - `COM1 = BATTLE_COM_ATTACK`
   - `RAND(0,1)` 選 side
   - `RAND(0,9)` 選起始位置並循環找 `BATTLE_TargetCheck` 有效目標
   - 找不到則 `COM2 = -1`
3. `BATTLE_GetWepon()`
4. `BATTLE_GetAttackCount()`
5. command switch
6. 普通 `ATTACK` + BOOMERANG 會再轉成 `BATTLE_COM_BOOMERANG`
7. `BATTLE_TargetListSet()`
8. 實際武器 attack lifecycle

因此即使玩家原本本回合不是攻擊指令，只要混亂發作改成 ATTACK，已裝備的遠程武器仍必須走原本武器 pattern；AttackNum RNG 也必須先消耗。

### BOW

- valid raw COM2 才執行 aBowW 的一顆 `RAND(0,1)`
- raw COM2 = -1 時：
  - `BATTLE_TargetListSet` 不做 DefaultAttacker
  - 不消耗這顆 `RAND(0,1)`
  - BOW initial target scan 找不到有效位置後直接 NoAction
- Player slot 0 若混亂選到自己的出戰 Pet slot 5：
  - aBowW 會交錯 row 5 / row 0
  - self slot 0 被改成 -1
  - common loop 在第一個 Pet attack 後讀到 -1 sentinel，因此立即停止

對應固定 own-Pet target order：

- random 0：`[5,-1,7,2,6,1,9,4,8,3]`
- random 1：`[5,-1,6,1,7,2,8,3,9,4]`

### BOOMERANG

- AttackNum RNG 已在 command conversion 前消耗
- dedicated BOOMERANG 不使用 attack_max 值
- raw COM2=-1 才呼叫 `BATTLE_DefaultAttacker(side 1)`
- 若指定 row 沒任何有效 TargetCheck，再做 DefaultAttacker
- Player side 0 固定 `k=0, j=+1` 正向 sweep
- 每段 damage multiplier = 0.3
- dedicated case 在 common Counter loop 前 break
- 若 target row == attacker row，原 C NoAction

### BOUNDTHROW / BREAKTHROW

- valid raw COM2 由 TargetListSet 複製到後續每一段
- 每段重新跑 `BATTLE_TargetAdjust`
- 原 raw target 死亡／隱藏後，每段可重新觸發 DefaultAttacker RNG
- raw COM2=-1 是特殊情況：
  - 第一段 TargetAdjust 可以 DefaultAttacker
  - 但下一個 `aDefList[++k]` 本來就是 -1 sentinel
  - 因此即使 AttackNum > 1，也只會做第一段 fallback hit

BREAKTHROW 額外維持固定順序：

`DamageSub / WakeUp → paralysis StatusAttackCheck → ItemCrush → AddProfit`

麻痺仍使用 `20 - resistance` 與原來 strict comparison lifecycle。

### 同 side Pet

新增 generic battle-slot target resolver，可讓玩家混亂的遠程攻擊真正命中自己的出戰 Pet。

仍保留：

- Pet EarthRound / hidden 不可 TargetCheck
- Enemy hidden 不可 TargetCheck
- 玩家攻擊自己 Pet 時的原 C loyalty / AI_FIX_SEKKAN 生命週期
- Pet Guard 狀態可影響 Duck / damage；Pet 自己若在 confusion 則不視為 Guard
- indirect weapon Guardian / Counter / Combo gate

### Web 實作

新增：

- `sourcePlayerConfusionTargetableFromBattleSlot()`
- `sourcePlayerConfusionDefaultAttackerDesc()`
- `sourcePlayerConfusionRangedResult()`
- `sourceApplyPlayerConfusionRangedHit()`
- `sourcePerformPlayerConfusionBowAttack()`
- `sourcePerformPlayerConfusionBoomerangAttack()`
- `sourcePerformPlayerConfusionThrowAttack()`
- `sourcePerformPlayerRangedConfusionAttack()`
- generic `sourcePlayerBreakthrowParalysisDesc()`

`battleApplyPhysicalHit()` 新增 defer ItemCrush / AddProfit hook，專門保留 BREAKTHROW 的原 C status-before-crush 順序。

### Regression

新增：

`tools/check_v175_player_ranged_confusion_runtime.mjs`

檢查：

- StatusSeq → AttackCount → confusion execution 順序
- V1.74 fail-closed 已移除
- cross-side slot target resolver
- same-side Pet Guard
- BOW invalid COM2 不消耗 TargetListSet RAND
- BOW own-Pet aBowW order
- BOOMERANG fallback / same-row / forward sweep / 0.3
- BOUND/BREAK raw -1 sentinel
- BREAKTHROW paralysis → ItemCrush → AddProfit
- 四種 indirect weapon dispatcher
- `PLAYABLE CORE V1.75`

V1.74 regression 已改為歷史相容檢查，不再要求保留當時刻意設置的 ranged-confusion fail-closed。

### commits

- `da7727dddf729dac99253029e4a7e1881d771f34` — relax V1.74 historical boundary
- `c480e6e4e25eb672e4b1dac0d353ca94166ce2b6` — V1.75 cross-side ranged confusion core
- `4aa4f164573831ee61bc418d421d7ca9a53ccd58` — V1.75 regression
- `d607d71d65e3f96638dc25a288f8d6ccf4d2d02b` — V1.75 game marker
- `daf3cb027fc58e7bd1aead9858db21416fed524a` — CI runs V1.75 regression


---

## V1.76 Player PetSkill functbl / BattleProperty lifecycle

V1.76 先從玩家寵低忠誠 RANDOMACT 的剩餘 PetSkill 邊界繼續掃 fixed 原 C，並區分「資料列存在」與「函式真的有註冊」兩個層次。

### fixed PETSKILL_functbl 註冊層

`petskill2.txt` / generated runtime 內以下資料列雖存在：

- 582 自爆攻擊 → `PETSKILL_SelfExplodeAttack`
- 642 覺醒 → `PETSKILL_Awaken`
- 643 蠱惑 → `PETSKILL_Temptation`

但固定 `pet_skill.c` 的 `PETSKILL_functbl` 沒有這三個 exact function string。

其中 582 對應的舊自爆 family 在 `version.h` 也維持不可開；來源中實際存在的名稱亦不是 `PETSKILL_SelfExplodeAttack`。

因此 fixed `PETSKILL_Use()` 的真實結果是：

1. `BATTLE_PetRandomSkill()` 已先抽 skill slot；
2. 已先執行 `BATTLE_DefaultAttacker()`，所以目標 RNG 仍會消耗；
3. 50 次 PetSkill 掃描完成後進入 `PETSKILL_Use()`；
4. exact function lookup 得到 NULL；
5. `PETSKILL_Use()` return FALSE；
6. COM1 被改回 NONE。

Web 現在不再把 582 / 642 / 643 誤標成「效果尚未接入」，而是明確走 sourceUseFailed / sourceFunctionMissing，且保留前面已消耗的 RNG。

### 612 魔之詛咒 / PETSKILL_BattleProperty

固定來源：

`PETSKILL_BattleProperty()`

只負責寫：

- COM1 = `BATTLE_COM_S_PROPERTYSKILL`
- COM2 = toNo
- MODE = C_OK
- COM3 low = skill array

真正執行時 `battle.c`：

1. 取 COM3 low；
2. 呼叫 `BATTLE_S_PetSkillProperty()`；
3. `BATTLE_NoAction()`；
4. 不做 TargetAdjust、不做物理攻擊。

`BATTLE_S_PetSkillProperty()` 會把 option：

`PET_PetskillPropertyEvent`

寫進施術寵物的 `CHAR_BATTLEPROPERTY` function table。

之後每一次 fixed `BATTLE_AttrAdjust()` 都會：

1. 先對攻守雙方各自 `BATTLE_GetAttr()`；
2. 若攻方有 CHAR_BATTLEPROPERTY，呼叫 callback 改 At_pow；
3. 若守方有 CHAR_BATTLEPROPERTY，呼叫 callback 改 Dt_pow；
4. 之後才做 FieldAttAdjust / AttrCalc。

`PET_PetskillPropertyEvent()` 的映射固定為：

- 對手 Earth → 自己 Wind
- 對手 Water → 自己 Earth
- 對手 Fire → 自己 Water
- 對手 Wind → 自己 Fire
- None = `100 - 對手四屬總和`

Web 新增 per-battle `battlePropertyKeys`，並讓 `petBattleView()` 把 callback 狀態帶進物理屬性計算。

若攻守雙方都持有 callback，兩邊都依「對方 callback 前的目前屬性」各自計算，不做遞迴 counter。

### Battle Exit

fixed battle exit 會清空 `CHAR_BATTLEPROPERTY` 並重建 function table。

Web 因此同步在：

- 全場 battle reset
- 怯戰嚇退
- 狂獅怒吼召回
- Pet Ultimate 打飛
- Player Ultimate 讓 DEFAULTPET 退出
- 低忠誠逃跑
- Abduct 成功帶走 Pet

清掉該 Pet 的 battleProperty callback。

### 639 蟻葬 / PETSKILL_AntInter

固定 `BATTLE_COM_S_ANTINTER` 只有在 COM2 是「已死亡的 CHAR_TYPEPET」時才進特殊分支。

但 `BATTLE_PetRandomSkill()` 的 COM2 來自 `BATTLE_DefaultAttacker()`，只能選到 `BATTLE_TargetCheck()==TRUE` 的活目標。

因此玩家寵低忠誠 RANDOMACT 在目前 PVE 路徑抽到 639，COM2 是存活 Enemy：

- dead-Pet 特殊條件為 false；
- battle.c 自然 fall-through 到 common physical attack block；
- Web 現已照此執行普通物理攻擊，不再 sourceRuntimePending。

### 未猜的剩餘項目

以下仍沒有硬補：

- 581 / 734 Roar：效果需要真實 `CHAR_PETID` 判斷指定年獸 ID；目前捕獲 Pet / Enemy 尚沒有可靠的 source CHAR_PETID 欄。
- 600 / 674 Vary：只允許 CHAR_PETID 981～984；目前不能拿 TempNo 或 Web id 猜成 PETID。
- 540 Fixitem / 572 Inslay：field=2，屬非戰鬥技能，本來就不會進 `BATTLE_PetRandomSkill` 的 Battle/All 掃描。

### Regression

新增：

`tools/check_v176_player_petskill_runtime.mjs`

檢查：

- 582 / 642 / 643 fixed functbl 缺失
- RandomSkill target RNG 之後才 sourceFunctionMissing
- 612 BattleProperty callback 設置與 battle-exit 清除
- PET_PetskillPropertyEvent 四屬映射
- 攻守雙 callback 使用 base vectors、非遞迴
- 639 AntInter living-target fall-through
- `PLAYABLE CORE V1.76`

歷史 V1.73～V1.75 regression 的 UI marker 也改成版本無關，只驗證存在合法 `PLAYABLE CORE Vx.y`，避免未來升版造成與功能無關的假失敗。

### commits

- `8cbb0dfe124d6471a6a96b051b6ef8b4db66a85d` — V1.76 functbl / BattleProperty / AntInter core
- `c6524fd8682d3f8a4f606326a65cf3f3c9c8dd33` — clear BattleProperty on Pet exits
- `8e5e71e5e7c923be7764c7978db68f740004a26e` — V1.76 regression
- `2e393e2ab48daefb36fa768987a59da37cea46b5` — V1.76 playable marker
- `575ca55b8be8db9b1538bf331e572feb4de6e87e` — CI runs V1.76 regression


---

## V1.77 CHAR_PETID / Roar / Vary lifecycle

V1.76 對 581 / 734 Roar 與 600 / 674 Vary 保留不猜，原因是當時 Web runtime 沒有獨立保存 `CHAR_PETID`。V1.77 重新沿 fixed 原 C 往上追來源後，這個欄位已可直接證明，不需要用名稱、圖號或 Web id 猜測。

### CHAR_PETID 真實來源

固定 `char/enemy.c` 的 Enemy 建立流程直接寫：

`CharNew.data[CHAR_PETID] = *(tp + E_T_TEMPNO)`

固定 `char/pet.c::PET_createPetFromCharaIndex()` 捕獲時再直接複製：

`CharNew.data[CHAR_PETID] = CHAR_getInt(enemyindex, CHAR_PETID)`

因此目前 source-backed 的 `tempNo` 就是這條建立鏈上的 `E_T_TEMPNO`，可以安全保存成 Web `petId`：

- runtime Enemy：`petId = tempNo`
- 捕獲 Pet：複製 target `petId`
- 原服模板建立的任務 Pet / 起始 Pet：同樣由其 `tempNo` 保存
- 舊存檔：只有已有有限 `tempNo` 時才補 `petId`；沒有來源欄就保持未知

save schema 因此由 28 升為 **29**。

### 581 大吼 / 734 獅王之吼

`PETSKILL_Roar()` 只建立 `BATTLE_COM_S_ROAR` command；真正效果在 `BATTLE_S_Roar()`：

1. execution 時先 `BATTLE_TargetAdjust()`
2. 讀目標 `CHAR_PETID`
3. 把 PetSkill option 以 `|` 拆開逐一 `atoi`
4. 只要 exact PETID 命中清單，就 `BATTLE_Exit(target)`
5. 不符合則沒有傷害、沒有其他效果

固定資料：

- 581：`901|902|903|904|1056|1057|1058|1059`
- 734：`1009|1010|1011|989|990|991|992|1030|1031|1032|997|998|999|1000`

Web 現在使用相同 exact membership，不做範圍猜測。命中的 Enemy 走 direct-exit lifecycle，不產生擊殺 EXP／掉落。

### 600 / 674 暗月變身

固定 `PETSKILL_Vary()` 第一個 gate 是：

`CHAR_PETID ∈ {981,982,983,984}`

不符合會直接 return FALSE，連 command 都不建立。

符合時 fixed C：

- 解析 `攻%` → `CHAR_SKILLSTRPOWER`
- 解析 `敏%` → `CHAR_SKILLDEXPOWER`
- 當下 WORKATTACKPOWER / WORKQUICK 依 FIX 值加成
- BASEIMAGENUMBER = 101428
- WORKTURN = 0

固定資料列：

- 600：攻 +30%、敏 +30%
- 674：攻 +60%、敏 +50%

雖然資料文字另有「魔防%-50 / -80」，但 fixed `PETSKILL_Vary()` 沒有解析魔防 token，因此 Web 也不自行補這個效果。

### compliance 與 WORKTURN

固定 `item/item.c` 的 compliance 在圖號 101428 時會用 `CHAR_SKILLSTRPOWER / CHAR_SKILLDEXPOWER` 重新加到 `WORKFIXSTR / WORKFIXDEX`，而且這段在 WEAKEN 前執行。

所以 Web 的順序為：

1. 基礎攻／敏
2. Vary 百分比
3. WEAKEN 等後續修正
4. 生成本輪 attack / quick

fixed `battle.c` 在角色真正執行 command 後才處理 WORKTURN：

- cast 當回合：0 → 1
- 後續實際執行五次 command：1 → 2 → 3 → 4 → 5 → 6
- `WORKTURN > 5` 時才回復原圖、FIXSTR / FIXDEX，WORKTURN 歸 0

因此 buff 會涵蓋 cast 後 **五次實際執行的指令**。若 StatusSeq / CanMoveCheck 讓該 Pet 本回合直接 skip，原 C 不會走到這段，Web 也不遞增。

### _FIXWOLF RNG

`BATTLE_PetRandomSkill()` 的 fixed `_FIXWOLF` 邊界維持：

- PETID 981～984
- 若抽到 skill 600
- 先重抽 skill slot，直到不是 600
- 然後才做 `BATTLE_DefaultAttacker()`

因此不能把 reroll 移到 target RNG 之後，也不能因為 600 最終不執行就省略前面的 RNG。

### Battle Exit

新增 `battlePetVaryStates` 是純 battle transient。

在：

- 全場 reset
- Pet Ultimate / Player Ultimate DEFAULTPET exit
- 低忠誠逃跑
- Abduct 成功帶走

都會清掉 Vary state，不把變身跨戰鬥保存。

### Regression

新增：

`tools/check_v177_petid_roar_vary_runtime.mjs`

檢查：

- 581 / 734 / 600 / 674 fixed runtime rows
- Enemy / Capture / Quest / Starter 的 PETID source chain
- schema 29 舊存檔 migration
- _FIXWOLF reroll 在 DefaultAttacker 前
- Roar exact PETID membership + direct exit
- Vary 981～984 gate
- 600 / 674 攻敏百分比
- 不自行解析魔防 token
- compliance：Vary before WEAKEN
- cast 0→1 + 五次 command 後 >5 reset
- status skip 不誤增 WORKTURN
- mid-battle / full battle exit cleanup
- `PLAYABLE CORE V1.77`

### commits

- `cf946cf26e91991bd11fdb4ffb7fac5d7cc38f19` — V1.77 CHAR_PETID / Roar / Vary core
- `d521615e80428aba5694cfca431a2d8e7a1a0191` — initial V1.77 regression


---

## V1.78 Player RANDOMACT specialized status commands

V1.78 繼續掃玩家出戰 Pet 在低忠誠 `RANDOMACT` 下仍落入 `sourceRuntimePending`、但 fixed 原 C 可以完整證明的特殊狀態 command。

本輪接入：

- 326 / 583 / 584 / 591 / 592 / 593 — `PETSKILL_Refresh`
- 575 / 576 — `PETSKILL_Weaken`
- 577 / 578 / 840 — `PETSKILL_Deeppoison`
- 579 / 594 / 673 / 836 — `PETSKILL_Barrier`
- 580 / 672 / 837 — `PETSKILL_Nocast`

### RANDOMACT target 邊界

fixed `BATTLE_PetRandomSkill()` 是先抽 skill slot，再用 `BATTLE_DefaultAttacker()` 取得單一敵方 `toNo`，最後才呼叫 `PETSKILL_Use(petindex, iNum, toNo, NULL)`。

`PETSKILL_Use()` 只找 skill array / function pointer，會把這個 `toindex` 原封不動交給技能函式；它不會依 `PETSKILL_TARGET` metadata 再改成 ALLMYSIDE / ALLOTHERSIDE。

因此在低忠誠 RANDOMACT 下，即使 576 全體虛弱、578 全體劇毒、672 全體沉默、673 全體魔障等資料列 target=3，仍只對 DefaultAttacker 當下選出的單一 Enemy 生效。Web 不按技能名稱修成較合理的全體效果。

### Refresh

fixed `BATTLE_S_Refresh()` 最後進 `BATTLE_MultiStatusRecovery()`。該函式從 status index 1 一直掃到 `BATTLE_ST_END`，每次遇到正值都覆寫 `tostatus`，所以最後一個正值勝出。

固定前段 StatusTbl 順序為：

`毒 → 麻 → 眠 → 石 → 醉 → 亂 → 虛 → 劇 → 障 → 默 → 煞 → ...`

option=`全` 也不是一次清光：只清掃描出的那一個 `tostatus`。指定狀態則必須與該 `tostatus` 完全一致才解除。

Web 依目前已建模狀態維持同一順序，並把 SARS 納入；SARS 雖使用獨立 battle map，但仍能被 `全` 的 fixed 掃描結果選中並解除。

### Weaken / Deeppoison / Barrier / Nocast

四類都沿用 fixed `BATTLE_StatusAttackCheck(attacker,target,status,Success,30,1.0)`。固定 `CHAR_complianceParameter` 明確把 MODWEAKEN / MODDEEPPOISON / MODBARRIER / MODNOCAST 初始化為 0，所以不拿既有六項 enemybase1 z[] 抗性猜到這些新欄位。

- Weaken：成功後 `CHAR_WORKWEAKEN = turn + 1`
- Deeppoison：`BATTLE_S_Deeppoison` 傳 `turn + 2` 給 MultiStatusChange
- Barrier：成功後 `CHAR_WORKBARRIER = turn + 1`
- Nocast：成功後直接 `CHAR_WORKNOCAST = turn`，不 +1

Nocast 的 fixed `&&` 順序是先做 StatusAttackCheck，再排除 CHAR_TYPEPET。本輪 RANDOMACT target 是 Enemy，因此會正常寫入沉默；沉默本身不被 Web 猜成封鎖 Enemy 全技能。

這五類都是獨立 `BATTLE_COM_S_*` command，不造成物理傷害，也不進普通 Counter。

### Regression

新增 `tools/check_v178_player_status_runtime.mjs`，檢查 18 筆 fixed row、單一 target 傳遞、Refresh last-positive 掃描、SARS、Success/range/Bai、各技能 stored turn、無物理 Counter，以及五個 dispatcher 都位於 pending fallback 前。

### commits

- `0c2dcb6c7b514bca5757d760e10ababe5ccc3579` — V1.78 player specialized status command core
- `9e3dc4052030dd0c7e70e3fbce354b26a36b1a1d` — V1.78 regression
- `23cd2ec7405138736c6e240abcfabb30148a9059` — V1.78 playable marker
- `3e4e9f43b85f652858a51067a4af9a17ed487e4d` — V1.78 README
- `e6af645a7ec672bf54e44e506b5878bdb85fd0ef` — V1.78 changelog index


---

## V1.79 Player RANDOMACT drain PetSkills

V1.79 接上玩家出戰 Pet 在低忠誠 `RANDOMACT` 下的 `PETSKILL_DamageToHp` 與 `PETSKILL_DamageToHp2`。

### Fixed rows

- 503 嗜血技：`30|50`
- 504 嗜血技2：`20|70`
- 505 嗜血技3：`10|100`
- 714 嗜血之擊：`30|100`
- 833 大海血擊：`30|100`
- 623 浴血狂襲：`30`
- 659 T浴血狂襲：`100`

### DamageToHp 的 C 整數除法 bug

`PETSKILL_DamageToHp()` 寫成：

`def = (atoi(buf1) / 100);`

`atoi(buf1)` 與 `100` 都是 int，所以先做整數除法，再轉 float。現有 first token 30 / 20 / 10 因此全部先得到 0，最後 WORKATTACKPOWER 不會真的下降。

Web 保留這個 bug，不按技能說明自行改成 -30% / -20% / -10%。第二段 option 才是 `BATTLE_S_DamageToHp()` 的實際吸血比例。

### DamageToHp2

`PETSKILL_DamageToHp2()` 本身只建立 `BATTLE_COM_S_DAMAGETOHP2`。真正特殊能力在 `BATTLE_AttackSeq()`：

- 先完成普通 `BATTLE_CriticalCheck()`
- `perCri = perCri + perCri*0.3`
- `WORKATTACKPOWER = WORKFIXSTR + WORKFIXSTR*0.2`
- `WORKQUICK = WORKFIXDEX + WORKFIXDEX*0.2`

低忠誠 RANDOMACT 是 EntrySort 後才改 command，因此 WORKQUICK +20% 不可能回頭改本回合的速度排序；但 AttackSeq 當下的攻 +20% 與會心率 ×1.3 仍會作用。

623 資料文字寫「HP50%以下時才可使用」，但 fixed `PETSKILL_DamageToHp2()` 沒有 HP 判斷。`BATTLE_AttackSeq()` 中也只有一段註解殘留類似文字，並未形成條件，所以 Web 不自行加入 HP50% gate。

### BATTLE_S_AttackDamage Guardian bug

`BATTLE_S_AttackDamage()` 先保存 caller 的原 `defindex`，再呼叫：

`BATTLE_AttackSeq(attackindex, defindex, &damage, &Guardian, skill_type)`

`BATTLE_AttackSeq()` 內若 Guardian 成立，只有它自己的 local `defindex` 改成 Guardian，所以 Duck 後的會心、防禦、GuardAdjust 會用 Guardian。

回到 caller 後，原 `defindex` 沒有被更新，因此後面的：

- `BATTLE_DamageSub`
- WakeUp
- death / Ultimate
- ItemCrush
- `BATTLE_S_DamageToHp*`

仍然都落在原目標。

Web 新增 player-Pet 對 Enemy 的 calc-only Guardian 路徑：Guardian 只參與傷害計算，`actualTarget` 保持原 Enemy。

### DamageReact 先於 AttackSeq

`BATTLE_S_AttackDamage()` 在呼叫 AttackSeq 之前，先對原目標執行 `BATTLE_GetDamageReact(defindex)`。對非 LIGHTTAKE 技能，只要 ReactType > 0 就先把 `skill_type=-1`。

因此：

- 本次仍進普通 AttackSeq / DamageSub 反應
- `DamageToHp` / `DamageToHp2` 的吸血 switch 不會執行
- `DamageToHp2` 因為傳進 AttackSeq 的 opt 已經是 -1，所以攻 +20% 與會心率 ×1.3 也不會執行

目前 Web 可由 fixed source-backed runtime 實際達到的 Enemy DamageReact 是 `ACUPUNCTURE`，所以以它作為這個 gate 的現行映射。

### TargetAdjust / Counter

兩個 command 在 battle.c execution 時都先重新跑 `BATTLE_TargetAdjust()`。若 RANDOMACT 先選的 COM2 在 Pet 真正出手前失效，Web 會在該時點才重新走 DefaultAttacker target RNG。

兩者都是獨立 `BATTLE_S_AttackDamage` case，case 結束直接 `break`，不接普通 Counter chain。

### Regression

新增 `tools/check_v179_player_drain_runtime.mjs`，檢查：

- 7 筆 fixed PetSkill row
- DamageToHp int/int 截斷
- execution-time TargetAdjust fallback
- Guardian calc-only / original-target damage bug
- DamageToHp2 +20% / ×1.3
- DamageReact 先降 skill type，取消吸血與 DamageToHp2 bonus
- 623 不自行加入 HP50% gate
- heal percentage truncation + max HP cap
- 無普通 Counter
- dispatcher 位於 pending fallback 前

### commits

- `eb272e6abfc6afe90db8721fa9f85f33425e6dc7` — V1.79 player drain core
- `3ee0b72f97719faa602f72732e7628e3d9adf194` — DamageReact downgrade correction
- `50109ebb47c3232b25250a94a3cddbba635b2fdd` — V1.79 regression
- `e599753318bb0b7776d3ca35cf13079c6a2bdeef` — V1.79 playable marker
- `fd9de16a9a734b0be5a4befe27e75cd465268be4` — V1.79 README
- `7177372bcd0c6f0612771e644614216fedac8744` — V1.79 changelog index


---

## V1.80 Player RANDOMACT MP damage

V1.80 接上玩家出戰 Pet 在低忠誠 `RANDOMACT` 下的 506～508 `PETSKILL_MpDamage`。

### Fixed rows

- 506 MP攻擊：`50|50`
- 507 MP攻擊2：`50|75`
- 508 MP攻擊3：`50|100`

### Attack reduction integer bug

`PETSKILL_MpDamage()` 寫成：

`def = (float)(atoi(buf1) / 100);`

這仍是 int/int 先算。三筆資料第一段都是 50，所以 50 / 100 先截成 0，再轉 float；固定 build 實際不會把 WORKATTACKPOWER 降 50%。

### MP damage target-type gate

`BATTLE_S_MpDamage()` 的順序是：

1. damage < 1 → return 0
2. 原目標 DamageReact > 0 → return 0
3. 原目標是 `CHAR_TYPEENEMY` 或 `CHAR_TYPEPET` → return 0
4. 只有 PLAYER 且 MP>0 才讀 option 第二段並扣目前 MP 的百分比

低忠誠 `BATTLE_PetRandomSkill()` 先用 `BATTLE_DefaultAttacker()` 選 opposing-side target。在目前 Web PVE，玩家 Pet 的 opposing side 是 Enemy side，因此 506 / 507 / 508 這條 RANDOMACT 路徑的原 `defindex` 必然是 Enemy。

即使 Enemy Guardian 成立，V1.79 已確認 `BATTLE_S_AttackDamage()` 只讓 `BATTLE_AttackSeq()` local defindex 改成 Guardian，caller 的原 defindex 仍不變。因此 `BATTLE_S_MpDamage()` 看到的仍然是原 Enemy，MP 額外效果 source-provably 為 0。

Web 不把這個技能改成去扣 Enemy 的虛構 MP。

### Physical command lifecycle

物理傷害仍走 V1.79 共用的 `sourcePetAttackDamageCalcOnlyGuardianResult()`：

- 原目標先 Duck
- Guardian 可參與 local critical / defence / GuardAdjust 計算
- 真正傷害 / death / ItemCrush 仍落原 Enemy
- execution 時原 COM2 失效才重跑 TargetAdjust / DefaultAttacker
- case 結束直接 break，不接普通 Counter

### Regression

新增 `tools/check_v180_player_mpdamage_runtime.mjs`，檢查：

- 506 / 507 / 508 fixed rows
- 50/100 C 整數截斷為 0
- source MP damage 固定 0
- 不寫 `state.mp`
- execution-time Enemy target
- 共用 Guardian calc-only bug
- 無普通 Counter
- dispatcher 位於 pending fallback 前

### commits

- `19549cdd5b1fef62810cd6ee86d7f63e0c5ec316` — V1.80 player MP damage core
- `455b25dd1d56b2b5250365a73b0dbfc2db0c7e8d` — V1.80 regression
- `d61402360194b84ff6bfa6d5743f67efe11ac847` — V1.80 playable marker
- `54f3d21e4b14532c75cc2f7b8d466043b0220afd` — V1.80 README
- `28032f151c1c108a11801e3ecf0bca9be669ad8c` — V1.80 changelog index


---

## V1.81 Player RANDOMACT attribute attacks

V1.81 接上玩家出戰 Pet 在低忠誠 `RANDOMACT` 下的 `PETSKILL_Modifyattack` 與 `PETSKILL_Mdfyattack`。

### Fixed rows

Modifyattack：
- 544 / 545 / 546 / 547：EA / WA / FI / WI `|20`
- 825 / 826 / 827 / 828：EA / WA / FI / WI `|9999`

Mdfyattack：
- 548 / 549 / 550 / 551：EA / WA / FI / WI `|100`
- 697 / 698 / 699 / 700：FI / WI / EA / WA `|100`

### Modifyattack

`PETSKILL_Modifyattack()` 只建立 `BATTLE_COM_S_MODIFYATT`；它原本可能有的攻擊修正碼已整段註解，不自行恢復。

`BATTLE_S_AttackDamage()` 在 `BATTLE_AttackSeq()` 回來後，只有 `damage>0` 才呼叫 `BATTLE_S_Modifyattack()`。

`BATTLE_S_Modifyattack()`：
- option 第一段決定讀原目標永久 `CHAR_EARTHAT / WATERAT / FIREAT / WINDAT` 的哪一欄
- 第二段是基本 bonus percent
- 只有目標該屬性 `ModNum>0` 才進 bonus
- 額外 random 寫成 `(float)((rand()%(ModNum+5))/100)`，其中 `/100` 是 C 整數除法先算
- 因此 ModNum<=95 時 random 部分永遠 0；更高屬性時則以整數 1.0 階梯跳增，而不是 0.xx

最重要的是 `BATTLE_S_Modifyattack()` 使用 caller 保存的原 `defindex`。即使 `BATTLE_AttackSeq()` local Guardian 代入了防禦計算，post bonus 仍讀原目標屬性。

原目標若在 AttackSeq 前已有 DamageReact，`BATTLE_S_AttackDamage()` 會先把 local `skill_type=-1`，所以 Modifyattack 的 post switch 不執行，沒有額外屬性 bonus。

### Mdfyattack

`PETSKILL_Mdfyattack()` 會驗證 EA / WA / FI / WI，並把種類與數值寫進 `CHAR_WORKBATTLECOM4`。

真正元素替換發生在 `BATTLE_AttrAdjust()`：只要攻方 `CHAR_WORKBATTLECOM1 == BATTLE_COM_S_MDFYATTACK`，就：
- 清空 At_pow[0..4]
- 只在指定屬性欄寫 option 數值
- 用這個一次性的攻方屬性向量進 `BATTLE_AttrCalc`

這裡檢查的是攻方 WORKBATTLECOM1，不是 `BATTLE_S_AttackDamage()` 的 local `skill_type` 變數。因此原目標有 DamageReact、local skill_type 先降成 -1 時，Mdfyattack 的元素替換仍然會發生。

若 Guardian 成立，這個 element-adjusted AttackSeq 會用 local Guardian 的防禦／屬性做計算；但 caller 原 `defindex` 不變，真正 DamageSub / death / ItemCrush 仍落原目標。

### Shared lifecycle

兩類都使用 V1.79 建立的 execution-time TargetAdjust 與 calc-only Guardian helper，且都是獨立 `BATTLE_S_AttackDamage` case，不進普通 Counter。

### Regression

新增 `tools/check_v181_player_attribute_attacks_runtime.mjs`，檢查：
- 16 筆 fixed row
- EA / WA / FI / WI parser
- Modifyattack 原目標 permanent attr
- rand%(ModNum+5) + integer /100 bug
- Modifyattack DamageReact gate
- Mdfyattack 全屬清零後單屬替換
- Mdfyattack 不因 local skill_type=-1 關閉元素替換
- Guardian calc-only shared path
- no Counter
- dispatcher 位於 pending fallback 前

### commits

- `9819be8fabd6f02160588d75fbd645d5cc8a065d` — V1.81 player attribute attack core
- `322aade11f4d2ea7f7f376cb746441ac53d29d20` — V1.81 regression
- `3371d87d49a978b083d8b3af1b4ffd6156fbfcdb` — V1.81 playable marker
- `947d7470a3bd38dd3b4c7f01f307901b90ca9938` — V1.81 README
- `9595bed33db916256cc5e721b0d91eb9b002429c` — V1.81 changelog index


---

## V1.82 Player RANDOMACT Lighttakeed

V1.82 接入 609～611 `PETSKILL_Lighttakeed`，並完成 574 ToothCrushe 的 player-Pet illegal audit。

### 609～611 Lighttakeed

fixed `PETSKILL_Lighttakeed()` 對非 PLAYER 施術者：
- `WORKATTACKPOWER = WORKFIXSTR * 0.7`
- `WORKDEFENCEPOWER = WORKFIXTOUGH * 0.5`
- 原本可能的 `WORKQUICK * 0.95` 行已註解
- command = `BATTLE_COM_S_LIGHTTAKE`

Web 用 `battlePetPowerMods` 保存這兩個 WORK 值；該 map 在下一個 `normalBattleOrder()` compliance 邊界清空，因此不跨 round，且同 round 的防禦／Counter 計算仍可看到 50% WORKDEFENCEPOWER。

`BATTLE_S_AttackDamage()` 在 AttackSeq 前先讀原目標 DamageReact。Lighttake option 對應：ABSROB / REFLEC / VANISH。只有 ReactType 完全匹配才會在後段把相同 WORKDAMAGE counter 複製到施術者。

目前 source-backed Enemy DamageReact 只有 Acupuncture；它是正 ReactType，但不匹配上述三者。因此目前可證明路徑是：保留 70%/50% WORK 修正，local skill_type 降成普通反應，照 DamageReact 結算，不複製任何未建模光鏡守 counter。

物理部分沿用 V1.79 `BATTLE_S_AttackDamage` calc-only Guardian bug與 execution-time TargetAdjust；case 完成後不進普通 Counter。

### 574 ToothCrushe

574 row 雖有 `PETSKILL_ToothCrushe` 函式，但 `petskill2.txt` 的 `PETSKILL_ILLEGAL=1`。

fixed `PETSKILL_Use()` 在找 function pointer 前先做：CHAR_TYPEPET 且 illegal 非 0 → `return FALSE`。因此玩家寵低忠誠 RANDOMACT 抽到 574 時，正確結果是 NoAction，不可執行 ToothCrushe 的 PLAYER 裝備破壞分支。

現有 `sourcePetRandomSkillPlan()` 已在 dispatch 前保留這個 gate，所以 V1.82 不新增 ToothCrushe handler。

### Regression

新增 `tools/check_v182_player_lighttakeed_runtime.mjs`，檢查 574 illegal NoAction、609～611 rows、70%/50% WORK、無 0.95 敏捷、下一 round 清除、不可達的 ABSROB/REFLEC/VANISH copy、Guardian calc-only 與 no Counter。

### commits

- `14ff0dfe12797542166b7644c0d08a0dfe387a65` — V1.82 Lighttakeed core
- `89b3ffe98bdd495a16d6650b3c65581b221fe463` — V1.82 regression
- `d9aa19704743e57058c86aba19010d5b75a49009` — V1.82 playable marker
- `1468c6ea2a8c3b120c92c1287db1506ea22caec8` — V1.82 README
- `4a96248807fb242034a45908ce6e7acb2c2619eb` — V1.82 changelog index


---

## V1.83 Player RANDOMACT SetDuck self-target failure

595 `PETSKILL_SetDuck` 在一般正規自體使用時可建立閃避效果，但玩家寵低忠誠 `RANDOMACT` 的 call path 不是正規 target metadata path。

fixed `BATTLE_PetRandomSkill()` 先 `BATTLE_DefaultAttacker()` 選 opposing Enemy `toNo`，再呼叫 `PETSKILL_Use(pet,iNum,toNo,NULL)`；`PETSKILL_Use()` 不依 PETSKILL_TARGET=0 改回自己。

`PETSKILL_SetDuck()` 因此把 Enemy `toNo` 原樣寫進 COM2，並回 TRUE。真正執行 `PETSKILL_SetDuckChange_Battle()` 時，在讀 option 前先檢查：

`BATTLE_No2Index(battleindex,toNo) == charaindex`

RANDOMACT 的 Enemy toNo 不可能等於施術 Pet charaindex，因此直接 FALSE。結果是：
- 不讀 `3|60`
- 不寫 CHAR_MYSKILLDUCK / POWER
- 不產生 MagicEffect
- 不消耗 RNG

`PETSKILL_SetDuck()` 另寫 `CHAR_MAGICPETMP=0`。對 fixed repo 全域搜尋只找到 battle init 清 0、SetDuck 清 0、SetMagicPet 讀取後又寫回同一 nums；沒有任何 ++ / 累加。因此所謂「SetMagicPet 單場三次」計數在此 build 沒有可達累加，SetDuck 的清零目前是行為上的 0→0。

V1.83 新增 `sourcePerformPetSetDuckRandomSkill()`，明確結束這個 pending function，但不虛構可用閃避 buff。

Regression：`tools/check_v183_player_setduck_runtime.mjs`。

### commits

- `515fc22ad3766a3c0cd5dc2e93dc897adbf81c17` — V1.83 SetDuck RANDOMACT no-op core
- `5463c87501ed82f41513458631ecddf8ca1c15eb` — V1.83 regression
- `ff0c978788caf316ff33dfe8c7ba0e46c76ce101` — V1.83 playable marker
- `3c2f29cbdb9ad618e8d130af9acfb75140db2606` — V1.83 README
- `ab55da3167deecdee77f75e2d59b2c7e0c49ee36` — V1.83 changelog index

---

## V1.84 SetMagicPet raw COM2 + STR/TGH/DEX/HP lifecycle

V1.84 接入目前 runtime 中 19 筆 fixed `PETSKILL_SetMagicPet`：

- 601～604
- 660～663
- 693～696
- 720～723
- 726
- 838
- 841

### raw COM2 / BATTLE_MultiList

fixed 玩家寵低忠誠 `BATTLE_PetRandomSkill()` 會先用 `BATTLE_DefaultAttacker()` 選 opposing Enemy `toNo`，再把該值原樣傳給 `PETSKILL_Use()`。

`PETSKILL_SetMagicPet()` 不依 `PETSKILL_TARGET` 改寫目標，只把 `toNo` 寫入 COM2；真正 execution 的 `PETSKILL_SetMagicPet_Battle()` 再直接交給 `BATTLE_MultiList()`。因此低忠誠亂放支援技能時，原 C 可以把 STR/TGH/DEX 強化或 HP 回復施加到 Enemy。

Enemy AI 亦有同類來源行為：`battle_ai.c::BATTLE_ai_normal()` 先依一般攻擊 AI 從 opposite side 選 `result->target`，之後 `PETSKILL_Use()` 原樣使用它；`BATTLE_ai_all()` 再把相對 target 轉成 absolute COM2。SetMagicPet 不可硬改成「Enemy 自己一側」。

Web 新增 source-shaped `sourceSetMagicPetMultiList()`：
- 單體 0～19：原 target 已失效時保留 fixed compact `nLifeArea[10]` + `rand()%10` rejection-loop 行為
- 20／21／22：兩側全體／全體常數
- 23～26：前後排與另一排 fallback

### STR / TGH / DEX lifecycle

`PETSKILL_SetMagicPet_Battle()` 的非 HP 分支先檢查 Duck／STR／TGH／DEX 任一是否已存在；有任一即跳過，不能刷新或疊加。

fixed `Other_DefcharWorkInt()` 還保留一個來源 bug：進函式時保存 `mtgh = CHAR_WORKFIXTOUGH`，之後 STR、TGH、DEX 三條都用

`mtgh * power / 100`

當加成量，而不是各自使用 STR／TOUGH／DEX 當基準。V1.84 依「原 C 規則優先、不猜數值」完整保留。

時序同樣照 fixed battle lifecycle：
1. 施放 SetMagicPet 時先寫 `CHAR_MYSKILLSTR/TGH/DEX` 與 POWER
2. 當輪能力不 retroactively 重建
3. 下一輪 `BATTLE_PreCommandSeq -> complianceParameter -> Other_DefcharWorkInt` 才把強化寫入 WORK/FIX
4. 角色輪到行動時 `BATTLE_StatusSeq` 再把自己的 SetMagicPet 回合數 -1
5. 即使 StatusSeq 此時把回合扣成 0，本輪早已建立的 WORK/FIX 仍維持到下一次 PreCommand

Web 因此拆成 live state 與 round snapshot，避免把它誤做成「施放瞬間立即加能力」或「倒數歸零瞬間立即拔掉本輪能力」。

### HP lifecycle

HP option 不建立 STR/TGH/DEX 狀態，而是直接走 fixed `BATTLE_MultiRecovery(..., BD_KIND_HP, power, per=0)`。

每一個 MultiList 目標分別：
- `RAND(power*0.9, power*1.1)`
- 乘 `GetRecoveryRate()`
- Player：`1 + VITAL * 0.00010`
- Pet / Enemy：`1 + VITAL * 0.00005`
- 最後 clamp 到 MaxHP

因此 602／661／694／721／726／838／841 都保留逐目標 RNG，而不是固定回復描述值。

`BATTLE_MultiRecovery()` 尾端還有 Pet recovery 的 battle flag lifecycle：`norisk == 0` 且目標是 Pet 時，第一次 recovery 會 `CHAR_PetAddVariableAi(..., AI_FIX_PETRECOVERY)`，其中 `AI_FIX_PETRECOVERY=+10`；之後以 `CHAR_BATTLEFLG_RECOVERY` 阻止同場重複增加。V1.84 以 `battlePetRecoveryAiIds` 對齊這個一次性副作用。

fixed 騎乘分支會把同一次 recovery 拆給 player 與 ridepet；目前 Web 沒有正式 ride system／ridepet entry，因此依「原 C 規則優先、不猜數值」暫不虛構騎乘分流。

### CHAR_MAGICPETMP

fixed `PETSKILL_SetMagicPet()` 讀取 `CHAR_MAGICPETMP` 並檢查 `>=3`，但成功後只把原值寫回原值，沒有 ++。全 repo 搜尋亦沒有其他可達累加路徑；SetDuck 只會清 0。

所以此 fixed build 的「一場最多三次」實際不會累積。V1.84 不虛構該限制。

### Regression

新增 `tools/check_v184_setmagicpet_runtime.mjs`，鎖定：
- 19 筆 runtime row 的 function／option／target／illegal
- 玩家低忠誠 RANDOMACT 先耗 opposing Enemy target RNG
- raw COM2 直接進 MultiList
- 單體失效後 `rand()%10` compact rejection-loop
- Enemy AI opposite-side raw COM2
- Duck／STR／TGH／DEX 互斥 gate
- STR/TGH/DEX 共用 mtgh 基準 bug
- PreCommand snapshot → target StatusSeq countdown 時序
- HP 90%～110% RNG、RecoveryRate、MaxHP cap
- Pet recovery `AI_FIX_PETRECOVERY=+10` 與一場一次 flag lifecycle
- 玩家 RANDOMACT dispatcher 已在 pending fallback 前接入 SetMagicPet

### commits

- `b57117c568529addce5a9dbddf3efbcb16675e21` — V1.84 SetMagicPet core
- `78f5d05b395ddbf17b51600de09e0e30e8de1840` — target helper call fix
- `ba7f896c40bb563bfc77fcd96c15d8cb65ddb1ba` — V1.84 regression
- `928b84604b140abe62a754588d5571042297ec89` — CI regression step
- `f688af1f4e274d2a3157d03e33ccdb9c4410fe98` — V1.84 playable marker
- `1cc90049bb87c5fd3944efbb042167e6af03fa56` — V1.84 README
- `7f225ffef263d68e55d0f7f5faa0c98ded66b1ec` / `7e07e83da81e72f07765d037a54e5f524f2ae92e` — repair stale V1.77 regression ordering / regex
- `f572f59ac547b03faade3187af047660b42b3ab2` / `dcc0770260071b52b5feaadb169a6e7f9733439b` — repair stale V1.78 regression slot / scope
- `3e8127ac2cea241cd97ee4744a491275fe65904c` — repair stale V1.79 regression scope
- `53447a0347f643a174ea417e18d8b78e13bf38e0` — Pet recovery AI once-per-battle lifecycle
- `91cc53b1cfe99daf7ac517f3bd2fd8d74dddd098` — recovery AI regression coverage
- `f9d6aea4d7e7392e49954b4481ba02da4d43f49c` — V1.84 regression path trigger
- `af401bcd7bed6d482a2649c3ebbef45289dc17b0` — README recovery lifecycle note



---

## V1.85 Player RANDOMACT WildViolent / Speedy / Sacrifice

V1.85 依 fixed `PETSKILL_functbl` 在 SetMagicPet 之後繼續做玩家出戰 Pet 的低忠誠 `RANDOMACT` 差集，接入：

- 541／652／665／671 `PETSKILL_WildViolentAttack`
- 542 `PETSKILL_SpeedyAttack`
- 573 `PETSKILL_Sacrifice`

### WildViolentAttack

fixed `PETSKILL_WildViolentAttack()` 先依 option 讀：
- `攻%` → `WORKATTACKPOWER = FIXSTR + int(FIXSTR * percent)`
- `防%` → `WORKDEFENCEPOWER = FIXTOUGH + int(FIXTOUGH * percent)`
- `回避N` → COM3 high

真正進 `BATTLE_Battling()` 後，該 command 會覆寫：

`attack_max = RAND(3,10)`

並令：

`gDamageDiv = attack_max`

`gBattleDuckModyfy = COM3 high`

因此不能沿用先前 `BATTLE_GetAttackCount()` 的 AttackNum，也不能把每段都算完整單次傷害。

此 command 仍落入 common direct-attack group。玩家 Pet 沒有 CHAR_ARM，因此走非弓 common loop；`BATTLE_TargetListSet()` 先把原 raw COM2 填滿列表，後續每段再把該 raw slot 寫回 COM2 並重新跑 `BATTLE_TargetAdjust()`。若原目標已死亡，後續段數因此可重新消耗 target RNG 換有效目標。

Counter 不是每段一次，而是在整個 `attack_max` loop 結束後，以最後一個 `BATTLE_Attack` 結果／defNo 進 common Counter chain。

### SpeedyAttack

fixed `PETSKILL_SpeedyAttack()` 本體只解析 `防%`：

`WORKDEFENCEPOWER = FIXTOUGH + int(FIXTOUGH * percent)`

資料 option 雖然寫 `防%-30 敏%+30`，但 `敏%+30` 並不由 PetSkill parser 寫入 WORKQUICK。

真正的 +30% 在 `BATTLE_DexCalc()`：

`work = WORKQUICK + 20`

`dex = work + work * 0.3`

關鍵是 fixed `BATTLE_Battling()` 的時序：
1. 先替所有 Entry 做 `BATTLE_DexCalc()`
2. `EntrySort()`
3. 輪到單一 Pet 執行時才 `BATTLE_PetLoyalCheck()`
4. RANDOMACT 才可能把原 command 改成 SpeedyAttack

所以玩家 Pet 因低忠誠 RANDOMACT 臨時抽到 542 時，+30% Speedy Dex 已經太晚，**不會倒帶重排本回合**。Web 只保留當下可達的防禦 -30% WORK 與 common physical attack／Counter。

Enemy AI 的 SpeedyAttack 不同：Enemy PetSkill 是在 EntrySort 前由 AI 選好，因此現有 Enemy path 仍可正常使用 Speedy 的專用排序公式。兩條路徑不可合併成同一時序。

### Sacrifice

fixed `PETSKILL_Sacrifice()` 先檢查：

`HP > WORKMAXHP * 0.2`

是嚴格大於。失敗會直接 `return FALSE`；而 `BATTLE_PetRandomSkill()` 一開始已把 COM1 清成 NONE，因此低忠誠 RANDOMACT 抽到救援但耐久不足時，本回合就是 NoAction。

成功時，RANDOMACT 已先用 `BATTLE_DefaultAttacker()` 選 opposing Enemy raw COM2。真正 `BATTLE_S_Sacrifice()`：

1. `caster HP = caster HP * 0.5`，C int 截斷
2. `Damage = caster` 砍半後的 HP
3. `target HP = min(target HP + Damage, target MaxHP)`

這代表玩家 Pet 低忠誠亂放「救援」時，會真的砍掉自己一半 HP，**替敵方補血**。

函式雖呼叫 `BATTLE_MultiList()` 做魔法動畫，但實際 `CHAR_setInt(defindex, CHAR_HP, ...)` 只寫單一 defindex；不能把動畫 list 誤做成群補。此 case 沒有物理 `BATTLE_Attack`，也沒有普通 Counter。

### Regression / CI

新增 `tools/check_v185_player_wild_speedy_sacrifice_runtime.mjs`，鎖定：
- 541／542／573／652／665／671 runtime rows
- Wild 攻防 option、回避值、`RAND(3,10)`、damage divisor、每段 TargetAdjust 與末段 Counter
- Speedy 只解析防禦，RANDOMACT 發生於本輪排序之後
- Sacrifice 嚴格 20% HP gate、砍半截斷、以砍半後 HP 補 opposing Enemy、無 Counter
- 三個 dispatcher 都位於 pending fallback 前

因 V1.85 helper 插入位置改變，V1.80～V1.83 部分 regression 原本以較遠的 Guardian helper 當文字切片終點，會把新 helper 誤算進舊測試 body。已只修正 regression boundary，沒有更動 V1.80～V1.83 遊戲規則。

完整 GitHub Actions 已確認 V1.72～V1.85 全部 SUCCESS。

### commits

- `cc808a640a4b766bf8301382b85d7f300525b34e` — V1.85 player RANDOMACT Wild / Speedy / Sacrifice core
- `96fe0b2b48bb022693f73d56ccf89bae8c579d80` — V1.85 regression
- `573458ac38192c33bfbaccd90e8333cb1cba753f` — CI V1.85 regression step
- `0048937fda879b3eccf7461020c54830c2cb1fe5` — repair V1.80 regression helper boundary
- `74a132f84683816b0f9231e4b91c87d6a08343fe` — repair V1.81 regression helper boundary
- `5ac2ffb1f1d0828a51ba6ddd671cbee4fceec31e` — repair V1.82 regression helper boundary
- `7f8f3bb6c0d10d2864477a795ddd2398bf66ff2a` — repair V1.83 regression helper boundary
- `bd8347c312642dbd7782e7222c286cbf58bc1b0c` — tighten V1.85 post-sort timing regression
- `35a983192b6a27c33014dd553edfb6594100a2ef` — V1.85 README
