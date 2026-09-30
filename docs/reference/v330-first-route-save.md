# V3.30 First-route Save Integration

更新日期：2026-09-30

V3.30 把已完成的 new-player reward transaction 接到既有 `stoneage_save_transaction.mjs`。

## Commit pipeline

`xinshoujd.arg → branch selector → first-route handler bundle → NPC event transaction → Save Envelope`

`executeAndSaveNpcSourceEvent()` 不建立第二種 save schema。成功時呼叫現有 `commitSave(currentState,nextState)`，沿用 schema validation、revision guard、SHA-256 payload hash 與 `stoneage-save-envelope-v1`。

## First-route result

Lv1 / TRANS0 的 branch 0 會持久化：

- Item 20145、2849、20228、18537
- GetPet Enemy ID 341 → TempNo 274
- EndSetFlg 366
- Charm 不變：`EventNo:-1` under pinned Charm rule

Save reload regression 再解析同一 Envelope，確認 Item / Pet / Event flag 都保留。

同 transactionId 重跑不再次 save；已完成的 branch 用新 transactionId 重跑則因 `ENDEV=366` 不再匹配。

## Scope boundary

這代表 reward mutation + persistence 已閉合，但 `changeevent` NPC template 本身仍未在 pinned `npctemplate.c/functionSet[]` 中註冊，因此尚不是 browser NPC 互動完成。下一步應把這個 Save-backed service 接到實際 UI interaction shell，同時保留 `changeevent` template registration 的 source-unresolved 狀態。

