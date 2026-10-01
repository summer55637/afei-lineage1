# GMQUE NPC Argument Source Contract

本文件定義目前 Web runtime 對 fixed-C `GMQUE_InSertQue()` NPC argument 的解析契約，以及 2026-10-01 後重新開放的 endpoint source discovery 邊界。

## Source role

- pinned fixed-C：負責 parser / RNG / lifecycle semantics。
- VM 一鍵端＋手工外網端：負責尋找實際部署版本的 `RANDGMQUE / QUEPART0..3` 配置。
- GitHub / Google：補充定位與交叉證據，不能單獨取代 endpoint 實機資料。

## Current endpoint status

活動已重新開案，但仍：

`status=reopened-for-source-reconstruction`

`runtimeEnabled=false`

`playable=false`

新的 endpoint corpus 是目前最高優先 source；找到候選檔後仍需 exact identity、provenance、content closure 與 regression 才能 admission。

## Accepted argument grammar

`RANDGMQUE=4|QUEPART0=<option>,<option>|QUEPART1=<option>,...|QUEPART2=<option>,...|QUEPART3=<option>,...`

每個 `<option>` 是 `petID=minLv-maxLv`。每個 `QUEPARTi` 先做 fixed inclusive `RAND(1, optionCount)`，再做 `RAND(minLv,maxLv)`。

## Fail-closed boundaries

- 缺少 `RANDGMQUE / QUEPART0..3`：拒絕。
- duplicate key、空 option、格式錯誤：拒絕。
- RNG 不在 fixed inclusive range：拒絕。
- petID<=0、level range 反向：拒絕。
- 沒有實際 endpoint NPC argument 時，不注入預設活動任務。

## Runtime boundary

`sourceGmQueParseNpcArg()`、`sourceGmQueMatchPetToTask()`、`sourceGmQueHandoverCheck()` 都仍是 pure/source-adapter scope，不直接修改 persistent state。

Reward pet template 必須另外閉合；重開活動不代表 `1642 / 1636 / 475` 已可直接建立。