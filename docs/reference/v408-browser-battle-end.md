
# V4.08 Browser Battle End Plan

更新日期：2026-10-01

V4.08 接續 V4.07 Death Commit，將 fixed-C BATTLE_OnlyRescue() / BATTLE_Command() 的結束判定升格為 read-only browser runtime。

## Source boundary

fixed-C 的 BATTLE_Command() 在一回合戰鬥處理後：

- side 0 的 BATTLE_OnlyRescue() 回傳 0 → winside = 1、戰鬥結束
- 否則 side 1 的 BATTLE_OnlyRescue() 回傳 0 → winside = 0、戰鬥結束
- OnlyRescue 會排除 pet；alive non-pet 以 CHAR_ISDIE == FALSE 計數
- _PETSKILL_LER 開啟時，CHAR_WORK_RELIFE > 0 仍會增加 count
- 真的進入結束時，fixed-C 再呼叫 BATTLE_FinishSet()

V4.08 不在這一層執行 BATTLE_FinishSet()，避免把 battle mode、Reward、EXP、Gold 或 Persistent State 提前改掉。

## Browser contract

輸出：

- finished
- winnerSide
- finishReason
- 每一方的 participant count、alive/dead bids、relife bids、OnlyRescue 狀態
- OnlyRescue dead-entry cleanup 對應的 bids

不修改：

- HP
- battleContext
- Persistent State
- Reward / EXP / Gold
- Battle mode

Regression：tools/check_v408_browser_battle_end.mjs

