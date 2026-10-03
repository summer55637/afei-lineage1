# V4.70 Browser Battle Auto Full Lifecycle

固定來源：`gavinlinasd/StoneAge@1f90cb6cb57c1df70f39cde77a5a8ccd98b66c56`

V4.70 將既有 Browser Battle runtime 與已驗證的 Finish / Settlement / Exit transaction boundary 編排成單一「完整自動戰鬥結算」流程。

## Lifecycle

`Player idle strategy → Enemy AI → Battle Round Resolve → Finish Commit → IDLE battle_finished → deathExtra / relife / levelUp / duelPoint / item transactions → Settlement Receipt → Player Exit → Pet Exit State（有出戰寵時）→ Battle Exit → Battle Context Clear → IDLE reward_applied`

所有 reward transaction 仍使用既有 runtime；V4.70 沒有重寫傷害、AI、技能、EXP、復活或物品規則。

## Boundary

`BATTLE_AUTO_RUN` 預設仍只執行戰鬥回合。

只有 `completeLifecycle=true` 才會繼續執行完整結算。這個模式需要 Persistent State，以及既有 transaction runtimes；供應補給決策以 `supplyRequired` 明確傳入，不在 runtime 內自行猜測。

RNG 仍由 caller / game RNG provider 注入。Pet level-up 所需 growth RNG 證據缺失時 fail-closed。

## Transaction ordering

V4.70 依既有 V4.66 驗證過的 transaction 順序，先處理：

1. deathExtra
2. relife
3. LevelUp 或 DuelPoint
4. Item（若 Settlement Branch 要求）

之後才建立 Settlement Receipt，並以 receipt 綁定 Player Exit、Pet Exit 與 Battle Exit。

## Regression

`tools/check_v470_browser_battle_auto_full_lifecycle.mjs` 同時覆蓋：

- 實際 V4.66「死亡 → deathExtra → 替身復活 → LevelUp → Settlement → Player Exit → Battle Exit → Context Clear」案例；
- Idle `in_battle → settlement → moving` 狀態轉移；
- revision chain 0 → 8；
- 既有替身道具消耗；
- Factory-level `createBrowserBattleAutoRuntime(..., completeLifecycle:true)` 的完整串接。

Workflow：`.github/workflows/check-v470-browser-battle-auto-full-lifecycle.yml`。
