# V3.54 Browser ItemShop → World NPC binding contract

V3.54 把 V3.40 的 browser ItemShop transaction 與 V3.42 的 World NPC + ItemShop source join 再往前接一層。

## 新增邊界

canonical browser state controller 現在可選擇載入：

`stoneage_world_npc_index-v1`
+
`stoneage_npc_itemshop_runtime-v1`
+
`stoneage-item-make-runtime-v2`

載入後會建立唯一的 World NPC → ItemShop binding index。Browser action 仍只有既有的：

- `NPC_ITEMSHOP_OPEN`
- `NPC_ITEMSHOP_BUY`
- `NPC_ITEMSHOP_SELL`

差別是 action 不再需要 caller 自己猜測或硬編 `shopId`；controller 收到 NPC instance 後，以 `path + blockIndex` 找到 source ItemShop binding，再把 resolved `shopId` 傳入既有 ItemShop runtime。

## Provenance gate

World NPC index 與 ItemShop catalog 必須來自相同 fixed source repository/ref。source key 使用：

`normalized NPC create path + "#" + create blockIndex`

每個 world ItemShop candidate 都必須能 join 到 catalog；join 不到的 instance 維持 unresolved。

目前 pinned production checkpoint：

- World ItemShop bindings：336
- resolved catalog shops：335
- unresolved bindings：1
- unresolved：`my/magicdou/daochang.create#8`
- 不會以 missing arg、外部版本或 synthetic shop 補出內容。

## Transaction path

`NPC instance
→ source ItemShop binding
→ interaction gate
→ Item offer
→ source Item template
→ source allocator
→ Gold debit/credit
→ canonical Persistent State`

V3.54 沒有新增第二套 inventory、Gold 或 shop pricing engine。

## Fail-closed 行為

以下情況直接停止，不觸碰 Persistent State：

- World NPC source key 缺失。
- NPC instance 找不到 ItemShop world binding。
- world/catalog fixed source 不一致。
- world ItemShop instance 找不到正式 catalog shop。
- caller 提供的 `shopId` 與 source-resolved shop 不一致。
- NPC floor 與 source binding floor 不一致。

已通過的 BUY/SELL 仍沿 V3.40 的 transaction/idempotency/revision contract。

## 與 V3.53 的關係

V3.53 Starter Item 24114 仍是獨立的 source build boundary，繼續 fail-closed；V3.54 不修改該判定。

本輪仍不建立 playable HTML，不新增第二入口。
