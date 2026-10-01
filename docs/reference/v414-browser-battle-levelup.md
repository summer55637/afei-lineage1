# V4.14 Browser Battle Level-Up Plan

## Source boundary

Pinned source: `gavinlinasd/StoneAge@1f90cb6cb57c1df70f39cde77a5a8ccd98b66c56`.

The fixed C sequence is `BATTLE_GetExpGold()` -> `CHAR_LevelUpCheck()`. `CHAR_LevelUpCheck()` repeatedly compares `CHAR_EXP` with `CHAR_GetLevelExp(level+1)`. Under `_NEWOPEN_MAXEXP` it calls `CHAR_HandleExp()` to subtract the threshold, then increments the level. Each player level-up adds `(new level) * 10` DuelPoint. After the check returns, `BATTLE_GetExpGold()` adds `UpLevel * 3` skill points and adds charm +2 once when at least one player level-up occurred, capped at 100.

## Source EXP table

The fixed build has `_USER_EXP_CF` and `_TRANS_LEVEL_CF`. `LoadEXP()` loads `gmsv/data/exp.txt`, stops at 160 entries, and `CHAR_GetLevelExp()` uses that table. `setup.cf` is `LEVEL=140`, `CHARTRANS=5`, `PETTRANS=-1`. The browser plan therefore uses player normal-level gate 140 for non-transformed characters and the loaded EXP-table boundary 160 for the normal pet plan.

`CHAR_EXP` is current-level progress: `CHAR_HandleExp()` subtracts the next-level threshold rather than keeping a lifetime cumulative total.

## Browser contract

V4.14 is read-only. It consumes the ready V4.13 EXP plan and calculates:
- player level and remaining current-level EXP after repeated threshold subtraction;
- player DuelPoint growth from each level-up;
- player skill-point growth and the single +2 charm battle settlement effect;
- pet level-up count and the corresponding deferred `CHAR_PetLevelUp` / `CHAR_PetAddVariableAi` calls.

It does not mutate Persistent State, battle context, UI or DB. Pet stat growth remains deferred because `CHAR_PetLevelUp()` is a separate source mutation with its own rank/RNG behavior and must not be replaced with guessed fixed stats.

## Fail-closed rules

Invalid V4.13 plan, missing persistent player, mismatched player identity, or an active-pet EXP snapshot mismatch are rejected upstream by V4.13. Level-up planning itself stops when there is no next threshold, the normal level gate is reached, or the source EXP table boundary is reached.

## Next boundary

`BATTLE_LEVELUP_COMMIT` -> persist player EXP/level/DuelPoint/skill/charm and pet EXP/level, then separately close exact `CHAR_PetLevelUp()` growth. Battle-item transfer remains after these state changes.
