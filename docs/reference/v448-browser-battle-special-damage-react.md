# V4.48 Browser Battle Special DamageReact

更新日期：2026-10-03

## 目的

把 Fixed-C 已核實的特殊 DamageReact 從只產生 plan 提升到可寫入 Browser Battle Context 的 commit contract。

Pinned source：
- Repository：gavinlinasd/StoneAge
- Ref：1f90cb6cb57c1df70f39cde77a5a8ccd98b66c56

## 已閉合

- Vanish：消耗一層 damageVanish，不改 HP。
- Absorb：把 incoming damage 轉成 defender heal，受 max HP 限制。
- Reflect：把 incoming damage 改由 attacker 承受。
- Trap：把 modTrap damage 改由 attacker 承受並消耗 trap。
- Acupuncture：先對 defender 造成 damage，再對 attacker 造成一半 damage；原 plan 的偶數化規則沿用。
- 特殊 reaction 的 stateConsumption、HP mutation、death state 與 transaction receipt 均寫入 transient Battle Context。
- Persistent State 不在此 runtime 直接修改。
- Transaction conflict / stale revision guard 已納入。
- Counter chain 遇到上述特殊 reaction 時會執行該反應後停止後續 Counter。
- Main round 遇到上述特殊 reaction 時不再整條回退到 deferred branch；會依 source return flag 結束該次攻擊。

## 明確延後

- Ride Pet 分攤。
- 特殊反應後的附加 status／職業技能副作用。
- 完整 Battle Finish → Profit → Persistent settlement。

## Regression

tools/check_v448_browser_battle_damage_react_commit.mjs：
- 五種 reaction commit。
- Vanish zero-HP-mutation semantics。
- Transaction identity conflict guard。

tools/check_v448_browser_battle_damage_react_integration.mjs：
- Main attack → Reflect：player HP 100 → 83，enemy 維持 100。
- Counter → Reflect：Counter attacker HP 100 → 88（Counter source 17 × 0.75 後為 12，再由 Reflect 導回 attacker）。
- Counter chain 在 special reaction 後停止。

最新 V4.48 workflow：
- Check V4.48 special damage react commit：regression 成功。
- 五種 reaction regression：成功。
- special react integration regression：成功。
- JavaScript syntax：成功。

## Evidence boundary

V4.48 關閉的是已知五種特殊 DamageReact 的 transient commit + 主攻／Counter 基本整合。

不宣稱完整戰鬥、Ride Pet、附加技能或 settlement 已完成。