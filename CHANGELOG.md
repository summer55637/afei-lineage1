# 阿肥石器時代放置版－完整開發紀錄

根目錄 README 已改為精簡首頁；原本超大型 README 的歷史內容**沒有刪除**，完整依版本區段保存於下列檔案。

目前最新可玩核心：**V2.00**

## 歷史分檔

1. [專案起點～V0.46](docs/changelog/part-01-intro-to-v0.46.md)
2. [V0.47～V0.72](docs/changelog/part-02-v0.47-to-v0.72.md)
3. [V0.73～V0.96](docs/changelog/part-03-v0.73-to-v0.96.md)
4. [V0.97～V1.26](docs/changelog/part-04-v0.97-to-v1.26.md)
5. [V1.27～V1.51](docs/changelog/part-05-v1.27-to-v1.51.md)
6. [V1.52～V1.74](docs/changelog/part-06-v1.52-to-v1.74.md)
7. [V1.75～](docs/changelog/part-07-v1.75-onward.md)

## 最新版本 V2.00

V2.00 已接入玩家寵低忠誠 `RANDOMACT` 的 614／647 `PETSKILL_AttackShoot`（栗子連激／栗子連激改）：

- 614 依 option `3|5` 先抽 3～5 發；647 依 `6|8` 先抽 6～8 發
- 低忠誠 RANDOMACT 的 FIXAI 只會落在 20～39，因此不進來源 `loyal>=100` 的額外爆發 RNG
- 發數 RNG 後，在第一擊前一次完成全部 target-list RNG
- 延續原碼 `i < deftop` 邊界：source slot 19 不進預抽池
- 第一擊仍以原 COM2 做 TargetAdjust；第一顆預抽 RNG 只消耗、不使用其目標值
- 每擊依 `gDamageDiv=attack_max` 分攤傷害
- 正傷害後固定先做 `RAND(1,5)` 睡眠，再做 ItemCrush RNG
- ATTSHOOT 在原 `BATTLE_CounterCheck/BATTLE_Counter` 明確禁止 Counter
- V2.00 regression 與 CI 已接入

V1.99 AttackCrazed 與 workflow YAML 換行修復全部保留。

完整 V1.75～V2.00 原 C 對照與 regression 紀錄請看第 7 份歷史檔。
