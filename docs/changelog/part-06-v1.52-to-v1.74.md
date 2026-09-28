## V1.52 Charge release / EarthRound0 common weapon loop

固定來源：`gavinlinasd/StoneAge@1f90cb6cb57c1df70f39cde77a5a8ccd98b66c56`。

### Source finding

`BATTLE_COM_S_CHARGE_OK` 與 `BATTLE_COM_S_EARTHROUND0` 都和 PowerBalance／Mighty／SpeedyAttack 一樣，
落入 battle.c 的普通 physical common direct-attack 群組。

兩者都不是獨立的「固定單擊」。

釋放回合在真正進 command switch 前已經完成：

1. `BATTLE_GetAttackCount(charaindex)`
2. FIST 有效武器的 `gDamageDiv = attack_max` 判定
3. `BATTLE_TargetListSet(..., aDefList)`
4. BOW 建 aBowW；非 BOW 以 raw COM2 填滿 aDefList

因此 V1.51 新建立的 common skill loop 同樣適用於這兩個 release command。

### Charge release

`BATTLE_Charge()` 到時間後把 command 改成 `BATTLE_COM_S_CHARGE_OK`，
並用「釋放回合」的 `WORKFIXSTR` 計算攻擊修正。

V1.52 保留既有：

`WORKATTACKPOWER = release FIXSTR + int(release FIXSTR * 攻% / 100)`

只修正後面的攻擊生命週期：

- 使用該釋放回合已 prime 的 `sourceAttackMax`
- 不重抽武器 AttackNum
- BOW / BOUNDTHROW / BREAKTHROW 沿既有完整 weapon helpers
- 非 BOW 每段重新從 raw COM2 做 `BATTLE_TargetAdjust`
- 手持 BOOMERANG 不轉特殊 BO row command

### EarthRound0 release

battle.c 在 `BATTLE_COM_S_EARTHROUND0` 進 common loop 前設定：

`gBattleDamageModyfy = 1.0 + 0.01 * COM3`

因此這個倍率不是只給第一擊，而是直到 common loop 結束前都維持。

V1.52：

- 每個 primary segment 都套相同 EarthRound damage multiplier
- multiplier 仍發生在 AttackSeq / GuardAdjust 後、`gDamageDiv` 前
- 有效 FIST AttackNum 的每段傷害仍在最後再除以 AttackNum
- BOW / throw 也沿同一 release-round AttackNum

### Command cleared to NONE

固定 C 在真正攻擊前：

```c
if (COM == BATTLE_COM_S_CHARGE_OK || COM == BATTLE_COM_S_EARTHROUND0)
    CHAR_setWorkInt(charaindex, CHAR_WORKBATTLECOM1, BATTLE_COM_NONE);
```

這造成一個重要 Counter 行為：

- 被攻擊方仍可以因這次 `BATTLE_Attack` 進 Counter
- 施術者此時 COM1 已是 NONE，因此不能在 Counter 鏈裡再反反擊

V1.52 繼續用 `unit.counterEligibleThisTurn=false` 保留這個來源行為。

### BOOMERANG

只有 plain `BATTLE_COM_ATTACK` 才在前置 switch 被轉成 `BATTLE_COM_BOOMERANG`。

`CHARGE_OK` / `EARTHROUND0` 都不會轉換，因此：

- 手持回力標時仍是 common non-BOW multi-segment
- 不做特殊 BO 全排攻擊
- throw weapon gate 仍會阻止 Guardian / Counter

### V1.52 regression targets

- game.js syntax PASS
- main parent fixed at V1.51 / 79ed01e35b0dc303c9f50ddb273fd31d6e201b74
- Charge release reuses current-turn primed sourceAttackMax
- EarthRound0 release reuses current-turn primed sourceAttackMax
- no duplicate BATTLE_GetAttackCount RNG
- non-BOW later segments rerun TargetAdjust from raw COM2
- EarthRound multiplier applies to every primary segment
- FIST gDamageDiv ordering remains multiplier-then-divisor
- skill BOOMERANG stays common non-BOW
- defender may Counter; Charge/EarthRound actor cannot counter-counter after COM1 becomes NONE
- existing charge/earth state timing unchanged
- schema 27 unchanged


## V1.53 StatusChange non-ranged common loop

固定來源：`gavinlinasd/StoneAge@1f90cb6cb57c1df70f39cde77a5a8ccd98b66c56`。

### Reachability check

先重新核對目前生成資料：

- `PETSKILL_Acupuncture` = skill 622
  - Enemy 2800 / 2801 有掛在第 3 技能槽
  - 兩者該槽權重都是 0
  - 目前 Enemy AI 不可達
- `PETSKILL_ShowMercy` = skill 626
  - 目前 `stoneage_enemy_ai.json` 沒有任何 Enemy 引用
  - 目前 Enemy AI 不可達

因此本輪不為 622 / 626 猜 runtime 行為。

相對地，`PETSKILL_StatusChange` 在現行 Enemy AI 有 217 個正權重技能槽引用，
是這一區真正高頻可達的 common-loop 缺口。

### Source finding

`BATTLE_COM_S_STATUSCHANGE` 位於普通 physical common direct-attack 群組。

來源在進 loop 前已完成：

1. `attack_max = BATTLE_GetAttackCount(charaindex)`
2. 有效 FIST 武器時設定 `gDamageDiv = attack_max`
3. `BATTLE_TargetListSet(..., aDefList)`
4. STATUSCHANGE 設定 `gBattleStausChange / gBattleStausTurn`
5. command 隨後改成普通 ATTACK，但狀態 global 保留到整個 common loop 結束

所以 STATUSCHANGE 不是「只打一擊、套一次狀態」。

### Per-segment order

每一次 `BATTLE_Attack()` 的來源順序是：

1. AttackSeq / DamageSub
2. `BATTLE_DamageWakeUp`
3. 若 `gBattleStausChange != -1`，執行 `BATTLE_StatusAttackCheck`
4. `BATTLE_ItemCrushSeq`
5. 返回 outer common loop
6. `++attack_count`
7. 若尚未達 `attack_max`，載入下一個 aDefList / TargetAdjust

V1.53 在 `sourceEnemyCommonNonRangedSkillSequence()` 新增 `afterHit` hook，
固定放在 Damage/WakeUp 完成後、ItemCrush 前。

STATUSCHANGE 使用該 hook，所以每個 primary segment 都獨立做狀態判定。

### Non-BOW / BOOMERANG

V1.52 前：

- BOW / BOUNDTHROW / BREAKTHROW 已經會跑完整 AttackNum
- 近戰與技能 command 下的 BOOMERANG 仍只打一段

V1.53 改為：

- 沿用本回合已 prime 的 `sourceAttackMax`
- 不重抽 `BATTLE_GetAttackCount`
- 每一段都從 raw COM2 重新做 `BATTLE_TargetAdjust`
- 原目標死亡／EarthRound hidden 才消耗 DefaultAttacker fallback RNG
- STATUSCHANGE + BOOMERANG 不轉特殊 BO row attack

### Guardian and status target

近戰打 Player 時，`BATTLE_AttackSeq` 先做 Duck，再做 Guardian substitution。

因此若忠犬代擋：

- 傷害落在忠犬
- STATUSCHANGE 也檢查／套在忠犬
- ItemCrush 同樣以實際 defindex 為準

V1.53 的 afterHit 使用 `enemyApplyDirectGuardianSkillHit()` 回傳的實際 targetDesc，
再執行狀態，最後才 ItemCrush。

### Counter mobility gate

STATUSCHANGE 的狀態是在 `BATTLE_Attack()` 返回前就已套上。

因此最後 primary hit 若成功讓實際目標進入不能行動的狀態，
外層 `BATTLE_Counter()` 不應開始。

V1.53 給 generic common helper 增加 `counterRules.requireCanMove`：

- 一般 Mighty / PowerBalance / Charge / EarthRound 不受影響
- STATUSCHANGE 使用此 gate
- Counter 仍只看最後一個 primary BATTLE_Attack 的 return / outer defNo

### Final-defNo groundwork

generic non-ranged helper現在也明確回傳 `sourcePostTarget`：

- 達 attack_max：保留最後實際 primary target
- 攻擊者死亡：保留最後 target
- TargetAdjust 失敗：清為 null

這與 V1.49 ranged final-defNo lifecycle 一致，供下一輪 BecomeFox / BecomePig 非遠距修正直接共用。

### V1.53 regression targets

- game.js syntax PASS
- main parent fixed at V1.52 / 9a0f70c792889f08f69773b3521cf37d310e923d
- ShowMercy 626 has no current Enemy AI reference
- Acupuncture 622 only appears at weight 0 for Enemy 2800 / 2801
- StatusChange has 217 positive-weight Enemy AI references
- non-ranged StatusChange reuses primed AttackNum without duplicate RNG
- every primary segment executes damage/wakeup -> status -> ItemCrush
- later segments rerun TargetAdjust from raw COM2
- skill BOOMERANG stays common non-BOW
- Guardian receives status before ItemCrush when it substitutes
- immobilized final actual target blocks outer Counter
- ranged StatusChange behavior remains on existing helpers
- schema 27 unchanged


## V1.54 BecomeFox / BecomePig non-ranged common loop

固定來源：`gavinlinasd/StoneAge@1f90cb6cb57c1df70f39cde77a5a8ccd98b66c56`。

### Reachable Enemy paths

目前生成的 Enemy AI 中：

- `PETSKILL_BecomeFox` skill 625：2 個正權重引用
  - Enemy 2462
  - Enemy 2463
- `PETSKILL_BecomePig`：
  - 正權重可達的是 skill 635「黑烏力化」
  - Enemy 2493，權重 1

雖然比 StatusChange 少，但都是現行可達路徑。

### Source common-loop behavior

`BATTLE_COM_S_BECOMEFOX` 與 `BATTLE_COM_S_BECOMEPIG` 都位於普通 physical common direct-attack 群組。

因此兩者在後置效果之前先完整執行：

1. 本回合已完成的 `BATTLE_GetAttackCount`
2. `BATTLE_TargetListSet`
3. 每個 primary `BATTLE_Attack`
4. `attack_count`
5. 後續 aDefList / TargetAdjust
6. common-loop Counter chain
7. 最後才進 BECOMEFOX / BECOMEPIG 的附加效果條件

V1.53 前，BOW／BOUNDTHROW／BREAKTHROW 已走完整 ranged loop；
近戰與技能 command 下的 BOOMERANG 仍透過 `performEnemyPrimaryAttack()` 固定只打一段。

V1.54 將兩個 handler 改為 `sourceEnemyCommonSkillAttack()`。

### Non-ranged AttackNum

近戰／技能 BOOMERANG 現在：

- 沿用 `actor.sourceAttackMax`
- 不重抽 `BATTLE_GetAttackCount`
- 有效 FIST AttackNum 繼續使用來源 `gDamageDiv = attack_max`
- 每個 later segment 都從 raw COM2 重新 `BATTLE_TargetAdjust`
- BOOMERANG 因原 command 不是 plain ATTACK，不轉特殊 BO row attack

### Final defNo

V1.53 generic helper 已補 `sourcePostTarget`：

- 達 `attack_max`：保留最後一次真正 primary BATTLE_Attack 的 outer defNo
- 攻擊者在 primary 後死亡：同樣保留最後 defNo
- later TargetAdjust 失敗：source defNo 已變成無效值，因此 `sourcePostTarget=null`

V1.54 的 BecomeFox／BecomePig 直接沿用這個狀態。

這和 V1.49 已完成的 ranged final-defNo lifecycle 對齊。

### Counter does not overwrite Battle_Attack_ReturnData

本輪另外重新核對固定原 C 的 `BATTLE_Counter()`：

它沒有呼叫 `BATTLE_Attack()`，而是直接執行：

- `BATTLE_CounterCheck`
- `BATTLE_AttackSeq`
- `BATTLE_DamageSub`
- `BATTLE_ItemCrushSeq`

因此 common-loop Counter 雖然發生在 BECOMEFOX／BECOMEPIG 後置判斷之前，
但不會重新寫入 `Battle_Attack_ReturnData_x.Battle_Attack_ReturnData`。

後置條件讀到的仍是最後一個 primary `BATTLE_Attack()` 的 return-state。

### BecomeFox post-order

V1.54 保留已對齊的短路順序：

1. 非 MISS
2. 非 DODGE
3. 非 ALLGUARD
4. 非 ARRANGE
5. final defNo 仍通過 TargetCheck
6. 才抽 `rand()%100 < 31`
7. 然後才檢查 target type != PLAYER
8. 再檢查 WORK_PETFLG != 0

目前玩家側出戰寵的來源 WORK_PETFLG 為 0，
所以 Enemy 變狐附加效果仍不成立，但合格路徑必須先消耗那顆 RNG。

### BecomePig post-order

V1.54 保留：

1. 非 MISS / DODGE / ALLGUARD / ARRANGE
2. final defNo 仍存活
3. final target 必須是 PLAYER
4. 不同 side
5. BECOMEPIG < 2000000000
6. 才抽 `rand()%100 < petrate`

因此多段技能如果最後 outer defNo 已經因 TargetAdjust 失敗變成無效，
或最後實際 primary target 是寵物，就不會錯對最初玩家目標抽黑烏力 RNG。

### Guardian quirk

Guardian substitution 發生在 `BATTLE_AttackSeq` 的 local defindex。

BECOMEFOX／BECOMEPIG 後置條件使用的則是 outer common-loop `defNo`。
但 Guardian 命中會留下 ALLGUARD return-state，因此後置條件會在最前面的 return-state gate 就停止。

V1.54 繼續以 outer `sourcePostTarget` + last primary `r.allGuard` 表示這個來源行為。

### V1.54 regression targets

- game.js syntax PASS
- main parent fixed at V1.53 / d0369affac080ba350adc0f29baed0343ae5630e
- BecomeFox non-ranged reuses primed AttackNum
- BecomePig non-ranged reuses primed AttackNum
- no duplicate weapon AttackNum RNG
- later non-ranged segments rerun TargetAdjust from raw COM2
- skill BOOMERANG remains common non-BOW
- post-effect runs only after common-loop Counter
- Counter does not overwrite Battle_Attack_ReturnData
- final sourcePostTarget is used for both post effects
- existing V1.49 MISS/DODGE/ALLGUARD/ARRANGE gates unchanged
- schema 27 unchanged


## V1.55 GuardianAttack / ATTCRAZED / GYRATE common direct-attack sweep

固定來源：`gavinlinasd/StoneAge@1f90cb6cb57c1df70f39cde77a5a8ccd98b66c56`。

