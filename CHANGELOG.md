## Maintenance notes

- Maintenance：README 補回 V2.61 歷史節點，與既有 ENCLOSE／ANNEX regression 契約同步。

## Maintenance notes

- Maintenance：README 補回 V2.62～V2.74 歷史進度節點，讓舊職業技能 regression 的文件契約與目前自述同步。

## V3.15 — source-map Encounter coordinate probe

- Maintenance：V2.33 FallGround regression 改驗證目前 `resolveEnemyAttackSeqBugToPet()` 的 calc-only Guardian source boundary，不回退舊 `enemyAttackPetResult()` helper；README 同步記錄 legacy regression 相容策略。

2026-09-30

- 將 verified map runtime 接到一般 Encounter 已產生的 `roamX / roamY`。
- 世界 HUD 顯示 `Floor/X/Y → tile/object → mapset attributes → walkability → battlemap candidates` source probe。
- probe 不重新抽座標、不消耗 `Math.random`、不執行 battle field 的 `RAND(0,2)`；實際 battle field selection 仍由外部 RNG injection 保留。
- 未收錄 Floor、越界或 source 驗證失敗維持 fail-closed。
- 新增 `tools/check_v315_source_map_encounter_probe.mjs`、`docs/reference/v315-source-map-encounter-probe.md` 與 `.github/workflows/v315-source-map-encounter-probe.yml`。

## V3.14 — fixed-C map header catalog

2026-09-30

- 新增可重跑的 fixed-C `gmsv/data/map` header scanner，只以 `LS2MAP` magic 判定 map file。
- 讀取 floor ID、show string、width、height、expected file bytes、trailing bytes 與 Git blob SHA。
- source inventory 固定為 1284 個 map blobs；不代表全部都已轉成 Web runtime。
- parser unit regression 與 CI 已完成。

## V3.13 — LS2MAP parser contract

2026-09-30

PLAYABLE CORE V3.09 — current playable baseline; V3.13 remains source/runtime groundwork.

- 依 fixed C `MAP_readMapOne()` 固定 LS2MAP binary layout。
- 新增 `tools/stoneage_ls2map_parser.mjs`、parser regression 與 CI。
- verified maps 擴充為 7 張：Floor `200、400、2000、5507、10406、10702、20000`，每張完整保存 tile/object 與 fixed-C source blob SHA。
- 再加入 verified Floor `400`（150×149）與 Floor `2000`（150×150）；三張地圖均完成 tile/object 與 battlemap candidate 交叉驗證。
- 再加入 verified Floor `200`（30×30）、`5507`（100×100）、`10406`（50×50）、`10702`（50×50），並擴充 verified map coverage regression。
- 新增 `data/generated/stoneage_map_20000.json` 與 `stoneage_map_runtime_index.json`。
- 新增 `src/stoneage_map_runtime.mjs`：`floor/x/y → tile/object`、`tile → battlemap candidates` 與 `sourceMapBattleCandidatesAt()` fail-closed API。
- 世界 HUD 開始依目前 `floorId` 查詢 verified map；沒有 source bytes 的 Floor 維持明確未收錄狀態，不猜測。

- 新增 `data/generated/stoneage_map_source_catalog.json`：固定 C `gmsv/data/map` 的 1284 個 map blobs source inventory；不等於每張地圖都已完成 Web runtime。

- `sourceMapBattleFieldNoAt()` 將 fixed C `map[RAND(0,2)]` 保留為外部 RNG injection，不讓地圖模組自行消耗 RNG。

- 新增 verified `mapset.txt` runtime：20,166 個 image ID、固定 `MAP_WALKABLE`／`MAP_HAVEHEIGHT` parser 效果，並接到 map runtime API。

- 新增 `sourceMapWalkableAt()`：對齊 fixed C `MAP_walkAbleFromPoint()` 的 ground/object WALKABLE 與 flying HEIGHT 分支，unknown/out-of-range 維持 fail-closed。

