# V3.69 Offline reward completion adapter

更新日期：2026-09-30

V3.69 補齊 V3.68 offline checkpoint 的 Phase 3 execution boundary：把外部已完成的 source-backed battle result / reward simulation output 包成一個 offline reward batch，再沿既有 Reward Transaction 與 Save Envelope 一次性提交。

這一版不是新的離線戰鬥引擎，也不自行計算 encounter probability、battle result、EXP、Gold、Item drop 或時間內應打幾場戰鬥。

## Batch contract

stoneage-offline-reward-batch-v1 包含 batchId、source、accruedSeconds、rewardPackets[]。每一個 reward packet 都必須符合既有 stoneage-reward-transaction-v1。

accruedSeconds 必須小於或等於 V3.68 checkpoint 保存的 elapsedSeconds；因此 checkpoint 可以代表較長的實際關閉時間，而真正結算的時間仍由外部 simulation 明確提供。

## Transaction boundary

offline checkpoint → external source-backed reward packets → existing Reward Transaction → offline completion flags → offline_resume → moving → Save Envelope → reload verification

每個 packet 沿既有 Reward Transaction validation / idempotency / inventory gate；整個 batch 最後只由外層 commitOfflineRewardBatch 做一次 Save Envelope revision commit。中途任一 packet 失敗，原始 Persistent State 不變。

完成後會寫入：

- idle.offline.accruedSeconds = batch.accruedSeconds
- idle.offline.resumePending = false
- idle.offline.rewardsApplied = true
- idle.mode = moving
- idle.enabled = true
- runtimeMeta.offlineRewardBatches[batchId] audit metadata

## Fail-closed

offline resume 尚未 pending、超過 checkpoint elapsed window、routeId 缺失、duplicate reward transaction id、invalid reward packet、stale expectedRevision，或既有 Reward Transaction / Save validation 失敗，都會拒絕整個 batch。

## 明確沒有做

- encounter RNG
- battle simulation
- 自動戰鬥時間／場次公式
- 新的 EXP／Gold／Item drop 規則
- 自動捕捉、補給、死亡或背包滿政策
- playable HTML

因此目前仍是 offline checkpoint + 外部 settlement adapter，而不是自動計算離線收益的完整 Idle Engine。

Runtime：src/stoneage_offline_reward_batch.mjs
Browser bridge：src/stoneage_browser_idle_runtime.mjs
Regression：tools/check_v369_offline_reward_completion.mjs
