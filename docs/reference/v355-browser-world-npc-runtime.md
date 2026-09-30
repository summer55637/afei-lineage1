# V3.55 Browser World NPC runtime

V3.55 把 World NPC source catalog 進一步轉成可供 browser interaction 使用的 NPC point runtime。

## Source boundary

只接受 `stoneage-world-npc-index-v1` 的 exact create block。位置只來自 `borncorner`；只有 `x1=x2 且 y1=y2` 的退化矩形才可安全視為固定 NPC point。

非退化 `borncorner` 代表 source create 的 spawn area，而不是已知的 browser 當前 NPC cell，因此 V3.55 不猜測該 NPC 的即時位置。

## Browser flow

`browser action + targetCell
→ World NPC point resolver
→ source NPC instance (path + blockIndex)
→ interaction gate
→ NPC ItemShop / NPC dispatch
→ Persistent State`

新增 `NPC_RESOLVE_AT` 唯讀 action，可讓 UI 先做 target selection，再使用既有 `NPC_TALK` / `NPC_ITEMSHOP_*` action。

對 ItemShop，已有的 V3.54 World ItemShop binding 會根據同一個 `path + blockIndex` 自動找到 `shopId`，因此 UI 不必保存或猜商店 ID。

## Ambiguity / fail-closed

- 找不到 NPC：不執行 interaction。
- 同一 cell 有多個 source NPC：回傳 `ambiguous-npc-at-cell`。
- 非固定 point create：不進入 point index。
- source key 不完整：不建立 instance。
- World ItemShop join 不到：沿 V3.54 fail-closed。

## 與 V3.54 的關係

V3.54 修正了 World NPC → ItemShop binding 的 source join；V3.55 只提供位置解析與 browser target bridge，不新增商店、Gold、inventory 或 NPC script engine。

仍不建立 playable HTML；依然維持唯一入口尚未公開。
