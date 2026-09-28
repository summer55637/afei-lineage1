# 阿肥石器時代放置版

《石器時代 OL》風格的 PC／手機共用純前端單機放置版。

## 目前版本

**PLAYABLE CORE V3.08**

歷史 regression markers：**PLAYABLE CORE V3.08** ／ **PLAYABLE CORE V3.07** ／ **PLAYABLE CORE V3.06** ／ **PLAYABLE CORE V3.05** ／ **PLAYABLE CORE V3.04** ／ **PLAYABLE CORE V3.03** ／ **PLAYABLE CORE V3.02** ／ **PLAYABLE CORE V3.01** ／ **PLAYABLE CORE V3.00** ／ **PLAYABLE CORE V2.99** ／ **PLAYABLE CORE V2.98** ／ **PLAYABLE CORE V2.97** ／ **PLAYABLE CORE V2.96** ／ **PLAYABLE CORE V2.95** ／ **PLAYABLE CORE V2.94** ／ **PLAYABLE CORE V2.93** ／ **PLAYABLE CORE V2.92** ／ **PLAYABLE CORE V2.91** ／ **PLAYABLE CORE V2.90**

## V3.08 — reaction death credit waits for ItemCrush boundary

V3.08 修正反傷 Reaction 的 death/reward source-order：

- fixed `BATTLE_Counter()` 在 Trap／ACUPUNCTURE 反傷後，先完成 `BATTLE_DamageWakeUp()`、death flag 與 `BATTLE_ItemCrushSeq()`，整個 Counter 返回外層後才由 `BATTLE_AddProfit()` 處理死亡獎勵。
- Web 先前在 `sourceFinishProfessionTrapReaction()`／`sourceFinishAcupunctureReaction()` 內直接 `sourceMarkEnemyDeathCredit()`，會早於 ItemCrush。
- 本版改成 reaction 寫入 `sourcePendingDeathCredit`；`sourceBattleFinalizeItemCrushRng()` 完成 defender ItemCrush RNG 後才 finalize death credit。
- Pending credit 有 idempotent guard，避免同一 reaction 被重複 AddProfit。
- 不改反傷數值、WakeUp target、Counter gate、Guardian、RNG 數值。

regression：`tools/check_v308_reaction_death_credit_itemcrush.mjs`
GitHub Actions：`.github/workflows/v308-reaction-death-credit-itemcrush.yml`

## V3.07 — Toxin Weapon uses actual defindex for Acupuncture WakeUp

V3.07 補上固定 C 職業毒素武器的 caller-specific boundary：

- fixed `BATTLE_COM_S_TOXIN_WEAPON` 在 `BATTLE_AttackSeq()` 後若有 Guardian，先把 caller `defindex` 更新為 Guardian。
- `BATTLE_DamageSub()` 觸發 ACUPUNCTURE 後，這個 caller **沒有** primary `BATTLE_Attack()` 的 original-target restore，也沒有像 Counter/GBreak 那樣把 `defindex` 改成 attacker。
- 因此 Toxin Weapon 的 WakeUp target = **actual current defindex**：有 Guardian 就是 Guardian，沒有 Guardian 就是原 target。
- Web shared caller selector 新增 `actual`，只有 Toxin Weapon 顯式使用；primary／Counter／special AttackDamage／GBreak/FallGround matrix 不變。

本版沒有新增 RNG、傷害、Guardian 條件或新的數值。

regression：`tools/check_v307_toxin_weapon_acupuncture_order.mjs`
GitHub Actions：`.github/workflows/v307-toxin-weapon-acupuncture.yml`

## V3.06 — GBreak／GBreak2／FallGround caller-sensitive Acupuncture WakeUp

V3.06 再把三個 special physical caller 收斂回 fixed C：

- `BATTLE_S_GBreak()`：若真正進入 DamageSub，ACUPUNCTURE 後 `defindex` 改成 attacker，WakeUp = attacker。
- `BATTLE_S_GBreak2()`：同樣 WakeUp = attacker。
- `BATTLE_S_FallGround()`：Guardian 只參與 AttackSeq 的 local calc，caller defindex 不更新；ACUPUNCTURE 後仍改成 attacker，WakeUp = attacker。
- Enemy→Pet `FallGround` 現在使用 calc-only Guardian helper：Guardian 可影響傷害計算，但真正承傷者仍是 original Pet；ACUPUNCTURE WakeUp 仍是 attacker。
- ordinary `BATTLE_Attack()`、Counter、Combo 與 V3.05 的 `BATTLE_S_AttackDamage` caller matrix 不變。

