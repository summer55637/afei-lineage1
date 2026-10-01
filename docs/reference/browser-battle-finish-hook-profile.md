# Browser Battle Finish Hook Profile

## Source

`gavinlinasd/StoneAge@1f90cb6cb57c1df70f39cde77a5a8ccd98b66c56`

`data/generated/stoneage_battle_finish_hook_audit.json` is the authoritative repository-local audit for this boundary.

## Browser profile

The first-idle world encounter uses:

- `profile=ordinary-world-encounter`
- `winFuncInjected=false`
- `pkFuncInjected=false`
- `dantai=false`
- `linkedBattleCount=0`

`BATTLE_Finish` therefore uses the ordinary PVE reward/exit path only.

NPC Enemy `WinFunc`, PVP `PkFunc`, DANTAI finish processing, and linked `pNext` battle teardown remain deferred. The Browser runtime does not synthesize any of those hooks.

## Enforcement

`ENCOUNTER_BATTLE_CONTEXT_BUILD` attaches the profile to the transient Battle Context.
`BATTLE_FINISH_COMMIT` rejects missing or special profiles before switching the context to finish mode.

This is a source-backed boundary only. It adds no reward, EXP, Gold, RNG, or death semantics.
