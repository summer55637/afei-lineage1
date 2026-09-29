## V3.10 groundwork：GMQUE persistent handover / reward mutation core

- pinned fixed C：`gavinlinasd/StoneAge@1f90cb6cb57c1df70f39cde77a5a8ccd98b66c56`。
- fixed NPC action order：`Check → DelGmquePet → GetGmPrize → CleanGmque`；`GMQUE_DelQueStrPet()` 成功後，reward action 失敗時不會 rollback 已移除的寵物。
- Web 新增 `quest.gmque` persistent state，以及 `sourceGmQuePrepareTaskState()`、`sourceGmQueHandoverPets()`、`sourceGmQueApplyTrophy()`。
- handover 依 current pet identity 移除對應寵物，並同步解除 team / active pet；GMQUENUMS 在 source check 後保留供後續 reward action 使用。
- pet reward 使用已完成 source closure 的 Enemy template；item reward 使用 existing-item runtime path；gold reward 對齊 pinned `_FIX_MAX_GOLD` 的身上上限與 `CHAR_PERSONAGOLD` overflow。
- 真實 `RANDGMQUE / QUEPART0..3` NPC arguments 仍是 pending-source，因此尚未接 live NPC／活動 UI，也不宣稱 playable。
- regression：`tools/check_v310_gmque_handover_mutation.mjs`
- CI：`.github/workflows/v310-gmque-runtime.yml`
# V3.10 groundwork：GMQUE reward Enemy template source closure

- 固定 C：`gavinlinasd/StoneAge@1f90cb6cb57c1df70f39cde77a5a8ccd98b66c56`。
- `GMQUE_AddQueStrTrophy()` 固定 pet reward array `{1642,1636,475,0}`，建立流程是 `ENEMY_getEnemyArrayFromId()` → `ENEMY_createPetFromEnemyIndex()`。
- pinned `enemy1.txt`／`enemybase1.txt` 完成三條 source chain：`1642→809→瑞里西尔`、`1636→803→可可恩`、`475→5→黑乌力`。
- 新增 `data/generated/stoneage_gmque_reward_enemy_templates.json`，保存 normalized source template 與固定 C creation contract。
- Web 新增 `sourceCreateGmQueRewardPet()`；只建立純 Pet object，不執行 persistent handover mutation。
- `sourceGmQueRewardPetTemplate()` 改用 source-backed Enemy template，main player-pet DB 不再是此 reward path 的 source-of-truth。
- GMQUE `RANDGMQUE / QUEPART0..3` 真實 NPC arguments 仍待 source closure；reward pet template 已閉合，但完整活動 UI／交寵／領獎 persistent mutation 尚未宣稱 playable。
- regression：`tools/check_v310_gmque_reward_enemy_template_runtime.mjs`
- CI：`.github/workflows/v310-gmque-reward-enemy-template-runtime.yml`

## V3.10 groundwork：encounter source closure

本輪把目前 encounter data 的未閉合部分固定成 source-closure contract，不因缺資料而跨版本補怪。

- pinned source：`gavinlinasd/StoneAge@1f90cb6cb57c1df70f39cde77a5a8ccd98b66c56`。
- current generated runtime：728 個 referenced Group、705 個 resolved、23 個 unresolved。
- Group 1297 明確保留 `EnemyID 2455 / TempNo 145`（水双头狼）的 `enemybase1-missing-temp` blocker。
- `stoneage_enemy_ai.json` 只有 AI metadata，不能代替缺失的 `enemybase1.txt` Enemy template。
- 新增 `tools/check_v310_encounter_source_closure.mjs` 與 `docs/reference/encounter-source-closure.md`；它同步鎖定 unresolved Group impact、template blocker 與 no-cross-version fallback。

這一輪仍不宣稱 playable core 升版；主線保持 **V3.09**。

# 阿肥石器時代放置版－完整開發紀錄

## V3.10 groundwork：Group 1230 source research

- 追查 Floor `100` Encounter `21`～`25` 共 5 處 Group `1230` 引用；目前每處 weight 都為 `100`，但都仍有其他 resolved Group，因此保持 degraded、非 blocking。
- We Love SA 公開的 SA GMSV 8.0 啟動紀錄確認該資料集啟動時顯示「有效遇敵組群數是 1230」，但這是有效組群數，不足以證明存在 `GroupID=1230` row。
- SourceForge `SA80` 公開資料目錄確認 8.0 candidate dataset 含 `group1.txt`、`enemy1.txt`、`enemybase1.txt`、`encount.txt`；因為不是 pinned fixed ref，本輪只作 discovery evidence。
- `docs/reference/group1-1230-research.md` 固定這次證據邊界；沒有跨版本搬 row，沒有用 EnemyID `1230` 反推 Group row。
- Group `1230` 目前仍是 `unresolved / non-spawnable`。


