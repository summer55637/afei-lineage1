# 重建藍圖：最終目標前的資料與系統補齊

更新日期：2026-10-01


## 2026-10-01 V4.25 follow-up：Bind AttackSeq → Damage → React → Counter

本輪固定 C audit 確認普通 attack 的核心 pair 是 attackNo / defNo：BATTLE_Attack() 依這兩個 bid 取 attacker / defender；BATTLE_TargetAdjust() 只在 target invalid 時改寫 command target；BATTLE_Counter() 則從原 attack pair 反向進入 counter chain。

Browser Controller 現在建立 transient battleAttackPipeline，不進 Persistent State：

Player Command → AttackSeq Prelude → Damage Plan → Critical Damage Plan → Damage React Plan → Counter Plan

AttackSeq 成功後保存 requestedTarget / finalTarget、weaponType / throw state 與 critical decision。Damage Plan 只能使用同一 attacker + finalTarget，並保存本次 damage RNG / field input。

Critical Damage Plan 必須先有 Damage Plan，並重用已保存的 damage inputs；重新計算出的 baseDamage 若與前一階段不一致則 fail-closed。Critical outcome 直接來自 AttackSeq，不接受 caller 重新指定。

Damage React Plan 必須使用同一 pair 與 Critical Damage 的最終 damage；Counter Plan 第一個 reverse pair 固定為原 target → 原 attacker。

Player command 改變、death commit、finish commit、Pet Exit / Battle Context Clear 都會清除 attack pipeline，避免舊 attack evidence 穿越 lifecycle。

新增 regression：tools/check_browser_battle_attack_pipeline_binding.mjs，驗證各階段順序、target substitution、damage substitution、core result continuity、counter reverse binding，以及 battle pipeline 進入後不可回退。

本輪沒有新增 fixed-C damage / critical / guard / reaction / counter 數值規則；只是把既有 runtime 結果接成同一 execution provenance chain。

## 2026-10-01 V4.25 follow-up：Close Battle Initialize → Turn → Attack phase re-entry

固定 C 的 battle loop 是 BATTLE_MODE_INIT → BATTLE_Init() → BATTLE_MODE_BATTLE → BATTLE_Command()；BATTLE_Init() 將 mode 切到 battle 後再跑 SurpriseCheck / PreCommandSeq。Browser 端原本可以在 Context 已經進入 battle 後再次呼叫 BATTLE_INITIALIZE，也能再次 BATTLE_TURN_INITIALIZE，造成 turn / command 狀態被重新初始化。

現在 Controller 將 lifecycle 鎖成：

Context Build (mode=init) → BATTLE_INITIALIZE → active battle (mode=battle) → player command / target / attack planning

BATTLE_INITIALIZE 只接受 mode=init。固定 C 的 Turn Initialize 是 BATTLE_Init / PreCommandSeq 內部步驟，因此 Controller 不再暴露獨立的 BATTLE_TURN_INITIALIZE 外部 dispatch；低層 turn runtime 仍保留給 direct runtime regression。Player command、target resolve、default target resolve、attack preflight、AttackSeqPrelude 都要求 context.mode=battle；AttackSeqPrelude 另外綁定 attacker 當前 ATTACK / BOOMERANG command 與 command target，避免 command 與實際執行 target 脫鉤。

這一輪沒有改 damage formula、critical / guard / dodge、reward 或 death policy；只是封住「初始化完成後又從外部重跑前置階段」的 lifecycle bypass。

Regression 繼續放在 tools/check_browser_encounter_group_enemy_binding.mjs，同時驗證：未初始化時 attack 被拒絕、Battle Initialize 成功、第二次 Initialize 被拒絕、active battle 再次 Turn Initialize 被拒絕。

## 2026-10-01 V4.25 follow-up：Bind Enemy Core Stat Hydration to Generated Roster

本輪繼續往 Enemy Generate → Core Stat Hydration → Battle Initialize 檢查，發現單純綁定 enemyTeam 還不夠：後續 hydration 的 RNG rolls 如果可以任意替換，實際進 Battle Context 的數值就可能與已生成 roster 脫鉤。

現在當 encounter group catalog 已配置時，Enemy Generate 可以建立同一個 transient core-stat roll plan；Battle Context 若要求 materializeEnemyStats，必須使用同一份 rolls，或提供與 plan 完全一致的副本。不同 rolls 直接 fail-closed。

Hydration 仍由既有 ENEMY core-stat runtime 執行，固定 15 calls / enemy 的已定義 schema 不變；本輪沒有重新選 enemy，也沒有改 rank、base stats、HP、EXP、Gold、Item 或其他 battle 數值規則。

新增 regression 延伸到 tools/check_browser_encounter_group_enemy_binding.mjs：確認兩名 source enemy 的 core stats 實際進入 Battle Context、roll plan 被竄改會拒絕、Context 建立後 transient plan 不能 replay。

固定 C audit 仍以 pinned gavinlinasd/StoneAge ref 為最高來源。

## 2026-10-01 V4.25 follow-up：Bind Encounter Group → Enemy Generation → Battle Context

本輪繼續檢查下一場 battle 的 enemy roster provenance，發現即使 encounter / groupId 正確，ENCOUNTER_BATTLE_CONTEXT_BUILD 仍可能直接接受 caller 自己組出的 enemyTeam，導致「選到 Group A、實際打 Group B」的替換風險。

現在當 Controller 配置了 encounter group catalog 時，Group Select → Enemy Generate → Battle Context Build 會形成單一暫態 pipeline：

Group Select 必須先發生；Enemy Generate 必須使用同一個 selected group；Battle Context Build 必須使用同一 revision、同一 canonical encounter、同一 group 以及完全相同的 generated enemyTeam。

Battle Context 成功建立後立即清除這份 transient generation plan，不進 Persistent State。Group / Enemy generation 不重新抽 RNG；core-stat hydration 的 rolls 也綁在同一 generation plan，之後由既有 core-stat runtime 執行，並一路保留到 Battle Initialize。

新增 regression：tools/check_browser_encounter_group_enemy_binding.mjs，驗證正常 group→enemy generation→context、手動替換 enemyTeam 被拒絕，以及未先 Group Select 就 Generate 被拒絕。

本輪仍不新增 fixed-C battle、reward、EXP、Gold、Item 規則。

## 2026-10-01 V4.25 follow-up：Battle Context source encounter binding

在 Context Clear → Idle moving → 下一次 encounter 的回圈 audit 中，發現 ENCOUNTER_BATTLE_CONTEXT_BUILD 原本可以直接接受 caller 提供的 encounter snapshot；只要 idle.mode=encounter_pending，就可能把不相符的 encounter identity 帶進下一個 Battle Context。

現在只要 Controller 有 pinned encounter target index，就會在 Battle Context 建立前重新用目前 world.position 解析 source encounter。Context 最終使用 canonical source snapshot；若 caller 指定的 encounter 不在目前位置，直接 fail-closed。groupId 也必須存在於 canonical encounter 的 groupIds。

新增 regression：tools/check_browser_battle_context_source_binding.mjs，覆蓋 stale encounter rejection、group mismatch rejection，以及 canonical encounter acceptance。

這一輪只收緊 source binding，不新增 encounter probability、enemy RNG、Battle、reward、EXP、Gold、Item 規則。
## 2026-10-01 V4.25 follow-up：Serialize Browser Controller dispatch

本輪在 battle context clear → Idle moving → 下一次 encounter 的回圈再做一次 concurrency audit，確認單靠各 runtime 的 expectedRevision 還不足以阻止同一個 Controller 內的兩個 async action 同時讀到相同的 currentState。

Browser State Controller 現在用單一 Promise tail 串行化 dispatch：後送的 action 必須等前一個 action resolve 或 reject 後才能開始，因此不會有兩個 mutating action 同時從同一個 revision N 建立各自的 revision N+1。

既有 runtime-level expectedRevision 仍保留；本輪是 Controller-level ordering hardening，不改 fixed-C movement、encounter、battle、reward、EXP、Gold、Item 或 RNG 規則。

新增 regression：tools/check_browser_state_controller_dispatch_serialization.mjs，驗證兩個同時送出的 encounter commit 不會雙重提交，同時驗證舊 expectedRevision 仍 fail-closed。





## 2026-10-01 V4.25 follow-up：Remove Battle Context Clear bypass

對 Clear gate 做第二次 bypass audit 時發現 controller 舊有 `IDLE_EVENTS.DISABLE → battleContext=null` 路徑可以繞過 Player Exit / Pet Exit。

本輪已移除該直接清除路徑，現在 Battle Context 只有初始化與兩個經過 `BATTLE_CONTEXT_CLEAR` gate 驗證的 clear path 可以設為 `null`。

新增 controller bypass regression，CI 同時檢查 source pattern，避免未來又把 idle disable 當成 battle cleanup。
## 2026-10-01 V4.25 follow-up：Block world-loop re-entry before Battle Context Clear

對 Clear 之後回 Idle 的銜接再做一次 bypass audit，發現 World Movement runtime 本身只驗證座標 / walkability / revision，不知道 transient Battle Context。

因此 Browser State Controller 現在要求所有 world / encounter / route / NPC / ItemShop 等玩家世界入口先通過 `BATTLE_CONTEXT_CLEAR` boundary；`ENCOUNTER_BATTLE_CONTEXT_BUILD` 也不能在既有 Battle Context 未清除時再次建立第二個 context。

已新增 world-loop Clear gate regression，固定檢查所有入口都掛在同一個 fail-closed gate 上。

這讓 battle 結束後的外層順序正式收斂成：

`Settlement Receipt → Player Exit → Pet Exit → Battle Context Clear → World / NPC / Movement re-entry`

本輪仍未新增任何 fixed-C reward、EXP、Gold、Item 或 RNG 規則。
## 2026-10-01 V4.25 follow-up：Explicit Battle Context Clear gate

Player Exit → Pet Exit 已經有 receipt / revision binding；本輪再把最後的 transient cleanup 明確拆成 `BATTLE_CONTEXT_CLEAR` gate。

- 新增 `stoneage_browser_battle_context_clear_runtime.mjs`。
- Clear 必須找到同一 settlement、同一 Player Exit transaction、同一 Pet Exit transaction。
- Player Exit `revisionAfter` 必須等於 Pet Exit `revisionBefore`。
- Pet Exit `revisionAfter` 必須等於目前 Persistent State revision。
- `BATTLE_EXIT_COMMIT` 成功後仍使用同一 gate 自動清除 Battle Context，保留既有呼叫相容性。
- Browser State Controller 同時公開 `BATTLE_CONTEXT_CLEAR`，可作為明確 lifecycle boundary。
- 新增 schema、reference、regression 與 V4.25 workflow coverage。

這一輪仍沒有新增 EXP、Gold、Item、RNG 或 death policy；只是把 `Player Exit → Pet Exit → Context Clear` 的最後一段做成 source-backed runtime lifecycle contract。
## 2026-10-01 V4.25 follow-up：Lock Player Exit → Pet Exit → Battle Context Clear order

V4.25 的 settlement receipt gate 已經證明「這場結算真的存在」；本輪再把 outer lifecycle 的執行順序也做成不可跳步的 runtime contract。

- `BATTLE_PLAYER_EXIT_COMMIT` 現在把 `settlementReceiptId / settlementStartRevision / settlementReceiptRevision` 寫入 Player Exit transaction，並要求 commit 當下 revision 必須正好等於 receipt revision。
- `BATTLE_EXIT_PLAN` 只能解析到同一 settlement、同一 player 的單一 Player Exit transaction，且該 transaction 的 `revisionAfter` 必須等於當前 Persistent State revision。
- `BATTLE_EXIT_COMMIT` 會再次驗證 Player Exit transaction id / revision；沒有先完成 Player Exit 就不能直接做 Pet Exit。
- Pet Exit transaction 同樣留下 settlement 與 Player Exit binding，供後續 trace / regression 使用。
- State Controller 仍只在 `BATTLE_EXIT_COMMIT` 真正成功後清除 transient Battle Context，因此現在順序被固定為：

Settlement Receipt → Player Exit → Pet Exit → Battle Context Clear → World / NPC / Movement re-entry
## 2026-10-01 新增：V4.25 Browser Battle Settlement Receipt-Bound Exit Gate

V4.24 已經把 live Battle Context 的 `IDLE_EVENTS.REWARD_APPLIED` 改成必須通過可驗證的 Settlement Receipt；本輪再把同一個證據邊界延伸到 final Player / Pet Exit，避免 `settlementComplete=true` 單獨成為呼叫端宣告。

本輪新增：

- Settlement Receipt validator 現在固定檢查 `finishMode=finish`、`receiptRevision` 與 `settlementStartRevision` 的 revision window。
- Receipt 內引用的 DuelPoint / LevelUp / Item transaction 必須各自有 `revisionAfter`，而且落在本場 settlement window 內。
- `resolveSettlementReceiptForBattle()` 只能得到唯一有效 receipt；0 筆或多筆都 fail-closed，不自行猜測。
- `BATTLE_PLAYER_EXIT_PLAN` 與 `BATTLE_EXIT_PLAN` 都必須綁定有效 receipt，並記錄 `settlementReceiptId / settlementStartRevision / settlementReceiptRevision`。
- Player / Pet Exit Commit 會再次驗證 receipt binding，防止 plan 在 commit 前被竄改或指向不同 settlement。
- V4.21 / V4.22 舊 regression fixtures 已同步改成 receipt-backed。
- 新增 V4.25 regression、schema、reference doc 與 GitHub Actions workflow；workflow 同時重跑 V4.24 settlement receipt regression。

因此 battle outer lifecycle 現在固定為：

`Finish Commit → reward transaction commits → Settlement Receipt Commit → REWARD_APPLIED → Player Exit Plan/Commit → Pet Exit Plan/Commit → clear Battle Context`

這一版不新增 EXP、Gold、Item、RNG 或 death policy，也不放寬 fixed-C 未閉合的特殊 battle branches；它只是把 settlement-to-exit 的信任邊界正式閉合。

固定 source 仍為 `gavinlinasd/StoneAge@1f90cb6cb57c1df70f39cde77a5a8ccd98b66c56`。




## 2026-10-01 V4.25 follow-up：Browser Battle Finish Hook Profile

V4.22 已完成 fixed-C `BATTLE_Finish()` 特殊 hook audit，V4.25 之後再把這份 audit 真正變成 Browser runtime gate。

`ENCOUNTER_BATTLE_CONTEXT_BUILD` 現在為 first-idle ordinary world encounter 建立固定 profile：

- `profile=ordinary-world-encounter`
- `winFuncInjected=false`
- `pkFuncInjected=false`
- `dantai=false`
- `linkedBattleCount=0`

`BATTLE_FINISH_COMMIT` 在切換到 finish mode 前必須驗證該 profile。缺 profile、NPC WinFunc、PVP PkFunc、DANTAI 或 linked `pNext` battle 都直接 fail-closed。

這個 boundary 只執行 fixed-C audit 已證明的「普通世界隨機遭遇」finish/reward/exit 路徑，不自行註冊特殊 hook，也不新增 EXP、Gold、Item、RNG 或 death policy。

新增：
- `data/generated/stoneage_browser_battle_finish_hook_profile_schema.json`
- `tools/check_browser_battle_finish_hook_profile.mjs`
- `docs/reference/browser-battle-finish-hook-profile.md`
- `.github/workflows/check-browser-battle-finish-hook-profile.yml`

V4.25 版本線不另加版本號；這是既有 battle lifecycle closure 的 source-enforcement follow-up。

固定 source 仍為 `gavinlinasd/StoneAge@1f90cb6cb57c1df70f39cde77a5a8ccd98b66c56`。

## 2026-10-01 新增：V3.77 Browser World WarpPoint execution

V3.77 將 fixed-C `mapwarp.txt` 的 first-route exact source warp rows 接入 canonical Browser State Controller，新增 `WORLD_WARPPOINT_EXECUTE`。

固定 C 的 `MAPPOINT_getMapWarpGoal()` 要求當前 from floor/x/y 與 source warp point 完全一致，再驗證 destination coordinate，最後由 `MAPPOINT_MapWarpHandle()` 呼叫 `CHAR_warpToSpecificPoint()`。Browser runtime 保持這個 boundary，只增加 canonical Save Envelope transaction。

V3.77 與 V3.75 的 NPC Warp 分離：NPC `npcgen_warp` 仍由 `NPC_WARP_EXECUTE` 處理；map warp point 則由本輪 `WORLD_WARPPOINT_EXECUTE` 處理。

目前 8 個 first-route portal groups / 31 個 source rows 全部保留；能否從玩家路徑走到 source point 仍由 V3.76 movement / reachability closure 決定，4000→200 不用 runtime 繞過。

## 2026-10-01 新增：V3.76 Browser World Movement Step

V3.76 將固定 C 的 `MAP_walkAbleFromPoint()` 與 `CHAR_walk()` movement gate 接入唯一 Browser State Controller，新增 `WORLD_MOVE_STEP`。

每次只移動同 floor 一格。目的格必須通過 source-backed walkability；斜向移動另外檢查起點沿 X / Y 的兩個 orthogonal side cells，完全對應固定 C 的 diagonal gate。

成功後只透過既有 `commitSave()` 寫入 `world.position`，再做 Save Envelope round-trip verification。Browser movement 不自行 pathfind、不抽 encounter RNG、不觸發 battle/reward，也不改跨 floor 語義。

V3.75 的 `NPC_WARP_EXECUTE` 繼續負責已 source-closed 的跨 floor Warp；V3.72 證明的 4000→200 disconnected route exception 不由 movement runtime 繞過。

## 2026-10-01 新增：V3.75 Browser start-floor Warp execution

V3.75 把已 source-closed 的 8 個起點 npcgen_warp instances 接入唯一 Browser State Controller，新增 NPC_WARP_EXECUTE。

固定 source chain 為 npcgen.template 的 npcgen_warp → Warp，以及 npc_warp.c 的 NPC_WarpWatch / NPC_WarpWarpCharacter：玩家必須已走到 Warp NPC 的 exact source cell，Browser adapter 才接受標準 floor|x|y destination，並只透過既有 commitSave 寫入 world.position。

四個起點共有 8 個 production Warp rows：1006→1000、2006→2000、3006→3000、4006→4000。catalog 只接受標準 npcgen_warp|floor|x|y；FREEMORE / conditional multi-destination Warp 維持 fail-closed。

V3.75 不新增 talk/facing 規則、不改 economy / quest / battle / encounter 語義，也不建立 playable HTML；Save Envelope verification 與 expectedRevision regression 同時加入。

## 2026-10-01 新增：V3.74 Browser NPC Event execution

V3.74 將 V3.64 已 source-resolved 的 changeevent → ExChangeMan 正式掛進唯一 Browser State Controller，新增明確 NPC_EVENT_EXECUTE action。

成功鏈：World NPC point → source changeevent module → interaction gate → existing event branch / action plan → existing Item / Pet / EventFlag handlers → Save Envelope。相同 transactionId replay 仍由既有 event transaction 保證 idempotent。

V3.74 不新增 quest parser、不猜 mission order、不改 Charm source rule，也不建立 playable HTML。
## 2026-10-01 新增：V3.73 Persistent State structural container validation

V3.73 將 Persistent State v1 的結構驗證補齊：sourceProfile / revision、player.stats、inventory piles / itemRuntime、equipment、quests、events、titles、world.position、idle.offline 與 battleSettings / runtimeMeta 現在都有 canonical object / scalar shape gate。

所有 equipment / quest / event / title / battleSettings 內部內容仍保持 opaque；本輪只驗證 container contract 並加入完整 Save Envelope round-trip regression，不把未閉合資料解讀成新的遊戲規則。

這讓 `player / pet / inventory / equipment / skills / quests / map position / idle settings / save` 可以在同一 canonical validation boundary 下進一步接 runtime，且 malformed container 會 fail-closed。
## 2026-10-01 新增：V3.72 4000→200 fixed-C source transition audit

V3.72 對已知 4000→200 blocker 做第二層 source closure：固定 source `mapwarp.txt` 有 4 筆 direct 4000→200 rows；`gmsv/data/npc/**/*.create` 也找到既有 `200warp.create` 的 4 個 `floorid=4000 → npcgen_warp|200|...` rows，兩份 source 逐一對應，正好代表兩組雙格出口。

