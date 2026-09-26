# 阿肥石器時代放置版

《石器時代 OL》PC／手機共用的純前端單機放置版。

## 目前版本

**PLAYABLE CORE V1.90**

目前專案已經從資料整理階段進入可玩核心與原 C 行為逐步對齊階段。

固定開發原則：

> **原 C 規則優先、不猜數值**

固定原 C 基準：

`gavinlinasd/StoneAge@1f90cb6cb57c1df70f39cde77a5a8ccd98b66c56`

## V1.90 最新進度

V1.89～V1.90 繼續接入玩家寵低忠誠 `RANDOMACT` 的 fixed PetSkill：

- 618 `PETSKILL_Sonic`（音波衝擊）
- 640／666／718 `PETSKILL_Regret`（憾甲一擊）
- 624 `PETSKILL_Firekill`（火線獵殺）

### Sonic / Regret

- Sonic／Regret 都先由 `BATTLE_TargetAdjust` 決定主目標；只有主目標在後排 15～19 時，才追加同欄前排 `defNo-5`
- Sonic 第二段使用 `SONIC2`，傷害 ×0.5，且倍率發生在 GuardAdjust 前
- Regret 的 DamageCalc 強制用目標 `WORKFIXTOUGH` 作防禦；第二段 `REGRET2` 再 ×0.8
- Regret 暈眩使用 `PROFESSION_BATTLE_StatusAttackCheck`：先 consume `RAND(1,100)`，再檢查死亡／已有異常，成功條件嚴格 `roll < 命%`
- 640 的 `防%-50` 會被原 parser 命中；666／718 的 `防-20%`／`防-35%` 因原 C 只搜尋字串 `防%`，實際不修改防禦
- 原目標已有 DamageReact 時，`BATTLE_S_AttackDamage` 先把 local skill_type 降為 -1：Sonic2 ×0.5、Regret2 ×0.8 與 Regret 暈眩都被跳過；Regret 的 FIXTOUGH 防禦規則仍保留
- 同步修正 Enemy Regret 與 V1.88 Acupuncture 的交叉行為
- Sonic／Regret 都是 isolated `BATTLE_S_AttackDamage` 分支，不進普通 Counter loop

### Firekill

- Firekill 不使用 `BATTLE_TargetAdjust`；raw COM2 失效／死亡／地球一周時，在原同側 10 格中由低 battle slot 起找第一個有效且非 EarthRound 目標，沒有新 RNG
- 物理段先把 `WORKATTACKPOWER = trunc(FIXSTR × 0.8)`，再執行 `BATTLE_Attack_FIREKILL`
- 物理段的 Guardian 是真正代擋；但後續火魔法仍使用原本 resolved defNo 所在橫排，不跟著 Guardian 改位置
- `BATTLE_DamageSub_FIREKILL` 讀完 DamageReact 後立刻硬設 `react = BATTLE_MD_NONE`，因此物理段完全不觸發／不消耗 Acupuncture、Reflect、Absorb、Vanish
- 同步修正既有 Enemy Firekill，避免 V1.88 後錯誤觸發玩家 Pet 的針刺
- 火魔法固定 FieldAttr=2／Power=200／MagicLv=4；PET 四系 att_magic_lv 固定 5
- 敵人魔法閃避沿原 `BATTLE_MagicDodge` 的 non-PLAYER 分支：`trunc(min(30, LV×0.2))`
- Enemy 火抗使用 `trunc(LV×0.5)`；每個未閃避目標再 consume `rand()%20` 傷害浮動
- 整個橫排共用一次 `rand()%100` TrueMagic 判定；Pet 等級固定 5，所以 roll 0～5 為 TrueMagic，但此專用函式的 false-magic ×0.7 行已被原 C 註解，不影響實際傷害
- 魔法會掃原目標所在五格橫排的所有 `BATTLE_TargetCheck` 有效目標；完整 row 結束後才解除被命中者的睡眠
- Firekill 不進普通 Counter，也沒有 inner `BATTLE_AddProfit`；命令結束後由外層 AddProfit lifecycle 統一處理

V1.72～V1.90 CI 全部 SUCCESS。

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
