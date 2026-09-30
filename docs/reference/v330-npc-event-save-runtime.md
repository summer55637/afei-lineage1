# V3.30 NPC Event Save Runtime

更新日期：2026-09-30

V3.30 把 V3.23 orchestrator + V3.28 first-route reward mutation 接到既有 Save Envelope / revision guard。

## Flow

`source script → branch selection → Item/Pet/Charm-rule/EventFlag transaction → commitSave → SHA-256 Save Envelope`

成功的 branch 在 canonical state 只前進一個 revision；Save Envelope 也記錄同一 revision。

## First route regression

對 Lv1 / TRANS0 的 `xinshoujd.arg` branch 0：

- 4 個 Item：20145 / 2849 / 20228 / 18537
- 1 個 Pet：Enemy ID 341 → TempNo 274
- EndSetFlg 366
- Charm 60 保持不變，因 source `EventNo:-1` 不觸發 pinned Charm rule

整個 branch 共有 7 個 action：4 Item + 1 Pet + 1 Charm-rule + 1 EndSetFlg。Save Envelope payload 的 revision = 1。

重送同一 transactionId 時只回傳 idempotent，不再次發放獎勵；對已完成 EndSetFlg 366 的 branch 使用新的 transactionId 時，condition 不再匹配。

## Failure boundary

Event transaction 仍先在 staged clone 執行；如果 GetPet adapter 缺失而導致 event failure，canonical state 的 Item / Pet / EventFlag 都保持原狀，且不建立 Save Envelope。

## Boundary

這個 runtime 不是 browser NPC module。`changeevent` 在 pinned `npctemplate.c/functionSet[]` 仍是 unresolved；V3.30 只是把已閉合的 data-side event reward chain 接到持久化層。

下一步可做 synthetic NPC interaction adapter / UI state model，再決定何時正式建立唯一 playable HTML entry。
