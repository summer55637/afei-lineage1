# V3.32 NPC Dispatch Bridge

更新日期：2026-09-30

V3.32 建立唯一的 NPC interaction → module → service/event runtime bridge，避免未來 browser UI 直接碰各個底層 runtime。

## Dispatch pipeline

`player/NPC position → interaction gate → template module resolution → handler factory → first-route Save-backed event`

`dispatchNpcInteraction()` 先使用 V3.31 interaction gate，再要求 caller 提供 explicit `modules` registry。module 找不到時只回傳 `npc-runtime-module-unresolved`，不執行任何 state mutation。

Resolved module 必須自行提供 script 與 handler factory；dispatcher 不從模板名稱猜 `ExChangeMan`、`Action` 或其他 module。

## changeevent

目前 pinned `changeevent` 沒有 functionSet registry entry，因此 browser interaction 仍會停在 module-resolution gate。這是刻意的 source boundary，不是 UI 遺漏。

## Synthetic integration

Regression 使用 synthetic resolved module 指向已 source-closed `xinshoujd.arg`，證明同一 dispatcher 可以跑完整 `Item + Pet + Event flag + Charm-rule → Save Envelope`；但 synthetic registration 不會提升到 production world registry。

下一步：讓真正的 browser interaction shell 使用 `dispatchNpcInteraction()`，並把 production module registry 的 source status 綁到 `stoneage_world_npc_functionset_audit.json`。