本版沒有新增 RNG、傷害、Guardian 條件或新的數值。

regression：`tools/check_v306_gbreak_fallground_acupuncture_order.mjs`
GitHub Actions：`.github/workflows/v306-gbreak-fallground-acupuncture.yml`

## V3.05 — caller-sensitive Acupuncture WakeUp order

V3.05 將 ACUPUNCTURE 的 WakeUp target 從「全域規則」拆回 fixed C caller boundary：

- primary `BATTLE_Attack()`：`DamageSub` 後先恢復 original `defindex/toindex`，所以 WakeUp = original defender。
- `BATTLE_Counter()`：沒有 primary 的 restore，WakeUp = attacker。
- `BATTLE_S_AttackDamage()` 家族：DamageSub 後沒有 restore original target，WakeUp = attacker。
- profession `CHAIN_ATK`：generic profession caller 保留 DamageReact，reaction 後把 `defindex` 改成 attacker，WakeUp = attacker；第二擊則重新進 ordinary `BATTLE_Attack()`。
- Guardian substitution 不再改變上述 caller 自己的 WakeUp source-order。

本版只修 caller-sensitive target selection；不新增 RNG、傷害、反傷或 Guardian 數值。

regression：`tools/check_v305_caller_sensitive_acupuncture_wakeup.mjs`
GitHub Actions：`.github/workflows/v305-caller-sensitive-acupuncture-wakeup.yml`

## V3.04 — Enemy→Player Guardian Acupuncture still wakes original Player

V3.04 補齊另一條 primary `BATTLE_Attack()` caller boundary：

- fixed C 的 ACUPUNCTURE 在 `BATTLE_DamageSub()` 後，`BATTLE_DamageWakeUp()` 前一律恢復 original `defNo`。
- Enemy→Player 若由 Player Guardian Pet 代擋，而 Guardian Pet 自己持有 ACUPUNCTURE，真正承傷者是 Guardian，但 WakeUp 仍必須回到 original Player。
- `resolveEnemyDirectAttackToPlayer()` 原本已保留 `r.originalTargetDesc={kind:'player'}`；本版讓 `battleApplyPhysicalHit()` 在 ACUPUNCTURE trigger 時優先使用這個 source-backed descriptor。
- 不新增傷害、反傷、Counter、Guardian 條件或 RNG。

regression：`tools/check_v304_enemy_player_guardian_acupuncture_wakeup.mjs`
GitHub Actions：`.github/workflows/v304-enemy-player-guardian-acupuncture-wakeup.yml`

## V3.03 — Guardian-provided Acupuncture still wakes original defender

V3.03 收斂 V3.02 尚未覆蓋的另一個 primary caller：普通玩家／Pet 的 `applyFriendlyEnemyHit()`。

- fixed `BATTLE_Attack()` 的 ACUPUNCTURE 不論反應來自原 target 還是 Guardian substitute，都會在 `BATTLE_DamageWakeUp()` 前把 `defindex/toindex` 恢復成 original `defNo`。
- 因此「Guardian 本身持有 ACUPUNCTURE」時，真正承傷者是 Guardian，但 primary WakeUp 仍應作用在 original defender。
- Web `applyFriendlyEnemyHit()` 現在只在 ACUPUNCTURE 觸發時把 WakeUp target 改回 `originalTargetDesc`；普通 hit 仍使用 actual target。
- Counter、傷害、反傷、ItemCrush、RNG 與 Guardian 條件均沒有新增或改值。

regression：`tools/check_v303_guardian_acupuncture_wakeup_order.mjs`
GitHub Actions：`.github/workflows/v303-guardian-acupuncture-wakeup.yml`

## V3.02 — primary Acupuncture WakeUp follows fixed defindex restore order

V3.02 修正 fixed `BATTLE_Attack()` 的 ACUPUNCTURE source-order：

