# Browser Battle Attack Pipeline Binding

更新日期：2026-10-01

Browser battle 的普通世界 attack path 現在以 transient pipeline 綁住：

Player Command → AttackSeq Prelude → Damage Plan → Critical Damage Plan → Damage React Plan → Counter Plan

## Binding

BATTLE_PLAYER_COMMAND_SET 成功後會清除上一個 attack pipeline，避免舊 command 的 target 繼續使用。

BATTLE_ATTACK_SEQ_PRELUDE 必須符合目前 attacker 的 ATTACK / BOOMERANG command，且 battleCommands[1] 必須等於 caller target。成功後記錄 finalTargetBid；Guardian replacement 因此會成為後續 damage chain 的唯一 target。

BATTLE_DAMAGE_PLAN 只能使用同一 attacker 與 AttackSeq 的 finalTargetBid，並保存本次 damage RNG inputs。

BATTLE_CRITICAL_DAMAGE_PLAN 必須先有 Damage Plan，而且重新計算 base damage 時使用前一階段保存的 damage RNG / field inputs；若重新計算出的 base damage 與 Damage Plan 不一致，直接 fail-closed。Critical 結果只能由 AttackSeq 的 critical decision 驅動，不接受 caller 重新指定另一個 critical outcome。

BATTLE_DAMAGE_REACT_PLAN 必須使用同一 attacker / target 與 Critical Damage 的最終 damage；不同 damage 直接拒絕。weapon type / throw state 也沿用 AttackSeq pipeline。

BATTLE_COUNTER_PLAN 綁到原始 attack 的 reverse pair：原本 attacker → target，第一個 counter 只能是 target → attacker。Counter 沒有 HP mutation；它仍是獨立 source-backed plan，供後續 counter attack chain 使用。

## Lifecycle cleanup

Player command 改變、death commit、finish commit、Pet Exit / Battle Context Clear 都會清掉 transient attack pipeline，禁止舊 attack evidence 穿越到下一個 battle lifecycle。

這層不新增 fixed-C damage formula、reaction priority、counter probability 或 reward 規則，只把現有各 runtime 的結果綁定成不可跳步的 execution evidence。

固定 source：

gavinlinasd/StoneAge@1f90cb6cb57c1df70f39cde77a5a8ccd98b66c56

Fixed-C corroboration：

- BATTLE_Init() → BATTLE_MODE_BATTLE → command loop
- player command 將 BATTLE_COM_ATTACK / target 寫入 CHAR_WORKBATTLECOM1/2
- BATTLE_Attack() 使用 attackNo / defNo
- BATTLE_TargetAdjust() 在 target invalid 時才更新 command target
- BATTLE_Counter() 從原 attack pair 反向建立 counter pair

Regression：

tools/check_browser_battle_attack_pipeline_binding.mjs


V4.26 adds a controller-bound, explicit HP commit after DamageReact. The attack pipeline regression now verifies the matching attacker/target, actual target HP mutation, same-transaction replay, and stale-plan rejection. The commit is still a separate action; this test does not claim full battle-turn automation.