另外對 pinned `gmsv/src` 做 4000 / 200 + warp/floor/transfer context 掃描與 literal 200 warp call corroboration。這些搜尋只作輔助證據，不把文字匹配冒充成完整程式語義證明。

因此目前沒有新的 fixed-source transition 可以解除 blocker。V3.62 movement-parity exception 維持；不新增 synthetic warp、manual teleport 或跨版本資料。
## 2026-10-01 新增：V3.71 Production ItemShop Browser UI penetration

V3.71 將 V3.70 的 ItemShop UI state 從 synthetic fixture regression 推進到 pinned fixed-C production catalog penetration。GitHub Actions 重新 checkout `gavinlinasd/StoneAge@1f90cb6cb57c1df70f39cde77a5a8ccd98b66c56`，生成 World NPC index + ItemShop catalog，再以 `path#blockIndex` join 找到正式 World ItemShop。

Regression 會從 335 個 resolved production shops 中找到可購買 offer，以正式 Born 座標進入 `NPC_RESOLVE_AT` / `ITEMSHOP_UI_OPEN` 路徑，驗證選取、數量與一次 BUY。UI session 不增加 Persistent State revision；BUY 仍沿既有 Item allocator / Economy transaction。

唯一已知 ItemShop source anomaly `gmsv/data/npc/my/magicdou/daochang.create#8` 仍維持 unresolved，不補猜測資料。V3.71 仍不建立 playable HTML，也不新增 ItemShop / Gold / Inventory 規則。
## 2026-09-30 新增：V3.70 Browser ItemShop UI state

V3.70 將 ItemShop 的開店／商品選擇／數量輸入／結果提示做成 Browser State Controller 內的 ephemeral UI state。這一層不寫 Persistent State，不計價，不建立第二套 ItemShop transaction。

UI session 最後沿既有 `NPC_ITEMSHOP_BUY` / `NPC_ITEMSHOP_SELL` 交易；只有真正交易成功才改 canonical Persistent State。`ITEMSHOP_UI_OPEN / SELECT_OFFER / SET_QUANTITY / CLOSE` 本身不增加 revision。

因此目前 ItemShop 主線變成：`NPC → ItemShop source catalog → Item template / allocator → UI session selection → Economy transaction → Gold / Inventory → Persistent State`。

仍保留 source-backed、fail-closed 邊界；不存在的 offer、未 resolved offer、無效數量直接拒絕，UI 不自行補價錢或 Item template。
## 2026-09-30 新增：V3.69 Offline reward completion adapter

V3.69 補齊 V3.68 offline checkpoint 的 Phase 3 execution boundary。新增 stoneage-offline-reward-batch-v1：只接受外部已完成的 source-backed Battle / Reward Transaction packets，不自行計算 encounter RNG、battle result、battle 場次、EXP / Gold / Item 規則。

每個 packet 沿既有 stoneage-reward-transaction-v1 驗證與套用；整個 batch 再由外層 Save Envelope 做一次 revision-guarded commit。成功後依既有 SAVE_COMMITTED transition 將 offline_resume 恢復為 moving，並以 resumePending=false、rewardsApplied=true 結束 checkpoint。

中途任一 reward packet、route binding、accrual window 或 revision 驗證失敗，都 fail-closed，原始 Persistent State 不改。這一版仍不是自動離線戰鬥／收益引擎，只是把真正的 offline simulation output 接入 canonical transaction boundary。
## 2026-09-30 新增：V3.68 Browser Idle lifecycle / offline checkpoint

V3.68 新增 `IDLE_STATUS` 與 `IDLE_OFFLINE_RESUME` 到 canonical Browser State Controller。前者唯讀；後者沿既有 `prepareOfflineResume()` → `commitOfflineResume()` → Save Envelope verify，把 offline checkpoint 寫進 Persistent State。

目前只保存合法 elapsed/accrued window metadata，`rewardsSimulated=false`、`rewardsApplied=false`、`resumePending=true`；不自行生成 offline EXP / Gold / Item，也不猜戰鬥結果。

Regression 鎖定 invalid time window、checkpoint revision、save round-trip 與 stale expectedRevision fail-closed。

## 2026-09-30 新增：V3.67 Browser Idle first-encounter simulation bridge

V3.67 將既有 `stoneage_idle_simulation.mjs` 接入 Browser Idle runtime，新增 `IDLE_SIMULATE_FIRST_ENCOUNTER`。route variant 先通過 first-idle-route-catalog eligibility，Battle result 必須由 caller 注入；Browser runtime 不抽 encounter RNG、不計算戰鬥結果。

成功路徑沿既有 `simulateFirstEncounter()`：Battle Result Adapter → Player HP/MP snapshot → Reward Transaction → Supply/Death policy → Save Envelope。Browser Controller 不複製 battle/reward/save engine。

Regression 鎖定缺 Battle result、4000→200 source-blocked route、stale revision、victory reward 落地與 defeat/manual-recovery 行為。

## 2026-09-30 新增：V3.66 Browser Idle route bridge

V3.66 把 first idle route catalog 接入唯一 Browser State Controller。新增 browser idle runtime，提供只讀 route list、route-qualified ENABLE，以及有限 Idle state-machine event bridge。6/8 source-backed eligible variants 可被啟用；4000→200 兩組 source-blocked variants 仍拒絕。

每個成功 browser idle event 都使用 V3.65 commitIdleEvent → Save Envelope → reload validation。Browser bridge 不自己移動世界、不抽 encounter RNG、不重算 battle、不直接套 reward，不決定補給／死亡／offline policy。

V3.66 regression 同時鎖定 invalid offline event、4000 source-blocked route、stale expectedRevision 與 reward event 不修改 player reward state。

## 2026-09-30 新增：V3.65 Idle Loop → Persistent State binding

V3.65 將既有 Idle Loop state machine 正式綁到 canonical Persistent State。新增 `stoneage_idle_persistent_state_runtime.mjs`：每個合法 Idle event 都先驗證 Persistent State，再以既有 `transitionIdle()` 取得 transition，最後同步 `state.idle.enabled/mode/routeId/lastSimulatedAt/offline`。pending encounter/battle/reward 保留為 ephemeral runtime payload，不偷偷擴充持久 schema。

新增 `commitIdleEvent()`，使用既有 `commitSave()` → Save Envelope → `parseAndValidateSaveEnvelope()`，revision 只在真正 commit 時增加一次；expectedRevision 不符直接 fail-closed。這讓 Idle Loop 與 NPC / Item / SavePoint 同樣遵守 canonical state transaction boundary。

V3.65 不定義新的戰鬥結果、不計算 encounter probability、不指定 offline reward、補給、捕捉或背包滿規則；那些仍是 product-policy / battle-runtime slots。

## 2026-09-30 新增：V3.64 ChangeEvent source resolution

pinned fixed-C 的 jaruga/event/event.template 實際綁定 changeevent → ExChangeMan。V3.64 將這條 source-backed binding 接入 strict module registry、dispatcher、reachability 與 Browser State Controller；五個 start-floor changeevent instances 恢復為 source-resolved active interactions。

## 2026-09-30 新增：V3.63 ChangeEvent three-layer source closure

V3.63 修正並升級舊 V3.29 changeevent audit 的證據模型。真正的 fixed-C registration chain 是 NPCCREATE enemy= → NPC_templateGetTemplateIndex() → recursively loaded NPC template registry，而不是單看 npctemplate.c/functionSet[]。固定 source 的 NPC_readNPCTemplateFiles() 會遞迴掃描 template files；lookup 只有 exact registered template name 才成功，unknown name 回 -1。NPC_readCreateFile() 對 unknown enemy 不寫入 cr.templateindex[]，enemyreadindex 維持 0，block close 亦拒絕該 create block。

V3.63 pinned-source scan 再確認 gmsv/data/npc/**/*.template 沒有 templatename=changeevent，也沒有 functionset=changeevent。因此目前 5 個 start-floor enemy=changeevent|... instance（4 個 xinshou + 1 個薩姆吉爾的村長）應分類為 source-proven non-instantiable in pinned build，而不是可互動但尚未接 handler。

外部資料確實可見 changeevent 的任務型 DSL，也有 compatibility source 將 templateName=changeevent 對到 functionset=ExChangeMan；但那不是 pinned C evidence。嚴格 fixed-C runtime 仍 fail-closed；只有 compatibility mode 顯式提供 alias catalog 時才可執行。

V3.63 不新增假的 changeevent template、不把 ExChangeMan 提升成 strict alias、不改 5 個 source create block。下一階段正式把這 5 個 instance 從「待找 source module」視為「pinned build 已證明不能實例化」，把工程量轉回 Persistent State / Idle Loop / 可玩入口 closure。

## 2026-09-30 新增：V3.62 4000→200 source movement parity audit

V3.62 沿 pinned fixed-C `char_walk.c` / `map_deal.c` 重新核對 4000→200 blocker。固定 C 的斜向移動在 `CHAR_walk()` 不允許單純 corner-cutting：目的格必須 `MAP_walkAble()`，且起點往 X / Y 正交方向的兩個 side cells 也必須通過 `MAP_walkAble()`。因此以 4-neighbor walkable connected components 做 blocker proof 不會漏掉合法斜向穿越。

V3.62 regression 直接 checkout pinned source，鎖定 `MAP_walkAbleFromPoint()` 的 tile/object walkability contract、`CHAR_walk()` 的 diagonal side-cell gate，並將 4000 runtime 的 actual walkable cells 做 4-neighbor components + C-legal diagonal bridge exhaustive audit。現有 direct landing component 與兩組 4000→200 portal-origin component 仍不相同，且沒有任何合法 diagonal bridge 能跨 component。

因此 4000→200 目前可由 source movement semantics 證明為 route exception：不是現有 BFS 選錯鄰接規則，也不是 portal origin 本身不可走。若未來要解除 blocker，必須找到 fixed-source 版本／資料中的正式 transition evidence；不能用 synthetic bridge、manual teleport 或放寬 diagonal corner rule。

本輪不改 4000 map binary、不修改 mapset walkability、不改 mapwarp 座標，也不建立 playable HTML；只把既有 blocker 從「component blocker」提升為「source movement-parity verified exception」。

## 2026-09-30 新增：V3.61 Browser SavePoint pile lifecycle parity

V3.61 修正 V3.59 SavePoint GetItem mutation 與 pinned fixed-C _ITEM_PILENUMS 的堆疊生命週期差異。固定 source version.h 明確啟用 _ITEM_PILENUMS；CHAR_DelItem(talker,i) 實際以 num=1 呼叫 _CHAR_DelItem()，先把 ITEM_USEPILENUMS 減 1，只有 pile <= 0 才清除 player item slot 與 item object。

Browser SavePoint transaction 現在做兩段式 preflight：所有選定 item object 必須存在且 pile >= 1 才開始 mutation；每個 object 只扣 1 pile unit。pile > 1 時保留同一 item object 與 slot reference；pile = 1 才清除 object。inventory.piles mirror 也只減 1。任一 preflight failure 都不會部分消耗 state。

V3.59 regression 更新為新的 source-parity expected lifecycle，另新增 V3.61 regression / reference / CI。沒有新增第二套 inventory engine，也不改 SavePoint OR/AND branch、World join、changeevent、Starter Item 24114 或 GMQUE 永久停用政策。

## 2026-09-30 新增：V3.60 Browser SavePoint World source join

V3.60 將 28 個 pinned fixed-C SavePoint instances 與 `stoneage_world_npc_index-v1` 做正式 `path#blockIndex` join。CI 同時重建 World catalog / SavePoint catalog，驗證 28/28 binding、26 個 unique floors、template / arg fileRef / elder Born identity，並回歸 V3.59 GetItem transaction contract。

`genout/sp_200_449_982` 的原始 malformed token `1991*` 不修補；catalog 保留 zero-count branch anomaly，該 branch 在固定 C 語意下不可成立，runtime 只跳過它而不修改 source data。

本輪沒有新增平行 SavePoint engine，也不建立新的 playable HTML 入口。

## 2026-09-30 新增：V3.59 Browser SavePoint GetItem transaction closure

V3.59 將固定 C SavePoint 的 GetItem 路徑從 V3.58 的 fail-closed 推進到 source-backed inventory transaction。npc_savepoint.c 明確以逗號做 OR、& 做 AND；itemNo*count 的 count 是符合 ITEM_ID 的 inventory objects 數量，因 NPC_SavePointItemCheck / NPC_SavePointItemDelete 都逐 item slot 掃描並以 CHAR_DelItem 刪除，所以不能拿 canonical pile 代替 source object count。

新增 GetItem source parser，正式 SavePoint catalog 現在包含 itemRequirements；空欄位、非法 token、同一 AND branch 重複 item ID 都 fail-closed。Browser runtime 新增 requirement selector / atomic item consume：NPC_SAVEPOINT_SET 在條件成立時只進確認；NPC_SAVEPOINT_CONFIRM 重新檢查、刪除選定 item objects，再一次性寫入 save point；已解鎖 elder 重訪維持免道具。

新增 V3.59 regression、reference doc 與 GitHub Actions；CI 同時回跑 V3.58 compatibility regression，避免 SavePoint confirm-only 路徑被新 transaction 改壞。

本輪仍不建立 playable HTML，也不改動 4000→200、3000→200 單點 landing、changeevent、Starter Item 24114 或 GMQUE 永久停用政策。

V3.59 另確認 `genout/sp_200_449_982` 的一個 malformed `GetItem` token `1991*`；固定 C 會把空 count 轉為 0，使該 branch 不成立。catalog 保留 anomaly evidence 並只跳過不可成立 branch，不做資料修補。

## 2026-09-30 新增：V3.58 Browser SavePoint service execution

V3.58 將 pinned fixed-C `SavePoint` 從 generic service routing 推進到 headless state mutation。固定 source `gmsv/src/npc/npc_savepoint.c` 明確使用 `RANGE 2`、`CHAR_SAVEPOINT` bit 與 `CHAR_LASTTALKELDER`；`NPC_SavePointInit()` 另以 NPC arg 的 `Born` 建立 elder 的實際 save/復活位置。

新增 `src/stoneage_browser_savepoint_runtime.mjs`、`tools/generate_savepoint_source_catalog.mjs`、fixture、regression 與 CI。Source catalog 以 `path#blockIndex` join create block 與 arg file，固定 source 目前閉合出 28 個 SavePoint instances：27 個 `GetItem`、1 個無 `GetItem` 的確認型 SavePoint；沒有正式 `NOITEM` instance。確認型路徑可寫入 `world.savePoint`，`GetItem` path 暫時維持 fail-closed，避免在 inventory stack/delete semantics 尚未完整閉合時猜測。

Canonical Browser State Controller 現在可由 `targetCell + serviceFunctionSet=SavePoint` 導流到 SavePoint runtime。設定 save point 不立即修改 `world.position`，也不做 teleport；它只更新持久化 save/復活目標與 normalized elder unlock state。

本輪沒有改動 Healer、ItemShop、changeevent、Starter Item 24114、4000→200、3000→200 單點 landing 或 GMQUE 永久停用政策。

## 2026-09-30 新增：V3.57 Browser Healer service execution

V3.57 將 pinned fixed-C `Healer` 從 generic service routing 推進到第一個具體 browser service execution。固定 source `gmsv/src/npc/npc_healer.c` 明確使用 `NPC_Util_CharDistance` 距離 2，且 `NPC_HealerAllHeal()` 將角色 HP/MP 補滿並處理角色持有寵物的 HP/MP。

新增 `src/stoneage_browser_healer_runtime.mjs` 與 `NPC_HEALER_USE`。Runtime 先驗證 audited `Healer` functionSet 與固定 repository/ref，再過距離 gate，最後寫入 Persistent State；寵物採 canonical `pets.petBox`，缺少 max HP/MP 就 fail-closed，避免 partial recovery。

Canonical Browser State Controller 現在可由 `targetCell + serviceFunctionSet=Healer` 自動解析 World NPC 後執行恢復。加入 fixture、regression、CI 與 V3.57 reference doc。

本輪仍不宣稱 fixed-C party-wide healer parity，也沒有建立 playable HTML；changeevent、Starter Item 24114、4000→200、3000→200 單點 landing 與 GMQUE 政策均不變。

## 2026-09-30 新增：V3.50 new-player creation → save pipeline

V3.50 把目前已 source-closed 的新玩家流程串成單一 headless pipeline：`creation input → hometown world.position → Starter Pet → starter-item adapter boundary → creation.completed → Save Envelope → reload verification`。

`applyPlayerCreationInput()` 現在會將 fixed-C hometown 的 floor/x/y 正式寫進 `state.world.position`；Starter Pet 使用 V3.48 的 rank-closed runtime 寫入 `pets.petBox`；Save 使用既有 `commitSave()` / `parseAndValidateSaveEnvelope()`。

`creation.completed=true` 只有在 starter-item adapter 成功後才設定。因 Item 24114 的 template 仍未閉合，production path 目前會在 `starter-item-template-unresolved` fail-closed，返回可檢查但未完成的 headless state，不產生 completed save。 這個 pending checkpoint 可以直接 resume 到 Item stage；resume 不重新抽 Starter Pet RNG，也不重新建立第二隻 Starter Pet。

這個 pipeline 的 staged commit 是產品/runtime transaction boundary，不宣稱 fixed-C `CHAR_createNewChar()` 本身是 atomic transaction。測試中的 Item adapter 是 test-only synthetic fixture，只驗證未來取得正式 Item adapter 後，creation → save → reload contract 能完整工作，不升格為正式 Item data。

## 2026-09-30 新增：V3.56 Browser World NPC service routing

V3.56 在 V3.55 的固定 NPC point resolver 上增加 source functionSet routing。Browser-resolved NPC instance 現在保留 selected `functionSet` 與 source service candidate 清單，並可用 `serviceFunctionSet` / `functionSet` 指定要解析的固定 C service；不符合就 fail-closed，不自動改選其他服務。

這一層仍是 routing contract，不宣稱 55 個 active fixed-C functionSet 都已有 browser module。真正的 service execution 仍需逐項完成 source functionSet → audited module → handler → state transaction。

V3.56 沒有改動 ItemShop pricing、Gold、Persistent State、Starter Item 24114、changeevent、4000→200 或 GMQUE 永久停用政策，也沒有建立 playable HTML。
## 2026-09-30 新增：V3.55 Browser World NPC point runtime

V3.55 新增 `stoneage_browser_world_npc_runtime.mjs`，將 fixed-C World NPC create blocks 的固定點位轉成 browser 可解析的 source NPC instance。位置只接受 `borncorner` 中 `x1=x2,y1=y2` 的 exact point；非退化 spawn area 不猜即時座標。

canonical Browser State Controller 新增 `NPC_RESOLVE_AT`，並讓 `NPC_TALK` / `NPC_ITEMSHOP_*` 在沒有直接提供 NPC object 時，可從 `targetCell` 解析 source NPC。解析完成後，ItemShop 繼續沿 V3.54 的 `path + blockIndex` binding 取得正式 shop，interaction gate 仍照原 contract 執行。

V3.55 仍是 headless runtime；沒有建立 playable HTML，也沒有修改 Starter Item 24114、changeevent、4000→200 或永久停用 GMQUE 的既有判定。
## 2026-09-30 新增：V3.54 browser ItemShop → World NPC binding closure

V3.54 將既有的 browser ItemShop transaction 與 V3.42 的 336-instance World NPC + ItemShop source join 正式接到 canonical browser state controller。

新增 `stoneage_browser_world_itemshop_runtime.mjs`，以 World NPC 的 `path + blockIndex` 作為唯一 source key；World NPC index 與 ItemShop catalog 必須使用相同 pinned repository/ref。Controller 可由 NPC instance 自動解析正式 `shopId`，caller 不需要再猜測 shop binding。

production checkpoint 維持 336 個 World ItemShop bindings、335 個 resolved catalog shops、1 個 unresolved source anomaly（`my/magicdou/daochang.create#8`）。未能 join 的 instance 直接回傳 unresolved，完全不修改 Gold、inventory 或 Persistent State。若 caller 額外提供 `shopId`，必須與 source-resolved binding 完全一致。

