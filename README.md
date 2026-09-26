# 阿肥石器時代放置版

《石器時代 OL》PC／手機共用的純前端單機放置版。

## 目前版本

**PLAYABLE CORE V1.82**

目前專案已經從資料整理階段進入可玩核心與原 C 行為逐步對齊階段。

固定開發原則：

> **原 C 規則優先、不猜數值**

固定原 C 基準：

`gavinlinasd/StoneAge@1f90cb6cb57c1df70f39cde77a5a8ccd98b66c56`

## V1.82 最新進度

V1.82 接上玩家寵低忠誠 `RANDOMACT` 的 Lighttakeed，並完成 574 嚙齒術的 illegal audit：

- **609 / 610 / 611：`PETSKILL_Lighttakeed`**：依 fixed C 將本回合 `WORKATTACKPOWER = FIXSTR × 0.7`、`WORKDEFENCEPOWER = FIXTOUGH × 0.5`；`WORKQUICK × 0.95` 那行原碼已註解，因此不補
- **WORK 生命週期**：使用既有 `battlePetPowerMods`，它在下一個 `normalBattleOrder()` 的 compliance 邊界會清除，因此 70%/50% 只保留本回合，且同回合 Counter 計算仍可看到這組 WORK 值
- **DamageReact**：目前 source-backed Enemy 只有 Acupuncture；它對 ABSROB / REFLEC / VANISH 都不匹配，因此 fixed `BATTLE_S_AttackDamage` 只把 local skill type 降成普通反應，不會吸收／複製任何光鏡守狀態
- **Guardian**：物理部分沿用 V1.79 的 `BATTLE_S_AttackDamage` calc-only Guardian bug；Guardian 可參與傷害計算，但真正 DamageSub 仍落原目標
- **574 嚙齒術**：fixed `petskill2.txt` 為 `illegal=1`；`PETSKILL_Use()` 對 `CHAR_TYPEPET` 在進函式前直接 FALSE，所以玩家寵 RANDOMACT 抽到 574 就是不動，不執行破壞裝備效果
- Lighttakeed 是獨立特殊 command，不接普通 Counter

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
