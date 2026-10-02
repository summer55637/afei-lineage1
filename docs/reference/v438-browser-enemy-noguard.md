# V4.38 Browser Enemy NoGuard WAZA

更新日期：2026-10-02

V4.38 移植 Fixed-C `PETSKILL_NoGuard()` 的敵方 WAZA 命令與本回合效果，並沿用既有 attack prelude、counter 與 turn initializer。

## 支援範圍

- 從注入的 `stoneage_petskill_runtime.json` 載入敵方 `petSkills` 槽位 profile；不硬編碼各技能等級的 option 文案。
- 支援函式 `PETSKILL_NoGuard`（目前來源 skill ID 150、151、152），解析回避／反擊／會心 option。
- 命令為 Fixed-C `BATTLE_COM_S_NOGUARD`（1014）；COM2 保留 AI target；COM3 依來源格式打包：高 16 位回避、低 16 位 `(Counter << 8) + Critical`。
- DuckCheck 在 Defender COM=NOGUARD 時套用回避加成；CounterCheck 接受來源特殊命令 1014，並使用 NoGuard 反擊加成。
- 會心加成依固定來源舊回歸紀錄保留在 COM3／暫存欄位，但不套用到 critical chance，因為原 C 的 Pet Critical bonus 路徑已停用。
- 技能不做直接攻擊（NoAction）。命令被不能行動狀態覆寫為 NONE 時，不套用 NoGuard 加成。
- 下一回合初始化時清除 NoGuard 加成及過期的 COM3；不寫入 Persistent State。

## 來源依據

- `gmsv/battle/pet_skill.c`：`PETSKILL_NoGuard()` 對 COM1/2/3 的寫入。
- `gmsv/battle/battle.c`：NoGuard 在 DuckCheck／CounterCheck 的效果與 NoAction 行為。
- `docs/changelog/part-04-v0.97-to-v1.26.md` V1.08：確認回避 +30、反擊 +50 生效；會心 +20 為死資料；效果限本回合且不寫存檔。

## Regression

`tools/check_v438_browser_battle_enemy_noguard.mjs` 使用正式 PetSkill catalog 的 150–152 option，驗證 profile hydration、COM1/2/3、回避、反擊、狀態阻擋與下一回合清除。

Workflow：`.github/workflows/check-v438-browser-enemy-noguard.yml`，並重跑 V4.29–V4.38、Battle Context、Counter 與 Attack Pipeline 回歸。

Pinned Fixed-C：`gavinlinasd/StoneAge@1f90cb6cb57c1df70f39cde77a5a8ccd98b66c56`。
