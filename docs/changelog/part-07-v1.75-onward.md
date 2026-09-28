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


---

## V1.86 Player RANDOMACT Gyrate / Retrace

V1.86 繼續 fixed `PETSKILL_functbl` 的玩家出戰 Pet 低忠誠 `RANDOMACT` 差集，接入：

- 619／653／667／831 `PETSKILL_Gyrate`
- 621／713／735 `PETSKILL_Retrace`

### Gyrate

`PETSKILL_Gyrate()` 先從 option 解析 `攻%`，依當輪 `WORKFIXSTR` 算出新的 `WORKATTACKPOWER`，再把 raw `toNo` 原樣寫入 COM2。

真正 battle.c 的 GYRATE 特殊 case **不先做 `BATTLE_TargetAdjust()`**，而是直接依 COM2 分成：

- 0～4 → row 0
- 5～9 → row 5
- 10～14 → row 10
- 15～19 → row 15

接著只在該五格橫排內掃 `BATTLE_TargetCheck()`，先把當下有效目標存成 temp，再逐一呼叫 `BATTLE_Attack()`。

玩家寵低忠誠 RANDOMACT 的 raw COM2 來自 opposing Enemy，因此實際會落在 Enemy 的 10～14 或 15～19 排。Web 依 enemy battleSlot 還原 row，而不是把它改成「全敵方」。

該特殊 case 自己送出 FF 後直接 `break`：
- 不進 common physical loop
- 不進 common Counter
- 該 case 裡也沒有 `BATTLE_AddProfit`

因此 Web 逐目標執行物理 Attack／Guardian／ItemCrush 與傷害，但不額外虛構 Gyrate 專屬 Counter 或 immediate AddProfit。

### Retrace

`PETSKILL_Retrace()` 裡原本解析 `攻%` 的整段程式已被 fixed 原 C 註解。因此：

- 621 顯示 `攻%+20`
- 713 顯示 `攻%+100`
- 735 顯示 `攻%+50`

這些 option **都不直接改首擊攻擊力**。

battle.c common loop 的真正追跡條件是：

1. 先執行普通 `BATTLE_Attack()`
2. 只有 `Battle_Attack_ReturnData == BATTLE_RET_DODGE`
3. 再抽 `RAND(1,100) < 80`
4. 成功時硬編碼：
   `WORKATTACKPOWER = WORKFIXSTR + WORKFIXSTR * 0.2`
5. 對同一個已經過 `BATTLE_TargetAdjust` 的 defNo 再執行一次 `BATTLE_Attack()`

因此不論技能資料寫 +20 / +50 / +100，追擊實際一律是 fixed **FIXSTR +20%**。

玩家 Pet 沒有 CHAR_ARM。battle.c 在 `BATTLE_PetLoyalCheck()` 之前已跑 `BATTLE_GetAttackCount()`；回傳 0 後，因角色不是 PLAYER，直接 fallback 成：

`attack_max = 1`

所以玩家 Pet RANDOMACT Retrace 在目前固定來源路徑只有一個 primary segment。

追擊的第二次 `BATTLE_Attack()` 不會增加 `attack_count`。原碼在 optional follow-up 之後才跑一次 `BATTLE_AddProfit`。之後 common Counter 使用的 `ContFlg / defNo` 仍是 **primary BATTLE_Attack** 的值；follow-up 的 return value 沒有覆寫 ContFlg。

Web 因此保留：
- primary DODGE 才 consume 追跡 RNG
- 嚴格 `roll < 80`
- 固定 +20% 而非 option 值
- primary 與 follow-up 各自完成 ItemCrush lifecycle
- optional follow-up 後一次 AddProfit
- Counter 用 primary result / original post-TargetAdjust target

### Regression / CI

新增 `tools/check_v186_player_gyrate_retrace_runtime.mjs`，鎖定：
- 4 筆 Gyrate / 3 筆 Retrace runtime rows
- Gyrate raw COM2 五格 row 判定
- Gyrate 不使用 execution-time TargetAdjust
- Gyrate no common Counter / no immediate AddProfit
- Retrace attack_max=1
- DODGE → `RAND(1,100)<80`
- 固定 FIXSTR +20% 與 option ignored
- follow-up 不增加 attack_count
- ItemCrush / AddProfit / Counter 時序
- dispatcher 位於 pending fallback 前

V1.86 helper 插入後，V1.83 SetDuck regression 的文字切片終點同步縮到第一個新 helper，避免把 Gyrate / Retrace 的 RNG 誤算進 SetDuck body；沒有更動 V1.83 遊戲規則。

完整 GitHub Actions 已確認 V1.72～V1.86 全部 SUCCESS。

### commits

- `5d4e6b36f34752987781cfddbe49b9d2ce0eb0b9` — V1.86 player RANDOMACT Gyrate / Retrace core
- `2b7ec8e0330076e4035154dc884bdbbee40c8cb9` — repair V1.83 regression boundary
- `be00830832a091d1341b3bdc5f5740e0fb8b84c7` — V1.86 regression
- `3e7ca0fa0d34b6dae80626a8075bfa20322ed02b` — CI V1.86 regression step
- `43750a2f3dea8f3a15e6127543751315226ac76e` — V1.86 README


---

## V1.87 Player RANDOMACT Hector / Sars

V1.87 接入 620 `PETSKILL_Hector` 與 617 `PETSKILL_Sars`，並修正既有 Enemy Sars 共用 status helper 漏掉 `sars` 的缺口。

### Hector

`PETSKILL_Hector()` 會依當輪 `WORKFIXSTR / WORKFIXDEX` 寫入 `WORKATTACKPOWER / WORKQUICK`。玩家 Pet 的低忠誠 RANDOMACT 發生在 EntrySort 後，因此敏捷修正不會倒帶重排，但會保留為本回合 WORKQUICK。

battle.c 的 Hector 特殊段先直接讀 raw COM2，呼叫：

`PROFESSION_BATTLE_StatusAttackCheck(charaindex, def_index, 2, 60)`

該函式第一步就 `RAND(1,100)`，之後才檢查死亡／已有異常；成功條件為嚴格 `roll < 60`。成功直接寫麻痺 1 回合。

之後才 fall-through 進 common physical loop。LOW(COM3) 仍是 skill array 620，已超出 `BATTLE_ST_END`，因此 general `BATTLE_Attack` status block 不會再次做狀態 RNG。

### Sars

617 option 僅為「煞」，`PETSKILL_Sars()` 找不到 `turn` 字串，因此保留預設 turn=3。

命中正傷害後走普通 `BATTLE_StatusAttackCheck` SARS 公式。成功時原 C 寫：
- `WORKSARS = gBattleStausTurn + 1` → 4
- `WORKMODSARS = 1`

只有主感染者有 MODSARS，因此只有它會在 StatusSeq 向相鄰格以 60% 機率傳染；被傳染者只取得 3 回合 SARS，不再成為 carrier。

現有 Enemy `performEnemySars()` 原本已呼叫共用 helper，但 helper 的 allowed type 清單漏掉 `sars`。V1.87 補上 dedicated `battleSarsApplyRaw(..., true)` 分支，Enemy 與玩家 Pet 現在使用相同來源 lifecycle。

### Regression

新增 `tools/check_v187_player_hector_sars_runtime.mjs`，鎖定 Hector RNG 順序、WORKQUICK 同回合覆寫、no second status roll、Sars turn+1/carrier、Enemy Sars 修正，以及兩個玩家 dispatcher。

V1.83 SetDuck regression 的切片終點同步縮到新 Hector helper；沒有改 SetDuck 行為。

### commits

- `2de5adacd702f95bdf6104a51eaeb5f548227944` — V1.87 core
- `fc335c28e4797824af9e3b749e08f57d328fa98d` — V1.87 regression
- `9b606bf485a3775cb972133e8497b219f9592266` — V1.87 CI step
- `df004f2f8db09a5f6dd1ddc6f59a73c7f5324ca1` — repair V1.83 regression boundary


---

## V1.88 Player RANDOMACT Acupuncture

V1.88 接入 622 `PETSKILL_Acupuncture`，並把針刺反彈從 Enemy-only DamageReact 擴展到玩家出戰 Pet。

### Source command

`PETSKILL_Acupuncture()` 寫 `BATTLE_COM_S_ACUPUNCTURE` 與 raw COM2。battle.c 執行時先：

`CHAR_WORKACUPUNCTURE = 1`

然後刻意 fall-through 到 ordinary physical common loop。因此低忠誠 RANDOMACT 抽到 622 時，Pet 會啟動針刺，同時照 raw COM2 / TargetAdjust 攻擊敵方。

Web 以 battle-local `battlePetAcupunctureIds` 保存玩家 Pet flag，battle reset 清空，不新增 save schema。

### DamageReact

`BATTLE_GetDamageReact` 的 Acupuncture 只對非 throw weapon 生效。V1.88 的 shared reaction 現在同時辨識：
- Enemy `unit.acupunctureActive`
- Player Pet `battlePetAcupunctureIds.has(pet.id)`

觸發後完全沿 fixed `BATTLE_DamageSub`：
1. 原傷害若為奇數，先 +1 變偶數
2. defender 先承受完整補偶後傷害
3. 清掉 `WORKACUPUNCTURE`
4. attacker 承受一半傷害

throw weapon 時直接 NONE，flag 不消耗。

若反彈殺死 Enemy attacker，補上 Enemy death credit，讓後續 AddProfit / loot lifecycle 能正常處理。

### Covered physical entrypoints

為避免只在單一路徑生效，V1.88 已接到：
- plain Enemy → Pet
- BOW / BOUNDTHROW / BREAKTHROW 等 weapon helper
- shared Enemy PetSkill → Pet
- Enemy Counter → Pet
- Guardian Pet 代擋
- Combo 的既有 `sourceComboAcupunctureSegment`

所有路徑都共用同一 `sourcePrepareAcupunctureReaction / sourceFinishAcupunctureReaction`。

### Regression

新增 `tools/check_v188_player_acupuncture_runtime.mjs`，鎖定 battle-local flag、throw block、奇數補偶、50% 反彈、flag consume、Enemy death credit，以及各物理入口與 dispatcher。

完整 GitHub Actions 已確認 V1.72～V1.88 全部 SUCCESS。

### commits

- `7ea52dcccd558a1c8c245be566f23f61d4b92cca` — V1.88 core
- `c210901e9cf353165958a87112c77b031df0468b` — V1.88 regression
- `f3dd5c46ebf4217e339d4a7ee81dfc9cd8cbfa2d` — V1.88 CI step
- `0386035e9dec907b99077f1a1e480d1806bf9704` — V1.87/V1.88 README


---

## V1.89 Player RANDOMACT Sonic / Regret

V1.89 接入玩家寵低忠誠 RANDOMACT：

- 618 `PETSKILL_Sonic`
- 640 / 666 / 718 `PETSKILL_Regret`

### Sonic

- 先對 raw COM2 經 `BATTLE_TargetAdjust` 後的主目標執行第一段。
- 只有主目標位於後排 15～19 時，才追加同欄前排 `defNo-5`。
- SONIC2 第二段在 `AttackSeq` 內先做傷害 ×0.5，再進 GuardAdjust。
- 此技能走獨立 `BATTLE_S_AttackDamage`，不進 common Counter loop。

### Regret

- 同樣只在後排主目標時追加 `defNo-5` 前排貫穿段。
- `BATTLE_DamageCalc` 以目標 `FIXTOUGH` 覆蓋一般防禦計算。
- REGRET2 第二段傷害 ×0.8。
- 暈眩判定依 `PROFESSION_BATTLE_StatusAttackCheck`：先消耗 `RAND(1,100)`，再檢查死亡／既有異常；成功條件嚴格 `roll < 命中值`。
- 640 的 `防%-50` 會被原 parser 正確讀到；666/718 的 `防-20%`、`防-35%` 因原 C 只搜尋字串 `防%`，實際不改防禦。保留此來源資料/parser mismatch，不自行修成設計意圖。

### DamageReact crossover

`BATTLE_S_AttackDamage` 會在原始目標已有 DamageReact 時，先把 local `skill_type` 改成 -1：

- Sonic 第二段 ×0.5 被跳過。
- Regret 第二段 ×0.8 被跳過。
- Regret 後續暈眩 switch 被跳過。
- 但 Regret 的 FIXTOUGH 防禦覆蓋仍生效，因為該判定讀的是攻擊者真正的 COM1。

同步修正既有 Enemy Regret，讓 V1.88 Acupuncture 與 Regret 的交叉生命週期一致。

### Regression

新增 `tools/check_v189_player_sonic_regret_runtime.mjs`，並加入 CI。完整 V1.72～V1.89 regression 已確認 SUCCESS。

### commits

- `463c5c812efb2c9fd6a937ec39cbf1364d7a15c0` — V1.89 core
- `69588ca3cde388ae73ab203da346a0f690d03e4c` — ternary syntax fix
- `18cee248e4b993680233a9ca5b0a815a9c061a56` — V1.89 regression
- `712490724d936fc3c9d26ef41ebc05c08d7cdad8` — V1.89 CI

---

## V1.90 Player RANDOMACT Firekill

V1.90 接入 624 `PETSKILL_Firekill`（火線獵殺），完整拆成專用物理段 + 火魔法橫排追加。

### Target resolution

- FIREKILL 不呼叫一般 `TargetAdjust`。
- raw COM2 有效時直接使用。
- raw COM2 已死亡／EarthRound 不可打時，依原流程在同一 Enemy side 以固定 slot 順序找第一個 `TargetCheck` 有效目標。
- 此 fallback 不消耗額外隨機選目標 RNG。

### Physical stage

- 物理段先把 Pet 當輪 FIXSTR 等價攻擊力改成 80%。
- 使用 Firekill 專用 `BATTLE_Attack_FIREKILL` / `BATTLE_DamageSub_FIREKILL` 行為。
- Guardian 仍可在 AttackSeq 中真正代擋物理傷害。
- 最重要來源特例：`BATTLE_DamageSub_FIREKILL` 先讀 DamageReact，下一行立即強制 `react = BATTLE_MD_NONE`。
- 因此 Acupuncture／Reflect／Absorb／Vanish 全都不觸發，也不消耗其狀態。
- 同步修正既有 Enemy Firekill，避免錯誤觸發玩家 Pet 的 Acupuncture。

### Fire magic stage

物理段後固定進：

`BATTLE_MultiAttMagic_Fire(..., FieldAttr=2, Power=200)`

來源固定值：

- Fire MagicLv = 4
- Pet attack magic level = 5
- Power = 200
- Enemy magic resist = `trunc(enemyLv * 0.5)`
- Magic dodge 對非 Player（包含 Enemy）走 Pet 分支：`min(30, Lv * 0.2)`
- 整個橫排只先抽一次 TrueMagic `rand()%100`；Pet level=5 時等價 `roll <= 5`
- Firekill 專用函式中的 false-magic ×0.7 被原 C 註解掉，因此 TrueMagic roll 只保留 RNG lifecycle，不改此技能傷害

魔法目標仍依「原 resolved defNo 所在五格橫排」建立，**不跟著 Guardian 的實際物理承傷位置改列**。

### Damage / row lifecycle

- 物理段先完成。
- 接著重新依該列目前仍存活且 TargetCheck 有效的 Enemy 建立魔法目標。
- 物理段已死亡的主目標不再吃火魔法，但同排其他敵人仍照常被打。
- 火魔法列全部結束後才處理睡眠解除。
- FIREKILL 為獨立特殊 case，不進 common Counter。
- 死亡／EXP／掉落由 actor outer AddProfit boundary 統一收尾。

### Regression

新增 `tools/check_v190_player_firekill_runtime.mjs`，鎖定：

- deterministic same-side fallback
- FIXSTR ×0.8 physical
- dedicated DamageReact forced NONE
- Guardian physical target vs original magic row
- Enemy magic dodge / resist
- one TrueMagic roll
- no false-magic ×0.7
- row targeting
- no Counter
- Enemy Firekill Acupuncture bypass

完整 GitHub Actions **V1.72～V1.90 全部 SUCCESS**。

save schema 維持 **29**。

### commits

- `2e1ba50f0b219e5d2356a3809f18f0a2d261a22c` — V1.90 core
- `d47ffd751b3d59ef24f119e758ebf0071c9b02e1` — V1.89 regression boundary repair
- `c8cbc1e37d6bbedc1a28dba10103c003f53e7cc3` — V1.90 regression
- `641a2093f3514594355a35438420ce8b6ec94407` — V1.90 CI

---

## V1.91 Player RANDOMACT BattleTearDamage

V1.91 接入玩家寵低忠誠 RANDOMACT：

- 615 `PETSKILL_BattleTearDamage`（撕裂傷口1，20%）
- 616 `PETSKILL_BattleTearDamage`（撕裂傷口2，50%）
- 651 `PETSKILL_BattleTearDamage`（撕裂傷口4，150%）
- 656 `PETSKILL_BattleTearDamage`（撕裂傷口3，70%）

### Work power lifecycle

原 `PETSKILL_BattleTearDamage()` 在 battle.c 執行前先寫：

- `WORKATTACKPOWER = trunc(FIXSTR * 0.9)`
- `WORKDEFENCEPOWER = trunc(FIXTOUGH * 0.8)`

低忠誠 RANDOMACT 發生在 EntrySort 後，所以本回合排序不會被 80% 防禦影響；但該 work defence 仍保留給同回合後續攻擊使用。

### Old-wound damage

`BATTLE_S_AttackDamage(... PETSKILLTEAR ...)` 先做一般 AttackSeq，再依目標已損 HP 增傷：

`tearBonus = trunc((MAXHP - HP) * atoi(option) / 100)`

保留原 C 特例：

- 目標尚未損 HP，或算出的 `tearBonus <= 0` 時，不是「只是不追加」，而是直接把本次 `damage = 0`。
- 目標有舊傷時，才把 `tearBonus` 加到原物理傷害。
- Enemy 目標沒有騎寵 HP 合併分支，因此只讀該 Enemy 自身 MAXHP / HP。

### DamageReact crossover

`BATTLE_S_AttackDamage` 會在 AttackSeq 前先讀原始目標 DamageReact。

若原始目標已有 DamageReact：

- local `skill_type` 先變成 -1。
- 90% 攻擊／80% 防禦 work 值仍已寫入，不回滾。
- PETSKILLTEAR 的已損 HP 追加整段跳過。
- DamageSub / Acupuncture 仍照一般反應流程處理。

同步修正既有 Enemy Tear，讓玩家 Pet 的 Acupuncture 與 Tear 交叉生命週期符合相同原 C 規則。

### Counter / AddProfit

- Tear 是獨立 `BATTLE_S_AttackDamage` case。
- 不進 common Counter loop。
- 玩家側不在技能內額外跑 AddProfit；沿用 actor command-end outer boundary。

### Regression

新增 `tools/check_v191_player_tear_runtime.mjs`，鎖定：

- 615 / 616 / 651 / 656 runtime rows
- FIXSTR ×0.9 / FIXTOUGH ×0.8
- TargetAdjust lifecycle
- 已損 HP 整數截斷
- `tearBonus <= 0 => damage = 0`
- DamageReact 先於 AttackSeq 並關閉 Tear 特效
- calc-only Guardian helper
- no common Counter / no inner AddProfit
- Enemy Tear × Acupuncture crossover

save schema 維持 **29**。

### commits

- `6f6fbd925d66fb3d680b9956ec3448f4101a74b1` — V1.91 core
- `cf3e0ac789f89c2e5943edf7488711ddf6c23079` — V1.91 regression
- `fb1f1b92cee4d297a8b8345ca64080667f1e9b97` — V1.91 CI
- `74c90e4b0f4d7b6ca928d5de53c6cda9d1f2c416` — V1.91 playable-core marker

---

## V1.92 Player RANDOMACT ShowMercy / BecomePig

V1.92 接入玩家寵低忠誠 RANDOMACT：

- 626 `PETSKILL_ShowMercy`（手下留情）
- 635 `PETSKILL_BecomePig`（黑烏力化）

### ShowMercy / 手下留情

原 `PETSKILL_ShowMercy()` 只寫 COM1 / COM2；實際效果發生在 common `BATTLE_Attack()` 內的 `BATTLE_DamageSub()`：

`if (HP - damage <= 0 && COM1 == SHOWMERCY) damage = HP - 1`

保留原 C 順序：

1. AttackSeq 先完成 Dodge / Guardian / Critical / Damage。
2. 若 Guardian 成功，`BATTLE_Attack()` 的 local defindex 先改成 Guardian。
3. `BATTLE_DamageSub()` 再以這個實際 defindex 做 HP-1 clamp。
4. clamp 發生在 DamageReact 之前；因此 Acupuncture 仍可把 clamp 後的奇數傷害補成偶數，極端情況仍可能造成死亡。

Counter 特例：

- common loop 刻意不把 SHOWMERCY 的 COM1 改成 ATTACK。
- 原目標可做第一段 Counter。
- 但 ShowMercy Pet 自己的 COM1 仍不是 ATTACK / NOGUARD，所以不能再 Counter 回去。
- 因此玩家側 Counter chain 鎖為最多 1 段。

### BecomePig / 黑烏力化

635 的物理段仍進 common `BATTLE_Attack()`：

- BECOMEPIG 沒有 SHOWMERCY 的 COM1 例外，因此進攻擊前會被 common loop 改成 ATTACK。
- 所以完整最多 5 段 Counter chain 仍成立。
- Guardian 只改 `BATTLE_Attack()` local defindex；外層 common loop 的 defNo 保留原 TargetAdjust 目標，因此 Counter 對象仍是原目標。

烏力化後置效果是在整個 common Counter loop **之後** 才判定。

原 C 條件順序：

1. primary `Battle_Attack_ReturnData` 不是 MISS / DODGE / ALLGUARD / ARRANGE
2. `BATTLE_TargetCheck(defNo)`
3. defNo 的 `CHAR_WHICHTYPE == CHAR_TYPEPLAYER`
4. 非同隊
5. `CHAR_BECOMEPIG < 2000000000`
6. 之後才 parse option
7. 最後才 `rand()%100 < rate`

玩家 Pet RANDOMACT 的敵方 defNo 是 `CHAR_TYPEENEMY`，因此固定在第 3 步失敗：

- 不 parse `30 180 100388`
- 不 consume pig `rand()%100`
- 不套用黑烏力化
- 只保留物理攻擊與完整 Counter lifecycle

### Guardian / ContFlg audit

新增共用 source helper，鎖住 common `BATTLE_Attack()` 的重要 caller 行為：

- attacker 或原始 defindex 在 AttackSeq 前已有 DamageReact → `ContFlg = FALSE`
- Critical → `ContFlg = FALSE`
- 實際 Guardian / target 正在 GUARD → `ContFlg = FALSE`
- 實際被扣 HP 的 defindex 死亡 → `ContFlg = FALSE`
- DODGE / MISS / ARRANGE 本身不會直接把 `ContFlg` 清 FALSE
- Guardian 不會改外層 defNo，因此 Counter 從原目標開始

### Regression

新增：

`tools/check_v192_player_showmercy_becomepig_runtime.mjs`

鎖定：

- 626 / 635 runtime row
- ShowMercy Guardian-substituted HP-1 clamp
- clamp before DamageReact
- ShowMercy Counter 最大 1 段
- BecomePig full Counter chain
- Guardian outer defNo preservation
- BecomePig Enemy target 在 PLAYER type check 前停止
- no option parse / no pig RNG
- dispatch 在 runtime-pending fallback 之前

save schema 維持 **29**。

### commits

- `8d7bfa6d02b80332d91be6ef6f38282d648b5d07` — V1.92 core
- `554c377c09ae087c0440eb68b8604e6126abd34c` — V1.92 regression
- `11fc1d0f822c9c69349a371b6c9eb1472fa7c37e` — V1.92 CI
- `4326f3f1c870272bd294e82079f06be7fb94574d` — V1.92 playable-core marker

---

## V1.93 Player RANDOMACT BatFly / DivideAttack

V1.93 接入玩家寵低忠誠 RANDOMACT：

- 633 `PETSKILL_BatFly`（群蝠四竄）
- 634 `PETSKILL_DivideAttack`（分身地裂）

### 共用 TargetAdjust gate

兩個 battle.c case 都先執行：

`BATTLE_TargetAdjust(battleindex, charaindex, myside)`

即使後面的 all-side helper 不使用 defNo，也必須先通過這個 gate。

因此：

- raw COM2 仍有效時，不新增 target RNG。
- raw COM2 已死亡／隱藏時，仍要由 `BATTLE_DefaultAttacker` 消耗 fallback target RNG。
- 若完全沒有可用敵人，技能 NoAction。

### BatFly / 群蝠四竄

`BATTLE_BatFly()` 對敵側 `BATTLE_MultiList` 的 TargetCheck-valid Entry 逐一處理。

目前 generated Enemy Battle Entry 沒有 ride-pet 關係，因此全部走 no-ride 分支：

- HP 1～9：固定扣 1
- HP >= 10：扣 `floor(currentHP / 10)`
- 傷害直接寫 `CHAR_HP`
- 不做 AttackSeq / DamageSub / DamageWakeUp / ItemCrush / Counter

每個目標扣掉的 HP 全部累加成 `addhp`，再回復施術 Pet。

保留來源 overflow quirk：

- 若 `currentHP + addhp > maxHP`，實際 HP 直接設為 maxHP。
- 之後 local `addhp` 被設為 0，只影響來源送出的 protocol 顯示值。
- 實際治療量仍是到 maxHP 的差額。

### DivideAttack / 分身地裂

`BATTLE_DivideAttack()` 有兩輪。

第一輪只處理：

`CHAR_WHICHTYPE == CHAR_TYPEPLAYER`

Enemy 側全部是 `CHAR_TYPEENEMY`，因此玩家 Pet 對 Enemy 使用時：

