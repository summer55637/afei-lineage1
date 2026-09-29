V3.10 candidate work — GMQUE reward runtime regression

Files:
- tools/check_v310_gmque_trophy_runtime.mjs
- .github/workflows/v310-gmque-runtime.yml

This change intentionally does NOT implement GMQUE turn-in/event-state mutation yet.
The current main branch already contains sourceGmQueActionValue(),
sourceGmQueRewardType(), and sourceGmQueResolveTrophy(); this regression freezes their
source-backed boundaries before the missing UI/turn-in flow is added.

It should be copied into the repository root, then run with:
  node --check game.js
  node tools/check_v310_gmque_trophy_runtime.mjs
