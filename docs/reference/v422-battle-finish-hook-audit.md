# V4.22 Battle Finish Hook Audit

Fixed source: `gavinlinasd/StoneAge@1f90cb6cb57c1df70f39cde77a5a8ccd98b66c56`.

`BATTLE_Finish()` itself has several conditional side effects, so Browser must not assume every PVE battle has the same finish hook.

For the ordinary world random encounter, the fixed-C entry point `lssproto_EN_recv` calls `BATTLE_CreateVsEnemy(charaindex, 0, -1)`. That path sets the battle type to P_vs_E and does not inject a WinFunc.

For NPC-enemy battles, `NPC_NPCEnemy_BattleIn` calls `BATTLE_CreateVsEnemy(..., 1 or 2, meindex)` and explicitly sets `WinFunc = NPC_NPCEnemy_Dying`. That effect is therefore not part of the ordinary world-random-encounter path.

PVP battles can install `PkFunc` under `_DEATH_CONTEND`, and the `DANTAI` branch can run `BATTLE_DpCalc()`. The fixed-C finish path also handles linked `pNext` battle containers.

Browser policy:
- ordinary first-idle world encounters keep these special hooks absent;
- NPC-specific WinFunc behavior stays deferred unless its identity is explicitly carried by the battle source;
- PVP / DANTAI hooks stay outside the first-idle PVE closure;
- linked battle containers are not synthesized into the Browser model.

This audit is evidence, not a new gameplay rule. It exists to prevent future versions from silently broadening `BATTLE_Finish()` semantics.
