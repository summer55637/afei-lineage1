# V4.37 Browser Battle Enemy AI WAZA Lifecycle

更新日期：2026-10-02

V4.37 將 Fixed-C `BATTLE_ai_normal()` 的 WAZA action 選取與 target lifecycle 帶入 Browser Enemy AI command planner，並先支援無副作用的 `PETSKILL_None`。

## 行為

- `wa[0..6]` 權重抽中時，記錄 WAZA slot，並依攻擊共用的 `at[1]`／`at[2]` 完成目標候選與必要 RNG；這在 `PETSKILL_Use()` callback 前發生。
- Battle Context 由 Enemy base 保留 `petSkills[0..6]`，用來把 AI WAZA slot 對到實際 PetSkill ID。
- PetSkill ID 0（`PETSKILL_None`）會把命令設成 NONE，保留已選 target，並提交為 C_OK。
- 其他技能先完成 WAZA target RNG，再以 `enemy-ai-petskill-runtime-required` fail-closed；結果附上 slot、skill ID、target 與已消耗 RNG，不假裝技能已生效。
- 若 WAZA 候選集合為空，依來源在 `PETSKILL_Use()` 前返回失敗，不呼叫技能 callback。

本版不執行傷害、不修改 Persistent State。`ChargeAttack`、`Mighty`、`PowerBalance`、`StatusChange`、`Steal`、`NoGuard` 等仍需各自的 source-backed skill callback / action pipeline。

## Regression

`tools/check_v437_browser_battle_enemy_ai_waza_lifecycle.mjs` 覆蓋 WAZA 權重選 slot、target RNG 在 callback 前、PETSKILL_None 命令提交、Battle Context 技能槽保留、未支援 callback 的 RNG 證據，以及空 target 集合。

Workflow：`.github/workflows/check-v437-browser-battle-enemy-ai-waza-lifecycle.yml`，並重跑 V4.29–V4.37 及既有 Battle Context／Attack Pipeline regressions。

Pinned Fixed-C：`gavinlinasd/StoneAge@1f90cb6cb57c1df70f39cde77a5a8ccd98b66c56`；歷史來源對照：`docs/changelog/part-06-v1.52-to-v1.74.md` V1.63。
