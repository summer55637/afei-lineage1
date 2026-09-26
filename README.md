# 阿肥石器時代放置版

《石器時代 OL》PC／手機共用的純前端單機放置版。

## 目前版本

**PLAYABLE CORE V1.86**

目前專案已經從資料整理階段進入可玩核心與原 C 行為逐步對齊階段。

固定開發原則：

> **原 C 規則優先、不猜數值**

固定原 C 基準：

`gavinlinasd/StoneAge@1f90cb6cb57c1df70f39cde77a5a8ccd98b66c56`

## V1.86 最新進度

V1.86 接入玩家寵低忠誠 `RANDOMACT` 的下一批 fixed PetSkill：619／653／667／831 `PETSKILL_Gyrate`，以及 621／713／735 `PETSKILL_Retrace`。

- 回旋攻擊不先跑 `BATTLE_TargetAdjust`，而是直接用 raw COM2 判定 0～4／5～9／10～14／15～19 哪一個五格橫排，再把當下 `BATTLE_TargetCheck` 有效的該排單位逐一做 `BATTLE_Attack`
- Gyrate 的攻擊百分比仍依當輪 FIXSTR 寫入 WORKATTACKPOWER；低忠誠 RANDOMACT 發生在 EntrySort 後，所以不回頭影響排序
- fixed Gyrate 特殊 case 自己寫 FF 後直接 break；不進 common Counter loop，也沒有該 case 內的 `BATTLE_AddProfit`
- 追跡攻擊的 option parser 在 fixed 原 C 已整段註解；621 的 +20%、713 的 +100%、735 的 +50% 都不直接改首擊攻擊力
- Player Pet 沒有 CHAR_ARM，所以 `BATTLE_GetAttackCount()` 在忠誠檢查前會落到非 PLAYER fallback：`attack_max = 1`
- Retrace 只有首擊回傳 DODGE 時才抽 `RAND(1,100) < 80`；成功後 battle.c 固定把 WORKATTACKPOWER 改成 `FIXSTR + 20%`，再對同一個 post-TargetAdjust 目標追加一次 `BATTLE_Attack`
- Retrace 的追加攻擊不增加 `attack_count`；`BATTLE_AddProfit` 在追加攻擊之後只跑一次，外層 Counter 仍使用首擊的 `ContFlg / defNo`，不是追加攻擊的結果
- V1.83 regression 因 V1.86 helper 插入而調整文字切片終點；只修測試邊界，沒有更動 SetDuck 行為
- V1.72～V1.86 CI 全部 SUCCESS

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
