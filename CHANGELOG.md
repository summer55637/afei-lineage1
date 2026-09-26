# 阿肥石器時代放置版－完整開發紀錄

根目錄 README 已改為精簡首頁；原本超大型 README 的歷史內容**沒有刪除**，完整依版本區段保存於下列檔案。

目前最新可玩核心：**V1.77**

## 歷史分檔

1. [專案起點～V0.46](docs/changelog/part-01-intro-to-v0.46.md)
2. [V0.47～V0.72](docs/changelog/part-02-v0.47-to-v0.72.md)
3. [V0.73～V0.96](docs/changelog/part-03-v0.73-to-v0.96.md)
4. [V0.97～V1.26](docs/changelog/part-04-v0.97-to-v1.26.md)
5. [V1.27～V1.51](docs/changelog/part-05-v1.27-to-v1.51.md)
6. [V1.52～V1.74](docs/changelog/part-06-v1.52-to-v1.74.md)
7. [V1.75～](docs/changelog/part-07-v1.75-onward.md)

## 最新版本 V1.77

V1.77 接上 fixed CHAR_PETID identity 與 Roar / Vary：

- Enemy 的 `E_T_TEMPNO → CHAR_PETID` 與捕獲後 PETID copy 已落進 Web runtime
- 581 / 734 Roar 依 option 精確 PETID 清單直接 BATTLE_Exit
- 600 / 674 Vary 僅允許 PETID 981～984，依原 C 套攻／敏與 WORKTURN 生命週期
- _FIXWOLF 的 skill 600 reroll 維持原 RNG 順序
- save schema 升至 29；舊存檔僅由已有 source tempNo 安全補 petId

完整 V1.77 原 C 對照與 regression 紀錄請看第 7 份歷史檔。
