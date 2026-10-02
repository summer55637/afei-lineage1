# Karutarna 4000→200 Product Route Repair Overlay

更新日期：2026-10-02

## Purpose and scope

這是阿肥產品層的明確地圖通行修復，不是原始地圖還原。它保留原始 fixed-C generated map，僅在 Browser Controller 載入 floor 4000 地圖副本時修改三格 tile，讓新手出生落點可沿既有道路抵達既有 4000→200 portal。

Overlay ID：karutarna-4000-road-access-v1

## Exact source guard

- Repository：gavinlinasd/StoneAge
- Ref：1f90cb6cb57c1df70f39cde77a5a8ccd98b66c56
- Map path：gmsv/data/map/jyaruga/karutana/karutana
- Blob SHA：1429c3717685b9fb05ff7f07979cc1ce967c3eea
- Dimensions：150×150

| 座標 | 原 tile | runtime tile | object |
|---|---:|---:|---:|
| (91,109) | 409 | 321 | 27 |
| (92,109) | 196 | 321 | 27 |
| (93,109) | 307 | 321 | 0 |

套用時會驗證 source identity、地圖尺寸、陣列長度、原 tile 與 object 前值；任一條件不符便拒絕。非 4000 地圖不受影響，原始 map object 不被原地修改。

## Route eligibility

Source catalog 仍記錄 4000→200 原本 source component 分離。產品 catalog 另記兩組既有 portal 可用於 overlay 修復。Browser planner 只有在該路線明確掛上此 repair ID、載入的 4000 runtime map 確實帶有 overlay marker，且實際 BFS 能抵達 portal 與 200 的 unconditional encounter region 時才會產生 route plan。

執行端仍逐格呼叫既有 movement runtime、既有 WarpPoint runtime，並逐步 commit save。沒有 synthetic warp，也沒有跳過座標驗證。將 worldMapRepairOverlay:null 傳入 Browser Controller 可停用修復；此時 4000→200 必須拒絕。

## Evidence and caveat

V3.63 virtual overlay 已證明把三格換成 tile 321 後，出生落點可連到既有 portal component。V3.64 tile-pattern audit 同時指出這些 tile 位於地形樣式結構中，因此 tile 321 不能被標示為原作正確素材。RO0000 endpoint 的 LS&MAP 也觀察到相同的 disconnected-route 問題，但該 endpoint map 是不同格式及不同 blob；這個產品 overlay 目前只套用於有 exact source guard 的 fixed-C runtime map。

## Regressions

- V3.78：兩組 4000→200 portal 皆能規劃；plan 確實穿越三格；關閉 overlay 時拒絕；canonical input map 未變。
- V3.79：執行 4000→200 逐格移動及既有 warp，最後抵達 floor 200 的 unconditional encounter boundary；關閉 overlay 時不改 state revision。
