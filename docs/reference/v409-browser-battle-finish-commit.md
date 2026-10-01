
# V4.09 Browser Battle Finish Commit

更新日期：2026-10-01

V4.09 接續 V4.08 Battle End Plan，把 fixed-C BATTLE_FinishSet() 的唯一核心效果接入 browser battle context：Battle mode 由 battle 切到 finish。

## Source boundary

fixed-C BATTLE_FinishSet() 會把 BattleArray[battleindex].mode 設為 BATTLE_MODE_FINISH。BATTLE_MODE_FINISH 在 battle.h 的 enum 值是 3。

V4.09 對應：

- context.mode = finish
- context.sourceMode = 3
- context.winnerSide = V4.08 winnerSide
- context.finishReason = V4.08 finishReason

## Mutation boundary

V4.09 只修改 ephemeral Battle Context：

- 修改：battle mode / winner metadata
- 不修改：HP
- 不修改：Persistent State
- 不執行：Reward / EXP / Gold
- 不執行：BATTLE_Exit

重複 finish commit 直接 fail-closed，避免同一場戰鬥被重複進入結束結算。

## Next boundary

下一層是 fixed-C BATTLE_Finish()：WinFunc / Death Contend / DANTAI 等條件分支、BATTLE_GetProfit()、BATTLE_UltimateExtra() / BATTLE_NormalDeadExtra()、BATTLE_Exit()，最後才接 Persistent post-battle state。

Regression：tools/check_v409_browser_battle_finish_commit.mjs

