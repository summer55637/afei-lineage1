# V4.21 Browser Battle Exit Plan

## Source boundary

Pinned source: `gavinlinasd/StoneAge@1f90cb6cb57c1df70f39cde77a5a8ccd98b66c56`.

V4.21 isolates the fixed-C full-battle `BATTLE_Exit` Pet cleanup that the repository has already documented.

At real battle teardown, Player `BATTLE_Exit` scans **all owned Pet slots**, not only active/team. Any owned Pet with `CHAR_ISDIE == TRUE` or `CHAR_HP <= 0` is restored to HP 1. Mid-battle Pet exits such as LostEscape/Ultimate do not receive this final HP restoration.

The browser plan requires:
- battle already in finish mode;
- caller explicitly marks reward settlement complete;
- every owned Pet is scanned;
- fixed-C `CHAR_MAILMODE != CHAR_PETMAIL_NONE` Pets are skipped;
- for any dead/HP<=0 Pet, Mail Mode evidence must be explicitly `CHAR_PETMAIL_NONE`; missing evidence fails closed;
- only eligible HP<=0 Pets are planned for mutation.

Player HP/MP recovery is outside this boundary and remains unchanged.

## Runtime contract

Read-only; no RNG and no Persistent State mutation.

## Next boundary

`BATTLE_PLAYER_EXIT_PLAN` / `BATTLE_PLAYER_EXIT_COMMIT`；完成 Player HP/MP 回寫後，再進入既有 `BATTLE_EXIT_COMMIT`. 
