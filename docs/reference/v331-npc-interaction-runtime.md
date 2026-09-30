# V3.31 NPC Interaction Boundary

更新日期：2026-09-30

V3.31 將 fixed-C NPC interaction distance / facing 規則變成 browser-facing gate，但不把未註冊 module 變成可互動 NPC。

## Fixed-C source rule

pinned `gmsv/src/npc/npcutil.c::NPC_Util_charIsInFrontOfChar()` 先要求同 floor、不得同格，再沿著玩家 `CHAR_DIR` 的前方座標逐步檢查指定 distance。

Bankman、Windowman、Familyman、FmLetter、Riderman 等固定 C module 都使用 `NPC_Util_charIsInFrontOfChar(...,1)`；因此 V3.31 的 resolved example 使用 distance=1 + facing cell。

## Runtime gate

`canInteractWithNpc()` 的順序是：

`module status → same floor → not same cell → distance → optional facing`

`runtimeModuleStatus=unresolved_in_npctemplate_functionSet` 會明確回傳 `interactable:false`。

這點對 `changeevent` 很重要：即使 `xinshou` NPC 的座標已 source-resolved，也不能因此跳過 template/module registration。

## Browser request

`buildInteractionRequest()` 只產生純資料 request，不直接修改 state，不自動執行 reward。下一層把這個 request 接到 resolved module 的 action dispatcher；new-player `changeevent` 仍保持 blocked。
