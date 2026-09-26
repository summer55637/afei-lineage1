# 阿肥石器時代放置版

《石器時代 OL》PC／手機共用的純前端單機放置版。

## 目前版本

**PLAYABLE CORE V2.01**

目前專案已經從資料整理階段進入可玩核心與原 C 行為逐步對齊階段。

固定開發原則：

> **原 C 規則優先、不猜數值**

固定原 C 基準：

`gavinlinasd/StoneAge@1f90cb6cb57c1df70f39cde77a5a8ccd98b66c56`

## V2.01 最新進度

V2.01 接入玩家寵低忠誠 `RANDOMACT` 的 **28 筆 `PETSKILL_BattleModel`**：

- 590、638、641、649、650、654、655、664、668、669
- 689～692、717
- 812～823
- 829

### V2.01 BattleModel

- 28 筆 fixed runtime 都是 `type=5`；原 C 位元意義為 `0x01` cover-all + `0x04` physical
- `PETSKILL_BattleModel()` 會覆寫 COM2 low/high 為 type／object count，低忠誠 RANDOMACT 原先抽到的 `toNo` 不再參與真正攻擊目標
- Enemy side 先經 `BATTLE_MultiList(TARGET_SIDE_1)` + `SortLoc`，固定順序為 source slot `13,11,10,12,14,18,16,15,17,19`
- Web 對應 `battleSlot [3,1,0,2,4,8,6,5,7,9]`
- object count 小於存活目標數且 type bit 1 開啟時，會繼續覆蓋剩餘敵人；object count 大於等於目標數時，多出的分身才在**執行當下**逐顆 `RAND(0,i0-1)`
- 額外分身抽中已被前面分身打倒的原始目標時，原 `BATTLE_TargetCheck` 直接跳過，不另找新目標
- option 第 6 欄能力修正保留原 parser bug：攻／防／敏三種 token 都以當下 `WORKATTACKPOWER` 作計算基底；目前 28 筆實際都只有攻擊修正
- physical bit 4 使用真正 Guardian substitution；後續 ItemCrush／狀態都作用在實際代擋者
- BattleModel 特例：實際目標**存活時**即使 MISS／DODGE／0 傷仍會 consume ItemCrush RNG；致死則不做 ItemCrush
- 狀態在 ItemCrush 之後檢定，使用 `EffectHit + level差×1`、range 30，並直接存 `iTurn`，不套 common StatusChange 的 +1
- 已接 `麻／眠／石／障／劇／虛／羅`；其中 `羅` 為天羅地網，下一次行動依原 `BATTLE_CanMoveCheck` 禁止行動
- BattleModel command 不進普通 Counter，也沒有 per-object `BATTLE_AddProfit`
- 新增 `tools/check_v201_player_battlemodel_runtime.mjs` 並接入 CI；V1.72～V2.01 完整 regression 已全綠

V1.99 AttackCrazed、V2.00 AttackShoot 與 CI 換行修正全部保留。

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
