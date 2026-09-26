# 阿肥石器時代放置版

《石器時代 OL》PC／手機共用的純前端單機放置版。

## 目前版本

**PLAYABLE CORE V2.03**

目前專案已經從資料整理階段進入可玩核心與原 C 行為逐步對齊階段。

固定開發原則：

> **原 C 規則優先、不猜數值**

固定原 C 基準：

`gavinlinasd/StoneAge@1f90cb6cb57c1df70f39cde77a5a8ccd98b66c56`

## V2.03 最新進度

V2.03 完成玩家寵 **field=0/1 PetSkill coverage closure**。目前固定 `petskill2.txt` 中：

- 合法 `field=0/1 + illegal=0` 共 **233 筆**
- 共 **61 種 function string**
- 其中 **58 種**都有玩家側 RANDOMACT dispatcher／source-backed handler
- 唯一沒有 handler 的 3 種 function string 是 `PETSKILL_SelfExplodeAttack`、`PETSKILL_Awaken`、`PETSKILL_Temptation`
- 對應固定 row 只有 **582／642／643**
- 這三種在 pinned build 的 `PETSKILL_functbl` 都沒有同名註冊，因此原 `PETSKILL_Use()` 會取得 NULL function pointer、直接 FALSE / NoAction

因此目前固定資料中，**不存在仍會真正落到 generic `sourceRuntimePending` 的合法 field=0/1 玩家 PetSkill**。generic fallback 只保留給未來來源資料變更，不代表現有 fixed runtime 還有漏接技能。

新增 `tools/check_v203_player_field01_coverage.mjs`，會鎖定：

- 233 筆 legal field=0/1 rows
- 61 種 function
- 582／642／643 functbl-missing 邊界
- RANDOMACT target RNG 先消耗，再由 `PETSKILL_Use()` 發現 function pointer 缺失
- 所有現有合法 function 必須「已有 dispatcher」或「屬固定 functbl-missing」二選一
- uncovered function 必須永遠是空陣列
- BattleProperty / MagicStatusChange / Refresh / specialized status / StatusChange 的現有固定 option 都必須能通過各自 parser guard

CI 已確認 V1.72～V2.03 全部 regression success。

V2.02 Combined / AttackMagic / def-magic lifecycle 全部保留。

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
