# V4.51 Browser Battle Attack Sequence

更新日期：2026-10-03

## 目的

把 Fixed-C 已核實的攻擊次數、TargetList 與每擊 AttackSeq 串成可重播的 Browser attack sequence contract。

Pinned source：
- Repository：gavinlinasd/StoneAge
- Ref：1f90cb6cb57c1df70f39cde77a5a8ccd98b66c56

## 已閉合

- 支援明確提供的 attackCount。
- 每擊依 targets 順序重新做 AttackPreflight 與 AttackSeq。
- FIST 依 source 的 gDamageDiv=attack_max 分攤每擊傷害。
- BOW 可使用 V4.50 TargetListSet 產生的 raw target sequence。
- 每擊都走現有 DamagePlan → CriticalDamagePlan → DamageReact → commit。
- 已支援 V4.48 五種特殊 DamageReact commit。
- 目標死亡時，重複指向同一死亡目標的剩餘 hits 會停止；下一個不同目標仍可繼續。
- Counter 在 V4.51 sequence runtime 中維持 deferred，由外層 round flow 另行決定。
- Persistent State 不在 attack sequence 內直接修改。
- Controller 已提供 BATTLE_ATTACK_SEQUENCE_RESOLVE action。

## Regression

tools/check_v451_browser_battle_attack_sequence.mjs：
- FIST 3-hit：source damage 17 × 3，實際每擊 damage 5，目標 HP 100 → 85。
- BOW 2-hit：targets 10、11，兩個目標各承受 17。
- lethal target：第一擊真正擊殺後，不再重複打同一死亡目標。

tools/check_v451_browser_battle_attack_sequence_controller.mjs：
- 從現有 Encounter 65 / Group 94 建立 Browser Battle Context。
- 直接由 controller dispatch BATTLE_ATTACK_SEQUENCE_RESOLVE。
- 驗證 3-hit FIST、damage divisor=3、transient-only。

最新 V4.51 workflow：
- standalone attack sequence regression。
- controller integration regression。
- JavaScript syntax check。

## 明確延後

- 把 GetAttackCount RNG 與 TargetListSet RNG 自動嵌入完整 round driver。
- Main attack 全部 hits 完成後，再只執行一次 Fixed-C Counter chain 的完整 source timing。
- Ride Pet。
- 完整多段特殊技能與附加 status。
- Battle Finish → Profit → Persistent settlement。

## Evidence boundary

V4.51 關閉的是「基本多擊 attack sequence orchestration」，不是完整 Battle system，也不是完整 idle battle。