因此目前主線可明確寫成：

`NPC instance → World ItemShop binding → interaction gate → ItemShop → Item source template → allocator → Gold → Persistent State`

本輪只完成 headless runtime / regression / CI；仍不建立 playable HTML，也不改動 Starter Item 24114 的 fail-closed 判定。

## 2026-09-30 新增：V3.53 Starter Item 24114 build closure audit

V3.53 將 Item 24114 最後的 build-path 疑點正式機器化。固定 `itemset6.txt` 共 10,737 個 non-blank rows，最大 source Item ID = 23009；非 `_IMPOROVE_ITEMTABLE` loader 依 `ITEM_tblen=maxid+1` 建表，因此 `ITEM_tblen=23010`。

pinned `gmsv/src/Makefile` 與 `gmsv/src/item/makefile` 都只定義 `CFLAGS=-w -O3 $(INCFLAGS)`，沒有 repository-defined `-D_IMPOROVE_ITEMTABLE`；`version.h` 的 `_IMPOROVE_ITEMTABLE` 也是註解狀態。

因此 configured `ITEM1=24114` 在 fixed-C lookup 時首先就超過 `ITEM_tbl` boundary；即使忽略 boundary，pinned data 中 24114 仍只是 `imagenumber`，source Item ID 是 11817。V3.53 regression 同時鎖定 source blob SHA、build flags、table boundary、唯一資料列與 generated catalog。

目前 Starter Item 24114 正式維持 fail-closed，不建立 synthetic remap。V3.50 creation → Save pending/resume contract 保持不變。

## 2026-09-30 新增：V3.52 Starter Item 24114 exhaustive execution audit

V3.52 在 V3.51 的 source-ID mapping audit 上再往下閉合一層：固定 `itemset6.txt` 是唯一正式 Item runtime input；`.bak` 不參與 `init.c` 的 `ITEM_readItemConfFile(getItemfile())`；`chatmagic.c` reload 也使用相同 loader。

repo 內的 `stoneage_item_make_runtime.json` 使用同一 pinned Item blob SHA，10,737 個 templates 中 `byItemId[11817]` 正確保留 `imagenumber=24114`，而 `byItemId[24114]` 不存在。這一層正式鎖定「generated catalog 沒有把 imageNumber 當成 Item ID」。

因此 fixed-C 的 `CHAR_loginAddItemForNew()` → `ITEM_makeItemAndRegist(24114)` → `ITEM_makeItem()` → `ITEM_CHECKITEMTABLE(24114)` 仍沒有合法的 source-ID mapping。V3.52 regression 與 GitHub Actions 會同時驗證 source data、loader call site、generated catalog 與 final resolution。

結論維持 fail-closed：不把 11817 改成 24114，不用其他版本／port／外部資料補 template，不建立 playable HTML。

## 2026-09-30 新增：V3.51 Starter Item 24114 source mapping audit

V3.51 修正 V3.49 的錯誤資料判讀：固定 pinned commit 的 `gmsv/data/itemset6.txt` 並非 0 bytes，而是 2,777,181 bytes、10,744 行。

更重要的是，`ITEM1=24114` 不是該檔案第 17 欄 `id`。固定 build 啟用 `_ITEMSET2_ITEM`，`ITEM_readItemConfFile()` 使用第 17 個 token 作為 `ITEM_ID`；而 pinned `version.h` 沒有定義 `_IMPOROVE_ITEMTABLE`，所以不存在 `ITEM_TransformList` 的 ID remap。

在 `itemset6.txt` 第 3602 行，24114 的唯一數值 occurrence 位於第 18 欄：`id=11817`、`imagenumber=24114`、`cost=9900`、`type=16`。因此 source Item table key 是 11817，不是 24114。

固定 C 的 `CHAR_loginAddItemForNew()` 直接把 `ITEM1=24114` 傳入 `ITEM_makeItemAndRegist(24114)`，而 `ITEM_makeItem()` 先檢查 `ITEM_CHECKITEMTABLE(24114)`。在目前 pinned build 下不能把 imageNumber 24114 自行重映射成 Item ID 24114，否則會改變 fixed-C semantics。

所以目前正確狀態是：Item source file ✅、24114 對應資料 row ✅、allocator implementation ✅，但 configured source Item ID 24114 的執行閉合仍 ❌，因此 starter-item grant 維持 fail-closed。V3.50 的 creation → save pending/resume boundary 不變。

## 2026-09-30 新增：V3.48 fixed-C Starter Pet rank closure

V3.48 已把 pinned C 的 `gmsv/src/char/enemy.c::ENEMY_getRank` 正式接回 starter Pet runtime。

來源函式只把 `E_T_BASEVITAL + E_T_BASESTR + E_T_BASETGH + E_T_BASEDEX` 相加成 `paramsum`，再依 100 / 95 / 90 / 85 / 80 / 0 的 fixed rank table 回傳 0..5。四個 starter EnemyBase 都是 paramsum 79，因此四個 hometown starter Pet 都是 `petRank=5`。

Runtime 現在會重新計算 rank、與 generated seed 的 source rank evidence 做一致性檢查，並把 `sourceRankResolved=true` / `petRank` / `sourceRankEvidence` 保存進 Pet object。rank 計算本身不消耗 RNG，所以原本 16-call starter Pet sequence 不變。

同時校正 `tools/generate_new_player_seed_runtime.mjs` 的生成結果，移除不在 committed artifact 中的 stale `sha256` 欄位，並讓 V3.45 的 seed `cmp` regression 可以與現行 generated JSON 對齊。

## 2026-09-30 新增：V3.47 starter Pet grant runtime

V3.47 將 V3.45 source-closed starter Pet 接到 canonical Persistent State：沿 fixed-C `ENEMY_createPetFromEnemyIndex` 保留 16 次 RNG、四圍/元素/metadata、PetMailEffect、VariableAI=0 與 compliance HP=MaxHP，並鎖定 duplicate-grant、petBox cap、Save round-trip。Starter Item 24114 仍因 item template 尚未閉合而保持 pending；不新增 playable HTML。

## 2026-09-30 新增：V3.46 player creation runtime

V3.46 把 fixed-C 創角輸入正式接進 canonical Persistent State：四圍 0..20 / 總和≤20、元素總和10 / 最多兩屬性 / Earth+Fire 與 Water+Wind 禁配，並保存 hometown、creationPlayerStats、elements 與 starter grant 狀態。加入 `src/stoneage_player_creation_runtime.mjs` 與 regression；仍不新增 playable HTML。

## 2026-09-30 新增：V3.45 new-player seed runtime

V3.45 將 fixed-C setup.cf 出生 seed 正式獨立：TRANS=1、LV=1、PETLV=1、GOLD=30000、ITEM1=24114；並把 PET1 → config slot 1 而 getter(0) 讀 slot 0 的 parser quirk 明確寫入 contract。四個 hometown fallback starter pet 由 pinned enemy1.txt + enemybase1.txt 閉合為 EnemyID 1/2/3/4、TempNo 2/112/102/34。24114 只完成 source item-ID / creation-path closure，不猜 item template。新增 seed generator、V3.45 regression 與 pinned-source rebuild CI；仍保持 0 個 playable HTML。

## 2026-09-30 新增：V3.43 cross-contract closure

本輪把 first-route closure 的跨 contract 狀態重新對齊：new-player 四段 Item/Pet reward definition 已由 pinned itemset6／enemy1 source closure 驗證完成，因此不再列為 route blocker；changeevent 本身仍維持 strict unresolved，不能因 reward closure 而自動註冊 alias。4000→200 仍依 fixed-C map walkability 保持 disconnected fail-closed。新增 `tools/check_v343_cross_contract_closure.mjs` 與 CI，鎖定 reward closure、4000 component 與 route blocker 不漂移。

## 2026-09-30 新增：V3.44 Persistent State ↔ Save Envelope join


V3.44 不新增 playable HTML，先把 canonical Persistent State v1 與 Save Envelope v1 做完整 headless join。新增 `tools/check_v344_persistent_state_save_join.mjs` 與對應 CI，鎖定 26 個 profession skill slots、24 個 player item slots、backpack existing-item references、pet team / activePetId integrity、world / quest / event / idle state round-trip、legacy schema 30 unknown-key preservation，以及 Save Envelope revision guard。此輪只強化資料保存邊界，不把 idle battle policy 或 changeevent compatibility alias 升格成 fixed-C。

## 2026-09-30 進度

已完成第一版 **World Data Source Catalog**：固定 source `gavinlinasd/StoneAge@1f90cb6cb57c1df70f39cde77a5a8ccd98b66c56` 的 5,764 個 blob files、3,960 個 NPC data files，以及主要世界資料檔案已建立 machine-readable inventory。NPC 的 template → create → floor/region → argument 關係也已用 pinned C 的載入／生成流程固定。

本輪沒有建立 playable HTML，也沒有把未閉合 NPC／任務資料硬塞成 gameplay。

另外完成 World NPC Index、NPC Service Index、World Graph 與 NPC Event Action Index：7,979 create blocks 已全部閉合到 template；27 個 file/arg 參照維持 unresolved；5,457 筆 mapwarp 全部通過 source map header 的 floor/座標範圍驗證；world graph 已形成 1,139 個 floor nodes、2,182 條 directed floor edges；NPC service bindings 共 9,335；NPC event DSL 掃描找到 4,860 次 source action-key matches。另已整理 mission、jobdaily、ride、title、question、raceman、racequiz、member shop/pet 等 auxiliary world data。

目前正處於 **item-acquisition / quest-event closure**；reward gap 已改為 direct-source occurrence 掃描，避免用 sample path 估算；NPC acquisition graph 已建立並校正 EventNo -1 sentinel；Start Flow Index 也已完成，正式鎖定四個 hometown 出生座標與新手寵物選擇規則。Item loader 已依 fixed C 對齊到 `itemset6.txt` 第 17 欄 `ITEM_ID`；NPC event 共引用 2,301 個不同 item ID，其中 2,065 已閉合、236 unresolved，未閉合引用共 751 次。事件旗標正在進一步依 `EventNo` / `EventEnd` / NPC-specific script / encounter event owner 反查，不再只用 mission / jobdaily 判定。

### First-route checkpoint（2026-09-30）

已修正 hometown walkability audit 的 source-selection 問題。舊版 audit 沒有鎖定四個 hometown map 的 exact pinned source path，而是遞迴掃描 map floor 後取第一個命中；這不足以作為 fixed-source walkability 的最終結論。

新版 `stoneage_start_walkability_audit.json` 已鎖定四個固定 source map path，並在審計時驗證 Git blob SHA。結果為：

- 4/4 hometown source maps 通過 exact blob SHA 驗證。
- 8/8 direct hometown warp exits 可由出生座標透過 source walkability 到達。
- 最短出生點→warp NPC 路徑為 4–7 步。
- 固定 C 的 `CHAR_walk_move` 先做 `MAP_walkAble`，NPC warp 再透過 `CHAR_ISOVERED` 與 `NPC_WarpWatch` 接收成功的 `CHAR_ACTWALK`；因此 warp NPC 的占位不會讓原本可走的 map cell 變成不可走。

目前新增 `stoneage_start_route_closure.json`，將四個 hometown 的 source-route spine 接到 start-floor service presence、NPC coordinate/reachability 與 depth-1 encounter evidence；另外新增 `stoneage_start_npc_reachability.json` 與 `stoneage_start_npc_coordinate_closure.json`，把全部 46 個 start-floor NPC 的 exact source coordinates 與 interaction status 分開保存。四個 hometown 都已具備 source-route spine 條件；目前 46 個 start-floor NPC 已有 numeric coordinate；41 個 active-template NPC 已完成 interaction reachability，0 個 unreachable；5 個 `changeevent` instances 因 pinned `npctemplate.c` 缺少 module 而維持 runtime-unresolved，因此目前標記：

- `sourceRouteSpine = closed`
- `fullFirstRoute = partial`

這裡的 closed 只代表 source-level route spine 已閉合，不代表已經可以直接做 playable gameplay。完整 first-route 還要處理 5 個 `changeevent` runtime-module discrepancy、destination map / first encounter region 的 walkability，以及新玩家 reward definition closure。

下一步不直接做 playable UI，而是把 unresolved item / event 依 NPC path、事件 owner 與起始 floor 分群；目前 236 個 item IDs 與 ownerless event IDs 仍需 closure。最高優先仍是四個出生村的 first-route closure，但 start-floor coordinate 本身已不再是 blocker。

## 新增最終目標：現代 3D 卡通手遊化

最終產品目標正式加入現代 3D 卡通化方向。這不是把舊版網頁 UI 換成 3D 圖片，而是把整個 presentation layer 升級：3D 卡通世界、角色／寵物模型、斜俯視鏡頭、現代 RPG HUD、集中式回合戰鬥、技能演出、AUTO／掛機、村莊與 NPC 互動。依目前授權前提，授權範圍內的石器時代手游原始 UI／模型／貼圖／icon／字體／動畫等資產可以直接納入正式版本，以高還原為實作目標。

《石器時代：覺醒》的官方商店資訊包含回合制策略、上百寵物、職業、野外捕捉與離線掛機；《石器時代：放置冒險》則以放置玩法與寵物成長為產品核心。現代產品的參考程度，以及能否直接採用其特定 UI／美術資產，改由實際授權範圍決定；不在授權範圍的外部素材仍只作研究參考。

正式規格：`docs/reference/modern-3d-mobile-visual-ui-target.md`。

## 目的

本文件不是可玩前端規格，而是「在重新建立唯一遊戲入口以前，先把資料、來源證據與核心系統補齊」的工作順序。

最終目標仍是重建「阿肥石器時代放置版」：行為以 pinned fixed C 為最高優先來源，視覺與操作流程以 `docs/reference/video-001-visual-reference.md` 為重要基準，最後形成一個完整、可長時間遊玩的石器時代風格放置遊戲。

目前刻意不新增任何可玩的 HTML。

## 目前已經很完整的部分

### 1. 戰鬥規則研究

V1.x～V2.x 已累積大量 fixed-C parity 與 regression，涵蓋玩家／寵物技能、BattleModel、DamageReact、Counter、Guardian、Acupuncture、Capture、裝備回調、職業技能與多個 RNG／執行順序細節。

這些結果目前主要存在於 `docs/changelog/`、`tools/check_v*.mjs` 與 generated runtime 中。

### 2. 寵物與遇敵資料

目前已有：

- Lv1 寵物資料
- Enemy AI runtime
- 一般 Encounter runtime
- Group / Enemy / EnemyBase source-closure ledger
- Capture condition item catalog
- PetSkill runtime
- Pet merge / make item 研究

Encounter 仍有 23 個 unresolved Group，以及 1 個明確 EnemyBase template blocker；不可用資料維持 non-spawnable，禁止跨版本硬補。

### 3. 地圖資料鏈

目前已完成：

- LS2MAP binary parser
- mapset walkability contract
- battlemap candidate contract
- map header catalog
- Encounter Floor/X/Y → tile/object probe
- client image → ADRNBIN → Real → RD decoder → palette → RGBA 的資料鏈

目前已有 11 張 verified map runtime；source catalog 本身有 1284 個 map blobs，因此「全世界地圖」仍遠未閉合。這 11 張包含四個 hometown destination、floor 100 與正確的 world floor 200 jalga。direct landing → 下一層 portal origin 與 encounter target 已完成座標級檢查，避免把 floor-level world edge 誤當成玩家可走路線。

四個 hometown 與 first-route destination 的原始 LS2MAP 已完成 exact pinned-source walkability audit；floor 100 與 world floor 200 亦已完成 fixed-C binary verified runtime。下一階段 Map Coverage 轉為擴張主要世界 route，而不是再處理這批 first-route destination source identity。

### 4. 原版客戶端圖像技術鏈

已完成 parser / resolver / decoder / palette / tile presentation adapter。

目前 `client-assets/manifest.json` 是 unavailable，沒有發布原版 BIN，因此真實原版圖片不會自動進入網站。

## 現在最需要補的部分

## A. 世界資料層：最高優先

這是目前最重要的缺口。

目前已完成第一輪 NPC → Event DSL → Item / Pet / Event State closure 與四個 hometown Start Flow Index；剩餘工作集中在起始路徑的逐點閉合。

原始 server data 除了已解析的 encounter、enemy、item、magic、petskill、profession、map 外，還存在 NPC、mission、memberpets、membershop、ride、title、question、event 等資料層。

因此下一階段應建立「World Data Catalog」，至少整理：

- NPC 出現位置與 template/create/arg 關係
- NPC 對話與條件
- NPC Event DSL / Event owner closure
- NPC 商店與購買／出售
- 任務／事件
- 地圖傳送與 warp
- 治療、存點、轉職、轉生等服務 NPC
- 坐騎與交通
- 稱號／聲望
- 問答／小遊戲類資料
- 事件型獎勵

原則仍是 source-backed；沒有 pinned evidence 的資料只能標成 candidate / unresolved，不能直接成為遊戲規則。

## B. 完整地圖閉合：最高優先

現在 1284 個 source map blobs 已有 11 張 verified runtime。

下一階段應把 map pipeline 變成可批量產生的流程：

source map
→ header 驗證
→ tile/object parser
→ mapset attributes
→ image ID
→ battlemap candidate
→ verified runtime

最後再建立：

- 地圖名稱／地區層級
- 地圖連接關係
- warp / door / cave / building entrance
- NPC / object 座標
- walkable / blocked / height
- encounter region
- battle field 對應

目前 first-route spine 已證明四個出生村的直接 warp 在 pinned source 上是可走的。destination 層 4/4 exact map source、7/7 landing walkability 已 closed。floor 100 / 200 的 fixed-C binary runtime 也已 verified，並完成 incoming landing → unconditional encounter rectangle path closure：8/8 portal groups 都至少有一個可用 landing 可抵達 unconditional encounter。2000 的 Group 1018 仍需要 item 20219、3000 的 Group 1015 仍需要 item 20216，而 pinned itemset6.txt 是空檔；這些 direct encounter 仍維持 conditional_unresolved_item_source，不被當作一般無條件刷怪規則。

## C. 玩家／寵物完整資料模型：高優先

Persistent State Schema 第一版已開始實作：canonical schema、24 格玩家 item slots、26 格 profession skill slots、PetBox/Team/ActivePet 分層，以及 legacy schema 30 的 known-field migration 已建立。下一步是把更多 source-backed state 欄位接到正式 runtime，仍不把 unresolved source 語義猜成規則。

- 玩家基本資料
- 等級／經驗／轉數
- 四大屬性與衍生 Work
- HP / MP / 狀態
- 裝備欄與背包
- 寵物欄、出戰寵、寵物狀態
- 技能與職業技能
- 寵物技能
- 稱號／聲望
- 金錢
- 任務／事件狀態
- 地圖／座標／存點
- 掛機設定
- 戰鬥設定
- offline / idle 統計
- save schema 與 migration

這一層應先做成與 UI 無關的資料模型，避免未來再把舊版 `game.js` 的狀態結構搬回來。

## D. 「放置版」核心循環：高優先

Idle Loop Contract 第一版已完成；下一步在這個 contract 上接 reward transaction、supply/death policy、offline resume 與長時間 simulation regression。這是最終遊戲與普通 Stone Age 重建之間最重要的產品層。

目前 route skeleton 已有 3 個 hometown path-closed variants，並保留 4000 source-blocked route exception。

需要再定義、再實作：

進入地圖
→ 自動移動／遇敵
→ 自動戰鬥策略
→ 戰鬥完成
→ EXP / Gold / Item / Pet 結算
→ 回復／補給
→ 繼續循環

並處理：

- 戰鬥設定
- 人物首次／一般行動
- 寵物首次／一般行動
- 補血門檻
- 捕捉策略
- 自動換寵
- 逃跑策略
- 背包滿時行為
- 死亡時行為
- 長時間運轉
- 暫停／恢復
- offline progress 的計算邊界

這一區不能直接用「方便的遊戲設計」取代 source 行為；真正原版有證據的部分照 source，真正屬於放置版產品層的新規則則要獨立標記。

