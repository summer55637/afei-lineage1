# 阿肥石器時代放置版

《石器時代 OL》PC／手機共用的純前端單機放置版。

## 目前版本

**PLAYABLE CORE V1.94**

目前專案已經從資料整理階段進入可玩核心與原 C 行為逐步對齊階段。

固定開發原則：

> **原 C 規則優先、不猜數值**

固定原 C 基準：

`gavinlinasd/StoneAge@1f90cb6cb57c1df70f39cde77a5a8ccd98b66c56`

## V1.94 最新進度

V1.93～V1.94 繼續接入玩家寵低忠誠 `RANDOMACT`：

- 633 `PETSKILL_BatFly`（群蝠四竄）
- 634 `PETSKILL_DivideAttack`（分身地裂）
- 606／727 `PETSKILL_BattleTimid`（怯戰）
- 636／824 `PETSKILL_2BattleTimid`（狂獅怒吼／恐嚇）

### V1.94 Timid

- 怯戰固定把攻／防／敏 work 值設為 FIX 的 70%／40%／80%
- 2BattleTimid 的原 parser 有特殊語意：`-攻%50` 是直接變成 FIXSTR 50%，不是「在原值上再扣 50%」
- 636 實際為攻 50%、敏 130%；824 為攻 50%、敏 150%
- 兩招都是 isolated `BATTLE_S_AttackDamage`，不進普通 Counter
- 原目標有 DamageReact 時 local skill_type 先降成 -1，因此 Timid 後置 RNG 完全不抽；Enemy 端的 Acupuncture crossover 也同步修正
- BattleTimid 在 `damage > 0` 時才抽 `rand()%100`；damage=1 仍抽但不能觸發，roll<15 且 damage>1 才迫使目標離場
- 玩家 Pet 對 Enemy 成功怯戰時走 `BATTLE_Exit`，不應算擊殺 EXP／掉落；V1.94 因此新增 deferred death-credit 路徑
- 2BattleTimid 即使命中率 roll 成功，Enemy 是 `CHAR_TYPEENEMY` 而不是 `CHAR_TYPEPET`，不會被收回寵物欄
- 新增 `tools/check_v194_player_timid_runtime.mjs` 並接入 CI

V1.91～V1.93 regression 全數保留。

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
