# Start Route Candidates

更新日期：2026-09-30

固定 source：`gavinlinasd/StoneAge@1f90cb6cb57c1df70f39cde77a5a8ccd98b66c56`。

## source parser

`NPC_WarpInit()` / `NPC_WarpWarpCharacter()` 已確認 `npcgen_warp|floor|x|y` 的三個值是目的地。`ENCOUNT_initEncount()` 已確認 encount row 第 2 欄為 floor、第 3–6 欄為遇敵矩形、第 7–10 欄為 encounter probability / enemy count / z-order。

本輪解析 3,943 個 warp edges、1,197 個 encounter rows、675 個 encounter floors。

## 四條出生路徑候選

| hometown | spawn | direct exit | destination encounter status |
|---:|---|---|---|
| 0 / samugiru | 1006,15,22 | 1000,98,44 / 98,45 | 1000：placeholder；沿 graph 首個 active floor = 100 |
| 1 / marinasu | 2006,20,16 | 2000,56,48 / 57,48 | 2000：active，Group 1018 |
| 2 / jaja | 3006,21,16 | 3000,90,60 | 3000（1 hop）；200（2 hop） |
| 3 / karutarna | 4006,14,20 | 4000,80,90 / 80,91 | 4000（1 hop）；200（2 hop） |

## 判定限制

這是 directed warp connectivity + encounter presence 的候選，不代表：

- 玩家從出生點一定可以步行到該 warp NPC。
- 該 encounter 一定是遊戲設計上的第一場戰鬥。
- 該路線一定是唯一正確的新手路線。

下一步需要把 map walkability、warp NPC 實際位置、encounter group、NPC service 與 event owner 疊合。

仍不建立 playable HTML。

## Destination closure checkpoint（2026-09-30）

data/generated/stoneage_start_destination_closure.json 已將 destination floor 分成三個獨立問題：

1. exact fixed-source map 是否存在並可驗證；
2. warp landing coordinate 是否 walkable；
3. destination floor 是否真的有 active encounter row。

目前只有 2000 三項中的前兩項已閉合；其兩個 landing points (56,48)、(57,48) 都 walkable，且都位於 active encounter rectangle (1,1)-(150,150)、Group 1018。3000 已確認 source encount.txt 存在 active Group 1015，但 fixed-source map blob 尚未在目前 source catalog 中閉合。1000 與 4000 的 direct destination 只有 placeholder row（probability 0、無 group），不能視為可掛機遇敵區。

缺少的 map source 不以其他版本或猜測資料替代。
