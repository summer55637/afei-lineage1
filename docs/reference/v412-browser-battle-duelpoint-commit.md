# V4.12 Browser Battle DuelPoint Commit

## Source boundary

Pinned source: gavinlinasd/StoneAge at 1f90cb6cb57c1df70f39cde77a5a8ccd98b66c56, function BATTLE_GetDuelPoint.

The fixed C path computes the new DuelPoint from the staged work value, clamps it to 0..CHAR_MAXDUELPOINT, writes CHAR_DUELPOINT, then performs the RD/DB notification path.

## Browser commit contract

V4.11 produces a read-only DuelPoint plan. V4.12 is the first persistent commit boundary:

BattleContext + V4.11 plan + transactionId + Persistent State -> Persistent State prime

The commit requires a ready V4.11 plan, requires the target to be the side-0 player entry, requires the canonical persistent player's current DuelPoint to exactly equal the plan snapshot, writes only state.player.duelPoint = nextDuelPoint, preserves workGetExp, increments state.revision once, and records an idempotency key under runtimeMeta.battleDuelPointTransactions.

A repeated transaction ID returns an idempotent result and never increments the revision again. A stale plan fails closed.

## Side-effect boundary

The fixed C source also calls lssproto_RD_send, CHAR_send_DpDBUpdate, and CHAR_send_DpDBUpdate_AddressBook unless _NET_REDUCESEND.

Those are adapter-facing side effects in the browser architecture. V4.12 records that boundary but does not pretend the headless runtime has a server socket or DB connection.

## Non-goals

V4.12 does not change Gold, EXP, pet EXP or item rewards; finish the battle; mutate battle HP/death state; execute DB/network adapters; or apply DUELPOINT_RATE again.

DUELPOINT_RATE is relevant to earlier PvP transfer logic; V4.11/V4.12 use the staged CHAR_WORKGETEXP value directly, matching the fixed BATTLE_GetDuelPoint write path.

## Next boundary

The next battle settlement closure is the PvE profit route behind BATTLE_GetProfit() -> BATTLE_GetExpGold(): player EXP, pet EXP and Gold, followed by battle-item settlement.