- Enemy MP 完全不變
- 不消耗任何 MP 相關 RNG
- 第一輪是 strict no-op

第二輪處理 HP。

目前 Enemy 沒有 ride-pet 關係，因此全部走 no-ride 分支：

- HP 1～4：固定扣 1
- HP >= 5：扣 `floor(currentHP / 5)`，也就是目前 HP 20%
- 直接寫 HP
- 不走命中、屬性、Guard、DamageReact、WakeUp、ItemCrush 或 Counter

### Reward / AddProfit

BatFly / DivideAttack 都不在函式內呼叫普通物理 AddProfit。

Web runtime 在直接 HP 寫入造成 Enemy 死亡時，先鎖定 Pet reward credit；generic actor outer AddProfit boundary 仍負責後續 command-end lifecycle。

### Regression

新增：

`tools/check_v193_player_batfly_divideattack_runtime.mjs`

鎖定：

- 633 / 634 runtime rows
- TargetAdjust gate
- BatFly HP /10、minimum 1
- BatFly overflow `addhp=0` protocol quirk
- DivideAttack Enemy MP strict no-op
- DivideAttack HP /5、minimum 1
- no WakeUp / ItemCrush / Counter
- no inner AddProfit
- Enemy death Pet reward credit
- dispatch 在 runtime-pending fallback 之前

save schema 維持 **29**。

### commits

- `0f6752f79d2209ecaa11c9106094f6722fa97be3` — V1.93 core
- `0d64a2897f1bdfb7755ef199a247ee882545f6c2` — V1.93 regression
- `817e73e0204eacaab19279f292e7c429443cc88e` — V1.93 CI
- `ddb51f0f90bd4bdbb5616348ac25bc917fe39903` — V1.93 playable-core marker

---

## V1.94 Player RANDOMACT BattleTimid / 2BattleTimid

V1.94 接入玩家寵低忠誠 RANDOMACT：

- 606 / 727 `PETSKILL_BattleTimid`（怯戰）
- 636 `PETSKILL_2BattleTimid`（狂獅怒吼）
- 824 `PETSKILL_2BattleTimid`（恐嚇）

### BattleTimid work power

原 `PETSKILL_BattleTimid()` 在 battle.c 前直接寫：

- `WORKATTACKPOWER = trunc(FIXSTR * 0.7)`
- `WORKDEFENCEPOWER = trunc(FIXTOUGH * 0.4)`
- `WORKQUICK = trunc(FIXDEX * 0.8)`

低忠誠 RANDOMACT 發生於 EntrySort 之後，因此 quick 不能回頭改本回合排序，但 work 值仍保留。

### 2BattleTimid parser quirk

固定原 C 對負號 token 的做法不是「扣掉百分比」，而是直接乘該百分比：

- `-攻%50` → `FIXSTR * 0.50`
- `-防%40` → `FIXTOUGH * 0.40`
- `-敏%30` → `FIXDEX * 0.30`

正號 token 才是加回 FIX：

- `+敏%30` → `FIXDEX + FIXDEX * 0.30`

因此目前：

- 636：攻 = FIXSTR 50%，敏 = FIXDEX 130%
- 824：攻 = FIXSTR 50%，敏 = FIXDEX 150%
- 兩者都沒有防 token，防禦不改

### BATTLE_S_AttackDamage / DamageReact

兩招都走 isolated `BATTLE_S_AttackDamage`。

原函式會在 AttackSeq 前先讀原始 defindex 的 DamageReact：

- 有 DamageReact → local `skill_type = -1`
- Timid / 2Timid 的後置 switch 整段被跳過
- 不 consume timid `rand()%100`
- 物理 DamageSub / Acupuncture 仍照一般反應流程
- 不進普通 Counter loop

同步修正既有 Enemy Timid / 2Timid × 玩家 Pet Acupuncture crossover。

### BattleTimid forced exit

只有 local TIMID switch 存活且最終 `damage > 0` 才抽：

`rand()%100`

- damage == 1 仍先 consume RNG，但不能觸發退場
- `roll < 15 && damage > 1` 才成功

玩家 Pet 的目標是 `CHAR_TYPEENEMY`，所以成功時走原 else：

- `BATTLE_Exit(defindex, battleindex)`
- 不算正常擊殺 reward

為避免 Web 在 DamageSub 後先鎖定擊殺獎勵，V1.94 新增可選 `deferDeathCredit`：

- 普通攻擊預設行為完全不變
- Timid 先完成 damage / ItemCrush / timid RNG
- 若 forced BATTLE_Exit 成功，不建立 kill credit
- 若沒有 forced exit 而 Enemy HP <= 0，才建立 Pet kill credit

### 2BattleTimid Enemy target

local 2TIMID switch 存活且 `damage > 0` 時：

- 先 consume `rand()%100`
- 成功條件使用 option 的 `命%60`
- damage == 1 仍 consume RNG，但不能進效果分支

真正的收寵只在：

`CHAR_WHICHTYPE == CHAR_TYPEPET`

玩家 Pet 攻擊 Enemy 時 defindex 是 `CHAR_TYPEENEMY`，所以即使 roll 通過且 damage > 1：

- 不 BATTLE_PetIn
- 不讓 Enemy 退場
- Enemy 若被物理傷害擊殺，照正常 Pet kill credit

### Regression

新增：

`tools/check_v194_player_timid_runtime.mjs`

鎖定：

- 606 / 727 / 636 / 824 runtime rows
- 70% / 40% / 80% fixed work power
- 2Timid parser quirk
- DamageReact suppresses Timid RNG
- damage==1 still consumes RNG
- BattleTimid Enemy BATTLE_Exit without kill reward
- 2Timid Enemy type cannot be recalled
- isolated no-Counter lifecycle
- Enemy-side Timid × Acupuncture crossover
- generic hit helper default reward behavior unchanged

save schema 維持 **29**。

### commits

- `1009929ff67a9468b6e1c69286b54d818b410727` — V1.94 core
- `d12a9e3d13ab4ee76ec8632c32822b9e5c1e3ef0` — V1.94 regression
- `48d97e4689ab49fa5cfb50a8ea143936c5b6f4fd` — V1.94 CI
- `3ff05b5da784788e5a07619c7dc1bb05e249192f` — V1.94 playable-core marker

---

## V1.95 Player RANDOMACT MagicStatusChange

V1.95 接入玩家寵低忠誠 RANDOMACT：

- 552 / 553 `PETSKILL_MagicStatusChange`（鐵壁 3 回合 / 30）
- 565 `PETSKILL_MagicStatusChange`（銅牆 5 回合 / 40）
- 658 `PETSKILL_MagicStatusChange`（玄武鐵壁 3 回合 / 50）

### RANDOMACT target quirk

原 `BATTLE_PetRandomSkill()` 在掃技能前已經先做：

`BATTLE_DefaultAttacker(battleindex, 1-side)`

也就是先抽一個敵方 COM2。

`PETSKILL_MagicStatusChange()` 不會依技能資料的 target=2 重新選「我方」，而是直接：

`CHAR_WORKBATTLECOM2 = toindex`

因此低忠誠 RANDOMACT 抽到鐵壁系時，會把**敵方 COM2** 帶進執行階段。

### 「全」不是全體重定向

option：

- `铁壁|3|30|全`
- `铁壁|5|40|全`
- `铁壁|3|50|全`

第四欄只在包含「單」時做 `toNo < 20` 的合法性檢查。

「全」本身不改寫 toNo。

真正套用目標仍由：

`BATTLE_MultiList(battleindex, toNo, ToList)`

決定。

RANDOMACT COM2 是 10～19 的單一 Enemy slot，因此：

- raw Enemy 還活著：只對該 Enemy 套鐵壁
- raw Enemy 已死亡／不在場：在同一敵側用來源 `rand()%10` 反覆挑存活 Entry
- 不會因 option 寫「全」就套整個敵方 side
- 更不會自動改成玩家／自己的 side

### SuperWall

目前四個可達 row 都解析為 MagicStatus「鐵壁」。

對選中的 Enemy：

- 若已有任何目前 source-backed MagicTbl 鐵壁狀態，不刷新
- 否則設定 `superWallTurns = turn`
- `superWallPower = nums`

現有 DamageCalc 已按原 C：

- 基礎防禦先走來源比例
- 有 SuperWall 時，每次物理傷害計算再 consume `rand()%20`
- 防禦追加 `(power + rand()%20)%`

技能本身：

- 不做物理 AttackSeq
- 不做 ItemCrush
- 不進 Counter

### Field-filter audit

這輪順帶確認原 `BATTLE_PetRandomSkill()` 只接受：

- `PETSKILL_FIELD_ALL`
- `PETSKILL_FIELD_BATTLE`

Web 已對應為 `field===0 || field===1`。

因此 field=2 的加工／料理／修復／鑲寶石等技能本來就不可能被 RANDOMACT 抽到，不新增錯誤的戰鬥 dispatch。

### Regression

新增：

`tools/check_v195_player_magicstatuschange_runtime.mjs`

鎖定：

- 552 / 553 / 565 / 658 runtime rows
- RANDOMACT opposing COM2 preservation
- 「全」文字不重定向目標
- 0..19 單目標 BATTLE_MultiList semantics
- raw target dead 時同側 `rand()%10` fallback
- SuperWall turns / power
- no Counter / no ItemCrush
- field=2 非戰鬥技能持續被 RANDOMACT filter 排除

save schema 維持 **29**。

### commits

- `63698af4adfac838120ee6788e4b0c7e722fc350` — V1.95 core
- `dab8a42f0bccfbe1390bfdf5bc9e886a76ed9c42` — V1.95 regression
- `9a85b2ea96f75453f27e79a49d000d4f3b5d99cf` — V1.95 CI
- `bb1ec30325250def3c0359d932922230b03f7b25` — V1.95 playable-core marker

---

## V1.96 Player RANDOMACT Abduct

V1.96 接入玩家寵低忠誠 RANDOMACT：

- 130 `PETSKILL_Abduct`（旅程伙伴）
- 607 `PETSKILL_Abduct`（旅程伙伴2，option=60）

### TargetAdjust

battle.c 的 `BATTLE_COM_S_ABDUCT` 先執行：

`BATTLE_TargetAdjust(battleindex, charaindex, myside)`

因此 raw RANDOMACT COM2 若已失效，仍由 `BATTLE_DefaultAttacker` 重新消耗敵方 target RNG。

### Enemy target formula

`BATTLE_Abduct()` 在 `_BATTLE_ABDUCTII` 下只有：

`AiPer > 0 && Deftype == CHAR_TYPEPET`

才改走 FIXAI 判定。

玩家 Pet RANDOMACT 對到的是 `CHAR_TYPEENEMY`，所以：

- 130 空 option：走等級公式
- 607 option=60：**仍走同一個等級公式**
- 607 的 60 不會拿來和 Enemy FIXAI 比

來源公式：

`per = trunc((defLevel - attackLevel) * 0.6 + 30)`

再：

`per = max(per, 50)`

判定：

`RAND(1,100) < per`

不額外 clamp 100。

### Exit lifecycle

目標是 `CHAR_TYPEENEMY`。

成功時：

- `BATTLE_Exit(defindex)`
- Enemy 直接離場
- 不屬於擊殺
- 不產生 kill EXP／掉落 credit

無論成功或失敗，只要施術者是 Pet：

- `BATTLE_PetDefaultExit(owner)`
- `CHAR_DEFAULTPET = -1`
- 施術 Pet 自己一定離開本場戰鬥

Web 因最後一隻 Enemy 直接離場時會立即 teardown battle，V1.96 先標記 caster Pet out / default cleared，再執行 Enemy direct exit；此順序不改任何來源 RNG，並確保 teardown 後的最終狀態等價於原 C 依序執行兩個 Exit。

### No attack lifecycle

Abduct：

- 不造成物理 damage
- 不跑 DamageSub
- 不跑 ItemCrush
- 不進 Counter
- 不建立 Enemy kill credit

### Regression

新增：

`tools/check_v196_player_abduct_runtime.mjs`

鎖定：

- 130 / 607 runtime rows
- TargetAdjust path
- Enemy 永遠使用 level formula
- option=60 對 Enemy 被忽略
- `RAND(1,100) < per`
- 成功 Enemy direct BATTLE_Exit 無 kill reward
- caster Pet 無論成功失敗都退出
- DEFAULTPET / active Pet 清除
- 最後 Enemy teardown 仍掃全部 owned Pet 做 HP finalization
- no damage / no Counter / no inner AddProfit

save schema 維持 **29**。

### commits

- `8c131a6fcfa85857314a5f0bf35812e0b7925d8e` — V1.96 core
- `4cf0d1bc3847e3b2546236f28bf0d8ce18b79c8b` — V1.96 regression
- `c25b49f292f138f1f5fa426ac5e7916fabf1efb0` — V1.96 CI
- `9bdcaae6052f9e23331aaac03626d6e4c3dc012e` — V1.96 playable-core marker

---

## V1.97 Player RANDOMACT Steal

V1.97 接入玩家寵低忠誠 RANDOMACT：

- 140 `PETSKILL_Steal`（偷竊）

### Player Pet → Enemy

battle.c 先走 `BATTLE_TargetAdjust`。

進入 `BATTLE_Steal()` 後，來源只讓：

`CHAR_TYPEPLAYER => per = 50`

其他類型全部：

`per = 0`

玩家 Pet 的 RANDOMACT 目標是 `CHAR_TYPEENEMY`，因此：

- `per = 0`
- 仍然一定 consume 一次 `RAND(1,100)`
- 判定為嚴格 `roll < 0`，固定失敗
- 不進第二顆「石幣／道具模式」RNG
- 不讀 Enemy 石幣
- 不碰 Enemy existing item
- 不讓施術 Pet 離場
- 無 damage / ItemCrush / Counter

### Enemy Steal audit

本輪同步修正既有 Enemy→Player 偷竊生命週期。

來源流程：

1. `RAND(1,100) < 50` 才算第一階段成功。
2. 成功後才 `RAND(1,100) < 50` 決定石幣／道具。
3. 石幣模式再 consume `RAND(8,12)`。
4. 道具模式只掃 `CHAR_STARTITEMARRAY .. CHAR_MAXITEMHAVE-1`。
5. 有可偷 existing item 時才 consume `RAND(0,j-1)`。
6. 最終 `flg == 1` 時施術 Enemy 自己 `BATTLE_Exit`。

Web 舊版曾從 `state.inventory` aggregate key 偷道具；V1.97 改成真正 15 格 existing-item backpack：

- 不偷裝備格
- 不把只有 aggregate、沒有 source existing index 的 legacy item 捏造成可偷物
- 抽中後清 Player backpack slot
- 同步扣 aggregate UI mirror
- `ITEM_endExistItemsOne` 對應為 `sourceItemRuntimeFree(existing index)`

成功偷到石幣或 existing item 後：

- 施術 Enemy 直接離場
- 該離場沒有擊殺 EXP／掉落
- 若偷竊模式最後失敗（0 石幣／沒有 existing item），Enemy 不離場

另外修正 Enemy 對 Pet 目標時的 RNG：

- 目標不是 PLAYER → per=0
- 仍 consume 第一顆 `RAND(1,100)`
- 不再因 Web early-return 而漏掉來源 RNG

### Regression

新增：

`tools/check_v197_player_steal_runtime.mjs`

鎖定：

- 140 runtime row
- Player→Enemy per=0
- 正好一顆 success RNG
- no mode / gold / item RNG
- Pet 不退出
- Enemy Steal success RNG order
- 15 格 existing ItemBox scan
- existing item destroy
- successful Enemy attacker BATTLE_Exit
- mode failure 不退出
- dispatch 在 runtime-pending fallback 前

save schema 維持 **29**。

### commits

- `05b02b4a4b96078824a193fbbe949857734b7252` — V1.97 core
- `f4efac642f82f14bda628fbf101af6d4d56baed4` — V1.97 regression
- `8c3504e0b89e5351185743e2203c88d7c88ff4b2` — V1.97 CI
- `3938034e1affc4fc7c4e331611d24fa83148f807` — V1.97 playable-core marker

---

## V1.98 Player RANDOMACT StealMoney

V1.98 接入玩家寵低忠誠 RANDOMACT：

- 211 `PETSKILL_StealMoney`（捐獻）

### Enemy target

battle.c 先走 `BATTLE_TargetAdjust`，再進 `BATTLE_StealMoney()`。

對 `CHAR_TYPEENEMY`：

`per = 5`

但若施術者是 Pet 且主人已達 `CHAR_getMaxHaveGold(owner)`：

`per = 0`

Web 使用既有 fixed `sourcePlayerMaxGold()`：

`1,000,000 + 轉生次數 × 1,800,000`

### RNG

第一顆永遠 consume：

`RAND(1,100) < per`

因此 per=5 的實際成功 roll 是 1～4。

若主人金錢已滿：

- per 先被改為 0
- 仍 consume 第一顆 `RAND(1,100)`
- 固定失敗
- 不抽第二顆石幣 RNG

成功後，Enemy 目標走：

`GOLD = RAND(10,100)`

這不是從 Enemy 自身 GOLD 扣除，而是來源直接產生 10～100 石幣。

### Owner / Pet lifecycle

成功時：

- 石幣加到 Pet 主人
- 超過持有上限時 clamp 到 max gold
- `BATTLE_PetDefaultExit(owner)`
- `CHAR_DEFAULTPET = -1`
- Pet 自己退出本場戰鬥

失敗時：

- 不增加石幣
- Pet 留在戰場

此技能：

- 不造成 damage
- 不走 DamageSub
- 不做 ItemCrush
- 不進 Counter

### Regression

新增：

`tools/check_v198_player_stealmoney_runtime.mjs`

鎖定：

- 211 runtime row
- Enemy per=5
- owner max gold → per=0
- 第一顆 RNG 無條件 consume
- 嚴格 `roll < per`
- success-only `RAND(10,100)`
- Enemy GOLD 不被扣
- 主人金錢上限 clamp
- 成功 Pet exit / 失敗 Pet stay
- no damage / no Counter
- dispatch 在 runtime-pending fallback 前

save schema 維持 **29**。

### commits

- `0cf9b338d87c331f7ddbd74bcf09e27c01d1c50e` — V1.98 core
- `0bd8230bb468a6f37683f716b6400f1f9faac390` — V1.98 regression
- `a1f4789ea5c515e3e1591e5e394f4fb1700a1d25` — V1.98 CI
- `9b09ece0ddc821e874c5778ebcd7b028b3b3259e` — V1.98 playable-core marker


---

## V1.99 Player RANDOMACT AttackCrazed

V1.99 接入玩家寵低忠誠 `RANDOMACT`：

- 613 `PETSKILL_AttackCrazed`（狂亂暴走）
- runtime：`field=1`、`target=1`、`option=3`、`illegal=0`
- fixed `PETSKILL_functbl` 有正式 `PETSKILL_AttackCrazed` handler

### Command 建立

fixed `PETSKILL_AttackCrazed()`：

- `COM1 = BATTLE_COM_S_ATTCRAZED`
- `COM2 = RANDOMACT 已抽好的 toNo`
- `WORKATTACKPOWER = trunc(WORKFIXSTR * 0.8)`
- `WORKDEFENCEPOWER = trunc(WORKFIXTOUGH * 0.7)`
- `COM3 low = PetSkill array`
- `COM3 high = atoi(option)`

613 的 option 是 `3`，因此執行階段：

`attack_max = 3`

此 command **沒有**寫 `gDamageDiv`，和 RENZOKU／ATTSHOOT／WILDVIOLENT 不同；三段都是完整物理攻擊，不自行除以 3。

### TargetList 原 C 邊界

`BATTLE_TargetListSet()` 先把整個 `aDefList` 填成原 COM2，再處理 ATTCRAZED：

`for(i=defsub; i<deftop; i++)`

Enemy side 若 COM2 在 10～19：

- `defsub = 10`
- `deftop = 19`
- 實際掃描只有 **10～18**
- slot 19 不會進 ATTCRAZED 預抽池

Web 的 Enemy `battleSlot` 是 0-based，因此 V1.99 精準對應成只預抽 `battleSlot 0..8`。

若 10～18 沒有任何 `BATTLE_TargetCheck` 通過：

- source 在 `j == 0` 直接 return
- 先前填好的原 COM2 list 保留
- 不 consume ATTCRAZED target-list RNG

若預抽池存在，則來源在第一擊前一次抽完全部 3 顆：

`RAND(0, j-1)`

不得與 Duck／Critical／Damage／ItemCrush RNG 交錯。

### Non-BOW 第一擊 quirk

玩家 Pet 沒有 `CHAR_ARM`，固定走 `ITEM_FIST` / non-BOW。

來源雖然已經抽了 `aDefList[0]`，第一擊仍使用原 COM2 再做 `BATTLE_TargetAdjust`：

- 第一顆 target-list RNG **已消耗**
- 但第一顆抽到的目標值**不使用**
- 第二、三擊才取 `aDefList[i]`
- 後續預抽目標若已死亡／失效，才在當段重新 `DefaultAttacker` 並 consume fallback RNG

### Counter lifecycle

每段：

1. `BATTLE_Attack`
2. `BATTLE_AddProfit`
3. `++attack_count`

只有整個 attack loop 結束後才進共用 Counter loop；Web 因此不在每一擊後各做一次 Counter。

### Regression

新增：

`tools/check_v199_player_attackcrazed_runtime.mjs`

鎖定：

- 613 runtime row
- FIXSTR × 0.8 / FIXTOUGH × 0.7
- COM3 high / option=3 attack count
- ATTCRAZED 無 `gDamageDiv`
- slot 19 排除的 `i < deftop` 原碼邊界
- all target RNG before first attack
- empty pre-roll pool 不 consume target-list RNG
- non-BOW first-hit original COM2 quirk
- later dead target fallback RNG
- single post-loop Counter
- player RANDOMACT dispatch 在 runtime-pending fallback 前

### CI 修正

巡檢 V1.99 時發現 workflow 的 V1.90～V1.98 paths 段落含 8 個字面 `\\n`，不是 YAML 真換行。

V1.99 已：

- 全部改回真正換行
- 加入 V1.99 path trigger
- 加入 V1.99 regression step

save schema 維持 **29**。

### commits

- `97d2b712075f2762b0992197473abb34c4f0b571` — V1.99 core
- `2d4517804efb6039a438f90201cb113037b97538` — V1.99 dispatch newline syntax fix
- `3290e8246fc11d7cea9874780947fe9e3bd102b7` — V1.99 regression
- `c3a09852a15fdf5880bd586605d1420f74e68e0a` — V1.99 CI / YAML newline repair
- `aa7063f1f103ff9025f1f75a5d8943b48ccdf98c` — V1.99 playable-core marker
- `dd12e6d1cf1e133a1d19ef0d2fe4a49d98d76756` — V1.99 README


---

## V2.00 Player RANDOMACT AttackShoot

V2.00 接入玩家寵低忠誠 `RANDOMACT`：

- 614 `PETSKILL_AttackShoot`（栗子連激），option `3|5`
- 647 `PETSKILL_AttackShoot`（栗子連激改），option `6|8`
- 兩筆皆 `field=1`、`target=1`、`illegal=0`
- fixed `PETSKILL_functbl` 有正式 `PETSKILL_AttackShoot` handler

### Count RNG / loyalty branch

fixed `PETSKILL_AttackShoot()` 先解析：

- `pmin = atoi(option[0])`
- `pmax = atoi(option[1])`
- `n = RAND(pmin,pmax)`

因此：

- 614：`RAND(3,5)`
- 647：`RAND(6,8)`

來源後面另有 `loyal >= 100` 時的 1/300 與低 HP 1/50 強制 8 發分支。

但玩家這裡是 **低忠誠 RANDOMACT**。fixed `BATTLE_PetLoyalCheck()` 明確只有：

- FIXAI 30～39 且 loyalty roll <70
- FIXAI 20～29 且 loyalty roll <70

才會進 `PETAI_MODE_RANDOMACT`。

所以此玩家路徑 FIXAI 必定 <40：

- `loyal >= 100` 不可能成立
- 不 consume `RAND(1,300)`
- 不 consume `RAND(1,50)`
- 不自行補「幸運 8 發」效果

### TargetList

`BATTLE_TargetListSet()` 對 ATTSHOOT 與 ATTCRAZED 共用同一段。

若 Enemy side 為 10～19：

`for(i=10; i<19; i++)`

只掃 10～18，因此 V2.00 延續 V1.99：

- Web `battleSlot 0..8` 才進預抽池
- source slot 19 / Web battleSlot 9 排除
- 預抽池存在時，一次 consume `attackMax` 顆 target RNG
- 所有 target RNG 都在第一個 `BATTLE_Attack` 前完成
- 預抽池為空時保留原 COM2-filled list，不 consume target-list RNG

玩家 Pet 沒有遠距裝備路徑，因此第一擊仍是 non-BOW source quirk：

- `plannedTargets[0]` RNG 已消耗
- 實際第一擊仍以原 COM2 做 `BATTLE_TargetAdjust`
- 第二擊起才還原 `aDefList[i]`
- 預抽目標失效時才於該段重新 `DefaultAttacker`

### Damage / sleep RNG order

`BATTLE_COM_S_ATTSHOOT` 在 battle.c 設：

- `attack_max = COM3 high`
- `gDamageDiv = attack_max`

因此每擊的物理傷害都除以本次總發數。

fixed `BATTLE_Attack()` 的正傷害後順序：

1. Damage / DamageSub
2. DamageWakeUp
3. 若 attacker COM1 仍為 ATTSHOOT：`RAND(1,5)`
4. roll >4：直接寫 `CHAR_WORKSLEEP=3`
5. ItemCrush RNG
6. 返回 battle.c
7. `BATTLE_AddProfit`

V2.00 因此對每次正傷害：

