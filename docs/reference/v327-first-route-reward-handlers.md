# V3.27 First-route Reward Handler Bundle

更新日期：2026-09-30

V3.27 把 V3.24 Pet、V3.25 Item、V3.26 Event Flag 三條已閉合 source runtime 組成單一 handler bundle。

## Capabilities

`createFirstRouteRewardHandlers()` 提供：

- `GetItem` → shared 66-field Item allocator → canonical backpack。
- `GetPet` → fixed-C Enemy ID → EnemyBase TempNo Pet factory。
- `EndSetFlg` / `NowSetFlg` → fixed-C bitset event flag runtime。
- `Charm` → pinned `npc_exchangeman.c` 的 source-gated rule：`CHAR_CHARM<100 && EvNo>0` 才增加，上限 100；因此 `xinshoujd.arg` 的 `EventNo:-1` 是 no-op。

## Atomic execution

bundle 可以直接交給 V3.22 `applyNpcEventActionPlan()`。

在 synthetic action plan 測試中，2 Item + 1 Pet + End/Now flags 可以一次 commit；當同一 transaction 途中遇到未提供的 `Charm` handler 時，所有 staged Item / Pet / Event Flag 都不會進 canonical state。

因此現在的實際邊界是：

`NPC Event → Branch → Action Plan → Item/Pet/EventFlag/Charm-rule mutation = closed`

`changeevent functionSet activation = unresolved`

這比直接做一個「看起來能跑」的新手任務頁更接近 fixed-C source parity。

## Next

下一步集中在正式 `changeevent` module 的 source closure；reward mutation chain 已可供四段 first-route branch 使用，再交給 Save Transaction。

仍不建立 playable HTML。