- `BATTLE_DamageSub()` 觸發 ACUPUNCTURE 後，source 先把 `defindex` 暫時改成 attacker；但在 primary `BATTLE_Attack()` 的 `BATTLE_DamageWakeUp()` **之前**，又明確把 `defindex/toindex` 恢復成原本的 defender，因為針刺反傷不能錯解除被打方狀態。
- 因此 primary Attack 的 WakeUp 目標是 **original defender**；WakeUp 完成後 source 才再次把 `defindex` 切回 attacker，供後續 death/status/ItemCrush source order 使用。
- Counter 是不同 caller：fixed `BATTLE_Counter()` 沒有這個中間 restore，ACUPUNCTURE 的 WakeUp 仍在 attacker，因此 Web `sourceFinishAcupunctureReaction()` 的 Counter attacker-WakeUp 保持不變。
- 本版沒有新增 RNG、傷害、回合、反傷數值或新的狀態規則。

regression：`tools/check_v302_primary_acupuncture_wakeup_order.mjs`
GitHub Actions：`.github/workflows/v302-primary-acupuncture-wakeup.yml`

## V3.01 — original Defender DamageReact survives Guardian substitution

V3.01 對齊 fixed `BATTLE_Attack()` 的 pre-`BATTLE_AttackSeq()` control-flow boundary：

- fixed C 在進入 `BATTLE_AttackSeq()` 之前就以 **original `defindex`** 的 `BATTLE_GetDamageReact() > 0` 把 `iRet/ContFlg` 設成 FALSE。
- 因此 original defender 已有 DamageReact 時，即使後續 `BATTLE_GuardianCheck()` 把真正承傷者換成 Guardian，Counter 仍不能重新開啟。
- Web `resolveAttackToEnemyWithGuardian()` 現在在 Guardian substitution 完成後，保留 original target 的 `sourceCounterBlockedByDamageReact`；不重新執行第二次 DamageReact，也不新增 RNG。
- 本版不改 DamageReact 類型、傷害、Guardian 條件、Counter 機率或其他數值。

regression：`tools/check_v301_original_damagereact_guardian_counter.mjs`
GitHub Actions：`.github/workflows/v301-original-damagereact-guardian-counter.yml`

## V3.00 — confusion target RNG + `_PREVENT_TEAMATTACK` source order

V3.00 對齊 fixed `CHAR_WORKCONFUSION` StatusSeq 與 `BATTLE_COM_S_CHAOS`：

- 混亂流程固定先消耗 `RAND(0,1)` 選 side，再 `RAND(0,9)` 決定循序掃描起點；Web 不再把候選目標清單重新均勻抽樣。
- 選中 side 沒有合法 TargetCheck 目標時，fixed C 寫入 `COM2=-1`，後續由 `BATTLE_TargetAdjust` 呼叫對側 `BATTLE_DefaultAttacker`；Web 改用同一個 source-backed default-target owner。
- `BATTLE_COM_S_CHAOS` 在 AttackSeq 前經 `_PREVENT_TEAMATTACK`；若混亂選到同隊目標，Web 現在保留前面的 StatusSeq RNG，但不再消耗 Duck / Critical / Damage / Guardian RNG。
- 間接武器的混亂攻擊也先經同隊 gate，再進 BOW／BOOMERANG 等 ranged path。

regression：`tools/check_v300_confusion_teamattack_rng.mjs`
GitHub Actions：`.github/workflows/v300-confusion-teamattack-rng.yml`

## V2.99 — manual first-dodge callers must not re-run suit dodge

V2.99 收斂 V2.98 shared `sourceInitialDodgeOnly()` 後的 caller 邊界：

- `sourceInitialDodgeOnly()` 現在本身就包含 fixed `_SUIT_ADDPART3` 第二層 dodge；任何 caller 若先執行它，再把同一 hit 交給 `resolveNormalAttack()` 做 critical/damage 計算，就必須 `skipSuitDodge:true`。
- fixed `BATTLE_AttackSeq()` 的唯一 suit-dodge branch 在 GuardianCheck **之前**；Guardian substitution、calc-only caller、GBREAK2 都不能再消耗第二顆 suit RNG。
- 本版修正：`battle_profession_attack_fun` calc-only、Enemy Guardian real-substitution、Enemy/Pet GBreak2、Pet `BATTLE_S_AttackDamage` calc-only。
- GBreak2 的 Pet guard-command 特例沒有手動 first-dodge，因此僅該分支保留 suit-dodge；手動 first-dodge 的分支則明確 `skipSuitDodge:true`。
- `_PREVENT_TEAMATTACK`、Critical 數值與 DamageSub 數值本版沒有變更，仍維持 source-backed fail-closed。