## E. 戰鬥 presentation：中高優先

目前已有 HUD、target marker、battle feedback 的 contract，但還沒到影片中的完整戰場表現。

需要補：

- 真實 battle field
- 真正角色／寵物 sprite
- 敵我固定站位
- 技能動畫
- 攻擊動作
- 受傷／死亡
- 狀態效果
- 捕捉演出
- 回合節奏
- 目標選取
- battle result
- 戰鬥 UI 與自動戰鬥 UI 的整合

其中「演出」不能重新計算 battle result；應吃已完成的 battle result event。

## F. 真實素材與合法資產管線：中優先

V3.16～V3.20 的技術鏈已經夠用了，但目前沒有可直接使用的 client binary。

因此需要再把「授權資產注入」流程做完整：

- asset manifest
- ADRNBIN
- Real
- Palette
- sprite cache
- tile cache
- asset hash
- missing asset fallback
- dev / production asset profile

仍不把未確認授權的原版 BIN 直接提交到 repository。

## G. NPC / 任務 / 經濟系統：中高優先

目前已完成第一輪 NPC service 與 event DSL 索引，並建立 Item / Quest Event Closure；下一階段由「知道 NPC 存在」推進到「知道 NPC 會對玩家做什麼」。

要讓遊戲像完整作品，除了打怪還需要：

- NPC 對話
- 商店
- 買賣
- 製作
- 道具取得來源
- 任務
- 獎勵
- 傳送
- 治療
- 存點
- 轉職／職業
- 轉生
- 寵物相關服務

尤其目前 `capture_items.json` 已明確顯示部分捕捉／外觀條件道具的「來源」仍 unresolved，這正是值得往 NPC / quest / shop data 深挖的切口。

## H. 音效／動畫／細節 UI：後期

影片不只是靜態畫面，還包含完整的 UI 節奏。

後期需要統一：

- 音效事件
- BGM
- 按鈕反饋
- 視窗開關
- hover / selected / disabled
- 數值跳動
- 物品獲得
- 任務完成
- 等級提升
- 寵物升級
- 戰鬥勝負
- 掛機開始／停止
- 聊天／系統訊息

## 暫時不要做的事情

### GMQUE

`data/generated/stoneage_disabled_features.json` 已把 GMQUE／抓寵活動永久停用。

因此它不再是重建主線 blocker，也不應重新打開。

### 再次建立大量 HTML 入口

新的網站只保留一個 canonical playable entry。

研究資料、runtime modules、測試工具與網站入口要分離，避免再次出現 `index.html`、`game.html`、`game-live.html`、`play.html` 多頭分裂。

## 建議的下一個實際工作順序

1. **World Data Catalog**：已完成第一輪；目前進入 Start Flow / Item Acquisition / Quest Closure。
2. **Start Route Closure**：source-route spine 已 closed；46/46 start-floor NPC coordinates 已 source-resolved；41/46 active-template NPC interactions 已完成 reachability，5 個 `changeevent` runtime-unresolved。destination maps 4/4 verified、7/7 landing walkability closed；floor 100 / 200 也已完成 verified runtime 與 8/8 encounter landing-path closure。剩餘 blocker 集中在 4000→200 source transition、5 個 changeevent module discrepancy、3000→200 的單一不可走 landing，以及新玩家 reward definitions。
3. **Map Coverage Expansion**：由目前 11 張 verified map 繼續擴到主要世界路線的完整地圖群；first-route floor 100 / 200 已 verified，接下來以 route skeleton 對應的 missing map branches 為擴張入口。
4. **Persistent State Schema**：第一版 canonical schema 已建立；本輪補上 Gold、reward transaction persistence 與 idle state containers。
5. **Idle Loop Contract**：state machine 已建立，reward transaction 與 supply/death/offline policy boundary 已建立；下一步是 simulation runner、save commit 與 offline resume。
6. **Battle Presentation Contract**：把已驗證 battle result 接到完整場景與動畫事件。
7. **NPC / Economy Runtime**：Item / Economy transaction v1 已接到 canonical state；下一步是接 source Item allocator、NPC shop data、製作與任務取得路徑。
8. **Authorized Asset Integration**：依實際授權範圍導入石器時代原始 client／3D／UI assets，並建立來源、授權狀態、版本與用途 manifest。
9. **唯一可玩入口**：前面資料與系統成熟後，才重新建立新的遊戲頁。

## 判定標準

進入「做可玩遊戲」階段前，至少要能回答：

- 玩家從哪裡出生？
- 可以去哪裡？
- 每張主要地圖怎麼連？
- NPC 是誰、在哪裡、提供什麼？
- 每種遇敵怎麼生成？
- 戰鬥每一步怎麼結算？
- 玩家與寵物怎麼成長？
- 道具怎麼取得、使用、裝備、製作？
- 任務怎麼開始／完成？
- 放置模式怎麼循環？
- 斷線／關閉後怎麼處理？
- 哪些是 fixed C，哪些是影片還原，哪些是本專案新增的放置版規則？

只要這些問題還有大面積空白，就先繼續做資料與 contract，而不是急著寫首頁。

Destination closure checkpoint：`data/generated/stoneage_start_destination_closure.json`；審計工具：`tools/audit_start_destination_closure.mjs`。


## 2026-09-30 新增：destination portal 與 verified map runtime pipeline

`data/generated/stoneage_start_destination_warp_coordinates.json` 已把 four-town first-route 下一層 exact source portal 座標從 floor graph 拆出，避免只用 floor-level edge 代替真正的座標證據。

同時新增 `tools/generate_verified_map_runtime.mjs`：輸入 fixed-C 的 LS2MAP binary 後，會驗證 Git blob SHA、解析 `MAP_readMapOne()` 格式、檢查 mapset image IDs、依 battlefield source manifest 建立 `RAND(0,2)` 的三候選 battlemap resolver，最後寫入 verified runtime 與 runtime index。`tools/check_verified_map_runtime_generator.mjs` 提供 synthetic 1×1 map regression。

目前已用 fixed-C binary source 直接生成 1000/3000/4000 runtime；1000/3000/4000 的檔名不是 floor ID，而是由 LS2MAP header 精確辨識 floor。

## 2026-09-30 新增：新玩家 event owner closure

四個 hometown 的 `炎龍新手接待員` source owner 已閉合到 `gmsv/data/npc/almark/xinshou/xinshou.create`，共用 `almark/xinshou/xinshoujd.arg`。腳本的四段等級／轉生分支與對應 EndSetFlg 已納入 `data/generated/stoneage_new_player_event_closure.json`，並由 `tools/audit_new_player_event_closure.mjs` 驗證。

其中四個 source 座標原本在 Start Flow Index 中無法安全解析，現在已從 pinned `xinshou.create` 解出；由於其座標與出生點重疊，互動是否可在同格或必須站鄰格不能套用其他 NPC service 規則，暫維持未審計。

## 2026-09-30 修正：Start-floor NPC coordinate / runtime closure

原本 Start Flow Index 的 30 個 unresolved coordinates 是索引層未反解 `borncorner`，不是 fixed-C source 沒有位置。現在已全部由 exact create blocks 解出，形成 `data/generated/stoneage_start_npc_coordinate_closure.json`。

之後套用 fixed-C template / interaction contract 後，41/46 NPC 已可驗證從出生點到合法互動站位；5 個 `changeevent` blocks（4 個 xinshou + 1 個薩姆吉爾村長）因 `gmsv/src/npc/npctemplate.c` 的 `functionSet[]` 不存在 `changeevent`，並依 `gmsv/src/npc/npccreate.c` 的 unknown-template rejection 規則維持 runtime-unresolved，不視為已實例化 NPC。


## 2026-09-30 新增：world exit 座標級可達性與 floor 200 衝突

新增 `data/generated/stoneage_start_world_exit_reachability.json` 與 `tools/audit_start_world_exit_reachability.mjs`，把 direct destination → 下一層 world portal 從 floor-level edge 降到固定 map runtime 的座標級 path proof。

結果：

- 1000→100：2/2 portal groups usable，最短 120 / 104 步。
- 2000→100：2/2 portal groups usable，最短 33 / 82 步。
- 3000→200：2/2 portal groups usable；第二組 6 個 source origins 中 5 個可達，(73,59) 因 object image 2 不可走。
- 4000→200：0/2 portal groups usable；兩組 source portal origins 都是 walkable cell，但都與 direct landing component 不連通，因此不能直接升格成 playable route。

同時確認目前 `data/generated/stoneage_map_200.json` 是 `gmsv/data/map/extra/200` 的 30×30 map，不能容納 fixed-C world portal 的 x=588、y=1008 等座標。fixed source tree 另有 `gmsv/data/map/jyaruga/jalga`，blob SHA=`dcbb20f0212192fc852e1489a29a0d6d8d4c95ce`、size=3,840,044 bytes；公開地圖編號資料亦把 floor 200（加魯卡）對應到此 path。這一點現在已完成 fixed-C binary verification；`jalga` 已成為 floor 200 的 verified runtime，沒有使用猜測或跨版本資料。

因此 first-route 現在以「可從 direct landing 實際走到 source portal / encounter target」作為 route promotion 條件。4000 仍需完成 disconnected source-transition 分析；3000→200 的單一不可走 landing 維持明確例外，其餘 path closure 已成立。
## 2026-09-30 新增：ordinary encounter target 座標索引

新增 data/generated/stoneage_start_encounter_target_index.json 與 tools/generate_start_encounter_target_index.mjs，把 fixed-C encount/group 的 floor 100、200 encounter rectangle 變成可供後續 path testing 的 target set。

- floor 100：46 rows；32 unconditional、1 mixed、11 unresolved group、1 conditional item、1 placeholder。
- floor 200：114 rows；103 unconditional、5 mixed、5 unresolved group、1 conditional item。
- floor 100 source map identity 已由 fixed source catalog 對齊到 gmsv/data/map/sainasu/sainasu，並已完成 800×800 binary-level runtime verification。
- floor 200 的 gmsv/data/map/jyaruga/jalga 已完成 800×1200 binary-level runtime verification。

這一層只做 source-coordinate closure，不把 rectangle 當成玩家一定能走到的可玩刷怪區。下一階段須把 incoming portal landing → encounter rectangle 做 exact walkability/path proof。unresolved group 與 mixed rows 繼續分層處理，不跨版本補值。
## 2026-09-30 最新校正：Start-floor NPC 不是座標缺口，而是 template 缺口

`data/generated/stoneage_start_npc_coordinate_closure.json` 已把 46/46 start-floor NPC 的座標全部從 exact `borncorner` source 解出；`data/generated/stoneage_start_npc_reachability.json` 再以 fixed-C interaction contract 驗證 41/46 可達、0 個 unreachable。

剩餘 5 個不是座標問題，而是 `changeevent` runtime module 問題：4 個 `xinshou` 新手接待員加上 1 個薩姆吉爾村長，均由 source create 宣告 `enemy=changeevent|...`，但 pinned `gmsv/src/npc/npctemplate.c` 的 `functionSet[]` 找不到 `changeevent`。依 `gmsv/src/npc/npccreate.c::NPC_templateGetTemplateIndex` 的 unknown-template 行為，這些 block 不應被當成已實例化、可互動的 NPC。

## 2026-09-30 更新：四張 destination maps 全部閉合

fixed-C recursive tree 與 LS2MAP headers 已確認四個直接離村 destination floor 都有 exact map：1000 為 `sainasu/samugiru/samugiru`、2000 為 `sainasu/marinasu/2000`、3000 為 `jyaruga/jaja/jaja`、4000 為 `jyaruga/karutana/karutana`。目前 11 張 map runtime 已完成 verified index。

四個 destination 共 7 個 landing points 全部通過 tile/object walkability。這表示 destination map source 與 landing walkability 已經不是 blocker；接下來要處理的是 encounter 條件、一般掛機 region、changeevent runtime discrepancy 與 reward data closure。

## 2026-09-30 checkpoint：first-route source closure 已進入 encounter / module 階段

目前已完成四村起點 → direct warp → destination map 的 source-backed closure：四村出生點、8 個 direct warp exits、46 個 start-floor NPC coordinates、41/46 active-template NPC interactions，以及 4/4 destination map runtimes、7/7 landing walkability 均已有固定 C 證據。剩餘 blocker 已縮成三類：

1. `changeevent` 在 pinned `npctemplate.c` 不存在，5 個 start-floor blocks 因此維持 runtime-unresolved；
2. 2000/3000 direct encounter 仍是 item-gated，而 pinned `itemset6.txt` 為空；1000/4000 direct destination rows 是 placeholder，但可經 world exit path 接到已驗證的 floor 100 / 200 unconditional encounter target；
3. 新玩家 event 的 reward item/pet definitions 尚未全部在 pinned source 中閉合。

這個 checkpoint 之後，Map Coverage 的 first-route groundwork 已完成一個可執行的 ordinary encounter path closure layer，現在正式進入 Persistent State / Idle Loop；仍不回頭建立多個 playable HTML。
## 2026-09-30 Idle Loop Contract v1

新增 src/stoneage_idle_loop.mjs、docs/reference/idle-loop-contract.md、data/generated/stoneage_idle_loop_contract.json 與 regression。

Idle state machine 已固定為 disabled → moving → encounter_pending → in_battle → settlement → supply_check / moving，另處理 dead 與 offline_resume。battle result 是輸入，不在 presentation 或 idle orchestration 重新計算。

同步新增 data/generated/stoneage_first_idle_route_catalog.json，將已閉合的 map/portal/encounter path 串成首批 idle route skeleton：3 個 hometown 有 path-closed variants、1 個 hometown（4000）在 source portal 前被 block。battle strategy、補給、捕捉、背包滿、死亡恢復、offline accrual 仍維持 product-policy boundary。
## 2026-09-30 Persistent State Schema v1

新增 `src/stoneage_persistent_state.mjs`、`docs/reference/persistent-state-schema.md`、`data/generated/stoneage_persistent_state_schema.json` 與 `tools/check_persistent_state_schema.mjs`。

Canonical state schema = 1；fixed-C legacy save schema provenance = 30。固定 structural contracts：profession skill slots 26、player item slots 24。PetBox / Team / ActivePet 分離保存；legacy migration 採 known-field copy，未知 top-level keys 進 preservedUnknownKeys，不猜語義。

Idle 與 battleSettings 明確標示為放置版產品層，不冒充 fixed-C。
## 2026-09-30 Reward Transaction v1

新增 `src/stoneage_reward_transaction.mjs`、`docs/reference/reward-transaction-contract.md`、`data/generated/stoneage_reward_transaction_schema.json` 與 regression。Reward layer 只接受 battle/source runtime 已決定的 EXP / Gold / existing-item / Pet credit，不重新抽 reward RNG。固定 source 的 AddProfit 邊界與 carried loot ordering 已映射到 atomic transaction；inventory full 不做 partial commit，同 transactionId 重複提交不重複發獎勵。

## 2026-09-30 Idle Supply / Death / Offline Policy v1

新增 `src/stoneage_idle_policy.mjs`、`docs/reference/idle-supply-death-offline-policy.md`、`data/generated/stoneage_idle_policy_schema.json` 與 regression。Healer 的 player HP/MP full recovery 是 source-backed；supply threshold、death recovery mode、offline cap 與 offline reward simulation 維持 explicit product policy，不自行設定。

## 2026-09-30 Save Envelope / Simulation v1

新增 `src/stoneage_save_transaction.mjs`：canonical state 現在有 deterministic serialization、SHA-256 hash、schema validation / migration、revision conflict guard。Hash 採 Web Crypto，避免未來瀏覽器 runtime 依賴 Node-only crypto。

新增 `src/stoneage_idle_simulation.mjs`：first-idle route 可被執行成 pure simulation；route path time → encounter → injected battle result → reward transaction → supply/death decision → save commit。Runner 不重算 battle 或 reward RNG。offline resume 目前只計算時間窗與 explicit cap，不自行創造離線收益。

Existing-item reward lifecycle 已依 source 修正為只接收已存在且 enemy-owned 的 runtime item，並只能放入固定 Player backpack slots 9–23；不再由 reward layer 自行建立 existing-item slot。

下一階段：把 source-backed item/economy runtime、battle simulation adapter 與真正的 save/offline resume transaction 接起來，再擴主要 world route coverage；仍不建立多個 playable HTML 入口。

## 2026-09-30 Battle Result Adapter / Offline Resume

新增 `src/stoneage_battle_result_adapter.mjs` 與 regression。fixed-C PvE 的 completed battle result 現在有獨立 adapter，Idle Simulation 不直接接受未標準化的 battle object；PvE `winside=0/1` 分別映射 player victory/defeat，battle result 與 reward RNG 都不在 adapter 重算。

新增 `src/stoneage_offline_resume.mjs` 與 regression。Offline resume 現在可透過 Idle Simulation Runner 發起 checkpoint commit；必須先有 `idle.offline.eligible=true`，時間窗驗證後寫入 Save Envelope。尚未完成 source-backed offline battle/reward simulation，因此 `accruedSeconds=0` 與 `rewardsApplied=false` 是目前的安全邊界。

下一階段可把 source-backed battle simulation output 接到這個 adapter，再決定是否形成真正的 offline reward transaction；同時開始 Item / Economy runtime 與主要 world route coverage。

## 2026-09-30 Item / Economy Runtime v1

Item / Economy 已從「資料研究」進入 canonical state transaction 層：

- `sourcePlayerMaxGold()` 固定對齊 fixed-C `CHAR_getMaxHaveGold()` 的轉生金錢上限公式。
- Buy：source-resolved Item ID / cost / buy_rate → source allocator 建立 existing item → 放入 player backpack 9–23 → 扣 Gold。
- Sell：source-resolved price → 刪除 player existing item / 扣 pile → 加 Gold；simple-shop base price 9,999 boundary 與 source gold-cap guard 已固定。
- stack item 在 pile > 0 時保留同一 existing index；pile = 0 才釋放 runtime item。
- 尚未完成 source Item maker 的完整 browser adapter，因此 Buy 不自行產生 Item；缺少 source allocator 或 Item 來源證據時直接 fail-closed。

Regression：`tools/check_item_economy_runtime.mjs`。
Generated contract：`data/generated/stoneage_item_economy_runtime_schema.json`。

Source Item allocator / Item template runtime 已接通：fixed-C 66-field Item make lifecycle、existing-index allocator、ITEM_INITFUNC callback boundary 與 Item / Economy Buy adapter 均已建立，並由 tools/check_item_source_runtime.mjs + CI regression 固定。
NPC ItemShop Runtime v1 也已接通：固定 `npcgen_shop` → `.arg` → `ItemList/buy_rate/sell_rate` 的 source parser、shop→item 與 item→shop acquisition index、sell limits，以及 Item template cost → Economy Buy adapter 均已建立；由 tools/check_npc_itemshop_runtime.mjs + CI regression 固定。完整 pinned source checkout 仍必須作為 generator input，未在 repo 內假稱已完成 336 個 binding 的資料落盤。
NPC ItemShop Runtime v1 已接通，接著 V3.21 已新增 NPC Event / Quest Plan Runtime：source condition (`LV/TRANS/GOLD/ITEM/ENDEV/NOWEV`)、comma-OR / `&`-AND、branch selection 與 literal action plan 均已固定，並以 new-player `changeevent` script 做 regression。真正 mutation 仍需 explicit Item allocator / Pet factory / event-state writer，不把 unresolved reward definition 猜成 gameplay。
V3.21 NPC Event Plan Runtime 與 V3.22 NPC Event Action Transaction 已接通：condition → branch selection → literal action plan → staged atomic mutation boundary，且以 new-player `xinshoujd.arg` regression 鎖定。真正的 Item/Pet/Event/Charm mutation 仍只透過 explicit adapters，source definitions 未閉合就不升格。
V3.23 NPC Event Orchestrator 已完成：把 `condition → branch → action plan → atomic transaction` 收成單一 source event entry point，先以 `xinshoujd.arg` 做 first-route regression。接下來不是再做另一套 event parser，而是把這個入口接到已存在的 Item allocator、Pet template resolver、event-state writer 與 Save Transaction。
V3.24 已完成 new-player Pet source closure：`GetPet Enemy ID → enemy1 row → TempNo → enemybase1 template → 16-RNG Pet creation core`，並提供 explicit canonical Pet ID handler。V3.25 又完成 16 個新手 Item reward 的 source-backed Item allocator adapter。V3.26 再把 `EndSetFlg / NowSetFlg / ENDEV / NOWEV` 的 fixed-C bitset 正式接回 event runtime，因此 first-route reward flow 現在只剩 `Charm:1` concrete semantics 與正式 `changeevent` template activation 兩個主要 source blockers。
V3.27 first-route handler bundle 已完成並通過 atomic execution / rollback regression；V3.28 再把 V3.24 Pet、V3.25 Item、V3.26 Event Flag 與 V3.27 source-gated Charm adapter 直接接進 V3.23 orchestrator，形成可重播的 Lv1 new-player reward transaction。固定-C 的 Charm concrete rule 已查明：`CHAR_CHARM<100 && EvNo>0` 才增加，`EventNo:-1` 因此為 no-op。
下一階段集中閉合 pinned source 的 `changeevent` template registration / instantiation（`npctemplate.c/functionSet[]`），再把已閉合的 first-route transaction 接到 browser NPC interaction 與 Save Transaction；不再新增平行 reward engine。

