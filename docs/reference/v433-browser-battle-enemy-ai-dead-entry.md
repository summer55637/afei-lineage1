# V4.33 Browser Battle Enemy AI Dead Entry

更新日期：2026-10-02

V4.33 對齊 Fixed-C `BATTLE_ai_all()` 的 dead-entry AI lifecycle：Enemy Battle Entry 仍有效時，AI 階段不會先以 `isDie` 或 HP<=0 將其排除。

## 行為

- Dead Enemy 若仍為 C_WAIT 且保有有效 AI profile，仍依 Entry 順序參與 action / target 選擇並消耗 caller-injected RNG。
- 命令 commit 會照來源將其命令寫入並標為 C_OK；死亡旗標與 HP 原樣保留，不會復活。
- target candidate selection 仍排除死亡與 Rescue 對象。
- 此版只閉合 AI command lifecycle；後續實際行動階段仍須依死亡狀態跳過 Dead Entry。
- 不修改 Persistent State，也不執行傷害。

## Regression

`tools/check_v433_browser_battle_enemy_ai_dead_entry.mjs` 同時放入 dead / alive Enemy，驗證 AI RNG 的 Entry 順序、命令提交、死亡狀態不變及無持久變更。Workflow 另重跑 V4.29–V4.32 AI regressions。

Pinned Fixed-C：`gavinlinasd/StoneAge@1f90cb6cb57c1df70f39cde77a5a8ccd98b66c56`。