regression：`tools/check_v299_shared_first_dodge_suit_gate.mjs`
GitHub Actions：`.github/workflows/v299-shared-first-dodge-suit-gate.yml`

## V2.98 — first DuckCheck DamageReact boundary + Guardian pre-substitution suit dodge

V2.98 對齊 fixed `BATTLE_DuckCheck()` 在多個 Web caller adapter 的 source-order：

- target-side `DamageReact` 時，fixed DuckCheck 直接 FALSE；因此 `MYSKILLDUCK` 與普通 DuckCheck 不得先消耗第一層 dodge RNG。
- `_SUIT_ADDPART3` 是 AttackSeq 後續獨立的第二層 dodge，仍要在 DamageReact 下照常執行。
- `sourceInitialDodgeOnly()` 現在與 `resolveNormalAttack()` 共用相同 gate；Enemy→Player、Enemy→Pet、profession calc-only 與 Guardian-aware caller 不再繞過 V2.93 boundary。
- `resolveAttackToEnemyWithGuardian()` 改走共用 first-dodge adapter，原目標在 Guardian substitution 前保留 suit dodge；Guardian 接手後仍 `disableDodge + skipSuitDodge`，不重跑第二次 suit dodge。
- `_PREVENT_TEAMATTACK` 本版只完成 caller/source-order audit；沒有新的數值證據就不猜 0.40／1 damage 等規則。

regression：`tools/check_v298_first_dodge_guardian_boundary.mjs`
GitHub Actions：`.github/workflows/v298-first-dodge-guardian-boundary.yml`

## V2.97 — ACUPUNCTURE WakeUp follows fixed DamageSub defindex

V2.97 對齊 fixed `BATTLE_DamageSub()` 的 ACUPUNCTURE caller 邊界：

- fixed C 的 ACUPUNCTURE 分支先扣原 defender，再把 local `defindex` 改成 attacker；回到 `BATTLE_Attack()` 後，正傷害的 `BATTLE_DamageWakeUp()` 因此喚醒的是被反傷的 attacker。
- Web `sourceFinishAcupunctureReaction()` 已完成反傷／消耗；但 primary physical-hit path 先前仍無條件 WakeUp 原 target，漏掉了這個 local `defindex` rewrite。
- V2.97 現在只在 ACUPUNCTURE 觸發時把 WakeUp 目標切到 attacker；Counter 的既有反傷 WakeUp 不重複執行。
- Trap 已有同樣的 attacker WakeUp source path，本版不重複修改。

regression：`tools/check_v297_acupuncture_wakeup_target.mjs`
GitHub Actions：`.github/workflows/v297-acupuncture-wakeup.yml`

## V2.96 — GuardianCheck source block: instigate

V2.96 對齊 fixed `BATTLE_GuardianCheck()` 的 Guardian 禁用條件：

- fixed C 在 Guardian 已存活、具 `CHAR_BATTLEFLG_GUARDIAN` 且不是攻擊者後，還會拒絕 `CHAR_WORKINSTIGATE > 0` 的 Guardian。
- Web `enemyGuardianFor()` 現在在 Guardian substitution 前檢查 source-backed `instigate` 狀態，因此挑撥中的 Enemy 不會突然代擋。
- fixed C 另外檢查 `CHAR_DOOMTIME > 0`；目前 Web 沒有可證明的 Enemy profession DOOM Work state。現有 Enemy `chargeState` 是 `PETSKILL_ChargeAttack`，不把兩者硬映射。
- 既有 sleep／paralysis／stone／barrier／dizzy／dragnet／confusion／投射武器等 Guardian 邊界保持不變。

regression：`tools/check_v296_guardian_instigate_block.mjs`
GitHub Actions：`.github/workflows/v296-guardian-instigate.yml`

## V2.95 — Guardian substitution must not re-run suit dodge

V2.95 對齊 fixed `BATTLE_AttackSeq()` 的 Guardian 邊界：

- 原始 defender 先完成 `BATTLE_DuckCheck()` 與 `_SUIT_ADDPART3`，成功命中後才呼叫 `BATTLE_GuardianCheck()`。
- Guardian 接手後，fixed C 直接以 Guardian 的 DEX／防禦／會心狀態繼續後半段 AttackSeq，不會重新執行 DuckCheck 或第二顆 suit-dodge RNG。
- Web 的 real Guardian substitution 與 profession calc-only Guardian path 現在只在 `guardian===true` 時把 `skipSuitDodge` 傳給後半段 `resolveNormalAttack()`；沒有 Guardian 的普通目標仍保留原本 suit dodge。

