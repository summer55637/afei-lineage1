# 阿肥石器時代放置版－完整開發紀錄

根目錄 README 已改為精簡首頁；原本超大型 README 的歷史內容**沒有刪除**，完整依版本區段保存於下列檔案。

目前最新可玩核心：**V1.83**

## 歷史分檔

1. [專案起點～V0.46](docs/changelog/part-01-intro-to-v0.46.md)
2. [V0.47～V0.72](docs/changelog/part-02-v0.47-to-v0.72.md)
3. [V0.73～V0.96](docs/changelog/part-03-v0.73-to-v0.96.md)
4. [V0.97～V1.26](docs/changelog/part-04-v0.97-to-v1.26.md)
5. [V1.27～V1.51](docs/changelog/part-05-v1.27-to-v1.51.md)
6. [V1.52～V1.74](docs/changelog/part-06-v1.52-to-v1.74.md)
7. [V1.75～](docs/changelog/part-07-v1.75-onward.md)

## 最新版本 V1.83

V1.83 確認玩家寵低忠誠 RANDOMACT 的 595 閃避術是 source-defined no-op：

- RANDOMACT 先選 Enemy toNo；PETSKILL_SetDuck 成功建立 command
- execution 的 PETSKILL_SetDuckChange_Battle 要求 toNo 必須就是施術寵自己，否則立刻 FALSE
- 因此不解析 `3|60`、不寫閃避 turn/power、不產生效果／RNG
- `CHAR_MAGICPETMP=0` reset 在 fixed build 行為上也是 0→0：全 repo 無累加路徑，SetMagicPet 只讀後寫回同值
- Web 不自行把 595 修成可用的自體三回合 60% 閃避

完整 V1.83 原 C 對照與 regression 紀錄請看第 7 份歷史檔。
