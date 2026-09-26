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
