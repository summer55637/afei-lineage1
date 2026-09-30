# Start Flow Source Index

更新日期：2026-09-30

## 固定來源

`gavinlinasd/StoneAge@1f90cb6cb57c1df70f39cde77a5a8ccd98b66c56`。

玩家建立流程 `CHAR_createNewChar()` 呼叫 `CHAR_getInitElderPosition(&ch, hometown)`，因此出生點不是前端自行決定，而是 fixed C 的 elder table。

## 四個 hometown

| hometown | elder | floor | x | y |
|---:|---|---:|---:|---:|
| 0 | samugiru | 1006 | 15 | 22 |
| 1 | marinasu | 2006 | 20 | 16 |
| 2 | jaja | 3006 | 21 | 16 |
| 3 | karutarna | 4006 | 14 | 20 |

`CHAR_getInitElderPosition()` 在非 museum 路徑限制 hometown 為 0–3，設定 `CHAR_FLOOR / CHAR_X / CHAR_Y` 並把對應 bit 寫入 `CHAR_SAVEPOINT`。

## 新手寵物

在 `_NEW_PLAYER_CF` 下，`CHAR_createNewChar()` 會依 `CHAR_LASTTALKELDER` 決定 `getNewplayergivepet(0)` 的預設值：

- elder 1 → pet 2
- elder 2 → pet 3
- elder 3 → pet 4
- 其他（包含 elder 0）→ pet 1

真正的 pet 名稱／enemy definition 必須再接 Enemy source，不在本 index 直接猜名稱。

## 出生地 NPC

四張起始 floor 共偵測到 46 個 NPC create instances；目前 parser 能可靠辨識的 service template 中，movement service 有 8 個。

起始地也能看到 `bankman`、`familyman`、大量 `changeevent` / `npcgen_man` 與 `npcgen_warp` 相關 NPC，代表出生村不是只有出生點，而是完整的 town service layer。

## Museum 例外

fixed C 還存在 `_DELBORNPLACE` / `_MUSEUM` 的 museum override：

- `_DELBORNPLACE` + museum：先改 hometown 解析，再固定到 floor 815 / 29 / 40、`CHAR_LASTTALKELDER=35`。
- `_MUSEUM` active 時又會把位置覆寫到 floor 9000 / 40 / 40。

這些是特殊 source mode，不應與一般玩家出生流程混成同一條 canonical route。

## 第一條遊戲流程的資料底座

現在可以正式定義第一層 source-backed chain：

`character creation → hometown → elder spawn → town NPC services → warp exits → world graph → encounter`

其中前五層已開始有 machine-readable source index；最後的 encounter 還要依 floor-specific `encount.txt` / source map 再閉合。

## 下一步

下一輪優先把四個出生村的 warp exits、encounter rows、shop / healer / savepoint NPC 與第一批新手 event 接成四條平行起始路徑。

仍不建立 playable HTML。