- 先 defer shared ItemCrush
- consume `RAND(1,5)`
- 5 才套原生 3-turn sleep
- 再 consume ItemCrush RNG
- 最後處理 AddProfit / death lifecycle

這個睡眠不是一般 `BATTLE_StatusAttackCheck`，不自行套狀態命中率。

### Counter

fixed `BATTLE_CounterCheck()`：

只要 attackindex 或 defindex 的 COM1 是 `BATTLE_COM_S_ATTSHOOT`，直接 FALSE。

fixed `BATTLE_Counter()` 本身也再次檢查 counter attacker 若仍是 ATTSHOOT 直接 FALSE。

因此 ATTSHOOT 完整 attack loop 後：

- 不做 Counter hit
- 不 consume Counter chance RNG
- Web 不呼叫 `resolvePetEnemyCounterChain`

### Regression

新增：

`tools/check_v200_player_attackshoot_runtime.mjs`

鎖定：

- 614 / 647 runtime rows
- count RNG 先於 target-list RNG
- RANDOMACT FIXAI <40，不抽 loyal>=100 burst RNG
- 不套被註解掉的攻防重寫
- slot 19 排除邊界
- all target RNG before first attack
- empty pre-roll pool no target RNG
- non-BOW first-hit original COM2 quirk
- `damageDivisor=attackMax`
- positive hit：sleep RNG before ItemCrush
- no Counter
- player RANDOMACT dispatch 在 runtime-pending fallback 前

V2.00 接入新函式後，舊 V1.99 regression 原本用 `WildViolent` 當函式結束邊界，會把新插入的 `AttackShoot` 一併切進 `AttackCrazed` 測試範圍，造成假性的 `damageDivisor` failure。已將 V1.99 regression 改成優先以 `sourcePerformPetAttackShootSkill` 作下一函式邊界；這只修測試切片範圍，不改任何戰鬥規則。

save schema 維持 **29**。

### commits

- `0eb4bb2982818f94cf2054b6dfdbd528ac296f57` — V2.00 core
- `ffee0b6a451c5073bbfb21d5b3ab0886d38f50a7` — V2.00 regression
- `0645f191b73cf2a3da405225e6b2b346e7cd08e7` — V2.00 CI
- `6f903317c5ede8527812c92b5adb755c3bedecf9` — V2.00 playable-core marker
- `f36c6f30c58de125362a90a219164bf171a9b6db` — V2.00 README
- `8be757b9f83f86fe52129cde56254534a9fd7e77` — V2.00 detailed changelog
- `7c73c9b2930367e30d404d969a4439b8cc641205` — V2.00 changelog index
- `4432d117542aaed6b66efa4a970bc2d15a98ec41` — V2.00 V1.99 regression boundary compatibility fix / full CI green


---

## V2.01 Player RANDOMACT BattleModel

V2.01 接入玩家寵低忠誠 `RANDOMACT` 剩餘大組之一：

- 590、638、641、649、650、654、655、664、668、669
- 689、690、691、692、717
- 812～823
- 829
- 共 28 筆 `PETSKILL_BattleModel`
- 全部 `field=1`、`illegal=0`
- fixed `PETSKILL_functbl` 有正式 `PETSKILL_BattleModel` handler

### PETSKILL_BattleModel command

fixed `PETSKILL_BattleModel()` 不保留 RANDOMACT 先前的 `toNo` 作為實際攻擊目標。

handler 重新寫：

- `COM1 = BATTLE_COM_S_BATTLE_MODEL`
- `COM2 low = iType`
- `COM2 high = iObjectNum`
- `COM3 = PetSkill array`

所以 Web V2.01 明確標記：

`sourceTargetDescIgnored = true`

真正目標由執行階段 `BATTLE_BattleModel()` 重新對整個敵方 side 建立。

### type = 5

這 28 筆 option 第一欄全部為：

`5`

來源以 bit flag 判讀：

- `5 & 0x01`：當 AttackObject 少於目標數時，後續繼續 cover 剩餘目標
- `5 & 0x04`：physical；Guardian 成功時真正把 defender 改成 Guardian

因此 V2.01 不把 28 筆拆成猜測性的 28 種攻擊類型，而是沿同一個 source-backed type 5 lifecycle。

### Object count

第二欄只有 4 或 5。

來源規則仍完整保留：

- `iObjectNum <= 0` → `RAND(1,10)`
- `iObjectNum > 10` → clamp 10
- 目前 28 筆都不會觸發 object-count RNG

### Ability modifier parser bug

第 6 欄如：

- `攻%15`
- `攻%-30`
- `攻%+15`
- `攻%20`

來源 parser 是 positional：

1. 第 1 個 space token 只檢查「攻」
2. 第 2 個只檢查「防」
3. 第 3 個只檢查「敏」

而且有 source bug：

無論正在改攻／防／敏，基底都先讀：

`CHAR_WORKATTACKPOWER`

再做百分比或絕對值計算。

V2.01 保留此 bug；目前 28 筆實際都只有第 1 token 的攻擊修正，所以不自行補正成「防應讀 FIXTOUGH／敏應讀 FIXDEX」。

### BATTLE_MultiList / SortLoc

BattleModel 以敵方 side 作 `BATTLE_MultiList`，再在 target count >1 時 `qsort(SortLoc)`。

固定 `CharTableIdx` + Enemy side 的 `SortLoc` 結果為：

`13,11,10,12,14,18,16,15,17,19`

Web `battleSlot = source slot - 10`，因此順序為：

`[3,1,0,2,4,8,6,5,7,9]`

這剛好與已 source-backed 的 `SOURCE_SARS_SLOT_ORDER` 相同，V2.01 直接沿用同一個位置順序，不以 units array 原始排列替代。

### AttackObject lifecycle

若 object count >= 初始存活目標數：

1. 先對初始排序 `iToList` 每個目標各分配一個 AttackObject
2. 剩餘 AttackObject 才逐顆：
   `RAND(0, i0-1)`
3. 這些 RNG 在**各自物件真正執行前**才抽，不預抽

若 extra object 抽中一個已被前面物件打倒的原始目標：

- `BATTLE_BattleModel_ATTACK` 的 `BATTLE_TargetCheck` 直接 return
- 不 DefaultAttacker
- 不補抽另一個目標

若 object count < 初始目標數：

- 先對前 object-count 個目標攻擊
- 因 type bit 1 開啟，再把剩餘初始目標全部各攻擊一次
- 不需要 random target RNG

### Physical / Guardian

type bit 4 開啟，因此走 physical `BATTLE_AttackSeq`。

此 caller 是先前 V1.12 已確認的**真正 Guardian substitution** caller：

- 原目標先做 Duck
- Guardian 成功後真正 defender 改成 Guardian
- Damage / Ultimate / ItemCrush / Status 都以實際 Guardian 為 defender

V2.01 玩家 Pet→Enemy 直接沿用既有 `resolveAttackToEnemyWithGuardian` source path。

### ItemCrush special lifecycle

`BATTLE_BattleModel_ATTACK` 與普通 `BATTLE_Attack` 不同。

death / alive 是互斥分支：

- actual defender 死亡：不做 ItemCrush
- actual defender 存活：無條件呼叫 `BATTLE_ItemCrushSeq`

因此即使該物件：

- DODGE
- MISS
- 0 damage

只要實際 defender 還活著，仍 consume defender ItemCrush check RNG。

V2.01 沿用既有：

`sourceBattleModelAliveItemCrushRng()`

且 ItemCrush 發生在 BattleModel 狀態檢定之前。

### Status

28 筆實際 token：

- `麻` → paralysis
- `眠` → sleep
- `石` → stone
- `障` → barrier
- `剧` → deepPoison
- `虚` → weaken
- `罗` → dragnet / 天羅地網

BattleModel status check 只在：

- physical damage >0
- actual defender 存活

時執行。

來源固定參數：

- `perOffset = EffectHit`
- level difference multiplier `Bai = 1`
- level range `30`
- existing status 仍是 early reject
- success 使用 strict `RAND(1,100) < per`

命中後：

`StatusTbl[iEffect] = iTurn`

注意這裡是 **exact iTurn**，不是 common StatusChange 的 `turn+1`。

V2.01 因此使用 `battleStatusApplyRaw(..., turns)`。

### 天羅地網

本輪補齊 `羅/罗 -> dragnet`：

- 顯示名：天羅地網
- fixed `BATTLE_CanMoveCheck` 對 `CHAR_WORKDRAGNET >0` 直接 FALSE
- Web 因此把 dragnet 納入 can-move gate
- generic StatusSeq 依原倒數生命週期處理

沒有加入職業技能 `BATTLE_COM_S_DRAGNET` 特有的：

- DOOMTIME 清除
- profession stored-command 清除
- 已存在天羅數量造成 Success 0.64 / 0.4 修正

因為這些都位於職業技能 handler，**不在 `BATTLE_BattleModel_ATTACK`**。維持「原 C 規則優先、不猜副作用」。

### Counter / AddProfit

battle.c：

`case BATTLE_COM_S_BATTLE_MODEL:`
→ `BATTLE_BattleModel()`
→ `break`

因此：

- 不進普通 Counter loop
- 每個 AttackObject 內沒有 `BATTLE_AddProfit`
- command 結束後才由共用 outer AddProfit boundary 處理死亡生命週期

V2.01 不在每個分身後自行插 AddProfit。

### Regression

新增：

`tools/check_v201_player_battlemodel_runtime.mjs`

鎖定：

- 28 筆 runtime row
- type=5 / object count 4 or 5
- 七種 status token
- COM2 target override / original toNo ignored
- positional ability parser + WORKATTACKPOWER base bug
- SortLoc source order
- cover-all bit
- extra-object RNG 必須 interleave execution
- dead random target skip / no fallback
- no damageDivisor
- real Guardian substitution
- surviving target unconditional ItemCrush
- ItemCrush before status
- EffectHit / range30 / Bai1
- exact raw turn storage
- dragnet can-move lifecycle
- no Counter
- no per-object AddProfit
- player RANDOMACT dispatch 在 pending fallback 前

完整 CI：

- V1.72～V2.01 全部 regression success
- `game.js` syntax success
- generated runtime success

save schema 維持 **29**。

### commits

- `db05f6684454baef5538fd9f88075b40c2bebbdd` — V2.01 core
- `a2bd13d710a780bee9b779c4334d354c43004f1a` — V2.01 regression
- `3025c0dde1dabfa106dbd23554619b8e6309255b` — V2.01 CI
- `577678343b259fb67f042fa5561ab8673edf7ea3` — V2.01 playable-core marker
- `cdbce9f96bdaefb8fdbd05e9c9869ecdab0f5f65` — V2.01 README

---

## V2.02 Player RANDOMACT PETSKILL_Combined / MAGIC_DirectUse

V2.02 接續 V2.01 的玩家寵低忠誠 RANDOMACT，處理 fixed runtime 中 **36 筆 `PETSKILL_Combined`**。

### PETSKILL_Combined command chain

固定 `pet_skill.c::PETSKILL_Combined()`：

1. option 第一欄必須是 `综合法`
2. count 上限 10
3. 以 `kill[rand()%count]` 抽出 magic ID
4. `CHAR_WORKBATTLECOM2 = toNo`
5. `COM3 low = magic ID`
6. `COM3 high = 0`
7. command 改成 `BATTLE_COM_JYUJYUTU`

真正執行時 battle.c 直接：

`MAGIC_DirectUse(charaindex, COM3 low, COM2, COM3 high)`

因此 RANDOMACT 先前由 `BATTLE_DefaultAttacker()` 抽到的單體 `toNo` 會原封不動帶進 DirectUse。

特別重要的是：這條路徑**不會先進** `BATTLE_COM_S_ATTACK_MAGIC`，所以不能套該 case 的 `MAGIC_TARGET / TargetIndex` rewrite。V2.02 AttackMagic 只允許 raw COM2 先走固定 `BATTLE_MultiList`，再依 AttackMagic player-side pattern 展開。

### 36 rows / 101 unique magic IDs

36 筆 Combined 共引用 101 個不同 magic ID。

其中 **69 筆**為 `MAGIC_AttMagic`：

- 306
- 470～477、480～484、490～493
- 500～507、510～514、520～523
- 530～537、540～544、550～553
- 560～567、570～574、580～583

全部已有 `stoneage_attack_magic_runtime.json` 對應 magic row 與 player-side attIdx pattern。

其餘 non-AttMagic：

- Recovery：20～25
- StatusRecovery：61 / 71 / 81 / 91 / 101 / 121
- StatusChange：139 / 159 / 169 / 179 / 189 / 413 / 414 / 416
- FieldAttChange：194 / 204 / 214 / 224 / 230
- AttReverse：240
- Weaken：436
- MagicStatusChange：460 / 461
- fixed magic.txt 無 row：458 / 459 / 462

458／459／462 維持「原 C 規則優先、不猜數值」：DirectUse 找不到固定 magic row，不補效果。

### Pet MP side effect

Combined 固定把 `itemnum=0` 傳入 `MAGIC_DirectUse`。

現有 non-AttMagic wrapper 會取得 `MAGICUSEMP=-1`，之後執行：

`CHAR_MP -= mp`

因此 Pet 會實際 **MP +1**。

`MAGIC_AttMagic` 則只對 `CHAR_TYPEPLAYER` 扣 MP，Pet 不扣也不加。

458／459／462 因為根本沒有 magic row，不會進 wrapper，所以也沒有 MP +1。

### AttackMagic target / damage / RNG

V2.02 使用固定 player-side AttackMagic pattern：

- attackNo < 10 → `attIdx*2+1`
- raw single toNo 先進 `BATTLE_MultiList`
- dead raw target 時保留固定 compact-list + `rand()%10` rejection fallback
- 再依 `siField` 展開受擊格
- SortLoc 保留 fixed side-0 comparator typo，不自行修正

`BATTLE_MagicDodge` 對非 Player defender 使用：

`min(30, LV*0.2)`

Enemy damage resist 使用：

`trunc(LV*0.5)`

TrueMagic 依攻方目前該屬性 `CHAR_*_EXP` 做一次 cast-level 判定；FalseMagic 傷害 ×0.7。

### Pet AttackMagic practice lifecycle

原先不能把 Pet AttackMagic 熟練度永遠固定為 0。

固定 `BATTLE_MultiAttMagic()` 在 `_FIX_MAGICDAMAGE` 下會把 Pet 同樣設成 `AttIsPlayer=1`，並讀取：

- `CHAR_EARTH_EXP`
- `CHAR_WATER_EXP`
- `CHAR_FIRE_EXP`
- `CHAR_WIND_EXP`

FalseMagic 結束後會呼叫 `Magic_ComputeAttExp()`：

`addEx = MagicLv * 3 * getexp`

其中 `getexp` 是本次實際**未閃避**的受擊目標數。

V2.02 因此在 Pet 保存：

- `sourceAttackMagicLv[4]`
- `sourceAttackMagicExp[4]`

並保留：

- exp > 100 才升 1 級、exp 歸 0
- 上限 100
- 相剋屬性為 `(Mnum+1)%4`
- 相剋熟練度 >1 時依 `addEx*0.5` 扣經驗，負值時降 1 級
- `Mmagic = max(1, current magic level)`

這些 Pet 欄位會隨既有 petBox JSON 存檔直接持久化；舊 Pet 第一次使用時從 C zero-init 等價的 0/0 起步。

### 460 / 461 def-magic lifecycle

固定資料：

- 460：`魔抗|3|90|单`
- 461：`魔抗|3|50|全`

兩者不是普通 StatusTbl，而是同一組 MagicTbl / `CHAR_DEFMAGICSTATUS`。

`BATTLE_MultiMagicStatusChange()` 會先掃整個 MagicTbl；只要已有任何 MagicStatus，就完全跳過本次寫入。因此：

- 不刷新 turn
- 460 不會覆蓋 461
- 461 不會覆蓋 460
- `CHAR_OTHERSTATUSNUMS` 也不會被新值覆寫

AttackMagic 計傷時，只有 local `def_magic_resist > 0` 才套：

`resist += resist * OTHERSTATUSNUMS / 100`

V2.02 已把這個百分比接到 Player/Pet/Enemy 共用 AttackMagic 傷害抗性；它不改 `BATTLE_MagicDodge`。

MagicStatus 依既有 V2.02 lifecycle 每回合 -1，3 回合結束清除。

### 436 Weaken

固定 row 436：

`虚 turn 3 成 20`

`BATTLE_MultiParamChangeTurn()` 成功後寫：

`CHAR_WORKWEAKEN = turn + 1`

因此 Web 直接保存 **4**，不再經 common `battleStatusApply()` 額外 +1。

### StatusRecovery

Combined 的 61 / 71 / 81 / 91 / 101 / 121 直接共用 V1.78 已 source-backed 的 `BATTLE_MultiStatusRecovery` 行為：

- 掃完整個 `StatusTbl`
- 每遇到正值就覆蓋 `tostatus`
- 最後一個正值狀態勝出
- `全` 也只解除這一個，不是 blanket clear-all
- 指定狀態必須和最後掃出的狀態一致

不另寫第二套「較合理」狀態回復規則。

### save schema 修正

V1.77 已把 `freshState().schemaVersion` 升到 29，但舊 `normalizeState()` 尾端仍殘留：

`s.schemaVersion=28`

會讓載入過的存檔版本號倒退。

V2.02 修正為：

`s.schemaVersion=29`

不新增猜測 migration；只是讓 normalize 與 V1.77 已確立的 schema 29 一致。

### Regression / CI

新增：

`tools/check_v202_player_combined_runtime.mjs`

鎖定：

- 36 筆 Combined row
- 101 unique magic ID
- 69 筆 AttackMagic 與 player-side pattern
- `kill[rand()%count]`
- raw COM2 / 不套 S_ATTACK_MAGIC target rewrite
- non-AttMagic Pet MP +1
- AttackMagic MP 不變
- 458 / 459 / 462 no-row no-guess
- 436 WORKWEAKEN=4
- 460 / 461 3 turns + 90/50 + no overwrite
- def-magic damage resist
- StatusRecovery 共用 V1.78 last-positive scan
- Pet AttackMagic practice / opposed practice
- schema 29 normalize 不倒退
- dispatcher 位於 generic pending fallback 前

CI 已加入 V2.02 step；第一輪 V1.72～V2.02、game.js syntax、generated runtime 全部 success。

save schema 維持 **29**。

### commits

- `525dad539644e167143792fe728e1a73f72dcaaf` — Combined core / def-magic damage integration
- `7bb6a5281d34ee9dfe1638f5f3869719d9180565` — Combined status turn storage fix
- `9732bb02c9aafe3a9400b777acbe75cf558b2e6c` — Pet AttackMagic practice lifecycle
- `f57a3adec57aefccfd6cf73b610074f4bfa635f2` — AttackMagic formula / recovery scan refinement
- `7b231059449ced57d1c3111412090dee8817adaf` — V2.02 regression
- `1f1b00ea9fc8d827c7b7b44b13fda3c41b917cc1` — V2.02 CI
- `c2337a49bc33f0fdb0cc8c5a629a3384c9099f39` — reuse V1.78 recovery semantics / schema 29 normalize
- `30617cb11dc2f87993f08df8cb07db0ea2a45a65` — strengthened V2.02 regression
- `adc71e03f3646454872fefafab7994a9eee9b24c` — V2.02 README

---

## V2.03 Player field=0/1 PetSkill coverage closure

V2.02 完成 Combined 後，重新以固定 `stoneage_petskill_runtime.json` 做完整 coverage audit，而不是只繼續憑 function 名逐個找。

固定條件：

- `FIELD ∈ {0,1}`
- `ILLEGAL = 0`

共得到：

- **233 筆 row**
- **61 種 function string**

### Dispatcher closure

把 61 種 function 與 `sourcePerformPetLoyalAction()` 的玩家 RANDOMACT dispatcher 做 exact-name 比對後，沒有發現新的可執行漏接技能。

唯一沒有玩家 handler 的 function：

- `PETSKILL_SelfExplodeAttack` → 582 自爆攻擊
- `PETSKILL_Awaken` → 642 覺醒
- `PETSKILL_Temptation` → 643 蠱惑

這三筆不是待實作效果，而是 V1.76 已追到的 fixed source boundary。

固定 `PETSKILL_functbl[]` 沒有這三個 exact function name；`PETSKILL_Use()`：

1. 先依技能 ID 找 petskill array
2. 再呼叫 `PETSKILL_getPetskillFuncPointer(FUNCNAME)`
3. 找不到回傳 NULL
4. `func == NULL` 時直接 `ret = FALSE`

所以玩家低忠誠 RANDOMACT 抽到 582／642／643 時，正確行為就是 NoAction，不可以依技能名稱自行補自爆／覺醒／蠱惑效果。

### RNG boundary

`BATTLE_PetRandomSkill()` 在進 `PETSKILL_Use()` 之前已先呼叫 `BATTLE_DefaultAttacker()`。

因此即使最後 function pointer 缺失：

- 前面的 target RNG 已經消耗
- 之後才 PETSKILL_Use FALSE
- Web 必須保留這顆 RNG，不能因為結果 NoAction 就提前省略

既有 `sourcePetRandomSkillPlan()` 已保持這個順序。

### Defensive pending branches

部分已接 handler 仍保留 defensive `sourceRuntimePending`，例如 source option 未來若出現未知 token 時不猜。

V2.03 另外驗證現有 pinned data：

- BattleProperty option = `PET_PetskillPropertyEvent`
- 4 筆 MagicStatusChange 均是鐵壁格式
- 5 筆 Refresh token 均可解析
- Weaken / Deeppoison / Barrier / Nocast 均有 turn + 成功率
- 12 筆 StatusChange 均有可解析 status + turn

因此這些 pending boundary 對**目前 fixed rows 不可達**。

### Result

截至 V2.03：

**現有固定 field=0/1 合法玩家 PetSkill 已全部 source-backed 或 source-proven NoAction。**

下一個真正尚未處理的 PetSkill field 是 field=2：

- 200 加工 / PETSKILL_Merge
- 201 料理 / PETSKILL_Merge
- 540 修復 / PETSKILL_Fixitem
- 572 鑲寶石 / PETSKILL_Inslay

### Regression

新增：

`tools/check_v203_player_field01_coverage.mjs`

CI run #167：

- V1.72～V2.03 全部 success
- game.js syntax success
- generated runtime success

save schema 維持 **29**。

### commits

- `b486579fdf39d375dac1b68d45f998cbde5f744f` — field0/1 closure regression
- `93c7d3b4f832a45badc63e987b8b7e58db6a2752` — CI wiring
- `a85894dc42ac7590bd867b51d0f0d983c233ae5c` — corrected fixed unique-function count

---

## V2.04 Fixed item field=2 string runtime

V2.03 完成 field=0/1 玩家 PetSkill coverage closure 後，固定資料下一個 field 只剩 200 加工、201 料理、540 修復、572 鑲寶石。

540 / 572 的 fixed C 直接讀 existing item 的 `ITEM_TYPECODE`、`ITEM_INLAYCODE`、`ITEM_ARGUMENT`、`ITEM_SECRETNAME`、`ITEM_INGNAME0～4` 與 ITEM function strings；舊 Web 只有整數 data[]，不能用物品名稱或 ID 猜材料。

新增 `tools/generate_item_field2_runtime.py`，固定輸入 pinned `gmsv/data/itemset6.txt`（blob `eac985796b59286c547db2abce7b3d604a5e6226`），輸出 `data/generated/stoneage_item_field2_runtime.json`。

實際統計：

- templates 10737 / 10737
- syntax errors 0
- duplicate IDs 0
- TYPECODE templates 296
- repair ingredient-name templates 9437
- nonblank item function strings 1759

legacy source 字串用 latin1 作 byte-preserving transport：同來源 exact equality 與 ASCII token `INSLAY` / `NULL` / `FIXITEMALL` 可安全比對，但不把 legacy bytes 猜成新顯示翻譯。

約 1.9 MB runtime 由 `sourceEnsureItemField2Db()` 懶載入，沒有加入 boot Promise.all。

新增 `tools/check_v204_item_field2_runtime.mjs` 並接入 CI。

---

## V2.05 Player field=2 Fixitem / Inslay

V2.05 正式接入 540 `PETSKILL_Fixitem` 與 572 `PETSKILL_Inslay`。200 / 201 因 fixed `ITEM_mergeItem_merge` 的完整 merge table / lifecycle 尚未來源化，維持 no-guess boundary。

### field=2 UI / gate

- 只從 15 格 source-backed backpack 選物，不從 equipped slot 選
- Set insertion order 保留玩家選取順序
- 只有出戰 Pet 真正持有的 field=2 skill 才顯示 action
- battle 中依 fixed `BATTLE_CHARMODE_NONE` 直接拒絕

### 540 修復

fixed target ITEM_TYPE：0～15、17、18、19；ITEM_DISH=20 直接拒絕。每次最多兩個 selected items，且恰好一個 equipment target。

材料必須滿足：

`material.ITEM_INGNAME0 == target.ITEM_INGNAME0..4`

或 fixed `_ITEM_FIXALLBASE`：

`material.ITEM_ARGUMENT == "FIXITEMALL"`

耐久 lifecycle：

- `DAMAGECRUSHE >= MAXDAMAGECRUSHE*0.80` → 不需要修
- `MAXDAMAGECRUSHE < 500` → 不能再修
- `DAMAGECRUSHE <= 0` → fail
- success：`newMax = trunc(oldMax*0.85)`
- `DAMAGECRUSHE = newMax`
- `MAXDAMAGECRUSHE = newMax`
- `CRUSHLEVEL = 0`
- SECRETNAME 有 `(` 時保留前段

固定資料實際有 1 個 `FIXITEMALL` 模板。

### CHAR_DelItem pile lifecycle

