# V4.07 Browser Battle Death Commit

更新日期：2026-10-01

V4.07 接續 V4.06 Death Plan，把 fixed-C 戰鬥中的死亡結果落到 browser battle context 的 ephemeral death state。

## Commit boundary

- 只接受 V4.06 \`deathPlan.dead === true\` / \`deathFlag === true\`
- \`CHAR_ISDIE\` 對應為 entry \`isDie = true\`
- \`CHAR_DEADCOUNT\` 對應為 entry \`deadCount += 1\`
- 保留 V4.06 的 \`clientFlags\` 與 \`ultimate\` 到 battle entry outcome
- 同一目標重複 commit 直接 fail-closed

fixed-C 的死亡旗標與死亡計數在多個戰鬥結算 / 技能 call-site 出現；本版只把明確可閉合的 \`CHAR_ISDIE\` / \`CHAR_DEADCOUNT\` state boundary 接進 browser battle context，不把 \`BATTLE_UltimateExtra()\`、\`BATTLE_NormalDeadExtra()\`、EXP、Gold、Reward 或 Persistent State 提前混入。

## Mutation boundary

V4.07 只修改 ephemeral \`battleContext\`：

- 修改：\`isDie\`、\`deadCount\`、battle outcome flags、ultimate
- 不修改：HP
- 不修改：Persistent State
- 不執行：Reward / EXP / Gold
- 不執行：Battle End

## Next boundary

下一層是 fixed-C \`BATTLE_Command()\` 的 \`BATTLE_OnlyRescue()\` / winner-side determination，再接 \`BATTLE_FinishSet()\`，最後才進 EXP / Gold / Reward / persistent settlement。

Regression：\`tools/check_v407_browser_battle_death_commit.mjs\`
