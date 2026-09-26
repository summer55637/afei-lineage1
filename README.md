# 阿肥石器時代放置版

《石器時代 OL》PC／手機共用的純前端單機放置版。

## 目前版本

**PLAYABLE CORE V1.81**

目前專案已經從資料整理階段進入可玩核心與原 C 行為逐步對齊階段。

固定開發原則：

> **原 C 規則優先、不猜數值**

固定原 C 基準：

`gavinlinasd/StoneAge@1f90cb6cb57c1df70f39cde77a5a8ccd98b66c56`

## V1.81 最新進度

V1.81 接上玩家寵低忠誠 `RANDOMACT` 的屬性攻擊類 PetSkill：

- **544～547 / 825～828：`PETSKILL_Modifyattack`**：先完成 `BATTLE_S_AttackDamage` 的物理傷害，再依原目標永久地／水／火／風屬性加傷；保留 `rand()%(ModNum+5)` 後 C 整數 `/100` 的來源 bug
- **548～551 / 697～700：`PETSKILL_Mdfyattack`**：`BATTLE_AttrAdjust` 在本次 AttackSeq 內把攻方四屬清 0，只留下 option 指定屬性與數值
- **Guardian 差異**：兩類都走 V1.79 的 calc-only Guardian bug；Mdfyattack 的屬性相剋會拿 local Guardian 算，但真正 DamageSub 仍落原目標；Modifyattack 的後置 bonus 則讀 caller 原目標的永久屬性
- **DamageReact 差異**：Modifyattack 的 post-AttackSeq bonus 會因 local `skill_type=-1` 被取消；Mdfyattack 的元素替換看的是攻方 `WORKBATTLECOM1`，即使 local skill type 被降成 -1，元素替換仍會進 DamageCalc
- execution-time TargetAdjust 與 no-Counter lifecycle 都依 fixed `BATTLE_S_AttackDamage` 保留

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
