# V4.36 Browser Battle Enemy AI Target Selection Parity

更新日期：2026-10-02

V4.36 對照專案固定來源回歸紀錄 V1.31（`_ENEMY_ATTACK_AI` 已開啟），補齊新 Browser Enemy AI runtime 尚未帶入的完整目標選擇規則。

## 選取與 RNG 次序

- select mode 1：只消耗 `RAND(0,cnt-1)`。
- select mode 2..7：先找 HP_MAX／HP_MIN／STR_MAX／DEX_MAX／DEX_MIN／ATT_SUBDUE 的 top，再消耗 `RAND(0,rn)`；若結果為 0，接著消耗 `RAND(0,cnt-1)`，否則使用 top。
- 即使 cnt=1 也不省略 `RAND(0,rn)`；若結果為 0，也照樣消耗 `RAND(0,0)`。
- TARGET_LEADER（target type 4）：隊長直接入選，非隊長逐 entry 消耗 `RAND(0,2)`，只有 0 加入；無候選時再 fallback ALL。
- target type 0 與未知值符合 Fixed-C switch default，採 ALL。
- 指定 PLAYER／PET（type 2/3）無候選時 fallback ALL。

ATT_SUBDUE 採固定 `GetSubdueAttribute()` 比較樹；極值 selector 同值時維持原掃描順序第一個。target selector 的 RNG 和 TARGET_LEADER filter RNG 由同一個 caller-injected targetRolls 序列依來源順序提供。

## Battle Context

新增 transient `sourceAiTargetStats`、`sourceAiElements` 與 `sourcePartyMode`：Player stats 轉為固定 C 比較尺度（×100）、Pet／Enemy 保留其 source stat 尺度；玩家與目前單機出戰寵明確標示 party mode 0，不虛構 leader。Player 四元素由 `creation.elements` 傳入，Pet／Enemy 由可用來源資料傳入。缺少 selector 所需資料仍 fail-closed。

本版不增加 Persistent State schema、不執行傷害，也不改造戰鬥畫面。

## Regression

- `tools/check_v430_browser_battle_enemy_ai_target_selection.mjs` 校正 mode 2/3 `rn` RNG，包含 cnt=1 random override。
- `tools/check_v436_browser_battle_enemy_ai_target_parity.mjs` 覆蓋 select 1..7、TARGET_LEADER、fallback、屬性比較及 Battle Context 來源欄位。
- `.github/workflows/check-v436-browser-battle-enemy-ai-target-parity.yml` 會重跑 V4.29–V4.36、Battle Context 與既有 attack pipeline regressions。

Fixed-C：`gavinlinasd/StoneAge@1f90cb6cb57c1df70f39cde77a5a8ccd98b66c56`；對照紀錄：`docs/changelog/part-05-v1.27-to-v1.51.md` V1.31。
