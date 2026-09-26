# 阿肥石器時代放置版

《石器時代 OL》PC／手機共用的純前端單機放置版。

## 目前版本

**PLAYABLE CORE V1.77**

目前專案已經從資料整理階段進入可玩核心與原 C 行為逐步對齊階段。

固定開發原則：

> **原 C 規則優先、不猜數值**

固定原 C 基準：

`gavinlinasd/StoneAge@1f90cb6cb57c1df70f39cde77a5a8ccd98b66c56`

## V1.77 最新進度

V1.77 把上一版保留不猜的 `CHAR_PETID` 邊界正式解開：

- **CHAR_PETID source chain**：fixed `ENEMY_createEnemyIndex()` 由 `E_T_TEMPNO` 寫入 `CHAR_PETID`；`PET_createPetFromCharaIndex()` 捕獲時原值複製，因此 Web 的 Enemy／捕獲 Pet 現在保存同一個 `petId`
- **581 大吼／734 獅王之吼**：依各自 option 的精確 PETID 清單判定；命中時走 `BATTLE_Exit` 等價直接離場，不給擊殺 EXP／掉落
- **600／674 暗月變身**：fixed `PETSKILL_Vary()` 僅接受 PETID 981～984；Web 現在照原 C 只解析攻擊／敏捷百分比，不自行實作資料文字中的魔防百分比
- **Vary lifecycle**：compliance 會在變身圖號 101428 時重新套 `CHAR_SKILLSTRPOWER / CHAR_SKILLDEXPOWER`，而 `WORKTURN` 在實際執行指令後遞增，`>5` 才解除；被異常狀態跳過的回合不多算
- **_FIXWOLF**：PETID 981～984 在低忠誠 RANDOMACT 抽到 skill 600 時，仍依 fixed C 先重抽 skill slot，再進 DefaultAttacker RNG
- **save schema 29**：舊存檔只有在已有 source `tempNo` 時才補 `petId`，缺資料的不猜

## 目前主要系統

- PC／手機共用網頁遊戲
- 166 組一般野外 Lv1 捕獲基準
- Encounter → Group → Enemy → RandomEnemy → RandomChange 原版生成鏈
- Enemy 掉落與 existing-item lifecycle
- 玩家／寵物／Enemy 戰鬥核心
- 大量 PetSkill 與原 C RNG lifecycle
- Player 9 裝備格 + 15 existing-item 背包格
- ITEM_makeItem / ITEM_equipEffect source-backed runtime
- 玩家裝備需求、四屬性、異常抗性、會心、命中、忽防、額外傷防
- Player / Pet death、Ultimate、裝備死亡復活、GMQUE trophy lifecycle

## 重要檔案

- `game.html`：遊戲入口
- `game.js`：主要遊戲與原 C 對齊邏輯
- `game.css`：PC／手機共用介面
- `data/generated/stoneage_item_make_runtime.json`：固定 Item template runtime
- `tools/`：資料生成與 regression 工具

## 完整開發紀錄

原 README 已超過 GitHub 首頁 README 的顯示上限，因此從 V1.74 起改為「精簡首頁 + 歷史分檔」。

**舊內容沒有刪除。**

➡️ [查看完整 CHANGELOG / 歷史索引](CHANGELOG.md)

歷史已拆成：

- [專案起點～V0.46](docs/changelog/part-01-intro-to-v0.46.md)
- [V0.47～V0.72](docs/changelog/part-02-v0.47-to-v0.72.md)
- [V0.73～V0.96](docs/changelog/part-03-v0.73-to-v0.96.md)
- [V0.97～V1.26](docs/changelog/part-04-v0.97-to-v1.26.md)
- [V1.27～V1.51](docs/changelog/part-05-v1.27-to-v1.51.md)
- [V1.52～V1.74](docs/changelog/part-06-v1.52-to-v1.74.md)
- [V1.75～](docs/changelog/part-07-v1.75-onward.md)

之後新版本只需要在首頁更新「目前版本／最新進度」，詳細技術紀錄繼續寫入 CHANGELOG 分檔，就不會再發生首頁看起來卡在舊版本的問題。
