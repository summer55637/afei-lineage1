# 阿肥石器時代放置版－完整開發紀錄

根目錄 README 已改為精簡首頁；原本超大型 README 的歷史內容**沒有刪除**，完整依版本區段保存於下列檔案。

目前最新可玩核心：**V1.76**

## 歷史分檔

1. [專案起點～V0.46](docs/changelog/part-01-intro-to-v0.46.md)
2. [V0.47～V0.72](docs/changelog/part-02-v0.47-to-v0.72.md)
3. [V0.73～V0.96](docs/changelog/part-03-v0.73-to-v0.96.md)
4. [V0.97～V1.26](docs/changelog/part-04-v0.97-to-v1.26.md)
5. [V1.27～V1.51](docs/changelog/part-05-v1.27-to-v1.51.md)
6. [V1.52～V1.74](docs/changelog/part-06-v1.52-to-v1.74.md)
7. [V1.75～](docs/changelog/part-07-v1.75-onward.md)

## 最新版本 V1.76

V1.76 補齊玩家寵低忠誠 RANDOMACT 的 functbl / BattleProperty 邊界：

- 582 / 642 / 643 依 fixed PETSKILL_functbl 判定為 PETSKILL_Use FALSE
- 612 魔之詛咒接入 PET_PetskillPropertyEvent，物理攻守屬性會即時剋制對手
- callback 在 Pet / battle exit 時清除
- 639 蟻葬對 RANDOMACT 的存活 Enemy 依原 battle.c fall-through 為普通物理攻擊
- 仍缺真實 CHAR_PETID 的 Roar / Vary 保留不猜

完整 V1.76 原 C 對照與 regression 紀錄請看第 7 份歷史檔。
