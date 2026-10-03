# V4.47 Browser Battle Counter Chain

更新日期：2026-10-03

## 目的

把 Fixed-C 已核實的 `BATTLE_Counter()` 反擊鏈接入 Browser battle runtime。

Pinned source：

- Repository：`gavinlinasd/StoneAge`
- Ref：`1f90cb6cb57c1df70f39cde77a5a8ccd98b66c56`

## Source order

Fixed-C 的普通攻擊完成後：

1. 第一次反擊由「受擊者」對原攻擊者執行。
2. `BATTLE_CounterCheck()` 判定是否觸發。
3. 觸發後直接呼叫 `BATTLE_AttackSeq()`。
4. 若傷害大於 0，再乘 `0.75)，最低 1。
5. 執行 `BATTLE_DamageSub()`。
6. 只有 `BATTLE_Counter()` 回傳 TRUE 才繼續下一次。
7. 最多 5 次，雙方交替。

## 已閉合

- Player / Pet 的 Counter 判定公式已沿 Fixed-C。
- Player 使用 `RAND < per`；Pet 使用 `RAND <= per`。
- CounterTbl 7×8 與 weapon class mapping 已保留。
- NoGuard command3 的 signed counter adjustment 已保留。
- 第一個 counter actor = 原本 target，之後 attacker/target 每次交換。
- 每一次反擊都以獨立 counter RNG bundle 重播。
- 每次反擊沿現有 AttackSeq / Damage / DamageReact / DamageDeath runtime。
- Counter damage 在 DamageSub 前套用 source 的 0.75 scale。
- 若 critical、death、damage reaction 或零傷害使 source return flag 為 false，chain 在該步後停止。
- 反擊只修改 transient Battle Context，不直接寫 Persistent State。

## 明確延後

- 多段反擊。
- Ride Pet 的 Counter DamageSub 分攤。
- Vanish / Absorb / Reflect / Trap / Acupuncture 的特殊 Counter DamageReact commit。
- Counter 後的特殊 status／附加技能副作用。
- Battle Finish → Profit → Persistent settlement。

## Round integration

V4.47 round driver 支援：

`counterPolicy = "defer"`

與

`counterPolicy = "execute"`

`execute` 時，主攻擊只有在 source-like normal / nonlethal / ordinary damage path 下才啟動 Counter chain；其餘情況 fail-closed 或依 source return flag 結束。

## Regression

`tools/check_v447_browser_battle_counter_chain.mjs` 驗證：

- 5 次最大 chain。
- 反擊順序 `10 → 0 → 10 → 0 → 10`。
- 每次 counter damage = 13（fixture source damage 18 × 0.75）。
- 雙方 HP `1000 → 935`。
- 缺 RNG 時不自行生成亂數，而是 fail-closed。

## Evidence boundary

V4.47 關閉的是「普通攻擊後的基本 Counter chain orchestration」。

不宣稱完整 Counter 系統、完整 DamageReact 或整個 Battle settlement 已完成。
