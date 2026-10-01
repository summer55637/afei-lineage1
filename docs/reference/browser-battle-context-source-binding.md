# Battle Context Source Encounter Binding

`ENCOUNTER_BATTLE_CONTEXT_BUILD` now treats the source encounter index as the authority when it is configured.

During `idle.mode=encounter_pending`, the Controller re-resolves the current world position through the pinned encounter target index. The resulting encounter snapshot replaces caller-supplied identity fields, and `groupId` must belong to that source row.

This prevents a caller from taking a valid pending position and attaching an unrelated encounter or unrelated group before Battle Context creation.

The binding is only an enforcement layer. It does not add encounter probability, enemy RNG, reward, EXP, Gold, Item, or battle rules.

Regression: `tools/check_browser_battle_context_source_binding.mjs` covers stale encounter rejection, group mismatch rejection, and canonical source encounter acceptance.