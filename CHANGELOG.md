# 阿肥石器時代放置版－完整開發紀錄

目前最新可玩核心：**V3.09**

目前主線已完成 V3.09；本版修正 Combo death credit 的 ItemCrush 後 source-order。

固定原 C：
`gavinlinasd/StoneAge@1f90cb6cb57c1df70f39cde77a5a8ccd98b66c56`

開發原則：

> **原 C 規則優先、不猜數值**

## V3.10 groundwork：GMQUE pet reward template guard

- GMQUE reward pet `1642 / 1636 / 475` 現在不再只回傳一個可疑似可用的 Enemy ID。runtime 會先以目前 `DATA_URL` 的 `stoneage_general_lv1_pets.json` 建立 `enemyIds → player-pet variant` reverse index。
- 本輪核對結果：`1642 / 1636 / 475` 全部沒有 player-pet variant 命中，因此正式回傳 `pet-template-pending`；固定 C 的 implicit-zero index 3 仍維持 `implicit-zero-pet-slot`。
- 這個 guard 只解除「未來找到真正 template 後如何安全接入」的結構缺口，不捏造名稱、能力、TempNo 或初始數值。

## V3.10 groundwork：GMQUE source closure / handover parser

- pinned fixed C 仍為 `gavinlinasd/StoneAge@1f90cb6cb57c1df70f39cde77a5a8ccd98b66c56`。
- `GMQUE_InSertQue()` 從 NPC argument 的 `RANDGMQUE` 與 `QUEPART0..` 建立四段 `petID-LV` queue；`GMQUE_CheckQueStr()` 先建立 `GMQUENUMS`，再依金幣／背包 gate 檢查四隻寵。
- `GMQUE_DelQueStrPet()` 負責交出匹配寵物；`GMQUE_AddQueStrTrophy()` 才進入 pet / item / gold reward；成功獎勵後才 `GMQUE_cleanQueStr()`。
- Web runtime 新增 `sourceGmQueTaskEntries()`、`sourceGmQuePetIdentity()`、`sourceGmQueMatchPetToTask()`、`sourceGmQueHandoverCheck()`，目前只實作 source-backed parser / eligibility，不猜缺失的 Enemy template，也不直接改玩家持久狀態。
- `stoneage_enemy_ai.json` 目前存在 Enemy ID 1642／1636／475 的 AI 索引；但 AI metadata 不能代替 `ENEMY_getEnemyArrayFromId()` 所需的完整 Enemy template。
- `enemybase1.txt` 的 pinned 檔案直接核對不到 TempNo 1642／1636；因此 GMQUE pet reward 仍 fail-closed。
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

