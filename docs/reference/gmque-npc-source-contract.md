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

## 2026-09-29 source verification

重要更正：pinned Gavin tree 的 `gmsv/data/npc/my` **不是空目錄**。完整 recursive tree 可見約 332 個項目，包含 `2d`、`tami`、`yucunpc`、`mowang` 等多個自訂 NPC 區。

本輪直接核驗了 `my/` 主要 `.arg` 與主要 `.create` 入口；已掃到的 128 個主要 `.arg`、`my/yucunpc`、`my/tami`、`my/huangquan`、`my/huodong51`、`my/mowang`、`my/mowang2`、`my/shenpan`、`my/sky`、`my/weilingbei` 等，均未發現 `GMACTION`、`RANDGMQUE`、`QUEPART0..3`。

對整個 pinned `gmsv/data/npc` 的檔名候選也已檢查；名稱含 `gm/que/quest/prize/reward/task/mission` 的候選共 17 個，實際內容沒有出現這組 GMQUE keys。故目前仍維持 `currentCandidateCount=0`。

另外找到一份完整的公開 GitHub 重建庫 `AthenaCN/StoneAge_Original`，其 `gmsv/data/npc` recursive tree 有 4125 個 NPC paths。與 fixed Gavin pin 的 `gmsv/data/npc` tree 逐 path / blob SHA 比較後，4125 個 paths 全部存在，實際不同的 file 只有 `gmsv/data/npc/doujyou/mkarg.c`；因此它在本題上屬於 Gavin NPC data 的近乎逐檔鏡像，而不是另一份可直接採用的 GMQUE data source。對該庫的 NPC content search 亦未取得 `GMACTION` / `RANDGMQUE` / `QUEPART0..3` 的有效 NPC argument。SourceForge 的 `SA80 / 石器时代8.0数据规整`（2016-12-09 註冊、2016-12-11 更新）之 `gmsv/data/npc/my` 只列出 `beike`、`ruieryasi`、`weilingbei` 三個目錄；其中 `my/ruieryasi` 有 49 個自訂檔案，例如 `24hboss.arg`、`gmother.arg`、`guardleader.arg`、`rui_shop.create`。這證明不同 8.x distribution 確實可能攜帶不同的 custom-NPC data package，但目前沒有直接證據顯示這批資料含 `RANDGMQUE/QUEPART0..3`。

交叉鏡像 `pimpcapital/longzoro-sa` 的 `gmsv/data/npc` 與 pinned Gavin tree 逐檔比較後，4125 個 NPC paths 全部一致、沒有 Gavin-only 或 longzoro-only NPC path，也沒有同一路徑不同 Blob SHA；因此它不是可用的另一份 GMQUE NPC data 來源。

另一個有價值的轉換來源是 `75912001/sa.desktop`：其 `map.entity.yaml` 會保存 legacy NPC 的原始 `.arg` 路徑、size、SHA-256 與 Base64 完整內容。已確認其中可恢復 `my/ruieryasi/*` 的歷史檔案內容；目前索引內沒有直接暴露 `RANDGMQUE` 的 Base64 命中，因此尚未得到 GMQUE live source。

`gavinlinasd/StoneAge` 的 data import 歷史也已確認：commit `e73db040323b6f831f76d56c030cdeb7055d1ad1`（2018-08-17）訊息為 `Added data files. However, the job will crash and core dump.`；其 parent `9a5a72d6a13e0fdaf9c8d29b5a93f87db890ddd0` 的訊息則說明 setup.cf 先加入、data/folder structures 後續再加入。這能固定 data import 的歷史邊界，但沒有提供 GMQUE 參數數值。

因此，**不能**把 SourceForge 的 `ruieryasi`、Gavin 的一般 `my/`、或任何其他 8.x 分發資料直接當成 GMQUE source；必須找到含 `RANDGMQUE` 與 `QUEPART0..3` 的原始 argument，並能釘定到相容 revision，才可升級。

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

目前 `sourceGmQueRewardPetTemplate()` 已改用 `data/generated/stoneage_gmque_reward_enemy_templates.json` 的 fixed-C Enemy template；1642 / 1636 / 475 已完成 source closure.