### GuardianAttack
- `PETSKILL_Guardian`（skill 20）先登記 Guardian，再進 common direct-attack。
- 第一個 `BATTLE_Attack` 前 WORKBATTLECOM1 會改回 `BATTLE_COM_ATTACK`。
- 近戰／技能 BOOMERANG 改走 primed AttackNum + 每段 raw COM2 TargetAdjust。
- BOW／BOUNDTHROW／BREAKTHROW 沿用既有 weapon loop。
- 因工作 command 已變 ATTACK，GuardianAttack 可正常進 Counter／反 Counter。

### ATTCRAZED / 狂亂暴走
- skill 613：攻 = FIXSTR × 0.8；防 = FIXTOUGH × 0.7；option 3 覆寫 attack_max=3。
- 更早的 `BATTLE_GetAttackCount` 仍先執行並消耗武器 AttackNum RNG。
- `BATTLE_TargetListSet` 在第一擊前先抽好全部 3 個亂數 pList 目標。
- 原碼 `i < deftop`，所以 slot 9 / 19 被排除。
- 非 BOW 第一擊仍走 raw COM2 + TargetAdjust，預抽 pList[0] 只消耗 RNG、不實際使用。
- 第二、三擊使用 pList[1] / pList[2]；若當下失效，再跑 TargetAdjust / DefaultAttacker。
- BOW 使用預抽 pList，且專用分支提前 return，不再消耗一般 Bow RAND(0,1)。
- BREAKTHROW 仍保留每段麻痺 lifecycle；完整多段後才進 common Counter。
- 若是真實 ITEM_FIST 且原 AttackNum 有效，ATTCRAZED 不重設 gDamageDiv，因此保留 primed FIST AttackNum 作為傷害除數。

### GYRATE / 回旋攻擊
- skill 619：WORKATTACKPOWER = FIXSTR × 0.5。
- raw COM2 只決定四個 5-slot row，不做 TargetAdjust。
- 先快照該 row 的 TargetCheck-valid 成員，再依 slot 順序逐一 BATTLE_Attack。
- 專用 case 直接 break，不進 common Counter。
- primed attack_max 不決定 GYRATE 的攻擊次數，但 BATTLE_GetAttackCount 仍已先消耗。
- 若武器是 BOW，普通 BATTLE_TargetListSet 仍先消耗 Bow RAND(0,1)，產生的 aBowW 隨後完全不用。
- 若是真實 ITEM_FIST 且 AttackNum 有效，前置 gDamageDiv=primed AttackNum 仍影響每個 GYRATE BATTLE_Attack。

### WildViolent re-audit
- primed BATTLE_GetAttackCount 先消耗，之後 RAND(3,10) 覆寫 attack_max 與 gDamageDiv。
- BOW 仍走 aBowW；BOUND/BREAKTHROW 走完整 common weapon loop。
- V1.55 修正非 BOW：每一段都重新從原 raw COM2 執行 TargetAdjust。
- 因此 raw COM2 已失效時，每段都會重新消耗 DefaultAttacker RNG，不再錯誤沿用上一段 fallback 目標。
- 完整多段後才進 Counter。

### V1.55 regression targets
- parent fixed at V1.54 / `399f2660ce4cd93b57106fe1431b1dba832d5098`
- game.js syntax PASS
- GuardianAttack non-ranged reuses primed AttackNum
- GuardianAttack Counter eligibility restored after COM1 becomes ATTACK
- ATTCRAZED consumes all target-list RNG before first hit
- ATTCRAZED non-BOW first hit ignores random pList[0]
- ATTCRAZED Bow does not consume ordinary bow-order RNG
- ATTCRAZED preserves primed FIST gDamageDiv
- GYRATE attacks raw-COM2 row without TargetAdjust
- GYRATE consumes discarded Bow target-list RNG when appropriate
- GYRATE preserves primed FIST gDamageDiv
- GYRATE never enters common Counter
- WildViolent reruns raw-COM2 TargetAdjust on every non-BOW segment
- save schema 27 unchanged


## V1.56 SARS / ShowMercy common direct-attack completion

固定來源：`gavinlinasd/StoneAge@1f90cb6cb57c1df70f39cde77a5a8ccd98b66c56`。

### SARS / 毒煞蔓延
- skill 617 / `PETSKILL_Sars`；option「煞」沿用 local `turn=3`。
- 進入完整 common physical loop；每個正傷害 primary hit 在 WakeUp 後、ItemCrush 前做 SARS StatusAttackCheck。
- BREAKTHROW 的 default paralysis 被 SARS 覆蓋。
- 直接感染寫 WORKSARS=4、WORKMODSARS=1；MODSARS 本場不隨 SARS 到期清除。
- 特有命中 penalty 為 `(1-vitalShare)*0.9/0.25*10`。
- active tick 扣目前 HP 10%（最低 1 HP）；PLAYER 同時扣目前 MP 10%。
- 主傳染者依固定 `{3,1,0,2,4,8,6,5,7,9}` 鄰格表逐格做 `RAND(1,100)<=60`。
- 已 SARS 格在 RNG 前 skip；空格／死亡格在有效性檢查前仍消耗 RNG。
- spread 直接寫 WORKSARS=3，不做 StatusAttackCheck，因此可與另一異常共存；V1.56 使用獨立 transient SARS map。

### ShowMercy / 手下留情
- skill 626 / `PETSKILL_ShowMercy`。
- 保留完整 common AttackNum / BOW / throw / later TargetAdjust。
- DamageSub 對真正承傷者（含 Guardian substitution）把致死傷害改為 `HP-1`。
- HP=1 時正傷害可變 0，但 AttackSeq return-state仍是 NORMAL/CRITICAL，不改 MISS。
- clamp 在 HP 套用、WakeUp、Ultimate、ItemCrush 前完成；最終 damage=0 不消耗 ItemCrush RNG。
- COM1 保持 SHOWMERCY，所以被打者可 Counter，但攻擊者不能 counter-counter。

### V1.56 cleanup / regression
- SpeedyAttack 重新核對：既有實作符合來源，未改。
- 移除 V1.55 dispatch 中重複的 ATTCRAZED / GYRATE 分支。
- parent fixed at V1.55 / `76f450422787633a1eccda54acbee4ed1d7b9cb1`
- game.js syntax PASS
- save schema 27 unchanged


## V1.57 AttackShoot / 栗子連激 source lifecycle

固定來源：`gavinlinasd/StoneAge@1f90cb6cb57c1df70f39cde77a5a8ccd98b66c56`。

### PETSKILL_AttackShoot / skill 614
- option `3|5`；Enemy AI 選好 target 後、EntrySort 前先執行 `RAND(3,5)`。
- 原函式的 1/300、低 HP 1/50 升到 8 段分支要求 `WORKFIXAI>=100`。
- `CHAR_initcharWorkInt()` 只替 `CHAR_TYPEPET` 計算 FIXAI；Enemy 維持 0，因此 Enemy 614 不多抽那兩顆 RNG，也不進 8 段。

### TargetListSet
- 第一擊前一次預抽完整 n 顆 target RNG。
- BOW 直接使用預抽格，失效格只 skip。
- 非 BOW 第一擊仍使用原 COM2 + TargetAdjust，因此 pList[0] RNG 已消耗但值不用。
- 第二擊起才用預抽格；中途失效時才由 DefaultAttacker 補 fallback RNG。

### Damage / status order
- 執行前仍先消耗共用 BATTLE_GetAttackCount 武器 RNG，之後 ATTSHOOT 再覆寫 attack_max。
- `gDamageDiv=attack_max`，每個 BATTLE_Attack 的完整物理傷害再除以栗子總數。
- 顯示 protocol 固定 BB/w0，但真實 weaponType 不變。
- 正傷害 hit：DamageSub/WakeUp → BREAKTHROW 麻痺 → `RAND(1,5)>4` 直接 WORKSLEEP=3 → ItemCrush。
- 栗子睡眠不跑 StatusAttackCheck，可與另一異常共存；下一個正傷害會先 WakeUp 清掉前一擊睡眠。
- Web runtime 對「另一異常 + 栗子睡眠」使用獨立 transient sleep slot。

### Counter
ATTSHOOT 保留 COM_S_ATTSHOOT；來源 BATTLE_CounterCheck 在任一方為 ATTSHOOT 時直接 FALSE。
因此 V1.57 不進 Counter chain，也不消耗 Counter RNG。

### Regression
- game.js syntax PASS
- V1.56 SARS / ShowMercy 保留
- V1.55 ATTCRAZED / GYRATE 保留
- save schema 27 unchanged


## V1.58 Hector / 威嚇攻擊 source lifecycle

固定來源：`gavinlinasd/StoneAge@1f90cb6cb57c1df70f39cde77a5a8ccd98b66c56`。

### PETSKILL_Hector / skill 620
- option `麻 turn 1 攻%-30 敏%-30`。
- Enemy AI 在 PETSKILL_Use / EntrySort 前直接把 WORKATTACKPOWER、WORKQUICK 改成 FIX 值的 70%，因此敏捷下降會直接影響本輪排序。
- HECTOR special block 對原 COM2 呼叫 `PROFESSION_BATTLE_StatusAttackCheck(...,2,60)`。
- 該函式第一行先 `RAND(1,100)`，之後才檢查死亡／既有異常；判定為嚴格 `roll < 60`，即 59/100。
- 成功時直接寫 PARALYSIS=1，不在命中當下提前清除原 command。

### COM3 / BREAKTHROW override
本 build 開啟 `_PETSKILL_OPTIMUM`，skill 620 的 array index 即 620。
HECTOR 把 LOW(COM3)=620，再在 battle.c 設成 `gBattleStausChange=620`。
本 build `BATTLE_ST_END=44`，所以每個 BATTLE_Attack 的一般狀態檢查在範圍檢查就直接 return，不吃 RNG。

因此 BREAKTHROW 更早設定的 PARALYSIS 會被 HECTOR 620 覆寫；V1.58 關閉 HECTOR hit 的普通投石麻痺，避免雙重判定。

### BOW RNG order
執行順序為：AttackNum RNG → BATTLE_TargetListSet 的 `RAND(0,1)` → HECTOR 的 `RAND(1,100)` → 真正攻擊。
V1.58 讓 Bow helper 可接收已建立的 sourceBowPlan，確保不重抽第二次 TargetList RNG。

### Common attack / Counter
HECTOR special block沒有 break，之後落入 common physical group，COM1 在真正攻擊前改回 ATTACK。
因此仍保留武器 AttackNum、多段 common loop 與正常 Counter chain；若 Counter 方當下不能移動，既有 Counter CanMoveCheck 會阻止反擊。

### Regression
- game.js syntax PASS
- V1.57 AttackShoot 保留
- V1.56 SARS / ShowMercy 保留
- save schema 27 unchanged


## V1.59 Acupuncture / 針刺外皮 source lifecycle

固定來源：`gavinlinasd/StoneAge@1f90cb6cb57c1df70f39cde77a5a8ccd98b66c56`。

核心程式 commit：`cb8cc14210a98e3b87e08e530896b62a25fd1f14`。

### PETSKILL_Acupuncture / skill 622
- `petskill2` runtime：skill 622／`PETSKILL_Acupuncture`，option 為空，資料 target=0 對應 `PETSKILL_TARGET_MYSELF`。
- 這個 target 欄位不能直接拿來改寫 Enemy AI 目標：固定 `battle_ai.c` 在技能模式中會把已選好的 `result->target` 直接傳入 `PETSKILL_Use(..., result->target, NULL)`。
- 因此 Enemy 使用 622 時，`PETSKILL_Acupuncture` 先把 COM1 設為 ACUPUNCTURE、COM2 保留 AI 選中的玩家／寵物。
- `battle.c` 進 `BATTLE_COM_S_ACUPUNCTURE` 時先把 `CHAR_WORKACUPUNCTURE=1`，沒有 break，隨後落入完整 common physical attack。
- 真正攻擊前 common block 會把 COM1 改回 ATTACK，所以施術者完成自己的攻擊後可照普通物理流程參與 Counter chain。

### Damage reaction
固定 `BATTLE_GetDamageReact / BATTLE_DamageSub` 的針刺規則：

1. 只在針刺旗標存在、物理傷害為正且攻擊方不是投擲武器時觸發。
2. 原傷害為奇數時先加 1，補成下一個偶數。
3. 針刺持有者承受完整的偶數傷害。
4. `CHAR_WORKACUPUNCTURE` 立即清成 0。
5. 攻擊者再承受該偶數傷害的一半。
6. 一次觸發後效果即消耗；之後的多段攻擊不再反彈，除非重新施放。

投擲武器命中時，來源會把 reaction 強制改回 NONE：
- 正常造成原物理傷害
- 不反彈
- 不清除針刺旗標

### Counter / WakeUp lifecycle
- 普通 `BATTLE_Attack` 在 Acupuncture 暫時改寫 defindex 後，會把原 defender 恢復再做 WakeUp。
- `BATTLE_Counter` 沒有這個 restore；針刺反彈後 WakeUp 會落在被反傷的攻擊者。
- V1.59 把 primary 與 Counter 分開保留這個來源差異，而不是共用錯誤的 WakeUp 目標。

### Ultimate quirk
針刺反彈的實際 HP 損失是 `damage/2`，但固定來源在後續 Ultimate direct-hit threshold 判定仍使用反彈前的完整偶數 `damage`。
V1.59 只為這條來源路徑加入 threshold override；overkill／實際扣血仍使用真正的半傷值。

### BattleModel exception
固定 `BATTLE_BattleModel_ATTACK` 會暫時把真正 defender 標成 `BATTLE_COM_S_BATTLE_MODEL`。
若該 defender 有針刺：
- 針刺旗標仍會被清除
- 但來源明確跳過攻擊者的半傷反彈

目前 Web runtime 的 BattleModel 可達實作是 Enemy 分身攻擊玩家側，沒有玩家／寵物 BattleModel 反向命中 Enemy 622 的可達路徑。
因此 V1.59 只記錄此來源例外，不為目前不存在的路徑猜造額外 runtime。

### V1.59 regression targets
- parent fixed at V1.58 / `f7069c6abb9888a1204b55a971ee3e019ec0d8f1`
- core game.js commit `cb8cc14210a98e3b87e08e530896b62a25fd1f14`
- game.js syntax PASS
- 5 damage -> defender 6 / attacker reflect 3 / flag consumed
- 6 damage -> defender 6 / attacker reflect 3 / flag consumed
- throw 5 damage -> defender 5 / no reflect / flag preserved
- Counter 5 damage -> defender 6 / attacker reflect 3 / reflected-attacker WakeUp path
- ordinary player/pet physical hit, physical skill hit, confusion physical hit and Counter share the sourced reaction helper
- skill 621 `PETSKILL_Retrace` unchanged
- skill 623 `PETSKILL_DamageToHp2` unchanged
- save schema 27 unchanged


