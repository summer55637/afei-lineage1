# V3.56 Browser World NPC service routing

V3.56 在 V3.55 的 World NPC point runtime 上增加 source functionSet routing。

## 新增

每個 browser-resolved NPC instance 現在保留：

- source `path + blockIndex`
- template / fileRef
- selected `functionSet`
- 可用的 source service candidates
- candidate `known / unknown` status

`resolveWorldNpcAt(...,{functionSet})` 可以在同一 source cell 上指定要取哪個固定 C functionSet；不符合就回傳 `npc-not-found-at-cell`，不隨便選其他服務。

Browser State Controller 的 `NPC_TALK`、`NPC_ITEMSHOP_*` 與唯讀 `NPC_RESOLVE_AT` 均可用 `serviceFunctionSet` / `functionSet` 選擇 source service。

## 邊界

這一版只做 routing，不把 55 個 fixed-C functionSet 自動變成可執行 module。

真正能執行的 service 仍需：

`source functionSet → audited module → handler → state transaction`

其中 pinned audit 未提供完整 module 的服務繼續 unresolved / non-instantiable。

## Fail-closed

- source cell 不存在：停止。
- 指定 functionSet 不存在：停止。
- 同格多 NPC：仍然 ambiguous。
- 未知 functionSet：保留 evidence，但不自動註冊。
- ItemShop 仍沿 V3.54 binding。
- changeevent / GMQUE / Starter Item 24114 的既有判定不變。

本輪仍不建立 playable HTML。
