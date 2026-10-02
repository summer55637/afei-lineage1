# V4.31 Browser Battle Enemy AI Controller

更新日期：2026-10-02

V4.31 新增控制器層回歸，驗證 V4.28–V4.30 enemy AI runtime 已能透過 `ACTION_BATTLE_ENEMY_AI_APPLY` 按照戰鬥命令等待門檻提交。

## 行為與邊界

- 玩家尚有 C_WAIT 命令時，敵方 AI action 被 wait gate 阻擋，不修改 Persistent State。
- 玩家策略完成命令後，敵方 AI 可規劃並提交普通攻擊命令，目標及 C_OK 狀態寫入 transient Battle Context。
- 敵方命令提交後，command-wait status 能辨識回合已就緒。
- 命令提交不扣血、不執行傷害，也不增加 Persistent State revision。

此版驗證控制器入口與命令等待流程，尚未代表敵方攻擊已自動逐步執行 AttackSeq、Damage、Counter、Death 與 Finish；這些仍需回合 orchestration 接續。

## Regression

`tools/check_v431_browser_battle_enemy_ai_controller.mjs` 覆蓋 player wait gate、strategy 後套用 enemy AI、命令 C_OK 寫入、wait-ready 與 Persistent State / damage 邊界。Workflow 另重跑 V4.29、V4.30 與 V3.86 battle context regressions。

Pinned Fixed-C：`gavinlinasd/StoneAge@1f90cb6cb57c1df70f39cde77a5a8ccd98b66c56`。