## V1.60 Combo / Acupuncture source lifecycle

固定來源：`gavinlinasd/StoneAge@1f90cb6cb57c1df70f39cde77a5a8ccd98b66c56`。

核心程式 commit：`a7a4036b7102302ddfbd69ccb8e03db9e57d12f8`。

### Post-622 positive-weight sweep
V1.59 後重新以固定原 C 的：

- `enemy1.txt`：`wa:` 七個技能槽權重
- `enemybase1.txt`：`E_T_PETSKILL1..7`
- `enemy.h`：欄位 enum

交叉解析，而不是把 encounter / Enemy ID 誤當 PetSkill ID。

624～750 的正權重來源技能中，現有已知 function 都已有 dispatcher；
仍未解析的只有原資料本身缺 PetSkill 定義的 645／729／745。
639 `PETSKILL_AntInter`、642 `PETSKILL_Awaken`、643 `PETSKILL_Temptation`、674 `PETSKILL_Vary`、734 `PETSKILL_Roar`
在這份固定 Enemy AI 中沒有正權重技能槽，因此本輪不為死資料硬猜 runtime。

### BATTLE_Combo reaction order
V1.59 雖已把一般物理、技能物理、混亂與 Counter 接入 Acupuncture，
但 `BATTLE_Combo()` 是獨立傷害路徑，不能把整個合擊總傷害直接視為一次普通 `BATTLE_DamageSub`。

固定原 C 每個 combo member 都依序：

1. `BATTLE_AttackSeq(..., BATTLE_COM_COMBO)`
2. 最低 damage=1
3. `BATTLE_GetDamageReact(defindex)`
4. 若是 REFLEC／TRAP／ACUPUNCTURE 且攻擊者不是投擲武器，立即呼叫 `BATTLE_DamageSub`
5. 否則只做 `BATTLE_DamageSubCale`，把該段加入 `AllDamage`
6. 只有最後一名 combo member 才用 `BATTLE_DamageSub2(..., refrect=-1)` 一次扣除累積 `AllDamage`

因此最後的 `DamageSub2` 明確不會再做第二次 Acupuncture 判定。

### Acupuncture inside Combo
當 combo 目標持有針刺外皮：

- 第一個符合條件的非投擲 member 立即觸發針刺。
- 該 member 的傷害若為奇數，仍先補成偶數。
- defender 立即承受完整偶數傷害。
- attacker 立即承受一半反傷。
- `WORKACUPUNCTURE` 當場清 0。
- **這一段不加入 `AllDamage`**。
- 後續 member 因針刺已消耗，才恢復正常 `DamageSubCale -> AllDamage` 累積。

投擲 member 不觸發也不消耗針刺；若未來有來源路徑把投擲成員帶進 `BATTLE_Combo`，
針刺可保留給後面的非投擲 member。

### Early target death
`BATTLE_Combo` 每一段開始都先檢查原 target HP。

所以若針刺的 immediate defender damage 在非最後一段就把目標打倒：

- 當前段的反傷／WakeUp／ItemCrush 照常完成。
- 下一段一開始直接 return。
- 尚未到最後一段的 `AllDamage` **不會補扣**。
- 後續 combo member 也不再攻擊。

V1.60 依此新增中途死亡停止點，不再把未結算總傷害錯補到已死亡目標。

### WakeUp / ItemCrush
- 一般非最後 combo 段：WakeUp 仍在該段後立即執行。
- Acupuncture 段：source 已把 `defindex` 改成 attacker，所以 WakeUp 落在被反傷的攻擊者。
- 最後一段：先執行 `DamageSub2(AllDamage)`，之後才 WakeUp / ItemCrush。
- ItemCrush 仍每個有效 combo member 各保留一次來源 RNG 消耗。

### V1.60 regression targets
- parent fixed at V1.59 / `4777c0ac1ecdeef5ae148930ec976f642812fc26`
- core game.js commit `a7a4036b7102302ddfbd69ccb8e03db9e57d12f8`
- game.js syntax PASS
- ordinary 2-member combo: 5 + 7 -> 12 total damage
- Acupuncture combo: first 5 -> defender 6 / attacker reflect 3; second 7 -> AllDamage 7; defender total loss 13
- Acupuncture lethal first segment: target dies immediately, second member does not execute
- Acupuncture segment WakeUp target = reflected attacker
- ordinary final combo member WakeUp occurs after accumulated DamageSub2 application
- ItemCrush RNG remains one per processed combo member
- skill 621 `PETSKILL_Retrace` unchanged
- skill 623 `PETSKILL_DamageToHp2` unchanged
- save schema 27 unchanged


## V1.61 low-loyalty RANDOMACT target RNG order

固定來源：`gavinlinasd/StoneAge@1f90cb6cb57c1df70f39cde77a5a8ccd98b66c56`。

核心程式 commit：`8e95a3702f1c14ae196fe2683fc57b08094ff056`。

### Source order
固定 `BATTLE_PetRandomSkill()` 的順序是：

1. `iNum = RAND(0, CHAR_MAXPETSKILLHAVE-1)`
2. `_FIXWOLF` 必要時重抽 skill slot
3. **先**呼叫 `BATTLE_DefaultAttacker(battleindex, 1-side)` 選定 COM2
4. 之後才進最多 50 次的 PetSkill 掃描
5. 最後仍用來源的舊索引怪癖，把原始 `iNum` 當 slot 傳給 `PETSKILL_Use()`

V1.60 前 Web 只有在成功／PETSKILL_Use 失敗的 return 分支才呼叫目標抽籤。
若掃描途中遇到 `PETSKILL_GetArray -> -1`，Web 會先保守停止，因而少掉來源早已消耗的目標 RNG。

### V1.61 correction
V1.61 把 `sourcePetRandomEnemyTarget()` 移到固定來源相同位置：

- skill slot RNG 完成後
- `_FIXWOLF` 重抽完成後
- 任何 PetSkill scan / UB 邊界之前

同一次預先抽好的 target 供正常 PetSkill、PETSKILL_Use 失敗、ILLEGAL skill、50 次搜尋耗盡與未定義邊界共同使用。

對來源未定義讀取仍維持既有原則：**只保留能證明已發生的 RNG，不猜 UB 最後會讀出什麼 FIELD／技能效果。**

### Why this is reachable
一般野外 166 species / 169 Lv1 variants 的捕獲寵會保存原 `enemybase1` 七格 PetSkill。
大量寵物只有前面 1～2 格有效，其餘格為 `-1`，所以低忠誠 RANDOMACT 的 scan 可實際進入這個來源邊界。

### Regression
- parent fixed at V1.60 / `d5c5a5f8d70b1bbecd0950f7c45d9a6fc73407f2`
- game.js syntax PASS
- 有效 slot：RNG 順序 = skill slot → target
- scan 遇 `-1`：仍先消耗 target RNG，再停在 source-invalid-petskill-array
- UB 邊界不猜技能效果
- 19 個一般野外 Lv1 PetSkill dispatcher coverage unchanged
- save schema 27 unchanged


## V1.62 low-loyalty EarthRound RANDOMACT exception

固定來源：`gavinlinasd/StoneAge@1f90cb6cb57c1df70f39cde77a5a8ccd98b66c56`。

核心程式 commit：`3249fdaeb924e35309b0832ad559668916acbcce`。

### Fixed BATTLE_PetLoyalCheck special case
固定 `BATTLE_PetLoyalCheck()` 在判定為 `PETAI_MODE_RANDOMACT` 後，第一個特殊判斷是：

```c
if (CHAR_getWorkInt(charaindex, CHAR_WORKBATTLECOM1) == BATTLE_COM_S_EARTHROUND0)
    return 0;
```

這個 return 發生在本輪 loyalty RNG 已消耗、AIBAD 已設定之後，但在清 Guardian 與 `BATTLE_PetRandomSkill()` 之前。

因此已隱身、等待釋放的地球一周 Pet 即使忠誠不足抽到 RANDOMACT：

- **不取消 EARTHROUND0**
- **不亂抽 PetSkill**
- **不呼叫 BATTLE_DefaultAttacker**
- **不多消耗 skill slot / target RNG**
- COM1 / COM2 保持原值
- action loop 之後仍照 EARTHROUND0 正常現身攻擊

### V1.62 correction
V1.61 前 Web 將 RANDOMACT、OWNERATTACK、ENEMYATTACK 一起視為覆寫目前特殊行動，所以 RANDOMACT 會錯誤中斷地球一周再亂出招。

V1.62 在 `sourcePetLoyalCheck()` 內保留來源例外：

- `mode === randomact` 且目前 intent command 是 `earthround`
- loyalty roll 已發生，但回報 `changed=false`
- 後續照原 EarthRound release path 執行

OWNERATTACK / ENEMYATTACK 仍會覆寫地球一周；TARGETRANDOM 仍只改 COM2 後繼續地球一周，與固定來源一致。

### Regression
- parent core = V1.61 / `8e95a3702f1c14ae196fe2683fc57b08094ff056`
- game.js syntax PASS
- FIXAI 30 + roll 10 + EARTHROUND0：只消耗 loyalty RAND(1,100)
- 不呼叫 RANDOMACT skill planner
- EarthRound command 保留
- 同樣 FIXAI / roll 的普通 attack intent：仍會進 RANDOMACT skill planner
- V1.61 slot → target RNG 順序保留
- save schema 27 unchanged

## V1.63 Enemy AI pre-Battling RNG lifecycle

固定來源：`gavinlinasd/StoneAge@1f90cb6cb57c1df70f39cde77a5a8ccd98b66c56`。

核心程式 commit：`1e38f0badf2c79c97ae3a9eff30308498e239285`。

### Fixed phase order
固定 `BATTLE_Command()` 的回合執行順序是：

1. `pBattle->turn++`
2. `BATTLE_ai_all(battleindex, 0, 0)`
3. `BATTLE_ai_all(battleindex, 1, 0)`
4. `BATTLE_Battling(battleindex)`
5. `BATTLE_Battling()` 建立 EntryList 時才逐 Entry 呼叫 `BATTLE_DexCalc()`
6. `EntrySort()`
7. `ComboCheck()`

因此 Enemy AI 的 action / target / PetSkill AI-stage side effect 必須全部發生在 Player、Pet、Enemy 的第一顆 Dex RNG **之前**。

V1.62 前 Web 在 `normalBattleOrder()` 先抽 Player Dex、Pet Dex，之後才逐 Enemy 做 AI action / target，再抽 Enemy Dex；同一 seed 下會從回合前段開始讓整條 RNG 串錯位。

### WAZA target lifecycle
固定 `BATTLE_ai_normal()` 抽到 `B_AI_WAZAMODE0..6` 後，會先：

- 建立 target candidate
- 依 target type / select mode 消耗必要 RNG
- 寫入 `result->target`

之後才呼叫：

`PETSKILL_Use(charaindex, slot, result->target, NULL)`

所以即使 PetSkill callback 最後變成 NONE／GUARD，或 callback 未註冊、技能拒絕執行，**WAZA 的 target RNG 仍然先發生**。

V1.63 用 `sourceAiPickedSkill` 保留「原始 AI 抽到的是 WAZA」這件事，不再只看最後轉換後的 `action.kind` 決定是否選 target。

### Dead Enemy Entry
固定 `BATTLE_ai_all()` 在呼叫 tactics function 前沒有 `CHAR_ISDIE` / HP<=0 pre-filter。

而它是在 AI callback 完成後才檢查 `BATTLE_CanMoveCheck()`；固定版 `BATTLE_CanMoveCheck()` 檢查麻痺／石化／睡眠等狀態，**不檢查 HP**。

因此「已死亡但仍留在 Battle Entry」的 Enemy 仍可先跑 AI action / target / `PETSKILL_Use()` lifecycle、消耗 RNG；之後進 `BATTLE_Battling()` 才因 ISDIE / HP<=0 被跳過。

V1.63 不再為 dead Enemy 提早跳過 AI，只在真正 action execution 階段維持死亡 Entry 不行動。

### V1.63 correction
`normalBattleOrder()` 現在拆成與固定 C 對齊的兩階段：

- **AI phase**：依 Enemy Entry 順序完成 action → target → PetSkill AI-stage side effects
- **Battling phase**：之後才依 Player → Pet → Enemy Entry 順序消耗 Dex RNG，再 EntrySort → ComboCheck

另外：

- WAZA→NormalGuard / PETSKILL_None 仍先完成 target lifecycle
- missing / unregistered / Sacrifice-low-HP 等最終失敗分支仍保留來源已發生的 target lifecycle
- target candidate 完全不存在時，保持來源在 `PETSKILL_Use()` 前 return FALSE，不套技能副作用
- `BATTLE_CanMoveCheck()` 類阻止行動的狀態在 AI callback 後才把最後 command 覆成 NONE；已發生的 skill side effect 不倒退
- save schema 維持 27

### Regression
- parent = V1.62 playable HEAD / `3ae1f72ec5c99256d6179876da0eb1043342679c`
- core = `1e38f0badf2c79c97ae3a9eff30308498e239285`
- committed `game.js` syntax PASS
- V1.61 slot → target RNG regression PASS
- V1.61 undefined PetSkill boundary target-RNG preservation PASS
- V1.62 EarthRound RANDOMACT exception PASS
- WAZA→NormalGuard target lifecycle PASS
- PETSKILL_None target lifecycle PASS
- Sacrifice reject target lifecycle PASS
- missing / unregistered skill target lifecycle PASS
- Enemy AI → target → skill-side-effect → Dex → Combo order PASS
- dead Enemy Entry AI / target RNG lifecycle PASS
- targeted regression: **14 / 14 PASS**
- save schema 27 unchanged

## V1.64 player unarmed AttackCount / friendly TargetAdjust lifecycle

固定來源：`gavinlinasd/StoneAge@1f90cb6cb57c1df70f39cde77a5a8ccd98b66c56`。

核心程式 commit：`fc8a696ddae0fb8250f198b27d132bea500f6c39`。

### Fixed BATTLE_GetAttackCount timing
固定 `BATTLE_Battling()` 對每個仍是 C_OK 的 actor：

1. 先跑 StatusSeq / CanMoveCheck
2. 然後在 command switch **之前**呼叫 `BATTLE_GetAttackCount()`
3. 沒有有效 CHAR_ARM 時，非 PLAYER 固定退回 1 擊
4. PLAYER 若 Lv < 10 固定 1 擊
5. PLAYER 若 Lv >= 10，會先消耗 `RAND(1,1000)`

玩家空手 Lv>=10 的固定表：

- `roll <= 10 + luck*5`：再抽 `RAND(5,10)`，attack_max = 該值
- `roll <= 30 + luck*5`：attack_max = 3
- `roll <= 70 + luck*5`：attack_max = 2
- 其餘：attack_max = 1
- `luck*5 > 25` 時固定只 clamp 到 25；來源沒有負值下限，Web 不自行新增

