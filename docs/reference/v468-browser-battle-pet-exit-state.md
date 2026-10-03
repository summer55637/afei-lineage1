# V4.68 Browser Battle Pet Final-Exit State Sync

固定來源：`gavinlinasd/StoneAge@1f90cb6cb57c1df70f39cde77a5a8ccd98b66c56`

V4.68 補上 Browser Battle Context 與 Persistent State 之間最後一個 Pet final-exit 邊界。

固定-C 的 `BATTLE_Exit()` 在 Player 離開戰鬥時，會遍歷玩家擁有的 Pet；`CHAR_MAILMODE == CHAR_PETMAIL_NONE` 的死亡 Pet 會被清死亡旗標並把 HP 設為 1。Browser Battle Context 的戰鬥 HP 是 transient，因此不能只靠既有的 Persistent Pet HP 做最後 Exit cleanup。

本版本新增 `BATTLE_PET_EXIT_PLAN / BATTLE_PET_EXIT_COMMIT`：
- 只處理目前 Battle Context 內實際參與戰鬥的 Player-side Pet；
- 活著的 Pet 保存最後 Battle HP；
- 死亡或 HP<=0 的 Pet 依 fixed-C final-exit 規則保存為 HP 1 並清除死亡狀態；
- 使用 Settlement Receipt + Player Exit transaction 作為前置證據；
- commit 以 Pet HP snapshot 做 stale-plan 驗證，revision 僅增加一次；
- transaction replay idempotent；
- 不產生 RNG。

這不是新增 Pet 戰鬥規則，而是把固定-C 已存在的 final `BATTLE_Exit()` 狀態結果接回 Browser Persistent State。
