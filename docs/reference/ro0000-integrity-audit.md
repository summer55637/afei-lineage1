# ro0000 Integrity Audit

## 目的

ro0000 是目前專案最重要的實機／部署資料 snapshot。這一輪先做「整理、檢測、檢查、測試」，不直接搬動或刪除原始檔案，避免破壞原始路徑、blob identity 與 provenance。

目前固定流程：

ro0000 raw snapshot
→ provenance / identity
→ integrity audit
→ semantic audit
→ runtime

## 目前檢測基準

2026-10-01 的 Git tree 檢測結果：

- ro0000：8,751 個檔案、185,169,695 bytes。
- endpoint source catalog 排除 ro0000/README.md 與 ro0000/SOURCE_PROVENANCE.md 後：8,749 個 corpus 檔案。
- 12 個 key artifacts 全部存在且非空。
- 手工外網 wwwroot：22 個檔案。
- VM 端 nested wwwroot：22 個檔案；兩邊 21 個 blob 完全相同、1 個同名檔案內容不同。
- gmsv/data：4,176 個檔案；hydata/data：4,119 個檔案；同相對路徑 3,839 個 blob 相同、222 個不同，另有 115 / 58 個各自獨有。
- 備份／編輯殘留樣式：54 個；另有 28 個 .arg1～.arg9 多段參數檔，兩者都不能直接當垃圾。
- 零長度檔案：30 個；零長度本身不代表損壞。

## 整理規則

### 不物理搬家

ro0000 是來源 snapshot，不是工作區。即使 gmsv/data 與 hydata/data 有大量相同 blob，也不能直接把其中一份搬走或刪掉。

### 歷史／編輯樣式先列管

.bak、.old、.new、~、.arg--、.create--- 等先視為待審資料。只有在確認不是 runtime source、不是另一個 endpoint variant、不是建置／工具輸入後，才考慮清理。

### endpoint variant 必須保留

目前 gmsv/data 與 hydata/data 有 222 個同相對路徑但 blob 不同的檔案。這批差異可能是部署版本差異，不能因為與另一份相同路徑內容不同就自動覆蓋。

### setup 缺檔先當 evidence gap

setup.cf 的 data/... 路徑檢查目前會區分 file、directory、missing。這一輪已把 5 個 missing dependency 做固定分類，正式記錄在：

- data/generated/stoneage_ro0000_dependency_triage.json

目前分類不是「缺檔就補」：

- appear.txt：runtime boot blocker candidate。固定 C 的 init.c 會在啟動時直接呼叫 CHAR_initAppearPosition(getAppearfile())，因此這個檔案要先完成來源重建，才能談 boot promotion。
- freepetskillshop.lua：feature hook gap candidate。固定 C 有 _CFREE_petskill 的 NPC 模組，但 pinned source tree 沒有同名 Lua 檔；不能自行補一份猜測版本。
- itemset3.txt / itemset4.txt / itemset5.txt：compile-time inactive under itemset6。固定 C 的 configfile.c 在 _ITEMSET6_TXT 路徑註冊 itemset6file，其他 itemset 設定屬不同 compile-time branch，因此目前不把它們視為 endpoint 損壞。


## 測試內容

新的 tools/check_ro0000_integrity.mjs 為 read-only audit，檢查：

- Git tree、blob、bytes 與既有 endpoint catalog 是否一致。
- key artifacts 是否完整且非空。
- gmsv/data 與 hydata/data mirror 統計。
- 手工 wwwroot 與 VM nested wwwroot 差異。
- backup-like / multipart argument / zero-size inventory。
- setup.cf data path 參考完整性。
- gmsvjt ELF magic。
- Android APK ZIP magic。
- 175sa.sql 基本 MySQL dump 結構。
- endpoint map 檔案的 LS2MAP / LS&MAP signature 分類；目前 1380 個是真正的 LS&MAP binary，另 1 個 map/aaa 被驗證為文字 metadata index，並與 hydata 具有相同 blob。
- encounter、group、enemy、enemybase、mapwarp 基本資料存在性統計。
- ro0000 dependency triage report 的 raw tree SHA、map/aaa blob SHA 與 5 個 setup missing classification 一致性。


它只會檢測與報告，不會修改 ro0000。

## 本輪 variant 語義探針

目前 222 個 data ↔ hydata 差異已經證明不能做全域覆蓋。針對高影響資料做第一輪內容級比對後：