目前 Web 尚未有玩家 CHAR_ARM/equipment runtime，且 `playerBattleView.weaponType` 固定 ITEM_FIST，所以「BATTLE_GetAttackCount() 回 0 → PLAYER 空手 fallback」是現行可達來源路徑。

這顆 AttackCount RNG 與最後 command 無關：玩家本輪即使是 CAPTURE / GUARD，只要進到 C_OK actor execution，也先消耗同一顆空手 RNG；只有 ATTACK command 才實際使用 attack_max 多段攻擊。

### Fixed non-BOW common attack loop
固定普通非 BOW 攻擊會把原始 COM2 預先填入 `aDefList[]`。

每一段：

1. 從同一份 raw COM2 重新做 `BATTLE_TargetAdjust()`
2. 執行一段 `BATTLE_Attack()`
3. 立刻 `BATTLE_AddProfit()`
4. 若還沒到 attack_max，下一段再把 raw COM2 寫回並重新 TargetAdjust
5. 全部段數完成後才進 Counter chain

空手 PLAYER 的隨機 attack_max **不會**同步寫入 gDamageDiv，所以每段仍是來源正常單段傷害，不自行平均分攤。

### Friendly TargetAdjust
V1.63 前 Web 在玩家／普通寵物真正行動時直接重新取 `targetEnemyUnit()`，等於把 command phase 已固定的 COM2 丟掉。

V1.64 改為：

- 原 `actor.targetUnitId` 仍然 TargetCheck-valid：直接沿用，不吃 target RNG
- 原目標已死亡／失效／EarthRound 隱身：才走固定 `BATTLE_DefaultAttacker()`
- DefaultAttacker 保留來源 `RAND(0,cnt-1)`，**包含只剩一個候選時的 RAND(0,0)**
- 玩家多段攻擊每一段都從同一份 raw COM2 重新 TargetAdjust
- 普通寵物只在忠誠 NORMAL、未被特殊技能 lifecycle 接管時走這條；V1.61/V1.62 的 TARGETRANDOM / RANDOMACT / OWNERATTACK / ENEMYATTACK 不被覆蓋

### Per-segment profit / Counter order
Web 的 `applyFriendlyEnemyHit()` 已在每段內完成 ItemCrush，並在新死亡時立即 `sourceMarkEnemyDeathCredit()`。

`sourceMarkEnemyDeathCredit()` 又會立即 `sourceQueueEnemyCarriedLoot()`，所以來源的：

- `RAND(0, allnum-1)`
- getitem 滿格時 `RAND(0,1)`
- 必要時 `RAND(0,2)`

都會在下一段 TargetAdjust 之前消耗。

因此 V1.64 保持「hit → per-hit reward RNG → next TargetAdjust」；Counter 只在整個 common attack loop 最後跑一次。

### Regression
- parent playable HEAD = V1.63 / `abece348166cf8111f9b4d4ef09320c93882f8ba`
- core = `fc8a696ddae0fb8250f198b27d132bea500f6c39`
- committed game.js syntax PASS
- schema 27 unchanged
- attack / capture / guard 三條 turn loop：Player AttackCount prime 都在 status skip / command switch 前
- Lv9 空手：不消耗 AttackCount RNG
- Lv10 Luck0 roll 10：再消耗 RAND(5,10)
- Lv10 Luck0 roll 11 / 31 / 71：分別得到 3 / 2 / 1 擊
- Luck >5：luckWork 固定 clamp 25
- valid raw COM2：不消耗 DefaultAttacker RNG
- invalid raw COM2 + 單一剩餘目標：保留 RAND(0,0)
- 3-hit common loop：每段重新 TargetAdjust，逐段收益 lifecycle，最後只跑一次 Counter
- V1.63 Enemy AI pre-Battling ordering regression PASS
- targeted regression: **16 / 16 PASS**
- save schema 27 unchanged

## V1.65 current Entry death recheck before execution

固定來源：`gavinlinasd/StoneAge@1f90cb6cb57c1df70f39cde77a5a8ccd98b66c56`。

核心程式 commit：`7b7082316ff48a56bc72cd1e31ac53d93ce11d49`。

### Fixed execution-time death gate
固定 `BATTLE_Battling()` 會先把仍在 Battle Entry 的角色全部放進 EntryList、計算 Dex、排序並跑 `ComboCheck()`。但真正逐 actor 執行時，每一個 Entry 都會重新檢查：

- `CHAR_CHECKINDEX(charaindex)`
- `CHAR_ISDIE`
- `CHAR_WORKBATTLEMODE == BATTLE_CHARMODE_C_OK`
- `CHAR_HP > 0`

只要此時已死亡／HP<=0，就會在 `BATTLE_StatusSeq()`、`BATTLE_GetAttackCount()`、`BATTLE_PetLoyalCheck()` 之前直接 `continue`。

這和 V1.63 的「死亡 Entry 仍參與 AI → Dex → EntrySort → ComboCheck」並不衝突：兩個判斷發生在不同 phase。

### Reachable Web mismatch
V1.64 的 `sourceDeadBattleEntry()` 只讀 `normalBattleOrder()` 建表時寫入的 `sourceDeadEntry` 快照。

因此若 Enemy：

1. 建表／Dex／ComboCheck 時仍活著；
2. 被排序更前面的 actor 在同一回合打死；
3. 自己稍後才輪到執行；

Web 仍可能進入 `processBattleStatusTurn()`，並對 Enemy 呼叫 `sourceEnemyPrimeExecutionAttackCount()`。

若該 Enemy 持有有效原版武器，`sourceBattleGetAttackCount()` 會多消耗 `RAND(min,max)`；固定 C 此時早已因當下 HP/ISDIE 直接跳過，不會有這顆 RNG。

### V1.65 correction
`sourceDeadBattleEntry(actor)` 現在在真正執行前讀取當下 runtime：

- Player：目前 HP
- Pet：目前 Pet 是否仍存在、是否已退出 Battle、目前 HP
- Enemy：目前 Battle unit 是否仍存在、目前 HP

不再把建表時的 `sourceDeadEntry` 當成永久死亡判定。

因此：

- 回合開始前已死的 Entry 仍照 V1.63 參與 AI/Dex/Combo，再於 execution gate 跳過
- 同回合中途才死亡的 Entry 不再跑 StatusSeq / AttackCount / Loyalty
- 若未來有可靠復活 lifecycle，建表時的舊死亡快照也不會錯誤壓過執行當下的活體狀態
- save schema 維持 27

### Regression
- parent playable HEAD = V1.64 / `afa8686c1ed34d026fa781d4ee4e6e0867379ee5`
- core = `7b7082316ff48a56bc72cd1e31ac53d93ce11d49`
- committed `game.js` syntax PASS
- capture / attack / guard：current-state death gate 都在 StatusSeq 與 Enemy AttackCount prime 之前
- alive Enemy + stale `sourceDeadEntry=true`：以執行當下 HP 為準，不永久判死
- mid-round Enemy HP→0：execution gate PASS
- missing/removed Enemy Entry：execution gate PASS
- mid-round Pet HP→0：execution gate PASS
- V1.63 Enemy AI pre-Battling lifecycle 保留
- save schema 27 unchanged

## V1.66 full-round finish / player death lifecycle

固定來源：`gavinlinasd/StoneAge@1f90cb6cb57c1df70f39cde77a5a8ccd98b66c56`。

核心程式 commits：

- `5104c39cb23df1cf2ca0bc72a9af90a56bb6b075` — full-round finish、player death-extra、Pet WORKFIXAI snapshot
- `3cd23d68ca21e9a846816cb19b71f7a223879ec2` — Combo 的 ItemCrush → AddProfit/death-extra 最終順序校正

### Fixed BATTLE_Command finish timing
固定 `BATTLE_Command()` 每回合先：

1. `BATTLE_ai_all(side 0)`
2. `BATTLE_ai_all(side 1)`
3. 完整跑完 `BATTLE_Battling()`
4. 清 SURPRISE
5. 才呼叫 `BATTLE_OnlyRescue(side 0)`
6. side 0 尚有非 Pet 生存者時，才再檢查 `BATTLE_OnlyRescue(side 1)`

因此任一角色在排序中的較早 action 打死玩家或最後一隻 Enemy，都**不會當場中止 EntryList**。尚未輪到的 Entry 仍依來源 execution gate 繼續處理自己的 StatusSeq / AttackCount / PetLoyalCheck / command。

### OnlyRescue side priority
固定 `BATTLE_OnlyRescue()` 明確跳過 `CHAR_TYPEPET`，只計算該 side 的非 Pet 生存角色。

現行單人 Web side 0 只有玩家本人屬非 Pet，因此：

- 玩家普通死亡後，即使出戰寵仍活著，該寵仍可在本輪後續排序中行動
- 整輪跑完後 side 0 仍視為全滅
- 若寵物在玩家死亡後又殺死最後 Enemy，`BATTLE_Command()` 仍先命中 side 0 全滅分支，結果是玩家敗
- 最後 Enemy 較早死亡時，後續仍未執行的 Player / Pet Entry 仍先跑完來源 lifecycle，之後才判勝

### Dead loser profit check
固定 `BATTLE_Finish()` 會對仍在 Entry 的角色呼叫 `BATTLE_GetProfit()`，但 `BATTLE_GetExpGold()` 第一段即檢查：

`CHAR_ISDIE == TRUE -> return 0`

所以普通死亡玩家即使本輪同時擊殺 Enemy，也不會在敗北結算取得該場 EXP / item；Web 的 defeat teardown 繼續不發勝利獎勵是來源一致，不自行補發。

### Player death-extra is separate from battle finish
固定死亡副作用在傷害後的 `BATTLE_AddProfit() -> BATTLE_AddExpItem()` 階段處理，不等到 `BATTLE_OnlyRescue()`：

- Normal death：扣玩家 Charm、修改 DEFAULTPET VariableAI，玩家/寵物 Battle Entry 不因此立即整場清除
- Ultimate player death：`BATTLE_UltimateExtra()` 先呼叫 `BATTLE_PetDefaultExit()`，再套較大的 Charm / VariableAI 修正並 `BATTLE_Exit(player)`
- `BATTLE_PetDefaultExit()` 只移除 DEFAULTPET 的 Battle Entry，不清除玩家持有／DEFAULTPET 關係

V1.66 因此把 Web 原本綁在 `defeat()` 的 player death-extra 拆成 `sourceProcessPlayerBattleDeathOnce()`：

- death-extra 每場最多一次
- Normal death 保留出戰寵本輪後續行動
- Ultimate death 立即把 DEFAULTPET 標成 `battlePetOutIds`，讓後續 TargetAdjust / Entry execution 看不到該 Battle Entry
- 真正回村、補滿 HP/MP、釋放戰場仍延到整輪勝負判定完成後

已能直接對到固定 common physical `BATTLE_Attack -> ItemCrush -> BATTLE_AddProfit` 的路徑，death-extra 會在該段結算後立即發生；未逐技能證明 AddProfit 時點的特殊 skill 不自行猜測，只保證在 actor 結束與下一 Entry 之前處理。

### Pet WORKFIXAI round snapshot
固定 `CHAR_WORKFIXAI` 是 `BATTLE_PreCommandSeq -> CHAR_complianceParameter()` 寫入的本輪 WORK 值；`BATTLE_PetLoyalCheck()` 與 `BATTLE_Abduct()` 後面都直接讀這個 snapshot。

玩家在 Pet 行動前死亡時，Charm / VariableAI 雖會立刻改變，但**同一回合的 WORKFIXAI 不會重新計算**。

V1.66 新增 `battlePetFixAiSnapshots`：

- 正常 PreCommand 刷新本輪 FIXAI
- 本輪 LoyaltyCheck / Abduct 只讀 snapshot
- EARTHROUND0 因固定 PreCommand 直接 skip compliance，保留上一輪 WORKFIXAI
- 下一個正常 PreCommand 才把死亡造成的 Charm / VariableAI 變更反映到 FIXAI

### V1.66 correction
`captureTurn()`、`attackTurn()`、`guardTurn()` 現在都：

- actor 之間只掃死亡副作用，不因 HP=0 / Enemy 全滅立刻 `return`
- 本輪中途才死亡的 Entry 仍由 V1.65 current-state execution gate 跳過 StatusSeq / AttackCount
- 對仍活著的後續 Entry 繼續原排序 lifecycle
- 全 order 完成後才判勝負
- 固定採 side 0 優先：玩家死亡先判 defeat，再判 Enemy 全滅 win
- 結束場次不再進下一輪 `battleFieldTick()`

### Regression
- parent playable HEAD = V1.65 / `513696aac0bd060d442300f4b4cd76e4e1ed764c`
- final core = `3cd23d68ca21e9a846816cb19b71f7a223879ec2`
- committed `game.js` syntax PASS
- FIXAI snapshot：本輪固定 PASS
- EARTHROUND0 FIXAI 保留 PASS
- 下一正常 PreCommand FIXAI refresh PASS
- Normal player death-extra exactly-once PASS
- Ultimate player death DEFAULTPET Battle exit PASS
- capture / attack / guard：full EntryList finish timing PASS
- capture / attack / guard：side 0 defeat priority PASS
- V1.61 / V1.62 low-loyalty lifecycle retained
- V1.63 Enemy AI → Dex ordering retained
- V1.64 Player AttackCount / friendly TargetAdjust retained
- V1.65 execution-time current death gate retained
- targeted regression: **17 / 17 PASS**
- save schema 27 unchanged

## V1.67 Pet death AddProfit / Marefia RNG lifecycle

固定來源：`gavinlinasd/StoneAge@1f90cb6cb57c1df70f39cde77a5a8ccd98b66c56`。

核心 commits：

- `914633f66083a3b075ad380f78492fe1545dfd67` — Pet death 改到來源真正的 `BATTLE_AddProfit()` 邊界、瑪蕾菲雅死亡 RNG、common physical / Counter lifecycle
- `a1c601c8b7303685889ed638c96be68045fef58f` — Player Ultimate 先移除 DEFAULTPET Entry，因此同次 AddProfit 不再掃 slot 5 Pet death

### Fixed Pet death timing
固定 `BATTLE_AddExpItem()` 會掃兩側 Battle Entry。對每個 `HP <= 0 && CHAR_ISDIE == FALSE` 的新死亡者，來源會在該次 `BATTLE_AddProfit()` 內立即：

1. 標記 `CHAR_ISDIE`
2. `_PET_LIMITLEVEL` 開啟時呼叫 `Pet_Check_Die()`
3. 增加 DEADCOUNT
4. 依 Entry Ultimate flag 呼叫 `BATTLE_UltimateExtra()` 或 `BATTLE_NormalDeadExtra()`

