# V4.56 Browser Battle Enemy EXP Credit

更新日期：2026-10-03

Pinned fixed-C source:
- Repository: gavinlinasd/StoneAge
- Ref: 1f90cb6cb57c1df70f39cde77a5a8ccd98b66c56
- Functions: BATTLE_AddExpItem / ENEMY_getExp

## Closed boundary

Enemy death processing now has a Browser transient EXP-credit layer after carried-item handling.

- If Enemy EXP is explicitly present and not -1, it is used directly.
- Otherwise ENEMY_getExp is reconstructed from enemybaseexptbl[level-1] plus rank bonus and EnemyBase alpha.
- Rank mapping follows the fixed-C rank table: 0=>2.5, 1=>2.0, 2=>1.5, 3=>1.0, 4=>0.5, 5=>0.0.
- Alpha is the fixed-C sum of CRITICAL, COUNTER, GET, POISON, PARALYSIS, SLEEP, STONE, DRUNK, CONFUSION divided by 100, plus RARE.
- Player EXP adjustment uses EXPGET_MAXLEVEL=5 and EXPGET_DIV=15.
- workGetExp and KILLPETCOUNT are mutated only inside Battle Context; level-up and Persistent settlement remain separate.
- A processed enemy cannot credit EXP twice.

## Source data completion

`enemybaseexptbl` is pinned from gmsv/src/include/enemyexptbl.h and contains 200 entries for levels 1 through 200.
Enemy core-stat materialization now preserves the GET feature required by ENEMY_getExp.
Battle Context now preserves the Enemy direct EXP input so explicit ENEMY_EXP != -1 can bypass the fallback formula.

## Order

Per death the Browser attack path now records:
damage/death commit -> BATTLE_AddProfit credit -> carried loot queue -> Enemy EXP / KillPetCount credit.

Counter deaths use the same transient boundary.

## Deferred

- Ride Pet EXP (fixed-C awards 60% of the calculated amount and requires BATTLE_getRidePet participant resolution).
- Final EXP settlement into Persistent State.
- Level-up planning and commit.
- Gold and remaining reward packet settlement.
- Pet win AI side effects.
- Battle Finish -> Settlement -> Exit full closure.

## Regression

- tools/check_v456_browser_battle_enemy_exp.mjs
- tools/check_v456_browser_battle_enemy_exp_attack_sequence.mjs
- .github/workflows/check-v456-browser-battle-enemy-exp.yml

Validated cases include direct Enemy EXP, ENEMY_getExp fallback, six-level participant penalty, duplicate-credit idempotency, and per-hit order with carried loot.