V3.29 已完成 `changeevent` module audit：
V3.31 將 fixed-C NPC facing / distance 互動 gate 變成獨立 runtime；V3.32 再把 interaction gate、module resolution、handler factory 與既有 first-route Save bridge 接成唯一 dispatch entry point。正式 `changeevent` module 仍以 pinned `npctemplate.c/functionSet[]` 缺失為 source blocker，不偷補 alias。
V3.30 已完成 first-route Save integration：`condition → reward adapters → atomic NPC event transaction → existing Save Envelope → reload parity`。reward mutation chain 現在可持久化；正式 `changeevent` template registration 仍 unresolved，browser NPC interaction 仍是後續邊界。
pinned `npctemplate.c/functionSet[]` 沒有 `changeevent`，`npccreate.c` 對 unknown template 直接不掛 template；公開文件只能證明 changeevent 的 DSL 用途，不能補出缺失的 pinned C module。Reward mutation chain 已閉合，因此下一階段切到 Save Transaction integration 與可測試的 synthetic NPC interaction boundary，同時保留正式 `changeevent` instantiation unresolved。

V3.34 已補齊四段 new-player branch matrix regression，鎖定 Lv 1–99 / 100–139 / 140–149 / 150 的 source branch、Item/Pet reward、EndSetFlg 與 Save reload parity；因此下一個工作點回到正式 `changeevent` browser instantiation，而不是再擴 reward logic。

## 2026-09-30 V3.37–V3.39 Canonical Browser Runtime

V3.37 將 strict / compatibility policy 統一到 `stoneage_npc_runtime_config`；V3.38 再將 `NPC_TALK` 接成唯一 browser state controller，且以四個 hometown 的 `xinshou` changeevent rows 做 compatibility execution / Save reload regression。V3.39 建立唯一 `index.html` canonical browser shell，CI 固定 repository 只能存在一個 HTML entry。

目前正式邊界：

`index.html → canonical browser shell → Browser State Controller → NPC Dispatch → interaction gate → audited/compatibility module registry → first-route Save`

Strict mode 仍維持 pinned `changeevent` unresolved；Compatibility mode 只在明確 opt-in 下使用 external `changeevent → ExChangeMan` corroboration。這不代表 pinned fixed-C 已補回缺失的 `changeevent` functionSet。

下一階段可以開始把 verified world/map presentation 接到這個唯一 shell；reward、save、NPC dispatch 不再另起平行 engine。


## 2026-09-30 V3.40 Browser ItemShop / Economy Bridge

V3.40 已把已存在的 Item / Economy Runtime、Source Item Allocator 與 NPC ItemShop Runtime 接進 canonical browser state controller；沒有建立第二套 currency、inventory 或 shop engine。

正式邊界：

`browser action → source interaction gate → NPC ItemShop catalog → source Item price / Item template → allocator → Economy transaction → persistent state`

三個 browser action 已固定：

- `NPC_ITEMSHOP_OPEN)：source catalog lookup，唯讀。
- `NPC_ITEMSHOP_BUY)：source Item offer / base cost → source allocator → Gold debit。
- `NPC_ITEMSHOP_SELL)：existing Item source fields → `LimitItemType / LimitItemNo / special_item / special_rate` → Gold credit。

Regression 已加入 `tools/check_v340_browser_itemshop_runtime.mjs` 與 `.github/workflows/check-v340-browser-itemshop-runtime.yml`；canonical `index.html` 的 ItemShop probe 使用 synthetic fixture，只驗證 bridge contract。

本輪沒有把 fixture 升格為完整 world catalog。正式 world ItemShop 仍以 pinned fixed-C source checkout 生成，現有 service index 的 336 ItemShop bindings / 190 floors 仍維持 source-index 證據，不偽造完整 generated catalog。

### V3.40 之後

下一個實際切入點是：

1. 用 pinned fixed-C checkout 生成完整 ItemShop catalog，並把 shop binding 與 world NPC instance / floor 坐標建立正式 join。
2. 在同一個 browser state controller 上接 shop UI state（開啟店面、offer 選取、數量確認、結果提示）。
3. 再把正式 ItemShop browser flow 接回地圖中的可互動 NPC。

仍不新增第二個 HTML 入口，也不修改 V3.39 strict `changeevent` fail-closed policy。


## 2026-09-30 V3.41 Full NPC ItemShop Source-Catalog Verification

V3.41 將正式 ItemShop source closure 提升為可重跑的 GitHub Actions job：固定 checkout `gavinlinasd/StoneAge@1f90cb6cb57c1df70f39cde77a5a8ccd98b66c56`，執行既有 `generate_npc_itemshop_runtime.mjs`，並驗證：

- ItemShop binding 數量必須為 336。
- source parser 不得留下 unresolved binding。
- 每個正式 ItemShop offer 的 Item ID 必須能在本 repo 的 `stoneage_item_make_runtime` 找到 source Item template。
- 生成結果另存為 GitHub Actions artifact，作為後續 browser/world join 的驗證輸入。

這一階段先做 source closure / cross-check，不直接把 generated artifact 當成 production world data，也不改變 V3.40 browser fixture contract。



## 2026-09-30 V3.42 NPC ItemShop / World Join

V3.42 已新增同 pinned fixed-C source 的 World NPC + ItemShop 雙生成 join regression。CI 會：

- 重建 `stoneage_world_npc_index` 與 ItemShop catalog。
- 驗證 World index / service index 的 ItemShop instance count = 336、unique floors = 190。
- 驗證 ItemShop catalog 的 335 resolved + 1 unresolved 正好對應 336 個 source create blocks。
- 逐筆 join `create path#blockIndex`、floor、templateName 與 arg fileRef。
- 驗證正式 buy offer 的 Item IDs 全部存在於本 repo 的 Item source runtime。

固定 source 目前保留 1 筆明確 anomaly：`gmsv/data/npc/my/magicdou/daochang.create#8` → `my/ruieryasi/yao.arg`。該目錄在 pinned checkout 不存在，故維持 fail-closed，不以猜測檔案內容替代。

下一步不是再造新 engine，而是把通過 join 的正式 catalog 接回 canonical browser shell / world NPC interaction，並讓這一筆 anomaly 維持不可交易狀態直到有新的可證實 source。

## 2026-10-01 V3.78 Browser World First-Route Planning

V3.78 將 V3.76 movement、V3.77 map WarpPoint 與既有 first-idle encounter closure 串成單一唯讀 headless planner：

`direct hometown landing → WORLD_MOVE_STEP* → WORLD_WARPPOINT_EXECUTE → WORLD_MOVE_STEP* → unconditional encounter boundary`

新增：

- `src/stoneage_browser_world_first_route_runtime.mjs`
- `data/generated/stoneage_browser_world_first_route_schema.json`
- `tools/check_v378_browser_world_first_route.mjs`
- `.github/workflows/check-v378-browser-world-first-route.yml`
- `docs/reference/v378-browser-world-first-route.md`

planner 不建立第二套 movement / warp / battle engine，只產生可直接交給 canonical Browser State Controller 的 action sequence。四方向 BFS 使用既有 `sourceMapWalkableAt()`；這是 browser navigation 的 path choice，不冒充 fixed-C 原始客戶端的 exact input sequence。

Encounter 邊界沿用 pinned fixed-C `ENCOUNT_initEncount()` / `ENCOUNT_getEncountAreaArray()` / `CoordinateInRect()` 語義。Rectangle 為 inclusive；抵達 unconditional encounter rectangle 只代表 route boundary closed，不代表已經消耗 encounter RNG 或啟動戰鬥。

目前 closure：

- 1000→100、2000→100 各 2 組可規劃。
- 3000→200 兩組仍受既有 landing / source closure 約束，其中 `(587,318)` 維持不可走。
- 4000→200 兩組仍 `source_blocked_before_portal`，V3.78 不建立 synthetic bridge / manual warp。

V3.78 controller 新增唯讀 action `WORLD_FIRST_ROUTE_PLAN`；plan 不修改 Persistent State revision，也不建立 Save Envelope。

## 2026-10-01 V3.79 Browser World First-Route Execution

V3.79 將 V3.78 的唯讀 first-route plan 真正交給 canonical Browser State Controller 逐步執行：

`WORLD_FIRST_ROUTE_EXECUTE → WORLD_MOVE_STEP* → WORLD_WARPPOINT_EXECUTE → WORLD_MOVE_STEP* → unconditional encounter boundary`

新增：

- `src/stoneage_browser_world_first_route_execution_runtime.mjs`
- `data/generated/stoneage_browser_world_first_route_execution_schema.json`
- `tools/check_v379_browser_world_first_route_execution.mjs`
- `.github/workflows/check-v379-browser-world-first-route-execution.yml`
- `docs/reference/v379-browser-world-first-route-execution.md`

V3.79 是 orchestration layer，不建立第二套 movement、WarpPoint 或 battle engine。每一步直接呼叫既有 V3.76/V3.77 primitive，因此每個成功 movement / WarpPoint 都沿用既有 `commitSave` / Save Envelope / revision contract。

本輪 regression 以 1000→100_a 驗證完整執行鏈；目標是實際把 Persistent State 從 hometown landing 一步步保存到 floor 100 encounter boundary。Encounter 只閉合到「已抵達 unconditional encounter rectangle」，不消耗 RNG、不啟動 battle。

失敗處理不是跨多步驟 atomic rollback：若中途某個 action 失敗，前面已成功保存的移動會保留，runtime 會回傳失敗 action index 與當前 state，供上層停止或重新規劃。

4000→200 仍維持 source-blocked；V3.79 不以 WarpPoint row 存在就直接跨過 V3.62 的 fixed-C movement reachability blocker。

## 2026-10-01 V3.80 Browser World Encounter Boundary

V3.80 把 V3.79 的 first-route execution 再向 encounter runtime 推進一層，但仍不提前啟動 battle：

`WORLD_FIRST_ROUTE_EXECUTE → WORLD_ENCOUNTER_PREPARE`

新增：
- `src/stoneage_browser_world_encounter_runtime.mjs`
- `data/generated/stoneage_browser_world_encounter_schema.json`
- `tools/check_v380_browser_world_encounter_runtime.mjs`
- `.github/workflows/check-v380-browser-world-encounter-runtime.yml`
- `docs/reference/v380-browser-world-encounter-boundary.md`

Encounter adapter 直接使用已完成 source closure 的 `stoneage_start_encounter_target_index.json`，只允許 `unconditionalRows`。輸出固定 C encounter metadata：Encounter ID、inclusive rectangle、probability min/max、enemy max、Group IDs / Enemy IDs 與 zorder selection。

V3.80 是唯讀 adapter：
- 不消耗 RNG。
- 不啟動 battle。
- 不修改 Persistent State revision。
- 不重建 Enemy team。
- 不對 mixed / item-gated / unresolved group / placeholder row 做猜測性 promotion。

固定 C 的 `ENCOUNT_getEncountAreaArray()` 會以座標與 rectangle 判定 active encounter row，並以 zorder 處理重疊；V3.80 保留這個 selection contract。指定 Encounter ID 時要求該 ID 必須真的位於玩家目前座標，錯誤即 fail-closed。

下一階段才進入 encounter roll：依 fixed-C `CEP`、min/max clamp 與 `rand()%120 < cep` 建立獨立 RNG-injected runtime；roll 成功後才接既有 Idle Loop `encounter_pending → encounter_rolled → in_battle`，不在 V3.80 偷渡 battle 邏輯。

## 2026-10-01 V3.81 Browser World Encounter Roll

V3.81 在 V3.80 source adapter 之後加入獨立的 encounter probability runtime：

WORLD_ENCOUNTER_PREPARE → WORLD_ENCOUNTER_ROLL

固定 C char_walk.c 的 encounter roll 被拆成可測試的 RNG-injected contract：
- CEP 先依 encounter probMin / probMax clamp。
- battle mode 為 none 且 no-enemy gate 未封鎖時，執行 rand()%120 < CEP。
- miss：CEP +1，但不超過 probMax。
- hit：triggered=true，CEP 回到 probMin。
- warp event blocker：仍消耗 roll RNG；命中時不觸發 encounter，也不做 miss increment。

RNG 由 caller 注入 rng120 0..119，runtime 不呼叫 Math.random。V3.81 仍不修改 Persistent State、不寫 Save Envelope、不建立 battle context；它只把 source encounter roll 結果交給下一層。

目前仍保留兩個明確邊界：
1. profession encounter modifier、MoonAct 額外 RAND 與其他 connection-specific helpers 尚未升格，沒有 pinned build evidence 就不猜。
2. cepAfter 尚未持久化到 Persistent State；下一階段再接 browser idle encounter_pending / encounter_rolled，並把 triggered 交給 fixed-C Enemy team selection / battle context。

## 2026-10-01 V3.82 Browser World Encounter Persistence

V3.82 將 V3.81 的唯讀 encounter roll 接入 canonical Persistent State，但保留原 V3.81 action 的純運算語義。

新增：
- src/stoneage_browser_world_encounter_persistence_runtime.mjs
- data/generated/stoneage_browser_world_encounter_persistence_schema.json
- tools/check_v382_browser_world_encounter_persistence.mjs
- .github/workflows/check-v382-browser-world-encounter-persistence.yml
- docs/reference/v382-browser-world-encounter-persistence.md

Persistent field：
world.encounter.cep

固定 C 的 Connect[fd].CEP 在連線初始化時為 0。原 C 把它作為 connection-scoped encounter counter；V3.82 在單機版本中把「最新 CEP checkpoint」保存到 Persistent State，這是為 save / reload / offline continuity 做的 product-layer adaptation，不宣稱與 C 的 connection lifetime 完全相同。

新增 WORLD_ENCOUNTER_ROLL_COMMIT：
1. 讀取 persistent CEP。
2. 呼叫 V3.81 WORLD_ENCOUNTER_ROLL。
3. 將 cepAfter 寫入 world.encounter.cep。
4. commitSave。
5. parseAndValidateSaveEnvelope round-trip verification。

成功 revision +1；revision conflict、invalid encounter、invalid RNG 都 fail-closed，不會半寫入。

V3.82 仍不建立 battle，不計算 Enemy team，不加入 profession modifier / MoonAct 額外 RNG。下一階段才把 triggered=true 接回 Idle Loop 的 encounter_pending → encounter_rolled → in_battle，並在 battle context 前閉合 ENEMY_getEnemy() 的 Group / Enemy selection。

## 2026-10-01 V3.83 Browser World Encounter Group Selection

V3.83 接在 V3.80 / V3.81 / V3.82 encounter boundary 後，閉合 fixed-C `ENEMY_getEnemy()` 的第一個 battle-side selection：

`WORLD_ENCOUNTER_GROUP_SELECT`

流程是 read-only：
1. 由目前 Persistent State 世界座標解析 prepared encounter。
2. 讀取 fixed-C Encounter 的 `groupIds + groupProbs`。
3. 依 Group 的 `GROUP_APPEARBYITEMID / GROUP_NOTAPPEARBYITEMID` 檢查玩家 inventory。
4. 排除 zero-weight / unresolved / item-gated 不符合的 Group。
5. 由 caller 注入一次 `RAND(0, sum(weight)-1)` 對應的 `groupRoll`，選出唯一 Group。

新增：
- src/stoneage_browser_world_encounter_group_runtime.mjs
- data/generated/stoneage_start_encounter_group_runtime.json
- data/generated/stoneage_browser_world_encounter_group_schema.json
- tools/generate_start_encounter_group_runtime.mjs
- tools/check_v383_browser_world_encounter_group_runtime.mjs
- .github/workflows/check-v383-browser-world-encounter-group-select.yml
- docs/reference/v383-browser-world-encounter-group-select.md

Encounter 65 的固定 C Group 89 / 92 / 94 均已由 pinned `group1.txt + enemy1.txt` 完整閉合；Group probability 為 `1/1/1`，因此 groupRoll 0/1/2 分別選 89/92/94。

V3.83 不改 Persistent State、不啟動 battle、不決定本戰人數、不執行 Enemy random replacement、不處理 big-enemy ordering。下一階段才閉合 selected Group → entryMax → Enemy slot weighted generation。

## 2026-10-01 V3.84 Browser World Encounter Enemy Generation

V3.84 在 V3.83 selected Group 之後，開始閉合 fixed-C `ENEMY_getEnemy()` 的 roster generation：

`selected Group → enemyEntryMax → entryMax → CREATEPROB weighted slot selection → duplicate CREATEMAXNUM gate → big-enemy ordering`

固定 C 規則：
- `enemyEntryMax = min(encounter.enemyMax, sum(CREATEMAXNUM))`
- `entryMax = RAND(1, enemyEntryMax)`
- 每個 roster loop 以 `RAND(0, sum(CREATEPROB)-1)` 選 Enemy。
- 同一 Enemy 已達 `CREATEMAXNUM × sameCount` 時，該次抽選作廢。
- 最多 100 次 loop。
- `E_T_SIZE_BIG` 最多 5 隻；第 6 格之後若抽到 big，先把前五格中的第一個 normal 移到目前位置，再把 big 放到該 normal 的位置。

V3.84 新增：
- src/stoneage_browser_world_encounter_enemy_runtime.mjs
- data/generated/stoneage_browser_world_encounter_enemy_schema.json
- tools/check_v384_browser_world_encounter_enemy_runtime.mjs
- docs/reference/v384-browser-world-encounter-enemy.md
- .github/workflows/check-v384-browser-world-encounter-enemy.yml

V3.83 Group catalog 同步加入 EnemyBase provenance；156 個起始路線 Group 解析出 47 個 EnemyBase TempNo，size 分布為 normal 162 / big 37 個 member。

特殊 `ENEMY_RandomEnemyArray()` range 945–956、964–969 目前仍 fail-closed，尚未自行拼裝 replacement RNG table。

V3.84 仍不修改 Persistent State、不啟動 battle、不計算 damage、不處理 reward/capture/death。下一階段再把 generated roster 轉成 battle context，並閉合 Enemy stat / AI / battlefield 初始化的來源鏈。

## 2026-10-01 V3.85 Browser World Encounter → Idle Pending Bridge

V3.85 將 V3.81 的 fixed-C encounter roll 正式交給既有 Idle Loop，但只推进到 `encounter_pending`：

`WORLD_ENCOUNTER_ROLL_IDLE_COMMIT`
→ Encounter source resolve
→ CEP roll
→ `world.encounter.cep = cepAfter`
→ `IDLE_EVENTS.MOVE_TICK`
→ hit: `encounter_pending`
→ miss: `moving`
→ one Save Envelope commit + verification

新增：
- `src/stoneage_browser_world_encounter_idle_bridge.mjs`
- `data/generated/stoneage_browser_world_encounter_idle_schema.json`
- `tools/check_v385_browser_world_encounter_idle_bridge.mjs`
- `.github/workflows/check-v385-browser-world-encounter-idle-bridge.yml`
- `docs/reference/v385-browser-world-encounter-idle-bridge.md`

