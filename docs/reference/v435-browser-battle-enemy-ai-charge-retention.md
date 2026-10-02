# V4.35 Browser Battle Enemy AI Charge Retention

更新日期：2026-10-02

V4.35 對齊 Fixed-C `BATTLE_ai_all()` 對 `BATTLE_IsCharge()` 的處理：Enemy 已處於蓄力／EarthRound 保留命令時，AI pass 不重新選擇 action。

## 行為

- 保留命令：`BATTLE_COM_S_CHARGE`（1005）、`BATTLE_COM_S_EARTHROUND0`（1009）、`BATTLE_COM_S_EARTHROUND1`（1010）。
- 這三種命令在 Enemy AI pass 中直接保留原 COM1／COM2，僅把 entry mode 設為 C_OK。
- 蓄力辨識優先於 Surprise；即使該側有 Surprise flag，也不重抽或覆寫蓄力命令。
- 不消耗 action／target RNG，也不要求該 actor 具備新的 AI profile。
- 非蓄力 Enemy 仍照 V4.29–V4.34 的 AI、target、dead-entry 與 can-move 規則處理。

本版只處理命令保留，不自行倒數蓄力、不執行 EarthRound 釋放攻擊，也不修改 Persistent State。

## Regression

`tools/check_v435_browser_battle_enemy_ai_charge_retention.mjs` 覆蓋三種固定 C charge code、混合蓄力與一般 Enemy、Surprise 優先順序、COM1／COM2 原樣保留與 RNG 不消耗。

Workflow：`.github/workflows/check-v435-browser-battle-enemy-ai-charge-retention.yml`，並重跑 V4.29–V4.34。

Pinned Fixed-C：`gavinlinasd/StoneAge@1f90cb6cb57c1df70f39cde77a5a8ccd98b66c56`。
