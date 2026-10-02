# Idle Battle Strategy v1

更新日期：2026-10-02

## 狀態

基礎策略 v1 已接入 Browser State Controller，並加入 tools/check_idle_battle_strategy.mjs regression。

## 明確策略

Persistent State 的 battleSettings.strategy 預設為 mode=basic_attack_only、targetPolicy=source-default-random。

- 玩家角色在 active battle 且處於 C_WAIT 時提交普通攻擊。
- 目標使用 Fixed-C BATTLE_DefaultAttacker() 同形的候選過濾與隨機選取；隨機 roll 必須由呼叫端注入，策略不自行產生 RNG。
- 若 fixed-C checkErrorStatus() 所涵蓋的狀態阻擋命令，玩家改為 wait，且不先消耗目標 RNG。
- 沒有可攻擊目標時，玩家使用 wait，讓回合可以進到後續判定。
- 戰鬥中的寵物套用 Fixed-C BATTLE_PetDefaultCommand()：普通攻擊、target -1、C_OK。
- 已經是 C_OK 的玩家不重複提交命令；死去的玩家略過。
- 非 active battle、actor 身分不明、策略設定不支援、需要 RNG 卻未提供時均 fail-closed。

## 尚未涵蓋

v1 不自動使用職業技能、寵物技能、道具、捕捉、逃跑或自動換寵；也不決定補血門檻、死亡恢復、背包滿、離線收益或路線輪替。

策略只提交命令，不計算 AttackSeq、damage、counter、death、battle finish 或 reward。Idle Simulation 的 battle result 仍由外部 runtime 注入，因此不能把這個命令策略視為完整自動戰鬥閉合。

## Controller API

BATTLE_IDLE_STRATEGY_APPLY 在 active Battle Context 上套用 Persistent State 的策略，可選擇提供：

- defaultTargetRoll：符合目前合法目標數的 0-based source RNG roll。
- weaponKind：已解析裝備後傳入的武器類型；若是 boomerang，沿用既有 command adapter 的轉換。

此 action 只變更 transient Battle Context，不增加 Persistent State revision，也不執行傷害。

## Fixed-C source boundaries

- BATTLE_DefaultAttacker()：掃描目標側 entry，排除 Rescue 與 TargetCheck 不合法者，從候選中以 RAND(0, cnt-1) 選取；無候選回傳 -1。
- BATTLE_PetDefaultCommand()：寫入 ATTACK、target -1 與 C_OK。
- BATTLE_CommandWait()：玩家側存活 actor 若仍為 C_WAIT，會阻止回合開始；敵方側直接 ready。

Pinned source：gavinlinasd/StoneAge@1f90cb6cb57c1df70f39cde77a5a8ccd98b66c56。

Regression：tools/check_idle_battle_strategy.mjs。
