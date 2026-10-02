# V4.32 Browser Battle Enemy AI Attack Pipeline

更新日期：2026-10-02

V4.32 以固定的 encounter 65 / Group 94 source-backed 資料驗證敵方 AI 的一般攻擊可由命令流程進入既有攻擊及扣血鏈。

## 流程

1. 從 encounter group catalog 選取 Group 94 並生成敵方隊伍。
2. 建立並初始化 transient Battle Context。
3. 套用 idle 玩家／寵物基礎命令策略，通過 player command wait gate。
4. 套用 source-backed enemy AI，產生普通攻擊命令。
5. 將敵方攻擊依序送入 AttackSeqPrelude、DamagePlan、CriticalDamagePlan、DamageReactPlan 與 DamageDeathCommit。
6. 驗證玩家 HP 由戰鬥 context 真正扣除，Persistent State revision 不變。

## 邊界

- 測試使用正式生成的 encounter group / enemy metadata 與 enemy core-stat materialization，不以人工 enemy fixture 代替來源資料。
- 測試由 caller 注入各階段必要 RNG；未提供或超出範圍時，runtime 維持 fail-closed。
- 本版閉合的是一般敵方攻擊的一次 pipeline hit。它尚未自動排程同一回合的所有 actor、counter 後續攻擊、回合結束、結算與 idle continuation。
- 不修改 Persistent State；HP mutation 僅在 transient Battle Context。

## Regression

`tools/check_v432_browser_battle_enemy_ai_attack_pipeline.mjs` 使用 encounter 65 / Group 94，並在 workflow 中重跑 V4.29–V4.31 及既有 browser attack pipeline binding regression。

Workflow：`.github/workflows/check-v432-browser-battle-enemy-ai-attack-pipeline.yml`。

Pinned Fixed-C：`gavinlinasd/StoneAge@1f90cb6cb57c1df70f39cde77a5a8ccd98b66c56`。