regression：`tools/check_v295_guardian_no_second_suit_dodge.mjs`
GitHub Actions：`.github/workflows/v295-guardian-no-second-suit-dodge.yml`
## V2.94 — fixed BATTLE_DuckCheck JYUJYUTU KawashiPara branch

V2.94 對齊 fixed `BATTLE_DuckCheck()` 的 defender-command 分支：

- fixed C 先讀 defender 的 `CHAR_WORKBATTLECOM1`；只有 `BATTLE_COM_JYUJYUTU` 時，`gKawashiPara` 才從 `0.02` 改成 `0.027`。
- Web `sourceBattleDuckTotal()` 現在接受 source-backed 的 defender command adapter，再把選出的 `K` 傳給 `battleDuckChance()`；未提供證明 command 時維持 fixed 預設 `0.02`。
- 不從職業技能函式名、技能 ID 或 UI 猜成 `BATTLE_COM_JYUJYUTU`；只有明確的 `sourceDefenderBattleCommand` 或 defender 已帶 `battleCommand` 才觸發 `0.027`。
- `BATTLE_DuckCheck()` 後面的酒醉、BOW、NoGuard、HITRIGHT、職業回避與 CHAOS 順序不變。

regression：`tools/check_v294_duck_jyujyutu_kawashipara.mjs`
GitHub Actions：`.github/workflows/v294-duck-jyujyutu-kawashipara.yml`

## V2.93 — DamageReact blocks DuckCheck but not independent suit dodge

V2.93 對齊 fixed `BATTLE_DuckCheck()` 的先後順序：target-side `BATTLE_GetDamageReact() > 0` 時，會先直接讓 DuckCheck FALSE，因此不能再消耗 `CHAR_MYSKILLDUCK` 或普通敏捷閃避的 RNG；但 `BATTLE_AttackSeq()` 後續 `_SUIT_ADDPART3` 是獨立第二道閃避，仍然可以執行。

- fixed C 的 `BATTLE_DuckCheck()` 在 `CHAR_MYSKILLDUCK` 前先檢查 DamageReact；Web 原先 `resolveNormalAttack()` 卻先測 `skillDuckPower`，再呼叫 `sourceBattleDuckTotal()`，所以 target 有 DamageReact 時仍可能先走 Duck。
- 本版只在 `resolveNormalAttack()` 對已存在的 source-backed `damageReact` 加上 DuckCheck boundary：跳過 `skillDuckPower` 與普通 DuckCheck，並保留下面獨立 `sourceSuitDuckCheck()`。
- 不改 DamageReact 種類、傷害、回合或機率；不把 suit dodge 錯誤地綁到 DamageReact。

regression：`tools/check_v293_damagereact_duckcheck_boundary.mjs`
GitHub Actions：`.github/workflows/v293-damagereact-duckcheck.yml`

## V2.92 — Enemy→Player weapon Guardian boundary

V2.92 修正一條尚未收斂到 fixed `BATTLE_AttackSeq()` 的 Enemy→Player 普通／遠程武器共同路徑：

- fixed C 的一般 `BATTLE_Attack()` 進 `BATTLE_AttackSeq()` 時，原目標完成 DuckCheck 後會跑 `BATTLE_GuardianCheck()`；Guardian 接手後才以實際 Guardian 的能力結算。
- Web 的 `enemyWeaponApplyHit()` 玩家分支原本直接呼叫 `enemyAttackResult()`，這條 helper 沒有 Guardian substitution。
- 本版改為共用已經 source-backed 的 `resolveEnemyDirectAttackToPlayer()`，再把 `enemyDirectActualTarget()` 的實際目標交給 `battleApplyPhysicalHit()`；因此 Player、Player Guardian、DamageReact／Trap、ItemCrush 與後續死亡流程重新走同一條 fixed-C boundary。
- 不新增 Guardian 條件、傷害、機率或 RNG；只是把已存在的 fixed source 路徑接回這條漏接 caller。

regression：`tools/check_v292_enemy_weapon_guardian_boundary.mjs`
GitHub Actions：`.github/workflows/v292-enemy-weapon-guardian.yml`

