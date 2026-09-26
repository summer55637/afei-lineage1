# 阿肥石器時代放置版－完整開發紀錄

根目錄 README 已改為精簡首頁；原本超大型 README 的歷史內容**沒有刪除**，完整依版本區段保存於下列檔案。

目前最新可玩核心：**V1.74**

## 歷史分檔

1. [專案起點～V0.46](docs/changelog/part-01-intro-to-v0.46.md)
2. [V0.47～V0.72](docs/changelog/part-02-v0.47-to-v0.72.md)
3. [V0.73～V0.96](docs/changelog/part-03-v0.73-to-v0.96.md)
4. [V0.97～V1.26](docs/changelog/part-04-v0.97-to-v1.26.md)
5. [V1.27～V1.51](docs/changelog/part-05-v1.27-to-v1.51.md)
6. [V1.52～V1.74](docs/changelog/part-06-v1.52-to-v1.74.md)

## 最新版本 V1.74

V1.74 完成玩家普通遠程武器的原 C 攻擊 pattern：

- BOW：AttackNum + aBowW + RAND(0,1) 候選順序
- BOOMERANG：先消耗 AttackNum RNG，但 dedicated path 不使用該值；Player side 0 正向掃五格
- BOUNDTHROW：每段由原 raw COM2 重新 TargetAdjust
- BREAKTHROW：正傷害後依原 C 麻痺公式判定，順序為 WakeUp → 麻痺 → ItemCrush → AddProfit
- 四種 indirect weapon 已接 Guardian / Counter / Combo gate
- 玩家遠程裝備的 `weapon-pattern-unported` gate 已移除
- 混亂造成的跨 side 玩家遠程攻擊目前仍採 fail-closed，不猜未完整來源化的行為

更完整的 V1.74 原 C 對照與 regression 紀錄請看第 6 份歷史檔。
