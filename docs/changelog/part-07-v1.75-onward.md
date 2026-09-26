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
