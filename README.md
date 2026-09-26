# 阿肥石器時代放置版

《石器時代 OL》PC／手機共用的純前端單機放置版。

## 目前版本

**PLAYABLE CORE V1.83**

目前專案已經從資料整理階段進入可玩核心與原 C 行為逐步對齊階段。

固定開發原則：

> **原 C 規則優先、不猜數值**

固定原 C 基準：

`gavinlinasd/StoneAge@1f90cb6cb57c1df70f39cde77a5a8ccd98b66c56`

## V1.83 最新進度

V1.83 收斂玩家寵低忠誠 `RANDOMACT` 的 595 `PETSKILL_SetDuck`：

- fixed `BATTLE_PetRandomSkill()` 先用 `BATTLE_DefaultAttacker()` 選 Enemy `toNo`，再把這個值傳給 `PETSKILL_SetDuck()`
- `PETSKILL_SetDuck()` 本身會成功建立 `BATTLE_COM_S_SETDUCK`，但真正 execution 的 `PETSKILL_SetDuckChange_Battle()` 第一個 target gate 要求 `BATTLE_No2Index(toNo) == charaindex`
- 這條 RANDOMACT 的 `toNo` 是 Enemy，不可能等於施術寵自己，因此 execution 直接 FALSE：不解析 `3|60`、不寫 Duck turn/power、不產生 MagicEffect，也不吃 RNG
- `PETSKILL_SetDuck()` 同時寫 `CHAR_MAGICPETMP=0`；fixed repo 全域搜尋確認沒有任何累加該欄位的路徑，`PETSKILL_SetMagicPet()` 只讀後寫回原值，所以目前這個 reset 在 fixed build 行為上也是 0→0
- 因此 Web 不建立假的三回合 60% 閃避效果

save schema 維持 **29**。

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
