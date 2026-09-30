# V3.88 Browser Battle Field Runtime

更新日期：2026-10-01

V3.88 將 fixed-C BATTLE_getBattleFieldNo(floor,x,y) 接到既有 src/stoneage_map_runtime.mjs。

## Fixed-C contract

固定 C 先：

1. MAP_getTileAndObjData(floor,x,y)
2. 由 tile[0] 讀取 MAP_BATTLEMAP / MAP_BATTLEMAP2 / MAP_BATTLEMAP3
3. 以 RAND(0,2) 選其中一個

既有 map runtime 已將這三個 candidate 解析成 battlemapResolver.candidatesByImageId，因此 V3.88 不新增 map CSV parser。

## Browser boundary

新增 BATTLE_FIELD_RESOLVE：

- floor/x/y 由 Encounter / world position 提供
- battleFieldRoll 必須由 caller 注入 0..2
- resolver 回傳 candidates、selection、battleFieldNo
- 不修改 Persistent State
- 不使用隱藏 Math.random

V3.86 的 ENCOUNTER_BATTLE_CONTEXT_BUILD 在 action 沒有手寫 battleFieldNo 時，現在會優先使用 V3.88 resolver；若 source-map 無法解析，仍可使用既有 battleFieldNoProvider 作相容 fallback。

## Known source limitation

sourceMapBattleFieldNoAt() 本身在 map / candidate 不可用時回傳 null。V3.88 因此 fail-closed，不把 source resolver failure 猜成另一個 battle field。

Regression：tools/check_v388_browser_battle_field_runtime.mjs