原 `_CHAR_DelItem(..., num=1)` 在 `_ITEM_PILENUMS` 下先扣 `ITEM_USEPILENUMS`；只有 pile <=0 才清 player item slot + `ITEM_endExistItemsOne`。

因此 Web 現在：stack 5→4 時 existing item 保留；stack 1→0 時才 free。`state.inventory` 對 source-backed item 記 existing entry count，不記 pile units，所以 surviving pile 不減 aggregate。

### 572 鑲寶石

- max 4 selected items
- 每一件都必須 nonempty TYPECODE 且 != `NULL`
- 恰好一件 TYPECODE 含 `INSLAY` 作 target
- fixed runtime 實際有 200 個 INSLAY target templates
- INLAYCODE 固定三格，填第一個 `NULL`；滿三格 fail
- 精確相加 8 欄：MODIFYATTACK / MODIFYDEFENCE / MODIFYQUICK / MODIFYHP / MODIFYMP / MODIFYLUCK / OTHERDAMAGE / OTHERDEFC
- material MAGICID >0 時覆蓋 target MAGICID / MAGICUSEMP
- copy ITEM function strings 與 ARGUMENT，然後 reconstruct functable

再次核對 pinned `item.h` / `version.h`：`_Item_ReLifeAct` 開啟，所以 `ITEM_FIRSTFUNCTION..ITEM_LASTFUNCTION` 包含 INIT、PREOVER、POSTOVER、WATCH、USE、ATTACH、DETACH、DROP、PICKUP、DIERELIFE，共 10 個 function string。

### partial commit semantics

多材料不是 transaction。每顆依序：

`PETSKILL_ITEM_inslay(target, material) -> success -> CHAR_DelItem(material)`

後一顆失敗時，前面已修改 target 並消耗 material，不 rollback。Web 保留此 lifecycle。

### Inslay copied ITEM_DIErelife

封版前重新檢查發現：舊 Web 死亡復活只看原 itemId，但 fixed Inslay 會真的覆蓋 `ITEM_DIERELIFEFUNC` 與 `ITEM_ARGUMENT`。

V2.05 死亡掃描現會優先讀 existing item 上 source-backed 的 `field2Functions.relife` 與 `field2Char.argument`。HP parser 對齊 fixed `ITEM_getArgument`：先 `|` 分項，再 `:` 分 key/value，key case-insensitive；缺 HP →1、FULL → WORKMAXHP、其他 → C atoi。

觸發後仍走既有 fixed lifecycle：復活、清 death state、消耗 equipped existing item，不立即 compliance。

### display-only boundary

fixed Inslay 最後還會重建 SECRETNAME / EFFECTSTRING，包含 legacy localized magic name。目前 stats、magic ID / MP、functions、argument、inlay code 都已 source-backed；Web 暫不拿不完整 magic-name table 猜顯示字串，而以 `field2EffectStringNeedsSourceMagicName=true` 標記這個純顯示邊界。

### Regression

新增 `tools/check_v205_player_field2_fixitem_inslay.mjs`，鎖定 fixed 4 field=2 rows、200 INSLAY templates、1 FIXITEMALL template、9437 repair ingredient templates，以及 Fixitem / Inslay / pile / partial-commit / copied relife lifecycle。

CI run #182：V1.72～V2.05 全部 success，`game.js` syntax success。

save schema 維持 **29**。

---

## V2.06 Pet merge-fix source runtime

本輪刻意只處理 200／201 `PETSKILL_Merge` 所需的第一小塊：`enemybase1.txt` 的 `ATOMFIXNAME1～5 / ATOMBASEADD1～5 / ATOMFIXMIN1～5 / ATOMFIXMAX1～5`，以及名稱到 `itematom.txt` atom index 的固定映射。成品抽選尚未接入，因此沒有猜任何合成結果。

### fixed C 行為確認

固定 `version.h` 沒有開 `_MERGE_NEW_8`，所以：

- `ITEM_RANDRANGEDOM_BASE = 0`
- ATOMFIXMIN / MAX 不額外 +600
- 成功解析 atom 後若 min > max，原 C 交換兩者
- 負值 fallback 仍存在：普通 1000、家族 4000；但 pinned 可解析 slot 目前沒有負的 effective min/max
- `MAX_ITEM_ATOMS_SIZE = 256`

另外固定 `ITEM_merge_getPetFix()` 有原版怪行為：外面 `for(i=0;i<5;i++)`，裡面每次又依序呼叫完整 5 個 PET_ADD_INGRED slot，所以有效 slot 會重複加入 5 輪。這不是 Web 自行修正的 bug，而是需要保留的來源行為。

若 `ITEM_getAtomIndexByName()` 回傳 <0，巨集中的 `continue` 會跳到下一次外層 `for`，該 pass 後面的 slot 不再處理。像 TempNo 600 的 slot4「加特洛」在 itematom 不存在，因此每一輪只留下石／木／線，slot5「美鲁娜」也不會被走到。

### pinned data 統計

- enemybase rows：1816
- unique TempNo：1813
- duplicate TempNo ignored：3
- TempNo with configured fix：980
- configured slots：4602
- resolved slots：4572
- unresolved slots：30
- min/max swaps：2
- itematom unique names：112
- 5-pass expanded resolved entries：22860
- unknown-atom outer-pass aborts：75

固定 blob：

- `enemybase1.txt` = `a19a508975e3a982fada323861b35b2edab79349`
- `itematom.txt` = `85ecfbf543b85b269e6177921f76a587d969ea26`

### Web source layer

新增 `stoneage_pet_merge_fix_runtime.json`，並由 `sourceEnsurePetMergeFixDb()` 懶載入。

`sourcePetMergeFixTemplate()` 直接用 V1.77 已來源化的 Pet `petId`；`sourcePetMergeFixEntries()` 明確重播 5 個 outer pass，且 unresolved atom 依原 C 直接 abort 當前 pass。

200／201 action 現在會先完成這層 source lookup，再維持：

`sourceRuntimePending:true`

因為 `ITEM_mergeItem_merge` 的完整 merge candidate table、rand range、結果 item 建立／材料消耗 lifecycle 還沒有在同一批完成。這一輪只鎖定已確認的來源層，不跨越 no-guess boundary。

### Regression

新增 `tools/check_v206_pet_merge_fix_runtime.mjs`，固定檢查：

- pinned blob / build flags
- 1813 / 980 / 4602 / 4572 / 30 / 2 / 112 等統計
- TempNo 1 五個 700 修正
- TempNo 600 unknown slot4 導致 slot5 不執行
- 5-pass 重播為 25／15 筆的代表案例
- runtime lazy-load
- 200／201 仍不猜完整 merge 結果

save schema 維持 **29**。

### V2.06 source correction — itematom index

後續追 `ITEM_simplify_atoms()` 時重新核對固定 `ITEM_initItemAtom()`，確認 `itematom.txt` 第三欄**沒有被原 C 讀取**。原 C 只讀：

1. column 1 → atom name
2. column 2 → magicflg

`ITEM_getAtomIndexByName()` 回傳的是 `item_atoms[]` 的 **zero-based 載入位置**。

因此 V2.06 初版把第三欄 1..112 當 index 屬於來源解析錯誤；當時 200／201 仍維持 pending，尚未拿錯 index 產生成品。本修正把 runtime 改成真正 zero-based load order：石=0、木=1、骨=2、牙=3、皮=4、線=5……；其餘 1813 / 980 / 4602 / 4572 / 30 / 22860 / 75 統計不變。

---

## V2.07 Merge simplify / table / rand-range plan

本輪只往 200／201 的下一層推進，不碰成品建立與材料刪除。

### itematom cross-file byte identity

V2.04 的 `ITEM_INGNAME0～4` 為 latin1 byte-preserving transport；fixed C 的跨檔比對本質是 source bytes 的 `strcmp`。因此 V2.07 在 pet merge runtime 新增 `atomIndexByByteName`：

- key = itematom raw bytes 1:1 映成 U+00xx
- value = zero-based `item_atoms[]` load index

例如石的 GB18030 bytes `CA AF` 會以 byte-string key `Ê¯` 對到 atom 0。這讓 itemset6 與 itematom 可以不經猜譯做精確跨檔匹配。

### ITEM_initRandTable / ITEM_getTableNum

固定 `ITEM_GEN_RATE=0.7`，20 個 num：

`10,30,65,125,205,305,425,565,725,905,1125,1354,1594,1825,2105,2405,2725,3065,3425,3805`

初始化後 max：

`24,54,107,181,275,389,523,677,851,1059,1285,1522,1755,2021,2315,2629,2963,3317,3691,4000`

`ITEM_getTableNum(int num)` 取第一個 `num <= maxnum` 的 row；超過 4000 固定落最後一列。傳入 double 時依 C function argument 先截成 int。

### ITEM_simplify_atoms

同 atom 的 ingredient values：

1. double 升冪 qsort
2. j=1 開始
3. `tableNum = ITEM_getTableNum(data[j-1])`
4. `rate = table[tableNum].rate / table[0].rate`
5. `data[j] += data[j-1] * oddstable[j-1] * rate`
6. 最後 `(int)data[last]`
7. 普通 Pet skill petindex 存在時上限 1000

代表值 regression：

- [10,20,30] → 35
- [100,200] → 206
- [900,900] → 943
- [1000,1000] → 1048.x → cap 1000

固定 oddstable 只有 14 筆，因此同 atom 超過 15 筆會讀出原 C 陣列界外；Web 維持 no-guess boundary。

### ITEM_randRange plan

V2.07 實作的是 **plan-only**：

- min/max rate 先按 C int parameter 截斷
- min > max 先交換
- `rint(base/1000*rate)` 依預設 nearest / ties-to-even
- rate 都 0 → 0
- range == 0 → 原 C 怪行為：直接回 base
- range > 0 → 記錄未來需要一次 `RAND(0,range)`

目前不呼叫 `cRand()`，因此使用 200／201 不會因尚未完成的系統偷吃 RNG。

### Pet fix rate plan

加工（searchtable 0）與料理（searchtable 1）均已把 fixed C 的 rate 參數算成 plan；200／201 都呼叫同一個 `PETSKILL_Merge(... alchemist=0)`，實際 searchtable 仍依第一個可合成 item 的 `ITEM_TYPE==ITEM_DISH(20)` 決定，而不是依 skill ID 猜。

### Regression

新增 `tools/check_v207_merge_simplify_math.mjs`，鎖定：

- 112 個 byte-name atom keys
- 20-row ItemRandTableForItem
- 14 個 oddstable
- table 邊界
- simplify 代表值
- CANMERGEFROM / mixed dish / unknown atom control flow
- rand-range plan 公式
- 200／201 同時 lazy-load item field2 + pet merge runtime
- V2.07 prep 中禁止 `cRand()`

save schema 維持 **29**。

---

## V2.08 ITEM_merge_with_retry candidate / retry plan

本輪只完成候選掃描與 retry class 的 fixed-C 前置，不實際消耗 RNG。

### fixed icache identity

固定 `version.h` 的 `_IMPOROVE_ITEMTABLE` 關閉；`ITEM_readItemConfFile()` 直接把 ITEM_ID 當 `ITEM_tbl[itemid]` index，因此 `ITEM_merge_with_retry()` 的 `icache[i]` / 回傳 `i` 就是 ITEM_ID，不做額外映射。

現有兩份 lazy runtime 已足以重建 fixed icache：

- `stoneage_item_make_runtime.json`：CANMERGETO + INGVALUE0..4
- `stoneage_item_field2_runtime.json`：INGNAME0..4
- `stoneage_pet_merge_fix_runtime.json`：raw-byte INGNAME → zero-based atom index

固定資料統計：

- templates 10737
- 有 resolved ingredient 9437
- CANMERGETO 5808
- 真正 candidate 5804
- CANMERGETO 但 resolved inguse=0：4
- resolved ingredient entries 31518
- unknown ingredient occurrences 0
- max inguse 5
- by inguse = 11 / 270 / 1278 / 2892 / 1353

### first-pass hitnum

第一次 retry class 掃描時，所有 `use && canmergeto` candidate 都算一次 hitnum。

加工普通寵：

- candidate atom 必須等於某個 simplified/rand 後 input atom
- `tablenum = ITEM_getTableNum(ingtable[k])`
- lower = `ingtable[k] / rate`
- upper = `ingtable[k] * rate`
- upper > 1000 時 cap 1000

料理普通寵：

- `ItemSearchTable[1] = {0.7, 1.3}`
- 若 `ingtable[k] > ItemRandTableForItem[9].maxnum / 1.3`
- 原 C 把右側 double 指派回 int，因此 1059/1.3 → **814**
- 這是對 `ingtable[k]` 的原地 mutation，會影響後面 candidate 掃描

candidate 必須每個 ingredient 都找到範圍內同 atom，才有 `hitnum == inguse`。同一 input atom 沒有 consumption 標記，因此 candidate 若重複同 atom，原 C 允許同一 input atom 被多個 candidate ingredient 重複命中；V2.08 保留此行為。

### extractnum retry table

`ideal=min(ingnum,5)`，每輪先 `RAND(0,999)`，固定 threshold：

- 1: [0]
- 2: [250,0]
- 3: [400,150,0]
- 4: [700,260,70,0]
- 5: [740,500,200,40,0]

轉成 1000 個 roll 的 class count：

- ideal1：1→1000
- ideal2：1→250、2→750
- ideal3：1→150、2→250、3→600
- ideal4：1→70、2→190、3→440、4→300
- ideal5：1→40、2→160、3→300、4→240、5→260

`endflg[extractIndex]` 只阻止同 class 再掃 candidate；抽到重複 class 的 RAND 已經消耗。第一次 class 後 `first=FALSE`，後續 class 只重用之前的 hitnum。

真正 match 條件：

`hitnum == inguse && hitnum == extractnum && result ITEM_ID 不在輸入 items[]`

若 match > 0，最後是 `matchid[random() % match]`。固定 `MAXMATCH=2048`；Web 若未來真的遇到 >2048，直接 no-guess，不模擬 C stack overflow。

### representative checks

- processing：atom 4/2/5 = 305/305/305 → 唯一完整 3-ing candidate 2106
- cooking：atom 26 = 900 → fixed clamp 814 → 唯一完整 1-ing candidate 2506

新增 `tools/check_v208_merge_retry_candidates.mjs`。

V2.08 仍禁止在 200/201 pending gate 呼叫 `cRand()`，save schema 維持 29。

---

## V2.09 Merge RNG lifecycle executor

這一輪完成 fixed merge RNG 的可執行核心，但 live 200／201 暫不呼叫，避免未完成 lifecycle 時只消耗 RNG。

### RNG ordering

固定 `ITEM_mergeItem_merge()`：

- 先掃背包 token
- 每個有效 `CANMERGEFROM` item 立即 `ITEM_makeItem(&items[cnt], ITEM_ID)`
- fixed ITEM_makeItem loop 對 66 個 int field 每個都 `RAND(0,randomdata[i])`
- zero-width 仍消耗 RAND
- 全部 input clone 完後才進 `ITEM_mergeItem()`

所以 cooldown／mixed dish／atom 處理以前，已先消耗 66×N。

### cooldown branch location

`ITEM_mergeItem()` 一進去先檢查：

`nowtime - CHAR_WORKLASTMERGETIME < 5+(num-2)`

命中時直接：

`items[RAND(0,num-1)].data[ITEM_ID]`

因此 cooldown 不是 0-RNG shortcut；它發生在 input ITEM_makeItem RNG 之後，再多吃 1 顆 RAND，且 atom/range/retry 全部不執行。

V2.09 executor 先以 `cooldownHit` 注入此來源分支；真正 last-merge-time state 與 save schema 留給 lifecycle 接線版。

### ITEM_randRange execution

V2.07 已有 plan；V2.09 新增真正 executor：

- mode=rng：`minnum + RAND(0,range)`，1 call
- rate=0 → result 0，0 call
- range=0 → 原 C 直接 return base，0 call
- range<0 → 0，0 call

### ITEM_merge_with_retry exact consumption

原碼 while 順序：

1. `r = RAND(0,999)`
2. 宣告本輪資料
3. `if(extractcnt >= ideal) break`

因此 all-class failure 會額外多吃 terminal RAND。

抽到已經 endflg=true 的 class 也已經先消耗 RAND，然後才 continue。

match>0：

`return matchid[random()%match]`

GNU libc 的 rand() 實作直接呼叫 `__random()`，random() 同樣是 `__random()`，所以固定 Linux/glibc 環境中兩者共用 RNG state。Web 目前的 RNG abstraction 仍是一條 Math.random stream；V2.09 保證的是 source call ordering/lifecycle，不宣稱 browser PRNG 與 glibc bit sequence 相同。

### outer retry

`ITEM_mergeItem()` 最多呼叫 `ITEM_merge_with_retry()` 5 次。

五次均 -1：

`items[RAND(0,num-1)].data[ITEM_ID]`

也就是最後還有 1 顆 fallback RAND。

### atomic safety

雖然 `sourceMergeExecuteCoreRng()` 已可真正消耗 RNG 並選出 source result ITEM_ID，live 200/201 gate **沒有呼叫它**。

原因：原 C 在拿到 ret 後會無條件進材料 pile decrement/delete，再於 ret>=0 時 make/register 成品。若本版先讓按鈕吃 RNG、卻不做這些 mutation，會造成比 pending 更嚴重的不一致。

所以下一批要把：

- cooldown timestamp
- input pile consume/delete
- ret>=0 ITEM_makeItemAndRegist
- MERGEFLG
- backpack add/full handling

與 V2.09 executor 一起原子化啟用。

save schema 維持 29。


---

## V2.10 Merge live lifecycle

V2.10 將 V2.09 RNG executor 與原 C `ITEM_mergeItem_merge()` 後半段正式原子化接線，200／201 玩家按鈕開始執行真正合成。

### fixed order

- `CHAR_findEmptyItemBox` 在解析材料與任何 `ITEM_makeItem` RNG 前；全滿直接 return -1。
- 每件有效材料先 `ITEM_makeItem` 66 RNG。
- `cnt>1` 才進 `ITEM_mergeItem`。
- `time(NULL)-CHAR_WORKLASTMERGETIME < 5+(num-2)` 命中時，先覆寫 timestamp，再 `RAND(0,num-1)` 回傳 input ITEM_ID；正常路徑同樣先覆寫 timestamp。
- `ITEM_mergeItem` 回來後 `CHAR_MERGEITEMCOUNT++`。
- 不論 ret 正負，每個有效材料先把 `ITEM_USEPILENUMS` 減 1；<=0 才清 CHAR slot 並 end existing。
- ret>=0 才 `ITEM_makeItemAndRegist` 成品；成品 make RNG 發生在材料刪除之後。
- 成品先 `ITEM_MERGEFLG=TRUE`，再加入背包；加入失敗就 end 成品 existing。
- mixed dish `-10`／no atom `-1` 都仍消耗材料，與原 C 一致。

`CHAR_WORKLASTMERGETIME` 採頁面 session transient，不進 save；`CHAR_MERGEITEMCOUNT` 以 `mergeItemCount` 保存。save schema 維持 29。

新增 `tools/check_v210_merge_live_lifecycle.mjs`，並把 V2.09 regression 的 live-pending assertion 改為只鎖 V2.09 executor 本身；live gate 由 V2.10 regression 接手。


---

## V2.11 Merge live executable fixtures

V2.11 把 V2.10 的 live merge lifecycle 改成可實際執行的 regression fixture。

測試不複製另一份 lifecycle 實作；它會從目前 `game.js` 以 brace-aware parser 抽出 production function，再用 Node `vm` 注入固定 existing-item／背包／RNG dependency。

覆蓋：

- full backpack preflight：0 後續 mutation
- `ITEM_USEPILENUMS > 1` decrement without free
- `ITEM_USEPILENUMS == 1` free + inventory decrement
- normal success ordering and `ITEM_MERGEFLG=1`
- cooldown hit updates transient timestamp and still consumes inputs
- source `-10` mixed dish consumes inputs but creates no output
- output backpack-add failure frees newly created output existing without rollback

這批只增加防回歸保護，不改 fixed-C 數值與 RNG 規則。save schema 29。


---

## V2.12 Angel/Hero token equip boundary

V2.12 修正 V1.73 對 Item 2884／2885 過度合併的特殊裝備 fail-closed 邊界。

fixed C：
- `version.h` 開啟 `_ANGEL_SUMMON`
- `char_base.h`: `ANGELITEM 2884`、`HEROITEM 2885`
- `CHAR_moveItemFromItemBoxToEquip()` 只有 `ITEM_ID == ANGELITEM` 時才驗 MissionTable／angelinfo／heroinfo／角色 nameinfo
- HEROITEM 2885 不走這個 ownership check
- fixed item runtime：2884 type=10、2885 type=16；兩者 profession=0、attach/detach callback 都空
- `ITEM_getEquipPlace()` 沒有 ITEM_OTHER(type 16) case，因此 2885 正常回 -1

Web 現在只保留 2884 為 `special-equip-unported`；2885 改走正常 equip-place 拒絕。save schema 29。


---

## V2.13 ITEM_WearEquip / ITEM_ReWearEquip

V2.13 來源化第一組玩家裝備 callback。fixed item runtime 只有 Item 1975、20130 使用 `ITEM_WearEquip -> ITEM_ReWearEquip`，兩件 type=11、profession=0。

fixed `item_event.c`：
- attach: `CHAR_setWorkInt(charaindex, CHAR_PickAllPet, TRUE)`
- detach: `CHAR_setWorkInt(charaindex, CHAR_PickAllPet, FALSE)`

fixed `BATTLE_CaptureCheck()`：
- `CHAR_PickAllPet != TRUE` 且 `player LV + 5 < enemy LV` 時直接不可捕獲
- `CHAR_PickAllPet == TRUE` 時跳過這一條，後續 capture percentage 算式不變

Web 以目前 equip slots 推導 PickAllPet，不增加 save 欄位。只有這組 callback 從 `callback-unported` 白名單化；其他 callback 繼續 fail-closed。

新增 `tools/check_v213_pickallpet_equip_callback.mjs`。save schema 29。


---

## V2.14 ITEM_equipNoenemy / ITEM_remNoenemy

V2.14 來源化第二組玩家裝備 callback。

fixed `itemset6.txt`：
- 18546：`noen:40`
- 18547：`noen:80`
- 18548：`noen:120`

fixed `ITEM_equipNoenemy()` 會把 connection `eqnoenemy` 設成 40／80／120；`ITEM_remNoenemy()` 清零。fixed `char_walk.c` 每步依 Floor 判定：
- 120 → 100/200/300/400/500
- 80 → 100/200/300/400
- 40 → 100/200
- 200 → all floors

有效時只跳過 random encounter / CEP branch，並不取消 warp、NPC 或腳本戰。

Web 以目前 equip slots 推導 noen level；`walkEncounterStep()` 先增加 virtual walk count，再於有效 Floor 直接返回，不抽 encounter roll、不改 CEP。其他 callback 仍 fail-closed。save schema 29。


---

## V2.15 ITEM_randEnemyEquip / ITEM_RerandEnemyEquip

V2.15 來源化第三組玩家裝備 callback。

fixed itemset6：
- 20126：rand:60
- 20127：rand:70
- 20128：rand:100

fixed char_walk.c under _Item_MoonAct:
- first: rand()%120 < CEP
- only on primary hit and EqRandenemy > 0: Rnum = RAND(0,100)
- actual encounter only if Rnum > RandEnemy
- secondary suppression does not reset CEP and does not increment CEP
- actual encounter resets CEP to minep
- primary miss increments CEP as before

Web now derives the exact threshold from equipped existing item and preserves this RNG/order lifecycle. Quest/script battles remain outside this path. save schema 29.


---

## V2.16 ITEM_MagicEquitWear / ITEM_MagicEquitReWear

V2.16 來源化第四組玩家裝備 callback。

fixed itemset6:
- 20184: EA/WA/FI/WI/QU = 40
- 20420: EA/WA/FI/WI/QU = 10
- 20421: EA/WA/FI/WI/QU = 10

fixed ITEM_MagicEquitWear/ReWear accumulates/subtracts five Work values. In battle_magic.c:
- Earth/Water/Fire/Wind equipment values are added to Player def_magic_resist[j].
- _MAGIC_DEFMAGICATT percentage scaling happens after that combined value.
- QU is separate: BATTLE_MagicDodge adds CHAR_EQUITQUIMAGIC * 0.9 to Player dodge luck.
- Pet does not receive these equipment values.

Web reads current existing-item callback + field2 argument so an in-place callback/argument mutation also changes the live effect. No new save field. save schema 29.

---

## V2.17 ITEM_MagicResist / ITEM_MagicReResist

V2.17 來源化第五組玩家裝備 callback，並修正 V2.16 對大型 field2 runtime 的隱性依賴。

- item-make runtime 現在只對有 attach/detach callback 的 fixed item 額外保存 byte-preserving `ITEM_ARGUMENT`（`g`）。
- pinned `recode.sh` 明確證明 `gmsv` 使用 `gb18030 -> utf8`；generator 從目前 UTF-8 的 pinned `item_event.c` 抽七個 literal，再還原 GB18030 bytes，並驗證每個 marker 長度都與原 `p+4` 一致。
- 登入依 equip slot 0→8 replay attach；attach 是 set Work，不是加總。
- fixed 有效列：2898 weaken30、2899 barrier30、2900 nocast30、2901 fallride30、20643 nocast15；另有 2907／2912／2917／2922／21032／21037／21174／21400 同 callback pair 但 marker 全 miss，原 C 是合法 no-op，Web 不再把它們誤判成 callback-unported。
- 真實換裝順序維持「舊裝 detach → 新裝 attach」。
- 保留原 `ITEM_MagicReResist()` bug：七種 detach 全部只清 `CHAR_WORKEQUITFIRE`。
- weaken／barrier／nocast 已接 `BATTLE_StatusAttackCheck()`；fallride 已接落馬門檻。
- fire／thunder／ice Work 已保留，但 fixed consumer 是尚未移植的 `PROFESSION_MAGIC_GET_DAMAGE()`，所以不錯接到 V2.16 `BATTLE_MultiAttMagic`。
- V2.16 EA/WA/FI/WI/QU 也改由小型 runtime 取得 base argument；field2 runtime 未 lazy-load 時仍有效。

