# 阿肥石器時代放置版

《石器時代 OL》風格的 **PC／手機共用純前端單機放置遊戲**。

目標不是只做「石器時代風格」，而是持續還原原作的 **流程、規則、戰鬥節奏、資料結構與操作體驗**；能由原始碼證明的規則優先照做，沒有證據的地方不自行猜數值。

---

## 🎮 目前狀態

| 項目 | 狀態 |
|---|---|
| 可玩核心 | **V3.09** |
| 下一階段 | **V3.10 groundwork** |
| 執行方式 | 純前端、瀏覽器直接執行 |
| 主要平台 | PC／手機 |
| 原 C 基準 | [gavinlinasd/StoneAge](https://github.com/gavinlinasd/StoneAge) |
| 固定 Source Ref | `1f90cb6cb57c1df70f39cde77a5a8ccd98b66c56` |

**V3.09** 是目前正式可玩的主線版本。

**V3.10** 正在獨立草稿分支持續做 source closure、runtime contract 與 regression，不提前取代 V3.09。

---

## ✨ 目前已完成的核心

### 戰鬥

- 玩家／寵物／Enemy 戰鬥核心
- Guardian、DamageReact、Counter、Acupuncture、Trap 等 caller-sensitive 流程
- Combo、多段攻擊、Death Credit、ItemCrush source-order
- Dodge、Critical、命中、屬性、防禦與異常狀態
- 固定 C RNG 順序盡可能保持一致

### 寵物與技能

- PetSkill runtime 與原 C function family 對照
- 玩家 Pet／Enemy Pet 行為
- 技能狀態、回合、熟練度與部分職業技能 lifecycle
- Pet 建立、能力值、元素、抗性與來源資料

### 道具與角色

- 玩家裝備與背包
- ITEM_makeItem／ITEM_equipEffect source-backed runtime
- 角色屬性、命中、會心、忽防、額外傷防
- Player／Pet death、復活與相關 lifecycle

### 遇敵與資料

`Encounter → Group → Enemy → RandomEnemy → RandomChange`

目前資料層持續使用 generated source data 與 regression 驗證，缺少固定來源時維持 **fail-closed**，不跨版本硬補資料。

---

## 🔬 V3.10 groundwork

GMQUE／抓寵活動已於 2026-09-29 正式決定**永久停用**。

- 不再追尋真實 `RANDGMQUE / QUEPART0..3` NPC data。
- 不建立替代或猜測的 GMQUE 任務資料。
- 不建立 GMQUE live NPC、handover、領獎 UI。
- GMQUE 既有 fixed-C 研究資料保留作歷史參考，但不再是版本 blocker，也不會自動重新啟用。

V3.10 主線改為**戰鬥畫面 presentation layer**：把現有 Player／出戰 Pet／Enemy runtime data 呈現在接近經典戰鬥配置的場景中；這一層不改 battle order、傷害、CaptureCheck 或 RNG。

介面來源筆記：[V3.10 battle UI source notes](docs/reference/v310-battle-ui-source-notes.md)。
## 🧭 開發原則

> **原 C 規則優先，不猜數值。**

固定流程：

**Source → Data → Runtime → Regression → CI → Playable Integration**

外部資料主要分成兩類：

- **GitHub／原始碼**：確認規則、資料表、函式流程、RNG、封包與結構。
- **公開資料／Google**：補充舊版介面、流程、截圖、遊戲操作與 source 沒有描述的視覺資訊。

來源互相衝突時，以已確認的固定原 C 行為為核心。

---

## 📁 專案結構

```
game.html              # 遊戲入口
game.js                # 主要 runtime
game.css               # PC／手機共用介面
data/generated/        # source-backed generated data
tools/                 # data generator／regression
docs/reference/        # source closure／研究紀錄
docs/changelog/        # 詳細版本開發紀錄
CHANGELOG.md           # 最新與歷史開發總表
```

---

## 🧪 Regression

每個重要 source closure 都搭配獨立 regression，避免「看起來合理」的 Web 實作偏離固定 C。

目前主線特別鎖定：

- V3.09 Combo Death Credit／ItemCrush boundary
- Guardian／DamageReact／Acupuncture caller order
- PetSkill source reachability
- Encounter / Enemy source closure
- GMQUE 永久停用政策與 battle presentation regression

Regression 本體保留在 `tools/`，CI 則以 `.github/workflows/` 的必要生成、核心回歸與 V3.10 source checks 為主；V2.88～V3.09 的重複 workflow 已整合成單一 matrix regression workflow。

---

## ▶️ 執行

這是純前端專案，可直接在瀏覽器開啟：

```
game.html
```

開發與驗證時，建議使用桌面瀏覽器；手機則以目前共用 responsive UI 為主要使用方式。

---

## 📚 文件

- [完整 CHANGELOG](CHANGELOG.md)
- [歷史開發紀錄](docs/changelog/)
- [Source Reference](docs/reference/)
- [固定原 C：StoneAge](https://github.com/gavinlinasd/StoneAge/tree/1f90cb6cb57c1df70f39cde77a5a8ccd98b66c56)
- [目前 V3.10 開發分支](https://github.com/summer55637/afei-lineage1/tree/v310-battle-presentation)

---

## 🎯 最終目標

把這個專案逐步做到：

**瀏覽器可玩 × PC／手機共用 × 高度還原《石器時代 OL》**

還原範圍包括：

**世界地圖、城鎮、NPC、角色、寵物、敵人、裝備、技能、任務、捕獲、戰鬥畫面、演出效果、介面與完整 gameplay lifecycle。**

不確定的地方，就繼續找 source；找不到，就明確保留邊界，而不是用猜的。

---

**目前正式可玩核心：V3.09**  
**目前開發方向：V3.10 battle presentation → runtime regression → playable integration**
