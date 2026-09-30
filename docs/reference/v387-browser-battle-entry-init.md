# V3.87 Browser Battle Entry Initialization

更新日期：2026-10-01

V3.87 在 V3.86 的 Battle Context topology 上，補齊 fixed-C 明確寫入的 Battle / Entry 初始化欄位。

## EntryInit

pinned `gmsv/src/battle/battle.c::EntryInit()` 明確寫入：

- `charaindex = -1`
- `bid = -1`
- `escape = 0`
- `getitem[0..2] = -1`

Browser context 不使用假的 server character index，因此 `charaindex` 用 transient `characterId` 表示；其餘明確初始化值原樣保留。

## BATTLE_CreateBattle

fixed-C 建立 Battle 時明確初始化：

- `use = TRUE`
- `mode = BATTLE_MODE_INIT`
- `turn = 0`
- `dpbattle = 0`
- `norisk = 0`
- `flg = 0`
- `field_att = BATTLE_ATTR_NONE`
- `att_count = 0`

V3.87 對應到 browser context 的 `use/mode/turn/dpbattle/norisk/flg/fieldAtt/attCount`。

## Boundary

這一版仍不執行 Battle Turn、AI、Status、Damage、Reward 或 Death settlement。

Battle Context 仍是 controller-memory transient；Persistent State 只保存 Idle lifecycle。

Regression：`tools/check_v387_browser_battle_entry_init.mjs`