V3.85 明確不把 `ENCOUNTER_ROLLED(active=true)` 當成 shortcut，因此不會在 battle context 尚未成立時錯誤進入 `in_battle`。成功命中後只保存玩家位置、最新 CEP 與 Idle pending boundary；完整 transient battle payload 仍留在下一層 runtime。

目前 encounter chain 已完成：
`first-route execution → encounter boundary → fixed-C CEP roll → persistent CEP → idle encounter_pending`

下一階段應先閉合現有 battle runtime 的 battle-context input contract，再把 selected Group / generated Enemy roster 接入 `in_battle`，而不是直接在 browser bridge 內重寫 battle engine。

## 2026-10-01 V3.86 Browser Battle Context

V3.86 將 V3.84 generated Enemy roster 接到 fixed-C `BATTLE_CreateVsEnemy()` 的 battle container 拓撲，但仍不重寫 Battle Engine。

新增：
- `src/stoneage_browser_battle_context_runtime.mjs`
- `data/generated/stoneage_browser_battle_context_schema.json`
- `tools/check_v386_browser_battle_context_runtime.mjs`
- `.github/workflows/check-v386-browser-battle-context.yml`
- `docs/reference/v386-browser-battle-context.md`

固定 C 對齊：
- `Side[0]=PLAYER`
- `Side[1]=ENEMY`
- `BATTLE_ENTRY_MAX=10`
- 玩家 slot 0 / bid 0
- default living pet 位於 owner 後第五格，即 slot 5 / bid 5
- Enemy bid = 10 + entry slot
- `BATTLE_CreateVsEnemy()` 最後交換 Enemy Entry[0..4] 與 Entry[5..9]

V3.86 成功條件：
`encounter_pending` → 建立 transient battle context → `BATTLE_STARTED` → `in_battle`

Battle Context 本身不進 Persistent State；只保存 Idle mode 的狀態。Browser controller memory 持有 context，`battle_finished` / `disable` 後清除。

`battleFieldNo` 必須 caller 注入，因 `BATTLE_getBattleFieldNo()` 的完整 map join 尚未閉合；不自行猜場地。

V3.86 仍未執行 turn、AI、status、damage、reward、capture、death settlement。下一階段應先把 battleFieldNo source join 與 existing battle presentation/model input 對齊，再進入真正的 battle turn lifecycle。

## 2026-10-01 V3.87 Browser Battle Entry Initialization

V3.87 在 V3.86 transient Battle Context topology 上，補齊 fixed-C 明確寫出的 Battle / Entry initialization。

EntryInit：
- charaindex = -1（browser 用 transient characterId 表示）
- bid = -1（真正寫入時由 entry slot 計算）
- escape = 0
- getitem[0..2] = -1

BATTLE_CreateBattle：
- use = TRUE
- mode = BATTLE_MODE_INIT
- turn = 0
- dpbattle = 0
- norisk = 0
- flg = 0
- field_att = BATTLE_ATTR_NONE
- att_count = 0

V3.87 不增加新的 battle rule；只補初始化 state，供後續 Battle Turn / Status / AI runtime 直接接手。

新增：
- `data/generated/stoneage_browser_battle_entry_init_schema.json`
- `tools/check_v387_browser_battle_entry_init.mjs`
- `docs/reference/v387-browser-battle-entry-init.md`
- `.github/workflows/check-v387-browser-battle-entry-init.yml`

Persistent State 不儲存完整 Battle Context；battle context 仍由 controller memory 管理，battle finish / disable 後清除。

## 2026-10-01 V3.88 Browser Battle Field Runtime

V3.88 將 fixed-C `BATTLE_getBattleFieldNo(floor,x,y)` 正式接到既有 `src/stoneage_map_runtime.mjs`：

`floor/x/y → tile[0] → MAP_BATTLEMAP/BATTLEMAP2/BATTLEMAP3 → RAND(0,2) → battleFieldNo`

新增：
- `src/stoneage_browser_battle_field_runtime.mjs`
- `data/generated/stoneage_browser_battle_field_schema.json`
- `tools/check_v388_browser_battle_field_runtime.mjs`
- `docs/reference/v388-browser-battle-field-runtime.md`
- `.github/workflows/check-v388-browser-battle-field.yml`

V3.88 的 `BATTLE_FIELD_RESOLVE` 使用 caller-injected `battleFieldRoll` 0..2，並直接消費既有 map runtime 的 `battlemapResolver.candidatesByImageId`，不重新解析 map CSV。

V3.86 `ENCOUNTER_BATTLE_CONTEXT_BUILD` 若未提供手寫 `battleFieldNo`，現在優先走 V3.88 source resolver；只有 source-map 無法解析時才退回既有 `battleFieldNoProvider` compatibility path。

下一階段可把 selected Group / generated Enemy roster / battle field / player + default Pet 的完整 context 交給既有 Battle Model，開始建立 `in_battle` 的回合初始化邊界。

## 2026-10-01 V3.89 Browser Battle Entry Reset

V3.89 在 V3.86/V3.87 Battle Context 上，接入 fixed-C `BATTLE_NewEntry()` 的無條件 actor reset：

- BATTLE_CHARMODE_INIT = 1
- battle flag = 0
- command 1/2/3 = -1
- attack / defence / quick modifiers = 0
- damage absorb / reflect / vanish = 0
- capture modifier = 0
- CHAR_ISATTACKED = 1
- battle watch = 0

這些欄位現在會出現在 transient Battle Context 的 Player / Pet / Enemy entry。

V3.89 不升格 compile-time feature branch（PROFESSION_SKILL / PETSKILL_ACUPUNCTURE / PETSKILL_RETRACE / PETSKILL_BECOMEFOX / PROFESSION_ADDSKILL），避免在 feature closure 未完成時偷開功能。

新增：
- `data/generated/stoneage_browser_battle_entry_reset_schema.json`
- `tools/check_v389_browser_battle_entry_reset.mjs`
- `docs/reference/v389-browser-battle-entry-reset.md`
- `.github/workflows/check-v389-browser-battle-entry-reset.yml`

下一層是 Enemy stat materialization：目前 V3.84 roster 已知道 Enemy ID / TempNo / EnemyBase size，但 Battle Context 的 Enemy HP/MP 尚未由 `ENEMY_createEnemy()` + EnemyBase 計算填入。

## 2026-10-01 V3.90 Browser Enemy Core Stat Materialization

V3.90 將 V3.84 generated Enemy roster 進一步轉成 fixed-C `ENEMY_createEnemy()` 的核心 stat state。

固定 RNG 順序：
1. level：`RAND(ENEMY_LV_MIN, ENEMY_LV_MAX)`
2. 四次 base stat：`RAND(0,4)-2`
3. 十次 allocation：`RAND(0,3)`

共 15 次 caller-injected RNG。

四圍公式：
`((level-1)*E_T_LVUPPOINT + E_T_INITNUM) * allocatedBaseStat`

再套既有 `CHAR_initcharWorkInt()`：
- FIXVITAL / FIXSTR / FIXTOUGH / FIXDEX
- ATTACKPOWER / DEFENCEPOWER / QUICK
- MAXHP

MAXHP：
`floor((VITAL*4 + STR + TOUGH + DEX)*0.01)`

V3.90 也重新對齊 `ENEMY_getRank()`：使用原始 EnemyBase 四圍總和，依 `100/95/90/85/80/0` threshold 得到 rank 0..5。

目前仍刻意未升格：
- `CHAR_getDefaultChar()` 完整 default field join
- `ITEM_equipEffect()` / suit modifier
- enemy style weapon
- `ENEMY_RandomChange()`
- enemy item drops
- compile-time profession / PetSkill branches

新增：
- `src/stoneage_browser_world_encounter_enemy_core_stat_runtime.mjs`
- `data/generated/stoneage_browser_world_encounter_enemy_core_stat_schema.json`
- `tools/check_v390_browser_world_encounter_enemy_core_stat.mjs`
- `docs/reference/v390-browser-enemy-core-stat.md`
- `.github/workflows/check-v390-browser-world-encounter-enemy-core-stat.yml`

下一階段是把 V3.90 materialized core stats 寫入 V3.86 transient Battle Context 的 Enemy entry；之後才能讓 Battle Model 取得實際 HP/四圍，而不再使用 null placeholder。

## 2026-10-01 V3.91 Browser Battle Enemy Core Hydration

V3.91 將 V3.90 Enemy Core Stat Runtime 接入 V3.86 transient Battle Context。

啟用條件：
- `materializeEnemyStats=true`
- 每隻 Enemy 提供 1 個 levelRoll + 4 個 baseStatRolls + 10 個 allocationRolls，共 15 rolls。

Battle Context Enemy entry 現在可取得：
- level
- HP / MaxHP
- VITAL / STR / TOUGH / DEX
- FIXVITAL / FIXSTR / FIXTOUGH / FIXDEX
- Attack / Defence / Quick
- PetRank
- elements / status resist
- sourceCoreStats provenance

V3.91 的 first-route regression 已用 fixed Group 94：
- Enemy 120：Lv2、448/390/331/487、MaxHP 30、rank 5
- Enemy 123：Lv2、611/470/376/658、MaxHP 39、rank 4

MaxMP 仍為 null，因 fixed-C `ENEMY_createEnemy()` 不直接寫 `CHAR_MAXMP`，而完整 `CHAR_getDefaultChar()` default field join 尚未閉合。

新增：
- `data/generated/stoneage_browser_battle_enemy_core_hydration_schema.json`
- `tools/check_v391_browser_battle_enemy_core_hydration.mjs`
- `docs/reference/v391-browser-battle-enemy-core-hydration.md`
- `.github/workflows/check-v391-browser-battle-enemy-core-hydration.yml`

下一階段是 Battle Turn initialization：先閉合 `BATTLE_TurnParam()` / initial WORK fields 與第一回合 Entry order，仍然不直接執行傷害。

## 2026-10-01 V3.92 Browser Battle Turn Initialization

V3.92 將 fixed-C `BATTLE_Init()` → `BATTLE_PreCommandSeq()` 的第一回合 pre-command 邊界接入 transient Battle Context：

- Battle mode：`BATTLE_MODE_BATTLE = 2`
- Actor mode：`BATTLE_CHARMODE_C_WAIT = 2`
- 非 charge actor command 1：`BATTLE_COM_NONE = 0`
- guardian reset：`-1`
- Attack / Defence / Quick 的 modifier：每次乘 `0.8`
- 有 last field 時再加 `modifier * 0.01`
- Player 的 charm modifier 按 fixed-C 會執行兩次衰減

V3.92 是 transient-only：
- 不消耗 RNG
- SurpriseCheck 仍獨立處理
- 不執行 AI / Status / Damage
- 不修改 Persistent State

新增：
- `src/stoneage_browser_battle_turn_runtime.mjs`
- `data/generated/stoneage_browser_battle_turn_init_schema.json`
- `tools/check_v392_browser_battle_turn_runtime.mjs`
- `docs/reference/v392-browser-battle-turn-init.md`
- `.github/workflows/check-v392-browser-battle-turn-init.yml`

下一步可閉合 `BATTLE_SurpriseCheck()` 的 source RNG，再進入真正第一回合的 command collection / enemy AI。

## 2026-10-01 V3.93 Browser Battle Surprise

V3.93 將 fixed-C `BATTLE_SurpriseCheck()` 獨立來源化。

規則：
- 只對 `BATTLE_TYPE_P_vs_E` 有效。
- 讀 Side[0] Player 的 `CHAR_WORKFIXLUCK`。
- `WinFunc != NULL` 時直接回 0。
- 消耗一次 `RAND(1,100)`。
- luck 5：1..20 → result 1。
- luck 4：1..15 → result 1；16 → result 2。
- luck 3：1..10 → result 1；11..12 → result 2。
- luck 2：1..5 → result 1；6..9 → result 2。
- 其他：1..6 → result 2。
- result 1 設 Enemy side 的 `BSIDE_FLG_SURPRISE=1`。
- result 2 設 Player side 的 `BSIDE_FLG_SURPRISE=1`。

`CHAR_WORKFIXLUCK` 屬 transient Work 值；目前 Persistent `player.luck` 不冒充 fixed luck，因此 V3.93 要求 caller 注入 `fixedLuck`。

新增：
- `src/stoneage_browser_battle_surprise_runtime.mjs`
- `data/generated/stoneage_browser_battle_surprise_schema.json`
- `tools/check_v393_browser_battle_surprise_runtime.mjs`
- `docs/reference/v393-browser-battle-surprise.md`
- `.github/workflows/check-v393-browser-battle-surprise.yml`

下一階段是把 surprise result 按 fixed-C 順序放進 Battle Context，再進 V3.92 pre-command / Turn initialization。

## 2026-10-01 V3.94 Browser Battle Initialize

V3.94 將 fixed-C `BATTLE_Init()` 的初始化順序正式串成單一 boundary：

`BATTLE_MODE_BATTLE=2`
→ `BATTLE_SurpriseCheck()`
→ `BSIDE_FLG_SURPRISE`
→ `BATTLE_PreCommandSeq()`
→ `BATTLE_AllCharaCWaitSet()`
→ `BATTLE_TurnParam()`

新增：
- `src/stoneage_browser_battle_initialize_runtime.mjs`
- `data/generated/stoneage_browser_battle_initialize_schema.json`
- `tools/check_v394_browser_battle_initialize_runtime.mjs`
- `docs/reference/v394-browser-battle-initialize.md`
- `.github/workflows/check-v394-browser-battle-initialize.yml`

V3.94 不直接重算 surprise；固定 luck 仍由 V3.93 caller-injected transient Work 值提供。完成後 Battle Context 會同時帶：
- sourceMode = 2
- Surprise side flags
- Actor C_WAIT mode
- command reset
- 第一輪 Attack/Defence/Quick modifier decay
- player charm double-decay

仍不執行 AI、Status、Damage、Reward、Capture、Death。

下一階段是把 Battle Context 接到既有 Battle Model 的 command collection，先處理 `BATTLE_CommandWait()` / 第一回合可操作 actor，再進 Enemy AI。

## 2026-10-01 V3.95 Browser Battle Command Wait

V3.95 將 fixed-C `BATTLE_CommandWait()` 做成 read-only command gate：

- Enemy side 直接 ready。
- Player side 存活 actor 為 `C_WAIT` 時阻塞。
- `C_OK` actor 計入 ready。
- 死亡 actor 略過。
- INIT / RESCUE / WATCHINIT 不阻塞。
- `BATTLECOMMAND_TIME` timeout 以 caller 的 `timeoutExpired` compatibility signal 表示。

新增：
- `src/stoneage_browser_battle_command_wait_runtime.mjs`
- `data/generated/stoneage_browser_battle_command_wait_schema.json`
- `tools/check_v395_browser_battle_command_wait_runtime.mjs`
- `docs/reference/v395-browser-battle-command-wait.md`
- `.github/workflows/check-v395-browser-battle-command-wait.yml`

V3.95 不修改 Battle Context、不消耗 RNG、不執行 AI / Damage。

下一階段才處理 `BATTLE_Command` 的 player command submission，把 `attack/guard/item/pet/change/escape` 等合法 command mapping 接到既有 Battle Model；Enemy AI command 仍維持獨立 source boundary。


## 2026-10-01 V3.96 Browser Player Battle Command

V3.96 將 fixed-C `BattleCommandDispach()` 的核心玩家 command transport 先做成 transient normalization：

- attack → BATTLE_COM_ATTACK
- guard → BATTLE_COM_GUARD
- wait → BATTLE_COM_WAIT
- escape → BATTLE_COM_ESCAPE
- capture → BATTLE_COM_CAPTURE
- pet_in → BATTLE_COM_PETIN
- pet_out → BATTLE_COM_PETOUT
- attack + boomerang weapon → BATTLE_COM_BOOMERANG

成功後寫入 command1/2/3，並將 actor `C_WAIT → C_OK)。

V3.96 尚未執行 status blocking、Item/weapon、PetSkill、profession、target expansion 或 damage。

## 2026-10-01 V3.97 Browser Player Battle Command Preflight

V3.97 在 V3.96 command normalization 上加入 fixed-C `checkErrorStatus()` gate：

- paralysis
- stone
- sleep
- dizzy
- dragnet

這些狀態任一有效時，固定 C 會轉走 `N`，即 `BATTLE_COM_WAIT + BATTLE_CHARMODE_C_OK`；Barrier 不在該函式檢查集合內。

另外修正 Pet command transport：
- `pet_in = -1`
- `pet_out = 0..4`，因 pinned `CHAR_MAXPETHAVE=5`
- battle `targetBid` 仍保持 0..19，與 pet slot 分離

新增：
- `data/generated/stoneage_browser_player_battle_command_preflight_schema.json`
- `tools/check_v397_browser_player_battle_command_preflight.mjs`
- `docs/reference/v397-browser-player-battle-command-preflight.md`
- `.github/workflows/check-v397-browser-player-battle-command-preflight.yml`

V3.97 仍不執行 MP 扣除、ride-pet / standby-pet feature gate、item/magic/PetSkill/profession、實際 attack/capture、target expansion 或 damage。

## 2026-10-01 V3.98 Browser Battle Target Runtime

V3.98 將 fixed-C `BATTLE_TargetCheck()` 接到 browser，建立 read-only basic target resolver。

有效條件：
- bid 0..19
- entry 存在
- battle mode != 0
- `CHAR_ISDIE != TRUE`
- HP > 0
- `CHAR_ISATTACKED == TRUE`
- battle mode != RESCUE

成功輸出：
- `executionTargetBid`
- `targetList=[targetBid,-1]`

無效 target 只標記 `defaultAttackerRequired=true`，不執行 `BATTLE_DefaultAttacker()` 的 RNG。

V3.98 目前仍不做 Bow 多目標、Boomerang table、special skill area、Capture policy 或 `BATTLE_Attack()` damage。

## 2026-10-01 V3.99 Browser Battle Default Target Runtime

V3.99 將 fixed-C `BATTLE_DefaultAttacker()` 接成 read-only browser runtime。

固定順序：
1. 掃指定 side 的 10 個 Entry。
2. 排除不存在的 Entry。
3. 排除 RESCUE。
4. 以 `BATTLE_TargetCheck()` 篩掉無效目標。
5. 無候選時回 `-1`。
6. 有候選時消耗 `RAND(0,candidateCount-1)`。

Browser 使用 caller-injected `defaultTargetRoll`，因此不在 runtime 內藏 RNG。

新增：
- `src/stoneage_browser_battle_default_target_runtime.mjs`
- `data/generated/stoneage_browser_battle_default_target_schema.json`
- `tools/check_v399_browser_battle_default_target_runtime.mjs`
- `docs/reference/v399-browser-battle-default-target-runtime.md`
- `.github/workflows/check-v399-browser-battle-default-target-runtime.yml`

V3.99 仍不修改 Battle Context、不執行 Attack/Damage；下一層再把 resolved target 交給真正的 `BATTLE_Attack()` 前置 boundary。

## 2026-10-01 V4.00 Browser Battle Attack Preflight

V4.00 把 fixed-C `BATTLE_Attack()` 的入口 admission boundary 接上 V3.98/V3.99 target chain：

`requested target → BATTLE_TargetCheck → invalid 時 BATTLE_DefaultAttacker(opposite side) → final target → attacker/target HP gate → 可進 BATTLE_AttackSeq`

V4.00 明確保留 fixed-C 的 DamageReact 語意：attacker 或 target DamageReact > 0 時先把 `iRet=FALSE，但來源仍會進 `BATTLE_AttackSeq()`；本版不把它誤判成完全禁止 Attack。

新增：
- `src/stoneage_browser_battle_attack_preflight_runtime.mjs`
- `data/generated/stoneage_browser_battle_attack_preflight_schema.json`
- `tools/check_v400_browser_battle_attack_preflight.mjs`
- `docs/reference/v400-browser-battle-attack-preflight.md`
- `.github/workflows/check-v400-browser-battle-attack-preflight.yml`

V4.00 仍不執行命中/閃避/Critical RNG、`BATTLE_AttackSeq()`、`BATTLE_DamageCalc()`、Guardian、DamageReact 結算、Status、Death、Reward、Counter；這些保留在後續 source boundary。