## V2.91 — target-side DamageReact pre-Duck boundary

V2.91 修正 V2.90 留下的 shared `battleApplyPhysicalHit()` 邊界：

- fixed C 的 `BATTLE_Attack()`／`BATTLE_AttackSeq()` 在真正進入 DuckCheck 前，就會依 attacker 與 original `defindex` 的 `BATTLE_GetDamageReact() > 0` 保留 `iRet/ContFlg = FALSE`。
- Web 的 `battleApplyPhysicalHit()` 原本已持有 `targetDesc`，卻在 pre-AttackSeq boundary 傳入 `null`；若 target-side DamageReact 存在，後續 dodge／miss early return 會來不及留下 `sourceCounterBlockedByDamageReact`。
- 本版改為傳入實際 `targetDesc`，只保存 fixed C 已證明的 pre-Duck control-flow boundary；不新增 DamageReact 類型、傷害、機率或 RNG。
- 現有 Player TRAP、Pet ACUPUNCTURE、Enemy ACUPUNCTURE source-backed 範圍維持不變；VANISH／ABSROB／REFLEC 仍 fail-closed。

regression：`tools/check_v291_target_damagereact_preduck_boundary.mjs`
GitHub Actions：`.github/workflows/v291-target-damagereact.yml`

## V2.90 — attacker-side DamageReact Counter boundary

V2.90 接著 fixed C 的 `BATTLE_Attack()` pre-AttackSeq gate：

- fixed C 不只檢查原始防守方；攻擊者本身已有 DamageReact 時，同樣先把 `iRet/ContFlg` 設成 `FALSE`。
- Web 目前可由來源證明的 React 狀態只有 Player 的 TRAP、Pet 的 ACUPUNCTURE、Enemy 的 ACUPUNCTURE；其餘 VANISH / ABSROB / REFLEC 仍 fail-closed。
- Player/Pet → Enemy、Enemy → Pet/Enemy、Enemy → Player，以及 Counter 本身，都在對應的 fixed-C boundary 保存 `sourceCounterBlockedByDamageReact`；不把這個 gate 與 DamageSub 是否真正消耗 React 混為一談。
- Counter 命中仍會照常完成 fixed `BATTLE_Counter()` 的 AttackSeq / DamageSub；這個 flag 只讓 outer/inner Counter chain 在正確時機停止，不提前取消本次 Counter 傷害。

regression：`tools/check_v290_attacker_damagereact_counter_boundary.mjs`
GitHub Actions：`.github/workflows/v290-attacker-damagereact.yml`

## V2.89 — Counter GuardAdjust boundary

V2.89 對齊 fixed C 的 BATTLE_Counter -> BATTLE_AttackSeq(..., -1) 順序：

- Counter 命中後仍重新進 BATTLE_AttackSeq()，因此目標當回合若是 GUARD，會照樣進 BATTLE_GuardAdjust()。
- GuardAdjust 只在目標確實處於 GUARD 且沒有被混亂取消時生效；Player、出戰 Pet、Enemy 三種 Web battle view 都現在帶有 source-accurate counterGuarding。
- counterScaledResult() 不改 Counter 機率，也不改原本 75% 傷害縮放；它只把這個 guard state 傳進既有 resolveNormalAttack()。
- GuardAdjust 的既有 C RNG 區間與倍率完全沿用，不新增任何猜測數值。

regression：tools/check_v289_counter_guard_boundary.mjs
GitHub Actions：.github/workflows/v289-counter-guard.yml

**

## V2.88 — pre-DamageReact Counter boundary

V2.88 修正 V2.87 尚未完全覆蓋的「先判 Counter、後消耗 DamageReact」順序：

- fixed BATTLE_Attack() 在 BATTLE_DamageSub() 之前，只要攻方或原始防守方的 BATTLE_GetDamageReact() > 0，就先把 iRet/ContFlg 設為 FALSE。
- Web runtime 先前是在 DamageReact 被消耗後才由 Counter helper 看目前狀態；針刺／陷阱一旦被吃掉，就可能失去這個已經成立的 pre-DamageSub FALSE 邊界。
- 另外，投擲武器會讓 BATTLE_DamageSub() 不觸發針刺／陷阱，但不會回溯改變先前已經寫入的 iRet=FALSE。
- 本版在 source reaction prepare 階段把這個「已由 fixed C 證明、但尚未發生 DamageSub」的狀態固定寫入 attack result，三條 Counter chain 都在 primary 與 inner-counter 階段 fail-closed。
- 不增加任何新傷害、機率、回合或 RNG；只保存 fixed C 已成立的 control-flow boundary。

