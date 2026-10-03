# V4.45 Browser Battle StatusSeq runtime

更新日期：2026-10-03

本版本把 pinned Fixed-C 的「角色輪到行動前執行 BATTLE_StatusSeq」正式接進目前的 browser battle context runtime，不復活舊版 game.js，也不重建另一套 battle engine。

## 已接入

六個目前列為核心 StatusChange 的狀態：

- 60 / 61 → poison
- 80 → stone
- 90 → confusion
- 100 → drunk
- 110 → sleep
- paralysis 以固定 C 的普通異常狀態欄位處理；狀態攻擊命中公式另保留 source-backed special branch。

每個 actor 的狀態處理現在遵循：

1. 先讀取該 actor 回合開始前的狀態。
2. 以回合開始前狀態決定本回合是否被禁止行動。
3. 遞減狀態計數。
4. poison 在遞減後仍 >0 時執行固定 C 的非致死毒傷公式。
5. confusion 在仍有效時先抽 1–100；<=80 時再依固定 C 的 side / position probe 強制成普通攻擊並設定目標。
6. paralysis / sleep / stone 即使本回合倒數後歸零，仍維持「本回合不能行動」，於本回合結束狀態才清除。
7. drunk 歸零時依固定 C：無騎寵則 QUICK ×2；明確提供騎寵 QUICK 時改為加上騎寵 QUICK；缺少騎寵 QUICK 則保留 pending，不猜。

## Status application

同時提供 source-backed battleStatusApply（turn+1）及 battleStatusApplyRaw（exact turn），並提供 battleStatusChance / applyStatusChangeHit 供 attack/status action runtime 共用。

命中率公式以 pinned BATTLE_StatusAttackCheck() 為來源，保留：
- target 已有異常時拒絕重疊。
- paralysis 的 20 - resist 特殊公式。
- 其他狀態的 level / Bai / range / luck / resist / vitality-share penalty。
- per > 80 的固定上限。
- RAND(1,100) < per 的 source 邊界。

## Runtime boundary

這一版完成的是「StatusSeq 每角色回合入口」與六種核心普通 StatusChange 的可執行語義。

尚未把所有職業技能、MagicStatus、SARS、MYSKILL 等額外 WorkInt 狀態全部搬入此模組；那些仍由各自 source-backed runtime 負責，避免把不同 Fixed-C phase 混成一個 generic status engine。

Persistent State 不在本 action 內直接修改；battle result / death settlement 仍由既有 transaction layer 負責。

Machine-readable regression：
tools/check_v445_browser_battle_status_runtime.mjs

Runtime：
src/stoneage_browser_battle_status_runtime.mjs

Integration：
src/stoneage_browser_battle_turn_runtime.mjs
