# 阿肥石器時代放置版

《石器時代 OL》PC／手機共用的純前端單機放置版。

## 目前版本

**PLAYABLE CORE V1.97**

目前專案已經從資料整理階段進入可玩核心與原 C 行為逐步對齊階段。

固定開發原則：

> **原 C 規則優先、不猜數值**

固定原 C 基準：

`gavinlinasd/StoneAge@1f90cb6cb57c1df70f39cde77a5a8ccd98b66c56`

## V1.97 最新進度

V1.96～V1.97 繼續接入玩家寵低忠誠 `RANDOMACT`：

- 130／607 `PETSKILL_Abduct`
- 140 `PETSKILL_Steal`（偷竊）

### V1.97 Steal

- 玩家 Pet 對 Enemy 使用偷竊時，原 `BATTLE_Steal` 對 `CHAR_TYPEENEMY` 成功率固定 0
- 但來源仍一定 consume 一次 `RAND(1,100)`；第一階段固定失敗，所以不再抽石幣／道具模式 RNG
- 玩家 Pet 不偷到任何東西，也不會因此離場
- 同步修正 Enemy→Player：第一顆成功 RNG、第二顆模式 RNG、石幣 `RAND(8,12)` 與 existing-item 抽取順序
- Enemy 偷道具改為真正掃 15 格 existing-item 背包，不再從 aggregate inventory 憑空抽 legacy item
- 偷到 existing item 後清背包 slot、同步 aggregate mirror，並結束該 existing item
- Enemy 真正偷成功後依原 C 自己 `BATTLE_Exit`；模式最終失敗則留在戰場
- Enemy 對 Pet 使用偷竊時 per=0 也仍會 consume 第一顆成功 RNG
- 新增 `tools/check_v197_player_steal_runtime.mjs` 並接入 CI

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
