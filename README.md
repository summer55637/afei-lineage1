# 阿肥石器時代放置版

《石器時代 OL》風格的 **PC／手機共用純前端單機放置遊戲**。

目標不是只做「石器時代風格」，而是持續還原原作的 **流程、規則、戰鬥節奏、資料結構與操作體驗**；能由原始碼證明的規則優先照做，沒有證據的地方不自行猜數值。

---

## 🎮 目前狀態

| 項目 | 狀態 |
|---|---|
| 可玩核心 | **V3.09** |
| 下一階段 | **V3.15 verified Encounter coordinate probe → 真實地圖 presentation** |
| 執行方式 | 純前端、瀏覽器直接執行 |
| 主要平台 | PC／手機 |
| 原 C 基準 | [gavinlinasd/StoneAge](https://github.com/gavinlinasd/StoneAge) |
| 固定 Source Ref | `1f90cb6cb57c1df70f39cde77a5a8ccd98b66c56` |

**V3.09** 是目前正式可玩的主線版本。V3.10～V3.15 目前屬 source/runtime groundwork，不取代這個 playable baseline。

固定 C regression pin：`gavinlinasd/StoneAge@1f90cb6cb57c1df70f39cde77a5a8ccd98b66c56`。

<!-- 歷史 regression compatibility markers：
PLAYABLE CORE V2.61 · PLAYABLE CORE V2.62 · PLAYABLE CORE V2.63 · PLAYABLE CORE V2.64 · PLAYABLE CORE V2.65 · PLAYABLE CORE V2.66 · PLAYABLE CORE V2.67 · PLAYABLE CORE V2.68 · PLAYABLE CORE V2.69 · PLAYABLE CORE V2.70 · PLAYABLE CORE V2.71 · PLAYABLE CORE V2.72 · PLAYABLE CORE V2.73 · PLAYABLE CORE V2.74。
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

## V2.61 最新進度

V2.61 完成固定 C `PROFESSION_ENCLOSE`／Skill 5 與 `PROFESSION_ANNEX` 狀態生命週期對照：包含 ENclose 的 magic pipeline、ANNEX 的 StatusSeq 強制攻擊、既有異常狀態阻擋與固定 RNG 邊界。

這是歷史 regression 節點，正式可玩 baseline 仍維持 V3.09。

## V2.62～V2.74 歷史進度節點

## V2.62 最新進度

Skill 6 `SUMMON_THUNDER`／召雷術；此為歷史 regression/source 契約節點，正式可玩 baseline 仍為 V3.09。

## V2.63 最新進度

Skill 7 `STORM / WATER`／暴風雨；此為歷史 regression/source 契約節點，正式可玩 baseline 仍為 V3.09。

## V2.64 最新進度

Skill 8 `CURRENT`／電流術；此為歷史 regression/source 契約節點，正式可玩 baseline 仍為 V3.09。

## V2.65 最新進度

Skill 9 `FIRE_BALL`／火星球；此為歷史 regression/source 契約節點，正式可玩 baseline 仍為 V3.09。

## V2.66 最新進度

Skill 10 `BLOOD_WORMS`／嗜血蠱；此為歷史 regression/source 契約節點，正式可玩 baseline 仍為 V3.09。

## V2.67 最新進度

Skill 11 `BLOOD`／嗜血成性；此為歷史 regression/source 契約節點，正式可玩 baseline 仍為 V3.09。

## V2.68 最新進度

Skill 12 `ICE_ARROW`／冰箭術；此為歷史 regression/source 契約節點，正式可玩 baseline 仍為 V3.09。

## V2.69 最新進度

Skill 13 `FIRE_SPEAR`／火龍槍與 DOOMTIME 蓄力；此為歷史 regression/source 契約節點，正式可玩 baseline 仍為 V3.09。

## V2.70 最新進度

Skill 14 `ICE_MIRROR`／冰鏡術；此為歷史 regression/source 契約節點，正式可玩 baseline 仍為 V3.09。

## V2.71 最新進度

職業魔法 `FIRE_ENCLOSE` mapping regression；此為歷史 regression/source 契約節點，正式可玩 baseline 仍為 V3.09。

## V2.72 最新進度

職業魔法 `THUNDER_ENCLOSE` mapping regression；此為歷史 regression/source 契約節點，正式可玩 baseline 仍為 V3.09。

## V2.73 最新進度

職業魔法 `ICE_ENCLOSE`／冰附體 regression；此為歷史 regression/source 契約節點，正式可玩 baseline 仍為 V3.09。

## V2.74 最新進度

職業魔法 proficiency regression；此為歷史 regression/source 契約節點，正式可玩 baseline 仍為 V3.09。

## 🔬 V3.10～V3.12 presentation／source groundwork

GMQUE／抓寵活動已於 2026-09-29 正式決定**永久停用**；不再追尋 RANDGMQUE / QUEPART0..3，也不建立替代任務資料或 live handover／領獎 UI。既有 fixed-C 研究僅保留歷史參考。

**V3.10**：完成 encounter source closure 與戰鬥／世界 presentation shell，包括 battle HUD、battle-stage feedback、world HUD；不虛構原版 sprite、map tile、NPC 或 world coordinate。

**V3.11**：延續既有 `targetEnemyUnit()`，把目前戰鬥目標做成明確的「目標」標記；不建立第二份 target state，不改 RNG 或 battle runtime。

**V3.12**：依 fixed C 的 `setup.cf`、`readmap.c/readmap.h`、`battle.c` 與 pinned `battlemap.txt` 建立 battlefield source manifest，固定 220 個 battle map 定義、122 個有效範圍宣告、199 個實際被指定的 battle map，以及原始反向範圍 1 筆。戰鬥 HUD 會顯示 manifest 的 source 狀態；若 manifest 載入失敗則 fail-closed，不猜測目前戰場地形。

V3.13 已經開始有真正的 floor/x/y → tile runtime：`20000` 已從 fixed C 的 binary map 產生 50×50 verified tile/object JSON，並以 `sourceMapTileAt(floor,x,y)` 與 `sourceMapBattleCandidates(tile)` 提供 fail-closed 查詢。未知 Floor 不會被替換成假地圖。

另外，舊版 V1.72～V2.86 regression 仍可能引用歷史 `game.html`；網站正式入口仍只有 `start.html`，CI 會在測試工作目錄暫時建立 compatibility fixture，不會把舊網址重新發布。舊 regression 若因 runtime 重構而引用過時 helper 名稱，會優先修正測試契約，不回退正式 runtime。自訂 Pages workflow 已停用自動 push deploy，避免與 GitHub Pages managed deployment 重複競爭 artifact；正式 Pages deployment 以 managed workflow 為準。

來源筆記：[V3.12 battlefield source contract](docs/reference/v312-battlefield-source-contract.md)。
---

## 🔬 V3.14 fixed-C map header catalog

V3.14 不再手動挑下一張地圖，而是由 `tools/check_v314_stoneage_map_headers.mjs` 遞迴掃描 fixed C `gmsv/data/map`，只把前 6 bytes 為 `LS2MAP` 的檔案視為地圖。

它會從 `MAP_readMapOne()` 的固定 offset 讀 floor ID、32-byte show string、width、height、expected bytes、trailing bytes 與 Git blob SHA，輸出完整 source catalog artifact。

目前 source inventory 共 **1284 個 map blobs**；這是來源索引，不代表 1284 張都已轉成 Web runtime。

來源筆記：[V3.14 fixed-C map header catalog](docs/reference/v314-map-header-catalog.md)。

## 🔬 V3.13 map loader

V3.13 已正式閉合 fixed C 的 `LS2MAP` binary container 格式，新增 `tools/stoneage_ls2map_parser.mjs` 與獨立 regression。

`MAP_readMapOne()` 的 parser contract 已固定為：6-byte `LS2MAP` magic → big-endian floor ID → 32-byte show string → big-endian width／height → `width × height` tile layer → `width × height` object layer。

原 C 的逐格 `IsValidImagenumber()` 驗證與 trailing-byte warning 邊界也已記錄；Web parser 目前只解析 container，不猜 image attribute，也不直接修改遊戲 world runtime。

目前已由 fixed ref 的實際 binary map bytes 產生受控 generated tile JSON，並提供 `floor/x/y → tile/object → mapset attributes → battlemap candidates` 的 runtime API； `sourceMapTileWithAttributes()` 的 `attributes` 以巢狀欄位回傳，避免與 tile/object 座標欄位混淆；另有 `sourceMapWalkableAt()` 對齊 fixed C 的 ground/object `MAP_WALKABLE` 與 flying `MAP_HAVEHEIGHT` 判斷；另以 `sourceMapBattleFieldNoAt(...,{randIndex})` 保留 fixed C 的三候選 `RAND(0,2)` 選擇，沒有外部 RNG 就不抽樣。沒有可靠 bytes 的 Floor 仍維持 **fail-closed**，不虛構地圖。

來源筆記：[V3.13 LS2MAP parser contract](docs/reference/v313-ls2map-parser-contract.md)。

另有 `data/generated/stoneage_map_source_catalog.json` 保存 fixed-C `data/map` 的 1284 個 map blob 路徑、大小與 SHA；它是來源索引，不代表每個檔案都已轉成 Web runtime。

`data/generated/stoneage_mapset_runtime.json` 則保存 fixed-C `mapset.txt` 的 20,166 個 image ID 屬性索引，包含 `MAP_WALKABLE`／`MAP_HAVEHEIGHT` 的 C parser 效果。 `MAP_WALKABLE`／`MAP_HAVEHEIGHT` 的非 0 值依原 C `MAP_flgSet()` 正規化為 1，而不是保留原始整數。

**V3.13 已驗證 7 張真實 Floor map**：`200、400、2000、5507、10406、10702、20000`；每張的 tile/object 陣列都由 fixed C `LS2MAP` bytes 產生，並固定保存 source blob SHA。

## 🔬 V3.15 source-map Encounter coordinate probe

V3.15 把已驗證的 map runtime 接到一般 Encounter 已產生的 `roamX / roamY`，在世界 HUD 顯示 source probe：`Floor/X/Y → tile/object → mapset attributes → walkability → battlemap candidates`。

probe 只讀取已經發生的 Encounter 座標，不重新抽座標，也不消耗 `Math.random`；未知 Floor、越界或 source 驗證失敗則維持 fail-closed。

目前 verified map runtime：`200、400、2000、5507、10406、10702、20000`。

來源筆記：[V3.15 source-map Encounter coordinate probe](docs/reference/v315-source-map-encounter-probe.md)。

## 🔬 V3.16 client image resolver

V3.16 從公開 client source 閉合 tile 圖像來源鏈：`tile image ID → realGetNo() → ADRNBIN graphicNo → Real binary offset/size → decoder()`。

新增 `src/stoneage_client_image_runtime.mjs`，依 client `ADRNBIN` struct 解析固定 **80-byte little-endian record**，提供 image ID → graphic metadata 查詢。

目前沒有可確認可發布的 `adrn_136.bin`／`real_136.bin` asset pack，因此只做 resolver metadata contract，不把第三方客戶端圖片打包進 Pages；缺少 binary 時維持 fail-closed。

來源筆記：[V3.16 client image resolver contract](docs/reference/v316-client-image-resolver-contract.md)。

## 🔬 V3.18 authorized client asset pack adapter

V3.18 接續 V3.16 ADRNBIN resolver 與 V3.17 RD decoder，新增可由部署者自行提供的 client asset pack adapter。

預設 `client-assets/manifest.json` 維持 `unavailable`；repo 不自動下載、不內嵌原版 `adrn_*.bin`／`real_*.bin`，也不建立假 PNG。

只有在部署者自行提供具使用權的 ADRNBIN／Real binary，並以 manifest 留下 authorization note（可再以 SHA-256 pin）時，adapter 才會把 `image ID → ADRNBIN → Real → RD pixels` 串起來。

V3.18 目前仍是 source/runtime groundwork；下一層會閉合 palette／顏色映射，再進入真實 tile presentation。

## 🔬 V3.17 client RD decoder

V3.17 再往下閉合 client `Real binary` 的最後一層 parser：`RD_HEADER → raw/RLE decoder → pixels`。

新增 `src/stoneage_rd_decoder.mjs`，依 client `unpack.cpp` 實作 raw 與 legacy RLE；`compressFlag >= 16` 的 `_NEW_COLOR_` zlib 分支暫時 fail-closed，因為目前沒有需要發布的合法真彩 asset。

目前完整來源鏈已達到：`tile image ID → ADRNBIN graphicNo → Real binary payload → RD pixels`。但 repo 沒有授權可發布的 client BIN，因此 Pages 仍不打包原版圖片，也不製作假 PNG。

來源筆記：[V3.17 client RD decoder contract](docs/reference/v317-rd-decoder-contract.md)。

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
- V3.14 fixed-C map header catalog（可重跑 1284 map headers scanner）
- V3.15 verified Encounter coordinate source probe（不耗 RNG、fail-closed）
- V3.16 client image resolver（ADRNBIN 80-byte metadata contract、Real binary asset fail-closed）
- V3.17 client RD decoder（RD raw/RLE pixels、truecolor branch fail-closed）

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
**目前開發方向：V3.18 合法 client asset pack adapter → palette／顏色映射 → 真實 tile presentation → verified map 擴充 → battle map selection → runtime regression → playable integration**
