# V3.26 Event Flag Runtime

更新日期：2026-09-30

V3.26 把 fixed-C NPC event 的 End/Now flag bitset 正式映射到 Web runtime。

## Fixed-C rule

`gmsv/src/npc/npcutil.c` 的 `NPC_EventSetFlg` / `NPC_EventCheckFlg` 與 `NPC_NowEventSetFlg` / `NPC_NowEventCheckFlg` 都使用同一個 bitset 算法：

`array = eventId / 32`
`shift = eventId % 32`

End flag 讀寫 `CHAR_ENDEVENT + array`；Now flag 讀寫 `CHAR_NOWEVENT + array`。

`NPC_NowEndEventSetFlgCls` 則在對應 bit 已存在時各自清除 Now / End。

## Runtime

`src/stoneage_event_flag_runtime.mjs` 使用 dynamic `endWords` / `nowWords`，不硬編固定 word count。

因為 pinned source 的 `CHAR_ENDEVENT4..6`、`CHAR_ENDEVENT7..8` 是 build-flag conditional，而 first-route event 已使用 363–366，dynamic bitset 比硬編 3 / 6 / 8 words 更安全。

提供：

- `setEndEventFlag()`
- `setNowEventFlag()`
- `clearBothEventFlags()`
- `isEventFlagSet()`
- `createEventFlagHandlers()`，可直接給 V3.22 event transaction。
- `eventFlagContext()`，可供 V3.21 condition selector 使用。

## First-route

例如 event 366 位於 word 11、bit 14，因此目前 source-compatible state representation 是 `endWords[11]` 的 bit 14。

這讓 `ENDEV=366` / `ENDEV!=366` 與 `EndSetFlg:366` 不必再依賴 undefined external adapter。

## Scope

這層只處理固定-C 已明確定義的 bitset 行為，不處理 `Charm`。`Charm:1` 仍然需要獨立 source closure。

下一步：把 `createEventFlagHandlers()` 與 source Pet / Item handlers 一起接進 V3.23 orchestrator，形成第一條 new-player staged reward execution；完成後再由 Save Transaction commit。
