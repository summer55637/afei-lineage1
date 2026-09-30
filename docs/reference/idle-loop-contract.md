# Idle Loop Contract

更新日期：2026-09-30

Idle Loop 是最終單機放置版的產品層。它只定義流程 orchestration，不重新計算 fixed-C battle result。

## State machine

| state | 意義 | 下一步來源 |
| --- | --- | --- |
| disabled | 掛機未啟動 | enable / offline_resume |
| moving | 依既定 route 移動 | move_tick |
| encounter_pending | 已到 encounter boundary，等待 source encounter result | encounter_rolled |
| in_battle | 已建立 battle runtime context | battle_finished |
| settlement | battle result 已產生，等待 reward transaction | reward_applied |
| supply_check | 戰鬥後檢查補給／回復／路線續行 | supply_done |
| dead | 玩家死亡邊界 | revive_ready / disable |
| offline_resume | 離線進度恢復處理 | save_committed |

## Boundary rule

Encounter target 與 map path 已由 fixed-C source closure 提供；Idle Loop 不自己改 encounter probability、enemy group 或 battle damage。

Battle 完成後只接受 battle result / reward transaction。presentation 不應重新計算結果。

補給、逃跑、捕捉、自動換寵、背包滿處理等目前仍是 product-policy slots；在沒有 fixed-C evidence 的地方保持 policy object，不把方便的遊戲設計硬寫成 source parity。

## Offline rule

offline resume 只負責把持久狀態重新交回 route loop。實際離線可累積什麼收益、最多累積多久、死亡是否中斷、背包滿怎麼處理，必須另建立明確 product policy，不偷渡成 fixed-C 規則。

## Runtime linkage

Persistent State Schema 提供 world.position、idle、battleSettings、pets、inventory 等持久容器；Idle Loop 只操作流程狀態與 pending transaction，不直接依賴 UI DOM。

Regression：tools/check_idle_loop_contract.mjs
Runtime：src/stoneage_idle_loop.mjs
Generated contract：data/generated/stoneage_idle_loop_contract.json
