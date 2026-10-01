# Encounter Group → Enemy Generation Binding

The Browser encounter path now keeps the selected group and generated enemy roster as transient controller state until Battle Context is built.

`WORLD_ENCOUNTER_GROUP_SELECT` and `WORLD_ENCOUNTER_ENEMY_GENERATE` require `idle.mode=encounter_pending`.

When an encounter group catalog is configured, `ENCOUNTER_BATTLE_CONTEXT_BUILD` requires a matching in-memory generation result. The binding covers current revision, canonical encounter identity, selected group id, and the exact generated enemy team. The transient plan is discarded immediately after successful Battle Context creation.

This is an anti-substitution boundary. It does not reroll enemy RNG and does not introduce new fixed-C battle or reward rules.

Regression: `tools/check_browser_encounter_group_enemy_binding.mjs` verifies normal group→generation→context flow, manual enemy-team tampering rejection, and out-of-order enemy generation rejection.