# V3.67 Browser Idle first-encounter simulation bridge

更新日期：2026-09-30

V3.67 將既有 first-idle route skeleton 與 `stoneage_idle_simulation.mjs` 接入唯一 Browser State Controller。

## Action

`IDLE_SIMULATE_FIRST_ENCOUNTER` 需要 first-idle-route-catalog 中可用的 source-backed route variant。

Battle result 必須由 caller 注入：
- `sourceBattleResult)：交給既有 Battle Result Adapter。
- 或 `battleResult)：必須已符合既有 Idle battle-result contract。

兩者都沒有時直接 fail-closed。

## 不新增戰鬥引擎

Browser bridge 不抽 encounter RNG、不算傷害、不生成勝負、不建立 enemy AI。真正的 Battle result 仍來自外部 source-backed battle runtime。

## Existing transaction chain

`simulateFirstEncounter()` 已經負責：

`battle result normalization → player HP/MP snapshot → Reward Transaction → Death/Supply policy → Save`

V3.67 只是把這條既有 execution path 接進 Browser Controller，不複製 reward、economy、save 邏輯。

## Route boundary

目前 first-idle route catalog 有 8 個 variants，其中 6 個符合 eligible contract。4000→200 兩個 source-blocked variants 仍直接拒絕。

## Safety boundaries

缺 Battle result、invalid source Battle result、route 不合格、stale expectedRevision 都 fail-closed。

Browser bridge 不會在沒有 battle result 時送出 free victory、free EXP、free Gold 或 synthetic reward。
