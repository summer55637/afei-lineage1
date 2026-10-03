# V4.54 Browser Battle AddProfit Death Credit

更新日期：2026-10-03

Pinned fixed-C source:
- Repository: gavinlinasd/StoneAge
- Ref: 1f90cb6cb57c1df70f39cde77a5a8ccd98b66ca1

## Closed boundary

Fixed-C BATTLE_AddProfit / BATTLE_AddExpItem does not wait for the whole battle result to decide every enemy credit. At the hit boundary it can detect an enemy whose HP has reached zero, record the current player-side attack list as the reward-credit owner, and mark the enemy so the same death is not credited twice.

Browser V4.54 now mirrors that timing with a transient ledger:
- first eligible enemy death sets sourceRewardProcessed=true
- player-side attacker bids are stored in sourceRewardCredits
- enemy-side / non-player credit records an empty player owner list
- repeated calls on the same dead enemy are idempotent
- no EXP, Gold, inventory, or Persistent State is mutated by this ledger

## Browser commit-order adapter

Browser damage/death commit currently materializes the death-state flag before the outer round driver regains control. The adapter therefore accepts an explicit committed-death window (allowCommittedDeath=true) while preserving the source boundary semantics:

HP <= 0 + reward not previously processed -> create the credit exactly once.

This is an implementation-order adapter only; it does not change the fixed-C rule into an unconditional reward award.

## Integration

- Main attack sequence applies profit credit immediately after each hit commit.
- Counter chain applies profit credit immediately after each counter hit commit.
- Source-order metadata now records the per-hit BATTLE_AddProfit boundary.
- Carried-loot reservoir RNG and exact EXP / Gold numbers remain deferred until their already-source-backed reward packet is available.
- Persistent settlement remains outside this runtime.

## Regression

- tools/check_v454_browser_battle_profit_credit.mjs
  - first death creates one player credit
  - second pass does not duplicate it
  - enemy-side death creates no player owner credit
- tools/check_v454_browser_battle_profit_credit_attack_sequence.mjs
  - two-hit attack commits two different enemy deaths
  - each hit produces its own death-credit event
  - owner is the player attacker bid
  - Persistent State remains untouched

## Evidence boundary

V4.54 closes the transient death-credit timing boundary only. It does not claim that Battle Finish reward settlement is complete.

Still separate:
- exact carried-item reservoir selection when upstream source inputs are not present
- EXP / Gold reward packet calculation where source numbers are not yet materialized
- Pet win AI side effects beyond already-established death-credit contracts
- Battle Finish -> Reward/EXP/Item -> Settlement -> Exit lifecycle