regression：tools/check_v288_damagereact_counter_boundary.mjs
GitHub Actions：.github/workflows/v288-damagereact-counter.yml


目前主線已完成 V3.00；本版把 GuardianCheck 的 instigate source block 收斂。

> **V2.92：** Enemy→Player weapon-hit path 收斂回 fixed BATTLE_AttackSeq 的 Guardian-aware boundary。

> **原 C 規則優先、不猜數值**

固定原 C 基準：

`gavinlinasd/StoneAge@1f90cb6cb57c1df70f39cde77a5a8ccd98b66c56`

## V2.87 — Fixed BATTLE_Attack DamageReact / Counter boundary

V2.87 針對 fixed battle_event.c 的 BATTLE_Attack() 來源順序補上一個 Web runtime 邊界：

- fixed C 在真正 BATTLE_AttackSeq() 之前，若攻方或原始防守方已有正向 BATTLE_GetDamageReact()，先把 iRet 設為 FALSE。
- 因此這一擊之後不應再進 common BATTLE_Counter() chain；Web resolvePetEnemyCounterChain() 現在同步檢查目前可由來源證明的 Acupuncture DamageReact。
- 本版只接入已被 fixed C 證明且現有 Web 可達的 DamageReact，不擴寫不存在的 VANISH / ABSROB / REFLEC runtime 狀態。

regression：tools/check_v286_source_closure_audit.mjs

## V2.86 — PetSkill source closure audit

V2.86 依 fixed C 證據補齊 `PETSKILL_Merge` 的戰鬥 FALSE 邊界；同時把目前 fixed C / Web 的 PetSkill function closure 再做一次完整 source audit。

- fixed runtime 目前有 64 個合法 PetSkill function family；其中宣告為 battle / all-field 的有 61 個。
- 玩家低忠誠 RANDOMACT 的 sourcePerformPetLoyalAction() 有 58 個實際 dispatcher；另外 3 個仍是 fixed PETSKILL_functbl 明確未註冊的 582／642／643；field=2 的 `PETSKILL_Merge`、`PETSKILL_Fixitem`、`PETSKILL_Inslay` 則全部是 fixed C 戰鬥前置 FALSE 邊界。由於原 `BATTLE_PetRandomSkill()` 抽的是原始 `iNum` slot，這三個 field=2 技能仍可能被選中的 slot 經歷 source gate，不能直接當成「永遠不會被隨機抽到」。
- 唯一 field=2-only 的 function family 是 PETSKILL_Merge、PETSKILL_Fixitem、PETSKILL_Inslay；固定 C 的掃描本身會排除 field=2，但原程式最後仍把原始 iNum slot 傳給 PETSKILL_Use，因此 field=2 selected-slot 的 FALSE 邊界仍必須保留。
- Enemy AI 的 source-unregistered 邊界維持 502／582；battle-false 邊界維持 540／572。其餘目前正權重 Enemy PetSkill 都有明確 dispatcher。
- sourceRuntimePending 仍保留 7 個 defensive guards；本版沒有證據證明任何一個應被改成猜測效果，因此全部維持 fail-closed。

本輪另完成 fixed battle.c / battle_event.c 的 special-command 執行順序 audit：

- PETSKILL_BattleProperty、FallGround、BattleTimid/2Timid、Lighttakeed、DamageToHp、MpDamage、Tear、Sonic、Regret、Firekill、Gyrate、BattleModel 等 isolated command 不進原一般 Counter chain；runtime 明確保留 sourceNoCounter。
- SetDuck 則不是 generic no-counter，而是固定 PETSKILL_SetDuckChange_Battle() 的 self-target FALSE boundary；RANDOMACT 的 opposing COM2 不得猜成自身 Duck。
- Acupuncture、Hector、SARS、BecomePig、Retrace 屬 common attack fall-through，仍保留原 Counter chain。
- 不因 parser failure 自行補數值：fixed BATTLE_PetRandomSkill() 失敗後會把 COM1 留在／清回 NONE 的時序也維持 fail-closed。

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

**目前核心版本：V2.91**

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
