# V4.26 Browser Battle Damage Commit

更新日期：2026-10-02

V4.26 為 V4.04 DamageReact plan 新增獨立的 HP mutation commit。V4.04 仍是純計畫；只有 Controller 收到明確的 `BATTLE_DAMAGE_COMMIT` 並且能綁定目前暫存攻擊 pipeline 時，才會提交一般傷害。

## Supported branch

目前只提交下列一般攻擊分支：

- DamageReact code 為 NONE。
- 無 redirect、無 ride-pet damage split、無 HP heal、無 state charge consumption。
- attacker 與 target 都必須存在且 attacker HP > 0；target HP / maxHP 必須為正且合理。
- 使用 V4.04 傳入的 damage，不另抽 RNG、不重算命中或傷害。

VANISH、ABSORB、REFLECT、TRAP、ACUPUNCTURE 與騎乘寵物分攤仍只保留既有 plan，V4.26 commit 會明確拒絕，避免部分寫入。

## Mutation and transaction boundary

Commit 只產生新的 transient Battle Context，不直接修改 Persistent State。正常分支將 target HP 寫為 `max(0, hp - damage)`，並增加 `damageCommitRevision`。

交易需有非空 `transactionId`。相同 transaction + 相同 plan 再送會回傳 idempotent，不重複扣血；相同 transaction 綁定不同 plan、過期 revision 或錯誤 expected revision 均拒絕。

原始角色初始化增加獨立 `workUltimate` 欄位，不與死亡結果欄位 `ultimate` 混用。依 pinned Fixed-C `BATTLE_DamageSub` 的死亡溢傷分支：
- 當次 damage 達 `maxHP × 1.2 + 20`，回傳 `ultimateFromDamage = 2` 並清空累積。
- 未達門檻但產生 overkill 時，將 overkill 累積到 `workUltimate`；達門檻時回傳 `ultimateFromDamage = 1` 並清空累積。
- 後續 death plan 未明確提供覆寫值時，會讀取本次 damage commit 的結果。

零傷害遵守 Fixed-C 先行返回語義：不觸發反應、不消耗狀態、不增加 revision。

## Regression

`tools/check_v426_browser_battle_damage_commit.mjs` 涵蓋一般扣血、不可變輸入、交易重播／衝突、舊 plan、revision mismatch、立即必殺、累積溢傷、零傷害、反應與騎乘分攤拒絕，以及非戰鬥 phase 拒絕。

Workflow：`.github/workflows/check-v426-browser-battle-damage-commit.yml`。

這項提交只閉合 HP mutation 的一段，尚不代表完整攻擊回合、反擊、敵方自動命令、死亡提交、戰鬥結束與 idle settlement 已端到端串接。
