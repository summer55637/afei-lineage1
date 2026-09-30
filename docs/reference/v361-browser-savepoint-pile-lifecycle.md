# V3.61 Browser SavePoint pile lifecycle parity

更新日期：2026-09-30

V3.61 修正 V3.59 Browser SavePoint GetItem transaction 與 pinned fixed-C item pile lifecycle 的差異。

## Fixed-C evidence

固定 source 1f90cb6cb57c1df70f39cde77a5a8ccd98b66c56 的 gmsv/src/include/version.h 啟用 _ITEM_PILENUMS。

gmsv/src/include/char_base.h 定義 CHAR_DelItem(index,ti) 為 _CHAR_DelItem(...,ti,1,1)。因此 SavePoint 的 NPC_SavePointItemDelete() 每命中一個 inventory object，只要求做一次 CHAR_DelItem(talker,i)。

在 gmsv/src/char/char_base.c 的 _CHAR_DelItem() 中，_ITEM_PILENUMS 路徑會先檢查 pile 是否足夠，再把 ITEM_USEPILENUMS 減 1；只有 pile <= 0 才清除 item slot 並結束 item object。

因此：

GetItem ...*N 的 N 仍是需要幾個符合 ITEM_ID 的 item objects，但每次確認交易對被選 object 只消耗 1 pile unit。

## Browser transaction

V3.61 的 consumeSavePointItems() 改成：

- preflight 所有 selected slots。
- item object、itemId、pile 必須存在且 pile >= 1。
- 所有 preflight 通過後才開始 mutation。
- pile > 1：保留同一 object / slot，只把 pile 減 1。
- pile = 1：清除 slot reference 與 itemRuntime object。
- inventory.piles mirror 只減 1。
- 任一 preflight 失敗時，原 state 完全不變。

## Requirement semantics

selectSavePointItemRequirement() 維持 fixed-C 的 object-count semantics。兩個不同 item object 即使其中一個 pile=99，也必須是兩個 source objects 才能滿足 itemNo*2；單一 pile=99 不等於兩個 object。

## Regression

tools/check_v361_browser_savepoint_pile_lifecycle.mjs 鎖定：

- pinned source 啟用 _ITEM_PILENUMS
- pile 5 → 4，object / slot 保留
- pile 1 → object / slot 刪除
- aggregate mirror 每次只減 1
- pile=0 preflight fail-closed
- 多 item preflight failure 不產生 partial mutation
- V3.59 confirmation / unlocked-elder behavior compatibility

本輪不建立 playable HTML；SavePoint、ItemShop、Economy、Persistent State 仍共用既有 Browser State Controller 與 transaction 邊界。
