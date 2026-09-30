# V3.81 Browser World Encounter Roll

更新日期：2026-10-01

V3.81 接在 V3.80 source adapter 後面，正式把 fixed-C 的 encounter probability state machine 獨立出來：

WORLD_ENCOUNTER_ROLL

## Fixed-C semantics

Pinned fixed-C char_walk.c 在每次有效玩家走格後：

1. 從當前 CEP 取得 encounter counter。
2. 以 encounter row 的 min/max probability 做 clamp。
3. 在 battle mode 為 none 且 no-enemy gate 未封鎖時執行 rand()%120 < cep。
4. roll miss 時 CEP 增加 1，但不超過 max。
5. roll hit 時觸發 encounter 並把 CEP 回到 min。

V3.81 將 RNG 改成 caller-injected rng120，因此 regression 可以完全固定 RNG sequence，也不會偷偷呼叫 Math.random。

## Explicit gates

為保持來源邊界，runtime 把 fixed-C 在這段 encounter roll 前後可觀測的 gates 明確化：

- noEnemy=true：直接跳過 roll，不消耗 RNG；CEP 只做 min/max clamp。
- battleModeNone=false：不進入 roll，不消耗 RNG；CEP 保留 clamp 後值。
- warpBlocked=true：仍消耗一次 rand()%120；若命中則不觸發 encounter，CEP 不做 miss increment。

其他像 profession encounter modifiers、MoonAct 額外 RAND、server connection-specific helper 等仍不在 V3.81 偷補；沒有 pinned build/feature-flag 證據就維持外部 adapter boundary。

## Persistence / Battle boundary

V3.81 仍是純運算 adapter：

- 不修改 Persistent State revision。
- 不寫 Save Envelope。
- 不建立 battle context。
- triggered=true 只代表 encounter roll 已成立，還不能解讀成 battle 已開始。

下一步可把 cepAfter 正式放進 Persistent State / browser idle event，並將 triggered 接到 encounter_pending → encounter_rolled → in_battle 的既有流程；battle 建立仍需另外通過 fixed-C Enemy team selection 與 battle context source closure。