新增 `tools/check_v217_equip_resist_callback.mjs`，save schema 維持 29。

---

## V2.18 ITEM_suitEquip / ITEM_ResuitEquip

V2.18 來源化 fixed 玩家套裝 callback。

fixed item runtime 驗到：
- 236 件 `ITEM_suitEquip / ITEM_ResuitEquip`
- 51 個 SUITCODE
- fixed 資料真正有值的 ListSuit keys：`COUNTER / FSTR / HP / M2_POW / MDEX / MP / MSTR / MTGH / M_POW / RENOCASE / RESIST / SUITDEXP / SUITPOISON / UN_POW_M / WAST / WDUCKPOWER`

原 `ITEM_CheckSuitEquip()` lifecycle：
- 每次穿／脫都把套裝 Work 清零並重掃 equip 0..8。
- 第一個 `SUITCODE > 0` 且裝備數 >=3 的 code 啟用；只啟用一套。
- 第二次 0..8 掃描該 code，依 `NPC_Util_GetStrFromStrWithDelim()` 的 strstr + 第二個 colon 欄位 + atoi 規則讀 argument。
- Work 是 set，不是 add；同 key 後格覆寫前格。
- item-make runtime 的 `g` 因此擴到所有 `SUITCODE > 0` item，而不只 callback item。

已接消費鏈：
- `Other_DefcharWorkInt()`：FSTR/MSTR/MTGH/MDEX/VIT/SUITSTRP/SUITTGH_P/SUITDEXP。
- `BATTLE_StatusSeq()`：HP/MP 在 Player 每次輪到行動時回復，不是整輪尾端。connection-level toxication gate 尚無對應 Web 系統，因此不拿 battle poison 代替。
- `BATTLE_StatusAttackCheck()`：RESIST；paralysis 快速分支不吃它。RENOCASE 保留 fixed bug，只在 WEAKEN 時扣。
- `BATTLE_CounterCheckPlayer()`：COUNTER 直接加在武器倍率 + Luck 後。
- `BATTLE_AttackSeq()`：WDUCKPOWER 是普通 DuckCheck 後的第二顆獨立 `rand()%100`，strict `< power`；COMBO 跳過。
- `BATTLE_Attack()`：SUITPOISON 只在沒有既有 `gBattleStausChange` 時接成 poison turn=3。BREAKTHROW 先設 paralysis，所以投石不再抽套裝毒 RNG；Counter 只走 AttackSeq，也不套套裝毒。

暫存 Work、但不猜未移植系統：
- WAST → water-world／connection 呼吸狀態。
- M_POW / M2_POW / UN_POW_M → `PROFESSION_MAGIC_GET_DAMAGE()`。

新增完整 `tools/check_v218_suit_equip_callback.mjs` executable regression，並更新 V2.13 fixture 的 shared callback-gate dependency。save schema 維持 29。
---

## V2.19 profession magic damage core

V2.19 開始接 fixed 職業魔法傷害數值核心；本版不先創造職業技能 UI／技能表，而是先把 V2.17／V2.18 已保存的 profession-magic Work 接到正確 consumer。

固定 build 啟用 `_PROFESSION_SKILL / _PROFESSION_ADDSKILL / _FIX_MAGIC_RESIST / _EQUIT_RESIST / _MAGICSTAUTS_RESIST / _SUIT_ADDENDUM / _SUIT_ADDPART4`。

### `PROFESSION_MAGIC_GET_PRACTICE()`

- `PROFESSION_CHANGE_SKILL_LEVEL_M()` 依原 >90、>80…>10 門檻轉成 10…2，其他為 1。
- 每次先消耗 `RAND(1,100)` critical，即使該 command 不用它。
- `_SUIT_ADDENDUM`：`M_POW` 無條件修改 float `hp_power`。
- `_SUIT_ADDPART4`：再固定消耗 `rand()%100`，嚴格 `<30` 才套 `M2_POW`。
- 只有 `hp_power>0` 才再消耗 `RAND(98,102)`。
- Web 使用 `Math.fround()` 模擬每次存回 C `float`，最後在 caller `power = hp_power` 等價位置向零截成 int。
- fixed `_PROFESSION_ADDSKILL` 的 CURRENT／STORM／SIGN／ENCLOSE 分支照原條件保留，包括 CURRENT 的 `>=10` 後緊接 `>9` 之不可達分支。

### `UN_POW_M` 與 `PROFESSION_MAGIC_GET_DAMAGE()`

- `UN_POW_M` 在 special-power helper 之後、GET_DAMAGE 之前執行，compound assignment 存回 int `power`。
- `_FIX_MAGIC_RESIST` 依 proficiency / resist / suit / spirit 百分比逐項乘算。
- V2.17 equip Work 正式作為 fire/thunder/ice suit resistance consumer。
- fixed `analysis_profession_parameter()` 是 `{"火","冰","电"} -> 1/2/3`。
- 同時保留 fixed GET_DAMAGE 欄位錯位：type 2 用 T proficiency/resist + I base suit + THUNDER equip；type 3 用 I proficiency/resist + T base suit + ICE equip。
- DOOM 依原 `int damage` 的 `=`、兩次 `+=`、`/=3.0` 每一步向零截斷，不改成「最後才截一次」。

新增 `sourceProfessionMagicLevelM()`、`sourceProfessionMagicTypeFromOption()`、`sourceProfessionMagicPracticePower()`、`sourceProfessionMagicPreDamagePower()`、`sourceProfessionMagicGetDamage()`、`sourcePlayerProfessionMagicDamageCore()` 與 `tools/check_v219_profession_magic_damage_core.mjs`。

這批仍不把 profession core 混入既有 `BATTLE_MultiAttMagic`，也不聲稱玩家已可從 UI 施放職業技能。

同輪修正 `generate_item_field2_runtime.py` 的可重現性：`FIELD2_KEYS` 從無序 set 改成固定 tuple。舊寫法會讓相同 pinned source 只因 JSON row key 順序漂移就被 Actions 判成 generated runtime 有變；新寫法不改欄位內容，只固定輸出順序。save schema 維持 29。
---

## V2.20 profession skill runtime / Use preflight

新增 pinned `profession.txt` runtime，來源固定 `gavinlinasd/StoneAge@1f90cb6cb57c1df70f39cde77a5a8ccd98b66c56`。

- `profession.txt` 69 rows / max ID 72 / holes 63,64,65。
- class 1/2/3 = 20 / 21 / 28 rows。
- 資料表 57 種 unique function string 全部存在 fixed function table 的 64 個 active dispatch entry。
- generator 直接掃 `profession_skill.c` 的 simple `profession_common_fun()` wrapper，建立 function → `BATTLE_COM_*` source map。
- `_PROSKILL_OPTIMUM` 下 skill ID 即 table index；空洞維持不存在，不壓縮。

`sourceProfessionMagicCostPlan()` 來源化 `PROFESSION_MAGIC_COST_MP()`；未知 func 才使用 row `COST_MP` fallback。`PROFESSION_BOUNDARY` 的 `破结界` option 另走 fixed cost table。

`sourceProfessionSkillUsePreflight()` 保留 `PROFESSION_SKILL_Use()` / `PROFESSION_SKILL_DEC_COST_MP()` 的前置順序：

1. profession class 必須 >0 且與 row class 相同；
2. fixed dispatch function 必須存在；
3. actor 必須是 Player；
4. raw skill level 必須 >0；
5. 動態或 fallback MP cost 計算；
6. MP 不足直接失敗；
7. 除 Pskillid 11 外，dec_mp<=0 直接失敗；
8. 成功結果先得到 mpAfter，並標記 `deductBeforeDispatch=true`。

固定 `PROFESSION_SKILL_Use()` 並不在這一層檢查 `USE_FLAG` / `TARGET`，V2.20 因此只保存欄位，不加入不存在的 gate。

`sourceProfessionCommonCommandPlan()` 保留 COM1/COM2/COM3 與 C_OK；DOOM／FIRE_SPEAR 依 `_PROFESSION_ADDSKILL` 改為 final COM1 NONE，另存 deferred command 與 DOOMTIME 3／2。

本版沒有猜玩家 profession class 或 learned-skill slots，也沒有新增 UI / save 欄位。save schema 維持 29。

---

## V2.21 persistent profession state / learning lifecycle

V2.21 將 fixed profession 資料接到玩家永久狀態，但不先虛構轉職 UI。

- `CHAR_SKILLMAXHAVE=26`、`PROFESSION_MAX_LEVEL=26`。
- profession class enum：0 NONE / 1 FIGHTER / 2 WIZARD / 3 HUNTER。
- 新角色 class 0、profession level 0、profession skill point 0。
- fixed save 是固定位置 `skill0..skill25`；每格 Skill 只序列化 raw `lv` 與 `id`。Web 的 `professionSkills[26]` 同樣保留 slot hole，不 compact。
- `SKILL_getInt(SKILL_LEVEL)` = raw /100 整數除法；`SKILL_getRealInt` 才讀 raw。
- `sourceProfessionSkillAdd()` 鏡像 ADDSK：display level clamp 1..100、duplicate reject、第一空 slot、raw=display*100、26 格滿失敗。
- `sourceProfessionSkillLearnPreflight()/Learn()` 鏡像 Welfare NPC：battle → class → point → prerequisites → gold → trans → ADDSK，再扣 Gold／skill point。
- percent=0 prerequisite 保留 OR-group；Skill 50 fixture 是 30/31/32 任一。
- 一般學習起始 Lv10/raw1000；63/64/65 Lv50 分支只保留來源規則，不建立不存在的 runtime row。
- fixed `_NPC_ProfessionTrans` 已開啟；`_75_TEST` 關閉。

新增 `tools/check_v221_profession_player_state.mjs`。永久欄位加入後 save schema 29 → **30**；舊 Web save 只補無職業的來源初值。

---

## V2.22 profession proficiency / level-check lifecycle

V2.22 來源化 fixed `PROFESSION_NORMAL_SKILL_LEVLE_UP()` 與 `PROFESSION_LEVEL_CHECK_UP()`。

- 第一顆 `RAND(0,10000)` 在 max raw 10000 檢查之前就消耗。
- raw<10000 才再抽 `RAND(0,FIX_VALUE*100)`；fixed `_75_TEST` 關閉，成功條件是 strict `rand1 > raw + rand2`，成功只 raw +1。
- 只有成功後新 raw 恰為 100 的倍數才做 Profession Level Check。
- Level Check 對 skill 63/64/65 固定加 5000，其餘直接加 raw；門檻 = old profession level * 7000。
- 每次 check 最多 profession level +1、skill point +1；fixed code 沒有真正的 Lv26 cap，也沒有 while catch-up。
- `PROFESSION_SKILL_Use()` post-dispatch 的 `ret==-1 -> rand()%10` 與 Skill 57 non-Pet no-exp gate 已保留。
- 特殊熟練度入口可依 function 名掃 26 格第一個 match；武器專精額外比對來源 option marker，二刀流保留雙裝備 gate。

新增 `tools/check_v222_profession_proficiency_runtime.mjs`。本版沒有新增 save 欄位，schema 維持 **30**。

---

## V2.23 profession live physical hooks

V2.23 將已來源化的 profession proficiency 掛回現有 physical battle events。

- `resolveNormalAttack()`：只有 fixed ordinary DuckCheck 成功才觸發 `PROFESSION_AVOID`。
- `sourceInitialDodgeOnly()`：Guardian 前置 DuckCheck 同樣觸發，避免 direct-to-player 路徑漏掉。
- `skillDuck` / suit `WDUCKPOWER` dodge 不會誤升回避。
- Player critical：critical damage 計算後、GuardBreak / GuardAdjust / damage<1 RNG 之前，依 fixed 順序跑 Weapon Focus → Dual Weapon。
- Weapon Focus 依武器 marker 找第一個匹配 slot；Dual Weapon 先檢查 ARM + EQSHIELD。
- 每個 proficiency boundary 可各自觸發 V2.22 Profession Level Check；live 日誌同步顯示熟練度整百與 profession level + skill point。
- ARRANGE/DEFLECT、profession magic practice、active PROFESSION_SKILL_Use post-dispatch 尚未有等價 live event，因此本版不假接。

新增 `tools/check_v223_profession_live_physical_hooks.mjs`。schema 維持 30。

---

## V2.33 Warrior Skill 34 Scapegoat Guardian lifecycle

V2.33 ports `PROFESSION_SCAPEGOAT` (Skill 34) as a real current-round Guardian mapping rather than a generic duration buff.

- fixed row: TARGET=5, KIND=2, USE_FLAG=1, MP=5, `BATTLE_COM_S_SCAPEGOAT`.
- tier <5 maps the owner's Pet entry to the Player.
- tier 5..9 maps all Pet entries 5..9.
- tier 10 maps every same-side entry except the caster.
- current web battle only materializes Player 0 + Active Pet 5; absent party entries are not invented.

`BATTLE_PreCommandSeq()` clears every Entry.guardian and every `CHAR_BATTLEFLG_GUARDIAN` before compliance each round, so the mapping applies only after Skill 34 executes and expires at the next PreCommand.

The physical order is preserved:
`DuckCheck(original Pet) -> GuardianCheck -> critical/damage(Player)`.
Throw/ranged weapons cannot trigger Guardian. A successful Guardian redirect forces minimum damage 1 when the redirected calculation reaches zero and sets the ordinary `BATTLE_Attack()` return false, blocking Counter.

The source callback also writes:
`FIXTOUGH = int(old FIXTOUGH * (70 + tier*2) / 100)`.
Because WORKDEFENCEPOWER was already built earlier in PreCommand, ordinary same-round damage still reads the old Work defense. The browser therefore stores this as a separate battle-local FIXTOUGH override and clears it at the next PreCommand.

Real-defindex callers (ordinary/common direct attacks, FIREKILL physical, BattleModel) can redirect Pet -> Player. Calc-only caller-defindex bug paths such as FallGround / AttackDamage remain intentionally non-substituting.

Added `tools/check_v233_profession_scapegoat_runtime.mjs`; save schema remains **30**.

---

## V2.32 Warrior assist Skills 35-37

V2.32 adds the fixed live battle lifecycle for Warrior self-assists `PROFESSION_ENRAGE`, `PROFESSION_ENERGY_COLLECT`, and `PROFESSION_FOCUS`.

- Skill 35: TARGET=5, KIND=2, MP 20, command `BATTLE_COM_S_ENRAGE`.
  - STR power = `tier*2+20`.
  - TGH power = `-(tier*2+10)`.
  - stored turns = 3 / 4 / 5 at tier <5 / 5..9 / 10.
- Skill 36: TARGET=5, KIND=2, MP 10, command `BATTLE_COM_S_COLLECT`.
  - TGH power = `tier*2+20`.
  - DEX power = **positive** `tier*2+10`, preserving the fixed mismatch where comments/client UI say reduced DEX but the server raises QUICK on compliance.
  - same 3 / 4 / 5 stored turns.
- Skill 37: TARGET=5, KIND=2, MP 9, command `BATTLE_COM_S_FOCUS`.
  - fixed writes `MYSKILLHIT=2`, `MYSKILLHIT_NUM=100`;
  - it does not immediately add 100 to WORKHITRIGHT and therefore reuses the existing source-buggy MYSKILLHIT lifecycle.

For STR/TGH/DEX, `Other_DefcharWorkInt()` uses the same saved `mtgh` base for every percentage:
`add = int(mtgh * power / 100)`.
The browser now snapshots these Work effects at Player PreCommand, then decrements STR -> TGH -> DEX before HIT in Player StatusSeq. Expiry during StatusSeq does not erase the already-built current-round FIX snapshot.

SetMagicPet shares the same source MYSKILL fields. A profession assist overwrites a same-stat SetMagicPet state for future rounds, while an already-active profession stat blocks a later SetMagicPet through the shared mutual-exclusion gate.

Added `tools/check_v232_profession_warrior_assist_runtime.mjs`; save schema remains **30**.

---

## V2.31 profession Skill 42 chaos attack

V2.31 adds Warrior Skill 42 `PROFESSION_CHAOS` through the fixed direct-profession physical path.

- Runtime row: TARGET=1, KIND=1, USE_FLAG=1, MP 28, option `效%1|`.
- Initial same-side targets are rejected by the profession battle gate; an initial EarthRound target returns before the Chaos WORK mutation.
- The callback mutates the **current** WORKATTACKPOWER once: `int(WORKATTACKPOWER * 70 / 100)`. The reduced Work value persists for the rest of the same round.
- Total attack count is 3 for tier <5, 4 for tier 5..9, and 5 for tier >=10.
- fixed `BATTLE_DuckCheck()` applies the Chaos penalty after the normal 75% cap and after player HITRIGHT subtraction: `per += per*0.4`. There is no second cap.
- The first hit remains inside `battle_profession_attack_fun()`: calc-only Guardian bug, non-CHAIN DamageReact suppression, no SUITPOISON, but normal DamageSub / wake / positive-damage ItemCrush.
- After the first hit, fixed scans all currently alive entries on the target side in ascending battle-slot order. EarthRound entries remain in this candidate pool.
- All remaining N-1 target slots are pre-drawn as one batch with replacement **before** any extra `BATTLE_Attack()` damage RNG is consumed.
- Extra hits are ordinary `BATTLE_Attack()`: real Guardian substitution plus normal DamageReact, SUITPOISON and ItemCrush, while the profession outer branch still performs no ordinary Counter.
- If a pre-drawn slot becomes dead or is EarthRound when executed, fixed discards the rest of that batch, rebuilds the live pool, and pre-draws the whole remaining count again.
- If only EarthRound candidates remain, the original loop can redraw forever. Web reports `sourceInfiniteLoop: earthround-only-candidate-pool` and stops safely instead of freezing the browser.

Added `tools/check_v231_profession_chaos_runtime.mjs`; save schema remains **30**.

---

## V2.30 profession Skill 41 convolute attack

V2.30 adds Warrior Skill 41 `PROFESSION_CONVOLUTE` and introduces a battle-local Player WORKATTACKPOWER mirror so source callback mutations survive for the rest of the same round.

- Runtime row: TARGET=8, KIND=1, USE_FLAG=1, MP 28, magic token `无`.
- Enemy row pseudos:
  - 23 = back 10..14
  - 24 = front 15..19.
- fixed `BATTLE_MultiList()` falls to the opposite row when the requested row is empty and rewrites COM2 to the fallback pseudo.
- `PROFESSION_MAGIC_TOLIST_SORT()` then rebuilds the entire live row in ascending battle-slot order.
- Convolute has no practice-power case, but `PROFESSION_MAGIC_GET_PRACTICE()` still consumes its unconditional `RAND(1,100)` and `rand()%100`.
- Every target first runs profession magic dodge. Only a magic-dodge-passing target reaches the Convolute attack mutation.
- fixed `BATTLE_PROFESSION_CONVOLUTE_GET_DAMAGE()` mutates the current WORKATTACKPOWER:
  `int(WORKATTACKPOWER * (50 + tier*2) / 100)`.
  This is cumulative across row targets; it is not recalculated from FIXSTR.
- The mutated final WORKATTACKPOWER remains active for the rest of the same source round and is rebuilt only by the next PreCommand compliance boundary.
- Web adds battle-local `battlePlayerAttackWork`, read by `playerBattleView().attack`, cleared on battle reset and each new PreCommand.
- The same Work persistence is now applied to existing Skill 24 CHAIN_ATK_2 and Skill 38 SHIELD_ATTACK, whose fixed callbacks also write WORKATTACKPOWER before their attack.
- Per-target physical path reuses the V2.29 dedicated semantics: critical RNG before ordinary duck, direct critical damage even with bow, no AttackSeq critical proficiency hook, no second suit dodge.
- Physical raw power then passes through UN_POW_M.
- `PROFESSION_MAGIC_CHANGE_STATUS()` has no Convolute case but still consumes its unused leading `RAND(1,100)`.
- Final HP subtraction is direct: no Guardian, GuardAdjust, DamageSub, DamageReact consumption, ItemCrush, SUITPOISON, physical Ultimate, or ordinary Counter.
- Tail wake-up applies to every magic-dodge-passing target even if inner physical dodge produced zero damage.

Added `tools/check_v230_profession_convolute_runtime.mjs`; save schema remains **30**.

---

## V2.29 profession Skill 39 through attack

V2.29 adds Warrior Skill 39 `PROFESSION_THROUGH_ATTACK` through its actual fixed profession-magic pipeline rather than approximating it as ordinary attacks.

- Runtime row: TARGET=1, KIND=1, USE_FLAG=1, MP 21, option magic token `无` → magic type -1.
- Direct dead target follows fixed `__ATTACK_MAGIC BATTLE_MultiList()`: repeatedly sample packed alive slots with `rand()%10` until a non--1 entry is reached.
- Through pairing uses ±5 in the same column. With both entries alive, `PROFESSION_MAGIC_TOLIST_SORT()` always emits front 15..19 first, back 10..14 second.
- If only one target survives, it remains list index 0 even if physically in the back row. Since source damage scaling keys off loop index rather than row, that back target receives the first/front multiplier.
- `PROFESSION_MAGIC_GET_PRACTICE()` has no Through power branch, but still consumes its unconditional `RAND(1,100)` and `rand()%100`; hp_power stays 0 and no variance roll follows.
- Per target, `PROFESSION_MAGIC_DODGE()` consumes `RAND(1,100)` before EarthRound rejection. Enemy targets use `int(LV*0.15)`, capped at 20, and miss on `roll <= luck`.
- tier != 10, once per magic-dodge-passing target:
  - MYSKILLHIT=1
  - MYSKILLHIT_NUM=-70
  - WORKHITRIGHT -=50
  This reuses V2.28's exact transient Work lifecycle, including the later fixed compliance bug.
- Dedicated physical path consumes critical `RAND(1,10000)` before ordinary duck.
  - critical skips ordinary BATTLE_DuckCheck entirely;
  - direct `BATTLE_CriDamageCalc()` has no bow exception;
  - it does not trigger AttackSeq's Weapon Focus / Dual Weapon critical proficiency hooks.
- Noncritical path uses BATTLE_DuckCheck semantics only; no second SUIT WDUCKPOWER dodge.
- GUARD / cannot-move / current DamageReact disable ordinary duck, but Through subsequently does no GuardAdjust or DamageSub.
- Physical raw power is then passed through profession `UN_POW_M`; magic type -1 otherwise leaves it unchanged.
- `PROFESSION_MAGIC_CHANGE_STATUS()` has no Through case but still consumes its leading unused `RAND(1,100)`.
- Final multiplier:
  - target index 0 = `70 + tier*2` percent
  - target index 1 = `50 + tier*2` percent.
- Final HP subtraction is direct. No Guardian, GuardAdjust, DamageSub, DamageReact consumption/reflection, ItemCrush, SUITPOISON, physical Ultimate or ordinary Counter.
- Fixed tail wakes every target that passed profession magic dodge, even if the inner physical duck made final damage 0.
- Also corrected `sourceProfessionEnemyByBattleSlot()` so the single-enemy battle object is reachable, not only group `enemy.units`.

Added `tools/check_v229_profession_through_attack_runtime.mjs` and wired it into Actions. Save schema remains **30**.

---

## V2.28 profession Skill 40 near-death attack

V2.28 adds Warrior Skill 40 `PROFESSION_DEAD_ATTACK` and audits the generic profession direct-attack DamageReact branch.

### DEAD_ATTACK execution

- Runtime row: TARGET=1, KIND=1, USE_FLAG=1, MP 17, option `命%82|HP%10|倍%2|效%1|回%3`.
- The fixed HP>10 gate is checked at battle execution time; packet-receipt MP/proficiency has already happened.
- `rate = tier*2 + 10`.
- New HP is `int(currentHP * rate / 100)`, so tier0 keeps 10% and tier10 keeps 30% of current HP.
- `hit = tier*2 + 80`.
- The skill writes `WORKHITRIGHT += hit`, `MYSKILLHIT=1`, `MYSKILLHIT_NUM=hit` before the profession AttackSeq.
- The physical hit keeps the generic profession calc-only Guardian caller bug, omits ordinary SUITPOISON and does not enter the ordinary Counter loop.

### MYSKILLHIT source lifecycle / bug

A later fixed PreCommand does not simply preserve the skill's HITRIGHT bonus:

1. compliance rebuilds WORKHITRIGHT from equipment;
2. MYSKILLHIT and MYSKILLHIT_NUM survive;
3. fixed `Other_DefcharWorkInt()` mistakenly performs
   `MYSKILLHIT += preSuitFIXTOUGH * equipmentWORKHITRIGHT / 100`;
4. the ordinary StatusSeq tail then decrements MYSKILLHIT;
5. only when it becomes zero does source subtract MYSKILLHIT_NUM from the CURRENT rebuilt WORKHITRIGHT.

Consequences preserved by Web:
- with equipment HITRIGHT 0, the next action can see `WORKHITRIGHT = -skillHit` for one command;
- with nonzero equipment HITRIGHT, the wrong-field formula can extend the MYSKILLHIT counter, potentially repeatedly.

A new battle-local `battlePlayerProfessionHitState` mirrors turns / power / WORKHITRIGHT and is reset with all other battle-local Work. `playerBattleView()` now consumes this transient HITRIGHT when present. Save schema does not change.

### Generic direct DamageReact correction