- 7 張 verified map 的 tile/object image ID 現在逐格通過 `mapset` 的 `IsValidImagenumber()` 等價驗證，避免解析成功但 image ID 無效的地圖資料。

## V3.12 — battlefield source contract

2026-09-30

- 依 fixed C 的 `BATTLE_getBattleFieldNo()`、`MAP_getTileAndObjData()`、`MAP_getImageInt()` 與 `battlemap.txt` 建立 battlefield source manifest。
- manifest 固定 220 個 battle map 定義、122 個有效 tile 範圍宣告，以及 1 筆原始反向範圍 `3137 to 1349`。
- 候選 battle map 來源固定為 `MAP_BATTLEMAP` / `MAP_BATTLEMAP2` / `MAP_BATTLEMAP3`，選擇規則固定為 `RAND(0,2)`。
- 目前不因缺少完整 floor/x/y → tile runtime 而猜測當前戰場地形。
- 戰鬥 HUD 新增原 C 戰場來源狀態列，讀取 generated manifest 的統計；若 manifest 無法載入則明確顯示 fail-closed，不冒充目前戰場地形。

regression：`tools/check_v312_battlefield_source_contract.mjs`。
## V3.10 — encounter source closure

2026-09-29

- encounter runtime 仍固定使用 pinned source `gavinlinasd/StoneAge@1f90cb6cb57c1df70f39cde77a5a8ccd98b66c56`。
- resolved／unresolved group、invalid template member 與 impacted reference 持續由 generated source-closure ledger 驗證。
- 未閉合 group 與 invalid template member 維持 non-spawnable；不跨版本猜測補資料。
## V3.11 — battle target marker presentation

2026-09-30

**目前正式可玩核心仍為 V3.09；V3.10／V3.11 為 presentation 開發主線。**

- 延續既有 battle-stage 的 `.target` class，把目前已由 runtime 選中的敵方目標做成更醒目的戰場標記。
- 新增金色目標外框、脈衝提示與「目標」標籤；`prefers-reduced-motion` 時保留靜態標記並停用動畫。
- 目標來源仍是既有 `targetEnemyUnit()`，不建立第二份 selected-target state。
- 不修改 battle order、傷害、CaptureCheck、Guardian、Counter、Acupuncture、任何 RNG 或 save schema。

regression：`tools/check_v311_battle_target_marker.mjs`。
## V3.10 — world HUD shell

2026-09-29

**目前正式可玩核心仍為 V3.09；V3.10 為開發中的 presentation 主線。**

- 新增資料驅動 world-scene shell：地圖、Encounter、Player／Pet、模式與最新系統訊息固定顯示在場景四周。
- 場景中的樹木、岩石、水路與角色標記目前為 presentation-only CSS，不偽造原版 map tile／NPC／world coordinate source。

regression：`tools/check_v310_world_hud.mjs`。

## V3.10 — battle-stage feedback presentation

2026-09-29

- 將既有 `addLog(text,type)` 的戰鬥結果轉成短暫 battle-stage feedback：傷害、會心、MISS、捕獲成功／失敗與狀態命中。
- Feedback 僅讀取已發生的 log 結果，不重新計算傷害、不重新抽 RNG。
- presentation state 不寫入 save，不改 battle order、DamageReact、Counter、Guardian、Acupuncture 或 CaptureCheck。

regression：`tools/check_v310_battle_effects.mjs`。

## V3.10 — battle HUD extension

2026-09-29

- 在已合併的 battle presentation 基礎上新增 source-shaped battle HUD：右上指令視窗、回合、目前目標、Player／Pet HP／MP。
- 回合直接讀既有 `enemy.sourceBattleTurn`；目標直接讀既有 `targetEnemyUnit()`，不建立第二份戰鬥狀態。
- 指令視窗保留經典攻擊／技能／防禦／捕獲／道具／換寵／逃跑的視覺層級；只有既有可執行按鈕保持互動，其餘明確標示尚未接入。
- 不修改 battle order、傷害、CaptureCheck、Guardian、Counter、Acupuncture 或任何 RNG。

