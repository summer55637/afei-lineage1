# V3.11 battle target marker source notes

V3.11 只處理戰鬥場景的目標選取 presentation，不改任何 battle runtime。

## 外部介面參考

公開《石器時代》戰鬥操作資料記載：選擇「攻擊」後，再點擊要攻擊的對象；戰鬥場景配置為敵方左上、我方右下、右上指令視窗。

因此本版把既有 runtime 的目前目標直接做成醒目的戰場標記。

## 本版資料來源

- 目標資料：既有 `targetEnemyUnit()`。
- UI 單位：既有 `renderBattleStageUnit()` 產生的 `.target` class。
- visual feedback：純 CSS `::before` / `::after` 與 pulse animation。
- 不新增 selected-target state。
- 不新增 RNG。
- 不修改 target resolver、battle order、傷害、CaptureCheck、Guardian、Counter、Acupuncture。

## 表現邊界

目標標記只回答「目前 runtime 已選中的對象是誰」；它不允許使用者藉由標記改寫目標，也不重新執行任何戰鬥流程。

`prefers-reduced-motion` 時停用動畫，但保留靜態「目標」標籤與邊框。