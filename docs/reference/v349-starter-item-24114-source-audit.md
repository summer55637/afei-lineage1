# V3.49 Starter Item 24114 Source Audit

更新日期：2026-09-30。

V3.49 針對固定 C 的 `setup.cf ITEM1=24114` 做 Item template / allocator source audit。

## Fixed-C chain

`CHAR_loginAddItemForNew` → `ITEM_makeItemAndRegist(24114)` → `ITEM_makeItem(24114)` → `ITEM_CHECKITEMTABLE(24114)` → `ITEM_tbl[24114].itm`

固定 build 啟用 `_ITEMSET6_TXT`，因此 `config.itemfile` 由 `itemset6file` 指到：

`gmsv/data/itemset6.txt`

而 pinned commit 中這個檔案是 0 bytes，沒有任何 Item row，也找不到 `24114`。

## Loader proof

`gmsv/src/item/item.c::ITEM_readItemConfFile` 先讀取所選 Item file；如果找不到任何有效 Item ID，`maxid` 維持 0，隨後 `maxid <= 0` 直接回傳 `FALSE`。

後續 `ITEM_makeItem()` 不是自行建立 Item template；它先要求 `ITEM_CHECKITEMTABLE(number)` 成立，再從 `ITEM_tbl[number].itm` 複製 template。

因此目前可以正式確認：

- `ITEM1=24114`：closed。
- `CHAR_loginAddItemForNew` 呼叫鏈：closed。
- selected Item source file：closed。
- Item 24114 template row：unresolved。
- Item allocator 的 production promotion：unresolved。
- 不合成名稱、效果、價格、分類或其他 Item 欄位。

## Runtime policy

在 24114 template 尚未從同一 pinned source 找到以前，starter-item grant 必須 fail-closed。

不得因外部網站、其他 StoneAge port、其他版本或常見道具編號而補出 template。

這個 boundary 不影響已完成的 starter Pet rank closure；V3.48 的四村 starter Pet 都已經是 source-rank closed。

## Next source search

後續仍可繼續沿同一 fixed-C commit 搜尋 Item data / Item migration / source packaging evidence；只有取得可直接對應 24114 的同版本模板資料後，才升格到 Item allocator grant。

不新增 playable HTML。