因此 Pet death 不能只延到「下一個 actor 開始」才處理。特別是 common multi-hit / Counter 中，Pet_Check_Die 可能消耗 RNG，必須發生在下一個 TargetAdjust / Counter RNG 之前。

### Marefia / PetID 718
固定 `_PET_LIMITLEVEL` 已啟用。`Pet_Check_Die()` 對 `CHAR_PETID == 718` 無條件依序消耗：

1. `RAND(1,8)` — VITAL
2. `RAND(1,4)` — STR
3. `RAND(1,4)` — TOUGH
4. `RAND(1,4)` — DEX

四項扣除後 clamp 0..50，接著 `CHAR_MODAI -= CHAR_MODAI * 5 / 100`。

V1.67 的 `sourceMarefiaDeathPenalty()` 現在只要 TempNo/PetID 718 就一定先消耗這 4 顆 RNG。若舊／異常存檔真的沒有可還原的 `allocPointPacked`，仍保留四顆 RNG 與已知 MODAI -5%；但不自行猜遺失的四圍數值。

### AddProfit scan order: Player before Pet
目前單人 side 0 對應 Player = slot 0、DEFAULTPET = slot 5。固定 `BATTLE_AddExpItem()` 由低 slot 往高 slot 掃，所以同一個 AddProfit 前 Player 與 Pet 同時死亡時，一定先處理 Player death-extra，再處理 Pet。

這會影響 Player death 對 DEFAULTPET 的 `AI_FIX_PLAYERDEAD / AI_FIX_PLAYERULTIMATE`：不能先把 Pet Ultimate 清掉，否則會錯漏主人死亡對 Pet 的 VariableAI 修正。

V1.67 新增 `sourceProcessBattleDeathsAtAddProfit()`，固定順序：`Player death-extra -> Pet death scan`。

### Player Ultimate special case
固定 `BATTLE_UltimateExtra(player)` 在處理 Player slot 0 時會先 `BATTLE_PetDefaultExit(player,battleindex)`，其內 `BATTLE_Exit(DEFAULTPET)` 會把 slot 5 Battle Entry 立刻設成 -1，之後才完成 Player Ultimate 的 Charm / DEFAULTPET VariableAI 修正與 `BATTLE_Exit(player)`。

因此如果 Player Ultimate 與 DEFAULTPET 在同一個 AddProfit 前都已 HP=0，等 `BATTLE_AddExpItem()` 後續掃到 slot 5 時，Pet Entry 已不存在：

- 不執行該 Pet 的 `Pet_Check_Die()`
- 不執行 Pet NormalDeadExtra / UltimateExtra
- 瑪蕾菲雅也不額外消耗 4 顆死亡 RNG
- Player BATTLE_Exit 的持有寵清理最後會把 HP<=0 Pet 回到 HP 1

V1.67 已保留這個來源特例：Player death scan 若回報 Ultimate，該場後續 AddProfit 不再對已被 DefaultExit 的 Pet 做 death scan；Web 最終 defeat teardown 仍負責既有的 Pet HP 1 離場恢復。

### Inner AddProfit boundaries
固定 common physical loop 每一個 `BATTLE_Attack()` 後都立即：`BATTLE_AddProfit() -> attack_count++ -> attacker-death check -> next TargetAdjust`。

固定每一個 `BATTLE_Counter()` 後也立即 `BATTLE_AddProfit()`。

V1.67 已把 immediate death scan 接到目前可達且來源已證明的 Player common multi-hit、Active Pet normal attack、Pet CHARGE_OK / EARTHROUND0 / STATUSCHANGE / GUARDIAN_ATTACK / RENZOKU / MIGHTY / POWERBALANCE、Enemy normal/common direct attack、BOW / BOOMERANG / BOUNDTHROW / BREAKTHROW、ATTCRAZED、ATTSHOOT、WILDVIOLENT、RENZOKU、RETRACE、common non-ranged PetSkill loop、Combo `_Item_ReLifeAct` AddProfit，以及每一段 Player↔Enemy / Pet↔Enemy Counter。

RETRACE 保留固定特殊順序：`primary BATTLE_Attack -> optional 80% retrace BATTLE_Attack -> ONE AddProfit -> next primary segment`，因此不會錯把 Pet death RNG 插到首擊與追擊中間。

### Dedicated outer-only skills
V1.67 同時修正 V1.66 一個被 death-extra 無 RNG 掩蓋的時序風險：`enemyApplyDirectGuardianSkillHit()` 不再自行觸發死亡掃描。

像 FIREKILL、GYRATE、REGRET、GUARD_BREAK2 等 dedicated case 在固定 C 內部先跑完整技能，再依 actor 統一 outer `BATTLE_AddProfit()`；不能因為共用 Web helper 就提前 Pet_Check_Die / Player Ultimate exit。現在這些技能維持 actor 結束時再掃死亡。

### Pet relife flag
固定 `version.h`：`_Item_ReLifeAct` = ON、`_LOSE_FINCH_` = OFF。

所以 fixed build 的 `CHECK_PET_RELIFE()` 不可達，不會攔截 Pet_Check_Die / Pet death-extra。Player 的 `_Item_ReLifeAct` 裝備死亡復活屬另一個獨立 lifecycle，V1.67 不自行猜裝備資料，留作後續來源掃描。

### Regression
- parent playable HEAD = V1.66 / `e8cbbcddc846876decea51040144e3d0ec1f43e5`
- V1.67 core = `a1c601c8b7303685889ed638c96be68045fef58f`
- committed `game.js` syntax PASS
- normal simultaneous Player + Pet death: Player -> Pet order PASS
- Player Ultimate removes Pet Entry before slot 5 death scan PASS
- Marefia missing alloc still consumes exactly 4 RNG PASS
- Marefia RNG ranges/order PASS
- Marefia alloc clamp + MODAI -5% PASS
- Counter per-segment AddProfit PASS
- RETRACE AddProfit before next primary TargetAdjust PASS
- ATTCRAZED / ATTSHOOT / WILDVIOLENT / RENZOKU common AddProfit PASS
- dedicated outer-only skills do not receive false inner AddProfit PASS
- V1.61 / V1.62 low-loyalty lifecycle retained
- V1.63 Enemy AI -> Dex ordering retained
- V1.64 Player AttackCount / TargetAdjust retained
- V1.65 current-state execution death gate retained
- V1.66 full-round finish + WORKFIXAI snapshot retained
- targeted core regression: **46 / 46 PASS**
- save schema 27 unchanged


## V1.68 _Item_ReLifeAct / Player equipment death-relife lifecycle

固定來源：`gavinlinasd/StoneAge@1f90cb6cb57c1df70f39cde77a5a8ccd98b66c56`。

核心 commits：

- `5780970fa3885d1dee561d332eac19f8670c6d32` — 接入 Player death-relife lifecycle 與 actor outer AddProfit pending gate
- `ef9913e4384a10b208453dc6e81e0b388d733074` — 補齊 ITEM_CHECKINDEX / equip-place 有效性 gate

### Fixed build flags

固定 `version.h`：

- `_Item_ReLifeAct` = ON
- `_DUMMYDIE` = OFF
- `_LOSE_FINCH_` = OFF

因此本輪只處理玩家裝備死亡復活；Pet relife 仍不可達。

### CHECK_ITEM_RELIFE exact gates

固定 `BATTLE_Battling()` 在一個有效 Entry 完成 command 後、該 Entry 的統一 outer `BATTLE_AddProfit()` 前呼叫 relife scan。

`CHECK_ITEM_RELIFE()` 對玩家的硬條件：

1. HP <= 0
2. `CHAR_ISDIE == TRUE`
3. 只掃 CHAR item slot 0..4
4. item index 必須有效
5. `ITEM_getEquipPlace() != -1`
6. 只觸發第一個 `ITEM_DIERELIFEFUNC` 非空的裝備

`BATTLE_getBattleDieIndex()` 若 Entry 帶 `BENT_FLG_ULTIMATE` 會直接回 -1，所以 Ultimate / 打飛死亡的 Player **不會進入替身裝備復活**。這個排除發生在裝備掃描之前，不需要依賴後面的 `BATTLE_Exit(player)` 才成立。

### ITEM_DIErelife HP and consumption

固定 `ITEM_DIErelife()` 沒有 RNG：

- 沒有 `HP=` argument -> power = 1
- `HP=FULL` -> power = `CHAR_WORKMAXHP`
- 其他字串 -> C `atoi()`
- `BATTLE_MultiReLife()` 再做 `max(1,power)` 並 cap 到 WORKMAXHP
- 成功後清除 `CHAR_ISDIE`
- 隨即把裝備 slot 清成 -1 並 `ITEM_endExistItemsOne()` 消耗該 existing item

Web 端因此新增 C `atoi` 等價解析，且 relife 後會把 `battlePlayerDeathProcessed` / result 清回 alive 狀態；否則同一場第二次死亡會被錯誤地當成「已處理過」而漏掉 death-extra。

### Inner AddProfit vs outer-only fatal timing

這是本輪最重要的時序差異。

若致死傷害所在的 command 內部已經有來源明確的 inner `BATTLE_AddProfit()`：

1. inner AddProfit 先把 Player 標成 ISDIE 並跑 NormalDeadExtra
2. command 結束
3. generic `CHECK_ITEM_RELIFE` 可在**同一 actor iteration** 復活
4. 再跑該 actor 的 outer AddProfit
5. 下一個排序 Entry 看到的是已復活 Player，因此若 Player 的排序尚未輪到，仍可正常進入後續 action / RNG

若是 dedicated outer-only 路徑，致死時只有 HP=0、尚未由 AddProfit 標 ISDIE：

1. command 結束時 relife scan 因 ISDIE 尚未成立而失敗
2. 接著 outer AddProfit 才處理 Player death
3. 若下一個排序 Entry 正好是已死 Player，會直接在 StatusSeq / AttackCount 前被 skip
4. 必須等**後面另一個真正完成 command 的 C_OK Entry**，它的 generic relife scan 才可能把 Player 復活

Dead Entry、C_WAIT Entry、以及被 Combo leader 吃掉的 member 都在固定 C 的 generic relife scan 前就 continue，因此它們本身不能憑空製造一個復活 boundary。

V1.68 用 `battleOuterAddProfitPending` 保留這個差異：只有實際走到 StatusSeq / command processing 的 Entry 才 mark pending；回合開頭或純 dead/C_WAIT/Combo-consumed skip 不會誤觸 relife。

### Player equipment data boundary

目前 Web 尚未有來源可驗證的 Player equipment-slot importer。V1.68 **沒有猜任何替身娃娃 ItemId、equip slot 或 HP argument**。

`sourcePlayerEquippedRelifeItems()` 的正式 adapter 暫時回傳空陣列；lifecycle core 已完成，等後續把原 itemset 的已驗證 Player 裝備資料接入後即可直接使用。這也代表目前公開玩法不會憑空生成或啟用一件未證實的復活裝備。

### Regression

- committed `game.js` syntax PASS
- C atoi：前導空白 / 正負號 / 遇非數字停止 PASS
- HP argument：missing / FULL / numeric PASS
- HP clamp：至少 1、最多 max HP PASS
- HP>0 不觸發 PASS
- HP=0 但尚未 AddProfit / ISDIE 不觸發 PASS
- Ultimate death 排除 PASS
- 只掃 slot 0..4 PASS
- ITEM_CHECKINDEX / equip-place / function-pointer gate PASS
- 第一個有效 relife 裝備優先 PASS
- existing item 與 equip slot 同步消耗 PASS
- relife 清除 death-processed state，可再次死亡 PASS
- completed actor 才建立 outer boundary PASS
- relife 發生在 outer AddProfit 之前 PASS
- outer-only fatal 同 boundary 不偷跑 relife PASS
- 後續有效 Entry 才能替先前 outer-only death 觸發 relife PASS
- relife helper 0 RNG PASS
- capture / attack / guard 三個 actor loop 均接入 pending gate PASS
- V1.67 Player -> Pet AddProfit scan order retained
- V1.67 Player Ultimate DEFAULTPET exit retained
- V1.67 Marefia PetID 718 四顆死亡 RNG retained
- targeted V1.68 regression: **29 / 29 PASS**
- save schema 27 unchanged


## V1.69 Source-backed relife item templates

固定來源：`gavinlinasd/StoneAge@1f90cb6cb57c1df70f39cde77a5a8ccd98b66c56`。

核心 commits：

- `f6204996fad82ce96aa4cc9ce3305b232e2a48a7` — 從固定 `itemset6.txt` 建立 `stoneage_item_relife_runtime.json`
- `2b5cbb09a768ee859b2b5180ebffee47a44e7cde` — `game.js` 開機載入 relife runtime，戰鬥判定改成只信 source template

### Fixed itemset6 result

固定 10,737 筆 Item 中，`ITEM_DIErelife` 共 **5 件**：

- Item 20131 — 替身娃娃 Lv1 — `HP:200`
- Item 20132 — 替身娃娃 Lv2 — `HP:500`
- Item 20133 — 替身娃娃 Lv3 — `HP:FULL`
- Item 21128 — 祈福戒指 — `HP:FULL`
- Item 19180 — VIP祈福戒指 — `HP:FULL`

五件資料的 `ITEM_TYPE` 都是 **15 = ITEM_AMULET**。固定 `ITEM_getEquipPlace()` 將 `ITEM_AMULET` 映射到 **CHAR_DECORATION1 = equipment slot 3**。

固定 build 同時開啟 `_ITEM_EQUITSPACE` 與 `_EQUIT_NEWGLOVE`，所以完整裝備區是：

0 HEAD、1 BODY、2 ARM、3 DECORATION1、4 DECORATION2、5 BELT、6 SHIELD、7 SHOES、8 GLOVE。

但 `CHECK_ITEM_RELIFE()` 仍硬寫只掃 **slot 0..4**；relife 五件剛好全部落在 slot 3，可被該舊掃描範圍看到。

### Source-backed trust boundary

V1.68 的 lifecycle 測試 descriptor 曾可直接帶 `dieRelifeFunc` / `hpArgument`。V1.69 改為：

1. 先用 existing item index 通過 ITEM_CHECKINDEX 等價檢查
2. 從 existing item 取得真正 ItemId
3. ItemId 必須在固定 `stoneage_item_relife_runtime.json` 找得到
4. template 的 `relifeFunc` 必須真的是 `ITEM_DIErelife`
5. HP argument、名稱、equip place 全部只讀 source template

所以任意物品就算外部 descriptor 偽造 `dieRelifeFunc=true` 或 `hpArgument=FULL`，也不會被當成死亡復活裝備。

