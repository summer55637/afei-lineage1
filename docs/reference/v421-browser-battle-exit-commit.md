# V4.21 Browser Battle Exit Commit

V4.21 commits only the source-closed Pet final-exit cleanup from the V4.21 plan.

Before mutation, the commit boundary also requires the plan to carry `settlementComplete=true`; otherwise the commit fails closed.


On success:
- each planned eligible dead/HP<=0 owned Pet becomes HP 1;
- the commit requires the plan to carry `mailMode=CHAR_PETMAIL_NONE` for every planned Pet;
- alive Pet HP is unchanged;
- Player HP/MP is unchanged;
- revision increments once;
- duplicate transaction IDs are idempotent no-ops;
- stale Pet HP snapshots fail closed.

The canonical state keeps `activePetId` unchanged. Full battle exit does not automatically reactivate a Pet.

The runtime does not perform UI, DB, network, RNG, or player defeat-heal behavior.