## 2026-10-01 V4.01 Browser Battle AttackSeq Prelude

V4.01 將 fixed-C `BATTLE_AttackSeq()` 前三層接成 deterministic browser prelude：

`BATTLE_DuckCheck → BATTLE_GuardianCheck → BATTLE_CriticalCheck`

Duck：
- normal `gKawashiPara=0.02)
- JYUJYUTU `gKawashiPara=0.027)
- `RAND(1,10000) <= per`
- `KAWASHI_MAX_RATE=75%)

Guardian：
- `CHAR_BATTLEFLG_GUARDIAN = 1<<3)
- Guardian 必須存在、存活、flag 有效、未被 source status block
- 投擲武器不觸發 Guardian replacement

Critical：
- `gCriticalPara=0.09)
- Player → non-player defender：DfDex × 0.6
- Pet → Enemy：DfDex × 0.8
- non-player → Player / Enemy → Pet：divisor=10、linear mode
- `RAND(1,10000) < perCri)

V4.01 不修改 HP、不執行 DamageCalc、不套用 counter/status/death/reward，也不自行消耗 hidden RNG。

新增：
- `src/stoneage_browser_battle_attack_seq_prelude_runtime.mjs`
- `data/generated/stoneage_browser_battle_attack_seq_prelude_schema.json`
- `tools/check_v401_browser_battle_attack_seq_prelude.mjs`
- `docs/reference/v401-browser-battle-attack-seq-prelude.md`
- `.github/workflows/check-v401-browser-battle-attack-seq-prelude.yml`

## 2026-10-01 V4.02 Browser Battle Damage Plan

V4.02 將 fixed-C `BATTLE_DamageCalc()` 拆成 read-only deterministic damage plan：

- pinned `version.h` 已定義 `_BATTLE_NEWPOWER`
- defense = FIXTOUGH×0.70 + FIXDEX×0.20 + FIXVITAL×0.10
- 三段基礎 damage branch 與 `D_16=1/16`、`D_8=1/8`、`DAMAGE_RATE=2.0`
- `BATTLE_AttrAdjust()` 的 SAME/UP/DOWN = 1.0/1.5/0.6
- ATTR_MAX=100、D_ATTR=1/10000
- field_att=NONE 時沿 fixed-C default 0.5/0.5，ratio=1

所有 Damage RNG 由 caller 注入；V4.02 不直接修改 HP。

尚未升格的 compile-time / caller-sensitive branch：
- Ride Pet adjust
- MAGIC_SUPERWALL
- NPCENEMY_ADDPOWER
- PETSKILL_REGRET
- EQUIT_NEGLECTGUARD
- PROFESSION_ADDSKILL 四屬結界
- ADD_DEAMGEDEFC
- GuardAdjust
- DamageReact / Counter / Death / Reward

新增：
- `src/stoneage_browser_battle_damage_plan_runtime.mjs`
- `data/generated/stoneage_browser_battle_damage_plan_schema.json`
- `tools/check_v402_browser_battle_damage_plan.mjs`
- `docs/reference/v402-browser-battle-damage-plan.md`
- `.github/workflows/check-v402-browser-battle-damage-plan.yml`

## 2026-10-01 V4.03 Browser Battle Critical Damage Plan

V4.03 接續 V4.01 AttackSeq Prelude 與 V4.02 Damage Plan，升格 fixed-C BATTLE_CriDamageCalc 與 AttackSeq 的後段 read-only settlement。

- 非 Bow critical：base BATTLE_DamageCalc + defencePower × attackerLevel / defenderLevel × 0.5
- Bow critical：保留 critical result，但 damage 仍走普通 BATTLE_DamageCalc，不套 critical bonus
- Guard + 非 confusion：升格 BATTLE_GuardAdjust 的 1–100 分段倍率
- damage < 1：caller 注入 RAND(0,1)
- 最後套用 caller-provided gBattleDamageModyfy，預設 1.0

V4.03 不重新抽 V4.01 的 critical RNG；缺失/超範圍 RNG 會 fail-closed。仍不修改 HP、Persistent State、DamageSub、DamageReact、Counter、Death 或 Reward。

Local regression：V4.02 與 V4.03 checkpoints 均通過。

新增：
- src/stoneage_browser_battle_critical_damage_runtime.mjs
- data/generated/stoneage_browser_battle_critical_damage_schema.json
- tools/check_v403_browser_battle_critical_damage.mjs
- docs/reference/v403-browser-battle-critical-damage.md
- .github/workflows/check-v403-browser-battle-critical-damage.yml

Controller integration：
- ACTION_BATTLE_CRITICAL_DAMAGE_PLAN
- BROWSER_BATTLE_CRITICAL_DAMAGE_RUNTIME_FORMAT
## 2026-10-01 V4.04 Browser Battle DamageReact Plan

V4.04 接續 V4.03 damage result，升格 fixed-C `BATTLE_GetDamageReact()` + `BATTLE_DamageSub()` 的 DamageReact boundary。

- reaction priority：VANISH → ABSORB → REFLECT → TRAP → ACUPUNCTURE
- throw weapon：source 會阻止 REFLECT / TRAP / ACUPUNCTURE，VANISH / ABSORB 不受此條件阻止
- VANISH：damage = 0，消耗 1 次 vanish
- ABSORB：incoming damage 轉成 defender / ride-pet recovery
- REFLECT：damage 轉向 attacker / ride-pet
- TRAP：改用 WORKMODTRAP 的 damage 並轉向 attacker
- ACUPUNCTURE：damage 向上取偶數，先打 defender，再以一半 damage 反打 attacker
- Ride Pet split 保留 fixed-C 的整數計算

V4.04 不修改 HP、不修改 Persistent State、不抽 RNG；狀態消耗只透過 `stateConsumption` 回傳。

新增：
- `src/stoneage_browser_battle_damage_react_runtime.mjs`
- `data/generated/stoneage_browser_battle_damage_react_schema.json`
- `tools/check_v404_browser_battle_damage_react.mjs`
- `docs/reference/v404-browser-battle-damage-react.md`
- `.github/workflows/check-v404-browser-battle-damage-react.yml`

Controller integration：
- `ACTION_BATTLE_DAMAGE_REACT_PLAN`
- `BROWSER_BATTLE_DAMAGE_REACT_RUNTIME_FORMAT`

Local regression：V4.04 checkpoints pass。
## 2026-10-01 V4.05 Browser Battle Counter Plan

V4.05 接續 V4.04，升格 fixed-C `BATTLE_CounterCheck()`、`BATTLE_CounterCalc()` 與 `BATTLE_Counter()` 的 admission / probability boundary。

- pinned `gCounterPara = 0.08`
- Dex/type adjustment 依 fixed-C `BATTLE_CounterCalc()`
- Player：CounterCalc × CounterTbl × 0.1 + FIXLUCK + WORKCOUNTER；pinned `_SUIT_ADDENDUM` 已啟用
- Pet / non-player：使用 CounterCalc，NOGUARD 可再加 caller-provided adjustment
- attacker / defender 任一方 throw weapon → counter false
- attacker command 必須為 ATTACK 或 NOGUARD；ABIO attacker 直接 false
- `RAND(1,10000) <= per × 100`

固定 C 的特殊語意也保留：若 attacker 或 defender 有 DamageReact，`BATTLE_Counter()` 會把 return flag 設為 false，但仍會呼叫 `BATTLE_AttackSeq()`。V4.05 因此同時輸出 `triggered` 與 `sourceReturnFlag`。

反擊實際 damage 不在本版重算；後續沿既有 V4.03 → V4.04 管線，並由 source `BATTLE_Counter()` 再套用 ×0.75、最低 damage 1。

新增：
- `src/stoneage_browser_battle_counter_runtime.mjs`
- `data/generated/stoneage_browser_battle_counter_schema.json`
- `tools/check_v405_browser_battle_counter.mjs`
- `docs/reference/v405-browser-battle-counter.md`
- `.github/workflows/check-v405-browser-battle-counter.yml`

Controller integration：
- `ACTION_BATTLE_COUNTER_PLAN`
- `BROWSER_BATTLE_COUNTER_RUNTIME_FORMAT`
## 2026-10-01 V4.06 Browser Battle Death Plan

V4.06 接續 V4.05 Counter，升格 fixed-C `BATTLE_DefDieType()` 的死亡判定 boundary。

- `CHAR_HP <= 0` → `BCF_DEATH`
- `iRet = FALSE`
- ABIO → `ULTIMATE_1`
- non-player + critical → `RAND(1,100) < 50` 可產生 `ULTIMATE_1`
- `ULTIMATE_2` 沿用前面 `BATTLE_DamageSub()` 的 threshold result
- pinned LER 例外會取消 ultimate knock-away

V4.06 仍然是 read-only decision plan：不設定 `CHAR_ISDIE`、不修改 HP、不結束 Battle、不發 Reward/EXP/Gold、不寫 Persistent State。

新增：
- `src/stoneage_browser_battle_death_runtime.mjs`
- `data/generated/stoneage_browser_battle_death_schema.json`
- `tools/check_v406_browser_battle_death.mjs`
- `docs/reference/v406-browser-battle-death.md`
- `.github/workflows/check-v406-browser-battle-death.yml`

Controller integration：
- `ACTION_BATTLE_DEATH_PLAN`
- `BROWSER_BATTLE_DEATH_RUNTIME_FORMAT`

## 2026-10-01 V4.07 Browser Battle Death Commit

V4.07 接續 V4.06 Death Plan，將 fixed-C battle death 的 state commit boundary 接入 browser battle context：

- `CHAR_ISDIE = 1` → entry `isDie = true`
- `CHAR_DEADCOUNT += 1` → entry `deadCount += 1`
- 保留 V4.06 的 death / ultimate flags 到 battle entry outcome
- 同一目標重複 commit fail-closed
- 只修改 ephemeral Battle Context，不修改 HP、Persistent State、Reward、EXP、Gold，也不提前結束 Battle
- `BATTLE_UltimateExtra()` / `BATTLE_NormalDeadExtra()` 保留為後續 settlement hook

fixed-C 的 `CHAR_ISDIE` 寫入存在多個戰鬥 call-site；V4.07 不假裝把所有技能、復活、特殊死亡分支合併成單一來源，而是先閉合 V4.06 → battle death-state 的共同 boundary。

新增：
- `src/stoneage_browser_battle_death_commit_runtime.mjs`
- `data/generated/stoneage_browser_battle_death_commit_schema.json`
- `tools/check_v407_browser_battle_death_commit.mjs`
- `docs/reference/v407-browser-battle-death-commit.md`
- `.github/workflows/check-v407-browser-battle-death-commit.yml`

Controller integration：
- `ACTION_BATTLE_DEATH_COMMIT`
- `BROWSER_BATTLE_DEATH_COMMIT_RUNTIME_FORMAT`

## 2026-10-01 V4.08 Browser Battle End Plan

V4.08 接續 V4.07 Death Commit，升格 fixed-C BATTLE_OnlyRescue() / BATTLE_Command() 的 battle-end decision：

- 排除 pet，只計 non-pet 且 CHAR_ISDIE == FALSE 的有效成員
- _PETSKILL_LER 路徑下 CHAR_WORK_RELIFE > 0 額外計數
- side 0 count == 0 → winside = 1
- 否則 side 1 count == 0 → winside = 0
- 結束時只輸出 finishMode=finish，不提前執行 BATTLE_FinishSet()
- OnlyRescue cleanup 先以 bid 清單輸出，實際 BATTLE_Exit() 保留到後續 boundary

V4.08 是 read-only plan，不修改 Battle Context、HP、Reward、EXP、Gold 或 Persistent State。

新增：
- `src/stoneage_browser_battle_end_runtime.mjs`
- `data/generated/stoneage_browser_battle_end_schema.json`
- `tools/check_v408_browser_battle_end.mjs`
- `docs/reference/v408-browser-battle-end.md`
- `.github/workflows/check-v408-browser-battle-end.yml`

Controller integration：
- `ACTION_BATTLE_END_PLAN`
- `BROWSER_BATTLE_END_RUNTIME_FORMAT`

## 2026-10-01 V4.09 Browser Battle Finish Commit

V4.09 接續 V4.08 Battle End Plan，升格 fixed-C BATTLE_FinishSet() 的 mode transition：

- battle mode `battle` → `finish`
- sourceMode 2 → BATTLE_MODE_FINISH = 3
- 保存 V4.08 winnerSide / finishReason 到 ephemeral Battle Context
- 重複 finish commit fail-closed
- 不執行 Reward、EXP、Gold、BATTLE_Exit 或 Persistent State

fixed-C BATTLE_FinishSet() 的核心效果只有 BattleArray[battleindex].mode = BATTLE_MODE_FINISH；V4.09 先閉合這個 state boundary，不把 BATTLE_Finish() 的後續結算混進來。

新增：
- `src/stoneage_browser_battle_finish_commit_runtime.mjs`
- `data/generated/stoneage_browser_battle_finish_commit_schema.json`
- `tools/check_v409_browser_battle_finish_commit.mjs`
- `docs/reference/v409-browser-battle-finish-commit.md`
- `.github/workflows/check-v409-browser-battle-finish-commit.yml`

Controller integration：
- `ACTION_BATTLE_FINISH_COMMIT`
- `BROWSER_BATTLE_FINISH_COMMIT_RUNTIME_FORMAT`

## 2026-10-01 V4.10 Browser Battle Profit Route Plan

V4.10 接續 V4.09 Finish Commit，先閉合 fixed-C `BATTLE_GetProfit()` 的結算分流，不提前實作 EXP/Gold/DuelPoint mutation：

- `dpbattle = 1` → `BATTLE_GetDuelPoint`
- `dpbattle = 0` → `BATTLE_GetExpGold`
- 缺失或非 0/1 → fail-closed
- V4.10 read-only；不修改 Battle Context、EXP、Gold、DuelPoint 或 Persistent State

這個拆分是刻意的：fixed-C `BATTLE_GetProfit()` 自身只是 route selector，真正的 EXP/Gold/DuelPoint 行為在下一層函式。

新增：
- `src/stoneage_browser_battle_profit_route_runtime.mjs`
- `data/generated/stoneage_browser_battle_profit_route_schema.json`
- `tools/check_v410_browser_battle_profit_route.mjs`
- `docs/reference/v410-browser-battle-profit-route.md`
- `.github/workflows/check-v410-browser-battle-profit-route.yml`

Controller integration：
- `ACTION_BATTLE_PROFIT_ROUTE_PLAN`
- `BROWSER_BATTLE_PROFIT_ROUTE_RUNTIME_FORMAT`

## 2026-10-01 V4.11 Browser Battle DuelPoint Plan

V4.11 接續 V4.10 Profit Route Plan，閉合 fixed-C `BATTLE_GetDuelPoint()` 的純計算 boundary。

- 只接受 player-side 的 player entry；Pet fail-closed
- 不檢查 `CHAR_ISDIE`，忠實保留 fixed-C 行為
- `dpadd = CHAR_WORKGETEXP`
- `dpnow = CHAR_DUELPOINT + dpadd`
- `dpnow` clamp 到 `0..100000000`
- V4.11 只輸出 plan，不寫 Persistent State、不發 UI、不做 DB update

固定源 `CHAR_MAXDUELPOINT = 100000000`、`DUELPOINT_RATE = 0.1` 已一併保留；`DUELPOINT_RATE` 在 `BATTLE_GetDuelPoint()` 本身不使用，而是在其他 PvP / loss redistribution call-site 使用，因此不把 10% 搶分規則誤套到這裡。

新增：
- `src/stoneage_browser_battle_duelpoint_runtime.mjs`
- `data/generated/stoneage_browser_battle_duelpoint_schema.json`
- `tools/check_v411_browser_battle_duelpoint.mjs`
- `docs/reference/v411-browser-battle-duelpoint.md`
- `.github/workflows/check-v411-browser-battle-duelpoint.yml`

Controller integration：
- `ACTION_BATTLE_DUELPOINT_PLAN`
- `BROWSER_BATTLE_DUELPOINT_RUNTIME_FORMAT`

## 2026-10-01 V4.12 Browser Battle DuelPoint Commit

V4.12 將 V4.11 的 read-only DuelPoint plan 接進 canonical Persistent State，形成真正的 settlement commit boundary。

- 只接受 ready V4.11 plan 與 side-0 player entry
- Persistent State 的當前 DuelPoint 必須與 plan snapshot 完全一致；不一致即 stale-plan fail-closed
- 只寫入 `state.player.duelPoint = nextDuelPoint`
- 保留 staged `workGetExp`，不自行猜測 reset 時機
- 首次 transaction 只增加一次 revision，並在 `runtimeMeta.battleDuelPointTransactions` 記錄 transactionId
- 重複 transactionId 走 idempotent no-op，不重複增加 DuelPoint 或 revision
- 固定 C 的 `lssproto_RD_send`、`CHAR_send_DpDBUpdate`、`CHAR_send_DpDBUpdate_AddressBook` 保留為 browser adapter side-effect boundary，headless runtime 不假裝執行 socket / DB
- Persistent State validator 同步加入 `duelPoint 0..100000000` cap

新增：
- `src/stoneage_browser_battle_duelpoint_commit_runtime.mjs`
- `data/generated/stoneage_browser_battle_duelpoint_commit_schema.json`
- `tools/check_v412_browser_battle_duelpoint_commit.mjs`
- `docs/reference/v412-browser-battle-duelpoint-commit.md`
- `.github/workflows/check-v412-browser-battle-duelpoint-commit.yml`

Controller integration：
- `ACTION_BATTLE_DUELPOINT_COMMIT`
- `BROWSER_BATTLE_DUELPOINT_COMMIT_RUNTIME_FORMAT`

下一個 battle settlement boundary：fixed-C PvE 的 `BATTLE_GetExpGold()`，接 player EXP、pet EXP 與 battle item settlement；一般 PvE Gold 不從這裡憑空生成。

## 2026-10-01 V4.13 Browser Battle EXP Plan

V4.13 將 fixed-C `BATTLE_GetExp()` 拆成 read-only EXP apply plan：
- `CHAR_WORKGETEXP` 先限制到 `0..1,000,000,000`
- 可選 item EXP modifier 使用 C int truncation；目前 runtime 預設 0
- `_GET_BATTLE_EXP` 直接乘 current `setup.cf battleexp=100`
- `CHAR_MAXUPLEVEL=200` 以上不再增加 EXP
- `CHAR_AddMaxExp` 最終把 `CHAR_EXP` cap 在 `1,224,160,000`
- player 與 live pet 分開計算；不重新猜「Pet = Player EXP ×1.5」
- V4.13 只出 plan，不寫 Persistent State、不做 level-up、不搬 battle item、不生成 Gold

新增：
- `src/stoneage_browser_battle_exp_runtime.mjs`
- `data/generated/stoneage_browser_battle_exp_schema.json`
- `tools/check_v413_browser_battle_exp.mjs`
- `docs/reference/v413-browser-battle-exp.md`
- `.github/workflows/check-v413-browser-battle-exp.yml`

Controller integration：
- `ACTION_BATTLE_EXP_PLAN`
- `BROWSER_BATTLE_EXP_PLAN_RUNTIME_FORMAT`

## 2026-10-01 V4.14 Browser Battle Level-Up Plan

V4.14 接續 V4.13 的 EXP plan，依 fixed-C `CHAR_LevelUpCheck()` / `CHAR_HandleExp()` 將 current-level EXP 逐門檻消耗，並把後續副作用標記出來：
- fixed source `gmsv/data/exp.txt` 由 `LoadEXP()` 載入，實際 loader cap 160
- 現行 `setup.cf`: `LEVEL=140`, `CHARTRANS=5`, `PETTRANS=-1`
- non-trans player 正常等級 gate 140；轉生達 5 後可繼續走 EXP table boundary
- player 每升一級 DuelPoint 增加 `newLevel × 10`
- player 一場只在 `UpLevel>0` 時加一次 Charm +2，cap 100；Skill Point `+3 × UpLevel`
- pet 逐級輸出 `CHAR_PetLevelUp` 與 `CHAR_PetAddVariableAi(AI_FIX_PETLEVELUP)` 次數，真正 stat/RNG growth 暫不猜測
- V4.14 仍是 read-only plan，不寫 Persistent State / battle context / UI / DB