### Exact fixed modifiers

替身娃娃 Lv1/Lv2/Lv3 的裝備 modifier 全為 0。

祈福戒指 21128：

- ATK +75
- DEF +75
- QUICK +75
- MAXHP +200

VIP祈福戒指 19180：

- ATK +90
- DEF +90
- QUICK +90
- MAXHP +250
- MAXMP +80

以上 min/max pair 均相同，所以**生成出的 modifier 數值不需要猜**；但 V1.72 後已確認固定 `ITEM_makeItem()` 仍會對全部 66 個 `ITEM_DATAINT` 欄位逐一執行一次 `RAND(0, randomdata[i])`。因此即使 random width = 0，建立這些物品仍固定消耗 **66 顆 RNG**。

### Acquisition boundary

目前固定 repo 已可直接證明：

- Item 20131 出現在 `GMQUE_AddQueStrTrophy()` 的 `itemID1` 隨機獎勵池。

其餘 20132 / 20133 / 21128 / 19180 在目前已索引固定 C 原碼中尚未找到可直接證明的玩家取得入口，因此 V1.69 **不自動送、不塞商店、不猜掉落來源**。

### Current production boundary

Web 現階段仍沒有 source-backed Player equipment-slot lifecycle，因此：

- relife runtime 已正式載入
- 戰鬥 relife 核心已只接受真實 source template
- `sourcePlayerEquippedRelifeItems()` 仍保持空 adapter
- 不會因為已知道 ItemId 就憑空讓玩家裝備或取得它們
- save schema 27 不變

下一步應先移植固定 `CHAR_moveItemFromItemBoxToEquip` / `ITEM_equipEffect` 與 Player equipment slot lifecycle，再把這 5 件真正接入可裝備狀態。

### Regression

- generated relife runtime：5 templates / exact ItemIds PASS
- source HP argument 200 / 500 / FULL PASS
- all type 15 / CHAR_DECORATION1 slot 3 PASS
- arbitrary ItemId cannot spoof relife PASS
- runtime ItemId overrides forged descriptor PASS
- normal death / Ultimate exclusion retained
- slot 0..4 scan retained
- inner / outer AddProfit relife ordering retained
- existing item consumption retained
- relife core 0 RNG retained
- capture / attack / guard pending gates retained
- targeted V1.69 regression: **36 / 36 PASS**
- committed `game.js` syntax PASS
- save schema 27 unchanged


## V1.70 Player equipment slot lifecycle

固定來源：`gavinlinasd/StoneAge@1f90cb6cb57c1df70f39cde77a5a8ccd98b66c56`。

核心 commits：

- `56cc289cbd142975aeae0e9a1e627876589d3328` — relife runtime 補齊裝備需求、attach/detach 與 fixed 9+15 slot metadata
- `77072c0a995add7d35f5a52431b0629dfce8e5bd` — 建立 Player 9 裝備格 + 15 背包格 lifecycle、來源 compliance 與正式 relife equipment adapter
- `3ebc268845930af98325322104532ab54c674cc6` — 修正 JS `Number(null)===0` 對空 item slot 的誤判

### Fixed Player item layout

固定 build 同時開啟 `_ITEM_EQUITSPACE` 與 `_EQUIT_NEWGLOVE`：

- 0 = CHAR_HEAD
- 1 = CHAR_BODY
- 2 = CHAR_ARM
- 3 = CHAR_DECORATION1
- 4 = CHAR_DECORATION2
- 5 = CHAR_EQBELT
- 6 = CHAR_EQSHIELD
- 7 = CHAR_EQSHOES
- 8 = CHAR_EQGLOVE
- 9..23 = 15 格一般背包

V1.70 新增 `playerItemSlots[24]` 作為 CHAR item slot 的 Web 對應。

舊版 Web 只有 aggregate `inventory` 與部分 existing `itemRuntime` owner，沒有保存歷史 CHAR slot。pre-schema28 存檔因此**不做反推**，一律以空 `playerItemSlots` 起始；不把「玩家擁有」猜成「曾放在哪一格／曾裝備」。

save schema：**27 -> 28**。

### Backpack -> equip exact move

固定 `CHAR_moveItemFromItemBoxToEquip()`：

1. source existing item 必須有效
2. 檢查 Level / STR / DEX / Transmigration / Profession
3. 由 `ITEM_getEquipPlace()` 決定合法裝備格
4. 一般裝備只能進 canonical slot
5. canonical `CHAR_DECORATION1` 是特例，可放 slot 3 或 slot 4
6. slot 3/4 另一格若已有**相同 ITEM_TYPE**，禁止再裝第二件同類型
7. 目的裝備格已有物品時，合法情況會交換回原背包格
8. 先換 CHAR item slot，再 detach 舊裝、attach 新裝
9. 回到 `CHAR_moveEquipItem()` 後統一跑 `CHAR_complianceParameter()`

目前 source-backed 五件 relife template：

- Level 0
- NeedSTR / NeedDEX / NeedTRANS / NeedPROFESSION 全 0
- attachFunc / detachFunc 全空
- ITEM_TYPE 全為 15 = ITEM_AMULET
- canonical equip place 全為 CHAR_DECORATION1

因此五件之間最多只能同時裝一件；可在 slot 3 或 slot 4，但不能兩格各裝一個 ITEM_AMULET。

### Equip -> backpack exact move

固定 `CHAR_moveItemFromEquipToItemBox()`：

- 背包目的格為空：直接卸裝到該格
- 背包目的格已佔用：**不是普通交換**
- 來源會反向呼叫 `CHAR_moveItemFromItemBoxToEquip(index,toindex,fromindex)`
- 也就是背包內那件物品必須能合法裝進原裝備格，交換才成立
- 若背包物不是合法裝備，整次 move 失敗，兩格保持不變

固定 `CHAR_moveEquipItem()` 同時禁止直接「裝備格 -> 裝備格」移動或交換；即使另一裝備格是空的也拒絕。

### Full compliance rebuild, not incremental +/- stats

固定：

`CHAR_complianceParameter()`
-> `CHAR_initcharWorkInt()`
-> `ITEM_equipEffect()`

`ITEM_equipEffect()` 每次重新掃整個 `CHAR_EQUIPPLACENUM`，再一次性累加所有裝備 modifier。

V1.70 因此不使用「裝上 +75、卸下 -75」的增量模型，而是 `playerItemSlots` 作唯一裝備真相，每次裝備 move 後完整重算：

- Attack
- Defence
- Quick
- MaxHP
- MaxMP

固定 `_FIX_MAXCHARMP` 已開：

- MaxHP clamp 0..10,000,000
- MaxMP clamp 0..1000
- compliance 完成後目前 HP / MP 只做 `min(current,max)`
- 裝上增加 MaxHP/MP **不會補血補魔**
- 卸下若新上限下降，當前 HP/MP 會被截到新上限

### Relife consumption source oddity

固定 `ITEM_DIErelife()` 成功後：

1. `BATTLE_MultiReLife()`
2. `CHAR_setItemIndex(charaindex, eqw, -1)`
3. `ITEM_endExistItemsOne(itemindex)`
4. send item data
5. return

這裡**沒有**：

- detach callback
- `CHAR_complianceParameter()`

因此祈福戒指／VIP祈福戒指死亡消失時，該次 battle round 已建立的 WORK 攻防敏/MaxHP/MaxMP 不會在消耗瞬間立刻重算。

固定下一輪 `BATTLE_PreCommandSeq()` 才再次：

`CHAR_complianceParameter() -> ITEM_equipEffect()`

所以 V1.70 也保留：

- relife 當下先清 equip slot + existing item
- **不立即扣掉本輪已建立的裝備 WORK**
- 下一個 round PreCommand 才依目前空裝備格重新計算並失去戒指 bonus
- 若 MaxHP/MP 因此下降，再依 compliance 規則 clamp 當前 HP/MP

Web `normalBattleOrder()` 現在也在每輪 PreCommand 對 Player 執行 `playerComplianceParameter(state)`，對齊這個時序。

### Production relife adapter

V1.69 的 `sourcePlayerEquippedRelifeItems()` 是空 adapter。

V1.70 已改為真正讀：

`playerItemSlots[0..4] -> existing item index -> itemRuntime -> fixed relife template`

因此只要後續有來源正確的 acquisition / backpack registration，把這五件 existing item 放進 slot 3 或 4，V1.68/V1.69 的死亡復活 lifecycle 就能直接正式運作。

目前仍**沒有自動送替身娃娃、沒有捏造 GMQUE 結果、沒有新增裝備 UI 按鈕**。

### Regression

- game.js syntax PASS
- source relife runtime：5/5 attach/detach blank PASS
- 5/5 equip requirements = 0 PASS
- fixed 9 equip + 15 backpack layout PASS
- existing item register -> backpack slot 9 PASS
- Lv1/Lv2/Lv3 / rings decoration slot 3/4 rules PASS
- same ITEM_TYPE decoration pair exclusion PASS
- direct equip->equip move/exchange rejection PASS
- backpack->occupied equip legal swap PASS
- equip->occupied backpack reverse-equip rule PASS
- unsupported reverse equip leaves slots unchanged PASS
- 祈福戒指 +75/+75/+75/+200 PASS
- VIP祈福戒指 +90/+90/+90/+250/+80MP PASS
- equip does not heal HP PASS
- unequip full rebuild + HP/MP clamp PASS
- relife clears real equip slot + existing item + aggregate count PASS
- relife does not immediately compliance PASS
- later compliance removes consumed ring bonus PASS
- Ultimate exclusion retained PASS
- HP0 before AddProfit/ISDIE exclusion retained PASS
- actor outer relife ordering retained PASS
- dead CHAR item move rejection PASS
- wrong equip slot rejection PASS
- JS null item slot is not existing item index 0 PASS
- pre-schema28 no slot-history guessing PASS
- V1.67 Marefia 4 RNG retained
- V1.68/V1.69 relife lifecycle retained
- targeted V1.70 regression: **41 / 41 PASS**


## V1.71 Source item acquisition / GMQUE trophy runtime

固定來源：`gavinlinasd/StoneAge@1f90cb6cb57c1df70f39cde77a5a8ccd98b66c56`。

核心 commits：

- `2796f0b99ab4e2290cd7eee7e6e7cb98dd653700` — 建立 `stoneage_gmque_trophy_runtime.json`
- `8b2b3e2473d45f17dbf181ab7d495adbc0a4d5da` — 接入 `CHAR_addItemSpecificItemIndex` 等價 acquisition lifecycle，修正 tracked battle loot 的 15 格背包行為
- `c41ab8e5ce61efc941eecf8d8f265e2f3ba99eb5` — 把 20131 的固定 GMQUE 取得路徑與精確機率寫回 relife runtime

### CHAR_addItemSpecificItemIndex exact lifecycle

固定 `CHAR_addItemSpecificItemIndex()`：

1. existing item index 必須有效
2. `CHAR_findEmptyItemBox()` 從 `CHAR_STARTITEMARRAY = 9` 開始找第一個空格
3. 玩家總 item slot 為 0..23，所以一般背包固定是 **9..23 共 15 格**
4. 有空格：
   - CHAR item slot = existing item index
   - ITEM_WORKCHARAINDEX = Player
   - ITEM_WORKOBJINDEX = -1
   - 回傳該 CHAR slot index
5. 無空格：回傳 `CHAR_MAXITEMHAVE = 24`

V1.71 新增 `sourcePlayerAddSpecificExistingItem()`，所有有 source existing index 的新取得路徑都共用這個規則。

### Battle get-item full-bag fix

固定 `BATTLE_AddProfit()` 對 `pEntryChara->getitem[]`：

- 玩家活著且背包有空格 -> `CHAR_addItemSpecificItemIndex()`
- 成功才算真正拾獲
- 背包滿 / add 失敗 -> `ITEM_endExistItemsOne(itemindex)`
- 無論成功失敗，該 battle getitem slot 最後都清成 -1

V1.71 修正先前 Web tracked battle drop：

- 成功：existing item 進第一個空的 playerItemSlots 9..23，owner 改 player，aggregate inventory +1
- 滿包：existing item 直接 free
- 滿包時 **不再產生只有 inventory 數字、沒有 existing item / CHAR slot 的 phantom loot**

沒有 source existing index 的舊版／手工 fallback 仍保留舊 aggregate path，避免替歷史資料捏造 allocation。

### GMQUE action RNG is NOT the same RAND macro

固定 `GMQUE_CheckQueStr()` 第一次決定獎勵類型：

```c
GMQUEACTION = rand()%100;
GMQUEACTION = (GMQUEACTION<1)?1:GMQUEACTION;
```

因此 raw 0 與 raw 1 最後都變成 1。

100 個 raw outcome：

- Gold：normalized 1..40 = **41 / 100**
- Item：41..97 = **57 / 100**
- Pet：98..99 = **2 / 100**

這一步不是 inclusive `RAND(0,99)` helper，V1.71 用獨立的 modulo-roll helper 保留語意。

### GMQUE item branch

進 Item branch 後 `GMQUE_AddQueStrTrophy()` 才使用 fixed inclusive：

`RAND(x,y) = x..y`

先抽 `RAND(0,100)`：

- 0 -> itemID3[ RAND(0,1) ]
- 97..100 -> itemID2[ RAND(0,5) ]
- 70..96 -> itemID4[ RAND(0,7) ]
- 40..69 -> itemID5[ RAND(0,7) ]
- 1..39 -> itemID1[ RAND(0,8) ]

itemID1：

`[20131,20594,20171,17005,20210,20211,20212,20213,2435]`

所以固定 20131（替身娃娃 Lv1）：

- conditional on Item branch = `39/101 * 1/9 = 13/303`
- including GMQUE action-type roll = **`57/100 * 13/303 = 247/10100`**
- 約 **2.4455% / 一次成功進入獎勵類型判定**

這只是固定 C 的程式機率，不代表目前 Web 已開放 GMQUE 活動。

### GMQUE Pet source bug retained

固定宣告：

```c
int petID[4]={1642,1636,475};
rands = RAND(0,3);
```

C 會把未明寫的 `petID[3]` 自動補 0。

因此 Pet branch 有四個等可能 selection index：

- 0 -> 1642
- 1 -> 1636
- 2 -> 475
- 3 -> **0**

index 3 會拿 0 去做 `ENEMY_getEnemyArrayFromId(0)` / pet creation，可能在 `GMQUE_AddQueStrTrophy()` 中直接失敗並於 cleanup 前 return FALSE。

V1.71 resolver 保留這個 implicit-zero 分支，不把它「修好」成三選一。

### GMQUE Gold branch

Item / Pet 之外：

`RAND(0,30)`

