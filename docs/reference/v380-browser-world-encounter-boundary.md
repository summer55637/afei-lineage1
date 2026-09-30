# V3.80 Browser World Encounter Boundary

更新日期：2026-10-01

## Scope

V3.80 把 V3.79 的「已抵達 unconditional encounter rectangle」再往前推一層，正式解析 fixed-C encounter record：

WORLD_ENCOUNTER_PREPARE

輸入是 canonical Browser State Controller 的目前世界座標，輸出是 source-backed encounter metadata：

- Encounter ID
- inclusive rectangle
- min / max encounter probability
- enemy max
- source Group IDs / Enemy IDs
- zorder selection

## Source parity

固定 C 的 ENCOUNT_initEncount() 讀取 encounter row 的 index、floor、rectangle、probability min/max、enemy max、zorder 與 group/create-probability 欄位；ENCOUNT_getEncountAreaArray() 依座標命中 rectangle 並以 zorder 選擇 active row。

V3.80 使用已完成 source closure 的 stoneage_start_encounter_target_index.json，只允許其中的 unconditionalRows。因此 mixed、item-gated、unresolved-group 與 placeholder row 不會被當成一般 encounter。

## Boundary

這一版是唯讀：

- 不消耗 RNG。
- 不啟動 battle。
- 不修改 Persistent State revision。
- 不重新計算 enemy team。
- 不用猜測資料補 Group / Enemy。

因此它是 V3.79 execution 與後續 encounter roll / battle runtime 之間的正式 source adapter boundary。

## Regression

tools/check_v380_browser_world_encounter_runtime.mjs 驗證：

- floor 100 / Encounter 65 可由目前位置 (610,538) exact resolve。
- source metadata 為 probability 1..5、enemy max 4、Group 89/92/94。
- 不會寫 Persistent State。
- 指定錯誤 Encounter ID 會 fail-closed。
- 非 unconditional 區域不會被 promotion 成一般 encounter。

下一步才是把 fixed-C 的 CEP → min/max clamp → rand()%120 → encounter trigger 做成獨立、RNG-injected runtime，再連到已存在的 Idle Loop encounter_pending → encounter_rolled → in_battle 邊界。
