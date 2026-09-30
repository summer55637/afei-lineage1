# V3.28 New-player First-route Adapter Integration

更新日期：2026-09-30

V3.28 把 V3.24 Pet、V3.25 Item、V3.26 Event Flag、V3.27 Charm 四個 source adapter 接進 V3.23 `executeNpcSourceEvent()`。

## Executable first route

測試直接載入：

`data/generated/stoneage_new_player_event_closure.json`
`data/generated/stoneage_new_player_item_reward_runtime.json`
`data/generated/stoneage_item_make_runtime.json`
`data/generated/stoneage_new_player_pet_runtime.json`

以 Lv1 / TRANS0 執行 branch 0，得到：

`20145 + 2849 + 20228 + 18537`
`GetPet 341 → TempNo 274`
`EndSetFlg 366`

因 pinned `npc_exchangeman.c` concrete Charm handler 要求 `EvNo > 0`，而 `xinshoujd.arg` 是 `EventNo:-1`，`Charm:1` 在這個已證實 rule 下為 no-op，玩家 Charm 不改變。

## Commit boundary

整條流程仍由 V3.22 transaction staged clone 包住。故意取消 Pet canonical id factory 時，前四個 Item 已經在 staged clone 建立，但 canonical 原 state 保持完全不變。

這是目前第一條真正可執行的 source-backed new-player reward flow regression；不是 browser NPC instantiation。

## Remaining blocker

依照 `stoneage_new_player_event_closure.json` 的 source closure：Item、Pet、Charm、EndSetFlg 都有 concrete runtime，唯一仍未完成的是 `changeevent` 本身在 pinned `npctemplate.c/functionSet` 的 runtime module identity / instantiation。

因此下一步不是再造 reward engine，而是把 `changeevent|file:almark/xinshou/xinshoujd.arg` 的 NPC template registration 完整閉合，然後再接 browser interaction。

