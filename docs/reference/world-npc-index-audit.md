# World NPC Index / Map Connectivity Audit

更新日期：2026-09-30

## NPC index

fixed source 的 NPC data 共 3,960 個檔案。

批量解析後得到：

- template files：88
- template blocks：215
- create files：355（包含 1 個 `.creata`）
- create blocks：7,979
- arg 類檔案：1,189
- 不同 NPC floor：1,031
- template reference：7,979 全部可解析
- missing `file:` targets：27

因此目前 NPC 的主鏈並不是 template 斷鏈；真正待處理的是 27 個 arg/file reference source gap。

## Functionset

資料中共有 75 種 functionset 名稱，其中 55 種能對應 pinned C 的 70 個主 registry entry，20 種目前不能直接關閉。

這 20 種不能直接全部視為「不存在」。部分名稱能找到 C module，例如 Auctioneer、BigSmallMaster、BigSmallPet、Doorman；另有 RoomAdmin → RoomAdminNew、ExChageMan → ExChangeMan 等 alias / historical possibility。

目前全部維持 non-promoted。

外部 Stone Age NPC 教學也與本 source 的核心資料模型一致：`.create` 以 `floorid`、`borncenter`、`dir`、`graphicname`、`name`、`enemy` 等欄位描述 NPC，而 `enemy` 會指向 template / arg；這只能作 corroboration，fixed C 仍是本專案最高來源。 citeturn693953search0turn693953search5

## Mapwarp

fixed source 的 `gmsv/data/map/mapwarp.txt` 有 5,457 rows。

與 source map header 交叉驗證：

- 1,250 個可辨識 LS2MAP floor
- 0 筆缺失 floor
- 0 筆座標越界
- 1,138 個 from floors
- 959 個 to floors
- 2,351 筆沒有 exact reverse row

這讓 mapwarp 可以成為後續 World Graph 的可靠 source layer。

「沒有 reverse row」本身不能直接當成錯誤，因為資料本來可以是單向傳送、多人匯入同一目的地或多個入口對單一出口。

## 下一步

下一步不做 playable UI。

先把：

`Map → NPC instance → service/action → arg → item/quest/warp`

這條鏈接起來。

優先處理：

1. NPC service functionset 的 source module / registry reachability。
2. 27 個 missing arg/file reference。
3. mapwarp + NPC warp 統一成 World Graph。
4. NPC shop / quest / healer / savepoint / pet / skill / profession 等服務索引。
