# 阿肥石器時代放置版－完整開發紀錄

根目錄 README 已改為精簡首頁；原本超大型 README 的歷史內容**沒有刪除**，完整依版本區段保存於下列檔案。

目前最新可玩核心：**V1.78**

## 歷史分檔

1. [專案起點～V0.46](docs/changelog/part-01-intro-to-v0.46.md)
2. [V0.47～V0.72](docs/changelog/part-02-v0.47-to-v0.72.md)
3. [V0.73～V0.96](docs/changelog/part-03-v0.73-to-v0.96.md)
4. [V0.97～V1.26](docs/changelog/part-04-v0.97-to-v1.26.md)
5. [V1.27～V1.51](docs/changelog/part-05-v1.27-to-v1.51.md)
6. [V1.52～V1.74](docs/changelog/part-06-v1.52-to-v1.74.md)
7. [V1.75～](docs/changelog/part-07-v1.75-onward.md)

## 最新版本 V1.78

V1.78 接上玩家寵低忠誠 RANDOMACT 的 Refresh / Weaken / Deeppoison / Barrier / Nocast：

- fixed RANDOMACT 的單一 DefaultAttacker `toNo` 原樣傳進 PetSkill，不依 target metadata 擴成全體
- Refresh 依 `BATTLE_MultiStatusRecovery` 的最後有效 StatusTbl 項目判定，只清一個狀態
- Weaken / Barrier：成功後 `turn+1`
- Deeppoison：成功後 `turn+2`
- Nocast：成功後原始 `turn`
- 四種狀態檢定沿用 `Success / range 30 / Bai 1.0`，且固定 build 的特殊 MOD resist 初始為 0
- 全部都是獨立特殊 command，無物理傷害／普通 Counter

完整 V1.78 原 C 對照與 regression 紀錄請看第 7 份歷史檔。
