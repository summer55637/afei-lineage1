# 阿肥石器時代放置版

《石器時代 OL》PC／手機共用的純前端單機放置版。

## 目前版本

**PLAYABLE CORE V1.92**

目前專案已經從資料整理階段進入可玩核心與原 C 行為逐步對齊階段。

固定開發原則：

> **原 C 規則優先、不猜數值**

固定原 C 基準：

`gavinlinasd/StoneAge@1f90cb6cb57c1df70f39cde77a5a8ccd98b66c56`

## V1.92 最新進度

V1.91～V1.92 繼續接入玩家寵低忠誠 `RANDOMACT`：

- 615／616／651／656 `PETSKILL_BattleTearDamage`（撕裂傷口）
- 626 `PETSKILL_ShowMercy`（手下留情）
- 635 `PETSKILL_BecomePig`（黑烏力化）

### V1.92 ShowMercy / BecomePig

- ShowMercy 的致死保護在 `BATTLE_DamageSub`：Guardian 已代擋時，以實際 Guardian HP 做 `HP-1` clamp
- clamp 發生在 DamageReact 前，因此 Acupuncture 仍可在後面改變實際扣血
- ShowMercy 的 COM1 不會被 common loop 改成 ATTACK：原目標最多可反擊一次，ShowMercy Pet 不能再反反擊
- BecomePig 的 COM1 會在 common loop 改成 ATTACK，因此保留完整 Counter chain
- Guardian 只改 `BATTLE_Attack()` 內部 defindex；外層 Counter 仍從原 TargetAdjust 目標開始
- 玩家 Pet 對 Enemy 使用 BecomePig 時，原 C 在 `CHAR_TYPEPLAYER` 條件就失敗，因此不 parse option、不抽 `rand()%100`、不套烏力化
- 新增 `tools/check_v192_player_showmercy_becomepig_runtime.mjs` 並接入 CI

V1.91 Tear 與之前 Sonic／Regret／Firekill regression 全數保留。

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
