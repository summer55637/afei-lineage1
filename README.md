# 阿肥石器時代放置版

《石器時代 OL》PC／手機共用的純前端單機放置版。

## 目前版本

**PLAYABLE CORE V1.99**

目前專案已經從資料整理階段進入可玩核心與原 C 行為逐步對齊階段。

固定開發原則：

> **原 C 規則優先、不猜數值**

固定原 C 基準：

`gavinlinasd/StoneAge@1f90cb6cb57c1df70f39cde77a5a8ccd98b66c56`

## V1.99 最新進度

V1.97～V1.99 繼續接入玩家寵低忠誠 `RANDOMACT`：

- 140 `PETSKILL_Steal`（偷竊）
- 211 `PETSKILL_StealMoney`（捐獻）
- 613 `PETSKILL_AttackCrazed`（狂亂暴走）

### V1.99 AttackCrazed

- 原 `PETSKILL_AttackCrazed()` 直接把攻擊設成 `FIXSTR × 0.8`、防禦設成 `FIXTOUGH × 0.7`
- 613 的 option 是 `3`；原 C 把它放進 COM3 high，執行時直接作為 `attack_max=3`
- 此技能**沒有**設定 `gDamageDiv`，所以三段不是把總傷害除以 3，而是三次完整物理攻擊
- `BATTLE_TargetListSet` 會在第一擊前先抽完三個目標 RNG
- 原碼 `for(i=defsub; i<deftop; i++)` 對 Enemy side 10～19 實際只掃 10～18；Web 對應只把 battleSlot 0～8 放進預抽池，保留 slot 19 被排除的原 C 邊界
- 非弓第一擊雖然已經消耗第一顆預抽 RNG，實際仍從原 COM2 做 `TargetAdjust`；第二、三擊才使用對應的預抽目標
- 預抽目標若在前一擊後死亡／失效，才於該段重新走 `DefaultAttacker` RNG
- 全段結束後只進一次共用 Counter chain
- 新增 `tools/check_v199_player_attackcrazed_runtime.mjs` 並接入 CI
- 同步修復 workflow 中 V1.90～V1.98 路徑段落殘留的 8 個字面 `\\n`，恢復成真正 YAML 換行

V1.97 Steal、V1.98 StealMoney 行為與 regression 全數保留。

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