regression：`tools/check_v310_battle_hud.mjs`。

## V3.10 — GMQUE permanently disabled / battle presentation groundwork

2026-09-29

GMQUE／抓寵活動正式標記為永久停用。

- 不再追尋 RANDGMQUE / QUEPART0..3 真實 NPC data。
- 不建立替代任務資料，不建立 live handover／領獎 UI。
- draft PR #3 已關閉；既有 GMQUE fixed-C 研究留作歷史參考。
- GMQUE 不再阻塞 V3.10、V3.11 及後續版本。
- V3.10 主線改為戰鬥畫面 presentation layer：只使用現有 runtime 的 Player／Pet／Enemy 資料，不修改 battle order、傷害公式、CaptureCheck 或 RNG。
- 經典介面參考固定為敵方左上、我方右下、右上指令區；本階段先完成資料化戰鬥場景，不虛構原版 sprite。

regression：tools/check_v310_feature_policy.mjs。
# 阿肥石器時代放置版－完整開發紀錄

目前最新可玩核心：**V3.09**

目前主線已完成 V3.09；本版修正 Combo death credit 的 ItemCrush 後 source-order。

固定原 C：
`gavinlinasd/StoneAge@1f90cb6cb57c1df70f39cde77a5a8ccd98b66c56`

開發原則：

> **原 C 規則優先、不猜數值**

## 歷史分檔

1. [專案起點～V0.46](docs/changelog/part-01-intro-to-v0.46.md)
2. [V0.47～V0.72](docs/changelog/part-02-v0.47-to-v0.72.md)
3. [V0.73～V0.96](docs/changelog/part-03-v0.73-to-v0.96.md)
4. [V0.97～V1.26](docs/changelog/part-04-v0.97-to-v1.26.md)
5. [V1.27～V1.51](docs/changelog/part-05-v1.27-to-v1.51.md)
6. [V1.52～V1.74](docs/changelog/part-06-v1.52-to-v1.74.md)
7. [V1.75～V2.78](docs/changelog/part-07-v1.75-onward.md)

## V3.09：Combo 死亡獎勵 credit 延後到 ItemCrush 後

- fixed `BATTLE_Combo()` 的 enemy death 先形成死亡狀態／flag，該次 command 的 `BATTLE_ItemCrushSeq()` 仍在後面，整個 Combo 返回後才由外層 `BATTLE_AddProfit()` 掃描死亡與獎勵。
- Web 原本在 `sourceComboAcupunctureSegment()` 與 `sourceComboApplyDamage()` 直接 `sourceMarkEnemyDeathCredit()`，會早於同一 segment／last-hit 的 `sourceBattleFinalizeItemCrushRng()`。
- 本版改成 per-hit pending death credit；同一 Combo segment 若同時造成反傷 attacker 與 original target 都死亡，兩筆 pending credit 都保留，並依 fixed Entry slot 順序 finalize，ItemCrush 完成後才寫入 reward credit。
- 另外修正 Combo last-hit result clone：pending 與 ItemCrush 現在共用同一個 `r`，避免 pending 掛在未送進 ItemCrush 的 clone 上。
- Pending list 保留 V3.08 的 idempotent guard；不改 Combo 傷害、Acupuncture／Trap 反傷、WakeUp、Guardian 或 RNG 數值。
- regression：`tools/check_v309_combo_death_credit_itemcrush.mjs`
- CI：`.github/workflows/v309-combo-death-credit-itemcrush.yml`

## V3.08：Trap／Acupuncture 反傷 attacker death credit 改到 ItemCrush 後

- Reaction finish 不再直接寫入 Enemy death/reward credit，只保留 `sourcePendingDeathCredit`。
- `sourceBattleFinalizeItemCrushRng()` 完成 fixed defender ItemCrush RNG 後，再 finalize pending death credit。
- Counter 外層接著才進 `BATTLE_AddProfit()` 對應的 Web reward pipeline。
- pending 有 idempotent guard，避免同一死亡重複結算。
- regression：`tools/check_v308_reaction_death_credit_itemcrush.mjs`
- CI：`.github/workflows/v308-reaction-death-credit-itemcrush.yml`

