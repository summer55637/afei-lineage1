# V3.85 Browser World Encounter Idle Bridge

更新日期：2026-10-01

V3.85 把 V3.81 encounter roll 與既有 Idle Loop 接起來，但只走到 `encounter_pending`，不提前建立 battle。

## Flow

`WORLD_ENCOUNTER_ROLL_IDLE_COMMIT`

→ 解析目前 unconditional Encounter

→ 執行 V3.81 CEP roll

→ 將 `cepAfter` 寫入 `world.encounter.cep`

→ 套用 Idle Loop `MOVE_TICK`

→ `encounterTriggered=true` 時進 `encounter_pending`

→ `encounterTriggered=false` 時維持 `moving`

→ 一次 `commitSave` + Save Envelope verification

## Boundary

命中時目前只建立 Idle 的 pending encounter boundary。Idle contract 中的 `in_battle` 代表 battle runtime context 已成立，因此 V3.85 不直接呼叫 `ENCOUNTER_ROLLED(active=true)`。

重新載入後，pending encounter 不需要把完整 transient payload 塞進 Persistent State；世界座標與 `world.encounter.cep` 已保存，後續可由 source encounter resolver 重新取得 Encounter metadata。

V3.85 不新增 battle damage、Enemy team、reward、capture、death 或 offline policy。
