# 阿肥石器時代放置版

《石器時代 OL》PC／手機共用的純前端單機放置版。

## 目前版本

**PLAYABLE CORE V2.02**

目前專案已經從資料整理階段進入可玩核心與原 C 行為逐步對齊階段。

固定開發原則：

> **原 C 規則優先、不猜數值**

固定原 C 基準：

`gavinlinasd/StoneAge@1f90cb6cb57c1df70f39cde77a5a8ccd98b66c56`

## V2.02 最新進度

V2.02 接入玩家寵低忠誠 `RANDOMACT` 的 **36 筆 `PETSKILL_Combined`**，沿 fixed `PETSKILL_Combined → BATTLE_COM_JYUJYUTU → MAGIC_DirectUse` 鏈完整對齊目前可證明行為。

### V2.02 Combined / DirectUse

- 36 筆 fixed `PETSKILL_Combined` 共會抽到 **101 個不同 magic ID**；選法固定為 `kill[rand()%count]`
- RANDOMACT 原先由 `BATTLE_DefaultAttacker()` 抽到的單體 `toNo` 直接存入 COM2；JYUJYUTU 不會經 `BATTLE_COM_S_ATTACK_MAGIC` 的 target rewrite
- 非 `MAGIC_AttMagic` 使用 `itemnum=0`，固定 C 取得 `MAGICUSEMP=-1` 後會令 Pet **MP +1**
- `MAGIC_AttMagic` 不扣 Pet MP；458／459／462 在固定 `magic.txt` 無 row，因此不猜效果、也不產生 MP +1
- 306 與 470～583 實際被 Combined 使用的 **69 筆 AttackMagic** 均走 fixed player-side AttackMagic pattern；raw `toNo` 只經 `BATTLE_MultiList` 與 pattern 展開
- Pet AttackMagic 依 `CHAR_EARTH_EXP～CHAR_WIND_EXP` 等價欄位保存熟練度；FalseMagic 後依 `MagicLv × 3 × 實際未閃避目標數` 累積，>100 時升級，並保留相剋屬性熟練度下降生命週期
- AttackMagic 的 `Mmagic` 會隨目前熟練度變動；Enemy 魔法抗性固定為 `trunc(LV×0.5)`
- 460／461 為同一組獨立 MagicStatus：3 回合、90%／50%；既有 MagicStatus 時不刷新、不覆蓋 `OTHERSTATUSNUMS`
- def-magic 已接入 AttackMagic 傷害抗性：只在原始 resist >0 時依百分比放大；不改 `BATTLE_MagicDodge`
- 436 虛弱固定 `虚 turn 3 成 20`，成功直接保存 `WORKWEAKEN=4`
- Combined 異常回復直接共用 V1.78 已 source-backed 的 `BATTLE_MultiStatusRecovery` 規則：掃完整個 StatusTbl、只處理最後一個正值狀態
- 修正 V1.77 遺留的 schema marker：`freshState()` 與 `normalizeState()` 現在都維持 **29**，不再把已載入存檔寫回 28
- 新增 `tools/check_v202_player_combined_runtime.mjs` 並接入 CI；V1.72～V2.02 完整 regression 已通過第一輪全綠

V2.01 BattleModel、V2.00 AttackShoot、V1.99 AttackCrazed 與既有回歸全部保留。

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
