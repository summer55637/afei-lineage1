# 阿肥石器時代放置版

《石器時代 OL》風格的 PC／手機共用純前端單機放置版。

## 目前版本

**PLAYABLE CORE V2.71**

目前主線已完成 V2.71，下一個核心開發版本為 **V2.72**。

> **原 C 規則優先、不猜數值**

固定原 C 基準：

`gavinlinasd/StoneAge@1f90cb6cb57c1df70f39cde77a5a8ccd98b66c56`

## V2.71 — Skill 15「火附體」

V2.71 在 V2.70 上接入巫師 Skill 15 `PROFESSION_FIRE_ENCLOSE`：

- dynamic MP：M-tier 1～3=20、4～6=30、7～9=40、10=50
- fixed Dex：`WORKQUICK+20 - RAND(work*0.2, work*0.5)`
- fixed status command uses A-tier success：`100 + A-tier×4`
- `回%3` 會保存 StatusTbl=4，之後 StatusSeq 實際造成 `150 → 100 → 50` HP
- Fire Practice 只在狀態成功後提升
- 不走一般 magic dodge / practice / GET_DAMAGE cast path
- fixed `_2` on-hit aura path：`CHAR_WORKMOD_F_ENCLOSE_2` 有寫入，但 `CHAR_WORK_F_ENCLOSE_2` 在 pinned build 沒有寫入路徑，因此 Web 不自行啟用攻擊時附燒
- regression：`tools/check_v271_profession_fire_enclose_runtime.mjs`
- save schema 維持 **30**

完整技術細節請看 [V2.71 詳細紀錄](docs/changelog/part-07-v1.75-onward.md)。

---
## V2.70 — Skill 14「冰鏡術」

V2.70 在 V2.69 乾淨核心上接入巫師 Skill 14 `PROFESSION_ICE_MIRROR`：

- dynamic MP：M-tier 1～2=20、3～4=25、5～6=30、7～8=35、9～10=40
- fixed Dex：`WORKQUICK+20 - RAND(work*0.2, work*0.5)`
- Ice Practice 在 analysis 階段提升；當次施法保留 battle-entry proficiency snapshot
- fixed GET_PRACTICE 沒有 ICE_MIRROR case：power=0，但 critical + M2 RNG 仍消耗，98～102 variance 不消耗
- special damage 依目標 Defense / Toughness 計算，並保留 type=2 GET_DAMAGE 的 Thunder proficiency/resist source bug
- Ice Mirror 無額外第二段 Dodge gate
- img2=101652；direct player-side 座標 (0,50)，其他目標 (0,-50)
- fixed source 的 NPC 800 cap 索引 quirk 不猜、不強制補 cap
- regression：`tools/check_v270_profession_ice_mirror_runtime.mjs`
- save schema 維持 **30**

完整技術細節請看 [V2.70 詳細紀錄](docs/changelog/part-07-v1.75-onward.md)。

---
## V2.69 — Skill 13「火龍槍」

V2.69 是目前保留的最後核心版本，完成：

- 巫師 Skill 13 `PROFESSION_FIRE_SPEAR`
- dynamic MP：M-tier 1～2=30、3～4=40、5～6=60、7～8=70、9～10=80
- fixed `CHAR_DOOMTIME` 共享集氣 lifecycle
- 火龍槍 2→1→0、世界末日 3→2→1→0 的 actor-pass release
- command receipt 階段扣 MP／職業技能熟練度，集氣期間不重扣
- Guard／Capture 不覆寫有效集氣 command
- DRAGNET 清除玩家 profession charge
- Fire Practice / GET_PRACTICE、type1 Fire dodge、damage、animation 與原 C RNG 順序
- FIRE_SPEAR 的 target-sort 行為維持 fixed source 的實際 live path
- save schema 維持 **30**

完整技術細節請看：

- [V2.69 詳細紀錄](docs/changelog/part-07-v1.75-onward.md)
- [完整 CHANGELOG](CHANGELOG.md)

