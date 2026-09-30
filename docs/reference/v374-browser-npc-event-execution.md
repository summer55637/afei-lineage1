# V3.74 Browser NPC Event execution

更新日期：2026-10-01

V3.74 把已 source-closed 的新手 changeevent 從單純 NPC talk path 提升成 Browser State Controller 的明確 NPC_EVENT_EXECUTE action。

## Production path

World NPC point → changeevent template → pinned ExChangeMan binding → interaction gate → source branch selection → existing Item/Pet/EventFlag handlers → Save Envelope

Regression 使用固定 floor 1006、blockIndex 2 的炎龍新手接待員 production instance；script 使用 xinshoujd.arg。Lv1 / TRANS0 會命中第一個 ACCEPT branch。

該 branch 的 source-backed mutation 為四個 Item、Pet 341 對應的 source Pet，以及 EndSetFlg 366。因 source script eventNo = -1，既有 Charm handler 依 pinned ExChangeMan concrete rule 維持 no-op。

## Transaction boundary

Browser Controller 不複製 event parser；stoneage_npc_event_runtime-v1 負責 condition / branch / action plan，stoneage_npc_event_transaction-v1 負責 staged mutation，stoneage_first_route_save-v1 負責 Save Envelope。

相同 transactionId 重送會保持 idempotent，不增加 revision。

## 明確沒有做

- 不建立新的 quest parser
- 不改 source event branch
- 不猜 mission order
- 不修改 Charm 的 pinned C 語義
- 不建立 playable HTML