## V3.07：Toxin Weapon ACUPUNCTURE WakeUp = actual defindex

- `BATTLE_COM_S_TOXIN_WEAPON` 若 Guardian substitution 成功，caller 會把 `defindex` 更新成 Guardian。
- `BATTLE_DamageSub()` 後不 restore original，也不改成 attacker，因此 ACUPUNCTURE WakeUp = actual current `defindex`。
- Web shared WakeUp selector 新增 `actual`，Toxin caller 顯式使用。
- regression：`tools/check_v307_toxin_weapon_acupuncture_order.mjs`
- CI：`.github/workflows/v307-toxin-weapon-acupuncture.yml`

## V3.06：GBreak／GBreak2／FallGround ACUPUNCTURE caller-sensitive WakeUp

- `BATTLE_S_GBreak`：ACUPUNCTURE WakeUp = attacker。
- `BATTLE_S_GBreak2`：ACUPUNCTURE WakeUp = attacker。
- `BATTLE_S_FallGround`：ACUPUNCTURE WakeUp = attacker；Guardian 只作 local calc，caller defindex 仍是原 target。
- Enemy→Pet FallGround 改用 calc-only Guardian helper，避免把 Guardian 誤當成真正承傷者。
- regression：`tools/check_v306_gbreak_fallground_acupuncture_order.mjs`
- CI：`.github/workflows/v306-gbreak-fallground-acupuncture.yml`

## V3.05：ACUPUNCTURE WakeUp 改為 caller-sensitive source-order

- primary `BATTLE_Attack()`：WakeUp target = original defender。
- Counter：WakeUp target = attacker。
- `BATTLE_S_AttackDamage()` family：WakeUp target = attacker。
- profession `CHAIN_ATK`：第一段 WakeUp target = attacker；第二段重新走 ordinary `BATTLE_Attack()`。
- Guardian substitution 不會再把不同 caller 的 WakeUp 規則混成單一路徑。
- regression：`tools/check_v305_caller_sensitive_acupuncture_wakeup.mjs`
- CI：`.github/workflows/v305-caller-sensitive-acupuncture-wakeup.yml`

## V3.04：Enemy→Player Guardian Pet 的 ACUPUNCTURE 仍 WakeUp original Player

- fixed `BATTLE_Attack()` 在 ACUPUNCTURE 的 `BATTLE_DamageWakeUp()` 前仍恢復 original `defNo`。
- Enemy→Player Guardian path 已由 `resolveEnemyDirectAttackToPlayer()` 保留 original target descriptor。
- `battleApplyPhysicalHit()` 在 ACUPUNCTURE trigger 時優先使用 `r.originalTargetDesc`，因此 Guardian Pet 不會錯誤被 WakeUp。
- regression：`tools/check_v304_enemy_player_guardian_acupuncture_wakeup.mjs`
- CI：`.github/workflows/v304-enemy-player-guardian-acupuncture-wakeup.yml`

## V3.03：Guardian-provided ACUPUNCTURE 仍 WakeUp original defender

- fixed `BATTLE_Attack()` 在 Guardian substitution 後，若 `BATTLE_DamageSub()` 觸發 ACUPUNCTURE，仍在 `BATTLE_DamageWakeUp()` 前把 `defindex/toindex` 恢復為原 `defNo`。
- `applyFriendlyEnemyHit()` 現在在 ACUPUNCTURE 觸發時使用 `originalTargetDesc` WakeUp；非 ACUPUNCTURE 維持 actual target。
- 不新增傷害、反傷、Counter、Guardian 條件或 RNG。
- regression：`tools/check_v303_guardian_acupuncture_wakeup_order.mjs`
- CI：`.github/workflows/v303-guardian-acupuncture-wakeup.yml`