新增：
- `data/generated/stoneage_exp_table.json`
- `src/stoneage_browser_battle_levelup_runtime.mjs`
- `data/generated/stoneage_browser_battle_levelup_schema.json`
- `tools/check_v414_browser_battle_levelup.mjs`
- `docs/reference/v414-browser-battle-levelup.md`
- `.github/workflows/check-v414-browser-battle-levelup.yml`

Controller integration：
- `ACTION_BATTLE_LEVELUP_PLAN`
- `BROWSER_BATTLE_LEVELUP_PLAN_RUNTIME_FORMAT`

下一步：`BATTLE_LEVELUP_COMMIT`，只提交已驗證的 player EXP/level/DuelPoint/skill/charm 與 pet EXP/level；`CHAR_PetLevelUp()` stat growth 另建 source-backed boundary，battle item transfer 再接續。

## 2026-10-01 V4.15 Browser Battle Pet Growth Plan

V4.15 接續 V4.14 的 level-up plan，依 fixed-C `CHAR_PetLevelUp()` 產生 deterministic growth plan：

- `CHAR_ALLOCPOINT` 解成 VITAL/STR/TOUGH/DEX 四個 byte
- 每個 Pet level-up 精確消耗 10 次 `RAND(0,3)` 分配點數
- 再依 `CHAR_PETRANK` 消耗 1 次 inclusive rank RNG；Rank 0..5 範圍為 450–500、470–520、490–540、510–560、530–580、550–600
- 四項 stat 增量按照 C `float` 計算後再 cast 為 int，最後才加到現有 Pet raw stats
- 同一次 `CHAR_PetLevelUp()` 讀取相同的 stored `CHAR_ALLOCPOINT`；此函式本身不重寫 `CHAR_ALLOCPOINT`
- RNG 必須作為 evidence 傳入；V4.15 不在 plan/commit 階段重新抽 RNG
- `CHAR_complianceParameter()` 仍 deferred，不自行猜 HP/MP/derived combat
- Legacy Pet 缺少 `allocPointPacked` / `petRank` / raw stats 時 fail-closed

另外 starter-pet runtime 現在保留：
- `allocPointPacked`
- `serverStats`
- `serverProgression=true`

新增：
- `src/stoneage_browser_battle_pet_growth_runtime.mjs`
- `data/generated/stoneage_browser_battle_pet_growth_schema.json`
- `tools/check_v415_browser_battle_pet_growth.mjs`
- `docs/reference/v415-browser-battle-pet-growth.md`
- `.github/workflows/check-v415-browser-battle-pet-growth.yml`

Controller integration：
- `ACTION_BATTLE_PET_GROWTH_PLAN`
- `BROWSER_BATTLE_PET_GROWTH_PLAN_RUNTIME_FORMAT`

下一步：`BATTLE_LEVELUP_COMMIT`，把 V4.13/V4.14/V4.15 已驗證的 player/Pet state mutation 一次性提交，並保留 transaction idempotency。

## 2026-10-01 V4.16 Browser Battle Level-Up Commit

V4.16 將 V4.13/V4.14/V4.15 的已驗證 plan 接進 canonical Persistent State：

- 提交前完整檢查 Player EXP/Level、DuelPoint、Skill Point、Charm snapshot
- 每個 Pet 的 EXP/Level 與 V4.15 raw-stat snapshot 必須一致
- Player 與 Pet 所有變更在同一個 cloned state 中提交
- 首次提交只增加一次 `revision`
- `runtimeMeta.battleLevelUpTransactions[transactionId]` 提供 idempotency
- 重送相同 transactionId 即 no-op
- stale snapshot / revision conflict fail-closed
- V4.15 RNG evidence 不在 commit 階段重新抽
- `CHAR_complianceParameter()` 的 derived HP/MP/combat side effect 保持獨立 deferred boundary

新增：
- `src/stoneage_browser_battle_levelup_commit_runtime.mjs`
- `data/generated/stoneage_browser_battle_levelup_commit_schema.json`
- `tools/check_v416_browser_battle_levelup_commit.mjs`
- `docs/reference/v416-browser-battle-levelup-commit.md`
- `.github/workflows/check-v416-browser-battle-levelup-commit.yml`

Controller integration：
- `ACTION_BATTLE_LEVELUP_COMMIT`
- `BROWSER_BATTLE_LEVELUP_COMMIT_RUNTIME_FORMAT`

下一步：BattleGet item settlement，消費已由 death-credit 階段決定的 `getitem` / battle item pool；不重新抽 carried-item RNG，並保持 fixed-C 的背包滿格／釋放 existing-item 行為。
## 2026-10-01 V4.17 Browser Battle Item Plan

V4.17 依 fixed-C `BATTLE_GetExpGold()` 把已決定的 `GETITEM_MAX=3` carried item 做 read-only settlement plan：
- 依 getitem 0..2 順序掃描 existing item index
- 只接受 canonical item runtime 中 `owner=enemy:*` 的 tracked existing item
- 玩家背包使用 9..23 的第一個空格
- 背包中途滿格後，後續 item 標為 source-equivalent discard
- 不重新抽 carried-item RNG、不重新建立 Item

新增：
- `src/stoneage_browser_battle_item_runtime.mjs`
- `data/generated/stoneage_browser_battle_item_schema.json`
- `tools/check_v417_browser_battle_item.mjs`
- `docs/reference/v417-browser-battle-item.md`
- `.github/workflows/check-v417-browser-battle-item.yml`

Controller integration：
- `ACTION_BATTLE_ITEM_PLAN`
- `BROWSER_BATTLE_ITEM_PLAN_RUNTIME_FORMAT`

## 2026-10-01 V4.18 Browser Battle Item Commit

V4.18 將 V4.17 accepted/discarded plan 寫入 Persistent State：
- accepted existing item 轉成 player ownership 並放進規劃好的 player backpack slot
- inventory-full item 釋放 existing runtime item，對應 `ITEM_endExistItemsOne()`
- revision 只增加一次
- `runtimeMeta.battleItemTransactions[transactionId]` 提供 idempotency
- duplicate transactionId no-op
- stale revision、missing item、非 enemy ownership、occupied target slot 全部 fail-closed
- 不重新抽 RNG、不生成新 Item、不偽造 Gold
- transient battle `getitem[i]=-1` 只留在 battle lifecycle side effect，不寫成 player inventory 狀態

新增：
- `src/stoneage_browser_battle_item_commit_runtime.mjs`
- `data/generated/stoneage_browser_battle_item_commit_schema.json`
- `tools/check_v418_browser_battle_item_commit.mjs`
- `docs/reference/v418-browser-battle-item-commit.md`
- `.github/workflows/check-v418-browser-battle-item-commit.yml`

Controller integration：
- `ACTION_BATTLE_ITEM_COMMIT`
- `BROWSER_BATTLE_ITEM_COMMIT_RUNTIME_FORMAT`

Battle settlement 已從 V4.01 一路閉合到 V4.18；下一段應處理外層 battle lifecycle / Exit 與 server-derived compliance，而不是再複製同一條 reward mutation。

## 2026-10-01 V4.19 Browser Battle Compliance Plan

V4.19 將 `CHAR_complianceParameter()` 的「已能由目前 browser state + 固定來源直接證明」部分獨立成 read-only plan：

- Player 使用既有創角／source derivation 的 point-unit 公式：
  - `FIXSTR = STR + TOUGH*0.1 + VITAL*0.1 + DEX*0.05`
  - `FIXTOUGH = TOUGH + STR*0.1 + VITAL*0.1 + DEX*0.05`
  - `FIXDEX = DEX`
  - `MaxHP = VITAL*4 + STR + TOUGH + DEX`
- Pet 使用 existing Enemy/Pet source-derived stored-integer 轉換：
  - `FIXSTR = trunc(STR*0.01 + TOUGH*0.001 + VITAL*0.001 + DEX*0.0005)`
  - `FIXTOUGH = trunc(TOUGH*0.01 + STR*0.001 + VITAL*0.001 + DEX*0.0005)`
  - `FIXDEX = trunc(DEX*0.01)`
  - `MaxHP = trunc((VITAL*4 + STR + TOUGH + DEX)*0.01)`
- plan 只讀 current Persistent State，不抽 RNG、不寫 Persistent State、不改 Battle Context。
- Legacy Pet 缺少 source-closed raw stats 時 fail-closed。
- `CHAR_MAXMP / CHAR_getDefaultChar`、HP/MP 實際 mutation、equipment/suit/profession/feature branch 與 network/status send 都維持 deferred，不猜。

新增：
- `src/stoneage_browser_battle_compliance_runtime.mjs`
- `data/generated/stoneage_browser_battle_compliance_schema.json`
- `tools/check_v419_browser_battle_compliance.mjs`
- `docs/reference/v419-browser-battle-compliance.md`
- `.github/workflows/check-v419-browser-battle-compliance.yml`

Controller integration：
- `ACTION_BATTLE_COMPLIANCE_PLAN`
- `BROWSER_BATTLE_COMPLIANCE_PLAN_RUNTIME_FORMAT`

下一步：`BATTLE_COMPLIANCE_COMMIT`，只提交 source-closed derived fields；MaxMP 與特殊 compliance branches 不在沒有新證據時硬補。

## 2026-10-01 V4.20 Browser Battle Compliance Commit

V4.20 將 V4.19 的 source-closed derived plan 接進 canonical Persistent State，但只提交目前 schema 與來源都能安全證明的 `maxHp`：

- Player：寫入 `state.player.maxHp`
- Pet：寫入對應 `pet.maxHp`
- 不修改目前 `hp`、`mp`、`maxMp`
- 不寫未被 canonical schema 定義的 `serverCombat` persistent object
- transactionId + expectedRevision + source-stat snapshot 全部驗證
- 首次 commit revision 只增加一次
- duplicate transactionId idempotent no-op
- stale Player/Pet stat snapshot fail-closed
- 不使用 RNG

仍 deferred：
- `CHAR_MAXMP / CHAR_getDefaultChar`
- compliance 後 HP clamp / mutation 的精確時點
- `Other_DefcharWorkInt` equipment / suit / profession / feature branch
- network/status send

新增：
- `src/stoneage_browser_battle_compliance_commit_runtime.mjs`
- `data/generated/stoneage_browser_battle_compliance_commit_schema.json`
- `tools/check_v420_browser_battle_compliance_commit.mjs`
- `docs/reference/v420-browser-battle-compliance-commit.md`
- `.github/workflows/check-v420-browser-battle-compliance-commit.yml`

Controller integration：
- `ACTION_BATTLE_COMPLIANCE_COMMIT`
- `BROWSER_BATTLE_COMPLIANCE_COMMIT_RUNTIME_FORMAT`

下一步：回到 fixed-C 外層 battle lifecycle，處理 finish 後 `BATTLE_Exit()` 等 battle entry cleanup 與 Idle/World return boundary，不把 transient battle context 永久留在 world state。

## 2026-10-01 V4.22 Browser Battle Player Exit State Plan / Commit

V4.22 closes the remaining Browser-to-Persistent-State gap for the final Player HP/MP result, while keeping the existing V4.21 Pet cleanup boundary intact.

Fixed-C evidence:
- `BATTLE_Exit()` final player cleanup clears the death state and sets a dead Player's HP to 1.
- Existing `stoneage_idle_simulation.mjs` already treats the finished Battle Result Player HP/MP snapshot as battle-runtime output before Save.

Browser runtime:
- `BATTLE_PLAYER_EXIT_PLAN` accepts only finish-mode Battle Context and explicit `settlementComplete=true`.
- side-0 `bid=0` Player HP/MP are read from the transient Battle Context.
- live Player keeps the battle HP/MP snapshot;
- Player with fixed-C `CHAR_ISDIE` set commits HP 1 and the battle MP snapshot; an HP<=0 snapshot without the death flag is not independently promoted to the death-heal rule.
- no new damage, reward, EXP, Gold, RNG, or death-recovery policy is introduced.

Commit:
- validates transactionId, expectedRevision and Persistent Player HP/MP snapshot;
- mutates only `state.player.hp` / `state.player.mp`;
- revision increments once;
- duplicate transactionId is idempotent;
- stale HP/MP plans fail-closed.

同時修正一個 Controller lifecycle 問題：`IDLE_EVENTS.BATTLE_FINISHED` 只能把 Idle state 由 `in_battle → settlement`，不能提前清掉 memory-held Battle Context。Final Battle Context teardown 由 V4.21 `BATTLE_EXIT_COMMIT` 擁有，確保 Finish → Settlement → Player Exit State → Pet Exit 的順序完整。

Lifecycle 現在為：
`Finish Commit → IDLE battle_finished → settlement → reward/other commits → V4.22 Player Exit State Commit → V4.21 Pet Exit Plan/Commit → clear Battle Context`

## 2026-10-01 V4.24 Battle Settlement Receipt Barrier

目前 `IDLE_EVENTS.REWARD_APPLIED` 原本只要求 `supplyRequired` boolean，仍可能在沒有真正 reward/EXP transaction commit 的情況下提前進入 `MOVING`。V4.24 將這個 boolean claim 改成可驗證 receipt：

- Finish Commit 記錄本場 `settlementStartRevision`。
- DuelPoint / LevelUp / Item transaction commit 都記錄 `revisionBefore/revisionAfter`。
- 普通 live PVE：`dpbattle=1` 必須存在本場 DuelPoint transaction；否則必須存在本場 LevelUp/EXP transaction。
- 若 live Player 仍有 carried item slots，必須有本場 Item transaction。
- 每個 transaction 的 `revisionAfter` 必須大於 `settlementStartRevision` 且不晚於 receipt 建立前的 current revision，因此上一場的 transaction 不能冒充本場。
- Controller 在 Battle Context 存在時，`IDLE REWARD_APPLIED` 沒有 matching settlement receipt 就 fail-closed。
- Receipt 自己是一個 idempotent Persistent-State commit；成功後才允許 Idle 由 `settlement → moving`。

這不改 fixed-C reward 數值，只把 Browser 分離式 settlement 接合從「呼叫端宣告」提升成可驗證的 transaction window contract。

## 2026-10-01 V4.23 Browser Battle Exit Transient Cleanup Contract

本版把 fixed-C `BATTLE_Exit()` 的最後 transient cleanup 明確固定，但不把 Server WorkInt / network output 變成 Persistent State：

- Player transient：`BATTLE_CHARMODE_FINAL`、Battle Index `-1`、`BATTLE_BadStatusAllClr`、`CHAR_complianceParameter`。
- Pet transient：非 Mail Pet 才進 cleanup；Battle Mode `NONE`、Battle Index `-1`、bad-status clear、compliance。
- Ride Pet：`CHAR_WORKPETFALL` / `CHAR_RIDEPET` 的離場重置維持 source evidence，但目前 canonical Persistent State 沒有 source-closed ride state，因此不新增 `ridePetId`。
- BecomePig：fixed-C 在條件編譯下會恢復 base image；目前 canonical Persistent State 沒有足夠 image/BecomePig lifecycle schema，因此不偽造 persistent field。
- network status send 不進 Persistent State。

V4.23 的 closure owner 仍是 V4.21 final-exit teardown：commit 成功後清除 memory-held Battle Context。新增 audit、regression 與 workflow，避免未來把 transient cleanup 重複實作成存檔資料。

## 2026-10-01 V4.22 Battle Finish Special-Hook Audit

固定 C 的 `BATTLE_Finish()` 不是單一無條件流程。普通世界隨機遭遇透過 `lssproto_EN_recv → BATTLE_CreateVsEnemy(...,0,-1)`，不注入 `WinFunc`；NPC Enemy 則會由 `npc_npcenemy.c` 明確注入 `NPC_NPCEnemy_Dying`。PVP 另有 `PkFunc`，`DANTAI` 另有 `BATTLE_DpCalc`，而 linked `pNext` battle containers 也有專用 teardown。

因此目前 first-idle PVE Browser closure 只宣告 ordinary world encounter path，不自動註冊 NPC WinFunc、PVP PkFunc、DANTAI 或 synthetic linked battle。證據固定於 `data/generated/stoneage_battle_finish_hook_audit.json`，並由 `tools/check_v422_battle_finish_hook_audit.mjs` 回歸。

## 2026-10-01 V4.21 Browser Battle Exit Closure Regression

V4.21 不新增新的 Battle 規則；本輪補強的是最後一段 lifecycle contract：

- `BATTLE_Exit` commit 必須再次確認 `settlementComplete=true`，避免未完成 reward / settlement 的 fabricated plan 越過 final-exit gate。
- 新增 Controller regression，實際走 `encounter_pending → in_battle → settlement → moving`，再由 `BATTLE_EXIT_PLAN → BATTLE_EXIT_COMMIT` 完成 dead-Pet `HP 0 → 1` cleanup。
- regression 同時確認成功 Exit commit 後 memory-held Battle Context 被清除、Persistent State 不保存 `battleContext`、duplicate transactionId 維持 idempotent no-op。
- 不新增 synthetic world teleport、不把 fixed-C 未證明的 player defeat heal / network side effects 變成 Browser rule。

這一輪仍維持 V4.21 版本線；下一個版本只有在找到新的 source-backed battle boundary 後才建立，不用版本號掩蓋純測試／contract hardening。

## 2026-10-01 V4.21 Browser Battle Exit Plan / Commit

V4.21 接回固定-C 的整場 `BATTLE_Exit` 最終 Pet cleanup，與中途 `battlePetOutIds` 退場明確分離。

### V4.21 Exit Plan

- 只接受已進入 `finish` / `BATTLE_MODE_FINISH=3` 的 Battle Context。
- 呼叫端必須明確提供 `settlementComplete=true`，避免在 EXP / Item / 其他 reward 尚未提交前提早 teardown。
- 掃描完整 `state.pets.petBox`，不是只掃 active/team。
- 持有 Pet 若 `hp <= 0`，建立 `hp -> 1` 的 source-backed cleanup plan。
- alive Pet 不修改。
- Player HP/MP 不在本版處理；中途 LostEscape / Ultimate 也不提前回血。
- Plan 不修改 Persistent State、Battle Context，也不抽 RNG。

### V4.21 Exit Commit

- 驗證 transactionId、revision、每一隻 planned Pet 的 HP snapshot。
- 只把 planned dead Pet 寫成 HP 1。
- activePetId 保持原值，不因 HP 恢復而自動重新啟用。
- revision 只增加一次；duplicate transactionId 為 idempotent no-op。
- stale Pet HP / missing Pet / 非死亡 Pet 在 commit 時 fail-closed。
- Controller 在成功的 final exit commit 後才清除 memory-held Battle Context；Persistent State 不保存 transient battle context。
- 不處理玩家戰敗回村補滿 HP/MP、BecomePig、network/status send 等尚未在這個 boundary 完整閉合的效果。

新增：
- `src/stoneage_browser_battle_exit_runtime.mjs`
- `src/stoneage_browser_battle_exit_commit_runtime.mjs`
- `data/generated/stoneage_browser_battle_exit_schema.json`
- `data/generated/stoneage_browser_battle_exit_commit_schema.json`
- `tools/check_v421_browser_battle_exit.mjs`
- `tools/check_v421_browser_battle_exit_commit.mjs`
- `docs/reference/v421-browser-battle-exit.md`
- `docs/reference/v421-browser-battle-exit-commit.md`
- `.github/workflows/check-v421-browser-battle-exit.yml`

Controller integration：
- `ACTION_BATTLE_EXIT_PLAN`
- `ACTION_BATTLE_EXIT_COMMIT`
- `BROWSER_BATTLE_EXIT_PLAN_RUNTIME_FORMAT`
- `BROWSER_BATTLE_EXIT_COMMIT_RUNTIME_FORMAT`

Battle outer lifecycle 現在形成：
`Finish Commit → Reward/EXP/Item/Compliance Commit → Exit Plan → Exit Commit → clear Battle Context`

下一段再處理 Idle `SETTLEMENT → MOVING` 的正式 reward-applied/teardown 接合，以及仍未閉合的 `BATTLE_Finish()` 特殊分支；不提前恢復 playable HTML。
