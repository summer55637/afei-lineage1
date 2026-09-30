# V3.70 Browser ItemShop UI state

更新日期：2026-09-30

V3.70 把 ItemShop 的前端互動 session 補成 Browser State Controller 的暫態 state。這一層只保存「現在是否開店、目前選哪個 source-backed offer、數量、結果提示」；不保存到 canonical Persistent State，也不創造第二套 Item / Gold transaction。

## Session flow

NPC_ITEMSHOP_UI_OPEN → source-backed offers → SELECT_OFFER → SET_QUANTITY → existing NPC_ITEMSHOP_BUY / SELL → result prompt → CLOSE

`ITEMSHOP_UI_OPEN` 仍會先走既有 NPC interaction gate 與 ItemShop catalog resolution。offer 的 itemId / baseCost / buyRate 直接來自既有 resolver。

`ITEMSHOP_UI_SELECT_OFFER` 只能選 resolved offer；`ITEMSHOP_UI_SET_QUANTITY` 只保存 UI 請求值，不自行套 inventory / gold 上限。

真正交易仍是：Browser State Controller → existing Browser ItemShop Runtime → source Item allocator / Item Economy → canonical Persistent State。

## Persistent State boundary

UI session 是 controller closure 內的 ephemeral state。開店、選取商品、調整數量、關店都不增加 Persistent State revision。只有 BUY / SELL 成功才沿既有 transaction engine 改變 Persistent State。

## Fail-closed

未開店不能選商品或設定數量；不存在的 offer、未 resolved offer、非正整數數量都直接拒絕。UI 不會自己計價、不會建立 synthetic Item、不會直接扣 Gold。

## 不包含

- playable HTML
- 新的 ItemShop engine
- 新的 currency / inventory engine
- 自動購買策略
- 猜測 source Item template / price

Regression：`tools/check_v370_browser_itemshop_ui_state.mjs`。
