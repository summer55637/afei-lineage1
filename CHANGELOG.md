# 阿肥石器時代放置版－完整開發紀錄

根目錄 README 已改為精簡首頁；原本超大型 README 的歷史內容**沒有刪除**，完整依版本區段保存於下列檔案。

目前最新可玩核心：**V1.80**

## 歷史分檔

1. [專案起點～V0.46](docs/changelog/part-01-intro-to-v0.46.md)
2. [V0.47～V0.72](docs/changelog/part-02-v0.47-to-v0.72.md)
3. [V0.73～V0.96](docs/changelog/part-03-v0.73-to-v0.96.md)
4. [V0.97～V1.26](docs/changelog/part-04-v0.97-to-v1.26.md)
5. [V1.27～V1.51](docs/changelog/part-05-v1.27-to-v1.51.md)
6. [V1.52～V1.74](docs/changelog/part-06-v1.52-to-v1.74.md)
7. [V1.75～](docs/changelog/part-07-v1.75-onward.md)

## 最新版本 V1.80

V1.80 接上玩家寵低忠誠 RANDOMACT 的 506～508 MP攻擊：

- `PETSKILL_MpDamage` 的 `50/100` 是 C int/int 先算，結果 0；固定 build 實際不降攻
- `BATTLE_S_MpDamage` 對 ENEMY / PET 直接 return 0
- RANDOMACT 的 DefaultAttacker 在目前 PVE 路徑選 Enemy，因此 50% / 75% / 100% MP 削減都不可達，額外 MP 傷害固定 0
- 物理部分沿用 `BATTLE_S_AttackDamage` Guardian calc-only / 原目標 DamageSub bug
- execution-time TargetAdjust 保留
- 不接普通 Counter

完整 V1.80 原 C 對照與 regression 紀錄請看第 7 份歷史檔。