目前最新可玩核心：**V3.09**

目前主線已完成 V3.09；本版修正 Combo death credit 的 ItemCrush 後 source-order。

固定原 C：
`gavinlinasd/StoneAge@1f90cb6cb57c1df70f39cde77a5a8ccd98b66c56`

開發原則：

> **原 C 規則優先、不猜數值**

## V3.10 groundwork：GMQUE NPC source locator

- 以公開 8.0 source layout 的 `gmsv/data/npc` 為 canonical discovery root，另外保留 `data/npc`、`source/data/npc`、`vendor/data/npc`、`references/data/npc`、`reference/data/npc` 候選位置。
- 新增 `tools/check_v310_gmque_npc_source_locator.mjs`：只掃描同時含 `RANDGMQUE` 與 `QUEPART0..3` 的候選檔，不把 generated adapter 自己誤認成 live NPC data。
- locator 找到候選檔時只回報 `candidate-found`，不自動升級 ledger、不啟用 GMQUE 活動；後續仍需 pinned source provenance + content regression。
- 本輪沒有找到真實活動參數，因此 `gmqueNpcArguments` 維持 `pending-source`，playable core 維持 V3.09。

## V3.10 groundwork：GMQUE NPC argument source adapter

這一輪把 fixed `GMQUE_InSertQue()` 的 NPC argument grammar 落成 pure source adapter，但不填入任何未找到證據的實際活動參數。

- `sourceGmQueParseNpcArg()` 接受 `RANDGMQUE=4` 與 `QUEPART0..3`。
- 每槽 option 以 comma 分隔，格式為 `petID=minLv-maxLv`。
- option selection 使用 fixed inclusive `RAND(1, optionCount)`；level 使用 fixed inclusive `RAND(minLv, maxLv)`。
- 輸出固定四段 `petID-LV`，再以 `&` 組成 task string。
- 缺 key、duplicate key、格式錯、range 錯或 RNG 越界都 fail-closed。
- parser 不修改 persistent state；目前沒有真實 NPC argument 時不會建立 live GMQUE 任務。

Regression：`tools/check_v310_gmque_npc_source_contract.mjs`
Reference：`docs/reference/gmque-npc-source-contract.md`
Data contract：`data/generated/stoneage_gmque_source_closure.json`

## V3.10 groundwork：GMQUE pet reward template guard

- fixed C reward IDs `1642 / 1636 / 475` 已完成 Enemy source closure。
- source chain：`1642→809→瑞里西尔`、`1636→803→可可恩`、`475→5→黑乌力`。
- implicit-zero fourth slot 保持 `0`，不建立第四隻寵物。
- runtime 改由 source-backed template artifact 消費；完整 persistent mutation 仍未啟用。

## V3.10 groundwork：GMQUE source closure / handover parser

- pinned fixed C 仍為 `gavinlinasd/StoneAge@1f90cb6cb57c1df70f39cde77a5a8ccd98b66c56`。
- `GMQUE_InSertQue()` 從 NPC argument 的 `RANDGMQUE` 與 `QUEPART0..` 建立四段 `petID-LV` queue；`GMQUE_CheckQueStr()` 先建立 `GMQUENUMS`，再依金幣／背包 gate 檢查四隻寵。
- `GMQUE_DelQueStrPet()` 負責交出匹配寵物；`GMQUE_AddQueStrTrophy()` 才進入 pet / item / gold reward；成功獎勵後才 `GMQUE_cleanQueStr()`。
- Web runtime 新增 `sourceGmQueTaskEntries()`、`sourceGmQuePetIdentity()`、`sourceGmQueMatchPetToTask()`、`sourceGmQueHandoverCheck()`，目前只實作 source-backed parser / eligibility，不猜缺失的 Enemy template，也不直接改玩家持久狀態。
- `stoneage_enemy_ai.json` 目前存在 Enemy ID 1642／1636／475 的 AI 索引；但 AI metadata 不能代替 `ENEMY_getEnemyArrayFromId()` 所需的完整 Enemy template。
- pinned `enemy1.txt`／`enemybase1.txt` 已核對三條 reward source chain：1642→809→瑞里西尔、1636→803→可可恩、475→5→黑乌力；第四個 array slot 的 0 維持 implicit-zero，runtime 對此 fail-closed。
- `enemyItems=[1642,...]` 出現在現有 encounter group 124／125／128 的掉落欄，是 Enemy 掉落 item ID 的證據，不把這些 occurrence 誤認為 GMQUE reward pet template。
- 新增 source closure ledger 與 regression，明確守住上述資料層級邊界。

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

