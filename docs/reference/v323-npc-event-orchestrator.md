# V3.23 NPC Event Orchestrator

更新日期：2026-09-30

V3.23 把 V3.21 branch selector 與 V3.22 atomic transaction executor 組成單一 source event runtime entry point。

## Pipeline

`source event script → context → branch selection → action plan → atomic transaction`

`executeNpcSourceEvent()` 支援兩種模式：

- `execute:false`：只選 branch + 產生 plan，不修改 state。
- `execute:true`：使用 explicit action handlers，在 staged clone 上執行；成功才提交 revision / transaction ledger。

## First-route

目前已直接以 `xinshoujd.arg` 四段新手 branch regression。以 level 120、transmigration 0、Event 366 已完成的 context，會選 branch 365；以 level 150 則會選 branch 363。

完成過對應 EndSetFlg 的 branch 會被阻擋，不重複執行。

## Source boundary

V3.23 仍不把 unresolved reward definitions 自動補進來。`GetItem`、`GetPet`、`Charm`、event flag writer 都必須由 caller 提供 concrete handler。

所以目前第一條真正可執行 source path 已經有完整控制流，但 concrete reward mutation 仍取決於 source-backed Item / Pet definitions 與 explicit adapters。

下一步：把已存在的 Item source allocator、Pet template runtime / factory 與 event-state writer 接進這個 orchestrator，優先處理 source closure 已經足夠的 event；未閉合的保持 fail-closed。
