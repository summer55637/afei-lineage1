# V4.57 Browser Battle Ride Pet EXP

更新日期：2026-10-03

Pinned fixed-C source:
- Repository: gavinlinasd/StoneAge
- Ref: 1f90cb6cb57c1df70f39cde77a5a8ccd98b66c56
- Functions: BATTLE_AddExpItem / BATTLE_getRidePet

## Closed boundary

Fixed-C BATTLE_AddExpItem first credits the participating player, then calls BATTLE_getRidePet for the same participant. When a valid ride pet exists, the ride pet receives the same level-difference-adjusted EXP calculation multiplied by 0.6, with integer truncation, and its KILLPETCOUNT increases by one.

Browser V4.57 now supports an explicit rider-to-pet relation map:
- ridePetBidByParticipantBid maps a player battle BID to a pet battle BID.
- BATTLE_getRidePet itself consumes no RNG; the Browser path therefore consumes no additional RNG for ride-pet EXP.
- The ride pet must resolve to a battle entry with sourceType='pet'; missing or invalid mappings fail closed.
- The ride pet uses its own battle level when applying the same EXP level-difference adjustment.
- workGetExp and killPetCount remain transient battle fields; final Persistent settlement and level-up remain separate.

## Integration order

Per enemy death:
damage/death commit -> BATTLE_AddProfit credit -> carried-item queue -> player EXP/KillPetCount -> Ride Pet EXP/KillPetCount.

Counter deaths use the same boundary through the Counter Chain.

## Regression

- tools/check_v457_browser_battle_enemy_exp_ride_pet.mjs
  - same-level player gets 100 from explicit enemy EXP 100
  - same-level ride pet gets trunc(100 * 0.6) = 60
  - six-level difference gives player 93 and ride pet 55
  - invalid ride-pet mapping fails closed
  - no additional RNG is consumed
- tools/check_v457_browser_battle_ride_pet_attack_sequence.mjs
  - attack sequence produces player EXP and ride-pet EXP in the same hit boundary
  - carried loot remains before EXP credit
  - Persistent State remains untouched

## Evidence boundary

V4.57 closes the source-backed Ride Pet EXP credit boundary only.

Still separate:
- actual PersistentState EXP commit and level-up
- Ride Pet stat-adjustment battle formulas
- Pet win AI side effects
- Battle Finish -> reward settlement -> Exit full closure
- any rider-to-pet mapping cases not explicitly materialized in the Browser battle context