- 15..30 -> 20,000
- 10..14 -> 50,000
- 0..9 -> 再 `RAND(2,4)`
  - 2 -> 100,000
  - 3 -> 150,000
  - 4 -> 200,000

### Relife acquisition boundary

固定 source 目前已直接證明：

- **20131 替身娃娃 Lv1**：GMQUE itemID1 pool index 0

目前仍沒有在固定 C 已索引程式碼與這輪高價值 data 表中直接確認：

- 20132 替身娃娃 Lv2
- 20133 替身娃娃 Lv3
- 21128 祈福戒指
- 19180 VIP祈福戒指

V1.71 不替這四件新增商店、任務或掉落來源。

另外，不同外部版本的道具編號可能不同；本專案繼續只以固定 `1f90cb...` 的 `itemset6.txt` 為準。

### Current GMQUE boundary

V1.71 已來源化：

- action-type roll
- item pool primary + secondary selection
- pet pool，包括 implicit zero bug
- gold reward resolver
- existing item -> Player 15-slot backpack lifecycle

但尚未把完整 GMQUE 活動 UI / 抓寵目標生成 / 交寵流程接進 Web。

因此目前**不會因為 runtime 已存在就自動抽獎或發 20131**。

### Regression

- game.js syntax PASS
- GMQUE runtime format PASS
- action 0 -> 1 fold PASS
- Gold / Item / Pet boundary 40 / 41 / 97 / 98 PASS
- item primary 0 / 40 / 70 / 97 / 100 bucket boundaries PASS
- itemID1 primary 1..39 PASS
- 20131 = itemID1 index 0 PASS
- Pet index 3 -> implicit item 0 failure PASS
- Gold one-RNG / two-RNG branch counts PASS
- AddSpecific first empty = slot 9 PASS
- AddSpecific owner/source transition PASS
- AddSpecific aggregate inventory +1 exactly once PASS
- AddSpecific full bag returns 24 PASS
- full bag leaves prior owner unchanged before caller cleanup PASS
- tracked BattleGet success enters playerItemSlots PASS
- tracked BattleGet full bag frees existing item PASS
- tracked BattleGet full bag creates no aggregate phantom PASS
- legacy/player existing registration does not double inventory PASS
- schema 28 unchanged
- targeted V1.71 regression: **41 / 41 PASS**


## V1.72 ITEM_makeItem / ITEM_makeItemAndRegist RNG lifecycle

固定來源：`gavinlinasd/StoneAge@1f90cb6cb57c1df70f39cde77a5a8ccd98b66c56`。

核心 commits：

- `82e29367cd3d7c9f726d35aac2f67b6082860f61` — 建立 `stoneage_item_make_runtime.json`，固定 66 個 ITEM_DATAINT 與 item creation RNG metadata
- `0a80accb3a828cbea3385767be823805b2d3a76d` — `game.js` 接入 ITEM_makeItem 66-call lifecycle，修正 Enemy 掉落 item creation 交錯順序

### ITEM_makeItem consumes RNG for every integer field

固定 `ITEM_makeItem()`：

```c
if (ITEM_CHECKITEMTABLE(number) == FALSE) return FALSE;

memcpy(itm, &ITEM_tbl[number].itm, sizeof(ITEM_Item));

for (i = 0; i < ITEM_DATAINTNUM; i++) {
    int randomvalue;
    randomvalue = RAND(0, ITEM_tbl[number].randomdata[i]);
    itm->data[i] = ITEM_tbl[number].itm.data[i] + randomvalue;
}

itm->data[ITEM_LEAKLEVEL] = 1;
```

固定 build 展開後：

**ITEM_DATAINTNUM = 66**

所以一件有效 template 每次進入 `ITEM_makeItem()`，固定先消耗：

**66 次 rand()**

這和實際有幾個可變能力欄位無關。

### RAND(0,0) still consumes rand()

固定 `util.h`：

```c
#define RAND(x,y) ((x-1)+1 + (int)((double)(y-(x-1))*rand()/(RAND_MAX+1.0)))
```

代入 `RAND(0,0)`：

- 結果永遠是 0
- 但 expression 內的 `rand()` 仍實際執行一次
- 因此 RNG state 仍向前一格

這修正了 V1.69 當時「min=max，所以 item creation 不需要 RNG」的舊理解。

正確說法是：

- min=max -> **結果值不需猜**
- ITEM_makeItem -> **仍固定消耗 66 顆 RNG**

### Fixed ITEM_DATAINT order

固定 `version.h` 已再次核對，這個 build 同時開啟：

- `_SIMPLIFY_ITEMSTRING`
- `_SIMPLIFY_ITEMSTRING2`
- `_ITEMSET2_ITEM`
- `_ITEM_INSLAY`
- `_Item_ReLifeAct`
- `_ITEM_MAXUSERNUM`
- `_ITEMSET4_TXT`
- `_TAKE_ITEMDAMAGE`
- `_ADD_DEAMGEDEFC`
- `_SUIT_ITEM`
- `_ITEMSET5_TXT`
- `_ITEMSET6_TXT`
- `_FIX_ITEMPROB`

因此固定 parser 的 **`ITEM_ID_TOKEN_INDEX = 17`**，不是 15。前 16 token 包含 name / secretname / effect / argument、`_ITEM_INSLAY` 的 2 欄、9 個 callback 欄與 `_Item_ReLifeAct` 的 relifefunc；第 17 token 才是 Item ID。

V1.72 generated runtime 保存固定 build 的完整 66 欄順序。

主要包含：

- ID / image / cost / type / field / target / level
- durability / pile / equip requirements
- damage / suit
- attack count
- equipment attack / defence / quick / HP / MP / luck / charm / avoid
- attribute / magic
- arrange / sequence / attach pile / hit right / neglect guard
- poison / paralysis / sleep / stone / drunk / confusion / critical
- logout / drop / mail / merge flags
- ingredient values
- put time / leak level / merge / crush
- VAR1..VAR4

固定 parser 中真正使用 `ITEM_getRandomValue()` 的 range 欄位共 **15 個**：

- MODIFYATTACK
- MODIFYDEFENCE
- MODIFYQUICK
- MODIFYHP
- MODIFYMP
- MODIFYLUCK
- MODIFYCHARM
- MODIFYAVOID
- POISON
- PARALYSIS
- SLEEP
- STONE
- DRUNK
- CONFUSION
- CRITICAL

parser 規則：

`base = min(a,b)`

`randomwidth = ABS(b-a)`

但 `ITEM_makeItem()` 並不只迴圈這 15 欄，而是迴圈**全部 66 欄**。

### ITEM_makeItemAndRegist exact order

固定：

```text
ITEM_makeItem()
  -> 66 RAND calls
  -> ITEM_LEAKLEVEL = 1
ITEM_initExistItemsOne()
  -> round-robin existing item slot scan
  -> initfunc
  -> ITEM_constructFunctable()
```

固定 `itemset6.txt` 10,737 筆資料已掃描：

**非空 initfunc = 0 筆**

因此目前固定 itemset6 不會在 allocation 成功後再由 initfunc 額外插入未知 RNG。

### Invalid template versus full existing array

兩個失敗邊界的 RNG 時序不同。

不存在 ITEM_tbl 的 ItemId：

```text
ITEM_CHECKITEMTABLE fail
-> return FALSE
-> 0 item-make RNG
```

有效 ItemId，但 existing item array 已滿：

```text
ITEM_makeItem success
-> 已消耗 66 RNG
-> ITEM_initExistItemsOne 掃不到空 existing slot
-> return -1
```

也就是「配置 existing index 失敗」不能把前面的 66 顆 RNG 回滾。

V1.72 的 `sourceItemRuntimeAlloc()` 已按這個順序處理。

### Existing item metadata

V1.72 完整 materialization 後，新建立的 Web existing slot 現在記錄：

- `sourceMakeRngCalls = 66`
- `sourceMakeMaterialized = true`
- `sourceData = [66 個生成後 ITEM_DATAINT]`
- `leakLevel = 1`

`sourceData` 是同一次 `ITEM_makeItem()` 逐欄 RNG 後真正得到的 data，不是 template 平均值，也不是事後重抽。

舊 schema28 existing item 沒有 creation-time `sourceData` 時，不反推當時不存在的 roll；normalize 只保留真的存在的 history。對舊裝備只有來源能確定 min=max 時才沿用 deterministic fallback，min!=max 不猜。

save schema 仍為 **28**。

### Enemy carried drop ordering correction

固定 `enemy.c` 不是：

```text
先抽完 10 格掉落
-> 再建立所有中獎 item
```

而是：

```text
slot 1 probability RAND
  -> 若命中，立即 ITEM_makeItemAndRegist = 66 RNG
slot 2 probability RAND
  -> 若命中，立即 66 RNG
...
slot 10
```

固定 `_FIX_ITEMPROB` 使用：

`RAND(0,999) < ITEMPROB`

所以如果：

- slot1 命中
- slot2 有 probability

RNG 時序必須是：

```text
call 0     slot1 probability
call 1-66  slot1 ITEM_makeItem
call 67    slot2 probability
```

V1.72 已將 `rollEnemyDropSlots()` 改為命中後立即建立 existing item，不再 batch。

兩格都命中時：

`1 + 66 + 1 + 66 = 134` 次 source RNG call。

### STYLE weapon / RandomChange ordering

固定 Enemy 建立：

```text
carried item slot loop
-> STYLE weapon ITEM_makeItemAndRegist
-> ENEMY_RandomChange
-> 若 human DoujyouRandomWeponSet：
     free 原 CHAR_ARM
     抽 dojo weapon
     有武器則 ITEM_makeItemAndRegist
-> CHAR_complianceParameter
```

目前 source-backed Enemy 自動武器 runtime 共 8 個模板：

`0 / 100 / 200 / 400 / 500 / 600 / 700 / 2498`

目前這 8 個模板的相關 equipment modifier pair 均 min=max，因此數值可以直接由來源確定；但 STYLE / dojo weapon 每次真正建立 existing item，仍各自消耗完整 **66 RNG**。

### Web-only identity must not consume source RNG

舊 Web Enemy unit id 曾使用：

`Math.random().toString(36)`

這會在 source RNG 流程中插入一顆完全不存在於原 C 的亂數。

V1.72 改成單純遞增的 `sourceEnemyUnitSerial` 作 Web bookkeeping。

因此 unit identity 不再污染：

- drop probability
- item creation
- STYLE weapon
- ENEMY_RandomChange
- dojo weapon

之間的 source RNG 時序。

### Full item-create materialization

V1.72 現在已經不再停在「只知道 66 次 call count」的邊界。

新增 deterministic generator：

`tools/generate_item_make_runtime.py`

它直接抓固定：

- repo：`gavinlinasd/StoneAge`
- ref：`1f90cb6cb57c1df70f39cde77a5a8ccd98b66c56`
- path：`gmsv/data/itemset6.txt`
- Git blob SHA：`eac985796b59286c547db2abce7b3d604a5e6226`

生成前先自行重算 Git blob SHA；不是這個 blob 就直接失敗，不接受近似鏡像。

generated runtime 已升為：

`stoneage-item-make-runtime-v2`

完整來源結果：

- templates：**10,737**
- syntax error：**0**
- duplicate Item ID：**0**
- 有至少一個非 0 randomwidth 的 template：**5,521**
- 全表非 0 randomwidth 欄位：**11,092**
- 已用既有 Enemy 裝備 runtime 交叉驗證：**8 / 8**
- 已用 relife item runtime 交叉驗證：**5 / 5**

為避免網頁額外膨脹，runtime 用 source default + sparse override 保存，但可無損重建每個 ItemID 的：

- 66 個 base
- 66 個 randomwidth

`sourceItemRuntimeAlloc()` 現在：

1. 驗證 Item ID。
2. 從 v2 runtime 重建該 Item 的完整 66 base / width。
3. 依欄位 0 → 65 每欄各呼叫一次 `cRand(0,width)`。
4. 寫入 `base + roll`。
5. 66 欄完成後把 `ITEM_LEAKLEVEL = 1`。
6. 再開始 existing-index round-robin scan。
7. allocation 成功才把這次真正生成的 66 欄 `sourceData` 保存進 existing slot。

因此：

- width = 0：仍消耗 RNG，data 不變。
- width > 0：消耗同一顆 RNG，而且實際 roll 會保存。
- existing array 已滿：66 顆已經消耗，但 temporary item 不會變成 existing slot。
- v2 runtime 若缺 template / 結構錯誤：直接 fail closed，不自行猜 base / width。

Player / Enemy compliance 若 existing slot 有 `sourceData`，會優先讀當次真正 roll 出來的 modifier；legacy slot 才使用可證明 deterministic 的舊 fallback。

### GMQUE 20131 lifecycle check

V1.71 已確認：

`itemID1[0] = 20131`

V1.72 專項回歸現在把 GMQUE 的 item pool 與 item-create runtime 串在同一個驗證裡：

- GMQUE `itemID1` index 0 = **20131**
- 20131 template 存在
- 選到 20131 後的 item-create loop = **66 calls**
- 20131 本身本輪非 0 randomwidth 欄位 = **0**
- 66 個 width=0 欄仍全部消耗 RNG
- `ITEM_LEAKLEVEL` 最終 = **1**

所以「GMQUE 先抽到 20131」與「之後 `ITEM_makeItemAndRegist(20131)` 再吃 66 顆 RNG」是兩段獨立 source RNG lifecycle，已確認。

### Regression

原 V1.72 call-count / ordering regression 已保留；本輪另外把可重跑的檢查正式提交：

- `tools/check_v172_item_make_runtime.mjs`
- `.github/workflows/generate-item-make-runtime.yml`

GitHub Actions 本輪結果：

- fixed itemset6 blob SHA 驗證 PASS
- deterministic runtime regenerate PASS
- 10,737 templates PASS
- 5,521 randomized templates PASS
- 11,092 nonzero randomwidth fields PASS
- 8 個既有 Enemy 裝備 template cross-check PASS
- 5 個 relife template cross-check PASS
- `game.js` `node --check` PASS
- GMQUE 20131 item-create = 66 calls PASS
- variable-width template 仍固定 66 calls PASS
- width=0 欄仍存在於 66-call loop PASS
- Enemy carried drop：probability → 命中後 item-create → 下一格 probability 的 interleave PASS
- carried drop → STYLE existing item → `ENEMY_RandomChange` → dojo replacement → compliance 的結構順序 PASS
- `ITEM_makeItem` 在 existing-slot scan 前執行 PASS
- generated runtime 第二次重建無 diff PASS

最新 CI regression：**PASS**



## V1.73 generic player equipment / ITEM_equipEffect lifecycle

V1.73 由 V1.72 已 materialize 的 66 欄 `sourceData` 繼續向固定原 C 的玩家裝備流程推進。

固定來源仍為：

