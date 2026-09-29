Afei-Lineage1 V3.10 regression maintenance checkpoint

Purpose:
  Align stale V3.10 regression checkers with the current runtime/API and consolidated README/CHANGELOG structure.

Gameplay:
  No game.js gameplay-rule changes are included by this maintenance package.

Changed files (8):
  tools/check_gmque_source_contract.mjs
  tools/check_v310_gmque_handoff.mjs
  tools/check_v310_gmque_trophy_runtime.mjs
  tools/check_v310_petskill_pending_ledger.mjs
  tools/check_v270_profession_ice_mirror_runtime.mjs
  tools/check_v271_profession_fire_enclose_runtime.mjs
  tools/check_v272_profession_thunder_enclose_runtime.mjs
  tools/check_v273_profession_ice_enclose_runtime.mjs

Key fixes:
  - Remove obsolete GMQUE helper/UI assumptions.
  - Verify current GMQUE parser/handover API and fail-closed boundaries.
  - Make GMQUE trophy regression semantic rather than implementation-spelling dependent.
  - Align PetSkill pending ledger with current combined-attack/death-credit helper flow.
  - Stop historical V2.70-V2.73 checks from requiring outdated README version markers when CHANGELOG/HTML still carry the historical contract.

Validation in reconstructed latest checkpoint:
  node --check game.js: PASS
  full tools/check_*.mjs sweep: 146/146 PASS, 0 failures
