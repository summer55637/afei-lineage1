# V3.10 battle effects source notes

本輪新增的是戰場 presentation-only feedback，不新增任何戰鬥規則。

- 來源：既有 `addLog(text,type)` 產生的戰鬥結果文字。
- 類型：傷害、會心、MISS、捕獲成功／失敗、狀態命中。
- 顯示：在既有 battle stage 上以短暫浮動文字呈現，讓演出不再只停留在下方文字 log。
- 傷害數字直接取既有 log 中已產生的傷害值；不重新計算、不重新抽 RNG。
- 回饋狀態存在於 presentation-only `battlePresentationFx`，不寫入 save schema。
- 沒有可解析的戰鬥結果時不顯示效果。

## 邊界

本輪不修改 `normalBattleOrder()`、BattleModel、DamageReact、Counter、Guardian、Acupuncture、CaptureCheck 或 RNG。

## Visual reference

`docs/reference/video-001-visual-reference.md` 明確要求傷害、狀態、技能演出直接疊在戰場上；本輪先以 source-backed battle log 結果建立最小可驗證的戰場 feedback layer，再逐步往完整動畫與角色／技能演出靠近。
