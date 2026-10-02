# V4.30 Browser Battle Enemy AI Target Selection

更新日期：2026-10-02

V4.30 擴充 V4.28/V4.29 敵方 AI runtime 的攻擊目標選擇模式，依 pinned Fixed-C 的一般 NORMAL AI 規則支援 HP 選取與指定類型的候選回退。

## 行為

- `selectMode=1`：由 caller 注入 0-based target RNG，隨機選取候選目標。
- `selectMode=2`：選擇 HP 最高者。
- `selectMode=3`：選擇 HP 最低者。
- HP 最高／最低模式不消耗 target RNG；同 HP 時保留候選掃描順序中的第一位。
- `targetType=2` 玩家或 `targetType=3` 寵物若沒有符合目標，依來源流程回退到全體合法候選。
- HP 資料缺漏與未支援選擇模式均 fail-closed。

本版只產生敵方命令計畫，不提交傷害、不修改 Persistent State。魔法與寵物技能仍是獨立待完成的 action runtime，不因本版通過而視為已支援。

## Regression

`tools/check_v430_browser_battle_enemy_ai_target_selection.mjs` 覆蓋 HP max/min、同值順序、玩家／寵物限制、指定類型空集合回退、缺少 HP 與未支援模式。V4.30 workflow 同時重跑 V4.29 目標類型測試。

Pinned Fixed-C：`gavinlinasd/StoneAge@1f90cb6cb57c1df70f39cde77a5a8ccd98b66c56`。
