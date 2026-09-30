# V3.96 Browser Player Battle Command

更新日期：2026-10-01

V3.96 把 fixed-C BattleCommandDispach() 的核心玩家指令先做成 transient command normalization。

## Supported commands

- attack → BATTLE_COM_ATTACK
- guard → BATTLE_COM_GUARD
- wait → BATTLE_COM_WAIT
- escape → BATTLE_COM_ESCAPE
- capture → BATTLE_COM_CAPTURE
- pet_in → BATTLE_COM_PETIN
- pet_out → BATTLE_COM_PETOUT
- attack + boomerang weapon → BATTLE_COM_BOOMERANG

Attack / Capture 的 targetBid 依 fixed-C transport contract 限制為 0..19。

設定成功後：

- command1 寫入 command code
- command2 寫入 targetBid；無 target 時為 -1
- attack 的 command3 marker = 1
- actor mode `C_WAIT → C_OK`

## 尚未執行

V3.96 刻意不做：

- MP 消耗
- checkErrorStatus / status blocking
- Item equip / weapon resolution
- Pet skill
- profession skill
- actual command execution
- target expansion
- damage

這些會在後續 source boundary 逐項接入，避免「能選 command」被誤認成「戰鬥已執行」。

Regression：`tools/check_v396_browser_battle_player_command_runtime.mjs`