- `gavinlinasd/StoneAge@1f90cb6cb57c1df70f39cde77a5a8ccd98b66c56`
- `gmsv/src/item/item.c`
- `gmsv/src/char/char.c`
- `gmsv/src/char/char_item.c`
- `gmsv/src/battle/battle.c`
- `gmsv/src/battle/battle_event.c`

### 9 equip slots / ITEM_getEquipPlace

固定 9 格：

`頭 / 身 / 武器 / 飾品1 / 飾品2 / 腰帶 / 盾 / 鞋 / 手套`

index：

`0 / 1 / 2 / 3 / 4 / 5 / 6 / 7 / 8`

固定 Item Type 對應已接入：

- 0 / 1 / 2 / 3 / 17 / 18 / 19 -> 武器格
- 6 -> 頭
- 7 -> 身
- 8～15 -> 飾品1；移動時可落在飾品1／2，但同 ITEM_TYPE 不可同時兩件
- 4 弓 -> 武器格，且盾存在時原 C 不允許
- 24 -> 腰帶
- 25 -> 盾；武器格是弓時原 C 不允許
- 26 -> 鞋
- 27 -> 手套

職業二刀流是固定原 C 的額外分支，但目前 Web 沒有完整 profession skill runtime，因此不假設玩家擁有二刀流。

### Equip requirements use raw CHAR scale

固定角色建立把：

- `CHAR_STR = str * 100`
- `CHAR_DEX = dex * 100`

而 `CHAR_moveItemFromItemBoxToEquip()` 直接比較：

- `CHAR_STR >= ITEM_NEEDSTR`
- `CHAR_DEX >= ITEM_NEEDDEX`

因此 Web 裝備需求已修正為：

- `playerStats.str * 100`
- `playerStats.dex * 100`

再與 Item 的 raw requirement 比較。

這避免把原 C 裝備需求門檻錯縮小 100 倍。

### Callback safety boundary

V1.73 generator 額外保存 fixed itemset 的：

- init callback
- attach callback
- detach callback

完整 10,737 templates 掃描結果：

- init callback：**0**
- attach callback：**260**
- detach callback：**260**

因此一般純數值裝備可以安全沿用 `sourceData`。

但有非空 attach / detach callback 的 260 件特殊裝備目前維持：

`callback-unported`

不會把 callback 副作用忽略後強行允許裝備。

另外目前仍 fail-closed：

- `ITEM_NEEDPROFESSION != 0`
- 使者／勇者信物 Item 2884 / 2885
- 玩家弓／回力標／投擲斧／投擲石的完整特殊攻擊 pattern

### ITEM_equipEffect values

玩家 compliance 現在從每件 equipped existing item 當次真正生成的 `sourceData` 累加：

- attack / defence / quick
- HP / MP
- luck / charm / avoid
- poison / paralysis / sleep / stone / drunk / confusion resistance
- critical Work
- other damage / other defence
- arrange / sequence
- attach pile
- hit right
- neglect guard
- four attribute modifiers

主要 clamp 保留固定原 C：

- attack >= 0
- defence >= -100
- quick >= -100
- HP 0..10,000,000
- MP 0..1000
- luck 1..5
- charm 0..100
- six abnormal resistances -100..100
- critical / other damage / other defence -100..100
- arrange 0..1000
- sequence / attach pile / hit right / neglect guard：raw accumulation

四屬性則保留固定 Work lifecycle：

1. base 正屬性先把相反屬性設成負值。
2. 裝備屬性加到自身。
3. 同一裝備屬性量從另外三屬全部扣除。
4. 只做 upper clamp 100；不自行補 lower clamp。

### Fixed WORKFIXAVOID accumulation quirk

固定 `CHAR_initcharWorkInt()` 會重設大部分裝備相關 Work，但 source 裡找不到它重設：

`CHAR_WORKFIXAVOID`

而 `ITEM_equipEffect()` 仍會：

`WORKFIXAVOID += ITEM_MODIFYAVOID total`

因此同一 server process 內每次 compliance 都可能再次累加 equipped avoid。

V1.73 保留這個原 C quirk：

- 同一 Web session 的 repeated compliance 會累加。
- `playerEquipCompliance` 視為 transient Work state。
- reload / login 時不從 LocalStorage 恢復這份 derived Work snapshot，重新由 0 建立，等價新的 server runtime Work array。

目前固定 source 搜描沒有找到 `CHAR_WORKFIXAVOID` 的實際戰鬥 consumer，所以不自行把它接成另一種閃避公式。

### Battle consumers

V1.73 已把可證明的裝備 Work 值接到既有戰鬥端：

- `WORKFIXLUCK` -> player status / critical 相關 luck
- `WORKFIXCHARM` -> capture + Pet FIXAI host charm
- 六異常抗性 -> player status resistance
- ARM `ITEM_CRITICAL` -> player weapon critical
- ARM `ITEM_ATTACKNUM_MIN/MAX` -> `BATTLE_GetAttackCount` weapon RNG
- `WORKHITRIGHT` -> `BATTLE_DuckCheck`
- `WORKNEGLECTGUARD` -> `BATTLE_DamageCalc` defence reduction
- `WORKOTHERDMAGE / WORKOTHERDEFC` -> additional damage / defence RNG
- equipped four attributes -> battle element Work values

捕獲公式也改讀裝備後的：

- `WORKFIXDEX`
- `WORKFIXLUCK`
- `WORKFIXCHARM`

注意：fixed `BATTLE_MagicDodge` 讀的是 raw `CHAR_LUCK`，不是 `WORKFIXLUCK`，所以該路徑不因裝備 luck 而改寫。

### Fractional RAND macro correction

V1.73 regression 發現：

- 非零 `HITRIGHT` templates：3
- 非零 `OTHERDAMAGE` templates：151
- 非零 `OTHERDEFC` templates：101
- 非零 `NEGLECTGUARD` templates：1
- 非零 `MODIFYAVOID` templates：203

`HITRIGHT * 0.8 / 1.2` 在 fixed itemset 的非零值上都仍是整數。

但 `OTHERDAMAGE / OTHERDEFC * 0.3` 存在會產生小數的來源值：

`5 / 25 / 45 / 55 / 85 / 95 / 105 / 115 / 125 / 135`

因此不能直接用 Web 舊的 integer `cRand()` 近似。

V1.73 新增 `sourceCRandMacroValue()`，保留固定 macro：

`(x-1)+1+(int)((y-(x-1))*rand/(RAND_MAX+1.0))`

的「inner product 先截斷、macro expression 可暫時帶小數」行為。

`otherpower` 則在：

`RAND(apower*0.3,apower) - RAND(dpower*0.3,dpower)`

完成兩顆 RAND expression 相減後，才按 C 的 int assignment 截斷。

### Reachable equipment UI

V1.70～V1.72 雖已有 9 equip + 15 backpack lifecycle，但 `sourcePlayerMoveItem()` 原本沒有 UI caller。

V1.73 新增：

- 9 格 source-backed 裝備 UI
- 15 格 existing-item 背包 UI
- 裝備按鈕
- 卸下按鈕

UI 本身不直接改裝備數值；所有操作仍經：

`sourcePlayerMoveItem()`

因此會繼續使用原 C 對齊的：

- equip-place gate
- level / STR / DEX / transmigration requirement
- same-type decoration rule
- bow / shield gate
- callback / profession / special-item fail-closed
- full compliance rebuild

條件／任務道具的 aggregate inventory UI 與 source existing-item 背包分開顯示，避免把沒有 existing index 的 legacy / quest count 當成可裝備 instance。

### V1.73 regression

新增：

`tools/check_v173_item_equip_runtime.mjs`

GitHub Actions 驗證包含：

- V1.72 item-create regression PASS
- game.js syntax PASS
- 10,737 template runtime regenerate PASS
- callback counts 0 / 260 / 260 PASS
- fixed 9-slot / Item Type mapping PASS
- raw STR / DEX ×100 requirements PASS
- callback / profession / special / ranged fail-closed PASS
- ITEM_equipEffect sourceData field coverage PASS
- FIXAVOID repeated-compliance quirk PASS
- derived Work state cleared across reload PASS
- hit-right / neglect-guard / other damage battle consumers PASS
- weapon attack-count RNG PASS
- capture uses fixed luck / charm / dex PASS
- equipment UI exists and has live `sourcePlayerMoveItem()` caller PASS
- generated runtime unchanged PASS

V1.73 CI：**PASS**


## V1.74 player ranged weapon normal-attack pattern

V1.74 從 V1.73 的玩家 source-backed 裝備生命週期繼續往固定 battle command 推進。

固定來源仍為：

- `gavinlinasd/StoneAge@1f90cb6cb57c1df70f39cde77a5a8ccd98b66c56`
- `gmsv/src/battle/battle.c`
- `gmsv/src/battle/battle_event.c`

本版只採用固定原 C 可以直接證明的數值與順序，不自行補猜。

### Ranged equipment gate removed

V1.73 對玩家：

- BOW / type 4
- BOOMERANG / type 17
- BOUNDTHROW / type 18
- BREAKTHROW / type 19

使用 `weapon-pattern-unported` fail-closed。

V1.74 已完成普通 `BATTLE_COM_ATTACK` 可達的遠程 pattern，因此這個裝備 gate 移除；callback / profession / Item 2884 / 2885 的既有安全邊界不變。

### BOW / aBowW

固定順序：

1. `BATTLE_GetAttackCount()` 先消耗 ARM 的 AttackNum RAND。
2. `BATTLE_TargetListSet()` 再固定只消耗一顆 `RAND(0,1)`。
3. 依 raw COM2 的 `defNo % 5`、前後列與 `aBowW[50]` 建出最多 10 格候選。
4. 空格／死亡／不可 TargetCheck 的格只 skip，不增加 `attack_count`。
5. 每次真的完成一段 `BATTLE_Attack -> BATTLE_AddProfit` 後才 `attack_count++`。
6. 到達 primed `attack_max` 就停止；候選表先結束時不為了補滿 AttackNum 重抽或重複同一目標。

Player slot 0、Enemy slot `10 + battleSlot` 的 raw target 若為 10，固定兩組候選為：

- RAND 0：`10,15,12,17,11,16,14,19,13,18`
- RAND 1：`10,15,11,16,12,17,13,18,14,19`

protocol metadata：`BB-w0`。

### BOOMERANG

普通 ATTACK + 回力標會進 fixed dedicated `BATTLE_COM_BOOMERANG`。

重要 RNG lifecycle：

- 前面的武器 AttackNum RAND **照樣先消耗**。
- dedicated BOOMERANG case **不使用**抽到的 AttackNum 值。
- `gBattleDamageModyfy = 0.3`。
- Player 為 side 0，因此 `BoomerangVsTbl[row]` 使用 `k=0 / j=+1` 的正向 5-slot traversal。
- Enemy 既有 side 1 實作維持反向 traversal。
- 原 raw COM2 < 0，或該 row 已無合法目標時，才進 DefaultAttacker fallback。
- dedicated case 完成後直接 break，不進 common Counter loop。

protocol metadata：`BO`。

### BOUNDTHROW / BREAKTHROW

兩者沿用 common physical multi-hit loop：

- AttackNum 仍由 `BATTLE_GetAttackCount()` 取得。
- 每一段都重新從**原 raw COM2**執行 TargetAdjust。
- 原目標已失效時，每一段都可能重新消耗 DefaultAttacker RNG；不把前一段 fallback 目標錯誤沿用到下一段。
- BOUNDTHROW protocol：`BB-w1`
- BREAKTHROW protocol：`BB-w2`

BREAKTHROW 的固定正傷害順序：

`DamageSub / WakeUp -> paralysis StatusAttackCheck -> ItemCrush -> AddProfit`

麻痺沿用 `BATTLE_StatusAttackCheck()` 的固定特殊分支：

`per = 20 - paralysis resistance`

判定：

`RAND(1,100) < per`

目標已有其他 StatusTbl 異常時，在 RAND 前直接失敗；成功寫入 1 回合麻痺。

### Indirect-weapon gates

固定 `BATTLE_IsThrowWepon()` 把四種遠程都視為 indirect weapon。

V1.74 玩家端同步接入：

- BOW 也正式加入 `throwWeapon`；不再只包含 type 17/18/19。
- Guardian substitution 被阻擋。
- Counter 在任一方為四種 indirect weapon 時直接失敗，且不消耗 Counter RNG。
- `ComboCheck()` 不會把持有四種 indirect weapon 的 Player 拉進普通合擊鏈。

### Confusion cross-side boundary

固定 Confusion 可以在 `BATTLE_StatusSeq` 內把 COM1 改為 ATTACK，並把 COM2 指到任一 side。

這代表玩家持遠程武器時可能出現「射向己方 side」的另一套跨 side pattern。

V1.74 **沒有拿普通 PVE 單向 target helper 冒充這條路徑**：

- Confusion 的既有 target-selection RNG 仍先發生。
- 若 Player 當下持遠程武器，該跨 side 攻擊明確 fail-closed。
- 若是 BOW，已知的 `BATTLE_TargetListSet RAND(0,1)` 仍先消耗。
- 真正跨 side 的 Bow / Boomerang / Throw 命中序列留待後續以原 C 單獨來源化。

這符合本專案「原 C 規則優先、不猜數值」：尚未完整證明的分支不以舊 one-hit approximation 假裝完成。

### V1.74 regression

新增：

`tools/check_v174_player_ranged_runtime.mjs`

GitHub Actions 已接入：

- `game.js` syntax check
- V1.72 item-create regression
- V1.73 generic equipment regression
- V1.74 player ranged regression

V1.74 regression 固定檢查：

- Item 400 = BOW / AttackNum 1～3
- Item 500 = BOOMERANG
- Item 600 = BOUNDTHROW
- Item 700 = BREAKTHROW
- ranged equipment fail-closed 已移除
- callback / profession / special-item gates 仍保留
- BOW `RAND(0,1)` / aBowW Player-side 順序
- BOOMERANG Player forward / Enemy reverse traversal
- BOOMERANG 不使用 primed AttackNum 值
- BOUND/BREAK 每段 raw COM2 TargetAdjust
- BREAKTHROW paralysis 在 ItemCrush 前
- four indirect weapons 的 Counter / Combo gate
- ranged Confusion cross-side fail-closed
- `PLAYABLE CORE V1.74`

本輪透過 GitHub 內容直接做 V8 syntax / 靜態 lifecycle 驗證：**PASS**。

目前可用的 commit-workflow 查詢只回傳 PR-triggered run，對本 repo 的 push run 回傳空陣列；因此 README 不把該空結果誤標成「GitHub Actions CI PASS」。workflow 已接好 V1.74 check，實際 push Actions 結果以 GitHub Actions 頁面為準。
