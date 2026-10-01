# V4.05 Browser Battle Counter Plan

更新日期：2026-10-01

V4.05 接續 V4.04，升格 fixed-C `BATTLE_CounterCheck()`、`BATTLE_CounterCalc()` 與 `BATTLE_Counter()` 的 admission / probability boundary。

## Counter probability

- pinned `gCounterPara = 0.08`
- Dex/type adjustment 跟 fixed-C `BATTLE_CounterCalc()`
- Player：`CounterCalc × CounterTbl × 0.1 + FIXLUCK + WORKCOUNTER`；pinned `_SUIT_ADDENDUM` 已啟用
- Pet / non-player：使用 `CounterCalc`，NOGUARD 可再加 caller-provided adjustment
- probability cap = 100；非正值按 source 轉成最低 roll threshold
- `RAND(1,10000) <= per × 100`

## Admission

- attacker 與 defender 都必須 HP > 0
- attacker command 必須是 ATTACK 或 NOGUARD
- attacker ABIO flag 會直接拒絕 counter
- attacker / defender 任一方使用 throw weapon 時拒絕 counter

## Source nuance

固定 C `BATTLE_Counter()` 若任一方 DamageReact > 0，會把 return flag 設為 false，但仍然呼叫 `BATTLE_AttackSeq()`。因此 V4.05 會同時回傳 `triggered` 與 `sourceReturnFlag`，不把兩者混成同一件事。

反擊真正傷害仍接既有 AttackSeq → V4.03 → V4.04 管線；`BATTLE_Counter()` 另在最後套用 ×0.75，最低傷害 1。

## Browser boundary

V4.05 不扣 HP、不改 Persistent State、不直接執行反擊 AttackSeq；所有 RNG 由 caller 注入。

Regression：`tools/check_v405_browser_battle_counter.mjs`
