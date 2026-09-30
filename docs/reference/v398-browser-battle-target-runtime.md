# V3.98 Browser Battle Target Runtime

更新日期：2026-10-01

V3.98 把 fixed-C 的 `BATTLE_TargetCheck()` / basic target resolution 拆成 read-only browser runtime。

## TargetCheck

固定 C 的目標有效條件：

- bid 必須落在 0..19
- target entry 存在
- Battle mode 非 0
- `CHAR_ISDIE != TRUE`
- HP > 0
- `CHAR_ISATTACKED == TRUE`
- Battle mode 不是 `BATTLE_CHARMODE_RESCUE`

符合後 V3.98 回傳：

- `executionTargetBid`
- `targetList: [targetBid, -1]`

## Invalid target

fixed-C 的 `BATTLE_TargetAdjust()` 在 target 無效時會改呼叫 `BATTLE_DefaultAttacker()` 找替代目標。

V3.98 只回傳：

`defaultAttackerRequired=true`

不執行替代目標的 RNG。這是刻意的 boundary，避免在 source RNG 尚未閉合前偷偷產生不同的戰鬥結果。

## Scope

本版只處理基本單目標 target。BOW 的多目標展開、Boomerang target table、special skill area、Capture target policy、真正 `BATTLE_Attack()` 傷害都仍未執行。

Regression：`tools/check_v398_browser_battle_target_runtime.mjs`
