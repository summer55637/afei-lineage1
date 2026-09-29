# 阿肥石器時代放置版

《石器時代 OL》風格的 **PC／手機共用純前端單機放置遊戲**。

目標不是只做「石器時代風格」，而是持續還原原作的 **流程、規則、戰鬥節奏、資料結構與操作體驗**；能由原始碼證明的規則優先照做，沒有證據的地方不自行猜數值。

---

## 🎮 目前狀態

| 項目 | 狀態 |
|---|---|
| 可玩核心 | **V3.09** |
| 下一階段 | **V3.13 LS2MAP loader → true floor/x/y → tile runtime** |
| 執行方式 | 純前端、瀏覽器直接執行 |
| 主要平台 | PC／手機 |
| 原 C 基準 | [gavinlinasd/StoneAge](https://github.com/gavinlinasd/StoneAge) |
| 固定 Source Ref | `1f90cb6cb57c1df70f39cde77a5a8ccd98b66c56` |

**V3.09** 是目前正式可玩的主線版本。

固定 C regression pin：`gavinlinasd/StoneAge@1f90cb6cb57c1df70f39cde77a5a8ccd98b66c56`。

<!-- 歷史 regression compatibility markers：
PLAYABLE CORE V2.88 · PLAYABLE CORE V2.89 · PLAYABLE CORE V2.90 · PLAYABLE CORE V2.91 · PLAYABLE CORE V2.92 · PLAYABLE CORE V2.93 · PLAYABLE CORE V2.94 · PLAYABLE CORE V2.95 · PLAYABLE CORE V2.96 · PLAYABLE CORE V2.97 · PLAYABLE CORE V2.98 · PLAYABLE CORE V2.99 · PLAYABLE CORE V3.00 · PLAYABLE CORE V3.01 · PLAYABLE CORE V3.02 · PLAYABLE CORE V3.03 · PLAYABLE CORE V3.04 · PLAYABLE CORE V3.05 · PLAYABLE CORE V3.06 · PLAYABLE CORE V3.07 · PLAYABLE CORE V3.08 · PLAYABLE CORE V3.09 · PLAYABLE CORE V3.10 · PLAYABLE CORE V3.11 · PLAYABLE CORE V3.12。
V2.82 — FallGround DamageReact gate / CHAR_WORKPETFALL ride-system boundary
V2.83 — rideflg source boundary
V2.84 — Enemy PETSKILL_Vary / PETSKILL_Roar source parity
V2.85 — Battle-incompatible PETSKILL_Fixitem / PETSKILL_Inslay
V2.86 — PetSkill source closure audit
V2.87 — fixed BATTLE_Attack DamageReact → Counter FALSE boundary
V2.88 — pre-DamageReact Counter boundary
V2.89 — Counter GuardAdjust boundary
V2.90 — attacker-side DamageReact Counter boundary
V2.91 — target-side DamageReact pre-Duck boundary
V2.92 — Enemy→Player weapon Guardian boundary
V2.93 — DamageReact blocks DuckCheck but not independent suit dodge
V2.94 — fixed BATTLE_DuckCheck JYUJYUTU KawashiPara branch
V2.95 — Guardian substitution must not re-run suit dodge
V2.96 — GuardianCheck source block: instigate
V2.97 — ACUPUNCTURE WakeUp follows fixed DamageSub defindex
V3.01 — original Defender DamageReact survives Guardian substitution
V3.02 — primary Acupuncture WakeUp follows fixed defindex restore order
V3.06 — GBreak／GBreak2／FallGround caller-sensitive Acupuncture WakeUp
V3.08 — reaction death credit waits for ItemCrush boundary
V3.09 — Combo death credit waits for ItemCrush boundary
-->



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

## 🔬 V3.10～V3.12 presentation／source groundwork

GMQUE／抓寵活動已於 2026-09-29 正式決定**永久停用**；不再追尋 RANDGMQUE / QUEPART0..3，也不建立替代任務資料或 live handover／領獎 UI。既有 fixed-C 研究僅保留歷史參考。

**V3.10**：完成 encounter source closure 與戰鬥／世界 presentation shell，包括 battle HUD、battle-stage feedback、world HUD；不虛構原版 sprite、map tile、NPC 或 world coordinate。

**V3.11**：延續既有 `targetEnemyUnit()`，把目前戰鬥目標做成明確的「目標」標記；不建立第二份 target state，不改 RNG 或 battle runtime。

**V3.12**：依 fixed C 的 `setup.cf`、`readmap.c/readmap.h`、`battle.c` 與 pinned `battlemap.txt` 建立 battlefield source manifest，固定 220 個 battle map 定義、122 個有效範圍宣告、199 個實際被指定的 battle map，以及原始反向範圍 1 筆。戰鬥 HUD 會顯示 manifest 的 source 狀態；若 manifest 載入失敗則 fail-closed，不猜測目前戰場地形。

V3.13 已經開始有真正的 floor/x/y → tile runtime：`20000` 已從 fixed C 的 binary map 產生 50×50 verified tile/object JSON，並以 `sourceMapTileAt(floor,x,y)` 與 `sourceMapBattleCandidates(tile)` 提供 fail-closed 查詢。未知 Floor 不會被替換成假地圖。

另外，舊版 V2.74～V2.86 regression 仍可能引用歷史 `game.html`；網站正式入口仍只有 `start.html`，CI 會在測試工作目錄暫時建立 compatibility fixture，不會把舊網址重新發布。

來源筆記：[V3.12 battlefield source contract](docs/reference/v312-battlefield-source-contract.md)。
---

## 🔬 V3.13 map loader

V3.13 已正式閉合 fixed C 的 `LS2MAP` binary container 格式，新增 `tools/stoneage_ls2map_parser.mjs` 與獨立 regression。

`MAP_readMapOne()` 的 parser contract 已固定為：6-byte `LS2MAP` magic → big-endian floor ID → 32-byte show string → big-endian width／height → `width × height` tile layer → `width × height` object layer。

原 C 的逐格 `IsValidImagenumber()` 驗證與 trailing-byte warning 邊界也已記錄；Web parser 目前只解析 container，不猜 image attribute，也不直接修改遊戲 world runtime。

目前已由 fixed ref 的實際 binary map bytes 產生受控 generated tile JSON，並提供 `floor/x/y → tile/object → mapset attributes → battlemap candidates` 的 runtime API；另以 `sourceMapBattleFieldNoAt(...,{randIndex})` 保留 fixed C 的三候選 `RAND(0,2)` 選擇，沒有外部 RNG 就不抽樣。沒有可靠 bytes 的 Floor 仍維持 **fail-closed**，不虛構地圖。

來源筆記：[V3.13 LS2MAP parser contract](docs/reference/v313-ls2map-parser-contract.md)。

另有 `data/generated/stoneage_map_source_catalog.json` 保存 fixed-C `data/map` 的 1284 個 map blob 路徑、大小與 SHA；它是來源索引，不代表每個檔案都已轉成 Web runtime。

`data/generated/stoneage_mapset_runtime.json` 則保存 fixed-C `mapset.txt` 的 20,166 個 image ID 屬性索引，包含 `MAP_WALKABLE`／`MAP_HAVEHEIGHT` 的 C parser 效果。 `MAP_WALKABLE`／`MAP_HAVEHEIGHT` 的非 0 值依原 C `MAP_flgSet()` 正規化為 1，而不是保留原始整數。

**V3.13 已驗證真實 Floor map**：Floor 20000＝50×50、Floor 400＝150×149、Floor 2000＝150×150；三張地圖的 tile/object 陣列都由 fixed C `LS2MAP` bytes 產生，並固定保存各自 source blob SHA。

## 📁 專案結構

```
start.html              # 遊戲入口
game.js                # 主要 runtime
game.css               # PC／手機共用介面
data/generated/        # source-backed generated data（含 fixed-C map source catalog）
tools/                 # data generator／regression／map parser
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
- V3.12 battlefield source contract／source-status HUD
- V3.13 LS2MAP parser、verified map runtime、floor/x/y → tile/object → battlemap candidates、verified map coverage
- V3.13 fixed-C map source catalog（1284 個原始 map blobs，7 張已 verified）與 mapset normalization regression

Regression 本體保留在 `tools/`，CI 則以 `.github/workflows/` 的必要生成、核心回歸與 V3.10 source checks 為主；V2.88～V3.09 的重複 workflow 已整合成單一 matrix regression workflow。

---

## ▶️ 執行

這是純前端專案，可直接在瀏覽器開啟：

```
start.html
```

開發與驗證時，建議使用桌面瀏覽器；手機則以目前共用 responsive UI 為主要使用方式。

---

## 📚 文件

- [完整 CHANGELOG](CHANGELOG.md)
- [歷史開發紀錄](docs/changelog/)
- [Source Reference](docs/reference/)
- [固定原 C：StoneAge](https://github.com/gavinlinasd/StoneAge/tree/1f90cb6cb57c1df70f39cde77a5a8ccd98b66c56)
- [V3.12 battlefield source contract](docs/reference/v312-battlefield-source-contract.md)
- [V3.13 LS2MAP parser contract](docs/reference/v313-ls2map-parser-contract.md)

---

## 🎯 最終目標

把這個專案逐步做到：

**瀏覽器可玩 × PC／手機共用 × 高度還原《石器時代 OL》**

還原範圍包括：

**世界地圖、城鎮、NPC、角色、寵物、敵人、裝備、技能、任務、捕獲、戰鬥畫面、演出效果、介面與完整 gameplay lifecycle。**

不確定的地方，就繼續找 source；找不到，就明確保留邊界，而不是用猜的。

---

**目前正式可玩核心：V3.09**  
**目前開發方向：V3.13 verified maps 擴充 → true floor/x/y → tile runtime → battle map selection → 真實地圖 presentation → runtime regression → playable integration**
