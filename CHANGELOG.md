# 阿肥石器時代放置版－完整開發紀錄

根目錄 README 已改為精簡首頁；原本超大型 README 的歷史內容**沒有刪除**，完整依版本區段保存於下列檔案。

目前最新可玩核心：**V1.82**

## 歷史分檔

1. [專案起點～V0.46](docs/changelog/part-01-intro-to-v0.46.md)
2. [V0.47～V0.72](docs/changelog/part-02-v0.47-to-v0.72.md)
3. [V0.73～V0.96](docs/changelog/part-03-v0.73-to-v0.96.md)
4. [V0.97～V1.26](docs/changelog/part-04-v0.97-to-v1.26.md)
5. [V1.27～V1.51](docs/changelog/part-05-v1.27-to-v1.51.md)
6. [V1.52～V1.74](docs/changelog/part-06-v1.52-to-v1.74.md)
7. [V1.75～](docs/changelog/part-07-v1.75-onward.md)

## 最新版本 V1.82

V1.82 接上玩家寵低忠誠 RANDOMACT 的 Lighttakeed，並確認 574 嚙齒術玩家側不可用：

- 609～611：本回合 WORK攻擊=FIXSTR×0.7、WORK防禦=FIXTOUGH×0.5；原碼註解掉的敏捷×0.95不補
- `battlePetPowerMods` 在下一 round compliance 前清除，符合 WORK 值生命週期
- 現有 Enemy source-backed DamageReact 只有 Acupuncture，與 ABSROB / REFLEC / VANISH 均不匹配，因此不複製任何未建模光鏡守狀態
- 物理部分保留 BATTLE_S_AttackDamage Guardian calc-only bug與 execution-time TargetAdjust
- 574 `PETSKILL_ToothCrushe` 為 illegal=1，CHAR_TYPEPET 在 PETSKILL_Use 前直接 FALSE
- Lighttakeed 不接普通 Counter

完整 V1.82 原 C 對照與 regression 紀錄請看第 7 份歷史檔。
