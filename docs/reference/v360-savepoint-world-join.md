# V3.60 Browser SavePoint World source join

更新日期：2026-09-30

V3.60 將 V3.59 已閉合的 SavePoint source transaction 與 pinned fixed-C World NPC index 做正式一對一 join。

## Join contract

固定 source `gavinlinasd/StoneAge@1f90cb6cb57c1df70f39cde77a5a8ccd98b66c56` 同時生成 `stoneage_world_npc_index-v1` 與 `stoneage-npc-savepoint-source-index-v1`；兩邊以 `NPC create path#blockIndex` 作 canonical key。

每筆 World SavePoint binding 必須閉合：
`create path#blockIndex → floor / bornCorner → npcgen_savepoint → SavePoint template → fileRef → arg → elder ID / Born / GetItem`。

固定 source 目前 28 個 SavePoint instances、26 個 unique floors，所有 28 筆都有 source binding。

## Data anomaly

`genout/sp_200_449_982` 保留 fixed-C 原始 `GetItem:...1991*&1992*1...`。空 count 依 fixed-C parser 的 `atoi("")` 語意形成 0-count requirement，因此該 OR branch 永遠不成立；catalog 記錄 anomaly，runtime 跳過不可成立 branch，不把 `1991*` 修補成 `1991*1`。

## Runtime boundary

這一輪沒有建立新的 SavePoint engine。V3.59 的 SavePoint GetItem transaction 繼續作為唯一 mutation layer；V3.60 只增加 production World source join 與 regression。

仍不建立多個 playable HTML，也不改動 GMQUE、changeevent、Starter Item 24114、4000→200、3000→200 non-walkable landing 政策。
