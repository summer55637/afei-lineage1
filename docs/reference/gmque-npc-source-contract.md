# GMQUE NPC Argument Source Contract

本文件只定義目前 Web runtime 對 fixed C `GMQUE_InSertQue()` NPC argument 的解析契約；它不是實際活動資料。沒有找到真實 NPC argument 時，不產生預設任務、不自動開啟活動。

## Fixed source

## Source discovery contract

## External layout evidence

公開 8.0 生態的資料位置可交叉確認 NPC data 是獨立層：`alrightlook/stoneage-2` 的 `setup.cf` 指向 `npcdir=data/npc`；另一份 8.0 source archive 也列出 `gmsv/npc/npc_eventaction.c`。這些資料只能證明常見 layout，不能直接證明本專案缺失的 `RANDGMQUE / QUEPART0..3` 實際內容。

- GitHub layout reference: https://github.com/alrightlook/stoneage-2/blob/master/setup.cf
- 8.0 source archive listing: https://www.dssz.com/477838.html

目前實際活動參數仍未納入 playable data。下一輪 source closure 先固定搜尋下列 NPC data root：`data/npc`、`gmsv/data/npc`、`source/data/npc`、`vendor/data/npc`、`references/data/npc`、`reference/data/npc`。

`tools/check_v310_gmque_npc_source_locator.mjs` 只負責掃描候選檔是否同時出現 `RANDGMQUE` 與 `QUEPART0..3`，找到後標為 candidate；它不會因為找到字串就自動啟用活動。候選 source 必須再經 pinned source provenance 與內容 regression 才能把 `gmqueNpcArguments` 從 `pending-source` 升級。

- repository: `gavinlinasd/StoneAge`
- ref: `1f90cb6cb57c1df70f39cde77a5a8ccd98b66c56`
- path: `gmsv/src/npc/npc_eventaction.c`
- function: `GMQUE_InSertQue`

## Accepted argument grammar

`RANDGMQUE=4|QUEPART0=<option>,<option>|QUEPART1=<option>,...|QUEPART2=<option>,...|QUEPART3=<option>,...`

每個 `<option>` 的目前 adapter grammar 是 `petID=minLv-maxLv`。每個 `QUEPARTi` 先以 fixed inclusive `RAND(1, optionCount)` 選一個 option，再以 fixed inclusive `RAND(minLv, maxLv)` 決定 level，最後生成 `petID-LV`；四槽以 `&` 組成 task string。

目前 Web adapter 只接受 `RANDGMQUE=4`，原因是現有 GMQUE handover contract 固定要求四段 task；這不是宣稱 fixed C 其他數值不存在。

## Fail-closed boundaries

- 缺少 `RANDGMQUE` / `QUEPART0..3`：拒絕。
- duplicate key、空 option、格式錯誤：拒絕。
- RNG 回傳不在 fixed inclusive range：拒絕。
- `petID<=0`、level range 反向：拒絕。
- 沒有實際 NPC source argument 時，不注入任何預設活動任務。

## Runtime boundary

`sourceGmQueParseNpcArg()` 是 pure/source-adapter 層；它不修改 persistent state，也不建立寵物、刪寵或領獎。

目前 `sourceGmQueRewardPetTemplate()` 仍對 `1642 / 1636 / 475` fail-closed，直到 player-pet DB 有完整 `enemyIds` template mapping。
