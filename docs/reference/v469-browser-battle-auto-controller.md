# V4.69 Browser Battle Auto Controller

固定來源：`gavinlinasd/StoneAge@1f90cb6cb57c1df70f39cde77a5a8ccd98b66c56`

V4.69 把 V4.67 已完成的 Browser Battle Auto Orchestrator 接到正式 `stoneage_browser_state_controller.mjs`，新增 `BATTLE_AUTO_RUN` 作為單一回合自動執行入口。

## Contract

每回合固定由既有 runtime 接力：

`Persistent State battleSettings.strategy` → Player idle battle strategy → Enemy AI → Battle Round Resolve

Battle Round Resolve 繼續承擔既有的 Dex、Status、AttackSeq、Damage、Death、Counter、Reward、Relife 與 end check。V4.69 沒有新增傷害公式、敵方 AI 規則、技能規則或新的 Persistent State schema。

所有 RNG 仍由 caller 注入；Auto Controller 本身不產生隨機數。缺少回合輸入、必要 runtime 或未支援行為仍 fail-closed。

## Finish boundary

當某一回合已由既有 Battle End runtime 判定完成時，Auto Controller 會透過結果中的 `finishPlan` 把 Finish plan 一併帶回。

這裡仍不自動執行：

- `BATTLE_FINISH_COMMIT`
- Settlement Receipt commit
- Player / Pet final-exit transactions
- `BATTLE_CONTEXT_CLEAR`

因此 V4.69 的邊界是「Controller 可直接驅動戰鬥回合」，而不是把 Finish → Settlement → Exit → World Loop 全部一次封死。

## Regression

`tools/check_v469_browser_battle_auto_controller.mjs`

覆蓋：

- 正式 encounter 65 / Group 94 的 Controller → `BATTLE_AUTO_RUN` 路徑；
- Player strategy、Enemy AI、Battle Round 三段串接；
- 1 回合 transient Battle Context 更新；
- Persistent State revision 不因 auto battle 增加；
- 缺少 Battle Context 時 fail-closed；
- finished round 的 `finishPlan` forwarding。

Workflow：`.github/workflows/check-v469-browser-battle-auto-controller.yml`。