## 最終目標
### 參考資料方式

後續開發固定同時查找兩類外部資料：

- **GitHub／原始碼**：優先找 fixed C、技能實作、資料表、動畫／封包結構，以及其他 Stone Age 開源專案做交叉比對。
- **Google／公開資料**：找舊版攻略、遊戲截圖、戰鬥流程、介面配置、地圖與玩家實機資料，補足原始碼沒有描述的視覺與操作資訊。

參考資料不直接取代專案的 fixed C 基準；遇到規則衝突時，以已確認的固定原 C 行為為核心，再用其他資料補足畫面、流程與缺少的細節。


這個專案的最終目標不是只完成「石器時代風格」的放置遊戲，而是做成一個可以直接在瀏覽器與手機遊玩的、**高度還原《石器時代 OL》遊戲體驗**的單機版。

還原範圍包含：

- 世界地圖、城鎮、野外、NPC、角色、寵物、敵人與玩家操作介面
- 主畫面 HUD、選單、道具欄、角色資訊與各種提示
- **完整戰鬥畫面與流程**，包含戰鬥佈局、角色／寵物位置、技能施放、攻擊動作、受擊、傷害跳字、MISS、DODGE、狀態效果、特效與回合節奏
- 技能、寵物、道具、任務、裝備、合成、捕獲與各種 lifecycle
- 在不猜數值的前提下，重要規則、數值、RNG 與行為盡可能依 fixed 原 C 實作
- 視覺與操作不只追求「像」，而是持續朝**版面、流程、節奏與演出高度還原**前進

原版素材若無法確認可直接使用，改以自行重製、重新繪製或使用有權限的素材，避免把不明來源的原版資源直接放進專案。

## 開發方向

後續版本會直接沿著 Git history 與 pinned 原 C 行為往下做，不重新發明一套規則。

**下一個核心版本：V2.72**

- V2.70 已完成 Skill 14 冰鏡術核心
- V2.71 已完成 Skill 15 火附體 StatusSeq 核心
- 下一版依序繼續 fixed C source → runtime → regression → CI → 視覺還原
- 不確定的 source 行為維持 fail-closed，不自行補數值

## 目前主要系統

- PC／手機共用網頁遊戲
- Encounter → Group → Enemy → RandomEnemy → RandomChange
- 玩家／寵物／Enemy 戰鬥核心
- PetSkill 與原 C RNG lifecycle
- Player 9 裝備格 + 15 existing-item 背包格
- ITEM_makeItem / ITEM_equipEffect source-backed runtime
- 玩家裝備、屬性、異常抗性、命中、會心、忽防、額外傷防
- Player / Pet death、Ultimate、裝備死亡復活、GMQUE trophy lifecycle

## 重要檔案

- `game.html`：遊戲入口
- `game.js`：主要遊戲與原 C 對齊邏輯
- `game.css`：PC／手機共用介面
- `data/generated/`：固定來源生成 runtime
- `tools/`：資料生成、檢查與 regression
- `docs/changelog/`：分段開發紀錄

## 完整開發紀錄

歷史開發紀錄依版本分檔：

- [專案起點～V0.46](docs/changelog/part-01-intro-to-v0.46.md)
- [V0.47～V0.72](docs/changelog/part-02-v0.47-to-v0.72.md)
- [V0.73～V0.96](docs/changelog/part-03-v0.73-to-v0.96.md)
- [V0.97～V1.26](docs/changelog/part-04-v0.97-to-v1.26.md)
- [V1.27～V1.51](docs/changelog/part-05-v1.27-to-v1.51.md)
- [V1.52～V1.74](docs/changelog/part-06-v1.52-to-v1.74.md)
- [V1.75～V2.71](docs/changelog/part-07-v1.75-onward.md)

README 只保留目前版本、自述與開發方向；詳細技術內容統一放在 CHANGELOG，避免首頁再次堆積過時說明。
