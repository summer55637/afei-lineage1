# Encounter Group → Enemy Generation Binding

The Browser encounter path now keeps the selected group and generated enemy roster as transient controller state until Battle Context is built.

`WORLD_ENCOUNTER_GROUP_SELECT` and `WORLD_ENCOUNTER_ENEMY_GENERATE` require `idle.mode=encounter_pending`.

When an encounter group catalog is configured, `ENCOUNTER_BATTLE_CONTEXT_BUILD` requires a matching in-memory generation result. The binding covers current revision, canonical encounter identity, selected group id, and the exact generated enemy team. The transient plan is discarded immediately after successful Battle Context creation.

This is an anti-substitution boundary. It does not reroll enemy RNG and does not introduce new fixed-C battle or reward rules.

The next lifecycle boundary is also explicit: `BATTLE_INITIALIZE` may only run from a Context in `mode=init`. The lower-level `BATTLE_TURN_INITIALIZE` runtime remains available for direct runtime regression, but the State Controller no longer exposes it as an independent external lifecycle step; this prevents callers from skipping `BATTLE_INITIALIZE` / SurpriseCheck or re-running turn initialization. Target / attack preflight and attack-sequence actions require `context.mode=battle`. `AttackSeqPrelude` 在 Controller 層另外要求 attacker 當前 command 是 ATTACK / BOOMERANG，且 `battleCommands[1]` 必須等於該次 AttackSeq 的 targetBid，避免「下達 A、執行 B」的 command/target 分離。 This prevents an external action from resetting turn state or executing attack planning before battle initialization.

Regression: `tools/check_browser_encounter_group_enemy_binding.mjs` verifies normal group→generation→context flow, manual enemy-team tampering rejection, out-of-order enemy generation rejection, core-stat roll binding, Battle Initialize continuity, and repeated initialization / pre-initialization attack rejection.