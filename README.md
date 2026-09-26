# 阿肥石器時代放置版

《石器時代 OL》PC／手機共用的純前端單機放置版。

## 目前版本

**PLAYABLE CORE V1.85**

目前專案已經從資料整理階段進入可玩核心與原 C 行為逐步對齊階段。

固定開發原則：

> **原 C 規則優先、不猜數值**

固定原 C 基準：

`gavinlinasd/StoneAge@1f90cb6cb57c1df70f39cde77a5a8ccd98b66c56`

## V1.85 最新進度

V1.85 接入玩家寵低忠誠 `RANDOMACT` 的下一批 fixed PetSkill：541／652／665／671 `WildViolentAttack`、542 `SpeedyAttack`、573 `Sacrifice`。

- 狂暴攻擊先依 option 以 FIXSTR／FIXTOUGH 算本輪 WORK 攻防，再由 `RAND(3,10)` 決定攻擊段數；同一段數同時作 `gDamageDiv`，回避數值寫入 `gBattleDuckModyfy`
- 狂暴攻擊的非弓 common loop 每段都從原 raw COM2 再跑 `BATTLE_TargetAdjust`；最後一段才進 Counter chain
- 疾速攻擊的 `防%-30` 由 `PETSKILL_SpeedyAttack()` 當下寫入 WORKDEFENCEPOWER；`敏%+30` 並不是 option parser，而是 `BATTLE_DexCalc` 對該 command 的專用排序公式
- fixed 時序是先 `BATTLE_DexCalc + EntrySort`，輪到 Pet 行動時才 `BATTLE_PetLoyalCheck`；所以低忠誠 RANDOMACT 臨時抽到疾速攻擊時，本輪不會倒帶重排，只保留防禦下降與普通物理攻擊
- 救援先嚴格檢查 `HP > MaxHP*0.2`；失敗時 `PETSKILL_Use() FALSE`，由已清成 NONE 的 RANDOMACT command 直接 NoAction
- 救援成功後 `BATTLE_S_Sacrifice` 先把施術 Pet HP 截斷成一半，再以「砍半後 HP」回復 raw opposing Enemy；雖然動畫呼叫 `BATTLE_MultiList`，真正 HP 寫入只有單一 defindex，也沒有物理攻擊／Counter
- V1.80～V1.83 舊 regression 因新 helper 插入而造成的切片終點假設已同步修正，沒有改舊版遊戲行為
- V1.72～V1.85 CI 全部 SUCCESS

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
