# V3.66 Browser Idle route bridge

更新日期：2026-09-30

V3.66 將 `data/generated/stoneage_first_idle_route_catalog.json` 接到唯一 `stoneage_browser_state_controller.mjs`。

## 已接通

Browser Controller 新增：
- `IDLE_LIST_ROUTES)：只讀列出 source-backed eligible route variants。
- `IDLE_ENABLE)：驗證 route variant 後，以 V3.65 `commitIdleEvent(ENABLE)` 寫入 Persistent State。
- `IDLE_EVENT)：把有限的 Idle state-machine events 送進同一個 persistent transaction boundary。

目前允許的 browser state events 是 disable、move_tick、encounter_rolled、battle_started、battle_finished、reward_applied、supply_required、supply_done、player_dead、revive_ready。

## 故意不做的事

V3.66 不自動移動玩家、不抽 encounter RNG、不計算 Battle result、不直接套用 reward、不決定補給、不做捕捉、不處理死亡復活 policy，也不執行 offline reward accrual。

其中 `BATTLE_FINISHED`、`REWARD_APPLIED` 等只是 state-machine boundary event；真正的 battle result 與 reward transaction 仍由既有 simulation/runtime 提供，避免 Browser Controller 偷造第二套戰鬥引擎。

## Route eligibility

只接受 first-idle-route-catalog 中 `usableLandingCount > 0` 且 route 不是 `source_blocked_before_portal` 的 variant。目前 catalog 有 8 variants，其中 6 個符合 eligible contract；4000→200 的兩個 variants 仍因 pinned-source movement blocker 被拒絕。

## Transaction / save

每次成功 Idle browser event 都經 `commitIdleEvent()`：
`Persistent State validate → transitionIdle → Persistent State sync → commitSave → Save Envelope verify`。

expectedRevision 預設採目前 state revision；stale revision 直接 fail-closed。這跟 NPC、ItemShop、SavePoint 共用同一 canonical transaction boundary。
