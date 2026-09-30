# V3.82 Browser World Encounter Persistence

更新日期：2026-10-01

V3.82 把 V3.81 的 source encounter roll 接進 canonical Persistent State，但不改 V3.81 的唯讀 action。

新增動作：

WORLD_ENCOUNTER_ROLL_COMMIT

## Persistent field

固定 C 的 Connect[fd].CEP 是 connection-scoped current encounter probability，連線初始化時設為 0；V3.82 在單機架構中將這個值映射到：

state.world.encounter.cep

這是 single-player persistence adaptation，不宣稱它等同原 C 的連線生命週期。它的目的是讓保存、重新載入與 offline resume 可以保留上一個 encounter probability checkpoint。

## Commit boundary

流程：

WORLD_ENCOUNTER_ROLL_COMMIT
→ V3.81 WORLD_ENCOUNTER_ROLL
→ apply world.encounter.cep = cepAfter
→ commitSave
→ parseAndValidateSaveEnvelope

成功會 revision +1；失敗時：

- revision 不增加
- Persistent State 不改
- invalid RNG 不消耗保存
- revision conflict fail-closed
- battle 不啟動

## Source / product boundary

V3.82 只持久化 CEP。它沒有把 profession encounter modifier、MoonAct 額外 RNG、NoEnemy connection state、Battle Context 或 Enemy team generation 偷渡進來。

下一步是把 encounter roll 成功的 triggered=true 正式交給 Idle Loop encounter_pending → encounter_rolled → in_battle，但在建立 battle 前仍要先閉合 fixed-C ENEMY_getEnemy() 的 group/team selection。
