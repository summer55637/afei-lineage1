# 阿肥石器時代放置版

《石器時代 OL》PC／手機共用的純前端單機放置版。

## 目前版本

**PLAYABLE CORE V1.88**

目前專案已經從資料整理階段進入可玩核心與原 C 行為逐步對齊階段。

固定開發原則：

> **原 C 規則優先、不猜數值**

固定原 C 基準：

`gavinlinasd/StoneAge@1f90cb6cb57c1df70f39cde77a5a8ccd98b66c56`

## V1.88 最新進度

V1.87～V1.88 繼續接入玩家寵低忠誠 `RANDOMACT` 的 fixed PetSkill，完成：

- 617 `PETSKILL_Sars`（毒煞蔓延）
- 620 `PETSKILL_Hector`（威嚇攻擊）
- 622 `PETSKILL_Acupuncture`（針刺外皮）
- 同步修正既有 Enemy Sars 路徑原本只進 handler、卻被共用 status helper 當成 unsupported 而沒有真正掛上毒煞的缺口

### Hector

- `PETSKILL_Hector()` 依當輪 FIXSTR／FIXDEX 寫 `WORKATTACKPOWER` 與 `WORKQUICK`
- 低忠誠 RANDOMACT 發生在 EntrySort 後，所以敏捷 -30% 不會倒帶重排本回合，但仍影響同回合後續以 WORKQUICK 參與的戰鬥計算
- 特殊麻痺判定使用 raw COM2，發生在 common `BATTLE_TargetAdjust` 與物理攻擊 RNG 之前
- `PROFESSION_BATTLE_StatusAttackCheck(...,2,60)` 會先抽 `RAND(1,100)`，再檢查死亡／既有異常；成功條件嚴格 `roll < 60`
- Hector 直接把麻痺寫成 1 回合；LOW(COM3) 仍是技能 array 620，超過 `BATTLE_ST_END`，所以普通 `BATTLE_Attack` 的 general status block 不會再做第二次狀態判定

### Sars

- 617 option 只有「煞」，沒有 `turn` 覆寫，因此 `PETSKILL_Sars()` 保留預設 turn=3
- 命中後依普通 `BATTLE_StatusAttackCheck` 的 SARS 專用 VITAL 公式判定
- 直接感染寫入 `WORKSARS = turn+1 = 4`，並等價標記 `WORKMODSARS=1`，因此只有主感染者可以向鄰格傳染
- 擴散感染只寫 3 回合，不取得 carrier 標記
- 玩家角色中 SARS 時每回合另扣目前 MP 的 10%，既有 SARS lifecycle 繼續沿用
- 修正 Enemy Sars 共用 helper，現在同樣會真正寫入 dedicated SARS state + carrier

### Acupuncture

- `PETSKILL_Acupuncture()` 不是單純防禦技能：先在施術 Pet 身上寫 `WORKACUPUNCTURE=1`，接著直接 fall-through 進 ordinary physical common loop，仍會攻擊 raw COM2 對面的敵人
- 玩家 Pet 的針刺 flag 現在以 battle-local set 保存，不寫入存檔；換戰鬥自動清除
- `BATTLE_GetDamageReact` 已統一支援 Enemy 或玩家 Pet 作為針刺 defender
- 被非投擲物理傷害命中時：奇數傷害先補成偶數，defender 承受完整傷害，針刺立即消耗，attacker 再承受一半反彈
- 弓／回力標／投斧／投石等 throw weapon 會把 Acupuncture reflect 改回 NONE，因此不觸發、也不消耗針刺
- 反彈可殺死 Enemy attacker，會保留死亡 credit / loot lifecycle
- 已接入普通 Enemy→Pet、弓／投擲、共用 Enemy PetSkill、Counter、忠犬代擋，以及 Combo 的 DamageReact 路徑，避免只在某一種攻擊類型生效

V1.83 regression 因新 helper 插入再次縮短文字切片終點；只修測試邊界，沒有更動 SetDuck 行為。

V1.72～V1.88 CI 全部 SUCCESS。

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
