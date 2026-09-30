# V3.71 Production ItemShop Browser UI penetration

更新日期：2026-10-01

V3.71 不再只用 fixture 驗證 ItemShop UI，而是在 GitHub Actions 乾淨 checkout 中重新生成 pinned fixed-C 的 World NPC index 與 NPC ItemShop catalog，然後讓正式 source-backed shop 穿過 canonical Browser State Controller。

## Verified chain

`pinned source → World NPC point → path#blockIndex ItemShop binding → interaction gate → ITEMSHOP_UI_OPEN → SELECT_OFFER → SET_QUANTITY → NPC_ITEMSHOP_BUY → source Item allocator → Economy → Persistent State`

預期 production join：336 個 World ItemShop bindings、335 個 resolved、1 個已知 source anomaly。

已知 anomaly：`gmsv/data/npc/my/magicdou/daochang.create#8` 對應缺失的 `my/ruieryasi/yao.arg`；本版仍 fail-closed，不用猜測資料。

## Regression boundary

測試會從正式 catalog 找到一個 resolved、可購買的 shop，使用其 source Born 座標解析正式 World NPC，經 `ITEMSHOP_UI_OPEN` 開啟店面，再選 offer、設定數量，最後執行一次正式 `NPC_ITEMSHOP_BUY`。

UI session 的開店／選取／數量操作仍不增加 Persistent State revision；只有真正 BUY 成功才增加 revision 並改變 Gold / inventory。

這個 regression 的 buyer state 只是測試用 player state，不會成為 production data。

## 明確沒有做

- 不重新定義 ItemShop pricing
- 不新增 Item allocator
- 不新增 Economy / Gold engine
- 不建立第二個 Browser State Controller
- 不建立 playable HTML
