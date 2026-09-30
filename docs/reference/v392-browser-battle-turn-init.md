# V3.92 Browser Battle Turn Initialization

更新日期：2026-10-01

V3.92 將 fixed-C 的 BATTLE_Init → BATTLE_PreCommandSeq 邊界接到現有 transient Battle Context，但不執行任何攻擊或傷害。

## Fixed-C sequence

BATTLE_Init：

- battle mode = BATTLE_MODE_BATTLE = 2
- SurpriseCheck 在這之前執行，屬於獨立 RNG boundary

BATTLE_PreCommandSeq / BATTLE_AllCharaCWaitSet：

- 每個已存在 actor 的 battle character mode = BATTLE_CHARMODE_C_WAIT = 2
- 非 charge actor 的 command 1 = BATTLE_COM_NONE = 0
- guardian = -1

BATTLE_TurnParam：

- modifier 乘以 0.8 後寫回整數
- 若有 last field，再加 modifier * 0.01 後取整數
- attack / defence / quick 三組都按相同順序處理
- player 的 charm 依 fixed-C 會先處理 FIXCHARM，再再次衰減 modCharm

## Boundary

V3.92：

- 不消耗 RNG
- 不執行 surprise check
- 不執行 Battle AI
- 不執行 status
- 不執行 damage
- 不修改 Persistent State

Regression：tools/check_v392_browser_battle_turn_runtime.mjs
