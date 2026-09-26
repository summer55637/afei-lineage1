# 阿肥石器時代放置版－完整開發紀錄

根目錄 README 已改為精簡首頁；原本超大型 README 的歷史內容**沒有刪除**，完整依版本區段保存於下列檔案。

目前最新可玩核心：**V1.75**

## 歷史分檔

1. [專案起點～V0.46](docs/changelog/part-01-intro-to-v0.46.md)
2. [V0.47～V0.72](docs/changelog/part-02-v0.47-to-v0.72.md)
3. [V0.73～V0.96](docs/changelog/part-03-v0.73-to-v0.96.md)
4. [V0.97～V1.26](docs/changelog/part-04-v0.97-to-v1.26.md)
5. [V1.27～V1.51](docs/changelog/part-05-v1.27-to-v1.51.md)
6. [V1.52～V1.74](docs/changelog/part-06-v1.52-to-v1.74.md)
7. [V1.75～](docs/changelog/part-07-v1.75-onward.md)

## 最新版本 V1.75

V1.75 補完玩家混亂狀態下四種遠程武器的跨 side 原 C pattern：

- StatusSeq 改寫 COM2 後仍先消耗 AttackNum RNG
- BOW invalid raw COM2 不做 DefaultAttacker，也不消耗 aBowW RAND
- BOW 可依原排列打到自己出戰 Pet，並保留 self -1 sentinel
- BOOMERANG 保留 dedicated row sweep / forward order / 30% damage
- BOUNDTHROW / BREAKTHROW 保留 raw COM2 TargetAdjust 與 raw -1 sentinel
- BREAKTHROW 保留 WakeUp → 麻痺 → ItemCrush → AddProfit
- V1.74 的 ranged-confusion fail-closed 已移除

完整 V1.75 原 C 對照與 regression 紀錄請看第 7 份歷史檔。