Pinned `battle_profession_attack_fun()` sets local react back to zero for every generic direct profession skill except `BATTLE_COM_S_CHAIN_ATK`.

V2.28 therefore corrects the first-hit runtime:
- CHAIN_ATK preserves DamageReact / ACUPUNCTURE;
- BRUST and DEAD_ATTACK do not trigger or consume ACUPUNCTURE;
- CHAIN_ATK_2 and SHIELD_ATTACK keep their separate fixed helper semantics.

Added `tools/check_v228_profession_dead_attack_runtime.mjs`; historical V2.25/V2.27 regressions were adjusted only to avoid version-string brittleness and to assert the corrected DamageReact split. Save schema remains **30**.

---

## V2.27 profession Skill 38 shield attack

V2.27 adds Warrior Skill 38 `PROFESSION_SHIELD_ATTACK` as a live profession battle command.

- Runtime row: TARGET=1, KIND=1, USE_FLAG=1, MP 5, option `晕|成%30|效%2|回%2`.
- Shield requirement is checked at **execution time**, matching fixed `battle_profession_status_chang_fun()`; packet-receipt MP/proficiency has already happened.
- Web shield gate mirrors `CHAR_EQSHIELD`: player slot 6 must contain an existing item whose `ITEM_TYPE` is 25 / `ITEM_WSHIELD`.
- Attack power:
  - tier 10 keeps current WORKATTACKPOWER;
  - all other tiers use `int(WORKATTACKPOWER * 0.5)`.
- Shield Attack uses the profession status-change physical path and therefore preserves the calc-only Guardian caller bug.
- Fixed `PROFESSION_BATTLE_StatusAttackCheck()` is mirrored directly:
  - consume `RAND(1,100)` first;
  - then reject dead targets or any target that already has an abnormal status;
  - success is strict `roll < Success`;
  - no ordinary status-level/resistance formula is used.
- `Success = 30 + tier*4`.
- Option `回%2` is stored by source as `turn+1 = 3`.
- Status check occurs after damage/death/ItemCrush and only for NORMAL/CRITICAL-equivalent hits; MISS/DODGE does not consume the Shield Attack dizzy roll.
- On dizzy success fixed source clears the defender command to NONE; Web clears the Enemy guard flag and uses the existing dizzy blocker.
- No ordinary SUITPOISON branch and no ordinary Counter loop are added.

Added `tools/check_v227_profession_shield_attack_runtime.mjs`; V2.26 historical regression is now version-agnostic so later UI version bumps do not create false failures. Save schema remains **30**.

---

## V2.26 profession Skill 24 dual attack

V2.26 adds fixed Skill 24 `PROFESSION_CHAIN_ATK_2` as the third live Warrior battle skill.

- Runtime row: TARGET=1, KIND=1, USE_FLAG=1, MP 13, command `BATTLE_COM_S_CHAIN_ATK_2`.
- Packet-receipt MP/proficiency lifecycle remains the V2.25 model.
- Execution mirrors fixed `battle_profession_attack_fun()`:
  - pre-consume ABSROB by 1, VANISH by 1 and clear TRAP;
  - fixed REFLEC decrement line is commented out, so REFLEC is not consumed;
  - first stage sets WORKATTACKPOWER=0 and is animation/no-damage only;
  - real attack power becomes `FIXSTR * (tier*2 + 100) / 100`;
  - if attacker and original defender remain alive, issue exactly one ordinary `BATTLE_Attack()` to the same raw defNo;
  - return immediately instead of entering the shared profession AttackSeq path.
- Web maps FIXSTR to the existing player equipment-compliance fixed attack snapshot. Current WORKATTACKPOWER modifiers are intentionally not used as the base.
- Current source-backed Enemy DamageReact exposes ACUPUNCTURE only. The fixed pre-consume list does not include ACUPUNCTURE, so it remains untouched; no fake ABSROB/VANISH/TRAP state fields are created.
- The real attack keeps ordinary Guardian substitution, SUITPOISON and ItemCrush behavior.
- No ordinary Counter is appended after the profession command.
- The battle panel now exposes learned Skill 24 together with Skills 22/23.

Added `tools/check_v226_profession_chain_atk2_runtime.mjs` and wired it into Actions after V2.25. Save schema remains **30**.

---

## V2.25 profession TARGET/KIND + first live battle skills

V2.25 closes the profession battle-command target semantics that V2.24 intentionally left unresolved.

### Fixed client/server target bridge

Pinned server authority remains `gavinlinasd/StoneAge@1f90cb6cb57c1df70f39cde77a5a8ccd98b66c56`.
Client-side corroboration uses `anson1788/stoneage@1997fc20456dbda36d181b9680ae10bed2e9cdf9` only to identify the UI enum and packet conversion.

- KIND: 1 BattleSkill / 2 AssitSkill / 3 AdvanceSkill.
- TARGET is the existing PETSKILL target enum 0..10.
- Direct battle entries remain 0..19.
- Pseudo `toNo`: 20 Side0, 21 Side1, 22 All, 23 Side1 back row, 24 Side1 front row, 25 Side0 front row, 26 Side0 back row.
- ONE_ROW click conversion: 0..4→26, 5..9→25, 10..14→23, 15..19→24.
- Player BattleMyNo=0 therefore resolves ALLOTHERSIDE to 21 and ALLMYSIDE to 20.

`sourceProfessionBattleCommandPlan()` now resolves the client target shape to the exact `P|slotHex|toNoHex` server command while preserving the explicit-toNo fixture path.

### Command-receipt lifecycle

`sourceProfessionBattleSkillPrepare()` runs before battle sorting / StatusSeq:

1. resolve learned slot + target;
2. run the fixed profession/MP preflight;
3. deduct MP immediately;
4. run post-dispatch proficiency immediately;
5. retain the prepared COM plan for execution when the Player actor later reaches its turn.

This preserves the fixed split between packet receipt and battle execution. A later sleep/paralysis/death can cancel the actual action without refunding MP or rolling back proficiency.

### First live physical profession skills

Skill 22 `PROFESSION_BRUST` and Skill 23 `PROFESSION_CHAIN_ATK` are now executable from the battle UI.

BRUST preserves the fixed source bug:
- tier uses `PROFESSION_CHANGE_SKILL_LEVEL_A()`;
- helper writes `CHAR_WORKFIXSTR = oldFixStr * (100 + tier*3) / 100`;
- the immediately following `BATTLE_DamageCalc()` reads `CHAR_WORKATTACKPOWER`, not FIXSTR;
- therefore Web does not invent a current-hit damage bonus.

CHAIN_ATK preserves fixed ordering:
- `RAND(1,100)` is consumed before the first AttackSeq;
- non-10-multiple tier is incremented once before computing hit chance;
- chance is `tier*5 + 15`;
- first hit uses the profession helper path;
- on proc, if attacker and original target remain alive, one ordinary `BATTLE_Attack()` is issued against the same raw defNo.

The first profession hit preserves the calc-only Guardian caller bug and omits ordinary BATTLE_Attack SUITPOISON. The CHAIN second hit is a true ordinary BATTLE_Attack with real Guardian substitution. The direct profession case breaks before the common Counter loop, so neither skill gains an ordinary Counter chain.

The battle panel lists only learned skills with a V2.25 live executor; other battle functions remain fail-closed.

Added `tools/check_v225_profession_battle_runtime.mjs`; Actions now runs it after the V2.24 profession regression. Save schema remains **30**.

---

## V2.24 profession command/status bridge + out-of-battle Track/Escape

- Battle command fixed parser：`P|<slotHex>|<toNoHex>`；第一個值是 CHAR_HaveSkill slot，不是 Skill ID。
- `sourceProfessionSkillStatusRow/String/Menu()` 鏡像 fixed S status：USE_FLAG / ID / TARGET / KIND / ICON / MP / LEVEL / NAME / TEXT。
- `sourceProfessionBattleCommandPlan()` 使用 slot 取 Skill ID，保留 raw `toNo`，不猜 client TARGET enum。
- USE_FLAG=0 的 fixed rows 只有 44 TRACK、45 ESCAPE；兩個 callback 均已 live：
  - display level `/10`；
  - OPTION `倍%5`；
  - encounter fix 正／負；
  - 180 秒；
  - MP 先扣；
  - callback ret 與 proficiency post-dispatch 順序保留。
- char_walk profession `temp` 用 clamp 前 CEP。
- expiry 清 Work 後該步仍使用 stale local p_cep，下一步才歸零。
- 重複施放 active effect 時 callback ret=-1，但效果／timer 已更新；protocol failure 狀態不被 Web 偷改。
- encounter profession Work 不持久化，schema 維持 30。

新增 `tools/check_v224_profession_command_outbattle.mjs`。


---

## V2.34 Warrior Skill 53 Deflect / Arrange lifecycle

V2.34 closes Skill 53 `PROFESSION_DEFLECT` together with fixed `BATTLE_ArrangeCheck()`.

- Runtime row: Skill 53, TARGET=1, KIND=2, USE_FLAG=1, MP=0, FIX_VALUE=10, command `BATTLE_COM_S_DEFLECT`.
- `PROFESSION_deflect()` only prepares that command; pinned `battle.c` has no matching profession command-switch case, so active use keeps command-receipt MP/proficiency and becomes NoAction at execution.
- `BATTLE_ProfessionStatus_init()` writes `WORKFIXARRANGE += tier+10` and immediately calls `CHAR_complianceParameter()`; that resets FIXARRANGE, rebuilds it from equipment `ITEM_MODIFYARRANGE`, then copies it to WORKARRANGEPOWER. Effective Arrange power is equipment-only.
- `BATTLE_ArrangeCheck()` rejects raw GUARD, positive DamageReact, cannot-move, NODUCK and ABIO before RNG. Raw GUARD is kept separately from confusion-aware GuardAdjust.
- Chance is `RAND(1,1000) <= min(WORKARRANGEPOWER,700)`, so maximum success rate is 70%.
- Success happens after GuardAdjust and damage<1 RAND, then C-int truncates `damage *= 0.1`.
- Player success attempts `PROFESSION_SKILL_LVEVEL_UP(...,"PROFESSION_DEFLECT")` even if the 10% truncation later becomes zero.
- Zero damage rewrites ARRANGE to MISS; Guardian zero becomes NORMAL damage=1; positive damage keeps ARRANGE.
- `BATTLE_Attack()` leaves `iRet=TRUE` for ARRANGE, so ordinary Counter is intentionally not blocked, while existing post-effect ARRANGE gates now receive a real `r.arranged`.

Added `tools/check_v234_profession_deflect_arrange_runtime.mjs`; save schema remains **30**.


---

## V2.35 Warrior Skill 33 Reback automatic StatusSeq recovery

V2.35 closes Skill 33 `PROFESSION_REBACK`.

- Runtime row: Skill 33, TARGET=1, KIND=2, USE_FLAG=1, MP=0, option `HP%2`, command `BATTLE_COM_S_REBACK`.
- `PROFESSION_reback()` only prepares that command; pinned `battle.c` has no matching profession command-switch case, so active use keeps command-receipt proficiency and becomes NoAction.
- The real effect runs automatically for every Player actor in `BATTLE_ProfessionStatusSeq()`, after ordinary `BATTLE_StatusSeq` / `BATTLE_MagicStatusSeq` and before `BATTLE_CanMoveCheck`.
- Fixed qualifying `status_table[9]`: paralysis, sleep, stone, dizzy, entwine, dragnet, ice-crack, ice-arrow, thunder-enclose. Poison, drunk, confusion, weaken, deep-poison, barrier and nocast do not trigger it.
- Because the check is post-countdown, a qualifying status that reaches zero during this StatusSeq no longer qualifies.
- Skill level uses `PROFESSION_CHANGE_SKILL_LEVEL_M()`: >90 => 10, >80 => 9 ... >10 => 2, otherwise 1.
- Heal is `min(20, tier*2)% * WORKMAXHP`, C-int truncated and capped at max HP.
- `PROFESSION_SKILL_LVEVEL_UP("PROFESSION_REBACK")` is still attempted when the heal cap reduces the actual restored HP to zero.
- Fixed skill-slot scan uses `if(Pskillid <= 0) return`; V2.35 preserves the first empty/invalid slot as a hard terminator rather than skipping gaps.

Added `tools/check_v235_profession_reback_runtime.mjs`; save schema remains **30**.


---

## V2.36 Weapon Focus fixed damage lifecycle

V2.36 closes Skills 26..32 `PROFESSION_WEAPON_FOCUS` as a real passive FIXSTR modifier.

- Fixed weapon marker map: AXE 1→斧, CLUB 2→棍, SPEAR 3→枪, BOW 4→弓, BOOMERANG 17→镖, BOUNDTHROW 18→投, BREAKTHROW 19→石.
- `BATTLE_ProfessionStatus_init()` resets WORK_WEAPON / WORKMOD_WEAPON, scans profession slots with `continue` on empty/invalid rows, and snapshots only the skill matching the currently equipped weapon and profession class.
- Tier uses `PROFESSION_CHANGE_SKILL_LEVEL_A()`.
- Modifier is tier<=5 ? tier*2 + stale MYSKILLSTRPOWER : (tier-5)*3 + 10 + stale MYSKILLSTRPOWER, capped only above at 25.
- `ITEM_equipEffect()` applies `FIXSTR = int(FIXSTR * (100 + WORKMOD_WEAPON) / 100)` after MYSKILLSTR and before WEAKEN.
- Weapon Focus proficiency gains on critical do not mutate the current Work modifier; entering battle or changing weapon is required to rebuild it.
- MYSKILLSTRPOWER is mirrored separately because fixed StatusSeq clears the STR turn counter but leaves the power Work value stale until the next BATTLE_BadStatusAllClr.
- Battle entry clears that raw STR power first, so initial Weapon Focus snapshot always sees oldStrPower=0.
- Mid-battle weapon change preserves source order: CHAR_moveEquipItem compliance runs with the OLD focus snapshot, then BATTLE_ProfessionStatus_init rebuilds the NEW snapshot for the next compliance.
- Skill 24 CHAIN_ATK_2 FIXSTR now reads the same MYSKILLSTR → Weapon Focus → WEAKEN effective FIXSTR bridge instead of raw equipment-only fixedAttack.

Added `tools/check_v236_profession_weapon_focus_runtime.mjs`; save schema remains **30**.


---

## V2.37 Skill 25 Avoid passive duck Work

V2.37 closes Skill 25 `PROFESSION_AVOID`.

- Runtime row: TARGET=1, KIND=2, USE_FLAG=1, MP=0, option `回`, command `BATTLE_COM_S_AVOID`.
- `BATTLE_ProfessionStatus_init()` resets WORK_P_DUCK / WORKMOD_P_DUCK and scans profession slots with continue on empty/invalid rows.
- Avoid profession mismatch uses source `return`, not continue.
- A-tier modifier is tier<=5 ? tier*2 : (tier-5)*3, capped above at 25. Preserve the source discontinuity: tier5=10, tier6=3.
- `BATTLE_check_profession_duck(int per)` runs after ordinary 75% cap and Player HITRIGHT. Float per is truncated on the int parameter boundary, then multiplied by (100+mod)% with integer truncation.
- No recapping occurs after Profession Avoid; CHAOS then adds another 40%. Threshold can exceed 7500 and even 10000.
- Tier0 / mod0 still forces the int-parameter truncation when WORK_P_DUCK is active.
- Successful ordinary Player dodge continues to attempt Skill 25 proficiency via the V2.23 hook; proficiency changes do not mutate current Work until Status_init refresh.
- Weapon change reruns Status_init, so it refreshes Avoid Work together with Weapon Focus.
- Active `PROFESSION_avoid()` prepares BATTLE_COM_S_AVOID, but `battle_profession_assist_fun()` has no matching case. Web preserves command-receipt proficiency then executes source NoAction rather than inventing an active dodge buff.

Added `tools/check_v237_profession_avoid_runtime.mjs`; save schema remains **30**.

## V2.38 Skill 43 Dual Weapon equipment/effect lifecycle

V2.38 closes the fixed passive lifecycle for Skill 43 `PROFESSION_DUAL_WEAPON`.

- Dynamic `ITEM_getEquipPlace()` now reproduces the second non-bow left-slot rule and bow exclusion.
- Non-`ITEM_WSHIELD` left-slot `itemEffect[]` fields use per-field integer-truncated `(tier*3+20)%` contributions; duplicate matching skill rows stack exactly as the source loop does.
- `ITEM_MODIFYATTRIBVALUE` intentionally remains full strength because the source attribute accumulator is outside the scaling loop.
- Mid-battle equipment refresh caches the command source item before the move, evaluates equip-place after the move, and refreshes Avoid / Weapon Focus only when the post-move result is `CHAR_ARM`.
- Skill 43 remains passive in the web battle UI; the fixed zero-MP use path is rejected before its trivial callback.

Added `tools/check_v238_profession_dual_weapon_runtime.mjs`; save schema remains **30**.

## V2.39 Skill 54 Cavalry fixed CAVALRY_DEBUG path

V2.39 closes the currently reachable Skill 54 `PROFESSION_CAVALRY` path.

- The pinned `version.h` defines `CAVALRY_DEBUG`.
- As compiled, `battle_profession_attack_fun()` calls ordinary `BATTLE_DamageSub()` for Cavalry. The special `BATTLE_PROFESSION_ATK_PET_DamageSub()` ride-pet split lives only in the disabled `#else` branch.
- The skill is now a supported direct profession physical command with its fixed MP/proficiency receipt lifecycle.
- It preserves the profession direct-attack boundaries: same-side/EarthRound NoAction, calc-only Guardian bug, non-CHAIN DamageReact suppression, no ordinary SUITPOISON branch, normal wake/ItemCrush, and no outer ordinary Counter loop.
- The web still has no formal `CHAR_RIDEPET` relationship. Active Pet is not treated as a mount, so no `BATTLE_adjustRidePet3A()` values are fabricated.

Added `tools/check_v239_profession_cavalry_runtime.mjs`; save schema remains **30**.

## V2.40 Skills 46/48 Hunter control statuses

V2.40 closes `PROFESSION_ENTWINE` and `PROFESSION_DRAGNET` against the pinned status-change path.

- Both use strict `RAND(1,100) < (base Success + A-tier*4)`; RNG is consumed before dead/existing-status early returns.
- Successful status writes store `turn+1` and clear the target's current command immediately.
- Entwine: base Success 40, base DEX reduction 30, option turn 5. It mutates FIXDEX only; WORKQUICK/EntrySort are unchanged and next PreCommand compliance rebuilds FIXDEX. ENTWINE is not in fixed `BATTLE_CanMoveCheck()`.
- Dragnet: base Success 30, option turn 2. Existing target-side Dragnet count applies integer-truncated x0.64 for exactly one or x0.4 for two or more. DRAGNET is in fixed `BATTLE_CanMoveCheck()`.
- The web uses a same-battle-turn command-cancel marker so only not-yet-executed Enemy commands are suppressed.

Added `tools/check_v240_profession_hunter_control_runtime.mjs`; save schema remains **30**.


---

## V2.41 Skill 51 Weakness Attack

V2.41 接入獵人 Skill 51「弱點攻擊」／`PROFESSION_ATTACK_WEAK` 的 fixed direct-physical lifecycle。

### Fixed source result

`PROFESSION_attack_weak()` 只透過 `profession_common_fun()` 寫入 `BATTLE_COM_S_ATTACK_WEAK`。真正執行在 `battle_profession_attack_fun()`：

- skill display level 先經 `PROFESSION_CHANGE_SKILL_LEVEL_A()` 轉成 tier。
- 若守方 `CHAR_WHICHTYPE` 是 `CHAR_TYPEPET` 或 `CHAR_TYPEENEMY`：
  - `WORKATTACKPOWER = int(WORKATTACKPOWER * (110 + tier*2) / 100)`
- 接著無條件修改**攻方自己**：
  - `WORKQUICK = int(FIXDEX * (90 - tier) / 100)`
- 原 C 同時送出攻方敏捷下降的 battle display；並沒有修改守方 DEX / QUICK。

`BATTLE_EntrySort()` 在這個 command execution 以前已經完成，所以 WORKQUICK 的下降不會重排本輪出手順序；但接著的 `BATTLE_AttackSeq() -> BATTLE_DamageCalc()` 會直接讀攻方 WORKQUICK，因此會影響本次傷害計算。

### Direct profession boundary

沿用 fixed generic direct-profession attack：

- 同隊目標在 `battle.c` 先 NoAction。
- EarthRound 目標在 `battle_profession_attack_fun()` 直接 return。
- 非 `BATTLE_COM_S_CHAIN_ATK` 的 DamageReact 會在傷害前清為 0。
- 不走普通 `BATTLE_Attack()` 的 SUITPOISON。
- WakeUp / ItemCrush 等 `BATTLE_DamageSub()` 後續副作用保留。
- 不新增普通 Counter loop。

### Web implementation

新增 `sourceProfessionAttackWeakExecute()`：

- 先以目前 Player battle Work 取 `WORKATTACKPOWER`。
- 依 fixed 公式建立新的 attack Work，並透過既有 `sourceProfessionSetPlayerAttackWork()` 保存本輪 mutation。
- 以 `FIXDEX × (90-tier)%` 建立攻方 `workQuick`，只作為緊接著 physical calc 的 attacker override；不修改 Enemy 狀態、不重跑 EntrySort。
- 交給既有 direct-profession physical hit boundary 套用 DamageReact / SUITPOISON 抑制與 generic hit side effects。

新增 `tools/check_v241_profession_attack_weak_runtime.mjs`，覆蓋 Skill 51 row metadata、公式、攻方 quick override、dispatcher、direct-profession boundary、V2.41 marker 與 save schema。

save schema 維持 **30**。


---

## V2.42 Skill 52 Instigate

V2.42 接入獵人 Skill 52「挑撥」／`PROFESSION_INSTIGATE`，並完整保留它分成「status 命中」與「目標自己的 StatusSeq 發作」兩階段的 fixed 行為。

### Runtime row

- Skill ID 52
- MP 17
- TARGET 1
- KIND 2
- option `挑|成%20|敏%30|效%1|回%2`
- command `BATTLE_COM_S_INSTIGATE`

### Application

`battle_profession_status_chang_fun()` 使用：

`Success = 20 + A-tier*4`

並走共用 `PROFESSION_BATTLE_StatusAttackCheck()`：

- 先 `RAND(1,100)`
- 再 dead / existing StatusTbl early return
- strict `roll < Success`

一般 option turn=2，StatusTbl 寫 turn+1=3；但 fixed 對 `skill_level==10` 有明確特判，把 turn 改 4，因此 tier10 寫 **5**。

成功後：

`WORKMODINSTIGATE = tier + 10`

Instigate 不在 status-change helper 成功後「立即 `BATTLECOM1=NONE`」的 command-clear 名單，因此**命中本身不取消目標當前已輸入指令**。

### StatusSeq

fixed `BATTLE_StatusSeq()` 先把 stored turn `--cnt`；若 cnt<=0 先解除並 continue，所以 expiry tick 不做挑撥效果。

仍 active 時：

1. `RAND(1,100)`
2. >80：break
3. <=80：COM1 = ordinary ATTACK
4. side = 自己 side
5. rate = WORKMODINSTIGATE
6. FIXSTR / FIXTOUGH / FIXDEX 各乘 `(100-rate)/100`
7. `RAND(0,9)`
8. 從 `++pos` 開始掃自己 side，排除自己的 battle slot，取第一個 TargetCheck-valid target
9. 找不到則 COM2=-1

FIX-only 是重要來源邊界：這段沒有重算 WORKATTACKPOWER / WORKDEFENCEPOWER / WORKQUICK，也不會重跑 EntrySort。Web 因此只改 `roundFixAttack / roundFixDefense / roundFixQuick`，保留本輪既有 `roundAttack / roundDefense / roundQuick`。

### RNG ordering and COM2=-1

同 side target 的 `RAND(0,9)` 發生在 StatusSeq，位於 `BATTLE_GetAttackCount()` **之前**。

如果同 side 找不到人，StatusSeq 只留下 COM2=-1。非 BOW 普通 ATTACK 要等 AttackCount 已消耗後，才由 `BATTLE_TargetAdjust() -> BATTLE_DefaultAttacker(1-myside)` 消耗 fallback RNG。

BOW 是固定例外：`BATTLE_TargetListSet()` 收到 invalid COM2 時只留下 sentinel，不 DefaultAttacker、也不消耗 bow `RAND(0,1)`，因此這次 NoAction。

### Ordinary weapon command

挑撥是把 command 改成真正 `BATTLE_COM_ATTACK`，所以 V2.42 接回目前 fixed Enemy 武器 runtime：

- BOW：source `aBowW`、AttackNum、多 target、raw invalid NoAction。
- BOOMERANG：ATTACK → BOOMERANG、0.3 damage、Enemy reverse row sweep；attackNo/5 == target row 時 NoAction。
- BOUNDTHROW：common physical loop。
- BREAKTHROW：common physical loop，paralysis before ItemCrush / AddProfit。
- melee fixed Enemy weapons：ordinary attack / Guardian / Counter。

目前 fixed Enemy auto weapon templates 中，真正 multi-hit 的是 BOW（STYLE Item 400 為 1～3、dojo Item 2498 為 3～5）；其餘目前可達模板都是 1 hit，但 adapter 保留 common AttackCount 結構。

### Regression

新增：

`tools/check_v242_profession_instigate_runtime.mjs`

覆蓋：

- Skill 52 runtime metadata
- command support
- tier5 / tier10 success, rate, stored turn
- no immediate command cancel
- same-side ++pos scan
- FIX-only mutation
- StatusSeq decrement / expiry / 80% proc ordering
- StatusSeq target RNG before Enemy AttackCount
- COM2=-1 deferred fallback
- BOW / BOOMERANG / BOUNDTHROW / BREAKTHROW bridges
- BREAKTHROW status-before-ItemCrush ordering
- V2.42 UI marker
- save schema 30

