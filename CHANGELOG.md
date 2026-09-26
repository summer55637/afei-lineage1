# 阿肥石器時代放置版－完整開發紀錄

根目錄 README 已改為精簡首頁；原本超大型 README 的歷史內容**沒有刪除**，完整依版本區段保存於下列檔案。

目前最新可玩核心：**V1.99**

## 歷史分檔

1. [專案起點～V0.46](docs/changelog/part-01-intro-to-v0.46.md)
2. [V0.47～V0.72](docs/changelog/part-02-v0.47-to-v0.72.md)
3. [V0.73～V0.96](docs/changelog/part-03-v0.73-to-v0.96.md)
4. [V0.97～V1.26](docs/changelog/part-04-v0.97-to-v1.26.md)
5. [V1.27～V1.51](docs/changelog/part-05-v1.27-to-v1.51.md)
6. [V1.52～V1.74](docs/changelog/part-06-v1.52-to-v1.74.md)
7. [V1.75～](docs/changelog/part-07-v1.75-onward.md)

## 最新版本 V1.99

V1.99 已接入玩家寵低忠誠 `RANDOMACT` 的 613 `PETSKILL_AttackCrazed`（狂亂暴走）：

- 攻擊使用 `FIXSTR × 0.8`
- 防禦使用 `FIXTOUGH × 0.7`
- option=3 直接成為 `attack_max=3`
- ATTCRAZED 不設定 `gDamageDiv`，三段皆為完整物理攻擊
- `BATTLE_TargetListSet` 在第一擊前先完成三顆目標 RNG
- 保留原碼 `i < deftop` 導致 Enemy slot 19 不進預抽池的邊界
- 保留 non-BOW 第一擊消耗預抽 RNG、實際仍使用原 COM2 的行為
- 全段結束後只走一次共用 Counter chain
- 新增 V1.99 regression 並接入 CI
- 修復 workflow V1.90～V1.98 paths 段落的 8 個字面 `\\n`

完整 V1.75～V1.99 原 C 對照與 regression 紀錄請看第 7 份歷史檔。
