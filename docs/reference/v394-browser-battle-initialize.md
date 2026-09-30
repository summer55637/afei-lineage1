# V3.94 Browser Battle Initialize

更新日期：2026-10-01

V3.94 將 fixed-C BATTLE_Init 的初始化順序正式接起來：

BATTLE_MODE_BATTLE
→ BATTLE_SurpriseCheck
→ Surprise side flag
→ BATTLE_PreCommandSeq
→ BATTLE_AllCharaCWaitSet
→ BATTLE_TurnParam

## Surprise integration

V3.94 使用 V3.93 的 caller-injected fixedLuck / surpriseRoll。

- Enemy surprise：result 1 → Side[1].flg |= BSIDE_FLG_SURPRISE
- Player surprise：result 2 → Side[0].flg |= BSIDE_FLG_SURPRISE
- result 0：不設 flag

## Turn initialization

Surprise 完成後才進 V3.92 turn initialization：

- Battle mode = 2
- Actor mode = C_WAIT = 2
- 非 charge command = NONE = 0
- guardian = -1
- Attack / Defence / Quick modifier 按 fixed-C 再衰減

## Boundary

V3.94 仍不執行 AI、Status、Damage、Reward、Capture 或 Death。

fixedLuck 仍是 transient Work value；Persistent player.luck 不直接冒充。

Regression：tools/check_v394_browser_battle_initialize_runtime.mjs