save schema 維持 **30**。


---

## V2.43 Skill 47 Trap

V2.43 接入獵人 Skill 47「陷阱」／`PROFESSION_TRAP` 的 fixed assist → ProfessionStatusSeq → DamageReact → DamageSub 完整鏈。

### Runtime row

- Skill ID 47
- MP 11
- TARGET 5
- KIND 2
- option `效%1|回%5`
- command `BATTLE_COM_S_TRAP`

### M-tier / assist

`battle_profession_assist_fun()` 對 TRAP 先執行：

`PROFESSION_CHANGE_SKILL_LEVEL_M(skill_level)`

分段為：

- >90 → 10
- >80 → 9
- >70 → 8
- >60 → 7
- >50 → 6
- >40 → 5
- >30 → 4
- >20 → 3
- >10 → 2
- 其他 → 1

之後：

`WORKMODTRAP = tier * 30 + 100`

`WORKTRAP = tier>=10 ? 3 : tier>=5 ? 2 : 1`

因此 fixed Trap damage 為 130～400。

### ProfessionStatusSeq

TRAP 不在一般 StatusTbl。

`BATTLE_ProfessionStatusSeq()` 每次 Player 自己進該階段時：

- count > 0：count--
- count == 0：才清 WORKTRAP / WORKMODTRAP

這代表 1→0 的 pass 之後 DamageReact 已經看不到 active Trap，但 MODTRAP 仍多留一個 ProfessionStatusSeq pass。V2.43 保留此來源生命週期。

### DamageReact priority

fixed `BATTLE_GetDamageReact()`：

`VANISH -> ABSROB -> REFLEC -> TRAP -> ACUPUNCTURE`

Player Trap 進入 `BATTLE_DamageSub()` 後，只有正 damage 才可能觸發。

投射武器由 `BATTLE_IsThrowWepon()` 阻擋：

- BOW
- BOOMERANG
- BOUNDTHROW
- BREAKTHROW

這些攻擊將 pRefrect 改回 NONE，Trap 不消耗。

### Trigger behavior

非投射正傷害踩到 Trap：

1. 原 calculated damage 被覆寫成 WORKMODTRAP。
2. Player 不扣該次 damage。
3. attackindex 扣固定 Trap damage。
4. WORKTRAP / WORKMODTRAP 立刻清 0。
5. local defindex 改成 attackindex。
6. 後續 WakeUp / status target / ItemCrush / death / Ultimate 依 redirected attacker 處理。
7. BATTLE_Attack 在 DamageReact precheck 已把 iRet 設 FALSE，因此 outer Counter 不再開始。

V2.43 以 `sourceCounterBlockedByTrap` 明確保存這個 ContFlg 邊界。

### Guardian

原 BATTLE_Attack 在 AttackSeq 前雖先看到原 Player 的 DamageReact，但若後續 Guardian 真正代擋，DamageSub 收到的是 Guardian defindex；Player Trap 不會被 Guardian 代擋那一下消耗。

Web 同樣只在 actual target 仍是 Player 時啟動 Trap。

### Current Web physical coverage

接入：

- ordinary Enemy physical
- common multi-hit / weapon sequence
- physical PetSkill helper
- Counter
- Confusion
- Combo per-segment immediate DamageReact
- Guardian actual-target routing
- status-after-hit redirect

STATUSCHANGE 特別需要 redirect：Trap 觸發後 status helper 必須收到 attacker desc，對齊 fixed BATTLE_Attack 的 defindex=attackindex。

### Regression

新增：

`tools/check_v243_profession_trap_runtime.mjs`

覆蓋：

- runtime metadata
- M-tier thresholds
- value 130 / 250 / 400 fixtures
- WORKTRAP 1 / 2 / 3
- 1→0 MOD retention
- later MOD clear
- throw block / no consume
- MISS / DODGE / zero preserve Trap
- fixed damage redirect
- attacker wake / Player no damage
- Counter block
- common skill / weapon / confusion / combo hooks
- V2.43 UI marker
- save schema 30

save schema 維持 **30**。


---

## V2.44 Skill 50 Toxin Weapon

V2.44 接入獵人 Skill 50「毒素武器」／`PROFESSION_TOXIN_WEAPON` 的 fixed custom physical-status branch。

### Runtime row

- Skill ID 50
- MP 5
- TARGET 1
- KIND 1
- option `毒|前|成%20|敏%30|效%1|回%5`
- command `BATTLE_COM_S_TOXIN_WEAPON`

### Source shape

這招不是持續武器 Buff。

`battle.c` 把 command 送入 `battle_profession_status_chang_fun()`，TOXIN case 自己完成：

`weapon target list -> BATTLE_AttackSeq -> BATTLE_DamageSub -> WakeUp -> death -> ItemCrush -> PROFESSION_BATTLE_StatusAttackCheck`

之後 command 結束；沒有 ordinary Counter tail。

### Poison parameters

display level 先經 `PROFESSION_CHANGE_SKILL_LEVEL_A()`：

- <=10 => tier0
- >10 => tier1
- …
- >=100 => tier10

TOXIN 成功率：

`20 + tier*2`

因此 20～40。

option turn=5，成功後寫 `StatusTbl[POISON]=turn+1`，即 stored turn **6**。

每個正 damage segment 各自獨立呼叫 StatusAttackCheck。該 helper 固定先消耗 `RAND(1,100)`，再檢查 dead/existing status，成功為 strict `roll < Success`。

### Weapon target list

TOXIN custom loop不使用 `BATTLE_GetAttackCount()`。

- melee：raw COM2 single
- BOUNDTHROW：raw COM2 single
- BREAKTHROW：raw COM2 single；不走普通 BREAKTHROW paralysis tail
- BOW：`BATTLE_TargetListSet()` 的完整 `aBowW` list；沒有 AttackNum cap
- BOOMERANG：`BoomerangVsTbl[defNo/5]` 五格 row；每 hit ×0.3

Player 變身中時 fixed `bChange` 會跳過遠距 list 改寫，所以即使裝遠距武器也保留最初的 raw single-target MultiList。Web 目前可達的 Player 變身狀態是 BECOMEPIG，因此 V2.44 用 `playerPigActive()` 保存此邊界。

### Raw target / EarthRound

函式入口對 raw COM2：

- index invalid => return
- raw target command 是 EarthRound => return
- raw target HP==0 => **不 return**

因此 raw target 死亡仍可作為 BOW/BOOMERANG target-list seed。

TOXIN loop 對每個 secondary list member只檢查 index/HP，沒有 `BATTLE_TargetCheck()`。因此次要 bow/boomerang 目標即使 EarthRound hidden，只要還活著，source 仍會 AttackSeq。V2.44 刻意用 raw battle-slot lookup保留這個 bug。

### Damage lifecycle

每 hit 使用 real Guardian substitution。

TOXIN custom branch沒有 ordinary SUITPOISON；Web 因此傳 `suppressSuitPoison:true`，但保留 DamageReact、WakeUp、ItemCrush 與 death/Ultimate。

Poison status check發生在 DamageSub + ItemCrush之後。即使 DamageSub 已把 defender 打死，source仍先呼叫 StatusAttackCheck，所以 RNG照樣消耗，然後以 dead reason失敗。

### Regression

新增：

`tools/check_v244_profession_toxin_weapon_runtime.mjs`

覆蓋：

- row metadata
- supported function bridge
- 20～40% poison success
- stored turn 6
- BOW full target list
- BOOMERANG row / ×0.3
- BOUND/BREAK single target
- transformed remote single-target fallback
- no AttackCount helpers
- raw-dead dispatch before generic dead-target gate
- secondary EarthRound raw lookup
- DamageSub/ItemCrush before poison check
- no ordinary SUITPOISON / Counter
- V2.44 marker
- save schema 30

save schema 維持 **30**。


---

## V2.45 Skill 49 Plunder

V2.45 接入獵人 Skill 49「屍體掠奪」／`PROFESSION_PLUNDER` 的 fixed corpse-item / direct-exit lifecycle。

### Runtime row

- Skill ID 49
- MP 10
- TARGET 10 / DEATH
- KIND 2
- option `效%1`
- command `BATTLE_COM_S_PLUNDER`

### Dead-target exception

`battle_profession_attack_fun()` 對 direct profession 一般在 target HP<=0 時 return，但明確排除 `BATTLE_COM_S_PLUNDER`。所以屍體仍可進 case；raw target 若是 EarthRound 則在 switch 前照常 return。

client TARGET_DEATH 負責正常選屍體；server callback 本身沒有再要求 target HP==0。V2.45 不自行補額外 HP gate。

### Same-side carried-item scan

PLUNDER 先由 raw defNo 決定 side start，再做兩層固定掃描：

1. battle slot 由 sideStart 到 sideStart+9。
2. 每個有效角色掃 `CHAR_STARTITEMARRAY .. +9`。
3. 第一個 `ITEM_CHECKINDEX` 成功的 carried existing item立即停止掃描。

因此 item owner 不必等於 raw target；可以從同側另一名 Enemy 身上拿到第一件 carried item。無論 item 來自誰，最後 `BATTLE_Exit()` 的永遠是原 raw defindex。

### CHAR_AddPileItem

固定 `_ITEM_PILENUMS` / `_EQUIT_ADDPILE` 已開：

`maxPile = transmigration + trunc(transmigration/5)*2 + 3 + CHAR_WORKATTACHPILE`

`CHAR_findSurplusItemBox()` 只計 15 個 ItemBox 空格。

AddPile lifecycle：

- `itemPile > surplus*maxPile` 或 `itemPile<=0`：return -1，不 end 原 existing。
- `maxPile>=itemPile`：原 existing 直接進第一空格；unexpected add failure 時 end 原 existing。
- 否則每份先 `ITEM_makeItemAndRegist(itemId)`，再把 `ITEM_USEPILENUMS` 覆寫為 maxPile / remainder，最多 10 份。
- 所有新 existing 都成功加入後才 end 原 existing。
- 中途 make/add 失敗時，來源不回滾已建立／已加入的前段。

PLUNDER caller **完全忽略回傳值**，之後仍 talk「得到」、`CHAR_setItemIndex(enemy,item,-1)`，再 `BATTLE_Exit(raw target)`。V2.45 因此在容量失敗時也 detach Enemy slot；不把物品留回屍體。

### Web mapping

- `enemyDrops.slot 1..10` 對應 Enemy ItemBox 十格。
- 掃描只接受 runtime owner 仍為 `enemy:<unitId>` 的 existing item，避免已被 AddProfit/getitem 搬走的 item重複取得。
- 成功直接移入 Player backpack；split branch使用既有 `sourceItemRuntimeAlloc()`，因此完整保留每份 66-field item-make RNG。
- no item也仍直接退出 raw target。
- Exit 本身不做 damage / Counter / kill reward。

### Regression

新增 `tools/check_v245_profession_plunder_runtime.mjs`，覆蓋：

- Skill 49 metadata / command support
- max-pile公式與 backpack surplus
- AddPile capacity failure不先 free
- direct existing transfer
- split 4/4/1 fixture與 original end ordering
- battle slot -> item slot scan order
- dead raw target可執行
- EarthRound raw target拒絕
- loot owner可不同於 raw target
- detach before raw-target exit
- dispatcher位於 generic dead-target gate之前
- V2.45 marker
- save schema 30

save schema 維持 **30**。


---

## V2.46 Skill 56 Docile / capture Work

V2.46 接入獵人 Skill 56「馴服寵物」／`PROFESSION_DOCILE` 的 fixed `BATTLE_MultiCaptureUp -> CHAR_WORKMODCAPTURE -> BATTLE_CaptureCheck` lifecycle。

### Runtime row

- Skill ID 56
- MP 10
- TARGET 1 / OTHER
- KIND 2
- option `倍%2|次%2|攻%2|效%1`
- command `BATTLE_COM_S_DOCILE`

### Assist calculation

`battle_profession_assist_fun()` 不解析 row 的倍／次／攻欄位；DOCILE 明確：

`tier = PROFESSION_CHANGE_SKILL_LEVEL_A(displayLevel)`

`power = tier*2 + 10`

即 tier 0..10 對應 10..30。

### MultiCaptureUp target gate

`BATTLE_MultiCaptureUp()` 先建 ToList，再逐項只接受：

- `CHAR_WHICHTYPE == CHAR_TYPEPLAYER`
- `CHAR_ISDIE == FALSE`

TARGET_OTHER 的 protocol enum包含 self；目前 Web 只有 Player bid 0，因此 live DOCILE 自動把 selectedToNo 指向 0。對非 Player direct slot 的 source executor會保留 NoEffect，而不是錯誤給 Enemy 加捕獲率。

### RAND macro / Work accumulation

每個有效 Player：

`UpPoint = RAND(power*0.9, power*1.1)`

fixed util.h RAND macro 的 x/y 可為 fractional；內層 `(int)` 與最後 `int UpPoint` 是兩個截斷邊界。Web 使用 `sourceCRandMacroValue(power*.9,power*1.1)` 後再 `Math.trunc`。

之後：

`CHAR_WORKMODCAPTURE += UpPoint`

沒有 turn counter；同場多次施放直接累加。

### CaptureCheck / reset

既有 V0.91 fixed float pipeline現在把 `captureMod` 由 0 改讀 `battlePlayerCaptureMod`：

`raw = workSum*charm/50 + captureMod + sleepBonus`

並保留 `raw > 99 -> 99`、strict `RAND(1,100) < raw`。

`BATTLE_Capture()` 在 item/capture check 後無條件清 `CHAR_WORKMODCAPTURE=0`。V2.46 對齊成：Player 真正到 capture command 時，先以當下 modifier算 chance，接著清 0，再判成功／失敗。Status/C_WAIT 等未執行 capture case 的路徑不提前清。

Battle Entry 初始化的原 C 也把 Work 清 0；Web `resetBattleStatuses()` 同步歸零。這是 battle-local transient，不改 save schema。

### Regression

新增 `tools/check_v246_profession_docile_runtime.mjs`：

- Skill 56 metadata / command support
- tier 0/5/10 => power 10/20/30
- fractional 0.9/1.1 RAND macro input + final int truncation
- self Player bid 0 applied / Enemy direct slot NoEffect / dead Player NoEffect
- repeated cast accumulation
- dispatcher before generic same-side reject
- live selectedToNo 0 only for DOCILE
- CaptureCheck reads battlePlayerCaptureMod
- real capture execution clears modifier before success RNG
- resetBattleStatuses clears modifier
- V2.44/V2.45 historical markers remain
- V2.46 marker
- save schema 30

save schema 維持 **30**。


---

## V2.47 Skill 57 Enrage Pet

V2.47 接入 Skill 57「激怒寵物」／`PROFESSION_ENRAGE_PET`。

### Source command shape

- MP 13
- TARGET 1 / OTHER
- KIND 2
- option `攻%20|防%10|倍%2|效%1|回%3`
- command `BATTLE_COM_S_ENRAGE_PET`

`battle.c` 對此 command 不跑一般 same-side reject；`battle_profession_attack_fun()` 反而要求 `BATTLE_CheckSameSide(...) == 1`。

### Zero-attack AttackSeq

fixed case先 `WORKATTACKPOWER=0`，但仍對原 raw target跑 `BATTLE_AttackSeq()`。之後：

`if(target.HP <= calculatedDamage) damage = 0`

所以它不是固定 0 傷害；0 AttackPower 仍可能經 fixed damage/critical/minimum-damage流程得到正值，只在致死時才整段壓回 0。

主人攻擊自己的 Pet 仍在 AttackSeq早期吃 `AI_FIX_SEKKAN=-200` variable-AI/忠誠修正；Dodge/MISS也不能跳掉。

profession helper對 ENRAGE_PET 把 DamageReact 清成 0，且沒有 ordinary SUITPOISON / Counter。Web對 shared physical apply新增 opt-in `suppressDamageReact`，只在這條來源路徑啟用。

### Buff write

AttackSeq / DamageSub後重新讀 raw COM2。只有 target type PET才：

`MYSKILLSTRPOWER = tier*2+10`

`MYSKILLSTR = tier>=10 ? 5 : tier>=5 ? 4 : 3`

OTHER 可以包含 Player；對 Player raw target會執行前段攻擊但不寫 Buff。

### Shared MYSKILLSTR lifecycle

Web新增 battle-local Pet STR Work mirror：

- ENRAGE_PET覆蓋同 Pet 的 SetMagicPet STR raw Work。
- SetMagicPet TGH/DEX可並存。
- active ENRAGE_PET STR會進 SetMagicPet busy gate。
- raw STR power在 turn expiry後保留 stale value，battle reset才清。

PreCommand先 snapshot ENRAGE_PET STR，再處理 SetMagicPet TGH/DEX。Pet battle view依 fixed bug用 saved FIXTOUGH作 STR add 基底：

`attack += trunc(fixedTough * strPower / 100)`

之後才 Vary / WEAKEN。

Pet 自己進 StatusSeq時先倒數 profession Pet STR，再倒數其餘 SetMagicPet狀態。新 Buff若在同輪 Pet行動前才被寫入，會先消耗一回合但不 retroactively改本輪能力。

### Regression

新增 `tools/check_v247_profession_enrage_pet_runtime.mjs`，覆蓋 metadata、support、live bid 5、same-side dispatcher、power/turn formulas、shared raw Work overwrite/coexist/busy、PreCommand/StatusSeq ordering、zero AttackPower、lethal suppression、DamageReact/SUITPOISON suppression、owner→Pet physical apply hook、歷史 V2.41/V2.44/V2.45/V2.46 markers、V2.47 marker與 schema 30。

save schema 維持 **30**。


---

## V2.48 Skill 58 fixed bind + Skills 59～61 Resist

### Skill 58 fixed data bug

`profession.txt` row 58「自给自足」固定写 `func=PROFESSION_ENRAGE`，不是 `PROFESSION_AUTARKY`。

`PROFESSION_AUTARKY` dispatch entry虽然存在，但 callback只 `return TRUE`，且 fixed row未引用。Web不按技能名称脑补制作材料系统；row 58继续复用已完成的 ENRAGE lifecycle。

### Resist rows

- 59 `PROFESSION_RESIST_THUNDER` / `雷|成%100|回%3`
- 60 `PROFESSION_RESIST_FIRE` / `火|成%100|回%3`
- 61 `PROFESSION_RESIST_ICE` / `冰|成%100|回%3`

三笔均 MP 14 / TARGET MYSELF / KIND 2。

### `_PROFESSION_ADDSKILL` self override

fixed callback在三种 RESIST command下直接：

`defNo2 = BATTLE_Index2No(battleindex, charaindex)`

所以 pinned build不会进入旧版 tier5 row / tier10 side-wide target expansion。Web executor忽略 request target作为效果目标，并明确回报 `forcedSelfByProfessionAddskill`。

### StatusAttackCheck

每次先 `RAND(1,100)`，再 early-return gate。Success=`100+tier*4`，判定 strict `<`。

tier0因此只有 roll 1..99成功；tier1+ threshold >100，在无 StatusTbl 冲突时必成。

Web将 profession resist StatusTbl mirror接进 `battleHasAnyStatus()`，因此 active/ghost RESIST会阻止普通 status apply/chance，普通 status也会阻止 RESIST。

### Work and countdown

成功：

`upValue=tier+10`

`WORKMODRESIST_attr=upValue`

`WORK_attr_RESIST=old+upValue`

`storedTurns=(tier>=10?5:tier>=5?4:3)+1`

Player own StatusSeq：

- stored 4/5/6逐次 --cnt。
- cnt降到1时先从 WORK resistance减回 stale MOD，effectActive=false。
- counter=1仍视为已有 StatusTbl，形成一回 ghost lock。
- 下次 1→0 才清 status mirror。
- MOD raw Work不在 expiry清零，只在 battle reset或下次同 attr write覆盖。

### Profession magic field bridge

`sourceProfessionPlayerResistForMagicType()`固定：1 fire / 2 thunder / 3 ice，对齐 source `PROFESSION_MAGIC_GET_DAMAGE`/`PROFESSION_MAGIC_DODGE`，不污染普通四属性 magicResist runtime。

### Regression

新增 `tools/check_v248_profession_resist_runtime.mjs`，覆盖 Skill58 source bind、59～61 rows、support/dispatcher、strict StatusAttackCheck顺序、self override、status exclusivity、tier/up/turn math、ghost counter/stale MOD、magic-type mapping、battle reset、历史 markers与 schema 30。

save schema 維持 **30**。


---

## V2.49 Skill 62 Oblivion

Skill 62 fixed row：`PROFESSION_OBLIVION` / MP 21 / TARGET OTHER / `忘|成%100|回%3`。

- A-tier success = `100+tier*4`，仍是先 RAND(1,100) 再 early-return、strict `roll < threshold`。
- duration tier 0～4/5～9/10 = 2/3/4，StatusTbl stored counter = 3/4/5。
- `MODOBLIVION=max(1,trunc(tier/2))`；client Y-list 的實際遮蔽 budget = `MODOBLIVION+1`。
- CHAR_makeStatusString('y') 對每個有效 PetSkill 都先 RAND(0,100)；`<=60` 且 skill ID !=1 才遮蔽。即使 budget 已耗盡，有效槽仍會消耗 RNG。
- 遮蔽只把 client 欄位改成 FIELD_MAP=2 / TARGET_NONE=5，不刪除 PetSkill；server RANDOMACT 不讀 OBLIVION，所以不額外封鎖低忠誠 Pet AI。
- StatusSeq decrement 後 cnt<=1 就清 OBLIVION 並恢復 W-list；battle exit/reset 也強制恢復。
- callback 無 Pet type gate；CHAR_TYPEENEMY 可得到 StatusTbl，但不自行發明 Enemy skill silence。

新增 `tools/check_v249_profession_oblivion_runtime.mjs`。save schema 維持 **30**。


---

## V2.50 Skill 66 Nature Resist

Skill 66 `PROFESSION_RESIST_F_I_T` 已接入 fixed `_PROFESSION_ADDSKILL` runtime。

- row：`抗|成%100|回%3`、TARGET NONE、KIND 3。
- 實際 MP 走既有 `PROFESSION_MAGIC_COST_MP` dynamic branch：M-tier 對應 5／10／15／20，不採 row 14。
- callback 強制 self。
- StatusAttackCheck 仍先 RAND(1,100)，但 FIT special branch 完全忽略 roll／普通 StatusTbl，只檢查 RESIST_F/I/T 是否已存在。
- 成功時同時建立 F/I/T 三個 counter，不建立額外 combined counter。
- duration 重新讀 raw display level：<=80 / >80 / >=100 => stored 4 / 5 / 6。
- upValue 同樣錯讀 raw display level：Lv1..9 => 2..18，Lv10+ 固定 20。
- 三個 counter 同步倒數；降到 1 時先回收三抗，counter 1 ghost lock 再留一個 own action；MOD 保持 stale 到 battle reset/rewrite。
- raw COM2 EarthRound gate 發生在 forced-self 之前，explicit protocol fixture 保留此來源順序。

新增 `tools/check_v250_profession_nature_resist_runtime.mjs`。save schema 維持 **30**。


---

## V2.51 Skill 67 Call Nature

- 接入 `PROFESSION_CALL_NATURE` / `BATTLE_COM_S_CALL_NATURE`。
- 實際 MP 走既有 dynamic cost：固定 50，不採 row 14。
- raw display level 治療總池：500 / 1000 / 2000 / 2500 / 3000 / 3500 / 4000 / 4500 / 5000。
- TARGET ALL_MYSIDE 正常解析為 defNo 20；重用 source-backed MultiList，只計算活著且可鎖定的同側 Battle Entries。
- 現版無正式 CHAR_RIDEPET，因此每個 Player/active Pet Entry 各算 1 份，不把 active Pet 當 mount。
- `addhp=trunc(totalPool/count)`；實際 HP clamp 到 maxHP，但 protocol raw heal 仍保持 addhp。
- defNo 20/25/26 時 img1 覆寫 101772；img2 依 addhp 選 100601/100602/100603。
- 治療 Pet 時沿用 battle recovery flag：AI_FIX_PETRECOVERY +10 每場每 Pet 最多一次。
- 保留 `ridepet=-1` 在 C ternary 仍為 true 的 packet `p=addhp` bug；只記錄 protocol，不新增虛構騎寵。

新增 `tools/check_v251_profession_call_nature_runtime.mjs`。save schema 維持 **30**。


---

## V2.52 Skill 68 Earth Boundary

- 只開 Skill 68 `地结界 / PROFESSION_BOUNDARY`；69～72 共函式仍維持 unsupported。
- dynamic MP：M-tier <=6 / 7..9 / 10 => 10 / 15 / 20；row 14 不作 live cost。
- turn 走 A-tier：0..4=1、5..8=2、9=3、10=5；來源中的 >9=>4 分支不可達。
- power 再讀 raw display：20 / 30 / 40 / 50 / 60 / 70 / 80 / 90 / 100。
- 每個 target 先清四結界，再寫 earth MAKE2VALUE(power,turn)。
- 物理 DamageCalc：AttrAdjust 後、OtherDamage 前；stored power 只作 active flag，真正減傷 = attacker earth / 200。
- profession magic 不讀 boundary；critical bonus 在 DamageCalc 後追加，因此不吃 boundary reduction。
- boundary low 在該 actor command 後遞減；low=0 仍 active，0->-1 才清。
- target=20 右側地結界 img2 101786；img1 101697。

新增 `tools/check_v252_profession_earth_boundary_runtime.mjs`。save schema 維持 **30**。


---

## V2.53 Skill 69 Water Boundary

