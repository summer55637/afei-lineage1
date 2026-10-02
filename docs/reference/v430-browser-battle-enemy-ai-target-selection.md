# V4.30 Browser Battle Enemy AI Target Selection

更新日期：2026-10-02（V4.36 source-parity correction）

V4.30 原先先接入 HP 選目標；V4.36 重新對照固定來源 `_ENEMY_ATTACK_AI` 後，校正 mode 2..7 的 `rn` RNG 時序，並擴充其餘 selector 與 TARGET_LEADER 支援。V4.30 的歷史「HP selector 不耗 RNG」說明已由本次更正取代。

## 目前行為

- `selectMode=1`：只消耗 `RAND(0,cnt-1)` 隨機選取。
- `selectMode=2..7`：先比較極值，再消耗 `RAND(0,rn)`；若結果為 0，接著消耗 `RAND(0,cnt-1)` 選隨機目標，否則使用極值目標。即使只有一個候選也不省略這些 RNG。
- 支援 HP_MAX、HP_MIN、STR_MAX、DEX_MAX、DEX_MIN、ATT_SUBDUE；ATT_SUBDUE 使用固定 C `GetSubdueAttribute()` 比較樹。
- `targetType=2/3` 指定玩家／寵物；若該類型沒有候選，回退 ALL。
- `targetType=4` TARGET_LEADER：隊長直接入選；其他候選各自消耗 `RAND(0,2)`，只有 0 入選；空集合時回退 ALL。
- `targetType=0` 與未知值遵循固定 C switch default，視為 ALL。
- 死亡與 Rescue 對象仍於 target candidate 階段排除；EarthRound 隱身不提前排除。

## 邊界

所有 RNG 由呼叫端依序注入。runtime 不自行生成亂數；候選選取所需資料缺漏、RNG 缺漏或超界時 fail-closed。只計畫命令，不執行傷害、不修改 Persistent State。

V4.36 同時把 player／pet／enemy 的目標比較用 STR、DEX 與元素資料帶入 transient Battle Context；現行單人模式的 party mode 固定為非隊長 0，不假設玩家已組隊。

## Regression

- `tools/check_v430_browser_battle_enemy_ai_target_selection.mjs`：修正 HP 模式 `rn` RNG 斷言，包含單一候選及 random override。
- `tools/check_v436_browser_battle_enemy_ai_target_parity.mjs`：target type 4、mode 1..7、屬性比較、`rn` 與 leader-filter RNG、fallback。
- Workflow 重跑 V4.29–V4.36、Battle Context 與既有 Attack Pipeline。

Pinned Fixed-C：`gavinlinasd/StoneAge@1f90cb6cb57c1df70f39cde77a5a8ccd98b66c56`。