## V3.02：primary ACUPUNCTURE WakeUp 改回 fixed defindex restore order

- fixed `BATTLE_Attack()` 在 ACUPUNCTURE 的 `BATTLE_DamageSub()` 後，先把 `defindex/toindex` 恢復成 original defender，再呼叫 `BATTLE_DamageWakeUp()`。
- WakeUp 後才再次把 `defindex` 改成 attacker；這個後續值才供 primary Attack 的 death/status/ItemCrush source-order 使用。
- Counter caller 不走這個 restore，因此 Counter ACUPUNCTURE 仍由 `sourceFinishAcupunctureReaction()` WakeUp reflected attacker。
- regression：`tools/check_v302_primary_acupuncture_wakeup_order.mjs`
- CI：`.github/workflows/v302-primary-acupuncture-wakeup.yml`

## V3.01：original defender DamageReact／Guardian substitution 後仍保留 Counter FALSE boundary

- fixed `BATTLE_Attack()` 先於 `BATTLE_AttackSeq()` 讀取 original `defindex` 的 `BATTLE_GetDamageReact()`；一旦大於 0，就先把 `iRet/ContFlg` 關閉。
- 若 `BATTLE_AttackSeq()` 後才由 `BATTLE_GuardianCheck()` 改成 Guardian，這個 pre-AttackSeq gate 不會被 Guardian replacement 洗掉。
- Web `resolveAttackToEnemyWithGuardian()` 現在保留 original target 的 `sourceCounterBlockedByDamageReact`；沒有新增第二次 DamageReact RNG 或其他數值。
- regression：`tools/check_v301_original_damagereact_guardian_counter.mjs`
- CI：`.github/workflows/v301-original-damagereact-guardian-counter.yml`

## 主線狀態

- V2.68：Skill 12「冰箭術」
- V2.69：Skill 13「火龍槍」＋ shared `DOOMTIME` charge lifecycle
- V2.70：Skill 14「冰鏡術」／defense-derived special damage
- V2.71：Skill 15「火附體」／固定 C StatusTbl mapping correction
- V2.72：Skill 16「雷附體」／on-hit aura lifecycle
- V2.77：Skill 44／45 非戰鬥職業技能／180 秒遇敵率生命週期
- V2.78：玩家出戰 Pet RANDOMACT 的 PETSKILL_StatusChange 完整狀態 token 映射
- **V2.81：PetSkill runtime reachability／pending boundary audit**
- V2.80：Enemy FallGround／Combined source boundary audit
- V3.00：confusion target RNG＋_PREVENT_TEAMATTACK source-order boundary
- V2.99：manual first-dodge callers no-second-suit-dodge source order
- V2.98：first DuckCheck DamageReact boundary＋Guardian pre-substitution suit-dodge source order
- V2.97：ACUPUNCTURE 反傷後 WakeUp 目標對齊 fixed defindex
- V2.96：GuardianCheck 不允許 instigate 中的 Guardian 代擋
- V2.95：Guardian substitution 不重跑第二次 suit dodge
- V2.94：fixed BATTLE_DuckCheck JYUJYUTU KawashiPara=0.027 branch
- V2.93：DamageReact 阻斷 DuckCheck、但保留獨立 suit dodge
- V2.92：Enemy→Player weapon Guardian boundary
- V2.91：target-side DamageReact pre-Duck／Counter FALSE boundary
- V2.90：attacker-side DamageReact → Counter FALSE boundary
- V2.89：Counter GuardAdjust boundary
- V2.88：pre-DamageReact Counter boundary
- V2.87：fixed BATTLE_Attack DamageReact → Counter FALSE boundary
- V2.86：PETSKILL_Merge／Fixitem／Inslay 戰鬥 FALSE source boundary＋PetSkill function closure audit
- V2.79：Enemy PETFLG source parity／PetSkill source-missing boundary regression

詳細版本行為、原 C 對照、RNG 順序與 regression 均以各歷史檔為準。