- 接入 Skill 69 `水结界 / PROFESSION_BOUNDARY`；68/69 live，70～72 仍 unsupported。
- TARGET ALL_MYSIDE -> Player pseudo target 20；dynamic MP 與 Skill 68 相同為 10 / 15 / 20。
- 共用 V2.52 A-tier turn 與 raw display power；每個 target 先清四結界，再寫 water `MAKE2VALUE(power,turn)`。
- physical `BATTLE_DamageCalc()` 仍是 AttrAdjust -> boundary -> OtherDamage；water active 時真正減傷 = attacker water / 200，stored power 只作 active flag。
- profession magic 不讀 boundary；critical bonus 不吃 boundary reduction。
- 共用 post-command low--；low=0 仍 active，0->-1 才清。
- row img2 101777；Player-side target 20 由 fixed GET_IMG2 覆寫成右側水結界 101774；img1 101697。

新增 `tools/check_v253_profession_water_boundary_runtime.mjs`。save schema 維持 **30**。


---

## V2.54 Skill 70 Fire Boundary

- 接入 Skill 70 `火结界 / PROFESSION_BOUNDARY`；68～70 live，71～72 仍 unsupported。
- TARGET ALL_MYSIDE -> Player pseudo target 20；dynamic MP 10 / 15 / 20。
- 共用 A-tier turn 與 raw display power；每個 target 先清四結界，再寫 fire `MAKE2VALUE(power,turn)`。
- physical boundary chain 維持 earth -> water -> fire -> wind；fire active 時真正減傷 = attacker fire / 200，stored power 只作 active flag。
- profession magic 不讀 boundary；critical bonus 不吃 boundary reduction。
- 共用 post-command low--；low=0 仍 active，0->-1 才清。
- row img2 101783；Player-side target 20 由 fixed GET_IMG2 覆寫成右側火結界 101780；img1 101697。
- V2.52 / V2.53 current-runtime support assertions同步更新為 68/69/70 true、71/72 false。

新增 `tools/check_v254_profession_fire_boundary_runtime.mjs`。save schema 維持 **30**。


---

## V2.55 Skill 71 Wind Boundary

- 接入 Skill 71 `风结界 / PROFESSION_BOUNDARY`；68～71 live，72 仍 unsupported。
- TARGET ALL_MYSIDE -> Player pseudo target 20；dynamic MP 10 / 15 / 20。
- 共用 A-tier turn 與 raw display power；每個 target 先清四結界，再寫 wind `MAKE2VALUE(power,turn)`。
- physical boundary chain 維持 earth -> water -> fire -> wind；wind active 時真正減傷 = attacker wind / 200，stored power 只作 active flag。
- profession magic 不讀 boundary；critical bonus 不吃 boundary reduction。
- 共用 post-command low--；low=0 仍 active，0->-1 才清。
- row img2 101795；Player-side target 20 由 fixed GET_IMG2 覆寫成右側風結界 101792；img1 101697。
- V2.52～V2.54 current-runtime support assertions 同步更新為 68～71 true、72 false。

新增 `tools/check_v255_profession_wind_boundary_runtime.mjs`。save schema 維持 **30**。

---

## V2.56 Skill 72 Break Boundary

- 接入 Skill 72 `破除结界 / PROFESSION_BOUNDARY`；68～72 現在都走 fixed `BATTLE_COM_S_BOUNDARY`。
- 破結界 dynamic MP 依 M-tier：1～2=5、3～4=10、5～8=15、9～10=20；不直接採 row 10。
- fixed boundary case 在任何 option 分支前都先 `RAND(1,100)`。V2.56 同步修正 Skill 68～71：一般結界也會消耗這顆 unused RNG，且順序在 `BATTLE_MultiList()` 前。
- Skill 72 破除率讀 raw display level：≤20=50%、21～40=60%、41～80=70%、81～99=80%、≥100=100%；成功條件為 `roll <= chance`。
- 破結界先把 raw defNo 強制成整側：`defNo<10 ? 20 : 21`，再做 MultiList。正常 Player 對 Enemy 直接目標會處理整個 Enemy side。
- 成功：`loop=4 / power=0 / turn=0`，清 EARTH/WATER/FIRE/WIND 四個 boundary Work；失敗：`loop=0`，原結界完全不動。
- source 仍先計算一般 boundary power/turn，再於成功時覆寫為 0；失敗時保留計算但不寫入 boundary。
- 動畫參數使用強制後的 defNo2；Enemy side=21 保留 row img2 101771，side20 的 break fallback img2=101770。
- 新增 `tools/check_v256_profession_break_boundary_runtime.mjs`，並更新 V2.52～V2.55 historical regression 的 current support / unused RNG stub。

save schema 維持 **30**。

---

## V2.57 Skill 1 Volcano Springs

- 接入巫師 Skill 1 `火山泉 / PROFESSION_VOLCANO_SPRINGS`，首次把 V2.19 profession magic damage core 接進 live command。
- row：TARGET OTHER、KIND 1、option `火|0|1|0|0|0|0|0|0|50|0|-50`、img1 101697、row img2 101686。
- dynamic MP：M-tier 1～2=10、3～4=15、5～6=20、7～9=30、10=35。
- 新增 battle-local F/I/T profession magic proficiency Work。Skill18 Fire Practice 的 Work 公式為 tier<=5 ? tier*2 : (tier-5)*3+10，cap25；進戰與 source weapon-change Status_init 刷新，battle reset 清 0。
- `analysis_profession_parameter()` 先對 Fire Practice 跑 normal proficiency RNG；本次火山泉仍使用施法前已存在的 battle-entry Fire Work snapshot，不把剛增加的 raw passive proficiency 即時回填。
- Player 火山泉 Dex：`WORKQUICK+20 - RAND(0,(WORKQUICK+20)*0.2)`；使用 fixed fractional RAND macro。
- 執行 RNG 順序：MultiList → passive proficiency → GET_PRACTICE critical / M2 / variance → per-target magic dodge → damage → hit-only CHANGE_STATUS leading RAND。
- Enemy magic dodge 使用 non-Player branch：LV*0.15 cap20，再減 Fire Work*0.2；EarthRound early miss 仍在第一顆 dodge RNG 之後。
- Volcano power：tier*10+100；tier10 critical<=25，其餘 critical<=tier+12 時 ×1.5；之後沿用 M_POW、30% M2_POW、RAND(98,102) 與 Fire GET_DAMAGE。
- Current Web Enemy 不具 Player-only profession resist / suit / UNMPOWER Work，因此固定以 0 處理；不混入一般四屬 `magicResist[4]`。
- Magic hit 直接扣 HP，無 Guardian / DamageReact / ItemCrush / Counter；命中者在 spell tail 解除 Sleep。
- img2：tier1～4=101688、5～9=101687、10=101686；Player→Enemy direct target 使用 option token11/12 = 0/-50。

新增 `tools/check_v257_profession_volcano_springs_runtime.mjs`。save schema 維持 **30**。

---

## V2.58 Skill 2 SIGN

- 接入巫師 Skill 2 `针针相对 / PROFESSION_SIGN`；TARGET ALLOTHERSIDE，Player side 固定 pseudo target 21。
- dynamic MP：M-tier 1～7=5、8～10=10；row cost 10 只作 fallback。
- fixed `qsort(SortLoc)` 的 Enemy side 順序固定為 13,11,10,12,14,18,16,15,17,19；不使用 numeric 10→19。
- `_PROFESSION_ADDSKILL` 的 SIGN `TOLIST_SORT` 固定 get_num=10，因此一側最多 10 人時不再抽 target-selection RNG。
- option `无` => magic_type=-1，不提升 F/I/T Practice；GET_DAMAGE 保持無屬性 power。
- GET_PRACTICE：tier1～3=50 HP power / 10 MP power、4～6=100/15、7～9=150/20、10=200/30；HP power 繼續走 M_POW / 30% M2 / 98～102。
- magic dodge：先 Enemy LV*0.15 cap20 的 base roll；base hit 後 SIGN 再 `RAND(1,100)<50`，所以 50 為 miss。
- 每個 hit 的 CHANGE_STATUS 固定先吃 unused `RAND(1,100)`，再 `RAND(0,100)<10`：tier9+ 累加完整 attvalue + mp_power，tier8 累加 int(attvalue/2)，tier<=7 無回復。
- 所有 target 完成後先跑 hit/alive/non-Pet 的 enemy MP drain，再一次套用 caster HP/MP。Current fixed Enemy MP/MAXMP=0，因此 PVE drain 通常為 no-op。
- `_PROFESSION_ADDSKILL` 把 target-side SIGN status 舊分支編譯排除；不新增吸血狀態。
- spell tail 只喚醒 hit target；miss target 不寫 def_be_hit，因此不 wake。
- Skill 2 Dex 明確固定為 `WORKQUICK+20 - RAND(0, work*0.3)`。
- img1 101697 / img2 101633；attIdx=2 whole enemy side。

新增 `tools/check_v258_profession_sign_runtime.mjs`。save schema 維持 **30**。

---

## V2.59 Skill 3 DOOM

- 接入巫師 Skill 3 `世界末日 / PROFESSION_DOOM`；TARGET ALLOTHERSIDE，Player side 使用 pseudo target 21。
- dynamic MP：M-tier 1～4=50、5～8=100、9～10=150。
- fixed DOOM／FIRE_SPEAR 集氣 no-action 判斷整段被註解，不實作蓄力回合。
- qsort 後 Enemy side 順序沿用 fixed SortLoc：13,11,10,12,14,18,16,15,17,19。
- TOLIST_SORT 目標數：tier1～2=2、3～4=4、5～6=6、7=8、8～10=10。抽子集時保留 RAND(0,listidx-1) rejection loop，重複抽到已寫成 -1 的位置仍耗 RNG。
- option `无` => magic_type=-1，不提升 F/I/T Practice。
- GET_PRACTICE base power：tier1～2=200、3～4=250、5～6=300、7=350、8=400、9=450、10=550；之後沿用 M_POW / 30% M2 / 98～102。
- DOOM magic dodge：先 base Enemy dodge，再 `RAND(1,100)<90`；90 本身是 miss。
- 每個 hit 在 damage core 後仍由 self CHANGE_STATUS 固定消耗 leading `RAND(1,100)`；DOOM 無 self-status case。target-side DOOM CHANG_STATUS 舊實作整段註解，不自行新增。
- tier10 post-loop：只對 hit 且傷害後仍存活目標直接寫 `CHAR_WORKFEAR=4`。Fear 獨立於一般 StatusChange，可與普通異常並存。
- FEAR 每個 actor 自己的 StatusSeq 4→3→2→1→0；PreCommand compliance 在 active 時，於 SetMagicPet 後、WEAKEN 前減 saved base 的攻10%／防10%／敏20%。
- 施放當下 -10/-10/-20 僅為原封包顯示；不把已建立的當輪 WORK 即時永久扣值。
- DOOM Dex：`WORKQUICK+20 - RAND(0.3, work*0.6)`，保留 fractional lower bound。
- 動畫：Enemy side=21 row img2 101640 / x320 y240；right pseudo 20 使用 img2 101639。
- CI trigger 同步加入 `tools/check_v259_profession_doom_runtime.mjs`，避免 regression-only fix 不觸發 Actions。

新增 `tools/check_v259_profession_doom_runtime.mjs`。save schema 維持 **30**。
---

## V2.60 Skill 4 ICE_CRACK

- 接入巫師 Skill 4 `冰爆术 / PROFESSION_ICE_CRACK`，但依 pinned fixed source 保留為 dead-queue NoAction，而不是復活 dormant 冰爆傷害。
- row：TARGET ALLOTHERSIDE、KIND 1、option `冰|1|1|320|240|2700|3800|0|320|240`、img1 101697、img2 101651。
- dynamic MP：M-tier 1～2=30、3～4=40、5～6=50、7～8=60、9=70、10=80。
- EntrySort 的專用 Dex 仍實際執行：`WORKQUICK+20 - RAND(0, work*0.5)`。
- battle command switch 的 live `_PROFESSION_ADDSKILL` branch 只寫 `pBattle->ice_*`：use=TRUE、bout=2、toNo、raw level、skill array、charaindex、attackNo；接著 COM1=NONE、BATTLE_NoAction、break。
- 唯一會遞減 `ice_bout` 並在 0 時呼叫 `battle_profession_attack_magic_fun()` 的 queue executor 整段被 `/* ... */` 註解，fixed build 不會執行。
- 因此 live Skill 4 不會進 analysis / Ice Practice passive level-up / GET_PRACTICE / magic dodge / CHANG_STATUS / delayed damage。
- Dormant CHANG_STATUS 仍可看到 `RAND(0,100)<100`、10 個 ICECRACK Work 槽與延遲整側爆炸，但正常 Skill 4 path 不可達。
- Dormant 第 2～10 槽的 `WorkIceCrackPlay()` 又把已歸零的 countdown Work 當 damage value，故即使單獨看死碼也只有 primary slot 有真正爆炸路徑；V2.60 不「修正」這段不可達 source bug。
- CI path/step 加入 `tools/check_v260_profession_ice_crack_runtime.mjs`，鎖住 no dormant resurrection。

新增 `tools/check_v260_profession_ice_crack_runtime.mjs`。save schema 維持 **30**。


---

## V2.61 Skill 5 ENCLOSE / ANNEX

- 接入巫師 Skill 5 `附身术 / PROFESSION_ENCLOSE`。
- 無屬性 profession magic：`magic_type=-1`，不提升 F/I/T Practice；傷害保持 `power`。
- dynamic MP：M-tier 1～4=50、5～7=60、8～9=70、10=80。
- GET_PRACTICE：1～4=150、5～7=200、8～9=250、10=400；保留來源不可達的 `>9 => 300` 分支語意。
- Dex：`WORKQUICK+20 - RAND(work*0.2, work*0.5)`。
- hit 後先消耗 `PROFESSION_MAGIC_CHANGE_STATUS` 的 leading `RAND(1,100)`；再掃 StatusTbl。目標已有狀態時不抽 ANNEX success RNG。
- ANNEX success 讀 raw display level，判定 `RAND(0,100) <= success`；stored round 為 1/2/3。
- fixed `BATTLE_StatusSeq` 會先 `--cnt`，再進 `CHAR_WORKANNEX` switch，所以 stored 1/2/3 實際強制普通攻擊 0/1/2 次。
- 每個有效 ANNEX tick 固定消耗 side `RAND(0,1)` + pos `RAND(0,9)`，沒有 CONFUSION 的 80% gate；COM2 找不到時保留 -1 交給後續普通 ATTACK / TargetAdjust。
- ANNEX visual 仍沿用 `BATTLE_ST_CONFUSION`，但 runtime 狀態獨立保存。
- 新增 `tools/check_v261_profession_enclose_runtime.mjs`。
- save schema 維持 **30**。


---

## V2.62 Skill 6 SUMMON_THUNDER

- 接入巫師 Skill 6 `召雷术 / PROFESSION_SUMMON_THUNDER`。
- option `电|0|1|0|0|0|0|0` → `magic_type=3`。
- MP：M-tier 1～2=10、3～4=20、5～7=25、8～10=30。
- GET_PRACTICE：`M-tier*10+200`；保留 unused critical RNG。
- Dex：`WORKQUICK+20 - RAND(0, work*0.2)`。
- analysis 先跑 Thunder Practice proficiency；本次 cast 仍沿用 battle-entry proficiency snapshot。
- 保留 fixed source type-3 欄位 bug：DODGE 用 Thunder proficiency，但 GET_DAMAGE 用 Ice proficiency/resist path。
- 保留 `CHAR_WORKWATER > 0` 特例：`RAND(1,100) < 75` 時，在 UNMPOWER／GET_DAMAGE 前把 power ×3；無 Water 時不抽這顆 RNG。
- 命中後保留 `PROFESSION_MAGIC_CHANGE_STATUS` 的 leading `RAND(1,100)`。
- 新增 `tools/check_v262_profession_summon_thunder_runtime.mjs`。
- save schema 維持 **30**。


---

## V2.63 Skill 7 STORM / WATER

- 接入巫師 Skill 7 `暴风雨 / PROFESSION_STORM`。
- option `冰|1|0|320|240|1500|4500|0|320|240|` → `magic_type=2`。
- MP：M-tier 1～2=30、3～4=35、5～6=40、7～8=45、9～10=50。
- GET_PRACTICE：1～3=120、4～5=140、6～7=160、8～9=180、10=200。
- Dex：`WORKQUICK+20 - RAND(work*0.2, work*0.5)`。
- analysis 先跑 Ice Practice；當前 cast 保留 battle-entry proficiency snapshot。
- fixed type-2 mismatch：DODGE 用 Ice proficiency；GET_DAMAGE 用 Thunder proficiency/resist path。
- STORM magic dodge 另有第二顆 `RAND(1,100) < 75` 命中 gate。
- TOLIST_SORT 實際取 M-tier 個目標；SortLoc 後以 index rejection sampling 隨機取不重複 slot，重複 index 會白吃 RNG。
- Water StatusAttackCheck 固定先抽 RNG，再檢查死亡／既有 StatusTbl；`roll < 30` 才成功。
- Water count：1～3=1、4=2、5～6=3、7～8=4、9～10=5；在目標自己的 StatusSeq 先減 1。
- Water 納入 `battleHasAnyStatus()`／附身 busy check，並直接供 V2.62 召雷術的 `professionWaterTurns` 讀取。
- 新增 `tools/check_v263_profession_storm_runtime.mjs`。
- save schema 維持 **30**。


---

## V2.64 Skill 8 CURRENT

- 接入巫師 Skill 8 `电流术 / PROFESSION_CURRENT`。
- MP：M-tier 1～2=30、3～4=40、5～6=50、7=60、8=70、9=80、10=100；來源 `>9 =>90` 分支不可達。
- GET_PRACTICE：tier1=50、2～4=10、5～7=150、8～9=200、10=300；來源 `>9 =>250` 不可達。
- Dex：`WORKQUICK+20 - RAND(0, work*0.5)`。
- ENEMY_ALL 先 SortLoc，再以與 STORM 相同的 rejection sampling 隨機取 M-tier 個目標。
- type=3 DODGE 用 Thunder proficiency，且 CURRENT 額外要求第二顆 `RAND(1,100) < 75`；GET_DAMAGE type=3 仍誤讀 Ice proficiency/resist。
- Water 導電沿用 V2.62/V2.63 live Work：Water>0 才抽 RNG，`roll<75` 時在 UNMPOWER/GET_DAMAGE 前 power ×3。
- 命中後保留 `PROFESSION_MAGIC_CHANGE_STATUS` leading RNG。
- 修正 ENCLOSE/SUMMON_THUNDER/STORM 回傳 animation metadata 的 source `attIdx`：單體0／全體2。
- 新增 `tools/check_v264_profession_current_runtime.mjs`。
- save schema 維持 **30**。


---

## V2.65 Skill 9 FIRE_BALL

- 接入巫師 Skill 9 `火星球 / PROFESSION_FIRE_BALL`。
- ONE_ROW client mapping：敵方 10～14→23、15～19→24；MultiList 可在空排時 23↔24 fallback。
- MP：M-tier 1～2=30、3～4=35、5～6=40、7～8=45、9～10=50。
- GET_PRACTICE：1～2=160、3～4=180、5～6=220、7=260、8=280、9=320、10=360。
- Dex：`WORKQUICK+20 - RAND(0, work*0.5)`。
- analysis 先跑 Fire Practice；當前 cast 仍使用 battle-entry proficiency snapshot。
- source 先 SortLoc，但 FIRE_BALL TOLIST_SORT 會丟掉原 list，再依 final row toNo 重建活目標；逐目標順序固定 battle slot 升冪。
- animation `attIdx=1`；23/24 使用 img2=101693 且座標分別 (250,180)/(350,260)。
- type1 DODGE/GET_DAMAGE 都走 Fire 路徑，無第二層命中 gate。
- 新增 `tools/check_v265_profession_fire_ball_runtime.mjs`。
- save schema 維持 **30**。


---

## V2.66 Skill 10 BLOOD_WORMS

- 接入巫師 Skill 10 `嗜血蛊 / PROFESSION_BLOOD_WORMS`。
- MP：M-tier 1～4=5、5～9=10、10=15；GET_PRACTICE=`tier*10+20`。
- Dex：`WORKQUICK+20 - RAND(0, work*0.3)`；無屬性 magic_type=-1。
- 命中後保留 CHANGE_STATUS leading RNG，再依 direct damage 立即回施術者 HP：5%／10%／15%／20%。
- CHANG_STATUS 先掃 StatusTbl；busy 時不掛蠱，free 時直接掛，沒有 success RNG。
- duration：tier1～4=2、5～7=3、8～9=4、10=5 active ticks，Work stored count=active+1。
- 保留 double-M bug：MODBLOODWORMS 儲存已轉換 tier，StatusSeq 再 M-convert => 每個持續 tick 固定 tier1，40 damage + 2 HP caster heal。
- BloodWorms 直接進 `battleStatuses`，StatusSeq pre-decrement 後 tick；死亡 tick 仍完成 caster heal。
- generic `battleHasAnyStatus()` 補入 Doom Fear，對齊 fixed StatusTbl collision。
- 新增 `tools/check_v266_profession_blood_worms_runtime.mjs`。
- save schema 維持 **30**。


---

## V2.67 Skill 11 BLOOD

- 接入巫師 Skill 11 `嗜血成性 / PROFESSION_BLOOD`。
- TARGET NONE → 正常 client 強制 self battle slot；非 self BLOOD 封包在 fixed C 屬異常斷線路徑，Web 保留 no-action。
- MP cost=0；沒有 dynamic cost override。
- GET_PRACTICE：HP>1 時 `currentHP*(tier*5+10)/100`，再套 M_POW／30% M2_POW／98～102% variance；HP<=1 時基底 0。
- Dex：`WORKQUICK+20 - RAND(0, work*0.3)`。
- 保留 self magic-dodge：`magic_type=-1` 導致 player resist index 錯讀 `CHAR_WORK_I_PROFICIENCY`，threshold=`Luck*3 + IceProf*0.5 + EQUITQUIMAGIC*0.4`。
- 自己的 UN_POW_M 先降低 sacrifice power，再進無屬性 GET_DAMAGE。
- CHANGE_STATUS leading RNG 後，MP restore rate 為 40/45/50/55/60%；順序是先算 add_mp、再扣 self HP、最後 apply MP，因此 self-death 後仍可回 MP。
- BLOOD 動畫 tier 圖：101692 / 101691 / 101690 / 101689；固定走 CHANG_IMG2 option 9/10 座標。
- 新增 `tools/check_v267_profession_blood_runtime.mjs`。
- save schema 維持 **30**。


---

## V2.68 Skill 12 ICE_ARROW

- 接入巫師 Skill 12 `冰箭术 / PROFESSION_ICE_ARROW`。
- MP：M-tier 1～3=10、4～7=15、8～10=20；GET_PRACTICE=tier1～9 `tier*10+130`、tier10=250。
- Dex：`WORKQUICK+20 - RAND(0, work*0.2)`。
- analysis 先跑 Ice Practice；當前 cast 沿用 battle-entry proficiency snapshot。
- type2 DODGE 用 Ice proficiency、無第二 gate；GET_DAMAGE type2 保留誤讀 Thunder proficiency/resist bug。
- target StatusTbl busy 時不消耗 ICEARROW success RNG；free 時 `RAND(0,100) <= 10/15/20/25` 才成功。
- ICEARROW decDex：10%／20%／25%；active ticks：1／2／3，stored count=active+1。
- fixed BATTLE_CanMoveCheck 的 ICEARROW 分支被註解，狀態不持續封鎖行動；PROFESSION_MAGIC_CHANG_STATUS 也不取消 current command。
- 每個 surviving StatusSeq tick 只乘 FIXDEX，WORKQUICK/已完成 EntrySort 不重算；下一輪 compliance 再重建 FIXDEX，保留來源的近乎無效 slow 行為。
- animation：left img2=101648 (10,-20)，right img2=101649 (10,20)，attIdx=0。
- 新增 `tools/check_v268_profession_ice_arrow_runtime.mjs`。
- save schema 維持 **30**。


---

## V2.69 Skill 13 FIRE_SPEAR / shared DOOMTIME charge

- 接入巫師 Skill 13 `火龙枪 / PROFESSION_FIRE_SPEAR`。
- dynamic MP：M-tier 1～2=30、3～4=40、5～6=60、7～8=70、9～10=80；command receipt 即扣 MP。
- 新增 Player battle-local shared charge Work：FIRE_SPEAR `DOOMTIME=2`、DOOM `DOOMTIME=3`。
- actor pass 先 `--DOOMTIME`；歸零時同 pass 還原保存的 prepared command 並立即執行。Fire Spear 2→1→0，Doom 3→2→1→0。
- 修正 V2.59：DOOM release magic 原已完成，但先前 Web 漏掉 active outer DOOMTIME lifecycle；V2.69 補回，不改 V2.59 的 damage/fear executor。
- Guard/Capture 無法覆寫正集氣 command；DRAGNET 會依 fixed source 清除 Player charge。
- fixed FIRE_SPEAR Dex case（20%～50% jitter）仍保留，但正常 release round EntrySort 時 COM1 尚為 NONE，因此 live charged order 使用 default Dex。
- release 才跑 Fire Practice / GET_PRACTICE；power tier1～3=100、4～5=200、6=300、7=350、8=400、9=450、10=800。
- type1 Fire dodge 後另有 strict `RAND(1,100)<90`；roll 90 miss。GET_DAMAGE Fire 欄位一致。
- FIRE_SPEAR TOLIST_SORT 內容整段 commented，無額外 target-count / miss RNG。
- animation：enemy-side base img2=101641 (350,250)，toNo<10 才改 101642 (320,240)，attIdx=0。
- 新增 `tools/check_v269_profession_fire_spear_runtime.mjs`。
- save schema 維持 **30**。
