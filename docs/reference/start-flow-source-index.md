# Start Flow Source Index

更新日期：2026-09-30

固定 source `gavinlinasd/StoneAge@1f90cb6cb57c1df70f39cde77a5a8ccd98b66c56`。

`CHAR_createNewChar()` 透過 `CHAR_getInitElderPosition()` 決定一般玩家建立角色後的出生座標。

| hometown | elder | floor | x | y |
|---:|---|---:|---:|---:|
| 0 | samugiru | 1006 | 15 | 22 |
| 1 | marinasu | 2006 | 20 | 16 |
| 2 | jaja | 3006 | 21 | 16 |
| 3 | karutarna | 4006 | 14 | 20 |

同一 source 還會依 hometown / `CHAR_LASTTALKELDER` 選擇新手寵物：elder 1→pet 2、elder 2→pet 3、elder 3→pet 4，其他→pet 1。

四張起始 floor 共偵測 46 個 NPC create instances；其中 8 個屬可辨識的 movement service。

下一步把這四張起始地圖的 NPC、warp exits、encounter rows 與第一批 event 串成四條 source-backed first routes。