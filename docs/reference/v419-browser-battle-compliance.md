# V4.19 Browser Battle Compliance Plan

## Source boundary

Pinned source: `gavinlinasd/StoneAge@1f90cb6cb57c1df70f39cde77a5a8ccd98b66c56`.

V4.19 is a read-only bridge after V4.16 Level-Up Commit. Its purpose is to reproduce the base values that `CHAR_complianceParameter()` rebuilds from already-committed Player/Pet stats.

## Verified base formulas

Player point-unit state follows the repository's existing fixed-C derivation:

- `FIXSTR = STR + TOUGH*0.1 + VITAL*0.1 + DEX*0.05`
- `FIXTOUGH = TOUGH + STR*0.1 + VITAL*0.1 + DEX*0.05`
- `FIXDEX = DEX`
- `MaxHP = VITAL*4 + STR + TOUGH + DEX`

Pet server-stored stat integers follow the existing Enemy/Pet source-derived conversion:

- `FIXSTR = trunc(STR*0.01 + TOUGH*0.001 + VITAL*0.001 + DEX*0.0005)`
- `FIXTOUGH = trunc(TOUGH*0.01 + STR*0.001 + VITAL*0.001 + DEX*0.0005)`
- `FIXDEX = trunc(DEX*0.01)`
- `MaxHP = trunc((VITAL*4 + STR + TOUGH + DEX)*0.01)`

For the previously committed Pet growth fixture `{208,313,414,509}`, the base derived result is attack 4, defence 4, quick 5, maxHP 20.

## Deliberate deferred fields

V4.19 does not claim a final MaxMP value because the source join through `CHAR_MAXMP / CHAR_getDefaultChar` is not yet fully closed in this browser runtime.

It also does not mutate HP/MP, apply equipment/suit/profession feature branches, or execute network/status sends. Those are separate boundaries.

## Runtime contract

`BATTLE_COMPLIANCE_PLAN` is deterministic and read-only. It consumes the current canonical Persistent State, produces Player/Pet derived snapshots, preserves RNG, and marks missing source branches explicitly instead of guessing them.

Legacy Pets without source-closed raw stats fail closed.

## Regression

The regression checks:
- exact Player point-unit formula;
- exact Pet stored-integer formula;
- known V4.15/V4.16 Pet stat fixture;
- no mutation;
- legacy Pet fail-closed behavior.

## Next boundary

`BATTLE_COMPLIANCE_COMMIT`: commit only source-closed derived fields, with snapshot/revision/idempotency checks, while keeping unresolved MaxMP and special `Other_DefcharWorkInt` branches isolated.
