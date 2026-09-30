# V3.22 NPC Event Action Transaction

更新日期：2026-09-30

V3.22 把 V3.21 的 source event action plan 接到 canonical state 的原子 mutation boundary，但不替任何未閉合 source 語意做決定。

## Transaction rule

`applyNpcEventActionPlan()` 先 deep-clone canonical state，再依 plan 執行：

`GetItem → GetPet → Charm → EndSetFlg → NowSetFlg`

每一種 mutation 都必須提供 explicit handler。缺少任一 handler、handler 回傳 false、handler 丟例外時，原始 state 完全不變，transaction 不記錄。

成功後才：

- 寫入 `runtimeMeta.npcEventTransactions[transactionId]`。
- revision +1。
- 更新 `runtimeMeta.updatedAt`。

`transactionId` 已存在時回傳 idempotent，不重複執行 action。

## 為什麼不內建 mutation

fixed-C `GetItem` / `GetPet` 在不同模組有不同細節；例如 `NPC_ActionAddPet()` 要從 Enemy table 找對應 ID，而 new-player closure 的 reward pet definitions 在目前 pinned data 仍未全部閉合。因此 V3.22 只固定 action contract，不把 missing source 定義硬塞進 Web runtime。

`Charm` 也維持 explicit handler，因為目前沒有足夠 pinned-source closure 證據把 new-player `Charm:1` 直接等同某一種 canonical state set/delta。

## First-route integration target

第一批可接的就是四段 `xinshoujd.arg` branch。Item 需要 Item allocator / source definition；Pet 需要 pet factory；EndSetFlg 需要 event-state writer；Charm 需要 explicit semantics adapter。

因此目前狀態是：

`source condition closed → action plan closed → transaction boundary closed → concrete reward mutation waits on source definition adapters`。

不建立假的 Quest Engine，不建立假的 Pet template，不建立 playable HTML。
