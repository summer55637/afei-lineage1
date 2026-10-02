# V4.39 Browser Enemy ChargeAttack Integration

更新日期：2026-10-02

V4.39 將敵方 `PETSKILL_ChargeAttack`（來源 skill 30）由 AI WAZA 抽選接到控制器蓄力步進及既有普通攻擊計算。

## 行為

- 以正式生成資料 Group 712 / Enemy 1305 的 WAZA 權重與 PetSkill catalog 作為整合測試來源。
- 從來源 option 解析蓄力回合數與攻擊百分比；skill 30 的 COM3 為高 16 位攻擊百分比 90、低 16 位回合數 1。
- WAZA AI 先完成 action／target RNG，再提交 `BATTLE_COM_S_CHARGE`（1005）、原始 target 及 COM3。
- 每次 `BATTLE_CHARGE_STEP` 先經 command-wait gate。回合數大於 0 時扣 1 並保持蓄力；回合數為 0 時按固定 `BATTLE_Charge()` 計算 `FIXSTR + FIXSTR*N*0.01 + MODATTACK`，並改成 `BATTLE_COM_S_CHARGE_OK`（1015）。
- CHARGE_OK 沿用原 COM2 目標，進入既有 AttackSeqPrelude → DamagePlan → CriticalDamagePlan；攻擊力由 transient `attackPower` 傳遞。
- 本版未改寫 Fixed-C 的 `BATTLE_IsCharge()` 規則：它只保留 CHARGE／EARTHROUND0／EARTHROUND1；CHARGE_OK 是本次釋放動作，不是跨回合保留狀態。

## 邊界

本版證明 ChargeAttack 的控制器步進與單次釋放進入傷害計算。傷害仍只在既有 commit action 執行；本次 regression 不提交傷害、不修改 Persistent State，也不代表整回合自動排程已閉合。

## Regression

`tools/check_v439_browser_enemy_charge_attack.mjs` 使用正式 Group 712 / Enemy 1305，驗證 WAZA 選取、COM1/2/3、蓄力等待、釋放成 CHARGE_OK、攻擊力公式及既有攻擊計算綁定。

Workflow：`.github/workflows/check-v439-browser-enemy-charge-attack.yml`，同時重跑 V4.29–V4.39、V3.86 Battle Context、attack pipeline binding 與 V4.05 Counter regression。

Pinned Fixed-C：`gavinlinasd/StoneAge@1f90cb6cb57c1df70f39cde77a5a8ccd98b66c56`；來源函式：`PETSKILL_ChargeAttack()`、`BATTLE_Charge()`、`BATTLE_IsCharge()`。
