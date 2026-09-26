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
