# V3.21 NPC Event / Quest Plan Runtime

更新日期：2026-09-30

V3.21 不把 NPC event script 直接變成一個猜測式 Quest Engine，而是先建立 source-backed branch / action-plan layer。

## Fixed-C source

固定來源：`gavinlinasd/StoneAge@1f90cb6cb57c1df70f39cde77a5a8ccd98b66c56`。

`gmsv/src/npc/npc_eventaction.c` 的 condition dispatcher 明確把 `LV`、`GOLD`、`TRANS`、`ITEM`、`ENDEV`、`NOWEV` 等條件交給對應 checker；`NPC_ActionSetEend()` / `NPC_ActionSetNow()` 則分別寫入 end / now event flags。source 也保留逗號 OR、`&` AND 的條件組合方式。

`gmsv/src/char/pet_event.c` 同樣保留 `EndSetFlg` / `NowSetFlg` 的 event-state mutation，因此 runtime 把 event-state write 定義成 explicit adapter，不猜 canonical `state.events` 的儲存形狀。

## Runtime boundary

`src/stoneage_npc_event_runtime.mjs` 目前完成：

- condition atom parser：`LV / TRANS / GOLD / ITEM / ENDEV / NOWEV`。
- source-compatible `,` alternatives + `&` conjunction。
- event branch selector。
- literal action-plan compiler：`GetItem / GetPet / Charm / EndSetFlg / NowSetFlg`。
- unsupported condition key 直接 fail-closed。

它刻意不直接修改 persistent state。需要真正執行 mutation 時，下一層會接：

`event branch → action plan → Item allocator / Pet factory / event-state writer → atomic save transaction`。

這樣 `GetItem` 的多種 source 語意不會在還沒確認前被錯誤合併。

## V3.21 first-route target

目前先用已閉合的 `data/generated/stoneage_new_player_event_closure.json` 驗證四段新手分支：

- `TRANS=0 & LV<100 & ENDEV!=366` → branch 366
- `TRANS=0 & 99<LV<140 & ENDEV!=365` → branch 365
- `TRANS=0 & 139<LV<150 & ENDEV!=364` → branch 364
- `TRANS=0 & LV=150 & ENDEV!=363` → branch 363

Item / Pet definitions 是否完整仍由各自 source runtime 決定；event runtime 不會因 branch 已閉合就假裝 reward template 已完成。

## Regression

`tools/check_npc_event_runtime.mjs` 鎖定實際 new-player source branches、event flag condition、branch selection、literal action plan 與 unsupported condition fail-closed。

下一步：把 first-route 可執行的 action plan 接到 Item allocator、Pet template resolver 與 Save Transaction；尚不建立多個 playable HTML。
