# V4.29 Browser Battle Enemy AI Target Types

更新日期：2026-10-02

V4.29 補齊 V4.28 source-backed enemy AI command runtime 的攻擊目標類型邊界。

## 行為

- `targetType=0`：比照 Fixed-C `BATTLE_ai_normal()` 的 switch default，採全體候選。
- `targetType=1`：全體候選。
- `targetType=2`：只選玩家角色。
- `targetType=3`：只選寵物。
- 候選掃描仍排除死亡與 Rescue entry；亂數由 caller 注入。
- 不支援的其他值仍 fail-closed，不執行模糊推定。

此版只修正 target type 的候選集，不改 action weights、target select mode 或命令提交流程；仍只規劃命令，不執行傷害、不修改 Persistent State。

## Regression

- `tools/check_v429_browser_battle_enemy_ai_target_types.mjs` 覆蓋 0/1/2/3、全體目標、玩家限定、寵物限定，以及死亡／Rescue 排除。
- `.github/workflows/check-v429-browser-battle-enemy-ai-target-types.yml` 執行回歸與 Node.js 語法檢查。

Pinned Fixed-C：`gavinlinasd/StoneAge@1f90cb6cb57c1df70f39cde77a5a8ccd98b66c56`。
