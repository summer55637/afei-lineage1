# V4.11 Browser Battle DuelPoint Plan

更新日期：2026-10-01

V4.11 接續 V4.10 Profit Route Plan，閉合 fixed-C `BATTLE_GetDuelPoint()` 的純計算邊界。

## Fixed-C semantics

`BATTLE_GetDuelPoint()` 只有在 battle side 是 `BATTLE_S_TYPE_PLAYER` 且角色不是 Pet 時才處理。它不檢查 `CHAR_ISDIE`。

計算：

- `dpadd = CHAR_WORKGETEXP`
- `dpadd != 0` 時保留至少 1 的絕對值；目前因 source 型別是 int，正／負整數本身保持原值
- `dpnow = CHAR_DUELPOINT + dpadd`
- `dpnow` clamp 到 `0..100000000`

V4.11 只產生 plan，不做 `CHAR_DUELPOINT` 寫入，也不發 UI / DB。

## Fail-closed

缺少 battle context、非 player side、Pet、非 player entry、無效 DuelPoint 或缺少 `CHAR_WORKGETEXP` 都停止。

下一版才接 `BATTLE_DUELPOINT_COMMIT` 與 Persistent State / UI / DB adapter。

Regression：`tools/check_v411_browser_battle_duelpoint.mjs`
