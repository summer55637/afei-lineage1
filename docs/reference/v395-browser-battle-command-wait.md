# V3.95 Browser Battle Command Wait

更新日期：2026-10-01

V3.95 將 fixed-C BATTLE_CommandWait() 做成 read-only command gate。

## Fixed-C semantics

BATTLE_Command() 會分別檢查 side 0 與 side 1：

- Enemy side 直接 ready。
- Player side 只要有存活 actor 處於 C_WAIT，就不能進入本回合 AI / BATTLE_Battling。
- C_OK actor 計入 ready。
- 死亡 actor 略過。
- INIT / RESCUE / WATCHINIT 不被視為 C_WAIT blocker。
- 若開啟 BATTLECOMMAND_TIME，timeout 可強制放行。

V3.95 不執行 timeout timer 本身，只接受 caller 的 timeoutExpired 相容旗標。

## Boundary

V3.95 不修改 Battle Context，不消耗 RNG，也不執行 AI、damage 或 turn resolution。

Regression：tools/check_v395_browser_battle_command_wait_runtime.mjs
