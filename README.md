# 阿肥石器時代放置版

《石器時代 OL》PC／手機共用的純前端單機放置版。

## 目前版本

**PLAYABLE CORE V1.84**

目前專案已經從資料整理階段進入可玩核心與原 C 行為逐步對齊階段。

固定開發原則：

> **原 C 規則優先、不猜數值**

固定原 C 基準：

`gavinlinasd/StoneAge@1f90cb6cb57c1df70f39cde77a5a8ccd98b66c56`

## V1.84 最新進度

V1.84 接入 19 筆 fixed `PETSKILL_SetMagicPet`：601～604、660～663、693～696、720～723、726、838、841。

- 玩家寵低忠誠 `RANDOMACT` 先由 `BATTLE_DefaultAttacker()` 選 opposing Enemy `toNo`，之後 `PETSKILL_SetMagicPet()` 原樣寫入 COM2；execution 直接交給 `BATTLE_MultiList()`，不依 `PETSKILL_TARGET` 改回友方
- Enemy AI 也是先用一般攻擊 AI 選對面目標，再把 raw target 傳入 `PETSKILL_Use()`；因此 SetMagicPet 同樣不能硬改成「我方全體」
- STR／TGH／DEX 共用 Duck／STR／TGH／DEX 互斥 gate；任一已存在就不刷新
- fixed `Other_DefcharWorkInt()` 有來源 bug：STR／TGH／DEX 三種加成都使用保存的 `mtgh` 作基準，即 `mtgh * power / 100`，Web 原樣保留
- 能力強化在施放當輪先寫狀態，下一輪 PreCommand 才套入 WORK/FIX；角色自己的 `BATTLE_StatusSeq` 再扣回合，因此即使本次扣到 0，本輪已建立的 WORK/FIX 仍有效
- HP 分支每個目標各自抽 `90%～110%`，再乘 `GetRecoveryRate()`：Player = `1 + VITAL×0.00010`、Pet/Enemy = `1 + VITAL×0.00005`，最後封頂 MaxHP；risk battle 第一次回復 Pet 另依 `CHAR_BATTLEFLG_RECOVERY` 加 `AI_FIX_PETRECOVERY=+10` VARIABLEAI，一場僅一次
- `CHAR_MAGICPETMP` 仍只有讀後寫回、沒有可達累加，所以 fixed build 的「最多三次」限制不生效；Web 不虛構計數
- fixed 騎乘回復另有主人／ridepet 分流；目前 Web 尚無實際騎乘系統，因此 V1.84 不猜 ridepet、不提前虛構分流

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
