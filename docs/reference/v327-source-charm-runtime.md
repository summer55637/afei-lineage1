# V3.27 Source Charm Runtime

更新日期：2026-09-30

V3.27 把 pinned fixed-C 已找到的 `Charm` concrete semantics 收進獨立 runtime。

## Fixed-C semantics

在 `gmsv/src/npc/npc_exchangeman.c` 的 reward completion handler，`Charm` 讀取數值後只有在 `CHAR_CHARM < 100 && EvNo > 0` 時執行。

更新公式：

`nextCharm = min(100, currentCharm + atoi(CharmValue))`

之後固定呼叫 `CHAR_complianceParameter()`、送出 Charm 狀態並呼叫 `NPC_CharmStatus()`。

因此 `EventNo:-1` 並不會增加 Charm；這一點特別適用於目前 `xinshoujd.arg` 的四個 reward branches。

## Runtime boundary

`applySourceCharm()` 只固定數值 mutation；UI/status side effects 仍留給上層 adapter。

`createSourceCharmHandler()` 可以直接提供給 V3.22 transaction。當 `eventNo <= 0` 時會回傳成功但 `applied:false`，代表 source handler 的 no-op，不阻擋同一筆 reward transaction。

這份 runtime 不宣稱 `changeevent` 與 `ExChangeMan` 在所有 build 中一定共享完全相同的 Charm handler；它只固定 pinned C 已證實的 concrete rule。

## First-route implication

`xinshoujd.arg` 的每個 branch 都是 `EventNo:-1`，所以在這個 concrete source rule 下：

`Charm:1 → no-op`

而 `GetItem`、`GetPet`、`EndSetFlg` 仍正常執行。

這避免把公開腳本文件裡的「Charm:1」直覺解讀成一定會改變目前這條 `changeevent` reward flow。

下一步：將 Item / Pet / Charm / Event flag 四個 concrete adapters 接進單一 first-route orchestrator regression。