- itemset6.csv：data 14,502 rows、hydata 14,508 rows；兩邊都沒有 exact numeric 32003，兩邊各有 1 個 24114。因此切換 data / hydata 並不能自行解掉 ITEM1=32003 的 starter item mismatch。
- enemy1.txt：data 只有 4 行與 hydata 不同、hydata 有 29 行只出現在自身；屬於實際 row membership variant。
- enemybase1.txt：兩邊都有同名資料但部分 row 的 graphic/base reference 不同，例如相同 2D creature rows 的 reference ID 不一致；不能只看檔案大小判斷。
- group1.txt：hydata 多 1 行，現階段沒有證據允許把它刪掉或視為錯誤。
- map/mapwarp.txt：存在座標級差異，例如對應 warp 出現 3000,78,91 與 3000,77,91 的不同來源列；這直接屬於 world connectivity evidence。
- petskill2.txt：skill 652 的 PowerBalance option 在兩個 variant 間不同（+58 與 +55），所以即使行數幾乎完全一致，仍存在 gameplay semantics 差異。
- skillcode.txt：兩端 mapping rows 也有差異。

因此下一階段採「按 runtime 影響逐檔閉合」：先處理 starter Item / mapwarp / encounter-battle / petskill，再回頭處理大量 NPC .arg variants；不建立全域 data-over-hydata 覆蓋規則。

## 本輪 fixed-C 參考

本輪 dependency triage 固定以：

gavinlinasd/StoneAge@1f90cb6cb57c1df70f39cde77a5a8ccd98b66c56

作為 engine semantics / loader / lifecycle baseline。參考檔案包含 gmsv/src/configfile.c、gmsv/src/init.c、gmsv/src/include/version.h、gmsv/src/npc/npc_freepetskillshop.c。這些只用來判定語義，不直接覆蓋 ro0000 endpoint 檔案。

## 安全注意

ro0000 原始 setup／教程包含 credential-like 設定與部署敏感資訊。這些內容作為 provenance snapshot 保留，但 canonical runtime、README、generated data、公開 UI 與一般文件不應重新散播其中的密碼、token 或內部連線資訊。

## CI

check-endpoint-completeness workflow 在 ro0000 變動時，現在會先執行：

node tools/check_ro0000_integrity.mjs

然後再執行原有 endpoint completeness check。舊 checker 的欄位漂移也已同步修正，避免拿舊 JSON schema 判錯目前 snapshot。

因此 ro0000 每次變更都會先通過「原始資料完整性」這一層，再進 semantic／runtime audit。

## 本輪 residue inventory

本輪把原本只有數量統計的 residue 改成逐檔、可回歸的 source inventory：

- `data/generated/stoneage_ro0000_residue_inventory.json`：固定記錄目前 ro0000 tree SHA、54 個 backup/edit-like 檔與 28 個 `.arg1–.arg9` 分段檔的 path / size / blob SHA。
- `tools/generate_ro0000_residue_inventory.mjs`：依 Git tree 重新產生相同 inventory；不讀工作區暫存狀態，也不修改 `ro0000/`。
- backup/edit-like 仍只標成「待 provenance review」，不自動刪除；`.arg1–.arg9` 單獨歸為 multipart argument fragment，先保留。
- inventory 也記錄 data ↔ hydata 同相對路徑的 counterpart 與 blob 是否相同，避免後續把 mirror / variant 當垃圾。

外部交叉資料也符合這個處理原則：公開 StoneAge server-pack 可見正式資料與 `.bak` 並存；公開服務端資料目錄也可見 `npc.arg1`～`npc.arg8` 這類分段檔。這些資料只能作為「副檔名具有歷史／參數檔慣例」的旁證，不能單憑外部慣例決定 ro0000 任一檔案的 runtime eligibility。

下一步可依 runtime 影響度逐檔閉合 residue；沒有新的 authoritative evidence 時，不進行物理刪除。

## 本輪孤立 residue 語義追查

目前 54 個 backup/edit-like residue 中有 10 個 blob SHA 沒有任何其他路徑副本。這 10 個不再統一視為垃圾，而是進入內容級 provenance 分層。

- `huoyue.lua.bak`：有正式 `huoyue.lua` 且 repository 有正式路徑引用，因此目前可證明是非 canonical 的歷史／編輯副本。
- `neweq.create---`（data / hydata）：兩端都有 `NPCCREATE`；data 變體的 NPC block 甚至被 `#` 包住，而 hydata 變體是 active-looking。兩邊都缺 formal `neweq.create`，並引用 `baoxiang.arg` / `baoshi.arg`，但目前只看到 `.arg--` residue，因此不能直接刪或升格。
- `LY.lua--`、`PetUp/petup1.lua~`、`YamaKing/YamaKing.lua~`、`battlebet.lua--`、`soccer.lua~`、`renwu.lua~`、`ridenpc2.lua~`：都具有實質 Lua 程式內容；其中 soccer 甚至有同目錄 `soccer.txt` companion，ridenpc2 則有正式 `ridenpc.lua` sibling。它們目前全部標成 `runtimeEligibility=unproven`，先保留。

這層證據已固定在 `data/generated/stoneage_ro0000_isolated_residue_audit.json`。未來只有找到新的 authoritative binding / version provenance / loader evidence，才把其中任一項改成 canonical runtime source。
