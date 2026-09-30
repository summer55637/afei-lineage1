{
  "format": "stoneage-offline-reward-batch-v1",
  "generatedAt": "2026-09-30",
  "fixedSource": {
    "repository": "gavinlinasd/StoneAge",
    "ref": "1f90cb6cb57c1df70f39cde77a5a8ccd98b66c56"
  },
  "purpose": "Accept externally completed source-backed battle/reward outputs for an already committed offline checkpoint.",
  "requiredBatchFields": [
    "batchId",
    "source",
    "accruedSeconds",
    "rewardPackets"
  ],
  "rewardPacketFormat": "stoneage-reward-transaction-v1",
  "guards": [
    "idle.mode must be offline_resume",
    "idle.offline.resumePending must be true",
    "idle.offline.rewardsApplied must be false",
    "accruedSeconds <= checkpoint elapsedSeconds",
    "routeId must exist",
    "reward transaction ids must be unique within a batch",
    "expectedRevision must equal current Persistent State revision"
  ],
  "commit": {
    "transactionEngine": "stoneage-reward-transaction-v1",
    "stateTransition": "offline_resume -> moving via existing SAVE_COMMITTED transition",
    "saveEnvelope": true,
    "saveRevisionIncrement": "one outer commit"
  },
  "noGuessing": [
    "encounter RNG",
    "battle result",
    "battle count per elapsed second",
    "EXP formula",
    "Gold formula",
    "Item drop formula",
    "capture policy",
    "supply policy",
    "death policy",
    "inventory-full policy"
  ],
  "completionFlags": {
    "resumePending": false,
    "rewardsApplied": true
  },
  "failureModes": [
    "offline-state-missing",
    "offline-resume-not-pending",
    "offline-rewards-already-applied",
    "accrued-seconds-exceed-checkpoint-window",
    "idle-route-required-for-offline-reward-completion",
    "duplicate-reward-transaction-id",
    "reward-transaction-failed",
    "revision-conflict",
    "save-failed",
    "save-verify-failed"
  ]
}
