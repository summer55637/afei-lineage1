# V4.67 Browser Battle Auto Orchestrator

固定來源：gavinlinasd/StoneAge@1f90cb6cb57c1df70f39cde77a5a8ccd98b66c56

V4.67 不重寫戰鬥公式，只把既有已驗證 runtime 串成真正的回合自動執行入口。

每回合順序：Player basic idle strategy → Enemy AI → Battle Round Resolve。Round Resolve 仍負責 Dex、Status、AttackSeq、Damage、Death、Counter、Reward、Relife 與 end check。戰鬥結束後回傳 Finish plan，Persistent State commit 仍交給既有 Finish / Settlement boundary。

所有 RNG 都由 caller 注入；Orchestrator 本身不產生 RNG。缺少 required RNG 或遇到未支援技能時 fail-closed。

Regression：tools/check_v467_browser_battle_auto_orchestrator.mjs。
