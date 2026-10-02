# 4000 Historical Source Snapshot Audit

更新日期：2026-10-02

## 目前結論

RO0000 的 4000 地圖不是「因為 object/NPC 擋路」而無法走到 200。固定來源與 RO0000 的 4000 map payload 完全一致；三格 `(91,109) / (92,109) / (93,109)` 的 blocker 來自 tile image walkability。

同時，已找到一份可追溯的外部歷史快照：SourceForge 的 **SA80 / 石器时代8.0数据规整**，資料時間為 2016-12-09～2016-12-10；其 GMSV map tree 明確包含：

`Updated-Linux-SA80/Linux-Main-app/gmsv/data/map/jyaruga/karutana/karutana`

SourceForge 該檔案頁目前仍提供檔案 metadata：

- 檔名：`karutana`
- 檔案大小：約 90.0 kB
- SourceForge SHA-256：`d9dc41590da32784cae7f8c782a8f2a26d9a883d63e844584c97ebd5cdbf03cf`
- 最後更新：2016-12-11

RO0000 現有 4000 binary：

- 路徑：`ro0000/server/merged-source/gmsv/data/map/jyaruga/karutana/karutana`
- bytes：90060
- Git blob SHA-1：`8c77546813fb7aa6e0c90c4d79cca36d7114491a`
- 本次計算 SHA-256：`088ed08eb6b47e4fa60adebf6ef66b4c6571b311cc83abd8e9360f63cc5aafb0`

因此：**歷史 SA80 檔案與目前 RO0000 4000 binary 並非同一份 byte sequence。**
目前尚未取得歷史檔案的原始 bytes，所以還不能判定差異究竟落在 header、tile layer、object layer，或特定座標。

## 已閉合的 4000 Blocker Evidence

RO0000 4000 與 fixed-C 4000 的 map payload：
- fixed-C：`gmsv/data/map/jyaruga/karutana/karutana`
- RO0000：`ro0000/server/merged-source/gmsv/data/map/jyaruga/karutana/karutana`

兩者在不同 header 格式後的：
- 150×150 tile layer：22500 cells，逐 byte 相同
- 150×150 object layer：22500 cells，逐 byte 相同

相關座標目前為：

| 座標 | tile | tile walkable | object | object walkable |
|---|---:|---|---:|---|
| (90,109) | 321 | yes | 0 | yes |
| (91,109) | 409 | no | 27 | yes |
| (92,109) | 196 | no | 27 | yes |
| (93,109) | 307 | no | 0 | yes |
| (94,109) | 156 | yes | 0 | yes |

4000 出生 component 48 與 4000→200 portal component 0 仍由這三格連續不可走 tile 分隔。

## Repair Experiment

V3.63 的虛擬 overlay 已證實：
- 僅把 `(91,109),(92,109),(93,109)` 臨時改成既有 walkable tile 321
- 不修改 canonical map
- 不修改 movement / warp semantics

兩個出生落點 `(80,90),(80,91)` 均可經正常 4-neighbor movement 抵達既有 4000→200 portal。

目前另外確認 tile 156 也能作為 connectivity-only 候選，而且 `(94,109),(95,109)` 本身就是 tile 156；但這仍不足以證明它是原作應有的美術 tile。

## Historical Snapshot Boundary

下一步仍以「取得 2016 SA80 的 `karutana` 原始 bytes」為唯一重要驗證。

在沒有取得 bytes 前：
1. 不把歷史 SA80 直接當成 RO0000 的修正版。
2. 不把三格改成 321 或 156 宣稱為 source-backed original art。
3. 不修改 canonical RO0000 map。
4. 修復若要落地，必須明確標記為 **RO0000 repair map / repair overlay**。

## 外部來源

SourceForge SA80 根目錄：
https://sourceforge.net/projects/sa80/files/Updated-Linux-SA80/

4000 map 檔案頁：
https://sourceforge.net/projects/sa80/files/Updated-Linux-SA80/Linux-Main-app/gmsv/data/map/jyaruga/karutana/karutana/download